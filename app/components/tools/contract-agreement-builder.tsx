"use client";

import { useState, useMemo, useLayoutEffect, useRef } from "react";
import { copyToClipboard, downloadFile } from "@/lib/utils/download";
import { downloadHtmlPagesAsPdf, waitForPdfPreview } from "@/lib/utils/pdf-download";
import { usePagePreviewScale } from "@/lib/hooks/use-page-preview-scale";
import { contractCategories, expandedContracts, expandedFieldLabels, expandedMultilineFields } from "./contract-agreement-templates";
import type { ContractCategory, ContractTemplate, ContractType } from "./contract-agreement-templates";

const fieldLabels: Record<string, string> = {
  agreementNumber: "Agreement Number", confidentialityStatus: "Confidentiality Status",
  partyA: "Party A Full Legal Name", partyB: "Party B Full Legal Name",
  partyACompany: "Party A Company / Business Name", partyBCompany: "Party B Company / Business Name",
  partyAAddress: "Party A Address", partyARole: "Party A Role / Capacity",
  partyBAddress: "Party B Address", partyBRole: "Party B Role / Capacity",
  partyAEmail: "Party A Email", partyAContact: "Party A Contact Number",
  partyBEmail: "Party B Email", partyBContact: "Party B Contact Number",
  purpose: "Purpose / Background", notices: "Notices Delivery Method",
  witnessName: "Witness Name",
  effectiveDate: "Effective Date", endDate: "End Date / Term",
  scope: "Scope of Work", compensation: "Fees / Compensation", paymentTerms: "Payment Terms",
  jurisdiction: "Governing Jurisdiction", confidentialInfo: "Confidential Information Description",
  obligations: "Confidentiality Obligations", exclusions: "Confidential Information Exclusions",
  responsibilities: "Party Responsibilities",
  propertyAddress: "Property Address", monthlyRent: "Monthly Rent",
  securityDeposit: "Security Deposit", partnershipName: "Partnership Name",
  capitalContribution: "Capital Contribution", profitSplit: "Profit Split",
  termRenewal: "Term and Renewal Clause", warranties: "Warranties Clause",
  liability: "Limitation of Liability Clause", termination: "Termination Clause",
  maintenance: "Maintenance / Repairs",
  permittedDisclosure: "Permitted Disclosure", confidentialityTerm: "Confidentiality Period",
  expenses: "Expenses Policy", effectOfTermination: "Effect of Termination",
  advanceRent: "Advance Rent", rentDueDay: "Rent Due Day", propertyUnit: "Unit / Room",
  propertyType: "Property Type", floorArea: "Floor Area", parking: "Parking Details",
  fixtures: "Included Fixtures", utilities: "Utilities and Responsible Parties",
  depositTerms: "Deposit Holding, Deductions, and Return",
  alterations: "Alterations", sublease: "Sublease and Assignment", inspection: "Inspection",
  surrender: "Surrender of Property", inventory: "Property Inventory / Annex",
  startDate: "Start Date", completionDate: "Expected Completion", projectFee: "Total Project Fee",
  revisionsCount: "Included Revision Rounds", terminationNotice: "Termination Notice Period",
  paymentDays: "Payment Due (Days)", billingFrequency: "Billing Frequency",
  forceMajeure: "Force Majeure", warrantiesText: "Warranties",
  serviceProviderResponsibilities: "Service Provider Responsibilities",
  freelancerResponsibilities: "Freelancer Responsibilities",
  partnerAResponsibilities: "Partner A Responsibilities", partnerBResponsibilities: "Partner B Responsibilities",
  capitalTable: "Capital Contributions", ownership: "Ownership Interest",
  distribution: "Profit and Loss Distribution", management: "Management Structure",
  decisions: "Decision-Making Rules", bankAccounts: "Bank Accounts and Signatories",
  additionalContributions: "Additional Contributions", admission: "Admission of New Partners",
  deathIncapacity: "Death or Incapacity", liquidation: "Liquidation",
  notarialText: "Notarial Acknowledgment",
  deliverables: "Deliverables", fees: "Fees", timeline: "Timeline / Schedule",
  clientResponsibilities: "Client Responsibilities", revisions: "Revisions",
  confidentiality: "Confidentiality", ipOwnership: "Intellectual Property Ownership",
  disputeResolution: "Dispute Resolution", returnDestruction: "Return / Destruction of Information",
  remedies: "Remedies", permittedUse: "Permitted Use",
  intellectualProperty: "Intellectual Property",
  restrictions: "Restrictions", default: "Default", returnProperty: "Return of Property",
  duties: "Partner Duties", accounting: "Accounting", principalOffice: "Principal Office",
  partnerC: "Partner C Full Legal Name", partnerCCompany: "Partner C Company / Business Name",
  partnerCAddress: "Partner C Address", partnerCEmail: "Partner C Email",
  partnerCContact: "Partner C Contact Number", partnerCRole: "Partner C Role / Capacity",
  withdrawal: "Withdrawal / Death",
  dissolution: "Dissolution",
  ...expandedFieldLabels,
};

const notarialAcknowledgmentTemplate = `ACKNOWLEDGMENT

REPUBLIC OF THE PHILIPPINES )
CITY/MUNICIPALITY OF _______ ) S.S.

BEFORE ME, a Notary Public for and in the City/Municipality of
____________________, this ____ day of ____________, 20____,
personally appeared:

Name: ______________________________
Government ID: _____________________
ID No.: _____________________________

Name: ______________________________
Government ID: _____________________
ID No.: _____________________________

who acknowledged that they executed this instrument as their free and voluntary act and deed.

This instrument consists of ____ pages, including this page.

WITNESS MY HAND AND SEAL on the date and place above written.

________________________________
NOTARY PUBLIC

Doc. No. ______; Page No. ______; Book No. ______; Series of 20____.`;

