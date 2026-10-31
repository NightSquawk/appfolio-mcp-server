import { z } from "zod";
import { ToolDefinition } from "@nightsquawktech/mcp-core/catalog";
import { loadEndpointSpec, loadDbIndex, isMultipartEndpoint } from "../catalog-db/endpoint-spec.js";
import { appfolioDbClient } from "../clients/appfolio-db-client.js";
import { FileUploadError, PreparedUpload, prepareUpload } from "../helpers/file-upload.js";

const schema = z.object({
  operation_id: z
    .string()
    .describe("The endpoint operationId to call, e.g. 'get_tenants' or 'post_bills'. See list_endpoints / describe_endpoint."),
  path_params: z
    .record(z.any())
    .optional()
    .describe("Values for {param} placeholders in the path, e.g. { billId: '1abc...' } for /bills/{billId}."),
  filters: z
    .record(z.any())
    .optional()
    .describe(
      "GET filter params keyed by filter name (the 'filters[...]' wrapper is added automatically), " +
      "e.g. { LastUpdatedAtFrom: '2020-01-01T00:00:00Z', Id: 'uuid,uuid' }. Arrays are comma-joined."
    ),
  query: z
    .record(z.any())
    .optional()
    .describe("Additional raw query params (rare; most filtering goes through `filters`)."),
  body: z
    .any()
    .optional()
    .describe(
      "JSON request body for write operations (POST/PATCH/PUT). See describe_endpoint for the schema. " +
      "For file-upload endpoints this holds only the extra form fields (e.g. { Position: 1 }); the file goes in `file`."
    ),
  file: z
    .object({
      path: z.string().describe("Absolute path of the local file to upload, e.g. 'C:/scans/invoice.jpg' or '/home/me/invoice.jpg'."),
      filename: z.string().optional().describe("Filename to send to AppFolio. Defaults to the path's basename."),
      content_type: z
        .string()
        .optional()
        .describe("MIME type, e.g. 'image/jpeg'. Defaults to a guess from the file extension."),
    })
    .optional()
    .describe(
      "Local file to upload. Required for the file-upload endpoints (POST .../attachments and .../photos, whose " +
      "describe_endpoint requestBody.contentType is 'multipart/form-data'); not accepted by any other endpoint. " +
      "The file's bytes are sent as the multipart 'File' part."
    ),
  page: z
    .object({ number: z.number().optional(), size: z.number().optional() })
    .optional()
    .describe("Pagination for GET list endpoints: { number, size }. Default size is 1000."),
  paginate_results: z
    .boolean()
    .optional()
    .describe("GET only. Default true: follow next_page_path and aggregate all rows. Set false for a single page."),
});

