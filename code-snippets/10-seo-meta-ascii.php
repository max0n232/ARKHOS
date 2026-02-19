<?php
/**
 * Snippet Name: SEO Meta Translations v6
 * Description: Title + description + OG for RU/EN/FI via filters
 * Version: 6.0
 * Scope: Only run on site front-end
 */

function sk6_get_titles() {
    return array(
        '' => array(
            'ru' => html_entity_decode('&#1050;&#1091;&#1093;&#1085;&#1080; &#1085;&#1072; &#1079;&#1072;&#1082;&#1072;&#1079; &#1074; &#1058;&#1072;&#1083;&#1083;&#1080;&#1085;&#1085;&#1077; | &#1050;&#1091;&#1093;&#1086;&#1085;&#1085;&#1072;&#1103; &#1084;&#1077;&#1073;&#1077;&#1083;&#1100; | Studiok&ouml;&ouml;k', ENT_COMPAT, 'UTF-8'),
            'en' => 'Custom Kitchens in Tallinn | Kitchen Furniture | Studioköök',
            'fi' => 'Mittatilauskeittöt Tallinnassa | Keittiökalusteet | Studioköök',
        ),
        'koogid-eritellimusel' => array(
            'ru' => html_entity_decode('&#1050;&#1091;&#1093;&#1085;&#1080; &#1085;&#1072; &#1079;&#1072;&#1082;&#1072;&#1079; &#1074; &#1058;&#1072;&#1083;&#1083;&#1080;&#1085;&#1085;&#1077; | Studiok&ouml;&ouml;k', ENT_COMPAT, 'UTF-8'),
            'en' => 'Custom Kitchens in Tallinn | Studioköök',
            'fi' => 'Mittatilauskeittöt Tallinnassa | Studioköök',
        ),
        'kontakt' => array(
            'ru' => html_entity_decode('&#1050;&#1086;&#1085;&#1090;&#1072;&#1082;&#1090;&#1099; | Studiok&ouml;&ouml;k &#1058;&#1072;&#1083;&#1083;&#1080;&#1085;&#1085;', ENT_COMPAT, 'UTF-8'),
            'en' => 'Contact | Studioköök Tallinn',
            'fi' => 'Yhteystiedot | Studioköök Tallinna',
        ),
        'hinnaparing' => array(
            'ru' => html_entity_decode('&#1056;&#1072;&#1089;&#1095;&#1105;&#1090; &#1089;&#1090;&#1086;&#1080;&#1084;&#1086;&#1089;&#1090;&#1080; &#1082;&#1091;&#1093;&#1085;&#1080; | Studiok&ouml;&ouml;k', ENT_COMPAT, 'UTF-8'),
            'en' => 'Kitchen Price Quote | Studioköök',
            'fi' => 'Keittiön hintalaskuri | Studioköök',
        ),
        'materjalid' => array(
            'ru' => html_entity_decode('&#1052;&#1072;&#1090;&#1077;&#1088;&#1080;&#1072;&#1083;&#1099; &#1076;&#1083;&#1103; &#1082;&#1091;&#1093;&#1086;&#1085;&#1100; | Studiok&ouml;&ouml;k', ENT_COMPAT, 'UTF-8'),
            'en' => 'Kitchen Materials | Studioköök',
            'fi' => 'Keittiömateriaalit | Studioköök',
        ),
        'meie-furnituur' => array(
            'ru' => html_entity_decode('&#1060;&#1091;&#1088;&#1085;&#1080;&#1090;&#1091;&#1088;&#1072; Blum &#1080; Hettich | Studiok&ouml;&ouml;k', ENT_COMPAT, 'UTF-8'),
            'en' => 'Hardware | Blum and Hettich | Studioköök',
            'fi' => 'Helat | Blum ja Hettich | Studioköök',
        ),
        'koogid' => array(
            'ru' => html_entity_decode('&#1055;&#1086;&#1088;&#1090;&#1092;&#1086;&#1083;&#1080;&#1086; &#1082;&#1091;&#1093;&#1086;&#1085;&#1100; | Studiok&ouml;&ouml;k', ENT_COMPAT, 'UTF-8'),
            'en' => 'Kitchen Portfolio | Studioköök',
            'fi' => 'Keittiöportfolio | Studioköök',
        ),
        'toopinnad' => array(
            'ru' => html_entity_decode('&#1057;&#1090;&#1086;&#1083;&#1077;&#1096;&#1085;&#1080;&#1094;&#1099; &#1076;&#1083;&#1103; &#1082;&#1091;&#1093;&#1085;&#1080; | Studiok&ouml;&ouml;k', ENT_COMPAT, 'UTF-8'),
            'en' => 'Kitchen Countertops | Studioköök',
            'fi' => 'Keittiötasot | Studioköök',
        ),
        'fassaadid' => array(
            'ru' => html_entity_decode('&#1060;&#1072;&#1089;&#1072;&#1076;&#1099; &#1076;&#1083;&#1103; &#1082;&#1091;&#1093;&#1085;&#1080; | Studiok&ouml;&ouml;k', ENT_COMPAT, 'UTF-8'),
            'en' => 'Kitchen Facades | Studioköök',
            'fi' => 'Keittiöjulkisivut | Studioköök',
        ),
        'valmistamine' => array(
            'ru' => html_entity_decode('&#1055;&#1088;&#1086;&#1080;&#1079;&#1074;&#1086;&#1076;&#1089;&#1090;&#1074;&#1086; &#1082;&#1091;&#1093;&#1086;&#1085;&#1100; | Studiok&ouml;&ouml;k', ENT_COMPAT, 'UTF-8'),
            'en' => 'Kitchen Manufacturing | Studioköök',
            'fi' => 'Keittiövalmistus | Studioköök',
        ),
    );
}

