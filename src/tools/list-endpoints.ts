import { z } from "zod";
import { ToolDefinition } from "@nightsquawktech/mcp-core/catalog";
import { loadDbIndex } from "../catalog-db/endpoint-spec.js";

const schema = z.object({
  category: z
    .string()
    .optional()
    .describe(
      "Optional category filter (e.g. 'Accounting', 'Leasing', 'People', 'Properties', " +
      "'Maintenance', 'Community Associations', 'Corporate Accounting', 'Custom Fields', 'System'). " +
      "Call without args first to see all categories."
    ),
  resource: z
    .string()
    .optional()
    .describe("Optional resource filter (e.g. 'bills', 'tenants', 'work_orders')."),
  method: z
    .string()
    .optional()
    .describe("Optional HTTP method filter: GET, POST, PATCH, PUT, or DELETE."),
  reads_only: z
    .boolean()
    .optional()
    .describe("If true, return only read (GET) endpoints."),
});

/**
 * Lists available AppFolio Database API (v0) endpoints from the catalog.
 * Lightweight discovery tool: returns operationId, method, path, category, and a
 * one-line description per endpoint so the model can pick one, then call
 * describe_endpoint for its full parameter spec.
 */
export const listEndpointsTool: ToolDefinition<typeof schema> = {
  name: "list_endpoints",
  description:
    "List the available AppFolio Database API endpoints (operationId, method, path, " +
    "category, description). Optionally filter by category, resource, method, or reads-only. " +
    "Use this to discover which endpoint to use, then call describe_endpoint for its parameters " +
    "and call_endpoint to execute it. This is the AppFolio v0 Database API (records/CRUD), " +
    "distinct from the Reporting API (list_reports/run_report).",
  schema,
  handler: async ({ params }: any) => {
    const index = loadDbIndex();
    const category: string | undefined = params?.category;
    const resource: string | undefined = params?.resource;
    const method: string | undefined = params?.method?.toUpperCase();
    const readsOnly: boolean | undefined = params?.reads_only;

    let endpoints = index.endpoints;
    if (category) {
      const wanted = category.toLowerCase();
      endpoints = endpoints.filter((e) => e.category.toLowerCase() === wanted);
    }
    if (resource) {
      const wanted = resource.toLowerCase();
      endpoints = endpoints.filter((e) => e.resource.toLowerCase() === wanted);
    }
    if (method) endpoints = endpoints.filter((e) => e.method === method);
    if (readsOnly) endpoints = endpoints.filter((e) => !e.writeOperation);

    const categories = [...new Set(index.endpoints.map((e) => e.category))].sort();

    if ((category || resource || method) && endpoints.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text:
              `No endpoints matched your filters. ` +
              `Available categories: ${categories.join(", ")}.`,
          },
        ],
      };
    }

    const payload = {
      endpointCount: endpoints.length,
      totalEndpoints: index.endpointCount,
      baseUrl: index.baseUrl,
      categories,
      paginationParams: index.paginationParams,
      endpoints: endpoints.map((e) => ({
        operation_id: e.operationId,
        method: e.method,
        path: e.path,
        name: e.name,
        category: e.category,
        resource: e.resource,
        description: e.description,
        writeOperation: e.writeOperation,
        ...(e.deprecated ? { deprecated: true } : {}),
      })),
    };

    return {
      content: [{ type: "text" as const, text: JSON.stringify(payload) }],
    };
  },
};
