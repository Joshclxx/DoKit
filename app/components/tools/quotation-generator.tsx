"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { copyToClipboard, downloadFile } from "@/lib/utils/download";
import { escapeHtml } from "@/lib/utils/html";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import { defaultPreferences, type DoKitPreferences } from "@/lib/preferences";

interface QItem { description: string; quantity: number; unitPrice: number; }

interface QuoteData {
  quoteNumber: string; date: string; validUntil: string; currency: string;
  fromName: string; fromCompany: string; fromEmail: string;
  toName: string; toCompany: string; toEmail: string;
  items: QItem[]; taxRate: number; notes: string;
}

const defaultData: QuoteData = {
  quoteNumber: `Q-${Date.now().toString(36).toUpperCase()}`, date: new Date().toISOString().split("T")[0],
  validUntil: "", currency: "USD",
  fromName: "", fromCompany: "", fromEmail: "",
  toName: "", toCompany: "", toEmail: "",
  items: [{ description: "", quantity: 1, unitPrice: 0 }],
  taxRate: 0, notes: "",
};

export default function QuotationGenerator() {
  const [preferences] = useLocalStorage<DoKitPreferences>("preferences", defaultPreferences);
  const [data, setData, dataStore] = useLocalStorage<QuoteData>("tool-quotation-generator", defaultData);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [copied, setCopied] = useState(false);
  const defaultsApplied = useRef(false);

  useEffect(() => {
    if (!dataStore.hydrated || defaultsApplied.current) return;
    defaultsApplied.current = true;
    const profile = preferences.businessProfile;
    const hasSavedDraft = localStorage.getItem("dokit-tool-quotation-generator") !== null;
    setData((current) => ({
      ...current,
      currency: hasSavedDraft ? current.currency : preferences.currency,
      fromName: current.fromName || profile.name,
      fromCompany: current.fromCompany || profile.businessName,
      fromEmail: current.fromEmail || profile.email,
    }));
  }, [dataStore.hydrated, preferences, setData]);

  const update = <K extends keyof QuoteData>(k: K, v: QuoteData[K]) => setData((p) => ({ ...p, [k]: v }));
  const updateItem = (i: number, f: keyof QItem, v: string | number) =>
    update("items", data.items.map((it, idx) => idx === i ? { ...it, [f]: v } : it));
  const addItem = () => update("items", [...data.items, { description: "", quantity: 1, unitPrice: 0 }]);
  const rmItem = (i: number) => update("items", data.items.filter((_, idx) => idx !== i));

  const { subtotal, tax, total } = useMemo(() => {
    const subtotal = data.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
    const tax = (subtotal * data.taxRate) / 100;
    return { subtotal, tax, total: subtotal + tax };
  }, [data.items, data.taxRate]);

  const fmt = useCallback(
    (n: number) => `${data.currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    [data.currency]
  );
  const inp = "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none";

  const quoteText = useMemo(() => {
    const lines = [
      `QUOTATION ${data.quoteNumber}`, `Date: ${data.date}${data.validUntil ? ` · Valid until: ${data.validUntil}` : ""}`, "",
      `From: ${data.fromName || "[Name]"}${data.fromCompany ? `, ${data.fromCompany}` : ""}${data.fromEmail ? ` (${data.fromEmail})` : ""}`,
      `To: ${data.toName || "[Name]"}${data.toCompany ? `, ${data.toCompany}` : ""}${data.toEmail ? ` (${data.toEmail})` : ""}`, "",
      "─── ITEMS ───",
      ...data.items.map((it, i) => `${i + 1}. ${it.description || "Item"} × ${it.quantity} @ ${fmt(it.unitPrice)} = ${fmt(it.quantity * it.unitPrice)}`),
      "", `Subtotal: ${fmt(subtotal)}`,
      ...(data.taxRate > 0 ? [`Tax (${data.taxRate}%): ${fmt(tax)}`] : []),
      `TOTAL: ${fmt(total)}`,
      ...(data.notes ? ["", "─── NOTES ───", data.notes] : []),
    ];
    return lines.join("\n");
  }, [data, subtotal, tax, total, fmt]);

  const handlePrint = () => {
    const el = document.getElementById("quote-preview");
    if (!el) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Quotation ${escapeHtml(data.quoteNumber)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Courier New',Courier,monospace;-webkit-print-color-adjust:exact;print-color-adjust:exact;padding:40px 60px;color:#222;white-space:pre-wrap;font-size:14px;line-height:1.7}
@media print{@page{margin:16mm 20mm}body{margin:0;padding:0}}
</style></head><body>${el.innerHTML}</body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  return (
    <div className="space-y-6">
      <div className="tool-action-bar flex items-center justify-between gap-2">
        <div className="flex rounded-lg border border-border bg-surface p-1">
          {(["edit", "preview"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${tab === t ? "bg-accent text-accent-fg" : "text-muted hover:text-foreground"}`}>
              {t === "edit" ? "✏️ Edit" : "👁 Preview"}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={async () => { await copyToClipboard(quoteText); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:bg-surface-hover">{copied ? "✓" : "Copy"}</button>
          <button onClick={() => downloadFile(quoteText, `${data.quoteNumber}.txt`)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:bg-surface-hover">Export</button>
          <button onClick={handlePrint}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg hover:bg-accent-hover">🖨 PDF</button>
        </div>
      </div>

      {tab === "edit" ? (
        <div className="space-y-5">
          {/* Quote info */}
          <div className="grid gap-3 sm:grid-cols-4">
            <div><label className="mb-1 block text-xs text-muted">Quote #</label>
              <input type="text" value={data.quoteNumber} onChange={(e) => update("quoteNumber", e.target.value)} className={inp} /></div>
            <div><label className="mb-1 block text-xs text-muted">Date</label>
              <input type="date" value={data.date} onChange={(e) => update("date", e.target.value)} className={inp} /></div>
            <div><label className="mb-1 block text-xs text-muted">Valid Until</label>
              <input type="date" value={data.validUntil} onChange={(e) => update("validUntil", e.target.value)} className={inp} /></div>
            <div><label className="mb-1 block text-xs text-muted">Currency</label>
              <select value={data.currency} onChange={(e) => update("currency", e.target.value)} className={inp}>
                {["USD","EUR","GBP","PHP","SGD","JPY","AUD","CAD","INR"].map((c) => <option key={c}>{c}</option>)}
              </select></div>
          </div>

          {/* Parties */}
          <div className="grid gap-4 sm:grid-cols-2">
            <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-2">
              <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">From</legend>
              <input type="text" placeholder="Name" value={data.fromName} onChange={(e) => update("fromName", e.target.value)} className={inp} />
              <input type="text" placeholder="Company" value={data.fromCompany} onChange={(e) => update("fromCompany", e.target.value)} className={inp} />
              <input type="email" placeholder="Email" value={data.fromEmail} onChange={(e) => update("fromEmail", e.target.value)} className={inp} />
            </fieldset>
            <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-2">
              <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">To</legend>
              <input type="text" placeholder="Name" value={data.toName} onChange={(e) => update("toName", e.target.value)} className={inp} />
              <input type="text" placeholder="Company" value={data.toCompany} onChange={(e) => update("toCompany", e.target.value)} className={inp} />
              <input type="email" placeholder="Email" value={data.toEmail} onChange={(e) => update("toEmail", e.target.value)} className={inp} />
            </fieldset>
          </div>

          {/* Items */}
          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Items</legend>
            {data.items.map((it, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_80px_120px_120px_32px] items-end">
                <input type="text" placeholder="Description" value={it.description} onChange={(e) => updateItem(i, "description", e.target.value)} className={inp} />
                <input type="number" min={1} placeholder="Qty" value={it.quantity} onChange={(e) => updateItem(i, "quantity", Number(e.target.value))} className={inp} />
                <input type="number" step="0.01" placeholder="Unit Price" value={it.unitPrice || ""} onChange={(e) => updateItem(i, "unitPrice", Number(e.target.value))} className={inp} />
                <span className="h-9 flex items-center text-sm text-muted">{fmt(it.quantity * it.unitPrice)}</span>
                <button onClick={() => rmItem(i)} className="h-9 text-muted hover:text-danger text-sm">✕</button>
              </div>
            ))}
            <button onClick={addItem} className="rounded-lg border border-dashed border-border px-4 py-2 text-sm text-muted hover:border-accent hover:text-accent transition-colors">+ Add Item</button>
          </fieldset>

          {/* Tax & Notes */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="mb-1 block text-xs text-muted">Tax Rate (%)</label>
              <input type="number" step="0.01" value={data.taxRate || ""} onChange={(e) => update("taxRate", Number(e.target.value))} className={inp} /></div>
            <div><label className="mb-1 block text-xs text-muted">Notes</label>
              <input type="text" placeholder="Payment terms, notes…" value={data.notes} onChange={(e) => update("notes", e.target.value)} className={inp} /></div>
          </div>

          {/* Totals */}
          <div className="rounded-lg border border-border bg-surface p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted">Subtotal</span><span>{fmt(subtotal)}</span></div>
            {data.taxRate > 0 && <div className="flex justify-between text-sm"><span className="text-muted">Tax ({data.taxRate}%)</span><span>{fmt(tax)}</span></div>}
            <hr className="border-border" />
            <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-accent">{fmt(total)}</span></div>
          </div>
        </div>
      ) : (
        <div id="quote-preview" className="rounded-lg border border-border bg-surface p-6 sm:p-8 whitespace-pre-wrap font-mono text-sm leading-relaxed">{quoteText}</div>
      )}
    </div>
  );
}
