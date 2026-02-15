<?php
/**
 * Snippet Name: LocalBusiness Schema
 * Description: Adds LocalBusiness structured data for local SEO
 * Version: 1.0
 *
 * ИНСТРУКЦИЯ:
 * 1. WP Admin → Code Snippets → Add New
 * 2. Название: "LocalBusiness Schema"
 * 3. Scope: "Only run on site front-end"
 */

add_action('wp_head', 'studiokook_localbusiness_schema', 5);

function studiokook_localbusiness_schema() {
    // Только на главной и странице контактов
    if (!is_front_page() && !is_page('kontakt')) {
        return;
    }

    // Определяем язык страницы
    $request_uri = $_SERVER['REQUEST_URI'];
    $lang = 'et'; // default
    if (preg_match('#^/(ru|en|fi)/#', $request_uri, $matches)) {
        $lang = $matches[1];
    }

    // Названия и описания по языкам
    $names = [
        'et' => 'Studioköök',
        'ru' => 'Studioköök',
        'en' => 'Studioköök',
        'fi' => 'Studioköök'
    ];

    $descriptions = [
        'et' => 'Eritellimus köögimööbel Tallinnas. Austria furnituur, 5 aasta garantii, tasuta 3D-visualiseerimine.',
        'ru' => 'Кухонная мебель на заказ в Таллинне. Австрийская фурнитура, 5 лет гарантии, бесплатная 3D-визуализация.',
        'en' => 'Custom kitchen furniture in Tallinn. Austrian hardware, 5-year warranty, free 3D visualization.',
        'fi' => 'Mittatilauskeittökalusteet Tallinnassa. Itävaltalaiset helat, 5 vuoden takuu, ilmainen 3D-visualisointi.'
    ];

    $schema = [
        '@context' => 'https://schema.org',
        '@type' => 'LocalBusiness',
        '@id' => 'https://studiokook.ee/#localbusiness',
        'name' => $names[$lang],
        'description' => $descriptions[$lang],
        'url' => 'https://studiokook.ee' . ($lang !== 'et' ? "/$lang/" : '/'),
        'telephone' => '+372 55 525 143',
        'email' => 'info@studiokook.ee',
        'address' => [
            '@type' => 'PostalAddress',
            'streetAddress' => 'Pärnu mnt 139c',
            'addressLocality' => 'Tallinn',
            'addressRegion' => 'Harju',
            'postalCode' => '11317',
            'addressCountry' => 'EE'
        ],
        'geo' => [
            '@type' => 'GeoCoordinates',
            'latitude' => '59.4217',
            'longitude' => '24.7273'
        ],
        'openingHoursSpecification' => [
            [
                '@type' => 'OpeningHoursSpecification',
                'dayOfWeek' => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                'opens' => '09:00',
                'closes' => '18:00'
            ]
        ],
        'priceRange' => '$$',
        'image' => 'https://studiokook.ee/wp-content/uploads/2024/04/IKL4064.jpg',
        'sameAs' => [
            'https://www.facebook.com/studiokook',
            'https://www.instagram.com/studiokook.ee'
        ],
        'areaServed' => [
            [
                '@type' => 'City',
                'name' => 'Tallinn'
            ],
            [
                '@type' => 'AdministrativeArea',
                'name' => 'Harju County'
            ]
        ]
    ];

    echo '<script type="application/ld+json">' . "\n";
    echo json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    echo "\n</script>\n";
}
