"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface RemovalConfig {
  mode: "color" | "threshold";
  targetColor: string;
  tolerance: number;
  edgeSmooth: number;
  replaceBg: string;
  useTransparent: boolean;
}

export default function BackgroundRemover() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [config, setConfig] = useState<RemovalConfig>({
    mode: "color", targetColor: "#ffffff", tolerance: 40,
    edgeSmooth: 1, replaceBg: "#00ff00", useTransparent: true,
  });
  const [pickingColor, setPickingColor] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof RemovalConfig>(k: K, v: RemovalConfig[K]) => setConfig((p) => ({ ...p, [k]: v }));

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const hexToRgb = (hex: string): [number, number, number] => {
    const h = hex.replace("#", "");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!pickingColor || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);
    const ctx = canvas.getContext("2d")!;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = `#${pixel[0].toString(16).padStart(2, "0")}${pixel[1].toString(16).padStart(2, "0")}${pixel[2].toString(16).padStart(2, "0")}`;
    update("targetColor", hex);
    setPickingColor(false);
  };

  // Draw source image
  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      canvas.width = img.width; canvas.height = img.height;
      canvas.getContext("2d")!.drawImage(img, 0, 0);
      imgRef.current = img;
    };
    img.src = image;
  }, [image]);

  const removeBackground = useCallback(() => {
    if (!canvasRef.current || !imgRef.current) return;
    setProcessing(true);

    const src = canvasRef.current;
    const ctx = src.getContext("2d")!;
    const imageData = ctx.getImageData(0, 0, src.width, src.height);
    const data = imageData.data;

    const [tr, tg, tb] = hexToRgb(config.targetColor);
    const [br, bg2, bb] = hexToRgb(config.replaceBg);
    const tol = config.tolerance;

    // Process pixels
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];

      let distance: number;
      if (config.mode === "color") {
        distance = Math.sqrt((r - tr) ** 2 + (g - tg) ** 2 + (b - tb) ** 2);
      } else {
        // Luminance threshold
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const targetLum = 0.299 * tr + 0.587 * tg + 0.114 * tb;
        distance = Math.abs(lum - targetLum);
      }

      const maxDist = tol * 4.41; // scale to 0-255 range equivalent
      if (distance < maxDist) {
        // Edge feathering
        const alpha = Math.min(255, Math.max(0, ((distance / maxDist) * 255)));
        if (config.useTransparent) {
          data[i + 3] = Math.round(alpha);
        } else {
          const blend = alpha / 255;
          data[i] = Math.round(r * blend + br * (1 - blend));
          data[i + 1] = Math.round(g * blend + bg2 * (1 - blend));
          data[i + 2] = Math.round(b * blend + bb * (1 - blend));
        }
      }
    }

    // Apply edge smoothing
    if (config.edgeSmooth > 0) {
      // Simple box blur on alpha channel
      const w = src.width, h = src.height, rad = config.edgeSmooth;
      const alpha = new Float32Array(w * h);
      for (let i = 0; i < w * h; i++) alpha[i] = data[i * 4 + 3];
      const blurred = new Float32Array(w * h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let sum = 0, count = 0;
          for (let dy = -rad; dy <= rad; dy++) {
            for (let dx = -rad; dx <= rad; dx++) {
              const nx = x + dx, ny = y + dy;
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) { sum += alpha[ny * w + nx]; count++; }
            }
          }
          blurred[y * w + x] = sum / count;
        }
      }
      for (let i = 0; i < w * h; i++) data[i * 4 + 3] = Math.round(blurred[i]);
    }

    // Render result
    const resultCanvas = previewRef.current || document.createElement("canvas");
    resultCanvas.width = src.width; resultCanvas.height = src.height;
    const rctx = resultCanvas.getContext("2d")!;

    // Draw checkerboard for transparency
    if (config.useTransparent) {
      const sz = 8;
      for (let y = 0; y < resultCanvas.height; y += sz) {
        for (let x = 0; x < resultCanvas.width; x += sz) {
          rctx.fillStyle = ((x / sz + y / sz) % 2 === 0) ? "#ccc" : "#fff";
          rctx.fillRect(x, y, sz, sz);
        }
      }
    }

    rctx.putImageData(imageData, 0, 0);

    // For download - use clean canvas without checkerboard
    const dlCanvas = document.createElement("canvas");
    dlCanvas.width = src.width; dlCanvas.height = src.height;
    dlCanvas.getContext("2d")!.putImageData(imageData, 0, 0);
    setResult(dlCanvas.toDataURL("image/png"));

    setProcessing(false);
  }, [config]);

  return (
    <div className="space-y-6">
      {/* Settings */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs text-muted">Mode</label>
          <select value={config.mode} onChange={(e) => update("mode", e.target.value as RemovalConfig["mode"])}
            className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none">
            <option value="color">Color Match</option><option value="threshold">Luminance</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Target Color</label>
          <div className="flex gap-2">
            <input type="color" value={config.targetColor} onChange={(e) => update("targetColor", e.target.value)}
              className="h-9 w-10 rounded border border-border cursor-pointer" />
            <button onClick={() => setPickingColor(!pickingColor)}
              className={`h-9 flex-1 rounded-lg border text-xs font-medium ${pickingColor ? "border-accent bg-accent/10 text-accent" : "border-border hover:bg-surface-hover"}`}>
              {pickingColor ? "Click image…" : "🎯 Pick"}
            </button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Tolerance: {config.tolerance}</label>
          <input type="range" min={1} max={100} value={config.tolerance} onChange={(e) => update("tolerance", Number(e.target.value))}
            className="w-full accent-accent mt-2" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Edge Smooth: {config.edgeSmooth}px</label>
          <input type="range" min={0} max={5} value={config.edgeSmooth} onChange={(e) => update("edgeSmooth", Number(e.target.value))}
            className="w-full accent-accent mt-2" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={config.useTransparent} onChange={(e) => update("useTransparent", e.target.checked)} className="accent-accent" />
          Transparent background
        </label>
        {!config.useTransparent && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Replace with:</span>
            <input type="color" value={config.replaceBg} onChange={(e) => update("replaceBg", e.target.value)}
              className="h-7 w-7 rounded border border-border cursor-pointer" />
          </div>
        )}
      </div>

      {/* Drop zone or canvas */}
      {!image ? (
        <div onClick={() => inputRef.current?.click()}
          onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
          onDragOver={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface/50 p-12 cursor-pointer hover:border-accent hover:bg-accent/5">
          <span className="text-3xl mb-2">✂️</span>
          <span className="text-sm font-medium">Drop an image or click to browse</span>
          <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Source */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">Original</span>
                <button onClick={() => { setImage(null); setResult(null); }} className="text-xs text-muted hover:text-danger">Remove</button>
              </div>
              <canvas ref={canvasRef} onClick={handleCanvasClick}
                className={`w-full rounded-lg border border-border ${pickingColor ? "cursor-crosshair" : ""}`} />
            </div>
            {/* Result */}
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Result</div>
              <canvas ref={previewRef} className="w-full rounded-lg border border-border" />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={removeBackground} disabled={processing}
              className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-fg shadow-lg shadow-accent/25 hover:bg-accent-hover disabled:opacity-40">
              {processing ? "Processing…" : "✂️ Remove Background"}
            </button>
            {result && (
              <a href={result} download="background-removed.png"
                className="rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-medium hover:bg-surface-hover">
                ↓ Download PNG
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
