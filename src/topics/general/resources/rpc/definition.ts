import { McpToolDefinition } from '../../../../types.js';

// Short, LLM-friendly description of this resource
export const RESOURCE_DESCRIPTION =
  'Get general information about Sei (rpcs, lcds, explorers), and making rpc calls to the Sei network.';

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
          token: {
            symbol: 'SEI',
            name: 'SEI',
            logo: 'https://raw.githubusercontent.com/Seitrace/sei-assetlist/main/images/Sei.png',
            smallestEVMUnit: 'gwei',
            evmDecimals: 18,
            cosmosDecimals: 6,
            smallestCosmosUnit: 'usei',
          },
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
          token: {
            symbol: 'SEI',
            name: 'SEI',
            logo: 'https://raw.githubusercontent.com/Seitrace/sei-assetlist/main/images/Sei.png',
            smallestEVMUnit: 'gwei',
            evmDecimals: 18,
            cosmosDecimals: 6,
            smallestCosmosUnit: 'usei',
          },
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
  },
  ],
  [
    'RpcController-callEvmRpc',
    {
      name: 'RpcController-callEvmRpc',
      description:
        'Perform a JSON-RPC call against the Sei EVM endpoint. Provide rpc_method and optional params; specify chain_id or an explicit endpoint override.',
      inputSchema: {
        type: 'object',
        properties: {
          rpc_method: { type: 'string', description: 'JSON-RPC method name (e.g., eth_blockNumber)' },
          params: {
            type: 'array',
            description: 'JSON-RPC params array',
            items: {},
            default: [],
          },
          chain_id: {
            type: 'string',
            description: 'Target chain ID if no endpoint override provided',
            enum: ['pacific-1', 'atlantic-2'],
          },
          endpoint: {
            type: 'string',
            description:
              'Optional EVM RPC endpoint override. If provided, chain_id is ignored for routing.',
          },
        },
        required: ['rpc_method'],
        additionalProperties: false,
      },
      method: 'rpc',
      executionParameters: [],
      securityRequirements: [],
      executor: 'rpc',
  snippetGenerator: 'rpc',
    },
  ],
  [
    'RpcController-callCosmosRpc',
    {
      name: 'RpcController-callCosmosRpc',
      description:
        'Perform a JSON-RPC call against the Sei Cosmos (Tendermint) RPC endpoint. Provide rpc_method and optional params; specify chain_id or an explicit endpoint override.',
      inputSchema: {
        type: 'object',
        properties: {
          rpc_method: { type: 'string', description: 'JSON-RPC method name (e.g., status)' },
          params: {
            type: 'array',
            description: 'JSON-RPC params array',
            items: {},
            default: [],
          },
          chain_id: {
            type: 'string',
            description: 'Target chain ID if no endpoint override provided',
            enum: ['pacific-1', 'atlantic-2'],
          },
          endpoint: {
            type: 'string',
            description:
              'Optional Cosmos RPC endpoint override. If provided, chain_id is ignored for routing.',
          },
        },
        required: ['rpc_method'],
        additionalProperties: false,
      },
      method: 'rpc',
      executionParameters: [],
      securityRequirements: [],
      executor: 'rpc',
  snippetGenerator: 'rpc',
    },
  ],
]);
