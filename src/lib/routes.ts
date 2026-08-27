/**
 * Single source of truth for the portal's page paths. The broker experience lives at the
 * APP ROOT (each actor gets its own subdomain, e.g. broker.<tenant>), so there is no "/broker"
 * URL prefix. Keeping paths here means a future base-path or a second actor is a one-line change.
 *
 * NOTE: these are FRONTEND routes. Backend/BFF paths (e.g. `identity`/`broker/profile`) are
 * unrelated and live in server/gateway + api-client.
 */
export const routes = {
  home: '/',
  profile: '/profile',
  developers: '/developers',
  applications: '/applications',
  leads: '/leads',
  join: '/join',
} as const;

/** Paths that do NOT require a session (everything else in the app does). */
export const PUBLIC_PATHS = ['/login', '/register', '/forbidden'] as const;
