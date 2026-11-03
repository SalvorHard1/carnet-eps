'use strict';
// Onglet « Barèmes » › 📥 Importer un barème, quand le document n'est pas (bien) reconnu :
//   1. ✍️ Remplir manuellement : l'enseignant dit, sur le tableau lu, quelle ligne donne les noms des niveaux, quelles lignes
//      sont des rubriques (titres de blocs) ou des critères, quelle colonne est le nom du critère, ses points, chaque niveau.
//      L'appli en fait le barème ET retient la forme de la grille (« modèle appris » : noms des niveaux, rôle de chaque
//      colonne, rubriques, lignes à ignorer). Un prochain document de la même forme est alors reconnu seul (analyserBareme).
//   2. 📄 Barème vierge : un classeur Excel que l'appli lit à coup sûr (case A1 « BARÈME CARNET EPS », lignes « BLOC »),
//      à remplir soi-même ou à faire remplir par une IA (consigne fournie). Accepté en .xlsx ou en .csv.
// Les modèles appris sont rangés dans le carnet (réglage « modeles-import ») : aucune donnée d'élève, seulement des
// intitulés de colonnes. (Fichier chargé après importbareme.js, dont il utilise les outils de lecture.)

/* ---------- 1. Grille d'après le rôle des lignes et des colonnes ---------- */

const ROLES_LIGNE = { niveaux: '📋 Noms des niveaux', rubrique: '📁 Titre de bloc', critere: '🎯 Critère', ignorer: '✖ Ignorer' };
const ROLES_COLONNE = { nom: 'Nom du critère', pts: 'Points du critère', n1: 'Niveau 1 (le moins bon)', n2: 'Niveau 2', n3: 'Niveau 3', n4: 'Niveau 4 (le meilleur)', ignorer: 'Ignorer' };
const etiquetteImp = t => saImp(String(t || '').split('\n')[0]).replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 60);

// Descriptif d'une case de niveau, sans ses points (« 2,5 pts\nJe garde… », « Je garde… 2 pts », « 2 pts »).
function caseNiveau(t) {
  const s = String(t || '').trim(), e = ptsEnTeteCase(s);
  if (e) return { pts: e.pts, desc: e.desc.replace(/\s*\n\s*/g, ' ') };
  if (ptsCase(s) !== null) return { pts: ptsCase(s), desc: '' };
  const pts = ptsDansCase(s);
  const desc = pts === null ? s : s.replace(new RegExp(FOURCHETTE.source + '\\s*$', 'i'), '').replace(/(?:^|\s)\d+(?:[.,]\d+)?\s*(?:pts?|points?)\.?\s*$/i, '');
  return { pts, desc: desc.replace(/\s*\n\s*/g, ' ').trim() };
}

// l : tableau nettoyé ; roles = { lignes: [rôle par ligne], colonnes: [rôle par colonne] } → candidats (blocs proposés).
function grilleSelonRoles(l, roles, apsa, titreDefaut = 'Grille d’évaluation') {
  const col = k => roles.colonnes.indexOf(k), niv = ['n1', 'n2', 'n3', 'n4'].map(col), jNom = col('nom'), jPts = col('pts');
  const blocs = [];
  let bloc = null, n = 0;
  const nouveau = titre => blocs.push(bloc = { titre: nomPropre(titre) || titreDefaut, annonce: ptsAnnonces(titre), criteres: [] });
  l.forEach((r, i) => {
    const role = roles.lignes[i];
    if (role === 'rubrique') return nouveau(r.find(Boolean) || '');
    if (role !== 'critere' || !r.some(Boolean)) return;
    if (!bloc) nouveau('');
    n++;
    const nomBrut = jNom >= 0 ? r[jNom] || '' : '';
    const cases = niv.map(j => (j >= 0 ? caseNiveau(r[j]) : { pts: null, desc: '' }));
    const d = cases.map(c => c.pts);
    const ptsDegres = d.every(Number.isFinite) && d.every((v, k) => !k || v >= d[k - 1]) ? d : null;
    const points = (jPts >= 0 ? ptsCase(r[jPts] || '') ?? ptsAnnonces(r[jPts] || '') : null) ?? ptsAnnonces(nomBrut) ?? ptsDegres?.[3]
      ?? (d.some(Number.isFinite) ? Math.max(...d.filter(Number.isFinite)) : null) ?? 2;
    bloc.criteres.push({ nom: nomPropre(nomBrut) || `Critère ${n}`, points, cases: cases.map(c => c.desc), ...(ptsDegres && ptsDegres[3] === points ? { ptsDegres } : {}) });
  });
  const candidats = [];
  for (const b of blocs.filter(x => x.criteres.length)) {
    const { perfs, criteres } = perfsFillesGarcons(b.criteres, apsa);
    for (const p of perfs) candidats.push({ ...p, afl: null, garder: true });
    if (criteres.length) candidats.push({ type: 'degres', titre: !perfs.length ? b.titre : criteres.length === 1 ? `${b.titre} · ${criteres[0].nom}`.slice(0, 120) : `${b.titre} (suite)`, afl: null, garder: true, criteres });
  }
  return candidats;
}

