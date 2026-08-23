import Image from "next/image";

export function MobileDownloadLanding() {
  const apkUrl = process.env.NEXT_PUBLIC_ANDROID_APK_URL ?? "/downloads/dokit-android-v1.0.2-debug.apk";
  const apkSize = process.env.NEXT_PUBLIC_ANDROID_APK_SIZE ?? "6.3 MB";

  return (
    <section
      className="mobile-download-landing min-h-[100svh] bg-background px-5 py-8 text-center"
      aria-label="Download the DoKit Android app"
    >
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-sm flex-col items-center">
        <Image
          src="/dokit_logo_title.svg"
          alt="DoKit"
          width={138}
          height={41}
          priority
          className="h-10 w-auto"
        />
        <p className="mt-3 text-sm text-muted">44 tools. Local-first. No login.</p>

        <div className="mt-8 flex h-24 w-24 items-center justify-center rounded-[1.75rem] border border-border bg-surface shadow-[var(--shadow-md)]">
          <Image src="/dokit_logo.svg" alt="" width={64} height={64} />
        </div>

        <h1 className="mt-6 text-2xl font-bold tracking-tight">Get DoKit for Android</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          The full toolkit runs natively, so file pickers, printing, and offline work behave properly.
        </p>

        <a
          href={apkUrl}
          download
          className="mt-7 flex h-12 w-full items-center justify-center rounded-xl bg-accent px-5 text-sm font-semibold text-accent-fg shadow-lg shadow-accent/20 transition-colors hover:bg-accent-hover"
        >
          Download APK · {apkSize}
        </a>
        <p className="mt-2 text-xs text-muted">v1.0.2 · Android 8+ · signed build</p>

        <ol className="mt-7 w-full space-y-2 border-t border-border pt-5 text-left text-sm text-muted">
          <li><span className="mr-2 text-foreground">1</span>Tap download.</li>
          <li><span className="mr-2 text-foreground">2</span>Allow installation from this source.</li>
          <li><span className="mr-2 text-foreground">3</span>Open DoKit.</li>
        </ol>

        <p className="mt-auto pt-10 text-xs leading-5 text-muted">
          The browser version is available on desktop. Install the Android app to use the full system on a phone.
        </p>
      </div>
    </section>
  );
}
