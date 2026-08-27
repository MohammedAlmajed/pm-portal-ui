'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';

/**
 * The membership front door: submit the broker's application to the (single) developer. Same
 * contract as ApplyButton, but styled as the hub's primary CTA. Used when the profile is already
 * complete; the guided /join flow handles the profile-first case.
 */
export function JoinButton({
  developerTenantId,
  label = 'انضمّ الآن',
  className,
}: {
  developerTenantId: number;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = React.useState(false);

  async function join() {
    setLoading(true);
    try {
      const res = await fetch('/api/identity/broker/applications', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ developerTenantId }),
      });
      if (res.ok) {
        toast.success('تم إرسال طلبك — سنُعلمك فور صدور القرار.');
        router.refresh();
        return;
      }
      const detail = String(
        ((await res.json().catch(() => ({}))) as { detail?: string }).detail ?? '',
      );
      if (detail.includes('ProfileIncomplete') || detail.includes('ProfileRequired')) {
        toast.error('أكمل ملفك المهني (رخصة فال ووثيقتها) قبل الانضمام.');
        router.push('/join');
      } else if (detail.includes('AlreadyPending') || detail.includes('AlreadyApproved')) {
        router.refresh();
      } else {
        toast.error('تعذّر إرسال طلب الانضمام. حاول لاحقًا.');
      }
    } catch {
      toast.error('تعذّر إرسال طلب الانضمام. حاول لاحقًا.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={join}
      disabled={loading}
      className={cn(
        'inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-on-brand px-6 text-sm font-semibold text-brand shadow-sm transition-transform hover:scale-[1.02] active:scale-100 disabled:opacity-70',
        className,
      )}
    >
      {loading ? <Loader2 className="animate-spin" size={18} /> : null}
      {label}
      {!loading && <ArrowLeft size={18} />}
    </button>
  );
}
