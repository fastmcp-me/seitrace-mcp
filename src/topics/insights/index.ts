import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosRequestConfig } from 'axios';
import { ZodError } from 'zod';

import { findAction, findResource, GetSnippetToolArgs, ITopic, ToolArgs } from '../base.js';
import { endpointDefinitionMap, securitySchemes } from './resources/openapi-definition.js';
import {
  camelToSnake,
  controllerNameToToolName,
  formatApiError,
  generateSnippet,
  getZodSchemaFromJsonSchema,
  McpResponse,
  SUPPORTED_SNIPPET_LANGUAGES,
  withMcpResponse,
} from '../../utils.js';
import { applySecurity } from '../../auth.js';
import { API_BASE_URL } from '../../constants.js';
import { McpToolDefinition, JsonObject, McpGroupedToolDefinition } from '../../types.js';

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
      return await this.executeApiTool(
        `${resource}.${action}`,
        foundAction,
        payload,
        securitySchemes
      );
    });
  }

  /**
   * Handles the 'invokeResourceAction' tool request
   * @param toolName The name of the tool
   * @param definition The tool definition
   * @param toolArgs The arguments provided to the tool
   * @param allSecuritySchemes All security schemes
   * @returns The result of the tool execution
   */
  private async executeApiTool(
    toolName: string,
    definition: McpToolDefinition,
    toolArgs: JsonObject,
    allSecuritySchemes: Record<string, any>
  ): Promise<CallToolResult> {
    try {
      // Validate arguments against the input schema
      let validatedArgs: JsonObject;
      try {
        const zodSchema = getZodSchemaFromJsonSchema(definition.inputSchema, toolName);
        const argsToParse = typeof toolArgs === 'object' && toolArgs !== null ? toolArgs : {};
        validatedArgs = zodSchema.parse(argsToParse);
      } catch (error: unknown) {
        if (error instanceof ZodError) {
          const validationErrorMessage = `Invalid arguments for tool '${toolName}': ${error.errors
            .map((e) => `${e.path.join('.')} (${e.code}): ${e.message}`)
            .join(', ')}`;
          return McpResponse(validationErrorMessage);
        } else {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return McpResponse(`Internal error during validation setup: ${errorMessage}`);
        }
      }

      // Prepare URL, query parameters, headers, and request body
      let urlPath = definition.pathTemplate!;
      const queryParams: Record<string, any> = {};
      const headers: Record<string, string> = { Accept: 'application/json' };
      let requestBodyData: any = undefined;

      // Apply parameters to the URL path, query, or headers
      definition.executionParameters.forEach((param) => {
        const value = validatedArgs[param.name];
        if (typeof value !== 'undefined' && value !== null) {
          if (param.in === 'path') {
            urlPath = urlPath.replace(`{${param.name}}`, encodeURIComponent(String(value)));
          } else if (param.in === 'query') {
            queryParams[param.name] = value;
          } else if (param.in === 'header') {
            headers[param.name.toLowerCase()] = String(value);
          }
        }
      });

      // Ensure all path parameters are resolved
      if (urlPath.includes('{')) {
        throw new Error(`Failed to resolve path parameters: ${urlPath}`);
      }

      // Construct the full URL
      const requestUrl = API_BASE_URL ? `${API_BASE_URL}${urlPath}` : urlPath;

      // Handle request body if needed
      if (
        definition.requestBodyContentType &&
        typeof validatedArgs['requestBody'] !== 'undefined'
      ) {
        requestBodyData = validatedArgs['requestBody'];
        headers['content-type'] = definition.requestBodyContentType;
      }

      // Apply security requirements if available
      applySecurity(definition, allSecuritySchemes, headers, queryParams);

      // Prepare the axios request configuration
      const config: AxiosRequestConfig = {
        method: definition.method!.toUpperCase(),
        url: requestUrl,
        params: queryParams,
        headers: headers,
        ...(requestBodyData !== undefined && { data: requestBodyData }),
      };

      // Log request info to stderr (doesn't affect MCP output)
      console.error(`Executing tool "${toolName}": ${config.method} ${config.url}`);

      // Execute the request
      const response = await axios(config);

      // Process and format the response
      let responseText = '';
      const contentType = response.headers['content-type']?.toLowerCase() || '';

      // Handle JSON responses
      if (
        contentType.includes('application/json') &&
        typeof response.data === 'object' &&
        response.data !== null
      ) {
        try {
          responseText = JSON.stringify(response.data);
        } catch (e) {
          responseText = '[Stringify Error]';
        }
      }
      // Handle string responses
      else if (typeof response.data === 'string') {
        responseText = response.data;
      }
      // Handle other response types
      else if (response.data !== undefined && response.data !== null) {
        responseText = String(response.data);
      }
      // Handle empty responses
      else {
        responseText = `(Status: ${response.status} - No body content)`;
      }

      // Return formatted response
      return McpResponse(`API Response (Status: ${response.status}):\n${responseText}`);
    } catch (error: unknown) {
      // Handle errors during execution
      let errorMessage: string;

      // Format Axios errors specially
      if (axios.isAxiosError(error)) {
        errorMessage = formatApiError(error);
      }
      // Handle standard errors
      else if (error instanceof Error) {
        errorMessage = error.message;
      }
      // Handle unexpected error types
      else {
        errorMessage = 'Unexpected error: ' + String(error);
      }

      // Log error to stderr
      console.error(`Error during execution of tool '${toolName}':`, errorMessage);

      // Return error message to client
      return McpResponse(errorMessage);
    }
  }
}
