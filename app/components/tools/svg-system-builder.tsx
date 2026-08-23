"use client";

import { useState, useMemo } from "react";
import { copyToClipboard, downloadFile } from "@/lib/utils/download";

type Shape = "rect" | "circle" | "line" | "text" | "polygon" | "ellipse" | "star" | "arrow";

interface SvgElement {
  id: string; type: Shape;
  x: number; y: number; width: number; height: number;
  fill: string; stroke: string; strokeWidth: number;
  text: string; fontSize: number; rotation: number; opacity: number;
  rx: number;
  points: number; // for star/polygon
}

let idCounter = 0;
const uid = () => `el-${++idCounter}`;

const escapeXml = (value: string) => value
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&apos;");

function createEl(type: Shape): SvgElement {
  return {
    id: uid(), type, x: 100, y: 100, width: 120, height: 80,
    fill: type === "text" ? "none" : "#085041", stroke: type === "text" ? "#e7e9ea" : "#000000",
    strokeWidth: type === "line" || type === "arrow" ? 2 : 0,
    text: type === "text" ? "Hello" : "", fontSize: 24, rotation: 0, opacity: 1,
    rx: 0, points: type === "star" ? 5 : type === "polygon" ? 6 : 0,
  };
}

function renderElement(el: SvgElement): string {
  const transform = el.rotation ? ` transform="rotate(${el.rotation} ${el.x + el.width / 2} ${el.y + el.height / 2})"` : "";
  const opac = el.opacity < 1 ? ` opacity="${el.opacity}"` : "";
  const base = `fill="${el.fill}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}"${transform}${opac}`;

  switch (el.type) {
    case "rect": return `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="${el.rx}" ${base}/>`;
    case "circle": return `<circle cx="${el.x + el.width / 2}" cy="${el.y + el.height / 2}" r="${Math.min(el.width, el.height) / 2}" ${base}/>`;
    case "ellipse": return `<ellipse cx="${el.x + el.width / 2}" cy="${el.y + el.height / 2}" rx="${el.width / 2}" ry="${el.height / 2}" ${base}/>`;
    case "line": return `<line x1="${el.x}" y1="${el.y}" x2="${el.x + el.width}" y2="${el.y + el.height}" ${base}/>`;
    case "text": return `<text x="${el.x}" y="${el.y + el.fontSize}" font-size="${el.fontSize}" fill="${el.stroke}"${transform}${opac}>${escapeXml(el.text)}</text>`;
    case "arrow": {
      const x2 = el.x + el.width, y2 = el.y + el.height;
      const angle = Math.atan2(el.height, el.width);
      const headLen = 12;
      const p1x = x2 - headLen * Math.cos(angle - 0.4), p1y = y2 - headLen * Math.sin(angle - 0.4);
      const p2x = x2 - headLen * Math.cos(angle + 0.4), p2y = y2 - headLen * Math.sin(angle + 0.4);
      return `<line x1="${el.x}" y1="${el.y}" x2="${x2}" y2="${y2}" ${base}/><polygon points="${x2},${y2} ${p1x},${p1y} ${p2x},${p2y}" fill="${el.stroke}"${opac}/>`;
    }
    case "polygon":
    case "star": {
      const cx = el.x + el.width / 2, cy = el.y + el.height / 2;
      const r = Math.min(el.width, el.height) / 2;
      const n = el.points || 5;
      if (el.type === "polygon") {
        const pts = Array.from({ length: n }, (_, i) => {
          const a = (Math.PI * 2 * i) / n - Math.PI / 2;
          return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
        }).join(" ");
        return `<polygon points="${pts}" ${base}/>`;
      } else {
        const inner = r * 0.4;
        const pts = Array.from({ length: n * 2 }, (_, i) => {
          const a = (Math.PI * i) / n - Math.PI / 2;
          const rad = i % 2 === 0 ? r : inner;
          return `${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`;
        }).join(" ");
        return `<polygon points="${pts}" ${base}/>`;
      }
    }
    default: return "";
  }
}

