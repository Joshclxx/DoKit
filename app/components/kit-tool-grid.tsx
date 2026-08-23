"use client";

import { useMemo, useState } from "react";
import type { Tool } from "@/lib/tools";
import { ToolCard } from "./tool-card";

export function KitToolGrid({ tools }: { tools: Tool[] }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tools;
    return tools.filter((tool) =>
      `${tool.name} ${tool.description} ${tool.category}`.toLowerCase().includes(query)
    );
  }, [search, tools]);

  return (
    <div className="space-y-5">
      <div className="relative">
        <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={`Search ${tools.length} tools in this kit…`}
          className="h-12 w-full rounded-xl border border-border bg-surface pl-11 pr-4 text-sm placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </div>
      {filtered.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tool) => <ToolCard key={tool.slug} tool={tool} />)}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border py-12 text-center">
          <div className="text-3xl">🔍</div>
          <p className="mt-2 font-medium">No tools found in this kit</p>
          <button type="button" onClick={() => setSearch("")} className="mt-3 text-sm font-medium text-accent underline underline-offset-4">Clear search</button>
        </div>
      )}
    </div>
  );
}
