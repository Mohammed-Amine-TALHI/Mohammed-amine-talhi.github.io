Restore it now
Open PowerShell and run:
Start-ScheduledTask -TaskName "Portfolio Admin - Tailscale"
Start-Sleep -Seconds 5
curl.exe http://127.0.0.1:5173/__admin/ping
The expected response is:
{"ok":true}
Then test the private URL:
curl.exe https://msi-gs66.tail94717c.ts.net:8445/__admin/ping
Use this exact address on the phone:
Open Portfolio Admin
The URL without :8445 currently belongs to another local app.
If the scheduled task stops again
Run the server in the foreground to see the actual error:
cd "C:\Users\amine\Desktop\PFE\Candidatures\Portfolio"
npm run remote
Keep that window open. If it says Vite is ready, the website should work immediately.
Permanent battery fix
In [install-remote-startup.ps1](C:/Users/amine/Desktop/PFE/Candidatures/Portfolio/scripts/install-remote-startup.ps1), add these options to New-ScheduledTaskSettingsSet:
-AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Then reinstall the task from an Administrator PowerShell:
cd "C:\Users\amine\Desktop\PFE\Candidatures\Portfolio"
npm run remote:install
Troubleshooting order
1. Check Tailscale:
& "C:\Program Files\Tailscale\tailscale.exe" status
2. Check the portfolio backend:
curl.exe http://127.0.0.1:5173/__admin/ping
3. Check Tailscale Serve:
& "C:\Program Files\Tailscale\tailscale.exe" serve status
4. Check the scheduled task:
schtasks.exe /Query /TN "Portfolio Admin - Tailscale" /V /FO LIST
5. Check the private HTTPS endpoint:
curl.exe https://msi-gs66.tail94717c.ts.net:8445/__admin/ping