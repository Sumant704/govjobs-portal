#!/usr/bin/env node
/**
 * ---------------------------------------------------------------------------
 * Self-host the web fonts
 * ---------------------------------------------------------------------------
 * Downloads the woff2 subsets this site uses and writes a local
 * `src/styles/fonts.css` with @font-face rules pointing at /fonts/*.
 *
 *   node scripts/fetch-fonts.mjs
 *
 * Why self-host instead of linking fonts.googleapis.com
 * ----------------------------------------------------
 * Measured with Lighthouse (mobile, simulated throttling), homepage:
 *
 *   Google Fonts linked    Performance 87   LCP 3.6s   TBT 210ms
 *   Web fonts blocked      Performance 98   LCP 2.0s   TBT   0ms
 *
 * Eleven Performance points and 1.6s of LCP spent on a third-party origin — and
 * not only latency. The hero <h1> is the LCP element: it paints in the fallback
 * face, then repaints when the web font arrives, and that repaint is recorded as
 * a *later* LCP candidate. The font CSS also costs main-thread time to parse.
 *
 * Variable vs static instances
 * ----------------------------
 * A variable font carries every weight in one file plus a `gvar` table of
 * deltas. That is a win when many weights are used and a loss when only two
 * are, because the delta table is paid for regardless. Measured here:
 *
 *   Inter, 5 weights   variable 47 KB   vs  ~60 KB as five static files  -> variable wins
 *   Devanagari, 2 weights  variable 118 KB  vs  96 KB as two static files -> static wins 19%
 *
 * So the choice is per family. Static instances also skip the `gvar` work at
 * render time, which matters on the low-end Android devices this site is mostly
 * read on.
 *
 * Requires `fonttools` + `brotli` for the static path. Without them the script
 * falls back to the variable font and says so — the site still works, it is just
 * ~22 KB heavier on Hindi pages.
 *
 *   python -m pip install fonttools brotli
 *
 * Only Latin and Devanagari subsets are downloaded. Google also serves
 * Cyrillic, Greek and Vietnamese for Inter; shipping those @font-face rules
 * would add CSS weight for glyphs a browser here never requests.
 */

