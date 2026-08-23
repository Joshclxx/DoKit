"use client";

import { useState, useMemo } from "react";
import { copyToClipboard } from "@/lib/utils/download";

interface HtaccessConfig {
  rewriteEngine: boolean;
  forceHttps: boolean;
  forceWww: boolean;
  removeWww: boolean;
  customRedirects: { from: string; to: string; code: string }[];
  directoryIndex: string;
  errorPages: { code: string; page: string }[];
  blockIps: string;
  hotlinkProtection: boolean;
  hotlinkDomain: string;
  gzip: boolean;
  cacheControl: boolean;
  cacheDuration: string;
  preventDirListing: boolean;
  blockXmlRpc: boolean;
  securityHeaders: boolean;
  phpSettings: { key: string; value: string }[];
  passwordProtect: boolean;
  authName: string;
  authFile: string;
  corsEnabled: boolean;
  corsOrigin: string;
}

const defaults: HtaccessConfig = {
  rewriteEngine: true, forceHttps: false, forceWww: false, removeWww: false,
  customRedirects: [], directoryIndex: "", errorPages: [],
  blockIps: "", hotlinkProtection: false, hotlinkDomain: "example.com",
  gzip: true, cacheControl: true, cacheDuration: "2592000",
  preventDirListing: true, blockXmlRpc: false, securityHeaders: true,
  phpSettings: [], passwordProtect: false, authName: "Restricted Area", authFile: "/path/to/.htpasswd",
  corsEnabled: false, corsOrigin: "*",
};

function generate(c: HtaccessConfig): string {
  const lines: string[] = [];
  const add = (s: string) => lines.push(s);
  const section = (title: string) => { add(""); add(`# ${title}`); };

  if (c.rewriteEngine) { add("RewriteEngine On"); }

  if (c.forceHttps) {
    section("Force HTTPS");
    add("RewriteCond %{HTTPS} off");
    add("RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]");
  }

  if (c.forceWww) {
    section("Force WWW");
    add("RewriteCond %{HTTP_HOST} !^www\\. [NC]");
    add("RewriteRule ^(.*)$ https://www.%{HTTP_HOST}/$1 [L,R=301]");
  }

  if (c.removeWww) {
    section("Remove WWW");
    add("RewriteCond %{HTTP_HOST} ^www\\.(.+)$ [NC]");
    add("RewriteRule ^(.*)$ https://%1/$1 [L,R=301]");
  }

  if (c.customRedirects.length > 0) {
    section("Custom Redirects");
    c.customRedirects.forEach((r) => { if (r.from && r.to) add(`Redirect ${r.code} ${r.from} ${r.to}`); });
  }

  if (c.directoryIndex) { section("Directory Index"); add(`DirectoryIndex ${c.directoryIndex}`); }

  if (c.errorPages.length > 0) {
    section("Error Pages");
    c.errorPages.forEach((e) => { if (e.code && e.page) add(`ErrorDocument ${e.code} ${e.page}`); });
  }

  if (c.preventDirListing) { section("Prevent Directory Listing"); add("Options -Indexes"); }

  if (c.blockIps.trim()) {
    section("Block IPs");
    add("Order Allow,Deny"); add("Allow from all");
    c.blockIps.split("\n").filter(Boolean).forEach((ip) => add(`Deny from ${ip.trim()}`));
  }

  if (c.blockXmlRpc) {
    section("Block XML-RPC");
    add("<Files xmlrpc.php>"); add("  Order Deny,Allow"); add("  Deny from all"); add("</Files>");
  }

  if (c.hotlinkProtection) {
    section("Hotlink Protection");
    add("RewriteCond %{HTTP_REFERER} !^$");
    add(`RewriteCond %{HTTP_REFERER} !^https?://(www\\.)?${c.hotlinkDomain.replace(".", "\\.")} [NC]`);
    add("RewriteRule \\.(jpg|jpeg|png|gif|svg|webp)$ - [F,NC]");
  }

  if (c.gzip) {
    section("Gzip Compression");
    add("<IfModule mod_deflate.c>");
    ["text/html","text/plain","text/css","application/json","application/javascript","text/xml","application/xml","image/svg+xml"].forEach((t) =>
      add(`  AddOutputFilterByType DEFLATE ${t}`)
    );
    add("</IfModule>");
  }

  if (c.cacheControl) {
    section("Browser Cache");
    add("<IfModule mod_expires.c>");
    add("  ExpiresActive On");
    add(`  ExpiresByType image/jpeg "access plus ${c.cacheDuration} seconds"`);
    add(`  ExpiresByType image/png "access plus ${c.cacheDuration} seconds"`);
    add(`  ExpiresByType text/css "access plus ${c.cacheDuration} seconds"`);
    add(`  ExpiresByType application/javascript "access plus ${c.cacheDuration} seconds"`);
    add("</IfModule>");
  }

  if (c.securityHeaders) {
    section("Security Headers");
    add("<IfModule mod_headers.c>");
    add('  Header set X-Content-Type-Options "nosniff"');
    add('  Header set X-Frame-Options "SAMEORIGIN"');
    add('  Header set X-XSS-Protection "1; mode=block"');
    add('  Header set Referrer-Policy "strict-origin-when-cross-origin"');
    add("</IfModule>");
  }

  if (c.corsEnabled) {
    section("CORS");
    add("<IfModule mod_headers.c>");
    add(`  Header set Access-Control-Allow-Origin "${c.corsOrigin}"`);
    add('  Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"');
    add("</IfModule>");
  }

  if (c.passwordProtect) {
    section("Password Protection");
    add(`AuthName "${c.authName}"`); add("AuthType Basic");
    add(`AuthUserFile ${c.authFile}`); add("Require valid-user");
  }

  if (c.phpSettings.length > 0) {
    section("PHP Settings");
    c.phpSettings.forEach((s) => { if (s.key && s.value) add(`php_value ${s.key} ${s.value}`); });
  }

  return lines.join("\n");
}

