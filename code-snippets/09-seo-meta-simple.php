<?php
/**
 * Snippet Name: SEO Meta Translations v5
 * Description: Title + description + OG для RU/EN/FI через фильтры
 * Version: 5.0
 * Scope: "Only run on site front-end"
 */

// === ДАННЫЕ (уникальные имена функций) ===

function sk5_get_titles() {
    return array(
        '' => array(
            'ru' => 'Кухни на заказ в Таллинне | Кухонная мебель | Studioköök',
            'en' => 'Custom Kitchens in Tallinn | Kitchen Furniture | Studioköök',
            'fi' => 'Mittatilauskeittöt Tallinnassa | Keittiökalusteet | Studioköök',
        ),
        'koogid-eritellimusel' => array(
            'ru' => 'Кухни на заказ в Таллинне | Studioköök',
            'en' => 'Custom Kitchens in Tallinn | Studioköök',
            'fi' => 'Mittatilauskeittöt Tallinnassa | Studioköök',
        ),
        'kontakt' => array(
            'ru' => 'Контакты | Studioköök Таллинн',
            'en' => 'Contact | Studioköök Tallinn',
            'fi' => 'Yhteystiedot | Studioköök Tallinna',
        ),
        'hinnaparing' => array(
            'ru' => 'Расчёт стоимости кухни | Studioköök',
            'en' => 'Kitchen Price Quote | Studioköök',
            'fi' => 'Keittiön hintalaskuri | Studioköök',
        ),
        'materjalid' => array(
            'ru' => 'Материалы для кухонь | Studioköök',
            'en' => 'Kitchen Materials | Studioköök',
            'fi' => 'Keittiömateriaalit | Studioköök',
        ),
        'meie-furnituur' => array(
            'ru' => 'Фурнитура Blum и Hettich | Studioköök',
            'en' => 'Hardware | Blum and Hettich | Studioköök',
            'fi' => 'Helat | Blum ja Hettich | Studioköök',
        ),
        'koogid' => array(
            'ru' => 'Портфолио кухонь | Studioköök',
            'en' => 'Kitchen Portfolio | Studioköök',
            'fi' => 'Keittiöportfolio | Studioköök',
        ),
        'toopinnad' => array(
            'ru' => 'Столешницы для кухни | Studioköök',
            'en' => 'Kitchen Countertops | Studioköök',
            'fi' => 'Keittiötasot | Studioköök',
        ),
        'fassaadid' => array(
            'ru' => 'Фасады для кухни | Studioköök',
            'en' => 'Kitchen Facades | Studioköök',
            'fi' => 'Keittiöjulkisivut | Studioköök',
        ),
        'valmistamine' => array(
            'ru' => 'Производство кухонь | Studioköök',
            'en' => 'Kitchen Manufacturing | Studioköök',
            'fi' => 'Keittiövalmistus | Studioköök',
        ),
    );
}

