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

  /**
   * White-label branding. All read SERVER-SIDE (plain env, not NEXT_PUBLIC), so the SAME
   * image reskins per deployment via ConfigMap — no rebuild. Text is threaded to client
   * components as props; colors are injected as CSS-var overrides on <html> (see layout).
   * Defaults keep the Wisla broker-portal look, so existing deploys are unchanged.
   */
  brand: {
    get name() {
      return optional('BRAND_NAME', 'بوابة الوسطاء');
    },
    get short() {
      return optional('BRAND_SHORT', 'الوسطاء');
    },
    get mark() {
      return optional('BRAND_MARK', 'و');
    },
    get description() {
      return optional('BRAND_DESCRIPTION', 'بوابة الوسطاء العقاريين — التسجيل ومتابعة الطلبات');
    },
    get themeColor() {
      return optional('BRAND_THEME_COLOR', '#264ac3');
    },
    /**
     * Optional `--pm-brand*` overrides as a CSS declaration string. Only the vars that are
     * set are emitted; empty string = keep the default indigo theme. Everything (buttons,
     * links, focus rings, active nav) cascades from these.
     */
    get cssVars(): string {
      const overrides: Record<string, string> = {
        '--pm-brand': optional('BRAND_COLOR'),
        '--pm-brand-hover': optional('BRAND_COLOR_HOVER'),
        '--pm-brand-active': optional('BRAND_COLOR_ACTIVE'),
        '--pm-brand-subtle': optional('BRAND_COLOR_SUBTLE'),
        '--pm-brand-border': optional('BRAND_COLOR_BORDER'),
        '--pm-ring': optional('BRAND_RING'),
      };
      return Object.entries(overrides)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}:${v}`)
        .join(';');
    },
  },
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
