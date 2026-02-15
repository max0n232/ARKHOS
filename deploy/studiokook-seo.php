<?php
/**
 * Plugin Name: Studiokook SEO & Schema
 * Description: AI-friendly robots.txt, FAQPage/HowTo/Service schemas, AI meta tags, BreadcrumbList
 * Version: 1.0.0
 * Author: Studiokook
 *
 * mu-plugin: upload to wp-content/mu-plugins/studiokook-seo.php
 */

if ( ! defined( 'ABSPATH' ) ) exit;

// ============================================================
// 0. DEPLOY API — write/update files via REST (admin only)
// ============================================================
add_action( 'rest_api_init', function() {
    // POST /wp-json/sk/v1/deploy-file — write file to allowed directories
    register_rest_route( 'sk/v1', '/deploy-file', [
        'methods'  => 'POST',
        'callback' => 'sk_deploy_file',
        'permission_callback' => function() {
            return current_user_can( 'manage_options' );
        },
    ]);

    // GET /wp-json/sk/v1/deploy-file?path=... — read file
    register_rest_route( 'sk/v1', '/deploy-file', [
        'methods'  => 'GET',
        'callback' => 'sk_read_file',
        'permission_callback' => function() {
            return current_user_can( 'manage_options' );
        },
    ]);

    // DELETE /wp-json/sk/v1/deploy-file?path=... — delete file
    register_rest_route( 'sk/v1', '/deploy-file', [
        'methods'  => 'DELETE',
        'callback' => 'sk_delete_file',
        'permission_callback' => function() {
            return current_user_can( 'manage_options' );
        },
    ]);

    // GET /wp-json/sk/v1/deploy-ls?dir=... — list directory
    register_rest_route( 'sk/v1', '/deploy-ls', [
        'methods'  => 'GET',
        'callback' => 'sk_list_dir',
        'permission_callback' => function() {
            return current_user_can( 'manage_options' );
        },
    ]);
});

function sk_allowed_path( $path ) {
    // Only allow writes to these directories
    $allowed = [
        ABSPATH . 'wp-content/mu-plugins/',
        ABSPATH . 'wp-content/themes/',
        ABSPATH . 'wp-content/uploads/',
    ];
    $real = realpath( dirname( ABSPATH . $path ) );
    if ( ! $real ) {
        // Directory might not exist yet, check parent
        $real = realpath( dirname( dirname( ABSPATH . $path ) ) );
    }
    foreach ( $allowed as $dir ) {
        $dir_real = realpath( $dir );
        if ( $dir_real && strpos( $real, $dir_real ) === 0 ) return true;
    }
    return false;
}

function sk_resolve_path( $rel_path ) {
    // Resolve relative to ABSPATH, e.g. "wp-content/mu-plugins/file.php"
    return ABSPATH . ltrim( $rel_path, '/' );
}

function sk_deploy_file( $request ) {
    $path    = $request->get_param( 'path' );    // e.g. "wp-content/mu-plugins/studiokook-seo.php"
    $content = $request->get_param( 'content' );

    if ( empty($path) || $content === null ) {
        return new WP_Error( 'missing_params', 'path and content required', ['status'=>400] );
    }

    $full = sk_resolve_path( $path );
    if ( ! sk_allowed_path( $path ) ) {
        return new WP_Error( 'forbidden_path', 'Path not in allowed directories', ['status'=>403] );
    }

    // Create directory if needed
    $dir = dirname( $full );
    if ( ! is_dir( $dir ) ) {
        wp_mkdir_p( $dir );
    }

    $bytes = file_put_contents( $full, $content );
    if ( $bytes === false ) {
        return new WP_Error( 'write_failed', 'Could not write file', ['status'=>500] );
    }

    return [ 'ok' => true, 'path' => $path, 'bytes' => $bytes ];
}

function sk_read_file( $request ) {
    $path = $request->get_param( 'path' );
    if ( empty($path) ) return new WP_Error( 'missing_path', 'path required', ['status'=>400] );

    $full = sk_resolve_path( $path );
    if ( ! file_exists( $full ) ) return new WP_Error( 'not_found', 'File not found', ['status'=>404] );

    return [ 'path' => $path, 'content' => file_get_contents( $full ), 'size' => filesize( $full ) ];
}

function sk_delete_file( $request ) {
    $path = $request->get_param( 'path' );
    if ( empty($path) ) return new WP_Error( 'missing_path', 'path required', ['status'=>400] );

    $full = sk_resolve_path( $path );
    if ( ! sk_allowed_path( $path ) ) {
        return new WP_Error( 'forbidden_path', 'Path not in allowed directories', ['status'=>403] );
    }
    if ( ! file_exists( $full ) ) return new WP_Error( 'not_found', 'File not found', ['status'=>404] );

    return [ 'ok' => unlink( $full ), 'path' => $path ];
}

