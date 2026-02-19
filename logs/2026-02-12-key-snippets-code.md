# Key Active Translation Snippets - Full Code

**Date:** 2026-02-12
**Source:** studiokook.ee

---

## SEO Schemas Output (ID: 102)

**Tags:** ['seo']
**Active:** True
**Description:** Outputs JSON-LD schemas (FAQ, Product) in wp_head. Provides shortcodes: [seo_h1], [trust_signals], [seo_faq]

```php
/**
 * SEO Schemas Output for Studiokook
 * Outputs FAQ and Product JSON-LD schemas in head
 * Note: Page 8 FAQ handled by SK FAQ Schema by Page snippet
 */

function studiokook_get_current_lang() {
    $lang = 'et';
    if (function_exists('trp_get_current_language')) {
        $lang = trp_get_current_language();
    } elseif (defined('ICL_LANGUAGE_CODE')) {
        $lang = ICL_LANGUAGE_CODE;
    } elseif (isset($_GET['lang'])) {
        $lang = sanitize_key($_GET['lang']);
    }
    return $lang;
}

function studiokook_lang_to_suffix($lang) {
    $map = ['en_GB' => 'en', 'ru_RU' => 'ru', 'fi' => 'fi', 'et' => 'et'];
    return isset($map[$lang]) ? $map[$lang] : 'et';
}

function studiokook_output_seo_schemas() {
    if (!is_singular()) return;
    $post_id = get_the_ID();
    if (!$post_id) return;

    // Skip FAQ for page 8 - handled by SK FAQ Schema by Page
    if ($post_id != 8) {
        $lang = studiokook_get_current_lang();
        $suffix = studiokook_lang_to_suffix($lang);
        $faq_schema = get_post_meta($post_id, '_seo_faq_schema_' . $suffix, true);
        if (!$faq_schema || empty(trim($faq_schema))) {
            $faq_schema = get_post_meta($post_id, '_seo_faq_schema', true);
        }
        if ($faq_schema && !empty(trim($faq_schema))) {
            echo "
<script type=\"application/ld+json\">" . $faq_schema . "</script>
";
        }
    }

    // Product schema
    $lang = studiokook_get_current_lang();
    $suffix = studiokook_lang_to_suffix($lang);
    $product_schema = get_post_meta($post_id, '_seo_product_schema_' . $suffix, true);
    if (!$product_schema || empty(trim($product_schema))) {
        $product_schema = get_post_meta($post_id, '_seo_product_schema', true);
    }
    if ($product_schema && !empty(trim($product_schema))) {
        echo "<script type=\"application/ld+json\">" . $product_schema . "</script>
";
    }
}
add_action('wp_head', 'studiokook_output_seo_schemas', 5);

function studiokook_seo_h1_shortcode() {
    $post_id = get_the_ID();
    if (!$post_id) return '';
    $lang = studiokook_get_current_lang();
    $h1 = get_post_meta($post_id, '_seo_h1_' . $lang, true);
    if (!$h1) $h1 = get_post_meta($post_id, '_seo_h1_et', true);
    if (!$h1) $h1 = get_the_title($post_id);
    return '<h1 class="seo-h1" style="font-size:2.2em;font-weight:700;margin-bottom:0.5em;color:#1a1a1a;">' . esc_html($h1) . '</h1>';
}
add_shortcode('seo_h1', 'studiokook_seo_h1_shortcode');

function studiokook_trust_signals_shortcode() {
    $post_id = get_the_ID();
    if (!$post_id) return '';
    $signals_json = get_post_meta($post_id, '_seo_trust_signals', true);
    if (!$signals_json) return '';
    $signals = json_decode($signals_json, true);
    if (!$signals) return '';
    $lang = studiokook_get_current_lang();
    $data = isset($signals[$lang]) ? $signals[$lang] : (isset($signals['et']) ? $signals['et'] : null);
    if (!$data) return '';
    $output = '<div class="trust-signals" style="background:#f8f9fa;border-radius:12px;padding:1.5em;margin:1.5em 0;">';
    $output .= '<h3 style="font-size:1.3em;margin-bottom:1em;color:#1a1a1a;">' . esc_html($data['title']) . '</h3>';
    $output .= '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1em;">';
    foreach ($data['items'] as $item) {
        $output .= '<div style="display:flex;align-items:center;gap:0.5em;"><span style="color:#ff6b35;font-size:1.2em;">✓</span><span>' . esc_html($item) . '</span></div>';
    }
    $output .= '</div></div>';
    return $output;
}
add_shortcode('trust_signals', 'studiokook_trust_signals_shortcode');

function studiokook_seo_faq_shortcode() {
    $post_id = get_the_ID();
    if (!$post_id) return '';
    $lang = studiokook_get_current_lang();
    $suffix = studiokook_lang_to_suffix($lang);
    $faq_json = get_post_meta($post_id, '_seo_faq_schema_' . $suffix, true);
    if (!$faq_json || empty(trim($faq_json))) {
        $faq_json = get_post_meta($post_id, '_seo_faq_schema', true);
    }
    if (!$faq_json) return '';
    $faq = json_decode($faq_json, true);
    if (!$faq || !isset($faq['mainEntity'])) return '';
    $titles = ['et' => 'Korduma Kippuvad Kysimused', 'ru' => 'Chasto zadavaemye voprosy', 'en' => 'Frequently Asked Questions', 'en_GB' => 'Frequently Asked Questions', 'fi' => 'Usein Kysytyt Kysymykset'];
    $title = isset($titles[$lang]) ? $titles[$lang] : $titles['et'];
    $output = '<section class="faq-section" style="max-width:900px;margin:2em auto;padding:1em 0;">';
    $output .= '<h2 style="font-size:1.8em;margin-bottom:1em;color:#1a1a1a;">' . esc_html($title) . '</h2>';
    foreach ($faq['mainEntity'] as $item) {
        $q = $item['name'] ?? '';
        $a = $item['acceptedAnswer']['text'] ?? '';
        $output .= '<div class="faq-item" style="border-bottom:1px solid #eee;padding:1.2em 0;"><h3 style="font-size:1.2em;color:#ff6b35;margin-bottom:0.5em;">' . esc_html($q) . '</h3><p style="color:#444;line-height:1.6;margin:0;">' . esc_html($a) . '</p></div>';
    }
    $output .= '</section>';
    return $output;
}
add_shortcode('seo_faq', 'studiokook_seo_faq_shortcode');
```

