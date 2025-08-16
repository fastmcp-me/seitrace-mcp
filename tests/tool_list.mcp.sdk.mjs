import { dbg } from './utils.mjs';

/**
 * Test the tool list endpoint
 * @param {*} client
 */
export const testToolList = async (client) => {
  const toolsRes = await client.listTools();
  // dbg('List tools response:', JSON.stringify(toolsRes));
  if (!Array.isArray(toolsRes.tools)) throw new Error('tools/list did not return an array');

  const names = toolsRes.tools.map((t) => t.name);
  // Exactly five resource tools should be advertised (snake_case)
  const expectedTools = [
    'list_resources',
    'list_resource_actions',
    'get_resource_action_schema',
    'invoke_resource_action',
    'get_resource_action_snippet',
  ];
  for (const t of expectedTools) if (!names.includes(t)) throw new Error(`Missing tool: ${t}`);
  if (toolsRes.tools.length !== 5)
    throw new Error('Exactly five resource tools should be advertised');

  // Root tool schema should expose method enum and language enum
  // Check each tool schema is minimal and as expected
  const listResource = toolsRes.tools.find((t) => t.name === 'list_resources');
  if (!listResource || listResource.inputSchema.required?.length)
    throw new Error('list_resources should require no args');
  const listActions = toolsRes.tools.find((t) => t.name === 'list_resource_actions');
  if (!listActions?.inputSchema?.required?.includes('resource'))
    throw new Error('list_resource_actions must require resource');
  const listSchema = toolsRes.tools.find((t) => t.name === 'get_resource_action_schema');
  if (
    !listSchema?.inputSchema?.required?.includes('resource') ||
    !listSchema?.inputSchema?.required?.includes('action')
  )
    throw new Error('get_resource_action_schema must require resource and action');
  const invoke = toolsRes.tools.find((t) => t.name === 'invoke_resource_action');
  if (
    !invoke?.inputSchema?.required?.includes('resource') ||
    !invoke?.inputSchema?.required?.includes('action') ||
    !invoke?.inputSchema?.required?.includes('payload')
  )
    throw new Error('invoke_resource_action must require resource, action, payload');
  const snippet = toolsRes.tools.find((t) => t.name === 'get_resource_action_snippet');
  if (
    !snippet?.inputSchema?.required?.includes('resource') ||
    !snippet?.inputSchema?.required?.includes('action') ||
    !snippet?.inputSchema?.required?.includes('language')
  )
    throw new Error('get_resource_action_snippet must require resource, action, language');

  // Root tool basic flow
  const rootList = await client.callTool({ name: 'list_resources', arguments: {} });
  const rootListText = (rootList.content && rootList.content[0] && rootList.content[0].text) || '';
  let rootParsed;
  try {
    rootParsed = JSON.parse(rootListText);
  } catch {
    throw new Error('list_resources did not return JSON');
  }
  if (!Array.isArray(rootParsed.resources) || !rootParsed.resources.length) {
    throw new Error('list_resources did not return resources');
  }
  // Ensure resource list includes typical resources
  const expectedControllers = [
    'insights_address',
    'insights_erc20',
    'insights_erc721',
    'insights_native',
    'general_faucet',
    'general_rpc',
  ];
  const missing = expectedControllers.filter((n) => !rootParsed.resources.includes(n));
  if (missing.length) throw new Error(`Missing resources: ${missing.join(', ')}`);
};
