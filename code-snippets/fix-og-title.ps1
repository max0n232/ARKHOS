$code = @'
add_filter('wpseo_opengraph_title', function($title) {
    return get_the_title() ?: $title;
}, 999999);
'@

$body = @{
    name = 'Fix OG Title from Page Title'
    code = $code
    scope = 'front-end'
    active = $true
} | ConvertTo-Json

$cred = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes('admin:9hDv Tkk0 55Eh WqkD fo5s K3oA'))

Invoke-RestMethod -Uri 'https://studiokook.ee/wp-json/code-snippets/v1/snippets' -Method Post -Headers @{Authorization="Basic $cred"} -ContentType 'application/json' -Body $body
