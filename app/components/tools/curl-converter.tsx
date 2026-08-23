"use client";

import { useState, useMemo } from "react";
import { copyToClipboard } from "@/lib/utils/download";

type OutputLang = "fetch" | "axios" | "jquery" | "python" | "php" | "go";

interface ParsedCurl {
  method: string;
  url: string;
  headers: Record<string, string>;
  data: string;
  error: string | null;
}

function parseCurl(cmd: string): ParsedCurl {
  const result: ParsedCurl = { method: "GET", url: "", headers: {}, data: "", error: null };
  try {
    const clean = cmd.replace(/\\\n/g, " ").replace(/\\\r\n/g, " ").trim();
    if (!clean.toLowerCase().startsWith("curl")) {
      result.error = "Command must start with 'curl'";
      return result;
    }

    // Extract URL — first bare argument or after curl
    const urlMatch = clean.match(/curl\s+(?:(?:-\w+\s+(?:'[^']*'|"[^"]*"|[^\s]+)\s+)*)?['"]?(https?:\/\/[^\s'"]+)['"]?/);
    if (urlMatch) result.url = urlMatch[1];
    else {
      const simpleUrl = clean.match(/(https?:\/\/[^\s'"]+)/);
      if (simpleUrl) result.url = simpleUrl[1];
    }

    // Method
    const methodMatch = clean.match(/-X\s+(\w+)/i);
    if (methodMatch) result.method = methodMatch[1].toUpperCase();

    // Headers
    const headerRegex = /-H\s+['"]([^'"]+)['"]/gi;
    let hMatch;
    while ((hMatch = headerRegex.exec(clean)) !== null) {
      const colonIdx = hMatch[1].indexOf(":");
      if (colonIdx > 0) {
        result.headers[hMatch[1].slice(0, colonIdx).trim()] = hMatch[1].slice(colonIdx + 1).trim();
      }
    }

    // Data
    const dataMatch = clean.match(/(?:-d|--data|--data-raw|--data-binary)\s+['"]([^'"]*)['"]/i);
    if (dataMatch) {
      result.data = dataMatch[1];
      if (!methodMatch) result.method = "POST";
    }
  } catch (e) {
    result.error = e instanceof Error ? e.message : "Parse error";
  }
  return result;
}

function toFetch(p: ParsedCurl): string {
  const opts: string[] = [`  method: "${p.method}"`];
  if (Object.keys(p.headers).length) opts.push(`  headers: ${JSON.stringify(p.headers, null, 4).replace(/\n/g, "\n  ")}`);
  if (p.data) opts.push(`  body: ${/^\{/.test(p.data.trim()) ? `JSON.stringify(${p.data})` : `'${p.data}'`}`);
  return `fetch("${p.url}", {\n${opts.join(",\n")}\n})\n  .then(res => res.json())\n  .then(data => console.log(data));`;
}

function toAxios(p: ParsedCurl): string {
  const opts: string[] = [`  method: "${p.method.toLowerCase()}"`, `  url: "${p.url}"`];
  if (Object.keys(p.headers).length) opts.push(`  headers: ${JSON.stringify(p.headers, null, 4).replace(/\n/g, "\n  ")}`);
  if (p.data) opts.push(`  data: ${p.data}`);
  return `axios({\n${opts.join(",\n")}\n})\n  .then(res => console.log(res.data));`;
}

function toJQuery(p: ParsedCurl): string {
  const opts = [`  url: "${p.url}"`, `  method: "${p.method}"`];
  if (Object.keys(p.headers).length) opts.push(`  headers: ${JSON.stringify(p.headers, null, 4).replace(/\n/g, "\n  ")}`);
  if (p.data) opts.push(`  data: '${p.data}'`);
  opts.push(`  success: function(data) { console.log(data); }`);
  return `$.ajax({\n${opts.join(",\n")}\n});`;
}

function toPython(p: ParsedCurl): string {
  const lines = ["import requests", ""];
  const args = [`"${p.url}"`];
  if (Object.keys(p.headers).length) args.push(`headers=${JSON.stringify(p.headers).replace(/"/g, "'")}`);
  if (p.data) args.push(`data='${p.data}'`);
  lines.push(`response = requests.${p.method.toLowerCase()}(${args.join(", ")})`);
  lines.push("print(response.json())");
  return lines.join("\n");
}

function toPhp(p: ParsedCurl): string {
  const lines = [
    "$ch = curl_init();",
    `curl_setopt($ch, CURLOPT_URL, "${p.url}");`,
    "curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);",
  ];
  if (p.method !== "GET") lines.push(`curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "${p.method}");`);
  if (Object.keys(p.headers).length) {
    const hdrs = Object.entries(p.headers).map(([k, v]) => `"${k}: ${v}"`).join(", ");
    lines.push(`curl_setopt($ch, CURLOPT_HTTPHEADER, [${hdrs}]);`);
  }
  if (p.data) lines.push(`curl_setopt($ch, CURLOPT_POSTFIELDS, '${p.data}');`);
  lines.push("$response = curl_exec($ch);", "curl_close($ch);", "echo $response;");
  return "<?php\n" + lines.join("\n") + "\n?>";
}

function toGo(p: ParsedCurl): string {
  const body = p.data ? `strings.NewReader(\`${p.data}\`)` : "nil";
  const lines = [
    'package main',
    '', 'import (', '  "fmt"', '  "io"', '  "net/http"',
    ...(p.data ? ['  "strings"'] : []),
    ')', '',
    'func main() {',
    `  req, _ := http.NewRequest("${p.method}", "${p.url}", ${body})`,
    ...Object.entries(p.headers).map(([k, v]) => `  req.Header.Set("${k}", "${v}")`),
    '  resp, _ := http.DefaultClient.Do(req)',
    '  defer resp.Body.Close()',
    '  body, _ := io.ReadAll(resp.Body)',
    '  fmt.Println(string(body))',
    '}',
  ];
  return lines.join("\n");
}

const converters: Record<OutputLang, { label: string; fn: (p: ParsedCurl) => string }> = {
  fetch: { label: "Fetch", fn: toFetch },
  axios: { label: "Axios", fn: toAxios },
  jquery: { label: "jQuery", fn: toJQuery },
  python: { label: "Python", fn: toPython },
  php: { label: "PHP", fn: toPhp },
  go: { label: "Go", fn: toGo },
};

const sampleCurl = `curl -X POST "https://api.example.com/users" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer token123" \\
  -d '{"name":"John","email":"john@example.com"}'`;

export default function CurlConverter() {
  const [input, setInput] = useState(sampleCurl);
  const [lang, setLang] = useState<OutputLang>("fetch");
  const [copied, setCopied] = useState(false);

  const parsed = useMemo(() => parseCurl(input), [input]);
  const output = useMemo(() => {
    if (parsed.error || !parsed.url) return "";
    return converters[lang].fn(parsed);
  }, [parsed, lang]);

  const handleCopy = async () => {
    await copyToClipboard(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Input */}
      <div>
        <label className="mb-2 block text-sm font-medium text-muted">cURL Command</label>
        <textarea value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Paste a cURL command…" rows={5}
          className="w-full rounded-lg border border-border bg-surface p-3 font-mono text-sm leading-relaxed transition-colors focus:border-accent focus:outline-none resize-y" />
        {parsed.error && <p className="mt-1 text-xs text-danger">{parsed.error}</p>}
      </div>

      {/* Parsed info */}
      {parsed.url && !parsed.error && (
        <div className="flex flex-wrap gap-2">
          <span className="rounded bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent">{parsed.method}</span>
          <span className="rounded bg-surface-hover px-2.5 py-1 text-xs font-mono text-muted truncate max-w-sm">{parsed.url}</span>
          {Object.keys(parsed.headers).length > 0 && (
            <span className="rounded bg-surface-hover px-2.5 py-1 text-xs text-muted">{Object.keys(parsed.headers).length} headers</span>
          )}
          {parsed.data && <span className="rounded bg-surface-hover px-2.5 py-1 text-xs text-muted">has body</span>}
        </div>
      )}

      {/* Language selector */}
      <div>
        <label className="mb-2 block text-sm font-medium text-muted">Convert to</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(converters) as OutputLang[]).map((l) => (
            <button key={l} onClick={() => setLang(l)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                lang === l ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface text-muted hover:text-foreground"
              }`}>
              {converters[l].label}
            </button>
          ))}
        </div>
      </div>

      {/* Output */}
      {output && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-muted">Output</label>
            <button onClick={handleCopy} className="text-xs text-muted hover:text-foreground">
              {copied ? "✓ Copied" : "📋 Copy"}
            </button>
          </div>
          <pre className="rounded-lg border border-border bg-surface p-4 font-mono text-sm whitespace-pre-wrap overflow-x-auto">{output}</pre>
        </div>
      )}
    </div>
  );
}
