<?php
/**
 * Snippet Name: SEO Meta Translations Override
 * Description: Forces correct title/meta for each language when TranslatePress misses them
 * Version: 1.0
 *
 * ИНСТРУКЦИЯ:
 * 1. WP Admin → Code Snippets → Add New
 * 2. Название: "SEO Meta Translations"
 * 3. Scope: "Only run on site front-end"
 */

// Определяем текущий язык
function studiokook_get_current_lang() {
    $uri = $_SERVER['REQUEST_URI'];
    if (preg_match('#^/(ru|en|fi)(/|$)#', $uri, $matches)) {
        return $matches[1];
    }
    return 'et';
}

// Переводы Title и Meta Description
function studiokook_get_seo_translations() {
    return [
        // Главная страница
        'home' => [
            'et' => [
                'title' => 'Köögimööbel eritellimusel Tallinnas | Kohandatud köögid | Studioköök',
                'description' => 'Kohandatud köögid individuaalsete mõõtude ja projektide järgi. Köögimööbel Tallinnas, Austria furnituur. +372 55 525 143. Tasuta 3D visualiseerimine.'
            ],
            'ru' => [
                'title' => 'Кухни на заказ в Таллинне | Кухонная мебель | Studioköök',
                'description' => 'Кухни на заказ по индивидуальным размерам и проектам. Кухонная мебель в Таллинне, австрийская фурнитура. +372 55 525 143. Бесплатный 3D-дизайн.'
            ],
            'en' => [
                'title' => 'Custom Kitchens in Tallinn | Kitchen Furniture | Studioköök',
                'description' => 'Custom kitchens tailored to your specifications. Kitchen furniture in Tallinn with Austrian hardware. +372 55 525 143. Free 3D visualization.'
            ],
            'fi' => [
                'title' => 'Mittatilauskeittöt Tallinnassa | Keittiökalusteet | Studioköök',
                'description' => 'Mittatilauskeittöt yksilöllisten mittojen mukaan. Keittiökalusteet Tallinnassa, itävaltalainen helat. +372 55 525 143. Ilmainen 3D-visualisointi.'
            ]
        ],

        // Кухни на заказ
        'koogid-eritellimusel' => [
            'et' => [
                'title' => 'Köögid eritellimusel Tallinnas | Studioköök',
                'description' => 'Köögimööbel eritellimusel Tallinnas. Tasuta 3D visualiseerimine ja mõõdistamine. Austria materjalid, 5-aastane garantii.'
            ],
            'ru' => [
                'title' => 'Кухни на заказ в Таллинне | Studioköök',
                'description' => 'Кухонная мебель на заказ в Таллинне. Бесплатный 3D-дизайн и замер. Австрийские материалы, гарантия 5 лет.'
            ],
            'en' => [
                'title' => 'Custom Kitchens in Tallinn | Studioköök',
                'description' => 'Custom kitchen furniture in Tallinn. Free 3D design and measurement. Austrian materials, 5-year warranty.'
            ],
            'fi' => [
                'title' => 'Mittatilauskeittöt Tallinnassa | Studioköök',
                'description' => 'Mittatilauskeittöt Tallinnassa. Ilmainen 3D-suunnittelu ja mittaus. Itävaltalaiset materiaalit, 5 vuoden takuu.'
            ]
        ],

        // Контакты
        'kontakt' => [
            'et' => [
                'title' => 'Kontakt | Studioköök Tallinn',
                'description' => 'Võtke meiega ühendust köögimööbli tellimiseks. Pärnu mnt 139c, Tallinn. Tel: +372 55 525 143. E-post: maksim@studiokook.ee'
            ],
            'ru' => [
                'title' => 'Контакты | Studioköök Таллинн',
                'description' => 'Свяжитесь с нами для заказа кухонной мебели. Пярну мнт 139c, Таллинн. Тел: +372 55 525 143. Email: maksim@studiokook.ee'
            ],
            'en' => [
                'title' => 'Contact | Studioköök Tallinn',
                'description' => 'Contact us to order kitchen furniture. Pärnu mnt 139c, Tallinn. Phone: +372 55 525 143. Email: maksim@studiokook.ee'
            ],
            'fi' => [
                'title' => 'Yhteystiedot | Studioköök Tallinna',
                'description' => 'Ota yhteyttä keittiökalusteiden tilaamiseksi. Pärnu mnt 139c, Tallinna. Puh: +372 55 525 143. Sähköposti: maksim@studiokook.ee'
            ]
        ],

        // Расчёт стоимости
        'hinnaparing' => [
            'et' => [
                'title' => 'Hinnapäring | Köögi hinna arvutamine | Studioköök',
                'description' => 'Saatke hinnapäring ja saate tasuta köögi projekti ja hinnapakkumise 24 tunni jooksul.'
            ],
            'ru' => [
                'title' => 'Расчёт стоимости кухни | Studioköök',
                'description' => 'Отправьте заявку и получите бесплатный проект кухни и расчёт стоимости в течение 24 часов.'
            ],
            'en' => [
                'title' => 'Kitchen Price Quote | Studioköök',
                'description' => 'Send a request and get a free kitchen project and price quote within 24 hours.'
            ],
            'fi' => [
                'title' => 'Keittiön hintalaskuri | Studioköök',
                'description' => 'Lähetä pyyntö ja saat ilmaisen keittiöprojektin ja hintatarjouksen 24 tunnin kuluessa.'
            ]
        ],

        // Материалы
        'materjalid' => [
            'et' => [
                'title' => 'Materjalid | Köögimööbli materjalid | Studioköök',
                'description' => 'Kvaliteetsed köögimööbli materjalid: EGGER, Blum, Hettich. Austria ja Saksamaa parimad tootjad.'
            ],
            'ru' => [
                'title' => 'Материалы для кухонь | Studioköök',
                'description' => 'Качественные материалы для кухонной мебели: EGGER, Blum, Hettich. Лучшие производители из Австрии и Германии.'
            ],
            'en' => [
                'title' => 'Kitchen Materials | Studioköök',
                'description' => 'Quality kitchen furniture materials: EGGER, Blum, Hettich. Best manufacturers from Austria and Germany.'
            ],
            'fi' => [
                'title' => 'Keittiömateriaalit | Studioköök',
                'description' => 'Laadukkaat keittiökalustemateriaalit: EGGER, Blum, Hettich. Parhaat valmistajat Itävallasta ja Saksasta.'
            ]
        ],

        // Фурнитура
        'meie-furnituur' => [
            'et' => [
                'title' => 'Furnituur | Blum ja Hettich | Studioköök',
                'description' => 'Kasutame ainult kvaliteetset Austria furnituuri: Blum LEGRABOX, AVENTOS, Hettich. Eluaegne garantii.'
            ],
            'ru' => [
                'title' => 'Фурнитура Blum и Hettich | Studioköök',
                'description' => 'Используем только качественную австрийскую фурнитуру: Blum LEGRABOX, AVENTOS, Hettich. Пожизненная гарантия.'
            ],
            'en' => [
                'title' => 'Hardware | Blum and Hettich | Studioköök',
                'description' => 'We use only quality Austrian hardware: Blum LEGRABOX, AVENTOS, Hettich. Lifetime warranty.'
            ],
            'fi' => [
                'title' => 'Helat | Blum ja Hettich | Studioköök',
                'description' => 'Käytämme vain laadukkaita itävaltalaisia heloituksia: Blum LEGRABOX, AVENTOS, Hettich. Elinikäinen takuu.'
            ]
        ]
    ];
}

