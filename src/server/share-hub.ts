import 'server-only';
import { serverJson } from '@/server/api-client';
import type { ReferralDeveloper } from '@/components/broker/ReferralLinks';

/**
 * Referral share-hub data: a developer's PUBLIC projects + the directory that maps a developer's
 * tenant id → its public domain. Shared by the leads page and the membership-hub home so both build
 * the broker's shareable links the same way.
 */
export interface DirectoryDeveloper {
  id: number;
  name: string;
  nameInEnglish?: string;
  domain?: string;
}

interface PublicProjectOption {
  id: number;
  name?: string;
  nameEn?: string;
  status?: number | string;
  isPublic?: boolean;
}

export async function getDevelopers(): Promise<DirectoryDeveloper[]> {
  try {
    return (await serverJson<DirectoryDeveloper[]>('identity', 'broker/developers')) ?? [];
  } catch {
    return [];
  }
}

/** The one developer for a dedicated (single-developer) deployment. */
export async function getSingleDeveloper(): Promise<DirectoryDeveloper | null> {
  const devs = await getDevelopers();
  return devs[0] ?? null;
}

/**
 * A developer's PUBLIC projects. The monolith resolves tenant from x-tenant-id, so we address the
 * developer by their tenant id. Public + anonymous — only called for developers this broker is
 * approved with. Falls back to [] (general link only) if unreachable.
 */
export async function fetchDeveloperProjects(
  tenantId: number,
): Promise<{ id: number; name: string }[]> {
  try {
    const res = await serverJson<{ projects?: PublicProjectOption[] }>(
      'monolith',
      'public/projects/options',
      { anonymous: true, headers: { 'x-tenant-id': String(tenantId) } },
    );
    return (res?.projects ?? [])
      .filter((p) => p.isPublic !== false && p.status !== 2 && String(p.status) !== 'SoldOut')
      .map((p) => ({ id: p.id, name: p.name || p.nameEn || `#${p.id}` }));
  } catch {
    return [];
  }
}

/** Build the referral share hub for the broker's APPROVED developers (directory + public projects). */
export async function buildShareHub(
  code: string | undefined,
  approved: { developerTenantId: number; developerName?: string }[],
): Promise<ReferralDeveloper[]> {
  if (!code || !approved.length) return [];
  const dir = await getDevelopers();
  const domainById = new Map(dir.map((d) => [d.id, d.domain]));
  return Promise.all(
    approved.map(async (a) => {
      const domain = domainById.get(a.developerTenantId);
      return {
        name: a.developerName ?? `#${a.developerTenantId}`,
        domain,
        projects: domain ? await fetchDeveloperProjects(a.developerTenantId) : [],
      };
    }),
  );
}
