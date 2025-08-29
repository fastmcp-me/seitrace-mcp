import { z } from 'zod';
import { SUPPORTED_GENERAL_SNIPPET_LANGUAGES } from './general.js';

/**
 * Zod schema for ABI items
 */
const AbiItemSchema = z
  .object({
    type: z.string().min(1, 'ABI item type is required'),
    name: z.string().optional(),
    inputs: z.array(z.any()).optional(),
    outputs: z.array(z.any()).optional(),
    stateMutability: z.string().optional(),
    constant: z.boolean().optional(),
    payable: z.boolean().optional(),
    anonymous: z.boolean().optional(),
    indexed: z.boolean().optional(),
  })
  .refine(
    (item) => {
      // Function ABI items must have a name
      if (item.type === 'function' && (!item.name || item.name.trim() === '')) {
        return false;
      }
      return true;
    },
    {
      message: 'Function ABI items must have a valid name',
    }
  );

/**
 * Zod schema for method call payload
 */
const MethodCallSchema = z.object({
  methodName: z.string().min(1, 'Method name is required'),
  arguments: z.array(z.any()).optional().default([]),
});

/**
 * Zod schema for ethers contract interaction payload
 */
const EthersPayloadSchema = z
  .object({
    abi: z.array(AbiItemSchema).min(1, 'ABI must contain at least one item'),
    contract_address: z
      .string()
      .regex(
        /^0[xX][a-fA-F0-9]{40}$/,
        'Contract address must be a valid Ethereum address (0x followed by 40 hex characters)'
      ),
    payload: z
      .array(MethodCallSchema)
      .min(1, 'Payload array must contain at least one method call'),
    chain_id: z.enum(['pacific-1', 'atlantic-2', 'arctic-1'], {
      errorMap: () => ({ message: 'Chain ID must be one of: pacific-1, atlantic-2, arctic-1' }),
    }),
  })
  .refine(
    (data) => {
      // Cross-validate that all method names exist in the ABI
      const functionNames = data.abi
        .filter((item) => item.type === 'function')
        .map((item) => item.name)
        .filter(Boolean) as string[];

      const invalidMethods = data.payload
        .map((call) => call.methodName)
        .filter((methodName) => !functionNames.includes(methodName));

      return invalidMethods.length === 0;
    },
    {
      message: 'All method names in payload must exist as functions in the contract ABI',
      path: ['payload'],
    }
  );

/**
 * Type inference from Zod schema
 */
export type EthersPayload = z.infer<typeof EthersPayloadSchema>;

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  data?: EthersPayload;
}

/**
 * Validates the payload for ethers contract interactions using Zod
 */
export function validateEthersPayload(payload: any): ValidationResult {
  try {
    const validatedData = EthersPayloadSchema.parse(payload);
    return {
      isValid: true,
      errors: [],
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => {
        const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
        return `${path}${err.message}`;
      });
      return {
        isValid: false,
        errors,
      };
    }

    // Fallback for non-Zod errors
    return {
      isValid: false,
      errors: [error instanceof Error ? error.message : 'Unknown validation error'],
    };
  }
}

/**
 * Generates ethers.js code snippets for smart contract interactions
 */
