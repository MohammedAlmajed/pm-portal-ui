'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';

/** Broker self-service: withdraw an own PENDING application (Pending → Withdrawn). */
export function WithdrawButton({
  applicationId,
  label = 'سحب الطلب',
  className,
}: {
  applicationId: number;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);

  async function withdraw() {
    setLoading(true);
    try {
      const res = await fetch(`/api/identity/broker/applications/${applicationId}/withdraw`, {
        method: 'PUT',
      });
      if (res.ok) {
        toast.success('تم سحب الطلب.');
        router.refresh();
      } else {
        toast.error('تعذّر سحب الطلب. حاول لاحقًا.');
      }
    } catch {
      toast.error('تعذّر سحب الطلب. حاول لاحقًا.');
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2 text-xs">
        <span className="text-muted">تأكيد السحب؟</span>
        <button
          type="button"
          onClick={withdraw}
          disabled={loading}
          className="inline-flex items-center gap-1 font-medium text-danger hover:underline disabled:opacity-50"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : null}
          نعم، اسحب
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="text-muted hover:text-foreground"
        >
          إلغاء
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-danger',
        className,
      )}
    >
      <X size={14} />
      {label}
    </button>
  );
}
