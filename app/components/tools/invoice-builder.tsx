"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { copyToClipboard } from "@/lib/utils/download";
import { downloadHtmlPagesAsPdf, waitForPdfPreview } from "@/lib/utils/pdf-download";
import { usePagePreviewScale } from "@/lib/hooks/use-page-preview-scale";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import { defaultPreferences, type DoKitPreferences } from "@/lib/preferences";

interface InvItem { description: string; quantity: number; unitPrice: number; }

interface InvoiceData {
  invoiceNumber: string; date: string; dueDate: string; currency: string;
  fromName: string; fromAddress: string; fromContact?: string; fromEmail: string; companyLogo?: string;
  toName: string; toAddress: string; toEmail: string;
  items: InvItem[]; taxRate: number; taxTreatment?: "added" | "included" | "none";
  discount: number; notes: string; paymentInfo: string; paymentDetails?: string;
}

const PAYMENT_METHODS = ["Cash", "Card", "E-Wallet", "Credit Card", "Bank Transfer", "Check", "Other"] as const;
const BRAND_ACCENT = "#085041";
const PAPER_SIZES = {
  a4: { label: "A4 · Standard receipt", width: "100%", pageSize: "A4 portrait", pageMargin: "12mm 16mm", printPadding: "0" },
} as const;

const blank: InvoiceData = {
  invoiceNumber: `INV-${Date.now().toString(36).toUpperCase()}`, date: new Date().toISOString().split("T")[0],
  dueDate: "", currency: "USD", fromName: "", fromAddress: "", fromContact: "", fromEmail: "", companyLogo: "",
  toName: "", toAddress: "", toEmail: "",
  items: [{ description: "", quantity: 1, unitPrice: 0 }],
  taxRate: 0, taxTreatment: "none", discount: 0, notes: "", paymentInfo: "", paymentDetails: "",
};

