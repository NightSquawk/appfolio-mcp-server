import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RegisterTool } from "@nightsquawktech/mcp-core/catalog";
import { listEndpointsTool } from "../tools/list-endpoints.js";
import { describeEndpointTool } from "../tools/describe-endpoint.js";
import { callEndpointTool } from "../tools/call-endpoint.js";
import { loadDbIndex } from "../catalog-db/endpoint-spec.js";

/**
 * Registers the consolidated AppFolio Database API (v0) tools with the MCP server.
 *
 * Like the Reporting API tools, we expose three catalog-backed tools instead of
 * one tool per endpoint (~156 tools = heavy context cost and poor tool selection):
 *   - list_endpoints      discover endpoints by category / resource / method
 *   - describe_endpoint   full parameter + body spec for one endpoint
 *   - call_endpoint       validate against the catalog spec, then execute
 *
 * Boot-time sanity check: the catalog index must load and be non-empty, so a
 * missing/uncopied catalog fails fast at startup rather than on first tool call.
 */
export function registerAllDbTools(server: McpServer): void {
  const index = loadDbIndex();
  if (!index.endpoints || index.endpoints.length === 0) {
    throw new Error(
      "Database API catalog is empty or missing — expected src/catalog-db/index.json with endpoints. " +
        "Did the build copy the catalog into dist/? Run `node scripts/assemble-catalog-db.mjs` to regenerate it."
    );
  }

  RegisterTool(server, listEndpointsTool);
  RegisterTool(server, describeEndpointTool);
  RegisterTool(server, callEndpointTool);
}
