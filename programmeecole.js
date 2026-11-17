'use strict';
/* ---------- Carnet École : objectifs détaillés du programme (à cocher dans les évaluations) ----------
   Français, CM1 et CM2 : programme du cycle 3, BO n° 16 du 17 avril 2025 (CM1 depuis la rentrée 2025, CM2 depuis 2026),
   « objectifs d'apprentissage » de chaque compétence, année par année. Textes officiels, raccourcis quand ils sont très longs.
   Culture littéraire et artistique : le programme ne donne que des « entrées » ; les objectifs sont tirés de leur présentation.
   Conjugaison : une ligne par temps (le programme en donne une par année).
   Mathématiques, CM1 et CM2 : même BO, objectifs d'apprentissage année par année ; un objectif identique les deux années
   n'est écrit qu'une fois (« CM1 CM2 »). Pensée informatique : pas d'objectifs au cours moyen, deux lignes tirées du texte.
   EMC, CM1 et CM2 : BO n° 24 du 13 juin 2024, « contenus d'enseignement » de chaque notion ; quelques lignes tirées des démarches.
   Langue vivante, CM1 et CM2 : BO n° 12 du 19 mars 2026 (CM1 en 2026, CM2 en 2027, niveau A1) ; CM2 2026-2027 : programme de 2020.
   Enseignements artistiques, CM1 et CM2 : programme du cycle 3 de 2020 (BO n° 31 du 30 juillet 2020), toujours en vigueur.
   EPS, CM1 et CM2 : BO n° 22 du 28 mai 2026, partie « Cours moyen » (CM1 en 2026, CM2 en 2027) ; CM2 2026-2027 : programme de 2020.
   Cycle 2 (ecoleCycle2) — français et mathématiques, CP, CE1 et CE2 : BO n° 41 du 31 octobre 2024 (les trois niveaux depuis la rentrée 2025),
   « objectifs d'apprentissage » de chaque compétence, année par année (raccourcis ; repères de période gardés entre parenthèses) ;
   un objectif identique plusieurs années n'est écrit qu'une fois (« CP CE1 »). Maths : « utiliser ses connaissances en numération » et
   « apprendre des procédures de calcul mental » regroupés en une compétence (N5) ; organisation et gestion de données rangée sous Nombres.
   EMC, CP, CE1 et CE2 : BO n° 24 du 13 juin 2024, « contenus d'enseignement » de chaque thème ; quelques lignes tirées des démarches.
   Langue vivante, CP, CE1 et CE2 : BO n° 12 du 19 mars 2026 (CP en 2026, CE1-CE2 en 2027) ; CE1-CE2 2026-2027 : programme de 2020.
   Arts (cycle 2) : programme de 2020, toujours en vigueur. EPS (cycle 2) : BO n° 22 du 28 mai 2026 (CP en 2026, CE1-CE2 en 2027) ; CE1-CE2 2026-2027 : programme de 2020.
   Questionner le monde (cycle 2) : programme de 2020, CE1-CE2 en 2026-2027. Histoire-géographie (BO n° 22 du 28 mai 2026) et sciences
   et technologie (BO n° 24 du 11 juin 2026), cycle 2 : CP en 2026, CE1-CE2 à la rentrée 2027 ; voir champVisibleEcole (ecole.js).
   Chargé AVANT referentiel.js, qui range ces objectifs sous les domaines du livret (champ `objectifs` de la matière) :
   - `livret` : numéro du domaine du livret dont l'objectif nourrit le degré (FR : 1 Oral, 2 Lecture, 3 Écriture, 4 Langue ;
     MA : 1 Nombres et calcul, 2 Grandeurs et mesures, 3 Espace et géométrie ; HG : 1 Histoire, 2 Géographie, ou [1, 2] ; ST : 1 Sciences et technologie ;
     EMC : 1 Enseignement moral et civique ; LV : 1 Écouter et parler, 2 Lire et écrire, ou [1, 2] ;
     ART : 1 Arts plastiques, 2 Éducation musicale, 3 Histoire des arts ; EPS : 1 Éducation physique et sportive) ;
     un objectif peut aussi porter { niveauxDe: { CM2: 2027 } } : en vigueur au CM1 tout de suite, au CM2 à partir de 2027 ;
     une compétence peut avoir son propre `livret` (4e élément) ; un objectif peut porter { de: année } ou { a: année } (année scolaire) ;
   - l'identifiant d'un objectif est « ecoleCycle3.FR.L1.1 » : ne jamais changer un code déjà publié (des notes s'y rattachent).
   L'accord de l'école (objectifs retenus, objectifs ajoutés) est dans reglage('competences').accord : voir ecolecompetences.js. */

// Langue vivante : objectif du programme 2026 commun au CM1 et au CM2, mais en vigueur au CM2 seulement à la rentrée 2027.
const CM2_DES_2027 = { niveauxDe: { CM2: 2027 } };
// Cycle 2 : objectif du programme 2026 commun au CP et au CE1-CE2, en vigueur au CP tout de suite, au CE1 et au CE2 à la rentrée 2027.
const CE_DES_2027 = { niveauxDe: { CE1: 2027, CE2: 2027 } };

