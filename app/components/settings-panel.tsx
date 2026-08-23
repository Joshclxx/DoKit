"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme, type ThemePreference } from "./theme-provider";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import {
  currencies,
  defaultPreferences,
  TOOL_STATE_PREFIX,
  type DoKitPreferences,
} from "@/lib/preferences";

const fieldClass = "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none";

function localDataSize() {
  if (typeof window === "undefined") return 0;
  let bytes = 0;
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index) ?? "";
    if (key.startsWith("dokit-")) bytes += key.length + (localStorage.getItem(key)?.length ?? 0);
  }
  return bytes * 2;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function SettingsPanel() {
  const { theme, setTheme } = useTheme();
  const [preferences, setPreferences] = useLocalStorage<DoKitPreferences>("preferences", defaultPreferences);
  const [dataBytes, setDataBytes] = useState(0);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDataBytes(localDataSize()), 0);
    return () => window.clearTimeout(timer);
  }, [preferences]);

  const themes = useMemo(() => ["system", "light", "dark"] as ThemePreference[], []);

  const updateProfile = (field: keyof DoKitPreferences["businessProfile"], value: string) => {
    setPreferences((current) => ({
      ...current,
      businessProfile: { ...current.businessProfile, [field]: value },
    }));
  };

  const exportData = () => {
    const data: Record<string, unknown> = {};
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key?.startsWith("dokit-")) continue;
      const raw = localStorage.getItem(key);
      try { data[key] = raw ? JSON.parse(raw) : null; } catch { data[key] = raw; }
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "dokit-local-data.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("Local data exported.");
  };

  const clearToolState = () => {
    if (!window.confirm("Clear saved drafts and state for every DoKit tool on this device?")) return;
    const keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
      .filter((key): key is string => Boolean(key?.startsWith(TOOL_STATE_PREFIX)));
    keys.forEach((key) => localStorage.removeItem(key));
    window.dispatchEvent(new CustomEvent("dokit-storage-change"));
    setDataBytes(localDataSize());
    setNotice(keys.length ? `Cleared ${keys.length} saved tool ${keys.length === 1 ? "draft" : "drafts"}.` : "No saved tool drafts to clear.");
  };

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Appearance</h2>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-3 text-sm font-medium">Theme</div>
          <div className="grid grid-cols-3 rounded-lg border border-border bg-background p-1">
            {themes.map((option) => (
              <button key={option} type="button" onClick={() => setTheme(option)}
                className={`rounded-md px-3 py-2 text-sm font-medium capitalize transition-colors ${theme === option ? "bg-accent text-accent-fg" : "text-muted hover:text-foreground"}`}>
                {option}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Defaults reused by tools</h2>
        <div className="space-y-4 rounded-xl border border-border bg-surface p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="mb-1 block text-xs text-muted">Your name</label><input className={fieldClass} value={preferences.businessProfile.name} onChange={(event) => updateProfile("name", event.target.value)} /></div>
            <div><label className="mb-1 block text-xs text-muted">Business name</label><input className={fieldClass} value={preferences.businessProfile.businessName} onChange={(event) => updateProfile("businessName", event.target.value)} /></div>
            <div><label className="mb-1 block text-xs text-muted">Email</label><input type="email" className={fieldClass} value={preferences.businessProfile.email} onChange={(event) => updateProfile("email", event.target.value)} /></div>
            <div><label className="mb-1 block text-xs text-muted">Default currency</label><select className={fieldClass} value={preferences.currency} onChange={(event) => setPreferences((current) => ({ ...current, currency: event.target.value }))}>{currencies.map((currency) => <option key={currency}>{currency}</option>)}</select></div>
          </div>
          <div><label className="mb-1 block text-xs text-muted">Business address</label><textarea rows={3} className="w-full rounded-lg border border-border bg-background p-3 text-sm focus:border-accent focus:outline-none" value={preferences.businessProfile.address} onChange={(event) => updateProfile("address", event.target.value)} /></div>
          <p className="text-xs text-muted">Invoice, quotation, and proposal drafts use these values when their matching fields are empty.</p>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Your data</h2>
        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          <button type="button" onClick={exportData} className="flex w-full items-center justify-between px-4 py-4 text-left text-sm hover:bg-surface-hover"><span>Export all as JSON</span><span className="text-muted">{formatBytes(dataBytes)} →</span></button>
          <button type="button" onClick={clearToolState} className="flex w-full items-center justify-between px-4 py-4 text-left text-sm text-danger hover:bg-danger/5"><span>Clear saved tool state</span><span>→</span></button>
        </div>
        {notice && <p role="status" className="mt-3 text-sm text-success">{notice}</p>}
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">About</h2>
        <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-4 text-sm"><span>Version</span><span className="text-muted">1.0.2</span></div>
      </section>
    </div>
  );
}