// Premier rôle proposé : la ligne aux noms de niveaux (ou la 1re), une case remplie = rubrique, le reste = critères ;
// 1re colonne = nom du critère, colonnes suivantes = niveaux 1 à 4 (une colonne « points » repérée par son en-tête).
function rolesDevines(l) {
  let h = l.findIndex(r => r.filter(c => c && estDegre(c)).length >= 3);
  if (h < 0) h = l.findIndex(r => r.filter(Boolean).length >= 3);
  if (h < 0) h = 0;
  const lignes = l.map((r, i) => (i < h ? 'ignorer' : i === h ? 'niveaux' : r.filter(Boolean).length === 1 ? 'rubrique'
    : /^(total|note\s+finale|note\s*\/|nom\b)/.test(saImp(r.find(Boolean) || '')) ? 'ignorer' : 'critere'));
  const colonnes = l[h].map(() => 'ignorer');
  // (Colonne des points : son en-tête, « Pts », « Sur », « /20 »…, ou un nombre seul sur presque toutes les lignes de critères.)
  const crit = l.filter((_, i) => lignes[i] === 'critere');
  const chiffree = j => crit.length && crit.filter(r => ptsCase(r[j] || '') !== null).length >= crit.length * 0.8;
  let k = 0;
  l[h].forEach((c, j) => {
    if (j === 0) colonnes[j] = 'nom';
    else if (!colonnes.includes('pts') && !estDegre(c) && (/^(pts|points?|sur|bareme|note|total)\b/.test(etiquetteImp(c)) || /\/\s*\d+\s*$/.test(c) || chiffree(j))) colonnes[j] = 'pts';
    else if (k < 4) colonnes[j] = 'n' + ++k;
  });
  return { lignes, colonnes };
}

/* ---------- 2. Modèles appris ---------- */

const modelesAppris = () => Donnees.get('reglages', 'modeles-import')?.liste || [];
function ecrireModelesAppris(liste) {
  Donnees.ecrire('reglages', { ...Donnees.get('reglages', 'modeles-import'), id: 'modeles-import', liste: liste.slice(0, 30) });
}

// Ce que l'appli retient d'une grille remplie à la main (seulement des intitulés, jamais le contenu des cases).
function modeleDeLaGrille(l, roles, nomFichier) {
  const h = roles.lignes.indexOf('niveaux');
  if (h < 0) return null;
  const colonnes = l[h].map((c, j) => ({ etiquette: etiquetteImp(c), role: roles.colonnes[j] }));
  if (colonnes.filter(c => /^n\d$/.test(c.role) && c.etiquette).length < 2) return null;
  const ignorer = [...new Set(l.map((r, i) => (i > h && roles.lignes[i] === 'ignorer' ? etiquetteImp(r.find(Boolean)) : '')).filter(Boolean))].slice(0, 20);
  return { id: Donnees.nouvelId(), nom: nomFichier, date: aujourdhui(), ncol: l[h].length, colonnes,
    rubriques: roles.lignes.some((x, i) => i > h && x === 'rubrique'), ignorer };
}

function retenirModele(m) {
  const sig = x => x.colonnes.filter(c => /^n\d$/.test(c.role)).map(c => c.etiquette).join('|');
  ecrireModelesAppris([m, ...modelesAppris().filter(x => sig(x) !== sig(m))]);
}

