import axios, { AxiosRequestConfig } from 'axios';
import { ZodError } from 'zod';

import { McpToolDefinition, JsonObject } from '../../types.js';
import { McpResponse } from '../mcp_response.js';
import { getZodSchemaFromJsonSchema } from '../schema.js';
import { formatApiError, formatApiResponse } from '../index.js';

// Map chain_id -> default gateway base URL
const GATEWAY_BY_CHAIN: Record<string, string> = {
  'pacific-1': 'https://pacific-1-gateway.seitrace.com',
  'atlantic-2': 'https://atlantic-2-gateway.seitrace.com',
  'arctic-1': 'https://arctic-1-gateway.seitrace.com',
};

/**
 * Execute a gateway tool with the provided arguments.
 * @param toolName The name of the tool to execute.
 * @param definition The tool definition containing metadata and schema.
 * @param toolArgs The arguments to pass to the tool.
 * @returns The result of the tool execution.
 */
export const executeGatewayTool = async (
  toolName: string,
  definition: McpToolDefinition,
  toolArgs: JsonObject
) => {
  try {
    // Validate args
    let validatedArgs: JsonObject;
    try {
      const zodSchema = getZodSchemaFromJsonSchema(definition.inputSchema, toolName);
      const argsToParse = typeof toolArgs === 'object' && toolArgs !== null ? toolArgs : {};
      validatedArgs = zodSchema.parse(argsToParse);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const validationErrorMessage = `Invalid arguments for tool '${toolName}': ${error.errors
          .map((e) => `${e.path.join('.')} (${e.code}): ${e.message}`)
          .join(', ')}`;
        return McpResponse(
          JSON.stringify({
            error: validationErrorMessage
          })
        );
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return McpResponse(
          JSON.stringify({
            error: `Internal error during validation setup: ${errorMessage}. Try contact dev@cavies.xyz`
          })
        );
      }
    }

    // Resolve base URL
    const endpoint = typeof validatedArgs['endpoint'] === 'string' ? validatedArgs['endpoint'] : '';
    const chainId = typeof validatedArgs['chain_id'] === 'string' ? validatedArgs['chain_id'] : '';
    let baseUrl = endpoint || (chainId && GATEWAY_BY_CHAIN[chainId]) || '';
    if (!baseUrl) {
      return McpResponse(
        JSON.stringify({
          error: "Missing 'endpoint' or 'chain_id'. Provide a gateway endpoint or one of: pacific-1, atlantic-2, arctic-1."
        })
      );
    }

    // Build request
    const urlPath = definition.pathTemplate || '/api/v1/addresses/associations';
    const base = baseUrl.replace(/\/$/, '');
    const url = `${base}${urlPath}`;
    const hashes = Array.isArray(validatedArgs['hashes']) ? validatedArgs['hashes'] : [];

    const params = new URLSearchParams();
    for (const h of hashes) params.append('hashes', String(h));

    const config: AxiosRequestConfig = {
      method: 'GET',
      url,
      params,
      headers: { Accept: 'application/json' },
    };

    const response = await axios(config);
    return formatApiResponse(response);
  } catch (error: any) {
    return formatApiError(error);
  }
};
