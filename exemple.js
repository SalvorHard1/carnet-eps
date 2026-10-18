'use strict';
// Classe exemple : une classe de 3e entièrement inventée (élèves, appels, leçons, évaluations, observations, agenda),
// pour voir à quoi ressemble un carnet rempli. Proposée au premier lancement, et dans « + Nouvelle classe ».
// Identifiants fixes (« exemple-… ») : recréée sur un autre appareil, elle ne se dédouble pas lors de la fusion par la clé.
// Les appréciations ne sont pas écrites ici : c'est l'appli qui les propose, à partir de ces données.
// (Fichier chargé avant app.js : il n'utilise les outils d'app.js qu'au moment des appels.)

const ID_CLASSE_EXEMPLE = 'exemple-classe';
const classeExemple = () => Donnees.get('classes', ID_CLASSE_EXEMPLE);

// [nom, prénom, sexe, niveau sur 20, particularités]
const ELEVES_EXEMPLE = [
  ['ARNAUD', 'Chloé', 'F', 16], ['BARON', 'Lucas', 'G', 11], ['BLANC', 'Inès', 'F', 13],
  ['CARON', 'Nathan', 'G', 10, { bavard: true }], ['CHEVALIER', 'Manon', 'F', 17], ['COLIN', 'Théo', 'G', 14],
  ['DUMAS', 'Jade', 'F', 12, { pai: true, paiInfo: 'Asthme à l’effort. Ventoline dans son sac (poche avant). Échauffement progressif ; s’arrêter dès la gêne respiratoire.' }],
  ['FAURE', 'Enzo', 'G', 15], ['FONTAINE', 'Louise', 'F', 10],
  ['GAUTHIER', 'Maël', 'G', 13, { bep: true, bepInfo: 'Dyslexie (PAP). Consignes orales et courtes, schémas au tableau ; vérifier qu’il a compris.' }],
  ['GIRARD', 'Emma', 'F', 18], ['GUERIN', 'Noah', 'G', 9, { tenue: true }], ['HENRY', 'Lina', 'F', 14],
  ['LACROIX', 'Tom', 'G', 16], ['LEMAIRE', 'Zoé', 'F', 11], ['MARCHAND', 'Sacha', 'G', 12, { dispense: true }],
  ['MEUNIER', 'Rose', 'F', 15], ['MOREL', 'Adam', 'G', 13], ['NICOLAS', 'Alice', 'F', 9, { passive: true }],
  ['PERRIN', 'Gabin', 'G', 17], ['ROCHE', 'Camille', 'F', 13],
  ['ROUSSEL', 'Jules', 'G', 11, { adapte: true, adaptation: 'Genou fragile : pas de sauts répétés ni de réceptions. Course limitée à 10 min. Peut chronométrer et arbitrer.' }],
  ['VIDAL', 'Anna', 'F', 14], ['MOULIN', 'Léo', 'G', 12],
];

