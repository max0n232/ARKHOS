<?php
/**
 * Snippet Name: Force Title via Output Buffer
 * Description: Принудительная замена title через output buffer (обходит Yoast)
 * Version: 1.0
 *
 * Этот метод работает ПОСЛЕ всех плагинов, заменяя title в финальном HTML
 *
 * Scope: "Only run on site front-end"
 */

// Переводы
function sk_get_titles() {
    return [
        // path => [lang => title]
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
    ];
}

function sk_get_descriptions() {
    return [
        '' => [
            'ru' => 'Кухни на заказ по индивидуальным размерам и проектам. Кухонная мебель в Таллинне, австрийская фурнитура. +372 55 525 143. Бесплатный 3D-дизайн.',
            'en' => 'Custom kitchens tailored to your specifications. Kitchen furniture in Tallinn with Austrian hardware. +372 55 525 143. Free 3D visualization.',
            'fi' => 'Mittatilauskeittöt yksilöllisten mittojen mukaan. Keittiökalusteet Tallinnassa, itävaltalainen helat. +372 55 525 143. Ilmainen 3D-visualisointi.',
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
    ];
}

// Определение языка
function sk_get_lang() {
    if (preg_match('#^/(ru|en|fi)(/|$)#', $_SERVER['REQUEST_URI'], $m)) {
        return $m[1];
    }
    return 'et';
}

// Определение страницы
function sk_get_page() {
    $uri = preg_replace('#^/(ru|en|fi)#', '', $_SERVER['REQUEST_URI']);
    $uri = trim($uri, '/');
    if (empty($uri)) return '';
    return explode('/', $uri)[0];
}

// Начинаем буферизацию
add_action('wp_head', function() {
    ob_start();
}, 1);

// Заменяем title в буфере
add_action('wp_footer', function() {
    $html = ob_get_clean();

    $lang = sk_get_lang();
    $page = sk_get_page();

    // Только для не-эстонских версий
    if ($lang === 'et') {
        echo $html;
        return;
    }

    $titles = sk_get_titles();
    $descriptions = sk_get_descriptions();

    // Замена title
    if (isset($titles[$page][$lang])) {
        $new_title = $titles[$page][$lang];
        $html = preg_replace(
            '#<title>[^<]*</title>#i',
            '<title>' . esc_html($new_title) . '</title>',
            $html
        );

        // Замена og:title
        $html = preg_replace(
            '#<meta property="og:title" content="[^"]*"#i',
            '<meta property="og:title" content="' . esc_attr($new_title) . '"',
            $html
        );
    }

    // Замена description
    if (isset($descriptions[$page][$lang])) {
        $new_desc = $descriptions[$page][$lang];
        $html = preg_replace(
            '#<meta name="description" content="[^"]*"#i',
            '<meta name="description" content="' . esc_attr($new_desc) . '"',
            $html
        );

        // Замена og:description
        $html = preg_replace(
            '#<meta property="og:description" content="[^"]*"#i',
            '<meta property="og:description" content="' . esc_attr($new_desc) . '"',
            $html
        );
    }

    echo $html;
}, 999);
