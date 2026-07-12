// Assembles src/catalog/index.json from the per-endpoint spec files in
// src/catalog/reports/. Deterministic: validates completeness, assigns a
// category to each report via an ordered rule list (NOT free-assigned), and
// flags any Best-Practices report missing its required filter.
//
// Run after the catalog parsing workflow completes:  node scripts/assemble-catalog.mjs
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const reportsDir = join(root, "src", "catalog", "reports");
const indexPath = join(root, "src", "catalog", "index.json");

// The 137 endpoint slugs we expect (from the source-doc index).
const EXPECTED = [
  "account_totals","additional_fees","aged_payables_summary","aged_receivables_detail","amenities_by_property",
  "annual_budget_comparative","annual_budget_forecast","appfolio_stack_usage","association_work_order","balance_sheet",
  "balance_sheet_comparative","balance_sheet_comparison","bank_account_association","bill_detail","board_of_directors",
  "budget_comparative","budget_comparison","cancelled_processes","cash_flow","cash_flow_comparison","cash_flow_detail",
  "charge_detail","chart_of_accounts","check_register","check_register_detail","completed_processes","insurance_enforcement",
  "delinquency","delinquency_as_of","deposit_register","dues_roll","dues_roll_itemized","eligible_debt_summary",
  "email_delivery_errors","expense_distribution","expense_register","fixed_assets","flows_assigned_tasks","fund_balance_sheet",
  "fund_balance_sheet_active_funds","fund_income_statement","general_ledger","gross_potential_rent_enhanced",
  "guest_card_inquiries","guest_cards","historical_advertised_rent","homeowner_delinquency","homeowner_delinquency_as_of",
  "homeowner_directory","homeowner_ledger","homeowner_prepayment_balance","homeowner_resale","homeowner_vehicle_info",
  "import_variances","in_progress_workflows","inactive_guest_cards","income_register","income_statement",
  "income_statement_comparative","income_statement_comparison","income_statement_date_range","inspection_detail",
  "insurance_usage","inventory_status","inventory_usage","keys_detail","late_fee_policy_comparison","lease_expiration_detail",
  "lease_expiration_summary","lease_history","leasing_agent_performance","leasing_funnel_performance","leasing_summary",
  "loans","occupancy_custom_fields","occupancy_summary","owner1099","owner1099_detail","owner_custom_fields",
  "owner_directory","owner_leasing","owner_withholdings","payment_plans","premium_leads_billing_detail",
  "project_budget_detail","project_directory","property_budget","property_custom_fields","property_directory",
  "property_group_directory","property_performance","property_staff_assignments","prospect_source_tracking","purchase_order",
  "receivables_activity","renewal_summary","rent_roll","rent_roll_commercial","rent_roll_itemized","rentable_items",
  "rental_applications","renter_directory","resident_financial_activity","screening_assessments","screening_usage",
  "security_deposit_funds_detail","showings","surveys_summary","student_housing_rent_roll_by_bed",
  "tenant_debt_collections_status","tenant_directory","tenant_ledger","tenant_tickler","tenant_transactions_summary",
  "tenant_unpaid_charges_summary","tenant_vehicle_info","trial_balance","trial_balance_by_property","trust_account_balance",
  "trust_account_balance_detail","twelve_month_cash_flow","twelve_month_income_statement","unit_custom_fields",
  "unit_directory","unit_inspection","unit_turn_detail","unit_vacancy","unpaid_balances_by_month","upcoming_activities",
  "vendor1099","vendor_custom_fields","vendor_directory","vendor_ledger","vendor_ledger_enhanced","violation_detail",
  "work_order","work_order_labor_summary",
];

// Best-Practices reports that MUST carry a cross-cutting required filter.
const BEST_PRACTICES_REQUIRED = [
  "balance_sheet","check_register_detail","deposit_register","payment_plans",
  "prospect_source_tracking","receivables_activity","rental_applications","surveys_summary",
];

// Pagination params documented once globally, never per-endpoint. run_report must always allow these.
const UNIVERSAL_PARAMETERS = ["paginate_results", "page", "limit"];

