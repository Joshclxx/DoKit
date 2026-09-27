"use client";

import { useState, useRef, useCallback, useEffect } from "react";

/* ── Config ── */

interface CertConfig {
  title: string; subtitle: string; bodyTemplate: string;
  signerName: string; signerTitle: string;
  date: string; orgName: string; templateId: string;
}

const defaults: CertConfig = {
  title: "Certificate of Completion", subtitle: "This is to certify that",
  bodyTemplate: "has successfully completed the requirements for",
  signerName: "", signerTitle: "", date: new Date().toISOString().split("T")[0],
  orgName: "", templateId: "classic-gold",
};

/* ── Template Definitions ── */

interface CertTemplate {
  id: string;
  name: string;
  preview: string; // CSS gradient
  render: (ctx: CanvasRenderingContext2D, W: number, H: number, cfg: CertConfig, name: string, course: string, logoImg: HTMLImageElement | null) => void;
}

/* ── Shared Drawing Helpers ── */

function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = "center") {
  ctx.fillStyle = color; ctx.font = font; ctx.textAlign = align; ctx.fillText(text, x, y);
}

function drawLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width = 1) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}

function drawCornerBrackets(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, len: number, color: string, lw = 2) {
  ctx.strokeStyle = color; ctx.lineWidth = lw;
  const corners = [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]];
  for (const [cx, cy, dx, dy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx as number, (cy as number) + (dy as number) * len);
    ctx.lineTo(cx as number, cy as number);
    ctx.lineTo((cx as number) + (dx as number) * len, cy as number);
    ctx.stroke();
  }
}

function drawSigBlock(ctx: CanvasRenderingContext2D, x: number, y: number, signerName: string, signerTitle: string, color: string) {
  drawLine(ctx, x - 100, y, x + 100, y, color + "88", 1);
  if (signerName) drawText(ctx, signerName, x, y + 22, "bold 14px 'Segoe UI',sans-serif", color);
  if (signerTitle) drawText(ctx, signerTitle, x, y + 40, "13px 'Segoe UI',sans-serif", color + "aa");
}

