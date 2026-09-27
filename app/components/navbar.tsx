"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "./theme-provider";
import { getToolBySlug } from "@/lib/tools";
import { getKitBySlug } from "@/lib/kits";
import { BackButton } from "./back-button";

export function Navbar() {
  const { resolvedTheme, toggle } = useTheme();
  const pathname = usePathname();
  const tool = pathname.startsWith("/tools/") ? getToolBySlug(pathname.slice("/tools/".length)) : undefined;
  const kit = pathname.startsWith("/kits/") ? getKitBySlug(pathname.slice("/kits/".length)) : undefined;
  const isDetailPage = Boolean(tool || kit);
  const title = tool?.name ?? kit?.name ?? (pathname === "/tools" ? "All Tools" : pathname === "/kits" ? "Kits" : pathname === "/settings" ? "Settings" : "");
  const fallbackHref = tool ? "/tools" : kit ? "/kits" : "/";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 pt-[env(safe-area-inset-top)] backdrop-blur-xl md:hidden">
      <nav className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 sm:px-6" aria-label="App navigation">
        {title ? (
          <>
            {isDetailPage && <BackButton fallbackHref={fallbackHref} iconOnly />}
            <span className={`min-w-0 flex-1 truncate text-base font-semibold ${isDetailPage ? "" : "pl-2"}`}>{title}</span>
          </>
        ) : (
          <Link href="/" className="flex min-w-0 flex-1 items-center" aria-label="DoKit home">
            <Image src="/dokit_logo_title.svg" alt="DoKit" width={138} height={41} priority className="h-9 w-auto" />
          </Link>
        )}
        <div className="flex shrink-0 items-center">
          <button
            onClick={toggle}
            aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            {resolvedTheme === "dark" ? (
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            )}
          </button>

        </div>
      </nav>
    </header>
  );
}
