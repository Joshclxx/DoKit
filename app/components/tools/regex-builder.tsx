"use client";

import { useState, useMemo } from "react";
import { copyToClipboard } from "@/lib/utils/download";
import {
  buildRegexResults,
  generateRegexSnippet,
  type RegexMatchResult,
} from "@/lib/utils/regex";

const commonPatterns = [
  { label: "Email", pattern: "[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}" },
  { label: "URL", pattern: "https?:\\/\\/[^\\s\"'<>]+" },
  { label: "Phone", pattern: "\\+?\\d[\\d\\-().\\s]{6,}\\d" },
  { label: "Date (YYYY-MM-DD)", pattern: "\\d{4}-\\d{2}-\\d{2}" },
  { label: "IPv4", pattern: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b" },
  { label: "Hex Color", pattern: "#(?:[0-9a-fA-F]{3}){1,2}\\b" },
  { label: "HTML Tag", pattern: "<\\/?[a-z][\\s\\S]*?>" },
];

const flagOptions = [
  { flag: "g", label: "Global", desc: "Find all matches" },
  { flag: "i", label: "Case Insensitive", desc: "Ignore case" },
  { flag: "m", label: "Multiline", desc: "^ and $ match line boundaries" },
  { flag: "s", label: "DotAll", desc: ". matches newlines" },
];

export default function RegexBuilder() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [testStr, setTestStr] = useState("");
  const [snippetLang, setSnippetLang] = useState<"js" | "python" | "php">("js");
  const [copied, setCopied] = useState<string | null>(null);

  const toggleFlag = (f: string) => {
    setFlags((prev) => (prev.includes(f) ? prev.replace(f, "") : prev + f));
  };

  const { matches, error, highlighted } = useMemo(() => {
    if (!pattern || !testStr) return { matches: [], error: null, highlighted: testStr };
    try {
      return { ...buildRegexResults(pattern, flags, testStr), error: null };
    } catch (e) {
      return { matches: [] as RegexMatchResult[], error: e instanceof Error ? e.message : "Invalid regex", highlighted: testStr };
    }
  }, [pattern, flags, testStr]);

  const snippet = pattern ? generateRegexSnippet(pattern, flags, snippetLang) : "";

  const handleCopy = async (text: string, id: string) => {
    await copyToClipboard(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Pattern input + flags */}
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div>
          <label className="mb-2 block text-sm font-medium text-muted">Pattern</label>
          <div className="flex items-center rounded-lg border border-border bg-surface transition-colors focus-within:border-accent">
            <span className="pl-3 text-muted">/</span>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="Enter regex…"
              className="h-10 flex-1 bg-transparent px-1 font-mono text-sm focus:outline-none"
            />
            <span className="pr-3 text-muted">/{flags}</span>
          </div>
          {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-muted">Flags</label>
          <div className="flex gap-1">
            {flagOptions.map((f) => (
              <button
                key={f.flag}
                onClick={() => toggleFlag(f.flag)}
                title={`${f.label}: ${f.desc}`}
                className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-mono font-bold transition-colors ${
                  flags.includes(f.flag)
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-surface text-muted hover:text-foreground"
                }`}
              >
                {f.flag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Common patterns */}
      <div>
        <label className="mb-2 block text-sm font-medium text-muted">Common Patterns</label>
        <div className="flex flex-wrap gap-2">
          {commonPatterns.map((p) => (
            <button
              key={p.label}
              onClick={() => setPattern(p.pattern)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                pattern === p.pattern
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-surface text-muted hover:text-foreground hover:border-border-hover"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Test string with highlighting */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-muted">Test String</label>
          <span className="text-xs text-muted">
            {matches.length} match{matches.length !== 1 ? "es" : ""}
          </span>
        </div>
        <textarea
          value={testStr}
          onChange={(e) => setTestStr(e.target.value)}
          placeholder="Enter test text…"
          rows={5}
          className="w-full rounded-lg border border-border bg-surface p-3 font-mono text-sm leading-relaxed transition-colors focus:border-accent focus:outline-none resize-y"
        />
        {/* Highlighted preview */}
        {testStr && pattern && !error && (
          <div
            className="mt-2 rounded-lg border border-border bg-surface/50 p-3 font-mono text-sm leading-relaxed whitespace-pre-wrap break-all"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        )}
      </div>

      {/* Match results */}
      {matches.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-muted">Match Details</label>
          <div className="max-h-56 overflow-y-auto rounded-lg border border-border bg-surface">
            {matches.map((m, i) => (
              <div key={i} className="border-b border-border px-4 py-2 last:border-0 hover:bg-surface-hover transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">
                    <span className="text-muted mr-2">#{i + 1}</span>
                    <span className="text-accent">{m.full}</span>
                    <span className="ml-2 text-xs text-muted">@{m.index}</span>
                  </span>
                  <button
                    onClick={() => handleCopy(m.full, `m${i}`)}
                    className="text-xs text-muted hover:text-foreground"
                  >
                    {copied === `m${i}` ? "✓" : "Copy"}
                  </button>
                </div>
                {m.groups.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {m.groups.map((g, gi) => (
                      <span key={gi} className="rounded bg-surface-hover px-2 py-0.5 font-mono text-xs">
                        ${gi + 1}: {g ?? "undefined"}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Code snippets */}
      {pattern && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <label className="text-sm font-medium text-muted">Export as</label>
            {(["js", "python", "php"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setSnippetLang(lang)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                  snippetLang === lang
                    ? "bg-accent text-accent-fg"
                    : "bg-surface border border-border text-muted hover:text-foreground"
                }`}
              >
                {lang === "js" ? "JavaScript" : lang === "python" ? "Python" : "PHP"}
              </button>
            ))}
          </div>
          <div className="relative rounded-lg border border-border bg-surface p-4">
            <pre className="font-mono text-sm whitespace-pre-wrap">{snippet}</pre>
            <button
              onClick={() => handleCopy(snippet, "snippet")}
              className="absolute right-3 top-3 rounded px-2 py-1 text-xs text-muted hover:bg-surface-hover hover:text-foreground transition-colors"
            >
              {copied === "snippet" ? "✓ Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
