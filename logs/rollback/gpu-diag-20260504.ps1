$ErrorActionPreference = 'SilentlyContinue'

Write-Output "===== UNEXPECTED SHUTDOWNS / BUGCHECKS (last 14 days) ====="
Get-WinEvent -FilterHashtable @{LogName='System'; Id=41,1001,6008; StartTime=(Get-Date).AddDays(-14)} |
  Select-Object TimeCreated, Id, ProviderName, @{n='Msg';e={$_.Message.Substring(0,[Math]::Min(220,$_.Message.Length))}} |
  Format-List

Write-Output "`n===== GPU/DISPLAY DRIVER EVENTS (last 30 days, grouped) ====="
Get-WinEvent -FilterHashtable @{LogName='System'; ProviderName='nvlddmkm','igfxcuiservice','amdkmdag','Display','iaStorAVC'; StartTime=(Get-Date).AddDays(-30)} |
  Group-Object ProviderName, Id |
  Sort-Object Count -Descending |
  Select-Object Count, Name |
  Format-Table -AutoSize

Write-Output "`n===== TDR EVENTS (Display Id=4101 = TDR recovery) ====="
Get-WinEvent -FilterHashtable @{LogName='System'; ProviderName='Display'; Id=4101; StartTime=(Get-Date).AddDays(-30)} |
  Select-Object TimeCreated, @{n='Msg';e={$_.Message.Substring(0,[Math]::Min(180,$_.Message.Length))}} |
  Format-List

Write-Output "`n===== RECENT MINIDUMPS ====="
Get-ChildItem 'C:\Windows\Minidump' |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 10 Name, LastWriteTime, @{n='SizeKB';e={[math]::Round($_.Length/1KB,1)}} |
  Format-Table -AutoSize

Write-Output "`n===== LIVEKERNELREPORTS (silent GPU recoveries) ====="
Get-ChildItem 'C:\Windows\LiveKernelReports' -Recurse -Filter '*.dmp' |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 10 Name, LastWriteTime, @{n='SizeKB';e={[math]::Round($_.Length/1KB,1)}} |
  Format-Table -AutoSize

Write-Output "`n===== CURRENT GPU + DRIVER ====="
Get-CimInstance Win32_VideoController |
  Select-Object Name, DriverVersion, DriverDate, AdapterRAM, VideoProcessor |
  Format-List

Write-Output "`n===== CURRENT TDR REGISTRY ====="
Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\GraphicsDrivers' |
  Select-Object TdrLevel, TdrDelay, TdrDdiDelay, TdrLimitCount, TdrLimitTime |
  Format-List

Write-Output "`n===== ROLLBACK ARTIFACTS FROM PREV SESSION ====="
Get-ChildItem 'C:\Users\sorte\.claude\logs\rollback' -Recurse -ErrorAction SilentlyContinue |
  Select-Object FullName, LastWriteTime, @{n='SizeKB';e={[math]::Round($_.Length/1KB,1)}} |
  Format-Table -AutoSize

Write-Output "`n===== UPTIME ====="
$os = Get-CimInstance Win32_OperatingSystem
$boot = $os.LastBootUpTime
"Last boot: $boot"
"Uptime hours: $([math]::Round(((Get-Date) - $boot).TotalHours,1))"
