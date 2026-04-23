#!/usr/bin/env node
/**
 * Extracts the client-side JavaScript from ui.ts (where it lives inside a
 * TypeScript template literal) and writes it to public/app.js as a clean,
 * properly-unescaped JavaScript file.
 *
 * Unescaping rules for content that was inside a TS template literal:
 *   \`   →  `   (escaped backtick  → real backtick)
 *   \${  →  ${  (escaped interp    → real template interpolation)
 *   \\   →  \   (escaped backslash → single backslash, fixes \\n→\n, \\[→\[ etc.)
 *
 * We process in three passes so the replacements don't interfere:
 *   Pass 1: protect \\` and \\\${ (double-escaped sequences) with placeholders
 *   Pass 2: unescape \` → ` and \${ → ${
 *   Pass 3: unescape \\ → \
 *   Pass 4: restore placeholders
 */

const fs   = require('fs');
const path = require('path');

const SRC  = path.join(__dirname, '..', 'src', 'ui.ts');
const OUT  = path.join(__dirname, '..', 'public', 'app.js');

// ── Read source ────────────────────────────────────────────────────────────────

const src = fs.readFileSync(SRC, 'utf8');

// ── Extract the <script>…</script> block ──────────────────────────────────────

const OPEN  = '\n<script>\n';
const CLOSE = '\n</script>';

const start = src.indexOf(OPEN);
const end   = src.lastIndexOf(CLOSE);

if (start === -1 || end === -1) {
  console.error('Could not locate <script> block in ui.ts');
  process.exit(1);
}

let js = src.slice(start + OPEN.length, end);

// ── Unescape ──────────────────────────────────────────────────────────────────

const P1 = '\x00DBLSLASH_BACKTICK\x00';   // for \\`
const P2 = '\x00DBLSLASH_DOLLAR\x00';     // for \\\${
const P3 = '\x00DBLSLASH\x00';            // for \\\\

// Pass 1 – protect double-escaped sequences so later passes don't touch them
js = js
  .replace(/\\\\\`/g,  P1)   // \\` → placeholder  (literal backslash-backtick in output)
  .replace(/\\\\\\\$/g, P2)  // \\\$ → placeholder  (literal backslash-dollar in output)
  .replace(/\\\\\\\\/g, P3); // \\\\ → placeholder  (literal double-backslash in output)

// Pass 2 – unescape the single-level escapes
js = js
  .replace(/\\\`/g,   '`')   // \` → `
  .replace(/\\\$\{/g, '${'); // \${ → ${

// Pass 3 – remaining \\ → \  (covers \\n → \n, \\[ → \[, \\d → \d, etc.)
js = js.replace(/\\\\/g, '\\');

// Pass 4 – restore placeholders
js = js
  .replace(new RegExp(P1, 'g'), '\\`')   // literal \` in output JS
  .replace(new RegExp(P2, 'g'), '\\$')   // literal \$ in output JS
  .replace(new RegExp(P3, 'g'), '\\\\'); // literal \\ in output JS

// ── Fix parseBailiiUrl – use RegExp() instead of regex literals ───────────────
// Regex literals inside the template literal had their backslashes stripped.
// In the real app.js we can use regex literals directly since it's not
// inside a template literal any more – but the extracted version may still
// have the new RegExp('\\\\[...') form we patched in.  Either form is fine;
// the important thing is the file now parses correctly.

// ── Write output ──────────────────────────────────────────────────────────────

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, js, 'utf8');

const lines = js.split('\n').length;
console.log(`Wrote ${lines} lines → ${OUT}`);

// ── Quick syntax check via Node ───────────────────────────────────────────────

const { execSync } = require('child_process');
try {
  execSync(`node --check "${OUT}"`, { stdio: 'inherit' });
  console.log('Syntax OK ✓');
} catch {
  console.error('Syntax check FAILED – see errors above');
  process.exit(1);
}
