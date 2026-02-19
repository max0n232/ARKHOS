<?php
/**
 * Snippet Name: Fix Canonical URLs for Multilingual
 * Description: Ensures each language version has self-referencing canonical
 * Version: 1.0
 *
 * ИНСТРУКЦИЯ:
 * 1. WP Admin → Code Snippets → Add New
 * 2. Название: "Fix Canonical URLs"
 * 3. Scope: "Only run on site front-end"
 */

// Удаляем стандартный canonical от Yoast/WP
add_filter('wpseo_canonical', 'studiokook_fix_canonical', 20);
add_filter('get_canonical_url', 'studiokook_fix_canonical', 20);

function studiokook_fix_canonical($canonical) {
    // Получаем текущий URL со всеми параметрами
    $current_url = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http");
    $current_url .= "://" . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];

    // Убираем query strings
    $current_url = strtok($current_url, '?');

    // Нормализуем trailing slash
    $current_url = rtrim($current_url, '/') . '/';

    return $current_url;
}

// Альтернативный метод через wp_head если Yoast не используется
add_action('wp_head', 'studiokook_add_canonical', 2);

function studiokook_add_canonical() {
    // Проверяем, нет ли уже canonical от другого плагина
    if (class_exists('WPSEO_Frontend') || class_exists('RankMath')) {
        return; // Yoast или RankMath уже добавят canonical
    }

    $current_url = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http");
    $current_url .= "://" . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
    $current_url = strtok($current_url, '?');
    $current_url = rtrim($current_url, '/') . '/';

    echo '<link rel="canonical" href="' . esc_url($current_url) . '" />' . "\n";
}
