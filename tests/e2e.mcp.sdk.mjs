#!/usr/bin/env node
/* global process, console */
// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

import { testToolList } from './tool_list.mcp.sdk.mjs';
import { testInsightsResouces } from './insights.mcp.sdk.mjs';
import { testInsightsAssets } from './insights_assets.mcp.sdk.mjs';
import { testInsightsAssetsTokens } from './insights_assets_tokens.mcp.sdk.mjs';
import { testInsightsAssetsTokensReal } from './insights_assets_tokens_real.mcp.sdk.mjs';
import { testInsightsEarnings } from './insights_earnings.mcp.sdk.mjs';
import { testGeneralResources } from './general.mcp.sdk.mjs';
import { testSmartContractResources } from './smart_contract.mcp.sdk.mjs';
import { testSchemaValidation, testSearchVerifiedContractsBugCase } from './schema_validation.mcp.sdk.mjs';
import { testEthersSnippetGenerator } from './ethers_snippet_generator.test.mjs';

async function main() {
  const fileName = fileURLToPath(import.meta.url);
  const dirName = path.dirname(fileName);
  const projectRoot = path.resolve(dirName, '..');
  const serverBin = path.join(projectRoot, 'build', 'src', 'index.js');

  const client = new Client({ name: 'e2e-runner', version: '0.0.0' }, { capabilities: {} });
  const childEnv = { ...process.env };
  const transport = new StdioClientTransport({ command: 'node', args: [serverBin], env: childEnv });
  await client.connect(transport);

  try {
    // Test schema validation utilities (unit tests)
    await testSchemaValidation();

    // Test ethers snippet generator (unit tests)
    await testEthersSnippetGenerator();

    // Test tool list
    await testToolList(client);

    // Test insights resources
    await testInsightsResouces(client, childEnv);

  // Test insights assets resources (discovery + schema checks)
  await testInsightsAssets(client);

  // Test insights assets token/native/ics20 searches
  await testInsightsAssetsTokens(client);

  // Test real gateway search for iSEI ERC-20 (may be skipped if network unavailable)
  try {
    await testInsightsAssetsTokensReal(client);
  } catch (err) {
    console.warn('[WARN] Real token search test failed (non-fatal):', err?.message || err);
  }

  // Test insights earnings resources
  await testInsightsEarnings(client);

    // Test general resources
    await testGeneralResources(client);

    // Test smart contract resources
    await testSmartContractResources(client);

    // Test the specific bug case that was reported
    await testSearchVerifiedContractsBugCase(client);

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
