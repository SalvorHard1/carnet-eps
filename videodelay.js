'use strict';
// Outil « 🎥 Vidéo-delay » (Outils › Mesures) : la caméra de l'appareil, affichée avec quelques secondes de retard
// pour que l'élève voie son geste juste après l'avoir fait ; pause, image par image, et tracés (ligne, cercle, angle,
// verticale, horizontale) pour analyser une posture.
// Données personnelles (images d'élèves) : rien n'est enregistré nulle part. Les images sont compressées (JPEG) et
// gardées seulement en mémoire vive, sur une durée glissante réglable (10 s à 1 min) : au-delà, elles sont effacées.
// Tout est effacé en quittant l'outil, quand l'appli passe en arrière-plan ou se verrouille. Pas d'enregistrement,
// pas d'export, pas de capture. Accès protégé par le mot de passe du carnet ; jamais proposé en mode élève.

OUTILS.push({ id: 'video', famille: 'mesures', icone: '🎥', nom: 'Vidéo-delay', info: 'Se voir en différé, tracer des angles — rien n’est enregistré', eleve: false });

const QUALITES_VIDEO = {
  legere: { nom: 'Légère (petite tablette)', largeur: 480, ips: 12, jpeg: 0.6 },
  normale: { nom: 'Normale', largeur: 640, ips: 20, jpeg: 0.7 },
  haute: { nom: 'Haute (ordinateur récent)', largeur: 960, ips: 25, jpeg: 0.75 },
};
const CONSERVATIONS_VIDEO = [10, 20, 30, 45, 60];
const DELAIS_VIDEO = [2, 3, 5, 8, 10, 15, 20, 30, 45];
const OUTILS_TRACE = [['', '✋ Déplacer'],['ligne', '╱ Ligne'], ['cercle', '◯ Cercle'], ['angle', '∠ Angle'], ['verticale', '┃ Verticale'], ['horizontale', '━ Horizontale']];

const cfgVideo = () => (etatOutils.video ??= { delai: 5, conservation: 30, qualite: 'normale', camera: 'environment', miroir: false, trace: '' });

// État en mémoire seulement (jamais sauvegardé) :
const vd = {
  deverrouille: false, flux: null, source: null, capture: null, // caméra
  images: [], // [{ t, blob, taille }] : images compressées, de la plus ancienne à la plus récente
  enCompression: 0, derniereCapture: 0, boucle: null,
  pause: null, // { t, image } : image figée (pause), ou null
  affichee: -1, decodage: false, absentDepuis: 0, ecranCourant: null,
  traces: [], enCours: null, // tracés : coordonnées de 0 à 1 (indépendantes de la taille de l'écran)
  deplace: null, // tracé tenu au doigt (✋ Déplacer) : { trace, point, depart, avant }
};

/* ---------- Affichage ---------- */

