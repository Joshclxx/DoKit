import Link from "next/link";
import { tools } from "@/lib/tools";
import { MobileHome } from "@/app/components/mobile-home";

export default function Home() {
  return (
    <div className="flex flex-col">
      <MobileHome />
      {/* Hero */}
      <section className="relative hidden overflow-hidden md:block">
        {/* Gradient background decoration */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute right-0 top-1/3 h-[300px] w-[400px] rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              {tools.length} free tools · No login required
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Pick a tool.
              <br />
              <span className="bg-gradient-to-r from-accent to-accent-soft bg-clip-text text-transparent">
                Do the job.
              </span>
              <br />
              Keep moving.
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
              A browser-native productivity toolkit with {tools.length} focused micro-tools.
              Most processing stays on your device; online tools are clearly marked.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/tools"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-accent px-8 text-sm font-semibold text-accent-fg shadow-lg shadow-accent/25 transition-all hover:bg-accent-hover hover:shadow-xl hover:shadow-accent/30 hover:-translate-y-0.5 active:translate-y-0"
              >
                Browse All Tools
              </Link>
              <Link
                href="/kits/developer-tools"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-surface px-8 text-sm font-semibold transition-all hover:bg-surface-hover hover:border-border-hover hover:-translate-y-0.5 active:translate-y-0"
              >
                Developer Kit →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="hidden border-t border-border md:block">
        <div className="mx-auto grid max-w-7xl gap-px bg-border sm:grid-cols-3">
          {[
            {
              icon: "🔒",
              title: "Local First",
              desc: "Most transformations stay in your browser. Network-enabled tools are clearly identified.",
            },
            {
              icon: "⚡",
              title: "Instant Access",
              desc: "No account is required, and local tools work without sending your content to a server.",
            },
            {
              icon: "🧰",
              title: `${tools.length} Tools, 5 Kits`,
              desc: "Text, data, media, developer, and business tools in one place.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col gap-2 bg-background p-8 sm:p-10"
            >
              <span className="text-2xl">{feature.icon}</span>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
