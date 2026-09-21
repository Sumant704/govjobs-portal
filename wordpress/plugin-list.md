# WordPress plugin checklist

Ordered by "install this or the site does not work" → "install this before launch".

Everything marked **required** is depended on by `src/lib/wp.ts`. Everything else is
an operational or security choice, with the reasoning included so you can decide
rather than follow a list.

---

## Required

### 1. Advanced Custom Fields PRO

| | |
|---|---|
| **Why** | Every structured table on the frontend (Important Dates, Application Fee, Age Limit, Vacancy Details) is an ACF field. Without it, posts render as title + body only. |
| **Free vs Pro** | **Pro is required.** The Repeater field is a Pro feature, and four of the five frontend tables are built from repeaters. The free version cannot express this content model. |
| **Config** | Import `wordpress/acf-field-groups.json` via *ACF → Tools → Import Field Groups*. Then open each group and enable **Show in REST API** — this is what exposes the fields to `/wp-json/wp/v2/jobs`. |
| **Verify** | `curl https://admin.yoursite.com/wp-json/wp/v2/jobs?per_page=1` must include an `"acf": { ... }` object. If it does not, the frontend will render empty tables. |

### 2. Custom Post Type UI

| | |
|---|---|
| **Why** | Creates the seven post types (Jobs, Results, Admit Card, Answer Key, Syllabus, Admission, Notification) and three taxonomies (Organization, State, Qualification). |
| **Config** | Import `wordpress/cptui-post-types.json` (*CPT UI → Post Types → Import*) and `wordpress/cptui-taxonomies.json` (*CPT UI → Taxonomies → Import*). |
| **Critical setting** | Every post type must have **Show in REST API** enabled with the `rest_base` matching `wordpress/cptui-post-types.json`. If a rest_base is wrong, that entire section of the frontend 404s. `npm run wp:fields` checks this. |

> **Alternative:** you can register the post types in code instead of using CPT UI.
> That is more reliable (nothing to misconfigure, version-controlled, and it cannot
> be broken by a plugin update). CPT UI is recommended here because it is what the
> brief asked for and it lets a non-developer adjust labels later. If you want the
> code version, `register_post_type()` calls matching the JSON are about 30 lines.

### 3. Yoast SEO **or** RankMath

| | |
|---|---|
| **Why** | The frontend reads `yoast_head_json` (Yoast) or `rank_math_description` / `rank_math_og_image` / `rank_math_robots` (RankMath) to populate `<title>`, meta description, canonical, robots and OG image per post. |
| **Which one** | Either works — `normaliseSeo()` in `src/lib/wp.ts` reads whichever is present, and falls back to the post title/excerpt if neither is. RankMath's free tier exposes more of what we need (per-post OG image and robots) than Yoast free does. |
| **Config** | Set a title template like `%%title%% | %%sitename%%`. Keep descriptions 140–158 characters. |
| **Note** | Editors should still fill in **ACF → Short Description**. The SEO description is what Google shows; the short description is what readers see on listing cards. Different jobs. |

---

## Strongly recommended before launch

### 4. Wordfence Security (or Solid Security)

wp-admin is the highest-value target on this stack. A headless setup means a
compromised admin can inject content into every page of a site that gets real
traffic — and, because the frontend trusts the API, it would be served to readers
without any code change.

Configure: limit login attempts (5), enable two-factor for Administrator and Editor
roles, enable the firewall in extended protection mode, and set email alerts for
admin logins.

### 5. WP Mail SMTP

WordPress' default `mail()` is unreliable and password-reset emails silently vanish.
Broken password resets turn into "the editor cannot log in" support tickets on a
Sunday. Any SMTP plugin with a real provider fixes it.

### 6. WP Webhooks

| | |
|---|---|
| **Why** | Fires the frontend revalidation webhook on publish/update. |
| **Do you need it?** | **Not necessarily.** `wordpress/functions-snippets.php` already does this with a `save_post` hook and is more reliable (no UI to misconfigure, fires for trash/untrash too). Install WP Webhooks only if you would rather configure it through a UI than run PHP. Do not enable both — you would fire the webhook twice per save. |

### 7. Object cache — Redis Object Cache

Reduces the cost of each REST request. The frontend caches API responses for 90
seconds, so WordPress sees far fewer requests than visitors; the object cache
matters most when several post types are queried in parallel to build the homepage.

Requires a Redis service on the host. On managed WordPress (WP Engine, Cloudways,
Kinsta) this is a one-click toggle — turn it on.

### 8. Image optimisation — ShortPixel or Smush

| | |
|---|---|
| **Why** | The portal is image-light by design, but featured images still ship. WebP + compression typically cuts 40–60% off a JPEG. |
| **Important** | Compress **on upload**, not retroactively. ACD's `normaliseImage()` prefers the `medium_large` size (768px) rather than the full upload, which already avoids serving 2000px images to phones — but the source file still needs compressing. |

### 9. Media offload — WP Offload Media (S3 / Cloudinary)

Optional, and only worth it past ~5,000 posts. Featured images are served directly
from the WordPress host otherwise, which puts media bandwidth on the same server
that serves the API. If you use a CDN in front of the WordPress host, you may not
need this at all — measure first.

### 10. Polylang (or WPML)

| | |
|---|---|
| **Why** | Hindi + English. The frontend requests `/wp-json/wp/v2/jobs?lang=hi` for Hindi pages; the plugin must be configured so that parameter filters the query. |
| **Config** | Create `en` and `hi`. Set English as default. For each post, add the Hindi translation. Untranslated posts fall back to English automatically — `getPost()` returns whatever the API gives it. |
| **Watch out** | Polylang can change REST behaviour. After enabling it, re-run the check in §1 above for **both** languages. |

---

## Deliberately not included

| Plugin | Why not |
|---|---|
| **A page builder** (Elementor, Divi) | The theme never renders. A builder adds weight, a second content model, and a way for an editor to produce content the frontend cannot display. |
| **A caching plugin** (WP Super Cache, W3TC) | It caches HTML that nobody reads. The frontend caches API responses; that is the layer that matters here. |
| **Jetpack** | Nothing in this stack needs it, and it adds several external connections to a site whose entire security model is "keep the attack surface small". |
| **A comments plugin** | Comments are disabled in the frontend. For this content type they are a moderation liability with no upside. |
| **AMP** | The frontend is already faster than an AMP version would be, and AMP restricts the layout. |

---

## Launch checklist

- [ ] ACF field groups imported, **Show in REST API** enabled on both
- [ ] CPT UI post types + taxonomies imported, every `rest_base` matches
- [ ] `/wp-json/wp/v2/jobs?per_page=1` returns an `acf` object
- [ ] `/wp-json/wp/v2/jobs?per_page=1&lang=hi` returns Hindi titles
- [ ] SEO plugin configured and returning `yoast_head_json` or `rank_math_*`
- [ ] `GOVJOBS_FRONTEND_URL` and `GOVJOBS_REVALIDATE_SECRET` defined in `wp-config.php`
- [ ] Security plugin active with 2FA on Administrator and Editor
- [ ] SMTP working — send a test password reset
- [ ] Object cache enabled
- [ ] Daily database + uploads backup, with a **restore tested once**
- [ ] `DISALLOW_FILE_EDIT` true (set by `functions-snippets.php`)
- [ ] WordPress, plugins and PHP on supported versions, auto-updates on for minor releases
- [ ] `npm run wp:fields` passes against the real site
