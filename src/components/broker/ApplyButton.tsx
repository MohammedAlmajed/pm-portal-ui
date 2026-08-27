'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

/**
 * Apply to a developer. The developers page passes the broker's CURRENT application status for this
 * developer so we can show it and only offer re-apply after a rejection:
 *   - Pending / Approved  -> show status, no apply (an active application already exists).
 *   - Rejected            -> show status + "re-apply" (the only state that allows re-applying).
 *   - none                -> "apply".
 * Backend business errors are HTTP 400 with a ProblemDetails `detail` carrying the code.
 */
type ApplicationStatus = 'Pending' | 'Approved' | 'Rejected';
type State = 'idle' | 'sending' | 'sent' | 'error';

export function ApplyButton({
  developerTenantId,
  profileComplete,
  currentStatus,
}: {
  developerTenantId: number;
  profileComplete: boolean;
  currentStatus?: ApplicationStatus;
}) {
  const router = useRouter();
  const toast = useToast();
  const [state, setState] = React.useState<State>('idle');

  if (!profileComplete) {
    return (
      <Link href="/profile" className="text-xs font-medium text-warning">
        أكمل ملفك المهني أولًا (رخصة فال ووثيقتها)
      </Link>
    );
  }

  // Just applied in this session (before the server refresh lands).
  if (state === 'sent') return <StatusBadge status="Pending" />;

  // An active application already exists -> show status, no apply action.
  if (currentStatus === 'Pending') return <StatusBadge status="Pending" />;
  if (currentStatus === 'Approved') return <StatusBadge status="Approved" />;

  async function apply() {
    setState('sending');
    try {
      const res = await fetch('/api/identity/broker/applications', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ developerTenantId }),
      });
      if (res.ok) {
        setState('sent');
        toast.success('تم إرسال طلبك إلى المطوّر.');
        router.refresh();
        return;
      }
      const detail = String(((await res.json().catch(() => ({}))) as { detail?: string }).detail ?? '');
      if (detail.includes('AlreadyPending') || detail.includes('AlreadyApproved')) {
        // Out of sync with the server — refresh to reflect the real status.
        toast.error('لديك طلب قائم مع هذا المطوّر.');
        setState('idle');
        router.refresh();
      } else if (detail.includes('ProfileIncomplete') || detail.includes('ProfileRequired')) {
        setState('error');
        toast.error('أكمل ملفك المهني (رخصة فال ووثيقتها) قبل التقديم.');
      } else if (detail.includes('FalLicenseExpired')) {
        setState('error');
        toast.error('رخصة فال منتهية — جدّدها قبل التقديم.');
      } else if (detail.includes('FalLicenseNotFound')) {
        setState('error');
        toast.error('لم يتم العثور على رخصة فال في السجل — تحقّق من الرقم.');
      } else {
        setState('error');
        toast.error('تعذّر إرسال الطلب. حاول لاحقًا.');
      }
    } catch {
      setState('error');
      toast.error('تعذّر إرسال الطلب. حاول لاحقًا.');
    }
  }

  const isReapply = currentStatus === 'Rejected';
  return (
    <div className="flex flex-col items-start gap-1.5">
      {isReapply && <StatusBadge status="Rejected" />}
      <Button size="sm" variant="outline" onClick={apply} disabled={state === 'sending'}>
        {state === 'sending' ? 'جارٍ الإرسال…' : isReapply ? 'إعادة التقديم' : 'قدّم طلبًا'}
      </Button>
    </div>
  );
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const map = {
    Pending: { label: 'طلبك قيد المراجعة', cls: 'text-info' },
    Approved: { label: 'معتمد ✓', cls: 'text-success' },
    Rejected: { label: 'تم رفض طلبك السابق', cls: 'text-danger' },
  } as const;
  const s = map[status];
  return <span className={`text-sm font-medium ${s.cls}`}>{s.label}</span>;
}
