<?php
/**
 * Snippet Name: HowTo Schema - Kuidas tellida kööki
 * Description: Structured data for "How to order a kitchen: 10 steps" page. Hardcoded 10-step process with multi-language support (ET/RU/EN/FI).
 * Version: 1.0
 *
 * ИНСТРУКЦИЯ:
 * 1. WP Admin → Code Snippets → Add New
 * 2. Название: "HowTo Schema - Kuidas tellida kööki"
 * 3. Scope: "Only run on site front-end"
 *
 * ПРИМЕНЯЕТСЯ НА:
 * - ET: 'kuidas-tellida' (How to order kitchen)
 * - RU: 'kak-zakazat' (Как заказать)
 * - EN: 'how-to-order' (How to order)
 * - FI: Найдется по содержимому (по структуре)
 *
 * СОДЕРЖИМОЕ: 10 шагов заказа кухни с временем производства и стоимостью
 */

add_action('wp_head', 'studiokook_howto_schema', 5);

function studiokook_howto_schema() {
    global $post;

    if (!is_singular(['page', 'post'])) {
        return;
    }

    if (!$post) {
        return;
    }

    // Определяем язык страницы
    $lang = get_page_language();

    // Проверяем, это ли нужная нам страница (по slug)
    $page_slugs = ['kuidas-tellida', 'kak-zakazat', 'how-to-order'];
    if (!in_array($post->post_name, $page_slugs)) {
        return;
    }

    // Определяем названия и описания по языкам
    $titles = [
        'et' => 'Kuidas tellida kööki: 10 sammu',
        'ru' => 'Как заказать кухню: 10 шагов',
        'en' => 'How to order a kitchen: 10 steps',
        'fi' => 'Kuinka tilata keittiö: 10 vaihetta'
    ];

    $descriptions = [
        'et' => 'Detailne juhend Studioköögist köögimööbli tellimisest. Tasuta konsultatsioon, mõõtmine, 3D-projekteerimine, paigaldamine ja 2-aastane garantii.',
        'ru' => 'Подробное руководство по заказу кухонной мебели от Studioköök. Бесплатная консультация, замеры, 3D-проектирование, монтаж и 2-летняя гарантия.',
        'en' => 'Step-by-step guide to ordering custom kitchen furniture from Studioköök. Free consultation, measurements, 3D design, installation and 2-year warranty.',
        'fi' => 'Vaiheittainen opas Studioköögin mittatilauskeittökalusteiden tilaamiseen. Ilmainen konsultaatio, mittaukset, 3D-suunnittelu, asennus ja 2 vuoden takuu.'
    ];

    // 10 шагов заказа кухни (многоязычные данные)
    $steps = [
        [
            'et' => ['title' => 'Tasuta konsultatsioon', 'desc' => 'Konsulteerime koos planeerimise ja eelarve määramisega'],
            'ru' => ['title' => 'Бесплатная консультация', 'desc' => 'Консультация по планированию и определению бюджета'],
            'en' => ['title' => 'Free consultation', 'desc' => 'Consultation on planning and budget determination'],
            'fi' => ['title' => 'Ilmainen konsultaatio', 'desc' => 'Konsultaatio suunnittelusta ja budjetista']
        ],
        [
            'et' => ['title' => 'Köögimõõtmine', 'desc' => 'Teeme täpsed mõõtmised teie köögis'],
            'ru' => ['title' => 'Измерение кухни', 'desc' => 'Производим точные замеры вашей кухни'],
            'en' => ['title' => 'Kitchen measurement', 'desc' => 'We take precise measurements of your kitchen'],
            'fi' => ['title' => 'Keittiön mittaus', 'desc' => 'Suoritamme tarkat mittaukset keittiössäsi']
        ],
        [
            'et' => ['title' => '3D-projekti loomine', 'desc' => 'Loome detailse 3D-visualiseerimise teie köögist'],
            'ru' => ['title' => '3D-проектирование', 'desc' => 'Создаем детальную 3D-визуализацию вашей кухни'],
            'en' => ['title' => '3D project creation', 'desc' => 'We create a detailed 3D visualization of your kitchen'],
            'fi' => ['title' => '3D-projektin luominen', 'desc' => 'Luomme yksityiskohtaisen 3D-visualisoinnin keittiöstäsi']
        ],
        [
            'et' => ['title' => 'Materjalide valik', 'desc' => 'Valite soovitud materjalid, värvid ja stiil'],
            'ru' => ['title' => 'Выбор материалов', 'desc' => 'Выбираете желаемые материалы, цвета и стиль'],
            'en' => ['title' => 'Material selection', 'desc' => 'You choose the desired materials, colors and style'],
            'fi' => ['title' => 'Materiaalien valinta', 'desc' => 'Valitset halutut materiaalit, värit ja tyylin']
        ],
        [
            'et' => ['title' => 'Lepingu sõlmimine ja ettemaks 50%', 'desc' => 'Allkirjastame lepingu ja võtame vastu 50% ettemaksu'],
            'ru' => ['title' => 'Подписание контракта и 50% предоплата', 'desc' => 'Подписываем контракт и принимаем 50% предоплату'],
            'en' => ['title' => 'Contract & 50% prepayment', 'desc' => 'We sign the contract and receive 50% prepayment'],
            'fi' => ['title' => 'Sopimuksen allekirjoittaminen ja 50% ennakkomaksu', 'desc' => 'Allekirjoitamme sopimuksen ja vastaanomme 50% ennakkomaksun']
        ],
        [
            'et' => ['title' => 'Tootmine 6-8 nädalat', 'desc' => 'Toodame teie kööki Austria fuurnituuriga'],
            'ru' => ['title' => 'Производство 6-8 недель', 'desc' => 'Производим вашу кухню с австрийской фурнитурой'],
            'en' => ['title' => 'Production 6-8 weeks', 'desc' => 'We manufacture your kitchen with Austrian hardware'],
            'fi' => ['title' => 'Tuotanto 6-8 viikkoa', 'desc' => 'Valmistamme keittiösi itävaltalaisella kalustuksella']
        ],
        [
            'et' => ['title' => 'Vahemõõtmine', 'desc' => 'Teeme järelkontrolli mõõtmised enne paigaldamist'],
            'ru' => ['title' => 'Промежуточные измерения', 'desc' => 'Проводим контрольные измерения перед установкой'],
            'en' => ['title' => 'Intermediate measurement', 'desc' => 'We conduct control measurements before installation'],
            'fi' => ['title' => 'Väliaikainen mittaus', 'desc' => 'Suoritamme valvontamittaukset ennen asennusta']
        ],
        [
            'et' => ['title' => 'Paigaldamine', 'desc' => 'Professionaalse meeskonna poolt paigaldatakse teie köök'],
            'ru' => ['title' => 'Установка', 'desc' => 'Профессиональная бригада устанавливает вашу кухню'],
            'en' => ['title' => 'Installation', 'desc' => 'Professional team installs your kitchen'],
            'fi' => ['title' => 'Asennus', 'desc' => 'Ammattilainen tiimi asentaa keittiösi']
        ],
        [
            'et' => ['title' => 'Lõppkontroll ja üleandmine', 'desc' => 'Teeme viimase kontrolli ja käskide üleandmise'],
            'ru' => ['title' => 'Финальная проверка и передача', 'desc' => 'Проводим финальную проверку и передачу'],
            'en' => ['title' => 'Final inspection & handover', 'desc' => 'We conduct final inspection and handover'],
            'fi' => ['title' => 'Lopputarkastus ja luovutus', 'desc' => 'Suoritamme loppukatselmuksen ja luovutuksen']
        ],
        [
            'et' => ['title' => 'Garantii 2 aastat', 'desc' => 'Tootele kehtib 2-aastane garantii ja tugi'],
            'ru' => ['title' => 'Гарантия 2 года', 'desc' => 'На изделие распространяется 2-летняя гарантия'],
            'en' => ['title' => '2-year warranty', 'desc' => 'The product has a 2-year warranty and support'],
            'fi' => ['title' => '2 vuoden takuu', 'desc' => 'Tuotteella on 2 vuoden takuu ja tuki']
        ]
    ];

    // Определяем текущий язык
    if (!isset($steps[0][$lang])) {
        $lang = 'et';
    }

    // Форматируем шаги для schema.org
    $step_items = [];
    foreach ($steps as $index => $step_data) {
        $step_info = $step_data[$lang];

        $step_items[] = [
            '@type' => 'HowToStep',
            'position' => (int)($index + 1),
            'name' => $step_info['title'],
            'text' => $step_info['desc']
        ];
    }

    // Формируем HowTo schema
    $schema = [
        '@context' => 'https://schema.org',
        '@type' => 'HowTo',
        'name' => $titles[$lang] ?? $titles['et'],
        'description' => $descriptions[$lang] ?? $descriptions['et'],
        'step' => $step_items,
        'totalTime' => 'PT56D', // 8 weeks = 56 days
        'estimatedCost' => [
            '@type' => 'PriceSpecification',
            'priceCurrency' => 'EUR',
            'price' => '3000-25000'
        ],
        'tool' => [
            '@type' => 'Thing',
            'name' => 'Studioköök Kitchen Design & Installation Service'
        ]
    ];

    echo '<script type="application/ld+json">' . "\n";
    echo json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    echo "\n</script>\n";
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