function drawLaurel(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  ctx.fillStyle = color; ctx.globalAlpha = 0.12;
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 5; i++) {
      const angle = (side * (0.3 + i * 0.25));
      const lx = cx + side * (size * 0.4 + i * size * 0.08);
      const ly = cy - size * 0.3 + i * size * 0.15;
      ctx.beginPath();
      ctx.ellipse(lx, ly, size * 0.12, size * 0.06, angle, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawStarBurst(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.fillStyle = color; ctx.globalAlpha = 0.08;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle - 0.15) * r, cy + Math.sin(angle - 0.15) * r);
    ctx.lineTo(cx + Math.cos(angle) * r * 1.3, cy + Math.sin(angle) * r * 1.3);
    ctx.lineTo(cx + Math.cos(angle + 0.15) * r, cy + Math.sin(angle + 0.15) * r);
    ctx.closePath(); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawMedalBadge(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, innerColor: string) {
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = innerColor;
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
}

function drawDiamondPattern(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, spacing = 30) {
  ctx.fillStyle = color; ctx.globalAlpha = 0.04;
  for (let row = 0; row < h / spacing; row++) {
    for (let col = 0; col < w / spacing; col++) {
      const cx = x + col * spacing + (row % 2 === 0 ? 0 : spacing / 2);
      const cy = y + row * spacing;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 4); ctx.lineTo(cx + 4, cy); ctx.lineTo(cx, cy + 4); ctx.lineTo(cx - 4, cy);
      ctx.closePath(); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

/* ── 20 Certificate Templates ── */

const certTemplates: CertTemplate[] = [

  /* ─── 1. Classic Gold ─── */
  { id: "classic-gold", name: "Classic Gold", preview: "linear-gradient(135deg,#1a1a2e,#c9a227)",
    render(ctx, W, H, cfg, name, course) {
      ctx.fillStyle = "#fffef7"; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#1a1a2e"; ctx.lineWidth = 4; ctx.strokeRect(24, 24, W - 48, H - 48);
      ctx.strokeStyle = "#c9a227"; ctx.lineWidth = 2; ctx.strokeRect(36, 36, W - 72, H - 72);
      drawCornerBrackets(ctx, 36, 36, W - 72, H - 72, 40, "#c9a227", 3);
      drawLaurel(ctx, W / 2, 90, 80, "#c9a227");
      drawText(ctx, cfg.title, W / 2, 140, "bold 36px Georgia,serif", "#1a1a2e");
      drawText(ctx, cfg.subtitle, W / 2, 210, "18px Georgia,serif", "#666");
      drawText(ctx, name, W / 2, 300, "bold 42px Georgia,serif", "#c9a227");
      drawLine(ctx, W / 2 - 200, 318, W / 2 + 200, 318, "#c9a227", 1);
      drawText(ctx, cfg.bodyTemplate, W / 2, 380, "18px Georgia,serif", "#444");
      drawText(ctx, course, W / 2, 430, "bold 24px Georgia,serif", "#1a1a2e");
      drawText(ctx, `Date: ${cfg.date}`, W / 2, 530, "16px Georgia,serif", "#666");
      if (cfg.orgName) drawText(ctx, cfg.orgName, W / 2, 560, "16px Georgia,serif", "#444");
      drawSigBlock(ctx, W / 2, 670, cfg.signerName, cfg.signerTitle, "#333");
    }
  },

  /* ─── 2. Modern Purple ─── */
  { id: "modern-purple", name: "Modern Purple", preview: "linear-gradient(135deg,#6d5cff,#a78bfa)",
    render(ctx, W, H, cfg, name, course) {
      ctx.fillStyle = "#fafaff"; ctx.fillRect(0, 0, W, H);
      // Top accent bar
      const grd = ctx.createLinearGradient(0, 0, W, 0);
      grd.addColorStop(0, "#6d5cff"); grd.addColorStop(1, "#a78bfa");
      ctx.fillStyle = grd; ctx.fillRect(0, 0, W, 8);
      ctx.fillRect(0, H - 8, W, 8);
      // Left accent strip
      ctx.fillStyle = "#6d5cff"; ctx.globalAlpha = 0.06;
      ctx.fillRect(0, 0, 80, H); ctx.globalAlpha = 1;
      drawMedalBadge(ctx, W / 2, 85, 40, "#6d5cff", "#a78bfa");
      drawText(ctx, cfg.title, W / 2, 160, "bold 34px 'Segoe UI',sans-serif", "#6d5cff");
      drawText(ctx, cfg.subtitle, W / 2, 220, "16px 'Segoe UI',sans-serif", "#888");
      drawText(ctx, name, W / 2, 310, "bold 40px 'Segoe UI',sans-serif", "#1a1a2e");
      drawLine(ctx, W / 2 - 160, 328, W / 2 + 160, 328, "#6d5cff44", 2);
      drawText(ctx, cfg.bodyTemplate, W / 2, 385, "16px 'Segoe UI',sans-serif", "#555");
      drawText(ctx, course, W / 2, 430, "bold 22px 'Segoe UI',sans-serif", "#6d5cff");
      drawText(ctx, cfg.date, W / 2, 520, "14px 'Segoe UI',sans-serif", "#999");
      if (cfg.orgName) drawText(ctx, cfg.orgName, W / 2, 548, "15px 'Segoe UI',sans-serif", "#555");
      drawSigBlock(ctx, W / 2, 660, cfg.signerName, cfg.signerTitle, "#333");
    }
  },

  /* ─── 3. Elegant Dark ─── */
  { id: "elegant-dark", name: "Elegant Dark", preview: "linear-gradient(135deg,#1a1a2e,#b8860b)",
    render(ctx, W, H, cfg, name, course) {
      ctx.fillStyle = "#1a1a2e"; ctx.fillRect(0, 0, W, H);
      drawDiamondPattern(ctx, 0, 0, W, H, "#ffffff", 35);
      ctx.strokeStyle = "#b8860b"; ctx.lineWidth = 2; ctx.strokeRect(30, 30, W - 60, H - 60);
      ctx.strokeStyle = "#b8860b44"; ctx.lineWidth = 1; ctx.strokeRect(40, 40, W - 80, H - 80);
      drawCornerBrackets(ctx, 30, 30, W - 60, H - 60, 50, "#b8860b", 2);
      drawText(ctx, cfg.title, W / 2, 150, "bold 36px Georgia,serif", "#b8860b");
      drawLine(ctx, W / 2 - 120, 168, W / 2 + 120, 168, "#b8860b66", 1);
      drawText(ctx, cfg.subtitle, W / 2, 220, "18px Georgia,serif", "#ccc");
      drawText(ctx, name, W / 2, 310, "bold 44px Georgia,serif", "#ffffff");
      drawText(ctx, cfg.bodyTemplate, W / 2, 390, "17px Georgia,serif", "#aaa");
      drawText(ctx, course, W / 2, 440, "bold 24px Georgia,serif", "#b8860b");
      drawText(ctx, cfg.date, W / 2, 540, "15px Georgia,serif", "#999");
      if (cfg.orgName) drawText(ctx, cfg.orgName, W / 2, 565, "15px Georgia,serif", "#bbb");
      drawSigBlock(ctx, W / 2, 670, cfg.signerName, cfg.signerTitle, "#ccc");
    }
  },

  /* ─── 4. Academic Blue ─── */
  { id: "academic-blue", name: "Academic Blue", preview: "linear-gradient(135deg,#0f4c81,#3b82f6)",
    render(ctx, W, H, cfg, name, course) {
      ctx.fillStyle = "#f8f9fb"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#0f4c81"; ctx.fillRect(0, 0, W, 6);
      ctx.fillRect(0, H - 6, W, 6);
      ctx.strokeStyle = "#0f4c81"; ctx.lineWidth = 2; ctx.strokeRect(28, 28, W - 56, H - 56);
      drawStarBurst(ctx, W / 2, 90, 50, "#0f4c81");
      drawText(ctx, cfg.title, W / 2, 150, "bold 34px Georgia,serif", "#0f4c81");
      drawLine(ctx, W / 2 - 180, 170, W / 2 + 180, 170, "#0f4c8133", 2);
      drawText(ctx, cfg.subtitle, W / 2, 225, "17px Georgia,serif", "#666");
      drawText(ctx, name, W / 2, 310, "bold 42px Georgia,serif", "#0f4c81");
      drawLine(ctx, W / 2 - 180, 325, W / 2 + 180, 325, "#0f4c8144", 1);
      drawText(ctx, cfg.bodyTemplate, W / 2, 385, "17px Georgia,serif", "#444");
      drawText(ctx, course, W / 2, 435, "bold 22px Georgia,serif", "#1a365d");
      drawText(ctx, cfg.date, W / 2, 530, "15px Georgia,serif", "#666");
      if (cfg.orgName) drawText(ctx, cfg.orgName, W / 2, 558, "16px Georgia,serif", "#444");
      drawSigBlock(ctx, W / 2, 660, cfg.signerName, cfg.signerTitle, "#333");
    }
  },

  /* ─── 5. Coral Creative ─── */
  { id: "coral-creative", name: "Coral Creative", preview: "linear-gradient(135deg,#e94560,#ff6b6b)",
    render(ctx, W, H, cfg, name, course) {
      ctx.fillStyle = "#fff5f7"; ctx.fillRect(0, 0, W, H);
      // Geometric corner shapes
      ctx.fillStyle = "#e94560"; ctx.globalAlpha = 0.08;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(180, 0); ctx.lineTo(0, 180); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(W, H); ctx.lineTo(W - 180, H); ctx.lineTo(W, H - 180); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
      drawText(ctx, cfg.title, W / 2, 140, "bold 36px 'Segoe UI',sans-serif", "#e94560");
      drawText(ctx, cfg.subtitle, W / 2, 210, "16px 'Segoe UI',sans-serif", "#888");
      drawText(ctx, name, W / 2, 305, "bold 42px 'Segoe UI',sans-serif", "#1a202c");
      drawLine(ctx, W / 2 - 140, 322, W / 2 + 140, 322, "#e9456066", 2);
      drawText(ctx, cfg.bodyTemplate, W / 2, 380, "16px 'Segoe UI',sans-serif", "#555");
      drawText(ctx, course, W / 2, 430, "bold 22px 'Segoe UI',sans-serif", "#e94560");
      drawText(ctx, cfg.date, W / 2, 525, "14px 'Segoe UI',sans-serif", "#999");
      if (cfg.orgName) drawText(ctx, cfg.orgName, W / 2, 552, "15px 'Segoe UI',sans-serif", "#666");
      drawSigBlock(ctx, W / 2, 660, cfg.signerName, cfg.signerTitle, "#333");
    }
  },

  /* ─── 6. Emerald Geometric ─── */
  { id: "emerald-geo", name: "Emerald Geometric", preview: "linear-gradient(135deg,#047857,#34d399)",
    render(ctx, W, H, cfg, name, course) {
      ctx.fillStyle = "#f0fdf4"; ctx.fillRect(0, 0, W, H);
      // Side bars
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#047857"); g.addColorStop(1, "#34d399");
      ctx.fillStyle = g; ctx.fillRect(0, 0, 12, H); ctx.fillRect(W - 12, 0, 12, H);
      drawDiamondPattern(ctx, 20, 20, W - 40, H - 40, "#047857", 40);
      drawMedalBadge(ctx, W / 2, 80, 35, "#047857", "#34d399");
      drawText(ctx, cfg.title, W / 2, 155, "bold 34px 'Segoe UI',sans-serif", "#047857");
      drawText(ctx, cfg.subtitle, W / 2, 215, "16px 'Segoe UI',sans-serif", "#666");
      drawText(ctx, name, W / 2, 305, "bold 40px 'Segoe UI',sans-serif", "#1a202c");
      drawLine(ctx, W / 2 - 150, 322, W / 2 + 150, 322, "#04785744", 2);
      drawText(ctx, cfg.bodyTemplate, W / 2, 380, "16px 'Segoe UI',sans-serif", "#555");
      drawText(ctx, course, W / 2, 425, "bold 22px 'Segoe UI',sans-serif", "#047857");
      drawText(ctx, cfg.date, W / 2, 520, "14px 'Segoe UI',sans-serif", "#999");
      if (cfg.orgName) drawText(ctx, cfg.orgName, W / 2, 548, "15px 'Segoe UI',sans-serif", "#555");
      drawSigBlock(ctx, W / 2, 660, cfg.signerName, cfg.signerTitle, "#333");
    }
  },

  /* ─── 7. Midnight Luxe ─── */
  { id: "midnight-luxe", name: "Midnight Luxe", preview: "linear-gradient(135deg,#0f172a,#6366f1)",
    render(ctx, W, H, cfg, name, course) {
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, "#0f172a"); bg.addColorStop(1, "#1e293b");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      drawDiamondPattern(ctx, 0, 0, W, H, "#ffffff", 28);
      // Gold accents
      ctx.strokeStyle = "#e2b04a"; ctx.lineWidth = 1.5; ctx.strokeRect(35, 35, W - 70, H - 70);
      drawCornerBrackets(ctx, 35, 35, W - 70, H - 70, 45, "#e2b04a", 2);
      drawLaurel(ctx, W / 2, 85, 70, "#e2b04a");
      drawText(ctx, cfg.title, W / 2, 150, "bold 34px Georgia,serif", "#e2b04a");
      drawText(ctx, cfg.subtitle, W / 2, 215, "17px Georgia,serif", "#94a3b8");
      drawText(ctx, name, W / 2, 305, "bold 42px Georgia,serif", "#ffffff");
      drawLine(ctx, W / 2 - 180, 322, W / 2 + 180, 322, "#e2b04a55", 1);
      drawText(ctx, cfg.bodyTemplate, W / 2, 385, "16px Georgia,serif", "#94a3b8");
      drawText(ctx, course, W / 2, 435, "bold 22px Georgia,serif", "#e2b04a");
      drawText(ctx, cfg.date, W / 2, 530, "14px Georgia,serif", "#64748b");
      if (cfg.orgName) drawText(ctx, cfg.orgName, W / 2, 558, "15px Georgia,serif", "#94a3b8");
      drawSigBlock(ctx, W / 2, 665, cfg.signerName, cfg.signerTitle, "#cbd5e1");
    }
  },

  /* ─── 8. Clean Minimal ─── */
  { id: "clean-minimal", name: "Clean Minimal", preview: "linear-gradient(135deg,#f8fafc,#64748b)",
    render(ctx, W, H, cfg, name, course) {
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);
      drawLine(ctx, 60, 50, W - 60, 50, "#e2e8f0", 1);
      drawLine(ctx, 60, H - 50, W - 60, H - 50, "#e2e8f0", 1);
      drawText(ctx, cfg.title, W / 2, 150, "300 34px 'Segoe UI',sans-serif", "#1e293b");
      drawLine(ctx, W / 2 - 40, 168, W / 2 + 40, 168, "#64748b", 2);
      drawText(ctx, cfg.subtitle, W / 2, 225, "300 16px 'Segoe UI',sans-serif", "#94a3b8");
      drawText(ctx, name, W / 2, 315, "600 42px 'Segoe UI',sans-serif", "#0f172a");
      drawText(ctx, cfg.bodyTemplate, W / 2, 390, "300 16px 'Segoe UI',sans-serif", "#64748b");
      drawText(ctx, course, W / 2, 440, "600 20px 'Segoe UI',sans-serif", "#334155");
      drawText(ctx, cfg.date, W / 2, 535, "300 14px 'Segoe UI',sans-serif", "#94a3b8");
      if (cfg.orgName) drawText(ctx, cfg.orgName, W / 2, 560, "400 15px 'Segoe UI',sans-serif", "#64748b");
      drawSigBlock(ctx, W / 2, 665, cfg.signerName, cfg.signerTitle, "#475569");
    }
  },

  /* ─── 9. Royal Navy ─── */
  { id: "royal-navy", name: "Royal Navy", preview: "linear-gradient(135deg,#1a365d,#c9a227)",
    render(ctx, W, H, cfg, name, course) {
      ctx.fillStyle = "#fefdfb"; ctx.fillRect(0, 0, W, H);
      // Top/bottom navy bars
      ctx.fillStyle = "#1a365d"; ctx.fillRect(0, 0, W, 40); ctx.fillRect(0, H - 40, W, 40);
      // Gold inner line
      ctx.strokeStyle = "#c9a227"; ctx.lineWidth = 1; ctx.strokeRect(20, 50, W - 40, H - 100);
      drawStarBurst(ctx, W / 2, 100, 45, "#c9a227");
      drawText(ctx, cfg.title, W / 2, 160, "bold 34px Georgia,serif", "#1a365d");
      drawLine(ctx, W / 2 - 100, 178, W / 2 + 100, 178, "#c9a22766", 1);
      drawText(ctx, cfg.subtitle, W / 2, 225, "17px Georgia,serif", "#666");
      drawText(ctx, name, W / 2, 310, "bold 42px Georgia,serif", "#1a365d");
      drawLine(ctx, W / 2 - 180, 328, W / 2 + 180, 328, "#c9a22755", 1);
      drawText(ctx, cfg.bodyTemplate, W / 2, 388, "17px Georgia,serif", "#444");
      drawText(ctx, course, W / 2, 435, "bold 22px Georgia,serif", "#c9a227");
      drawText(ctx, cfg.date, W / 2, 525, "15px Georgia,serif", "#666");
      if (cfg.orgName) drawText(ctx, cfg.orgName, W / 2, 552, "15px Georgia,serif", "#444");
      drawSigBlock(ctx, W / 2, 655, cfg.signerName, cfg.signerTitle, "#333");
    }
  },

  /* ─── 10. Teal Wave ─── */
  { id: "teal-wave", name: "Teal Wave", preview: "linear-gradient(135deg,#0d9488,#5eead4)",
    render(ctx, W, H, cfg, name, course) {
      ctx.fillStyle = "#f0fdfa"; ctx.fillRect(0, 0, W, H);
      // Wave top
      ctx.fillStyle = "#0d9488"; ctx.globalAlpha = 0.08;
      ctx.beginPath(); ctx.moveTo(0, 0);
      for (let x = 0; x <= W; x += 10) { ctx.lineTo(x, 60 + Math.sin(x / 80) * 20); }
      ctx.lineTo(W, 0); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
      // Bottom wave
      ctx.fillStyle = "#0d9488"; ctx.globalAlpha = 0.06;
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 10) { ctx.lineTo(x, H - 50 - Math.sin(x / 60) * 15); }
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
      drawText(ctx, cfg.title, W / 2, 145, "bold 34px 'Segoe UI',sans-serif", "#0d9488");
      drawText(ctx, cfg.subtitle, W / 2, 210, "16px 'Segoe UI',sans-serif", "#888");
      drawText(ctx, name, W / 2, 305, "bold 42px 'Segoe UI',sans-serif", "#134e4a");
      drawLine(ctx, W / 2 - 160, 322, W / 2 + 160, 322, "#0d948844", 2);
      drawText(ctx, cfg.bodyTemplate, W / 2, 380, "16px 'Segoe UI',sans-serif", "#555");
      drawText(ctx, course, W / 2, 428, "bold 22px 'Segoe UI',sans-serif", "#0d9488");
      drawText(ctx, cfg.date, W / 2, 525, "14px 'Segoe UI',sans-serif", "#999");
      if (cfg.orgName) drawText(ctx, cfg.orgName, W / 2, 550, "15px 'Segoe UI',sans-serif", "#555");
      drawSigBlock(ctx, W / 2, 660, cfg.signerName, cfg.signerTitle, "#333");
    }
  },

  /* ─── 11. Burgundy Classic ─── */
  { id: "burgundy-classic", name: "Burgundy Classic", preview: "linear-gradient(135deg,#7f1d1d,#dc2626)",
    render(ctx, W, H, cfg, name, course) {
      ctx.fillStyle = "#fef2f2"; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#7f1d1d"; ctx.lineWidth = 3; ctx.strokeRect(25, 25, W - 50, H - 50);
      ctx.strokeStyle = "#7f1d1d44"; ctx.lineWidth = 1; ctx.strokeRect(35, 35, W - 70, H - 70);
      drawCornerBrackets(ctx, 25, 25, W - 50, H - 50, 40, "#7f1d1d", 2);
      drawLaurel(ctx, W / 2, 90, 75, "#7f1d1d");
      drawText(ctx, cfg.title, W / 2, 150, "bold 34px Georgia,serif", "#7f1d1d");
      drawText(ctx, cfg.subtitle, W / 2, 215, "17px Georgia,serif", "#666");
      drawText(ctx, name, W / 2, 305, "bold 42px Georgia,serif", "#7f1d1d");
      drawLine(ctx, W / 2 - 180, 322, W / 2 + 180, 322, "#7f1d1d44", 1);
      drawText(ctx, cfg.bodyTemplate, W / 2, 385, "17px Georgia,serif", "#555");
      drawText(ctx, course, W / 2, 435, "bold 22px Georgia,serif", "#991b1b");
      drawText(ctx, cfg.date, W / 2, 530, "15px Georgia,serif", "#888");
      if (cfg.orgName) drawText(ctx, cfg.orgName, W / 2, 556, "15px Georgia,serif", "#555");
      drawSigBlock(ctx, W / 2, 660, cfg.signerName, cfg.signerTitle, "#333");
    }
  },

  /* ─── 12. Sapphire Gradient ─── */
  { id: "sapphire-grad", name: "Sapphire Gradient", preview: "linear-gradient(135deg,#1d4ed8,#60a5fa)",
    render(ctx, W, H, cfg, name, course) {
      ctx.fillStyle = "#eff6ff"; ctx.fillRect(0, 0, W, H);
      const g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, "#1d4ed8"); g.addColorStop(1, "#3b82f6");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, 10); ctx.fillRect(0, H - 10, W, 10);
      drawMedalBadge(ctx, W / 2, 80, 38, "#1d4ed8", "#60a5fa");
      drawText(ctx, cfg.title, W / 2, 155, "bold 34px 'Segoe UI',sans-serif", "#1d4ed8");
      drawText(ctx, cfg.subtitle, W / 2, 215, "16px 'Segoe UI',sans-serif", "#64748b");
      drawText(ctx, name, W / 2, 305, "bold 42px 'Segoe UI',sans-serif", "#1e293b");
      drawLine(ctx, W / 2 - 160, 322, W / 2 + 160, 322, "#1d4ed844", 2);
      drawText(ctx, cfg.bodyTemplate, W / 2, 382, "16px 'Segoe UI',sans-serif", "#475569");
      drawText(ctx, course, W / 2, 430, "bold 22px 'Segoe UI',sans-serif", "#1d4ed8");
      drawText(ctx, cfg.date, W / 2, 520, "14px 'Segoe UI',sans-serif", "#94a3b8");
      if (cfg.orgName) drawText(ctx, cfg.orgName, W / 2, 548, "15px 'Segoe UI',sans-serif", "#475569");
      drawSigBlock(ctx, W / 2, 660, cfg.signerName, cfg.signerTitle, "#334155");
    }
  },

  /* ─── 13. Forest Earth ─── */
  { id: "forest-earth", name: "Forest Earth", preview: "linear-gradient(135deg,#14532d,#a16207)",
    render(ctx, W, H, cfg, name, course) {
      ctx.fillStyle = "#fefce8"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#14532d"; ctx.fillRect(0, 0, 8, H); ctx.fillRect(W - 8, 0, 8, H);
      ctx.strokeStyle = "#a16207"; ctx.lineWidth = 1; ctx.strokeRect(20, 20, W - 40, H - 40);
      drawLaurel(ctx, W / 2, 85, 70, "#14532d");
      drawText(ctx, cfg.title, W / 2, 150, "bold 34px Georgia,serif", "#14532d");
      drawLine(ctx, W / 2 - 80, 168, W / 2 + 80, 168, "#a1620766", 1);
      drawText(ctx, cfg.subtitle, W / 2, 220, "17px Georgia,serif", "#666");
      drawText(ctx, name, W / 2, 308, "bold 42px Georgia,serif", "#78350f");
      drawText(ctx, cfg.bodyTemplate, W / 2, 385, "17px Georgia,serif", "#555");
      drawText(ctx, course, W / 2, 432, "bold 22px Georgia,serif", "#14532d");
      drawText(ctx, cfg.date, W / 2, 528, "15px Georgia,serif", "#888");
      if (cfg.orgName) drawText(ctx, cfg.orgName, W / 2, 555, "15px Georgia,serif", "#555");
      drawSigBlock(ctx, W / 2, 660, cfg.signerName, cfg.signerTitle, "#333");
    }
  },

  /* ─── 14. Rose Blush ─── */
  { id: "rose-blush", name: "Rose Blush", preview: "linear-gradient(135deg,#be185d,#fda4af)",
    render(ctx, W, H, cfg, name, course) {
      ctx.fillStyle = "#fff1f2"; ctx.fillRect(0, 0, W, H);
      // Circles deco
      ctx.strokeStyle = "#be185d"; ctx.globalAlpha = 0.06; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(80, 80, 60, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(W - 80, H - 80, 60, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(W - 60, 100, 40, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
      drawText(ctx, cfg.title, W / 2, 148, "bold 34px 'Segoe UI',sans-serif", "#be185d");
      drawText(ctx, cfg.subtitle, W / 2, 215, "16px 'Segoe UI',sans-serif", "#888");
      drawText(ctx, name, W / 2, 305, "bold 40px 'Segoe UI',sans-serif", "#1a202c");
      drawLine(ctx, W / 2 - 150, 322, W / 2 + 150, 322, "#be185d55", 2);
      drawText(ctx, cfg.bodyTemplate, W / 2, 380, "16px 'Segoe UI',sans-serif", "#555");
      drawText(ctx, course, W / 2, 428, "bold 22px 'Segoe UI',sans-serif", "#be185d");
      drawText(ctx, cfg.date, W / 2, 520, "14px 'Segoe UI',sans-serif", "#999");
      if (cfg.orgName) drawText(ctx, cfg.orgName, W / 2, 548, "15px 'Segoe UI',sans-serif", "#666");
      drawSigBlock(ctx, W / 2, 660, cfg.signerName, cfg.signerTitle, "#333");
    }
  },

  /* ─── 15. Monochrome Pro ─── */
  { id: "mono-pro", name: "Monochrome Pro", preview: "linear-gradient(135deg,#111827,#6b7280)",
    render(ctx, W, H, cfg, name, course) {
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#111827"; ctx.fillRect(0, 0, W, 60);
      ctx.fillRect(0, H - 20, W, 20);
      drawText(ctx, cfg.title, W / 2, 42, "bold 24px 'Segoe UI',sans-serif", "#ffffff");
      drawText(ctx, cfg.subtitle, W / 2, 140, "16px 'Segoe UI',sans-serif", "#9ca3af");
      drawText(ctx, name, W / 2, 240, "bold 44px 'Segoe UI',sans-serif", "#111827");
      drawLine(ctx, W / 2 - 100, 258, W / 2 + 100, 258, "#111827", 2);
      drawText(ctx, cfg.bodyTemplate, W / 2, 320, "16px 'Segoe UI',sans-serif", "#6b7280");
      drawText(ctx, course, W / 2, 370, "bold 22px 'Segoe UI',sans-serif", "#374151");
      drawText(ctx, cfg.date, W / 2, 465, "14px 'Segoe UI',sans-serif", "#9ca3af");
      if (cfg.orgName) drawText(ctx, cfg.orgName, W / 2, 492, "15px 'Segoe UI',sans-serif", "#6b7280");
      drawSigBlock(ctx, W / 2, 600, cfg.signerName, cfg.signerTitle, "#374151");
    }
  },

  /* ─── 16. Amber Warm ─── */
  { id: "amber-warm", name: "Amber Warm", preview: "linear-gradient(135deg,#92400e,#fbbf24)",
    render(ctx, W, H, cfg, name, course) {
      ctx.fillStyle = "#fffbeb"; ctx.fillRect(0, 0, W, H);
      const g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, "#f59e0b"); g.addColorStop(1, "#d97706");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, 6); ctx.fillRect(0, H - 6, W, 6);
      ctx.strokeStyle = "#92400e33"; ctx.lineWidth = 1; ctx.strokeRect(30, 30, W - 60, H - 60);
      drawStarBurst(ctx, W / 2, 85, 40, "#92400e");
      drawText(ctx, cfg.title, W / 2, 150, "bold 34px Georgia,serif", "#92400e");
      drawText(ctx, cfg.subtitle, W / 2, 215, "17px Georgia,serif", "#78716c");
      drawText(ctx, name, W / 2, 305, "bold 42px Georgia,serif", "#78350f");
      drawLine(ctx, W / 2 - 170, 322, W / 2 + 170, 322, "#d9770644", 1);
      drawText(ctx, cfg.bodyTemplate, W / 2, 382, "17px Georgia,serif", "#57534e");
      drawText(ctx, course, W / 2, 432, "bold 22px Georgia,serif", "#92400e");
      drawText(ctx, cfg.date, W / 2, 525, "15px Georgia,serif", "#a8a29e");
      if (cfg.orgName) drawText(ctx, cfg.orgName, W / 2, 552, "15px Georgia,serif", "#78716c");
      drawSigBlock(ctx, W / 2, 660, cfg.signerName, cfg.signerTitle, "#44403c");
    }
  },

  /* ─── 17. Violet Ribbon ─── */
  { id: "violet-ribbon", name: "Violet Ribbon", preview: "linear-gradient(135deg,#4c1d95,#8b5cf6)",
    render(ctx, W, H, cfg, name, course) {
      ctx.fillStyle = "#faf5ff"; ctx.fillRect(0, 0, W, H);
      // Ribbon strips
      ctx.fillStyle = "#4c1d95"; ctx.globalAlpha = 0.07;
      ctx.fillRect(40, 0, 6, H); ctx.fillRect(52, 0, 2, H);
      ctx.fillRect(W - 46, 0, 6, H); ctx.fillRect(W - 54, 0, 2, H);
      ctx.globalAlpha = 1;
      drawMedalBadge(ctx, W / 2, 82, 36, "#4c1d95", "#8b5cf6");
      drawText(ctx, cfg.title, W / 2, 155, "bold 34px 'Segoe UI',sans-serif", "#4c1d95");
      drawText(ctx, cfg.subtitle, W / 2, 215, "16px 'Segoe UI',sans-serif", "#888");
      drawText(ctx, name, W / 2, 305, "bold 42px 'Segoe UI',sans-serif", "#1e1b4b");
      drawLine(ctx, W / 2 - 160, 322, W / 2 + 160, 322, "#4c1d9544", 2);
      drawText(ctx, cfg.bodyTemplate, W / 2, 380, "16px 'Segoe UI',sans-serif", "#555");
      drawText(ctx, course, W / 2, 428, "bold 22px 'Segoe UI',sans-serif", "#4c1d95");
      drawText(ctx, cfg.date, W / 2, 520, "14px 'Segoe UI',sans-serif", "#999");
      if (cfg.orgName) drawText(ctx, cfg.orgName, W / 2, 548, "15px 'Segoe UI',sans-serif", "#666");
      drawSigBlock(ctx, W / 2, 660, cfg.signerName, cfg.signerTitle, "#333");
    }
  },

  /* ─── 18. Slate Corporate ─── */
  { id: "slate-corp", name: "Slate Corporate", preview: "linear-gradient(135deg,#334155,#94a3b8)",
    render(ctx, W, H, cfg, name, course) {
      ctx.fillStyle = "#f8fafc"; ctx.fillRect(0, 0, W, H);
      // Header block
      ctx.fillStyle = "#334155"; ctx.fillRect(0, 0, W, 90);
      drawText(ctx, cfg.title, W / 2, 58, "bold 28px 'Segoe UI',sans-serif", "#f1f5f9");
      drawText(ctx, cfg.subtitle, W / 2, 170, "16px 'Segoe UI',sans-serif", "#94a3b8");
      drawText(ctx, name, W / 2, 270, "bold 42px 'Segoe UI',sans-serif", "#1e293b");
      drawLine(ctx, W / 2 - 160, 288, W / 2 + 160, 288, "#33415544", 2);
      drawText(ctx, cfg.bodyTemplate, W / 2, 348, "16px 'Segoe UI',sans-serif", "#64748b");
      drawText(ctx, course, W / 2, 398, "bold 22px 'Segoe UI',sans-serif", "#334155");
      drawText(ctx, cfg.date, W / 2, 490, "14px 'Segoe UI',sans-serif", "#94a3b8");
      if (cfg.orgName) drawText(ctx, cfg.orgName, W / 2, 518, "15px 'Segoe UI',sans-serif", "#64748b");
      drawSigBlock(ctx, W / 2, 630, cfg.signerName, cfg.signerTitle, "#334155");
      ctx.fillStyle = "#334155"; ctx.fillRect(0, H - 12, W, 12);
    }
  },

  /* ─── 19. Ocean Breeze ─── */
  { id: "ocean-breeze", name: "Ocean Breeze", preview: "linear-gradient(135deg,#0369a1,#38bdf8)",
    render(ctx, W, H, cfg, name, course) {
      ctx.fillStyle = "#f0f9ff"; ctx.fillRect(0, 0, W, H);
      // Gradient circles
      ctx.fillStyle = "#0369a1"; ctx.globalAlpha = 0.04;
      ctx.beginPath(); ctx.arc(120, 120, 100, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(W - 120, H - 120, 100, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      const g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, "#0369a1"); g.addColorStop(1, "#0284c7");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, 5); ctx.fillRect(0, H - 5, W, 5);
      drawText(ctx, cfg.title, W / 2, 148, "bold 34px 'Segoe UI',sans-serif", "#0369a1");
      drawLine(ctx, W / 2 - 60, 165, W / 2 + 60, 165, "#0369a1", 2);
      drawText(ctx, cfg.subtitle, W / 2, 215, "16px 'Segoe UI',sans-serif", "#64748b");
      drawText(ctx, name, W / 2, 305, "bold 42px 'Segoe UI',sans-serif", "#0c4a6e");
      drawLine(ctx, W / 2 - 160, 322, W / 2 + 160, 322, "#0369a144", 1);
      drawText(ctx, cfg.bodyTemplate, W / 2, 382, "16px 'Segoe UI',sans-serif", "#475569");
      drawText(ctx, course, W / 2, 430, "bold 22px 'Segoe UI',sans-serif", "#0369a1");
      drawText(ctx, cfg.date, W / 2, 520, "14px 'Segoe UI',sans-serif", "#94a3b8");
      if (cfg.orgName) drawText(ctx, cfg.orgName, W / 2, 548, "15px 'Segoe UI',sans-serif", "#475569");
      drawSigBlock(ctx, W / 2, 660, cfg.signerName, cfg.signerTitle, "#334155");
    }
  },

  /* ─── 20. Bronze Prestige ─── */
  { id: "bronze-prestige", name: "Bronze Prestige", preview: "linear-gradient(135deg,#78350f,#d97706)",
    render(ctx, W, H, cfg, name, course) {
      ctx.fillStyle = "#fefce8"; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#78350f"; ctx.lineWidth = 3; ctx.strokeRect(20, 20, W - 40, H - 40);
      ctx.strokeStyle = "#d97706"; ctx.lineWidth = 1; ctx.strokeRect(28, 28, W - 56, H - 56);
      drawCornerBrackets(ctx, 20, 20, W - 40, H - 40, 50, "#d97706", 2);
      drawLaurel(ctx, W / 2, 90, 75, "#78350f");
      drawText(ctx, cfg.title, W / 2, 155, "bold 36px Georgia,serif", "#78350f");
      drawLine(ctx, W / 2 - 100, 172, W / 2 + 100, 172, "#d9770666", 1);
      drawText(ctx, cfg.subtitle, W / 2, 222, "18px Georgia,serif", "#92400e");
      drawText(ctx, name, W / 2, 312, "bold 44px Georgia,serif", "#78350f");
      drawLine(ctx, W / 2 - 200, 330, W / 2 + 200, 330, "#d9770644", 1);
      drawText(ctx, cfg.bodyTemplate, W / 2, 390, "17px Georgia,serif", "#57534e");
      drawText(ctx, course, W / 2, 440, "bold 24px Georgia,serif", "#92400e");
      drawText(ctx, cfg.date, W / 2, 535, "16px Georgia,serif", "#a8a29e");
      if (cfg.orgName) drawText(ctx, cfg.orgName, W / 2, 562, "16px Georgia,serif", "#78716c");
      drawSigBlock(ctx, W / 2, 665, cfg.signerName, cfg.signerTitle, "#44403c");
    }
  },
];

