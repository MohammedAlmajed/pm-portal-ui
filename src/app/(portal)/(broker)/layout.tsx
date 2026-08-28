import { AppShell } from '@/components/layout/AppShell';
import type { NavItem } from '@/components/layout/SideNav';
import { OnboardingGate } from '@/components/broker/OnboardingGate';
import { getBrokerStatus } from '@/server/broker-status';
import { requireRole } from '@/lib/auth/require-session';
import { ROLE } from '@/lib/auth/session-types';
import { env } from '@/lib/env';
import { routes } from '@/lib/routes';

// icon = a KEY resolved in the client SideNav (components can't cross the RSC boundary).
// Directory + Applications are hidden in single-developer mode (see below) — the whole portal
// IS that one developer, so there's no directory to browse and only one application to track.
const NAV_ALL: NavItem[] = [
  { href: routes.home, label: 'الرئيسية', icon: 'dashboard' },
  { href: routes.profile, label: 'الملف الشخصي', icon: 'profile' },
  { href: routes.developers, label: 'المطوّرون', icon: 'developers' },
  { href: routes.applications, label: 'طلباتي', icon: 'applications' },
  { href: routes.leads, label: 'المهتمّين', icon: 'leads' },
];
const NAV_SINGLE: NavItem[] = NAV_ALL.filter(
  (i) => i.href !== routes.developers && i.href !== routes.applications,
);

/**
 * Broker area frame. requireRole redirects to /login (no session) or /forbidden
 * (wrong role) server-side before anything renders. The middleware is the first
 * gate; this is the authoritative one.
 */
export default async function BrokerLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole(ROLE.BROKER, routes.home);

  // DEDICATED portal: gate everything behind approval. Until the single developer approves the
  // broker, the ONLY surface is the full-screen onboarding (no shell) — this intercepts every
  // broker route (leads, profile, …), so approval is the single key to the whole portal.
  if (env.portal.singleDeveloper) {
    const status = await getBrokerStatus();
    if (status.stage !== 'approved') {
      return <OnboardingGate status={status} />;
    }
  }

  const navItems = env.portal.singleDeveloper ? NAV_SINGLE : NAV_ALL;

  return (
    <AppShell
      title={env.brand.name}
      brandLabel={env.brand.short}
      brandMark={env.brand.mark}
      brandLogoUrl={env.brand.logoUrl}
      navItems={navItems}
      userName={session.name}
    >
      {children}
    </AppShell>
  );
}
