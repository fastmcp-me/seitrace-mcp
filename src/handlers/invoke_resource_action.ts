import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosRequestConfig } from 'axios';
import { ZodError } from 'zod';

import { applySecurity } from '../auth.js';
import { API_BASE_URL } from '../constants.js';
import { groupedToolDefinitionMap, securitySchemes } from '../openapi-definition.js';
import { McpToolDefinition, JsonObject } from '../types.js';
import { getZodSchemaFromJsonSchema, formatApiError } from '../utils.js';

/**
 * Handles the 'invoke_resource_action' tool request
 * @param toolArgs The arguments provided to the tool
 * @returns The result of the tool execution
 */
export const invokeResourceActionHandler = async (toolArgs: any): Promise<CallToolResult> => {
  // Implementation for invoking a resource action
  const argObj =
    typeof toolArgs === 'object' && toolArgs !== null ? (toolArgs as Record<string, any>) : {};
  const resource: string | undefined = argObj.resource;
  const action: string | undefined = argObj.action;
  const payload = argObj.payload;
  if (!resource || !groupedToolDefinitionMap.has(resource)) {
    const resources = Array.from(groupedToolDefinitionMap.keys()).sort();
    return {
      content: [
        {
          type: 'text',
          text: `Unknown or missing resource '${resource}'. Available resources: ${resources.join(
            ', '
          )}`,
        },
      ],
    };
  }
  if (!action) {
    return { content: [{ type: 'text', text: `Missing action for resource '${resource}'.` }] };
  }
  const grouped = groupedToolDefinitionMap.get(resource)!;
  const endpointDef = grouped.actions[action];
  if (!endpointDef) {
    const available = Object.keys(grouped.actions).sort();
    return {
      content: [
        {
          type: 'text',
          text: `Unknown action '${action}' for resource '${resource}'. Available actions: ${available.join(
            ', '
          )}`,
        },
      ],
    };
  }
  if (
    payload === undefined ||
    payload === null ||
    typeof payload !== 'object' ||
    Array.isArray(payload)
  ) {
    return {
      content: [
        {
          type: 'text',
          text: `Invalid or missing 'payload' for tool 'invoke_resource_action'. Provide an object matching the action schema.`,
        },
      ],
    };
  }
  return await executeApiTool(`${resource}.${action}`, endpointDef, payload, securitySchemes);
};

/**
 * Executes an API tool with the provided arguments
 *
 * @param toolName Name of the tool to execute
 * @param definition Tool definition
 * @param toolArgs Arguments provided by the user
 * @param allSecuritySchemes Security schemes from the OpenAPI spec
 * @returns Call tool result
 */
export async function executeApiTool(
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
        return { content: [{ type: 'text', text: validationErrorMessage }] };
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            { type: 'text', text: `Internal error during validation setup: ${errorMessage}` },
          ],
        };
      }
    }

    // Prepare URL, query parameters, headers, and request body
    let urlPath = definition.pathTemplate;
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
    if (definition.requestBodyContentType && typeof validatedArgs['requestBody'] !== 'undefined') {
      requestBodyData = validatedArgs['requestBody'];
      headers['content-type'] = definition.requestBodyContentType;
    }

    // Apply security requirements if available
    applySecurity(definition, allSecuritySchemes, headers, queryParams);

    // Prepare the axios request configuration
    const config: AxiosRequestConfig = {
      method: definition.method.toUpperCase(),
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
    return {
      content: [
        {
          type: 'text',
          text: `API Response (Status: ${response.status}):\n${responseText}`,
        },
      ],
    };
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
    return { content: [{ type: 'text', text: errorMessage }] };
  }
}
