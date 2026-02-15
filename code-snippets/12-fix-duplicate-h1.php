<?php
/**
 * Snippet Name: Fix Duplicate H1 Tags
 * Description: Removes entry-title H1 from Astra theme on pages with custom SEO H1
 * Version: 1.0
 * Date: 2026-02-09
 *
 * ПРОБЛЕМА:
 * На некоторых страницах есть 3 H1 тега:
 * 1. entry-title (тема Astra) — заголовок страницы из WP
 * 2. seo-h1 (кастомный snippet) — SEO заголовок
 * 3. Elementor H1 — в контенте страницы
 *
 * РЕШЕНИЕ:
 * Скрыть entry-title на проблемных страницах через CSS
 * ИЛИ удалить через PHP фильтр
 *
 * ИНСТРУКЦИЯ:
 * 1. WP Admin → Code Snippets → Add New
 * 2. Название: "Fix Duplicate H1"
 * 3. Scope: "Only run on site front-end"
 */

// Метод 1: CSS скрытие entry-title И seo-h1 на определённых страницах
add_action('wp_head', 'studiokook_hide_entry_title_h1', 99);

function studiokook_hide_entry_title_h1() {
    // Slugs страниц с проблемой дублирующихся H1
    $problem_slugs = [
        'hpl-tootasapinnad',      // HPL столешницы
        'laminaadist-tootasapinnad', // Ламинат столешницы
        'kividest-tootasapinnad', // Камень столешницы
        'egger-fassaadid',        // Egger фасады
        'fenix',                  // Fenix фасады
        'egger',                  // Egger материалы
        'kivi',                   // Подкатегория камень
        'monokroom',              // Подкатегория монохром
        'puit',                   // Подкатегория дерево
    ];

    // Проверяем через slug (работает с TranslatePress)
    $current_slug = '';
    if (is_page()) {
        global $post;
        $current_slug = $post->post_name ?? '';
    }

    // Также проверяем URL
    $uri = $_SERVER['REQUEST_URI'];
    $should_hide = false;

    if (in_array($current_slug, $problem_slugs)) {
        $should_hide = true;
    } else {
        foreach ($problem_slugs as $slug) {
            if (preg_match('#/' . preg_quote($slug, '#') . '/?(\?|$)#', $uri)) {
                $should_hide = true;
                break;
            }
        }
    }

    if (!$should_hide) {
        return;
    }

    ?>
    <style>
    /* Fix duplicate H1 - скрываем entry-title (Astra) и seo-h1 (старый snippet) */
    .entry-header .entry-title,
    h1.entry-title,
    h1.seo-h1 {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
    }
    </style>
    <?php
}

// Метод 2: PHP удаление entry-title (альтернатива)
// Раскомментируйте если CSS не работает
/*
add_filter('astra_the_title_enabled', 'studiokook_disable_page_title', 10);

function studiokook_disable_page_title($enabled) {
    $problem_pages = [6309, 5804, 6335];

    if (is_page($problem_pages)) {
        return false;
    }

    return $enabled;
}
*/

/**
 * ДОПОЛНИТЕЛЬНО: Удалить класс seo-h1 snippet на сервере
 *
 * Найдите в WP Admin → Code Snippets snippet который добавляет:
 * <h1 class="seo-h1">...</h1>
 *
 * Либо деактивируйте его, либо добавьте условие чтобы он не выводился
 * на страницах где уже есть H1 в Elementor.
 *
 * ЦЕЛЕВОЕ СОСТОЯНИЕ после всех фиксов:
 * - 1 H1 на страницу (из Elementor контента)
 * - entry-title скрыт
 * - seo-h1 snippet отключен или удалён
 */