/* ── Component ── */

export default function BulkCertificateGenerator() {
  const [config, setConfig] = useState<CertConfig>(defaults);
  const [names, setNames] = useState("John Doe\nJane Smith\nAlex Johnson");
  const [courseName, setCourseName] = useState("Web Development Bootcamp");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof CertConfig>(k: K, v: CertConfig[K]) => setConfig((p) => ({ ...p, [k]: v }));
  const nameList = names.split("\n").map((n) => n.trim()).filter(Boolean);
  const tmpl = certTemplates.find((t) => t.id === config.templateId) || certTemplates[0];

  const handleLogo = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLogoPreview(url);
    const img = new Image();
    img.onload = () => setLogoImg(img);
    img.src = url;
  }, []);

  const removeLogo = () => { setLogoImg(null); setLogoPreview(null); };

  const drawCert = useCallback((canvas: HTMLCanvasElement, name: string) => {
    const ctx = canvas.getContext("2d")!;
    const W = 1123, H = 794;
    canvas.width = W; canvas.height = H;
    tmpl.render(ctx, W, H, config, name, courseName, logoImg);
    // Draw logo at top-center after template renders
    if (logoImg) {
      const maxH = 60;
      const aspect = logoImg.width / logoImg.height;
      const lh = Math.min(maxH, logoImg.height);
      const lw = Math.min(lh * aspect, 160);
      ctx.drawImage(logoImg, W / 2 - lw / 2, 55, lw, lh);
    }
  }, [config, courseName, tmpl, logoImg]);

  // Draw preview
  useEffect(() => {
    if (canvasRef.current) {
      drawCert(canvasRef.current, nameList[selectedIdx] || "Preview Name");
    }
  }, [drawCert, selectedIdx, nameList]);

  const downloadOne = (name: string) => {
    const canvas = document.createElement("canvas");
    drawCert(canvas, name);
    const link = document.createElement("a");
    link.download = `certificate-${name.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const downloadAll = () => { nameList.forEach((name, i) => setTimeout(() => downloadOne(name), i * 300)); };

  const inp = "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none";

  return (
    <div className="space-y-5">
      {/* Template selector */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">Template</label>
        <div className="tmpl-scroll flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          <style>{`.tmpl-scroll::-webkit-scrollbar { display: none; }`}</style>
          {certTemplates.map((t) => (
            <button key={t.id} onClick={() => update("templateId", t.id)}
              className={`group flex flex-col items-center gap-1 rounded-lg border p-1.5 transition-all shrink-0 ${
                config.templateId === t.id ? "border-accent bg-accent/5 shadow-sm shadow-accent/15" : "border-border hover:border-border-hover"
              }`} style={{ width: "76px" }}>
              <div className="h-11 w-full rounded-md shadow-inner" style={{ background: t.preview }} />
              <span className={`text-[9px] font-semibold leading-tight text-center ${
                config.templateId === t.id ? "text-accent" : "text-muted group-hover:text-foreground"
              }`}>{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Certificate Details</legend>
            {/* Logo upload */}
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-lg border-2 border-dashed border-border bg-background flex items-center justify-center overflow-hidden cursor-pointer hover:border-accent transition-colors shrink-0"
                onClick={() => logoRef.current?.click()}>
                {logoPreview ? <img src={logoPreview} alt="" className="h-full w-full object-contain p-1" />
                  : null}
              </div>
              <div className="flex-1">
                <button onClick={() => logoRef.current?.click()} className="text-xs font-medium text-accent hover:underline">
                  {logoPreview ? "Change Logo" : "Upload Logo"}
                </button>
                {logoPreview && <button onClick={removeLogo} className="ml-2 text-[10px] text-danger hover:underline">Remove</button>}
                <p className="text-[10px] text-muted">Displayed at the top of the certificate</p>
              </div>
              <input ref={logoRef} type="file" accept="image/*" hidden onChange={handleLogo} />
            </div>
            <input type="text" placeholder="Title" value={config.title} onChange={(e) => update("title", e.target.value)} className={inp} />
            <input type="text" placeholder="Subtitle" value={config.subtitle} onChange={(e) => update("subtitle", e.target.value)} className={inp} />
            <input type="text" placeholder="Body text" value={config.bodyTemplate} onChange={(e) => update("bodyTemplate", e.target.value)} className={inp} />
            <input type="text" placeholder="Course / Program name" value={courseName} onChange={(e) => setCourseName(e.target.value)} className={inp} />
            <div className="grid gap-2 sm:grid-cols-2">
              <input type="text" placeholder="Organization" value={config.orgName} onChange={(e) => update("orgName", e.target.value)} className={inp} />
              <input type="date" value={config.date} onChange={(e) => update("date", e.target.value)} className={inp} />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input type="text" placeholder="Signer name" value={config.signerName} onChange={(e) => update("signerName", e.target.value)} className={inp} />
              <input type="text" placeholder="Signer title" value={config.signerTitle} onChange={(e) => update("signerTitle", e.target.value)} className={inp} />
            </div>
          </fieldset>

          <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Names ({nameList.length})</legend>
            <textarea value={names} onChange={(e) => setNames(e.target.value)} placeholder="One name per line" rows={5}
              className="w-full rounded-lg border border-border bg-background p-3 text-sm font-mono focus:border-accent focus:outline-none resize-y" />
          </fieldset>

          <div className="flex gap-2">
            <button onClick={downloadAll} disabled={nameList.length === 0}
              className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-fg hover:bg-accent-hover disabled:opacity-40">
              ↓ Download All ({nameList.length})
            </button>
            <button onClick={() => downloadOne(nameList[selectedIdx] || "Preview")}
              className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium hover:bg-surface-hover">
              ↓ Current
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {nameList.slice(0, 8).map((n, i) => (
              <button key={i} onClick={() => setSelectedIdx(i)}
                className={`rounded-lg border px-3 py-1 text-xs font-medium ${selectedIdx === i ? "border-accent bg-accent/10 text-accent" : "border-border text-muted"}`}>
                {n}
              </button>
            ))}
            {nameList.length > 8 && <span className="text-xs text-muted">+{nameList.length - 8} more</span>}
          </div>
          <canvas ref={canvasRef} className="w-full rounded-lg border border-border shadow-sm" style={{ aspectRatio: "1123/794" }} />
        </div>
      </div>
    </div>
  );
}
