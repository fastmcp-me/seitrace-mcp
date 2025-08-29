import { getZodSchemaFromJsonSchema, camelToSnake, controllerNameToToolName } from '../build/src/utils/schema.js';
import { dbg } from './utils.mjs';

/**
 * Test the schema validation utilities to ensure proper input validation
 */
export const testSchemaValidation = async () => {
  dbg('Testing schema validation utilities...');
  
  // Test camelToSnake conversion
  testCamelToSnake();
  
  // Test controllerNameToToolName conversion  
  testControllerNameToToolName();
  
  // Test Zod schema generation and validation
  await testZodSchemaGeneration();
  
  dbg('✅ All schema validation tests passed');
};

function testCamelToSnake() {
  dbg('Testing camelToSnake conversion...');
  
  const testCases = [
    ['searchVerifiedContracts', 'search_verified_contracts'],
    ['downloadAbi', 'download_abi'],
    ['queryContractState', 'query_contract_state'],
    ['HTTPSConnection', 'https_connection'],
    ['XMLHttpRequest', 'xml_http_request'],
    ['controller', 'controller'],
    ['API', 'api'],
  ];
  
  for (const [input, expected] of testCases) {
    const result = camelToSnake(input);
    if (result !== expected) {
      throw new Error(`camelToSnake(${input}) = ${result}, expected ${expected}`);
    }
  }
  
  dbg('✅ camelToSnake tests passed');
}

function testControllerNameToToolName() {
  dbg('Testing controllerNameToToolName conversion...');
  
  const testCases = [
    ['Controller', ''],
    ['SmartContractController', 'smart_contract'],
    ['TokenController', ''],
    ['ERC20Token', 'erc20'],
    ['NativeToken', 'native'],
  ];
  
  for (const [input, expected] of testCases) {
    const result = controllerNameToToolName(input);
    if (result !== expected) {
      throw new Error(`controllerNameToToolName(${input}) = ${result}, expected ${expected}`);
    }
  }
  
  dbg('✅ controllerNameToToolName tests passed');
}

async function testZodSchemaGeneration() {
  dbg('Testing Zod schema generation and validation...');
  
  // Test with the actual search_verified_contracts schema
  const searchContractsSchema = {
    type: 'object',
    properties: {
      q: {
        type: 'string',
        description: 'Search query string to find verified contracts',
        minLength: 1,
      },
      chain: {
        type: 'string',
        description: 'Seitrace network chain identifier',
        enum: ['pacific-1', 'atlantic-2', 'arctic-1'],
        default: 'pacific-1',
      },
    },
    required: ['q'],
    additionalProperties: false,
  };
  
  const zodSchema = getZodSchemaFromJsonSchema(searchContractsSchema, 'search_verified_contracts');
  
  // Test 1: Valid payload should pass
  dbg('Test 1: Valid payload validation');
  const validPayload = { q: 'AggregatorHelper', chain: 'pacific-1' };
  try {
    const result = zodSchema.parse(validPayload);
    if (JSON.stringify(result) !== JSON.stringify(validPayload)) {
      throw new Error('Valid payload result does not match input');
    }
    dbg('✅ Valid payload accepted correctly');
  } catch (error) {
    throw new Error(`Valid payload should not fail: ${error.message}`);
  }
  
  // Test 2: Invalid parameter names should fail
  dbg('Test 2: Invalid parameter names validation');
  const invalidPayload = { query: 'AggregatorHelper', chain_id: 'pacific-1' };
  try {
    zodSchema.parse(invalidPayload);
    throw new Error('Invalid payload with wrong parameter names should have been rejected');
  } catch (error) {
    if (!error.issues) {
      throw new Error(`Expected ZodError with issues, got: ${error.message}`);
    }
    const hasRequiredError = error.issues.some(issue => 
      issue.code === 'invalid_type' && issue.path.includes('q')
    );
    const hasUnrecognizedKeysError = error.issues.some(issue => 
      issue.code === 'unrecognized_keys'
    );
    
    if (!hasRequiredError || !hasUnrecognizedKeysError) {
      throw new Error('Expected both "required" and "unrecognized_keys" errors');
    }
    dbg('✅ Invalid parameter names correctly rejected');
  }
  
  // Test 3: Missing required field should fail
  dbg('Test 3: Missing required field validation');
  const missingRequiredPayload = { chain: 'pacific-1' };
  try {
    zodSchema.parse(missingRequiredPayload);
    throw new Error('Payload missing required field should have been rejected');
  } catch (error) {
    if (!error.issues) {
      throw new Error(`Expected ZodError with issues, got: ${error.message}`);
    }
    const hasRequiredError = error.issues.some(issue => 
      issue.code === 'invalid_type' && issue.path.includes('q')
    );
    
    if (!hasRequiredError) {
      throw new Error('Expected "required" error for missing q field');
    }
    dbg('✅ Missing required field correctly rejected');
  }
  
  // Test 4: Additional properties should fail
  dbg('Test 4: Additional properties validation');
  const extraPropsPayload = { q: 'test', chain: 'pacific-1', extra: 'not allowed' };
  try {
    zodSchema.parse(extraPropsPayload);
    throw new Error('Payload with extra properties should have been rejected');
  } catch (error) {
    if (!error.issues) {
      throw new Error(`Expected ZodError with issues, got: ${error.message}`);
    }
    const hasUnrecognizedKeysError = error.issues.some(issue => 
      issue.code === 'unrecognized_keys'
    );
    
    if (!hasUnrecognizedKeysError) {
      throw new Error('Expected "unrecognized_keys" error for extra properties');
    }
    dbg('✅ Additional properties correctly rejected');
  }
  
  // Test 5: Enum validation
  dbg('Test 5: Enum validation');
  const invalidEnumPayload = { q: 'test', chain: 'invalid-chain' };
  try {
    zodSchema.parse(invalidEnumPayload);
    throw new Error('Payload with invalid enum value should have been rejected');
  } catch (error) {
    if (!error.issues) {
      throw new Error(`Expected ZodError with issues, got: ${error.message}`);
    }
    const hasEnumError = error.issues.some(issue => 
      issue.code === 'invalid_enum_value'
    );
    
    if (!hasEnumError) {
      throw new Error('Expected "invalid_enum_value" error');
    }
    dbg('✅ Invalid enum value correctly rejected');
  }
  
  // Test 6: minLength validation
  dbg('Test 6: minLength validation');
  const shortStringPayload = { q: '', chain: 'pacific-1' };
  try {
    zodSchema.parse(shortStringPayload);
    throw new Error('Payload with string below minLength should have been rejected');
  } catch (error) {
    if (!error.issues) {
      throw new Error(`Expected ZodError with issues, got: ${error.message}`);
    }
    const hasMinLengthError = error.issues.some(issue => 
      issue.code === 'too_small'
    );
    
    if (!hasMinLengthError) {
      throw new Error('Expected "too_small" error for minLength violation');
    }
    dbg('✅ minLength violation correctly rejected');
  }
  
  // Test 7: Handle null/invalid input
  dbg('Test 7: Null/invalid input handling');
  const nullSchema = getZodSchemaFromJsonSchema(null, 'test_tool');
  const undefinedSchema = getZodSchemaFromJsonSchema(undefined, 'test_tool');
  const invalidSchema = getZodSchemaFromJsonSchema('invalid', 'test_tool');
  
  // Should accept empty object
  try {
    nullSchema.parse({});
    undefinedSchema.parse({});
    invalidSchema.parse({});
    dbg('✅ Empty objects accepted for null/invalid schemas');
  } catch (error) {
    throw new Error(`Empty object should be accepted for fallback schemas: ${error.message}`);
  }
  
  // Should reject object with properties (strict mode)
  try {
    nullSchema.parse({ extra: 'prop' });
    throw new Error('Fallback schema should reject extra properties');
  } catch (error) {
    if (!error.issues || !error.issues.some(issue => issue.code === 'unrecognized_keys')) {
      throw new Error('Expected unrecognized_keys error for fallback schema');
    }
    dbg('✅ Extra properties correctly rejected by fallback schemas');
  }
  
  dbg('✅ All Zod schema generation tests passed');
}

