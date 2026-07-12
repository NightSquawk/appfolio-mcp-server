#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { AppfolioMCPServer } from "./server/appfolio-mcp-server.js";
import { registerAllReportTools } from "./helpers/register-report-tools.js";
import { registerAllDbTools } from "./helpers/register-db-tools.js";

const server = AppfolioMCPServer.GetServer();
registerAllReportTools(server);
registerAllDbTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
