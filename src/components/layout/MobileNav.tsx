'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LayoutDashboard } from 'lucide-react';
import { ICONS, type NavItem } from './SideNav';
import { cn } from '@/lib/cn';

/**
 * Mobile navigation drawer. The desktop SideNav is hidden under `md`, so this hamburger +
 * slide-over provides navigation on phones. Closes on route change and on link click.
 */
export function MobileNav({
  items,
  brandLabel,
  brandMark,
}: {
  items: NavItem[];
  brandLabel: string;
  brandMark: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  // Only the MOST SPECIFIC matching item is active (so "/broker" isn't lit on its children).
  const activeHref = items
    .filter((it) => pathname === it.href || pathname.startsWith(`${it.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="القائمة"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-sunken hover:text-foreground md:hidden"
        >
          <Menu size={20} />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-overlay md:hidden" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 start-0 z-50 flex w-72 flex-col bg-surface shadow-lg md:hidden"
        >
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-on-brand">
                <span className="text-sm font-bold">{brandMark}</span>
              </div>
              <Dialog.Title className="text-sm font-semibold text-foreground">
                {brandLabel}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="إغلاق"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-surface-sunken hover:text-foreground"
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>
          <nav className="flex flex-1 flex-col gap-1 p-3">
            {items.map((item) => {
              const active = item.href === activeHref;
              const Icon = ICONS[item.icon] ?? LayoutDashboard;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
