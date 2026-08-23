"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

const ThemeContext = createContext<{
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
  toggle: () => void;
}>({ theme: "system", resolvedTheme: "dark", setTheme: () => {}, toggle: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [{ theme, resolvedTheme, ready }, setThemeState] = useState<{
    theme: ThemePreference;
    resolvedTheme: ResolvedTheme;
    ready: boolean;
  }>({ theme: "system", resolvedTheme: "dark", ready: false });

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const resolve = (preference: ThemePreference): ResolvedTheme =>
      preference === "system" ? (media.matches ? "dark" : "light") : preference;
    const timer = window.setTimeout(() => {
      const stored = localStorage.getItem("dokit-theme");
      const initialTheme: ThemePreference = stored === "light" || stored === "dark" || stored === "system"
        ? stored
        : "system";
      const resolved = resolve(initialTheme);
      document.documentElement.setAttribute("data-theme", resolved);
      setThemeState({ theme: initialTheme, resolvedTheme: resolved, ready: true });
    }, 0);
    const handleSystemChange = () => {
      setThemeState((current) => {
        if (current.theme !== "system") return current;
        const resolved = media.matches ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", resolved);
        return { ...current, resolvedTheme: resolved };
      });
    };
    media.addEventListener("change", handleSystemChange);
    return () => {
      window.clearTimeout(timer);
      media.removeEventListener("change", handleSystemChange);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    localStorage.setItem("dokit-theme", theme);
  }, [ready, resolvedTheme, theme]);

  const setTheme = (nextTheme: ThemePreference) => {
    const resolved = nextTheme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      : nextTheme;
    setThemeState({ theme: nextTheme, resolvedTheme: resolved, ready: true });
  };

  const toggle = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
