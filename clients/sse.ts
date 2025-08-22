#!/usr/bin/env node
/* demo SSE client connecting to our SSE server at 127.0.0.1:3333 */
import dotenv from 'dotenv';
dotenv.config();

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

async function main() {
  const urlStr = process.env.SSE_URL || 'http://127.0.0.1:3333/sse';
  const url = new URL(urlStr);

  const client = new Client({ name: 'sse-demo', version: '0.0.0' }, { capabilities: {} });
  const transport = new SSEClientTransport(url);
  await client.connect(transport);

  // Simple demo: list tools, then list resources
  const tools = await client.listTools();
  console.error('SSE demo tools:', tools.tools.map((t) => t.name));

  const listRes = await client.callTool({ name: 'list_resources', arguments: {} });
  const contentAny: any = (listRes as any).content;
  const text = typeof contentAny?.[0]?.text === 'string' ? contentAny[0].text : JSON.stringify(listRes);
  console.error('SSE demo list_resources:', text.slice(0, 200) + (text.length > 200 ? '…' : ''));

  await client.close();
}

main().catch((err) => {
  console.error('SSE demo error:', err);
  process.exit(1);
});
