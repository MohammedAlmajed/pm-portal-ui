import 'server-only';
import { cookies } from 'next/headers';
import { EncryptJWT, jwtDecrypt } from 'jose';
import { env } from '@/lib/env';
import type { PortalSession } from './session-types';

/**
 * Session sealing. The session (including the access token) is ENCRYPTED with a
 * key derived from PORTAL_SESSION_SECRET and stored in an HttpOnly cookie.
 * Encryption (not just signing) so a leaked cookie can't be read, and it can't
 * be tampered with. The browser only ever holds an opaque, HttpOnly blob.
 */

async function deriveKey(): Promise<Uint8Array> {
  // A256GCM 'dir' needs a 32-byte key; derive it deterministically from the secret.
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(env.session.secret));
  return new Uint8Array(digest);
}

export async function sealSession(session: PortalSession): Promise<string> {
  const key = await deriveKey();
  return new EncryptJWT({ ...session })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime(session.expiresAt)
    .encrypt(key);
}

export async function unsealSession(token: string): Promise<PortalSession | null> {
  try {
    const key = await deriveKey();
    const { payload } = await jwtDecrypt(token, key);
    return payload as unknown as PortalSession;
  } catch {
    // Tampered, expired, or wrong key → treat as no session.
    return null;
  }
}

const COOKIE = env.session.cookieName;

/** Read + unseal the current session in a Server Component / Route Handler. */
export async function getSession(): Promise<PortalSession | null> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return null;
  const session = await unsealSession(raw);
  if (!session) return null;
  // Expiry guard (jose also enforces exp, but be explicit).
  if (session.expiresAt * 1000 < Date.now()) return null;
  return session;
}

export async function setSessionCookie(session: PortalSession): Promise<void> {
  const store = await cookies();
  const sealed = await sealSession(session);
  store.set(COOKIE, sealed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(session.expiresAt * 1000),
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}
