import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { fileURLToPath } from 'url';
import fs from 'fs';
import NodePath from 'path';

import { findAction, findResource, GetSnippetToolArgs, ITopic } from '../base.js';
import { endpointDefinitionMap } from './resources/definition.js';
import {
  camelToSnake,
  controllerNameToToolName,
  getExecutor,
  McpResponse,
  withMcpResponse,
  SNIPPET_GENERATOR_MAP,
  SUPPORTED_SNIPPET_LANGUAGES,
  SUPPORTED_RPC_SNIPPET_LANGUAGES,
  SUPPORTED_GENERAL_SNIPPET_LANGUAGES,
} from '../../utils/index.js';
import { McpGroupedToolDefinition } from '../../types.js';
import { INSIGHTS_API_BASE_URL, securitySchemes } from '../../constants.js';
import { TOPIC_KEY } from './definition.js';
import { RESOLVER_MAP } from './definition.js';

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
  public TOPIC_KEY = TOPIC_KEY;

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
    return !!foundResource.actions[action];
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
    const { resource, action, language, payload } = toolArgs;
    return withMcpResponse<CallToolResult>(async () => {
      const foundAction = findAction(this.getResources(), resource, action!);
      const snippetGen = (foundAction as any).snippetGenerator || 'oas';
      const generator = (SNIPPET_GENERATOR_MAP as any)[snippetGen];
      if (!generator)
        return McpResponse(JSON.stringify({ error: 'SNIPPET_GENERATION_NOT_SUPPORTED' }));

      // If generator is 'oas', load specs and call the function signature used by that generator
      if (snippetGen === 'oas') {
        if (typeof language !== 'string' || !SUPPORTED_SNIPPET_LANGUAGES.includes(language)) {
          return McpResponse(
            JSON.stringify({
              error: `Unsupported or missing language '${language}'. Supported languages: ${SUPPORTED_SNIPPET_LANGUAGES.join(', ')}`,
            })
          );
        }
        const fileName = fileURLToPath(import.meta.url);
        const dirName = NodePath.dirname(fileName);
        const specs = fs
          .readFileSync(NodePath.join(dirName, './resources/api-specs.json'))
          .toString();
        const snippet = generator(foundAction.pathTemplate!, language!, specs);
        return McpResponse(JSON.stringify({ resource, action, language, snippet }));
      }

      // For other generators (e.g., rpc, general), call with common signature
      const supported =
        snippetGen === 'rpc'
          ? SUPPORTED_RPC_SNIPPET_LANGUAGES
          : SUPPORTED_GENERAL_SNIPPET_LANGUAGES;
      if (typeof language !== 'string' || !supported.includes(language as any)) {
        return McpResponse(
          JSON.stringify({
            error: `Unsupported or missing language '${language}'. Supported languages: ${supported.join(', ')}`,
          })
        );
      }
      const snippet = generator(foundAction, action!, language as any, payload as any);
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
   * @param overrideApiKey Optional API key to override the default
   * @returns The result of the tool execution
   */
  public async invokeResourceAction(toolArgs: InsightsToolArgs, overrideApiKey?: string): Promise<CallToolResult> {
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
        baseUrl: INSIGHTS_API_BASE_URL,
        overrideApiKey,
      });

      // Post-process with resolver if defined
      try {
        const resolverId = (foundAction as any).resolver as string | undefined;
        if (!resolverId || !(RESOLVER_MAP as any)[resolverId]) return result;

        const resolver = (RESOLVER_MAP as any)[resolverId] as any;
        // Provide payload to resolver when supported (assets search/detail need it)
        return resolver.length >= 2 ? resolver(result, payload) : resolver(result);
      } catch (_e) {
        console.error('Error occurred while resolving:', _e);
        return result;
      }
    });
  }
}
