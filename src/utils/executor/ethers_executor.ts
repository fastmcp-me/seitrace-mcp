import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ethers } from 'ethers';
import { ZodError } from 'zod';

import { McpToolDefinition, JsonObject } from '../../types.js';
import { McpResponse } from '../mcp_response.js';
import { getZodSchemaFromJsonSchema } from '../schema.js';

// Chain ID to RPC URL mapping for Seitrace networks
const CHAIN_RPC_MAP: Record<string, string> = {
  'pacific-1': 'https://evm-rpc.sei-apis.com',
  'atlantic-2': 'https://evm-rpc-testnet.sei-apis.com', 
  'arctic-1': 'https://evm-rpc-arctic-1.sei-apis.com',
};

// Multicall3 contract address (same across all EVM chains)
const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11';

// Multicall3 ABI (using aggregate3 for better error handling)
const MULTICALL3_ABI = [
  {
    "inputs": [
      {
        "components": [
          {"internalType": "address", "name": "target", "type": "address"},
          {"internalType": "bool", "name": "allowFailure", "type": "bool"},
          {"internalType": "bytes", "name": "callData", "type": "bytes"}
        ],
        "internalType": "struct Multicall3.Call3[]",
        "name": "calls",
        "type": "tuple[]"
      }
    ],
    "name": "aggregate3",
    "outputs": [
      {
        "components": [
          {"internalType": "bool", "name": "success", "type": "bool"},
          {"internalType": "bytes", "name": "returnData", "type": "bytes"}
        ],
        "internalType": "struct Multicall3.Result[]",
        "name": "returnData",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  }
];

/**
 * Recursively converts BigInt values to strings for JSON serialization
 * @param obj The object to convert
 * @returns The object with BigInt values converted to strings
 */
function convertBigIntToString(obj: any): any {
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString);
  }
  if (obj && typeof obj === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToString(value);
    }
    return converted;
  }
  return obj;
}

/**
 * Executes an ethers tool for contract state queries via Multicall3
 * @param toolName The name of the tool to execute
 * @param definition The tool definition
 * @param toolArgs The arguments to pass to the tool
 * @returns The result of the tool execution
 */
export const executeEthersTool = async (
  toolName: string,
  definition: McpToolDefinition,
  toolArgs: JsonObject
): Promise<CallToolResult> => {
  try {
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
        return McpResponse(validationErrorMessage);
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return McpResponse(
          `Internal error during validation setup: ${errorMessage}. Try contact dev@cavies.xyz`
        );
      }
    }

    const { abi, contract_address, payload, chain_id } = validatedArgs as {
      abi: any[];
      contract_address: string;
      payload: Array<{ methodName: string; arguments?: any[] }>;
      chain_id: string;
    };

    // Get RPC URL for the chain
    const rpcUrl = CHAIN_RPC_MAP[chain_id];
    if (!rpcUrl) {
      return McpResponse(`Unsupported chain_id: ${chain_id}. Supported chains: ${Object.keys(CHAIN_RPC_MAP).join(', ')}`);
    }

    // Create provider
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Create contract interface from ABI
    const contractInterface = new ethers.Interface(abi);

    // Encode all function calls for aggregate3
    const calls: Array<{ target: string; allowFailure: boolean; callData: string }> = [];
    const callDetails: Array<{ methodName: string; arguments: any[] }> = [];

    for (const call of payload) {
      const functionArgs = call.arguments || [];
      let encodedCall: string;
      try {
        encodedCall = contractInterface.encodeFunctionData(call.methodName, functionArgs);
        calls.push({
          target: contract_address,
          allowFailure: true, // Allow individual calls to fail without breaking the batch
          callData: encodedCall
        });
        callDetails.push({
          methodName: call.methodName,
          arguments: functionArgs
        });
      } catch (error) {
        return McpResponse(`Failed to encode function call for ${call.methodName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Create multicall contract instance
    const multicall = new ethers.Contract(MULTICALL3_ADDRESS, MULTICALL3_ABI, provider);

    try {
      // Execute the multicall using aggregate3
      const returnData = await multicall.aggregate3.staticCall(calls);

      // Get current block number separately since aggregate3 doesn't return it
      const blockNumber = await provider.getBlockNumber();

      // Decode all return data - aggregate3 returns array of {success: bool, returnData: bytes}
      const results = returnData.map((result: { success: boolean; returnData: string }, index: number) => {
        const callDetail = callDetails[index];
        
        if (!result.success) {
          return {
            success: false,
            method: callDetail.methodName,
            arguments: callDetail.arguments,
            error: 'Call reverted'
          };
        }

        try {
          const decodedResult = contractInterface.decodeFunctionResult(callDetail.methodName, result.returnData);
          return {
            success: true,
            method: callDetail.methodName,
            arguments: callDetail.arguments,
            result: convertBigIntToString(decodedResult.length === 1 ? decodedResult[0] : decodedResult)
          };
        } catch (error) {
          return {
            success: false,
            method: callDetail.methodName,
            arguments: callDetail.arguments,
            error: error instanceof Error ? error.message : 'Unknown decode error'
          };
        }
      });

      // Format the response
      const response = {
        success: true,
        blockNumber: blockNumber.toString(),
        chain_id,
        contract_address,
        calls: results
      };

      return McpResponse(JSON.stringify(response, null, 2));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return McpResponse(
        JSON.stringify({
          success: false,
          error: 'Multicall execution failed',
          details: errorMessage,
          chain_id,
          contract_address,
          calls: callDetails.map(detail => ({
            method: detail.methodName,
            arguments: detail.arguments
          }))
        }, null, 2)
      );
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return McpResponse(
      JSON.stringify({
        success: false,
        error: 'Ethers executor failed',
        details: errorMessage
      }, null, 2)
    );
  }
};
