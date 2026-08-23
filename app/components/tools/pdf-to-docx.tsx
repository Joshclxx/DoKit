"use client";

import Link from "next/link";
import { useState, useRef, useCallback } from "react";
import { downloadFile } from "@/lib/utils/download";

/* ── PDF.js setup ── */

let pdfjsLib: typeof import("pdfjs-dist") | null = null;

async function getPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  const lib = await import("pdfjs-dist");
  lib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
  pdfjsLib = lib;
  return lib;
}

/* ── Rich text types ── */

interface RichSpan {
  text: string;
  bold: boolean;
  italic: boolean;
  fontSize: number;
}

interface RichLine {
  spans: RichSpan[];
  indent: number;   // px offset from left margin
  gapBefore: number; // vertical gap to previous line
  maxFontSize: number;
}

interface RichPage {
  pageNum: number;
  lines: RichLine[];
}

/* ── Extract with formatting ── */

async function extractRichText(
  file: File,
  onProgress?: (p: number) => void
): Promise<RichPage[]> {
  const lib = await getPdfJs();
  const buf = await file.arrayBuffer();
  const doc = await lib.getDocument({ data: buf }).promise;
  const totalPages = doc.numPages;
  const pages: RichPage[] = [];

  for (let pg = 1; pg <= totalPages; pg++) {
    onProgress?.(Math.round((pg / totalPages) * 100));
    const page = await doc.getPage(pg);
    const content = await page.getTextContent();
    const styles = content.styles as Record<string, { fontFamily: string }>;

    // Collect items with formatting
    interface RawItem {
      str: string;
      x: number;
      y: number;
      fontSize: number;
      bold: boolean;
      italic: boolean;
    }
    const items: RawItem[] = [];
    for (const item of content.items) {
      if (!("str" in item) || !item.str) continue;
      const x = item.transform[4];
      const y = item.transform[5];
      const fontSize = Math.abs(item.transform[0]) || Math.abs(item.transform[3]) || 12;
      const fontName = "fontName" in item ? String(item.fontName) : "";
      const fontFamily = styles[fontName]?.fontFamily || fontName;
      const full = (fontName + " " + fontFamily).toLowerCase();
      const bold = /bold|black|heavy|demi|semibold/.test(full);
      const italic = /italic|oblique|inclined/.test(full);
      items.push({ str: item.str, x, y, fontSize: Math.round(fontSize * 10) / 10, bold, italic });
    }

    // Group by Y (round to 1.5px tolerance)
    const lineMap = new Map<number, RawItem[]>();
    for (const it of items) {
      const yKey = Math.round(it.y / 1.5) * 1.5;
      if (!lineMap.has(yKey)) lineMap.set(yKey, []);
      lineMap.get(yKey)!.push(it);
    }

    // Sort lines top-to-bottom (descending Y), items left-to-right
    const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);
    const richLines: RichLine[] = [];
    let prevY: number | null = null;
    let leftMargin = Infinity;

    // Find left margin (minimum X across all lines)
    for (const y of sortedYs) {
      const lineItems = lineMap.get(y)!;
      for (const it of lineItems) {
        if (it.x < leftMargin) leftMargin = it.x;
      }
    }

    for (const y of sortedYs) {
      const lineItems = lineMap.get(y)!.sort((a, b) => a.x - b.x);
      const gap = prevY !== null ? prevY - y : 0;
      prevY = y;

      // Build spans — merge consecutive items with same formatting
      const spans: RichSpan[] = [];
      let maxFs = 0;
      for (let j = 0; j < lineItems.length; j++) {
        const it = lineItems[j];
        if (it.fontSize > maxFs) maxFs = it.fontSize;

        // Check if we should add spacing between items
        let prefix = "";
        if (j > 0) {
          const prev = lineItems[j - 1];
          const estimatedPrevEnd = prev.x + prev.str.length * prev.fontSize * 0.5;
          const gap = it.x - estimatedPrevEnd;
          if (gap > prev.fontSize * 2) prefix = "    ";
          else if (gap > prev.fontSize * 0.3) prefix = " ";
        }
        const text = prefix + it.str;

        // Merge with previous span if same formatting
        if (
          spans.length > 0 &&
          spans[spans.length - 1].bold === it.bold &&
          spans[spans.length - 1].italic === it.italic &&
          Math.abs(spans[spans.length - 1].fontSize - it.fontSize) < 0.5
        ) {
          spans[spans.length - 1].text += text;
        } else {
          spans.push({ text, bold: it.bold, italic: it.italic, fontSize: it.fontSize });
        }
      }

      const indent = Math.max(0, Math.round(lineItems[0].x - leftMargin));
      richLines.push({ spans, indent, gapBefore: Math.max(0, gap), maxFontSize: maxFs });
    }

    pages.push({ pageNum: pg, lines: richLines });
  }

  return pages;
}

