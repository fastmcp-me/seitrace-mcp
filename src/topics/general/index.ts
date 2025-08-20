import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { findAction, findResource, GetSnippetToolArgs, ITopic } from '../base.js';
import { endpointDefinitionMap, RESOLVER_MAP, TOPIC_KEY } from './definition.js';
import {
  camelToSnake,
  controllerNameToToolName,
  getExecutor,
  McpResponse,
  withMcpResponse,
  SNIPPET_GENERATOR_MAP,
  SUPPORTED_RPC_SNIPPET_LANGUAGES,
  SUPPORTED_GENERAL_SNIPPET_LANGUAGES,
} from '../../utils/index.js';
import { McpGroupedToolDefinition } from '../../types.js';
import { GENERAL_API_BASE_URL, securitySchemes } from '../../constants.js';
/**
 * Arguments for general topic tools.
 */
export interface GeneralToolArgs extends GetSnippetToolArgs {}

/**
 * General topic providing utility resources not tied to Insights controllers.
 *
 * Resource naming: `${TOPIC_KEY}_${controllerName}` -> `general_faucet`.
 * Only one action is present: `request_faucet`.
 */
export class GeneralTopic implements ITopic<GeneralToolArgs> {
  public TOPIC_KEY = TOPIC_KEY;
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
  public getResourceActionSnippet(toolArgs: GeneralToolArgs) {
    const { resource, action, language, payload } = toolArgs;
    return withMcpResponse<CallToolResult>(async () => {
      const foundAction = findAction(this.getResources(), resource, action!);
      // Language validation is handled per generator below

      const snippetGen = (foundAction as any).snippetGenerator;
      if (!snippetGen) return McpResponse('SNIPPET_GENERATION_NOT_SUPPORTED');

      // rpc/general generators use a common signature
      const generator = (SNIPPET_GENERATOR_MAP as any)[snippetGen];
      if (!generator) return McpResponse('SNIPPET_GENERATION_NOT_SUPPORTED');
      const supported =
        snippetGen === 'rpc'
          ? SUPPORTED_RPC_SNIPPET_LANGUAGES
          : SUPPORTED_GENERAL_SNIPPET_LANGUAGES;
      if (typeof language !== 'string' || !supported.includes(language as any)) {
        return McpResponse(
          `Unsupported or missing language '${language}'. Supported languages: ${supported.join(
            ', '
          )}`
        );
      }
      const snippet = generator(foundAction as any, action!, language as any, payload as any);
      return McpResponse(JSON.stringify({ resource, action, language, snippet }));
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

      // Decide execution path using executor field
      if (foundAction.executor === null && (foundAction as any).staticResponse) {
        return McpResponse(JSON.stringify((foundAction as any).staticResponse));
      }

      // Remote-like executors require a payload validated against schema
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return McpResponse(
          JSON.stringify({
            error: `Invalid or missing 'payload' for tool 'invokeResourceAction'. Provide an object matching the action schema.`,
          })
        );
      }

      const executorFn = getExecutor((foundAction as any).executor);
      const result = await executorFn({
        toolName: `${resource}.${action}`,
        definition: foundAction,
        toolArgs: payload,
        securitySchemes,
        baseUrl: GENERAL_API_BASE_URL,
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
