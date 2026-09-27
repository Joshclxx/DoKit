import type { Metadata } from "next";
import { SettingsPanel } from "@/app/components/settings-panel";
import { MobileDownloadLanding } from "@/app/components/mobile-download-landing";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage DoKit appearance, reusable defaults, and local data.",
};

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-6 pt-4 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-5 sm:mb-8">
        <p className="text-sm font-medium text-accent">Local settings</p>
        <h1 className="sr-only mt-1 font-bold tracking-tight md:not-sr-only md:text-3xl">Settings</h1>
        <p className="mt-2 text-sm text-muted md:text-base">No account required. These preferences stay in this browser.</p>
      </div>
      <SettingsPanel />
      <MobileDownloadLanding />
    </div>
  );
}
