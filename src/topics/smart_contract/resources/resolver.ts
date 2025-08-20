// Resolver for shaping smart contract responses from the Seitrace API

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { McpResponse } from '../../../utils/index.js';

/**
 * Resolver for extracting only the ABI field from smart contract responses
 * @param result The raw API response
 * @returns CallToolResult containing only the ABI field
 */
export function smartContractResolver(result: CallToolResult): CallToolResult {
  const text: string = result.content[0].text as string;

  if (text.includes('error')) {
    return McpResponse(JSON.stringify({ error: text }));
  }

  try {
    const parsed = JSON.parse(text);

    // Extract only the ABI field from the response
    const abi = parsed?.abi;

    if (abi === undefined) {
      return McpResponse(
        JSON.stringify({
          error: 'ABI field not found in smart contract response',
          available_fields: Object.keys(parsed || {}),
        })
      );
    }

    // Return only the ABI field
    return McpResponse(JSON.stringify({ abi }));
  } catch (error) {
    return McpResponse(
      JSON.stringify({
        error: 'Failed to parse smart contract response',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    );
  }
}

/**
 * Resolver for extracting only name, hash, and language from search contracts response
 * @param result The raw API response
 * @returns CallToolResult containing only simplified contract info
 */
export function searchContractsResolver(result: CallToolResult): CallToolResult {
  const text: string = result.content[0].text as string;

  if (text.includes('error')) {
    return McpResponse(JSON.stringify({ error: text }));
  }

  try {
    const parsed = JSON.parse(text);

    // Handle both array responses and paginated responses
    const _contracts = Array.isArray(parsed) ? parsed : parsed?.items || [];
    const contracts = _contracts.slice(0, 5);

    if (!Array.isArray(contracts)) {
      return McpResponse(
        JSON.stringify({
          error: 'Expected array of contracts in search response',
          available_fields: Object.keys(parsed || {}),
        })
      );
    }

    // Extract only the required fields: address.name, address.hash, and language
    const simplified = contracts
      .map((contract: any) => {
        const result: any = {};

        // Extract address.name and address.hash
        if (contract?.address?.name) {
          result.name = contract.address.name;
        }
        if (contract?.address?.hash) {
          result.hash = contract.address.hash;
        }

        // Extract language
        if (contract?.language) {
          result.language = contract.language;
        }

        return result;
      })
      .filter(
        (contract) =>
          // Only include contracts that have at least name or hash
          contract.name || contract.hash
      );

    return McpResponse(JSON.stringify({ contracts: simplified }));
  } catch (error) {
    return McpResponse(
      JSON.stringify({
        error: 'Failed to parse search contracts response',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    );
  }
}
