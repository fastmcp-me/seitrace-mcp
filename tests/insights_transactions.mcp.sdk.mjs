export const testInsightsTransactions = async (client) => {
  // 1) Ensure transactions resource/actions are discoverable
  const listRes = await client.callTool({
    name: 'list_resource_actions',
    arguments: { resource: 'insights_transactions' },
  });
  const listText = (listRes.content && listRes.content[0] && listRes.content[0].text) || '';
  let listParsed;
  try {
    listParsed = JSON.parse(listText);
  } catch {
    throw new Error('insights_transactions list_resource_actions did not return JSON');
  }
  const names = (listParsed.actions || []).map((a) => a.name);
  if (!names.includes('get_transaction_details')) {
    throw new Error('insights_transactions missing get_transaction_details');
  }

  // 2) Schema must require hash
  const schemaRes = await client.callTool({
    name: 'get_resource_action_schema',
    arguments: { resource: 'insights_transactions', action: 'get_transaction_details' },
  });
  const schemaText = (schemaRes.content && schemaRes.content[0] && schemaRes.content[0].text) || '';
  const schemaParsed = JSON.parse(schemaText);
  if (!Array.isArray(schemaParsed?.schema?.required) || !schemaParsed.schema.required.includes('hash')) {
    throw new Error('get_transaction_details schema missing required hash');
  }

  // 3) Snippet generation for Node should include the path and hash
  const hashExample = '0xbf65a1154d190bf8006781f37ececf020afb5e5a8d3448af9b561fb8470dab1a';
  const snippetRes = await client.callTool({
    name: 'get_resource_action_snippet',
    arguments: {
      resource: 'insights_transactions',
      action: 'get_transaction_details',
      language: 'node',
      payload: { chain_id: 'pacific-1', hash: hashExample },
    },
  });
  const snippetText = (snippetRes.content && snippetRes.content[0] && snippetRes.content[0].text) || '';
  const snippetParsed = JSON.parse(snippetText);
  if (!snippetParsed?.snippet || !/\/api\/v1\/transactions\//.test(snippetParsed.snippet) || !new RegExp(hashExample).test(snippetParsed.snippet)) {
    throw new Error('get_transaction_details snippet missing expected path/hash');
  }

  // 4) Invoke action; ensure JSON is returned
  const invokeRes = await client.callTool({
    name: 'invoke_resource_action',
    arguments: {
      resource: 'insights_transactions',
      action: 'get_transaction_details',
      payload: { chain_id: 'pacific-1', hash: hashExample },
    },
  });
  const invokeText = (invokeRes.content && invokeRes.content[0] && invokeRes.content[0].text) || '';
  try {
    JSON.parse(invokeText);
  } catch {
    throw new Error('get_transaction_details did not return JSON');
  }
};
