"use client";

import { useState, useCallback, useRef } from "react";
import { copyToClipboard } from "@/lib/utils/download";

type Algorithm = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

const algorithms: Algorithm[] = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];

async function computeHash(text: string, algo: Algorithm): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest(algo, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function HashGenerator() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<Record<string, string>>({});
  const [computing, setComputing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [uppercase, setUppercase] = useState(false);
  const generationId = useRef(0);

  const computeAll = useCallback(async (text: string, showProgress: boolean) => {
    const currentId = ++generationId.current;
    if (showProgress) setComputing(true);
    const entries = await Promise.all(
      algorithms.map(async (algorithm) => [algorithm, await computeHash(text, algorithm)] as const)
    );
    if (currentId !== generationId.current) return;
    setResults(Object.fromEntries(entries));
    setComputing(false);
  }, []);

  const generate = useCallback(async () => {
    if (!input.trim()) return;
    await computeAll(input, true);
  }, [computeAll, input]);

  const handleCopy = async (text: string, algo: string) => {
    await copyToClipboard(uppercase ? text.toUpperCase() : text);
    setCopied(algo);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleInputChange = (text: string) => {
    setInput(text);
    if (text.trim()) {
      void computeAll(text, false);
    } else {
      generationId.current += 1;
      setResults({});
      setComputing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input */}
      <div>
        <label className="mb-2 block text-sm font-medium text-muted">Input Text</label>
        <textarea value={input} onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Enter text to hash…" rows={5}
          className="w-full rounded-lg border border-border bg-surface p-3 font-mono text-sm leading-relaxed transition-colors focus:border-accent focus:outline-none resize-y" />
      </div>

      {/* Options */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={uppercase} onChange={(e) => setUppercase(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-accent" />
          Uppercase output
        </label>
        <button onClick={generate} disabled={computing || !input.trim()}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-40">
          {computing ? "Computing…" : "Generate All"}
        </button>
      </div>

      {/* Results */}
      {Object.keys(results).length > 0 && (
        <div className="space-y-3">
          {algorithms.map((algo) => (
            <div key={algo} className="rounded-lg border border-border bg-surface p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">{algo}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">{results[algo]?.length || 0} chars</span>
                  <button onClick={() => handleCopy(results[algo], algo)}
                    className="rounded px-2 py-1 text-xs text-muted hover:text-foreground transition-colors">
                    {copied === algo ? "✓ Copied" : "📋"}
                  </button>
                </div>
              </div>
              <div className="font-mono text-sm break-all select-all">
                {uppercase ? results[algo]?.toUpperCase() : results[algo]}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compare */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">Verify Hash</label>
        <VerifySection results={results} uppercase={uppercase} />
      </div>
    </div>
  );
}

function VerifySection({ results, uppercase }: { results: Record<string, string>; uppercase: boolean }) {
  const [compareHash, setCompareHash] = useState("");
  const match = compareHash.trim()
    ? Object.entries(results).find(([, hash]) => {
        const h = uppercase ? hash.toUpperCase() : hash;
        return h === compareHash.trim() || hash === compareHash.trim().toLowerCase();
      })
    : null;

  return (
    <>
      <input type="text" value={compareHash} onChange={(e) => setCompareHash(e.target.value)}
        placeholder="Paste a hash to verify…"
        className="h-9 w-full rounded-lg border border-border bg-background px-3 font-mono text-sm focus:border-accent focus:outline-none" />
      {compareHash.trim() && (
        <div className="mt-2 text-sm">
          {match ? (
            <span className="text-success font-medium">✓ Matches {match[0]}</span>
          ) : Object.keys(results).length > 0 ? (
            <span className="text-danger font-medium">✗ No match found</span>
          ) : (
            <span className="text-muted">Generate hashes first, then verify</span>
          )}
        </div>
      )}
    </>
  );
}
