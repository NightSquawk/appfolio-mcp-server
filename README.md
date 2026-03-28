# AppFolio MCP Server

MCP server for querying AppFolio property management data via the [Reporting API v2](https://help.appfolio.com/s/article/Reporting-API-Overview). Provides ~48 read-only report tools for financial, leasing, property, tenant, and maintenance data.

## Prerequisites

- Node.js 18+
- AppFolio Reporting API credentials (Client ID + Client Secret) from **Account Settings > Manage API Settings > Reports API Credentials**

## Setup

```bash
npm install
npm run build
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `APPFOLIO_VHOST` | Yes | Your AppFolio database name (the subdomain in `{vhost}.appfolio.com`) |
| `APPFOLIO_CLIENT_ID` | Yes | Reports API Client ID |
| `APPFOLIO_CLIENT_SECRET` | Yes | Reports API Client Secret |

## Claude Code Configuration

Add to your `.mcp.json`:

```json
{
  "appfolio": {
    "command": "node",
    "args": ["<path-to>/appfolio-mcp-server/dist/index.js"],
    "env": {
      "APPFOLIO_VHOST": "yourcompany",
      "APPFOLIO_CLIENT_ID": "<client-id>",
      "APPFOLIO_CLIENT_SECRET": "<client-secret>"
    }
  }
}
```

For multiple AppFolio databases, add separate entries with different names and credentials.

## Available Reports (48 tools)

### Financial (13)
`report_aged_payables` `report_aged_receivables` `report_balance_sheet` `report_budget_comparison` `report_budget_forecast` `report_cash_flow` `report_chart_of_accounts` `report_expense_distribution` `report_fixed_assets` `report_income_statement_12_month` `report_income_statement_date_range` `report_loans` `report_trial_balance`

### Registers (4)
`report_check_register` `report_deposit_register` `report_expense_register` `report_income_register`

### Leasing (8)
`report_guest_card_inquiries` `report_leasing_funnel_performance` `report_leasing_summary` `report_rental_applications` `report_rent_roll_itemized` `report_renewal_summary` `report_screening_assessments` `report_lease_expirations`

### Property & Unit (7)
`report_occupancy_summary` `report_property_directory` `report_property_group_directory` `report_property_performance` `report_property_source_tracking` `report_unit_directory` `report_unit_vacancy_detail`

### Tenant & Owner (9)
`report_delinquency` `report_owner_directory` `report_owner_leasing` `report_owner_statement` `report_receivables_activity` `report_resident_financial_activity` `report_security_deposit_funds_detail` `report_tenant_directory` `report_tenant_ledger`

### Maintenance & Workflow (5)
`report_work_order` `report_work_order_labor_summary` `report_completed_processes` `report_in_progress_processes` `report_cancelled_processes`

### Other (2)
`report_account_totals` `report_property_account_totals`

## Rate Limiting

The AppFolio API allows 7 requests per 15 seconds. The client automatically throttles requests to stay within this limit. Pagination URL fetches are exempt from rate limiting per the API spec.

## Pagination

Reports returning >5,000 rows are automatically paginated. The client follows `next_page_url` links and aggregates all pages into a single response. Pagination URLs are valid for 30 minutes.

Set `paginate_results: false` to disable pagination (may timeout on large datasets).
