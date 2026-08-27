import Link from 'next/link';
import { Check, UserCircle, Building2, BadgeCheck, ArrowLeft, Clock, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import type { BrokerStage } from '@/server/broker-status';

/**
 * The broker onboarding journey: complete profile → apply to a developer → get approved.
 * Renders the three steps with the current stage highlighted, plus a stage-appropriate headline
 * and next-action CTA. Used on the dashboard and as the gate on the leads page.
 */
type StepState = 'done' | 'current' | 'rejected' | 'upcoming';

const STEPS = [
  { label: 'إكمال الملف المهني', icon: UserCircle },
  { label: 'التقديم إلى مطوّر', icon: Building2 },
  { label: 'اعتماد المطوّر', icon: BadgeCheck },
] as const;

function stepStates(stage: BrokerStage): [StepState, StepState, StepState] {
  switch (stage) {
    case 'profile-incomplete':
      return ['current', 'upcoming', 'upcoming'];
    case 'no-applications':
      return ['done', 'current', 'upcoming'];
    case 'pending':
      return ['done', 'done', 'current'];
    case 'rejected-only':
      return ['done', 'done', 'rejected'];
    case 'approved':
      return ['done', 'done', 'done'];
  }
}

const HEADLINE: Record<BrokerStage, { title: string; desc: string }> = {
  'profile-incomplete': {
    title: 'أكمل ملفك المهني للبدء',
    desc: 'أضف رقم رخصة فال ووثيقتها لإكمال ملفك، ثم قدّم طلبك إلى المطوّرين.',
  },
  'no-applications': {
    title: 'قدّم طلبك إلى مطوّر',
    desc: 'ملفك جاهز. تصفّح المطوّرين وقدّم طلب انضمام لبدء التعاون.',
  },
  pending: {
    title: 'طلبك قيد المراجعة',
    desc: 'بانتظار قرار المطوّر. ستتفعّل صفحة المهتمّين وروابط الإحالة بعد الاعتماد.',
  },
  'rejected-only': {
    title: 'لم يتم اعتمادك بعد',
    desc: 'لم تُقبل طلباتك الحالية. يمكنك التقديم إلى مطوّر آخر.',
  },
  approved: {
    title: 'تم اعتمادك 🎉',
    desc: 'أصبحت وسيطًا معتمدًا. شارك روابط الإحالة وتابع المهتمّين.',
  },
};

const CTA: Record<BrokerStage, { href: string; label: string } | null> = {
  'profile-incomplete': { href: '/profile', label: 'أكمل ملفي' },
  'no-applications': { href: '/developers', label: 'تصفّح المطوّرين' },
  pending: { href: '/applications', label: 'متابعة طلباتي' },
  'rejected-only': { href: '/developers', label: 'التقديم إلى مطوّر آخر' },
  approved: { href: '/leads', label: 'عرض المهتمّين' },
};

function StepDot({ state, Icon }: { state: StepState; Icon: typeof UserCircle }) {
  return (
    <div
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
        state === 'done' && 'border-success bg-success text-on-brand',
        state === 'current' && 'border-brand bg-brand-subtle text-brand',
        state === 'rejected' && 'border-danger bg-danger-subtle text-danger',
        state === 'upcoming' && 'border-border bg-surface text-muted',
      )}
    >
      {state === 'done' ? (
        <Check size={18} />
      ) : state === 'rejected' ? (
        <XCircle size={18} />
      ) : (
        <Icon size={18} />
      )}
    </div>
  );
}

export function OnboardingSteps({ stage }: { stage: BrokerStage }) {
  const states = stepStates(stage);
  const head = HEADLINE[stage];
  const cta = CTA[stage];

  return (
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex items-start gap-3">
        {stage === 'pending' ? (
          <Clock size={20} className="mt-0.5 shrink-0 text-brand" />
        ) : null}
        <div>
          <h3 className="text-base font-semibold text-foreground">{head.title}</h3>
          <p className="mt-1 text-sm text-muted">{head.desc}</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const state: StepState = states[i] ?? 'upcoming';
          return (
            <div key={step.label} className={cn('flex items-center', i < STEPS.length - 1 && 'flex-1')}>
              <div className="flex flex-col items-center gap-1.5">
                <StepDot state={state} Icon={step.icon} />
                <span
                  className={cn(
                    'max-w-[7rem] text-center text-xs',
                    state === 'upcoming' ? 'text-muted' : 'text-foreground',
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'mx-2 h-0.5 flex-1 rounded',
                    state === 'done' ? 'bg-success' : 'bg-border',
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {cta && (
        <Link
          href={cta.href}
          className="inline-flex w-fit items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-medium text-on-brand transition-colors hover:bg-brand/90"
        >
          {cta.label}
          <ArrowLeft size={16} />
        </Link>
      )}
    </Card>
  );
}
