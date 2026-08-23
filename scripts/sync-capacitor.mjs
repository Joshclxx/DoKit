import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function run(script, args, env = process.env) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    env,
    stdio: "inherit",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(join(root, "node_modules", "next", "dist", "bin", "next"), ["build"], {
  ...process.env,
  CAPACITOR_BUILD: "true",
});

// The website serves APKs, but the native WebView must not package installer
// files inside the next APK.
const embeddedDownloads = join(root, "out", "downloads");
if (existsSync(embeddedDownloads)) {
  for (const file of readdirSync(embeddedDownloads)) {
    if (file.toLowerCase().endsWith(".apk")) {
      unlinkSync(join(embeddedDownloads, file));
    }
  }
}

run(join(root, "node_modules", "@capacitor", "cli", "bin", "capacitor"), ["sync", "android"]);
