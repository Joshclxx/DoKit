"use client";

import { useState, useMemo } from "react";
import { copyToClipboard, downloadFile } from "@/lib/utils/download";

type OutputFormat = "markdown" | "json" | "prompt";

interface SpecData {
  projectName: string; version: string; description: string;
  techStack: string; architecture: string;
  entities: { name: string; fields: string }[];
  endpoints: { method: string; path: string; description: string }[];
  envVars: { key: string; description: string; required: boolean }[];
  rules: string;
  constraints: string;
}

const blank: SpecData = {
  projectName: "", version: "1.0.0", description: "",
  techStack: "", architecture: "",
  entities: [{ name: "", fields: "" }],
  endpoints: [{ method: "GET", path: "", description: "" }],
  envVars: [{ key: "", description: "", required: true }],
  rules: "", constraints: "",
};

function toMarkdown(d: SpecData): string {
  const lines = [
    `# ${d.projectName || "Project"} — System Specification`, `> Version: ${d.version}`, "",
    "## Description", d.description || "_No description_", "",
    "## Tech Stack", d.techStack || "_Not specified_", "",
    "## Architecture", d.architecture || "_Not specified_", "",
    "## Data Entities",
    ...d.entities.filter((e) => e.name).flatMap((e) => [`### ${e.name}`, "```", e.fields || "// fields", "```", ""]),
    "## API Endpoints",
    "| Method | Path | Description |", "|--------|------|-------------|",
    ...d.endpoints.filter((e) => e.path).map((e) => `| ${e.method} | ${e.path} | ${e.description} |`), "",
    "## Environment Variables",
    "| Variable | Description | Required |", "|----------|-------------|----------|",
    ...d.envVars.filter((e) => e.key).map((e) => `| \`${e.key}\` | ${e.description} | ${e.required ? "✅" : "❌"} |`), "",
    ...(d.rules ? ["## Business Rules", d.rules, ""] : []),
    ...(d.constraints ? ["## Constraints", d.constraints, ""] : []),
  ];
  return lines.join("\n");
}

function toJson(d: SpecData): string {
  return JSON.stringify({
    name: d.projectName, version: d.version, description: d.description,
    techStack: d.techStack.split(",").map((s) => s.trim()).filter(Boolean),
    architecture: d.architecture,
    entities: d.entities.filter((e) => e.name).map((e) => ({ name: e.name, fields: e.fields })),
    endpoints: d.endpoints.filter((e) => e.path),
    envVars: d.envVars.filter((e) => e.key),
    rules: d.rules, constraints: d.constraints,
  }, null, 2);
}

function toPrompt(d: SpecData): string {
  const lines = [
    `You are an expert developer building "${d.projectName || "a project"}".`, "",
    `## Project Context`, d.description || "No description provided.", "",
    `## Tech Stack: ${d.techStack || "Not specified"}`,
    `## Architecture: ${d.architecture || "Not specified"}`, "",
    "## Data Model",
    ...d.entities.filter((e) => e.name).map((e) => `- **${e.name}**: ${e.fields}`), "",
    "## API Endpoints",
    ...d.endpoints.filter((e) => e.path).map((e) => `- ${e.method} ${e.path} — ${e.description}`), "",
    "## Environment Variables",
    ...d.envVars.filter((e) => e.key).map((e) => `- \`${e.key}\`: ${e.description}${e.required ? " (required)" : ""}`), "",
    ...(d.rules ? ["## Rules to Follow", d.rules, ""] : []),
    ...(d.constraints ? ["## Constraints", d.constraints, ""] : []),
    "Follow these specifications exactly. Ask clarifying questions before making assumptions.",
  ];
  return lines.join("\n");
}

