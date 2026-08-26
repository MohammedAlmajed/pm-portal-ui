/**
 * The portal session shape. Deliberately mirrors what the BACKEND reads from the
 * Keycloak token (PropertiesManager.Shared/Authentication/CustomerClaimsTransformation.cs
 * flattens organization.<alias>.tenant_id → tenant_id; NameClaimType = "sub"),
 * so UI-side guards agree with server-side authorization.
 *
 * Security note: role checks here are for UI affordances ONLY. The backend
 * enforces authorization independently — never trust the client for security.
 */
export interface PortalSession {
  /** Stable Keycloak subject — the global identity (anchored on National ID). */
  sub: string;
  /** Flattened from organization.<alias>.tenant_id. The active tenant context. */
  tenantId: string;
  /** The Keycloak Organization alias the token is scoped to. */
  orgAlias: string;
  /** Realm roles from realm_access.roles (e.g. "broker", "customer"). UI gating only. */
  roles: string[];
  name?: string;
  email?: string;
  /** OAuth access token — sealed in the cookie, forwarded server-side as Bearer. Never sent to the browser. */
  accessToken: string;
  refreshToken?: string;
  /** Epoch seconds when the access token expires. */
  expiresAt: number;
}

export const ROLE = {
  BROKER: 'broker',
  CUSTOMER: 'customer',
} as const;

export type PortalRole = (typeof ROLE)[keyof typeof ROLE];

export function hasRole(session: PortalSession | null, role: PortalRole): boolean {
  return !!session && session.roles.includes(role);
}
