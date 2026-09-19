import { Building2, ExternalLink, Briefcase } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { OnboardingSteps } from '@/components/broker/OnboardingSteps';
import { getBrokerStatus } from '@/server/broker-status';
import { buildShareHub } from '@/server/share-hub';

export const metadata = { title: 'مشاريعي' };

/**
 * The broker's authorized projects — read-only, for information and record. Works in both single-
 * and multi-developer portals: projects are grouped by the developers that approved the broker, and
 * follow each developer's project-access assignment (All → every public project; Specific → only the
 * assigned ones). No referral/lead framing — this is a management view. Gated on approval.
 */
export default async function BrokerProjectsPage() {
  const status = await getBrokerStatus();

  const header = (
    <section>
      <h2 className="text-xl font-semibold text-foreground">مشاريعي</h2>
      <p className="mt-1 text-sm text-muted">المشاريع المعتمدة لك للعمل عليها لدى المطوّرين.</p>
    </section>
  );

  // Gate: this view unlocks only once a developer approves the broker.
  if (!status.hasApproved) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <OnboardingSteps stage={status.stage} />
      </div>
    );
  }

  const approved = status.applications.filter((a) => a.status === 'Approved');
  const developers = (await buildShareHub(status.referralCode, approved)).filter(
    (d) => d.projects.length > 0,
  );

  return (
    <div className="flex flex-col gap-6">
      {header}

      {developers.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-subtle text-brand">
            <Briefcase size={22} />
          </span>
          <p className="text-sm font-medium text-foreground">لا توجد مشاريع متاحة لك حاليًا</p>
          <p className="max-w-md text-sm text-muted">
            لم يُخصّص لك المطوّر أي مشاريع بعد. تواصل معه لمعرفة المزيد.
          </p>
        </Card>
      ) : (
        developers.map((dev) => (
          <section key={dev.name} className="flex flex-col gap-3">
            {developers.length > 1 ? (
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-muted" aria-hidden />
                <h3 className="text-sm font-semibold text-foreground">{dev.name}</h3>
                <span className="num text-xs text-muted">({dev.projects.length})</span>
              </div>
            ) : null}
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {dev.projects.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2.5"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Building2 size={16} className="shrink-0 text-muted" aria-hidden />
                    <span className="truncate text-sm text-foreground">{p.name}</span>
                  </span>
                  {dev.domain ? (
                    <a
                      href={`https://${dev.domain}/project/${p.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand hover:underline"
                    >
                      عرض <ExternalLink size={13} />
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
