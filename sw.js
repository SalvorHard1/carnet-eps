// Service worker : permet à l'appli de fonctionner sans internet.
// Stratégie « réseau d'abord » : tant que le serveur répond, on sert toujours les fichiers les plus récents
// (les mises à jour s'appliquent donc d'elles-mêmes) ; sinon on se rabat sur la copie en cache (hors ligne).
// Pour publier une mise à jour : augmenter VERSION (et VERSION_APP dans app.js).
const VERSION = '0.33.0';
const CACHE = 'carnet-eps-' + VERSION;
const FICHIERS = [
  './', 'index.html', 'style.css', 'donnees.js', 'cle.js', 'referentiel.js', 'entrainement.js', 'app.js',
  'manifest.webmanifest', 'icon.svg', 'icon-180.png', 'icon-192.png', 'icon-512.png',
];

self.addEventListener('install', e => {
  // Chaque fichier est mis en cache séparément : un fichier indisponible ne bloque plus l'installation.
  // La nouvelle version s'active tout de suite, sans attendre un clic (les anciennes versions de l'appli
  // se rechargent alors d'elles-mêmes sur la nouvelle).
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.allSettled(FICHIERS.map(f => c.add(new Request(f, { cache: 'reload' })))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(cles => Promise.all(cles.filter(c => c.startsWith('carnet-eps-') && c !== CACHE).map(c => caches.delete(c))))
      .then(() => self.clients.claim()));
});

self.addEventListener('message', e => {
  if (e.data === 'maj') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    try {
      const controle = new AbortController();
      const minuteur = setTimeout(() => controle.abort(), 4000);
      const rep = await fetch(req, { cache: 'no-store', signal: controle.signal });
      clearTimeout(minuteur);
      if (rep.ok) {
        const copie = rep.clone(); // copie faite tout de suite, avant que la page ne lise la réponse
        caches.open(CACHE).then(c => c.put(req, copie)).catch(() => {});
      }
      return rep;
    } catch {
      const enCache = await caches.match(req, { ignoreSearch: true });
      if (enCache) return enCache;
      if (req.mode === 'navigate') return (await caches.match('./')) || Response.error();
      return Response.error();
    }
  })());
});
