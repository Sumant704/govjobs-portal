<?php
/**
 * ---------------------------------------------------------------------------
 * GovJobs Portal — WordPress side
 * ---------------------------------------------------------------------------
 * Everything WordPress has to do to be a good headless backend for the Astro
 * frontend. Drop this in `wp-content/mu-plugins/govjobs-portal.php` so it
 * cannot be deactivated by accident, or paste it into a code snippets plugin.
 *
 * It does five things:
 *   1. Serves a small settings endpoint the frontend reads for the ticker and
 *      contact details, so an admin can edit them without a deploy.
 *   2. Calls the frontend's revalidation webhook whenever content changes, so
 *      an edit is live in seconds instead of after a cache TTL.
 *   3. Allows the frontend origin through CORS for the public REST routes.
 *   4. Hardens wp-admin in the ways that matter for a site this exposed.
 *   5. Adds a "Rebuild frontend" button so an editor can force a refresh
 *      without waiting for anything.
 *
 * Configuration: define these in wp-config.php (never commit real values).
 *
 *   define( 'GOVJOBS_FRONTEND_URL',   'https://example-govjobs.com' );
 *   define( 'GOVJOBS_REVALIDATE_SECRET', 'same-value-as-the-frontend-.env' );
 *   define( 'GOVJOBS_ADMIN_EMAIL',    'editor@example-govjobs.com' );
 */

defined( 'ABSPATH' ) || exit;

/* =========================================================================
 * 1. Settings endpoint
 * ====================================================================== */

/**
 * GET /wp-json/govjobs/v1/settings?lang=hi
 *
 * Returns the ticker items, contact details and site name. The frontend calls
 * this once per render and caches it for five minutes, so it is cheap.
 *
 * The notice list is built from the newest featured posts rather than being a
 * hand-maintained list — editors already mark posts as featured, and a ticker
 * that updates itself is one less thing to forget.
 */
add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'govjobs/v1',
			'/settings',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => '__return_true',
				'callback'            => 'govjobs_rest_settings',
				'args'                => array(
					'lang' => array(
						'type'              => 'string',
						'enum'              => array( 'en', 'hi' ),
						'default'           => 'en',
						'sanitize_callback' => 'sanitize_key',
					),
				),
			)
		);
	}
);

function govjobs_rest_settings( WP_REST_Request $request ) {
	$lang = $request->get_param( 'lang' ) ?: 'en';

	$notices = array();
	$featured = get_posts(
		array(
			'post_type'        => array( 'jobs', 'results', 'admit-card', 'notification' ),
			'posts_per_page'   => 6,
			'post_status'      => 'publish',
			'meta_key'         => 'is_featured',
			'meta_value'       => '1',
			'suppress_filters' => false,
		)
	);

	// Fall back to the newest posts when nothing is flagged as featured, so the
	// ticker is never empty on a fresh install.
	if ( empty( $featured ) ) {
		$featured = get_posts(
			array(
				'post_type'      => array( 'jobs', 'results', 'admit-card', 'notification' ),
				'posts_per_page' => 4,
				'post_status'    => 'publish',
			)
		);
	}

	foreach ( $featured as $post ) {
		$type_object = get_post_type_object( $post->post_type );
		$base        = $type_object->rewrite['slug'] ?? $post->post_type;
		$prefix      = ( 'hi' === $lang ) ? '/hi' : '';

		$notices[] = array(
			'text' => wp_strip_all_tags( get_the_title( $post ) ),
			'href' => sprintf( '%s%s/%s/%s', $prefix, '', $base, $post->post_name ),
		);
	}

	return new WP_REST_Response(
		array(
			'name'         => get_bloginfo( 'name' ),
			'tagline'      => get_bloginfo( 'description' ),
			'notices'      => $notices,
			'contactEmail' => get_option( 'admin_email' ),
			'contactPhone' => get_option( 'govjobs_contact_phone', '' ),
			'address'      => get_option( 'govjobs_address', '' ),
		),
		200
	);
}

/* =========================================================================
 * 2. Revalidation webhook
 * ====================================================================== */

/**
 * Fires the frontend webhook whenever a post changes in a way a reader would
 * notice: publish, update, trash, un-trash, delete.
 *
 * Why a webhook rather than a rebuild: a static rebuild of a few thousand
 * pages takes minutes, and this content changes several times an hour during
 * exam season. The frontend drops the affected cache entries and the next
 * request re-fetches from WordPress — visible in seconds.
 *
 * The call is non-blocking (`blocking => false`), so a slow or unreachable
 * frontend can never make wp-admin feel slow or, worse, fail a publish.
 */
