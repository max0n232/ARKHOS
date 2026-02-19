<?php
/**
 * Snippet Name: Auto SEO Translations (Yoast Override)
 * Description: Автоматически подставляет переведённые title/meta для всех языков
 * Version: 2.0
 *
 * ЗАМЕНЯЕТ snippet 03 — этот работает с Yoast напрямую
 *
 * Scope: "Only run on site front-end"
 */

// Переводы SEO мета
function studiokook_seo_translations() {
    return [
        // === ГЛАВНАЯ ===
        '' => [ // пустой path = главная
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

        // === КУХНИ НА ЗАКАЗ ===
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

        // === КОНТАКТЫ ===
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

        // === РАСЧЁТ СТОИМОСТИ ===
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

        // === МАТЕРИАЛЫ ===
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

        // === ФУРНИТУРА ===
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
        ],

        // === ПОРТФОЛИО ===
        'koogid' => [
            'et' => [
                'title' => 'Köögid | Valmis projektid | Studioköök',
                'description' => 'Vaadake meie tehtud köögiprojekte. Üle 500 teostatud köögi Tallinnas ja Eestis.'
            ],
            'ru' => [
                'title' => 'Портфолио кухонь | Studioköök',
                'description' => 'Посмотрите наши выполненные проекты кухонь. Более 500 реализованных кухонь в Таллинне и Эстонии.'
            ],
            'en' => [
                'title' => 'Kitchen Portfolio | Studioköök',
                'description' => 'View our completed kitchen projects. Over 500 kitchens installed in Tallinn and Estonia.'
            ],
            'fi' => [
                'title' => 'Keittiöportfolio | Studioköök',
                'description' => 'Katso valmiita keittiöprojektejamme. Yli 500 toteutettua keittiötä Tallinnassa ja Virossa.'
            ]
        ],

        // === СТОЛЕШНИЦЫ ===
        'toopinnad' => [
            'et' => [
                'title' => 'Töötasapinnad | Kivi, laminaat, HPL | Studioköök',
                'description' => 'Kvaliteetsed köögitöötasapinnad: looduslik kivi, tehiskivi, laminaat, HPL kompaktlaminaat.'
            ],
            'ru' => [
                'title' => 'Столешницы для кухни | Studioköök',
                'description' => 'Качественные кухонные столешницы: натуральный камень, искусственный камень, ламинат, HPL компакт-ламинат.'
            ],
            'en' => [
                'title' => 'Kitchen Countertops | Studioköök',
                'description' => 'Quality kitchen countertops: natural stone, engineered stone, laminate, HPL compact laminate.'
            ],
            'fi' => [
                'title' => 'Keittiötasot | Studioköök',
                'description' => 'Laadukkaat keittiötasot: luonnonkivi, tekokivi, laminaatti, HPL-kompaktilaminaatti.'
            ]
        ],

        // === ФАСАДЫ ===
        'fassaadid' => [
            'et' => [
                'title' => 'Fassaadid | Köögifassaadid | Studioköök',
                'description' => 'Kvaliteetsed köögifassaadid: EGGER laminaat, Fenix NTM, MDF matt ja läikiv. Lai värvivalik.'
            ],
            'ru' => [
                'title' => 'Фасады для кухни | Studioköök',
                'description' => 'Качественные кухонные фасады: ламинат EGGER, Fenix NTM, МДФ матовый и глянцевый. Широкий выбор цветов.'
            ],
            'en' => [
                'title' => 'Kitchen Facades | Studioköök',
                'description' => 'Quality kitchen facades: EGGER laminate, Fenix NTM, MDF matte and gloss. Wide color selection.'
            ],
            'fi' => [
                'title' => 'Keittiön julkisivut | Studioköök',
                'description' => 'Laadukkaat keittiön julkisivut: EGGER-laminaatti, Fenix NTM, MDF matta ja kiiltävä. Laaja värivalikoima.'
            ]
        ],

        // === ЯЩИКИ ===
        'sahtlid' => [
            'et' => [
                'title' => 'Sahtlid | Blum sahtlisüsteemid | Studioköök',
                'description' => 'Blum LEGRABOX ja TANDEMBOX sahtlisüsteemid. Vaikne sulgumine, täisväljavedu, eluaegne garantii.'
            ],
            'ru' => [
                'title' => 'Выдвижные ящики Blum | Studioköök',
                'description' => 'Системы ящиков Blum LEGRABOX и TANDEMBOX. Тихое закрывание, полное выдвижение, пожизненная гарантия.'
            ],
            'en' => [
                'title' => 'Blum Drawer Systems | Studioköök',
                'description' => 'Blum LEGRABOX and TANDEMBOX drawer systems. Soft close, full extension, lifetime warranty.'
            ],
            'fi' => [
                'title' => 'Blum-laatikot | Studioköök',
                'description' => 'Blum LEGRABOX ja TANDEMBOX -laatikkojärjestelmät. Hiljainen sulkeminen, täysi ulosotto, elinikäinen takuu.'
            ]
        ],

        // === ПОДЪЁМНЫЕ МЕХАНИЗМЫ ===
        'tostemehhanismid' => [
            'et' => [
                'title' => 'Tõstemehhanismid | Blum AVENTOS | Studioköök',
                'description' => 'Blum AVENTOS tõstemehhanismid ülemistele kappidele. Kerge avamine, vaikne sulgumine.'
            ],
            'ru' => [
                'title' => 'Подъёмные механизмы Blum AVENTOS | Studioköök',
                'description' => 'Подъёмные механизмы Blum AVENTOS для верхних шкафов. Лёгкое открывание, тихое закрывание.'
            ],
            'en' => [
                'title' => 'Blum AVENTOS Lift Systems | Studioköök',
                'description' => 'Blum AVENTOS lift systems for wall cabinets. Easy opening, soft close.'
            ],
            'fi' => [
                'title' => 'Blum AVENTOS -nostomekanismit | Studioköök',
                'description' => 'Blum AVENTOS -nostomekanismit yläkaapeille. Helppo avaaminen, hiljainen sulkeminen.'
            ]
        ],

        // === УГЛОВЫЕ МЕХАНИЗМЫ ===
        'nurgamehhanismid' => [
            'et' => [
                'title' => 'Nurgamehhanismid | Nurga lahendused | Studioköök',
                'description' => 'Nutikad nurga lahendused köögile: karusellid, LeMans süsteemid, väljaveetavad riiulid.'
            ],
            'ru' => [
                'title' => 'Угловые механизмы для кухни | Studioköök',
                'description' => 'Умные угловые решения для кухни: карусели, системы LeMans, выдвижные полки.'
            ],
            'en' => [
                'title' => 'Corner Solutions for Kitchen | Studioköök',
                'description' => 'Smart corner solutions for kitchen: carousels, LeMans systems, pull-out shelves.'
            ],
            'fi' => [
                'title' => 'Kulmamekanismit keittiöön | Studioköök',
                'description' => 'Älykkäät kulmaratkaisut keittiöön: karusellit, LeMans-järjestelmät, ulosvedettävät hyllyt.'
            ]
        ],

        // === СИСТЕМЫ ХРАНЕНИЯ ===
        'ladustamissusteemid' => [
            'et' => [
                'title' => 'Ladustamissüsteemid | Köögi hoiustamine | Studioköök',
                'description' => 'Köögimööbli ladustamissüsteemid: relvastikud, sahtliorganisaatorid, kõrgkapid.'
            ],
            'ru' => [
                'title' => 'Системы хранения для кухни | Studioköök',
                'description' => 'Системы хранения для кухни: рейлинги, органайзеры для ящиков, высокие шкафы.'
            ],
            'en' => [
                'title' => 'Kitchen Storage Systems | Studioköök',
                'description' => 'Kitchen storage systems: rails, drawer organizers, tall cabinets.'
            ],
            'fi' => [
                'title' => 'Keittiön säilytysjärjestelmät | Studioköök',
                'description' => 'Keittiön säilytysjärjestelmät: kiskot, laatikko-organisaattorit, korkeat kaapit.'
            ]
        ],

        // === БЛОГ ===
        'blogi' => [
            'et' => [
                'title' => 'Blogi | Köögidisaini nõuanded | Studioköök',
                'description' => 'Artiklid köögidisaini, materjalide ja trendide kohta. Nõuanded köögi planeerimiseks.'
            ],
            'ru' => [
                'title' => 'Блог | Советы по дизайну кухни | Studioköök',
                'description' => 'Статьи о дизайне кухни, материалах и трендах. Советы по планировке кухни.'
            ],
            'en' => [
                'title' => 'Blog | Kitchen Design Tips | Studioköök',
                'description' => 'Articles about kitchen design, materials and trends. Tips for kitchen planning.'
            ],
            'fi' => [
                'title' => 'Blogi | Keittiösuunnitteluvinkit | Studioköök',
                'description' => 'Artikkelit keittiösuunnittelusta, materiaaleista ja trendeistä. Vinkkejä keittiön suunnitteluun.'
            ]
        ],

        // === ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ ===
        'privacy' => [
            'et' => [
                'title' => 'Privaatsuspoliitika | Studioköök',
                'description' => 'Studiokook OÜ privaatsuspoliitika ja isikuandmete töötlemise tingimused.'
            ],
            'ru' => [
                'title' => 'Политика конфиденциальности | Studioköök',
                'description' => 'Политика конфиденциальности Studiokook OÜ и условия обработки персональных данных.'
            ],
            'en' => [
                'title' => 'Privacy Policy | Studioköök',
                'description' => 'Studiokook OÜ privacy policy and personal data processing terms.'
            ],
            'fi' => [
                'title' => 'Tietosuojakäytäntö | Studioköök',
                'description' => 'Studiokook OÜ:n tietosuojakäytäntö ja henkilötietojen käsittelyehdot.'
            ]
        ]
    ];
}

