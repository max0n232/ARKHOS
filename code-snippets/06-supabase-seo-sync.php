<?php
/**
 * Snippet Name: Supabase SEO Sync
 * Description: Берёт переводы title/meta из Supabase и применяет на сайте
 * Version: 1.0
 *
 * ПРОДВИНУТАЯ ВЕРСИЯ: работает с базой данных переводов
 * Требует: настроенный Supabase с таблицей page_translations
 *
 * Scope: "Only run on site front-end"
 */

// Supabase конфигурация (замени на свои)
define('SUPABASE_URL', 'https://YOUR_PROJECT.supabase.co');
define('SUPABASE_KEY', 'YOUR_ANON_KEY');

// Кэш переводов (transient на 1 час)
function studiokook_get_translations_from_supabase() {
    $cache_key = 'studiokook_seo_translations';
    $cached = get_transient($cache_key);

    if ($cached !== false) {
        return $cached;
    }

    // Запрос к Supabase
    $response = wp_remote_get(SUPABASE_URL . '/rest/v1/page_translations?select=*', [
        'headers' => [
            'apikey' => SUPABASE_KEY,
            'Authorization' => 'Bearer ' . SUPABASE_KEY,
        ],
        'timeout' => 10,
    ]);

    if (is_wp_error($response)) {
        return [];
    }

    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);

    if (!is_array($data)) {
        return [];
    }

    // Преобразуем в удобный формат [slug => translations]
    $translations = [];
    foreach ($data as $row) {
        $slug = $row['slug'] === 'home' ? '' : $row['slug'];
        $translations[$slug] = [
            'et' => [
                'title' => $row['title_et'] ?? '',
                'description' => $row['meta_desc_et'] ?? ''
            ],
            'ru' => [
                'title' => $row['title_ru'] ?? '',
                'description' => $row['meta_desc_ru'] ?? ''
            ],
            'en' => [
                'title' => $row['title_en'] ?? '',
                'description' => $row['meta_desc_en'] ?? ''
            ],
            'fi' => [
                'title' => $row['title_fi'] ?? '',
                'description' => $row['meta_desc_fi'] ?? ''
            ]
        ];
    }

    // Кэшируем на 1 час
    set_transient($cache_key, $translations, HOUR_IN_SECONDS);

    return $translations;
}

// Очистка кэша через webhook
add_action('rest_api_init', function() {
    register_rest_route('studiokook/v1', '/clear-seo-cache', [
        'methods' => 'POST',
        'callback' => function() {
            delete_transient('studiokook_seo_translations');
            return ['success' => true, 'message' => 'SEO cache cleared'];
        },
        'permission_callback' => function() {
            return current_user_can('manage_options');
        }
    ]);
});

// Определяем язык
function studiokook_supabase_get_lang() {
    $uri = $_SERVER['REQUEST_URI'];
    if (preg_match('#^/(ru|en|fi)(/|$)#', $uri, $m)) {
        return $m[1];
    }
    return 'et';
}

// Определяем страницу
function studiokook_supabase_get_page() {
    $uri = $_SERVER['REQUEST_URI'];
    $uri = preg_replace('#^/(ru|en|fi)#', '', $uri);
    $uri = trim($uri, '/');
    if (empty($uri)) return '';
    $parts = explode('/', $uri);
    return $parts[0];
}

// Title фильтр
add_filter('pre_get_document_title', 'studiokook_supabase_title', 1);
add_filter('wpseo_title', 'studiokook_supabase_title', 1);

function studiokook_supabase_title($title) {
    $translations = studiokook_get_translations_from_supabase();
    $lang = studiokook_supabase_get_lang();
    $page = studiokook_supabase_get_page();

    if (isset($translations[$page][$lang]['title']) && !empty($translations[$page][$lang]['title'])) {
        return $translations[$page][$lang]['title'];
    }
    return $title;
}

// Description фильтр
add_filter('wpseo_metadesc', 'studiokook_supabase_description', 1);

function studiokook_supabase_description($desc) {
    $translations = studiokook_get_translations_from_supabase();
    $lang = studiokook_supabase_get_lang();
    $page = studiokook_supabase_get_page();

    if (isset($translations[$page][$lang]['description']) && !empty($translations[$page][$lang]['description'])) {
        return $translations[$page][$lang]['description'];
    }
    return $desc;
}
