<?php
/**
 * Deploy Script: Insert/Update Code Snippets via Database
 * studiokook.ee - 2026-02-09
 *
 * ИСПОЛЬЗОВАНИЕ:
 * 1. Загрузить на сервер через FTP в /public_html/
 * 2. Открыть https://studiokook.ee/deploy-snippets.php?key=DEPLOY_KEY_2026
 * 3. После выполнения УДАЛИТЬ файл с сервера!
 */

// Защита от несанкционированного доступа
if (!isset($_GET['key']) || $_GET['key'] !== 'DEPLOY_KEY_2026') {
    http_response_code(403);
    die('Access denied');
}

// WordPress bootstrap
require_once('wp-load.php');

global $wpdb;

// Проверяем существование таблицы snippets
$table_name = $wpdb->prefix . 'snippets';
$table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_name'") === $table_name;

if (!$table_exists) {
    die("Error: Table $table_name does not exist. Is Code Snippets plugin installed?");
}

// Сниппеты для деплоя
$snippets = [
    [
        'name' => '301 Redirects SEO Fix',
        'code' => <<<'PHP'
add_action('template_redirect', 'studiokook_seo_redirects', 1);

function studiokook_seo_redirects() {
    $redirects = [
        // HPL столешницы: canonical указывает на /toopinnad/hpl-tootasapinnad/
        '/hpl-tootasapinnad/' => '/toopinnad/hpl-tootasapinnad/',
        '/ru/hpl-tootasapinnad/' => '/ru/toopinnad/hpl-tootasapinnad/',
        '/en/hpl-tootasapinnad/' => '/en/toopinnad/hpl-tootasapinnad/',
        '/fi/hpl-tootasapinnad/' => '/fi/toopinnad/hpl-tootasapinnad/',

        // Egger фасады
        '/egger-fassaadid/' => '/fassaadid/egger-fassaadid/',
        '/ru/egger-fassaadid/' => '/ru/fassaadid/egger-fassaadid/',
        '/en/egger-fassaadid/' => '/en/fassaadid/egger-fassaadid/',
        '/fi/egger-fassaadid/' => '/fi/fassaadid/egger-fassaadid/',

        // Fenix фасады
        '/fenix/' => '/fassaadid/fenix/',
        '/ru/fenix/' => '/ru/fassaadid/fenix/',
        '/en/fenix/' => '/en/fassaadid/fenix/',
        '/fi/fenix/' => '/fi/fassaadid/fenix/',

        // Подкатегории Egger
        '/kivi/' => '/egger/kivi/',
        '/monokroom/' => '/egger/monokroom/',
        '/puit/' => '/egger/puit/',
    ];

    $request_uri = $_SERVER['REQUEST_URI'];
    $normalized_uri = rtrim($request_uri, '/') . '/';

    if (isset($redirects[$normalized_uri])) {
        wp_redirect(home_url($redirects[$normalized_uri]), 301);
        exit;
    }
}
PHP,
        'scope' => 'global',
        'priority' => 10,
    ],
    [
        'name' => 'Fix Duplicate H1 Tags',
        'code' => <<<'PHP'
add_action('wp_head', 'studiokook_hide_duplicate_h1', 99);

function studiokook_hide_duplicate_h1() {
    $problem_slugs = [
        'hpl-tootasapinnad',
        'laminaadist-tootasapinnad',
        'kividest-tootasapinnad',
        'egger-fassaadid',
        'fenix',
        'egger',
        'kivi',
        'monokroom',
        'puit',
    ];

    $current_slug = '';
    if (is_page()) {
        global $post;
        $current_slug = $post->post_name ?? '';
    }

    $uri = $_SERVER['REQUEST_URI'];
    $should_hide = false;

    if (in_array($current_slug, $problem_slugs)) {
        $should_hide = true;
    } else {
        foreach ($problem_slugs as $slug) {
            if (preg_match('#/' . preg_quote($slug, '#') . '/?(\?|$)#', $uri)) {
                $should_hide = true;
                break;
            }
        }
    }

    if (!$should_hide) return;

    echo '<style>
    .entry-header .entry-title,
    h1.entry-title,
    h1.seo-h1 {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
    }
    </style>';
}
PHP,
        'scope' => 'front-end',
        'priority' => 10,
    ],
];

echo "<h1>Deploy Code Snippets</h1>\n";
echo "<pre>\n";

foreach ($snippets as $snippet) {
    $name = $snippet['name'];
    $code = $snippet['code'];
    $scope = $snippet['scope'];
    $priority = $snippet['priority'];

    // Проверяем существует ли уже
    $existing = $wpdb->get_row($wpdb->prepare(
        "SELECT id FROM $table_name WHERE name = %s",
        $name
    ));

    if ($existing) {
        // Обновляем
        $wpdb->update(
            $table_name,
            [
                'code' => $code,
                'scope' => $scope,
                'priority' => $priority,
                'active' => 1,
                'modified' => current_time('mysql'),
            ],
            ['id' => $existing->id],
            ['%s', '%s', '%d', '%d', '%s'],
            ['%d']
        );
        echo "✅ Updated: $name (ID: {$existing->id})\n";
    } else {
        // Вставляем новый
        $wpdb->insert(
            $table_name,
            [
                'name' => $name,
                'code' => $code,
                'scope' => $scope,
                'priority' => $priority,
                'active' => 1,
                'created' => current_time('mysql'),
                'modified' => current_time('mysql'),
            ],
            ['%s', '%s', '%s', '%d', '%d', '%s', '%s']
        );
        echo "✅ Inserted: $name (ID: {$wpdb->insert_id})\n";
    }
}

echo "\n</pre>\n";
echo "<h2>Done! Now delete this file from server.</h2>\n";
echo "<p><strong>Test redirects:</strong></p>\n";
echo "<ul>\n";
echo "<li><a href='/egger-fassaadid/'>Test /egger-fassaadid/ → should redirect</a></li>\n";
echo "<li><a href='/fenix/'>Test /fenix/ → should redirect</a></li>\n";
echo "<li><a href='/hpl-tootasapinnad/'>Test /hpl-tootasapinnad/ → should redirect</a></li>\n";
echo "</ul>\n";