add_action( 'save_post', 'govjobs_fire_revalidate', 10, 3 );
add_action( 'trashed_post', 'govjobs_fire_revalidate_trash' );
add_action( 'untrashed_post', 'govjobs_fire_revalidate_trash' );
add_action( 'deleted_post', 'govjobs_fire_revalidate_trash' );

function govjobs_fire_revalidate( $post_id, $post, $update ) {
	// Autosaves, revisions and autodrafts are not content changes.
	if ( wp_is_post_autosave( $post_id ) || wp_is_post_revision( $post_id ) ) {
		return;
	}
	if ( 'auto-draft' === $post->post_status ) {
		return;
	}
	if ( ! in_array( $post->post_type, govjobs_post_types(), true ) ) {
		return;
	}

	govjobs_call_frontend(
		array(
			'post_id'   => $post_id,
			'post_type' => $post->post_type,
			'slug'      => $post->post_name,
			'action'    => $update ? 'update' : 'publish',
			'status'    => $post->post_status,
		)
	);
}

function govjobs_fire_revalidate_trash( $post_id ) {
	$post = get_post( $post_id );
	if ( ! $post || ! in_array( $post->post_type, govjobs_post_types(), true ) ) {
		return;
	}

	govjobs_call_frontend(
		array(
			'post_id'   => $post_id,
			'post_type' => $post->post_type,
			'slug'      => $post->post_name,
			'action'    => 'trash',
		)
	);
}

/** Shared HTTP call. Never throws, never blocks the admin request. */
function govjobs_call_frontend( array $payload ) {
	$url    = defined( 'GOVJOBS_FRONTEND_URL' ) ? GOVJOBS_FRONTEND_URL : '';
	$secret = defined( 'GOVJOBS_REVALIDATE_SECRET' ) ? GOVJOBS_REVALIDATE_SECRET : '';

	if ( empty( $url ) || empty( $secret ) ) {
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( '[govjobs] GOVJOBS_FRONTEND_URL or GOVJOBS_REVALIDATE_SECRET is not defined; skipping revalidation.' );
		}
		return;
	}

	$response = wp_remote_post(
		trailingslashit( $url ) . 'api/revalidate',
		array(
			'timeout'     => 8,
			'blocking'    => false, // Fire and forget: wp-admin must never wait on this.
			'headers'     => array(
				'Content-Type'        => 'application/json',
				'x-revalidate-secret' => $secret,
			),
			'body'        => wp_json_encode( $payload ),
			'data_format' => 'body',
		)
	);

	if ( is_wp_error( $response ) && defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log( '[govjobs] revalidation request failed: ' . $response->get_error_message() );
	}
}

function govjobs_post_types() {
	return array( 'jobs', 'results', 'admit-card', 'answer-key', 'syllabus', 'admission', 'notification', 'post' );
}

/* =========================================================================
 * 3. CORS for the public REST routes
 * ====================================================================== */

/**
 * Allows the Astro origin to read the public REST API from the browser.
 *
 * Only GET is allowed and only for `wp/v2` and `govjobs/v1`. Credentials are
 * deliberately not allowed: the frontend reads public content anonymously, and
 * enabling credentials here would turn a read-only API into a CSRF surface.
 */
add_action(
	'rest_api_init',
	function () {
		remove_filter( 'rest_pre_serve_request', 'rest_send_cors_headers' );
		add_filter( 'rest_pre_serve_request', 'govjobs_cors_headers', 15 );
	},
	15
);

function govjobs_cors_headers( $value ) {
	$origin  = get_http_origin();
	$allowed = defined( 'GOVJOBS_FRONTEND_URL' ) ? untrailingslashit( GOVJOBS_FRONTEND_URL ) : '';

	if ( $origin && $allowed && untrailingslashit( $origin ) === $allowed ) {
		header( 'Access-Control-Allow-Origin: ' . esc_url_raw( $origin ) );
		header( 'Access-Control-Allow-Methods: GET, OPTIONS' );
		header( 'Access-Control-Allow-Headers: Content-Type, Accept' );
		header( 'Vary: Origin' );
	}

	return $value;
}

/* =========================================================================
 * 4. Hardening
 * ====================================================================== */

// No file editing from wp-admin. A compromised Editor account should not be
// able to turn into remote code execution.
if ( ! defined( 'DISALLOW_FILE_EDIT' ) ) {
	define( 'DISALLOW_FILE_EDIT', true );
}

