// One-shot codemod: rewrite parent-relative imports ("../…") to "@/…" absolute
// aliases (mapped to src/). Sibling "./…" imports are left untouched.
// Usage: node scripts/codemod-aliases.mjs [--dry]
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, dirname, relative, posix } from "node:path";

const SRC = join(process.cwd(), "src");
const DRY = process.argv.includes("--dry");
const exts = new Set([".ts", ".tsx"]);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (exts.has(name.slice(name.lastIndexOf(".")))) out.push(full);
  }
  return out;
}

// Matches: from '…', import('…'), require('…') — single or double quotes.
const SPEC_RE = /(\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*)(['"])((?:\.\.\/)[^'"]*)\2/g;

let changedFiles = 0;
let changedSpecs = 0;

for (const file of walk(SRC)) {
  const src = readFileSync(file, "utf8");
  const fileDir = dirname(file);
  let touched = false;

  const next = src.replace(SPEC_RE, (_m, lead, quote, spec) => {
    const absolute = join(fileDir, spec);            // resolve relative to this file
    const fromSrc = relative(SRC, absolute);          // path under src/
    const aliased = "@/" + fromSrc.split(/[\\/]/).join(posix.sep);
    touched = true;
    changedSpecs++;
    return `${lead}${quote}${aliased}${quote}`;
  });

  if (touched && next !== src) {
    changedFiles++;
    if (!DRY) writeFileSync(file, next);
  }
}

console.log(`${DRY ? "[dry] " : ""}Rewrote ${changedSpecs} imports across ${changedFiles} files.`);
