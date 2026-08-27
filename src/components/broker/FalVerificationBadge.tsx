import { ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';

/**
 * Shows the FAL license verification outcome captured server-side against the REGA/NHC registry.
 * Advisory only — the uploaded document remains the reviewer's fallback.
 */
function fmtDate(d?: string | null): string | null {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString('ar', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return null;
  }
}

export function FalVerificationBadge({
  status,
  expiry,
  holderName,
}: {
  status?: string | null;
  expiry?: string | null;
  holderName?: string | null;
}) {
  const expired = expiry ? new Date(expiry).getTime() < Date.now() : false;
  const active = !expired && !!status && (status === 'نشط' || /active/i.test(status));
  const notFound = status === 'NotFound';

  let cls: string;
  let icon: React.ReactNode;
  let title: string;
  let sub: string | undefined;

  if (active) {
    cls = 'border-success/25 bg-success-subtle text-success';
    icon = <ShieldCheck size={17} className="shrink-0" />;
    title = 'رخصة فال موثّقة وسارية';
    sub = expiry ? `تنتهي في ${fmtDate(expiry)}` : undefined;
  } else if (expired) {
    cls = 'border-danger/25 bg-danger-subtle text-danger';
    icon = <ShieldAlert size={17} className="shrink-0" />;
    title = 'رخصة فال منتهية';
    sub = expiry ? `انتهت في ${fmtDate(expiry)}` : undefined;
  } else if (notFound) {
    cls = 'border-warning/30 bg-warning-subtle text-warning';
    icon = <ShieldAlert size={17} className="shrink-0" />;
    title = 'لم يُعثر على الرخصة في السجل';
    sub = 'تأكّد من رقم رخصة فال';
  } else {
    cls = 'border-border bg-surface-sunken text-muted';
    icon = <ShieldQuestion size={17} className="shrink-0" />;
    title = 'لم يتم التحقق من الرخصة بعد';
    sub = undefined;
  }

  const holder = holderName ? holderName : null;

  return (
    <div className={`flex items-center gap-2.5 rounded-lg border p-3 text-sm ${cls}`}>
      {icon}
      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        {sub || holder ? (
          <p className="mt-0.5 text-xs opacity-90">{[sub, holder].filter(Boolean).join(' · ')}</p>
        ) : null}
      </div>
    </div>
  );
}
