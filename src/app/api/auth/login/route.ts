import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { buildAuthorizeUrl } from '@/lib/auth/keycloak';
import { randomUrlToken, codeChallengeFromVerifier } from '@/lib/auth/pkce';

/**
 * GET /api/auth/login — start the OIDC Authorization Code + PKCE flow.
 * Stashes the PKCE verifier, state, nonce, and returnTo in short-lived HttpOnly
 * cookies, then 302s to Keycloak.
 *
 * Query: ?returnTo=/broker  &org=<alias>
 */
export async function GET(req: NextRequest) {
  const returnTo = req.nextUrl.searchParams.get('returnTo') ?? '/';
  const orgAlias = req.nextUrl.searchParams.get('org') ?? undefined;

  const state = randomUrlToken();
  const nonce = randomUrlToken();
  const codeVerifier = randomUrlToken(48);
  const codeChallenge = await codeChallengeFromVerifier(codeVerifier);

  const authorizeUrl = buildAuthorizeUrl({ state, nonce, codeChallenge, orgAlias });

  const store = await cookies();
  const short = {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 600, // 10 minutes to complete the round-trip
  };
  store.set('pm_oauth_state', state, short);
  store.set('pm_oauth_nonce', nonce, short);
  store.set('pm_oauth_verifier', codeVerifier, short);
  store.set('pm_oauth_return', returnTo, short);

  return NextResponse.redirect(authorizeUrl);
}
