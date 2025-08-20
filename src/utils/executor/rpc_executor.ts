import axios, { AxiosRequestConfig } from 'axios';
import { ZodError } from 'zod';

import { McpToolDefinition, JsonObject } from '../../types.js';
import { McpResponse } from '../mcp_response.js';
import { getZodSchemaFromJsonSchema } from '../schema.js';
import { endpointDefinitionMap as rpcEndpointMap } from '../../topics/general/resources/rpc_lcd/definition.js';
import { formatApiResponse } from '../format_api_response.js';
import { formatApiError } from '../format_api_error.js';

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
        return McpResponse(
          JSON.stringify({
            error: validationErrorMessage,
          })
        );
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return McpResponse(
          JSON.stringify({
            error: `Internal error during validation setup: ${errorMessage}. Try contact dev@cavies.xyz`,
          })
        );
      }
    }

    // JSON-RPC specific args
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
          JSON.stringify({
            error:
              "Missing 'endpoint' or 'chain_id'. Provide a custom endpoint or one of: pacific-1, atlantic-2.",
          })
        );
      }
      const conn = (rpcEndpointMap.get('RpcLcdController-getConnectionDetails') as any)
        ?.staticResponse;
      const chainCfg = conn?.[chainId];
      if (!chainCfg) {
        return McpResponse(
          JSON.stringify({
            error: `Unknown chain_id '${chainId}'. Expected pacific-1 or atlantic-2 or arctic-1.`,
          })
        );
      }
      const isCosmos = /callCosmosRpc$/i.test(definition.name) || /call_cosmos_rpc$/.test(toolName);
      const arr = isCosmos ? chainCfg?.cosmos?.rpc : chainCfg?.evm?.rpc;
      if (!Array.isArray(arr) || !arr.length) {
        return McpResponse(
          JSON.stringify({
            error: `No ${isCosmos ? 'Cosmos' : 'EVM'} RPC endpoints configured for chain '${chainId}'.`,
          })
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

    const response = await axios(config);
    return formatApiResponse(response);
  } catch (error: any) {
    return formatApiError(error);
  }
};
