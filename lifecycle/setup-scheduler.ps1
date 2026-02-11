# Claude Cleanup - Windows Task Scheduler Setup
# Run as Administrator: powershell -ExecutionPolicy Bypass -File setup-scheduler.ps1

$taskName = "ClaudeCleanup"
$nodePath = (Get-Command node -ErrorAction SilentlyContinue).Source
$cleanupScript = "$env:USERPROFILE\.claude\lifecycle\cleanup.js"

# Check if node is available
if (-not $nodePath) {
    Write-Host "ERROR: Node.js not found in PATH" -ForegroundColor Red
    exit 1
}

# Check if cleanup script exists
if (-not (Test-Path $cleanupScript)) {
    Write-Host "ERROR: cleanup.js not found at $cleanupScript" -ForegroundColor Red
    exit 1
}

Write-Host "Setting up Claude Cleanup scheduled task..." -ForegroundColor Cyan

# Remove existing task if present
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "Removing existing task..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Create action
$action = New-ScheduledTaskAction `
    -Execute $nodePath `
    -Argument "`"$cleanupScript`" --all --force" `
    -WorkingDirectory "$env:USERPROFILE\.claude"

# Create trigger - Daily at 3:00 AM
$trigger = New-ScheduledTaskTrigger -Daily -At 3:00AM

# Create settings
$settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -DontStopIfGoingOnBatteries `
    -AllowStartIfOnBatteries `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 10)

# Create principal (run as current user)
$principal = New-ScheduledTaskPrincipal `
    -UserId $env:USERNAME `
    -LogonType Interactive `
    -RunLevel Limited

# Register task
try {
    Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -Description "Daily cleanup of Claude Code temporary files" `
        -Force

    Write-Host "`nTask created successfully!" -ForegroundColor Green
    Write-Host "Task Name: $taskName"
    Write-Host "Schedule: Daily at 3:00 AM"
    Write-Host "Action: node cleanup.js --all --force"
    Write-Host "`nTo run manually: schtasks /run /tn `"$taskName`"" -ForegroundColor Cyan
    Write-Host "To delete: schtasks /delete /tn `"$taskName`" /f" -ForegroundColor Cyan

} catch {
    Write-Host "ERROR: Failed to create task: $_" -ForegroundColor Red
    Write-Host "Try running PowerShell as Administrator" -ForegroundColor Yellow
    exit 1
}

# Verify
$task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($task) {
    Write-Host "`nVerification: Task exists and is $($task.State)" -ForegroundColor Green
} else {
    Write-Host "`nVerification: FAILED - Task not found" -ForegroundColor Red
}
