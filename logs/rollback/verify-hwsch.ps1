$v = Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\GraphicsDrivers' -Name HwSchMode -ErrorAction SilentlyContinue
if ($v) { "HwSchMode = $($v.HwSchMode)  (1=OFF, 2=ON)" } else { "HwSchMode = NOT SET" }
