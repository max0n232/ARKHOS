<?php
/**
 * Snippet Name: Fix x-default hreflang
 * Description: Replaces TranslatePress incorrect x-default with correct Estonian URL
 * Version: 2.0
 *
 * Problem: TranslatePress sets x-default to current page URL instead of Estonian version
 * Solution: Use output buffering to replace incorrect x-default tag
 *
 * ИНСТРУКЦИЯ:
 * 1. WP Admin → Code Snippets → Add New
 * 2. Название: "Fix x-default hreflang"
 * 3. Scope: "Only run on site front-end"
 * 4. Priority: 10
 */

/**
 * Start output buffering early to capture TranslatePress hreflang output
 */
add_action('template_redirect', 'studiokook_start_xdefault_buffer', 1);

function studiokook_start_xdefault_buffer() {
    // Only buffer on frontend, not admin or REST API
    if (is_admin() || defined('REST_REQUEST')) {
        return;
    }
    ob_start('studiokook_fix_xdefault_hreflang');
}

/**
 * Output buffer callback - fixes x-default hreflang tag
 *
 * @param string $html The buffered HTML output
 * @return string Modified HTML with correct x-default
 */
function studiokook_fix_xdefault_hreflang($html) {
    // Get correct x-default URL (Estonian version)
    $correct_xdefault = studiokook_get_estonian_url();

    // Pattern to match TranslatePress x-default tag
    // Matches: <link rel="alternate" hreflang="x-default" href="...">
    $pattern = '/<link\s+rel=["\']alternate["\']\s+hreflang=["\']x-default["\']\s+href=["\'][^"\']*["\']\s*\/?>/i';

    // Check if x-default exists
    if (preg_match($pattern, $html)) {
        // Replace existing x-default with correct one
        $replacement = '<link rel="alternate" hreflang="x-default" href="' . esc_url($correct_xdefault) . '" />';
        $html = preg_replace($pattern, $replacement, $html, 1);
    }

    return $html;
}

/**
 * Get the Estonian (default language) URL for current page
 *
 * @return string Estonian URL
 */
function studiokook_get_estonian_url() {
    $request_uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '/';

    // Remove query string for clean path
    $path = parse_url($request_uri, PHP_URL_PATH);
    if ($path === null) {
        $path = '/';
    }

    // Remove language prefix (ru, en, fi) to get base path
    $base_path = preg_replace('#^/(ru|en|fi)(/|$)#', '/', $path);

    // Normalize path
    $base_path = rtrim($base_path, '/');
    if (empty($base_path)) {
        $base_path = '/';
    } else {
        $base_path .= '/';
    }

    return 'https://studiokook.ee' . $base_path;
}
