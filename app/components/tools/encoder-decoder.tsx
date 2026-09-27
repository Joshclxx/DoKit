"use client";

import { useMemo, useState } from "react";
import { copyToClipboard } from "@/lib/utils/download";

type Codec = "base64" | "url" | "html" | "hex" | "binary" | "unicode";

interface CodecDef { id: Codec; label: string; icon: string; encode: (s: string) => string; decode: (s: string) => string; }

const htmlEntities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
const htmlDecode: Record<string, string> = Object.fromEntries(Object.entries(htmlEntities).map(([k, v]) => [v, k]));

function decodeByteSequence(input: string, radix: 2 | 16): string {
  const tokens = input.trim().split(/\s+/);
  const pattern = radix === 16 ? /^[0-9a-fA-F]{2}$/ : /^[01]{8}$/;
  if (tokens.some((token) => !pattern.test(token))) {
    throw new Error(radix === 16
      ? "Hex input must contain two-digit bytes separated by spaces."
      : "Binary input must contain eight-bit bytes separated by spaces.");
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(
    new Uint8Array(tokens.map((token) => Number.parseInt(token, radix)))
  );
}

const codecs: CodecDef[] = [
  {
    id: "base64", label: "Base64", icon: "",
    encode: (s) => btoa(unescape(encodeURIComponent(s))),
    decode: (s) => decodeURIComponent(escape(atob(s.trim()))),
  },
  {
    id: "url", label: "URL", icon: "",
    encode: (s) => encodeURIComponent(s),
    decode: (s) => decodeURIComponent(s),
  },
  {
    id: "html", label: "HTML Entities", icon: "",
    encode: (s) => s.replace(/[&<>"']/g, (c) => htmlEntities[c] || c),
    decode: (s) => s.replace(/&amp;|&lt;|&gt;|&quot;|&#039;/g, (e) => htmlDecode[e] || e),
  },
  {
    id: "hex", label: "Hex", icon: "",
    encode: (s) => Array.from(new TextEncoder().encode(s)).map((b) => b.toString(16).padStart(2, "0")).join(" "),
    decode: (s) => decodeByteSequence(s, 16),
  },
  {
    id: "binary", label: "Binary", icon: "",
    encode: (s) => Array.from(new TextEncoder().encode(s)).map((b) => b.toString(2).padStart(8, "0")).join(" "),
    decode: (s) => decodeByteSequence(s, 2),
  },
  {
    id: "unicode", label: "Unicode Escape", icon: "",
    encode: (s) => Array.from({ length: s.length }, (_, index) =>
      "\\u" + s.charCodeAt(index).toString(16).padStart(4, "0")
    ).join(""),
    decode: (s) => s.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16))),
  },
];

export default function EncoderDecoder() {
  const [active, setActive] = useState<Codec>("base64");
  const [input, setInput] = useState("");
  const [direction, setDirection] = useState<"encode" | "decode">("encode");
  const [copied, setCopied] = useState(false);

  const codec = codecs.find((c) => c.id === active)!;

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: null };
    try {
      return {
        output: direction === "encode" ? codec.encode(input) : codec.decode(input),
        error: null,
      };
    } catch (e) {
      return {
        output: "",
        error: e instanceof Error ? e.message : "Invalid input",
      };
    }
  }, [codec, direction, input]);

  const handleCopy = async () => {
    await copyToClipboard(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const swap = () => {
    setInput(output);
    setDirection((d) => (d === "encode" ? "decode" : "encode"));
  };

  return (
    <div className="space-y-6">
      {/* Codec selector */}
      <div className="flex flex-wrap gap-2">
        {codecs.map((c) => (
          <button key={c.id} onClick={() => setActive(c.id)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              active === c.id ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface text-muted hover:text-foreground hover:border-border-hover"
            }`}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Direction toggle */}
      <div className="flex items-center gap-3">
        <div className="flex rounded-lg border border-border bg-surface p-1">
          <button onClick={() => setDirection("encode")}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${direction === "encode" ? "bg-accent text-accent-fg" : "text-muted hover:text-foreground"}`}>
            Encode
          </button>
          <button onClick={() => setDirection("decode")}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${direction === "decode" ? "bg-accent text-accent-fg" : "text-muted hover:text-foreground"}`}>
            Decode
          </button>
        </div>
        <button onClick={swap} title="Swap input ↔ output"
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm transition-colors hover:bg-surface-hover">
          ⇄ Swap
        </button>
      </div>

      {/* Input / Output */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-muted">Input</label>
          <textarea value={input} onChange={(e) => setInput(e.target.value)}
            placeholder={`Enter text to ${direction}…`} rows={8}
            className="w-full rounded-lg border border-border bg-surface p-3 font-mono text-sm leading-relaxed transition-colors focus:border-accent focus:outline-none resize-y" />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-muted">Output</label>
            <button onClick={handleCopy} disabled={!output}
              className="rounded px-2 py-1 text-xs text-muted hover:text-foreground disabled:opacity-40">
              {copied ? "✓ Copied" : " Copy"}
            </button>
          </div>
          <textarea value={error ? `Error: ${error}` : output} readOnly rows={8}
            className={`w-full rounded-lg border bg-surface/50 p-3 font-mono text-sm leading-relaxed resize-y ${error ? "border-danger text-danger" : "border-border"}`} />
        </div>
      </div>

      {/* Stats */}
      {output && !error && (
        <div className="flex flex-wrap gap-4 text-xs text-muted">
          <span>Input: {input.length} chars</span>
          <span>Output: {output.length} chars</span>
          <span>Ratio: {input.length ? (output.length / input.length).toFixed(2) : "—"}×</span>
        </div>
      )}
    </div>
  );
}
