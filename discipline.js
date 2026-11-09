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
      choisirChamp: 'Choisis le champ d’apprentissage',
      lecons: 'Leçons', // nom de l'onglet des séances
      lecon: 'leçon',
      seance: 'séance',
      aideLecons: 'Crée une séance : les données à relever s’adaptent à l’APSA (temps en CA1, voies et sécurité en escalade, exécution en gym…).',
      modeleActivite: '+ Depuis le modèle de l’APSA',
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
      // (aide « Hugo »)
      laDiscipline: 'l’EPS', deDiscipline: 'd’EPS', enDiscipline: 'en EPS',
      outilsVisite: 'Chronos, équipes, tournois… pour le cours.',
      outilsVersLecon: 'tours, essais, équipes, tirage, tournoi, chrono de natation…',
      exempleSerie: '3 × 500 m', // (même nom pour les séances qui se suivent)
      exempleTitreEval: 'Demi-fond',
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
    familleOutilsMasquees: ['sciences'], // familles d'outils cachées dans cette discipline (ici : les outils de sciences, comme l'ECE)
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
      modeleActivite: '+ Depuis le modèle de séance',
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
      laDiscipline: 'la SVT', deDiscipline: 'de SVT', enDiscipline: 'en SVT',
      outilsVisite: 'ECE, binômes, fiches TP… pour le cours.',
      outilsVersLecon: 'ECE, schéma, gestes techniques, binômes…',
      exempleSerie: 'TP microscope',
      exempleTitreEval: 'TP microscope',
      donneesSeance: 'démarche, manipulation, communication, sécurité, travail rendu…', // (aide : données proposées pour une séance)
      aideNoterSeance: 'la démarche, la manipulation, la communication, la sécurité, le travail rendu',
      aideEvenements: 'sortie de terrain, labo, projet…',
      themeEnPhrase: 'sur le corps humain et la santé', // (aide : le thème cité dans une appréciation)
    },
    // Exemples des champs des outils de sciences, communs à plusieurs disciplines (exempleOutil).
    exemples: {
      grandeur: 'ex. Volume de dioxygène produit', unite: 'ex. mL',
      condition: 'ex. Température — chaque groupe teste une valeur', uniteCondition: 'ex. °C',
      titreTp: 'ex. Dissection de la souris — appareil digestif',
      materiel: 'ex. Lame de verre', technicien: 'ex. Solutions à préparer la veille, microscopes réglés au × 10',
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
            t: ['Connaissances très bien maîtrisées{apsa}.', 'Très bons résultats{apsa}.', 'Résultats remarquables{apsa}.', 'Excellent niveau{apsa}.'] },
          3: { p: ['{S} obtient de bons résultats{apsa}.', '{S} maîtrise bien les connaissances{apsa}.'], t: ['Bons résultats{apsa}.', 'Connaissances bien maîtrisées{apsa}.'] },
          2: { p: { b: ['{S} obtient des résultats encore justes{apsa}, qui peuvent progresser.', 'Les connaissances{apsa} sont encore fragiles, mais peuvent progresser.'],
            n: ['{S} obtient des résultats moyens{apsa}.', 'Les connaissances restent fragiles{apsa}.'],
            x: ['Les résultats{apsa} sont insuffisants au regard des possibilités de {P}.', '{S} doit viser des résultats plus solides{apsa}.', 'Les connaissances{apsa} sont trop fragiles.'] },
          t: { b: ['Connaissances à consolider{apsa}.'], n: ['Résultats moyens{apsa}.', 'Connaissances fragiles{apsa}.'], x: ['Résultats insuffisants{apsa}.', 'Connaissances trop fragiles{apsa}.'] } },
          1: { p: { b: ['{S} rencontre des difficultés{apsa}, mais peut progresser avec un travail régulier.'], n: ['{S} rencontre des difficultés{apsa}.', 'Les connaissances sont lacunaires{apsa}.'],
            x: ['Les résultats{apsa} sont très insuffisants.', '{S} est en grande difficulté{apsa}.', 'Les connaissances{apsa} sont nettement insuffisantes.'] },
          t: { b: ['Connaissances fragiles{apsa}.'], n: ['Difficultés{apsa}.', 'Connaissances lacunaires{apsa}.'], x: ['Résultats très insuffisants{apsa}.', 'Grandes difficultés{apsa}.'] } },
        },
        methodo: {
          4: { p: ['{S} fait preuve d’une excellente démarche scientifique.', '{S} travaille avec beaucoup de rigueur lors des activités pratiques.'], t: ['Excellente démarche scientifique.', 'Travaux pratiques très rigoureux.'] },
          3: { p: ['{S} mène correctement les démarches et les manipulations.', '{S} travaille avec méthode.'], t: ['Bonne démarche scientifique.', 'Travail méthodique.'] },
          2: { p: { b: ['{S} doit encore gagner en rigueur dans les démarches et les manipulations.'], n: ['La démarche scientifique et la rigueur des manipulations restent à améliorer.'],
            x: ['{S} manque de rigueur dans les démarches et les manipulations.', 'La rigueur fait défaut dans les démarches et les manipulations.'] },
          t: { b: ['Rigueur à développer en activité pratique.'], n: ['Démarche à améliorer.'], x: ['Manque de rigueur.'] } },
          1: { p: { b: ['{S} a besoin d’aide pour construire une démarche et mener une manipulation.'], n: ['{S} peine à construire une démarche scientifique.'],
            x: ['La démarche scientifique n’est pas maîtrisée.', '{S} ne parvient pas à mener une démarche scientifique.'] },
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

  pc: {
    id: 'pc', nom: 'PC', nomComplet: 'Physique-chimie', carnet: 'Carnet PC',
    mots: {
      activite: 'Thème',
      activitePlaceholder: 'Choisis ou tape un thème',
      activiteExemple: 'ex. Ondes et signaux',
      sequenceExemple: 'Électricité, transformations chimiques…',
      champ: 'Compétence',
      lecons: 'Séances',
      lecon: 'séance',
      seance: 'séance',
      aideLecons: 'Crée une séance (TP, activité expérimentale, résolution de problème…) : pour chaque élève, relève les compétences de la démarche scientifique, le travail rendu, une observation…',
      modeleActivite: '+ Depuis le modèle de séance',
      dansCetteActivite: 'dans ce thème',
      cetteActivite: 'ce thème',
      deuxActivites: 'Deux thèmes en parallèle ? Ne coche que les cours de celui-ci.',
      titreEvalExemple: 'ex. TP — Dosage par étalonnage',
      competenceLibreExemple: 'compétence du projet de l’équipe de physique-chimie',
      titreSeanceExemple: 'ex. TP — dosage par étalonnage',
      presenceLecons: 'présence aux séances',
      deTenue: 'de matériel',
      oubliCourt: 'Oubli matériel',
      iconeTenue: '🎒',
      tenueReglage: 'oublient souvent leur matériel (blouse, calculatrice…)',
      tenuePhrase: 'venir avec son matériel (blouse, calculatrice…)',
      exercice: 'Séance',
      aideExercice: 'Choisis une séance pour voir l’évolution de chaque élève d’une séance à l’autre.',
      aideSaisieTemps: '',
      tempsManque: 'ces cours manqués',
      remarquesAide: 'santé, aménagements…',
      evalSequenceExemple: 'ex. ECE blanche, séance 6',
      evenementExemple: 'Sortie au planétarium, visite de laboratoire…',
      activiteBareme: 'Type d’épreuve',
      rechercheBareme: 'Rechercher un type d’épreuve…',
      laDiscipline: 'la physique-chimie', deDiscipline: 'de physique-chimie', enDiscipline: 'en physique-chimie',
      outilsVisite: 'ECE, mise en commun, binômes, fiches TP… pour le cours.',
      outilsVersLecon: 'ECE, gestes techniques, binômes, équipes…',
      exempleSerie: 'TP titrage',
      exempleTitreEval: 'TP titrage',
      donneesSeance: 'les compétences de la démarche scientifique, le travail rendu…',
      aideNoterSeance: 'les compétences de la démarche scientifique (s’approprier, analyser, réaliser, valider, communiquer), le travail rendu',
      aideEvenements: 'sortie, visite, labo, projet…',
      themeEnPhrase: 'en ondes et signaux',
    },
    exemples: {
      grandeur: 'ex. Intensité du courant', unite: 'ex. mA',
      condition: 'ex. Tension — chaque groupe teste une valeur', uniteCondition: 'ex. V',
      titreTp: 'ex. Titrage acido-basique',
      materiel: 'ex. Bécher 100 mL', technicien: 'ex. Solutions à préparer la veille, multimètres vérifiés',
      geste: 'ex. Utiliser un spectrophotomètre',
    },
    // Mise en commun (labo.js) : incertitude-type, écart normalisé à une référence, droite de modélisation.
    incertitudes: true,
    // Outils de labo : gestes techniques et dangers propres à la physique-chimie.
    labo: {
      gestesInfo: 'Verrerie jaugée, burette, multimètre… : qui réussit, qui aider',
      gestes: ['Prélever à la pipette jaugée', 'Préparer une solution (fiole jaugée)', 'Réaliser un titrage à la burette', 'Peser avec une balance',
        'Mesurer une tension, une intensité (multimètre)', 'Réaliser un circuit électrique', 'Acquisition : capteur, oscilloscope, ExAO', 'Former une image avec une lentille'],
      dangersMasques: ['coupant', 'biologique'], // (scalpel, matériel biologique : propres à la SVT)
      dangersTextes: {
        verre: 'Verrerie : signaler tout bris au professeur, ne rien ramasser à la main',
        electrique: 'Circuits électriques : monter hors tension, faire vérifier avant de brancher ; mains sèches, pas d’eau à côté',
      },
      dangersEnPlus: [
        ['laser', '🔦', 'Laser : ne jamais regarder le faisceau ni son reflet, rester hors de son trajet'],
        ['hotte', '💨', 'Vapeurs, gaz : manipuler sous la hotte, flacons rebouchés aussitôt'],
      ],
    },
    bilans: true, // onglet Notes : 🎯 Compétences, 🧭 Socle (collège), 📄 Travail rendu (bilansvt.js)
    typesEvenements: [
      { id: 'sortie', nom: 'Sortie, visite', couleur: '#0f6670' },
      { id: 'labo', nom: 'Labo (préparation, commande)', couleur: '#a3306e' },
      { id: 'projet', nom: 'Projet / concours', couleur: '#1f5f9e' },
      { id: 'reunion', nom: 'Réunion', couleur: '#5b3fa0' },
      { id: 'autre', nom: 'Autre', couleur: '#3d4a52' },
    ],
    // Thèmes des programmes (suggestions : on peut taper n'importe quel titre).
    activites: [
      // Seconde, première et terminale (spécialité) : BO spécial n°1 du 22/01/2019, BO spécial n°8 du 25/07/2019
      'Constitution et transformations de la matière', 'Mouvement et interactions', 'L’énergie : conversions et transferts', 'Ondes et signaux',
      // Enseignement scientifique (1re, Tle)
      'Une longue histoire de la matière', 'Le Soleil, notre source d’énergie', 'La Terre, un astre singulier',
      'Science, climat et société', 'Le futur des énergies', 'Projet expérimental et numérique',
      // Collège (cycle 4, BO n°31 du 30/07/2020)
      'Organisation et transformations de la matière', 'L’énergie, ses transferts et ses conversions', 'Des signaux pour observer et communiquer',
      // 6e : Sciences et technologie (cycle 3)
      'Matière, mouvement, énergie et information', 'Les objets techniques au cœur de la société',
      // Types de séance
      'Travaux pratiques', 'Activité expérimentale', 'Résolution de problème', 'Évaluation des compétences expérimentales (ECE)',
    ],
    referentiels: ['pcLycee', 'ensSci', 'pcCycle4', 'sciTechCycle3'],
    referentielParNiveau: { '6e': 'sciTechCycle3', '5e': 'pcCycle4', '4e': 'pcCycle4', '3e': 'pcCycle4', '2nde': 'pcLycee', '1re': 'pcLycee', 'Tle': 'pcLycee' },
    referentielDefaut: 'pcLycee',
    familleOutilsMasquees: ['apsa'],
    outilsMasques: ['tours', 'intervalles', 'marque', 'tournoi', 'essais', 'vma', 'tableau', 'video'],
    champsSequence: false,
    codes: ['ABS', 'NR', 'NE', 'MAL', 'AUT'],
    // Modèle de séance : au lycée, les cinq compétences de la démarche scientifique ; au collège, celles du cycle 4.
    modeleSeance: niveau => [
      ...(['6e', '5e', '4e', '3e'].includes(niveau) ? [
        { nom: 'Pratiquer des démarches scientifiques', type: 'echelle' },
        { nom: 'Concevoir, réaliser (dispositif, mesure)', type: 'echelle' },
        { nom: 'Pratiquer des langages (compte rendu, schéma)', type: 'echelle' },
        { nom: 'Sécurité au laboratoire', type: 'echelle' },
      ] : [
        { nom: 'S’approprier', type: 'echelle' },
        { nom: 'Analyser / Raisonner', type: 'echelle' },
        { nom: 'Réaliser (manipulation, sécurité)', type: 'echelle' },
        { nom: 'Valider (résultats, incertitudes)', type: 'echelle' },
        { nom: 'Communiquer', type: 'echelle' },
      ]),
      { nom: 'Travail rendu', type: 'choix', options: ['Rendu', 'En retard', 'Non rendu'] },
      { nom: 'Observation', type: 'texte' },
    ],
    // Appréciations : « motricité » → connaissances et résultats ; « méthodologie » → démarche expérimentale.
    appreciations: {
      noms: { moteur: { nom: 'Connaissances', aide: 'résultats, notes' }, methodo: { nom: 'Démarche', aide: 'démarche expérimentale, mesures, calculs, sécurité' } },
      phrases: {
        attitude: {
          4: { p: ['{S} s’investit pleinement dans le travail demandé.', '{S} fait preuve d’un engagement exemplaire en classe.', '{S} montre un investissement remarquable et constant.', 'L’investissement en classe est exemplaire.'],
            t: ['Investissement exemplaire.', 'Engagement remarquable.'] },
          3: { p: ['{S} s’investit avec sérieux en classe.', '{S} montre un engagement régulier.', '{S} participe activement en classe.', 'Le travail en classe est sérieux et régulier.'],
            t: ['Investissement sérieux.', 'Travail sérieux en classe.'] },
        },
        moteur: {
          4: { p: ['{S} maîtrise très bien les notions{apsa}.', '{S} obtient de très bons résultats{apsa}.', '{S} obtient des résultats remarquables{apsa}.', 'Les connaissances sont solidement maîtrisées{apsa}.'],
            t: ['Notions très bien maîtrisées{apsa}.', 'Très bons résultats{apsa}.', 'Résultats remarquables{apsa}.', 'Excellent niveau{apsa}.'] },
          3: { p: ['{S} obtient de bons résultats{apsa}.', '{S} maîtrise bien les notions{apsa}.'], t: ['Bons résultats{apsa}.', 'Notions bien maîtrisées{apsa}.'] },
          2: { p: { b: ['{S} obtient des résultats encore justes{apsa}, qui peuvent progresser.', 'Les connaissances{apsa} sont encore fragiles, mais peuvent progresser.'],
            n: ['{S} obtient des résultats moyens{apsa}.', 'Les connaissances restent fragiles{apsa}.'],
            x: ['Les résultats{apsa} sont insuffisants au regard des possibilités de {P}.', '{S} doit viser des résultats plus solides{apsa}.', 'Les connaissances{apsa} sont trop fragiles.'] },
          t: { b: ['Connaissances à consolider{apsa}.'], n: ['Résultats moyens{apsa}.', 'Connaissances fragiles{apsa}.'], x: ['Résultats insuffisants{apsa}.', 'Connaissances trop fragiles{apsa}.'] } },
          1: { p: { b: ['{S} rencontre des difficultés{apsa}, mais peut progresser avec un travail régulier.'], n: ['{S} rencontre des difficultés{apsa}.', 'Les connaissances sont lacunaires{apsa}.'],
            x: ['Les résultats{apsa} sont très insuffisants.', '{S} est en grande difficulté{apsa}.', 'Les connaissances{apsa} sont nettement insuffisantes.'] },
          t: { b: ['Connaissances fragiles{apsa}.'], n: ['Difficultés{apsa}.', 'Connaissances lacunaires{apsa}.'], x: ['Résultats très insuffisants{apsa}.', 'Grandes difficultés{apsa}.'] } },
        },
        methodo: {
          4: { p: ['{S} mène les démarches expérimentales avec beaucoup de rigueur.', '{S} travaille avec une grande rigueur, en TP comme dans les calculs.'], t: ['Excellente démarche expérimentale.', 'Grande rigueur en TP et dans les calculs.'] },
          3: { p: ['{S} mène correctement les démarches et les mesures.', '{S} travaille avec méthode.'], t: ['Bonne démarche expérimentale.', 'Travail méthodique.'] },
          2: { p: { b: ['{S} doit encore gagner en rigueur dans les mesures et les calculs.'], n: ['La démarche expérimentale et la rigueur des calculs restent à améliorer.'],
            x: ['{S} manque de rigueur dans les manipulations et les calculs.', 'La rigueur fait défaut dans les manipulations et les calculs.'] },
          t: { b: ['Rigueur à développer en TP et dans les calculs.'], n: ['Démarche à améliorer.'], x: ['Manque de rigueur.'] } },
          1: { p: { b: ['{S} a besoin d’aide pour construire une démarche et mener une mesure.'], n: ['{S} peine à construire une démarche expérimentale.'],
            x: ['La démarche expérimentale n’est pas maîtrisée.', '{S} ne parvient pas à mener une démarche expérimentale.'] },
          t: { b: ['Démarche à construire.'], n: ['Démarche peu maîtrisée.'], x: ['Démarche non maîtrisée.'] } },
        },
      },
      objectifs: {
        moteur: ['apprendre régulièrement ses leçons et refaire les exercices', 'consolider les connaissances'],
        methodo: ['gagner en rigueur dans les mesures et les calculs', 'mieux justifier ses raisonnements'],
      },
      fiche: {
        niveauFort: ['Bonnes connaissances', 'maîtrise bien les notions'],
        niveauFaible: ['Connaissances fragiles', 'consolider ses connaissances par un travail régulier'],
        methodo: ['Démarche expérimentale', 'gagner en rigueur dans les mesures, les calculs et les manipulations'],
        assiduite: ['Assiduité', 'est assidu{e} et travaille avec régularité'],
      },
    },
  },
};

// École élémentaire : une classe, toutes les matières. Les matières sont les « champs » du référentiel (eval.ca, séance.ca) ;
// le champ `apsa` garde le thème (facultatif). Appel par demi-journée, cahier journal et livret : ecole.js.
DISCIPLINES.ecole = {
  id: 'ecole', nom: 'École', nomChoix: 'École beta', nomComplet: 'École élémentaire, du CP au CM2', carnet: 'Carnet École', ecole: true,
  classeExemple: 'ex. CE1-CE2 de Mme Martin',
  mots: {
    ...DISCIPLINES.pc.mots,
    activite: 'Thème', activitePlaceholder: 'Facultatif : choisis ou tape un thème', activiteExemple: 'ex. Les fractions',
    sequenceExemple: 'Les fractions, le Moyen Âge…', champ: 'Matière', choisirChamp: 'Choisis la matière',
    lecons: 'Cahier journal', lecon: 'séance', seance: 'séance',
    aideLecons: 'Note le déroulé de la journée : horaire, matière, objectif, puis ce qui s’est passé.',
    titreEvalExemple: 'ex. Dictée n° 3', competenceLibreExemple: 'compétence du projet d’école',
    titreSeanceExemple: 'ex. Lecture : le personnage principal', presenceLecons: 'présence',
    tenueReglage: 'oublient souvent leur matériel', tenuePhrase: 'venir avec son matériel',
    aideExercice: 'Choisis une séance.', tempsManque: 'ces temps de classe manqués',
    evalSequenceExemple: 'ex. Évaluation de fin de séquence', evenementExemple: 'Sortie à la médiathèque, piscine, kermesse…',
    laDiscipline: 'la classe', deDiscipline: 'de la classe', enDiscipline: 'en classe',
    outilsVisite: 'Chrono, groupes, tirage au sort… pour la classe.', outilsVersLecon: 'chrono, équipes, tirage…',
    exempleSerie: 'Dictée', exempleTitreEval: 'Dictée n° 3', donneesSeance: 'objectif, déroulement, bilan…',
    aideNoterSeance: 'l’objectif, le déroulement et le bilan', aideEvenements: 'sortie, piscine, projet…', themeEnPhrase: 'en numération',
  },
  niveaux: ['CP', 'CE1', 'CE2', 'CM1', 'CM2', 'CP-CE1', 'CE1-CE2', 'CE2-CM1', 'CM1-CM2', 'Plusieurs niveaux'],
  champsSequence: false,
  activites: ['Lecture', 'Écriture', 'Grammaire', 'Orthographe', 'Lexique', 'Numération', 'Calcul', 'Résolution de problèmes', 'Fractions', 'Géométrie', 'Mesures', 'Natation', 'Jeux collectifs'],
  referentiels: ['ecoleCycle2', 'ecoleCycle3'],
  referentielParNiveau: { CP: 'ecoleCycle2', CE1: 'ecoleCycle2', CE2: 'ecoleCycle2', 'CP-CE1': 'ecoleCycle2', 'CE1-CE2': 'ecoleCycle2', 'CE2-CM1': 'ecoleCycle2', CM1: 'ecoleCycle3', CM2: 'ecoleCycle3', 'CM1-CM2': 'ecoleCycle3' },
  referentielDefaut: 'ecoleCycle2',
  familleOutilsMasquees: ['apsa', 'sciences'],
  outilsMasques: ['chrono', 'tours', 'intervalles', 'marque', 'tournoi', 'essais', 'vma', 'tableau', 'video'], // (pas d'outils de sport : ils restent en EPS)
  nomsFamillesOutils: { temps: 'Le temps', groupes: 'La parole et les groupes' }, // (outils.js › nomFamilleOutil)
  outilsRenommes: { equipes: { nom: 'Groupes de travail', info: 'Groupes hétérogènes ou par affinité, sans les absents' } }, // (outils.js › titreOutil, infoOutil)
  ongletsMasques: ['baremes', 'pp'], // (pas de barèmes de discipline ni de professeur principal à l'école)
  codes: ['ABS', 'NE', 'MAL', 'AUT'],
  modeleSeance: () => [],
  typesEvenements: [
    { id: 'sortie', nom: 'Sortie', couleur: '#0f6670' },
    { id: 'piscine', nom: 'Piscine, sport', couleur: '#1f5f9e' },
    { id: 'projet', nom: 'Projet de classe ou d’école', couleur: '#a3306e' },
    { id: 'reunion', nom: 'Réunion (conseil de maîtres, parents…)', couleur: '#5b3fa0' },
    { id: 'autre', nom: 'Autre', couleur: '#3d4a52' },
  ],
  // Appréciations d'école (appreciations.js) : rubriques à elles, phrases pour les familles du primaire, matières
  // citées (« en français ») au lieu d'une activité, pas de comparaison avec la classe, texte toujours à la 3e personne.
  appreciations: {
    sansTutoiement: true, // (texte lu par les familles, comme le livret : toujours à la 3e personne)
    sansClasse: true, // (ni « en retrait par rapport à la classe », ni « parmi les meilleurs »)
    apprendre: true, // (l'appli retient les mots remplacés et les phrases ajoutées par l'enseignant : appreciations.js › apprisAppr)
    textesDifferents: true, // (dans une même classe, les élèves se partagent les tournures : deux voisins n'ont pas la même phrase)
    // Rubriques du carnet École, dans l'ordre proposé (les apprentissages d'abord : faute de place, ce sont les
    // dernières qui sautent) ; cochées d'origine : toutes sauf les résultats chiffrés et les progrès.
    rubriques: ['competences', 'consolider', 'attitude', 'comportement', 'autonomie', 'methodo', 'moteur', 'progression', 'objectif'],
    actives: ['competences', 'consolider', 'attitude', 'comportement', 'autonomie', 'methodo', 'objectif'],
    longueur: 350, // (longueur d'origine : plus de rubriques qu'en EPS, et pas la limite d'École Directe)
    sansVigilance: ['moteur'], // (les notes chiffrées ne reviennent pas d'elles-mêmes : les apprentissages en parlent déjà)
    noms: {
      attitude: { nom: 'Participation', aide: 'écoute, envie d’apprendre, présence' },
      comportement: { nom: 'Comportement', aide: 'règles de vie, camarades' },
      autonomie: { nom: 'Autonomie', aide: 'se mettre au travail sans aide' },
      methodo: { nom: 'Soin', aide: 'cahiers, présentation, organisation' },
      competences: { nom: 'Apprentissages', aide: 'degrés des domaines, matière la plus réussie' },
      consolider: { nom: 'À consolider', aide: 'la matière la plus fragile' },
      moteur: { nom: 'Résultats', aide: 'notes chiffrées' },
      progression: { nom: 'Progrès', aide: 'évolution sur la période' },
      objectif: { nom: 'Conseil', aide: 'piste pour la suite' },
    },
    // Mots-clés cherchés dans les observations (sans accents ; les tournures négatives d'abord, voir motsCles).
    mots: {
      autonomie: { moins: ['pas autonome', 'peu autonome', 'manque d\'autonomie', 'pas d\'autonomie', 'besoin d\'aide', 'besoin de l\'adulte', 'attend l\'aide', 'attend qu\'on', 'dependant', 'ne se met pas au travail', 'lent a se mettre'],
        plus: ['autonome', 'autonomie', 'travaille seul', 'sans aide', 'initiative', 'se met vite au travail'] },
      methodo: { moins: ['peu soigne', 'pas soigne', 'manque de soin', 'sans soin', 'brouillon', 'mal tenu', 'mal presente', 'desordre', 'desorganise', 'oublie ses affaires', 'perd ses affaires', 'oubli du materiel'],
        plus: ['soigne', 'avec soin', 'bien tenu', 'bien presente', 'organise', 'travail propre', 'cahiers propres', 'cahier propre'] },
    },
    // Portrait de l'élève (pastilles de la fiche, appreciations.js › PORTRAIT) : ce qui rend l'appréciation humaine.
    // {E} accord (« e » au féminin), {X} soucieux / soucieuse, {LUI} lui / elle, {LE} le / la, {UN} un / une.
    // Qualité : adj [masculin, féminin] (réunies dans « Clara est une élève consciencieuse et volontaire »),
    // nom (sexe inconnu : « Léo fait preuve de curiosité »), ou une phrase à elle.
    portrait: {
      qualites: [
        { id: 'consciencieux', nom: 'Consciencieux·se', adj: ['consciencieux', 'consciencieuse'], qualite: 'application' },
        { id: 'serieux', nom: 'Sérieux·se', adj: ['sérieux', 'sérieuse'], qualite: 'sérieux' },
        { id: 'volontaire', nom: 'Volontaire', adj: ['volontaire', 'volontaire'], qualite: 'bonne volonté' },
        { id: 'curieux', nom: 'Curieux·se', adj: ['curieux', 'curieuse'], qualite: 'curiosité' },
        { id: 'attentif', nom: 'Attentif·ve', adj: ['attentif', 'attentive'], qualite: 'attention' },
        { id: 'perseverant', nom: 'Persévérant·e', adj: ['persévérant', 'persévérante'], qualite: 'persévérance' },
        { id: 'dynamique', nom: 'Dynamique', adj: ['dynamique', 'dynamique'], qualite: 'dynamisme' },
        { id: 'motive', nom: 'Motivé·e', adj: ['motivé', 'motivée'], qualite: 'motivation' },
        { id: 'reflechi', nom: 'Réfléchi·e', adj: ['réfléchi', 'réfléchie'], qualite: 'réflexion' },
        { id: 'creatif', nom: 'Créatif·ve', adj: ['créatif', 'créative'], qualite: 'créativité' },
        { id: 'gentil', nom: 'Gentil·le', adj: ['gentil', 'gentille'], qualite: 'gentillesse' },
        { id: 'calme', nom: 'Calme', adj: ['calme', 'calme'], qualite: 'calme' },
        { id: 'poli', nom: 'Poli·e', adj: ['poli', 'polie'], qualite: 'politesse' },
        { id: 'souriant', nom: 'Souriant·e', phrases: ['{S} participe à toutes les activités avec le sourire.', '{S} vient à l’école avec le sourire et la bonne humeur.', 'Sa bonne humeur est un vrai plaisir pour la classe.'] },
        { id: 'plaisir', nom: 'Plaisir d’apprendre', phrases: ['{S} montre un réel plaisir à apprendre.', '{S} a une belle envie d’apprendre.', 'Son envie d’apprendre fait plaisir à voir.'] },
        { id: 'conseils', nom: 'À l’écoute des conseils', phrases: ['{S} tient compte des conseils pour donner le meilleur de {LUI}-même.', 'Très à l’écoute, {s} sait tenir compte des conseils donnés.', '{S} écoute les conseils et sait en tirer profit.'] },
        { id: 'mieux', nom: 'Soucieux·se de bien faire', phrases: ['Toujours soucieu{X} de faire de son mieux, {s} met tout en œuvre pour réussir.', '{S} cherche toujours à bien faire.', '{S} met beaucoup de cœur à bien faire.'] },
        { id: 'moteur', nom: 'Moteur de la classe', phrases: ['{S} est un élément moteur de la classe.', '{S} entraîne volontiers la classe par son enthousiasme.'] },
        { id: 'entraide', nom: 'Aide les autres', phrases: ['{S} aide volontiers ses camarades.', '{S} se montre toujours prêt{E} à aider ses camarades.', 'Toujours prêt{E} à rendre service, {s} aide volontiers les autres.'] },
        { id: 'camarade', nom: 'Bon·ne camarade', phrases: ['{S} est apprécié{E} de ses camarades.', '{S} entretient de bonnes relations avec ses camarades.', 'Ses camarades apprécient sa présence.'] },
        { id: 'oral', nom: 'Belle participation orale', phrases: ['Sa participation orale est très appréciée.', 'Ses interventions à l’oral enrichissent la classe.', '{S} prend volontiers la parole et ses idées sont pertinentes.'] },
        { id: 'lecteur', nom: 'Aime lire', phrases: ['{S} a un vrai goût pour la lecture.', '{S} prend beaucoup de plaisir à lire.'] },
      ],
      // Points d'attention : une phrase, et les conseils qui vont avec (à la place du conseil des rubriques ; sans
      // reprendre les mots de la phrase). leve : ce qui est dit quand la pastille de la période précédente est retirée
      // (lien entre les périodes ; {LEPREC} = « le premier trimestre », {AUPREC} = « qu’au premier trimestre »).
      attention: [
        { id: 'confiance', nom: 'Manque de confiance', phrases: ['C’est {UN} élève qui veut bien faire, mais qui manque encore de confiance en {LUI}.', '{S} manque encore de confiance en {LUI}.', '{S} doute encore de {LUI}.', 'C’est {UN} élève qui veut bien faire, mais qui doute encore de {LUI}.'], buts: ['croire davantage en ses capacités', 'oser se lancer'],
          leve: ['{S} a pris confiance en {LUI} depuis {LEPREC}.', '{S} prend peu à peu confiance en {LUI}.'] },
        { id: 'etourderie', nom: 'Étourderie', phrases: ['{S} commet encore des erreurs d’étourderie.', 'Des erreurs d’étourderie gênent encore son travail.'], buts: ['prendre le temps de se relire', 'relire son travail avec attention'],
          leve: ['Les erreurs d’étourderie se font plus rares depuis {LEPREC}.', '{S} a appris à se relire : les étourderies se font plus rares.'] },
        { id: 'decourage', nom: 'Se décourage vite', phrases: ['{S} se décourage parfois face à la difficulté.', 'Face à la difficulté, {s} baisse encore parfois les bras.'], buts: ['ne pas baisser les bras', 'garder courage quand un exercice résiste'],
          leve: ['{S} se décourage moins vite face à la difficulté depuis {LEPREC}.', '{S} persévère davantage quand un exercice résiste.'] },
        { id: 'lent', nom: 'Lent·e à démarrer', phrases: ['{S} met parfois du temps à démarrer.', '{S} est encore lent{E} à se mettre au travail.'], buts: ['gagner en rapidité', 'se mettre au travail plus rapidement'],
          leve: ['{S} se met désormais plus rapidement au travail.', '{S} a gagné en rapidité depuis {LEPREC}.'] },
        { id: 'distrait', nom: 'Se laisse distraire', phrases: ['{S} se laisse encore facilement distraire.', 'Son attention se disperse encore facilement.'], buts: ['garder sa concentration jusqu’au bout', 'rester concentré{E} jusqu’au bout du travail'],
          leve: ['{S} est désormais plus concentré{E} en classe.', 'La concentration s’est nettement améliorée depuis {LEPREC}.'] },
        { id: 'bavard', nom: 'Bavardages', phrases: ['Les bavardages gênent parfois son travail.', '{S} bavarde encore trop souvent.'], buts: ['se concentrer davantage sur son travail', 'mieux écouter en classe'],
          leve: ['Les bavardages ont nettement diminué depuis {LEPREC}.', '{S} bavarde beaucoup moins {AUPREC}.'] },
        { id: 'agite', nom: 'A du mal à rester calme', phrases: ['{S} a du mal à rester calme en classe.', '{S} a encore du mal à tenir en place.'], buts: ['canaliser son énergie'],
          leve: ['{S} est plus calme en classe depuis {LEPREC}.', '{S} canalise mieux son énergie depuis {LEPREC}.'] },
        { id: 'timide', nom: 'Timide à l’oral', phrases: ['{S} n’ose pas encore beaucoup prendre la parole.', 'La prise de parole reste difficile pour {LUI}.'], buts: ['oser prendre la parole', 'participer davantage à l’oral'],
          leve: ['{S} ose davantage prendre la parole depuis {LEPREC}.', 'La prise de parole devient plus facile pour {LUI}.'] },
        { id: 'lecons', nom: 'Leçons pas apprises', phrases: ['Les leçons ne sont pas toujours apprises à la maison.', '{S} n’apprend pas toujours ses leçons.'], buts: ['apprendre ses leçons chaque soir', 'revoir chaque soir le travail de la journée'],
          leve: ['Les leçons sont désormais mieux apprises à la maison.', '{S} apprend ses leçons plus régulièrement depuis {LEPREC}.'] },
        { id: 'oublis', nom: 'Oublie son matériel', phrases: ['{S} oublie souvent son matériel.', 'Les oublis de matériel gênent parfois son travail.'], buts: ['vérifier son cartable chaque soir', 'penser à apporter son matériel'],
          leve: ['Les oublis de matériel se font plus rares depuis {LEPREC}.'] },
        { id: 'vite', nom: 'Travaille trop vite', phrases: ['{S} travaille parfois trop vite, au détriment de la qualité.', 'Par précipitation, {s} bâcle encore parfois son travail.'], buts: ['prendre le temps de bien faire'],
          leve: ['{S} prend désormais davantage le temps de bien faire.'] },
        { id: 'emotions', nom: 'Gère mal ses émotions', phrases: ['{S} a parfois du mal à gérer ses émotions.', 'La gestion des émotions reste parfois difficile pour {LUI}.'], buts: ['mettre des mots sur ses émotions', 'exprimer sa colère par des mots'],
          leve: ['{S} gère mieux ses émotions depuis {LEPREC}.', '{S} apprend peu à peu à gérer ses émotions.'] },
        { id: 'conflits', nom: 'Conflits avec les camarades', phrases: ['{S} entre parfois en conflit avec ses camarades.', 'Les relations avec les camarades sont parfois tendues.'], buts: ['régler les désaccords par la parole', 'mieux respecter ses camarades'],
          leve: ['Les relations avec les camarades se sont apaisées depuis {LEPREC}.', '{S} règle mieux ses désaccords par la parole.'] },
      ],
      // pol : sens de la phrase (+1 point fort, −1 difficulté), pour les liaisons « Néanmoins », « En revanche ».
      situations: [
        { id: 'nouveau', nom: 'Nouveau·elle dans l’école', pol: 1, phrases: ['{S} s’est bien intégré{E} dans sa nouvelle école.', '{S} a trouvé sa place dans sa nouvelle école.'] },
        { id: 'arrive', nom: 'Arrivé·e en cours d’année', pol: 1, phrases: ['Arrivé{E} en cours d’année, {s} a su trouver sa place dans la classe.', '{S} s’est bien adapté{E} à sa nouvelle classe.'] },
        { id: 'murit', nom: 'A beaucoup mûri', pol: 1, phrases: ['{S} a beaucoup mûri.', '{S} a gagné en maturité.'] },
        { id: 'lecture', nom: 'La lecture se met en place', phrases: ['La lecture se met en place.', 'L’apprentissage de la lecture se met en place.'] },
        { id: 'aide', nom: 'Aide personnalisée (APC, PPRE)', pol: 1, phrases: ['{S} tire profit de l’aide personnalisée.', 'L’aide apportée en petit groupe lui est profitable.'] },
        { id: 'passageres', nom: 'Difficultés passagères', pol: 1, phrases: ['Sa persévérance lui permet de surmonter ses difficultés passagères.', 'Ses efforts lui permettent de surmonter ses difficultés passagères.'] },
        { id: 'absences', nom: 'Beaucoup d’absences', pol: -1, phrases: ['De nombreuses absences ont freiné ses apprentissages.', 'Des absences répétées ont gêné ses apprentissages.'] },
        { id: 'pret', nom: 'Prêt·e pour la classe suivante', pol: 1, phrases: ['{S} est prêt{E} pour la classe suivante.', '{S} aborde la classe supérieure avec de bons atouts.'] },
        { id: 'college', nom: 'Prêt·e pour le collège', pol: 1, phrases: ['{S} est prêt{E} pour l’entrée au collège.', '{S} a tous les atouts pour réussir au collège.'] },
      ],
    },
    // Lien entre les périodes (case « Faire le lien avec la période précédente ») : une rubrique de comportement qui
    // change nettement depuis la période précédente (de 2 ou moins à 3 ou plus, ou l'inverse), la matière fragile qui
    // ne l'est plus. {LEPREC} = « le premier trimestre », {AUPREC} = « qu’au premier trimestre », {avant} = « en mathématiques ».
    liens: {
      mieux: {
        attitude: ['{S} participe bien davantage depuis {LEPREC}.', 'La participation a nettement progressé depuis {LEPREC}.'],
        comportement: ['Le comportement s’est nettement amélioré depuis {LEPREC}.', '{S} respecte désormais bien mieux les règles de la classe.'],
        autonomie: ['{S} a gagné en autonomie depuis {LEPREC}.', 'L’autonomie a bien progressé depuis {LEPREC}.'],
        methodo: ['Le soin des cahiers s’est nettement amélioré depuis {LEPREC}.', '{S} soigne désormais davantage son travail.'],
      },
      moins: {
        attitude: ['La participation est moins régulière {AUPREC}.', '{S} participe moins {AUPREC}.'],
        comportement: ['Le comportement est moins adapté {AUPREC}.', '{S} respecte moins bien les règles de la classe {AUPREC}.'],
        autonomie: ['{S} est moins autonome {AUPREC}.', 'L’autonomie est en recul depuis {LEPREC}.'],
        methodo: ['Le travail est moins soigné {AUPREC}.', 'Le soin des cahiers est en recul depuis {LEPREC}.'],
      },
      matiere: ['Les efforts{avant} ont porté leurs fruits depuis {LEPREC}.', 'Les progrès{avant} sont nets depuis {LEPREC}.'],
    },
    // Ouverture (case « Commencer par un bilan ») : selon le moment de l'année. {Ce} = « ce trimestre »…
    ouvertures: {
      debut: { 4: ['Excellent début d’année !', 'Très beau début d’année !', 'Un début d’année remarquable !'], 3: ['Bon début d’année.', 'Un bon début d’année.', 'Un début d’année réussi.'],
        2: { b: ['Un début d’année encourageant.', 'Un début d’année plein de promesses.'], n: ['Un début d’année en demi-teinte.', 'Un début d’année contrasté.'], x: ['Un début d’année trop juste.', 'Un début d’année insuffisant.'] }, 1: ['Un début d’année difficile.', '{S} a rencontré des difficultés en ce début d’année.'] },
      suite: { 4: ['Excellent travail tout au long de {ce} !', 'Très beau travail {ce} !', 'De très beaux résultats {ce} !'], 3: ['Bon travail tout au long de {ce}.', 'Du bon travail {ce}.', 'De bons résultats tout au long de {ce}.'],
        2: { b: ['Des efforts encourageants {ce}.', 'Un travail qui avance {ce}.'], n: ['Des résultats inégaux {ce}.', 'Un travail contrasté {ce}.'], x: ['Un travail trop juste {ce}.', 'Un travail insuffisant {ce}.'] }, 1: ['{S} a rencontré des difficultés {ce}.'] },
      annee: { 4: ['Excellente année !', 'Très belle année !', 'Une année remarquable !'], 3: ['Une bonne année de travail.', 'Une belle année.', 'Une année réussie.'],
        2: { b: ['Une année encourageante.', 'Une année de progrès.'], n: ['Une année en demi-teinte.', 'Une année contrastée.'], x: ['Une année trop juste.', 'Une année insuffisante.'] }, 1: ['{S} a rencontré des difficultés cette année.', 'Une année difficile.'] },
      // Après la 1re période, si les apprentissages se maintiennent à un bon niveau ou progressent.
      pareil: ['{S} obtient des résultats tout aussi {BONS} {AUPREC}.', '{S} confirme ses {BONS} résultats.'],
      mieux: ['{S} a bien progressé depuis {LEPREC}.', 'Les progrès sont nets depuis {LEPREC}.'],
    },
    // Fin dite par l'enseignant (case « Parler en mon nom »), et souhaits de fêtes (période qui finit en décembre).
    fins: { 4: ['Je {LE} félicite.', 'Félicitations !', 'Je {LE} félicite et l’encourage à poursuivre.'], 3: ['Je {LE} félicite et l’encourage à poursuivre.', 'Je l’encourage à continuer ainsi.', 'Je compte sur {LUI} pour continuer sur cette voie.'],
      2: ['Je l’encourage à poursuivre ses efforts.', 'J’ai toute confiance en {LUI}.', 'Je compte sur {LUI} pour continuer ses efforts.', 'Je crois en {LUI}.'],
      1: ['Je l’encourage à ne pas se décourager.', 'J’ai toute confiance en {LUI}.', 'Je crois en {LUI}.'] },
    fetes: ['Joyeuses fêtes de fin d’année !', 'Très belles fêtes de fin d’année !'],
    // Bilan d'ouverture : {ce} = « ce trimestre », « cette période », « cette année ».
    bilans: {
      4: ['{S} a très bien réussi {ce}.', '{S} a fait un excellent travail {ce}.'],
      3: ['{S} a bien réussi {ce}.', '{S} a fait du bon travail {ce}.'],
      2: { b: ['{S} a fourni des efforts encourageants {ce}.', '{S} a avancé {ce}, avec des acquis encore à consolider.'], n: ['{S} a obtenu des résultats inégaux {ce}.'], x: ['{S} pourrait mieux faire {ce}.'] },
      1: { b: ['{S} a rencontré des difficultés {ce}.'], n: ['{S} a eu des difficultés {ce}.'], x: ['{S} a eu beaucoup de difficultés {ce}.'] },
    },
    phrases: {
      attitude: {
        4: { p: ['{S} participe activement et avec beaucoup d’envie.', '{S} montre une très belle curiosité et participe beaucoup.', 'La participation en classe est excellente.', '{S} s’investit pleinement dans toutes les activités.', '{S} apporte beaucoup aux échanges.'], t: ['Participation excellente.', 'Très belle curiosité.'] },
        3: { p: ['{S} participe volontiers en classe.', '{S} écoute avec attention et participe.', 'La participation en classe est régulière.', '{S} s’implique volontiers dans le travail proposé.', '{S} participe avec envie aux activités.', '{S} montre de l’intérêt pour ce qui est proposé.'], t: ['Bonne participation.', 'Écoute attentive.'] },
        2: { p: { b: ['{S} participe, mais pourrait oser prendre la parole plus souvent.', 'L’attention en classe reste encore fragile.'], n: ['La participation en classe reste irrégulière.', '{S} participe de façon irrégulière.'], x: ['{S} doit participer davantage en classe.', 'L’attention en classe est trop souvent dispersée.'] },
          t: { b: ['Participation à encourager.'], n: ['Participation irrégulière.'], x: ['Participation insuffisante.'] } },
        1: { p: { b: ['{S} a encore du mal à entrer dans les activités de la classe.'], n: ['{S} participe très peu en classe.'], x: ['La participation en classe est très insuffisante.', '{S} ne participe presque pas en classe.'] },
          t: { b: ['Participation à construire.'], n: ['Très peu de participation.'], x: ['Participation très insuffisante.'] } },
      },
      comportement: {
        4: { p: ['{S} a un comportement exemplaire, en classe comme en récréation.', 'Le comportement est exemplaire, avec les camarades comme avec les adultes.'], t: ['Comportement exemplaire.'] },
        3: { p: ['{S} respecte les règles de la classe.', '{S} a un bon comportement en classe.', 'Le comportement en classe est adapté et respectueux.'], t: ['Bon comportement.', 'Règles de vie respectées.'] },
        2: { p: { b: ['{S} doit encore apprendre à mieux respecter les règles de la classe.'], n: ['Le respect des règles de vie est parfois difficile.'], x: ['{S} doit mieux respecter les règles de la classe.'] },
          t: { b: ['Règles de vie à mieux respecter.'], n: ['Comportement parfois à reprendre.'], x: ['Comportement à améliorer.'] } },
        1: { p: { b: ['Le respect des règles de vie doit devenir une priorité pour apprendre sereinement.'], n: ['Le comportement pose souvent problème en classe.'], x: ['Le comportement gêne le travail de la classe.', '{S} ne respecte pas les règles de la classe.'] },
          t: { b: ['Comportement à améliorer nettement.'], n: ['Comportement difficile.'], x: ['Comportement inadapté.'] } },
      },
      autonomie: {
        4: { p: ['{S} travaille avec une grande autonomie.', '{S} se met au travail sans attendre et avance avec assurance.'], t: ['Très bonne autonomie.'] },
        3: { p: ['{S} travaille de façon autonome.', '{S} sait se mettre au travail sans aide.', 'L’autonomie dans le travail est bonne.'], t: ['Bonne autonomie.'] },
        2: { p: { b: ['{S} gagne peu à peu en autonomie.'], n: ['{S} a encore souvent besoin d’aide pour se mettre au travail.'], x: ['{S} doit apprendre à travailler sans attendre l’aide de l’adulte.'] },
          t: { b: ['Autonomie en progrès.'], n: ['Autonomie à développer.'], x: ['Manque d’autonomie.'] } },
        1: { p: { b: ['{S} a encore besoin de l’adulte pour avancer dans son travail.'], n: ['L’autonomie dans le travail reste très difficile.'], x: ['{S} ne parvient pas encore à travailler sans aide.'] },
          t: { b: ['Autonomie à construire.'], n: ['Peu d’autonomie.'], x: ['Pas encore d’autonomie.'] } },
      },
      methodo: {
        4: { p: ['{S} présente un travail très soigné.', 'Les cahiers sont très bien tenus.'], t: ['Travail très soigné.'] },
        3: { p: ['{S} prend soin de son travail.', 'Le travail est soigné et bien présenté.'], t: ['Travail soigné.'] },
        2: { p: { b: ['{S} doit prendre plus de soin dans ses cahiers.'], n: ['Le soin et la présentation restent à améliorer.'], x: ['Le travail manque de soin.'] },
          t: { b: ['Soin à améliorer.'], n: ['Présentation à améliorer.'], x: ['Manque de soin.'] } },
        1: { p: { b: ['{S} a besoin d’aide pour soigner et organiser son travail.'], n: ['Le travail est peu soigné.'], x: ['Le travail n’est pas soigné.'] },
          t: { b: ['Soin à construire.'], n: ['Travail peu soigné.'], x: ['Travail non soigné.'] } },
      },
      // ({apsa} : « , notamment en mathématiques », la matière la plus réussie ; jamais aux niveaux 1 et 2, dits par « À consolider ».)
      competences: {
        4: { p: ['{S} a de très bons acquis{apsa}.', 'Les apprentissages sont très bien réussis{apsa}.', '{S} réussit très bien ses apprentissages{apsa}.'], t: ['Très bons acquis{apsa}.', 'Apprentissages très bien réussis{apsa}.'] },
        3: { p: ['{S} a de bons acquis{apsa}.', 'Les apprentissages sont bien en place{apsa}.', '{S} réussit bien ses apprentissages{apsa}.'], t: ['Bons acquis{apsa}.', 'Apprentissages bien en place{apsa}.'] },
        2: { p: { b: ['Les apprentissages sont en bonne voie, mais encore fragiles.', '{S} progresse dans ses apprentissages, encore fragiles.'], n: ['Les acquis restent fragiles.', 'Les apprentissages sont en partie acquis.'], x: ['Les acquis sont encore trop fragiles.'] },
          t: { b: ['Apprentissages en bonne voie.'], n: ['Acquis fragiles.'], x: ['Acquis trop fragiles.'] } },
        1: { p: { b: ['Les apprentissages restent difficiles, mais {s} peut progresser avec de l’aide.'], n: ['Les apprentissages restent difficiles.', '{S} rencontre des difficultés dans ses apprentissages.'], x: ['Les acquis sont très insuffisants.'] },
          t: { b: ['Apprentissages encore difficiles.'], n: ['Apprentissages difficiles.'], x: ['Acquis très insuffisants.'] } },
      },
      // ({faible} : « en français », la matière la plus fragile.)
      consolider: {
        4: { p: ['Les acquis sont solides dans toutes les matières.'], t: ['Acquis solides partout.'] },
        3: { p: ['{S} peut encore progresser{faible}.', 'Des progrès restent possibles{faible}.'], t: ['Progrès possibles{faible}.'] },
        2: { p: { b: ['{S} doit encore consolider ses acquis{faible}.', 'Les acquis restent à consolider{faible}.', '{S} doit encore s’entraîner{faible}.', 'Un travail régulier reste nécessaire{faible}.', 'Des efforts restent à fournir{faible}.'],
          n: ['Les acquis restent fragiles{faible}.', '{S} a encore besoin d’entraînement{faible}.'], x: ['Les acquis sont trop fragiles{faible}.', 'Le niveau reste insuffisant{faible}.'] },
          t: { b: ['À consolider{faible}.'], n: ['Acquis fragiles{faible}.'], x: ['Acquis insuffisants{faible}.'] } },
        1: { p: { b: ['{S} a besoin d’aide{faible} : nous l’accompagnons.'], n: ['{S} rencontre des difficultés{faible}.'], x: ['Les difficultés sont importantes{faible}.'] },
          t: { b: ['Aide nécessaire{faible}.'], n: ['Difficultés{faible}.'], x: ['Grandes difficultés{faible}.'] } },
      },
      moteur: DISCIPLINES.svt.appreciations.phrases.moteur,
      // (Niveau 2, « stable », reste celui de toutes les disciplines.)
      progression: {
        4: { p: ['{S} a fait de très beaux progrès {ce}.', 'Les progrès de {P} sont remarquables {ce}.'], t: ['Très beaux progrès.'] },
        3: { p: ['{S} a progressé {ce}.', 'Les progrès sont réguliers et encourageants.'], t: ['En progrès.', 'Progrès encourageants.'] },
        1: { p: { b: ['Les résultats ont un peu baissé {ce} : il faut garder confiance.'], n: ['Les résultats sont en baisse {ce}.'], x: ['Les résultats sont en net recul {ce}.'] },
          t: { b: ['Résultats en baisse : garder confiance.'], n: ['Résultats en baisse.'], x: ['Net recul des résultats.'] } },
      },
    },
    objectifs: {
      attitude: ['participer davantage en classe', 'oser prendre la parole', 'écouter attentivement les consignes'],
      absences: ['venir à l’école plus régulièrement'],
      comportement: ['mieux respecter les règles de la classe', 'mieux écouter ses camarades et les adultes'],
      autonomie: ['gagner en autonomie', 'se mettre au travail sans attendre'],
      methodo: ['prendre soin de ses cahiers', 'gagner en soin et en organisation', 'prendre le temps de se relire'],
      competences: ['consolider ses acquis', 'apprendre régulièrement ses leçons', 'continuer à s’entraîner chaque jour'],
      consolider: ['continuer à s’entraîner régulièrement', 'reprendre souvent ce qui a été appris'],
      moteur: ['consolider ses acquis', 'apprendre régulièrement ses leçons'],
      progression: ['retrouver de la régularité dans son travail', 'poursuivre ses efforts dans la durée'],
      regularite: ['garder de la régularité dans son travail'],
      haut: ['continuer ainsi', 'garder cette belle motivation', 'poursuivre ses efforts'],
    },
    fiche: { niveauFort: ['Bons acquis', 'maîtrise bien ce qui a été travaillé'], niveauFaible: ['Acquis fragiles', 'consolider ses acquis avec un travail régulier'],
      methodo: ['Méthode', 'gagner en soin et en organisation'], assiduite: ['Assiduité', 'est assidu{e} et travaille avec régularité'] },
  },
};
const avecEcole = () => !!profil().ecole;
const niveauxProposes = () => profil().niveaux || NIVEAUX;

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
// Outil proposé : sa famille n'est pas masquée, ni lui ; un outil réservé à certaines disciplines (o.disciplines,
// ex. l'ECE de SVT dans la famille Sciences) n'apparaît que dans celles-ci.
const outilDeLaDiscipline = o => !profil().familleOutilsMasquees.includes(o.famille) && !(profil().outilsMasques || []).includes(o.id)
  && (!o.disciplines || o.disciplines.includes(disciplineActive()));
// Exemple d'un champ d'outil de sciences (profil().exemples), sinon un exemple neutre.
const exempleOutil = (cle, defaut) => profil().exemples?.[cle] ?? defaut;
