import { z } from "zod";
import { ToolDefinition } from "@nightsquawktech/mcp-core/catalog";
import { loadEndpointSpec, loadDbIndex } from "../catalog-db/endpoint-spec.js";
import { appfolioDbClient } from "../clients/appfolio-db-client.js";

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
    .describe("JSON request body for write operations (POST/PATCH/PUT). See describe_endpoint for the schema."),
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
    "your AppFolio database). Use describe_endpoint first to learn the exact params and body.",
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

    const response = await appfolioDbClient.request(spec.method, spec.path, {
      pathParams: provided,
      filters: params?.filters,
      query: params?.query,
      body: params?.body,
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
            result,
          }),
        },
      ],
    };
  },
};
