import Link from "next/link";
import type { Tool } from "@/lib/tools";

const categoryColors: Record<string, string> = {
  Text: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Planning: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  Numbers: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Developer: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Media: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  Links: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  PDF: "bg-red-500/10 text-red-400 border-red-500/20",
};

export function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-1 rounded-xl border border-border bg-surface p-4 transition-all duration-200 hover:border-border-hover hover:shadow-[var(--shadow-md)] sm:grid-cols-[auto_1fr] sm:items-start sm:gap-y-0 sm:p-5 sm:hover:-translate-y-0.5"
    >
        <span className="row-span-2 text-2xl sm:row-span-1">{tool.icon}</span>
        <div className="row-span-2 flex items-center gap-1.5 sm:row-span-1 sm:justify-self-end">
          {tool.networkNote && (
            <span className="inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-500">
              Online
            </span>
          )}
          <span
            className={`hidden rounded-full border px-2.5 py-0.5 text-xs font-medium sm:inline-flex ${categoryColors[tool.category] ?? "bg-muted/10 text-muted border-muted/20"}`}
          >
            {tool.category}
          </span>
        </div>
      <h3 className="col-start-2 row-start-1 truncate font-semibold leading-tight transition-colors group-hover:text-accent sm:col-span-2 sm:col-start-1 sm:row-start-2 sm:mt-3 sm:whitespace-normal">
        {tool.name}
      </h3>
      <p className="col-start-2 row-start-2 line-clamp-1 text-xs text-muted sm:col-span-2 sm:col-start-1 sm:row-start-3 sm:mt-2 sm:line-clamp-2 sm:text-sm">{tool.description}</p>
      <span className="row-span-2 text-muted sm:hidden" aria-hidden>›</span>
    </Link>
  );
}