function sk6_get_descriptions() {
    return array(
        '' => array(
            'ru' => html_entity_decode('&#1050;&#1091;&#1093;&#1085;&#1080; &#1085;&#1072; &#1079;&#1072;&#1082;&#1072;&#1079; &#1087;&#1086; &#1080;&#1085;&#1076;&#1080;&#1074;&#1080;&#1076;&#1091;&#1072;&#1083;&#1100;&#1085;&#1099;&#1084; &#1088;&#1072;&#1079;&#1084;&#1077;&#1088;&#1072;&#1084; &#1080; &#1087;&#1088;&#1086;&#1077;&#1082;&#1090;&#1072;&#1084;. &#1050;&#1091;&#1093;&#1086;&#1085;&#1085;&#1072;&#1103; &#1084;&#1077;&#1073;&#1077;&#1083;&#1100; &#1074; &#1058;&#1072;&#1083;&#1083;&#1080;&#1085;&#1085;&#1077;, &#1072;&#1074;&#1089;&#1090;&#1088;&#1080;&#1081;&#1089;&#1082;&#1072;&#1103; &#1092;&#1091;&#1088;&#1085;&#1080;&#1090;&#1091;&#1088;&#1072;. +372 55 525 143. &#1041;&#1077;&#1089;&#1087;&#1083;&#1072;&#1090;&#1085;&#1099;&#1081; 3D-&#1076;&#1080;&#1079;&#1072;&#1081;&#1085;.', ENT_COMPAT, 'UTF-8'),
            'en' => 'Custom kitchens tailored to your specifications. Kitchen furniture in Tallinn with Austrian hardware. +372 55 525 143. Free 3D visualization.',
            'fi' => 'Mittatilauskeittöt yksilöllisten mittojen mukaan. Keittiökalusteet Tallinnassa, itävaltalainen helat. +372 55 525 143. Ilmainen 3D-visualisointi.',
        ),
        'koogid-eritellimusel' => array(
            'ru' => html_entity_decode('&#1050;&#1091;&#1093;&#1086;&#1085;&#1085;&#1072;&#1103; &#1084;&#1077;&#1073;&#1077;&#1083;&#1100; &#1085;&#1072; &#1079;&#1072;&#1082;&#1072;&#1079; &#1074; &#1058;&#1072;&#1083;&#1083;&#1080;&#1085;&#1085;&#1077;. &#1041;&#1077;&#1089;&#1087;&#1083;&#1072;&#1090;&#1085;&#1099;&#1081; 3D-&#1076;&#1080;&#1079;&#1072;&#1081;&#1085; &#1080; &#1079;&#1072;&#1084;&#1077;&#1088;. &#1040;&#1074;&#1089;&#1090;&#1088;&#1080;&#1081;&#1089;&#1082;&#1080;&#1077; &#1084;&#1072;&#1090;&#1077;&#1088;&#1080;&#1072;&#1083;&#1099;, &#1075;&#1072;&#1088;&#1072;&#1085;&#1090;&#1080;&#1103; 5 &#1083;&#1077;&#1090;.', ENT_COMPAT, 'UTF-8'),
            'en' => 'Custom kitchen furniture in Tallinn. Free 3D design and measurement. Austrian materials, 5-year warranty.',
            'fi' => 'Mittatilauskeittöt Tallinnassa. Ilmainen 3D-suunnittelu ja mittaus. Itävaltalaiset materiaalit, 5 vuoden takuu.',
        ),
        'kontakt' => array(
            'ru' => html_entity_decode('&#1057;&#1074;&#1103;&#1078;&#1080;&#1090;&#1077;&#1089;&#1100; &#1089; &#1085;&#1072;&#1084;&#1080; &#1076;&#1083;&#1103; &#1079;&#1072;&#1082;&#1072;&#1079;&#1072; &#1082;&#1091;&#1093;&#1086;&#1085;&#1085;&#1086;&#1081; &#1084;&#1077;&#1073;&#1077;&#1083;&#1080;. P&auml;rnu mnt 139c, &#1058;&#1072;&#1083;&#1083;&#1080;&#1085;&#1085;. &#1058;&#1077;&#1083;: +372 55 525 143.', ENT_COMPAT, 'UTF-8'),
            'en' => 'Contact us to order kitchen furniture. Pärnu mnt 139c, Tallinn. Phone: +372 55 525 143.',
            'fi' => 'Ota yhteyttä keittiökalusteiden tilaamiseksi. Pärnu mnt 139c, Tallinna. Puh: +372 55 525 143.',
        ),
        'hinnaparing' => array(
            'ru' => html_entity_decode('&#1054;&#1090;&#1087;&#1088;&#1072;&#1074;&#1100;&#1090;&#1077; &#1079;&#1072;&#1103;&#1074;&#1082;&#1091; &#1080; &#1087;&#1086;&#1083;&#1091;&#1095;&#1080;&#1090;&#1077; &#1073;&#1077;&#1089;&#1087;&#1083;&#1072;&#1090;&#1085;&#1099;&#1081; &#1087;&#1088;&#1086;&#1077;&#1082;&#1090; &#1082;&#1091;&#1093;&#1085;&#1080; &#1080; &#1088;&#1072;&#1089;&#1095;&#1105;&#1090; &#1089;&#1090;&#1086;&#1080;&#1084;&#1086;&#1089;&#1090;&#1080; &#1074; &#1090;&#1077;&#1095;&#1077;&#1085;&#1080;&#1077; 24 &#1095;&#1072;&#1089;&#1086;&#1074;.', ENT_COMPAT, 'UTF-8'),
            'en' => 'Send a request and get a free kitchen project and price quote within 24 hours.',
            'fi' => 'Lähetä pyyntö ja saat ilmaisen keittiöprojektin ja hintatarjouksen 24 tunnin kuluessa.',
        ),
        'materjalid' => array(
            'ru' => html_entity_decode('&#1050;&#1072;&#1095;&#1077;&#1089;&#1090;&#1074;&#1077;&#1085;&#1085;&#1099;&#1077; &#1084;&#1072;&#1090;&#1077;&#1088;&#1080;&#1072;&#1083;&#1099; &#1076;&#1083;&#1103; &#1082;&#1091;&#1093;&#1086;&#1085;&#1085;&#1086;&#1081; &#1084;&#1077;&#1073;&#1077;&#1083;&#1080;: EGGER, Blum, Hettich. &#1051;&#1091;&#1095;&#1096;&#1080;&#1077; &#1087;&#1088;&#1086;&#1080;&#1079;&#1074;&#1086;&#1076;&#1080;&#1090;&#1077;&#1083;&#1080; &#1080;&#1079; &#1040;&#1074;&#1089;&#1090;&#1088;&#1080;&#1080; &#1080; &#1043;&#1077;&#1088;&#1084;&#1072;&#1085;&#1080;&#1080;.', ENT_COMPAT, 'UTF-8'),
            'en' => 'Quality kitchen furniture materials: EGGER, Blum, Hettich. Best manufacturers from Austria and Germany.',
            'fi' => 'Laadukkaat keittiökalustemateriaalit: EGGER, Blum, Hettich. Parhaat valmistajat Itävallasta ja Saksasta.',
        ),
        'meie-furnituur' => array(
            'ru' => html_entity_decode('&#1048;&#1089;&#1087;&#1086;&#1083;&#1100;&#1079;&#1091;&#1077;&#1084; &#1090;&#1086;&#1083;&#1100;&#1082;&#1086; &#1082;&#1072;&#1095;&#1077;&#1089;&#1090;&#1074;&#1077;&#1085;&#1085;&#1091;&#1102; &#1072;&#1074;&#1089;&#1090;&#1088;&#1080;&#1081;&#1089;&#1082;&#1091;&#1102; &#1092;&#1091;&#1088;&#1085;&#1080;&#1090;&#1091;&#1088;&#1091;: Blum LEGRABOX, AVENTOS, Hettich. &#1055;&#1086;&#1078;&#1080;&#1079;&#1085;&#1077;&#1085;&#1085;&#1072;&#1103; &#1075;&#1072;&#1088;&#1072;&#1085;&#1090;&#1080;&#1103;.', ENT_COMPAT, 'UTF-8'),
            'en' => 'We use only quality Austrian hardware: Blum LEGRABOX, AVENTOS, Hettich. Lifetime warranty.',
            'fi' => 'Käytämme vain laadukkaita itävaltalaisia heloituksia: Blum LEGRABOX, AVENTOS, Hettich. Elinikäinen takuu.',
        ),
        'koogid' => array(
            'ru' => html_entity_decode('&#1055;&#1086;&#1089;&#1084;&#1086;&#1090;&#1088;&#1080;&#1090;&#1077; &#1085;&#1072;&#1096;&#1080; &#1074;&#1099;&#1087;&#1086;&#1083;&#1085;&#1077;&#1085;&#1085;&#1099;&#1077; &#1087;&#1088;&#1086;&#1077;&#1082;&#1090;&#1099; &#1082;&#1091;&#1093;&#1086;&#1085;&#1100;. &#1041;&#1086;&#1083;&#1077;&#1077; 500 &#1088;&#1077;&#1072;&#1083;&#1080;&#1079;&#1086;&#1074;&#1072;&#1085;&#1085;&#1099;&#1093; &#1082;&#1091;&#1093;&#1086;&#1085;&#1100; &#1074; &#1058;&#1072;&#1083;&#1083;&#1080;&#1085;&#1085;&#1077; &#1080; &#1069;&#1089;&#1090;&#1086;&#1085;&#1080;&#1080;.', ENT_COMPAT, 'UTF-8'),
            'en' => 'View our completed kitchen projects. Over 500 kitchens installed in Tallinn and Estonia.',
            'fi' => 'Katso valmiita keittiöprojektejamme. Yli 500 toteutettua keittiötä Tallinnassa ja Virossa.',
        ),
        'toopinnad' => array(
            'ru' => html_entity_decode('&#1050;&#1072;&#1095;&#1077;&#1089;&#1090;&#1074;&#1077;&#1085;&#1085;&#1099;&#1077; &#1082;&#1091;&#1093;&#1086;&#1085;&#1085;&#1099;&#1077; &#1089;&#1090;&#1086;&#1083;&#1077;&#1096;&#1085;&#1080;&#1094;&#1099;: &#1085;&#1072;&#1090;&#1091;&#1088;&#1072;&#1083;&#1100;&#1085;&#1099;&#1081; &#1082;&#1072;&#1084;&#1077;&#1085;&#1100;, &#1080;&#1089;&#1082;&#1091;&#1089;&#1089;&#1090;&#1074;&#1077;&#1085;&#1085;&#1099;&#1081; &#1082;&#1072;&#1084;&#1077;&#1085;&#1100;, &#1083;&#1072;&#1084;&#1080;&#1085;&#1072;&#1090;, HPL &#1082;&#1086;&#1084;&#1087;&#1072;&#1082;&#1090;-&#1083;&#1072;&#1084;&#1080;&#1085;&#1072;&#1090;.', ENT_COMPAT, 'UTF-8'),
            'en' => 'Quality kitchen countertops: natural stone, engineered stone, laminate, HPL compact laminate.',
            'fi' => 'Laadukkaat keittiötasot: luonnonkivi, tekokivi, laminaatti, HPL-kompaktilaminaatti.',
        ),
    );
}

