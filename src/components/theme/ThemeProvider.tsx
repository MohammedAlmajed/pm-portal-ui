'use client';

import * as React from 'react';

/**
 * The portal renders in light mode only. Dark mode was removed — we no longer
 * read a stored choice or the OS `prefers-color-scheme`, so the app stays light
 * regardless of the visitor's system setting. Still applies an optional
 * per-tenant attribute for white-label reskins (see src/styles/tokens.css).
 */
export function ThemeProvider({
  children,
  tenant,
}: {
  children: React.ReactNode;
  tenant?: string;
}) {
  React.useEffect(() => {
    // Defensive: guarantee light even if an older build left data-theme="dark".
    document.documentElement.dataset.theme = 'light';
  }, []);

  React.useEffect(() => {
    if (tenant) document.documentElement.dataset.tenant = tenant;
  }, [tenant]);

  return <>{children}</>;
}