function htmlVideo() {
  if (enModeEleve()) return '<p class="aide">Outil réservé au professeur.</p>';
  if (!vd.deverrouille) {
    return Donnees.meta().temoinMdp ? `
      <form class="acces-video" data-vd-acces>
        <p>🔒 Outil réservé à l’enseignant : tape le mot de passe du carnet.</p>
        <input type="password" name="mdp" autocomplete="current-password" required aria-label="Mot de passe du carnet" placeholder="Mot de passe">
        <button class="primaire gros" type="submit">Ouvrir l’outil</button>
        <p class="erreur-verrou" data-vd-erreur hidden></p>
      </form>
      ${htmlRgpdVideo()}`
      : `<p class="aide">⚠ Cet outil est protégé par le mot de passe du carnet : fais d’abord une fois « Enregistrer sur la clé »
        ou « Récupérer depuis la clé » sur cet appareil.</p>${htmlRgpdVideo()}`;
  }
  const cfg = cfgVideo(), q = QUALITES_VIDEO[cfg.qualite] || QUALITES_VIDEO.normale;
  const opt = (liste, val, nom) => liste.map(v => `<option value="${v}" ${v === val ? 'selected' : ''}>${nom(v)}</option>`).join('');
  return `
    <div class="ligne reglage-outil reglages-video">
      <label class="etroit">Retard<select data-vd-champ="delai">${opt(DELAIS_VIDEO.filter(x => x < cfg.conservation), cfg.delai, x => x + ' s')}</select></label>
      <label>🧹 Effacement après<select data-vd-champ="conservation">${opt(CONSERVATIONS_VIDEO, cfg.conservation, x => (x === 60 ? '1 min' : x + ' s'))}</select></label>
      <label>Caméra<select data-vd-champ="camera">${opt(['environment', 'user'], cfg.camera, x => (x === 'user' ? 'Avant (selfie)' : 'Arrière'))}</select></label>
      <label>Qualité<select data-vd-champ="qualite">${opt(Object.keys(QUALITES_VIDEO), cfg.qualite, x => QUALITES_VIDEO[x].nom)}</select></label>
      <label class="case"><input type="checkbox" data-vd-champ="miroir" ${cfg.miroir ? 'checked' : ''}><span>Effet miroir</span></label>
    </div>
    <div class="ecran-video${vd.pause ? ' en-pause' : ''}">
      <canvas class="image-video${cfg.miroir ? ' miroir' : ''}" data-vd-ecran width="${q.largeur}" height="${Math.round(q.largeur * 9 / 16)}"></canvas>
      <canvas class="traces-video actif${cfg.trace ? '' : ' deplacer'}" data-vd-traces></canvas>
      <div class="bandeau-video" data-o-bloc="video" data-arg="" data-html="1">${BLOCS_DIRECTS.video()}</div>
    </div>
    <div class="barre-temps-video" data-vd-barre ${vd.images.length > 1 ? '' : 'hidden'}>
      <button data-vd="arriere" title="Image précédente" aria-label="Image précédente">⏮</button>
      <input type="range" data-vd-temps min="0" max="1" step="1" value="1" aria-label="Revenir en arrière dans la vidéo">
      <button data-vd="avant" title="Image suivante" aria-label="Image suivante">⏭</button>
      <span class="position-video" data-vd-position></span>
    </div>
    <div class="commandes-video">
      ${vd.flux ? '<button class="danger tres-gros" data-vd="stopper">⏹ Stopper la vidéo</button>'
    : '<button class="primaire tres-gros" data-vd="demarrer">▶ Démarrer la vidéo</button>'}
      <button class="primaire gros" data-vd="lecture" ${vd.flux && vd.pause ? '' : 'hidden'}>▶ Revenir au différé</button>
      <button data-vd="effacer" title="Effacer tout de suite toutes les images en mémoire">🧹 Tout effacer</button>
    </div>
    <div class="outils-trace">
      ${OUTILS_TRACE.map(([k, nom]) => `<button class="${cfg.trace === k ? 'primaire' : ''}" data-vd-trace="${k}">${nom}</button>`).join('')}
      <button data-vd="annuler-trace" ${vd.traces.length ? '' : 'disabled'}>↶</button>
      <button data-vd="effacer-traces" ${vd.traces.length ? '' : 'disabled'}>Effacer les tracés</button>
    </div>
    <p class="aide">Pose la tablette face à l’atelier et « Démarrer » : l’élève fait son geste, puis vient se voir ${cfg.delai} s plus tard.
      Fais glisser la barre (ou « Stopper ») pour revenir en arrière et figer une image, puis trace un angle ou un alignement.
      Aucune image n’est enregistrée : celles de plus de ${cfg.conservation} s sont effacées en continu, et tout est effacé en quittant l’outil.</p>`;
}

const htmlRgpdVideo = () => `<p class="aide">🛡 Rien n’est enregistré : les images restent quelques secondes dans la mémoire de l’appareil puis sont
  effacées (durée réglable, 1 min au plus). Pas d’export, pas d’envoi, pas de capture. Pense à en informer les familles
  (notice RGPD de l’établissement) et à respecter l’élève qui ne souhaite pas être filmé (📷 Couper la caméra).</p>`;

