# WordPress setup — step by step

This is the backend half of the portal. Follow it in order; each step has a
verification you can run before moving on. Skipping a verification is how you end
up with a frontend that renders titles and nothing else, and no error to explain why.

Estimated time from a blank WordPress install: **60–90 minutes.**

---

## 0. Before you start

You need:

- A WordPress install (self-hosted to begin with, per the brief — a VPS later)
- Admin access to it
- The frontend deployed somewhere reachable, or running locally
- About 20 minutes of patience for the ACF import

Set these in `wp-config.php` now. The snippets file reads them, and adding them
later means a second round of testing:

```php
// wp-config.php — above the "That's all, stop editing!" line

define( 'GOVJOBS_FRONTEND_URL', 'https://example-govjobs.com' ); // no trailing slash
define( 'GOVJOBS_REVALIDATE_SECRET', 'paste-the-same-value-as-the-frontend-.env' );

// Recommended hardening (the snippets file sets these if you don't)
define( 'DISALLOW_FILE_EDIT', true );
define( 'WP_AUTO_UPDATE_CORE', 'minor' );
```

The secret **must** match `REVALIDATE_SECRET` in the frontend's environment. If
they differ, the webhook returns 401 and edits sit invisible until the cache TTL
expires — which looks like "the frontend is broken" but is not.

---

## 1. Install the plugins

Install and activate, in this order:

1. **Advanced Custom Fields PRO** — the repeater field is Pro-only and four of the
   five frontend tables need it. The free version cannot express this content model.
2. **Custom Post Type UI**
3. **Yoast SEO** or **RankMath**
4. Wordfence, WP Mail SMTP, Redis Object Cache (see `plugin-list.md` for why)

> **Do not install both WP Webhooks and the snippets file.** Both fire the
> revalidation webhook; enabling both means two requests per save. The snippets
> file is more reliable (it also fires on trash/untrash). Pick one.

---

## 2. Create the post types

*CPT UI → Post Types → Import* → upload `wordpress/cptui-post-types.json`.

Then **check each one manually** — the import is the step most likely to go
quietly wrong:

*CPT UI → Post Types → Edit → Jobs*, and confirm:

| Setting | Required value |
|---|---|
| Show in REST API | **True** |
| REST API base slug | `jobs` |
| Supports | Title, Editor, Excerpt, Featured Image, Revisions, Author |

Repeat for `results`, `admit-card`, `answer-key`, `syllabus`, `admission`,
`notification`.

### Verify

```bash
curl -s "https://admin.yoursite.com/wp-json/wp/v2/jobs?per_page=1" | head -c 200
```

Expect `[]` (empty array — no posts yet) or a post object. A `404` with
`rest_no_route` means the rest_base is wrong. Fix it before continuing; every
downstream step depends on it.

---

## 3. Create the taxonomies

*CPT UI → Taxonomies → Import* → upload `wordpress/cptui-taxonomies.json`.

This creates **Organization** (drives the filter chips on listing pages),
**State / Region** and **Qualification**.

### Verify

```bash
curl -s "https://admin.yoursite.com/wp-json/wp/v2/organization" | head -c 200
```

---

## 4. Import the ACF field groups

*ACF → Tools → Import Field Groups* → upload `wordpress/acf-field-groups.json`.

You get two groups:

| Group | Applies to | Contains |
|---|---|---|
| **GovJobs — Content Essentials** | all seven post types | Organization, Short Description, Important Dates, Application Fee, Official Website, Apply Online Link, Notification PDF, How to Apply |
| **GovJobs — Eligibility, Age & Vacancies** | all seven post types | Qualification, Job Location, Age Limit, Total Vacancies, Featured, Vacancy Details |

### The one setting that matters

After importing, open **each** field group, scroll to *Settings*, and confirm
**Show in REST API** is **Yes**.

This is the single most common cause of "the frontend shows nothing". ACF stores
the fields; without this toggle it does not put them on the REST response, and the
frontend has no way to know they exist. It renders an empty page with no error.

If your ACF version predates the built-in REST toggle (6.1), install the
**ACF to REST API** plugin instead.

### Verify — do not skip this

```bash
curl -s "https://admin.yoursite.com/wp-json/wp/v2/jobs?per_page=1" | python -m json.tool | grep -A5 '"acf"'
```

You must see an `"acf"` object. If it is absent, stop and fix it here. Everything
after this point assumes it works.

The snippets file also adds an admin notice that warns you when this is misconfigured.

---

## 5. Field notes for editors

These are the conventions the frontend relies on. Worth pasting into an internal
wiki — an editor who does not know them will produce pages that look broken.

**Important Dates** — every date a candidate needs, one row each. Put the
application deadline on its own row and switch **Highlight** on. The frontend uses
that highlighted row for three things: the deadline countdown card, the "N days
left" badge on cards, and schema.org `validThrough`. Without it, the post loses its
urgency signals and its rich result.

