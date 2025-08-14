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
    dbg('List tools response:', JSON.stringify(toolsRes));
    if (!Array.isArray(toolsRes.tools)) throw new Error('tools/list did not return an array');

    const names = toolsRes.tools.map((t) => t.name);
    // Exactly five resource tools should be advertised
    const expectedTools = [
      'list_resources',
      'list_resource_actions',
      'list_resource_action_schema',
      'invoke_resource_action',
      'get_resource_action_snippet',
    ];
    for (const t of expectedTools) if (!names.includes(t)) throw new Error(`Missing tool: ${t}`);
    if (toolsRes.tools.length !== 5) throw new Error('Exactly five resource tools should be advertised');

    // Root tool schema should expose method enum and language enum
  // Check each tool schema is minimal and as expected
  const listResource = toolsRes.tools.find((t) => t.name === 'list_resources');
  if (!listResource || listResource.inputSchema.required?.length) throw new Error('list_resources should require no args');
  const listActions = toolsRes.tools.find((t) => t.name === 'list_resource_actions');
  if (!listActions?.inputSchema?.required?.includes('resource')) throw new Error('list_resource_actions must require resource');
  const listSchema = toolsRes.tools.find((t) => t.name === 'list_resource_action_schema');
  if (!listSchema?.inputSchema?.required?.includes('resource') || !listSchema?.inputSchema?.required?.includes('action')) throw new Error('list_resource_action_schema must require resource and action');
  const invoke = toolsRes.tools.find((t) => t.name === 'invoke_resource_action');
  if (!invoke?.inputSchema?.required?.includes('resource') || !invoke?.inputSchema?.required?.includes('action') || !invoke?.inputSchema?.required?.includes('payload')) throw new Error('invoke_resource_action must require resource, action, payload');
  const snippet = toolsRes.tools.find((t) => t.name === 'get_resource_action_snippet');
  if (!snippet?.inputSchema?.required?.includes('resource') || !snippet?.inputSchema?.required?.includes('action') || !snippet?.inputSchema?.required?.includes('language')) throw new Error('get_resource_action_snippet must require resource, action, language');

    // Root tool basic flow
  const rootList = await client.callTool({ name: 'list_resources', arguments: {} });
    const rootListText =
      (rootList.content && rootList.content[0] && rootList.content[0].text) || '';
    let rootParsed;
    try {
      rootParsed = JSON.parse(rootListText);
    } catch {
      throw new Error('list_resources did not return JSON');
    }
    if (!Array.isArray(rootParsed.resources) || !rootParsed.resources.length) {
      throw new Error('list_resources did not return resources');
    }
  // Ensure resource list includes typical resources
  const expectedControllers = ['address', 'erc20', 'erc721', 'native'];
  const missing = expectedControllers.filter((n) => !rootParsed.resources.includes(n));
  if (missing.length) throw new Error(`Missing resources: ${missing.join(', ')}`);

    // Root: list actions for erc20
  const rootActions = await client.callTool({ name: 'list_resource_actions', arguments: { resource: 'erc20' } });
    const rootActionsText =
      (rootActions.content && rootActions.content[0] && rootActions.content[0].text) || '';
    let rootActionsParsed;
    try {
      rootActionsParsed = JSON.parse(rootActionsText);
    } catch {
      throw new Error('list_resource_actions did not return JSON');
    }
    if (!Array.isArray(rootActionsParsed.actions) || !rootActionsParsed.actions.length) {
      throw new Error('list_resource_actions did not return actions');
    }

    // Root: list action schema
  const rootSchema = await client.callTool({ name: 'list_resource_action_schema', arguments: { resource: 'erc20', action: 'get_erc20_token_info' } });
    const rootSchemaText =
      (rootSchema.content && rootSchema.content[0] && rootSchema.content[0].text) || '';
    let rootSchemaParsed;
    try {
      rootSchemaParsed = JSON.parse(rootSchemaText);
    } catch {
      throw new Error('list_resource_action_schema did not return JSON');
    }
    if (
      !rootSchemaParsed?.schema?.properties?.chain_id ||
      !rootSchemaParsed?.schema?.properties?.contract_address
    ) {
      throw new Error('list_resource_action_schema did not include expected properties');
    }

    // Root: snippet
  const rootSnippet = await client.callTool({ name: 'get_resource_action_snippet', arguments: { resource: 'erc20', action: 'get_erc20_token_info', language: 'node' } });
    const rootSnippetText =
      (rootSnippet.content && rootSnippet.content[0] && rootSnippet.content[0].text) || '';
    let rootSnippetParsed;
    try {
      rootSnippetParsed = JSON.parse(rootSnippetText);
    } catch {
      throw new Error('get_resource_action_snippet did not return JSON');
    }
    if (!rootSnippetParsed?.snippet || typeof rootSnippetParsed.snippet !== 'string') {
      throw new Error('get_resource_action_snippet missing snippet string');
    }

    // 1) Validation error on missing required fields via invoke_resource_action
  const bad = await client.callTool({ name: 'invoke_resource_action', arguments: { resource: 'erc20', action: 'get_erc20_token_info', payload: {} } });
    // dbg('Bad validation call result:', JSON.stringify(bad));
    const badText = (bad.content && bad.content[0] && bad.content[0].text) || '';
    if (!/Invalid arguments|Error validating input/i.test(badText)) {
      throw new Error('Expected validation error text when calling erc20 without required args');
    }

    // 2) Unknown action handling via list_resource_action_schema
  const unknown = await client.callTool({ name: 'list_resource_action_schema', arguments: { resource: 'erc20', action: 'nonexistent_action' } });
    // dbg('Unknown action call result:', JSON.stringify(unknown));
    const unknownText = (unknown.content && unknown.content[0] && unknown.content[0].text) || '';
    if (!/Unknown action .* Available actions:/i.test(unknownText)) {
      throw new Error('Expected unknown action error with available actions list');
    }

  // 3) list_resource_actions returns names and descriptions
  const list = await client.callTool({ name: 'list_resource_actions', arguments: { resource: 'erc20' } });
    const listText = (list.content && list.content[0] && list.content[0].text) || '';
    const parsed = JSON.parse(listText);
    if (
      !Array.isArray(parsed.actions) ||
      !parsed.actions.length ||
      !parsed.actions[0].description
    ) {
      throw new Error('list_resource_actions did not return action descriptions');
    }

    // 4) list_resource_action_schema returns JSON schema for a known action
  const schemaRes = await client.callTool({ name: 'list_resource_action_schema', arguments: { resource: 'erc20', action: 'get_erc20_token_info' } });
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

    // 5) get_resource_action_snippet returns a code snippet for a known action and language
  const snippetRes = await client.callTool({ name: 'get_resource_action_snippet', arguments: { resource: 'erc20', action: 'get_erc20_token_info', language: 'node' } });
    const snippetText =
      (snippetRes.content && snippetRes.content[0] && snippetRes.content[0].text) || '';
    let snippetParsed;
    try {
      snippetParsed = JSON.parse(snippetText);
      // dbg('get_action_snippet result:', JSON.stringify(snippetParsed, null, 2));
    } catch {
      throw new Error('get_action_snippet did not return JSON payload');
    }
    if (!snippetParsed?.snippet || typeof snippetParsed.snippet !== 'string') {
      throw new Error('get_action_snippet missing snippet string');
    }

    // 6) get_resource_action_snippet with unsupported language should error
  const badLang = await client.callTool({ name: 'get_resource_action_snippet', arguments: { resource: 'erc20', action: 'get_erc20_token_info', language: 'madeup' } });
    const badLangText = (badLang.content && badLang.content[0] && badLang.content[0].text) || '';
    if (!/Unsupported or missing language/i.test(badLangText)) {
      throw new Error('Expected unsupported language error from get_action_snippet');
    }

    // Optional: Positive-path live call if API key available
    if (providedKey) {
  const ok = await client.callTool({ name: 'invoke_resource_action', arguments: { resource: 'native', action: 'get_native_token_info_and_statistic', payload: { chain_id: 'pacific-1', token_denom: 'usei' } } });
      const okText = (ok.content && ok.content[0] && ok.content[0].text) || '';
      dbg('Positive call result:', okText.slice(0, 200) + (okText.length > 200 ? '...' : ''));
      if (!/API Response \(Status: \d+\)/.test(okText)) {
        throw new Error(
          'Expected API Response for positive-path native.get_native_token_info_and_statistic'
        );
      }
    }

    console.log(
      'E2E PASS: root resource flow and positive-path ' + (providedKey ? 'executed' : 'skipped')
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
