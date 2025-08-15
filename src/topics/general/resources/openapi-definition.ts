import { McpToolDefinition } from '../../../types.js';

/**
 * General topic OpenAPI-like definitions
 *
 * This file declares the single "faucet" resource for the `general` topic.
 * The endpoint allows requesting faucet funds once every 24 hours per API key.
 * The 24h throttling is enforced server-side; we just surface the endpoint and schema.
 */

/**
 * Security schemes for general topic (API Key via x-api-key header)
 * Handlers will call `applySecurity(...)` to inject this header when
 * an environment variable SECRET_APIKEY is present.
 */
export const securitySchemes = {
  apiKey: {
    type: 'apiKey',
    in: 'header',
    name: 'x-api-key',
  },
};

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
    },
  ],
]);
