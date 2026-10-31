import { ToolResponse, formatError } from "@nightsquawktech/mcp-core/catalog";
import { HttpMethod } from "../catalog-db/endpoint-spec.js";
import { PreparedUpload, buildMultipartBody } from "../helpers/file-upload.js";

const BASE_URL = "https://api.appfolio.com/api/v0";

// Documented global rate limits per credential set: 8/sec, 256/min, 4096/hour.
const RATE_WINDOWS = [
  { max: 8, ms: 1_000 },
  { max: 256, ms: 60_000 },
  { max: 4096, ms: 3_600_000 },
];
const MAX_429_RETRIES = 4;
// Uploads get a hard deadline. On timeout or a dropped connection the outcome is
// unknown (AppFolio may already have stored the file), so uploads are never
// retried automatically -- only 429s, which AppFolio rejects without processing.
const DEFAULT_UPLOAD_TIMEOUT_MS = 120_000;

function uploadTimeoutMs(): number {
  const raw = Number(process.env.APPFOLIO_DB_UPLOAD_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_UPLOAD_TIMEOUT_MS;
}

export interface DbRequestOptions {
  /** Values substituted into {param} placeholders in the path. */
  pathParams?: Record<string, string | number>;
  /** filters[Key]=value query params (GET). */
  filters?: Record<string, any>;
  /** Additional raw query params (rare). */
  query?: Record<string, any>;
  /** page[number] / page[size] for GET list endpoints. */
  page?: { number?: number; size?: number };
  /** JSON request body (writes). Ignored when `multipart` is set. */
  body?: any;
  /**
   * Send a multipart/form-data upload instead of JSON: the file under
   * `fileField`, plus optional scalar form `fields`.
   */
  multipart?: { fileField: string; file: PreparedUpload; fields?: Record<string, unknown> };
  /** Follow next_page_path and aggregate all pages (GET). Default true. */
  paginate?: boolean;
}

export class AppfolioDbClient {
  private clientId: string | null = null;
  private clientSecret: string | null = null;
  private developerId: string | null = null;
  private initialized = false;
  private requestTimestamps: number[] = [];

  /**
   * Lazily reads env vars on first API call, so import-time errors don't crash
   * the process before the MCP server can report them.
   */
  private ensureInitialized(): void {
    if (this.initialized) return;

    const missing: string[] = [];
    const clientId = process.env.APPFOLIO_DB_CLIENT_ID;
    const clientSecret = process.env.APPFOLIO_DB_CLIENT_SECRET;
    const developerId = process.env.APPFOLIO_DB_DEVELOPER_ID;

    if (!clientId) missing.push("APPFOLIO_DB_CLIENT_ID");
    if (!clientSecret) missing.push("APPFOLIO_DB_CLIENT_SECRET");
    if (!developerId) missing.push("APPFOLIO_DB_DEVELOPER_ID");

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
    }

    this.clientId = clientId!;
    this.clientSecret = clientSecret!;
    this.developerId = developerId!;
    this.initialized = true;
  }

  /** Waits if necessary to respect all three documented rate-limit windows. */
  private async waitForRateLimit(): Promise<void> {
    // Prune timestamps older than the longest window.
    const longest = RATE_WINDOWS[RATE_WINDOWS.length - 1].ms;
    let now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter((t) => now - t < longest);

    // For each window, if we're at the cap, wait until the oldest in-window request ages out.
    // Loop because waiting for one window may still leave another saturated.
    for (let guard = 0; guard < RATE_WINDOWS.length * 2; guard++) {
      now = Date.now();
      let waitMs = 0;
      for (const w of RATE_WINDOWS) {
        const inWindow = this.requestTimestamps.filter((t) => now - t < w.ms);
        if (inWindow.length >= w.max) {
          const oldest = inWindow[0];
          waitMs = Math.max(waitMs, w.ms - (now - oldest) + 50);
        }
      }
      if (waitMs <= 0) break;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      const after = Date.now();
      this.requestTimestamps = this.requestTimestamps.filter((t) => after - t < longest);
    }

    this.requestTimestamps.push(Date.now());
  }

  /**
   * Auth headers, plus Content-Type when given. Multipart requests pass none so
   * fetch can generate "multipart/form-data; boundary=..." itself.
   */
  private getHeaders(contentType?: string): Record<string, string> {
    const credentials = Buffer.from(`${this.clientId!}:${this.clientSecret!}`).toString("base64");
    const headers: Record<string, string> = {
      Authorization: `Basic ${credentials}`,
      "X-AppFolio-Developer-ID": this.developerId!,
    };
    if (contentType) headers["Content-Type"] = contentType;
    return headers;
  }

  /** Substitute {param} placeholders in the path; URL-encode each value. */
  private buildPath(path: string, pathParams?: Record<string, string | number>): string {
    return path.replace(/\{([^}]+)\}/g, (_, key) => {
      const v = pathParams?.[key];
      if (v === undefined || v === null || v === "") {
        throw new Error(`Missing path parameter "${key}" for "${path}"`);
      }
      return encodeURIComponent(String(v));
    });
  }

  private buildQuery(opts: DbRequestOptions): string {
    const parts: string[] = [];
    if (opts.filters) {
      for (const [k, v] of Object.entries(opts.filters)) {
        if (v === undefined || v === null) continue;
        // Allow callers to pass either "Id" or "filters[Id]".
        const key = /^filters\[/.test(k) ? k : `filters[${k}]`;
        const val = Array.isArray(v) ? v.join(",") : String(v);
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
      }
    }
    if (opts.query) {
      for (const [k, v] of Object.entries(opts.query)) {
        if (v === undefined || v === null) continue;
        parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
      }
    }
    if (opts.page?.number !== undefined) parts.push(`page[number]=${encodeURIComponent(String(opts.page.number))}`);
    if (opts.page?.size !== undefined) parts.push(`page[size]=${encodeURIComponent(String(opts.page.size))}`);
    return parts.length ? `?${parts.join("&")}` : "";
  }

  /**
   * One fetch with rate limiting + Retry-After-aware 429 retries. Only 429s are
   * retried (AppFolio rejected them unprocessed); network errors propagate.
   * `timeoutMs` bounds each attempt and starts after the rate-limit wait, so
   * queueing behind the limiter can never masquerade as a request timeout.
   */
  private async fetchWithRetry(url: string, init: RequestInit, timeoutMs?: number): Promise<Response> {
    for (let attempt = 0; ; attempt++) {
      await this.waitForRateLimit();
      const response = await fetch(
        url,
        timeoutMs ? { ...init, signal: AbortSignal.timeout(timeoutMs) } : init
      );
      if (response.status === 429 && attempt < MAX_429_RETRIES) {
        const retryAfter = parseInt(response.headers.get("Retry-After") || "1", 10);
        const waitMs = (Number.isFinite(retryAfter) ? retryAfter : 1) * 1000 + 100;
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }
      return response;
    }
  }

  /**
   * Execute an AppFolio Database API request. Handles auth, rate limiting,
   * 429 Retry-After, and (for GET) auto-pagination via next_page_path.
   */
  async request(
    method: HttpMethod,
    path: string,
    opts: DbRequestOptions = {}
  ): Promise<ToolResponse<any>> {
    try {
      this.ensureInitialized();

      const resolvedPath = this.buildPath(path, opts.pathParams);
      const url = `${BASE_URL}${resolvedPath}${this.buildQuery(opts)}`;

      if (opts.multipart) {
        return await this.upload(method, url, opts.multipart);
      }

      const hasBody = opts.body !== undefined && method !== "GET";
      const response = await this.fetchWithRetry(url, {
        method,
        headers: this.getHeaders(hasBody ? "application/json" : undefined),
        body: hasBody ? JSON.stringify(opts.body) : undefined,
      });

      if (!response.ok) {
        const errBody = await response.text();
        return { result: null, isError: true, error: `HTTP ${response.status}: ${errBody}` };
      }

      // DELETE / 204 responses may have no body.
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;

      // Non-paginated (writes, single-record GETs, or pagination disabled): return as-is.
      const paginate = opts.paginate !== false;
      if (
        method !== "GET" ||
        !paginate ||
        !data ||
        typeof data !== "object" ||
        !("data" in data)
      ) {
        return { result: data, isError: false, error: null };
      }

      // Paginated GET: aggregate `data` arrays across next_page_path links.
      let allData: any[] = Array.isArray(data.data) ? data.data : [];
      let nextPath: string | undefined = data.next_page_path || undefined;

      while (nextPath) {
        const nextUrl = nextPath.startsWith("http")
          ? nextPath
          : `https://api.appfolio.com${nextPath}`;
        const pageResp = await this.fetchWithRetry(nextUrl, {
          method: "GET",
          headers: this.getHeaders(),
        });
        if (!pageResp.ok) {
          const errBody = await pageResp.text();
          return { result: null, isError: true, error: `Pagination HTTP ${pageResp.status}: ${errBody}` };
        }
        const pageText = await pageResp.text();
        const pageData = pageText ? JSON.parse(pageText) : {};
        allData = allData.concat(Array.isArray(pageData.data) ? pageData.data : []);
        nextPath = pageData.next_page_path || undefined;
      }

      return { result: { data: allData }, isError: false, error: null };
    } catch (error) {
      return { result: null, isError: true, error: formatError(error) };
    }
  }

  /**
   * Send one multipart upload. The FormData is built once from in-memory bytes,
   * so a 429 retry re-sends identical content. Any failure where the request may
   * have reached AppFolio (timeout, reset connection) is reported as an unknown
   * outcome and NOT retried, to avoid duplicate attachments.
   */
  private async upload(
    method: HttpMethod,
    url: string,
    multipart: NonNullable<DbRequestOptions["multipart"]>
  ): Promise<ToolResponse<any>> {
    const form = buildMultipartBody(multipart.file, multipart.fileField, multipart.fields);
    const timeoutMs = uploadTimeoutMs();

    let response: Response;
    try {
      response = await this.fetchWithRetry(
        url,
        { method, headers: this.getHeaders(), body: form },
        timeoutMs
      );
    } catch (error: any) {
      const reason =
        error?.name === "TimeoutError" || error?.name === "AbortError"
          ? `no response within ${timeoutMs} ms`
          : `connection failed (${error?.cause?.code ?? error?.message ?? "unknown"})`;
      return {
        result: null,
        isError: true,
        error:
          `Upload outcome unknown: ${reason}. AppFolio may or may not have stored "${multipart.file.filename}". ` +
          `It was NOT retried automatically, to avoid creating a duplicate attachment. Check the record's ` +
          `existing attachments/photos before uploading again.`,
      };
    }

    let text: string;
    try {
      text = await response.text();
    } catch {
      // Status arrived but the body was cut off; the status alone is authoritative.
      text = "";
    }
    if (!response.ok) {
      return { result: null, isError: true, error: `HTTP ${response.status}: ${text}` };
    }
    // A 2xx means the file was stored; never turn an odd success body into an error.
    let data: any = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
    return { result: data, isError: false, error: null };
  }
}

export const appfolioDbClient = new AppfolioDbClient();
