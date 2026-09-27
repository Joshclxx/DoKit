import type { Tool } from "./tools";
import { tools } from "./tools";

export interface Kit {
  name: string;
  slug: string;
  description: string;
  toolSlugs: string[];
}

export const kits: Kit[] = [
  {
    name: "Freelance & Business",
    slug: "freelance-business",
    description: "Invoice, quote, propose, and communicate — everything a freelancer or small business needs.",
    toolSlugs: [
      "invoice-builder",
      "quotation-generator",
      "proposal-generator",
      "structured-communication-builder",
      "pricing-calculator",
      "contract-agreement-builder",
    ],
  },
  {
    name: "Certificates & Documents",
    slug: "certificates-documents",
    description: "Generate resumes, certificates, ID cards, and convert document formats in bulk.",
    toolSlugs: [
      "bulk-certificate-generator",
      "id-card-badge-generator",
      "ats-resume-builder",
    ],
  },
  {
    name: "Developer Tools",
    slug: "developer-tools",
    description: "API testing, regex, JWT decoding, config generators, and more for developers.",
    toolSlugs: [
      "api-request-tester",
      "curl-converter",
      "regex-builder",
      "jwt-decoder",
      "nginx-config-generator",
      "htaccess-rules-generator",
      "system-spec-builder",
    ],
  },
  {
    name: "Data & Text",
    slug: "data-text",
    description: "Clean, extract, analyse, and transform text and tabular data.",
    toolSlugs: [
      "csv-table-builder",
      "data-cleanup-suite",
      "text-pattern-extractor",
    ],
  },
  {
    name: "Media & Assets",
    slug: "media-assets",
    description: "Compress images, build QR codes, create icons, remove backgrounds, and design colour systems.",
    toolSlugs: [
      "image-compressor",
      "qr-code-builder",
      "icon-system-builder",
      "social-post-mockup-builder",
      "svg-system-builder",
      "color-system-toolkit",
    ],
  },
];

export function getKitBySlug(slug: string): Kit | undefined {
  return kits.find((k) => k.slug === slug);
}

export function getKitTools(kit: Kit): Tool[] {
  return kit.toolSlugs
    .map((slug) => tools.find((t) => t.slug === slug))
    .filter((t): t is Tool => t !== undefined);
}
