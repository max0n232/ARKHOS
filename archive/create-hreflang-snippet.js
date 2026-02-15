const https = require('https');

const phpCode = `add_filter('trp_hreflang_language_to_locale', 'studiokook_fix_hreflang_codes', 10, 3);

function studiokook_fix_hreflang_codes($hreflang, $language_code, $published_languages) {
    // Force short codes instead of regional variants
    $mappings = [
        'ru' => 'ru',      // Remove -RU suffix
        'en' => 'en',      // Remove -GB suffix
        'fi' => 'fi',
        'et' => 'et',
    ];

    if (isset($mappings[$language_code])) {
        return $mappings[$language_code];
    }
    return $hreflang;
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
    desc: 'Removes duplicate hreflang tags (ru-RU/ru, en-GB/en) and adds x-default',
    code: phpCode,
    tags: ['seo', 'hreflang'],
    scope: 'front-end',
    priority: 10,
    active: true
});

const options = {
    hostname: 'studiokook.ee',
    port: 443,
    path: '/wp-json/code-snippets/v1/snippets',
    method: 'POST',
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
