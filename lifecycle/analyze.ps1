$claudeDir = "$env:USERPROFILE\.claude"
Get-ChildItem $claudeDir -Directory | ForEach-Object {
    $name = $_.Name
    $files = (Get-ChildItem $_.FullName -Recurse -File -ErrorAction SilentlyContinue)
    $count = $files.Count
    $size = ($files | Measure-Object -Property Length -Sum).Sum
    $sizeMB = [math]::Round($size / 1MB, 2)
    Write-Host "$name : $count files ($sizeMB MB)"
}
