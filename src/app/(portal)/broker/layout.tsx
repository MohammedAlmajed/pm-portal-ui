import { AppShell } from '@/components/layout/AppShell';
import type { NavItem } from '@/components/layout/SideNav';
import { requireRole } from '@/lib/auth/require-session';
import { ROLE } from '@/lib/auth/session-types';
import { env } from '@/lib/env';

// icon = a KEY resolved in the client SideNav (components can't cross the RSC boundary).
const NAV: NavItem[] = [
  { href: '/broker', label: 'الرئيسية', icon: 'dashboard' },
  { href: '/broker/profile', label: 'الملف الشخصي', icon: 'profile' },
  { href: '/broker/developers', label: 'المطوّرون', icon: 'developers' },
  { href: '/broker/applications', label: 'طلباتي', icon: 'applications' },
  { href: '/broker/leads', label: 'العملاء المحتملون', icon: 'leads' },
];

/**
 * Broker area frame. requireRole redirects to /login (no session) or /forbidden
 * (wrong role) server-side before anything renders. The middleware is the first
 * gate; this is the authoritative one.
 */
export default async function BrokerLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole(ROLE.BROKER, '/broker');

  return (
    <AppShell
      title={env.brand.name}
      brandLabel={env.brand.short}
      brandMark={env.brand.mark}
      navItems={NAV}
      userName={session.name}
    >
      {children}
    </AppShell>
  );
}
