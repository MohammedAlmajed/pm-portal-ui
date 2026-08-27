import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { serverJson } from '@/server/api-client';
import { env } from '@/lib/env';
import { WithdrawButton } from '@/components/broker/WithdrawButton';

export const metadata = { title: 'طلباتي' };

/**
 * Broker's applications across developers — one row per BrokerApplication, scoped to the
 * authenticated broker (backend filters by token sub). GET /broker/applications ([BrokerOnly]).
 */
type AppStatus = 'Pending' | 'Approved' | 'Rejected' | 'Revoked' | 'Withdrawn';

interface BrokerApplication {
  id: number;
  developerTenantId: number;
  developerName?: string;
  status: AppStatus;
  submittedAt: string;
  rejectionReason?: string;
}

const STATUS_LABEL: Record<AppStatus, string> = {
  Pending: 'قيد المراجعة',
  Approved: 'مقبول',
  Rejected: 'مرفوض',
  Revoked: 'أُلغي الاعتماد',
  Withdrawn: 'مسحوب',
};
const STATUS_TONE = {
  Pending: 'warning',
  Approved: 'success',
  Rejected: 'danger',
  Revoked: 'warning',
  Withdrawn: 'neutral',
} as const;

export default async function ApplicationsPage() {
  // Single-developer deployment tracks its one application on the home hub, not a list.
  if (env.portal.singleDeveloper) redirect('/');

  let apps: BrokerApplication[] = [];
  let failed = false;
  try {
    apps = await serverJson<BrokerApplication[]>('identity', 'broker/applications');
  } catch {
    failed = true;
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="text-xl font-semibold text-foreground">طلباتي</h2>
        <p className="mt-1 text-sm text-muted">تابع حالة طلباتك لدى المطوّرين.</p>
      </section>

      {failed ? (
        <Card className="p-6 text-sm text-muted">تعذّر تحميل الطلبات حاليًا. حاول مرة أخرى لاحقًا.</Card>
      ) : apps.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-10 text-center">
          <p className="text-sm font-medium text-foreground">لا توجد طلبات بعد</p>
          <p className="max-w-sm text-sm text-muted">
            أكمل ملفك ثم قدّم طلبًا إلى أحد المطوّرين من صفحة «المطوّرون».
          </p>
        </Card>
      ) : (
        <Card className="divide-y divide-border">
          {apps.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {a.developerName ?? `مطوّر #${a.developerTenantId}`}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  قُدّم في{' '}
                  {new Date(a.submittedAt).toLocaleDateString('ar', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                {(a.status === 'Rejected' || a.status === 'Revoked') && a.rejectionReason ? (
                  <p className="mt-0.5 text-xs text-danger">{a.rejectionReason}</p>
                ) : null}
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Badge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                {a.status === 'Pending' ? <WithdrawButton applicationId={a.id} /> : null}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
