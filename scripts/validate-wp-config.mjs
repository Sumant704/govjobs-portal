#!/usr/bin/env node
/**
 * ---------------------------------------------------------------------------
 * ACF / CPT drift detector
 * ---------------------------------------------------------------------------
 * The frontend reads ACF fields by name. WordPress stores them by name. Nothing
 * connects the two at compile time, so renaming a field in wp-admin silently
 * produces a page with an empty Important Dates table — no error, no warning,
 * just a post that looks broken to a reader and fine to an editor.
 *
 * This script reads the field names the normaliser actually touches
 * (`src/lib/wp.ts`) and checks every one of them exists in the importable ACF
 * field group JSON. Run it after any change to either side:
 *
 *   npm run wp:fields
 *
 * Exit code 0 = the two agree. Exit code 1 = something would silently break.
 */

import { readFileSync } from 'node:fs';

const ACF_FILE = 'wordpress/acf-field-groups.json';
const CPT_FILE = 'wordpress/cptui-post-types.json';
const WP_SOURCE = 'src/lib/wp.ts';
const POST_TYPES_SOURCE = 'src/lib/post-types.ts';

const red = (s) => `\u001b[31m${s}\u001b[0m`;
const green = (s) => `\u001b[32m${s}\u001b[0m`;
const yellow = (s) => `\u001b[33m${s}\u001b[0m`;

let problems = 0;

function fail(message, detail) {
  problems++;
  console.log(`  ${red('FAIL')}  ${message}`);
  if (detail) console.log(`        ${detail}`);
}

function pass(message) {
  console.log(`  ${green('PASS')}  ${message}`);
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    console.error(red(`Could not read ${path}: ${error.message}`));
    process.exit(1);
  }
}

console.log('\nChecking ACF field groups against the frontend normaliser\n');

/* --------------------------------------------------------------------------
   1. Collect field names declared in the ACF export
   -------------------------------------------------------------------------- */

const groups = readJson(ACF_FILE);
const acfFields = new Map(); // name -> { label, type, required, path }

function walk(fields, groupTitle, prefix = '') {
  for (const field of fields ?? []) {
    const path = prefix ? `${prefix} > ${field.label}` : field.label;
    acfFields.set(field.name, { label: field.label, type: field.type, required: field.required, path, groupTitle });
    if (field.sub_fields) walk(field.sub_fields, groupTitle, path);
  }
}

for (const group of groups) walk(group.fields, group.title);

console.log(`1. ACF export (${ACF_FILE})`);
console.log(`   ${groups.length} field groups, ${acfFields.size} fields including sub-fields`);
pass(`field groups: ${groups.map((g) => g.title).join(', ')}`);

/* --------------------------------------------------------------------------
   2. Collect the field names the normaliser reads
   -------------------------------------------------------------------------- */

const wpSource = readFileSync(WP_SOURCE, 'utf8');

