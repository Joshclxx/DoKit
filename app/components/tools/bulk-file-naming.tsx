"use client";

import { useState, useMemo } from "react";
import { copyToClipboard, downloadFile } from "@/lib/utils/download";

interface NamingConfig {
  prefix: string;
  suffix: string;
  counterEnabled: boolean;
  counterStart: number;
  counterStep: number;
  counterPadding: number;
  findText: string;
  replaceText: string;
  dateToken: string;
  caseTransform: "" | "lower" | "upper" | "title";
}

const defaultConfig: NamingConfig = {
  prefix: "",
  suffix: "",
  counterEnabled: false,
  counterStart: 1,
  counterStep: 1,
  counterPadding: 2,
  findText: "",
  replaceText: "",
  dateToken: "",
  caseTransform: "",
};

const dateTokens = [
  { label: "None", value: "" },
  { label: "YYYY-MM-DD", value: "date-iso" },
  { label: "YYYYMMDD", value: "date-compact" },
  { label: "DD-MM-YYYY", value: "date-eu" },
  { label: "Timestamp", value: "timestamp" },
];

function getDateString(token: string): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  switch (token) {
    case "date-iso": return `${y}-${m}-${d}`;
    case "date-compact": return `${y}${m}${d}`;
    case "date-eu": return `${d}-${m}-${y}`;
    case "timestamp": return String(Date.now());
    default: return "";
  }
}

function transformCase(name: string, transform: string): string {
  switch (transform) {
    case "lower": return name.toLowerCase();
    case "upper": return name.toUpperCase();
    case "title": return name.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    default: return name;
  }
}

function applyRename(filename: string, index: number, config: NamingConfig): string {
  const dotIdx = filename.lastIndexOf(".");
  let name = dotIdx > 0 ? filename.slice(0, dotIdx) : filename;
  const ext = dotIdx > 0 ? filename.slice(dotIdx) : "";

  // Find & replace
  if (config.findText) {
    name = name.split(config.findText).join(config.replaceText);
  }

  // Case transform
  name = transformCase(name, config.caseTransform);

  // Date token
  const dateStr = config.dateToken ? getDateString(config.dateToken) : "";

  // Counter
  const counterStr = config.counterEnabled
    ? String(config.counterStart + index * config.counterStep).padStart(config.counterPadding, "0")
    : "";

  // Assemble
  const parts = [config.prefix, dateStr, name, counterStr, config.suffix].filter(Boolean);
  return parts.join(parts.some((p) => p.includes(" ")) ? " " : "_") + ext;
}

export default function BulkFileNaming() {
  const [input, setInput] = useState("");
  const [config, setConfig] = useState<NamingConfig>(defaultConfig);
  const [copied, setCopied] = useState(false);

  const update = <K extends keyof NamingConfig>(key: K, value: NamingConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const filenames = useMemo(
    () => input.split("\n").map((l) => l.trim()).filter(Boolean),
    [input]
  );

  const renamed = useMemo(
    () => filenames.map((f, i) => applyRename(f, i, config)),
    [filenames, config]
  );

  const handleCopy = async () => {
    await copyToClipboard(renamed.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Input */}
      <div>
        <label className="mb-2 block text-sm font-medium text-muted">
          Original Filenames <span className="text-xs">(one per line)</span>
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={"photo_001.jpg\nDocument Final.pdf\nreadme.md"}
          rows={6}
          className="w-full rounded-lg border border-border bg-surface p-3 font-mono text-sm leading-relaxed transition-colors focus:border-accent focus:outline-none resize-y"
        />
      </div>

      {/* Controls grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Prefix / Suffix */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Prefix</label>
          <input type="text" value={config.prefix} onChange={(e) => update("prefix", e.target.value)}
            placeholder="project_" className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Suffix</label>
          <input type="text" value={config.suffix} onChange={(e) => update("suffix", e.target.value)}
            placeholder="_final" className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none" />
        </div>

        {/* Case transform */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Case</label>
          <select value={config.caseTransform} onChange={(e) => update("caseTransform", e.target.value as NamingConfig["caseTransform"])}
            className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none">
            <option value="">No change</option>
            <option value="lower">lowercase</option>
            <option value="upper">UPPERCASE</option>
            <option value="title">Title Case</option>
          </select>
        </div>

        {/* Date token */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Date Token</label>
          <select value={config.dateToken} onChange={(e) => update("dateToken", e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none">
            {dateTokens.map((dt) => (
              <option key={dt.value} value={dt.value}>{dt.label}</option>
            ))}
          </select>
        </div>

        {/* Find & Replace */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Find</label>
          <input type="text" value={config.findText} onChange={(e) => update("findText", e.target.value)}
            placeholder="old_text" className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Replace</label>
          <input type="text" value={config.replaceText} onChange={(e) => update("replaceText", e.target.value)}
            placeholder="new_text" className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none" />
        </div>
      </div>

      {/* Counter */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <label className="mb-3 flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={config.counterEnabled} onChange={(e) => update("counterEnabled", e.target.checked)}
            className="h-4 w-4 rounded border-border accent-accent" />
          Sequential Counter
        </label>
        {config.counterEnabled && (
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Start</label>
              <input type="number" value={config.counterStart} onChange={(e) => update("counterStart", Number(e.target.value))}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Step</label>
              <input type="number" value={config.counterStep} onChange={(e) => update("counterStep", Number(e.target.value))}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Zero-pad digits</label>
              <input type="number" min={1} max={8} value={config.counterPadding} onChange={(e) => update("counterPadding", Number(e.target.value))}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none" />
            </div>
          </div>
        )}
      </div>

      {/* Preview table */}
      {filenames.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-muted">
              Preview ({filenames.length} file{filenames.length !== 1 ? "s" : ""})
            </label>
            <div className="flex gap-2">
              <button onClick={handleCopy}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium transition-colors hover:bg-surface-hover">
                {copied ? "✓ Copied" : "Copy All"}
              </button>
              <button onClick={() => downloadFile(renamed.join("\n"), "renamed-files.txt")}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium transition-colors hover:bg-surface-hover">
                Export .txt
              </button>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto rounded-lg border border-border bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-hover text-left text-xs font-semibold uppercase tracking-wider text-muted">
                  <th className="px-4 py-2 w-8">#</th>
                  <th className="px-4 py-2">Original</th>
                  <th className="px-4 py-2 text-center">→</th>
                  <th className="px-4 py-2">Renamed</th>
                </tr>
              </thead>
              <tbody>
                {filenames.map((f, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
                    <td className="px-4 py-2 text-muted">{i + 1}</td>
                    <td className="px-4 py-2 font-mono text-muted">{f}</td>
                    <td className="px-4 py-2 text-center text-muted">→</td>
                    <td className="px-4 py-2 font-mono text-accent">{renamed[i]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
