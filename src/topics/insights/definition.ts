/**
 * The key for the insights topic.
 */
export const TOPIC_KEY = 'insights';

// Short, LLM-friendly descriptions keyed by resource name suffix (controller-derived)
// e.g. insights_erc20, insights_erc721, insights_native, insights_address
export const INSIGHTS_RESOURCE_DESCRIPTION_MAP: Record<string, string> = {
  [`${TOPIC_KEY}_address`]: 'Query address data: details, transactions, token transfers.',
  [`${TOPIC_KEY}_erc20`]: 'Query ERC-20 tokens: info, balances, transfers, holders.',
  [`${TOPIC_KEY}_cw20`]: 'Query CW20 tokens: info, balances, transfers, holders.',
  [`${TOPIC_KEY}_native`]: 'Query native tokens: info, transfers, balances, holders.',
  [`${TOPIC_KEY}_ics20`]: 'Query ICS20 tokens: info, transfers, balances, holders.',
  [`${TOPIC_KEY}_erc721`]: 'Query ERC-721 tokens: info, holders, instances, balances, transfers.',
  [`${TOPIC_KEY}_erc1155`]: 'Query ERC-1155 tokens: info, holders, instances, balances, transfers.',
  [`${TOPIC_KEY}_cw721`]: 'Query CW721 tokens: info, instances, balances, holders, transfers.',
  [`${TOPIC_KEY}_smart_contract`]: 'Query smart contract details.',
  [`${TOPIC_KEY}_assets`]: 'List/Search official assets and fetch asset details by identifier.',
};

// Resolver wiring for insights topic
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { searchAssetsResolver, getAssetDetailsResolver, getAssetsDetailsResolver } from './resources/assets/resolver.js';

export const RESOLVER_MAP: Record<string, (result: CallToolResult, payload?: any) => CallToolResult> = {
  ['searchAssets']: searchAssetsResolver,
  ['getAssetDetails']: getAssetDetailsResolver,
  ['getAssetsDetails']: getAssetsDetailsResolver,
};
