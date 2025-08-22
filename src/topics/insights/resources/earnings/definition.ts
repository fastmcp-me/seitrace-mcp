import { McpToolDefinition } from '../../../../types.js';

export const RESOURCE_DESCRIPTION =
  'Search and fetch earnings pools (APR/APY) on pacific-1. Supports top pools and optional search by name/symbol/address; and details by pool address.';

// Endpoint base (absolute) – we rely on api executor supporting absolute URLs
const EARNINGS_ENDPOINT = 'https://workspace-api.seitrace.com/api/v1/apy/top';

export const endpointDefinitionMap: Map<string, McpToolDefinition> = new Map([
  [
    'EarningsController-searchEarnings',
    {
      name: 'EarningsController-searchEarnings',
      description:
        'List/search earnings pools for pacific-1. When search_terms omitted, returns top pools (max 50).',
      inputSchema: {
        type: 'object',
        properties: {
          chain_id: {
            enum: ['pacific-1'],
            type: 'string',
            description: 'Chain ID (only pacific-1 supported).',
          },
          search_terms: {
            type: 'string',
            description:
              'Optional search over pool name, provider name, or address (case-insensitive).',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results to return (default 20, max 50).',
            default: 20,
            maximum: 50,
          },
        },
        required: ['chain_id'],
        additionalProperties: false,
      },
      method: 'get',
      // absolute URL so executor will not prepend baseUrl
      pathTemplate: EARNINGS_ENDPOINT,
      executionParameters: [
        { name: 'search_terms', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [],
      executor: 'api',
      resolver: 'searchEarnings',
      snippetGenerator: 'general',
    },
  ],
  [
    'EarningsController-getEarningDetails',
    {
      name: 'EarningsController-getEarningDetails',
      description:
        'Get a single earnings pool by pool address for pacific-1. Performs client-side filter over the listing endpoint.',
      inputSchema: {
        type: 'object',
        properties: {
          chain_id: {
            enum: ['pacific-1'],
            type: 'string',
            description: 'Chain ID (only pacific-1 supported).',
          },
          pool_address: {
            type: 'string',
            description: 'The pool contract address to match exactly (case-insensitive).',
            minLength: 1,
          },
        },
        required: ['chain_id', 'pool_address'],
        additionalProperties: false,
      },
      method: 'get',
      pathTemplate: EARNINGS_ENDPOINT,
      executionParameters: [],
      requestBodyContentType: undefined,
      securityRequirements: [],
      executor: 'api',
      resolver: 'getEarningDetails',
      snippetGenerator: 'general',
    },
  ],
]);
