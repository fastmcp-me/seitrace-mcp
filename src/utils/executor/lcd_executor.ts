import axios, { AxiosRequestConfig } from 'axios';
import { ZodError } from 'zod';

import { McpToolDefinition, JsonObject } from '../../types.js';
import { McpResponse } from '../mcp_response.js';
import { getZodSchemaFromJsonSchema } from '../schema.js';
import { endpointDefinitionMap as rpcEndpointMap } from '../../topics/general/resources/rpc_lcd/definition.js';

export const executeLcdTool = async (
  toolName: string,
  definition: McpToolDefinition,
  toolArgs: JsonObject
) => {
  try {
    // Validate args against provided JSON schema
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
        return McpResponse(validationErrorMessage);
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return McpResponse(
          `Internal error during validation setup: ${errorMessage}. Try contact dev@cavies.xyz`
        );
      }
    }

    const overrideEndpoint =
      typeof validatedArgs['endpoint'] === 'string' ? (validatedArgs['endpoint'] as string) : '';
    const chainId = typeof validatedArgs['chain_id'] === 'string' ? validatedArgs['chain_id'] : '';

    // Determine target base URL
    let baseUrl = overrideEndpoint;
    if (!baseUrl) {
      if (!chainId) {
        return McpResponse(
          "Missing 'endpoint' or 'chain_id'. Provide a custom endpoint or one of: pacific-1, atlantic-2."
        );
      }
      const conn = (rpcEndpointMap.get('RpcLcdController-getConnectionDetails') as any)?.staticResponse;
      const chainCfg = conn?.[chainId];
      if (!chainCfg) {
        return McpResponse(`Unknown chain_id '${chainId}'. Expected pacific-1 or atlantic-2.`);
      }
      const arr = chainCfg?.cosmos?.lcd;
      if (!Array.isArray(arr) || !arr.length) {
        return McpResponse(`No Cosmos LCD endpoints configured for chain '${chainId}'.`);
      }
      baseUrl = String(arr[0]);
    }

    const path = String((validatedArgs as any)['path'] || '/');
    const method = String(((validatedArgs as any)['method'] || 'GET')).toUpperCase();
    const query = (validatedArgs as any)['query'] || {};
    const body = (validatedArgs as any)['body'];
    const base = baseUrl.replace(/\/$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;

    const config: AxiosRequestConfig = {
      method: method as any,
      url: `${base}${p}`,
      params: query,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      ...(method !== 'GET' && typeof body !== 'undefined' ? { data: body } : {}),
    };

    const response = await axios(config);
    const contentType = response.headers['content-type']?.toLowerCase() || '';
    let responseText = '';
    if (contentType.includes('application/json')) {
      try {
        responseText = JSON.stringify(response.data);
      } catch {
        responseText = '[Stringify Error]';
      }
    } else if (typeof response.data === 'string') {
      responseText = response.data;
    } else {
      responseText = String(response.data);
    }

    return McpResponse(responseText);
  } catch (error: any) {
    const msg = error?.response?.data
      ? JSON.stringify(error.response.data)
      : error?.message || String(error);
    console.error(`Error during LCD execution of '${toolName}':`, msg);
    return McpResponse(msg);
  }
};
