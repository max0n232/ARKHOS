<?php
/**
 * Snippet Name: Meta Descriptions for Egger Subcategories
 * Description: Adds meta descriptions for /egger/kivi/, /monokroom/, /puit/ (multilingual)
 * Version: 1.0
 * Date: 2026-02-09
 *
 * ИНСТРУКЦИЯ:
 * 1. WP Admin → Code Snippets → Add New
 * 2. Название: "Egger Subcategories Meta"
 * 3. Scope: "Only run on site front-end"
 *
 * Проблема: Эти страницы не имеют meta description, что снижает CTR в поиске.
 */

add_action('wp_head', 'studiokook_egger_meta_descriptions', 3);

function studiokook_egger_meta_descriptions() {
    $request_uri = $_SERVER['REQUEST_URI'];

    // Определяем язык из URL
    $lang = 'et';
    if (preg_match('#^/(ru|en|fi)/#', $request_uri, $matches)) {
        $lang = $matches[1];
    }

    // Meta descriptions для каждой подкатегории
    $meta_descriptions = [
        'kivi' => [
            'et' => 'Egger kivi dekoorid köögifassaadidele. Graniit, marmor ja terrazzo imitatsioonid kvaliteetses laminaadis. Vaata 12+ dekoori.',
            'ru' => 'Декоры Egger под камень для кухонных фасадов. Имитация гранита, мрамора и терраццо в качественном ламинате. Смотрите 12+ декоров.',
            'en' => 'Egger stone decors for kitchen facades. Granite, marble and terrazzo imitations in quality laminate. View 12+ decors.',
            'fi' => 'Egger kividekoorit keittiön kaapeille. Graniitti-, marmori- ja terrazzojäljitelmät laadukkaassa laminaatissa. Katso 12+ dekooria.'
        ],
        'monokroom' => [
            'et' => 'Egger ühevärvilised dekoorid köögifassaadidele. Valge, must, hall ja muud monokroomsed toonid. Minimalistlik elegants.',
            'ru' => 'Однотонные декоры Egger для кухонных фасадов. Белый, черный, серый и другие монохромные тона. Минималистичная элегантность.',
            'en' => 'Egger solid color decors for kitchen facades. White, black, gray and other monochrome tones. Minimalist elegance.',
            'fi' => 'Egger yksivärinen sisustus keittiön oviin. Valkoinen, musta, harmaa ja muut monokromaattiset sävyt. Minimalistista eleganssia.'
        ],
        'puit' => [
            'et' => 'Egger puiduimitatsioon dekoorid köögifassaadidele. Tamm, pähkel, hikkoripuu ja teised puidu toonid. 60+ dekoori valikus.',
            'ru' => 'Декоры Egger под дерево для кухонных фасадов. Дуб, орех, гикори и другие древесные тона. 60+ декоров в ассортименте.',
            'en' => 'Egger wood imitation decors for kitchen facades. Oak, walnut, hickory and other wood tones. 60+ decors available.',
            'fi' => 'Egger puujäljitelmä dekoorit keittiön oviin. Tammi, pähkinä, hikori ja muut puusävyt. 60+ koristetta saatavilla.'
        ]
    ];

    // Проверяем каждую подкатегорию
    foreach ($meta_descriptions as $slug => $descriptions) {
        // Паттерн: /egger/kivi/ или /ru/egger/kivi/ и т.д.
        $pattern = '#/(ru/|en/|fi/)?egger/' . preg_quote($slug, '#') . '/?$#';

        if (preg_match($pattern, $request_uri)) {
            $description = isset($descriptions[$lang]) ? $descriptions[$lang] : $descriptions['et'];
            echo '<meta name="description" content="' . esc_attr($description) . '" />' . "\n";
            return; // Только один meta description
        }
    }
}

/**
 * Также добавляем canonical для этих страниц
 * (если Yoast не добавляет автоматически)
 */
add_action('wp_head', 'studiokook_egger_canonical', 4);

function studiokook_egger_canonical() {
    $request_uri = $_SERVER['REQUEST_URI'];

    // Проверяем, это ли страница подкатегории Egger
    if (!preg_match('#/(ru/|en/|fi/)?egger/(kivi|monokroom|puit)/?$#', $request_uri)) {
        return;
    }

    // Если Yoast уже добавил canonical - пропускаем
    if (class_exists('WPSEO_Frontend')) {
        return;
    }

    // Формируем canonical URL
    $canonical = 'https://studiokook.ee' . rtrim($request_uri, '/') . '/';
    echo '<link rel="canonical" href="' . esc_url($canonical) . '" />' . "\n";
}
