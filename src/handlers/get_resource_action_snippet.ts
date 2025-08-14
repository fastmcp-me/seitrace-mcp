import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { SUPPORTED_SNIPPET_LANGUAGES, generateSnippet } from '../utils.js';
import { groupedToolDefinitionMap } from '../openapi-definition.js';

/**
 * Handles the 'get_resource_action_snippet' tool request
 * @param toolArgs The arguments provided to the tool
 * @returns The result of the tool execution
 */
export const getResourceActionSnippetHandler = (toolArgs: any): CallToolResult => {
  const argObj =
    typeof toolArgs === 'object' && toolArgs !== null ? (toolArgs as Record<string, any>) : {};
  const resource: string | undefined = argObj.resource;
  const action: string | undefined = argObj.action;
  const language: string | undefined = argObj.language;
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
  const endpointDef = grouped.actions[action];
  if (!endpointDef) {
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
  if (typeof language !== 'string' || !SUPPORTED_SNIPPET_LANGUAGES.includes(language)) {
    return {
      content: [
        {
          type: 'text',
          text: `Unsupported or missing language '${language}'. Supported languages: ${SUPPORTED_SNIPPET_LANGUAGES.join(
            ', '
          )}`,
        },
      ],
    };
  }
  const path = endpointDef.pathTemplate;
  try {
    const snippet = generateSnippet(path, language);
    return {
      content: [{ type: 'text', text: JSON.stringify({ resource, action, language, snippet }) }],
    };
  } catch (e: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Failed to generate snippet for ${resource}.${action} in '${language}': ${
            e?.message || String(e)
          }`,
        },
      ],
    };
  }
};
