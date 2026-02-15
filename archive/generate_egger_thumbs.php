<?php
/**
 * Generate thumbnails for 9 Egger decors
 * Upload to /htdocs/generate_egger_thumbs.php via webFTP
 * Run once: https://studiokook.ee/generate_egger_thumbs.php
 * Then DELETE this file from server
 */

// Prevent direct access without secret
if (!isset($_GET['run']) || $_GET['run'] !== 'thumbs2026') {
    die('Access denied. Use ?run=thumbs2026');
}

$base = __DIR__ . '/wp-content/gallery/egger/';
$thumbs_dir = $base . 'thumbs/';

if (!is_dir($thumbs_dir)) {
    mkdir($thumbs_dir, 0755, true);
}

$files = [
    'F206_ST9.jpg',
    'F221_ST87.jpg',
    'F244_ST76.jpg',
    'F267_ST76.jpg',
    'F311_ST87.jpg',
    'H1318_ST10.jpg',
    'H1330_ST10.jpg',
    'U7081_ST76.jpg',
    'U999_ST76.jpg',
];

echo "<pre style='background:#1a1a2e;color:#00ff88;padding:20px;font-family:monospace;'>";
echo "Egger Thumbnails Generator\n";
echo str_repeat('=', 50) . "\n\n";

foreach ($files as $filename) {
    $src_path = $base . $filename;
    $thumb_path = $thumbs_dir . 'thumbs_' . $filename;

    if (!file_exists($src_path)) {
        echo "[ERROR] $filename: source file not found\n";
        continue;
    }

    $src = @imagecreatefromjpeg($src_path);
    if (!$src) {
        echo "[ERROR] $filename: cannot open with GD\n";
        continue;
    }

    $w = imagesx($src);
    $h = imagesy($src);

    // Generate 160px height thumbnail (proportional width)
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
echo "DONE — 9 thumbnails generated\n";
echo "DELETE this PHP file from server now!\n";
echo "</pre>";
