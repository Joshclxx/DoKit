"use client";

import { useState, useCallback } from "react";
import { copyToClipboard } from "@/lib/utils/download";

const charSets = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:',.<>?/~`",
};

function getCharacterGroups(include: Record<string, boolean>, exclude: string): string[] {
  return Object.entries(charSets)
    .filter(([key]) => include[key])
    .map(([, chars]) => chars.split("").filter((char) => !exclude.includes(char)).join(""))
    .filter(Boolean);
}

function secureIndex(maxExclusive: number): number {
  const ceiling = 0x1_0000_0000;
  const limit = ceiling - (ceiling % maxExclusive);
  const sample = new Uint32Array(1);
  do crypto.getRandomValues(sample); while (sample[0] >= limit);
  return sample[0] % maxExclusive;
}

function generatePassword(length: number, include: Record<string, boolean>, exclude: string): string {
  const groups = getCharacterGroups(include, exclude);
  const pool = groups.join("");
  if (!pool) return "";
  const characters = groups.slice(0, length).map((group) => group[secureIndex(group.length)]);
  while (characters.length < length) characters.push(pool[secureIndex(pool.length)]);
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = secureIndex(index + 1);
    [characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]];
  }
  return characters.join("");
}

function calcEntropy(length: number, poolSize: number): number {
  if (poolSize <= 0 || length <= 0) return 0;
  return Math.round(length * Math.log2(poolSize));
}

function strengthLabel(entropy: number): { label: string; color: string; pct: number } {
  if (entropy >= 128) return { label: "Very Strong", color: "text-success", pct: 100 };
  if (entropy >= 80) return { label: "Strong", color: "text-emerald-400", pct: 80 };
  if (entropy >= 60) return { label: "Good", color: "text-warning", pct: 60 };
  if (entropy >= 40) return { label: "Fair", color: "text-orange-400", pct: 40 };
  return { label: "Weak", color: "text-danger", pct: 20 };
}

export default function PasswordGenerator() {
  const [length, setLength] = useState(20);
  const [include, setInclude] = useState({ upper: true, lower: true, digits: true, symbols: true });
  const [exclude, setExclude] = useState("");
  const [count, setCount] = useState(5);
  const [passwords, setPasswords] = useState<string[]>([]);
  const [copied, setCopied] = useState<number | null>(null);

  const poolSize = getCharacterGroups(include, exclude).join("").length;

  const entropy = calcEntropy(length, Math.max(0, poolSize));
  const strength = strengthLabel(entropy);

  const generate = useCallback(() => {
    const pws = Array.from({ length: count }, () => generatePassword(length, include, exclude));
    setPasswords(pws);
  }, [length, include, exclude, count]);

  const handleCopy = async (text: string, idx: number) => {
    await copyToClipboard(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-muted">Length: {length}</label>
          <input type="range" min={4} max={128} value={length} onChange={(e) => setLength(Number(e.target.value))}
            className="w-full accent-accent" />
          <div className="flex justify-between text-xs text-muted"><span>4</span><span>128</span></div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-muted">Count</label>
          <input type="number" min={1} max={20} value={count} onChange={(e) => setCount(Number(e.target.value))}
            className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none" />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {Object.entries(charSets).map(([key, chars]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={include[key as keyof typeof include]}
              onChange={(e) => setInclude((p) => ({ ...p, [key]: e.target.checked }))}
              className="h-4 w-4 rounded border-border accent-accent" />
            <span className="capitalize">{key}</span>
            <span className="text-xs text-muted">({chars.length})</span>
          </label>
        ))}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-muted">Exclude characters</label>
        <input type="text" value={exclude} onChange={(e) => setExclude(e.target.value)} placeholder="e.g. 0O1lI"
          className="h-9 w-full rounded-lg border border-border bg-surface px-3 font-mono text-sm focus:border-accent focus:outline-none" />
      </div>

      {/* Strength meter */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted">Entropy: <span className="font-bold text-foreground">{entropy} bits</span></span>
          <span className={`text-sm font-semibold ${strength.color}`}>{strength.label}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-surface-hover overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${entropy >= 80 ? "bg-success" : entropy >= 60 ? "bg-warning" : "bg-danger"}`}
            style={{ width: `${strength.pct}%` }} />
        </div>
      </div>

      {/* Generate button */}
      <button onClick={generate} disabled={poolSize === 0}
        className="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-accent-fg shadow-lg shadow-accent/25 transition-all hover:bg-accent-hover hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:transform-none">
         Generate Passwords
      </button>
      {poolSize === 0 && (
        <p className="text-sm text-danger" role="alert">
          Select at least one character set with a character that is not excluded.
        </p>
      )}

      {/* Results */}
      {passwords.length > 0 && (
        <div className="space-y-2">
          {passwords.map((pw, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-2.5 hover:bg-surface-hover transition-colors">
              <span className="flex-1 font-mono text-sm break-all select-all">{pw}</span>
              <button onClick={() => handleCopy(pw, i)}
                className="shrink-0 rounded px-2 py-1 text-xs text-muted hover:text-foreground transition-colors">
                {copied === i ? "✓" : "Copy"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
