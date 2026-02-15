/**
 * Snippet Name: SEO Meta Translations v5
 * Description: Title + description + OG for RU/EN/FI via filters + output buffering
 * Version: 5.4
 * Scope: "Only run on site front-end"
 *
 * v5.4 changes:
 * - Translate Yoast FAQ schema (FAQPage) via output buffering
 * - Translate BreadcrumbList "Avaleht" via snippet 220
 *
 * v5.3 changes:
 * - Added FurnitureStore JSON-LD description replacement via output buffering
 *
 * v5.2 changes:
 * - Added output buffering to fix meta desc + OG tags (Yoast filters don't work for homepage)
 * - Added missing pages: hpl-tootasapinnad, laminaadist-tootasapinnad, kividest-tootasapinnad, egger-fassaadid, fenix
 * - Optimized title tags with keywords + geolocation per SEO audit recommendations
 */

// === DATA ===

function sk5_get_titles() {
    return array(
        '' => array(
            'ru' => 'Кухни на заказ в Таллинне | Кухонная мебель от €2500 | Studioköök',
            'en' => 'Custom Kitchen Furniture in Tallinn | Made in Estonia | Studioköök',
            'fi' => 'Mittatilauskeittöt Tallinnassa | Keittiökalusteet | Studioköök',
        ),
        'koogid-eritellimusel' => array(
            'ru' => 'Кухни на заказ в Таллинне | Индивидуальный дизайн | Studioköök',
            'en' => 'Bespoke Kitchens in Tallinn | Custom Design | Studioköök',
            'fi' => 'Mittatilauskeittöt Tallinnassa | Yksilöllinen suunnittelu | Studioköök',
        ),
        'kontakt' => array(
            'ru' => 'Контакты | Шоурум кухонь Таллинн | Studioköök',
            'en' => 'Contact Studioköök | Kitchen Showroom Tallinn | +372 55 525 143',
            'fi' => 'Yhteystiedot | Keittiöesittely Tallinna | Studioköök',
        ),
        'hinnaparing' => array(
            'ru' => 'Расчёт стоимости кухни | Бесплатный 3D-проект | Studioköök',
            'en' => 'Kitchen Price Quote | Free 3D Design | Studioköök',
            'fi' => 'Keittiön hintalaskuri | Ilmainen 3D-suunnittelu | Studioköök',
        ),
        'materjalid' => array(
            'ru' => 'Материалы для кухонь | EGGER, Blum, Hettich | Studioköök',
            'en' => 'Kitchen Materials | EGGER, Blum, Hettich | Studioköök',
            'fi' => 'Keittiömateriaalit | EGGER, Blum, Hettich | Studioköök',
        ),
        'meie-furnituur' => array(
            'ru' => 'Фурнитура BLUM и Hettich | Австрийское качество | Studioköök',
            'en' => 'BLUM Premium Kitchen Fittings | Austrian Quality | Studioköök',
            'fi' => 'BLUM-helat ja Hettich | Itävaltalainen laatu | Studioköök',
        ),
        'koogid' => array(
            'ru' => 'Портфолио кухонь | 500+ проектов | Studioköök Таллинн',
            'en' => 'Kitchen Portfolio | 500+ Projects | Studioköök Tallinn',
            'fi' => 'Keittiöportfolio | 500+ projektia | Studioköök Tallinna',
        ),
        'toopinnad' => array(
            'ru' => 'Столешницы для кухни | Камень, HPL, ламинат | Studioköök',
            'en' => 'Kitchen Countertops | Stone, HPL, Laminate | Studioköök Tallinn',
            'fi' => 'Keittiötasot | Kivi, HPL, laminaatti | Studioköök',
        ),
        'fassaadid' => array(
            'ru' => 'Кухонные фасады | EGGER, Fenix NTM, МДФ | Studioköök',
            'en' => 'Kitchen Facades | EGGER, Fenix NTM, MDF | Studioköök',
            'fi' => 'Keittiön ovet | EGGER, Fenix NTM, MDF | Studioköök',
        ),
        'valmistamine' => array(
            'ru' => 'Производство кухонь в Эстонии | Studioköök',
            'en' => 'Kitchen Manufacturing in Estonia | Studioköök',
            'fi' => 'Keittiövalmistus Virossa | Studioköök',
        ),
        'sahtlid' => array(
            'ru' => 'Выдвижные ящики Blum LEGRABOX | Studioköök',
            'en' => 'Blum LEGRABOX Drawer Systems | Studioköök',
            'fi' => 'Blum LEGRABOX -laatikot | Studioköök',
        ),
        'tostemehhanismid' => array(
            'ru' => 'Подъёмные механизмы Blum AVENTOS | Studioköök',
            'en' => 'Blum AVENTOS Lift Systems | Studioköök',
            'fi' => 'Blum AVENTOS -nostomekanismit | Studioköök',
        ),
        'nurgamehhanismid' => array(
            'ru' => 'Угловые механизмы для кухни | Studioköök',
            'en' => 'Corner Solutions for Kitchen | Studioköök',
            'fi' => 'Kulmamekanismit keittiöön | Studioköök',
        ),
        'ladustamissusteemid' => array(
            'ru' => 'Системы хранения для кухни | Studioköök',
            'en' => 'Kitchen Storage Systems | Studioköök',
            'fi' => 'Keittiön säilytysjärjestelmät | Studioköök',
        ),
        'blogi' => array(
            'ru' => 'Блог | Дизайн кухни 2026 | Studioköök',
            'en' => 'Blog | Kitchen Design Tips 2026 | Studioköök',
            'fi' => 'Blogi | Keittiösuunnitteluvinkit 2026 | Studioköök',
        ),
        'privacy' => array(
            'ru' => 'Политика конфиденциальности | Studioköök',
            'en' => 'Privacy Policy | Studioköök',
            'fi' => 'Tietosuojakäytäntö | Studioköök',
        ),
        'hpl-tootasapinnad' => array(
            'ru' => 'HPL столешницы | Egger и Fundermax | Studioköök',
            'en' => 'HPL Compact Laminate Countertops | Studioköök Tallinn',
            'fi' => 'HPL-kompaktilaminaattitasot | Studioköök',
        ),
        'laminaadist-tootasapinnad' => array(
            'ru' => 'Ламинатные столешницы для кухни | Studioköök',
            'en' => 'Laminate Kitchen Countertops | Studioköök Tallinn',
            'fi' => 'Laminaattitasot keittiöön | Studioköök',
        ),
        'kividest-tootasapinnad' => array(
            'ru' => 'Каменные столешницы | Technistone, кварц | Studioköök',
            'en' => 'Stone Countertops | Technistone, Quartz | Studioköök',
            'fi' => 'Kivitasot | Technistone, kvartsi | Studioköök',
        ),
        'egger-fassaadid' => array(
            'ru' => 'Фасады EGGER для кухни | Ламинат | Studioköök',
            'en' => 'EGGER Kitchen Facades | Laminate Doors | Studioköök',
            'fi' => 'EGGER-keittiön ovet | Laminaatti | Studioköök',
        ),
        'fenix' => array(
            'ru' => 'Фасады Fenix NTM | Нанотехнология | Studioköök',
            'en' => 'Fenix NTM Kitchen Facades | Nanotechnology | Studioköök',
            'fi' => 'Fenix NTM -keittiön ovet | Nanoteknologia | Studioköök',
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
            'ru' => 'Свяжитесь с нами: Paldiski mnt 21, Таллинн. Тел: +372 55 525 143. Пн-Пт 9:00-16:30. Бесплатная консультация.',
            'en' => 'Contact us: Paldiski mnt 21, Tallinn. Phone: +372 55 525 143. Mon-Fri 9:00-16:30. Free consultation.',
            'fi' => 'Ota yhteyttä: Paldiski mnt 21, Tallinna. Puh: +372 55 525 143. Ma-Pe 9:00-16:30. Ilmainen konsultaatio.',
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
            'ru' => 'Кухонные столешницы: натуральный камень, Technistone, HPL компакт-ламинат, ламинат. Доставка по Эстонии.',
            'en' => 'Kitchen countertops: natural stone, Technistone, HPL compact laminate, laminate. Delivery across Estonia.',
            'fi' => 'Keittiötasot: luonnonkivi, Technistone, HPL-kompaktilaminaatti, laminaatti. Toimitus koko Viroon.',
        ),
        'fassaadid' => array(
            'ru' => 'Качественные кухонные фасады: ламинат EGGER, Fenix NTM, МДФ матовый и глянцевый. Широкий выбор цветов.',
            'en' => 'Quality kitchen facades: EGGER laminate, Fenix NTM, MDF matte and gloss. Wide color selection.',
            'fi' => 'Laadukkaat keittiön julkisivut: EGGER-laminaatti, Fenix NTM, MDF matta ja kiiltävä. Laaja värivalikoima.',
        ),
        'valmistamine' => array(
            'ru' => 'Собственное производство кухонной мебели в Эстонии. Контроль качества на каждом этапе. Срок 4-6 недель.',
            'en' => 'In-house kitchen furniture production in Estonia. Quality control at every stage. Lead time 4-6 weeks.',
            'fi' => 'Oma keittiökalusteiden valmistus Virossa. Laadunvalvonta jokaisessa vaiheessa. Toimitusaika 4-6 viikkoa.',
        ),
        'sahtlid' => array(
            'ru' => 'Системы ящиков Blum LEGRABOX и TANDEMBOX. Тихое закрывание, полное выдвижение, пожизненная гарантия.',
            'en' => 'Blum LEGRABOX and TANDEMBOX drawer systems. Soft close, full extension, lifetime warranty.',
            'fi' => 'Blum LEGRABOX ja TANDEMBOX -laatikkojärjestelmät. Hiljainen sulkeminen, täysi ulosotto, elinikäinen takuu.',
        ),
        'tostemehhanismid' => array(
            'ru' => 'Подъёмные механизмы Blum AVENTOS для верхних шкафов. Лёгкое открывание, тихое закрывание.',
            'en' => 'Blum AVENTOS lift systems for wall cabinets. Easy opening, soft close.',
            'fi' => 'Blum AVENTOS -nostomekanismit yläkaapeille. Helppo avaaminen, hiljainen sulkeminen.',
        ),
        'nurgamehhanismid' => array(
            'ru' => 'Умные угловые решения для кухни: карусели, системы LeMans, выдвижные полки.',
            'en' => 'Smart corner solutions for kitchen: carousels, LeMans systems, pull-out shelves.',
            'fi' => 'Älykkäät kulmaratkaisut keittiöön: karusellit, LeMans-järjestelmät, ulosvedettävät hyllyt.',
        ),
        'ladustamissusteemid' => array(
            'ru' => 'Системы хранения для кухни: рейлинги, органайзеры для ящиков, высокие шкафы.',
            'en' => 'Kitchen storage systems: rails, drawer organizers, tall cabinets.',
            'fi' => 'Keittiön säilytysjärjestelmät: kiskot, laatikko-organisaattorit, korkeat kaapit.',
        ),
        'blogi' => array(
            'ru' => 'Статьи о дизайне кухни, материалах и трендах 2026. Советы по планировке кухни.',
            'en' => 'Articles about kitchen design, materials and trends 2026. Tips for kitchen planning.',
            'fi' => 'Artikkelit keittiösuunnittelusta, materiaaleista ja trendeistä 2026. Vinkkejä keittiön suunnitteluun.',
        ),
        'privacy' => array(
            'ru' => 'Политика конфиденциальности Studiokook OÜ и условия обработки персональных данных.',
            'en' => 'Studiokook OÜ privacy policy and personal data processing terms.',
            'fi' => 'Studiokook OÜ:n tietosuojakäytäntö ja henkilötietojen käsittelyehdot.',
        ),
        'hpl-tootasapinnad' => array(
            'ru' => 'HPL компакт-ламинат столешницы от Egger и Fundermax. Водостойкие, устойчивые к царапинам. Толщина 12 мм.',
            'en' => 'HPL compact laminate countertops by Egger and Fundermax. Waterproof, scratch-resistant. 12mm thickness.',
            'fi' => 'HPL-kompaktilaminaattitasot Eggeriltä ja Fundermaxilta. Vedenpitävä, naarmuuntumaton. 12 mm paksuus.',
        ),
        'laminaadist-tootasapinnad' => array(
            'ru' => 'Ламинатные столешницы для кухни. Доступные цены, широкий выбор декоров EGGER. Толщина 38 мм.',
            'en' => 'Laminate kitchen countertops. Affordable prices, wide range of EGGER decors. 38mm thickness.',
            'fi' => 'Laminaattitasot keittiöön. Edulliset hinnat, laaja valikoima EGGER-kuvioita. 38 mm paksuus.',
        ),
        'kividest-tootasapinnad' => array(
            'ru' => 'Каменные столешницы: Technistone, кварц, гранит. Премиальное качество для вашей кухни.',
            'en' => 'Stone countertops: Technistone, quartz, granite. Premium quality for your kitchen.',
            'fi' => 'Kivitasot: Technistone, kvartsi, graniitti. Premium-laatu keittiöösi.',
        ),
        'egger-fassaadid' => array(
            'ru' => 'Кухонные фасады EGGER: ламинат высокого давления, 200+ декоров. Прочные и влагостойкие.',
            'en' => 'EGGER kitchen facades: high-pressure laminate, 200+ decors. Durable and moisture-resistant.',
            'fi' => 'EGGER-keittiön ovet: korkeapainelaminaatti, 200+ kuviota. Kestävä ja kosteudenkestävä.',
        ),
        'fenix' => array(
            'ru' => 'Фасады Fenix NTM: нанотехнология, матовая поверхность, антиотпечатки. Восстанавливаемые микроцарапины.',
            'en' => 'Fenix NTM facades: nanotechnology, matte surface, anti-fingerprint. Self-healing micro-scratches.',
            'fi' => 'Fenix NTM -ovet: nanoteknologia, mattapinta, sormenjälkiä hylkivä. Itsestään korjautuvat mikronaarmut.',
        ),
    );
}