// Bandeau (mis à jour à chaque top) : état, mémoire utilisée, compte à rebours d'effacement.
BLOCS_DIRECTS.video = () => {
  const cfg = cfgVideo(), maintenant = Date.now();
  // Mémoire : place prise par les images gardées en mémoire vive (jamais sur le disque) ; elle reste stable, car les
  // images plus vieilles que la durée choisie sont effacées au fur et à mesure.
  const mo = vd.images.reduce((s, x) => s + x.taille, 0) / 1048576;
  const memoire = `<span title="Place prise en mémoire vive par les images (jamais enregistrées sur l’appareil)">mémoire ${fmt(Math.round(mo * 10) / 10)} Mo</span>`;
  if (!vd.flux && !vd.pause) return '<span class="etat-video">📷 Caméra éteinte : rien n’est filmé</span>';
  if (vd.pause) {
    const reste = Math.max(0, Math.ceil((vd.pause.t + cfg.conservation * 1000 - maintenant) / 1000));
    return `<span class="etat-video pause">${vd.flux ? '⏸ Image figée' : '⏹ Vidéo stoppée'}</span><span>🧹 effacée dans ${reste} s</span>${memoire}`;
  }
  const premiere = vd.images[0]?.t;
  const attente = premiere ? cfg.delai - (maintenant - premiere) / 1000 : cfg.delai;
  return `<span class="etat-video direct">● Différé ${cfg.delai} s</span>${attente > 0 ? `<span>⏳ image dans ${Math.ceil(attente)} s</span>` : ''}
    <span>🧹 effacement après ${cfg.conservation} s</span>${memoire}`;
};

// Barre de temps : de la plus ancienne image gardée à la plus récente ; mise à jour sans redessiner l'outil.
let barreTenue = false;
function majBarreVideo() {
  const barre = $('#vue [data-vd-barre]');
  if (!barre) return;
  const n = vd.images.length;
  barre.hidden = n < 2;
  const lecture = $('#vue [data-vd="lecture"]');
  if (lecture) lecture.hidden = !(vd.flux && vd.pause);
  if (n < 2) return;
  const curseur = $('[data-vd-temps]', barre), pos = $('[data-vd-position]', barre);
  const a = vd.images[0].t, b = vd.images[n - 1].t;
  curseur.min = a; curseur.max = b;
  const montree = vd.pause ? vd.pause.t : vd.images[vd.affichee]?.t ?? b;
  if (!barreTenue) curseur.value = montree;
  pos.textContent = vd.pause ? `−${fmt(Math.round((b - vd.pause.t) / 100) / 10)} s` : 'différé';
}
const figerA = k => { if (vd.images[k]) vd.pause = { t: vd.images[k].t, image: vd.images[k] }; };
const fmtDuree = s => (s < 60 ? Math.round(s) + ' s' : Math.floor(s / 60) + ' min ' + Math.round(s % 60) + ' s');

/* ---------- Caméra et mémoire ---------- */

async function demarrerCamera() {
  const cfg = cfgVideo(), q = QUALITES_VIDEO[cfg.qualite] || QUALITES_VIDEO.normale;
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('Caméra indisponible dans ce navigateur.');
  arreterCamera();
  try {
    vd.flux = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: cfg.camera, width: { ideal: q.largeur * 2 }, height: { ideal: q.largeur * 9 / 8 } } });
  } catch (e) {
    vd.flux = null;
    throw new Error(e?.name === 'NotAllowedError' ? 'Caméra refusée : autorise-la pour ce site dans le navigateur.' : 'Impossible d’ouvrir la caméra.');
  }
  vd.source = document.createElement('video');
  Object.assign(vd.source, { muted: true, playsInline: true, srcObject: vd.flux });
  await vd.source.play().catch(() => {});
  vd.capture = document.createElement('canvas');
  vd.boucle ??= requestAnimationFrame(boucleVideo);
}

function arreterCamera() {
  vd.flux?.getTracks().forEach(t => t.stop());
  vd.flux = null;
  if (vd.source) { vd.source.srcObject = null; vd.source = null; }
}

// Tout effacer : caméra, images, image figée, tracés (et l'accès redevient protégé).
function arreterVideo() {
  arreterCamera();
  vd.images = [];
  vd.pause = null;
  vd.traces = [];
  vd.enCours = null;
  vd.deplace = null;
  vd.affichee = -1;
  vd.deverrouille = false;
  if (vd.boucle) { cancelAnimationFrame(vd.boucle); vd.boucle = null; }
}