// Rôles d'un tableau d'après un modèle appris : en-tête retrouvé par les noms de niveaux (au moins 2, et 70 % d'entre eux).
function rolesSelonModele(l, m) {
  const niveaux = m.colonnes.filter(c => /^n\d$/.test(c.role) && c.etiquette);
  const h = l.findIndex(r => { const e = new Set(r.map(etiquetteImp)); const vus = niveaux.filter(c => e.has(c.etiquette)).length; return vus >= 2 && vus >= niveaux.length * 0.7; });
  if (h < 0) return null;
  const colonnes = l[h].map((c, j) => m.colonnes.find(x => x.etiquette && x.etiquette === etiquetteImp(c))?.role
    ?? (l[h].length === m.ncol ? m.colonnes[j]?.role : null) ?? 'ignorer');
  if (colonnes.filter(x => /^n\d$/.test(x)).length < 2) return null;
  const entete = l[h].map(etiquetteImp).join('|');
  const lignes = l.map((r, i) => {
    if (i < h) return 'ignorer';
    if (i === h) return 'niveaux';
    if (r.map(etiquetteImp).join('|') === entete) return 'ignorer'; // (en-tête répété après un saut de page)
    const pleines = r.filter(Boolean);
    if (!pleines.length || m.ignorer.includes(etiquetteImp(pleines[0]))) return 'ignorer';
    return pleines.length === 1 ? (m.rubriques ? 'rubrique' : 'ignorer') : 'critere';
  });
  return { lignes, colonnes };
}

// Appelé par analyserBareme pour chaque tableau : le premier modèle appris qui s'applique (le plus récent d'abord).
// precedent : tableau d'avant reconnu par un modèle (suite d'une grille coupée par un saut de page, même nombre de colonnes).
function grilleApprise(l, apsa, precedent) {
  for (const m of modelesAppris()) {
    const roles = rolesSelonModele(l, m);
    if (!roles) continue;
    const candidats = grilleSelonRoles(l, roles, apsa);
    if (candidats.length) return { nom: m.nom, candidats, suite: { m, colonnes: roles.colonnes, ncol: l[0].length } };
  }
  if (precedent && l[0].length === precedent.ncol) {
    const lignes = l.map(r => { const p = r.filter(Boolean); return !p.length || precedent.m.ignorer.includes(etiquetteImp(p[0])) ? 'ignorer' : p.length === 1 ? (precedent.m.rubriques ? 'rubrique' : 'ignorer') : 'critere'; });
    const candidats = grilleSelonRoles(l, { lignes, colonnes: precedent.colonnes }, apsa);
    if (candidats.length) return { nom: precedent.m.nom, candidats, suite: precedent, continue: lignes.find(x => x !== 'ignorer') === 'critere' };
  }
  return null;
}

/* ---------- 3. Fenêtre « ✍️ Remplir manuellement » ---------- */