export default function SystemSpecBuilder() {
  const [data, setData] = useState<SpecData>(blank);
  const [format, setFormat] = useState<OutputFormat>("markdown");
  const [copied, setCopied] = useState(false);

  const update = <K extends keyof SpecData>(k: K, v: SpecData[K]) => setData((p) => ({ ...p, [k]: v }));
  const inp = "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none";

  const output = useMemo(() => {
    if (format === "markdown") return toMarkdown(data);
    if (format === "json") return toJson(data);
    return toPrompt(data);
  }, [data, format]);

  const ext = format === "json" ? ".json" : ".md";

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Project</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <input type="text" placeholder="Project name" value={data.projectName} onChange={(e) => update("projectName", e.target.value)} className={inp} />
              <input type="text" placeholder="Version" value={data.version} onChange={(e) => update("version", e.target.value)} className={inp} />
            </div>
            <textarea placeholder="Project description" value={data.description} onChange={(e) => update("description", e.target.value)} rows={2}
              className="w-full rounded-lg border border-border bg-background p-3 text-sm focus:border-accent focus:outline-none resize-y" />
            <input type="text" placeholder="Tech stack (comma-separated)" value={data.techStack} onChange={(e) => update("techStack", e.target.value)} className={inp} />
            <input type="text" placeholder="Architecture (e.g. Monolith, Microservices, Serverless)" value={data.architecture} onChange={(e) => update("architecture", e.target.value)} className={inp} />
          </fieldset>

          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Entities</legend>
            {data.entities.map((e, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[140px_1fr_32px] items-start">
                <input type="text" placeholder="Entity name" value={e.name} onChange={(ev) => update("entities", data.entities.map((x, idx) => idx === i ? { ...x, name: ev.target.value } : x))} className={inp} />
                <input type="text" placeholder="id, name, email, created_at…" value={e.fields} onChange={(ev) => update("entities", data.entities.map((x, idx) => idx === i ? { ...x, fields: ev.target.value } : x))} className={inp} />
                <button onClick={() => update("entities", data.entities.filter((_, idx) => idx !== i))} className="h-9 text-muted hover:text-danger">✕</button>
              </div>
            ))}
            <button onClick={() => update("entities", [...data.entities, { name: "", fields: "" }])} className="text-xs text-muted hover:text-accent">+ Entity</button>
          </fieldset>

          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Endpoints</legend>
            {data.endpoints.map((e, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[90px_1fr_1fr_32px] items-end">
                <select value={e.method} onChange={(ev) => update("endpoints", data.endpoints.map((x, idx) => idx === i ? { ...x, method: ev.target.value } : x))} className={inp}>
                  {["GET","POST","PUT","PATCH","DELETE"].map((m) => <option key={m}>{m}</option>)}
                </select>
                <input type="text" placeholder="/api/users" value={e.path} onChange={(ev) => update("endpoints", data.endpoints.map((x, idx) => idx === i ? { ...x, path: ev.target.value } : x))} className={inp} />
                <input type="text" placeholder="Description" value={e.description} onChange={(ev) => update("endpoints", data.endpoints.map((x, idx) => idx === i ? { ...x, description: ev.target.value } : x))} className={inp} />
                <button onClick={() => update("endpoints", data.endpoints.filter((_, idx) => idx !== i))} className="h-9 text-muted hover:text-danger">✕</button>
              </div>
            ))}
            <button onClick={() => update("endpoints", [...data.endpoints, { method: "GET", path: "", description: "" }])} className="text-xs text-muted hover:text-accent">+ Endpoint</button>
          </fieldset>

          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Env Variables</legend>
            {data.envVars.map((e, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input type="text" placeholder="VAR_NAME" value={e.key} onChange={(ev) => update("envVars", data.envVars.map((x, idx) => idx === i ? { ...x, key: ev.target.value } : x))} className="h-9 w-36 rounded-lg border border-border bg-background px-3 font-mono text-sm focus:border-accent focus:outline-none" />
                <input type="text" placeholder="Description" value={e.description} onChange={(ev) => update("envVars", data.envVars.map((x, idx) => idx === i ? { ...x, description: ev.target.value } : x))} className={inp} />
                <label className="flex items-center gap-1 text-xs text-muted shrink-0"><input type="checkbox" checked={e.required} onChange={(ev) => update("envVars", data.envVars.map((x, idx) => idx === i ? { ...x, required: ev.target.checked } : x))} className="accent-accent" />Req</label>
                <button onClick={() => update("envVars", data.envVars.filter((_, idx) => idx !== i))} className="text-muted hover:text-danger">✕</button>
              </div>
            ))}
            <button onClick={() => update("envVars", [...data.envVars, { key: "", description: "", required: true }])} className="text-xs text-muted hover:text-accent">+ Variable</button>
          </fieldset>

          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Rules & Constraints</legend>
            <textarea placeholder="Business rules (one per line)" value={data.rules} onChange={(e) => update("rules", e.target.value)} rows={3}
              className="w-full rounded-lg border border-border bg-background p-3 text-sm focus:border-accent focus:outline-none resize-y" />
            <textarea placeholder="Constraints (performance, security…)" value={data.constraints} onChange={(e) => update("constraints", e.target.value)} rows={2}
              className="w-full rounded-lg border border-border bg-background p-3 text-sm focus:border-accent focus:outline-none resize-y" />
          </fieldset>
        </div>

        {/* Output */}
        <div className="lg:sticky lg:top-4 self-start">
          <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex rounded-lg border border-border bg-surface p-1">
              {(["markdown", "json", "prompt"] as OutputFormat[]).map((f) => (
                <button key={f} onClick={() => setFormat(f)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${format === f ? "bg-accent text-accent-fg" : "text-muted hover:text-foreground"}`}>
                  {f === "prompt" ? "AI Prompt" : f.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={async () => { await copyToClipboard(output); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="text-xs text-muted hover:text-foreground">{copied ? "✓ Copied" : "📋 Copy"}</button>
              <button onClick={() => downloadFile(output, `${data.projectName || "spec"}${ext}`)}
                className="text-xs text-muted hover:text-foreground">💾 Export</button>
            </div>
          </div>
          <pre className="rounded-lg border border-border bg-surface p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-[75vh] overflow-y-auto">{output}</pre>
        </div>
      </div>
    </div>
  );
}
