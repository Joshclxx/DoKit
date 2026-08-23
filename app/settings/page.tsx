import type { Metadata } from "next";
import { SettingsPanel } from "@/app/components/settings-panel";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage DoKit appearance, reusable defaults, and local data.",
};

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-medium text-accent">Local settings</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 text-muted">No account required. These preferences stay in this browser.</p>
      </div>
      <SettingsPanel />
    </div>
  );
}