// Определяем язык из URL
function studiokook_get_lang() {
    $uri = $_SERVER['REQUEST_URI'];
    if (preg_match('#^/(ru|en|fi)(/|$)#', $uri, $m)) {
        return $m[1];
    }
    return 'et';
}

// Определяем страницу из URL
function studiokook_get_page_key() {
    $uri = $_SERVER['REQUEST_URI'];
    // Убираем язык
    $uri = preg_replace('#^/(ru|en|fi)#', '', $uri);
    $uri = trim($uri, '/');

    // Если пусто — главная
    if (empty($uri)) return '';

    // Берём первый сегмент (основная страница)
    $segments = explode('/', $uri);
    return $segments[0];
}

// === TITLE ===
// Перехватываем на самом раннем этапе
add_filter('pre_get_document_title', 'studiokook_force_title', 1);
add_filter('wpseo_title', 'studiokook_force_title', 1);
add_filter('wpseo_opengraph_title', 'studiokook_force_title', 1);

function studiokook_force_title($title) {
    $translations = studiokook_seo_translations();
    $lang = studiokook_get_lang();
    $page = studiokook_get_page_key();

    if (isset($translations[$page][$lang]['title'])) {
        return $translations[$page][$lang]['title'];
    }
    return $title;
}

// === META DESCRIPTION ===
add_filter('wpseo_metadesc', 'studiokook_force_description', 1);
add_filter('wpseo_opengraph_desc', 'studiokook_force_description', 1);

function studiokook_force_description($desc) {
    $translations = studiokook_seo_translations();
    $lang = studiokook_get_lang();
    $page = studiokook_get_page_key();

    if (isset($translations[$page][$lang]['description'])) {
        return $translations[$page][$lang]['description'];
    }
    return $desc;
}

// === FALLBACK: Если Yoast не сработал, добавляем напрямую ===
add_action('wp_head', 'studiokook_fallback_meta', 1);

function studiokook_fallback_meta() {
    // Проверяем, добавил ли Yoast правильный title
    $translations = studiokook_seo_translations();
    $lang = studiokook_get_lang();
    $page = studiokook_get_page_key();

    if (!isset($translations[$page][$lang])) {
        return;
    }

    // Добавляем мета-тег description на случай если Yoast пропустил
    $desc = $translations[$page][$lang]['description'];
    echo '<!-- Studiokook SEO Fallback -->' . "\n";

    // JavaScript для принудительной замены title
    $title = esc_js($translations[$page][$lang]['title']);
    echo "<script>document.title = '{$title}';</script>\n";
}