const commonPartyFields = ["agreementNumber", "partyA", "partyACompany", "partyAAddress", "partyAEmail", "partyAContact", "partyARole", "partyB", "partyBCompany", "partyBAddress", "partyBEmail", "partyBContact", "partyBRole", "effectiveDate", "purpose", "confidentialityStatus"];
const multilineFields = [
  "purpose", "scope", "confidentialInfo", "obligations", "exclusions", "returnDestruction", "remedies", "permittedDisclosure",
  "deliverables", "paymentTerms", "timeline", "clientResponsibilities", "ipOwnership", "confidentiality",
  "revisions", "termination", "liability", "responsibilities", "termRenewal", "warranties", "disputeResolution",
  "utilities", "permittedUse", "maintenance", "restrictions", "default", "returnProperty", "capitalContribution",
  "profitSplit", "management", "duties", "decisionMaking", "decisions", "accounting", "newPartners", "withdrawal", "dissolution", "principalOffice",
  "expenses", "effectOfTermination", "alterations", "sublease", "inspection", "surrender", "inventory",
  "notices", "warrantiesText", "serviceProviderResponsibilities", "freelancerResponsibilities", "partnerAResponsibilities", "partnerBResponsibilities",
  "capitalTable", "ownership", "distribution", "bankAccounts", "additionalContributions", "admission", "deathIncapacity", "liquidation", "notarialText",
];
const defaultContractFields = (contract: ContractTemplate): Record<string, string> => {
  return {
    agreementNumber: `${contract.prefix}-${new Date().getFullYear()}-001`,
    partyARole: contract.partyARole,
    partyBRole: contract.partyBRole,
    jurisdiction: "Republic of the Philippines",
    confidentialityStatus: contract.type === "nda" ? "CONFIDENTIAL" : "",
    ...(contract.defaults ?? {}),
  };
};

const sharedIdentityFields = [
  "effectiveDate", "partyA", "partyACompany", "partyAAddress", "partyAEmail", "partyAContact",
  "partyB", "partyBCompany", "partyBAddress", "partyBEmail", "partyBContact",
];

function labelForField(contract: ContractTemplate, field: string): string {
  if (field === "partyA") return `${contract.partyARole} Full Legal Name`;
  if (field === "partyB") return `${contract.partyBRole} Full Legal Name`;
  if (field.startsWith("partyA")) return `${contract.partyARole} ${fieldLabels[field]?.replace(/^Party A /, "") ?? field}`;
  if (field.startsWith("partyB")) return `${contract.partyBRole} ${fieldLabels[field]?.replace(/^Party B /, "") ?? field}`;
  return fieldLabels[field] || field;
}

