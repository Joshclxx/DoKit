"use client";

import { useState, useMemo } from "react";
import { copyToClipboard, downloadFile } from "@/lib/utils/download";
import { escapeHtml } from "@/lib/utils/html";

type ContractType = "nda" | "freelance" | "service" | "rental" | "partnership";

interface ContractTemplate {
  type: ContractType;
  label: string;
  icon: string;
  fields: string[];
  body: string;
}

const fieldLabels: Record<string, string> = {
  partyA: "Party A (You / Company)", partyB: "Party B (Other Party)",
  effectiveDate: "Effective Date", endDate: "End Date / Term",
  scope: "Scope of Work", compensation: "Compensation / Payment",
  jurisdiction: "Governing Jurisdiction", confidentialInfo: "Confidential Information Description",
  propertyAddress: "Property Address", monthlyRent: "Monthly Rent",
  securityDeposit: "Security Deposit", partnershipName: "Partnership Name",
  capitalContribution: "Capital Contribution", profitSplit: "Profit Split",
};

const contracts: ContractTemplate[] = [
  {
    type: "nda",
    label: "Non-Disclosure Agreement",
    icon: "🔒",
    fields: ["partyA", "partyB", "effectiveDate", "endDate", "confidentialInfo", "jurisdiction"],
    body: `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into as of {effectiveDate} by and between:

Party A: {partyA} ("Disclosing Party")
Party B: {partyB} ("Receiving Party")

1. DEFINITION OF CONFIDENTIAL INFORMATION
{confidentialInfo}

The term "Confidential Information" includes all data, materials, knowledge, and proprietary information disclosed by the Disclosing Party to the Receiving Party, whether in written, oral, electronic, or other form.

2. OBLIGATIONS OF RECEIVING PARTY
The Receiving Party agrees to:
(a) Hold all Confidential Information in strict confidence;
(b) Not disclose Confidential Information to any third parties without prior written consent;
(c) Use Confidential Information solely for the purpose of evaluating or engaging in business discussions;
(d) Take reasonable measures to protect the secrecy of the Confidential Information.

3. EXCLUSIONS
This Agreement does not apply to information that:
(a) Is or becomes publicly available through no fault of the Receiving Party;
(b) Was known to the Receiving Party prior to disclosure;
(c) Is independently developed by the Receiving Party;
(d) Is required to be disclosed by law or court order.

4. TERM
This Agreement shall remain in effect until {endDate}, unless terminated earlier by mutual written agreement.

5. GOVERNING LAW
This Agreement shall be governed by the laws of {jurisdiction}.

6. SIGNATURES

_________________________          _________________________
{partyA}                           {partyB}
Date: _______________              Date: _______________`,
  },
  {
    type: "freelance",
    label: "Freelance Agreement",
    icon: "💼",
    fields: ["partyA", "partyB", "effectiveDate", "endDate", "scope", "compensation", "jurisdiction"],
    body: `FREELANCE SERVICE AGREEMENT

This Agreement is entered into as of {effectiveDate} by and between:

Client: {partyA} ("Client")
Freelancer: {partyB} ("Freelancer")

1. SCOPE OF WORK
{scope}

The Freelancer agrees to perform the services described above in a professional and timely manner.

2. COMPENSATION
{compensation}

Payment shall be made within 14 days of invoice receipt unless otherwise agreed in writing.

3. TERM
This Agreement begins on {effectiveDate} and ends on {endDate}, unless terminated earlier per Section 7.

4. INTELLECTUAL PROPERTY
All work product created under this Agreement shall become the property of the Client upon full payment.

5. INDEPENDENT CONTRACTOR
The Freelancer is an independent contractor and not an employee. The Freelancer is responsible for their own taxes and benefits.

6. CONFIDENTIALITY
The Freelancer agrees to keep all client information confidential during and after the term of this Agreement.

7. TERMINATION
Either party may terminate this Agreement with 14 days written notice. The Client shall pay for all work completed up to the termination date.

8. GOVERNING LAW
This Agreement shall be governed by the laws of {jurisdiction}.

9. SIGNATURES

_________________________          _________________________
{partyA}                           {partyB}
Date: _______________              Date: _______________`,
  },
  {
    type: "service",
    label: "Service Agreement",
    icon: "📋",
    fields: ["partyA", "partyB", "effectiveDate", "endDate", "scope", "compensation", "jurisdiction"],
    body: `SERVICE AGREEMENT

This Service Agreement ("Agreement") is made on {effectiveDate} between:

Service Provider: {partyA} ("Provider")
Client: {partyB} ("Client")

1. SERVICES
The Provider agrees to provide the following services:
{scope}

2. COMPENSATION AND PAYMENT
{compensation}

Invoices are due within 30 days of receipt. Late payments may incur a 1.5% monthly interest charge.

3. TERM AND RENEWAL
This Agreement is effective from {effectiveDate} to {endDate}. It may be renewed by mutual written agreement.

4. WARRANTIES
The Provider warrants that services will be performed in a professional and workmanlike manner.

5. LIMITATION OF LIABILITY
Neither party shall be liable for indirect, incidental, or consequential damages.

6. TERMINATION
Either party may terminate with 30 days written notice. Outstanding payments remain due upon termination.

7. GOVERNING LAW
This Agreement is governed by the laws of {jurisdiction}.

8. SIGNATURES

_________________________          _________________________
{partyA}                           {partyB}
Date: _______________              Date: _______________`,
  },
  {
    type: "rental",
    label: "Rental Agreement",
    icon: "🏠",
    fields: ["partyA", "partyB", "effectiveDate", "endDate", "propertyAddress", "monthlyRent", "securityDeposit", "jurisdiction"],
    body: `RENTAL / LEASE AGREEMENT

This Lease Agreement is entered into on {effectiveDate} between:

Landlord: {partyA} ("Landlord")
Tenant: {partyB} ("Tenant")

1. PROPERTY
The Landlord agrees to rent the property located at:
{propertyAddress}

2. TERM
The lease begins on {effectiveDate} and ends on {endDate}.

3. RENT
Monthly rent: {monthlyRent}, due on the 1st of each month. Late payments after the 5th will incur a 5% late fee.

4. SECURITY DEPOSIT
A security deposit of {securityDeposit} is due at signing. It will be returned within 30 days of lease termination, minus any deductions for damages.

5. MAINTENANCE
The Tenant shall maintain the property in good condition. The Landlord is responsible for structural repairs and essential systems.

6. TERMINATION
Either party may terminate with 30 days written notice before the end of term. Early termination by Tenant requires forfeiture of security deposit.

7. GOVERNING LAW
This Agreement is governed by the laws of {jurisdiction}.

8. SIGNATURES

_________________________          _________________________
{partyA}                           {partyB}
Date: _______________              Date: _______________`,
  },
  {
    type: "partnership",
    label: "Partnership Agreement",
    icon: "🤝",
    fields: ["partyA", "partyB", "effectiveDate", "partnershipName", "capitalContribution", "profitSplit", "jurisdiction"],
    body: `PARTNERSHIP AGREEMENT

This Partnership Agreement is entered into on {effectiveDate} between:

Partner A: {partyA}
Partner B: {partyB}

1. PARTNERSHIP NAME
The partnership shall operate under the name: {partnershipName}

2. PURPOSE
The partners agree to conduct business together for their mutual benefit.

3. CAPITAL CONTRIBUTIONS
{capitalContribution}

4. PROFIT AND LOSS DISTRIBUTION
{profitSplit}

Profits and losses shall be distributed according to the above arrangement.

5. MANAGEMENT
All partners shall have equal rights in the management and conduct of the partnership business unless otherwise agreed.

6. WITHDRAWAL
A partner may withdraw with 90 days written notice. The withdrawing partner's interest shall be valued and bought out.

7. DISSOLUTION
The partnership may be dissolved by mutual agreement or by operation of law.

8. GOVERNING LAW
This Agreement is governed by the laws of {jurisdiction}.

9. SIGNATURES

_________________________          _________________________
{partyA}                           {partyB}
Date: _______________              Date: _______________`,
  },
];

