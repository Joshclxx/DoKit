"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { escapeHtml } from "@/lib/utils/html";

/* ── Data Model ─────────────────────────────────── */

interface Experience { title: string; period: string; bullets: string; }
interface Education { level: string; degree: string; school: string; year: string; bullets: string; }
interface Project { name: string; type: string; period: string; description: string; tools: string; }
interface Achievement { name: string; org: string; year: string; }
interface Reference { name: string; title: string; company: string; phone: string; }

interface ResumeData {
  name: string; address: string; phone: string; email: string; website: string;
  photo: string | null; personalStatement: string; technicalSkills: string;
  experience: Experience[]; education: Education[]; projects: Project[];
  achievements: Achievement[]; references: Reference[];
}

const blank: ResumeData = {
  name: "", address: "", phone: "", email: "", website: "", photo: null,
  personalStatement: "", technicalSkills: "",
  experience: [{ title: "", period: "", bullets: "" }],
  education: [{ level: "", degree: "", school: "", year: "", bullets: "" }],
  projects: [{ name: "", type: "", period: "", description: "", tools: "" }],
  achievements: [{ name: "", org: "", year: "" }],
  references: [{ name: "", title: "", company: "", phone: "" }],
};

/* ── Template System ─────────────────────────────── */

interface DocTemplate {
  id: string;
  name: string;
  preview: string; // CSS gradient for swatch
  primary: string;
  headerBg: string;
  headerText: string;
  sectionLine: string;
  sectionStyle: "underline" | "filled" | "leftbar" | "dotted" | "accent-underline";
}

