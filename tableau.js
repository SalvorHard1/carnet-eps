'use strict';
// Outil « 🧑‍🏫 Tableau blanc » (Outils › Matchs) : une ardoise sur fond de terrain (basket, handball, football, volley,
// badminton, rugby, tennis, ultimate, tennis de table, piste d'athlétisme, gymnase complet, plusieurs terrains dans
// le gymnase — 3 volleys, 10 tables… —, quadrillage ou fond blanc). On y dessine au doigt (crayon,
// flèches, gomme) et on y pose les têtes des élèves de la classe — photos du trombinoscope, sinon initiales —
// cochées dans une liste, puis déplacées au doigt. Un toucher sur une tête change la couleur de son équipe.
// Pions en plus : rouges, bleus (numérotés), ballon, plot. Tout est gardé sur cet appareil, par classe (localStorage).
// En mode élève : jamais de photo, seulement les initiales.

OUTILS.push({ id: 'tableau', famille: 'matchs', icone: '🧑‍🏫', nom: 'Tableau blanc', info: 'Terrains, dessin à main levée, têtes des élèves à placer', classe: true });

/* ---------- Terrains (dimensions en mètres) ---------- */

// L × l : terrain ; m : marge autour ; sol / hors : couleurs ; bandes : herbe tondue ; moitie : dessin d'une moitié
// (répétée en miroir) ; demi : seulement la moitié gauche du terrain de base.
const TERRAINS_TB = [
  { id: 'blanc', nom: 'Fond blanc', L: 16, l: 10, m: 0, sol: '#ffffff', hors: '#ffffff' },
  { id: 'quadrillage', nom: 'Quadrillage', L: 16, l: 10, m: 0, sol: '#ffffff', hors: '#ffffff', grille: true },
  { id: 'basket', nom: 'Basket', L: 28, l: 15, m: 1.5, sol: '#e3b67f', hors: '#b97c45', moitie: moitieBasket },
  { id: 'basket-demi', nom: 'Basket (demi-terrain)', base: 'basket', demi: true },
  { id: 'hand', nom: 'Handball', L: 40, l: 20, m: 1.5, sol: '#3f8ad6', hors: '#2c5f96', moitie: moitieHand },
  { id: 'hand-demi', nom: 'Handball (demi-terrain)', base: 'hand', demi: true },
  { id: 'foot', nom: 'Football', L: 105, l: 68, m: 4, sol: '#3f9b4a', hors: '#347f3d', bandes: true, moitie: moitieFoot },
  { id: 'foot-demi', nom: 'Football (demi-terrain)', base: 'foot', demi: true },
  { id: 'volley', nom: 'Volley-ball', L: 18, l: 9, m: 3, sol: '#e8893b', hors: '#2f6db5', moitie: moitieVolley, filet: true },
  { id: 'badminton', nom: 'Badminton', L: 13.4, l: 6.1, m: 1.5, sol: '#2e8b57', hors: '#5b6770', moitie: moitieBad, filet: true },
  { id: 'tennis', nom: 'Tennis', L: 23.77, l: 10.97, m: 3.5, sol: '#2f6fb0', hors: '#4f8a4a', moitie: moitieTennis, filet: true },
  { id: 'rugby', nom: 'Rugby', L: 120, l: 70, m: 4, sol: '#3f9b4a', hors: '#347f3d', bandes: true, moitie: moitieRugby },
  { id: 'ultimate', nom: 'Ultimate', L: 100, l: 37, m: 3, sol: '#3f9b4a', hors: '#347f3d', bandes: true, moitie: moitieUltimate },
  { id: 'piste', nom: 'Piste d’athlétisme', L: 176.9, l: 92.5, m: 3, sol: '#3f9b4a', hors: '#347f3d', piste: true },
  // (Couloirs élargis — 7 m au lieu de 1,22 m — pour que les têtes y tiennent : la longueur, elle, est à l'échelle.)
  { id: 'relais', nom: 'Relais : 4 couloirs (100 m)', L: 110, l: 28, m: 3, sol: '#c4553b', hors: '#3f9b4a', special: relaisTb },
  { id: 'bassin4', nom: 'Natation : bassin 25 m (4 couloirs)', L: 25, l: 10, m: 2, sol: '#3aa0d8', hors: '#e6e0d2', special: d => bassinTb(d, 4) },
  { id: 'bassin6', nom: 'Natation : bassin 25 m (6 couloirs)', L: 25, l: 15, m: 2, sol: '#3aa0d8', hors: '#e6e0d2', special: d => bassinTb(d, 6) },
  // Salle omnisports de 44 × 24 m : toutes les lignes, une couleur par sport (légende en bas).
  { id: 'gymnase', nom: 'Gymnase complet (toutes les lignes)', L: 44, l: 24, m: 1.6, sol: '#dcb886', hors: '#7d8590', special: gymnaseTb },
  // Même salle, parquet nu (sans aucune ligne) : pour tracer soi-même un parcours, des ateliers…
  { id: 'gymnase-vide', nom: 'Gymnase vide (sans lignes)', L: 44, l: 24, m: 1.6, sol: '#dcb886', hors: '#7d8590' },
  // (Table de 2,74 × 1,525 m, avec l'aire de jeu autour.)
  { id: 'tt', nom: 'Tennis de table', L: 2.74, l: 1.525, m: 1.3, sol: '#1d5fa8', hors: '#b5523b', special: tableTt },
  // Plusieurs terrains dans le gymnase : le terrain de base répété et numéroté (voir dispositionMultiTb).
  ...[['volley', 'Volley-ball', [2, 3, 4]], ['badminton', 'Badminton', [2, 3, 4, 6, 7]], ['tt', 'Tennis de table', [4, 6, 8, 10, 12]],
    ['basket-demi', 'Basket (demi-terrains)', [2, 4]], ['tennis', 'Tennis', [2, 3]]]
    .flatMap(([base, nom, nombres]) => nombres.map(n => ({ id: `${base}-x${n}`, nom: `${nom} : ${n} ${base === 'tt' ? 'tables' : 'terrains'}`,
      multi: { base, n }, sol: '#d9b98a', hors: '#d9b98a' }))),
];

// Gymnase : terrains superposés comme dans une vraie salle — handball (noir), basket (rouge), volley (bleu),
// 4 badmintons en travers (vert). Chaque terrain reprend son dessin (sans les zones colorées), à sa place dans la salle.
const SPORTS_GYMNASE = [
  ['hand', '#1d2430', 'Handball', [[2, 2, 0]]],
  ['basket', '#d62828', 'Basket', [[8, 4.5, 0]]],
  ['volley', '#1e6fd9', 'Volley-ball', [[13, 7.5, 0]]],
  // (Badminton en travers : longueur 13,4 m dans la largeur de la salle ; [x du bord droit, y du haut, rotation].)
  ['badminton', '#2e9d4a', 'Badminton', [0, 1, 2, 3].map(k => [6.05 + 6.1 + k * 8.6, 5.3, Math.PI / 2])],
];
function gymnaseTb(d) {
  const g = d.g, lignes = { ...d, remplir: () => {} }; // (lignes seulement : pas de raquette ni de zone remplies)
  for (const [id, couleur, , places] of SPORTS_GYMNASE) {
    const t = terrainTb(id);
    for (const [x0, y0, rot] of places) {
      g.save();
      g.translate(d.X(x0), d.Y(y0)); g.rotate(rot); g.translate(-d.X(0), -d.Y(0));
      g.strokeStyle = couleur;
      d.rect(0, 0, t.L, t.l);
      d.ligne(t.L / 2, 0, t.L / 2, t.l, t.filet ? 2 : 1);
      if (id === 'basket') d.cercle(t.L / 2, t.l / 2, 1.8, couleur);
      t.moitie(lignes);
      g.save(); g.translate(2 * d.X(t.L / 2), 0); g.scale(-1, 1); t.moitie(lignes); g.restore();
      g.restore();
    }
  }
  // Légende, dans la bande du bas (hors des terrains).
  const legende = SPORTS_GYMNASE.map(([, c, nom]) => [c, nom]), pas = 44 / legende.length;
  legende.forEach(([c, nom], k) => d.texte(pas * (k + 0.5), 24 + 0.8, '— ' + nom, 1.05, c));
}

// Table de tennis de table : bords blancs, ligne médiane (double), filet.
function tableTt(d) {
  d.rect(0, 0, 2.74, 1.525);
  d.ligne(0, 0.7625, 2.74, 0.7625, 0.6);
  d.g.save(); d.g.strokeStyle = '#1d2430'; d.ligne(1.37, -0.15, 1.37, 1.675, 2.2); d.g.restore();
}