import { writeFileSync, mkdirSync, statSync, existsSync, unlinkSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** Weights the UI actually renders. Anything outside these is never requested. */
const FAMILIES = [
  {
    family: 'Inter',
    query: 'Inter:wght@400..800',
    subsets: ['latin', 'latin-ext'],
    preload: 'latin',
    // Five weights in one 47 KB file. Static would be ~60 KB.
    mode: 'variable',
    // `swap`: the metric-matched 'Inter Fallback' face in global.css makes the
    // swap shift-free, and Inter text is on the LCP path on every page, so we
    // want it applied as soon as it arrives.
    display: 'swap',
  },
  {
    family: 'Noto Sans Devanagari',
    query: 'Noto+Sans+Devanagari:wght@400..700',
    subsets: ['devanagari', 'latin'],
    preload: null,
    // Hindi text uses regular and bold only. Two static files beat the variable
    // one by 19% (96 KB vs 118 KB) with an identical glyph set.
    mode: 'static',
    weights: [400, 700],
    // Only /hi pages need this face, so its preload is conditional.
    hindiOnly: true,
    // `optional`, not `swap`.
    //
    // A metric-matched fallback was tried here first and did not hold: it fixed
    // the /hi/admit-card listing (CLS 0.191 -> 0.001) but left the
    // /hi/admit-card/* post page shifting at 0.153. size-adjust is derived from
    // one measured string, and Devanagari line-breaking differs enough between
    // strings that some pages still reflow.
    //
    // `optional` removes the class of problem instead of shrinking it: the
    // browser uses the fallback for the whole page load and never swaps, so
    // there is no reflow to measure. The font is still downloaded and cached,
    // so it applies from the second page onward — and Hindi readers of a jobs
    // portal are repeat visitors. Nirmala UI (Windows) and Noto Sans Devanagari
    // (Android, where it is the system font anyway) are both perfectly legible.
    display: 'optional',
  },
];

const OUT_DIR = 'public/fonts';
const OUT_CSS = 'src/styles/fonts.css';
/**
 * Preload hints are generated too, not hand-written in BaseLayout.
 *
 * Renaming a font file (as happened when switching Devanagari to static
 * instances) silently breaks a hand-written <link rel="preload">: the browser
 * requests a file that no longer exists, the font arrives late, and the LCP
 * regression looks mysterious. Generating the list from the same data that
 * names the files makes that class of bug impossible.
 */
const OUT_PRELOADS = 'src/lib/font-preloads.ts';
const TMP_DIR = '.fonts-tmp';

/**
 * Sanity floor for a subset, expressed as a fraction of the original download.
 *
 * An absolute byte threshold does not work: the `latin` subset of a Devanagari
 * font is legitimately ~10 KB, while its `devanagari` subset is ~46 KB. A
 * relative check catches what actually goes wrong — an empty or mis-parsed
 * unicode-range, which produces a near-zero-byte file. During development a
 * mis-parsed range produced a 600-byte font that rendered nothing; this is the
 * check that would have caught it before it shipped.
 */
const MIN_SUBSET_RATIO = 0.15;

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(TMP_DIR, { recursive: true });

// --- Locate fontTools, if present ------------------------------------------

function findPython() {
  const candidates = [
    process.env.FONTTOOLS_PYTHON,
    // The isolated environment used during development.
    'C:/Users/Malls/.workbuddy-ai/binaries/python/envs/default/Scripts/python.exe',
    'python3',
    'python',
  ].filter(Boolean);

  for (const bin of candidates) {
    try {
      execFileSync(bin, ['-c', 'import fontTools, brotli'], { stdio: 'ignore' });
      return bin;
    } catch {
      /* try the next candidate */
    }
  }
  return null;
}

const python = findPython();
const canSubset = Boolean(python);

if (!canSubset) {
  console.warn(
    '\n  fontTools not found — falling back to variable fonts.\n' +
      '  Hindi pages will be ~22 KB heavier. To enable static instances:\n' +
      '      python -m pip install fonttools brotli\n',
  );
}

// --- Download ---------------------------------------------------------------

const entries = [];

for (const spec of FAMILIES) {
  const url = `https://fonts.googleapis.com/css2?family=${spec.query}&display=swap`;
  const css = execFileSync('curl', ['-s', '-A', UA, url], { encoding: 'utf8' });

  if (!css.includes('@font-face')) {
    throw new Error(`No @font-face blocks returned for ${spec.family}. Got: ${css.slice(0, 200)}`);
  }

  const blockRe = /\/\*\s*([a-z-]+)\s*\*\/\s*@font-face\s*\{([^}]+)\}/g;
  let match;
  let found = 0;

  while ((match = blockRe.exec(css))) {
    const subset = match[1];
    const body = match[2];
    if (!spec.subsets.includes(subset)) continue;

    const remote = /url\((https:[^)]+\.woff2)\)/.exec(body)?.[1];
    // The declared range is used verbatim for subsetting, so the glyph set is
    // identical to what Google would have served. Guessing the range is how you
    // ship a 600-byte font that renders nothing.
    const range = /unicode-range:\s*([^;]+);/.exec(body)?.[1]?.trim();
    const weight = /font-weight:\s*([^;]+);/.exec(body)?.[1]?.trim() ?? '400';
    const style = /font-style:\s*([^;]+);/.exec(body)?.[1]?.trim() ?? 'normal';
    if (!remote || !range) continue;

    const base = `${spec.family.toLowerCase().replace(/\s+/g, '-')}-${subset}`;
    const rawFile = `${TMP_DIR}/${base}.woff2`;
    execFileSync('curl', ['-s', '-o', rawFile, remote]);

    const rawBytes = statSync(rawFile).size;
    if (rawBytes < 1024) throw new Error(`${base}: download looks truncated (${rawBytes} bytes)`);

    if (spec.mode === 'static' && canSubset) {
      for (const w of spec.weights) {
        const instanced = `${TMP_DIR}/${base}-w${w}.woff2`;
        const outFile = `${base}-w${w}.woff2`;

        // 1. Pin the variable axis at this weight.
        execFileSync(python, [
          '-m', 'fontTools.varLib.instancer', rawFile, `wght=${w}`, `--output=${instanced}`,
        ], { stdio: 'ignore' });

        // 2. Subset to exactly Google's declared range. `--layout-features='*'`
        //    is essential: Devanagari needs its shaping features (akhn, rphf,
        //    half, blwf, cjct, …) or conjuncts and matras render broken.
        execFileSync(python, [
          '-m', 'fontTools.subset', instanced,
          `--unicodes=${range}`,
          "--layout-features=*",
          '--flavor=woff2',
          `--output-file=${OUT_DIR}/${outFile}`,
        ], { stdio: 'ignore' });

        const bytes = statSync(`${OUT_DIR}/${outFile}`).size;
        const ratio = bytes / rawBytes;
        if (ratio < MIN_SUBSET_RATIO) {
          throw new Error(
            `${outFile} is ${(bytes / 1024).toFixed(1)} KB, only ${(ratio * 100).toFixed(1)}% of the ` +
              `${(rawBytes / 1024).toFixed(1)} KB source. The subset is almost certainly empty — ` +
              `check that the unicode-range was parsed from the Google CSS.`,
          );
        }

        entries.push({
          family: spec.family, subset, file: outFile, range,
          weight: String(w), style, display: spec.display ?? 'swap', bytes,
        });
      }
    } else {
      const outFile = `${base}.woff2`;
      execFileSync('cp', [rawFile, `${OUT_DIR}/${outFile}`]);
      const bytes = statSync(`${OUT_DIR}/${outFile}`).size;
      entries.push({
        family: spec.family, subset, file: outFile, range, weight, style,
        display: spec.display ?? 'swap', bytes,
      });
    }

    found++;
  }

  if (found === 0) throw new Error(`None of the wanted subsets found for ${spec.family}`);
}

// --- Write the stylesheet ---------------------------------------------------

