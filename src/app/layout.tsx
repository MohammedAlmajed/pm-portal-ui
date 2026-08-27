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
 * locale negotiation). Theme is applied client-side by ThemeProvider onto <html>.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const brandVars = env.brand.cssVars;
  return (
    <html lang="ar" dir="rtl" data-theme="light" suppressHydrationWarning>
      <body className="min-h-screen bg-canvas text-foreground antialiased">
        {/* White-label brand color: override the semantic --pm-brand* tokens for both themes.
            Server-rendered from env, so no FOUC and no rebuild per client. */}
        {brandVars ? (
          <style
            dangerouslySetInnerHTML={{ __html: `:root,:root[data-theme="dark"]{${brandVars}}` }}
          />
        ) : null}
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
