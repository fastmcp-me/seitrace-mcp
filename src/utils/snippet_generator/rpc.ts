import { HTTPSnippet } from '@readme/httpsnippet';
import { getSupportedLanguages } from '@readme/oas-to-snippet/languages';

import { McpToolDefinition } from '../../types.js';
import { endpointDefinitionMap as rpcEndpointMap } from '../../topics/general/resources/rpc_lcd/definition.js';

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
  const atlantic = conn?.['atlantic-2'];
  const isCosmos = /callCosmosRpc$/i.test(definition.name) || /call_cosmos_rpc$/i.test(actionName);
  const pacificUrl =
    payload?.endpoint || (isCosmos ? pacific?.cosmos?.rpc?.[0] : pacific?.evm?.rpc?.[0]);
  const atlanticUrl = isCosmos ? atlantic?.cosmos?.rpc?.[0] : atlantic?.evm?.rpc?.[0];
  const exampleMethod = isCosmos ? 'status' : 'eth_blockNumber';
  const method = payload?.rpc_method || exampleMethod;
  const params = Array.isArray(payload?.params) ? payload?.params : [];

  // Build HAR-like request for HTTPSnippet
  const request = {
    method: 'POST',
    url: String(pacificUrl || '<RPC_ENDPOINT>'),
    httpVersion: 'HTTP/1.1',
    headers: [
      { name: 'content-type', value: 'application/json' },
      { name: 'accept', value: 'application/json' },
    ],
    postData: {
      mimeType: 'application/json',
      text: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    },
  } as any;

  try {
    const snippet = new HTTPSnippet(request);
    const code = snippet.convert(language as any);
    // console.log(code)
    if (!code) {
      throw new Error('RPC snippet generation failed: no code returned');
    }
    return code[0];
  } catch (e) {
    console.error('RPC snippet generation failed:', e);
  }

  // Fallback manual snippets if conversion fails
  if (language === 'node') {
    return `// Node 18+ (native fetch)\nconst url = '${
      pacificUrl || '<RPC_ENDPOINT>'
    }'; // pacific-1: ${pacificUrl} | atlantic-2: ${atlanticUrl}\nconst body = {\n  jsonrpc: '2.0',\n  id: 1,\n  method: '${method}',\n  params: ${JSON.stringify(
      params
    )}\n};\n\nconst res = await fetch(url, {\n  method: 'POST',\n  headers: { 'content-type': 'application/json', accept: 'application/json' },\n  body: JSON.stringify(body)\n});\nif (!res.ok) throw new Error('RPC error ' + res.status);\nconst json = await res.json();\nconsole.log(json);`;
  }
  return `curl -s -X POST \\\n+  '${
    pacificUrl || '<RPC_ENDPOINT>'
  }' \\\n+  -H 'content-type: application/json' \\\n+  -H 'accept: application/json' \\\n+  --data '${JSON.stringify(
    { jsonrpc: '2.0', id: 1, method, params }
  )}'`;
}
