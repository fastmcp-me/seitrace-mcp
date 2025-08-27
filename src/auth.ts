/**
 * Applies security requirements to the request
 * @param definition The API operation definition
 * @param allSecuritySchemes All available security schemes
 * @param headers Request headers
 * @param queryParams Query parameters
 * @param overrideApiKey Optional API key to override the default
 */
export async function applySecurity(
  definition: any,
  allSecuritySchemes: Record<string, any>,
  headers: any,
  queryParams: any,
  overrideApiKey?: string
) {
  // Security requirements use OR between array items and AND within each object
  const appliedSecurity = definition.securityRequirements?.find((req: any) => {
    // Try each security requirement (combined with OR)
    return Object.entries(req).every(([schemeName]) => {
      const scheme = allSecuritySchemes[schemeName];
      if (!scheme) return false;

      // API Key security (header, query, cookie)
      if (scheme.type === 'apiKey') {
        return (
          !!overrideApiKey ||
          !!process.env[`SECRET_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`]
        );
      }

      return false;
    });
  });

  // If we found matching security scheme(s), apply them
  if (appliedSecurity) {
    // Apply each security scheme from this requirement (combined with AND)
    for (const [schemeName] of Object.entries(appliedSecurity)) {
      const scheme = allSecuritySchemes[schemeName];

      // API Key security
      if (scheme?.type === 'apiKey') {
        const apiKey =
          overrideApiKey ||
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
    }
  }
  // Log warning if security is required but not available
  else if (definition.securityRequirements?.length > 0) {
    // First generate a more readable representation of the security requirements
    const securityRequirementsString = definition.securityRequirements
      .map((req: any) => {
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
      `Tool requires security: ${securityRequirementsString}, but no suitable credentials found.`
    );
  }
}
