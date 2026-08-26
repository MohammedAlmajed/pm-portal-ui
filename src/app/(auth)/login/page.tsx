import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

const ERRORS: Record<string, string> = {
  state_mismatch: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول من جديد.',
  exchange_failed: 'تعذّر إكمال تسجيل الدخول. حاول مرة أخرى.',
  invalid_response: 'استجابة غير صالحة من مزوّد الهوية.',
  access_denied: 'تم رفض الوصول.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; error?: string; registered?: string }>;
}) {
  const { returnTo = '/broker', error, registered } = await searchParams;
  const loginHref = `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
  const errorMsg = error ? (ERRORS[error] ?? 'حدث خطأ أثناء تسجيل الدخول.') : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-brand text-on-brand">
            <span className="text-lg font-bold">و</span>
          </div>
          <CardTitle>بوابة الوسطاء</CardTitle>
          <CardDescription>سجّل الدخول للوصول إلى ملفك وطلباتك.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {registered ? (
            <p className="rounded-md bg-success-subtle px-3 py-2 text-sm text-success">
              تم إنشاء حسابك بنجاح. سجّل الدخول لإكمال ملفك.
            </p>
          ) : null}
          {errorMsg ? (
            <p className="rounded-md bg-danger-subtle px-3 py-2 text-sm text-danger">{errorMsg}</p>
          ) : null}
          <Link
            href={loginHref}
            className="inline-flex h-11 items-center justify-center rounded-md bg-brand text-sm font-medium text-on-brand transition-colors hover:bg-brand-hover"
          >
            تسجيل الدخول
          </Link>
          <p className="text-center text-xs text-muted">
            لست وسيطًا مسجّلًا؟{' '}
            <Link href="/register" className="text-brand">
              أنشئ حسابك
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
