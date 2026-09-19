'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { Input, Field } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

/**
 * Portal-owned broker registration. Posts to the [AllowAnonymous] pm-Identity endpoint, which
 * provisions the Keycloak identity (broker role) via the Admin API and creates the BrokerProfile.
 * The FAL DOCUMENT is uploaded after first login (mandatory to complete the profile / apply).
 */
const schema = z
  .object({
    type: z.enum(['Individual', 'Establishment']).default('Individual'),
    commercialRegistration: z.string().optional(),
    fullName: z.string().min(3, 'الاسم مطلوب'),
    nationalId: z.string().regex(/^\d{10}$/, 'رقم الهوية/الإقامة يجب أن يكون 10 أرقام'),
    email: z.email('البريد الإلكتروني غير صحيح'),
    mobile: z.string().regex(/^(?:\+9665|05)\d{8}$/, 'رقم جوال سعودي غير صحيح'),
    yearsOfExperience: z.coerce.number().min(0).max(60),
    falLicenseNumber: z.string().min(3, 'رقم رخصة فال مطلوب'),
    password: z.string().min(8, 'كلمة المرور 8 أحرف على الأقل'),
  })
  // السجل التجاري مطلوب فقط للمنشأة.
  .refine((v) => v.type !== 'Establishment' || !!v.commercialRegistration?.trim(), {
    path: ['commercialRegistration'],
    message: 'رقم السجل التجاري مطلوب للمنشأة',
  });
type FormValues = z.input<typeof schema>;

export function BrokerRegisterForm() {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { type: 'Individual' } });
  const brokerType = watch('type');

  const onSubmit = handleSubmit(async (values) => {
    setSaving(true);
    try {
      const res = await fetch('/api/identity/broker/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        // Dedicated thank-you page (not a toast) — carries the verify flag so it can point the
        // broker to their inbox when email verification is required.
        router.push(data?.emailVerificationRequired ? '/registered?verify=1' : '/registered');
      } else if (res.status === 409) {
        toast.error('البريد الإلكتروني أو رقم الهوية مسجّل مسبقًا.');
      } else {
        toast.error('تعذّر إنشاء الحساب. حاول لاحقًا.');
      }
    } catch {
      toast.error('تعذّر إنشاء الحساب. حاول لاحقًا.');
    } finally {
      setSaving(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label="نوع الوسيط" htmlFor="type" required>
        <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-surface-sunken p-1">
          {(['Individual', 'Establishment'] as const).map((t) => (
            <label
              key={t}
              className={`flex cursor-pointer items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition ${
                brokerType === t ? 'bg-brand text-on-brand shadow-sm' : 'text-muted hover:text-foreground'
              }`}
            >
              <input type="radio" value={t} className="sr-only" {...register('type')} />
              {t === 'Individual' ? 'فرد' : 'منشأة'}
            </label>
          ))}
        </div>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
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
        {brokerType === 'Establishment' && (
          <div className="sm:col-span-2">
            <Field label="رقم السجل التجاري" htmlFor="commercialRegistration" required error={errors.commercialRegistration?.message}>
              <Input id="commercialRegistration" inputMode="numeric" dir="ltr" invalid={!!errors.commercialRegistration} {...register('commercialRegistration')} />
            </Field>
          </div>
        )}
      </div>
      <Field label="كلمة المرور" htmlFor="password" required error={errors.password?.message} hint="8 أحرف على الأقل.">
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            dir="ltr"
            className="pr-10"
            invalid={!!errors.password}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            tabIndex={-1}
            aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
            className="absolute inset-y-0 right-2 flex items-center text-muted transition-colors hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>

      <Button type="submit" disabled={saving} className="mt-1">
        {saving ? 'جارٍ الإنشاء…' : 'إنشاء الحساب'}
      </Button>
      <p className="text-center text-xs text-muted">
        وثيقة رخصة فال تُرفع بعد تسجيل الدخول لإكمال ملفك.
      </p>
    </form>
  );
}
