const https = require('https');

// LocalBusiness schema for contact page
const phpCode = `// Add LocalBusiness/FurnitureStore schema on contact pages
add_action('wp_head', 'studiokook_local_business_schema', 10);

function studiokook_local_business_schema() {
    // Only on contact pages (all language versions)
    $uri = $_SERVER['REQUEST_URI'];
    if (!preg_match('#/(kontakt|contact)/?$#i', $uri) && !preg_match('#^/(ru|en|fi)?/?kontakt/?$#', $uri)) {
        return;
    }

    $schema = [
        '@context' => 'https://schema.org',
        '@type' => 'FurnitureStore',
        'name' => 'Studioköök OÜ',
        'image' => 'https://studiokook.ee/wp-content/uploads/2024/06/studiokook.jpg',
        'url' => 'https://studiokook.ee/',
        'telephone' => '+372 55 525 143',
        'email' => 'julia@studiokook.ee',
        'address' => [
            '@type' => 'PostalAddress',
            'streetAddress' => 'Paldiski mnt 21',
            'addressLocality' => 'Tallinn',
            'postalCode' => '10137',
            'addressCountry' => 'EE'
        ],
        'geo' => [
            '@type' => 'GeoCoordinates',
            'latitude' => 59.4370,
            'longitude' => 24.7536
        ],
        'openingHoursSpecification' => [
            '@type' => 'OpeningHoursSpecification',
            'dayOfWeek' => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            'opens' => '09:00',
            'closes' => '16:30'
        ],
        'priceRange' => '€€€',
        'sameAs' => [
            'https://www.facebook.com/studiokook'
        ]
    ];

    echo '<script type="application/ld+json">' . json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . '</script>' . PHP_EOL;
}`;

const data = JSON.stringify({
    name: 'LocalBusiness Schema',
    desc: 'Adds FurnitureStore structured data on contact pages',
    code: phpCode,
    tags: ['seo', 'schema'],
    scope: 'global',
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
