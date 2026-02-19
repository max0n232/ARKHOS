<?php
/**
 * Snippet Name: 301 Redirects for URL Slug Changes
 * Description: Redirects old Estonian slugs to new localized slugs
 * Version: 1.0
 *
 * ВАЖНО: Активировать ПОСЛЕ того, как будут созданы новые страницы с правильными slugs
 *
 * ИНСТРУКЦИЯ:
 * 1. WP Admin → Code Snippets → Add New
 * 2. Название: "301 Redirects"
 * 3. Scope: "Run everywhere"
 * 4. Активировать ТОЛЬКО после создания новых URL
 */

add_action('template_redirect', 'studiokook_slug_redirects', 1);

function studiokook_slug_redirects() {
    $redirects = [
        // Русские редиректы
        '/ru/kontakt/' => '/ru/kontakty/',
        '/ru/koogid-eritellimusel/' => '/ru/kuhni-na-zakaz/',
        '/ru/hinnaparing/' => '/ru/raschet-stoimosti/',
        '/ru/materjalid/' => '/ru/materialy/',
        '/ru/meie-furnituur/' => '/ru/furnitura/',
        '/ru/toopinnad/' => '/ru/stoleshnitsy/',
        '/ru/koogid/' => '/ru/portfolio/',

        // Английские редиректы
        '/en/kontakt/' => '/en/contact/',
        '/en/koogid-eritellimusel/' => '/en/custom-kitchens/',
        '/en/hinnaparing/' => '/en/price-quote/',
        '/en/materjalid/' => '/en/materials/',
        '/en/meie-furnituur/' => '/en/hardware/',
        '/en/toopinnad/' => '/en/countertops/',
        '/en/koogid/' => '/en/portfolio/',

        // Финские редиректы
        '/fi/kontakt/' => '/fi/yhteystiedot/',
        '/fi/koogid-eritellimusel/' => '/fi/mittatilauskeittiot/',
        '/fi/hinnaparing/' => '/fi/hintatiedustelu/',
        '/fi/materjalid/' => '/fi/materiaalit/',
        '/fi/meie-furnituur/' => '/fi/helat/',
        '/fi/toopinnad/' => '/fi/tyotasot/',
        '/fi/koogid/' => '/fi/portfolio/',

        // ============================================
        // SEO FIX: Дублированные URL → правильные URL
        // Добавлено: 2026-02-09
        // ОБНОВЛЕНО: 2026-02-09 - HPL canonical указывает на /toopinnad/
        // ============================================

        // HPL столешницы: canonical указывает на /toopinnad/hpl-tootasapinnad/
        // Редиректим корневой URL на вложенный (куда указывает canonical)
        '/hpl-tootasapinnad/' => '/toopinnad/hpl-tootasapinnad/',
        '/ru/hpl-tootasapinnad/' => '/ru/toopinnad/hpl-tootasapinnad/',
        '/en/hpl-tootasapinnad/' => '/en/toopinnad/hpl-tootasapinnad/',
        '/fi/hpl-tootasapinnad/' => '/fi/toopinnad/hpl-tootasapinnad/',

        // Egger фасады - корневой URL → вложенный в /fassaadid/
        '/egger-fassaadid/' => '/fassaadid/egger-fassaadid/',
        '/ru/egger-fassaadid/' => '/ru/fassaadid/egger-fassaadid/',
        '/en/egger-fassaadid/' => '/en/fassaadid/egger-fassaadid/',
        '/fi/egger-fassaadid/' => '/fi/fassaadid/egger-fassaadid/',

        // Fenix фасады - корневой URL → вложенный в /fassaadid/
        '/fenix/' => '/fassaadid/fenix/',
        '/ru/fenix/' => '/ru/fassaadid/fenix/',
        '/en/fenix/' => '/en/fassaadid/fenix/',
        '/fi/fenix/' => '/fi/fassaadid/fenix/',

        // Подкатегории материалов Egger
        '/kivi/' => '/egger/kivi/',
        '/monokroom/' => '/egger/monokroom/',
        '/puit/' => '/egger/puit/',
    ];

    $request_uri = $_SERVER['REQUEST_URI'];

    // Нормализуем с trailing slash
    $normalized_uri = rtrim($request_uri, '/') . '/';

    if (isset($redirects[$normalized_uri])) {
        wp_redirect(home_url($redirects[$normalized_uri]), 301);
        exit;
    }
}

/**
 * ПЛАН ДЕЙСТВИЙ:
 *
 * 1. Сначала в TranslatePress создать правильные slugs для переведённых страниц
 * 2. Затем активировать этот snippet
 * 3. Проверить редиректы через: curl -I https://studiokook.ee/ru/kontakt/
 *
 * Ожидаемый результат: HTTP/1.1 301 Moved Permanently
 * Location: https://studiokook.ee/ru/kontakty/
 */