function boucleVideo(maintenant) {
  vd.boucle = null;
  const ecran = $('#vue [data-vd-ecran]');
  // Plus d'écran vidéo (autre outil, autre onglet) depuis un instant : on coupe et on efface tout.
  if (!ecran || ui.vue !== 'outils' || ui.outil !== 'video') {
    vd.absentDepuis ||= maintenant;
    if (maintenant - vd.absentDepuis > 400) return arreterVideo();
  } else vd.absentDepuis = 0;
  const cfg = cfgVideo(), q = QUALITES_VIDEO[cfg.qualite] || QUALITES_VIDEO.normale, t = Date.now();

  // 1. Capture : une image compressée tous les 1/ips (on saute une image si les compressions précédentes traînent).
  if (vd.flux && vd.source?.readyState >= 2 && t - vd.derniereCapture >= 1000 / q.ips && vd.enCompression < 3) {
    vd.derniereCapture = t;
    const l = q.largeur, h = Math.round(l * (vd.source.videoHeight || 9) / (vd.source.videoWidth || 16));
    if (vd.capture.width !== l || vd.capture.height !== h) { vd.capture.width = l; vd.capture.height = h; }
    vd.capture.getContext('2d').drawImage(vd.source, 0, 0, l, h);
    vd.enCompression++;
    vd.capture.toBlob(blob => {
      vd.enCompression--;
      if (blob && vd.flux) vd.images.push({ t, blob, taille: blob.size });
    }, 'image/jpeg', q.jpeg);
  }

  // 2. Effacement continu : rien de plus vieux que la durée choisie (l'image figée aussi).
  const limite = t - cfg.conservation * 1000;
  let n = 0;
  while (n < vd.images.length && vd.images[n].t < limite) n++;
  if (n) { vd.images.splice(0, n); vd.affichee -= n; }
  if (vd.pause && vd.pause.t < limite) {
    if (!vd.flux && vd.images.length) figerA(0); // vidéo stoppée : on passe à la plus ancienne image encore gardée
    else {
      vd.pause = null;
      toast(vd.flux ? `🧹 Image effacée (plus de ${cfg.conservation} s) : retour au différé.` : '🧹 Vidéo entièrement effacée.');
      rendreOutil();
    }
  }

  // 3. Affichage : l'image d'il y a « retard » secondes (ou l'image figée) ; rien si tout est effacé.
  if (ecran) {
    // Écran redessiné (réglage changé…) : la nouvelle zone est vide, il faut y remettre l'image même si c'est la même.
    if (ecran !== vd.ecranCourant) { vd.ecranCourant = ecran; vd.affichee = -1; }
    const k = vd.pause ? vd.images.findIndex(x => x === vd.pause.image) : vd.flux ? indexAvant(t - cfg.delai * 1000) : -1;
    if (k >= 0 && k !== vd.affichee && !vd.decodage) dessinerImage(ecran, k);
    if (k < 0 && !vd.flux && vd.affichee !== -2) { ecran.getContext('2d').clearRect(0, 0, ecran.width, ecran.height); vd.affichee = -2; }
    dessinerTraces();
    majBarreVideo();
  }
  if (vd.flux || vd.pause || vd.images.length) vd.boucle = requestAnimationFrame(boucleVideo);
}

// Dernière image prise avant l'instant t (recherche par dichotomie), ou -1.
function indexAvant(t) {
  let a = 0, b = vd.images.length - 1, r = -1;
  while (a <= b) { const m = (a + b) >> 1; if (vd.images[m].t <= t) { r = m; a = m + 1; } else b = m - 1; }
  return r;
}

async function dessinerImage(ecran, k) {
  const img = vd.images[k];
  if (!img) return;
  vd.decodage = true;
  try {
    const bmp = await createImageBitmap(img.blob);
    if (ecran.width !== bmp.width || ecran.height !== bmp.height) { ecran.width = bmp.width; ecran.height = bmp.height; }
    ecran.getContext('2d').drawImage(bmp, 0, 0);
    bmp.close?.();
    vd.affichee = vd.images.indexOf(img);
  } catch { /* image déjà effacée */ }
  vd.decodage = false;
}

/* ---------- Tracés (ligne, cercle, angle, verticale, horizontale) ---------- */

