import Link from 'next/link';
import { AuthShell } from '@/components/layout/AuthShell';
import { env } from '@/lib/env';

const ERRORS: Record<string, string> = {
  state_mismatch: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول من جديد.',
  exchange_failed: 'تعذّر إكمال تسجيل الدخول. حاول مرة أخرى.',
  invalid_response: 'استجابة غير صالحة من مزوّد الهوية.',
  access_denied: 'تم رفض الوصول.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; error?: string; registered?: string; verify?: string }>;
}) {
  const { returnTo = '/', error, registered, verify } = await searchParams;
  const loginHref = `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
  const errorMsg = error ? (ERRORS[error] ?? 'حدث خطأ أثناء تسجيل الدخول.') : null;

  return (
    <AuthShell>
      <h1 className="text-xl font-bold text-foreground">{env.brand.name}</h1>
      <p className="mt-1 text-sm text-muted">سجّل الدخول للوصول إلى ملفك وطلباتك.</p>

      <div className="mt-6 flex flex-col gap-4">
        {verify ? (
          <p className="rounded-md bg-success-subtle px-3 py-2 text-sm text-success">
            تم إنشاء حسابك. أرسلنا رابط تفعيل إلى بريدك الإلكتروني — فعّل حسابك ثم سجّل الدخول.
          </p>
        ) : registered ? (
          <p className="rounded-md bg-success-subtle px-3 py-2 text-sm text-success">
            تم إنشاء حسابك بنجاح. سجّل الدخول لإكمال ملفك.
          </p>
        ) : null}
        {errorMsg ? (
          <p className="rounded-md bg-danger-subtle px-3 py-2 text-sm text-danger">{errorMsg}</p>
        ) : null}
        {/* Hard navigation (NOT next/link): the OIDC flow redirects cross-origin to Keycloak and
            the callback must Set-Cookie on a top-level navigation. A <Link> would do an RSC fetch
            (CORS-blocked, cookie never lands) — that caused the login loop. */}
        <a
          href={loginHref}
          className="inline-flex h-11 items-center justify-center rounded-md bg-brand text-sm font-medium text-on-brand transition-colors hover:bg-brand-hover"
        >
          تسجيل الدخول
        </a>
        <p className="text-center text-xs text-muted">
          لست وسيطًا مسجّلًا؟{' '}
          <Link href="/register" className="font-medium text-brand hover:underline">
            أنشئ حسابك
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
