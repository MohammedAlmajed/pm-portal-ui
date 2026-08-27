import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { serverJson } from '@/server/api-client';
import { ReferralLinks, type ReferralDeveloper } from '@/components/broker/ReferralLinks';
import { OnboardingSteps } from '@/components/broker/OnboardingSteps';
import { getBrokerStatus } from '@/server/broker-status';

export const metadata = { title: 'العملاء المحتملون' };

/**
 * The broker's own leads — interest requests attributed to this broker via their referral code.
 * Served by pm-Identity's [BrokerOnly] GET /broker/leads, aggregated cross-tenant. This page (leads
 * + referral share hub) is GATED: it unlocks only once a developer has approved the broker.
 */
type LeadStatus = 'New' | 'Contacted' | 'NoResponse' | 'Interested' | 'NotInterested';

interface Lead {
  id: number;
  customerName: string;
  projectName?: string;
  developerName?: string;
  status: LeadStatus;
  createdAt: string;
}

const STATUS_LABEL: Record<LeadStatus, string> = {
  New: 'جديد',
  Contacted: 'تم التواصل',
  NoResponse: 'لا يوجد رد',
  Interested: 'مهتم',
  NotInterested: 'غير مهتم',
};
const STATUS_TONE = {
  New: 'info',
  Contacted: 'brand',
  NoResponse: 'neutral',
  Interested: 'success',
  NotInterested: 'danger',
} as const;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar', { year: 'numeric', month: 'long', day: 'numeric' });
}

interface DirectoryDeveloper {
  id: number;
  domain?: string;
}
// Shape of the developer's public /public/projects/options (only the bits we surface).
interface PublicProjectOption {
  id: number;
  name?: string;
  nameEn?: string;
  status?: number | string;
  isPublic?: boolean;
}

/**
 * Fetch a developer's PUBLIC projects. The monolith resolves tenant from x-tenant-id, so we
 * address the developer by their tenant id (from the broker directory). Public + anonymous —
 * we only ever call it for developers this broker has been approved with.
 */
async function fetchDeveloperProjects(tenantId: number): Promise<{ id: number; name: string }[]> {
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
    return []; // developer unreachable / no public projects — fall back to the general link only
  }
}

/** Build the referral share hub for the broker's APPROVED developers (directory + public projects). */
async function buildShareHub(
  code: string | undefined,
  approved: { developerTenantId: number; developerName?: string }[],
): Promise<ReferralDeveloper[]> {
  if (!code || !approved.length) return [];
  try {
    const dir = (await serverJson<DirectoryDeveloper[]>('identity', 'broker/developers')) ?? [];
    const domainById = new Map(dir.map((d) => [d.id, d.domain]));
    return await Promise.all(
      approved.map(async (a) => {
        const domain = domainById.get(a.developerTenantId);
        return {
          name: a.developerName ?? `#${a.developerTenantId}`,
          domain,
          projects: domain ? await fetchDeveloperProjects(a.developerTenantId) : [],
        };
      }),
    );
  } catch {
    return [];
  }
}

export default async function LeadsPage() {
  const status = await getBrokerStatus();

  const header = (
    <section>
      <h2 className="text-xl font-semibold text-foreground">العملاء المحتملون</h2>
      <p className="mt-1 text-sm text-muted">
        العملاء الذين وصلوا عبر روابط الإحالة الخاصة بك، وحالة كل منهم.
      </p>
    </section>
  );

  // Gate: the leads view + referral share hub unlock only after a developer approves the broker.
  if (!status.hasApproved) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <OnboardingSteps stage={status.stage} />
      </div>
    );
  }

  let leads: Lead[] = [];
  let failed = false;
  try {
    leads = await serverJson<Lead[]>('identity', 'broker/leads');
  } catch {
    failed = true;
  }

  const approved = status.applications.filter((a) => a.status === 'Approved');
  const developers = await buildShareHub(status.referralCode, approved);
  const interested = leads.filter((l) => l.status === 'Interested').length;

  return (
    <div className="flex flex-col gap-6">
      {header}

      <ReferralLinks code={status.referralCode} developers={developers} />

      {/* KPI row — a fuller dashboard (charts) comes with the dataviz pass. */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="إجمالي العملاء المحتملين" value={leads.length} />
        <Kpi label="مهتمّون" value={interested} tone="success" />
        <Kpi
          label="نسبة الاهتمام"
          value={leads.length ? `${Math.round((interested / leads.length) * 100)}%` : '—'}
        />
      </div>

      {failed ? (
        <Card className="p-6 text-sm text-muted">تعذّر تحميل العملاء المحتملين حاليًا.</Card>
      ) : leads.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-10 text-center">
          <p className="text-sm font-medium text-foreground">لا يوجد عملاء محتملون بعد</p>
          <p className="max-w-sm text-sm text-muted">
            شارك رابط الإحالة الخاص بك — سيظهر هنا كل عميل يسجّل اهتمامه عبره.
          </p>
        </Card>
      ) : (
        <Card className="divide-y divide-border">
          {leads.map((l) => (
            <div key={l.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{l.customerName}</p>
                <p className="truncate text-xs text-muted">
                  {[l.projectName, l.developerName].filter(Boolean).join(' · ')}
                  {l.projectName || l.developerName ? ' · ' : ''}
                  <span className="num">{fmtDate(l.createdAt)}</span>
                </p>
              </div>
              <Badge tone={STATUS_TONE[l.status]}>{STATUS_LABEL[l.status]}</Badge>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string | number; tone?: 'success' }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={`num mt-1 text-2xl font-semibold ${tone === 'success' ? 'text-success' : 'text-foreground'}`}>
        {value}
      </p>
    </Card>
  );
}
