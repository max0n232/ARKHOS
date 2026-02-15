<?php
/**
 * Check hreflang snippet status
 * Usage: ?run=checkhref2026
 */

require_once('wp-load.php');

if (!isset($_GET['run']) || $_GET['run'] !== 'checkhref2026') {
    die('Usage: ?run=checkhref2026');
}

echo "<h1>Hreflang Snippet Check</h1>";
echo "<style>body{font-family:system-ui;max-width:900px;margin:0 auto;padding:20px;}.ok{color:green;}.fail{color:red;}pre{background:#f5f5f5;padding:15px;border-radius:8px;overflow-x:auto;}</style>";

global $wpdb;
$snippets_table = $wpdb->prefix . 'snippets';

// Check snippet
$snippet = $wpdb->get_row("SELECT * FROM $snippets_table WHERE name = 'Hreflang Tags Output'");

if ($snippet) {
    echo "<p class='ok'>✅ Snippet exists in database</p>";
    echo "<p>ID: {$snippet->id}</p>";
    echo "<p>Active: " . ($snippet->active ? "<span class='ok'>YES</span>" : "<span class='fail'>NO</span>") . "</p>";
    echo "<p>Scope: {$snippet->scope}</p>";

    echo "<details><summary>View code</summary><pre>" . htmlspecialchars($snippet->code) . "</pre></details>";
} else {
    echo "<p class='fail'>❌ Snippet NOT found!</p>";
}

// Check if function exists
echo "<h2>Function check:</h2>";
if (function_exists('studiokook_add_hreflang_tags')) {
    echo "<p class='ok'>✅ Function studiokook_add_hreflang_tags() EXISTS</p>";

    echo "<h3>Test output:</h3>";
    echo "<pre>";
    studiokook_add_hreflang_tags();
    echo "</pre>";
} else {
    echo "<p class='fail'>❌ Function does NOT exist - snippet may have PHP error</p>";
}

// Check wp_head hooks
echo "<h2>wp_head hooks check:</h2>";
global $wp_filter;
if (isset($wp_filter['wp_head'])) {
    $found = false;
    foreach ($wp_filter['wp_head']->callbacks as $priority => $callbacks) {
        foreach ($callbacks as $callback) {
            $func_name = '';
            if (is_string($callback['function'])) {
                $func_name = $callback['function'];
            } elseif (is_array($callback['function'])) {
                $func_name = is_object($callback['function'][0])
                    ? get_class($callback['function'][0]) . '::' . $callback['function'][1]
                    : $callback['function'][0] . '::' . $callback['function'][1];
            }

            if (strpos($func_name, 'hreflang') !== false || strpos($func_name, 'studiokook_add_hreflang') !== false) {
                echo "<p class='ok'>✅ Found: $func_name at priority $priority</p>";
                $found = true;
            }
        }
    }
    if (!$found) {
        echo "<p class='fail'>❌ No hreflang function in wp_head hooks</p>";
    }
}

echo "<hr><p style='color:red;'>Delete after use</p>";
?>
