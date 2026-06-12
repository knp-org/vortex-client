// One-shot: within a feature, rewrite absolute '@/features/<self>/…' imports to
// relative paths. Cross-feature imports (to a *different* feature) are left as
// '@/features/<other>' barrel imports. See ARCHITECTURE.md.
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";

const FEAT = join(process.cwd(), "src", "features");
const exts = new Set([".ts", ".tsx"]);

function walk(dir) {
  const out = [];
  for (const n of readdirSync(dir)) {
    const full = join(dir, n);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (exts.has(n.slice(n.lastIndexOf(".")))) out.push(full);
  }
  return out;
}

let changed = 0;
for (const file of walk(FEAT)) {
  const self = relative(FEAT, file).split(/[\\/]/)[0]; // owning feature name
  const re = new RegExp(`(from\\s*|import\\(\\s*)(['"])@/features/${self}/([^'"]*)\\2`, "g");
  const src = readFileSync(file, "utf8");
  const next = src.replace(re, (_m, lead, q, rest) => {
    const target = join(FEAT, self, rest);
    let rel = relative(dirname(file), target).split(/[\\/]/).join("/");
    if (!rel.startsWith(".")) rel = "./" + rel;
    changed++;
    return `${lead}${q}${rel}${q}`;
  });
  if (next !== src) writeFileSync(file, next);
}
console.log(`Rewrote ${changed} intra-feature imports to relative.`);
