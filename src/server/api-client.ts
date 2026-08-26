import 'server-only';
import { env } from '@/lib/env';
import { getSession } from '@/lib/auth/session';
import { getTenantHost } from './tenant';
import { SERVICE_PREFIX, DEV_SERVICE_PORTS, type ServiceKey } from './gateway';

export interface ApiOptions extends Omit<RequestInit, 'body'> {
  /** JSON body — serialized automatically. Use `raw` for non-JSON payloads. */
  json?: unknown;
  body?: BodyInit;
  /** Skip attaching the bearer token (for genuinely public endpoints). */
  anonymous?: boolean;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`API ${status}: ${body.slice(0, 200)}`);
  }
}

/**
 * Server-side backend call. Attaches the bearer token from the sealed session
 * and the x-tenant-host header, then hits the gateway. Use this in Server
 * Components and Route Handlers. The access token never leaves the server.
 */
export async function serverFetch(
  service: ServiceKey,
  path: string,
  opts: ApiOptions = {},
): Promise<Response> {
  const tenantHost = await getTenantHost();
  const headers = new Headers(opts.headers);
  headers.set('x-tenant-host', tenantHost);
  headers.set('accept', 'application/json');

  if (!opts.anonymous) {
    const session = await getSession();
    if (session?.accessToken) headers.set('authorization', `Bearer ${session.accessToken}`);
  }

  let body = opts.body;
  if (opts.json !== undefined) {
    headers.set('content-type', 'application/json');
    body = JSON.stringify(opts.json);
  }

  const cleanPath = path.replace(/^\/+/, '');
  let target: string;
  if (process.env.NODE_ENV !== 'production' && DEV_SERVICE_PORTS[service]) {
    // Dev: talk directly to the service's localhost port; services host routes at root (no prefix).
    target = `http://localhost:${DEV_SERVICE_PORTS[service]}/${cleanPath}`;
  } else {
    // Prod: go through the gateway. Monolith has an empty prefix (gateway root) — avoid a `//`.
    const prefix = SERVICE_PREFIX[service];
    const seg = prefix ? `${prefix}/` : '';
    target = `${env.gateway.baseUrl}/${seg}${cleanPath}`;
  }

  return fetch(target, { ...opts, headers, body, cache: 'no-store' });
}

/** Convenience: call the backend and parse JSON, throwing ApiError on non-2xx. */
export async function serverJson<T>(
  service: ServiceKey,
  path: string,
  opts: ApiOptions = {},
): Promise<T> {
  const res = await serverFetch(service, path, opts);
  if (!res.ok) throw new ApiError(res.status, await res.text());
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
