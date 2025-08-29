import { McpToolDefinition } from '../../../../types.js';

export const RESOURCE_DESCRIPTION =
  'Search official assets by name/symbol/identifier and fetch asset details by identifier. Uses Sei gateway; search is performed offline over the fetched list.';

/**
 * Assets endpoints (gateway-backed). We expose two actions under insights_assets:
 * - search_assets: Offline fuzzy search over the asset catalog returned by /api/v1/workspace/assets
 * - get_assets_details: Fetch details for a single asset by identifier
 */
export const endpointDefinitionMap: Map<string, McpToolDefinition> = new Map([
  [
    'AssetsController-searchAssets',
    {
      name: 'AssetsController-searchAssets',
      description:
        'Search official assets by name, symbol, or identifier. Performs offline fuzzy match over the assets list retrieved from the specified gateway. Returns up to 10 matches with basic fields.',
      inputSchema: {
        type: 'object',
        properties: {
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description:
              'Chain ID to target (ignored if endpoint override provided). Only used to select the gateway host.',
          },
          endpoint: {
            type: 'string',
            description:
              'Optional base URL override e.g. https://pacific-1-gateway.seitrace.com. If provided, chain_id is ignored.',
          },
          query: {
            type: 'string',
            description: 'Case-insensitive search string for name, symbol, or identifier.',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results to return (default 10, max 50).',
            default: 10,
            maximum: 50,
          },
        },
  required: ['query'],
        additionalProperties: false,
      },
      method: 'get',
      // We hit the workspace assets endpoint to obtain the full list, then filter locally in resolver
      pathTemplate: '/api/v1/workspace/assets',
      executionParameters: [
        { name: 'chain_id', in: 'query' },
        { name: 'endpoint', in: 'query' },
        // no additional query params for server; search is performed in resolver
      ],
      requestBodyContentType: undefined,
      securityRequirements: [],
      executor: 'gateway',
      resolver: 'searchAssets',
      snippetGenerator: 'general',
    },
  ],
  [
    'AssetsController-searchTokens',
    {
      name: 'AssetsController-searchTokens',
      description:
        "Search gateway tokens by type and query (unofficial + official listings). Supported types: 'CW-20', 'CW-721', 'ERC-20', 'ERC-721', 'ERC-1155', 'FACTORY'.",
      inputSchema: {
        type: 'object',
        properties: {
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description:
              'Chain ID to target (ignored if endpoint override provided). Only used to select the gateway host.',
          },
          endpoint: {
            type: 'string',
            description:
              'Optional base URL override e.g. https://pacific-1-gateway.seitrace.com. If provided, chain_id is ignored.',
          },
          type: {
            type: 'string',
            description:
              "Token type filter: one of 'CW-20', 'CW-721', 'ERC-20', 'ERC-721', 'ERC-1155', 'FACTORY'",
            enum: ['CW-20', 'CW-721', 'ERC-20', 'ERC-721', 'ERC-1155', 'FACTORY'],
          },
          search: {
            type: 'string',
            description: 'Free-text search over name, symbol, and address where applicable.',
          },
        },
        required: ['search'],
        additionalProperties: false,
      },
      method: 'get',
      // Example: https://pacific-1-gateway.seitrace.com/api/v1/tokens?type=ERC-20&search=test
      pathTemplate: '/api/v1/tokens',
      executionParameters: [
        { name: 'chain_id', in: 'query' },
        { name: 'endpoint', in: 'query' },
        { name: 'type', in: 'query' },
        { name: 'search', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [],
  executor: 'gateway',
  resolver: 'searchGatewayTokens',
  snippetGenerator: 'general',
    },
  ],
  [
    'AssetsController-searchNativeTokens',
    {
      name: 'AssetsController-searchNativeTokens',
      description:
        'Search native tokens (bank module) by name/symbol/denom on the gateway.',
      inputSchema: {
        type: 'object',
        properties: {
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description:
              'Chain ID to target (ignored if endpoint override provided). Only used to select the gateway host.',
          },
          endpoint: {
            type: 'string',
            description:
              'Optional base URL override e.g. https://pacific-1-gateway.seitrace.com. If provided, chain_id is ignored.',
          },
          search: { type: 'string', description: 'Search string' },
        },
        required: ['search'],
        additionalProperties: false,
      },
      method: 'get',
      // Example: https://pacific-1-gateway.seitrace.com/api/v1/native-tokens?search=test
      pathTemplate: '/api/v1/native-tokens',
      executionParameters: [
        { name: 'chain_id', in: 'query' },
        { name: 'endpoint', in: 'query' },
        { name: 'search', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [],
  executor: 'gateway',
  resolver: 'searchNativeTokens',
  snippetGenerator: 'general',
    },
  ],
  [
    'AssetsController-searchIcs20Tokens',
    {
      name: 'AssetsController-searchIcs20Tokens',
      description: 'Search ICS20 tokens by name/symbol/denom on the gateway.',
      inputSchema: {
        type: 'object',
        properties: {
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description:
              'Chain ID to target (ignored if endpoint override provided). Only used to select the gateway host.',
          },
          endpoint: {
            type: 'string',
            description:
              'Optional base URL override e.g. https://pacific-1-gateway.seitrace.com. If provided, chain_id is ignored.',
          },
          search: { type: 'string', description: 'Search string' },
        },
        required: ['search'],
        additionalProperties: false,
      },
      method: 'get',
      // Example: https://pacific-1-gateway.seitrace.com/api/v1/ics20-tokens?search=test
      pathTemplate: '/api/v1/ics20-tokens',
      executionParameters: [
        { name: 'chain_id', in: 'query' },
        { name: 'endpoint', in: 'query' },
        { name: 'search', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [],
  executor: 'gateway',
  resolver: 'searchIcs20Tokens',
  snippetGenerator: 'general',
    },
  ],
  [
    'AssetsController-getAssetsDetails',
    {
      name: 'AssetsController-getAssetsDetails',
      description:
        'Get official asset details by identifier using the workspace assets endpoint. Identifier can be an IBC denom, CW20/EVM contract, or canonical ID used by the endpoint.',
      inputSchema: {
        type: 'object',
        properties: {
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description:
              'Chain ID to target (ignored if endpoint override provided). Only used to select the gateway host.',
          },
          endpoint: {
            type: 'string',
            description:
              'Optional base URL override e.g. https://pacific-1-gateway.seitrace.com. If provided, chain_id is ignored.',
          },
          identifier: {
            type: 'string',
            description: 'Unique asset identifier to match exactly within the assets list.',
            minLength: 1,
          },
        },
        required: ['identifier'],
        additionalProperties: false,
      },
      method: 'get',
      pathTemplate: '/api/v1/workspace/assets',
      executionParameters: [
        { name: 'chain_id', in: 'query' },
        { name: 'endpoint', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [],
      executor: 'gateway',
      resolver: 'getAssetsDetails',
      snippetGenerator: 'general',
    },
  ],
]);