const contracts: ContractTemplate[] = [
  {
    type: "nda",
    label: "Non-Disclosure Agreement",
    category: "Legal & Intellectual Property", prefix: "NDA",
    partyARole: "Disclosing Party", partyBRole: "Receiving Party", signatureLabels: ["Disclosing Party", "Receiving Party"],
    witnessEnabled: true, notarization: "optional",
    icon: "",
  fields: [...commonPartyFields, "confidentialInfo", "obligations", "exclusions", "permittedDisclosure", "returnDestruction", "confidentialityTerm", "intellectualProperty", "remedies", "disputeResolution", "jurisdiction", "notices", "witnessName"],
    body: `NON-DISCLOSURE AGREEMENT

This Agreement is entered into on {effectiveDate}, by and between:

Party A: {partyA}
Address: {partyAAddress}
Role: {partyARole}

and

Party B: {partyB}
Address: {partyBAddress}
Role: {partyBRole}

WHEREAS, {purpose};

NOW, THEREFORE, the parties agree as follows:

1. PURPOSE
The parties enter into this Agreement for the following purpose: {purpose}.

2. CONFIDENTIAL INFORMATION
{confidentialInfo}

3. OBLIGATIONS
{obligations}

4. EXCLUSIONS
{exclusions}

5. PERMITTED DISCLOSURE
{permittedDisclosure}

6. RETURN OR DESTRUCTION
{returnDestruction}

7. TERM
This Agreement shall become effective on {effectiveDate}. The confidentiality obligations shall remain effective for {confidentialityTerm} following termination or completion of the relationship.

8. INTELLECTUAL PROPERTY
{intellectualProperty}

9. REMEDIES
{remedies}

10. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with the laws of {jurisdiction}.

11. DISPUTE RESOLUTION
{disputeResolution}

12. GENERAL PROVISIONS
Entire Agreement: This Agreement constitutes the entire agreement between the parties concerning its subject matter.

Amendments: Any amendment must be made in writing and signed by the parties.

Severability: If any provision is found invalid or unenforceable, the remaining provisions shall remain effective to the extent permitted by law.

Notices: {notices}

13. SIGNATURES
IN WITNESS WHEREOF, the parties have executed this Agreement on the date and at the place first above written.

_________________________          _________________________
{partyA}                           {partyB}
Date: _______________              Date: _______________

WITNESS: {witnessName}
Signature: ____________________    Date: ____________________`,
    defaults: {
      jurisdiction: "Republic of the Philippines",
      confidentialInfo: "Business plans and strategies; customer and client information; source code and software; database structures; API keys, passwords, and credentials; designs and prototypes; financial and pricing information; marketing strategies; unreleased products and features; internal documents and communications; and other non-public information disclosed in connection with the project.",
      obligations: "The Receiving Party shall keep the Confidential Information strictly confidential; use it only for the agreed purpose; not disclose it to unauthorized third parties; take reasonable measures to prevent unauthorized access; and not reproduce or distribute confidential materials except as necessary for the agreed purpose.",
      exclusions: "Information is not Confidential Information if it is publicly available without breach of this Agreement; was lawfully known before disclosure; is independently developed without using Confidential Information; or is lawfully obtained from a third party without a confidentiality obligation.",
      permittedDisclosure: "The Receiving Party may disclose Confidential Information when required by law, regulation, or valid court order, provided legally permitted notice is given to the Disclosing Party.",
      returnDestruction: "Upon request or termination of the relationship, the Receiving Party shall return or destroy Confidential Information, subject to applicable legal retention requirements.",
      confidentialityTerm: "5 years",
      intellectualProperty: "Nothing in this Agreement transfers ownership of intellectual property unless expressly stated in a separate written agreement.",
      remedies: "The Parties acknowledge that unauthorized disclosure may cause harm. The Disclosing Party may seek remedies available under applicable law.",
      disputeResolution: "The Parties shall first attempt good-faith discussion. If unresolved, they may pursue remedies available under applicable Philippine law.",
    },
  },
  {
    type: "freelance",
    label: "Freelance Agreement",
    category: "Work & Employment", prefix: "FA",
    partyARole: "Client", partyBRole: "Freelancer", signatureLabels: ["Client", "Freelancer"],
    witnessEnabled: true, notarization: "optional",
    icon: "",
    fields: [...commonPartyFields, "startDate", "completionDate", "scope", "deliverables", "timeline", "projectFee", "paymentTerms", "revisionsCount", "revisions", "clientResponsibilities", "freelancerResponsibilities", "ipOwnership", "confidentiality", "expenses", "terminationNotice", "effectOfTermination", "jurisdiction", "disputeResolution", "notices", "witnessName"],
    body: `FREELANCE SERVICE AGREEMENT

This Agreement is entered into on {effectiveDate}, by and between:

Party A: {partyA}
Address: {partyAAddress}
Role: {partyARole}

and

Party B: {partyB}
Address: {partyBAddress}
Role: {partyBRole}

WHEREAS, {purpose};

NOW, THEREFORE, the parties agree as follows:

1. ENGAGEMENT
The Client engages the Freelancer to provide the services described in this Agreement.

2. SCOPE OF SERVICES
{scope}

3. DELIVERABLES
{deliverables}

4. PROJECT TIMELINE
Start Date: {startDate}
Expected Completion: {completionDate}
{timeline}

5. FEES AND PAYMENT
Total Project Fee: PHP {projectFee}
Payment Schedule: {paymentTerms}

6. CLIENT RESPONSIBILITIES
{clientResponsibilities}

7. FREELANCER RESPONSIBILITIES
{freelancerResponsibilities}

8. INTELLECTUAL PROPERTY
{ipOwnership}

9. CONFIDENTIALITY
{confidentiality}

10. REVISIONS
The project includes {revisionsCount} rounds of revisions. {revisions}

11. INDEPENDENT CONTRACTOR STATUS
The Freelancer is engaged as an independent contractor and is not an employee, partner, or agent of the Client unless otherwise expressly agreed in writing.

12. EXPENSES
{expenses}

13. TERMINATION
Either Party may terminate this Agreement subject to {terminationNotice} days' written notice, unless otherwise provided by this Agreement or applicable law.

14. EFFECT OF TERMINATION
{effectOfTermination}

15. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with the laws of {jurisdiction}.

16. DISPUTE RESOLUTION
{disputeResolution}

17. GENERAL PROVISIONS
Entire Agreement: This Agreement constitutes the entire agreement between the parties concerning its subject matter.

Amendments: Any amendment must be made in writing and signed by the parties.

Severability: If any provision is found invalid or unenforceable, the remaining provisions shall remain effective to the extent permitted by law.

Notices: {notices}

18. SIGNATURES
IN WITNESS WHEREOF, the parties have executed this Agreement on the date and at the place first above written.

_________________________          _________________________
{partyA}                           {partyB}
Date: _______________              Date: _______________

WITNESS: {witnessName}
Signature: ____________________    Date: ____________________`,
    defaults: {
      jurisdiction: "Republic of the Philippines",
      timeline: "Any changes to the timeline shall be communicated between the Parties.",
      paymentTerms: "Initial Payment: PHP [Amount] due [Date]; Milestone Payment: PHP [Amount] due [Date]; Final Payment: PHP [Amount] due [Date].",
      clientResponsibilities: "The Client shall provide information, materials, approvals, access, and other resources reasonably required for completion of the services.",
      freelancerResponsibilities: "The Freelancer shall perform the services professionally and within the agreed scope and timeline.",
      ipOwnership: "Ownership of project deliverables shall be governed by the terms specified in this Agreement. Pre-existing materials, reusable tools, libraries, frameworks, templates, and know-how belonging to the Freelancer shall remain the Freelancer's property unless expressly transferred in writing.",
      confidentiality: "Both Parties shall protect confidential information received in connection with the project.",
      revisionsCount: "[Number]",
      revisions: "Additional revisions or changes outside the agreed scope may be subject to additional fees.",
      expenses: "Project-related expenses: [Describe expense policy].",
      terminationNotice: "[Number]",
      effectOfTermination: "Upon termination, the Client shall pay for completed work and approved expenses incurred up to the effective termination date, subject to the terms of this Agreement.",
      disputeResolution: "The Parties shall first attempt to resolve disputes through good-faith discussion before pursuing available legal remedies.",
    },
  },
  {
    type: "service",
    label: "Service Agreement",
    category: "Business", prefix: "SA",
    partyARole: "Client", partyBRole: "Service Provider", signatureLabels: ["Client", "Service Provider"],
    witnessEnabled: true, notarization: "optional",
    icon: "",
    fields: [...commonPartyFields, "startDate", "endDate", "scope", "deliverables", "timeline", "compensation", "billingFrequency", "paymentDays", "paymentTerms", "clientResponsibilities", "serviceProviderResponsibilities", "termRenewal", "warranties", "confidentiality", "ipOwnership", "forceMajeure", "liability", "termination", "disputeResolution", "jurisdiction", "notices", "witnessName"],
    body: `SERVICE AGREEMENT

This Agreement is entered into on {effectiveDate}, by and between:

Party A: {partyA}
Address: {partyAAddress}
Role: {partyARole}

and

Party B: {partyB}
Address: {partyBAddress}
Role: {partyBRole}

WHEREAS, {purpose};

NOW, THEREFORE, the parties agree as follows:

1. DESCRIPTION OF SERVICES AND SCOPE
{scope}

2. DELIVERABLES
{deliverables}

3. SERVICE PERIOD AND RENEWAL
The service period begins on {startDate} and ends on {endDate}. {timeline}
Renewal: {termRenewal}

4. FEES, INVOICING, AND PAYMENT
Fees: {compensation}
Billing Frequency: {billingFrequency}
Payment Due: within {paymentDays} days of invoice receipt.
Additional Payment Terms: {paymentTerms}

5. CLIENT RESPONSIBILITIES
{clientResponsibilities}

6. SERVICE PROVIDER RESPONSIBILITIES
{serviceProviderResponsibilities}

7. STANDARDS AND WARRANTIES
{warranties}

8. CONFIDENTIALITY
{confidentiality}

9. INTELLECTUAL PROPERTY
{ipOwnership}

10. FORCE MAJEURE
{forceMajeure}

11. TERMINATION
{termination}

12. LIMITATION OF LIABILITY
{liability}

13. DISPUTE RESOLUTION
{disputeResolution}

14. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with the laws of {jurisdiction}.

15. GENERAL PROVISIONS
Entire Agreement: This Agreement constitutes the entire agreement between the parties concerning its subject matter.

Amendments: Any amendment must be made in writing and signed by the parties.

Severability: If any provision is found invalid or unenforceable, the remaining provisions shall remain effective to the extent permitted by law.

Notices: {notices}

16. SIGNATURES
IN WITNESS WHEREOF, the parties have executed this Agreement on the date and at the place first above written.

_________________________          _________________________
{partyA}                           {partyB}
Date: _______________              Date: _______________

WITNESS: {witnessName}
Signature: ____________________    Date: ____________________`,
    defaults: {
      billingFrequency: "Monthly, unless the parties agree otherwise in writing.",
      paymentDays: "30",
      clientResponsibilities: "The Client shall provide timely access, information, approvals, and cooperation reasonably required for the services.",
      serviceProviderResponsibilities: "The Service Provider shall perform the services with reasonable skill and care, keep the Client informed of material progress, and promptly notify the Client of issues affecting delivery.",
      termRenewal: "It may be renewed by mutual written agreement.",
      warranties: "The Provider warrants that services will be performed in a professional and workmanlike manner.",
      liability: "Neither party shall be liable for indirect, incidental, or consequential damages.",
      termination: "Either party may terminate with 30 days written notice. Outstanding payments remain due upon termination.",
      jurisdiction: "Republic of the Philippines",
      paymentTerms: "Invoices are due within 30 days of receipt.",
      confidentiality: "Each party shall protect non-public information received from the other party and use it only for purposes of this Agreement.",
      ipOwnership: "The parties shall document ownership and permitted use of intellectual property created or provided under this Agreement.",
      forceMajeure: "A party is excused from delay caused by events beyond its reasonable control while it gives prompt notice and takes reasonable steps to resume performance.",
      disputeResolution: "The parties shall attempt in good faith to resolve disputes through direct negotiation before pursuing remedies available under applicable law.",
    },
  },
  {
    type: "rental",
    label: "Rental Agreement",
    category: "Property & Finance", prefix: "RA",
    partyARole: "Lessor", partyBRole: "Lessee", signatureLabels: ["Lessor", "Lessee"],
    witnessEnabled: true, notarization: "optional",
    icon: "",
    fields: [...commonPartyFields, "propertyAddress", "propertyUnit", "propertyType", "floorArea", "parking", "fixtures", "inventory", "startDate", "endDate", "monthlyRent", "rentDueDay", "advanceRent", "securityDeposit", "depositTerms", "utilities", "permittedUse", "maintenance", "alterations", "sublease", "inspection", "restrictions", "default", "termination", "surrender", "returnProperty", "disputeResolution", "jurisdiction", "notices", "witnessName"],
    body: `RENTAL / LEASE AGREEMENT

This Agreement is entered into on {effectiveDate}, by and between:

Party A: {partyA}
Address: {partyAAddress}
Role: {partyARole}

and

Party B: {partyB}
Address: {partyBAddress}
Role: {partyBRole}

WHEREAS, {purpose};

NOW, THEREFORE, the parties agree as follows:

1. PROPERTY DESCRIPTION
Address: {propertyAddress}
Unit / Room: {propertyUnit}
Property Type: {propertyType}
Floor Area: {floorArea}
Parking: {parking}
Included Fixtures: {fixtures}
Inventory / Annex: {inventory}

2. RENTAL TERM AND PURPOSE
The rental term begins on {startDate} and ends on {endDate}. The permitted purpose is: {permittedUse}

3. RENT AND PAYMENT
Monthly rent: {monthlyRent}
Rent is due on day {rentDueDay} of each month. Advance rent: {advanceRent}

4. SECURITY DEPOSIT
Security deposit: {securityDeposit}
Deposit holding, deductions, and return: {depositTerms}

5. UTILITIES
{utilities}

6. MAINTENANCE AND REPAIRS
{maintenance}

7. ALTERATIONS AND SUBLEASE
Alterations: {alterations}
Sublease or assignment: {sublease}

8. INSPECTION
{inspection}

9. RESTRICTIONS
{restrictions}

10. DEFAULT
{default}

11. TERMINATION
{termination}

12. SURRENDER AND RETURN OF PROPERTY
Surrender: {surrender}
{returnProperty}

13. DISPUTE RESOLUTION
{disputeResolution}

14. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with the laws of {jurisdiction}.

15. GENERAL PROVISIONS
Entire Agreement: This Agreement constitutes the entire agreement between the parties concerning its subject matter.

Amendments: Any amendment must be made in writing and signed by the parties.

Severability: If any provision is found invalid or unenforceable, the remaining provisions shall remain effective to the extent permitted by law.

Notices: {notices}

16. SIGNATURES
IN WITNESS WHEREOF, the parties have executed this Agreement on the date and at the place first above written.

_________________________          _________________________
{partyA}                           {partyB}
Date: _______________              Date: _______________

WITNESS: {witnessName}
Signature: ____________________    Date: ____________________`,
    defaults: {
      jurisdiction: "Republic of the Philippines",
      depositTerms: "The deposit shall be held and applied only as permitted by this Agreement and applicable law. Any itemized deductions and remaining balance shall be returned within [number] days after surrender, subject to applicable law.",
      utilities: "The Lessee shall pay utilities separately metered or billed for the premises. The Lessor shall remain responsible for charges expressly assigned to the Lessor in writing.",
      maintenance: "The Lessor shall maintain structural components and major systems, except damage caused by the Lessee. The Lessee shall keep the premises reasonably clean and promptly report needed repairs.",
      alterations: "No material alteration may be made without the Lessor's prior written consent.",
      sublease: "The Lessee shall not assign this Agreement or sublease the premises without prior written consent.",
      inspection: "The Lessor may inspect the premises at reasonable times after reasonable prior notice, except in emergencies.",
      restrictions: "The premises shall not be used for unlawful purposes or in a manner that unreasonably disturbs other occupants.",
      default: "A party shall give written notice of a material breach and a reasonable opportunity to cure where practicable, subject to applicable law.",
      termination: "Either party may terminate as provided in this Agreement and applicable law, by written notice stating the effective date.",
      surrender: "At the end of the tenancy, the Lessee shall surrender the premises in the condition required by this Agreement, ordinary wear and tear excepted.",
      returnProperty: "The Lessee shall return keys and any listed property and remove personal belongings by the end of the tenancy.",
      disputeResolution: "The parties shall first attempt in good faith to resolve disputes through direct discussion before pursuing remedies available under applicable law.",
    },
  },
  {
    type: "partnership",
    label: "Partnership Agreement",
    category: "Business", prefix: "PA",
    partyARole: "Partner A", partyBRole: "Partner B", signatureLabels: ["Partner A", "Partner B"],
    witnessEnabled: true, notarization: "optional",
    icon: "",
    fields: [...commonPartyFields, "partnershipName", "principalOffice", "capitalTable", "ownership", "distribution", "management", "decisions", "partnerAResponsibilities", "partnerBResponsibilities", "bankAccounts", "accounting", "confidentiality", "ipOwnership", "additionalContributions", "admission", "withdrawal", "deathIncapacity", "dissolution", "liquidation", "disputeResolution", "jurisdiction", "notices", "witnessName", "partnerC", "partnerCCompany", "partnerCAddress", "partnerCEmail", "partnerCContact", "partnerCRole"],
    body: `PARTNERSHIP AGREEMENT

This Agreement is entered into on {effectiveDate}, by and between:

Party A: {partyA}
Address: {partyAAddress}
Role: {partyARole}

and

Party B: {partyB}
Address: {partyBAddress}
Role: {partyBRole}

Additional Partner (if applicable): {partnerC}
Company: {partnerCCompany}
Address: {partnerCAddress}
Email: {partnerCEmail}
Contact Number: {partnerCContact}
Capacity: {partnerCRole}

WHEREAS, {purpose};

NOW, THEREFORE, the parties agree as follows:

1. FORMATION, NAME, PURPOSE, AND OFFICE
The Partners form a partnership under the name {partnershipName} for the purpose of {purpose}.
Principal office: {principalOffice}

2. CAPITAL CONTRIBUTIONS
{capitalTable}

3. OWNERSHIP INTERESTS AND DISTRIBUTIONS
Ownership: {ownership}
Profit and loss distribution: {distribution}

4. MANAGEMENT
{management}

Decision-making: {decisions}

5. PARTNER RESPONSIBILITIES
Partner A: {partnerAResponsibilities}
Partner B: {partnerBResponsibilities}

6. BANKING
{bankAccounts}

7. BOOKS, RECORDS, AND REPORTING
{accounting}

8. ADDITIONAL CONTRIBUTIONS AND NEW PARTNERS
Additional contributions: {additionalContributions}
Admission of new partners: {admission}

9. WITHDRAWAL, DEATH, OR INCAPACITY
Withdrawal: {withdrawal}
Death or incapacity: {deathIncapacity}

10. DISSOLUTION
{dissolution}

11. LIQUIDATION AND DISTRIBUTION
{liquidation}

12. CONFIDENTIALITY AND INTELLECTUAL PROPERTY
Confidentiality: {confidentiality}
Intellectual property: {ipOwnership}

13. DISPUTE RESOLUTION
{disputeResolution}

14. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with the laws of {jurisdiction}.

15. GENERAL PROVISIONS
Entire Agreement: This Agreement constitutes the entire agreement between the parties concerning its subject matter.

Amendments: Any amendment must be made in writing and signed by the parties.

Severability: If any provision is found invalid or unenforceable, the remaining provisions shall remain effective to the extent permitted by law.

Notices: {notices}

16. SIGNATURES
IN WITNESS WHEREOF, the parties have executed this Agreement on the date and at the place first above written.

_________________________          _________________________
{partyA}                           {partyB}
Date: _______________              Date: _______________

WITNESS: {witnessName}
Signature: ____________________    Date: ____________________`,
    defaults: {
      jurisdiction: "Republic of the Philippines",
      management: "The Partners shall jointly manage the business unless they adopt a written delegation of authority. Each Partner shall act in the best interests of the partnership within their assigned responsibilities.",
      decisions: "Ordinary business decisions may be made by [voting threshold]. Decisions concerning material borrowing, admission of a partner, sale of material assets, or dissolution require [unanimous / specified approval]. Record decisions in writing.",
      partnerAResponsibilities: "Describe Partner A's duties, authority, time commitment, and reporting obligations.",
      partnerBResponsibilities: "Describe Partner B's duties, authority, time commitment, and reporting obligations.",
      bankAccounts: "Partnership funds shall be held in accounts in the partnership's name. Authorized signatories and approval thresholds: [Specify]. Partnership funds shall not be commingled with personal funds.",
      accounting: "The partnership shall maintain complete and accurate books and supporting records. Each Partner may inspect them on reasonable notice. Financial reports shall be prepared [frequency]. Fiscal year: [Specify].",
      confidentiality: "Each Partner shall protect non-public partnership information and use it only for partnership purposes, subject to disclosures required by law.",
      ipOwnership: "Intellectual property created for the partnership using partnership resources shall be owned or licensed as the Partners specify in writing. Each Partner retains pre-existing intellectual property.",
      additionalContributions: "No Partner is required to make an additional contribution unless all Partners agree in writing to the amount, purpose, and treatment of that contribution.",
      admission: "A new partner may be admitted only with the written consent of all existing Partners and a written amendment stating the new partner's contribution, ownership, duties, and rights.",
      withdrawal: "A Partner may withdraw by providing [notice period] written notice. The Partners shall document the valuation and payment of the withdrawing Partner's interest, subject to applicable law.",
      deathIncapacity: "The Partners shall state whether a successor may be admitted and how the affected Partner's interest will be valued and settled, subject to applicable law.",
      dissolution: "The partnership may be dissolved by written agreement of the Partners or upon an event requiring dissolution under this Agreement or applicable law.",
      liquidation: "On dissolution, partnership assets shall be applied to partnership liabilities and then distributed according to the Partners' documented interests, subject to applicable law.",
      disputeResolution: "The Partners shall first attempt in good faith to resolve disputes through a meeting and written record of proposed resolution before pursuing remedies available under applicable law.",
    },
  },
  ...expandedContracts,
];

