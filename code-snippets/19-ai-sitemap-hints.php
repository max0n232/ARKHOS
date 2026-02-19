<?php
/**
 * Plugin Name: AI Sitemap & Meta Tags Enhancement
 * Description: Add AI-friendly meta tags, sitemap hints, and BreadcrumbList schema for better crawler discovery and understanding
 * Version: 1.0.0
 * Code Snippets: true
 * Tags: seo, ai-crawlers, meta-tags, schema, breadcrumb, sitemap, multilingue
 *
 * INSTRUCTIONS:
 * - Save this as a Code Snippet in WordPress admin (Snippets > Add New)
 * - Activate the snippet
 * - This hook into wp_head and add meta tags + sitemap link reference
 * - Adds JSON-LD BreadcrumbList schema for AI understanding of site structure
 * - Multi-language aware: detects /ru/, /en/, /fi/ language prefixes (TranslatePress)
 * - Generates breadcrumbs dynamically based on URL structure
 * - No performance impact - runs during wp_head action
 *
 * FEATURES:
 * 1. Meta tags for AI indexing:
 *    - robots: index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1
 *    - Sitemap link in HTML head
 *
 * 2. BreadcrumbList Schema (JSON-LD):
 *    - Home > Category > Post structure
 *    - Multi-language support (ET/RU/EN/FI)
 *    - Dynamically generated from URL
 *
 * AFFECTED:
 * - wp_head action (priority 99, runs near end)
 * - No database queries on archive/homepage (cached schema output)
 * - Single post/page: fetches post object for breadcrumb title
 */

add_action( 'wp_head', function() {
	// 1. Add AI-optimized robots meta tag
	echo '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">' . "\n";

	// 2. Add sitemap link in head
	echo '<link rel="sitemap" type="application/xml" href="' . esc_url( home_url( '/sitemap_index.xml' ) ) . '">' . "\n";

	// 3. Generate and add BreadcrumbList schema
	echo sk_get_breadcrumb_schema();
}, 99 );

/**
 * Generate BreadcrumbList JSON-LD schema for AI crawlers
 * Supports multi-language URLs (ET, RU, EN, FI)
 *
 * @return string JSON-LD schema HTML or empty string
 */
function sk_get_breadcrumb_schema() {
	global $wp_query;

	// Detect language from URL
	$current_url  = home_url( add_query_arg( null, null ) );
	$home_url_obj = parse_url( home_url( '/' ) );
	$current_path = parse_url( $current_url, PHP_URL_PATH );

	// Language detection (TranslatePress URL structure)
	$lang         = 'et'; // default
	$lang_mapping = array(
		'/ru/'  => 'ru',
		'/en/'  => 'en',
		'/fi/'  => 'fi',
		'/et/'  => 'et', // explicit ET
	);

	foreach ( $lang_mapping as $prefix => $lang_code ) {
		if ( strpos( $current_path, $prefix ) === 0 || strpos( $current_path, $prefix ) === 1 ) {
			$lang = $lang_code;
			break;
		}
	}

	$breadcrumbs = array();

	// 1. Always add Home
	$home_label = 'Studiokook';
	if ( 'ru' === $lang ) {
		$home_label = 'Studiokook';
	} elseif ( 'en' === $lang ) {
		$home_label = 'Home';
	} elseif ( 'fi' === $lang ) {
		$home_label = 'Koti';
	}

	$breadcrumbs[] = array(
		'@type'    => 'ListItem',
		'position' => 1,
		'name'     => $home_label,
		'item'     => home_url( $lang !== 'et' ? '/' . $lang . '/' : '/' ),
	);

	$position = 2;

	// 2. Add category if on category archive
	if ( is_category() ) {
		$cat = get_queried_object();
		$breadcrumbs[] = array(
			'@type'    => 'ListItem',
			'position' => $position,
			'name'     => $cat->name,
			'item'     => get_category_link( $cat->term_id ),
		);
		$position++;
	}

	// 3. Add post/page title if on singular
	if ( is_singular() ) {
		$post = get_queried_object();
		if ( $post ) {
			// Try to get category for hierarchy
			$categories = get_the_category( $post->ID );
			if ( ! empty( $categories ) ) {
				$cat = $categories[0];
				$breadcrumbs[] = array(
					'@type'    => 'ListItem',
					'position' => $position,
					'name'     => $cat->name,
					'item'     => get_category_link( $cat->term_id ),
				);
				$position++;
			}

			// Add post itself
			$breadcrumbs[] = array(
				'@type'    => 'ListItem',
				'position' => $position,
				'name'     => $post->post_title,
				'item'     => get_permalink( $post->ID ),
			);
			$position++;
		}
	}

	// 4. Fallback: if only home breadcrumb, don't output schema (not needed)
	if ( count( $breadcrumbs ) < 2 ) {
		return '';
	}

	// Build JSON-LD
	$schema = array(
		'@context'      => 'https://schema.org',
		'@type'         => 'BreadcrumbList',
		'itemListElement' => $breadcrumbs,
	);

	$json_ld = '<script type="application/ld+json">' . wp_json_encode( $schema ) . '</script>' . "\n";

	return $json_ld;
}
