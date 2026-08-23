"use client";

import { useState, useRef, useCallback, useEffect } from "react";

/* ── Types ───────────────────────────────────────────── */

interface BadgeConfig {
  orientation: "portrait" | "landscape";
  template: string;
  fullName: string;
  title: string;
  department: string;
  employeeId: string;
  company: string;
  email: string;
  phone: string;
  photo: string | null;
  logo: string | null;
  companyAddress: string;
  termsText: string;
}

interface LayoutResult {
  photo: { x: number; y: number; size: number; ring: string; bg: string };
  info: { x: number; y: number; align: CanvasTextAlign };
  clr: { name: string; title: string; muted: string; line: string };
}

interface CardTemplate {
  id: string;
  name: string;
  hint: string;
  preview: string;
  render: (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    portrait: boolean,
    cfg: BadgeConfig,
  ) => LayoutResult;
}

/* ── Defaults ────────────────────────────────────────── */

const defaults: BadgeConfig = {
  orientation: "portrait",
  template: "nexus",
  fullName: "John Doe",
  title: "Software Engineer",
  department: "Engineering",
  employeeId: "EMP-2024-001",
  company: "Acme Corporation",
  email: "john.doe@acme.com",
  phone: "+1 (555) 123-4567",
  photo: null,
  logo: null,
  companyAddress: "123 Business Ave, Suite 100",
  termsText: "This card is non-transferable and must be worn visibly at all times. Report lost or stolen cards to security immediately. Unauthorized use is prohibited and may result in legal action.",
};

/* ── Helpers ──────────────────────────────────────────── */

const loadImg = (src: string): Promise<HTMLImageElement> =>
  new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });

/* ── Shared Draw Functions ───────────────────────────── */

function drawPhoto(
  ctx: CanvasRenderingContext2D,
  p: LayoutResult["photo"],
  photoImg: HTMLImageElement | null,
  initials: string,
) {
  const { x, y, size: s, ring, bg } = p;
  ctx.save();
  // Ring
  ctx.beginPath();
  ctx.arc(x, y, s / 2 + 4, 0, Math.PI * 2);
  ctx.fillStyle = ring;
  ctx.fill();
  // Clip
  ctx.beginPath();
  ctx.arc(x, y, s / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  if (photoImg) {
    const a = photoImg.width / photoImg.height;
    let dw = s,
      dh = s;
    if (a > 1) dw = s * a;
    else dh = s / a;
    ctx.drawImage(photoImg, x - dw / 2, y - dh / 2, dw, dh);
  } else {
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${s / 2.2}px 'Segoe UI', system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials, x, y);
  }
  ctx.restore();
}

function drawInfoText(
  ctx: CanvasRenderingContext2D,
  info: LayoutResult["info"],
  clr: LayoutResult["clr"],
  cfg: BadgeConfig,
): number {
  let y = info.y;
  const ix = info.x;
  const isCenter = info.align === "center";
  ctx.textBaseline = "top";

  // ── Accent side bar (for left-aligned layouts) or top accent line (centered)
  if (isCenter) {
    const lineW = 50;
    ctx.strokeStyle = clr.title;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(ix - lineW, y - 8);
    ctx.lineTo(ix + lineW, y - 8);
    ctx.stroke();
  } else {
    const barH = 65;
    ctx.fillStyle = clr.title;
    ctx.fillRect(ix - 14, y, 3, barH);
  }

  // ── Full name
  ctx.textAlign = info.align;
  ctx.fillStyle = clr.name;
  ctx.font = "bold 22px 'Segoe UI', system-ui, sans-serif";
  ctx.fillText(cfg.fullName, ix, y);
  y += 30;

  // ── Title pill / badge
  ctx.font = "600 12px 'Segoe UI', system-ui, sans-serif";
  const titleW = ctx.measureText(cfg.title).width;
  const pillPadX = 10;
  const pillH = 20;
  const pillW = titleW + pillPadX * 2;
  const pillX = isCenter ? ix - pillW / 2 : ix;
  ctx.fillStyle = clr.title;
  ctx.globalAlpha = 0.15;
  roundRect(ctx, pillX, y, pillW, pillH, 10);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = clr.title;
  ctx.textAlign = isCenter ? "center" : "left";
  ctx.fillText(cfg.title, isCenter ? ix : ix + pillPadX, y + 4);
  y += pillH + 8;

  // ── Department with accent dot
  ctx.font = "13px 'Segoe UI', system-ui, sans-serif";
  ctx.fillStyle = clr.muted;
  if (isCenter) {
    ctx.textAlign = "center";
    const deptW = ctx.measureText(cfg.department).width;
    ctx.beginPath();
    ctx.arc(ix - deptW / 2 - 8, y + 7, 3, 0, Math.PI * 2);
    ctx.fillStyle = clr.title;
    ctx.fill();
    ctx.fillStyle = clr.muted;
    ctx.fillText(cfg.department, ix, y);
  } else {
    ctx.textAlign = "left";
    ctx.beginPath();
    ctx.arc(ix, y + 7, 3, 0, Math.PI * 2);
    ctx.fillStyle = clr.title;
    ctx.fill();
    ctx.fillStyle = clr.muted;
    ctx.fillText(cfg.department, ix + 10, y);
  }
  y += 26;

  // ── Divider — accent-colored center segment
  const divLen = 70;
  const accentSeg = 20;
  ctx.lineWidth = 1;
  ctx.strokeStyle = clr.line;
  ctx.beginPath();
  ctx.moveTo(ix - divLen, y);
  ctx.lineTo(ix - accentSeg / 2, y);
  ctx.stroke();
  ctx.strokeStyle = clr.title;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ix - accentSeg / 2, y);
  ctx.lineTo(ix + accentSeg / 2, y);
  ctx.stroke();
  ctx.strokeStyle = clr.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ix + accentSeg / 2, y);
  ctx.lineTo(ix + divLen, y);
  ctx.stroke();
  y += 14;

  // ── Employee ID chip with accent background
  ctx.font = "bold 11px 'Cascadia Code', 'Consolas', monospace";
  const idText = cfg.employeeId;
  const idW = ctx.measureText(idText).width;
  const chipPadX = 8;
  const chipH = 22;
  const chipW = idW + chipPadX * 2;
  const chipX = isCenter ? ix - chipW / 2 : ix;
  ctx.fillStyle = clr.title;
  ctx.globalAlpha = 0.12;
  roundRect(ctx, chipX, y, chipW, chipH, 4);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = clr.name;
  ctx.textAlign = isCenter ? "center" : "left";
  ctx.fillText(idText, isCenter ? ix : ix + chipPadX, y + 5);
  y += chipH + 12;

  // ── Contact info with icons
  ctx.font = "11px 'Segoe UI', system-ui, sans-serif";
  ctx.textAlign = info.align;
  if (cfg.email) {
    ctx.fillStyle = clr.title;
    ctx.font = "12px 'Segoe UI', system-ui, sans-serif";
    const emailIcon = "✉";
    if (isCenter) {
      const ew = ctx.measureText(cfg.email).width;
      ctx.fillText(emailIcon, ix - ew / 2 - 14, y);
    } else {
      ctx.fillText(emailIcon, ix, y);
    }
    ctx.fillStyle = clr.muted;
    ctx.font = "11px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText(cfg.email, isCenter ? ix : ix + 16, y + 1);
    y += 18;
  }
  if (cfg.phone) {
    ctx.fillStyle = clr.title;
    ctx.font = "12px 'Segoe UI', system-ui, sans-serif";
    const phoneIcon = "☎";
    if (isCenter) {
      const pw = ctx.measureText(cfg.phone).width;
      ctx.fillText(phoneIcon, ix - pw / 2 - 14, y);
    } else {
      ctx.fillText(phoneIcon, ix, y);
    }
    ctx.fillStyle = clr.muted;
    ctx.font = "11px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText(cfg.phone, isCenter ? ix : ix + 16, y + 1);
    y += 18;
  }

  // ── Decorative dots at bottom of info
  y += 6;
  ctx.fillStyle = clr.title;
  ctx.globalAlpha = 0.25;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(ix - 8 + i * 8, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  y += 10;

  return y;
}

/* Helper: rounded rectangle */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/* ── Templates ───────────────────────────────────────── */

