"use client";

import { useState, useMemo } from "react";

/* ── Text analysis utilities ─────────────────────── */
function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;
  const count = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
    .replace(/^y/, "")
    .match(/[aeiouy]{1,2}/g);
  return count ? count.length : 1;
}

function getSentences(text: string): string[] {
  return text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
}

function getWords(text: string): string[] {
  return text.split(/\s+/).filter((w) => w.length > 0);
}

function getParagraphs(text: string): string[] {
  return text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

function fleschKincaid(words: number, sentences: number, syllables: number) {
  if (sentences === 0 || words === 0) return 0;
  return 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
}

function gunningFog(words: number, sentences: number, complexWords: number) {
  if (sentences === 0 || words === 0) return 0;
  return 0.4 * ((words / sentences) + 100 * (complexWords / words));
}

function getReadabilityLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Very Easy", color: "text-success" };
  if (score >= 60) return { label: "Easy", color: "text-emerald-400" };
  if (score >= 40) return { label: "Moderate", color: "text-warning" };
  if (score >= 20) return { label: "Difficult", color: "text-orange-400" };
  return { label: "Very Difficult", color: "text-danger" };
}

function detectPassiveVoice(sentences: string[]): { sentence: string; index: number }[] {
  const beVerbs = /\b(is|are|was|were|been|being|be|am)\b/i;
  const pastParticiple = /\b\w+(ed|en|wn|ught|elt|ept|ade|ung|orn)\b/i;
  return sentences
    .map((s, i) => ({ sentence: s, index: i }))
    .filter(({ sentence }) => beVerbs.test(sentence) && pastParticiple.test(sentence));
}

