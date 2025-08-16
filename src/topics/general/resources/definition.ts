import { endpointDefinitionMap as faucetEndpoints } from './faucet/definition.js';
import { endpointDefinitionMap as rpcEndpoints } from './rpc/definition.js';

// Merge all general topic endpoints into a single map for wiring in the topic index.
export const endpointDefinitionMap = new Map([
  ...Array.from(faucetEndpoints.entries()),
  ...Array.from(rpcEndpoints.entries()),
]);
