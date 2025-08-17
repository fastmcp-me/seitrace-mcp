import { AxiosResponse } from 'axios';
import { McpResponse } from './index.js';

/**
 * Formats the API response for MCP
 * @param response The Axios response object
 * @returns The formatted MCP response
 */
export const formatApiResponse = (response: AxiosResponse) => {
  let responseText = '';
  const contentType = response.headers['content-type']?.toLowerCase() || '';

  /**
   * Handles JSON responses
   */
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

  /**
   * Handles response
   */
  return McpResponse(responseText);
};
