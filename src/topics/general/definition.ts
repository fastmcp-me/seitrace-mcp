import {
  endpointDefinitionMap as faucetEndpoints,
  RESOURCE_DESCRIPTION as FAUCET_DESC,
} from './resources/faucet/definition.js';
import {
  endpointDefinitionMap as rpcEndpoints,
  RESOURCE_DESCRIPTION as RPC_DESC,
} from './resources/rpc_lcd/definition.js';
import {
  endpointDefinitionMap as associationsEndpoints,
  RESOURCE_DESCRIPTION as ASSOCIATIONS_DESC,
} from './resources/associations/definition.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { associationsResolver } from './resources/associations/resolver.js';

/**
 * General topic key.
 */
export const TOPIC_KEY = 'general';

// Merge all general topic endpoints into a single map for wiring in the topic index.
export const endpointDefinitionMap = new Map([
  ...Array.from(faucetEndpoints.entries()),
  ...Array.from(rpcEndpoints.entries()),
  ...Array.from(associationsEndpoints.entries()),
]);

// Resource-level descriptions for the General topic
export const GENERAL_RESOURCE_DESCRIPTION_MAP: Record<string, string> = {
  [`${TOPIC_KEY}_faucet`]: FAUCET_DESC,
  [`${TOPIC_KEY}_rpc_lcd`]: RPC_DESC,
  [`${TOPIC_KEY}_associations`]: ASSOCIATIONS_DESC,
};

/**
 * Resolver functions for shaping API responses.
 */
export const RESOLVER_MAP: Record<string, (result: CallToolResult) => CallToolResult> = {
  [`associations`]: associationsResolver,
};
