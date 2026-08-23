import { readdir, rename } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const source = join(root, "public", "dokit_logo.svg");
const resources = join(root, "android", "app", "src", "main", "res");
const densities = {
  mdpi: 1,
  hdpi: 1.5,
  xhdpi: 2,
  xxhdpi: 3,
  xxxhdpi: 4,
};

async function renderLogo(size, padding = 0) {
  const inner = Math.round(size * (1 - padding * 2));
  const logo = await sharp(source).resize(inner, inner, { fit: "contain" }).png().toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).composite([{ input: logo, gravity: "center" }]).png().toBuffer();
}

for (const [density, scale] of Object.entries(densities)) {
  const directory = join(resources, `mipmap-${density}`);
  await sharp(await renderLogo(Math.round(48 * scale))).toFile(join(directory, "ic_launcher.png"));
  await sharp(await renderLogo(Math.round(48 * scale))).toFile(join(directory, "ic_launcher_round.png"));
  await sharp(await renderLogo(Math.round(108 * scale), 0.14)).toFile(join(directory, "ic_launcher_foreground.png"));
}

for (const entry of await readdir(resources, { withFileTypes: true })) {
  if (!entry.isDirectory() || !entry.name.startsWith("drawable")) continue;
  const splash = join(resources, entry.name, "splash.png");
  let metadata;
  try {
    metadata = await sharp(splash).metadata();
  } catch {
    continue;
  }
  if (!metadata.width || !metadata.height) continue;
  const logoSize = Math.round(Math.min(metadata.width, metadata.height) * 0.2);
  const logo = await renderLogo(logoSize);
  const temporary = `${splash}.tmp.png`;
  await sharp({
    create: {
      width: metadata.width,
      height: metadata.height,
      channels: 4,
      background: "#f4f9f7",
    },
  }).composite([{ input: logo, gravity: "center" }]).png().toFile(temporary);
  await rename(temporary, splash);
}
