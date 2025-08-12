import { jsonSchemaToZod } from 'json-schema-to-zod';
import { z } from 'zod';

import { endpointDefinitionMap } from './openapi-definition.js';
import { McpGroupedToolDefinition, McpToolDefinition } from './types.js';

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