function getKeywordDensity(words: string[], top = 15): { word: string; count: number; pct: number }[] {
  const stopWords = new Set(["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "from", "is", "it", "as", "be", "was", "are", "were", "been", "has", "had", "have", "do", "does", "did", "will", "would", "could", "should", "may", "might", "this", "that", "these", "those", "i", "you", "he", "she", "we", "they", "my", "your", "his", "her", "our", "their", "its", "not", "no", "so", "if", "then", "than", "when", "what", "which", "who", "how", "all", "each", "very", "just", "also", "about", "up", "out", "can", "into", "over", "such", "after", "before"]);
  const freq: Record<string, number> = {};
  for (const w of words) {
    const lw = w.toLowerCase().replace(/[^a-z'-]/g, "");
    if (lw.length < 3 || stopWords.has(lw)) continue;
    freq[lw] = (freq[lw] || 0) + 1;
  }
  const total = words.length || 1;
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([word, count]) => ({ word, count, pct: (count / total) * 100 }));
}

export default function TextIntelligenceAnalyzer() {
  const [input, setInput] = useState("");

  const analysis = useMemo(() => {
    if (!input.trim()) return null;

    const words = getWords(input);
    const sentences = getSentences(input);
    const paragraphs = getParagraphs(input);
    const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
    const complexWords = words.filter((w) => countSyllables(w) >= 3).length;
    const avgWordLen = words.length ? (words.reduce((s, w) => s + w.length, 0) / words.length) : 0;
    const avgSentLen = sentences.length ? words.length / sentences.length : 0;
    const fk = fleschKincaid(words.length, sentences.length, totalSyllables);
    const fog = gunningFog(words.length, sentences.length, complexWords);
    const passive = detectPassiveVoice(sentences);
    const keywords = getKeywordDensity(words);
    const readingTime = Math.max(1, Math.ceil(words.length / 200));
    const speakingTime = Math.max(1, Math.ceil(words.length / 130));

    return {
      chars: input.length,
      charsNoSpace: input.replace(/\s/g, "").length,
      words: words.length,
      sentences: sentences.length,
      paragraphs: paragraphs.length,
      syllables: totalSyllables,
      avgWordLen: avgWordLen.toFixed(1),
      avgSentLen: avgSentLen.toFixed(1),
      complexWords,
      complexPct: words.length ? ((complexWords / words.length) * 100).toFixed(1) : "0",
      fleschKincaid: Math.max(0, Math.min(100, fk)).toFixed(1),
      gunningFog: fog.toFixed(1),
      readability: getReadabilityLabel(fk),
      passive,
      passivePct: sentences.length ? ((passive.length / sentences.length) * 100).toFixed(1) : "0",
      keywords,
      readingTime,
      speakingTime,
    };
  }, [input]);

  return (
    <div className="space-y-6">
      {/* Input */}
      <div>
        <label className="mb-2 block text-sm font-medium text-muted">
          Paste or type your text
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter text to analyze…"
          rows={8}
          className="w-full rounded-lg border border-border bg-surface p-3 text-sm leading-relaxed transition-colors focus:border-accent focus:outline-none resize-y"
        />
      </div>

      {analysis && (
        <>
          {/* Stats grid */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "Words", value: analysis.words },
              { label: "Characters", value: analysis.chars },
              { label: "Sentences", value: analysis.sentences },
              { label: "Paragraphs", value: analysis.paragraphs },
              { label: "Reading", value: `${analysis.readingTime} min` },
              { label: "Speaking", value: `${analysis.speakingTime} min` },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border border-border bg-surface p-3 text-center">
                <div className="text-xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Readability scores */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                Flesch-Kincaid Readability
              </div>
              <div className="flex items-baseline gap-3">
                <span className={`text-3xl font-bold ${analysis.readability.color}`}>
                  {analysis.fleschKincaid}
                </span>
                <span className={`text-sm font-medium ${analysis.readability.color}`}>
                  {analysis.readability.label}
                </span>
              </div>
              {/* Score bar */}
              <div className="mt-3 h-2 w-full rounded-full bg-surface-hover overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, Number(analysis.fleschKincaid)))}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-xs text-muted">
                <span>Hard</span><span>Easy</span>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-surface p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                Gunning Fog Index
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold">{analysis.gunningFog}</span>
                <span className="text-sm text-muted">grade level</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted">Avg sentence: </span>
                  <span className="font-medium">{analysis.avgSentLen} words</span>
                </div>
                <div>
                  <span className="text-muted">Avg word: </span>
                  <span className="font-medium">{analysis.avgWordLen} chars</span>
                </div>
                <div>
                  <span className="text-muted">Complex words: </span>
                  <span className="font-medium">{analysis.complexWords} ({analysis.complexPct}%)</span>
                </div>
                <div>
                  <span className="text-muted">Syllables: </span>
                  <span className="font-medium">{analysis.syllables}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Passive voice */}
          <div className="rounded-lg border border-border bg-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Passive Voice
              </span>
              <span className={`text-sm font-medium ${Number(analysis.passivePct) > 20 ? "text-warning" : "text-success"}`}>
                {analysis.passive.length} detected ({analysis.passivePct}%)
              </span>
            </div>
            {analysis.passive.length === 0 ? (
              <p className="text-sm text-muted">No passive voice detected — great!</p>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1">
                {analysis.passive.map((p, i) => (
                  <div key={i} className="rounded bg-warning/10 px-3 py-1.5 text-sm">
                    <span className="text-muted mr-2">#{p.index + 1}</span>
                    {p.sentence}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Keyword density */}
          <div className="rounded-lg border border-border bg-surface p-5">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Keyword Density (Top 15)
            </div>
            {analysis.keywords.length === 0 ? (
              <p className="text-sm text-muted">Not enough content.</p>
            ) : (
              <div className="space-y-1.5">
                {analysis.keywords.map((kw) => (
                  <div key={kw.word} className="flex items-center gap-3 text-sm">
                    <span className="w-28 truncate font-mono font-medium">{kw.word}</span>
                    <div className="flex-1 h-2 rounded-full bg-surface-hover overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent/60 transition-all"
                        style={{ width: `${Math.min(100, kw.pct * 20)}%` }}
                      />
                    </div>
                    <span className="w-16 text-right text-xs text-muted">
                      {kw.count}× ({kw.pct.toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
