import 'server-only';
import { headers } from 'next/headers';

/**
 * Resolve the tenant host from the incoming request. The backend resolves the
 * tenant from this hostname (x-tenant-host) — the frontend NEVER knows or sends
 * a numeric tenant id (that was a properties-manager-ui anti-pattern).
 */
export async function getTenantHost(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? '';
  return host.split(':')[0] ?? '';
}
