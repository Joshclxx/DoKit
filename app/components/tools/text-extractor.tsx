"use client";

import { useState, useRef, useCallback } from "react";
import { copyToClipboard, downloadFile } from "@/lib/utils/download";

export default function TextExtractor() {
  const [files, setFiles] = useState<{ name: string; text: string; type: string }[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const extractFromFile = useCallback(async (file: File) => {
    // Plain text files
    if (file.type.startsWith("text/") || file.name.endsWith(".md") || file.name.endsWith(".csv") ||
        file.name.endsWith(".json") || file.name.endsWith(".xml") || file.name.endsWith(".html") ||
        file.name.endsWith(".yml") || file.name.endsWith(".yaml") || file.name.endsWith(".log") ||
        file.name.endsWith(".tsx") || file.name.endsWith(".ts") || file.name.endsWith(".js") ||
        file.name.endsWith(".py") || file.name.endsWith(".css") || file.name.endsWith(".sql")) {
      const text = await file.text();
      return { name: file.name, text, type: "text" };
    }

    // JSON files
    if (file.type === "application/json" || file.name.endsWith(".json")) {
      const text = await file.text();
      try { return { name: file.name, text: JSON.stringify(JSON.parse(text), null, 2), type: "json" }; }
      catch { return { name: file.name, text, type: "text" }; }
    }

    // PDF - extract text layers
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      const str = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
      // Extract text between BT/ET markers (basic PDF text extraction)
      const textChunks: string[] = [];
      const regex = /\(([^)]+)\)/g;
      let match;
      while ((match = regex.exec(str)) !== null) {
        const chunk = match[1];
        if (chunk.length > 2 && /[a-zA-Z]/.test(chunk)) textChunks.push(chunk);
      }
      const extracted = textChunks.length > 0 ? textChunks.join(" ") : "[PDF text extraction limited — for best results, use a PDF with selectable text]";
      return { name: file.name, text: extracted, type: "pdf" };
    }

    // Images - display for manual transcription
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      return { name: file.name, text: "[Image loaded — use the preview panel to read and transcribe text manually]\n\nType or paste the extracted text below:", type: "image" };
    }

    // Fallback
    const text = await file.text().catch(() => "[Unable to extract text from this file type]");
    return { name: file.name, text, type: "unknown" };
  }, []);

  const handleFiles = useCallback(async (fileList: FileList) => {
    setProcessing(true);
    const results: typeof files = [];
    for (const file of Array.from(fileList)) {
      const result = await extractFromFile(file);
      results.push(result);
    }
    setFiles((prev) => [...prev, ...results]);
    setSelectedIdx(files.length);
    setProcessing(false);
  }, [extractFromFile, files.length]);

  const currentFile = files[selectedIdx];
  const updateText = (text: string) => {
    setFiles((p) => p.map((f, i) => i === selectedIdx ? { ...f, text } : f));
  };

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div onClick={() => inputRef.current?.click()}
        onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); }}
        onDragOver={(e) => e.preventDefault()}
        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface/50 p-10 cursor-pointer transition-colors hover:border-accent hover:bg-accent/5">
        <span className="text-sm font-medium">{processing ? "Extracting…" : "Drop files here or click to browse"}</span>
        <span className="text-xs text-muted mt-1">PDF, TXT, Markdown, JSON, CSV, Code files, Images</span>
        <input ref={inputRef} type="file" multiple hidden accept=".pdf,.txt,.md,.csv,.json,.xml,.html,.yml,.yaml,.log,.tsx,.ts,.js,.py,.css,.sql,image/*"
          onChange={(e) => e.target.files && handleFiles(e.target.files)} />
      </div>

      {/* File tabs */}
      {files.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {files.map((f, i) => (
            <button key={i} onClick={() => setSelectedIdx(i)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedIdx === i ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:text-foreground"
              }`}>
              {f.name}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {currentFile && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Text editor */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">Extracted Text</span>
                <span className="rounded bg-surface-hover px-2 py-0.5 text-[10px] text-muted">{currentFile.type}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={async () => { await copyToClipboard(currentFile.text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="text-xs text-muted hover:text-foreground">{copied ? "✓" : "Copy"}</button>
                <button onClick={() => downloadFile(currentFile.text, `extracted-${currentFile.name}.txt`)}
                  className="text-xs text-muted hover:text-foreground">Download</button>
              </div>
            </div>
            <textarea value={currentFile.text} onChange={(e) => updateText(e.target.value)}
              rows={18}
              className="w-full rounded-lg border border-border bg-surface p-4 font-mono text-sm leading-relaxed focus:border-accent focus:outline-none resize-y" />
            <div className="mt-1 text-xs text-muted">
              {currentFile.text.length} chars · {currentFile.text.split(/\s+/).filter(Boolean).length} words · {currentFile.text.split("\n").length} lines
            </div>
          </div>

          {/* Image preview */}
          {imagePreview && currentFile.type === "image" && (
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Image Preview</div>
              <div className="rounded-lg border border-border overflow-auto max-h-[500px]">
                <img src={imagePreview} alt="Preview" className="w-full" />
              </div>
              <p className="mt-2 text-xs text-muted"> Tip: Read the text in the image and type it in the text area. For automated OCR, use an AI vision model.</p>
            </div>
          )}

          {/* Stats for non-image */}
          {currentFile.type !== "image" && (
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted">Analysis</div>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Characters" value={currentFile.text.length.toLocaleString()} />
                <Stat label="Words" value={currentFile.text.split(/\s+/).filter(Boolean).length.toLocaleString()} />
                <Stat label="Lines" value={currentFile.text.split("\n").length.toLocaleString()} />
                <Stat label="Paragraphs" value={currentFile.text.split(/\n\s*\n/).filter(Boolean).length.toLocaleString()} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-lg font-bold font-mono">{value}</div>
    </div>
  );
}
