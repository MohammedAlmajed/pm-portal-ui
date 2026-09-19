import Link from 'next/link';
import { AuthShell } from '@/components/layout/AuthShell';
import { BrokerRegisterForm } from '@/components/broker/BrokerRegisterForm';

export const metadata = { title: 'تسجيل وسيط جديد' };
// Render per-request so the white-label brand (read from env) reflects the deploy's ConfigMap
// instead of being baked at build time.
export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  return (
    <AuthShell>
      <h1 className="text-xl font-bold text-foreground">تسجيل وسيط جديد</h1>
      <p className="mt-1 text-sm text-muted">أنشئ حسابك للانضمام كوسيط عقاري.</p>

      <div className="mt-6">
        <BrokerRegisterForm />
      </div>

      <p className="mt-5 text-center text-xs text-muted">
        لديك حساب؟{' '}
        <Link href="/login" className="font-medium text-brand hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </AuthShell>
  );
}
