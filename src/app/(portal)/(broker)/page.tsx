import Link from 'next/link';
import { UserCircle, Building2, FileText, Users, ArrowLeft, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { OnboardingSteps } from '@/components/broker/OnboardingSteps';
import { MembershipHub } from '@/components/broker/MembershipHub';
import { getBrokerStatus } from '@/server/broker-status';
import { getSingleDeveloper, buildShareHub } from '@/server/share-hub';
import { serverJson } from '@/server/api-client';
import { env } from '@/lib/env';
import { routes } from '@/lib/routes';

export const metadata = { title: 'الرئيسية' };

export default async function BrokerHomePage() {
  const status = await getBrokerStatus();

  // Dedicated single-developer deployment → the membership hub (join front door / workspace).
  if (env.portal.singleDeveloper) {
    const dev = await getSingleDeveloper();
    let shareDevelopers: Awaited<ReturnType<typeof buildShareHub>> = [];
    let leadsCount = 0;
    if (status.stage === 'approved') {
      const approved = status.applications.filter((a) => a.status === 'Approved');
      shareDevelopers = await buildShareHub(status.referralCode, approved);
      try {
        const leads = await serverJson<unknown[]>('identity', 'broker/leads');
        leadsCount = leads?.length ?? 0;
      } catch {
        /* leads unavailable */
      }
    }
    return (
      <MembershipHub
        status={status}
        developerName={dev?.name ?? env.brand.name}
        developerTenantId={dev?.id ?? null}
        shareDevelopers={shareDevelopers}
        leadsCount={leadsCount}
      />
    );
  }

  // Shared multi-developer portal → the marketplace dashboard.
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="text-xl font-semibold text-foreground">مرحبًا بك 👋</h2>
        <p className="mt-1 text-sm text-muted">تابع خطوات انضمامك كوسيط معتمد أدناه.</p>
      </section>

      <OnboardingSteps stage={status.stage} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickCard
          href={routes.profile}
          icon={<UserCircle size={20} />}
          title="ملفي المهني"
          description="الاسم، الهوية، رخصة فال، سنوات الخبرة"
          badge={
            status.profileComplete ? (
              <Badge tone="success">مكتمل</Badge>
            ) : (
              <Badge tone="warning">غير مكتمل</Badge>
            )
          }
        />
        <QuickCard
          href={routes.developers}
          icon={<Building2 size={20} />}
          title="المطوّرون"
          description="تصفّح المطوّرين وقدّم طلبك للانضمام"
        />
        <QuickCard
          href={routes.applications}
          icon={<FileText size={20} />}
          title="طلباتي"
          description="تابع حالة الطلبات: قيد المراجعة / مقبول / مرفوض"
          badge={
            status.approvedCount > 0 ? (
              <Badge tone="success">{`${status.approvedCount} مقبول`}</Badge>
            ) : status.pendingCount > 0 ? (
              <Badge tone="info">{`${status.pendingCount} قيد المراجعة`}</Badge>
            ) : undefined
          }
        />
        <QuickCard
          href={status.hasApproved ? routes.leads : undefined}
          icon={status.hasApproved ? <Users size={20} /> : <Lock size={20} />}
          title="العملاء المحتملون"
          description={
            status.hasApproved
              ? 'العملاء الذين وصلوا عبر روابط الإحالة الخاصة بك'
              : 'يُفتح بعد اعتماد أحد المطوّرين لطلبك'
          }
          badge={status.hasApproved ? undefined : <Badge tone="neutral">مقفل</Badge>}
        />
      </div>
    </div>
  );
}

function QuickCard({
  href,
  icon,
  title,
  description,
  badge,
}: {
  href?: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: React.ReactNode;
}) {
  const inner = (
    <Card className={`h-full${href ? ' transition-shadow group-hover:shadow-md' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-subtle text-brand">
            {icon}
          </div>
          {badge}
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {href && (
        <CardContent>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-brand">
            المتابعة <ArrowLeft size={16} />
          </span>
        </CardContent>
      )}
    </Card>
  );

  if (!href) return <div className="opacity-70">{inner}</div>;
  return (
    <Link href={href} className="group">
      {inner}
    </Link>
  );
}
