import Link from 'next/link';
import {
  Building2,
  Clock,
  ArrowLeft,
  UserCircle,
  FileCheck,
  Share2,
  Users,
  RotateCcw,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { JoinButton } from '@/components/broker/JoinButton';
import { ReferralLinks, type ReferralDeveloper } from '@/components/broker/ReferralLinks';
import type { BrokerStatus } from '@/server/broker-status';

/**
 * The single-developer membership hub — the home of a dedicated broker portal. The portal IS one
 * developer, so joining is the front door (not a directory to browse). Branches on the broker's
 * stage: join → pending → (approved workspace | rejected). Design is deliberately subject-grounded:
 * a bold brand hero with a building motif, a real membership progression, and the approved state
 * turns into a "promote our projects" workspace.
 */
export function MembershipHub({
  status,
  developerName,
  developerTenantId,
  shareDevelopers,
  leadsCount,
}: {
  status: BrokerStatus;
  developerName: string;
  developerTenantId: number | null;
  shareDevelopers: ReferralDeveloper[];
  leadsCount: number;
}) {
  const submittedAt = latestSubmittedAt(status);

  if (status.stage === 'approved') {
    return (
      <ApprovedWorkspace
        developerName={developerName}
        referralCode={status.referralCode}
        shareDevelopers={shareDevelopers}
        leadsCount={leadsCount}
      />
    );
  }

  if (status.stage === 'pending') {
    return (
      <div className="animate-fade-up">
        <Card className="flex flex-col items-center gap-4 p-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-subtle text-brand">
            <Clock size={26} />
          </span>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-foreground">طلبك قيد المراجعة</h1>
            <p className="max-w-md text-sm text-muted">
              استلمنا طلب انضمامك إلى <span className="font-medium text-foreground">{developerName}</span>
              {submittedAt ? <> بتاريخ <span className="num">{submittedAt}</span></> : null}. سنُعلمك فور
              صدور القرار، وستفتح لك حينها روابط الإحالة ومتابعة المهتمّين.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (status.stage === 'rejected-only') {
    const reason = status.applications.find((a) => a.status === 'Rejected')?.rejectionReason;
    return (
      <div className="flex animate-fade-up flex-col gap-4">
        <Card className="flex flex-col items-center gap-4 p-10 text-center">
          <h1 className="text-2xl font-bold text-foreground">لم يُقبل طلبك حاليًا</h1>
          {reason ? (
            <div className="w-full max-w-md rounded-lg border border-danger/25 bg-danger-subtle p-3 text-start">
              <p className="mb-1 text-xs text-danger">سبب عدم القبول</p>
              <p className="text-sm text-foreground">{reason}</p>
            </div>
          ) : null}
          <p className="max-w-md text-sm text-muted">
            يمكنك تحديث ملفك المهني وإعادة التقديم إلى {developerName}.
          </p>
          <Link
            href="/join"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-6 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-hover"
          >
            <RotateCcw size={17} /> إعادة التقديم
          </Link>
        </Card>
      </div>
    );
  }

  // profile-incomplete OR no-applications → the JOIN front door.
  const profileReady = status.stage === 'no-applications';
  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <section className="animate-fade-up relative overflow-hidden rounded-2xl bg-brand p-8 text-on-brand shadow-sm md:p-12">
        <Building2
          className="pointer-events-none absolute -left-6 -bottom-8 opacity-10"
          size={220}
          strokeWidth={1}
          aria-hidden
        />
        <div className="relative flex max-w-2xl flex-col gap-4">
          <span className="text-sm font-medium opacity-80">{developerName}</span>
          <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl">
            انضمّ كوسيطٍ معتمد لدى {developerName}
          </h1>
          <p className="text-base leading-relaxed opacity-90 md:text-lg">
            روّج مشاريعنا، تابِع المهتمّين، واحصل على رابط إحالة خاص بك — يُنسب إليك كل عميل يصل عبره.
          </p>
          <div className="mt-2">
            {profileReady && developerTenantId != null ? (
              <JoinButton developerTenantId={developerTenantId} label="انضمّ الآن" />
            ) : (
              <Link
                href="/join"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-on-brand px-6 text-sm font-semibold text-brand shadow-sm transition-transform hover:scale-[1.02] active:scale-100"
              >
                ابدأ الانضمام <ArrowLeft size={18} />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* How it works — a real membership progression, not decorative numbering. */}
      <section className="animate-fade-up-2">
        <h2 className="mb-3 text-sm font-semibold text-muted">كيف يعمل</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Step
            icon={<UserCircle size={20} />}
            title="أكمل ملفك المهني"
            body="الاسم، الهوية، ورخصة فال ووثيقتها."
            done={status.profileComplete}
          />
          <Step icon={<FileCheck size={20} />} title="نراجع طلبك" body="يراجع فريق المطوّر طلبك ويصدر قراره." />
          <Step icon={<Share2 size={20} />} title="ابدأ المشاركة والكسب" body="شارك روابط المشاريع وتابع عملاءك." />
        </div>
      </section>
    </div>
  );
}

function Step({
  icon,
  title,
  body,
  done,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  done?: boolean;
}) {
  return (
    <Card className="flex h-full flex-col gap-2 p-4">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
          done ? 'bg-success-subtle text-success' : 'bg-brand-subtle text-brand'
        }`}
      >
        {icon}
      </span>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs leading-relaxed text-muted">{body}</p>
    </Card>
  );
}

function ApprovedWorkspace({
  developerName,
  referralCode,
  shareDevelopers,
  leadsCount,
}: {
  developerName: string;
  referralCode?: string;
  shareDevelopers: ReferralDeveloper[];
  leadsCount: number;
}) {
  return (
    <div className="flex flex-col gap-6">
      <section className="animate-fade-up flex flex-col gap-1">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-success-subtle px-3 py-1 text-xs font-medium text-success">
          وسيط معتمد ✓
        </span>
        <h1 className="mt-2 text-2xl font-bold text-foreground">
          مرحبًا بك في مساحة عملك لدى {developerName}
        </h1>
        <p className="text-sm text-muted">شارك مشاريعنا عبر رابطك الخاص، وتابع كل عميل يصل من خلاله.</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ReferralLinks code={referralCode} developers={shareDevelopers} />
        </div>
        <Link
          href="/leads"
          className="group flex flex-col justify-between gap-4 rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-subtle text-brand">
              <Users size={20} />
            </span>
            <span className="num text-3xl font-bold text-foreground">{leadsCount}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">المهتمّين</p>
            <p className="mt-0.5 text-xs text-muted">من وصلوا عبر روابط الإحالة الخاصة بك.</p>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-brand">
            عرض الكل <ArrowLeft size={16} />
          </span>
        </Link>
      </div>
    </div>
  );
}

function latestSubmittedAt(status: BrokerStatus): string | null {
  const latest = [...status.applications].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  )[0];
  if (!latest?.submittedAt) return null;
  return new Date(latest.submittedAt).toLocaleDateString('ar', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
