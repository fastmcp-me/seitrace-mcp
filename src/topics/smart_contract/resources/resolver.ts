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
  
  try {
    const parsed = JSON.parse(text);
    
    // Extract only the ABI field from the response
    const abi = parsed?.abi;
    
    if (abi === undefined) {
      return McpResponse(JSON.stringify({ 
        error: 'ABI field not found in smart contract response',
        available_fields: Object.keys(parsed || {})
      }));
    }
    
    // Return only the ABI field
    return McpResponse(JSON.stringify({ abi }));
  } catch (error) {
    return McpResponse(JSON.stringify({ 
      error: 'Failed to parse smart contract response',
      details: error instanceof Error ? error.message : 'Unknown error'
    }));
  }
}
