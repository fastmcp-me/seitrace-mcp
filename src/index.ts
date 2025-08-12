// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { API_BASE_URL, SERVER_NAME, SERVER_VERSION } from './constants.js';
import { server } from './mcp.js';

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
