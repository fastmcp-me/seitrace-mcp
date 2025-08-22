import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { McpResponse } from '../../../../utils/index.js';

function toText(result: CallToolResult): string {
  return (result.content && result.content[0] && (result.content[0] as any).text) || '';
}

type EarningItem = {
  id?: string;
  pool_name?: string;
  pool_address?: string;
  pool_image?: string;
  total_apr?: number;
  total_apy?: number;
  tvl?: number;
  provider?: { provider_name?: string };
  [k: string]: any;
};

function normalizeAddress(addr?: string): string {
  return typeof addr === 'string' ? addr.toLowerCase() : '';
}

function simplifyItem(it: EarningItem) {
  const address = it?.pool_address || '';
  return {
    name: it?.pool_name,
    address,
    url: address ? `https://seitrace.com/earning/${address}` : undefined,
    image: it?.pool_image,
    provider: it?.provider?.provider_name,
    tvl: it?.tvl,
    apr: it?.total_apr,
    apy: it?.total_apy,
  };
}

export function searchEarningsResolver(result: CallToolResult, payload?: any): CallToolResult {
  const text = toText(result);
  try {
    const parsed = JSON.parse(text);
    if (parsed?.error) return result;

    const items: EarningItem[] = Array.isArray(parsed?.items) ? parsed.items : [];
    // Optional local filter by search_terms if executor didn't include it
    const q = String((payload && payload.search_terms) || '').trim().toLowerCase();
    const limitRaw = Number((payload && payload.limit) || 20);
    const limit = isFinite(limitRaw) ? Math.max(1, Math.min(50, limitRaw)) : 20;

    let filtered = items;
    if (q) {
      filtered = items.filter((i) => {
        const name = String(i?.pool_name || '').toLowerCase();
        const provider = String(i?.provider?.provider_name || '').toLowerCase();
        const addr = String(i?.pool_address || '').toLowerCase();
        return name.includes(q) || provider.includes(q) || addr.includes(q);
      });
    }

    const simplified = filtered.slice(0, limit).map(simplifyItem);
    return McpResponse(
      JSON.stringify({
        items: simplified,
        count: simplified.length,
      })
    );
  } catch (error) {
    return McpResponse(
      JSON.stringify({
        error: 'Failed to parse earnings response',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    );
  }
}

export function getEarningDetailsResolver(result: CallToolResult, payload?: any): CallToolResult {
  const text = toText(result);
  try {
    const parsed = JSON.parse(text);
    if (parsed?.error) return result;

    const items: EarningItem[] = Array.isArray(parsed?.items) ? parsed.items : [];
    const qAddr = normalizeAddress((payload && payload.pool_address) || '');
    if (!qAddr) return McpResponse(JSON.stringify({ error: 'pool_address not provided to resolver' }));

    const match = items.find((i) => normalizeAddress(i?.pool_address) === qAddr);
    if (!match) return McpResponse(JSON.stringify({ error: 'EARNING_NOT_FOUND', pool_address: payload?.pool_address }));

    return McpResponse(JSON.stringify({ item: simplifyItem(match) }));
  } catch (error) {
    return McpResponse(
      JSON.stringify({
        error: 'Failed to parse earnings response',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    );
  }
}
