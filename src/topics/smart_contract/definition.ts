import {
  endpointDefinitionMap as smartContractEndpoints,
  RESOURCE_DESCRIPTION as SMART_CONTRACT_DESC,
} from './resources/definition.js';
import { smartContractResolver, searchContractsResolver } from './resources/resolver.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Smart Contract topic key.
 */
export const TOPIC_KEY = 'smart_contract';

// Merge all smart contract topic endpoints into a single map for wiring in the topic index.
export const endpointDefinitionMap = smartContractEndpoints;

// Resource-level descriptions for the Smart Contract topic
export const SMART_CONTRACT_RESOURCE_DESCRIPTION_MAP: Record<string, string> = {
  [`${TOPIC_KEY}`]: SMART_CONTRACT_DESC,
};

/**
 * Resolver functions for shaping API responses.
 */
export const RESOLVER_MAP: Record<string, (result: CallToolResult) => CallToolResult> = {
  [`smartContract`]: smartContractResolver,
  [`searchContracts`]: searchContractsResolver,
};
