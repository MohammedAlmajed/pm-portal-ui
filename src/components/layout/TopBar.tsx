import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { MobileNav } from '@/components/layout/MobileNav';
import type { NavItem } from '@/components/layout/SideNav';

export function TopBar({
  title,
  userName,
  navItems,
  brandLabel,
}: {
  title: string;
  userName?: string;
  navItems: NavItem[];
  brandLabel: string;
}) {
  return (
    <header className="flex h-16 items-center justify-between gap-2 border-b border-border bg-surface/80 px-4 backdrop-blur md:px-5">
      <div className="flex min-w-0 items-center gap-1">
        <MobileNav items={navItems} brandLabel={brandLabel} />
        <h1 className="truncate text-lg font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {userName ? <span className="hidden text-sm text-muted sm:inline">{userName}</span> : null}
        <ThemeToggle />
        <Link
          href="/api/auth/logout"
          aria-label="تسجيل الخروج"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-sunken hover:text-foreground"
        >
          <LogOut size={18} />
        </Link>
      </div>
    </header>
  );
}
