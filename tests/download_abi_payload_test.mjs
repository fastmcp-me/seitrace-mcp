#!/usr/bin/env node

/* global console, process */

/**
 * Standalone test script to verify download_abi action behavior
 * Tests the exact payload format requested and validates abi-only response
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testDownloadAbiPayload() {
  console.log('🧪 Testing download_abi with specific payload...\n');

  const fileName = fileURLToPath(import.meta.url);
  const dirName = path.dirname(fileName);
  const projectRoot = path.resolve(dirName, '..');
  const serverBin = path.join(projectRoot, 'build', 'index.js');

  const client = new Client({ name: 'download-abi-test', version: '0.0.0' }, { capabilities: {} });
  const childEnv = { ...process.env };
  const transport = new StdioClientTransport({ command: 'node', args: [serverBin], env: childEnv });
  
  try {
    await client.connect(transport);

    console.log('📋 Testing exact payload:');
    const testPayload = {
      "resource": "smart_contract",
      "action": "download_abi",
      "payload": {
        "contract_address": "0x8d72Fa8b37F8A97CC0cE5Ee4077806e3b63dE9d0",
        "chain": "pacific-1"
      }
    };
    console.log(JSON.stringify(testPayload, null, 2));

    console.log('\n🚀 Making API call...');
    const result = await client.callTool({
      name: 'invoke_resource_action',
      arguments: testPayload
    });

    const response = JSON.parse(result.content[0].text);
    
    console.log('\n📊 Response Analysis:');
    console.log(`✓ Response keys: [${Object.keys(response).join(', ')}]`);
    console.log(`✓ Has only "abi" field: ${Object.keys(response).length === 1 && 'abi' in response}`);
    console.log(`✓ ABI is array: ${Array.isArray(response.abi)}`);
    console.log(`✓ ABI entries count: ${response.abi?.length || 0}`);

    if (response.error) {
      console.log('❌ Unexpected error:', response.error);
      return false;
    }

    // Verify ONLY "abi" field exists
    if (Object.keys(response).length !== 1 || Object.keys(response)[0] !== 'abi') {
      console.log('❌ Response should contain ONLY "abi" field');
      return false;
    }

    // Verify no other contract metadata fields
    const forbiddenFields = [
      'source_code', 'name', 'compiler_version', 'optimization_enabled', 
      'is_verified', 'deployed_bytecode', 'constructor_args', 'license_type',
      'creation_bytecode', 'additional_sources', 'certified'
    ];

    for (const field of forbiddenFields) {
      if (field in response) {
        console.log(`❌ Found forbidden field: ${field}`);
        return false;
      }
    }

    // Show sample ABI entries
    console.log('\n📄 Sample ABI entries:');
    const functions = response.abi.filter(item => item.type === 'function').slice(0, 3);
    functions.forEach(func => {
      console.log(`  - ${func.name}() [${func.stateMutability}]`);
    });

    console.log('\n✅ Test PASSED!');
    console.log('   ✓ Response contains only "abi" field');
    console.log('   ✓ No contract metadata leaked');
    console.log('   ✓ ABI is properly formatted array');
    
    return true;

  } catch (error) {
    console.log('❌ Test FAILED:', error.message);
    return false;
  } finally {
    await client.close();
  }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testDownloadAbiPayload()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Test error:', error);
      process.exit(1);
    });
}

export { testDownloadAbiPayload };
