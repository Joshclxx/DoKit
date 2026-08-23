"use client";

import { useState } from "react";
import { copyToClipboard, downloadFile } from "@/lib/utils/download";

type Operation =
  | "trim"
  | "remove-blank"
  | "strip-html"
  | "dedup-sensitive"
  | "dedup-insensitive"
  | "sort-az"
  | "sort-za"
  | "sort-length"
  | "upper"
  | "lower"
  | "title"
  | "sentence"
  | "number-list"
  | "bullet-list";

interface Op {
  id: Operation;
  label: string;
  group: string;
}

const operations: Op[] = [
  { id: "trim", label: "Trim Whitespace", group: "Clean" },
  { id: "remove-blank", label: "Remove Blank Lines", group: "Clean" },
  { id: "strip-html", label: "Strip HTML Tags", group: "Clean" },
  { id: "dedup-sensitive", label: "Deduplicate (Case Sensitive)", group: "Deduplicate" },
  { id: "dedup-insensitive", label: "Deduplicate (Case Insensitive)", group: "Deduplicate" },
  { id: "sort-az", label: "Sort A → Z", group: "Sort" },
  { id: "sort-za", label: "Sort Z → A", group: "Sort" },
  { id: "sort-length", label: "Sort by Length", group: "Sort" },
  { id: "upper", label: "UPPERCASE", group: "Case" },
  { id: "lower", label: "lowercase", group: "Case" },
  { id: "title", label: "Title Case", group: "Case" },
  { id: "sentence", label: "Sentence case", group: "Case" },
  { id: "number-list", label: "Number List (1. 2. 3.)", group: "Wrap" },
  { id: "bullet-list", label: "Bullet List (• item)", group: "Wrap" },
];

function applyOperation(text: string, op: Operation): string {
  const lines = text.split("\n");

  switch (op) {
    case "trim":
      return lines.map((l) => l.trim()).join("\n");
    case "remove-blank":
      return lines.filter((l) => l.trim().length > 0).join("\n");
    case "strip-html":
      return text.replace(/<[^>]*>/g, "");
    case "dedup-sensitive":
      return [...new Set(lines)].join("\n");
    case "dedup-insensitive": {
      const seen = new Set<string>();
      return lines
        .filter((l) => {
          const key = l.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .join("\n");
    }
    case "sort-az":
      return [...lines].sort((a, b) => a.localeCompare(b)).join("\n");
    case "sort-za":
      return [...lines].sort((a, b) => b.localeCompare(a)).join("\n");
    case "sort-length":
      return [...lines].sort((a, b) => a.length - b.length).join("\n");
    case "upper":
      return text.toUpperCase();
    case "lower":
      return text.toLowerCase();
    case "title":
      return text.replace(
        /\w\S*/g,
        (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
      );
    case "sentence":
      return text
        .toLowerCase()
        .replace(/(^\s*|[.!?]\s+)(\w)/g, (_, prefix, char) => prefix + char.toUpperCase());
    case "number-list":
      return lines
        .filter((l) => l.trim())
        .map((l, i) => `${i + 1}. ${l.trim()}`)
        .join("\n");
    case "bullet-list":
      return lines
        .filter((l) => l.trim())
        .map((l) => `• ${l.trim()}`)
        .join("\n");
    default:
      return text;
  }
}

export default function DataCleanupSuite() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [useRegex, setUseRegex] = useState(false);

  const apply = (op: Operation) => {
    const source = output || input;
    if (!source.trim()) return;
    setHistory((h) => [...h, source]);
    setOutput(applyOperation(source, op));
  };

  const handleFindReplace = () => {
    const source = output || input;
    if (!source.trim() || !findText) return;
    setHistory((h) => [...h, source]);
    try {
      if (useRegex) {
        const re = new RegExp(findText, "g");
        setOutput(source.replace(re, replaceText));
      } else {
        setOutput(source.split(findText).join(replaceText));
      }
    } catch {
      // Invalid regex — silently ignore
    }
  };

  const undo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setOutput(prev);
  };

  const reset = () => {
    setOutput("");
    setHistory([]);
  };

  const handleCopy = async () => {
    await copyToClipboard(output || input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const current = output || input;
  const lineCount = current ? current.split("\n").length : 0;
  const charCount = current.length;

  return (
    <div className="space-y-6">
      {/* The operation rail is shared by the text-in/text-out tool archetype. */}
      <div className="rounded-xl border border-border bg-surface/60 p-3">
        <div className="flex flex-wrap gap-2">
          {operations.map((op) => (
            <button
              key={op.id}
              onClick={() => apply(op.id)}
              title={op.group}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium transition-colors hover:border-accent hover:bg-accent/10 hover:text-accent"
            >
              {op.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input / Output side by side on desktop */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-muted">
            Input
          </label>
          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); setOutput(""); setHistory([]); }}
            placeholder="Paste your messy text here…"
            rows={12}
            className="w-full rounded-lg border border-border bg-surface p-3 font-mono text-sm leading-relaxed transition-colors focus:border-accent focus:outline-none resize-y"
          />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-muted">Output</label>
            <span className="text-xs text-muted">
              {lineCount} lines · {charCount} chars
            </span>
          </div>
          <textarea
            value={output || input}
            readOnly
            rows={12}
            className="w-full rounded-lg border border-border bg-surface/50 p-3 font-mono text-sm leading-relaxed resize-y"
          />
        </div>
      </div>

      {/* Find & Replace */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-muted">
          Find & Replace
        </label>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input
            type="text"
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            placeholder="Find…"
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm transition-colors focus:border-accent focus:outline-none"
          />
          <input
            type="text"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            placeholder="Replace with…"
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm transition-colors focus:border-accent focus:outline-none"
          />
          <button
            onClick={handleFindReplace}
            className="h-9 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
          >
            Replace
          </button>
        </div>
        <label className="mt-2 flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={useRegex}
            onChange={(e) => setUseRegex(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-accent"
          />
          Use regex
        </label>
      </div>

      {/* Action bar */}
      <div className="tool-action-bar flex flex-wrap gap-2">
        <button
          onClick={undo}
          disabled={history.length === 0}
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ↩ Undo
        </button>
        <button
          onClick={reset}
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-hover"
        >
          Reset
        </button>
        <div className="ml-auto flex gap-2">
          <button
            onClick={handleCopy}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-hover"
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
          <button
            onClick={() => downloadFile(output || input, "cleaned-text.txt")}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-hover"
          >
            Export .txt
          </button>
        </div>
      </div>
    </div>
  );
}
