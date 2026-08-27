'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Paperclip, X } from 'lucide-react';
import { Input, Field } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

/**
 * Broker professional profile. FAL license (number AND document) is MANDATORY; additional
 * documents are OPTIONAL (0+). Files are validated client-side (type + ≤5MB) with field-level
 * errors. Media ids are integers (matches the backend). Saved via [BrokerOnly] POST /broker/profile.
 */
export interface BrokerProfileValues {
  fullName: string;
  nationalId: string;
  email: string;
  mobile: string;
  yearsOfExperience: number | string;
  falLicenseNumber?: string;
  falLicenseMediaId?: number;
}
export interface BrokerAttachment {
  id: number;
  mediaId: number;
  fileName: string;
}

const schema = z.object({
  fullName: z.string().min(3, 'الاسم مطلوب'),
  nationalId: z.string().regex(/^\d{10}$/, 'رقم الهوية/الإقامة يجب أن يكون 10 أرقام'),
  email: z.email('البريد الإلكتروني غير صحيح'),
  mobile: z.string().regex(/^(?:\+9665|05)\d{8}$/, 'رقم جوال سعودي غير صحيح'),
  yearsOfExperience: z.coerce.number().min(0).max(60),
  falLicenseNumber: z.string().min(3, 'رقم رخصة فال مطلوب'),
});
type FormValues = z.input<typeof schema>;

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = /^(application\/pdf|image\/)/;
function validateFile(f: File): string | null {
  if (f.size > MAX_BYTES) return 'حجم الملف يتجاوز ٥ ميجابايت.';
  if (f.type && !ALLOWED.test(f.type)) return 'صيغة غير مدعومة (PDF أو صورة فقط).';
  return null;
}

/** media 3-step for one file. Returns the media id or null on failure. */
async function uploadFile(base: string, file: File): Promise<number | null> {
  try {
    const urlRes = await fetch(`${base}/upload-url`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        declaredSizeBytes: file.size,
      }),
    });
    if (!urlRes.ok) return null;
    const { mediaId, uploadUrl } = (await urlRes.json()) as { mediaId: number; uploadUrl: string };
    const put = await fetch(uploadUrl, { method: 'PUT', body: file });
    if (!put.ok) return null;
    return mediaId;
  } catch {
    return null;
  }
}

