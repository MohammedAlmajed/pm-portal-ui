import 'server-only';
import { cookies } from 'next/headers';
import type { PortalSession } from './session-types';
import {
  sealSession,
  unsealSession,
  sessionCookieOptions,
  SESSION_MAX_AGE_SECONDS,
  COOKIE,
} from './session-crypto';

/**
 * Server-side session access (Server Components / Route Handlers). The crypto and
 * refresh live in the edge-safe ./session-crypto so the middleware can share them;
 * this module adds the next/headers cookie jar on top.
 */

// Re-exported for existing importers (callback route, etc.).
export { sealSession, unsealSession, SESSION_MAX_AGE_SECONDS };

/** Read + unseal the current session. */
export async function getSession(): Promise<PortalSession | null> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return null;
  const session = await unsealSession(raw);
  if (!session) return null;
  // Session-level expiry (6h). The access token inside may be momentarily stale — the
  // middleware refreshes it before the page renders, so we don't invalidate on expiresAt here.
  if (session.sessionExpiresAt * 1000 < Date.now()) return null;
  return session;
}

export async function setSessionCookie(session: PortalSession): Promise<void> {
  const store = await cookies();
  const sealed = await sealSession(session);
  store.set(COOKIE, sealed, sessionCookieOptions(session.sessionExpiresAt));
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}
