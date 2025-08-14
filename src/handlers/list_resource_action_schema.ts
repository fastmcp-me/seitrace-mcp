import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { groupedToolDefinitionMap } from '../openapi-definition.js';

/**
 * Handles the 'list_resource_action_schema' tool request
 * @param toolArgs - The arguments provided to the tool
 * @returns The result of the tool execution
 */
export const listResourceActionSchemaHandler = (toolArgs: any): CallToolResult => {
  const argObj =
    typeof toolArgs === 'object' && toolArgs !== null ? (toolArgs as Record<string, any>) : {};
  const resource: string | undefined = argObj.resource;
  const action: string | undefined = argObj.action;
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
  if (!action) {
    return { content: [{ type: 'text', text: `Missing action for resource '${resource}'.` }] };
  }
  const grouped = groupedToolDefinitionMap.get(resource)!;
  if (!grouped.actions[action]) {
    const available = Object.keys(grouped.actions).sort();
    return {
      content: [
        {
          type: 'text',
          text: `Unknown action '${action}' for resource '${resource}'. Available actions: ${available.join(
            ', '
          )}`,
        },
      ],
    };
  }
  const schema = grouped.actions[action].inputSchema;
  return { content: [{ type: 'text', text: JSON.stringify({ resource, action, schema }) }] };
};
