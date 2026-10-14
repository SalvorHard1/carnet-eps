'use strict';
// Outil « 🧑‍🏫 Tableau blanc » (Outils › Matchs) : une ardoise sur fond de terrain (basket, handball, football, volley,
// badminton, rugby, tennis, ultimate, piste d'athlétisme, quadrillage ou fond blanc). On y dessine au doigt (crayon,
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
];

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

function htmlTableau(c) {
  const cfg = cfgTableau(c), t = terrainTb(cfg.terrain);
  queueMicrotask(majTableau); // (une fois la page en place : taille, terrain, dessin, pions)
  return `
    <div class="barre-tableau">
      <label>Fond<select data-tb-champ="terrain">${TERRAINS_TB.map(x => `<option value="${x.id}" ${x.id === t.id ? 'selected' : ''}>${esc(x.nom)}</option>`).join('')}</select></label>
      <button class="primaire" data-tb="eleves" title="Choisir les élèves à placer sur le tableau">👥 Élèves</button>
      <span class="groupe-tb" role="group" aria-label="Ajouter un pion">
        <button data-tb="pion" data-arg="rouge" title="Pion rouge (numéroté)">+ 🔴</button>
        <button data-tb="pion" data-arg="bleu" title="Pion bleu (numéroté)">+ 🔵</button>
        <button data-tb="pion" data-arg="ballon" title="Ballon">+ ⚽</button>
        <button data-tb="pion" data-arg="plot" title="Plot">+ 🔶</button>
      </span>
      <label>Têtes<select data-tb-champ="taille">${Object.entries(TAILLES_TB).map(([k, [, n]]) => `<option value="${k}" ${cfg.taille === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="case"><input type="checkbox" data-tb-champ="noms" ${cfg.noms ? 'checked' : ''}><span>Prénoms</span></label>
    </div>
    <div class="barre-tableau">
      <button data-tb="figer" class="figer-tb${cfg.fige ? ' fige' : ''}" aria-pressed="${!!cfg.fige}"
        title="${cfg.fige ? 'Tableau figé : toucher pour pouvoir de nouveau dessiner et déplacer' : 'Figer le tableau : le doigt ne déplace plus rien et ne dessine plus'}">${cfg.fige ? '🔒 Figé' : '🔓 Figer'}</button>
      <span class="groupe-tb" role="group" aria-label="Outil">${MODES_TB.map(([k, n]) => `<button data-tb="mode" data-arg="${k}" class="${cfg.mode === k ? 'primaire' : ''}" aria-pressed="${cfg.mode === k}">${n}</button>`).join('')}</span>
      <span class="groupe-tb couleurs-tb" role="group" aria-label="Couleur du crayon">${COULEURS_TB.map(([n], k) => `<button data-tb="couleur" data-arg="${k}" class="pastille-tb ct-${k}${cfg.couleur === k ? ' choisie' : ''}" title="${n}" aria-label="${n}" aria-pressed="${cfg.couleur === k}"></button>`).join('')}</span>
      <button data-tb="annuler" title="Annuler le dernier trait" ${cfg.traits.length ? '' : 'disabled'}>↶ Annuler</button>
      <button data-tb="effacer-traits" title="Effacer tous les traits (les pions restent)" ${cfg.traits.length ? '' : 'disabled'}>🧹 Effacer le dessin</button>
      <button data-tb="retirer-pions" title="Enlever toutes les têtes et tous les pions" ${cfg.pions.length ? '' : 'disabled'}>Retirer les pions</button>
    </div>
    <p class="aide aide-tableau">${cfg.fige ? '🔒 Tableau figé : rien ne bouge au doigt. « 🔒 Figé » pour le débloquer.'
    : cfg.mode === 'gomme' ? 'Gomme : touche un trait ou un pion pour l’effacer.'
    : 'Fais glisser les têtes et les pions au doigt ; un toucher sur une tête change la couleur de son équipe.'}</p>
    <div class="planche-tb mode-${cfg.mode}${cfg.fige ? ' fige' : ''}" data-tb-planche>
      <canvas class="fond-tb" data-tb-fond></canvas>
      <canvas class="dessin-tb" data-tb-dessin></canvas>
      <div class="pions-tb" data-tb-pions>${cfg.pions.map(htmlPionTb).join('')}</div>
    </div>`;
}

function htmlPionTb(p) {
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
  return `<div class="pion-tb pion-eleve${eq}" data-tb-pion="${esc(p.id)}" title="${esc(nomEleveOutil(el))}">${photo}<span class="nom-pion-tb" hidden>${esc(nom)}</span></div>`;
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
  const dispoH = Math.max(240, window.innerHeight - planche.getBoundingClientRect().top - 12);
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
  if (cfg.fige) return; // tableau figé : le doigt ne modifie rien (la page défile normalement)
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
    if (!gesteTb.bouge) return;
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
    if (!g.bouge && g.pion.type === 'eleve') {
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
    case 'mode': cfg.mode = arg; cfg.fige = false; return rendreOutil();
    case 'couleur': cfg.couleur = +arg; if (cfg.mode !== 'crayon' && cfg.mode !== 'fleche') cfg.mode = 'crayon'; return rendreOutil();
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

RENDUS_OUTILS.tableau = htmlTableau;
