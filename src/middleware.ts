import { NextResponse, type NextRequest } from 'next/server';

/**
 * Auth gate (edge). Deliberately LIGHT: it only checks for the presence of the
 * sealed session cookie and redirects unauthenticated users to /login. Full
 * cryptographic verification + expiry happens server-side in getSession()/
 * requireSession() — not in the edge middleware.
 *
 * NOTE: this app does NOT do hostname→folder tenant rewriting (that was
 * properties-manager-ui baggage for serving many marketing sites). Tenancy is
 * resolved by the backend from the x-tenant-host header on BFF calls.
 */
const SESSION_COOKIE = process.env.PORTAL_SESSION_COOKIE || 'pm_portal_session';

// Portal areas that require a session. Everything else (login, callback, assets) is open.
const PROTECTED_PREFIXES = ['/broker', '/customer'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!isProtected) return NextResponse.next();

  const hasSession = req.cookies.has(SESSION_COOKIE);
  if (hasSession) return NextResponse.next();

  const loginUrl = new URL('/login', req.url);
  loginUrl.searchParams.set('returnTo', pathname + req.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|fonts|assets).*)'],
};
