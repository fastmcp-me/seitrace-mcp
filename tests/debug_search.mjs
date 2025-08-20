#!/usr/bin/env node
import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function main() {
  const fileName = fileURLToPath(import.meta.url);
  const dirName = path.dirname(fileName);
  const projectRoot = path.resolve(dirName, '..');
  const serverBin = path.join(projectRoot, 'build', 'index.js');

  const client = new Client({ name: 'e2e-runner', version: '0.0.0' }, { capabilities: {} });
  const childEnv = { ...process.env };
  const transport = new StdioClientTransport({ command: 'node', args: [serverBin], env: childEnv });
  await client.connect(transport);

  try {
    console.log('Testing smart contract search...');
    
    // List actions to see if search_verified_contracts exists
    const actions = await client.callTool({
      name: 'list_resource_actions',
      arguments: { resource: 'smart_contract' },
    });
    
    const actionsText = (actions.content && actions.content[0] && actions.content[0].text) || '';
    console.log('Available actions:', actionsText);
    
    const actionsParsed = JSON.parse(actionsText);
    const hasSearch = actionsParsed.actions.find(a => a.name === 'search_verified_contracts');
    
    if (!hasSearch) {
      throw new Error('search_verified_contracts action not found');
    }
    
    console.log('✓ search_verified_contracts action found');
    
    // Test search functionality
    const searchRes = await client.callTool({
      name: 'invoke_resource_action',
      arguments: {
        resource: 'smart_contract',
        action: 'search_verified_contracts',
        payload: {
          q: 'GG',
          chain: 'pacific-1'
        }
      },
    });
    
    const searchText = (searchRes.content && searchRes.content[0] && searchRes.content[0].text) || '';
    console.log('Search response:', searchText);
    
    const searchResult = JSON.parse(searchText);
    console.log('Search result keys:', Object.keys(searchResult));
    
    if ('contracts' in searchResult) {
      console.log('✓ Response contains contracts array');
      console.log('Number of contracts found:', searchResult.contracts.length);
      
      if (searchResult.contracts.length > 0) {
        console.log('First contract fields:', Object.keys(searchResult.contracts[0]));
        console.log('First contract:', searchResult.contracts[0]);
      }
    } else {
      console.log('⚠ Response does not contain contracts array');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('✗ Test failed:', err?.message || err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main().catch(console.error);