function sk6_get_lang() {
    $uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '';
    if (preg_match('#^/(ru|en|fi)(/|$)#', $uri, $m)) {
        return $m[1];
    }
    return 'et';
}

function sk6_get_page() {
    $uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '';
    $path = preg_replace('#^/(ru|en|fi)#', '', $uri);
    $path = trim($path, '/');
    if (empty($path)) return '';
    $parts = explode('/', $path);
    return $parts[0];
}

function sk6_get_translated_title() {
    $lang = sk6_get_lang();
    if ($lang === 'et') return null;
    $page = sk6_get_page();
    $titles = sk6_get_titles();
    if (isset($titles[$page][$lang])) {
        return $titles[$page][$lang];
    }
    return null;
}

function sk6_get_translated_description() {
    $lang = sk6_get_lang();
    if ($lang === 'et') return null;
    $page = sk6_get_page();
    $descs = sk6_get_descriptions();
    if (isset($descs[$page][$lang])) {
        return $descs[$page][$lang];
    }
    return null;
}

add_filter('pre_get_document_title', 'sk6_filter_title', 999999);
add_filter('wpseo_title', 'sk6_filter_title', 999999);
add_filter('wpseo_opengraph_title', 'sk6_filter_title', 999999);

function sk6_filter_title($title) {
    $new_title = sk6_get_translated_title();
    if ($new_title !== null) {
        return $new_title;
    }
    return $title;
}

add_filter('wpseo_metadesc', 'sk6_filter_description', 999999);
add_filter('wpseo_opengraph_desc', 'sk6_filter_description', 999999);

function sk6_filter_description($desc) {
    $new_desc = sk6_get_translated_description();
    if ($new_desc !== null) {
        return $new_desc;
    }
    return $desc;
}
