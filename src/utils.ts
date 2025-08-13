import { jsonSchemaToZod } from 'json-schema-to-zod';
import { z } from 'zod';
import oasToSnippet from '@readme/oas-to-snippet';
import Oas from 'oas';
import fs from 'fs';
import NodePath from 'path';

import { endpointDefinitionMap } from './openapi-definition.js';
import { McpGroupedToolDefinition, McpToolDefinition } from './types.js';
import { Language, getSupportedLanguages } from '@readme/oas-to-snippet/languages';
import { fileURLToPath } from 'url';

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
 * Build a grouped tool JSON Schema with 3-layer method flow:
 * - list_actions
 * - list_action_schema (requires action)
 * - invoke_action (requires action + action's schema)
 * Uses a unified schema with enum for method selection instead of oneOf.
 */
export function buildGroupedInputSchema(_actions: Record<string, McpToolDefinition>): any {
  return {
    type: 'object',
    properties: {
      method: {
        type: 'string',
        enum: ['list_actions', 'list_action_schema', 'invoke_action'],
        description: 'The method to execute: list_actions, list_action_schema, or invoke_action',
      },
      action: {
        type: 'string',
        description: 'Action identifier (required for list_action_schema and invoke_action)',
      },
      payload: {
        type: 'object',
        description: 'Action-specific input payload (required for invoke_action)',
        additionalProperties: true,
      },
    },
    required: ['method'],
    additionalProperties: false,
    description: 'Unified schema supporting all three method types based on the method property',
  };
}

/**
 * Build a concise, LLM-friendly description enumerating available actions.
 */
export function buildGroupedDescription(
  controllerDisplay: string,
  _actions: Record<string, McpToolDefinition>
): string {
  return [
    `Controller: ${controllerDisplay}`,
    `Methods: list_actions, list_action_schema, invoke_action`,
    `Workflow: list_actions -> list_action_schema(action) -> invoke_action(action, ...)`,
    `Use list_actions to enumerate available actions.`,
  ].join('\n');
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
 * Construct grouped tools from flat endpoint definitions
 */
export const groupedToolDefinitionMap: Map<string, McpGroupedToolDefinition> = (() => {
  const map = new Map<string, McpGroupedToolDefinition>();

  for (const [fullName, def] of endpointDefinitionMap.entries()) {
    // fullName format: <ControllerName>-<ActionNameCamel>
    const [controllerPart, actionCamel = ''] = fullName.split('-');
    const toolName = controllerNameToToolName(controllerPart);
    const actionName = camelToSnake(actionCamel);

    // Initialize grouped entry if needed
    if (!map.has(toolName)) {
      map.set(toolName, {
        name: toolName,
        description: '', // filled later
        inputSchema: {}, // filled later
        actions: {},
      });
    }
    const grouped = map.get(toolName)!;
    grouped.actions[actionName] = def;
  }

  // Finalize description and schema per grouped tool
  for (const grouped of map.values()) {
    grouped.inputSchema = buildGroupedInputSchema(grouped.actions);
    // Pretty display name derived from tool name
    const display = grouped.name;
    grouped.description = buildGroupedDescription(display, grouped.actions);
  }

  return map;
})();

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
    accum[key] = Math.random().toString(36).substring(2, 15); // Example value
    return accum;
  }, {} as Record<string, any>);

  // Return the generated code snippet
  const { code } = oasToSnippet(apiDefinition, operation, formData, auth, language as Language);
  return code;
};

// Supported snippet languages
export const SUPPORTED_SNIPPET_LANGUAGES = Object.keys(getSupportedLanguages());
