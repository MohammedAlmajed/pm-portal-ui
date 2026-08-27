import { EncryptJWT, jwtDecrypt } from 'jose';
import type { PortalSession } from './session-types';

/**
 * EDGE-SAFE session lifecycle: seal / unseal / refresh / cookie options.
 *
 * Deliberately imports NEITHER 'server-only' NOR next/headers, so the same code
 * runs in Server Components (via session.ts) AND in the edge middleware (which
 * cannot import those). Reads config straight from process.env; it is only ever
 * imported server-side.
 *
 * The session (including the access token) is ENCRYPTED with a key derived from
 * PORTAL_SESSION_SECRET and stored in an HttpOnly cookie — encryption (not just
 * signing) so a leaked cookie can't be read or tampered with.
 */

/** The whole session lives 6h; the access token inside is refreshed as it expires (~5 min). */
export const SESSION_MAX_AGE_SECONDS = 6 * 60 * 60;
/** Refresh the access token once it has fewer than this many seconds left. */
export const REFRESH_SKEW_SECONDS = 60;

export const COOKIE = process.env.PORTAL_SESSION_COOKIE || 'pm_portal_session';

async function deriveKey(): Promise<Uint8Array> {
  // A256GCM 'dir' needs a 32-byte key; derive it deterministically from the secret.
  const secret = process.env.PORTAL_SESSION_SECRET;
  if (!secret) throw new Error('PORTAL_SESSION_SECRET is not set');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  return new Uint8Array(digest);
}

export async function sealSession(session: PortalSession): Promise<string> {
  // Cookie/JWE lifetime tracks the SESSION (6h), not the short-lived access token.
  return new EncryptJWT({ ...session })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime(session.sessionExpiresAt)
    .encrypt(await deriveKey());
}

export async function unsealSession(token: string): Promise<PortalSession | null> {
  try {
    const { payload } = await jwtDecrypt(token, await deriveKey());
    return payload as unknown as PortalSession;
  } catch {
    // Tampered, expired, or wrong key → treat as no session.
    return null;
  }
}

export function sessionCookieOptions(sessionExpiresAt: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    expires: new Date(sessionExpiresAt * 1000),
  };
}

/**
 * Swap the stored refresh token for a fresh access token, keeping the 6h session
 * window. Returns the updated session, or null if the refresh token is expired /
 * revoked (→ the caller should force a real re-login).
 */
export async function refreshSession(session: PortalSession): Promise<PortalSession | null> {
  if (!session.refreshToken) return null;
  const issuer = process.env.KEYCLOAK_ISSUER;
  const clientId = process.env.KEYCLOAK_CLIENT_ID;
  if (!issuer || !clientId) return null;

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    refresh_token: session.refreshToken,
  });
  const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;
  if (clientSecret) body.set('client_secret', clientSecret);

  try {
    const res = await fetch(`${issuer}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const t = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };
    return {
      ...session,
      accessToken: t.access_token,
      // Keycloak may rotate refresh tokens — always keep the newest one.
      refreshToken: t.refresh_token ?? session.refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + t.expires_in,
      // sessionExpiresAt unchanged — the 6h hard cap holds.
    };
  } catch {
    return null;
  }
}
