export const testInsightsAssetsTokensReal = async (client) => {
  // Query for a well-known asset: iSEI ERC-20 on pacific-1
  const res = await client.callTool({
    name: 'invoke_resource_action',
    arguments: {
      resource: 'insights_assets',
      action: 'search_tokens',
      payload: { chain_id: 'pacific-1', type: 'ERC-20', q: 'isei' },
    },
  });
  const text = (res.content && res.content[0] && res.content[0].text) || '';
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('insights_assets.search_tokens (real) did not return JSON');
  }

  if (!parsed || !Array.isArray(parsed.items) || parsed.items.length === 0) {
    throw new Error('insights_assets.search_tokens (real) returned no items for query "isei"');
  }

  const isAddr = (s) => typeof s === 'string' && /^0x[a-fA-F0-9]{40}$/.test(s);
  const match = parsed.items.find((it) => {
    const sym = (it?.symbol || '').toLowerCase();
    const name = (it?.name || '').toLowerCase();
    return (sym === 'isei' || name === 'isei') && (it?.type === 'ERC-20') && isAddr(it?.address);
  });

  if (!match) {
    // Provide a helpful diagnostic for debugging CI/network flakiness
    const sample = parsed.items.slice(0, 5);
    throw new Error(
      'Expected to find iSEI in ERC-20 token search results, but did not. Sample: ' +
        JSON.stringify(sample)
    );
  }
};
