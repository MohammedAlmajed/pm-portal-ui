import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import {
  BrokerProfileForm,
  type BrokerProfileValues,
  type BrokerAttachment,
} from '@/components/broker/BrokerProfileForm';
import { JoinButton } from '@/components/broker/JoinButton';
import { getBrokerStatus } from '@/server/broker-status';
import { getSingleDeveloper } from '@/server/share-hub';
import { serverJson } from '@/server/api-client';
import { env } from '@/lib/env';

export const metadata = { title: 'الانضمام' };
export const dynamic = 'force-dynamic';

/**
 * Guided one-flow join for a dedicated (single-developer) portal:
 *  - already pending/approved → home (nothing to do).
 *  - profile incomplete       → the profile form; on save it auto-submits the application.
 *  - profile complete         → a short confirm + one-tap join.
 */
export default async function JoinPage() {
  const dev = await getSingleDeveloper();
  const status = await getBrokerStatus();
  const developerName = dev?.name ?? env.brand.name;

  // Already in the pipeline (or the marketplace build shouldn't land here) → back home.
  if (status.stage === 'pending' || status.stage === 'approved') redirect('/');

  // Profile complete but not yet applied → confirm + one-tap.
  if (status.profileComplete && dev) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-6">
        <section className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground">الانضمام إلى {developerName}</h1>
          <p className="text-sm text-muted">ملفك المهني مكتمل — أرسِل طلب انضمامك بنقرة واحدة.</p>
        </section>
        <Card className="flex flex-col items-start gap-4 p-6">
          <p className="text-sm text-foreground">
            بالضغط على «انضمّ الآن» يُرسَل ملفك إلى فريق {developerName} للمراجعة.
          </p>
          <JoinButton
            developerTenantId={dev.id}
            className="bg-brand text-on-brand hover:bg-brand-hover hover:scale-[1.02]"
          />
        </Card>
      </div>
    );
  }

  // Profile incomplete → collect it, then auto-submit the application on save.
  let initial: BrokerProfileValues | null = null;
  let initialAttachments: BrokerAttachment[] = [];
  try {
    initial = (await serverJson<BrokerProfileValues | null>('identity', 'broker/profile')) ?? null;
  } catch {
    initial = null;
  }
  try {
    initialAttachments =
      (await serverJson<BrokerAttachment[]>('identity', 'broker/profile/attachments')) ?? [];
  } catch {
    initialAttachments = [];
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <section className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">الانضمام إلى {developerName}</h1>
        <p className="text-sm text-muted">
          أكمل بياناتك المهنية (بما فيها رخصة فال ووثيقتها) وسيُرسَل طلب انضمامك تلقائيًا عند الحفظ.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>بياناتك المهنية</CardTitle>
          <CardDescription>تُبنى مرة واحدة وتُستخدم في طلب الانضمام.</CardDescription>
        </CardHeader>
        <CardContent>
          <BrokerProfileForm
            initial={initial}
            initialAttachments={initialAttachments}
            joinDeveloperTenantId={dev?.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