async function apprendreGrille(fichier, a) {
  const tables = (a.elements || []).filter(e => e.type === 'table').map(e => nettoyerTable(e.lignes)).filter(l => l.length >= 2 && l[0].length >= 2);
  if (!tables.length) {
    toast('Aucun tableau lu dans ce document : crée le barème avec « + Nouveau barème », ou utilise le barème vierge.', 'erreur');
    return verifierImport(fichier, a);
  }
  // (Le tableau le plus grand d'abord : c'est en général la grille.)
  const ordre = tables.map((l, k) => k).sort((x, y) => tables[y].length * tables[y][0].length - tables[x].length * tables[x][0].length);
  const roles = tables.map(rolesDevines);
  const actifs = tables.map((_, k) => k === ordre[0]);
  let courant = ordre[0];
  const court = t => { const s = String(t || '').replace(/\s*\n\s*/g, ' / '); return s.length > 90 ? s.slice(0, 88) + '…' : s; };
  const { d, resultat } = ouvrirModale(`✍️ ${fichier.name}`, `
    <p class="aide">Remplis manuellement : l’appli s’entraîne à reconnaître les spécificités de tes barèmes.
      Indique à gauche le rôle de chaque ligne, et en haut le rôle de chaque colonne. Le résultat s’affiche en dessous.
      L’appli retient la forme de cette grille (noms des niveaux, colonnes, rubriques) : tes prochains barèmes du même modèle seront reconnus seuls.</p>
    ${tables.length > 1 ? `<div class="ligne"><label>Tableau<select data-app-table>${ordre.map(k => `<option value="${k}">Tableau ${k + 1} — ${tables[k].length} lignes : ${esc(court(tables[k][0].filter(Boolean).join(' | ')).slice(0, 60))}</option>`).join('')}</select></label>
      <label class="case"><input type="checkbox" data-app-actif checked><span>Utiliser ce tableau</span></label></div>` : ''}
    <div class="table-defile zone-apprendre"></div>
    <h3>Résultat</h3>
    <div class="resultat-apprendre"></div>`,
  boutonsModale('Valider et apprendre'), 'modale-large');
  const zone = $('.zone-apprendre', d), res = $('.resultat-apprendre', d);
  const options = (liste, choisi) => Object.entries(liste).map(([k, n]) => `<option value="${k}" ${k === choisi ? 'selected' : ''}>${esc(n)}</option>`).join('');
  const dessinerTable = () => {
    const l = tables[courant], r = roles[courant];
    zone.innerHTML = `<table class="table-bareme table-apprendre${actifs[courant] ? '' : ' ecarte'}">
      <thead><tr><th>Rôle de la ligne</th>${l[0].map((_, j) => `<th><select data-app-col="${j}" aria-label="Rôle de la colonne ${j + 1}">${options(ROLES_COLONNE, r.colonnes[j])}</select></th>`).join('')}</tr></thead>
      <tbody>${l.map((ligne, i) => `<tr class="role-${r.lignes[i]}"><th><select data-app-ligne="${i}" aria-label="Rôle de la ligne ${i + 1}">${options(ROLES_LIGNE, r.lignes[i])}</select></th>
        ${ligne.map(c => `<td title="${esc(c)}">${esc(court(c))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  };
  const candidatsFaits = () => tables.flatMap((l, k) => (actifs[k] ? grilleSelonRoles(l, roles[k], a.apsa, a.titre) : []));
  const dessinerResultat = () => {
    const cand = candidatsFaits();
    const total = Math.round(cand.reduce((s, x) => s + pointsBloc(blocDuCandidat(x, 0.5)), 0) * 100) / 100;
    res.innerHTML = cand.length ? cand.map(x => {
      const b = blocDuCandidat(x, 0.5), [icone] = TYPES_BLOCS[b.type], [entete, ...lignes] = lignesBloc(b, 0.5);
      return `<section class="bloc-import"><div class="tete-bloc"><span class="type-bloc">${icone}</span><b class="titre-bloc">${esc(b.titre)}</b><span class="pts-bloc">${fmt(pointsBloc(b))} pts</span></div>
        <div class="table-defile"><table class="table-bareme apercu-import"><thead><tr>${entete.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead>
        <tbody>${lignes.slice(0, 8).map(r => `<tr>${r.map(c => `<td>${esc(court(c))}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>`;
    }).join('') + `<p class="total-import">Total : <b>${fmt(total)} points</b></p>`
      : '<p class="aide alerte-import">⚠ Aucun critère : marque au moins une ligne « 🎯 Critère » et une colonne « Niveau ».</p>';
  };
  d.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.appTable !== undefined) { courant = +t.value; $('[data-app-actif]', d).checked = actifs[courant]; dessinerTable(); return; }
    if (t.dataset.appActif !== undefined) { actifs[courant] = t.checked; dessinerTable(); }
    else if (t.dataset.appLigne !== undefined) {
      // (Une seule ligne des noms de niveaux par tableau.)
      if (t.value === 'niveaux') roles[courant].lignes = roles[courant].lignes.map(x => (x === 'niveaux' ? 'ignorer' : x));
      roles[courant].lignes[+t.dataset.appLigne] = t.value;
      dessinerTable();
    } else if (t.dataset.appCol !== undefined) {
      // (Chaque rôle de colonne, sauf « Ignorer », ne sert qu'une fois.)
      if (t.value !== 'ignorer') roles[courant].colonnes = roles[courant].colonnes.map(x => (x === t.value ? 'ignorer' : x));
      roles[courant].colonnes[+t.dataset.appCol] = t.value;
      dessinerTable();
    }
    dessinerResultat();
  });
  dessinerTable();
  dessinerResultat();
  const r = await resultat;
  if (r.action !== 'ok') return verifierImport(fichier, a);
  const cand = candidatsFaits();
  const modeles = tables.map((l, k) => (actifs[k] ? modeleDeLaGrille(l, roles[k], fichier.name) : null)).filter(Boolean);
  modeles.forEach(retenirModele);
  if (modeles.length) toast('🎓 Modèle appris : les barèmes de la même forme seront reconnus seuls', 'ok');
  else if (cand.length) toast('Barème rempli. Pour que l’appli apprenne cette forme, il faut une ligne « 📋 Noms des niveaux ».', 'erreur');
  return verifierImport(fichier, { ...a, candidats: [...cand, ...a.candidats.filter(x => x.type === 'texte')].map(x => (x.type === 'texte' ? { ...x, garder: false } : x)),
    alertes: [], appris: modeles.length ? [fichier.name] : [] });
}

/* ---------- 4. Barème vierge : écriture, consigne pour une IA, lecture ---------- */

const MARQUE_VIERGE = 'BARÈME CARNET EPS';
const ENTETES_VIERGE = {
  Grille: ['Critère', 'Points du critère', 'Niveau 1 (le moins bon)', 'Niveau 2', 'Niveau 3', 'Niveau 4 (le meilleur)', 'Pts niveau 1', 'Pts niveau 2', 'Pts niveau 3', 'Pts niveau 4'],
  Performance: ['Points', 'Filles', 'Garçons'],
  Paliers: ['Palier', 'Points'],
  Critères: ['Critère', 'Points'],
  Texte: ['Texte'],
};

function feuilleVierge(exemple) {
  const e = x => ({ v: x, style: 'entete' }), aide = x => ({ v: x, style: 'aide' });
  const bloc = (type, titre, plus = []) => [e('BLOC'), e(type), e(titre), ...plus.map(e)];
  const lignes = [
    [{ v: exemple ? 'EXEMPLE (cette feuille n’est pas importée)' : MARQUE_VIERGE, style: 'titre' }, aide(exemple ? '' : '← ne pas modifier : cette case permet à l’appli de reconnaître le fichier')],
    ['Titre', exemple ? 'Combiné course + tir — 4e' : ''],
    ['Activité', exemple ? 'Combiné' : ''],
    ['Niveau', exemple ? '4e' : '', aide('6e, 5e, 4e, 3e, Collège ou Lycée')],
    [],
    bloc('Performance', exemple ? 'Chrono départ → arrivée' : 'Performance', ['Temps']), ENTETES_VIERGE.Performance.map(e),
    ...(exemple ? [[5, '2\'49', '2\'39'], [4, '3\'09', '2\'59'], [2.5, '3\'34', '3\'24'], [1, '59\'59', '59\'59']] : [[], [], []]),
    [],
    bloc('Grille', exemple ? 'Maîtrise motrice et rôles' : 'Grille par degrés'), ENTETES_VIERGE.Grille.map(e),
    ...(exemple ? [
      ['Course : continuité et allure', 2, 'Je m’arrête ou je marche', 'Je pars trop vite, mon allure baisse', 'Allure régulière, j’arrive au tir en contrôlant', 'Allure régulière ou finish ; transition rapide', 0.5, 1, 1.5, 2],
      ['Rôle de juge de tir', 3, 'Je ne tiens pas mon rôle', 'Je tiens mon rôle avec de l’aide', 'J’annonce juste et au bon moment', 'Juste et autonome ; je conseille le tireur', 0.5, 1.5, 2.5, 3],
    ] : [[], [], []]),
    [],
    bloc('Paliers', exemple ? 'Projet : écart temps annoncé / réalisé' : 'Barème à paliers'), ENTETES_VIERGE.Paliers.map(e),
    ...(exemple ? [['Écart de 3 s ou moins', 3], ['Écart de 4 à 10 s', 1.5], ['Plus de 10 s ou pas de projet', 0.5]] : [[], []]),
    [],
    bloc('Critères', exemple ? 'Échauffement' : 'Critères observables'), ENTETES_VIERGE.Critères.map(e),
    ...(exemple ? [['Mène son échauffement seul', 1], ['Fait la routine complète (cardio + gammes)', 1]] : [[], []]),
    [],
    bloc('Texte', exemple ? 'Conditions de l’épreuve' : 'Consignes'), ENTETES_VIERGE.Texte.map(e),
    [exemple ? '2 tours, tir 1, 2 tours, tir 2, fin du tour, arrivée. 1 flèche par tir.' : ''],
  ];
  return { nom: exemple ? 'Exemple' : 'Barème', lignes, largeurs: [34, 22, 30, 30, 30, 30, 12, 12, 12, 12] };
}

function telechargerBaremeVierge() {
  const emploi = CONSIGNE_IA_BAREME.split('\n').map(t => [t]);
  telechargerBlob(Tableur.ecrire([feuilleVierge(false), feuilleVierge(true), { nom: 'Mode d’emploi', lignes: [[{ v: 'Mode d’emploi', style: 'titre' }], [], ...emploi], largeurs: [140] }]),
    'Barème vierge Carnet EPS.xlsx');
  toast('Barème vierge téléchargé ✔', 'ok');
}

const CONSIGNE_IA_BAREME = `Voici mon barème d’évaluation (document joint) et un fichier Excel vierge « Barème vierge Carnet EPS.xlsx ».
Recopie mon barème dans la feuille « Barème » de ce fichier, sans rien inventer, en respectant ces règles :
1. Ne modifie pas la case A1 (« ${MARQUE_VIERGE} ») ni les mots « BLOC » de la colonne A.
2. Remplis Titre, Activité et Niveau (6e, 5e, 4e, 3e, Collège ou Lycée) dans la colonne B.
3. Chaque partie du barème devient un bloc : une ligne « BLOC | type | titre du bloc », puis sa ligne d’en-tête, puis une ligne par élément. Les types :
 - Grille : critères évalués sur 4 niveaux. Colonnes : Critère | Points du critère | Niveau 1 | Niveau 2 | Niveau 3 | Niveau 4 (descriptifs, du moins bon au meilleur) | Pts niveau 1 | Pts niveau 2 | Pts niveau 3 | Pts niveau 4 (points exacts de chaque niveau, si le barème les donne ; sinon laisser vide).
 - Performance : tableau points ↔ performances. En colonne D de la ligne BLOC : Temps, Distance ou Nombre. Colonnes : Points | Filles | Garçons (ou Points | Tous si le barème est le même pour tous). Une ligne par note, de la meilleure à la moins bonne ; dans chaque case, la performance la moins bonne qui donne encore ces points (le temps le plus long, la distance la plus courte). Temps écrits 3'25 (minutes'secondes) ou 10"5 (secondes) ; distances en mètres (4,20).
 - Paliers : une seule ligne s’applique (écart au projet, classement…). Colonnes : Palier | Points.
 - Critères : chaque critère rempli rapporte ses points. Colonnes : Critère | Points.
 - Texte : consignes, conditions de l’épreuve (le texte dans la colonne A, sous l’en-tête).
4. Ajoute autant de lignes et de blocs que nécessaire, dans l’ordre du barème ; supprime les blocs inutiles. S’il y a 3 ou 5 niveaux, ramène-les à 4.
5. Écris les nombres avec une virgule (2,5). Pas de cases fusionnées. Aucun nom d’élève.
6. Rends-moi le fichier .xlsx rempli. Si tu ne peux pas créer de fichier, donne le contenu au format CSV (séparateur « ; »), que j’enregistrerai dans un fichier .csv.
La feuille « Exemple » montre un barème rempli.`;

// CSV (« ; », « , » ou tabulation, guillemets) → lignes de texte.
function lireCsv(texte) {
  texte = texte.replace(/^﻿/, '');
  const premiere = texte.split('\n')[0];
  const sep = ['\t', ';', ','].map(s => [s, premiere.split(s).length]).sort((x, y) => y[1] - x[1])[0][0];
  const lignes = [];
  let ligne = [], cas = '', guil = false;
  for (let i = 0; i < texte.length; i++) {
    const ch = texte[i];
    if (guil) { if (ch === '"' && texte[i + 1] === '"') { cas += '"'; i++; } else if (ch === '"') guil = false; else cas += ch; continue; }
    if (ch === '"' && !cas) guil = true;
    else if (ch === sep) { ligne.push(cas.trim()); cas = ''; }
    else if (ch === '\n') { ligne.push(cas.trim()); lignes.push(ligne); ligne = []; cas = ''; }
    else if (ch !== '\r') cas += ch;
  }
  if (cas || ligne.length) { ligne.push(cas.trim()); lignes.push(ligne); }
  return lignes;
}

// Temps lu dans le barème vierge (« 3'25 », « 10"5 », ou heure d'Excel : « 3:25 » tapé devient 0,1423… jour = 3 h 25,
// compris comme 3 min 25 s).
function tempsVierge(t) {
  const s = String(t || '').trim();
  if (/^0[.,]\d+$/.test(s)) { const j = nbImp(s), sec = j * 86400; return Math.round((sec > 3 * 3600 ? j * 1440 : sec) * 10) / 10; }
  return perfLue('temps', s);
}

// lignes : celles de la feuille (Excel) ou du CSV. null si ce n'est pas un barème vierge du Carnet EPS.
function lireBaremeVierge(lignes, nomFichier) {
  lignes = lignes.map(r => Array.from(r || [], c => String(c ?? '').trim()));
  const debut = lignes.findIndex(r => saImp(r[0] || '').replace(/[^a-z]+/g, ' ').trim() === 'bareme carnet eps');
  if (debut < 0) return null;
  const champ = nom => lignes.slice(debut + 1, debut + 8).find(r => saImp(r[0] || '').startsWith(nom))?.[1] || '';
  const titre = champ('titre') || nomFichier.replace(/\.[^.]+$/, ''), apsa = champ('activite');
  const nTxt = saImp(champ('niveau'));
  let niveau = /lycee|bac|seconde|2nde|premiere|terminale/.test(nTxt) ? 'lycee' : niveauDuTexte(nTxt) || 'college';
  if (!niveauxBareme()[niveau]) niveau = Object.keys(niveauxBareme())[0];
  const candidats = [], alertes = [];
  let bloc = null;
  const num = t => { const v = nbImp(String(t).replace(/\s*(pts?|points?)\.?$/i, '').trim()); return String(t).trim() && Number.isFinite(v) ? v : null; };
  const finir = () => {
    if (!bloc) return;
    const b = bloc;
    bloc = null;
    if (b.type === 'degres') {
      const criteres = b.lignes.filter(r => r[0] || r.slice(2, 6).some(Boolean)).map((r, k) => {
        const d = r.slice(6, 10).map(num), ptsDegres = d.every(v => v !== null) ? d : null;
        const points = num(r[1]) ?? ptsDegres?.[3] ?? 2;
        return { nom: r[0] || `Critère ${k + 1}`, points, cases: [2, 3, 4, 5].map(j => r[j] || ''), ...(ptsDegres && ptsDegres[3] === points ? { ptsDegres } : {}) };
      });
      if (criteres.length) candidats.push({ type: 'degres', titre: b.titre || 'Grille par degrés', afl: null, garder: true, criteres });
    } else if (b.type === 'perf') {
      const e = b.entete.map(saImp), jf = e.findIndex(x => /^fille/.test(x)), jg = e.findIndex(x => /^garcon/.test(x));
      const jv = jf < 0 && jg < 0 ? 1 : -1, unite = /dist|metre|long|haut/.test(saImp(b.unite)) ? 'distance' : /nomb|repet|point/.test(saImp(b.unite)) ? 'nombre' : 'temps';
      const val = t => { if (!t) return null; if (unite !== 'temps') return String(t); const v = tempsVierge(t); return v === null ? String(t) : formatTemps(v); };
      const lignesP = b.lignes.filter(r => num(r[0]) !== null).map(r => ({ pts: num(r[0]), brut: Object.fromEntries([['f', jf], ['g', jg], ['v', jv]].filter(([, j]) => j >= 0 && r[j]).map(([c, j]) => [c, val(r[j])])) }));
      if (lignesP.length) candidats.push({ type: 'perf', unite, cles: jv >= 0 ? ['v'] : ['f', 'g'].filter(c => lignesP.some(l => l.brut[c])), supposes: false, titre: b.titre || 'Performance', lignes: lignesP.sort((x, y) => y.pts - x.pts) });
    } else if (b.type === 'ecart' || b.type === 'criteres') {
      const ls = b.lignes.filter(r => r[0] && num(r[1]) !== null).map(r => ({ libelle: r[0], pts: num(r[1]) }));
      if (ls.length) candidats.push({ type: b.type, titre: b.titre || TYPES_BLOCS[b.type][1], garder: true, lignes: ls });
    } else {
      const t = b.lignes.map(r => r.filter(Boolean).join(' ')).filter(Boolean).join('\n');
      if (t) candidats.push({ type: 'texte', titre: b.titre || 'Consignes', texte: t.slice(0, 4000), garder: true });
    }
  };
  const TYPES = [[/^grille|degre|niveau/, 'degres'], [/^perf|temps|chrono|distance/, 'perf'], [/^palier/, 'ecart'], [/^crit/, 'criteres'], [/^texte|consigne/, 'texte']];
  for (const r of lignes.slice(debut + 1)) {
    if (saImp(r[0] || '') === 'bloc') {
      finir();
      const type = TYPES.find(([re]) => re.test(saImp(r[1] || '')))?.[1];
      if (!type) { alertes.push(`Bloc de type « ${r[1] || '?'} » inconnu : ignoré (types possibles : Grille, Performance, Paliers, Critères, Texte).`); continue; }
      bloc = { type, titre: r[2] || '', unite: r[3] || '', entete: null, lignes: [] };
      continue;
    }
    if (!bloc || !r.some(Boolean)) continue;
    // (Ligne d'en-tête : celle du modèle, juste après la ligne BLOC.)
    if (!bloc.entete && !bloc.lignes.length && /^(critere|points?|palier|texte)\b/.test(saImp(r[0] || ''))) { bloc.entete = r; continue; }
    bloc.lignes.push(r);
  }
  finir();
  if (!candidats.length) alertes.push('Le barème vierge ne contient encore aucun bloc rempli.');
  return { titre: titre.slice(0, 120), apsa, niveau, candidats, alertes, groupes: [], texteLu: lignes.map(r => r.filter(Boolean).join(' | ')).filter(Boolean).join('\n').slice(0, 6000), elements: [], vierge: true };
}

// Fichier .xlsx ou .csv : barème vierge du Carnet EPS ? (analyse prête, ou null.)
async function essaiBaremeVierge(fichier) {
  if (/\.csv$/i.test(fichier.name) || /\.txt$/i.test(fichier.name)) return lireBaremeVierge(lireCsv(await fichier.text()), fichier.name);
  if (!/\.xlsx$/i.test(fichier.name)) return null;
  for (const f of await Tableur.lire(fichier)) { const a = lireBaremeVierge(f.lignes, fichier.name); if (a) return a; }
  return null;
}

/* ---------- 5. Fenêtre « 📥 Importer un barème » ---------- */

async function menuImportBareme() {
  const dessinerAppris = () => {
    const liste = modelesAppris();
    return liste.length ? `<ul class="liste-appris">${liste.map(m => `<li><span>🎓 <b>${esc(m.nom)}</b> <span class="aide">— ${esc(m.colonnes.filter(c => /^n\d$/.test(c.role)).map(c => c.etiquette).join(' · '))} (${esc(dateCourte(m.date))})</span></span>
      <button type="button" class="icone-petit" data-imp-oublier="${esc(m.id)}" title="Oublier ce modèle">🗑</button></li>`).join('')}</ul>`
      : '<p class="aide">Rien pour l’instant : utilise « ✍️ Remplir manuellement » après l’import d’un barème mal reconnu.</p>';
  };
  const { d } = ouvrirModale('📥 Importer un barème', `
    <p class="aide">Ton barème en PDF, Word (.docx), LibreOffice (.odt), Excel (.xlsx) ou CSV : l’appli le lit sur cet appareil (rien n’est envoyé) et le range dans Mes barèmes.
      Accepte aussi le fichier .json d’un collègue.</p>
    <p><button type="button" class="primaire" data-imp-menu="fichier">📂 Choisir le fichier du barème</button></p>
    <h3>Ton barème n’est pas reconnu ?</h3>
    <p class="aide"><b>1. ✍️ Remplis-le manuellement une fois.</b> Après l’import, touche « ✍️ Remplir manuellement » : tu indiques le rôle des lignes et des colonnes,
      l’appli s’entraîne à reconnaître les spécificités de tes barèmes et reconnaîtra seule les prochains du même modèle.</p>
    <p class="aide"><b>2. Utilise le barème vierge.</b> C’est un tableau Excel que l’appli reconnaît à coup sûr : remplis-le toi-même,
      ou demande à une IA de recopier ton barème dedans (consigne ci-dessous), puis importe-le ici.</p>
    <p><button type="button" data-imp-menu="vierge">📄 Télécharger le barème vierge (Excel)</button></p>
    <details class="consigne-ia"><summary>🤖 Consigne à donner à une IA</summary>
      <p class="aide">Joins à l’IA ton barème et le barème vierge, colle cette consigne, puis importe ici le fichier qu’elle te rend.
        Un barème ne contient pas de données d’élèves ; vérifie quand même de n’envoyer que lui.</p>
      <textarea readonly rows="10" aria-label="Consigne pour une IA">${esc(CONSIGNE_IA_BAREME)}</textarea>
      <p><button type="button" data-imp-menu="copier">📋 Copier la consigne</button></p></details>
    <details class="appris-import"><summary>🎓 Ce que l’appli a appris (${modelesAppris().length})</summary><div class="zone-appris">${dessinerAppris()}</div></details>`,
  '<span class="espace"></span><button type="button" data-fermer>Fermer</button>');
  d.addEventListener('click', async e => {
    const b = e.target.closest('button');
    if (!b) return;
    const quoi = b.dataset.impMenu;
    if (quoi === 'fichier') { d.fermer(); choisirDocumentBareme(); }
    else if (quoi === 'vierge') lancer(telechargerBaremeVierge);
    else if (quoi === 'copier') {
      try { await navigator.clipboard.writeText(CONSIGNE_IA_BAREME); }
      catch { const t = $('textarea', d); t.select(); document.execCommand('copy'); }
      toast('Consigne copiée ✔ — colle-la dans ton IA', 'ok');
    } else if (b.dataset.impOublier) {
      ecrireModelesAppris(modelesAppris().filter(m => m.id !== b.dataset.impOublier));
      $('.zone-appris', d).innerHTML = dessinerAppris();
      $('.appris-import summary', d).textContent = `🎓 Ce que l’appli a appris (${modelesAppris().length})`;
      toast('Modèle oublié', 'ok');
    }
  });
}
