#!/usr/bin/env node
// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

import { testToolList } from './tool_list.mcp.sdk.mjs';
import { testInsightsResouces } from './insights.mcp.sdk.mjs';
import { testGeneralResources } from './general.mcp.sdk.mjs';

async function main() {
  const fileName = fileURLToPath(import.meta.url);
  const dirName = path.dirname(fileName);
  const projectRoot = path.resolve(dirName, '..');
  const serverBin = path.join(projectRoot, 'build', 'index.js');

  const client = new Client({ name: 'e2e-runner', version: '0.0.0' }, { capabilities: {} });
  const childEnv = { ...process.env };
  const transport = new StdioClientTransport({ command: 'node', args: [serverBin], env: childEnv });
  await client.connect(transport);

  try {
    // Test tool list
    await testToolList(client);

    // Test insights resources
    await testInsightsResouces(client, childEnv);

    // Test general resources
    await testGeneralResources(client);

    console.log(
      'E2E PASS: root resource flow and positive-path ' +
        (childEnv.SECRET_APIKEY ? 'executed' : 'skipped')
    );
    process.exit(0);
  } catch (err) {
    console.error('E2E FAIL:', err?.message || err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
