"use client";

import { useState, useEffect } from "react";

export function SplashScreen() {
  const [phase, setPhase] = useState<"visible" | "fading" | "gone">("visible");

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fadeTimer = window.setTimeout(
      () => setPhase("fading"),
      reduceMotion ? 500 : 3200,
    );
    const removeTimer = window.setTimeout(
      () => setPhase("gone"),
      reduceMotion ? 800 : 3900,
    );

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      className="splash-overlay"
      data-fading={phase === "fading" ? "" : undefined}
      aria-hidden="true"
    >
      {/* Ambient glow */}
      <div className="splash-glow" />

      <div className="splash-logo-wrapper">
        {/* Icon — starts centered, slides left when text appears */}
        <div className="splash-icon-container">
          <svg
            viewBox="16 16 72 72"
            xmlns="http://www.w3.org/2000/svg"
            className="splash-icon-svg"
          >
            <rect className="splash-piece splash-piece-bg" x="20" y="20" width="64" height="64" rx="14" fill="#085041" />
            <rect className="splash-piece splash-piece-frame" x="30" y="30" width="44" height="44" rx="8" fill="none" stroke="#5DCAA5" strokeWidth="2.5" />
            <path className="splash-piece splash-piece-d" d="M39 38 L39 64 L46 64 Q58 64 58 51 Q58 38 46 38 Z" fill="#9FE1CB" />
            <rect className="splash-piece splash-piece-window" x="50" y="46" width="7" height="7" rx="1.5" fill="#085041" />
            <circle className="splash-piece splash-piece-dot1" cx="67" cy="41" r="3.5" fill="#1D9E75" />
            <circle className="splash-piece splash-piece-dot2" cx="67" cy="51" r="3.5" fill="#1D9E75" />
            <circle className="splash-piece splash-piece-dot3" cx="67" cy="61" r="3.5" fill="#1D9E75" />
          </svg>
        </div>

        {/* Text — expands in after icon slides */}
        <div className="splash-text-container">
          <svg
            viewBox="96 18 200 78"
            xmlns="http://www.w3.org/2000/svg"
            className="splash-text-svg"
          >
            <text
              x="196" y="65"
              textAnchor="middle"
              fontFamily="Georgia, serif"
              fontSize="44"
            >
              <tspan className="splash-letter-1" fill="#9FE1CB" fontWeight="700">D</tspan>
              <tspan className="splash-letter-2" fill="#9FE1CB" fontWeight="700">o</tspan>
              <tspan className="splash-letter-3" fill="#5DCAA5" fontWeight="400">K</tspan>
              <tspan className="splash-letter-4" fill="#5DCAA5" fontWeight="400">i</tspan>
              <tspan className="splash-letter-5" fill="#5DCAA5" fontWeight="400">t</tspan>
            </text>

            <text
              x="196" y="88"
              textAnchor="middle"
              className="splash-text-tagline"
              fill="#1D9E75"
              fontFamily="'Helvetica Neue', Arial, sans-serif"
              fontSize="11"
              fontWeight="400"
            >
              PICK A TOOL. GET IT DONE.
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}
