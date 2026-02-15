<?php
/**
 * Rename thumbnails: thumbs_FILENAME.jpg → thumbs-FILENAME.jpg
 * Upload to /htdocs/rename_egger_thumbs.php via webFTP
 * Run once: https://studiokook.ee/rename_egger_thumbs.php?run=rename2026
 * Then DELETE this file
 */

if (!isset($_GET['run']) || $_GET['run'] !== 'rename2026') {
    die('Access denied. Use ?run=rename2026');
}

$thumbs_dir = __DIR__ . '/wp-content/gallery/egger/thumbs/';

if (!is_dir($thumbs_dir)) {
    die('Thumbs directory not found');
}

$files = glob($thumbs_dir . 'thumbs_*.jpg');

echo "<pre style='background:#1a1a2e;color:#00ff88;padding:20px;font-family:monospace;'>";
echo "Rename Egger Thumbnails: underscore → dash\n";
echo str_repeat('=', 50) . "\n\n";

foreach ($files as $old_path) {
    $basename = basename($old_path);
    $new_basename = str_replace('thumbs_', 'thumbs-', $basename);
    $new_path = $thumbs_dir . $new_basename;

    if (rename($old_path, $new_path)) {
        echo "[OK] $basename → $new_basename\n";
    } else {
        echo "[ERROR] Failed to rename $basename\n";
    }
}

echo "\n" . str_repeat('=', 50) . "\n";
echo "DONE — DELETE this PHP file now!\n";
echo "</pre>";