function sk5_get_descriptions() {
    return array(
        '' => array(
            'ru' => 'Кухни на заказ по индивидуальным размерам и проектам. Кухонная мебель в Таллинне, австрийская фурнитура. +372 55 525 143. Бесплатный 3D-дизайн.',
            'en' => 'Custom kitchens tailored to your specifications. Kitchen furniture in Tallinn with Austrian hardware. +372 55 525 143. Free 3D visualization.',
            'fi' => 'Mittatilauskeittöt yksilöllisten mittojen mukaan. Keittiökalusteet Tallinnassa, itävaltalainen helat. +372 55 525 143. Ilmainen 3D-visualisointi.',
        ),
        'koogid-eritellimusel' => array(
            'ru' => 'Кухонная мебель на заказ в Таллинне. Бесплатный 3D-дизайн и замер. Австрийские материалы, гарантия 5 лет.',
            'en' => 'Custom kitchen furniture in Tallinn. Free 3D design and measurement. Austrian materials, 5-year warranty.',
            'fi' => 'Mittatilauskeittöt Tallinnassa. Ilmainen 3D-suunnittelu ja mittaus. Itävaltalaiset materiaalit, 5 vuoden takuu.',
        ),
        'kontakt' => array(
            'ru' => 'Свяжитесь с нами для заказа кухонной мебели. Пярну мнт 139c, Таллинн. Тел: +372 55 525 143.',
            'en' => 'Contact us to order kitchen furniture. Pärnu mnt 139c, Tallinn. Phone: +372 55 525 143.',
            'fi' => 'Ota yhteyttä keittiökalusteiden tilaamiseksi. Pärnu mnt 139c, Tallinna. Puh: +372 55 525 143.',
        ),
        'hinnaparing' => array(
            'ru' => 'Отправьте заявку и получите бесплатный проект кухни и расчёт стоимости в течение 24 часов.',
            'en' => 'Send a request and get a free kitchen project and price quote within 24 hours.',
            'fi' => 'Lähetä pyyntö ja saat ilmaisen keittiöprojektin ja hintatarjouksen 24 tunnin kuluessa.',
        ),
        'materjalid' => array(
            'ru' => 'Качественные материалы для кухонной мебели: EGGER, Blum, Hettich. Лучшие производители из Австрии и Германии.',
            'en' => 'Quality kitchen furniture materials: EGGER, Blum, Hettich. Best manufacturers from Austria and Germany.',
            'fi' => 'Laadukkaat keittiökalustemateriaalit: EGGER, Blum, Hettich. Parhaat valmistajat Itävallasta ja Saksasta.',
        ),
        'meie-furnituur' => array(
            'ru' => 'Используем только качественную австрийскую фурнитуру: Blum LEGRABOX, AVENTOS, Hettich. Пожизненная гарантия.',
            'en' => 'We use only quality Austrian hardware: Blum LEGRABOX, AVENTOS, Hettich. Lifetime warranty.',
            'fi' => 'Käytämme vain laadukkaita itävaltalaisia heloituksia: Blum LEGRABOX, AVENTOS, Hettich. Elinikäinen takuu.',
        ),
        'koogid' => array(
            'ru' => 'Посмотрите наши выполненные проекты кухонь. Более 500 реализованных кухонь в Таллинне и Эстонии.',
            'en' => 'View our completed kitchen projects. Over 500 kitchens installed in Tallinn and Estonia.',
            'fi' => 'Katso valmiita keittiöprojektejamme. Yli 500 toteutettua keittiötä Tallinnassa ja Virossa.',
        ),
        'toopinnad' => array(
            'ru' => 'Качественные кухонные столешницы: натуральный камень, искусственный камень, ламинат, HPL компакт-ламинат.',
            'en' => 'Quality kitchen countertops: natural stone, engineered stone, laminate, HPL compact laminate.',
            'fi' => 'Laadukkaat keittiötasot: luonnonkivi, tekokivi, laminaatti, HPL-kompaktilaminaatti.',
        ),
    );
}

// === ХЕЛПЕРЫ ===

function sk5_get_lang() {
    $uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '';
    if (preg_match('#^/(ru|en|fi)(/|$)#', $uri, $m)) {
        return $m[1];
    }
    return 'et';
}

function sk5_get_page() {
    $uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '';
    $path = preg_replace('#^/(ru|en|fi)#', '', $uri);
    $path = trim($path, '/');
    if (empty($path)) return '';
    $parts = explode('/', $path);
    return $parts[0];
}

function sk5_get_translated_title() {
    $lang = sk5_get_lang();
    if ($lang === 'et') return null;
    $page = sk5_get_page();
    $titles = sk5_get_titles();
    if (isset($titles[$page][$lang])) {
        return $titles[$page][$lang];
    }
    return null;
}

function sk5_get_translated_description() {
    $lang = sk5_get_lang();
    if ($lang === 'et') return null;
    $page = sk5_get_page();
    $descs = sk5_get_descriptions();
    if (isset($descs[$page][$lang])) {
        return $descs[$page][$lang];
    }
    return null;
}

// === TITLE ===

add_filter('pre_get_document_title', 'sk5_filter_title', 999999);
add_filter('wpseo_title', 'sk5_filter_title', 999999);
add_filter('wpseo_opengraph_title', 'sk5_filter_title', 999999);

function sk5_filter_title($title) {
    $new_title = sk5_get_translated_title();
    if ($new_title !== null) {
        return $new_title;
    }
    return $title;
}

// === DESCRIPTION ===

add_filter('wpseo_metadesc', 'sk5_filter_description', 999999);
add_filter('wpseo_opengraph_desc', 'sk5_filter_description', 999999);

function sk5_filter_description($desc) {
    $new_desc = sk5_get_translated_description();
    if ($new_desc !== null) {
        return $new_desc;
    }
    return $desc;
}
