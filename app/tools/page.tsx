import type { Metadata } from "next";
import { ToolGrid } from "@/app/components/tool-grid";
import { tools } from "@/lib/tools";

export const metadata: Metadata = {
  title: "All Tools",
  description:
    `Browse all ${tools.length} free browser-native productivity tools. Search by name or filter by category.`,
};

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-6 pt-4 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-5 sm:mb-8">
        <h1 className="sr-only font-bold tracking-tight md:not-sr-only md:text-3xl">All Tools</h1>
        <p className="text-sm leading-6 text-muted md:mt-2 md:text-base">
          {tools.length} browser-native tools — pick one and get to work.
        </p>
      </div>
      <ToolGrid />
    </div>
  );
}
