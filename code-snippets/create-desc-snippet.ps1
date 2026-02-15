$code = @'
function sk_desc_get_lang() {
    $uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '';
    if (preg_match('#^/(ru|en|fi)(/|$)#', $uri, $m)) {
        return $m[1];
    }
    return 'et';
}

function sk_desc_get_page() {
    $uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '';
    $path = preg_replace('#^/(ru|en|fi)#', '', $uri);
    $path = trim($path, '/');
    if (empty($path)) return '';
    $parts = explode('/', $path);
    return $parts[0];
}

function sk_desc_filter($desc) {
    $lang = sk_desc_get_lang();
    if ($lang === 'et') return $desc;

    $descs = array(
        '' => array(
            'ru' => 'Kuhni na zakaz. Kuhonnaya mebel v Tallinne. +372 55 525 143.',
            'en' => 'Custom kitchens in Tallinn. Austrian hardware. +372 55 525 143.',
            'fi' => 'Mittatilauskeittot Tallinnassa. +372 55 525 143.',
        ),
    );

    $page = sk_desc_get_page();
    if (isset($descs[$page][$lang])) {
        return $descs[$page][$lang];
    }
    return $desc;
}

add_filter('wpseo_metadesc', 'sk_desc_filter', 999999);
add_filter('wpseo_opengraph_desc', 'sk_desc_filter', 999999);
'@

$body = @{
    name = 'SEO Description Test'
    code = $code
    scope = 'front-end'
    active = $true
} | ConvertTo-Json -Depth 3

$cred = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes('admin:9hDv Tkk0 55Eh WqkD fo5s K3oA'))

try {
    $result = Invoke-RestMethod -Uri 'https://studiokook.ee/wp-json/code-snippets/v1/snippets' -Method Post -Headers @{Authorization="Basic $cred"} -ContentType 'application/json; charset=utf-8' -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
    $result | ConvertTo-Json
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host $reader.ReadToEnd()
    }
}
