"use client";

import { useState, useMemo } from "react";

interface TZEntry {
  id: string;
  label: string;
  offset: number; // hours from UTC
  workStart: number;
  workEnd: number;
}

const commonTimezones = [
  { label: "UTC", offset: 0 },
  { label: "London (GMT)", offset: 0 },
  { label: "Paris (CET)", offset: 1 },
  { label: "Cairo (EET)", offset: 2 },
  { label: "Moscow (MSK)", offset: 3 },
  { label: "Dubai (GST)", offset: 4 },
  { label: "Karachi (PKT)", offset: 5 },
  { label: "Dhaka (BST)", offset: 6 },
  { label: "Bangkok (ICT)", offset: 7 },
  { label: "Singapore (SGT)", offset: 8 },
  { label: "Tokyo (JST)", offset: 9 },
  { label: "Sydney (AEST)", offset: 10 },
  { label: "Auckland (NZST)", offset: 12 },
  { label: "Honolulu (HST)", offset: -10 },
  { label: "Anchorage (AKST)", offset: -9 },
  { label: "Los Angeles (PST)", offset: -8 },
  { label: "Denver (MST)", offset: -7 },
  { label: "Chicago (CST)", offset: -6 },
  { label: "New York (EST)", offset: -5 },
  { label: "São Paulo (BRT)", offset: -3 },
  { label: "Manila (PHT)", offset: 8 },
];

let idCounter = 0;
function makeId() { return `tz-${++idCounter}`; }

function localHour(utcH: number, offset: number): number {
  return ((utcH + offset) % 24 + 24) % 24;
}

const hours24 = Array.from({ length: 24 }, (_, i) => i);

