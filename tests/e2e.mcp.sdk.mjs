#!/usr/bin/env node
// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function main() {
  const DEBUG =
    process.env.E2E_DEBUG === '1' || (process.env.DEBUG || '').toLowerCase().includes('e2e');
  const dbg = (...args) => {
    if (DEBUG) console.log('[E2E]', ...args);
  };
  // If a key is provided, wire it for the server child process
  const providedKey =
    process.env.E2E_API_KEY || process.env.SECRET_APIKEY || process.env.SEITRACE_API_KEY;
  if (providedKey) {
    // Server expects SECRET_<schemeNameUpper>, with schemeName "apiKey"
    process.env.SECRET_APIKEY = providedKey;
    dbg('API key detected in env; positive-path tests will run');
  }
  const fileName = fileURLToPath(import.meta.url);
  const dirName = path.dirname(fileName);
  const projectRoot = path.resolve(dirName, '..');
  const serverBin = path.join(projectRoot, 'build', 'index.js');

  const client = new Client({ name: 'e2e-runner', version: '0.0.0' }, { capabilities: {} });
  const childEnv = { ...process.env };
  if (providedKey) childEnv.SECRET_APIKEY = providedKey;
  const transport = new StdioClientTransport({ command: 'node', args: [serverBin], env: childEnv });
  await client.connect(transport);
  try {
    const toolsRes = await client.listTools();
    // dbg('List tools response:', JSON.stringify(toolsRes, null, 2));
    if (!Array.isArray(toolsRes.tools)) throw new Error('tools/list did not return an array');

    const names = toolsRes.tools.map((t) => t.name);
    // dbg('Tools advertised:', names);
    // Expect several grouped controllers
    const expectedControllers = [
      'address',
      'erc20',
      'erc721',
      'erc1155',
      'cw20',
      'cw721',
      'ics20',
      'native',
      'smart_contract',
    ];
    const missing = expectedControllers.filter((n) => !names.includes(n));
    if (missing.length) throw new Error(`Missing grouped tools: ${missing.join(', ')}`);

    // Ensure legacy flat tool names are NOT listed
    if (names.includes('Erc20TokenController-getErc20TokenInfo')) {
      throw new Error('Legacy flat tool unexpectedly listed');
    }

    // Ensure grouped schema uses unified approach with enum for methods
    const erc20 = toolsRes.tools.find((t) => t.name === 'erc20');
    if (!erc20?.inputSchema || !erc20.inputSchema.properties?.method) {
      throw new Error('Grouped tool schema is missing method property');
    }
    const methodEnum = erc20.inputSchema.properties.method.enum;
    if (!Array.isArray(methodEnum)) {
      throw new Error('Grouped tool schema method property should have enum values');
    }
    const methodSet = new Set(methodEnum);
    if (
      !methodSet.has('list_actions') ||
      !methodSet.has('list_action_schema') ||
      !methodSet.has('invoke_action')
    ) {
      throw new Error(
        'Grouped tool schema missing required methods (list_actions, list_action_schema, invoke_action)'
      );
    }
    // Description should be lightweight (no actions listed)
    const desc = erc20.description || '';
    if (
      /Actions:|get_erc20_token_info|get_erc20_balances|get_erc20_token_transfers|get_erc20_token_holders/i.test(
        desc
      )
    ) {
      throw new Error('Tool description should not list actions');
    }

    // 1) Validation error on missing required fields via invoke_action
    const bad = await client.callTool({
      name: 'erc20',
      arguments: { method: 'invoke_action', action: 'get_erc20_token_info', payload: {} },
    });
    // dbg('Bad validation call result:', JSON.stringify(bad, null, 2));
    const badText = (bad.content && bad.content[0] && bad.content[0].text) || '';
    if (!/Invalid arguments|Error validating input/i.test(badText)) {
      throw new Error('Expected validation error text when calling erc20 without required args');
    }

    // 2) Unknown action handling via list_action_schema
    const unknown = await client.callTool({
      name: 'erc20',
      arguments: { method: 'list_action_schema', action: 'nonexistent_action' },
    });
    // dbg('Unknown action call result:', JSON.stringify(unknown, null, 2));
    const unknownText = (unknown.content && unknown.content[0] && unknown.content[0].text) || '';
    if (!/Unknown action .* Available actions:/i.test(unknownText)) {
      throw new Error('Expected unknown action error with available actions list');
    }

    // 3) list_actions returns names and descriptions
    const list = await client.callTool({ name: 'erc20', arguments: { method: 'list_actions' } });
    const listText = (list.content && list.content[0] && list.content[0].text) || '';
    // dbg('list_actions result:', listText);
    const parsed = JSON.parse(listText);
    if (
      !Array.isArray(parsed.actions) ||
      !parsed.actions.length ||
      !parsed.actions[0].description
    ) {
      throw new Error('list_actions did not return action descriptions');
    }

    // 4) list_action_schema returns JSON schema for a known action
    const schemaRes = await client.callTool({
      name: 'erc20',
      arguments: { method: 'list_action_schema', action: 'get_erc20_token_info' },
    });
    // dbg('list_action_schema result:', schemaRes);
    const schemaText =
      (schemaRes.content && schemaRes.content[0] && schemaRes.content[0].text) || '';
    const schemaParsed = JSON.parse(schemaText);
    if (
      !schemaParsed?.schema?.properties?.chain_id ||
      !schemaParsed?.schema?.properties?.contract_address
    ) {
      throw new Error(
        'list_action_schema did not return expected properties for erc20.get_erc20_token_info'
      );
    }

    // Optional: Positive-path live call if API key available
    if (providedKey) {
      const ok = await client.callTool({
        name: 'native',
        arguments: {
          method: 'invoke_action',
          action: 'get_native_token_info_and_statistic',
          payload: {
            chain_id: 'pacific-1',
            token_denom: 'usei',
          },
        },
      });
      const okText = (ok.content && ok.content[0] && ok.content[0].text) || '';
      dbg('Positive call result:', okText.slice(0, 200) + (okText.length > 200 ? '...' : ''));
      if (!/API Response \(Status: \d+\)/.test(okText)) {
        throw new Error(
          'Expected API Response for positive-path native.get_native_token_info_and_statistic'
        );
      }
    }

    console.log(
      'E2E PASS: 3-layer method flow and positive-path ' + (providedKey ? 'executed' : 'skipped')
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