const PROGRAMMES_ECOLE = {
  ecoleCycle2: {
    FR: [
      { dom: 'L', nom: 'Lecture', livret: 2, comps: [
        ['L1', 'Identifier les mots de manière de plus en plus aisée', [
          ['L1.1', 'CP', 'Décoder et encoder 12 à 15 correspondances graphophonémiques (CGP) régulières (fin de période 1)'],
          ['L1.2', 'CP', 'Déchiffrer des syllabes, des mots puis des phrases selon la progression des CGP'],
          ['L1.3', 'CP', 'Décoder et encoder 25 à 30 CGP (milieu d’année)'],
          ['L1.4', 'CP', 'Prendre conscience des lettres finales muettes et s’appuyer sur le sens des mots pour les déchiffrer'],
          ['L1.5', 'CP', 'Mémoriser les mots fréquents et réguliers'],
          ['L1.6', 'CP', 'Déchiffrer entre 15 et 30 mots par minute (milieu d’année)'],
          ['L1.7', 'CP', 'Décoder 30 mots par minute au minimum sans préparation, 50 après préparation (fin d’année)'],
          ['L1.8', 'CE1', 'Automatiser le décodage des CGP apprises au CP'],
          ['L1.9', 'CE1', 'Décoder toutes les CGP, y compris les plus complexes'],
          ['L1.10', 'CE1', 'Avoir mémorisé l’ensemble des CGP dans tous les types d’écriture, en particulier celles des sons proches'],
          ['L1.11', 'CE1', 'Identifier directement les mots courants et déchiffrer avec exactitude les mots nouveaux'],
          ['L1.12', 'CE2', 'Avoir automatisé toutes les correspondances graphophonémiques (CGP)'],
          ['L1.13', 'CE2', 'Lire un texte nouveau en s’appuyant sur un décodage rapide'],
          ['L1.14', 'CE2', 'Automatiser la lecture des mots'],
          ['L1.15', 'CE2', 'Repérer les lettres muettes et décoder les mots inconnus en gardant sa vitesse de lecture'],
        ]],
        ['L2', 'Lire à voix haute', [
          ['L2.1', 'CP', 'Oraliser les syllabes déchiffrées et encodées, puis les mots'],
          ['L2.2', 'CP', 'Oraliser régulièrement les mots et phrases déchiffrés et encodés'],
          ['L2.3', 'CP', 'S’entraîner à lire des textes déchiffrables pour automatiser sa lecture'],
          ['L2.4', 'CP', 'Lire un texte adapté à 30 mots par minute au minimum sans préparation, 50 après préparation'],
          ['L2.5', 'CP', 'Identifier les marques de ponctuation et les prendre en compte sur un texte préparé'],
          ['L2.6', 'CP', 'Amorcer une lecture expressive'],
          ['L2.7', 'CE1', 'Lire un texte adapté à son niveau de lecture avec une vitesse de 70 mots par minute'],
          ['L2.8', 'CE1', 'Lire des textes narratifs, documentaires et prescriptifs en respectant la ponctuation et les groupes de souffle'],
          ['L2.9', 'CE1', 'Lire de manière expressive'],
          ['L2.10', 'CE2', 'Lire un texte adapté à son niveau de lecture avec une vitesse de 90 mots par minute'],
          ['L2.11', 'CE2', 'Lire un texte en respectant l’ensemble des marques de ponctuation et les liaisons'],
          ['L2.12', 'CE2', 'Manifester sa compréhension par une lecture expressive qui respecte la structure du texte et le sens'],
        ]],
        ['L3', 'Comprendre un texte', [
          ['L3.1', 'CP', 'Dégager le sens global d’un texte entendu ou lu de façon autonome'],
          ['L3.2', 'CP', 'Identifier les mots inconnus dans un texte et chercher à leur donner un sens'],
          ['L3.3', 'CP', 'Se repérer dans la chaîne anaphorique (un nom et ses reprises par un pronom ou un autre nom)'],
          ['L3.4', 'CP', 'Comprendre ce qui est implicite (inférences simples)'],
          ['L3.5', 'CP CE1', 'Justifier ses réponses par un retour au texte'],
          ['L3.6', 'CP', 'Lire et comprendre en autonomie un texte narratif, informatif ou prescriptif d’une dizaine de lignes'],
          ['L3.7', 'CE1', 'Dégager le sens global d’un texte lu, de façon autonome, après une séance dédiée à la compréhension'],
          ['L3.8', 'CE1', 'Développer des stratégies pour élucider le sens des mots et des expressions inconnus'],
          ['L3.9', 'CE1 CE2', 'Se repérer dans la chaîne anaphorique et s’appuyer sur le sens du texte pour résoudre des ambiguïtés'],
          ['L3.10', 'CE1', 'Comprendre ce qui est implicite dans le texte (inférences) dans des cas simples'],
          ['L3.11', 'CE1', 'Lire et comprendre en autonomie un texte narratif, informatif ou prescriptif d’une quinzaine de lignes'],
          ['L3.12', 'CE2', 'Dégager le sens d’un texte narratif, poétique, documentaire ou théâtral, lu seul ou par un adulte'],
          ['L3.13', 'CE2', 'Adopter une posture active par rapport au vocabulaire inconnu'],
          ['L3.14', 'CE2', 'Différencier le type narratif du type informatif et prescriptif'],
          ['L3.15', 'CE2', 'Comprendre l’implicite (inférences) en s’appuyant sur des indices explicites et ses connaissances'],
          ['L3.16', 'CE2', 'Revenir au texte pour identifier et comprendre les éléments complexes'],
          ['L3.17', 'CE2', 'Lire et comprendre en autonomie un texte narratif, informatif ou prescriptif d’une vingtaine de lignes'],
        ]],
        ['L4', 'Devenir lecteur', [
          ['L4.1', 'CP CE1', 'Lire 5 à 10 œuvres complètes et variées du patrimoine et de la littérature de jeunesse'],
          ['L4.2', 'CE2', 'Lire de manière autonome 5 à 10 œuvres complètes et variées du patrimoine et de la littérature de jeunesse'],
          ['L4.3', 'CP', 'Repérer et reconnaître des types de personnages'],
          ['L4.4', 'CP', 'Aller vers les livres et être capable d’en choisir à titre personnel'],
          ['L4.5', 'CE1', 'Se familiariser avec les différents genres et types de textes'],
          ['L4.6', 'CE1', 'Faire preuve d’initiative dans ses lectures personnelles en empruntant des livres selon ses goûts'],
          ['L4.7', 'CP CE1 CE2', 'Relier ses lectures à son expérience personnelle et établir des liens entre ses lectures (mise en réseau)'],
          ['L4.8', 'CP CE2', 'Fréquenter régulièrement des lieux de lecture et rencontrer des acteurs du livre'],
        ]],
      ] },
      { dom: 'E', nom: 'Écriture', livret: 3, comps: [
        ['E1', 'Apprendre à écrire en écriture cursive', [
          ['E1.1', 'CP', 'Écrire en écriture cursive tous les graphèmes étudiés selon la progression en décodage'],
          ['E1.2', 'CP', 'Les enchaîner avec fluidité avec d’autres lettres dans des syllabes, des mots, des phrases'],
          ['E1.3', 'CE1', 'Mémoriser le tracé normé et la transcription des minuscules scriptes en minuscules cursives'],
          ['E1.4', 'CE1', 'Reconnaître les lettres dans les quatre écritures (minuscules et majuscules, scriptes et cursives)'],
          ['E1.5', 'CE1', 'Apprendre le tracé normé des majuscules cursives par familles de gestes'],
          ['E1.6', 'CE2', 'Automatiser l’écriture de toutes les lettres minuscules et majuscules en cursive'],
        ]],
        ['E2', 'Encoder puis écrire sous dictée', [
          ['E2.1', 'CP', 'Encoder des syllabes simples puis des mots selon la progression des CGP'],
          ['E2.2', 'CP', 'Écrire des mots dictés avec des lettres muettes apprises (dès la fin de la 2e période)'],
          ['E2.3', 'CP', 'Écrire sous la dictée des mots et des phrases'],
          ['E2.4', 'CE1', 'Orthographier correctement les mots fréquents, réguliers puis irréguliers'],
          ['E2.5', 'CE1', 'Réaliser les accords en genre et en nombre dans le groupe nominal et dans le groupe verbal (-nt)'],
          ['E2.6', 'CE2', 'Orthographier les mots fréquents, réguliers et irréguliers, et des phrases selon les accords étudiés (dictées)'],
        ]],
        ['E3', 'Copier et acquérir des stratégies de copie', [
          ['E3.1', 'CP', 'Copier des syllabes simples puis des mots avec lettres muettes'],
          ['E3.2', 'CP', 'Copier une phrase en lien avec les 12 à 15 CGP étudiées (fin de période 1)'],
          ['E3.3', 'CP', 'Commencer à verbaliser et à utiliser des stratégies de copie (prise d’indices, mémorisation de mots)'],
          ['E3.4', 'CP', 'Commencer à savoir se relire après copie'],
          ['E3.5', 'CP', 'Copier trois ou quatre phrases sans erreur et de façon lisible (fin d’année)'],
          ['E3.6', 'CE1', 'Automatiser le geste d’écriture cursive par la copie de textes en temps limité'],
          ['E3.7', 'CE1', 'Acquérir des stratégies de copie et en mesurer l’efficacité'],
          ['E3.8', 'CE1', 'Copier quatre à cinq phrases courtes (période 1), puis cinq ou six lignes sans erreur (période 3)'],
          ['E3.9', 'CE1', 'Recopier sans effort une dizaine de lignes en respectant la ponctuation et la mise en page (fin d’année)'],
          ['E3.10', 'CE2', 'Copier une dizaine de lignes sans erreur, avec vitesse et exactitude, en respectant des mises en page complexes'],
        ]],
        ['E4', 'Produire des écrits', [
          ['E4.1', 'CP', 'Écrire des graphèmes, des syllabes, des mots puis quelques phrases avec l’aide du professeur'],
          ['E4.2', 'CP', 'Produire des écrits courts porteurs de sens, d’une à cinq lignes, en lien avec la lecture'],
          ['E4.3', 'CP', 'Transformer des textes de lecture sur quelques points (écrire à la façon de, ajouter un épisode)'],
          ['E4.4', 'CP', 'Commencer à acquérir une méthode de production écrite : planifier, mettre en mots, relire, réviser'],
          ['E4.5', 'CP', 'Repérer les dysfonctionnements de son texte (relecture par le professeur, outils d’aide)'],
          ['E4.6', 'CE1', 'Rédiger une phrase simple à partir d’une phrase modèle, en changeant un puis plusieurs mots'],
          ['E4.7', 'CE1', 'Écrire un texte court d’une à trois phrases'],
          ['E4.8', 'CE1', 'Insérer des connecteurs pour rendre cohérent l’enchaînement de plusieurs phrases'],
          ['E4.9', 'CE1', 'Retravailler un texte en fonction d’une ou deux contraintes d’écriture'],
          ['E4.10', 'CE1', 'Continuer à acquérir une méthode de production écrite : planifier, mettre en mots, réviser'],
          ['E4.11', 'CE1', 'Écrire un texte de six ou sept phrases cohérent sur le plan syntaxique et logique (fin d’année)'],
          ['E4.12', 'CE2', 'Écrire pour transmettre un message, une émotion, une information à un destinataire'],
          ['E4.13', 'CE2', 'Rédiger quelques phrases qui entraînent les automatismes appris en grammaire et en orthographe'],
          ['E4.14', 'CE2', 'Écrire un texte d’une dizaine de lignes (syntaxe, orthographe étudiée, lexique précis, contraintes)'],
          ['E4.15', 'CE2', 'Relire son texte méthodiquement'],
        ]],
      ] },
      { dom: 'O', nom: 'Oral', livret: 1, comps: [
        ['O1', 'Écouter pour comprendre', [
          ['O1.1', 'CP', 'Comprendre un message entendu de quelques minutes et mémoriser quelques informations importantes'],
          ['O1.2', 'CE1', 'Maintenir une attention active quelques minutes pour repérer, mémoriser, classer ou ordonner les informations'],
          ['O1.3', 'CE2', 'Relier plusieurs informations d’un message entendu plus long (5 minutes au plus) et évaluer sa compréhension'],
        ]],
        ['O2', 'Dire pour être compris', [
          ['O2.1', 'CP', 'Rapporter, raconter, décrire ou expliquer brièvement avec quelques organisateurs du discours et le lexique appris'],
          ['O2.2', 'CP', 'S’écouter pour progresser et proposer des reformulations'],
          ['O2.3', 'CP', 'Oraliser un texte mémorisé ou préparé en tenant compte de son auditoire'],
          ['O2.4', 'CE1', 'Utiliser à l’oral l’ensemble des temps verbaux pour raconter, décrire, expliquer, comparer ou exposer'],
          ['O2.5', 'CE1', 'Utiliser des critères définis pour évaluer sa prestation ou celle des autres et progresser'],
          ['O2.6', 'CE2', 'Mener une production orale plus longue et structurée pour raconter, expliquer, argumenter, justifier'],
          ['O2.7', 'CE2', 'Maintenir l’intérêt de son auditoire lors des prestations orales'],
        ]],
        ['O3', 'Participer à des échanges', [
          ['O3.1', 'CP', 'Participer aux échanges en respectant les règles, en écoutant les autres et en donnant son avis'],
          ['O3.2', 'CP', 'Prendre conscience des écarts de niveau de langue selon les situations'],
          ['O3.3', 'CE1', 'Respecter le propos au cours des échanges au sein d’un groupe'],
          ['O3.4', 'CE1', 'Adapter le registre de langue (familier, courant, soutenu) à la situation de communication'],
          ['O3.5', 'CE2', 'Tenir compte de ce qui a déjà été dit lors des interventions au sein d’un groupe'],
          ['O3.6', 'CE2', 'Utiliser un registre de langue et des postures adaptés aux situations proposées (jeux de rôles)'],
        ]],
      ] },
      { dom: 'V', nom: 'Vocabulaire', livret: 4, comps: [
        ['V1', 'Enrichir son vocabulaire dans tous les enseignements', [
          ['V1.1', 'CP', 'Enrichir en contexte le vocabulaire appris au cycle 1'],
          ['V1.2', 'CP', 'Être sensible à la polysémie et à la différence entre sens propre et sens figuré'],
          ['V1.3', 'CP', 'Commencer à utiliser l’ordre alphabétique pour se servir d’un dictionnaire adapté'],
          ['V1.4', 'CE1', 'Enrichir les répertoires du CP, notamment d’expressions ou de locutions'],
          ['V1.5', 'CE2', 'Enrichir les répertoires du CP et du CE1, notamment d’expressions ou de locutions'],
          ['V1.6', 'CE1 CE2', 'Automatiser l’utilisation de différentes formulations, associées à un même réseau, en contexte'],
          ['V1.7', 'CE1 CE2', 'S’appuyer sur la morphologie des mots pour en trouver le sens'],
          ['V1.8', 'CE1', 'Prendre l’habitude de consulter des articles de dictionnaire adapté'],
          ['V1.9', 'CE2', 'Comprendre le lien entre sens propre et sens figuré dans les cas les plus fréquents'],
          ['V1.10', 'CE2', 'Consulter avec aisance un dictionnaire adapté pour vérifier le sens supposé d’un mot'],
        ]],
        ['V2', 'Établir des relations entre les mots', [
          ['V2.1', 'CP', 'Constituer des répertoires de mots par thème, classe grammaticale, famille, analogie morphologique'],
          ['V2.2', 'CP', 'Savoir proposer et justifier une catégorisation du corpus de mots étudié'],
          ['V2.3', 'CP', 'Savoir trouver des synonymes et des antonymes'],
          ['V2.4', 'CE1 CE2', 'Percevoir de grandes catégories et hiérarchiser termes génériques, de base et spécifiques'],
          ['V2.5', 'CE1', 'Percevoir les niveaux de langue familier, courant et soutenu'],
          ['V2.6', 'CE1', 'Comprendre la différence entre sens propre et sens figuré'],
          ['V2.7', 'CE1 CE2', 'Trier et apparier les mots et leurs dérivés selon les préfixes et suffixes identifiés'],
          ['V2.8', 'CE2', 'Enrichir les collections du début du cycle (mots, expressions, associations fréquentes)'],
          ['V2.9', 'CE2', 'Utiliser les niveaux de langue (familier, courant, soutenu) selon les situations et les interlocuteurs'],
          ['V2.10', 'CE2', 'Se constituer un répertoire lexical personnel'],
        ]],
        ['V3', 'Réemployer le vocabulaire étudié', [
          ['V3.1', 'CP', 'Réemployer et mémoriser le vocabulaire appris en maternelle'],
          ['V3.2', 'CP', 'Réemployer et mémoriser les mots et expressions appris, selon des contraintes de production orale ou écrite'],
          ['V3.3', 'CP', 'Percevoir la différence entre deux niveaux de langue et choisir le plus adapté'],
          ['V3.4', 'CE1', 'Mobiliser les mots rencontrés en contexte pour mieux parler, mieux comprendre et mieux écrire'],
          ['V3.5', 'CE1', 'Utiliser les relations entre les mots (champ lexical, classe, morphologie, niveau de langue) pour varier son expression'],
          ['V3.6', 'CE2', 'Employer à bon escient les mots étudiés, selon leur contexte d’emploi et leur polysémie'],
          ['V3.7', 'CE2', 'Comprendre la différence entre sens propre et sens figuré ; changer de niveau de langue selon les situations'],
          ['V3.8', 'CE2', 'Automatiser la restitution des mots d’un corpus étudié (fluence verbale)'],
        ]],
        ['V4', 'Mémoriser l’orthographe des mots', [
          ['V4.1', 'CP', 'Mémoriser l’orthographe des mots réguliers fréquents et pouvoir les écrire sous la dictée (CGP étudiées)'],
          ['V4.2', 'CP', 'Identifier et nommer les accents'],
          ['V4.3', 'CP', 'Connaître la valeur sonore de s, c, g et des graphèmes an/am, en/em, on/om, in/im selon la lettre qui suit'],
          ['V4.4', 'CP', 'Comprendre une lettre muette finale à l’aide d’un mot de la même famille (chat/chaton)'],
          ['V4.5', 'CE1', 'Mémoriser l’orthographe des mots réguliers et irréguliers fréquents et du lexique courant'],
          ['V4.6', 'CE1 CE2', 'Tenir compte des accents'],
          ['V4.7', 'CE1', 'Classer par analogie et mémoriser les mots fréquents où s, c, g se prononcent de deux façons'],
          ['V4.8', 'CE1', 'Anticiper une lettre muette finale à l’aide d’un mot de la même famille (blanc/blanche)'],
          ['V4.9', 'CE2', 'Écrire correctement sous la dictée les mots réguliers et irréguliers fréquemment rencontrés'],
          ['V4.10', 'CE2', 'S’appuyer sur la morphologie (radical, préfixe, suffixe) et l’analogie pour orthographier les mots'],
        ]],
      ] },
      { dom: 'G', nom: 'Grammaire et orthographe', livret: 4, comps: [
        ['G1', 'Se repérer dans la phrase simple', [
          ['G1.1', 'CP', 'S’approprier la notion de phrase simple et ses trois marqueurs : majuscule, point final, sens'],
          ['G1.2', 'CP', 'Comprendre que sujet/verbe et déterminant/nom/adjectif fonctionnent ensemble'],
          ['G1.3', 'CP', 'S’appuyer sur la ponctuation pour reconnaître les phrases déclarative, interrogative et impérative'],
          ['G1.4', 'CP', 'Reconnaître les formes négative et exclamative'],
          ['G1.5', 'CP', 'Constituer des corpus par classe de mots : noms, verbes, déterminants, adjectifs, pronoms personnels'],
          ['G1.6', 'CE1', 'Identifier la phrase simple et nommer ses constituants : groupe sujet, verbe, compléments'],
          ['G1.7', 'CE1', 'Reconnaître et utiliser les trois types de phrases, en lien avec la ponctuation'],
          ['G1.8', 'CE1', 'Reconnaître les formes négative et exclamative et savoir effectuer des transformations'],
          ['G1.9', 'CE1', 'Nommer les classes de mots : déterminant, nom commun, nom propre, adjectif, verbe, pronom personnel sujet'],
          ['G1.10', 'CE2', 'Identifier la phrase simple et reconnaître ses constituants : groupe sujet, verbe, compléments'],
          ['G1.11', 'CE2', 'Reconnaître et produire les trois types de phrases : déclarative, interrogative, impérative'],
          ['G1.12', 'CE2', 'Reconnaître et produire les formes négative et exclamative'],
          ['G1.13', 'CE2', 'Nommer les classes de mots : déterminant, nom commun, nom propre, adjectif, verbe, pronom personnel sujet, adverbe'],
          ['G1.14', 'CE2', 'Utiliser la ponctuation de fin de phrase (. ! ?) et reconnaître les marques du discours rapporté'],
        ]],
        ['G2', 'Découvrir, comprendre et mettre en œuvre l’orthographe grammaticale', [
          ['G2.1', 'CP', 'Comprendre les notions de masculin et de féminin'],
          ['G2.2', 'CP', 'Comprendre les notions de singulier et de pluriel'],
          ['G2.3', 'CP', 'Se familiariser avec la chaîne d’accords (déterminant, nom, adjectif) : marques de genre et de nombre'],
          ['G2.4', 'CP', 'S’initier à la relation sujet-verbe (sens, transformations de temps et de personne)'],
          ['G2.5', 'CP', 'Observer les formes verbales fréquentes et régulières'],
          ['G2.6', 'CP', 'Conjuguer être et avoir au présent de l’indicatif et commencer à les utiliser à l’écrit'],
          ['G2.7', 'CE1', 'Reconnaître le groupe nominal et comprendre la chaîne d’accords déterminant, nom, adjectif'],
          ['G2.8', 'CE1', 'Identifier la relation sujet-verbe dans des situations simples (changement de temps et de personne)'],
          ['G2.9', 'CE1', 'Identifier le radical et la terminaison d’un verbe du 1er groupe conjugué et trouver son infinitif'],
          ['G2.10', 'CE1', 'Conjuguer être, avoir et les verbes du 1er groupe au présent, à l’imparfait, au futur, au passé composé'],
          ['G2.11', 'CE2', 'Repérer, comprendre et mettre en œuvre les marques d’accord dans le groupe nominal'],
          ['G2.12', 'CE2', 'Identifier, dans des situations simples, la relation sujet-verbe'],
          ['G2.13', 'CE2', 'Conjuguer être, avoir, le 1er groupe et 8 verbes du 3e groupe au présent, à l’imparfait, au futur, au passé composé'],
          ['G2.14', 'CE2', 'Identifier le radical et la terminaison d’un verbe conjugué au programme et trouver son infinitif'],
        ]],
      ] },
    ],
    MA: [
      { dom: 'N', nom: 'Nombres, calcul et résolution de problèmes', livret: 1, comps: [
        ['N1', 'Les nombres entiers', [
          ['N1.1', 'CP', 'Comparer et dénombrer des collections en les organisant'],
          ['N1.2', 'CE1 CE2', 'Dénombrer des collections en les organisant'],
          ['N1.3', 'CP CE1 CE2', 'Construire des collections de cardinal donné'],
          ['N1.4', 'CE1', 'Connaître et utiliser les relations entre unités, dizaines et centaines'],
          ['N1.5', 'CE2', 'Connaître et utiliser les relations entre les unités de numération'],
          ['N1.6', 'CP', 'Connaître la suite écrite et la suite orale des nombres jusqu’à cent'],
          ['N1.7', 'CE1', 'Connaître la suite écrite et la suite orale des nombres jusqu’à mille'],
          ['N1.8', 'CE2', 'Connaître la suite écrite et la suite orale des nombres jusqu’à dix mille'],
          ['N1.9', 'CP CE1 CE2', 'Connaître et utiliser diverses représentations d’un nombre et passer de l’une à l’autre'],
          ['N1.10', 'CP', 'Connaître la valeur des chiffres en fonction de leur position (unités, dizaines)'],
          ['N1.11', 'CE1 CE2', 'Connaître la valeur des chiffres en fonction de leur position dans un nombre'],
          ['N1.12', 'CP CE1 CE2', 'Comparer, encadrer, intercaler des nombres entiers avec les symboles =, < et >'],
          ['N1.13', 'CP CE1 CE2', 'Ordonner des nombres dans l’ordre croissant ou décroissant'],
          ['N1.14', 'CE1 CE2', 'Comprendre et utiliser « égal à », « supérieur à », « inférieur à », « compris entre … et … »'],
          ['N1.15', 'CP', 'Placer des nombres sur une demi-droite graduée de un en un'],
          ['N1.16', 'CE1 CE2', 'Placer des nombres sur une demi-droite graduée'],
          ['N1.17', 'CP', 'Connaître les nombres ordinaux jusqu’à « vingtième »'],
          ['N1.18', 'CE1', 'Connaître les nombres ordinaux jusqu’à cent'],
          ['N1.19', 'CP CE1', 'Comprendre et utiliser les nombres ordinaux'],
          ['N1.20', 'CP CE1', 'Repérer un rang ou une position dans une file orientée ou dans une liste'],
          ['N1.21', 'CP CE1', 'Faire le lien entre le rang d’un objet dans une liste et le nombre d’éléments qui le précèdent'],
          ['N1.22', 'CP CE1', 'Utiliser les nombres ordinaux dans des suites de symboles, de formes, de lettres ou de nombres'],
          ['N1.23', 'CE1', 'Connaître la notion de parité d’un nombre'],
        ]],
        ['N2', 'Les fractions', [
          ['N2.1', 'CE1', 'Interpréter, représenter, écrire et lire les fractions 1/2, 1/3, 1/4, 1/5, 1/6, 1/8 et 1/10'],
          ['N2.2', 'CE1', 'Interpréter, représenter, écrire et lire des fractions inférieures ou égales à 1'],
          ['N2.3', 'CE1', 'Comparer des fractions ayant le même dénominateur'],
          ['N2.4', 'CE1', 'Comparer des fractions dont le numérateur est 1'],
          ['N2.5', 'CE1', 'Additionner et soustraire des fractions de même dénominateur'],
          ['N2.6', 'CE2', 'Établir des égalités de fractions inférieures ou égales à 1'],
          ['N2.7', 'CE2', 'Partager une unité de longueur en fractions d’unité et mesurer des longueurs non entières'],
          ['N2.8', 'CE2', 'Comparer des fractions inférieures à 1'],
          ['N2.9', 'CE2', 'Additionner et soustraire des fractions'],
        ]],
        ['N3', 'Les quatre opérations', [
          ['N3.1', 'CP', 'Comprendre le sens de l’addition et de la soustraction'],
          ['N3.2', 'CP', 'Comprendre et utiliser les symboles « + », « - » et « = »'],
          ['N3.3', 'CP', 'Poser et effectuer des additions en colonnes'],
          ['N3.4', 'CP', 'Comprendre le sens de la multiplication'],
          ['N3.5', 'CE1 CE2', 'Poser et effectuer des additions et des soustractions en colonnes'],
          ['N3.6', 'CE1', 'Comprendre et utiliser le symbole « × »'],
          ['N3.7', 'CE1', 'Comprendre et savoir que la multiplication est commutative'],
          ['N3.8', 'CE2', 'Comprendre et utiliser les mots « terme », « somme » et « différence »'],
          ['N3.9', 'CE2', 'Comprendre et utiliser les mots « facteur », « produit » et « multiple »'],
          ['N3.10', 'CE2', 'Comprendre le sens de la division et utiliser le symbole « ÷ »'],
          ['N3.11', 'CE2', 'Poser et effectuer des multiplications d’un nombre à 2 ou 3 chiffres par un nombre à 1 ou 2 chiffres'],
        ]],
        ['N4', 'Calcul mental : mémoriser des faits numériques', [
          ['N4.1', 'CP CE1 CE2', 'Connaître dans les deux sens les tables d’addition'],
          ['N4.2', 'CP', 'Connaître les doubles et les moitiés de nombres usuels'],
          ['N4.3', 'CE1 CE2', 'Connaître dans les deux sens les tables de multiplication'],
          ['N4.4', 'CE1 CE2', 'Connaître des faits multiplicatifs usuels'],
        ]],
        ['N5', 'Calcul mental : utiliser la numération et des procédures', [
          ['N5.1', 'CP', 'Ajouter ou soustraire 1 ou 2 à un nombre'],
          ['N5.2', 'CP', 'Ajouter ou soustraire 10 à un nombre'],
          ['N5.3', 'CP', 'Ajouter ou soustraire 20, 30, 40… 90 à un nombre'],
          ['N5.4', 'CP', 'Trouver le complément d’un nombre à la dizaine supérieure'],
          ['N5.5', 'CP', 'Ajouter un nombre inférieur à 9 à un nombre'],
          ['N5.6', 'CP', 'Ajouter 9 à un nombre'],
          ['N5.7', 'CP', 'Ajouter deux nombres inférieurs à 100'],
          ['N5.8', 'CP CE1', 'Déterminer la moitié d’un nombre pair'],
          ['N5.9', 'CP', 'Soustraire un nombre inférieur à 10 à un nombre entier de dizaines'],
          ['N5.10', 'CE1', 'Ajouter ou soustraire un nombre entier de dizaines, de centaines à un nombre'],
          ['N5.11', 'CE1', 'Multiplier par 10 un nombre inférieur à 100'],
          ['N5.12', 'CE1', 'Ajouter 9, 19 ou 29 à un nombre'],
          ['N5.13', 'CE1', 'Soustraire 9 à un nombre'],
          ['N5.14', 'CE1', 'Soustraire un nombre inférieur à 9 à un nombre'],
          ['N5.15', 'CE1', 'Calculer le produit d’un nombre de 11 à 19 par un nombre inférieur à 10 (distributivité)'],
          ['N5.16', 'CE2', 'Multiplier un nombre entier par 10 ou 100'],
          ['N5.17', 'CE2', 'Ajouter 8, 9, 18, 19, 28, 29, 38 ou 39 à un nombre'],
          ['N5.18', 'CE2', 'Soustraire 9, 19, 29 ou 39 à un nombre'],
          ['N5.19', 'CE2', 'Multiplier un nombre entier par 4 ou par 8'],
          ['N5.20', 'CE2', 'Multiplier un nombre inférieur à 10 par un nombre entier de dizaines'],
          ['N5.21', 'CE2', 'Calculer le produit d’un nombre de 11 à 99 par un nombre inférieur à 10 (distributivité)'],
        ]],
        ['N6', 'La résolution de problèmes', [
          ['N6.1', 'CP CE1', 'Résoudre des problèmes additifs en une étape du type parties-tout'],
          ['N6.2', 'CP', 'Résoudre des problèmes additifs en deux étapes (nombres jusqu’à 30)'],
          ['N6.3', 'CP', 'Résoudre des problèmes multiplicatifs en une étape (nombres jusqu’à 30)'],
          ['N6.4', 'CE1', 'Résoudre des problèmes additifs de comparaison en une étape'],
          ['N6.5', 'CE2', 'Résoudre des problèmes additifs en une étape de types parties-tout et comparaison'],
          ['N6.6', 'CE1 CE2', 'Résoudre des problèmes additifs en deux étapes'],
          ['N6.7', 'CE1 CE2', 'Résoudre des problèmes multiplicatifs en une étape'],
          ['N6.8', 'CE1', 'Résoudre des problèmes mixtes en deux étapes (une étape additive, une étape multiplicative)'],
          ['N6.9', 'CE2', 'Résoudre des problèmes de comparaison multiplicative en une étape'],
          ['N6.10', 'CE2', 'Résoudre des problèmes mettant en jeu des produits cartésiens'],
          ['N6.11', 'CE2', 'Résoudre des problèmes mixtes en deux ou trois étapes'],
        ]],
      ] },
      { dom: 'GM', nom: 'Grandeurs et mesures', livret: 2, comps: [
        ['GM1', 'Les longueurs', [
          ['GM1.1', 'CP', 'Utiliser le lexique spécifique associé aux longueurs'],
          ['GM1.2', 'CP', 'Comparer des objets, des segments selon leur longueur'],
          ['GM1.3', 'CP CE1', 'Mesurer la longueur d’un segment avec une règle graduée'],
          ['GM1.4', 'CP', 'Connaître et utiliser le mètre et le centimètre (m, cm) ; savoir qu’un mètre égale cent centimètres'],
          ['GM1.5', 'CP CE1', 'Connaître quelques longueurs de référence'],
          ['GM1.6', 'CE1', 'Connaître et utiliser le mètre, le centimètre, le kilomètre (m, cm, km)'],
          ['GM1.7', 'CE2', 'Connaître et utiliser le mètre, le décimètre, le centimètre, le millimètre, le kilomètre'],
          ['GM1.8', 'CE1 CE2', 'Choisir l’unité la mieux adaptée pour exprimer une longueur'],
          ['GM1.9', 'CE1 CE2', 'Connaître les relations entre les unités de longueur usuelles'],
          ['GM1.10', 'CE1 CE2', 'Comparer des longueurs'],
          ['GM1.11', 'CE1', 'Estimer la longueur d’un objet du quotidien'],
          ['GM1.12', 'CE2', 'Tracer un segment de longueur donnée'],
          ['GM1.13', 'CE2', 'Disposer de quelques longueurs de référence ; estimer la longueur d’un objet ou une distance'],
          ['GM1.14', 'CE2', 'Savoir ce qu’est le périmètre d’une figure plane'],
          ['GM1.15', 'CE2', 'Comparer le périmètre de plusieurs polygones avec un compas, sans règle graduée'],
          ['GM1.16', 'CE2', 'Déterminer le périmètre d’un polygone avec une règle graduée'],
        ]],
        ['GM2', 'Les masses et les contenances', [
          ['GM2.1', 'CP', 'Utiliser le lexique associé aux masses'],
          ['GM2.2', 'CP', 'Comparer des objets selon leur masse'],
          ['GM2.3', 'CE1', 'Trouver l’objet le plus léger ou le plus lourd en soupesant ou avec une balance'],
          ['GM2.4', 'CE1', 'Connaître et utiliser le gramme et le kilogramme (g, kg) ; savoir que 1 kg = 1 000 g'],
          ['GM2.5', 'CE2', 'Connaître et utiliser le gramme, le kilogramme et la tonne (g, kg, t)'],
          ['GM2.6', 'CE2', 'Choisir l’unité la mieux adaptée pour exprimer une masse'],
          ['GM2.7', 'CE2', 'Connaître les relations entre les unités de masse usuelles'],
          ['GM2.8', 'CE1 CE2', 'Comparer des masses'],
          ['GM2.9', 'CE1 CE2', 'Disposer de quelques masses de référence ; estimer la masse d’un objet'],
          ['GM2.10', 'CE2', 'Comparer les contenances de différents objets'],
          ['GM2.11', 'CE2', 'Connaître et utiliser le litre, le décilitre, le centilitre (L, dL, cL) ; 1 L = 10 dL = 100 cL'],
        ]],
        ['GM3', 'La monnaie', [
          ['GM3.1', 'CP', 'Utiliser le lexique spécifique lié à la monnaie'],
          ['GM3.2', 'CP', 'Comparer les valeurs de deux ensembles de pièces, ou de pièces et de billets'],
          ['GM3.3', 'CP', 'Déterminer la valeur en euros d’un ensemble de pièces et de billets'],
          ['GM3.4', 'CP', 'Constituer une somme d’argent donnée avec des pièces et des billets'],
          ['GM3.5', 'CP CE1 CE2', 'Simuler des achats avec des pièces et des billets fictifs ; rendre la monnaie'],
          ['GM3.6', 'CE1', 'Connaître le lien entre les euros et les centimes'],
          ['GM3.7', 'CE1', 'Comparer les valeurs en euros de deux ensembles de pièces et de billets'],
          ['GM3.8', 'CE1', 'Déterminer la valeur en euros et centimes d’un ensemble de pièces et de billets'],
          ['GM3.9', 'CE1', 'Constituer avec des euros et des centimes une somme d’argent donnée'],
          ['GM3.10', 'CE1', 'Connaître le sens de l’écriture à virgule d’une somme d’argent'],
          ['GM3.11', 'CE2', 'Poser et effectuer des additions de montants en euros'],
        ]],
        ['GM4', 'Le repérage dans le temps et les durées', [
          ['GM4.1', 'CP', 'Lire sur une horloge à aiguilles une heure entière'],
          ['GM4.2', 'CP', 'Placer les aiguilles d’une horloge pour une heure entière (jusqu’à douze)'],
          ['GM4.3', 'CP', 'Associer une heure à un moment de la journée'],
          ['GM4.4', 'CE1', 'Lire l’heure sur une horloge à aiguilles (heures entières, demi-heures, quarts d’heure)'],
          ['GM4.5', 'CE1', 'Placer les aiguilles d’une horloge (heures entières, demi-heures, quarts d’heure)'],
          ['GM4.6', 'CE1', 'Connaître les unités de durée heure et minute (h, min)'],
          ['GM4.7', 'CE1', 'Comparer et mesurer des durées entre deux heures d’une même journée (heures, demi-heures, quarts d’heure)'],
          ['GM4.8', 'CE2', 'Lire l’heure sur une horloge à aiguilles'],
          ['GM4.9', 'CE2', 'Placer les aiguilles d’une horloge pour une heure donnée en heures ou en heures et minutes'],
          ['GM4.10', 'CE2', 'Comparer et mesurer des durées entre deux instants d’une même journée'],
          ['GM4.11', 'CE2', 'Résoudre des problèmes à une ou deux étapes impliquant des durées'],
        ]],
      ] },
      { dom: 'EG', nom: 'Espace et géométrie', livret: 3, comps: [
        ['EG1', 'Les solides', [
          ['EG1.1', 'CP', 'Reconnaître les solides usuels : cube, boule, cône, cylindre, pavé'],
          ['EG1.2', 'CP', 'Nommer un cube, un pavé et une boule'],
          ['EG1.3', 'CP', 'Décrire un cube ou un pavé avec le terme « face » ; connaître le nombre et la nature de leurs faces'],
          ['EG1.4', 'CP', 'Construire des cubes et des pavés'],
          ['EG1.5', 'CE1', 'Reconnaître les solides usuels : cube, boule, cône, pyramide, cylindre, pavé'],
          ['EG1.6', 'CE1', 'Nommer un cube, une boule, un pavé, un cône ou une pyramide'],
          ['EG1.7', 'CE2', 'Nommer un cube, une boule, un pavé, un cône, une pyramide ou un cylindre'],
          ['EG1.8', 'CE1 CE2', 'Décrire un cube, un pavé ou une pyramide avec les termes « face », « sommet » et « arête »'],
          ['EG1.9', 'CE1 CE2', 'Connaître le nombre et la nature des faces d’un cube ou d’un pavé'],
          ['EG1.10', 'CE2', 'Connaître la nature des faces d’une pyramide'],
          ['EG1.11', 'CE2', 'Construire un cube, un pavé ou une pyramide ; construire un cube à partir d’un patron'],
        ]],
        ['EG2', 'La géométrie plane', [
          ['EG2.1', 'CP', 'Reconnaître des formes planes (disque, carré, rectangle, triangle) dans un assemblage et autour de soi'],
          ['EG2.2', 'CP', 'Nommer le disque, le carré, le rectangle et le triangle'],
          ['EG2.3', 'CP', 'Décrire le carré, le rectangle, le triangle avec les termes « sommet » et « côté »'],
          ['EG2.4', 'CP', 'Repérer visuellement des alignements ; utiliser la règle pour les repérer ou les vérifier'],
          ['EG2.5', 'CP', 'Utiliser la règle comme instrument de tracé'],
          ['EG2.6', 'CP', 'Construire un carré, un rectangle, un triangle ou un assemblage sur papier quadrillé ou pointé'],
          ['EG2.7', 'CE1 CE2', 'Utiliser le vocabulaire géométrique approprié'],
          ['EG2.8', 'CE1', 'Reconnaître, nommer et décrire un cercle, un carré, un rectangle, un triangle, un triangle rectangle'],
          ['EG2.9', 'CE1', 'Connaître les propriétés des angles et les égalités de longueur des carrés et des rectangles'],
          ['EG2.10', 'CE1', 'Reproduire ou construire un carré, un rectangle, un triangle, un triangle rectangle, un cercle'],
          ['EG2.11', 'CE1', 'Vérifier des alignements avec la règle et un angle droit avec l’équerre'],
          ['EG2.12', 'CE1', 'Utiliser la règle graduée, l’équerre et le compas comme instruments de tracé'],
          ['EG2.13', 'CE1', 'Connaître et utiliser le code de l’angle droit'],
          ['EG2.14', 'CE2', 'Reconnaître, nommer et décrire le carré, le rectangle, le triangle, le triangle rectangle et le losange'],
          ['EG2.15', 'CE2', 'Connaître les propriétés des angles et les égalités de longueur des carrés, rectangles et losanges'],
          ['EG2.16', 'CE2', 'Reproduire ou construire ces figures et le cercle sur tout support, avec règle, équerre ou compas'],
          ['EG2.17', 'CE2', 'Connaître et utiliser le codage de l’angle droit et des segments de même longueur'],
          ['EG2.18', 'CE2', 'Reconnaître si une figure a un ou plusieurs axes de symétrie (pliage, papier calque)'],
          ['EG2.19', 'CE2', 'Compléter une figure simple sur quadrillage pour la rendre symétrique par rapport à un axe'],
        ]],
        ['EG3', 'Le repérage dans l’espace', [
          ['EG3.1', 'CP CE1', 'Connaître et utiliser le vocabulaire lié aux positions relatives'],
          ['EG3.2', 'CP', 'Situer des personnes ou des objets les uns par rapport aux autres ou à d’autres repères dans la classe'],
          ['EG3.3', 'CP', 'Construire et utiliser des représentations de la classe pour localiser, mémoriser, communiquer un emplacement'],
          ['EG3.4', 'CP', 'Construire et reproduire des assemblages de solides d’après un modèle ou des représentations planes'],
          ['EG3.5', 'CP', 'Se déplacer et décrire des déplacements dans la classe en s’orientant avec des repères'],
          ['EG3.6', 'CP', 'Construire et utiliser un plan de la classe pour communiquer un déplacement'],
          ['EG3.7', 'CP', 'Utiliser et produire une suite d’instructions qui codent un déplacement'],
          ['EG3.8', 'CE1', 'Situer des personnes ou des objets les uns par rapport aux autres ou à des repères dans un espace familier'],
          ['EG3.9', 'CE1', 'Construire et utiliser des représentations d’un espace familier pour localiser, mémoriser, communiquer un emplacement'],
          ['EG3.10', 'CE1', 'Construire des assemblages de cubes et de pavés'],
          ['EG3.11', 'CE1', 'Comprendre, utiliser et produire une suite d’instructions qui codent un déplacement'],
        ]],
      ] },
      { dom: 'D', nom: 'Organisation et gestion de données', livret: 1, comps: [
        ['D1', 'Recueillir, présenter et lire des données', [
          ['D1.1', 'CP', 'Collecter des données et les présenter dans un tableau ou un diagramme en barres'],
          ['D1.2', 'CP', 'Construire et compléter un tableau à double entrée'],
          ['D1.3', 'CE1 CE2', 'Produire un tableau ou un diagramme en barres pour présenter des données recueillies'],
          ['D1.4', 'CE1 CE2', 'Lire et interpréter les données d’un diagramme en barres ou d’un tableau à double entrée'],
          ['D1.5', 'CE2', 'Résoudre des problèmes avec les données d’un tableau à double entrée ou d’un diagramme en barres'],
        ]],
      ] },
    ],
    // EMC, CP, CE1 et CE2 : BO n° 24 du 13 juin 2024 (en vigueur aux trois niveaux en 2026-2027),
    // « contenus d'enseignement » de chaque thème, année par année (CP : se reconnaître comme individu et élève ;
    // CE1 : respecter les autres ; CE2 : apprendre ensemble et vivre ensemble). Livret : 1 Enseignement moral et civique.
    EMC: [
      { dom: 'MS', nom: 'Connaissance et maîtrise de soi (CP)', livret: 1, comps: [
        ['EMC1', 'Émotions, confiance et estime de soi', [
          ['EMC1.1', 'CP', 'Comprendre ses émotions et ses sentiments : leur origine et leurs manifestations'],
          ['EMC1.2', 'CP', 'Trouver les réponses appropriées aux besoins exprimés'],
          ['EMC1.3', 'CP', 'Consolider sa confiance en soi'],
          ['EMC1.4', 'CP', 'Acquérir une estime de soi'],
        ]],
      ] },
      { dom: 'RA', nom: 'Les règles collectives et l’autonomie (CP)', livret: 1, comps: [
        ['EMC2', 'Droits et devoirs de l’élève', [
          ['EMC2.1', 'CP', 'S’approprier les règles de l’école (droits et devoirs) pour son bien-être et sa sécurité'],
          ['EMC2.2', 'CP', 'Respecter les différents adultes de l’école en identifiant leur rôle'],
          ['EMC2.3', 'CP', 'Développer son autonomie'],
          ['EMC2.4', 'CP', 'Prendre des initiatives et faire des choix sans craindre de se tromper'],
          ['EMC2.5', 'CP', 'Identifier les risques et les dangers de son environnement immédiat et adopter un comportement adapté'],
          ['EMC2.6', 'CP', 'Respecter les équipements de la collectivité, condition du partage de biens communs'],
        ]],
        ['EMC3', 'Droits de l’enfant', [
          ['EMC3.1', 'CP', 'Savoir que les enfants ont des droits (Convention internationale des droits de l’enfant, 1989)'],
        ]],
      ] },
      { dom: 'HI', nom: 'Règles d’hygiène et exigence d’intimité (CP)', livret: 1, comps: [
        ['EMC4', 'Identité et dignité', [
          ['EMC4.1', 'CP', 'Avoir conscience de son intégrité'],
          ['EMC4.2', 'CP', 'Connaître et appliquer les règles élémentaires d’hygiène personnelle'],
          ['EMC4.3', 'CP', 'Connaître et respecter les règles élémentaires de l’intimité personnelle'],
        ]],
      ] },
      { dom: 'ER', nom: 'Être élève à l’école de la République (CP)', livret: 1, comps: [
        ['EMC5', 'République', [
          ['EMC5.1', 'CP', 'Identifier le drapeau français'],
          ['EMC5.2', 'CP', 'Reconnaître La Marseillaise'],
        ]],
      ] },
      { dom: 'AS', nom: 'Altérité et sociabilité (CE1)', livret: 1, comps: [
        ['EMC6', 'Fraternité, solidarité, dignité ; stéréotypes et préjugés', [
          ['EMC6.1', 'CE1', 'Reconnaître et prendre en compte les émotions et les sentiments d’autrui'],
          ['EMC6.2', 'CE1', 'Développer sa capacité d’empathie'],
          ['EMC6.3', 'CE1', 'S’entraider et partager avec les autres'],
          ['EMC6.4', 'CE1', 'Reconnaître la diversité comme richesse et ne pas faire des différences un motif de violence'],
          ['EMC6.5', 'CE1', 'Comprendre que la solidarité et l’entraide renforcent l’égalité entre les personnes'],
          ['EMC6.6', 'CE1', 'Reconnaître les situations de violence physique ou verbale et de harcèlement'], // dérivé (démarches)
        ]],
      ] },
      { dom: 'RI', nom: 'Règles collectives et prise d’initiative (CE1)', livret: 1, comps: [
        ['EMC7', 'Responsabilité et civilité', [
          ['EMC7.1', 'CE1', 'Connaître et appliquer les règles élémentaires de vie, de communication et d’échange en collectivité (civilité)'],
          ['EMC7.2', 'CE1', 'Identifier les dangers dans les situations où l’on se trouve'],
          ['EMC7.3', 'CE1', 'Prendre des initiatives : faire des choix et les justifier'],
          ['EMC7.4', 'CE1', 'Savoir donner l’alerte (numéros d’urgence, message d’alerte)'], // dérivé (démarches, APS)
        ]],
      ] },
      { dom: 'PS', nom: 'Principes et symboles de la République (CE1)', livret: 1, comps: [
        ['EMC8', 'République et laïcité', [
          ['EMC8.1', 'CE1', 'Identifier les symboles républicains'],
          ['EMC8.2', 'CE1', 'Chanter le premier couplet et le refrain de La Marseillaise'],
          ['EMC8.3', 'CE1', 'Comprendre la devise « Liberté, Égalité, Fraternité »'],
          ['EMC8.4', 'CE1', 'Aborder le principe de la liberté de conscience (laïcité)'],
          ['EMC8.5', 'CE1', 'Savoir que le français est la langue de la République'],
        ]],
      ] },
      { dom: 'BC', nom: 'L’engagement pour le bien commun (CE2)', livret: 1, comps: [
        ['EMC9', 'Bien commun, responsabilité, service public', [
          ['EMC9.1', 'CE2', 'Comprendre la notion de bien commun : les actions individuelles tiennent compte de l’intérêt collectif'],
          ['EMC9.2', 'CE2', 'Savoir qu’il existe des institutions et des associations au service du bien commun'],
          ['EMC9.3', 'CE2', 'Aborder des enjeux d’intérêt collectif : l’éducation pour tous, l’environnement, la sécurité, l’information'],
          ['EMC9.4', 'CE2', 'Différencier l’intérêt particulier de l’intérêt général dans des situations concrètes'], // dérivé (démarches)
          ['EMC9.5', 'CE2', 'Participer à des projets communs et à des décisions prises à la majorité (conseil d’élèves)'], // dérivé (démarches)
        ]],
      ] },
      { dom: 'RF', nom: 'La République et son fonctionnement (CE2)', livret: 1, comps: [
        ['EMC10', 'République', [
          ['EMC10.1', 'CE2', 'Savoir qu’en France le chef de l’État est le président de la République et qu’il est élu'],
          ['EMC10.2', 'CE2', 'Savoir que le maire est un élu local, représentant de l’État dans la commune, et connaître son rôle'],
          ['EMC10.3', 'CE2', 'Approfondir la compréhension de la devise « Liberté, Égalité, Fraternité »'],
        ]],
      ] },
    ],
    // Langue vivante (étrangère ou régionale), cycle 2 : BO n° 12 du 19/03/2026, en vigueur au CP en 2026-2027,
    // au CE1 et au CE2 à la rentrée 2027 (CE_DES_2027, ou { de: 2027 } pour une ligne propre au CE1-CE2).
    // Une compétence par situation du programme ; objectifs d'apprentissage raccourcis, fusionnés quand ils se répètent
    // d'une année à l'autre ; les mentions pré-A1 / A1 ne sont pas reprises.
    // CE1 et CE2 en 2026-2027 : programme de 2020 (BO n° 31 du 30/07/2020), « connaissances et compétences associées » ({ a: 2026 }).
    // Livret : 1 Écouter et parler (CO, EOC, EOI), 2 Lire et écrire (CE, EE) ; médiation dans les deux ([1, 2]).
    LV: [
      { dom: 'CO', nom: 'Écouter et comprendre', livret: 1, comps: [
        ['CO1', 'Comprendre quelques mots familiers et expressions très courantes', [
          ['CO1.1', 'CP CE1 CE2', 'Repérer quelques mots de la prise de contact et des salutations', CE_DES_2027],
          ['CO1.2', 'CE1 CE2', 'Reconnaître les formules usuelles d’encouragement et de félicitations', { de: 2027 }],
          ['CO1.3', 'CP CE1 CE2', 'Reconnaître les pronoms interrogatifs usuels', CE_DES_2027],
          ['CO1.4', 'CE1 CE2', 'Reconnaître pronoms personnels et déterminants possessifs pour savoir qui parle et de qui l’on parle', { de: 2027 }],
          ['CO1.5', 'CP CE1 CE2', 'Identifier les verbes qui expriment le goût et le dégoût, aidé de gestes ou d’images', CE_DES_2027],
          ['CO1.6', 'CP CE1 CE2', 'Identifier l’humeur des interlocuteurs (tristesse, joie, colère) grâce à la voix et aux gestes', CE_DES_2027],
          ['CO1.7', 'CP CE1 CE2', 'Repérer des mots simples et familiers accompagnés de visuels (famille, environnement immédiat)', CE_DES_2027],
        ]],
        ['CO2', 'Suivre le fil d’une histoire adaptée et étayée', [
          ['CO2.1', 'CP', 'Reconnaître certaines lettres de l’alphabet et les chiffres'],
          ['CO2.2', 'CE1', 'Reconnaître certaines lettres de l’alphabet et les nombres jusqu’à 31 environ', { de: 2027 }],
          ['CO2.3', 'CE2', 'Reconnaître toutes les lettres de l’alphabet et les nombres jusqu’à 100 environ', { de: 2027 }],
          ['CO2.4', 'CE1', 'Reconnaître quelques structures grammaticales simples d’un répertoire mémorisé', { de: 2027 }],
          ['CO2.5', 'CP CE1 CE2', 'Reconnaître les mots familiers pour parler de soi, de sa sphère immédiate et des thèmes travaillés', CE_DES_2027],
          ['CO2.6', 'CE1 CE2', 'Reconnaître les intonations d’une question, d’une affirmation, d’une exclamation et de sentiments', { de: 2027 }],
        ]],
        ['CO3', 'Comprendre et agir', [
          ['CO3.1', 'CP CE1 CE2', 'Reconnaître des formes courantes de l’impératif pour réagir à des consignes simples (classe, jeu, recette)', CE_DES_2027],
          ['CO3.2', 'CP CE1 CE2', 'Agir en suivant des verbes d’action et des prépositions pour se repérer dans l’espace', CE_DES_2027],
          ['CO3.3', 'CE1 CE2', 'Identifier les modaux de la capacité et de l’incapacité au présent', { de: 2027 }],
        ]],
        ['CO20', 'Comprendre l’oral (programme 2020)', [
          ['CO20.1', 'CE1 CE2', 'Comprendre les consignes de classe', { a: 2026 }],
          ['CO20.2', 'CE1 CE2', 'Utiliser quelques mots familiers et quelques expressions très courantes', { a: 2026 }],
          ['CO20.3', 'CE1 CE2', 'Suivre le fil d’une histoire très courte', { a: 2026 }],
          ['CO20.4', 'CE1 CE2', 'Suivre des instructions courtes et simples', { a: 2026 }],
        ]],
      ] },
      { dom: 'EOC', nom: 'Parler en continu', livret: 1, comps: [
        ['EOC1', 'Repères phonologiques', [
          ['EOC1.1', 'CP CE1', 'Réaliser les spécificités phonologiques essentielles de la langue', CE_DES_2027],
          ['EOC1.2', 'CP CE1 CE2', 'Prononcer correctement des mots isolés et mémorisés de champs lexicaux connus (accentuation)', CE_DES_2027],
        ]],
        ['EOC2', 'Reproduire un modèle oral', [
          ['EOC2.1', 'CP CE2', 'Parler de soi ou de son environnement avec des formules brèves, ritualisées et mémorisées', CE_DES_2027],
          ['EOC2.2', 'CE1', 'Dire à voix haute une phrase courte connue, chanter collectivement une courte comptine', { de: 2027 }],
          ['EOC2.3', 'CE2', 'Lire à voix haute une expression ou une phrase courte déjà connue à l’oral', { de: 2027 }],
        ]],
        ['EOC3', 'Raconter', [
          ['EOC3.1', 'CP CE1 CE2', 'Nommer, caractériser, dénombrer très simplement des personnes, des objets, des lieux', CE_DES_2027],
          ['EOC3.2', 'CP CE1 CE2', 'Situer dans l’espace personnes, objets et lieux avec des prépositions et expressions lexicalisées', CE_DES_2027],
          ['EOC3.3', 'CP CE1 CE2', 'Situer dans le temps : dire le jour, la date, des repères temporels très simples', CE_DES_2027],
          ['EOC3.4', 'CE1 CE2', 'Reproduire un modèle oral court en suivant la trame d’une histoire répétitive (randonnée)', { de: 2027 }],
        ]],
        ['EOC4', 'Se décrire (décrire) avec des expressions courtes proches des modèles', [
          ['EOC4.1', 'CP CE1 CE2', 'Donner des informations simples sur soi et sur les autres ; se présenter avec des expressions lexicalisées', CE_DES_2027],
          ['EOC4.2', 'CP CE1 CE2', 'Donner des informations simples sur ses activités quotidiennes ; nommer les moments de la journée', CE_DES_2027],
        ]],
        ['EOC20', 'S’exprimer oralement en continu (programme 2020)', [
          ['EOC20.1', 'CE1 CE2', 'Reproduire un modèle oral (comptine, chant, poème, histoire)', { a: 2026 }],
          ['EOC20.2', 'CE1 CE2', 'Se décrire avec des expressions courtes ou des phrases proches des modèles rencontrés', { a: 2026 }],
          ['EOC20.3', 'CE1 CE2', 'Lire à haute voix de manière expressive un texte bref', { a: 2026 }],
          ['EOC20.4', 'CE1 CE2', 'Raconter une histoire courte à partir d’images ou de modèles déjà rencontrés', { a: 2026 }],
        ]],
      ] },
      { dom: 'EOI', nom: 'Réagir et dialoguer', livret: 1, comps: [
        ['EOI1', 'Échanger des informations simples', [
          ['EOI1.1', 'CP CE1 CE2', 'Poser quelques questions simples à l’aide des pronoms interrogatifs', CE_DES_2027],
          ['EOI1.2', 'CP CE1 CE2', 'Donner quelques consignes ou ordres simples ritualisés à l’impératif', CE_DES_2027],
          ['EOI1.3', 'CP CE1 CE2', 'Utiliser les réponses courtes', CE_DES_2027],
          ['EOI1.4', 'CE1 CE2', 'Formuler simplement l’autorisation sous forme de bloc lexicalisé', { de: 2027 }],
        ]],
        ['EOI2', 'Exprimer des émotions et formuler des souhaits élémentaires', [
          ['EOI2.1', 'CP CE1 CE2', 'Exprimer son ressenti et ses souhaits très simplement (mots, gestes, expressions du visage)', CE_DES_2027],
          ['EOI2.2', 'CP CE1 CE2', 'Exprimer des sentiments ou des émotions dans des situations ritualisées', CE_DES_2027],
          ['EOI2.3', 'CE1 CE2', 'Connaître et utiliser quelques onomatopées typiques', { de: 2027 }],
        ]],
        ['EOI3', 'Clarifier ou faire clarifier un point', [
          ['EOI3.1', 'CP CE1 CE2', 'Indiquer très simplement que l’on n’a pas compris (au besoin par un geste)', CE_DES_2027],
          ['EOI3.2', 'CP CE1', 'Prononcer quelques lettres de l’alphabet pour épeler ou reconnaître un mot très simple', CE_DES_2027],
          ['EOI3.3', 'CE2', 'Prononcer toutes les lettres de l’alphabet pour épeler ou reconnaître un mot très simple', { de: 2027 }],
          ['EOI3.4', 'CE1 CE2', 'Utiliser des formules toutes faites pour demander le sens d’un mot', { de: 2027 }],
          ['EOI3.5', 'CE1 CE2', 'Donner ou clarifier quelques consignes simples de la communication de classe', { de: 2027 }],
        ]],
        ['EOI4', 'Commencer, poursuivre et terminer une conversation brève', [
          ['EOI4.1', 'CP CE1', 'Utiliser des formules de salutation très simples', CE_DES_2027], // dérivé (exemples de réussite)
          ['EOI4.2', 'CP CE1', 'Utiliser des formules de politesse variées', CE_DES_2027],
          ['EOI4.3', 'CP CE1 CE2', 'Relancer une conversation par des questions élémentaires', CE_DES_2027],
          ['EOI4.4', 'CP CE1 CE2', 'Utiliser des expressions courantes pour clore une conversation', CE_DES_2027],
        ]],
        ['EOI20', 'Prendre part à une conversation (programme 2020)', [
          ['EOI20.1', 'CE1 CE2', 'Saluer, se présenter', { a: 2026 }],
          ['EOI20.2', 'CE1 CE2', 'Demander à quelqu’un de ses nouvelles, réagir, donner de ses nouvelles', { a: 2026 }],
          ['EOI20.3', 'CE1 CE2', 'Formuler des souhaits basiques ; utiliser des formules de politesse', { a: 2026 }],
          ['EOI20.4', 'CE1 CE2', 'Répondre à des questions sur des sujets familiers', { a: 2026 }],
          ['EOI20.5', 'CE1 CE2', 'Épeler des mots et des noms familiers', { a: 2026 }],
        ]],
      ] },
      { dom: 'CE', nom: 'Lire et comprendre', livret: 2, comps: [
        ['CE1', 'Reconnaître des mots ou des messages écrits familiers', [
          ['CE1.1', 'CE2', 'Repérer les nombres écrits en lettres, avec une écriture chiffrée ou des visuels', { de: 2027 }],
          ['CE1.2', 'CE2', 'Repérer des nombres jusqu’à 100, des quantités, des horaires, des prix (9 a.m., 4 €…)', { de: 2027 }],
          ['CE1.3', 'CE2', 'Reconnaître quelques mots écrits pour parler de soi et de sa sphère immédiate', { de: 2027 }],
          ['CE1.4', 'CE2', 'Reconnaître quelques mots écrits des activités quotidiennes, travaillés d’abord à l’oral', { de: 2027 }],
        ]],
        ['CE2', 'Trouver des informations dans des écrits très simples', [
          ['CE2.1', 'CE2', 'Trouver une information simple dans un écrit très court, aidé de visuels', { de: 2027 }], // dérivé (titre de la situation)
        ]],
      ] },
      { dom: 'EE', nom: 'Écrire', livret: 2, comps: [
        ['EE1', 'Épeler, recopier ou écrire des éléments connus', [
          ['EE1.1', 'CE2', 'Recopier la date, des étiquettes-mots, des éléments écrits au tableau ou prélevés dans un texte court', { de: 2027 }],
          ['EE1.2', 'CE2', 'Recopier de très courtes phrases observées et travaillées à l’oral', { de: 2027 }],
          ['EE1.3', 'CE2', 'Se présenter brièvement à l’écrit ; dire d’où l’on vient et où l’on vit', { de: 2027 }],
          ['EE1.4', 'CE2', 'Exprimer simplement ses goûts à l’écrit avec les verbes les plus courants', { de: 2027 }],
          ['EE1.5', 'CE2', 'Écrire un court message (carte de vœux, courrier) avec des blocs lexicalisés très simples', { de: 2027 }],
        ]],
      ] },
      { dom: 'M', nom: 'Médiation et culture', livret: [1, 2], comps: [
        ['M1', 'Identifier les repères culturels', [
          ['M1.1', 'CE1 CE2', 'Repérer des différences ou similitudes dans des domaines familiers (fêtes, nourriture, jeux, sports)', { de: 2027 }],
          ['M1.2', 'CE1', 'Signaler une situation culturelle non comprise par un geste ou une formule toute faite', { de: 2027 }],
        ]],
        ['M2', 'Expliciter un message, une situation, un document pour autrui', [
          ['M2.1', 'CP CE1 CE2', 'Utiliser le vocabulaire des besoins élémentaires (mots isolés, gestes)', CE_DES_2027],
          ['M2.2', 'CE1 CE2', 'Montrer et situer une information avec quelques expressions, verbes de perception et gestes', { de: 2027 }],
        ]],
        ['M3', 'Animer un travail collectif, coopérer, échanger', [
          ['M3.1', 'CP CE1', 'Utiliser des consignes élémentaires accompagnées de gestes', CE_DES_2027],
          ['M3.2', 'CP CE1', 'Dire ou demander si l’on a compris ou si l’on est d’accord', CE_DES_2027],
          ['M3.3', 'CE1 CE2', 'Utiliser des formules d’accueil, de salutation ou de politesse élémentaires', { de: 2027 }],
          ['M3.4', 'CE2', 'Animer un jeu ou une activité avec quelques verbes d’action et des consignes ritualisées', { de: 2027 }],
        ]],
        ['M20', 'Découvrir des aspects culturels (programme 2020)', [
          ['M20.1', 'CE1 CE2', 'Identifier quelques grands repères culturels de la vie quotidienne des enfants du même âge dans les pays ou régions étudiés', { a: 2026 }],
        ]],
      ] },
    ],
    // Enseignements artistiques, cycle 2 : programme de 2020 (BO n° 31 du 30/07/2020), toujours en vigueur aux trois niveaux.
    // Arts plastiques : « connaissances et compétences associées » des trois grandes questions, puis compétences travaillées ;
    // éducation musicale : « connaissances et compétences associées ». Livret : 1 Enseignements artistiques.
    ART: [
      { dom: 'AP', nom: 'Arts plastiques', livret: 1, comps: [
        ['AP1', 'La représentation du monde', [
          ['AP1.1', 'CP CE1 CE2', 'Utiliser le dessin dans toute sa diversité comme moyen d’expression'],
          ['AP1.2', 'CP CE1 CE2', 'Employer divers outils, dont ceux numériques, pour représenter'],
          ['AP1.3', 'CP CE1 CE2', 'Prendre en compte l’influence des outils, supports, matériaux, gestes sur la représentation en 2D et en 3D'],
          ['AP1.4', 'CP CE1 CE2', 'Connaître diverses formes artistiques de représentation du monde, d’hier et d’aujourd’hui, d’ici et d’ailleurs'],
        ]],
        ['AP2', 'L’expression des émotions', [
          ['AP2.1', 'CP CE1 CE2', 'Exprimer sa sensibilité et son imagination avec les éléments du langage plastique'],
          ['AP2.2', 'CP CE1 CE2', 'Expérimenter les effets des couleurs, des matériaux, des supports (organisation, composition)'],
          ['AP2.3', 'CP CE1 CE2', 'Exprimer ses émotions et sa sensibilité en confrontant sa perception à celle des autres'],
        ]],
        ['AP3', 'La narration et le témoignage par les images', [
          ['AP3.1', 'CP CE1 CE2', 'Réaliser des productions plastiques pour raconter, témoigner'],
          ['AP3.2', 'CP CE1 CE2', 'Transformer ou restructurer des images ou des objets'],
          ['AP3.3', 'CP CE1 CE2', 'Articuler le texte et l’image pour illustrer, créer'],
        ]],
        ['AP4', 'Mener un projet, parler de son travail et des œuvres', [
          ['AP4.1', 'CP CE1 CE2', 'Respecter l’espace, les outils et les matériaux partagés'],
          ['AP4.2', 'CP CE1 CE2', 'Mener à terme une production individuelle dans un projet accompagné par le professeur'],
          ['AP4.3', 'CP CE1 CE2', 'Montrer sans réticence ses productions et regarder celles des autres'],
          ['AP4.4', 'CP CE1 CE2', 'Prendre la parole devant un groupe pour partager ses trouvailles ; repérer couleurs, formes, matières'],
          ['AP4.5', 'CP CE1 CE2', 'Exprimer ses émotions devant des œuvres d’art ; s’approprier quelques œuvres du patrimoine'],
        ]],
      ] },
      { dom: 'EM', nom: 'Éducation musicale', livret: 1, comps: [
        ['EM1', 'Chanter', [
          ['EM1.1', 'CP CE1 CE2', 'Reproduire un modèle mélodique, rythmique'],
          ['EM1.2', 'CP CE1 CE2', 'Chanter une mélodie simple avec une intonation juste'],
          ['EM1.3', 'CP CE1 CE2', 'Chanter une comptine, un chant par imitation'],
          ['EM1.4', 'CP CE1 CE2', 'Interpréter un chant avec expressivité (phrasé, articulation du texte)'],
          ['EM1.5', 'CP CE1 CE2', 'Mobiliser son corps pour interpréter'],
        ]],
        ['EM2', 'Écouter, comparer', [
          ['EM2.1', 'CP CE1 CE2', 'Décrire et comparer des éléments sonores ; repérer des sons et des suites musicales'],
          ['EM2.2', 'CP CE1 CE2', 'Repérer une organisation simple : retour d’une mélodie, d’un motif rythmique, d’un thème'],
          ['EM2.3', 'CP CE1 CE2', 'Comparer des musiques et identifier des ressemblances et des différences'],
        ]],
        ['EM3', 'Explorer et imaginer', [
          ['EM3.1', 'CP CE1 CE2', 'Expérimenter les paramètres du son : intensité, hauteur, timbre, durée'],
          ['EM3.2', 'CP CE1 CE2', 'Imaginer des représentations graphiques ou corporelles de la musique'],
          ['EM3.3', 'CP CE1 CE2', 'Inventer une organisation simple à partir d’éléments sonores travaillés'],
        ]],
        ['EM4', 'Échanger, partager', [
          ['EM4.1', 'CP CE1 CE2', 'Exprimer ses émotions, ses sentiments et ses préférences artistiques'],
          ['EM4.2', 'CP CE1 CE2', 'Écouter et respecter l’avis des autres et l’expression de leur sensibilité'],
          ['EM4.3', 'CP CE1 CE2', 'Respecter les règles et les exigences d’une production musicale collective'],
        ]],
      ] },
    ],
    // EPS, cycle 2 : BO n° 22 du 28/05/2026, « objectifs d'apprentissage » année par année ; en vigueur au CP en 2026-2027,
    // au CE1 et au CE2 à la rentrée 2027 ({ de: 2027 }). CE1-CE2 en 2026-2027 : attendus de fin de cycle du programme de 2020 ({ a: 2026 }).
    // Livret : 1 Éducation physique et sportive.
    EPS: [
      { dom: 'DE', nom: 'Se déplacer pour agir dans l’espace et sur une durée', livret: 1, comps: [
        ['DE1', 'Se déplacer le plus vite ou le plus longtemps possible', [
          ['DE1.1', 'CP', 'Découvrir une diversité de signaux de départ'],
          ['DE1.2', 'CP', 'Courir vite de façon équilibrée'],
          ['DE1.3', 'CP', 'Courir et franchir sans ralentir des obstacles horizontaux'],
          ['DE1.4', 'CP', 'Courir longtemps en limitant les arrêts'],
          ['DE1.5', 'CE1', 'Se préparer au signal de départ', { de: 2027 }],
          ['DE1.6', 'CE2', 'Réagir vite au signal de départ', { de: 2027 }],
          ['DE1.7', 'CE1 CE2', 'Courir vite et de façon coordonnée', { de: 2027 }],
          ['DE1.8', 'CE1 CE2', 'Courir et franchir sans ralentir des obstacles verticaux', { de: 2027 }],
          ['DE1.9', 'CE1 CE2', 'Courir longtemps sans s’arrêter', { de: 2027 }],
        ]],
        ['DE2', 'Se déplacer pour sauter le plus haut ou le plus loin possible', [
          ['DE2.1', 'CP', 'Varier les impulsions pour sauter loin ou haut'],
          ['DE2.2', 'CE1 CE2', 'Construire une impulsion avec un pied d’appel pour sauter loin ou haut', { de: 2027 }],
        ]],
        ['DE3', 'Se déplacer pour lancer le plus loin possible', [
          ['DE3.1', 'CP', 'Lancer loin et de manière variée différents objets'],
          ['DE3.2', 'CE1 CE2', 'Lancer loin et dans l’axe différents objets', { de: 2027 }],
        ]],
        ['DE4', 'Se déplacer pour s’orienter dans l’espace', [
          ['DE4.1', 'CP', 'Repérer des éléments visibles pour se situer dans un espace connu'],
          ['DE4.2', 'CE1 CE2', 'Repérer des éléments visibles pour s’orienter dans un espace connu', { de: 2027 }],
        ]],
        ['DE5', 'Recueillir et apprécier des résultats', [
          ['DE5.1', 'CP', 'Explorer et utiliser des outils de mesure concrets'],
          ['DE5.2', 'CE1 CE2', 'Identifier la mesure d’un résultat pour progresser', { de: 2027 }],
        ]],
        ['DE20', 'Produire une performance optimale ; adapter ses déplacements (programme 2020)', [
          ['DE20.1', 'CE1 CE2', 'Courir, sauter, lancer à des intensités et des durées variables', { a: 2026 }],
          ['DE20.2', 'CE1 CE2', 'Différencier courir vite et longtemps, lancer loin et précis, sauter haut et loin', { a: 2026 }],
          ['DE20.3', 'CE1 CE2', 'Accepter de viser une performance mesurée et de se confronter aux autres ; remplir quelques rôles', { a: 2026 }],
          ['DE20.4', 'CE1 CE2', 'Réaliser un parcours en adaptant ses déplacements à un environnement inhabituel', { a: 2026 }],
        ]],
      ] },
      { dom: 'EQ', nom: 'Construire des équilibres pour s’adapter à des environnements inhabituels', livret: 1, comps: [
        ['EQ1', 'Construire des équilibres dans des environnements terrestres', [
          ['EQ1.1', 'CP', 'Explorer de nouveaux équilibres : rouler vers l’avant, se suspendre, se renverser'],
          ['EQ1.2', 'CP', 'Explorer un équilibre en mouvement sur une surface réduite et en grimpant sur un support vertical'],
          ['EQ1.3', 'CE1 CE2', 'Construire de nouveaux équilibres : rouler vers l’avant, se suspendre, se renverser', { de: 2027 }],
          ['EQ1.4', 'CE1 CE2', 'Construire un équilibre en mouvement sur une surface réduite et en grimpant sur un support vertical', { de: 2027 }],
        ]],
        ['EQ2', 'Construire des équilibres avec un moyen de locomotion', [
          ['EQ2.1', 'CP', 'Rouler et glisser, avec un moyen de locomotion, en ligne droite'],
          ['EQ2.2', 'CE1 CE2', 'Rouler et glisser, avec un moyen de locomotion, dans des situations variées', { de: 2027 }],
        ]],
        ['EQ3', 'Construire des équilibres dans un environnement aquatique', [
          ['EQ3.1', 'CP', 'Explorer le milieu aquatique et découvrir une nouvelle locomotion'],
          ['EQ3.2', 'CE1 CE2', 'Accepter l’action de l’eau sur son corps et construire un nouvel équilibre horizontal', { de: 2027 }],
        ]],
        ['EQ4', 'Agir en toute sécurité', [
          ['EQ4.1', 'CP', 'Respecter les règles pour ne pas se mettre en danger'],
          ['EQ4.2', 'CE1 CE2', 'Identifier les dangers propres à l’activité et adapter son comportement', { de: 2027 }],
        ]],
        ['EQ20', 'Natation et sécurité (programme 2020)', [
          ['EQ20.1', 'CE1 CE2', 'Se déplacer dans l’eau sur une quinzaine de mètres sans appui, après un temps d’immersion', { a: 2026 }],
          ['EQ20.2', 'CE1 CE2', 'Respecter les règles de sécurité qui s’appliquent', { a: 2026 }],
        ]],
      ] },
      { dom: 'EX', nom: 'S’exprimer avec son corps pour éprouver et partager des émotions', livret: 1, comps: [
        ['EX1', 'Développer une motricité à visée artistique', [
          ['EX1.1', 'CP', 'Explorer des actions à visée artistique'],
          ['EX1.2', 'CP', 'Explorer l’espace scénique'],
          ['EX1.3', 'CE1 CE2', 'Reproduire des actions à visée artistique', { de: 2027 }],
          ['EX1.4', 'CE1 CE2', 'Varier ses actions dans l’espace scénique', { de: 2027 }],
        ]],
        ['EX2', 'Créer des enchaînements simples et mémorisés', [
          ['EX2.1', 'CP', 'Reproduire un enchaînement artistique'],
          ['EX2.2', 'CE1 CE2', 'S’approprier un enchaînement artistique', { de: 2027 }],
        ]],
        ['EX3', 'Éprouver et exprimer des émotions', [
          ['EX3.1', 'CP', 'Explorer la posture d’artiste'],
          ['EX3.2', 'CP', 'Apprécier et décrire une prestation avec un vocabulaire approprié'],
          ['EX3.3', 'CE1 CE2', 'Construire une posture d’artiste', { de: 2027 }],
          ['EX3.4', 'CE1 CE2', 'Apprécier une prestation selon deux ou trois critères', { de: 2027 }],
        ]],
        ['EX20', 'S’exprimer devant les autres (programme 2020)', [
          ['EX20.1', 'CE1 CE2', 'Reproduire une séquence simple d’actions apprise ou présenter une action inventée', { a: 2026 }],
          ['EX20.2', 'CE1 CE2', 'S’adapter au rythme, mémoriser des pas, des figures, des enchaînements, seul ou à plusieurs', { a: 2026 }],
        ]],
      ] },
      { dom: 'OP', nom: 'Coopérer et s’opposer pour apprendre à jouer en respectant les règles et les autres', livret: 1, comps: [
        ['OP1', 'Développer des habiletés motrices dans des situations d’opposition', [
          ['OP1.1', 'CP', 'Maîtriser des actions d’opposition simples'],
          ['OP1.2', 'CP', 'Explorer la zone de jeu dans toutes ses dimensions'],
          ['OP1.3', 'CE1 CE2', 'Maîtriser et contrôler des actions d’opposition simples', { de: 2027 }],
          ['OP1.4', 'CE1 CE2', 'S’adapter à la zone de jeu', { de: 2027 }],
        ]],
        ['OP2', 'Faire des choix pour marquer', [
          ['OP2.1', 'CP', 'Se situer pour agir seul ou à plusieurs'],
          ['OP2.2', 'CE1 CE2', 'Prendre des repères au service d’un projet d’action individuel ou collectif', { de: 2027 }],
        ]],
        ['OP3', 'Respecter les règles du jeu, les partenaires et les adversaires', [
          ['OP3.1', 'CP', 'Explorer les règles du jeu'],
          ['OP3.2', 'CP', 'Explorer les interactions dans le jeu'],
          ['OP3.3', 'CE1 CE2', 'Comprendre et respecter les règles du jeu', { de: 2027 }],
          ['OP3.4', 'CE2', 'Accepter l’opposition tout en respectant l’autre', { de: 2027 }],
        ]],
        ['OP20', 'Conduire et maîtriser un affrontement (programme 2020)', [
          ['OP20.1', 'CE1 CE2', 'S’engager dans un affrontement individuel ou collectif en respectant les règles du jeu', { a: 2026 }],
          ['OP20.2', 'CE1 CE2', 'Contrôler son engagement moteur et affectif pour réussir des actions simples', { a: 2026 }],
          ['OP20.3', 'CE1 CE2', 'Connaître le but du jeu', { a: 2026 }],
          ['OP20.4', 'CE1 CE2', 'Reconnaître ses partenaires et ses adversaires', { a: 2026 }],
        ]],
      ] },
    ],
    // Questionner le monde : programme de 2020 (BO n° 31 du 30/07/2020), « connaissances et compétences associées » ;
    // encore suivi au CE1 et au CE2 en 2026-2027 ({ a: 2026 }), remplacé ensuite par l'histoire-géographie et les sciences.
    // Livret : 1 Questionner le monde.
    QLM: [
      { dom: 'VMO', nom: 'Questionner le monde du vivant, de la matière et des objets', livret: 1, comps: [
        ['Q1', 'La matière', [
          ['Q1.1', 'CE1 CE2', 'Identifier les trois états de la matière et observer des changements d’états', { a: 2026 }],
          ['Q1.2', 'CE1 CE2', 'Identifier un changement d’état de l’eau dans un phénomène de la vie quotidienne', { a: 2026 }],
          ['Q1.3', 'CE1 CE2', 'Mettre en œuvre des expériences simples impliquant l’eau et/ou l’air', { a: 2026 }],
        ]],
        ['Q2', 'Le vivant et la santé', [
          ['Q2.1', 'CE1 CE2', 'Identifier ce qui est animal, végétal, minéral ou élaboré par des êtres vivants', { a: 2026 }],
          ['Q2.2', 'CE1 CE2', 'Connaître le développement et le cycle de vie d’animaux et de végétaux, leurs besoins vitaux', { a: 2026 }],
          ['Q2.3', 'CE1 CE2', 'Identifier les interactions des êtres vivants entre eux et avec leur milieu', { a: 2026 }],
          ['Q2.4', 'CE1 CE2', 'Repérer les éléments permettant la réalisation d’un mouvement corporel', { a: 2026 }],
          ['Q2.5', 'CE1 CE2', 'Mesurer et observer la croissance de son corps', { a: 2026 }],
          ['Q2.6', 'CE1 CE2', 'Mettre en œuvre et apprécier quelques règles d’hygiène de vie (alimentation, activité, sommeil, propreté)', { a: 2026 }],
        ]],
        ['Q3', 'Les objets', [
          ['Q3.1', 'CE1 CE2', 'Observer et utiliser des objets techniques et identifier leur fonction', { a: 2026 }],
          ['Q3.2', 'CE1 CE2', 'Identifier des activités de la vie quotidienne ou professionnelle faisant appel à des objets techniques', { a: 2026 }],
          ['Q3.3', 'CE1 CE2', 'Réaliser des objets techniques par association d’éléments existants, en suivant un schéma de montage', { a: 2026 }],
          ['Q3.4', 'CE1 CE2', 'Réaliser un circuit électrique simple ; distinguer conducteurs et isolants ; respecter la sécurité', { a: 2026 }],
          ['Q3.5', 'CE1 CE2', 'Commencer à s’approprier un environnement numérique (matériel, traitement de texte)', { a: 2026 }],
        ]],
      ] },
      { dom: 'ET', nom: 'Questionner l’espace et le temps', livret: 1, comps: [
        ['Q4', 'Se repérer dans l’espace et le représenter', [
          ['Q4.1', 'CE1 CE2', 'Se repérer dans son environnement proche ; situer objets et personnes les uns par rapport aux autres', { a: 2026 }],
          ['Q4.2', 'CE1 CE2', 'Produire des représentations des espaces familiers et moins familiers', { a: 2026 }],
          ['Q4.3', 'CE1 CE2', 'Lire des plans, se repérer sur des cartes, prélever des informations sur une carte', { a: 2026 }],
          ['Q4.4', 'CE1 CE2', 'Situer un lieu sur une carte ou un globe ; repérer sa région, la France, l’Europe, les continents', { a: 2026 }],
          ['Q4.5', 'CE1 CE2', 'Savoir que la Terre fait partie d’un univers très vaste composé de différents types d’astres', { a: 2026 }],
        ]],
        ['Q5', 'Se repérer dans le temps et le mesurer', [
          ['Q5.1', 'CE1 CE2', 'Identifier les rythmes cycliques du temps ; lire l’heure et les dates', { a: 2026 }],
          ['Q5.2', 'CE1 CE2', 'Comparer, estimer, mesurer des durées', { a: 2026 }],
          ['Q5.3', 'CE1 CE2', 'Prendre conscience que le temps qui passe est irréversible (générations, mémoire familiale)', { a: 2026 }],
          ['Q5.4', 'CE1 CE2', 'Repérer des périodes de l’histoire, quelques grandes dates et personnages clés', { a: 2026 }],
        ]],
        ['Q6', 'Explorer les organisations du monde', [
          ['Q6.1', 'CE1 CE2', 'Comparer des modes de vie à différentes époques ou dans différentes cultures', { a: 2026 }],
          ['Q6.2', 'CE1 CE2', 'Comprendre des interactions simples entre modes de vie et environnement', { a: 2026 }],
          ['Q6.3', 'CE1 CE2', 'Découvrir le quartier, le village, la ville : ses principaux espaces et ses fonctions', { a: 2026 }],
          ['Q6.4', 'CE1 CE2', 'Reconnaître différents paysages et comparer des paysages d’aujourd’hui et du passé', { a: 2026 }],
        ]],
      ] },
    ],
    // Histoire-géographie, cycle 2 : BO n° 22 du 28/05/2026, en vigueur au CP en 2026-2027, au CE1 et au CE2 à la rentrée 2027
    // ({ de: 2027 }). Une compétence par thème ; objectifs = ses « attendus » (plus évaluables), quelques « objectifs d'apprentissage ».
    // Livret : 1 Histoire et géographie.
    HG: [
      { dom: 'H', nom: 'Histoire', livret: 1, comps: [
        ['H1', 'CP · Les manifestations naturelles du temps', [
          ['H1.1', 'CP', 'Expliquer l’alternance du jour et de la nuit en manipulant un globe terrestre'],
          ['H1.2', 'CP', 'Nommer les saisons et donner leurs caractéristiques'],
        ]],
        ['H2', 'CP · Les représentations humaines du temps', [
          ['H2.1', 'CP', 'Savoir que l’année est divisée en mois, le mois en semaines, la semaine en jours, la journée en heures'],
          ['H2.2', 'CP', 'Repérer, ordonner et nommer les jours de la semaine (et les mois de l’année)'],
          ['H2.3', 'CP', 'Utiliser divers calendriers : emploi du temps, éphéméride, calendrier, roue des jours'],
          ['H2.4', 'CP', 'Observer et utiliser des outils de mesure du temps : sablier, pendule, montre, réveil'],
        ]],
        ['H3', 'CP · Situer des évènements dans le temps', [
          ['H3.1', 'CP', 'Connaître les notions d’antériorité, de simultanéité, de postériorité'],
          ['H3.2', 'CP', 'Situer et planifier sur un calendrier des évènements particuliers ou récurrents'],
          ['H3.3', 'CP', 'Se repérer à travers les générations à partir d’arbres généalogiques'],
          ['H3.4', 'CP', 'Compléter une frise chronologique de la journée, de sa vie, voire des générations'],
        ]],
        ['H4', 'CE1 · Du passé proche au passé lointain', [
          ['H4.1', 'CE1', 'Employer le lexique du temps (hier, autrefois, il y a dix ans, cent ans…)', { de: 2027 }],
          ['H4.2', 'CE1', 'Placer sur une frise des évènements récents et des évènements de périodes plus anciennes', { de: 2027 }],
        ]],
        ['H5', 'CE1 · Les grandes périodes de l’histoire', [
          ['H5.1', 'CE1', 'Repérer et mémoriser sur une frise les grandes périodes de l’histoire', { de: 2027 }],
          ['H5.2', 'CE1', 'Situer sur une frise des figures de chaque période historique', { de: 2027 }],
        ]],
        ['H6', 'CE1 · Les traces du passé', [
          ['H6.1', 'CE1', 'Identifier et situer dans le temps des traces du passé (environnement proche, documents)', { de: 2027 }],
          ['H6.2', 'CE1', 'Connaître les métiers d’archéologue et d’historien', { de: 2027 }],
        ]],
        ['H7', 'CE2 · La vie au Paléolithique et au Néolithique', [
          ['H7.1', 'CE2', 'Décrire le mode de vie nomade des chasseurs-cueilleurs au Paléolithique', { de: 2027 }],
          ['H7.2', 'CE2', 'Comprendre le mode de vie sédentaire au Néolithique : agriculture, élevage, premiers métaux', { de: 2027 }],
          ['H7.3', 'CE2', 'Décrire une peinture pariétale ou une gravure rupestre', { de: 2027 }],
          ['H7.4', 'CE2', 'Expliquer les différences de mode de vie entre le Paléolithique et le Néolithique', { de: 2027 }],
        ]],
        ['H8', 'CE2 · Vivre à Rome et en Gaule romaine', [
          ['H8.1', 'CE2', 'Définir l’usage d’un monument ou d’un aménagement caractéristique de Rome', { de: 2027 }],
          ['H8.2', 'CE2', 'Repérer sur une carte l’étendue de l’empire romain à son apogée et y localiser la Gaule', { de: 2027 }],
          ['H8.3', 'CE2', 'Expliquer que le monde gallo-romain mêle les cultures gauloise et romaine', { de: 2027 }],
          ['H8.4', 'CE2', 'Comprendre que la société antique est hiérarchisée (hommes, femmes, esclaves, étrangers)', { de: 2027 }],
        ]],
        ['H9', 'CE2 · La construction du royaume de France (Xe-XVe siècles)', [
          ['H9.1', 'CE2', 'Repérer sur des cartes les grandes étapes de la construction du royaume de France', { de: 2027 }],
          ['H9.2', 'CE2', 'Décrire la cérémonie du sacre', { de: 2027 }],
          ['H9.3', 'CE2', 'Citer les moyens utilisés par les rois pour affirmer leur autorité', { de: 2027 }],
          ['H9.4', 'CE2', 'Nommer et situer sur une frise les Capétiens, les Valois, quelques rois et grandes figures féminines', { de: 2027 }],
        ]],
      ] },
      { dom: 'GE', nom: 'Géographie', livret: 1, comps: [
        ['G1', 'CP · Autour de l’école', [
          ['G1.1', 'CP', 'Nommer les éléments de la classe et les situer les uns par rapport aux autres'],
          ['G1.2', 'CP', 'Faire le plan de la classe et le comparer à celui d’une autre classe'],
          ['G1.3', 'CP', 'Se déplacer dans l’école en s’orientant avec un plan ; décrire l’usage de ses lieux'],
          ['G1.4', 'CP', 'Décrire ou représenter un trajet entre un lieu proche et l’école'],
          ['G1.5', 'CP', 'Reconnaître des lieux familiers représentés sous différents angles de vue'],
        ]],
        ['G2', 'CP · Des représentations du monde', [
          ['G2.1', 'CP', 'Reconnaître un planisphère ; comprendre le passage du globe au planisphère'],
          ['G2.2', 'CP', 'Reconnaître et localiser les continents et les océans sur un planisphère et un globe'],
          ['G2.3', 'CP', 'Situer la France'],
          ['G2.4', 'CP', 'Comprendre que le monde est peuplé ; localiser les grands foyers de peuplement'],
        ]],
        ['G3', 'CE1 · La Terre est peuplée', [
          ['G3.1', 'CE1', 'Localiser les grands foyers de peuplement sur un planisphère', { de: 2027 }],
          ['G3.2', 'CE1', 'Mémoriser et localiser les principales villes du monde', { de: 2027 }],
          ['G3.3', 'CE1', 'Expliquer la différence entre ville et village', { de: 2027 }],
        ]],
        ['G4', 'CE1 · Les lieux où vivent les êtres humains', [
          ['G4.1', 'CE1', 'Caractériser les trois zones climatiques, les grands types de végétation et de relief', { de: 2027 }],
          ['G4.2', 'CE1', 'Localiser sur un planisphère zones climatiques, chaînes de montagne, déserts, grands fleuves', { de: 2027 }],
          ['G4.3', 'CE1', 'Reconnaître forêt tempérée ou tropicale, désert chaud ou froid, prairie ou savane', { de: 2027 }],
          ['G4.4', 'CE1', 'Décrire un paysage à partir d’une photographie ou d’une observation directe', { de: 2027 }],
        ]],
        ['G5', 'CE2 · L’inégale répartition de la population en France', [
          ['G5.1', 'CE2', 'Localiser sur une carte de France les espaces de fortes et de faibles densités', { de: 2027 }],
          ['G5.2', 'CE2', 'Localiser et nommer les cinq principales agglomérations françaises', { de: 2027 }],
          ['G5.3', 'CE2', 'Localiser et nommer les grandes chaînes de montagne et quelques grands fleuves de France', { de: 2027 }],
        ]],
        ['G6', 'CE2 · Se loger et travailler en France', [
          ['G6.1', 'CE2', 'Reconnaître et décrire les éléments des espaces résidentiels', { de: 2027 }],
          ['G6.2', 'CE2', 'Reconnaître et décrire un paysage industriel, agricole, commercial, d’affaires, touristique', { de: 2027 }],
        ]],
      ] },
    ],
    // Sciences et technologie, cycle 2 : BO n° 24 du 11/06/2026, « objectifs d'apprentissage » année par année ;
    // en vigueur au CP en 2026-2027, au CE1 et au CE2 à la rentrée 2027 ({ de: 2027 }). Livret : 1 Sciences et technologie.
    ST: [
      { dom: 'MM', nom: 'La matière, les mesures, l’électricité', livret: 1, comps: [
        ['MM1', 'Masse, volumes, température et temps', [
          ['MM1.1', 'CP', 'Comparer les masses de différents objets ; utiliser le vocabulaire associé aux masses'],
          ['MM1.2', 'CP', 'Lire la valeur de la température avec un thermomètre à liquide'],
          ['MM1.3', 'CE1', 'Mesurer les masses avec une balance, comparer et classer les masses grâce à la mesure', { de: 2027 }],
          ['MM1.4', 'CE2', 'Convertir des unités de masse ; comparer des contenances et des volumes de liquide', { de: 2027 }],
          ['MM1.5', 'CE2', 'Comparer, estimer, mesurer des durées', { de: 2027 }],
        ]],
        ['MM2', 'États physiques de la matière', [
          ['MM2.1', 'CP', 'Reconnaître et identifier les états solide et liquide de l’eau'],
          ['MM2.2', 'CE1', 'Observer le changement d’état de l’eau et sa réversibilité ; nommer solidification et fusion', { de: 2027 }],
          ['MM2.3', 'CE1', 'Constater la conservation de la masse et la non-conservation du volume lors de la solidification', { de: 2027 }],
          ['MM2.4', 'CE1', 'Réaliser des expériences mettant en évidence la matérialité de l’air', { de: 2027 }],
          ['MM2.5', 'CE2', 'Différencier les états solide et liquide (forme, volume, surface horizontale)', { de: 2027 }],
        ]],
        ['MM3', 'L’électricité', [
          ['MM3.1', 'CE1', 'Réaliser un circuit électrique à une boucle (pile, interrupteur, ampoule)', { de: 2027 }],
          ['MM3.2', 'CE1', 'Tester des matériaux pour déterminer s’ils sont isolants ou conducteurs', { de: 2027 }],
        ]],
      ] },
      { dom: 'VE', nom: 'Les êtres vivants dans leur environnement', livret: 1, comps: [
        ['VE1', 'Unité, diversité et fonctions du vivant', [
          ['VE1.1', 'CP', 'Caractériser avec des critères simples ce qui est vivant, non vivant ou élaboré par des êtres vivants'],
          ['VE1.2', 'CE1', 'Déterminer par l’expérience les besoins d’une plante (eau, lumière) ; décrire racine, tige, feuille', { de: 2027 }],
          ['VE1.3', 'CE1', 'Identifier le régime alimentaire d’animaux', { de: 2027 }],
          ['VE1.4', 'CE1', 'Associer les organes des sens et la perception du milieu chez les animaux', { de: 2027 }],
          ['VE1.5', 'CE2', 'Décrire les caractéristiques des êtres vivants (biologie, écologie, classification)', { de: 2027 }],
          ['VE1.6', 'CE2', 'Ordonner les étapes de la vie d’une plante à fleurs ; mesurer la croissance d’un être vivant', { de: 2027 }],
          ['VE1.7', 'CE2', 'Distinguer formes juvénile, larvaire et adulte ; croissance avec ou sans mues', { de: 2027 }],
          ['VE1.8', 'CE2', 'Décrire les organes locomoteurs et les associer à un mode de locomotion et à un milieu', { de: 2027 }],
        ]],
        ['VE2', 'Observer et décrire son environnement proche', [
          ['VE2.1', 'CP', 'Décrire les êtres vivants de son environnement proche et les caractéristiques du milieu ; s’y repérer'],
          ['VE2.2', 'CE1', 'Observer le changement de peuplement au fil des saisons ; relier espèces et milieu', { de: 2027 }],
          ['VE2.3', 'CE1', 'Catégoriser différentes relations entre les êtres vivants', { de: 2027 }],
          ['VE2.4', 'CE2', 'Observer des environnements variés ; élaborer une courte chaîne alimentaire ; le sol, milieu vivant', { de: 2027 }],
        ]],
        ['VE3', 'Agir pour protéger l’environnement', [
          ['VE3.1', 'CP', 'Constater quelques modifications de l’environnement proche par des activités humaines'],
          ['VE3.2', 'CP', 'Mettre en œuvre quelques gestes simples pour protéger l’environnement proche de l’école'],
          ['VE3.3', 'CP CE1 CE2', 'Développer un rapport sensible à la nature', CE_DES_2027],
          ['VE3.4', 'CP CE1 CE2', 'Prendre conscience des possibilités d’agir, seul et ensemble, pour protéger l’environnement', CE_DES_2027],
          ['VE3.5', 'CE1', 'S’impliquer dans une action de préservation de l’environnement proche de l’école', { de: 2027 }],
          ['VE3.6', 'CE2', 'Identifier les conséquences positives et négatives d’activités humaines sur un environnement', { de: 2027 }],
          ['VE3.7', 'CE2', 'S’impliquer dans un projet collectif lié à la transition écologique', { de: 2027 }],
        ]],
      ] },
      { dom: 'CH', nom: 'Le corps humain et la santé', livret: 1, comps: [
        ['CH1', 'Alimentation', [
          ['CH1.1', 'CP', 'Découvrir et nommer les catégories d’aliments et leur origine'],
          ['CH1.2', 'CE1', 'Identifier les apports des aliments (énergie, eau, minéraux, matière) ; la notion d’équilibre alimentaire', { de: 2027 }],
        ]],
        ['CH2', 'Croissance et mouvement', [
          ['CH2.1', 'CP', 'Décrire le schéma corporel ; nommer les principales articulations et quelques os'],
          ['CH2.2', 'CP', 'Repérer sur soi et sur une maquette les éléments qui permettent un mouvement'],
          ['CH2.3', 'CE1', 'Suivre la croissance du corps avec des instruments de mesure ; comparer et respecter les différences', { de: 2027 }],
          ['CH2.4', 'CE1', 'Observer les modifications de la dentition au cours de la croissance', { de: 2027 }],
          ['CH2.5', 'CE2', 'Modéliser une flexion-extension : rôle des muscles et des articulations', { de: 2027 }],
          ['CH2.6', 'CE2', 'Relier l’activité physique aux changements du corps, du rythme respiratoire et cardiaque', { de: 2027 }],
        ]],
        ['CH3', 'Santé et hygiène de vie', [
          ['CH3.1', 'CP', 'Observer son rythme d’activité quotidien (sommeil, activité, repos)'],
          ['CH3.2', 'CP CE1', 'Identifier quelques règles d’hygiène de vie au quotidien et les relier à sa santé', CE_DES_2027],
          ['CH3.3', 'CE1', 'Prendre conscience du rôle de l’attention dans les apprentissages', { de: 2027 }],
          ['CH3.4', 'CE2', 'Constater le lien entre pratique physique régulière et bien-être', { de: 2027 }],
          ['CH3.5', 'CE2', 'Découvrir quelques notions sur le fonctionnement du cerveau pour mieux apprendre', { de: 2027 }],
        ]],
      ] },
      { dom: 'OT', nom: 'Les objets techniques au cœur de la société', livret: 1, comps: [
        ['OT1', 'Les objets techniques', [
          ['OT1.1', 'CP', 'Identifier qu’un objet technique est obtenu par intervention des êtres humains'],
          ['OT1.2', 'CP', 'Identifier des activités quotidiennes faisant appel à des objets techniques répondant à un besoin'],
          ['OT1.3', 'CE1', 'Identifier les parties d’un objet technique : forme, matériau, fonction', { de: 2027 }],
          ['OT1.4', 'CE1', 'Différencier les objets qui utilisent ou non l’énergie électrique', { de: 2027 }],
          ['OT1.5', 'CE1', 'Réaliser une maquette simple avec un circuit électrique ; identifier ses composants', { de: 2027 }],
          ['OT1.6', 'CE1', 'Commander un robot en programmant un déplacement', { de: 2027 }],
          ['OT1.7', 'CE2', 'Comprendre qu’un objet technique est un assemblage de pièces ; réaliser des assemblages simples', { de: 2027 }],
          ['OT1.8', 'CE2', 'Comprendre qu’à un besoin répondent divers objets', { de: 2027 }],
        ]],
        ['OT2', 'Le numérique', [
          ['OT2.1', 'CE2', 'Identifier les dispositifs de saisie, de traitement et de restitution d’informations', { de: 2027 }],
          ['OT2.2', 'CE2', 'Utiliser un ordinateur ou une tablette pour saisir un texte ; utiliser un moteur de recherche', { de: 2027 }],
          ['OT2.3', 'CE2', 'S’initier à la programmation d’objets techniques par des algorithmes simples', { de: 2027 }],
        ]],
      ] },
    ],
  },
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
    // Langue vivante (étrangère ou régionale) : programme des classes de cours moyen, BO n° 12 du 19/03/2026,
    // en vigueur au CM1 en 2026-2027 et au CM2 à la rentrée 2027 (CM2_DES_2027, ou { de: 2027 } pour une ligne propre au CM2).
    // Une compétence par situation du programme ; objectifs = « objectifs d'apprentissage » du niveau A1 (celui que tous
    // les élèves visent), raccourcis ; les compléments A1+ et A2 ne sont pas repris. Lignes « dérivé » : tirées des attendus.
    // CM2 en 2026-2027 : programme de 2020 (BO n° 31 du 30/07/2020), « connaissances et compétences associées » ({ a: 2026 }).
    // Livret : 1 Écouter et parler (CO, EOC, EOI), 2 Lire et écrire (CE, EE) ; médiation dans les deux ([1, 2]).
    LV: [
      { dom: 'CO', nom: 'Écouter et comprendre', livret: 1, comps: [
        ['CO1', 'Suivre le fil d’une histoire simple', [
          ['CO1.1', 'CM1', 'Repérer les lettres de l’alphabet et les chiffres pour réaliser une tâche'],
          ['CO1.2', 'CM1 CM2', 'Repérer les champs lexicaux qui permettent de parler de soi et de sa sphère immédiate', CM2_DES_2027],
          ['CO1.3', 'CM1 CM2', 'Identifier une question, une affirmation, une exclamation grâce aux intonations propres à la langue', CM2_DES_2027],
          ['CO1.4', 'CM1 CM2', 'Reconnaître quelques structures et formes grammaticales simples d’un répertoire mémorisé', CM2_DES_2027],
          ['CO1.5', 'CM2', 'Reconnaître des informations simples et familières grâce aux indices visuels et sonores (images, bruitages, musiques)', { de: 2027 }],
        ]],
        ['CO2', 'Comprendre un message oral court sur un sujet familier ou d’actualité', [
          ['CO2.1', 'CM1 CM2', 'Repérer quelques mots de la prise de contact et des salutations', CM2_DES_2027],
          ['CO2.2', 'CM1 CM2', 'Repérer des mots simples et familiers (famille, environnement immédiat, thèmes travaillés en classe)', CM2_DES_2027],
          ['CO2.3', 'CM1 CM2', 'Reconnaître les pronoms interrogatifs usuels dans des questions simples', CM2_DES_2027],
          ['CO2.4', 'CM1 CM2', 'Déterminer de qui on parle grâce aux pronoms personnels et aux adjectifs possessifs', CM2_DES_2027],
          ['CO2.5', 'CM1', 'Identifier les verbes et les adjectifs de goût et de dégoût pour réaliser une tâche'],
          ['CO2.6', 'CM1 CM2', 'Identifier l’humeur des interlocuteurs (tristesse, joie, colère) grâce à la voix et aux gestes', CM2_DES_2027],
        ]],
        ['CO3', 'Comprendre et agir', [
          ['CO3.1', 'CM1 CM2', 'Reconnaître quelques formes courantes de l’impératif (consignes de classe, jeux, recettes)', CM2_DES_2027],
          ['CO3.2', 'CM1 CM2', 'Identifier les auxiliaires modaux de l’autorisation, de la capacité et de l’incapacité au présent', CM2_DES_2027],
          ['CO3.3', 'CM1 CM2', 'Relever quelques prépositions de lieu et les verbes d’action associés pour réaliser une tâche', CM2_DES_2027],
          ['CO3.4', 'CM1 CM2', 'Reconnaître quelques mots simples de l’environnement proche (famille, école, loisirs, météo)', CM2_DES_2027],
        ]],
        ['CO20', 'Écouter et comprendre (programme 2020)', [
          ['CO20.1', 'CM2', 'Comprendre l’ensemble des consignes utilisées en classe', { a: 2026 }],
          ['CO20.2', 'CM2', 'Suivre les instructions données', { a: 2026 }],
          ['CO20.3', 'CM2', 'Comprendre des mots familiers et des expressions courantes', { a: 2026 }],
          ['CO20.4', 'CM2', 'Suivre le fil d’une histoire simple (conte, légende…)', { a: 2026 }],
          ['CO20.5', 'CM2', 'Identifier le sujet d’un message oral de courte durée', { a: 2026 }],
          ['CO20.6', 'CM2', 'Comprendre et extraire l’information essentielle d’un message oral de courte durée', { a: 2026 }],
        ]],
      ] },
      { dom: 'EOC', nom: 'Parler en continu', livret: 1, comps: [
        ['EOC1', 'Repères phonologiques', [
          ['EOC1.1', 'CM1 CM2', 'Mobiliser les spécificités phonologiques essentielles de la langue étudiée', CM2_DES_2027],
          ['EOC1.2', 'CM1 CM2', 'Prononcer correctement des mots isolés et mémorisés de champs lexicaux connus', CM2_DES_2027],
          ['EOC1.3', 'CM1 CM2', 'Lire à voix haute, de manière expressive, un texte bref préparé auparavant', CM2_DES_2027], // dérivé (attendu)
        ]],
        ['EOC2', 'Se présenter oralement et exprimer ses goûts, présenter les autres', [
          ['EOC2.1', 'CM1 CM2', 'Se présenter à l’aide d’expressions simples et juxtaposées', CM2_DES_2027],
          ['EOC2.2', 'CM1 CM2', 'Utiliser le présent des verbes les plus courants à la 1re ou à la 3e personne du singulier', CM2_DES_2027],
          ['EOC2.3', 'CM1 CM2', 'Donner des informations simples sur ses activités quotidiennes et ses habitudes', CM2_DES_2027],
          ['EOC2.4', 'CM1 CM2', 'Nommer les moments de la journée', CM2_DES_2027],
          ['EOC2.5', 'CM2', 'Mobiliser les marqueurs temporels', { de: 2027 }],
        ]],
        ['EOC3', 'Raconter', [
          ['EOC3.1', 'CM1 CM2', 'Nommer, caractériser, dénombrer simplement des personnes, des objets, des lieux (école, famille, loisirs…)', CM2_DES_2027],
          ['EOC3.2', 'CM1 CM2', 'Employer quelques adjectifs et appliquer les règles d’accord élémentaires', CM2_DES_2027],
          ['EOC3.3', 'CM1', 'Compter en utilisant la suite numérique des nombres'],
          ['EOC3.4', 'CM1 CM2', 'Situer dans l’espace (personnes, objets, lieux) et dans le temps (date, repères simples)', CM2_DES_2027],
          ['EOC3.5', 'CM1 CM2', 'Reproduire un modèle oral court en suivant la trame d’une histoire répétitive (randonnée, album, kamishibaï)', CM2_DES_2027],
          ['EOC3.6', 'CM2', 'Compter au-delà de 100', { de: 2027 }],
        ]],
        ['EOC4', 'Décrire son environnement quotidien, des personnes ou des activités, et exprimer ses goûts', [
          ['EOC4.1', 'CM1 CM2', 'Présenter ce qui se trouve dans son environnement proche', CM2_DES_2027],
          ['EOC4.2', 'CM1 CM2', 'Utiliser le présent simple des verbes courants aux trois personnes du singulier', CM2_DES_2027],
          ['EOC4.3', 'CM1 CM2', 'Utiliser des articles et des déterminants démonstratifs', CM2_DES_2027],
          ['EOC4.4', 'CM1 CM2', 'Utiliser « et » ou « ou » pour juxtaposer des énoncés simples', CM2_DES_2027],
          ['EOC4.5', 'CM1 CM2', 'Exprimer ses goûts de façon simple (verbes, adjectifs, degré)', CM2_DES_2027],
          ['EOC4.6', 'CM2', 'Exprimer la préférence (verbes, comparatif, superlatif)', { de: 2027 }],
        ]],
        ['EOC20', 'Parler en continu (programme 2020)', [
          ['EOC20.1', 'CM2', 'Reproduire un modèle oral (répéter, réciter…)', { a: 2026 }],
          ['EOC20.2', 'CM2', 'Lire à haute voix et de manière expressive un texte bref', { a: 2026 }],
          ['EOC20.3', 'CM2', 'Se présenter oralement et présenter les autres', { a: 2026 }],
          ['EOC20.4', 'CM2', 'Décrire son environnement quotidien, des personnes ou des activités culturellement connotées', { a: 2026 }],
          ['EOC20.5', 'CM2', 'Raconter une histoire courte à l’aide de supports visuels', { a: 2026 }],
          ['EOC20.6', 'CM2', 'Faire une brève annonce (date, anniversaire, invitation…) en situant l’événement dans le temps et l’espace', { a: 2026 }],
        ]],
      ] },
      { dom: 'EOI', nom: 'Réagir et dialoguer', livret: 1, comps: [
        ['EOI1', 'Échanger des informations', [
          ['EOI1.1', 'CM1 CM2', 'Poser quelques questions simples à l’aide des pronoms interrogatifs', CM2_DES_2027],
          ['EOI1.2', 'CM1 CM2', 'Donner quelques consignes ou ordres ritualisés à l’impératif', CM2_DES_2027],
          ['EOI1.3', 'CM2', 'Réagir à des consignes simples, notamment en communication de classe', { de: 2027 }],
          ['EOI1.4', 'CM1 CM2', 'Exprimer simplement l’autorisation sous forme lexicalisée', CM2_DES_2027],
          ['EOI1.5', 'CM1 CM2', 'Utiliser les réponses courtes', CM2_DES_2027],
        ]],
        ['EOI2', 'Exprimer ses émotions ou ses souhaits et réagir', [
          ['EOI2.1', 'CM1 CM2', 'Exprimer des sentiments ou des émotions dans des situations ritualisées', CM2_DES_2027],
          ['EOI2.2', 'CM1 CM2', 'Connaître et utiliser quelques onomatopées typiques', CM2_DES_2027],
        ]],
        ['EOI3', 'Clarifier ou faire clarifier un point', [
          ['EOI3.1', 'CM1 CM2', 'Prononcer correctement les lettres de l’alphabet', CM2_DES_2027],
          ['EOI3.2', 'CM1 CM2', 'Indiquer simplement qu’il a compris ou non', CM2_DES_2027],
          ['EOI3.3', 'CM1 CM2', 'Utiliser des formules toutes faites pour demander le sens d’un mot', CM2_DES_2027],
          ['EOI3.4', 'CM1 CM2', 'Répéter les consignes simples de la communication de classe', CM2_DES_2027],
        ]],
        ['EOI4', 'Établir un contact (saluer, se présenter, présenter quelqu’un)', [
          ['EOI4.1', 'CM1 CM2', 'Utiliser des formules d’adresse élémentaires pour ouvrir un échange', CM2_DES_2027],
          ['EOI4.2', 'CM1 CM2', 'Utiliser des termes élémentaires pour clore une conversation', CM2_DES_2027],
          ['EOI4.3', 'CM1 CM2', 'Utiliser quelques formules de politesse élémentaires', CM2_DES_2027],
          ['EOI4.4', 'CM1 CM2', 'Utiliser quelques formules toutes faites de relance', CM2_DES_2027],
          ['EOI4.5', 'CM1 CM2', 'Relancer par des questions élémentaires en mettant le ton', CM2_DES_2027],
        ]],
        ['EOI20', 'Réagir et dialoguer (programme 2020)', [
          ['EOI20.1', 'CM2', 'Établir un contact social (saluer, se présenter, présenter quelqu’un…)', { a: 2026 }],
          ['EOI20.2', 'CM2', 'Demander à quelqu’un de ses nouvelles et réagir avec des formules de politesse', { a: 2026 }],
          ['EOI20.3', 'CM2', 'Dialoguer pour échanger ou obtenir des renseignements (itinéraire, horaire, prix…)', { a: 2026 }],
          ['EOI20.4', 'CM2', 'Dialoguer sur des sujets familiers (école, loisirs, maison…)', { a: 2026 }],
          ['EOI20.5', 'CM2', 'Réagir à des propositions de la vie courante (remercier, féliciter, s’excuser, accepter, refuser…)', { a: 2026 }],
        ]],
      ] },
      { dom: 'CE', nom: 'Lire et comprendre', livret: 2, comps: [
        ['CE1', 'Comprendre des textes courts et simples', [
          ['CE1.1', 'CM1 CM2', 'Reconnaître des informations simples et familières grâce aux images et au titre', CM2_DES_2027],
          ['CE1.2', 'CM1 CM2', 'Comprendre les informations d’un texte en s’appuyant sur les mots familiers', CM2_DES_2027],
          ['CE1.3', 'CM1 CM2', 'Repérer les chiffres et les nombres pour réaliser une tâche', CM2_DES_2027],
          ['CE1.4', 'CM1 CM2', 'Reconnaître quelques mots pour parler de soi, de son environnement proche et des activités quotidiennes', CM2_DES_2027],
          ['CE1.5', 'CM1 CM2', 'Identifier la nature d’un texte grâce à sa mise en forme (bande dessinée, carte postale, publicité, poème…)', CM2_DES_2027],
        ]],
        ['CE2', 'Identifier la trame narrative d’un récit clairement structuré', [
          ['CE2.1', 'CM1 CM2', 'Reconnaître des mots de la famille et des traits de caractère simples', CM2_DES_2027],
          ['CE2.2', 'CM1 CM2', 'Reconnaître quelques verbes des activités quotidiennes', CM2_DES_2027],
          ['CE2.3', 'CM1 CM2', 'Repérer la phrase affirmative et la phrase négative', CM2_DES_2027],
          ['CE2.4', 'CM1 CM2', 'Repérer quelques connecteurs simples', CM2_DES_2027],
          ['CE2.5', 'CM2', 'S’appuyer sur les images pour anticiper la thématique', { de: 2027 }],
        ]],
        ['CE3', 'Traiter les informations et agir', [
          ['CE3.1', 'CM1 CM2', 'Comprendre le lexique simple des fournitures scolaires ou des ustensiles de cuisine', CM2_DES_2027],
          ['CE3.2', 'CM1 CM2', 'Comprendre les étapes d’une recette en s’appuyant sur l’image', CM2_DES_2027],
          ['CE3.3', 'CM1', 'Reconnaître l’impératif à la forme affirmative et adapter son geste'],
          ['CE3.4', 'CM2', 'Reconnaître l’impératif à la forme affirmative et négative et adapter son geste', { de: 2027 }],
          ['CE3.5', 'CM2', 'Suivre des consignes et des indications courtes et simples (questionnaire, mode d’emploi, recette)', { de: 2027 }],
        ]],
        ['CE20', 'Lire et comprendre (programme 2020)', [
          ['CE20.1', 'CM2', 'Comprendre des mots familiers et des phrases très simples', { a: 2026 }], // attendu de fin de cycle (A1)
          ['CE20.2', 'CM2', 'Comprendre des textes courts et simples (consigne, lettre, poésie, recette, récit…) accompagnés d’un document visuel', { a: 2026 }],
        ]],
      ] },
      { dom: 'EE', nom: 'Écrire', livret: 2, comps: [
        ['EE1', 'Épeler, copier ou écrire sous la dictée des éléments connus', [
          ['EE1.1', 'CM1 CM2', 'Copier des éléments écrits au tableau ou prélevés dans un texte court', CM2_DES_2027],
          ['EE1.2', 'CM1 CM2', 'Retranscrire quelques mots entendus', CM2_DES_2027],
        ]],
        ['EE2', 'Raconter', [
          ['EE2.1', 'CM1 CM2', 'Nommer, caractériser, dénombrer très simplement des personnes, des objets, des lieux (adjectifs, accords élémentaires)', CM2_DES_2027],
          ['EE2.2', 'CM1 CM2', 'Écrire la date du jour', CM2_DES_2027],
          ['EE2.3', 'CM1 CM2', 'Se présenter brièvement à l’écrit en juxtaposant quelques phrases simples', CM2_DES_2027],
          ['EE2.4', 'CM2', 'Utiliser le présent simple des verbes usuels à toutes les personnes', { de: 2027 }],
          ['EE2.5', 'CM2', 'Restituer brièvement les éléments saillants d’une histoire en s’appuyant sur des images', { de: 2027 }],
        ]],
        ['EE3', 'Écrire des phrases simples en s’appuyant sur une trame connue', [
          ['EE3.1', 'CM1 CM2', 'Écrire des informations simples sur soi, son environnement, des personnes ou des activités (présent simple, articles)', CM2_DES_2027],
          ['EE3.2', 'CM1 CM2', 'Utiliser quelques blocs lexicaux très simples pour écrire un courrier à un proche', CM2_DES_2027],
        ]],
        ['EE4', 'Écrire pour décrire, informer ou exprimer un point de vue', [
          ['EE4.1', 'CM1 CM2', 'Exprimer simplement ses goûts (adjectifs qualificatifs, verbes courants)', CM2_DES_2027],
          ['EE4.2', 'CM1 CM2', 'Faire part simplement de son accord ou de son désaccord', CM2_DES_2027],
          ['EE4.3', 'CM1 CM2', 'Parler de ses activités avec quelques adverbes ou adjectifs d’intensité', CM2_DES_2027],
          ['EE4.4', 'CM2', 'Exprimer simplement des préférences', { de: 2027 }],
          ['EE4.5', 'CM2', 'Écrire une série de phrases sur ses activités quotidiennes en imitant des modèles', { de: 2027 }],
        ]],
        ['EE20', 'Écrire (programme 2020)', [
          ['EE20.1', 'CM2', 'Copier des mots isolés et des textes courts', { a: 2026 }],
          ['EE20.2', 'CM2', 'Écrire sous la dictée des expressions connues', { a: 2026 }],
          ['EE20.3', 'CM2', 'Renseigner un questionnaire', { a: 2026 }],
          ['EE20.4', 'CM2', 'Produire seul quelques phrases sur soi-même, les autres, des personnages réels ou imaginaires', { a: 2026 }],
          ['EE20.5', 'CM2', 'Décrire des objets, des lieux', { a: 2026 }],
          ['EE20.6', 'CM2', 'Raconter succinctement des expériences vécues ou imaginées', { a: 2026 }],
          ['EE20.7', 'CM2', 'Rédiger un courrier court et simple d’après un modèle (courriel, carte postale, lettre)', { a: 2026 }],
        ]],
      ] },
      { dom: 'M', nom: 'Médiation et culture', livret: [1, 2], comps: [
        ['M1', 'Prendre des notes, paraphraser', [
          ['M1.1', 'CM1 CM2', 'Recopier sans erreur un court texte ou une liste de mots pour un camarade', CM2_DES_2027],
          ['M1.2', 'CM1 CM2', 'Copier sous la dictée quelques mots très courants déjà connus', CM2_DES_2027],
          ['M1.3', 'CM1 CM2', 'Traduire pour aider un camarade à comprendre une consigne', CM2_DES_2027],
        ]],
        ['M2', 'Identifier les repères culturels', [
          ['M2.1', 'CM1', 'Signaler des différences culturelles par un geste ou des formules élémentaires'],
        ]],
        ['M3', 'Expliciter un message, un document pour autrui', [
          ['M3.1', 'CM1 CM2', 'Mobiliser le lexique des besoins élémentaires (mots isolés, structures très simples)', CM2_DES_2027],
          ['M3.2', 'CM1 CM2', 'Utiliser quelques verbes de perception', CM2_DES_2027],
          ['M3.3', 'CM1 CM2', 'Utiliser quelques termes permettant de situer une information', CM2_DES_2027],
          ['M3.4', 'CM1 CM2', 'Joindre le geste à la parole pour souligner une information', CM2_DES_2027],
        ]],
        ['M4', 'Participer à un travail collectif, coopérer, échanger avec d’autres cultures', [
          ['M4.1', 'CM1 CM2', 'Utiliser des formules d’adresse élémentaires pour accueillir', CM2_DES_2027],
          ['M4.2', 'CM1 CM2', 'Donner quelques consignes ou ordres simples ritualisés', CM2_DES_2027],
          ['M4.3', 'CM1 CM2', 'Dire ou demander si l’on a compris', CM2_DES_2027],
        ]],
        ['M20', 'Découvrir les aspects culturels de la langue (programme 2020)', [
          ['M20.1', 'CM2', 'Identifier quelques grands repères culturels de la vie quotidienne des enfants du même âge dans les pays étudiés', { a: 2026 }],
          ['M20.2', 'CM2', 'Mobiliser ses connaissances culturelles pour décrire ou raconter des personnages réels ou imaginaires', { a: 2026 }],
        ]],
      ] },
    ],
    // Enseignements artistiques : programme du cycle 3 de 2020 (BO n° 31 du 30/07/2020), toujours en vigueur, même texte au CM1
    // et au CM2. Arts plastiques : « compétences travaillées » (le programme ne détaille pas d'objectifs par année) ;
    // éducation musicale et histoire des arts : « connaissances et compétences associées », raccourcies.
    // Livret : 1 Arts plastiques, 2 Éducation musicale, 3 Histoire des arts.
    ART: [
      { dom: 'AP', nom: 'Arts plastiques', livret: 1, comps: [
        ['AP1', 'Expérimenter, produire, créer', [
          ['AP1.1', 'CM1 CM2', 'Choisir, organiser et mobiliser des gestes, des outils et des matériaux en fonction des effets qu’ils produisent'],
          ['AP1.2', 'CM1 CM2', 'Représenter le monde environnant ou donner forme à son imaginaire (dessin, collage, modelage, sculpture, photographie, vidéo…)'],
          ['AP1.3', 'CM1 CM2', 'Rechercher une expression personnelle en s’éloignant des stéréotypes'],
          ['AP1.4', 'CM1 CM2', 'Utiliser les outils informatiques de travail de l’image et de recherche d’information au service de la pratique plastique'],
        ]],
        ['AP2', 'Mettre en œuvre un projet artistique', [
          ['AP2.1', 'CM1 CM2', 'Identifier les principaux outils et compétences nécessaires à la réalisation d’un projet artistique'],
          ['AP2.2', 'CM1 CM2', 'Se repérer dans les étapes d’une production plastique individuelle ou collective, anticiper les difficultés'],
          ['AP2.3', 'CM1 CM2', 'Identifier et assumer sa part de responsabilité dans un processus coopératif de création'],
          ['AP2.4', 'CM1 CM2', 'Adapter son projet en fonction des contraintes de réalisation et de la prise en compte du spectateur'],
        ]],
        ['AP3', 'S’exprimer, analyser sa pratique, celle de ses pairs et celle des artistes', [
          ['AP3.1', 'CM1 CM2', 'Décrire et interroger avec un vocabulaire spécifique ses productions, celles de ses pairs et des œuvres étudiées'],
          ['AP3.2', 'CM1 CM2', 'Justifier ses choix pour rendre compte du chemin de l’intention à la réalisation'],
          ['AP3.3', 'CM1 CM2', 'Exprimer justement ses émotions à partir de ses réalisations, de celles des autres élèves et des œuvres d’art'],
        ]],
        ['AP4', 'Se repérer dans les domaines liés aux arts plastiques, être sensible aux questions de l’art', [
          ['AP4.1', 'CM1 CM2', 'Repérer, pour les dépasser, certains a priori et stéréotypes culturels et artistiques'],
          ['AP4.2', 'CM1 CM2', 'Identifier quelques caractéristiques qui inscrivent une œuvre d’art dans une aire géographique ou culturelle et dans un temps historique'],
          ['AP4.3', 'CM1 CM2', 'Décrire des œuvres d’art et en proposer une compréhension personnelle argumentée'],
        ]],
      ] },
      { dom: 'EM', nom: 'Éducation musicale', livret: 2, comps: [
        ['EM1', 'Chanter et interpréter', [
          ['EM1.1', 'CM1 CM2', 'Reproduire et interpréter un modèle mélodique et rythmique'],
          ['EM1.2', 'CM1 CM2', 'Chanter une mélodie simple avec une intonation juste et une intention expressive'],
          ['EM1.3', 'CM1 CM2', 'Mémoriser et chanter par cœur un chant appris par imitation, soutenir un bref moment de chant en solo'],
          ['EM1.4', 'CM1 CM2', 'Interpréter un chant avec expressivité en respectant des choix et des contraintes donnés'],
          ['EM1.5', 'CM1 CM2', 'Tenir sa partie dans un bref moment de polyphonie'],
          ['EM1.6', 'CM1 CM2', 'Mobiliser son corps pour interpréter, le cas échéant avec des instruments'],
          ['EM1.7', 'CM1 CM2', 'Identifier les difficultés rencontrées dans l’interprétation d’un chant'],
        ]],
        ['EM2', 'Écouter, comparer et commenter', [
          ['EM2.1', 'CM1 CM2', 'Décrire et comparer des éléments sonores de contextes, d’aires géographiques ou d’époques différents'],
          ['EM2.2', 'CM1 CM2', 'Identifier et nommer ressemblances et différences dans deux extraits musicaux'],
          ['EM2.3', 'CM1 CM2', 'Repérer une organisation simple dans un extrait musical (répétition, motif, thème) et en déduire une forme simple (couplet/refrain, ABA)'],
          ['EM2.4', 'CM1 CM2', 'Associer la découverte d’une œuvre à des connaissances construites dans d’autres domaines'],
        ]],
        ['EM3', 'Explorer, imaginer et créer', [
          ['EM3.1', 'CM1 CM2', 'Expérimenter les paramètres du son et en imaginer des utilisations possibles'],
          ['EM3.2', 'CM1 CM2', 'Imaginer des représentations graphiques pour organiser une succession de sons'],
          ['EM3.3', 'CM1 CM2', 'Inventer une organisation simple à partir de sources sonores choisies (dont la voix) et l’interpréter'],
        ]],
        ['EM4', 'Échanger, partager et argumenter', [
          ['EM4.1', 'CM1 CM2', 'Exprimer ses goûts au-delà de son ressenti immédiat'],
          ['EM4.2', 'CM1 CM2', 'Écouter et respecter le point de vue des autres et l’expression de leur sensibilité'],
          ['EM4.3', 'CM1 CM2', 'Argumenter un jugement sur une musique tout en respectant celui des autres'],
          ['EM4.4', 'CM1 CM2', 'Argumenter un choix en vue d’une interprétation collective'],
        ]],
      ] },
      { dom: 'HA', nom: 'Histoire des arts', livret: 3, comps: [
        ['HA1', 'Donner un avis argumenté sur ce que représente ou exprime une œuvre d’art', [
          ['HA1.1', 'CM1 CM2', 'Observer et identifier des personnages mythologiques ou religieux, des objets, des types d’espaces, des éclairages'],
          ['HA1.2', 'CM1 CM2', 'Résumer une action représentée en image, sur scène ou sur un écran, et en caractériser les personnages'],
          ['HA1.3', 'CM1 CM2', 'Caractériser un morceau de musique en termes simples'],
        ]],
        ['HA2', 'Dégager d’une œuvre ses principales caractéristiques techniques et formelles', [
          ['HA2.1', 'CM1 CM2', 'Identifier des matériaux, y compris sonores, et la manière dont l’artiste leur a donné forme'],
          ['HA2.2', 'CM1 CM2', 'Retrouver des formes géométriques et leur agencement dans une façade, un tableau, un pavement, un tapis'],
          ['HA2.3', 'CM1 CM2', 'Dégager d’une forme artistique des éléments de sens'],
        ]],
        ['HA3', 'Relier une œuvre à des usages et au contexte historique et culturel de sa création', [
          ['HA3.1', 'CM1 CM2', 'Mettre en relation des œuvres avec un fait historique, une époque, une aire géographique ou un texte étudiés'],
          ['HA3.2', 'CM1 CM2', 'Mettre en relation un texte connu et plusieurs de ses illustrations ou transpositions (visuelles, musicales, scéniques, filmiques)'],
          ['HA3.3', 'CM1 CM2', 'Mettre en relation des œuvres et objets mobiliers avec des usages et des modes de vie'],
        ]],
        ['HA4', 'Se repérer dans un musée, un lieu d’art, un site patrimonial', [
          ['HA4.1', 'CM1 CM2', 'Effectuer une recherche, collectivement et avec des consignes précises, pour préparer une sortie culturelle'],
          ['HA4.2', 'CM1 CM2', 'Se repérer dans un musée ou un lieu d’art grâce aux plans et aux indications'],
          ['HA4.3', 'CM1 CM2', 'Être sensibilisé à la vulnérabilité du patrimoine'],
        ]],
      ] },
    ],
    // EPS : programme du cycle 3, BO n° 22 du 28/05/2026, partie « Cours moyen » (mêmes objectifs d'apprentissage au CM1 et au CM2),
    // en vigueur au CM1 en 2026-2027 et au CM2 à la rentrée 2027 (CM2_DES_2027) ; objectifs repris tels quels.
    // CM2 en 2026-2027 : programme de 2020, « attendus de fin de cycle » de chaque champ d'apprentissage ({ a: 2026 }),
    // rangés sous le domaine de 2026 le plus proche. Un seul domaine au livret (1).
    EPS: [
      { dom: 'DE', nom: 'Se déplacer pour agir dans l’espace et sur une durée', livret: 1, comps: [
        ['DE1', 'Se déplacer le plus vite ou le plus longtemps possible', [
          ['DE1.1', 'CM1 CM2', 'Courir vite du départ jusqu’à l’arrivée', CM2_DES_2027],
          ['DE1.2', 'CM1 CM2', 'Se relayer avec de la vitesse', CM2_DES_2027],
          ['DE1.3', 'CM1 CM2', 'Courir et franchir sans ralentir des obstacles horizontaux et verticaux', CM2_DES_2027],
          ['DE1.4', 'CM1 CM2', 'Courir longtemps à l’aide de repères externes', CM2_DES_2027],
        ]],
        ['DE2', 'Se déplacer pour sauter le plus haut ou le plus loin possible', [
          ['DE2.1', 'CM1 CM2', 'Construire une course d’élan réduite et une impulsion sur le pied d’appel pour sauter loin ou haut', CM2_DES_2027],
        ]],
        ['DE3', 'Se déplacer pour lancer le plus loin possible', [
          ['DE3.1', 'CM1 CM2', 'Construire une course d’élan réduite pour lancer loin différents objets', CM2_DES_2027],
        ]],
        ['DE4', 'Se déplacer pour s’orienter dans l’espace', [
          ['DE4.1', 'CM1 CM2', 'S’orienter dans un espace partiellement connu à l’aide de repères simples et variés', CM2_DES_2027],
        ]],
        ['DE5', 'Recueillir et apprécier des résultats', [
          ['DE5.1', 'CM1 CM2', 'Mesurer avec précision une action motrice sans porter de jugement de valeur', CM2_DES_2027],
        ]],
        ['DE20', 'Produire une performance optimale, mesurable à une échéance donnée (programme 2020)', [
          ['DE20.1', 'CM2', 'Réaliser des efforts et enchaîner plusieurs actions motrices pour aller plus vite, plus longtemps, plus haut, plus loin', { a: 2026 }],
          ['DE20.2', 'CM2', 'Combiner une course, un saut, un lancer pour faire la meilleure performance cumulée', { a: 2026 }],
          ['DE20.3', 'CM2', 'Mesurer et quantifier les performances, les enregistrer, les comparer, les classer', { a: 2026 }],
          ['DE20.4', 'CM2', 'Assumer les rôles de chronométreur et d’observateur', { a: 2026 }],
        ]],
      ] },
      { dom: 'EQ', nom: 'Construire des équilibres pour s’adapter à des environnements inhabituels', livret: 1, comps: [
        ['EQ1', 'Construire des équilibres dans des environnements terrestres', [
          ['EQ1.1', 'CM1 CM2', 'Construire un nouvel équilibre avec le corps qui roule vers l’arrière', CM2_DES_2027],
          ['EQ1.2', 'CM1 CM2', 'Conserver un équilibre de suspension en l’air en variant les positions du corps', CM2_DES_2027],
          ['EQ1.3', 'CM1 CM2', 'Construire son équilibre avec le déplacement du corps en position renversée', CM2_DES_2027],
          ['EQ1.4', 'CM1 CM2', 'Construire un nouvel équilibre avec le corps suspendu', CM2_DES_2027],
          ['EQ1.5', 'CM1 CM2', 'Stabiliser son équilibre vertical en se déplaçant de manière coordonnée sur une paroi verticale', CM2_DES_2027],
        ]],
        ['EQ2', 'Construire des équilibres avec un moyen de locomotion', [
          ['EQ2.1', 'CM1 CM2', 'Savoir circuler, glisser, avec un moyen de locomotion, seul et en groupe', CM2_DES_2027],
        ]],
        ['EQ3', 'Construire des équilibres dans un environnement aquatique', [
          ['EQ3.1', 'CM1 CM2', 'Accepter le déséquilibre et se déplacer de différentes façons grâce à un nouvel équilibre horizontal', CM2_DES_2027],
        ]],
        ['EQ4', 'Agir en toute sécurité', [
          ['EQ4.1', 'CM1 CM2', 'Agir en sécurité pour soi et pour les autres dans des situations simples', CM2_DES_2027],
        ]],
        ['EQ20', 'Adapter ses déplacements à des environnements variés (programme 2020)', [
          ['EQ20.1', 'CM2', 'Réaliser, seul ou à plusieurs, un parcours dans plusieurs environnements inhabituels, en milieu naturel aménagé ou artificiel', { a: 2026 }],
          ['EQ20.2', 'CM2', 'Connaître et respecter les règles de sécurité qui s’appliquent à chaque environnement', { a: 2026 }],
          ['EQ20.3', 'CM2', 'Identifier la personne responsable à alerter ou la procédure en cas de problème', { a: 2026 }],
          ['EQ20.4', 'CM2', 'Valider l’attestation scolaire du savoir nager (ASSN)', { a: 2026 }],
        ]],
      ] },
      { dom: 'EX', nom: 'S’exprimer avec son corps pour éprouver et partager des émotions', livret: 1, comps: [
        ['EX1', 'Développer une motricité à visée artistique', [
          ['EX1.1', 'CM1 CM2', 'Enrichir ses actions à visée artistique', CM2_DES_2027],
          ['EX1.2', 'CM1 CM2', 'Coordonner ses actions dans l’espace scénique', CM2_DES_2027],
        ]],
        ['EX2', 'Créer des enchaînements simples et mémorisés', [
          ['EX2.1', 'CM1 CM2', 'Enrichir un enchaînement artistique fluide et mémorisé', CM2_DES_2027],
        ]],
        ['EX3', 'Éprouver et exprimer des émotions', [
          ['EX3.1', 'CM1 CM2', 'Se présenter en tant qu’artiste', CM2_DES_2027],
          ['EX3.2', 'CM1 CM2', 'Apprécier une prestation avec précision et donner des conseils', CM2_DES_2027],
        ]],
        ['EX20', 'S’exprimer devant les autres par une prestation artistique et/ou acrobatique (programme 2020)', [
          ['EX20.1', 'CM2', 'Réaliser en petits groupes une séquence acrobatique destinée à être jugée et une séquence artistique destinée à être appréciée', { a: 2026 }],
          ['EX20.2', 'CM2', 'Savoir filmer une prestation pour la revoir et la faire évoluer', { a: 2026 }],
          ['EX20.3', 'CM2', 'Respecter les prestations des autres et accepter de se produire devant les autres', { a: 2026 }],
        ]],
      ] },
      { dom: 'OP', nom: 'Coopérer et s’opposer pour apprendre à jouer en respectant les règles et les autres', livret: 1, comps: [
        ['OP1', 'Développer des habiletés motrices dans des situations d’opposition', [
          ['OP1.1', 'CM1 CM2', 'Coordonner plusieurs actions d’opposition', CM2_DES_2027],
          ['OP1.2', 'CM1 CM2', 'Orienter ses déplacements vers la cible', CM2_DES_2027],
        ]],
        ['OP2', 'Faire des choix pour marquer', [
          ['OP2.1', 'CM1 CM2', 'Mener un projet d’action individuel ou collectif', CM2_DES_2027],
        ]],
        ['OP3', 'Respecter les règles du jeu, les partenaires et les adversaires', [
          ['OP3.1', 'CM1 CM2', 'Faire respecter les règles du jeu', CM2_DES_2027],
          ['OP3.2', 'CM1 CM2', 'Coopérer dans l’organisation du jeu', CM2_DES_2027],
        ]],
        ['OP20', 'Conduire et maîtriser un affrontement collectif ou interindividuel (programme 2020)', [
          ['OP20.1', 'CM2', 'S’organiser tactiquement pour gagner le duel ou le match en identifiant les situations favorables de marque', { a: 2026 }],
          ['OP20.2', 'CM2', 'Maintenir un engagement moteur efficace sur tout le temps de jeu prévu', { a: 2026 }],
          ['OP20.3', 'CM2', 'Respecter les partenaires, les adversaires et l’arbitre', { a: 2026 }],
          ['OP20.4', 'CM2', 'Assurer différents rôles sociaux (joueur, arbitre, observateur)', { a: 2026 }],
          ['OP20.5', 'CM2', 'Accepter le résultat de la rencontre et être capable de le commenter', { a: 2026 }],
        ]],
      ] },
    ],
  },
};
// (Les 8 verbes irréguliers du programme : faire, aller, dire, venir, pouvoir, voir, vouloir, prendre.)
const VERBES_IRREGULIERS_CM = 'faire, aller, dire, venir, pouvoir, voir, vouloir, prendre';
