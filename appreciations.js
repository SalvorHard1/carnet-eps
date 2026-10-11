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

/* ---------- Réglages ---------- */

function reglageAppr() {
  const r = reglage('appreciations');
  // Rubriques : toutes présentes une fois, dans l'ordre choisi (les inconnues sont retirées).
  r.ordre = [...new Set([...r.ordre.filter(k => RUBRIQUES_APPR[k]), ...Object.keys(RUBRIQUES_APPR)])];
  r.actives = r.actives.filter(k => RUBRIQUES_APPR[k]);
  if (!TONS_APPR[r.ton]) r.ton = 'bienveillant';
  if (!STYLES_APPR[r.style]) r.style = 'phrases';
  r.longueur = Math.max(80, Math.min(2000, +r.longueur || 400));
  return r;
}

function htmlReglageAppr(r) {
  return `
    <p class="aide">Coche les rubriques à aborder, et range-les dans l’ordre voulu (↑ ↓). Si la place manque,
      les dernières rubriques sont laissées de côté (l’objectif est gardé jusqu’au bout).</p>
    <ol class="rubriques-appr">${r.ordre.map((k, i) => `<li>
      <label class="case"><input type="checkbox" name="appr-${k}" ${r.actives.includes(k) ? 'checked' : ''}>
        <b>${RUBRIQUES_APPR[k].nom}</b> <span class="aide">${RUBRIQUES_APPR[k].aide}</span></label>
      <span class="espace"></span>
      <button type="button" class="icone-petit" data-appr-monter="${k}" ${i ? '' : 'disabled'} aria-label="Monter ${RUBRIQUES_APPR[k].nom}">↑</button>
      <button type="button" class="icone-petit" data-appr-descendre="${k}" ${i < r.ordre.length - 1 ? '' : 'disabled'} aria-label="Descendre ${RUBRIQUES_APPR[k].nom}">↓</button>
      <input type="hidden" name="appr-ordre" value="${k}"></li>`).join('')}</ol>
    <label class="case"><input type="checkbox" name="appr-bilan" ${r.bilan ? 'checked' : ''}> Commencer par un bilan général (« Bon trimestre. »)</label>
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
    longueur: Math.max(80, Math.min(2000, +form.elements['appr-longueur']?.value || 400)),
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
      'n\'essaie pas', 'ne fait rien', 'ne participe pas', 'refuse de', 'oubli de tenue', 'sans tenue', 'pas de tenue', 'tenue oubliee', 'nonchalant', 'traine', 'baisse les bras'],
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
const RE_METHODO = /role|arbitr|juge|jury|coach|observ|chronom|secretaire|entrain|programme|planifi|echauff|preparation|projet|securite|assurage|filmer|mesurer|organis|analys|methode/;
const RE_COMPORTEMENT = /respect|solidaire|accepter le resultat|accepter de se produire|comportement|fair|citoyen/;
const RE_ATTITUDE = /attitude|engagement|investissement|implication|motivation|participation/;
const categorieAppr = texte => {
  const t = sansAccent(texte);
  return RE_ATTITUDE.test(t) ? 'attitude' : RE_COMPORTEMENT.test(t) ? 'comportement' : RE_METHODO.test(t) ? 'methodo' : 'moteur';
};

const moyenneListe = l => (l.length ? l.reduce((a, b) => a + b, 0) / l.length : null);
const niveauDegre = x => (x === null ? null : x >= 3.5 ? 4 : x >= 2.75 ? 3 : x >= 2 ? 2 : 1);
const fmtD = x => fmt(Math.round(x * 10) / 10);

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
  for (const e of evals) if (Donnees.note(e.id, el.id) === 'ABS') absNotes++;
  // Moyenne par APSA (pour citer la meilleure ou la plus fragile)
  const parApsa = new Map();
  for (const e of evals) { const a = (e.apsa || '').trim(); if (a) parApsa.set(a, [...(parApsa.get(a) || []), e]); }
  const moyApsa = [...parApsa].map(([a, l]) => ({ a, m: moyenneEleve(el.id, l) })).filter(x => x.m !== null);

  // Degrés de maîtrise des évaluations : dernier degré de chaque compétence, et son évolution.
  const comps = new Map();
  for (const e of evals) for (const a of competencesEval(e)) {
    const v = Donnees.note(e.id, el.id, a.id);
    if (!v) continue;
    if (!comps.has(a.id)) comps.set(a.id, { a, valeurs: [] });
    comps.get(a.id).valeurs.push(+v);
  }
  const faibles = [];
  for (const { a, valeurs } of comps.values()) {
    const der = valeurs.at(-1);
    degres.competences.push(der);
    degres[categorieAppr(a.texte)].push(der);
    if (valeurs.length > 1) { if (der > valeurs[0]) mieux++; else if (der < valeurs[0]) pire++; }
    if (der < 3) faibles.push({ texte: a.texte, cat: categorieAppr(a.texte), v: der });
  }

  // Leçons : présence, données relevées (échelles 1 à 4, performances), observations écrites.
  let presences = 0, abs = 0;
  const observations = [];
  const parIndic = new Map();
  for (const s of seances) {
    const st = statutEnt(s.id, el.id);
    if (st) { if (st === 'ABS') abs++; continue; }
    presences++;
    for (const ind of s.indicateurs || []) {
      const v = valeurCase(s.id, el.id, ind.id);
      if (!v) continue;
      if (ind.type === 'texte') { observations.push(v); continue; }
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
      if (der < 3) faibles.push({ texte: ind.etape ? texteIndic(ind) : ind.nom, cat, v: der, indic: !ind.etape });
    }
    const sens = sensProgres(ind);
    if (sens && valeurs.length > 1 && ind.type !== 'choix') {
      const a = valeurComparable(ind, valeurs[0]), b = valeurComparable(ind, valeurs.at(-1));
      if (a !== null && b !== null && a !== b) { if ((b - a) * sens > 0) mieux++; else pire++; }
    }
  }
  // Observations du prof : celles des leçons de la période, et ses fiches (modifiées pendant la période).
  for (const s of Donnees.liste('suivis', x => x.eleveId === el.id && x.texte && !estSuiviAppr(x))) {
    if (periode === 'annee' || !s.maj || periodeDe(new Date(s.maj).toLocaleDateString('sv')) === periode) observations.push(s.texte);
  }

  // Motricité : moyenne de la période (seuils note → degré de la classe), sinon degrés « moteurs ».
  const seuils = seuilsClasse(c);
  if (moy !== null) {
    niveaux.moteur = moy >= seuils[2] ? 4 : moy >= seuils[1] ? 3 : moy >= seuils[0] ? 2 : 1;
    sources.moteur = `Moyenne ${fmtD(moy)}/20 (seuils de la classe : ${seuils.map(fmt).join(' / ')})`;
  } else if (degres.moteur.length) {
    const m = moyenneListe(degres.moteur);
    niveaux.moteur = niveauDegre(m);
    sources.moteur = `Pas de note : moyenne des degrés « moteurs » ${fmtD(m)}`;
  }
  if (moyApsa.length > 1) {
    const tri = [...moyApsa].sort((x, y) => y.m - x.m);
    details.apsaForte = tri[0].a; details.apsaFaible = tri.at(-1).a;
  } else {
    const apsas = [...new Set([...evals.map(e => (e.apsa || '').trim()), ...seances.map(s => (s.apsa || '').trim())].filter(Boolean))];
    if (apsas.length === 1) details.apsaSeule = apsas[0];
  }

  // Compétences : moyenne des derniers degrés relevés (évaluations et leçons).
  if (degres.competences.length) {
    const m = moyenneListe(degres.competences);
    niveaux.competences = niveauDegre(m);
    const validees = degres.competences.filter(v => v >= 3).length;
    sources.competences = `${validees}/${degres.competences.length} au degré 3 ou 4 · degré moyen ${fmtD(m)}`;
  }

  // Méthodologie : rôles, organisation, sécurité (compétences et données de leçon de ce type).
  if (degres.methodo.length) {
    const m = moyenneListe(degres.methodo);
    niveaux.methodo = niveauDegre(m);
    sources.methodo = `Degré moyen ${fmtD(m)} sur ${degres.methodo.length} critère${degres.methodo.length > 1 ? 's' : ''} (rôles, organisation, sécurité)`;
  }

  // Attitude : critère « attitude / engagement » relevé en leçon, présence, mots-clés des observations.
  {
    const mots = motsCles(observations, MOTS_APPR.attitude), morceaux = [];
    let n = null;
    if (degres.attitude.length) { n = niveauDegre(moyenneListe(degres.attitude)); morceaux.push(`critère engagement : degré ${fmtD(moyenneListe(degres.attitude))}`); }
    const total = presences + abs;
    if (total) {
      const taux = presences / total;
      morceaux.push(`${Math.round(taux * 100)} % de présence aux leçons`);
      if (n === null) n = 3;
      // (Seules les absences comptent, pas les blessures ni les maladies ; une absence isolée ne suffit pas.)
      if (abs >= 3 || (abs >= 2 && taux < 0.8)) n = Math.min(n, 2);
    }
    if (absNotes) morceaux.push(`${absNotes} absence${absNotes > 1 ? 's' : ''} à une évaluation`);
    // Blessé / malade : signalé pour mémoire, sans baisser le niveau (ce n'est pas un manque d'engagement).
    const sante = typeof bilanLecons === 'function' ? bilanLecons(el, periode).sante : 0;
    const santeNotes = evals.filter(e => ['BLE', 'MAL'].includes(Donnees.note(e.id, el.id))).length;
    if (sante + santeNotes) morceaux.push(`blessé / malade : ${sante + santeNotes} fois (leçons et évaluations), sans effet sur ce niveau`);
    if (mots.plus || mots.moins) {
      morceaux.push('observations : ' + mots.trouves.join(', '));
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
      morceaux.push('observations : ' + mots.trouves.join(', '));
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
      const notes = evals.map(e => sur20(e, Donnees.note(e.id, el.id))).filter(n => n !== null);
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
    4: { p: ['{S} s’investit pleinement dans toutes les activités.', '{S} fait preuve d’un engagement exemplaire en cours.', '{S} montre un investissement remarquable et constant.'],
      t: ['Investissement exemplaire.', 'Engagement remarquable.'] },
    3: { p: ['{S} s’investit avec sérieux en cours.', '{S} montre un engagement régulier.', '{S} participe avec envie aux activités proposées.'],
      t: ['Investissement sérieux.', 'Bon engagement en cours.'] },
    2: { p: { b: ['{S} doit gagner en régularité dans son engagement.', '{S} s’investit, mais de façon encore irrégulière.'],
      n: ['{S} s’investit de manière irrégulière.', 'L’engagement en cours reste irrégulier.'],
      x: ['{S} doit s’investir davantage en cours.', '{S} manque trop souvent d’engagement.'] },
    t: { b: ['Engagement à rendre plus régulier.'], n: ['Engagement irrégulier.'], x: ['Manque d’investissement.'] } },
    1: { p: { b: ['{S} doit trouver davantage d’envie pour s’engager en cours.', '{S} a du mal à s’engager : il faut s’accrocher.'],
      n: ['{S} s’investit trop peu en cours.'],
      x: ['L’investissement est très insuffisant.', '{S} ne s’investit pas suffisamment en cours.'] },
    t: { b: ['Engagement à retrouver.'], n: ['Investissement trop faible.'], x: ['Investissement très insuffisant.'] } },
  },
  competences: {
    4: { p: ['{S} maîtrise très bien les compétences travaillées.', 'Les compétences visées sont très bien maîtrisées.'], t: ['Compétences très bien maîtrisées.'] },
    3: { p: ['{S} maîtrise de façon satisfaisante les compétences travaillées.', 'Les compétences visées sont globalement acquises.'], t: ['Compétences acquises.', 'Bonne maîtrise des compétences.'] },
    2: { p: { b: ['Les compétences sont en cours d’acquisition, à consolider.', '{S} est en bonne voie dans l’acquisition des compétences.'],
      n: ['La maîtrise des compétences reste fragile.'], x: ['La maîtrise des compétences est encore trop fragile.'] },
    t: { b: ['Compétences en cours d’acquisition.'], n: ['Compétences fragiles.'], x: ['Compétences insuffisamment maîtrisées.'] } },
    1: { p: { b: ['Les compétences visées ne sont pas encore acquises : il faut persévérer.'], n: ['La maîtrise des compétences est insuffisante.'],
      x: ['Les compétences visées ne sont pas maîtrisées.'] },
    t: { b: ['Compétences pas encore acquises.'], n: ['Compétences non acquises.'], x: ['Compétences non maîtrisées.'] } },
  },
  moteur: {
    4: { p: ['{S} réalise de très bonnes performances{apsa}.', '{S} dispose de très bonnes qualités motrices{apsa}.'], t: ['Très bonnes qualités motrices{apsa}.', 'Très bons résultats{apsa}.'] },
    3: { p: ['{S} obtient de bons résultats{apsa}.', '{S} montre de bonnes capacités motrices{apsa}.'], t: ['Bons résultats{apsa}.', 'Bonnes capacités motrices{apsa}.'] },
    2: { p: { b: ['{S} obtient des résultats encore justes{apsa}, qui peuvent progresser.'], n: ['{S} obtient des résultats moyens{apsa}.'],
      x: ['Les résultats{apsa} sont insuffisants au regard des possibilités de {P}.'] },
    t: { b: ['Résultats à consolider{apsa}.'], n: ['Résultats moyens{apsa}.'], x: ['Résultats insuffisants{apsa}.'] } },
    1: { p: { b: ['{S} rencontre des difficultés{apsa}, mais peut progresser avec de la persévérance.'], n: ['{S} rencontre des difficultés{apsa}.'],
      x: ['Les résultats{apsa} sont très insuffisants.'] },
    t: { b: ['Difficultés motrices à surmonter{apsa}.'], n: ['Difficultés motrices{apsa}.'], x: ['Résultats très insuffisants{apsa}.'] } },
  },
  methodo: {
    4: { p: ['{S} assume avec beaucoup de sérieux les rôles confiés (arbitre, juge, observateur).', '{S} fait preuve d’une excellente méthode de travail.'],
      t: ['Rôles très bien assumés.', 'Excellente méthode de travail.'] },
    3: { p: ['{S} tient correctement les rôles confiés et s’organise bien.', '{S} travaille avec méthode.'], t: ['Rôles bien assumés.', 'Travail méthodique.'] },
    2: { p: { b: ['{S} doit encore gagner en rigueur dans les rôles et l’organisation.'], n: ['La méthode de travail et la tenue des rôles restent à améliorer.'],
      x: ['{S} manque de rigueur dans les rôles et l’organisation.'] },
    t: { b: ['Rigueur à développer dans les rôles.'], n: ['Méthode à améliorer.'], x: ['Manque de rigueur.'] } },
    1: { p: { b: ['{S} a besoin d’aide pour s’organiser et tenir les rôles confiés.'], n: ['{S} peine à s’organiser et à tenir les rôles confiés.'],
      x: ['Les rôles confiés ne sont pas assumés.'] },
    t: { b: ['Organisation à construire.'], n: ['Rôles peu assumés.'], x: ['Rôles non assumés.'] } },
  },
  comportement: {
    4: { p: ['{S} a un comportement exemplaire, respectueux de tous.', 'Le comportement est exemplaire envers les camarades comme envers l’adulte.'], t: ['Comportement exemplaire.'] },
    3: { p: ['{S} a un comportement correct et respectueux.', '{S} respecte les règles et ses camarades.'], t: ['Comportement correct.', 'Attitude respectueuse.'] },
    2: { p: { b: ['{S} doit veiller à mieux respecter les consignes.'], n: ['Le comportement est parfois à reprendre.'], x: ['{S} doit impérativement mieux respecter les consignes.'] },
      t: { b: ['Respect des consignes à améliorer.'], n: ['Comportement parfois à reprendre.'], x: ['Comportement à corriger.'] } },
    1: { p: { b: ['Le comportement doit s’améliorer pour progresser sereinement.'], n: ['Le comportement pose problème en cours.'],
      x: ['Le comportement est inacceptable et nuit au travail de la classe.'] },
    t: { b: ['Comportement à améliorer nettement.'], n: ['Comportement problématique.'], x: ['Comportement inacceptable.'] } },
  },
  progression: {
    4: { p: ['{S} a nettement progressé {ce}.', 'Les progrès de {P} sont remarquables {ce}.'], t: ['Très nets progrès.'] },
    3: { p: ['{S} est en progrès {ce}.', 'Les progrès sont réguliers et encourageants.'], t: ['En progrès.', 'Progrès encourageants.'] },
    2: { p: { b: ['Les résultats sont stables : {s} peut encore progresser.'], n: ['Les résultats sont stables.'], x: ['Les résultats stagnent.'] },
      t: { b: ['Résultats stables.'], n: ['Résultats stables.'], x: ['Résultats qui stagnent.'] } },
    1: { p: { b: ['Les résultats sont en baisse {ce} : il faut se ressaisir.'], n: ['Les résultats sont en baisse {ce}.'], x: ['Les résultats sont en net recul {ce}.'] },
      t: { b: ['Résultats en baisse : se ressaisir.'], n: ['Résultats en baisse.'], x: ['Net recul des résultats.'] } },
  },
};
// Progression « stable » d'un élève qui a déjà un bon niveau : on le dit autrement.
const STABLE_BON_APPR = { p: ['{S} maintient son bon niveau.', 'Les résultats restent d’un bon niveau.'], t: ['Bon niveau maintenu.'] };

const BILANS_APPR = {
  periode: { 4: ['Excellent {per}.', 'Très bon {per}.'], 3: ['Bon {per}.', '{Per} satisfaisant.'],
    2: { b: ['{Per} encourageant, mais encore inégal.'], n: ['{Per} inégal.', '{Per} moyen.'], x: ['{Per} trop juste.'] },
    1: { b: ['{Per} difficile.'], n: ['{Per} difficile.', '{Per} décevant.'], x: ['{Per} très insuffisant.'] } },
  annee: { 4: ['Excellent bilan sur l’année.', 'Très bonne année.'], 3: ['Bon bilan sur l’année.', 'Année satisfaisante.'],
    2: { b: ['Bilan annuel encourageant, mais inégal.'], n: ['Bilan annuel mitigé.'], x: ['Bilan annuel trop juste.'] },
    1: { b: ['Année difficile.'], n: ['Année difficile.'], x: ['Bilan annuel très insuffisant.'] } },
};

// Objectifs (verbe à l'infinitif), selon la rubrique la plus faible.
const OBJECTIFS_APPR = {
  attitude: ['s’investir plus régulièrement', 'trouver davantage d’envie et d’engagement'],
  absences: ['gagner en assiduité'],
  comportement: ['mieux respecter les consignes et les camarades'],
  methodo: ['s’impliquer davantage dans les rôles (arbitre, juge, observateur)', 'gagner en rigueur et en méthode'],
  securite: ['respecter et faire respecter les règles de sécurité'],
  moteur: ['gagner en efficacité motrice', 'persévérer pour améliorer ses performances'],
  competences: ['consolider les compétences travaillées'],
  progression: ['se remobiliser pour retrouver son meilleur niveau'],
  regularite: ['retrouver de la régularité dans ses résultats'],
  haut: ['conserver cette belle dynamique', 'viser l’excellence', 'garder ce niveau d’investissement'],
};

// Petit hasard reproductible : la même graine donne toujours la même formulation.
function hasardAppr(texte) {
  let h = 2166136261;
  for (const ch of texte) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return (h >>> 0) / 4294967296;
}
const choisirAppr = (liste, graine) => liste[Math.floor(hasardAppr(graine) * liste.length)];
const selonTon = (x, ton) => (Array.isArray(x) ? x : x[ton[0] === 'b' ? 'b' : ton[0] === 'e' ? 'x' : 'n']);

function objectifAppr(niv, a, actives) {
  const notes = actives.filter(k => niv[k] && k !== 'objectif');
  // (Une progression « stable » n'est pas une faiblesse.)
  const poids = k => (k === 'progression' && niv[k] === 2 ? 3 : niv[k]);
  const pire = notes.length ? Math.min(...notes.map(poids)) : 3;
  if (pire >= 3 && !(a.details.absences >= 3)) return { cle: 'haut' };
  if (a.details.absences >= 3 && (niv.attitude || 3) <= 2) return { cle: 'absences' };
  const k = notes.find(x => poids(x) === pire) || 'competences';
  // Seule la progression faiblit, chez un élève par ailleurs solide : on parle de régularité.
  if (k === 'progression' && notes.filter(x => x !== 'progression').every(x => niv[x] >= 3)) return { cle: 'regularite' };
  if (k === 'competences' || k === 'moteur' || k === 'methodo') {
    // Un critère précis relevé en leçon (« Choix tactiques », « Arbitrage »…) donne un objectif concret.
    const f = a.details.faibles.find(x => x.indic && (k === 'competences' || x.cat === k));
    if (f && f.texte.length <= 40) return { texte: `progresser sur « ${f.texte} »` };
    const g = a.details.faibles.find(x => k === 'competences' || x.cat === k);
    if (g && /securite|assurage/.test(sansAccent(g.texte))) return { cle: 'securite' };
  }
  return { cle: k };
}

function redigerAppr(el, periode, a, niveauxPerso, r, graine = 0) {
  const niv = { ...a.niveaux };
  for (const [k, v] of Object.entries(niveauxPerso || {})) niv[k] = v || null; // 0 = ne pas en parler
  const ton = r.ton, tele = r.style === 'telegraphique';
  const sexe = ['F', 'G'].includes(el.sexe) ? el.sexe : '';
  const prenom = (el.prenom || '').trim() || el.nom;
  let dejaNomme = false;
  const sujet = maj => {
    if (!dejaNomme || !sexe) { dejaNomme = true; return prenom; }
    return sexe === 'F' ? (maj ? 'Elle' : 'elle') : (maj ? 'Il' : 'il');
  };
  const p = periodesAnnee().find(x => x.id === periode);
  const per = periode === 'annee' ? 'année' : p?.code?.startsWith('S') ? 'semestre' : 'trimestre';
  const ce = periode === 'annee' ? 'cette année' : `ce ${per}`;
  const minuscule = s => s[0].toLocaleLowerCase('fr') + s.slice(1);
  const apsaTexte = k => {
    const d = a.details;
    if (d.apsaSeule) return ' en ' + minuscule(d.apsaSeule);
    if (k >= 3 && d.apsaForte) return ', notamment en ' + minuscule(d.apsaForte);
    if (k <= 2 && d.apsaFaible) return ', notamment en ' + minuscule(d.apsaFaible);
    return '';
  };
  const remplir = (modele, k) => modele
    .replace(/\{S\}/g, () => sujet(true)).replace(/\{s\}/g, () => sujet(false)).replace(/\{P\}/g, prenom)
    .replace(/\{apsa\}/g, apsaTexte(k)).replace(/\{ce\}/g, ce).replace(/\{Per\}/g, per[0].toUpperCase() + per.slice(1)).replace(/\{per\}/g, per);
  const g = cle => `${el.id}|${periode}|${graine}|${cle}`;
  const actives = r.ordre.filter(k => r.actives.includes(k));

  // court = true : la phrase la plus courte de chaque liste (essayé avant de laisser des rubriques de côté).
  const construire = (court, exclues = []) => {
    dejaNomme = false;
    const choisir = (tout, graine) => {
      // Sans il / elle (sexe non renseigné), le prénom se répéterait : on préfère alors les phrases sans sujet.
      const sansSujet = dejaNomme && !sexe ? tout.filter(x => !/\{[Ss]\}/.test(x)) : [];
      const liste = sansSujet.length ? sansSujet : tout;
      return court ? liste.reduce((x, y) => (y.length < x.length ? y : x)) : choisirAppr(liste, graine);
    };
    const morceaux = []; // { cle, texte }
    if (r.bilan && !exclues.includes('bilan')) {
      const base = ['moteur', 'competences', 'attitude'].map(k => niv[k]).filter(Boolean);
      if (base.length) {
        const k = Math.max(1, Math.min(4, Math.round(moyenneListe(base))));
        morceaux.push({ cle: 'bilan', texte: remplir(choisir(selonTon(BILANS_APPR[periode === 'annee' ? 'annee' : 'periode'][k], ton), g('bilan')), k) });
      }
    }
    for (const k of actives) {
      if (k === 'objectif' || exclues.includes(k)) continue;
      const n = niv[k];
      if (!n) continue;
      let banque = PHRASES_APPR[k][n];
      if (k === 'progression' && n === 2 && (niv.moteur || 0) >= 3) banque = STABLE_BON_APPR;
      // Importance (pour le manque de place) : niveau par défaut < « stable » < satisfaisant < fragile < extrêmes (1 et 4).
      const importance = a.defaut[k] && !(k in (niveauxPerso || {})) ? 0 : k === 'progression' && n === 2 ? 1 : n === 3 ? 2 : n === 2 ? 3 : 4;
      morceaux.push({ cle: k, importance, texte: remplir(choisir(selonTon(tele ? banque.t : banque.p, ton), g(k)), n) });
    }
    if (actives.includes('objectif') && niv.objectif !== null) {
      const o = objectifAppr(niv, a, actives);
      const but = o.texte || choisir(OBJECTIFS_APPR[o.cle], g('but'));
      const modeles = tele ? (o.cle === 'haut' ? ['Objectif : {but}.'] : ['Objectif : {but}.', 'À travailler : {but}.'])
        : o.cle === 'haut' ? (ton === 'bienveillant' ? ['Bravo ! Il faut maintenant {but}.', 'Bravo, il faut {but} !'] : ['Il faut maintenant {but}.', 'Objectif : {but}.'])
          : ton === 'exigeant' ? ['{S} doit maintenant {but}.', 'Il faut impérativement {but}.']
            : ton === 'bienveillant' ? ['Objectif pour la suite : {but}. Courage !', 'Pour progresser, il faudra {but}. Courage !'] : ['Objectif : {but}.', 'Il faut maintenant {but}.'];
      let t = remplir(choisir(modeles, g('objectif')), 0).replace('{but}', but);
      t = t[0].toUpperCase() + t.slice(1);
      morceaux.push({ cle: 'objectif', texte: t });
    }
    return morceaux;
  };

  // Longueur : phrases les plus courtes, puis on retire les dernières rubriques (avant l'objectif), puis le bilan.
  let morceaux = construire(false);
  const retirees = [];
  const longueur = () => morceaux.map(m => m.texte).join(' ').length;
  if (longueur() > r.longueur) morceaux = construire(true);
  // Le moins important d'abord (à importance égale, le plus loin dans l'ordre) ; le texte est refait à chaque
  // retrait, pour que le prénom soit toujours cité avant « il / elle ».
  while (longueur() > r.longueur && morceaux.length > 1) {
    const rubriques = morceaux.filter(m => m.cle !== 'objectif' && m.cle !== 'bilan');
    const moindre = rubriques.length ? Math.min(...rubriques.map(m => m.importance)) : null;
    const cle = moindre !== null ? rubriques.findLast(m => m.importance === moindre).cle : morceaux.find(m => m.cle === 'bilan')?.cle;
    if (!cle) break;
    retirees.push(cle);
    morceaux = construire(true, retirees);
  }
  return { texte: morceaux.map(m => m.texte).join(' '), niveaux: niv, retirees };
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

function htmlCarteAppr(el, periode, eleves, r) {
  const { analyse, propose, texte, manuel, enreg } = appreciationEleve(el, periode, eleves, r);
  const perso = enreg?.niveaux || {};
  const puces = r.ordre.filter(k => r.actives.includes(k) && k !== 'objectif').map(k => {
    const n = propose.niveaux[k] || 0, change = k in perso;
    const noms = k === 'progression' ? NOMS_NIV_PROG : NOMS_NIV_APPR;
    const source = change ? `Choisi par toi (calculé : ${analyse.niveaux[k] ? noms[analyse.niveaux[k]] : 'pas de donnée'})` : analyse.sources[k] || 'Pas de donnée : non mentionné';
    return `<button type="button" class="puce-appr n${n}${change ? ' change' : ''}${!change && analyse.defaut[k] ? ' defaut' : ''}" data-appr-niveau="${k}"
      title="${esc(source + '\n(toucher pour changer)')}">${RUBRIQUES_APPR[k].nom} <b>${n || '–'}</b><small>${esc(noms[n])}</small></button>`;
  }).join('');
  const retirees = propose.retirees.length && !manuel
    ? `<span class="aide">Faute de place, laissé de côté : ${propose.retirees.map(k => k === 'bilan' ? 'bilan' : RUBRIQUES_APPR[k].nom.toLowerCase()).join(', ')}.</span>` : '';
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
    <p class="aide">L’appli propose une appréciation pour chaque élève à partir de ton carnet : notes, degrés de maîtrise, leçons
      (présence, données relevées) et mots-clés de tes observations. Touche une rubrique pour changer son niveau ;
      tu peux aussi réécrire le texte. Tout reste dans ton carnet (chiffré sur la clé).</p>
    <div class="fiche-onglets" data-appr-periodes></div>
    <details class="reglages-appr"><summary>⚙ Réglages des appréciations <small>rubriques, ton, style, longueur</small></summary>
      <div data-appr-reglages>${htmlReglageAppr(r)}</div></details>
    <div data-appr-liste></div>`,
  '<button type="button" data-appr-tout title="Copie « NOM Prénom [tab] appréciation », une ligne par élève (se colle aussi dans Excel)">📋 Copier toutes</button>'
    + '<span class="espace"></span><button type="button" data-fermer class="primaire">Fermer</button>', 'modale-large modale-appr');
  const form = $('form', d);

  const dessinerCarte = id => {
    const carte = d.querySelector(`[data-appr-eleve="${id}"]`);
    if (carte) carte.outerHTML = htmlCarteAppr(Donnees.get('eleves', id), periode, eleves, r);
  };
  const dessiner = () => {
    $('[data-appr-periodes]', d).innerHTML = [...periodes.map(p => [p.id, p.code]), ['annee', 'Toute l’année']]
      .map(([v, nom]) => `<button type="button" class="${v === periode ? 'actif' : ''}" data-appr-periode="${v}">${nom}</button>`).join('');
    const evals = evalsPeriode(c.id, periode), seances = seancesPeriode(c.id, periode);
    $('[data-appr-liste]', d).innerHTML = (evals.length || seances.length ? ''
      : `<p class="aide">⚠ Aucune évaluation ni leçon sur cette période : les propositions ne s’appuient que sur tes observations.</p>`)
      + eleves.map(el => htmlCarteAppr(el, periode, eleves, r)).join('');
  };

  // Texte réécrit à la main : enregistré pendant la frappe (petit délai).
  let minuteur = null, enAttente = null;
  const enregistrerTexte = () => {
    clearTimeout(minuteur);
    if (!enAttente) return;
    const { eleve, per, texte } = enAttente;
    enAttente = null;
    const el = Donnees.get('eleves', eleve);
    const propose = appreciationEleve(el, per, eleves, r).propose.texte;
    ecrireAppr(eleve, per, { texte: texte === propose ? '' : texte });
  };
  const reglagesModifies = () => {
    r = { ...reglageAppr(), ...lireReglageAppr(form) };
    ecrireReglage('appreciations', lireReglageAppr(form));
    enregistrerTexte();
    dessiner();
  };
  // Changer un niveau ou la formulation remplace le texte proposé ; un texte réécrit à la main est d'abord confirmé.
  const garderTexteManuel = async id => {
    const enreg = Donnees.get('suivis', idAppr(id, periode));
    if (!enreg?.texte) return true;
    return confirmer('Tu as réécrit cette appréciation à la main. La remplacer par une nouvelle proposition ?', 'Remplacer');
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
    const carte = b.closest('[data-appr-eleve]');
    if (!carte) return;
    const id = carte.dataset.apprEleve, el = Donnees.get('eleves', id);
    enregistrerTexte();
    if (b.matches('[data-appr-copier]')) return copierTexte($('[data-appr-texte]', carte).value.trim());
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
      const actuel = appreciationEleve(el, periode, eleves, r).propose.niveaux[k] || 0;
      const suivant = actuel >= 4 ? 0 : actuel + 1;
      const enreg = Donnees.get('suivis', idAppr(id, periode));
      const niveaux = { ...(enreg?.niveaux || {}) };
      if (suivant === (analyserAppr(el, periode, eleves).niveaux[k] || 0)) delete niveaux[k]; else niveaux[k] = suivant;
      ecrireAppr(id, periode, { niveaux, texte: '' });
      dessinerCarte(id);
      d.querySelector(`[data-appr-eleve="${id}"] [data-appr-niveau="${k}"]`)?.focus();
    }
  }));
  d.addEventListener('input', e => {
    if (e.target.matches('[data-appr-texte]')) {
      const carte = e.target.closest('[data-appr-eleve]'), n = e.target.value.trim().length;
      const compte = $('[data-appr-compte]', carte);
      compte.textContent = `${n} / ${r.longueur} caractères`;
      compte.classList.toggle('trop', n > r.longueur);
      enAttente = { eleve: carte.dataset.apprEleve, per: periode, texte: e.target.value.trim() };
      clearTimeout(minuteur);
      minuteur = setTimeout(enregistrerTexte, 800);
    }
  });
  // Réglages : redessinés sur les cases et listes ; la longueur quand on quitte le champ.
  d.addEventListener('change', e => { if (e.target.closest('[data-appr-reglages]')) reglagesModifies(); });

  dessiner();
  if (eleveVise) d.querySelector(`[data-appr-eleve="${eleveVise}"]`)?.scrollIntoView({ block: 'center' });
  await resultat;
  enregistrerTexte();
  rendre();
}

// Bloc de la fiche élève des Notes : l'appréciation de la période affichée.
function htmlApprFiche(el, periode, eleves) {
  const { texte, manuel } = appreciationEleve(el, periode, eleves);
  if (!texte) return '';
  return `<h3>Appréciation ${manuel ? '<span class="badge-appr">modifiée à la main</span>' : '<span class="aide">proposée par l’appli</span>'}</h3>
    <p class="texte-appr-fiche">${esc(texte)}</p>
    <div class="actions-appr-fiche"><button type="button" data-fiche-appr-copier>📋 Copier</button>
      <button type="button" data-fiche-appr-ajuster>✍ Ajuster les niveaux…</button></div>`;
}
