const https = require('https');

// New approach: use output buffer to clean up duplicates
const phpCode = `// Remove duplicate hreflang tags via output buffer
add_action('template_redirect', 'studiokook_start_hreflang_buffer', 1);

function studiokook_start_hreflang_buffer() {
    ob_start('studiokook_clean_hreflang');
}

function studiokook_clean_hreflang($html) {
    // Remove ru-RU (keep only ru)
    $html = preg_replace('/<link[^>]*hreflang=["\\'"]ru-RU["\\'"][^>]*>\\s*/i', '', $html);

    // Remove en-GB (keep only en)
    $html = preg_replace('/<link[^>]*hreflang=["\\'"]en-GB["\\'"][^>]*>\\s*/i', '', $html);

    return $html;
}

// Add x-default pointing to Estonian version
add_action('wp_head', 'studiokook_add_xdefault', 1);

function studiokook_add_xdefault() {
    $current_url = home_url($_SERVER['REQUEST_URI']);

    // Get Estonian (default) URL by removing language prefix
    $et_url = preg_replace('#/(ru|en|fi)/#', '/', $current_url);
    $et_url = preg_replace('#/(ru|en|fi)$#', '/', $et_url);

    echo '<link rel="alternate" hreflang="x-default" href="' . esc_url($et_url) . '">' . "\\n";
}`;

const data = JSON.stringify({
    name: 'Fix Hreflang SEO',
    desc: 'Removes duplicate hreflang tags (ru-RU, en-GB) and adds x-default',
    code: phpCode,
    tags: ['seo', 'hreflang'],
    scope: 'front-end',
    priority: 10,
    active: true
});

const options = {
    hostname: 'studiokook.ee',
    port: 443,
    path: '/wp-json/code-snippets/v1/snippets/171',
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': 'Basic ' + Buffer.from('admin:9hDv Tkk0 55Eh WqkD fo5s K3oA').toString('base64')
    }
};

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => console.log(body));
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