// === HELPERS ===

function sk5_get_lang() {
    $uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '';
    if (preg_match('#^/(ru|en|fi)(\/|$)#', $uri, $m)) {
        return $m[1];
    }
    return 'et';
}

function sk5_get_page() {
    $uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '';
    $uri = strtok($uri, '?');
    $path = preg_replace('#^/(ru|en|fi)#', '', $uri);
    $path = trim($path, '/');
    if (empty($path)) return '';
    $parts = explode('/', $path);
    return end($parts);
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

// === TITLE (via Yoast filters - these work) ===

add_filter('pre_get_document_title', 'sk5_filter_title', 999999);
add_filter('wpseo_title', 'sk5_filter_title', 999999);

function sk5_filter_title($title) {
    $new_title = sk5_get_translated_title();
    if ($new_title !== null) {
        return $new_title;
    }
    return $title;
}

// === OUTPUT BUFFERING for meta desc + OG tags ===
// Yoast filters wpseo_metadesc/wpseo_opengraph_* don't work for homepage
// because Yoast reads from Settings, not post meta. Use OB to fix final HTML.

add_action('template_redirect', 'sk5_ob_start', 2);

function sk5_ob_start() {
    if (is_admin() || defined('REST_REQUEST')) return;
    $lang = sk5_get_lang();
    if ($lang === 'et') return;
    ob_start('sk5_ob_replace_meta');
}

function sk5_ob_replace_meta($html) {
    $lang = sk5_get_lang();
    $new_desc = sk5_get_translated_description();
    $new_title = sk5_get_translated_title();

    if ($new_desc !== null) {
        $escaped = esc_attr($new_desc);
        $html = preg_replace(
            '/<meta\s+name=["\']description["\']\s+content=["\'][^"\']*["\']\s*\/?>/i',
            '<meta name="description" content="' . $escaped . '" />',
            $html, 1
        );
        $html = preg_replace(
            '/<meta\s+property=["\']og:description["\']\s+content=["\'][^"\']*["\']\s*\/?>/i',
            '<meta property="og:description" content="' . $escaped . '" />',
            $html, 1
        );
    }

    if ($new_title !== null) {
        $escaped = esc_attr($new_title);
        $html = preg_replace(
            '/<meta\s+property=["\']og:title["\']\s+content=["\'][^"\']*["\']\s*\/?>/i',
            '<meta property="og:title" content="' . $escaped . '" />',
            $html, 1
        );
    }

    // Translate content strings (Egger lead paragraph etc.)
    $html = sk5_translate_content_strings($html, $lang);

    // Translate Yoast FAQ (FAQPage) in JSON-LD
    $html = sk5_translate_yoast_faq($html);

    // Replace FurnitureStore description in JSON-LD schema
    $fs_descs = array(
        'ru' => 'Кухонная мебель на заказ в Таллинне. Индивидуальные кухни по вашим размерам и дизайну. Австрийская фурнитура, гарантия 5 лет.',
        'en' => 'Custom kitchen furniture in Tallinn. Bespoke kitchens with individual measurements and designs. Austrian hardware, 5-year warranty.',
        'fi' => 'Mittatilauskeittökalusteet Tallinnassa. Yksilölliset keittöt mittojen ja suunnittelun mukaan. Itävaltalaiset helat, 5 vuoden takuu.',
    );
    if (isset($fs_descs[$lang])) {
        $html = preg_replace(
            '/("@type"\s*:\s*"FurnitureStore"[^}]*"description"\s*:\s*)"[^"]*"/s',
            '$1"' . addslashes($fs_descs[$lang]) . '"',
            $html
        );
    }

    return $html;
}

function sk5_translate_content_strings($html, $lang) {
    $strings = array(
        'Egger pakub laia valiku kvaliteetseid dekoore köögifassaadide jaoks. Valige sobiv dekoor kolmest kategooriast.' => array(
            'ru' => 'EGGER предлагает широкий выбор качественных декоров для кухонных фасадов. Выберите подходящий декор из трёх категорий.',
            'en' => 'EGGER offers a wide selection of quality decors for kitchen facades. Choose a suitable decor from three categories.',
            'fi' => 'EGGER tarjoaa laajan valikoiman laadukkaita koristeita keittiön kaapeille. Valitse sopiva koriste kolmesta kategoriasta.',
        ),
    );
    foreach ($strings as $original => $translations) {
        if (isset($translations[$lang])) {
            $html = str_replace($original, esc_html($translations[$lang]), $html);
        }
    }
    return $html;
}

function sk5_get_yoast_faq_translations() {
    return array(
        'Kuidas algab köökitellimus?' => array(
            'ru' => array(
                'q' => 'Как начинается заказ кухни?',
                'a' => 'Позвоните +372 55 525 143 или заполните форму запроса цены. Мы договоримся о бесплатной консультации, сделаем 3D-визуализацию, и после утверждения начнём производство.',
            ),
            'en' => array(
                'q' => 'How does the kitchen order process begin?',
                'a' => 'Call +372 55 525 143 or fill out the price inquiry form. We will arrange a free consultation, create a 3D visualization, and start production after approval.',
            ),
            'fi' => array(
                'q' => 'Miten keittiötilaus alkaa?',
                'a' => 'Soita +372 55 525 143 tai täytä hintatiedustelulomake. Sovimme ilmaisen konsultaation, teemme 3D-visualisoinnin ja aloitamme tuotannon hyväksynnän jälkeen.',
            ),
        ),
        'Kas tulete koju mõõdistama?' => array(
            'ru' => array(
                'q' => 'Вы приезжаете на замер домой?',
                'a' => 'Да, бесплатно! Наш специалист приедет к вам, замерит помещение, оценит расположение коммуникаций и даст профессиональные рекомендации.',
            ),
            'en' => array(
                'q' => 'Do you come to measure at home?',
                'a' => 'Yes, for free! Our specialist will visit your home, measure the room, assess the layout of utilities and provide professional recommendations.',
            ),
            'fi' => array(
                'q' => 'Tuletteko kotiin mittaamaan?',
                'a' => 'Kyllä, ilmaiseksi! Asiantuntijamme tulee kotiisi, mittaa tilan, arvioi sähkö- ja vesiputkiston sijainnin ja antaa ammattimaisia suosituksia.',
            ),
        ),
        'Kas teen 3D visualiseerimise enne tellimist?' => array(
            'ru' => array(
                'q' => 'Делаете ли вы 3D-визуализацию перед заказом?',
                'a' => 'Да, для каждого проекта 3D-визуализация БЕСПЛАТНА! Вы увидите точную планировку кухни, материалы, фурнитуру и сможете внести изменения до начала производства.',
            ),
            'en' => array(
                'q' => 'Do you make a 3D visualization before ordering?',
                'a' => 'Yes, 3D visualization is FREE for every project! You will see the exact kitchen layout, materials, hardware and can make changes before production starts.',
            ),
            'fi' => array(
                'q' => 'Teettekö 3D-visualisoinnin ennen tilausta?',
                'a' => 'Kyllä, 3D-visualisointi on ILMAINEN jokaiselle projektille! Näet tarkan keittiön pohjapiirroksen, materiaalit, helat ja voit tehdä muutoksia ennen tuotannon alkua.',
            ),
        ),
        'Kui kaua vältab projekti teostamine?' => array(
            'ru' => array(
                'q' => 'Сколько длится выполнение проекта?',
                'a' => 'Маленькая кухня — 3 недели, средняя L-образная — 3-4 недели, большая U-образная — 4-5 недель. Ускоренное выполнение возможно по договорённости.',
            ),
            'en' => array(
                'q' => 'How long does the project take?',
                'a' => 'Small kitchen 3 weeks, medium L-shaped 3-4 weeks, large U-shaped 4-5 weeks. Faster execution possible by arrangement.',
            ),
            'fi' => array(
                'q' => 'Kuinka kauan projektin toteutus kestää?',
                'a' => 'Pieni keittiö 3 viikkoa, keskikokoinen L-muotoinen 3-4 viikkoa, suuri U-muotoinen 4-5 viikkoa. Nopeampi toteutus mahdollinen sopimuksella.',
            ),
        ),
        'Kas paigaldate ka tehnika?' => array(
            'ru' => array(
                'q' => 'Устанавливаете ли вы технику?',
                'a' => 'Да! Мы предлагаем полное решение: плита, духовка, посудомоечная машина, холодильник. Работаем вместе с электриками и сантехниками.',
            ),
            'en' => array(
                'q' => 'Do you install appliances?',
                'a' => 'Yes! We offer a complete solution: stove, oven, dishwasher, refrigerator. We work together with electricians and plumbers.',
            ),
            'fi' => array(
                'q' => 'Asennatteko myös kodinkoneet?',
                'a' => 'Kyllä! Tarjoamme täyden ratkaisun: liesi, uuni, astianpesukone, jääkaappi. Työskentelemme yhdessä sähköasentajien ja putkimiesten kanssa.',
            ),
        ),
        'Kas on garantii?' => array(
            'ru' => array(
                'q' => 'Есть ли гарантия?',
                'a' => '5-летняя гарантия на все изготовленные нами элементы, 10-летняя на HPL-столешницы, до 20 лет на австрийскую фурнитуру.',
            ),
            'en' => array(
                'q' => 'Is there a warranty?',
                'a' => '5-year warranty on all elements manufactured by us, 10-year warranty on HPL countertops, up to 20 years on Austrian hardware.',
            ),
            'fi' => array(
                'q' => 'Onko takuu?',
                'a' => '5 vuoden takuu kaikille valmistamillemme osille, 10 vuoden HPL-tasoille, jopa 20 vuotta itävaltalaisille heloille.',
            ),
        ),
    );
}

function sk5_translate_yoast_faq($html) {
    $lang = sk5_get_lang();
    if ($lang === 'et') return $html;

    $translations = sk5_get_yoast_faq_translations();
    if (empty($translations)) return $html;

    // Find standalone FAQPage JSON-LD blocks (not in @graph)
    $html = preg_replace_callback(
        '/<script\s+type=["\']application\/ld\+json["\'][^>]*>([\s\S]*?)<\/script>/i',
        function($match) use ($lang, $translations) {
            $json = $match[1];
            $data = json_decode($json, true);
            if (!$data || !isset($data['@type']) || $data['@type'] !== 'FAQPage') {
                return $match[0];
            }
            if (!isset($data['mainEntity']) || !is_array($data['mainEntity'])) {
                return $match[0];
            }
            $changed = false;
            foreach ($data['mainEntity'] as &$item) {
                $q = isset($item['name']) ? $item['name'] : '';
                if (isset($translations[$q][$lang])) {
                    $item['name'] = $translations[$q][$lang]['q'];
                    if (isset($item['acceptedAnswer']['text'])) {
                        $item['acceptedAnswer']['text'] = $translations[$q][$lang]['a'];
                    }
                    $changed = true;
                }
            }
            if (!$changed) return $match[0];
            $new_json = wp_json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            return '<script type="application/ld+json">' . $new_json . '</script>';
        },
        $html
    );

    return $html;
}
