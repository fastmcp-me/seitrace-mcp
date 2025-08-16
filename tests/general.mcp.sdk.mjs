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

  // Additional checks for the new general_rpc resource
  // Verify actions include get_connection_details
  const rpcActionsRes = await client.callTool({
    name: 'list_resource_actions',
    arguments: { resource: 'general_rpc' },
  });
  const rpcActionsText =
    (rpcActionsRes.content && rpcActionsRes.content[0] && rpcActionsRes.content[0].text) || '';
  const rpcActionsParsed = JSON.parse(rpcActionsText);
  if (
    !Array.isArray(rpcActionsParsed.actions) ||
    !rpcActionsParsed.actions.find((a) => a.name === 'get_connection_details')
  ) {
    throw new Error('general_rpc missing get_connection_details action');
  }

  // Verify rpc schema requires no inputs
  const rpcSchemaRes = await client.callTool({
    name: 'get_resource_action_schema',
    arguments: { resource: 'general_rpc', action: 'get_connection_details' },
  });
  const rpcSchemaText =
    (rpcSchemaRes.content && rpcSchemaRes.content[0] && rpcSchemaRes.content[0].text) || '';
  const rpcSchema = JSON.parse(rpcSchemaText);
  if (!rpcSchema?.schema || rpcSchema.schema.type !== 'object') {
    throw new Error('general_rpc.get_connection_details schema missing or not an object');
  }
  if (Array.isArray(rpcSchema.schema.required) && rpcSchema.schema.required.length) {
    throw new Error('general_rpc.get_connection_details should not require any fields');
  }

  // Invoke rpc get_connection_details and assert structure
  const rpcInvokeRes = await client.callTool({
    name: 'invoke_resource_action',
    arguments: {
      resource: 'general_rpc',
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
    throw new Error('general_rpc.get_connection_details did not return JSON');
  }
  // New structure: keyed by chain_id ('pacific-1', 'atlantic-2')
  if (!rpcDetails['pacific-1'] || !rpcDetails['atlantic-2']) {
    throw new Error('general_rpc.get_connection_details missing expected chain keys');
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
};