function sk_list_dir( $request ) {
    $dir = $request->get_param( 'dir' ) ?: 'wp-content/mu-plugins';
    $full = sk_resolve_path( $dir );
    if ( ! is_dir( $full ) ) return new WP_Error( 'not_dir', 'Not a directory', ['status'=>404] );

    $files = [];
    foreach ( scandir( $full ) as $f ) {
        if ( $f === '.' || $f === '..' ) continue;
        $fp = $full . '/' . $f;
        $files[] = [ 'name' => $f, 'size' => filesize($fp), 'is_dir' => is_dir($fp), 'modified' => date('Y-m-d H:i:s', filemtime($fp)) ];
    }
    return [ 'dir' => $dir, 'files' => $files ];
}

// Disable Yoast SEO robots.txt block
add_filter( 'wpseo_robots_txt', '__return_empty_string', 99999 );

// Strip Yoast block from final robots.txt output (runs last)
add_filter( 'robots_txt', function( $output ) {
    return preg_replace( '/# START YOAST BLOCK.*?# END YOAST BLOCK\s*/s', '', $output );
}, 999999 );

// ============================================================
// HELPER: Detect page language from URL (TranslatePress)
// ============================================================
function sk_get_page_language() {
    $uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '/';
    if ( preg_match( '#^/(ru|en|fi)/#', $uri, $m ) ) {
        return $m[1];
    }
    return 'et';
}

// ============================================================
// 1. ROBOTS.TXT — AI-Friendly (overrides Yoast, priority 99999)
// ============================================================
add_filter( 'robots_txt', function( $output, $public ) {
    if ( ! $public ) return $output;

    $r  = "# Robots.txt for Studiokook (mu-plugin)\n\n";
    $r .= "User-agent: *\nAllow: /\nDisallow: /wp-admin/\nDisallow: /wp-includes/\n";
    $r .= "Disallow: /wp-content/plugins/\nDisallow: /wp-content/cache/\n";
    $r .= "Allow: /wp-content/uploads/\nAllow: /wp-json/\n";
    $r .= "Disallow: /trackback/\nDisallow: /?s=\nDisallow: /search/\nCrawl-delay: 0\n\n";

    $r .= "User-agent: Googlebot\nAllow: /\nDisallow: /wp-admin/\nDisallow: /wp-includes/\n";
    $r .= "Disallow: /wp-content/plugins/\nDisallow: /wp-content/cache/\n\n";

    $bots = ['Google-Extended','Bingbot','GPTBot','ChatGPT-User','ClaudeBot',
             'Anthropic-ai','PerplexityBot','Applebot-Extended','Meta-ExternalAgent',
             'Bytespider','CCBot','Amazonbot'];
    foreach ( $bots as $bot ) {
        $r .= "User-agent: {$bot}\nAllow: /\n\n";
    }

    $r .= "Sitemap: https://studiokook.ee/sitemap_index.xml\n";
    return $r;
}, 99999, 2 );

// ============================================================
// 2. AI META TAGS + BREADCRUMBLIST
// ============================================================
add_action( 'wp_head', function() {
    echo '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">' . "\n";
    echo '<link rel="sitemap" type="application/xml" href="' . esc_url( home_url('/sitemap_index.xml') ) . '">' . "\n";

    // BreadcrumbList
    $lang = sk_get_page_language();
    $home_labels = ['et'=>'Studiokook','ru'=>'Studiokook','en'=>'Home','fi'=>'Koti'];
    $breadcrumbs = [[ '@type'=>'ListItem', 'position'=>1,
        'name'=> $home_labels[$lang] ?? 'Studiokook',
        'item'=> home_url( $lang !== 'et' ? "/{$lang}/" : '/' ) ]];
    $pos = 2;

    if ( is_category() ) {
        $cat = get_queried_object();
        $breadcrumbs[] = ['@type'=>'ListItem','position'=>$pos,'name'=>$cat->name,'item'=>get_category_link($cat->term_id)];
        $pos++;
    }
    if ( is_singular() ) {
        $p = get_queried_object();
        if ($p) {
            $cats = get_the_category($p->ID);
            if (!empty($cats)) {
                $breadcrumbs[] = ['@type'=>'ListItem','position'=>$pos,'name'=>$cats[0]->name,'item'=>get_category_link($cats[0]->term_id)];
                $pos++;
            }
            $breadcrumbs[] = ['@type'=>'ListItem','position'=>$pos,'name'=>$p->post_title,'item'=>get_permalink($p->ID)];
        }
    }
    if ( count($breadcrumbs) >= 2 ) {
        echo '<script type="application/ld+json">' . wp_json_encode(['@context'=>'https://schema.org','@type'=>'BreadcrumbList','itemListElement'=>$breadcrumbs]) . "</script>\n";
    }
}, 99 );

