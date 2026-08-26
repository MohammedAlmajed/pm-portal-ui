import 'server-only';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { env, keycloakEndpoints } from '@/lib/env';

/**
 * Proper RS256 verification against Keycloak's JWKS. The earlier customer-portal
 * prototype only DECODED the id_token — this verifies signature, issuer, and
 * audience. The remote JWK set is cached and rotated by jose automatically.
 */
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(keycloakEndpoints(env.keycloak.issuer).jwks));
  }
  return jwks;
}

export async function verifyIdToken(idToken: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(idToken, getJwks(), {
    issuer: env.keycloak.issuer,
    audience: env.keycloak.clientId,
  });
  return payload;
}

/**
 * Extract the Keycloak Organization context. The token carries a nested claim:
 *   organization: { "<alias>": { tenant_id: ["101"], id: "..." } }
 * An org-scoped token has exactly one org. Backend flattens the same way.
 */
export function extractOrg(payload: JWTPayload): { orgAlias: string; tenantId: string } {
  const org = payload['organization'] as
    | Record<string, { tenant_id?: string[]; id?: string }>
    | undefined;
  if (!org) return { orgAlias: '', tenantId: '' };
  const alias = Object.keys(org)[0] ?? '';
  const tenantId = org[alias]?.tenant_id?.[0] ?? '';
  return { orgAlias: alias, tenantId };
}

/** Realm roles live in realm_access.roles by Keycloak convention. */
export function extractRoles(payload: JWTPayload): string[] {
  const realmAccess = payload['realm_access'] as { roles?: string[] } | undefined;
  return realmAccess?.roles ?? [];
}
