import { ToolResponse, formatError } from "@nightsquawktech/mcp-core/catalog";

const RATE_LIMIT_MAX = 7;
const RATE_LIMIT_WINDOW_MS = 15_000;

export class AppfolioClient {
  private vhost: string | null = null;
  private clientId: string | null = null;
  private clientSecret: string | null = null;
  private initialized = false;
  private requestTimestamps: number[] = [];

  /**
   * Lazily reads env vars on first API call, so import-time errors
   * don't crash the process before the MCP server can report them.
   */
  private ensureInitialized(): void {
    if (this.initialized) return;

    const missing: string[] = [];
    const vhost = process.env.APPFOLIO_VHOST;
    const clientId = process.env.APPFOLIO_CLIENT_ID;
    const clientSecret = process.env.APPFOLIO_CLIENT_SECRET;

    if (!vhost) missing.push("APPFOLIO_VHOST");
    if (!clientId) missing.push("APPFOLIO_CLIENT_ID");
    if (!clientSecret) missing.push("APPFOLIO_CLIENT_SECRET");

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(", ")}`
      );
    }

    this.vhost = vhost!;
    this.clientId = clientId!;
    this.clientSecret = clientSecret!;
    this.initialized = true;
  }

  /**
   * Waits if necessary to respect the 7-requests-per-15-seconds rate limit.
   * Pagination URL fetches should NOT call this — they are exempt from rate limits.
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    // Remove timestamps older than the window
    this.requestTimestamps = this.requestTimestamps.filter(
      (t) => now - t < RATE_LIMIT_WINDOW_MS
    );

    if (this.requestTimestamps.length >= RATE_LIMIT_MAX) {
      const oldest = this.requestTimestamps[0];
      const waitMs = RATE_LIMIT_WINDOW_MS - (now - oldest) + 50; // +50ms buffer
      if (waitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
      // Clean up again after waiting
      const afterWait = Date.now();
      this.requestTimestamps = this.requestTimestamps.filter(
        (t) => afterWait - t < RATE_LIMIT_WINDOW_MS
      );
    }

    this.requestTimestamps.push(Date.now());
  }

  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.clientId!}:${this.clientSecret!}`).toString("base64");
    return `Basic ${credentials}`;
  }

  private getBaseUrl(endpoint: string): string {
    return `https://${this.vhost!}.appfolio.com/api/v2/reports/${endpoint}.json`;
  }

  /**
   * Run an AppFolio report. Handles rate limiting and auto-pagination.
   * Returns all results aggregated across pages.
   */
  async runReport(
    endpoint: string,
    params: Record<string, any>
  ): Promise<ToolResponse<any[]>> {
    try {
      this.ensureInitialized();

      // Initial request (rate-limited)
      await this.waitForRateLimit();

      const url = this.getBaseUrl(endpoint);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: this.getAuthHeader(),
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const body = await response.text();
        return {
          result: null,
          isError: true,
          error: `HTTP ${response.status}: ${body}`,
        };
      }

      const data = await response.json();

      // If paginate_results=false, the API returns a plain array
      if (Array.isArray(data)) {
        return { result: data, isError: false, error: null };
      }

      // Paginated response: { results: [...], next_page_url?: "..." }
      let allResults: any[] = data.results || [];
      let nextPageUrl: string | undefined = data.next_page_url;

      // Auto-follow pagination (these URLs bypass rate limits)
      while (nextPageUrl) {
        const pageResponse = await fetch(nextPageUrl, {
          method: "GET",
          headers: {
            Authorization: this.getAuthHeader(),
          },
        });

        if (!pageResponse.ok) {
          const body = await pageResponse.text();
          return {
            result: null,
            isError: true,
            error: `Pagination HTTP ${pageResponse.status}: ${body}`,
          };
        }

        const pageData = await pageResponse.json();

        if (Array.isArray(pageData)) {
          allResults = allResults.concat(pageData);
          nextPageUrl = undefined;
        } else {
          allResults = allResults.concat(pageData.results || []);
          nextPageUrl = pageData.next_page_url;
        }
      }

      return { result: allResults, isError: false, error: null };
    } catch (error) {
      return { result: null, isError: true, error: formatError(error) };
    }
  }
}

export const appfolioClient = new AppfolioClient();
