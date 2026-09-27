"use client";

import { useState, useMemo } from "react";
import { copyToClipboard } from "@/lib/utils/download";

type PayloadType = "url" | "text" | "email" | "phone" | "wifi" | "vcard";

interface QRConfig {
  type: PayloadType; size: number; fgColor: string; bgColor: string;
  url: string; text: string;
  email: string; emailSubject: string; emailBody: string;
  phone: string;
  wifiSsid: string; wifiPassword: string; wifiType: string; wifiHidden: boolean;
  vcardName: string; vcardPhone: string; vcardEmail: string; vcardOrg: string;
}

const defaults: QRConfig = {
  type: "url", size: 300, fgColor: "000000", bgColor: "ffffff",
  url: "https://example.com", text: "",
  email: "", emailSubject: "", emailBody: "",
  phone: "",
  wifiSsid: "", wifiPassword: "", wifiType: "WPA", wifiHidden: false,
  vcardName: "", vcardPhone: "", vcardEmail: "", vcardOrg: "",
};

function buildPayload(c: QRConfig): string {
  switch (c.type) {
    case "url": return c.url;
    case "text": return c.text;
    case "email": return `mailto:${c.email}?subject=${encodeURIComponent(c.emailSubject)}&body=${encodeURIComponent(c.emailBody)}`;
    case "phone": return `tel:${c.phone}`;
    case "wifi": return `WIFI:T:${c.wifiType};S:${c.wifiSsid};P:${c.wifiPassword};H:${c.wifiHidden ? "true" : "false"};;`;
    case "vcard": return `BEGIN:VCARD\nVERSION:3.0\nFN:${c.vcardName}\nTEL:${c.vcardPhone}\nEMAIL:${c.vcardEmail}\nORG:${c.vcardOrg}\nEND:VCARD`;
    default: return "";
  }
}

const payloadTypes: { id: PayloadType; label: string; icon: string }[] = [
  { id: "url", label: "URL", icon: "" },
  { id: "text", label: "Text", icon: "" },
  { id: "email", label: "Email", icon: "" },
  { id: "phone", label: "Phone", icon: "" },
  { id: "wifi", label: "Wi-Fi", icon: "" },
  { id: "vcard", label: "vCard", icon: "" },
];

