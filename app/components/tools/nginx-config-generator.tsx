"use client";

import { useState, useMemo } from "react";
import { copyToClipboard } from "@/lib/utils/download";

interface NginxConfig {
  serverName: string; port: number; root: string;
  ssl: boolean; sslCert: string; sslKey: string;
  proxy: boolean; proxyPass: string; proxyWs: boolean;
  gzip: boolean; http2: boolean;
  securityHeaders: boolean; cors: boolean; corsOrigin: string;
  rateLimit: boolean; rateLimitRate: string;
  redirect: boolean; redirectFrom: string;
  cacheStatic: boolean; cacheDuration: string;
  phpFpm: boolean; phpSocket: string;
  customLocations: string;
}

const defaults: NginxConfig = {
  serverName: "example.com", port: 80, root: "/var/www/html",
  ssl: false, sslCert: "/etc/ssl/certs/example.crt", sslKey: "/etc/ssl/private/example.key",
  proxy: false, proxyPass: "http://127.0.0.1:3000", proxyWs: false,
  gzip: true, http2: true,
  securityHeaders: true, cors: false, corsOrigin: "*",
  rateLimit: false, rateLimitRate: "10r/s",
  redirect: false, redirectFrom: "www.example.com",
  cacheStatic: true, cacheDuration: "30d",
  phpFpm: false, phpSocket: "unix:/run/php/php8.2-fpm.sock",
  customLocations: "",
};

function generateConfig(c: NginxConfig): string {
  const lines: string[] = [];
  const add = (s: string, indent = 0) => lines.push("    ".repeat(indent) + s);

  // Rate limiting zone
  if (c.rateLimit) add(`limit_req_zone $binary_remote_addr zone=main:10m rate=${c.rateLimitRate};`);

  // HTTP → HTTPS redirect
  if (c.ssl && c.redirect) {
    add("server {"); add(`listen 80;`, 1); add(`server_name ${c.redirectFrom} ${c.serverName};`, 1);
    add(`return 301 https://${c.serverName}$request_uri;`, 1); add("}"); add("");
  }

  add("server {");
  // Listen
  if (c.ssl) {
    add(`listen 443 ssl${c.http2 ? " http2" : ""};`, 1);
    add(`listen [::]:443 ssl${c.http2 ? " http2" : ""};`, 1);
  } else {
    add(`listen ${c.port};`, 1);
    add(`listen [::]:${c.port};`, 1);
  }
  add("", 0); add(`server_name ${c.serverName};`, 1);

  // SSL
  if (c.ssl) {
    add("", 0); add("# SSL", 1);
    add(`ssl_certificate ${c.sslCert};`, 1);
    add(`ssl_certificate_key ${c.sslKey};`, 1);
    add("ssl_protocols TLSv1.2 TLSv1.3;", 1);
    add('ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256";', 1);
    add("ssl_prefer_server_ciphers on;", 1);
  }

  // Root
  if (!c.proxy) {
    add("", 0); add(`root ${c.root};`, 1);
    add("index index.html index.htm;", 1);
  }

  // Gzip
  if (c.gzip) {
    add("", 0); add("# Gzip", 1);
    add("gzip on;", 1); add("gzip_vary on;", 1);
    add("gzip_min_length 1024;", 1);
    add("gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;", 1);
  }

  // Security headers
  if (c.securityHeaders) {
    add("", 0); add("# Security Headers", 1);
    add('add_header X-Frame-Options "SAMEORIGIN" always;', 1);
    add('add_header X-Content-Type-Options "nosniff" always;', 1);
    add('add_header X-XSS-Protection "1; mode=block" always;', 1);
    add('add_header Referrer-Policy "strict-origin-when-cross-origin" always;', 1);
  }

  // CORS
  if (c.cors) {
    add("", 0); add("# CORS", 1);
    add(`add_header Access-Control-Allow-Origin "${c.corsOrigin}" always;`, 1);
    add('add_header Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE" always;', 1);
    add('add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;', 1);
  }

  // Rate limiting
  if (c.rateLimit) {
    add("", 0); add("# Rate Limiting", 1);
    add("limit_req zone=main burst=20 nodelay;", 1);
  }

  // Proxy
  if (c.proxy) {
    add("", 0); add("location / {", 1);
    add(`proxy_pass ${c.proxyPass};`, 2);
    add("proxy_set_header Host $host;", 2);
    add("proxy_set_header X-Real-IP $remote_addr;", 2);
    add("proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;", 2);
    add("proxy_set_header X-Forwarded-Proto $scheme;", 2);
    if (c.proxyWs) {
      add("", 0); add("# WebSocket", 2);
      add("proxy_http_version 1.1;", 2);
      add('proxy_set_header Upgrade $http_upgrade;', 2);
      add('proxy_set_header Connection "upgrade";', 2);
    }
    add("}", 1);
  } else {
    add("", 0); add("location / {", 1);
    add("try_files $uri $uri/ =404;", 2);
    add("}", 1);
  }

  // PHP-FPM
  if (c.phpFpm) {
    add("", 0); add("location ~ \\.php$ {", 1);
    add(`fastcgi_pass ${c.phpSocket};`, 2);
    add("fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;", 2);
    add("include fastcgi_params;", 2);
    add("}", 1);
  }

  // Static cache
  if (c.cacheStatic) {
    add("", 0); add("location ~* \\.(jpg|jpeg|png|gif|ico|css|js|woff2|svg)$ {", 1);
    add(`expires ${c.cacheDuration};`, 2);
    add("add_header Cache-Control \"public, immutable\";", 2);
    add("}", 1);
  }

  // Custom locations
  if (c.customLocations.trim()) {
    add("", 0); add("# Custom", 1);
    c.customLocations.split("\n").forEach((l) => add(l, 1));
  }

  add("}");
  return lines.join("\n");
}

