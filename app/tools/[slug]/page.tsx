import { getToolBySlug, tools } from "@/lib/tools";
import { notFound } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { ToolVisitTracker } from "@/app/components/tool-visit-tracker";
import { BackButton } from "@/app/components/back-button";

/* ── Tool Component Registry ─────────────────────── */
/* Add entries here as tools are implemented.         */
/* Each component is lazy-loaded for code splitting.  */
const toolComponents: Record<string, ComponentType> = {
  "text-pattern-extractor": dynamic(
    () => import("@/app/components/tools/text-pattern-extractor")
  ),
  "data-cleanup-suite": dynamic(
    () => import("@/app/components/tools/data-cleanup-suite")
  ),
  "regex-builder": dynamic(
    () => import("@/app/components/tools/regex-builder")
  ),
  "csv-table-builder": dynamic(
    () => import("@/app/components/tools/csv-table-builder")
  ),
  "markdown-editor": dynamic(
    () => import("@/app/components/tools/markdown-editor")
  ),
  "structured-communication-builder": dynamic(
    () => import("@/app/components/tools/structured-communication-builder")
  ),
  "timezone-overlap": dynamic(
    () => import("@/app/components/tools/timezone-overlap")
  ),
  "focusflow": dynamic(
    () => import("@/app/components/tools/focusflow")
  ),
  "proposal-generator": dynamic(
    () => import("@/app/components/tools/proposal-generator")
  ),
  "ats-resume-builder": dynamic(
    () => import("@/app/components/tools/ats-resume-builder")
  ),
  "ui-system-blueprint": dynamic(
    () => import("@/app/components/tools/ui-system-blueprint")
  ),
  "contract-agreement-builder": dynamic(
    () => import("@/app/components/tools/contract-agreement-builder")
  ),
  "encoder-decoder": dynamic(
    () => import("@/app/components/tools/encoder-decoder")
  ),
  "password-generator": dynamic(
    () => import("@/app/components/tools/password-generator")
  ),
  "hash-generator": dynamic(
    () => import("@/app/components/tools/hash-generator")
  ),
  "jwt-decoder": dynamic(
    () => import("@/app/components/tools/jwt-decoder")
  ),
  "curl-converter": dynamic(
    () => import("@/app/components/tools/curl-converter")
  ),
  "pricing-calculator": dynamic(
    () => import("@/app/components/tools/pricing-calculator")
  ),
  "quotation-generator": dynamic(
    () => import("@/app/components/tools/quotation-generator")
  ),
  "invoice-builder": dynamic(
    () => import("@/app/components/tools/invoice-builder")
  ),
  "food-costing-tool": dynamic(
    () => import("@/app/components/tools/food-costing-tool")
  ),
  "currency-converter": dynamic(
    () => import("@/app/components/tools/currency-converter")
  ),
  "nginx-config-generator": dynamic(
    () => import("@/app/components/tools/nginx-config-generator")
  ),
  "htaccess-rules-generator": dynamic(
    () => import("@/app/components/tools/htaccess-rules-generator")
  ),
  "api-request-tester": dynamic(
    () => import("@/app/components/tools/api-request-tester")
  ),
  "system-spec-builder": dynamic(
    () => import("@/app/components/tools/system-spec-builder")
  ),
  "capstone-idea-builder": dynamic(
    () => import("@/app/components/tools/capstone-idea-builder")
  ),
  "color-system-toolkit": dynamic(
    () => import("@/app/components/tools/color-system-toolkit")
  ),
  "youtube-video-inspector": dynamic(
    () => import("@/app/components/tools/youtube-video-inspector")
  ),
  "image-compressor": dynamic(
    () => import("@/app/components/tools/image-compressor")
  ),
  "qr-code-builder": dynamic(
    () => import("@/app/components/tools/qr-code-builder")
  ),
  "bulk-certificate-generator": dynamic(
    () => import("@/app/components/tools/bulk-certificate-generator")
  ),
  "social-post-mockup-builder": dynamic(
    () => import("@/app/components/tools/social-post-mockup-builder")
  ),
  "id-card-badge-generator": dynamic(
    () => import("@/app/components/tools/id-card-badge-generator")
  ),
  "images-to-pdf": dynamic(
    () => import("@/app/components/tools/images-to-pdf")
  ),
  "icon-system-builder": dynamic(
    () => import("@/app/components/tools/icon-system-builder")
  ),
  "svg-system-builder": dynamic(
    () => import("@/app/components/tools/svg-system-builder")
  ),
  "sketch-wireframe-tool": dynamic(
    () => import("@/app/components/tools/sketch-wireframe-tool")
  ),
  "diagram-builder": dynamic(
    () => import("@/app/components/tools/diagram-builder")
  ),
  "text-extractor": dynamic(
    () => import("@/app/components/tools/text-extractor")
  ),
};

export function generateStaticParams() {
  return tools.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata(props: PageProps<"/tools/[slug]">) {
  const { slug } = await props.params;
  const tool = getToolBySlug(slug);
  if (!tool) return { title: "Tool Not Found" };
  return {
    title: tool.name,
    description: tool.description,
  };
}

export default async function ToolPage(props: PageProps<"/tools/[slug]">) {
  const { slug } = await props.params;
  const tool = getToolBySlug(slug);

  if (!tool) notFound();

  const ToolComponent = toolComponents[slug];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-6 pt-4 sm:px-6 sm:py-10 lg:px-8">
      <ToolVisitTracker slug={slug} />
      {/* Breadcrumb */}
      <nav className="mb-6 hidden items-center gap-2 text-sm text-muted md:flex" aria-label="Breadcrumb">
        <BackButton fallbackHref="/tools" />
        <span>/</span>
        <span className="text-foreground">{tool.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-5 sm:mb-8">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="sr-only font-bold tracking-tight md:not-sr-only md:text-3xl">
              {tool.name}
            </h1>
            <p className="text-sm leading-6 text-muted md:mt-1 md:text-base">{tool.description}</p>
            {tool.networkNote && (
              <p className="mt-2 max-w-3xl rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-500">
                Online tool: {tool.networkNote}
              </p>
            )}
          </div>
          <span className="hidden rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted sm:inline-flex">
            {tool.category}
          </span>
        </div>
      </div>

      {/* Tool workspace */}
      {ToolComponent ? (
        <div className="tool-workspace"><ToolComponent /></div>
      ) : (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/50 p-8 text-center">
          <h2 className="text-xl font-semibold">Coming Soon</h2>
          <p className="mt-2 max-w-md text-sm text-muted">
            This tool is being built. Check back soon or browse other tools
            while you wait.
          </p>
          <Link
            href="/tools"
            className="mt-6 inline-flex h-10 items-center rounded-lg bg-accent px-6 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
          >
            Browse All Tools
          </Link>
        </div>
      )}
    </div>
  );
}
