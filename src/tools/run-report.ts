import { z } from "zod";
import { ToolDefinition } from "@nightsquawktech/mcp-core/catalog";
import { loadReportSpec, loadIndex, universalParameters } from "../catalog/report-spec.js";
import { appfolioClient } from "../clients/appfolio-client.js";

const schema = z.object({
  report_name: z
    .string()
    .describe("The report slug to run, e.g. 'balance_sheet'. See list_reports / describe_report."),
  filters: z
    .record(z.any())
    .optional()
    .describe(
      "Report-specific filters as a JSON object keyed by the parameter names from " +
      "describe_report (e.g. { posted_on_to: '2024-12-31', properties: { properties_ids: ['123'] } }). " +
      "Required filters must be included or the request is rejected."
    ),
  columns: z
    .array(z.string())
    .optional()
    .describe("Optional subset of response columns to return. All columns are returned by default."),
  paginate_results: z
    .boolean()
    .optional()
    .describe("Default true (5,000 rows/page, auto-followed). Set false to return all rows as one array."),
  page: z.number().optional().describe("Pagination page (advanced; usually handled automatically)."),
  limit: z.number().optional().describe("Rows per page (advanced)."),
});

function errorText(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

/**
 * Executes an AppFolio report after validating the request against the catalog
 * spec: the report must exist, all required filters must be present, and every
 * supplied parameter must be a known filter for that report (or a universal
 * pagination param). Enum values are advisory (see describe_report) and not hard
 * enforced, to avoid rejecting valid inputs over doc-formatting quirks.
 */
export const runReportTool: ToolDefinition<typeof schema> = {
  name: "run_report",
  description:
    "Run an AppFolio report and return its rows. Validates the report name, required " +
    "filters, and parameter names against the report catalog before calling AppFolio. " +
    "Use describe_report first to learn the exact filter keys for the report.",
  schema,
  handler: async ({ params }: any) => {
    const reportName: string = params?.report_name;
    const spec = loadReportSpec(reportName);

    if (!spec) {
      const known = loadIndex().reports.map((r) => r.slug);
      const suggestions = known
        .filter((s) => reportName && (s.includes(reportName) || reportName.includes(s)))
        .slice(0, 5);
      return errorText(
        `Unknown report "${reportName}". ` +
          (suggestions.length ? `Did you mean: ${suggestions.join(", ")}? ` : "") +
          `Call list_reports to see all ${known.length} reports.`
      );
    }

    // Assemble the request body from filters + pagination/column args.
    const body: Record<string, any> = { ...(params?.filters ?? {}) };
    if (params?.columns !== undefined) body.columns = params.columns;
    if (params?.paginate_results !== undefined) body.paginate_results = params.paginate_results;
    if (params?.page !== undefined) body.page = params.page;
    if (params?.limit !== undefined) body.limit = params.limit;

    // Reject unknown parameters early with a helpful list.
    const allowed = new Set<string>([
      ...spec.parameters.map((p) => p.name),
      ...universalParameters(),
    ]);
    const unknown = Object.keys(body).filter((k) => !allowed.has(k));
    if (unknown.length > 0) {
      return errorText(
        `Unknown parameter(s) for "${spec.slug}": ${unknown.join(", ")}. ` +
          `Valid filters: ${spec.parameters.map((p) => p.name).join(", ")}. ` +
          `Plus universal: ${universalParameters().join(", ")}. ` +
          `Call describe_report("${spec.slug}") for details.`
      );
    }

    // Enforce required filters.
    const missing = spec.requiredFilters.filter((rf) => {
      const v = body[rf];
      return v === undefined || v === null || (typeof v === "string" && v.trim() === "");
    });
    if (missing.length > 0) {
      return errorText(
        `Missing required filter(s) for "${spec.slug}": ${missing.join(", ")}. ` +
          `Call describe_report("${spec.slug}") to see their expected format.`
      );
    }

    // The client appends ".json" to the slug.
    const response = await appfolioClient.runReport(spec.slug, body);

    if (response.isError) {
      return errorText(`Error running ${spec.slug}: ${response.error}`);
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            report_name: spec.slug,
            rowCount: Array.isArray(response.result) ? response.result.length : 0,
            results: response.result,
          }),
        },
      ],
    };
  },
};