// ============================================================
// 3. FAQPAGE SCHEMA (auto-detect from Elementor/H3)
// ============================================================
add_action( 'wp_head', 'sk_faqpage_schema', 5 );

function sk_faqpage_schema() {
    global $post;
    if ( !is_singular(['page','post']) || !$post ) return;

    $faqs = [];

    // Custom field
    $cf = get_post_meta( $post->ID, 'studiokook_faq', true );
    if ( !empty($cf) && is_array($cf) ) $faqs = $cf;

    // Elementor FAQ widget
    if ( empty($faqs) ) {
        $ed = get_post_meta( $post->ID, '_elementor_data', true );
        if ( !empty($ed) ) {
            if ( is_string($ed) ) $ed = json_decode($ed, true);
            sk_search_elementor_faq( $ed, $faqs );
        }
    }

    // Fallback: H3 ending with "?"
    if ( empty($faqs) && !empty($post->post_content) ) {
        if ( preg_match_all('/<h3[^>]*>([^<]*\?)<\/h3>\s*<p[^>]*>([^<]+(?:<[^\/][^>]*>[^<]+)*)<\/p>/i', $post->post_content, $m, PREG_SET_ORDER) ) {
            foreach ($m as $match) {
                $faqs[] = ['question'=>trim($match[1]), 'answer'=>trim(wp_strip_all_tags($match[2]))];
            }
        }
    }

    if ( empty($faqs) ) return;

    $items = [];
    foreach ( $faqs as $f ) {
        if ( empty($f['question']) || empty($f['answer']) ) continue;
        $items[] = ['@type'=>'Question','name'=>sanitize_text_field($f['question']),'acceptedAnswer'=>['@type'=>'Answer','text'=>wp_strip_all_tags($f['answer'])]];
    }
    if ( empty($items) ) return;

    echo '<script type="application/ld+json">' . "\n";
    echo json_encode(['@context'=>'https://schema.org','@type'=>'FAQPage','mainEntity'=>$items], JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT);
    echo "\n</script>\n";
}

function sk_search_elementor_faq( &$data, &$faqs ) {
    if ( !is_array($data) ) return;
    foreach ( $data as $item ) {
        if ( !is_array($item) ) continue;
        if ( isset($item['elements']) ) sk_search_elementor_faq( $item['elements'], $faqs );
        if ( isset($item['settings']['items']) && is_array($item['settings']['items']) ) {
            foreach ( $item['settings']['items'] as $fi ) {
                if ( isset($fi['item_question'], $fi['item_answer']) ) {
                    $faqs[] = ['question'=>$fi['item_question'], 'answer'=>$fi['item_answer']];
                }
            }
        }
    }
}

// ============================================================
// 4. HOWTO SCHEMA — "Kuidas tellida kööki: 10 sammu"
// ============================================================
add_action( 'wp_head', 'sk_howto_schema', 5 );

