export type Category =
  | "Text"
  | "Planning"
  | "Numbers"
  | "Links"
  | "Developer"
  | "Media"
  | "PDF";

export interface Tool {
  id: string;
  name: string;
  slug: string;
  category: Category;
  description: string;
  icon: string;
  networkNote?: string;
}

export const tools: Tool[] = [
  { id: "F-01", name: "ATS Resume Builder", slug: "ats-resume-builder", category: "Planning", description: "Build ATS-optimised resumes with 7 themes, keyword scoring, and PDF/HTML export", icon: "" },
  { id: "F-02", name: "Text Pattern Extractor", slug: "text-pattern-extractor", category: "Text", description: "Extract emails, URLs, numbers, dates, and custom regex patterns from any text", icon: "" },
  { id: "F-03", name: "Data Cleanup Suite", slug: "data-cleanup-suite", category: "Text", description: "Normalize, deduplicate, sort, and reformat messy text lists", icon: "" },
  { id: "F-04", name: "CSV / Table Builder", slug: "csv-table-builder", category: "Text", description: "Edit tabular data visually; export as CSV, Markdown, JSON, HTML, or SQL", icon: "" },
  { id: "F-05", name: "Regex Builder", slug: "regex-builder", category: "Developer", description: "Build, test, and debug regular expressions with live match highlighting", icon: "" },
  { id: "F-06", name: "Structured Communication Builder", slug: "structured-communication-builder", category: "Planning", description: "Generate follow-ups, inquiries, reminders, and cover letters from templates", icon: "" },
  { id: "F-08", name: "Markdown Editor", slug: "markdown-editor", category: "Text", description: "Full-featured split-pane Markdown editor with live preview and export", icon: "" },
  { id: "F-09", name: "Proposal Generator", slug: "proposal-generator", category: "Planning", description: "Draft client proposals with scope, timeline, pricing, and next steps", icon: "" },
  { id: "F-10", name: "API Request Tester", slug: "api-request-tester", category: "Developer", description: "Send CORS-enabled HTTP requests with headers, params, and JSON body from the browser", icon: "", networkNote: "Requests are sent to the URL you enter and are subject to that server's CORS policy." },
  { id: "F-11", name: "cURL Converter", slug: "curl-converter", category: "Developer", description: "Convert cURL commands to fetch/Axios snippets and vice-versa", icon: "" },
  { id: "F-12", name: "Timezone Overlap", slug: "timezone-overlap", category: "Planning", description: "Find overlapping meeting windows across two or more time zones", icon: "" },
  { id: "F-13", name: "Pricing Calculator", slug: "pricing-calculator", category: "Numbers", description: "Break down totals with flat amounts, percentages, and discount layers", icon: "" },
  { id: "F-14", name: "Quotation Generator", slug: "quotation-generator", category: "Numbers", description: "Build itemized quotes with totals, tax, validity date, and PDF export", icon: "" },
  { id: "F-15", name: "Invoice Builder", slug: "invoice-builder", category: "Numbers", description: "Create professional invoices with logo, line items, tax, and 6 templates", icon: "" },
  { id: "F-16", name: "Currency Converter", slug: "currency-converter", category: "Numbers", description: "Convert between 30 currencies using approximate offline reference rates", icon: "" },
  { id: "F-17", name: "Image Compressor", slug: "image-compressor", category: "Media", description: "Compress images client-side while preserving visual quality", icon: "" },
  { id: "F-18", name: "Social Post Mockup Builder", slug: "social-post-mockup-builder", category: "Media", description: "Preview social posts with profile UI, stats, comments per platform", icon: "" },
  { id: "F-19", name: "QR Code Builder", slug: "qr-code-builder", category: "Links", description: "Generate customized QR codes with rich payloads and export options", icon: "", networkNote: "QR payloads are sent to the third-party QR Server API for rendering." },
  { id: "F-20", name: "Text Extractor", slug: "text-extractor", category: "Text", description: "Extract text from plain-text files and basic selectable PDFs; preview images for transcription", icon: "" },
  { id: "F-21", name: "Images to PDF", slug: "images-to-pdf", category: "PDF", description: "Arrange images on standard pages and download them as a PDF", icon: "" },
  { id: "F-23", name: "Nginx Config Generator", slug: "nginx-config-generator", category: "Developer", description: "Build complete Nginx server configs with SSL, proxy, and security headers", icon: "" },
  { id: "F-24", name: ".htaccess Rules Generator", slug: "htaccess-rules-generator", category: "Developer", description: "Create Apache redirect rules from simple toggles and form inputs", icon: "" },
  { id: "F-25", name: "YouTube Video Inspector", slug: "youtube-video-inspector", category: "Links", description: "Parse YouTube links locally and preview network-hosted thumbnails and embeds", icon: "", networkNote: "Preview images and embeds are loaded from YouTube." },
  { id: "F-26", name: "JWT Decoder", slug: "jwt-decoder", category: "Developer", description: "Decode JWT header and payload locally in the browser", icon: "" },
  { id: "F-27", name: "Diagram Builder", slug: "diagram-builder", category: "Developer", description: "Build flowcharts, ERDs, and architecture maps with JSON editing", icon: "" },
  { id: "F-28", name: "Food Costing Tool", slug: "food-costing-tool", category: "Numbers", description: "Calculate recipe costs, food cost %, and menu pricing", icon: "" },
  { id: "F-29", name: "Sketch & Wireframe Tool", slug: "sketch-wireframe-tool", category: "Media", description: "Place and edit common wireframe components on a simple canvas", icon: "" },
  { id: "F-30", name: "FocusFlow", slug: "focusflow", category: "Planning", description: "Pomodoro timer and task manager in one focused workspace", icon: "" },
  { id: "F-31", name: "Capstone Idea Builder", slug: "capstone-idea-builder", category: "Planning", description: "Generate a structured capstone concept from domain and problem input", icon: "" },
  { id: "F-32", name: "Bulk Certificate Generator", slug: "bulk-certificate-generator", category: "Planning", description: "Generate professional certificates in bulk from a name list", icon: "" },
  { id: "F-33", name: "ID Card / Badge Generator", slug: "id-card-badge-generator", category: "Media", description: "Design and bulk-generate ID cards with photo, QR, and custom fields", icon: "" },
  { id: "F-36", name: "Icon System Builder", slug: "icon-system-builder", category: "Media", description: "Customize a built-in SVG icon set and export SVG or React components", icon: "" },
  { id: "F-37", name: "System Spec Builder", slug: "system-spec-builder", category: "Developer", description: "Output agent-ready system prompts, Markdown specs, and JSON configs", icon: "" },
  { id: "F-38", name: "SVG System Builder", slug: "svg-system-builder", category: "Media", description: "Build and export structured SVG icons and logos with live code output", icon: "" },
  { id: "F-39", name: "UI System Blueprint", slug: "ui-system-blueprint", category: "Planning", description: "Browse 54 UI templates and export AI-ready design rules", icon: "" },
  { id: "F-40", name: "Color System Toolkit", slug: "color-system-toolkit", category: "Media", description: "Build color palettes, harmonies, gradients, and design tokens", icon: "" },
  { id: "F-41", name: "Contract & Agreement Builder", slug: "contract-agreement-builder", category: "Planning", description: "Generate dynamic business and personal contracts with live preview", icon: "" },
  { id: "F-42", name: "Encoder / Decoder", slug: "encoder-decoder", category: "Developer", description: "Encode and decode Base64, URL, HTML, Hex, Binary, and Unicode", icon: "" },
  { id: "F-43", name: "Password Generator", slug: "password-generator", category: "Developer", description: "Generate strong passwords with customizable length, characters, and entropy scoring", icon: "" },
  { id: "F-44", name: "Hash Generator", slug: "hash-generator", category: "Developer", description: "Generate SHA-1, SHA-256, SHA-384, and SHA-512 hashes from text input", icon: "" },
];

export const categories: Category[] = [
  "Text",
  "Planning",
  "Numbers",
  "Developer",
  "Media",
  "Links",
  "PDF",
];

export function getToolBySlug(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}

export function getToolsByCategory(category: Category): Tool[] {
  return tools.filter((t) => t.category === category);
}
