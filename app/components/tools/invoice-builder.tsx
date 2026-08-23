"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { copyToClipboard } from "@/lib/utils/download";
import { escapeHtml } from "@/lib/utils/html";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import { defaultPreferences, type DoKitPreferences } from "@/lib/preferences";

interface InvItem { description: string; quantity: number; unitPrice: number; }

interface InvoiceData {
  invoiceNumber: string; date: string; dueDate: string; currency: string;
  fromName: string; fromAddress: string; fromEmail: string;
  toName: string; toAddress: string; toEmail: string;
  items: InvItem[]; taxRate: number; discount: number; notes: string; paymentInfo: string;
  template: string;
}

const templates = [
  { id: "clean", label: "Clean", accent: "#085041" },
  { id: "corporate", label: "Corporate", accent: "#0f4c81" },
  { id: "minimal", label: "Minimal", accent: "#333" },
  { id: "bold", label: "Bold", accent: "#e94560" },
  { id: "nature", label: "Nature", accent: "#00b894" },
  { id: "elegant", label: "Elegant", accent: "#6c5ce7" },
];

const blank: InvoiceData = {
  invoiceNumber: `INV-${Date.now().toString(36).toUpperCase()}`, date: new Date().toISOString().split("T")[0],
  dueDate: "", currency: "USD", fromName: "", fromAddress: "", fromEmail: "",
  toName: "", toAddress: "", toEmail: "",
  items: [{ description: "", quantity: 1, unitPrice: 0 }],
  taxRate: 0, discount: 0, notes: "", paymentInfo: "", template: "clean",
};

