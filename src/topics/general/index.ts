import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { findAction, findResource, GetSnippetToolArgs, ITopic } from '../base.js';
import { endpointDefinitionMap } from './resources/openapi-definition.js';
import {
  camelToSnake,
  controllerNameToToolName,
  executeApiTool,
  McpResponse,
  withMcpResponse,
} from '../../utils.js';
import { McpGroupedToolDefinition } from '../../types.js';

export interface GeneralToolArgs extends GetSnippetToolArgs {}

/**
 * General topic providing utility resources not tied to Insights controllers.
 *
 * Resource naming: `${TOPIC_KEY}_${controllerName}` -> `general_faucet`.
 * Only one action is present: `request_faucet`.
 */
export class GeneralTopic implements ITopic<GeneralToolArgs> {
  public TOPIC_KEY = 'general';
  private resources: Map<string, McpGroupedToolDefinition>;

  /**
   * Construct the General topic and build its resource/action map.
   * Currently wires a single resource `general_faucet` with action `request_faucet`.
   */
  constructor() {
    // Build resource map from our endpoint definitions. This mirrors the
    // Insights topic strategy so handlers can treat topics uniformly.
    const map = new Map<string, McpGroupedToolDefinition>();

    for (const [fullName, def] of endpointDefinitionMap.entries()) {
      const [controllerPart, actionCamel = ''] = fullName.split('-');
      // faucet_controller -> general_faucet
      const resourceName = `${this.TOPIC_KEY}_${controllerNameToToolName(controllerPart)}`;
      const actionName = camelToSnake(actionCamel);

      if (!map.has(resourceName)) {
        map.set(resourceName, { name: resourceName, actions: {} });
      }
      const grouped = map.get(resourceName)!;
      grouped.actions[actionName] = def;
    }

    this.resources = map;
  }

  /**
   * Check whether a given resource has an action.
   * @param resource Full resource name (e.g., `general_faucet`).
   * @param action Action name (e.g., `request_faucet`).
   * @returns True if the action exists on the resource; otherwise false.
   */
  public hasResourceAction(resource: string, action: string): boolean {
    if (!resource || !action) return false;
    const foundResource = findResource(this.getResources(), resource);
    return Object.prototype.hasOwnProperty.call(foundResource.actions, action);
  }

  /**
   * Get the resource map for this topic.
   * @returns Map keyed by resource name with grouped tool definitions.
   */
  public getResources(): Map<string, McpGroupedToolDefinition> {
    return this.resources;
  }

  /**
   * Return the JSON Schema for a specific resource action.
   * @param toolArgs Object containing `resource` and `action`.
   * @returns MCP text content with `{ resource, action, schema }` JSON.
   */
  public getResourceActionSchema(toolArgs: GeneralToolArgs): Promise<CallToolResult> {
    const { resource, action } = toolArgs;
    return withMcpResponse<CallToolResult>(async () => {
      const foundAction = findAction(this.getResources(), resource, action!);
      const schema = foundAction.inputSchema;
      return McpResponse(JSON.stringify({ resource, action, schema }));
    });
  }

  /**
   * Generate a code snippet for invoking a resource action.
   * Falls back to a cURL snippet for POST faucet if generic generator is unsuitable.
   * @param toolArgs Object containing `resource`, `action`, and `language`.
   * @returns MCP text content with `{ resource, action, language, snippet }` JSON.
   */
  public getResourceActionSnippet(_: GeneralToolArgs) {
    return McpResponse('SNIPPET_GENERATION_NOT_SUPPORTED');
  }

  /**
   * List resources for this topic only.
   * @returns MCP text content with `{ resources }` JSON.
   */
  public listResource(): Promise<CallToolResult> | CallToolResult {
    return withMcpResponse<CallToolResult>(async () => {
      const resources = Array.from(this.getResources().keys()).sort();
      return McpResponse(JSON.stringify({ resources }));
    });
  }

  /**
   * List actions available on a specific resource.
   * @param toolArgs Object containing `resource`.
   * @returns MCP text content with `{ resource, actions: [{ name, description }] }` JSON.
   */
  public listResourceActions(toolArgs: GeneralToolArgs) {
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
   * Invoke a resource action with a validated payload.
   * @param toolArgs Object containing `resource`, `action`, and `payload`.
   * @returns MCP text content with formatted API response or an error message.
   */
  public async invokeResourceAction(toolArgs: GeneralToolArgs): Promise<CallToolResult> {
    const { resource, action, payload } = toolArgs;
    return withMcpResponse<CallToolResult>(async () => {
      const foundAction = findAction(this.getResources(), resource, action!);
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return McpResponse(
          `Invalid or missing 'payload' for tool 'invokeResourceAction'. Provide an object matching the action schema.`
        );
      }
      return await executeApiTool(`${resource}.${action}`, foundAction, payload);
    });
  }
}
