import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { AVAILABLE_TOPICS } from '../topics/index.js';
import { McpResponse } from '../utils/index.js';

/**
 * List all available resources.
 * @returns A response containing the list of resources.
 */
export const listResourcesHandler = async (_: any): Promise<CallToolResult> => {
  /**
   * List all available resources.
   */
  const allResources = await Promise.all(
    AVAILABLE_TOPICS.map(async (topic) => {
      return await topic.getResources();
    })
  );

  /**
   * Flatten the array of resources.
   */
  const resources = allResources.reduce<string[]>((acc, topicResources) => {
    return acc.concat(Array.from(topicResources.keys()));
  }, []);

  // Return the list of resources.
  return McpResponse(JSON.stringify({ resources }));
};
