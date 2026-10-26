'use strict';
// Classe exemple : une classe entièrement inventée (élèves, appels, leçons, évaluations, observations, agenda),
// pour voir à quoi ressemble un carnet rempli. Proposée au premier lancement, et dans « + Nouvelle classe ».
// Son contenu suit la discipline du carnet : une 3e en EPS, une 2nde en SVT (EXEMPLES ci-dessous).
// Identifiants fixes (« exemple-… ») : recréée sur un autre appareil, elle ne se dédouble pas lors de la fusion par la clé.
// Les appréciations ne sont pas écrites ici : c'est l'appli qui les propose, à partir de ces données.
// (Fichier chargé avant app.js : il n'utilise les outils d'app.js qu'au moment des appels.)

const ID_CLASSE_EXEMPLE = 'exemple-classe';
const classeExemple = () => Donnees.get('classes', ID_CLASSE_EXEMPLE);

// Une classe exemple par discipline.
// eleves : [nom, prénom, sexe, niveau sur 20, particularités]
// sequences : 3 séquences de 4 leçons (évaluation à la 4e) ; suivante : la séquence qui vient après (agenda).
const EXEMPLES = {
  eps: {
    nom: '3e Exemple', niveau: '3e', referentiel: 'cycle4',
    creneaux: [{ jour: 2, debut: '10:00', fin: '12:00', lieu: 'Gymnase' }, { jour: 4, debut: '14:00', fin: '15:00', lieu: 'Stade' }],
    eleves: [
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
    ],
    statutsSante: ['MAL', 'BLE'],
    sequences: [
      { apsa: 'Demi-fond', ca: 'CA1', eval: 'Demi-fond 3 × 500 m', competences: ['cycle4.CA1.1', 'cycle4.CA1.5'],
        objectifs: 'Construire son projet de course (allure régulière) et tenir les rôles de chronométreur et d’observateur.',
        evaluation: '3 × 500 m au temps annoncé : performance, écart au projet, rôle tenu.' },
      { apsa: 'Acrosport', ca: 'CA3', eval: 'Acrosport — enchaînement', competences: ['cycle4.CA3.1', 'cycle4.CA3.2', 'cycle4.CA3.3'],
        objectifs: 'Composer en groupe un enchaînement de 6 figures, en sécurité (parade, montées et descentes).',
        evaluation: 'Enchaînement présenté devant la classe : difficulté, exécution, composition, rôle de juge.' },
      { apsa: 'Badminton', ca: 'CA4', eval: 'Badminton — tournoi', competences: ['cycle4.CA4.1', 'cycle4.CA4.3'],
        objectifs: 'Faire déplacer l’adversaire pour marquer ; arbitrer et conseiller un camarade.',
        evaluation: 'Tournoi par poules : jeu (12 pts), arbitrage (4 pts), engagement (4 pts).',
        parties: [['Jeu', 12], ['Arbitrage', 4], ['Engagement', 4]], partieAttitude: 2,
        degreMain: 'cycle4.CA4.3' }, // degré choisi à la main pour les élèves bavards (il ne suit plus la note)
    ],
    suivante: { apsa: 'Handball', ca: 'CA4', objectifs: 'Jouer en mouvement vers l’avant ; s’organiser en défense.', evaluation: 'Matchs à 5 contre 5 + rôle d’arbitre.' },
    // Observations écrites pendant les leçons (indicateur « Observation »).
    obs: {
      bon: ['Très bonne implication, aide les autres.', 'Progrès nets, persévère.', 'Bonne écoute des consignes.', 'Rôle de juge bien tenu.', 'Investi, toujours volontaire.'],
      moyen: ['Doit gagner en régularité.', 'Bonne volonté, technique encore fragile.', 'Se décourage vite après un échec.'],
      bavard: ['Bavarde pendant les consignes, ne respecte pas toujours les règles.', 'Insolent avec l’arbitre, à reprendre.', 'Perturbe son groupe, remarque faite.'],
      passive: ['Manque d’engagement, s’arrête souvent.', 'Peu investie, attend la fin de la leçon.'],
    },
    // Observations du prof dans les fiches : générales (fiche bilan) et par activité [n° d'élève, activité, texte].
    bilan: {
      bavard: 'Bavarde beaucoup et conteste les décisions. Capable de bien mieux quand il est concentré.',
      passive: 'Manque d’engagement, a besoin d’être relancée sans cesse.',
      fort: 'Élève moteur dans la classe, aide volontiers ses camarades.',
    },
    suivis: [
      [10, 'Acrosport', 'Excellente voltigeuse, très sûre en parade. Peut prendre le rôle de cheffe de groupe.'],
      [1, 'Demi-fond', 'Part trop vite puis s’effondre : travailler la régularité de l’allure.'],
    ],
  },

  svt: {
    nom: '2nde Exemple', niveau: '2nde', referentiel: 'svtSeconde',
    creneaux: [{ jour: 2, debut: '10:00', fin: '11:30', lieu: 'Labo SVT' }, { jour: 4, debut: '14:00', fin: '15:00', lieu: 'Salle B12' }],
    eleves: [
      ['ARNAUD', 'Chloé', 'F', 16], ['BARON', 'Lucas', 'G', 11], ['BLANC', 'Inès', 'F', 13],
      ['CARON', 'Nathan', 'G', 10, { bavard: true }], ['CHEVALIER', 'Manon', 'F', 17], ['COLIN', 'Théo', 'G', 14],
      ['DUMAS', 'Jade', 'F', 12, { pai: true, paiInfo: 'Allergie au latex : gants en nitrile uniquement au laboratoire. Trousse d’urgence à l’infirmerie.' }],
      ['FAURE', 'Enzo', 'G', 15], ['FONTAINE', 'Louise', 'F', 10],
      ['GAUTHIER', 'Maël', 'G', 13, { bep: true, bepInfo: 'Dyslexie (PAP). Documents agrandis, consignes lues à voix haute ; tiers-temps aux évaluations.' }],
      ['GIRARD', 'Emma', 'F', 18], ['GUERIN', 'Noah', 'G', 9, { nonRendu: true }], ['HENRY', 'Lina', 'F', 14],
      ['LACROIX', 'Tom', 'G', 16], ['LEMAIRE', 'Zoé', 'F', 11], ['MARCHAND', 'Sacha', 'G', 12],
      ['MEUNIER', 'Rose', 'F', 15], ['MOREL', 'Adam', 'G', 13], ['NICOLAS', 'Alice', 'F', 9, { passive: true }],
      ['PERRIN', 'Gabin', 'G', 17], ['ROCHE', 'Camille', 'F', 13], ['ROUSSEL', 'Jules', 'G', 11],
      ['VIDAL', 'Anna', 'F', 14], ['MOULIN', 'Léo', 'G', 12],
    ],
    statutsSante: ['MAL'],
    sequences: [
      { apsa: 'L’organisation fonctionnelle du vivant', ca: '', eval: 'Compte rendu de TP — cellules', rendu: true,
        competences: ['svtSeconde.C1.3', 'svtSeconde.C4.2'],
        seances: ['TP — observation de cellules au microscope', 'Activité — la cellule, unité du vivant',
          'TP — mise en évidence d’une activité enzymatique', 'TP — compte rendu noté'],
        objectifs: 'Observer et dessiner des cellules au microscope ; relier la structure des cellules à leur fonction.',
        evaluation: 'Compte rendu de TP : schéma d’observation légendé, interprétation des résultats, conclusion.' },
      { apsa: 'Géosciences et dynamique des paysages', ca: '', eval: 'ECE blanche — érosion et sédimentation',
        competences: ['svtSeconde.C1.4', 'svtSeconde.C2.2', 'svtSeconde.C5.4'],
        seances: ['Sortie de terrain — lecture de paysage', 'TP — modéliser l’érosion', 'Activité — les roches sédimentaires', 'ECE blanche'],
        objectifs: 'Relier la forme des paysages à l’érosion, au transport et à la sédimentation ; s’entraîner aux gestes de l’ECE.',
        evaluation: 'ECE blanche d’1 h : pratique, étape spécifique, communication, conclusion.',
        parties: [['Pratique', 9], ['Étape spécifique', 3], ['Communication', 5], ['Conclusion', 3]],
        degreMain: 'svtSeconde.C5.4' }, // sécurité au labo : degré choisi à la main pour les élèves bavards
      { apsa: 'Biodiversité, résultat et étape de l’évolution', ca: '', eval: 'Évaluation écrite — biodiversité',
        competences: ['svtSeconde.C1.1', 'svtSeconde.C3.3', 'svtSeconde.C4.1'],
        seances: ['Activité — mesurer la biodiversité', 'TP — échantillonnage et estimation d’une population',
          'Activité — dérive génétique et sélection naturelle', 'Évaluation écrite'],
        objectifs: 'Décrire la biodiversité à différentes échelles et comprendre les mécanismes qui la font évoluer.',
        evaluation: 'Évaluation écrite : restitution de connaissances et exploitation de documents.' },
    ],
    suivante: { apsa: 'Microorganismes et santé', ca: '', objectifs: 'Le microbiote humain ; agents pathogènes, antibiotiques et résistances.',
      evaluation: 'Tâche complexe sur documents.' },
    obs: {
      bon: ['Manipulation soignée, protocole bien suivi.', 'Schéma d’observation propre et bien légendé.', 'Hypothèses pertinentes, raisonnement rigoureux.',
        'Aide volontiers son binôme.', 'Participe beaucoup à l’oral.'],
      moyen: ['Compte rendu incomplet : conclusion à rédiger.', 'Réglage du microscope encore hésitant.', 'Doit s’appuyer davantage sur les documents.'],
      bavard: ['Bavarde pendant les consignes, distrait son binôme.', 'Blouse oubliée, consignes de sécurité non respectées.', 'Perturbe la paillasse voisine, remarque faite.'],
      passive: ['Laisse son binôme faire la manipulation.', 'Peu investie, compte rendu à peine commencé.'],
    },
    bilan: {
      bavard: 'Bavarde beaucoup et distrait son binôme. Capable de bien mieux quand il est concentré.',
      passive: 'Manque d’engagement, a besoin d’être relancée sans cesse.',
      fort: 'Élève moteur dans la classe, aide volontiers ses camarades.',
      nonRendu: 'Plusieurs comptes rendus non rendus : à signaler à la famille.',
    },
    suivis: [
      [10, 'L’organisation fonctionnelle du vivant', 'Schémas d’observation remarquables, très à l’aise au microscope. Peut aider les binômes en difficulté.'],
      [1, 'Géosciences et dynamique des paysages', 'Bonnes idées mais protocole mal suivi : relire les étapes avant de manipuler.'],
    ],
  },
};
const jeuExemple = () => EXEMPLES[disciplineActive()] || EXEMPLES.eps;

