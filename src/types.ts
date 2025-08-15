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
