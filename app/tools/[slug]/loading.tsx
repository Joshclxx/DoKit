export default function ToolLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-10 sm:px-6 lg:px-8" aria-label="Loading tool">
      <div className="h-4 w-48 rounded bg-surface-hover" />
      <div className="mt-7 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-surface-hover" /><div className="space-y-2"><div className="h-7 w-56 rounded bg-surface-hover" /><div className="h-4 w-80 max-w-full rounded bg-surface-hover" /></div></div>
      <div className="mt-8 min-h-[360px] rounded-xl border border-border bg-surface p-5"><div className="h-10 w-full rounded-lg bg-surface-hover" /><div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="h-56 rounded-lg bg-surface-hover" /><div className="h-56 rounded-lg bg-surface-hover" /></div></div>
    </div>
  );
}
