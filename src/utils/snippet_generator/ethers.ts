import { SUPPORTED_GENERAL_SNIPPET_LANGUAGES } from './general.js';

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
  const samplePayload = payload || {
    abi: [
      {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{"name": "", "type": "uint256"}],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      }
    ],
    contract_address: "0x<CONTRACT_ADDRESS>",
    payload: [
      {
        methodName: "totalSupply",
        arguments: []
      }
    ],
    chain_id: defaultChainId
  };

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
  const config = ${JSON.stringify(samplePayload, null, 2)};
  
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
    config = ${JSON.stringify(samplePayload, null, 2).replace(/"/g, "'")}
    
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
// Config: ${JSON.stringify(samplePayload, null, 2)}
// See documentation for language-specific implementation`;
}
