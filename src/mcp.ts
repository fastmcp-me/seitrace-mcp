import {
  CallToolRequest,
  CallToolRequestSchema,
  CallToolResult,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { ZodError } from 'zod';
import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

import { JsonObject, McpToolDefinition } from './types.js';
import {
  getZodSchemaFromJsonSchema,
  groupedToolDefinitionMap,
  generateSnippet,
  SUPPORTED_SNIPPET_LANGUAGES,
} from './utils.js';
import { acquireOAuth2Token } from './auth.js';
import { API_BASE_URL, SERVER_NAME, SERVER_VERSION } from './constants.js';
import { endpointDefinitionMap, securitySchemes } from './openapi-definition.js';

/**
 * MCP Server instance
 */
export const server = new Server(
  { name: SERVER_NAME, version: SERVER_VERSION },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  // Advertise grouped controller tools to clients (LLM-friendly)
  const toolsForClient: Tool[] = Array.from(groupedToolDefinitionMap.values()).map((def) => ({
    name: def.name,
    description: def.description,
    inputSchema: def.inputSchema,
  }));
  return { tools: toolsForClient };
});

server.setRequestHandler(
  CallToolRequestSchema,
  async (request: CallToolRequest): Promise<CallToolResult> => {
    const { name: toolName, arguments: toolArgs } = request.params;

    // First try grouped tools (preferred)
    const grouped = groupedToolDefinitionMap.get(toolName);
    if (grouped) {
      // 3-layer method flow
      const argObj =
        typeof toolArgs === 'object' && toolArgs !== null ? (toolArgs as Record<string, any>) : {};
      const method = argObj.method || (argObj.action ? 'invoke_action' : undefined);

      if (method === 'list_actions') {
        const actions = Object.entries(grouped.actions)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([name, def]) => ({ name, description: (def.description || '').trim() }));
        return {
          content: [{ type: 'text', text: JSON.stringify({ tool: toolName, actions }) }],
        };
      }

      if (method === 'list_action_schema') {
        const action = argObj.action;
        if (typeof action !== 'string' || !grouped.actions[action]) {
          const available = Object.keys(grouped.actions).sort();
          return {
            content: [
              {
                type: 'text',
                text: `Unknown action '${action}' for tool '${toolName}'. Available actions: ${available.join(
                  ', '
                )}`,
              },
            ],
          };
        }
        const schema = grouped.actions[action].inputSchema;
        return {
          content: [{ type: 'text', text: JSON.stringify({ tool: toolName, action, schema }) }],
        };
      }

      if (method === 'invoke_action') {
        const action = argObj.action;
        if (typeof action !== 'string' || !grouped.actions[action]) {
          const available = Object.keys(grouped.actions).sort();
          return {
            content: [
              {
                type: 'text',
                text: `Unknown action '${action}' for tool '${toolName}'. Available actions: ${available.join(
                  ', '
                )}`,
              },
            ],
          };
        }
        // Expect payload object carrying the action arguments
        const payload = argObj.payload;
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
                text: `Invalid or missing 'payload' for method 'invoke_action'. Provide an object matching the action schema.`,
              },
            ],
          };
        }
        const endpointDef = grouped.actions[action];
        return await executeApiTool(
          `${toolName}.${action}`,
          endpointDef,
          payload as Record<string, any>,
          securitySchemes
        );
      }

      if (method === 'get_action_snippet') {
        const action = argObj.action;
        const language = argObj.language;
        if (typeof action !== 'string' || !grouped.actions[action]) {
          const available = Object.keys(grouped.actions).sort();
          return {
            content: [
              {
                type: 'text',
                text: `Unknown action '${action}' for tool '${toolName}'. Available actions: ${available.join(', ')}`,
              },
            ],
          };
        }
        if (typeof language !== 'string' || !SUPPORTED_SNIPPET_LANGUAGES.includes(language)) {
          return {
            content: [
              {
                type: 'text',
                text: `Unsupported or missing language '${language}'. Supported languages: ${SUPPORTED_SNIPPET_LANGUAGES.join(', ')}`,
              },
            ],
          };
        }
        const endpointDef = grouped.actions[action];
        // Use pathTemplate as the OpenAPI path for snippet generation
        const path = endpointDef.pathTemplate;
        try {
          const snippet = generateSnippet(path, language);
          return {
            content: [
              { type: 'text', text: JSON.stringify({ tool: toolName, action, language, snippet }) },
            ],
          };
        } catch (e: any) {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to generate snippet for ${toolName}.${action} in '${language}': ${e?.message || String(
                  e
                )}`,
              },
            ],
          };
        }
      }

      // Unknown method
      return {
        content: [
          {
            type: 'text',
            text: `Unknown method '${method}'. Use one of: list_actions, list_action_schema, invoke_action, get_action_snippet`,
          },
        ],
      };
    }

    // Fallback: allow legacy flat tool names for compatibility
    const legacyToolDef = endpointDefinitionMap.get(toolName);
    if (legacyToolDef) {
      console.warn(
        `Calling legacy flat tool '${toolName}'. Consider using grouped controller tools.`
      );
      return await executeApiTool(toolName, legacyToolDef, toolArgs ?? {}, securitySchemes);
    }

    console.error(`Error: Unknown tool requested: ${toolName}`);
    return { content: [{ type: 'text', text: `Error: Unknown tool requested: ${toolName}` }] };
  }
);

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
    // Security requirements use OR between array items and AND within each object
    const appliedSecurity = definition.securityRequirements?.find((req) => {
      // Try each security requirement (combined with OR)
      return Object.entries(req).every(([schemeName, scopesArray]) => {
        const scheme = allSecuritySchemes[schemeName];
        if (!scheme) return false;

        // API Key security (header, query, cookie)
        if (scheme.type === 'apiKey') {
          return !!process.env[`SECRET_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
        }

        // HTTP security (basic, bearer)
        if (scheme.type === 'http') {
          if (scheme.scheme?.toLowerCase() === 'bearer') {
            return !!process.env[
              `BEARER_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`
            ];
          } else if (scheme.scheme?.toLowerCase() === 'basic') {
            return (
              !!process.env[
                `BASIC_USERNAME_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`
              ] &&
              !!process.env[
                `BASIC_PASSWORD_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`
              ]
            );
          }
        }

        // OAuth2 security
        if (scheme.type === 'oauth2') {
          // Check for pre-existing token
          if (
            process.env[`OAUTH_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`]
          ) {
            return true;
          }

          // Check for client credentials for auto-acquisition
          if (
            process.env[
              `OAUTH_CLIENT_ID_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`
            ] &&
            process.env[
              `OAUTH_CLIENT_SECRET_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`
            ]
          ) {
            // Verify we have a supported flow
            if (scheme.flows?.clientCredentials || scheme.flows?.password) {
              return true;
            }
          }

          return false;
        }

        // OpenID Connect
        if (scheme.type === 'openIdConnect') {
          return !!process.env[
            `OPENID_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`
          ];
        }

        return false;
      });
    });

    // If we found matching security scheme(s), apply them
    if (appliedSecurity) {
      // Apply each security scheme from this requirement (combined with AND)
      for (const [schemeName, scopesArray] of Object.entries(appliedSecurity)) {
        const scheme = allSecuritySchemes[schemeName];

        // API Key security
        if (scheme?.type === 'apiKey') {
          const apiKey =
            process.env[`SECRET_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
          if (apiKey) {
            if (scheme.in === 'header') {
              headers[scheme.name.toLowerCase()] = apiKey;
              console.error(`Applied API key '${schemeName}' in header '${scheme.name}'`);
            } else if (scheme.in === 'query') {
              queryParams[scheme.name] = apiKey;
              console.error(`Applied API key '${schemeName}' in query parameter '${scheme.name}'`);
            } else if (scheme.in === 'cookie') {
              // Add the cookie, preserving other cookies if they exist
              headers['cookie'] = `${scheme.name}=${apiKey}${
                headers['cookie'] ? `; ${headers['cookie']}` : ''
              }`;
              console.error(`Applied API key '${schemeName}' in cookie '${scheme.name}'`);
            }
          }
        }
        // HTTP security (Bearer or Basic)
        else if (scheme?.type === 'http') {
          if (scheme.scheme?.toLowerCase() === 'bearer') {
            const token =
              process.env[`BEARER_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
            if (token) {
              headers['authorization'] = `Bearer ${token}`;
              console.error(`Applied Bearer token for '${schemeName}'`);
            }
          } else if (scheme.scheme?.toLowerCase() === 'basic') {
            const username =
              process.env[
                `BASIC_USERNAME_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`
              ];
            const password =
              process.env[
                `BASIC_PASSWORD_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`
              ];
            if (username && password) {
              headers['authorization'] = `Basic ${Buffer.from(`${username}:${password}`).toString(
                'base64'
              )}`;
              console.error(`Applied Basic authentication for '${schemeName}'`);
            }
          }
        }
        // OAuth2 security
        else if (scheme?.type === 'oauth2') {
          // First try to use a pre-provided token
          let token =
            process.env[`OAUTH_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];

          // If no token but we have client credentials, try to acquire a token
          if (!token && (scheme.flows?.clientCredentials || scheme.flows?.password)) {
            console.error(`Attempting to acquire OAuth token for '${schemeName}'`);
            token = (await acquireOAuth2Token(schemeName, scheme)) ?? '';
          }

          // Apply token if available
          if (token) {
            headers['authorization'] = `Bearer ${token}`;
            console.error(`Applied OAuth2 token for '${schemeName}'`);

            // List the scopes that were requested, if any
            const scopes = scopesArray as string[];
            if (scopes && scopes.length > 0) {
              console.error(`Requested scopes: ${scopes.join(', ')}`);
            }
          }
        }
        // OpenID Connect
        else if (scheme?.type === 'openIdConnect') {
          const token =
            process.env[`OPENID_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
          if (token) {
            headers['authorization'] = `Bearer ${token}`;
            console.error(`Applied OpenID Connect token for '${schemeName}'`);

            // List the scopes that were requested, if any
            const scopes = scopesArray as string[];
            if (scopes && scopes.length > 0) {
              console.error(`Requested scopes: ${scopes.join(', ')}`);
            }
          }
        }
      }
    }
    // Log warning if security is required but not available
    else if (definition.securityRequirements?.length > 0) {
      // First generate a more readable representation of the security requirements
      const securityRequirementsString = definition.securityRequirements
        .map((req) => {
          const parts = Object.entries(req)
            .map(([name, scopesArray]) => {
              const scopes = scopesArray as string[];
              if (scopes.length === 0) return name;
              return `${name} (scopes: ${scopes.join(', ')})`;
            })
            .join(' AND ');
          return `[${parts}]`;
        })
        .join(' OR ');

      console.warn(
        `Tool '${toolName}' requires security: ${securityRequirementsString}, but no suitable credentials found.`
      );
    }

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
