# AppFolio MCP Server

[![npm version](https://img.shields.io/npm/v/@nightsquawktech/appfolio-mcp-server)](https://www.npmjs.com/package/@nightsquawktech/appfolio-mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/@nightsquawktech/appfolio-mcp-server)](https://www.npmjs.com/package/@nightsquawktech/appfolio-mcp-server)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/NightSquawk/appfolio-mcp-server/badge)](https://scorecard.dev/viewer/?uri=github.com/NightSquawk/appfolio-mcp-server)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue)](https://github.com/NightSquawk/appfolio-mcp-server/blob/v1.0.0/LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

An MCP (Model Context Protocol) server for **AppFolio Property Manager**, connecting your property management data to AI tools.

## Quick start

### Claude

[![Download for Claude Desktop](https://img.shields.io/badge/Claude_Desktop-Download_.mcpb-D97757?style=flat-square)](https://github.com/NightSquawk/appfolio-mcp-server/releases/download/mcpb-v0.1.0/appfolio-mcp-server-0.1.0.mcpb)

**bash (macOS/Linux):**

```bash
APPFOLIO_VHOST="yourcompany"
APPFOLIO_CLIENT_ID="your-reports-client-id"
APPFOLIO_CLIENT_SECRET="your-reports-client-secret"
APPFOLIO_DB_DEVELOPER_ID="your-developer-id"
APPFOLIO_DB_CLIENT_ID="your-db-client-id"
APPFOLIO_DB_CLIENT_SECRET="your-db-client-secret"

claude mcp add appfolio \
  --env APPFOLIO_VHOST="$APPFOLIO_VHOST" \
  --env APPFOLIO_CLIENT_ID="$APPFOLIO_CLIENT_ID" \
  --env APPFOLIO_CLIENT_SECRET="$APPFOLIO_CLIENT_SECRET" \
  --env APPFOLIO_DB_DEVELOPER_ID="$APPFOLIO_DB_DEVELOPER_ID" \
  --env APPFOLIO_DB_CLIENT_ID="$APPFOLIO_DB_CLIENT_ID" \
  --env APPFOLIO_DB_CLIENT_SECRET="$APPFOLIO_DB_CLIENT_SECRET" \
  -- npx -y @nightsquawktech/appfolio-mcp-server
```

**PowerShell (Windows):**

```powershell
$APPFOLIO_VHOST = "yourcompany"
$APPFOLIO_CLIENT_ID = "your-reports-client-id"
$APPFOLIO_CLIENT_SECRET = "your-reports-client-secret"
$APPFOLIO_DB_DEVELOPER_ID = "your-developer-id"
$APPFOLIO_DB_CLIENT_ID = "your-db-client-id"
$APPFOLIO_DB_CLIENT_SECRET = "your-db-client-secret"

claude mcp add appfolio `
  --env "APPFOLIO_VHOST=$APPFOLIO_VHOST" `
  --env "APPFOLIO_CLIENT_ID=$APPFOLIO_CLIENT_ID" `
  --env "APPFOLIO_CLIENT_SECRET=$APPFOLIO_CLIENT_SECRET" `
  --env "APPFOLIO_DB_DEVELOPER_ID=$APPFOLIO_DB_DEVELOPER_ID" `
  --env "APPFOLIO_DB_CLIENT_ID=$APPFOLIO_DB_CLIENT_ID" `
  --env "APPFOLIO_DB_CLIENT_SECRET=$APPFOLIO_DB_CLIENT_SECRET" `
  -- npx -y @nightsquawktech/appfolio-mcp-server
```

### Cursor

[![Add to Cursor](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=appfolio&config=eyJjb21tYW5kIjogIm5weCIsICJhcmdzIjogWyIteSIsICJAbmlnaHRzcXVhd2t0ZWNoL2FwcGZvbGlvLW1jcC1zZXJ2ZXIiXSwgImVudiI6IHsiQVBQRk9MSU9fVkhPU1QiOiAieW91cmNvbXBhbnkiLCAiQVBQRk9MSU9fQ0xJRU5UX0lEIjogInlvdXItcmVwb3J0cy1jbGllbnQtaWQiLCAiQVBQRk9MSU9fQ0xJRU5UX1NFQ1JFVCI6ICJ5b3VyLXJlcG9ydHMtY2xpZW50LXNlY3JldCIsICJBUFBGT0xJT19EQl9ERVZFTE9QRVJfSUQiOiAieW91ci1kZXZlbG9wZXItaWQiLCAiQVBQRk9MSU9fREJfQ0xJRU5UX0lEIjogInlvdXItZGItY2xpZW50LWlkIiwgIkFQUEZPTElPX0RCX0NMSUVOVF9TRUNSRVQiOiAieW91ci1kYi1jbGllbnQtc2VjcmV0In19)

Or put the [mcp.json](#mcpjson) block in `.cursor/mcp.json`, then verify with:

```bash
agent mcp list
```

(The Cursor CLI manages configured servers but has no `mcp add`; install is via the button or `mcp.json`.)

### VS Code

[![Install in VS Code](https://img.shields.io/badge/VS_Code-Install_Server-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=appfolio&config=%7B%22command%22%3A%20%22npx%22%2C%20%22args%22%3A%20%5B%22-y%22%2C%20%22%40nightsquawktech/appfolio-mcp-server%22%5D%2C%20%22env%22%3A%20%7B%22APPFOLIO_VHOST%22%3A%20%22yourcompany%22%2C%20%22APPFOLIO_CLIENT_ID%22%3A%20%22your-reports-client-id%22%2C%20%22APPFOLIO_CLIENT_SECRET%22%3A%20%22your-reports-client-secret%22%2C%20%22APPFOLIO_DB_DEVELOPER_ID%22%3A%20%22your-developer-id%22%2C%20%22APPFOLIO_DB_CLIENT_ID%22%3A%20%22your-db-client-id%22%2C%20%22APPFOLIO_DB_CLIENT_SECRET%22%3A%20%22your-db-client-secret%22%7D%7D)

**bash (macOS/Linux):**

```bash
APPFOLIO_VHOST="yourcompany"
APPFOLIO_CLIENT_ID="your-reports-client-id"
APPFOLIO_CLIENT_SECRET="your-reports-client-secret"
APPFOLIO_DB_DEVELOPER_ID="your-developer-id"
APPFOLIO_DB_CLIENT_ID="your-db-client-id"
APPFOLIO_DB_CLIENT_SECRET="your-db-client-secret"

code --add-mcp '{"name":"appfolio","command":"npx","args":["-y","@nightsquawktech/appfolio-mcp-server"],"env":{"APPFOLIO_VHOST":"'"$APPFOLIO_VHOST"'","APPFOLIO_CLIENT_ID":"'"$APPFOLIO_CLIENT_ID"'","APPFOLIO_CLIENT_SECRET":"'"$APPFOLIO_CLIENT_SECRET"'","APPFOLIO_DB_DEVELOPER_ID":"'"$APPFOLIO_DB_DEVELOPER_ID"'","APPFOLIO_DB_CLIENT_ID":"'"$APPFOLIO_DB_CLIENT_ID"'","APPFOLIO_DB_CLIENT_SECRET":"'"$APPFOLIO_DB_CLIENT_SECRET"'"}}'
```

**PowerShell (Windows):**

```powershell
$APPFOLIO_VHOST = "yourcompany"
$APPFOLIO_CLIENT_ID = "your-reports-client-id"
$APPFOLIO_CLIENT_SECRET = "your-reports-client-secret"
$APPFOLIO_DB_DEVELOPER_ID = "your-developer-id"
$APPFOLIO_DB_CLIENT_ID = "your-db-client-id"
$APPFOLIO_DB_CLIENT_SECRET = "your-db-client-secret"

$config = @{
  name = "appfolio"
  command = "npx"
  args = @("-y", "@nightsquawktech/appfolio-mcp-server")
  env = @{
    APPFOLIO_VHOST = $APPFOLIO_VHOST
    APPFOLIO_CLIENT_ID = $APPFOLIO_CLIENT_ID
    APPFOLIO_CLIENT_SECRET = $APPFOLIO_CLIENT_SECRET
    APPFOLIO_DB_DEVELOPER_ID = $APPFOLIO_DB_DEVELOPER_ID
    APPFOLIO_DB_CLIENT_ID = $APPFOLIO_DB_CLIENT_ID
    APPFOLIO_DB_CLIENT_SECRET = $APPFOLIO_DB_CLIENT_SECRET
  }
} | ConvertTo-Json -Compress

code --add-mcp $config
```

### Codex

**bash (macOS/Linux):**

```bash
APPFOLIO_VHOST="yourcompany"
APPFOLIO_CLIENT_ID="your-reports-client-id"
APPFOLIO_CLIENT_SECRET="your-reports-client-secret"
APPFOLIO_DB_DEVELOPER_ID="your-developer-id"
APPFOLIO_DB_CLIENT_ID="your-db-client-id"
APPFOLIO_DB_CLIENT_SECRET="your-db-client-secret"

codex mcp add appfolio \
  --env APPFOLIO_VHOST="$APPFOLIO_VHOST" \
  --env APPFOLIO_CLIENT_ID="$APPFOLIO_CLIENT_ID" \
  --env APPFOLIO_CLIENT_SECRET="$APPFOLIO_CLIENT_SECRET" \
  --env APPFOLIO_DB_DEVELOPER_ID="$APPFOLIO_DB_DEVELOPER_ID" \
  --env APPFOLIO_DB_CLIENT_ID="$APPFOLIO_DB_CLIENT_ID" \
  --env APPFOLIO_DB_CLIENT_SECRET="$APPFOLIO_DB_CLIENT_SECRET" \
  -- npx -y @nightsquawktech/appfolio-mcp-server
```

**PowerShell (Windows):**

```powershell
$APPFOLIO_VHOST = "yourcompany"
$APPFOLIO_CLIENT_ID = "your-reports-client-id"
$APPFOLIO_CLIENT_SECRET = "your-reports-client-secret"
$APPFOLIO_DB_DEVELOPER_ID = "your-developer-id"
$APPFOLIO_DB_CLIENT_ID = "your-db-client-id"
$APPFOLIO_DB_CLIENT_SECRET = "your-db-client-secret"

codex mcp add appfolio `
  --env "APPFOLIO_VHOST=$APPFOLIO_VHOST" `
  --env "APPFOLIO_CLIENT_ID=$APPFOLIO_CLIENT_ID" `
  --env "APPFOLIO_CLIENT_SECRET=$APPFOLIO_CLIENT_SECRET" `
  --env "APPFOLIO_DB_DEVELOPER_ID=$APPFOLIO_DB_DEVELOPER_ID" `
  --env "APPFOLIO_DB_CLIENT_ID=$APPFOLIO_DB_CLIENT_ID" `
  --env "APPFOLIO_DB_CLIENT_SECRET=$APPFOLIO_DB_CLIENT_SECRET" `
  -- npx -y @nightsquawktech/appfolio-mcp-server
```

Or add it to `~/.codex/config.toml` under `[mcp_servers.appfolio]`.

### mcp.json

Every environment variable the server reads, with recommended values:

```json
{
  "mcpServers": {
    "appfolio": {
      "command": "npx",
      "args": ["-y", "@nightsquawktech/appfolio-mcp-server"],
      "env": {
        "APPFOLIO_VHOST": "yourcompany",
        "APPFOLIO_CLIENT_ID": "your-reports-client-id",
        "APPFOLIO_CLIENT_SECRET": "your-reports-client-secret",
        "APPFOLIO_DB_DEVELOPER_ID": "your-developer-id",
        "APPFOLIO_DB_CLIENT_ID": "your-db-client-id",
        "APPFOLIO_DB_CLIENT_SECRET": "your-db-client-secret"
      }
    }
  }
}
```

File locations: `.mcp.json` in your project root (Claude Code), `claude_desktop_config.json` (Claude Desktop), `.cursor/mcp.json` (Cursor).

## Configuration

The server talks to two AppFolio APIs, each with its own credentials. Configure one set or both: each API's tools only need their own variables, and the other API's tools return an error at call time if their variables are unset.

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `APPFOLIO_VHOST` | for Reports API tools | | Your AppFolio database name, the subdomain in `{vhost}.appfolio.com` |
| `APPFOLIO_CLIENT_ID` | for Reports API tools | | Reports API Client ID (Account Settings > Manage API Settings > Reports API Credentials) |
| `APPFOLIO_CLIENT_SECRET` | for Reports API tools | | Reports API Client Secret |
| `APPFOLIO_DB_DEVELOPER_ID` | for Database API tools | | Your AppFolio Developer ID (Admin > Developer ID) |
| `APPFOLIO_DB_CLIENT_ID` | for Database API tools | | Database API Basic Auth Client ID (API Credentials > Basic Auth) |
| `APPFOLIO_DB_CLIENT_SECRET` | for Database API tools | | Database API Basic Auth Client Secret |

## Security & write safety

AppFolio credentials: create dedicated API credentials for this server. Reports API credentials come from Account Settings > Manage API Settings > Reports API Credentials; Database API credentials are a Developer ID plus Basic Auth Client ID and Secret from API Credentials > Basic Auth.

- The Reports API tools (`list_reports`, `describe_report`, `run_report`) are **read-only**: reports return data and never modify anything.
- The Database API tool `call_endpoint` executes reads **and writes**. Of the 156 endpoints, 58 are GET reads and **98 are write operations** (55 POST, 33 PATCH, 4 PUT, 6 DELETE) that execute live against your AppFolio database. There is **no environment write gate** in this version.
- For a read-only posture, configure only the Reports API variables: without `APPFOLIO_DB_*` credentials, every `call_endpoint` request fails before reaching AppFolio.
- Every request is validated against the local catalog first (known operation, required path params, required report filters), and the client enforces AppFolio's documented rate limits (7 requests per 15 seconds on the Reports API, all three Database API windows).
- All requests go directly from your machine to `{vhost}.appfolio.com` and `api.appfolio.com`; nothing passes through third parties.

> [!IMPORTANT]
> The tool surface is a guardrail, not a security boundary. The env vars in your MCP config are real AppFolio credentials, and an AI agent with shell access can bypass the MCP tools and call the AppFolio API directly with them. If you need hard read-only, enforce it at the source: scope the API credentials themselves, or only issue the read-oriented Reports API credentials and leave the Database API credentials out of the config.

## Tools

Both APIs are catalog-backed: instead of one MCP tool per report or endpoint, each API exposes a list/describe/call triple built on [mcp-core](https://github.com/NightSquawk/mcp-core). `list_*` discovers what exists (137 reports, 156 endpoints), `describe_*` returns the full parameter spec for one entry from a local catalog, and the execute tool (`run_report` / `call_endpoint`) validates the request against that spec before calling AppFolio. Six tools cover 293 operations without flooding your client's tool list.

```
list_reports         List the 137 AppFolio reports (slug, name, category, required filters)
describe_report      Full parameter spec for one report: filters, types, enums, response columns
run_report           Run a report and return its rows, auto-paginated
list_endpoints       List the 156 Database API endpoints (operationId, method, path, category)
describe_endpoint    Full spec for one endpoint: path params, filters, body schema, response fields
call_endpoint        Call a Database API endpoint after validating it against the catalog
```

## API coverage

<!-- GENERATED SECTION: do not edit by hand. Regenerate with `node scripts/generate-api-coverage.mjs` whenever a catalog changes. -->

293 operations covered: 137 reports (Reports API v2) and 156 endpoints (Database API v0).

| Category | Operations |
|---|---|
| Reports: Association / HOA | 16 |
| Reports: Financial | 34 |
| Reports: Leasing | 16 |
| Reports: Maintenance & Workflow | 12 |
| Reports: Other | 2 |
| Reports: Owner | 6 |
| Reports: Property & Unit | 19 |
| Reports: Registers & Transactions | 9 |
| Reports: Rent Roll | 5 |
| Reports: Tenant | 13 |
| Reports: Vendor | 5 |
| Database API: Accounting | 30 |
| Database API: Community Associations | 12 |
| Database API: Corporate Accounting | 2 |
| Database API: Custom Fields | 1 |
| Database API: Leasing | 20 |
| Database API: Maintenance | 29 |
| Database API: People | 21 |
| Database API: Properties | 40 |
| Database API: System | 1 |

<details>
<summary><strong>Reports: Association / HOA</strong> (16 reports)</summary>

| Report | ID |
|---|---|
| Board of Directors | `board_of_directors` |
| Dues Roll | `dues_roll` |
| Dues Roll (Itemized) | `dues_roll_itemized` |
| Eligible Debt Summary | `eligible_debt_summary` |
| Fund Balance Sheet | `fund_balance_sheet` |
| Fund Balance Sheet - Active Funds | `fund_balance_sheet_active_funds` |
| Fund Income Statement | `fund_income_statement` |
| Homeowner Delinquency | `homeowner_delinquency` |
| Homeowner Delinquency (As Of) | `homeowner_delinquency_as_of` |
| Homeowner Directory | `homeowner_directory` |
| Homeowner Ledger | `homeowner_ledger` |
| Homeowner Prepayment Balance | `homeowner_prepayment_balance` |
| Homeowner Resale | `homeowner_resale` |
| Homeowner Vehicle Info | `homeowner_vehicle_info` |
| Insurance Enforcement | `insurance_enforcement` |
| Violation Detail | `violation_detail` |

</details>

<details>
<summary><strong>Reports: Financial</strong> (34 reports)</summary>

| Report | ID |
|---|---|
| Account Totals | `account_totals` |
| Additional Fees | `additional_fees` |
| Aged Payables Summary | `aged_payables_summary` |
| Aged Receivable Detail | `aged_receivables_detail` |
| Annual Budget - Comparative | `annual_budget_comparative` |
| Annual Budget - Forecast | `annual_budget_forecast` |
| Balance Sheet | `balance_sheet` |
| Balance Sheet - Comparative | `balance_sheet_comparative` |
| Balance Sheet - Property Comparison | `balance_sheet_comparison` |
| Bank Account Association | `bank_account_association` |
| Budget - Comparative | `budget_comparative` |
| Budget - Property Comparison | `budget_comparison` |
| Cash Flow | `cash_flow` |
| Cash Flow - Property Comparison | `cash_flow_comparison` |
| Cash Flow Detail | `cash_flow_detail` |
| Chart of Accounts | `chart_of_accounts` |
| Email Delivery Errors | `email_delivery_errors` |
| Expense Distribution | `expense_distribution` |
| Fixed Assets | `fixed_assets` |
| General Ledger | `general_ledger` |
| Import Variances | `import_variances` |
| Income Statement | `income_statement` |
| Income Statement - Comparative | `income_statement_comparative` |
| Income Statement - Property Comparison | `income_statement_comparison` |
| Income Statement (Date Range) | `income_statement_date_range` |
| Insurance Usage | `insurance_usage` |
| Late Fee Policy Comparison | `late_fee_policy_comparison` |
| Loans | `loans` |
| Trial Balance | `trial_balance` |
| Trial Balance by Property | `trial_balance_by_property` |
| Trust Account Balance | `trust_account_balance` |
| Trust Account Detail | `trust_account_balance_detail` |
| Cash Flow - 12 Month | `twelve_month_cash_flow` |
| Income Statement - 12 Month | `twelve_month_income_statement` |

</details>

<details>
<summary><strong>Reports: Leasing</strong> (16 reports)</summary>

| Report | ID |
|---|---|
| Guest Card Inquiries | `guest_card_inquiries` |
| Guest Card Interests | `guest_cards` |
| Historical Advertised Rent | `historical_advertised_rent` |
| Inactive Guest Card Interests | `inactive_guest_cards` |
| Lease Expiration Detail By Month | `lease_expiration_detail` |
| Lease Expiration Summary By Month | `lease_expiration_summary` |
| Lease History | `lease_history` |
| Leasing Agent Performance | `leasing_agent_performance` |
| Leasing Funnel Performance | `leasing_funnel_performance` |
| Leasing Summary | `leasing_summary` |
| Prospect Source Tracking | `prospect_source_tracking` |
| Renewal Summary | `renewal_summary` |
| Rental Applications | `rental_applications` |
| Screening Assessments | `screening_assessments` |
| Screening Usage | `screening_usage` |
| Showings | `showings` |

</details>

<details>
<summary><strong>Reports: Maintenance & Workflow</strong> (12 reports)</summary>

| Report | ID |
|---|---|
| Association Work Order | `association_work_order` |
| Cancelled Workflows | `cancelled_processes` |
| Completed Workflows | `completed_processes` |
| Realm-X Flows Assigned Tasks | `flows_assigned_tasks` |
| In-Progress Workflows | `in_progress_workflows` |
| Inspection Detail | `inspection_detail` |
| Project Budget Detail | `project_budget_detail` |
| Project Directory | `project_directory` |
| Unit Inspection | `unit_inspection` |
| Activities Summary | `upcoming_activities` |
| Work Order | `work_order` |
| Work Order Labor Summary | `work_order_labor_summary` |

</details>

<details>
<summary><strong>Reports: Other</strong> (2 reports)</summary>

| Report | ID |
|---|---|
| Receivables Activity | `receivables_activity` |
| Survey Responses | `surveys_summary` |

</details>

<details>
<summary><strong>Reports: Owner</strong> (6 reports)</summary>

| Report | ID |
|---|---|
| Owner Custom Fields | `owner_custom_fields` |
| Owner Directory | `owner_directory` |
| Owner Leasing | `owner_leasing` |
| Owner Withholdings | `owner_withholdings` |
| Owner 1099 Summary | `owner1099` |
| Owner 1099 Detail | `owner1099_detail` |

</details>

<details>
<summary><strong>Reports: Property & Unit</strong> (19 reports)</summary>

| Report | ID |
|---|---|
| Amenities By Property | `amenities_by_property` |
| AppFolio Stack™ Usage | `appfolio_stack_usage` |
| Inventory Status | `inventory_status` |
| Inventory Usage | `inventory_usage` |
| Keys Detail | `keys_detail` |
| Occupancy Custom Fields | `occupancy_custom_fields` |
| Occupancy Summary | `occupancy_summary` |
| Premium Listing Billing Detail | `premium_leads_billing_detail` |
| Property Budget | `property_budget` |
| Property Custom Fields | `property_custom_fields` |
| Property Directory | `property_directory` |
| Property Group Directory | `property_group_directory` |
| Property Performance | `property_performance` |
| Property Staff Assignments | `property_staff_assignments` |
| Rentable Items | `rentable_items` |
| Unit Custom Fields | `unit_custom_fields` |
| Unit Directory | `unit_directory` |
| Unit Turn Detail | `unit_turn_detail` |
| Unit Vacancy Detail | `unit_vacancy` |

</details>

<details>
<summary><strong>Reports: Registers & Transactions</strong> (9 reports)</summary>

| Report | ID |
|---|---|
| Bill Detail | `bill_detail` |
| Charge Detail | `charge_detail` |
| Check Register | `check_register` |
| Check Register Detail (Enhanced) | `check_register_detail` |
| Deposit Register | `deposit_register` |
| Expense Register | `expense_register` |
| Income Register | `income_register` |
| Payment Plans | `payment_plans` |
| Purchase Order | `purchase_order` |

</details>

<details>
<summary><strong>Reports: Rent Roll</strong> (5 reports)</summary>

| Report | ID |
|---|---|
| Gross Potential Rent | `gross_potential_rent_enhanced` |
| Rent Roll | `rent_roll` |
| Rent Roll (Commercial) | `rent_roll_commercial` |
| Rent Roll (Itemized) | `rent_roll_itemized` |
| Rent Roll (By Bed) | `student_housing_rent_roll_by_bed` |

</details>

<details>
<summary><strong>Reports: Tenant</strong> (13 reports)</summary>

| Report | ID |
|---|---|
| Delinquency | `delinquency` |
| Delinquency (As Of) | `delinquency_as_of` |
| Renter Directory | `renter_directory` |
| Resident Financial Activity | `resident_financial_activity` |
| Security Deposit Funds Detail | `security_deposit_funds_detail` |
| Debt Collections Status | `tenant_debt_collections_status` |
| Tenant Directory | `tenant_directory` |
| Tenant Ledger | `tenant_ledger` |
| Tenant Tickler | `tenant_tickler` |
| Tenant Transactions Summary | `tenant_transactions_summary` |
| Tenant Unpaid Charges Summary | `tenant_unpaid_charges_summary` |
| Tenant Vehicle Info | `tenant_vehicle_info` |
| Unpaid Balances by Month | `unpaid_balances_by_month` |

</details>

<details>
<summary><strong>Reports: Vendor</strong> (5 reports)</summary>

| Report | ID |
|---|---|
| Vendor Custom Fields | `vendor_custom_fields` |
| Vendor Directory | `vendor_directory` |
| Vendor Ledger | `vendor_ledger` |
| Vendor Ledger (Enhanced) | `vendor_ledger_enhanced` |
| Vendor 1099 Summary | `vendor1099` |

</details>

<details>
<summary><strong>Database API: Accounting</strong> (30 endpoints)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/bank_accounts` | `get_bank_accounts` |
| POST | `/bank_accounts/bulk` | `post_bank_accounts_bulk` |
| GET | `/bills` | `get_bills` |
| POST | `/bills` | `post_bills` |
| PATCH | `/bills/{billId}` | `patch_bills_billid` |
| POST | `/bills/{BillId}/attachments` | `post_bills_billid_attachments` |
| POST | `/bills/bulk` | `post_bills_bulk` |
| POST | `/bills/bulk/async` | `post_bills_bulk_async` |
| GET | `/charges` | `get_charges` |
| POST | `/charges` | `post_charges` |
| POST | `/charges/{ChargeId}/attachments` | `post_charges_chargeid_attachments` |
| POST | `/charges/bulk` | `post_charges_bulk` |
| POST | `/charges/bulk/async` | `post_charges_bulk_async` |
| GET | `/delinquent_charges` | `get_delinquent_charges` |
| GET | `/gl_accounts` | `get_gl_accounts` |
| POST | `/gl_accounts/bulk` | `post_gl_accounts_bulk` |
| GET | `/gl_details` | `get_gl_details` |
| GET | `/journal_entries` | `get_journal_entries` |
| POST | `/journal_entries` | `post_journal_entries` |
| PATCH | `/journal_entries/{JournalEntryId}` | `patch_journal_entries_journalentryid` |
| POST | `/journal_entries/{JournalEntryId}/attachments` | `post_journal_entries_journalentryid_attachments` |
| POST | `/journal_entries/bulk` | `post_journal_entries_bulk` |
| GET | `/late_fee_policies` | `get_late_fee_policies` |
| POST | `/late_fee_policies/bulk` | `post_late_fee_policies_bulk` |
| GET | `/payables` | `get_payables` |
| GET | `/recurring_charges` | `get_recurring_charges` |
| POST | `/recurring_charges` | `post_recurring_charges` |
| PATCH | `/recurring_charges/{recurringChargeId}` | `patch_recurring_charges_recurringchargeid` |
| POST | `/recurring_charges/bulk` | `post_recurring_charges_bulk` |
| GET | `/tenant_ledgers` | `get_tenant_ledgers` |

</details>

<details>
<summary><strong>Database API: Community Associations</strong> (12 endpoints)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/ca/associations` | `get_ca_associations` |
| GET | `/ca/bank_balances` | `get_ca_bank_balances` |
| GET | `/ca/board_members` | `get_ca_board_members` |
| GET | `/ca/homeowner_ledgers` | `get_ca_homeowner_ledgers` |
| GET | `/ca/homeowners` | `get_ca_homeowners` |
| GET | `/ca/renters` | `get_ca_renters` |
| GET | `/ca/rules` | `get_ca_rules` |
| GET | `/ca/units` | `get_ca_units` |
| GET | `/ca/violations` | `get_ca_violations` |
| POST | `/ca/violations` | `post_ca_violations` |
| PATCH | `/ca/violations/{violationId}` | `patch_ca_violations_violationid` |
| POST | `/ca/violations/{violationId}/attachments` | `post_ca_violations_violationid_attachments` |

</details>

<details>
<summary><strong>Database API: Corporate Accounting</strong> (2 endpoints)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/corporate_entities` | `get_corporate_entities` |
| POST | `/corporate/gl_accounts/bulk` | `post_corporate_gl_accounts_bulk` |

</details>

<details>
<summary><strong>Database API: Custom Fields</strong> (1 endpoints)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/custom_fields` | `get_custom_fields` |

</details>

<details>
<summary><strong>Database API: Leasing</strong> (20 endpoints)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/leads` | `get_leads` |
| POST | `/leads` | `post_leads` |
| POST | `/leads/{GuestCardId}/notes` | `post_leads_guestcardid_notes` |
| PATCH | `/leads/{GuestCardId}/notes/{Id}` | `patch_leads_guestcardid_notes_id` |
| PATCH | `/leads/{leadId}` | `patch_leads_leadid` |
| GET | `/leads/notes` | `get_leads_notes` |
| GET | `/leases` | `get_leases` |
| PATCH | `/leases/{LeaseId}` | `patch_leases_leaseid` |
| GET | `/leases/renewal_pricings` | `get_leases_renewal_pricings` |
| PUT | `/leases/renewal_pricings/bulk` | `put_leases_renewal_pricings_bulk` |
| GET | `/listings` | `get_listings` |
| GET | `/rental_applications` | `get_rental_applications` |
| PATCH | `/rental_applications/{rentalApplicationId}` | `patch_rental_applications_rentalapplicationid` |
| POST | `/rental_applications/{RentalApplicationId}/attachments` | `post_rental_applications_rentalapplicationid_attachments` |
| POST | `/rental_applications/{RentalApplicationId}/notes` | `post_rental_applications_rentalapplicationid_notes` |
| PATCH | `/rental_applications/{RentalApplicationId}/notes/{Id}` | `patch_rental_applications_rentalapplicationid_notes_id` |
| GET | `/rental_applications/notes` | `get_rental_applications_notes` |
| GET | `/showings` | `get_showings` |
| POST | `/showings` | `post_showings` |
| PATCH | `/showings/{showingId}` | `patch_showings_showingid` |

</details>

<details>
<summary><strong>Database API: Maintenance</strong> (29 endpoints)</summary>

| Method | Path | Operation ID |
|---|---|---|
| POST | `/inspections` | `post_inspections` |
| DELETE | `/inspections/{InspectionId}` | `delete_inspections_inspectionid` |
| PATCH | `/inspections/{InspectionId}` | `patch_inspections_inspectionid` |
| POST | `/inspections/{InspectionId}/attachments` | `post_inspections_inspectionid_attachments` |
| POST | `/inspections/bulk` | `post_inspections_bulk` |
| GET | `/inventories` | `get_inventories` |
| POST | `/inventories` | `post_inventories` |
| DELETE | `/inventories/{Id}` | `delete_inventories_id` |
| PATCH | `/inventories/{Id}` | `patch_inventories_id` |
| POST | `/inventories/bulk` | `post_inventories_bulk` |
| GET | `/inventory_locations` | `get_inventory_locations` |
| POST | `/inventory_locations` | `post_inventory_locations` |
| PATCH | `/inventory_locations/{Id}` | `patch_inventory_locations_id` |
| POST | `/inventory_locations/bulk` | `post_inventory_locations_bulk` |
| GET | `/vendors` | `get_vendors` |
| POST | `/vendors` | `post_vendors` |
| PATCH | `/vendors/{vendorId}` | `patch_vendors_vendorid` |
| POST | `/vendors/{VendorId}/notes` | `post_vendors_vendorid_notes` |
| PATCH | `/vendors/{VendorId}/notes/{Id}` | `patch_vendors_vendorid_notes_id` |
| POST | `/vendors/bulk` | `post_vendors_bulk` |
| GET | `/vendors/notes` | `get_vendors_notes` |
| GET | `/work_orders` | `get_work_orders` |
| POST | `/work_orders` | `post_work_orders` |
| PATCH | `/work_orders/{workOrderId}` | `patch_work_orders_workorderid` |
| POST | `/work_orders/{WorkOrderId}/attachments` | `post_work_orders_workorderid_attachments` |
| DELETE | `/work_orders/{WorkOrderId}/attachments/{AttachmentId}` | `delete_work_orders_workorderid_attachments_attachmentid` |
| POST | `/work_orders/{WorkOrderId}/notes` | `post_work_orders_workorderid_notes` |
| PATCH | `/work_orders/{WorkOrderId}/notes/{Id}` | `patch_work_orders_workorderid_notes_id` |
| GET | `/work_orders/attachments` | `get_work_orders_attachments` |

</details>

<details>
<summary><strong>Database API: People</strong> (21 endpoints)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/owner_groups` | `get_owner_groups` |
| POST | `/owner_groups` | `post_owner_groups` |
| PATCH | `/owner_groups/{id}` | `patch_owner_groups_id` |
| GET | `/owners` | `get_owners` |
| POST | `/owners` | `post_owners` |
| GET | `/owners/{ownerId}` | `get_owners_ownerid` |
| PATCH | `/owners/{ownerId}` | `patch_owners_ownerid` |
| POST | `/owners/{OwnerId}/attachments` | `post_owners_ownerid_attachments` |
| POST | `/owners/{OwnerId}/notes` | `post_owners_ownerid_notes` |
| PATCH | `/owners/{OwnerId}/notes/{Id}` | `patch_owners_ownerid_notes_id` |
| GET | `/owners/attachments` | `get_owners_attachments` |
| POST | `/owners/bulk` | `post_owners_bulk` |
| GET | `/owners/notes` | `get_owners_notes` |
| GET | `/tenants` | `get_tenants` |
| PATCH | `/tenants/{tenantId}` | `patch_tenants_tenantid` |
| POST | `/tenants/{TenantId}/notes` | `post_tenants_tenantid_notes` |
| PATCH | `/tenants/{TenantId}/notes/{Id}` | `patch_tenants_tenantid_notes_id` |
| PATCH | `/tenants/bulk` | `patch_tenants_bulk` |
| POST | `/tenants/bulk` | `post_tenants_bulk` |
| GET | `/tenants/notes` | `get_tenants_notes` |
| GET | `/users` | `get_users` |

</details>

<details>
<summary><strong>Database API: Properties</strong> (40 endpoints)</summary>

| Method | Path | Operation ID |
|---|---|---|
| POST | `/occupancies/{OccupancyId}/attachments` | `post_occupancies_occupancyid_attachments` |
| GET | `/occupancies/documents` | `get_occupancies_documents` |
| GET | `/portfolios` | `get_portfolios` |
| PATCH | `/portfolios/{portfolioId}` | `patch_portfolios_portfolioid` |
| GET | `/properties` | `get_properties` |
| PATCH | `/properties/{propertyId}` | `patch_properties_propertyid` |
| POST | `/properties/{PropertyId}/attachments` | `post_properties_propertyid_attachments` |
| POST | `/properties/{PropertyId}/marketing_photos` | `post_properties_propertyid_marketing_photos` |
| DELETE | `/properties/{PropertyId}/marketing_photos/{MarketingPhotoId}` | `delete_properties_propertyid_marketing_photos_marketingphotoid` |
| PATCH | `/properties/{PropertyId}/marketing_photos/{MarketingPhotoId}` | `patch_properties_propertyid_marketing_photos_marketingphotoid` |
| POST | `/properties/{PropertyId}/notes` | `post_properties_propertyid_notes` |
| PATCH | `/properties/{PropertyId}/notes/{Id}` | `patch_properties_propertyid_notes_id` |
| POST | `/properties/{PropertyId}/photos` | `post_properties_propertyid_photos` |
| DELETE | `/properties/{PropertyId}/photos/{PhotoId}` | `delete_properties_propertyid_photos_photoid` |
| PATCH | `/properties/{PropertyId}/photos/{PhotoId}` | `patch_properties_propertyid_photos_photoid` |
| GET | `/properties/attachments` | `get_properties_attachments` |
| POST | `/properties/bulk` | `post_properties_bulk` |
| GET | `/properties/marketing_photos` | `get_properties_marketing_photos` |
| GET | `/properties/notes` | `get_properties_notes` |
| GET | `/properties/photos` | `get_properties_photos` |
| GET | `/property_groups` | `get_property_groups` |
| PATCH | `/property_groups/{propertyGroupId}` | `patch_property_groups_propertygroupid` |
| GET | `/unit_types` | `get_unit_types` |
| PATCH | `/unit_types/{unitTypeId}` | `patch_unit_types_unittypeid` |
| POST | `/unit_types/bulk` | `post_unit_types_bulk` |
| GET | `/units` | `get_units` |
| PATCH | `/units/{unitId}` | `patch_units_unitid` |
| POST | `/units/{UnitId}/attachments` | `post_units_unitid_attachments` |
| POST | `/units/{UnitId}/notes` | `post_units_unitid_notes` |
| PATCH | `/units/{UnitId}/notes/{Id}` | `patch_units_unitid_notes_id` |
| POST | `/units/{UnitId}/photos` | `post_units_unitid_photos` |
| DELETE | `/units/{UnitId}/photos/{PhotoId}` | `delete_units_unitid_photos_photoid` |
| PATCH | `/units/{UnitId}/photos/{PhotoId}` | `patch_units_unitid_photos_photoid` |
| PUT | `/units/{UnitId}/pricing_matrices` | `put_units_unitid_pricing_matrices` |
| GET | `/units/attachments` | `get_units_attachments` |
| POST | `/units/bulk` | `post_units_bulk` |
| GET | `/units/notes` | `get_units_notes` |
| GET | `/units/photos` | `get_units_photos` |
| PUT | `/units/pricing_matrices/bulk` | `put_units_pricing_matrices_bulk` |
| PUT | `/units/pricing_matrices/bulk/async` | `put_units_pricing_matrices_bulk_async` |

</details>

<details>
<summary><strong>Database API: System</strong> (1 endpoints)</summary>

| Method | Path | Operation ID |
|---|---|---|
| GET | `/jobs` | `get_jobs` |

</details>


## Contributing

Contributions and issues are welcome. Please open an issue first before submitting a PR.

## License

AGPL-3.0: free for personal and open-source use. Organizations that cannot comply with the AGPL can purchase a commercial license, and hosted/managed versions are available. See [COMMERCIAL.md](https://github.com/NightSquawk/appfolio-mcp-server/blob/v1.0.0/COMMERCIAL.md) or contact hello@nightsquawk.tech.

### Copyright

For copyright concerns or takedown requests, contact hello@nightsquawk.tech.
