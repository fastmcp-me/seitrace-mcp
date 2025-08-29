import {
  generateEthersSnippet,
  validateEthersPayload
} from '../build/src/utils/snippet_generator/ethers.js';
import { dbg } from './utils.mjs';

/**
 * Comprehensive tests for ethers snippet generator
 */
export const testEthersSnippetGenerator = async () => {
  dbg('Testing ethers snippet generator...');
  
  // Test validation function
  testPayloadValidation();
  
  // Test snippet generation with valid payloads
  testSnippetGeneration();
  
  // Test error handling for invalid payloads
  testErrorHandling();
  
  // Test edge cases
  testEdgeCases();
  
  dbg('✅ All ethers snippet generator tests passed');
};

function testPayloadValidation() {
  dbg('Testing Zod-based payload validation...');
  
  // Valid payload
  const validPayload = {
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
    contract_address: "0x1234567890123456789012345678901234567890",
    payload: [
      {
        methodName: "totalSupply",
        arguments: []
      }
    ],
    chain_id: "pacific-1"
  };
  
  const validResult = validateEthersPayload(validPayload);
  if (!validResult.isValid) {
    throw new Error(`Valid payload should pass validation: ${validResult.errors.join(', ')}`);
  }
  if (!validResult.data) {
    throw new Error('Valid payload should return parsed data');
  }
  
  // Test missing ABI
  const missingAbi = { ...validPayload };
  delete missingAbi.abi;
  const missingAbiResult = validateEthersPayload(missingAbi);
  if (missingAbiResult.isValid || !missingAbiResult.errors.some(e => e.includes('Required'))) {
    throw new Error('Should fail validation when ABI is missing');
  }
  
  // Test empty ABI
  const emptyAbi = { ...validPayload, abi: [] };
  const emptyAbiResult = validateEthersPayload(emptyAbi);
  if (emptyAbiResult.isValid || !emptyAbiResult.errors.some(e => e.includes('at least one item'))) {
    throw new Error('Should fail validation for empty ABI');
  }
  
  // Test invalid contract address
  const invalidAddress = { ...validPayload, contract_address: "invalid" };
  const invalidAddressResult = validateEthersPayload(invalidAddress);
  if (invalidAddressResult.isValid || !invalidAddressResult.errors.some(e => e.includes('valid Ethereum address'))) {
    throw new Error('Should fail validation for invalid contract address');
  }
  
  // Test invalid chain ID
  const invalidChain = { ...validPayload, chain_id: "invalid-chain" };
  const invalidChainResult = validateEthersPayload(invalidChain);
  if (invalidChainResult.isValid || !invalidChainResult.errors.some(e => e.includes('pacific-1, atlantic-2, arctic-1'))) {
    throw new Error('Should fail validation for invalid chain ID');
  }
  
  // Test empty payload array
  const emptyPayload = { ...validPayload, payload: [] };
  const emptyPayloadResult = validateEthersPayload(emptyPayload);
  if (emptyPayloadResult.isValid || !emptyPayloadResult.errors.some(e => e.includes('at least one method call'))) {
    throw new Error('Should fail validation for empty payload array');
  }
  
  // Test method not in ABI
  const methodNotInAbi = { 
    ...validPayload, 
    payload: [{ methodName: "nonExistentMethod", arguments: [] }] 
  };
  const methodNotInAbiResult = validateEthersPayload(methodNotInAbi);
  if (methodNotInAbiResult.isValid || !methodNotInAbiResult.errors.some(e => e.includes('must exist as functions in the contract ABI'))) {
    throw new Error('Should fail validation when method is not in ABI');
  }
  
  // Test ABI function without name
  const abiWithoutName = {
    ...validPayload,
    abi: [
      {
        "type": "function",
        "inputs": [],
        "outputs": []
        // missing name
      }
    ]
  };
  const abiWithoutNameResult = validateEthersPayload(abiWithoutName);
  if (abiWithoutNameResult.isValid || !abiWithoutNameResult.errors.some(e => e.includes('valid name'))) {
    throw new Error('Should fail validation for function ABI without name');
  }
  
  // Test null/undefined payload
  const nullResult = validateEthersPayload(null);
  if (nullResult.isValid) {
    throw new Error('Should fail validation for null payload');
  }
  
  const undefinedResult = validateEthersPayload(undefined);
  if (undefinedResult.isValid) {
    throw new Error('Should fail validation for undefined payload');
  }
  
  // Test array as payload (should be object)
  const arrayResult = validateEthersPayload([]);
  if (arrayResult.isValid) {
    throw new Error('Should fail validation for array payload');
  }
  
  // Test invalid methodName type
  const invalidMethodName = {
    ...validPayload,
    payload: [{ methodName: "", arguments: [] }]
  };
  const invalidMethodNameResult = validateEthersPayload(invalidMethodName);
  if (invalidMethodNameResult.isValid || !invalidMethodNameResult.errors.some(e => e.includes('Method name is required'))) {
    throw new Error('Should fail validation for empty method name');
  }
  
  // Test arguments defaults to empty array
  const noArguments = {
    ...validPayload,
    payload: [{ methodName: "totalSupply" }] // no arguments field
  };
  const noArgumentsResult = validateEthersPayload(noArguments);
  if (!noArgumentsResult.isValid) {
    throw new Error(`Should pass validation when arguments is omitted: ${noArgumentsResult.errors.join(', ')}`);
  }
  if (!noArgumentsResult.data || noArgumentsResult.data.payload[0].arguments?.length !== 0) {
    throw new Error('Arguments should default to empty array');
  }
  
  dbg('✅ Zod-based payload validation tests passed');
}

