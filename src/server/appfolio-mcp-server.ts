import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export class AppfolioMCPServer {
  private static instance: McpServer | null = null;

  private constructor() {}

  public static GetServer(): McpServer {
    if (AppfolioMCPServer.instance === null) {
      AppfolioMCPServer.instance = new McpServer(
        {
          name: "AppFolio MCP Server",
          version: "0.0.1",
        },
        {
          capabilities: {
            tools: {},
          },
        }
      );
    }
    return AppfolioMCPServer.instance;
  }
}
