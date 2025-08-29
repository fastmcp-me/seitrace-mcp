import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { McpResponse } from '../../../../utils/index.js';

type Asset = {
  identifier?: string;
  id?: string;
  name?: string;
  symbol?: string;
  denom?: string;
  // Allow other fields without strict typing
  [k: string]: any;
};

function normalizeId(a: Asset): string {
  return (
    (typeof a.identifier === 'string' && a.identifier) ||
    (typeof a.id === 'string' && a.id) ||
    (typeof a.denom === 'string' && a.denom) ||
    ''
  );
}

function toText(result: CallToolResult): string {
  return (result.content && result.content[0] && (result.content[0] as any).text) || '';
}

/**
 * Resolver for offline asset search over the full list returned by the gateway.
 * Input is the raw response from GET /api/v1/workspace/assets.
 * Output is a trimmed array of matches with commonly useful fields.
 */
export function searchAssetsResolver(result: CallToolResult, payload?: any): CallToolResult {
  const text = toText(result);
  try {
    const parsed = JSON.parse(text);
    if (parsed?.error) return result;

    // The gateway returns an array of assets or an object with items
    const assets: Asset[] = Array.isArray(parsed) ? parsed : parsed?.items || [];
    if (!Array.isArray(assets)) {
      return McpResponse(
        JSON.stringify({ error: 'Expected array of assets', available_fields: Object.keys(parsed || {}) })
      );
    }

  // Use provided payload for query and limit
  const q = String((payload && payload.query) || '').trim().toLowerCase();
  const limitRaw = Number((payload && payload.limit) || 10);
  const limit = isFinite(limitRaw) ? Math.max(1, Math.min(50, limitRaw)) : 10;

    // If we don't have query, try to guess from a conventional field injected by tests in future.
    // Given lack of channel to pass args, we implement a permissive subset: return first 10 when no query available.
    let filtered = assets;
    if (q) {
      filtered = assets.filter((a) => {
        const name = String(a?.name || '').toLowerCase();
        const symbol = String(a?.symbol || '').toLowerCase();
        const ident = String(normalizeId(a)).toLowerCase();
        return name.includes(q) || symbol.includes(q) || ident.includes(q);
      });
    }

    const simplified = filtered.slice(0, limit).map((a) => ({
      identifier: normalizeId(a) || undefined,
      name: a?.name,
      symbol: a?.symbol,
      denom: a?.denom,
      decimals: a?.decimals,
      address: a?.address,
      type: a?.type,
    }));

    return McpResponse(JSON.stringify({ assets: simplified }));
  } catch (error) {
    return McpResponse(
      JSON.stringify({
        error: 'Failed to parse assets response',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    );
  }
}

/**
 * Resolver for asset details by identifier. It searches the fetched list and returns the full matching asset.
 */
export function getAssetDetailsResolver(result: CallToolResult, payload?: any): CallToolResult {
  const text = toText(result);
  try {
    const parsed = JSON.parse(text);
    if (parsed?.error) return result;

  const identifier = String((payload && payload.identifier) || '').toLowerCase();
    const assets: Asset[] = Array.isArray(parsed) ? parsed : parsed?.items || [];
    if (!identifier) {
      return McpResponse(JSON.stringify({ error: 'Identifier not provided to resolver' }));
    }
    const match = assets.find((a) => String(normalizeId(a)).toLowerCase() === identifier);
    if (!match) {
      return McpResponse(JSON.stringify({ error: 'Asset not found', identifier }));
    }
    return McpResponse(JSON.stringify({ asset: match }));
  } catch (error) {
    return McpResponse(
      JSON.stringify({
        error: 'Failed to parse assets response',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    );
  }
}

// Alias with pluralized name used in definition
export const getAssetsDetailsResolver = getAssetDetailsResolver;

/** Utility to extract text from CallToolResult */
function _text(result: CallToolResult): string {
  return (result.content && (result.content[0] as any)?.text) || '';
}

/** Normalize a gateway search response to the latest 10 with minimal fields */
function normalizeGatewaySearch(text: string): { items: Array<{ address?: string; name?: string; symbol?: string; type?: string }> } | { error: string } {
  try {
    const parsed = JSON.parse(text);
    const items = Array.isArray(parsed?.items) ? parsed.items : Array.isArray(parsed) ? parsed : [];
    const simplified = items.slice(0, 10).map((it: any) => ({
      address: typeof it?.address === 'string' ? it.address : undefined,
      name: typeof it?.name === 'string' ? it.name : undefined,
      symbol: typeof it?.symbol === 'string' ? it.symbol : undefined,
      type: typeof it?.type === 'string' ? it.type : undefined,
    }));
    return { items: simplified };
  } catch (e: any) {
    return { error: `Failed to parse gateway search: ${e?.message || 'Unknown error'}` };
  }
}

export function searchGatewayTokensResolver(result: CallToolResult): CallToolResult {
  const text = _text(result);
  const out = normalizeGatewaySearch(text);
  if ('error' in out) return McpResponse(JSON.stringify(out));
  return McpResponse(JSON.stringify(out));
}

export function searchNativeTokensResolver(result: CallToolResult): CallToolResult {
  const text = _text(result);
  const out = normalizeGatewaySearch(text);
  if ('error' in out) return McpResponse(JSON.stringify(out));
  return McpResponse(JSON.stringify(out));
}

export function searchIcs20TokensResolver(result: CallToolResult): CallToolResult {
  const text = _text(result);
  const out = normalizeGatewaySearch(text);
  if ('error' in out) return McpResponse(JSON.stringify(out));
  return McpResponse(JSON.stringify(out));
}
