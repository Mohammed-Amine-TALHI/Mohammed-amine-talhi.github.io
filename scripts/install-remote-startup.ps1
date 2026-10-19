$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$node = (Get-Command node -ErrorAction Stop).Source
$script = Join-Path $PSScriptRoot 'remote-server.mjs'
$taskName = 'Portfolio Admin - Tailscale'

$action = New-ScheduledTaskAction -Execute $node -Argument ('"' + $script + '"') -WorkingDirectory $root
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -RestartCount 99 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit (New-TimeSpan -Days 3650) -StartWhenAvailable

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description 'Keeps the portfolio admin available on the private Tailscale address.' -Force | Out-Null
Start-ScheduledTask -TaskName $taskName

Write-Host "Installed and started '$taskName'." -ForegroundColor Green
Write-Host 'The admin will start automatically whenever you sign in to Windows.'