// Plusieurs terrains : n copies du terrain de base (marges comprises), en colonnes × rangées choisies pour remplir
// au mieux un écran large (rapport proche de 1,6) ; la dernière rangée, incomplète, est centrée. Dimensions en mètres.
function dispositionMultiTb(t) {
  const b = defTerrainTb(t.multi.base), n = t.multi.n;
  const w = b.L + 2 * b.m, h = b.l + 2 * b.m, gap = Math.max(0.6, w * 0.06);
  let mieux = null;
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    if (cols > 1 && Math.ceil(n / (cols - 1)) === rows) continue; // une colonne de trop (resterait vide)
    const L = cols * w + (cols + 1) * gap, l = rows * h + (rows + 1) * gap, ecart = Math.abs(Math.log(L / l / 1.6));
    if (!mieux || ecart < mieux.ecart) mieux = { cols, rows, L, l, ecart };
  }
  return { ...mieux, w, h, gap, base: b };
}

// Ligne droite du relais : départ à 4 m du bord, arrivée 100 m plus loin ; repères tous les 10 m ;
// zone de transmission (40 → 60 m) au milieu. Couloirs numérotés.
function relaisTb(d) {
  const n = 4, w = 7, x0 = 4, g = d.g;
  g.save(); g.fillStyle = 'rgba(255, 214, 10, .28)'; g.fillRect(d.X(x0 + 40), d.Y(0), 20 * d.s, n * w * d.s); g.restore();
  for (let k = 0; k <= n; k++) d.ligne(0, k * w, 110, k * w);
  d.ligne(x0, 0, x0, n * w, 2.5);
  d.ligne(x0 + 100, 0, x0 + 100, n * w, 3.5);
  for (let m = 10; m < 100; m += 10) {
    if (m === 40 || m === 60) continue;
    d.pointilles(() => d.ligne(x0 + m, 0, x0 + m, n * w, 0.5));
  }
  g.save(); g.strokeStyle = '#ffd60a'; d.ligne(x0 + 40, 0, x0 + 40, n * w, 1.6); d.ligne(x0 + 60, 0, x0 + 60, n * w, 1.6); g.restore();
  for (let m = 0; m <= 100; m += 10) d.texte(x0 + m, -1.2, m ? m + ' m' : 'Départ', 1.6, '#ffffff');
  d.texte(x0 + 50, n * w + 1.8, 'zone de transmission', 1.5, '#ffd60a');
  for (let k = 0; k < n; k++) d.texte(1.8, (k + 0.5) * w, String(k + 1), 3, 'rgba(255,255,255,.85)');
}

// Bassin de 25 m : lignes d'eau (rouge et blanc), ligne noire au fond de chaque couloir (en T aux extrémités),
// repères de dos à 5 m des murs, plots de départ numérotés, distances.
function bassinTb(d, n) {
  const w = 2.5, l = n * w, g = d.g;
  g.save(); g.strokeStyle = '#1b3c66';
  for (let k = 0; k < n; k++) {
    const y = (k + 0.5) * w;
    d.ligne(2, y, 23, y, 3); d.ligne(2, y - 0.5, 2, y + 0.5, 3); d.ligne(23, y - 0.5, 23, y + 0.5, 3);
  }
  g.restore();
  for (let k = 1; k < n; k++) {
    d.ligne(0, k * w, 25, k * w, 2.2);
    g.save(); g.strokeStyle = '#e53935'; g.setLineDash([d.s * 0.5, d.s * 0.5]); d.ligne(0, k * w, 25, k * w, 2.2); g.restore();
  }
  g.save(); g.strokeStyle = 'rgba(20, 40, 80, .55)'; g.setLineDash([d.s * 0.3, d.s * 0.3]); d.ligne(5, 0, 5, l, 0.8); d.ligne(20, 0, 20, l, 0.8); g.restore();
  g.save(); g.strokeStyle = '#1b3c66'; d.rect(0, 0, 25, l); g.restore();
  for (let k = 0; k < n; k++) {
    const y = (k + 0.5) * w;
    g.save(); g.fillStyle = '#f4f4f4'; g.fillRect(d.X(-1.6), d.Y(y - 0.45), 1.4 * d.s, 0.9 * d.s); g.restore();
    d.texte(-0.9, y, String(k + 1), 0.7, '#1b3c66');
  }
  for (const m of [5, 10, 15, 20, 25]) d.texte(m, -0.9, m + ' m', 0.7, '#4a5562');
}
const terrainTb = id => TERRAINS_TB.find(t => t.id === id) || TERRAINS_TB[0];
// Définition complète (un demi-terrain reprend son terrain de base, coupé au milieu).
function defTerrainTb(id) {
  const t = terrainTb(id);
  if (t.multi) { const d = dispositionMultiTb(t); return { ...t, L: d.L, l: d.l, m: 0, dispo: d }; }
  if (!t.demi) return t;
  const b = terrainTb(t.base);
  return { ...b, ...t, L: b.L / 2 + b.m * 0.6, Lplein: b.L };
}
const ratioTb = t => (t.L + 2 * t.m) / (t.l + 2 * t.m);

// Une moitié de terrain, côté gauche (x = 0 : ligne de fond). d : outils de dessin en mètres.
function moitieBasket(d) {
  d.remplir(() => d.rectChemin(0, 7.5 - 2.45, 5.8, 4.9), '#c4673d');
  d.rect(0, 7.5 - 2.45, 5.8, 4.9);
  d.cercle(5.8, 7.5, 1.8);
  const a = Math.asin(6.6 / 6.75), xs = 1.575 + 6.75 * Math.cos(a);
  d.ligne(0, 0.9, xs, 0.9); d.ligne(0, 14.1, xs, 14.1);
  d.arc(1.575, 7.5, 6.75, -a, a);
  d.ligne(1.2, 6.6, 1.2, 8.4, 2);
  d.cercle(1.575, 7.5, 0.23, '#ff7a1a');
}
function moitieHand(d) {
  const zone = r => { d.g.beginPath(); d.g.arc(d.X(0), d.Y(8.5), r * d.s, -Math.PI / 2, 0); d.g.arc(d.X(0), d.Y(11.5), r * d.s, 0, Math.PI / 2); d.g.closePath(); };
  d.remplir(() => zone(6), '#f0a040');
  zone(6); d.g.stroke();
  d.g.save(); d.g.beginPath(); d.g.rect(d.X(0), d.Y(0), 20 * d.s, 20 * d.s); d.g.clip();
  d.g.setLineDash([d.s * 0.6, d.s * 0.4]); zone(9); d.g.stroke(); d.g.restore();
  d.ligne(7, 9.5, 7, 10.5); d.ligne(4, 9.85, 4, 10.15);
  d.but(8.5, 3, 1);
}
function moitieFoot(d) {
  d.rect(0, 34 - 20.16, 16.5, 40.32); d.rect(0, 34 - 9.16, 5.5, 18.32);
  d.point(11, 34);
  const a = Math.acos(5.5 / 9.15);
  d.arc(11, 34, 9.15, -a, a);
  d.arc(0, 0, 1, 0, Math.PI / 2); d.arc(0, 68, 1, -Math.PI / 2, 0);
  d.but(34 - 3.66, 7.32, 2);
}
function moitieVolley(d) { d.ligne(6, 0, 6, 9); }
function moitieBad(d) {
  d.ligne(4.72, 0, 4.72, 6.1); d.ligne(0.76, 0, 0.76, 6.1);
  d.ligne(0, 0.46, 6.7, 0.46); d.ligne(0, 5.64, 6.7, 5.64);
  d.ligne(0, 3.05, 4.72, 3.05);
}
function moitieTennis(d) {
  d.ligne(0, 1.37, 11.885, 1.37); d.ligne(0, 9.6, 11.885, 9.6);
  d.ligne(5.485, 1.37, 5.485, 9.6); d.ligne(5.485, 5.485, 11.885, 5.485);
  d.ligne(0, 5.485, 0.3, 5.485);
}
function moitieRugby(d) {
  d.ligne(10, 0, 10, 70); d.ligne(32, 0, 32, 70);
  d.pointilles(() => { d.ligne(50, 0, 50, 70); d.ligne(15, 0, 15, 70); d.ligne(10, 5, 60, 5); d.ligne(10, 65, 60, 65); d.ligne(10, 15, 60, 15); d.ligne(10, 55, 60, 55); });
  d.ligne(10, 32.2, 10, 37.8, 2.5); d.point(10, 32.2); d.point(10, 37.8);
}
function moitieUltimate(d) {
  d.ligne(18, 0, 18, 37);
  d.croix(36, 18.5);
}

