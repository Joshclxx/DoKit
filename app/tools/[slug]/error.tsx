"use client";

import Link from "next/link";

export default function ToolError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[520px] max-w-xl flex-col items-center justify-center px-4 text-center">
      <div className="text-5xl">⚠️</div>
      <h1 className="mt-5 text-2xl font-bold">This tool hit a browser limit</h1>
      <p className="mt-2 text-sm leading-6 text-muted">Your input stays on this device. Try the tool again, or return to the catalog and choose another workflow.</p>
      <div className="mt-6 flex gap-3"><button type="button" onClick={reset} className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg">Try again</button><Link href="/tools" className="rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold">All tools</Link></div>
    </div>
  );
}
