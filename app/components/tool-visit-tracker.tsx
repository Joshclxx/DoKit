"use client";

import { useEffect } from "react";
import { RECENT_TOOLS_KEY } from "@/lib/preferences";

export function ToolVisitTracker({ slug }: { slug: string }) {
  useEffect(() => {
    try {
      const current = JSON.parse(localStorage.getItem(RECENT_TOOLS_KEY) ?? "[]") as string[];
      localStorage.setItem(
        RECENT_TOOLS_KEY,
        JSON.stringify([slug, ...current.filter((item) => item !== slug)].slice(0, 6))
      );
      window.dispatchEvent(new Event("dokit-recent-change"));
    } catch {
      localStorage.setItem(RECENT_TOOLS_KEY, JSON.stringify([slug]));
      window.dispatchEvent(new Event("dokit-recent-change"));
    }
  }, [slug]);

  return null;
}