const COULEUR_TRACE = '#ffe14d';
function dessinerTraces() {
  const c = $('#vue [data-vd-traces]'), ecran = $('#vue [data-vd-ecran]');
  if (!c || !ecran) return;
  const r = ecran.getBoundingClientRect();
  if (c.width !== Math.round(r.width) || c.height !== Math.round(r.height)) { c.width = Math.round(r.width); c.height = Math.round(r.height); }
  const g = c.getContext('2d'), W = c.width, H = c.height, P = p => [p[0] * W, p[1] * H];
  g.clearRect(0, 0, W, H);
  g.lineWidth = Math.max(3, W / 250);
  g.strokeStyle = COULEUR_TRACE;
  g.fillStyle = COULEUR_TRACE;
  g.font = `bold ${Math.max(16, W / 35)}px system-ui, sans-serif`;
  g.shadowColor = 'rgba(0,0,0,.7)';
  g.shadowBlur = 4;
  const point = p => { const [x, y] = P(p); g.beginPath(); g.arc(x, y, g.lineWidth * 1.6, 0, 2 * Math.PI); g.fill(); };
  // Mode « Déplacer » : les poignées de chaque tracé sont visibles (cercles blancs) ; le tracé tenu est en blanc.
  const deplacer = !cfgVideo().trace;
  const poignee = p => { const [x, y] = P(p); g.save(); g.beginPath(); g.arc(x, y, g.lineWidth * 2.6, 0, 2 * Math.PI); g.lineWidth = 2; g.strokeStyle = '#fff'; g.stroke(); g.restore(); };
  for (const tr of [...vd.traces, ...(vd.enCours ? [vd.enCours] : [])]) {
    const pts = tr.points;
    g.strokeStyle = g.fillStyle = vd.deplace?.trace === tr ? '#ffffff' : COULEUR_TRACE;
    if (deplacer) pts.forEach(poignee);
    g.beginPath();
    if (tr.type === 'ligne' && pts.length === 2) { g.moveTo(...P(pts[0])); g.lineTo(...P(pts[1])); g.stroke(); pts.forEach(point); }
    else if (tr.type === 'cercle' && pts.length === 2) {
      const [x0, y0] = P(pts[0]), [x1, y1] = P(pts[1]);
      g.arc(x0, y0, Math.hypot(x1 - x0, y1 - y0), 0, 2 * Math.PI); g.stroke();
    } else if (tr.type === 'verticale') { const [x] = P(pts[0]); g.setLineDash([12, 8]); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); g.setLineDash([]); }
    else if (tr.type === 'horizontale') { const [, y] = P(pts[0]); g.setLineDash([12, 8]); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); g.setLineDash([]); }
    else if (tr.type === 'angle') {
      pts.forEach(point);
      if (pts.length >= 2) { g.moveTo(...P(pts[0])); g.lineTo(...P(pts[1])); }
      if (pts.length === 3) {
        g.lineTo(...P(pts[2])); g.stroke();
        // Angle au sommet (2e point), en degrés.
        const [ax, ay] = P(pts[0]), [bx, by] = P(pts[1]), [cx, cy] = P(pts[2]);
        const a1 = Math.atan2(ay - by, ax - bx), a2 = Math.atan2(cy - by, cx - bx);
        let d = Math.abs(a1 - a2); if (d > Math.PI) d = 2 * Math.PI - d;
        const deg = Math.round((d * 180) / Math.PI), rayon = Math.min(60, Math.hypot(ax - bx, ay - by) / 2, Math.hypot(cx - bx, cy - by) / 2);
        g.beginPath();
        const sens = ((a2 - a1 + 2 * Math.PI) % (2 * Math.PI)) > Math.PI;
        g.arc(bx, by, rayon, a1, a2, sens); g.stroke();
        g.fillText(deg + '°', bx + 10, by - 10);
      } else g.stroke();
    }
  }
}

function pointTrace(e, c) {
  const r = c.getBoundingClientRect();
  return [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))];
}

/* ---------- ✋ Déplacer un tracé ----------
   Toucher un point (extrémité, sommet, centre…) le déplace seul ; toucher le trait déplace tout le tracé. */

// Distance (en pixels) d'un toucher à un segment.
function distSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
  const t = l2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2)) : 0;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
// Tracé touché : { trace, point (n° du point, ou -1 = tout le tracé) }, du plus récent au plus ancien.
function traceTouche(p, c) {
  const W = c.width, H = c.height, [px, py] = [p[0] * W, p[1] * H], tol = Math.max(18, W / 40);
  for (const tr of [...vd.traces].reverse()) {
    const pts = tr.points.map(q => [q[0] * W, q[1] * H]);
    const k = pts.findIndex(([x, y]) => Math.hypot(px - x, py - y) <= tol);
    if (k >= 0 && tr.type !== 'verticale' && tr.type !== 'horizontale') return { trace: tr, point: k };
    let d = Infinity;
    if (tr.type === 'ligne') d = distSegment(px, py, ...pts[0], ...pts[1]);
    else if (tr.type === 'angle') d = Math.min(distSegment(px, py, ...pts[0], ...pts[1]), distSegment(px, py, ...pts[1], ...pts[2]));
    else if (tr.type === 'cercle') d = Math.abs(Math.hypot(px - pts[0][0], py - pts[0][1]) - Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]));
    else if (tr.type === 'verticale') d = Math.abs(px - pts[0][0]);
    else if (tr.type === 'horizontale') d = Math.abs(py - pts[0][1]);
    if (d <= tol) return { trace: tr, point: -1 };
  }
  return null;
}
const borne = v => Math.min(1, Math.max(0, v));

