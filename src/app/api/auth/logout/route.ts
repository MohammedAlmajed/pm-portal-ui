import { NextResponse } from 'next/server';
import { buildEndSessionUrl } from '@/lib/auth/keycloak';
import { clearSessionCookie } from '@/lib/auth/session';

/**
 * GET /api/auth/logout — clear the local sealed session and end the Keycloak SSO
 * session, then return to the post-logout page.
 */
export async function GET() {
  await clearSessionCookie();
  return NextResponse.redirect(buildEndSessionUrl());
}
