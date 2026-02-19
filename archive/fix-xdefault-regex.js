const https = require('https');

// Fixed regex for x-default
const phpCode = `// Add x-default hreflang tag pointing to Estonian (default) version
add_action('wp_head', 'studiokook_add_xdefault_hreflang', 5);

function studiokook_add_xdefault_hreflang() {
    if (is_admin()) return;

    // Get current URI
    $current_uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '/';

    // Remove language prefix (ru/, en/, fi/) to get Estonian version
    // Pattern: starts with /ru/, /en/, or /fi/ - remove that prefix
    $et_uri = preg_replace('#^/(ru|en|fi)(/.*)?$#', '$2', $current_uri);

    // If result is empty, use /
    if (empty($et_uri)) {
        $et_uri = '/';
    }

    $et_url = home_url($et_uri);

    echo '<link rel="alternate" hreflang="x-default" href="' . esc_url($et_url) . '" />' . PHP_EOL;
}`;

const data = JSON.stringify({
    name: 'Add x-default Hreflang',
    desc: 'Adds x-default hreflang tag pointing to Estonian version',
    code: phpCode,
    tags: ['seo', 'hreflang'],
    scope: 'global',
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
