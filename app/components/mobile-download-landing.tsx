export function MobileDownloadLanding() {
  const apkUrl = process.env.NEXT_PUBLIC_ANDROID_APK_URL ?? "/downloads/dokit-android-v1.0.3-debug.apk";

  return (
    <section className="mobile-download-landing mt-6 rounded-2xl border border-border bg-surface p-4 text-sm" aria-label="Android app">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold">DoKit for Android</h2>
          <p className="mt-1 text-xs text-muted">Version 1.0.3 · Install the mobile app on your device.</p>
        </div>
        <a href={apkUrl} download className="shrink-0 rounded-xl bg-accent px-3 py-2 font-semibold text-accent-fg">
          Get APK
        </a>
      </div>
    </section>
  );
}
