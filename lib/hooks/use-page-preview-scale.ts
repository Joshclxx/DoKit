"use client";

import { useLayoutEffect, useRef, useState } from "react";

/** Fit a physical-width document inside its preview without changing its export size. */
export function usePagePreviewScale(widthMm: number, active: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    if (!active || !containerRef.current) return;
    const container = containerRef.current;
    const updateScale = () => {
      const style = window.getComputedStyle(container);
      const horizontalPadding = Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight);
      const availableWidth = container.clientWidth - horizontalPadding;
      const pageWidth = widthMm * 96 / 25.4;
      setScale(Math.min(1, Math.max(0.1, availableWidth / pageWidth)));
    };
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    updateScale();
    return () => observer.disconnect();
  }, [active, widthMm]);

  return { containerRef, scale };
}
