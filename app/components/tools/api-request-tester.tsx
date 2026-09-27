"use client";

import { useState } from "react";
import { copyToClipboard } from "@/lib/utils/download";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

interface Header { key: string; value: string; enabled: boolean; }
interface Param { key: string; value: string; enabled: boolean; }

interface ResponseData {
  status: number; statusText: string; headers: Record<string, string>;
  body: string; time: number; size: number;
}

const methods: Method[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
const methodColors: Record<Method, string> = {
  GET: "bg-success/15 text-success", POST: "bg-accent/15 text-accent",
  PUT: "bg-warning/15 text-warning", PATCH: "bg-orange-500/15 text-orange-400",
  DELETE: "bg-danger/15 text-danger", HEAD: "bg-surface-hover text-muted",
  OPTIONS: "bg-surface-hover text-muted",
};

export default function ApiRequestTester() {
  const [url, setUrl] = useState("https://jsonplaceholder.typicode.com/posts/1");
  const [method, setMethod] = useState<Method>("GET");
  const [headers, setHeaders] = useState<Header[]>([{ key: "Content-Type", value: "application/json", enabled: true }]);
  const [params, setParams] = useState<Param[]>([]);
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"headers" | "params" | "body">("headers");
  const [respTab, setRespTab] = useState<"body" | "headers">("body");
  const [copied, setCopied] = useState(false);

  const addHeader = () => setHeaders((p) => [...p, { key: "", value: "", enabled: true }]);
  const rmHeader = (i: number) => setHeaders((p) => p.filter((_, idx) => idx !== i));
  const updateHeader = (i: number, f: keyof Header, v: string | boolean) => setHeaders((p) => p.map((h, idx) => idx === i ? { ...h, [f]: v } : h));

  const addParam = () => setParams((p) => [...p, { key: "", value: "", enabled: true }]);
  const rmParam = (i: number) => setParams((p) => p.filter((_, idx) => idx !== i));
  const updateParam = (i: number, f: keyof Param, v: string | boolean) => setParams((p) => p.map((pr, idx) => idx === i ? { ...pr, [f]: v } : pr));

  const buildUrl = (): string => {
    const activeParams = params.filter((p) => p.enabled && p.key);
    if (activeParams.length === 0) return url;
    const qs = activeParams.map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join("&");
    return url.includes("?") ? `${url}&${qs}` : `${url}?${qs}`;
  };

  const send = async () => {
    setLoading(true); setError(null); setResponse(null);
    const start = performance.now();
    try {
      const hdrs: Record<string, string> = {};
      headers.filter((h) => h.enabled && h.key).forEach((h) => { hdrs[h.key] = h.value; });

      const opts: RequestInit = { method, headers: hdrs, mode: "cors" };
      if (["POST", "PUT", "PATCH"].includes(method) && body.trim()) opts.body = body;

      const res = await fetch(buildUrl(), opts);
      const text = await res.text();
      const respHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => { respHeaders[k] = v; });

      setResponse({
        status: res.status, statusText: res.statusText, headers: respHeaders,
        body: text, time: Math.round(performance.now() - start), size: new Blob([text]).size,
      });
      setRespTab("body");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Request failed";
      setError(
        e instanceof TypeError || /failed to fetch|network/i.test(message)
          ? "The browser could not complete this request. The destination may be offline or may not allow browser requests (CORS). Try an endpoint that explicitly permits your site, or run the generated cURL command from a trusted terminal."
          : message
      );
    } finally { setLoading(false); }
  };

  const inp = "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none";

  const formatBody = (text: string): string => {
    try { return JSON.stringify(JSON.parse(text), null, 2); } catch { return text; }
  };

  return (
    <div className="space-y-5">
      {/* URL bar */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:flex">
        <select value={method} onChange={(e) => setMethod(e.target.value as Method)}
          className="col-start-1 row-start-2 h-10 w-full rounded-lg border border-border bg-surface px-2 text-sm font-bold focus:border-accent focus:outline-none sm:row-start-auto sm:w-28 sm:shrink-0">
          {methods.map((m) => <option key={m}>{m}</option>)}
        </select>
        <input type="text" value={url} onChange={(e) => setUrl(e.target.value)}
          placeholder="https://api.example.com/endpoint"
          className="col-span-2 row-start-1 h-10 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 font-mono text-sm focus:border-accent focus:outline-none sm:col-span-1 sm:row-start-auto"
          onKeyDown={(e) => e.key === "Enter" && send()} />
        <button onClick={send} disabled={loading || !url.trim()}
          className="col-start-2 row-start-2 h-10 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-fg shadow-lg shadow-accent/25 transition-all hover:bg-accent-hover disabled:opacity-50 sm:row-start-auto">
          {loading ? "…" : "Send"}
        </button>
      </div>

      {/* Method badge */}
      <span className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${methodColors[method]}`}>{method}</span>

      {/* Request tabs */}
      <div className="rounded-lg border border-border bg-surface">
        <div className="flex border-b border-border">
          {(["headers", "params", "body"] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === t ? "border-b-2 border-accent text-accent" : "text-muted hover:text-foreground"}`}>
              {t === "headers" ? `Headers (${headers.filter((h) => h.enabled).length})` : t === "params" ? `Params (${params.filter((p) => p.enabled).length})` : "Body"}
            </button>
          ))}
        </div>
        <div className="p-4">
          {activeTab === "headers" && (
            <div className="space-y-2">
              {headers.map((h, i) => (
                <div key={i} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <input type="checkbox" checked={h.enabled} onChange={(e) => updateHeader(i, "enabled", e.target.checked)} className="h-4 w-4 accent-accent" />
                  <input type="text" placeholder="Key" value={h.key} onChange={(e) => updateHeader(i, "key", e.target.value)} className={inp} />
                  <input type="text" placeholder="Value" value={h.value} onChange={(e) => updateHeader(i, "value", e.target.value)} className={`${inp} col-span-2 col-start-2 row-start-2 sm:col-span-1 sm:col-start-auto sm:row-start-auto`} />
                  <button onClick={() => rmHeader(i)} className="col-start-3 row-start-1 text-sm text-muted hover:text-danger sm:col-start-auto sm:row-start-auto">✕</button>
                </div>
              ))}
              <button onClick={addHeader} className="text-xs text-muted hover:text-accent">+ Add Header</button>
            </div>
          )}
          {activeTab === "params" && (
            <div className="space-y-2">
              {params.map((p, i) => (
                <div key={i} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <input type="checkbox" checked={p.enabled} onChange={(e) => updateParam(i, "enabled", e.target.checked)} className="h-4 w-4 accent-accent" />
                  <input type="text" placeholder="Key" value={p.key} onChange={(e) => updateParam(i, "key", e.target.value)} className={inp} />
                  <input type="text" placeholder="Value" value={p.value} onChange={(e) => updateParam(i, "value", e.target.value)} className={`${inp} col-span-2 col-start-2 row-start-2 sm:col-span-1 sm:col-start-auto sm:row-start-auto`} />
                  <button onClick={() => rmParam(i)} className="col-start-3 row-start-1 text-sm text-muted hover:text-danger sm:col-start-auto sm:row-start-auto">✕</button>
                </div>
              ))}
              <button onClick={addParam} className="text-xs text-muted hover:text-accent">+ Add Param</button>
            </div>
          )}
          {activeTab === "body" && (
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder='{"key": "value"}'
              rows={6} className="w-full rounded-lg border border-border bg-background p-3 font-mono text-sm focus:border-accent focus:outline-none resize-y" />
          )}
        </div>
      </div>

      {/* Error */}
      {error && <div className="rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger"><div className="font-semibold">Request blocked or failed</div><p className="mt-1 leading-6 text-foreground/80">{error}</p></div>}

      {/* Response */}
      {response && (
        <div className="rounded-lg border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <div className="flex items-center gap-3">
              <span className={`rounded px-2 py-0.5 text-xs font-bold ${response.status < 300 ? "bg-success/15 text-success" : response.status < 400 ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger"}`}>
                {response.status} {response.statusText}
              </span>
              <span className="text-xs text-muted">{response.time}ms</span>
              <span className="text-xs text-muted">{(response.size / 1024).toFixed(1)} KB</span>
            </div>
            <button onClick={async () => { await copyToClipboard(formatBody(response.body)); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="text-xs text-muted hover:text-foreground">{copied ? "✓" : "Copy"}</button>
          </div>
          <div className="flex border-b border-border">
            {(["body", "headers"] as const).map((t) => (
              <button key={t} onClick={() => setRespTab(t)}
                className={`px-4 py-2 text-sm font-medium ${respTab === t ? "border-b-2 border-accent text-accent" : "text-muted"}`}>
                {t === "body" ? "Body" : `Headers (${Object.keys(response.headers).length})`}
              </button>
            ))}
          </div>
          <div className="p-4">
            {respTab === "body" ? (
              <pre className="font-mono text-xs whitespace-pre-wrap max-h-96 overflow-y-auto">{formatBody(response.body)}</pre>
            ) : (
              <div className="space-y-1">
                {Object.entries(response.headers).map(([k, v]) => (
                  <div key={k} className="flex gap-3 text-sm"><span className="font-mono font-semibold text-accent shrink-0">{k}:</span><span className="text-muted break-all">{v}</span></div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
