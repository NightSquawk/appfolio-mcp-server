import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RegisterTool } from "@nightsquawktech/mcp-core/catalog";
import { listReportsTool } from "../tools/list-reports.js";
import { describeReportTool } from "../tools/describe-report.js";
import { runReportTool } from "../tools/run-report.js";
import { loadIndex } from "../catalog/report-spec.js";

/**
 * Registers the consolidated AppFolio report tools with the MCP server.
 *
 * Instead of one tool per endpoint (~137 tools = heavy context cost and poor
 * tool selection), we expose three tools backed by the report catalog:
 *   - list_reports      discover reports by category
 *   - describe_report   full parameter spec for one report
 *   - run_report        validate against the catalog spec, then execute
 *
 * Boot-time sanity check: the catalog index must load and be non-empty, so a
 * missing/uncopied catalog fails fast at startup rather than on first tool call.
 */
export function registerAllReportTools(server: McpServer): void {
  const index = loadIndex();
  if (!index.reports || index.reports.length === 0) {
    throw new Error(
      "Report catalog is empty or missing — expected src/catalog/index.json with reports. " +
      "Did the build copy the catalog into dist/?"
    );
  }

  RegisterTool(server, listReportsTool);
  RegisterTool(server, describeReportTool);
  RegisterTool(server, runReportTool);
}
