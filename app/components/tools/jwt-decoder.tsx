"use client";

import { useEffect, useState, useMemo } from "react";
import { copyToClipboard } from "@/lib/utils/download";

function decodeBase64Url(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  return decodeURIComponent(
    atob(base64).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
  );
}

function tryParse(str: string): { data: Record<string, unknown> | null; error: string | null } {
  try {
    return { data: JSON.parse(str), error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Invalid JSON" };
  }
}

function formatTimestamp(val: unknown): string | null {
  if (typeof val !== "number") return null;
  if (val < 1e9 || val > 3e9) return null;
  return new Date(val * 1000).toLocaleString();
}

const sampleJWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

const knownClaims: Record<string, string> = {
  iss: "Issuer", sub: "Subject", aud: "Audience", exp: "Expiration Time",
  nbf: "Not Before", iat: "Issued At", jti: "JWT ID", name: "Name",
  email: "Email", role: "Role", scope: "Scope", permissions: "Permissions",
};

export default function JWTDecoder() {
  const [token, setToken] = useState(sampleJWT);
  const [copied, setCopied] = useState<string | null>(null);
  const [nowSeconds, setNowSeconds] = useState(0);

  useEffect(() => {
    const updateNow = () => setNowSeconds(Date.now() / 1000);
    const initialTimer = window.setTimeout(updateNow, 0);
    const interval = window.setInterval(updateNow, 30_000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
    };
  }, []);

  const decoded = useMemo(() => {
    const parts = token.trim().split(".");
    if (parts.length < 2) return { header: null, payload: null, signature: null, error: "Invalid JWT — expected 3 parts separated by dots" };
    try {
      const headerJson = decodeBase64Url(parts[0]);
      const payloadJson = decodeBase64Url(parts[1]);
      const header = tryParse(headerJson);
      const payload = tryParse(payloadJson);
      return { header, payload, signature: parts[2] || null, error: null };
    } catch {
      return { header: null, payload: null, signature: null, error: "Failed to decode JWT" };
    }
  }, [token]);

  const isExpired = useMemo(() => {
    if (!decoded.payload?.data?.exp) return null;
    const exp = decoded.payload.data.exp as number;
    return nowSeconds > 0 ? nowSeconds > exp : null;
  }, [decoded, nowSeconds]);

  const handleCopy = async (text: string, id: string) => {
    await copyToClipboard(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Input */}
      <div>
        <label className="mb-2 block text-sm font-medium text-muted">JWT Token</label>
        <textarea value={token} onChange={(e) => setToken(e.target.value)}
          placeholder="Paste your JWT here…" rows={4}
          className="w-full rounded-lg border border-border bg-surface p-3 font-mono text-sm leading-relaxed transition-colors focus:border-accent focus:outline-none resize-y" />
      </div>

      {decoded.error ? (
        <div className="rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger">{decoded.error}</div>
      ) : (
        <>
          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            {(typeof decoded.header?.data?.alg === "string" || typeof decoded.header?.data?.alg === "number") && (
              <span className="rounded-lg bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent">
                Algorithm: {String(decoded.header.data.alg)}
              </span>
            )}
            {(typeof decoded.header?.data?.typ === "string" || typeof decoded.header?.data?.typ === "number") && (
              <span className="rounded-lg bg-surface-hover px-3 py-1.5 text-sm font-medium text-muted">
                Type: {String(decoded.header.data.typ)}
              </span>
            )}
            {isExpired !== null && (
              <span className={`rounded-lg px-3 py-1.5 text-sm font-medium ${isExpired ? "bg-danger/10 text-danger" : "bg-success/10 text-success"}`}>
                {isExpired ? "⚠ Expired" : "✓ Not expired (signature unverified)"}
              </span>
            )}
          </div>

          {/* Header */}
          <Section title="Header" data={decoded.header?.data} raw={JSON.stringify(decoded.header?.data, null, 2) || ""}
            onCopy={(t, id) => handleCopy(t, id)} copied={copied} id="header" />

          {/* Payload */}
          <Section title="Payload" data={decoded.payload?.data} raw={JSON.stringify(decoded.payload?.data, null, 2) || ""}
            onCopy={(t, id) => handleCopy(t, id)} copied={copied} id="payload" showClaims />

          {/* Signature */}
          {decoded.signature && (
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">Signature</span>
                <button onClick={() => handleCopy(decoded.signature!, "sig")}
                  className="text-xs text-muted hover:text-foreground">{copied === "sig" ? "✓" : "📋"}</button>
              </div>
              <div className="font-mono text-sm break-all text-muted">{decoded.signature}</div>
              <p className="mt-2 text-xs text-muted">⚠ Signature verification requires the secret key and cannot be done client-side.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Section({ title, data, raw, onCopy, copied, id, showClaims }: {
  title: string; data: Record<string, unknown> | null | undefined; raw: string;
  onCopy: (text: string, id: string) => void; copied: string | null; id: string; showClaims?: boolean;
}) {
  if (!data) return null;
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">{title}</span>
        <button onClick={() => onCopy(raw, id)}
          className="text-xs text-muted hover:text-foreground">{copied === id ? "✓ Copied" : "📋 Copy JSON"}</button>
      </div>
      {showClaims ? (
        <div className="space-y-2">
          {Object.entries(data).map(([key, value]) => {
            const ts = formatTimestamp(value);
            return (
              <div key={key} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 text-sm">
                <div className="flex items-center gap-1.5 shrink-0 min-w-[140px]">
                  <span className="font-mono font-semibold text-accent">{key}</span>
                  {knownClaims[key] && <span className="text-xs text-muted">({knownClaims[key]})</span>}
                </div>
                <div className="font-mono break-all">
                  {typeof value === "string" ? value : JSON.stringify(value)}
                  {ts && <span className="ml-2 text-xs text-muted">→ {ts}</span>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <pre className="font-mono text-sm whitespace-pre-wrap">{raw}</pre>
      )}
    </div>
  );
}