export default function NginxConfigGenerator() {
  const [config, setConfig] = useState<NginxConfig>(defaults);
  const [copied, setCopied] = useState(false);

  const update = <K extends keyof NginxConfig>(k: K, v: NginxConfig[K]) => setConfig((p) => ({ ...p, [k]: v }));
  const output = useMemo(() => generateConfig(config), [config]);

  const inp = "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none";
  const toggle = (k: keyof NginxConfig, label: string) => (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={config[k] as boolean} onChange={(e) => update(k, e.target.checked as never)}
        className="h-4 w-4 rounded border-border accent-accent" />{label}
    </label>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Form */}
        <div className="space-y-5">
          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Server</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <div><label className="mb-1 block text-xs text-muted">Server Name</label><input type="text" value={config.serverName} onChange={(e) => update("serverName", e.target.value)} className={inp} /></div>
              <div><label className="mb-1 block text-xs text-muted">Port</label><input type="number" value={config.port} onChange={(e) => update("port", Number(e.target.value))} className={inp} /></div>
            </div>
            <div><label className="mb-1 block text-xs text-muted">Document Root</label><input type="text" value={config.root} onChange={(e) => update("root", e.target.value)} className={inp} /></div>
          </fieldset>

          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Features</legend>
            <div className="flex flex-wrap gap-4">
              {toggle("ssl", "SSL/TLS")}{toggle("gzip", "Gzip")}{toggle("http2", "HTTP/2")}
              {toggle("securityHeaders", "Security Headers")}{toggle("cacheStatic", "Cache Static")}
            </div>
            {config.ssl && <div className="grid gap-2 sm:grid-cols-2 mt-2">
              <div><label className="mb-1 block text-xs text-muted">SSL Certificate</label><input type="text" value={config.sslCert} onChange={(e) => update("sslCert", e.target.value)} className={inp} /></div>
              <div><label className="mb-1 block text-xs text-muted">SSL Key</label><input type="text" value={config.sslKey} onChange={(e) => update("sslKey", e.target.value)} className={inp} /></div>
            </div>}
            {config.cacheStatic && <div><label className="mb-1 block text-xs text-muted">Cache Duration</label><input type="text" value={config.cacheDuration} onChange={(e) => update("cacheDuration", e.target.value)} className={inp} /></div>}
          </fieldset>

          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Proxy / Backend</legend>
            <div className="flex flex-wrap gap-4">
              {toggle("proxy", "Reverse Proxy")}{toggle("proxyWs", "WebSocket")}{toggle("phpFpm", "PHP-FPM")}
            </div>
            {config.proxy && <div><label className="mb-1 block text-xs text-muted">Proxy Pass</label><input type="text" value={config.proxyPass} onChange={(e) => update("proxyPass", e.target.value)} className={inp} /></div>}
            {config.phpFpm && <div><label className="mb-1 block text-xs text-muted">PHP Socket</label><input type="text" value={config.phpSocket} onChange={(e) => update("phpSocket", e.target.value)} className={inp} /></div>}
          </fieldset>

          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Advanced</legend>
            <div className="flex flex-wrap gap-4">
              {toggle("cors", "CORS")}{toggle("rateLimit", "Rate Limit")}{toggle("redirect", "HTTP→HTTPS Redirect")}
            </div>
            {config.cors && <div><label className="mb-1 block text-xs text-muted">CORS Origin</label><input type="text" value={config.corsOrigin} onChange={(e) => update("corsOrigin", e.target.value)} className={inp} /></div>}
            {config.rateLimit && <div><label className="mb-1 block text-xs text-muted">Rate</label><input type="text" value={config.rateLimitRate} onChange={(e) => update("rateLimitRate", e.target.value)} className={inp} /></div>}
            {config.redirect && <div><label className="mb-1 block text-xs text-muted">Redirect From</label><input type="text" value={config.redirectFrom} onChange={(e) => update("redirectFrom", e.target.value)} className={inp} /></div>}
          </fieldset>
        </div>

        {/* Output */}
        <div className="lg:sticky lg:top-4 self-start">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Generated Config</span>
            <button onClick={async () => { await copyToClipboard(output); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="text-xs text-muted hover:text-foreground">{copied ? "✓ Copied" : "📋 Copy"}</button>
          </div>
          <pre className="rounded-lg border border-border bg-surface p-4 font-mono text-xs leading-relaxed whitespace-pre overflow-x-auto max-h-[70vh] overflow-y-auto">{output}</pre>
        </div>
      </div>
    </div>
  );
}
