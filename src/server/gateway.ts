import 'server-only';

/**
 * Logical service key → gateway route prefix. The portal talks to backend
 * microservices only through the API gateway; these prefixes match the gateway's
 * routing table. Add a service here rather than hardcoding prefixes at call sites.
 */
export const SERVICE_PREFIX = {
  identity: 'id', // pm-Identity (broker profile/application domain)
  sale: 's',
  contracts: 'contracts',
  engagement: 'ce', // PM-CustomerEngagement (leads)
  media: 'media',
  financials: 'fin',
  notification: 'notify',
  // The majestic monolith sits at the gateway ROOT (its controllers, e.g. /public/*,
  // have no service prefix). Empty prefix → target is `${gateway}/<path>`.
  // TODO(verify): confirm against the real gateway/ingress routing table.
  monolith: '',
} as const;

export type ServiceKey = keyof typeof SERVICE_PREFIX;

/** Allow-list check for the BFF proxy so callers can't reach arbitrary hosts. */
export function isKnownService(key: string): key is ServiceKey {
  return key in SERVICE_PREFIX;
}

/**
 * DEV-ONLY direct service map (no gateway). In development the BFF talks straight to each
 * service's localhost port and DROPS the gateway prefix (services host their routes at root,
 * e.g. pm-Identity serves /broker/profile, not /id/broker/profile). Mirrors the old UI's
 * ServiceMapper. In production the gateway (SERVICE_PREFIX) is used instead.
 * Ports per the workspace CLAUDE.md service table.
 */
export const DEV_SERVICE_PORTS: Record<ServiceKey, number> = {
  identity: 5010,
  sale: 5011,
  contracts: 5003,
  engagement: 5001,
  media: 5104,
  financials: 5013,
  notification: 5012,
  monolith: 8000,
};
