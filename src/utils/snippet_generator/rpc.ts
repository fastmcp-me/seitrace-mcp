import { getSupportedLanguages } from '@readme/oas-to-snippet/languages';

import { McpToolDefinition } from '../../types.js';
import { endpointDefinitionMap as rpcEndpointMap } from '../../topics/general/resources/rpc_lcd/definition.js';
import { generateGeneralSnippet } from './general.js';

export const SUPPORTED_RPC_SNIPPET_LANGUAGES = Object.keys(getSupportedLanguages());

/**
 * Generates a JSON-RPC call snippet (node or shell) for EVM or Cosmos RPC.
 * Uses our static connection details to hint endpoints for pacific-1 and atlantic-2.
 */
export function generateRpcSnippet(
  definition: McpToolDefinition,
  actionName: string,
  language: (typeof SUPPORTED_RPC_SNIPPET_LANGUAGES)[number],
  payload?: { rpc_method?: string; params?: any[]; endpoint?: string }
): string {
  const conn = (rpcEndpointMap.get('RpcLcdController-getConnectionDetails') as any)?.staticResponse;
  const pacific = conn?.['pacific-1'];
  const arctic = conn?.['arctic-1'];
  const atlantic = conn?.['atlantic-2'];
  const isCosmos = /callCosmosRpc$/i.test(definition.name) || /call_cosmos_rpc$/i.test(actionName);
  const pacificUrl =
    payload?.endpoint || (isCosmos ? pacific?.cosmos?.rpc?.[0] : pacific?.evm?.rpc?.[0]);
  const atlanticUrl = isCosmos ? atlantic?.cosmos?.rpc?.[0] : atlantic?.evm?.rpc?.[0];
  const arcticUrl = isCosmos ? arctic?.cosmos?.rpc?.[0] : arctic?.evm?.rpc?.[0];
  const exampleMethod = isCosmos ? 'status' : 'eth_blockNumber';
  const method = payload?.rpc_method || exampleMethod;
  const params = Array.isArray(payload?.params) ? payload?.params : [];
  const baseEndpoint = String(
    payload?.endpoint || pacificUrl || atlanticUrl || arcticUrl || '<RPC_ENDPOINT>'
  );

  // Delegate to the general snippet generator
  const snippet = generateGeneralSnippet(
    {
      baseUrl: baseEndpoint,
      path: '',
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      requestBody: { jsonrpc: '2.0', id: 1, method, params },
    },
    language as any
  );
  const hint = `pacific-1: ${pacificUrl || 'N/A'} | atlantic-2: ${atlanticUrl || 'N/A'} | arctic-1: ${
    arcticUrl || 'N/A'
  }`;
  const prefix = language === 'node' ? `// RPC endpoints — ${hint}\n` : `# RPC endpoints — ${hint}\n`;
  return prefix + snippet;
}
