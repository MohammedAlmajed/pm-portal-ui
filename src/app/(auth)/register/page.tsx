import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { BrokerRegisterForm } from '@/components/broker/BrokerRegisterForm';
import { env } from '@/lib/env';
import { BrandLogo } from '@/components/layout/BrandLogo';

export const metadata = { title: 'تسجيل وسيط جديد' };
// Render per-request so the white-label brand (read from env) reflects the deploy's ConfigMap
// instead of being baked at build time.
export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <div className="mb-2">
            <BrandLogo logoUrl={env.brand.logoUrl} mark={env.brand.mark} alt={env.brand.name} size="lg" />
          </div>
          <CardTitle>تسجيل وسيط جديد</CardTitle>
          <CardDescription>أنشئ حسابك للانضمام كوسيط عقاري.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <BrokerRegisterForm />
          <p className="text-center text-xs text-muted">
            لديك حساب؟{' '}
            <Link href="/login" className="text-brand">
              تسجيل الدخول
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
