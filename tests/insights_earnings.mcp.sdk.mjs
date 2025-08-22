export const testInsightsEarnings = async (client) => {
  // Resource discovery
  const actionsRes = await client.callTool({
    name: 'list_resource_actions',
    arguments: { resource: 'insights_earnings' },
  });
  const actionsText = (actionsRes.content && actionsRes.content[0] && actionsRes.content[0].text) || '';
  const actions = JSON.parse(actionsText);
  const names = (actions.actions || []).map((a) => a.name);
  if (!names.includes('search_earnings') || !names.includes('get_earning_details')) {
    throw new Error('insights_earnings missing required actions');
  }

  // Schemas
  const searchSchemaRes = await client.callTool({
    name: 'get_resource_action_schema',
    arguments: { resource: 'insights_earnings', action: 'search_earnings' },
  });
  const searchSchemaText = (searchSchemaRes.content && searchSchemaRes.content[0] && searchSchemaRes.content[0].text) || '';
  const searchSchema = JSON.parse(searchSchemaText);
  if (
    !searchSchema?.schema?.properties?.chain_id ||
    !Array.isArray(searchSchema?.schema?.required) ||
    !searchSchema.schema.required.includes('chain_id')
  ) {
    throw new Error('search_earnings schema must require chain_id');
  }

  const detailsSchemaRes = await client.callTool({
    name: 'get_resource_action_schema',
    arguments: { resource: 'insights_earnings', action: 'get_earning_details' },
  });
  const detailsSchemaText = (detailsSchemaRes.content && detailsSchemaRes.content[0] && detailsSchemaRes.content[0].text) || '';
  const detailsSchema = JSON.parse(detailsSchemaText);
  if (
    !detailsSchema?.schema?.properties?.pool_address ||
    !Array.isArray(detailsSchema?.schema?.required) ||
    !detailsSchema.schema.required.includes('pool_address')
  ) {
    throw new Error('get_earning_details schema must require pool_address');
  }

  // Snippets (node)
  const searchSnippetRes = await client.callTool({
    name: 'get_resource_action_snippet',
    arguments: {
      resource: 'insights_earnings',
      action: 'search_earnings',
      language: 'node',
      payload: { chain_id: 'pacific-1', search_terms: 'isei', limit: 3 },
    },
  });
  const searchSnippetText = (searchSnippetRes.content && searchSnippetRes.content[0] && searchSnippetRes.content[0].text) || '';
  let searchSnippet;
  try {
    searchSnippet = JSON.parse(searchSnippetText);
  } catch {
    throw new Error('insights_earnings.search_earnings snippet did not return JSON');
  }
  if (!searchSnippet?.snippet || !/workspace-api\.seitrace\.com\/api\/v1\/apy\/top/.test(searchSnippet.snippet)) {
    throw new Error('search_earnings snippet missing expected endpoint');
  }
  if (!/[?&]search_terms=isei/.test(searchSnippet.snippet)) {
    throw new Error('search_earnings snippet missing search_terms');
  }

  const detailsSnippetRes = await client.callTool({
    name: 'get_resource_action_snippet',
    arguments: {
      resource: 'insights_earnings',
      action: 'get_earning_details',
      language: 'node',
      payload: { chain_id: 'pacific-1', pool_address: '0x49561C4a905f7acCdaCAec5e3C17113d5f1C5a3b' },
    },
  });
  const detailsSnippetText = (detailsSnippetRes.content && detailsSnippetRes.content[0] && detailsSnippetRes.content[0].text) || '';
  let detailsSnippet;
  try {
    detailsSnippet = JSON.parse(detailsSnippetText);
  } catch {
    throw new Error('insights_earnings.get_earning_details snippet did not return JSON');
  }
  if (!detailsSnippet?.snippet || !/workspace-api\.seitrace\.com\/api\/v1\/apy\/top/.test(detailsSnippet.snippet)) {
    throw new Error('get_earning_details snippet missing expected endpoint');
  }

  // Invoke: search_earnings
  const searchInvoke = await client.callTool({
    name: 'invoke_resource_action',
    arguments: {
      resource: 'insights_earnings',
      action: 'search_earnings',
      payload: { chain_id: 'pacific-1', search_terms: 'isei', limit: 3 },
    },
  });
  const searchInvokeText = (searchInvoke.content && searchInvoke.content[0] && searchInvoke.content[0].text) || '';
  let searchData;
  try {
    searchData = JSON.parse(searchInvokeText);
  } catch {
    throw new Error('insights_earnings.search_earnings did not return JSON');
  }
  if (!searchData || !Array.isArray(searchData.items)) {
    throw new Error('insights_earnings.search_earnings did not return items array');
  }
  const hasUrl = searchData.items.some((it) => it && typeof it.url === 'string' && /seitrace\.com\/earning\//.test(it.url));
  if (!hasUrl) {
    throw new Error('search_earnings simplified output missing url property');
  }

  // Invoke: get_earning_details using an address from search results if available
  const candidate = (searchData.items || []).find((it) => it && it.pool_address);
  if (candidate) {
    const detailsInvoke = await client.callTool({
      name: 'invoke_resource_action',
      arguments: {
        resource: 'insights_earnings',
        action: 'get_earning_details',
        payload: { chain_id: 'pacific-1', pool_address: candidate.pool_address },
      },
    });
    const detailsInvokeText = (detailsInvoke.content && detailsInvoke.content[0] && detailsInvoke.content[0].text) || '';
    let detailsData;
    try {
      detailsData = JSON.parse(detailsInvokeText);
    } catch {
      throw new Error('insights_earnings.get_earning_details did not return JSON');
    }
    if (!detailsData || !detailsData.item || !detailsData.item.url) {
      throw new Error('insights_earnings.get_earning_details missing item with url');
    }
  }
};
