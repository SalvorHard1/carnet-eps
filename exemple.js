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
  return c;
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
