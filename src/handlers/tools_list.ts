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
      'List available resources for Sei blockchain analysis (e.g., insights_erc20, insights_erc721, insights_native, insights_erc1155, smart_contract, general). This is the first step - start here to discover available resources.',
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
    description:
      'List available actions for a given resource (step 2). Each action will show a brief description, but you MUST use get_resource_action_schema to see the exact parameter requirements before invoking.',
    inputSchema: {
      type: 'object',
      properties: {
        resource: { type: 'string', description: 'Resource name from list_resources output.' },
      },
      required: ['resource'],
      additionalProperties: false,
      description: 'Provide the resource name.',
    },
  };

  const listResourceActionSchema: Tool = {
    name: GET_RESOURCE_ACTION_SCHEMA_TOOL,
    description:
      'Get the JSON Schema for a specific resource action (step 3 - REQUIRED before invoking). This reveals the exact parameter names, types, and requirements. Always call this before invoke_resource_action.',
    inputSchema: {
      type: 'object',
      properties: {
        resource: { type: 'string' },
        action: { type: 'string' },
      },
      required: ['resource', 'action'],
      additionalProperties: false,
      description: 'Provide resource and action from previous steps.',
    },
  };

  const invokeResourceAction: Tool = {
    name: INVOKE_RESOURCE_ACTION_TOOL,
    description:
      'Invoke a resource action with the exact payload structure (step 4 - final step). IMPORTANT: You must first call get_resource_action_schema to determine the correct payload structure. Parameter names from action descriptions may differ from actual schema requirements.',
    inputSchema: {
      type: 'object',
      properties: {
        resource: { type: 'string' },
        action: { type: 'string' },
        payload: { type: 'object', additionalProperties: true },
      },
      required: ['resource', 'action', 'payload'],
      additionalProperties: false,
      description:
        'Provide resource, action, and payload object matching the schema from get_resource_action_schema.',
    },
  };

  const listResourceActionSnippet: Tool = {
    name: GET_RESOURCE_ACTION_SNIPPET_TOOL,
    description:
      'Generate a code snippet to perform a resource action in the specified language (optional tool for developers). Shows how to call the action with the required parameters. Useful for integrating Seitrace API calls into your own applications.',
    inputSchema: {
      type: 'object',
      properties: {
        resource: { type: 'string' },
        action: { type: 'string' },
        language: { type: 'string' },
        payload: {
          type: 'object',
          additionalProperties: true,
          description:
            'Optional example payload for snippet generation (e.g., rpc_method, params, endpoint).',
        },
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
