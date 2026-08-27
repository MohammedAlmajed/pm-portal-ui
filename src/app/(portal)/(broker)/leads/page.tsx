import { Card } from '@/components/ui/Card';
import { serverJson } from '@/server/api-client';
import { ReferralLinks } from '@/components/broker/ReferralLinks';
import { OnboardingSteps } from '@/components/broker/OnboardingSteps';
import { LeadsList, type Lead } from '@/components/broker/LeadsList';
import { getBrokerStatus } from '@/server/broker-status';
import { buildShareHub } from '@/server/share-hub';

export const metadata = { title: 'المهتمّين' };

/**
 * The broker's own leads — interest requests attributed to this broker via their referral code.
 * Served by pm-Identity's [BrokerOnly] GET /broker/leads, aggregated cross-tenant. This page (leads
 * + referral share hub) is GATED: it unlocks only once a developer has approved the broker.
 */
export default async function LeadsPage() {
  const status = await getBrokerStatus();

  const header = (
    <section>
      <h2 className="text-xl font-semibold text-foreground">المهتمّين</h2>
      <p className="mt-1 text-sm text-muted">
        من وصلوا عبر روابط الإحالة الخاصة بك، وحالة كل منهم.
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
        <Kpi label="إجمالي المهتمّين" value={leads.length} />
        <Kpi label="مهتمّون" value={interested} tone="success" />
        <Kpi
          label="نسبة الاهتمام"
          value={leads.length ? `${Math.round((interested / leads.length) * 100)}%` : '—'}
        />
      </div>

      {failed ? (
        <Card className="p-6 text-sm text-muted">تعذّر تحميل المهتمّين حاليًا.</Card>
      ) : leads.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-10 text-center">
          <p className="text-sm font-medium text-foreground">لا يوجد مهتمّون بعد</p>
          <p className="max-w-sm text-sm text-muted">
            شارك رابط الإحالة الخاص بك — سيظهر هنا كل عميل يسجّل اهتمامه عبره.
          </p>
        </Card>
      ) : (
        <LeadsList leads={leads} />
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
