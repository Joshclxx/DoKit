"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { copyToClipboard, downloadFile } from "@/lib/utils/download";
import { downloadHtmlPagesAsPdf, waitForPdfPreview } from "@/lib/utils/pdf-download";
import { usePagePreviewScale } from "@/lib/hooks/use-page-preview-scale";
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
  const { containerRef: previewViewportRef, scale: previewScale } = usePagePreviewScale(170, tab === "preview");
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

  const handleExport = async () => {
    if (tab !== "preview") {
      setTab("preview");
      await waitForPdfPreview();
    }
    try {
      const preview = document.querySelector<HTMLElement>("#quote-preview .quote-sheet");
      if (!preview) throw new Error("Quotation preview is unavailable.");
      await downloadHtmlPagesAsPdf([preview], `${data.quoteNumber || "quotation"}.pdf`, { marginsMm: [16, 20, 16, 20] });
    } catch {
      window.alert("The PDF could not be exported. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="tool-action-bar document-action-bar flex items-center justify-between gap-2">
        <div className="flex rounded-lg border border-border bg-surface p-1">
          {(["edit", "preview"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${tab === t ? "bg-accent text-accent-fg" : "text-muted hover:text-foreground"}`}>
              {t === "edit" ? " Edit" : " Preview"}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={async () => { await copyToClipboard(quoteText); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:bg-surface-hover">{copied ? "✓" : "Copy"}</button>
          <button onClick={() => downloadFile(quoteText, `${data.quoteNumber}.txt`)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:bg-surface-hover">Export</button>
          <button onClick={handleExport}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg hover:bg-accent-hover">Export PDF</button>
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
        <div ref={previewViewportRef} id="quote-preview" className="max-w-full overflow-hidden rounded-lg border border-border" style={{ background: "#fff", color: "#222" }}>
          <style>{`
            .quote-sheet{box-sizing:border-box;width:170mm;max-width:none;margin:0 auto;padding:32px;background:#fff;color:#222;font-family:Arial,Helvetica,sans-serif;overflow-wrap:anywhere}
            .quote-header{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;padding-bottom:20px;border-bottom:2px solid #085041}
            .quote-title{margin:0;color:#085041;font-size:30px;letter-spacing:.04em}
            .quote-number{margin-top:6px;color:#666;font-size:14px}
            .quote-dates{text-align:right;color:#555;font-size:14px;line-height:1.7}
            .quote-parties{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin:24px 0}
            .quote-party-label{margin:0 0 8px;color:#085041;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
            .quote-party p{margin:3px 0;font-size:14px}
            .quote-items{width:100%;border-collapse:collapse;margin:28px 0 20px;font-size:13px}
            .quote-items th{padding:10px 8px;background:#085041;color:white;text-align:left}
            .quote-items td{padding:10px 8px;border-bottom:1px solid #ddd;vertical-align:top}
            .quote-items .numeric{text-align:right;white-space:nowrap}
            .quote-totals{width:280px;margin:18px 0 0 auto;font-size:14px}
            .quote-total-row{display:flex;justify-content:space-between;gap:16px;padding:5px 0}
            .quote-grand-total{margin-top:6px;padding-top:10px;border-top:1px solid #085041;color:#085041;font-size:18px;font-weight:700}
            .quote-notes{margin-top:32px;padding-top:16px;border-top:1px solid #ddd;font-size:13px;line-height:1.6}
            .quote-notes-label{margin:0 0 6px;color:#085041;font-weight:700;text-transform:uppercase;font-size:12px;letter-spacing:.08em}
          `}</style>
          <div className="quote-sheet" style={{ zoom: previewScale }}>
            <header className="quote-header">
              <div><h1 className="quote-title">QUOTATION</h1><p className="quote-number">{data.quoteNumber}</p></div>
              <div className="quote-dates"><p>Date: {data.date}</p>{data.validUntil && <p>Valid until: {data.validUntil}</p>}</div>
            </header>
            <section className="quote-parties">
              <div className="quote-party"><h2 className="quote-party-label">From</h2><p><strong>{data.fromName || "[Name]"}</strong></p>{data.fromCompany && <p>{data.fromCompany}</p>}{data.fromEmail && <p>{data.fromEmail}</p>}</div>
              <div className="quote-party"><h2 className="quote-party-label">To</h2><p><strong>{data.toName || "[Name]"}</strong></p>{data.toCompany && <p>{data.toCompany}</p>}{data.toEmail && <p>{data.toEmail}</p>}</div>
            </section>
            <table className="quote-items">
              <thead><tr><th>Description</th><th className="numeric">Qty</th><th className="numeric">Unit Price</th><th className="numeric">Amount</th></tr></thead>
              <tbody>{data.items.map((item, index) => <tr key={index}><td>{item.description || "Item"}</td><td className="numeric">{item.quantity}</td><td className="numeric">{fmt(item.unitPrice)}</td><td className="numeric">{fmt(item.quantity * item.unitPrice)}</td></tr>)}</tbody>
            </table>
            <section className="quote-totals">
              <div className="quote-total-row"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
              {data.taxRate > 0 && <div className="quote-total-row"><span>Tax ({data.taxRate}%)</span><span>{fmt(tax)}</span></div>}
              <div className="quote-total-row quote-grand-total"><strong>Total</strong><strong>{fmt(total)}</strong></div>
            </section>
            {data.notes && <section className="quote-notes"><h2 className="quote-notes-label">Notes</h2><p>{data.notes}</p></section>}
          </div>
        </div>
      )}
    </div>
  );
}
