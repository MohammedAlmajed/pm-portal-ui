import { NextResponse, type NextRequest } from 'next/server';
import {
  COOKIE,
  REFRESH_SKEW_SECONDS,
  unsealSession,
  sealSession,
  refreshSession,
  sessionCookieOptions,
} from '@/lib/auth/session-crypto';
import { PUBLIC_PATHS } from '@/lib/routes';

/**
 * Auth gate + silent token refresh (edge).
 *
 * The session cookie lives 6h; the access token inside expires ~every 5 min. This
 * middleware is the one place that runs BEFORE a Server Component renders AND can
 * write cookies, so it owns the refresh: when the access token is (near) expired it
 * swaps the refresh token for a fresh one, re-seals the cookie, and forwards the new
 * cookie both to the browser and to the downstream page/BFF in the SAME request.
 *
 * Only imports the edge-safe ./session-crypto (no server-only / next/headers).
 *
 * The broker experience is the whole app (root), so we protect EVERYTHING except the
 * public pages (/login, /register, /forbidden) and the auth API. No "/broker" prefix.
 *
 * NOTE: no hostname→folder tenant rewriting here (that was properties-manager-ui
 * baggage). Tenancy is resolved by the backend from the x-tenant-host BFF header.
 */

function loginRedirect(req: NextRequest): NextResponse {
  const url = new URL('/login', req.url);
  url.searchParams.set('returnTo', req.nextUrl.pathname + req.nextUrl.search);
  const res = NextResponse.redirect(url);
  res.cookies.delete(COOKIE);
  return res;
}

/** Rewrite the Cookie header so the downstream (this same request) reads the fresh session. */
function withCookie(header: string | null, name: string, value: string): string {
  const parts = (header ? header.split(/;\s*/) : []).filter((p) => p && !p.startsWith(`${name}=`));
  parts.push(`${name}=${value}`);
  return parts.join('; ');
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;
  const isAuthApi = pathname.startsWith('/api/auth'); // login/callback/logout manage their own cookies
  const isBff = pathname.startsWith('/api/') && !isAuthApi;
  const isPublicPage = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  // Everything that isn't the auth API, a public page, or a BFF call is a protected page.
  const isProtectedPage = !isBff && !isAuthApi && !isPublicPage;

  // Auth endpoints manage their own cookies; public pages need no session.
  if (isAuthApi || isPublicPage) return NextResponse.next();

  const raw = req.cookies.get(COOKIE)?.value;
  const session = raw ? await unsealSession(raw) : null;
  const now = Math.floor(Date.now() / 1000);

  // No session or the 6h window elapsed: pages → /login; BFF → let the route emit its own 401.
  if (!session || session.sessionExpiresAt <= now) {
    return isProtectedPage ? loginRedirect(req) : NextResponse.next();
  }

  // Access token still fresh → pass through unchanged.
  if (session.expiresAt - REFRESH_SKEW_SECONDS > now) return NextResponse.next();

  // Access token (near) expired → refresh, preserving the 6h session window.
  const refreshed = await refreshSession(session);
  if (!refreshed) {
    // Refresh token expired/revoked (e.g. logged out elsewhere) → real logout.
    return isProtectedPage ? loginRedirect(req) : NextResponse.next();
  }

  const sealed = await sealSession(refreshed);
  const reqHeaders = new Headers(req.headers);
  reqHeaders.set('cookie', withCookie(req.headers.get('cookie'), COOKIE, sealed));
  const res = NextResponse.next({ request: { headers: reqHeaders } });
  res.cookies.set(COOKIE, sealed, sessionCookieOptions(refreshed.sessionExpiresAt));
  return res;
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|fonts|assets).*)'],
};
