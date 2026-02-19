<?php
/**
 * Snippet Name: SEO Meta Override v4
 * Description: Заменяет title, description, og:title, og:description для RU/EN/FI
 * Version: 4.0
 *
 * Scope: "Run everywhere"
 */

// === ДАННЫЕ ===

function sk_get_titles() {
    return [
        '' => [
            'ru' => 'Кухни на заказ в Таллинне | Кухонная мебель | Studioköök',
            'en' => 'Custom Kitchens in Tallinn | Kitchen Furniture | Studioköök',
            'fi' => 'Mittatilauskeittöt Tallinnassa | Keittiökalusteet | Studioköök',
        ],
        'koogid-eritellimusel' => [
            'ru' => 'Кухни на заказ в Таллинне | Studioköök',
            'en' => 'Custom Kitchens in Tallinn | Studioköök',
            'fi' => 'Mittatilauskeittöt Tallinnassa | Studioköök',
        ],
        'kontakt' => [
            'ru' => 'Контакты | Studioköök Таллинн',
            'en' => 'Contact | Studioköök Tallinn',
            'fi' => 'Yhteystiedot | Studioköök Tallinna',
        ],
        'hinnaparing' => [
            'ru' => 'Расчёт стоимости кухни | Studioköök',
            'en' => 'Kitchen Price Quote | Studioköök',
            'fi' => 'Keittiön hintalaskuri | Studioköök',
        ],
        'materjalid' => [
            'ru' => 'Материалы для кухонь | Studioköök',
            'en' => 'Kitchen Materials | Studioköök',
            'fi' => 'Keittiömateriaalit | Studioköök',
        ],
        'meie-furnituur' => [
            'ru' => 'Фурнитура Blum и Hettich | Studioköök',
            'en' => 'Hardware | Blum and Hettich | Studioköök',
            'fi' => 'Helat | Blum ja Hettich | Studioköök',
        ],
        'koogid' => [
            'ru' => 'Портфолио кухонь | Studioköök',
            'en' => 'Kitchen Portfolio | Studioköök',
            'fi' => 'Keittiöportfolio | Studioköök',
        ],
        'toopinnad' => [
            'ru' => 'Столешницы для кухни | Studioköök',
            'en' => 'Kitchen Countertops | Studioköök',
            'fi' => 'Keittiötasot | Studioköök',
        ],
        'fassaadid' => [
            'ru' => 'Фасады для кухни | Studioköök',
            'en' => 'Kitchen Facades | Studioköök',
            'fi' => 'Keittiöjulkisivut | Studioköök',
        ],
        'valmistamine' => [
            'ru' => 'Производство кухонь | Studioköök',
            'en' => 'Kitchen Manufacturing | Studioköök',
            'fi' => 'Keittiövalmistus | Studioköök',
        ],
    ];
}

