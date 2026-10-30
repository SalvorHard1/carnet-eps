'use strict';
// Appréciations de fin de période (onglet Notes › ✍ Appréciations, et fiche élève des Notes).
// Tout est fait PAR L'APPLI, sur l'appareil, à partir du carnet : rien n'est envoyé nulle part.
//  1. Analyse : pour chaque rubrique (attitude, compétences, motricité, méthodologie, comportement, progression),
//     un niveau de 1 à 4 est calculé à partir des notes, des degrés de maîtrise, des leçons (présence, données
//     relevées) et des mots-clés des observations du prof. Chaque niveau dit d'où il vient.
//  2. Rédaction : des phrases toutes faites, choisies selon le niveau, le ton et le style réglés, assemblées
//     dans l'ordre des rubriques, sans dépasser la longueur maximale.
// Le prof peut changer chaque niveau d'un toucher, demander une autre formulation, ou réécrire le texte.
// Ce qu'il change est gardé dans le carnet (collection `suivis`, donc chiffré sur la clé avec le reste).
// (Fichier chargé avant app.js : il n'utilise les outils d'app.js qu'au moment des appels.)

const RUBRIQUES_APPR = {
  attitude: { nom: 'Attitude', aide: 'engagement, investissement, présence' },
  competences: { nom: 'Compétences', aide: 'degrés de maîtrise' },
  moteur: { nom: 'Motricité', aide: 'performances, notes' },
  methodo: { nom: 'Méthodologie', aide: 'rôles, organisation, sécurité' },
  comportement: { nom: 'Comportement', aide: 'respect des règles et des autres' },
  progression: { nom: 'Progression', aide: 'évolution sur la période' },
  objectif: { nom: 'Objectif', aide: 'piste pour la suite' },
};
const TONS_APPR = { bienveillant: 'Bienveillant', neutre: 'Neutre', exigeant: 'Exigeant' };
const STYLES_APPR = { phrases: 'Phrases (« Léa s’investit… Elle… »)', telegraphique: 'Télégraphique (« Investissement sérieux. »)' };
const NOMS_NIV_APPR = { 0: 'non mentionné', 1: 'insuffisant', 2: 'fragile', 3: 'satisfaisant', 4: 'très bien' };
const NOMS_NIV_PROG = { 0: 'non mentionnée', 1: 'en baisse', 2: 'stable', 3: 'en progrès', 4: 'nets progrès' };
const idAppr = (eleveId, periode) => idSuivi(eleveId, 'appréciation ' + periode);
const estSuiviAppr = s => /^appréciation /i.test(s.apsa || '');
// Selon la discipline (discipline.js) : noms des rubriques, phrases et objectifs propres (ex. en SVT, « motricité » → « connaissances »).
const rubriqueAppr = k => ({ ...RUBRIQUES_APPR[k], ...(profil().appreciations?.noms?.[k] || {}) });
// (Phrases propres à la discipline : remplacent celles de l'EPS niveau par niveau ; les niveaux non redéfinis restent communs.)
const phrasesAppr = () => {
  const propres = profil().appreciations?.phrases || {};
  return Object.fromEntries(Object.keys({ ...PHRASES_APPR, ...propres }).map(k => [k, { ...PHRASES_APPR[k], ...(propres[k] || {}) }]));
};
// L'activité (ou le thème) au milieu d'une phrase : « en badminton », « en génétique », « sur le corps humain et la santé ».
// Rien si le nom ne se glisse pas dans une phrase (trop long, virgule, « À la recherche… ») : la phrase reste juste sans lui.
function activiteDansPhrase(nom) {
  const n = String(nom || '').replace(/\s+/g, ' ').trim();
  if (!n || estActiviteAutre(n) || n.length > 45 || /[,;:()]/.test(n)) return '';
  const art = /^(le|la|les)\s+(.+)$/i.exec(n) || /^(l[’'])\s*(.+)$/i.exec(n);
  if (art) return ` sur ${art[1].toLocaleLowerCase('fr')}${/[’']$/.test(art[1]) ? '' : ' '}${art[2]}`;
  if (/^(à|au|aux|de|du|des|un|une)\s/i.test(n)) return '';
  return ' en ' + n[0].toLocaleLowerCase('fr') + n.slice(1);
}
const objectifsAppr = () => ({ ...OBJECTIFS_APPR, ...(profil().appreciations?.objectifs || {}) });

/* ---------- Réglages ---------- */

function reglageAppr() {
  const r = reglage('appreciations');
  // Rubriques : toutes présentes une fois, dans l'ordre choisi (les inconnues sont retirées).
  r.ordre = [...new Set([...r.ordre.filter(k => RUBRIQUES_APPR[k]), ...Object.keys(RUBRIQUES_APPR)])];
  r.actives = r.actives.filter(k => RUBRIQUES_APPR[k]);
  if (!TONS_APPR[r.ton]) r.ton = 'bienveillant';
  if (!STYLES_APPR[r.style]) r.style = 'phrases';
  // (Ancien défaut, 400 caractères : jugé trop long, il passe à 300 ; une autre valeur choisie est gardée.)
  r.longueur = Math.max(80, Math.min(2000, +r.longueur === 400 || !+r.longueur ? 300 : +r.longueur));
  return r;
}

function htmlReglageAppr(r) {
  return `
    <p class="aide">Coche les rubriques à aborder, et range-les dans l’ordre voulu (↑ ↓). Si la place manque,
      les dernières rubriques sont laissées de côté (l’objectif est gardé jusqu’au bout).
      Si ce que tu as rempli (observations, mots-clés…) signale une difficulté, la rubrique passe en priorité (⚠), même décochée (ex. comportement) ; touche-la jusqu’à « non mentionné » pour l’écarter.</p>
    <ol class="rubriques-appr">${r.ordre.map((k, i) => `<li>
      <label class="case"><input type="checkbox" name="appr-${k}" ${r.actives.includes(k) ? 'checked' : ''}>
        <b>${esc(rubriqueAppr(k).nom)}</b> <span class="aide">${esc(rubriqueAppr(k).aide)}</span></label>
      <span class="espace"></span>
      <button type="button" class="icone-petit" data-appr-monter="${k}" ${i ? '' : 'disabled'} aria-label="Monter ${esc(rubriqueAppr(k).nom)}">↑</button>
      <button type="button" class="icone-petit" data-appr-descendre="${k}" ${i < r.ordre.length - 1 ? '' : 'disabled'} aria-label="Descendre ${esc(rubriqueAppr(k).nom)}">↓</button>
      <input type="hidden" name="appr-ordre" value="${k}"></li>`).join('')}</ol>
    <label class="case"><input type="checkbox" name="appr-bilan" ${r.bilan ? 'checked' : ''}> Commencer par un bilan général (« Léa réalise un bon trimestre. »)</label>
    <div class="ligne">
      <label>Ton<select name="appr-ton">${Object.entries(TONS_APPR).map(([v, n]) => `<option value="${v}" ${r.ton === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label>Style<select name="appr-style">${Object.entries(STYLES_APPR).map(([v, n]) => `<option value="${v}" ${r.style === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="etroit">Longueur max.<input type="number" name="appr-longueur" min="80" max="2000" step="10" value="${r.longueur}"></label>
      <span class="aide">caractères (limite du bulletin)</span>
    </div>`;
}

// Lit les réglages dans un formulaire (fenêtre des appréciations ou ⚙ Réglages du carnet).
function lireReglageAppr(form) {
  const ordre = [...form.querySelectorAll('[name="appr-ordre"]')].map(x => x.value);
  return {
    ordre, actives: ordre.filter(k => form.elements['appr-' + k]?.checked),
    bilan: !!form.elements['appr-bilan']?.checked,
    ton: form.elements['appr-ton']?.value || 'bienveillant', style: form.elements['appr-style']?.value || 'phrases',
    longueur: Math.max(80, Math.min(2000, +form.elements['appr-longueur']?.value || 300)),
  };
}

// Boutons ↑ ↓ : déplacent la ligne dans la liste (l'ordre est relu dans les champs cachés).
function deplacerRubriqueAppr(bouton) {
  const li = bouton.closest('li'), liste = li.parentElement;
  if (bouton.dataset.apprMonter && li.previousElementSibling) liste.insertBefore(li, li.previousElementSibling);
  if (bouton.dataset.apprDescendre && li.nextElementSibling) liste.insertBefore(li.nextElementSibling, li);
  [...liste.children].forEach((x, i, t) => {
    x.querySelector('[data-appr-monter]').disabled = i === 0;
    x.querySelector('[data-appr-descendre]').disabled = i === t.length - 1;
  });
}

/* ---------- Analyse : un niveau par rubrique, calculé à partir du carnet ---------- */

// Mots-clés cherchés dans les observations du prof (sans accents). Les tournures négatives sont lues d'abord
// (« peu investi » ne compte pas comme « investi »), et « pas / plus / jamais » juste avant un mot l'annule.
const MOTS_APPR = {
  attitude: {
    moins: ['peu investi', 'manque d\'investissement', 'manque d\'engagement', 'manque de motivation', 'passif', 'passive', 'demotive',
      'n\'essaie pas', 'ne fait rien', 'ne participe pas', 'refuse de', 'oubli de tenue', 'sans tenue', 'pas de tenue', 'tenue oubliee', 'nonchalant', 'traine', 'baisse les bras',
      'non rendu', 'pas rendu', 'oubli du materiel', 'materiel oublie', 'pas de materiel', 'travail non fait'],
    plus: ['investi', 'implique', 'motive', 'dynamique', 'volontaire', 'enthousias', 'serieux', 'serieuse', 'perseverant', 'engage', 'element moteur', 'appliqu'],
  },
  comportement: {
    moins: ['bavard', 'agite', 'insolen', 'irrespect', 'perturb', 'dissip', 'conflit', 'provoc', 'triche', 'violen', 'impoli', 'exclu',
      'avertissement', 'punition', 'retenue', 'insulte', 'moqu', 'ne respecte pas', 'manque de respect'],
    plus: ['respectueu', 'poli', 'calme', 'fair-play', 'fair play', 'exemplaire', 'aide ses camarades', 'bienveillant', 'solidaire'],
  },
};

function motsCles(textes, liste) {
  let plus = 0, moins = 0;
  const trouves = [];
  for (const brut of textes) {
    let t = ' ' + sansAccent(brut) + ' ';
    for (const m of liste.moins) {
      let i;
      while ((i = t.indexOf(m)) >= 0) { moins++; trouves.push('« ' + m + ' »'); t = t.slice(0, i) + ' '.repeat(m.length) + t.slice(i + m.length); }
    }
    for (const m of liste.plus) {
      let i = -1;
      while ((i = t.indexOf(m, i + 1)) >= 0) {
        const avant = t.slice(Math.max(0, i - 14), i);
        if (/\b(pas|plus|jamais|moins|peu)\s+(tres\s+|assez\s+|toujours\s+)?$/.test(avant)) { moins++; trouves.push('« …' + m + ' » (négatif)'); }
        else { plus++; trouves.push('« ' + m + ' »'); }
      }
    }
  }
  return { plus, moins, trouves: [...new Set(trouves)] };
}

// Catégorie d'une compétence ou d'une donnée relevée en leçon, d'après son intitulé.
const RE_METHODO = /role|arbitr|juge|jury|coach|observ|chronom|secretaire|entrain|programme|planifi|echauff|preparation|projet|securite|assurage|filmer|mesurer|organis|analys|methode|protocole|hypothese|experi|demarche|manipul|strategie/;
const RE_COMPORTEMENT = /respect|solidaire|accepter le resultat|accepter de se produire|comportement|fair|citoyen/;
const RE_ATTITUDE = /attitude|engagement|investissement|implication|motivation|participation/;
const categorieAppr = texte => {
  const t = sansAccent(texte);
  return RE_ATTITUDE.test(t) ? 'attitude' : RE_COMPORTEMENT.test(t) ? 'comportement' : RE_METHODO.test(t) ? 'methodo' : 'moteur';
};

const moyenneListe = l => (l.length ? l.reduce((a, b) => a + b, 0) / l.length : null);
const niveauDegre = x => (x === null ? null : x >= 3.5 ? 4 : x >= 2.75 ? 3 : x >= 2 ? 2 : 1);
const fmtD = x => fmt(Math.round(x * 10) / 10);

// Position de l'élève dans sa classe, sur la même période (ici et dans l'espace PP, pp.js) : un 10,9 dans une classe
// à 12,5 de moyenne n'a pas un trimestre « satisfaisant ». moyennes : celles de toute la classe (l'élève compris) ;
// moyClasse : celle du bulletin, si elle est connue. Il faut au moins 5 moyennes pour un rang.
// cle : 'retrait' dès 0,5 point sous la moyenne de la classe ; 'tete' dès 2 points au-dessus, dans le premier tiers.
const POSITION_CLASSE = { retrait: -0.5, plafond2: -1.5, nettement: -2, tete: 2 };
function positionClasse(moy, moyennes, moyClasse = null) {
  const l = moyennes.filter(v => v !== null && v !== undefined);
  if (moy === null || moy === undefined || (l.length < 5 && (moyClasse === null || moyClasse === undefined))) return null;
  const m = moyClasse ?? moyenneListe(l), ecart = moy - m;
  const n = l.length >= 5 ? l.length : null, rang = n ? 1 + l.filter(v => v > moy + 1e-9).length : null;
  const cle = ecart <= POSITION_CLASSE.retrait ? 'retrait' : ecart >= POSITION_CLASSE.tete && (!n || rang <= Math.ceil(n / 3)) ? 'tete' : '';
  // (Nettement en retrait : 2 points sous la moyenne de la classe, et dans le dernier quart.)
  const nettement = ecart <= POSITION_CLASSE.nettement && (!n || rang > n - Math.ceil(n / 4));
  return { moyClasse: m, ecart, rang, n, cle, nettement };
}
// Niveau tiré de la moyenne, corrigé par la position dans la classe : en retrait, jamais 4 (et pas plus de 2 dès
// 1,5 point sous la moyenne de la classe) ; nettement au-dessus de la classe, un cran de plus.
function niveauSelonClasse(n, pos) {
  if (!n || !pos?.cle) return n;
  if (pos.cle === 'tete') return Math.min(4, n + 1);
  return Math.min(n, pos.ecart <= POSITION_CLASSE.plafond2 ? 2 : 3);
}
const textePositionClasse = pos => (pos ? `Classe : moyenne ${fmtD(pos.moyClasse)}${pos.rang ? `, rang ${pos.rang}/${pos.n}` : ''}, écart ${pos.ecart >= 0 ? '+' : '−'}${fmtD(Math.abs(pos.ecart))}`
  + (pos.cle === 'retrait' ? ' → en retrait par rapport à la classe' : pos.cle === 'tete' ? ' → parmi les meilleurs de la classe' : '') : '');

function evalsPeriode(classeId, periode) {
  const toutes = evalsDe(classeId);
  return periode === 'annee' ? toutes : toutes.filter(e => periodeDe(e.date) === periode);
}
function seancesPeriode(classeId, periode) {
  const toutes = seancesDe(classeId);
  return periode === 'annee' ? toutes : toutes.filter(s => periodeDe(s.date) === periode);
}

// → { niveaux: {rubrique: 1..4 | null}, sources: {rubrique: texte}, defaut: {rubrique: true}, details: {...} }
function analyserAppr(el, periode, eleves) {
  const c = Donnees.get('classes', el.classeId);
  const evals = evalsPeriode(el.classeId, periode), seances = seancesPeriode(el.classeId, periode);
  const niveaux = {}, sources = {}, defaut = {}, details = {};
  const degres = { attitude: [], competences: [], moteur: [], methodo: [], comportement: [] };
  let mieux = 0, pire = 0;

  // Notes
  const moy = moyenneEleve(el.id, evals);
  let absNotes = 0;
  // (Travail non rendu — code NR — : pris en compte dans l'attitude, comme les observations « non rendu ».)
  const nonRendus = [];
  for (const e of evals) {
    const v = Donnees.note(e.id, el.id);
    if (v === 'ABS') absNotes++;
    if (v === 'NR') nonRendus.push('non rendu');
  }
  // Moyenne par APSA (pour citer la meilleure ou la plus fragile)
  const parApsa = new Map();
  for (const e of evals) { const a = (e.apsa || '').trim(); if (a && !estActiviteAutre(a)) parApsa.set(a, [...(parApsa.get(a) || []), e]); }
  const moyApsa = [...parApsa].map(([a, l]) => ({ a, m: moyenneEleve(el.id, l) })).filter(x => x.m !== null);

  // Degrés de maîtrise des évaluations : dernier degré de chaque compétence, et son évolution.
  // saisi : rubriques appuyées sur ce que l'enseignant a rempli lui-même (degré choisi à la main, donnée de leçon,
  // observation, absence, note) — pas sur un degré pré-rempli d'après la note. Seules elles font un point de vigilance.
  const saisi = { moteur: true, progression: true };
  const comps = new Map();
  for (const e of evals) for (const a of competencesEval(e)) {
    const v = Donnees.note(e.id, el.id, a.id);
    if (!v) continue;
    if (!comps.has(a.id)) comps.set(a.id, { a, valeurs: [] });
    comps.get(a.id).valeurs.push(+v);
    comps.get(a.id).auto = !!Donnees.noteComplete(e.id, el.id, a.id)?.auto;
  }
  const faibles = [];
  for (const { a, valeurs, auto } of comps.values()) {
    const der = valeurs.at(-1);
    degres.competences.push(der);
    degres[categorieAppr(a.texte)].push(der);
    if (!auto) { saisi.competences = true; saisi[categorieAppr(a.texte)] = true; }
    if (valeurs.length > 1) { if (der > valeurs[0]) mieux++; else if (der < valeurs[0]) pire++; }
    if (der < 3) faibles.push({ texte: a.texte, cat: categorieAppr(a.texte), v: der });
  }

  // Leçons : présence, données relevées (échelles 1 à 4, performances), observations écrites.
  let presences = 0, abs = 0;
  const observations = [];
  const parIndic = new Map();
  for (const s of seances) {
    const st = statutEnt(s.id, el.id);
    if (st) { if (st === 'ABS') abs++; if (st === 'NR') nonRendus.push('non rendu'); continue; }
    presences++;
    for (const ind of s.indicateurs || []) {
      if (statutCase(Donnees.note(s.id, el.id, ind.id) || '') === 'NR') nonRendus.push('non rendu');
      const v = valeurCase(s.id, el.id, ind.id);
      if (!v) continue;
      if (ind.type === 'texte') { observations.push(v); continue; }
      // (Réponses de liste lues aussi pour les mots-clés : ex. « Non rendu » pour le travail rendu en SVT.)
      if (ind.type === 'choix' && !ind.medaille) observations.push(v);
      const k = cleIndic(ind);
      if (!parIndic.has(k)) parIndic.set(k, { ind, valeurs: [] });
      parIndic.get(k).valeurs.push(v);
    }
  }
  for (const { ind, valeurs } of parIndic.values()) {
    if (ind.type === 'echelle') {
      const der = +valeurs.at(-1);
      if (!(der >= 1 && der <= 4)) continue;
      const cat = ind.etape ? 'moteur' : categorieAppr(ind.nom);
      degres[cat].push(der);
      degres.competences.push(der);
      saisi[cat] = saisi.competences = true;
      if (der < 3) faibles.push({ texte: ind.etape ? texteIndic(ind) : ind.nom, cat, v: der, indic: !ind.etape });
    }
    // Médaille (dernière obtenue) : bronze → degré 2, argent → 3, or → 4, côté motricité.
    if (ind.medaille) {
      const k = MEDAILLES.indexOf(valeurs.at(-1));
      if (k >= 0) degres.moteur.push(k + 2);
    }
    const sens = sensProgres(ind);
    if (sens && valeurs.length > 1 && (ind.type !== 'choix' || ind.medaille)) {
      const a = valeurComparable(ind, valeurs[0]), b = valeurComparable(ind, valeurs.at(-1));
      if (a !== null && b !== null && a !== b) { if ((b - a) * sens > 0) mieux++; else pire++; }
    }
  }
  // Observations du prof : celles des leçons de la période, et ses fiches (modifiées pendant la période).
  // (Pas l'espace professeur principal, pp.js : appréciation générale, bulletins, suivi.)
  for (const s of Donnees.liste('suivis', x => x.eleveId === el.id && x.texte && !estSuiviAppr(x) && !x.pp)) {
    if (periode === 'annee' || !s.maj || periodeDe(new Date(s.maj).toLocaleDateString('sv')) === periode) observations.push(s.texte);
  }
  observations.push(...nonRendus);

  // Motricité : moyenne de la période (seuils note → degré de la classe), sinon degrés « moteurs ».
  const seuils = seuilsClasse(c);
  if (moy !== null) {
    const brut = moy >= seuils[2] ? 4 : moy >= seuils[1] ? 3 : moy >= seuils[0] ? 2 : 1;
    // (Comparée à toute la classe sur les mêmes évaluations.)
    const pos = positionClasse(moy, elevesDe(el.classeId).map(x => (x.id === el.id ? moy : moyenneEleve(x.id, evals))));
    details.position = pos;
    niveaux.moteur = niveauSelonClasse(brut, pos);
    sources.moteur = `Moyenne ${fmtD(moy)}/20 (seuils de la classe : ${seuils.map(fmt).join(' / ')})`
      + (pos ? `\n${textePositionClasse(pos)}${niveaux.moteur !== brut ? ` (niveau ${brut} d’après les seuils, ${niveaux.moteur} retenu)` : ''}` : '');
  } else if (degres.moteur.length) {
    const m = moyenneListe(degres.moteur);
    niveaux.moteur = niveauDegre(m);
    sources.moteur = `Pas de note : moyenne des degrés « ${rubriqueAppr('moteur').nom.toLocaleLowerCase('fr')} » ${fmtD(m)}`;
  }
  if (moyApsa.length > 1) {
    const tri = [...moyApsa].sort((x, y) => y.m - x.m);
    details.apsaForte = tri[0].a; details.apsaFaible = tri.at(-1).a;
  } else {
    const apsas = [...new Set([...evals.map(e => (e.apsa || '').trim()), ...seances.map(s => (s.apsa || '').trim())].filter(a => a && !estActiviteAutre(a)))];
    if (apsas.length === 1) details.apsaSeule = apsas[0];
  }

  // Compétences : moyenne des derniers degrés relevés (évaluations et leçons).
  if (degres.competences.length) {
    const m = moyenneListe(degres.competences);
    niveaux.competences = niveauDegre(m);
    details.degreMoyen = m; // (valeur exacte, pour la synthèse graphique de la fiche bilan)
    const validees = degres.competences.filter(v => v >= 3).length;
    sources.competences = `${validees}/${degres.competences.length} au degré 3 ou 4 · degré moyen ${fmtD(m)}`;
  }

  // Méthodologie : rôles, organisation, sécurité (compétences et données de leçon de ce type).
  if (degres.methodo.length) {
    const m = moyenneListe(degres.methodo);
    niveaux.methodo = niveauDegre(m);
    sources.methodo = `Degré moyen ${fmtD(m)} sur ${degres.methodo.length} critère${degres.methodo.length > 1 ? 's' : ''} (${rubriqueAppr('methodo').aide})`;
  }

  // Attitude : critère « attitude / engagement » relevé en leçon, présence, mots-clés des observations.
  {
    const mots = motsCles(observations, MOTS_APPR.attitude), morceaux = [];
    let n = null;
    if (degres.attitude.length) { n = niveauDegre(moyenneListe(degres.attitude)); morceaux.push(`critère engagement : degré ${fmtD(moyenneListe(degres.attitude))}`); }
    const total = presences + abs;
    if (total) {
      const taux = presences / total;
      morceaux.push(`${Math.round(taux * 100)} % de ${mot('presenceLecons')}`);
      if (n === null) n = 3;
      // (Seules les absences comptent, pas les blessures ni les maladies ; une absence isolée ne suffit pas.)
      if (abs >= 3 || (abs >= 2 && taux < 0.8)) { n = Math.min(n, 2); saisi.attitude = true; }
    }
    if (absNotes) morceaux.push(`${absNotes} absence${absNotes > 1 ? 's' : ''} à une évaluation`);
    // Blessé / malade : signalé pour mémoire, sans baisser le niveau (ce n'est pas un manque d'engagement).
    const sante = typeof bilanLecons === 'function' ? bilanLecons(el, periode).sante : 0;
    const santeNotes = evals.filter(e => ['BLE', 'MAL'].includes(Donnees.note(e.id, el.id))).length;
    if (sante + santeNotes) morceaux.push(`${motifsSante()} : ${sante + santeNotes} fois (${mot('lecons').toLocaleLowerCase('fr')} et évaluations), sans effet sur ce niveau`);
    if (mots.plus || mots.moins) {
      morceaux.push('observations : ' + mots.trouves.join(', ')); saisi.attitude = true;
      n = Math.max(1, Math.min(4, (n ?? 3) + Math.sign(mots.plus - mots.moins) * (Math.abs(mots.plus - mots.moins) >= 2 ? 2 : 1)));
    }
    if (n === null) { n = 3; defaut.attitude = true; morceaux.push('aucune donnée : niveau par défaut, à vérifier'); }
    niveaux.attitude = n; sources.attitude = morceaux.join(' · ');
    details.absences = abs + absNotes;
  }

  // Comportement : critère relevé en leçon, compétences « respect », mots-clés des observations.
  {
    const mots = motsCles(observations, MOTS_APPR.comportement), morceaux = [];
    let n = null;
    if (degres.comportement.length) { n = niveauDegre(moyenneListe(degres.comportement)); morceaux.push(`critères respect / comportement : degré ${fmtD(moyenneListe(degres.comportement))}`); }
    if (mots.plus || mots.moins) {
      morceaux.push('observations : ' + mots.trouves.join(', ')); saisi.comportement = true;
      n = Math.max(1, Math.min(4, (n ?? 3) + Math.sign(mots.plus - mots.moins) * (Math.abs(mots.plus - mots.moins) >= 2 ? 2 : 1)));
    }
    if (n === null) { n = 3; defaut.comportement = true; morceaux.push('aucune donnée : niveau par défaut, à vérifier'); }
    niveaux.comportement = n; sources.comportement = morceaux.join(' · ');
  }

  // Progression : écart avec la période précédente, sinon tendance des notes de la période ; degrés et performances.
  {
    const morceaux = [];
    let d = null;
    const periodes = periodesAnnee(), k = periodes.findIndex(p => p.id === periode);
    if (k > 0) {
      const avant = moyenneEleve(el.id, evalsPeriode(el.classeId, periodes[k - 1].id));
      if (avant !== null && moy !== null) { d = moy - avant; morceaux.push(`${periodes[k - 1].code} ${fmtD(avant)} → ${periodes[k].code} ${fmtD(moy)}`); }
    }
    if (d === null) {
      const notes = evals.filter(e => !e.nonSignificative).map(e => sur20(e, Donnees.note(e.id, el.id))).filter(n => n !== null);
      const t = tendanceNotes(notes);
      if (t !== null) { d = t; morceaux.push(`tendance des notes ${t >= 0 ? '+' : ''}${fmtD(t)}`); }
    }
    let n1 = d === null ? null : d >= 2.5 ? 4 : d >= 1 ? 3 : d > -1.5 ? 2 : 1, n2 = null;
    if (mieux + pire) {
      const r = (mieux - pire) / (mieux + pire);
      n2 = r >= 0.5 ? 4 : r >= 0.15 ? 3 : r > -0.15 ? 2 : 1;
      morceaux.push(`${mieux} critère${mieux > 1 ? 's' : ''} en progrès, ${pire} en baisse (degrés, performances)`);
    }
    if (n1 !== null || n2 !== null) {
      niveaux.progression = n1 !== null && n2 !== null ? Math.round((n1 + n2) / 2) : n1 ?? n2;
      sources.progression = morceaux.join(' · ');
    }
  }

  details.faibles = faibles.sort((a, b) => a.v - b.v);
  details.saisi = saisi;
  details.moyenne = moy;
  sources.objectif = 'Choisi d’après la rubrique la plus faible';
  return { niveaux, sources, defaut, details };
}

/* ---------- Rédaction ---------- */

// Phrases : {S} sujet (prénom la 1re fois, puis Il / Elle), {s} idem en minuscule, {P} prénom,
// {apsa} « en badminton » ou « , notamment en badminton », {ce} « ce trimestre » / « cette année ».
// Niveaux 1 et 2 : une liste par ton (b bienveillant, n neutre, x exigeant). Style télégraphique : listes `t`.
const PHRASES_APPR = {
  attitude: {
    4: { p: ['{S} s’investit pleinement dans toutes les activités.', '{S} fait preuve d’un engagement exemplaire en cours.', '{S} montre un investissement remarquable et constant.', 'L’investissement est exemplaire dans toutes les activités.'],
      t: ['Investissement exemplaire.', 'Engagement remarquable.'] },
    3: { p: ['{S} s’investit avec sérieux en cours.', '{S} montre un engagement régulier.', '{S} participe avec envie aux activités proposées.', 'L’engagement en cours est sérieux et régulier.'],
      t: ['Investissement sérieux.', 'Bon engagement en cours.'] },
    2: { p: { b: ['{S} doit gagner en régularité dans son engagement.', '{S} s’investit, mais de façon encore irrégulière.'],
      n: ['{S} s’investit de manière irrégulière.', 'L’engagement en cours reste irrégulier.'],
      x: ['{S} doit s’investir davantage en cours.', '{S} manque trop souvent d’engagement.'] },
    t: { b: ['Engagement à rendre plus régulier.'], n: ['Engagement irrégulier.'], x: ['Manque d’investissement.', 'Engagement trop irrégulier.'] } },
    1: { p: { b: ['{S} doit trouver davantage d’envie pour s’engager en cours.', '{S} a du mal à s’engager : il faut s’accrocher.'],
      n: ['{S} s’investit trop peu en cours.'],
      x: ['L’investissement est très insuffisant.', '{S} ne s’investit pas suffisamment en cours.'] },
    t: { b: ['Engagement à retrouver.'], n: ['Investissement trop faible.', 'Engagement trop faible.'], x: ['Investissement très insuffisant.', 'Engagement à retrouver d’urgence.'] } },
  },
  competences: {
    4: { p: ['{S} maîtrise très bien les compétences travaillées.', 'Les compétences visées sont très bien maîtrisées.', '{S} maîtrise parfaitement les compétences travaillées.'], t: ['Compétences très bien maîtrisées.', 'Excellente maîtrise des compétences.'] },
    3: { p: ['{S} maîtrise de façon satisfaisante les compétences travaillées.', 'Les compétences visées sont globalement acquises.', '{S} montre un bon niveau de maîtrise des compétences travaillées.'], t: ['Compétences acquises.', 'Bonne maîtrise des compétences.'] },
    2: { p: { b: ['Les compétences sont en cours d’acquisition, à consolider.', '{S} est en bonne voie dans l’acquisition des compétences.'],
      n: ['La maîtrise des compétences reste fragile.', 'Les compétences sont partiellement acquises.'], x: ['La maîtrise des compétences est encore trop fragile.', 'La maîtrise des compétences doit être nettement renforcée.', 'Les compétences visées sont loin d’être acquises.'] },
    t: { b: ['Compétences en cours d’acquisition.'], n: ['Compétences fragiles.', 'Compétences partiellement acquises.'], x: ['Compétences insuffisamment maîtrisées.', 'Maîtrise des compétences à renforcer.'] } },
    1: { p: { b: ['Les compétences visées ne sont pas encore acquises : il faut persévérer.'], n: ['La maîtrise des compétences est insuffisante.'],
      x: ['Les compétences visées ne sont pas maîtrisées.'] },
    t: { b: ['Compétences pas encore acquises.'], n: ['Compétences non acquises.'], x: ['Compétences non maîtrisées.', 'Compétences à acquérir.'] } },
  },
  moteur: {
    4: { p: ['{S} réalise de très bonnes performances{apsa}.', '{S} dispose de très bonnes qualités motrices{apsa}.', 'Les performances sont d’un très bon niveau{apsa}.', '{S} obtient des performances remarquables{apsa}.', 'Les résultats sont d’un niveau élevé{apsa}.'],
      t: ['Très bonnes qualités motrices{apsa}.', 'Très bons résultats{apsa}.', 'Performances remarquables{apsa}.'] },
    3: { p: ['{S} obtient de bons résultats{apsa}.', '{S} montre de bonnes capacités motrices{apsa}.', 'Les résultats sont d’un bon niveau{apsa}.'], t: ['Bons résultats{apsa}.', 'Bonnes capacités motrices{apsa}.'] },
    2: { p: { b: ['{S} obtient des résultats encore justes{apsa}, qui peuvent progresser.', 'Les résultats restent encore justes{apsa}, mais peuvent progresser.', '{S} obtient des résultats corrects{apsa}, qui peuvent s’améliorer.', 'Les résultats{apsa} sont corrects et peuvent s’améliorer.'], n: ['{S} obtient des résultats moyens{apsa}.', 'Les résultats sont moyens{apsa}.'],
      x: ['Les résultats{apsa} sont insuffisants au regard des possibilités de {P}.', '{S} doit viser des résultats plus solides{apsa}.'] },
    t: { b: ['Résultats à consolider{apsa}.', 'Résultats perfectibles{apsa}.'], n: ['Résultats moyens{apsa}.', 'Performances moyennes{apsa}.'], x: ['Résultats insuffisants{apsa}.', 'Résultats en deçà des attentes{apsa}.'] } },
    1: { p: { b: ['{S} rencontre des difficultés{apsa}, mais peut progresser avec de la persévérance.', 'Les difficultés sont réelles{apsa}, mais la persévérance permettra de progresser.', '{S} rencontre des difficultés{apsa} ; un travail régulier l’aidera à les surmonter.', 'Les résultats{apsa} restent difficiles : il faut garder confiance.'], n: ['{S} rencontre des difficultés{apsa}.', 'Les résultats restent difficiles{apsa}.'],
      x: ['Les résultats{apsa} sont très insuffisants.', '{S} est en grande difficulté{apsa}.', 'Les résultats{apsa} sont nettement en deçà des attentes.'] },
    t: { b: ['Difficultés motrices à surmonter{apsa}.'], n: ['Difficultés motrices{apsa}.'], x: ['Résultats très insuffisants{apsa}.', 'Grandes difficultés{apsa}.'] } },
  },
  methodo: {
    4: { p: ['{S} assume avec beaucoup de sérieux les rôles confiés (arbitre, juge, observateur).', '{S} fait preuve d’une excellente méthode de travail.', 'Les rôles confiés sont assumés avec beaucoup de sérieux.'],
      t: ['Rôles très bien assumés.', 'Excellente méthode de travail.'] },
    3: { p: ['{S} tient correctement les rôles confiés et s’organise bien.', '{S} travaille avec méthode.', 'Les rôles confiés sont bien tenus et le travail est méthodique.', 'Le travail dans les rôles confiés est d’un bon niveau.'], t: ['Rôles bien assumés.', 'Travail méthodique.'] },
    2: { p: { b: ['{S} doit encore gagner en rigueur dans les rôles et l’organisation.'], n: ['La méthode de travail et la tenue des rôles restent à améliorer.', 'La méthode de travail et la tenue des rôles sont à revoir.', 'L’organisation et la tenue des rôles restent à améliorer.'],
      x: ['{S} manque de rigueur dans les rôles et l’organisation.'] },
    t: { b: ['Rigueur à développer dans les rôles.'], n: ['Méthode à améliorer.'], x: ['Manque de rigueur.'] } },
    1: { p: { b: ['{S} a besoin d’aide pour s’organiser et tenir les rôles confiés.'], n: ['{S} peine à s’organiser et à tenir les rôles confiés.'],
      x: ['Les rôles confiés ne sont pas assumés.'] },
    t: { b: ['Organisation à construire.'], n: ['Rôles peu assumés.'], x: ['Rôles non assumés.'] } },
  },
  comportement: {
    4: { p: ['{S} a un comportement exemplaire, respectueux de tous.', 'Le comportement est exemplaire envers les camarades comme envers l’adulte.'], t: ['Comportement exemplaire.'] },
    3: { p: ['{S} a un comportement correct et respectueux.', '{S} respecte les règles et ses camarades.', 'Le comportement est correct et respectueux.'], t: ['Comportement correct.', 'Attitude respectueuse.'] },
    2: { p: { b: ['{S} doit veiller à mieux respecter les consignes.'], n: ['Le comportement est parfois à reprendre.'], x: ['{S} doit impérativement mieux respecter les consignes.'] },
      t: { b: ['Respect des consignes à améliorer.'], n: ['Comportement parfois à reprendre.'], x: ['Comportement à corriger.'] } },
    1: { p: { b: ['Le comportement doit s’améliorer pour progresser sereinement.', 'Le respect des règles et des camarades doit devenir une priorité.'], n: ['Le comportement pose problème en cours.'],
      x: ['Le comportement est inacceptable et nuit au travail de la classe.', 'Le comportement est inacceptable et nuit au travail de tous.'] },
    t: { b: ['Comportement à améliorer nettement.'], n: ['Comportement problématique.'], x: ['Comportement inacceptable.'] } },
  },
  progression: {
    4: { p: ['{S} a nettement progressé {ce}.', 'Les progrès de {P} sont remarquables {ce}.'], t: ['Très nets progrès.', 'Progrès remarquables.'] },
    3: { p: ['{S} est en progrès {ce}.', 'Les progrès sont réguliers et encourageants.'], t: ['En progrès.', 'Progrès encourageants.'] },
    2: { p: { b: ['Les résultats sont stables : {s} peut encore progresser.'], n: ['Les résultats sont stables.'], x: ['Les résultats stagnent.'] },
      t: { b: ['Résultats stables.', 'Niveau stable.'], n: ['Résultats stables.', 'Niveau stable.'], x: ['Résultats qui stagnent.', 'Niveau qui stagne.'] } },
    1: { p: { b: ['Les résultats sont en baisse {ce} : il faut se ressaisir.'], n: ['Les résultats sont en baisse {ce}.'], x: ['Les résultats sont en net recul {ce}.'] },
      t: { b: ['Résultats en baisse : se ressaisir.'], n: ['Résultats en baisse.'], x: ['Net recul des résultats.'] } },
  },
};
// Progression « stable » d'un élève qui a déjà un bon niveau : on le dit autrement.
const STABLE_BON_APPR = { p: ['{S} maintient son bon niveau.', 'Les résultats restent d’un bon niveau.'], t: ['Bon niveau maintenu.'] };

// (Le bilan ouvre l'appréciation : il commence par le prénom.)
const BILANS_APPR = {
  periode: { 4: ['{S} réalise un excellent {per}.', '{S} réalise un très bon {per}.'], 3: ['{S} réalise un bon {per}.', '{S} réalise un {per} satisfaisant.', '{S} réalise un {per} d’un bon niveau.'],
    2: { b: ['{S} réalise un {per} encourageant, mais encore inégal.', '{S} réalise un {per} encourageant, à confirmer.', '{S} réalise un {per} en demi-teinte, avec des points encourageants.'], n: ['{S} réalise un {per} inégal.', '{S} réalise un {per} moyen.'], x: ['{S} réalise un {per} trop juste.', '{S} réalise un {per} en dessous de ses possibilités.'] },
    1: { b: ['{S} traverse un {per} difficile.'], n: ['{S} traverse un {per} difficile.', '{S} réalise un {per} décevant.'], x: ['{S} réalise un {per} très insuffisant.', '{S} réalise un {per} nettement insuffisant.'] } },
  annee: { 4: ['{S} réalise une excellente année.', '{S} réalise une très bonne année.'], 3: ['{S} réalise une bonne année.', '{S} réalise une année satisfaisante.', '{S} réalise une année d’un bon niveau.'],
    2: { b: ['{S} réalise une année encourageante, mais inégale.', '{S} réalise une année encourageante, qui reste à confirmer.', '{S} réalise une année en demi-teinte, avec des points encourageants.'], n: ['{S} réalise une année mitigée.'], x: ['{S} réalise une année trop juste.', '{S} réalise une année en dessous de ses possibilités.'] },
    1: { b: ['{S} traverse une année difficile.'], n: ['{S} traverse une année difficile.'], x: ['{S} réalise une année très insuffisante.', '{S} réalise une année nettement insuffisante.'] } },
};
// Bilan d'ensemble correct d'un élève en retrait par rapport à sa classe (jamais « satisfaisant » sans nuance),
// ou bon bilan d'un élève parmi les meilleurs de la classe (voir positionClasse).
const BILANS_CLASSE_APPR = {
  retrait: { periode: ['{S} réalise un {per} correct, mais un peu en retrait par rapport à la classe.', '{S} réalise un {per} correct, un peu en dessous du niveau de la classe.', '{S} réalise un {per} correct, un peu en retrait par rapport à ses camarades.'],
    annee: ['{S} réalise une année correcte, mais un peu en retrait par rapport à la classe.', '{S} réalise une année correcte, un peu en dessous du niveau de la classe.', '{S} réalise une année correcte, un peu en retrait par rapport à ses camarades.'] },
  tete: { periode: ['{S} réalise un bon {per} et se place parmi les meilleurs de la classe.', '{S} réalise un {per} réussi, parmi les meilleurs de la classe.', '{S} réalise un {per} réussi, parmi les meilleurs élèves.'],
    annee: ['{S} réalise une bonne année et se place parmi les meilleurs de la classe.', '{S} réalise une année réussie, parmi les meilleurs de la classe.', '{S} réalise une année réussie, parmi les meilleurs élèves.'] },
};
// Résultats corrects, mais en retrait par rapport à la classe (niveau 3 plafonné) ; quand le bilan l'a déjà dit :
// des résultats « honorables », sans redire la classe (pas de « bons résultats » juste après « en retrait »).
const RETRAIT_APPR = { p: ['{S} obtient des résultats corrects{apsa}, mais un peu en retrait par rapport à la classe.', 'Les résultats{apsa} sont corrects, un peu en dessous du niveau de la classe.', 'Les résultats{apsa} sont corrects, un peu en retrait par rapport à ses camarades.'],
  t: ['Résultats corrects{apsa}, un peu en retrait par rapport à la classe.'] };
const RETRAIT_DIT_APPR = { p: ['{S} obtient des résultats honorables{apsa}.', 'Les résultats{apsa} sont convenables.'], t: ['Résultats honorables{apsa}.'] };

// Objectifs (verbe à l'infinitif) : un axe de progrès général, selon la rubrique la plus faible
// (pas une compétence précise : « maintenir ses efforts », « fournir davantage de travail pour consolider ses acquis »…).
const OBJECTIFS_APPR = {
  attitude: ['s’investir plus régulièrement', 'fournir davantage d’efforts en cours', 'trouver davantage d’envie et d’engagement', 'se montrer plus volontaire'],
  absences: ['gagner en assiduité', 'venir en cours plus régulièrement'],
  comportement: ['continuer ses efforts vis-à-vis de son comportement', 'mieux respecter les consignes et les camarades', 'adopter une attitude plus constructive en cours'],
  methodo: ['s’impliquer davantage dans les rôles (arbitre, juge, observateur)', 'gagner en rigueur et en méthode', 'mieux s’organiser dans le travail de groupe'],
  securite: ['respecter et faire respecter les règles de sécurité'],
  moteur: ['persévérer pour améliorer ses performances', 'fournir davantage de travail pour progresser', 'gagner en efficacité par un entraînement régulier', 'chercher à se dépasser dans les activités'],
  competences: ['fournir davantage de travail pour consolider ses acquis', 'consolider ses acquis par un travail régulier', 'mieux fixer ses apprentissages', 'approfondir les savoir-faire travaillés'],
  progression: ['se remobiliser pour retrouver son meilleur niveau', 'maintenir ses efforts pour retrouver de la régularité', 'se remobiliser dans la durée'],
  regularite: ['retrouver de la régularité dans ses résultats', 'maintenir ses efforts dans la durée'],
  haut: ['maintenir ses efforts', 'conserver cette belle dynamique', 'viser l’excellence', 'garder ce niveau d’investissement'],
};

// Petit hasard reproductible : la même graine donne toujours la même formulation.
function hasardAppr(texte) {
  let h = 2166136261;
  for (const ch of texte) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return (h >>> 0) / 4294967296;
}
const choisirAppr = (liste, graine) => liste[Math.floor(hasardAppr(graine) * liste.length)];
const selonTon = (x, ton) => (Array.isArray(x) ? x : x[ton[0] === 'b' ? 'b' : ton[0] === 'e' ? 'x' : 'n']);

/* ---------- Objectif dit à l'élève (ici et dans l'espace PP, pp.js) ----------
   Un but est écrit à l'infinitif, à la 3e personne (« consolider ses acquis », « s’investir davantage »). Pour varier
   la phrase d'objectif, l'appli le dit aussi à l'élève : « Je te conseille de consolider tes acquis »,
   « Afin de progresser, consolide tes acquis » (au vouvoiement : « vos acquis », « consolidez »). */
// Impératif des verbes qui ne sont pas en -er : [tu, vous].
const IMPERATIFS_APPR = {
  fournir: ['fournis', 'fournissez'], investir: ['investis', 'investissez'], approfondir: ['approfondis', 'approfondissez'],
  venir: ['viens', 'venez'], maintenir: ['maintiens', 'maintenez'], apprendre: ['apprends', 'apprenez'], prendre: ['prends', 'prenez'],
  reprendre: ['reprends', 'reprenez'], mettre: ['mets', 'mettez'], poursuivre: ['poursuis', 'poursuivez'],
};
// → { tu : infinitif à la 2e personne (« t’investir », « tes acquis »), deTu : « de … » / « d’… », imp : impératif ou null }
function butAdresse(but, vous = false) {
  const poss = vous ? { ses: 'vos', son: 'votre', sa: 'votre' } : { ses: 'tes', son: 'ton', sa: 'ta' };
  const adresser = t => t.replace(/(^|\s)(ses|son|sa)(?=\s)/g, (x, a, p) => a + poss[p])
    .replace(/(^|\s)se /g, `$1${vous ? 'vous' : 'te'} `).replace(/(^|\s)s’/g, `$1${vous ? 'vous ' : 't’'}`);
  const tu = adresser(but);
  const deTu = (/^[aeiouâàéèêîôû]/i.test(tu) ? 'd’' : 'de ') + tu;
  // Impératif : « mieux s’organiser … » → « organise-toi mieux … » ; inconnu ou deux verbes (« respecter et faire
  // respecter ») : pas d'impératif.
  let imp = null;
  const m = but.match(/^(mieux )?(se |s’)?([a-zàâçéèêëîïôûù]+)(.*)$/);
  if (m && !/\bet [a-zé]+(er|ir|re)\b/.test(m[4])) {
    const [, adv, pron, verbe, reste] = m;
    let f = IMPERATIFS_APPR[verbe]?.[vous ? 1 : 0];
    if (!f && verbe.endsWith('er')) {
      const radical = verbe.slice(0, -2);
      f = vous ? radical + 'ez' : radical.replace(/é([^aeiouyéèêàâîôû]+)$/, 'è$1') + 'e'; // (persévérer → persévère)
    }
    if (f) imp = f + (pron ? (vous ? '-vous' : '-toi') : '') + (adv ? ' mieux' : '') + adresser(reste);
  }
  return { tu, deTu, imp };
}
// Début de phrase « pour la suite » : « Pour le prochain trimestre »… ; après la dernière période ou pour l'année :
// « Pour l’année prochaine »… (Plusieurs : « trimestre » est souvent déjà écrit dans le bilan.)
const suiteAppr = (periode, per) => (periode === 'annee' || periodesAnnee().at(-1)?.id === periode ? ['Pour l’année prochaine', 'L’an prochain']
  : [`Pour le prochain ${per}`, 'Pour la suite', 'Dans les semaines à venir']);
// Modèles de la phrase d'objectif : {but} (3e personne), {deTu} (« de consolider tes acquis »), {imp} (« consolide
// tes acquis ») ; ceux qui demandent un impératif inconnu sont écartés. base : le but à la 3e personne, sans les
// variantes {il|vous} de pp.js.
function modelesObjectifAppr(modeles, but, vous, suite, base = but) {
  const f = butAdresse(base, vous);
  return modeles.filter(m => f.imp || !m.includes('{imp}'))
    .map(m => m.replace(/\{Suite\}/g, suite).replace(/\{deTu\}/g, f.deTu).replace(/\{imp\}/g, f.imp || '').replace(/\{but\}/g, but));
}

function objectifAppr(niv, a, actives) {
  const notes = actives.filter(k => niv[k] && k !== 'objectif');
  // (Une progression « stable » n'est pas une faiblesse ; des résultats corrects mais en retrait par rapport à la classe, si.)
  const poids = k => (k === 'progression' && niv[k] === 2 ? 3 : k === 'moteur' && niv[k] === 3 && a.details.position?.cle === 'retrait' ? 2.5 : niv[k]);
  const pire = notes.length ? Math.min(...notes.map(poids)) : 3;
  if (pire >= 3 && !(a.details.absences >= 3)) return { cle: 'haut' };
  if (a.details.absences >= 3 && (niv.attitude || 3) <= 2) return { cle: 'absences' };
  const k = notes.find(x => poids(x) === pire) || 'competences';
  // Seule la progression faiblit, chez un élève par ailleurs solide : on parle de régularité.
  if (k === 'progression' && notes.filter(x => x !== 'progression').every(x => niv[x] >= 3)) return { cle: 'regularite' };
  if (k === 'competences' || k === 'moteur' || k === 'methodo') {
    // (Objectif général, pas une compétence précise ; seule la sécurité est nommée, quand c'est elle qui pèche.)
    const g = a.details.faibles.find(x => k === 'competences' || x.cat === k);
    if (g && /securite|assurage/.test(sansAccent(g.texte))) return { cle: 'securite' };
  }
  return { cle: k };
}

// Difficulté signalée par ce que l'enseignant a rempli (observation et ses mots-clés, degré choisi, absence, note…,
// pas un degré pré-rempli d'après la note) : niveau 1 ou 2 ; progression : en baisse.
function difficulteSaisieAppr(a, k) {
  if (k === 'objectif' || a.defaut[k] || !a.niveaux[k]) return false;
  if (a.details?.saisi && !a.details.saisi[k]) return false;
  return a.niveaux[k] <= (k === 'progression' ? 1 : 2);
}

// Rubriques abordées : celles cochées dans les réglages, plus les rubriques décochées où le carnet signale une difficulté
// (point de vigilance : ex. observation « bavarde, insolent » → comportement). 0 choisi à la main = ne pas en parler.
function rubriquesAppr(r, a, perso = {}) {
  perso ||= {};
  return r.ordre.filter(k => {
    if (!r.actives.includes(k) && !difficulteSaisieAppr(a, k)) return false;
    return k === 'objectif' || !(k in perso) || !!perso[k];
  });
}

// Points de vigilance : rubriques abordées où le carnet signale une difficulté (en priorité dans le texte et l'objectif).
function vigilanceAppr(r, a, perso = {}) {
  return new Set(rubriquesAppr(r, a, perso).filter(k => difficulteSaisieAppr(a, k)));
}

// Niveaux choisis à la main encore utiles : ceux d'une rubrique décochée dont la difficulté a disparu
// (observation supprimée) sont oubliés.
function persoUtileAppr(r, a, perso) {
  return Object.fromEntries(Object.entries(perso || {}).filter(([k]) => r.actives.includes(k) || difficulteSaisieAppr(a, k)));
}

/* ---------- Relecture (faite par l'appli, sur l'appareil, sans internet) ----------
   Une appréciation correctement écrite : jamais deux fois le même adverbe (« encore… encore »), ni deux mots de
   liaison de même sens (« néanmoins » puis « mais »), ni le même mot plein répété (« pour progresser… progresser ») ;
   élisions (« de il » → « d’il »), majuscules, ponctuation, il / elle, quelques fautes courantes.
   Sert à choisir les phrases proposées (voir redigerAppr) et à relire un texte réécrit à la main. */

// Mots de liaison de même sens : une seule fois par appréciation.
const LIAISONS_APPR = {
  opposition: ['mais', 'neanmoins', 'en revanche', 'cependant', 'toutefois', 'pourtant', 'par contre', 'malgre'],
  ajout: ['de plus', 'en outre', 'par ailleurs', 'egalement', 'aussi'],
  explication: ['en effet', 'car'],
  consequence: ['donc', 'ainsi', 'par consequent', 'c’est pourquoi', 'c\'est pourquoi'],
};
const ADVERBES_APPR = ['encore', 'davantage', 'toujours', 'tres', 'bien', 'mieux', 'plus', 'moins', 'maintenant', 'regulierement', 'souvent',
  'parfois', 'notamment', 'vraiment', 'pleinement', 'imperativement', 'globalement', 'nettement', 'trop', 'deja', 'beaucoup', 'assez',
  'particulierement', 'correctement', 'serieusement', 'activement', 'volontiers', 'ensuite', 'enfin', 'surtout', 'vite', 'sans cesse'];
// Adverbes qu'on peut retirer sans changer le sens (2e fois : retirés de la proposition).
const ADVERBES_RETIRABLES_APPR = ['encore', 'vraiment', 'toujours', 'maintenant', 'deja', 'egalement', 'aussi', 'pleinement', 'globalement'];
// Mots pleins courants à ne pas compter comme répétitions.
const MOTS_LIBRES_APPR = new Set(['toutes', 'autres', 'chaque', 'quelques', 'pendant', 'depuis', 'courage', 'bravo', 'objectif']);
const LETTRE_APPR = /[\p{L}\p{M}]/u;
const normAppr = t => sansAccent(String(t)).toLocaleLowerCase('fr').replace(/[’']/g, '’');
const motsAppr = t => normAppr(t).split(/[^\p{L}\p{M}]+/u).filter(Boolean);
// « progresser », « progrès », « progression » : même famille (7 premières lettres).
const racineAppr = m => (m.length > 7 ? m.slice(0, 7) : m.replace(/s$/, ''));
const contientAppr = (texteNorm, expr) => new RegExp(`(^|[^\\p{L}\\p{M}])${expr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{M}])`, 'u').test(texteNorm);

const RE_LIAISONS_APPR = Object.entries(LIAISONS_APPR).flatMap(([fam, exprs]) => exprs.map(e =>
  ({ fam, e, re: new RegExp(`(^|[^\\p{L}\\p{M}])${e.replace(/[’']/g, '[’\']')}(?![\\p{L}\\p{M}])`, 'gu') })));
// Ce que le texte contient : adverbes, familles de liaison, racines des mots pleins (avec leur nombre).
function inventaireAppr(texte, ignorer = []) {
  const n = normAppr(texte), mots = motsAppr(texte), ign = new Set(ignorer.map(normAppr));
  const compte = liste => { const m = new Map(); liste.forEach(x => m.set(x, (m.get(x) || 0) + 1)); return m; };
  const adverbes = compte(mots.filter(m => ADVERBES_APPR.includes(m)).concat(contientAppr(n, 'sans cesse') ? ['sans cesse'] : []));
  const liaisons = new Map();
  for (const { fam, e, re } of RE_LIAISONS_APPR) {
    const nb = (n.match(re) || []).length;
    if (nb) liaisons.set(fam, [...(liaisons.get(fam) || []), ...Array(nb).fill(e)]);
  }
  const pleins = compte(mots.filter(m => m.length >= 6 && !ADVERBES_APPR.includes(m) && !MOTS_LIBRES_APPR.has(m) && !ign.has(m)).map(racineAppr));
  return { adverbes, liaisons, pleins };
}

// Nombre de répétitions qu'ajouterait `ajout` à la suite de `avant` (pour choisir les phrases).
let inventaireMemoAppr = { cle: null, inv: null }; // (même début de texte comparé à toutes les phrases candidates)
function conflitsAppr(avant, ajout, ignorer = []) {
  const cle = avant + '\u0000' + ignorer.join('|');
  if (inventaireMemoAppr.cle !== cle) inventaireMemoAppr = { cle, inv: inventaireAppr(avant, ignorer) };
  const a = inventaireMemoAppr.inv, b = inventaireAppr(ajout, ignorer);
  let n = 0;
  for (const [m, k] of b.adverbes) n += (a.adverbes.has(m) ? k : k - 1);
  for (const [f, l] of b.liaisons) n += (a.liaisons.has(f) ? l.length : l.length - 1);
  for (const [m, k] of b.pleins) n += (a.pleins.has(m) ? k : k - 1);
  return n;
}

// Corrections sûres (sans changer le sens) : espaces, élisions, mots doublés, majuscules, adverbe répété retiré.
function corrigerAppr(texte, { retirerAdverbes = false } = {}) {
  let t = String(texte).replace(/[ \t]+/g, ' ').replace(/ +([,.])/g, '$1').replace(/([,.;:!?])(?=\p{L})/gu, '$1 ')
    .replace(/(\S)([!?;:])(?=\s|$)/g, (x, a, b) => (/\d/.test(a) && b === ':' ? x : `${a} ${b}`)).trim();
  // Élisions : « de il » → « d’il », « que elle » → « qu’elle », « si il » → « s’il » (pas devant un h : « le handball »).
  t = t.replace(/(^|[^\p{L}])(d|l|qu|n|s|j|m|t)(e) (?=[aeiouàâäéèêëîïôöûüAEIOUÀÂÉÈÊÎÔÛ])/gu, (x, a, b) => `${a}${b}’`)
    .replace(/(^|[^\p{L}])([Ll])a (?=[aeiouàâéèêîôûAEIOUÀÂÉÈÊÎÔÛ])/gu, '$1$2’')
    .replace(/(^|[^\p{L}])([Ss])i (?=ils?(?![\p{L}]))/gu, '$1$2’');
  // Mots doublés (« de de »), sauf « nous nous », « vous vous ».
  t = t.replace(/(^|[^\p{L}])(\p{L}+) \2(?![\p{L}])/gu, (x, a, m) => (/^(nous|vous)$/i.test(m) ? x : a + m));
  // Virgule après une liaison en début de phrase (« Néanmoins, elle… »).
  t = t.replace(/(^|[.!?] )(Néanmoins|En revanche|En effet|Cependant|Toutefois|De plus|Par ailleurs|En outre|Par conséquent|Pourtant|Enfin|Ainsi) (?=\p{L})/gu, '$1$2, ');
  // Majuscule en début de phrase ; point final.
  t = t.replace(/(^|[.!?] )(\p{Ll})/gu, (x, a, l) => a + l.toLocaleUpperCase('fr'));
  if (t && !/[.!?…)»]$/.test(t)) t += '.';
  if (retirerAdverbes) {
    for (const adv of ADVERBES_RETIRABLES_APPR) {
      let vu = false;
      t = t.replace(new RegExp(`(^|[^\\p{L}])([\\p{L}]+)(?![\\p{L}])`, 'gu'), (x, a, m) => {
        if (normAppr(m) !== adv) return x;
        if (!vu) { vu = true; return x; }
        return a.endsWith(' ') || a === '' ? '' : a; // (l'espace qui suit est fusionné plus bas)
      }).replace(/ {2,}/g, ' ').replace(/ ([,.!?])/g, (x, p) => (p === ',' || p === '.' ? p : x));
    }
  }
  return t;
}

// Fautes courantes (relecture d'un texte écrit à la main).
const FAUTES_APPR = [
  [/(^|[^\p{L}])malgrés(?![\p{L}])/giu, '« malgrés » → « malgré »'],
  [/quelque soi[st]?(?![\p{L}])/giu, '« quelque soit » → « quel que soit »'],
  [/(^|[^\p{L}])parmis(?![\p{L}])/giu, '« parmis » → « parmi »'],
  [/comme même/giu, '« comme même » → « quand même »'],
  [/pallier à/giu, '« pallier à » → « pallier » (sans « à »)'],
  [/au jour d[’']aujourd[’']hui/giu, '« au jour d’aujourd’hui » → « aujourd’hui »'],
  [/(^|[^\p{L}])language(?![\p{L}])/giu, '« language » → « langage »'],
  [/(^|[^\p{L}])(?:il|elle) [àa] (?:du|de) mal(?![\p{L}])/giu, ''], // (correct : ignoré)
];
const PAS_INFINITIF_APPR = new Set(['hier', 'cher', 'fier', 'amer', 'mer', 'fer', 'super', 'premier', 'dernier', 'entier', 'leger', 'chantier', 'quartier', 'atelier', 'clavier', 'papier']);

// Remarques sur un texte : [{ grave, texte }]. el : l'élève (il / elle, prénom) ; autres : prénoms des autres élèves.
function relireAppr(texte, el = {}, autres = []) {
  const t = String(texte || '').trim(), res = [];
  if (!t) return res;
  const prenom = (el.prenom || '').trim();
  const inv = inventaireAppr(t, prenom ? [prenom, ...prenom.split(/[\s-]+/)] : []);
  const original = mot => (t.match(new RegExp(`(?:^|[^\\p{L}])(${mot.split('').map(c => '[' + c + c.toUpperCase() + 'àâäéèêëîïôöûüç]').join('')})`, 'u')) || [])[1] || mot;
  for (const [m, k] of inv.adverbes) if (k > 1) res.push({ grave: true, texte: `« ${m === 'tres' ? 'très' : m === 'deja' ? 'déjà' : m === 'regulierement' ? 'régulièrement' : m} » répété ${k} fois` });
  for (const [, l] of inv.liaisons) if (l.length > 1) res.push({ grave: true, texte: `Liaisons de même sens : ${[...new Set(l)].map(x => `« ${x.replace('neanmoins', 'néanmoins').replace('malgre', 'malgré').replace('egalement', 'également').replace('consequent', 'conséquent')} »`).join(' et ')}${new Set(l).size === 1 ? ` (${l.length} fois)` : ''}` });
  const mots = motsAppr(t);
  for (const [rac, k] of inv.pleins) {
    if (k < 2) continue;
    const vus = [...new Set(mots.filter(m => racineAppr(m) === rac))];
    res.push({ grave: true, texte: `Répétition : ${vus.map(m => `« ${original(m)} »`).join(', ')}` });
  }
  if (/(^|[^\p{L}])(\p{L}+) \2(?![\p{L}])/iu.test(t) && !/(^|[^\p{L}])(nous nous|vous vous)(?![\p{L}])/iu.test(t)) res.push({ grave: true, texte: 'Mot écrit deux fois de suite' });
  if (corrigerAppr(t) !== t) res.push({ grave: true, texte: 'Ponctuation, majuscules ou élisions à corriger', corrigeable: true });
  // Il / elle
  if (el.sexe === 'F' && /(^|[.!?] |, )Il (?!faut|faudra|faudrait|reste|est (?:important|nécessaire|essentiel)|s’agit|y a)/u.test(t)) res.push({ grave: true, texte: '« Il » pour une élève ?' });
  if (el.sexe === 'G' && /(^|[^\p{L}])[Ee]lle(?![\p{L}])/u.test(t)) res.push({ grave: true, texte: '« Elle » pour un élève ?' });
  // Copier-coller : le prénom d'un autre élève
  const autre = autres.find(p => p && p !== prenom && p.length > 2 && new RegExp(`(^|[^\\p{L}])${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}])`, 'u').test(t));
  if (autre) res.push({ grave: true, texte: `Le texte cite « ${autre} » : est-ce le bon élève ?` });
  if (prenom && !new RegExp(prenom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'iu').test(t) && /^(Il|Elle) /.test(t)) res.push({ grave: false, texte: 'Commence par « Il / Elle » sans citer le prénom' });
  for (const [re, msg] of FAUTES_APPR) if (msg && re.test(t)) res.push({ grave: true, texte: msg });
  // Participe / infinitif : « il a progresser », « doit progressé »
  // « de le travail » → « du travail » (mais « de le faire » est juste : pas devant un infinitif)
  const contr = [...t.matchAll(/(?:^|[^\p{L}])([Dd]e le|[Dd]e les|[Àà] le|[Àà] les) (\p{L}+)/gu)].find(x => !/(er|ir|re|oir)$/.test(x[2]));
  if (contr) {
    const bon = { 'de le': 'du', 'de les': 'des', 'à le': 'au', 'à les': 'aux' }[contr[1].toLocaleLowerCase('fr')];
    res.push({ grave: true, texte: `« ${contr[1]} ${contr[2]} » → « ${bon} ${contr[2]} »` });
  }
  // (« a encore progresser » : un adverbe peut s'intercaler.)
  const adv = '(?:(?:encore|bien|beaucoup|toujours|déjà|vraiment|nettement|souvent|parfois|peu|trop|mieux) )?';
  const aInf = [...t.matchAll(new RegExp(`(?:^|[^\\p{L}])(?:a|ont|as|avons|avez) ${adv}(\\p{L}{3,}er)(?![\\p{L}])`, 'gu'))].map(x => x[1]).find(m => !PAS_INFINITIF_APPR.has(normAppr(m)));
  if (aInf) res.push({ grave: true, texte: `« a ${aInf} » → « a ${aInf.slice(0, -2)}é » ?` });
  // « des efforts a faire » → « à faire » (après un nom, pas après il / elle / on)
  const rePrenom = new RegExp(`^${prenom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'iu');
  const aFaire = [...t.matchAll(/(?:^|[^\p{L}])(?!(?:il|elle|on|qui|Il|Elle|On|Qui) )(\p{L}+) a (faire|\p{L}{2,}(?:ir|re|oir))(?![\p{L}])/gu)]
    .find(x => !/^(notre|votre|entre|contre|autre|propre|encore|plaisir|désir|avenir|loisir|soir|espoir)$/i.test(x[2]) && !(prenom && rePrenom.test(x[1])));
  if (aFaire) res.push({ grave: true, texte: `« a ${aFaire[2]} » → « à ${aFaire[2]} » ?` });
  const doitPp = [...t.matchAll(/(?:^|[^\p{L}])(?:doit|doivent|peut|peuvent|faut|faudra|va|vont|devra|pourra) (\p{L}{3,}é)(?![\p{L}])/gu)].map(x => x[1]).find(m => !/té$/.test(m));
  if (doitPp) res.push({ grave: true, texte: `« ${doitPp} » → « ${doitPp.slice(0, -1)}er » ?` });
  return res;
}

const prenomsAutresAppr = (el, eleves) => (eleves || []).filter(x => x.id !== el.id).map(x => (x.prenom || '').trim());
const htmlRelectureAppr = (texte, el, autres, manuel) => {
  const rem = relireAppr(texte, el, autres);
  if (!texte.trim()) return '';
  if (!rem.length) return '<span class="relu-appr ok" title="Relu par l’appli : pas de répétition ni de faute repérée">✔ Relu</span>';
  const corrigeable = manuel && corrigerAppr(texte) !== texte.trim();
  return `<span class="relu-appr" title="${esc(rem.map(x => '• ' + x.texte).join('\n'))}">⚠ ${rem.map(x => esc(x.texte)).join(' · ')}</span>`
    + (corrigeable ? ' <button type="button" class="lien" data-appr-corriger title="Espaces, majuscules, élisions, mot doublé">✔ Corriger</button>' : '');
};

function redigerAppr(el, periode, a, niveauxPerso, r, graine = 0) {
  niveauxPerso = persoUtileAppr(r, a, niveauxPerso);
  const niv = { ...a.niveaux };
  for (const [k, v] of Object.entries(niveauxPerso)) niv[k] = v || null; // 0 = ne pas en parler
  const ton = r.ton, tele = r.style === 'telegraphique';
  const sexe = ['F', 'G'].includes(el.sexe) ? el.sexe : '';
  const prenom = (el.prenom || '').trim() || el.nom;
  // Sujet : le prénom la 1re fois, puis il / elle. Pour ne pas enchaîner « Il… Il… Il… » : deux phrases de suite ne
  // commencent pas par le pronom (voir choisir) ; faute d'autre tournure, le prénom est repris (rappelPrenom).
  let dejaNomme = false, dernierPronom = false, rappelPrenom = false;
  const sujet = maj => {
    if (!dejaNomme || !sexe || (maj && rappelPrenom)) { dejaNomme = true; rappelPrenom = false; return prenom; }
    return sexe === 'F' ? (maj ? 'Elle' : 'elle') : (maj ? 'Il' : 'il');
  };
  const p = periodesAnnee().find(x => x.id === periode);
  const per = periode === 'annee' ? 'année' : p?.code?.startsWith('S') ? 'semestre' : 'trimestre';
  const ce = periode === 'annee' ? 'cette année' : `ce ${per}`;
  const minuscule = s => s[0].toLocaleLowerCase('fr') + s.slice(1);
  const apsaTexte = k => {
    const d = a.details, x = n => activiteDansPhrase(n);
    if (d.apsaSeule) return x(d.apsaSeule);
    if (k >= 3 && d.apsaForte && x(d.apsaForte)) return ', notamment' + x(d.apsaForte);
    if (k <= 2 && d.apsaFaible && x(d.apsaFaible)) return ', notamment' + x(d.apsaFaible);
    return '';
  };
  const remplir = (modele, k) => modele
    .replace(/\{S\}/g, () => sujet(true)).replace(/\{s\}/g, () => sujet(false)).replace(/\{P\}/g, prenom)
    // (Incise « , notamment en … » au milieu de la phrase : refermée par une virgule.)
    .replace(/\{apsa\}(?= [\p{L}])/gu, () => apsaTexte(k) + (apsaTexte(k).startsWith(',') ? ',' : '')).replace(/\{apsa\}/g, apsaTexte(k)).replace(/\{ce\}/g, ce).replace(/\{Per\}/g, per[0].toUpperCase() + per.slice(1)).replace(/\{per\}/g, per);
  // (essai : autres tirages quand la relecture trouve une répétition ; l'essai 0 donne le tirage habituel.)
  let essai = 0;
  const g = cle => `${el.id}|${periode}|${graine}|${essai ? essai + '|' : ''}${cle}`;
  const ignores = [prenom, ...prenom.split(/[\s-]+/)];
  const brut = x => x.replace(/\{apsa\}/g, '').replace(/\{ce\}/g, ce).replace(/\{[A-Za-z]+\}/g, ' ');
  const actives = rubriquesAppr(r, a, niveauxPerso);
  const vigilance = vigilanceAppr(r, a, niveauxPerso); // (passent en priorité)
  // Bilan nuancé par la position dans la classe (voir positionClasse) : en retrait, un bilan correct (3 ou 4) devient
  // « un peu en retrait par rapport à la classe » ; parmi les meilleurs, il le dit. (Sauf niveau des résultats choisi
  // à la main qui le contredit.)
  const positionAppr = k => {
    const c = a.details.position?.cle;
    // (« Parmi les meilleurs » : pour un bilan bon, pas excellent — un excellent bilan le reste.)
    if (!c || k < 3 || (c === 'retrait' && (niv.moteur || 0) > 3) || (c === 'tete' && (k > 3 || (niv.moteur || 0) < 3))) return null;
    return c;
  };

  // court = true : la phrase la plus courte de chaque liste (essayé avant de laisser des rubriques de côté).
  const construire = (court, exclues = []) => {
    dejaNomme = false; dernierPronom = false; rappelPrenom = false;
    let retraitDit = false; // (« en retrait par rapport à la classe » : dit une seule fois)
    let ecrit = ''; // (texte déjà choisi : pour ne pas répéter un adverbe, une liaison ou un mot)
    // Les phrases qui répètent le moins ce qui est déjà écrit (aucune répétition si possible).
    const moinsDeRepetitions = (liste, voir = x => x) => {
      const n = liste.map(x => conflitsAppr(ecrit, voir(x), ignores)), min = Math.min(...n);
      return liste.filter((x, i) => n[i] === min);
    };
    // marge (mode court) : choisir au hasard parmi les phrases à peine plus longues que la plus courte (variété).
    const choisir = (tout, graine, marge = 0) => {
      tout = moinsDeRepetitions(tout, brut);
      // L'appréciation commence par le prénom : la 1re phrase est prise parmi celles qui commencent par lui.
      const premiere = !dejaNomme && !tele ? tout.filter(x => x.startsWith('{S}')) : [];
      // Sans il / elle (sexe non renseigné), le prénom se répéterait : on préfère alors les phrases sans sujet.
      const sansSujet = dejaNomme && !sexe ? tout.filter(x => !/\{[Ss]\}/.test(x)) : [];
      // Phrase précédente en « Il / Elle » : on varie la tournure (« L’engagement est… », « Les résultats… »).
      const varie = dejaNomme && dernierPronom ? tout.filter(x => !x.startsWith('{S}')) : [];
      const liste = premiere.length ? premiere : sansSujet.length ? sansSujet : varie.length ? varie : tout;
      const min = Math.min(...liste.map(x => x.length));
      const choix = court ? choisirAppr(liste.filter(x => x.length <= min + marge), graine) : choisirAppr(liste, graine);
      const enPronom = dejaNomme && sexe && choix.startsWith('{S}');
      if (enPronom && dernierPronom) { rappelPrenom = true; dernierPronom = false; } // (pas d'autre tournure : on redit le prénom)
      else dernierPronom = enPronom;
      return choix;
    };
    const morceaux = []; // { cle, texte }
    const ajouter = m => { morceaux.push(m); ecrit += ' ' + m.texte; };
    if (r.bilan && !exclues.includes('bilan')) {
      const base = ['moteur', 'competences', 'attitude'].map(k => niv[k]).filter(Boolean);
      if (base.length) {
        let k = Math.max(1, Math.min(4, Math.round(moyenneListe(base))));
        const cote = periode === 'annee' ? 'annee' : 'periode', classe = positionAppr(k);
        // (Juste sous la moyenne de la classe, avec des résultats justes : pas de « satisfaisant » non plus.)
        if (!classe && k >= 3 && a.details.position?.ecart < 0 && niv.moteur && niv.moteur <= 2) k = 2;
        const banque = classe ? BILANS_CLASSE_APPR[classe][cote] : selonTon(BILANS_APPR[cote][k], ton);
        if (classe === 'retrait') retraitDit = true;
        ajouter({ cle: 'bilan', pol: classe === 'retrait' ? -1 : k >= 3 ? 1 : -1, texte: remplir(choisir(banque, g('bilan')), classe === 'retrait' ? 2 : k) });
      }
    }
    for (const k of actives) {
      if (k === 'objectif' || exclues.includes(k)) continue;
      const n = niv[k];
      if (!n) continue;
      let banque = phrasesAppr()[k][n];
      if (k === 'progression' && n === 2 && (niv.moteur || 0) >= 3) banque = STABLE_BON_APPR;
      // (Résultats corrects mais sous la moyenne de la classe : nuancés, une seule fois dans l'appréciation.)
      const retrait = k === 'moteur' && n === 3 && a.details.position?.cle === 'retrait';
      if (retrait) { banque = retraitDit ? RETRAIT_DIT_APPR : RETRAIT_APPR; retraitDit = true; }
      // Importance (pour le manque de place) : niveau par défaut < « stable » < satisfaisant < fragile < extrêmes (1 et 4).
      // Point de vigilance (difficulté signalée par ce que l'enseignant a rempli) : gardé en priorité.
      const importance = vigilance.has(k) ? 5 : a.defaut[k] && !(k in (niveauxPerso || {})) ? 0 : k === 'progression' && n === 2 ? 1 : n === 3 && !retrait ? 2 : n === 2 || n === 3 ? 3 : 4;
      // pol : sens de la phrase (+1 point fort, −1 difficulté, 0 neutre), pour les liaisons (voir lier).
      const pol = k === 'progression' && n === 2 ? (banque === STABLE_BON_APPR ? 1 : 0) : n >= 3 && !retrait ? 1 : -1;
      ajouter({ cle: k, importance, pol, texte: remplir(choisir(selonTon(tele ? banque.t : banque.p, ton), g(k)), retrait ? 2 : n) });
    }
    if (actives.includes('objectif') && niv.objectif !== null) {
      // (À faiblesse égale, l'objectif vise d'abord un point de vigilance rempli par l'enseignant.)
      const o = objectifAppr(niv, a, [...vigilance, ...actives.filter(k => !vigilance.has(k))]);
      // (Le but est un bout de phrase : choisi à part, pour ne pas fausser le suivi des « Il / Elle ».)
      const buts = objectifsAppr()[o.cle];
      // (Sans répéter un mot déjà écrit : « Pour progresser, il faudra fournir davantage de travail pour progresser ».)
      const butsOk = moinsDeRepetitions(buts);
      const but = o.texte || (court ? butsOk.reduce((x, y) => (y.length < x.length ? y : x)) : choisirAppr(butsOk, g('but')));
      // (Plusieurs tournures, dont certaines adressées à l'élève : « Je te conseille… », « Afin de progresser, consolide… ».)
      const modeles = tele ? (o.cle === 'haut' ? ['Objectif : {but}.', 'Pour la suite : {but}.'] : ['Objectif : {but}.', 'À travailler : {but}.', 'Pour la suite : {but}.', 'Axe de progrès : {but}.'])
        : o.cle === 'haut' ? (ton === 'bienveillant' ? ['Bravo ! Il faut maintenant {but}.', 'Bravo, il faut {but} !', 'Bravo ! {Suite}, {imp}.', 'Bravo ! Je te conseille maintenant {deTu}.']
          : ['Il faut maintenant {but}.', '{Suite}, il faudra {but}.', 'Je te conseille, pour la suite, {deTu}.'])
          : ton === 'exigeant' ? ['{S} doit maintenant {but}.', 'Il faut impérativement {but}.', '{Suite}, il faudra impérativement {but}.', 'Je te demande, pour la suite, {deTu}.']
            : ton === 'bienveillant' ? ['{Suite}, il faudra {but}. Courage !', 'Je te conseille, pour la suite, {deTu}. Courage !', 'Afin de progresser, {imp}. Courage !', 'Pour progresser, il faudra {but}. Courage !']
              : ['{Suite}, il faudra {but}.', 'Je te conseille, pour la suite, {deTu}.', 'Afin de progresser, {imp}.', 'Il faut maintenant {but}.'];
      const suite = choisirAppr(moinsDeRepetitions(suiteAppr(periode, per)), g('suite'));
      let t = remplir(choisir(modelesObjectifAppr(modeles, but, false, suite), g('objectif'), 20), 0);
      t = t[0].toUpperCase() + t.slice(1);
      ajouter({ cle: 'objectif', texte: t });
    }
    return morceaux;
  };

  // Liaisons entre les phrases (style « phrases ») : « En effet, » après le bilan quand la phrase le confirme ;
  // « Néanmoins, » d'un point fort à une difficulté, « En revanche, » dans l'autre sens ; « et » pour réunir deux points
  // forts courts dont le second commence par il / elle (« Il s’investit avec sérieux et obtient de bons résultats »).
  const debutMinuscule = t => (t.startsWith(prenom) ? t : t[0].toLocaleLowerCase('fr') + t.slice(1));
  const lier = liste => {
    if (tele) return liste.map(m => m.texte).join(' ');
    const sortie = [];
    // Une seule liaison de chaque sens dans l'appréciation : pas de « Néanmoins » s'il y a déjà un « mais »…
    const deja = inventaireAppr(liste.map(m => m.texte).join(' ')).liaisons;
    let enEffet = deja.has('explication'), opposition = deja.has('opposition'), lies = 0, avant = null;
    for (const m of liste) {
      let t = m.texte;
      const prec = sortie.at(-1);
      if (avant && m.cle !== 'objectif' && m.pol) {
        // (« En effet » : une appréciation sur deux environ, toujours la même pour un élève donné.)
        if (avant.cle === 'bilan' && !enEffet && m.pol === avant.pol && hasardAppr(g('en effet')) < 0.55) { t = 'En effet, ' + debutMinuscule(t); enEffet = true; }
        else if (avant.cle !== 'bilan' && avant.pol * m.pol < 0) {
          if (!opposition) { t = (avant.pol > 0 ? 'Néanmoins, ' : 'En revanche, ') + debutMinuscule(t); opposition = true; }
        }
        // « et » : deux points forts courts à la suite (jamais deux « et » dans une phrase). Même sujet (l'élève) :
        // « Il s’investit … et obtient … » ; sinon : « Les compétences … sont acquises et il obtient … ».
        else if (avant.cle !== 'bilan' && avant.pol > 0 && m.pol > 0 && lies < 2 && prec && /\.$/.test(prec)
          && !/ et |^En effet|^Néanmoins|^En revanche|:/.test(prec) && !/ et |:/.test(t) && prec.length < 95 && t.length < 95) {
          // (« … et Léa obtient » : le prénom redit au milieu de la phrase est retiré, comme il / elle.)
          const debutSujet = new RegExp(`^(Il|Elle|${prenom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}) `);
          const memeSujet = debutSujet.test(t) && (prec.startsWith(prenom + ' ') || /^(Il|Elle) /.test(prec));
          // (Après une incise « , notamment en … » : « , et ».)
          const joint = /, notamment [^,]*\.$/.test(prec) ? ', et ' : ' et ';
          sortie[sortie.length - 1] = prec.slice(0, -1) + joint + (memeSujet ? t.replace(debutSujet, '') : debutMinuscule(t));
          lies++; avant = m;
          continue;
        }
      }
      sortie.push(t);
      avant = m;
    }
    return sortie.join(' ');
  };

  // Texte final : liaisons, puis relecture (corrections sûres ; un adverbe répété malgré tout est retiré).
  // (« un bon trimestre… a progressé ce trimestre » : la période déjà nommée n'est pas redite.)
  const finir = liste => {
    let t = lier(liste);
    const i = t.indexOf(per);
    if (i >= 0) t = t.slice(0, i + per.length) + t.slice(i + per.length).split(' ' + ce).join('');
    return corrigerAppr(t, { retirerAdverbes: true });
  };
  // Longueur : phrases les plus courtes, puis on retire les dernières rubriques (avant l'objectif), puis le bilan.
  const essayer = () => {
  let morceaux = construire(false);
  const retirees = [];
  const longueur = () => finir(morceaux).length;
  if (longueur() > r.longueur) morceaux = construire(true);
  // Le moins important d'abord (à importance égale, le plus loin dans l'ordre ; entre points de vigilance, la difficulté
  // la moins grave, et le comportement en dernier : il vient des observations écrites par l'enseignant) ;
  // le texte est refait à chaque retrait, pour que le prénom soit toujours cité avant « il / elle ».
  while (longueur() > r.longueur && morceaux.length > 1) {
    const rubriques = morceaux.filter(m => m.cle !== 'objectif' && m.cle !== 'bilan');
    const moindre = rubriques.length ? Math.min(...rubriques.map(m => m.importance)) : null;
    let candidates = rubriques.filter(m => m.importance === moindre);
    if (moindre === 5) {
      const leger = Math.max(...candidates.map(m => niv[m.cle] || 0));
      candidates = candidates.filter(m => (niv[m.cle] || 0) === leger);
      if (candidates.length > 1) candidates = candidates.filter(m => m.cle !== 'comportement');
    }
    const cle = moindre !== null ? candidates.at(-1).cle : morceaux.find(m => m.cle === 'bilan')?.cle;
    if (!cle) break;
    retirees.push(cle);
    morceaux = construire(true, retirees);
  }
  // Puis on remet ce qui tient encore dans la longueur (le dernier retiré, le plus important, en premier) :
  // retirer une longue phrase peut libérer la place d'une plus courte.
  for (const cle of [...retirees].reverse()) {
    const sans = retirees.filter(k => k !== cle), avecElle = construire(true, sans);
    if (finir(avecElle).length <= r.longueur) { retirees.splice(retirees.indexOf(cle), 1); morceaux = avecElle; }
  }
  // Toujours commencer par le prénom (style télégraphique : « Léa : investissement sérieux. … »).
  let texte = finir(morceaux);
  if (texte && !texte.startsWith(prenom)) texte = `${prenom} : ${texte[0].toLocaleLowerCase('fr')}${texte.slice(1)}`;
  return { texte, retirees, remarques: relireAppr(texte, el).filter(x => x.grave).length };
  };
  // Relecture : si le texte garde une répétition ou une faute, d'autres formulations sont essayées ; on garde la meilleure
  // (le moins de remarques, puis le moins de rubriques laissées de côté).
  let meilleur = null;
  for (essai = 0; essai < 4; essai++) {
    const res = essayer();
    if (!meilleur || res.remarques * 10 + res.retirees.length < meilleur.remarques * 10 + meilleur.retirees.length) meilleur = res;
    if (!res.remarques) break;
  }
  return { texte: meilleur.texte, niveaux: niv, retirees: meilleur.retirees };
}

/* ---------- Appréciation d'un élève (texte gardé, ou proposé) ---------- */

function appreciationEleve(el, periode, eleves, r = reglageAppr()) {
  const enreg = Donnees.get('suivis', idAppr(el.id, periode));
  const analyse = analyserAppr(el, periode, eleves);
  const propose = redigerAppr(el, periode, analyse, enreg?.niveaux, r, enreg?.graine || 0);
  return { enreg, analyse, propose, texte: enreg?.texte || propose.texte, manuel: !!enreg?.texte };
}

function ecrireAppr(eleveId, periode, changements) {
  const id = idAppr(eleveId, periode), avant = Donnees.get('suivis', id) || {};
  const apres = { ...avant, id, eleveId, apsa: 'appréciation ' + periode, periode, niveaux: avant.niveaux || {}, graine: avant.graine || 0, texte: avant.texte || '', ...changements };
  if (JSON.stringify({ ...avant, maj: 0 }) === JSON.stringify({ ...apres, maj: 0 })) return;
  Donnees.ecrire('suivis', apres);
}

async function copierTexte(texte) {
  try { await navigator.clipboard.writeText(texte); }
  catch {
    const t = document.createElement('textarea');
    t.value = texte; document.body.append(t); t.select();
    document.execCommand('copy'); t.remove();
  }
  toast('Copié ✔ — colle-le dans le bulletin', 'ok');
}

/* ---------- Fenêtre « ✍ Appréciations » de la classe ---------- */

// suite : contenu ajouté au bas de la carte (fiche bilan : le ⚙ des réglages, dans la carte même).
function htmlCarteAppr(el, periode, eleves, r, suite = '') {
  const { analyse, propose, texte, manuel, enreg } = appreciationEleve(el, periode, eleves, r);
  const perso = persoUtileAppr(r, analyse, enreg?.niveaux);
  // Rubriques montrées : celles cochées, plus les décochées que le carnet signale (⚠ point de vigilance, en priorité
  // dans le texte). Une rubrique décochée mise à « non mentionné » disparaît (↺ niveaux calculés pour la retrouver).
  const vigilance = vigilanceAppr(r, analyse, perso), abordees = new Set(rubriquesAppr(r, analyse, perso));
  const puces = r.ordre.filter(k => k !== 'objectif' && (r.actives.includes(k) || abordees.has(k))).map(k => {
    const n = propose.niveaux[k] || 0, change = k in perso, vigil = vigilance.has(k);
    const noms = k === 'progression' ? NOMS_NIV_PROG : NOMS_NIV_APPR;
    const source = (vigil ? `⚠ Point de vigilance : ce que tu as rempli signale une difficulté, l’appréciation en parle en priorité${r.actives.includes(k) ? '' : ' (même si la rubrique est décochée)'}.\n` : '')
      + (change ? `Choisi par toi (calculé : ${analyse.niveaux[k] ? noms[analyse.niveaux[k]] : 'pas de donnée'})` : analyse.sources[k] || 'Pas de donnée : non mentionné');
    return `<button type="button" class="puce-appr n${n}${change ? ' change' : ''}${!change && analyse.defaut[k] ? ' defaut' : ''}${vigil ? ' vigilance' : ''}" data-appr-niveau="${k}"
      title="${esc(source + '\n(toucher pour changer)')}">${vigil ? '⚠ ' : ''}${esc(rubriqueAppr(k).nom)} <b>${n || '–'}</b><small>${esc(noms[n])}</small></button>`;
  }).join('');
  const retirees = propose.retirees.length && !manuel
    ? `<span class="aide">Faute de place, laissé de côté : ${propose.retirees.map(k => k === 'bilan' ? 'bilan' : rubriqueAppr(k).nom.toLowerCase()).join(', ')}.</span>` : '';
  return `<div class="carte-appr" data-appr-eleve="${el.id}">
    <div class="tete-appr"><b>${esc(el.nom)} ${esc(el.prenom)}</b>
      ${manuel ? '<span class="badge-appr">modifiée à la main</span>' : ''}
      <span class="espace"></span>
      ${manuel ? '<button type="button" data-appr-reproposer title="Remplacer ton texte par la proposition de l’appli">🔄 Reproposer</button>'
    : '<button type="button" data-appr-autre title="Mêmes niveaux, autres phrases">🎲 Autre formulation</button>'}
      <button type="button" data-appr-copier>📋 Copier</button></div>
    <div class="puces-appr">${puces}${Object.keys(perso).length ? '<button type="button" class="lien" data-appr-auto title="Revenir aux niveaux calculés par l’appli">↺ niveaux calculés</button>' : ''}</div>
    <textarea class="texte-appr" data-appr-texte rows="3" maxlength="3000" aria-label="${esc(`Appréciation de ${el.nom} ${el.prenom}`)}">${esc(texte)}</textarea>
    <div class="pied-appr"><span class="compte-appr${texte.length > r.longueur ? ' trop' : ''}" data-appr-compte>${texte.length} / ${r.longueur} caractères</span>${retirees}</div>
    <div class="relecture-appr" data-appr-relecture>${htmlRelectureAppr(texte, el, prenomsAutresAppr(el, eleves), manuel)}</div>
    ${suite}
  </div>`;
}

async function ouvrirAppreciations(periodeVoulue, eleveVise) {
  const c = classeActive();
  if (!c) return;
  const eleves = elevesDe(c.id);
  if (!eleves.length) return toast('Pas encore d’élèves dans cette classe.', 'erreur');
  const periodes = periodesAnnee();
  // Période : celle demandée, sinon celle affichée dans Notes, sinon la période en cours.
  let periode = periodeVoulue || (periodeAffichee() !== 'annee' ? periodeAffichee() : periodeDe(aujourdhui()) || 'annee');
  let r = reglageAppr();

  const { d, resultat } = ouvrirModale(`Appréciations — ${c.nom}`, `
    <p class="aide">L’appli propose une appréciation pour chaque élève à partir de ton carnet : notes, degrés de maîtrise, ${motMin('lecons')}
      (présence, données relevées) et mots-clés de tes observations. Touche une rubrique pour changer son niveau ;
      tu peux aussi réécrire le texte. Tout reste dans ton carnet (chiffré sur la clé).</p>
    <div class="fiche-onglets" data-appr-periodes></div>
    <details class="reglages-appr"><summary>⚙ Réglages des appréciations <small>rubriques, ton, style, longueur</small></summary>
      <div data-appr-reglages>${htmlReglageAppr(r)}</div></details>
    <div data-appr-liste></div>`,
  '<button type="button" data-appr-tout title="Copie « NOM Prénom [tab] appréciation », une ligne par élève (se colle aussi dans Excel)">📋 Copier toutes</button>'
    + '<span class="espace"></span><button type="button" data-fermer class="primaire">Fermer</button>', 'modale-large modale-appr');
  const form = $('form', d);


  const dessiner = () => {
    $('[data-appr-periodes]', d).innerHTML = [...periodes.map(p => [p.id, p.code]), ['annee', 'Toute l’année']]
      .map(([v, nom]) => `<button type="button" class="${v === periode ? 'actif' : ''}" data-appr-periode="${v}">${nom}</button>`).join('');
    const evals = evalsPeriode(c.id, periode), seances = seancesPeriode(c.id, periode);
    $('[data-appr-liste]', d).innerHTML = (evals.length || seances.length ? ''
      : `<p class="aide">⚠ Aucune évaluation ni ${motMin('lecon')} sur cette période : les propositions ne s’appuient que sur tes observations.</p>`)
      + eleves.map(el => htmlCarteAppr(el, periode, eleves, r)).join('');
  };
  // Cartes des élèves (niveaux, formulation, texte réécrit, copier) : même fonctionnement que dans la fiche bilan.
  const { enregistrerTexte } = gererCartesAppr(d, { periode: () => periode, eleves, r: () => r });
  const reglagesModifies = () => {
    r = { ...reglageAppr(), ...lireReglageAppr(form) };
    ecrireReglage('appreciations', lireReglageAppr(form));
    enregistrerTexte();
    dessiner();
  };

  d.addEventListener('click', e => lancer(async () => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.apprPeriode) { enregistrerTexte(); periode = b.dataset.apprPeriode; dessiner(); return; }
    if (b.dataset.apprMonter || b.dataset.apprDescendre) { deplacerRubriqueAppr(b); reglagesModifies(); return; }
    if (b.matches('[data-appr-tout]')) {
      enregistrerTexte();
      return copierTexte(eleves.map(el => `${el.nom} ${el.prenom}\t${appreciationEleve(el, periode, eleves, r).texte}`).join('\n'));
    }
  }));
  // Réglages : les appréciations sont refaites aussitôt (cases, listes) ; la longueur pendant la frappe, après une
  // courte pause (seule la liste est redessinée : le champ garde la main).
  let minuteurReglages = null;
  d.addEventListener('change', e => { if (e.target.closest('[data-appr-reglages]')) { clearTimeout(minuteurReglages); reglagesModifies(); } });
  d.addEventListener('input', e => {
    if (!e.target.closest('[data-appr-reglages]') || e.target.type !== 'number') return;
    clearTimeout(minuteurReglages);
    minuteurReglages = setTimeout(reglagesModifies, 500);
  });

  dessiner();
  if (eleveVise) d.querySelector(`[data-appr-eleve="${eleveVise}"]`)?.scrollIntoView({ block: 'center' });
  await resultat;
  enregistrerTexte();
  rendre();
}

// Cartes d'appréciation (fenêtre ✍ Appréciations et fiche bilan) : toucher une rubrique change son niveau,
// « Autre formulation », « Reproposer », retour aux niveaux calculés, texte réécrit (enregistré pendant la frappe), copier.
// Tout est rangé au même endroit (suivis « appréciation <période> ») : la fiche bilan et la fenêtre de la classe montrent
// toujours la même appréciation. ctx : { periode(), eleves, r(), suite() (bas de carte, facultatif) } ;
// renvoie { enregistrerTexte, dessinerCarte }.
function gererCartesAppr(d, ctx) {
  const dessinerCarte = id => {
    const carte = d.querySelector(`[data-appr-eleve="${id}"]`);
    if (carte) carte.outerHTML = htmlCarteAppr(Donnees.get('eleves', id), ctx.periode(), ctx.eleves, ctx.r(), ctx.suite?.() || '');
  };
  let minuteur = null, enAttente = null;
  const enregistrerTexte = () => {
    clearTimeout(minuteur);
    if (!enAttente) return;
    const { eleve, per, texte } = enAttente;
    enAttente = null;
    const propose = appreciationEleve(Donnees.get('eleves', eleve), per, ctx.eleves, ctx.r()).propose.texte;
    ecrireAppr(eleve, per, { texte: texte === propose ? '' : texte });
  };
  // Changer un niveau ou la formulation remplace le texte proposé ; un texte réécrit à la main est d'abord confirmé.
  const garderTexteManuel = async id => {
    if (!Donnees.get('suivis', idAppr(id, ctx.periode()))?.texte) return true;
    return confirmer('Tu as réécrit cette appréciation à la main. La remplacer par une nouvelle proposition ?', 'Remplacer');
  };
  d.addEventListener('click', e => lancer(async () => {
    const b = e.target.closest('button'), carte = b?.closest('[data-appr-eleve]');
    if (!carte) return;
    const id = carte.dataset.apprEleve, el = Donnees.get('eleves', id), periode = ctx.periode(), r = ctx.r();
    enregistrerTexte();
    if (b.matches('[data-appr-copier]')) return copierTexte($('[data-appr-texte]', carte).value.trim());
    if (b.matches('[data-appr-corriger]')) {
      // Corrections sûres seulement (espaces, majuscules, élisions, mot doublé) : le texte de l'enseignant reste le sien.
      const zone = $('[data-appr-texte]', carte), corrige = corrigerAppr(zone.value.trim());
      ecrireAppr(id, periode, { texte: corrige });
      return dessinerCarte(id);
    }
    if (b.matches('[data-appr-reproposer]')) { ecrireAppr(id, periode, { texte: '' }); return dessinerCarte(id); }
    if (b.matches('[data-appr-autre]')) {
      const enreg = Donnees.get('suivis', idAppr(id, periode));
      ecrireAppr(id, periode, { graine: (enreg?.graine || 0) + 1, texte: '' });
      return dessinerCarte(id);
    }
    if (b.matches('[data-appr-auto]')) {
      if (!(await garderTexteManuel(id))) return;
      ecrireAppr(id, periode, { niveaux: {}, texte: '' });
      return dessinerCarte(id);
    }
    if (b.dataset.apprNiveau) {
      if (!(await garderTexteManuel(id))) return;
      // 1 → 2 → 3 → 4 → non mentionné → 1…
      const k = b.dataset.apprNiveau;
      const actuel = appreciationEleve(el, periode, ctx.eleves, r).propose.niveaux[k] || 0;
      const suivant = actuel >= 4 ? 0 : actuel + 1;
      const enreg = Donnees.get('suivis', idAppr(id, periode));
      const a = analyserAppr(el, periode, ctx.eleves);
      const niveaux = persoUtileAppr(r, a, enreg?.niveaux);
      // Revenir au niveau calculé par l'appli efface le choix.
      if (suivant === (a.niveaux[k] || 0)) delete niveaux[k]; else niveaux[k] = suivant;
      ecrireAppr(id, periode, { niveaux, texte: '' });
      dessinerCarte(id);
      d.querySelector(`[data-appr-eleve="${id}"] [data-appr-niveau="${k}"]`)?.focus();
    }
  }));
  d.addEventListener('input', e => {
    if (!e.target.matches('[data-appr-texte]')) return;
    const carte = e.target.closest('[data-appr-eleve]'), n = e.target.value.trim().length, r = ctx.r();
    const compte = $('[data-appr-compte]', carte);
    compte.textContent = `${n} / ${r.longueur} caractères`;
    compte.classList.toggle('trop', n > r.longueur);
    enAttente = { eleve: carte.dataset.apprEleve, per: ctx.periode(), texte: e.target.value.trim() };
    clearTimeout(minuteur);
    minuteur = setTimeout(() => {
      enregistrerTexte();
      // Relecture du texte tapé (une fois la frappe arrêtée)
      const el = Donnees.get('eleves', carte.dataset.apprEleve), zone = $('[data-appr-relecture]', carte);
      if (el && zone) zone.innerHTML = htmlRelectureAppr(e.target.value, el, prenomsAutresAppr(el, ctx.eleves), true);
    }, 800);
  });
  return { enregistrerTexte, dessinerCarte };
}
