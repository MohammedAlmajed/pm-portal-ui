import 'server-only';
import { env, keycloakEndpoints } from '@/lib/env';

/** Build the Keycloak authorize URL for a public client + PKCE. */
export function buildAuthorizeUrl(params: {
  state: string;
  nonce: string;
  codeChallenge: string;
  /** Optional Keycloak Organization alias to scope the token to a tenant. */
  orgAlias?: string;
}): string {
  const ep = keycloakEndpoints(env.keycloak.issuer);
  const url = new URL(ep.authorization);
  url.searchParams.set('client_id', env.keycloak.clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid profile email');
  url.searchParams.set('redirect_uri', env.keycloak.redirectUri);
  url.searchParams.set('state', params.state);
  url.searchParams.set('nonce', params.nonce);
  url.searchParams.set('code_challenge', params.codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  // Keycloak Organizations: request org membership in the token when known.
  if (params.orgAlias) url.searchParams.set('organization', params.orgAlias);
  return url.toString();
}

export interface TokenResponse {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

/** Exchange an authorization code for tokens (PKCE). */
export async function exchangeCode(code: string, codeVerifier: string): Promise<TokenResponse> {
  const ep = keycloakEndpoints(env.keycloak.issuer);
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: env.keycloak.clientId,
    code,
    redirect_uri: env.keycloak.redirectUri,
    code_verifier: codeVerifier,
  });
  // Confidential clients also send the secret; public+PKCE clients don't.
  if (env.keycloak.clientSecret) body.set('client_secret', env.keycloak.clientSecret);

  const res = await fetch(ep.token, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Keycloak token exchange failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as TokenResponse;
}

export function buildEndSessionUrl(idTokenHint?: string): string {
  const ep = keycloakEndpoints(env.keycloak.issuer);
  const url = new URL(ep.endSession);
  url.searchParams.set('post_logout_redirect_uri', env.keycloak.postLogoutRedirectUri);
  url.searchParams.set('client_id', env.keycloak.clientId);
  if (idTokenHint) url.searchParams.set('id_token_hint', idTokenHint);
  return url.toString();
}
