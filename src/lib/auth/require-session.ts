import 'server-only';
import { redirect } from 'next/navigation';
import { getSession } from './session';
import { hasRole, type PortalRole, type PortalSession } from './session-types';

/**
 * Server-side guard for portal pages/layouts. Redirects to /login when there is
 * no valid session. Use in (portal) layouts and server components.
 */
export async function requireSession(returnTo?: string): Promise<PortalSession> {
  const session = await getSession();
  if (!session) {
    const qs = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : '';
    redirect(`/login${qs}`);
  }
  return session;
}

/** Guard a role-specific area (e.g. the broker area requires the "broker" role). */
export async function requireRole(role: PortalRole, returnTo?: string): Promise<PortalSession> {
  const session = await requireSession(returnTo);
  if (!hasRole(session, role)) {
    redirect('/forbidden');
  }
  return session;
}
