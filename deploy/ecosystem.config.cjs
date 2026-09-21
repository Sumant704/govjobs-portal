// ---------------------------------------------------------------------------
// PM2 process definition — the no-Docker path
// ---------------------------------------------------------------------------
// For a small VPS where a container runtime is more overhead than it is worth.
//
//   pm2 start deploy/ecosystem.config.cjs
//   pm2 save && pm2 startup
//
// PM2 reads .env.production via `env_file`-style injection below. Node 22 also
// supports --env-file natively, which is what `npm start` uses — either works,
// pick one and stay consistent.
//
// On a 1–2 vCPU VPS, `instances: 'max'` with cluster mode is tempting but wrong
// here: each instance gets its own in-memory content cache and its own
// revalidation invalidation, so a webhook that clears one worker leaves the
// others serving stale pages. Two instances at most, and prefer a single
// instance behind the nginx cache — Node is not the bottleneck, the edge cache
// is what absorbs traffic.

module.exports = {
  apps: [
    {
      name: 'sarkarihub-frontend',
      script: './dist/server/entry.mjs',
      cwd: '/srv/sarkarihub/app',

      // Single instance on purpose. See the note above.
      instances: 1,
      exec_mode: 'fork',

      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1', // nginx on the host proxies to this
        PORT: 4321,
        // Everything else comes from .env.production, loaded by
        // `node --env-file-if-exists=.env.production` below.
      },

      // Load secrets from a file that is not in the repo.
      node_args: '--env-file-if-exists=.env.production',

      autorestart: true,
      max_restarts: 10,
      min_uptime: '20s',
      // A leak would show up as steadily growing RSS. Restart before the OOM
      // killer does, so the restart is graceful.
      max_memory_restart: '700M',

      // Give in-flight requests time to finish before SIGKILL.
      kill_timeout: 5000,
      wait_ready: false,

      error_file: '/var/log/sarkarihub/error.log',
      out_file: '/var/log/sarkarihub/out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      time: true,
    },
  ],
};
