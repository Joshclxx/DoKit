"use client";

import { useState, useMemo } from "react";
import { copyToClipboard } from "@/lib/utils/download";

interface VideoInfo {
  id: string;
  title: string;
  thumbnails: { default: string; medium: string; high: string; maxres: string };
  embedUrl: string;
  shareUrl: string;
  startTime: number | null;
}

function parseYouTubeUrl(url: string): VideoInfo | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  let id = "";
  for (const p of patterns) {
    const m = url.match(p);
    if (m) { id = m[1]; break; }
  }
  if (!id) return null;

  // Parse start time
  let startTime: number | null = null;
  const tMatch = url.match(/[?&]t=(\d+)/);
  if (tMatch) startTime = parseInt(tMatch[1]);

  return {
    id,
    title: `Video ${id}`,
    thumbnails: {
      default: `https://img.youtube.com/vi/${id}/default.jpg`,
      medium: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
      high: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      maxres: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
    },
    embedUrl: `https://www.youtube.com/embed/${id}${startTime ? `?start=${startTime}` : ""}`,
    shareUrl: `https://youtu.be/${id}${startTime ? `?t=${startTime}` : ""}`,
    startTime,
  };
}

const thumbSizes = [
  { key: "default" as const, label: "Default", size: "120×90" },
  { key: "medium" as const, label: "Medium", size: "320×180" },
  { key: "high" as const, label: "High", size: "480×360" },
  { key: "maxres" as const, label: "Max Res", size: "1280×720" },
];

export default function YouTubeVideoInspector() {
  const [url, setUrl] = useState("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  const [copied, setCopied] = useState<string | null>(null);

  const info = useMemo(() => parseYouTubeUrl(url), [url]);

  const copy = async (text: string, label: string) => {
    await copyToClipboard(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const embedCode = info ? `<iframe width="560" height="315" src="${info.embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>` : "";

  return (
    <div className="space-y-6">
      {/* URL input */}
      <div>
        <label className="mb-2 block text-sm font-medium text-muted">YouTube URL</label>
        <input type="text" value={url} onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste any YouTube URL…"
          className="h-10 w-full rounded-lg border border-border bg-surface px-3 font-mono text-sm focus:border-accent focus:outline-none" />
      </div>

      {!info ? (
        <div className="rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
          Invalid YouTube URL. Supported formats: youtube.com/watch, youtu.be, youtube.com/embed, youtube.com/shorts
        </div>
      ) : (
        <>
          {/* Video info cards */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="text-xs text-muted mb-1">Video ID</div>
              <div className="font-mono text-sm font-bold">{info.id}</div>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="text-xs text-muted mb-1">Share URL</div>
              <button onClick={() => copy(info.shareUrl, "share")} className="font-mono text-sm text-accent hover:underline truncate block">
                {copied === "share" ? "✓ Copied" : info.shareUrl}
              </button>
            </div>
            {info.startTime !== null && (
              <div className="rounded-lg border border-border bg-surface p-4">
                <div className="text-xs text-muted mb-1">Start Time</div>
                <div className="font-mono text-sm">{info.startTime}s ({Math.floor(info.startTime / 60)}:{(info.startTime % 60).toString().padStart(2, "0")})</div>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Thumbnails</div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {thumbSizes.map((t) => (
                <div key={t.key} className="rounded-lg border border-border bg-surface overflow-hidden">
                  <img src={info.thumbnails[t.key]} alt={t.label} className="w-full aspect-video object-cover" />
                  <div className="flex items-center justify-between p-2">
                    <div>
                      <div className="text-xs font-medium">{t.label}</div>
                      <div className="text-[10px] text-muted">{t.size}</div>
                    </div>
                    <button onClick={() => copy(info.thumbnails[t.key], t.key)}
                      className="rounded px-2 py-1 text-xs text-muted hover:text-foreground">
                      {copied === t.key ? "✓" : "📋"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Embed preview */}
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Embed Preview</div>
            <div className="aspect-video rounded-lg overflow-hidden border border-border">
              <iframe src={info.embedUrl} className="w-full h-full" allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
            </div>
          </div>

          {/* Embed code */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">Embed Code</span>
              <button onClick={() => copy(embedCode, "embed")} className="text-xs text-muted hover:text-foreground">
                {copied === "embed" ? "✓ Copied" : "📋 Copy"}
              </button>
            </div>
            <pre className="rounded-lg border border-border bg-surface p-4 font-mono text-xs whitespace-pre-wrap">{embedCode}</pre>
          </div>

          {/* Quick links */}
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Quick Links</div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Watch", url: `https://www.youtube.com/watch?v=${info.id}` },
                { label: "Embed", url: info.embedUrl },
                { label: "Nocookie Embed", url: `https://www.youtube-nocookie.com/embed/${info.id}` },
                { label: "Shorts", url: `https://www.youtube.com/shorts/${info.id}` },
              ].map((link) => (
                <button key={link.label} onClick={() => copy(link.url, link.label)}
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:bg-surface-hover transition-colors">
                  {copied === link.label ? "✓" : link.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