export default function QRCodeBuilder() {
  const [config, setConfig] = useState<QRConfig>(defaults);
  const [copied, setCopied] = useState(false);

  const update = <K extends keyof QRConfig>(k: K, v: QRConfig[K]) => setConfig((p) => ({ ...p, [k]: v }));

  const payload = useMemo(() => buildPayload(config), [config]);
  const qrUrl = useMemo(() => {
    const data = encodeURIComponent(payload);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${config.size}x${config.size}&data=${data}&color=${config.fgColor}&bgcolor=${config.bgColor}&format=svg`;
  }, [payload, config.size, config.fgColor, config.bgColor]);

  const inp = "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none";

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-500">
        Privacy notice: QR content is sent to the third-party QR Server API to render the image. Do not enter secrets such as private Wi-Fi passwords.
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {/* Type selector */}
          <div className="flex flex-wrap gap-2">
            {payloadTypes.map((t) => (
              <button key={t.id} onClick={() => update("type", t.id)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  config.type === t.id ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:text-foreground"
                }`}>{t.label}</button>
            ))}
          </div>

          {/* Type-specific fields */}
          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Content</legend>
            {config.type === "url" && (
              <input type="url" placeholder="https://example.com" value={config.url} onChange={(e) => update("url", e.target.value)} className={inp} />
            )}
            {config.type === "text" && (
              <textarea placeholder="Enter text…" value={config.text} onChange={(e) => update("text", e.target.value)} rows={4}
                className="w-full rounded-lg border border-border bg-background p-3 text-sm focus:border-accent focus:outline-none resize-y" />
            )}
            {config.type === "email" && (<>
              <input type="email" placeholder="email@example.com" value={config.email} onChange={(e) => update("email", e.target.value)} className={inp} />
              <input type="text" placeholder="Subject" value={config.emailSubject} onChange={(e) => update("emailSubject", e.target.value)} className={inp} />
              <input type="text" placeholder="Body" value={config.emailBody} onChange={(e) => update("emailBody", e.target.value)} className={inp} />
            </>)}
            {config.type === "phone" && (
              <input type="tel" placeholder="+1234567890" value={config.phone} onChange={(e) => update("phone", e.target.value)} className={inp} />
            )}
            {config.type === "wifi" && (<>
              <input type="text" placeholder="Network name (SSID)" value={config.wifiSsid} onChange={(e) => update("wifiSsid", e.target.value)} className={inp} />
              <input type="text" placeholder="Password" value={config.wifiPassword} onChange={(e) => update("wifiPassword", e.target.value)} className={inp} />
              <div className="grid gap-2 sm:grid-cols-2">
                <select value={config.wifiType} onChange={(e) => update("wifiType", e.target.value)} className={inp}>
                  <option>WPA</option><option>WEP</option><option>nopass</option>
                </select>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={config.wifiHidden} onChange={(e) => update("wifiHidden", e.target.checked)} className="accent-accent" />Hidden network</label>
              </div>
            </>)}
            {config.type === "vcard" && (<>
              <input type="text" placeholder="Full name" value={config.vcardName} onChange={(e) => update("vcardName", e.target.value)} className={inp} />
              <input type="tel" placeholder="Phone" value={config.vcardPhone} onChange={(e) => update("vcardPhone", e.target.value)} className={inp} />
              <input type="email" placeholder="Email" value={config.vcardEmail} onChange={(e) => update("vcardEmail", e.target.value)} className={inp} />
              <input type="text" placeholder="Organization" value={config.vcardOrg} onChange={(e) => update("vcardOrg", e.target.value)} className={inp} />
            </>)}
          </fieldset>

          {/* Customization */}
          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Customize</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              <div><label className="mb-1 block text-xs text-muted">Size (px)</label>
                <input type="number" min={100} max={1000} step={50} value={config.size} onChange={(e) => update("size", Number(e.target.value))} className={inp} /></div>
              <div><label className="mb-1 block text-xs text-muted">Foreground</label>
                <div className="flex gap-2"><input type="color" value={`#${config.fgColor}`} onChange={(e) => update("fgColor", e.target.value.slice(1))} className="h-9 w-10 rounded border border-border cursor-pointer" />
                  <input type="text" value={config.fgColor} onChange={(e) => update("fgColor", e.target.value)} className={inp} /></div></div>
              <div><label className="mb-1 block text-xs text-muted">Background</label>
                <div className="flex gap-2"><input type="color" value={`#${config.bgColor}`} onChange={(e) => update("bgColor", e.target.value.slice(1))} className="h-9 w-10 rounded border border-border cursor-pointer" />
                  <input type="text" value={config.bgColor} onChange={(e) => update("bgColor", e.target.value)} className={inp} /></div></div>
            </div>
          </fieldset>

          {/* Payload preview */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">Payload</span>
              <button onClick={async () => { await copyToClipboard(payload); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="text-xs text-muted hover:text-foreground">{copied ? "✓" : "Copy"}</button>
            </div>
            <pre className="rounded-lg border border-border bg-surface p-3 font-mono text-xs whitespace-pre-wrap">{payload}</pre>
          </div>
        </div>

        {/* QR Preview */}
        <div className="lg:sticky lg:top-4 self-start space-y-3">
          <div className="rounded-xl border border-border bg-surface p-4 flex flex-col items-center">
            {payload ? (
              <img src={qrUrl} alt="QR Code" width={config.size > 280 ? 280 : config.size} height={config.size > 280 ? 280 : config.size} className="rounded-lg" />
            ) : (
              <div className="h-64 w-64 flex items-center justify-center text-muted text-sm">Enter content to generate QR</div>
            )}
          </div>
          {payload && (
            <div className="flex gap-2">
              <a href={qrUrl.replace("format=svg", "format=png")} download="qr-code.png" target="_blank" rel="noopener"
                className="flex-1 rounded-lg bg-accent py-2 text-center text-sm font-medium text-accent-fg hover:bg-accent-hover">
                ↓ PNG
              </a>
              <a href={qrUrl} download="qr-code.svg" target="_blank" rel="noopener"
                className="flex-1 rounded-lg border border-border bg-surface py-2 text-center text-sm font-medium hover:bg-surface-hover">
                ↓ SVG
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
