import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import {
  BrokerProfileForm,
  type BrokerProfileValues,
  type BrokerAttachment,
} from '@/components/broker/BrokerProfileForm';
import { serverJson } from '@/server/api-client';
import { FalVerificationBadge } from '@/components/broker/FalVerificationBadge';

export const metadata = { title: 'الملف الشخصي' };

export default async function BrokerProfilePage() {
  // Prefill from the broker's saved profile (GET /broker/profile, [BrokerOnly], own-data). Null if none yet.
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
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="text-xl font-semibold text-foreground">ملفي المهني</h2>
        <p className="mt-1 text-sm text-muted">
          هذا الملف يُبنى مرة واحدة ويُستخدم عند التقديم لأي مطوّر.
        </p>
      </section>

      {initial?.falLicenseNumber ? (
        <FalVerificationBadge
          status={initial.falLicenseStatus}
          expiry={initial.falLicenseExpiry}
          holderName={initial.falLicenseHolderName}
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>البيانات الأساسية</CardTitle>
          <CardDescription>تأكد من صحة البيانات قبل التقديم للمطوّرين.</CardDescription>
        </CardHeader>
        <CardContent>
          <BrokerProfileForm initial={initial} initialAttachments={initialAttachments} />
        </CardContent>
      </Card>
    </div>
  );
}
