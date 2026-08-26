import * as React from 'react';
import { SideNav, type NavItem } from './SideNav';
import { TopBar } from './TopBar';

/**
 * The authenticated portal frame: side nav + top bar + content well. Server
 * component — pass the nav items and the resolved session's display fields.
 */
export function AppShell({
  title,
  brandLabel,
  navItems,
  userName,
  children,
}: {
  title: string;
  brandLabel: string;
  navItems: NavItem[];
  userName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <SideNav items={navItems} brandLabel={brandLabel} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title={title} userName={userName} navItems={navItems} brandLabel={brandLabel} />
        <main className="flex-1 p-5 md:p-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
