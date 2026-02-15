const https = require('https');

// Remove duplicate hreflang via output buffer
const phpCode = `// Remove duplicate hreflang tags (ru-RU when ru exists, en-GB when en exists)
add_action('template_redirect', 'studiokook_hreflang_cleanup_start', 0);

function studiokook_hreflang_cleanup_start() {
    if (is_admin()) return;

    ob_start(function($html) {
        // Remove ru-RU (keep only ru)
        $html = preg_replace('/<link[^>]*hreflang=["\\'"]ru-RU["\\'"][^>]*>\\s*/i', '', $html);

        // Remove en-GB (keep only en)
        $html = preg_replace('/<link[^>]*hreflang=["\\'"]en-GB["\\'"][^>]*>\\s*/i', '', $html);

        return $html;
    });
}`;

const data = JSON.stringify({
    name: 'Remove Hreflang Duplicates',
    desc: 'Removes ru-RU and en-GB hreflang tags (keeps ru and en)',
    code: phpCode,
    tags: ['seo', 'hreflang'],
    scope: 'global',
    priority: 1,
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
