"use client";

import { useState, useMemo } from "react";
import { copyToClipboard, downloadFile } from "@/lib/utils/download";

interface UITemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  tokens: string;
}

const categories = ["Layout", "Navigation", "Forms", "Data Display", "Feedback", "Content", "Commerce", "Auth", "Dashboard"];

const templates: UITemplate[] = [
  { id: "hero-split", name: "Split Hero", category: "Layout", description: "Two-column hero with text left, image right", tokens: "layout: split, columns: 2, gap: 2rem, padding: 4rem, image-position: right" },
  { id: "hero-centered", name: "Centered Hero", category: "Layout", description: "Full-width centered headline with CTA buttons", tokens: "layout: centered, max-width: 720px, text-align: center, gap: 1.5rem" },
  { id: "hero-gradient", name: "Gradient Hero", category: "Layout", description: "Background gradient with overlay text", tokens: "layout: overlay, gradient: linear(135deg, primary, secondary), text-color: white" },
  { id: "grid-cards", name: "Card Grid", category: "Layout", description: "Responsive grid of content cards", tokens: "layout: grid, columns: auto-fill 320px, gap: 1.5rem, card-radius: 12px" },
  { id: "bento-grid", name: "Bento Grid", category: "Layout", description: "Asymmetric masonry-style layout", tokens: "layout: bento, columns: 4, span-variants: [1,2], gap: 1rem" },
  { id: "sidebar-layout", name: "Sidebar Layout", category: "Layout", description: "Fixed sidebar with scrollable content area", tokens: "layout: sidebar, sidebar-width: 260px, position: fixed, collapse: 768px" },
  { id: "navbar-sticky", name: "Sticky Navbar", category: "Navigation", description: "Top navigation bar with blur backdrop", tokens: "position: sticky, height: 64px, backdrop-blur: 12px, z-index: 50" },
  { id: "navbar-transparent", name: "Transparent Navbar", category: "Navigation", description: "Transparent navbar that solidifies on scroll", tokens: "position: fixed, bg: transparent, scroll-bg: surface/80, transition: 200ms" },
  { id: "sidebar-nav", name: "Sidebar Navigation", category: "Navigation", description: "Collapsible sidebar with icons and labels", tokens: "width: 260px, collapsed: 64px, icon-size: 20px, transition: 200ms" },
  { id: "tabs-underline", name: "Underline Tabs", category: "Navigation", description: "Tab navigation with animated underline indicator", tokens: "indicator: underline, height: 2px, color: accent, transition: 300ms" },
  { id: "breadcrumbs", name: "Breadcrumbs", category: "Navigation", description: "Hierarchical breadcrumb trail", tokens: "separator: /, font-size: 14px, active-color: foreground, muted-color: muted" },
  { id: "pagination", name: "Pagination", category: "Navigation", description: "Page navigation with numbered buttons", tokens: "style: numbered, radius: 8px, active-bg: accent, size: 36px" },
  { id: "form-stacked", name: "Stacked Form", category: "Forms", description: "Vertical form with labels above inputs", tokens: "layout: stacked, gap: 1rem, label-size: 14px, input-height: 40px, radius: 8px" },
  { id: "form-inline", name: "Inline Form", category: "Forms", description: "Horizontal form with labels beside inputs", tokens: "layout: inline, label-width: 120px, gap: 0.75rem" },
  { id: "form-stepped", name: "Multi-Step Form", category: "Forms", description: "Wizard-style form with progress indicator", tokens: "steps: numbered, indicator: bar, transition: slide, gap: 2rem" },
  { id: "search-bar", name: "Search Bar", category: "Forms", description: "Search input with icon and filter chips", tokens: "height: 48px, icon: search, radius: 12px, filter-chips: true" },
  { id: "select-dropdown", name: "Custom Select", category: "Forms", description: "Styled dropdown with search and multi-select", tokens: "max-height: 280px, search: true, multi: true, radius: 8px" },
  { id: "toggle-switch", name: "Toggle Switch", category: "Forms", description: "iOS-style toggle switch", tokens: "width: 44px, height: 24px, radius: full, transition: 200ms" },
  { id: "data-table", name: "Data Table", category: "Data Display", description: "Sortable table with row selection", tokens: "header-bg: surface-hover, row-height: 48px, sort: true, select: checkbox" },
  { id: "stat-cards", name: "Stat Cards", category: "Data Display", description: "KPI cards with trend indicators", tokens: "layout: grid, columns: 4, trend: arrow, delta-up: success, delta-down: danger" },
  { id: "timeline", name: "Timeline", category: "Data Display", description: "Vertical timeline with alternating items", tokens: "layout: vertical, line-width: 2px, dot-size: 12px, alternating: true" },
  { id: "accordion", name: "Accordion", category: "Data Display", description: "Collapsible content sections", tokens: "icon: chevron, transition: 200ms, border: bottom, padding: 1rem" },
  { id: "avatar-group", name: "Avatar Group", category: "Data Display", description: "Stacked avatar circles with overflow count", tokens: "size: 36px, overlap: -8px, border: 2px, max-display: 5" },
  { id: "badge", name: "Badge / Tag", category: "Data Display", description: "Small label for status or category", tokens: "height: 24px, radius: full, font-size: 12px, padding: 0 8px" },
  { id: "toast", name: "Toast Notification", category: "Feedback", description: "Slide-in notification with auto-dismiss", tokens: "position: bottom-right, width: 360px, duration: 4000ms, radius: 12px" },
  { id: "alert-banner", name: "Alert Banner", category: "Feedback", description: "Full-width alert with icon and dismiss", tokens: "variants: info|success|warning|danger, icon: true, dismiss: true" },
  { id: "modal", name: "Modal Dialog", category: "Feedback", description: "Centered overlay dialog with backdrop", tokens: "max-width: 480px, backdrop: black/50, radius: 16px, animation: scale" },
  { id: "skeleton", name: "Skeleton Loader", category: "Feedback", description: "Animated placeholder while loading", tokens: "animation: pulse, radius: 8px, bg: surface-hover, duration: 1.5s" },
  { id: "progress-bar", name: "Progress Bar", category: "Feedback", description: "Linear progress indicator", tokens: "height: 8px, radius: full, bg: surface-hover, fill: accent, transition: 300ms" },
  { id: "empty-state", name: "Empty State", category: "Feedback", description: "Placeholder for empty content areas", tokens: "icon-size: 48px, text-align: center, max-width: 400px, gap: 1rem" },
  { id: "blog-card", name: "Blog Card", category: "Content", description: "Article card with image, title, excerpt", tokens: "image-ratio: 16/9, radius: 12px, padding: 1.5rem, gap: 0.75rem" },
  { id: "testimonial", name: "Testimonial", category: "Content", description: "Quote card with avatar and attribution", tokens: "quote-size: 16px, avatar: 48px, border-left: 3px accent" },
  { id: "pricing-table", name: "Pricing Table", category: "Commerce", description: "Tiered pricing cards with feature comparison", tokens: "columns: 3, featured: middle, badge: popular, radius: 16px" },
  { id: "product-card", name: "Product Card", category: "Commerce", description: "E-commerce product with image, price, CTA", tokens: "image-ratio: 1/1, radius: 12px, price-size: 20px, cta: add-to-cart" },
  { id: "checkout-form", name: "Checkout Form", category: "Commerce", description: "Multi-step checkout with order summary", tokens: "steps: shipping|payment|review, summary: sticky-right" },
  { id: "login-centered", name: "Centered Login", category: "Auth", description: "Centered login card with social buttons", tokens: "max-width: 400px, social: google|github, divider: or, radius: 16px" },
  { id: "login-split", name: "Split Login", category: "Auth", description: "Two-column login with brand panel", tokens: "layout: split, brand-side: gradient, form-width: 400px" },
  { id: "register-stepped", name: "Stepped Register", category: "Auth", description: "Multi-step registration with progress", tokens: "steps: 3, indicator: dots, transition: slide" },
  { id: "dashboard-header", name: "Dashboard Header", category: "Dashboard", description: "Greeting bar with date and quick actions", tokens: "height: auto, padding: 1.5rem, greeting: dynamic, actions: right" },
  { id: "chart-area", name: "Area Chart Card", category: "Dashboard", description: "Time-series area chart with controls", tokens: "height: 300px, legend: top, grid: dashed, tooltip: true" },
  { id: "activity-feed", name: "Activity Feed", category: "Dashboard", description: "Chronological event log with avatars", tokens: "avatar: 32px, timestamp: relative, max-height: 400px, scroll: auto" },
  { id: "kanban-board", name: "Kanban Board", category: "Dashboard", description: "Drag-and-drop columnar board", tokens: "columns: dynamic, card-radius: 8px, drag: true, column-width: 300px" },
  { id: "bottom-tabs", name: "Mobile Tab Bar", category: "Navigation", description: "Thumb-reachable navigation for four primary destinations", tokens: "position: fixed-bottom, items: 4, height: 64px, safe-area: true" },
  { id: "command-palette", name: "Command Palette", category: "Navigation", description: "Keyboard-first searchable action dialog", tokens: "shortcut: cmd+k, width: 640px, result-height: 44px, backdrop: true" },
  { id: "file-dropzone", name: "File Dropzone", category: "Forms", description: "Drag-and-drop file input with format guidance", tokens: "border: dashed, min-height: 160px, icon-size: 32px, multi-file: optional" },
  { id: "filter-toolbar", name: "Filter Toolbar", category: "Forms", description: "Search, filter chips, count, and reset affordance", tokens: "search-height: 44px, chips: scrollable, clear-action: conditional" },
  { id: "empty-table", name: "Empty Data Table", category: "Data Display", description: "Table headers with a guided first-row empty state", tokens: "header: persistent, empty-row-height: 160px, primary-action: true" },
  { id: "mobile-list-row", name: "Mobile List Row", category: "Data Display", description: "Compact icon, label, metadata, and chevron row", tokens: "height: 64px, icon: 32px, divider: inset, badge: optional" },
  { id: "invoice-workspace", name: "Invoice Workspace", category: "Commerce", description: "Edit and print-preview workspace with pinned totals", tokens: "tabs: edit|preview, total: sticky, template-picker: true, print-ready: true" },
  { id: "profile-card", name: "Business Profile Card", category: "Content", description: "Reusable business identity and contact summary", tokens: "fields: name|company|email|address, density: compact, editable: true" },
  { id: "notification-center", name: "Notification Center", category: "Feedback", description: "Grouped notices with read state and recovery actions", tokens: "groups: date, unread-dot: true, action-position: trailing" },
  { id: "inline-error", name: "Recoverable Error", category: "Feedback", description: "Explains a browser limit and offers a useful next route", tokens: "variant: danger, local-data-note: true, actions: 2" },
  { id: "split-editor", name: "Split Editor", category: "Layout", description: "Source and preview panes that collapse to tabs on mobile", tokens: "desktop: 1fr|1fr, mobile: toggle, synchronized-scroll: true" },
  { id: "settings-list", name: "Settings List", category: "Layout", description: "Grouped local preferences with compact value rows", tokens: "sections: labelled, row-height: 52px, trailing-value: true, destructive-row: danger" },
];

