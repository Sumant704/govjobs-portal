# Deployment — VPS runbook

The brief says self-hosted WordPress to start, then a VPS later. This covers the
frontend half of that move. WordPress moves separately (DNS plus a restored
backup); nothing in the frontend cares where it is hosted, only that `WP_API_URL`
points at it.

Three ways to run it, in order of how much machinery you want:

| Approach | Use when |
|---|---|
| **PM2 + nginx** | A single small VPS. Least moving parts. |
| **Docker Compose + nginx** | You already use Docker, or want reproducible builds. |
| **Vercel / Netlify** | You would rather not run a server at all. Change one line in `astro.config.mjs`. |

---

## 0. Server sizing

The frontend is deliberately cheap because nginx absorbs almost all traffic.

| | Minimum | Comfortable |
|---|---|---|
| vCPU | 1 | 2 |
| RAM | 1 GB | 2 GB |
| Disk | 20 GB | 40 GB |
| Node | 22 LTS | 22 LTS |

A 1 vCPU / 1 GB box handles this fine **because the edge cache does the work**.
If you find yourself wanting more CPU, the cache is misconfigured — check
`X-Cache-Status` before upgrading.

WordPress needs a separate, larger box. Do not co-host them: a traffic spike on
the portal should never be able to take down the CMS, and vice versa.

---

## 0b. Validate the configuration first

```bash
npm run build          # the check compares against real build output
npm run deploy:check
```

This is static analysis — no Docker or nginx required — and it verifies:

- every Dockerfile `COPY` source exists
- `.dockerignore` excludes `.env`, `node_modules`, `dist` and `.git`
- every nginx `alias`/`root` path resolves to output the build actually produces
- the PM2 `script` resolves from its `cwd`
- docker-compose's context and dockerfile paths resolve

It exists because it caught two real bugs here: nginx aliased
`/srv/sarkarihub/client/` while the app runs from `/srv/sarkarihub/app`, and
there was no `.dockerignore` at all while the Dockerfile runs `COPY . .` — which
would have sent `.env` into the build context.

---

## 1. PM2 + nginx (recommended for a small VPS)

```bash
# --- as root, once ---
apt update && apt upgrade -y
apt install -y nginx git curl ufw
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
npm install -g pm2

# --- firewall ---
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable

# --- application ---
useradd -r -m -d /srv/sarkarihub -s /usr/sbin/nologin sarkarihub
mkdir -p /srv/sarkarihub/app /var/log/sarkarihub /var/cache/nginx/sarkarihub
chown -R sarkarihub:sarkarihub /srv/sarkarihub /var/log/sarkarihub
```

Deploy the code as the `sarkarihub` user:

```bash
su -s /bin/bash sarkarihub
cd /srv/sarkarihub/app
git clone <your-repo> .
cp .env.example .env.production
nano .env.production          # see §2
npm ci
npm run build
exit
```

Start it:

```bash
pm2 start /srv/sarkarihub/app/deploy/ecosystem.config.cjs
pm2 save
pm2 startup            # prints a command; run it to survive reboots
pm2 status
```

nginx:

```bash
cp deploy/nginx.conf /etc/nginx/sites-available/sarkarihub
ln -s /etc/nginx/sites-available/sarkarihub /etc/nginx/sites-enabled/
# The cache directory must be owned by the nginx user.
chown -R www-data:www-data /var/cache/nginx/sarkarihub
nginx -t && systemctl reload nginx
```

TLS:

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d example-govjobs.com -d www.example-govjobs.com
systemctl list-timers | grep certbot   # confirm auto-renewal is scheduled
```

---

## 2. Environment on the server

`.env.production`, owned by `sarkarihub`, mode `600`. **Never commit this file.**

```ini
SITE_URL=https://example-govjobs.com
WP_API_URL=https://admin.example-govjobs.com
WP_API_MODE=rest
WP_CACHE_TTL=90
WP_FALLBACK_TO_SNAPSHOT=true

# Generate with:  openssl rand -hex 32
# Must match GOVJOBS_REVALIDATE_SECRET in wp-config.php exactly.
REVALIDATE_SECRET=

WP_APP_USER=
WP_APP_PASSWORD=

PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
PUBLIC_ADSENSE_ENABLED=true
PUBLIC_GA_MEASUREMENT_ID=
```

Two things that are easy to get wrong:

- **`PUBLIC_*` values are baked in at build time.** Vite inlines them. Changing
  AdSense or GA needs `npm run build` again, not a restart.
- **Everything else is read at runtime.** Do not put secrets in `.env` and expect
  them to work from a build — and do not pass them as Docker build args, where
  they end up in image history. `src/lib/env.ts` explains the whole trap; it
  caused a real leak during development.

`chmod 600` the file. It contains the webhook secret and the WordPress
application password.

---

## 3. Docker Compose

```bash
cp .env.example .env.production   # fill it in, mode 600
docker compose -f deploy/docker-compose.yml up -d --build
docker compose -f deploy/docker-compose.yml ps
curl -s localhost:4321/api/health | jq
```

nginx on the host still fronts it — the container publishes on `127.0.0.1:4321`
only, so the Node server is never directly reachable. That is deliberate: going
straight to Node would bypass TLS, rate limiting and the edge cache.

> **One thing to change if you take the Docker path.** The two static-asset
> `location` blocks in `nginx.conf` (`alias .../_astro/` and the image-file
> `root`) point at the bare-metal layout and **will 404 against a container**,
> because nginx on the host cannot read a path inside it. Either bind-mount the
> build output onto the host and repoint those two paths, or delete both blocks
> and let nginx proxy everything — the app already serves `/_astro/` with
> immutable cache headers, so you lose very little.

`.dockerignore` matters here. Without it the Dockerfile's `COPY . .` sends the
entire working directory — including `.env` — to the build daemon. The same class
of leak that `src/lib/env.ts` prevents at runtime, in the build context.

To rebuild after a content-model change:

```bash
docker compose -f deploy/docker-compose.yml up -d --build
```

---

## 4. Pointing WordPress at it

In `wp-config.php` on the WordPress server:

```php
define( 'GOVJOBS_FRONTEND_URL', 'https://example-govjobs.com' );
define( 'GOVJOBS_REVALIDATE_SECRET', 'same-value-as-REVALIDATE_SECRET' );
```

Then confirm the round trip actually works, because a silent failure here means
edits sit invisible until the cache TTL expires:

1. Edit any published post in wp-admin and press Update.
2. `pm2 logs sarkarihub-frontend --lines 20` — no errors.
3. Reload the post on the frontend. The change should be visible immediately.
4. If it is not, use the **Frontend cache** widget on the WordPress dashboard.
   If that works, the webhook is fine and the problem is elsewhere.

---

## 5. Backups

The frontend holds no state worth backing up — it is code plus a cache. Back up:

- The git repository (it should live somewhere other than this server)
- `.env.production`
- `deploy/` if you have customised it

**WordPress is what needs real backups.** Daily database and uploads, off-server,
with the restore tested once. An untested backup is a guess.

---

## 6. Monitoring

Minimum viable:

```bash
# Is it up, and is it reading from WordPress or the fallback snapshot?
curl -s https://example-govjobs.com/api/health | jq
```

Watch `degraded`. `"degraded": true` means WordPress is unreachable and readers
are seeing the bundled snapshot — the site looks fine, which is exactly why it
needs an alert rather than a look.

`lastWordPressError` gives the reason.

Also worth alerting on:

- nginx `X-Cache-Status` hitting `MISS` on most requests (cache misconfigured —
  check that `proxy_cache_key` has not picked up cookies)
- Node RSS growth (`pm2 monit`) — PM2 restarts at 700M
- Certificate expiry (`certbot renew --dry-run`)

---

## 7. Deploying an update

```bash
su -s /bin/bash sarkarihub
cd /srv/sarkarihub/app
git pull
npm ci
npm run check && npm run build      # check first — build alone does not type-check
exit
pm2 reload sarkarihub-frontend      # reload, not restart: no dropped requests
```

`pm2 reload` starts the new process before stopping the old one, so in-flight
requests finish. With `instances: 1` there is a brief overlap; that is fine.

After a deploy, confirm the essentials rather than assuming:

```bash
curl -s https://example-govjobs.com/api/health | jq '.source, .degraded'
curl -sI https://example-govjobs.com/ | grep -i 'x-cache-status\|content-security'
curl -s https://example-govjobs.com/ | grep -c 'cached snapshot'   # must be 0
```

---

## 8. Load testing before launch

Worth doing once, on staging, before you find out on result day. `ab` or `hey`:

```bash
hey -n 20000 -c 200 https://staging.example-govjobs.com/latest-jobs
```

Then watch two things:

1. **nginx cache hit rate** — should be >95% after warm-up.
2. **WordPress request count** during the run. It should be near zero. If
   WordPress is taking thousands of requests, the edge cache is not working and
   that is the thing to fix — not the server size.

That second number is the whole point of this architecture. If it is low, the
portal survives a result-day spike. If it is high, no amount of CPU will save it.
