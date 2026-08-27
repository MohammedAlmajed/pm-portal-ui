import Link from 'next/link';
import { UserCircle, Building2, FileText, Users, ArrowLeft, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { OnboardingSteps } from '@/components/broker/OnboardingSteps';
import { getBrokerStatus } from '@/server/broker-status';

export const metadata = { title: 'الرئيسية' };

/**
 * Broker dashboard. Leads with the onboarding stepper (profile → apply → approval); the "active"
 * surfaces (leads / referral links) unlock only once a developer has approved the broker.
 */
export default async function BrokerHomePage() {
  const status = await getBrokerStatus();

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="text-xl font-semibold text-foreground">مرحبًا بك 👋</h2>
        <p className="mt-1 text-sm text-muted">
          تابع خطوات انضمامك كوسيط معتمد أدناه.
        </p>
      </section>

      <OnboardingSteps stage={status.stage} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickCard
          href="/broker/profile"
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
          href="/broker/developers"
          icon={<Building2 size={20} />}
          title="المطوّرون"
          description="تصفّح المطوّرين وقدّم طلبك للانضمام"
        />
        <QuickCard
          href="/broker/applications"
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
        {/* Leads unlocks on approval */}
        <QuickCard
          href={status.hasApproved ? '/broker/leads' : undefined}
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
    <Card
      className={cnCard(!!href)}
    >
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

function cnCard(clickable: boolean) {
  return `h-full${clickable ? ' transition-shadow group-hover:shadow-md' : ''}`;
}