---

## SEO Meta v5.1 Complete (ID: 105)

**Tags:** []
**Active:** True
**Description:** 

```php
/**
 * Snippet Name: SEO Meta Translations v5
 * Description: Title + description + OG for RU/EN/FI via filters
 * Version: 5.1
 * Scope: "Only run on site front-end"
 */

// === DATA ===

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
            'fi' => 'Keittiön julkisivut | Studioköök',
        ),
        'valmistamine' => array(
            'ru' => 'Производство кухонь | Studioköök',
            'en' => 'Kitchen Manufacturing | Studioköök',
            'fi' => 'Keittiövalmistus | Studioköök',
        ),
        'sahtlid' => array(
            'ru' => 'Выдвижные ящики Blum | Studioköök',
            'en' => 'Blum Drawer Systems | Studioköök',
            'fi' => 'Blum-laatikot | Studioköök',
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
            'ru' => 'Блог | Советы по дизайну кухни | Studioköök',
            'en' => 'Blog | Kitchen Design Tips | Studioköök',
            'fi' => 'Blogi | Keittiösuunnitteluvinkit | Studioköök',
        ),
        'privacy' => array(
            'ru' => 'Политика конфиденциальности | Studioköök',
            'en' => 'Privacy Policy | Studioköök',
            'fi' => 'Tietosuojakäytäntö | Studioköök',
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
        'fassaadid' => array(
            'ru' => 'Качественные кухонные фасады: ламинат EGGER, Fenix NTM, МДФ матовый и глянцевый. Широкий выбор цветов.',
            'en' => 'Quality kitchen facades: EGGER laminate, Fenix NTM, MDF matte and gloss. Wide color selection.',
            'fi' => 'Laadukkaat keittiön julkisivut: EGGER-laminaatti, Fenix NTM, MDF matta ja kiiltävä. Laaja värivalikoima.',
        ),
        'valmistamine' => array(
            'ru' => 'Собственное производство кухонной мебели в Эстонии. Контроль качества на каждом этапе.',
            'en' => 'In-house kitchen furniture production in Estonia. Quality control at every stage.',
            'fi' => 'Oma keittiökalusteiden valmistus Virossa. Laadunvalvonta jokaisessa vaiheessa.',
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
            'ru' => 'Статьи о дизайне кухни, материалах и трендах. Советы по планировке кухни.',
            'en' => 'Articles about kitchen design, materials and trends. Tips for kitchen planning.',
            'fi' => 'Artikkelit keittiösuunnittelusta, materiaaleista ja trendeistä. Vinkkejä keittiön suunnitteluun.',
        ),
        'privacy' => array(
            'ru' => 'Политика конфиденциальности Studiokook OÜ и условия обработки персональных данных.',
            'en' => 'Studiokook OÜ privacy policy and personal data processing terms.',
            'fi' => 'Studiokook OÜ:n tietosuojakäytäntö ja henkilötietojen käsittelyehdot.',
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

```

