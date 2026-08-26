import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { decodeJwt } from 'jose';
import { exchangeCode } from '@/lib/auth/keycloak';
import { verifyIdToken, extractOrg, extractRoles } from '@/lib/auth/verify';
import { setSessionCookie } from '@/lib/auth/session';
import { env } from '@/lib/env';
import type { PortalSession } from '@/lib/auth/session-types';

/**
 * GET /api/auth/callback — Keycloak redirects here with ?code&state.
 * Validates state, exchanges the code (PKCE), VERIFIES the id_token against JWKS,
 * builds the session, seals it into an HttpOnly cookie, and redirects to returnTo.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, env.appOrigin));
  }
  if (!code || !state) {
    return NextResponse.redirect(new URL('/login?error=invalid_response', env.appOrigin));
  }

  const store = await cookies();
  const expectedState = store.get('pm_oauth_state')?.value;
  const verifier = store.get('pm_oauth_verifier')?.value;
  const returnTo = store.get('pm_oauth_return')?.value ?? '/broker';

  // Clear the short-lived flow cookies regardless of outcome.
  for (const c of ['pm_oauth_state', 'pm_oauth_nonce', 'pm_oauth_verifier', 'pm_oauth_return']) {
    store.delete(c);
  }

  if (!expectedState || state !== expectedState || !verifier) {
    return NextResponse.redirect(new URL('/login?error=state_mismatch', env.appOrigin));
  }

  try {
    const tokens = await exchangeCode(code, verifier);
    const claims = await verifyIdToken(tokens.id_token);
    // Roles + org membership live in the ACCESS token by Keycloak default (not the
    // id_token). The access token came straight from the token endpoint in this same
    // exchange, so we decode (not re-verify) it for those claims.
    const accessClaims = decodeJwt(tokens.access_token);
    const { orgAlias, tenantId } = extractOrg(accessClaims);

    const session: PortalSession = {
      sub: String(claims.sub ?? ''),
      tenantId,
      orgAlias,
      roles: extractRoles(accessClaims),
      name: typeof claims['name'] === 'string' ? (claims['name'] as string) : undefined,
      email: typeof claims['email'] === 'string' ? (claims['email'] as string) : undefined,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
    };

    await setSessionCookie(session);
    // Only allow same-origin relative returnTo to avoid open redirects.
    const safeReturn = returnTo.startsWith('/') ? returnTo : '/broker';
    return NextResponse.redirect(new URL(safeReturn, env.appOrigin));
  } catch (e) {
    console.error('[auth/callback] token exchange / id_token verify failed:', e);
    return NextResponse.redirect(new URL('/login?error=exchange_failed', env.appOrigin));
  }
}
