#!/usr/bin/env node
/* demo Streamable HTTP client connecting to our stream HTTP server at 127.0.0.1:3344 */
import dotenv from 'dotenv';
dotenv.config();

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

async function main() {
  const urlStr = process.env.HTTPSTREAM_URL || 'http://127.0.0.1:3344';
  const url = new URL(urlStr);

  const client = new Client({ name: 'httpstream-demo', version: '0.0.0' }, { capabilities: {} });
  const transport = new StreamableHTTPClientTransport(url);
  await client.connect(transport);

  const tools = await client.listTools();
  console.error(
    'HTTP stream demo tools:',
    tools.tools.map((t) => t.name)
  );

  const listRes = await client.callTool({ name: 'list_resources', arguments: {} });
  const contentAny: any = (listRes as any).content;
  const text =
    typeof contentAny?.[0]?.text === 'string' ? contentAny[0].text : JSON.stringify(listRes);
  console.error(
    'HTTP stream demo list_resources:',
    text.slice(0, 200) + (text.length > 200 ? '…' : '')
  );

  await client.close();
}

main().catch((err) => {
  console.error('HTTP stream demo error:', err);
  process.exit(1);
});
