import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { createCatalogStore } from "@nightsquawktech/mcp-core/catalog";

/**
 * Types + loader for the AppFolio Database API (v0) endpoint catalog.
 *
 * The catalog is the single source of truth for every Database API operation and
 * its parameters, generated from the official "AppFolio Database API" reference
 * (one JSON file per operation under ./endpoints/, plus an aggregate ./index.json).
 *
 * The consolidated MCP tools (list_endpoints / describe_endpoint / call_endpoint)
 * read from here for discovery and request validation, so we do NOT define ~156
 * individual tools. This mirrors the Reporting API catalog (../catalog/).
 */

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface EndpointAttribute {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
  format?: string;
  enum?: string[];
  deprecated?: boolean;
  /** Sub-fields for object / array-of-object attributes (e.g. LineItems). */
  attributes?: EndpointAttribute[];
}

export interface EndpointRequestBody {
  required?: boolean;
  description?: string;
  attributes?: EndpointAttribute[];
}

export interface EndpointSpec {
  operationId: string;
  resource: string;
  name: string;
  method: HttpMethod;
  path: string;
  description: string;
  deprecated?: boolean;
  /** true for POST/PATCH/PUT/DELETE, false for GET. */
  writeOperation: boolean;
  /** true for GET list endpoints that accept page[number]/page[size]. */
  pagination?: boolean;
  /** {param} placeholders in the path. */
  pathParams?: EndpointAttribute[];
  /** filters[...] query params for GET (often sparse — advisory, not exhaustive). */
  queryFilters?: EndpointAttribute[];
  /** Request body schema for write operations. */
  requestBody?: EndpointRequestBody;
  /** Response Schema fields (dotted/bracket names for nested, e.g. data[].Id). */
  responseFields?: EndpointAttribute[];
  requestSample?: string;
}

export interface EndpointIndexEntry {
  operationId: string;
  resource: string;
  category: string;
  name: string;
  method: HttpMethod;
  path: string;
  description: string;
  writeOperation: boolean;
  pagination: boolean;
  deprecated: boolean;
}

export interface EndpointIndex {
  generatedFrom: string;
  baseUrl: string;
  endpointCount: number;
  /** Pagination params accepted by GET list endpoints. */
  paginationParams: string[];
  categories: string[];
  endpoints: EndpointIndexEntry[];
}

// Path resolution stays HERE, in the server, so it points at this server's
// bundled catalog (dist/catalog-db) and not at the mcp-core package. The core
// loader receives the resolved directory and never derives it from its own
// module location.
const catalogDir = dirname(fileURLToPath(import.meta.url)); // dist/catalog-db
const store = createCatalogStore<EndpointIndex>(catalogDir);

/** The aggregate catalog index (operationId, resource, category, method, path per endpoint). */
export function loadDbIndex(): EndpointIndex {
  return store.index();
}

/** Full spec for a single endpoint, or null if the operationId is unknown. */
export function loadEndpointSpec(operationId: string): EndpointSpec | null {
  // Entries live under endpoints/; the core store guards against path traversal.
  return store.entry<EndpointSpec>(operationId);
}

/** True if the operationId names a real endpoint. */
export function isKnownEndpoint(operationId: string): boolean {
  return loadDbIndex().endpoints.some((e) => e.operationId === operationId);
}
