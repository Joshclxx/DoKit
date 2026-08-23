"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { kits, getKitTools } from "@/lib/kits";
import { tools } from "@/lib/tools";
import { RECENT_TOOLS_KEY } from "@/lib/preferences";

export function MobileHome() {
  const [query, setQuery] = useState("");
  const [recentSlugs, setRecentSlugs] = useState<string[]>([]);

  useEffect(() => {
    const readRecent = () => {
      try { setRecentSlugs(JSON.parse(localStorage.getItem(RECENT_TOOLS_KEY) ?? "[]") as string[]); }
      catch { setRecentSlugs([]); }
    };
    const timer = window.setTimeout(readRecent, 0);
    window.addEventListener("dokit-recent-change", readRecent);
    return () => { window.clearTimeout(timer); window.removeEventListener("dokit-recent-change", readRecent); };
  }, []);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return tools.filter((tool) => `${tool.name} ${tool.description} ${tool.category}`.toLowerCase().includes(normalized)).slice(0, 6);
  }, [query]);
  const recentTools = recentSlugs.map((slug) => tools.find((tool) => tool.slug === slug)).filter((tool): tool is (typeof tools)[number] => Boolean(tool)).slice(0, 3);

  return (
    <div className="px-4 py-6 md:hidden">
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted"><span className="h-1.5 w-1.5 rounded-full bg-success" />{tools.length} tools · local-first</div>
      <h1 className="mt-5 text-3xl font-bold leading-[1.08] tracking-tight">Pick a tool.<br /><span className="text-accent">Do the job.</span><br />Keep moving.</h1>

      <div className="relative mt-6">
        <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${tools.length} tools…`} className="h-12 w-full rounded-xl border border-border bg-surface pl-11 pr-4 text-sm focus:border-accent focus:outline-none" />
      </div>

      {query && <div className="mt-2 overflow-hidden rounded-xl border border-border bg-surface">{results.length ? results.map((tool) => <Link key={tool.slug} href={`/tools/${tool.slug}`} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0"><span>{tool.icon}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{tool.name}</span><span className="block text-xs text-muted">{tool.category}</span></span><span className="text-muted">›</span></Link>) : <div className="px-4 py-8 text-center text-sm text-muted">No tools found</div>}</div>}

      <section className="mt-8">
        <div className="flex items-center justify-between"><h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Recently used</h2><Link href="/tools" className="text-xs font-medium text-accent">All tools</Link></div>
        {recentTools.length ? <div className="mt-3 grid grid-cols-3 gap-2">{recentTools.map((tool) => <Link key={tool.slug} href={`/tools/${tool.slug}`} className="flex min-w-0 flex-col gap-2 rounded-xl border border-border bg-surface p-3"><span className="text-xl">{tool.icon}</span><span className="truncate text-xs font-medium">{tool.name}</span></Link>)}</div> : <div className="mt-3 rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted">Tools you open will appear here.</div>}
      </section>

      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Kits</h2>
        <div className="mt-3 space-y-2">{kits.map((kit) => <Link key={kit.slug} href={`/kits/${kit.slug}`} className="flex items-center rounded-xl border border-border bg-surface px-4 py-3.5"><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{kit.name}</span><span className="mt-0.5 block text-xs text-muted">{getKitTools(kit).length} tools</span></span><span className="text-muted">›</span></Link>)}</div>
      </section>
    </div>
  );
}
