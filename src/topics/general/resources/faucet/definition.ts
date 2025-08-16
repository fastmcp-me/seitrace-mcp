import { McpToolDefinition } from '../../../../types.js';

/**
 * Faucet endpoint definition
 * Controller/action key format: <ControllerName>-<ActionNameCamel>
 * We use FaucetController-postFaucet so the resource tool name becomes `general_faucet`.
 */
export const endpointDefinitionMap: Map<string, McpToolDefinition> = new Map([
  [
    'FaucetController-requestFaucet',
    {
      name: 'FaucetController-requestFaucet',
      description:
        'Request faucet funds (limited to once every 24h per API key). Available chains: arctic-1, atlantic-2. Wont support snippet generation.',
      inputSchema: {
        type: 'object',
        properties: {
          wallet_address: { type: 'string', description: 'EVM wallet address' },
          chain_id: {
            type: 'string',
            description: 'Target chain ID',
            enum: ['arctic-1', 'atlantic-2'],
          },
        },
        required: ['wallet_address', 'chain_id'],
        additionalProperties: false,
      },
      method: 'post',
      pathTemplate: '/api/v1/mcp/faucet',
      // No path/query/header parameters; body carries the inputs
      executionParameters: [],
      requestBodyContentType: 'application/json',
      securityRequirements: [{ apiKey: [] }],
      executor: 'api',
      snippetGenerator: null,
    },
  ],
]);
