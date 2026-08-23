"use client";

import { useState, useMemo } from "react";
import { copyToClipboard } from "@/lib/utils/download";

interface Ingredient { name: string; quantity: number; unit: string; costPerUnit: number; }

export default function FoodCostingTool() {
  const [recipeName, setRecipeName] = useState("");
  const [servings, setServings] = useState(4);
  const [targetFoodCostPct, setTargetFoodCostPct] = useState(30);
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: "", quantity: 0, unit: "g", costPerUnit: 0 },
  ]);
  const [copied, setCopied] = useState(false);

  const units = ["g", "kg", "ml", "L", "oz", "lb", "cup", "tbsp", "tsp", "pcs", "bunch", "can"];

  const updateIng = (i: number, f: keyof Ingredient, v: string | number) =>
    setIngredients((p) => p.map((ing, idx) => idx === i ? { ...ing, [f]: v } : ing));
  const addIng = () => setIngredients((p) => [...p, { name: "", quantity: 0, unit: "g", costPerUnit: 0 }]);
  const rmIng = (i: number) => setIngredients((p) => p.filter((_, idx) => idx !== i));

  const { totalCost, costPerServing, suggestedPrice, foodCostPct, margin } = useMemo(() => {
    const totalCost = ingredients.reduce((s, ing) => s + ing.quantity * ing.costPerUnit, 0);
    const costPerServing = servings > 0 ? totalCost / servings : 0;
    const suggestedPrice = targetFoodCostPct > 0 ? costPerServing / (targetFoodCostPct / 100) : 0;
    const foodCostPct = suggestedPrice > 0 ? (costPerServing / suggestedPrice) * 100 : 0;
    const margin = suggestedPrice - costPerServing;
    return { totalCost, costPerServing, suggestedPrice, foodCostPct, margin };
  }, [ingredients, servings, targetFoodCostPct]);

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const inp = "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none";

  return (
    <div className="space-y-6">
      {/* Recipe info */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs text-muted">Recipe Name</label>
          <input type="text" value={recipeName} onChange={(e) => setRecipeName(e.target.value)} placeholder="e.g. Chicken Adobo" className={inp} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Servings</label>
          <input type="number" min={1} value={servings} onChange={(e) => setServings(Number(e.target.value))} className={inp} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Target Food Cost %</label>
          <input type="number" min={1} max={100} value={targetFoodCostPct} onChange={(e) => setTargetFoodCostPct(Number(e.target.value))} className={inp} />
        </div>
      </div>

      {/* Ingredients */}
      <fieldset className="rounded-lg border border-border bg-surface p-4 space-y-3">
        <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Ingredients</legend>
        {/* Header */}
        <div className="hidden sm:grid gap-2 sm:grid-cols-[1fr_80px_90px_110px_110px_32px] text-xs text-muted font-medium px-1">
          <span>Name</span><span>Qty</span><span>Unit</span><span>Cost/Unit</span><span>Total</span><span></span>
        </div>
        {ingredients.map((ing, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_80px_90px_110px_110px_32px] items-end">
            <input type="text" placeholder="Ingredient" value={ing.name} onChange={(e) => updateIng(i, "name", e.target.value)} className={inp} />
            <input type="number" step="0.01" min={0} placeholder="Qty" value={ing.quantity || ""} onChange={(e) => updateIng(i, "quantity", Number(e.target.value))} className={inp} />
            <select value={ing.unit} onChange={(e) => updateIng(i, "unit", e.target.value)} className={inp}>
              {units.map((u) => <option key={u}>{u}</option>)}
            </select>
            <input type="number" step="0.01" min={0} placeholder="Cost" value={ing.costPerUnit || ""} onChange={(e) => updateIng(i, "costPerUnit", Number(e.target.value))} className={inp} />
            <span className="h-9 flex items-center text-sm text-muted font-mono">{fmt(ing.quantity * ing.costPerUnit)}</span>
            <button onClick={() => rmIng(i)} className="h-9 text-muted hover:text-danger text-sm">✕</button>
          </div>
        ))}
        <button onClick={addIng} className="rounded-lg border border-dashed border-border px-4 py-2 text-sm text-muted hover:border-accent hover:text-accent transition-colors">
          + Add Ingredient
        </button>
      </fieldset>

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Total Recipe Cost" value={fmt(totalCost)} sub={`${ingredients.filter((i) => i.name).length} ingredients`} />
        <Card label="Cost per Serving" value={fmt(costPerServing)} sub={`${servings} servings`} />
        <Card label="Suggested Menu Price" value={fmt(suggestedPrice)} sub={`at ${targetFoodCostPct}% food cost`} accent />
        <Card label="Margin per Serving" value={fmt(margin)} sub={`${foodCostPct.toFixed(1)}% food cost`} />
      </div>

      {/* Visual breakdown */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Cost Breakdown</div>
        <div className="space-y-2">
          {ingredients.filter((i) => i.name && i.quantity * i.costPerUnit > 0).map((ing, i) => {
            const cost = ing.quantity * ing.costPerUnit;
            const pct = totalCost > 0 ? (cost / totalCost) * 100 : 0;
            return (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="w-32 truncate">{ing.name}</span>
                <div className="flex-1 h-5 rounded-full bg-surface-hover overflow-hidden">
                  <div className="h-full rounded-full bg-accent/60 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-16 text-right font-mono text-xs text-muted">{pct.toFixed(1)}%</span>
                <span className="w-20 text-right font-mono text-xs">{fmt(cost)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <button onClick={async () => {
        const text = `${recipeName || "Recipe"}\nTotal: ${fmt(totalCost)} · Per serving: ${fmt(costPerServing)} · Menu price: ${fmt(suggestedPrice)}`;
        await copyToClipboard(text); setCopied(true); setTimeout(() => setCopied(false), 2000);
      }} className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-hover">
        {copied ? "✓ Copied" : "Copy Summary"}
      </button>
    </div>
  );
}

function Card({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${accent ? "border-accent bg-accent/5" : "border-border bg-surface"}`}>
      <div className="text-xs text-muted mb-1">{label}</div>
      <div className={`text-xl font-bold font-mono ${accent ? "text-accent" : ""}`}>{value}</div>
      <div className="text-xs text-muted mt-1">{sub}</div>
    </div>
  );
}
