import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const toolsSource = readFileSync(join(root, "lib", "tools.ts"), "utf8");
const kitsSource = readFileSync(join(root, "lib", "kits.ts"), "utf8");
const routeSource = readFileSync(join(root, "app", "tools", "[slug]", "page.tsx"), "utf8");

const catalogEntries = [...toolsSource.matchAll(/id:\s*"([^"]+)"[\s\S]*?slug:\s*"([^"]+)"/g)]
  .map((match) => ({ id: match[1], slug: match[2] }));
const catalogSlugs = catalogEntries.map((entry) => entry.slug);
const registrySlugs = [...routeSource.matchAll(/^\s*"([^"]+)":\s*dynamic\(/gm)]
  .map((match) => match[1]);
const componentImports = [...routeSource.matchAll(/import\("@\/app\/components\/tools\/([^"]+)"\)/g)]
  .map((match) => match[1]);

test("the catalog has unique, sequential feature IDs and slugs", () => {
  assert.equal(catalogEntries.length, 44);
  assert.equal(new Set(catalogEntries.map((entry) => entry.id)).size, catalogEntries.length);
  assert.equal(new Set(catalogSlugs).size, catalogSlugs.length);
  assert.deepEqual(
    catalogEntries.map((entry) => entry.id),
    catalogEntries.map((_, index) => `F-${String(index + 1).padStart(2, "0")}`)
  );
});

test("every catalog tool has exactly one routed component", () => {
  assert.deepEqual([...registrySlugs].sort(), [...catalogSlugs].sort());
  assert.equal(new Set(registrySlugs).size, registrySlugs.length);
  assert.equal(componentImports.length, registrySlugs.length);
  for (const component of componentImports) {
    assert.ok(
      existsSync(join(root, "app", "components", "tools", `${component}.tsx`)),
      `missing component file for ${component}`
    );
  }
});

test("every kit references real tools without duplicates", () => {
  const arrays = [...kitsSource.matchAll(/toolSlugs:\s*\[([\s\S]*?)\]/g)];
  assert.ok(arrays.length > 0);
  for (const array of arrays) {
    const slugs = [...array[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(slugs).size, slugs.length);
    for (const slug of slugs) assert.ok(catalogSlugs.includes(slug), `unknown kit tool: ${slug}`);
  }
});

test("network-backed tools carry a catalog disclosure", () => {
  for (const slug of ["api-request-tester", "qr-code-builder", "youtube-video-inspector"]) {
    const entry = toolsSource.match(new RegExp(`\\{[^\\n]*slug: "${slug}"[^\\n]*\\}`))?.[0] ?? "";
    assert.match(entry, /networkNote:/, `${slug} is missing networkNote`);
  }
});

test("root metadata only references public assets that exist", () => {
  const layoutSource = readFileSync(join(root, "app", "layout.tsx"), "utf8");
  const assetUrls = [...layoutSource.matchAll(/(?:url:|apple:)\s*"\/([^"]+)"/g)]
    .map((match) => match[1]);
  assert.ok(assetUrls.length > 0);
  for (const asset of assetUrls) {
    assert.ok(existsSync(join(root, "public", asset)), `missing metadata asset: /${asset}`);
  }
});
