import oasToSnippet from '@readme/oas-to-snippet';
import { getSupportedLanguages, Language } from '@readme/oas-to-snippet/languages';
import Oas from 'oas';
// Supported snippet languages (explicit list used in schema and validation)
export const SUPPORTED_SNIPPET_LANGUAGES = Object.keys(getSupportedLanguages());

/**
 * The function to generate code snippets from the API specifications
 * @param path The API endpoint path
 * @param language The programming language for the snippet
 * @param specs The API specifications in JSON format
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
export const generateSnippet = (path: string, language: string, specs: string) => {
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
