import { z } from "zod";
import { ToolDefinition } from "@nightsquawktech/mcp-core/catalog";
import { loadEndpointSpec, loadDbIndex } from "../catalog-db/endpoint-spec.js";

const schema = z.object({
  operation_id: z
    .string()
    .describe("The endpoint operationId, e.g. 'get_tenants' or 'post_bills'. See list_endpoints."),
});

/**
 * Returns the full spec for one Database API endpoint: HTTP method, path, path
 * params, query filters (for GET), the request body schema with nested
 * attributes (for writes), response fields, and a request sample. The model
 * calls this just before call_endpoint so it sends the exact parameters expected.
 */
export const describeEndpointTool: ToolDefinition<typeof schema> = {
  name: "describe_endpoint",
  description:
    "Get the full specification for a single AppFolio Database API endpoint: HTTP method, " +
    "path and path params, query filters (GET), request body schema with nested attributes " +
    "(writes), response fields, and a request sample. Call this before call_endpoint to know " +
    "exactly which parameters to pass.",
  schema,
  handler: async ({ params }: any) => {
    const operationId: string = params?.operation_id;
    const spec = loadEndpointSpec(operationId);

    if (!spec) {
      const known = loadDbIndex().endpoints.map((e) => e.operationId);
      const suggestions = known
        .filter((id) => operationId && (id.includes(operationId) || operationId.includes(id)))
        .slice(0, 5);
      return {
        content: [
          {
            type: "text" as const,
            text:
              `Unknown endpoint "${operationId}". ` +
              (suggestions.length ? `Did you mean: ${suggestions.join(", ")}? ` : "") +
              `Call list_endpoints to see all ${known.length} endpoints.`,
          },
        ],
      };
    }

    const payload = {
      operation_id: spec.operationId,
      name: spec.name,
      method: spec.method,
      path: spec.path,
      description: spec.description,
      writeOperation: spec.writeOperation,
      pagination: !!spec.pagination,
      ...(spec.deprecated ? { deprecated: true } : {}),
      pathParams: spec.pathParams ?? [],
      queryFilters: spec.queryFilters ?? [],
      ...(spec.requestBody ? { requestBody: spec.requestBody } : {}),
      responseFields: spec.responseFields ?? [],
      paginationParams: spec.pagination ? loadDbIndex().paginationParams : [],
      requestSample: spec.requestSample,
      note:
        "Query filters are advisory — AppFolio's reference often does not enumerate every " +
        "filter, so call_endpoint does not reject unknown filters. Most GET list endpoints " +
        "require at least a filters[Id] or filters[LastUpdatedAtFrom] value.",
    };

    return {
      content: [{ type: "text" as const, text: JSON.stringify(payload) }],
    };
  },
};
