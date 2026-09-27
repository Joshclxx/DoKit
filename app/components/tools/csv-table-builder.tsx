"use client";

import { useState, useCallback } from "react";
import { copyToClipboard, downloadFile } from "@/lib/utils/download";

type Row = string[];

function parseCSV(text: string): { headers: string[]; rows: Row[] } {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length === 0) return { headers: ["Col 1", "Col 2", "Col 3"], rows: [["", "", ""]] };
  const parse = (line: string) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; }
      else { current += ch; }
    }
    result.push(current.trim());
    return result;
  };
  const headers = parse(lines[0]);
  const rows = lines.slice(1).map((l) => {
    const r = parse(l);
    while (r.length < headers.length) r.push("");
    return r.slice(0, headers.length);
  });
  if (rows.length === 0) rows.push(headers.map(() => ""));
  return { headers, rows };
}

function toCSV(headers: string[], rows: Row[]): string {
  const esc = (v: string) => (v.includes(",") || v.includes('"') || v.includes("\n")) ? `"${v.replace(/"/g, '""')}"` : v;
  return [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
}

function toMarkdown(headers: string[], rows: Row[]): string {
  const hdr = `| ${headers.join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((r) => `| ${r.join(" | ")} |`).join("\n");
  return `${hdr}\n${sep}\n${body}`;
}

function toJSON(headers: string[], rows: Row[]): string {
  const data = rows.map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = r[i] ?? ""; });
    return obj;
  });
  return JSON.stringify(data, null, 2);
}

function toHTML(headers: string[], rows: Row[]): string {
  const ths = headers.map((h) => `    <th>${h}</th>`).join("\n");
  const trs = rows.map((r) => `  <tr>\n${r.map((c) => `    <td>${c}</td>`).join("\n")}\n  </tr>`).join("\n");
  return `<table>\n  <thead>\n  <tr>\n${ths}\n  </tr>\n  </thead>\n  <tbody>\n${trs}\n  </tbody>\n</table>`;
}

function toSQL(headers: string[], rows: Row[], table = "my_table"): string {
  const cols = headers.map((h) => `\`${h}\``).join(", ");
  const vals = rows.map((r) => `(${r.map((v) => `'${v.replace(/'/g, "''")}'`).join(", ")})`);
  return `INSERT INTO \`${table}\` (${cols})\nVALUES\n  ${vals.join(",\n  ")};`;
}

type ExportFormat = "csv" | "markdown" | "json" | "html" | "sql";

