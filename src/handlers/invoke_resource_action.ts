import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { ToolArgs } from '../topics/base.js';
import { TOPIC_KEY_MAP } from '../topics/index.js';
import { McpResponse } from '../utils.js';

/**
 * Handles the 'invokeResourceAction' tool request
 * @param toolArgs The arguments provided to the tool
 * @returns The result of the tool execution
 */
export const invokeResourceActionHandler = async (toolArgs: ToolArgs): Promise<CallToolResult> => {
  const { resource, action } = toolArgs;
  const topicKey = resource.split('_')[0];
  const foundResource = TOPIC_KEY_MAP[topicKey];

  /**
   * Check if the resource exists
   */
  if (
    !foundResource ||
    !(await foundResource.getResources()).has(resource) ||
    !(await foundResource.hasResourceAction(resource, action!))
  ) {
    return McpResponse(
      `Unknown or missing resource action '${action!}' for resource '${resource}'.`
    );
  }

  /**
   * List actions for the resource
   */
  return foundResource.invokeResourceAction(toolArgs);
};
