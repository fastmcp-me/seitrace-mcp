/**
 * Server configuration
 */
export const SERVER_NAME = 'seitrace-insights';
export const SERVER_VERSION = '1.0';
export const INSIGHTS_API_BASE_URL = 'https://seitrace.com/insights';
// Base URL used by the 'general' topic (e.g., faucet). This points to the workspace dev API.
export const GENERAL_API_BASE_URL = 'https://workspace-api.seitrace.com';

/**
 * Tool names
 */
export const LIST_RESOURCES_TOOL = 'list_resources';
export const LIST_RESOURCE_ACTIONS_TOOL = 'list_resource_actions';
export const INVOKE_RESOURCE_ACTION_TOOL = 'invoke_resource_action';
export const GET_RESOURCE_ACTION_SNIPPET_TOOL = 'get_resource_action_snippet';
export const GET_RESOURCE_ACTION_SCHEMA_TOOL = 'get_resource_action_schema';

/**
 * Security schemes for general topic (API Key via x-api-key header)
 * Handlers will call `applySecurity(...)` to inject this header when
 * an environment variable SECRET_APIKEY is present.
 */
export const securitySchemes = {
  apiKey: {
    type: 'apiKey',
    in: 'header',
    name: 'x-api-key',
  },
};
