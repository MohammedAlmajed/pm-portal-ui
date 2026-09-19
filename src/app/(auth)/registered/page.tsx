import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { AuthShell } from '@/components/layout/AuthShell';

export const metadata = { title: 'تم إنشاء الحساب' };
// Per-request so the white-label brand reflects the deploy's ConfigMap.
export const dynamic = 'force-dynamic';

/**
 * Dedicated thank-you page after ACCOUNT signup — replaces the old "redirect to login + side banner"
 * so the success is its own moment. When email verification is required, it points the broker to
 * their inbox first; otherwise straight to sign-in.
 */
export default async function RegisteredPage({
  searchParams,
}: {
  searchParams: Promise<{ verify?: string }>;
}) {
  const { verify } = await searchParams;

  return (
    <AuthShell>
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="text-success" size={36} />
        </div>
        <h1 className="text-xl font-bold text-foreground">تم إنشاء حسابك</h1>
        <p className="mt-1 text-sm text-muted">شكراً لتسجيلك معنا 🌟</p>

        <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-muted">
          {verify
            ? 'أرسلنا رابط تفعيل إلى بريدك الإلكتروني. فعّل حسابك ثم سجّل الدخول لإكمال ملفك ورفع وثيقة رخصة فال.'
            : 'سجّل الدخول لإكمال ملفك ورفع وثيقة رخصة فال، ثم قدّم طلب انضمامك للمطوّرين.'}
        </p>

        <Link
          href="/login"
          className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-brand text-sm font-medium text-on-brand transition-colors hover:bg-brand-hover"
        >
          تسجيل الدخول
        </Link>
      </div>
    </AuthShell>
  );
}
