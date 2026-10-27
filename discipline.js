'use strict';
// Profils de discipline : ce qui change d'une discipline à l'autre (EPS, SVT…) est rangé ici.
// Vocabulaire affiché, liste des activités / thèmes, référentiels de compétences proposés, référentiel par niveau,
// outils proposés, nom du carnet. Le reste de l'appli (élèves, notes, compétences, appréciations, agenda, clé…) est commun.
// Un carnet = une discipline : le choix est gardé dans le carnet (réglage « discipline »), donc il suit sur la clé.
// Changer de discipline n'efface aucune donnée : seuls l'affichage et les propositions changent.
// Les données gardent leurs noms internes (champ `apsa` = l'activité / le thème de la séance ou de l'évaluation),
// pour rester lisibles par les versions précédentes de l'appli.
// (Fichier chargé tôt : il n'utilise les autres fichiers qu'au moment des appels.)

const DISCIPLINES = {
  eps: {
    id: 'eps', nom: 'EPS', nomComplet: 'Éducation physique et sportive', carnet: 'Carnet EPS',
    mots: {
      activite: 'APSA', // étiquette du champ « activité » (évaluations, leçons, séquences)
      activitePlaceholder: 'Choisis ou tape une activité',
      activiteExemple: 'ex. Escalade',
      sequenceExemple: 'Handball, demi-fond…',
      champ: 'Champ d’apprentissage',
      lecons: 'Leçons', // nom de l'onglet des séances
      lecon: 'leçon',
      seance: 'séance',
      aideLecons: 'Crée une séance : les données à relever s’adaptent à l’APSA (temps en CA1, voies et sécurité en escalade, exécution en gym…).',
      modeleActivite: 'Recharger le modèle de l’APSA',
      dansCetteActivite: 'dans cette APSA',
      cetteActivite: 'cette APSA',
      deuxActivites: 'Deux APSA en parallèle ? Ne coche que les cours de celle-ci.',
      titreEvalExemple: 'ex. Demi-fond — 3 × 500 m',
      competenceLibreExemple: 'compétence du projet d’EPS',
      titreSeanceExemple: 'ex. Escalade — voies en tête',
      presenceLecons: 'présence aux leçons',
      // Oubli (code TEN, onglet Appel et séances) : la tenue en EPS, le matériel en SVT.
      deTenue: 'de tenue',
      oubliCourt: 'Oubli tenue',
      iconeTenue: '👕',
      tenueReglage: 'oublient souvent leur tenue',
      tenuePhrase: 'venir en tenue à chaque leçon',
      exercice: 'Exercice', // liste des séances par nom (onglet Leçons)
      aideExercice: 'Choisis un exercice pour voir la meilleure performance et l’évolution de chaque élève.',
      aideSaisieTemps: 'Temps : 3:45 ou 12,5 · ',
      tempsManque: 'ce temps de pratique manqué', // (fiche bilan : élève souvent blessé ou malade)
      remarquesAide: 'santé, inaptitude…', // (colonne Remarques de la liste des élèves)
      evalSequenceExemple: 'ex. Tournoi final, leçon 8', // (agenda : séquence, événement)
      evenementExemple: 'Cross du collège, sortie escalade…',
      activiteBareme: 'APSA', // (onglet Barèmes : ce que décrit un barème)
      rechercheBareme: 'Rechercher une APSA…',
    },
    champsSequence: true, // les séquences de l'agenda ont un champ d'apprentissage (CA1 à CA5)
    activites: [
      'Demi-fond', 'Course de vitesse', 'Course de haies', 'Relais', 'Saut en longueur', 'Saut en hauteur', 'Triple saut',
      'Lancer de poids', 'Lancer de javelot', 'Lancer de disque', 'Multibonds', 'Natation', 'Natation en durée', 'Savoir-nager', 'Sauvetage',
      'Course d’orientation', 'Escalade', 'VTT',
      'Badminton', 'Tennis de table', 'Tennis', 'Volley-ball', 'Basket-ball', 'Handball', 'Football', 'Rugby', 'Ultimate',
      'Futsal', 'Lutte', 'Judo', 'Boxe française', 'Gymnastique', 'Acrosport', 'Arts du cirque', 'Danse',
      'Musculation', 'Step', 'Course en durée', 'Cross-training', 'Yoga', 'Relaxation',
    ],
    // Référentiels officiels proposés (identifiants de referentiel.js) ; les référentiels personnels le sont toujours.
    referentiels: ['cycle3', 'cycle4', 'lycee'],
    referentielParNiveau: { '6e': 'cycle3', '5e': 'cycle4', '4e': 'cycle4', '3e': 'cycle4', '2nde': 'lycee', '1re': 'lycee', 'Tle': 'lycee' },
    referentielDefaut: 'cycle4',
    familleOutilsMasquees: ['svt'], // familles d'outils cachées dans cette discipline (ici : les outils de SVT, comme l'ECE)
    codes: ['ABS', 'DISP', 'NE', 'BLE', 'MAL', 'AUT'], // codes de saisie proposés (barre rapide, réglages)
  },

  svt: {
    id: 'svt', nom: 'SVT', nomComplet: 'Sciences de la vie et de la Terre', carnet: 'Carnet SVT',
    mots: {
      activite: 'Thème',
      activitePlaceholder: 'Choisis ou tape un thème',
      activiteExemple: 'ex. Génétique',
      sequenceExemple: 'Génétique, géologie…',
      champ: 'Compétence',
      lecons: 'Séances',
      lecon: 'séance',
      seance: 'séance',
      aideLecons: 'Crée une séance (TP, activité, sortie de terrain…) : pour chaque élève, relève la démarche, la manipulation, la communication, la sécurité, le travail rendu…',
      modeleActivite: 'Recharger le modèle de séance',
      dansCetteActivite: 'dans ce thème',
      cetteActivite: 'ce thème',
      deuxActivites: 'Deux thèmes en parallèle ? Ne coche que les cours de celui-ci.',
      titreEvalExemple: 'ex. TP — Observation de cellules au microscope',
      competenceLibreExemple: 'compétence du projet de l’équipe de SVT',
      titreSeanceExemple: 'ex. TP — observation de cellules au microscope',
      presenceLecons: 'présence aux séances',
      deTenue: 'de matériel',
      oubliCourt: 'Oubli matériel',
      iconeTenue: '🎒',
      tenueReglage: 'oublient souvent leur matériel (blouse, cahier…)',
      tenuePhrase: 'venir avec son matériel (blouse, cahier…)',
      exercice: 'Séance',
      aideExercice: 'Choisis une séance pour voir l’évolution de chaque élève d’une séance à l’autre.',
      aideSaisieTemps: '',
      tempsManque: 'ces cours manqués',
      remarquesAide: 'santé, aménagements…',
      evalSequenceExemple: 'ex. ECE blanche, séance 6',
      evenementExemple: 'Sortie géologie, visite de laboratoire…',
      activiteBareme: 'Type d’épreuve',
      rechercheBareme: 'Rechercher un type d’épreuve…',
    },
    bilans: true, // onglet Notes : 🎯 Compétences, 🧭 Socle (collège), 📄 Travail rendu (bilansvt.js)
    // Types d'événements de l'agenda proposés (tant que l'enseignant n'a pas réglé les siens).
    typesEvenements: [
      { id: 'sortie', nom: 'Sortie de terrain', couleur: '#0f6670' },
      { id: 'labo', nom: 'Labo (préparation, commande)', couleur: '#a3306e' },
      { id: 'projet', nom: 'Projet / concours', couleur: '#1f5f9e' },
      { id: 'reunion', nom: 'Réunion', couleur: '#5b3fa0' },
      { id: 'autre', nom: 'Autre', couleur: '#3d4a52' },
    ],
    // Thèmes des programmes (suggestions : on peut taper n'importe quel titre).
    activites: [
      // Seconde
      'L’organisation fonctionnelle du vivant', 'Biodiversité, résultat et étape de l’évolution', 'Géosciences et dynamique des paysages',
      'Agrosystèmes et développement durable', 'Procréation et sexualité humaine', 'Microorganismes et santé',
      // Première (spécialité)
      'Transmission, variation et expression du patrimoine génétique', 'La dynamique interne de la Terre',
      'Écosystèmes et services environnementaux', 'Variation génétique et santé', 'Le fonctionnement du système immunitaire humain',
      // Terminale (spécialité)
      'Génétique et évolution', 'À la recherche du passé géologique de notre planète', 'De la plante sauvage à la plante domestiquée',
      'Les climats de la Terre', 'Comportements, mouvement et système nerveux', 'Produire le mouvement : contraction musculaire et apport d’énergie',
      'Comportements et stress',
      // Enseignement scientifique (1re, Tle)
      'Une longue histoire de la matière', 'Le Soleil, notre source d’énergie', 'La Terre, un astre singulier',
      'Science, climat et société', 'Le futur des énergies', 'Une histoire du vivant', 'Projet expérimental et numérique',
      // Collège (cycle 4)
      'La planète Terre, l’environnement et l’action humaine', 'Le vivant et son évolution', 'Le corps humain et la santé',
      // 6e : Sciences et technologie (cycle 3, BO n° 25 du 22 juin 2023)
      'Matière, mouvement, énergie et information', 'Le vivant, sa diversité et les fonctions qui le caractérisent',
      'Les objets techniques au cœur de la société', 'La Terre, une planète peuplée par des êtres vivants',
      // Types de séance
      'Travaux pratiques', 'Sortie de terrain', 'Évaluation des compétences expérimentales (ECE)',
    ],
    // (L'enseignement scientifique de 1re / Tle est souvent assuré par les professeurs de SVT : proposé aussi.)
    referentiels: ['svtSeconde', 'svtLycee', 'ensSci', 'svtCycle4', 'sciTechCycle3'],
    referentielParNiveau: { '6e': 'sciTechCycle3', '5e': 'svtCycle4', '4e': 'svtCycle4', '3e': 'svtCycle4', '2nde': 'svtSeconde', '1re': 'svtLycee', 'Tle': 'svtLycee' },
    referentielDefaut: 'svtSeconde',
    familleOutilsMasquees: ['apsa'], // combiné, natation, boxe : propres à l'EPS
    // (Tableau blanc = terrains de sport, Vidéo-delay = geste sportif : propres à l'EPS.)
    outilsMasques: ['tours', 'intervalles', 'marque', 'tournoi', 'essais', 'vma', 'tableau', 'video'], // restent : chrono, ateliers, équipes, tirage, + outils SVT
    champsSequence: false, // pas de champ d'apprentissage dans les séquences de l'agenda
    codes: ['ABS', 'NR', 'NE', 'MAL', 'AUT'], // « Non rendu » ; pas de blessé ni de dispensé (réactivables dans ⚙ Réglages › Notes)
    // Modèle de séance : les critères relevés pour chaque élève (modifiables séance par séance).
    modeleSeance: () => [
      { nom: 'Démarche scientifique', type: 'echelle' },
      { nom: 'Manipulation / protocole', type: 'echelle' },
      { nom: 'Communication (schéma, compte rendu)', type: 'echelle' },
      { nom: 'Sécurité au laboratoire', type: 'echelle' },
      { nom: 'Travail rendu', type: 'choix', options: ['Rendu', 'En retard', 'Non rendu'] },
      { nom: 'Observation', type: 'texte' },
    ],
    // Appréciations : la rubrique « motricité » devient « connaissances et résultats », « méthodologie » parle de démarche.
    appreciations: {
      noms: { moteur: { nom: 'Connaissances', aide: 'résultats, notes' }, methodo: { nom: 'Démarche', aide: 'démarche scientifique, TP, sécurité' } },
      phrases: {
        // (Niveaux 1 et 2 : ceux de l'EPS, qui parlent déjà de « cours ».)
        attitude: {
          4: { p: ['{S} s’investit pleinement dans le travail demandé.', '{S} fait preuve d’un engagement exemplaire en classe.', '{S} montre un investissement remarquable et constant.', 'L’investissement en classe est exemplaire.'],
            t: ['Investissement exemplaire.', 'Engagement remarquable.'] },
          3: { p: ['{S} s’investit avec sérieux en classe.', '{S} montre un engagement régulier.', '{S} participe activement en classe.', 'Le travail en classe est sérieux et régulier.'],
            t: ['Investissement sérieux.', 'Travail sérieux en classe.'] },
        },
        moteur: {
          4: { p: ['{S} maîtrise très bien les connaissances{apsa}.', '{S} obtient de très bons résultats{apsa}.', '{S} obtient des résultats remarquables{apsa}.', 'Les connaissances sont solidement maîtrisées{apsa}.'],
            t: ['Connaissances très bien maîtrisées{apsa}.', 'Très bons résultats{apsa}.', 'Résultats remarquables{apsa}.'] },
          3: { p: ['{S} obtient de bons résultats{apsa}.', '{S} maîtrise bien les connaissances{apsa}.'], t: ['Bons résultats{apsa}.', 'Connaissances bien maîtrisées{apsa}.'] },
          2: { p: { b: ['{S} obtient des résultats encore justes{apsa}, qui peuvent progresser.'], n: ['{S} obtient des résultats moyens{apsa}.'],
            x: ['Les résultats{apsa} sont insuffisants au regard des possibilités de {P}.', '{S} doit viser des résultats plus solides{apsa}.'] },
          t: { b: ['Connaissances à consolider{apsa}.'], n: ['Résultats moyens{apsa}.'], x: ['Résultats insuffisants{apsa}.'] } },
          1: { p: { b: ['{S} rencontre des difficultés{apsa}, mais peut progresser avec un travail régulier.'], n: ['{S} rencontre des difficultés{apsa}.'],
            x: ['Les résultats{apsa} sont très insuffisants.'] },
          t: { b: ['Connaissances fragiles{apsa}.'], n: ['Difficultés{apsa}.'], x: ['Résultats très insuffisants{apsa}.'] } },
        },
        methodo: {
          4: { p: ['{S} fait preuve d’une excellente démarche scientifique.', '{S} travaille avec beaucoup de rigueur lors des activités pratiques.'], t: ['Excellente démarche scientifique.', 'Travaux pratiques très rigoureux.'] },
          3: { p: ['{S} mène correctement les démarches et les manipulations.', '{S} travaille avec méthode.'], t: ['Bonne démarche scientifique.', 'Travail méthodique.'] },
          2: { p: { b: ['{S} doit encore gagner en rigueur dans les démarches et les manipulations.'], n: ['La démarche scientifique et la rigueur des manipulations restent à améliorer.'],
            x: ['{S} manque de rigueur dans les démarches et les manipulations.'] },
          t: { b: ['Rigueur à développer en activité pratique.'], n: ['Démarche à améliorer.'], x: ['Manque de rigueur.'] } },
          1: { p: { b: ['{S} a besoin d’aide pour construire une démarche et mener une manipulation.'], n: ['{S} peine à construire une démarche scientifique.'],
            x: ['La démarche scientifique n’est pas maîtrisée.'] },
          t: { b: ['Démarche à construire.'], n: ['Démarche peu maîtrisée.'], x: ['Démarche non maîtrisée.'] } },
        },
      },
      objectifs: {
        moteur: ['approfondir et apprendre régulièrement ses leçons', 'consolider les connaissances'],
        methodo: ['gagner en rigueur dans les démarches et les manipulations', 'mieux justifier ses raisonnements'],
      },
      // Fiche bilan (onglet Notes) : points d'appui et axes de progression, [intitulé, phrase].
      fiche: {
        niveauFort: ['Bonnes connaissances', 'maîtrise bien les connaissances'],
        niveauFaible: ['Connaissances fragiles', 'consolider ses connaissances par un travail régulier'],
        methodo: ['Démarche scientifique', 'gagner en rigueur dans les démarches et les manipulations'],
        assiduite: ['Assiduité', 'est assidu{e} et travaille avec régularité'],
      },
    },
  },
};

