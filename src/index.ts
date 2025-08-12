#!/usr/bin/env node
/**
 * MCP Server generated from OpenAPI spec for seitrace-insights v1.0
 * Generated on: 2025-08-12T03:27:07.471Z
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
  type CallToolResult,
  type CallToolRequest,
} from '@modelcontextprotocol/sdk/types.js';

import { z, ZodError } from 'zod';
import { jsonSchemaToZod } from 'json-schema-to-zod';
import axios, { type AxiosRequestConfig, type AxiosError } from 'axios';

/**
 * Type definition for JSON objects
 */
type JsonObject = Record<string, any>;

/**
 * Interface for MCP Tool Definition
 */
interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: any;
  method: string;
  pathTemplate: string;
  executionParameters: { name: string; in: string }[];
  requestBodyContentType?: string;
  securityRequirements: any[];
}

/**
 * Server configuration
 */
export const SERVER_NAME = 'seitrace-insights';
export const SERVER_VERSION = '1.0';
export const API_BASE_URL = 'https://seitrace.com/insights';

/**
 * MCP Server instance
 */
const server = new Server(
  { name: SERVER_NAME, version: SERVER_VERSION },
  { capabilities: { tools: {} } }
);

/**
 * Flat map of endpoint tool definitions by name (as originally generated)
 * Example key: "Erc20TokenController-getErc20Balances"
 */
