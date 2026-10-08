# Petit serveur local pour tester l'appli : http://localhost:8080/
# Lancer :  powershell -ExecutionPolicy Bypass -File serve.ps1
param([int]$Port = 8080)

$racine = $PSScriptRoot
$types = @{
  '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.css' = 'text/css; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'; '.webmanifest' = 'application/manifest+json; charset=utf-8'; '.svg' = 'image/svg+xml'; '.png' = 'image/png'
}

$serveur = [System.Net.HttpListener]::new()
$serveur.Prefixes.Add("http://localhost:$Port/")
$serveur.Start()
Write-Host "Carnet EPS : http://localhost:$Port/"

try {
  while ($serveur.IsListening) {
    $ctx = $serveur.GetContext()
    $chemin = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
    if ($chemin -eq '') { $chemin = 'index.html' }
    $fichier = [IO.Path]::GetFullPath((Join-Path $racine $chemin))
    $rep = $ctx.Response
    try {
      if ($fichier.StartsWith($racine + [IO.Path]::DirectorySeparatorChar) -and (Test-Path $fichier -PathType Leaf)) {
        $octets = [IO.File]::ReadAllBytes($fichier)
        $ext = [IO.Path]::GetExtension($fichier).ToLower()
        $rep.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' }
        $rep.Headers.Add('Cache-Control', 'no-cache')
        $rep.ContentLength64 = $octets.Length
        if ($ctx.Request.HttpMethod -ne 'HEAD') { $rep.OutputStream.Write($octets, 0, $octets.Length) }
      } else {
        $rep.StatusCode = 404
      }
    } catch {
      Write-Host "Erreur sur /$chemin : $($_.Exception.Message)"
    } finally {
      $rep.Close()
    }
  }
} finally {
  $serveur.Stop()
}
