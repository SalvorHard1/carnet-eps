# Lance le Carnet EPS : démarre le petit serveur local (s'il ne tourne pas déjà)
# puis ouvre l'appli dans sa propre fenêtre Edge.
$url = 'http://localhost:8080/'

function Test-Serveur {
  try { Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 1 -Method Head | Out-Null; $true } catch { $false }
}

if (-not (Test-Serveur)) {
  Start-Process powershell -WindowStyle Hidden -ArgumentList @(
    '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$PSScriptRoot\serve.ps1`"")
  for ($i = 0; $i -lt 20 -and -not (Test-Serveur); $i++) { Start-Sleep -Milliseconds 250 }
}

$edge = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
if (Test-Path $edge) { Start-Process $edge "--app=$url" } else { Start-Process $url }
