"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { copyToClipboard, downloadFile } from "@/lib/utils/download";
import { downloadHtmlPagesAsPdf, waitForPdfPreview } from "@/lib/utils/pdf-download";
import { usePagePreviewScale } from "@/lib/hooks/use-page-preview-scale";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import { defaultPreferences, type DoKitPreferences } from "@/lib/preferences";

interface Milestone {
  name: string;
  duration: string;
  deliverable: string;
}

interface LineItem {
  description: string;
  amount: string;
}

interface ProposalData {
  clientName: string;
  clientCompany: string;
  yourName: string;
  yourTitle: string;
  yourCompany: string;
  projectTitle: string;
  date: string;
  validUntil: string;
  overview: string;
  scope: string;
  milestones: Milestone[];
  lineItems: LineItem[];
  currency: string;
  paymentTerms: string;
  nextSteps: string;
}

const defaultData: ProposalData = {
  clientName: "",
  clientCompany: "",
  yourName: "",
  yourTitle: "",
  yourCompany: "",
  projectTitle: "",
  date: new Date().toISOString().split("T")[0],
  validUntil: "",
  overview: "",
  scope: "",
  milestones: [{ name: "Discovery & Planning", duration: "1 week", deliverable: "Project plan document" }],
  lineItems: [{ description: "Project fee", amount: "" }],
  currency: "USD",
  paymentTerms: "50% upfront, 50% on completion",
  nextSteps: "",
};

const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "PHP", "SGD", "JPY", "INR"];