const endpointDefinitionMap: Map<string, McpToolDefinition> = new Map([
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

/**
 * Grouped tool definition (controller-level tool with multiple actions)
 */
interface McpGroupedToolDefinition {
  name: string;
  description: string;
  inputSchema: any; // JSON Schema discriminated by `method` and, for invoke_action, by `action`
  actions: Record<string, McpToolDefinition>; // action_name -> endpoint def
}

/**
 * Utility: convert CamelCase or mixedCase to snake_case
 */
function camelToSnake(input: string): string {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .replace(/\s+/g, '_')
    .toLowerCase();
}

/**
 * Utility: from Controller class name to tool name (strip Controller + Token, snake_case, lowercase)
 */
function controllerNameToToolName(controllerName: string): string {
  const stripped = controllerName.replace(/Controller$/, '').replace(/Token/g, '');
  return camelToSnake(stripped);
}

/**
 * Build a grouped tool JSON Schema with 3-layer method flow:
 * - list_actions
 * - list_action_schema (requires action)
 * - invoke_action (requires action + action's schema)
 * Preserves anyOf/oneOf/allOf inside each action's original schema by composing with allOf.
 */
function buildGroupedInputSchema(_actions: Record<string, McpToolDefinition>): any {
  // Keep tools/list lightweight: do not enumerate actions or embed per-action schemas.
  const listActionsSchema = {
    type: 'object',
    properties: {
      method: {
        type: 'string',
        const: 'list_actions',
        description: 'List available actions with descriptions',
      },
    },
    required: ['method'],
    additionalProperties: false,
  };

  const listActionSchemaSchema = {
    type: 'object',
    properties: {
      method: {
        type: 'string',
        const: 'list_action_schema',
        description: 'Get JSON Schema for a specific action',
      },
      action: { type: 'string', description: 'Action identifier' },
      payload: {
        type: 'object',
        description: 'Optional payload (not required for listing schema)',
        additionalProperties: true,
      },
    },
    required: ['method', 'action'],
    additionalProperties: false,
  };

  const invokeGenericSchema = {
    type: 'object',
    properties: {
      method: {
        type: 'string',
        const: 'invoke_action',
        description: 'Invoke a specific action with its required arguments',
      },
      action: { type: 'string', description: 'Action identifier' },
      payload: {
        type: 'object',
        description: 'Action-specific input payload',
        additionalProperties: true,
      },
    },
    required: ['method', 'action', 'payload'],
    additionalProperties: false,
  };

  return {
    type: 'object',
    oneOf: [listActionsSchema, listActionSchemaSchema, invokeGenericSchema],
  };
}

/**
 * Build a concise, LLM-friendly description enumerating available actions.
 */
function buildGroupedDescription(
  controllerDisplay: string,
  _actions: Record<string, McpToolDefinition>
): string {
  return [
    `Controller: ${controllerDisplay}`,
    `Methods: list_actions, list_action_schema, invoke_action`,
    `Workflow: list_actions -> list_action_schema(action) -> invoke_action(action, ...)`,
    `Use list_actions to enumerate available actions.`,
  ].join('\n');
}

/**
 * Construct grouped tools from flat endpoint definitions
 */
const groupedToolDefinitionMap: Map<string, McpGroupedToolDefinition> = (() => {
  const map = new Map<string, McpGroupedToolDefinition>();

  for (const [fullName, def] of endpointDefinitionMap.entries()) {
    // fullName format: <ControllerName>-<ActionNameCamel>
    const [controllerPart, actionCamel = ''] = fullName.split('-');
    const toolName = controllerNameToToolName(controllerPart);
    const actionName = camelToSnake(actionCamel);

    // Initialize grouped entry if needed
    if (!map.has(toolName)) {
      map.set(toolName, {
        name: toolName,
        description: '', // filled later
        inputSchema: {}, // filled later
        actions: {},
      });
    }
    const grouped = map.get(toolName)!;
    grouped.actions[actionName] = def;
  }

  // Finalize description and schema per grouped tool
  for (const grouped of map.values()) {
    grouped.inputSchema = buildGroupedInputSchema(grouped.actions);
    // Pretty display name derived from tool name
    const display = grouped.name;
    grouped.description = buildGroupedDescription(display, grouped.actions);
  }

  return map;
})();

/**
 * Security schemes from the OpenAPI spec
 */
const securitySchemes = {
  apiKey: {
    type: 'apiKey',
    in: 'header',
    name: 'x-api-key',
  },
};

server.setRequestHandler(ListToolsRequestSchema, async () => {
  // Advertise grouped controller tools to clients (LLM-friendly)
  const toolsForClient: Tool[] = Array.from(groupedToolDefinitionMap.values()).map((def) => ({
    name: def.name,
    description: def.description,
    inputSchema: def.inputSchema,
  }));
  return { tools: toolsForClient };
});

server.setRequestHandler(
  CallToolRequestSchema,
  async (request: CallToolRequest): Promise<CallToolResult> => {
    const { name: toolName, arguments: toolArgs } = request.params;

    // First try grouped tools (preferred)
    const grouped = groupedToolDefinitionMap.get(toolName);
    if (grouped) {
      // 3-layer method flow
      const argObj =
        typeof toolArgs === 'object' && toolArgs !== null ? (toolArgs as Record<string, any>) : {};
      const method = argObj.method || (argObj.action ? 'invoke_action' : undefined);

      if (method === 'list_actions') {
        const actions = Object.entries(grouped.actions)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([name, def]) => ({ name, description: (def.description || '').trim() }));
        return {
          content: [{ type: 'text', text: JSON.stringify({ tool: toolName, actions }, null, 2) }],
        };
      }

      if (method === 'list_action_schema') {
        const action = argObj.action;
        if (typeof action !== 'string' || !grouped.actions[action]) {
          const available = Object.keys(grouped.actions).sort();
          return {
            content: [
              {
                type: 'text',
                text: `Unknown action '${action}' for tool '${toolName}'. Available actions: ${available.join(
                  ', '
                )}`,
              },
            ],
          };
        }
        const schema = grouped.actions[action].inputSchema;
        return {
          content: [
            { type: 'text', text: JSON.stringify({ tool: toolName, action, schema }, null, 2) },
          ],
        };
      }

      if (method === 'invoke_action') {
        const action = argObj.action;
        if (typeof action !== 'string' || !grouped.actions[action]) {
          const available = Object.keys(grouped.actions).sort();
          return {
            content: [
              {
                type: 'text',
                text: `Unknown action '${action}' for tool '${toolName}'. Available actions: ${available.join(
                  ', '
                )}`,
              },
            ],
          };
        }
        // Expect payload object carrying the action arguments
        const payload = argObj.payload;
        if (
          payload === undefined ||
          payload === null ||
          typeof payload !== 'object' ||
          Array.isArray(payload)
        ) {
          return {
            content: [
              {
                type: 'text',
                text: `Invalid or missing 'payload' for method 'invoke_action'. Provide an object matching the action schema.`,
              },
            ],
          };
        }
        const endpointDef = grouped.actions[action];
        return await executeApiTool(
          `${toolName}.${action}`,
          endpointDef,
          payload as Record<string, any>,
          securitySchemes
        );
      }

      // Unknown method
      return {
        content: [
          {
            type: 'text',
            text: `Unknown method '${method}'. Use one of: list_actions, list_action_schema, invoke_action`,
          },
        ],
      };
    }

    // Fallback: allow legacy flat tool names for compatibility
    const legacyToolDef = endpointDefinitionMap.get(toolName);
    if (legacyToolDef) {
      console.warn(
        `Calling legacy flat tool '${toolName}'. Consider using grouped controller tools.`
      );
      return await executeApiTool(toolName, legacyToolDef, toolArgs ?? {}, securitySchemes);
    }

    console.error(`Error: Unknown tool requested: ${toolName}`);
    return { content: [{ type: 'text', text: `Error: Unknown tool requested: ${toolName}` }] };
  }
);

/**
 * Type definition for cached OAuth tokens
 */
interface TokenCacheEntry {
  token: string;
  expiresAt: number;
}

/**
 * Declare global __oauthTokenCache property for TypeScript
 */
declare global {
  var __oauthTokenCache: Record<string, TokenCacheEntry> | undefined;
}

/**
 * Acquires an OAuth2 token using client credentials flow
 *
 * @param schemeName Name of the security scheme
 * @param scheme OAuth2 security scheme
 * @returns Acquired token or null if unable to acquire
 */
async function acquireOAuth2Token(
  schemeName: string,
  scheme: any
): Promise<string | null | undefined> {
  try {
    // Check if we have the necessary credentials
    const clientId = process.env[`OAUTH_CLIENT_ID_SCHEMENAME`];
    const clientSecret = process.env[`OAUTH_CLIENT_SECRET_SCHEMENAME`];
    const scopes = process.env[`OAUTH_SCOPES_SCHEMENAME`];

    if (!clientId || !clientSecret) {
      console.error(`Missing client credentials for OAuth2 scheme '${schemeName}'`);
      return null;
    }

    // Initialize token cache if needed
    if (typeof global.__oauthTokenCache === 'undefined') {
      global.__oauthTokenCache = {};
    }

    // Check if we have a cached token
    const cacheKey = `${schemeName}_${clientId}`;
    const cachedToken = global.__oauthTokenCache[cacheKey];
    const now = Date.now();

    if (cachedToken && cachedToken.expiresAt > now) {
      console.error(
        `Using cached OAuth2 token for '${schemeName}' (expires in ${Math.floor(
          (cachedToken.expiresAt - now) / 1000
        )} seconds)`
      );
      return cachedToken.token;
    }

    // Determine token URL based on flow type
    let tokenUrl = '';
    if (scheme.flows?.clientCredentials?.tokenUrl) {
      tokenUrl = scheme.flows.clientCredentials.tokenUrl;
      console.error(`Using client credentials flow for '${schemeName}'`);
    } else if (scheme.flows?.password?.tokenUrl) {
      tokenUrl = scheme.flows.password.tokenUrl;
      console.error(`Using password flow for '${schemeName}'`);
    } else {
      console.error(`No supported OAuth2 flow found for '${schemeName}'`);
      return null;
    }

    // Prepare the token request
    let formData = new URLSearchParams();
    formData.append('grant_type', 'client_credentials');

    // Add scopes if specified
    if (scopes) {
      formData.append('scope', scopes);
    }

    console.error(`Requesting OAuth2 token from ${tokenUrl}`);

    // Make the token request
    const response = await axios({
      method: 'POST',
      url: tokenUrl,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      data: formData.toString(),
    });

    // Process the response
    if (response.data?.access_token) {
      const token = response.data.access_token;
      const expiresIn = response.data.expires_in || 3600; // Default to 1 hour

      // Cache the token
      global.__oauthTokenCache[cacheKey] = {
        token,
        expiresAt: now + expiresIn * 1000 - 60000, // Expire 1 minute early
      };

      console.error(
        `Successfully acquired OAuth2 token for '${schemeName}' (expires in ${expiresIn} seconds)`
      );
      return token;
    } else {
      console.error(
        `Failed to acquire OAuth2 token for '${schemeName}': No access_token in response`
      );
      return null;
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error acquiring OAuth2 token for '${schemeName}':`, errorMessage);
    return null;
  }
}

/**
 * Executes an API tool with the provided arguments
 *
 * @param toolName Name of the tool to execute
 * @param definition Tool definition
 * @param toolArgs Arguments provided by the user
 * @param allSecuritySchemes Security schemes from the OpenAPI spec
 * @returns Call tool result
 */
async function executeApiTool(
  toolName: string,
  definition: McpToolDefinition,
  toolArgs: JsonObject,
  allSecuritySchemes: Record<string, any>
): Promise<CallToolResult> {
  try {
    // Validate arguments against the input schema
    let validatedArgs: JsonObject;
    try {
      const zodSchema = getZodSchemaFromJsonSchema(definition.inputSchema, toolName);
      const argsToParse = typeof toolArgs === 'object' && toolArgs !== null ? toolArgs : {};
      validatedArgs = zodSchema.parse(argsToParse);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const validationErrorMessage = `Invalid arguments for tool '${toolName}': ${error.errors
          .map((e) => `${e.path.join('.')} (${e.code}): ${e.message}`)
          .join(', ')}`;
        return { content: [{ type: 'text', text: validationErrorMessage }] };
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            { type: 'text', text: `Internal error during validation setup: ${errorMessage}` },
          ],
        };
      }
    }

    // Prepare URL, query parameters, headers, and request body
    let urlPath = definition.pathTemplate;
    const queryParams: Record<string, any> = {};
    const headers: Record<string, string> = { Accept: 'application/json' };
    let requestBodyData: any = undefined;

    // Apply parameters to the URL path, query, or headers
    definition.executionParameters.forEach((param) => {
      const value = validatedArgs[param.name];
      if (typeof value !== 'undefined' && value !== null) {
        if (param.in === 'path') {
          urlPath = urlPath.replace(`{${param.name}}`, encodeURIComponent(String(value)));
        } else if (param.in === 'query') {
          queryParams[param.name] = value;
        } else if (param.in === 'header') {
          headers[param.name.toLowerCase()] = String(value);
        }
      }
    });

    // Ensure all path parameters are resolved
    if (urlPath.includes('{')) {
      throw new Error(`Failed to resolve path parameters: ${urlPath}`);
    }

    // Construct the full URL
    const requestUrl = API_BASE_URL ? `${API_BASE_URL}${urlPath}` : urlPath;

    // Handle request body if needed
    if (definition.requestBodyContentType && typeof validatedArgs['requestBody'] !== 'undefined') {
      requestBodyData = validatedArgs['requestBody'];
      headers['content-type'] = definition.requestBodyContentType;
    }

    // Apply security requirements if available
    // Security requirements use OR between array items and AND within each object
    const appliedSecurity = definition.securityRequirements?.find((req) => {
      // Try each security requirement (combined with OR)
      return Object.entries(req).every(([schemeName, scopesArray]) => {
        const scheme = allSecuritySchemes[schemeName];
        if (!scheme) return false;

        // API Key security (header, query, cookie)
        if (scheme.type === 'apiKey') {
          return !!process.env[`API_KEY_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
        }

        // HTTP security (basic, bearer)
        if (scheme.type === 'http') {
          if (scheme.scheme?.toLowerCase() === 'bearer') {
            return !!process.env[
              `BEARER_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`
            ];
          } else if (scheme.scheme?.toLowerCase() === 'basic') {
            return (
              !!process.env[
                `BASIC_USERNAME_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`
              ] &&
              !!process.env[
                `BASIC_PASSWORD_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`
              ]
            );
          }
        }

        // OAuth2 security
        if (scheme.type === 'oauth2') {
          // Check for pre-existing token
          if (
            process.env[`OAUTH_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`]
          ) {
            return true;
          }

          // Check for client credentials for auto-acquisition
          if (
            process.env[
              `OAUTH_CLIENT_ID_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`
            ] &&
            process.env[
              `OAUTH_CLIENT_SECRET_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`
            ]
          ) {
            // Verify we have a supported flow
            if (scheme.flows?.clientCredentials || scheme.flows?.password) {
              return true;
            }
          }

          return false;
        }

        // OpenID Connect
        if (scheme.type === 'openIdConnect') {
          return !!process.env[
            `OPENID_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`
          ];
        }

        return false;
      });
    });

    // If we found matching security scheme(s), apply them
    if (appliedSecurity) {
      // Apply each security scheme from this requirement (combined with AND)
      for (const [schemeName, scopesArray] of Object.entries(appliedSecurity)) {
        const scheme = allSecuritySchemes[schemeName];

        // API Key security
        if (scheme?.type === 'apiKey') {
          const apiKey =
            process.env[`API_KEY_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
          if (apiKey) {
            if (scheme.in === 'header') {
              headers[scheme.name.toLowerCase()] = apiKey;
              console.error(`Applied API key '${schemeName}' in header '${scheme.name}'`);
            } else if (scheme.in === 'query') {
              queryParams[scheme.name] = apiKey;
              console.error(`Applied API key '${schemeName}' in query parameter '${scheme.name}'`);
            } else if (scheme.in === 'cookie') {
              // Add the cookie, preserving other cookies if they exist
              headers['cookie'] = `${scheme.name}=${apiKey}${
                headers['cookie'] ? `; ${headers['cookie']}` : ''
              }`;
              console.error(`Applied API key '${schemeName}' in cookie '${scheme.name}'`);
            }
          }
        }
        // HTTP security (Bearer or Basic)
        else if (scheme?.type === 'http') {
          if (scheme.scheme?.toLowerCase() === 'bearer') {
            const token =
              process.env[`BEARER_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
            if (token) {
              headers['authorization'] = `Bearer ${token}`;
              console.error(`Applied Bearer token for '${schemeName}'`);
            }
          } else if (scheme.scheme?.toLowerCase() === 'basic') {
            const username =
              process.env[
                `BASIC_USERNAME_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`
              ];
            const password =
              process.env[
                `BASIC_PASSWORD_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`
              ];
            if (username && password) {
              headers['authorization'] = `Basic ${Buffer.from(`${username}:${password}`).toString(
                'base64'
              )}`;
              console.error(`Applied Basic authentication for '${schemeName}'`);
            }
          }
        }
        // OAuth2 security
        else if (scheme?.type === 'oauth2') {
          // First try to use a pre-provided token
          let token =
            process.env[`OAUTH_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];

          // If no token but we have client credentials, try to acquire a token
          if (!token && (scheme.flows?.clientCredentials || scheme.flows?.password)) {
            console.error(`Attempting to acquire OAuth token for '${schemeName}'`);
            token = (await acquireOAuth2Token(schemeName, scheme)) ?? '';
          }

          // Apply token if available
          if (token) {
            headers['authorization'] = `Bearer ${token}`;
            console.error(`Applied OAuth2 token for '${schemeName}'`);

            // List the scopes that were requested, if any
            const scopes = scopesArray as string[];
            if (scopes && scopes.length > 0) {
              console.error(`Requested scopes: ${scopes.join(', ')}`);
            }
          }
        }
        // OpenID Connect
        else if (scheme?.type === 'openIdConnect') {
          const token =
            process.env[`OPENID_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
          if (token) {
            headers['authorization'] = `Bearer ${token}`;
            console.error(`Applied OpenID Connect token for '${schemeName}'`);

            // List the scopes that were requested, if any
            const scopes = scopesArray as string[];
            if (scopes && scopes.length > 0) {
              console.error(`Requested scopes: ${scopes.join(', ')}`);
            }
          }
        }
      }
    }
    // Log warning if security is required but not available
    else if (definition.securityRequirements?.length > 0) {
      // First generate a more readable representation of the security requirements
      const securityRequirementsString = definition.securityRequirements
        .map((req) => {
          const parts = Object.entries(req)
            .map(([name, scopesArray]) => {
              const scopes = scopesArray as string[];
              if (scopes.length === 0) return name;
              return `${name} (scopes: ${scopes.join(', ')})`;
            })
            .join(' AND ');
          return `[${parts}]`;
        })
        .join(' OR ');

      console.warn(
        `Tool '${toolName}' requires security: ${securityRequirementsString}, but no suitable credentials found.`
      );
    }

    // Prepare the axios request configuration
    const config: AxiosRequestConfig = {
      method: definition.method.toUpperCase(),
      url: requestUrl,
      params: queryParams,
      headers: headers,
      ...(requestBodyData !== undefined && { data: requestBodyData }),
    };

    // Log request info to stderr (doesn't affect MCP output)
    console.error(`Executing tool "${toolName}": ${config.method} ${config.url}`);

    // Execute the request
    const response = await axios(config);

    // Process and format the response
    let responseText = '';
    const contentType = response.headers['content-type']?.toLowerCase() || '';

    // Handle JSON responses
    if (
      contentType.includes('application/json') &&
      typeof response.data === 'object' &&
      response.data !== null
    ) {
      try {
        responseText = JSON.stringify(response.data, null, 2);
      } catch (e) {
        responseText = '[Stringify Error]';
      }
    }
    // Handle string responses
    else if (typeof response.data === 'string') {
      responseText = response.data;
    }
    // Handle other response types
    else if (response.data !== undefined && response.data !== null) {
      responseText = String(response.data);
    }
    // Handle empty responses
    else {
      responseText = `(Status: ${response.status} - No body content)`;
    }

    // Return formatted response
    return {
      content: [
        {
          type: 'text',
          text: `API Response (Status: ${response.status}):\n${responseText}`,
        },
      ],
    };
  } catch (error: unknown) {
    // Handle errors during execution
    let errorMessage: string;

    // Format Axios errors specially
    if (axios.isAxiosError(error)) {
      errorMessage = formatApiError(error);
    }
    // Handle standard errors
    else if (error instanceof Error) {
      errorMessage = error.message;
    }
    // Handle unexpected error types
    else {
      errorMessage = 'Unexpected error: ' + String(error);
    }

    // Log error to stderr
    console.error(`Error during execution of tool '${toolName}':`, errorMessage);

    // Return error message to client
    return { content: [{ type: 'text', text: errorMessage }] };
  }
}

