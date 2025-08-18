import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { AVAILABLE_TOPICS, RESOURCE_DESCRIPTION_MAP } from '../topics/index.js';
import { McpResponse } from '../utils/index.js';
import { ToolArgs } from '../topics/base.js';
/**
 * List all available resources.
 * @returns A response containing the list of resources.
 */
export const listResourcesHandler = async (_: ToolArgs): Promise<CallToolResult> => {
  /**
   * List all available resources.
   */
  const allResources = await Promise.all(
    AVAILABLE_TOPICS.map(async (topic) => {
      return await topic.getResources();
    })
  );

  /**
   * Build an enriched list of resources with short, LLM-friendly descriptions.
   * Description strategy:
   * - Provide a concise action summary (comma-separated action names).
   * - For well-known resources, use more direct phrasing.
   */
  const resources = allResources
    .reduce<{ name: string; description: string }[]>((acc, topicResources) => {
      for (const [name, grouped] of topicResources.entries()) {
        const actionNames = Object.keys(grouped.actions).sort();
        let description: string = '';

        description = RESOURCE_DESCRIPTION_MAP[name];

        if (!description) {
          // Generic, context-optimized fallback using action names
          const preview = actionNames.slice(0, 6).join(', ');
          const suffix = actionNames.length > 6 ? ', …' : '';
          description = `Actions: ${preview}${suffix}.`;
        }

        acc.push({ name, description });
      }
      return acc;
    }, [])
    // Ensure stable ordering
    .sort((a, b) => a.name.localeCompare(b.name));

  // Return the list of resources.
  return McpResponse(JSON.stringify({ resources }));
};
