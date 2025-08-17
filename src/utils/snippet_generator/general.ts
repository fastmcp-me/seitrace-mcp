import { getSupportedLanguages } from '@readme/oas-to-snippet/languages';
import { HTTPSnippet } from '@readme/httpsnippet';

export const SUPPORTED_GENERAL_SNIPPET_LANGUAGES = Object.keys(getSupportedLanguages());

export const generateGeneralSnippet = (
  definition: {
    baseUrl: string;
    path: string;
    method: string;
    queryParams?: Record<string, any>;
    headers?: Record<string, string>;
    requestBody?: Record<string, any>;
  },
  language: (typeof SUPPORTED_GENERAL_SNIPPET_LANGUAGES)[number]
) => {
  // Normalize and construct URL string safely (no new URL for placeholders)
  const base = String(definition.baseUrl || '').replace(/\/$/, '');
  const path = String(definition.path || '').replace(/^\//, '');
  const method = String(definition.method || 'GET').toUpperCase();
  const baseAndPath = `${base}/${path}`;
  const qs = new URLSearchParams();
  if (definition.queryParams) {
    for (const [k, v] of Object.entries(definition.queryParams)) {
      if (v === undefined || v === null) continue;
      if (Array.isArray(v)) v.forEach((val) => qs.append(k, String(val)));
      else if (typeof v === 'object') qs.set(k, JSON.stringify(v));
      else qs.set(k, String(v));
    }
  }
  const urlStr = qs.toString() ? `${baseAndPath}?${qs.toString()}` : baseAndPath;

  // Headers and body
  const headers: Record<string, string> = {
    accept: 'application/json',
    ...(definition.headers || {}),
  };
  const hasBody = !!definition.requestBody && method !== 'GET' && method !== 'HEAD';
  if (hasBody && !Object.keys(headers).some((h) => h.toLowerCase() === 'content-type')) {
    headers['content-type'] = 'application/json';
  }

  // HAR-like request for HTTPSnippet
  const request: any = {
    method,
    url: urlStr,
    httpVersion: 'HTTP/1.1',
    headers: Object.entries(headers).map(([name, value]) => ({ name, value })),
  };
  if (hasBody) {
    const isJson = (headers['content-type'] || '').includes('application/json');
    request.postData = {
      mimeType: headers['content-type'] || 'application/json',
      text: isJson ? JSON.stringify(definition.requestBody) : String(definition.requestBody),
    };
  }

  try {
    const snippet = new HTTPSnippet(request);
    const code = snippet.convert(language as any);
    if (code) return Array.isArray(code) ? code[0] : (code as unknown as string);
  } catch (_) {
    // Fall through to manual generation
  }

  // Fallback: Node (native fetch) or cURL
  const headerPairs = Object.entries(headers);
  const isJson = (headers['content-type'] || '').includes('application/json');

  if (language === 'node') {
    const headersObj = headerPairs.reduce((acc: Record<string, string>, [k, v]) => {
      acc[k] = v;
      return acc;
    }, {});

    if (hasBody) {
      const bodyLiteral = isJson
        ? JSON.stringify(definition.requestBody, null, 2)
        : String(definition.requestBody);
      return `// Node 18+ (native fetch)\nconst url = '${urlStr}';\nconst headers = ${JSON.stringify(
        headersObj,
        null,
        2
      )};\nconst body = ${
        isJson ? bodyLiteral : `String(${JSON.stringify(definition.requestBody)})`
      };\n\nconst res = await fetch(url, {\n  method: '${method}',\n  headers,\n  body: ${
        isJson ? 'JSON.stringify(body)' : 'body'
      }\n});\nif (!res.ok) throw new Error('HTTP ' + res.status);\nconst data = await res.json().catch(async () => await res.text());\nconsole.log(data);`;
    }

    return `// Node 18+ (native fetch)\nconst url = '${urlStr}';\nconst headers = ${JSON.stringify(
      headersObj,
      null,
      2
    )};\n\nconst res = await fetch(url, {\n  method: '${method}',\n  headers\n});\nif (!res.ok) throw new Error('HTTP ' + res.status);\nconst data = await res.json().catch(async () => await res.text());\nconsole.log(data);`;
  }

  const curlHeaders = headerPairs.map(([k, v]) => `-H '${k}: ${v}'`).join(' \\\n+  ');
  const curlData = hasBody
    ? ` \\\n+  --data '${isJson ? JSON.stringify(definition.requestBody) : String(definition.requestBody)}'`
    : '';
  const maybeX = method !== 'GET' ? `-X ${method} ` : '';

  return `curl -s ${maybeX}\\\n  '${urlStr}' \\\n+  ${curlHeaders}${curlData}`;
};

// Chain gateway endpoints copied from gateway executor for snippet generation
const GATEWAY_BY_CHAIN: Record<string, string> = {
  'pacific-1': 'https://pacific-1-gateway.seitrace.com',
  'atlantic-2': 'https://atlantic-2-gateway.seitrace.com',
  'arctic-1': 'https://arctic-1-gateway.seitrace.com',
};

/**
 * Wrapper to generate a general HTTP snippet from a McpToolDefinition and payload.
 * Currently supports 'gateway' executor (associations) by constructing the proper
 * URL and query parameters; falls back to a simple GET template otherwise.
 */
export function generateGeneralFromDefinition(
  definition: { pathTemplate?: string; executor?: string },
  _actionName: string,
  language: (typeof SUPPORTED_GENERAL_SNIPPET_LANGUAGES)[number],
  payload?: { chain_id?: string; endpoint?: string; hashes?: string[]; [k: string]: any }
): string {
  const pathTemplate = String(definition.pathTemplate || '/');
  // Gateway target base URL resolution
  if (definition.executor === 'gateway') {
    const chainId = payload?.chain_id || '';
    const endpoint = payload?.endpoint || '';
    const baseUrl = endpoint || (chainId && GATEWAY_BY_CHAIN[chainId]) || '<GATEWAY_ENDPOINT>';
    const queryParams: Record<string, any> = {};
    if (Array.isArray(payload?.hashes)) queryParams['hashes'] = payload!.hashes;

    const snippet = generateGeneralSnippet(
      {
        baseUrl,
        path: pathTemplate.replace(/^\//, ''),
        method: 'GET',
        headers: { accept: 'application/json' },
  queryParams,
      },
      language
    );

    // Provide a hint of available gateways
    const hint = `pacific-1: ${GATEWAY_BY_CHAIN['pacific-1']} | atlantic-2: ${GATEWAY_BY_CHAIN['atlantic-2']} | arctic-1: ${GATEWAY_BY_CHAIN['arctic-1']}`;
    const prefix = language === 'node' ? `// Gateways — ${hint}\n` : `# Gateways — ${hint}\n`;
    return prefix + snippet;
  }

  // Fallback generic GET template
  return generateGeneralSnippet(
    {
      baseUrl: '<BASE_URL>',
      path: pathTemplate.replace(/^\//, ''),
      method: 'GET',
      headers: { accept: 'application/json' },
      queryParams: {},
    },
    language
  );
}
