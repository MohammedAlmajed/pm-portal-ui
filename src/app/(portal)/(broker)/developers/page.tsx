import { Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { ApplyButton } from '@/components/broker/ApplyButton';
import { redirect } from 'next/navigation';
import { serverJson } from '@/server/api-client';
import { getBrokerStatus } from '@/server/broker-status';
import { env } from '@/lib/env';

type ApplicationStatus = 'Pending' | 'Approved' | 'Rejected';

export const metadata = { title: 'المطوّرون' };

/**
 * Developer directory — the platform-level list of developers a broker can apply to.
 * SECURE path: served by pm-Identity's [BrokerOnly] GET /broker/developers (external-actor
 * Keycloak scheme + broker role), which fetches the tenant list from the monolith over
 * internal Dapr. No anonymous/cross-tenant public exposure. The BFF/api-client attaches the
 * broker's Bearer token automatically (do NOT pass anonymous).
 * TODO(opt-in): backend to filter to tenants that opted into receiving broker applications.
 * TODO(submit): "قدّم طلبًا" → POST the broker application ([BrokerOnly]).
 */
interface Developer {
  id: number;
  name: string;
  nameInEnglish?: string;
  domain?: string;
}

export default async function DevelopersPage() {
  // Single-developer deployment has no directory — the home membership hub is the front door.
  if (env.portal.singleDeveloper) redirect('/');

  let developers: Developer[] = [];
  let failed = false;
  try {
    developers = await serverJson<Developer[]>('identity', 'broker/developers');
  } catch {
    failed = true;
  }

  // A broker can only apply with a COMPLETE profile (FAL number + document). getBrokerStatus also
  // gives us the broker's applications so we can show the current status per developer.
  const status = await getBrokerStatus();
  const profileComplete = status.profileComplete;

  // Latest application status per developer (a re-applied developer may have an old Rejected + a new
  // Pending — the most recent one wins).
  const statusByDev = new Map<number, ApplicationStatus>();
  const byNewest = [...status.applications].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
  for (const a of byNewest) {
    if (statusByDev.has(a.developerTenantId)) continue;
    if (a.status === 'Pending' || a.status === 'Approved' || a.status === 'Rejected') {
      statusByDev.set(a.developerTenantId, a.status);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="text-xl font-semibold text-foreground">المطوّرون</h2>
        <p className="mt-1 text-sm text-muted">
          اختر مطوّرًا وقدّم ملفك للانضمام. يراجع كل مطوّر الطلبات بنفسه.
        </p>
      </section>

      {!failed && developers.length > 0 && !profileComplete ? (
        <Card className="border-warning/30 bg-warning-subtle p-4 text-sm text-warning">
          لإكمال التقديم، أكمل ملفك المهني أولًا (رقم رخصة فال ووثيقتها) من صفحة «الملف الشخصي».
        </Card>
      ) : null}

      {failed ? (
        <Card className="p-6 text-sm text-muted">
          تعذّر تحميل قائمة المطوّرين حاليًا. حاول مرة أخرى لاحقًا.
        </Card>
      ) : developers.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted">لا يوجد مطوّرون متاحون حاليًا.</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {developers.map((dev) => (
            <Card key={dev.id}>
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-surface-sunken text-muted">
                  <Building2 size={20} />
                </div>
                <CardTitle>{dev.name}</CardTitle>
                {dev.nameInEnglish || dev.domain ? (
                  <CardDescription dir="ltr" className="text-start">
                    {dev.nameInEnglish ?? dev.domain}
                  </CardDescription>
                ) : null}
              </CardHeader>
              <CardContent>
                <ApplyButton
                  developerTenantId={dev.id}
                  profileComplete={profileComplete}
                  currentStatus={statusByDev.get(dev.id)}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
