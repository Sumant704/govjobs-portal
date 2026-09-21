// Dump Astro's built route table so route-resolution questions can be answered
// from data instead of guesswork.
import { readFileSync, readdirSync } from 'node:fs';

const dir = 'dist/server';
const manifestFile = readdirSync(dir).find((f) => f.startsWith('manifest_') && f.endsWith('.mjs'));
const source = readFileSync(`${dir}/${manifestFile}`, 'utf8');

const routes = [];
const re = /route:\s*"([^"]+)"[\s\S]{0,200}?pattern:\s*(\/\^[\s\S]*?\/[a-z]*)/g;
let m;
while ((m = re.exec(source))) routes.push({ route: m[1], pattern: m[2] });

console.log(`manifest: ${manifestFile}`);
console.log(`routes: ${routes.length}\n`);

for (const r of routes) {
  if (r.route.includes('api') || r.route.includes('[')) {
    console.log(`${r.route.padEnd(34)} ${r.pattern.slice(0, 70)}`);
  }
}

console.log('\n--- route entries that could match /api/health ---');
for (const r of routes) {
  const literal = r.pattern.replace(/^\/\^/, '').replace(/\/[a-z]*$/, '');
  if (/health/.test(literal) || /\[/.test(r.route)) {
    console.log(`  ${r.route.padEnd(32)} -> ${literal.slice(0, 60)}`);
  }
}
