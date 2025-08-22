#!/usr/bin/env node

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { URL } from 'url';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema, CallToolRequestSchema, CallToolRequest, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { SERVER_NAME, SERVER_VERSION } from './constants.js';
import { handlerMap } from './handlers/index.js';
import { toolListHandler } from './handlers/tools_list.js';
import { McpResponse } from './utils/index.js';

async function cleanup() {
  console.error('Shutting down MCP server (httpstream)...');
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

async function main() {
  const port = Number(process.env.PORT || 3344);
  const host = String(process.env.HOST || '127.0.0.1');

  // MCP Server paired with Streamable HTTP transport
  const mcpServer = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } }
  );
  mcpServer.setRequestHandler(ListToolsRequestSchema, toolListHandler);
  mcpServer.setRequestHandler(
    CallToolRequestSchema,
    async (request: CallToolRequest): Promise<CallToolResult> => {
      const { name: toolName, arguments: toolArgs } = request.params;
      if (!Object.keys(handlerMap).includes(toolName)) {
        console.error(`Error: Unknown tool requested: ${toolName}`);
        return McpResponse(JSON.stringify({ error: `Error: Unknown tool requested: ${toolName}` }));
      }
      const handler = (handlerMap as any)[toolName];
      return await handler(toolArgs);
    }
  );

  const transport = new StreamableHTTPServerTransport({
    // Provide a simple session ID generator for stream sessions
    sessionIdGenerator: () => `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`,
    // enableJsonResponse: true, // optional: force JSON responses instead of SSE
  });

  await mcpServer.connect(transport);

  const httpServer = http.createServer(async (req, res) => {
    try {
  const baseHost = req.headers.host || `${host}:${port}`;
  const parsed = new URL(req.url || '', `http://${baseHost}`);
      const pathname = parsed.pathname || '/';

      // Simple health
      if (req.method === 'GET' && pathname === '/') {
        res.writeHead(200, { 'content-type': 'text/plain' }).end('ok');
        return;
      }

      // Delegate to the SDK transport for spec-compliant streamable HTTP
      await transport.handleRequest(req as any, res as any);
    } catch (err: any) {
      res.writeHead(500).end('Internal error');
      console.error('HTTP stream server error:', err?.message || err);
    }
  });

  httpServer.listen(port, host, () => {
    console.error(`${SERVER_NAME} MCP Server (v${SERVER_VERSION}) running on HTTP stream http://${host}:${port}`);
    console.error(`- Use Streamable HTTP per MCP spec: GET (SSE) or POST with proper headers`);
  });
}

main().catch((error) => {
  console.error('Fatal error in main execution (httpstream):', error);
  process.exit(1);
});
