import { McpToolDefinition } from '../../../../types.js';

/**
 * RPC connection details for developers (local/static action)
 * This resource does not call a remote API; instead it returns
 * predefined connection info for Sei (Cosmos + EVM) and Explorer.
 */

export const endpointDefinitionMap: Map<string, McpToolDefinition> = new Map([
  [
    'RpcController-getConnectionDetails',
    {
      name: 'RpcController-getConnectionDetails',
      description:
        'Get RPC/LCD endpoints and explorer details for developers connecting to Sei (Cosmos + EVM). The agents will use these info for setting smart contract developments like foundry, hardhat, vyper, ...',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
        additionalProperties: false,
      },
      // Local execution: handled inside GeneralTopic without HTTP call
      method: 'local',
      executionParameters: [],
      securityRequirements: [],
      executor: null,
      snippetGenerator: null,
      // Static response payload with connection details
      staticResponse: {
        ['pacific-1']: {
          cosmos: {
            rpc: ['https://rpc.sei-apis.com'],
            lcd: ['https://rest.sei-apis.com'],
          },
          evm: {
            rpc: [
              'https://evm-rpc.sei-apis.com',
              'https://evm-rpc-sei.stingray.plus',
              'https://sei-evm-rpc.publicnode.com',
              'https://seievm-rpc.polkachu.com',
            ],
            chainId: 1329,
            multicall3: '0x0864515c3B40B6C4A32af7e6090D8bA30b391b1A',
          },
          explorer: {
            url: 'https://seitrace.com',
            variant: 'blockscout',
          },
        },
        ['atlantic-2']: {
          cosmos: {
            rpc: ['https://rpc-testnet.sei-apis.com'],
            lcd: ['https://rest-testnet.sei-apis.com'],
          },
          evm: {
            rpc: [
              'https://evm-rpc-testnet.sei-apis.com',
              'https://evm-rpc-testnet-sei.stingray.plus',
              'https://seievm-testnet-rpc.polkachu.com',
              'https://sei-testnet.drpc.org',
            ],
            chainId: 1328,
            multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11',
          },
          explorer: {
            url: 'https://seitrace.com',
            variant: 'blockscout',
          },
        },
      },
    } as McpToolDefinition & { staticResponse: any },
  ],
]);
