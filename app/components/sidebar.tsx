"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { kits, getKitTools } from "@/lib/kits";
import { tools } from "@/lib/tools";
import { RECENT_TOOLS_KEY } from "@/lib/preferences";
import { useTheme } from "./theme-provider";

function navClass(active: boolean) {
  return `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
    active
      ? "bg-accent text-accent-fg shadow-sm"
      : "text-muted hover:bg-surface-hover hover:text-foreground"
  }`;
}

export function Sidebar() {
  const pathname = usePathname();
  const { resolvedTheme, toggle } = useTheme();
  const [query, setQuery] = useState("");
  const [recentSlugs, setRecentSlugs] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const readRecent = () => {
      try {
        setRecentSlugs(JSON.parse(localStorage.getItem(RECENT_TOOLS_KEY) ?? "[]") as string[]);
      } catch {
        setRecentSlugs([]);
      }
    };
    const timer = window.setTimeout(readRecent, 0);
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("dokit-recent-change", readRecent);
    window.addEventListener("keydown", focusSearch);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("dokit-recent-change", readRecent);
      window.removeEventListener("keydown", focusSearch);
    };
  }, []);

  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return tools.filter((tool) =>
      `${tool.name} ${tool.description} ${tool.category}`.toLowerCase().includes(normalized)
    ).slice(0, 6);
  }, [query]);

  const recentTools = recentSlugs
    .map((slug) => tools.find((tool) => tool.slug === slug))
    .filter((tool): tool is (typeof tools)[number] => Boolean(tool))
    .slice(0, 3);

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 flex-col border-r border-border bg-surface md:flex">
      <div className="flex h-20 items-center border-b border-border px-5">
        <Link href="/" aria-label="DoKit home">
          <Image src="/dokit_logo_title.svg" alt="DoKit" width={138} height={41} priority className="h-11 w-auto" />
        </Link>
      </div>

      <div className="relative px-4 pt-4">
        <svg className="pointer-events-none absolute left-7 top-1/2 mt-2 -translate-y-1/2 text-muted" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
        <input
          ref={searchRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${tools.length} tools…`}
          aria-label="Search tools from the sidebar"
          className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-12 text-sm placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <span className="pointer-events-none absolute right-7 top-1/2 mt-2 -translate-y-1/2 rounded border border-border px-1.5 py-0.5 text-[10px] text-muted">⌘K</span>
        {query && (
          <div className="absolute left-4 right-4 top-[4.1rem] z-20 overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-lg)]">
            {matches.length ? matches.map((tool) => (
              <Link key={tool.slug} href={`/tools/${tool.slug}`} onClick={() => setQuery("")} className="flex items-center gap-3 border-b border-border px-3 py-3 last:border-0 hover:bg-surface-hover">
                <span className="min-w-0"><span className="block truncate text-sm font-medium">{tool.name}</span><span className="block text-xs text-muted">{tool.category}</span></span>
              </Link>
            )) : <div className="px-4 py-5 text-center text-sm text-muted">No tools found</div>}
          </div>
        )}
      </div>

      <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4 pt-6" aria-label="Primary navigation">
        <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Kits</p>
        <div className="mt-2 space-y-1">
          {kits.map((kit) => (
            <Link key={kit.slug} href={`/kits/${kit.slug}`} className={navClass(pathname === `/kits/${kit.slug}`)}>
              <span className="h-2 w-2 rounded-full border border-current opacity-70" />
              <span className="min-w-0 flex-1 truncate">{kit.name}</span>
              <span className="text-xs opacity-70">{getKitTools(kit).length}</span>
            </Link>
          ))}
        </div>

        <div className="my-4 border-t border-border" />
        <div className="space-y-1">
          <Link href="/tools" className={navClass(pathname === "/tools")}><span aria-hidden>⌘</span><span className="flex-1">All tools</span><span className="text-xs opacity-70">{tools.length}</span></Link>
          <Link href="/kits" className={navClass(pathname === "/kits")}><span aria-hidden>▦</span><span>Kits overview</span></Link>
        </div>

        {recentTools.length > 0 && (
          <div className="mt-6">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Jump back in</p>
            <div className="mt-2 space-y-1">
              {recentTools.map((tool) => (
                <Link key={tool.slug} href={`/tools/${tool.slug}`} className="flex items-center rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-hover hover:text-foreground"><span className="truncate">{tool.name}</span></Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto space-y-1 pt-6">
          <Link href="/settings" className={navClass(pathname === "/settings")}>Settings</Link>
          <button type="button" onClick={toggle} className={`${navClass(false)} w-full text-left`}>Switch to {resolvedTheme === "dark" ? "light" : "dark"}</button>
        </div>
      </nav>
    </aside>
  );
}
