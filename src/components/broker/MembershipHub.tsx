import Link from 'next/link';
import {
  Building2,
  Clock,
  ArrowLeft,
  UserCircle,
  FileCheck,
  Briefcase,
  RotateCcw,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { JoinButton } from '@/components/broker/JoinButton';
import { WithdrawButton } from '@/components/broker/WithdrawButton';
import type { ReferralDeveloper } from '@/components/broker/ReferralLinks';
import type { BrokerStatus } from '@/server/broker-status';

/**
 * The single-developer membership hub — the home of a dedicated broker portal. The portal IS one
 * developer, so joining is the front door (not a directory to browse). Branches on the broker's
 * stage: join → pending → (approved workspace | rejected). This is a management module: once
 * approved, the broker sees the projects they're authorized to work — read-only, for information
 * and record. (Deal/sales flows come later.)
 */
export function MembershipHub({
  status,
  developerName,
  developerTenantId,
  developers,
}: {
  status: BrokerStatus;
  developerName: string;
  developerTenantId: number | null;
  developers: ReferralDeveloper[];
}) {
  const submittedAt = latestSubmittedAt(status);
  const pendingId = status.applications.find((a) => a.status === 'Pending')?.id;

  if (status.stage === 'approved') {
    return <ApprovedWorkspace developerName={developerName} developers={developers} />;
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
              صدور القرار، وستُتاح لك حينها المشاريع المعتمدة للعمل عليها.
            </p>
          </div>
          {pendingId ? <WithdrawButton applicationId={pendingId} /> : null}
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
            قدّم طلب انضمامك، وبعد اعتمادك تُتاح لك مشاريع المطوّر للعمل عليها.
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
          <Step icon={<Briefcase size={20} />} title="ابدأ العمل" body="بعد الاعتماد تُتاح لك المشاريع المعتمدة." />
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
  developers,
}: {
  developerName: string;
  developers: ReferralDeveloper[];
}) {
  // In a single-developer portal this is one developer; flatten to the projects the broker may work.
  const projects = developers.flatMap((d) => d.projects);

  return (
    <div className="flex flex-col gap-6">
      <section className="animate-fade-up flex flex-col gap-1">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-success-subtle px-3 py-1 text-xs font-medium text-success">
          وسيط معتمد ✓
        </span>
        <h1 className="mt-2 text-2xl font-bold text-foreground">
          مرحبًا بك في مساحة عملك لدى {developerName}
        </h1>
        <p className="text-sm text-muted">هذه المشاريع المعتمدة لك للعمل عليها.</p>
      </section>

      <Card className="animate-fade-up-2 flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-subtle text-brand">
              <Briefcase size={20} />
            </span>
            <h2 className="text-sm font-semibold text-foreground">المشاريع المتاحة لك</h2>
          </div>
          <span className="num text-sm font-medium text-muted">{projects.length}</span>
        </div>

        {projects.length === 0 ? (
          <p className="text-sm text-muted">لا توجد مشاريع متاحة لك حاليًا. تواصل مع المطوّر لمعرفة المزيد.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {projects.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground"
              >
                <Building2 size={16} className="shrink-0 text-muted" aria-hidden />
                <span className="truncate">{p.name}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
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
