$claudeDir = "$env:USERPROFILE\.claude"
$garbage = Get-ChildItem $claudeDir -File | Where-Object { $_.Name.StartsWith('C:') -or $_.Name.StartsWith('Users') }
$total = 0
foreach ($file in $garbage) {
    $total += $file.Length
    Remove-Item $file.FullName -Force
    Write-Host "Deleted: $($file.Name)"
}
Write-Host "Total freed: $([math]::Round($total/1MB, 2)) MB"
