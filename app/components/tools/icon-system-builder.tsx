"use client";

import { useState } from "react";
import { copyToClipboard, downloadFile } from "@/lib/utils/download";

interface IconConfig {
  size: number; strokeWidth: number; color: string;
  cornerRadius: number; filled: boolean;
}

const iconPaths: Record<string, { label: string; path: string; viewBox?: string }> = {
  home: { label: "Home", path: "M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" },
  user: { label: "User", path: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z" },
  search: { label: "Search", path: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
  settings: { label: "Settings", path: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" },
  mail: { label: "Mail", path: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6" },
  heart: { label: "Heart", path: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" },
  star: { label: "Star", path: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
  check: { label: "Check", path: "M20 6L9 17l-5-5" },
  x: { label: "Close", path: "M18 6L6 18M6 6l12 12" },
  plus: { label: "Plus", path: "M12 5v14M5 12h14" },
  minus: { label: "Minus", path: "M5 12h14" },
  chevronRight: { label: "Chevron Right", path: "M9 18l6-6-6-6" },
  chevronDown: { label: "Chevron Down", path: "M6 9l6 6 6-6" },
  arrowRight: { label: "Arrow Right", path: "M5 12h14M12 5l7 7-7 7" },
  bell: { label: "Bell", path: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" },
  calendar: { label: "Calendar", path: "M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18" },
  clock: { label: "Clock", path: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2" },
  camera: { label: "Camera", path: "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 17a4 4 0 100-8 4 4 0 000 8z" },
  download: { label: "Download", path: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" },
  upload: { label: "Upload", path: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" },
  trash: { label: "Trash", path: "M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" },
  edit: { label: "Edit", path: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" },
  link: { label: "Link", path: "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" },
  eye: { label: "Eye", path: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 100-6 3 3 0 000 6z" },
  lock: { label: "Lock", path: "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4" },
  globe: { label: "Globe", path: "M12 22a10 10 0 100-20 10 10 0 000 20zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" },
  menu: { label: "Menu", path: "M3 12h18M3 6h18M3 18h18" },
  filter: { label: "Filter", path: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z" },
  share: { label: "Share", path: "M18 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zM18 22a3 3 0 100-6 3 3 0 000 6zM8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" },
  image: { label: "Image", path: "M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21" },
};

const defaultConfig: IconConfig = { size: 24, strokeWidth: 2, color: "#085041", cornerRadius: 0, filled: false };

export default function IconSystemBuilder() {
  const [config, setConfig] = useState<IconConfig>(defaultConfig);
  const [selected, setSelected] = useState<string[]>(Object.keys(iconPaths));
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const safeColor = /^#[0-9a-f]{3,8}$/i.test(config.color) ? config.color : "#085041";
  const genSvg = (key: string, icon: typeof iconPaths[string]) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${config.size}" height="${config.size}" viewBox="0 0 24 24" fill="${config.filled ? safeColor : "none"}" stroke="${safeColor}" stroke-width="${config.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><path d="${icon.path}"/></svg>`;

  const genReact = (key: string, icon: typeof iconPaths[string]) => {
    const name = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, "$1");
    return `export const ${name}Icon = ({ size = ${config.size}, color = "${safeColor}", strokeWidth = ${config.strokeWidth} }) => (\n  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">\n    <path d="${icon.path}" />\n  </svg>\n);`;
  };

  const copy = async (text: string, id: string) => {
    await copyToClipboard(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const exportAll = () => {
    const svgs = selected.map((key) => genSvg(key, iconPaths[key])).join("\n\n");
    downloadFile(svgs, "icon-system.svg", "image/svg+xml");
  };

  const exportReact = () => {
    const code = selected.map((key) => genReact(key, iconPaths[key])).join("\n\n");
    downloadFile(code, "icons.tsx", "text/typescript");
  };

  const toggleIcon = (key: string) => {
    setSelected((p) => p.includes(key) ? p.filter((k) => k !== key) : [...p, key]);
  };

  return (
    <div className="space-y-6">
      {/* Config */}
      <div className="grid gap-3 sm:grid-cols-5">
        <div><label className="mb-1 block text-xs text-muted">Size</label>
          <input type="number" min={12} max={96} value={config.size} onChange={(e) => setConfig((p) => ({ ...p, size: Number(e.target.value) }))}
            className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none" /></div>
        <div><label className="mb-1 block text-xs text-muted">Stroke</label>
          <input type="number" min={0.5} max={4} step={0.5} value={config.strokeWidth} onChange={(e) => setConfig((p) => ({ ...p, strokeWidth: Number(e.target.value) }))}
            className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none" /></div>
        <div><label className="mb-1 block text-xs text-muted">Color</label>
          <div className="flex gap-2"><input type="color" value={config.color} onChange={(e) => setConfig((p) => ({ ...p, color: e.target.value }))}
            className="h-9 w-10 rounded border border-border cursor-pointer" />
            <input type="text" value={config.color} onChange={(e) => setConfig((p) => ({ ...p, color: e.target.value }))}
              className="h-9 flex-1 rounded-lg border border-border bg-surface px-2 font-mono text-xs focus:border-accent focus:outline-none" /></div></div>
        <div><label className="mb-1 block text-xs text-muted">Fill</label>
          <label className="flex items-center gap-2 h-9"><input type="checkbox" checked={config.filled} onChange={(e) => setConfig((p) => ({ ...p, filled: e.target.checked }))}
            className="h-4 w-4 accent-accent" /><span className="text-sm">Filled</span></label></div>
        <div><label className="mb-1 block text-xs text-muted">Search</label>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter…"
            className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none" /></div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setSelected(Object.keys(iconPaths))} className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:bg-surface-hover">Select All</button>
        <button onClick={() => setSelected([])} className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:bg-surface-hover">Deselect All</button>
        <span className="text-xs text-muted self-center">{selected.length}/{Object.keys(iconPaths).length} selected</span>
        <div className="ml-auto flex gap-2">
          <button onClick={exportAll} className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:bg-surface-hover">Export SVG</button>
          <button onClick={exportReact} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg hover:bg-accent-hover">Export React</button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
        {Object.entries(iconPaths).map(([key, icon]) => {
          const isSelected = selected.includes(key);
          const matchesSearch = !search || key.toLowerCase().includes(search.toLowerCase()) || icon.label.toLowerCase().includes(search.toLowerCase());
          if (!matchesSearch) return null;
          return (
            <div key={key}
              onClick={() => toggleIcon(key)}
              className={`group relative flex flex-col items-center justify-center rounded-lg border p-3 cursor-pointer transition-all ${
                isSelected ? "border-accent bg-accent/5" : "border-border bg-surface opacity-40 hover:opacity-100"
              }`}>
              <div dangerouslySetInnerHTML={{ __html: genSvg(key, icon) }} />
              <span className="mt-1.5 text-[9px] text-muted truncate w-full text-center">{icon.label}</span>
              <button onClick={(e) => { e.stopPropagation(); copy(genSvg(key, icon), key); }}
                className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 text-[10px] text-muted hover:text-foreground p-1">
                {copied === key ? "✓" : "📋"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