export default function InvoiceBuilder() {
  const [preferences] = useLocalStorage<DoKitPreferences>("preferences", defaultPreferences);
  const [data, setData, dataStore] = useLocalStorage<InvoiceData>("tool-invoice-builder", blank);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [copied, setCopied] = useState(false);
  const defaultsApplied = useRef(false);

  useEffect(() => {
    if (!dataStore.hydrated || defaultsApplied.current) return;
    defaultsApplied.current = true;
    const profile = preferences.businessProfile;
    const hasSavedDraft = localStorage.getItem("dokit-tool-invoice-builder") !== null;
    setData((current) => ({
      ...current,
      currency: hasSavedDraft ? current.currency : preferences.currency,
      fromName: current.fromName || profile.businessName || profile.name,
      fromAddress: current.fromAddress || profile.address,
      fromEmail: current.fromEmail || profile.email,
    }));
  }, [dataStore.hydrated, preferences, setData]);

  const update = <K extends keyof InvoiceData>(k: K, v: InvoiceData[K]) => setData((p) => ({ ...p, [k]: v }));
  const updateItem = (i: number, f: keyof InvItem, v: string | number) =>
    update("items", data.items.map((it, idx) => idx === i ? { ...it, [f]: v } : it));
  const addItem = () => update("items", [...data.items, { description: "", quantity: 1, unitPrice: 0 }]);
  const rmItem = (i: number) => update("items", data.items.filter((_, idx) => idx !== i));

  const { subtotal, discountAmt, taxAmt, total } = useMemo(() => {
    const subtotal = data.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
    const discountAmt = (subtotal * data.discount) / 100;
    const afterDiscount = subtotal - discountAmt;
    const taxAmt = (afterDiscount * data.taxRate) / 100;
    return { subtotal, discountAmt, taxAmt, total: afterDiscount + taxAmt };
  }, [data.items, data.taxRate, data.discount]);

  const fmt = (n: number) => `${data.currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const tmpl = templates.find((t) => t.id === data.template)!;
  const inp = "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none";

  const handlePrint = () => {
    const el = document.getElementById("invoice-preview");
    if (!el) { setTab("preview"); setTimeout(handlePrint, 100); return; }
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Invoice ${escapeHtml(data.invoiceNumber)}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;padding:40px 60px;color:#222;-webkit-print-color-adjust:exact;print-color-adjust:exact}
@media print{@page{margin:12mm 16mm}body{padding:0}}table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:8px}hr{border:none;border-top:1px solid #eee;margin:8px 0}</style>
</head><body>${el.innerHTML}</body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  return (
    <div className="space-y-6">
      <div className="tool-action-bar flex items-center justify-between flex-wrap gap-2">
        <div className="flex rounded-lg border border-border bg-surface p-1">
          {(["edit", "preview"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${tab === t ? "bg-accent text-accent-fg" : "text-muted hover:text-foreground"}`}>
              {t === "edit" ? "✏️ Edit" : "👁 Preview"}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={async () => { await copyToClipboard(`Invoice ${data.invoiceNumber}: ${fmt(total)}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:bg-surface-hover">{copied ? "✓" : "Copy"}</button>
          <button onClick={handlePrint} className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg hover:bg-accent-hover">🖨 PDF</button>
        </div>
      </div>

      {tab === "edit" ? (
        <div className="space-y-5">
          {/* Template */}
          <div><label className="mb-2 block text-sm font-medium text-muted">Template</label>
            <div className="flex flex-wrap gap-2">
              {templates.map((t) => (
                <button key={t.id} onClick={() => update("template", t.id)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${data.template === t.id ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:text-foreground"}`}>
                  <span className="h-3 w-3 rounded-full" style={{ background: t.accent }} />{t.label}
                </button>
              ))}
            </div>
          </div>
          {/* Invoice info */}
          <div className="grid gap-3 sm:grid-cols-4">
            <div><label className="mb-1 block text-xs text-muted">Invoice #</label><input type="text" value={data.invoiceNumber} onChange={(e) => update("invoiceNumber", e.target.value)} className={inp} /></div>
            <div><label className="mb-1 block text-xs text-muted">Date</label><input type="date" value={data.date} onChange={(e) => update("date", e.target.value)} className={inp} /></div>
            <div><label className="mb-1 block text-xs text-muted">Due Date</label><input type="date" value={data.dueDate} onChange={(e) => update("dueDate", e.target.value)} className={inp} /></div>
            <div><label className="mb-1 block text-xs text-muted">Currency</label>
              <select value={data.currency} onChange={(e) => update("currency", e.target.value)} className={inp}>
                {["USD","EUR","GBP","PHP","SGD","JPY","AUD","CAD","INR"].map((c) => <option key={c}>{c}</option>)}
              </select></div>
          </div>
          {/* Parties */}
          <div className="grid gap-4 sm:grid-cols-2">
            <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-2">
              <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">From</legend>
              <input type="text" placeholder="Name / Company" value={data.fromName} onChange={(e) => update("fromName", e.target.value)} className={inp} />
              <input type="text" placeholder="Address" value={data.fromAddress} onChange={(e) => update("fromAddress", e.target.value)} className={inp} />
              <input type="email" placeholder="Email" value={data.fromEmail} onChange={(e) => update("fromEmail", e.target.value)} className={inp} />
            </fieldset>
            <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-2">
              <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Bill To</legend>
              <input type="text" placeholder="Name / Company" value={data.toName} onChange={(e) => update("toName", e.target.value)} className={inp} />
              <input type="text" placeholder="Address" value={data.toAddress} onChange={(e) => update("toAddress", e.target.value)} className={inp} />
              <input type="email" placeholder="Email" value={data.toEmail} onChange={(e) => update("toEmail", e.target.value)} className={inp} />
            </fieldset>
          </div>
          {/* Items */}
          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Items</legend>
            {data.items.map((it, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_80px_110px_110px_32px] items-end">
                <input type="text" placeholder="Description" value={it.description} onChange={(e) => updateItem(i, "description", e.target.value)} className={inp} />
                <input type="number" min={1} value={it.quantity} onChange={(e) => updateItem(i, "quantity", Number(e.target.value))} className={inp} />
                <input type="number" step="0.01" placeholder="Price" value={it.unitPrice || ""} onChange={(e) => updateItem(i, "unitPrice", Number(e.target.value))} className={inp} />
                <span className="h-9 flex items-center text-sm text-muted">{fmt(it.quantity * it.unitPrice)}</span>
                <button onClick={() => rmItem(i)} className="h-9 text-muted hover:text-danger text-sm">✕</button>
              </div>
            ))}
            <button onClick={addItem} className="rounded-lg border border-dashed border-border px-4 py-2 text-sm text-muted hover:border-accent hover:text-accent transition-colors">+ Add Item</button>
          </fieldset>
          {/* Tax, Discount, Notes */}
          <div className="grid gap-3 sm:grid-cols-4">
            <div><label className="mb-1 block text-xs text-muted">Discount %</label><input type="number" step="0.01" value={data.discount || ""} onChange={(e) => update("discount", Number(e.target.value))} className={inp} /></div>
            <div><label className="mb-1 block text-xs text-muted">Tax %</label><input type="number" step="0.01" value={data.taxRate || ""} onChange={(e) => update("taxRate", Number(e.target.value))} className={inp} /></div>
            <div className="sm:col-span-2"><label className="mb-1 block text-xs text-muted">Payment Info</label><input type="text" placeholder="Bank details, PayPal…" value={data.paymentInfo} onChange={(e) => update("paymentInfo", e.target.value)} className={inp} /></div>
          </div>
          <div><label className="mb-1 block text-xs text-muted">Notes</label>
            <input type="text" placeholder="Thank you for your business!" value={data.notes} onChange={(e) => update("notes", e.target.value)} className={inp} /></div>
          {/* Totals */}
          <div className="rounded-lg border border-border bg-surface p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted">Subtotal</span><span>{fmt(subtotal)}</span></div>
            {data.discount > 0 && <div className="flex justify-between text-sm"><span className="text-muted">Discount ({data.discount}%)</span><span className="text-danger">−{fmt(discountAmt)}</span></div>}
            {data.taxRate > 0 && <div className="flex justify-between text-sm"><span className="text-muted">Tax ({data.taxRate}%)</span><span>{fmt(taxAmt)}</span></div>}
            <hr className="border-border" />
            <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-accent">{fmt(total)}</span></div>
          </div>
        </div>
      ) : (
        /* Preview */
        <div id="invoice-preview" className="rounded-lg border border-border overflow-hidden print:border-0" style={{ background: "#fff" }}>
          <div className="p-8 max-w-3xl mx-auto" style={{ color: "#222" }}>
            <div className="flex justify-between items-start mb-8">
              <div><h1 className="text-2xl font-bold" style={{ color: tmpl.accent }}>INVOICE</h1>
                <p className="text-sm mt-1" style={{ color: "#888" }}>{data.invoiceNumber}</p></div>
              <div className="text-right text-sm" style={{ color: "#666" }}>
                <p>Date: {data.date}</p>{data.dueDate && <p>Due: {data.dueDate}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
              <div><p className="text-xs font-bold uppercase mb-1" style={{ color: tmpl.accent }}>From</p>
                <p className="font-medium">{data.fromName || "—"}</p><p style={{ color: "#666" }}>{data.fromAddress}</p><p style={{ color: "#666" }}>{data.fromEmail}</p></div>
              <div><p className="text-xs font-bold uppercase mb-1" style={{ color: tmpl.accent }}>Bill To</p>
                <p className="font-medium">{data.toName || "—"}</p><p style={{ color: "#666" }}>{data.toAddress}</p><p style={{ color: "#666" }}>{data.toEmail}</p></div>
            </div>
            <table className="w-full text-sm mb-6">
              <thead><tr style={{ borderBottom: `2px solid ${tmpl.accent}` }}>
                <th className="text-left py-2">Description</th><th className="text-right py-2 w-16">Qty</th>
                <th className="text-right py-2 w-28">Price</th><th className="text-right py-2 w-28">Amount</th>
              </tr></thead>
              <tbody>{data.items.map((it, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                  <td className="py-2">{it.description || "—"}</td><td className="text-right py-2">{it.quantity}</td>
                  <td className="text-right py-2">{fmt(it.unitPrice)}</td><td className="text-right py-2 font-medium">{fmt(it.quantity * it.unitPrice)}</td>
                </tr>
              ))}</tbody>
            </table>
            <div className="flex justify-end"><div className="w-64 space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
              {data.discount > 0 && <div className="flex justify-between"><span>Discount</span><span>−{fmt(discountAmt)}</span></div>}
              {data.taxRate > 0 && <div className="flex justify-between"><span>Tax</span><span>{fmt(taxAmt)}</span></div>}
              <hr /><div className="flex justify-between text-lg font-bold" style={{ color: tmpl.accent }}><span>Total</span><span>{fmt(total)}</span></div>
            </div></div>
            {(data.paymentInfo || data.notes) && <div className="mt-8 pt-4 text-xs" style={{ borderTop: "1px solid #eee", color: "#888" }}>
              {data.paymentInfo && <p><strong>Payment:</strong> {data.paymentInfo}</p>}
              {data.notes && <p className="mt-1">{data.notes}</p>}
            </div>}
          </div>
        </div>
      )}
    </div>
  );
}
