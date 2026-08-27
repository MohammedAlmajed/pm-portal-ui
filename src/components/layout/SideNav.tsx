'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UserCircle,
  Building2,
  FileText,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { BrandLogo } from './BrandLogo';

/**
 * Client-side icon registry. Nav items cross the server→client boundary as plain
 * data, so they carry an icon KEY (string), not a component reference (which is
 * not serializable). Resolve the key to a component here.
 */
export const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  profile: UserCircle,
  developers: Building2,
  applications: FileText,
  leads: Users,
};

export interface NavItem {
  href: string;
  label: string;
  icon: keyof typeof ICONS | string;
}

export function SideNav({
  items,
  brandLabel,
  brandMark,
  brandLogoUrl,
}: {
  items: NavItem[];
  brandLabel: string;
  brandMark: string;
  brandLogoUrl?: string;
}) {
  const pathname = usePathname();
  // Only the MOST SPECIFIC matching item is active, so the section root ("/broker")
  // doesn't stay highlighted on its children ("/broker/leads", …).
  const activeHref = items
    .filter((it) => pathname === it.href || pathname.startsWith(`${it.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-e border-border bg-surface md:flex">
      <div className="flex h-16 items-center gap-2 px-5">
        <BrandLogo logoUrl={brandLogoUrl} mark={brandMark} alt={brandLabel} size="sm" />
        {/* The logo image usually carries the name; only show the text label when there's no logo. */}
        {!brandLogoUrl && (
          <span className="text-sm font-semibold text-foreground">{brandLabel}</span>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {items.map((item) => {
          const active = item.href === activeHref;
          const Icon = ICONS[item.icon] ?? LayoutDashboard;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-subtle text-brand'
                  : 'text-muted hover:bg-surface-sunken hover:text-foreground',
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
