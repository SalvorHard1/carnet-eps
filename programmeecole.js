'use strict';
/* ---------- Carnet École : objectifs détaillés du programme (à cocher dans les évaluations) ----------
   Français, CM1 et CM2 : programme du cycle 3, BO n° 16 du 17 avril 2025 (CM1 depuis la rentrée 2025, CM2 depuis 2026),
   « objectifs d'apprentissage » de chaque compétence, année par année. Textes officiels, raccourcis quand ils sont très longs.
   Culture littéraire et artistique : le programme ne donne que des « entrées » ; les objectifs sont tirés de leur présentation.
   Conjugaison : une ligne par temps (le programme en donne une par année).
   Mathématiques, CM1 et CM2 : même BO, objectifs d'apprentissage année par année ; un objectif identique les deux années
   n'est écrit qu'une fois (« CM1 CM2 »). Pensée informatique : pas d'objectifs au cours moyen, deux lignes tirées du texte.
   EMC, CM1 et CM2 : BO n° 24 du 13 juin 2024, « contenus d'enseignement » de chaque notion ; quelques lignes tirées des démarches.
   Chargé AVANT referentiel.js, qui range ces objectifs sous les domaines du livret (champ `objectifs` de la matière) :
   - `livret` : numéro du domaine du livret dont l'objectif nourrit le degré (FR : 1 Oral, 2 Lecture, 3 Écriture, 4 Langue ;
     MA : 1 Nombres et calcul, 2 Grandeurs et mesures, 3 Espace et géométrie ; HG : 1 Histoire, 2 Géographie, ou [1, 2] ; ST : 1 Sciences et technologie ;
     EMC : 1 Enseignement moral et civique) ;
     une compétence peut avoir son propre `livret` (4e élément) ; un objectif peut porter { de: année } ou { a: année } (année scolaire) ;
   - l'identifiant d'un objectif est « ecoleCycle3.FR.L1.1 » : ne jamais changer un code déjà publié (des notes s'y rattachent).
   L'accord de l'école (objectifs retenus, objectifs ajoutés) est dans reglage('competences').accord : voir ecolecompetences.js. */

