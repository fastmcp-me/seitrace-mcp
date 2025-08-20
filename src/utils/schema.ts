import { jsonSchemaToZod } from 'json-schema-to-zod';
import { z } from 'zod';

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
  const stripped = controllerName.replace(/Controller$/, '').replace(/Token$/, '');
  if (!stripped) return '';
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
    return z.object({}).strict();
  }
  try {
    const zodSchemaString = jsonSchemaToZod(jsonSchema);
    // Create a function that has access to z in its scope
    const schemaFunction = new Function('z', `return ${zodSchemaString}`);
    const zodSchema = schemaFunction(z);
    if (typeof zodSchema?.parse !== 'function') {
      throw new Error('Generated schema is not a valid Zod schema.');
    }
    return zodSchema as z.ZodTypeAny;
  } catch (err: any) {
    console.error(`Failed to generate/evaluate Zod schema for '${toolName}':`, err);
    // Return a strict empty object instead of passthrough for better error detection
    return z.object({}).strict();
  }
}
