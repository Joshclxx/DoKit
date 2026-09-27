import { getKitBySlug, getKitTools, kits } from "@/lib/kits";
import { notFound } from "next/navigation";
import Link from "next/link";
import { KitToolGrid } from "@/app/components/kit-tool-grid";
import { BackButton } from "@/app/components/back-button";

export function generateStaticParams() {
  return kits.map((k) => ({ slug: k.slug }));
}

export async function generateMetadata(props: PageProps<"/kits/[slug]">) {
  const { slug } = await props.params;
  const kit = getKitBySlug(slug);
  if (!kit) return { title: "Kit Not Found" };
  return {
    title: `${kit.name} Kit`,
    description: kit.description,
  };
}

export default async function KitPage(props: PageProps<"/kits/[slug]">) {
  const { slug } = await props.params;
  const kit = getKitBySlug(slug);

  if (!kit) notFound();

  const kitTools = getKitTools(kit);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-6 pt-4 sm:px-6 sm:py-10 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 hidden items-center gap-2 text-sm text-muted md:flex" aria-label="Breadcrumb">
        <BackButton fallbackHref="/kits" />
        <span>/</span>
        <span className="text-foreground">{kit.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-5 sm:mb-8">
        <h1 className="sr-only font-bold tracking-tight md:not-sr-only md:text-3xl">{kit.name}</h1>
        <p className="text-sm leading-6 text-muted md:mt-2 md:text-base">{kit.description}</p>
        <p className="mt-1 text-sm text-muted">
          {kitTools.length} tools in this kit
        </p>
      </div>

      <KitToolGrid tools={kitTools} />

      {/* Other Kits */}
      <div className="mt-16 border-t border-border pt-8">
        <h2 className="mb-4 text-lg font-semibold">Other Kits</h2>
        <div className="flex flex-wrap gap-3">
          {kits
            .filter((k) => k.slug !== slug)
            .map((k) => (
              <Link
                key={k.slug}
                href={`/kits/${k.slug}`}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-border-hover hover:text-foreground"
              >
                {k.name}
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
