import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { McpGroupedToolDefinition } from '../types.js';

/**
 * Arguments for invoking a code snippet tool action
 */
export interface GetSnippetToolArgs extends ToolArgs {
  /**
   * The programming language to use for code snippets
   */
  language?: string;
}

/**
 * Arguments for invoking a resource action
 */
export interface ToolArgs {
  /**
   * The name of the resource to act upon
   */
  resource: string;

  /**
   * The name of the action to perform
   */
  action?: string;

  /**
   * The payload to include in the action
   */
  payload?: any;
}

/**
 * Maps resource names to their definitions.
 */
export type ResourceMap = Map<string, McpGroupedToolDefinition>;

/**
 * Interface for a topic in the system
 */
export interface ITopic<Args extends ToolArgs = ToolArgs> {
  /**
   * The unique key for the topic
   */
  TOPIC_KEY: string;

  /**
   * Checks if a resource has a specific action.
   * @param resource The name of the resource
   * @param action The name of the action
   * @returns True if the resource has the action, false otherwise
   */
  hasResourceAction: (resource: string, action: string) => Promise<boolean> | boolean;

  /**
   * Retrieves the available resources.
   * @returns A list of available resources.
   */
  getResources: () => Promise<ResourceMap> | ResourceMap;

  /**
   * Handles the 'getResourceActionSchema' tool request
   * @param toolArgs The arguments provided to the tool
   * @returns The result of the tool execution
   */
  getResourceActionSchema: (toolArgs: Args) => Promise<CallToolResult> | CallToolResult;

  /**
   * Handles the 'getResourceActionSnippet' tool request
   * @param toolArgs The arguments provided to the tool
   * @returns The result of the tool execution
   */
  getResourceActionSnippet: (toolArgs: Args) => Promise<CallToolResult> | CallToolResult;

  /**
   * Handles the 'invokeResourceAction' tool request
   * @param toolArgs The arguments provided to the tool
   * @param overrideApiKey Optional API key to override the default
   * @returns The result of the tool execution
   */
  invokeResourceAction: (toolArgs: Args, overrideApiKey?: string) => Promise<CallToolResult> | CallToolResult;

  /**
   * Handles the 'listResource' tool request
   * @returns The result of the tool execution
   */
  listResource: () => Promise<CallToolResult> | CallToolResult;

  /**
   * Handles the 'listResourceActions' tool request
   * @param toolArgs The arguments provided to the tool
   * @returns The result of the tool execution
   */
  listResourceActions: (toolArgs: Args) => Promise<CallToolResult> | CallToolResult;
}

/**
 * Finds a resource by name in the resource map.
 * @param resources The resource map to search
 * @param resourceName The name of the resource to find
 * @returns The found resource or an error message
 */
export const findResource = (resources: ResourceMap, resourceName: string) => {
  // Look up the resource by name
  const resource = resources.get(resourceName);

  // If the resource is not found, return an error message
  if (!resource) {
    throw new Error(
      `Unknown or missing resource '${resourceName}'. Available resources: ${Array.from(
        resources.keys()
      ).join(', ')}`
    );
  }

  // If the resource is found, return it
  return resource;
};

/**
 * Finds an action by name in the resource's action map.
 * @param resources The resource map to search
 * @param resourceName The name of the resource to find
 * @param actionName The name of the action to find
 * @returns The found action or an error message
 */
export const findAction = (resources: ResourceMap, resourceName: string, actionName: string) => {
  // Find the resource
  const resource = findResource(resources, resourceName);

  // Find the action
  const action = resource.actions[actionName];
  if (!action) {
    throw new Error(`Unknown or missing action '${actionName}' for resource '${resourceName}'.`);
  }

  // Return the found action
  return action;
};
