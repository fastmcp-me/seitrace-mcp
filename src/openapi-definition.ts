import { McpToolDefinition } from './types.js';


/**
 * Security schemes from the OpenAPI spec
 */
export const securitySchemes = {
  apiKey: {
    type: 'apiKey',
    in: 'header',
    name: 'x-api-key',
  },
};

/**
 * Flat map of endpoint tool definitions by name (as originally generated)
 * Example key: "Erc20TokenController-getErc20Balances"
 */
export const endpointDefinitionMap: Map<string, McpToolDefinition> = new Map([
  [
    'AddressController-getAddressDetail',
    {
      name: 'AddressController-getAddressDetail',
      description: `
The endpoint to get address details. 

|||
|---|---|
|Eligible For|**Free Trial and Paid users**|    
|Cost|**50 Credit Units**|    
`,
      inputSchema: {
        type: 'object',
        properties: {
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID',
          },
          address: { type: 'string', description: 'Wallet address (EVM or Sei address)' },
        },
        required: ['chain_id', 'address'],
      },
      method: 'get',
      pathTemplate: '/api/v2/addresses',
      executionParameters: [
        { name: 'chain_id', in: 'query' },
        { name: 'address', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ apiKey: [] }],
    },
  ],
  [
    'AddressController-getAddressTransactions',
    {
      name: 'AddressController-getAddressTransactions',
      description: `
The endpoint to get address transactions. 

|||
|---|---|
|Eligible For|**Free Trial and Paid users**|    
|Cost|**100 Credit Units**|    
`,
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            maximum: 50,
            type: 'number',
            description: 'Limit of items to be returned, capped at 50',
          },
          offset: { maximum: 500000, type: 'number', description: 'Offset' },
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID',
          },
          address: { type: 'string', description: 'Wallet address (EVM or Sei address)' },
          from_date: { type: 'string', description: 'From date' },
          to_date: { type: 'string', description: 'To date' },
          status: {
            enum: ['ALL', 'SUCCESS', 'ERROR'],
            type: 'string',
            description: 'Transaction status',
          },
        },
        required: ['chain_id', 'address', 'status'],
      },
      method: 'get',
      pathTemplate: '/api/v2/addresses/transactions',
      executionParameters: [
        { name: 'limit', in: 'query' },
        { name: 'offset', in: 'query' },
        { name: 'chain_id', in: 'query' },
        { name: 'address', in: 'query' },
        { name: 'from_date', in: 'query' },
        { name: 'to_date', in: 'query' },
        { name: 'status', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ apiKey: [] }],
    },
  ],
  [
    'AddressController-getAddressTokenTransfers',
    {
      name: 'AddressController-getAddressTokenTransfers',
      description: `
The endpoint to get address token transfers. 

|||
|---|---|
|Eligible For|**Free Trial and Paid users**|    
|Cost|**100 Credit Units**|    
`,
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            maximum: 50,
            type: 'number',
            description: 'Limit of items to be returned, capped at 50',
          },
          offset: { maximum: 500000, type: 'number', description: 'Offset' },
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID',
          },
          address: { type: 'string', description: 'Wallet address (EVM or Sei address)' },
          from_date: { type: 'string', description: 'From date' },
          to_date: { type: 'string', description: 'To date' },
        },
        required: ['chain_id', 'address'],
      },
      method: 'get',
      pathTemplate: '/api/v2/addresses/token-transfers',
      executionParameters: [
        { name: 'limit', in: 'query' },
        { name: 'offset', in: 'query' },
        { name: 'chain_id', in: 'query' },
        { name: 'address', in: 'query' },
        { name: 'from_date', in: 'query' },
        { name: 'to_date', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ apiKey: [] }],
    },
  ],
  [
    'Erc20TokenController-getErc20TokenInfo',
    {
      name: 'Erc20TokenController-getErc20TokenInfo',
      description: `
The endpoint to get Erc20 token info. 

|||
|---|---|
|Eligible For|**Free Trial and Paid users**|    
|Cost|**50 Credit Units**|    
`,
      inputSchema: {
        type: 'object',
        properties: {
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID',
          },
          contract_address: { type: 'string', description: 'Contract address' },
        },
        required: ['chain_id', 'contract_address'],
      },
      method: 'get',
      pathTemplate: '/api/v2/token/erc20',
      executionParameters: [
        { name: 'chain_id', in: 'query' },
        { name: 'contract_address', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ apiKey: [] }],
    },
  ],
  [
    'Erc20TokenController-getErc20Balances',
    {
      name: 'Erc20TokenController-getErc20Balances',
      description: `
The endpoint to get Erc20 token balances.

|||
|---|---|
|Eligible For|**Free Trial and Paid users**|
|Cost|**50 Credit Units**|
`,
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            maximum: 50,
            type: 'number',
            description: 'Limit of items to be returned, capped at 50',
          },
          offset: { maximum: 500000, type: 'number', description: 'Offset' },
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID',
          },
          address: { type: 'string', description: 'Wallet address' },
          token_contract_list: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of token contract addresses',
          },
        },
        required: ['chain_id', 'address'],
      },
      method: 'get',
      pathTemplate: '/api/v2/token/erc20/balances',
      executionParameters: [
        { name: 'limit', in: 'query' },
        { name: 'offset', in: 'query' },
        { name: 'chain_id', in: 'query' },
        { name: 'address', in: 'query' },
        { name: 'token_contract_list', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ apiKey: [] }],
    },
  ],
  [
    'Erc20TokenController-getErc20TokenTransfers',
    {
      name: 'Erc20TokenController-getErc20TokenTransfers',
      description: `
The endpoint to get Erc20 token transfers. Sorted by time in descending order.

|||
|---|---|
|Eligible For|**Free Trial and Paid users**|
|Cost|**100 Credit Units**|
`,
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            maximum: 50,
            type: 'number',
            description: 'Limit of items to be returned, capped at 50',
          },
          offset: { maximum: 500000, type: 'number', description: 'Offset' },
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID',
          },
          contract_address: { type: 'string', description: 'Contract address' },
          wallet_address: { type: 'string', description: 'Wallet address' },
          from_date: { type: 'string', description: 'From date' },
          to_date: { type: 'string', description: 'To date' },
        },
        required: ['chain_id', 'contract_address'],
      },
      method: 'get',
      pathTemplate: '/api/v2/token/erc20/transfers',
      executionParameters: [
        { name: 'limit', in: 'query' },
        { name: 'offset', in: 'query' },
        { name: 'chain_id', in: 'query' },
        { name: 'contract_address', in: 'query' },
        { name: 'wallet_address', in: 'query' },
        { name: 'from_date', in: 'query' },
        { name: 'to_date', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ apiKey: [] }],
    },
  ],
  [
    'Erc20TokenController-getErc20TokenHolders',
    {
      name: 'Erc20TokenController-getErc20TokenHolders',
      description: `
The endpoint to get Erc20 token holders. Sorted by amount in descending order.

|||
|---|---|
|Eligible For|**Paid users**|
|Cost|**100 Credit Units**|
`,
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            maximum: 50,
            type: 'number',
            description: 'Limit of items to be returned, capped at 50',
          },
          offset: { maximum: 500000, type: 'number', description: 'Offset' },
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID',
          },
          contract_address: { type: 'string', description: 'Contract address' },
        },
        required: ['chain_id', 'contract_address'],
      },
      method: 'get',
      pathTemplate: '/api/v2/token/erc20/holders',
      executionParameters: [
        { name: 'limit', in: 'query' },
        { name: 'offset', in: 'query' },
        { name: 'chain_id', in: 'query' },
        { name: 'contract_address', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ apiKey: [] }],
    },
  ],
  [
    'Erc721TokenController-getErc721TokenInfo',
    {
      name: 'Erc721TokenController-getErc721TokenInfo',
      description: `
The endpoint to get Erc721 token info. 

|||
|---|---|
|Eligible For|**Free Trial and Paid users**|    
|Cost|**50 Credit Units**|    
`,
      inputSchema: {
        type: 'object',
        properties: {
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID',
          },
          contract_address: { type: 'string', description: 'Contract address' },
        },
        required: ['chain_id', 'contract_address'],
      },
      method: 'get',
      pathTemplate: '/api/v2/token/erc721',
      executionParameters: [
        { name: 'chain_id', in: 'query' },
        { name: 'contract_address', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ apiKey: [] }],
    },
  ],
  [
    'Erc721TokenController-getErc721Instance',
    {
      name: 'Erc721TokenController-getErc721Instance',
      description: `
The endpoint to get Erc721 token instances.

|||
|---|---|
|Eligible For|**Free Trial and Paid users**|    
|Cost|**100 Credit Units**|    
`,
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            maximum: 50,
            type: 'number',
            description: 'Limit of items to be returned, capped at 50',
          },
          offset: { maximum: 500000, type: 'number', description: 'Offset' },
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID',
          },
          contract_address: { type: 'string', description: 'Contract address' },
          token_id: { type: 'string', description: 'Token id' },
        },
        required: ['chain_id', 'contract_address'],
      },
      method: 'get',
      pathTemplate: '/api/v2/token/erc721/instances',
      executionParameters: [
        { name: 'limit', in: 'query' },
        { name: 'offset', in: 'query' },
        { name: 'chain_id', in: 'query' },
        { name: 'contract_address', in: 'query' },
        { name: 'token_id', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ apiKey: [] }],
    },
  ],
  [
    'Erc721TokenController-getErc721TokenBalances',
    {
      name: 'Erc721TokenController-getErc721TokenBalances',
      description: `
The endpoint to get Erc721 token balances. 

|||
|---|---|
|Eligible For|**Free Trial and Paid users**|    
|Cost|**100 Credit Units**|    
`,
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            maximum: 50,
            type: 'number',
            description: 'Limit of items to be returned, capped at 50',
          },
          offset: { maximum: 500000, type: 'number', description: 'Offset' },
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID',
          },
          address: { type: 'string', description: 'Wallet address' },
          token_contract_list: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of token contract addresses',
          },
        },
        required: ['chain_id', 'address'],
      },
      method: 'get',
      pathTemplate: '/api/v2/token/erc721/balances',
      executionParameters: [
        { name: 'limit', in: 'query' },
        { name: 'offset', in: 'query' },
        { name: 'chain_id', in: 'query' },
        { name: 'address', in: 'query' },
        { name: 'token_contract_list', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ apiKey: [] }],
    },
  ],
  [
    'Erc721TokenController-getErc721TokenTransfers',
    {
      name: 'Erc721TokenController-getErc721TokenTransfers',
      description: `
The endpoint to get Erc721 token transfers. Sorted by descending order of timestamp. 

|||
|---|---|
|Eligible For|**Free Trial and Paid users**|    
|Cost|**100 Credit Units**|    
`,
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            maximum: 50,
            type: 'number',
            description: 'Limit of items to be returned, capped at 50',
          },
          offset: { maximum: 500000, type: 'number', description: 'Offset' },
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID',
          },
          contract_address: { type: 'string', description: 'Contract address' },
          wallet_address: { type: 'string', description: 'Wallet address' },
          from_date: { type: 'string', description: 'From date' },
          to_date: { type: 'string', description: 'To date' },
          token_id: { type: 'string', description: 'Token ID' },
        },
        required: ['chain_id', 'contract_address'],
      },
      method: 'get',
      pathTemplate: '/api/v2/token/erc721/transfers',
      executionParameters: [
        { name: 'limit', in: 'query' },
        { name: 'offset', in: 'query' },
        { name: 'chain_id', in: 'query' },
        { name: 'contract_address', in: 'query' },
        { name: 'wallet_address', in: 'query' },
        { name: 'from_date', in: 'query' },
        { name: 'to_date', in: 'query' },
        { name: 'token_id', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ apiKey: [] }],
    },
  ],
  [
    'Erc721TokenController-getErc721TokenHolders',
    {
      name: 'Erc721TokenController-getErc721TokenHolders',
      description: `
The endpoint to get Erc721 token holders. Sorted by descending order of holding. 

|||
|---|---|
|Eligible For|**Free Trial and Paid users**|    
|Cost|**100 Credit Units**|    
`,
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            maximum: 50,
            type: 'number',
            description: 'Limit of items to be returned, capped at 50',
          },
          offset: { maximum: 500000, type: 'number', description: 'Offset' },
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID',
          },
          contract_address: { type: 'string', description: 'Contract address' },
          wallet_address: { type: 'string', description: 'Wallet address' },
        },
        required: ['chain_id', 'contract_address'],
      },
      method: 'get',
      pathTemplate: '/api/v2/token/erc721/holders',
      executionParameters: [
        { name: 'limit', in: 'query' },
        { name: 'offset', in: 'query' },
        { name: 'chain_id', in: 'query' },
        { name: 'contract_address', in: 'query' },
        { name: 'wallet_address', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ apiKey: [] }],
    },
  ],
  [
    'Erc1155TokenController-getErc1155TokenInfo',
    {
      name: 'Erc1155TokenController-getErc1155TokenInfo',
      description: `
The endpoint to get Erc1155 token info. 

|||
|---|---|
|Eligible For|**Free Trial and Paid users**|    
|Cost|**50 Credit Units**|    
`,
      inputSchema: {
        type: 'object',
        properties: {
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID',
          },
          contract_address: { type: 'string', description: 'Contract address' },
        },
        required: ['chain_id', 'contract_address'],
      },
      method: 'get',
      pathTemplate: '/api/v2/token/erc1155',
      executionParameters: [
        { name: 'chain_id', in: 'query' },
        { name: 'contract_address', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ apiKey: [] }],
    },
  ],
  [
    'Erc1155TokenController-getErc1155Instance',
    {
      name: 'Erc1155TokenController-getErc1155Instance',
      description: `
The endpoint to get Erc1155 token instances.

|||
|---|---|
|Eligible For|**Free Trial and Paid users**|    
|Cost|**50 Credit Units**|    
`,
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            maximum: 50,
            type: 'number',
            description: 'Limit of items to be returned, capped at 50',
          },
          offset: { maximum: 500000, type: 'number', description: 'Offset' },
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID',
          },
          contract_address: { type: 'string', description: 'Contract address' },
          token_id: { type: 'string', description: 'Token id' },
        },
        required: ['chain_id', 'contract_address'],
      },
      method: 'get',
      pathTemplate: '/api/v2/token/erc1155/instances',
      executionParameters: [
        { name: 'limit', in: 'query' },
        { name: 'offset', in: 'query' },
        { name: 'chain_id', in: 'query' },
        { name: 'contract_address', in: 'query' },
        { name: 'token_id', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ apiKey: [] }],
    },
  ],
  [
    'Erc1155TokenController-getErc1155TokenHolders',
    {
      name: 'Erc1155TokenController-getErc1155TokenHolders',
      description: `
The endpoint to get Erc1155 token holders. Sorted by descending order of holding. 

|||
|---|---|
|Eligible For|**Free Trial and Paid users**|    
|Cost|**100 Credit Units**|    
`,
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            maximum: 50,
            type: 'number',
            description: 'Limit of items to be returned, capped at 50',
          },
          offset: { maximum: 500000, type: 'number', description: 'Offset' },
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID',
          },
          contract_address: { type: 'string', description: 'Contract address' },
          wallet_address: { type: 'string', description: 'Wallet address' },
        },
        required: ['chain_id', 'contract_address'],
      },
      method: 'get',
      pathTemplate: '/api/v2/token/erc1155/holders',
      executionParameters: [
        { name: 'limit', in: 'query' },
        { name: 'offset', in: 'query' },
        { name: 'chain_id', in: 'query' },
        { name: 'contract_address', in: 'query' },
        { name: 'wallet_address', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ apiKey: [] }],
    },
  ],
  [
    'Erc1155TokenController-getErc1155TokenBalances',
    {
      name: 'Erc1155TokenController-getErc1155TokenBalances',
      description: `
The endpoint to get Erc1155 token balances. 

|||
|---|---|
|Eligible For|**Free Trial and Paid users**|    
|Cost|**100 Credit Units**|    
`,
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            maximum: 50,
            type: 'number',
            description: 'Limit of items to be returned, capped at 50',
          },
          offset: { maximum: 500000, type: 'number', description: 'Offset' },
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID',
          },
          address: { type: 'string', description: 'Wallet address' },
          token_contract_list: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of token contract addresses',
          },
        },
        required: ['chain_id', 'address'],
      },
      method: 'get',
      pathTemplate: '/api/v2/token/erc1155/balances',
      executionParameters: [
        { name: 'limit', in: 'query' },
        { name: 'offset', in: 'query' },
        { name: 'chain_id', in: 'query' },
        { name: 'address', in: 'query' },
        { name: 'token_contract_list', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ apiKey: [] }],
    },
  ],
  [
    'Erc1155TokenController-getErc1155TokenTransfers',
    {
      name: 'Erc1155TokenController-getErc1155TokenTransfers',
      description: `
The endpoint to get Erc1155 token transfers. Sorted by descending order of timestamp. 

|||
|---|---|
|Eligible For|**Free Trial and Paid users**|    
|Cost|**100 Credit Units**|    
`,
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            maximum: 50,
            type: 'number',
            description: 'Limit of items to be returned, capped at 50',
          },
          offset: { maximum: 500000, type: 'number', description: 'Offset' },
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID',
          },
          contract_address: { type: 'string', description: 'Contract address' },
          wallet_address: { type: 'string', description: 'Wallet address' },
          from_date: { type: 'string', description: 'From date' },
          to_date: { type: 'string', description: 'To date' },
          token_id: { type: 'string', description: 'Token ID' },
        },
        required: ['chain_id', 'contract_address'],
      },
      method: 'get',
      pathTemplate: '/api/v2/token/erc1155/transfers',
      executionParameters: [
        { name: 'limit', in: 'query' },
        { name: 'offset', in: 'query' },
        { name: 'chain_id', in: 'query' },
        { name: 'contract_address', in: 'query' },
        { name: 'wallet_address', in: 'query' },
        { name: 'from_date', in: 'query' },
        { name: 'to_date', in: 'query' },
        { name: 'token_id', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ apiKey: [] }],
    },
  ],
  [
    'Cw20TokenController-getCw20TokenInfo',
    {
      name: 'Cw20TokenController-getCw20TokenInfo',
      description: `
The endpoint to get CW20 token info. 

|||
|---|---|
|Eligible For|**Free Trial and Paid users**|    
|Cost|**50 Credit Units**|    
`,
      inputSchema: {
        type: 'object',
        properties: {
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID',
          },
          contract_address: { type: 'string', description: 'Wallet address' },
        },
        required: ['chain_id', 'contract_address'],
      },
      method: 'get',
      pathTemplate: '/api/v2/token/cw20',
      executionParameters: [
        { name: 'chain_id', in: 'query' },
        { name: 'contract_address', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ apiKey: [] }],
    },
  ],
  [
    'Cw20TokenController-getCw20Balances',
    {
      name: 'Cw20TokenController-getCw20Balances',
      description: `
The endpoint to get CW20 token balances. 

|||
|---|---|
|Eligible For|**Free Trial and Paid users**|    
|Cost|**50 Credit Units**|    
`,
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            maximum: 50,
            type: 'number',
            description: 'Limit of items to be returned, capped at 50',
          },
          offset: { maximum: 500000, type: 'number', description: 'Offset' },
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID',
          },
          address: { type: 'string', description: 'Wallet address' },
          token_contract_list: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of token contract addresses',
          },
        },
        required: ['chain_id', 'address'],
      },
      method: 'get',
      pathTemplate: '/api/v2/token/cw20/balances',
      executionParameters: [
        { name: 'limit', in: 'query' },
        { name: 'offset', in: 'query' },
        { name: 'chain_id', in: 'query' },
        { name: 'address', in: 'query' },
        { name: 'token_contract_list', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ apiKey: [] }],
    },
  ],
  [
    'Cw20TokenController-getCw20TokenTransfers',
    {
      name: 'Cw20TokenController-getCw20TokenTransfers',
      description: `
The endpoint to get CW20 token transfers. Sorted by time in descending order.

|||
|---|---|
|Eligible For|**Free Trial and Paid users**|    
|Cost|**100 Credit Units**|    
`,
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            maximum: 50,
            type: 'number',
            description: 'Limit of items to be returned, capped at 50',
          },
          offset: { maximum: 500000, type: 'number', description: 'Offset' },
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID',
          },
          contract_address: { type: 'string', description: 'Contract address' },
          wallet_address: { type: 'string', description: 'Wallet address' },
          from_date: { type: 'string', description: 'From date' },
          to_date: { type: 'string', description: 'To date' },
        },
        required: ['chain_id', 'contract_address'],
      },
      method: 'get',
      pathTemplate: '/api/v2/token/cw20/transfers',
      executionParameters: [
        { name: 'limit', in: 'query' },
        { name: 'offset', in: 'query' },
        { name: 'chain_id', in: 'query' },
        { name: 'contract_address', in: 'query' },
        { name: 'wallet_address', in: 'query' },
        { name: 'from_date', in: 'query' },
        { name: 'to_date', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ apiKey: [] }],
    },
  ],
  [
    'Cw20TokenController-getCw20TokenHolders',
    {
      name: 'Cw20TokenController-getCw20TokenHolders',
      description: `
The endpoint to get CW20 token holders. Sorted by amount in descending order.

|||
|---|---|
|Eligible For|**Paid users**|    
|Cost|**100 Credit Units**|    
`,
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            maximum: 50,
            type: 'number',
            description: 'Limit of items to be returned, capped at 50',
          },
          offset: { maximum: 500000, type: 'number', description: 'Offset' },
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID',
          },
          contract_address: { type: 'string', description: 'Contract address' },
        },
        required: ['chain_id', 'contract_address'],
      },
      method: 'get',
      pathTemplate: '/api/v2/token/cw20/holders',
      executionParameters: [
        { name: 'limit', in: 'query' },
        { name: 'offset', in: 'query' },
        { name: 'chain_id', in: 'query' },
        { name: 'contract_address', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ apiKey: [] }],
    },
  ],
  [
    'Cw721TokenController-getCw721TokenInfo',
    {
      name: 'Cw721TokenController-getCw721TokenInfo',
      description: `
The endpoint to get Cw721 token info. 

|||
|---|---|
|Eligible For|**Free Trial and Paid users**|    
|Cost|**50 Credit Units**|    
`,
      inputSchema: {
        type: 'object',
        properties: {
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID',
          },
          contract_address: { type: 'string', description: 'Contract address' },
        },
        required: ['chain_id', 'contract_address'],
      },
      method: 'get',
      pathTemplate: '/api/v2/token/cw721',
      executionParameters: [
        { name: 'chain_id', in: 'query' },
        { name: 'contract_address', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ apiKey: [] }],
    },
  ],
  [
    'Cw721TokenController-getCw721Instance',
    {
      name: 'Cw721TokenController-getCw721Instance',
      description: `
The endpoint to get Cw721 token instances.

|||
|---|---|
|Eligible For|**Free Trial and Paid users**|
|Cost|**50 Credit Units**|
  `,
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            maximum: 50,
            type: 'number',
            description: 'Limit of items to be returned, capped at 50',
          },
          offset: { maximum: 500000, type: 'number', description: 'Offset' },
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID',
          },
          contract_address: { type: 'string', description: 'Contract address' },
          token_id: { type: 'string', description: 'Token id' },
        },
        required: ['chain_id', 'contract_address'],
      },
      method: 'get',
      pathTemplate: '/api/v2/token/cw721/instances',
      executionParameters: [
        { name: 'limit', in: 'query' },
        { name: 'offset', in: 'query' },
        { name: 'chain_id', in: 'query' },
        { name: 'contract_address', in: 'query' },
        { name: 'token_id', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ apiKey: [] }],
    },
  ],
  [
    'Cw721TokenController-getCw721TokenBalances',
    {
      name: 'Cw721TokenController-getCw721TokenBalances',
      description: `
The endpoint to get Cw721 token balances.

|||
|---|---|
|Eligible For|**Free Trial and Paid users**|
|Cost|**50 Credit Units**|
  `,
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            maximum: 50,
            type: 'number',
            description: 'Limit of items to be returned, capped at 50',
          },
          offset: { maximum: 500000, type: 'number', description: 'Offset' },
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID',
          },
          address: { type: 'string', description: 'Wallet address' },
          token_contract_list: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of token contract addresses',
          },
        },
        required: ['chain_id', 'address'],
      },
      method: 'get',
      pathTemplate: '/api/v2/token/cw721/balances',
      executionParameters: [
        { name: 'limit', in: 'query' },
        { name: 'offset', in: 'query' },
        { name: 'chain_id', in: 'query' },
        { name: 'address', in: 'query' },
        { name: 'token_contract_list', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ apiKey: [] }],
    },
  ],
  [
    'Cw721TokenController-getCw721TokenTransfers',
    {
      name: 'Cw721TokenController-getCw721TokenTransfers',
      description: `
The endpoint to get Cw721 token transfers. Sorted by descending order of timestamp.

|||
|---|---|
|Eligible For|**Free Trial and Paid users**|
|Cost|**50 Credit Units**|
`,
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            maximum: 50,
            type: 'number',
            description: 'Limit of items to be returned, capped at 50',
          },
          offset: { maximum: 500000, type: 'number', description: 'Offset' },
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID',
          },
          contract_address: { type: 'string', description: 'Contract address' },
          wallet_address: { type: 'string', description: 'Wallet address' },
          from_date: { type: 'string', description: 'From date' },
          to_date: { type: 'string', description: 'To date' },
          token_id: { type: 'string', description: 'Token ID' },
        },
        required: ['chain_id', 'contract_address'],
      },
      method: 'get',
      pathTemplate: '/api/v2/token/cw721/transfers',
      executionParameters: [
        { name: 'limit', in: 'query' },
        { name: 'offset', in: 'query' },
        { name: 'chain_id', in: 'query' },
        { name: 'contract_address', in: 'query' },
        { name: 'wallet_address', in: 'query' },
        { name: 'from_date', in: 'query' },
        { name: 'to_date', in: 'query' },
        { name: 'token_id', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ apiKey: [] }],
    },
  ],
  [
    'Cw721TokenController-getCw721TokenHolders',
    {
      name: 'Cw721TokenController-getCw721TokenHolders',
      description: `
The endpoint to get Cw721 token holders. Sorted by descending order of holding.

|||
|---|---|
|Eligible For|**Free Trial and Paid users**|
|Cost|**50 Credit Units**|
  `,
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            maximum: 50,
            type: 'number',
            description: 'Limit of items to be returned, capped at 50',
          },
          offset: { maximum: 500000, type: 'number', description: 'Offset' },
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID',
          },
          contract_address: { type: 'string', description: 'Contract address' },
          wallet_address: { type: 'string', description: 'Wallet address' },
        },
        required: ['chain_id', 'contract_address'],
      },
      method: 'get',
      pathTemplate: '/api/v2/token/cw721/holders',
      executionParameters: [
        { name: 'limit', in: 'query' },
        { name: 'offset', in: 'query' },
        { name: 'chain_id', in: 'query' },
        { name: 'contract_address', in: 'query' },
        { name: 'wallet_address', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ apiKey: [] }],
    },
  ],
  [
    'ICS20TokenController-getICS20TokenInfoStatistic',
    {
      name: 'ICS20TokenController-getICS20TokenInfoStatistic',
      description: `
The endpoint to get IBC token info. 

|||
|---|---|
|Eligible For|**Free Trial and Paid users**|    
|Cost|**50 Credit Units**|    
`,
      inputSchema: {
        type: 'object',
        properties: {
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID',
          },
          token_denom: { type: 'string', description: 'IBC token denom' },
        },
        required: ['chain_id', 'token_denom'],
      },
      method: 'get',
      pathTemplate: '/api/v2/token/ibc',
      executionParameters: [
        { name: 'chain_id', in: 'query' },
        { name: 'token_denom', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ apiKey: [] }],
    },
  ],
  [
    'ICS20TokenController-getICS20Balances',
    {
      name: 'ICS20TokenController-getICS20Balances',
      description: `
The endpoint to get IBC token balances. 

|||
|---|---|
|Eligible For|**Free Trial and Paid users**|    
|Cost|**50 Credit Units**|    
`,
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            maximum: 50,
            type: 'number',
            description: 'Limit of items to be returned, capped at 50',
          },
          offset: { maximum: 500000, type: 'number', description: 'Offset' },
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID',
          },
          address: { type: 'string', description: 'Wallet address' },
          token_denom_list: {
            type: 'array',
            items: { type: 'string' },
            description: "List of IBC tokens's denoms",
          },
        },
        required: ['chain_id', 'address'],
      },
      method: 'get',
      pathTemplate: '/api/v2/token/ibc/balances',
      executionParameters: [
        { name: 'limit', in: 'query' },
        { name: 'offset', in: 'query' },
        { name: 'chain_id', in: 'query' },
        { name: 'address', in: 'query' },
        { name: 'token_denom_list', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ apiKey: [] }],
    },
  ],
  [
    'ICS20TokenController-getICS20TokenTransfers',
    {
      name: 'ICS20TokenController-getICS20TokenTransfers',
      description: `
The endpoint to get IBC token transfers. Sorted by time in descending order.

|||
|---|---|
|Eligible For|**Free Trial and Paid users**|    
|Cost|**100 Credit Units**|    
`,
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            maximum: 50,
            type: 'number',
            description: 'Limit of items to be returned, capped at 50',
          },
          offset: { maximum: 500000, type: 'number', description: 'Offset' },
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID',
          },
          token_denom: { type: 'string', description: 'IBC token denom' },
          wallet_address: { type: 'string', description: 'Wallet address' },
          from_date: { type: 'string', description: 'From date' },
          to_date: { type: 'string', description: 'To date' },
        },
        required: ['chain_id', 'token_denom'],
      },
      method: 'get',
      pathTemplate: '/api/v2/token/ibc/transfers',
      executionParameters: [
        { name: 'limit', in: 'query' },
        { name: 'offset', in: 'query' },
        { name: 'chain_id', in: 'query' },
        { name: 'token_denom', in: 'query' },
        { name: 'wallet_address', in: 'query' },
        { name: 'from_date', in: 'query' },
        { name: 'to_date', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ apiKey: [] }],
    },
  ],
  [
    'ICS20TokenController-getICS20TokenHolders',
    {
      name: 'ICS20TokenController-getICS20TokenHolders',
      description: `
The endpoint to get IBC token holders. Sorted by amount in descending order.

|||
|---|---|
|Eligible For|**Paid users**|    
|Cost|**100 Credit Units**|    
`,
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            maximum: 50,
            type: 'number',
            description: 'Limit of items to be returned, capped at 50',
          },
          offset: { maximum: 500000, type: 'number', description: 'Offset' },
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID',
          },
          token_denom: { type: 'string', description: 'IBC token denom' },
        },
        required: ['chain_id', 'token_denom'],
      },
      method: 'get',
      pathTemplate: '/api/v2/token/ibc/holders',
      executionParameters: [
        { name: 'limit', in: 'query' },
        { name: 'offset', in: 'query' },
        { name: 'chain_id', in: 'query' },
        { name: 'token_denom', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ apiKey: [] }],
    },
  ],
  [
    'NativeTokenController-getNativeTokenInfoAndStatistic',
    {
      name: 'NativeTokenController-getNativeTokenInfoAndStatistic',
      description: `
  The endpoint to get Native token info. 
  
  |||
  |---|---|
  |Eligible For|**Free Trial and Paid users**|    
  |Cost|**50 Credit Units**|    
  `,
      inputSchema: {
        type: 'object',
        properties: {
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID',
          },
          token_denom: { type: 'string', description: 'Native token denom (including "usei")' },
        },
        required: ['chain_id', 'token_denom'],
      },
      method: 'get',
      pathTemplate: '/api/v2/token/native',
      executionParameters: [
        { name: 'chain_id', in: 'query' },
        { name: 'token_denom', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ apiKey: [] }],
    },
  ],
  [
    'NativeTokenController-getNativeBalances',
    {
      name: 'NativeTokenController-getNativeBalances',
      description: `
  The endpoint to get Native token balances. 
  
  |||
  |---|---|
  |Eligible For|**Free Trial and Paid users**|    
  |Cost|**50 Credit Units**|    
  `,
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            maximum: 50,
            type: 'number',
            description: 'Limit of items to be returned, capped at 50',
          },
          offset: { maximum: 500000, type: 'number', description: 'Offset' },
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID',
          },
          address: { type: 'string', description: 'Wallet address' },
          token_denom_list: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of tokens\'s denoms (including "usei")',
          },
        },
        required: ['chain_id', 'address'],
      },
      method: 'get',
      pathTemplate: '/api/v2/token/native/balances',
      executionParameters: [
        { name: 'limit', in: 'query' },
        { name: 'offset', in: 'query' },
        { name: 'chain_id', in: 'query' },
        { name: 'address', in: 'query' },
        { name: 'token_denom_list', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ apiKey: [] }],
    },
  ],
  [
    'NativeTokenController-getNativeTokenTransfers',
    {
      name: 'NativeTokenController-getNativeTokenTransfers',
      description: `
  The endpoint to get Native token transfers. Sorted by time in descending order.
  
  |||
  |---|---|
  |Eligible For|**Free Trial and Paid users**|    
  |Cost|**100 Credit Units**|    
  `,
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            maximum: 50,
            type: 'number',
            description: 'Limit of items to be returned, capped at 50',
          },
          offset: { maximum: 500000, type: 'number', description: 'Offset' },
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID',
          },
          token_denom: { type: 'string', description: 'Native token denom (including "usei")' },
          wallet_address: { type: 'string', description: 'Wallet address' },
          from_date: { type: 'string', description: 'From date' },
          to_date: { type: 'string', description: 'To date' },
        },
        required: ['chain_id', 'token_denom'],
      },
      method: 'get',
      pathTemplate: '/api/v2/token/native/transfers',
      executionParameters: [
        { name: 'limit', in: 'query' },
        { name: 'offset', in: 'query' },
        { name: 'chain_id', in: 'query' },
        { name: 'token_denom', in: 'query' },
        { name: 'wallet_address', in: 'query' },
        { name: 'from_date', in: 'query' },
        { name: 'to_date', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ apiKey: [] }],
    },
  ],
  [
    'NativeTokenController-getNativeTokenHolders',
    {
      name: 'NativeTokenController-getNativeTokenHolders',
      description: `
  The endpoint to get Native token holders. Sorted by amount in descending order.
  
  |||
  |---|---|
  |Eligible For|**Paid users**|    
  |Cost|**100 Credit Units**|    
  `,
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            maximum: 50,
            type: 'number',
            description: 'Limit of items to be returned, capped at 50',
          },
          offset: { maximum: 500000, type: 'number', description: 'Offset' },
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID',
          },
          token_denom: { type: 'string', description: 'Native token denom (including "usei")' },
        },
        required: ['chain_id', 'token_denom'],
      },
      method: 'get',
      pathTemplate: '/api/v2/token/native/holders',
      executionParameters: [
        { name: 'limit', in: 'query' },
        { name: 'offset', in: 'query' },
        { name: 'chain_id', in: 'query' },
        { name: 'token_denom', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ apiKey: [] }],
    },
  ],
  [
    'SmartContractController-getSmartContractDetail',
    {
      name: 'SmartContractController-getSmartContractDetail',
      description: `
The endpoint to get smart contract details. 

|||
|---|---|
|Eligible For|**Free Trial and Paid users**|    
|Cost|**100 Credit Units**|    
`,
      inputSchema: {
        type: 'object',
        properties: {
          chain_id: {
            enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
            type: 'string',
            description: 'Chain ID',
          },
          address: { type: 'string', description: 'Wallet address (EVM or Sei address)' },
        },
        required: ['chain_id', 'address'],
      },
      method: 'get',
      pathTemplate: '/api/v2/smart-contract',
      executionParameters: [
        { name: 'chain_id', in: 'query' },
        { name: 'address', in: 'query' },
      ],
      requestBodyContentType: undefined,
      securityRequirements: [{ apiKey: [] }],
    },
  ],
]);