// Получаем slug текущей страницы
function studiokook_get_page_slug() {
    $uri = $_SERVER['REQUEST_URI'];
    // Убираем языковой префикс
    $uri = preg_replace('#^/(ru|en|fi)#', '', $uri);
    $uri = trim($uri, '/');

    // Если главная
    if (empty($uri)) {
        return 'home';
    }

    // Берём последний сегмент пути
    $segments = explode('/', $uri);
    return end($segments);
}

// Фильтр для title
add_filter('pre_get_document_title', 'studiokook_override_title', 999);
add_filter('wpseo_title', 'studiokook_override_title', 999);

function studiokook_override_title($title) {
    $lang = studiokook_get_current_lang();
    $slug = studiokook_get_page_slug();
    $translations = studiokook_get_seo_translations();

    if (isset($translations[$slug][$lang]['title'])) {
        return $translations[$slug][$lang]['title'];
    }

    return $title;
}

// Фильтр для meta description
add_filter('wpseo_metadesc', 'studiokook_override_description', 999);

function studiokook_override_description($desc) {
    $lang = studiokook_get_current_lang();
    $slug = studiokook_get_page_slug();
    $translations = studiokook_get_seo_translations();

    if (isset($translations[$slug][$lang]['description'])) {
        return $translations[$slug][$lang]['description'];
    }

    return $desc;
}

// Добавляем meta description если Yoast не установлен
add_action('wp_head', 'studiokook_add_meta_description', 3);

function studiokook_add_meta_description() {
    // Пропускаем если Yoast активен
    if (class_exists('WPSEO_Frontend')) {
        return;
    }

    $lang = studiokook_get_current_lang();
    $slug = studiokook_get_page_slug();
    $translations = studiokook_get_seo_translations();

    if (isset($translations[$slug][$lang]['description'])) {
        echo '<meta name="description" content="' . esc_attr($translations[$slug][$lang]['description']) . '" />' . "\n";
    }
}
