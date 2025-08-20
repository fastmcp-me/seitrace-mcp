import { McpToolDefinition } from '../../../types.js';

// Short, LLM-friendly description of this resource
export const RESOURCE_DESCRIPTION =
  'Get smart contract details, or download smart contract ABI from Seitrace (Pacific-1, Atlantic-2, Arctic-1).';

/**
 * Smart Contract endpoint definition
 * Controller/action key format: <ControllerName>-<ActionNameCamel>
 * We use ContractController-downloadAbi so the resource tool name becomes `smart_contract_contract`.
 */
export const endpointDefinitionMap: Map<string, McpToolDefinition> = new Map([
  [
    'Controller-downloadAbi',
    {
      name: 'Controller-downloadAbi',
      description:
        'Download ABI for a smart contract by its address from Seitrace networks. Returns only the ABI field instead of the full contract metadata to reduce response size. Supports Pacific-1, Atlantic-2, and Arctic-1 chains. Does not support snippet generation.',
      inputSchema: {
        type: 'object',
        properties: {
          contract_address: {
            type: 'string',
            description: 'EVM contract address (0x-prefixed hex string)',
            pattern: '^0x[a-fA-F0-9]{40}$',
          },
          chain: {
            type: 'string',
            description: 'Seitrace network chain identifier',
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            default: 'pacific-1',
          },
        },
        required: ['contract_address'],
        additionalProperties: false,
      },
      method: 'get',
      pathTemplate: '/api/v2/smart-contracts/{contract_address}',
      // Path parameter for contract address
      executionParameters: [
        {
          name: 'contract_address',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [],
      executor: 'api',
      resolver: 'smartContract',
      snippetGenerator: null, // Explicitly disable snippet generation as requested
    },
  ],
]);
