import assert from "node:assert/strict";
import { test } from "node:test";
import { buildRegexResults, generateRegexSnippet } from "../lib/utils/regex.ts";

test("global zero-width matches terminate and advance", () => {
  const result = buildRegexResults("^|$", "gm", "abc");
  assert.deepEqual(result.matches.map((match) => match.index), [0, 3]);
});

test("lookahead matches are collected without freezing", () => {
  const result = buildRegexResults("(?=a)", "g", "aa");
  assert.deepEqual(result.matches.map((match) => match.index), [0, 1]);
});

test("highlight output escapes user HTML", () => {
  const result = buildRegexResults("safe", "g", '<img src=x onerror="alert(1)"> safe');
  assert.doesNotMatch(result.highlighted, /<img/);
  assert.match(result.highlighted, /&lt;img/);
});

test("generated snippets preserve regex meaning and delimiters", () => {
  assert.match(generateRegexSnippet("\\d+", "gi", "python"), /re\.findall\('\\\\d\+'/);
  assert.match(generateRegexSnippet("a/b", "g", "js"), /a\\\/b/);
  assert.match(generateRegexSnippet("a/b", "g", "php"), /a\\\/b/);
});