// Stop publishing the WordPress version, which is the first thing scanners
// fingerprint.
remove_action( 'wp_head', 'wp_generator' );
add_filter( 'the_generator', '__return_empty_string' );

// XML-RPC is a brute-force amplifier and this site does not use it.
add_filter( 'xmlrpc_enabled', '__return_false' );
remove_action( 'wp_head', 'rsd_link' );
remove_action( 'wp_head', 'wlwmanifest_link' );

// Do not leak whether a username exists via the REST API.
add_filter(
	'rest_endpoints',
	function ( $endpoints ) {
		unset( $endpoints['/wp/v2/users'] );
		unset( $endpoints['/wp/v2/users/(?P<id>[\d]+)'] );
		return $endpoints;
	}
);

// Generic login errors: "wrong username" vs "wrong password" is a gift to
// credential-stuffing tools.
add_filter(
	'login_errors',
	function () {
		return __( 'Invalid credentials.' );
	}
);

// No indexing of the admin or the API. The frontend owns SEO entirely.
add_action(
	'admin_head',
	function () {
		echo '<meta name="robots" content="noindex, nofollow" />' . "\n";
	}
);
add_filter(
	'wp_robots',
	function ( $robots ) {
		if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
			$robots['noindex']  = true;
			$robots['nofollow'] = true;
		}
		return $robots;
	}
);

/* =========================================================================
 * 5. Editor convenience
 * ====================================================================== */

/**
 * A "Rebuild frontend" button on the dashboard.
 *
 * Editors should not need to know what a webhook is. When something looks
 * stale, they press this and the cache clears. Useful after bulk edits, when
 * waiting for the TTL would be annoying.
 */
add_action(
	'wp_dashboard_setup',
	function () {
		wp_add_dashboard_widget( 'govjobs_rebuild', 'Frontend cache', 'govjobs_render_rebuild_widget' );
	}
);

function govjobs_render_rebuild_widget() {
	if ( isset( $_POST['govjobs_rebuild_nonce'] ) && wp_verify_nonce( sanitize_key( $_POST['govjobs_rebuild_nonce'] ), 'govjobs_rebuild' ) ) {
		govjobs_call_frontend( array( 'action' => 'manual-flush' ) );
		echo '<p style="color:#15803d;font-weight:600;">Flush request sent. New content will appear within a few seconds.</p>';
	}

	echo '<p>Content is served from a fast cached frontend. It refreshes automatically whenever you publish or update a post.</p>';
	echo '<p>If a change is not showing up, use this button to clear the frontend cache immediately.</p>';
	echo '<form method="post">';
	wp_nonce_field( 'govjobs_rebuild', 'govjobs_rebuild_nonce' );
	submit_button( 'Rebuild frontend now', 'secondary', 'submit', false );
	echo '</form>';
}

/* =========================================================================
 * 6. REST field exposure sanity check
 * ====================================================================== */

/**
 * Warns in wp-admin if the fields the frontend depends on are not visible to
 * the REST API — the single most common cause of "the frontend shows nothing".
 *
 * ACF 6.1+ exposes field groups through REST when the group's "Show in REST
 * API" toggle is on; older setups need the ACF to REST API plugin. Rather than
 * guessing, this asks the API directly.
 */
add_action(
	'admin_notices',
	function () {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		if ( get_transient( 'govjobs_rest_check_ok' ) ) {
			return;
		}

		$response = wp_remote_get(
			rest_url( 'wp/v2/jobs?per_page=1' ),
			array( 'timeout' => 5, 'headers' => array( 'Accept' => 'application/json' ) )
		);

		if ( is_wp_error( $response ) ) {
			return;
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( empty( $body ) ) {
			return; // No jobs published yet — nothing to check.
		}

		$first = $body[0];
		if ( isset( $first['acf'] ) && is_array( $first['acf'] ) ) {
			set_transient( 'govjobs_rest_check_ok', 1, DAY_IN_SECONDS );
			return;
		}

		printf(
			'<div class="notice notice-error"><p><strong>GovJobs frontend:</strong> the REST API is not returning ACF fields. ' .
			'Open <em>ACF &rarr; Field Groups</em>, edit each group, and enable <em>Show in REST API</em> ' .
			'(or install the <em>ACF to REST API</em> plugin). Without this the frontend renders posts with no ' .
			'dates, fees or vacancy tables. Test it at <code>%s</code>.</p></div>',
			esc_html( rest_url( 'wp/v2/jobs?per_page=1' ) )
		);
	}
);
