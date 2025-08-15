import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { findAction, findResource, GetSnippetToolArgs, ITopic } from '../base.js';
import { endpointDefinitionMap, securitySchemes } from './resources/openapi-definition.js';
import {
  camelToSnake,
  controllerNameToToolName,
  executeApiTool,
  generateSnippet,
  McpResponse,
  SUPPORTED_SNIPPET_LANGUAGES,
  withMcpResponse,
} from '../../utils.js';
import { McpGroupedToolDefinition } from '../../types.js';
import { INSIGHTS_API_BASE_URL } from '../../constants.js';

/**
 * Arguments for invoking an insights tool action
 */
export interface InsightsToolArgs extends GetSnippetToolArgs {}

/**
 * Insights topic class.
 */
export class InsightsTopic implements ITopic<InsightsToolArgs> {
  /**
   * The unique key for the topic
   */
  public TOPIC_KEY = 'insights';

  /**
   * The map of available resources for the topic
   */
  private resources: Map<string, McpGroupedToolDefinition>;

  /**
   * Constructor for the InsightsTopic class.
s   */
  constructor() {
    const map = new Map<string, McpGroupedToolDefinition>();

    /**
     * Populate the resource map with endpoint definitions.
     */
    for (const [fullName, def] of endpointDefinitionMap.entries()) {
      // fullName format: <ControllerName>-<ActionNameCamel>
      const [controllerPart, actionCamel = ''] = fullName.split('-');
      const resourceName = `${this.TOPIC_KEY}_${controllerNameToToolName(controllerPart)}`;
      const actionName = camelToSnake(actionCamel);

      // Initialize grouped entry if needed
      if (!map.has(resourceName)) {
        map.set(resourceName, {
          name: resourceName,
          actions: {},
        });
      }

      // Add the action definition to the grouped entry
      const grouped = map.get(resourceName)!;
      grouped.actions[actionName] = def;
    }

    this.resources = map;
  }

  /**
   * Checks if a resource has a specific action.
   * @param resource The name of the resource
   * @param action The name of the action
   * @returns True if the resource has the action, false otherwise
   */
  public hasResourceAction(resource: string, action: string): boolean {
    if (!resource || !action) return false;
    const foundResource = findResource(this.getResources(), resource);
    return foundResource.actions.hasOwnProperty(action);
  }

  /**
   * Retrieves the available resources.
   * @returns A list of available resources.
   */
  public getResources(): Map<string, McpGroupedToolDefinition> {
    return this.resources;
  }

  /**
   * Retrieves the action schema for a specific resource.
   * @param toolArgs The arguments provided to the tool
   * @returns The result of the tool execution
   */
  public getResourceActionSchema(toolArgs: InsightsToolArgs): Promise<CallToolResult> {
    const { resource, action } = toolArgs;
    return withMcpResponse<CallToolResult>(async () => {
      const foundAction = findAction(this.getResources(), resource, action!);
      const schema = foundAction.inputSchema;
      return McpResponse(JSON.stringify({ resource, action, schema }));
    });
  }

  /**
   * Retrieves the code snippet for a specific resource action.
   * @param toolArgs The arguments provided to the tool
   * @returns The result of the tool execution
   */
  public getResourceActionSnippet(
    toolArgs: InsightsToolArgs
  ): Promise<CallToolResult> | CallToolResult {
    const { resource, action, language } = toolArgs;
    return withMcpResponse<CallToolResult>(async () => {
      const foundAction = findAction(this.getResources(), resource, action!);
      if (typeof language !== 'string' || !SUPPORTED_SNIPPET_LANGUAGES.includes(language)) {
        return McpResponse(
          `Unsupported or missing language '${language}'. Supported languages: ${SUPPORTED_SNIPPET_LANGUAGES.join(
            ', '
          )}`
        );
      }
      const snippet = generateSnippet(foundAction.pathTemplate!, language!);
      return McpResponse(JSON.stringify({ resource, action, language, snippet }));
    });
  }

  /**
   * Lists all available resources.
   * @returns A list of available resources.
   */
  public listResource(): Promise<CallToolResult> | CallToolResult {
    return withMcpResponse<CallToolResult>(async () => {
      const resources = Array.from(this.getResources().keys()).sort();
      return McpResponse(JSON.stringify({ resources }));
    });
  }

  /**
   * Lists all available actions for a specific resource.
   * @param toolArgs The arguments provided to the tool
   * @returns A list of available actions for the specified resource.
   */
  public listResourceActions(toolArgs: InsightsToolArgs): Promise<CallToolResult> | CallToolResult {
    const { resource } = toolArgs;
    return withMcpResponse<CallToolResult>(async () => {
      const foundResource = findResource(this.getResources(), resource);
      const actions = Object.entries(foundResource.actions)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, def]) => ({ name, description: (def.description || '').trim() }));
      return McpResponse(JSON.stringify({ resource, actions }));
    });
  }

  /**
   * Handles the 'invokeResourceAction' tool request
   * @param toolArgs The arguments provided to the tool
   * @returns The result of the tool execution
   */
  public async invokeResourceAction(toolArgs: InsightsToolArgs): Promise<CallToolResult> {
    const { resource, action, payload } = toolArgs;

    return withMcpResponse<CallToolResult>(async () => {
      const foundAction = findAction(this.getResources(), resource, action!);

      /**
       * Validate the payload against the action schema
       */
      if (
        payload === undefined ||
        payload === null ||
        typeof payload !== 'object' ||
        Array.isArray(payload)
      ) {
        return McpResponse(
          `Invalid or missing 'payload' for tool 'invokeResourceAction'. Provide an object matching the action schema.`
        );
      }

      // Return the result of the API tool execution
      return await executeApiTool(
        `${resource}.${action}`,
        foundAction,
        payload,
        securitySchemes,
        INSIGHTS_API_BASE_URL
      );
    });
  }
}
