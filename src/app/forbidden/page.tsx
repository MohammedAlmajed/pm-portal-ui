export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-canvas p-6 text-center">
      <h1 className="text-2xl font-semibold text-foreground">غير مصرّح</h1>
      <p className="max-w-sm text-sm text-muted">
        لا تملك الصلاحية للوصول إلى هذه الصفحة بهذا الحساب.
      </p>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- intentional hard nav to an OIDC route handler, not a page */}
      <a href="/api/auth/logout" className="text-sm font-medium text-brand">
        تسجيل الخروج والدخول بحساب آخر
      </a>
    </div>
  );
}
