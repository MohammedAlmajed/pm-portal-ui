import { NextResponse, type NextRequest } from 'next/server';
import { serverFetch } from '@/server/api-client';
import { isKnownService } from '@/server/gateway';

/**
 * BFF proxy: /api/<service>/<...path> → gateway, with the bearer token injected
 * SERVER-SIDE from the sealed session and x-tenant-host added. Client components
 * call `fetch('/api/engagement/broker-applications')` and never touch a token.
 *
 * `service` is allow-listed (see src/server/gateway.ts) so callers can't reach
 * arbitrary hosts. Hop-by-hop headers are stripped from the upstream response.
 */
async function proxy(req: NextRequest, ctx: { params: Promise<{ service: string; path: string[] }> }) {
  const { service, path } = await ctx.params;

  if (!isKnownService(service)) {
    return NextResponse.json({ error: 'unknown_service' }, { status: 404 });
  }

  const search = req.nextUrl.search;
  const upstreamPath = path.join('/') + search;

  const method = req.method.toUpperCase();
  const hasBody = method !== 'GET' && method !== 'HEAD';

  let res: Response;
  try {
    res = await serverFetch(service, upstreamPath, {
      method,
      // Forward the raw body for writes; content-type comes from the client.
      body: hasBody ? await req.arrayBuffer() : undefined,
      headers: hasBody ? { 'content-type': req.headers.get('content-type') ?? 'application/json' } : undefined,
    });
  } catch {
    // Upstream (gateway/service) unreachable — e.g. the backend isn't running locally.
    // Return a clean 502 so the client shows a graceful error instead of an opaque 500.
    return NextResponse.json({ error: 'upstream_unreachable' }, { status: 502 });
  }

  // Strip hop-by-hop / length headers that don't survive re-emission.
  const outHeaders = new Headers(res.headers);
  outHeaders.delete('content-encoding');
  outHeaders.delete('content-length');
  outHeaders.delete('transfer-encoding');

  if (res.status === 204) return new NextResponse(null, { status: 204, headers: outHeaders });

  return new NextResponse(res.body, { status: res.status, headers: outHeaders });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