// Top-level ACF fields are read as `fields.<name>` from the acf() helper.
const topLevel = new Set();
for (const match of wpSource.matchAll(/\bfields\.([a-z0-9_]+)/g)) topLevel.add(match[1]);
for (const match of wpSource.matchAll(/\ba\[['"]([a-z0-9_]+)['"]\]/g)) topLevel.add(match[1]);

// Repeater sub-fields are read as `row.<name>` inside the normalise* helpers.
const subFields = new Set();
for (const match of wpSource.matchAll(/\brow\.([a-z0-9_]+)/g)) subFields.add(match[1]);

console.log(`\n2. Frontend normaliser (${WP_SOURCE})`);
console.log(`   reads ${topLevel.size} top-level fields and ${subFields.size} repeater sub-fields`);
pass(`top-level: ${[...topLevel].sort().join(', ')}`);
pass(`sub-fields: ${[...subFields].sort().join(', ')}`);

/* --------------------------------------------------------------------------
   3. Every field the frontend reads must exist in the ACF export
   -------------------------------------------------------------------------- */

console.log('\n3. Every field read by the frontend exists in the ACF export');

// `a.x ?? a.y` fallbacks and a couple of internal aliases are expected to be
// absent from the canonical export — they exist to tolerate older field names.
const KNOWN_ALIASES = new Set([
  'vacancy_total', // legacy alias for total_vacancies
  'asOn', // camelCase variant of as_on
  'fee', // legacy alias handled inside the fee normaliser
  'value', // legacy alias for `date`
  'event', // legacy alias for `label`
  'title', // legacy alias
  'count', // legacy alias
  'name', // legacy alias
  'highlight', // legacy alias for emphasis
  'posts', // legacy alias for total_posts
  'post', // legacy alias for post_name
  'short_description',
  'day', // legacy alias for the date value
]);

for (const name of topLevel) {
  if (acfFields.has(name)) {
    const field = acfFields.get(name);
    if (field.type === 'repeater' || field.type === 'group') {
      // Fine — read as a whole structure by normaliseDates/Fees/Vacancy.
    }
  } else if (KNOWN_ALIASES.has(name)) {
    console.log(`  ${yellow('ALIAS')} ${name} — intentional fallback, not in the export`);
  } else {
    fail(`"${name}" is read by the frontend but is not defined in ${ACF_FILE}`, 'Add it to the field group, or remove the read from src/lib/wp.ts.');
  }
}

for (const name of subFields) {
  if (!acfFields.has(name) && !KNOWN_ALIASES.has(name)) {
    fail(`repeater sub-field "${name}" is read by the frontend but is not defined in ${ACF_FILE}`, 'Check the sub_fields of the relevant repeater.');
  }
}

if (problems === 0) pass('all read fields are declared');

/* --------------------------------------------------------------------------
   4. Every post type in the frontend registry has a CPT UI entry
   -------------------------------------------------------------------------- */

console.log('\n4. Post type registry matches the CPT UI export');

const cpts = readJson(CPT_FILE);
const cptByName = new Map(cpts.map((c) => [c.name, c]));

const registrySource = readFileSync(POST_TYPES_SOURCE, 'utf8');
const registryEntries = [...registrySource.matchAll(/key:\s*'([a-z-]+)',\s*\n\s*restBase:\s*'([a-z-]+)'/g)].map((m) => ({
  key: m[1],
  restBase: m[2],
}));

if (registryEntries.length === 0) {
  fail('could not parse the post type registry in src/lib/post-types.ts', 'The regex expects `key: ...` followed by `restBase: ...` on the next line.');
} else {
  for (const entry of registryEntries) {
    const cpt = cptByName.get(entry.restBase);
    if (!cpt) {
      fail(`frontend post type "${entry.restBase}" has no CPT UI entry`, `Add it to ${CPT_FILE} with rest_base "${entry.restBase}".`);
      continue;
    }
    if (cpt.show_in_rest !== 'true' && cpt.show_in_rest !== true) {
      fail(`"${entry.restBase}" has show_in_rest disabled`, 'The frontend cannot read it. Enable "Show in REST API" in CPT UI.');
    } else if (cpt.rest_base !== entry.restBase) {
      fail(`"${entry.restBase}" has rest_base "${cpt.rest_base}"`, 'These must match or every request 404s.');
    } else {
      pass(`${entry.restBase} → REST base "${cpt.rest_base}", REST enabled`);
    }
  }

  // The other direction: a CPT nobody reads is dead weight, worth flagging.
  for (const cpt of cpts) {
    if (!registryEntries.some((e) => e.restBase === cpt.rest_base)) {
      console.log(`  ${yellow('NOTE')} "${cpt.name}" exists in WordPress but has no frontend route`);
    }
  }
}

/* --------------------------------------------------------------------------
   5. Every ACF group must be exposed to REST
   -------------------------------------------------------------------------- */

console.log('\n5. ACF groups are exposed to the REST API');

for (const group of groups) {
  if (group.show_in_rest === 1 || group.show_in_rest === true) {
    pass(`${group.title} — show_in_rest enabled`);
  } else {
    fail(`${group.title} has show_in_rest disabled`, 'Turn on "Show in REST API" for the field group, or install ACF to REST API.');
  }
}

/* --------------------------------------------------------------------------
   Summary
   -------------------------------------------------------------------------- */

console.log(`\n${'─'.repeat(58)}`);
if (problems === 0) {
  console.log(green('  ACF and the frontend agree — no drift detected.'));
} else {
  console.log(red(`  ${problems} problem${problems === 1 ? '' : 's'} found.`));
}
console.log(`${'─'.repeat(58)}\n`);

process.exit(problems === 0 ? 0 : 1);
