import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { BrokerRegisterForm } from '@/components/broker/BrokerRegisterForm';

export const metadata = { title: 'تسجيل وسيط جديد' };

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-brand text-on-brand">
            <span className="text-lg font-bold">و</span>
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
