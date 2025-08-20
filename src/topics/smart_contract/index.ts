import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { findAction, findResource, GetSnippetToolArgs, ITopic } from '../base.js';
import { endpointDefinitionMap, RESOLVER_MAP, TOPIC_KEY } from './definition.js';
import {
  camelToSnake,
  controllerNameToToolName,
  getExecutor,
  McpResponse,
  withMcpResponse,
} from '../../utils/index.js';
import { McpGroupedToolDefinition } from '../../types.js';
import { GATEWAY_API_BASE_URLS } from '../../constants.js';

/**
 * Arguments for smart contract topic tools.
 */
export interface SmartContractToolArgs extends GetSnippetToolArgs {}

/**
 * Smart Contract topic providing smart contract data retrieval resources.
 *
 * Resource naming: `${TOPIC_KEY}_${controllerName}` -> `smart_contract_contract`.
 * Action: `download_abi`.
 */
export class SmartContractTopic implements ITopic<SmartContractToolArgs> {
  public TOPIC_KEY = TOPIC_KEY;
  private resources: Map<string, McpGroupedToolDefinition>;

  /**
   * Construct the Smart Contract topic and build its resource/action map.
   * Currently wires a single resource `smart_contract_contract` with action `download_abi`.
   */
  constructor() {
    // Build resource map from our endpoint definitions. This mirrors the
    // general and insights topic strategy so handlers can treat topics uniformly.
    const map = new Map<string, McpGroupedToolDefinition>();

    for (const [fullName, def] of endpointDefinitionMap.entries()) {
      const [controllerPart, actionCamel = ''] = (fullName as string).split('-');

      const resourceName = `${this.TOPIC_KEY}${controllerNameToToolName(controllerPart) ? `_${controllerNameToToolName(controllerPart)}` : ''}`;
      const actionName = camelToSnake(actionCamel);

      if (!map.has(resourceName)) {
        map.set(resourceName, { name: resourceName, actions: {} });
      }
      const grouped = map.get(resourceName)!;
      grouped.actions[actionName] = def as any;
    }

    this.resources = map;
  }

  /**
   * Check whether a given resource has an action.
   * @param resource Full resource name (e.g., `smart_contract_contract`).
   * @param action Action name (e.g., `download_abi`).
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
  public getResourceActionSchema(toolArgs: SmartContractToolArgs): Promise<CallToolResult> {
    const { resource, action } = toolArgs;
    return withMcpResponse<CallToolResult>(async () => {
      const foundAction = findAction(this.getResources(), resource, action!);
      const schema = foundAction.inputSchema;
      return McpResponse(JSON.stringify({ resource, action, schema }));
    });
  }

  /**
   * Generate a code snippet for invoking a resource action.
   * This always returns "SNIPPET_GENERATION_NOT_SUPPORTED" as requested.
   * @param _toolArgs Object containing `resource`, `action`, and `language`.
   * @returns MCP text content indicating snippet generation is not supported.
   */
  public getResourceActionSnippet(_toolArgs: SmartContractToolArgs) {
    return withMcpResponse<CallToolResult>(async () => {
      return McpResponse('SNIPPET_GENERATION_NOT_SUPPORTED');
    });
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
  public listResourceActions(toolArgs: SmartContractToolArgs) {
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
  public async invokeResourceAction(toolArgs: SmartContractToolArgs): Promise<CallToolResult> {
    const { resource, action, payload } = toolArgs;
    return withMcpResponse<CallToolResult>(async () => {
      const foundAction = findAction(this.getResources(), resource, action!);

      // Remote-like executors require a payload validated against schema
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return McpResponse(
          `Invalid or missing 'payload' for tool 'invokeResourceAction'. Provide an object matching the action schema.`
        );
      }

      // Extract chain from payload, default to pacific-1
      const chain = (payload as any).chain || 'pacific-1';
      const baseUrl = GATEWAY_API_BASE_URLS[chain as keyof typeof GATEWAY_API_BASE_URLS];

      if (!baseUrl) {
        return McpResponse(
          `Invalid chain '${chain}'. Supported chains: ${Object.keys(GATEWAY_API_BASE_URLS).join(', ')}`
        );
      }

      const executorFn = getExecutor((foundAction as any).executor);
      const result = await executorFn({
        toolName: `${resource}.${action}`,
        definition: foundAction,
        toolArgs: payload,
        securitySchemes: {}, // No auth required for this API
        baseUrl,
      });

      // Post-process with resolver if defined
      try {
        const resolverId = (foundAction as any).resolver as string | undefined;
        if (!resolverId || !RESOLVER_MAP[resolverId]) return result;

        const resolver = RESOLVER_MAP[resolverId];
        return resolver(result);
      } catch (_e) {
        console.error('Error occurred while resolving:', _e);
        // If resolver fails, return original result
        return result;
      }
    });
  }
}