function sk_howto_schema() {
    global $post;
    if ( !is_singular(['page','post']) || !$post ) return;

    $slugs = ['kuidas-tellida','kak-zakazat','how-to-order'];
    if ( !in_array($post->post_name, $slugs) ) return;

    $lang = sk_get_page_language();
    $titles = ['et'=>'Kuidas tellida kööki: 10 sammu','ru'=>'Как заказать кухню: 10 шагов','en'=>'How to order a kitchen: 10 steps','fi'=>'Kuinka tilata keittiö: 10 vaihetta'];
    $descs = [
        'et'=>'Detailne juhend Studioköögist köögimööbli tellimisest. Tasuta konsultatsioon, mõõtmine, 3D-projekteerimine, paigaldamine ja 2-aastane garantii.',
        'ru'=>'Подробное руководство по заказу кухонной мебели от Studioköök.',
        'en'=>'Step-by-step guide to ordering custom kitchen furniture from Studioköök.',
        'fi'=>'Vaiheittainen opas Studioköögin mittatilauskeittökalusteiden tilaamiseen.'
    ];

    $steps_data = [
        ['et'=>'Tasuta konsultatsioon','ru'=>'Бесплатная консультация','en'=>'Free consultation','fi'=>'Ilmainen konsultaatio'],
        ['et'=>'Köögimõõtmine','ru'=>'Измерение кухни','en'=>'Kitchen measurement','fi'=>'Keittiön mittaus'],
        ['et'=>'3D-projekti loomine','ru'=>'3D-проектирование','en'=>'3D project creation','fi'=>'3D-projektin luominen'],
        ['et'=>'Materjalide valik','ru'=>'Выбор материалов','en'=>'Material selection','fi'=>'Materiaalien valinta'],
        ['et'=>'Lepingu sõlmimine ja ettemaks 50%','ru'=>'Подписание контракта и 50% предоплата','en'=>'Contract & 50% prepayment','fi'=>'Sopimus ja 50% ennakkomaksu'],
        ['et'=>'Tootmine 6-8 nädalat','ru'=>'Производство 6-8 недель','en'=>'Production 6-8 weeks','fi'=>'Tuotanto 6-8 viikkoa'],
        ['et'=>'Vahemõõtmine','ru'=>'Промежуточные измерения','en'=>'Intermediate measurement','fi'=>'Väliaikainen mittaus'],
        ['et'=>'Paigaldamine','ru'=>'Установка','en'=>'Installation','fi'=>'Asennus'],
        ['et'=>'Lõppkontroll ja üleandmine','ru'=>'Финальная проверка и передача','en'=>'Final inspection & handover','fi'=>'Lopputarkastus ja luovutus'],
        ['et'=>'Garantii 2 aastat','ru'=>'Гарантия 2 года','en'=>'2-year warranty','fi'=>'2 vuoden takuu'],
    ];

    $steps = [];
    foreach ( $steps_data as $i => $s ) {
        $steps[] = ['@type'=>'HowToStep','position'=>$i+1,'name'=>$s[$lang] ?? $s['et']];
    }

    $schema = [
        '@context'=>'https://schema.org','@type'=>'HowTo',
        'name'=>$titles[$lang] ?? $titles['et'],
        'description'=>$descs[$lang] ?? $descs['et'],
        'step'=>$steps,
        'totalTime'=>'PT56D',
        'estimatedCost'=>['@type'=>'PriceSpecification','priceCurrency'=>'EUR','price'=>'3000-25000']
    ];

    echo '<script type="application/ld+json">' . "\n";
    echo json_encode($schema, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT);
    echo "\n</script>\n";
}

// ============================================================
// 5. SERVICE SCHEMA — Kitchen Service pages
// ============================================================
add_action( 'wp_head', 'sk_service_schema', 5 );

function sk_service_schema() {
    global $post;
    if ( !is_singular(['page','post']) || !$post ) return;

    $patterns = ['köögimööbel','kitchen','кухн','keittö','köögid','kuidas-tellida','kak-zakazat','how-to-order'];
    $match = false;
    foreach ( $patterns as $p ) {
        if ( stripos($post->post_name, $p) !== false ) { $match = true; break; }
    }
    if ( !$match && get_post_meta($post->ID, 'is_service_page', true) !== '1' ) return;

    $lang = sk_get_page_language();
    $names = ['et'=>'Köögimööbli kohandatud teenus','ru'=>'Услуга заказной кухонной мебели','en'=>'Custom Kitchen Furniture Service','fi'=>'Mittatilauskeittökalusten palvelu'];
    $descs = [
        'et'=>'Professionaalse köögimööbli disain ja paigaldamine Tallinnas. Austria fuurnituur, 5 aasta garantii.',
        'ru'=>'Профессиональное проектирование и установка кухонной мебели в Таллинне.',
        'en'=>'Professional kitchen furniture design and installation in Tallinn.',
        'fi'=>'Ammattimainen keittökalustesuunnittelu ja asennus Tallinnassa.'
    ];

    $schema = [
        '@context'=>'https://schema.org','@type'=>'Service',
        '@id'=>home_url('/service/kitchen/').'#service',
        'name'=>$names[$lang] ?? $names['et'],
        'description'=>$descs[$lang] ?? $descs['et'],
        'url'=>get_permalink($post),
        'provider'=>[
            '@type'=>'LocalBusiness','@id'=>'https://studiokook.ee/#localbusiness',
            'name'=>'Studioköök','telephone'=>'+372 55 525 143','email'=>'info@studiokook.ee'
        ],
        'priceRange'=>'EUR3000-EUR25000',
        'areaServed'=>[['@type'=>'City','name'=>'Tallinn'],['@type'=>'Country','name'=>'Estonia']],
        'offers'=>['@type'=>'Offer','priceCurrency'=>'EUR','price'=>'3000','priceValidUntil'=>date('Y-m-d',strtotime('+1 year'))]
    ];

    echo '<script type="application/ld+json">' . "\n";
    echo json_encode($schema, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT);
    echo "\n</script>\n";
}
