import { jsonSchemaToZod } from 'json-schema-to-zod';
import { z, ZodError } from 'zod';
import oasToSnippet from '@readme/oas-to-snippet';
import Oas from 'oas';
import fs from 'fs';
import NodePath from 'path';

import { Language, getSupportedLanguages } from '@readme/oas-to-snippet/languages';
import { fileURLToPath } from 'url';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { applySecurity } from './auth.js';
import { GENERAL_API_BASE_URL } from './constants.js';
import { McpToolDefinition, JsonObject } from './types.js';

// Supported snippet languages (explicit list used in schema and validation)
export const SUPPORTED_SNIPPET_LANGUAGES = Object.keys(getSupportedLanguages());

/**
 * Utility: convert CamelCase or mixedCase to snake_case
 */
export function camelToSnake(input: string): string {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .replace(/\s+/g, '_')
    .toLowerCase();
}

/**
 * Utility: from Controller class name to tool name (strip Controller + Token, snake_case, lowercase)
 */
export function controllerNameToToolName(controllerName: string): string {
  const stripped = controllerName.replace(/Controller$/, '').replace(/Token/g, '');
  return camelToSnake(stripped);
}

/**
 * Converts a JSON Schema to a Zod schema for runtime validation
 *
 * @param jsonSchema JSON Schema
 * @param toolName Tool name for error reporting
 * @returns Zod schema
 */
export function getZodSchemaFromJsonSchema(jsonSchema: any, toolName: string): z.ZodTypeAny {
  if (typeof jsonSchema !== 'object' || jsonSchema === null) {
    return z.object({}).passthrough();
  }
  try {
    const zodSchemaString = jsonSchemaToZod(jsonSchema);
    const zodSchema = eval(zodSchemaString);
    if (typeof zodSchema?.parse !== 'function') {
      throw new Error('Eval did not produce a valid Zod schema.');
    }
    return zodSchema as z.ZodTypeAny;
  } catch (err: any) {
    console.error(`Failed to generate/evaluate Zod schema for '${toolName}':`, err);
    return z.object({}).passthrough();
  }
}

/**
 * The function to generate code snippets from the API specifications
 * @param path The API endpoint path
 * @param language The programming language for the snippet
 * @example
 * > generateSnippet('/api/v2/token/erc20/transfers', 'node')
  "const url = 'https://seitrace.com/insights/api/v2/token/erc20/transfers?limit=10&offset=0&chain_id=pacific-1&contract_address=0x0c78d371EB4F8c082E8CD23c2Fa321b915E1BBfA&wallet_address=0x0c78d371EB4F8c082E8CD23c2Fa321b915E1BBfA&from_date=2021-01-01&to_date=2021-03-01';\n" +
  'const options = {\n' +
  "  method: 'GET',\n" +
  "  headers: {accept: 'application/json', 'x-api-key': 'luclf6g1sbc'}\n" +
  '};\n' +
  '\n' +
  'fetch(url, options)\n' +
  '  .then(res => res.json())\n' +
  '  .then(json => console.log(json))\n' +
  '  .catch(err => console.error(err));'
 */
export const generateSnippet = (path: string, language: string) => {
  // Prepare openapi specs
  const fileName = fileURLToPath(import.meta.url);
  const dirName = NodePath.dirname(fileName);
  const specs = fs.readFileSync(NodePath.join(dirName, './api-specs.json')).toString();
  const apiDefinition = new Oas(JSON.parse(specs as any));
  const operation = apiDefinition.operation(path, 'get'); // all are get methods

  const formData = {
    // Construct examples data
    query: operation.getParameters().reduce((accum, param) => {
      if (param.in === 'query') {
        accum[param.name] = param.example;
      }
      return accum;
    }, {} as Record<string, any>),

    // Construct examples data
    header: {
      ...operation.getHeaders().request.reduce((accum, header) => {
        if (header.toLowerCase() === 'accept' || header.toLowerCase() === 'content-type') {
          accum[header] = 'application/json';
        } else {
          accum[header] = Math.random().toString(36).substring(2, 15);
        } // Example value
        return accum;
      }, {} as Record<string, any>),
      // Should additionally include content-type header
      'content-type': 'application/json',
    },
  };

  // Prepare security headers
  const auth = Object.keys(operation.schema.security?.[0] || {}).reduce((accum, key) => {
    accum[key] = '<should-insert-seitrace-api-key-here>';
    return accum;
  }, {} as Record<string, any>);

  // Return the generated code snippet
  const { code } = oasToSnippet(apiDefinition, operation, formData, auth, language as Language);
  return code;
};

/**
 * Formats API errors for better readability
 *
 * @param error Axios error
 * @returns Formatted error message
 */
export function formatApiError(error: AxiosError): string {
  let message = 'API request failed.';
  if (error.response) {
    message = `API Error: Status ${error.response.status} (${
      error.response.statusText || 'Status text not available'
    }). `;
    const responseData = error.response.data;
    const MAX_LEN = 200;
    if (typeof responseData === 'string') {
      message += `Response: ${responseData.substring(0, MAX_LEN)}${
        responseData.length > MAX_LEN ? '...' : ''
      }`;
    } else if (responseData) {
      try {
        const jsonString = JSON.stringify(responseData);
        message += `Response: ${jsonString.substring(0, MAX_LEN)}${
          jsonString.length > MAX_LEN ? '...' : ''
        }`;
      } catch {
        message += 'Response: [Could not serialize data]';
      }
    } else {
      message += 'No response body received.';
    }
  } else if (error.request) {
    message = 'API Network Error: No response received from server.';
    if (error.code) message += ` (Code: ${error.code})`;
  } else {
    message += `API Request Setup Error: ${error.message}`;
  }
  return message;
}

/**
 * Wraps the result in a standardized response format
 * @param result The result to wrap
 * @returns The wrapped response
 */
export const McpResponse = (result: string): CallToolResult => {
  return {
    content: [{ type: 'text', text: result }],
  };
};

/**
 * Wraps a handler function with error handling logic
 *
 * @param handler The handler function to wrap
 * @param exception The exception information to use for error wrapping
 * @returns A promise that resolves with the result of the handler or rejects with a wrapped error
 */
export const withMcpResponse = <T extends CallToolResult>(
  handler: () => Promise<T> | T
): Promise<CallToolResult> => {
  /**
   * Do the magic with a simple catch
   */
  return Promise.resolve(handler() as Promise<T>)
    .then((result) => {
      return result;
    })
    .catch(async (e) => {
      return McpResponse(`Error occurred: ${e.message}`);
    });
};

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