// Ordered category rules — first match wins. Tuned so HOA/owner/vendor win over generic financial.
const CATEGORY_RULES = [
  [/^(homeowner_|dues_roll|board_of_directors|fund_|eligible_debt|insurance_enforcement|violation_detail)/, "Association / HOA"],
  [/^(owner1099|owner_)/, "Owner"],
  [/^(vendor1099|vendor_)/, "Vendor"],
  [/^(tenant_|delinquency|resident_financial_activity|security_deposit|renter_directory|unpaid_balances_by_month)/, "Tenant"],
  [/(rent_roll|gross_potential_rent)/, "Rent Roll"],
  [/^(guest_card|guest_cards|inactive_guest_cards|leasing_|lease_|rental_applications|renewal_summary|screening_|prospect_source|showings|historical_advertised_rent)/, "Leasing"],
  [/(work_order|completed_processes|in_progress_workflows|cancelled_processes|flows_assigned_tasks|project_|upcoming_activities|tenant_tickler|inspection)/, "Maintenance & Workflow"],
  [/(check_register|deposit_register|expense_register|income_register|bill_detail|charge_detail|purchase_order|payment_plans)/, "Registers & Transactions"],
  [/^(property_|unit_|occupancy_|amenities_by_property|rentable_items|inventory_|keys_detail|premium_leads_billing_detail|appfolio_stack_usage)/, "Property & Unit"],
  [/(account_totals|additional_fees|aged_payables|aged_receivables|balance_sheet|budget|annual_budget|cash_flow|chart_of_accounts|expense_distribution|fixed_assets|general_ledger|income_statement|trial_balance|loans|twelve_month|bank_account_association|import_variances|trust_account|email_delivery_errors|late_fee_policy_comparison|insurance_usage)/, "Financial"],
  [/_custom_fields$/, "Custom Fields"],
];

function categorize(slug) {
  for (const [re, cat] of CATEGORY_RULES) if (re.test(slug)) return cat;
  return "Other";
}

const files = readdirSync(reportsDir).filter((f) => f.endsWith(".json"));
const found = new Set();
const reports = [];
const problems = [];

for (const f of files) {
  const slug = f.replace(/\.json$/, "");
  found.add(slug);
  let spec;
  try {
    spec = JSON.parse(readFileSync(join(reportsDir, f), "utf8"));
  } catch (e) {
    problems.push(`PARSE ERROR ${f}: ${e.message}`);
    continue;
  }
  for (const k of ["slug", "endpoint", "name", "description", "requiredFilters", "parameters"]) {
    if (!(k in spec)) problems.push(`${slug}: missing key "${k}"`);
  }
  if (spec.slug !== slug) problems.push(`${slug}: slug field is "${spec.slug}"`);
  reports.push({
    slug: spec.slug,
    name: spec.name,
    category: categorize(slug),
    description: spec.description,
    requiredFilters: spec.requiredFilters || [],
    paramCount: Array.isArray(spec.parameters) ? spec.parameters.length : 0,
    endpoint: spec.endpoint,
  });
}

const missing = EXPECTED.filter((s) => !found.has(s));
const extra = [...found].filter((s) => !EXPECTED.includes(s));
const bpMissing = BEST_PRACTICES_REQUIRED.filter((s) => {
  const r = reports.find((x) => x.slug === s);
  return r && r.requiredFilters.length === 0;
});

reports.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

const index = {
  generatedFrom: "AppFolio Reports API (2.0.0).md",
  reportCount: reports.length,
  universalParameters: UNIVERSAL_PARAMETERS,
  reports,
};

console.log(`Files found:        ${files.length}`);
console.log(`Expected:           ${EXPECTED.length}`);
console.log(`Missing (${missing.length}):  ${missing.join(", ") || "none"}`);
console.log(`Unexpected (${extra.length}): ${extra.join(", ") || "none"}`);
console.log(`BP reports missing required filter (${bpMissing.length}): ${bpMissing.join(", ") || "none"}`);
console.log(`Structural problems (${problems.length}):`);
for (const p of problems) console.log(`  - ${p}`);

const byCat = {};
for (const r of reports) byCat[r.category] = (byCat[r.category] || 0) + 1;
console.log("Categories:", JSON.stringify(byCat, null, 0));

if (missing.length === 0 && problems.length === 0 && bpMissing.length === 0) {
  writeFileSync(indexPath, JSON.stringify(index, null, 2) + "\n");
  console.log(`\n✅ Wrote ${indexPath} (${reports.length} reports)`);
} else {
  console.log(`\n⚠️  index.json NOT written — resolve the issues above first (catalog incomplete).`);
  process.exitCode = 1;
}
