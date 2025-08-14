import {
  GET_RESOURCE_ACTION_SNIPPET_TOOL,
  INVOKE_RESOURCE_ACTION_TOOL,
  LIST_RESOURCE_ACTION_SCHEMA_TOOL,
  LIST_RESOURCE_ACTIONS_TOOL,
  LIST_RESOURCES_TOOL,
} from '../constants.js';
import { getResourceActionSnippetHandler } from './get_resource_action_snippet.js';
import { invokeResourceActionHandler } from './invoke_resource_action.js';
import { listResourceActionSchemaHandler } from './list_resource_action_schema.js';
import { listResourceActionsHandler } from './list_resource_actions.js';
import { listResourcesHandler } from './list_resources.js';

/**
 * Map of tool names to their handlers
 */
export const handlerMap = {
  [LIST_RESOURCES_TOOL]: listResourcesHandler,
  [LIST_RESOURCE_ACTIONS_TOOL]: listResourceActionsHandler,
  [LIST_RESOURCE_ACTION_SCHEMA_TOOL]: listResourceActionSchemaHandler,
  [GET_RESOURCE_ACTION_SNIPPET_TOOL]: getResourceActionSnippetHandler,
  [INVOKE_RESOURCE_ACTION_TOOL]: invokeResourceActionHandler,
};

export { toolListHandler } from './tools_list.js';
