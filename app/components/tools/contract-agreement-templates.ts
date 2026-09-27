export const contractCategories = [
  "Business",
  "Work & Employment",
  "Legal & Intellectual Property",
  "Property & Finance",
  "Collaboration & Marketing",
] as const;

export type ContractCategory = (typeof contractCategories)[number];

export type ContractType =
  | "nda" | "freelance" | "service" | "rental" | "partnership"
  | "employment" | "independent-contractor" | "consulting" | "sales" | "loan"
  | "vendor" | "licensing" | "ip-assignment" | "collaboration" | "sponsorship";

interface AgreementSection {
  heading: string;
  content: string;
}

export interface ContractTemplate {
  type: ContractType;
  label: string;
  icon?: string;
  category: ContractCategory;
  prefix: string;
  partyARole: string;
  partyBRole: string;
  signatureLabels: readonly [string, string];
  witnessEnabled: boolean;
  notarization: "none" | "optional" | "required";
  fields: string[];
  body: string;
  sections?: readonly AgreementSection[];
  requiredFields?: readonly string[];
  optionalFields?: readonly string[];
  defaults?: Record<string, string>;
}

export const expandedFieldLabels: Record<string, string> = {
  jobTitle: "Job Title", workLocation: "Work Location", employmentStartDate: "Employment Start Date",
  jobDuties: "Job Duties",
  employmentType: "Employment Type", salary: "Salary / Wage", paySchedule: "Pay Schedule",
  workHours: "Work Hours", benefits: "Benefits", leavePolicy: "Leave Policy",
  probationPeriod: "Probation Period", reportingLine: "Reporting Line",
  contractorServices: "Contractor Services", contractorTerm: "Contractor Term",
  contractorFee: "Contractor Fee", contractorExpenses: "Contractor Expenses",
  consultingObjectives: "Consulting Objectives", consultingTerm: "Consulting Term",
  consultingFee: "Consulting Fee", consultingReports: "Reports / Recommendations",
  goodsDescription: "Goods Description", quantity: "Quantity", unitPrice: "Unit Price",
  totalPrice: "Total Price", deliveryTerms: "Delivery Terms", inspectionPeriod: "Inspection Period",
  warrantyTerms: "Warranty Terms", riskTransfer: "Risk Transfer",
  principalAmount: "Principal Amount", interestTerms: "Interest Terms",
  disbursementDate: "Disbursement Date", repaymentSchedule: "Repayment Schedule",
  loanMaturity: "Maturity Date", latePaymentTerms: "Late Payment Terms",
  collateral: "Collateral (if any)", prepaymentTerms: "Prepayment Terms",
  suppliedGoods: "Goods / Materials to Supply", supplySchedule: "Supply Schedule",
  purchaseOrders: "Purchase Order Process", qualityStandards: "Quality Standards",
  supplierPrice: "Pricing and Invoicing", supplierRemedies: "Defects and Remedies",
  licensedProperty: "Licensed Intellectual Property", licenseScope: "License Scope",
  licenseTerritory: "Territory", licenseTerm: "License Term",
  licenseFee: "License Fee / Royalties", licenseRestrictions: "License Restrictions",
  attribution: "Attribution / Notices", sublicensing: "Sublicensing",
  assignedProperty: "Intellectual Property to Assign", assignmentConsideration: "Assignment Consideration",
  includedMaterials: "Included Materials", excludedMaterials: "Excluded Materials",
  furtherAssurances: "Further Assurances", thirdPartyRights: "Third-Party Rights",
  collaborationGoal: "Collaboration Goal", contributions: "Party Contributions",
  decisionProcess: "Decision Process", sharedCosts: "Shared Costs",
  resultsOwnership: "Ownership of Results", publicityApproval: "Publicity Approval",
  sponsorBenefits: "Sponsor Benefits", sponsoredActivity: "Sponsored Activity",
  sponsorshipFee: "Sponsorship Fee / Support", sponsorDeliverables: "Sponsored Party Deliverables",
  brandUse: "Brand and Logo Use", eventDates: "Event / Campaign Dates",
  cancellationTerms: "Cancellation Terms", exclusivity: "Exclusivity (if any)",
};

