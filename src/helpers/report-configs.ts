import { ReportConfig } from "../types/report-config.js";
import {
  dateRangeSchema,
  asOfDateSchema,
  propertyFilterSchema,
  ownerFilterSchema,
  accountingMethodSchema,
  paginationSchema,
} from "./report-schemas.js";

/**
 * All AppFolio Reporting API v2 report configurations.
 * Single source of truth for tool names, descriptions, endpoints, and schemas.
 *
 * Schema composition follows the AppFolio API docs — each report gets only
 * the parameter groups it actually supports.
 */
export const REPORT_CONFIGS: ReportConfig[] = [
  // ── Financial ─────────────────────────────────────────────────────────────

  {
    toolName: "report_aged_payables",
    description:
      "Run an Aged Payables report from AppFolio showing outstanding vendor balances grouped by aging period.",
    endpoint: "aged_payables",
    schema: asOfDateSchema
      .merge(propertyFilterSchema)
      .merge(paginationSchema),
  },
  {
    toolName: "report_aged_receivables",
    description:
      "Run an Aged Receivables report from AppFolio showing outstanding tenant balances grouped by aging period.",
    endpoint: "aged_receivables",
    schema: asOfDateSchema
      .merge(propertyFilterSchema)
      .merge(paginationSchema),
  },
  {
    toolName: "report_balance_sheet",
    description:
      "Run a Balance Sheet report from AppFolio showing assets, liabilities, and equity. " +
      "Requires property_ids filter.",
    endpoint: "balance_sheet",
    schema: asOfDateSchema
      .merge(propertyFilterSchema)
      .merge(accountingMethodSchema)
      .merge(paginationSchema),
  },
  {
    toolName: "report_budget_comparison",
    description:
      "Run a Budget Comparison report from AppFolio comparing actual vs budgeted amounts.",
    endpoint: "budget_comparison",
    schema: dateRangeSchema
      .merge(propertyFilterSchema)
      .merge(accountingMethodSchema)
      .merge(paginationSchema),
  },
  {
    toolName: "report_budget_forecast",
    description:
      "Run a Budget Forecast report from AppFolio showing projected income and expenses.",
    endpoint: "budget_forecast",
    schema: dateRangeSchema
      .merge(propertyFilterSchema)
      .merge(paginationSchema),
  },
  {
    toolName: "report_cash_flow",
    description:
      "Run a Cash Flow report from AppFolio showing cash inflows and outflows over a period.",
    endpoint: "cash_flow",
    schema: dateRangeSchema
      .merge(propertyFilterSchema)
      .merge(accountingMethodSchema)
      .merge(paginationSchema),
  },
  {
    toolName: "report_chart_of_accounts",
    description:
      "Run a Chart of Accounts report from AppFolio listing all GL accounts and their details.",
    endpoint: "chart_of_accounts",
    schema: paginationSchema,
  },
  {
    toolName: "report_expense_distribution",
    description:
      "Run an Expense Distribution report from AppFolio showing expense allocation across properties.",
    endpoint: "expense_distribution",
    schema: dateRangeSchema
      .merge(propertyFilterSchema)
      .merge(paginationSchema),
  },
  {
    toolName: "report_fixed_assets",
    description:
      "Run a Fixed Assets report from AppFolio listing all fixed asset records.",
    endpoint: "fixed_assets",
    schema: propertyFilterSchema.merge(paginationSchema),
  },
  {
    toolName: "report_income_statement_12_month",
    description:
      "Run a 12-Month Income Statement report from AppFolio showing monthly income and expenses for a trailing 12-month period.",
    endpoint: "income_statement_12_month",
    schema: asOfDateSchema
      .merge(propertyFilterSchema)
      .merge(accountingMethodSchema)
      .merge(paginationSchema),
  },
  {
    toolName: "report_income_statement_date_range",
    description:
      "Run an Income Statement report from AppFolio for a custom date range showing income, expenses, and net income.",
    endpoint: "income_statement_date_range",
    schema: dateRangeSchema
      .merge(propertyFilterSchema)
      .merge(accountingMethodSchema)
      .merge(paginationSchema),
  },
  {
    toolName: "report_loans",
    description:
      "Run a Loans report from AppFolio listing all loan accounts and their balances.",
    endpoint: "loans",
    schema: asOfDateSchema
      .merge(propertyFilterSchema)
      .merge(paginationSchema),
  },
  {
    toolName: "report_trial_balance",
    description:
      "Run a Trial Balance report from AppFolio showing debit and credit balances for all accounts.",
    endpoint: "trial_balance",
    schema: asOfDateSchema
      .merge(propertyFilterSchema)
      .merge(accountingMethodSchema)
      .merge(paginationSchema),
  },

  // ── Registers ─────────────────────────────────────────────────────────────

  {
    toolName: "report_check_register",
    description:
      "Run a Check Register report from AppFolio showing all checks written. " +
      "Requires from_date filter.",
    endpoint: "check_register",
    schema: dateRangeSchema
      .merge(propertyFilterSchema)
      .merge(paginationSchema),
  },
  {
    toolName: "report_deposit_register",
    description:
      "Run a Deposit Register report from AppFolio showing all deposits. " +
      "Requires from_date and to_date filters.",
    endpoint: "deposit_register",
    schema: dateRangeSchema
      .merge(propertyFilterSchema)
      .merge(paginationSchema),
  },
  {
    toolName: "report_expense_register",
    description:
      "Run an Expense Register report from AppFolio showing all expense transactions.",
    endpoint: "expense_register",
    schema: dateRangeSchema
      .merge(propertyFilterSchema)
      .merge(paginationSchema),
  },
  {
    toolName: "report_income_register",
    description:
      "Run an Income Register report from AppFolio showing all income transactions.",
    endpoint: "income_register",
    schema: dateRangeSchema
      .merge(propertyFilterSchema)
      .merge(paginationSchema),
  },

  // ── Leasing ───────────────────────────────────────────────────────────────

  {
    toolName: "report_guest_card_inquiries",
    description:
      "Run a Guest Card Inquiries report from AppFolio showing prospective tenant inquiries.",
    endpoint: "guest_card_inquiries",
    schema: dateRangeSchema
      .merge(propertyFilterSchema)
      .merge(paginationSchema),
  },
  {
    toolName: "report_leasing_funnel_performance",
    description:
      "Run a Leasing Funnel Performance report from AppFolio showing conversion rates through leasing stages.",
    endpoint: "leasing_funnel_performance",
    schema: dateRangeSchema
      .merge(propertyFilterSchema)
      .merge(paginationSchema),
  },
  {
    toolName: "report_leasing_summary",
    description:
      "Run a Leasing Summary report from AppFolio showing lease activity and status overview.",
    endpoint: "leasing_summary",
    schema: dateRangeSchema
      .merge(propertyFilterSchema)
      .merge(paginationSchema),
  },
  {
    toolName: "report_rental_applications",
    description:
      "Run a Rental Applications report from AppFolio showing application status and details.",
    endpoint: "rental_applications",
    schema: dateRangeSchema
      .merge(propertyFilterSchema)
      .merge(paginationSchema),
  },
  {
    toolName: "report_rent_roll_itemized",
    description:
      "Run an Itemized Rent Roll report from AppFolio showing current lease details, charges, and balances per unit.",
    endpoint: "rent_roll_itemized",
    schema: asOfDateSchema
      .merge(propertyFilterSchema)
      .merge(paginationSchema),
  },
  {
    toolName: "report_renewal_summary",
    description:
      "Run a Renewal Summary report from AppFolio showing upcoming lease renewals and their status.",
    endpoint: "renewal_summary",
    schema: dateRangeSchema
      .merge(propertyFilterSchema)
      .merge(paginationSchema),
  },
  {
    toolName: "report_screening_assessments",
    description:
      "Run a Screening Assessments report from AppFolio showing tenant screening results.",
    endpoint: "screening_assessments",
    schema: dateRangeSchema
      .merge(propertyFilterSchema)
      .merge(paginationSchema),
  },
  {
    toolName: "report_lease_expirations",
    description:
      "Run a Lease Expirations report from AppFolio showing leases expiring within a date range.",
    endpoint: "lease_expirations",
    schema: dateRangeSchema
      .merge(propertyFilterSchema)
      .merge(paginationSchema),
  },

  // ── Property & Unit ───────────────────────────────────────────────────────

  {
    toolName: "report_occupancy_summary",
    description:
      "Run an Occupancy Summary report from AppFolio showing occupancy rates and vacancy details by property.",
    endpoint: "occupancy_summary",
    schema: asOfDateSchema
      .merge(propertyFilterSchema)
      .merge(paginationSchema),
  },
  {
    toolName: "report_property_directory",
    description:
      "Run a Property Directory report from AppFolio listing all properties and their details.",
    endpoint: "property_directory",
    schema: propertyFilterSchema.merge(paginationSchema),
  },
  {
    toolName: "report_property_group_directory",
    description:
      "Run a Property Group Directory report from AppFolio listing all property groups.",
    endpoint: "property_group_directory",
    schema: paginationSchema,
  },
  {
    toolName: "report_property_performance",
    description:
      "Run a Property Performance report from AppFolio showing financial performance metrics per property.",
    endpoint: "property_performance",
    schema: dateRangeSchema
      .merge(propertyFilterSchema)
      .merge(paginationSchema),
  },
  {
    toolName: "report_property_source_tracking",
    description:
      "Run a Property Source Tracking report from AppFolio showing lead sources and their effectiveness.",
    endpoint: "property_source_tracking",
    schema: dateRangeSchema
      .merge(propertyFilterSchema)
      .merge(paginationSchema),
  },
  {
    toolName: "report_unit_directory",
    description:
      "Run a Unit Directory report from AppFolio listing all units and their details.",
    endpoint: "unit_directory",
    schema: propertyFilterSchema.merge(paginationSchema),
  },
  {
    toolName: "report_unit_vacancy_detail",
    description:
      "Run a Unit Vacancy Detail report from AppFolio showing vacant units and vacancy duration.",
    endpoint: "unit_vacancy_detail",
    schema: asOfDateSchema
      .merge(propertyFilterSchema)
      .merge(paginationSchema),
  },

  // ── Tenant & Owner ────────────────────────────────────────────────────────

  {
    toolName: "report_delinquency",
    description:
      "Run a Delinquency report from AppFolio showing tenants with past-due balances.",
    endpoint: "delinquency",
    schema: asOfDateSchema
      .merge(propertyFilterSchema)
      .merge(paginationSchema),
  },
  {
    toolName: "report_owner_directory",
    description:
      "Run an Owner Directory report from AppFolio listing all property owners and their contact details.",
    endpoint: "owner_directory",
    schema: ownerFilterSchema.merge(paginationSchema),
  },
  {
    toolName: "report_owner_leasing",
    description:
      "Run an Owner Leasing report from AppFolio showing leasing activity for owner-managed properties.",
    endpoint: "owner_leasing",
    schema: dateRangeSchema
      .merge(propertyFilterSchema)
      .merge(ownerFilterSchema)
      .merge(paginationSchema),
  },
  {
    toolName: "report_owner_statement",
    description:
      "Run an Owner Statement report from AppFolio showing income, expenses, and net for property owners.",
    endpoint: "owner_statement",
    schema: dateRangeSchema
      .merge(propertyFilterSchema)
      .merge(ownerFilterSchema)
      .merge(accountingMethodSchema)
      .merge(paginationSchema),
  },
  {
    toolName: "report_receivables_activity",
    description:
      "Run a Receivables Activity report from AppFolio showing charges, payments, and balance changes.",
    endpoint: "receivables_activity",
    schema: dateRangeSchema
      .merge(propertyFilterSchema)
      .merge(paginationSchema),
  },
  {
    toolName: "report_resident_financial_activity",
    description:
      "Run a Resident Financial Activity report from AppFolio showing per-tenant charges, payments, and balances.",
    endpoint: "resident_financial_activity",
    schema: dateRangeSchema
      .merge(propertyFilterSchema)
      .merge(paginationSchema),
  },
  {
    toolName: "report_security_deposit_funds_detail",
    description:
      "Run a Security Deposit Funds Detail report from AppFolio showing held security deposits per tenant.",
    endpoint: "security_deposit_funds_detail",
    schema: asOfDateSchema
      .merge(propertyFilterSchema)
      .merge(paginationSchema),
  },
  {
    toolName: "report_tenant_directory",
    description:
      "Run a Tenant Directory report from AppFolio listing all tenants and their contact/lease details.",
    endpoint: "tenant_directory",
    schema: propertyFilterSchema.merge(paginationSchema),
  },
  {
    toolName: "report_tenant_ledger",
    description:
      "Run a Tenant Ledger report from AppFolio showing detailed transaction history per tenant.",
    endpoint: "tenant_ledger",
    schema: dateRangeSchema
      .merge(propertyFilterSchema)
      .merge(paginationSchema),
  },

  // ── Maintenance & Workflow ────────────────────────────────────────────────

  {
    toolName: "report_work_order",
    description:
      "Run a Work Order report from AppFolio showing maintenance work orders and their status.",
    endpoint: "work_order",
    schema: dateRangeSchema
      .merge(propertyFilterSchema)
      .merge(paginationSchema),
  },
  {
    toolName: "report_work_order_labor_summary",
    description:
      "Run a Work Order Labor Summary report from AppFolio showing labor hours and costs for work orders.",
    endpoint: "work_order_labor_summary",
    schema: dateRangeSchema
      .merge(propertyFilterSchema)
      .merge(paginationSchema),
  },
  {
    toolName: "report_completed_processes",
    description:
      "Run a Completed Processes report from AppFolio showing finished workflow processes.",
    endpoint: "completed_processes",
    schema: dateRangeSchema
      .merge(propertyFilterSchema)
      .merge(paginationSchema),
  },
  {
    toolName: "report_in_progress_processes",
    description:
      "Run an In-Progress Processes report from AppFolio showing active workflow processes.",
    endpoint: "in_progress_processes",
    schema: dateRangeSchema
      .merge(propertyFilterSchema)
      .merge(paginationSchema),
  },
  {
    toolName: "report_cancelled_processes",
    description:
      "Run a Cancelled Processes report from AppFolio showing cancelled workflow processes.",
    endpoint: "cancelled_processes",
    schema: dateRangeSchema
      .merge(propertyFilterSchema)
      .merge(paginationSchema),
  },

  // ── Other ─────────────────────────────────────────────────────────────────

  {
    toolName: "report_account_totals",
    description:
      "Run an Account Totals report from AppFolio showing aggregate totals by GL account.",
    endpoint: "account_totals",
    schema: dateRangeSchema
      .merge(propertyFilterSchema)
      .merge(accountingMethodSchema)
      .merge(paginationSchema),
  },
  {
    toolName: "report_property_account_totals",
    description:
      "Run a Property Account Totals report from AppFolio showing GL account totals broken down by property.",
    endpoint: "property_account_totals",
    schema: dateRangeSchema
      .merge(propertyFilterSchema)
      .merge(accountingMethodSchema)
      .merge(paginationSchema),
  },
];
