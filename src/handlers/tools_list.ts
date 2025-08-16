import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { SUPPORTED_SNIPPET_LANGUAGES } from '../utils/index.js';
import {
  GET_RESOURCE_ACTION_SNIPPET_TOOL,
  INVOKE_RESOURCE_ACTION_TOOL,
  GET_RESOURCE_ACTION_SCHEMA_TOOL,
  LIST_RESOURCE_ACTIONS_TOOL,
  LIST_RESOURCES_TOOL,
} from '../constants.js';

/**
 * Tool list handler
 * @returns List of available tools
 */
export const toolListHandler = () => {
  const listResource: Tool = {
    name: LIST_RESOURCES_TOOL,
    description:
      'List available resources (e.g., insights_erc20, insights_erc721, insights_native).',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false,
      description: 'No arguments required.',
    },
  };

  const listResourceActions: Tool = {
    name: LIST_RESOURCE_ACTIONS_TOOL,
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
    name: GET_RESOURCE_ACTION_SCHEMA_TOOL,
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
    name: INVOKE_RESOURCE_ACTION_TOOL,
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
    name: GET_RESOURCE_ACTION_SNIPPET_TOOL,
    description:
      'Generate a code snippet to perform a resource action in the specified language. For example, a JavaScript snippet to call the action with the required parameters.',
    inputSchema: {
      type: 'object',
      properties: {
        resource: { type: 'string' },
        action: { type: 'string' },
        language: { type: 'string' },
  payload: { type: 'object', additionalProperties: true, description: 'Optional example payload for snippet generation (e.g., rpc_method, params, endpoint).' },
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
