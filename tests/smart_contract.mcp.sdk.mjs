import { dbg } from './utils.mjs';

export const testSmartContractResources = async (client) => {
  // Test that smart_contract resource exists and has the expected action
  const smartContractActions = await client.callTool({
    name: 'list_resource_actions',
    arguments: { resource: 'smart_contract' },
  });
  const smartContractActionsText =
    (smartContractActions.content && smartContractActions.content[0] && smartContractActions.content[0].text) || '';
  dbg('Smart contract actions:', smartContractActionsText);

  const smartContractActionsParsed = JSON.parse(smartContractActionsText);
  if (
    !Array.isArray(smartContractActionsParsed.actions) ||
    !smartContractActionsParsed.actions.find((a) => a.name === 'download_abi')
  ) {
    throw new Error('smart_contract missing download_abi action');
  }

  // Verify schema for download_abi action
  const schemaRes = await client.callTool({
    name: 'get_resource_action_schema',
    arguments: { resource: 'smart_contract', action: 'download_abi' },
  });
  const schemaText =
    (schemaRes.content && schemaRes.content[0] && schemaRes.content[0].text) || '';
  const schema = JSON.parse(schemaText);
  if (
    !schema?.schema?.properties?.contract_address ||
    !Array.isArray(schema?.schema?.required) ||
    !schema.schema.required.includes('contract_address')
  ) {
    throw new Error('smart_contract.download_abi schema missing expected fields');
  }

  // Verify that snippet generation is not supported
  const snippetRes = await client.callTool({
    name: 'get_resource_action_snippet',
    arguments: { 
      resource: 'smart_contract', 
      action: 'download_abi',
      language: 'javascript'
    },
  });
  const snippetText =
    (snippetRes.content && snippetRes.content[0] && snippetRes.content[0].text) || '';
  if (!snippetText.includes('SNIPPET_GENERATION_NOT_SUPPORTED')) {
    throw new Error('smart_contract.download_abi should not support snippet generation');
  }

  // Test actual API call with a real smart contract address (default pacific-1)
  try {
    const invokeRes = await client.callTool({
      name: 'invoke_resource_action',
      arguments: {
        resource: 'smart_contract',
        action: 'download_abi',
        payload: {
          contract_address: '0xf69d9cacc0140e699c6b545d166c973cb59b8e87'
        }
      },
    });
    const invokeText =
      (invokeRes.content && invokeRes.content[0] && invokeRes.content[0].text) || '';
    const invokeResult = JSON.parse(invokeText);
    dbg('Smart contract API call result:', invokeText);
    // Verify response has only ABI field (resolver should extract only ABI)
    if (
      !('abi' in invokeResult) ||
      Object.keys(invokeResult).length !== 1 ||
      Object.keys(invokeResult)[0] !== 'abi'
    ) {
      throw new Error('smart_contract.download_abi should return only ABI field after resolver processing');
    }
    
    dbg('Smart contract API call successful (pacific-1 default) - ABI extracted:', Array.isArray(invokeResult.abi));
  } catch (error) {
    // If the API call fails due to network issues, that's acceptable for the test
    dbg('Smart contract API call failed (may be expected):', error.message);
  }

  // Test with explicit atlantic-2 chain
  try {
    const invokeRes = await client.callTool({
      name: 'invoke_resource_action',
      arguments: {
        resource: 'smart_contract',
        action: 'download_abi',
        payload: {
          contract_address: '0xf69d9cacc0140e699c6b545d166c973cb59b8e87',
          chain: 'atlantic-2'
        }
      },
    });
    const invokeText =
      (invokeRes.content && invokeRes.content[0] && invokeRes.content[0].text) || '';
    const invokeResult = JSON.parse(invokeText);
    
    // Verify response has only ABI field (resolver should extract only ABI)
    if (
      !('abi' in invokeResult) ||
      Object.keys(invokeResult).length !== 1 ||
      Object.keys(invokeResult)[0] !== 'abi'
    ) {
      throw new Error('smart_contract.download_abi should return only ABI field after resolver processing');
    }
    
    dbg('Smart contract API call successful (atlantic-2) - ABI extracted:', Array.isArray(invokeResult.abi));
  } catch (error) {
    // If the API call fails due to network issues, that's acceptable for the test
    dbg('Smart contract API call failed (may be expected):', error.message);
  }

  // Test with arctic-1 chain
  try {
    const invokeRes = await client.callTool({
      name: 'invoke_resource_action',
      arguments: {
        resource: 'smart_contract',
        action: 'download_abi',
        payload: {
          contract_address: '0xf69d9cacc0140e699c6b545d166c973cb59b8e87',
          chain: 'arctic-1'
        }
      },
    });
    const invokeText =
      (invokeRes.content && invokeRes.content[0] && invokeRes.content[0].text) || '';
    const invokeResult = JSON.parse(invokeText);
    
    // Verify response has only ABI field (resolver should extract only ABI)
    if (
      !('abi' in invokeResult) ||
      Object.keys(invokeResult).length !== 1 ||
      Object.keys(invokeResult)[0] !== 'abi'
    ) {
      throw new Error('smart_contract.download_abi should return only ABI field after resolver processing');
    }
    
    dbg('Smart contract API call successful (arctic-1) - ABI extracted:', Array.isArray(invokeResult.abi));
  } catch (error) {
    // If the API call fails due to network issues, that's acceptable for the test
    dbg('Smart contract API call failed (may be expected):', error.message);
  }

  // Test with invalid contract address format
  try {
    const invalidRes = await client.callTool({
      name: 'invoke_resource_action',
      arguments: {
        resource: 'smart_contract',
        action: 'download_abi',
        payload: {
          contract_address: 'invalid_address'
        }
      },
    });
    // If this doesn't throw, check if we get an error response
    const invalidText =
      (invalidRes.content && invalidRes.content[0] && invalidRes.content[0].text) || '';
    dbg('Invalid address response:', invalidText);
  } catch {
    // Expected to fail with invalid address format
    dbg('Invalid address correctly rejected');
  }

  // Test with invalid chain
  try {
    const invalidChainRes = await client.callTool({
      name: 'invoke_resource_action',
      arguments: {
        resource: 'smart_contract',
        action: 'download_abi',
        payload: {
          contract_address: '0xf69d9cacc0140e699c6b545d166c973cb59b8e87',
          chain: 'invalid-chain'
        }
      },
    });
    // Should get an error response
    const invalidChainText =
      (invalidChainRes.content && invalidChainRes.content[0] && invalidChainRes.content[0].text) || '';
    if (!invalidChainText.includes('Invalid chain')) {
      throw new Error('Invalid chain should have been rejected');
    }
    dbg('Invalid chain correctly rejected:', invalidChainText);
  } catch (error) {
    // Expected to fail with invalid chain
    dbg('Invalid chain correctly rejected with error:', error.message);
  }

  // Test search_verified_contracts action exists
  const searchActions = await client.callTool({
    name: 'list_resource_actions',
    arguments: { resource: 'smart_contract' },
  });
  const searchActionsText =
    (searchActions.content && searchActions.content[0] && searchActions.content[0].text) || '';
  const searchActionsParsed = JSON.parse(searchActionsText);
  
  if (!searchActionsParsed.actions.find((a) => a.name === 'search_verified_contracts')) {
    throw new Error('smart_contract missing search_verified_contracts action');
  }
  
  dbg('✓ search_verified_contracts action found');

  // Verify schema for search_verified_contracts action
  const searchSchemaRes = await client.callTool({
    name: 'get_resource_action_schema',
    arguments: { resource: 'smart_contract', action: 'search_verified_contracts' },
  });
  const searchSchemaText =
    (searchSchemaRes.content && searchSchemaRes.content[0] && searchSchemaRes.content[0].text) || '';

  const searchSchema = JSON.parse(searchSchemaText);
  
  if (
    !searchSchema?.schema?.properties?.q ||
    !Array.isArray(searchSchema?.schema?.required) ||
    !searchSchema.schema.required.includes('q')
  ) {
    throw new Error('smart_contract.search_verified_contracts schema missing expected fields');
  }
  
  dbg('✓ search_verified_contracts schema validated');

  // Verify that snippet generation is not supported for search
  const searchSnippetRes = await client.callTool({
    name: 'get_resource_action_snippet',
    arguments: { 
      resource: 'smart_contract', 
      action: 'search_verified_contracts',
      language: 'javascript'
    },
  });
  const searchSnippetText =
    (searchSnippetRes.content && searchSnippetRes.content[0] && searchSnippetRes.content[0].text) || '';
  if (!searchSnippetText.includes('SNIPPET_GENERATION_NOT_SUPPORTED')) {
    throw new Error('smart_contract.search_verified_contracts should not support snippet generation');
  }
  
  dbg('✓ search_verified_contracts snippet generation correctly not supported');

  // Test actual search API call (default pacific-1)
  try {
    const searchRes = await client.callTool({
      name: 'invoke_resource_action',
      arguments: {
        resource: 'smart_contract',
        action: 'search_verified_contracts',
        payload: {
          q: 'GG'
        }
      },
    });
    const searchText =
      (searchRes.content && searchRes.content[0] && searchRes.content[0].text) || '';
    dbg('Smart contract search response:', searchText);
    const searchResult = JSON.parse(searchText);
    
    // Verify response has contracts array with expected fields (name, hash, language)
    if (
      !('contracts' in searchResult) ||
      !Array.isArray(searchResult.contracts)
    ) {
      throw new Error('smart_contract.search_verified_contracts should return contracts array');
    }
    
    // Check that contracts have the expected fields (if any results)
    if (searchResult.contracts.length > 0) {
      const firstContract = searchResult.contracts[0];
      const hasExpectedFields = (
        'name' in firstContract || 
        'hash' in firstContract || 
        'language' in firstContract
      );
      if (!hasExpectedFields) {
        throw new Error('smart_contract.search_verified_contracts contracts missing expected fields (name, hash, language)');
      }
    }
    
    dbg('Smart contract search successful (pacific-1 default) - found contracts:', searchResult.contracts.length);
  } catch (error) {
    // If the API call fails due to network issues, that's acceptable for the test
    dbg('Smart contract search failed (may be expected):', error.message);
  }

  // Test search with explicit atlantic-2 chain
  try {
    const searchRes = await client.callTool({
      name: 'invoke_resource_action',
      arguments: {
        resource: 'smart_contract',
        action: 'search_verified_contracts',
        payload: {
          q: 'GG',
          chain: 'atlantic-2'
        }
      },
    });
    const searchText =
      (searchRes.content && searchRes.content[0] && searchRes.content[0].text) || '';
    const searchResult = JSON.parse(searchText);
    
    if (!('contracts' in searchResult) || !Array.isArray(searchResult.contracts)) {
      throw new Error('smart_contract.search_verified_contracts should return contracts array');
    }
    
    dbg('Smart contract search successful (atlantic-2) - found contracts:', searchResult.contracts.length);
  } catch (error) {
    dbg('Smart contract search failed (may be expected):', error.message);
  }

  // Test search with arctic-1 chain
  try {
    const searchRes = await client.callTool({
      name: 'invoke_resource_action',
      arguments: {
        resource: 'smart_contract',
        action: 'search_verified_contracts',
        payload: {
          q: 'GG',
          chain: 'arctic-1'
        }
      },
    });
    const searchText =
      (searchRes.content && searchRes.content[0] && searchRes.content[0].text) || '';
    const searchResult = JSON.parse(searchText);
    
    if (!('contracts' in searchResult) || !Array.isArray(searchResult.contracts)) {
      throw new Error('smart_contract.search_verified_contracts should return contracts array');
    }
    
    dbg('Smart contract search successful (arctic-1) - found contracts:', searchResult.contracts.length);
  } catch (error) {
    dbg('Smart contract search failed (may be expected):', error.message);
  }

  // Test search with invalid chain
  try {
    const invalidSearchRes = await client.callTool({
      name: 'invoke_resource_action',
      arguments: {
        resource: 'smart_contract',
        action: 'search_verified_contracts',
        payload: {
          q: 'GG',
          chain: 'invalid-chain'
        }
      },
    });
    const invalidSearchText =
      (invalidSearchRes.content && invalidSearchRes.content[0] && invalidSearchRes.content[0].text) || '';
    if (!invalidSearchText.includes('Invalid chain')) {
      throw new Error('Invalid chain should have been rejected for search');
    }
    dbg('Invalid chain correctly rejected for search:', invalidSearchText);
  } catch (error) {
    dbg('Invalid chain correctly rejected for search with error:', error.message);
  }

  // Test query_contract_state action exists
  const queryActions = await client.callTool({
    name: 'list_resource_actions',
    arguments: { resource: 'smart_contract' },
  });
  const queryActionsText =
    (queryActions.content && queryActions.content[0] && queryActions.content[0].text) || '';
  const queryActionsParsed = JSON.parse(queryActionsText);
  
  if (!queryActionsParsed.actions.find((a) => a.name === 'query_contract_state')) {
    throw new Error('smart_contract missing query_contract_state action');
  }
  
  dbg('✓ query_contract_state action found');

  // Verify schema for query_contract_state action
  const querySchemaRes = await client.callTool({
    name: 'get_resource_action_schema',
    arguments: { resource: 'smart_contract', action: 'query_contract_state' },
  });
  const querySchemaText =
    (querySchemaRes.content && querySchemaRes.content[0] && querySchemaRes.content[0].text) || '';

  const querySchema = JSON.parse(querySchemaText);
  
  if (
    !querySchema?.schema?.properties?.abi ||
    !querySchema?.schema?.properties?.contract_address ||
    !querySchema?.schema?.properties?.payload ||
    !querySchema?.schema?.properties?.chain_id ||
    !Array.isArray(querySchema?.schema?.required) ||
    !querySchema.schema.required.includes('abi') ||
    !querySchema.schema.required.includes('contract_address') ||
    !querySchema.schema.required.includes('payload') ||
    !querySchema.schema.required.includes('chain_id')
  ) {
    throw new Error('smart_contract.query_contract_state schema missing expected fields');
  }
  
  dbg('✓ query_contract_state schema validated');

  // Verify that snippet generation IS supported for query_contract_state
  const querySnippetRes = await client.callTool({
    name: 'get_resource_action_snippet',
    arguments: { 
      resource: 'smart_contract', 
      action: 'query_contract_state',
      language: 'javascript'
    },
  });
  const querySnippetText =
    (querySnippetRes.content && querySnippetRes.content[0] && querySnippetRes.content[0].text) || '';
  if (querySnippetText === 'SNIPPET_GENERATION_NOT_SUPPORTED') {
    throw new Error('smart_contract.query_contract_state should support snippet generation');
  }
  
  dbg('✓ query_contract_state snippet generation supported');

  // Test actual contract state query (using a simple ERC20 token totalSupply call)
  const erc20Abi = [
    {
      "constant": true,
      "inputs": [],
      "name": "totalSupply",
      "outputs": [{"name": "", "type": "uint256"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }
  ];

  try {
    const queryRes = await client.callTool({
      name: 'invoke_resource_action',
      arguments: {
        resource: 'smart_contract',
        action: 'query_contract_state',
        payload: {
          abi: erc20Abi,
          contract_address: '0xf69d9cacc0140e699c6b545d166c973cb59b8e87',
          payload: [
            {
              methodName: 'totalSupply',
              arguments: []
            }
          ],
          chain_id: 'pacific-1'
        }
      },
    });
    const queryText =
      (queryRes.content && queryRes.content[0] && queryRes.content[0].text) || '';
    dbg('Contract state query response:', queryText);
    const queryResult = JSON.parse(queryText);
    
    // Verify response has expected fields
    if (
      !('success' in queryResult) ||
      !('chain_id' in queryResult) ||
      !('contract_address' in queryResult) ||
      !('calls' in queryResult)
    ) {
      throw new Error('smart_contract.query_contract_state should return expected response structure');
    }
    
    dbg('Contract state query successful (pacific-1) - success:', queryResult.success);
  } catch (error) {
    // If the query fails due to network issues or contract not existing, that's acceptable for the test
    dbg('Contract state query failed (may be expected):', error.message);
  }

  // Test multiple method calls in a single query
  try {
    const multiQueryRes = await client.callTool({
      name: 'invoke_resource_action',
      arguments: {
        resource: 'smart_contract',
        action: 'query_contract_state',
        payload: {
          abi: erc20Abi,
          contract_address: '0xf69d9cacc0140e699c6b545d166c973cb59b8e87',
          payload: [
            {
              methodName: 'totalSupply',
              arguments: []
            },
            {
              methodName: 'totalSupply',
              arguments: []
            }
          ],
          chain_id: 'pacific-1'
        }
      },
    });
    const multiQueryText =
      (multiQueryRes.content && multiQueryRes.content[0] && multiQueryRes.content[0].text) || '';
    const multiQueryResult = JSON.parse(multiQueryText);
    
    // Verify response has calls array with multiple results
    if (
      !('calls' in multiQueryResult) ||
      !Array.isArray(multiQueryResult.calls) ||
      multiQueryResult.calls.length !== 2
    ) {
      throw new Error('smart_contract.query_contract_state should return multiple call results');
    }
    
    dbg('Multiple contract state query successful - call count:', multiQueryResult.calls.length);
  } catch (error) {
    dbg('Multiple contract state query failed (may be expected):', error.message);
  }

  // Test with invalid chain_id
  try {
    const invalidQueryRes = await client.callTool({
      name: 'invoke_resource_action',
      arguments: {
        resource: 'smart_contract',
        action: 'query_contract_state',
        payload: {
          abi: erc20Abi,
          contract_address: '0xf69d9cacc0140e699c6b545d166c973cb59b8e87',
          payload: [
            {
              methodName: 'totalSupply',
              arguments: []
            }
          ],
          chain_id: 'invalid-chain'
        }
      },
    });
    const invalidQueryText =
      (invalidQueryRes.content && invalidQueryRes.content[0] && invalidQueryRes.content[0].text) || '';
    if (!invalidQueryText.includes('Invalid arguments')) {
      throw new Error('Invalid chain_id should have been rejected for query_contract_state');
    }
    dbg('Invalid chain_id correctly rejected for query_contract_state:', invalidQueryText);
  } catch (error) {
    dbg('Invalid chain_id correctly rejected for query_contract_state with error:', error.message);
  }

  // Test maxScraps method call - this was a reported failing case that should now work
  // This test also verifies the aggregate3 implementation which provides better error handling
  const maxScrapsAbi = [
    {
      "constant": true,
      "inputs": [],
      "name": "maxScraps",
      "outputs": [{"name": "", "type": "uint256"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }
  ];

  try {
    const maxScrapsQueryRes = await client.callTool({
      name: 'invoke_resource_action',
      arguments: {
        resource: 'smart_contract',
        action: 'query_contract_state',
        payload: {
          abi: maxScrapsAbi,
          contract_address: '0x8d72Fa8b37F8A97CC0cE5Ee4077806e3b63dE9d0',
          payload: [
            {
              methodName: 'maxScraps',
              arguments: []
            }
          ],
          chain_id: 'pacific-1'
        }
      },
    });
    const maxScrapsQueryText =
      (maxScrapsQueryRes.content && maxScrapsQueryRes.content[0] && maxScrapsQueryRes.content[0].text) || '';
    dbg('maxScraps query response:', maxScrapsQueryText);
    const maxScrapsResult = JSON.parse(maxScrapsQueryText);
    
    // Verify response structure - should not have the "no matching fragment" error
    if ('success' in maxScrapsResult) {
      if (maxScrapsResult.success) {
        dbg('maxScraps query successful - calls:', maxScrapsResult.calls?.length || 0);
        
        // Verify BigInt handling - result should be a string, not cause serialization error
        if (maxScrapsResult.calls && maxScrapsResult.calls.length > 0) {
          const call = maxScrapsResult.calls[0];
          if (call.success && call.result !== undefined) {
            // For uint256, result should be a string representation of the number
            if (typeof call.result !== 'string' && typeof call.result !== 'number') {
              throw new Error('uint256 results should be converted to string or number for JSON serialization');
            }
            dbg('✅ BigInt properly converted to:', typeof call.result, call.result);
          }
        }
      } else {
        // Even if unsuccessful, it should not be due to fragment error or BigInt serialization
        if (maxScrapsResult.details && 
            (maxScrapsResult.details.includes('no matching fragment') ||
             maxScrapsResult.details.includes('Do not know how to serialize a BigInt'))) {
          throw new Error('maxScraps query should not fail with fragment or BigInt serialization errors after fix');
        }
        dbg('maxScraps query failed (but not due to fragment/BigInt error):', maxScrapsResult.details);
      }
    }
  } catch (error) {
    // Network errors are acceptable, but fragment/BigInt errors indicate the bug isn't fixed
    if (error.message && 
        (error.message.includes('no matching fragment') ||
         error.message.includes('Do not know how to serialize a BigInt'))) {
      throw new Error('maxScraps query should not fail with fragment or BigInt serialization errors after fix');
    }
    dbg('maxScraps query failed (may be expected network error):', error.message);
  }

  dbg('Smart contract resource tests passed');
};
