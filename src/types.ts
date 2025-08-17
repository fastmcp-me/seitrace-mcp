import { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Type definition for JSON objects
 */
export type JsonObject = Record<string, any>;

/**
 * Interface for MCP Tool Definition
 */
export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Tool['inputSchema'];
  method?: string;
  pathTemplate?: string;
  executionParameters: { name: string; in: string }[];
  requestBodyContentType?: string;
  securityRequirements: any[];
  // Optional static response for local actions (no HTTP call)
  staticResponse?: any;
  // Execution handler type: 'api' uses HTTP, 'rpc' JSON-RPC, 'lcd' for Cosmos LCD, 'graphql' (future), or null for static
  executor?: 'api' | 'rpc' | 'lcd' | 'graphql' | 'gateway' | null;
  // Snippet generator type: 'oas' for OpenAPI-based snippet, 'rpc' for JSON-RPC, 'general' for plain HTTP, or null for unsupported
  snippetGenerator?: 'oas' | 'rpc' | 'general' | null;
  // Optional resolver id to post-process raw responses
  resolver?: 'associations' | string;
}

/**
 * Grouped tool definition (controller-level tool with multiple actions)
 */
export interface McpGroupedToolDefinition {
  name: string;
  actions: Record<string, McpToolDefinition>; // action_name -> endpoint def
}

/**
 * Type definition for cached OAuth tokens
 */
export interface TokenCacheEntry {
  token: string;
  expiresAt: number;
}

/**
 * Declare global __oauthTokenCache property for TypeScript
 */
declare global {
  var __oauthTokenCache: Record<string, TokenCacheEntry> | undefined;
}
