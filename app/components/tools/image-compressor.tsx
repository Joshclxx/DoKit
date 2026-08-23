"use client";

import { useState, useRef, useCallback } from "react";

interface CompressedResult {
  originalSize: number; compressedSize: number; reduction: number;
  originalUrl: string; compressedUrl: string;
  width: number; height: number; fileName: string;
}

export default function ImageCompressor() {
  const [results, setResults] = useState<CompressedResult[]>([]);
  const [quality, setQuality] = useState(0.7);
  const [maxWidth, setMaxWidth] = useState(1920);
  const [format, setFormat] = useState<"image/jpeg" | "image/webp" | "image/png">("image/jpeg");
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const compress = useCallback(async (files: FileList) => {
    setProcessing(true);
    const newResults: CompressedResult[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;

      const originalUrl = URL.createObjectURL(file);
      const img = new Image();
      await new Promise<void>((resolve) => { img.onload = () => resolve(); img.src = originalUrl; });

      let w = img.width, h = img.height;
      if (w > maxWidth) { h = Math.round(h * (maxWidth / w)); w = maxWidth; }

      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), format, quality);
      });

      const compressedUrl = URL.createObjectURL(blob);
      const reduction = ((file.size - blob.size) / file.size) * 100;

      newResults.push({
        originalSize: file.size, compressedSize: blob.size,
        reduction, originalUrl, compressedUrl,
        width: w, height: h, fileName: file.name,
      });
    }

    setResults((prev) => [...prev, ...newResults]);
    setProcessing(false);
  }, [quality, maxWidth, format]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) compress(e.dataTransfer.files);
  };

  const fmtSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const totalOriginal = results.reduce((s, r) => s + r.originalSize, 0);
  const totalCompressed = results.reduce((s, r) => s + r.compressedSize, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_190px_260px]">
        {/* Drop zone */}
        <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onClick={() => inputRef.current?.click()}
          className="flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface/50 p-8 text-center transition-colors hover:border-accent hover:bg-accent/5">
          <span className="mb-2 text-3xl">🖼️</span>
          <span className="text-sm font-medium">{processing ? "Processing…" : "Drop images here or click to browse"}</span>
          <span className="mt-1 text-xs text-muted">JPG, PNG, WebP, GIF · processed locally</span>
          <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && compress(e.target.files)} />
        </div>

        {/* Settings */}
        <div className="space-y-5 rounded-xl border border-border bg-surface p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted">Settings</div>
          <div><label className="mb-1 block text-xs text-muted">Quality: {Math.round(quality * 100)}%</label><input type="range" min={0.1} max={1} step={0.05} value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full accent-accent" /></div>
          <div><label className="mb-1 block text-xs text-muted">Max Width (px)</label><input type="number" min={100} max={4096} value={maxWidth} onChange={(e) => setMaxWidth(Number(e.target.value))} className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none" /></div>
          <div><label className="mb-1 block text-xs text-muted">Output format</label><select value={format} onChange={(e) => setFormat(e.target.value as typeof format)} className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none"><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option><option value="image/png">PNG</option></select></div>
        </div>

        {/* Result summary */}
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-muted">Result</span>{results.length > 0 && <button onClick={() => setResults([])} className="text-xs text-muted hover:text-danger">Clear</button>}</div>
          {results.length > 0 ? <div className="mt-4 space-y-3 text-sm"><p><strong>{results.length}</strong> image{results.length !== 1 ? "s" : ""} compressed</p><p className="text-muted">{fmtSize(totalOriginal)} → <strong className="text-success">{fmtSize(totalCompressed)}</strong></p><p className="text-lg font-bold text-accent">{totalOriginal > 0 ? Math.round(((totalOriginal - totalCompressed) / totalOriginal) * 100) : 0}% smaller</p><p className="border-t border-border pt-3 text-xs leading-5 text-muted">Never uploaded — canvas re-encoding happens in this tab.</p></div> : <div className="mt-4 flex min-h-36 items-center justify-center rounded-lg border border-dashed border-border bg-background text-center text-xs leading-5 text-muted">Compressed files and savings appear here.</div>}
        </div>
      </div>

      {/* Results */}
      <div className="space-y-3">
        {results.map((r, i) => (
          <div key={i} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <img src={r.compressedUrl} alt={r.fileName} className="w-full sm:w-32 h-24 object-cover rounded-lg" />
              <div className="flex-1">
                <div className="text-sm font-medium mb-1 truncate">{r.fileName}</div>
                <div className="text-xs text-muted mb-2">{r.width} × {r.height}px</div>
                <div className="flex gap-4 text-xs mb-2">
                  <span>{fmtSize(r.originalSize)} → <strong className="text-success">{fmtSize(r.compressedSize)}</strong></span>
                  <span className={`font-bold ${r.reduction > 0 ? "text-success" : "text-danger"}`}>
                    {r.reduction > 0 ? "−" : "+"}{Math.abs(r.reduction).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-surface-hover overflow-hidden">
                  <div className="h-full rounded-full bg-success transition-all" style={{ width: `${Math.max(0, r.reduction)}%` }} />
                </div>
              </div>
              <a href={r.compressedUrl} download={`compressed-${r.fileName}`}
                className="self-start rounded-lg bg-accent px-4 py-2 text-xs font-medium text-accent-fg hover:bg-accent-hover shrink-0">
                Download
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