const PROGRAMMES_ECOLE = {
  ecoleCycle3: {
    FR: [
      { dom: 'L', nom: 'Lecture', livret: 2, comps: [
        ['L1', 'Lire avec fluidité', [
          ['L1.1', 'CM1', 'Lire sans effort un texte d’une page silencieusement ou à voix haute'],
          ['L1.2', 'CM1', 'Lire à voix haute un texte court, après préparation, sans confondre les graphèmes, même complexes, en tenant compte de la ponctuation'],
          ['L1.3', 'CM1', 'Mémoriser de plus en plus de mots fréquents et irréguliers'],
          ['L1.4', 'CM1', 'Lire correctement en ciblant 110 mots par minute en moyenne'],
          ['L1.5', 'CM2', 'Poursuivre l’entraînement à la lecture à voix haute et à la lecture silencieuse'],
          ['L1.6', 'CM2', 'Lire à voix haute, après préparation, un texte long en tenant compte de la ponctuation, des liaisons et des unités syntaxiques'],
          ['L1.7', 'CM2', 'Lire correctement en ciblant 120 mots par minute en moyenne'],
        ]],
        ['L2', 'Lire à voix haute avec expressivité', [
          ['L2.1', 'CM1', 'Lire à voix haute, avec aisance et expressivité, un texte court travaillé en amont'],
          ['L2.2', 'CM1', 'Lire avec un rythme fluide et régulier qui respecte la ponctuation et les groupes de sens'],
          ['L2.3', 'CM1', 'Gérer l’intensité de sa voix (volume, débit)'],
          ['L2.4', 'CM2', 'Lire à voix haute, avec aisance et expressivité, un texte travaillé en amont, en respectant l’articulation du texte'],
          ['L2.5', 'CM2', 'Travailler la mise en voix d’un texte (intonation, effets)'],
          ['L2.6', 'CM2', 'Faire vivre le texte et prendre du plaisir à le lire'],
        ]],
        ['L3', 'Lire et comprendre seul des textes, des documents et des images', [
          ['L3.1', 'CM1', 'Développer des stratégies de compréhension'],
          ['L3.2', 'CM1', 'Repérer dans un texte les informations explicites et pointer des informations implicites'],
          ['L3.3', 'CM1', 'Distinguer un extrait de théâtre, un poème, un texte narratif (mise en page, écriture)'],
          ['L3.4', 'CM2', 'Lire en autonomie des textes de plus en plus longs et complexes'],
          ['L3.5', 'CM2', 'Restituer l’essentiel d’un texte qui contient des informations explicites et implicites'],
          ['L3.6', 'CM2', 'Reconnaître et nommer les principaux genres littéraires à l’aide de critères travaillés en classe'],
        ]],
        ['L4', 'Lire et comprendre pour apprendre dans toutes les disciplines', [
          ['L4.1', 'CM1', 'Donner la nature et la source d’un document'],
          ['L4.2', 'CM1', 'Identifier les différents genres de documents et repérer leurs caractéristiques majeures'],
          ['L4.3', 'CM1', 'Trouver dans des documents simples les réponses à des questions'],
          ['L4.4', 'CM1', 'Repérer des informations dans un document composite grâce à un questionnement'],
          ['L4.5', 'CM2', 'Reconnaître et nommer les différents éléments d’un document composite'],
          ['L4.6', 'CM2', 'Rapprocher deux documents de genres différents pour repérer et compléter les informations'],
          ['L4.7', 'CM2', 'Prélever et combiner des informations (inférences si nécessaire) pour donner un sens global aux documents'],
        ]],
        ['L5', 'Lire une œuvre et se l’approprier', [
          ['L5.1', 'CM1', 'Mettre en relation le texte lu avec une œuvre lue en classe (garder la mémoire des livres lus)'],
          ['L5.2', 'CM2', 'Mettre en relation le texte lu avec une autre œuvre ou une autre référence culturelle'],
          ['L5.3', 'CM1 CM2', 'Créer des liens entre le texte lu et ses expériences personnelles, ses connaissances'],
          ['L5.4', 'CM1', 'Varier les expériences de lecture (genres, formats, thèmes)'],
          ['L5.5', 'CM2', 'Développer le plaisir de lire, notamment avec des œuvres choisies'],
          ['L5.6', 'CM1 CM2', 'S’engager et persévérer dans sa lecture'],
        ]],
      ] },
      { dom: 'C', nom: 'Culture littéraire et artistique', livret: 2, comps: [
        ['C1', 'Lire, garder trace, partager', [
          ['C1.1', 'CM1 CM2', 'Lire les œuvres complètes de l’année (CM1 : 2 du patrimoine et 5 de jeunesse ; CM2 : 3 et 4)'],
          ['C1.2', 'CM1 CM2', 'Garder trace de ses lectures (carnet de lecteur…) et les partager'],
          ['C1.3', 'CM1 CM2', 'Présenter un livre oralement, partager ses impressions de lecture'],
          ['C1.4', 'CM1 CM2', 'Débattre de l’interprétation d’un texte'],
          ['C1.5', 'CM1 CM2', 'Situer une œuvre dans quelques grands repères de l’histoire de la littérature et des arts'],
        ]],
        ['C2', 'Les entrées littéraires', [
          ['C2.1', 'CM1 CM2', 'Héroïnes, héros : comprendre les motivations d’un personnage, ses fragilités et les valeurs qu’il porte'],
          ['C2.2', 'CM1 CM2', 'Merveilleux, étrange : identifier le merveilleux ou l’étrange et exprimer les émotions suscitées'],
          ['C2.3', 'CM1 CM2', 'Autres vies : s’identifier à un personnage ou s’en démarquer, s’immerger dans un univers'],
          ['C2.4', 'CM1 CM2', 'Morale : comprendre les valeurs portées par les personnages et les conséquences de leurs actions'],
          ['C2.5', 'CM1 CM2', 'Poésie : exprimer sa sensibilité à un poème, jouer avec les mots pour créer'],
          ['C2.6', 'CM1 CM2', 'Se découvrir : comprendre comment un personnage se construit au fil de ses rencontres'],
          ['C2.7', 'CM1 CM2', 'Mettre en voix ou en jeu un texte (lecture à voix haute, jeu scénique)'],
        ]],
      ] },
      { dom: 'E', nom: 'Écriture', livret: 3, comps: [
        ['E1', 'Écrire à la main de manière fluide et efficace', [
          ['E1.1', 'CM1 CM2', 'Copier et produire des textes'],
          ['E1.2', 'CM1 CM2', 'Acquérir des stratégies de copie'],
        ]],
        ['E2', 'Écrire pour réfléchir, apprendre et mémoriser', [
          ['E2.1', 'CM1', 'Écrire pour repérer et trier les informations pertinentes'],
          ['E2.2', 'CM2', 'Écrire pour comparer deux documents'],
          ['E2.3', 'CM1', 'Produire des écrits réflexifs courts pour expliquer un point de vue'],
          ['E2.4', 'CM2', 'Produire des écrits réflexifs courts pour expliquer un point de vue intégrant plusieurs documents'],
          ['E2.5', 'CM1', 'Reformuler, avec l’aide du professeur et des pairs, l’essentiel d’une leçon ou d’une activité'],
          ['E2.6', 'CM2', 'Reformuler, avec l’aide du professeur et des pairs, l’essentiel d’une leçon, y compris de manière schématique'],
          ['E2.7', 'CM1 CM2', 'Produire des écrits courts pour appliquer une règle de grammaire ou employer le lexique appris'],
        ]],
        ['E3', 'Produire des écrits variés', [
          ['E3.1', 'CM1', 'Découvrir des situations d’écriture variées : raconter, expliquer'],
          ['E3.2', 'CM2', 'Manipuler des situations d’écriture variées : décrire, dialoguer'],
          ['E3.3', 'CM1', 'Écrire au quotidien des textes personnels (donner son avis, imaginer une suite, formuler des hypothèses)'],
          ['E3.4', 'CM2', 'Écrire au quotidien des textes personnels (nuancer un avis, suite avec dialogue ou description, étapes d’une expérience)'],
          ['E3.5', 'CM1 CM2', 'Utiliser le brouillon pour préparer son texte'],
          ['E3.6', 'CM1', 'Exercer sa vigilance quant au respect des codes de l’écrit'],
          ['E3.7', 'CM2', 'Faire preuve d’autonomie dans le respect des codes de l’écrit'],
          ['E3.8', 'CM1', 'Prendre conscience des composantes de la cohérence textuelle'],
          ['E3.9', 'CM2', 'Appliquer les principes de la cohérence textuelle'],
          ['E3.10', 'CM1', 'Améliorer son texte à partir des pistes de l’enseignant et/ou des pairs'],
          ['E3.11', 'CM2', 'Améliorer son texte à partir des pistes de l’enseignant, des pairs et/ou de son autoévaluation'],
        ]],
      ] },
      { dom: 'O', nom: 'Oral', livret: 1, comps: [
        ['O1', 'Écouter pour comprendre', [
          ['O1.1', 'CM1 CM2', 'Maintenir une écoute active orientée en fonction du but'],
          ['O1.2', 'CM1 CM2', 'Comprendre un message oral d’un tiers ou d’un média (interview, reportage)'],
          ['O1.3', 'CM1 CM2', 'Manifester sa compréhension des textes entendus'],
          ['O1.4', 'CM1 CM2', 'Identifier les caractéristiques des différents genres de discours'],
          ['O1.5', 'CM1 CM2', 'Manifester sa sensibilité à l’écoute d’un texte'],
        ]],
        ['O2', 'Dire pour être compris dans toutes les disciplines', [
          ['O2.1', 'CM1 CM2', 'Réaliser une production orale claire et organisée pour raconter, expliquer, argumenter, justifier, partager des connaissances'],
          ['O2.2', 'CM1 CM2', 'Faire vivre un texte littéraire, historique ou documentaire par une lecture expressive devant un public'],
          ['O2.3', 'CM1 CM2', 'Utiliser l’oral comme outil réflexif'],
        ]],
        ['O3', 'Participer à des échanges verbaux', [
          ['O3.1', 'CM1 CM2', 'Prendre la parole en respectant les codes de la communication'],
          ['O3.2', 'CM1 CM2', 'Utiliser des structures de langage en fonction du but recherché'],
          ['O3.3', 'CM1 CM2', 'Présenter de façon claire et ordonnée des explications, des informations, un point de vue'],
          ['O3.4', 'CM1 CM2', 'Se servir de l’oral pour construire une analyse collective en interaction'],
          ['O3.5', 'CM1 CM2', 'Adapter son discours à la situation de communication'],
          ['O3.6', 'CM1 CM2', 'Porter un regard critique sur l’oral produit'],
        ]],
      ] },
      { dom: 'V', nom: 'Vocabulaire', livret: 4, comps: [
        ['V1', 'Enrichir son vocabulaire dans toutes les disciplines', [
          ['V1.1', 'CM1', 'Approfondir, en contexte, le vocabulaire appris au cycle 2'],
          ['V1.2', 'CM1', 'Mémoriser des mots et expressions issus de toutes les disciplines'],
          ['V1.3', 'CM2', 'Acquérir un vocabulaire précis dans différents univers de référence'],
          ['V1.4', 'CM1 CM2', 'Comprendre un mot inconnu grâce à la morphologie et au contexte'],
          ['V1.5', 'CM2', 'Utiliser des dictionnaires'],
        ]],
        ['V2', 'Établir des relations entre les mots', [
          ['V2.1', 'CM1', 'Établir des relations morphologiques et sémantiques entre les mots'],
          ['V2.2', 'CM2', 'Approfondir les relations morphologiques et sémantiques entre les mots'],
          ['V2.3', 'CM1', 'Comprendre et utiliser la synonymie et l’antonymie'],
          ['V2.4', 'CM2', 'Approfondir sa compréhension de la polysémie dans un contexte non référentiel'],
        ]],
        ['V3', 'Réemployer le vocabulaire étudié', [
          ['V3.1', 'CM1', 'À l’oral et à l’écrit, utiliser à bon escient les mots appris'],
          ['V3.2', 'CM2', 'À l’oral et à l’écrit, utiliser précisément le vocabulaire de différents univers de référence'],
          ['V3.3', 'CM1 CM2', 'Utiliser à bon escient les mots polysémiques dans différents contextes disciplinaires'],
        ]],
        ['V4', 'Mémoriser l’orthographe des mots', [
          ['V4.1', 'CM1 CM2', 'Écrire correctement les mots fréquents en s’appuyant sur les régularités et la formation'],
          ['V4.2', 'CM1', 'S’appuyer sur la morphologie des mots rencontrés pour les orthographier'],
        ]],
      ] },
      { dom: 'G', nom: 'Grammaire et orthographe grammaticale', livret: 4, comps: [
        ['G1', 'Les types et formes de phrases', [
          ['G1.1', 'CM1', 'Identifier les trois types de phrases (déclaratif, interrogatif, impératif) et leurs effets'],
          ['G1.2', 'CM1', 'Identifier les formes négative et exclamative et leurs effets'],
          ['G1.3', 'CM1', 'Transformer une phrase d’un type ou d’une forme à l’autre, à l’oral puis à l’écrit'],
          ['G1.4', 'CM1', 'Produire différentes formes d’interrogation (inversion, est-ce que, intonation)'],
          ['G1.5', 'CM2', 'Consolider les types et formes de phrases sur des corpus plus complexes'],
        ]],
        ['G2', 'Analyser une phrase simple', [
          ['G2.1', 'CM1', 'Identifier le verbe conjugué'],
          ['G2.2', 'CM1 CM2', 'Identifier le groupe sujet et les types de sujets (pronom, groupe nominal, plusieurs noms)'],
          ['G2.3', 'CM2', 'Identifier le sujet inversé dans des cas simples'],
          ['G2.4', 'CM1', 'Distinguer complément d’objet et complément circonstanciel'],
          ['G2.5', 'CM1 CM2', 'Différencier complément d’objet direct et indirect'],
          ['G2.6', 'CM1', 'Identifier les groupes circonstanciels'],
          ['G2.7', 'CM2', 'Différencier les compléments circonstanciels de temps, de lieu, de cause'],
          ['G2.8', 'CM2', 'Différencier attribut du sujet et complément d’objet'],
          ['G2.9', 'CM1 CM2', 'Utiliser les manipulations syntaxiques (déplacer, supprimer, remplacer, ajouter, encadrer)'],
        ]],
        ['G3', 'Nature et fonction', [
          ['G3.1', 'CM1', 'Se familiariser avec les notions de nature et fonction'],
          ['G3.2', 'CM2', 'Connaître et distinguer nature et fonction'],
        ]],
        ['G4', 'Identifier les mots selon leur nature', [
          ['G4.1', 'CM1', 'Identifier les déterminants : articles, possessifs, démonstratifs'],
          ['G4.2', 'CM1', 'Identifier les conjonctions de coordination'],
          ['G4.3', 'CM1', 'Identifier les adverbes les plus fréquents'],
          ['G4.4', 'CM1', 'Distinguer pronoms personnels sujets et compléments ; remplacer un groupe nominal par un pronom'],
          ['G4.5', 'CM2', 'Identifier les prépositions'],
          ['G4.6', 'CM2', 'Identifier les conjonctions de subordination'],
          ['G4.7', 'CM2', 'Identifier les pronoms personnels compléments et leurs variations'],
        ]],
        ['G5', 'Analyser le groupe nominal', [
          ['G5.1', 'CM1', 'Repérer un groupe nominal et nommer ses éléments (déterminant, nom, adjectif)'],
          ['G5.2', 'CM1', 'Repérer le nom noyau'],
          ['G5.3', 'CM1', 'Aborder la notion d’épithète'],
          ['G5.4', 'CM2', 'Identifier les expansions du nom : adjectif, complément du nom'],
          ['G5.5', 'CM2', 'Différencier épithète et attribut du sujet'],
        ]],
        ['G6', 'Se repérer dans la phrase complexe', [
          ['G6.1', 'CM2', 'Distinguer phrase simple et phrase complexe (repérage des verbes conjugués)'],
        ]],
        ['G7', 'Acquérir l’orthographe grammaticale : les accords', [
          ['G7.1', 'CM1 CM2', 'Identifier les classes de mots qui varient et leurs variations (genre, nombre, personne, temps)'],
          ['G7.2', 'CM1', 'Connaître les variations des déterminants'],
          ['G7.3', 'CM2', 'Utiliser les outils de référence pour comprendre les variations'],
          ['G7.4', 'CM1 CM2', 'Réaliser la chaîne d’accords dans le groupe nominal'],
          ['G7.5', 'CM1', 'Justifier les accords effectués'],
          ['G7.6', 'CM1 CM2', 'Accorder le sujet et le verbe'],
          ['G7.7', 'CM2', 'Accorder le verbe avec un sujet inversé'],
          ['G7.8', 'CM2', 'Accorder le sujet et l’attribut du sujet'],
          ['G7.9', 'CM1 CM2', 'Accorder le participe passé avec être'],
          ['G7.10', 'CM2', 'Accorder le participe passé avec avoir (complément d’objet direct)'],
          ['G7.11', 'CM1', 'Distinguer les variations du verbe de celles du nom (il élève / une élève)'],
        ]],
        ['G8', 'Approfondir sa maîtrise de la conjugaison', [
          ['G8.1', 'CM1', 'Conjuguer au présent de l’indicatif (être, avoir, 1er et 2e groupes, 8 verbes irréguliers)'],
          ['G8.2', 'CM1', 'Conjuguer à l’imparfait (être, avoir, 1er et 2e groupes, 8 verbes irréguliers)'],
          ['G8.3', 'CM1', 'Conjuguer au futur (être, avoir, 1er et 2e groupes, 8 verbes irréguliers)'],
          ['G8.4', 'CM1', 'Conjuguer au passé composé (être, avoir, 1er et 2e groupes, 8 verbes irréguliers)'],
          ['G8.5', 'CM2', 'Conjuguer au passé simple (être, avoir, 1er et 2e groupes, 8 verbes irréguliers)'],
          ['G8.6', 'CM2', 'Conjuguer au plus-que-parfait (être, avoir, 1er et 2e groupes, 8 verbes irréguliers)'],
          ['G8.7', 'CM1 CM2', 'Distinguer marque de temps et marque de personne dans la terminaison'],
          ['G8.8', 'CM1 CM2', 'Connaître la composition des temps composés (auxiliaire + participe passé)'],
          ['G8.9', 'CM1 CM2', 'Mettre un verbe à un temps composé à la forme négative'],
          ['G8.10', 'CM1 CM2', 'Connaître les variations du radical (verbes en -cer, -ger, -yer, -eler, -eter…)'],
        ]],
      ] },
    ],
    MA: [
      { dom: 'N', nom: 'Nombres, calcul et résolution de problèmes', livret: 1, comps: [
        ['N1', 'Les nombres entiers', [
          ['N1.1', 'CM1', 'Comparer et dénombrer des collections en les organisant'],
          ['N1.2', 'CM1', 'Construire des collections de cardinal donné'],
          ['N1.3', 'CM1 CM2', 'Connaître et utiliser les relations entre les unités de numération'],
          ['N1.4', 'CM1', 'Connaître la suite écrite et la suite orale des nombres jusqu’à 999 999'],
          ['N1.5', 'CM2', 'Connaître la suite écrite et la suite orale des nombres jusqu’à 999 999 999'],
          ['N1.6', 'CM1 CM2', 'Connaître la valeur des chiffres en fonction de leur position dans un nombre'],
          ['N1.7', 'CM1 CM2', 'Connaître et utiliser diverses représentations d’un nombre et passer de l’une à l’autre'],
          ['N1.8', 'CM1', 'Comprendre et utiliser « égal à », « supérieur à », « inférieur à », « compris entre … et … »'],
          ['N1.9', 'CM1 CM2', 'Comparer, encadrer, intercaler des nombres entiers avec les symboles =, < et >'],
          ['N1.10', 'CM1 CM2', 'Ordonner des nombres dans l’ordre croissant ou décroissant'],
          ['N1.11', 'CM1 CM2', 'Placer des nombres et repérer des points sur une demi-droite graduée'],
          ['N1.12', 'CM1', 'Reconnaître les multiples de 2, de 5 et de 10 à partir de leur écriture chiffrée'],
          ['N1.13', 'CM1 CM2', 'Dire si un nombre est un multiple d’un nombre inférieur ou égal à 10, ou si celui-ci en est un diviseur'],
          ['N1.14', 'CM2', 'Déterminer des diviseurs d’un nombre entier inférieur ou égal à 100'],
          ['N1.15', 'CM2', 'Déterminer tous les diviseurs d’un nombre entier inférieur ou égal à 30'],
          ['N1.16', 'CM2', 'Déterminer les diviseurs communs à deux nombres entiers inférieurs ou égaux à 30'],
          ['N1.17', 'CM2', 'Déterminer des multiples communs à deux nombres entiers inférieurs à 15'],
        ]],
        ['N2', 'Les fractions', [
          ['N2.1', 'CM1 CM2', 'Interpréter, représenter, écrire et lire des fractions'],
          ['N2.2', 'CM1 CM2', 'Écrire une fraction supérieure à 1 comme la somme d’un entier et d’une fraction inférieure à 1'],
          ['N2.3', 'CM1 CM2', 'Écrire la somme d’un entier et d’une fraction inférieure à 1 comme une unique fraction'],
          ['N2.4', 'CM1 CM2', 'Encadrer une fraction entre deux nombres entiers consécutifs'],
          ['N2.5', 'CM1 CM2', 'Placer une fraction (ou un entier plus une fraction) sur une demi-droite graduée'],
          ['N2.6', 'CM1 CM2', 'Repérer un point d’une demi-droite graduée par une fraction (ou un entier plus une fraction)'],
          ['N2.7', 'CM1 CM2', 'Comparer des fractions'],
          ['N2.8', 'CM1 CM2', 'Additionner et soustraire des fractions'],
          ['N2.9', 'CM2', 'Calculer le produit d’un entier et d’une fraction'],
          ['N2.10', 'CM1 CM2', 'Déterminer une fraction d’une quantité ou d’une grandeur'],
        ]],
        ['N3', 'Les nombres décimaux', [
          ['N3.1', 'CM1 CM2', 'Interpréter, représenter, écrire et lire des fractions décimales'],
          ['N3.2', 'CM1', 'Connaître et utiliser les relations entre unités, dixièmes et centièmes'],
          ['N3.3', 'CM2', 'Connaître et utiliser les relations entre unités, dixièmes, centièmes et millièmes'],
          ['N3.4', 'CM1 CM2', 'Placer une fraction décimale sur une demi-droite graduée et repérer un point par une fraction décimale'],
          ['N3.5', 'CM1 CM2', 'Écrire une fraction décimale supérieure à 1 comme la somme d’un entier et d’une fraction décimale inférieure à 1'],
          ['N3.6', 'CM1 CM2', 'Décomposer une fraction décimale supérieure à 1 en un entier et des fractions décimales de numérateur inférieur à 10'],
          ['N3.7', 'CM1 CM2', 'Comparer, encadrer, intercaler des fractions décimales avec les symboles =, < et >'],
          ['N3.8', 'CM1 CM2', 'Ordonner des fractions décimales dans l’ordre croissant ou décroissant'],
          ['N3.9', 'CM1 CM2', 'Passer d’une fraction décimale (ou d’une somme de fractions décimales) à l’écriture à virgule, et réciproquement'],
          ['N3.10', 'CM1 CM2', 'Interpréter, représenter, écrire et lire des nombres décimaux (écriture à virgule)'],
          ['N3.11', 'CM1 CM2', 'Placer un nombre décimal sur une demi-droite graduée et repérer un point par un nombre décimal'],
          ['N3.12', 'CM1 CM2', 'Donner la partie entière et l’arrondi à l’entier d’un nombre décimal'],
          ['N3.13', 'CM1 CM2', 'Comparer, encadrer, intercaler, ordonner des nombres décimaux (écriture à virgule)'],
        ]],
        ['N4', 'Calcul mental : mémoriser des faits numériques', [
          ['N4.1', 'CM1 CM2', 'Connaître des faits numériques usuels avec des nombres entiers'],
          ['N4.2', 'CM2', 'Connaître la moitié des nombres impairs jusqu’à 15'],
          ['N4.3', 'CM1 CM2', 'Connaître quelques relations entre des fractions usuelles'],
          ['N4.4', 'CM1 CM2', 'Connaître l’écriture décimale de fractions usuelles'],
        ]],
        ['N5', 'Calcul mental : utiliser la numération', [
          ['N5.1', 'CM1', 'Ajouter ou soustraire à un nombre décimal des unités, dizaines, centaines, dixièmes ou centièmes (sans retenue)'],
          ['N5.2', 'CM2', 'Ajouter ou soustraire un nombre entier à un nombre décimal, sans retenue'],
          ['N5.3', 'CM2', 'Ajouter un nombre entier à un nombre décimal, avec une retenue'],
          ['N5.4', 'CM1', 'Multiplier un nombre entier par 10, 100 ou 1 000'],
          ['N5.5', 'CM1', 'Multiplier ou diviser un nombre décimal par 10'],
          ['N5.6', 'CM2', 'Multiplier ou diviser un nombre décimal par 10, 100 ou 1 000'],
        ]],
        ['N6', 'Calcul mental : procédures', [
          ['N6.1', 'CM1', 'Ajouter ou soustraire 8, 9, 18, 19, 28, 29, 38 ou 39 à un nombre'],
          ['N6.2', 'CM2', 'Ajouter ou soustraire 8, 9, 18, 19, …, 98 ou 99 à un nombre'],
          ['N6.3', 'CM2', 'Ajouter deux nombres décimaux inférieurs à 10 ayant au plus un chiffre après la virgule'],
          ['N6.4', 'CM1', 'Multiplier un nombre inférieur à 10 par un nombre entier de dizaines ou de centaines'],
          ['N6.5', 'CM2', 'Multiplier entre eux des nombres entiers de dizaines, de centaines ou de milliers (ex. 30 × 400)'],
          ['N6.6', 'CM1', 'Multiplier un nombre entier par 4, par 8 ou par 5'],
          ['N6.7', 'CM1 CM2', 'Utiliser la distributivité de la multiplication par rapport à l’addition dans des cas simples'],
          ['N6.8', 'CM2', 'Calculer le double ou la moitié d’un nombre décimal dans des cas simples'],
          ['N6.9', 'CM2', 'Diviser un nombre entier par 4 ou par 8'],
          ['N6.10', 'CM2', 'Multiplier un nombre décimal par 5 ou par 50'],
        ]],
        ['N7', 'Les quatre opérations', [
          ['N7.1', 'CM1 CM2', 'Estimer le résultat d’une opération'],
          ['N7.2', 'CM1', 'Effectuer un calcul contenant des parenthèses'],
          ['N7.3', 'CM2', 'Effectuer un calcul contenant une ou deux paires de parenthèses'],
          ['N7.4', 'CM1', 'Poser et effectuer des additions et des soustractions de nombres décimaux'],
          ['N7.5', 'CM1', 'Poser et effectuer des multiplications de deux nombres entiers'],
          ['N7.6', 'CM1', 'Poser et effectuer la multiplication d’un nombre décimal par un entier inférieur à 10'],
          ['N7.7', 'CM2', 'Poser et effectuer la multiplication d’un nombre décimal par un nombre entier'],
          ['N7.8', 'CM1', 'Poser et effectuer des divisions euclidiennes avec un diviseur à un chiffre'],
          ['N7.9', 'CM2', 'Poser et effectuer des divisions décimales (dividende entier ou décimal, diviseur à un chiffre)'],
        ]],
        ['N8', 'La résolution de problèmes', [
          ['N8.1', 'CM1', 'Résoudre des problèmes additifs en une étape (« parties-tout », « comparaison »)'],
          ['N8.2', 'CM1', 'Résoudre des problèmes additifs en deux ou trois étapes'],
          ['N8.3', 'CM2', 'Résoudre des problèmes additifs en une ou plusieurs étapes'],
          ['N8.4', 'CM1 CM2', 'Résoudre des problèmes multiplicatifs « parties-tout » en une étape'],
          ['N8.5', 'CM1 CM2', 'Résoudre des problèmes de comparaison multiplicative'],
          ['N8.6', 'CM1', 'Résoudre des problèmes mixtes en deux ou trois étapes'],
          ['N8.7', 'CM2', 'Résoudre des problèmes mixtes en plusieurs étapes'],
          ['N8.8', 'CM1 CM2', 'Résoudre des problèmes de dénombrement'],
          ['N8.9', 'CM1 CM2', 'Résoudre des problèmes d’optimisation'],
          ['N8.10', 'CM2', 'Résoudre des problèmes préparant à l’utilisation d’algorithmes'],
        ]],
        ['N9', 'Algèbre', [
          ['N9.1', 'CM1 CM2', 'Trouver le nombre manquant dans une égalité à trous'],
          ['N9.2', 'CM1', 'Déterminer un nombre inconnu en le représentant par un symbole ou une lettre'],
          ['N9.3', 'CM1 CM2', 'Résoudre des problèmes algébriques'],
          ['N9.4', 'CM1', 'Exécuter un programme de calcul'],
          ['N9.5', 'CM2', 'Exécuter ou produire un programme de calcul'],
          ['N9.6', 'CM1 CM2', 'Identifier et formuler une règle de calcul pour poursuivre une suite de nombres'],
          ['N9.7', 'CM1 CM2', 'Identifier des régularités et poursuivre une suite de motifs évolutive'],
          ['N9.8', 'CM2', 'Trouver le nombre d’éléments à une étape donnée d’une suite de motifs évolutive'],
        ]],
      ] },
      { dom: 'GM', nom: 'Grandeurs et mesures', livret: 2, comps: [
        ['GM1', 'Les longueurs', [
          ['GM1.1', 'CM1', 'Connaître et utiliser les unités de longueur du millimètre au kilomètre et leurs symboles'],
          ['GM1.2', 'CM1', 'Connaître les relations entre les unités de longueur'],
          ['GM1.3', 'CM1', 'Choisir une unité adaptée pour exprimer une longueur'],
          ['GM1.4', 'CM1', 'Comparer des longueurs'],
          ['GM1.5', 'CM1', 'Disposer de quelques longueurs de référence'],
          ['GM1.6', 'CM1', 'Estimer la longueur d’un objet ou une distance'],
          ['GM1.7', 'CM1', 'Savoir ce qu’est le périmètre d’une figure plane'],
          ['GM1.8', 'CM1', 'Déterminer le périmètre d’un polygone avec une règle graduée'],
          ['GM1.9', 'CM1', 'Résoudre des problèmes sur les longueurs des côtés d’un polygone et son périmètre'],
        ]],
        ['GM2', 'Les masses', [
          ['GM2.1', 'CM1', 'Connaître et utiliser les unités de masse du milligramme au kilogramme, la tonne, et leurs symboles'],
          ['GM2.2', 'CM1', 'Connaître les relations entre les unités de masse'],
          ['GM2.3', 'CM1', 'Choisir une unité adaptée pour exprimer une masse'],
          ['GM2.4', 'CM1', 'Comparer des masses'],
          ['GM2.5', 'CM1', 'Disposer de quelques masses de référence'],
          ['GM2.6', 'CM1', 'Estimer la masse d’un objet'],
        ]],
        ['GM3', 'Les contenances', [
          ['GM3.1', 'CM1', 'Connaître et utiliser les unités de contenance du millilitre à l’hectolitre et leurs symboles'],
          ['GM3.2', 'CM1', 'Connaître les relations entre les unités de contenance'],
          ['GM3.3', 'CM1', 'Choisir une unité adaptée pour exprimer une contenance'],
          ['GM3.4', 'CM1', 'Comparer des contenances'],
        ]],
        ['GM4', 'Les aires', [
          ['GM4.1', 'CM1 CM2', 'Comparer les aires de différentes figures planes'],
          ['GM4.2', 'CM1 CM2', 'Déterminer des aires'],
          ['GM4.3', 'CM1', 'Utiliser le centimètre carré pour exprimer des aires'],
          ['GM4.4', 'CM2', 'Utiliser le centimètre carré, le décimètre carré et le mètre carré pour exprimer des aires'],
          ['GM4.5', 'CM2', 'Convertir des aires entre différentes unités'],
          ['GM4.6', 'CM2', 'Déterminer l’aire d’un carré ou d’un rectangle'],
        ]],
        ['GM5', 'Les angles', [
          ['GM5.1', 'CM1 CM2', 'Utiliser le lexique spécifique associé aux angles'],
          ['GM5.2', 'CM1 CM2', 'Comprendre et utiliser les notations des angles'],
          ['GM5.3', 'CM1 CM2', 'Comparer des angles'],
          ['GM5.4', 'CM2', 'Construire un angle égal à la somme de deux angles donnés, ou multiple d’un angle donné'],
          ['GM5.5', 'CM2', 'Construire par pliage la moitié d’un angle donné'],
          ['GM5.6', 'CM2', 'Savoir qu’un angle droit mesure 90°'],
        ]],
        ['GM6', 'Le repérage dans le temps et les durées', [
          ['GM6.1', 'CM1 CM2', 'Lire l’heure sur une horloge à aiguilles'],
          ['GM6.2', 'CM1', 'Placer les aiguilles d’une horloge pour une heure donnée (heure, minute)'],
          ['GM6.3', 'CM2', 'Placer les aiguilles d’une horloge pour une heure donnée (heure, minute, seconde)'],
          ['GM6.4', 'CM1', 'Comparer et mesurer des durées entre deux instants lus sur une horloge (heure, minute)'],
          ['GM6.5', 'CM2', 'Comparer et mesurer des durées entre deux instants lus sur une horloge (heure, minute, seconde)'],
          ['GM6.6', 'CM1', 'Résoudre des problèmes à une ou deux étapes impliquant des durées'],
          ['GM6.7', 'CM2', 'Résoudre des problèmes à une ou plusieurs étapes impliquant des durées'],
        ]],
      ] },
      { dom: 'EG', nom: 'Espace et géométrie', livret: 3, comps: [
        ['EG1', 'La géométrie plane', [
          ['EG1.1', 'CM1 CM2', 'Utiliser le vocabulaire géométrique approprié'],
          ['EG1.2', 'CM1 CM2', 'Utiliser les outils géométriques usuels : règle, règle graduée, équerre et compas'],
          ['EG1.3', 'CM1 CM2', 'Connaître les notations et les codes usuels de la géométrie'],
          ['EG1.4', 'CM1 CM2', 'Décrire et reconnaître un cercle et un disque (points à une distance donnée d’un point)'],
          ['EG1.5', 'CM1 CM2', 'Reconnaître et utiliser la notion de perpendicularité'],
          ['EG1.6', 'CM1 CM2', 'Reconnaître et utiliser la notion de parallélisme'],
          ['EG1.7', 'CM1', 'Reconnaître et nommer d’après leur définition : triangles (rectangle, isocèle, équilatéral), quadrilatère, carré, rectangle, losange'],
          ['EG1.8', 'CM2', 'Reconnaître et nommer d’après leur définition : triangles particuliers, quadrilatère, carré, rectangle, losange, trapèze, pentagone, hexagone'],
          ['EG1.9', 'CM1', 'Connaître les propriétés (côtés parallèles, longueurs, angles) des triangles particuliers, du carré, du rectangle, du losange'],
          ['EG1.10', 'CM2', 'Connaître les propriétés (côtés parallèles, longueurs, angles) des figures usuelles, trapèze et trapèze rectangle compris'],
          ['EG1.11', 'CM1 CM2', 'Reproduire ou construire carré, rectangle, triangle, triangle rectangle, cercle ou leurs assemblages (règle, équerre, compas)'],
          ['EG1.12', 'CM1 CM2', 'Construire une figure composée de segments, de droites, de polygones usuels et de cercles'],
          ['EG1.13', 'CM2', 'Élaborer un programme de construction'],
          ['EG1.14', 'CM1', 'Reconnaître si une figure possède un ou plusieurs axes de symétrie'],
          ['EG1.15', 'CM1', 'Compléter une figure pour la rendre symétrique par rapport à une droite horizontale ou verticale'],
          ['EG1.16', 'CM1', 'Construire sur quadrillage le symétrique d’une figure par rapport à une droite horizontale ou verticale'],
          ['EG1.17', 'CM2', 'Construire sur quadrillage le symétrique d’une figure par rapport à une droite verticale, horizontale ou diagonale'],
        ]],
        ['EG2', 'Les solides', [
          ['EG2.1', 'CM1 CM2', 'Nommer un cube, une boule, un pavé, un cône, une pyramide, un cylindre et un prisme droit'],
          ['EG2.2', 'CM1 CM2', 'Décrire un cube, un pavé, une pyramide ou un prisme droit avec le vocabulaire approprié'],
          ['EG2.3', 'CM1', 'Connaître le nombre et la nature des faces d’un cube, d’un pavé, d’une pyramide, d’un prisme droit'],
          ['EG2.4', 'CM1', 'Construire un cube, un pavé, une pyramide ou un prisme droit'],
          ['EG2.5', 'CM1 CM2', 'Reconnaître un patron d’un cube'],
          ['EG2.6', 'CM1 CM2', 'Construire un patron d’un cube'],
          ['EG2.7', 'CM2', 'Reconnaître un patron d’un pavé'],
        ]],
        ['EG3', 'Repérage et déplacements dans l’espace', [
          ['EG3.1', 'CM1 CM2', 'Connaître et utiliser le vocabulaire lié aux déplacements'],
          ['EG3.2', 'CM1 CM2', 'Comprendre, utiliser et produire une suite d’instructions décrivant un déplacement'],
          ['EG3.3', 'CM1 CM2', 'Résoudre des problèmes portant sur des assemblages de cubes'],
        ]],
      ] },
      { dom: 'D', nom: 'Organisation et gestion de données, probabilités', livret: 1, comps: [
        ['D1', 'Organisation et gestion de données', [
          ['D1.1', 'CM1 CM2', 'Recueillir des données et les présenter (tableau, diagramme en barres, points dans un repère)'],
          ['D1.2', 'CM1', 'Lire et interpréter un tableau (simple ou double entrée), un diagramme en barres, une courbe'],
          ['D1.3', 'CM2', 'Lire et interpréter un tableau, un diagramme en barres, un diagramme circulaire, une courbe'],
          ['D1.4', 'CM1', 'Résoudre des problèmes en une ou plusieurs étapes à partir d’un tableau, d’un diagramme ou d’une courbe'],
          ['D1.5', 'CM2', 'Résoudre des problèmes en une ou deux étapes à partir d’un tableau, d’un diagramme (circulaire compris) ou d’une courbe'],
        ]],
        ['D2', 'Les probabilités', [
          ['D2.1', 'CM1', 'Identifier des expériences aléatoires'],
          ['D2.2', 'CM1 CM2', 'Identifier toutes les issues possibles d’une expérience aléatoire simple'],
          ['D2.3', 'CM1', 'Utiliser le vocabulaire : impossible, possible, certain, probable, peu probable, une chance sur deux'],
          ['D2.4', 'CM1', 'Comparer des issues ou des évènements selon leur probabilité de réalisation'],
          ['D2.5', 'CM1', 'Comprendre que deux issues possibles n’ont pas forcément chacune une chance sur deux'],
          ['D2.6', 'CM1', 'Reconnaître des situations d’équiprobabilité'],
          ['D2.7', 'CM2', 'Identifier toutes les issues qui réalisent un évènement'],
          ['D2.8', 'CM2', 'Exprimer la probabilité d’un évènement sous la forme « a chances sur b » (équiprobabilité)'],
          ['D2.9', 'CM2', 'Comparer des probabilités dans des cas simples'],
          ['D2.10', 'CM2', 'Comprendre l’indépendance lors de la répétition d’une même expérience aléatoire'],
          ['D2.11', 'CM2', 'Recenser les issues d’une expérience en deux étapes (tableau, arbre) pour déterminer des probabilités'],
        ]],
      ] },
      { dom: 'P', nom: 'La proportionnalité', livret: 1, comps: [
        ['P1', 'La proportionnalité', [
          ['P1.1', 'CM1 CM2', 'Identifier une situation de proportionnalité'],
          ['P1.2', 'CM1 CM2', 'Résoudre un problème de proportionnalité'],
        ]],
      ] },
      { dom: 'PI', nom: 'Initiation à la pensée informatique', livret: 3, comps: [
        ['PI1', 'Coder et programmer', [
          ['PI1.1', 'CM1 CM2', 'Utiliser et produire le codage d’un déplacement (quartier, ville, robot)'],
          ['PI1.2', 'CM1 CM2', 'Coder un programme de calcul ou une suite avec un logiciel de programmation par blocs ou un tableur'],
        ]],
      ] },
    ],
    // Histoire-géographie : CM1 = programme du BO n° 22 du 28/05/2026 (objectifs = ses « attendus », plus évaluables) ;
    // CM2 = programme de 2020 (BO n° 31 du 30/07/2020) en 2026-2027 ({ a: 2026 }), puis celui de 2026 dès la rentrée 2027 ({ de: 2027 }).
    // Le programme de 2020 ne donne que des thèmes : les objectifs du CM2 2020 sont tirés de leurs « démarches et contenus ».
    // Démarches et méthodes : compétences travaillées du cycle (2020) et principes du programme 2026 ; elles comptent pour
    // l'histoire (D1), la géographie (D2) ou les deux (D3 à D5).
    HG: [
      { dom: 'H', nom: 'Histoire', livret: 1, comps: [
        ['H1', 'CM1 · La vie quotidienne au Moyen Âge (XIe-XIIIe siècles)', [
          ['H1.1', 'CM1', 'Situer le Moyen Âge sur une frise chronologique (476-1492)'],
          ['H1.2', 'CM1', 'Décrire les fonctions d’un château ou le fonctionnement d’une seigneurie'],
          ['H1.3', 'CM1', 'Raconter la vie quotidienne des paysans ou décrire les activités des villes au Moyen Âge'],
          ['H1.4', 'CM1', 'Décrire le rôle social de l’Église (assistance aux pauvres et aux malades, enseignement)'],
          ['H1.5', 'CM1', 'Différencier l’art roman de l’art gothique'],
        ]],
        ['H2', 'CM1 · La monarchie en France (XVIe-XVIIe siècles)', [
          ['H2.1', 'CM1', 'Situer sur une frise chronologique les règnes de François Ier, Henri IV et Louis XIV'],
          ['H2.2', 'CM1', 'Expliquer le rôle de François Ier (et de Léonard de Vinci) dans la diffusion de la Renaissance'],
          ['H2.3', 'CM1', 'Expliquer comment Henri IV pacifie le royaume pendant les guerres de religion'],
          ['H2.4', 'CM1', 'Expliquer comment le château de Versailles exprime le pouvoir absolu du roi'],
          ['H2.5', 'CM1', 'Décrire le rôle des femmes à la Cour de Versailles'],
          ['H2.6', 'CM1', 'Décrire la société d’ordres, majoritairement composée de paysans'],
        ]],
        ['H3', 'CM1 · Explorations et conquêtes par les Européens (XVe-XVIIe siècles)', [
          ['H3.1', 'CM1', 'Mémoriser plusieurs inventions permettant la navigation au grand large'],
          ['H3.2', 'CM1', 'Localiser les grands empires coloniaux sur une carte'],
          ['H3.3', 'CM1', 'Citer des conséquences des conquêtes sur les populations amérindiennes'],
          ['H3.4', 'CM1', 'Décrire les conditions de vie des esclaves dans une plantation'],
          ['H3.5', 'CM1', 'Nommer quelques denrées issues des colonies (tomate, chocolat, pomme de terre, sucre de canne…)'],
        ]],
        ['H4', 'CM1 · 1789, une année révolutionnaire en France', [
          ['H4.1', 'CM1', 'Décrire le contexte social, économique et intellectuel du royaume en 1789'],
          ['H4.2', 'CM1', 'Citer des idées des Lumières'],
          ['H4.3', 'CM1', 'Compléter une frise chronologique avec les évènements marquants de 1789'],
          ['H4.4', 'CM1', 'Raconter la vie et l’action d’une femme ou de femmes au cours de l’année 1789'],
          ['H4.5', 'CM1', 'Citer les principaux droits de la Déclaration des droits de l’Homme et du citoyen'],
        ]],
        ['H5', 'CM2 · Le temps de la République (programme 2020)', [
          ['H5.1', 'CM2', 'Savoir que les Français ont connu différents régimes politiques depuis la Révolution (1830, 1848, 1870)', { a: 2026 }],
          ['H5.2', 'CM2', 'Reconnaître les symboles républicains mis en scène par les cérémonies (1892 : la République a cent ans)', { a: 2026 }],
          ['H5.3', 'CM2', 'Décrire l’école gratuite, laïque et obligatoire au temps de Jules Ferry', { a: 2026 }],
          ['H5.4', 'CM2', 'Expliquer que nos libertés et nos droits sont le fruit d’une conquête ; connaître des devoirs du citoyen', { a: 2026 }],
          ['H5.5', 'CM2', 'Savoir qu’un nouveau processus de colonisation s’engage à cette période', { a: 2026 }],
        ]],
        ['H6', 'CM2 · L’âge industriel en France (programme 2020)', [
          ['H6.1', 'CM2', 'Nommer les énergies majeures de l’âge industriel (charbon puis pétrole) et quelques machines', { a: 2026 }],
          ['H6.2', 'CM2', 'Décrire le travail à la mine, à l’usine, à l’atelier ou au grand magasin', { a: 2026 }],
          ['H6.3', 'CM2', 'Décrire la ville industrielle et les changements du monde rural', { a: 2026 }],
        ]],
        ['H7', 'CM2 · La France, des guerres mondiales à l’Union européenne (programme 2020)', [
          ['H7.1', 'CM2', 'Situer les deux guerres mondiales et leur ampleur, à partir de traces proches (lieux de mémoire, commémorations)', { a: 2026 }],
          ['H7.2', 'CM2', 'Évoquer la Résistance, la France combattante et la collaboration', { a: 2026 }],
          ['H7.3', 'CM2', 'Connaître le génocide des Juifs et les persécutions d’autres populations', { a: 2026 }],
          ['H7.4', 'CM2', 'Expliquer que des pays européens autrefois en guerre sont aujourd’hui rassemblés dans l’Union européenne', { a: 2026 }],
        ]],
        ['H8', 'CM2 · De la République à l’Empire (1792-1815)', [
          ['H8.1', 'CM2', 'Raconter comment les Français et les Françaises participent à la vie politique depuis 1789', { de: 2027 }],
          ['H8.2', 'CM2', 'Raconter la chute du roi et la naissance de la République', { de: 2027 }],
          ['H8.3', 'CM2', 'Raconter le combat pour l’abolition de l’esclavage', { de: 2027 }],
          ['H8.4', 'CM2', 'Expliquer comment Bonaparte devient empereur', { de: 2027 }],
          ['H8.5', 'CM2', 'Nommer des réformes menées par Napoléon Bonaparte (Code civil, lycées, rétablissement de l’esclavage…)', { de: 2027 }],
        ]],
        ['H9', 'CM2 · Vers une France républicaine (1848-1914)', [
          ['H9.1', 'CM2', 'Nommer de grandes lois fondatrices de la République (suffrage universel masculin, abolition de l’esclavage, liberté de la presse, lois scolaires, laïcité)', { de: 2027 }],
          ['H9.2', 'CM2', 'Nommer les symboles de la République (drapeau tricolore, 14 juillet, Marianne, la Marseillaise, la devise)', { de: 2027 }],
          ['H9.3', 'CM2', 'Localiser sur un planisphère l’empire colonial français au début du XXe siècle', { de: 2027 }],
        ]],
        ['H10', 'CM2 · L’âge industriel en France au XIXe siècle', [
          ['H10.1', 'CM2', 'Expliquer les transformations de la vie quotidienne liées aux progrès techniques et scientifiques', { de: 2027 }],
          ['H10.2', 'CM2', 'Nommer quelques progrès de la médecine', { de: 2027 }],
          ['H10.3', 'CM2', 'Décrire les conditions de vie et les luttes des ouvriers, et la vie quotidienne des bourgeois', { de: 2027 }],
        ]],
        ['H11', 'CM2 · La France dans la Première Guerre mondiale (1914-1918)', [
          ['H11.1', 'CM2', 'Situer la Première Guerre mondiale sur une frise chronologique', { de: 2027 }],
          ['H11.2', 'CM2', 'Raconter la vie sur le front : combats et conditions de vie', { de: 2027 }],
          ['H11.3', 'CM2', 'Expliquer la mobilisation humaine (dont le rôle des femmes), économique, industrielle et culturelle', { de: 2027 }],
          ['H11.4', 'CM2', 'Mémoriser des éléments du bilan humain (10 millions de morts au combat, dont 1,4 million de Français)', { de: 2027 }],
        ]],
        ['H12', 'CM2 · La France pendant la Seconde Guerre mondiale (1939-1945)', [
          ['H12.1', 'CM2', 'Mémoriser les étapes de la guerre en France (drôle de guerre, défaite, occupation et collaboration, libération)', { de: 2027 }],
          ['H12.2', 'CM2', 'Décrire les difficultés de la vie sous l’Occupation', { de: 2027 }],
          ['H12.3', 'CM2', 'Identifier le rôle du général de Gaulle ou de Jean Moulin dans la Résistance', { de: 2027 }],
          ['H12.4', 'CM2', 'Expliquer la politique antisémite du régime de Vichy, ou l’action des « Justes parmi les Nations »', { de: 2027 }],
          ['H12.5', 'CM2', 'Mémoriser des éléments du bilan humain (60 à 70 millions de morts, dont 6 millions de Juifs)', { de: 2027 }],
        ]],
        ['H13', 'CM2 · La France depuis 1945 : 80 ans de transformations', [
          ['H13.1', 'CM2', 'Citer un exemple de réforme sociale et un exemple de droit des femmes', { de: 2027 }],
          ['H13.2', 'CM2', 'Citer la date de la fondation de la Ve République (1958)', { de: 2027 }],
          ['H13.3', 'CM2', 'Décrire les transformations de la société française depuis 1945', { de: 2027 }],
          ['H13.4', 'CM2', 'Raconter les grandes étapes de la construction européenne', { de: 2027 }],
        ]],
      ] },
      { dom: 'GE', nom: 'Géographie', livret: 2, comps: [
        ['GE1', 'CM1 · Se nourrir', [
          ['GE1.1', 'CM1', 'Décrire les différences de pratiques alimentaires entre un pays riche et un pays en développement'],
          ['GE1.2', 'CM1', 'Distinguer produits agricoles et produits transformés'],
          ['GE1.3', 'CM1', 'Décrire la chaîne de production d’un aliment consommé (yaourt, biscuit, fruit…)'],
        ]],
        ['GE2', 'CM1 · Les inégalités dans le monde', [
          ['GE2.1', 'CM1', 'Identifier les manifestations des inégalités de niveau de vie dans le monde'],
          ['GE2.2', 'CM1', 'Localiser et nommer les aires régionales sur un planisphère'],
        ]],
        ['GE3', 'CM1 · Se déplacer', [
          ['GE3.1', 'CM1', 'Identifier la diversité des modes de déplacement selon la distance à parcourir'],
          ['GE3.2', 'CM1', 'Associer les modes de transport et leurs infrastructures (avion et aéroport, train et gare…)'],
        ]],
        ['GE4', 'CM1 · Communiquer dans le monde avec Internet', [
          ['GE4.1', 'CM1', 'Expliquer qu’Internet repose sur des câbles continentaux et sous-marins et sur des satellites'],
          ['GE4.2', 'CM1', 'Décrire les inégalités d’accès à Internet dans le monde et en France'],
        ]],
        ['GE5', 'CM2 · Se déplacer (programme 2020)', [
          ['GE5.1', 'CM2', 'Décrire les modes et réseaux de transport utilisés au quotidien, en France et ailleurs dans le monde', { a: 2026 }],
          ['GE5.2', 'CM2', 'Identifier les aménagements liés aux infrastructures de transport', { a: 2026 }],
          ['GE5.3', 'CM2', 'Relier les déplacements au développement durable (pollution, nouvelles mobilités)', { a: 2026 }],
        ]],
        ['GE6', 'CM2 · Communiquer d’un bout à l’autre du monde grâce à l’Internet (programme 2020)', [
          ['GE6.1', 'CM2', 'Décrire les infrastructures nécessaires au fonctionnement d’Internet', { a: 2026 }],
          ['GE6.2', 'CM2', 'Constater les inégalités d’accès à Internet en France et dans le monde', { a: 2026 }],
        ]],
        ['GE7', 'CM2 · Mieux habiter (programme 2020)', [
          ['GE7.1', 'CM2', 'Décrire la place de la « nature » en ville (espaces verts, circulations douces, biodiversité)', { a: 2026 }],
          ['GE7.2', 'CM2', 'Expliquer l’intérêt du recyclage, au-delà du tri des déchets', { a: 2026 }],
          ['GE7.3', 'CM2', 'Décrire un écoquartier et les choix d’aménagement qui contribuent à « mieux habiter »', { a: 2026 }],
        ]],
        ['GE8', 'CM2 · L’organisation du territoire français', [
          ['GE8.1', 'CM2', 'Localiser et nommer les principales agglomérations et les grands axes de transport français', { de: 2027 }],
          ['GE8.2', 'CM2', 'Localiser et nommer les régions administratives, leur capitale, et le département où l’on vit', { de: 2027 }],
          ['GE8.3', 'CM2', 'Décrire les principales caractéristiques de deux régions, dont celle de l’école', { de: 2027 }],
        ]],
        ['GE9', 'CM2 · Les usages de l’eau douce en France', [
          ['GE9.1', 'CM2', 'Décrire les différents usages de l’eau en France', { de: 2027 }],
          ['GE9.2', 'CM2', 'Expliquer sur un exemple que l’eau est une ressource convoitée (conflits d’usages)', { de: 2027 }],
          ['GE9.3', 'CM2', 'Localiser les grands fleuves et les principaux massifs de montagne français', { de: 2027 }],
        ]],
        ['GE10', 'CM2 · L’Union européenne', [
          ['GE10.1', 'CM2', 'Expliquer la différence entre l’Europe (continent) et l’Union européenne (construction politique)', { de: 2027 }],
          ['GE10.2', 'CM2', 'Localiser et nommer dix pays de l’Union européenne, dont les six pays fondateurs', { de: 2027 }],
        ]],
      ] },
      { dom: 'D', nom: 'Démarches et méthodes', livret: [1, 2], comps: [
        ['D1', 'Se repérer dans le temps', [
          ['D1.1', 'CM1 CM2', 'Situer chronologiquement de grandes périodes historiques'],
          ['D1.2', 'CM1 CM2', 'Ordonner des faits et les situer dans une époque ou une période'],
          ['D1.3', 'CM1 CM2', 'Utiliser une frise chronologique et le lexique du découpage du temps'],
          ['D1.4', 'CM1 CM2', 'Mémoriser les repères historiques du programme et savoir les mobiliser'],
        ], 1],
        ['D2', 'Se repérer dans l’espace', [
          ['D2.1', 'CM1 CM2', 'Nommer et localiser les grands repères géographiques'],
          ['D2.2', 'CM1 CM2', 'Situer des lieux et des espaces les uns par rapport aux autres'],
          ['D2.3', 'CM1 CM2', 'Appréhender la notion d’échelle géographique'],
          ['D2.4', 'CM1 CM2', 'Mémoriser les repères géographiques du programme et savoir les mobiliser'],
        ], 2],
        ['D3', 'Comprendre un document', [
          ['D3.1', 'CM1 CM2', 'Identifier un document (nature, auteur, date) et savoir pourquoi'],
          ['D3.2', 'CM1 CM2', 'Extraire des informations pertinentes pour répondre à une question'],
          ['D3.3', 'CM1 CM2', 'Savoir qu’un document exprime un point de vue'],
          ['D3.4', 'CM1 CM2', 'Différencier un récit historique d’un récit de fiction'],
        ]],
        ['D4', 'Raisonner et pratiquer différents langages', [
          ['D4.1', 'CM1 CM2', 'Poser des questions, formuler des hypothèses, vérifier, justifier'],
          ['D4.2', 'CM1 CM2', 'Écrire pour structurer sa pensée et son savoir (résumé, écrit personnel)'],
          ['D4.3', 'CM1 CM2', 'S’exprimer à l’oral et utiliser le lexique de l’histoire et de la géographie'],
          ['D4.4', 'CM1 CM2', 'Réaliser ou compléter une production graphique (frise, carte, croquis, schéma)'],
          ['D4.5', 'CM1 CM2', 'Utiliser des cartes à différentes échelles et des photographies de paysages ou de lieux'],
        ]],
        ['D5', 'S’informer dans le monde du numérique, coopérer', [
          ['D5.1', 'CM1 CM2', 'Trouver, sélectionner et exploiter des informations dans une ressource numérique'],
          ['D5.2', 'CM1 CM2', 'S’interroger sur la fiabilité d’une source, notamment numérique'],
          ['D5.3', 'CM1 CM2', 'Coopérer pour réaliser une tâche commune ou une production collective'],
        ]],
      ] },
    ],
    // Sciences et technologie : CM1 = programme du BO n° 24 du 11/06/2026 (objectifs d'apprentissage) ; CM2 = programme de 2023
    // (BO n° 25 du 22/06/2023) en 2026-2027 ({ a: 2026 } : ses « attendus de fin de cycle »), puis celui de 2026 dès la rentrée 2027.
    // Démarches : compétences travaillées du programme de 2023, communes au CM1 et au CM2. Un seul domaine au livret (1).
    ST: [
      { dom: 'MS', nom: 'La matière, les mouvements et les signaux', livret: 1, comps: [
        ['MS1', 'États et constitution de la matière', [
          ['MS1.1', 'CM1', 'Comparer les masses de différents objets avec un dispositif simple (poulie, balance romaine, à fléau, à plateaux)'],
          ['MS1.2', 'CM1', 'Mesurer la masse d’un solide ou d’un liquide avec une balance, en la tarant si besoin'],
          ['MS1.3', 'CM1', 'Distinguer des mélanges homogènes et des mélanges hétérogènes'],
          ['MS1.4', 'CM1', 'Séparer les constituants d’un mélange par tamisage, décantation, filtration'],
          ['MS1.5', 'CM1', 'Constater que certains solides peuvent se dissoudre dans l’eau'],
          ['MS1.6', 'CM1', 'Observer la saturation lors du mélange d’un solide dans l’eau et en rendre compte par des quantités'],
          ['MS1.7', 'CM2', 'Convertir des unités de masse (tonne, kilogramme, gramme, milligramme)', { de: 2027 }],
          ['MS1.8', 'CM2', 'Mesurer le volume d’un liquide, et celui d’un solide par déplacement de liquide', { de: 2027 }],
          ['MS1.9', 'CM2', 'Montrer par l’expérience que la masse se conserve lors du mélange d’un solide dans un liquide', { de: 2027 }],
          ['MS1.10', 'CM2', 'Montrer par l’expérience que, lors d’une dissolution, le volume total n’est pas forcément la somme des volumes', { de: 2027 }],
          ['MS1.11', 'CM2', 'Récupérer un solide dissous dans l’eau par évaporation', { de: 2027 }],
          ['MS1.12', 'CM2', 'Différencier les états solide, liquide et gazeux', { de: 2027 }],
          ['MS1.13', 'CM2', 'Observer les changements d’état, leur réversibilité, et les nommer', { de: 2027 }],
          ['MS1.14', 'CM2', 'Identifier les états physiques de la matière dans la nature, en particulier ceux de l’eau', { de: 2027 }],
        ]],
        ['MS2', 'Différents types de mouvement', [
          ['MS2.1', 'CM1', 'Mesurer une distance lors du déplacement d’un objet'],
          ['MS2.2', 'CM1', 'Mesurer une durée lors du déplacement d’un objet'],
          ['MS2.3', 'CM2', 'Identifier un mouvement rectiligne ou circulaire par rapport à un observateur', { de: 2027 }],
          ['MS2.4', 'CM2', 'Décrire le mouvement de la Terre par rapport au Soleil et la situer dans le système solaire', { de: 2027 }],
          ['MS2.5', 'CM2', 'Convertir des unités de distance et de temps', { de: 2027 }],
        ]],
        ['MS3', 'Signaux : la lumière, l’électricité', [
          ['MS3.1', 'CM1', 'Classer des matériaux selon qu’ils sont transparents, translucides ou opaques à la lumière'],
          ['MS3.2', 'CM1', 'Produire une ombre avec un objet opaque et distinguer ombre propre et ombre portée'],
          ['MS3.3', 'CM1', 'Associer la position et la taille d’une ombre à celles de la source lumineuse et de l’objet'],
          ['MS3.4', 'CM1', 'Observer, schématiser et nommer les phases de la Lune'],
          ['MS3.5', 'CM2', 'Réaliser un circuit électrique à une boucle (pile, interrupteur, une ou deux ampoules)', { de: 2027 }],
          ['MS3.6', 'CM2', 'Rechercher les règles de sécurité électrique et les appliquer', { de: 2027 }],
          ['MS3.7', 'CM2', 'Identifier des matériaux conducteurs et isolants électriques', { de: 2027 }],
        ]],
        ['MS4', 'CM2 · Matière, mouvement, énergie, information (programme 2023)', [
          ['MS4.1', 'CM2', 'Décrire un échantillon de matière avec le vocabulaire scientifique et les grandeurs masse et volume', { a: 2026 }],
          ['MS4.2', 'CM2', 'Caractériser la diversité de la matière et de ses transformations', { a: 2026 }],
          ['MS4.3', 'CM2', 'Utiliser les propriétés physiques des matériaux pour les classer, notamment pour le tri', { a: 2026 }],
          ['MS4.4', 'CM2', 'Décrire un mouvement en précisant le point de vue, et le caractériser par des mesures', { a: 2026 }],
          ['MS4.5', 'CM2', 'Identifier les formes d’énergie mises en jeu dans un dispositif de conversion d’énergie', { a: 2026 }],
          ['MS4.6', 'CM2', 'Rechercher et exploiter des informations sur les ressources en énergie, avec esprit critique', { a: 2026 }],
          ['MS4.7', 'CM2', 'Interpréter la formation d’ombres, en particulier dans le système Soleil-Terre-Lune', { a: 2026 }],
          ['MS4.8', 'CM2', 'Réaliser des circuits électriques à une boucle en respectant les consignes de sécurité', { a: 2026 }],
          ['MS4.9', 'CM2', 'Identifier des signaux de natures différentes et citer des applications', { a: 2026 }],
        ]],
      ] },
      { dom: 'VE', nom: 'Les êtres vivants dans leur environnement', livret: 1, comps: [
        ['VE1', 'Unité et diversité du vivant', [
          ['VE1.1', 'CM1', 'Définir une espèce comme un ensemble d’individus capables de se reproduire entre eux'],
          ['VE1.2', 'CM1', 'Classer en groupes emboîtés quelques espèces d’après leurs attributs, et en déduire des liens de parenté'],
          ['VE1.3', 'CM1', 'Identifier des espèces avec une clé de détermination'],
          ['VE1.4', 'CM2', 'Distinguer l’échelle des temps géologiques (temps long) de celle de l’histoire humaine', { de: 2027 }],
          ['VE1.5', 'CM2', 'Caractériser des changements de la biodiversité au cours de l’histoire de la Terre grâce aux fossiles', { de: 2027 }],
        ]],
        ['VE2', 'Reproduction, croissance et développement', [
          ['VE2.1', 'CM1', 'Décrire les étapes du développement des animaux, de la fécondation à la naissance'],
          ['VE2.2', 'CM1', 'Relier la fécondation (interne ou externe) au mode de reproduction ovipare ou vivipare'],
        ]],
        ['VE3', 'Les écosystèmes', [
          ['VE3.1', 'CM1', 'Définir un écosystème : des êtres vivants, leur milieu de vie et leurs relations'],
          ['VE3.2', 'CM1', 'Relier la production de matière par les animaux à leur nourriture, venue d’autres êtres vivants'],
          ['VE3.3', 'CM1', 'Expérimenter pour identifier les besoins des végétaux et les relier à la production de matière'],
          ['VE3.4', 'CM1', 'Représenter par un réseau les liens alimentaires entre les êtres vivants'],
          ['VE3.5', 'CM1', 'Envisager les conséquences d’une action humaine sur un réseau alimentaire'],
          ['VE3.6', 'CM2', 'S’impliquer dans un projet d’éducation au développement durable (climat, biodiversité, ressources, déchets…)', { de: 2027 }],
          ['VE3.7', 'CM2', 'Développer un rapport sensible à la nature et la volonté d’agir pour la protéger', { de: 2027 }],
        ]],
        ['VE4', 'La Terre, une planète active', [
          ['VE4.1', 'CM1', 'Réaliser et exploiter des mesures météorologiques avec des capteurs (thermomètre, pluviomètre, anémomètre)'],
          ['VE4.2', 'CM1', 'Caractériser les variations météorologiques de son espace de vie (journée, semaine, mois, saison)'],
          ['VE4.3', 'CM2', 'Repérer des manifestations de l’activité interne ou externe de la Terre', { de: 2027 }],
          ['VE4.4', 'CM2', 'Définir un risque naturel et identifier les mesures de prévention et de protection associées', { de: 2027 }],
          ['VE4.5', 'CM2', 'Définir le climat local (conditions météorologiques sur plusieurs années dans une région)', { de: 2027 }],
          ['VE4.6', 'CM2', 'Décrire quelques conséquences du changement climatique récent sur son environnement proche', { de: 2027 }],
          ['VE4.7', 'CM2', 'Citer des stratégies d’atténuation ou d’adaptation au changement climatique', { de: 2027 }],
        ]],
        ['VE5', 'CM2 · Le vivant, la planète Terre (programme 2023)', [
          ['VE5.1', 'CM2', 'Caractériser la richesse, l’unité et la diversité actuelle et passée du vivant', { a: 2026 }],
          ['VE5.2', 'CM2', 'Classer les organismes et établir des liens de parenté', { a: 2026 }],
          ['VE5.3', 'CM2', 'Décrire le cycle de vie d’une plante à fleurs et celui d’un animal', { a: 2026 }],
          ['VE5.4', 'CM2', 'Identifier l’activité de la planète Terre et ses conséquences', { a: 2026 }],
          ['VE5.5', 'CM2', 'Décrire les conditions de la vie terrestre', { a: 2026 }],
          ['VE5.6', 'CM2', 'Différencier la météorologie du climat', { a: 2026 }],
          ['VE5.7', 'CM2', 'Construire une argumentation scientifique pour expliquer le réchauffement climatique actuel', { a: 2026 }],
          ['VE5.8', 'CM2', 'Décrire un écosystème et les interactions qui s’y déroulent', { a: 2026 }],
          ['VE5.9', 'CM2', 'Montrer la place et l’interdépendance des êtres vivants dans un réseau alimentaire', { a: 2026 }],
          ['VE5.10', 'CM2', 'Caractériser les conséquences d’une action humaine sur un écosystème', { a: 2026 }],
        ]],
      ] },
      { dom: 'CH', nom: 'Le corps humain et la santé', livret: 1, comps: [
        ['CH1', 'Le cerveau', [
          ['CH1.1', 'CM1', 'Localiser le cerveau et l’associer à ses fonctions (perception, mouvement, langage, mémoire, émotions, rêves)'],
          ['CH1.2', 'CM1', 'Comprendre que notre perception du monde peut différer de sa réalité physique (illusions)'],
          ['CH1.3', 'CM1', 'Trouver des stratégies pour focaliser son attention et mémoriser une information'],
        ]],
        ['CH2', 'Puberté et reproduction humaine', [
          ['CH2.1', 'CM1', 'Décrire et identifier les changements du corps au moment de la puberté'],
          ['CH2.2', 'CM1', 'Comprendre que la puberté arrive à des âges différents, avec des effets différents, et que ces changements sont normaux'],
          ['CH2.3', 'CM2', 'Nommer les organes reproducteurs et les associer à leur fonction', { de: 2027 }],
          ['CH2.4', 'CM2', 'Définir scientifiquement les menstruations (règles)', { de: 2027 }],
        ]],
        ['CH3', 'Alimentation humaine', [
          ['CH3.1', 'CM2', 'Exploiter des données montrant le besoin de matière pour la croissance et le développement', { de: 2027 }],
          ['CH3.2', 'CM2', 'Expliquer la variation des besoins alimentaires selon la croissance et l’activité physique', { de: 2027 }],
          ['CH3.3', 'CM2', 'Identifier la transformation des aliments en nutriments dans l’appareil digestif', { de: 2027 }],
          ['CH3.4', 'CM2', 'Nommer et localiser les organes du système digestif et leur fonction', { de: 2027 }],
          ['CH3.5', 'CM2', 'Identifier le rôle de la circulation sanguine dans l’apport de nutriments aux organes', { de: 2027 }],
          ['CH3.6', 'CM2', 'Relier l’accélération du cœur pendant un effort aux besoins accrus des muscles', { de: 2027 }],
        ]],
        ['CH4', 'CM2 · Le corps humain (programme 2023)', [
          ['CH4.1', 'CM2', 'Expliquer le rôle des aliments pour le fonctionnement de l’organisme', { a: 2026 }],
          ['CH4.2', 'CM2', 'Identifier les principes des techniques de transformation et de conservation des aliments', { a: 2026 }],
          ['CH4.3', 'CM2', 'Décrire les changements pubertaires associés à la capacité de se reproduire', { a: 2026 }],
          ['CH4.4', 'CM2', 'Distinguer la dimension biologique de la sexualité humaine de ses autres dimensions', { a: 2026 }],
        ]],
      ] },
      { dom: 'OT', nom: 'Les objets techniques au cœur de la société', livret: 1, comps: [
        ['OT1', 'Les objets techniques et les besoins', [
          ['OT1.1', 'CM1', 'Repérer les évolutions d’un objet selon le contexte (historique, géographique, économique, culturel, durable)'],
          ['OT1.2', 'CM1', 'Comparer des réponses à des besoins dans différents contextes'],
        ]],
        ['OT2', 'Fonctionnement et constitution des objets techniques', [
          ['OT2.1', 'CM1', 'Identifier les fonctions assurées par les composants, les formes ou les matériaux d’un objet technique'],
          ['OT2.2', 'CM1', 'Associer les solutions technologiques aux fonctions techniques'],
          ['OT2.3', 'CM1', 'Représenter les éléments d’un objet technique par un croquis à main levée'],
          ['OT2.4', 'CM1', 'Identifier les sous-ensembles d’un objet technique'],
          ['OT2.5', 'CM1', 'Décrire le fonctionnement d’un objet technique à l’aide d’un croquis'],
        ]],
        ['OT3', 'Concevoir et réaliser un objet technique', [
          ['OT3.1', 'CM2', 'Rechercher des idées de solutions par des croquis pour résoudre un problème technique', { de: 2027 }],
          ['OT3.2', 'CM2', 'Associer une contrainte à un choix de matériau selon ses propriétés physiques', { de: 2027 }],
          ['OT3.3', 'CM2', 'Organiser la conception d’une maquette et la fabriquer', { de: 2027 }],
          ['OT3.4', 'CM2', 'Comparer des solutions par une analyse critique (transition écologique, développement durable)', { de: 2027 }],
        ]],
        ['OT4', 'Programmation d’objets techniques', [
          ['OT4.1', 'CM1', 'Traduire un programme simple en langage naturel'],
          ['OT4.2', 'CM1', 'Utiliser un programme pour agir sur le comportement d’un objet technique'],
          ['OT4.3', 'CM2', 'Comprendre un algorithme agissant sur le comportement d’un objet technique', { de: 2027 }],
          ['OT4.4', 'CM2', 'Modifier, tester et valider un programme d’après le comportement de l’objet', { de: 2027 }],
        ]],
        ['OT5', 'CM2 · Matériaux et objets techniques (programme 2023)', [
          ['OT5.1', 'CM2', 'Identifier un besoin de la société et lui associer des objets techniques', { a: 2026 }],
          ['OT5.2', 'CM2', 'Distinguer un objet technique d’un objet naturel', { a: 2026 }],
          ['OT5.3', 'CM2', 'Repérer les évolutions des objets techniques selon leur contexte d’utilisation', { a: 2026 }],
          ['OT5.4', 'CM2', 'Distinguer besoins, fonctions techniques et solutions technologiques', { a: 2026 }],
          ['OT5.5', 'CM2', 'Décrire un objet technique par un schéma (fonctionnement) et un croquis (ce que l’on observe)', { a: 2026 }],
          ['OT5.6', 'CM2', 'Pratiquer la démarche technologique dans un projet et participer à un travail collectif', { a: 2026 }],
          ['OT5.7', 'CM2', 'Repérer la chaîne d’information et la chaîne d’action d’un objet programmable', { a: 2026 }],
          ['OT5.8', 'CM2', 'Programmer un objet technique pour obtenir un comportement attendu', { a: 2026 }],
        ]],
      ] },
      { dom: 'DS', nom: 'Démarches scientifiques et technologiques', livret: 1, comps: [
        ['DS1', 'Pratiquer des démarches scientifiques', [
          ['DS1.1', 'CM1 CM2', 'Formuler une question ou un problème scientifique ou technologique'],
          ['DS1.2', 'CM1 CM2', 'Formuler des hypothèses qui peuvent être testées'],
          ['DS1.3', 'CM1 CM2', 'Proposer ou suivre un protocole expérimental'],
          ['DS1.4', 'CM1 CM2', 'Utiliser des instruments d’observation et de mesure'],
          ['DS1.5', 'CM1 CM2', 'Interpréter des résultats et en tirer une conclusion argumentée'],
        ]],
        ['DS2', 'Pratiquer des langages', [
          ['DS2.1', 'CM1 CM2', 'Rendre compte de ses activités avec un vocabulaire scientifique précis'],
          ['DS2.2', 'CM1 CM2', 'Représenter par un schéma, un croquis, un tableau ou un graphique, et passer de l’un à l’autre'],
          ['DS2.3', 'CM1 CM2', 'Expliquer un phénomène à l’oral et à l’écrit'],
        ]],
        ['DS3', 'Esprit critique, comportement responsable', [
          ['DS3.1', 'CM1 CM2', 'Identifier des sources d’information fiables'],
          ['DS3.2', 'CM1 CM2', 'Distinguer une croyance d’un savoir scientifique'],
          ['DS3.3', 'CM1 CM2', 'Relier ses connaissances à des questions de santé, de sécurité et d’environnement'],
        ]],
      ] },
    ],
    // Enseignement moral et civique : programme du CP à la terminale, BO n° 24 du 13/06/2024 (même programme en 2026-2027).
    // CM1 « Faire société » (3 axes), CM2 « Vivre en République » (4 axes) : un domaine par axe, une compétence par notion ;
    // objectifs = « contenus d'enseignement » du texte, raccourcis. Les lignes marquées « dérivé » viennent de la colonne
    // « Démarches et situations d'apprentissage possibles » (ou des « Méthodes » pour le domaine Démarches), pas des contenus.
    // Un seul domaine au livret (1).
    EMC: [
      { dom: 'CC', nom: 'Civisme et citoyenneté (CM1)', livret: 1, comps: [
        ['EMC1', 'Civisme', [
          ['EMC1.1', 'CM1', 'Définir le civisme comme l’action d’un individu en fonction du bien public et dans le respect des règles'],
          ['EMC1.2', 'CM1', 'Donner des exemples de comportement civique dans la classe, l’école, la vie quotidienne, en ligne et en faveur de l’environnement'],
          ['EMC1.3', 'CM1', 'Reconnaître des situations de danger, alerter et se mettre en sécurité'], // dérivé (APS, APER)
        ]],
        ['EMC2', 'Sobriété numérique', [
          ['EMC2.1', 'CM1', 'Appliquer en ligne (ENT, blog de classe) les règles de civisme demandées hors ligne'], // dérivé (EMI)
          ['EMC2.2', 'CM1', 'Distinguer émetteur et récepteur, aborder la notion de source et interroger l’information'], // dérivé (EMI)
          ['EMC2.3', 'CM1', 'Connaître les conséquences des usages du numérique sur l’environnement et l’importance de la sobriété numérique'], // dérivé (EMI)
        ]],
        ['EMC3', 'Incivilités', [
          ['EMC3.1', 'CM1', 'Connaître et appliquer les règles de civilité en société'],
          ['EMC3.2', 'CM1', 'Identifier les incivilités et comprendre pourquoi elles nuisent à la vie en commun'],
        ]],
        ['EMC4', 'Démocratie', [
          ['EMC4.1', 'CM1', 'Connaître la signification du terme « démocratie »'],
          ['EMC4.2', 'CM1', 'Comprendre le fonctionnement du suffrage direct'],
          ['EMC4.3', 'CM1', 'Relier la démocratie scolaire (conseil d’élèves) à la citoyenneté, au vote et à la participation aux décisions'], // dérivé
        ]],
      ] },
      { dom: 'ED', nom: 'L’égalité dans la dignité (CM1)', livret: 1, comps: [
        ['EMC5', 'Égalité, dignité, discriminations, tolérance', [
          ['EMC5.1', 'CM1', 'Comprendre la notion d’égalité en droit'],
          ['EMC5.2', 'CM1', 'Comprendre ce qu’implique le principe de dignité de la personne humaine'],
          ['EMC5.3', 'CM1', 'Identifier des situations où l’égalité n’est pas respectée, des discriminations ou des atteintes à autrui'], // dérivé
          ['EMC5.4', 'CM1', 'Savoir que les cyberviolences peuvent entraîner du harcèlement en ligne et connaître la règle'], // dérivé (EMI)
        ]],
      ] },
      { dom: 'FS', nom: 'Comment faire société (CM1)', livret: 1, comps: [
        ['EMC6', 'Fraternité et empathie', [
          ['EMC6.1', 'CM1', 'Comprendre la notion de fraternité, valeur et principe de la République'],
          ['EMC6.2', 'CM1', 'Comprendre ce qu’implique et permet l’empathie'],
          ['EMC6.3', 'CM1', 'Définir égoïsme et altruisme'], // dérivé
          ['EMC6.4', 'CM1', 'Lors d’un débat réglé, exprimer ses opinions en tenant compte de la sensibilité des autres (nuancer son propos)'], // dérivé
        ]],
      ] },
      { dom: 'CN', nom: 'Citoyenneté et nationalité (CM2)', livret: 1, comps: [
        ['EMC7', 'Citoyenneté, droits civils et politiques', [
          ['EMC7.1', 'CM2', 'Connaître les conditions d’acquisition de la nationalité française et le lien entre citoyenneté et nationalité'],
          ['EMC7.2', 'CM2', 'Savoir que tout individu bénéficie de droits civils, et qu’un citoyen a aussi des droits politiques à sa majorité'],
          ['EMC7.3', 'CM2', 'Citer quelques droits de la DDHC (liberté d’expression, d’opinion, sûreté) et les distinguer des droits politiques (vote, éligibilité)'], // dérivé (« l'élève doit être en mesure »)
          ['EMC7.4', 'CM2', 'Connaître le rôle politique des citoyens : participer à la vie politique du pays et à l’évolution des institutions'],
          ['EMC7.5', 'CM2', 'Découvrir les procédures générales d’élaboration de la loi'],
        ]],
        ['EMC8', 'Devoirs', [
          ['EMC8.1', 'CM2', 'Connaître les devoirs du citoyen et de toute personne résidant en France : respecter les lois, contribuer à financer les dépenses publiques'],
          ['EMC8.2', 'CM2', 'Savoir que chaque citoyen doit respecter les droits des autres, identiques aux siens'],
          ['EMC8.3', 'CM2', 'Comprendre que le devoir est aussi une réalité morale qui guide le comportement dans l’espace public'],
          ['EMC8.4', 'CM2', 'Comprendre que les citoyens participent à l’élaboration des lois en même temps qu’ils doivent les respecter'], // dérivé (« l'élève doit comprendre »)
        ]],
        ['EMC9', 'Symboles républicains', [
          ['EMC9.1', 'CM2', 'Connaître et comprendre les symboles de la République : drapeau, hymne, devise, Marianne'],
          ['EMC9.2', 'CM2', 'Connaître la fête nationale du 14 juillet, héritière de la fête de la Fédération de 1790'],
          ['EMC9.3', 'CM2', 'Comprendre la nécessité de respecter les symboles républicains'],
          ['EMC9.4', 'CM2', 'Savoir que la République française est membre de l’Union européenne'],
        ]],
      ] },
      { dom: 'LD', nom: 'Libertés et droits fondamentaux (CM2)', livret: 1, comps: [
        ['EMC10', 'Liberté, droits fondamentaux', [
          ['EMC10.1', 'CM2', 'Connaître les droits et libertés fondamentaux de la DDHC (1789), de la DUDH (1948) et de la Charte des droits fondamentaux de l’UE (2000)'],
          ['EMC10.2', 'CM2', 'Connaître des droits qui en découlent : suffrage universel, droit à l’emploi, à la santé, à l’école publique gratuite, à la culture, droits environnementaux'],
          ['EMC10.3', 'CM2', 'Comprendre que les droits fondamentaux s’exercent dans le cadre de la loi (exemple de la liberté d’expression)'],
          ['EMC10.4', 'CM2', 'Expliquer que les libertés ont des limites pour que la liberté des uns n’entrave pas celle des autres (art. 4 DDHC)'], // dérivé
          ['EMC10.5', 'CM2', 'Connaître le droit de chacun de « vivre dans un environnement équilibré et respectueux de la santé » (droits de troisième génération)'],
          ['EMC10.6', 'CM2', 'Comprendre que l’accès à une information fiable et vérifiée est essentiel en démocratie'], // dérivé (EMI)
        ]],
      ] },
      { dom: 'RD', nom: 'Respecter les droits de tous (CM2)', livret: 1, comps: [
        ['EMC11', 'Discriminations, stéréotypes', [
          ['EMC11.1', 'CM2', 'Comprendre que la lutte contre les discriminations suppose de déconstruire les préjugés et les stéréotypes'],
          ['EMC11.2', 'CM2', 'Reconnaître les atteintes aux personnes : racisme, antisémitisme, sexisme, xénophobie, homophobie, harcèlement'],
          ['EMC11.3', 'CM2', 'Savoir que l’expression des discriminations est sanctionnée par la loi'],
          ['EMC11.4', 'CM2', 'Comprendre le rôle du témoin de discriminations ou de harcèlement et l’importance de les signaler'], // dérivé
        ]],
      ] },
      { dom: 'EL', nom: 'À l’école laïque (CM2)', livret: 1, comps: [
        ['EMC12', 'Laïcité', [
          ['EMC12.1', 'CM2', 'Savoir que le respect des croyances est assuré, mais que leur expression est limitée par la loi'],
          ['EMC12.2', 'CM2', 'Comprendre que la laïcité protège les élèves de toute influence religieuse et préserve leur liberté de conscience'],
          ['EMC12.3', 'CM2', 'Savoir que nul ne peut être discriminé pour ses croyances, mais que nul ne peut imposer les siennes aux autres'],
          ['EMC12.4', 'CM2', 'Expliquer pourquoi l’école est laïque à partir d’articles de la Charte de la laïcité'], // dérivé
        ]],
      ] },
      { dom: 'DM', nom: 'Démarches', livret: 1, comps: [ // dérivé : partie « Méthodes » du préambule
        ['EMC13', 'Débattre, argumenter, coopérer', [
          ['EMC13.1', 'CM1 CM2', 'Participer à un débat réglé ou à une discussion argumentée en respectant la parole des autres'],
          ['EMC13.2', 'CM1 CM2', 'Formuler clairement des arguments, à l’oral comme à l’écrit, en mobilisant des connaissances'],
          ['EMC13.3', 'CM1 CM2', 'Coopérer et confronter ses idées dans un travail de groupe ou un projet collectif'],
        ]],
      ] },
    ],
  },
};
// (Les 8 verbes irréguliers du programme : faire, aller, dire, venir, pouvoir, voir, vouloir, prendre.)
const VERBES_IRREGULIERS_CM = 'faire, aller, dire, venir, pouvoir, voir, vouloir, prendre';
