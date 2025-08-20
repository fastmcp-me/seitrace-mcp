import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { TOPIC_KEY_MAP } from '../topics/index.js';
import { ToolArgs } from '../topics/base.js';
import { McpResponse } from '../utils/index.js';

/**
 * List actions for a specific resource
 * @param toolArgs - The arguments for the tool
 * @returns A list of actions for the specified resource
 */
export const listResourceActionsHandler = async (toolArgs: ToolArgs): Promise<CallToolResult> => {
  const { resource } = toolArgs;
  const topicKey = resource.split('_')[0];
  const foundResource = TOPIC_KEY_MAP[topicKey] || TOPIC_KEY_MAP[resource];

  /**
   * Check if the resource exists
   */
  if (!foundResource || !(await foundResource.getResources()).has(resource)) {
    return McpResponse(`Unknown or missing resource '${resource}'.`);
  }

  /**
   * List actions for the resource
   */
  return foundResource.listResourceActions(toolArgs);
};