document.addEventListener('pointerdown', e => {
  const c = e.target.closest?.('#vue [data-vd-traces]');
  const type = cfgVideo().trace;
  if (!c) return;
  if (!type) {
    // Déplacer : on attrape le tracé (ou le point) sous le doigt.
    const p = pointTrace(e, c), touche = traceTouche(p, c);
    if (!touche) return;
    e.preventDefault();
    vd.deplace = { ...touche, depart: p, avant: touche.trace.points.map(q => [...q]) };
    try { c.setPointerCapture(e.pointerId); } catch { /* le tracé suit quand même */ }
    return;
  }
  e.preventDefault();
  const p = pointTrace(e, c);
  if (type === 'verticale' || type === 'horizontale') { vd.traces.push({ type, points: [p] }); return majBoutonsTrace(); }
  if (type === 'angle') {
    // Trois touchers : un point, le sommet, l'autre point.
    vd.enCours ??= { type: 'angle', points: [] };
    vd.enCours.points.push(p);
    if (vd.enCours.points.length === 3) { vd.traces.push(vd.enCours); vd.enCours = null; majBoutonsTrace(); }
    return;
  }
  vd.enCours = { type, points: [p, p] };
  try { c.setPointerCapture(e.pointerId); } catch { /* le tracé suit quand même */ }
});
document.addEventListener('pointermove', e => {
  const c = e.target.closest?.('#vue [data-vd-traces]');
  if (c && vd.deplace) {
    const p = pointTrace(e, c), { trace, point, depart, avant } = vd.deplace;
    const dx = p[0] - depart[0], dy = p[1] - depart[1];
    if (point >= 0) trace.points[point] = p;
    else {
      // Tout le tracé glisse, sans sortir de l'image.
      const mx = Math.max(-Math.min(...avant.map(q => q[0])), Math.min(dx, 1 - Math.max(...avant.map(q => q[0]))));
      const my = Math.max(-Math.min(...avant.map(q => q[1])), Math.min(dy, 1 - Math.max(...avant.map(q => q[1]))));
      trace.points = avant.map(q => [borne(q[0] + mx), borne(q[1] + my)]);
    }
    return;
  }
  if (!c || !vd.enCours || vd.enCours.type === 'angle') return;
  vd.enCours.points[1] = pointTrace(e, c);
});
document.addEventListener('pointerup', e => {
  if (vd.deplace) { vd.deplace = null; return; }
  if (!vd.enCours || vd.enCours.type === 'angle') return;
  const [a, b] = vd.enCours.points;
  if (Math.hypot(a[0] - b[0], a[1] - b[1]) > 0.01) vd.traces.push(vd.enCours); // (un simple toucher ne trace rien)
  vd.enCours = null;
  majBoutonsTrace();
});
function majBoutonsTrace() {
  document.querySelectorAll('#vue [data-vd="annuler-trace"], #vue [data-vd="effacer-traces"]').forEach(b => { b.disabled = !vd.traces.length; });
}

/* ---------- Actions ---------- */