// Dessine le fond (terrain) dans le canvas.
function dessinerTerrainTb(cv, id) {
  const t = defTerrainTb(id), W = cv.width, H = cv.height, g = cv.getContext('2d');
  const s = W / (t.L + 2 * t.m), ox = t.m * s, oy = t.m * s;
  const X = x => ox + x * s, Y = y => oy + y * s, epais = Math.max(1.5, W / 450);
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = t.hors; g.fillRect(0, 0, W, H);
  if (t.dispo) {
    // Plusieurs terrains : chaque terrain de base est dessiné une fois (à sa taille à l'écran), puis recopié et numéroté.
    const { cols, rows, w, h, gap } = t.dispo, n = t.multi.n;
    const un = document.createElement('canvas');
    un.width = Math.max(1, Math.round(w * s)); un.height = Math.max(1, Math.round(h * s));
    dessinerTerrainTb(un, t.multi.base);
    for (let k = 0; k < n; k++) {
      const r = Math.floor(k / cols), c = k % cols, dansRangee = r === rows - 1 ? n - r * cols : cols;
      const x = gap + c * (w + gap) + ((cols - dansRangee) * (w + gap)) / 2, y = gap + r * (h + gap);
      g.drawImage(un, Math.round(X(x)), Math.round(Y(y)));
      // Numéro du terrain (pastille dans le coin haut gauche).
      const rayon = Math.max(9, Math.min(w, h) * s * 0.07);
      g.fillStyle = 'rgba(29, 36, 48, .8)'; g.beginPath(); g.arc(X(x) + rayon * 1.3, Y(y) + rayon * 1.3, rayon, 0, 2 * Math.PI); g.fill();
      g.fillStyle = '#ffffff'; g.font = `700 ${Math.round(rayon * 1.2)}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(String(k + 1), X(x) + rayon * 1.3, Y(y) + rayon * 1.35);
    }
    return;
  }
  const Lp = t.Lplein || t.L;
  g.fillStyle = t.sol; g.fillRect(X(0), Y(0), Lp * s, t.l * s);
  if (t.bandes) { g.fillStyle = 'rgba(255,255,255,.06)'; for (let k = 0; k < 12; k += 2) g.fillRect(X((Lp / 12) * k), Y(0), (Lp / 12) * s, t.l * s); }
  if (t.grille) {
    g.strokeStyle = '#d6dde6'; g.lineWidth = 1;
    for (let x = 1; x < t.L; x++) { g.beginPath(); g.moveTo(X(x), 0); g.lineTo(X(x), H); g.stroke(); }
    for (let y = 1; y < t.l; y++) { g.beginPath(); g.moveTo(0, Y(y)); g.lineTo(W, Y(y)); g.stroke(); }
    return;
  }
  if (!t.moitie && !t.piste && !t.special) return;
  g.strokeStyle = '#ffffff'; g.lineWidth = epais; g.lineCap = 'round';
  const d = {
    g, s, X, Y,
    ligne: (x1, y1, x2, y2, f = 1) => { g.save(); g.lineWidth = epais * f; g.beginPath(); g.moveTo(X(x1), Y(y1)); g.lineTo(X(x2), Y(y2)); g.stroke(); g.restore(); },
    rectChemin: (x, y, w, h) => { g.beginPath(); g.rect(X(x), Y(y), w * s, h * s); },
    rect: (x, y, w, h) => { g.beginPath(); g.rect(X(x), Y(y), w * s, h * s); g.stroke(); },
    arc: (x, y, r, a1, a2) => { g.beginPath(); g.arc(X(x), Y(y), r * s, a1, a2); g.stroke(); },
    cercle: (x, y, r, coul) => { g.save(); if (coul) g.strokeStyle = coul; g.beginPath(); g.arc(X(x), Y(y), r * s, 0, 2 * Math.PI); g.stroke(); g.restore(); },
    point: (x, y) => { g.save(); g.fillStyle = '#fff'; g.beginPath(); g.arc(X(x), Y(y), epais * 1.6, 0, 2 * Math.PI); g.fill(); g.restore(); },
    croix: (x, y) => { const k = 0.6; d.ligne(x - k, y - k, x + k, y + k); d.ligne(x - k, y + k, x + k, y - k); },
    remplir: (chemin, coul) => { g.save(); g.fillStyle = coul; chemin(); g.fill(); g.restore(); },
    pointilles: f => { g.save(); g.setLineDash([s * 1.2, s * 1.2]); f(); g.restore(); },
    // But (cage) derrière la ligne de fond : y = poteau haut, largeur, profondeur.
    // Texte centré sur (x, y), hauteur en mètres.
    texte: (x, y, t, h, coul) => { g.save(); g.fillStyle = coul; g.font = `700 ${Math.max(9, h * s)}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, X(x), Y(y)); g.restore(); },
    but: (y, larg, prof) => { g.save(); g.lineWidth = epais * 1.5; g.beginPath(); g.moveTo(X(0), Y(y)); g.lineTo(X(-prof), Y(y)); g.lineTo(X(-prof), Y(y + larg)); g.lineTo(X(0), Y(y + larg)); g.stroke(); g.restore(); },
  };
  if (t.special) { t.special(d); return; }
  if (t.piste) {
    // 400 m, 8 couloirs de 1,22 m ; rayon intérieur 36,5 m, lignes droites de 84,39 m.
    const R0 = 36.5, R8 = R0 + 8 * 1.22, cy = t.l / 2, c1 = R8, c2 = R8 + 84.39;
    const stade = r => { g.beginPath(); g.arc(X(c2), Y(cy), r * s, -Math.PI / 2, Math.PI / 2); g.arc(X(c1), Y(cy), r * s, Math.PI / 2, 1.5 * Math.PI); g.closePath(); };
    g.fillStyle = t.hors; g.fillRect(0, 0, W, H);
    g.fillStyle = '#c4553b'; stade(R8 + 0.5); g.fill();
    g.fillStyle = t.sol; stade(R0); g.fill();
    g.lineWidth = Math.max(1, epais * 0.7);
    for (let k = 0; k <= 8; k++) { stade(R0 + k * 1.22); g.stroke(); }
    d.ligne(c2, cy + R0, c2, cy + R8, 2.5); // arrivée
    g.lineWidth = epais;
    return;
  }
  d.rect(0, 0, Lp, t.l);
  d.ligne(Lp / 2, 0, Lp / 2, t.l, t.filet ? 2.5 : 1);
  if (t.id === 'basket' || t.id === 'basket-demi') d.cercle(14, 7.5, 1.8);
  if (t.base === 'foot' || t.id === 'foot') { d.cercle(52.5, 34, 9.15); d.point(52.5, 34); }
  if (t.id.startsWith('hand')) d.ligne(20, 9.5, 20, 10.5);
  if (t.id === 'rugby') { d.ligne(60, 0, 60, 70); d.pointilles(() => d.ligne(70, 0, 70, 70)); d.ligne(88, 0, 88, 70); }
  if (t.id === 'ultimate') d.ligne(82, 0, 82, 37);
  if (t.id === 'volley') d.ligne(12, 0, 12, 9);
  t.moitie(d);
  // Seconde moitié, en miroir (inutile pour un demi-terrain : elle sortirait du cadre).
  if (!t.demi) { g.save(); g.translate(2 * X(Lp / 2), 0); g.scale(-1, 1); t.moitie(d); g.restore(); }
  if (t.id === 'rugby') { g.save(); g.translate(2 * X(60), 0); g.scale(-1, 1); d.pointilles(() => d.ligne(50, 0, 50, 70)); g.restore(); }
}

/* ---------- État (par classe, sur cet appareil) ---------- */

// traits : [{ c: n° de couleur, f: 1 si flèche, p: [[x, y]…] }] (coordonnées 0–1) ;
// pions : [{ id, type: 'eleve' | 'rouge' | 'bleu' | 'ballon' | 'plot', x, y, eq: n° de couleur d'équipe ou null, n }]
function cfgTableau(c) {
  return ((etatOutils.tableau ??= {})[c.id] ??= { terrain: 'hand', mode: 'deplacer', couleur: 0, taille: 'm', noms: true, traits: [], pions: [] });
}
const COULEURS_TB = [['Noir', '#1d2430'], ['Rouge', '#e53935'], ['Bleu', '#1e6fd9'], ['Jaune', '#ffd60a'], ['Blanc', '#ffffff'], ['Vert', '#2e9d4a']];
// Couleurs des équipes (mêmes noms que l'outil Équipes).
const COULEURS_EQ_TB = { Rouge: '#e53935', Bleu: '#1e6fd9', Vert: '#2e9d4a', Jaune: '#ffd60a', Orange: '#fb8c00', Violet: '#8e24aa', Blanc: '#ffffff', Noir: '#1d2430', Rose: '#ec407a', Gris: '#9e9e9e' };
const CYCLE_EQ_TB = [null, 0, 1, 2, 3]; // toucher une tête : sans équipe → rouge → bleu → vert → jaune → sans équipe
const TAILLES_TB = { s: [0.045, 'Petites'], m: [0.06, 'Moyennes'], l: [0.08, 'Grandes'] };
const MODES_TB = [['deplacer', '✋ Déplacer'], ['crayon', '✏️ Crayon'], ['fleche', '➜ Flèche'], ['gomme', '🧽 Gomme']];