function formatHour(h: number): string {
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}${ampm}`;
}

export default function TimezoneOverlap() {
  const [entries, setEntries] = useState<TZEntry[]>([
    { id: makeId(), label: "New York (EST)", offset: -5, workStart: 9, workEnd: 17 },
    { id: makeId(), label: "London (GMT)", offset: 0, workStart: 9, workEnd: 17 },
  ]);

  const addTimezone = (tz: { label: string; offset: number }) => {
    setEntries((prev) => [
      ...prev,
      { id: makeId(), label: tz.label, offset: tz.offset, workStart: 9, workEnd: 17 },
    ]);
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const updateEntry = (id: string, field: "workStart" | "workEnd", value: number) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  // Find overlapping UTC hours where ALL entries are in working hours
  const overlap = useMemo(() => {
    if (entries.length < 2) return [];
    return hours24.filter((utcH) =>
      entries.every((e) => {
        const lh = localHour(utcH, e.offset);
        return e.workStart <= e.workEnd
          ? lh >= e.workStart && lh < e.workEnd
          : lh >= e.workStart || lh < e.workEnd; // overnight work hours
      })
    );
  }, [entries]);

  const overlapSet = useMemo(() => new Set(overlap), [overlap]);

  // Available timezones not already added
  const available = commonTimezones.filter(
    (tz) => !entries.some((e) => e.label === tz.label)
  );

  return (
    <div className="space-y-6">
      {/* Timezone list */}
      <div className="space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3">
            <span className="font-medium text-sm min-w-[160px]">{entry.label}</span>
            <div className="flex items-center gap-2 text-sm">
              <label className="text-muted">Work:</label>
              <select
                value={entry.workStart}
                onChange={(e) => updateEntry(entry.id, "workStart", Number(e.target.value))}
                className="h-8 rounded border border-border bg-background px-2 text-sm focus:border-accent focus:outline-none"
              >
                {hours24.map((h) => (
                  <option key={h} value={h}>{formatHour(h)}</option>
                ))}
              </select>
              <span className="text-muted">→</span>
              <select
                value={entry.workEnd}
                onChange={(e) => updateEntry(entry.id, "workEnd", Number(e.target.value))}
                className="h-8 rounded border border-border bg-background px-2 text-sm focus:border-accent focus:outline-none"
              >
                {hours24.map((h) => (
                  <option key={h} value={h}>{formatHour(h)}</option>
                ))}
              </select>
            </div>
            <span className="text-xs text-muted">UTC{entry.offset >= 0 ? "+" : ""}{entry.offset}</span>
            <button
              onClick={() => removeEntry(entry.id)}
              className="ml-auto rounded p-1 text-muted hover:text-danger transition-colors"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Add timezone */}
      {available.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-muted">Add Timezone</label>
          <div className="flex flex-wrap gap-2">
            {available.slice(0, 12).map((tz) => (
              <button
                key={tz.label}
                onClick={() => addTimezone(tz)}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-border-hover hover:text-foreground"
              >
                + {tz.label}
              </button>
            ))}
            {available.length > 12 && (
              <span className="self-center text-xs text-muted">+{available.length - 12} more</span>
            )}
          </div>
        </div>
      )}

      {/* Overlap summary */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
          Overlap Window
        </div>
        {entries.length < 2 ? (
          <p className="text-sm text-muted">Add at least 2 timezones to find overlap.</p>
        ) : overlap.length === 0 ? (
          <p className="text-sm text-danger">No overlapping working hours found. Try adjusting work hours.</p>
        ) : (
          <div>
            <p className="text-sm mb-2">
              <span className="font-semibold text-success">{overlap.length} hour{overlap.length !== 1 ? "s" : ""}</span> of overlap found
            </p>
            <div className="flex flex-wrap gap-2">
              {entries.map((e) => {
                const startLocal = localHour(overlap[0], e.offset);
                const endLocal = localHour(overlap[overlap.length - 1] + 1, e.offset);
                return (
                  <span key={e.id} className="rounded bg-success/10 px-3 py-1 text-sm text-success">
                    {e.label}: {formatHour(startLocal)} – {formatHour(endLocal)}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Visual time grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* UTC header */}
          <div className="flex">
            <div className="w-40 shrink-0 px-2 py-1 text-xs text-muted font-semibold">UTC</div>
            <div className="flex flex-1">
              {hours24.map((h) => (
                <div
                  key={h}
                  className={`flex-1 px-0.5 py-1 text-center text-[10px] font-mono ${
                    overlapSet.has(h) ? "text-success font-bold" : "text-muted"
                  }`}
                >
                  {h.toString().padStart(2, "0")}
                </div>
              ))}
            </div>
          </div>

          {/* Per-timezone rows */}
          {entries.map((entry) => (
            <div key={entry.id} className="flex border-t border-border">
              <div className="w-40 shrink-0 truncate px-2 py-2 text-xs font-medium">
                {entry.label}
              </div>
              <div className="flex flex-1">
                {hours24.map((utcH) => {
                  const lh = localHour(utcH, entry.offset);
                  const isWork = entry.workStart <= entry.workEnd
                    ? lh >= entry.workStart && lh < entry.workEnd
                    : lh >= entry.workStart || lh < entry.workEnd;
                  const isOverlap = overlapSet.has(utcH);

                  return (
                    <div
                      key={utcH}
                      className={`flex-1 flex items-center justify-center py-2 text-[10px] font-mono border-l border-border/30 transition-colors ${
                        isOverlap && isWork
                          ? "bg-success/20 text-success font-bold"
                          : isWork
                            ? "bg-accent/10 text-accent"
                            : lh >= 0 && lh < 6
                              ? "bg-surface-hover/50 text-muted/50"
                              : "text-muted"
                      }`}
                      title={`${entry.label}: ${formatHour(lh)} (UTC ${utcH}:00)${isOverlap ? " — OVERLAP" : ""}`}
                    >
                      {lh.toString().padStart(2, "0")}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded bg-success/20 border border-success/30" /> Overlap
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded bg-accent/10 border border-accent/20" /> Working hours
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded bg-surface-hover/50 border border-border" /> Night (12–6 AM)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
