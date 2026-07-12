import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { createCatalogStore } from "@nightsquawktech/mcp-core/catalog";

/**
 * Types + loader for the AppFolio report catalog.
 *
 * The catalog is the single source of truth for every report endpoint and its
 * parameters, generated from the official "AppFolio Reports API (2.0.0)" reference
 * (one JSON file per endpoint under ./reports/, plus an aggregate ./index.json).
 *
 * The consolidated MCP tools (list_reports / describe_report / run_report) read
 * from here for discovery and request validation, so we do NOT define ~130
 * individual tools.
 */

export interface ReportParameterAttribute {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
}

export interface ReportParameter {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  format?: string;
  enum?: string[];
  description: string;
  /** Sub-keys for object params (e.g. the `properties` filter), from the request sample. */
  attributes?: ReportParameterAttribute[];
}

export interface ReportSpec {
  slug: string;
  endpoint: string;
  name: string;
  description: string;
  /** Names of top-level params that must be present for a successful request. */
  requiredFilters: string[];
  parameters: ReportParameter[];
  requestSample: Record<string, unknown>;
  /** Column keys returned by the report (empty when the doc sample was empty). */
  responseColumns: string[];
}

export interface ReportIndexEntry {
  slug: string;
  name: string;
  category: string;
  description: string;
  requiredFilters: string[];
  paramCount: number;
  endpoint: string;
}

export interface ReportIndex {
  generatedFrom: string;
  reportCount: number;
  /** Pagination params accepted by EVERY report (documented globally, not per-endpoint). */
  universalParameters: string[];
  reports: ReportIndexEntry[];
}

// Path resolution stays HERE, in the server, so it points at this server's
// bundled catalog (dist/catalog) and not at the mcp-core package. The core
// loader receives the resolved directory and never derives it from its own
// module location. Report entries live under ./reports/, not the store's
// default ./endpoints/.
const catalogDir = dirname(fileURLToPath(import.meta.url)); // dist/catalog
const store = createCatalogStore<ReportIndex>(catalogDir, { entriesSubdir: "reports" });

/** The aggregate catalog index (slug, name, category, requiredFilters per report). */
export function loadIndex(): ReportIndex {
  return store.index();
}

/** Pagination params allowed on every report regardless of endpoint. */
export function universalParameters(): string[] {
  return loadIndex().universalParameters;
}

/** Full spec for a single report, or null if the slug is unknown. */
export function loadReportSpec(slug: string): ReportSpec | null {
  // Entries live under reports/; the core store guards against path traversal.
  return store.entry<ReportSpec>(slug);
}

/** True if the slug names a real report endpoint. */
export function isKnownReport(slug: string): boolean {
  return loadIndex().reports.some((r) => r.slug === slug);
}
