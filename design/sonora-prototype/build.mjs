import { mkdir, copyFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.dirname(fileURLToPath(import.meta.url));
export const publicFiles = [
  "index.html",
  "404.html",
  "offline.html",
  "manifest.webmanifest",
  "client-data.js",
  "app.js",
  "cloud.js",
  "config.js",
  "search-remote.js",
  "home-trending.js",
  "pwa.js",
  "radio-core.js",
  "radio.js",
  "seasonal.js",
  "sw.js",
  "styles.css",
  "player-glass.css",
  "search.css",
  "features.css",
  "pwa.css",
  "home-trending.css",
  "radio.css",
  "seasonal.css",
  "vendor/supabase-2.117.2.js",
  "vendor/SUPABASE-LICENSE",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
];
for (const dir of ["icons", "vendor"])
  await mkdir(path.join(root, "dist", dir), { recursive: true });
for (const file of publicFiles)
  await copyFile(path.join(root, file), path.join(root, "dist", file));
// Keep a verifiable deployment manifest without including any server configuration.
await writeFile(
  path.join(root, "dist", "build-info.json"),
  JSON.stringify({ app: "Feka Music", files: publicFiles.length }),
);
console.log(
  `Feka Music: ${publicFiles.length} archivos públicos preparados en dist.`,
);