---

## SK hreflang x-default fix (ID: 207)

**Tags:** ['seo', 'hreflang']
**Active:** True
**Description:** Adds x-default hreflang pointing to Estonian URL

```php
add_action('wp_head', 'studiokook_add_xdefault', 1);
function studiokook_add_xdefault() {
    $request_uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '/';
    $path = parse_url($request_uri, PHP_URL_PATH);
    if ($path === null) { $path = '/'; }
    $base_path = preg_replace('#^/(ru|en|fi)(/|$)#', '/', $path);
    $base_path = rtrim($base_path, '/');
    if (empty($base_path)) { $base_path = '/'; } else { $base_path .= '/'; }
    $url = 'https://studiokook.ee' . $base_path;
    echo '<link rel="alternate" hreflang="x-default" href="' . esc_url($url) . '" />' . "\n";
}
add_filter('trp_hreflang', 'studiokook_remove_trp_xdefault', 10, 2);
function studiokook_remove_trp_xdefault($hreflang, $language) {
    if (isset($hreflang['x-default'])) { unset($hreflang['x-default']); }
    return $hreflang;
}
```

---

## Yoast Schema Language Filter (ID: 220)

**Tags:** []
**Active:** True
**Description:** Translate Yoast schema description for EN/RU/FI versions

```php
add_filter('wpseo_schema_organization', function($data) { $lang = function_exists('trp_get_current_language') ? trp_get_current_language() : 'et'; if ($lang === 'en_GB' && isset($data['description'])) { $data['description'] = 'Custom kitchen furniture in Tallinn. Bespoke kitchens with individual measurements and designs.'; } return $data; }, 20); add_filter('wpseo_schema_webpage', function($data) { $lang = function_exists('trp_get_current_language') ? trp_get_current_language() : 'et'; if ($lang === 'en_GB' && isset($data['description'])) { $data['description'] = 'Custom kitchen furniture in Tallinn. Bespoke kitchens with individual measurements and designs.'; } return $data; }, 20);
```

---

## Localized 404 Titles (ID: 227)

**Tags:** []
**Active:** True
**Description:** Shows 404 page title in correct language based on URL

```php
add_filter('pre_get_document_title', 'studiokook_404_title', 99);
add_filter('wpseo_title', 'studiokook_404_title_yoast', 99);

function studiokook_404_title($title) {
    if (!is_404()) return $title;
    $uri = $_SERVER['REQUEST_URI'];
    $lang = 'et';
    if (preg_match('#^/(ru|en|fi)/#', $uri, $m)) {
        $lang = $m[1];
    }
    $titles = [
        'et' => 'Lehte ei leitud - Studioköök',
        'ru' => 'Страница не найдена - Studioköök',
        'en' => 'Page not found - Studioköök',
        'fi' => 'Sivua ei löytynyt - Studioköök'
    ];
    return $titles[$lang] ?? $titles['et'];
}

function studiokook_404_title_yoast($title) {
    if (!is_404()) return $title;
    return studiokook_404_title($title);
}
```

---