// Test the actual bug case that was reported
export const testSearchVerifiedContractsBugCase = async (client) => {
  dbg('Testing the original bug case with search_verified_contracts...');
  
  // This should fail validation because it uses wrong parameter names
  const buggyPayload = {
    resource: 'smart_contract',
    action: 'search_verified_contracts', 
    payload: {
      query: 'AggregatorHelper',  // Wrong! Should be 'q'
      chain_id: 'pacific-1'       // Wrong! Should be 'chain'
    }
  };
  
  try {
    const result = await client.callTool({
      name: 'invoke_resource_action',
      arguments: buggyPayload,
    });
    
    const resultText = (result.content && result.content[0] && result.content[0].text) || '';
    const parsed = JSON.parse(resultText);
    
    // Should contain validation error
    if (!parsed.error || !parsed.error.includes('Invalid arguments')) {
      throw new Error('Expected validation error for wrong parameter names, but got success');
    }
    
    dbg('✅ Bug case correctly rejected with validation error:', parsed.error);
    
  } catch (error) {
    if (error.message.includes('Expected validation error')) {
      throw error;
    }
    // If it's a different error, that's also fine - the important thing is it didn't succeed
    dbg('✅ Bug case correctly failed (with error):', error.message);
  }
  
  // Now test with correct parameters
  dbg('Testing with correct parameters...');
  const correctPayload = {
    resource: 'smart_contract',
    action: 'search_verified_contracts',
    payload: {
      q: 'AggregatorHelper',    // Correct parameter name
      chain: 'pacific-1'        // Correct parameter name  
    }
  };
  
  try {
    const result = await client.callTool({
      name: 'invoke_resource_action',
      arguments: correctPayload,
    });
    
    const resultText = (result.content && result.content[0] && result.content[0].text) || '';
    const parsed = JSON.parse(resultText);
    
    // Should not contain validation error
    if (parsed.error && parsed.error.includes('Invalid arguments')) {
      throw new Error('Correct parameters should not cause validation error');
    }
    
    // Should contain contracts array (even if empty)
    if (!parsed.contracts || !Array.isArray(parsed.contracts)) {
      throw new Error('Expected contracts array in response');
    }
    
    dbg('✅ Correct parameters accepted, got response with contracts array');
    
  } catch (error) {
    throw new Error(`Correct parameters should work: ${error.message}`);
  }
};
