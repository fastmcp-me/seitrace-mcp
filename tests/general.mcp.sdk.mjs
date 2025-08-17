import { dbg } from './utils.mjs';

export const testGeneralResources = async (client) => {
  // Additional checks for the new general_faucet resource
  // Verify actions include request_faucet
  const genActions = await client.callTool({
    name: 'list_resource_actions',
    arguments: { resource: 'general_faucet' },
  });
  const genActionsText =
    (genActions.content && genActions.content[0] && genActions.content[0].text) || '';
  const genActionsParsed = JSON.parse(genActionsText);
  if (
    !Array.isArray(genActionsParsed.actions) ||
    !genActionsParsed.actions.find((a) => a.name === 'request_faucet')
  ) {
    throw new Error('general_faucet missing request_faucet action');
  }

  // Verify schema for call_cosmos_lcd
  const lcdSchemaRes = await client.callTool({
    name: 'get_resource_action_schema',
    arguments: { resource: 'general_rpc_lcd', action: 'call_cosmos_lcd' },
  });
  const lcdSchemaText =
    (lcdSchemaRes.content && lcdSchemaRes.content[0] && lcdSchemaRes.content[0].text) || '';
  const lcdSchema = JSON.parse(lcdSchemaText);
  if (
    !lcdSchema?.schema?.properties?.path ||
    !lcdSchema?.schema?.properties?.chain_id ||
    !lcdSchema?.schema?.properties?.endpoint ||
    !Array.isArray(lcdSchema?.schema?.required) ||
    !lcdSchema.schema.required.includes('path')
  ) {
    throw new Error('general_rpc_lcd.call_cosmos_lcd schema missing expected fields');
  }

  // Verify faucet schema contains wallet_address and chain_id
  const faucetSchemaRes = await client.callTool({
    name: 'get_resource_action_schema',
    arguments: { resource: 'general_faucet', action: 'request_faucet' },
  });
  const faucetSchemaText =
    (faucetSchemaRes.content && faucetSchemaRes.content[0] && faucetSchemaRes.content[0].text) ||
    '';
  const faucetSchema = JSON.parse(faucetSchemaText);
  if (
    !faucetSchema?.schema?.properties?.wallet_address ||
    !faucetSchema?.schema?.properties?.chain_id
  ) {
    throw new Error('general_faucet.request_faucet schema missing wallet_address or chain_id');
  }

  // Additional checks for the new general_rpc_lcd resource
  // Verify actions include get_connection_details
  const rpcActionsRes = await client.callTool({
    name: 'list_resource_actions',
    arguments: { resource: 'general_rpc_lcd' },
  });
  const rpcActionsText =
    (rpcActionsRes.content && rpcActionsRes.content[0] && rpcActionsRes.content[0].text) || '';
  const rpcActionsParsed = JSON.parse(rpcActionsText);
  if (
    !Array.isArray(rpcActionsParsed.actions) ||
    !rpcActionsParsed.actions.find((a) => a.name === 'get_connection_details') ||
    !rpcActionsParsed.actions.find((a) => a.name === 'call_evm_rpc') ||
    !rpcActionsParsed.actions.find((a) => a.name === 'call_cosmos_rpc')
  ) {
    throw new Error('general_rpc_lcd missing required actions');
  }

  // Verify rpc schema requires no inputs
  const rpcSchemaRes = await client.callTool({
    name: 'get_resource_action_schema',
    arguments: { resource: 'general_rpc_lcd', action: 'get_connection_details' },
  });
  const rpcSchemaText =
    (rpcSchemaRes.content && rpcSchemaRes.content[0] && rpcSchemaRes.content[0].text) || '';
  const rpcSchema = JSON.parse(rpcSchemaText);
  if (!rpcSchema?.schema || rpcSchema.schema.type !== 'object') {
    throw new Error('general_rpc_lcd.get_connection_details schema missing or not an object');
  }
  if (Array.isArray(rpcSchema.schema.required) && rpcSchema.schema.required.length) {
    throw new Error('general_rpc_lcd.get_connection_details should not require any fields');
  }

  // Verify schemas for call_evm_rpc and call_cosmos_rpc
  const evmSchemaRes = await client.callTool({
    name: 'get_resource_action_schema',
    arguments: { resource: 'general_rpc_lcd', action: 'call_evm_rpc' },
  });
  const evmSchemaText =
    (evmSchemaRes.content && evmSchemaRes.content[0] && evmSchemaRes.content[0].text) || '';
  const evmSchema = JSON.parse(evmSchemaText);
  if (
    !evmSchema?.schema?.properties?.rpc_method ||
    !evmSchema?.schema?.properties?.params ||
    !evmSchema?.schema?.properties?.chain_id ||
    !evmSchema?.schema?.properties?.endpoint ||
    !Array.isArray(evmSchema?.schema?.required) ||
    !evmSchema.schema.required.includes('rpc_method')
  ) {
    throw new Error('general_rpc_lcd.call_evm_rpc schema missing expected fields');
  }
  const cosmosSchemaRes = await client.callTool({
    name: 'get_resource_action_schema',
    arguments: { resource: 'general_rpc_lcd', action: 'call_cosmos_rpc' },
  });
  const cosmosSchemaText =
    (cosmosSchemaRes.content && cosmosSchemaRes.content[0] && cosmosSchemaRes.content[0].text) ||
    '';
  const cosmosSchema = JSON.parse(cosmosSchemaText);
  if (
    !cosmosSchema?.schema?.properties?.rpc_method ||
    !cosmosSchema?.schema?.properties?.params ||
    !cosmosSchema?.schema?.properties?.chain_id ||
    !cosmosSchema?.schema?.properties?.endpoint ||
    !Array.isArray(cosmosSchema?.schema?.required) ||
    !cosmosSchema.schema.required.includes('rpc_method')
  ) {
    throw new Error('general_rpc_lcd.call_cosmos_rpc schema missing expected fields');
  }

  // Snippet generation for RPC actions (node + shell)
  const evmNodeSnippetRes = await client.callTool({
    name: 'get_resource_action_snippet',
    arguments: { resource: 'general_rpc_lcd', action: 'call_evm_rpc', language: 'node' },
  });
  const evmNodeSnippetText =
    (evmNodeSnippetRes.content &&
      evmNodeSnippetRes.content[0] &&
      evmNodeSnippetRes.content[0].text) ||
    '';
  let evmNodeSnippetParsed;
  try {
    evmNodeSnippetParsed = JSON.parse(evmNodeSnippetText);
  } catch {
    throw new Error('general_rpc_lcd.call_evm_rpc node snippet did not return JSON');
  }
  if (
    !evmNodeSnippetParsed?.snippet ||
    !/eth_blockNumber|<rpc_method>/.test(evmNodeSnippetParsed.snippet)
  ) {
    throw new Error('general_rpc_lcd.call_evm_rpc node snippet missing method');
  }

  const evmShellSnippetRes = await client.callTool({
    name: 'get_resource_action_snippet',
    arguments: { resource: 'general_rpc_lcd', action: 'call_evm_rpc', language: 'shell' },
  });
  const evmShellSnippetText =
    (evmShellSnippetRes.content &&
      evmShellSnippetRes.content[0] &&
      evmShellSnippetRes.content[0].text) ||
    '';
  // dbg('getResourceActionSnippet result:', evmShellSnippetText);
  const evmShellSnippetParsed = JSON.parse(evmShellSnippetText);
  if (
    !evmShellSnippetParsed?.snippet ||
    !/curl --request POST/.test(evmShellSnippetParsed.snippet)
  ) {
    throw new Error('general_rpc_lcd.call_evm_rpc shell snippet missing curl');
  }

  const cosmosNodeSnippetRes = await client.callTool({
    name: 'get_resource_action_snippet',
    arguments: { resource: 'general_rpc_lcd', action: 'call_cosmos_rpc', language: 'node' },
  });
  const cosmosNodeSnippetText =
    (cosmosNodeSnippetRes.content &&
      cosmosNodeSnippetRes.content[0] &&
      cosmosNodeSnippetRes.content[0].text) ||
    '';
  const cosmosNodeSnippetParsed = JSON.parse(cosmosNodeSnippetText);
  if (
    !cosmosNodeSnippetParsed?.snippet ||
    !/status|<rpc_method>/.test(cosmosNodeSnippetParsed.snippet)
  ) {
    throw new Error('general_rpc_lcd.call_cosmos_rpc node snippet missing method');
  }

  // Payload-driven snippet: method/params should appear in snippet
  const payloadSnippetRes = await client.callTool({
    name: 'get_resource_action_snippet',
    arguments: {
      resource: 'general_rpc_lcd',
      action: 'call_evm_rpc',
      language: 'node',
      payload: {
        rpc_method: 'eth_getBalance',
        params: ['0x0000000000000000000000000000000000000000', 'latest'],
      },
    },
  });
  const payloadSnippetText =
    (payloadSnippetRes.content &&
      payloadSnippetRes.content[0] &&
      payloadSnippetRes.content[0].text) ||
    '';
  const payloadSnippetParsed = JSON.parse(payloadSnippetText);
  // dbg('Payload snippet:', payloadSnippetParsed);
  if (
    !payloadSnippetParsed?.snippet ||
    !/eth_getBalance/.test(payloadSnippetParsed.snippet) ||
    !/\[\s*'0x0000000000000000000000000000000000000000',\s*'latest'\s*\]/.test(
      payloadSnippetParsed.snippet
    )
  ) {
    throw new Error('RPC payload-driven node snippet missing method or params');
  }

  // Unsupported language should error
  const badSnippet = await client.callTool({
    name: 'get_resource_action_snippet',
    arguments: { resource: 'general_rpc_lcd', action: 'call_evm_rpc', language: 'madeup' },
  });
  const badSnippetText =
    (badSnippet.content && badSnippet.content[0] && badSnippet.content[0].text) || '';
  if (!/Unsupported or missing language/i.test(badSnippetText)) {
    throw new Error('Expected unsupported language error for RPC snippet');
  }

  // Negative invoke: missing chain_id and endpoint should not hit network and should error clearly
  const evmInvokeMissingRes = await client.callTool({
    name: 'invoke_resource_action',
    arguments: {
      resource: 'general_rpc_lcd',
      action: 'call_evm_rpc',
      payload: { rpc_method: 'eth_blockNumber' },
    },
  });
  const evmInvokeMissingText =
    (evmInvokeMissingRes.content &&
      evmInvokeMissingRes.content[0] &&
      evmInvokeMissingRes.content[0].text) ||
    '';
  if (!/Missing 'endpoint' or 'chain_id'/i.test(evmInvokeMissingText)) {
    throw new Error('Expected missing endpoint/chain_id error for call_evm_rpc');
  }

  // LCD: missing both endpoint and chain_id should error
  const lcdInvokeMissingRes = await client.callTool({
    name: 'invoke_resource_action',
    arguments: {
      resource: 'general_rpc_lcd',
      action: 'call_cosmos_lcd',
      payload: { path: '/cosmos/gov/v1beta1/proposals' },
    },
  });
  const lcdInvokeMissingText =
    (lcdInvokeMissingRes.content &&
      lcdInvokeMissingRes.content[0] &&
      lcdInvokeMissingRes.content[0].text) ||
    '';
  if (!/Missing 'endpoint' or 'chain_id'/i.test(lcdInvokeMissingText)) {
    throw new Error('Expected missing endpoint/chain_id error for call_cosmos_lcd');
  }

  // Invoke rpc get_connection_details and assert structure
  const rpcInvokeRes = await client.callTool({
    name: 'invoke_resource_action',
    arguments: {
      resource: 'general_rpc_lcd',
      action: 'get_connection_details',
      payload: {},
    },
  });
  const rpcInvokeText =
    (rpcInvokeRes.content && rpcInvokeRes.content[0] && rpcInvokeRes.content[0].text) || '';
  let rpcDetails;
  try {
    rpcDetails = JSON.parse(rpcInvokeText);
    // dbg('RPC details:', JSON.stringify(rpcDetails, null, 2));
  } catch (e) {
    throw new Error('general_rpc_lcd.get_connection_details did not return JSON');
  }
  // New structure: keyed by chain_id ('pacific-1', 'atlantic-2')
  if (!rpcDetails['pacific-1'] || !rpcDetails['atlantic-2']) {
    throw new Error('general_rpc_lcd.get_connection_details missing expected chain keys');
  }
  const pacific = rpcDetails['pacific-1'];
  const atlantic = rpcDetails['atlantic-2'];

  // Pacific checks
  if (!pacific?.cosmos?.rpc?.includes('https://rpc.sei-apis.com')) {
    throw new Error('pacific-1 cosmos.rpc missing expected endpoint');
  }
  if (!pacific?.cosmos?.lcd?.includes('https://rest.sei-apis.com')) {
    throw new Error('pacific-1 cosmos.lcd missing expected endpoint');
  }

  // Happy path: LCD proposals via pacific-1
  const lcdInvokeOk = await client.callTool({
    name: 'invoke_resource_action',
    arguments: {
      resource: 'general_rpc_lcd',
      action: 'call_cosmos_lcd',
      payload: {
        chain_id: 'pacific-1',
        path: '/cosmos/gov/v1beta1/proposals',
        query: { 'pagination.limit': 1 },
      },
    },
  });
  const lcdInvokeOkText =
    (lcdInvokeOk.content && lcdInvokeOk.content[0] && lcdInvokeOk.content[0].text) || '';
  dbg('call_cosmos_lcd response:', lcdInvokeOkText);
  let lcdJson;
  try {
    lcdJson = JSON.parse(lcdInvokeOkText);
  } catch {
    // tolerate non-JSON wrapper; ensure proposals keyword appears
  }
  if (lcdJson) {
    if (!Array.isArray(lcdJson.proposals)) {
      throw new Error('call_cosmos_lcd JSON missing proposals array');
    }
  } else if (!/proposals/i.test(lcdInvokeOkText)) {
    throw new Error('call_cosmos_lcd response missing proposals');
  }
  if (
    !Array.isArray(pacific?.evm?.rpc) ||
    !pacific.evm.rpc.includes('https://evm-rpc.sei-apis.com')
  ) {
    throw new Error('pacific-1 evm.rpc missing expected endpoint');
  }
  if (pacific?.evm?.chainId !== 1329) {
    throw new Error('pacific-1 evm.chainId is not 1329');
  }
  if (
    (pacific?.evm?.multicall3 || '').toLowerCase() !== '0x0864515c3b40b6c4a32af7e6090d8ba30b391b1a'
  ) {
    throw new Error('pacific-1 evm.multicall3 address mismatch');
  }
  if (pacific?.explorer?.url !== 'https://seitrace.com') {
    throw new Error('pacific-1 explorer.url mismatch');
  }

  // Atlantic checks
  if (!atlantic?.cosmos?.rpc?.includes('https://rpc-testnet.sei-apis.com')) {
    throw new Error('atlantic-2 cosmos.rpc missing expected endpoint');
  }
  if (!atlantic?.cosmos?.lcd?.includes('https://rest-testnet.sei-apis.com')) {
    throw new Error('atlantic-2 cosmos.lcd missing expected endpoint');
  }
  if (
    !Array.isArray(atlantic?.evm?.rpc) ||
    !atlantic.evm.rpc.includes('https://evm-rpc-testnet.sei-apis.com')
  ) {
    throw new Error('atlantic-2 evm.rpc missing expected endpoint');
  }
  if (atlantic?.evm?.chainId !== 1328) {
    throw new Error('atlantic-2 evm.chainId is not 1328');
  }
  if (
    (atlantic?.evm?.multicall3 || '').toLowerCase() !== '0xca11bde05977b3631167028862be2a173976ca11'
  ) {
    throw new Error('atlantic-2 evm.multicall3 address mismatch');
  }
  if (atlantic?.explorer?.url !== 'https://seitrace.com') {
    throw new Error('atlantic-2 explorer.url mismatch');
  }

  // Verify we can generate a shell snippet for faucet (fallback path)
  const faucetSnippetRes = await client.callTool({
    name: 'get_resource_action_snippet',
    arguments: { resource: 'general_faucet', action: 'request_faucet', language: 'shell' },
  });
  const faucetSnippetText =
    (faucetSnippetRes.content && faucetSnippetRes.content[0] && faucetSnippetRes.content[0].text) ||
    '';
  if (faucetSnippetText !== 'SNIPPET_GENERATION_NOT_SUPPORTED') {
    throw new Error('wrong');
  }

  // Associations resource should exist and expose get_associations action
  const assocActions = await client.callTool({
    name: 'list_resource_actions',
    arguments: { resource: 'general_associations' },
  });
  const assocActionsText =
    (assocActions.content && assocActions.content[0] && assocActions.content[0].text) || '';
  const assocActionsParsed = JSON.parse(assocActionsText);
  if (!assocActionsParsed.actions?.find((a) => a.name === 'get_associations')) {
    throw new Error('general_associations missing get_associations action');
  }

  // Snippet generation is supported for associations (shell)
  const assocSnippetRes = await client.callTool({
    name: 'get_resource_action_snippet',
    arguments: { resource: 'general_associations', action: 'get_associations', language: 'node' },
  });
  const assocSnippetText =
    (assocSnippetRes.content && assocSnippetRes.content[0] && assocSnippetRes.content[0].text) ||
    '';
  let assocSnippetParsed;
  try {
    assocSnippetParsed = JSON.parse(assocSnippetText);
    dbg(`general_associations.get_associations snippet: ${JSON.stringify(assocSnippetParsed)}`);
  } catch {
    throw new Error('general_associations.get_associations snippet did not return JSON');
  }
  if (
    !assocSnippetParsed?.snippet ||
    typeof assocSnippetParsed.snippet !== 'string' ||
    !/\/api\/v1\/addresses\/associations/.test(assocSnippetParsed.snippet)
  ) {
    throw new Error('associations snippet missing expected path');
  }

  // Schema requires hashes array; chain_id/endpoint optional
  const assocSchemaRes = await client.callTool({
    name: 'get_resource_action_schema',
    arguments: { resource: 'general_associations', action: 'get_associations' },
  });
  const assocSchemaText =
    (assocSchemaRes.content && assocSchemaRes.content[0] && assocSchemaRes.content[0].text) || '';
  const assocSchema = JSON.parse(assocSchemaText);
  if (
    !Array.isArray(assocSchema?.schema?.required) ||
    !assocSchema.schema.required.includes('hashes') ||
    assocSchema.schema.properties.hashes?.type !== 'array'
  ) {
    throw new Error('general_associations.get_associations schema invalid (hashes)');
  }

  // Invoke with pacific-1 sample hashes (public gateway); expect simplified fields
  const assocInvoke = await client.callTool({
    name: 'invoke_resource_action',
    arguments: {
      resource: 'general_associations',
      action: 'get_associations',
      payload: {
        chain_id: 'arctic-1',
        hashes: [
          '0x93F9989b63DCe31558EB6Eaf1005b5BA18E19b18',
          '0x93F7989b63DCe31558EB6Eaf1005b5BA18E19b18',
        ],
      },
    },
  });
  const assocInvokeText =
    (assocInvoke.content && assocInvoke.content[0] && assocInvoke.content[0].text) || '';
  let assocData;
  try {
    assocData = JSON.parse(assocInvokeText);
    // dbg(`general_associations.get_associations response: ${JSON.stringify(assocData)}`);
  } catch (e) {
    throw new Error('general_associations.get_associations did not return JSON');
  }
  if (!Array.isArray(assocData) || !assocData[0]?.hash || !Array.isArray(assocData[0]?.mappings)) {
    throw new Error('general_associations.get_associations unexpected shape');
  }
  // If a mapping has a CREATE_*_POINTER type, it should include pointer and pointee
  const anyPointer = assocData
    .flatMap((e) => e.mappings || [])
    .find((m) => /CREATE_.*_POINTER/.test(m?.type || ''));
  if (anyPointer && (!anyPointer.pointer || !anyPointer.pointee)) {
    throw new Error('pointer mapping missing pointer/pointee fields');
  }
};
