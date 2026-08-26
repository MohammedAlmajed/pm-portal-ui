import 'server-only';
import { serverJson } from '@/server/api-client';

/**
 * The broker's onboarding stage, derived from their global profile + per-developer applications.
 * Drives what the portal unlocks: the "active broker" surfaces (leads + referral share hub) open
 * only once at least one developer has APPROVED the broker.
 */
export type BrokerStage =
  | 'profile-incomplete' // no complete profile yet (FAL missing)
  | 'no-applications' // profile ready, hasn't applied to any developer
  | 'pending' // applied, awaiting a developer's decision
  | 'approved' // approved by at least one developer -> active
  | 'rejected-only'; // applied but all decisions were rejections

export interface BrokerApplicationItem {
  id: number;
  developerTenantId: number;
  developerName?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | string;
  submittedAt: string;
  rejectionReason?: string;
}

export interface BrokerStatus {
  profileComplete: boolean;
  referralCode?: string;
  applications: BrokerApplicationItem[];
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  hasApproved: boolean;
  stage: BrokerStage;
}

export async function getBrokerStatus(): Promise<BrokerStatus> {
  let profileComplete = false;
  let referralCode: string | undefined;
  try {
    const p = await serverJson<{
      falLicenseNumber?: string;
      falLicenseMediaId?: number;
      referralCode?: string;
    } | null>('identity', 'broker/profile');
    profileComplete = !!(p && p.falLicenseNumber && p.falLicenseMediaId);
    referralCode = p?.referralCode;
  } catch {
    /* no profile yet */
  }

  let applications: BrokerApplicationItem[] = [];
  try {
    applications = (await serverJson<BrokerApplicationItem[]>('identity', 'broker/applications')) ?? [];
  } catch {
    /* none */
  }

  const approvedCount = applications.filter((a) => a.status === 'Approved').length;
  const pendingCount = applications.filter((a) => a.status === 'Pending').length;
  const rejectedCount = applications.filter((a) => a.status === 'Rejected').length;
  const hasApproved = approvedCount > 0;

  let stage: BrokerStage;
  if (!profileComplete) stage = 'profile-incomplete';
  else if (applications.length === 0) stage = 'no-applications';
  else if (hasApproved) stage = 'approved';
  else if (pendingCount > 0) stage = 'pending';
  else stage = 'rejected-only';

  return {
    profileComplete,
    referralCode,
    applications,
    approvedCount,
    pendingCount,
    rejectedCount,
    hasApproved,
    stage,
  };
}
