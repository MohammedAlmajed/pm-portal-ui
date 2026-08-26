'use client';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-canvas text-foreground">
        <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="text-xl font-semibold">حدث خطأ غير متوقع</h1>
          <p className="text-sm text-muted">نأسف على الإزعاج. يرجى المحاولة مرة أخرى.</p>
          <button
            onClick={reset}
            className="h-10 rounded-md bg-brand px-4 text-sm font-medium text-on-brand"
          >
            إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  );
}
