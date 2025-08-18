import axios from 'axios';

/**
 * Acquires an OAuth2 token using client credentials flow
 *
 * @param schemeName Name of the security scheme
 * @param scheme OAuth2 security scheme
 * @returns Acquired token or null if unable to acquire
 */
export async function acquireOAuth2Token(
  schemeName: string,
  scheme: any
): Promise<string | null | undefined> {
  try {
    // Check if we have the necessary credentials
    const clientId = process.env[`OAUTH_CLIENT_ID_SCHEMENAME`];
    const clientSecret = process.env[`OAUTH_CLIENT_SECRET_SCHEMENAME`];
    const scopes = process.env[`OAUTH_SCOPES_SCHEMENAME`];

    if (!clientId || !clientSecret) {
      console.error(`Missing client credentials for OAuth2 scheme '${schemeName}'`);
      return null;
    }

    // Initialize token cache if needed
    if (typeof global.__oauthTokenCache === 'undefined') {
      global.__oauthTokenCache = {};
    }

    // Check if we have a cached token
    const cacheKey = `${schemeName}_${clientId}`;
    const cachedToken = global.__oauthTokenCache[cacheKey];
    const now = Date.now();

    if (cachedToken && cachedToken.expiresAt > now) {
      console.error(
        `Using cached OAuth2 token for '${schemeName}' (expires in ${Math.floor(
          (cachedToken.expiresAt - now) / 1000
        )} seconds)`
      );
      return cachedToken.token;
    }

    // Determine token URL based on flow type
    let tokenUrl = '';
    if (scheme.flows?.clientCredentials?.tokenUrl) {
      tokenUrl = scheme.flows.clientCredentials.tokenUrl;
      console.error(`Using client credentials flow for '${schemeName}'`);
    } else if (scheme.flows?.password?.tokenUrl) {
      tokenUrl = scheme.flows.password.tokenUrl;
      console.error(`Using password flow for '${schemeName}'`);
    } else {
      console.error(`No supported OAuth2 flow found for '${schemeName}'`);
      return null;
    }

    // Prepare the token request
    let formData = new URLSearchParams();
    formData.append('grant_type', 'client_credentials');

    // Add scopes if specified
    if (scopes) {
      formData.append('scope', scopes);
    }

    console.error(`Requesting OAuth2 token from ${tokenUrl}`);

    // Make the token request
    const response = await axios({
      method: 'POST',
      url: tokenUrl,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      data: formData.toString(),
    });

    // Process the response
    if (response.data?.access_token) {
      const token = response.data.access_token;
      const expiresIn = response.data.expires_in || 3600; // Default to 1 hour

      // Cache the token
      global.__oauthTokenCache[cacheKey] = {
        token,
        expiresAt: now + expiresIn * 1000 - 60000, // Expire 1 minute early
      };

      console.error(
        `Successfully acquired OAuth2 token for '${schemeName}' (expires in ${expiresIn} seconds)`
      );
      return token;
    } else {
      console.error(
        `Failed to acquire OAuth2 token for '${schemeName}': No access_token in response`
      );
      return null;
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error acquiring OAuth2 token for '${schemeName}':`, errorMessage);
    return null;
  }
}

/**
 * Applies security requirements to the request
 * @param definition The API operation definition
 * @param allSecuritySchemes All available security schemes
 * @param headers Request headers
 * @param queryParams Query parameters
 */
export async function applySecurity(
  definition: any,
  allSecuritySchemes: Record<string, any>,
  headers: any,
  queryParams: any
) {
  // Security requirements use OR between array items and AND within each object
  const appliedSecurity = definition.securityRequirements?.find((req: any) => {
    // Try each security requirement (combined with OR)
    return Object.entries(req).every(([schemeName]) => {
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
        if (process.env[`OAUTH_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`]) {
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
            process.env[`BASIC_USERNAME_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
          const password =
            process.env[`BASIC_PASSWORD_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
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
