// Assembles src/catalog-db/index.json from the per-operation spec files in
// src/catalog-db/endpoints/. Deterministic: validates completeness against the
// 156 expected operationIds (derived from the source-doc HTTP-method markers,
// NOT from whatever the parser happened to emit), assigns a category to each
// endpoint by its path's first segment, and flags structural problems.
//
// Run after editing endpoint specs:  node scripts/assemble-catalog-db.mjs
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const endpointsDir = join(root, "src", "catalog-db", "endpoints");
const indexPath = join(root, "src", "catalog-db", "index.json");

const BASE_URL = "https://api.appfolio.com/api/v0";
// page[number]/page[size] documented globally for GET list endpoints.
const PAGINATION_PARAMS = ["page[number]", "page[size]"];

// The 156 expected operationIds — derived deterministically from the HTTP-method
// markers in "AppFolio Database API.txt" (method + path -> lowercased, braces
// stripped, non-alphanumeric runs -> "_"). Ground truth for completeness.
const EXPECTED = [
  "get_bank_accounts", "post_bank_accounts_bulk", "get_bills", "post_bills",
  "patch_bills_billid", "post_bills_billid_attachments", "post_bills_bulk", "post_bills_bulk_async",
  "get_charges", "post_charges", "post_charges_bulk", "post_charges_bulk_async",
  "post_charges_chargeid_attachments", "get_delinquent_charges", "get_gl_accounts", "post_gl_accounts_bulk",
  "get_gl_details", "get_journal_entries", "post_journal_entries", "patch_journal_entries_journalentryid",
  "post_journal_entries_bulk", "post_journal_entries_journalentryid_attachments", "get_late_fee_policies", "post_late_fee_policies_bulk",
  "get_payables", "get_recurring_charges", "post_recurring_charges", "post_recurring_charges_bulk",
  "patch_recurring_charges_recurringchargeid", "get_tenant_ledgers", "get_corporate_entities", "post_corporate_gl_accounts_bulk",
  "get_ca_associations", "get_ca_bank_balances", "get_ca_board_members", "get_ca_homeowners",
  "get_ca_homeowner_ledgers", "get_ca_renters", "get_ca_rules", "get_ca_units",
  "get_ca_violations", "post_ca_violations", "post_ca_violations_violationid_attachments", "patch_ca_violations_violationid",
  "get_custom_fields", "get_leads", "post_leads", "patch_leads_leadid",
  "get_leads_notes", "post_leads_guestcardid_notes", "patch_leads_guestcardid_notes_id", "get_leases",
  "patch_leases_leaseid", "get_leases_renewal_pricings", "put_leases_renewal_pricings_bulk", "get_listings",
  "post_rental_applications_rentalapplicationid_attachments", "get_rental_applications", "patch_rental_applications_rentalapplicationid", "get_rental_applications_notes",
  "post_rental_applications_rentalapplicationid_notes", "patch_rental_applications_rentalapplicationid_notes_id", "get_showings", "post_showings",
  "patch_showings_showingid", "get_tenants", "patch_tenants_tenantid", "get_tenants_notes",
  "post_tenants_tenantid_notes", "patch_tenants_tenantid_notes_id", "post_tenants_bulk", "patch_tenants_bulk",
  "get_owners", "post_owners", "get_owners_ownerid", "patch_owners_ownerid",
  "post_owners_bulk", "post_owners_ownerid_attachments", "get_owners_attachments", "get_owners_notes",
  "post_owners_ownerid_notes", "patch_owners_ownerid_notes_id", "get_owner_groups", "post_owner_groups",
  "patch_owner_groups_id", "get_users", "post_occupancies_occupancyid_attachments", "get_occupancies_documents",
  "get_portfolios", "patch_portfolios_portfolioid", "get_properties", "post_properties_bulk",
  "patch_properties_propertyid", "get_properties_attachments", "post_properties_propertyid_attachments", "get_properties_notes",
  "post_properties_propertyid_notes", "patch_properties_propertyid_notes_id", "get_properties_marketing_photos", "patch_properties_propertyid_marketing_photos_marketingphotoid",
  "delete_properties_propertyid_marketing_photos_marketingphotoid", "get_properties_photos", "post_properties_propertyid_marketing_photos", "post_properties_propertyid_photos",
  "patch_properties_propertyid_photos_photoid", "delete_properties_propertyid_photos_photoid", "get_property_groups", "patch_property_groups_propertygroupid",
  "get_units", "post_units_bulk", "put_units_pricing_matrices_bulk", "put_units_pricing_matrices_bulk_async",
  "patch_units_unitid", "put_units_unitid_pricing_matrices", "post_units_unitid_attachments", "get_units_attachments",
  "get_units_notes", "post_units_unitid_notes", "patch_units_unitid_notes_id", "post_units_unitid_photos",
  "patch_units_unitid_photos_photoid", "delete_units_unitid_photos_photoid", "get_units_photos", "get_unit_types",
  "post_unit_types_bulk", "patch_unit_types_unittypeid", "post_inspections_inspectionid_attachments", "post_inspections",
  "post_inspections_bulk", "patch_inspections_inspectionid", "delete_inspections_inspectionid", "post_inventories",
  "get_inventories", "post_inventories_bulk", "patch_inventories_id", "delete_inventories_id",
  "get_inventory_locations", "post_inventory_locations", "post_inventory_locations_bulk", "patch_inventory_locations_id",
  "get_work_orders", "post_work_orders", "get_work_orders_attachments", "patch_work_orders_workorderid",
  "post_work_orders_workorderid_attachments", "delete_work_orders_workorderid_attachments_attachmentid", "post_work_orders_workorderid_notes", "patch_work_orders_workorderid_notes_id",
  "get_vendors", "post_vendors", "patch_vendors_vendorid", "post_vendors_bulk",
  "get_vendors_notes", "post_vendors_vendorid_notes", "patch_vendors_vendorid_notes_id", "get_jobs",
];

