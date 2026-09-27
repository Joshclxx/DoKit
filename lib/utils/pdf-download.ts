export const A4_PAGE_POINTS = [595.28, 841.89] as const;

type PagePoints = readonly [number, number];

interface HtmlPdfOptions {
  marginsMm?: readonly [number, number, number, number];
  pageSize?: PagePoints;
  removeBlankTrailingPages?: boolean;
}

const encoder = new TextEncoder();
const pointsPerMm = 72 / 25.4;
const cssPixelsPerPoint = 96 / 72;

function jpegBytes(canvas: HTMLCanvasElement): Uint8Array {
  const base64 = canvas.toDataURL("image/jpeg", 0.9).split(",")[1];
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

/** Write image pages directly to a PDF without opening the browser print dialog. */
export function downloadCanvasPagesAsPdf(
  canvases: readonly HTMLCanvasElement[],
  filename: string,
  size: PagePoints = A4_PAGE_POINTS,
  margins: readonly [number, number, number, number] = [0, 0, 0, 0],
): void {
  if (canvases.length === 0) throw new Error("There are no PDF pages to export.");

  const parts: Uint8Array[] = [];
  const offsets: number[] = [0];
  let byteLength = 0;
  const append = (value: string | Uint8Array) => {
    const bytes = typeof value === "string" ? encoder.encode(value) : value;
    parts.push(bytes);
    byteLength += bytes.length;
  };
  const object = (id: number, body: () => void) => {
    offsets[id] = byteLength;
    append(`${id} 0 obj\n`);
    body();
    append("\nendobj\n");
  };

  const objectCount = 2 + canvases.length * 3;
  append("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  object(1, () => append("<< /Type /Catalog /Pages 2 0 R >>"));
  object(2, () => {
    const pageRefs = canvases.map((_, index) => `${3 + index * 3} 0 R`).join(" ");
    append(`<< /Type /Pages /Kids [${pageRefs}] /Count ${canvases.length} >>`);
  });

  canvases.forEach((canvas, index) => {
    const pageId = 3 + index * 3;
    const contentId = pageId + 1;
    const imageId = pageId + 2;
    const [pageWidth, pageHeight] = size;
    const [top, right, bottom, left] = margins;
    const imageWidth = pageWidth - left - right;
    const imageHeight = pageHeight - top - bottom;
    if (imageWidth <= 0 || imageHeight <= 0) throw new Error("PDF margins exceed the page size.");

    object(pageId, () => append(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] ` +
      `/Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    ));
    const commands = `q\n${imageWidth} 0 0 ${imageHeight} ${left} ${bottom} cm\n/Im0 Do\nQ\n`;
    object(contentId, () => {
      append(`<< /Length ${encoder.encode(commands).length} >>\nstream\n`);
      append(commands);
      append("endstream");
    });
    const bytes = jpegBytes(canvas);
    object(imageId, () => {
      append(`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`);
      append(bytes);
      append("\nendstream");
    });
  });

  const xrefOffset = byteLength;
  append(`xref\n0 ${objectCount + 1}\n0000000000 65535 f \n`);
  for (let id = 1; id <= objectCount; id++) {
    append(`${offsets[id].toString().padStart(10, "0")} 00000 n \n`);
  }
  append(`trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
  const blob = new Blob(parts.map((part) => new Uint8Array(part)), { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.hidden = true;
  document.body.appendChild(link);
  link.click();
  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 60_000);
}

function drawTextNode(context: CanvasRenderingContext2D, node: Text, origin: DOMRect, style: CSSStyleDeclaration): void {
  const value = node.textContent ?? "";
  const fontSize = Number.parseFloat(style.fontSize);
  context.fillStyle = style.color;
  context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  context.textBaseline = "alphabetic";
  const range = document.createRange();

  // Browser line boxes give each word its exact position after wrapping.
  for (const match of value.matchAll(/\S+/g)) {
    const word = match[0];
    const start = match.index;
    range.setStart(node, start);
    range.setEnd(node, start + word.length);
    const rects = Array.from(range.getClientRects());
    if (rects.length === 1) {
      const rect = rects[0];
      const baseline = rect.bottom - origin.top - Math.max(0, (rect.height - fontSize) / 2) - fontSize * 0.16;
      context.fillText(word, rect.left - origin.left, baseline);
    } else if (rects.length > 1) {
      // Rare long tokens can wrap within a word; draw their characters at measured positions.
      for (let index = 0; index < word.length; index++) {
        range.setStart(node, start + index);
        range.setEnd(node, start + index + 1);
        const rect = range.getBoundingClientRect();
        const baseline = rect.bottom - origin.top - Math.max(0, (rect.height - fontSize) / 2) - fontSize * 0.16;
        context.fillText(word[index], rect.left - origin.left, baseline);
      }
    }
  }
}

function drawElement(context: CanvasRenderingContext2D, element: HTMLElement, origin: DOMRect): void {
  const style = getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") return;
  const rect = element.getBoundingClientRect();
  const x = rect.left - origin.left;
  const y = rect.top - origin.top;
  const width = rect.width;
  const height = rect.height;

  context.save();
  const opacity = Number.parseFloat(style.opacity);
  context.globalAlpha *= Number.isFinite(opacity) ? opacity : 1;
  if (style.backgroundColor !== "rgba(0, 0, 0, 0)" && style.backgroundColor !== "transparent") {
    context.fillStyle = style.backgroundColor;
    context.fillRect(x, y, width, height);
  }
  const borders = [
    [style.borderTopWidth, style.borderTopColor, x, y, width, 0],
    [style.borderRightWidth, style.borderRightColor, x + width, y, 0, height],
    [style.borderBottomWidth, style.borderBottomColor, x, y + height, width, 0],
    [style.borderLeftWidth, style.borderLeftColor, x, y, 0, height],
  ] as const;
  for (const [size, color, startX, startY, lineWidth, lineHeight] of borders) {
    const thickness = Number.parseFloat(size);
    if (thickness > 0 && color !== "transparent" && style.borderStyle !== "none") {
      context.fillStyle = color;
      context.fillRect(startX, startY, lineWidth || thickness, lineHeight || thickness);
    }
  }

  if (element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0) {
    const source = element.currentSrc || element.src;
    if (source.startsWith("data:") || source.startsWith("blob:") || source.startsWith(location.origin)) {
      context.drawImage(element, x, y, width, height);
    }
  }
  for (const child of element.childNodes) {
    if (child instanceof HTMLElement) drawElement(context, child, origin);
    else if (child instanceof Text) drawTextNode(context, child, origin, style);
  }
  context.restore();
}

async function captureHtml(element: HTMLElement, widthPx: number): Promise<HTMLCanvasElement> {
  const staging = document.createElement("div");
  staging.style.cssText = `position:fixed;left:-10000px;top:0;width:${widthPx}px;pointer-events:none;z-index:-1`;
  const clone = element.cloneNode(true) as HTMLElement;
  clone.removeAttribute("id");
  clone.style.width = `${widthPx}px`;
  clone.style.maxWidth = "none";
  clone.style.zoom = "1";
  staging.appendChild(clone);
  document.body.appendChild(staging);

  try {
    await document.fonts.ready;
    await Promise.all(Array.from(clone.querySelectorAll("img"), (image) => image.decode().catch(() => undefined)));
    const heightPx = Math.max(1, Math.ceil(clone.scrollHeight));
    const scale = Math.min(2, 16000 / Math.max(widthPx, heightPx));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(widthPx * scale));
    canvas.height = Math.max(1, Math.round(heightPx * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable.");
    context.scale(scale, scale);
    context.fillStyle = "#fff";
    context.fillRect(0, 0, widthPx, heightPx);
    drawElement(context, clone, clone.getBoundingClientRect());
    return canvas;
  } finally {
    staging.remove();
  }
}

function isBlankCanvas(canvas: HTMLCanvasElement): boolean {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable.");
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index] !== 255 || pixels[index + 1] !== 255 || pixels[index + 2] !== 255) return false;
  }
  return true;
}

function splitCanvasIntoPages(canvas: HTMLCanvasElement, pageHeightPx: number, removeBlankTrailingPages: boolean): HTMLCanvasElement[] {
  const pages: HTMLCanvasElement[] = [];
  for (let y = 0; y < canvas.height; y += pageHeightPx) {
    const page = document.createElement("canvas");
    page.width = canvas.width;
    page.height = pageHeightPx;
    const context = page.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable.");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, page.width, page.height);
    const sliceHeight = Math.min(pageHeightPx, canvas.height - y);
    context.drawImage(canvas, 0, y, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
    pages.push(page);
  }
  if (removeBlankTrailingPages) {
    while (pages.length > 1 && isBlankCanvas(pages[pages.length - 1])) pages.pop();
  }
  return pages;
}

/** Capture the current document design and download it as physical-size PDF pages. */
export async function downloadHtmlPagesAsPdf(
  elements: readonly HTMLElement[],
  filename: string,
  options: HtmlPdfOptions = {},
): Promise<void> {
  if (elements.length === 0) throw new Error("There is no document to export.");
  const size = options.pageSize ?? A4_PAGE_POINTS;
  const marginsMm = options.marginsMm ?? [0, 0, 0, 0];
  const margins = marginsMm.map((millimeters) => millimeters * pointsPerMm) as [number, number, number, number];
  const contentWidth = size[0] - margins[1] - margins[3];
  const contentHeight = size[1] - margins[0] - margins[2];
  if (contentWidth <= 0 || contentHeight <= 0) throw new Error("PDF margins exceed the page size.");
  const widthPx = Math.round(contentWidth * cssPixelsPerPoint);
  const pages: HTMLCanvasElement[] = [];
  for (const element of elements) {
    const canvas = await captureHtml(element, widthPx);
    const pageHeightPx = Math.round(canvas.width * contentHeight / contentWidth);
    pages.push(...splitCanvasIntoPages(canvas, pageHeightPx, options.removeBlankTrailingPages ?? false));
  }
  downloadCanvasPagesAsPdf(pages, filename, size, margins);
}

/** Wait for the preview tab and its measured pages to render before capture. */
export async function waitForPdfPreview(): Promise<void> {
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}
