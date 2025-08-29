export const testInsightsAssetsTokens = async (client) => {
  // 1) Resource actions should include new searches
  const actionsRes = await client.callTool({
    name: 'list_resource_actions',
    arguments: { resource: 'insights_assets' },
  });
  const actionsText =
    (actionsRes.content && actionsRes.content[0] && actionsRes.content[0].text) || '';
  const actions = JSON.parse(actionsText);
  const names = (actions.actions || []).map((a) => a.name);
  const required = [
    'search_tokens',
    'search_native_tokens',
    'search_ics20_tokens',
  ];
  for (const r of required) {
    if (!names.includes(r)) throw new Error(`insights_assets missing action: ${r}`);
  }

  // 2) Schema checks
  const schemaCheck = async (action, requiredKey) => {
    const res = await client.callTool({
      name: 'get_resource_action_schema',
      arguments: { resource: 'insights_assets', action },
    });
    const text = (res.content && res.content[0] && res.content[0].text) || '';
    const parsed = JSON.parse(text);
    if (!parsed?.schema?.properties?.[requiredKey]) {
      throw new Error(`${action} schema missing ${requiredKey} property`);
    }
    if (!Array.isArray(parsed?.schema?.required) || !parsed.schema.required.includes(requiredKey)) {
      throw new Error(`${action} schema missing required key: ${requiredKey}`);
    }
    return parsed;
  };

  const tokensSchema = await schemaCheck('search_tokens', 'q');
  const enumValues = tokensSchema?.schema?.properties?.type?.enum || [];
  const requiredTypes = ['CW-20', 'CW-721', 'ERC-20', 'ERC-721', 'ERC-1155'];
  for (const t of requiredTypes) {
    if (!enumValues.includes(t)) {
      throw new Error(`search_tokens type enum missing: ${t}`);
    }
  }
  // FACTORY may be supported by some gateways; warn if absent but don't fail
  if (!enumValues.includes('FACTORY')) {
    // Use test logger helper instead of console; ignore failures silently
    try {
      const utils = await import('./utils.mjs');
      if (utils?.dbg) utils.dbg('[WARN] FACTORY not present in search_tokens type enum');
    } catch {
      void 0; // ignore
    }
  }

  await schemaCheck('search_native_tokens', 'search');
  await schemaCheck('search_ics20_tokens', 'search');

  // 3) Snippet generation (Node) for each
  const snippetCheck = async (action, payload, pathRegex, queryKey) => {
    const res = await client.callTool({
      name: 'get_resource_action_snippet',
      arguments: {
        resource: 'insights_assets',
        action,
        language: 'node',
        payload,
      },
    });
    const text = (res.content && res.content[0] && res.content[0].text) || '';
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error(`insights_assets.${action} snippet did not return JSON`);
    }
    if (!parsed?.snippet || !pathRegex.test(parsed.snippet) || !new RegExp(`[?&]${queryKey}=`).test(parsed.snippet)) {
      throw new Error(`${action} snippet missing expected path or query ${queryKey} ${JSON.stringify(parsed)}`);
    }
  };

  await snippetCheck(
    'search_tokens',
    { chain_id: 'pacific-1', type: 'ERC-20', q: 'test' },
    /\/api\/v1\/tokens/, 
    'q'
  );
  await snippetCheck(
    'search_native_tokens',
    { chain_id: 'atlantic-2', search: 'sei' },
    /\/api\/v1\/native-tokens/,
    'search'
  );
  await snippetCheck(
    'search_ics20_tokens',
    { chain_id: 'arctic-1', search: 'ibc' },
    /\/api\/v1\/ics20-tokens/,
    'search'
  );

  // 4) Invoke endpoints and assert JSON shape
  const invokeCheck = async (action, payload) => {
    const res = await client.callTool({
      name: 'invoke_resource_action',
      arguments: { resource: 'insights_assets', action, payload },
    });
    const text = (res.content && res.content[0] && res.content[0].text) || '';
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error(`insights_assets.${action} did not return JSON`);
    }
    // Expect normalized shape: { items: [...] } with at most 10 entries and minimal fields
    if (!parsed || !Array.isArray(parsed.items)) {
      throw new Error(`insights_assets.${action} missing items array`);
    }
    if (parsed.items.length > 10) {
      throw new Error(`insights_assets.${action} items should be trimmed to 10 or fewer`);
    }
    // Check minimal fields presence (optional values allowed but keys should exist when present)
    for (const it of parsed.items) {
      if (it && typeof it === 'object') {
        const keys = Object.keys(it);
        const allowed = ['address', 'name', 'symbol', 'type'];
        // ensure no unexpected keys
        for (const k of keys) {
          if (!allowed.includes(k)) {
            throw new Error(`insights_assets.${action} returned unexpected field: ${k}`);
          }
        }
      }
    }
  };

  await invokeCheck('search_tokens', { chain_id: 'pacific-1', type: 'ERC-20', q: 'test' });
  await invokeCheck('search_native_tokens', { chain_id: 'pacific-1', search: 'sei' });
  await invokeCheck('search_ics20_tokens', { chain_id: 'pacific-1', search: 'ibc' });
};
