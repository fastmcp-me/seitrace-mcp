import { jsonSchemaToZod } from 'json-schema-to-zod';
import { z } from 'zod';
import oasToSnippet from '@readme/oas-to-snippet';
import Oas from 'oas';
import fs from 'fs';
import NodePath from 'path';

import { Language, getSupportedLanguages } from '@readme/oas-to-snippet/languages';
import { fileURLToPath } from 'url';
import { AxiosError } from 'axios';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

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
