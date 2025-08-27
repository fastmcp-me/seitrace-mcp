#!/usr/bin/env node

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import http from 'http';
import { URL } from 'url';

import { SERVER_NAME, SERVER_VERSION } from './constants.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  CallToolRequest,
  CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';
import { handlerMap } from './handlers/index.js';
import { toolListHandler } from './handlers/tools_list.js';
import { McpResponse } from './utils/index.js';

async function cleanup() {
  console.error('Shutting down MCP server (sse)...');
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

const port = Number(process.env.PORT || 3333);
const host = String(process.env.HOST || '127.0.0.1');

const sessionMap = new Map<string, SSEServerTransport>();
const sessionApiKeyMap = new Map<string, string>();

const mcpServer = new Server(
  { name: SERVER_NAME, version: SERVER_VERSION },
  { capabilities: { tools: {} } }
);

mcpServer.setRequestHandler(ListToolsRequestSchema, toolListHandler);
mcpServer.setRequestHandler(
  CallToolRequestSchema,
  async (request: CallToolRequest, { authInfo }): Promise<CallToolResult> => {
    const { name: toolName, arguments: toolArgs } = request.params;
    if (!Object.keys(handlerMap).includes(toolName)) {
      console.error(`Error: Unknown tool requested: ${toolName}`);
      return McpResponse(JSON.stringify({ error: `Error: Unknown tool requested: ${toolName}` }));
    }
    const handler = (handlerMap as any)[toolName];
    return await handler(toolArgs, authInfo?.token);
  }
);
const httpServer = http.createServer(async (req, res) => {
  try {
    const rawUrl = req.url || '/';
    const [pathnameRaw, queryRaw] = rawUrl.split('?');
    const pathname = pathnameRaw || '/';
    const searchParams = new URLSearchParams(queryRaw || '');
    const apiKey =
      pathname.replace('/message', '').replace('/sse', '').replace(/^\//, '') || undefined;

    // Establish SSE connection
    if (req.method === 'GET' && pathname.startsWith('/sse')) {
      // POST endpoint for messages (relative); sessionId is appended in event from transport
      const transport = new SSEServerTransport(`/message${apiKey ? `/${apiKey}` : ''}`, res);
      if (apiKey) {
        sessionApiKeyMap.set(transport.sessionId, apiKey);
      }
      await mcpServer.connect(transport);
      sessionMap.set(transport.sessionId, transport);
      transport.onclose = () => {
        sessionMap.delete(transport.sessionId);
      };
      return;
    }

    // Handle POST messages for a specific session
    if (req.method === 'POST' && pathname.startsWith('/message')) {
      const sessionId = searchParams.get('sessionId') || '';
      const transport = sessionMap.get(sessionId);
      const apiKey = sessionApiKeyMap.get(sessionId);
      if (!transport) {
        res.writeHead(404).end('Unknown session');
        return;
      }
      // override request
      (req as any).auth = {
        token: apiKey,
      };
      await transport.handlePostMessage(req as any, res as any);
      return;
    }

    res.writeHead(404).end('Not found');
  } catch (err: any) {
    res.writeHead(500).end('Internal error');
    console.error('SSE server error:', err?.message || err);
  }
});

async function main() {
  try {
    httpServer.listen(port, host, () => {
      console.error(
        `${SERVER_NAME} MCP Server (v${SERVER_VERSION}) running on SSE http://${host}:${port}`
      );
      console.error(`- Connect via GET /sse, then POST messages to /message?sessionId=...`);
    });
  } catch (error) {
    console.error('Error during server (sse) startup:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error in main execution (sse):', error);
  process.exit(1);
});
