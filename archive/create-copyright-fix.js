const https = require('https');

// Fix copyright year via output buffer
const phpCode = `// Auto-update copyright year in footer
add_action('template_redirect', 'studiokook_fix_copyright_year', 1);

function studiokook_fix_copyright_year() {
    if (is_admin()) return;

    ob_start(function($html) {
        // Replace any year 2020-2025 in copyright with current year
        $current_year = date('Y');
        $html = preg_replace('/©\\s*(20[0-2][0-9])/', '© ' . $current_year, $html);
        return $html;
    });
}`;

const data = JSON.stringify({
    name: 'Auto Copyright Year',
    desc: 'Automatically updates copyright year to current year',
    code: phpCode,
    tags: ['seo', 'footer'],
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