export const expandedMultilineFields = new Set([
  "jobDuties", "benefits", "leavePolicy", "contractorServices", "contractorExpenses", "consultingObjectives",
  "consultingReports", "goodsDescription", "deliveryTerms", "warrantyTerms", "riskTransfer",
  "interestTerms", "repaymentSchedule", "latePaymentTerms", "collateral", "prepaymentTerms",
  "suppliedGoods", "supplySchedule", "purchaseOrders", "qualityStandards", "supplierPrice",
  "supplierRemedies", "licensedProperty", "licenseScope", "licenseRestrictions", "attribution",
  "sublicensing", "assignedProperty", "includedMaterials", "excludedMaterials", "furtherAssurances",
  "thirdPartyRights", "collaborationGoal", "contributions", "decisionProcess", "sharedCosts",
  "resultsOwnership", "publicityApproval", "sponsorBenefits", "sponsoredActivity",
  "sponsorDeliverables", "brandUse", "cancellationTerms", "exclusivity",
]);

const sharedRequiredFields = ["agreementNumber", "partyA", "partyB", "effectiveDate", "purpose"];
const sharedOptionalFields = [
  "partyACompany", "partyAAddress", "partyAEmail", "partyAContact", "partyARole",
  "partyBCompany", "partyBAddress", "partyBEmail", "partyBContact", "partyBRole",
  "jurisdiction", "disputeResolution", "notices",
];

type AgreementDefinition = Omit<ContractTemplate, "fields" | "body" | "requiredFields" | "optionalFields"> & {
  sections: readonly AgreementSection[];
  requiredFields: readonly string[];
  optionalFields: readonly string[];
};

/** New formats share the existing page renderer while keeping their terms in template data. */
function createAgreement(definition: AgreementDefinition): ContractTemplate {
  const requiredFields = [...sharedRequiredFields, ...definition.requiredFields];
  const optionalFields = [...sharedOptionalFields, ...definition.optionalFields, ...(definition.witnessEnabled ? ["witnessName"] : [])];
  const sections = [
    ...definition.sections,
    { heading: "GOVERNING LAW", content: "This Agreement shall be governed by the laws of {jurisdiction}." },
    { heading: "DISPUTE RESOLUTION", content: "{disputeResolution}" },
    { heading: "GENERAL PROVISIONS", content: "This Agreement is the entire agreement on its subject matter. Changes must be in writing and signed by both parties. If one provision is unenforceable, the remaining provisions continue to the extent permitted by law. Notices: {notices}" },
  ];
  const sectionText = sections.map(({ heading, content }, index) => `${index + 1}. ${heading}\n${content}`).join("\n\n");
  const witnessText = definition.witnessEnabled ? "\n\nWITNESS: {witnessName}\nSignature: ____________________    Date: ____________________" : "";
  const body = `${definition.label.toUpperCase()}\n\nThis Agreement is entered into on {effectiveDate}, by and between:\n\nParty A: {partyA}\nAddress: {partyAAddress}\nRole: {partyARole}\n\nand\n\nParty B: {partyB}\nAddress: {partyBAddress}\nRole: {partyBRole}\n\nWHEREAS, {purpose};\n\nNOW, THEREFORE, the parties agree as follows:\n\n${sectionText}\n\n${sections.length + 1}. SIGNATURES\nThe parties sign this Agreement on the dates written below.\n\n_________________________          _________________________\n{partyA}                           {partyB}\nDate: _______________              Date: _______________${witnessText}`;
  return { ...definition, fields: [...requiredFields, ...optionalFields], requiredFields, optionalFields, body };
}

const neutralDispute = "The parties will first try to resolve disputes through good-faith discussion before pursuing available remedies under applicable law.";

