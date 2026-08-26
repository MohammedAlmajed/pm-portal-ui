import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';
import '@/styles/index.css';

export const metadata: Metadata = {
  title: {
    default: 'بوابة الوسطاء',
    template: '%s | بوابة الوسطاء',
  },
  description: 'بوابة الوسطاء العقاريين — التسجيل ومتابعة الطلبات',
  robots: { index: false, follow: false }, // authenticated portal — keep out of search
};

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
};

/**
 * Root layout. Arabic/RTL-first and STATIC (dir/lang are fixed — this app has no
 * locale negotiation). Theme is applied client-side by ThemeProvider onto <html>.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" data-theme="light" suppressHydrationWarning>
      <body className="min-h-screen bg-canvas text-foreground antialiased">
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
