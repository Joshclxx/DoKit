"use client";

import { useState, useRef, useCallback } from "react";

interface ImageItem { src: string; name: string; width: number; height: number; }

type PageSize = "a4" | "letter" | "a3" | "legal";
type Orientation = "portrait" | "landscape";
type FitMode = "fit" | "fill" | "stretch";

const pageSizes: Record<PageSize, [number, number]> = {
  a4: [595.28, 841.89], letter: [612, 792], a3: [841.89, 1190.55], legal: [612, 1008],
};

export default function ImagesToPdf() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [fitMode, setFitMode] = useState<FitMode>("fit");
  const [margin, setMargin] = useState(20);
  const quality = 0.85;
  const [generating, setGenerating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setImages((prev) => [...prev, { src: e.target?.result as string, name: file.name, width: img.width, height: img.height }]);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const removeImage = (idx: number) => setImages((p) => p.filter((_, i) => i !== idx));
  const moveImage = (idx: number, dir: -1 | 1) => {
    setImages((prev) => {
      const arr = [...prev];
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= arr.length) return arr;
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  };

  const generatePdf = useCallback(async () => {
    if (images.length === 0) return;
    setGenerating(true);

    const [baseW, baseH] = pageSizes[pageSize];
    const pw = orientation === "landscape" ? baseH : baseW;
    const ph = orientation === "landscape" ? baseW : baseH;

    // Create printable page canvases for each source image.
    const pageCanvases: HTMLCanvasElement[] = [];

    for (const item of images) {
      const pageCanvas = document.createElement("canvas");
      const scale = 2; // Retina
      pageCanvas.width = pw * scale; pageCanvas.height = ph * scale;
      const pctx = pageCanvas.getContext("2d")!;
      pctx.scale(scale, scale);

      // White background
      pctx.fillStyle = "#ffffff";
      pctx.fillRect(0, 0, pw, ph);

      // Load image
      const img = new Image();
      await new Promise<void>((resolve) => { img.onload = () => resolve(); img.src = item.src; });

      const availW = pw - margin * 2;
      const availH = ph - margin * 2;
      let dx = margin, dy = margin, dw = availW, dh = availH;

      if (fitMode === "fit") {
        const ratio = Math.min(availW / img.width, availH / img.height);
        dw = img.width * ratio; dh = img.height * ratio;
        dx = margin + (availW - dw) / 2; dy = margin + (availH - dh) / 2;
      } else if (fitMode === "fill") {
        const ratio = Math.max(availW / img.width, availH / img.height);
        dw = img.width * ratio; dh = img.height * ratio;
        dx = margin + (availW - dw) / 2; dy = margin + (availH - dh) / 2;
        pctx.save();
        pctx.beginPath(); pctx.rect(margin, margin, availW, availH); pctx.clip();
      }

      pctx.drawImage(img, dx, dy, dw, dh);
      if (fitMode === "fill") pctx.restore();

      pageCanvases.push(pageCanvas);
    }

    // For browser-only: download individual pages as images or combine
    // Using window.print approach for actual PDF, or download as images
    if (pageCanvases.length === 1) {
      const link = document.createElement("a");
      link.download = "images-to-pdf-page.png";
      link.href = pageCanvases[0].toDataURL("image/png");
      link.click();
    } else {
      // Open in new window for printing as PDF
      const html = pageCanvases.map((pc) => {
        const dataUrl = pc.toDataURL("image/jpeg", quality);
        return `<div style="page-break-after:always;margin:0;padding:0;display:flex;align-items:center;justify-content:center;width:100vw;height:100vh">
          <img src="${dataUrl}" style="max-width:100%;max-height:100%;object-fit:contain" />
        </div>`;
      }).join("");

      const win = window.open("", "_blank");
      if (win) {
        win.document.write(`<html><head><title>Images to PDF</title><style>@page{margin:0}body{margin:0}@media print{div{page-break-after:always}}</style></head><body>${html}<script>setTimeout(()=>window.print(),500)<\/script></body></html>`);
        win.document.close();
      }
    }

    setGenerating(false);
  }, [images, pageSize, orientation, fitMode, margin, quality]);

  return (
    <div className="space-y-6">
      {/* Settings */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs text-muted">Page Size</label>
          <select value={pageSize} onChange={(e) => setPageSize(e.target.value as PageSize)}
            className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none">
            <option value="a4">A4</option><option value="letter">Letter</option>
            <option value="a3">A3</option><option value="legal">Legal</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Orientation</label>
          <select value={orientation} onChange={(e) => setOrientation(e.target.value as Orientation)}
            className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none">
            <option value="portrait">Portrait</option><option value="landscape">Landscape</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Fit Mode</label>
          <select value={fitMode} onChange={(e) => setFitMode(e.target.value as FitMode)}
            className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none">
            <option value="fit">Fit (contain)</option><option value="fill">Fill (cover)</option><option value="stretch">Stretch</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Margin (pt)</label>
          <input type="number" min={0} max={100} value={margin} onChange={(e) => setMargin(Number(e.target.value))}
            className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none" />
        </div>
      </div>

      {/* Drop zone */}
      <div onClick={() => inputRef.current?.click()}
        onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); }}
        onDragOver={(e) => e.preventDefault()}
        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface/50 p-10 cursor-pointer transition-colors hover:border-accent hover:bg-accent/5">
        <span className="text-3xl mb-2">📄</span>
        <span className="text-sm font-medium">Drop images here or click to browse</span>
        <span className="text-xs text-muted mt-1">JPG, PNG, WebP — one image per page</span>
        <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && handleFiles(e.target.files)} />
      </div>

      {/* Image list */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">{images.length} page{images.length !== 1 ? "s" : ""}</span>
            <button onClick={() => setImages([])} className="text-xs text-muted hover:text-danger">Clear all</button>
          </div>
          {images.map((img, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
              <img src={img.src} alt={img.name} className="h-12 w-12 rounded object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{img.name}</div>
                <div className="text-xs text-muted">{img.width} × {img.height}px · Page {i + 1}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => moveImage(i, -1)} disabled={i === 0} className="text-xs text-muted hover:text-foreground disabled:opacity-30">↑</button>
                <button onClick={() => moveImage(i, 1)} disabled={i === images.length - 1} className="text-xs text-muted hover:text-foreground disabled:opacity-30">↓</button>
                <button onClick={() => removeImage(i)} className="text-xs text-muted hover:text-danger ml-1">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Export */}
      <button onClick={generatePdf} disabled={images.length === 0 || generating}
        className="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-accent-fg shadow-lg shadow-accent/25 transition-all hover:bg-accent-hover disabled:opacity-40">
        {generating
          ? "Preparing…"
          : images.length === 1
            ? "🖼️ Export page as PNG"
            : `🖨️ Open print layout (${images.length} pages)`}
      </button>
    </div>
  );
}
