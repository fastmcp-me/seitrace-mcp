import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { SUPPORTED_SNIPPET_LANGUAGES } from '../utils.js';

/**
 * Tool list handler
 * @returns List of available tools
 */
export const toolListHandler = () => {
  const listResource: Tool = {
    name: 'list_resources',
    description: 'List available resources (e.g., erc20, erc721, native).',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false,
      description: 'No arguments required.',
    },
  };

  const listResourceActions: Tool = {
    name: 'list_resource_actions',
    description: 'List actions for a given resource.',
    inputSchema: {
      type: 'object',
      properties: {
        resource: { type: 'string', description: 'Resource name.' },
      },
      required: ['resource'],
      additionalProperties: false,
      description: 'Provide the resource name.',
    },
  };

  const listResourceActionSchema: Tool = {
    name: 'list_resource_action_schema',
    description: 'Get the JSON Schema for a specific resource action.',
    inputSchema: {
      type: 'object',
      properties: {
        resource: { type: 'string' },
        action: { type: 'string' },
      },
      required: ['resource', 'action'],
      additionalProperties: false,
      description: 'Provide resource and action.',
    },
  };

  const invokeResourceAction: Tool = {
    name: 'invoke_resource_action',
    description: 'Invoke a resource action with a payload matching its schema.',
    inputSchema: {
      type: 'object',
      properties: {
        resource: { type: 'string' },
        action: { type: 'string' },
        payload: { type: 'object', additionalProperties: true },
      },
      required: ['resource', 'action', 'payload'],
      additionalProperties: false,
      description: 'Provide resource, action, and payload object.',
    },
  };

  const listResourceActionSnippet: Tool = {
    name: 'get_resource_action_snippet',
    description: 'Generate a code snippet for a given resource action in the specified language.',
    inputSchema: {
      type: 'object',
      properties: {
        resource: { type: 'string' },
        action: { type: 'string' },
        language: { type: 'string' },
      },
      required: ['resource', 'action', 'language'],
      additionalProperties: false,
      description: `Provide resource, action, and target language. Supported languages: ${SUPPORTED_SNIPPET_LANGUAGES.join(
        ', '
      )}`,
    },
  };

  return {
    tools: [
      listResource,
      listResourceActions,
      listResourceActionSchema,
      invokeResourceAction,
      listResourceActionSnippet,
    ],
  };
};
