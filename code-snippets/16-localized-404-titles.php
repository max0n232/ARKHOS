<?php
/**
 * Snippet Name: Localized 404 Titles
 * Description: Shows 404 page title in correct language based on URL
 * Version: 1.0
 *
 * ИНСТРУКЦИЯ:
 * 1. WP Admin → Code Snippets → Add New
 * 2. Название: "Localized 404 Titles"
 * 3. Scope: "Only run on site front-end"
 */

add_filter('pre_get_document_title', 'studiokook_404_title', 99);
add_filter('wpseo_title', 'studiokook_404_title_yoast', 99);

function studiokook_404_title($title) {
    if (!is_404()) return $title;

    $uri = $_SERVER['REQUEST_URI'];
    $lang = 'et';
    if (preg_match('#^/(ru|en|fi)/#', $uri, $m)) {
        $lang = $m[1];
    }

    $titles = [
        'et' => 'Lehte ei leitud - Studioköök',
        'ru' => 'Страница не найдена - Studioköök',
        'en' => 'Page not found - Studioköök',
        'fi' => 'Sivua ei löytynyt - Studioköök'
    ];

    return $titles[$lang] ?? $titles['et'];
}

function studiokook_404_title_yoast($title) {
    if (!is_404()) return $title;
    return studiokook_404_title($title);
}