export default function ContractAgreementBuilder() {
  const [contractType, setContractType] = useState<ContractType>("nda");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [copied, setCopied] = useState(false);

  const contract = contracts.find((c) => c.type === contractType)!;

  const output = useMemo(() => {
    let text = contract.body;
    for (const field of contract.fields) {
      const value = fields[field]?.trim() || `[${fieldLabels[field] || field}]`;
      text = text.replaceAll(`{${field}}`, value);
    }
    return text;
  }, [contract, fields]);

  const handleCopy = async () => {
    await copyToClipboard(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const el = document.getElementById("contract-preview");
    if (!el) { setTab("preview"); setTimeout(handlePrint, 100); return; }
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>${escapeHtml(contract.label)}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;padding:40px 60px;color:#222;font-size:13px;line-height:1.7;white-space:pre-wrap}
@media print{@page{margin:16mm}body{padding:0}}</style>
</head><body>${escapeHtml(el.innerText)}</body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Contract type selector */}
      <div>
        <label className="mb-2 block text-sm font-medium text-muted">Contract Type</label>
        <div className="flex flex-wrap gap-2">
          {contracts.map((c) => (
            <button key={c.type}
              onClick={() => { setContractType(c.type); setFields({}); }}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                contractType === c.type ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface text-muted hover:text-foreground hover:border-border-hover"
              }`}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs + Actions */}
      <div className="flex items-center justify-between">
        <div className="flex rounded-lg border border-border bg-surface p-1">
          {(["edit", "preview"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${tab === t ? "bg-accent text-accent-fg" : "text-muted hover:text-foreground"}`}>
              {t === "edit" ? "✏️ Edit" : "👁 Preview"}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={handleCopy}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:bg-surface-hover">
            {copied ? "✓ Copied" : "Copy"}
          </button>
          <button onClick={() => downloadFile(output, `${contract.type}-agreement.txt`)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:bg-surface-hover">
            Export .txt
          </button>
          <button onClick={handlePrint}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg hover:bg-accent-hover">
            🖨 Print / PDF
          </button>
        </div>
      </div>

      {tab === "edit" ? (
        <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-4">
          <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">
            {contract.icon} {contract.label} — Details
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {contract.fields.map((field) => (
              <div key={field} className={field === "scope" || field === "confidentialInfo" || field === "capitalContribution" || field === "profitSplit" ? "sm:col-span-2" : ""}>
                <label className="mb-1 block text-sm font-medium text-muted">{fieldLabels[field] || field}</label>
                {["scope", "confidentialInfo", "capitalContribution", "profitSplit"].includes(field) ? (
                  <textarea
                    value={fields[field] || ""}
                    onChange={(e) => setFields((f) => ({ ...f, [field]: e.target.value }))}
                    placeholder={`Enter ${(fieldLabels[field] || field).toLowerCase()}…`}
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background p-3 text-sm focus:border-accent focus:outline-none resize-y"
                  />
                ) : field.includes("Date") ? (
                  <input type="date" value={fields[field] || ""}
                    onChange={(e) => setFields((f) => ({ ...f, [field]: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none" />
                ) : (
                  <input type="text" value={fields[field] || ""}
                    onChange={(e) => setFields((f) => ({ ...f, [field]: e.target.value }))}
                    placeholder={`Enter ${(fieldLabels[field] || field).toLowerCase()}…`}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none" />
                )}
              </div>
            ))}
          </div>
        </fieldset>
      ) : (
        <div id="contract-preview" className="rounded-lg border border-border bg-surface p-6 sm:p-8 whitespace-pre-wrap font-mono text-sm leading-relaxed">
          {output}
        </div>
      )}
    </div>
  );
}