export const expandedContracts: ContractTemplate[] = [
  createAgreement({
    type: "employment", label: "Employment Agreement", category: "Work & Employment", prefix: "EA",
    partyARole: "Employer", partyBRole: "Employee", signatureLabels: ["Employer", "Employee"],
    witnessEnabled: false, notarization: "none",
    requiredFields: ["jobTitle", "employmentStartDate", "salary", "paySchedule", "workHours", "jobDuties"],
    optionalFields: ["workLocation", "employmentType", "benefits", "leavePolicy", "probationPeriod", "reportingLine", "termination"],
    defaults: { disputeResolution: neutralDispute },
    sections: [
      { heading: "POSITION AND DUTIES", content: "The Employer engages the Employee as {jobTitle}. Duties: {jobDuties}. Reporting line: {reportingLine}." },
      { heading: "START DATE AND WORK ARRANGEMENT", content: "Employment starts on {employmentStartDate}. Employment type: {employmentType}. Work location: {workLocation}. Work hours: {workHours}." },
      { heading: "PAY AND BENEFITS", content: "Salary or wage: {salary}, payable {paySchedule}. Benefits: {benefits}. Leave: {leavePolicy}." },
      { heading: "PROBATION AND POLICIES", content: "Any agreed probation period is {probationPeriod}. The Employee will follow lawful workplace policies made available by the Employer." },
      { heading: "CONFIDENTIALITY AND WORK PRODUCT", content: "The Employee will protect non-public business information. Ownership and permitted use of work product are subject to the parties' written terms and applicable law." },
      { heading: "ENDING EMPLOYMENT", content: "Termination and notice: {termination}. Final pay and other obligations will be handled under applicable law." },
    ],
  }),
  createAgreement({
    type: "independent-contractor", label: "Independent Contractor Agreement", category: "Work & Employment", prefix: "ICA",
    partyARole: "Client", partyBRole: "Contractor", signatureLabels: ["Client", "Contractor"],
    witnessEnabled: false, notarization: "none",
    requiredFields: ["contractorServices", "contractorTerm", "contractorFee", "paymentTerms"],
    optionalFields: ["deliverables", "contractorExpenses", "ipOwnership", "confidentiality", "termination"],
    defaults: { disputeResolution: neutralDispute },
    sections: [
      { heading: "SERVICES AND DELIVERABLES", content: "The Contractor will provide: {contractorServices}. Deliverables: {deliverables}." },
      { heading: "TERM AND SCHEDULE", content: "The engagement will run for {contractorTerm}, subject to the termination terms below." },
      { heading: "FEES AND EXPENSES", content: "Fee: {contractorFee}. Payment terms: {paymentTerms}. Expenses: {contractorExpenses}." },
      { heading: "INDEPENDENT STATUS", content: "The Contractor controls the manner of performance, subject to the agreed deliverables, and is responsible for its own personnel and obligations as provided by applicable law." },
      { heading: "CONFIDENTIALITY AND WORK PRODUCT", content: "Confidentiality: {confidentiality}. Ownership and use of work product: {ipOwnership}." },
      { heading: "TERMINATION", content: "{termination} Amounts earned for completed services remain payable under the agreed terms." },
    ],
  }),
  createAgreement({
    type: "consulting", label: "Consulting Agreement", category: "Work & Employment", prefix: "CA",
    partyARole: "Client", partyBRole: "Consultant", signatureLabels: ["Client", "Consultant"],
    witnessEnabled: false, notarization: "none",
    requiredFields: ["consultingObjectives", "consultingTerm", "consultingFee", "paymentTerms"],
    optionalFields: ["consultingReports", "clientResponsibilities", "confidentiality", "ipOwnership", "termination"],
    defaults: { disputeResolution: neutralDispute },
    sections: [
      { heading: "CONSULTING OBJECTIVES", content: "The Consultant will advise the Client on: {consultingObjectives}." },
      { heading: "REPORTS AND COOPERATION", content: "Reports or recommendations: {consultingReports}. Client cooperation: {clientResponsibilities}." },
      { heading: "TERM", content: "The consulting engagement runs for {consultingTerm}, unless ended under this Agreement." },
      { heading: "FEES AND PAYMENT", content: "Consulting fee: {consultingFee}. Payment terms: {paymentTerms}." },
      { heading: "PROFESSIONAL JUDGMENT", content: "The Consultant will perform with reasonable care. The Client remains responsible for decisions it makes based on the advice." },
      { heading: "CONFIDENTIALITY AND MATERIALS", content: "Confidentiality: {confidentiality}. Ownership and permitted use of reports and materials: {ipOwnership}." },
      { heading: "TERMINATION", content: "{termination}" },
    ],
  }),
  createAgreement({
    type: "sales", label: "Sales Agreement", category: "Business", prefix: "SALE",
    partyARole: "Seller", partyBRole: "Buyer", signatureLabels: ["Seller", "Buyer"],
    witnessEnabled: false, notarization: "none",
    requiredFields: ["goodsDescription", "quantity", "totalPrice", "deliveryTerms", "paymentTerms"],
    optionalFields: ["unitPrice", "inspectionPeriod", "warrantyTerms", "riskTransfer", "termination"],
    defaults: { disputeResolution: neutralDispute },
    sections: [
      { heading: "GOODS", content: "The Seller will sell and the Buyer will purchase: {goodsDescription}. Quantity: {quantity}. Unit price: {unitPrice}." },
      { heading: "PRICE AND PAYMENT", content: "Total price: {totalPrice}. Payment terms: {paymentTerms}." },
      { heading: "DELIVERY", content: "Delivery arrangements: {deliveryTerms}." },
      { heading: "INSPECTION AND ACCEPTANCE", content: "The Buyer may inspect the goods within {inspectionPeriod} after delivery and promptly identify any material nonconformity." },
      { heading: "WARRANTY AND REMEDIES", content: "Agreed warranty: {warrantyTerms}. The parties will address nonconforming goods under their agreed terms and applicable law." },
      { heading: "TITLE AND RISK", content: "Transfer of title and risk: {riskTransfer}." },
      { heading: "TERMINATION", content: "{termination}" },
    ],
  }),
  createAgreement({
    type: "loan", label: "Loan Agreement", category: "Property & Finance", prefix: "LA",
    partyARole: "Lender", partyBRole: "Borrower", signatureLabels: ["Lender", "Borrower"],
    witnessEnabled: true, notarization: "optional",
    requiredFields: ["principalAmount", "disbursementDate", "repaymentSchedule", "loanMaturity", "interestTerms"],
    optionalFields: ["latePaymentTerms", "collateral", "prepaymentTerms", "default"],
    defaults: { disputeResolution: neutralDispute },
    sections: [
      { heading: "LOAN AND DISBURSEMENT", content: "The Lender agrees to lend {principalAmount} to the Borrower on {disbursementDate}, subject to the terms below." },
      { heading: "INTEREST", content: "Interest terms: {interestTerms}." },
      { heading: "REPAYMENT", content: "Repayment schedule: {repaymentSchedule}. Final maturity: {loanMaturity}." },
      { heading: "PREPAYMENT AND LATE PAYMENT", content: "Prepayment: {prepaymentTerms}. Late payment: {latePaymentTerms}." },
      { heading: "SECURITY", content: "Collateral, if any: {collateral}. Any security arrangement requires its own agreed documentation where applicable." },
      { heading: "DEFAULT AND REMEDIES", content: "Default and cure terms: {default}. Remedies remain subject to applicable law." },
    ],
  }),
  createAgreement({
    type: "vendor", label: "Vendor / Supplier Agreement", category: "Business", prefix: "VSA",
    partyARole: "Purchaser", partyBRole: "Supplier", signatureLabels: ["Purchaser", "Supplier"],
    witnessEnabled: false, notarization: "none",
    requiredFields: ["suppliedGoods", "supplySchedule", "supplierPrice", "qualityStandards"],
    optionalFields: ["purchaseOrders", "deliveryTerms", "supplierRemedies", "confidentiality", "termination"],
    defaults: { disputeResolution: neutralDispute },
    sections: [
      { heading: "SUPPLY ARRANGEMENT", content: "The Supplier will supply: {suppliedGoods}. Purchase orders: {purchaseOrders}." },
      { heading: "SCHEDULE AND DELIVERY", content: "Supply schedule: {supplySchedule}. Delivery terms: {deliveryTerms}." },
      { heading: "QUALITY AND INSPECTION", content: "Goods must meet: {qualityStandards}. The Purchaser may inspect deliveries and promptly report material defects." },
      { heading: "PRICING AND INVOICING", content: "{supplierPrice}" },
      { heading: "DEFECTS AND REMEDIES", content: "{supplierRemedies}" },
      { heading: "CONFIDENTIALITY", content: "{confidentiality}" },
      { heading: "TERMINATION", content: "{termination}" },
    ],
  }),
  createAgreement({
    type: "licensing", label: "Licensing Agreement", category: "Legal & Intellectual Property", prefix: "LIC",
    partyARole: "Licensor", partyBRole: "Licensee", signatureLabels: ["Licensor", "Licensee"],
    witnessEnabled: false, notarization: "none",
    requiredFields: ["licensedProperty", "licenseScope", "licenseTerm", "licenseFee"],
    optionalFields: ["licenseTerritory", "licenseRestrictions", "attribution", "sublicensing", "termination"],
    defaults: { disputeResolution: neutralDispute },
    sections: [
      { heading: "LICENSE GRANT", content: "The Licensor grants the Licensee the right to use {licensedProperty} within this scope: {licenseScope}." },
      { heading: "TERM AND TERRITORY", content: "Term: {licenseTerm}. Territory: {licenseTerritory}." },
      { heading: "FEES AND ROYALTIES", content: "{licenseFee}" },
      { heading: "RESTRICTIONS AND SUBLICENSING", content: "Restrictions: {licenseRestrictions}. Sublicensing: {sublicensing}." },
      { heading: "OWNERSHIP AND NOTICES", content: "The Licensor retains ownership except for rights expressly granted here. Attribution and notices: {attribution}." },
      { heading: "TERMINATION AND EFFECT", content: "{termination} On termination, the Licensee will stop uses that are no longer authorized, subject to any agreed survival terms." },
    ],
  }),
  createAgreement({
    type: "ip-assignment", label: "Intellectual Property Assignment Agreement", category: "Legal & Intellectual Property", prefix: "IPA",
    partyARole: "Assignor", partyBRole: "Assignee", signatureLabels: ["Assignor", "Assignee"],
    witnessEnabled: true, notarization: "optional",
    requiredFields: ["assignedProperty", "assignmentConsideration", "includedMaterials"],
    optionalFields: ["excludedMaterials", "furtherAssurances", "thirdPartyRights"],
    defaults: { furtherAssurances: "The Assignor will reasonably cooperate in documenting the agreed transfer.", disputeResolution: neutralDispute },
    sections: [
      { heading: "IDENTIFIED PROPERTY", content: "The property covered by this Agreement is: {assignedProperty}. Included materials: {includedMaterials}." },
      { heading: "ASSIGNMENT", content: "Subject to the agreed consideration and applicable law, the Assignor assigns to the Assignee the rights identified above that the Assignor owns and may transfer." },
      { heading: "CONSIDERATION", content: "Consideration for the assignment: {assignmentConsideration}." },
      { heading: "EXCLUSIONS AND THIRD-PARTY RIGHTS", content: "Excluded materials: {excludedMaterials}. Existing third-party rights: {thirdPartyRights}. No rights outside the identified property are transferred." },
      { heading: "FURTHER ASSURANCES", content: "{furtherAssurances}" },
    ],
  }),
  createAgreement({
    type: "collaboration", label: "Collaboration Agreement", category: "Collaboration & Marketing", prefix: "COL",
    partyARole: "Collaborating Party A", partyBRole: "Collaborating Party B", signatureLabels: ["Collaborating Party A", "Collaborating Party B"],
    witnessEnabled: false, notarization: "none",
    requiredFields: ["collaborationGoal", "contributions", "decisionProcess", "resultsOwnership"],
    optionalFields: ["sharedCosts", "confidentiality", "publicityApproval", "termination"],
    defaults: { disputeResolution: neutralDispute },
    sections: [
      { heading: "COLLABORATION PURPOSE", content: "The parties will work together toward: {collaborationGoal}." },
      { heading: "CONTRIBUTIONS AND RESPONSIBILITIES", content: "Each party's contributions: {contributions}." },
      { heading: "DECISIONS AND COSTS", content: "Decisions will be made as follows: {decisionProcess}. Shared costs: {sharedCosts}." },
      { heading: "OWNERSHIP OF RESULTS", content: "Ownership and permitted use of results: {resultsOwnership}." },
      { heading: "CONFIDENTIALITY AND PUBLICITY", content: "Confidentiality: {confidentiality}. Public announcements and use of names: {publicityApproval}." },
      { heading: "TERMINATION", content: "{termination} The parties will settle outstanding approved costs and permitted uses in writing." },
    ],
  }),
  createAgreement({
    type: "sponsorship", label: "Sponsorship Agreement", category: "Collaboration & Marketing", prefix: "SPA",
    partyARole: "Sponsor", partyBRole: "Sponsored Party", signatureLabels: ["Sponsor", "Sponsored Party"],
    witnessEnabled: false, notarization: "none",
    requiredFields: ["sponsoredActivity", "sponsorshipFee", "sponsorBenefits", "sponsorDeliverables"],
    optionalFields: ["eventDates", "brandUse", "exclusivity", "cancellationTerms"],
    defaults: { disputeResolution: neutralDispute },
    sections: [
      { heading: "SPONSORED ACTIVITY", content: "The sponsored activity is: {sponsoredActivity}. Dates: {eventDates}." },
      { heading: "SPONSORSHIP SUPPORT", content: "The Sponsor will provide: {sponsorshipFee}." },
      { heading: "BENEFITS AND DELIVERABLES", content: "Sponsor benefits: {sponsorBenefits}. Sponsored Party deliverables: {sponsorDeliverables}." },
      { heading: "BRAND USE AND EXCLUSIVITY", content: "Brand and logo use: {brandUse}. Any exclusivity: {exclusivity}. No broader rights are granted by implication." },
      { heading: "CHANGES AND CANCELLATION", content: "If the activity changes or is cancelled, the parties will follow: {cancellationTerms}." },
    ],
  }),
];
