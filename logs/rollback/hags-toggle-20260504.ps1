$ErrorActionPreference = 'Stop'

$key = 'HKLM:\SYSTEM\CurrentControlSet\Control\GraphicsDrivers'
$name = 'HwSchMode'
$backupDir = 'C:\Users\sorte\.claude\logs\rollback'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupFile = Join-Path $backupDir "GraphicsDrivers-HwSchMode-$stamp.reg"

Write-Output "===== BEFORE ====="
$before = Get-ItemProperty -Path $key -Name $name -ErrorAction SilentlyContinue
if ($before) {
  "HwSchMode = $($before.HwSchMode)  (1=off, 2=on)"
} else {
  "HwSchMode not set (HAGS controlled by Settings UI default)"
}

Write-Output "`n===== BACKUP ====="
reg export 'HKLM\SYSTEM\CurrentControlSet\Control\GraphicsDrivers' $backupFile /y | Out-Null
"Saved: $backupFile"

Write-Output "`n===== APPLY: HwSchMode=1 (HAGS OFF) ====="
Set-ItemProperty -Path $key -Name $name -Value 1 -Type DWord
$after = Get-ItemProperty -Path $key -Name $name
"HwSchMode = $($after.HwSchMode)  (verified)"

Write-Output "`nNOTE: requires reboot to take effect."
Write-Output "ROLLBACK: reg import `"$backupFile`""
