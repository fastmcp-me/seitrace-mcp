import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { groupedToolDefinitionMap } from '../openapi-definition.js';

/**
 * List all available resources.
 * @returns A response containing the list of resources.
 */
export const listResourcesHandler = (_: any): CallToolResult => {
  const resources = Array.from(groupedToolDefinitionMap.keys()).sort();
  return { content: [{ type: 'text', text: JSON.stringify({ resources }) }] };
};
