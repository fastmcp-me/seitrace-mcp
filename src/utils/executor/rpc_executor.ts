import axios, { AxiosRequestConfig } from 'axios';
import { ZodError } from 'zod';

import { McpToolDefinition, JsonObject } from '../../types.js';
import { McpResponse } from '../mcp_response.js';
import { getZodSchemaFromJsonSchema } from '../schema.js';
import { endpointDefinitionMap as rpcEndpointMap } from '../../topics/general/resources/rpc/definition.js';

export interface RpcExecutorParams {
  toolName: string;
  definition: McpToolDefinition;
  toolArgs: JsonObject;
}

/**
 * Execute a JSON-RPC call to Sei EVM or Cosmos RPC endpoints.
 * endpoint resolution:
 * - prefer explicit `endpoint` in args
 * - else require `chain_id` and pick the first endpoint from our static map
 */
export const executeRpcTool = async (
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

    const rpcMethod = String(validatedArgs['rpc_method']);
    const params = Array.isArray(validatedArgs['params']) ? validatedArgs['params'] : [];
    const overrideEndpoint =
      typeof validatedArgs['endpoint'] === 'string' ? (validatedArgs['endpoint'] as string) : '';
    const chainId = typeof validatedArgs['chain_id'] === 'string' ? validatedArgs['chain_id'] : '';

    // Determine target URL
    let url = overrideEndpoint;
    if (!url) {
      if (!chainId) {
        return McpResponse(
          "Missing 'endpoint' or 'chain_id'. Provide a custom endpoint or one of: pacific-1, atlantic-2."
        );
      }
      const conn = (rpcEndpointMap.get('RpcController-getConnectionDetails') as any)?.staticResponse;
      const chainCfg = conn?.[chainId];
      if (!chainCfg) {
        return McpResponse(`Unknown chain_id '${chainId}'. Expected pacific-1 or atlantic-2.`);
      }
      const isCosmos = /callCosmosRpc$/i.test(definition.name) || /call_cosmos_rpc$/.test(toolName);
      const arr = isCosmos ? chainCfg?.cosmos?.rpc : chainCfg?.evm?.rpc;
      if (!Array.isArray(arr) || !arr.length) {
        return McpResponse(
          `No ${isCosmos ? 'Cosmos' : 'EVM'} RPC endpoints configured for chain '${chainId}'.`
        );
      }
      url = String(arr[0]);
    }

    const payload = {
      jsonrpc: '2.0',
      id: 1,
      method: rpcMethod,
      params: params,
    };

    const config: AxiosRequestConfig = {
      method: 'POST',
      url,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      data: payload,
    };

    // Log to stderr for debugging
    // console.log(`Executing RPC tool "${toolName}": POST ${url} method=${rpcMethod}`);

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

    return McpResponse(`RPC Response (Status: ${response.status}):\n${responseText}`);
  } catch (error: any) {
    const msg = error?.response?.data
      ? JSON.stringify(error.response.data)
      : error?.message || String(error);
    console.error(`Error during RPC execution of '${toolName}':`, msg);
    return McpResponse(msg);
  }
};