function errorText(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

/**
 * Executes an AppFolio Database API request after validating against the catalog
 * spec: the endpoint must exist and all required path params must be present.
 * Query filters are advisory (the reference rarely enumerates them all), so
 * unknown filters are NOT rejected. Read and write operations both execute
 * (no write gate, per configuration).
 */
export const callEndpointTool: ToolDefinition<typeof schema> = {
  name: "call_endpoint",
  description:
    "Call an AppFolio Database API endpoint and return its JSON response. Validates the " +
    "operationId and required path params against the catalog before calling AppFolio, then " +
    "executes (GET reads are auto-paginated; POST/PATCH/PUT/DELETE writes execute live against " +
    "your AppFolio database). Use describe_endpoint first to learn the exact params and body. " +
    "Attachment/photo endpoints upload a local file: pass file: { path } (sent as multipart/form-data).",
  schema,
  handler: async ({ params }: any) => {
    const operationId: string = params?.operation_id;
    const spec = loadEndpointSpec(operationId);

    if (!spec) {
      const known = loadDbIndex().endpoints.map((e) => e.operationId);
      const suggestions = known
        .filter((id) => operationId && (id.includes(operationId) || operationId.includes(id)))
        .slice(0, 5);
      return errorText(
        `Unknown endpoint "${operationId}". ` +
          (suggestions.length ? `Did you mean: ${suggestions.join(", ")}? ` : "") +
          `Call list_endpoints to see all ${known.length} endpoints.`
      );
    }

    // Enforce required path params (hard — the URL can't be built without them).
    const required = (spec.pathParams ?? []).filter((p) => p.required !== false);
    const provided = params?.path_params ?? {};
    const missing = required.filter((p) => {
      const v = provided[p.name];
      return v === undefined || v === null || (typeof v === "string" && v.trim() === "");
    });
    if (missing.length > 0) {
      return errorText(
        `Missing required path parameter(s) for "${spec.operationId}" (${spec.method} ${spec.path}): ` +
          `${missing.map((p) => p.name).join(", ")}. Call describe_endpoint("${spec.operationId}") for details.`
      );
    }

    // Guard: a write body was supplied to a GET (likely a mistake).
    if (spec.method === "GET" && params?.body !== undefined) {
      return errorText(
        `"${spec.operationId}" is a GET endpoint and does not accept a body. ` +
          `Use "filters" for query criteria.`
      );
    }

    // File uploads: multipart endpoints take a local file; every other endpoint
    // keeps sending JSON exactly as before.
    const multipart = isMultipartEndpoint(spec);
    const fileField = spec.requestBody?.fileField ?? "File";
    if (params?.file !== undefined && !multipart) {
      return errorText(
        `"${spec.operationId}" does not accept file uploads (its body is JSON). Remove "file", or use an ` +
          `attachments/photos endpoint (list_endpoints, then describe_endpoint shows contentType "multipart/form-data").`
      );
    }

    let upload: PreparedUpload | undefined;
    let formFields: Record<string, unknown> | undefined;
    if (multipart) {
      const body = params?.body;
      if (body !== undefined && body !== null && (typeof body !== "object" || Array.isArray(body))) {
        return errorText(
          `"${spec.operationId}" is a file upload: "body" may only hold extra form fields as an object (e.g. { Position: 1 }).`
        );
      }
      if (body && fileField in body) {
        return errorText(
          `"${spec.operationId}" is a file upload: do not pass "${fileField}" inside "body" (a path string there is sent ` +
            `as text, which AppFolio rejects with 422). Pass the local file as file: { path: "<absolute path>" } instead.`
        );
      }
      if (params?.file === undefined) {
        return errorText(
          `"${spec.operationId}" uploads a file and requires the "file" argument, e.g. ` +
            `file: { path: "C:/scans/invoice.jpg" }. Call describe_endpoint("${spec.operationId}") for details.`
        );
      }
      try {
        // Validates and reads the file before anything is sent to AppFolio.
        upload = await prepareUpload(params.file);
      } catch (error) {
        if (error instanceof FileUploadError) {
          return errorText(`Cannot upload for ${spec.operationId}: ${error.message} Nothing was sent to AppFolio.`);
        }
        throw error;
      }
      formFields = body ?? undefined;
    }

    const response = await appfolioDbClient.request(spec.method, spec.path, {
      pathParams: provided,
      filters: params?.filters,
      query: params?.query,
      ...(upload
        ? { multipart: { fileField, file: upload, fields: formFields } }
        : { body: params?.body }),
      page: params?.page,
      paginate: params?.paginate_results,
    });

    if (response.isError) {
      return errorText(`Error calling ${spec.operationId} (${spec.method} ${spec.path}): ${response.error}`);
    }

    const result = response.result;
    const rowCount =
      result && typeof result === "object" && Array.isArray(result.data)
        ? result.data.length
        : undefined;

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            operation_id: spec.operationId,
            method: spec.method,
            path: spec.path,
            ...(rowCount !== undefined ? { rowCount } : {}),
            ...(upload
              ? { uploaded: { field: fileField, filename: upload.filename, contentType: upload.contentType, bytes: upload.bytes.byteLength } }
              : {}),
            result,
          }),
        },
      ],
    };
  },
};
