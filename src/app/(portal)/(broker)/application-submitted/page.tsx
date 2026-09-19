import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { env } from '@/lib/env';

export const metadata = { title: 'تم إرسال الطلب' };
// Per-request so the white-label brand reflects the deploy's ConfigMap.
export const dynamic = 'force-dynamic';

/**
 * Dedicated confirmation page shown after a broker submits an application request — replaces the
 * old "stay on the page + side toast" so the success is clear and reassuring.
 */
export default function ApplicationSubmittedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mb-3 flex justify-center">
            <BrandLogo logoUrl={env.brand.logoUrl} mark={env.brand.mark} alt={env.brand.name} size="lg" />
          </div>
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="text-success" size={36} />
          </div>
          <CardTitle>تم إرسال طلبك بنجاح</CardTitle>
          <CardDescription>شكراً لتسجيلك معنا 🌟</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <p className="text-sm leading-relaxed text-muted">
            تم استلام طلبك وهو الآن قيد المراجعة. سنُعلمك فور صدور القرار عبر بريدك الإلكتروني.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/applications">
              <Button variant="outline">متابعة طلباتي</Button>
            </Link>
            <Link href="/">
              <Button>العودة للرئيسية</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
