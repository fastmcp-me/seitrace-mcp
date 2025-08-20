import { dbg } from './utils.mjs';

/* global process */

/**
 * Comprehensive test suite for the download_abi action
 * Tests various scenarios including valid contracts, invalid contracts, error handling, etc.
 */
export const testDownloadAbiAction = async (client) => {
  dbg('\n🧪 Starting download_abi action comprehensive tests...\n');

  const testResults = {
    passed: 0,
    failed: 0,
    errors: []
  };

  const runTest = async (testName, testFn) => {
    try {
      dbg(`\n📋 Running test: ${testName}`);
      await testFn();
      testResults.passed++;
      dbg(`✅ ${testName} - PASSED`);
    } catch (error) {
      testResults.failed++;
      testResults.errors.push({ test: testName, error: error.message });
      dbg(`❌ ${testName} - FAILED: ${error.message}`);
    }
  };

  // Test 1: Valid verified contract (AggregatorHelper on pacific-1)
  await runTest('Valid verified contract - AggregatorHelper', async () => {
    const result = await client.callTool({
      name: 'invoke_resource_action',
      arguments: {
        resource: 'smart_contract',
        action: 'download_abi',
        payload: {
          contract_address: '0x8d72Fa8b37F8A97CC0cE5Ee4077806e3b63dE9d0',
          chain: 'pacific-1'
        }
      }
    });

    const response = JSON.parse(result.content[0].text);
    
    if (response.error) {
      throw new Error(`Expected success but got error: ${JSON.stringify(response.error)}`);
    }

    // Verify response contains ONLY the "abi" field
    const responseKeys = Object.keys(response);
    if (responseKeys.length !== 1 || responseKeys[0] !== 'abi') {
      throw new Error(`Expected response to contain only "abi" field, but got: ${responseKeys.join(', ')}`);
    }

    if (!response.abi || !Array.isArray(response.abi)) {
      throw new Error('Expected ABI array in response');
    }

    // Verify ABI contains expected functions
    const abiMethods = response.abi.filter(item => item.type === 'function').map(item => item.name);
    const expectedMethods = ['maxScraps', 'owner', 'setMaxScraps', 'swapExactInput', 'swapExactOutput'];
    
    for (const method of expectedMethods) {
      if (!abiMethods.includes(method)) {
        throw new Error(`Expected method '${method}' not found in ABI`);
      }
    }

    dbg('✓ Response contains only "abi" field');
    dbg('✓ ABI methods found:', abiMethods.length);
  });

  // Test 1.5: Explicit test for "abi-only" response requirement
  await runTest('Response contains ONLY abi field (resolver behavior)', async () => {
    const result = await client.callTool({
      name: 'invoke_resource_action',
      arguments: {
        resource: 'smart_contract',
        action: 'download_abi',
        payload: {
          contract_address: '0x8d72Fa8b37F8A97CC0cE5Ee4077806e3b63dE9d0',
          chain: 'pacific-1'
        }
      }
    });

    const response = JSON.parse(result.content[0].text);
    
    if (response.error) {
      throw new Error(`Expected success but got error: ${JSON.stringify(response.error)}`);
    }

    // Critical test: Verify response has EXACTLY one key and it's "abi"
    const responseKeys = Object.keys(response);
    if (responseKeys.length !== 1) {
      throw new Error(`Response should have exactly 1 key, but has ${responseKeys.length}: [${responseKeys.join(', ')}]`);
    }

    if (responseKeys[0] !== 'abi') {
      throw new Error(`Response should have only "abi" key, but has: "${responseKeys[0]}"`);
    }

    // Verify it's not returning other fields that might be in the full contract response
    const forbiddenFields = [
      'source_code', 'name', 'compiler_version', 'optimization_enabled', 
      'is_verified', 'deployed_bytecode', 'constructor_args', 'license_type',
      'creation_bytecode', 'additional_sources', 'certified'
    ];

    for (const field of forbiddenFields) {
      if (field in response) {
        throw new Error(`Response should not contain "${field}" field (resolver should filter it out)`);
      }
    }

    dbg('✓ Confirmed: Response contains ONLY "abi" field');
    dbg('✓ Confirmed: No other contract metadata fields present');
  });

  // Test 2: Different chain - atlantic-2
  await runTest('Valid contract on atlantic-2', async () => {
    const result = await client.callTool({
      name: 'invoke_resource_action',
      arguments: {
        resource: 'smart_contract',
        action: 'download_abi',
        payload: {
          chain: 'atlantic-2',
          contract_address: '0x1234567890123456789012345678901234567890' // Example address
        }
      }
    });

    const response = JSON.parse(result.content[0].text);
    // This may return an error if contract doesn't exist, which is expected
    dbg('Atlantic-2 test result:', response.error ? 'Error (expected)' : 'Success');
  });

  // Test 3: Invalid contract address format
  await runTest('Invalid contract address format', async () => {
    const result = await client.callTool({
      name: 'invoke_resource_action',
      arguments: {
        resource: 'smart_contract',
        action: 'download_abi',
        payload: {
          chain: 'pacific-1',
          contract_address: 'invalid_address'
        }
      }
    });

    const response = JSON.parse(result.content[0].text);
    
    if (!response.error) {
      throw new Error('Expected error for invalid address format');
    }

    dbg('Invalid address error:', response.error);
  });

  // Test 4: Non-existent contract address
  await runTest('Non-existent contract address', async () => {
    const result = await client.callTool({
      name: 'invoke_resource_action',
      arguments: {
        resource: 'smart_contract',
        action: 'download_abi',
        payload: {
          chain: 'pacific-1',
          contract_address: '0x0000000000000000000000000000000000000001'
        }
      }
    });

    const response = JSON.parse(result.content[0].text);
    
    if (!response.error) {
      throw new Error('Expected error for non-existent contract');
    }

    dbg('Non-existent contract error:', response.error);
  });

  // Test 5: Missing required parameters
  await runTest('Missing chain parameter', async () => {
    try {
      const result = await client.callTool({
        name: 'invoke_resource_action',
        arguments: {
          resource: 'smart_contract',
          action: 'download_abi',
          payload: {
            contract_address: '0x8d72Fa8b37F8A97CC0cE5Ee4077806e3b63dE9d0'
          }
        }
      });

      const response = JSON.parse(result.content[0].text);
      
      if (!response.error) {
        throw new Error('Expected error for missing chain parameter');
      }

      dbg('Missing chain error:', response.error);
    } catch (error) {
      // MCP might throw an error before reaching the action
      if (error.message.includes('chain') || error.message.includes('required')) {
        dbg('Expected validation error caught:', error.message);
      } else {
        throw error;
      }
    }
  });

  // Test 6: Missing contract_address parameter
  await runTest('Missing contract_address parameter', async () => {
    try {
      const result = await client.callTool({
        name: 'invoke_resource_action',
        arguments: {
          resource: 'smart_contract',
          action: 'download_abi',
          payload: {
            chain: 'pacific-1'
          }
        }
      });

      const response = JSON.parse(result.content[0].text);
      
      if (!response.error) {
        throw new Error('Expected error for missing contract_address parameter');
      }

      dbg('Missing contract_address error:', response.error);
    } catch (error) {
      // MCP might throw an error before reaching the action
      if (error.message.includes('contract_address') || error.message.includes('required')) {
        dbg('Expected validation error caught:', error.message);
      } else {
        throw error;
      }
    }
  });

  // Test 7: Invalid chain parameter
  await runTest('Invalid chain parameter', async () => {
    const result = await client.callTool({
      name: 'invoke_resource_action',
      arguments: {
        resource: 'smart_contract',
        action: 'download_abi',
        payload: {
          chain: 'invalid-chain',
          contract_address: '0x8d72Fa8b37F8A97CC0cE5Ee4077806e3b63dE9d0'
        }
      }
    });

    const response = JSON.parse(result.content[0].text);
    
    if (!response.error) {
      throw new Error('Expected error for invalid chain');
    }

    dbg('Invalid chain error:', response.error);
  });

  // Test 8: Unverified contract (if we can find one)
  await runTest('Unverified contract handling', async () => {
    const result = await client.callTool({
      name: 'invoke_resource_action',
      arguments: {
        resource: 'smart_contract',
        action: 'download_abi',
        payload: {
          chain: 'pacific-1',
          contract_address: '0x1111111111111111111111111111111111111111'
        }
      }
    });

    const response = JSON.parse(result.content[0].text);
    
    // Should either return error or indicate unverified status
    dbg('Unverified contract result:', response.error ? 'Error (expected)' : 'Unexpected success');
  });

  // Test 9: Response format validation
  await runTest('Response format validation', async () => {
    const result = await client.callTool({
      name: 'invoke_resource_action',
      arguments: {
        resource: 'smart_contract',
        action: 'download_abi',
        payload: {
          chain: 'pacific-1',
          contract_address: '0x8d72Fa8b37F8A97CC0cE5Ee4077806e3b63dE9d0'
        }
      }
    });

    const response = JSON.parse(result.content[0].text);
    
    if (response.error) {
      throw new Error(`Unexpected error: ${JSON.stringify(response.error)}`);
    }

    // Validate response structure
    if (typeof response !== 'object') {
      throw new Error('Response is not an object');
    }

    if (!Object.prototype.hasOwnProperty.call(response, 'abi')) {
      throw new Error('Response missing abi field');
    }

    if (!Array.isArray(response.abi)) {
      throw new Error('ABI is not an array');
    }

    // Validate ABI structure
    for (const item of response.abi) {
      if (!item.type) {
        throw new Error('ABI item missing type field');
      }
      
      if (item.type === 'function' && !item.name) {
        throw new Error('Function ABI item missing name field');
      }
    }

    dbg('Response format validation passed');
  });

  // Test 10: Edge case - empty string address
  await runTest('Empty string contract address', async () => {
    const result = await client.callTool({
      name: 'invoke_resource_action',
      arguments: {
        resource: 'smart_contract',
        action: 'download_abi',
        payload: {
          chain: 'pacific-1',
          contract_address: ''
        }
      }
    });

    const response = JSON.parse(result.content[0].text);
    
    if (!response.error) {
      throw new Error('Expected error for empty address');
    }

    dbg('Empty address error:', response.error);
  });

  // Summary
  dbg('\n📊 Test Summary:');
  dbg(`✅ Passed: ${testResults.passed}`);
  dbg(`❌ Failed: ${testResults.failed}`);
  dbg(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

  if (testResults.errors.length > 0) {
    dbg('\n🚨 Failed Tests:');
    testResults.errors.forEach(({ test, error }) => {
      dbg(`   - ${test}: ${error}`);
    });
  }

  return testResults;
};

// Example usage for standalone testing
export const runStandaloneDownloadAbiTests = async () => {
  dbg('🚀 Starting standalone download_abi tests...');
  
  // Mock client for demonstration
  const mockClient = {
    callTool: async ({ name, arguments: args }) => {
      dbg(`Mock call: ${name} with`, args);
      return {
        content: [{
          text: JSON.stringify({ 
            error: 'Mock client - implement real MCP client for actual testing' 
          })
        }]
      };
    }
  };

  await testDownloadAbiAction(mockClient);
};

// If running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runStandaloneDownloadAbiTests().catch(dbg);
}