export default function CSVTableBuilder() {
  const [headers, setHeaders] = useState<string[]>(["Name", "Email", "Role"]);
  const [rows, setRows] = useState<Row[]>([["", "", ""]]);
  const [copied, setCopied] = useState(false);
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  const updateHeader = (col: number, value: string) => {
    setHeaders((h) => h.map((v, i) => (i === col ? value : v)));
  };

  const updateCell = (row: number, col: number, value: string) => {
    setRows((prev) => prev.map((r, ri) => (ri === row ? r.map((c, ci) => (ci === col ? value : c)) : r)));
  };

  const addRow = () => setRows((prev) => [...prev, headers.map(() => "")]);
  const removeRow = (idx: number) => setRows((prev) => prev.filter((_, i) => i !== idx));
  const addCol = () => {
    setHeaders((h) => [...h, `Col ${h.length + 1}`]);
    setRows((prev) => prev.map((r) => [...r, ""]));
  };
  const removeCol = (col: number) => {
    if (headers.length <= 1) return;
    setHeaders((h) => h.filter((_, i) => i !== col));
    setRows((prev) => prev.map((r) => r.filter((_, i) => i !== col)));
  };

  const handleSort = (col: number) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
    setRows((prev) => [...prev].sort((a, b) => {
      const va = a[col] ?? "";
      const vb = b[col] ?? "";
      const cmp = va.localeCompare(vb, undefined, { numeric: true });
      return sortCol === col && !sortAsc ? cmp : (sortAsc ? cmp : -cmp);
    }));
  };

  const handleImport = useCallback((text: string) => {
    const { headers: h, rows: r } = parseCSV(text);
    setHeaders(h);
    setRows(r);
  }, []);

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData("text");
    if (text.includes(",") || text.includes("\t")) {
      e.preventDefault();
      handleImport(text.replace(/\t/g, ","));
    }
  };

  const getExport = (fmt: ExportFormat): string => {
    switch (fmt) {
      case "csv": return toCSV(headers, rows);
      case "markdown": return toMarkdown(headers, rows);
      case "json": return toJSON(headers, rows);
      case "html": return toHTML(headers, rows);
      case "sql": return toSQL(headers, rows);
    }
  };

  const handleExport = (fmt: ExportFormat) => {
    const content = getExport(fmt);
    const exts: Record<ExportFormat, string> = { csv: "csv", markdown: "md", json: "json", html: "html", sql: "sql" };
    const mimes: Record<ExportFormat, string> = { csv: "text/csv", markdown: "text/markdown", json: "application/json", html: "text/html", sql: "text/plain" };
    downloadFile(content, `table.${exts[fmt]}`, mimes[fmt]);
  };

  const handleCopy = async (fmt: ExportFormat) => {
    await copyToClipboard(getExport(fmt));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Import area */}
      <div>
        <label className="mb-2 block text-sm font-medium text-muted">Import CSV</label>
        <textarea
          placeholder="Paste CSV data here (or type comma-separated values)…"
          rows={3}
          onPaste={handlePaste}
          onChange={(e) => { if (e.target.value.includes(",")) handleImport(e.target.value); }}
          className="w-full rounded-lg border border-border bg-surface p-3 font-mono text-sm transition-colors focus:border-accent focus:outline-none resize-y"
        />
      </div>

      {/* Table editor */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-hover">
              <th className="hidden w-10 px-2 py-2 text-xs text-muted sm:table-cell">#</th>
              {headers.map((h, ci) => (
                <th key={ci} className={`min-w-[120px] px-1 py-1 ${ci === 0 ? "sticky left-0 z-20 bg-surface-hover" : ""}`}>
                  <div className="flex items-center gap-1">
                    <input
                      value={h}
                      onChange={(e) => updateHeader(ci, e.target.value)}
                      className="h-8 w-full rounded border-0 bg-transparent px-2 text-sm font-semibold focus:bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                    <button onClick={() => handleSort(ci)} title="Sort"
                      className="shrink-0 rounded p-1 text-xs text-muted hover:text-foreground">
                      {sortCol === ci ? (sortAsc ? "↑" : "↓") : "↕"}
                    </button>
                    <button onClick={() => removeCol(ci)} title="Remove column"
                      className="shrink-0 rounded p-1 text-xs text-muted hover:text-danger">×</button>
                  </div>
                </th>
              ))}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="border-t border-border hover:bg-surface-hover/50 transition-colors">
                <td className="hidden px-2 py-1 text-center text-xs text-muted sm:table-cell">{ri + 1}</td>
                {row.map((cell, ci) => (
                  <td key={ci} className={`px-1 py-1 ${ci === 0 ? "sticky left-0 z-10 bg-surface" : ""}`}>
                    <input
                      value={cell}
                      onChange={(e) => updateCell(ri, ci, e.target.value)}
                      className="h-8 w-full rounded border-0 bg-transparent px-2 text-sm focus:bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </td>
                ))}
                <td className="px-1 py-1">
                  <button onClick={() => removeRow(ri)} title="Remove row"
                    className="rounded p-1 text-xs text-muted hover:text-danger">×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table controls */}
      <div className="flex flex-wrap gap-2">
        <button onClick={addRow}
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-hover">
          + Row
        </button>
        <button onClick={addCol}
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-hover">
          + Column
        </button>
        <span className="ml-auto text-xs text-muted self-center">
          {rows.length} row{rows.length !== 1 ? "s" : ""} × {headers.length} col{headers.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Export */}
      <div className="tool-action-bar rounded-lg border border-border bg-surface p-4">
        <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-muted">Export</label>
        <div className="flex flex-wrap gap-2">
          {(["csv", "markdown", "json", "html", "sql"] as ExportFormat[]).map((fmt) => (
            <div key={fmt} className="flex rounded-lg border border-border overflow-hidden">
              <button onClick={() => handleExport(fmt)}
                className="px-3 py-1.5 text-sm font-medium bg-surface hover:bg-surface-hover transition-colors">
                {fmt.toUpperCase()}
              </button>
              <button onClick={() => handleCopy(fmt)}
                className="border-l border-border px-2 py-1.5 text-xs text-muted hover:text-foreground hover:bg-surface-hover transition-colors">
                {copied ? "✓" : "Copy"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