export default function ContractAgreementBuilder() {
  const [contractType, setContractType] = useState<ContractType>("nda");
  const [selectedCategory, setSelectedCategory] = useState<ContractCategory>("Legal & Intellectual Property");
  const categoryStripRef = useRef<HTMLDivElement>(null);
  const [fields, setFields] = useState<Record<string, string>>(defaultContractFields(contracts[0]));
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [copied, setCopied] = useState(false);
  const [includeNotarial, setIncludeNotarial] = useState(false);
  const { containerRef: previewViewportRef, scale: previewScale } = usePagePreviewScale(210, tab === "preview");
  const [contractPagination, setContractPagination] = useState<{
    blocks: string[];
    fields: Record<string, string>;
    includeNotarial: boolean;
    pages: number[][];
  } | null>(null);

  const contract = contracts.find((c) => c.type === contractType)!;
  const showNotarial = contract.notarization === "required" || (contract.notarization === "optional" && includeNotarial);
  const signatureParties = [
    "partyA", "partyB",
    ...(contract.type === "partnership" && fields.partnerC?.trim() ? ["partnerC"] : []),
    ...(contract.witnessEnabled ? ["witnessName"] : []),
  ];

  const selectContract = (next: ContractTemplate) => {
    if (next.type === contractType) return;
    setContractType(next.type);
    setFields((current) => {
      const nextFields = defaultContractFields(next);
      for (const field of sharedIdentityFields) {
        if (current[field]?.trim()) nextFields[field] = current[field];
      }
      return nextFields;
    });
    setIncludeNotarial(next.notarization === "required");
  };

  const output = useMemo(() => {
    let text = contract.body;
    if (contract.type === "partnership" && !fields.partnerC?.trim()) {
      text = text.replace(/\nAdditional Partner \(if applicable\): \{partnerC\}[\s\S]*?\nCapacity: \{partnerCRole\}/, "");
    }
    text = text.replaceAll(
      "Party A: {partyA}\nAddress: {partyAAddress}\nRole: {partyARole}",
      "FIRST PARTY / {partyARole}\nName: {partyA}\nCompany: {partyACompany}\nAddress: {partyAAddress}\nEmail: {partyAEmail}\nContact Number: {partyAContact}\nHereinafter referred to as the \"{partyARole}.\""
    );
    text = text.replaceAll(
      "Party B: {partyB}\nAddress: {partyBAddress}\nRole: {partyBRole}",
      "SECOND PARTY / {partyBRole}\nName: {partyB}\nCompany: {partyBCompany}\nAddress: {partyBAddress}\nEmail: {partyBEmail}\nContact Number: {partyBContact}\nHereinafter referred to as the \"{partyBRole}.\""
    );
    for (const field of contract.fields) {
      const value = fields[field]?.trim() || (field.startsWith("partnerC") ? "" : `[${fieldLabels[field] || field}]`);
      text = text.replaceAll(`{${field}}`, value);
    }
    return text;
  }, [contract, fields]);

  const documentText = useMemo(() => {
    const header = [
      fields.partyACompany?.trim() || fields.partyA?.trim() || "[COMPANY / PARTY NAME]",
      fields.partyAAddress?.trim() || "[Complete Address]",
      [fields.partyAEmail?.trim(), fields.partyAContact?.trim()].filter(Boolean).join(" | ") || "[Email Address] | [Contact Number]",
      "────────────────────────────────────────────",
      `Agreement No.: ${fields.agreementNumber || "[Agreement Number]"}`,
      `Effective Date: ${fields.effectiveDate || "[Date]"}`,
    ].join("\n");
    const footer = `${fields.confidentialityStatus ? `${fields.confidentialityStatus} | ` : ""}${fields.agreementNumber || "[Agreement Number]"}\nPage [X] of [Y]`;
    return `${header}\n\n${output}\n\n${footer}${showNotarial ? `\n\n${fields.notarialText || notarialAcknowledgmentTemplate}` : ""}`;
  }, [fields, showNotarial, output]);

  const contractBlocks = useMemo(
    () => output.split(/\n\s*\n/).filter(Boolean).slice(1),
    [output]
  );
  const previewPages = contractPagination?.blocks === contractBlocks
    && contractPagination.fields === fields
    && contractPagination.includeNotarial === showNotarial
    ? contractPagination.pages
    : [contractBlocks.map((_, index) => index)];

  useLayoutEffect(() => {
    const strip = categoryStripRef.current;
    const selected = strip?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]');
    if (!strip || !selected) return;
    const stripBounds = strip.getBoundingClientRect();
    const selectedBounds = selected.getBoundingClientRect();
    strip.scrollLeft += selectedBounds.left - stripBounds.left;
  }, [selectedCategory]);

  useLayoutEffect(() => {
    const measureRoot = document.getElementById("contract-page-measure");
    if (!measureRoot) return;

    const pageContentHeight = (297 - 50.8) * (96 / 25.4) - 48;
    const firstPageTop = measureRoot.querySelector<HTMLElement>("[data-contract-page-top]")?.offsetHeight ?? 0;
    const blockHeights = Array.from(measureRoot.querySelectorAll<HTMLElement>("[data-contract-page-block]"))
      .map((element) => {
        const style = window.getComputedStyle(element);
        return element.offsetHeight + Number.parseFloat(style.marginTop) + Number.parseFloat(style.marginBottom);
      });
    const contentBlockCount = blockHeights.length - (showNotarial ? 1 : 0);
    const pages: number[][] = [[]];
    let usedHeight = firstPageTop;
    blockHeights.slice(0, contentBlockCount).forEach((height, index) => {
      if (pages[pages.length - 1].length && usedHeight + height > pageContentHeight) {
        pages.push([]);
        usedHeight = 0;
      }
      pages[pages.length - 1].push(index);
      usedHeight += height;
    });
    if (showNotarial) {
      if (pages.at(-1)?.length === 0) pages.pop();
      pages.push([contractBlocks.length]);
    }
    const frameId = window.requestAnimationFrame(() => setContractPagination({ blocks: contractBlocks, fields, includeNotarial: showNotarial, pages }));
    return () => window.cancelAnimationFrame(frameId);
  }, [contractBlocks, fields, showNotarial, contractType, output, tab]);

  const handleCopy = async () => {
    await copyToClipboard(documentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = async () => {
    if (tab !== "preview") setTab("preview");
    await waitForPdfPreview();
    try {
      const pages = Array.from(document.querySelectorAll<HTMLElement>("#contract-preview .contract-sheet"));
      await downloadHtmlPagesAsPdf(pages, `${contract.type}-agreement.pdf`);
    } catch {
      window.alert("The PDF could not be exported. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Contract type selector */}
      <div>
        <label className="mb-2 block text-sm font-medium text-muted">Contract Type</label>
        <div ref={categoryStripRef} className="mobile-chip-strip mb-3 flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible" aria-label="Agreement categories">
          {contractCategories.map((category) => (
            <button key={category} type="button" onClick={() => setSelectedCategory(category)}
              aria-pressed={selectedCategory === category}
              className={`shrink-0 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedCategory === category ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface text-muted hover:text-foreground hover:border-border-hover"
              }`}>
              {category}
            </button>
          ))}
        </div>
        <div className="mobile-chip-strip flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible" aria-label="Agreement types">
          {contracts.filter((item) => item.category === selectedCategory).map((c) => (
            <button key={c.type}
              onClick={() => selectContract(c)}
              aria-pressed={contractType === c.type}
              className={`shrink-0 whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                contractType === c.type ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface text-muted hover:text-foreground hover:border-border-hover"
              }`}>
              {c.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">Selected: {contract.label}</p>
      </div>

      {/* Tabs + Actions */}
      <div className="tool-action-bar flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-lg border border-border bg-surface p-1 max-sm:w-full">
          {(["edit", "preview"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors max-sm:flex-1 ${tab === t ? "bg-accent text-accent-fg" : "text-muted hover:text-foreground"}`}>
              {t === "edit" ? " Edit" : " Preview"}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-[auto_auto_minmax(0,1fr)] gap-2 sm:flex sm:flex-wrap">
          <button onClick={handleCopy}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:bg-surface-hover">
            {copied ? "✓ Copied" : "Copy"}
          </button>
          <button onClick={() => downloadFile(documentText, `${contract.type}-agreement.txt`)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:bg-surface-hover">
            Export .txt
          </button>
          <button onClick={handleExport}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg hover:bg-accent-hover">
            Export PDF
          </button>
        </div>
      </div>

      {tab === "edit" ? (
        <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-4">
          <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">
            {contract.label} — Details
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {contract.fields.map((field) => (
              <div key={field} className={multilineFields.includes(field) || expandedMultilineFields.has(field) ? "sm:col-span-2" : ""}>
                <label className="mb-1 block text-sm font-medium text-muted">{labelForField(contract, field)}</label>
                {multilineFields.includes(field) || expandedMultilineFields.has(field) ? (
                  <textarea
                    value={fields[field] || ""}
                    onChange={(e) => setFields((f) => ({ ...f, [field]: e.target.value }))}
                    placeholder={`Enter ${labelForField(contract, field).toLowerCase()}…`}
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background p-3 text-sm focus:border-accent focus:outline-none resize-y"
                  />
                ) : field.includes("Date") || field === "loanMaturity" ? (
                  <input type="date" value={fields[field] || ""}
                    onChange={(e) => setFields((f) => ({ ...f, [field]: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none" />
                ) : (
                  <input type="text" value={fields[field] || ""}
                    onChange={(e) => setFields((f) => ({ ...f, [field]: e.target.value }))}
                    placeholder={`Enter ${labelForField(contract, field).toLowerCase()}…`}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none" />
                )}
              </div>
            ))}
          </div>
          {contract.notarization === "optional" && <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={includeNotarial} onChange={(event) => setIncludeNotarial(event.target.checked)} />
            Include notarial acknowledgment (optional)
          </label>}
          {showNotarial && <textarea
            value={fields.notarialText ?? notarialAcknowledgmentTemplate}
            onChange={(event) => setFields((current) => ({ ...current, notarialText: event.target.value }))}
            rows={14}
            aria-label="Notarial acknowledgment text"
            className="w-full rounded-lg border border-border bg-background p-3 font-mono text-sm focus:border-accent focus:outline-none"
          />}
        </fieldset>
      ) : (
        <div id="contract-preview" className="min-w-0 max-w-full overflow-hidden rounded-lg border border-border" style={{ background: "#fff", color: "#222" }}>
          <style>{`
            .contract-preview-pages{box-sizing:border-box;display:flex;flex-direction:column;align-items:center;width:100%;min-width:0;gap:24px;overflow:hidden;background:#e5e7eb;padding:24px}
            .contract-sheet{box-sizing:border-box;display:flex;flex-direction:column;width:210mm;min-height:297mm;flex:none;margin:0 auto;padding:25.4mm;background:#fff;color:#111;font-family:"Times New Roman",Times,serif;font-size:12pt;line-height:1.5;box-shadow:0 2px 12px #0002;overflow:visible;overflow-wrap:anywhere}
            .contract-page-measure,.contract-page-measure [data-contract-page-top]{display:flex;flex-direction:column;font-family:"Times New Roman",Times,serif;font-size:12pt;line-height:1.5}
            .contract-title{margin:0 0 28px;padding-bottom:18px;border-bottom:1px solid #777;color:#111;font-family:"Times New Roman",Times,serif;font-size:14pt;font-weight:700;line-height:1.3;text-align:center;text-transform:uppercase}
            .contract-clause{margin:0 0 18px}
            .contract-clause-heading{margin:0 0 8px;font-size:12pt;font-weight:700;text-transform:uppercase;break-after:avoid-page}
            .contract-paragraph{margin:0 0 10px;text-align:justify;white-space:pre-wrap;overflow-wrap:anywhere}
            .contract-signatures{display:grid;grid-template-columns:1fr 1fr;gap:36px;margin-top:28px;break-inside:avoid}
            .contract-signature{min-width:0}
            .contract-signature-witness{grid-column:1/-1;width:48%;justify-self:center;margin-top:12px}
            .contract-signature-line{height:34px;border-bottom:1px solid #111;margin-bottom:8px}
            .contract-signature p{margin:5px 0}
            .contract-doc-header{margin-bottom:20px;color:#333;font-size:12pt;line-height:1.5}
            .contract-doc-header strong{display:block;font-size:12pt}
            .contract-meta{display:flex;justify-content:space-between;gap:16px;margin:16px 0 22px;padding:10px 0;border-top:1px solid #777;border-bottom:1px solid #777;font-size:12pt}
            .contract-footer{display:flex;justify-content:space-between;gap:12px;margin-top:auto;padding-top:8px;border-top:1px solid #777;font-family:Arial,Helvetica,sans-serif;font-size:8pt;color:#555}
            .notarial-section{margin-top:32px;white-space:pre-wrap;font-size:12pt;line-height:1.5;break-inside:avoid}
            .notarial-section h2{font-size:12pt;text-align:center;margin-bottom:16px}
            @media print{.contract-preview-pages{display:block;overflow:visible;background:#fff;padding:0}.contract-sheet{width:auto;height:auto;min-height:246.2mm;padding:0;box-shadow:none;overflow:visible;break-after:page;page-break-after:always}.contract-sheet:last-of-type{break-after:auto;page-break-after:auto}.contract-footer{position:static;margin-top:auto}.contract-page-number{display:inline}}
            @media(max-width:600px){.contract-preview-pages{padding:12px}}
          `}</style>
          <div ref={previewViewportRef} className="contract-preview-pages">
            {previewPages.map((page, pageIndex, allPages) => <article className="contract-sheet" key={pageIndex} style={{ zoom: previewScale }}>
              {pageIndex === 0 && <>
                <header className="contract-doc-header">
                  <strong>{fields.partyACompany?.trim() || fields.partyA?.trim() || "[COMPANY / PARTY NAME]"}</strong>
                  <div>{fields.partyAAddress?.trim() || "[Complete Address]"}</div>
                  <div>{[fields.partyAEmail?.trim() || "[Email Address]", fields.partyAContact?.trim() || "[Contact Number]"].join(" | ")}</div>
                </header>
                <h1 className="contract-title">{output.split("\n", 1)[0] || contract.label}</h1>
                <div className="contract-meta"><span>Agreement No.: {fields.agreementNumber || "[Agreement Number]"}</span><span>Effective Date: {fields.effectiveDate || "[Date]"}</span></div>
              </>}
              {page.map((index) => {
                if (index === contractBlocks.length) return showNotarial ? <section className="notarial-section" key="notarial"><div>{fields.notarialText || notarialAcknowledgmentTemplate}</div></section> : null;
                const block = contractBlocks[index];
              if (block.includes("_________________________")) {
                return <div className="contract-signatures" key={index}>
                  {signatureParties.map((party) => <div className={party === "witnessName" ? "contract-signature contract-signature-witness" : "contract-signature"} key={party}>
                    <div className="contract-signature-line" />
                    <p><strong>{party === "witnessName" ? "WITNESS" : fields[`${party}Role`]?.trim() || (party === "partyA" ? contract.signatureLabels[0] : party === "partyB" ? contract.signatureLabels[1] : "PARTNER C")}</strong></p>
                    <p>Name: {fields[party]?.trim() || `[${fieldLabels[party]}]`}</p>
                    <p>Date: ____________________</p>
                  </div>)}
                </div>;
              }
              const lines = block.split("\n");
              const heading = /^\d+\.\s+[A-Z0-9][A-Z0-9 /&-]*$/.test(lines[0].trim());
              const body = heading ? lines.slice(1).join("\n").trim() : block;
              return <section className="contract-clause" key={index}>
                {heading && <h2 className="contract-clause-heading">{lines[0]}</h2>}
                {body && <p className="contract-paragraph">{body}</p>}
              </section>;
              })}
              <footer className="contract-footer">
                <span>{fields.confidentialityStatus ? `${fields.confidentialityStatus} | ` : ""}{fields.agreementNumber}</span>
                <span className="contract-page-number">Page {pageIndex + 1} of {allPages.length}</span>
              </footer>
            </article>)}
            <div id="contract-page-measure" className="contract-page-measure" aria-hidden="true" style={{ position: "absolute", left: "-10000px", top: 0, width: "159.2mm", visibility: "hidden", pointerEvents: "none" }}>
              <div data-contract-page-top>
                <header className="contract-doc-header"><strong>{fields.partyACompany?.trim() || fields.partyA?.trim() || "[COMPANY / PARTY NAME]"}</strong><div>{fields.partyAAddress?.trim() || "[Complete Address]"}</div><div>{[fields.partyAEmail?.trim() || "[Email Address]", fields.partyAContact?.trim() || "[Contact Number]"].join(" | ")}</div></header>
                <h1 className="contract-title">{output.split("\n", 1)[0] || contract.label}</h1>
                <div className="contract-meta"><span>Agreement No.: {fields.agreementNumber || "[Agreement Number]"}</span><span>Effective Date: {fields.effectiveDate || "[Date]"}</span></div>
              </div>
              {contractBlocks.map((block, index) => {
                if (block.includes("_________________________")) return <div data-contract-page-block key={index} className="contract-signatures">{signatureParties.map((party) => <div className={party === "witnessName" ? "contract-signature contract-signature-witness" : "contract-signature"} key={party}><div className="contract-signature-line" /><p><strong>{party === "witnessName" ? "WITNESS" : fields[`${party}Role`]?.trim() || (party === "partyA" ? contract.signatureLabels[0] : party === "partyB" ? contract.signatureLabels[1] : "PARTNER C")}</strong></p><p>Name: {fields[party]?.trim() || `[${fieldLabels[party]}]`}</p><p>Date: ____________________</p></div>)}</div>;
                const lines = block.split("\n");
                const heading = /^\d+\.\s+[A-Z0-9][A-Z0-9 /&-]*$/.test(lines[0].trim());
                const body = heading ? lines.slice(1).join("\n").trim() : block;
                return <section data-contract-page-block className="contract-clause" key={index}>{heading && <h2 className="contract-clause-heading">{lines[0]}</h2>}{body && <p className="contract-paragraph">{body}</p>}</section>;
              })}
              {showNotarial && <section data-contract-page-block className="notarial-section"><div>{fields.notarialText || notarialAcknowledgmentTemplate}</div></section>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
