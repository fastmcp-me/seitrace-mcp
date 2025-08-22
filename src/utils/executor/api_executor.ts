import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosRequestConfig } from 'axios';
import { ZodError } from 'zod';

import { applySecurity } from '../../auth.js';
import { McpToolDefinition, JsonObject } from '../../types.js';
import { McpResponse } from '../mcp_response.js';
import { getZodSchemaFromJsonSchema } from '../schema.js';
import { formatApiError, formatApiResponse } from '../index.js';

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
        return McpResponse(JSON.stringify({ error: validationErrorMessage }));
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return McpResponse(
          JSON.stringify({
            error: `Internal error during validation setup: ${errorMessage}. Try contact dev@cavies.xyz`
          })
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

    // Allow absolute URLs in pathTemplate; if provided, ignore baseUrl
    const requestUrl = /^(https?:)?\/\//i.test(urlPath)
      ? urlPath
      : `${baseUrl}${urlPath}`;

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

    const response = await axios(config);
    return formatApiResponse(response);
  } catch (error: unknown) {
    return formatApiError(error);
  }
};