function sk_get_descriptions() {
    return [
        '' => [
            'ru' => 'Кухни на заказ по индивидуальным размерам и проектам. Кухонная мебель в Таллинне, австрийская фурнитура. +372 55 525 143. Бесплатный 3D-дизайн.',
            'en' => 'Custom kitchens tailored to your specifications. Kitchen furniture in Tallinn with Austrian hardware. +372 55 525 143. Free 3D visualization.',
            'fi' => 'Mittatilauskeittöt yksilöllisten mittojen mukaan. Keittiökalusteet Tallinnassa, itävaltalainen helat. +372 55 525 143. Ilmainen 3D-visualisointi.',
        ],
        'koogid-eritellimusel' => [
            'ru' => 'Кухонная мебель на заказ в Таллинне. Бесплатный 3D-дизайн и замер. Австрийские материалы, гарантия 5 лет.',
            'en' => 'Custom kitchen furniture in Tallinn. Free 3D design and measurement. Austrian materials, 5-year warranty.',
            'fi' => 'Mittatilauskeittöt Tallinnassa. Ilmainen 3D-suunnittelu ja mittaus. Itävaltalaiset materiaalit, 5 vuoden takuu.',
        ],
        'kontakt' => [
            'ru' => 'Свяжитесь с нами для заказа кухонной мебели. Пярну мнт 139c, Таллинн. Тел: +372 55 525 143.',
            'en' => 'Contact us to order kitchen furniture. Pärnu mnt 139c, Tallinn. Phone: +372 55 525 143.',
            'fi' => 'Ota yhteyttä keittiökalusteiden tilaamiseksi. Pärnu mnt 139c, Tallinna. Puh: +372 55 525 143.',
        ],
        'hinnaparing' => [
            'ru' => 'Отправьте заявку и получите бесплатный проект кухни и расчёт стоимости в течение 24 часов.',
            'en' => 'Send a request and get a free kitchen project and price quote within 24 hours.',
            'fi' => 'Lähetä pyyntö ja saat ilmaisen keittiöprojektin ja hintatarjouksen 24 tunnin kuluessa.',
        ],
        'materjalid' => [
            'ru' => 'Качественные материалы для кухонной мебели: EGGER, Blum, Hettich. Лучшие производители из Австрии и Германии.',
            'en' => 'Quality kitchen furniture materials: EGGER, Blum, Hettich. Best manufacturers from Austria and Germany.',
            'fi' => 'Laadukkaat keittiökalustemateriaalit: EGGER, Blum, Hettich. Parhaat valmistajat Itävallasta ja Saksasta.',
        ],
        'meie-furnituur' => [
            'ru' => 'Используем только качественную австрийскую фурнитуру: Blum LEGRABOX, AVENTOS, Hettich. Пожизненная гарантия.',
            'en' => 'We use only quality Austrian hardware: Blum LEGRABOX, AVENTOS, Hettich. Lifetime warranty.',
            'fi' => 'Käytämme vain laadukkaita itävaltalaisia heloituksia: Blum LEGRABOX, AVENTOS, Hettich. Elinikäinen takuu.',
        ],
        'koogid' => [
            'ru' => 'Посмотрите наши выполненные проекты кухонь. Более 500 реализованных кухонь в Таллинне и Эстонии.',
            'en' => 'View our completed kitchen projects. Over 500 kitchens installed in Tallinn and Estonia.',
            'fi' => 'Katso valmiita keittiöprojektejamme. Yli 500 toteutettua keittiötä Tallinnassa ja Virossa.',
        ],
        'toopinnad' => [
            'ru' => 'Качественные кухонные столешницы: натуральный камень, искусственный камень, ламинат, HPL компакт-ламинат.',
            'en' => 'Quality kitchen countertops: natural stone, engineered stone, laminate, HPL compact laminate.',
            'fi' => 'Laadukkaat keittiötasot: luonnonkivi, tekokivi, laminaatti, HPL-kompaktilaminaatti.',
        ],
    ];
}

// === ХЕЛПЕРЫ ===

function sk_get_lang() {
    $uri = $_SERVER['REQUEST_URI'] ?? '';
    if (preg_match('#^/(ru|en|fi)(/|$)#', $uri, $m)) {
        return $m[1];
    }
    return 'et';
}

function sk_get_page() {
    $uri = $_SERVER['REQUEST_URI'] ?? '';
    $path = preg_replace('#^/(ru|en|fi)#', '', $uri);
    $path = trim($path, '/');
    if (empty($path)) return '';
    return explode('/', $path)[0];
}

function sk_get_translated_title() {
    $lang = sk_get_lang();
    if ($lang === 'et') return null;
    $page = sk_get_page();
    $titles = sk_get_titles();
    return $titles[$page][$lang] ?? null;
}

function sk_get_translated_description() {
    $lang = sk_get_lang();
    if ($lang === 'et') return null;
    $page = sk_get_page();
    $descs = sk_get_descriptions();
    return $descs[$page][$lang] ?? null;
}

// === TITLE (фильтры работают) ===

add_filter('pre_get_document_title', function($title) {
    return sk_get_translated_title() ?? $title;
}, 999999);

add_filter('wpseo_title', function($title) {
    return sk_get_translated_title() ?? $title;
}, 999999);

add_filter('wpseo_opengraph_title', function($title) {
    return sk_get_translated_title() ?? $title;
}, 999999);

// === DESCRIPTION & OG (через output buffer) ===

add_action('template_redirect', function() {
    $lang = sk_get_lang();
    if ($lang === 'et') return; // Не трогаем эстонскую версию

    ob_start(function($html) {
        $title = sk_get_translated_title();
        $desc = sk_get_translated_description();

        if ($title) {
            // Заменяем <title>
            $html = preg_replace(
                '#<title>[^<]*</title>#i',
                '<title>' . esc_html($title) . '</title>',
                $html
            );
            // Заменяем og:title
            $html = preg_replace(
                '#<meta\s+property="og:title"\s+content="[^"]*"#i',
                '<meta property="og:title" content="' . esc_attr($title) . '"',
                $html
            );
        }

        if ($desc) {
            // Заменяем meta description
            $html = preg_replace(
                '#<meta\s+name="description"\s+content="[^"]*"#i',
                '<meta name="description" content="' . esc_attr($desc) . '"',
                $html
            );
            // Заменяем og:description
            $html = preg_replace(
                '#<meta\s+property="og:description"\s+content="[^"]*"#i',
                '<meta property="og:description" content="' . esc_attr($desc) . '"',
                $html
            );
        }

        return $html;
    });
}, 0);

add_action('shutdown', function() {
    if (ob_get_level() > 0) {
        ob_end_flush();
    }
}, 999);
