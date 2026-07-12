import { z } from "zod";
import { ToolDefinition } from "@nightsquawktech/mcp-core/catalog";
import { loadReportSpec, loadIndex, universalParameters } from "../catalog/report-spec.js";

const schema = z.object({
  report_name: z
    .string()
    .describe("The report slug, e.g. 'balance_sheet' or 'rent_roll'. See list_reports."),
});

/**
 * Returns the full parameter spec for one report: every filter with its type,
 * whether it's required, allowed enum values, defaults, nested object attributes,
 * the response columns, and a request sample. The model calls this just before
 * run_report so it sends the exact parameter keys this report expects.
 */
export const describeReportTool: ToolDefinition<typeof schema> = {
  name: "describe_report",
  description:
    "Get the full parameter specification for a single AppFolio report: required and " +
    "optional filters, types, enums, defaults, nested attributes, and response columns. " +
    "Call this before run_report to know exactly which parameters to pass.",
  schema,
  handler: async ({ params }: any) => {
    const reportName: string = params?.report_name;
    const spec = loadReportSpec(reportName);

    if (!spec) {
      const known = loadIndex().reports.map((r) => r.slug);
      const suggestions = known
        .filter((s) => reportName && (s.includes(reportName) || reportName.includes(s)))
        .slice(0, 5);
      return {
        content: [
          {
            type: "text" as const,
            text:
              `Unknown report "${reportName}". ` +
              (suggestions.length
                ? `Did you mean: ${suggestions.join(", ")}? `
                : "") +
              `Call list_reports to see all ${known.length} reports.`,
          },
        ],
      };
    }

    const payload = {
      report_name: spec.slug,
      name: spec.name,
      description: spec.description,
      requiredFilters: spec.requiredFilters,
      parameters: spec.parameters,
      universalParameters: universalParameters(),
      responseColumns: spec.responseColumns,
      requestSample: spec.requestSample,
    };

    return {
      content: [{ type: "text" as const, text: JSON.stringify(payload) }],
    };
  },
};
