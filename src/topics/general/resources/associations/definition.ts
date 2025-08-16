import { McpToolDefinition } from '../../../../types.js';

export const RESOURCE_DESCRIPTION =
  'Query hybrid associations (EOA, pointers) between EVM and Native Sei (addresses/assets/txs).';

/**
 * Associations endpoints map for the General topic.
 * Adds a single action that queries the chain gateway and simplifies the response.
 */
export const endpointDefinitionMap = new Map<string, McpToolDefinition>([
  [
    'AssociationsController-getAssociations',
    {
      name: 'AssociationsController-getAssociations',
      description:
        'Get association mappings for one or more hashes (EVM/Sei address, asset, or tx). The resolver shapes the response to include pointer/pointee fields when applicable.',
      inputSchema: {
        type: 'object',
        properties: {
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID to target (ignored if endpoint override provided).',
          },
          endpoint: {
            type: 'string',
            description:
              'Optional base URL override e.g. https://pacific-1-gateway.seitrace.com. If provided, chain_id is ignored.',
          },
          hashes: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
            description:
              'List of hashes to lookup (EVM address/tx, Sei address, or asset identifiers).',
          },
        },
        required: ['hashes'],
        additionalProperties: false,
        description:
          'Provide hashes and either chain_id or an explicit endpoint override for the gateway.',
      },
      method: 'get',
      // Relative path used by the gateway
      pathTemplate: '/api/v1/addresses/associations',
      executionParameters: [
        { name: 'chain_id', in: 'query' },
        { name: 'endpoint', in: 'query' },
        { name: 'hashes', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [],
      // Custom executor that handles base URL selection; resolver shapes the output.
      executor: 'gateway',
      resolver: 'associations',
      snippetGenerator: null,
    },
  ],
]);