function testSnippetGeneration() {
  dbg('Testing snippet generation...');
  
  const validPayload = {
    abi: [
      {
        "constant": true,
        "inputs": [],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      }
    ],
    contract_address: "0x1234567890123456789012345678901234567890",
    payload: [
      {
        methodName: "balanceOf",
        arguments: ["0x1234567890123456789012345678901234567890"]
      }
    ],
    chain_id: "pacific-1"
  };
  
  // Test JavaScript snippet generation
  const jsSnippet = generateEthersSnippet({}, 'query_contract_state', 'javascript', validPayload);
  
  if (!jsSnippet.includes('ethers')) {
    throw new Error('JavaScript snippet should include ethers import');
  }
  if (!jsSnippet.includes('aggregate3')) {
    throw new Error('JavaScript snippet should use Multicall3 aggregate3');
  }
  if (!jsSnippet.includes(validPayload.contract_address)) {
    throw new Error('JavaScript snippet should include contract address');
  }
  if (!jsSnippet.includes('balanceOf')) {
    throw new Error('JavaScript snippet should include method name');
  }
  
  // Test Node.js snippet generation
  const nodeSnippet = generateEthersSnippet({}, 'query_contract_state', 'node', validPayload);
  if (!nodeSnippet.includes('ethers')) {
    throw new Error('Node.js snippet should include ethers import');
  }
  
  // Test Python snippet generation
  const pythonSnippet = generateEthersSnippet({}, 'query_contract_state', 'python', validPayload);
  
  if (!pythonSnippet.includes('Web3')) {
    throw new Error('Python snippet should include Web3 import');
  }
  if (!pythonSnippet.includes(validPayload.contract_address.replace(/"/g, "'"))) {
    throw new Error('Python snippet should include contract address');
  }
  if (!pythonSnippet.includes('balanceOf')) {
    throw new Error('Python snippet should include method name');
  }
  
  // Test fallback for unsupported language
  const fallbackSnippet = generateEthersSnippet({}, 'query_contract_state', 'ruby', validPayload);
  if (!fallbackSnippet.includes('Ethers.js contract query example')) {
    throw new Error('Fallback snippet should include example comment');
  }
  
  dbg('✅ Snippet generation tests passed');
}

function testErrorHandling() {
  dbg('Testing error handling with Zod validation...');
  
  const invalidPayload = {
    abi: "not an array",
    contract_address: "invalid",
    payload: "not an array",
    chain_id: "invalid"
  };
  
  // Test JavaScript error snippet
  const jsErrorSnippet = generateEthersSnippet({}, 'query_contract_state', 'javascript', invalidPayload);
  
  if (!jsErrorSnippet.includes('Error: Invalid payload')) {
    throw new Error('JavaScript error snippet should indicate invalid payload');
  }
  if (!jsErrorSnippet.includes('Validation errors')) {
    throw new Error('JavaScript error snippet should include validation errors header');
  }
  if (!jsErrorSnippet.includes('validPayload')) {
    throw new Error('JavaScript error snippet should include example valid payload');
  }
  
  // Test Python error snippet
  const pythonErrorSnippet = generateEthersSnippet({}, 'query_contract_state', 'python', invalidPayload);
  
  if (!pythonErrorSnippet.includes('Error: Invalid payload')) {
    throw new Error('Python error snippet should indicate invalid payload');
  }
  if (!pythonErrorSnippet.includes('Validation errors')) {
    throw new Error('Python error snippet should include validation errors');
  }
  
  // Test fallback error snippet
  const fallbackErrorSnippet = generateEthersSnippet({}, 'query_contract_state', 'ruby', invalidPayload);
  if (!fallbackErrorSnippet.includes('Error: Invalid payload')) {
    throw new Error('Fallback error snippet should indicate invalid payload');
  }
  
  // Test specific Zod error messages
  const validation = validateEthersPayload(invalidPayload);
  if (validation.isValid) {
    throw new Error('Invalid payload should fail validation');
  }
  
  // Check that we get specific Zod error messages
  const hasAbiError = validation.errors.some(e => e.includes('abi') && (e.includes('array') || e.includes('Expected')));
  const hasAddressError = validation.errors.some(e => e.includes('contract_address') && e.includes('Ethereum address'));
  const hasChainError = validation.errors.some(e => e.includes('chain_id'));
  const hasPayloadError = validation.errors.some(e => e.includes('payload') && (e.includes('array') || e.includes('Expected')));
  
  if (!hasAbiError) {
    throw new Error('Should have ABI validation error');
  }
  if (!hasAddressError) {
    throw new Error('Should have contract address validation error');
  }
  if (!hasChainError) {
    throw new Error('Should have chain ID validation error');
  }
  if (!hasPayloadError) {
    throw new Error('Should have payload validation error');
  }
  
  dbg('✅ Zod-based error handling tests passed');
}

function testEdgeCases() {
  dbg('Testing edge cases with Zod validation...');
  
  // Test with no payload (should use sample)
  const noPayloadSnippet = generateEthersSnippet({}, 'query_contract_state', 'javascript');
  if (!noPayloadSnippet.includes('totalSupply')) {
    throw new Error('No payload should use sample payload with totalSupply');
  }
  
  // Test with minimal valid ABI
  const minimalPayload = {
    abi: [
      {
        "type": "function",
        "name": "test",
        "inputs": [],
        "outputs": []
      }
    ],
    contract_address: "0x1234567890123456789012345678901234567890",
    payload: [
      {
        methodName: "test"
      }
    ],
    chain_id: "atlantic-2"
  };
  
  const minimalResult = validateEthersPayload(minimalPayload);
  if (!minimalResult.isValid) {
    throw new Error(`Minimal payload should be valid: ${minimalResult.errors.join(', ')}`);
  }
  
  // Verify arguments defaults to empty array
  if (!minimalResult.data || minimalResult.data.payload[0].arguments?.length !== 0) {
    throw new Error('Arguments should default to empty array');
  }
  
  // Test with complex ABI including events and constructors
  const complexPayload = {
    abi: [
      {
        "type": "constructor",
        "inputs": [{"name": "owner", "type": "address"}]
      },
      {
        "type": "event",
        "name": "Transfer",
        "inputs": [
          {"name": "from", "type": "address", "indexed": true},
          {"name": "to", "type": "address", "indexed": true}
        ]
      },
      {
        "type": "function",
        "name": "transfer",
        "inputs": [{"name": "to", "type": "address"}, {"name": "amount", "type": "uint256"}],
        "outputs": [{"name": "", "type": "bool"}]
      }
    ],
    contract_address: "0x1234567890123456789012345678901234567890",
    payload: [
      {
        methodName: "transfer",
        arguments: ["0x1234567890123456789012345678901234567890", "1000"]
      }
    ],
    chain_id: "arctic-1"
  };
  
  const complexResult = validateEthersPayload(complexPayload);
  if (!complexResult.isValid) {
    throw new Error(`Complex payload should be valid: ${complexResult.errors.join(', ')}`);
  }
  
  // Test different chain IDs
  for (const chainId of ['pacific-1', 'atlantic-2', 'arctic-1']) {
    const chainPayload = { ...minimalPayload, chain_id: chainId };
    const chainResult = validateEthersPayload(chainPayload);
    if (!chainResult.isValid) {
      throw new Error(`Chain ID ${chainId} should be valid`);
    }
    
    const snippet = generateEthersSnippet({}, 'query_contract_state', 'javascript', chainPayload);
    if (!snippet.includes(chainId)) {
      throw new Error(`Snippet should include chain ID ${chainId}`);
    }
  }
  
  // Test case sensitivity in contract address
  const uppercaseAddress = {
    ...minimalPayload,
    contract_address: "0X1234567890123456789012345678901234567890"
  };
  const uppercaseResult = validateEthersPayload(uppercaseAddress);
  if (!uppercaseResult.isValid) {
    throw new Error('Uppercase contract address should be valid');
  }
  
  // Test contract address validation edge cases
  const shortAddress = { ...minimalPayload, contract_address: "0x123" };
  const shortResult = validateEthersPayload(shortAddress);
  if (shortResult.isValid) {
    throw new Error('Short address should be invalid');
  }
  
  const longAddress = { ...minimalPayload, contract_address: "0x12345678901234567890123456789012345678901" };
  const longResult = validateEthersPayload(longAddress);
  if (longResult.isValid) {
    throw new Error('Long address should be invalid');
  }
  
  const noHexPrefix = { ...minimalPayload, contract_address: "1234567890123456789012345678901234567890" };
  const noHexResult = validateEthersPayload(noHexPrefix);
  if (noHexResult.isValid) {
    throw new Error('Address without 0x prefix should be invalid');
  }
  
  // Test ABI with non-function types (should be allowed)
  const abiWithEvents = {
    ...minimalPayload,
    abi: [
      {
        "type": "event",
        "name": "TestEvent",
        "inputs": []
      },
      {
        "type": "function", 
        "name": "test",
        "inputs": [],
        "outputs": []
      }
    ]
  };
  const eventsResult = validateEthersPayload(abiWithEvents);
  if (!eventsResult.isValid) {
    throw new Error(`ABI with events should be valid: ${eventsResult.errors.join(', ')}`);
  }
  
  dbg('✅ Zod-based edge case tests passed');
}
