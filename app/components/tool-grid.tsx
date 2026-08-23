"use client";

import { useState, useMemo } from "react";
import { tools, categories, type Category, type Tool } from "@/lib/tools";
import { ToolCard } from "./tool-card";

export function ToolGrid() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | "All">("All");

  const filtered = useMemo(() => {
    let result: Tool[] = tools;

    if (activeCategory !== "All") {
      result = result.filter((t) => t.category === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }

    return result;
  }, [search, activeCategory]);

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          placeholder={`Search ${tools.length} tools…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-12 w-full rounded-xl border border-border bg-surface pl-11 pr-4 text-sm text-foreground placeholder:text-muted transition-colors focus:border-accent focus:outline-none"
        />
      </div>

      {/* Category Chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory("All")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            activeCategory === "All"
              ? "bg-accent text-accent-fg"
              : "bg-surface border border-border text-muted hover:text-foreground hover:border-border-hover"
          }`}
        >
          All ({tools.length})
        </button>
        {categories.map((cat) => {
          const count = tools.filter((t) => t.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-accent text-accent-fg"
                  : "bg-surface border border-border text-muted hover:text-foreground hover:border-border-hover"
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <span className="text-4xl">🔍</span>
          <p className="text-lg font-medium">No tools found</p>
          <p className="text-sm text-muted">
            Try a different search term or category.
          </p>
          <button
            type="button"
            onClick={() => { setSearch(""); setActiveCategory("All"); }}
            className="mt-3 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:border-border-hover hover:bg-surface-hover"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      )}
    </div>
  );
}
