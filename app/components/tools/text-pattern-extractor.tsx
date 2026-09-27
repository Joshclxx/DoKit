"use client";

import { useState, useMemo, useCallback } from "react";
import { copyToClipboard, downloadFile } from "@/lib/utils/download";

interface PatternPreset {
  label: string;
  regex: string;
  flags: string;
}

const presets: PatternPreset[] = [
  { label: " Email", regex: "[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}", flags: "gi" },
  { label: " URL", regex: "https?:\\/\\/[^\\s\"'<>]+", flags: "gi" },
  { label: " Phone", regex: "\\+?[\\d][\\d\\-().\\s]{6,}\\d", flags: "g" },
  { label: " Date", regex: "\\d{1,4}[\\-/.]\\d{1,2}[\\-/.]\\d{1,4}", flags: "g" },
  { label: " IPv4", regex: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b", flags: "g" },
  { label: " Number", regex: "-?\\d+\\.?\\d*", flags: "g" },
];

export default function TextPatternExtractor() {
  const [input, setInput] = useState("");
  const [patternStr, setPatternStr] = useState(presets[0].regex);
  const [flags, setFlags] = useState(presets[0].flags);
  const [deduplicate, setDeduplicate] = useState(false);
  const [copied, setCopied] = useState(false);

  const { results, regexError } = useMemo(() => {
    if (!input.trim() || !patternStr.trim()) {
      return { results: [] as string[], regexError: null };
    }
    try {
      const matchFlags = flags.includes("g") ? flags : `${flags}g`;
      const re = new RegExp(patternStr, matchFlags);
      const matches = input.match(re) || [];
      return {
        results: deduplicate ? [...new Set(matches)] : matches,
        regexError: null,
      };
    } catch (e) {
      return {
        results: [] as string[],
        regexError: e instanceof Error ? e.message : "Invalid regex",
      };
    }
  }, [input, patternStr, flags, deduplicate]);

  const handlePreset = useCallback((preset: PatternPreset) => {
    setPatternStr(preset.regex);
    setFlags(preset.flags);
  }, []);

  const handleCopy = async () => {
    await copyToClipboard(results.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = (format: "csv" | "txt") => {
    if (format === "csv") {
      const csv = "Match\n" + results.map((r) => `"${r.replace(/"/g, '""')}"`).join("\n");
      downloadFile(csv, "extracted-patterns.csv", "text/csv");
    } else {
      downloadFile(results.join("\n"), "extracted-patterns.txt", "text/plain");
    }
  };

  return (
    <div className="space-y-6">
      {/* Preset chips */}
      <div>
        <label className="mb-2 block text-sm font-medium text-muted">
          Pattern Presets
        </label>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePreset(preset)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                patternStr === preset.regex
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-surface text-muted hover:border-border-hover hover:text-foreground"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom regex input */}
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div>
          <label className="mb-2 block text-sm font-medium text-muted">
            Regex Pattern
          </label>
          <input
            type="text"
            value={patternStr}
            onChange={(e) => setPatternStr(e.target.value)}
            placeholder="Enter regex pattern…"
            className="h-10 w-full rounded-lg border border-border bg-surface px-3 font-mono text-sm transition-colors focus:border-accent focus:outline-none"
          />
          {regexError && (
            <p className="mt-1 text-xs text-danger">{regexError}</p>
          )}
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-muted">
            Flags
          </label>
          <input
            type="text"
            value={flags}
            onChange={(e) => setFlags(e.target.value)}
            placeholder="gi"
            className="h-10 w-20 rounded-lg border border-border bg-surface px-3 font-mono text-sm transition-colors focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      {/* Input text */}
      <div>
        <label className="mb-2 block text-sm font-medium text-muted">
          Input Text
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste your text here…"
          rows={8}
          className="w-full rounded-lg border border-border bg-surface p-3 font-mono text-sm leading-relaxed transition-colors focus:border-accent focus:outline-none resize-y"
        />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={deduplicate}
            onChange={(e) => setDeduplicate(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-accent"
          />
          Remove duplicates
        </label>
        <div className="ml-auto flex gap-2">
          <button
            onClick={handleCopy}
            disabled={results.length === 0}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {copied ? "✓ Copied" : "Copy All"}
          </button>
          <button
            onClick={() => handleExport("txt")}
            disabled={results.length === 0}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Export .txt
          </button>
          <button
            onClick={() => handleExport("csv")}
            disabled={results.length === 0}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Export .csv
          </button>
        </div>
      </div>

      {/* Results */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-muted">
            Results
          </label>
          <span className="text-xs text-muted">
            {results.length} match{results.length !== 1 ? "es" : ""}
          </span>
        </div>
        {results.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted">
            {input.trim()
              ? "No matches found for this pattern."
              : "Paste text above to extract patterns."}
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto rounded-lg border border-border bg-surface">
            {results.map((match, i) => (
              <div
                key={`${match}-${i}`}
                className="flex items-center justify-between border-b border-border px-4 py-2 last:border-0 hover:bg-surface-hover transition-colors"
              >
                <span className="font-mono text-sm break-all">{match}</span>
                <button
                  onClick={() => copyToClipboard(match)}
                  className="ml-3 shrink-0 rounded px-2 py-1 text-xs text-muted hover:bg-surface-hover hover:text-foreground transition-colors"
                  title="Copy"
                >
                  Copy
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
