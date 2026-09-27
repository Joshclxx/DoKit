"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type Tool = "select" | "rect" | "button" | "text" | "input" | "image" | "nav" | "card" | "list" | "eraser";

interface WireElement {
  id: string; type: Tool; x: number; y: number; w: number; h: number;
  label: string;
}

let counter = 0;
const uid = () => `w-${++counter}`;

const toolMeta: Record<Tool, { label: string; icon: string }> = {
  select: { label: "Select", icon: "" },
  rect: { label: "Container", icon: "▢" },
  button: { label: "Button", icon: "" },
  text: { label: "Text", icon: "T" },
  input: { label: "Input", icon: "▭" },
  image: { label: "Image", icon: "" },
  nav: { label: "Navbar", icon: "☰" },
  card: { label: "Card", icon: "" },
  list: { label: "List", icon: "☰" },
  eraser: { label: "Eraser", icon: "" },
};

export default function SketchWireframeTool() {
  const [elements, setElements] = useState<WireElement[]>([]);
  const [activeTool, setActiveTool] = useState<Tool>("rect");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [canvasW] = useState(800);
  const [canvasH] = useState(600);
  const [gridSnap, setGridSnap] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const snap = (v: number) => gridSnap ? Math.round(v / 16) * 16 : v;

  const drawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = canvasW; canvas.height = canvasH;

    // Background
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvasW, canvasH);

    // Grid
    if (showGrid) {
      ctx.strokeStyle = "#f0f0f0"; ctx.lineWidth = 1;
      for (let x = 0; x <= canvasW; x += 16) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvasH); ctx.stroke(); }
      for (let y = 0; y <= canvasH; y += 16) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvasW, y); ctx.stroke(); }
    }

    // Elements
    elements.forEach((el) => {
      const isSelected = el.id === selectedId;
      ctx.save();

      switch (el.type) {
        case "rect":
          ctx.strokeStyle = "#333"; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
          ctx.strokeRect(el.x, el.y, el.w, el.h);
          ctx.setLineDash([]);
          break;
        case "button":
          ctx.fillStyle = "#4a90d9"; ctx.beginPath();
          ctx.roundRect(el.x, el.y, el.w, el.h, 6); ctx.fill();
          ctx.fillStyle = "#fff"; ctx.font = "bold 13px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(el.label || "Button", el.x + el.w / 2, el.y + el.h / 2);
          break;
        case "text":
          ctx.fillStyle = "#333"; ctx.font = "16px Arial"; ctx.textBaseline = "top";
          ctx.fillText(el.label || "Text block", el.x, el.y);
          break;
        case "input":
          ctx.fillStyle = "#f5f5f5"; ctx.strokeStyle = "#ccc"; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.roundRect(el.x, el.y, el.w, el.h, 4); ctx.fill(); ctx.stroke();
          ctx.fillStyle = "#aaa"; ctx.font = "13px Arial"; ctx.textBaseline = "middle";
          ctx.fillText(el.label || "Input field...", el.x + 8, el.y + el.h / 2);
          break;
        case "image":
          ctx.fillStyle = "#e8e8e8"; ctx.fillRect(el.x, el.y, el.w, el.h);
          ctx.strokeStyle = "#ccc"; ctx.lineWidth = 1; ctx.strokeRect(el.x, el.y, el.w, el.h);
          // X placeholder
          ctx.strokeStyle = "#bbb"; ctx.beginPath();
          ctx.moveTo(el.x, el.y); ctx.lineTo(el.x + el.w, el.y + el.h);
          ctx.moveTo(el.x + el.w, el.y); ctx.lineTo(el.x, el.y + el.h); ctx.stroke();
          ctx.fillStyle = "#999"; ctx.font = "12px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText("Image", el.x + el.w / 2, el.y + el.h / 2);
          break;
        case "nav":
          ctx.fillStyle = "#2c3e50"; ctx.fillRect(el.x, el.y, el.w, el.h);
          ctx.fillStyle = "#fff"; ctx.font = "bold 14px Arial"; ctx.textBaseline = "middle";
          ctx.fillText("☰  " + (el.label || "Logo"), el.x + 16, el.y + el.h / 2);
          // Nav links
          const links = ["Home", "About", "Contact"];
          ctx.font = "13px Arial"; let lx = el.x + el.w - 200;
          links.forEach((l) => { ctx.fillText(l, lx, el.y + el.h / 2); lx += 70; });
          break;
        case "card":
          ctx.fillStyle = "#fff"; ctx.strokeStyle = "#ddd"; ctx.lineWidth = 1;
          ctx.shadowColor = "rgba(0,0,0,0.1)"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 2;
          ctx.beginPath(); ctx.roundRect(el.x, el.y, el.w, el.h, 8); ctx.fill(); ctx.stroke();
          ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
          // Card content
          ctx.fillStyle = "#e0e0e0"; ctx.fillRect(el.x + 12, el.y + 12, el.w - 24, el.h * 0.45);
          ctx.fillStyle = "#333"; ctx.font = "bold 14px Arial"; ctx.fillText(el.label || "Card Title", el.x + 12, el.y + el.h * 0.55 + 20);
          ctx.fillStyle = "#888"; ctx.font = "12px Arial"; ctx.fillText("Description text here...", el.x + 12, el.y + el.h * 0.55 + 40);
          break;
        case "list":
          for (let i = 0; i < 4; i++) {
            const ly = el.y + i * (el.h / 4);
            ctx.fillStyle = i % 2 === 0 ? "#fafafa" : "#fff";
            ctx.fillRect(el.x, ly, el.w, el.h / 4);
            ctx.strokeStyle = "#eee"; ctx.lineWidth = 1;
            ctx.strokeRect(el.x, ly, el.w, el.h / 4);
            ctx.fillStyle = "#555"; ctx.font = "13px Arial"; ctx.textBaseline = "middle";
            ctx.fillText(`• List item ${i + 1}`, el.x + 12, ly + el.h / 8);
          }
          break;
      }

      // Selection indicator
      if (isSelected) {
        ctx.strokeStyle = "#1D9E75"; ctx.lineWidth = 2; ctx.setLineDash([]);
        ctx.strokeRect(el.x - 2, el.y - 2, el.w + 4, el.h + 4);
        // Resize handles
        const handles = [[el.x - 4, el.y - 4], [el.x + el.w, el.y - 4], [el.x - 4, el.y + el.h], [el.x + el.w, el.y + el.h]];
        ctx.fillStyle = "#1D9E75";
        handles.forEach(([hx, hy]) => ctx.fillRect(hx, hy, 8, 8));
      }
      ctx.restore();
    });
  }, [elements, selectedId, canvasW, canvasH, showGrid]);

  useEffect(() => { drawAll(); }, [drawAll]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = canvasW / rect.width;
    const scaleY = canvasH / rect.height;
    const mx = snap((e.clientX - rect.left) * scaleX);
    const my = snap((e.clientY - rect.top) * scaleY);

    if (activeTool === "eraser") {
      const hit = [...elements].reverse().find((el) => mx >= el.x && mx <= el.x + el.w && my >= el.y && my <= el.y + el.h);
      if (hit) setElements((p) => p.filter((el) => el.id !== hit.id));
      return;
    }

    if (activeTool === "select") {
      const hit = [...elements].reverse().find((el) => mx >= el.x && mx <= el.x + el.w && my >= el.y && my <= el.y + el.h);
      setSelectedId(hit?.id || null);
      return;
    }

    const sizes: Record<string, [number, number]> = {
      rect: [192, 128], button: [128, 40], text: [160, 24], input: [224, 36],
      image: [192, 144], nav: [canvasW, 48], card: [240, 200], list: [240, 160],
    };
    const [w, h] = sizes[activeTool] || [100, 60];
    const el: WireElement = { id: uid(), type: activeTool, x: mx, y: my, w, h, label: "" };
    setElements((p) => [...p, el]);
    setSelectedId(el.id);
  };

  const selected = elements.find((e) => e.id === selectedId);
  const updateEl = (updates: Partial<WireElement>) => {
    if (!selectedId) return;
    setElements((p) => p.map((e) => e.id === selectedId ? { ...e, ...updates } : e));
  };

  const inp = "h-8 w-full rounded border border-border bg-background px-2 text-xs focus:border-accent focus:outline-none";

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(toolMeta) as Tool[]).map((t) => (
          <button key={t} onClick={() => setActiveTool(t)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${activeTool === t ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:text-foreground"}`}>
            {toolMeta[t].label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} className="accent-accent" />Grid</label>
          <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={gridSnap} onChange={(e) => setGridSnap(e.target.checked)} className="accent-accent" />Snap</label>
          <button onClick={() => { setElements([]); setSelectedId(null); }} className="text-xs text-muted hover:text-danger">Clear</button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_200px]">
        {/* Canvas */}
        <div className="rounded-lg border border-border overflow-auto bg-white">
          <canvas ref={canvasRef} onClick={handleCanvasClick}
            className="cursor-crosshair" style={{ width: "100%", aspectRatio: `${canvasW}/${canvasH}` }} />
        </div>

        {/* Props */}
        {selected && (
          <div className="space-y-3 rounded-lg border border-border bg-surface p-3">
            <div className="text-xs font-semibold uppercase text-muted capitalize">{selected.type}</div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[10px] text-muted">X</label><input type="number" value={selected.x} onChange={(e) => updateEl({ x: Number(e.target.value) })} className={inp} /></div>
              <div><label className="text-[10px] text-muted">Y</label><input type="number" value={selected.y} onChange={(e) => updateEl({ y: Number(e.target.value) })} className={inp} /></div>
              <div><label className="text-[10px] text-muted">W</label><input type="number" value={selected.w} onChange={(e) => updateEl({ w: Number(e.target.value) })} className={inp} /></div>
              <div><label className="text-[10px] text-muted">H</label><input type="number" value={selected.h} onChange={(e) => updateEl({ h: Number(e.target.value) })} className={inp} /></div>
            </div>
            <div><label className="text-[10px] text-muted">Label</label>
              <input type="text" value={selected.label} onChange={(e) => updateEl({ label: e.target.value })} placeholder="Label text" className={inp} /></div>
            <button onClick={() => { setElements((p) => p.filter((e) => e.id !== selectedId)); setSelectedId(null); }}
              className="w-full rounded border border-danger/30 py-1 text-xs text-danger hover:bg-danger/5">Delete</button>
          </div>
        )}
      </div>
    </div>
  );
}