**Application Fee** — one row per category. Enter `0` for free; it renders as a
green "Free" pill rather than "₹0", which reads as a formatting bug.

**Total Vacancies** — digits only (`17727`). The frontend adds separators and
renders `17,727`. Non-numeric values like `280+ Universities` also work and are
shown verbatim.

**Notification PDF** — set the field's *Return Value* to **File URL**. The
frontend also handles the array/object return formats, but the URL format is what
it expects first.

**Short Description** — 140–158 characters. This is what readers see on listing
cards. It is **not** the same as the SEO meta description; fill in both.

**Update, don't republish.** When an authority issues a corrigendum or extends a
date, edit the existing post. The frontend treats the post as the canonical page
for that notification, and the webhook invalidates it within seconds. Publishing a
second post splits the traffic and leaves a stale page indexed.

---

## 6. Add the snippets file

Copy `wordpress/functions-snippets.php` to `wp-content/mu-plugins/govjobs-portal.php`.

Create the `mu-plugins` directory if it does not exist. Must-use plugins cannot be
deactivated by accident, which matters for the webhook.

If you cannot use `mu-plugins`, paste the file's contents into a code-snippets
plugin instead — but do not also enable WP Webhooks.

### What it adds

| Feature | Why |
|---|---|
| `GET /wp-json/govjobs/v1/settings` | Serves the ticker, site name and contact details, so an admin can edit them without a frontend deploy. The ticker is built from featured posts, so it maintains itself. |
| Revalidation webhook | Calls the frontend on publish / update / trash / untrash. Non-blocking, so a slow frontend can never make wp-admin feel slow or fail a publish. |
| CORS for the frontend origin | Read-only (GET), no credentials. |
| Hardening | Disables file editing, XML-RPC, the version generator, user enumeration via REST, and generic login errors. |
| "Rebuild frontend" dashboard widget | Editors get a button instead of needing to understand webhooks. |
| ACF/REST misconfiguration warning | Turns the silent failure from §4 into a visible admin notice. |

### Verify

```bash
curl -s "https://admin.yoursite.com/wp-json/govjobs/v1/settings?lang=en" | python -m json.tool
```

---

## 7. User roles

| Role | Capabilities |
|---|---|
| **Administrator** | You. Full access, plugin updates, users. |
| **Editor** | Create, edit, publish and delete **any** post across all seven post types, plus upload media. This is the daily-driver role for staff. |
| **Author** | Create and edit **their own** posts, but cannot publish — submissions land in *Pending Review*. Use for contributors whose work needs checking. |

Set this up now, before adding staff. Retrofitting roles after people have
accounts is more annoying than doing it once.

For a small team, one shared Editor account per person (never shared between
people) is enough. Do not give Editor to anyone who does not need to publish.

---

## 8. Publishing workflow

1. **Add New** under the relevant post type in wp-admin.
2. Title: match the search phrase a candidate would type — `SSC CGL 2026
   Notification — 17,727 Posts`, not `CGL Notification`.
3. Fill in **both** ACF groups. Empty fields render nothing rather than an empty
   table, so a half-filled post looks incomplete to a reader.
4. Set a **Featured Image**. If you skip it, the frontend renders a coloured
   gradient panel derived from the post type — it degrades gracefully, but a real
   image performs better on social shares.
5. Assign **Organization**, and **State** / **Qualification** where relevant.
6. **Publish.** The webhook fires; the page is live within seconds.

---

## 9. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Frontend renders titles but no tables | ACF not exposed to REST | §4 — enable *Show in REST API*, re-run the `curl` check |
| An entire section 404s (`/results`, `/admit-card`…) | Wrong `rest_base` on that post type | §2 — check it matches `cptui-post-types.json` |
| Hindi pages show English text | Polylang not filtering by `?lang=` | Check `curl ".../wp/v2/jobs?per_page=1&lang=hi"` returns Hindi titles |
| Edits do not appear on the frontend | Webhook secret mismatch, or the frontend is unreachable from WordPress | `REVALIDATE_SECRET` must match exactly. Check the "Rebuild frontend" widget on the dashboard; if it works, the webhook does too. |
| Frontend shows a "cached snapshot" banner | The frontend cannot reach the API | Check `WP_API_URL` and that WordPress is up. The banner is intentional — it means readers still get content instead of an error page. |
| `npm run wp:fields` reports drift | A field was renamed on one side only | Rename it in the other place, or add it to `KNOWN_ALIASES` in the script if the old name is a deliberate fallback |

---

## 10. Backups

Non-negotiable, and the restore must be tested once — an untested backup is a
guess, not a backup.

- **Daily** database backup, retained 30 days
- **Daily** `wp-content/uploads` backup, retained 30 days
- **Weekly** full-site backup, retained 3 months
- Store backups off the WordPress server (S3, Backblaze, or your host's remote option)

Your managed host probably includes all of this. Confirm it does rather than
assuming, and confirm the retention window — 7 days is not enough if you notice a
content problem on day 9.