/**
 * Main function to start the server
 */
async function main() {
  // Set up stdio transport
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(
      `${SERVER_NAME} MCP Server (v${SERVER_VERSION}) running on stdio${
        API_BASE_URL ? `, proxying API at ${API_BASE_URL}` : ''
      }`
    );
  } catch (error) {
    console.error('Error during server startup:', error);
    process.exit(1);
  }
}

/**
 * Cleanup function for graceful shutdown
 */
async function cleanup() {
  console.error('Shutting down MCP server...');
  process.exit(0);
}

// Register signal handlers
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start the server
main().catch((error) => {
  console.error('Fatal error in main execution:', error);
  process.exit(1);
});

/**
 * Formats API errors for better readability
 *
 * @param error Axios error
 * @returns Formatted error message
 */
function formatApiError(error: AxiosError): string {
  let message = 'API request failed.';
  if (error.response) {
    message = `API Error: Status ${error.response.status} (${
      error.response.statusText || 'Status text not available'
    }). `;
    const responseData = error.response.data;
    const MAX_LEN = 200;
    if (typeof responseData === 'string') {
      message += `Response: ${responseData.substring(0, MAX_LEN)}${
        responseData.length > MAX_LEN ? '...' : ''
      }`;
    } else if (responseData) {
      try {
        const jsonString = JSON.stringify(responseData);
        message += `Response: ${jsonString.substring(0, MAX_LEN)}${
          jsonString.length > MAX_LEN ? '...' : ''
        }`;
      } catch {
        message += 'Response: [Could not serialize data]';
      }
    } else {
      message += 'No response body received.';
    }
  } else if (error.request) {
    message = 'API Network Error: No response received from server.';
    if (error.code) message += ` (Code: ${error.code})`;
  } else {
    message += `API Request Setup Error: ${error.message}`;
  }
  return message;
}

/**
 * Converts a JSON Schema to a Zod schema for runtime validation
 *
 * @param jsonSchema JSON Schema
 * @param toolName Tool name for error reporting
 * @returns Zod schema
 */
function getZodSchemaFromJsonSchema(jsonSchema: any, toolName: string): z.ZodTypeAny {
  if (typeof jsonSchema !== 'object' || jsonSchema === null) {
    return z.object({}).passthrough();
  }
  try {
    const zodSchemaString = jsonSchemaToZod(jsonSchema);
    const zodSchema = eval(zodSchemaString);
    if (typeof zodSchema?.parse !== 'function') {
      throw new Error('Eval did not produce a valid Zod schema.');
    }
    return zodSchema as z.ZodTypeAny;
  } catch (err: any) {
    console.error(`Failed to generate/evaluate Zod schema for '${toolName}':`, err);
    return z.object({}).passthrough();
  }
}