export default function UISystemBlueprint() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeId, setActiveId] = useState(templates[0].id);

  const filtered = useMemo(() => {
    let result = templates;
    if (activeCategory !== "All") result = result.filter((t) => t.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }
    return result;
  }, [activeCategory, search]);

  const activeTemplate = templates.find((template) => template.id === activeId) ?? templates[0];
  const activePrompt = `Build a ${activeTemplate.name} component.\n\nPurpose: ${activeTemplate.description}\nDesign rules: ${activeTemplate.tokens}\n\nReturn an accessible, responsive implementation with explicit empty, loading, and error states.`;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exportSpec = useMemo(() => {
    const items = templates.filter((t) => selected.has(t.id));
    if (items.length === 0) return "";
    const lines = [
      "# UI System Blueprint", "",
      `Generated: ${new Date().toISOString().split("T")[0]}`,
      `Components: ${items.length}`, "",
      "---", "",
      ...items.flatMap((t) => [
        `## ${t.name}`,
        `Category: ${t.category}`,
        `Description: ${t.description}`,
        `Design Tokens: ${t.tokens}`,
        "",
      ]),
      "---",
      "",
      "## Design Tokens Summary",
      "",
      "```css",
      ":root {",
      "  --radius-sm: 8px;",
      "  --radius-md: 12px;",
      "  --radius-lg: 16px;",
      "  --transition-fast: 200ms;",
      "  --transition-base: 300ms;",
      "  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);",
      "  --shadow-md: 0 4px 12px rgba(0,0,0,0.08);",
      "}",
      "```",
    ];
    return lines.join("\n");
  }, [selected]);

  const handleCopy = async () => {
    await copyToClipboard(exportSpec);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Search + filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search templates…"
          className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none" />
        <span className="text-sm text-muted">{selected.size} selected</span>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setActiveCategory("All")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${activeCategory === "All" ? "bg-accent text-accent-fg" : "bg-surface border border-border text-muted hover:text-foreground"}`}>
          All ({templates.length})
        </button>
        {categories.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${activeCategory === cat ? "bg-accent text-accent-fg" : "bg-surface border border-border text-muted hover:text-foreground"}`}>
            {cat} ({templates.filter((t) => t.category === cat).length})
          </button>
        ))}
      </div>

      {/* Gallery + detail drawer */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid content-start gap-3 sm:grid-cols-2">
          {filtered.map((t) => (
            <button key={t.id} onClick={() => setActiveId(t.id)}
              className={`flex flex-col gap-1.5 rounded-xl border p-4 text-left transition-all ${
                activeId === t.id ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-border bg-surface hover:border-border-hover hover:-translate-y-0.5"
              }`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{t.name}</span>
                <span className={`flex h-5 w-5 items-center justify-center rounded text-xs ${selected.has(t.id) ? "bg-accent text-accent-fg" : "border border-border text-transparent"}`}>✓</span>
              </div>
              <span className="text-xs text-muted">{t.description}</span>
              <span className="mt-1 w-fit rounded bg-surface-hover px-2 py-0.5 text-[10px] font-mono text-muted">{t.category}</span>
            </button>
          ))}
        </div>
        <aside className="h-fit rounded-xl border border-accent bg-accent/5 p-4 lg:sticky lg:top-24">
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-accent">{activeTemplate.category}</p><h2 className="mt-1 text-lg font-semibold">{activeTemplate.name}</h2></div><button type="button" onClick={() => toggle(activeTemplate.id)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${selected.has(activeTemplate.id) ? "bg-accent text-accent-fg" : "border border-border bg-surface"}`}>{selected.has(activeTemplate.id) ? "Selected" : "+ Select"}</button></div>
          <div className="mt-4 flex h-28 items-center justify-center rounded-lg border border-dashed border-border bg-surface text-sm text-muted">Component preview</div>
          <p className="mt-4 text-sm leading-6 text-muted">{activeTemplate.description}</p>
          <div className="mt-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted">Rules</p><p className="mt-2 rounded-lg bg-background p-3 font-mono text-xs leading-5 text-muted">{activeTemplate.tokens}</p></div>
          <button type="button" onClick={async () => { await copyToClipboard(activePrompt); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="mt-4 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg">{copied ? "✓ Prompt copied" : "Copy AI prompt"}</button>
        </aside>
      </div>

      {/* Export */}
      {selected.size > 0 && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Export Blueprint</span>
            <div className="flex gap-2">
              <button onClick={handleCopy}
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-surface-hover">
                {copied ? "✓ Copied" : "Copy"}
              </button>
              <button onClick={() => downloadFile(exportSpec, "ui-blueprint.md", "text/markdown")}
                className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg hover:bg-accent-hover">
                Export .md
              </button>
            </div>
          </div>
          <pre className="max-h-64 overflow-y-auto rounded-lg bg-background p-4 text-xs font-mono whitespace-pre-wrap">{exportSpec}</pre>
        </div>
      )}
    </div>
  );
}