export default function SvgSystemBuilder() {
  const [elements, setElements] = useState<SvgElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [canvasW, setCanvasW] = useState(600);
  const [canvasH, setCanvasH] = useState(400);
  const [canvasBg, setCanvasBg] = useState("#1a1a2e");
  const [copied, setCopied] = useState(false);

  const selected = elements.find((e) => e.id === selectedId) || null;

  const updateEl = (id: string, updates: Partial<SvgElement>) => {
    setElements((p) => p.map((e) => e.id === id ? { ...e, ...updates } : e));
  };

  const addShape = (type: Shape) => {
    const el = createEl(type);
    setElements((p) => [...p, el]);
    setSelectedId(el.id);
  };

  const removeEl = (id: string) => {
    setElements((p) => p.filter((e) => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const moveEl = (id: string, dir: -1 | 1) => {
    setElements((prev) => {
      const idx = prev.findIndex((e) => e.id === id);
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  };

  const svgCode = useMemo(() => {
    const inner = elements.map(renderElement).join("\n  ");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasW}" height="${canvasH}" viewBox="0 0 ${canvasW} ${canvasH}">\n  <rect width="100%" height="100%" fill="${canvasBg}"/>\n  ${inner}\n</svg>`;
  }, [elements, canvasW, canvasH, canvasBg]);

  const inp = "h-8 w-full rounded border border-border bg-background px-2 text-xs focus:border-accent focus:outline-none";

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {(["rect", "circle", "ellipse", "line", "arrow", "polygon", "star", "text"] as Shape[]).map((s) => (
          <button key={s} onClick={() => addShape(s)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:bg-surface-hover capitalize">
            + {s}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <input type="number" value={canvasW} onChange={(e) => setCanvasW(Number(e.target.value))}
            className="h-8 w-16 rounded border border-border bg-surface px-2 text-xs" title="Width" />
          <span className="text-xs text-muted">×</span>
          <input type="number" value={canvasH} onChange={(e) => setCanvasH(Number(e.target.value))}
            className="h-8 w-16 rounded border border-border bg-surface px-2 text-xs" title="Height" />
          <input type="color" value={canvasBg} onChange={(e) => setCanvasBg(e.target.value)}
            className="h-8 w-8 rounded border border-border cursor-pointer" title="Background" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        {/* Canvas */}
        <div className="rounded-lg border border-border overflow-auto bg-[#0a0a0a] p-2">
          <div dangerouslySetInnerHTML={{ __html: svgCode }} className="inline-block" />
        </div>

        {/* Properties */}
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted">Layers ({elements.length})</div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {elements.map((el) => (
              <div key={el.id} onClick={() => setSelectedId(el.id)}
                className={`flex items-center gap-2 rounded px-2 py-1 text-xs cursor-pointer ${selectedId === el.id ? "bg-accent/10 text-accent" : "text-muted hover:text-foreground"}`}>
                <span className="flex-1 capitalize">{el.type}{el.type === "text" ? `: ${el.text}` : ""}</span>
                <button onClick={(e) => { e.stopPropagation(); moveEl(el.id, -1); }} className="hover:text-foreground">↑</button>
                <button onClick={(e) => { e.stopPropagation(); moveEl(el.id, 1); }} className="hover:text-foreground">↓</button>
                <button onClick={(e) => { e.stopPropagation(); removeEl(el.id); }} className="hover:text-danger">✕</button>
              </div>
            ))}
          </div>

          {selected && (
            <div className="space-y-2 rounded-lg border border-border bg-surface p-3">
              <div className="text-xs font-semibold uppercase text-muted capitalize">{selected.type} Properties</div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[10px] text-muted">X</label><input type="number" value={selected.x} onChange={(e) => updateEl(selected.id, { x: Number(e.target.value) })} className={inp} /></div>
                <div><label className="text-[10px] text-muted">Y</label><input type="number" value={selected.y} onChange={(e) => updateEl(selected.id, { y: Number(e.target.value) })} className={inp} /></div>
                <div><label className="text-[10px] text-muted">W</label><input type="number" value={selected.width} onChange={(e) => updateEl(selected.id, { width: Number(e.target.value) })} className={inp} /></div>
                <div><label className="text-[10px] text-muted">H</label><input type="number" value={selected.height} onChange={(e) => updateEl(selected.id, { height: Number(e.target.value) })} className={inp} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[10px] text-muted">Fill</label><input type="color" value={selected.fill} onChange={(e) => updateEl(selected.id, { fill: e.target.value })} className="h-8 w-full rounded border border-border cursor-pointer" /></div>
                <div><label className="text-[10px] text-muted">Stroke</label><input type="color" value={selected.stroke} onChange={(e) => updateEl(selected.id, { stroke: e.target.value })} className="h-8 w-full rounded border border-border cursor-pointer" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[10px] text-muted">Stroke W</label><input type="number" min={0} step={0.5} value={selected.strokeWidth} onChange={(e) => updateEl(selected.id, { strokeWidth: Number(e.target.value) })} className={inp} /></div>
                <div><label className="text-[10px] text-muted">Rotation</label><input type="number" value={selected.rotation} onChange={(e) => updateEl(selected.id, { rotation: Number(e.target.value) })} className={inp} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[10px] text-muted">Opacity</label><input type="number" min={0} max={1} step={0.1} value={selected.opacity} onChange={(e) => updateEl(selected.id, { opacity: Number(e.target.value) })} className={inp} /></div>
                <div><label className="text-[10px] text-muted">Radius</label><input type="number" min={0} value={selected.rx} onChange={(e) => updateEl(selected.id, { rx: Number(e.target.value) })} className={inp} /></div>
              </div>
              {selected.type === "text" && (
                <div><label className="text-[10px] text-muted">Text</label><input type="text" value={selected.text} onChange={(e) => updateEl(selected.id, { text: e.target.value })} className={inp} /></div>
              )}
              {(selected.type === "star" || selected.type === "polygon") && (
                <div><label className="text-[10px] text-muted">Points</label><input type="number" min={3} max={12} value={selected.points} onChange={(e) => updateEl(selected.id, { points: Number(e.target.value) })} className={inp} /></div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Export */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">SVG Code</span>
          <div className="flex gap-2">
            <button onClick={async () => { await copyToClipboard(svgCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="text-xs text-muted hover:text-foreground">{copied ? "✓" : "📋"}</button>
            <button onClick={() => downloadFile(svgCode, "design.svg", "image/svg+xml")}
              className="text-xs text-muted hover:text-foreground">💾</button>
          </div>
        </div>
        <pre className="rounded-lg border border-border bg-surface p-3 font-mono text-[10px] leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">{svgCode}</pre>
      </div>
    </div>
  );
}
