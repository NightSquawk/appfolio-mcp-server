import { z } from "zod";

/**
 * Composable Zod schema fragments for AppFolio Reporting API v2 parameters.
 * Each group can be merged into a per-report schema via z.object({}).merge().
 *
 * Parameter names match the AppFolio API request body keys.
 */

// ── Date Range (most financial/register reports) ────────────────────────────

export const dateRangeSchema = z.object({
  from_date: z
    .string()
    .optional()
    .describe("Start date in YYYY-MM-DD format."),
  to_date: z
    .string()
    .optional()
    .describe("End date in YYYY-MM-DD format."),
});

// ── As-of Date (aging, balance sheet, rent roll, etc.) ──────────────────────

export const asOfDateSchema = z.object({
  as_of_date: z
    .string()
    .optional()
    .describe("As-of date in YYYY-MM-DD format."),
});

// ── Property Filtering (most reports) ───────────────────────────────────────

export const propertyFilterSchema = z.object({
  property_ids: z
    .array(z.string())
    .optional()
    .describe("Filter by one or more property IDs."),
  property_group_ids: z
    .array(z.string())
    .optional()
    .describe("Filter by one or more property group IDs."),
});

// ── Owner Filtering ─────────────────────────────────────────────────────────

export const ownerFilterSchema = z.object({
  owner_ids: z
    .array(z.string())
    .optional()
    .describe("Filter by one or more owner IDs."),
});

// ── Accounting Method ───────────────────────────────────────────────────────

export const accountingMethodSchema = z.object({
  accounting_method: z
    .enum(["cash", "accrual"])
    .optional()
    .describe("Accounting method: cash or accrual."),
});

// ── Pagination Control ──────────────────────────────────────────────────────

export const paginationSchema = z.object({
  paginate_results: z
    .boolean()
    .optional()
    .describe(
      "Enable pagination (default true, up to 5,000 rows per page). " +
      "Set to false to retrieve all data at once (may timeout on large datasets)."
    ),
});