// Hasard « reproductible » : la classe exemple est toujours la même.
function hasardExemple(graine) {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 12 leçons : les derniers mardis avant aujourd'hui (depuis la rentrée), ou mardis et jeudis en début d'année
// (au tout début de l'année, les dernières leçons tombent dans les jours qui viennent).
function datesExemple(n = 12) {
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const auj = aujourdhui(), annee = +auj.slice(0, 4) - (+auj.slice(5, 7) < 8 ? 1 : 0);
  const rentree = new Date(annee, 8, 1, 12), fin = new Date(auj + 'T12:00');
  const jours = (garder, jusqua) => {
    const res = [];
    for (const d = new Date(rentree); d <= jusqua; d.setDate(d.getDate() + 1)) if (garder(d.getDay())) res.push(iso(d));
    return res;
  };
  const mardis = jours(j => j === 2, fin);
  if (mardis.length >= n) return mardis.slice(-n);
  const deuxParSemaine = jours(j => j === 2 || j === 4, fin);
  if (deuxParSemaine.length >= n) return deuxParSemaine.slice(-n);
  const plusTard = new Date(fin); plusTard.setDate(plusTard.getDate() + 60);
  return jours(j => j === 2 || j === 4, plusTard).slice(0, n);
}
const decalerJours = (date, n) => { const d = new Date(date + 'T12:00'); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

const SEQUENCES_EXEMPLE = [
  { apsa: 'Demi-fond', ca: 'CA1', eval: 'Demi-fond 3 × 500 m', competences: ['cycle4.CA1.1', 'cycle4.CA1.5'],
    objectifs: 'Construire son projet de course (allure régulière) et tenir les rôles de chronométreur et d’observateur.',
    evaluation: '3 × 500 m au temps annoncé : performance, écart au projet, rôle tenu.' },
  { apsa: 'Acrosport', ca: 'CA3', eval: 'Acrosport — enchaînement', competences: ['cycle4.CA3.1', 'cycle4.CA3.2', 'cycle4.CA3.3'],
    objectifs: 'Composer en groupe un enchaînement de 6 figures, en sécurité (parade, montées et descentes).',
    evaluation: 'Enchaînement présenté devant la classe : difficulté, exécution, composition, rôle de juge.' },
  { apsa: 'Badminton', ca: 'CA4', eval: 'Badminton — tournoi', competences: ['cycle4.CA4.1', 'cycle4.CA4.3'],
    objectifs: 'Faire déplacer l’adversaire pour marquer ; arbitrer et conseiller un camarade.',
    evaluation: 'Tournoi par poules : jeu (12 pts), arbitrage (4 pts), engagement (4 pts).',
    parties: [['Jeu', 12], ['Arbitrage', 4], ['Engagement', 4]] },
];

// Observations écrites pendant les leçons (indicateur « Observation ») et dans les fiches.
const OBS_EXEMPLE = {
  bon: ['Très bonne implication, aide les autres.', 'Progrès nets, persévère.', 'Bonne écoute des consignes.', 'Rôle de juge bien tenu.', 'Investi, toujours volontaire.'],
  moyen: ['Doit gagner en régularité.', 'Bonne volonté, technique encore fragile.', 'Se décourage vite après un échec.'],
  bavard: ['Bavarde pendant les consignes, ne respecte pas toujours les règles.', 'Insolent avec l’arbitre, à reprendre.', 'Perturbe son groupe, remarque faite.'],
  passive: ['Manque d’engagement, s’arrête souvent.', 'Peu investie, attend la fin de la leçon.'],
};

function creerClasseExemple() {
  if (classeExemple()) return classeExemple();
  const alea = hasardExemple(2024), au = liste => liste[Math.floor(alea() * liste.length)];
  const bruit = ampleur => (alea() * 2 - 1) * ampleur;
  const dates = datesExemple(), auj = aujourdhui(), cree = Date.now();
  const c = Donnees.ecrire('classes', {
    id: ID_CLASSE_EXEMPLE, nom: '3e Exemple', niveau: '3e', exemple: true,
    creneaux: [{ jour: 2, debut: '10:00', fin: '12:00', lieu: 'Gymnase' }, { jour: 4, debut: '14:00', fin: '15:00', lieu: 'Stade' }],
  });

  // Élèves (dispense en cours depuis la 9e leçon ; elle finit dans 10 jours)
  const eleves = ELEVES_EXEMPLE.map(([nom, prenom, sexe, niveau, plus = {}], k) => {
    const { bavard, tenue, passive, ...fiche } = plus;
    const el = Donnees.ecrire('eleves', {
      id: 'exemple-e' + (k + 1), classeId: c.id, ordre: k, nom, prenom, sexe, remarque: '', ...fiche,
      ...(plus.dispense ? { dispense: true, dispDebut: dates[8], dispFin: decalerJours(auj > dates[11] ? auj : dates[11], 10), remarque: 'Entorse de la cheville (certificat).' } : {}),
    });
    return { el, niveau, bavard, tenue, passive };
  });
  const dispenseLeJour = (x, date) => x.el.dispense && date >= x.el.dispDebut && date <= x.el.dispFin;

  // Leçons : appel (présence, retards, absences, oublis de tenue…) et données relevées
  const seances = dates.map((date, k) => {
    const seq = SEQUENCES_EXEMPLE[Math.floor(k / 4)], rang = (k % 4) + 1;
    return Donnees.ecrire('seances', {
      id: 'exemple-s' + (k + 1), classeId: c.id, cree: cree + k, titre: `${seq.apsa} — leçon ${rang}`, apsa: seq.apsa, ca: seq.ca, date,
      indicateurs: [{ id: ID_PRESENCE, nom: 'Présence', type: 'choix', options: ['Présent', 'Retard'] }, ...modeleIndicateurs(seq.apsa)], documents: [],
    });
  });
  const statuts = new Map(); // « séance|élève » → statut de la leçon
  seances.forEach((s, k) => {
    for (const x of eleves) {
      const r = alea();
      let statut = '';
      if (dispenseLeJour(x, s.date)) statut = 'DISP';
      else if (x.tenue && k % 4 === 1) statut = 'TEN';
      else if (r < 0.04) statut = 'ABS';
      else if (r < 0.055) statut = au(['MAL', 'BLE']);
      if (statut) { Donnees.ecrireNote(s.id, x.el.id, statut); statuts.set(s.id + '|' + x.el.id, statut); continue; }
      Donnees.ecrireNote(s.id, x.el.id, (x.bavard && k % 3 === 0) || r > 0.97 ? 'Retard' : 'Présent', ID_PRESENCE);
      for (const ind of s.indicateurs.filter(i => i.id !== ID_PRESENCE)) {
        const v = valeurExemple(ind, x, k % 4, alea, au, bruit);
        if (v !== '') Donnees.ecrireNote(s.id, x.el.id, v, ind.id);
      }
    }
  });

  // Évaluations (dernière leçon de chaque séquence) : notes, codes, degrés pré-remplis d'après la note
  SEQUENCES_EXEMPLE.forEach((seq, n) => {
    const s = seances[n * 4 + 3];
    const parties = (seq.parties || []).map(([nom, max], i) => ({ id: `exemple-p${n + 1}-${i + 1}`, nom, max }));
    const e = Donnees.ecrire('evals', {
      id: 'exemple-ev' + (n + 1), classeId: c.id, cree: cree + 100 + n, titre: seq.eval, apsa: seq.apsa, date: s.date, max: 20, coef: 1,
      referentiel: 'cycle4', ca: seq.ca, competences: seq.competences, competencesLibres: '', preremplir: true,
      ...(parties.length ? { parties } : {}),
    });
    for (const x of eleves) {
      const statut = statuts.get(s.id + '|' + x.el.id);
      if (statut) { Donnees.ecrireNote(e.id, x.el.id, statut === 'TEN' ? 'NE' : statut === 'DISP' ? 'DISP' : 'ABS'); continue; }
      const note = Math.max(3, Math.min(20, Math.round((x.niveau + bruit(2.5) - (x.passive ? 1.5 : 0)) * 2) / 2));
      if (!parties.length) { Donnees.ecrireNote(e.id, x.el.id, String(note)); }
      else {
        // Parties : à peu près au prorata de la note ; l'engagement suit l'attitude de l'élève.
        const pts = parties.map(p => Math.max(0, Math.min(p.max, Math.round(note / 20 * p.max * 2 + bruit(1)) / 2)));
        if (x.passive || x.bavard) pts[2] = Math.min(pts[2], 1.5);
        pts.forEach((v, i) => Donnees.ecrireNote(e.id, x.el.id, String(v), clePartie(parties[i])));
        Donnees.ecrireNote(e.id, x.el.id, String(arrondi2(pts.reduce((a, b) => a + b, 0))));
      }
      preremplirDegres(e, x.el.id);
    }
    // Quelques degrés choisis à la main (ils ne suivent plus la note)
    if (n === 2) for (const x of eleves.filter(y => y.bavard)) Donnees.ecrireNote(e.id, x.el.id, '1', 'cycle4.CA4.3');
  });

  // Observations du prof : par APSA (fiche de l'élève) et générales (fiche bilan)
  const ecrireSuivi = (x, apsa, texte) => Donnees.ecrire('suivis', { id: idSuivi(x.el.id, apsa), eleveId: x.el.id, apsa, texte });
  for (const x of eleves) {
    if (x.bavard) ecrireSuivi(x, ID_BILAN_NOTES, 'Bavarde beaucoup et conteste les décisions. Capable de bien mieux quand il est concentré.');
    else if (x.passive) ecrireSuivi(x, ID_BILAN_NOTES, 'Manque d’engagement, a besoin d’être relancée sans cesse.');
    else if (x.niveau >= 17) ecrireSuivi(x, ID_BILAN_NOTES, 'Élève moteur dans la classe, aide volontiers ses camarades.');
  }
  ecrireSuivi(eleves[10], 'Acrosport', 'Excellente voltigeuse, très sûre en parade. Peut prendre le rôle de cheffe de groupe.');
  ecrireSuivi(eleves[1], 'Demi-fond', 'Part trop vite puis s’effondre : travailler la régularité de l’allure.');

  // Agenda : les trois séquences, la suivante, et un conseil de classe
  const finSeq = k => decalerJours(dates[k], 2);
  SEQUENCES_EXEMPLE.forEach((seq, n) => Donnees.ecrire('agenda', {
    id: 'exemple-sq' + (n + 1), type: 'sequence', classeId: c.id, apsa: seq.apsa, ca: seq.ca,
    debut: decalerJours(dates[n * 4], -1), fin: finSeq(n * 4 + 3), objectifs: seq.objectifs, evaluation: seq.evaluation, notes: '', cours: [],
  }));
  Donnees.ecrire('agenda', {
    id: 'exemple-sq4', type: 'sequence', classeId: c.id, apsa: 'Handball', ca: 'CA4', debut: decalerJours(dates[11], 6), fin: decalerJours(dates[11], 6 + 39),
    objectifs: 'Jouer en mouvement vers l’avant ; s’organiser en défense.', evaluation: 'Matchs à 5 contre 5 + rôle d’arbitre.', notes: '', cours: [],
  });
  Donnees.ecrire('agenda', { id: 'exemple-conseil', type: 'conseil', classeId: c.id, titre: 'Conseil de classe', debut: decalerJours(dates[11], 20), heure: '17:30', notes: '' });
  return c;
}

// Valeur d'une donnée relevée, selon le niveau de l'élève et la leçon (0 à 3 : progrès au fil de la séquence).
function valeurExemple(ind, x, lecon, alea, au, bruit) {
  const niv = x.niveau / 20, degre = () => String(Math.max(1, Math.min(4, Math.round(1 + niv * 3 + lecon * 0.2 + bruit(0.7) - (x.passive ? 0.7 : 0)))));
  const nom = ind.nom.toLocaleLowerCase('fr');
  switch (ind.type) {
    case 'temps': {
      // 500 m : environ 1:50 à 3:00, un peu plus vite à chaque leçon ; temps annoncé proche du temps réalisé
      const t = 180 - niv * 70 - lecon * 2 + bruit(6);
      return String(Math.round((nom.includes('annonc') ? Math.round((t + bruit(8)) / 5) * 5 : t) * 10) / 10);
    }
    case 'echelle': return degre();
    case 'nombre':
      if (nom.includes('effort')) return String(Math.max(3, Math.min(10, Math.round(6 + bruit(2) + (x.passive ? -2 : 1)))));
      if (nom.includes('joués')) return '3';
      if (nom.includes('gagnés')) return String(Math.max(0, Math.min(3, Math.round(niv * 3 + bruit(1) - 0.5))));
      if (nom.includes('points')) return String(Math.round(20 + niv * 25 + bruit(6)));
      if (nom.includes('éléments')) return String(Math.max(2, Math.min(8, Math.round(2 + niv * 5 + lecon * 0.4 + bruit(1)))));
      return String(Math.round(niv * 10));
    case 'choix':
      if (ind.medaille || ind.suivi) return ind.options[Math.min(ind.options.length - 1, Math.floor(niv * ind.options.length))];
      if (nom.includes('difficult')) return ind.options[Math.max(0, Math.min(3, Math.round(niv * 3 + lecon * 0.3 - 1 + bruit(0.6))))];
      return au(ind.options);
    case 'texte': {
      // Une observation de temps en temps (plus souvent pour les élèves à suivre)
      if (x.bavard && lecon % 2 === 0) return au(OBS_EXEMPLE.bavard);
      if (x.passive && lecon % 2 === 1) return au(OBS_EXEMPLE.passive);
      if (alea() > 0.12) return '';
      return au(x.niveau >= 14 ? OBS_EXEMPLE.bon : OBS_EXEMPLE.moyen);
    }
    default: return '';
  }
}
