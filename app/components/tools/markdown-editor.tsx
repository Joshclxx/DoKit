"use client";

import { useState, useMemo, useRef } from "react";
import { copyToClipboard, downloadFile } from "@/lib/utils/download";
import { A4_PAGE_POINTS, downloadHtmlPagesAsPdf } from "@/lib/utils/pdf-download";

/* ── Minimal Markdown → HTML parser ──────────────── */
function mdToHtml(md: string): string {
  let html = esc(md);

  // Fenced code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
    `<pre class="code-block"><code class="${lang}">${code.trim()}</code></pre>`
  );

  // Blockquotes
  html = html.replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>");

  // Headings
  html = html.replace(/^######\s+(.+)$/gm, "<h6>$1</h6>");
  html = html.replace(/^#####\s+(.+)$/gm, "<h5>$1</h5>");
  html = html.replace(/^####\s+(.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");

  // Horizontal rules
  html = html.replace(/^---$/gm, "<hr />");

  // Bold, italic, strikethrough
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) =>
    `<img src="${safeUrl(url, true)}" alt="${alt}" />`
  );

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) =>
    `<a href="${safeUrl(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`
  );

  // Unordered lists
  html = html.replace(/^[\-\*]\s+(.+)$/gm, "<li>$1</li>");
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>");

  // Ordered lists
  html = html.replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>");

  // Paragraphs — wrap remaining bare lines
  html = html
    .split("\n\n")
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (/^<[a-z]/.test(trimmed)) return trimmed;
      return `<p>${trimmed.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");

  return html;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeUrl(url: string, image = false): string {
  const decoded = url.replace(/&amp;/g, "&").trim();
  const allowed = image
    ? /^(https?:\/\/|\/)/i.test(decoded)
    : /^(https?:\/\/|mailto:|#|\/)/i.test(decoded);
  return allowed ? esc(decoded) : "#";
}

/* ── Toolbar actions ─────────────────────────────── */
interface Action {
  label: string;
  icon: string;
  before: string;
  after: string;
}

const actions: Action[] = [
  { label: "Bold", icon: "B", before: "**", after: "**" },
  { label: "Italic", icon: "I", before: "*", after: "*" },
  { label: "Strikethrough", icon: "S̶", before: "~~", after: "~~" },
  { label: "Heading 1", icon: "H1", before: "# ", after: "" },
  { label: "Heading 2", icon: "H2", before: "## ", after: "" },
  { label: "Heading 3", icon: "H3", before: "### ", after: "" },
  { label: "Link", icon: "", before: "[", after: "](url)" },
  { label: "Image", icon: "", before: "![alt](", after: ")" },
  { label: "Code", icon: "</>", before: "`", after: "`" },
  { label: "Code Block", icon: "{ }", before: "```\n", after: "\n```" },
  { label: "Quote", icon: "❝", before: "> ", after: "" },
  { label: "Bullet List", icon: "•", before: "- ", after: "" },
  { label: "Numbered List", icon: "1.", before: "1. ", after: "" },
  { label: "Divider", icon: "—", before: "\n---\n", after: "" },
];

const defaultContent = `# Welcome to the Markdown Editor

Write your content here with **live preview** on the right.

## Features

- **Bold**, *italic*, and ~~strikethrough~~ text
- [Links](https://example.com) and images
- Code blocks with syntax highlighting
- Lists, blockquotes, and more

> This is a blockquote. It supports multiple lines.

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

---

*Start editing to see the preview update in real time.*
`;

export default function MarkdownEditor() {
  const [content, setContent] = useState(defaultContent);
  const [view, setView] = useState<"split" | "edit" | "preview">("split");
  const [copied, setCopied] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const rendered = useMemo(() => mdToHtml(content), [content]);

  const insertAction = (action: Action) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end) || action.label.toLowerCase();
    const newText =
      content.slice(0, start) + action.before + selected + action.after + content.slice(end);
    setContent(newText);
    requestAnimationFrame(() => {
      ta.focus();
      const cursorPos = start + action.before.length + selected.length;
      ta.setSelectionRange(cursorPos, cursorPos);
    });
  };

  const handleCopy = async (text: string, id: string) => {
    await copyToClipboard(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleExport = async () => {
    const article = document.createElement("article");
    article.className = "prose-dokit markdown-pdf-sheet";
    article.style.cssText = "box-sizing:border-box;width:210mm;min-height:297mm;padding:16mm;background:#fff;color:#222;font-family:'Segoe UI',system-ui,sans-serif;font-size:14px;line-height:1.7";
    article.innerHTML = rendered;
    try {
      await downloadHtmlPagesAsPdf([article], "document.pdf", { pageSize: A4_PAGE_POINTS, marginsMm: [0, 0, 0, 0] });
    } catch {
      window.alert("The PDF could not be exported. Please try again.");
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-surface p-2">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={() => insertAction(a)}
            title={a.label}
            className="flex h-8 min-w-[32px] items-center justify-center rounded px-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            {a.label}
          </button>
        ))}
        <div className="mx-2 h-6 w-px bg-border" />
        {/* View toggles */}
        {(["edit", "split", "preview"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${v === "split" ? "hidden lg:inline-flex" : ""} ${
              view === v ? "bg-accent text-accent-fg" : "text-muted hover:text-foreground"
            }`}
          >
            {v === "edit" ? " Edit" : v === "split" ? "◫ Split" : " Preview"}
          </button>
        ))}
      </div>

      {/* Export bar */}
      <div className="tool-action-bar flex flex-wrap gap-2">
        <button onClick={handleExport}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover">
          Export A4 PDF
        </button>
        <button onClick={() => handleCopy(content, "md")}
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-hover">
          {copied === "md" ? "✓ Copied" : "Copy MD"}
        </button>
        <button onClick={() => handleCopy(rendered, "html")}
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-hover">
          {copied === "html" ? "✓ Copied" : "Copy HTML"}
        </button>
        <button onClick={() => downloadFile(content, "document.md", "text/markdown")}
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-hover">
          Export .md
        </button>
        <button onClick={() => downloadFile(rendered, "document.html", "text/html")}
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-hover">
          Export .html
        </button>
      </div>

      {/* Editor panes */}
      <div className={`grid gap-4 ${view === "split" ? "lg:grid-cols-2" : ""}`}>
        {/* Editor */}
        {view !== "preview" && (
          <div className="flex flex-col">
            <div className="mb-1 flex items-center justify-between text-xs text-muted">
              <span>Markdown</span>
              <span>{wordCount} words · {charCount} chars</span>
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[500px] flex-1 rounded-lg border border-border bg-surface p-4 font-mono text-sm leading-relaxed transition-colors focus:border-accent focus:outline-none resize-y"
              spellCheck={false}
            />
          </div>
        )}

        {/* Preview */}
        {view !== "edit" && (
          <div className={`${view === "split" ? "hidden lg:flex" : "flex"} flex-col`}>
            <div className="mb-1 text-xs text-muted">Preview</div>
            <div className="flex min-h-[500px] flex-1 justify-center overflow-auto rounded-lg border border-border bg-[#e7e9ec] p-3 sm:p-6">
              <article
                className="prose-dokit markdown-pdf-sheet box-border min-h-[1123px] w-[794px] max-w-full shrink-0 bg-white p-8 text-[#222] shadow-lg sm:p-[60px]"
                style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", fontSize: 14, lineHeight: 1.7 }}
                dangerouslySetInnerHTML={{ __html: rendered }}
              />
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
