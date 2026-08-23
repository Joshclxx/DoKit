"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { copyToClipboard, downloadFile } from "@/lib/utils/download";
import { escapeHtml } from "@/lib/utils/html";
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

  const handlePrint = () => {
    const el = document.getElementById("proposal-preview");
    if (!el) { setActiveTab("preview"); setTimeout(handlePrint, 100); return; }
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Proposal - ${escapeHtml(data.projectTitle || "Draft")}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;padding:40px 60px;color:#222;font-size:13px;line-height:1.7;white-space:pre-wrap}
@media print{@page{margin:16mm}body{padding:0}}</style>
</head><body>${escapeHtml(el.innerText)}</body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  const tabs = ["edit", "preview"] as const;

  return (
    <div className="space-y-6">
      {/* Tabs + actions */}
      <div className="tool-action-bar flex items-center justify-between gap-2">
        <div className="flex rounded-lg border border-border bg-surface p-1">
          {tabs.map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === t ? "bg-accent text-accent-fg" : "text-muted hover:text-foreground"}`}>
              {t === "edit" ? "✏️ Edit" : "👁 Preview"}
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
          <button onClick={handlePrint}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover">
            🖨 Print / PDF
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
        <div id="proposal-preview" className="prose-dokit rounded-lg border border-border bg-surface p-6 sm:p-8 whitespace-pre-wrap font-mono text-sm leading-relaxed">
          {proposalText}
        </div>
      )}
    </div>
  );
}
