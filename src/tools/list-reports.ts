import { z } from "zod";
import { ToolDefinition } from "@nightsquawktech/mcp-core/catalog";
import { loadIndex } from "../catalog/report-spec.js";

const schema = z.object({
  category: z
    .string()
    .optional()
    .describe(
      "Optional category filter (e.g. 'Financial', 'Leasing', 'Tenant'). " +
      "Omit to list every report. Call without args first to see all categories."
    ),
});

/**
 * Lists available AppFolio reports from the catalog. Lightweight discovery tool:
 * returns slug, name, category, and required filters per report so the model can
 * pick one, then call describe_report for its full parameter spec.
 */
export const listReportsTool: ToolDefinition<typeof schema> = {
  name: "list_reports",
  description:
    "List the available AppFolio reports (slug, name, category, required filters). " +
    "Optionally filter by category. Use this to discover which report to run, then " +
    "call describe_report for its parameters and run_report to execute it.",
  schema,
  handler: async ({ params }: any) => {
    const index = loadIndex();
    const category: string | undefined = params?.category;

    let reports = index.reports;
    if (category) {
      const wanted = category.toLowerCase();
      reports = reports.filter((r) => r.category.toLowerCase() === wanted);
    }

    const categories = [...new Set(index.reports.map((r) => r.category))].sort();

    const payload = {
      reportCount: reports.length,
      totalReports: index.reportCount,
      categories,
      universalParameters: index.universalParameters,
      reports: reports.map((r) => ({
        report_name: r.slug,
        name: r.name,
        category: r.category,
        description: r.description,
        requiredFilters: r.requiredFilters,
      })),
    };

    if (category && reports.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text:
              `No reports found in category "${category}". ` +
              `Available categories: ${categories.join(", ")}.`,
          },
        ],
      };
    }

    return {
      content: [{ type: "text" as const, text: JSON.stringify(payload) }],
    };
  },
};
