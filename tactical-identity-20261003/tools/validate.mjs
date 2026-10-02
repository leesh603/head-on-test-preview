#!/usr/bin/env node
// Deploy-gate validation for the test preview: every root .js must parse as an
// ES module and every relative import/script-src in .js and .html must resolve
// to a file on disk (cache-bust ?v= tags ignored).
import { readFileSync, readdirSync, mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join, resolve, dirname, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fail = [];

// 1. syntax-check every ES module at the root (node --check needs .mjs)
const tmp = mkdtempSync(join(tmpdir(), 'hoa-check-'));
const jsFiles = readdirSync(root).filter(f => f.endsWith('.js'));
try {
  for (const file of jsFiles) {
    const copy = join(tmp, basename(file, '.js') + '.mjs');
    writeFileSync(copy, readFileSync(join(root, file)));
    const r = spawnSync(process.execPath, ['--check', copy], { encoding: 'utf8' });
    if (r.status !== 0) fail.push(`${file}: ${r.stderr.trim().split('\n')[0]}`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
console.log(`  syntax: ${jsFiles.length} modules checked`);

// 2. every relative import/script-src resolves on disk — refs without a file
// extension are dynamic prefixes (e.g. './terrain-'+name), refs escaping the
// repo root are DEV-only hooks (tests/ is not deployed).
const specifiers = [];
const collect = (file, text) => {
  for (const m of text.matchAll(/(?:from|import)\s*[^'"]*['"](\.[^'"]+)['"]/g))
    specifiers.push({ file, ref: m[1] });
  for (const m of text.matchAll(/src\s*=\s*['"](\.[^'"]+)['"]/g))
    specifiers.push({ file, ref: m[1] });
};
for (const file of jsFiles) collect(file, readFileSync(join(root, file), 'utf8'));
const htmlFiles = readdirSync(root).filter(f => f.endsWith('.html'));
for (const file of htmlFiles) collect(file, readFileSync(join(root, file), 'utf8'));

let resolved = 0;
let skipped = 0;
for (const { file, ref } of specifiers) {
  const clean = ref.replace(/\?.*$/, '');
  if (clean.startsWith('..') || !basename(clean).includes('.')) { skipped++; continue; }
  if (existsSync(join(root, clean))) { resolved++; continue; }
  fail.push(`${file}: missing import/script target ${ref}`);
}
console.log(`  imports: ${resolved} resolved, ${skipped} skipped (dynamic/dev), ${fail.length} missing`);

if (fail.length) {
  console.error(`validate: ${fail.length} problem(s)`);
  for (const f of fail) console.error(`  FAIL ${f}`);
  process.exit(1);
}
console.log('validate: all checks passed');
