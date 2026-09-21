/**
 * Environment access.
 *
 * ---------------------------------------------------------------------------
 * The trap this module exists to avoid
 * ---------------------------------------------------------------------------
 * Vite replaces `import.meta.env.X` with a literal **at build time**, and the
 * object it inlines into a production SSR bundle contains only the Vite
 * built-ins plus `PUBLIC_`-prefixed variables. Two consequences, both of which
 * bit this project during development:
 *
 *   1. `import.meta.env.WP_API_URL || process.env.WP_API_URL` never falls
 *      through. `""` is falsy but it is not `undefined`, so the expression
 *      short-circuits on the inlined empty string and the runtime variable is
 *      never read. Reading `process.env` first is what makes a container
 *      deployment configurable at all.
 *
 *   2. `readEnv` used to fall back to `import.meta.env[key]`. In the production
 *      bundle Rollup inlined that call in one module and folded it to the real
 *      `.env` value — writing the revalidation secret into `dist/` as
 *      plaintext. A secret that ships in the build artifact is not a secret.
 *
 * Hence two functions with deliberately different rules:
 *
 *   readEnv(key)    — runtime env, then build-time env. For non-secret config
 *                     (URLs, TTLs, public keys). Convenient in `astro dev`,
 *                     where `.env` is the only source.
 *
 *   readSecret(key) — runtime env ONLY. Never touches `import.meta.env`, so it
 *                     can never be inlined into a build artifact. Use for
 *                     anything an attacker could use.
 *
 * Production runs therefore need their environment supplied at runtime. The
 * `start` script does this via Node's own `--env-file-if-exists=.env`; Docker
 * and PM2 pass real environment variables.
 */

/** Non-secret configuration. Runtime environment wins over build-time. */
export function readEnv(key: string): string {
  const runtime = runtimeEnv(key);
  if (runtime) return runtime;

  // Dynamic access on purpose — see the note above. This resolves in dev, and
  // in production for `PUBLIC_`-prefixed keys only.
  const buildTime = (import.meta.env as Record<string, unknown> | undefined)?.[key];
  return typeof buildTime === 'string' ? buildTime : '';
}

/**
 * Secrets. Runtime environment only — never read from the build-time env, so
 * the value can never end up baked into `dist/`.
 */
export function readSecret(key: string): string {
  return runtimeEnv(key);
}

function runtimeEnv(key: string): string {
  if (typeof process === 'undefined' || !process.env) return '';
  const value = process.env[key];
  return typeof value === 'string' ? value : '';
}

export function readBool(key: string, fallback: boolean): boolean {
  const value = readEnv(key).toLowerCase();
  if (value === '') return fallback;
  return value === 'true' || value === '1' || value === 'yes';
}

export function readInt(key: string, fallback: number): number {
  const value = Number(readEnv(key));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

/**
 * Build-time values that genuinely must be inlined, because they are read by
 * the browser: the AdSense client id and the GA measurement id.
 *
 * These use literal member access so Vite can statically replace them. They are
 * public by definition — they appear in the HTML of every page.
 */
export const PUBLIC_ENV = {
  adsenseClient: import.meta.env.PUBLIC_ADSENSE_CLIENT as string | undefined,
  adsenseEnabled: import.meta.env.PUBLIC_ADSENSE_ENABLED as string | undefined,
  gaMeasurementId: import.meta.env.PUBLIC_GA_MEASUREMENT_ID as string | undefined,
};

export function adsenseIsOn(): boolean {
  return PUBLIC_ENV.adsenseEnabled !== 'false' && Boolean(PUBLIC_ENV.adsenseClient);
}