export default function InvoiceBuilder() {
  const [preferences] = useLocalStorage<DoKitPreferences>("preferences", defaultPreferences);
  const [data, setData, dataStore] = useLocalStorage<InvoiceData>("tool-invoice-builder", blank);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const { containerRef: previewViewportRef, scale: previewScale } = usePagePreviewScale(178, tab === "preview");
  const [copied, setCopied] = useState(false);
  const [logoError, setLogoError] = useState("");
  const logoInput = useRef<HTMLInputElement>(null);
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

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLogoError("Choose an image file for the company logo.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setLogoError("Choose an image smaller than 4 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => setLogoError("The selected image could not be read.");
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setLogoError("The selected image could not be read.");
        return;
      }
      const image = new Image();
      image.onerror = () => setLogoError("The selected image could not be loaded.");
      image.onload = () => {
        const scale = Math.min(1, 800 / image.width, 320 / image.height);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          setLogoError("This browser could not process the selected image.");
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const logo = canvas.toDataURL("image/png");
        if (logo.length > 900_000) {
          setLogoError("Choose a simpler or smaller logo image.");
          return;
        }
        update("companyLogo", logo);
        setLogoError("");
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const taxTreatment = data.taxTreatment ?? (data.taxRate > 0 ? "added" : "none");
  const paymentMethod = PAYMENT_METHODS.includes(data.paymentInfo as (typeof PAYMENT_METHODS)[number])
    ? data.paymentInfo
    : data.paymentInfo ? "Other" : "";
  const paymentDetails = data.paymentDetails ?? (
    PAYMENT_METHODS.includes(data.paymentInfo as (typeof PAYMENT_METHODS)[number]) || !data.paymentInfo
      ? ""
      : data.paymentInfo
  );
  const paperSize = "a4";
  const paper = PAPER_SIZES[paperSize];
  const isReceipt = false;
  const taxLabel = taxTreatment === "included" ? `Tax included (${data.taxRate}%)` : `Tax (${data.taxRate}%)`;

  const { subtotal, discountAmt, taxAmt, total } = useMemo(() => {
    const subtotal = data.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
    const discountAmt = (subtotal * data.discount) / 100;
    const afterDiscount = subtotal - discountAmt;
    const taxRate = Math.max(0, data.taxRate);
    const taxAmt = taxTreatment === "none" ? 0
      : taxTreatment === "included"
        ? afterDiscount - afterDiscount / (1 + taxRate / 100)
        : (afterDiscount * taxRate) / 100;
    const total = taxTreatment === "added" ? afterDiscount + taxAmt : afterDiscount;
    return { subtotal, discountAmt, taxAmt, total };
  }, [data.items, data.taxRate, data.discount, taxTreatment]);

  const fmt = (n: number) => `${data.currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtReceipt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const inp = "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none";

  const handleExport = async () => {
    if (tab !== "preview") {
      setTab("preview");
      await waitForPdfPreview();
    }
    try {
      const preview = document.querySelector<HTMLElement>("#invoice-preview .receipt-content");
      if (!preview) throw new Error("Invoice preview is unavailable.");
      await downloadHtmlPagesAsPdf([preview], `${data.invoiceNumber || "receipt"}.pdf`, { marginsMm: [12, 16, 12, 16] });
    } catch {
      window.alert("The PDF could not be exported. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="tool-action-bar document-action-bar flex items-center justify-between flex-wrap gap-2">
        <div className="flex rounded-lg border border-border bg-surface p-1">
          {(["edit", "preview"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${tab === t ? "bg-accent text-accent-fg" : "text-muted hover:text-foreground"}`}>
              {t === "edit" ? " Edit" : " Preview"}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={async () => { await copyToClipboard(`Invoice ${data.invoiceNumber}: ${fmt(total)}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:bg-surface-hover">{copied ? "✓" : "Copy"}</button>
          <button onClick={handleExport} className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg hover:bg-accent-hover">Export PDF</button>
        </div>
      </div>

      {tab === "edit" ? (
        <div className="space-y-5">
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
              <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Company Information</legend>
              <input type="text" placeholder="Company Name" aria-label="Company name" value={data.fromName} onChange={(e) => update("fromName", e.target.value)} className={inp} />
              <input type="text" placeholder="Company Address" aria-label="Company address" value={data.fromAddress} onChange={(e) => update("fromAddress", e.target.value)} className={inp} />
              <input type="tel" placeholder="Phone / Contact" aria-label="Company contact" value={data.fromContact ?? ""} onChange={(e) => update("fromContact", e.target.value)} className={inp} />
              <input type="email" placeholder="Email" aria-label="Company email" value={data.fromEmail} onChange={(e) => update("fromEmail", e.target.value)} className={inp} />
              <label className="block pt-1 text-xs text-muted">Company Logo (optional)
                <input ref={logoInput} type="file" accept="image/*" aria-label="Company logo image" onChange={handleLogoChange} className="max-w-full text-xs text-muted file:mr-3 file:rounded-lg file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-xs file:text-foreground" />
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {data.companyLogo && <button type="button" onClick={() => { update("companyLogo", ""); if (logoInput.current) logoInput.current.value = ""; setLogoError(""); }} className="text-xs text-danger hover:underline">Remove logo</button>}
              </div>
              {logoError && <p role="alert" className="text-xs text-danger">{logoError}</p>}
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
          {/* Tax, payment, paper, and discount options */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div><label className="mb-1 block text-xs text-muted">Discount %</label><input type="number" step="0.01" value={data.discount || ""} onChange={(e) => update("discount", Number(e.target.value))} className={inp} /></div>
            <div><label className="mb-1 block text-xs text-muted">Tax Treatment</label>
              <select value={taxTreatment} onChange={(e) => update("taxTreatment", e.target.value as NonNullable<InvoiceData["taxTreatment"]>)} className={inp}>
                <option value="added">Add tax to price</option>
                <option value="included">Tax included in price</option>
                <option value="none">No tax</option>
              </select>
            </div>
            {taxTreatment !== "none" && <div><label className="mb-1 block text-xs text-muted">Tax %</label><input type="number" min="0" step="0.01" value={data.taxRate || ""} onChange={(e) => update("taxRate", Number(e.target.value))} className={inp} /></div>}
            <div><label className="mb-1 block text-xs text-muted">Payment Info</label>
              <select value={paymentMethod} onChange={(e) => {
                const method = e.target.value;
                update("paymentInfo", method);
                if (method !== "Other") update("paymentDetails", "");
              }} className={inp}>
                <option value="">Select payment method</option>
                {PAYMENT_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
              </select>
            </div>
          </div>
          {paymentMethod === "Other" && <div><label className="mb-1 block text-xs text-muted">Payment Details</label><input type="text" placeholder="Add payment details" value={paymentDetails} onChange={(e) => update("paymentDetails", e.target.value)} className={inp} /></div>}
          <div><label className="mb-1 block text-xs text-muted">Notes</label>
            <input type="text" placeholder="Thank you for your business!" value={data.notes} onChange={(e) => update("notes", e.target.value)} className={inp} /></div>
          {/* Totals */}
          <div className="rounded-lg border border-border bg-surface p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted">Subtotal</span><span>{fmt(subtotal)}</span></div>
            {data.discount > 0 && <div className="flex justify-between text-sm"><span className="text-muted">Discount ({data.discount}%)</span><span className="text-danger">−{fmt(discountAmt)}</span></div>}
            {taxTreatment !== "none" && data.taxRate > 0 && <div className="flex justify-between text-sm"><span className="text-muted">{taxLabel}</span><span>{fmt(taxAmt)}</span></div>}
            <hr className="border-border" />
            <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-accent">{fmt(total)}</span></div>
          </div>
        </div>
      ) : (
        /* Preview */
        <div ref={previewViewportRef} id="invoice-preview" className="mx-auto max-w-full overflow-hidden rounded-lg border border-border print:border-0" style={{ background: "#fff", width: paper.width }}>
          <style>{`
            .receipt-content{box-sizing:border-box;width:178mm;max-width:none;font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#222;padding:32px;margin:0 auto;overflow-wrap:anywhere}
            .receipt-logo{display:block;object-fit:contain}
            .receipt-title{color:${BRAND_ACCENT};font-size:${isReceipt ? "20px" : "40px"};font-weight:700;line-height:1.15;margin:8px 0}
            .thermal-header{text-align:center}
            .thermal-header .receipt-logo{margin:0 auto 8px}
            .thermal-meta{display:flex;justify-content:space-between;gap:8px;border-top:1px solid #888;border-bottom:1px solid #888;padding:10px 0;margin:16px 0}
            .receipt-parties{display:grid;grid-template-columns:${isReceipt ? "1fr" : "1fr 1fr"};gap:${isReceipt ? "16px" : "32px"};margin:24px 0 36px}
            .receipt-parties section{min-width:0}
            .receipt-metadata{display:grid;grid-template-columns:max-content 1fr;align-content:start;gap:8px 16px}
            .receipt-table{border-collapse:collapse;width:100%;margin-bottom:24px}
            .receipt-table th,.receipt-table td{text-align:left;padding:${isReceipt ? "5px 3px" : "10px 8px"};vertical-align:top}
            .receipt-table th:not(:first-child),.receipt-table td:not(:first-child){text-align:right}
            .receipt-table tbody tr{border-bottom:1px solid #ddd}
            .thermal-items{border-top:1px solid #888;border-bottom:1px solid #888;padding:10px 0}
            .thermal-item{display:flex;justify-content:space-between;gap:8px;padding:6px 0}
            .thermal-item span{overflow-wrap:anywhere}
            .receipt-totals{border-top:1px solid #888;padding-top:10px;margin:20px 0 28px}
            .receipt-totals>div{display:flex;justify-content:space-between;gap:12px;padding:5px 0}
            .receipt-totals .grand-total{font-weight:700;border-top:1px solid #888;padding-top:8px;margin-top:4px}
            .receipt-footer{border-top:1px solid #888;padding-top:12px;text-align:center;margin-top:24px}
            .receipt-standard-header{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;margin-bottom:32px}
            .receipt-standard-header .receipt-logo{max-width:180px;max-height:90px}
            .generic-bottom{display:grid;grid-template-columns:1fr minmax(240px,320px);gap:24px;border-top:1px solid #888;padding-top:12px;margin-top:32px}
            .generic-bottom .receipt-totals{border:0;padding:0;margin:0}
            .signature-row{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:100px}
            .signature-line{border-top:1px solid #888;padding-top:6px;text-align:center}
            .signature-hint{display:inline;margin-left:8px;color:#777;font-size:12px;font-style:italic;font-weight:400;opacity:.6}
            .receipt-muted{color:#666}
          `}</style>
          <div className={`receipt-content mx-auto ${isReceipt ? "text-xs" : ""}`} style={{ color: "#222", zoom: previewScale }}>
            {isReceipt ? (
              <>
                <header className="thermal-header">
                  {data.companyLogo && <img src={data.companyLogo} alt={`${data.fromName || "Company"} logo`} className="receipt-logo mx-auto" />}
                  <h1 className="receipt-title">{data.fromName || "RECEIPT"}</h1>
                  {data.fromAddress && <p>{data.fromAddress}</p>}
                  {data.fromContact && <p>{data.fromContact}</p>}
                  {data.fromEmail && <p>{data.fromEmail}</p>}
                </header>
                <div className="thermal-meta"><span>Receipt #: {data.invoiceNumber}</span><span>{data.date}</span></div>
                {(data.toName || data.toAddress || data.toEmail) && <section className="mb-3"><strong>Customer:</strong> {data.toName}{data.toAddress && <p>{data.toAddress}</p>}{data.toEmail && <p>{data.toEmail}</p>}</section>}
                <div className="thermal-items">
                  {data.items.map((it, i) => <div key={i} className="thermal-item"><span>{it.description || "Item"} × {it.quantity}</span><strong>{data.currency} {fmtReceipt(it.quantity * it.unitPrice)}</strong></div>)}
                </div>
                <div className="receipt-totals">
                  <div><span>Subtotal</span><span>{data.currency} {fmtReceipt(subtotal)}</span></div>
                  {data.discount > 0 && <div><span>Discount ({data.discount}%)</span><span>−{data.currency} {fmtReceipt(discountAmt)}</span></div>}
                  {taxTreatment !== "none" && data.taxRate > 0 && <div><span>{taxLabel}</span><span>{data.currency} {fmtReceipt(taxAmt)}</span></div>}
                  <div className="grand-total"><span>TOTAL</span><span>{data.currency} {fmtReceipt(total)}</span></div>
                </div>
                {(paymentMethod || paymentDetails) && <p><strong>Payment Method:</strong> {paymentMethod}{paymentDetails ? ` · ${paymentDetails}` : ""}</p>}
                {data.notes && <p className="mt-2">{data.notes}</p>}
                {!data.notes && <footer className="receipt-footer">Thank you!</footer>}
              </>
            ) : (
              <>
                <header className="receipt-standard-header">
                  <h1 className="receipt-title">Receipt</h1>
                  {data.companyLogo && <img src={data.companyLogo} alt={`${data.fromName || "Company"} logo`} className="receipt-logo" />}
                </header>
                <div className="receipt-parties text-sm">
                  <section><h2 className="font-bold uppercase mb-2" style={{ color: BRAND_ACCENT }}>Seller</h2>
                    <p className="font-medium">{data.fromName || "—"}</p>{data.fromAddress && <p className="receipt-muted">{data.fromAddress}</p>}{data.fromContact && <p className="receipt-muted">{data.fromContact}</p>}{data.fromEmail && <p className="receipt-muted">{data.fromEmail}</p>}</section>
                  <section className="receipt-metadata">
                    <strong>Receipt Number</strong><span>{data.invoiceNumber}</span>
                    <strong>Receipt Date</strong><span>{data.date}</span>
                    {data.dueDate && <><strong>Due Date</strong><span>{data.dueDate}</span></>}
                    {paymentMethod && <><strong>Payment Method</strong><span>{paymentMethod}{paymentDetails ? ` · ${paymentDetails}` : ""}</span></>}
                  </section>
                </div>
                <section className="mb-8 text-sm"><h2 className="font-bold uppercase mb-2" style={{ color: BRAND_ACCENT }}>Customer</h2>
                  <p className="font-medium">{data.toName || "—"}</p>{data.toAddress && <p className="receipt-muted">{data.toAddress}</p>}{data.toEmail && <p className="receipt-muted">{data.toEmail}</p>}</section>
                <table className="receipt-table text-sm">
                  <thead><tr style={{ background: "#26827d", color: "white" }}><th>Description</th><th className="text-right">Quantity</th><th className="text-right">Unit Price</th><th className="text-right">Subtotal</th><th className="text-right">Tax</th></tr></thead>
                  <tbody>{data.items.map((it, i) => {
                    const lineSubtotal = it.quantity * it.unitPrice;
                    const lineTax = subtotal > 0 ? taxAmt * lineSubtotal / subtotal : 0;
                    return <tr key={i} style={{ borderBottom: "1px solid #ddd" }}><td>{it.description || "—"}</td><td className="text-right">{it.quantity}</td><td className="text-right">{fmt(it.unitPrice)}</td><td className="text-right">{fmt(lineSubtotal)}</td><td className="text-right">{fmt(lineTax)}</td></tr>;
                  })}</tbody>
                </table>
                <div className="generic-bottom text-sm">
                  <div>{data.notes && <p>{data.notes}</p>}</div>
                  <div className="receipt-totals mt-0">
                    <div><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                    {data.discount > 0 && <div><span>Discount</span><span>−{fmt(discountAmt)}</span></div>}
                    {taxTreatment !== "none" && data.taxRate > 0 && <div><span>{taxLabel}</span><span>{fmt(taxAmt)}</span></div>}
                    <div className="grand-total"><strong>Total</strong><strong>{fmt(total)}</strong></div>
                  </div>
                </div>
                <div className="signature-row text-sm">
                  <div className="signature-line">Salesperson<span className="signature-hint">Signature over printed name</span></div>
                  <div className="signature-line">Customer<span className="signature-hint">Signature over printed name</span></div>
                </div>
                {!data.notes && <footer className="receipt-footer">Thank you for your payment!</footer>}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
