#!/usr/bin/env node
/**
 * ---------------------------------------------------------------------------
 * Validate the deploy configuration against the real build output
 * ---------------------------------------------------------------------------
 *   npm run deploy:check
 *
 * Nothing here needs Docker or nginx. It is static analysis of the deployment
 * files against what the build actually produces, and it exists because the
 * two bugs it was written to catch were both invisible without it:
 *
 *   1. `deploy/nginx.conf` aliased `/srv/sarkarihub/client/_astro/`, but
 *      `deploy/ecosystem.config.cjs` runs the app from `/srv/sarkarihub/app`,
 *      so the real path is `/srv/sarkarihub/app/dist/client/_astro/`. Every
 *      hashed asset would have 404'd, and nginx would have quietly fallen
 *      through to the Node proxy — slower, and with no error to explain it.
 *
 *   2. There was no `.dockerignore`, while the Dockerfile runs `COPY . .`.
 *      That sends `.env` — REVALIDATE_SECRET and the WordPress application
 *      password — into the build stage, and copies `node_modules` over the
 *      layer the Dockerfile had just installed.
 *
 * Neither would fail a build. Both would fail in production.
 */

import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, posix } from 'node:path';

const ROOT = process.cwd();

let pass = 0;
let fail = 0;

const ok = (m) => {
  pass++;
  console.log(`  \u001b[32mPASS\u001b[0m  ${m}`);
};
const bad = (m, detail) => {
  fail++;
  console.log(`  \u001b[31mFAIL\u001b[0m  ${m}`);
  if (detail) console.log(`        ${detail}`);
};
const note = (m) => console.log(`  \u001b[33mNOTE\u001b[0m  ${m}`);

const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const exists = (p) => existsSync(join(ROOT, p));

/** Expands the simple glob-ish patterns used in the Dockerfile COPY lines. */
function copySourceExists(source) {
  if (!source.includes('*')) return exists(source);

  const dir = posix.dirname(source);
  if (!exists(dir)) return false;
  const base = posix.basename(source).replace(/[.*?[\]]/g, '');
  return readdirSync(join(ROOT, dir)).some((f) => f.includes(base.replace(/^\./, '')));
}

console.log('\nValidating the deploy configuration\n');

/* -------------------------------------------------------------------------
   1. .dockerignore
   ------------------------------------------------------------------------- */

console.log('1. Docker build context (.dockerignore)');

if (!exists('.dockerignore')) {
  bad(
    '.dockerignore is missing while the Dockerfile uses `COPY . .`',
    'The whole working directory — including .env — is sent to the build daemon.',
  );
} else {
  const ignore = read('.dockerignore');
  const rules = ignore
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));

  for (const [pattern, why] of [
    ['.env', 'secrets would be baked into a build layer'],
    ['node_modules', 'context bloat, and it shadows the npm ci layer'],
    ['dist', 'stale build output would be copied over the fresh one'],
    ['.git', 'repository history has no place in an image'],
  ]) {
    if (rules.includes(pattern)) ok(`.dockerignore excludes ${pattern}`);
    else bad(`.dockerignore does not exclude ${pattern}`, why);
  }

  // Negations matter: `!.env.example` must survive `.env.*`
  if (rules.some((r) => r.startsWith('!'))) {
    ok(`.dockerignore has explicit negations (${rules.filter((r) => r.startsWith('!')).join(', ')})`);
  }
}

/* -------------------------------------------------------------------------
   2. Dockerfile COPY sources
   ------------------------------------------------------------------------- */

console.log('\n2. Dockerfile COPY sources exist');

const dockerfile = read('deploy/Dockerfile');
const copies = [...dockerfile.matchAll(/^COPY\s+(?!--from)(.+)$/gm)].flatMap((m) =>
  m[1]
    .trim()
    .split(/\s+/)
    .slice(0, -1)
    .filter((t) => t !== '--chown' && !t.includes('=')),
);

for (const src of copies) {
  if (copySourceExists(src)) ok(`COPY source exists: ${src}`);
  else bad(`COPY source does not exist: ${src}`, 'The build would fail at that layer.');
}

// The runtime stage must not copy secrets.
if (/COPY[^\n]*\.env(?!\.example)/.test(dockerfile)) {
  bad('Dockerfile copies a .env file into the image', 'Secrets must arrive at runtime, not build time.');
} else {
  ok('Dockerfile copies no .env file');
}

if (/npm run check/.test(dockerfile)) ok('Dockerfile runs the type check before building');
else note('Dockerfile does not run `npm run check` — a missing import would ship silently');

/* -------------------------------------------------------------------------
   3. nginx static asset paths vs the real layout
   ------------------------------------------------------------------------- */

console.log('\n3. nginx asset paths match the deploy layout');

const nginx = read('deploy/nginx.conf');
const pm2 = read('deploy/ecosystem.config.cjs');

// The PM2 cwd tells us where the app — and therefore dist/ — actually lives.
const cwdMatch = pm2.match(/cwd:\s*'([^']+)'/);
const appRoot = cwdMatch ? cwdMatch[1] : null;