export default function ProposalGenerator() {
  const [preferences] = useLocalStorage<DoKitPreferences>("preferences", defaultPreferences);
  const [data, setData, dataStore] = useLocalStorage<ProposalData>("tool-proposal-generator", defaultData);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const { containerRef: previewViewportRef, scale: previewScale } = usePagePreviewScale(170, activeTab === "preview");
  const [copied, setCopied] = useState(false);
  const defaultsApplied = useRef(false);

  useEffect(() => {
    if (!dataStore.hydrated || defaultsApplied.current) return;
    defaultsApplied.current = true;
    const profile = preferences.businessProfile;
    const hasSavedDraft = localStorage.getItem("dokit-tool-proposal-generator") !== null;
    setData((current) => ({
      ...current,
      currency: hasSavedDraft ? current.currency : preferences.currency,
      yourName: current.yourName || profile.name,
      yourCompany: current.yourCompany || profile.businessName,
    }));
  }, [dataStore.hydrated, preferences, setData]);

  const update = <K extends keyof ProposalData>(key: K, value: ProposalData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const updateMilestone = (i: number, field: keyof Milestone, value: string) => {
    setData((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)),
    }));
  };

  const addMilestone = () => {
    setData((prev) => ({ ...prev, milestones: [...prev.milestones, { name: "", duration: "", deliverable: "" }] }));
  };

  const removeMilestone = (i: number) => {
    setData((prev) => ({ ...prev, milestones: prev.milestones.filter((_, idx) => idx !== i) }));
  };

  const updateLineItem = (i: number, field: keyof LineItem, value: string) => {
    setData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((li, idx) => (idx === i ? { ...li, [field]: value } : li)),
    }));
  };

  const addLineItem = () => {
    setData((prev) => ({ ...prev, lineItems: [...prev.lineItems, { description: "", amount: "" }] }));
  };

  const removeLineItem = (i: number) => {
    setData((prev) => ({ ...prev, lineItems: prev.lineItems.filter((_, idx) => idx !== i) }));
  };

  const total = useMemo(() => {
    return data.lineItems.reduce((sum, li) => sum + (parseFloat(li.amount) || 0), 0);
  }, [data.lineItems]);

  const proposalText = useMemo(() => {
    const lines = [
      `PROPOSAL: ${data.projectTitle || "[Project Title]"}`,
      `Date: ${data.date}${data.validUntil ? ` · Valid until: ${data.validUntil}` : ""}`,
      "",
      `Prepared for: ${data.clientName || "[Client]"}${data.clientCompany ? `, ${data.clientCompany}` : ""}`,
      `Prepared by: ${data.yourName || "[Your Name]"}${data.yourTitle ? `, ${data.yourTitle}` : ""}${data.yourCompany ? ` at ${data.yourCompany}` : ""}`,
      "",
      "─── OVERVIEW ───",
      data.overview || "[Project overview]",
      "",
      "─── SCOPE OF WORK ───",
      data.scope || "[Scope details]",
      "",
      "─── TIMELINE ───",
      ...data.milestones.map((m, i) => `${i + 1}. ${m.name || "Milestone"} — ${m.duration || "TBD"}\n   Deliverable: ${m.deliverable || "TBD"}`),
      "",
      "─── PRICING ───",
      ...data.lineItems.map((li) => `• ${li.description || "Item"}: ${data.currency} ${li.amount || "0"}`),
      `TOTAL: ${data.currency} ${total.toLocaleString()}`,
      "",
      "─── PAYMENT TERMS ───",
      data.paymentTerms || "[Payment terms]",
      "",
      "─── NEXT STEPS ───",
      data.nextSteps || "[Next steps]",
    ];
    return lines.join("\n");
  }, [data, total]);

  const handleCopy = async () => {
    await copyToClipboard(proposalText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = async () => {
    if (activeTab !== "preview") {
      setActiveTab("preview");
      await waitForPdfPreview();
    }
    try {
      const preview = document.querySelector<HTMLElement>("#proposal-preview .proposal-sheet");
      if (!preview) throw new Error("Proposal preview is unavailable.");
      await downloadHtmlPagesAsPdf([preview], "proposal.pdf", { marginsMm: [16, 20, 16, 20], removeBlankTrailingPages: true });
    } catch {
      window.alert("The PDF could not be exported. Please try again.");
    }
  };

  const tabs = ["edit", "preview"] as const;

  return (
    <div className="space-y-6">
      {/* Tabs + actions */}
      <div className="tool-action-bar document-action-bar flex items-center justify-between gap-2">
        <div className="flex rounded-lg border border-border bg-surface p-1">
          {tabs.map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === t ? "bg-accent text-accent-fg" : "text-muted hover:text-foreground"}`}>
              {t === "edit" ? " Edit" : " Preview"}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={handleCopy}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium transition-colors hover:bg-surface-hover">
            {copied ? "✓ Copied" : "Copy"}
          </button>
          <button onClick={() => downloadFile(proposalText, `proposal-${data.projectTitle || "draft"}.txt`)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium transition-colors hover:bg-surface-hover">
            Export .txt
          </button>
          <button onClick={handleExport}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover">
            Export PDF
          </button>
        </div>
      </div>

      {activeTab === "edit" ? (
        <div className="space-y-6">
          {/* Parties */}
          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-4">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Parties</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <div className="text-xs font-medium text-muted mb-1">Client</div>
                <input type="text" placeholder="Client name" value={data.clientName} onChange={(e) => update("clientName", e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none" />
                <input type="text" placeholder="Client company" value={data.clientCompany} onChange={(e) => update("clientCompany", e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none" />
              </div>
              <div className="space-y-3">
                <div className="text-xs font-medium text-muted mb-1">You</div>
                <input type="text" placeholder="Your name" value={data.yourName} onChange={(e) => update("yourName", e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none" />
                <input type="text" placeholder="Title" value={data.yourTitle} onChange={(e) => update("yourTitle", e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none" />
                <input type="text" placeholder="Company" value={data.yourCompany} onChange={(e) => update("yourCompany", e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none" />
              </div>
            </div>
          </fieldset>

          {/* Project info */}
          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Project</legend>
            <input type="text" placeholder="Project title" value={data.projectTitle} onChange={(e) => update("projectTitle", e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="mb-1 block text-xs text-muted">Date</label>
                <input type="date" value={data.date} onChange={(e) => update("date", e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none" /></div>
              <div><label className="mb-1 block text-xs text-muted">Valid until</label>
                <input type="date" value={data.validUntil} onChange={(e) => update("validUntil", e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none" /></div>
            </div>
            <textarea placeholder="Project overview — what is this project about?" value={data.overview} onChange={(e) => update("overview", e.target.value)}
              rows={3} className="w-full rounded-lg border border-border bg-background p-3 text-sm focus:border-accent focus:outline-none resize-y" />
            <textarea placeholder="Scope of work — what will be delivered?" value={data.scope} onChange={(e) => update("scope", e.target.value)}
              rows={3} className="w-full rounded-lg border border-border bg-background p-3 text-sm focus:border-accent focus:outline-none resize-y" />
          </fieldset>

          {/* Milestones */}
          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Timeline & Milestones</legend>
            {data.milestones.map((m, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto] items-end">
                <input type="text" placeholder="Milestone name" value={m.name} onChange={(e) => updateMilestone(i, "name", e.target.value)}
                  className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none" />
                <input type="text" placeholder="Duration" value={m.duration} onChange={(e) => updateMilestone(i, "duration", e.target.value)}
                  className="h-9 w-28 rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none" />
                <input type="text" placeholder="Deliverable" value={m.deliverable} onChange={(e) => updateMilestone(i, "deliverable", e.target.value)}
                  className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none" />
                <button onClick={() => removeMilestone(i)} className="h-9 px-2 text-muted hover:text-danger">✕</button>
              </div>
            ))}
            <button onClick={addMilestone}
              className="rounded-lg border border-dashed border-border px-4 py-2 text-sm text-muted hover:border-accent hover:text-accent transition-colors">
              + Add Milestone
            </button>
          </fieldset>

          {/* Pricing */}
          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Pricing</legend>
            <select value={data.currency} onChange={(e) => update("currency", e.target.value)}
              className="h-9 w-28 rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none">
              {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {data.lineItems.map((li, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_auto_auto] items-end">
                <input type="text" placeholder="Description" value={li.description} onChange={(e) => updateLineItem(i, "description", e.target.value)}
                  className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none" />
                <input type="number" placeholder="Amount" value={li.amount} onChange={(e) => updateLineItem(i, "amount", e.target.value)}
                  className="h-9 w-32 rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none" />
                <button onClick={() => removeLineItem(i)} className="h-9 px-2 text-muted hover:text-danger">✕</button>
              </div>
            ))}
            <div className="flex items-center justify-between">
              <button onClick={addLineItem}
                className="rounded-lg border border-dashed border-border px-4 py-2 text-sm text-muted hover:border-accent hover:text-accent transition-colors">
                + Add Line Item
              </button>
              <span className="text-lg font-bold">{data.currency} {total.toLocaleString()}</span>
            </div>
          </fieldset>

          {/* Terms & Next steps */}
          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Terms & Next Steps</legend>
            <input type="text" placeholder="Payment terms (e.g. 50% upfront, 50% on completion)" value={data.paymentTerms} onChange={(e) => update("paymentTerms", e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none" />
            <textarea placeholder="Next steps — what should the client do?" value={data.nextSteps} onChange={(e) => update("nextSteps", e.target.value)}
              rows={3} className="w-full rounded-lg border border-border bg-background p-3 text-sm focus:border-accent focus:outline-none resize-y" />
          </fieldset>
        </div>
      ) : (
        /* Preview */
        <div ref={previewViewportRef} id="proposal-preview" className="max-w-full overflow-hidden rounded-lg border border-border" style={{ background: "#fff", color: "#222" }}>
          <style>{`
            .proposal-sheet{box-sizing:border-box;width:170mm;max-width:none;margin:0 auto;padding:40px;background:#fff;color:#222;font-family:Arial,Helvetica,sans-serif;line-height:1.6;overflow-wrap:anywhere}
            .proposal-header{padding-bottom:20px;border-bottom:2px solid #085041}
            .proposal-kicker{margin:0 0 8px;color:#085041;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}
            .proposal-title{margin:0;color:#172b27;font-size:28px;line-height:1.25}
            .proposal-dates{margin-top:10px;color:#666;font-size:13px}
            .proposal-parties{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:24px 0}
            .proposal-party{padding:16px;border:1px solid #d9e4e1;border-radius:8px;background:#f8fbfa}
            .proposal-label,.proposal-section-title{margin:0 0 8px;color:#085041;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
            .proposal-party p{margin:3px 0;font-size:14px}
            .proposal-section{margin:24px 0}
            .proposal-section-title{padding-bottom:7px;border-bottom:1px solid #d9e4e1}
            .proposal-copy{margin:0;white-space:pre-wrap;font-size:14px;line-height:1.7}
            .proposal-milestone{display:grid;grid-template-columns:1fr auto;gap:4px 16px;padding:12px 0;border-bottom:1px solid #e5eae8;font-size:14px}
            .proposal-deliverable{grid-column:1/-1;color:#666;font-size:13px}
            .proposal-pricing{width:100%;border-collapse:collapse;font-size:14px}
            .proposal-pricing td{padding:9px 4px;border-bottom:1px solid #e5eae8}
            .proposal-pricing td:last-child{text-align:right;white-space:nowrap}
            .proposal-total{display:flex;justify-content:space-between;margin-top:8px;padding-top:12px;border-top:2px solid #085041;color:#085041;font-size:18px;font-weight:700}
          `}</style>
          <article className="proposal-sheet" style={{ zoom: previewScale }}>
            <header className="proposal-header">
              <p className="proposal-kicker">Project Proposal</p>
              <h1 className="proposal-title">{data.projectTitle || "Project Title"}</h1>
              <p className="proposal-dates">Proposal date: {data.date}{data.validUntil && ` · Valid until: ${data.validUntil}`}</p>
            </header>
            <section className="proposal-parties">
              <div className="proposal-party"><h2 className="proposal-label">Prepared for</h2><p><strong>{data.clientName || "[Client]"}</strong></p>{data.clientCompany && <p>{data.clientCompany}</p>}</div>
              <div className="proposal-party"><h2 className="proposal-label">Prepared by</h2><p><strong>{data.yourName || "[Your Name]"}</strong></p>{data.yourTitle && <p>{data.yourTitle}</p>}{data.yourCompany && <p>{data.yourCompany}</p>}</div>
            </section>
            <section className="proposal-section"><h2 className="proposal-section-title">Overview</h2><p className="proposal-copy">{data.overview || "[Project overview]"}</p></section>
            <section className="proposal-section"><h2 className="proposal-section-title">Scope of Work</h2><p className="proposal-copy">{data.scope || "[Scope details]"}</p></section>
            <section className="proposal-section"><h2 className="proposal-section-title">Timeline & Milestones</h2>
              {data.milestones.map((milestone, index) => <div className="proposal-milestone" key={index}><strong>{index + 1}. {milestone.name || "Milestone"}</strong><span>{milestone.duration || "TBD"}</span><span className="proposal-deliverable">Deliverable: {milestone.deliverable || "TBD"}</span></div>)}
            </section>
            <section className="proposal-section"><h2 className="proposal-section-title">Pricing</h2>
              <table className="proposal-pricing"><tbody>{data.lineItems.map((item, index) => <tr key={index}><td>{item.description || "Item"}</td><td>{data.currency} {item.amount || "0"}</td></tr>)}</tbody></table>
              <div className="proposal-total"><span>Total</span><span>{data.currency} {total.toLocaleString()}</span></div>
            </section>
            <section className="proposal-section"><h2 className="proposal-section-title">Payment Terms</h2><p className="proposal-copy">{data.paymentTerms || "[Payment terms]"}</p></section>
            <section className="proposal-section"><h2 className="proposal-section-title">Next Steps</h2><p className="proposal-copy">{data.nextSteps || "[Next steps]"}</p></section>
          </article>
        </div>
      )}
    </div>
  );
}