const cardTemplates: CardTemplate[] = [
  /* ─── 1. Nexus ─── Dark panel with sinusoidal wave edge */
  {
    id: "nexus",
    name: "Nexus",
    hint: "Corporate",
    preview: "linear-gradient(to right, #0a1628 42%, #3a7bd5 42.5%, #fff 43%)",
    render: (c, W, H, p, cfg) => {
      c.fillStyle = "#fff";
      c.fillRect(0, 0, W, H);
      const pw = p ? Math.round(W * 0.42) : 220;
      const cx = pw / 2;

      // Dark panel with wave edge
      c.fillStyle = "#0a1628";
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(pw, 0);
      if (p) {
        c.quadraticCurveTo(pw + 30, H * 0.22, pw - 10, H * 0.4);
        c.quadraticCurveTo(pw - 35, H * 0.58, pw + 20, H * 0.76);
        c.quadraticCurveTo(pw + 40, H * 0.92, pw - 15, H);
      } else {
        c.quadraticCurveTo(pw + 25, H * 0.28, pw - 8, H * 0.52);
        c.quadraticCurveTo(pw - 25, H * 0.76, pw + 15, H);
      }
      c.lineTo(0, H);
      c.closePath();
      c.fill();

      // Accent stroke along wave
      c.strokeStyle = "#3a7bd5";
      c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(pw, 0);
      if (p) {
        c.quadraticCurveTo(pw + 30, H * 0.22, pw - 10, H * 0.4);
        c.quadraticCurveTo(pw - 35, H * 0.58, pw + 20, H * 0.76);
        c.quadraticCurveTo(pw + 40, H * 0.92, pw - 15, H);
      } else {
        c.quadraticCurveTo(pw + 25, H * 0.28, pw - 8, H * 0.52);
        c.quadraticCurveTo(pw - 25, H * 0.76, pw + 15, H);
      }
      c.stroke();

      // Company on dark panel
      c.fillStyle = "#e2e8f0";
      c.textAlign = "center";
      c.textBaseline = "top";
      c.font = "bold 14px 'Segoe UI', system-ui, sans-serif";
      c.fillText(cfg.company, cx, p ? 25 : 20);
      c.fillStyle = "#3a7bd5";
      c.font = "600 9px 'Segoe UI', system-ui, sans-serif";
      c.fillText("CORPORATE ID", cx, p ? 48 : 40);

      // Bottom bar
      c.fillStyle = "#3a7bd5";
      c.fillRect(0, H - 5, W, 5);

      return {
        photo: { x: cx, y: p ? 200 : H / 2, size: p ? 85 : 75, ring: "#fff", bg: "#3a7bd5" },
        info: { x: pw + (W - pw) / 2, y: p ? 100 : 30, align: "center" },
        clr: { name: "#0a1628", title: "#3a7bd5", muted: "#6b7280", line: "#e5e7eb" },
      };
    },
  },

  /* ─── 2. Crimson Wave ─── Red bezier swoosh */
  {
    id: "crimson",
    name: "Crimson Wave",
    hint: "General",
    preview: "linear-gradient(160deg, #dc2626 42%, #fca5a5 42.5%, #fff 50%)",
    render: (c, W, H, p, cfg) => {
      c.fillStyle = "#fff";
      c.fillRect(0, 0, W, H);

      if (p) {
        // Main red swoosh
        c.fillStyle = "#dc2626";
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(W, 0);
        c.lineTo(W, 90);
        c.bezierCurveTo(W * 0.6, 200, W * 0.3, 50, 0, 175);
        c.closePath();
        c.fill();

        // Accent band
        c.fillStyle = "#fca5a5";
        c.globalAlpha = 0.4;
        c.beginPath();
        c.moveTo(W, 80);
        c.bezierCurveTo(W * 0.7, 210, W * 0.2, 80, 0, 198);
        c.lineTo(0, 175);
        c.bezierCurveTo(W * 0.3, 50, W * 0.6, 200, W, 90);
        c.closePath();
        c.fill();
        c.globalAlpha = 1;

        c.fillStyle = "#fff";
        c.textAlign = "center";
        c.textBaseline = "top";
        c.font = "bold 18px 'Segoe UI', system-ui, sans-serif";
        c.fillText(cfg.company, W / 2, 20);
        c.font = "600 9px 'Segoe UI', system-ui, sans-serif";
        c.fillText("EMPLOYEE BADGE", W / 2, 46);
      } else {
        // Landscape: left red panel with curved edge
        c.fillStyle = "#dc2626";
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(200, 0);
        c.bezierCurveTo(255, H * 0.3, 165, H * 0.65, 225, H);
        c.lineTo(0, H);
        c.closePath();
        c.fill();

        c.fillStyle = "#fca5a5";
        c.globalAlpha = 0.35;
        c.beginPath();
        c.moveTo(200, 0);
        c.bezierCurveTo(265, H * 0.25, 155, H * 0.7, 235, H);
        c.lineTo(225, H);
        c.bezierCurveTo(165, H * 0.65, 255, H * 0.3, 200, 0);
        c.closePath();
        c.fill();
        c.globalAlpha = 1;

        c.fillStyle = "#fff";
        c.textAlign = "center";
        c.textBaseline = "top";
        c.font = "bold 14px 'Segoe UI', system-ui, sans-serif";
        c.fillText(cfg.company, 100, 20);
        c.font = "600 8px 'Segoe UI', system-ui, sans-serif";
        c.fillText("EMPLOYEE BADGE", 100, 40);
      }

      c.fillStyle = "#dc2626";
      c.fillRect(0, H - 5, W, 5);

      return {
        photo: { x: p ? W / 2 : 100, y: p ? 235 : H / 2, size: p ? 95 : 75, ring: "#dc2626", bg: "#dc2626" },
        info: { x: p ? W / 2 : 430, y: p ? 300 : 30, align: "center" },
        clr: { name: "#1a1a1a", title: "#dc2626", muted: "#6b7280", line: "#fecaca" },
      };
    },
  },

  /* ─── 3. Apex ─── Geometric V-chevron header */
  {
    id: "apex",
    name: "Apex",
    hint: "Security",
    preview: "linear-gradient(to bottom, #2d2d2d 48%, #ef4444 48%, #ef4444 58%, #fff 58%)",
    render: (c, W, H, p, cfg) => {
      c.fillStyle = "#fff";
      c.fillRect(0, 0, W, H);

      if (p) {
        // Dark header
        c.fillStyle = "#2d2d2d";
        c.fillRect(0, 0, W, 170);

        // Red V — left lighter, right darker for 3D fold
        c.fillStyle = "#ef4444";
        c.beginPath();
        c.moveTo(0, 155);
        c.lineTo(W / 2, 265);
        c.lineTo(0, 205);
        c.closePath();
        c.fill();

        c.fillStyle = "#dc2626";
        c.beginPath();
        c.moveTo(W, 155);
        c.lineTo(W / 2, 265);
        c.lineTo(W, 205);
        c.closePath();
        c.fill();

        // White V outline
        c.strokeStyle = "rgba(255,255,255,0.5)";
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(0, 155);
        c.lineTo(W / 2, 265);
        c.lineTo(W, 155);
        c.stroke();

        c.fillStyle = "#fff";
        c.textAlign = "center";
        c.textBaseline = "top";
        c.font = "bold 18px 'Segoe UI', system-ui, sans-serif";
        c.fillText(cfg.company, W / 2, 25);
        c.fillStyle = "#ef4444";
        c.font = "600 9px 'Segoe UI', system-ui, sans-serif";
        c.fillText("STAFF ID CARD", W / 2, 52);
      } else {
        // Landscape: dark left panel with diagonal slash edge
        c.fillStyle = "#2d2d2d";
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(195, 0);
        c.lineTo(245, H);
        c.lineTo(0, H);
        c.closePath();
        c.fill();

        // Red accent stripe along diagonal
        c.fillStyle = "#ef4444";
        c.beginPath();
        c.moveTo(195, 0);
        c.lineTo(208, 0);
        c.lineTo(258, H);
        c.lineTo(245, H);
        c.closePath();
        c.fill();

        c.fillStyle = "#fff";
        c.textAlign = "center";
        c.textBaseline = "top";
        c.font = "bold 14px 'Segoe UI', system-ui, sans-serif";
        c.fillText(cfg.company, 105, 20);
        c.fillStyle = "#ef4444";
        c.font = "600 8px 'Segoe UI', system-ui, sans-serif";
        c.fillText("STAFF ID CARD", 105, 42);
      }

      const g = c.createLinearGradient(0, H - 5, W, H);
      g.addColorStop(0, "#ef4444");
      g.addColorStop(1, "#dc2626");
      c.fillStyle = g;
      c.fillRect(0, H - 5, W, 5);

      return {
        photo: { x: p ? W / 2 : 120, y: p ? 242 : H / 2, size: p ? 80 : 75, ring: "#ef4444", bg: "#ef4444" },
        info: { x: p ? W / 2 : 450, y: p ? 298 : 30, align: "center" },
        clr: { name: "#2d2d2d", title: "#ef4444", muted: "#6b7280", line: "#fecaca" },
      };
    },
  },

  /* ─── 4. Glacier ─── Teal diagonal geometric panel */
  {
    id: "glacier",
    name: "Glacier",
    hint: "Healthcare",
    preview: "linear-gradient(140deg, #fff 38%, #0d9488 38.5%)",
    render: (c, W, H, p, cfg) => {
      c.fillStyle = "#fff";
      c.fillRect(0, 0, W, H);

      if (p) {
        // Teal diagonal panel (top-right)
        c.fillStyle = "#0d9488";
        c.beginPath();
        c.moveTo(W * 0.3, 0);
        c.lineTo(W, 0);
        c.lineTo(W, H * 0.48);
        c.lineTo(0, H * 0.16);
        c.closePath();
        c.fill();

        // Lighter accent stripe
        c.fillStyle = "#14b8a6";
        c.globalAlpha = 0.45;
        c.beginPath();
        c.moveTo(W * 0.22, 0);
        c.lineTo(W * 0.3, 0);
        c.lineTo(0, H * 0.16);
        c.lineTo(0, H * 0.1);
        c.closePath();
        c.fill();
        c.globalAlpha = 1;

        // Company on teal (upper right)
        c.fillStyle = "#fff";
        c.textAlign = "center";
        c.textBaseline = "top";
        c.font = "bold 16px 'Segoe UI', system-ui, sans-serif";
        c.fillText(cfg.company, W * 0.7, 25);
        c.font = "600 9px 'Segoe UI', system-ui, sans-serif";
        c.fillText("HEALTHCARE ID", W * 0.7, 50);
      } else {
        // Landscape: teal diagonal from top-left
        c.fillStyle = "#0d9488";
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(W * 0.42, 0);
        c.lineTo(W * 0.26, H);
        c.lineTo(0, H);
        c.closePath();
        c.fill();

        c.fillStyle = "#14b8a6";
        c.globalAlpha = 0.45;
        c.beginPath();
        c.moveTo(W * 0.42, 0);
        c.lineTo(W * 0.47, 0);
        c.lineTo(W * 0.31, H);
        c.lineTo(W * 0.26, H);
        c.closePath();
        c.fill();
        c.globalAlpha = 1;

        c.fillStyle = "#fff";
        c.textAlign = "center";
        c.textBaseline = "top";
        c.font = "bold 14px 'Segoe UI', system-ui, sans-serif";
        c.fillText(cfg.company, W * 0.15, 25);
        c.font = "600 8px 'Segoe UI', system-ui, sans-serif";
        c.fillText("HEALTHCARE ID", W * 0.15, 48);
      }

      c.fillStyle = "#0d9488";
      c.fillRect(0, H - 5, W, 5);

      return {
        photo: {
          x: p ? W / 2 : 120,
          y: p ? 210 : H / 2,
          size: p ? 90 : 80,
          ring: "#fff",
          bg: "#0d9488",
        },
        info: { x: p ? W / 2 : 430, y: p ? 272 : 30, align: "center" },
        clr: { name: "#1a1a1a", title: "#0d9488", muted: "#6b7280", line: "#99f6e4" },
      };
    },
  },

  /* ─── 5. Eclipse ─── Full dark bg with radial glow */
  {
    id: "eclipse",
    name: "Eclipse",
    hint: "Technology",
    preview: "radial-gradient(circle at 50% 40%, #7c3aed 0%, #0f0f23 70%)",
    render: (c, W, H, p, cfg) => {
      c.fillStyle = "#0f0f23";
      c.fillRect(0, 0, W, H);

      // Subtle grid
      c.strokeStyle = "#1a1a3e";
      c.lineWidth = 0.5;
      for (let x = 0; x < W; x += 30) {
        c.beginPath();
        c.moveTo(x, 0);
        c.lineTo(x, H);
        c.stroke();
      }
      for (let y = 0; y < H; y += 30) {
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(W, y);
        c.stroke();
      }

      // Radial glow
      const gx = p ? W / 2 : 150;
      const gy = p ? 200 : H / 2;
      const rg = c.createRadialGradient(gx, gy, 10, gx, gy, p ? 160 : 130);
      rg.addColorStop(0, "rgba(124, 58, 237, 0.35)");
      rg.addColorStop(0.5, "rgba(124, 58, 237, 0.08)");
      rg.addColorStop(1, "rgba(124, 58, 237, 0)");
      c.fillStyle = rg;
      c.fillRect(0, 0, W, H);

      // Company
      c.fillStyle = "#e6edf3";
      c.textAlign = "center";
      c.textBaseline = "top";
      c.font = "bold 16px 'Segoe UI', system-ui, sans-serif";
      c.fillText(cfg.company, p ? W / 2 : 150, 25);
      c.fillStyle = "#22d3ee";
      c.font = "600 9px 'Segoe UI', system-ui, sans-serif";
      c.fillText("TECH ID", p ? W / 2 : 150, 48);

      // Bottom neon bar
      c.save();
      c.shadowColor = "#22d3ee";
      c.shadowBlur = 8;
      c.fillStyle = "#22d3ee";
      c.fillRect(0, H - 3, W, 3);
      c.restore();

      return {
        photo: {
          x: p ? W / 2 : 150,
          y: p ? 200 : H / 2,
          size: p ? 90 : 80,
          ring: "#22d3ee",
          bg: "#7c3aed",
        },
        info: { x: p ? W / 2 : 430, y: p ? 265 : 30, align: "center" },
        clr: { name: "#e6edf3", title: "#22d3ee", muted: "#8b949e", line: "#30363d" },
      };
    },
  },

  /* ─── 6. Aurora ─── Multi-color gradient wave header */
  {
    id: "aurora",
    name: "Aurora",
    hint: "Creative",
    preview: "linear-gradient(to bottom, #3b82f6 0%, #8b5cf6 20%, #06b6d4 38%, #fff 38.5%)",
    render: (c, W, H, p, cfg) => {
      c.fillStyle = "#fff";
      c.fillRect(0, 0, W, H);

      const grd = c.createLinearGradient(0, 0, p ? W : 200, 0);
      grd.addColorStop(0, "#3b82f6");
      grd.addColorStop(0.5, "#8b5cf6");
      grd.addColorStop(1, "#06b6d4");

      if (p) {
        c.fillStyle = grd;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(W, 0);
        c.lineTo(W, 150);
        c.bezierCurveTo(W * 0.75, 215, W * 0.5, 140, W * 0.25, 205);
        c.quadraticCurveTo(0, 240, 0, 175);
        c.closePath();
        c.fill();
      } else {
        c.fillStyle = grd;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(210, 0);
        c.bezierCurveTo(245, H * 0.3, 180, H * 0.65, 225, H);
        c.lineTo(0, H);
        c.closePath();
        c.fill();
      }

      c.fillStyle = "#fff";
      c.textAlign = "center";
      c.textBaseline = "top";
      c.font = "bold 16px 'Segoe UI', system-ui, sans-serif";
      c.fillText(cfg.company, p ? W / 2 : 105, 20);
      c.font = "600 9px 'Segoe UI', system-ui, sans-serif";
      c.fillText("CREATIVE ID", p ? W / 2 : 105, 44);

      // Bottom gradient bar
      c.fillStyle = grd;
      c.fillRect(0, H - 5, W, 5);

      return {
        photo: {
          x: p ? W / 2 : 105,
          y: p ? 210 : H / 2,
          size: p ? 90 : 80,
          ring: "#8b5cf6",
          bg: "#8b5cf6",
        },
        info: { x: p ? W / 2 : 430, y: p ? 275 : 30, align: "center" },
        clr: { name: "#1a1a1a", title: "#7c3aed", muted: "#6b7280", line: "#e9d5ff" },
      };
    },
  },

  /* ─── 7. Monolith ─── Minimal black bar + gold accent */
  {
    id: "monolith",
    name: "Monolith",
    hint: "Executive",
    preview: "linear-gradient(to right, #111827 6%, #d4af37 6.5%, #d4af37 7.5%, #fff 8%)",
    render: (c, W, H, p, cfg) => {
      c.fillStyle = "#fff";
      c.fillRect(0, 0, W, H);

      if (p) {
        // Vertical black bar + gold line
        c.fillStyle = "#111827";
        c.fillRect(0, 0, 14, H);
        c.fillStyle = "#d4af37";
        c.fillRect(14, 0, 2.5, H);
        // Bottom bar
        c.fillStyle = "#d4af37";
        c.fillRect(0, H - 7, W, 2);
        c.fillStyle = "#111827";
        c.fillRect(0, H - 5, W, 5);
      } else {
        // Horizontal top bar + gold line
        c.fillStyle = "#111827";
        c.fillRect(0, 0, W, 14);
        c.fillStyle = "#d4af37";
        c.fillRect(0, 14, W, 2.5);
        c.fillStyle = "#d4af37";
        c.fillRect(0, H - 7, W, 2);
        c.fillStyle = "#111827";
        c.fillRect(0, H - 5, W, 5);
      }

      // Company
      c.fillStyle = "#111827";
      c.textAlign = p ? "left" : "center";
      c.textBaseline = "top";
      c.font = "bold 16px 'Segoe UI', system-ui, sans-serif";
      c.fillText(cfg.company, p ? 32 : W / 2, p ? 30 : 28);
      c.fillStyle = "#d4af37";
      c.font = "600 9px 'Segoe UI', system-ui, sans-serif";
      c.fillText("EXECUTIVE", p ? 32 : W / 2, p ? 52 : 50);

      return {
        photo: {
          x: p ? W / 2 : 180,
          y: p ? 175 : H / 2,
          size: p ? 95 : 80,
          ring: "#d4af37",
          bg: "#111827",
        },
        info: { x: p ? W / 2 : 420, y: p ? 240 : 45, align: "center" },
        clr: { name: "#111827", title: "#d4af37", muted: "#6b7280", line: "#e5e7eb" },
      };
    },
  },

  /* ─── 8. Ember ─── Warm gradient with organic curve */
  {
    id: "ember",
    name: "Ember",
    hint: "Hospitality",
    preview: "linear-gradient(160deg, #f59e0b 40%, #f97316 40.5%, #fefce8 55%)",
    render: (c, W, H, p, cfg) => {
      // Warm body tint
      c.fillStyle = "#fefce8";
      c.fillRect(0, 0, W, H);

      const grd = p
        ? c.createLinearGradient(0, 0, W, 160)
        : c.createLinearGradient(0, 0, 0, H);
      grd.addColorStop(0, "#f59e0b");
      grd.addColorStop(1, "#f97316");

      if (p) {
        c.fillStyle = grd;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(W, 0);
        c.lineTo(W, 140);
        c.quadraticCurveTo(W * 0.5, 225, 0, 148);
        c.closePath();
        c.fill();
      } else {
        c.fillStyle = grd;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(200, 0);
        c.quadraticCurveTo(245, H * 0.5, 200, H);
        c.lineTo(0, H);
        c.closePath();
        c.fill();
      }

      c.fillStyle = "#fff";
      c.textAlign = "center";
      c.textBaseline = "top";
      c.font = "bold 16px 'Segoe UI', system-ui, sans-serif";
      c.fillText(cfg.company, p ? W / 2 : 100, 20);
      c.font = "600 9px 'Segoe UI', system-ui, sans-serif";
      c.fillText("HOSPITALITY", p ? W / 2 : 100, 44);

      // Bottom warm bar
      c.fillStyle = grd;
      c.fillRect(0, H - 5, W, 5);

      return {
        photo: {
          x: p ? W / 2 : 100,
          y: p ? 195 : H / 2,
          size: p ? 90 : 80,
          ring: "#f59e0b",
          bg: "#f59e0b",
        },
        info: { x: p ? W / 2 : 430, y: p ? 260 : 30, align: "center" },
        clr: { name: "#451a03", title: "#ea580c", muted: "#92400e", line: "#fde68a" },
      };
    },
  },

  /* ─── 9. Horizon ─── Dual gradient bands top & bottom */
  {
    id: "horizon",
    name: "Horizon",
    hint: "Education",
    preview: "linear-gradient(to bottom, #4338ca 18%, #fff 18.5%, #fff 82%, #4338ca 82.5%)",
    render: (c, W, H, p, cfg) => {
      c.fillStyle = "#fff";
      c.fillRect(0, 0, W, H);

      const grd = c.createLinearGradient(0, 0, W, 0);
      grd.addColorStop(0, "#4338ca");
      grd.addColorStop(1, "#6366f1");

      if (p) {
        // Top band
        c.fillStyle = grd;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(W, 0);
        c.lineTo(W, 105);
        c.quadraticCurveTo(W / 2, 140, 0, 105);
        c.closePath();
        c.fill();
        // Bottom band
        c.beginPath();
        c.moveTo(0, H);
        c.lineTo(W, H);
        c.lineTo(W, H - 65);
        c.quadraticCurveTo(W / 2, H - 95, 0, H - 65);
        c.closePath();
        c.fill();
      } else {
        c.fillStyle = grd;
        c.fillRect(0, 0, W, 50);
        c.fillRect(0, H - 40, W, 40);
        // Curved edges
        c.fillStyle = "#fff";
        c.beginPath();
        c.moveTo(0, 50);
        c.quadraticCurveTo(W / 2, 75, W, 50);
        c.lineTo(W, 50);
        c.lineTo(0, 50);
        c.closePath();
        c.fill();
      }

      c.fillStyle = "#fff";
      c.textAlign = "center";
      c.textBaseline = "top";
      c.font = "bold 16px 'Segoe UI', system-ui, sans-serif";
      c.fillText(cfg.company, p ? W / 2 : W / 2, p ? 18 : 12);
      c.font = "600 9px 'Segoe UI', system-ui, sans-serif";
      c.fillText("EDUCATION ID", p ? W / 2 : W / 2, p ? 42 : 30);

      return {
        photo: { x: W / 2, y: p ? 180 : H / 2 - 15, size: p ? 90 : 80, ring: "#4338ca", bg: "#4338ca" },
        info: { x: W / 2, y: p ? 245 : H / 2 + 40, align: "center" },
        clr: { name: "#1e1b4b", title: "#6366f1", muted: "#6b7280", line: "#c7d2fe" },
      };
    },
  },

  /* ─── 10. Pulse ─── Concentric rings on dark background */
  {
    id: "pulse",
    name: "Pulse",
    hint: "Fitness",
    preview: "radial-gradient(circle at 50% 45%, transparent 15%, #10b981 16%, transparent 17%, transparent 30%, #10b981 31%, transparent 32%, #064e3b 90%)",
    render: (c, W, H, p, cfg) => {
      c.fillStyle = "#022c22";
      c.fillRect(0, 0, W, H);

      const cx = p ? W / 2 : 150;
      const cy = p ? 210 : H / 2;

      // Concentric rings
      for (let i = 5; i >= 1; i--) {
        c.beginPath();
        c.arc(cx, cy, i * (p ? 35 : 28), 0, Math.PI * 2);
        c.strokeStyle = `rgba(16, 185, 129, ${0.08 + i * 0.04})`;
        c.lineWidth = 1.5;
        c.stroke();
      }

      // Glow
      const rg = c.createRadialGradient(cx, cy, 5, cx, cy, p ? 100 : 80);
      rg.addColorStop(0, "rgba(16, 185, 129, 0.2)");
      rg.addColorStop(1, "rgba(16, 185, 129, 0)");
      c.fillStyle = rg;
      c.fillRect(0, 0, W, H);

      c.fillStyle = "#d1fae5";
      c.textAlign = "center";
      c.textBaseline = "top";
      c.font = "bold 16px 'Segoe UI', system-ui, sans-serif";
      c.fillText(cfg.company, p ? W / 2 : 150, 25);
      c.fillStyle = "#10b981";
      c.font = "600 9px 'Segoe UI', system-ui, sans-serif";
      c.fillText("FITNESS ID", p ? W / 2 : 150, 48);

      c.save();
      c.shadowColor = "#10b981";
      c.shadowBlur = 6;
      c.fillStyle = "#10b981";
      c.fillRect(0, H - 3, W, 3);
      c.restore();

      return {
        photo: { x: cx, y: cy, size: p ? 85 : 75, ring: "#10b981", bg: "#065f46" },
        info: { x: p ? W / 2 : 430, y: p ? 272 : 30, align: "center" },
        clr: { name: "#d1fae5", title: "#10b981", muted: "#6ee7b7", line: "#064e3b" },
      };
    },
  },

  /* ─── 11. Prism ─── Rainbow diagonal stripes in corner */
  {
    id: "prism",
    name: "Prism",
    hint: "Events",
    preview: "linear-gradient(135deg, #ef4444 8%, #f59e0b 16%, #22c55e 24%, #3b82f6 32%, #8b5cf6 40%, #fff 40.5%)",
    render: (c, W, H, p, cfg) => {
      c.fillStyle = "#fff";
      c.fillRect(0, 0, W, H);

      const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];
      const sw = p ? 14 : 12;

      if (p) {
        // Rainbow stripes from top-right corner
        c.save();
        c.beginPath();
        c.moveTo(W * 0.2, 0);
        c.lineTo(W, 0);
        c.lineTo(W, H * 0.55);
        c.closePath();
        c.clip();
        colors.forEach((col, i) => {
          c.fillStyle = col;
          c.save();
          c.translate(W * 0.2 + i * sw * 1.8, 0);
          c.rotate(Math.atan2(H * 0.55, W * 0.8));
          c.fillRect(0, -5, sw, H);
          c.restore();
        });
        c.restore();
      } else {
        c.save();
        c.beginPath();
        c.moveTo(W * 0.55, 0);
        c.lineTo(W, 0);
        c.lineTo(W, H);
        c.lineTo(W * 0.7, H);
        c.closePath();
        c.clip();
        colors.forEach((col, i) => {
          c.fillStyle = col;
          c.save();
          c.translate(W * 0.55 + i * sw * 1.7, 0);
          c.rotate(Math.atan2(H, W * 0.3));
          c.fillRect(0, -5, sw, W);
          c.restore();
        });
        c.restore();
      }

      c.fillStyle = "#1a1a1a";
      c.textAlign = p ? "left" : "left";
      c.textBaseline = "top";
      c.font = "bold 16px 'Segoe UI', system-ui, sans-serif";
      c.fillText(cfg.company, p ? 25 : 25, p ? 25 : 20);
      c.fillStyle = "#8b5cf6";
      c.font = "600 9px 'Segoe UI', system-ui, sans-serif";
      c.fillText("EVENTS PASS", p ? 25 : 25, p ? 48 : 42);

      c.fillStyle = "#8b5cf6";
      c.fillRect(0, H - 5, W, 5);

      return {
        photo: { x: p ? W * 0.3 : 160, y: p ? 200 : H / 2, size: p ? 90 : 80, ring: "#8b5cf6", bg: "#8b5cf6" },
        info: { x: p ? W / 2 : W / 2 - 50, y: p ? 265 : 30, align: "center" },
        clr: { name: "#1a1a1a", title: "#7c3aed", muted: "#6b7280", line: "#e9d5ff" },
      };
    },
  },

  /* ─── 12. Zenith ─── Semicircular dome header */
  {
    id: "zenith",
    name: "Zenith",
    hint: "Government",
    preview: "radial-gradient(ellipse 100% 60% at 50% 0%, #1e3a5f 55%, #fff 55.5%)",
    render: (c, W, H, p, cfg) => {
      c.fillStyle = "#fff";
      c.fillRect(0, 0, W, H);

      const grd = c.createLinearGradient(0, 0, W, 0);
      grd.addColorStop(0, "#1e3a5f");
      grd.addColorStop(1, "#2563eb");

      if (p) {
        c.fillStyle = grd;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(W, 0);
        c.lineTo(W, 120);
        c.quadraticCurveTo(W / 2, 250, 0, 120);
        c.closePath();
        c.fill();
      } else {
        c.fillStyle = grd;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(W, 0);
        c.lineTo(W, 80);
        c.quadraticCurveTo(W / 2, 180, 0, 80);
        c.closePath();
        c.fill();
      }

      // Gold seal
      c.save();
      c.globalAlpha = 0.25;
      c.strokeStyle = "#c9a84c";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(p ? W / 2 : W / 2, p ? 50 : 35, 22, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = "#c9a84c";
      c.font = "18px serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText("★", p ? W / 2 : W / 2, p ? 50 : 35);
      c.restore();

      c.fillStyle = "#fff";
      c.textAlign = "center";
      c.textBaseline = "top";
      c.font = "bold 15px 'Segoe UI', system-ui, sans-serif";
      c.fillText(cfg.company, W / 2, p ? 80 : 58);
      c.font = "600 8px 'Segoe UI', system-ui, sans-serif";
      c.fillText("GOVERNMENT ID", W / 2, p ? 100 : 76);

      c.fillStyle = grd;
      c.fillRect(0, H - 5, W, 5);

      return {
        photo: { x: W / 2, y: p ? 215 : H / 2 + 20, size: p ? 90 : 75, ring: "#2563eb", bg: "#1e3a5f" },
        info: { x: W / 2, y: p ? 280 : H / 2 + 65, align: "center" },
        clr: { name: "#1e3a5f", title: "#2563eb", muted: "#6b7280", line: "#bfdbfe" },
      };
    },
  },

  /* ─── 13. Cascade ─── Layered offset panels */
  {
    id: "cascade",
    name: "Cascade",
    hint: "Media",
    preview: "linear-gradient(145deg, #0ea5e9 0%, #0ea5e9 25%, #0284c7 25.5%, #0284c7 45%, #0369a1 45.5%, #0369a1 60%, #fff 60.5%)",
    render: (c, W, H, p, cfg) => {
      c.fillStyle = "#fff";
      c.fillRect(0, 0, W, H);

      const layers = [
        { color: "#0369a1", offset: p ? 50 : 35 },
        { color: "#0284c7", offset: p ? 30 : 20 },
        { color: "#0ea5e9", offset: p ? 10 : 5 },
      ];

      if (p) {
        layers.forEach(({ color, offset }) => {
          c.fillStyle = color;
          c.beginPath();
          c.moveTo(0, 0);
          c.lineTo(W - offset, 0);
          c.lineTo(W - offset - 60, H * 0.42);
          c.lineTo(0, H * 0.42 - offset * 0.5);
          c.closePath();
          c.fill();
        });
      } else {
        layers.forEach(({ color, offset }) => {
          c.fillStyle = color;
          c.beginPath();
          c.moveTo(0, 0);
          c.lineTo(W * 0.4 - offset, 0);
          c.lineTo(W * 0.35 - offset, H);
          c.lineTo(0, H);
          c.closePath();
          c.fill();
        });
      }

      c.fillStyle = "#fff";
      c.textAlign = "center";
      c.textBaseline = "top";
      c.font = "bold 15px 'Segoe UI', system-ui, sans-serif";
      c.fillText(cfg.company, p ? W * 0.35 : W * 0.15, p ? 20 : 20);
      c.fillStyle = "#bae6fd";
      c.font = "600 9px 'Segoe UI', system-ui, sans-serif";
      c.fillText("MEDIA PASS", p ? W * 0.35 : W * 0.15, p ? 42 : 42);

      c.fillStyle = "#0ea5e9";
      c.fillRect(0, H - 5, W, 5);

      return {
        photo: { x: p ? W * 0.35 : W * 0.15, y: p ? 160 : H / 2, size: p ? 85 : 75, ring: "#fff", bg: "#0284c7" },
        info: { x: p ? W / 2 : 430, y: p ? 225 : 30, align: "center" },
        clr: { name: "#0c4a6e", title: "#0ea5e9", muted: "#6b7280", line: "#bae6fd" },
      };
    },
  },

  /* ─── 14. Circuit ─── Circuit-board pattern on dark */
  {
    id: "circuit",
    name: "Circuit",
    hint: "Engineering",
    preview: "linear-gradient(135deg, #052e16 50%, #00ff4120 50.5%, #052e16 55%)",
    render: (c, W, H, p, cfg) => {
      c.fillStyle = "#052e16";
      c.fillRect(0, 0, W, H);

      // Circuit traces
      c.strokeStyle = "#166534";
      c.lineWidth = 1;
      const step = 30;
      // Horizontal traces
      for (let y = step; y < H; y += step) {
        c.beginPath();
        c.moveTo(0, y);
        for (let x = 0; x < W; x += step) {
          const jog = ((x + y) * 7) % 5 === 0 ? step / 3 : 0;
          c.lineTo(x, y + jog);
        }
        c.stroke();
      }
      // Node dots
      c.fillStyle = "#22c55e";
      for (let x = step; x < W; x += step * 2) {
        for (let y = step; y < H; y += step * 2) {
          if (((x * y) % 7) < 3) {
            c.beginPath();
            c.arc(x, y, 2, 0, Math.PI * 2);
            c.fill();
          }
        }
      }

      // Terminal green glow bar
      c.save();
      c.shadowColor = "#22c55e";
      c.shadowBlur = 10;
      c.fillStyle = "#22c55e";
      c.fillRect(p ? 0 : 0, p ? H * 0.35 : 0, p ? W : W, p ? 2 : 2);
      c.restore();

      c.fillStyle = "#bbf7d0";
      c.textAlign = "center";
      c.textBaseline = "top";
      c.font = "bold 15px 'Cascadia Code', 'Consolas', monospace";
      c.fillText(cfg.company, p ? W / 2 : 130, 22);
      c.fillStyle = "#22c55e";
      c.font = "600 9px 'Cascadia Code', 'Consolas', monospace";
      c.fillText("ENGINEERING", p ? W / 2 : 130, 44);

      c.save();
      c.shadowColor = "#22c55e";
      c.shadowBlur = 6;
      c.fillStyle = "#22c55e";
      c.fillRect(0, H - 3, W, 3);
      c.restore();

      return {
        photo: { x: p ? W / 2 : 130, y: p ? 200 : H / 2, size: p ? 85 : 75, ring: "#22c55e", bg: "#166534" },
        info: { x: p ? W / 2 : 420, y: p ? 262 : 30, align: "center" },
        clr: { name: "#bbf7d0", title: "#22c55e", muted: "#86efac", line: "#14532d" },
      };
    },
  },

  /* ─── 15. Royal ─── Deep purple with gold corner brackets */
  {
    id: "royal",
    name: "Royal",
    hint: "Luxury",
    preview: "linear-gradient(135deg, #581c87 0%, #7e22ce 100%)",
    render: (c, W, H, p, cfg) => {
      const grd = c.createLinearGradient(0, 0, W, H);
      grd.addColorStop(0, "#581c87");
      grd.addColorStop(1, "#7e22ce");
      c.fillStyle = grd;
      c.fillRect(0, 0, W, H);

      // Gold corner brackets
      c.strokeStyle = "#d4af37";
      c.lineWidth = 2.5;
      const m = 18, blen = 50;
      // Top-left
      c.beginPath();
      c.moveTo(m, m + blen);
      c.lineTo(m, m);
      c.lineTo(m + blen, m);
      c.stroke();
      // Top-right
      c.beginPath();
      c.moveTo(W - m - blen, m);
      c.lineTo(W - m, m);
      c.lineTo(W - m, m + blen);
      c.stroke();
      // Bottom-left
      c.beginPath();
      c.moveTo(m, H - m - blen);
      c.lineTo(m, H - m);
      c.lineTo(m + blen, H - m);
      c.stroke();
      // Bottom-right
      c.beginPath();
      c.moveTo(W - m - blen, H - m);
      c.lineTo(W - m, H - m);
      c.lineTo(W - m, H - m - blen);
      c.stroke();

      // Subtle inner border
      c.strokeStyle = "rgba(212, 175, 55, 0.15)";
      c.lineWidth = 1;
      c.strokeRect(m + 8, m + 8, W - (m + 8) * 2, H - (m + 8) * 2);

      c.fillStyle = "#f3e8ff";
      c.textAlign = "center";
      c.textBaseline = "top";
      c.font = "bold 16px 'Segoe UI', system-ui, sans-serif";
      c.fillText(cfg.company, W / 2, p ? 55 : 30);
      c.fillStyle = "#d4af37";
      c.font = "600 9px 'Segoe UI', system-ui, sans-serif";
      c.fillText("VIP / LUXURY", W / 2, p ? 78 : 50);

      return {
        photo: { x: W / 2, y: p ? 195 : H / 2, size: p ? 90 : 75, ring: "#d4af37", bg: "#581c87" },
        info: { x: W / 2, y: p ? 260 : H / 2 + 48, align: "center" },
        clr: { name: "#f3e8ff", title: "#d4af37", muted: "#c4b5fd", line: "#581c87" },
      };
    },
  },

  /* ─── 16. Slate ─── Clean grey gradient, professional */
  {
    id: "slate",
    name: "Slate",
    hint: "Finance",
    preview: "linear-gradient(to bottom, #334155 45%, #94a3b8 45.5%, #fff 46%)",
    render: (c, W, H, p, cfg) => {
      c.fillStyle = "#f8fafc";
      c.fillRect(0, 0, W, H);

      const grd = c.createLinearGradient(0, 0, W, 0);
      grd.addColorStop(0, "#1e293b");
      grd.addColorStop(1, "#334155");

      if (p) {
        c.fillStyle = grd;
        c.fillRect(0, 0, W, 165);
        // Subtle horizontal lines
        c.strokeStyle = "rgba(255,255,255,0.06)";
        c.lineWidth = 1;
        for (let y = 12; y < 165; y += 12) {
          c.beginPath();
          c.moveTo(0, y);
          c.lineTo(W, y);
          c.stroke();
        }
        // Accent line
        c.fillStyle = "#3b82f6";
        c.fillRect(0, 165, W, 3);
      } else {
        c.fillStyle = grd;
        c.fillRect(0, 0, 200, H);
        c.strokeStyle = "rgba(255,255,255,0.06)";
        c.lineWidth = 1;
        for (let y = 12; y < H; y += 12) {
          c.beginPath();
          c.moveTo(0, y);
          c.lineTo(200, y);
          c.stroke();
        }
        c.fillStyle = "#3b82f6";
        c.fillRect(200, 0, 3, H);
      }

      c.fillStyle = "#e2e8f0";
      c.textAlign = "center";
      c.textBaseline = "top";
      c.font = "bold 15px 'Segoe UI', system-ui, sans-serif";
      c.fillText(cfg.company, p ? W / 2 : 100, p ? 25 : 20);
      c.fillStyle = "#94a3b8";
      c.font = "600 9px 'Segoe UI', system-ui, sans-serif";
      c.fillText("FINANCE", p ? W / 2 : 100, p ? 48 : 42);

      c.fillStyle = "#1e293b";
      c.fillRect(0, H - 5, W, 5);

      return {
        photo: { x: p ? W / 2 : 100, y: p ? 215 : H / 2 + 10, size: p ? 85 : 75, ring: "#3b82f6", bg: "#334155" },
        info: { x: p ? W / 2 : 420, y: p ? 278 : 30, align: "center" },
        clr: { name: "#1e293b", title: "#3b82f6", muted: "#64748b", line: "#cbd5e1" },
      };
    },
  },

  /* ─── 17. Coral Reef ─── Ocean gradient with coral accent */
  {
    id: "coral",
    name: "Coral Reef",
    hint: "Marine",
    preview: "linear-gradient(to bottom, #0c4a6e 0%, #0891b2 40%, #f97316 41%, #f97316 43%, #fff 43.5%)",
    render: (c, W, H, p, cfg) => {
      c.fillStyle = "#fff";
      c.fillRect(0, 0, W, H);

      if (p) {
        // Ocean gradient header
        const grd = c.createLinearGradient(0, 0, 0, 180);
        grd.addColorStop(0, "#0c4a6e");
        grd.addColorStop(0.6, "#0891b2");
        grd.addColorStop(1, "#22d3ee");
        c.fillStyle = grd;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(W, 0);
        c.lineTo(W, 145);
        // Wavy bottom like ocean surface
        c.bezierCurveTo(W * 0.8, 175, W * 0.6, 135, W * 0.4, 170);
        c.bezierCurveTo(W * 0.2, 195, W * 0.1, 155, 0, 165);
        c.closePath();
        c.fill();
        // Coral accent stripe
        c.fillStyle = "#f97316";
        c.fillRect(0, 0, 5, 180);
      } else {
        const grd = c.createLinearGradient(0, 0, 220, 0);
        grd.addColorStop(0, "#0c4a6e");
        grd.addColorStop(0.7, "#0891b2");
        grd.addColorStop(1, "#22d3ee");
        c.fillStyle = grd;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(200, 0);
        c.bezierCurveTo(230, H * 0.3, 190, H * 0.6, 215, H);
        c.lineTo(0, H);
        c.closePath();
        c.fill();
        c.fillStyle = "#f97316";
        c.fillRect(0, 0, 5, H);
      }

      c.fillStyle = "#fff";
      c.textAlign = "center";
      c.textBaseline = "top";
      c.font = "bold 16px 'Segoe UI', system-ui, sans-serif";
      c.fillText(cfg.company, p ? W / 2 : 110, p ? 22 : 20);
      c.fillStyle = "#f97316";
      c.font = "600 9px 'Segoe UI', system-ui, sans-serif";
      c.fillText("MARINE ID", p ? W / 2 : 110, p ? 46 : 42);

      c.fillStyle = "#0891b2";
      c.fillRect(0, H - 5, W, 5);

      return {
        photo: { x: p ? W / 2 : 110, y: p ? 215 : H / 2, size: p ? 90 : 78, ring: "#f97316", bg: "#0891b2" },
        info: { x: p ? W / 2 : 430, y: p ? 278 : 30, align: "center" },
        clr: { name: "#0c4a6e", title: "#0891b2", muted: "#6b7280", line: "#a5f3fc" },
      };
    },
  },

  /* ─── 18. Forge ─── Gunmetal with orange sparks */
  {
    id: "forge",
    name: "Forge",
    hint: "Industrial",
    preview: "linear-gradient(135deg, #292524 45%, #f97316 45.5%, #f97316 48%, #44403c 48.5%)",
    render: (c, W, H, p, cfg) => {
      c.fillStyle = "#1c1917";
      c.fillRect(0, 0, W, H);

      // Brushed-metal horizontal lines
      c.strokeStyle = "rgba(255,255,255,0.03)";
      c.lineWidth = 1;
      for (let y = 0; y < H; y += 4) {
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(W, y);
        c.stroke();
      }

      // Orange diagonal accent
      if (p) {
        c.fillStyle = "#f97316";
        c.beginPath();
        c.moveTo(0, H * 0.32);
        c.lineTo(W, H * 0.28);
        c.lineTo(W, H * 0.28 + 6);
        c.lineTo(0, H * 0.32 + 6);
        c.closePath();
        c.fill();
        // Secondary thinner stripe
        c.globalAlpha = 0.4;
        c.beginPath();
        c.moveTo(0, H * 0.32 + 14);
        c.lineTo(W, H * 0.28 + 14);
        c.lineTo(W, H * 0.28 + 17);
        c.lineTo(0, H * 0.32 + 17);
        c.closePath();
        c.fill();
        c.globalAlpha = 1;
      } else {
        c.fillStyle = "#f97316";
        c.beginPath();
        c.moveTo(210, 0);
        c.lineTo(216, 0);
        c.lineTo(216, H);
        c.lineTo(210, H);
        c.closePath();
        c.fill();
        c.globalAlpha = 0.4;
        c.fillRect(222, 0, 3, H);
        c.globalAlpha = 1;
      }

      c.fillStyle = "#e7e5e4";
      c.textAlign = "center";
      c.textBaseline = "top";
      c.font = "bold 16px 'Segoe UI', system-ui, sans-serif";
      c.fillText(cfg.company, p ? W / 2 : 105, p ? 25 : 20);
      c.fillStyle = "#f97316";
      c.font = "600 9px 'Segoe UI', system-ui, sans-serif";
      c.fillText("INDUSTRIAL", p ? W / 2 : 105, p ? 48 : 42);

      c.fillStyle = "#f97316";
      c.fillRect(0, H - 4, W, 4);

      return {
        photo: { x: p ? W / 2 : 105, y: p ? 155 : H / 2, size: p ? 80 : 75, ring: "#f97316", bg: "#44403c" },
        info: { x: p ? W / 2 : 430, y: p ? 375 : 30, align: "center" },
        clr: { name: "#e7e5e4", title: "#f97316", muted: "#a8a29e", line: "#44403c" },
      };
    },
  },

  /* ─── 19. Bloom ─── Soft rose gradient with petal circles */
  {
    id: "bloom",
    name: "Bloom",
    hint: "Beauty",
    preview: "linear-gradient(to bottom, #e11d48 0%, #f43f5e 35%, #fff1f2 35.5%)",
    render: (c, W, H, p, cfg) => {
      c.fillStyle = "#fff1f2";
      c.fillRect(0, 0, W, H);

      const grd = p
        ? c.createLinearGradient(0, 0, W, 180)
        : c.createLinearGradient(0, 0, 210, H);
      grd.addColorStop(0, "#e11d48");
      grd.addColorStop(1, "#f43f5e");

      if (p) {
        c.fillStyle = grd;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(W, 0);
        c.lineTo(W, 150);
        c.quadraticCurveTo(W * 0.65, 200, W * 0.35, 165);
        c.quadraticCurveTo(0, 135, 0, 175);
        c.closePath();
        c.fill();

        // Petal circles (decorative overlapping circles)
        c.save();
        c.globalAlpha = 0.08;
        c.fillStyle = "#fff";
        c.beginPath();
        c.arc(W * 0.15, 90, 55, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.arc(W * 0.85, 60, 45, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.arc(W * 0.6, 25, 35, 0, Math.PI * 2);
        c.fill();
        c.restore();
      } else {
        c.fillStyle = grd;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(200, 0);
        c.quadraticCurveTo(235, H * 0.5, 195, H);
        c.lineTo(0, H);
        c.closePath();
        c.fill();

        c.save();
        c.globalAlpha = 0.08;
        c.fillStyle = "#fff";
        c.beginPath();
        c.arc(50, H * 0.25, 45, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.arc(150, H * 0.75, 35, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }

      c.fillStyle = "#fff";
      c.textAlign = "center";
      c.textBaseline = "top";
      c.font = "bold 16px 'Segoe UI', system-ui, sans-serif";
      c.fillText(cfg.company, p ? W / 2 : 100, p ? 22 : 18);
      c.font = "600 9px 'Segoe UI', system-ui, sans-serif";
      c.fillText("BEAUTY & SPA", p ? W / 2 : 100, p ? 44 : 38);

      c.fillStyle = grd;
      c.fillRect(0, H - 5, W, 5);

      return {
        photo: { x: p ? W / 2 : 100, y: p ? 200 : H / 2, size: p ? 88 : 78, ring: "#e11d48", bg: "#e11d48" },
        info: { x: p ? W / 2 : 420, y: p ? 264 : 30, align: "center" },
        clr: { name: "#881337", title: "#e11d48", muted: "#9f1239", line: "#fecdd3" },
      };
    },
  },

  /* ─── 20. Vertex ─── Sharp angular triangle cut */
  {
    id: "vertex",
    name: "Vertex",
    hint: "Architecture",
    preview: "linear-gradient(to bottom right, #18181b 48%, #a855f7 48.5%, #a855f7 51%, #fff 51.5%)",
    render: (c, W, H, p, cfg) => {
      c.fillStyle = "#fafafa";
      c.fillRect(0, 0, W, H);

      if (p) {
        // Large dark triangle from top-left
        c.fillStyle = "#18181b";
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(W, 0);
        c.lineTo(0, H * 0.6);
        c.closePath();
        c.fill();

        // Purple accent line along hypotenuse
        c.strokeStyle = "#a855f7";
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(W, 0);
        c.lineTo(0, H * 0.6);
        c.stroke();

        // Secondary thin line
        c.strokeStyle = "rgba(168, 85, 247, 0.3)";
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(W, 12);
        c.lineTo(12, H * 0.6 + 5);
        c.stroke();
      } else {
        c.fillStyle = "#18181b";
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(W * 0.55, 0);
        c.lineTo(0, H);
        c.closePath();
        c.fill();

        c.strokeStyle = "#a855f7";
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(W * 0.55, 0);
        c.lineTo(0, H);
        c.stroke();

        c.strokeStyle = "rgba(168, 85, 247, 0.3)";
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(W * 0.55 + 12, 0);
        c.lineTo(12, H);
        c.stroke();
      }

      c.fillStyle = "#e4e4e7";
      c.textAlign = p ? "left" : "left";
      c.textBaseline = "top";
      c.font = "bold 15px 'Segoe UI', system-ui, sans-serif";
      c.fillText(cfg.company, p ? 22 : 22, p ? 22 : 20);
      c.fillStyle = "#a855f7";
      c.font = "600 9px 'Segoe UI', system-ui, sans-serif";
      c.fillText("ARCHITECTURE", p ? 22 : 22, p ? 44 : 42);

      c.fillStyle = "#a855f7";
      c.fillRect(0, H - 4, W, 4);

      return {
        photo: { x: p ? W * 0.65 : W * 0.7, y: p ? 240 : H / 2, size: p ? 88 : 80, ring: "#a855f7", bg: "#18181b" },
        info: { x: p ? W * 0.65 : W * 0.7, y: p ? 302 : H / 2 + 50, align: "center" },
        clr: { name: "#18181b", title: "#a855f7", muted: "#71717a", line: "#d4d4d8" },
      };
    },
  },
];

/* ── Main Render ─────────────────────────────────────── */

function renderCard(
  canvas: HTMLCanvasElement,
  config: BadgeConfig,
  tmpl: CardTemplate,
  photoImg: HTMLImageElement | null,
  logoImg: HTMLImageElement | null,
) {
  const ctx = canvas.getContext("2d")!;
  const p = config.orientation === "portrait";
  const W = p ? 400 : 640;
  const H = p ? 600 : 400;
  canvas.width = W;
  canvas.height = H;

  const layout = tmpl.render(ctx, W, H, p, config);

  // ── Logo at top-right corner
  if (logoImg) {
    const maxH = 28;
    const aspect = logoImg.width / logoImg.height;
    const lh = maxH;
    const lw = Math.min(lh * aspect, 80);
    ctx.drawImage(logoImg, W - lw - 14, 10, lw, lh);
  }

  const initials = config.fullName
    .split(" ")
    .map((n) => n.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");

  drawPhoto(ctx, layout.photo, photoImg, initials);
  drawInfoText(ctx, layout.info, layout.clr, config);

  // ── Bottom accent bar
  ctx.fillStyle = layout.clr.title;
  ctx.fillRect(0, H - 5, W, 5);

  // ── Subtle corner brackets for premium feel
  ctx.strokeStyle = layout.clr.title;
  ctx.globalAlpha = 0.2;
  ctx.lineWidth = 1.5;
  const cLen = 14;
  // bottom-right
  ctx.beginPath();
  ctx.moveTo(W - 12, H - 12 - cLen);
  ctx.lineTo(W - 12, H - 12);
  ctx.lineTo(W - 12 - cLen, H - 12);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/* ── Back Side Renderer ──────────────────────────────── */

function renderBack(
  canvas: HTMLCanvasElement,
  config: BadgeConfig,
  tmpl: CardTemplate,
  logoImg: HTMLImageElement | null,
) {
  const ctx = canvas.getContext("2d")!;
  const p = config.orientation === "portrait";
  const W = p ? 400 : 640;
  const H = p ? 600 : 400;
  canvas.width = W;
  canvas.height = H;

  // 1. Render EXACT same template background as front
  const layout = tmpl.render(ctx, W, H, p, config);
  const clr = layout.clr;
  const ph = layout.photo;

  // 2. Logo in the photo circle (same position, same ring)
  if (logoImg) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(ph.x, ph.y, ph.size / 2 + 4, 0, Math.PI * 2);
    ctx.fillStyle = ph.ring;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ph.x, ph.y, ph.size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = "#fff";
    ctx.fill();
    const aspect = logoImg.width / logoImg.height;
    const pad = ph.size * 0.15;
    let lw = ph.size - pad * 2;
    let lh = lw / aspect;
    if (lh > ph.size - pad * 2) {
      lh = ph.size - pad * 2;
      lw = lh * aspect;
    }
    ctx.drawImage(logoImg, ph.x - lw / 2, ph.y - lh / 2, lw, lh);
    ctx.restore();
  } else {
    ctx.save();
    ctx.beginPath();
    ctx.arc(ph.x, ph.y, ph.size / 2 + 4, 0, Math.PI * 2);
    ctx.fillStyle = ph.ring;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ph.x, ph.y, ph.size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = ph.bg;
    ctx.fill();
    const initials = config.company
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${ph.size / 2.2}px 'Segoe UI', system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials, ph.x, ph.y);
    ctx.restore();
  }

  // 3. "Terms and Conditions" content in the info area
  const ix = layout.info.x;
  let y = layout.info.y;
  ctx.textAlign = layout.info.align;
  ctx.textBaseline = "top";

  ctx.fillStyle = clr.name;
  ctx.font = "bold 16px 'Segoe UI', system-ui, sans-serif";
  ctx.fillText("Terms and Conditions", ix, y);
  y += 24;

  // Word-wrap terms text from config
  ctx.fillStyle = clr.muted;
  ctx.font = "11px 'Segoe UI', system-ui, sans-serif";
  const termsStr = config.termsText || "This card is non-transferable and must be worn visibly at all times. Report lost or stolen cards to security immediately. Unauthorized use is prohibited and may result in legal action.";
  const maxTextW = p ? 160 : 180;
  const words = termsStr.split(" ");
  let currentLine = "";
  for (const word of words) {
    const testLine = currentLine ? currentLine + " " + word : word;
    if (ctx.measureText(testLine).width > maxTextW && currentLine) {
      ctx.fillText(currentLine, ix, y);
      y += 15;
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    ctx.fillText(currentLine, ix, y);
    y += 15;
  }

  // Contact info
  y += 6;
  ctx.strokeStyle = clr.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ix - 70, y);
  ctx.lineTo(ix + 70, y);
  ctx.stroke();
  y += 12;

  ctx.fillStyle = clr.name;
  ctx.font = "bold 11px 'Segoe UI', system-ui, sans-serif";
  ctx.fillText(config.company, ix, y);
  y += 16;

  if (config.companyAddress) {
    ctx.fillStyle = clr.muted;
    ctx.font = "10px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText(config.companyAddress, ix, y);
    y += 14;
  }
  if (config.phone) {
    ctx.fillStyle = clr.muted;
    ctx.font = "10px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText(config.phone, ix, y);
    y += 14;
  }
  if (config.email) {
    ctx.fillStyle = clr.muted;
    ctx.font = "10px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText(config.email, ix, y);
    y += 14;
  }

  // 4. Barcode at bottom of card (fixed position)
  const barcodeH = 30;
  const barcodeW = 130;
  const barcodeX = ix - barcodeW / 2;
  const barcodeY = H - (p ? 60 : 50);

  ctx.fillStyle = clr.name;
  const barPattern = config.employeeId + config.fullName;
  let xPos = barcodeX;
  for (let i = 0; i < barPattern.length * 2 && xPos < barcodeX + barcodeW; i++) {
    const charCode = barPattern.charCodeAt(i % barPattern.length);
    const barW = (charCode % 3) + 1;
    const gap = (charCode % 2) + 1;
    ctx.fillRect(xPos, barcodeY, barW, barcodeH);
    xPos += barW + gap;
  }

  ctx.fillStyle = clr.name;
  ctx.font = "bold 10px 'Cascadia Code', 'Consolas', monospace";
  ctx.textAlign = layout.info.align;
  ctx.fillText(config.employeeId, ix, barcodeY + barcodeH + 4);
}

/* ── Component ───────────────────────────────────────── */

export default function IdCardBadgeGenerator() {
  const [config, setConfig] = useState<BadgeConfig>(defaults);
  const [side, setSide] = useState<"front" | "back">("front");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof BadgeConfig>(k: K, v: BadgeConfig[K]) =>
    setConfig((prev) => ({ ...prev, [k]: v }));

  const tmpl = cardTemplates.find((t) => t.id === config.template) ?? cardTemplates[0];

  const handlePhoto = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => update("photo", ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleLogo = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => update("logo", ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  /* Async canvas draw — images loaded before drawImage */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;

    (async () => {
      let photoImg: HTMLImageElement | null = null;
      let logoImg: HTMLImageElement | null = null;
      if (config.photo) {
        try { photoImg = await loadImg(config.photo); } catch { /* fallback */ }
      }
      if (config.logo) {
        try { logoImg = await loadImg(config.logo); } catch { /* skip */ }
      }
      if (cancelled) return;
      if (side === "front") {
        renderCard(canvas, config, tmpl, photoImg, logoImg);
      } else {
        renderBack(canvas, config, tmpl, logoImg);
      }
    })();

    return () => { cancelled = true; };
  }, [config, tmpl, side]);

  const download = async (which: "front" | "back" | "both") => {
    let photoImg: HTMLImageElement | null = null;
    let logoImg: HTMLImageElement | null = null;
    if (config.photo) {
      try { photoImg = await loadImg(config.photo); } catch { /* ignore */ }
    }
    if (config.logo) {
      try { logoImg = await loadImg(config.logo); } catch { /* ignore */ }
    }

    const slug = config.fullName.replace(/\s+/g, "-").toLowerCase();

    if (which === "front" || which === "both") {
      const c = document.createElement("canvas");
      renderCard(c, config, tmpl, photoImg, logoImg);
      const link = document.createElement("a");
      link.download = `id-badge-front-${slug}.png`;
      link.href = c.toDataURL("image/png");
      link.click();
    }

    if (which === "back" || which === "both") {
      // small delay so browser doesn't block second download
      if (which === "both") await new Promise((r) => setTimeout(r, 300));
      const c = document.createElement("canvas");
      renderBack(c, config, tmpl, logoImg);
      const link = document.createElement("a");
      link.download = `id-badge-back-${slug}.png`;
      link.href = c.toDataURL("image/png");
      link.click();
    }
  };

  const inp =
    "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none";

  return (
    <div className="space-y-6">
      {/* Preview — top, centered */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted">
            Preview
          </div>
          <div className="flex rounded-lg border border-border bg-surface p-0.5">
            {(["front", "back"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSide(s)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  side === s
                    ? "bg-accent text-accent-fg"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {s === "front" ? "Front" : "Back"}
              </button>
            ))}
          </div>
        </div>
        <canvas
          ref={canvasRef}
          className="rounded-xl border border-border shadow-lg"
          style={{
            width: config.orientation === "portrait" ? 300 : 480,
            aspectRatio:
              config.orientation === "portrait" ? "400/600" : "640/400",
          }}
        />
      </div>

      {/* Controls */}
      <div className="space-y-4">
          {/* Orientation */}
          <div>
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
              Orientation
            </div>
            <div className="flex rounded-lg border border-border bg-surface p-1 w-fit">
              {(["portrait", "landscape"] as const).map((o) => (
                <button
                  key={o}
                  onClick={() => update("orientation", o)}
                  className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
                    config.orientation === o
                      ? "bg-accent text-accent-fg"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {o === "portrait" ? "▯ Portrait" : "▬ Landscape"}
                </button>
              ))}
            </div>
          </div>

          {/* Template selector */}
          <div>
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
              Template
            </div>
            <div
              className="tmpl-scroll flex gap-2 overflow-x-auto pb-1"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <style>{`.tmpl-scroll::-webkit-scrollbar { display: none; }`}</style>
              {cardTemplates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => update("template", t.id)}
                  className={`group flex flex-col items-center gap-1.5 rounded-lg border p-1.5 transition-all shrink-0 ${
                    config.template === t.id
                      ? "border-accent bg-accent/5 shadow-sm shadow-accent/15"
                      : "border-border hover:border-border-hover"
                  }`}
                  style={{ width: "calc((100% - 9 * 0.5rem) / 10)" }}
                >
                  <div
                    className="aspect-[2/3] w-full rounded-md shadow-inner"
                    style={{ background: t.preview }}
                  />
                  <span
                    className={`text-[10px] font-semibold leading-tight ${
                      config.template === t.id
                        ? "text-accent"
                        : "text-muted group-hover:text-foreground"
                    }`}
                  >
                    {t.name}
                  </span>
                  <span className="text-[9px] text-muted leading-tight opacity-60">
                    {t.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Two-column form: Front (left) / Back (right) */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* LEFT — Front side fields */}
            <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
              <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">
                Front Side
              </legend>
              <input
                type="text"
                placeholder="Full Name"
                value={config.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                className={inp}
              />
              <input
                type="text"
                placeholder="Job Title"
                value={config.title}
                onChange={(e) => update("title", e.target.value)}
                className={inp}
              />
              <div className="grid gap-2 grid-cols-2">
                <input
                  type="text"
                  placeholder="Department"
                  value={config.department}
                  onChange={(e) => update("department", e.target.value)}
                  className={inp}
                />
                <input
                  type="text"
                  placeholder="Employee ID"
                  value={config.employeeId}
                  onChange={(e) => update("employeeId", e.target.value)}
                  className={inp}
                />
              </div>
              <div className="grid gap-2 grid-cols-2">
                <input
                  type="email"
                  placeholder="Email"
                  value={config.email}
                  onChange={(e) => update("email", e.target.value)}
                  className={inp}
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={config.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className={inp}
                />
              </div>
              {/* Photo upload */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => photoRef.current?.click()}
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:bg-surface-hover transition-colors"
                >
                  📷 {config.photo ? "Change Photo" : "Upload Photo"}
                </button>
                {config.photo && (
                  <button
                    onClick={() => update("photo", null)}
                    className="text-xs text-danger hover:underline"
                  >
                    Remove
                  </button>
                )}
                <input ref={photoRef} type="file" accept="image/*" hidden onChange={handlePhoto} />
              </div>
            </fieldset>

            {/* RIGHT — Back side fields */}
            <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
              <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">
                Back Side
              </legend>
              <input
                type="text"
                placeholder="Company / Organization"
                value={config.company}
                onChange={(e) => update("company", e.target.value)}
                className={inp}
              />
              <input
                type="text"
                placeholder="Company Address"
                value={config.companyAddress}
                onChange={(e) => update("companyAddress", e.target.value)}
                className={inp}
              />
              <textarea
                placeholder="Terms and Conditions"
                value={config.termsText}
                onChange={(e) => update("termsText", e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none resize-none"
              />
              {/* Logo upload */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => logoRef.current?.click()}
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:bg-surface-hover transition-colors"
                >
                  🏢 {config.logo ? "Change Logo" : "Upload Logo"}
                </button>
                {config.logo && (
                  <button
                    onClick={() => update("logo", null)}
                    className="text-xs text-danger hover:underline"
                  >
                    Remove
                  </button>
                )}
                <input ref={logoRef} type="file" accept="image/*" hidden onChange={handleLogo} />
              </div>
            </fieldset>
          </div>

          {/* Download buttons */}
          <div className="grid gap-2 sm:grid-cols-3">
            <button
              onClick={() => download("front")}
              className="rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-fg shadow-lg shadow-accent/25 hover:bg-accent-hover transition-colors"
            >
              ↓ Front
            </button>
            <button
              onClick={() => download("back")}
              className="rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-fg shadow-lg shadow-accent/25 hover:bg-accent-hover transition-colors"
            >
              ↓ Back
            </button>
            <button
              onClick={() => download("both")}
              className="rounded-lg border-2 border-accent py-2.5 text-sm font-semibold text-accent hover:bg-accent/10 transition-colors"
            >
              ↓ Both Sides
            </button>
          </div>
      </div>
    </div>
  );
}
