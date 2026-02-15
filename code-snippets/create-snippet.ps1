$code = Get-Content 'C:\Users\sorte\Desktop\Studiokook\code-snippets\09-seo-meta-simple.php' -Raw
$code = $code -replace '<\?php', ''
$code = $code.Trim()

$body = @{
    name = 'SEO Meta v5 Clean'
    code = $code
    scope = 'front-end'
    active = $true
} | ConvertTo-Json -Depth 3

$cred = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes('admin:9hDv Tkk0 55Eh WqkD fo5s K3oA'))

try {
    $result = Invoke-RestMethod -Uri 'https://studiokook.ee/wp-json/code-snippets/v1/snippets' -Method Post -Headers @{Authorization="Basic $cred"} -ContentType 'application/json; charset=utf-8' -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
    $result | ConvertTo-Json
} catch {
    Write-Host "Error: $_"
    Write-Host $_.Exception.Response
}