function actionVideo(action) {
  const cfg = cfgVideo();
  switch (action) {
    // Démarrer : nouvelle vidéo (les images d'avant sont effacées). Stopper : la caméra s'arrête, on reste sur l'image
    // montrée et la barre permet de revenir en arrière (les images continuent d'être effacées après la durée choisie).
    case 'demarrer':
      vd.images = []; vd.pause = null; vd.affichee = -1;
      return lancer(async () => { await demarrerCamera(); rendreOutil(); });
    case 'stopper': {
      const k = vd.pause ? vd.images.indexOf(vd.pause.image) : vd.affichee >= 0 ? vd.affichee : vd.images.length - 1;
      arreterCamera();
      figerA(k);
      return rendreOutil();
    }
    case 'lecture': vd.pause = null; vd.affichee = -1; return rendreOutil();
    case 'arriere': case 'avant': {
      const actuelle = vd.pause ? vd.images.indexOf(vd.pause.image) : vd.affichee;
      const k = actuelle + (action === 'avant' ? 1 : -1);
      if (k < 0 || k >= vd.images.length) return toast(k < 0 ? 'Plus ancienne image gardée (les autres sont effacées).' : 'Dernière image.');
      figerA(k);
      return;
    }
    case 'effacer': vd.images = []; vd.pause = null; vd.affichee = -1; toast('🧹 Toutes les images sont effacées.', 'ok'); return rendreOutil();
    case 'annuler-trace': vd.traces.pop(); return majBoutonsTrace();
    case 'effacer-traces': vd.traces = []; vd.enCours = null; return majBoutonsTrace();
  }
}

document.addEventListener('click', e => {
  const b = e.target.closest?.('#vue [data-vd], #vue [data-vd-trace]');
  if (!b || b.disabled) return;
  if (b.dataset.vdTrace !== undefined) {
    // (Sans redessiner l'outil : seulement le bouton actif et la zone de tracé.)
    const type = b.dataset.vdTrace;
    cfgVideo().trace = type;
    vd.enCours = null;
    sauverOutils();
    document.querySelectorAll('#vue [data-vd-trace]').forEach(x => x.classList.toggle('primaire', x.dataset.vdTrace === type));
    $('#vue [data-vd-traces]')?.classList.toggle('deplacer', !type);
    return;
  }
  actionVideo(b.dataset.vd);
});

document.addEventListener('change', e => {
  const t = e.target, k = t.dataset?.vdChamp;
  if (!k || !t.closest('#vue .outil-video')) return;
  const cfg = cfgVideo();
  if (k === 'miroir') cfg.miroir = t.checked;
  else if (k === 'delai' || k === 'conservation') cfg[k] = +t.value;
  else cfg[k] = t.value;
  if (cfg.delai >= cfg.conservation) cfg.delai = DELAIS_VIDEO.filter(x => x < cfg.conservation).at(-1);
  // Nouvelle durée d'effacement : appliquée tout de suite (la boucle efface le surplus).
  // Autre caméra ou qualité : on relance la caméra seulement si elle filmait déjà.
  if ((k === 'camera' || k === 'qualite') && vd.flux) return lancer(async () => { vd.images = []; vd.pause = null; await demarrerCamera(); rendreOutil(); });
  rendreOutil();
});

// Barre de temps : glisser fige l'image à cet instant (sans redessiner l'outil, pour ne pas lâcher le curseur).
document.addEventListener('input', e => {
  const c = e.target.closest?.('#vue [data-vd-temps]');
  if (!c) return;
  barreTenue = true;
  figerA(indexAvant(+c.value));
});
document.addEventListener('change', e => { if (e.target.matches?.('#vue [data-vd-temps]')) barreTenue = false; });
document.addEventListener('pointerup', () => { barreTenue = false; });

// Accès : mot de passe du carnet (vérifié avec son témoin), puis la caméra s'ouvre.
document.addEventListener('submit', e => {
  const f = e.target.closest?.('[data-vd-acces]');
  if (!f) return;
  e.preventDefault();
  lancer(async () => {
    const erreur = $('[data-vd-erreur]', f), mdp = f.elements.mdp.value;
    let ok = false;
    try { ok = await Cle.verifierTemoin(mdp, Donnees.meta().temoinMdp); } catch { ok = false; }
    if (!ok) { erreur.textContent = 'Ce n’est pas le mot de passe du carnet.'; erreur.hidden = false; f.elements.mdp.value = ''; return; }
    // Outil ouvert, caméra éteinte : rien n'est filmé tant qu'on n'a pas touché « Démarrer la vidéo ».
    vd.deverrouille = true;
    rendreOutil();
  });
});

// Appli en arrière-plan (tablette en veille, autre appli) ou carnet verrouillé : tout est effacé.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden || !(vd.flux || vd.images.length || vd.deverrouille)) return;
  arreterVideo();
  if (ui.vue === 'outils' && ui.outil === 'video') rendreOutil(); // au retour : mot de passe redemandé
});

RENDUS_OUTILS.video = htmlVideo;
