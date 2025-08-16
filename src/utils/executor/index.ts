import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpToolDefinition, JsonObject } from '../../types.js';
import { executeApiTool } from './api_executor.js';

// Executor registry and getter (typed params)
export type ExecutorType = 'api' | 'rpc' | 'graphql';

/**
 * Parameters for the API executor.
 */
export interface ApiExecutorParams {
  toolName: string;
  definition: McpToolDefinition;
  toolArgs: JsonObject;
  securitySchemes: any;
  baseUrl: string;
}

export type Executor = (params: any) => Promise<CallToolResult>;

/**
 * Map of available executor functions by type.
 */
const EXECUTOR_MAP: Record<ExecutorType, Executor> = {
  api: (params: ApiExecutorParams) =>
    executeApiTool(
      params.toolName,
      params.definition,
      params.toolArgs,
      params.securitySchemes,
      params.baseUrl
    ),
  rpc: async () => {
    throw new Error('UNSUPPORTED_EXECUTOR');
  },
  graphql: async () => {
    throw new Error('UNSUPPORTED_EXECUTOR');
  },
};

/**
 * Get the executor function for a specific type.
 * @param type The type of executor to retrieve.
 * @returns The executor function for the specified type.
 */
export function getExecutor(type?: ExecutorType | null): Executor {
  if (!type || type === 'api') return EXECUTOR_MAP.api;
  const exec = EXECUTOR_MAP[type as ExecutorType];
  if (exec) return exec;
  throw new Error('UNSUPPORTED_EXECUTOR');
}