// Category by the path's first segment (deterministic; mirrors the doc's nav grouping).
const CATEGORY_BY_SEGMENT = {
  bank_accounts: "Accounting", bills: "Accounting", charges: "Accounting", delinquent_charges: "Accounting",
  gl_accounts: "Accounting", gl_details: "Accounting", journal_entries: "Accounting", late_fee_policies: "Accounting",
  payables: "Accounting", recurring_charges: "Accounting", tenant_ledgers: "Accounting",
  corporate_entities: "Corporate Accounting", corporate: "Corporate Accounting",
  ca: "Community Associations",
  custom_fields: "Custom Fields",
  leads: "Leasing", leases: "Leasing", listings: "Leasing", rental_applications: "Leasing", showings: "Leasing",
  tenants: "People", owners: "People", owner_groups: "People", users: "People",
  occupancies: "Properties", portfolios: "Properties", properties: "Properties", property_groups: "Properties",
  units: "Properties", unit_types: "Properties",
  inspections: "Maintenance", inventories: "Maintenance", inventory_locations: "Maintenance",
  work_orders: "Maintenance", vendors: "Maintenance",
  jobs: "System",
};

function categorize(path) {
  const seg = path.replace(/^\//, "").split("/")[0];
  return CATEGORY_BY_SEGMENT[seg] || "Other";
}

const files = readdirSync(endpointsDir).filter((f) => f.endsWith(".json"));
const found = new Set();
const endpoints = [];
const problems = [];

for (const f of files) {
  const operationId = f.replace(/\.json$/, "");
  found.add(operationId);
  let spec;
  try {
    spec = JSON.parse(readFileSync(join(endpointsDir, f), "utf8"));
  } catch (e) {
    problems.push(`PARSE ERROR ${f}: ${e.message}`);
    continue;
  }
  for (const k of ["operationId", "resource", "name", "method", "path", "description", "writeOperation"]) {
    if (!(k in spec)) problems.push(`${operationId}: missing key "${k}"`);
  }
  if (spec.operationId !== operationId) problems.push(`${operationId}: operationId field is "${spec.operationId}"`);
  const expectWrite = spec.method !== "GET";
  if (spec.writeOperation !== expectWrite) {
    problems.push(`${operationId}: writeOperation=${spec.writeOperation} but method=${spec.method}`);
  }
  endpoints.push({
    operationId: spec.operationId,
    resource: spec.resource,
    category: categorize(spec.path),
    name: spec.name,
    method: spec.method,
    path: spec.path,
    description: spec.description,
    writeOperation: !!spec.writeOperation,
    pagination: !!spec.pagination,
    deprecated: !!spec.deprecated,
  });
}

const missing = EXPECTED.filter((s) => !found.has(s));
const extra = [...found].filter((s) => !EXPECTED.includes(s));

endpoints.sort(
  (a, b) =>
    a.category.localeCompare(b.category) ||
    a.resource.localeCompare(b.resource) ||
    a.path.localeCompare(b.path) ||
    a.method.localeCompare(b.method)
);

const categories = [...new Set(endpoints.map((e) => e.category))].sort();

const index = {
  generatedFrom: "AppFolio Database API.txt",
  baseUrl: BASE_URL,
  endpointCount: endpoints.length,
  paginationParams: PAGINATION_PARAMS,
  categories,
  endpoints,
};

console.log(`Files found:        ${files.length}`);
console.log(`Expected:           ${EXPECTED.length}`);
console.log(`Missing (${missing.length}):  ${missing.join(", ") || "none"}`);
console.log(`Unexpected (${extra.length}): ${extra.join(", ") || "none"}`);
console.log(`Structural problems (${problems.length}):`);
for (const p of problems) console.log(`  - ${p}`);

const byCat = {};
for (const e of endpoints) byCat[e.category] = (byCat[e.category] || 0) + 1;
console.log("Categories:", JSON.stringify(byCat, null, 0));
const byMethod = {};
for (const e of endpoints) byMethod[e.method] = (byMethod[e.method] || 0) + 1;
console.log("Methods:", JSON.stringify(byMethod, null, 0));

if (missing.length === 0 && extra.length === 0 && problems.length === 0) {
  writeFileSync(indexPath, JSON.stringify(index, null, 2) + "\n");
  console.log(`\n✅ Wrote ${indexPath} (${endpoints.length} endpoints)`);
} else {
  console.log(`\n⚠️  index.json NOT written — resolve the issues above first (catalog incomplete).`);
  process.exitCode = 1;
}
