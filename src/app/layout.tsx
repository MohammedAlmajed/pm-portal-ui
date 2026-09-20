import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { env } from '@/lib/env';
import '@/styles/index.css';

// Runtime (not build-time) so the same image reskins per ConfigMap.
export function generateMetadata(): Metadata {
  const name = env.brand.name;
  return {
    title: { default: name, template: `%s | ${name}` },
    description: env.brand.description,
    robots: { index: false, follow: false }, // authenticated portal — keep out of search
  };
}

export function generateViewport(): Viewport {
  return { themeColor: env.brand.themeColor, width: 'device-width', initialScale: 1 };
}

/**
 * Root layout. Arabic/RTL-first and STATIC (dir/lang are fixed — this app has no
 * locale negotiation). The portal is light-only: data-theme="light" is fixed here.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const brandVars = env.brand.cssVars;
  return (
    <html lang="ar" dir="rtl" data-theme="light" suppressHydrationWarning>
      <body className="min-h-screen bg-canvas text-foreground antialiased">
        {/* White-label brand color: override the semantic --pm-brand* tokens.
            Server-rendered from env, so no FOUC and no rebuild per client. */}
        {brandVars ? (
          <style dangerouslySetInnerHTML={{ __html: `:root{${brandVars}}` }} />
        ) : null}
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
