"use client";

import { useRouter } from "next/navigation";

export function BackButton({ fallbackHref, iconOnly = false }: { fallbackHref: string; iconOnly?: boolean }) {
  const router = useRouter();

  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.replace(fallbackHref);
  };

  return (
    <button
      type="button"
      onClick={goBack}
      className={iconOnly
        ? "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-surface-hover"
        : "inline-flex min-h-8 shrink-0 items-center gap-1 rounded-md border border-border bg-surface px-2 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground"}
      aria-label="Go back to the previous page"
    >
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
      {!iconOnly && "Back"}
    </button>
  );
}
