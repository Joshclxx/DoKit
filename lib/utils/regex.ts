export interface RegexMatchResult {
  full: string;
  groups: string[];
  index: number;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function advanceAfterEmptyMatch(regex: RegExp, match: RegExpExecArray): void {
  if (match[0] === "") regex.lastIndex += 1;
}

export function buildRegexResults(pattern: string, flags: string, testText: string): {
  matches: RegexMatchResult[];
  highlighted: string;
} {
  const globalFlags = flags.includes("g") ? flags : `${flags}g`;
  const matches: RegexMatchResult[] = [];
  const matchRegex = new RegExp(pattern, globalFlags);
  let match: RegExpExecArray | null;
  while ((match = matchRegex.exec(testText)) !== null) {
    matches.push({ full: match[0], groups: match.slice(1), index: match.index });
    advanceAfterEmptyMatch(matchRegex, match);
    if (!flags.includes("g")) break;
  }

  let highlighted = "";
  let lastIndex = 0;
  const highlightRegex = new RegExp(pattern, globalFlags);
  while ((match = highlightRegex.exec(testText)) !== null) {
    highlighted += escapeHtml(testText.slice(lastIndex, match.index));
    highlighted += `<mark class="bg-accent/30 text-accent-fg rounded px-0.5">${escapeHtml(match[0])}</mark>`;
    lastIndex = match.index + match[0].length;
    advanceAfterEmptyMatch(highlightRegex, match);
    if (!flags.includes("g")) break;
  }
  highlighted += escapeHtml(testText.slice(lastIndex));

  return { matches, highlighted };
}

export function generateRegexSnippet(
  pattern: string,
  flags: string,
  language: "js" | "python" | "php"
): string {
  switch (language) {
    case "js": {
      const jsPattern = pattern.replace(/\//g, "\\/");
      return `const regex = /${jsPattern}/${flags};\nconst matches = text.match(regex);`;
    }
    case "python": {
      const pythonPattern = pattern.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      const pythonFlags = [];
      if (flags.includes("i")) pythonFlags.push("re.IGNORECASE");
      if (flags.includes("m")) pythonFlags.push("re.MULTILINE");
      if (flags.includes("s")) pythonFlags.push("re.DOTALL");
      const flagArgument = pythonFlags.length ? `, ${pythonFlags.join(" | ")}` : "";
      return `import re\n\nmatches = re.findall('${pythonPattern}'${flagArgument}, text)`;
    }
    case "php": {
      const phpPattern = pattern
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/\//g, "\\/");
      let phpFlags = "";
      if (flags.includes("i")) phpFlags += "i";
      if (flags.includes("m")) phpFlags += "m";
      if (flags.includes("s")) phpFlags += "s";
      return `preg_match_all('/${phpPattern}/${phpFlags}', $text, $matches);`;
    }
  }
}
