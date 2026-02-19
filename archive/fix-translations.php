<?php
/**
 * Deploy Script: Add Missing TranslatePress Translations
 * studiokook.ee - 2026-02-09
 *
 * ИСПОЛЬЗОВАНИЕ:
 * 1. Загрузить на сервер через FTP в /public_html/
 * 2. Открыть https://studiokook.ee/fix-translations.php?key=DEPLOY_KEY_2026
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

echo "<h1>TranslatePress Translation Fix</h1>\n";
echo "<pre>\n";

// 1. Найти таблицы TranslatePress
$tables = $wpdb->get_results("SHOW TABLES LIKE '%trp%'");
echo "=== TranslatePress Tables ===\n";
foreach ($tables as $table) {
    $table_name = current((array)$table);
    echo "- $table_name\n";
}
echo "\n";

// 2. Проверить структуру таблицы словаря для EN
$en_table = $wpdb->prefix . 'trp_dictionary_en_gb';
$table_exists = $wpdb->get_var("SHOW TABLES LIKE '$en_table'");

if (!$table_exists) {
    // Попробуем другой формат
    $en_table = $wpdb->prefix . 'trp_dictionary_en_us';
    $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$en_table'");
}

if (!$table_exists) {
    echo "ERROR: TranslatePress EN dictionary table not found!\n";
    echo "Searching for any trp_dictionary tables...\n";
    $dict_tables = $wpdb->get_results("SHOW TABLES LIKE '%trp_dictionary%'");
    foreach ($dict_tables as $table) {
        echo "Found: " . current((array)$table) . "\n";
    }
    echo "</pre>";
    exit;
}

echo "Using EN table: $en_table\n\n";

// 3. Проверить структуру таблицы
$columns = $wpdb->get_results("DESCRIBE $en_table");
echo "=== Table Structure ===\n";
foreach ($columns as $col) {
    echo "{$col->Field} ({$col->Type})\n";
}
echo "\n";

// 4. Посмотреть существующие переводы для проблемных строк
$problem_strings = [
    'Kohandatud köök Tallinnas',
    'Miks valida just Studioköök',
    'Tere! Olen Julia',
    'Vaadake, mida oleme juba loonud',
    'Fassaadid',
];

echo "=== Checking Existing Translations ===\n";
foreach ($problem_strings as $original) {
    $like_pattern = '%' . $wpdb->esc_like($original) . '%';
    $existing = $wpdb->get_row($wpdb->prepare(
        "SELECT id, original, translated, status FROM $en_table WHERE original LIKE %s LIMIT 1",
        $like_pattern
    ));

    if ($existing) {
        $status_text = $existing->status == 2 ? 'TRANSLATED' : 'NOT_TRANSLATED';
        echo "Found: '{$existing->original}'\n";
        echo "  → EN: '{$existing->translated}' [$status_text]\n\n";
    } else {
        echo "NOT FOUND: '$original'\n\n";
    }
}

// 5. Переводы для добавления (EN)
$translations_en = [
    // Главная страница
    'Kohandatud köök Tallinnas – loome koos teie unistuste köögi!'
        => 'Custom kitchen in Tallinn – let\'s create your dream kitchen together!',
    'Miks valida just Studioköök?'
        => 'Why choose Studioköök?',
    'Tere! Olen Julia – StudioKöök OÜ asutaja ja juht'
        => 'Hello! I\'m Julia – founder and CEO of StudioKöök OÜ',
    'Vaadake, mida oleme juba loonud'
        => 'See what we\'ve already created',
    'Meie blogi'
        => 'Our blog',

    // Страница фасадов
    'Fassaadid'
        => 'Facades',
    'Köögifassaadid'
        => 'Kitchen Facades',
    'mööblifassaadid'
        => 'furniture facades',

    // Galereya
    'Valmis köögid'
        => 'Kitchen Gallery',
];

echo "=== Adding/Updating Translations ===\n";

if (isset($_GET['execute']) && $_GET['execute'] === 'yes') {
    foreach ($translations_en as $original => $translated) {
        // Проверяем существует ли
        $existing = $wpdb->get_row($wpdb->prepare(
            "SELECT id FROM $en_table WHERE original = %s",
            $original
        ));

        if ($existing) {
            // Обновляем перевод
            $wpdb->update(
                $en_table,
                [
                    'translated' => $translated,
                    'status' => 2, // 2 = human translated
                ],
                ['id' => $existing->id],
                ['%s', '%d'],
                ['%d']
            );
            echo "✅ Updated: '$original' → '$translated'\n";
        } else {
            // Вставляем новый (структура зависит от версии TranslatePress)
            echo "⚠️  Not found in DB: '$original'\n";
            echo "   → Translation must be added via WP Admin or page visit first\n";
        }
    }
} else {
    echo "DRY RUN MODE - no changes made.\n";
    echo "Add &execute=yes to URL to actually update translations.\n\n";

    foreach ($translations_en as $original => $translated) {
        echo "Would translate: '$original'\n";
        echo "            → '$translated'\n\n";
    }
}

echo "\n</pre>\n";
echo "<h2>Done!</h2>\n";
echo "<p><a href='?key=DEPLOY_KEY_2026&execute=yes'>Execute translations</a></p>\n";
echo "<p><strong>Remember to delete this file after use!</strong></p>\n";
