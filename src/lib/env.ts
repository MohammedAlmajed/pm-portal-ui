/**
 * Server-only environment access. Importing this from a client component will
 * throw at build time (server-only), which is the guardrail we want: secrets
 * must never cross into the browser bundle.
 */
import 'server-only';

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.length === 0) {
    // Fail loud in every environment except when Next is merely collecting
    // metadata during build without runtime env (guarded by callers).
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback = ''): string {
  return process.env[name] ?? fallback;
}

export const env = {
  keycloak: {
    get issuer() {
      return required('KEYCLOAK_ISSUER');
    },
    get clientId() {
      return required('KEYCLOAK_CLIENT_ID');
    },
    get clientSecret() {
      return optional('KEYCLOAK_CLIENT_SECRET');
    },
    get redirectUri() {
      return required('KEYCLOAK_REDIRECT_URI');
    },
    get postLogoutRedirectUri() {
      return optional(
        'KEYCLOAK_POST_LOGOUT_REDIRECT_URI',
        `${optional('NEXT_PUBLIC_APP_ORIGIN', 'http://localhost:3000')}/login`,
      );
    },
  },
  session: {
    get secret() {
      return required('PORTAL_SESSION_SECRET');
    },
    get cookieName() {
      return optional('PORTAL_SESSION_COOKIE', 'pm_portal_session');
    },
  },
  gateway: {
    get baseUrl() {
      return required('GATEWAY_BASE_URL');
    },
  },
  appOrigin: optional('NEXT_PUBLIC_APP_ORIGIN', 'http://localhost:3000'),
} as const;

/** Keycloak OIDC endpoints derived from the issuer. */
export function keycloakEndpoints(issuer: string) {
  return {
    authorization: `${issuer}/protocol/openid-connect/auth`,
    token: `${issuer}/protocol/openid-connect/token`,
    jwks: `${issuer}/protocol/openid-connect/certs`,
    endSession: `${issuer}/protocol/openid-connect/logout`,
    userinfo: `${issuer}/protocol/openid-connect/userinfo`,
  };
}
