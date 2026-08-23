"use client";

import { useState, useMemo } from "react";
import { copyToClipboard } from "@/lib/utils/download";

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function generateShades(hex: string, count: number): string[] {
  const [r, g, b] = hexToRgb(hex);
  const [h, s] = rgbToHsl(r, g, b);
  return Array.from({ length: count }, (_, i) => {
    const l = Math.round(95 - (i / (count - 1)) * 85);
    return hslToHex(h, s, l);
  });
}

function complementary(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  return hslToHex((h + 180) % 360, s, l);
}

function analogous(hex: string): string[] {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  return [hslToHex((h + 330) % 360, s, l), hex, hslToHex((h + 30) % 360, s, l)];
}

function triadic(hex: string): string[] {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  return [hex, hslToHex((h + 120) % 360, s, l), hslToHex((h + 240) % 360, s, l)];
}

function splitComplementary(hex: string): string[] {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  return [hex, hslToHex((h + 150) % 360, s, l), hslToHex((h + 210) % 360, s, l)];
}

function contrastRatio(hex1: string, hex2: string): number {
  const lum = (hex: string) => {
    const [r, g, b] = hexToRgb(hex).map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const l1 = lum(hex1), l2 = lum(hex2);
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export default function ColorSystemToolkit() {
  const [color, setColor] = useState("#085041");
  const [copied, setCopied] = useState<string | null>(null);

  const [r, g, b] = useMemo(() => hexToRgb(color), [color]);
  const [h, s, l] = useMemo(() => rgbToHsl(r, g, b), [r, g, b]);
  const shades = useMemo(() => generateShades(color, 10), [color]);

  const harmonies = useMemo(() => ({
    complementary: [color, complementary(color)],
    analogous: analogous(color),
    triadic: triadic(color),
    splitComplementary: splitComplementary(color),
  }), [color]);

  const wcagWhite = contrastRatio(color, "#ffffff").toFixed(2);
  const wcagBlack = contrastRatio(color, "#000000").toFixed(2);

  const copy = async (text: string) => {
    await copyToClipboard(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  };

  const tokens = `--color-primary: ${color};\n--color-primary-rgb: ${r}, ${g}, ${b};\n--color-primary-hsl: ${h}, ${s}%, ${l}%;\n${shades.map((sh, i) => `--color-primary-${(i + 1) * 100}: ${sh};`).join("\n")}`;

  const Swatch = ({ hex, label, size = "h-12" }: { hex: string; label?: string; size?: string }) => (
    <button onClick={() => copy(hex)} title={hex}
      className={`${size} rounded-lg border border-border transition-transform hover:scale-105 relative group`}
      style={{ background: hex }}>
      {label && <span className="absolute bottom-0.5 left-1 text-[9px] font-mono opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: contrastRatio(hex, "#ffffff") > 3 ? "#fff" : "#000" }}>{label}</span>}
      {copied === hex && <span className="absolute inset-0 flex items-center justify-center text-xs font-bold rounded-lg bg-black/30 text-white">✓</span>}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Color picker + values */}
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex items-center gap-3">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
            className="h-14 w-14 cursor-pointer rounded-lg border border-border" />
          <input type="text" value={color} onChange={(e) => { if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) setColor(e.target.value); }}
            className="h-10 w-28 rounded-lg border border-border bg-surface px-3 font-mono text-sm focus:border-accent focus:outline-none" />
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <button onClick={() => copy(color)} className="rounded-lg bg-surface border border-border px-3 py-1.5 font-mono text-xs hover:bg-surface-hover">HEX {color}</button>
          <button onClick={() => copy(`rgb(${r}, ${g}, ${b})`)} className="rounded-lg bg-surface border border-border px-3 py-1.5 font-mono text-xs hover:bg-surface-hover">RGB {r}, {g}, {b}</button>
          <button onClick={() => copy(`hsl(${h}, ${s}%, ${l}%)`)} className="rounded-lg bg-surface border border-border px-3 py-1.5 font-mono text-xs hover:bg-surface-hover">HSL {h}°, {s}%, {l}%</button>
        </div>
      </div>

      {/* WCAG */}
      <div className="flex gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
          <span className="h-6 w-6 rounded" style={{ background: color }} /><span className="text-xs">on white: <strong>{wcagWhite}:1</strong></span>
          <span className={`text-xs font-bold ${Number(wcagWhite) >= 4.5 ? "text-success" : Number(wcagWhite) >= 3 ? "text-warning" : "text-danger"}`}>
            {Number(wcagWhite) >= 4.5 ? "AA ✓" : Number(wcagWhite) >= 3 ? "AA Large" : "Fail"}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
          <span className="h-6 w-6 rounded" style={{ background: color }} /><span className="text-xs">on black: <strong>{wcagBlack}:1</strong></span>
          <span className={`text-xs font-bold ${Number(wcagBlack) >= 4.5 ? "text-success" : Number(wcagBlack) >= 3 ? "text-warning" : "text-danger"}`}>
            {Number(wcagBlack) >= 4.5 ? "AA ✓" : Number(wcagBlack) >= 3 ? "AA Large" : "Fail"}
          </span>
        </div>
      </div>

      {/* Shades */}
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Shade Scale</div>
        <div className="grid grid-cols-10 gap-1">
          {shades.map((sh, i) => <Swatch key={i} hex={sh} label={`${(i + 1) * 100}`} />)}
        </div>
      </div>

      {/* Harmonies */}
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Color Harmonies</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(harmonies).map(([name, colors]) => (
            <div key={name} className="rounded-lg border border-border bg-surface p-3">
              <div className="mb-2 text-xs font-medium capitalize text-muted">{name.replace(/([A-Z])/g, " $1")}</div>
              <div className="flex gap-1">
                {colors.map((c, i) => <Swatch key={i} hex={c} size="h-10 flex-1" />)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gradient */}
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Gradient Preview</div>
        <div className="h-16 rounded-lg" style={{ background: `linear-gradient(135deg, ${color}, ${complementary(color)})` }} />
        <button onClick={() => copy(`linear-gradient(135deg, ${color}, ${complementary(color)})`)}
          className="mt-1 text-xs text-muted hover:text-foreground">📋 Copy CSS</button>
      </div>

      {/* Design tokens */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Design Tokens (CSS)</span>
          <button onClick={() => copy(tokens)} className="text-xs text-muted hover:text-foreground">{copied === tokens ? "✓" : "📋"}</button>
        </div>
        <pre className="rounded-lg border border-border bg-surface p-4 font-mono text-xs whitespace-pre-wrap">{tokens}</pre>
      </div>
    </div>
  );
}