export function BrokerProfileForm({
  initial,
  initialAttachments = [],
  joinDeveloperTenantId,
}: {
  initial?: BrokerProfileValues | null;
  initialAttachments?: BrokerAttachment[];
  /** Guided-join mode: after a successful save, submit the application to this developer + go home. */
  joinDeveloperTenantId?: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = React.useState(false);
  const [falFile, setFalFile] = React.useState<File | null>(null);
  const [falError, setFalError] = React.useState<string | undefined>();
  const [extraFiles, setExtraFiles] = React.useState<File[]>([]);

  const hasFalOnRecord = !!initial?.falLicenseMediaId;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial
      ? { ...initial, yearsOfExperience: String(initial.yearsOfExperience ?? '') }
      : undefined,
  });

  function onFalChange(f: File | null) {
    setFalError(f ? (validateFile(f) ?? undefined) : undefined);
    setFalFile(f);
  }

  function onExtraChange(files: File[]) {
    const valid: File[] = [];
    for (const f of files) {
      const err = validateFile(f);
      if (err) toast.error(`${f.name}: ${err}`);
      else valid.push(f);
    }
    setExtraFiles((prev) => [...prev, ...valid]);
  }

  const onSubmit = handleSubmit(async (values) => {
    // FAL document is MANDATORY: on record, or a valid newly-selected file.
    if (falFile && falError) return;
    if (!falFile && !hasFalOnRecord) {
      setFalError('وثيقة رخصة فال مطلوبة.');
      return;
    }

    setSaving(true);
    try {
      let falLicenseMediaId = initial?.falLicenseMediaId;
      if (falFile) {
        const uploaded = await uploadFile('/api/identity/broker/profile/fal-license', falFile);
        if (!uploaded) {
          toast.error('تعذّر رفع وثيقة رخصة فال. حاول مرة أخرى.');
          return;
        }
        falLicenseMediaId = uploaded;
      }

      const res = await fetch('/api/identity/broker/profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...values, falLicenseMediaId }),
      });
      if (!res.ok) {
        toast.error('تعذّر حفظ الملف. حاول لاحقًا.');
        return;
      }

      // A newly-uploaded FAL file must be CONFIRMED with pm-media (finalizes the upload so the
      // document can actually be served — otherwise it stays pending and its URL comes back empty).
      // Runs after the profile POST because the confirm handler links the media to an existing profile.
      if (falFile && falLicenseMediaId != null) {
        const confirmed = await fetch('/api/identity/broker/profile/fal-license/confirm', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ mediaId: falLicenseMediaId }),
        })
          .then((r) => r.ok)
          .catch(() => false);
        if (!confirmed) {
          toast.error('تعذّر تأكيد وثيقة رخصة فال. حاول مرة أخرى.');
          return;
        }
      }

      // Optional additional documents — uploaded after the profile exists, with per-file feedback.
      if (extraFiles.length) {
        let ok = 0;
        for (const f of extraFiles) {
          const mediaId = await uploadFile('/api/identity/broker/profile/attachments', f);
          if (mediaId != null) {
            const confirmed = await fetch('/api/identity/broker/profile/attachments/confirm', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ mediaId, fileName: f.name, contentType: f.type }),
            }).then((r) => r.ok).catch(() => false);
            if (confirmed) ok += 1;
          }
        }
        if (ok < extraFiles.length) toast.info(`تم رفع ${ok} من ${extraFiles.length} مستند إضافي.`);
        setExtraFiles([]);
      }

      setFalFile(null);

      // Guided join: profile is now complete → submit the application to the single developer.
      if (joinDeveloperTenantId != null) {
        const applied = await fetch('/api/identity/broker/applications', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ developerTenantId: joinDeveloperTenantId }),
        })
          .then((r) => r.ok)
          .catch(() => false);
        toast.success(
          applied ? 'تم إرسال طلب انضمامك — سنُعلمك فور صدور القرار.' : 'تم حفظ ملفك.',
        );
        router.push('/');
        return;
      }

      toast.success('تم حفظ الملف بنجاح.');
      router.refresh();
    } finally {
      setSaving(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="الاسم الكامل" htmlFor="fullName" required error={errors.fullName?.message}>
          <Input id="fullName" invalid={!!errors.fullName} {...register('fullName')} />
        </Field>
        <Field label="رقم الهوية / الإقامة" htmlFor="nationalId" required error={errors.nationalId?.message}>
          <Input id="nationalId" inputMode="numeric" invalid={!!errors.nationalId} {...register('nationalId')} />
        </Field>
        <Field label="البريد الإلكتروني" htmlFor="email" required error={errors.email?.message}>
          <Input id="email" type="email" dir="ltr" invalid={!!errors.email} {...register('email')} />
        </Field>
        <Field label="رقم الجوال" htmlFor="mobile" required error={errors.mobile?.message}>
          <Input id="mobile" dir="ltr" invalid={!!errors.mobile} {...register('mobile')} />
        </Field>
        <Field label="سنوات الخبرة" htmlFor="yearsOfExperience" required error={errors.yearsOfExperience?.message}>
          <Input id="yearsOfExperience" type="number" inputMode="numeric" invalid={!!errors.yearsOfExperience} {...register('yearsOfExperience')} />
        </Field>
        <Field label="رقم رخصة فال" htmlFor="falLicenseNumber" required error={errors.falLicenseNumber?.message}>
          <Input id="falLicenseNumber" dir="ltr" invalid={!!errors.falLicenseNumber} {...register('falLicenseNumber')} />
        </Field>
      </div>

      <Field
        label="وثيقة رخصة فال"
        required
        error={falError}
        hint={hasFalOnRecord ? 'وثيقة مرفوعة — اختر ملفًا جديدًا لاستبدالها.' : 'ملف PDF أو صورة واضحة، بحد أقصى ٥ ميجابايت.'}
      >
        <Input type="file" accept="application/pdf,image/*" invalid={!!falError} onChange={(e) => onFalChange(e.target.files?.[0] ?? null)} />
      </Field>

      <Field label="مستندات إضافية (اختياري)" hint="سيرة ذاتية، شهادات… — يمكنك إضافة أكثر من ملف.">
        <Input type="file" multiple accept="application/pdf,image/*" onChange={(e) => onExtraChange(Array.from(e.target.files ?? []))} />
      </Field>

      {(extraFiles.length > 0 || initialAttachments.length > 0) && (
        <ul className="flex flex-col gap-1 rounded-md bg-surface-sunken p-3">
          {initialAttachments.map((a) => (
            <li key={`saved-${a.id}`} className="flex items-center gap-2 text-sm text-muted">
              <Paperclip size={14} /> {a.fileName}
            </li>
          ))}
          {extraFiles.map((f, i) => (
            <li key={`new-${i}`} className="flex items-center justify-between gap-2 text-sm text-foreground">
              <span className="flex items-center gap-2">
                <Paperclip size={14} /> {f.name} <span className="text-xs text-muted">(جديد)</span>
              </span>
              <button
                type="button"
                aria-label={`إزالة ${f.name}`}
                onClick={() => setExtraFiles((prev) => prev.filter((_, j) => j !== i))}
                className="text-muted hover:text-danger"
              >
                <X size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div>
        <Button type="submit" disabled={saving}>
          {saving ? 'جارٍ الحفظ…' : 'حفظ الملف'}
        </Button>
      </div>
    </form>
  );
}
