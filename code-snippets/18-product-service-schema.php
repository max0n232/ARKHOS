<?php
/**
 * Snippet Name: Product/Service Schema for Kitchen Services
 * Description: Structured data for kitchen service pages. Detects service pages by slug patterns. References LocalBusiness @id. Multi-language support.
 * Version: 1.0
 *
 * ИНСТРУКЦИЯ:
 * 1. WP Admin → Code Snippets → Add New
 * 2. Название: "Product/Service Schema for Kitchen Services"
 * 3. Scope: "Only run on site front-end"
 *
 * ДЕТЕКЦИЯ СЕРВИС-СТРАНИЦ:
 * - Шаблон слага: содержит 'köögimööbel', 'kitchen', 'кухн', 'keittö'
 * - Применяется на страницах услуг кухни
 *
 * ПРОВАЙДЕР: Studioköök (ссылка на LocalBusiness @id)
 * ЦЕНЫ: от 3000 EUR
 * ТЕРРИТОРИЯ: Таллинн, Харьюский уезд, Эстония
 */

add_action('wp_head', 'studiokook_service_schema', 5);

function studiokook_service_schema() {
    global $post;

    if (!is_singular(['page', 'post'])) {
        return;
    }

    if (!$post) {
        return;
    }

    // Определяем язык страницы
    $lang = get_page_language();

    // Проверяем, это ли страница услуги (по slug)
    if (!studiokook_is_service_page($post->post_name)) {
        return;
    }

    // Описания услуг по языкам
    $service_descriptions = [
        'et' => 'Professionaalse köögimööbli disain ja paigaldamine Tallinnas. Austria fuurnituur, 5 aasta garantii, tasuta 3D-visualiseerimine.',
        'ru' => 'Профессиональное проектирование и установка кухонной мебели в Таллинне. Австрийская фурнитура, 5 лет гарантии, бесплатная 3D-визуализация.',
        'en' => 'Professional kitchen furniture design and installation in Tallinn. Austrian hardware, 5-year warranty, free 3D visualization.',
        'fi' => 'Ammattimainen keittökalustesuunnittelu ja asennus Tallinnassa. Itävaltalaiset helat, 5 vuoden takuu, ilmainen 3D-visualisointi.'
    ];

    $service_names = [
        'et' => 'Köögimööbli kohandatud teenus',
        'ru' => 'Услуга заказной кухонной мебели',
        'en' => 'Custom Kitchen Furniture Service',
        'fi' => 'Mittatilauskeittökalusten palvelu'
    ];

    // Определяем тип услуги на основе слага страницы
    $page_slug = $post->post_name;
    $service_type = 'Service'; // дефолт

    // Определяем более специфичный тип услуги
    if (stripos($page_slug, 'köögimööbel') !== false || stripos($page_slug, 'kitchen') !== false) {
        $service_type = 'Service';
    }

    // Формируем Service schema
    $schema = [
        '@context' => 'https://schema.org',
        '@type' => 'Service',
        '@id' => home_url('/service/kitchen/') . '#service',
        'name' => $service_names[$lang] ?? $service_names['et'],
        'description' => $service_descriptions[$lang] ?? $service_descriptions['et'],
        'url' => get_permalink($post),
        'provider' => [
            '@type' => 'LocalBusiness',
            '@id' => 'https://studiokook.ee/#localbusiness',
            'name' => 'Studioköök',
            'url' => 'https://studiokook.ee' . ($lang !== 'et' ? "/$lang/" : '/'),
            'telephone' => '+372 55 525 143',
            'email' => 'info@studiokook.ee'
        ],
        'priceRange' => 'EUR3000-EUR25000',
        'areaServed' => [
            [
                '@type' => 'City',
                'name' => 'Tallinn'
            ],
            [
                '@type' => 'AdministrativeArea',
                'name' => 'Harju County'
            ],
            [
                '@type' => 'Country',
                'name' => 'Estonia'
            ]
        ],
        'serviceType' => 'Kitchen Furniture Design and Installation',
        'serviceArea' => [
            '@type' => 'Place',
            'name' => 'Tallinn, Estonia'
        ],
        'potentialAction' => [
            '@type' => 'TradeAction',
            'target' => [
                '@type' => 'EntryPoint',
                'urlTemplate' => home_url('/kontakt/') . '?service=kitchen'
            ]
        ],
        'offers' => [
            '@type' => 'Offer',
            'priceCurrency' => 'EUR',
            'price' => '3000',
            'priceValidUntil' => date('Y-m-d', strtotime('+1 year')),
            'description' => 'Alates / Starting from / От / Alkaen'
        ]
    ];

    // Добавляем рейтинг если есть
    $rating = get_post_meta($post->ID, 'service_rating', true);
    $review_count = get_post_meta($post->ID, 'service_reviews', true);

    if (!empty($rating) && !empty($review_count)) {
        $schema['aggregateRating'] = [
            '@type' => 'AggregateRating',
            'ratingValue' => (float)$rating,
            'ratingCount' => (int)$review_count,
            'bestRating' => 5,
            'worstRating' => 1
        ];
    }

    echo '<script type="application/ld+json">' . "\n";
    echo json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    echo "\n</script>\n";
}

/**
 * Проверяем, это ли страница услуги по slug'у
 */
function studiokook_is_service_page($page_slug) {
    // Паттерны слагов для определения страниц услуг
    $service_patterns = [
        'köögimööbel',    // ET: kitchen furniture
        'kitchen',         // EN
        'кухн',           // RU: кухня, кухонная и т.д.
        'keittö',         // FI: kitchen
        'köögid',         // ET plural
        'kotitalouskuja',  // Custom service pages
        'kuidas-tellida',  // How to order page (also service)
        'kak-zakazat',    // RU version
        'how-to-order'    // EN version
    ];

    foreach ($service_patterns as $pattern) {
        if (stripos($page_slug, $pattern) !== false) {
            return true;
        }
    }

    // Проверяем наличие custom field 'is_service_page'
    global $post;
    if ($post && get_post_meta($post->ID, 'is_service_page', true) === '1') {
        return true;
    }

    return false;
}

/**
 * Вспомогательная функция: определяет язык текущей страницы
 */
function get_page_language() {
    $request_uri = $_SERVER['REQUEST_URI'];
    $lang = 'et'; // default

    if (preg_match('#^/(ru|en|fi)/#', $request_uri, $matches)) {
        $lang = $matches[1];
    }

    return $lang;
}

/**
 * ДОПОЛНИТЕЛЬНО (необязательно):
 * Если нужно добавить рейтинги услуг через админ-интерфейс:
 *
 * add_action('add_meta_boxes', 'studiokook_add_service_meta_boxes');
 *
 * function studiokook_add_service_meta_boxes() {
 *     add_meta_box(
 *         'service_rating',
 *         'Service Rating (for Schema)',
 *         'studiokook_render_rating_meta_box',
 *         'page'
 *     );
 * }
 *
 * function studiokook_render_rating_meta_box($post) {
 *     $rating = get_post_meta($post->ID, 'service_rating', true);
 *     $reviews = get_post_meta($post->ID, 'service_reviews', true);
 *     echo '<label>Rating (1-5): <input type="number" name="service_rating" value="' . esc_attr($rating) . '" min="1" max="5" step="0.1"></label>';
 *     echo '<br><label>Review Count: <input type="number" name="service_reviews" value="' . esc_attr($reviews) . '" min="0"></label>';
 * }
 */
