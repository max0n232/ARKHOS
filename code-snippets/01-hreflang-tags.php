<?php
/**
 * Snippet Name: Hreflang Tags for Multilingual SEO
 * Description: Adds hreflang tags for ET/RU/EN/FI language versions
 * Version: 1.0
 *
 * ИНСТРУКЦИЯ:
 * 1. Перейти в WP Admin → Code Snippets → Add New
 * 2. Название: "Hreflang Tags"
 * 3. Вставить этот код (без <?php)
 * 4. Scope: "Only run on site front-end"
 * 5. Активировать
 */

add_action('wp_head', 'studiokook_hreflang_tags', 1);

function studiokook_hreflang_tags() {
    // Языковые версии сайта
    $languages = [
        'et' => '',      // Эстонский — корень
        'ru' => '/ru',   // Русский
        'en' => '/en',   // Английский
        'fi' => '/fi'    // Финский
    ];

    // Получаем текущий путь
    $request_uri = $_SERVER['REQUEST_URI'];

    // Убираем языковой префикс для получения базового пути
    $base_path = preg_replace('#^/(ru|en|fi)(/|$)#', '/', $request_uri);
    $base_path = rtrim($base_path, '/');
    if (empty($base_path)) {
        $base_path = '/';
    }

    // Генерируем hreflang теги
    echo "\n<!-- Hreflang Tags - Studiokook SEO -->\n";

    foreach ($languages as $lang => $prefix) {
        $url = 'https://studiokook.ee' . $prefix . ($base_path === '/' ? '/' : $base_path . '/');
        $url = rtrim($url, '/') . '/';
        if ($base_path === '/') {
            $url = 'https://studiokook.ee' . $prefix . '/';
            if ($prefix === '') {
                $url = 'https://studiokook.ee/';
            }
        }
        echo '<link rel="alternate" hreflang="' . esc_attr($lang) . '" href="' . esc_url($url) . '" />' . "\n";
    }

    // x-default указывает на эстонскую версию
    $default_url = 'https://studiokook.ee' . ($base_path === '/' ? '/' : $base_path . '/');
    echo '<link rel="alternate" hreflang="x-default" href="' . esc_url($default_url) . '" />' . "\n";
    echo "<!-- /Hreflang Tags -->\n\n";
}