export function generateEthersSnippet(
  definition: any,
  actionName: string,
  language: (typeof SUPPORTED_GENERAL_SNIPPET_LANGUAGES)[number],
  payload?: any
): string {
  // Chain ID to RPC URL mapping
  const chainRpcMap: Record<string, string> = {
    'pacific-1': 'https://evm-rpc.sei-apis.com',
    'atlantic-2': 'https://evm-rpc-testnet.sei-apis.com',
    'arctic-1': 'https://evm-rpc-arctic-1.sei-apis.com',
  };

  const defaultChainId = 'pacific-1';

  // Sample payload for demonstration
  const samplePayload: EthersPayload = {
    abi: [
      {
        constant: true,
        inputs: [],
        name: 'totalSupply',
        outputs: [{ name: '', type: 'uint256' }],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
    ],
    contract_address: '0x<CONTRACT_ADDRESS>',
    payload: [
      {
        methodName: 'totalSupply',
        arguments: [],
      },
    ],
    chain_id: defaultChainId,
  };

  // Use provided payload or fallback to sample
  const finalPayload = payload || samplePayload;

  // Validate payload if provided
  if (payload) {
    const validation = validateEthersPayload(payload);
    if (!validation.isValid) {
      // Return error snippet for invalid payload
      const errorMessage = `Validation errors:\n${validation.errors.map((e) => `- ${e}`).join('\n')}`;

      if (language === 'javascript' || language === 'node') {
        return `// Error: Invalid payload provided
/*
${errorMessage}
*/

// Please provide a valid payload with the following structure:
const validPayload = ${JSON.stringify(samplePayload, null, 2)};`;
      }

      if (language === 'python') {
        return `# Error: Invalid payload provided
"""
${errorMessage}
"""

# Please provide a valid payload with the following structure:
valid_payload = ${JSON.stringify(samplePayload, null, 2).replace(/"/g, "'")}`;
      }

      return `// Error: Invalid payload\n// ${errorMessage}`;
    }
  }

  if (language === 'javascript' || language === 'node') {
    return `// Ethers.js contract state query via Multicall3
import { ethers } from 'ethers';

const CHAIN_RPC_MAP = ${JSON.stringify(chainRpcMap, null, 2)};
const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11';
const MULTICALL3_ABI = [
  {
    "inputs": [{"components": [{"name": "target", "type": "address"}, {"name": "allowFailure", "type": "bool"}, {"name": "callData", "type": "bytes"}], "name": "calls", "type": "tuple[]"}],
    "name": "aggregate3",
    "outputs": [{"components": [{"name": "success", "type": "bool"}, {"name": "returnData", "type": "bytes"}], "name": "returnData", "type": "tuple[]"}],
    "stateMutability": "payable",
    "type": "function"
  }
];

async function queryContractState() {
  const config = ${JSON.stringify(finalPayload, null, 2)};
  
  // Create provider
  const provider = new ethers.JsonRpcProvider(CHAIN_RPC_MAP[config.chain_id]);
  
  // Create contract interface
  const contractInterface = new ethers.Interface(config.abi);
  
  // Encode function calls for aggregate3
  const calls = config.payload.map(call => ({
    target: config.contract_address,
    allowFailure: true,
    callData: contractInterface.encodeFunctionData(call.methodName, call.arguments || [])
  }));
  
  // Execute multicall using aggregate3
  const multicall = new ethers.Contract(MULTICALL3_ADDRESS, MULTICALL3_ABI, provider);
  const returnData = await multicall.aggregate3(calls);
  const blockNumber = await provider.getBlockNumber();
  
  // Decode results
  const results = returnData.map((result, index) => {
    const call = config.payload[index];
    
    if (!result.success) {
      return {
        success: false,
        method: call.methodName,
        arguments: call.arguments || [],
        error: 'Call reverted'
      };
    }

    try {
      const decoded = contractInterface.decodeFunctionResult(call.methodName, result.returnData);
      return {
        success: true,
        method: call.methodName,
        arguments: call.arguments || [],
        result: decoded.length === 1 ? decoded[0] : decoded
      };
    } catch (error) {
      return {
        success: false,
        method: call.methodName,
        arguments: call.arguments || [],
        error: error.message
      };
    }
  });
  
  return {
    success: true,
    blockNumber: blockNumber.toString(),
    chain_id: config.chain_id,
    contract_address: config.contract_address,
    calls: results
  };
}

queryContractState().then(console.log).catch(console.error);`;
  }

  if (language === 'python') {
    return `# Python ethers contract interaction example
from web3 import Web3
import json

CHAIN_RPC_MAP = ${JSON.stringify(chainRpcMap, null, 2).replace(/"/g, "'")}
MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11'

def query_contract_state():
    config = ${JSON.stringify(finalPayload, null, 2).replace(/"/g, "'")}
    
    # Create web3 instance
    w3 = Web3(Web3.HTTPProvider(CHAIN_RPC_MAP[config['chain_id']]))
    
    # Create contract instance
    contract = w3.eth.contract(
        address=config['contract_address'],
        abi=config['abi']
    )
    
    # Execute contract calls
    results = []
    for call in config['payload']:
        try:
            result = getattr(contract.functions, call['methodName'])(*call.get('arguments', [])).call()
            results.append({
                'method': call['methodName'],
                'arguments': call.get('arguments', []),
                'result': result
            })
        except Exception as e:
            results.append({
                'method': call['methodName'],
                'arguments': call.get('arguments', []),
                'error': str(e)
            })
    
    return {
        'success': True,
        'chain_id': config['chain_id'],
        'contract_address': config['contract_address'],
        'calls': results
    }

print(json.dumps(query_contract_state(), indent=2))`;
  }

  // Default fallback for other languages
  return `// Ethers.js contract query example
// Install: npm install ethers
// Config: ${JSON.stringify(finalPayload, null, 2)}
// See documentation for language-specific implementation`;
}