if (!appRoot) {
  bad('could not read `cwd` from deploy/ecosystem.config.cjs');
} else {
  ok(`app root (from PM2 cwd): ${appRoot}`);

  const nginxPaths = [
    ...nginx.matchAll(/^\s*(?:alias|root)\s+(\/\S+);/gm),
  ]
    .map((m) => m[1])
    .filter((p) => p.startsWith(appRoot));

  if (nginxPaths.length === 0) {
    bad(
      'no nginx alias/root path is under the app root',
      `Expected something like ${appRoot}/dist/client/. Static assets would 404.`,
    );
  }

  for (const p of nginxPaths) {
    // Strip the app root, leaving a path relative to the repository, since the
    // repository IS the app directory once deployed.
    const relative = p.slice(appRoot.length).replace(/^\//, '').replace(/\/$/, '');
    if (exists(relative)) ok(`nginx path resolves to real output: ${p}`);
    else
      bad(
        `nginx path points at nothing: ${p}`,
        `Expected "${relative}" relative to the app root. Check against the real build output.`,
      );
  }
}

/* -------------------------------------------------------------------------
   4. nginx caches the directories the build actually emits
   ------------------------------------------------------------------------- */

console.log('\n4. nginx caches the real hashed-asset directory');

const assetDirs = exists('dist/client')
  ? readdirSync(join(ROOT, 'dist/client'), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
  : [];

if (!exists('dist')) {
  note('dist/ not present — run `npm run build` first for the full check');
} else {
  const hashed = assetDirs.filter((d) => d.startsWith('_'));
  for (const dir of hashed) {
    if (nginx.includes(`/${dir}/`)) ok(`nginx caches the hashed asset dir /${dir}/`);
    else note(`build emits /${dir}/ but nginx has no rule for it`);
  }
  if (nginx.includes('immutable')) ok('nginx marks hashed assets immutable');
  else bad('nginx does not mark hashed assets immutable', 'They can be cached for a year.');
}

/* -------------------------------------------------------------------------
   5. PM2 script path resolves from its cwd
   ------------------------------------------------------------------------- */

console.log('\n5. PM2 config is self-consistent');

const scriptMatch = pm2.match(/script:\s*'([^']+)'/);
if (!scriptMatch) {
  bad('could not read `script` from deploy/ecosystem.config.cjs');
} else {
  const script = scriptMatch[1].replace(/^\.\//, '');
  if (exists(script)) ok(`PM2 script exists relative to the app root: ${script}`);
  else bad(`PM2 script not found: ${script}`, 'Run `npm run build` before deploying.');
}

if (/--env-file-if-exists/.test(pm2)) ok('PM2 loads runtime config from an env file');
else note('PM2 does not load an env file — secrets must come from the process environment');

/* -------------------------------------------------------------------------
   6. docker-compose references real paths
   ------------------------------------------------------------------------- */

console.log('\n6. docker-compose references real paths');

const compose = read('deploy/docker-compose.yml');

// Compose resolves `context` relative to the compose file's own directory, and
// `dockerfile` relative to the *context* — not relative to the compose file.
// Getting that wrong made this script report a false failure on a correct
// config, which is its own lesson: a validator that is wrong is worse than no
// validator, because it teaches people to ignore the output.
const composeDir = 'deploy';
const contextRel = compose.match(/context:\s*(\S+)/)?.[1];
const dockerfileRel = compose.match(/dockerfile:\s*(\S+)/)?.[1];

if (!contextRel) {
  bad('docker-compose has no build context');
} else {
  const contextAbs = posix.normalize(posix.join(composeDir, contextRel));
  if (exists(contextAbs)) ok(`compose build context resolves: ${contextAbs}`);
  else bad(`compose build context points at nothing: ${contextAbs}`);

  if (!dockerfileRel) {
    bad('docker-compose has no dockerfile');
  } else {
    const dockerfileAbs = posix.normalize(posix.join(contextAbs, dockerfileRel));
    if (exists(dockerfileAbs)) ok(`compose dockerfile resolves (relative to context): ${dockerfileAbs}`);
    else bad(`compose dockerfile points at nothing: ${dockerfileAbs}`);
  }
}

if (/env_file:/.test(compose)) ok('compose injects secrets via env_file at runtime');
else note('compose does not use env_file — check how runtime config reaches the container');

if (/127\.0\.0\.1:\d+:4321/.test(compose)) {
  ok('compose publishes on loopback only (nginx on the host is the only entry point)');
} else if (/ports:/.test(compose)) {
  bad('compose publishes a port on all interfaces', 'The Node server would bypass TLS and the edge cache.');
}

/* -------------------------------------------------------------------------
   Summary
   ------------------------------------------------------------------------- */

console.log(`\n${'─'.repeat(58)}`);
if (fail === 0) console.log(`  \u001b[32m${pass} checks passed — deploy config is consistent with the build.\u001b[0m`);
else console.log(`  \u001b[31m${pass} passed, ${fail} failed.\u001b[0m`);
console.log(`${'─'.repeat(58)}\n`);

process.exit(fail === 0 ? 0 : 1);
