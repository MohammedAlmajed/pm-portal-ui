import * as React from 'react';
import { Link2, LineChart, BadgeCheck } from 'lucide-react';
import { env } from '@/lib/env';
import { BrandLogo } from '@/components/layout/BrandLogo';

// What a broker actually gets on this platform — grounds the welcome panel in real capabilities
// (referral share hub, lead attribution, per-developer approval) rather than generic marketing.
const BENEFITS = [
  { icon: Link2, title: 'روابط إحالة خاصة بك', body: 'شارك مشاريع المطوّرين برابطك، وكل عميل يصل عبره يُنسب إليك.' },
  { icon: LineChart, title: 'متابعة عملائك أولًا بأول', body: 'تابع حالة كل عميل محال من التسجيل حتى الإغلاق في مكان واحد.' },
  { icon: BadgeCheck, title: 'اعتماد سريع من المطوّرين', body: 'قدّم طلبك مرة واحدة، وابدأ فور اعتمادك من كل مطوّر.' },
];

/**
 * Shared split-screen frame for the portal's front door (login + register). A branded welcome
 * panel establishes what the portal is; the form pane on the other side holds the page's content.
 * On mobile the panel collapses and the logo moves inline above the form.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas p-4 sm:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-5xl items-center justify-center sm:min-h-[calc(100vh-3rem)]">
        <div className="grid w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-sm lg:grid-cols-[1.05fr_1fr]">
          {/* Brand welcome — desktop only. Mobile shows the logo inside the form pane instead. */}
          <aside className="relative hidden flex-col justify-center gap-12 overflow-hidden bg-gradient-to-bl from-brand to-brand-active p-10 text-on-brand lg:flex">
            <div aria-hidden className="pointer-events-none absolute -start-20 -top-20 h-64 w-64 rounded-full bg-on-brand/10 blur-2xl" />
            <div aria-hidden className="pointer-events-none absolute -bottom-24 -end-16 h-72 w-72 rounded-full bg-on-brand/5 blur-2xl" />
            <div className="relative">
              <BrandLogo logoUrl={env.brand.logoUrl} mark={env.brand.mark} alt={env.brand.name} size="lg" />
              <h2 className="mt-8 text-3xl font-bold leading-tight">انضم إلى شبكة الوسطاء</h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-on-brand/80">{env.brand.description}</p>
            </div>
            <ul className="relative flex flex-col gap-6">
              {BENEFITS.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-on-brand/15">
                    <Icon className="h-[18px] w-[18px]" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-on-brand/75">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </aside>

          {/* Form pane — vertically centered so a short form (login) balances against the taller
              welcome panel, while a tall form (register) simply fills the height. */}
          <div className="flex flex-col justify-center p-6 sm:p-10">
            <div className="mb-6 lg:hidden">
              <BrandLogo logoUrl={env.brand.logoUrl} mark={env.brand.mark} alt={env.brand.name} size="lg" />
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
