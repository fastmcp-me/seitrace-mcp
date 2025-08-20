import { generateGeneralFromDefinition } from './general.js';
import { generateRpcSnippet } from './rpc.js';
import { generateSnippet as generateOASSnippet } from './oas.js';
import { generateEthersSnippet } from './ethers.js';

/**
 * Map of snippet generators by type.
 */
export const SNIPPET_GENERATOR_MAP = {
  oas: generateOASSnippet,
  general: generateGeneralFromDefinition,
  rpc: generateRpcSnippet,
  ethers: generateEthersSnippet,
};
