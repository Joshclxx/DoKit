"use client";

import { useState, useMemo } from "react";
import { copyToClipboard } from "@/lib/utils/download";

interface LineItem { description: string; quantity: number; unitPrice: number; }
interface Adjustment { label: string; type: "flat" | "percent"; value: number; mode: "add" | "subtract"; }

export default function PricingCalculator() {
  const [items, setItems] = useState<LineItem[]>([{ description: "Item 1", quantity: 1, unitPrice: 0 }]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [taxRate, setTaxRate] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [copied, setCopied] = useState(false);

  const updateItem = (i: number, f: keyof LineItem, v: string | number) =>
    setItems((p) => p.map((it, idx) => idx === i ? { ...it, [f]: v } : it));
  const addItem = () => setItems((p) => [...p, { description: "", quantity: 1, unitPrice: 0 }]);
  const rmItem = (i: number) => setItems((p) => p.filter((_, idx) => idx !== i));

  const updateAdj = (i: number, f: keyof Adjustment, v: string | number) =>
    setAdjustments((p) => p.map((a, idx) => idx === i ? { ...a, [f]: v } : a));
  const addAdj = () => setAdjustments((p) => [...p, { label: "Discount", type: "percent", value: 0, mode: "subtract" }]);
  const rmAdj = (i: number) => setAdjustments((p) => p.filter((_, idx) => idx !== i));

  const { subtotal, tax, grandTotal, breakdown } = useMemo(() => {
    const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
    let running = subtotal;
    const breakdown: { label: string; amount: number }[] = [];
    for (const adj of adjustments) {
      const amt = adj.type === "flat" ? adj.value : (running * adj.value) / 100;
      const signed = adj.mode === "subtract" ? -amt : amt;
      breakdown.push({ label: adj.label || "Adjustment", amount: signed });
      running += signed;
    }
    const adjTotal = running;
    const tax = (adjTotal * taxRate) / 100;
    return { subtotal, adjTotal, tax, grandTotal: adjTotal + tax, breakdown };
  }, [items, adjustments, taxRate]);

  const fmt = (n: number) => `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const inp = "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none";

  return (
    <div className="space-y-6">
      {/* Currency */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-muted">Currency</label>
        <select value={currency} onChange={(e) => setCurrency(e.target.value)}
          className="h-9 rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none">
          {["USD","EUR","GBP","PHP","SGD","JPY","AUD","CAD","INR"].map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Line items */}
      <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
        <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Line Items</legend>
        {items.map((it, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_80px_120px_32px] items-end">
            <input type="text" placeholder="Description" value={it.description} onChange={(e) => updateItem(i, "description", e.target.value)} className={inp} />
            <input type="number" min={1} placeholder="Qty" value={it.quantity} onChange={(e) => updateItem(i, "quantity", Number(e.target.value))} className={inp} />
            <input type="number" step="0.01" placeholder="Price" value={it.unitPrice || ""} onChange={(e) => updateItem(i, "unitPrice", Number(e.target.value))} className={inp} />
            <button onClick={() => rmItem(i)} className="h-9 text-muted hover:text-danger text-sm">✕</button>
          </div>
        ))}
        <button onClick={addItem} className="rounded-lg border border-dashed border-border px-4 py-2 text-sm text-muted hover:border-accent hover:text-accent transition-colors">+ Add Item</button>
      </fieldset>

      {/* Adjustments */}
      <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
        <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Adjustments</legend>
        {adjustments.map((adj, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_100px_100px_100px_32px] items-end">
            <input type="text" placeholder="Label" value={adj.label} onChange={(e) => updateAdj(i, "label", e.target.value)} className={inp} />
            <select value={adj.mode} onChange={(e) => updateAdj(i, "mode", e.target.value)} className={inp}>
              <option value="subtract">Subtract</option><option value="add">Add</option>
            </select>
            <select value={adj.type} onChange={(e) => updateAdj(i, "type", e.target.value)} className={inp}>
              <option value="percent">%</option><option value="flat">Flat</option>
            </select>
            <input type="number" step="0.01" value={adj.value || ""} onChange={(e) => updateAdj(i, "value", Number(e.target.value))} className={inp} />
            <button onClick={() => rmAdj(i)} className="h-9 text-muted hover:text-danger text-sm">✕</button>
          </div>
        ))}
        <button onClick={addAdj} className="rounded-lg border border-dashed border-border px-4 py-2 text-sm text-muted hover:border-accent hover:text-accent transition-colors">+ Add Adjustment</button>
      </fieldset>

      {/* Tax */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-muted">Tax Rate (%)</label>
        <input type="number" step="0.01" value={taxRate || ""} onChange={(e) => setTaxRate(Number(e.target.value))}
          className="h-9 w-28 rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none" />
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-border bg-surface p-5 space-y-2">
        <div className="flex justify-between text-sm"><span className="text-muted">Subtotal</span><span>{fmt(subtotal)}</span></div>
        {breakdown.map((b, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-muted">{b.label}</span>
            <span className={b.amount < 0 ? "text-danger" : "text-success"}>{b.amount < 0 ? "−" : "+"} {fmt(Math.abs(b.amount))}</span>
          </div>
        ))}
        {taxRate > 0 && <div className="flex justify-between text-sm"><span className="text-muted">Tax ({taxRate}%)</span><span>{fmt(tax)}</span></div>}
        <hr className="border-border" />
        <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-accent">{fmt(grandTotal)}</span></div>
      </div>

      <button onClick={async () => { await copyToClipboard(`Total: ${fmt(grandTotal)}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-hover">
        {copied ? "✓ Copied" : "Copy Summary"}
      </button>
    </div>
  );
}
