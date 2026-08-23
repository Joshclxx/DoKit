"use client";

import { useState, useMemo } from "react";
import { copyToClipboard } from "@/lib/utils/download";

interface Currency { code: string; name: string; symbol: string; rate: number; }

// Rates relative to USD (approximate, offline-first)
const currencies: Currency[] = [
  { code: "USD", name: "US Dollar", symbol: "$", rate: 1 },
  { code: "EUR", name: "Euro", symbol: "€", rate: 0.92 },
  { code: "GBP", name: "British Pound", symbol: "£", rate: 0.79 },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", rate: 154.5 },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", rate: 1.36 },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", rate: 1.53 },
  { code: "CHF", name: "Swiss Franc", symbol: "Fr", rate: 0.88 },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", rate: 7.24 },
  { code: "INR", name: "Indian Rupee", symbol: "₹", rate: 83.4 },
  { code: "PHP", name: "Philippine Peso", symbol: "₱", rate: 56.2 },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", rate: 1.34 },
  { code: "KRW", name: "South Korean Won", symbol: "₩", rate: 1330 },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", rate: 4.72 },
  { code: "THB", name: "Thai Baht", symbol: "฿", rate: 35.8 },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", rate: 15800 },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫", rate: 25400 },
  { code: "TWD", name: "Taiwan Dollar", symbol: "NT$", rate: 31.5 },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", rate: 7.82 },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", rate: 1.67 },
  { code: "MXN", name: "Mexican Peso", symbol: "MX$", rate: 17.2 },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", rate: 4.97 },
  { code: "ZAR", name: "South African Rand", symbol: "R", rate: 18.6 },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", rate: 3.67 },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼", rate: 3.75 },
  { code: "TRY", name: "Turkish Lira", symbol: "₺", rate: 32.4 },
  { code: "SEK", name: "Swedish Krona", symbol: "kr", rate: 10.5 },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr", rate: 10.8 },
  { code: "DKK", name: "Danish Krone", symbol: "kr", rate: 6.87 },
  { code: "PLN", name: "Polish Zloty", symbol: "zł", rate: 3.98 },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč", rate: 23.1 },
];

export default function CurrencyConverter() {
  const [amount, setAmount] = useState(1000);
  const [fromCode, setFromCode] = useState("USD");
  const [toCode, setToCode] = useState("EUR");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const from = currencies.find((c) => c.code === fromCode)!;
  const to = currencies.find((c) => c.code === toCode)!;

  const converted = useMemo(() => {
    const inUsd = amount / from.rate;
    return inUsd * to.rate;
  }, [amount, from, to]);

  const exchangeRate = to.rate / from.rate;

  const swap = () => { setFromCode(toCode); setToCode(fromCode); };

  const quickRates = useMemo(() => {
    const q = search.toLowerCase();
    return currencies
      .filter((c) => c.code !== fromCode)
      .filter((c) => !q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
      .map((c) => ({ ...c, converted: (amount / from.rate) * c.rate }));
  }, [amount, from, fromCode, search]);

  const fmt = (n: number, decimals = 2) => n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  return (
    <div className="space-y-6">
      {/* Main converter */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] items-end">
          <div>
            <label className="mb-1 block text-xs text-muted">From</label>
            <select value={fromCode} onChange={(e) => setFromCode(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none mb-2">
              {currencies.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
            </select>
            <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value))}
              className="h-12 w-full rounded-lg border border-border bg-background px-4 text-xl font-mono font-bold focus:border-accent focus:outline-none" />
          </div>
          <button onClick={swap}
            className="h-10 w-10 rounded-full border border-border bg-surface flex items-center justify-center text-lg hover:bg-surface-hover transition-colors self-center">
            ⇄
          </button>
          <div>
            <label className="mb-1 block text-xs text-muted">To</label>
            <select value={toCode} onChange={(e) => setToCode(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none mb-2">
              {currencies.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
            </select>
            <div className="h-12 flex items-center rounded-lg border border-border bg-accent/5 px-4">
              <span className="text-xl font-mono font-bold text-accent">{to.symbol} {fmt(converted)}</span>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-sm text-muted">
          <span>1 {fromCode} = {fmt(exchangeRate, 4)} {toCode}</span>
          <button onClick={async () => { await copyToClipboard(`${from.symbol}${fmt(amount)} = ${to.symbol}${fmt(converted)}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="text-xs hover:text-foreground">{copied ? "✓ Copied" : "📋 Copy"}</button>
        </div>
        <p className="mt-1 text-[10px] text-muted">⚠ Offline rates — approximate values for reference only</p>
      </div>

      {/* Quick reference table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Quick Reference — {fmt(amount)} {fromCode}</span>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter…"
            className="h-8 w-40 rounded-lg border border-border bg-surface px-3 text-xs focus:border-accent focus:outline-none" />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {quickRates.slice(0, 18).map((c) => (
            <div key={c.code}
              onClick={() => setToCode(c.code)}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${
                c.code === toCode ? "border-accent bg-accent/5" : "border-border bg-surface hover:bg-surface-hover"
              }`}>
              <span className="font-medium">{c.code} <span className="text-xs text-muted">{c.symbol}</span></span>
              <span className="font-mono">{fmt(c.converted)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