export default function HtaccessRulesGenerator() {
  const [config, setConfig] = useState<HtaccessConfig>(defaults);
  const [copied, setCopied] = useState(false);

  const update = <K extends keyof HtaccessConfig>(k: K, v: HtaccessConfig[K]) => setConfig((p) => ({ ...p, [k]: v }));
  const output = useMemo(() => generate(config), [config]);

  const inp = "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none";
  const chk = (k: keyof HtaccessConfig, label: string) => (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={config[k] as boolean} onChange={(e) => update(k, e.target.checked as never)}
        className="h-4 w-4 rounded border-border accent-accent" />{label}
    </label>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Redirects</legend>
            <div className="flex flex-wrap gap-4">{chk("rewriteEngine", "RewriteEngine")}{chk("forceHttps", "Force HTTPS")}{chk("forceWww", "Force WWW")}{chk("removeWww", "Remove WWW")}</div>
            {config.customRedirects.map((r, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_80px_32px] items-end">
                <input type="text" placeholder="/old-path" value={r.from} onChange={(e) => update("customRedirects", config.customRedirects.map((x, idx) => idx === i ? { ...x, from: e.target.value } : x))} className={inp} />
                <input type="text" placeholder="/new-path" value={r.to} onChange={(e) => update("customRedirects", config.customRedirects.map((x, idx) => idx === i ? { ...x, to: e.target.value } : x))} className={inp} />
                <select value={r.code} onChange={(e) => update("customRedirects", config.customRedirects.map((x, idx) => idx === i ? { ...x, code: e.target.value } : x))} className={inp}><option>301</option><option>302</option></select>
                <button onClick={() => update("customRedirects", config.customRedirects.filter((_, idx) => idx !== i))} className="h-9 text-muted hover:text-danger">✕</button>
              </div>
            ))}
            <button onClick={() => update("customRedirects", [...config.customRedirects, { from: "", to: "", code: "301" }])}
              className="rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted hover:border-accent hover:text-accent">+ Redirect</button>
          </fieldset>

          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Security</legend>
            <div className="flex flex-wrap gap-4">{chk("securityHeaders", "Security Headers")}{chk("preventDirListing", "No Dir Listing")}{chk("blockXmlRpc", "Block XML-RPC")}{chk("hotlinkProtection", "Hotlink Protection")}{chk("passwordProtect", "Password Protect")}{chk("corsEnabled", "CORS")}</div>
            {config.hotlinkProtection && <div><label className="mb-1 block text-xs text-muted">Your Domain</label><input type="text" value={config.hotlinkDomain} onChange={(e) => update("hotlinkDomain", e.target.value)} className={inp} /></div>}
            {config.passwordProtect && <div className="grid gap-2 sm:grid-cols-2"><div><label className="mb-1 block text-xs text-muted">Auth Name</label><input type="text" value={config.authName} onChange={(e) => update("authName", e.target.value)} className={inp} /></div><div><label className="mb-1 block text-xs text-muted">.htpasswd Path</label><input type="text" value={config.authFile} onChange={(e) => update("authFile", e.target.value)} className={inp} /></div></div>}
            {config.corsEnabled && <div><label className="mb-1 block text-xs text-muted">Origin</label><input type="text" value={config.corsOrigin} onChange={(e) => update("corsOrigin", e.target.value)} className={inp} /></div>}
          </fieldset>

          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Performance</legend>
            <div className="flex flex-wrap gap-4">{chk("gzip", "Gzip")}{chk("cacheControl", "Browser Cache")}</div>
            {config.cacheControl && <div><label className="mb-1 block text-xs text-muted">Cache Duration (seconds)</label><input type="text" value={config.cacheDuration} onChange={(e) => update("cacheDuration", e.target.value)} className={inp} /></div>}
          </fieldset>

          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Block IPs</legend>
            <textarea value={config.blockIps} onChange={(e) => update("blockIps", e.target.value)} placeholder="One IP per line" rows={3}
              className="w-full rounded-lg border border-border bg-background p-3 font-mono text-sm focus:border-accent focus:outline-none resize-y" />
          </fieldset>
        </div>

        <div className="lg:sticky lg:top-4 self-start">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">.htaccess Output</span>
            <button onClick={async () => { await copyToClipboard(output); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="text-xs text-muted hover:text-foreground">{copied ? "✓ Copied" : "📋 Copy"}</button>
          </div>
          <pre className="rounded-lg border border-border bg-surface p-4 font-mono text-xs leading-relaxed whitespace-pre overflow-x-auto max-h-[70vh] overflow-y-auto">{output}</pre>
        </div>
      </div>
    </div>
  );
}
