import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (...parts) => readFileSync(join(root, ...parts), "utf8");

test("wireframe shell routes and the mobile Android download are present", () => {
  assert.ok(existsSync(join(root, "app", "settings", "page.tsx")));
  assert.ok(existsSync(join(root, "app", "kits", "page.tsx")));
  const rootLayout = read("app", "layout.tsx");
  assert.match(rootLayout, /<Sidebar \/>/);
  assert.match(rootLayout, /<MobileTabBar \/>/);
  assert.match(read("app", "settings", "page.tsx"), /<MobileDownloadLanding \/>/);
  assert.match(rootLayout, /<SplashScreen \/>/);
  assert.match(rootLayout, /dataset\.dokitRuntime/);
  assert.match(rootLayout, /dataset\.dokitDevice/);
  const sidebar = read("app", "components", "sidebar.tsx");
  assert.match(sidebar, /Search tools from the sidebar/);
  assert.match(sidebar, /Jump back in/);
  const mobileHome = read("app", "components", "mobile-home.tsx");
  assert.match(mobileHome, /Recently used/);
  assert.match(mobileHome, />Kits</);
  const mobileTabs = read("app", "components", "mobile-tab-bar.tsx");
  assert.match(mobileTabs, /data-mobile-nav-icon/);
  assert.match(mobileTabs, /className="h-6 w-6"/);
  assert.doesNotMatch(mobileTabs, /icon: "[⌂⌕▦⚙]"/);
  const navbar = read("app", "components", "navbar.tsx");
  assert.doesNotMatch(navbar, /href="\/tools"/);
  assert.doesNotMatch(navbar, /href="\/settings"/);
  const landing = read("app", "components", "mobile-download-landing.tsx");
  assert.match(landing, /DoKit for Android/);
  assert.match(landing, /Version 1\.0\.3/);
  assert.match(landing, />Get APK</);
  assert.match(landing, /dokit-android-v1\.0\.3-debug\.apk/);
  assert.match(landing, /NEXT_PUBLIC_ANDROID_APK_URL/);
  assert.doesNotMatch(landing, /Continue in the browser/);
});

test("the opening animation covers web and installed-app launches accessibly", () => {
  const splash = read("app", "components", "splash-screen.tsx");
  const styles = read("app", "globals.css");
  assert.match(splash, /prefers-reduced-motion: reduce/);
  assert.match(splash, /aria-hidden="true"/);
  assert.match(splash, /reduceMotion \? 500 : 3200/);
  assert.equal([...splash.matchAll(/textAnchor="middle"/g)].length, 2);
  assert.match(styles, /@media \(max-width: 480px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});

test("UI System Blueprint exposes the promised 54 templates", () => {
  const source = read("app", "components", "tools", "ui-system-blueprint.tsx");
  const arraySource = source.match(/const templates: UITemplate\[\] = \[([\s\S]*?)\n\];/)?.[1] ?? "";
  assert.equal([...arraySource.matchAll(/\{ id:/g)].length, 54);
});

test("catalog and kit search empty states provide reset actions", () => {
  assert.match(read("app", "components", "tool-grid.tsx"), /Clear filters/);
  assert.match(read("app", "components", "kit-tool-grid.tsx"), /Clear search/);
});

test("generator drafts share the settings defaults", () => {
  for (const file of ["invoice-builder.tsx", "quotation-generator.tsx", "proposal-generator.tsx"]) {
    const source = read("app", "components", "tools", file);
    assert.match(source, /defaultPreferences/);
    assert.match(source, /useLocalStorage/);
  }
});

test("Capacitor packages the static export as the installed mobile app", () => {
  const capacitor = read("capacitor.config.ts");
  const nextConfig = read("next.config.ts");
  const packageJson = JSON.parse(read("package.json"));
  assert.match(capacitor, /appId: "app\.dokit\.mobile"/);
  assert.match(capacitor, /webDir: "out"/);
  assert.match(capacitor, /DoKitApp\/1\.0\.3/);
  assert.match(read("android", "app", "build.gradle"), /versionCode 4/);
  assert.match(read("android", "app", "build.gradle"), /versionName "1\.0\.3"/);
  assert.match(nextConfig, /CAPACITOR_BUILD/);
  assert.match(nextConfig, /output: "export"/);
  assert.match(nextConfig, /unoptimized: true/);
  assert.ok(packageJson.scripts["android:sync"]);
  assert.ok(packageJson.scripts["android:apk"]);
  assert.match(read("android", "variables.gradle"), /minSdkVersion = 26/);
});
