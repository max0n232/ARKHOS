const https = require('https');

// Simpler test - just add x-default at lower priority (after TranslatePress)
const phpCode = `// Add x-default hreflang tag
add_action('wp_head', 'studiokook_add_xdefault_hreflang', 5);

function studiokook_add_xdefault_hreflang() {
    // Get current URL
    $current_uri = $_SERVER['REQUEST_URI'];

    // Remove language prefix to get Estonian (default) version
    $et_uri = preg_replace('#^/(ru|en|fi)(/|$)#', '/', $current_uri);

    $et_url = home_url($et_uri);

    echo '<link rel="alternate" hreflang="x-default" href="' . esc_url($et_url) . '" />' . PHP_EOL;
}`;

const data = JSON.stringify({
    name: 'Add x-default Hreflang',
    desc: 'Adds x-default hreflang tag pointing to Estonian version',
    code: phpCode,
    tags: ['seo', 'hreflang'],
    scope: 'front-end',
    priority: 5,
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
