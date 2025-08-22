export const testInsightsAssets = async (client) => {
  // Resource should exist
  const actionsRes = await client.callTool({
    name: 'list_resource_actions',
    arguments: { resource: 'insights_assets' },
  });
  const actionsText = (actionsRes.content && actionsRes.content[0] && actionsRes.content[0].text) || '';
  const actions = JSON.parse(actionsText);
  const names = (actions.actions || []).map((a) => a.name);
  if (!names.includes('search_assets') || !names.includes('get_assets_details')) {
    throw new Error('insights_assets missing required actions');
  }

  // Schemas should be objects and require expected fields
  const searchSchemaRes = await client.callTool({
    name: 'get_resource_action_schema',
    arguments: { resource: 'insights_assets', action: 'search_assets' },
  });
  const searchSchemaText = (searchSchemaRes.content && searchSchemaRes.content[0] && searchSchemaRes.content[0].text) || '';
  const searchSchema = JSON.parse(searchSchemaText);
  if (
    !searchSchema?.schema?.properties?.query ||
    !Array.isArray(searchSchema?.schema?.required) ||
    !searchSchema.schema.required.includes('query')
  ) {
    throw new Error('search_assets schema missing query requirement');
  }

  const detailSchemaRes = await client.callTool({
    name: 'get_resource_action_schema',
  arguments: { resource: 'insights_assets', action: 'get_assets_details' },
  });
  const detailSchemaText = (detailSchemaRes.content && detailSchemaRes.content[0] && detailSchemaRes.content[0].text) || '';
  const detailSchema = JSON.parse(detailSchemaText);
  if (
    !detailSchema?.schema?.properties?.identifier ||
    !Array.isArray(detailSchema?.schema?.required) ||
    !detailSchema.schema.required.includes('identifier')
  ) {
    throw new Error('get_asset_details schema missing identifier requirement');
  }

  // Snippet generation for search_assets (node)
  const searchSnippetRes = await client.callTool({
    name: 'get_resource_action_snippet',
    arguments: {
      resource: 'insights_assets',
      action: 'search_assets',
      language: 'node',
      payload: { chain_id: 'pacific-1', query: 'sei', limit: 5 },
    },
  });
  const searchSnippetText =
    (searchSnippetRes.content && searchSnippetRes.content[0] && searchSnippetRes.content[0].text) ||
    '';
  let searchSnippet;
  try {
    searchSnippet = JSON.parse(searchSnippetText);
  } catch {
    throw new Error('insights_assets.search_assets snippet did not return JSON');
  }
  if (
    !searchSnippet?.snippet ||
    !/\/api\/v1\/workspace\/assets/.test(searchSnippet.snippet) ||
    !/[?&]query=sei/.test(searchSnippet.snippet)
  ) {
    throw new Error('search_assets snippet missing expected path or query');
  }

  // Snippet generation for get_assets_details (node)
  const detailsSnippetRes = await client.callTool({
    name: 'get_resource_action_snippet',
    arguments: {
      resource: 'insights_assets',
      action: 'get_assets_details',
      language: 'node',
      payload: { chain_id: 'pacific-1', identifier: 'usei' },
    },
  });
  const detailsSnippetText =
    (detailsSnippetRes.content &&
      detailsSnippetRes.content[0] &&
      detailsSnippetRes.content[0].text) || '';
  let detailsSnippet;
  try {
    detailsSnippet = JSON.parse(detailsSnippetText);
  } catch {
    throw new Error('insights_assets.get_assets_details snippet did not return JSON');
  }
  if (
    !detailsSnippet?.snippet ||
    !/\/api\/v1\/workspace\/assets/.test(detailsSnippet.snippet) ||
    !/[?&]identifier=usei/.test(detailsSnippet.snippet)
  ) {
    throw new Error('get_assets_details snippet missing expected path or identifier');
  }

  // Invoke search_assets and expect an assets array result
  const searchInvoke = await client.callTool({
    name: 'invoke_resource_action',
    arguments: {
      resource: 'insights_assets',
      action: 'search_assets',
      payload: { chain_id: 'pacific-1', query: 'sei', limit: 5 },
    },
  });
  const searchInvokeText =
    (searchInvoke.content && searchInvoke.content[0] && searchInvoke.content[0].text) || '';
  let searchData;
  try {
    searchData = JSON.parse(searchInvokeText);
  } catch {
    throw new Error('insights_assets.search_assets did not return JSON');
  }
  if (!searchData || !Array.isArray(searchData.assets)) {
    throw new Error('insights_assets.search_assets did not return assets array');
  }

  // If we have at least one asset with an identifier, test get_assets_details using that identifier
  const candidate = (searchData.assets || []).find((a) => a && (a.identifier || a.denom));
  if (candidate && (candidate.identifier || candidate.denom)) {
    const identifier = candidate.identifier || candidate.denom;
    const detailsInvoke = await client.callTool({
      name: 'invoke_resource_action',
      arguments: {
        resource: 'insights_assets',
        action: 'get_assets_details',
        payload: { chain_id: 'pacific-1', identifier },
      },
    });
    const detailsInvokeText =
      (detailsInvoke.content &&
        detailsInvoke.content[0] &&
        detailsInvoke.content[0].text) || '';
    let detailsData;
    try {
      detailsData = JSON.parse(detailsInvokeText);
    } catch {
      throw new Error('insights_assets.get_assets_details did not return JSON');
    }
    if (!detailsData || !detailsData.asset) {
      throw new Error('insights_assets.get_assets_details missing asset in response');
    }
  }
};
