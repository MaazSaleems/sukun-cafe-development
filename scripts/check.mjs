import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = resolve(import.meta.dirname, "..");
const sourceDir = resolve(projectRoot, "src");
const requiredFiles = ["index.html", "styles.css", "app.js"];

for (const file of requiredFiles) {
  await access(resolve(sourceDir, file));
}

const syntaxCheck = spawnSync(process.execPath, ["--check", resolve(sourceDir, "app.js")], {
  stdio: "inherit"
});

if (syntaxCheck.status !== 0) process.exit(syntaxCheck.status ?? 1);

const sources = await Promise.all(
  requiredFiles.map((file) => readFile(resolve(sourceDir, file), "utf8"))
);
const assetReferences = new Set(
  sources.flatMap((source) => [...source.matchAll(/assets\/[A-Za-z0-9._-]+/g)].map((match) => match[0]))
);

for (const asset of assetReferences) {
  await access(resolve(sourceDir, asset));
}

console.log(`Checks passed: ${requiredFiles.length} source files and ${assetReferences.size} referenced assets.`);
