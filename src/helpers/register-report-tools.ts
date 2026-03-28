import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RegisterTool } from "./register-tool.js";
import { createReportTool } from "./report-handler-factory.js";
import { REPORT_CONFIGS } from "./report-configs.js";

/**
 * Known AppFolio Reporting API v2 endpoint names.
 * Used for boot-time validation to catch config typos at startup.
 */
const KNOWN_ENDPOINTS = new Set([
  // Financial
  "aged_payables",
  "aged_receivables",
  "balance_sheet",
  "budget_comparison",
  "budget_forecast",
  "cash_flow",
  "chart_of_accounts",
  "expense_distribution",
  "fixed_assets",
  "income_statement_12_month",
  "income_statement_date_range",
  "loans",
  "trial_balance",
  // Registers
  "check_register",
  "deposit_register",
  "expense_register",
  "income_register",
  // Leasing
  "guest_card_inquiries",
  "leasing_funnel_performance",
  "leasing_summary",
  "rental_applications",
  "rent_roll_itemized",
  "renewal_summary",
  "screening_assessments",
  "lease_expirations",
  // Property & Unit
  "occupancy_summary",
  "property_directory",
  "property_group_directory",
  "property_performance",
  "property_source_tracking",
  "unit_directory",
  "unit_vacancy_detail",
  // Tenant & Owner
  "delinquency",
  "owner_directory",
  "owner_leasing",
  "owner_statement",
  "receivables_activity",
  "resident_financial_activity",
  "security_deposit_funds_detail",
  "tenant_directory",
  "tenant_ledger",
  // Maintenance & Workflow
  "work_order",
  "work_order_labor_summary",
  "completed_processes",
  "in_progress_processes",
  "cancelled_processes",
  // Other
  "account_totals",
  "property_account_totals",
]);

/**
 * Registers all AppFolio report tools with the MCP server.
 * Validates each config's endpoint at boot time to catch typos early.
 */
export function registerAllReportTools(server: McpServer): void {
  for (const config of REPORT_CONFIGS) {
    if (!KNOWN_ENDPOINTS.has(config.endpoint)) {
      throw new Error(
        `Invalid report config: endpoint "${config.endpoint}" for tool "${config.toolName}" ` +
        `is not a known AppFolio report endpoint.`
      );
    }
    RegisterTool(server, createReportTool(config));
  }
}
