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
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">All Tools</h1>
        <p className="mt-2 text-muted">
          {tools.length} browser-native tools — pick one and get to work.
        </p>
      </div>
      <ToolGrid />
    </div>
  );
}
