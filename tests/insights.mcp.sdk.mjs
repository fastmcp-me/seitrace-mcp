import { dbg } from './utils.mjs';

export const testInsightsResouces = async (client, childEnv) => {
  /**
   * @dev Setup test client
   */
  // If a key is provided, wire it for the server child process
  const providedKey =
    process.env.E2E_API_KEY || process.env.SECRET_APIKEY || process.env.SEITRACE_API_KEY;
  if (providedKey) {
    // Server expects SECRET_<schemeNameUpper>, with schemeName "apiKey"
    process.env.SECRET_APIKEY = providedKey;
    dbg('API key detected in env; positive-path tests will run');
  }
  if (providedKey) childEnv.SECRET_APIKEY = providedKey;

  // Root: list actions for insights_erc20
  const rootActions = await client.callTool({
    name: 'list_resource_actions',
    arguments: { resource: 'insights_erc20' },
  });
  const rootActionsText =
    (rootActions.content && rootActions.content[0] && rootActions.content[0].text) || '';
  // dbg('Root actions text:', rootActionsText);
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
  const rootSchema = await client.callTool({
    name: 'get_resource_action_schema',
    arguments: { resource: 'insights_erc20', action: 'get_erc20_token_info' },
  });
  const rootSchemaText =
    (rootSchema.content && rootSchema.content[0] && rootSchema.content[0].text) || '';
  let rootSchemaParsed;
  try {
    rootSchemaParsed = JSON.parse(rootSchemaText);
  } catch {
    throw new Error('get_resource_action_schema did not return JSON');
  }
  if (
    !rootSchemaParsed?.schema?.properties?.chain_id ||
    !rootSchemaParsed?.schema?.properties?.contract_address
  ) {
    throw new Error('getResourceActionSchema did not include expected properties');
  }

  // Root: snippet
  const rootSnippet = await client.callTool({
    name: 'get_resource_action_snippet',
    arguments: { resource: 'insights_erc20', action: 'get_erc20_token_info', language: 'node' },
  });
  const rootSnippetText =
    (rootSnippet.content && rootSnippet.content[0] && rootSnippet.content[0].text) || '';
  dbg('getResourceActionSnippet result:', rootSnippetText);
  let rootSnippetParsed;
  try {
    rootSnippetParsed = JSON.parse(rootSnippetText);
  } catch {
    throw new Error('get_resource_action_snippet did not return JSON');
  }
  if (!rootSnippetParsed?.snippet || typeof rootSnippetParsed.snippet !== 'string') {
    throw new Error('getResourceActionSnippet missing snippet string');
  }

  // 1) Validation error on missing required fields via invokeResourceAction
  const bad = await client.callTool({
    name: 'invoke_resource_action',
    arguments: { resource: 'insights_erc20', action: 'get_erc20_token_info', payload: {} },
  });
  // dbg('Bad validation call result:', JSON.stringify(bad));
  const badText = (bad.content && bad.content[0] && bad.content[0].text) || '';
  if (!/Invalid arguments|Error validating input/i.test(badText)) {
    throw new Error(
      'Expected validation error text when calling insights_erc20 without required args'
    );
  }

  // 2) Unknown action handling via getResourceActionSchema
  const unknown = await client.callTool({
    name: 'get_resource_action_schema',
    arguments: { resource: 'insights_erc20', action: 'nonexistent_action' },
  });
  // dbg('Unknown action call result:', JSON.stringify(unknown));
  const unknownText = (unknown.content && unknown.content[0] && unknown.content[0].text) || '';
  if (!/Unknown or missing action .*/i.test(unknownText)) {
    throw new Error('Expected unknown action error with available actions list');
  }

  // 3) listResourceActions returns names and descriptions
  const list = await client.callTool({
    name: 'list_resource_actions',
    arguments: { resource: 'insights_erc20' },
  });
  const listText = (list.content && list.content[0] && list.content[0].text) || '';
  const parsed = JSON.parse(listText);
  // dbg('listResourceActions result:', JSON.stringify(parsed, null, 2));
  if (!Array.isArray(parsed.actions) || !parsed.actions.length || !parsed.actions[0].description) {
    throw new Error('listResourceActions did not return action descriptions');
  }

  // 4) getResourceActionSchema returns JSON schema for a known action
  const schemaRes = await client.callTool({
    name: 'get_resource_action_schema',
    arguments: { resource: 'insights_erc20', action: 'get_erc20_token_info' },
  });
  // dbg('list_action_schema result:', schemaRes);
  const schemaText = (schemaRes.content && schemaRes.content[0] && schemaRes.content[0].text) || '';
  const schemaParsed = JSON.parse(schemaText);
  if (
    !schemaParsed?.schema?.properties?.chain_id ||
    !schemaParsed?.schema?.properties?.contract_address
  ) {
    throw new Error(
      'list_action_schema did not return expected properties for erc20.get_erc20_token_info'
    );
  }

  // 5) getResourceActionSnippet returns a code snippet for a known action and language
  const snippetRes = await client.callTool({
    name: 'get_resource_action_snippet',
    arguments: { resource: 'insights_erc20', action: 'get_erc20_token_info', language: 'node' },
  });
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

  // 6) getResourceActionSnippet with unsupported language should error
  const badLang = await client.callTool({
    name: 'get_resource_action_snippet',
    arguments: { resource: 'insights_erc20', action: 'get_erc20_token_info', language: 'madeup' },
  });
  const badLangText = (badLang.content && badLang.content[0] && badLang.content[0].text) || '';
  // dbg('get_action_snippet with bad language result:', badLangText);
  if (!/Unsupported or missing language/i.test(badLangText)) {
    throw new Error('Expected unsupported language error from get_action_snippet');
  }

  // Optional: Positive-path live call if API key available
  if (providedKey) {
    const ok = await client.callTool({
      name: 'invoke_resource_action',
      arguments: {
        resource: 'insights_native',
        action: 'get_native_token_info_and_statistic',
        payload: { chain_id: 'pacific-1', token_denom: 'usei' },
      },
    });
    const okText = (ok.content && ok.content[0] && ok.content[0].text) || '';
    dbg('Positive call result:', okText.slice(0, 200) + (okText.length > 200 ? '...' : ''));
    if (!/API Response \(Status: \d+\)/.test(okText)) {
      throw new Error(
        'Expected API Response for positive-path insights_native.get_native_token_info_and_statistic'
      );
    }
  }
};
