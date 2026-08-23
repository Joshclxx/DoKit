"use client";

import { useState, useMemo } from "react";
import { copyToClipboard, downloadFile } from "@/lib/utils/download";

type NodeShape = "rect" | "rounded" | "circle" | "diamond" | "database" | "parallelogram";
type DiagramType = "flowchart" | "sequence" | "class" | "er" | "mindmap";

interface DiagramNode { id: string; label: string; shape: NodeShape; }
interface DiagramEdge { from: string; to: string; label: string; style: "solid" | "dashed" | "dotted"; arrow: boolean; }

const shapeMap: Record<NodeShape, [string, string]> = {
  rect: ["[", "]"], rounded: ["(", ")"], circle: ["((", "))"],
  diamond: ["{", "}"], database: ["[(", ")]"], parallelogram: ["[/", "/]"],
};

let nodeCounter = 0;

export default function DiagramBuilder() {
  const [type, setType] = useState<DiagramType>("flowchart");
  const [direction, setDirection] = useState<"TD" | "LR" | "BT" | "RL">("TD");
  const [nodes, setNodes] = useState<DiagramNode[]>([
    { id: "A", label: "Start", shape: "rounded" },
    { id: "B", label: "Process", shape: "rect" },
    { id: "C", label: "Decision", shape: "diamond" },
    { id: "D", label: "End", shape: "rounded" },
  ]);
  const [edges, setEdges] = useState<DiagramEdge[]>([
    { from: "A", to: "B", label: "", style: "solid", arrow: true },
    { from: "B", to: "C", label: "", style: "solid", arrow: true },
    { from: "C", to: "D", label: "Yes", style: "solid", arrow: true },
  ]);
  const [copied, setCopied] = useState(false);

  const addNode = () => {
    const id = String.fromCharCode(65 + nodes.length + nodeCounter++);
    setNodes((p) => [...p, { id, label: "New Node", shape: "rect" }]);
  };
  const updateNode = (i: number, updates: Partial<DiagramNode>) =>
    setNodes((p) => p.map((n, idx) => idx === i ? { ...n, ...updates } : n));
  const removeNode = (i: number) => {
    const id = nodes[i].id;
    setNodes((p) => p.filter((_, idx) => idx !== i));
    setEdges((p) => p.filter((e) => e.from !== id && e.to !== id));
  };

  const addEdge = () => {
    if (nodes.length < 2) return;
    setEdges((p) => [...p, { from: nodes[0].id, to: nodes[1].id, label: "", style: "solid", arrow: true }]);
  };
  const updateEdge = (i: number, updates: Partial<DiagramEdge>) =>
    setEdges((p) => p.map((e, idx) => idx === i ? { ...e, ...updates } : e));
  const removeEdge = (i: number) => setEdges((p) => p.filter((_, idx) => idx !== i));

  const mermaidCode = useMemo(() => {
    if (type === "flowchart") {
      const nodeLines = nodes.map((n) => {
        const [open, close] = shapeMap[n.shape];
        return `    ${n.id}${open}"${n.label}"${close}`;
      });
      const edgeLines = edges.map((e) => {
        const arrow = e.style === "dashed" ? "-.->" : e.style === "dotted" ? "-..->" : "-->";
        const labelPart = e.label ? `|"${e.label}"|` : "";
        return `    ${e.from} ${arrow}${labelPart} ${e.to}`;
      });
      return `flowchart ${direction}\n${nodeLines.join("\n")}\n${edgeLines.join("\n")}`;
    }
    if (type === "sequence") {
      const lines = edges.map((e) => {
        const arrow = e.style === "dashed" ? "-->>" : "->>";
        return `    ${e.from}${arrow}${e.to}: ${e.label || "message"}`;
      });
      return `sequenceDiagram\n${lines.join("\n")}`;
    }
    if (type === "class") {
      const classLines = nodes.map((n) => `    class ${n.label} {\n        +attribute\n        +method()\n    }`);
      const relLines = edges.map((e) => `    ${nodes.find((n) => n.id === e.from)?.label || e.from} ${e.style === "dashed" ? ".." : "--"} ${nodes.find((n) => n.id === e.to)?.label || e.to} : ${e.label || "relates"}`);
      return `classDiagram\n${classLines.join("\n")}\n${relLines.join("\n")}`;
    }
    if (type === "er") {
      const entLines = nodes.map((n) => `    ${n.label} {\n        string id PK\n        string name\n    }`);
      const relLines = edges.map((e) => `    ${nodes.find((n) => n.id === e.from)?.label || e.from} ||--o{ ${nodes.find((n) => n.id === e.to)?.label || e.to} : "${e.label || "has"}"`);
      return `erDiagram\n${entLines.join("\n")}\n${relLines.join("\n")}`;
    }
    if (type === "mindmap") {
      const root = nodes[0]?.label || "Root";
      const children = nodes.slice(1).map((n) => `        ${n.label}`);
      return `mindmap\n    root((${root}))\n${children.join("\n")}`;
    }
    return "";
  }, [type, direction, nodes, edges]);

  const inp = "h-8 w-full rounded border border-border bg-background px-2 text-xs focus:border-accent focus:outline-none";

  return (
    <div className="space-y-5">
      {/* Type & Direction */}
      <div className="flex flex-wrap gap-3">
        <div className="flex rounded-lg border border-border bg-surface p-1">
          {(["flowchart", "sequence", "class", "er", "mindmap"] as DiagramType[]).map((t) => (
            <button key={t} onClick={() => setType(t)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize ${type === t ? "bg-accent text-accent-fg" : "text-muted hover:text-foreground"}`}>
              {t === "er" ? "ER" : t}
            </button>
          ))}
        </div>
        {type === "flowchart" && (
          <select value={direction} onChange={(e) => setDirection(e.target.value as typeof direction)}
            className="h-9 rounded-lg border border-border bg-surface px-3 text-xs focus:border-accent focus:outline-none">
            <option value="TD">Top → Down</option><option value="LR">Left → Right</option>
            <option value="BT">Bottom → Top</option><option value="RL">Right → Left</option>
          </select>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Editor */}
        <div className="space-y-4">
          <fieldset className="rounded-lg border border-border bg-surface p-3 space-y-2">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Nodes ({nodes.length})</legend>
            {nodes.map((n, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-8 text-center text-xs font-bold text-accent">{n.id}</span>
                <input type="text" value={n.label} onChange={(e) => updateNode(i, { label: e.target.value })} className={inp} />
                <select value={n.shape} onChange={(e) => updateNode(i, { shape: e.target.value as NodeShape })}
                  className="h-8 w-28 rounded border border-border bg-background px-1 text-xs">
                  <option value="rect">Rectangle</option><option value="rounded">Rounded</option>
                  <option value="circle">Circle</option><option value="diamond">Diamond</option>
                  <option value="database">Database</option><option value="parallelogram">Parallel</option>
                </select>
                <button onClick={() => removeNode(i)} className="text-xs text-muted hover:text-danger">✕</button>
              </div>
            ))}
            <button onClick={addNode} className="text-xs text-muted hover:text-accent">+ Add Node</button>
          </fieldset>

          <fieldset className="rounded-lg border border-border bg-surface p-3 space-y-2">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Edges ({edges.length})</legend>
            {edges.map((e, i) => (
              <div key={i} className="flex items-center gap-2">
                <select value={e.from} onChange={(ev) => updateEdge(i, { from: ev.target.value })}
                  className="h-8 w-16 rounded border border-border bg-background px-1 text-xs">
                  {nodes.map((n) => <option key={n.id} value={n.id}>{n.id}</option>)}
                </select>
                <span className="text-xs text-muted">→</span>
                <select value={e.to} onChange={(ev) => updateEdge(i, { to: ev.target.value })}
                  className="h-8 w-16 rounded border border-border bg-background px-1 text-xs">
                  {nodes.map((n) => <option key={n.id} value={n.id}>{n.id}</option>)}
                </select>
                <input type="text" placeholder="Label" value={e.label} onChange={(ev) => updateEdge(i, { label: ev.target.value })} className={inp} />
                <select value={e.style} onChange={(ev) => updateEdge(i, { style: ev.target.value as DiagramEdge["style"] })}
                  className="h-8 w-20 rounded border border-border bg-background px-1 text-xs">
                  <option value="solid">Solid</option><option value="dashed">Dashed</option>
                </select>
                <button onClick={() => removeEdge(i)} className="text-xs text-muted hover:text-danger">✕</button>
              </div>
            ))}
            <button onClick={addEdge} className="text-xs text-muted hover:text-accent">+ Add Edge</button>
          </fieldset>
        </div>

        {/* Output */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Mermaid Code</span>
            <div className="flex gap-2">
              <button onClick={async () => { await copyToClipboard(mermaidCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="text-xs text-muted hover:text-foreground">{copied ? "✓" : "📋"}</button>
              <button onClick={() => downloadFile(mermaidCode, "diagram.mmd", "text/plain")}
                className="text-xs text-muted hover:text-foreground">💾</button>
            </div>
          </div>
          <pre className="rounded-lg border border-border bg-surface p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap min-h-[200px]">{mermaidCode}</pre>

          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="text-xs text-muted mb-2">Preview — paste the code above into:</div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Mermaid Live", url: "https://mermaid.live" },
                { label: "GitHub Markdown", url: "#" },
                { label: "Notion", url: "#" },
              ].map((l) => (
                <a key={l.label} href={l.url} target="_blank" rel="noopener"
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-hover">
                  {l.label} ↗
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