/* ── Detect if line is a heading based on font size relative to body ── */

function getBodyFontSize(pages: RichPage[]): number {
  const sizes: number[] = [];
  for (const p of pages) {
    for (const l of p.lines) {
      sizes.push(l.maxFontSize);
    }
  }
  if (sizes.length === 0) return 12;
  // Most common font size = body text
  const freq = new Map<number, number>();
  for (const s of sizes) {
    const rounded = Math.round(s);
    freq.set(rounded, (freq.get(rounded) || 0) + 1);
  }
  let best = 12;
  let bestCount = 0;
  for (const [size, count] of freq) {
    if (count > bestCount) { best = size; bestCount = count; }
  }
  return best;
}

/* ── Component ── */

export default function PdfToDocx() {
  const [pages, setPages] = useState<RichPage[]>([]);
  const [plainText, setPlainText] = useState("");
  const [fileName, setFileName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"rich" | "plain">("rich");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a PDF file.");
      return;
    }
    setProcessing(true);
    setProgress(0);
    setError("");
    setFileName(file.name.replace(/\.pdf$/i, ""));

    try {
      const result = await extractRichText(file, setProgress);
      if (result.every((p) => p.lines.length === 0)) {
        setError("No selectable text found. This PDF may contain scanned images. Try the Text Extractor tool instead.");
        setPages([]);
        return;
      }
      setPages(result);
      // Build plain text version
      const plain = result.map((p) =>
        p.lines.map((l) => {
          const indent = l.indent > 20 ? "  " : "";
          return indent + l.spans.map((s) => s.text).join("");
        }).join("\n")
      ).join("\n\n");
      setPlainText(plain);
    } catch (err) {
      setError(`Failed to parse PDF: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setProcessing(false);
    }
  }, []);

  const bodyFs = getBodyFontSize(pages);

  /* ── Build rich HTML for export ── */
  const buildRichHtml = useCallback(() => {
    const parts: string[] = [];
    for (let pi = 0; pi < pages.length; pi++) {
      const page = pages[pi];
      if (pi > 0) parts.push('<br style="page-break-before:always">');
      for (const line of page.lines) {
        const isHeading = line.maxFontSize > bodyFs * 1.15;
        const isSubheading = line.maxFontSize > bodyFs * 1.05 && !isHeading;
        const marginTop = line.gapBefore > line.maxFontSize * 1.8 ? "12pt" : line.gapBefore > line.maxFontSize * 1.2 ? "6pt" : "1pt";
        const marginLeft = line.indent > 20 ? `${Math.round(line.indent * 0.6)}pt` : "0";

        // Build span HTML preserving bold/italic
        const spanHtml = line.spans.map((s) => {
          let t = s.text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          if (s.bold && s.italic) t = `<b><i>${t}</i></b>`;
          else if (s.bold) t = `<b>${t}</b>`;
          else if (s.italic) t = `<i>${t}</i>`;
          return t;
        }).join("");

        if (isHeading) {
          parts.push(`<h2 style="font-family:Calibri,Arial,sans-serif;font-size:${Math.round(line.maxFontSize * 0.85)}pt;color:#1a1a2e;margin:${marginTop} 0 4pt ${marginLeft}">${spanHtml}</h2>`);
        } else if (isSubheading) {
          parts.push(`<h3 style="font-family:Calibri,Arial,sans-serif;font-size:${Math.round(line.maxFontSize * 0.85)}pt;color:#333;margin:${marginTop} 0 3pt ${marginLeft}">${spanHtml}</h3>`);
        } else {
          parts.push(`<p style="font-family:Calibri,Arial,sans-serif;font-size:${Math.round(line.maxFontSize * 0.85)}pt;line-height:1.5;margin:${marginTop} 0 1pt ${marginLeft}">${spanHtml}</p>`);
        }
      }
    }
    return parts.join("\n");
  }, [pages, bodyFs]);

  const exportDocx = () => {
    const body = buildRichHtml();
    const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${fileName || "document"}</title>
<style>body{font-family:Calibri,Arial,sans-serif;margin:72pt 72pt;line-height:1.5}
h2{color:#1a1a2e}h3{color:#333}p{margin:1pt 0}</style></head>
<body>${body}</body></html>`;
    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName || "document"}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportTxt = () => downloadFile(plainText, `${fileName || "document"}.txt`);

  const totalWords = plainText.split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Upload */}
      <div onClick={() => inputRef.current?.click()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onDragOver={(e) => e.preventDefault()}
        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface/50 p-10 cursor-pointer transition-colors hover:border-accent hover:bg-accent/5">
        <span className="text-3xl mb-2">📄</span>
        <span className="text-sm font-medium">
          {processing ? `Extracting text… ${progress}%` : "Drop a PDF here or click to browse"}
        </span>
        <span className="text-xs text-muted mt-1">Preserves bold, italic, font sizes, spacing, and indentation</span>
        {processing && (
          <div className="mt-3 w-48 h-2 rounded-full bg-surface-hover overflow-hidden">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
        <input ref={inputRef} type="file" accept=".pdf" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>

      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 p-4">
          <div className="text-sm font-semibold text-danger">Couldn’t read that PDF</div>
          <p className="mt-1 text-sm leading-6 text-muted">{error}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => inputRef.current?.click()} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg">Choose another file</button>
            <Link href="/tools/text-extractor" className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-hover">Open Text Extractor</Link>
          </div>
          <p className="mt-3 text-xs text-muted">Nothing was uploaded — the file never left this device.</p>
        </div>
      )}

      {pages.length > 0 && (
        <>
          {/* Header bar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{fileName}.pdf</span>
              <span className="text-xs text-muted">{pages.length} page{pages.length !== 1 ? "s" : ""} · {totalWords} words</span>
            </div>
            <div className="flex gap-2">
              <button onClick={exportDocx} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:bg-accent-hover">↓ Export .DOC</button>
              <button onClick={exportTxt} className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-hover">↓ Export .TXT</button>
            </div>
          </div>

          {/* View mode toggle */}
          <div className="flex rounded-lg border border-border bg-surface p-1 w-fit">
            {(["rich", "plain"] as const).map((m) => (
              <button key={m} onClick={() => setViewMode(m)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${viewMode === m ? "bg-accent text-accent-fg" : "text-muted hover:text-foreground"}`}>
                {m === "rich" ? "📐 Formatted Preview" : "📝 Plain Text"}
              </button>
            ))}
          </div>

          {viewMode === "rich" ? (
            /* ── Rich formatted preview ── */
            <div className="rounded-lg border border-border bg-white overflow-hidden">
              {pages.map((page, pi) => (
                <div key={pi}>
                  {pi > 0 && (
                    <div className="flex items-center gap-3 px-8 py-2 bg-surface/50">
                      <div className="flex-1 border-t border-border" />
                      <span className="text-[10px] text-muted font-medium">Page {page.pageNum}</span>
                      <div className="flex-1 border-t border-border" />
                    </div>
                  )}
                  <div className="px-10 py-6" style={{ color: "#1a202c" }}>
                    {page.lines.map((line, li) => {
                      const isHeading = line.maxFontSize > bodyFs * 1.15;
                      const isSubheading = line.maxFontSize > bodyFs * 1.05 && !isHeading;
                      const gap = line.gapBefore > line.maxFontSize * 1.8 ? 16 : line.gapBefore > line.maxFontSize * 1.2 ? 8 : 2;
                      const indent = line.indent > 20 ? Math.round(line.indent * 0.5) : 0;

                      const content = line.spans.map((s, si) => {
                        let el = <span key={si}>{s.text}</span>;
                        if (s.bold && s.italic) el = <strong key={si}><em>{s.text}</em></strong>;
                        else if (s.bold) el = <strong key={si}>{s.text}</strong>;
                        else if (s.italic) el = <em key={si}>{s.text}</em>;
                        return el;
                      });

                      if (isHeading) {
                        return <div key={li} style={{ fontSize: `${Math.min(22, Math.round(line.maxFontSize * 0.9))}px`, fontWeight: 700, color: "#1a1a2e", marginTop: `${gap}px`, marginLeft: `${indent}px`, lineHeight: 1.3 }}>{content}</div>;
                      }
                      if (isSubheading) {
                        return <div key={li} style={{ fontSize: `${Math.min(18, Math.round(line.maxFontSize * 0.85))}px`, fontWeight: 600, color: "#333", marginTop: `${gap}px`, marginLeft: `${indent}px`, lineHeight: 1.4 }}>{content}</div>;
                      }
                      return <div key={li} style={{ fontSize: "13px", marginTop: `${gap}px`, marginLeft: `${indent}px`, lineHeight: 1.6, color: "#374151" }}>{content}</div>;
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── Plain text editor ── */
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">Edit Text</label>
                <textarea value={plainText} onChange={(e) => setPlainText(e.target.value)} rows={24}
                  className="w-full rounded-lg border border-border bg-surface p-4 font-mono text-sm leading-relaxed focus:border-accent focus:outline-none resize-y" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">Preview</label>
                <div className="rounded-lg border border-border bg-white p-8 max-h-[600px] overflow-y-auto" style={{ color: "#222" }}>
                  {plainText.split("\n").map((line, i) => {
                    const t = line.trim();
                    if (!t) return <br key={i} />;
                    if (t === t.toUpperCase() && t.length > 3 && t.length < 80 && /[A-Z]/.test(t)) {
                      return <h2 key={i} className="text-base font-bold mt-4 mb-2" style={{ color: "#1a1a2e" }}>{t}</h2>;
                    }
                    return <p key={i} className="text-sm leading-relaxed mb-1">{t}</p>;
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