// Classes exemples en plus (même discipline, autre niveau) : leurs identifiants ont leur propre préfixe
// (« exemple-4e-… » : toujours « exemple-… », donc antidatées et reconnues comme les autres).
const EXEMPLES_EN_PLUS = {
  svt: [{
    ...EXEMPLES.svt, prefixe: 'exemple-4e-', nom: '4e Exemple', niveau: '4e', referentiel: 'svtCycle4',
    creneaux: [{ jour: 1, debut: '14:00', fin: '15:00', lieu: 'Labo SVT' }, { jour: 4, debut: '09:00', fin: '09:30', lieu: 'Labo SVT' }],
    eleves: [
      ['AUBERT', 'Léna', 'F', 15], ['BERNARD', 'Hugo', 'G', 12], ['BONNET', 'Jeanne', 'F', 14],
      ['BRUN', 'Malo', 'G', 10, { bavard: true }], ['CLÉMENT', 'Mila', 'F', 17], ['DAVID', 'Nolan', 'G', 13],
      ['DUPUIS', 'Ambre', 'F', 12, { pai: true, paiInfo: 'Allergie à l’arachide : trousse d’urgence (stylo d’adrénaline) dans son sac. Aucune graine d’arachide en TP.' }],
      ['FERNANDEZ', 'Yanis', 'G', 16], ['FOURNIER', 'Lou', 'F', 10],
      ['GARNIER', 'Timéo', 'G', 12, { bep: true, bepInfo: 'Trouble de l’attention (PAP) : placé devant, consignes découpées étape par étape.' }],
      ['LAMBERT', 'Eva', 'F', 18], ['LEFÈVRE', 'Paul', 'G', 9, { nonRendu: true }], ['MERCIER', 'Nina', 'F', 14],
      ['MULLER', 'Ethan', 'G', 15], ['NOËL', 'Clara', 'F', 11], ['PICARD', 'Raphaël', 'G', 13], ['RENAUD', 'Agathe', 'F', 16],
      ['ROBIN', 'Kylian', 'G', 12], ['SCHMITT', 'Romane', 'F', 9, { passive: true }], ['VINCENT', 'Aaron', 'G', 14],
      ['FABRE', 'Léonie', 'F', 13], ['ROY', 'Mathis', 'G', 11],
    ],
    sequences: [
      { apsa: 'Le corps humain et la santé', ca: '', eval: 'Évaluation — digestion et nutrition',
        competences: ['svtCycle4.C1.4', 'svtCycle4.C4.1'],
        seances: ['TP — dissection de la souris : l’appareil digestif', 'Activité — le devenir des aliments',
          'TP — action de la salive sur l’amidon', 'Évaluation — la nutrition'],
        objectifs: 'Relier l’organisation de l’appareil digestif à la transformation des aliments en nutriments.',
        evaluation: 'Évaluation écrite : exploitation d’un résultat expérimental et d’un schéma.' },
      { apsa: 'La planète Terre, l’environnement et l’action humaine', ca: '', eval: 'Compte rendu — séismes et volcans', rendu: true,
        competences: ['svtCycle4.C1.2', 'svtCycle4.C2.1', 'svtCycle4.C6.4'],
        seances: ['Activité — séismes et failles', 'TP — modéliser un séisme', 'Activité — volcans effusifs et explosifs', 'Compte rendu — la tectonique des plaques'],
        objectifs: 'Expliquer séismes et volcans par la tectonique des plaques ; aléas, risques et prévention.',
        evaluation: 'Compte rendu de la modélisation : protocole, résultats, interprétation.',
        parties: [['Démarche', 8], ['Résultats', 6], ['Communication', 6]],
        degreMain: 'svtCycle4.C6.4' }, // sécurité au labo : degré choisi à la main pour les élèves bavards
      { apsa: 'Le vivant et son évolution', ca: '', eval: 'Évaluation — reproduction et diversité',
        competences: ['svtCycle4.C4.1', 'svtCycle4.C7.1', 'svtCycle4.C6.5'],
        seances: ['Activité — la reproduction sexuée', 'TP — observation de fleurs et de graines',
          'Activité — diversité et parenté des êtres vivants', 'Évaluation — reproduction et diversité'],
        objectifs: 'Relier la reproduction sexuée à la diversité des individus ; classer les êtres vivants selon leurs parentés.',
        evaluation: 'Évaluation écrite : arbre de parenté et exploitation de documents.' },
    ],
    suivante: { apsa: 'Le corps humain et la santé', ca: '', objectifs: 'Respiration, circulation et effort ; hygiène de vie.', evaluation: 'Tâche complexe sur documents.' },
    suivis: [
      [10, 'Le corps humain et la santé', 'Dissection très soignée, sait nommer chaque organe. Peut aider un binôme en difficulté.'],
      [1, 'La planète Terre, l’environnement et l’action humaine', 'Modélisation réussie mais compte rendu trop court : développer l’interprétation.'],
    ],
  }],
};
const exemplesEnPlus = () => EXEMPLES_EN_PLUS[disciplineActive()] || [];
const idClasseExemple = jeu => (jeu.prefixe ? jeu.prefixe + 'classe' : ID_CLASSE_EXEMPLE);

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

