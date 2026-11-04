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
  outilsMasques: ['intervalles', 'vma', 'tableau', 'video'],
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
  appreciations: {
    sansTutoiement: true, // (texte lu par les familles, comme le livret : toujours à la 3e personne)
    noms: { moteur: { nom: 'Connaissances', aide: 'résultats' }, methodo: { nom: 'Méthode', aide: 'organisation, soin' } },
    phrases: { attitude: DISCIPLINES.svt.appreciations.phrases.attitude, moteur: DISCIPLINES.svt.appreciations.phrases.moteur,
      methodo: {
        4: { p: ['{S} travaille avec beaucoup de soin et de méthode.'], t: ['Travail très soigné.'] },
        3: { p: ['{S} travaille avec méthode.'], t: ['Travail méthodique.'] },
        2: { p: { b: ['{S} doit encore gagner en soin et en organisation.'], n: ['Le soin et l’organisation restent à améliorer.'], x: ['{S} manque de soin et d’organisation.'] }, t: { b: ['Organisation à développer.'], n: ['Organisation à améliorer.'], x: ['Manque de soin.'] } },
        1: { p: { b: ['{S} a besoin d’aide pour s’organiser.'], n: ['{S} peine à s’organiser.'], x: ['L’organisation du travail reste très difficile.'] }, t: { b: ['Organisation à construire.'], n: ['Organisation difficile.'], x: ['Travail non organisé.'] } },
      } },
    objectifs: { moteur: ['consolider ses acquis', 'apprendre régulièrement ses leçons'], methodo: ['gagner en soin et en organisation', 'prendre le temps de se relire'] },
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