// Discipline du carnet (EPS si rien n'est choisi, ou si le carnet vient d'une version plus récente avec une discipline inconnue ici).
function disciplineActive() {
  let r = null;
  try { r = typeof Donnees === 'object' ? Donnees.get('reglages', 'discipline') : null; } catch { /* carnet pas encore ouvert */ }
  return DISCIPLINES[r?.code] ? r.code : 'eps';
}
const profil = () => DISCIPLINES[disciplineActive()];
// Un mot du vocabulaire de la discipline (celui de l'EPS s'il manque).
const mot = cle => profil().mots[cle] ?? DISCIPLINES.eps.mots[cle] ?? cle;
const motMin = cle => mot(cle).toLocaleLowerCase('fr'); // (au milieu d'une phrase : « leçons », « séances »)
const activitesDiscipline = () => profil().activites;
// « Autre » : évaluation hors activité (investissement, rôles sociaux…) ; jamais citée comme activité dans les appréciations.
const ACTIVITE_AUTRE = 'Autre';
const estActiviteAutre = a => (a || '').trim().toLocaleLowerCase('fr') === 'autre';
const referentielDuNiveau = niveau => profil().referentielParNiveau[niveau] || profil().referentielDefaut;
// Un référentiel est proposé s'il est personnel, ou officiel pour la discipline.
const referentielDeLaDiscipline = r => !!r && (r.perso || profil().referentiels.includes(r.id));
// Codes de saisie de la discipline, et la lettre à taper pour chacun.
const codesDiscipline = () => profil().codes || DISCIPLINES.eps.codes;
const LETTRES_CODES = { ABS: 'A', DISP: 'D', NE: 'NE', BLE: 'B', MAL: 'M', AUT: 'O', NR: 'R' };
// « <b>A</b> absent · <b>R</b> non rendu… » : codes de la discipline (sans « non noté » dans les séances).
const aideCodes = (pourSeances = false) => codesDiscipline().filter(c => !(pourSeances && c === 'NE'))
  .map(c => `<b>${LETTRES_CODES[c]}</b> ${(typeof CODES === 'object' ? CODES[c] : c).toLocaleLowerCase('fr')}`).join(' · ');
const lettresCodes = (pourSeances = false) => codesDiscipline().filter(c => !(pourSeances && c === 'NE')).map(c => LETTRES_CODES[c]).join(', ');
// Code utilisé dans ce carnet : prévu par la discipline, ou ajouté à la main (⚙ Réglages › Notes).
// (Ex. SVT : ni « Blessé » ni « Dispensé », sauf si l'enseignant les réactive.)
const codeDeLaDiscipline = code => codesDiscipline().includes(code)
  || (typeof reglage === 'function' && (reglage('notes').codesAjoutes || []).includes(code));
const motifsAbsence = () => (codeDeLaDiscipline('BLE') ? 'absent, blessé ou malade' : 'absent ou malade');
const motifsSante = () => (codeDeLaDiscipline('BLE') ? 'blessé / malade' : 'malade');
// « oubli de tenue » / « oublis de matériel »…
const oubliTenue = (n = 1) => `oubli${n > 1 ? 's' : ''} ${mot('deTenue')}`;
const outilDeLaDiscipline = o => !profil().familleOutilsMasquees.includes(o.famille) && !(profil().outilsMasques || []).includes(o.id);