// jeu : la classe exemple de la discipline (par défaut), ou une de EXEMPLES_EN_PLUS (préfixe d'identifiants à elle).
function creerClasseExemple(jeu = jeuExemple()) {
  const P = jeu.prefixe || 'exemple-', idC = idClasseExemple(jeu);
  if (Donnees.get('classes', idC)) return Donnees.get('classes', idC);
  const alea = hasardExemple(2024), au = liste => liste[Math.floor(alea() * liste.length)];
  const bruit = ampleur => (alea() * 2 - 1) * ampleur;
  const dates = datesExemple(), auj = aujourdhui(), cree = Date.now();
  const c = Donnees.ecrire('classes', {
    id: idC, nom: jeu.nom, niveau: jeu.niveau, exemple: true, creneaux: structuredClone(jeu.creneaux),
  });

  // Élèves (dispense en cours depuis la 9e leçon ; elle finit dans 10 jours)
  const eleves = jeu.eleves.map(([nom, prenom, sexe, niveau, plus = {}], k) => {
    const { bavard, tenue, passive, nonRendu, ...fiche } = plus;
    const el = Donnees.ecrire('eleves', {
      id: P + 'e' + (k + 1), classeId: c.id, ordre: k, nom, prenom, sexe, remarque: '', ...fiche,
      ...(plus.dispense ? { dispense: true, dispDebut: dates[8], dispFin: decalerJours(auj > dates[11] ? auj : dates[11], 10), remarque: 'Entorse de la cheville (certificat).' } : {}),
    });
    return { el, niveau, bavard, tenue, passive, nonRendu };
  });
  const dispenseLeJour = (x, date) => x.el.dispense && date >= x.el.dispDebut && date <= x.el.dispFin;

  // Leçons : appel (présence, retards, absences, oublis de tenue…) et données relevées
  const seances = dates.map((date, k) => {
    const seq = jeu.sequences[Math.floor(k / 4)], rang = (k % 4) + 1;
    return Donnees.ecrire('seances', {
      id: P + 's' + (k + 1), classeId: c.id, cree: cree + k, titre: seq.seances?.[k % 4] || `${seq.apsa} — leçon ${rang}`, apsa: seq.apsa, ca: seq.ca, date,
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
      else if (r < 0.055) statut = au(jeu.statutsSante);
      if (statut) { Donnees.ecrireNote(s.id, x.el.id, statut); statuts.set(s.id + '|' + x.el.id, statut); continue; }
      Donnees.ecrireNote(s.id, x.el.id, (x.bavard && k % 3 === 0) || r > 0.97 ? 'Retard' : 'Présent', ID_PRESENCE);
      for (const ind of s.indicateurs.filter(i => i.id !== ID_PRESENCE)) {
        const v = valeurExemple(jeu, ind, x, k % 4, alea, au, bruit);
        if (v !== '') Donnees.ecrireNote(s.id, x.el.id, v, ind.id);
      }
    }
  });

  // Évaluations (dernière leçon de chaque séquence) : notes, codes, degrés pré-remplis d'après la note
  jeu.sequences.forEach((seq, n) => {
    const s = seances[n * 4 + 3];
    const parties = (seq.parties || []).map(([nom, max], i) => ({ id: `${P}p${n + 1}-${i + 1}`, nom, max }));
    const e = Donnees.ecrire('evals', {
      id: P + 'ev' + (n + 1), classeId: c.id, cree: cree + 100 + n, titre: seq.eval, apsa: seq.apsa, date: s.date, max: 20, coef: 1,
      referentiel: jeu.referentiel, ca: seq.ca, competences: seq.competences, competencesLibres: '', preremplir: true,
      ...(parties.length ? { parties } : {}),
    });
    for (const x of eleves) {
      const statut = statuts.get(s.id + '|' + x.el.id);
      if (statut) { Donnees.ecrireNote(e.id, x.el.id, statut === 'TEN' ? 'NE' : statut === 'DISP' ? 'DISP' : 'ABS'); continue; }
      if (seq.rendu && x.nonRendu) { Donnees.ecrireNote(e.id, x.el.id, 'NR'); continue; } // travail à rendre… jamais rendu
      const note = Math.max(3, Math.min(20, Math.round((x.niveau + bruit(2.5) - (x.passive ? 1.5 : 0)) * 2) / 2));
      if (!parties.length) { Donnees.ecrireNote(e.id, x.el.id, String(note)); }
      else {
        // Parties : à peu près au prorata de la note ; l'engagement suit l'attitude de l'élève.
        const pts = parties.map(p => Math.max(0, Math.min(p.max, Math.round(note / 20 * p.max * 2 + bruit(1)) / 2)));
        if (seq.partieAttitude !== undefined && (x.passive || x.bavard)) pts[seq.partieAttitude] = Math.min(pts[seq.partieAttitude], 1.5);
        pts.forEach((v, i) => Donnees.ecrireNote(e.id, x.el.id, String(v), clePartie(parties[i])));
        Donnees.ecrireNote(e.id, x.el.id, String(arrondi2(pts.reduce((a, b) => a + b, 0))));
      }
      preremplirDegres(e, x.el.id);
    }
    // Quelques degrés choisis à la main (ils ne suivent plus la note)
    if (seq.degreMain) for (const x of eleves.filter(y => y.bavard)) Donnees.ecrireNote(e.id, x.el.id, '1', seq.degreMain);
  });

  // Observations du prof : par activité (fiche de l'élève) et générales (fiche bilan)
  const ecrireSuivi = (x, apsa, texte) => Donnees.ecrire('suivis', { id: idSuivi(x.el.id, apsa), eleveId: x.el.id, apsa, texte });
  for (const x of eleves) {
    if (x.bavard) ecrireSuivi(x, ID_BILAN_NOTES, jeu.bilan.bavard);
    else if (x.passive) ecrireSuivi(x, ID_BILAN_NOTES, jeu.bilan.passive);
    else if (x.nonRendu && jeu.bilan.nonRendu) ecrireSuivi(x, ID_BILAN_NOTES, jeu.bilan.nonRendu);
    else if (x.niveau >= 17) ecrireSuivi(x, ID_BILAN_NOTES, jeu.bilan.fort);
  }
  for (const [k, apsa, texte] of jeu.suivis) ecrireSuivi(eleves[k], apsa, texte);

  // Agenda : les trois séquences, la suivante, et un conseil de classe
  const finSeq = k => decalerJours(dates[k], 2);
  jeu.sequences.forEach((seq, n) => Donnees.ecrire('agenda', {
    id: P + 'sq' + (n + 1), type: 'sequence', classeId: c.id, apsa: seq.apsa, ca: seq.ca,
    debut: decalerJours(dates[n * 4], -1), fin: finSeq(n * 4 + 3), objectifs: seq.objectifs, evaluation: seq.evaluation, notes: '', cours: [],
  }));
  Donnees.ecrire('agenda', {
    id: P + 'sq4', type: 'sequence', classeId: c.id, ...jeu.suivante, debut: decalerJours(dates[11], 6), fin: decalerJours(dates[11], 6 + 39), notes: '', cours: [],
  });
  Donnees.ecrire('agenda', { id: P + 'conseil', type: 'conseil', classeId: c.id, titre: 'Conseil de classe', debut: decalerJours(dates[11], 20), heure: '17:30', notes: '' });
  remplirPPExemple(jeu, c);
  return c;
}

/* ---------- ⭐ Espace professeur principal de la classe exemple (pp.js) ----------
   Bulletins inventés (toutes les matières, appréciations des « collègues », absences) pour la période en cours et la
   précédente, quelques notes du conseil et un suivi : l'onglet « Prof principal » est rempli comme une vraie classe.
   Hasard à part (graine 77) : le reste de la classe exemple ne change pas. Les classes exemples créées avant la v0.116
   sont complétées au démarrage (completerExemplesPP), une seule fois (marque `ppExemple` = VERSION_PP_EXEMPLE). */

const MATIERES_EXEMPLE = {
  college: ['FRANCAIS', 'MATHEMATIQUES', 'HISTOIRE-GEOGRAPHIE EMC', 'ANGLAIS LV1', 'ESPAGNOL LV2', 'PHYSIQUE-CHIMIE', 'SVT', 'TECHNOLOGIE', 'ARTS PLASTIQUES', 'EDUCATION MUSICALE', 'EPS'],
  lycee: ['FRANCAIS', 'MATHEMATIQUES', 'HISTOIRE-GEOGRAPHIE', 'ANGLAIS LVA', 'ESPAGNOL LVB', 'PHYSIQUE-CHIMIE', 'SVT', 'SES', 'SNT', 'EPS', 'EMC'],
};
// Appréciations des collègues, en 2 ou 3 phrases comme sur un vrai bulletin : les résultats (selon la moyenne de la
// matière), une remarque propre à la matière, sur l'attitude ou selon le profil de l'élève, puis souvent un conseil.
// Banques larges : dans le bulletin d'un même élève, une phrase n'est jamais écrite deux fois (voir apprExemple).
const APPR_EXEMPLE = {
  resultats: {
    4: ['Excellent trimestre : les connaissances sont solides et les méthodes parfaitement maîtrisées.', 'Très bons résultats, fruit d’un travail régulier et approfondi.',
      'Un trimestre remarquable, avec des évaluations de très bon niveau.', 'Très bon ensemble, aussi bien à l’écrit qu’à l’oral.',
      'Des résultats brillants tout au long de la période.', 'Un excellent niveau, confirmé à chaque évaluation.', 'Très beau trimestre, sans fausse note.',
      'Les attendus sont largement dépassés.', 'Une maîtrise remarquable des notions travaillées.'],
    3: ['Bon trimestre : les notions sont comprises et les résultats réguliers.', 'Des résultats satisfaisants, obtenus grâce à un travail sérieux.',
      'Un ensemble solide, même si certaines évaluations auraient pu être mieux réussies.', 'Assez bon trimestre, avec des résultats en progrès sur la fin de la période.',
      'Les notions essentielles sont acquises.', 'Un bon niveau d’ensemble, encore perfectible à l’écrit.', 'Des résultats de bonne tenue.',
      'Un trimestre réussi dans l’ensemble.', 'Les évaluations sont globalement bien réussies.'],
    2: ['Des résultats justes, qui ne reflètent pas encore toutes les capacités de l’élève.', 'Un trimestre en demi-teinte : les bases sont là mais restent fragiles.',
      'Un ensemble moyen, avec des évaluations très inégales.', 'Des résultats corrects à l’oral, plus fragiles à l’écrit.', 'La moyenne reste juste.',
      'Des acquis encore fragiles, à consolider.', 'Un trimestre inégal, avec quelques évaluations réussies.', 'Les résultats sont tout juste suffisants.',
      'Des connaissances encore imprécises.'],
    1: ['Un trimestre difficile : les notions essentielles ne sont pas encore acquises.', 'Des résultats insuffisants, avec de réelles lacunes à combler.',
      'Les évaluations montrent des difficultés importantes, notamment dans la compréhension des consignes.', 'Les bases ne sont pas maîtrisées.',
      'Un ensemble très fragile.', 'Des résultats faibles, en dessous des attendus.', 'Les connaissances ne sont pas fixées.',
      'Les évaluations sont très en deçà des attentes.', 'De grosses difficultés ce trimestre.'],
  },
  attitude: {
    4: ['La participation est active et pertinente, et le travail toujours soigné.', 'Un élément moteur de la classe, toujours volontaire à l’oral.',
      'Le sérieux et l’implication en classe sont exemplaires.', 'Une curiosité et un enthousiasme qui font plaisir à voir.', 'Le travail est rigoureux et toujours soigné.'],
    3: ['Le travail est sérieux et la participation régulière.', 'L’attitude en classe est positive et le travail régulier.',
      'Bonne implication en classe, même si l’oral pourrait être plus fréquent.', 'Un travail appliqué et une bonne écoute en classe.', 'Une attitude agréable et constructive.'],
    2: ['Le travail personnel doit être plus régulier, en particulier l’apprentissage des leçons.', 'L’attitude est correcte mais la participation reste trop discrète.',
      'Des efforts sont visibles, mais le travail à la maison manque encore de rigueur.', 'Le travail manque de régularité d’une semaine à l’autre.',
      'Une attention parfois fluctuante en classe.'],
    1: ['Le travail personnel est insuffisant et les leçons ne sont pas apprises.', 'Le manque de travail régulier explique en grande partie ces résultats.',
      'Il faut reprendre les bases avec méthode et ne pas hésiter à demander de l’aide.', 'Le travail à la maison est trop léger.', 'Les leçons ne sont pas revues.'],
  },
  bavard: ['Les bavardages incessants perturbent le cours et nuisent à la concentration.', 'Trop de dispersion en classe : il faut se recentrer sur le travail demandé.',
    'Le comportement doit changer : trop de bavardages et d’agitation pendant les cours.', 'Les remarques répétées sur le comportement n’ont pas suffi.',
    'L’agitation en classe empêche tout travail sérieux.', 'Une attitude dissipée qui gêne le groupe.', 'Les bavardages prennent le pas sur le travail.'],
  passive: ['L’attitude reste très passive : aucune participation orale, et il faut sans cesse relancer.', 'La participation est quasi inexistante, ce qui freine les progrès.',
    'Un manque d’implication en classe qui inquiète : il faut se mobiliser.', 'Une attitude en retrait, sans prise de parole.',
    'Peu d’investissement en classe : il faut sortir de cette passivité.', 'Le désintérêt pour le cours est manifeste.'],
  nonRendu: ['Plusieurs devoirs n’ont pas été rendus, ce qui pèse lourdement sur la moyenne.', 'Le travail à la maison est trop souvent non fait.',
    'Des devoirs non faits à plusieurs reprises.', 'Le travail demandé n’est pas rendu dans les délais.'],
  conseil: {
    haut: ['Continuez ainsi.', 'Il faut maintenir cette belle dynamique.', 'Bravo, poursuivez dans cette voie.', 'Félicitations pour ce travail.', 'Un très bon état d’esprit.'],
    moyen: ['Il faut approfondir les révisions avant chaque évaluation.', 'Une participation orale plus fréquente permettrait de progresser.',
      'Il faut viser davantage de rigueur dans la rédaction.', 'Des fiches de révision aideraient à mieux fixer les notions.', 'Les exercices d’entraînement doivent être faits avec soin.'],
    bas: ['Un travail régulier, dès maintenant, est indispensable pour progresser.', 'Il faut profiter de l’aide proposée et reprendre les leçons chaque semaine.',
      'Courage : avec un travail régulier, des progrès sont possibles.', 'Il faut se remettre au travail sans tarder.', 'L’aide aux devoirs serait un vrai soutien.'],
  },
};
// Remarques propres à la matière : [réussites, difficultés].
const MATIERE_APPR_EXEMPLE = [
  [/FRANCAIS/, ['L’expression écrite est riche et soignée.', 'Les analyses de textes sont fines et bien argumentées.'], ['L’expression écrite reste à travailler, notamment l’orthographe.', 'Les analyses de textes manquent encore de précision.']],
  [/MATH/, ['Les raisonnements sont rigoureux et bien rédigés.', 'Les méthodes de calcul sont bien maîtrisées.'], ['Les méthodes de calcul doivent être consolidées.', 'Les raisonnements manquent de rigueur dans la rédaction.']],
  [/ANGLAIS/, ['L’oral est fluide et le vocabulaire riche.', 'La compréhension écrite comme orale est très bonne.'], ['Le vocabulaire doit être appris régulièrement.', 'L’expression orale reste hésitante.']],
  [/ESPAGNOL/, ['La prononciation est soignée et l’expression aisée.', 'Les textes sont bien compris.'], ['La conjugaison reste à revoir.', 'La compréhension orale est encore difficile.']],
  [/HISTOIRE|EMC/, ['Les repères sont maîtrisés et les analyses de documents pertinentes.', 'Les connaissances sont précises et bien mobilisées.'], ['Les repères chronologiques sont à revoir.', 'L’analyse de documents manque encore de méthode.']],
  [/SVT/, ['La démarche expérimentale est bien conduite.', 'Les schémas sont précis et bien légendés.'], ['Les schémas manquent de précision.', 'Les notions de cours doivent être mieux apprises.']],
  [/PHYSIQUE|SNT/, ['Les comptes rendus sont clairs et rigoureux.', 'Les manipulations sont bien menées.'], ['La rédaction des comptes rendus manque de rigueur.', 'Les formules doivent être mieux maîtrisées.']],
  [/EPS/, ['L’engagement moteur est de grande qualité.', 'Les rôles d’arbitre et d’observateur sont très bien tenus.'], ['L’engagement dans les activités doit être plus constant.', 'Les rôles d’arbitre et d’observateur sont à mieux assumer.']],
  [/SES/, ['Les notions économiques sont bien comprises.', 'L’argumentation est structurée.'], ['Les notions économiques restent floues.', 'L’argumentation doit être mieux construite.']],
  [/ARTS|MUSICALE|TECHNO/, ['Les projets sont menés avec soin et créativité.', 'Les productions sont abouties.'], ['Les productions manquent d’investissement.', 'Les projets ne sont pas toujours menés à terme.']],
];

// Appréciation d'un collègue : n = niveau de la moyenne (1 à 4), x = profil de l'élève.
// deja : phrases déjà écrites dans le bulletin de l'élève (deux collègues n'écrivent pas mot pour mot la même chose) ;
// une banque épuisée laisse la place à une autre sorte de remarque.
function apprExemple(brut, n, x, au, alea, deja) {
  const prendre = l => { const libres = (l || []).filter(p => !deja.has(p)); if (!libres.length) return null; const p = au(libres); deja.add(p); return p; };
  if (alea() < 0.08) return ''; // (quelques cases vides, comme sur un vrai bulletin)
  const voisin = n >= 3 ? n - 1 : n + 1;
  const phrases = [prendre(APPR_EXEMPLE.resultats[n]) || prendre(APPR_EXEMPLE.resultats[voisin]) || au(APPR_EXEMPLE.resultats[n])];
  const profil = ['bavard', 'passive', 'nonRendu'].find(f => x[f] && alea() < 0.7);
  const propre = MATIERE_APPR_EXEMPLE.find(([re]) => re.test(brut));
  const remarque = (profil && prendre(APPR_EXEMPLE[profil])) || (propre && alea() < 0.55 && prendre(propre[n >= 3 ? 1 : 2])) || prendre(APPR_EXEMPLE.attitude[n]);
  if (remarque) phrases.push(remarque);
  const cleConseil = n >= 4 ? 'haut' : n >= 2 && !profil ? 'moyen' : 'bas';
  if (alea() < 0.6) { const c = prendre(APPR_EXEMPLE.conseil[cleConseil]); if (c) phrases.push(c); }
  // (Toujours au moins deux phrases, une centaine de caractères : on complète si besoin.)
  for (const l of [propre?.[n >= 3 ? 1 : 2], APPR_EXEMPLE.attitude[n], APPR_EXEMPLE.conseil[cleConseil], APPR_EXEMPLE.attitude[voisin]]) {
    if (phrases.length >= 2 && phrases.join(' ').length >= 90) break;
    const p = prendre(l);
    if (p) phrases.push(p);
  }
  return phrases.join(' ');
}

// (Version des bulletins inventés : la monter refait les bulletins des classes exemples existantes au démarrage.)
const VERSION_PP_EXEMPLE = 4;

// bulletinsSeuls : mise à jour d'une classe déjà remplie (la case PP, les notes du conseil et le suivi ne bougent pas).
function remplirPPExemple(jeu, c, bulletinsSeuls = false) {
  const P = jeu.prefixe || 'exemple-', alea = hasardExemple(77), au = l => l[Math.floor(alea() * l.length)];
  const bruit = a => (alea() * 2 - 1) * a, arr = n => Math.round(Math.max(2, Math.min(19.5, n)) * 100) / 100;
  const matieres = /^(2nde|1re|Tle)/.test(jeu.niveau) ? MATIERES_EXEMPLE.lycee : MATIERES_EXEMPLE.college;
  const eleves = jeu.eleves.map(([, , , niveau, plus = {}], k) => ({ id: P + 'e' + (k + 1), niveau, ...plus }))
    .filter(x => Donnees.get('eleves', x.id));
  // Période en cours et précédente (au 1er trimestre : seulement celle-ci).
  const periodes = periodesAnnee(), i = Math.max(0, periodes.findIndex(p => p.id === periodeDe(aujourdhui())));
  const aRemplir = periodes.slice(Math.max(0, i - 1), i + 1).map(p => p.id);
  // Points forts et faibles propres à chaque élève (les mêmes d'une période à l'autre).
  const profils = new Map(eleves.map(x => [x.id, { fort: au(matieres), faible: au(matieres) }]));
  aRemplir.forEach((periode, rang) => {
    const derniere = rang === aRemplir.length - 1;
    // Moyennes : le niveau de l'élève ± un écart par matière ; à la période précédente, un peu plus bas pour certains (progrès).
    const moys = eleves.map(x => {
      const pf = profils.get(x.id), recul = derniere ? 0 : (x.niveau % 3 === 0 ? 1.5 : x.niveau % 3 === 1 ? -0.8 : 0);
      return matieres.map(m => arr(x.niveau - recul + (m === pf.fort ? 2.5 : m === pf.faible ? -3 : 0) + bruit(1.8) - (x.passive ? 0.8 : 0)));
    });
    const moyClasse = matieres.map((m, j) => arr(moys.reduce((a, l) => a + l[j], 0) / moys.length));
    const gens = moys.map(l => arr(l.reduce((a, v) => a + v, 0) / l.length));
    const genClasse = arr(gens.reduce((a, v) => a + v, 0) / gens.length);
    eleves.forEach((x, k) => {
      const deja = new Set();
      const mats = matieres.map((brut, j) => {
        const moy = moys[k][j], n = moy >= 15.5 ? 4 : moy >= 12.5 ? 3 : moy >= 9.5 ? 2 : 1;
        return { brut, moy, moyClasse: moyClasse[j], appr: apprExemple(brut, n, x, au, alea, deja) };
      });
      const abs = x.bavard ? 6 : x.passive ? 8 : x.tenue ? 3 : Math.floor(alea() * 4);
      Donnees.ecrire('suivis', {
        id: idBulletinPP(x.id, periode), eleveId: x.id, apsa: 'pp bulletin ' + periode, pp: true, periode, matieres: mats,
        moyGen: gens[k], moyGenClasse: genClasse, absences: abs, nonJustifiees: x.bavard ? 2 : x.passive ? 3 : 0, retards: x.bavard ? 4 : x.tenue ? 2 : 0,
      });
    });
  });
  if (bulletinsSeuls) { Donnees.ecrire('classes', { ...Donnees.get('classes', c.id), ppExemple: VERSION_PP_EXEMPLE }); return; }
  // Conseil de la période en cours : quelques notes ; suivi : entretiens pour les élèves à suivre.
  const per = aRemplir.at(-1), trouver = f => eleves.find(f);
  const notes = [[trouver(x => x.bavard), 'Comportement évoqué par plusieurs collègues. Rencontre avec la famille proposée.'],
    [trouver(x => x.passive), 'Collègues inquiets du manque d’implication : entretien avec l’élève et l’infirmière scolaire.'],
    [trouver(x => x.niveau >= 18), 'Félicitations à l’unanimité.']];
  for (const [x, texte] of notes) if (x) Donnees.ecrire('suivis', { id: idApprPP(x.id, per), eleveId: x.id, apsa: 'pp appréciation ' + per, pp: true, periode: per, niveaux: {}, graine: 0, texte: '', notes: texte });
  const auj = aujourdhui();
  const journal = [
    [trouver(x => x.bavard), -12, 'famille', 'Rendez-vous avec la mère : bavardages et travail irrégulier signalés par plusieurs collègues.', 'Fiche de suivi hebdomadaire pendant un mois.', decalerJours(auj, 9)],
    [trouver(x => x.passive), -5, 'eleve', 'Entretien : se dit fatiguée et peu motivée, pas de projet pour l’an prochain.', 'Rendez-vous avec la psychologue de l’Éducation nationale.', decalerJours(auj, -1)],
    [trouver(x => x.nonRendu || x.tenue), -20, 'vs', 'Point avec la CPE sur les oublis et le travail non rendu.', 'Carnet de liaison signé chaque semaine.', ''],
  ];
  journal.forEach(([x, jours, type, objet, suite, rappel], k) => {
    if (x) Donnees.ecrire('suivis', { id: `${P}ppj${k + 1}`, eleveId: x.id, apsa: 'pp journal', pp: true, date: decalerJours(auj, jours), type, objet, suite, rappel, fait: false });
  });
  Donnees.ecrire('classes', { ...Donnees.get('classes', c.id), pp: true, ppExemple: VERSION_PP_EXEMPLE });
}

// Classes exemples créées par une version d'avant l'espace professeur principal : on les complète, une seule fois
// (décocher « Je suis PP » ensuite ne les fait pas revenir) ; celles d'une version précédente des bulletins inventés :
// seuls les bulletins sont refaits. Suivis PP d'élèves exemples supprimés : retirés.
function completerExemplesPP() {
  for (const c of Donnees.liste('classes', x => x.exemple && x.ppExemple !== VERSION_PP_EXEMPLE && x.id.startsWith('exemple-'))) {
    const jeu = [EXEMPLES.eps, EXEMPLES.svt, ...Object.values(EXEMPLES_EN_PLUS).flat()].find(j => idClasseExemple(j) === c.id && j.nom === c.nom)
      || [jeuExemple(), ...exemplesEnPlus()].find(j => idClasseExemple(j) === c.id);
    if (jeu) remplirPPExemple(jeu, c, !!c.ppExemple);
  }
  for (const s of Donnees.liste('suivis', x => x.pp && x.eleveId?.startsWith('exemple-') && !Donnees.get('eleves', x.eleveId))) Donnees.supprimer('suivis', s.id);
}

// Valeur d'une donnée relevée, selon le niveau de l'élève et la leçon (0 à 3 : progrès au fil de la séquence).
function valeurExemple(jeu, ind, x, lecon, alea, au, bruit) {
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
      // Travail rendu (SVT) : presque toujours rendu, sauf pour l'élève qui ne rend rien
      if (ind.options.includes('Non rendu')) {
        const r = alea();
        if (x.nonRendu) return lecon % 2 ? 'Non rendu' : 'En retard';
        return r < 0.06 ? 'En retard' : r < 0.09 && (x.passive || x.bavard) ? 'Non rendu' : 'Rendu';
      }
      return au(ind.options);
    case 'texte': {
      // Une observation de temps en temps (plus souvent pour les élèves à suivre)
      if (x.bavard && lecon % 2 === 0) return au(jeu.obs.bavard);
      if (x.passive && lecon % 2 === 1) return au(jeu.obs.passive);
      if (alea() > 0.12) return '';
      return au(x.niveau >= 14 ? jeu.obs.bon : jeu.obs.moyen);
    }
    default: return '';
  }
}
