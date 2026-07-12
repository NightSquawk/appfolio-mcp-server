# AppFolio MCP Server

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/NightSquawk/appfolio-mcp-server/badge)](https://scorecard.dev/viewer/?uri=github.com/NightSquawk/appfolio-mcp-server)

MCP server for AppFolio property management data, covering **two** AppFolio APIs, each through **3 consolidated catalog-backed tools** rather than one tool per endpoint:

- **Reporting API v2**: all **137** read-only reports (`list_reports` / `describe_report` / `run_report`). See [Reporting API Overview](https://help.appfolio.com/s/article/Reporting-API-Overview).
- **Database API v0**: all **156** record/CRUD endpoints (`list_endpoints` / `describe_endpoint` / `call_endpoint`). Reads (GET) **and** writes (POST/PATCH/PUT/DELETE) against `https://api.appfolio.com/api/v0`.

Six tools total. Each API has its own catalog (`src/catalog/` for reports, `src/catalog-db/` for the database) and its own credentials.

## Prerequisites

- Node.js 18+
- **Reporting API**: credentials (Client ID + Client Secret) from **Account Settings > Manage API Settings > Reports API Credentials**
- **Database API**: a Developer ID (Admin > Developer ID) plus Basic Auth credentials (Client ID + Client Secret) generated under **API Credentials > Basic Auth**

## Setup

```bash
npm install
npm run build
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `APPFOLIO_VHOST` | Reporting API | Your AppFolio database name (the subdomain in `{vhost}.appfolio.com`) |
| `APPFOLIO_CLIENT_ID` | Reporting API | Reports API Client ID |
| `APPFOLIO_CLIENT_SECRET` | Reporting API | Reports API Client Secret |
| `APPFOLIO_DB_DEVELOPER_ID` | Database API | Your AppFolio Developer ID (Admin > Developer ID) |
| `APPFOLIO_DB_CLIENT_ID` | Database API | Database API Basic Auth Client ID |
| `APPFOLIO_DB_CLIENT_SECRET` | Database API | Database API Basic Auth Client Secret |

Each API's tools only need their own credentials; the other set's tools simply error at call time if their vars are unset. Configure one or both. See `.env.example`.

## MCP Client Configuration

Add to your MCP client config (`.mcp.json` for Claude Code, `claude_desktop_config.json` for Claude Desktop):

```json
{
  "mcpServers": {
    "appfolio": {
      "command": "npx",
      "args": ["-y", "@nightsquawktech/appfolio-mcp-server"],
      "env": {
        "APPFOLIO_VHOST": "yourcompany",
        "APPFOLIO_CLIENT_ID": "<reports-client-id>",
        "APPFOLIO_CLIENT_SECRET": "<reports-client-secret>",
        "APPFOLIO_DB_DEVELOPER_ID": "<developer-id>",
        "APPFOLIO_DB_CLIENT_ID": "<db-client-id>",
        "APPFOLIO_DB_CLIENT_SECRET": "<db-client-secret>"
      }
    }
  }
}
```

For multiple AppFolio databases, add separate entries with different names and credentials.

## Tools

### Reporting API (read-only)

Three tools cover all 137 reports. The expected flow is **discover, describe, run**:

| Tool | Purpose |
|------|---------|
| `list_reports(category?)` | List reports (slug, name, category, required filters). Optionally filter by category. |
| `describe_report(report_name)` | Full parameter spec for one report: required/optional filters, types, enums, defaults, nested attributes, and response columns. |
| `run_report(report_name, filters?, columns?, paginate_results?, page?, limit?)` | Run a report. Validates the report name, required filters, and parameter names against the catalog before calling AppFolio. |

`run_report` rejects unknown reports (with fuzzy suggestions), unknown parameters (listing the valid ones), and missing required filters, all before any network call. Enum values are advisory (surfaced via `describe_report`) and not hard-enforced, to avoid rejecting valid inputs over documentation quirks.

### Report catalog

The reports are described in a generated catalog under `src/catalog/`:

- `src/catalog/reports/<slug>.json`: one fully-documented spec per report (parameters, requiredFilters, requestSample, responseColumns), generated from the AppFolio Reports API v2 reference documentation.
- `src/catalog/index.json`: aggregate index (slug, name, category, required filters) plus the universal pagination params.

The build copies the catalog into `dist/`. Regenerate the index after editing report specs with `node scripts/assemble-catalog.mjs`.

Reports span these categories: **Financial** (34), **Property & Unit** (19), **Association / HOA** (16), **Leasing** (16), **Tenant** (13), **Maintenance & Workflow** (12), **Registers & Transactions** (9), **Owner** (6), **Rent Roll** (5), **Vendor** (5), **Other** (2). Run `list_reports` for the full list.

### Database API (read + write)

Three tools cover all 156 v0 endpoints. Same flow: **discover, describe, call**.

| Tool | Purpose |
|------|---------|
| `list_endpoints(category?, resource?, method?, reads_only?)` | List endpoints (operationId, method, path, category, description). |
| `describe_endpoint(operation_id)` | Full spec for one endpoint: path params, query filters, request-body schema (with nested attributes), response fields, and a request sample. |
| `call_endpoint(operation_id, path_params?, filters?, body?, query?, page?, paginate_results?)` | Execute the endpoint. Validates the operationId and required path params against the catalog, then calls AppFolio. |

The `filters` argument is keyed by filter name (the `filters[...]` wrapper is added automatically), e.g. `{ LastUpdatedAtFrom: "2020-01-01T00:00:00Z" }`. Most GET list endpoints expect at least a `filters[Id]` or `filters[LastUpdatedAtFrom]` value. Filters are **advisory**: the AppFolio reference rarely enumerates every filter, so unknown filters are not rejected.

> ⚠️ **Writes are live and ungated.** `call_endpoint` executes POST/PATCH/PUT/DELETE (including bulk creates and deletes) directly against your AppFolio database. There is no confirmation gate. Use `describe_endpoint` to confirm the body schema first.

Endpoints span these categories: **Properties** (40), **Accounting** (30), **Maintenance** (29), **People** (21), **Leasing** (20), **Community Associations** (12), **Corporate Accounting** (2), **Custom Fields** (1), **System** (1). By method: 58 GET, 55 POST, 33 PATCH, 6 DELETE, 4 PUT.

#### Endpoint catalog

The endpoints are described in a generated catalog under `src/catalog-db/`:

- `src/catalog-db/endpoints/<operationId>.json`: one fully-documented spec per endpoint (method, path, pathParams, queryFilters, requestBody with nested attributes, responseFields, requestSample), generated from the AppFolio Database API reference documentation.
- `src/catalog-db/index.json`: aggregate index (operationId, resource, category, method, path).

The build copies the catalog into `dist/`. Regenerate the index after editing endpoint specs with `node scripts/assemble-catalog-db.mjs` (it validates all 156 expected operationIds are present).

## Rate Limiting

- **Reporting API**: 7 requests per 15 seconds. The client throttles to stay within this; pagination URL fetches are exempt per the API spec.
- **Database API**: 8/sec, 256/min, 4096/hour per credential set. The client throttles across all three windows and honors the `Retry-After` header on 429 responses (with bounded retries).

## Pagination

- **Reporting API**: reports >5,000 rows auto-paginate; the client follows `next_page_url` links (valid 30 min) and aggregates pages. Set `paginate_results: false` to disable.
- **Database API**: GET list endpoints auto-paginate by following `next_page_path` and aggregating `data` arrays (default page size 1000). Set `paginate_results: false` for a single page, or pass `page: { number, size }`.

## License

Licensed under the [GNU AGPL v3.0](./LICENSE). Free for personal and open-source use.

Organizations that cannot comply with the AGPL can purchase a commercial license. See [COMMERCIAL.md](./COMMERCIAL.md) or contact hello@nightsquawk.tech.