const templates: DocTemplate[] = [
  // ── Classic & Professional ──
  { id: "classic-blue", name: "Classic Blue", preview: "linear-gradient(135deg,#2b6cb0,#ebf4ff)", primary: "#2b6cb0", headerBg: "#fff", headerText: "#2b6cb0", sectionLine: "#cbd5e0", sectionStyle: "underline" },
  { id: "navy-exec", name: "Navy Executive", preview: "linear-gradient(135deg,#1a365d,#2a4a7f)", primary: "#1a365d", headerBg: "#1a365d", headerText: "#fff", sectionLine: "#e2e8f0", sectionStyle: "filled" },
  { id: "charcoal", name: "Charcoal", preview: "linear-gradient(135deg,#1a1a2e,#4a4a5e)", primary: "#1a1a2e", headerBg: "#fff", headerText: "#1a1a2e", sectionLine: "#d1d5db", sectionStyle: "underline" },
  { id: "slate-modern", name: "Slate Modern", preview: "linear-gradient(135deg,#334155,#64748b)", primary: "#334155", headerBg: "#f8fafc", headerText: "#334155", sectionLine: "#94a3b8", sectionStyle: "dotted" },
  { id: "graphite", name: "Graphite", preview: "linear-gradient(135deg,#374151,#6b7280)", primary: "#374151", headerBg: "#fff", headerText: "#374151", sectionLine: "#d1d5db", sectionStyle: "leftbar" },
  // ── Blues & Teals ──
  { id: "ocean", name: "Ocean", preview: "linear-gradient(135deg,#0369a1,#7dd3fc)", primary: "#0369a1", headerBg: "#f0f9ff", headerText: "#0369a1", sectionLine: "#bae6fd", sectionStyle: "accent-underline" },
  { id: "sapphire", name: "Sapphire", preview: "linear-gradient(135deg,#1d4ed8,#3b82f6)", primary: "#1d4ed8", headerBg: "#1d4ed8", headerText: "#fff", sectionLine: "#bfdbfe", sectionStyle: "filled" },
  { id: "teal", name: "Teal Professional", preview: "linear-gradient(135deg,#0d9488,#5eead4)", primary: "#0d9488", headerBg: "#fff", headerText: "#0d9488", sectionLine: "#99f6e4", sectionStyle: "underline" },
  { id: "steel", name: "Steel", preview: "linear-gradient(135deg,#475569,#94a3b8)", primary: "#475569", headerBg: "#f1f5f9", headerText: "#475569", sectionLine: "#cbd5e0", sectionStyle: "dotted" },
  { id: "nordic", name: "Nordic", preview: "linear-gradient(135deg,#1e3a5f,#4a90d9)", primary: "#1e3a5f", headerBg: "#fff", headerText: "#1e3a5f", sectionLine: "#bfdbfe", sectionStyle: "leftbar" },
  // ── Greens ──
  { id: "emerald", name: "Emerald", preview: "linear-gradient(135deg,#047857,#34d399)", primary: "#047857", headerBg: "#047857", headerText: "#fff", sectionLine: "#a7f3d0", sectionStyle: "filled" },
  { id: "forest", name: "Forest", preview: "linear-gradient(135deg,#14532d,#22c55e)", primary: "#14532d", headerBg: "#fff", headerText: "#14532d", sectionLine: "#bbf7d0", sectionStyle: "leftbar" },
  // ── Reds & Warm ──
  { id: "burgundy", name: "Burgundy", preview: "linear-gradient(135deg,#7f1d1d,#dc2626)", primary: "#7f1d1d", headerBg: "#fff", headerText: "#7f1d1d", sectionLine: "#fecaca", sectionStyle: "underline" },
  { id: "crimson", name: "Crimson", preview: "linear-gradient(135deg,#991b1b,#ef4444)", primary: "#991b1b", headerBg: "#991b1b", headerText: "#fff", sectionLine: "#fecaca", sectionStyle: "filled" },
  { id: "coral", name: "Coral", preview: "linear-gradient(135deg,#c2410c,#fb923c)", primary: "#c2410c", headerBg: "#fff7ed", headerText: "#c2410c", sectionLine: "#fed7aa", sectionStyle: "accent-underline" },
  // ── Purples ──
  { id: "royal", name: "Royal Purple", preview: "linear-gradient(135deg,#581c87,#a855f7)", primary: "#581c87", headerBg: "#fff", headerText: "#581c87", sectionLine: "#e9d5ff", sectionStyle: "underline" },
  { id: "violet", name: "Violet", preview: "linear-gradient(135deg,#4c1d95,#7c3aed)", primary: "#4c1d95", headerBg: "#4c1d95", headerText: "#fff", sectionLine: "#ddd6fe", sectionStyle: "filled" },
  // ── Brown & Earth ──
  { id: "mahogany", name: "Mahogany", preview: "linear-gradient(135deg,#78350f,#b45309)", primary: "#78350f", headerBg: "#fff", headerText: "#78350f", sectionLine: "#fde68a", sectionStyle: "leftbar" },
  { id: "bronze", name: "Bronze", preview: "linear-gradient(135deg,#92400e,#d97706)", primary: "#92400e", headerBg: "#fffbeb", headerText: "#92400e", sectionLine: "#fde68a", sectionStyle: "dotted" },
  // ── Dark ──
  { id: "midnight", name: "Midnight", preview: "linear-gradient(135deg,#0f172a,#1e293b)", primary: "#0f172a", headerBg: "#0f172a", headerText: "#f1f5f9", sectionLine: "#334155", sectionStyle: "filled" },
];

/* ── ATS Scoring ─────────────────────────────────── */

function atsScore(data: ResumeData, keywords: string) {
  const kws = keywords.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean);
  if (kws.length === 0) return { score: 100, found: [] as string[], missing: [] as string[] };
  const text = [
    data.personalStatement, data.technicalSkills,
    ...data.experience.map((e) => `${e.title} ${e.bullets}`),
    ...data.projects.map((p) => `${p.name} ${p.description} ${p.tools}`),
  ].join(" ").toLowerCase();
  const found = kws.filter((k) => text.includes(k));
  const missing = kws.filter((k) => !text.includes(k));
  return { score: Math.round((found.length / kws.length) * 100), found, missing };
}

/* ── Component ───────────────────────────────────── */

