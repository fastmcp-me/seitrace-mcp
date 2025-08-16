import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosRequestConfig } from 'axios';
import { ZodError } from 'zod';

import { applySecurity } from '../../auth.js';
import { McpToolDefinition, JsonObject } from '../../types.js';
import { McpResponse } from '../mcp_response.js';
import { formatApiError } from '../format_api_error.js';
import { getZodSchemaFromJsonSchema } from '../schema.js';

/**
 * Executes an API tool with the given arguments
 * @param toolName The name of the tool to execute
 * @param definition The tool definition
 * @param toolArgs The arguments to pass to the tool
 * @param securitySchemes The security schemes to apply
 * @returns The result of the tool execution
 */
export const executeApiTool = async (
  toolName: string,
  definition: McpToolDefinition,
  toolArgs: JsonObject,
  securitySchemes: any,
  baseUrl: string
): Promise<CallToolResult> => {
  try {
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
        return McpResponse(
          `Internal error during validation setup: ${errorMessage}. Try contact dev@cavies.xyz`
        );
      }
    }

    let urlPath = definition.pathTemplate!;
    const queryParams: Record<string, any> = {};
    const headers: Record<string, string> = { Accept: 'application/json' };
    let requestBodyData: any = undefined;

    // Apply path/query/header parameters if any (faucet has none)
    if (definition.executionParameters) {
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
    }

    if (urlPath.includes('{')) {
      throw new Error(`Failed to resolve path parameters: ${urlPath}`);
    }

    const requestUrl = `${baseUrl}${urlPath}`;

    // For POST faucet, send validated args as the JSON body.
    if (definition.requestBodyContentType && typeof validatedArgs['requestBody'] !== 'undefined') {
      requestBodyData = validatedArgs['requestBody'];
      headers['content-type'] = definition.requestBodyContentType;
    } else {
      // For faucet, send the payload as the body
      requestBodyData = validatedArgs;
      headers['content-type'] = 'application/json';
    }

    await applySecurity(definition, securitySchemes as any, headers as any, queryParams as any);

    const config: AxiosRequestConfig = {
      method: definition.method!.toUpperCase(),
      url: requestUrl,
      params: queryParams,
      headers: headers,
      ...(requestBodyData !== undefined && { data: requestBodyData }),
    };

    // Log request info to stderr (doesn't affect MCP output)
    console.error(`Executing tool "${toolName}": ${config.method} ${config.url}`);

    const response = await axios(config);

    let responseText = '';
    const contentType = response.headers['content-type']?.toLowerCase() || '';

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
    } else if (typeof response.data === 'string') {
      responseText = response.data;
    } else if (response.data !== undefined && response.data !== null) {
      responseText = String(response.data);
    } else {
      responseText = `(Status: ${response.status} - No body content)`;
    }

    return McpResponse(`API Response (Status: ${response.status}):\n${responseText}`);
  } catch (error: unknown) {
    let errorMessage: string;
    if (axios.isAxiosError(error)) {
      errorMessage = formatApiError(error);
    } else if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      errorMessage = 'Unexpected error: ' + String(error);
    }
    console.error(`Error during execution of tool '${toolName}':`, errorMessage);
    return McpResponse(errorMessage);
  }
};
