#!/usr/bin/env node

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

import { API_BASE_URL, SERVER_NAME, SERVER_VERSION } from './constants.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  CallToolRequest,
  CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';
import { handlerMap } from './handlers/index.js';
import { toolListHandler } from './handlers/tools_list.js';

/**
 * Cleanup function for graceful shutdown
 */
async function cleanup() {
  console.error('Shutting down MCP server...');
  process.exit(0);
}

// Register signal handlers
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

/**
 * Main function to start the server
 */
async function main() {
  // Set up stdio transport
  try {
    const transport = new StdioServerTransport();

    /**
     * MCP Server instance
     */
    const server = new Server(
      { name: SERVER_NAME, version: SERVER_VERSION },
      { capabilities: { tools: {} } }
    );

    // register list tools handler
    server.setRequestHandler(ListToolsRequestSchema, toolListHandler);

    // register call tool handler
    server.setRequestHandler(
      CallToolRequestSchema,
      async (request: CallToolRequest): Promise<CallToolResult> => {
        const { name: toolName, arguments: toolArgs } = request.params;
        // Check if the tool is known
        if (!Object.keys(handlerMap).includes(toolName)) {
          console.error(`Error: Unknown tool requested: ${toolName}`);
          return {
            content: [{ type: 'text', text: `Error: Unknown tool requested: ${toolName}` }],
          };
        }
        // Call the appropriate handler
        return (handlerMap as any)[toolName](toolArgs);
      }
    );

    await server.connect(transport);

    console.error(
      `${SERVER_NAME} MCP Server (v${SERVER_VERSION}) running on stdio${
        API_BASE_URL ? `, proxying API at ${API_BASE_URL}` : ''
      }`
    );
  } catch (error) {
    console.error('Error during server startup:', error);
    process.exit(1);
  }
}

// Start the server
main().catch((error) => {
  console.error('Fatal error in main execution:', error);
  process.exit(1);
});