const header = `/*
 * GENERATED by scripts/fetch-fonts.mjs — do not edit by hand.
 *
 * Self-hosted web fonts. Regenerate with:
 *     npm run fonts
 *
 * Regenerating changes font binaries, which changes metrics, which can change
 * layout. Re-run \`npm run audit\` afterwards.
 */

`;

const rules = entries
  .map(
    (e) => `/* ${e.family} — ${e.subset}${e.weight.match(/\s/) ? '' : ` @ ${e.weight}`} */
@font-face {
  font-family: '${e.family}';
  font-style: ${e.style};
  font-weight: ${e.weight};
  font-display: ${e.display};
  src: url('/fonts/${e.file}') format('woff2');
  unicode-range: ${e.range};
}`,
  )
  .join('\n\n');

writeFileSync(OUT_CSS, header + rules + '\n');

// --- Clean up the scratch directory ----------------------------------------

for (const e of entries) {
  const raw = `${TMP_DIR}/${e.family.toLowerCase().replace(/\s+/g, '-')}-${e.subset}.woff2`;
  if (existsSync(raw)) unlinkSync(raw);
  for (const w of FAMILIES.find((f) => f.family === e.family)?.weights ?? []) {
    const inst = `${TMP_DIR}/${e.family.toLowerCase().replace(/\s+/g, '-')}-${e.subset}-w${w}.woff2`;
    if (existsSync(inst)) unlinkSync(inst);
  }
}

// --- Remove orphans ---------------------------------------------------------
//
// Switching Devanagari from a variable font to static instances renamed four
// files and left two behind. They would ship in public/ forever: referenced by
// nothing, counted in every build, and confusing to whoever finds them later.
// Anything in public/fonts that this run did not produce is an orphan.

const written = new Set(entries.map((e) => e.file));
const orphans = readdirSync(OUT_DIR).filter((f) => f.endsWith('.woff2') && !written.has(f));

if (orphans.length) {
  console.log('\n  Removing orphaned fonts no longer referenced by fonts.css:');
  for (const f of orphans) {
    unlinkSync(`${OUT_DIR}/${f}`);
    console.log(`    ${f}`);
  }
}

// --- Report -----------------------------------------------------------------

console.log(`\nWrote ${OUT_CSS} with ${entries.length} @font-face rules.\n`);

const byFamily = new Map();
for (const e of entries) {
  byFamily.set(e.family, (byFamily.get(e.family) ?? 0) + e.bytes);
}
let total = 0;
for (const e of entries) {
  total += e.bytes;
  console.log(`  ${e.file.padEnd(42)} ${(e.bytes / 1024).toFixed(1).padStart(7)} KB`);
}
console.log(`  ${'— total on disk'.padEnd(42)} ${(total / 1024).toFixed(1).padStart(7)} KB`);

console.log('\n  Per page (browser fetches only what the page\'s glyphs need):');
console.log(`    English page : Inter latin only`);
for (const [family, bytes] of byFamily) {
  if (family === 'Inter') console.log(`                   ≈ ${(bytes / 1024).toFixed(0)} KB across its subsets`);
}
console.log(`    Hindi page   : adds the full Devanagari set`);

/**
 * Preload list, split by whether every page needs it or only Hindi pages.
 *
 * Only the base weight is preloaded — preloading both weights of a family
 * competes with the stylesheet for bandwidth on the critical path, and the bold
 * face is almost never the LCP element.
 */
const alwaysPreload = FAMILIES.filter((f) => f.preload && !f.hindiOnly).flatMap((f) => {
  const e = entries.find((x) => x.family === f.family && x.subset === f.preload);
  return e ? [`/fonts/${e.file}`] : [];
});

// For a static family, entries are ordered by the `weights` array, so the first
// match is the base weight.
const hindiPreload = FAMILIES.filter((f) => f.hindiOnly).flatMap((f) => {
  const e = entries.find((x) => x.family === f.family && x.subset === f.subsets[0]);
  return e ? [`/fonts/${e.file}`] : [];
});

const ts = `/**
 * GENERATED by scripts/fetch-fonts.mjs — do not edit by hand.
 *
 * Font preload hints, kept in sync with the files the script actually wrote.
 * A hand-written preload path breaks silently when a font is renamed.
 *
 *   always — every page, because it is on the LCP path
 *   hindi  — only /hi pages; the Devanagari face is ~46 KB and useless in English
 */

export const FONT_PRELOADS = {
  always: ${JSON.stringify(alwaysPreload, null, 2).replace(/\n/g, '\n  ')},
  hindi: ${JSON.stringify(hindiPreload, null, 2).replace(/\n/g, '\n  ')},
} as const;
`;

writeFileSync(OUT_PRELOADS, ts);
console.log(`\n  Wrote ${OUT_PRELOADS}`);

if (alwaysPreload.length || hindiPreload.length) {
  console.log('\n  Preloaded in <head> (on the LCP path):');
  for (const p of alwaysPreload) console.log(`    every page  ${p}`);
  for (const p of hindiPreload) console.log(`    /hi only    ${p}`);
}
console.log();