export default function ATSResumeBuilder() {
  const [data, setData] = useState<ResumeData>(blank);
  const [mode, setMode] = useState<"resume" | "cv">("resume");
  const [templateId, setTemplateId] = useState("classic-blue");
  const [keywords, setKeywords] = useState("");
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const photoRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof ResumeData>(k: K, v: ResumeData[K]) =>
    setData((p) => ({ ...p, [k]: v }));
  const updateArr = <T,>(key: keyof ResumeData, arr: T[], i: number, field: string, val: string) =>
    update(key, arr.map((e, idx) => (idx === i ? { ...e, [field]: val } : e)) as never);
  const addArr = <T,>(key: keyof ResumeData, arr: T[], blank: T) =>
    update(key, [...arr, blank] as never);
  const rmArr = <T,>(key: keyof ResumeData, arr: T[], i: number) =>
    update(key, arr.filter((_, idx) => idx !== i) as never);

  const handlePhoto = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => update("photo", ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const ats = useMemo(() => atsScore(data, keywords), [data, keywords]);
  const tmpl = templates.find((t) => t.id === templateId) || templates[0];

  const inp = "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none";
  const ta = "w-full rounded-lg border border-border bg-background p-3 text-sm focus:border-accent focus:outline-none resize-y";

  const handlePrint = () => {
    const el = document.getElementById("resume-preview");
    if (!el) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>${escapeHtml(data.name || "Document")}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
@media print{@page{margin:12mm 16mm}body{margin:0}}</style></head><body>${el.innerHTML}</body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  return (
    <div className="space-y-5">
      {/* ── Top bar: Mode + ATS ── */}
      <div className="flex flex-wrap items-start gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">Document Type</label>
          <div className="flex rounded-lg border border-border bg-surface p-1">
            {(["resume", "cv"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`rounded-md px-5 py-1.5 text-sm font-medium transition-colors ${mode === m ? "bg-accent text-accent-fg" : "text-muted hover:text-foreground"}`}>
                {m === "resume" ? "📄 Resume" : "📋 CV"}
              </button>
            ))}
          </div>
          <p className="mt-1 text-[10px] text-muted">
            {mode === "resume" ? "With 2×2 photo + references" : "No photo, no references"}
          </p>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
            ATS Keywords <span className="text-[10px] normal-case">(comma-separated)</span>
          </label>
          <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)}
            placeholder="react, typescript, node.js…" className={inp} />
          {keywords && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-2 flex-1 rounded-full bg-surface-hover overflow-hidden">
                <div className={`h-full rounded-full transition-all ${ats.score >= 70 ? "bg-success" : ats.score >= 40 ? "bg-warning" : "bg-danger"}`}
                  style={{ width: `${ats.score}%` }} />
              </div>
              <span className={`text-sm font-bold ${ats.score >= 70 ? "text-success" : ats.score >= 40 ? "text-warning" : "text-danger"}`}>{ats.score}%</span>
            </div>
          )}
          {ats.missing.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {ats.missing.map((k) => (
                <span key={k} className="rounded bg-danger/10 px-1.5 py-0.5 text-[10px] text-danger">{k}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Template selector ── */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">Template</label>
        <div className="tmpl-scroll flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          <style>{`.tmpl-scroll::-webkit-scrollbar { display: none; }`}</style>
          {templates.map((t) => (
            <button key={t.id} onClick={() => setTemplateId(t.id)}
              className={`group flex flex-col items-center gap-1 rounded-lg border p-1.5 transition-all shrink-0 ${
                templateId === t.id ? "border-accent bg-accent/5 shadow-sm shadow-accent/15" : "border-border hover:border-border-hover"
              }`}
              style={{ width: "72px" }}>
              <div className="h-10 w-full rounded-md shadow-inner" style={{ background: t.preview }} />
              <span className={`text-[9px] font-semibold leading-tight text-center ${
                templateId === t.id ? "text-accent" : "text-muted group-hover:text-foreground"
              }`}>{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tabs + Actions ── */}
      <div className="flex items-center justify-between">
        <div className="flex rounded-lg border border-border bg-surface p-1">
          {(["edit", "preview"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${tab === t ? "bg-accent text-accent-fg" : "text-muted hover:text-foreground"}`}>
              {t === "edit" ? "✏️ Edit" : "👁 Preview"}
            </button>
          ))}
        </div>
        <button onClick={handlePrint}
          className="rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-accent-fg shadow-lg shadow-accent/25 hover:bg-accent-hover transition-colors">
          🖨 Export PDF
        </button>
      </div>

      {/* ═══════════ EDIT TAB ═══════════ */}
      {tab === "edit" ? (
        <div className="space-y-5">
          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Contact Info</legend>
            <div className="flex items-start gap-4">
              {mode === "resume" && (
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className="h-[110px] w-[110px] rounded-lg border-2 border-dashed border-border bg-background flex items-center justify-center overflow-hidden cursor-pointer hover:border-accent transition-colors"
                    onClick={() => photoRef.current?.click()}>
                    {data.photo ? <img src={data.photo} alt="" className="h-full w-full object-cover" />
                      : <div className="text-center p-2"><div className="text-2xl">📷</div><div className="text-[10px] text-muted mt-1">2×2 Photo</div></div>}
                  </div>
                  <input ref={photoRef} type="file" accept="image/*" hidden onChange={handlePhoto} />
                  {data.photo && <button onClick={() => update("photo", null)} className="text-[10px] text-danger hover:underline">Remove</button>}
                </div>
              )}
              <div className="flex-1 space-y-2">
                <input type="text" placeholder="Full Name" value={data.name} onChange={(e) => update("name", e.target.value)} className={inp} />
                <input type="text" placeholder="Address" value={data.address} onChange={(e) => update("address", e.target.value)} className={inp} />
                <div className="grid gap-2 sm:grid-cols-2">
                  <input type="tel" placeholder="Phone" value={data.phone} onChange={(e) => update("phone", e.target.value)} className={inp} />
                  <input type="email" placeholder="Email" value={data.email} onChange={(e) => update("email", e.target.value)} className={inp} />
                </div>
                <input type="text" placeholder="Website / Portfolio" value={data.website} onChange={(e) => update("website", e.target.value)} className={inp} />
              </div>
            </div>
          </fieldset>

          <fieldset className="rounded-lg border border-border bg-surface p-4">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Personal Statement</legend>
            <textarea placeholder="Brief professional summary…" value={data.personalStatement}
              onChange={(e) => update("personalStatement", e.target.value)} rows={3} className={ta} />
          </fieldset>

          <fieldset className="rounded-lg border border-border bg-surface p-4">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Technical Skills</legend>
            <textarea placeholder={"Front-End: React, Next.JS, TypeScript\nVersion Control: Git, GitHub\nTools: Node.JS, npm, VS Code"}
              value={data.technicalSkills} onChange={(e) => update("technicalSkills", e.target.value)} rows={5} className={ta} />
            <p className="mt-1 text-[10px] text-muted">One category per line. Format: <strong>Category:</strong> Skill1, Skill2</p>
          </fieldset>

          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-4">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Work Experience</legend>
            {data.experience.map((exp, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-border/50 bg-background p-3">
                <div className="flex justify-between"><span className="text-xs text-muted">#{i + 1}</span>
                  <button onClick={() => rmArr("experience", data.experience, i)} className="text-xs text-muted hover:text-danger">✕</button></div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input type="text" placeholder="Job Title" value={exp.title} onChange={(e) => updateArr("experience", data.experience, i, "title", e.target.value)} className={inp} />
                  <input type="text" placeholder="Period" value={exp.period} onChange={(e) => updateArr("experience", data.experience, i, "period", e.target.value)} className={inp} />
                </div>
                <textarea placeholder="Bullet points (one per line)" value={exp.bullets}
                  onChange={(e) => updateArr("experience", data.experience, i, "bullets", e.target.value)} rows={3} className={ta} />
              </div>
            ))}
            <button onClick={() => addArr("experience", data.experience, { title: "", period: "", bullets: "" })}
              className="rounded-lg border border-dashed border-border px-4 py-2 text-sm text-muted hover:border-accent hover:text-accent transition-colors">+ Add Experience</button>
          </fieldset>

          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-4">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Education</legend>
            {data.education.map((edu, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-border/50 bg-background p-3">
                <div className="flex justify-between"><span className="text-xs text-muted">#{i + 1}</span>
                  <button onClick={() => rmArr("education", data.education, i)} className="text-xs text-muted hover:text-danger">✕</button></div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <input type="text" placeholder="Level (Tertiary, K-12)" value={edu.level} onChange={(e) => updateArr("education", data.education, i, "level", e.target.value)} className={inp} />
                  <input type="text" placeholder="Degree / Program" value={edu.degree} onChange={(e) => updateArr("education", data.education, i, "degree", e.target.value)} className={inp} />
                  <input type="text" placeholder="Year" value={edu.year} onChange={(e) => updateArr("education", data.education, i, "year", e.target.value)} className={inp} />
                </div>
                <input type="text" placeholder="School | Location" value={edu.school} onChange={(e) => updateArr("education", data.education, i, "school", e.target.value)} className={inp} />
                <textarea placeholder="Details (one per line, optional)" value={edu.bullets}
                  onChange={(e) => updateArr("education", data.education, i, "bullets", e.target.value)} rows={2} className={ta} />
              </div>
            ))}
            <button onClick={() => addArr("education", data.education, { level: "", degree: "", school: "", year: "", bullets: "" })}
              className="rounded-lg border border-dashed border-border px-4 py-2 text-sm text-muted hover:border-accent hover:text-accent transition-colors">+ Add Education</button>
          </fieldset>

          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-4">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Projects</legend>
            {data.projects.map((proj, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-border/50 bg-background p-3">
                <div className="flex justify-between"><span className="text-xs text-muted">#{i + 1}</span>
                  <button onClick={() => rmArr("projects", data.projects, i)} className="text-xs text-muted hover:text-danger">✕</button></div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <input type="text" placeholder="Project Name" value={proj.name} onChange={(e) => updateArr("projects", data.projects, i, "name", e.target.value)} className={inp} />
                  <input type="text" placeholder="Type (Team / Personal)" value={proj.type} onChange={(e) => updateArr("projects", data.projects, i, "type", e.target.value)} className={inp} />
                  <input type="text" placeholder="Period" value={proj.period} onChange={(e) => updateArr("projects", data.projects, i, "period", e.target.value)} className={inp} />
                </div>
                <textarea placeholder="Description (one per line)" value={proj.description}
                  onChange={(e) => updateArr("projects", data.projects, i, "description", e.target.value)} rows={2} className={ta} />
                <input type="text" placeholder="Tools (Next.JS, Tailwind CSS, TypeScript)" value={proj.tools}
                  onChange={(e) => updateArr("projects", data.projects, i, "tools", e.target.value)} className={inp} />
              </div>
            ))}
            <button onClick={() => addArr("projects", data.projects, { name: "", type: "", period: "", description: "", tools: "" })}
              className="rounded-lg border border-dashed border-border px-4 py-2 text-sm text-muted hover:border-accent hover:text-accent transition-colors">+ Add Project</button>
          </fieldset>

          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Achievements</legend>
            {data.achievements.map((a, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto] items-end">
                <input type="text" placeholder="Achievement" value={a.name} onChange={(e) => updateArr("achievements", data.achievements, i, "name", e.target.value)} className={inp} />
                <input type="text" placeholder="Organization" value={a.org} onChange={(e) => updateArr("achievements", data.achievements, i, "org", e.target.value)} className={inp} />
                <input type="text" placeholder="Year" value={a.year} onChange={(e) => updateArr("achievements", data.achievements, i, "year", e.target.value)} className="h-9 w-20 rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none" />
                <button onClick={() => rmArr("achievements", data.achievements, i)} className="h-9 px-2 text-muted hover:text-danger">✕</button>
              </div>
            ))}
            <button onClick={() => addArr("achievements", data.achievements, { name: "", org: "", year: "" })}
              className="rounded-lg border border-dashed border-border px-4 py-2 text-sm text-muted hover:border-accent hover:text-accent transition-colors">+ Add Achievement</button>
          </fieldset>

          {/* References — Resume only */}
          {mode === "resume" && (
            <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
              <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">References</legend>
              {data.references.map((r, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto_auto] items-end">
                  <input type="text" placeholder="Name" value={r.name} onChange={(e) => updateArr("references", data.references, i, "name", e.target.value)} className={inp} />
                  <input type="text" placeholder="Title" value={r.title} onChange={(e) => updateArr("references", data.references, i, "title", e.target.value)} className={inp} />
                  <input type="text" placeholder="Company" value={r.company} onChange={(e) => updateArr("references", data.references, i, "company", e.target.value)} className={inp} />
                  <input type="tel" placeholder="Phone" value={r.phone} onChange={(e) => updateArr("references", data.references, i, "phone", e.target.value)} className="h-9 w-36 rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none" />
                  <button onClick={() => rmArr("references", data.references, i)} className="h-9 px-2 text-muted hover:text-danger">✕</button>
                </div>
              ))}
              <button onClick={() => addArr("references", data.references, { name: "", title: "", company: "", phone: "" })}
                className="rounded-lg border border-dashed border-border px-4 py-2 text-sm text-muted hover:border-accent hover:text-accent transition-colors">+ Add Reference</button>
            </fieldset>
          )}
        </div>
      ) : (
        /* ═══════════ PREVIEW TAB ═══════════ */
        <div id="resume-preview" className="rounded-lg border border-border overflow-hidden shadow-lg bg-white print:border-0 print:shadow-none">
          <DocPreview data={data} mode={mode} tmpl={tmpl} />
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════ */
/*  Document Preview — template-driven rendering     */
/* ══════════════════════════════════════════════════ */

function DocPreview({ data, mode, tmpl }: { data: ResumeData; mode: "resume" | "cv"; tmpl: DocTemplate }) {
  const showPhoto = mode === "resume";
  const showRef = mode === "resume";
  const isBanner = tmpl.headerBg !== "#fff" && tmpl.headerBg !== "#f8fafc" && tmpl.headerBg !== "#f0f9ff" && tmpl.headerBg !== "#fff7ed" && tmpl.headerBg !== "#fffbeb" && tmpl.headerBg !== "#f1f5f9";
  const skillLines = data.technicalSkills.split("\n").map((l) => l.trim()).filter(Boolean);
  const hasExp = data.experience.some((e) => e.title || e.bullets);
  const hasEdu = data.education.some((e) => e.degree || e.school);
  const hasProj = data.projects.some((p) => p.name);
  const hasAch = data.achievements.some((a) => a.name);
  const hasRef = data.references.some((r) => r.name);

  const font = "'Inter','Segoe UI',system-ui,sans-serif";
  const bodyText = "#1a202c";
  const mutedText = "#4a5568";
  const bulletStyle = { margin: "2px 0 2px 18px", fontSize: "12px", color: "#374151" } as const;
  const rowStyle = { display: "flex", justifyContent: "space-between", alignItems: "baseline" } as const;

  /* Section title style based on template */
  const sectionTitleStyle = (text: string) => {
    const base = { fontSize: "14px", fontWeight: 700 as const, letterSpacing: "1.5px", textTransform: "uppercase" as const, marginTop: "24px", marginBottom: "2px", paddingBottom: "4px" };
    switch (tmpl.sectionStyle) {
      case "filled": return (
        <div style={{ ...base, background: tmpl.primary, color: "#fff", padding: "6px 12px", marginLeft: "-12px", marginRight: "-12px", marginTop: "24px", marginBottom: "8px", fontSize: "12px" }}>{text}</div>
      );
      case "leftbar": return (
        <div style={{ ...base, borderLeft: `4px solid ${tmpl.primary}`, paddingLeft: "10px", color: tmpl.primary }}>{text}</div>
      );
      case "dotted": return (
        <div style={{ ...base, borderBottom: `2px dotted ${tmpl.sectionLine}`, color: tmpl.primary }}>{text}</div>
      );
      case "accent-underline": return (
        <div style={{ ...base, borderBottom: `3px solid ${tmpl.primary}`, color: tmpl.primary }}>{text}</div>
      );
      default: return (
        <div style={{ ...base, borderBottom: `2px solid ${tmpl.sectionLine}`, color: tmpl.primary }}>{text}</div>
      );
    }
  };

  return (
    <div style={{ fontFamily: font, fontSize: "13px", lineHeight: 1.55, color: bodyText, background: "#fff" }}>
      {/* ── Header ── */}
      <div style={{ background: isBanner ? tmpl.headerBg : "#fff", padding: isBanner ? "28px 36px" : "36px 40px 16px", color: isBanner ? tmpl.headerText : bodyText }}>
        <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
          {showPhoto && (
            <div style={{ width: "120px", height: "120px", borderRadius: "6px", overflow: "hidden", flexShrink: 0, border: isBanner ? `3px solid ${tmpl.headerText}44` : "2px solid #e2e8f0" }}>
              {data.photo ? <img src={data.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", background: isBanner ? "#ffffff22" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: "40px", opacity: 0.2 }}>👤</span></div>}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "26px", fontWeight: 700, color: isBanner ? tmpl.headerText : tmpl.primary, letterSpacing: "0.5px", marginBottom: "8px" }}>
              {data.name || "YOUR NAME"}
            </div>
            <div style={{ display: "grid", gap: "3px" }}>
              {data.address && <CRow label="Address:" value={data.address} light={isBanner} />}
              {data.phone && <CRow label="Phone:" value={data.phone} light={isBanner} />}
              {data.email && <CRow label="Email:" value={data.email} light={isBanner} />}
              {data.website && <CRow label="Website:" value={data.website} light={isBanner} />}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "4px 40px 36px" }}>
        {data.personalStatement && (<>{sectionTitleStyle("PERSONAL STATEMENT")}
          <p style={{ fontSize: "12px", color: "#374151", lineHeight: 1.7, textAlign: "justify" as const, marginTop: "8px" }}>{data.personalStatement}</p></>)}

        {skillLines.length > 0 && (<>{sectionTitleStyle("TECHNICAL SKILLS")}
          <div style={{ marginTop: "8px" }}>{skillLines.map((line, i) => {
            const ci = line.indexOf(":");
            if (ci === -1) return <div key={i} style={{ fontSize: "12px", marginBottom: "3px" }}>{line}</div>;
            return <div key={i} style={{ fontSize: "12px", marginBottom: "3px" }}><strong>{line.slice(0, ci + 1)}</strong> {line.slice(ci + 1).trim()}</div>;
          })}</div></>)}

        {hasExp && (<>{sectionTitleStyle("WORK EXPERIENCE")}
          {data.experience.filter((e) => e.title || e.bullets).map((exp, i) => (
            <div key={i} style={{ marginTop: i === 0 ? "10px" : "16px" }}>
              <div style={rowStyle}>
                <div style={{ fontWeight: 700, fontSize: "13px" }}>{exp.title || "[Job Title]"}</div>
                <div style={{ fontSize: "12px", color: mutedText, whiteSpace: "nowrap" as const, marginLeft: "12px" }}>{exp.period}</div>
              </div>
              {exp.bullets && <ul style={{ margin: "4px 0 0", paddingLeft: "20px", listStyleType: "disc" }}>
                {exp.bullets.split("\n").filter(Boolean).map((b, bi) => <li key={bi} style={bulletStyle}>{b.replace(/^[•\-]\s*/, "")}</li>)}
              </ul>}
            </div>
          ))}</>)}

        {hasEdu && (<>{sectionTitleStyle("EDUCATION")}
          {data.education.filter((e) => e.degree || e.school).map((edu, i) => (
            <div key={i} style={{ marginTop: i === 0 ? "10px" : "16px" }}>
              <div style={rowStyle}>
                <div style={{ fontWeight: 700, fontSize: "13px" }}>{edu.level}</div>
                <div style={{ fontSize: "12px", color: mutedText, whiteSpace: "nowrap" as const }}>{edu.year}</div>
              </div>
              {edu.degree && <div style={{ fontWeight: 700, fontSize: "12px", marginTop: "2px" }}>{edu.degree}</div>}
              {edu.school && <div style={{ fontSize: "12px", fontWeight: 700 }}>{edu.school}</div>}
              {edu.bullets && <ul style={{ margin: "4px 0 0", paddingLeft: "20px", listStyleType: "disc" }}>
                {edu.bullets.split("\n").filter(Boolean).map((b, bi) => <li key={bi} style={bulletStyle}>{b.replace(/^[•\-]\s*/, "")}</li>)}
              </ul>}
            </div>
          ))}</>)}

        {hasProj && (<>{sectionTitleStyle("PROJECTS")}
          {data.projects.filter((p) => p.name).map((proj, i) => (
            <div key={i} style={{ marginTop: i === 0 ? "10px" : "16px" }}>
              <div style={rowStyle}>
                <div><strong style={{ fontSize: "13px" }}>{proj.name}</strong>{proj.type && <span style={{ color: mutedText, fontSize: "12px" }}>{" "}| <em>{proj.type}</em></span>}</div>
                <div style={{ fontSize: "12px", color: mutedText, whiteSpace: "nowrap" as const, marginLeft: "12px" }}>{proj.period}</div>
              </div>
              {proj.description && <ul style={{ margin: "4px 0 0", paddingLeft: "20px", listStyleType: "disc" }}>
                {proj.description.split("\n").filter(Boolean).map((b, bi) => <li key={bi} style={bulletStyle}>{b.replace(/^[•\-]\s*/, "")}</li>)}
              </ul>}
              {proj.tools && <><div style={{ fontWeight: 700, fontSize: "12px", marginTop: "4px" }}>Tools App</div>
                <ul style={{ margin: "2px 0 0", paddingLeft: "20px", listStyleType: "disc" }}><li style={bulletStyle}>{proj.tools}</li></ul></>}
            </div>
          ))}</>)}

        {hasAch && (<>{sectionTitleStyle("ACHIEVEMENTS")}
          {data.achievements.filter((a) => a.name).map((a, i) => (
            <div key={i} style={{ marginTop: i === 0 ? "10px" : "12px" }}>
              <div style={rowStyle}>
                <div style={{ fontWeight: 700, fontSize: "13px" }}>{a.name}</div>
                <div style={{ fontSize: "12px", fontWeight: 700, whiteSpace: "nowrap" as const }}>{a.year}</div>
              </div>
              {a.org && <div style={{ fontSize: "12px", color: mutedText }}>{a.org}</div>}
            </div>
          ))}</>)}

        {showRef && hasRef && (<>{sectionTitleStyle("REFERENCES")}
          <div style={{ marginTop: "10px", display: "grid", gap: "16px" }}>
            {data.references.filter((r) => r.name).map((r, i) => (
              <div key={i}>
                <div style={{ fontWeight: 700, fontSize: "13px" }}>{r.name}</div>
                {r.title && <div style={{ fontSize: "12px", color: mutedText }}>{r.title}</div>}
                {r.company && <div style={{ fontSize: "12px", color: mutedText }}>{r.company}</div>}
                {r.phone && <div style={{ fontSize: "12px", color: mutedText }}>{r.phone}</div>}
              </div>
            ))}
          </div></>)}

        {/* Signature */}
        <div style={{ marginTop: "48px", textAlign: "center" as const }}>
          <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1px", marginBottom: "20px" }}>CERTIFIED TRUE AND CORRECT</div>
          <div style={{ width: "200px", margin: "0 auto", borderBottom: `1px solid ${bodyText}`, paddingBottom: "4px", fontSize: "12px", color: mutedText }}>{data.name || "___________________"}</div>
          <div style={{ fontSize: "11px", fontWeight: 700, marginTop: "4px" }}>Signature</div>
        </div>
      </div>
    </div>
  );
}

function CRow({ label, value, light }: { label: string; value: string; light: boolean }) {
  return (
    <div style={{ fontSize: "12px", display: "flex", gap: "8px" }}>
      <span style={{ fontWeight: 700, minWidth: "65px", display: "inline-block", color: light ? "#ffffffcc" : "#1a202c" }}>{label}</span>
      <span style={{ color: light ? "#ffffffdd" : "#374151" }}>{value}</span>
    </div>
  );
}
