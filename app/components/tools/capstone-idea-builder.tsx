"use client";

import { useState, useMemo } from "react";
import { copyToClipboard, downloadFile } from "@/lib/utils/download";

const domains = [
  "Healthcare", "Education", "Agriculture", "Finance", "E-Commerce",
  "Transportation", "Environment", "Tourism", "Government", "Manufacturing",
  "Real Estate", "Food & Beverage", "IoT / Smart Systems", "Social Impact", "Entertainment",
];

const methodologies = ["Agile/Scrum", "Waterfall", "RAD", "Spiral", "DevOps/CI-CD"];
const techOptions = ["Web App (React/Next.js)", "Mobile App (React Native)", "Desktop (Electron)", "API/Backend (Node.js)", "Machine Learning (Python)", "IoT/Embedded"];

interface CapstoneData {
  domain: string; customDomain: string;
  problemStatement: string; targetUsers: string;
  objectives: string; features: string;
  methodology: string; techStack: string[];
  timeline: string; teamSize: number;
}

const blank: CapstoneData = {
  domain: "", customDomain: "", problemStatement: "", targetUsers: "",
  objectives: "", features: "", methodology: "Agile/Scrum",
  techStack: [], timeline: "4 months", teamSize: 4,
};

function generateConcept(d: CapstoneData): string {
  const domain = d.customDomain || d.domain || "[Domain]";
  const lines = [
    `# Capstone Project Concept`, "",
    `## Domain: ${domain}`, "",
    `## Problem Statement`, d.problemStatement || "_Define the problem your project solves._", "",
    `## Target Users`, d.targetUsers || "_Who will use this system?_", "",
    `## Objectives`,
    ...(d.objectives ? d.objectives.split("\n").map((o) => `- ${o}`) : ["- _List your objectives_"]), "",
    `## Key Features`,
    ...(d.features ? d.features.split("\n").map((f) => `- ${f}`) : ["- _List key features_"]), "",
    `## Methodology: ${d.methodology}`, "",
    `## Technology Stack`,
    ...(d.techStack.length ? d.techStack.map((t) => `- ${t}`) : ["- _Select technologies_"]), "",
    `## Timeline: ${d.timeline}`,
    `## Team Size: ${d.teamSize} members`, "",
    "---", "",
    "## Suggested Title Ideas",
    `1. "${domain}-Based ${d.features.split("\n")[0] || "System"}: A ${d.methodology} Approach"`,
    `2. "Smart ${domain} Platform for ${d.targetUsers || "End Users"}"`,
    `3. "An Automated ${domain} Solution Using ${d.techStack[0] || "Modern Technology"}"`,
    "",
    "## Scope & Limitations",
    "### In Scope", "- Core features listed above", "- User authentication and basic admin panel",
    "", "### Out of Scope", "- Advanced AI/ML (unless specified)", "- Production deployment at scale",
    "",
    "## Expected Deliverables",
    "1. Working prototype / MVP", "2. Source code repository",
    "3. Documentation (SRS, SDD, User Manual)", "4. Presentation / Defense slides",
  ];
  return lines.join("\n");
}

export default function CapstoneIdeaBuilder() {
  const [data, setData] = useState<CapstoneData>(blank);
  const [copied, setCopied] = useState(false);

  const update = <K extends keyof CapstoneData>(k: K, v: CapstoneData[K]) => setData((p) => ({ ...p, [k]: v }));
  const toggleTech = (t: string) => {
    setData((p) => ({ ...p, techStack: p.techStack.includes(t) ? p.techStack.filter((x) => x !== t) : [...p.techStack, t] }));
  };

  const output = useMemo(() => generateConcept(data), [data]);
  const inp = "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none";

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          {/* Domain */}
          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Domain</legend>
            <div className="flex flex-wrap gap-2">
              {domains.map((d) => (
                <button key={d} onClick={() => update("domain", d)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${data.domain === d ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:text-foreground"}`}>
                  {d}
                </button>
              ))}
            </div>
            <input type="text" placeholder="Or enter custom domain…" value={data.customDomain} onChange={(e) => update("customDomain", e.target.value)} className={inp} />
          </fieldset>

          {/* Problem */}
          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Problem & Users</legend>
            <textarea placeholder="What problem does your project solve?" value={data.problemStatement} onChange={(e) => update("problemStatement", e.target.value)} rows={3}
              className="w-full rounded-lg border border-border bg-background p-3 text-sm focus:border-accent focus:outline-none resize-y" />
            <input type="text" placeholder="Target users (e.g. students, farmers, clinic staff)" value={data.targetUsers} onChange={(e) => update("targetUsers", e.target.value)} className={inp} />
          </fieldset>

          {/* Objectives & Features */}
          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Objectives & Features</legend>
            <textarea placeholder="Objectives (one per line)" value={data.objectives} onChange={(e) => update("objectives", e.target.value)} rows={3}
              className="w-full rounded-lg border border-border bg-background p-3 text-sm focus:border-accent focus:outline-none resize-y" />
            <textarea placeholder="Key features (one per line)" value={data.features} onChange={(e) => update("features", e.target.value)} rows={3}
              className="w-full rounded-lg border border-border bg-background p-3 text-sm focus:border-accent focus:outline-none resize-y" />
          </fieldset>

          {/* Tech & Method */}
          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Technology & Method</legend>
            <div><label className="mb-1 block text-xs text-muted">Methodology</label>
              <select value={data.methodology} onChange={(e) => update("methodology", e.target.value)} className={inp}>
                {methodologies.map((m) => <option key={m}>{m}</option>)}
              </select></div>
            <div><label className="mb-2 block text-xs text-muted">Tech Stack</label>
              <div className="flex flex-wrap gap-2">
                {techOptions.map((t) => (
                  <button key={t} onClick={() => toggleTech(t)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${data.techStack.includes(t) ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:text-foreground"}`}>
                    {t}
                  </button>
                ))}
              </div></div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div><label className="mb-1 block text-xs text-muted">Timeline</label><input type="text" value={data.timeline} onChange={(e) => update("timeline", e.target.value)} className={inp} /></div>
              <div><label className="mb-1 block text-xs text-muted">Team Size</label><input type="number" min={1} max={10} value={data.teamSize} onChange={(e) => update("teamSize", Number(e.target.value))} className={inp} /></div>
            </div>
          </fieldset>
        </div>

        {/* Output */}
        <div className="lg:sticky lg:top-4 self-start">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Generated Concept</span>
            <div className="flex gap-2">
              <button onClick={async () => { await copyToClipboard(output); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="text-xs text-muted hover:text-foreground">{copied ? "✓" : "Copy"}</button>
              <button onClick={() => downloadFile(output, `capstone-${(data.customDomain || data.domain || "concept").toLowerCase().replace(/\s+/g, "-")}.md`, "text/markdown")}
                className="text-xs text-muted hover:text-foreground">Download</button>
            </div>
          </div>
          <pre className="rounded-lg border border-border bg-surface p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-[75vh] overflow-y-auto">{output}</pre>
        </div>
      </div>
    </div>
  );
}
