import { Clock, LogOut, ShieldAlert } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { serverJson } from '@/server/api-client';
import { getSingleDeveloper } from '@/server/share-hub';
import { env } from '@/lib/env';
import type { BrokerStatus } from '@/server/broker-status';
import { FalVerificationBadge } from '@/components/broker/FalVerificationBadge';
import {
  BrokerProfileForm,
  type BrokerProfileValues,
  type BrokerAttachment,
} from '@/components/broker/BrokerProfileForm';

/**
 * Full-screen onboarding gate for a DEDICATED (single-developer) portal. Until the broker is
 * APPROVED this is the only surface they see — no header, no sidebar. Rendered by BrokerLayout in
 * place of the AppShell. States:
 *   • profile incomplete / not yet applied → the profile form with an explicit "send" (locked once sent),
 *   • pending → read-only "under review",
 *   • rejected → reason + editable form + resend.
 * Approved brokers never reach here.
 */
export async function OnboardingGate({ status }: { status: BrokerStatus }) {
  const dev = await getSingleDeveloper();
  const developerName = dev?.name ?? env.brand.name;
  const pending = status.stage === 'pending';

  // Profile feeds both the prefilled form and the pending summary.
  let profile: BrokerProfileValues | null = null;
  let attachments: BrokerAttachment[] = [];
  try {
    profile = (await serverJson<BrokerProfileValues | null>('identity', 'broker/profile')) ?? null;
  } catch {
    /* none yet */
  }
  if (!pending) {
    try {
      attachments =
        (await serverJson<BrokerAttachment[]>('identity', 'broker/profile/attachments')) ?? [];
    } catch {
      /* none */
    }
  }

  const rejectionReason = status.applications.find((a) => a.status === 'Rejected')?.rejectionReason;

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      {/* Minimal brand bar — logo + sign out. No nav: nothing is reachable until approval. */}
      <header className="flex items-center justify-between border-b border-border bg-surface px-5 py-3">
        <span className="flex items-center gap-2">
          <BrandLogo logoUrl={env.brand.logoUrl} mark={env.brand.mark} alt={env.brand.name} size="sm" />
          {!env.brand.logoUrl ? (
            <span className="text-sm font-semibold text-foreground">{env.brand.name}</span>
          ) : null}
        </span>
        {/* Hard navigation (NOT next/link): logout redirects cross-origin to Keycloak; a <Link>
            would RSC-fetch it (CORS-blocked) and even PREFETCH it (logging you out on hover). */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- intentional hard nav to an OIDC route handler, not a page */}
        <a
          href="/api/auth/logout"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <LogOut size={16} /> تسجيل الخروج
        </a>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 py-10 md:py-16">
        <div className="w-full max-w-2xl">
          {pending ? (
            <PendingView developerName={developerName} profile={profile} submittedAt={latestSubmittedAt(status)} />
          ) : (
            <FormView
              developerName={developerName}
              developerTenantId={dev?.id}
              profile={profile}
              attachments={attachments}
              rejectionReason={status.stage === 'rejected-only' ? rejectionReason : undefined}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function PendingView({
  developerName,
  profile,
  submittedAt,
}: {
  developerName: string;
  profile: BrokerProfileValues | null;
  submittedAt: string | null;
}) {
  return (
    <Card className="flex flex-col items-center gap-5 p-8 text-center md:p-10">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-subtle text-brand">
        <Clock size={26} />
      </span>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">طلبك قيد المراجعة</h1>
        <p className="max-w-md text-sm text-muted">
          استلمنا طلب انضمامك إلى <span className="font-medium text-foreground">{developerName}</span>
          {submittedAt ? (
            <>
              {' '}
              بتاريخ <span className="num">{submittedAt}</span>
            </>
          ) : null}
          . سنُعلمك عبر البريد الإلكتروني فور صدور القرار.
        </p>
      </div>

      {profile ? (
        <div className="w-full max-w-md rounded-xl border border-border bg-surface-sunken p-4 text-start">
          <p className="mb-2 text-xs font-medium text-muted">البيانات المُرسَلة</p>
          <dl className="flex flex-col gap-1.5 text-sm">
            <Row label="الاسم" value={profile.fullName} />
            <Row label="رقم الهوية" value={profile.nationalId} />
            <Row label="رقم رخصة فال" value={profile.falLicenseNumber} />
          </dl>
          <div className="mt-3">
            <FalVerificationBadge
              status={profile.falLicenseStatus}
              expiry={profile.falLicenseExpiry}
              holderName={profile.falLicenseHolderName}
            />
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function FormView({
  developerName,
  developerTenantId,
  profile,
  attachments,
  rejectionReason,
}: {
  developerName: string;
  developerTenantId?: number;
  profile: BrokerProfileValues | null;
  attachments: BrokerAttachment[];
  rejectionReason?: string;
}) {
  const rejected = rejectionReason !== undefined;

  if (developerTenantId == null) {
    return (
      <Card className="flex flex-col items-center gap-3 p-10 text-center">
        <ShieldAlert className="text-muted" size={28} />
        <p className="text-sm text-foreground">تعذّر تحميل بيانات المطوّر حاليًا.</p>
        <p className="text-sm text-muted">حدّث الصفحة أو حاول لاحقًا.</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">
          {rejected ? 'لم يُقبل طلبك' : `الانضمام كوسيط لدى ${developerName}`}
        </h1>
        <p className="text-sm text-muted">
          {rejected
            ? 'يمكنك تحديث بياناتك وإعادة الإرسال.'
            : 'أكمل بياناتك المهنية (رخصة فال ووثيقتها) ثم أرسِل طلب انضمامك.'}
        </p>
      </section>

      {rejected && rejectionReason ? (
        <div className="rounded-xl border border-danger/25 bg-danger-subtle p-4">
          <p className="mb-1 text-xs text-danger">سبب عدم القبول</p>
          <p className="text-sm text-foreground">{rejectionReason}</p>
        </div>
      ) : null}

      <Card className="p-6">
        <BrokerProfileForm
          initial={profile}
          initialAttachments={attachments}
          joinDeveloperTenantId={developerTenantId}
          submitLabel={rejected ? 'أعد الإرسال' : 'أرسِل الطلب'}
          confirmNotice="لا يمكن تعديل الطلب بعد إرساله حتى صدور القرار — تأكّد من صحة بياناتك."
        />
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium text-foreground">{value || '—'}</dd>
    </div>
  );
}

function latestSubmittedAt(status: BrokerStatus): string | null {
  const latest = [...status.applications]
    .filter((a) => a.status === 'Pending')
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];
  if (!latest?.submittedAt) return null;
  return new Date(latest.submittedAt).toLocaleDateString('ar', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