/* ---------- Affichage ---------- */

// 🖥 Grand écran : seul le terrain est affiché, aussi grand que possible (plein écran de l'appareil si possible),
// et les outils se rangent dans une barre en bas. (Propre à cette page : on en sort par « ✕ » ou Échap.)
let presentationTb = false, menuOutilTb = false; // (menuOutilTb : panneau « Outil » ouvert)

function htmlTableau(c) {
  const cfg = cfgTableau(c), t = terrainTb(cfg.terrain);
  queueMicrotask(majTableau); // (une fois la page en place : taille, terrain, dessin, pions)
  const option = x => `<option value="${x.id}" ${x.id === t.id ? 'selected' : ''}>${esc(x.nom)}</option>`;
  const fond = `<label>${presentationTb ? '' : 'Fond'}<select data-tb-champ="terrain" aria-label="Fond">${TERRAINS_TB.filter(x => !x.multi).map(option).join('')}
    <optgroup label="Plusieurs terrains dans le gymnase">${TERRAINS_TB.filter(x => x.multi).map(option).join('')}</optgroup></select></label>`;
  const eleves = `<button class="primaire" data-tb="eleves" title="Choisir les élèves à placer sur le tableau">👥${presentationTb ? '' : ' Élèves'}</button>`;
  const pions = `<span class="groupe-tb" role="group" aria-label="Ajouter un pion">
        <button data-tb="pion" data-arg="rouge" title="Pion rouge (numéroté)">+ 🔴</button>
        <button data-tb="pion" data-arg="bleu" title="Pion bleu (numéroté)">+ 🔵</button>
        <button data-tb="pion" data-arg="ballon" title="Ballon">+ ⚽</button>
        <button data-tb="pion" data-arg="plot" title="Plot">+ 🔶</button>
      </span>`;
  const reglages = `<label>${presentationTb ? '' : 'Têtes'}<select data-tb-champ="taille" aria-label="Taille des têtes">${Object.entries(TAILLES_TB).map(([k, [, n]]) => `<option value="${k}" ${cfg.taille === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="case"><input type="checkbox" data-tb-champ="noms" ${cfg.noms ? 'checked' : ''}><span>Prénoms</span></label>`;
  const figer = `<button data-tb="figer" class="figer-tb${cfg.fige ? ' fige' : ''}" aria-pressed="${!!cfg.fige}"
        title="${cfg.fige ? 'Tableau figé : toucher pour pouvoir de nouveau dessiner et déplacer' : 'Figer le tableau : le doigt ne déplace plus rien et ne dessine plus'}">${cfg.fige ? '🔒 Figé' : '🔓 Figer'}</button>`;
  // « ✋ Déplacer » : un bouton à part, toujours à portée de doigt. Le bouton « Outil » ouvre le panneau
  // crayon / flèche / gomme, la couleur, annuler, effacer.
  const modeCourant = MODES_TB.find(([k]) => k === cfg.mode && k !== 'deplacer');
  const dessine = cfg.mode === 'crayon' || cfg.mode === 'fleche';
  const deplacer = `<button data-tb="mode" data-arg="deplacer" class="${cfg.mode === 'deplacer' ? 'primaire' : ''}" aria-pressed="${cfg.mode === 'deplacer'}"
      title="Déplacer les têtes et les pions au doigt">✋${presentationTb ? '' : ' Déplacer'}</button>`;
  const outil = `${deplacer}<details class="menu-outil-tb${presentationTb ? ' vers-haut' : ''}" data-tb-menu ${menuOutilTb ? 'open' : ''}>
      <summary class="bouton${modeCourant ? ' primaire' : ''}" title="Crayon, flèche, gomme, couleur">${modeCourant ? modeCourant[1].split(' ')[0] : '✏️'}${dessine ? `<span class="pastille-tb mini ct-${cfg.couleur}"></span>` : ''} Outil ▾</summary>
      <div class="panneau-outil-tb">
        <div class="groupe-tb" role="group" aria-label="Outil">${MODES_TB.filter(([k]) => k !== 'deplacer').map(([k, n]) => `<button data-tb="mode" data-arg="${k}" class="${cfg.mode === k ? 'primaire' : ''}" aria-pressed="${cfg.mode === k}">${n}</button>`).join('')}</div>
        <div class="groupe-tb couleurs-tb" role="group" aria-label="Couleur du crayon">${COULEURS_TB.map(([n], k) => `<button data-tb="couleur" data-arg="${k}" class="pastille-tb ct-${k}${cfg.couleur === k ? ' choisie' : ''}" title="${n}" aria-label="${n}" aria-pressed="${cfg.couleur === k}"></button>`).join('')}</div>
        <div class="groupe-tb">
          <button data-tb="annuler" title="Annuler le dernier trait" ${cfg.traits.length ? '' : 'disabled'}>↶ Annuler</button>
          <button data-tb="effacer-traits" title="Effacer tous les traits (les pions restent)" ${cfg.traits.length ? '' : 'disabled'}>🧹 Effacer le dessin</button>
        </div>
      </div>
    </details>`;
  const retirer = `<button data-tb="retirer-pions" title="Enlever toutes les têtes et tous les pions" ${cfg.pions.length ? '' : 'disabled'}>Retirer les pions</button>`;
  // Compétences à évaluer : une seule « active » ; un toucher sur une tête l'évalue (sinon : couleur d'équipe).
  const crit = critereActifTb(cfg);
  const competences = enModeEleve() ? '' : `<span class="groupe-tb crits-tb" role="group" aria-label="Évaluer une compétence">
      <button data-tb="critere" data-arg="" class="${crit ? '' : 'primaire'}" aria-pressed="${!crit}" title="Aucune compétence : un toucher sur une tête change la couleur de son équipe">🎽${presentationTb ? '' : ' Équipes'}</button>
      ${(cfg.criteres || []).map(k => `<button data-tb="critere" data-arg="${k.id}" class="chip-crit-tb crit-${k.couleur}${crit === k ? ' actif' : ''}" aria-pressed="${crit === k}"
        title="${crit === k ? 'Toucher à nouveau pour modifier ou supprimer cette compétence' : 'Évaluer : toucher les têtes des élèves'}">${esc(k.nom)} <small>${k.type === 'degre' ? '1–4' : '/' + fmt(k.sur)}</small></button>`).join('')}
      <button data-tb="ajout-critere" class="ajout-crit-tb" title="Créer une compétence à évaluer sur le tableau (degré 1 à 4 ou note)">➕${presentationTb ? '' : ' Compétence'}</button>
      ${presentationTb || !(cfg.criteres || []).some(k => Object.keys(cfg.evals?.[k.id] || {}).length) ? ''
    : '<button data-tb="vers-eval" title="Ranger ces résultats dans une évaluation (onglet Notes)">📤 Vers une évaluation</button>'}
    </span>`;
  const planche = `<div class="planche-tb mode-${cfg.mode}${cfg.fige ? ' fige' : ''}${crit ? ' evaluation' : ''}" data-tb-planche>
      <canvas class="fond-tb" data-tb-fond></canvas>
      <canvas class="dessin-tb" data-tb-dessin></canvas>
      <div class="pions-tb" data-tb-pions>${cfg.pions.map(p => htmlPionTb(p, badgeTb(cfg, crit, p))).join('')}</div>
    </div>`;
  if (presentationTb) {
    return `<div class="presentation-tb" data-tb-presentation>
      <div class="scene-tb">${planche}</div>
      <div class="barre-bas-tb" role="toolbar" aria-label="Outils du tableau">
        <button data-tb="presentation" class="quitter-presentation-tb" title="Quitter le grand écran (Échap)">✕ Quitter</button>
        ${competences}${figer}${outil}${eleves}${pions}${fond}${reglages}
      </div>
    </div>`;
  }
  return `
    <div class="barre-tableau">
      ${fond}${eleves}${pions}${reglages}
      <button data-tb="presentation" title="Afficher seulement le terrain, en grand (pour les élèves) ; les outils passent dans une barre en bas">🖥 Grand écran</button>
    </div>
    <div class="barre-tableau">${figer}${outil}${retirer}</div>
    ${competences ? `<div class="barre-tableau">${competences}</div>` : ''}
    <p class="aide aide-tableau">${crit ? `📝 <b>${esc(crit.nom)}</b> : touche la tête d’un élève pour ${crit.type === 'degre' ? 'choisir son degré (1 à 4)' : `lui mettre une note sur ${fmt(crit.sur)}`}${cfg.fige ? ' (tableau figé : les têtes ne bougent pas)' : ''}. « 🎽 Équipes » pour revenir aux couleurs d’équipe.`
    : cfg.fige ? '🔒 Tableau figé : rien ne bouge au doigt. « 🔒 Figé » pour le débloquer.'
    : cfg.mode === 'gomme' ? 'Gomme : touche un trait ou un pion pour l’effacer.'
    : 'Fais glisser les têtes et les pions au doigt ; un toucher sur une tête change la couleur de son équipe.'}</p>
    ${planche}`;
}

// Entrer en grand écran / en sortir (le plein écran de l'appareil suit, s'il est possible).
function basculerPresentationTb(oui = !presentationTb) {
  presentationTb = oui;
  const vue = $('#vue');
  if (oui && !document.fullscreenElement) vue?.requestFullscreen?.().catch(() => { /* pas de plein écran : la page couvre quand même tout */ });
  if (!oui && document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  rendreOutil();
}
// Plein écran quitté par le navigateur (Échap, geste) : on quitte aussi le grand écran.
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && presentationTb) basculerPresentationTb(false); });
// Échap sans plein écran (ex. iPad) : on quitte le grand écran, sauf si une fenêtre est ouverte.
document.addEventListener('keydown', e => { if (e.key === 'Escape' && presentationTb && !document.querySelector('dialog[open]')) basculerPresentationTb(false); });

/* ---------- 📝 Compétences évaluées sur le tableau ----------
   cfg.criteres : [{ id, nom, type: 'degre' | 'note', sur, couleur }] ; cfg.evals : { critereId: { eleveId: valeur } } ;
   cfg.critereActif : la compétence évaluée d'un toucher sur une tête. « 📤 Vers une leçon » range les résultats dans le carnet. */
const COULEURS_CRIT_TB = ['Rouge', 'Bleu', 'Vert', 'Orange', 'Violet'];
const critereActifTb = cfg => (enModeEleve() ? null : (cfg.criteres || []).find(k => k.id === cfg.critereActif) || null);

// Pastille sur la tête : le degré ou la note de la compétence active.
function badgeTb(cfg, crit, p) {
  const v = crit && p.type === 'eleve' ? cfg.evals?.[crit.id]?.[p.id] : undefined;
  if (v === undefined || v === null) return '';
  return crit.type === 'degre' ? `<span class="eval-pion-tb niveau n${v}">${v}</span>` : `<span class="eval-pion-tb note-tb crit-${crit.couleur}">${esc(fmt(v))}</span>`;
}

async function editerCritereTb(c, id = null) {
  const cfg = cfgTableau(c), avant = id && (cfg.criteres || []).find(k => k.id === id);
  const k = avant || { nom: '', type: 'degre', sur: 20, couleur: 0 };
  const nb = id ? Object.keys(cfg.evals?.[id] || {}).length : 0;
  const { d, resultat } = ouvrirModale(avant ? 'Modifier la compétence' : '➕ Nouvelle compétence', `
    <label>Nom<input name="nom" required maxlength="40" value="${esc(k.nom)}" placeholder="ex. Se démarquer, Passe décisive, Repli défensif…" autocomplete="off"></label>
    <div class="ligne">
      <label>Évaluée par<select name="type">
        <option value="degre" ${k.type === 'degre' ? 'selected' : ''}>un degré de 1 à 4</option>
        <option value="note" ${k.type === 'note' ? 'selected' : ''}>une note</option></select></label>
      <label class="etroit" data-note-sur ${k.type === 'note' ? '' : 'hidden'}>sur<input name="sur" type="number" min="1" max="100" step="1" value="${k.sur || 20}"></label>
    </div>
    <fieldset class="choix-import"><legend>Couleur du bouton</legend>
      <div class="couleurs-crit-tb">${COULEURS_CRIT_TB.map((n, i) => `<label class="case"><input type="radio" name="couleur" value="${i}" ${k.couleur === i ? 'checked' : ''}><span class="pastille-crit crit-${i}"></span>${n}</label>`).join('')}</div>
    </fieldset>
    ${nb ? `<p class="aide">${nb} élève${nb > 1 ? 's' : ''} déjà évalué${nb > 1 ? 's' : ''}${k.type ? ' — changer « degré / note » efface ces évaluations' : ''}.</p>` : ''}`,
  boutonsModale(avant ? 'Enregistrer' : 'Créer', avant ? '<button value="supprimer" class="danger" formnovalidate>Supprimer</button>' : ''));
  $('[name="nom"]', d).focus();
  d.addEventListener('change', e => { if (e.target.name === 'type') $('[data-note-sur]', d).hidden = e.target.value !== 'note'; });
  const r = await resultat;
  if (r.action === 'supprimer') {
    if (!(await confirmer(`Supprimer la compétence « ${k.nom} »${nb ? ` et ses ${nb} évaluation${nb > 1 ? 's' : ''}` : ''} ?`))) return;
    cfg.criteres = cfg.criteres.filter(x => x.id !== id);
    if (cfg.evals) delete cfg.evals[id];
    if (cfg.critereActif === id) cfg.critereActif = null;
    return rendreOutil();
  }
  if (r.action !== 'ok' || !r.data.nom.trim()) return;
  const nouveau = { id: id || 'k' + Date.now().toString(36), nom: r.data.nom.trim(), type: r.data.type === 'note' ? 'note' : 'degre',
    sur: Math.max(1, Math.min(100, Math.round(+r.data.sur || 20))), couleur: +r.data.couleur || 0 };
  if (avant && avant.type !== nouveau.type && cfg.evals) delete cfg.evals[id]; // (degrés et notes ne se convertissent pas)
  cfg.criteres = avant ? cfg.criteres.map(x => (x.id === id ? nouveau : x)) : [...(cfg.criteres || []), nouveau];
  cfg.critereActif = nouveau.id;
  rendreOutil();
}

// Évaluer un élève (toucher sa tête, compétence active) : 4 gros boutons de degré, ou une note.
async function evaluerTb(c, eleveId) {
  const cfg = cfgTableau(c), k = critereActifTb(cfg), el = Donnees.get('eleves', eleveId);
  if (!k || !el) return;
  const ev = ((cfg.evals ??= {})[k.id] ??= {}), v = ev[eleveId];
  const { d, resultat } = ouvrirModale(`${k.nom} — ${nomEleveOutil(el)}`, `
    <div class="eval-eleve-tb">${Trombi.mini(el, 'photo-fiche')}
      ${k.type === 'degre'
    ? `<div class="degres-tb">${[1, 2, 3, 4].map(n => `<button value="d${n}" class="niveau n${n}${v === n ? ' choisi' : ''}" aria-label="Degré ${n}">${n}</button>`).join('')}</div>`
    : `<label>Note sur ${fmt(k.sur)}<input name="note" inputmode="decimal" value="${v === undefined ? '' : esc(String(v).replace('.', ','))}" autocomplete="off" class="grand-champ-nat"></label>`}
    </div>`,
  `${v !== undefined ? '<button value="effacer" formnovalidate>Effacer</button>' : ''}<span class="espace"></span><button type="button" data-fermer>Annuler</button>${k.type === 'note' ? '<button value="ok" class="primaire">Enregistrer</button>' : ''}`);
  $('[name="note"]', d)?.focus();
  const r = await resultat;
  if (r.action === 'effacer') delete ev[eleveId];
  else if (/^d[1-4]$/.test(r.action)) ev[eleveId] = +r.action.slice(1);
  else if (r.action === 'ok') {
    const n = nombreOutil(r.data.note);
    if (n === null || n < 0 || n > k.sur) return toast(`Note entre 0 et ${fmt(k.sur)}.`, 'erreur');
    ev[eleveId] = n;
  } else return;
  bipToucher();
  rendreOutil();
}

// 📤 Vers une leçon : une colonne par compétence évaluée (degré → échelle 1 à 4 ; note → nombre).
TRANSFERTS.tableau = c => {
  const cfg = cfgTableau(c);
  const crits = (cfg.criteres || []).filter(k => Object.keys(cfg.evals?.[k.id] || {}).some(id => Donnees.get('eleves', id)));
  if (!crits.length) throw new Error('Aucune compétence évaluée sur le tableau : crée une compétence (➕), puis touche les têtes des élèves.');
  const apsa = terrainTb(cfg.terrain).nom.replace(/\s*[(:].*$/, '').trim();
  return { titre: `Tableau blanc — ${crits.map(k => k.nom).join(', ')}`.slice(0, 80), apsa: ['Fond blanc', 'Quadrillage'].includes(apsa) ? '' : apsa,
    colonnes: crits.map(k => ({ nom: k.nom, type: k.type === 'degre' ? 'echelle' : 'nombre', ...(k.type === 'note' ? { unite: '/' + k.sur } : {}),
      valeurs: Object.fromEntries(Object.entries(cfg.evals[k.id]).filter(([id]) => Donnees.get('eleves', id)).map(([id, v]) => [id, String(v)])) })) };
};

// 📤 Vers une évaluation (onglet Notes) : nouvelle ou existante. Une note → la note de l'évaluation (ramenée à son barème) ;
// un degré → une compétence de l'évaluation (la même, ajoutée comme compétence libre, ou une compétence déjà cochée).
async function envoyerVersEvalTb(c) {
  const cfg = cfgTableau(c), evalues = (cfg.criteres || []).filter(k => Object.keys(cfg.evals?.[k.id] || {}).some(id => Donnees.get('eleves', id)));
  if (!evalues.length) throw new Error('Aucune compétence évaluée sur le tableau : crée une compétence (➕), puis touche les têtes des élèves.');
  const evals = evalsDe(c.id).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const note = evalues.find(k => k.type === 'note');
  const optionsDest = (k, e) => k.type === 'note'
    ? `<option value="note">la note de l’évaluation${e ? ` (ramenée sur ${fmt(e.max)})` : ''}</option><option value="">ne pas envoyer</option>`
    : `<option value="libre">la compétence « ${esc(k.nom)} »${e && competencesEval(e).some(a => a.id === 'libre:' + k.nom) ? '' : ' (ajoutée à l’évaluation)'}</option>
       ${e ? competencesEval(e).filter(a => a.id !== 'libre:' + k.nom).map(a => `<option value="${esc(a.id)}">${esc(a.code)} — ${esc(a.texte.slice(0, 70))}</option>`).join('') : ''}
       <option value="">ne pas envoyer</option>`;
  const { d, resultat } = ouvrirModale(`📤 Vers une évaluation — ${c.nom}`, `
    <fieldset class="choix-import"><legend>Vers</legend>
      <label class="case"><input type="radio" name="vers" value="nouvelle" checked> <span>Une <b>nouvelle évaluation</b></span></label>
      <div class="ligne" data-nouvelle-eval>
        <label>Titre<input name="titre" maxlength="80" value="${esc(evalues.map(k => k.nom).join(', ').slice(0, 80))}"></label>
        <label class="etroit">Date<input name="date" type="date" value="${aujourdhui()}"></label>
        ${note ? `<label class="etroit">Notée sur<input name="max" type="number" min="1" max="100" value="${note.sur}"></label>` : ''}
      </div>
      ${note ? '' : '<p class="aide">Évaluation par compétences seulement (degrés 1 à 4) : aucune note n’est mise.</p>'}
      ${evals.length ? `<label class="case"><input type="radio" name="vers" value="existante"> <span>Une évaluation existante :</span></label>
        <select name="eval" aria-label="Évaluation existante">${evals.map(e => `<option value="${e.id}">${dateCourte(e.date)} — ${esc(e.titre)}${note ? ` (/${fmt(e.max)})` : ''}</option>`).join('')}</select>` : ''}
    </fieldset>
    <fieldset class="choix-import"><legend>Chaque compétence du tableau va dans…</legend>
      ${evalues.map(k => `<label>${esc(k.nom)} <span class="aide">${k.type === 'degre' ? 'degrés 1 à 4' : 'note sur ' + fmt(k.sur)} · ${Object.keys(cfg.evals[k.id]).length} élève(s)</span>
        <select name="dest-${k.id}" data-dest="${k.id}">${optionsDest(k, null)}</select></label>`).join('')}
    </fieldset>
    <p class="aide">Une case déjà remplie dans l’évaluation est remplacée par la valeur du tableau.</p>`,
  boutonsModale('Envoyer'));
  // Évaluation existante choisie : ses compétences sont proposées comme destination des degrés.
  const majDest = () => {
    const e = $('[name="vers"]:checked', d).value === 'existante' ? Donnees.get('evals', $('[name="eval"]', d).value) : null;
    $('[data-nouvelle-eval]', d).hidden = !!e;
    evalues.forEach(k => { const s = $(`[data-dest="${k.id}"]`, d), v = s.value; s.innerHTML = optionsDest(k, e); if ([...s.options].some(o => o.value === v)) s.value = v; });
  };
  d.addEventListener('change', ev => {
    if (ev.target.name === 'eval') $('[name="vers"][value="existante"]', d).checked = true;
    if (['vers', 'eval'].includes(ev.target.name)) majDest();
  });
  const r = await resultat;
  if (r.action !== 'ok') return;
  const dest = Object.fromEntries(evalues.map(k => [k.id, r.data['dest-' + k.id] || '']));
  const envoyes = evalues.filter(k => dest[k.id]);
  if (!envoyes.length) return toast('Rien à envoyer.', 'erreur');
  if (envoyes.filter(k => dest[k.id] === 'note').length > 1) return toast('Une seule compétence peut devenir la note de l’évaluation.', 'erreur');
  let e;
  const libres = envoyes.filter(k => dest[k.id] === 'libre').map(k => k.nom);
  if (r.data.vers === 'existante') {
    e = Donnees.get('evals', r.data.eval);
    const deja = (e.competencesLibres || '').split('\n').map(s => s.trim()).filter(Boolean);
    const manquent = libres.filter(n => !deja.includes(n));
    if (manquent.length) e = Donnees.ecrire('evals', { ...e, competencesLibres: [...deja, ...manquent].join('\n') });
  } else {
    e = Donnees.ecrire('evals', { id: Donnees.nouvelId(), classeId: c.id, cree: Date.now(), titre: (r.data.titre || '').trim() || 'Tableau blanc',
      apsa: TRANSFERTS.tableau(c).apsa, date: r.data.date || aujourdhui(), max: Math.max(1, +r.data.max || +reglage('notes').max || 20), coef: 1,
      referentiel: '', ca: '', competences: [], competencesLibres: libres.join('\n'), preremplir: false });
  }
  let n = 0;
  for (const k of envoyes) {
    for (const [id, v] of Object.entries(cfg.evals[k.id])) {
      if (!Donnees.get('eleves', id)) continue;
      if (dest[k.id] === 'note') Donnees.ecrireNote(e.id, id, String(Math.round((v * e.max / k.sur) * 100) / 100));
      else Donnees.ecrireNote(e.id, id, String(v), dest[k.id] === 'libre' ? 'libre:' + k.nom : dest[k.id]);
      n++;
    }
  }
  ui.vue = 'notes';
  memoriserUi();
  rendre();
  toast(`Envoyé dans « ${e.titre} » : ${n} résultat${n > 1 ? 's' : ''} ✔`, 'ok');
}

function htmlPionTb(p, badge = '') {
  if (p.type !== 'eleve') {
    const contenu = p.type === 'ballon' ? '⚽' : p.type === 'plot' ? '' : esc(p.n ?? '');
    return `<div class="pion-tb pion-${p.type}" data-tb-pion="${esc(p.id)}">${contenu}</div>`;
  }
  const el = Donnees.get('eleves', p.id);
  if (!el) return '';
  const memes = elevesDe(el.classeId).filter(x => x.id !== el.id && sansAccent(x.prenom) === sansAccent(el.prenom)).length;
  const nom = enModeEleve() || memes ? nomCourtEleve(el) : (el.prenom || el.nom);
  const eq = p.eq === null || p.eq === undefined ? '' : ` eq-tb-${p.eq}`;
  const photo = el.photo && !enModeEleve() ? `<img src="${el.photo}" alt="" draggable="false">`
    : `<span class="initiales-tb">${esc(`${(el.prenom || '')[0] || ''}${(el.nom || '')[0] || ''}`.toUpperCase())}</span>`;
  return `<div class="pion-tb pion-eleve${eq}" data-tb-pion="${esc(p.id)}" title="${esc(nomEleveOutil(el))}">${photo}<span class="nom-pion-tb" hidden>${esc(nom)}</span>${badge}</div>`;
}

// Taille de la planche (le terrain garde ses proportions, et tient dans l'écran), fond, dessin, pions.
let tailleTb = '';
function majTableau() {
  const planche = $('#vue [data-tb-planche]');
  if (!planche || ui.outil !== 'tableau') return;
  const c = classeActive();
  if (!c) return;
  const cfg = cfgTableau(c), t = defTerrainTb(cfg.terrain), ratio = ratioTb(t);
  const zone = planche.parentElement, dispoL = zone.clientWidth;
  // (Grand écran : toute la hauteur, moins la barre d'outils du bas.)
  const barreBas = presentationTb ? $('#vue .barre-bas-tb')?.offsetHeight || 0 : 0;
  const dispoH = presentationTb ? Math.max(200, zone.clientHeight || window.innerHeight - barreBas - 16)
    : Math.max(240, window.innerHeight - planche.getBoundingClientRect().top - 12);
  const W = Math.max(200, Math.floor(Math.min(dispoL, dispoH * ratio))), H = Math.round(W / ratio);
  planche.style.width = W + 'px';
  planche.style.height = H + 'px';
  tailleTb = `${dispoL}x${window.innerHeight}`;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  for (const cv of planche.querySelectorAll('canvas')) {
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  }
  dessinerTerrainTb($('[data-tb-fond]', planche), cfg.terrain);
  dessinerTraitsTb();
  placerPionsTb();
}

function placerPionsTb() {
  const planche = $('#vue [data-tb-planche]'), c = classeActive();
  if (!planche || !c) return;
  const cfg = cfgTableau(c), W = planche.clientWidth, H = planche.clientHeight;
  const d = Math.max(30, Math.round(W * TAILLES_TB[cfg.taille || 'm'][0]));
  for (const p of cfg.pions) {
    const n = planche.querySelector(`[data-tb-pion="${CSS.escape(p.id)}"]`);
    if (!n) continue;
    const taille = p.type === 'eleve' ? d : Math.round(d * 0.7);
    n.style.width = n.style.height = taille + 'px';
    n.style.left = Math.round(p.x * W - taille / 2) + 'px';
    n.style.top = Math.round(p.y * H - taille / 2) + 'px';
    n.style.fontSize = Math.round(taille * 0.42) + 'px';
    const nom = n.querySelector('.nom-pion-tb');
    if (nom) nom.hidden = !cfg.noms;
  }
}

function dessinerTraitsTb(enCours = null) {
  const cv = $('#vue [data-tb-dessin]'), c = classeActive();
  if (!cv || !c) return;
  const cfg = cfgTableau(c), g = cv.getContext('2d'), W = cv.width, H = cv.height;
  g.clearRect(0, 0, W, H);
  g.lineCap = g.lineJoin = 'round';
  for (const tr of [...cfg.traits, ...(enCours ? [enCours] : [])]) {
    const pts = tr.p.map(([x, y]) => [x * W, y * H]);
    if (!pts.length) continue;
    g.strokeStyle = g.fillStyle = COULEURS_TB[tr.c]?.[1] || '#000';
    g.lineWidth = Math.max(3, W / 220);
    g.beginPath();
    g.moveTo(...pts[0]);
    if (pts.length === 1) { g.arc(pts[0][0], pts[0][1], g.lineWidth / 2, 0, 2 * Math.PI); g.fill(); continue; }
    for (const q of pts.slice(1)) g.lineTo(...q);
    g.stroke();
    if (tr.f) {
      // Pointe de flèche au bout du trait.
      const [bx, by] = pts.at(-1), [ax, ay] = pts.at(-2), a = Math.atan2(by - ay, bx - ax), L = g.lineWidth * 4.5;
      g.beginPath();
      g.moveTo(bx, by);
      g.lineTo(bx - L * Math.cos(a - 0.45), by - L * Math.sin(a - 0.45));
      g.lineTo(bx - L * Math.cos(a + 0.45), by - L * Math.sin(a + 0.45));
      g.closePath();
      g.fill();
    }
  }
}

/* ---------- Doigt / souris : dessin, gomme, pions ---------- */

let gesteTb = null; // { trait } (dessin) | { pion, noeud, depart, bouge } (déplacement)
const pointTb = (e, planche) => {
  const r = planche.getBoundingClientRect();
  return [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))];
};

// Trait sous le doigt (pour la gomme), du plus récent au plus ancien.
function traitTouche(cfg, p, planche) {
  const W = planche.clientWidth, H = planche.clientHeight, tol = Math.max(14, W / 50), [px, py] = [p[0] * W, p[1] * H];
  for (let i = cfg.traits.length - 1; i >= 0; i--) {
    const pts = cfg.traits[i].p.map(([x, y]) => [x * W, y * H]);
    if (pts.length === 1 && Math.hypot(px - pts[0][0], py - pts[0][1]) <= tol) return i;
    for (let k = 1; k < pts.length; k++) if (distSegment(px, py, ...pts[k - 1], ...pts[k]) <= tol) return i;
  }
  return -1;
}

function majBoutonsTb(cfg) {
  document.querySelectorAll('#vue [data-tb="annuler"], #vue [data-tb="effacer-traits"]').forEach(b => { b.disabled = !cfg.traits.length; });
  const r = $('#vue [data-tb="retirer-pions"]');
  if (r) r.disabled = !cfg.pions.length;
}

document.addEventListener('pointerdown', e => {
  const planche = e.target.closest?.('#vue [data-tb-planche]');
  if (!planche || e.button > 0) return;
  const c = classeActive();
  if (!c) return;
  const cfg = cfgTableau(c), p = pointTb(e, planche), noeud = e.target.closest('[data-tb-pion]');
  if (cfg.fige) {
    // Tableau figé : rien ne bouge (la page défile normalement), mais on peut encore évaluer une tête.
    const pion = noeud && critereActifTb(cfg) && cfg.pions.find(x => x.id === noeud.dataset.tbPion);
    if (pion?.type === 'eleve') gesteTb = { pion, noeud, depart: [e.clientX, e.clientY], decal: [0, 0], bouge: false, fige: true };
    return;
  }
  e.preventDefault();
  if (cfg.mode === 'gomme') {
    if (noeud) {
      cfg.pions = cfg.pions.filter(x => x.id !== noeud.dataset.tbPion);
      noeud.remove();
    } else {
      const i = traitTouche(cfg, p, planche);
      if (i >= 0) { cfg.traits.splice(i, 1); dessinerTraitsTb(); }
    }
    gesteTb = { gomme: true };
    majBoutonsTb(cfg);
    sauverOutils();
    return;
  }
  if (noeud) {
    // Le pion pris passe au-dessus des autres.
    const pion = cfg.pions.find(x => x.id === noeud.dataset.tbPion);
    if (!pion) return;
    cfg.pions = [...cfg.pions.filter(x => x !== pion), pion];
    noeud.parentElement.append(noeud);
    noeud.classList.add('tenu');
    gesteTb = { pion, noeud, depart: [e.clientX, e.clientY], decal: [pion.x - p[0], pion.y - p[1]], bouge: false };
  } else if (cfg.mode === 'crayon' || cfg.mode === 'fleche') {
    gesteTb = { trait: { c: cfg.couleur, f: cfg.mode === 'fleche' ? 1 : 0, p: cfg.mode === 'fleche' ? [p, p] : [p] } };
    dessinerTraitsTb(gesteTb.trait);
  } else return;
  try { planche.setPointerCapture(e.pointerId); } catch { /* suit quand même */ }
});

document.addEventListener('pointermove', e => {
  if (!gesteTb) return;
  const planche = $('#vue [data-tb-planche]');
  if (!planche) return;
  const p = pointTb(e, planche), c = classeActive(), cfg = c && cfgTableau(c);
  if (gesteTb.gomme && cfg && e.buttons) {
    const i = traitTouche(cfg, p, planche);
    if (i >= 0) { cfg.traits.splice(i, 1); dessinerTraitsTb(); majBoutonsTb(cfg); sauverOutils(); }
    return;
  }
  if (gesteTb.pion) {
    if (Math.hypot(e.clientX - gesteTb.depart[0], e.clientY - gesteTb.depart[1]) > 6) gesteTb.bouge = true;
    if (!gesteTb.bouge || gesteTb.fige) return;
    gesteTb.pion.x = Math.min(1, Math.max(0, p[0] + gesteTb.decal[0]));
    gesteTb.pion.y = Math.min(1, Math.max(0, p[1] + gesteTb.decal[1]));
    placerPionsTb();
    return;
  }
  if (gesteTb.trait) {
    const tr = gesteTb.trait;
    if (tr.f) tr.p[1] = p;
    else {
      const der = tr.p.at(-1);
      if (Math.hypot(p[0] - der[0], p[1] - der[1]) < 0.004) return; // (points trop serrés : inutile de les garder)
      tr.p.push(p);
    }
    dessinerTraitsTb(tr);
  }
});

document.addEventListener('pointerup', () => {
  const g = gesteTb;
  gesteTb = null;
  if (!g) return;
  const c = classeActive();
  if (!c) return;
  const cfg = cfgTableau(c);
  if (g.pion) {
    g.noeud.classList.remove('tenu');
    // Simple toucher sur une tête : couleur d'équipe suivante.
    if (!g.bouge && g.pion.type === 'eleve' && critereActifTb(cfg)) {
      // Compétence active : un toucher sur la tête = l'évaluer.
      sauverOutils();
      return lancer(() => evaluerTb(c, g.pion.id));
    }
    if (!g.bouge && g.pion.type === 'eleve' && !g.fige) {
      const k = CYCLE_EQ_TB.indexOf(g.pion.eq ?? null);
      g.pion.eq = CYCLE_EQ_TB[(k + 1) % CYCLE_EQ_TB.length];
      g.noeud.className = 'pion-tb pion-eleve' + (g.pion.eq === null ? '' : ' eq-tb-' + g.pion.eq);
    }
  } else if (g.trait) {
    const tr = g.trait;
    if (tr.f && Math.hypot(tr.p[0][0] - tr.p[1][0], tr.p[0][1] - tr.p[1][1]) < 0.01) { dessinerTraitsTb(); return; } // flèche trop courte
    tr.p = tr.p.map(([x, y]) => [Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000]);
    cfg.traits.push(tr);
    dessinerTraitsTb();
    majBoutonsTb(cfg);
  }
  sauverOutils();
});
document.addEventListener('pointercancel', () => { if (gesteTb?.noeud) gesteTb.noeud.classList.remove('tenu'); gesteTb = null; dessinerTraitsTb(); });

/* ---------- Boutons ---------- */

// Nouvelles têtes : en rangées le long du bas du tableau (ou par équipe, une colonne chacune).
function placerNouveauxTb(cfg, ids, equipes = null) {
  if (equipes) {
    const nb = equipes.length;
    equipes.forEach((eq, k) => {
      const m = eq.membres.filter(id => ids.includes(id)), deux = m.length > 6, parCol = deux ? Math.ceil(m.length / 2) : m.length;
      m.forEach((id, j) => {
        const col = deux ? Math.floor(j / parCol) : 0, rang = deux ? j % parCol : j;
        cfg.pions.push({ id, type: 'eleve', eq: eq.couleur, x: (k + 0.5) / nb + (deux ? (col ? 0.035 : -0.035) : 0), y: (rang + 1) / (parCol + 1) });
      });
    });
    return;
  }
  const parRang = Math.max(4, Math.floor(1 / (TAILLES_TB[cfg.taille || 'm'][0] * 1.35)));
  ids.forEach((id, i) => {
    cfg.pions.push({ id, type: 'eleve', eq: null, x: ((i % parRang) + 0.5) / parRang, y: 0.86 - Math.floor(i / parRang) * 0.15 });
  });
}

async function choisirElevesTb(c) {
  const cfg = cfgTableau(c), tous = elevesDe(c.id), presents = new Set(presentsOutil(c).map(el => el.id));
  const sur = new Set(cfg.pions.filter(p => p.type === 'eleve').map(p => p.id));
  const eqs = (etatOutils.equipes?.[c.id]?.liste || []).filter(eq => eq.membres?.length);
  const tete = el => (el.photo && !enModeEleve() ? `<img class="mini-photo" src="${el.photo}" alt="">`
    : `<span class="mini-photo initiales-tb">${esc(`${(el.prenom || '')[0] || ''}${(el.nom || '')[0] || ''}`.toUpperCase())}</span>`);
  const { d, resultat } = ouvrirModale(`👥 Élèves sur le tableau — ${c.nom}`, `
    <div class="ligne-boutons-tb">
      <button type="button" data-tb-cocher="presents">Tous les présents (${presents.size})</button>
      <button type="button" data-tb-cocher="aucun">Aucun</button>
      ${eqs.length ? `<button type="button" data-tb-cocher="equipes" title="Les équipes faites dans l’outil Équipes">Les ${eqs.length} équipes</button>` : ''}
    </div>
    <div class="liste-eleves-tb">${tous.map(el => `
      <label class="case eleve-tb${presents.has(el.id) ? '' : ' absent-tb'}"><input type="checkbox" name="el" value="${el.id}" ${sur.has(el.id) ? 'checked' : ''}>
        ${tete(el)}<span>${esc(nomEleveOutil(el))}${presents.has(el.id) ? '' : ' <span class="aide">(absent)</span>'}</span></label>`).join('')}</div>
    ${eqs.length ? `<label class="case"><input type="checkbox" name="parEquipe"><span>Placer par équipe, avec la couleur de chaque équipe (outil Équipes)</span></label>` : ''}
    ${tous.some(el => el.photo) || enModeEleve() ? '' : '<p class="aide">Pas encore de photos : Élèves › 📷 Trombinoscope. En attendant, les têtes montrent les initiales.</p>'}`,
  boutonsModale('Afficher sur le tableau'), 'modale-large');
  d.addEventListener('click', e => {
    const b = e.target.closest('[data-tb-cocher]');
    if (!b) return;
    const quoi = b.dataset.tbCocher, membres = new Set(eqs.flatMap(eq => eq.membres));
    d.querySelectorAll('input[name="el"]').forEach(x => { x.checked = quoi === 'presents' ? presents.has(x.value) : quoi === 'equipes' ? membres.has(x.value) : false; });
    const pe = d.querySelector('[name="parEquipe"]');
    if (pe && quoi === 'equipes') pe.checked = true;
  });
  const r = await resultat;
  if (r.action !== 'ok') return;
  const choisis = r.fd.getAll('el');
  const garder = new Set(choisis);
  cfg.pions = cfg.pions.filter(p => p.type !== 'eleve' || garder.has(p.id));
  if (r.data.parEquipe === 'on') {
    // Par équipe : tout le monde est replacé, colonne par colonne.
    cfg.pions = cfg.pions.filter(p => p.type !== 'eleve');
    const dansEq = new Set(eqs.flatMap(eq => eq.membres));
    placerNouveauxTb(cfg, choisis, eqs);
    placerNouveauxTb(cfg, choisis.filter(id => !dansEq.has(id)));
  } else placerNouveauxTb(cfg, choisis.filter(id => !sur.has(id)));
  rendreOutil();
}

function actionTableau(action, arg, c) {
  const cfg = cfgTableau(c);
  switch (action) {
    case 'figer': cfg.fige = !cfg.fige; return rendreOutil();
    case 'critere':
      // Toucher la compétence déjà active : la modifier (ou la supprimer).
      if (arg && cfg.critereActif === arg) return editerCritereTb(c, arg);
      cfg.critereActif = arg || null;
      return rendreOutil();
    case 'ajout-critere': return editerCritereTb(c);
    case 'vers-eval': return envoyerVersEvalTb(c);
    case 'presentation': return basculerPresentationTb();
    // (Choisir un outil ou une couleur referme le panneau « Outil ».)
    case 'mode': cfg.mode = arg; cfg.fige = false; menuOutilTb = false; return rendreOutil();
    case 'couleur': cfg.couleur = +arg; if (cfg.mode !== 'crayon' && cfg.mode !== 'fleche') cfg.mode = 'crayon'; menuOutilTb = false; return rendreOutil();
    case 'annuler': cfg.traits.pop(); return rendreOutil();
    case 'effacer-traits': cfg.traits = []; return rendreOutil();
    case 'eleves': return choisirElevesTb(c);
    case 'pion': {
      // Pions rouges / bleus numérotés 1, 2, 3… ; posés au centre, un peu décalés pour ne pas s'empiler.
      const memes = cfg.pions.filter(p => p.type === arg);
      const n = arg === 'rouge' || arg === 'bleu' ? Math.max(0, ...memes.map(p => +p.n || 0)) + 1 : undefined;
      const k = memes.length % 6;
      cfg.pions.push({ id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), type: arg, n, x: 0.5 + (k - 2.5) * 0.04, y: arg === 'rouge' ? 0.4 : arg === 'bleu' ? 0.6 : 0.5 });
      if (cfg.mode === 'gomme') cfg.mode = 'deplacer';
      return rendreOutil();
    }
    case 'retirer-pions':
      return lancer(async () => { if (await confirmer('Enlever toutes les têtes et tous les pions du tableau ?', 'Enlever')) { cfg.pions = []; rendreOutil(); } });
  }
}

document.addEventListener('click', e => {
  const b = e.target.closest?.('#vue [data-tb]');
  if (!b || b.disabled) return;
  const c = classeActive();
  if (c) lancer(() => actionTableau(b.dataset.tb, b.dataset.arg, c));
});
document.addEventListener('change', e => {
  const t = e.target, k = t.dataset?.tbChamp;
  if (!k || !t.closest('#vue')) return;
  const c = classeActive();
  if (!c) return;
  const cfg = cfgTableau(c);
  cfg[k] = t.type === 'checkbox' ? t.checked : t.value;
  if (k === 'noms') { placerPionsTb(); return sauverOutils(); }
  rendreOutil();
});

// Écran tourné, fenêtre redimensionnée, plein écran : le tableau se réajuste.
let minuteurTailleTb = null;
const reajusterTb = () => { clearTimeout(minuteurTailleTb); minuteurTailleTb = setTimeout(() => { if (ui.vue === 'outils' && ui.outil === 'tableau') majTableau(); }, 80); };
window.addEventListener('resize', reajusterTb);
document.addEventListener('fullscreenchange', reajusterTb);

// Panneau « Outil » : reste ouvert ou fermé d'un affichage à l'autre (annuler / effacer ne le referment pas).
document.addEventListener('toggle', e => { if (e.target.matches?.('#vue [data-tb-menu]')) menuOutilTb = e.target.open; }, true);

RENDUS_OUTILS.tableau = htmlTableau;
