import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { groupedToolDefinitionMap } from '../openapi-definition.js';

/**
 * List actions for a specific resource
 * @param toolArgs - The arguments for the tool
 * @returns A list of actions for the specified resource
 */
export const listResourceActionsHandler = (toolArgs: any): CallToolResult => {
  const argObj =
    typeof toolArgs === 'object' && toolArgs !== null ? (toolArgs as Record<string, any>) : {};
  const resource: string | undefined = argObj.resource;
  if (!resource || !groupedToolDefinitionMap.has(resource)) {
    const resources = Array.from(groupedToolDefinitionMap.keys()).sort();
    return {
      content: [
        {
          type: 'text',
          text: `Unknown or missing resource '${resource}'. Available resources: ${resources.join(
            ', '
          )}`,
        },
      ],
    };
  }
  const grouped = groupedToolDefinitionMap.get(resource)!;
  const actions = Object.entries(grouped.actions)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, def]) => ({ name, description: (def.description || '').trim() }));
  return { content: [{ type: 'text', text: JSON.stringify({ resource, actions }) }] };
};
