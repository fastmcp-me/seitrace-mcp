import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { ToolArgs } from '../topics/base.js';
import { TOPIC_KEY_MAP } from '../topics/index.js';
import { McpResponse } from '../utils/index.js';

/**
 * Handles the 'getResourceActionSchema' tool request
 * @param toolArgs - The arguments provided to the tool
 * @returns The result of the tool execution
 */
export const getResourceActionSchemaHandler = async (
  toolArgs: ToolArgs
): Promise<CallToolResult> => {
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
  return foundResource.getResourceActionSchema(toolArgs);
};
