import type { Metadata } from "next";
import Link from "next/link";
import { getKitTools, kits } from "@/lib/kits";

export const metadata: Metadata = {
  title: "Kits",
  description: "Browse DoKit tools grouped into focused workflow kits.",
};

export default function KitsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-6 pt-4 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
      <div className="mb-5 sm:mb-8"><p className="text-sm font-medium text-accent">Workflow collections</p><h1 className="sr-only mt-1 font-bold tracking-tight md:not-sr-only md:text-3xl">Kits</h1><p className="mt-2 text-sm text-muted md:text-base">Start with the kind of work you need to finish.</p></div>
      <div className="grid gap-4 sm:grid-cols-2">{kits.map((kit) => {
        const kitTools = getKitTools(kit);
        return <Link key={kit.slug} href={`/kits/${kit.slug}`} className="group rounded-2xl border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-border-hover hover:shadow-[var(--shadow-md)]"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold group-hover:text-accent">{kit.name}</h2><p className="mt-2 text-sm leading-6 text-muted">{kit.description}</p></div><span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted">{kitTools.length}</span></div><div className="mt-4 flex flex-wrap gap-2">{kitTools.slice(0, 4).map((tool) => <span key={tool.slug} className="rounded-lg bg-surface-hover px-2.5 py-1 text-xs text-muted">{tool.name}</span>)}</div></Link>;
      })}</div>
    </div>
  );
}
