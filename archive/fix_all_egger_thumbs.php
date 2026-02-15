<?php
/**
 * Fix ALL Egger thumbnails:
 * 1. Rename 9 existing: thumbs_*.jpg → thumbs-*.jpg
 * 2. Generate 2 missing: F8001_ST9.jpg, W1101_ST76.jpg
 *
 * Upload to /htdocs/fix_all_egger_thumbs.php via webFTP
 * Run: https://studiokook.ee/fix_all_egger_thumbs.php?run=fix2026
 * Then DELETE this file
 */

if (!isset($_GET['run']) || $_GET['run'] !== 'fix2026') {
    die('Access denied. Use ?run=fix2026');
}

$base = __DIR__ . '/wp-content/gallery/egger/';
$thumbs_dir = $base . 'thumbs/';

if (!is_dir($thumbs_dir)) {
    mkdir($thumbs_dir, 0755, true);
}

echo "<pre style='background:#1a1a2e;color:#00ff88;padding:20px;font-family:monospace;'>";
echo "Fix ALL Egger Thumbnails\n";
echo str_repeat('=', 50) . "\n\n";

// ========================================
// STEP 1: Rename existing thumbs_ → thumbs-
// ========================================
echo "STEP 1: Rename underscore → dash\n";
echo str_repeat('-', 50) . "\n";

$existing = glob($thumbs_dir . 'thumbs_*.jpg');
foreach ($existing as $old_path) {
    $basename = basename($old_path);
    $new_basename = str_replace('thumbs_', 'thumbs-', $basename);
    $new_path = $thumbs_dir . $new_basename;

    if (rename($old_path, $new_path)) {
        echo "[OK] $basename → $new_basename\n";
    } else {
        echo "[ERROR] Failed to rename $basename\n";
    }
}

// ========================================
// STEP 2: Generate missing F8001 + W1101
// ========================================
echo "\nSTEP 2: Generate missing thumbnails\n";
echo str_repeat('-', 50) . "\n";

$missing = ['F8001_ST9.jpg', 'W1101_ST76.jpg'];

foreach ($missing as $filename) {
    $src_path = $base . $filename;
    $thumb_path = $thumbs_dir . 'thumbs-' . $filename;

    if (!file_exists($src_path)) {
        echo "[SKIP] $filename: source not found\n";
        continue;
    }

    if (file_exists($thumb_path)) {
        echo "[SKIP] $filename: thumbnail already exists\n";
        continue;
    }

    $src = @imagecreatefromjpeg($src_path);
    if (!$src) {
        echo "[ERROR] $filename: cannot open with GD\n";
        continue;
    }

    $w = imagesx($src);
    $h = imagesy($src);

    // 160px height thumbnail
    $th_h = 160;
    $th_w = intval($w * $th_h / max($h, 1));
    if ($th_w < 1) $th_w = 160;

    $thumb = imagecreatetruecolor($th_w, $th_h);
    imagecopyresampled($thumb, $src, 0, 0, 0, 0, $th_w, $th_h, $w, $h);
    imagejpeg($thumb, $thumb_path, 85);
    imagedestroy($thumb);
    imagedestroy($src);

    $fsize = filesize($thumb_path);
    echo "[OK] $filename: thumbnail created {$th_w}x{$th_h}, " . round($fsize/1024,1) . "KB\n";
}

echo "\n" . str_repeat('=', 50) . "\n";
echo "DONE — All 11 thumbnails fixed\n";
echo "DELETE this PHP file now!\n";
echo "</pre>";
