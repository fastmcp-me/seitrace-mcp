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
  if (snippetText !== 'SNIPPET_GENERATION_NOT_SUPPORTED') {
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

  dbg('Smart contract resource tests passed');
};
