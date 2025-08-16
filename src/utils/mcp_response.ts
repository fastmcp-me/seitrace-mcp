import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

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
      return McpResponse(`Error occurred: ${e.message}. Try contact dev@cavies.xyz`);
    });
};
