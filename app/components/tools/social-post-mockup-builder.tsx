"use client";

import { useState, useRef, useCallback } from "react";

type Platform = "twitter" | "facebook" | "instagram" | "linkedin" | "threads";

interface PostConfig {
  platform: Platform;
  displayName: string; handle: string; avatar: string;
  content: string; image: string | null;
  likes: number; comments: number; shares: number;
  verified: boolean; darkMode: boolean;
  timestamp: string;
}

const platformMeta: Record<Platform, { label: string; icon: string; maxLen: number; color: string }> = {
  twitter: { label: "X / Twitter", icon: "𝕏", maxLen: 280, color: "#1da1f2" },
  facebook: { label: "Facebook", icon: "f", maxLen: 63206, color: "#1877f2" },
  instagram: { label: "Instagram", icon: "📷", maxLen: 2200, color: "#e1306c" },
  linkedin: { label: "LinkedIn", icon: "in", maxLen: 3000, color: "#0077b5" },
  threads: { label: "Threads", icon: "@", maxLen: 500, color: "#000" },
};

const defaults: PostConfig = {
  platform: "twitter",
  displayName: "John Doe", handle: "johndoe", avatar: "",
  content: "Just shipped an amazing new feature! 🚀\n\nCheck it out at dokit.app\n\n#buildinpublic #webdev",
  image: null, likes: 142, comments: 23, shares: 47,
  verified: true, darkMode: true, timestamp: "2h",
};

function fmtNum(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toString();
}

export default function SocialPostMockup() {
  const [config, setConfig] = useState<PostConfig>(defaults);
  const postRef = useRef<HTMLDivElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof PostConfig>(k: K, v: PostConfig[K]) => setConfig((p) => ({ ...p, [k]: v }));
  const meta = platformMeta[config.platform];

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => update("image", ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const inp = "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none";
  const isDark = config.darkMode;
  const bg = isDark ? "#15202b" : "#ffffff";
  const fg = isDark ? "#e7e9ea" : "#0f1419";
  const muted = isDark ? "#71767b" : "#536471";

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-[1fr_400px]">
        <div className="space-y-4">
          {/* Platform picker */}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(platformMeta) as Platform[]).map((p) => (
              <button key={p} onClick={() => update("platform", p)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${config.platform === p ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:text-foreground"}`}>
                {platformMeta[p].label}
              </button>
            ))}
          </div>

          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Profile</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <input type="text" placeholder="Display name" value={config.displayName} onChange={(e) => update("displayName", e.target.value)} className={inp} />
              <input type="text" placeholder="@handle" value={config.handle} onChange={(e) => update("handle", e.target.value)} className={inp} />
            </div>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={config.verified} onChange={(e) => update("verified", e.target.checked)} className="accent-accent" />Verified</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={config.darkMode} onChange={(e) => update("darkMode", e.target.checked)} className="accent-accent" />Dark mode</label>
            </div>
          </fieldset>

          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Post Content</legend>
            <div className="relative">
              <textarea value={config.content} onChange={(e) => update("content", e.target.value)} rows={5} placeholder="What's happening?"
                className="w-full rounded-lg border border-border bg-background p-3 text-sm focus:border-accent focus:outline-none resize-y" />
              <span className={`absolute bottom-2 right-2 text-xs ${config.content.length > meta.maxLen ? "text-danger" : "text-muted"}`}>
                {config.content.length}/{meta.maxLen}
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => imgInputRef.current?.click()}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:bg-surface-hover">
                🖼️ {config.image ? "Change Image" : "Add Image"}
              </button>
              {config.image && <button onClick={() => update("image", null)} className="text-xs text-danger hover:underline">Remove</button>}
              <input ref={imgInputRef} type="file" accept="image/*" hidden onChange={handleImageUpload} />
            </div>
            <input type="text" placeholder="Timestamp (e.g. 2h, 5m, Mar 12)" value={config.timestamp} onChange={(e) => update("timestamp", e.target.value)} className={inp} />
          </fieldset>

          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Engagement</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              <div><label className="mb-1 block text-xs text-muted">Likes</label><input type="number" value={config.likes} onChange={(e) => update("likes", Number(e.target.value))} className={inp} /></div>
              <div><label className="mb-1 block text-xs text-muted">Comments</label><input type="number" value={config.comments} onChange={(e) => update("comments", Number(e.target.value))} className={inp} /></div>
              <div><label className="mb-1 block text-xs text-muted">Shares</label><input type="number" value={config.shares} onChange={(e) => update("shares", Number(e.target.value))} className={inp} /></div>
            </div>
          </fieldset>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-4 self-start">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Preview</div>
          <div ref={postRef} className="rounded-xl overflow-hidden border border-border" style={{ background: bg, color: fg }}>
            <div className="p-4">
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full shrink-0 flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: meta.color }}>{config.displayName.charAt(0).toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-sm truncate">{config.displayName}</span>
                    {config.verified && <span className="text-xs" style={{ color: meta.color }}>✓</span>}
                  </div>
                  <span className="text-xs" style={{ color: muted }}>@{config.handle} · {config.timestamp}</span>
                </div>
              </div>

              {/* Content */}
              <div className="mt-3 text-sm whitespace-pre-wrap leading-relaxed">{config.content}</div>

              {/* Image */}
              {config.image && (
                <div className="mt-3 rounded-xl overflow-hidden border" style={{ borderColor: isDark ? "#38444d" : "#e1e8ed" }}>
                  <img src={config.image} alt="Post" className="w-full max-h-80 object-cover" />
                </div>
              )}

              {/* Engagement */}
              <div className="mt-3 flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${isDark ? "#38444d" : "#e1e8ed"}` }}>
                <span className="flex items-center gap-1.5 text-xs" style={{ color: muted }}>💬 {fmtNum(config.comments)}</span>
                <span className="flex items-center gap-1.5 text-xs" style={{ color: muted }}>🔄 {fmtNum(config.shares)}</span>
                <span className="flex items-center gap-1.5 text-xs" style={{ color: muted }}>❤️ {fmtNum(config.likes)}</span>
                <span className="flex items-center gap-1.5 text-xs" style={{ color: muted }}>📤</span>
              </div>
            </div>
          </div>

          <button onClick={() => {
            if (!postRef.current) return;
            const html = postRef.current.outerHTML;
            const blob = new Blob([`<html><body style="margin:0;display:flex;justify-content:center;padding:20px;background:#0a0a0a">${html}</body></html>`], { type: "text/html" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = "social-post-mockup.html"; a.click();
          }} className="mt-3 w-full rounded-lg bg-accent py-2 text-sm font-medium text-accent-fg hover:bg-accent-hover">
            ↓ Export as HTML
          </button>
        </div>
      </div>
    </div>
  );
}
