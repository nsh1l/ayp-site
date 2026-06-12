import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");

if (existsSync(dist)) rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

for (const name of readdirSync(root)) {
  const full = join(root, name);
  if (name === ".git" || name === "dist" || name === "scripts" || name === ".github") continue;
  if (statSync(full).isFile() && name.endsWith(".html")) {
    cpSync(full, join(dist, name));
  }
}

const assetsSrc = join(root, "assets");
if (existsSync(assetsSrc)) {
  cpSync(assetsSrc, join(dist, "assets"), { recursive: true });
}

console.log("Built static site to dist/");
