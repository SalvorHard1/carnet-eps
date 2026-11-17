'use strict';
/* ---------- Carnet École : onglet « Ressources » ----------
   L'enseignant choisit la matière, puis le cycle, puis la compétence travaillée (objectifs du programme, programmeecole.js) :
   l'appli propose des idées d'activités et, quand c'est possible, une fiche élève qu'elle FABRIQUE elle-même
   (nombres tirés au hasard selon le niveau, plusieurs versions, corrigé), en PDF ou à imprimer (DessinPdf).
   Deux sources :
   - RESSOURCES_ECOLE ci-dessous, livrée avec l'appli et enrichie au fil des versions. Règle : idées tirées UNIQUEMENT de ressources EDUSCOL
     (choix de l'enseignant : aucune autre source), reformulées avec nos mots ; chaque ressource affiche « D’après Eduscol : » + le document.
   - les ressources ajoutées par l'enseignant : collection `modeles`, `sorte: 'ressource'` (rangées dans son carnet,
     aucune donnée d'élève ; tp.js ignore ces fiches).
   Ajouter une ressource à la banque : une entrée de RESSOURCES_ECOLE (codes d'objectifs du programme du cycle, ex. 'N4.1'),
   avec `fiche: { gen, options }` si un générateur de GENERATEURS_FICHES convient. Ne jamais changer l'id d'une entrée publiée. */

const REF_CYCLE_RES = { 2: 'ecoleCycle2', 3: 'ecoleCycle3' };
const NIVEAUX_CYCLE_RES = { 2: ['CP', 'CE1', 'CE2'], 3: ['CM1', 'CM2'] };
const SORTES_RES = { fiche: ['Fiche élève à imprimer', 'imprimer'], jeu: ['Jeu', 'de'], rituel: ['Rituel', 'horloge'], seance: ['Séance', 'cahier'] };

// Sources : EDUSCOL UNIQUEMENT (choix de l'enseignant). Chaque ressource affiche « D’après Eduscol : » + le document.
const URL_EDUSCOL_RES = 'https://eduscol.education.gouv.fr/sites/default/files/document/';
const SOURCES_RES = {
  evalCE2Faits: { nom: 'Évaluations de début de CE2, fiche d’intervention « Mémoriser des faits et des procédures numériques » (2026)',
    url: URL_EDUSCOL_RES + '2026evaluationdebutce2mathematiquesficheinterventionmemoriserfaitsproceduresnumeriques-129526.pdf' },
  evalCE2Poser: { nom: 'Évaluations de début de CE2, fiche d’intervention « Poser et effectuer des opérations » (2026)',
    url: URL_EDUSCOL_RES + '2026evaluationdebutce2mathematiquesficheinterventionposereffectueroperations-129532.pdf' },
  evalCM1Faits: { nom: 'Évaluations de début de CM1, fiche d’intervention « Mémoriser des faits numériques et des procédures » (2026)',
    url: URL_EDUSCOL_RES + '2026evaluationdebutcm1mathematiquesficheinterventionmemoriserfaitsnumeriquesprocedures-129508.pdf' },
  evalCM1Poser: { nom: 'Évaluations de début de CM1, fiche d’intervention « Poser et effectuer des opérations » (2026)',
    url: URL_EDUSCOL_RES + '2026evaluationdebutcm1mathematiquesficheinterventionposercalculeradditionssoustractionsmultiplications-129514.pdf' },
  evalCM2Poser: { nom: 'Évaluations de début de CM2, fiche d’intervention « Poser et effectuer des opérations » (2026)',
    url: URL_EDUSCOL_RES + '2026evaluationdebutcm2mathematiquesficheinterventionposereffectueroperations-129484.pdf' },
  evalCE2Ecrire: { nom: 'Évaluations de début de CE2, fiche d’intervention « Écrire des nombres entiers » (2026)',
    url: URL_EDUSCOL_RES + '2026evaluationdebutce2mathematiquesficheinterventionecrirenombresentiers-129523.pdf' },
  evalCE2Decomposition: { nom: 'Évaluations de début de CE2, fiche d’intervention « Reconnaître un nombre entier à partir de sa décomposition additive » (2026)',
    url: URL_EDUSCOL_RES + '2026evaluationdebutce2mathematiquesficheinterventionreconnaitrenombreentierdecompositionadditive-129535.pdf' },
  evalCE2Droite: { nom: 'Évaluations de début de CE2, fiche d’intervention « Placer un nombre sur une ligne graduée » (2026)',
    url: URL_EDUSCOL_RES + '2026evaluationdebutce2mathematiquesficheinterventionplacernombredroitegraduee-129529.pdf' },
  evalCM1Ecrire: { nom: 'Évaluations de début de CM1, fiche d’intervention « Écrire des nombres entiers » (2026)',
    url: URL_EDUSCOL_RES + '2026evaluationdebutcm1mathematiquesficheinterventionecrirenombresentiers-129505.pdf' },
  evalCM1Ligne: { nom: 'Évaluations de début de CM1, fiche d’intervention « Placer un nombre sur une ligne graduée » (2026)',
    url: URL_EDUSCOL_RES + '2026evaluationdebutcm1mathematiquesficheinterventionplacernombrelignegraduee-129511.pdf' },
  guideCP: { nom: 'Guide « Pour enseigner les nombres, le calcul et la résolution de problèmes au CP » (guides fondamentaux pour l’enseignement)',
    url: URL_EDUSCOL_RES + 'guide-pour-enseigner-les-nombres-le-calcul-et-la-resolution-de-problemes-au-cp-68664.pdf' },
  evalCM2Problemes: { nom: 'Évaluations de début de CM2, fiche d’intervention « Résoudre des problèmes en utilisant des fractions, des nombres décimaux et le calcul » (2026)',
    url: URL_EDUSCOL_RES + '2026evaluationdebutcm2mathematiquesficheinterventionresoudreproblemesfractionsnombresdecimauxcalcul-129496.pdf' },
  // Fractions et nombres décimaux (v1.67)
  livretCE1Fractions: { nom: 'Livret d’accompagnement de programme, mathématiques CE1 (2025), séquence n° 1 « Enseigner les fractions »',
    url: URL_EDUSCOL_RES + '2025livretaccompagnementmathce1pdf-116325.pdf' },
  fractionsCE1CM2: { nom: 'Exemples de mise en œuvre pour l’enseignement des fractions du CE1 au CM2 dans le cadre des nouveaux programmes de mathématiques : recommandations',
    url: URL_EDUSCOL_RES + 'les-fractionsv2pdf-111831.pdf' },
  livretCM2Fractions: { nom: 'Livret d’accompagnement de programme, mathématiques CM2 (2026), séquence n° 1 « Opérer sur des fractions : additionner et soustraire »',
    url: URL_EDUSCOL_RES + '2026-livret-accompagnement-mathematiques-cm2-128556.pdf' },
  fracDecCycle3: { nom: 'Ressource d’accompagnement « Fractions et nombres décimaux au cycle 3 »',
    url: URL_EDUSCOL_RES + 'ra16c3mathfracdecdocmaitrev2681601pdf-76887.pdf' },
  evalCM2Droite: { nom: 'Évaluations de début de CM2, fiche d’intervention « Placer un nombre sur une droite graduée » (2026)',
    url: URL_EDUSCOL_RES + '2026evaluationdebutcm2mathematiquesficheinterventionplacernombredroitegraduee-129481.pdf' },
  exemplesCM2: { nom: 'Exemples pour la mise en œuvre des programmes, CM2, mathématiques : exemples de réussite (2025)',
    url: URL_EDUSCOL_RES + 'exemplesmiseenoeuvrecm2-mathpdf-111537.pdf' },
};
// « D’après Eduscol : … » (banque) ou la source notée par l'enseignant (ses propres ressources).
const sourceRes = r => {
  const s = SOURCES_RES[r.source];
  if (s) return { texte: `D’après Eduscol : ${s.nom}`, titre: s.nom, url: s.url };
  return r.sourceTexte ? { texte: `D’après : ${r.sourceTexte}`, titre: r.sourceTexte } : null;
};

/* ---------- La banque livrée avec l'appli ---------- */

const RESSOURCES_ECOLE = [
  // Mathématiques, cycle 2 — faits numériques et calcul mental
  { id: 'ma2-tables-addition', matiere: 'MA', cycle: 2, objectifs: ['N4.1'], niveaux: ['CP', 'CE1', 'CE2'], sorte: 'fiche', duree: '5 à 10 min, chaque jour',
    titre: 'Tables d’addition : mes calculs du jour',
    resume: 'Une série courte de calculs à faire de tête, sans poser : chercher la somme, mais aussi le nombre qui manque. À refaire souvent, en notant combien de calculs sont justes dans le temps donné.',
    deroule: ['Annoncer le temps (1 à 3 minutes selon les élèves) ; chacun calcule sans poser.', 'Correction collective rapide : on dit comment on a trouvé (double, passage par 10, je connais par cœur…).', 'Chaque élève note son score : le défi est de faire mieux que soi-même, pas que les autres.'],
    variantes: ['Trois sortes de questions : 5 + 4 = …, 3 + … = 10, et les décompositions d’un nombre.', 'Réduire peu à peu le temps, présenté comme un défi.'],
    source: 'evalCE2Faits', fiche: { gen: 'faitsAddition' } },
  { id: 'ma2-familles-table', matiere: 'MA', cycle: 2, objectifs: ['N4.1', 'N4.2'], niveaux: ['CP', 'CE1', 'CE2'], sorte: 'fiche', duree: '10 min',
    titre: 'La table d’addition, famille par famille',
    resume: 'Apprendre la table par familles qui s’appuient sur ce qu’on sait déjà : le suivant (+1, +2), 10 + un nombre, les doubles, les presque-doubles, les compléments à 10, puis le passage par 10.',
    materiel: ['Cubes emboîtables, frise numérique, cartes à points pour manipuler d’abord.'],
    deroule: ['Construire chaque famille avec le matériel, en disant ce qu’on fait (images mentales).', 'Afficher la table et entourer ce que l’élève sait déjà : il voit ce qui lui reste à apprendre.', 'S’entraîner sur la fiche d’une seule famille, puis sur un mélange.'],
    variantes: ['Faire remarquer que 3 + 4 et 4 + 3 donnent le même résultat : on n’apprend que la moitié de la table.', '8 + 9 : c’est 8 + 8 + 1. 9 + 5 : c’est 9 + 1 + 4.'],
    source: 'evalCE2Faits', fiche: { gen: 'familles' } },
  { id: 'ma2-doubles-moities', matiere: 'MA', cycle: 2, objectifs: ['N4.2', 'N5.8'], niveaux: ['CP', 'CE1'], sorte: 'fiche', duree: '10 min',
    titre: 'Doubles et moitiés',
    resume: 'Retrouver vite le double ou la moitié d’un nombre : un appui pour les presque-doubles et le partage.',
    deroule: ['Manipuler : partager une collection en deux parts égales, la reconstituer.', 'Faire le lien : la moitié de 14, c’est le nombre dont le double est 14.', 'Entraînement sur la fiche, puis jeu de dominos des doubles et moitiés.'],
    source: 'evalCE2Faits', fiche: { gen: 'doubles' } },
  { id: 'ma2-dizaines', matiere: 'MA', cycle: 2, objectifs: ['N5.2', 'N5.3', 'N5.10'], niveaux: ['CP', 'CE1', 'CE2'], sorte: 'fiche', duree: '10 min',
    titre: 'Ajouter ou retirer 10, des dizaines, des centaines',
    resume: 'Calculer sans compter un par un, en s’appuyant sur l’écriture du nombre : 47 + 10, c’est une dizaine de plus.',
    materiel: ['Barres de dix et cubes, ou étiquettes « dizaines / unités ».'],
    deroule: ['Montrer avec le matériel : on ajoute une barre, le chiffre des dizaines augmente de 1.', 'Faire dire le lien entre l’oral et l’écrit (« dix plus cinq, quinze » s’écrit 10 + 5 = 15).', 'Entraînement sur la fiche.'],
    source: 'evalCE2Faits', fiche: { gen: 'dizaines' } },
  { id: 'ma2-presque-dizaine', matiere: 'MA', cycle: 2, objectifs: ['N5.6', 'N5.12', 'N5.13', 'N5.17', 'N5.18'], niveaux: ['CP', 'CE1', 'CE2'], sorte: 'fiche', duree: '10 min',
    titre: 'Ajouter ou soustraire 9, 19, 29…',
    resume: 'Une procédure à apprendre : pour ajouter 9, on ajoute 10 puis on enlève 1. La fiche peut montrer l’étape, puis s’en passer.',
    deroule: ['Construire la règle ensemble et l’écrire dans le cahier de leçons : 47 + 9 = 47 + 10 – 1 = 56.', 'Remarquer les cas simples : 20 + 9 = 29, et 31 + 9 = 40 (complément à 10).', 'Fiche « avec l’étape écrite », puis « sans l’étape » quand l’élève est prêt.'],
    source: 'evalCE2Faits', fiche: { gen: 'presqueDizaine' } },
  { id: 'ma2-complement-dizaine', matiere: 'MA', cycle: 2, objectifs: ['N5.4'], niveaux: ['CP', 'CE1'], sorte: 'fiche', duree: '10 min',
    titre: 'Aller jusqu’à la dizaine suivante',
    resume: 'Combien faut-il ajouter à 37 pour arriver à 40 ? Le complément à la dizaine, base du passage par 10.',
    deroule: ['Sur la frise numérique : on part de 37, on avance jusqu’à 40.', 'Faire le lien avec les compléments à 10 (7 + 3 = 10).', 'Entraînement sur la fiche.'],
    source: 'evalCE2Faits', fiche: { gen: 'complementDizaine' } },
  // Mathématiques, cycle 2 — calcul posé
  { id: 'ma2-additions-posees', matiere: 'MA', cycle: 2, objectifs: ['N3.3', 'N3.5'], niveaux: ['CP', 'CE1', 'CE2'], sorte: 'fiche', duree: '15 min',
    titre: 'Additions posées en colonnes',
    resume: 'S’entraîner à poser et calculer des additions. On travaille d’abord sans retenue, puis avec une retenue, avant de mélanger.',
    materiel: ['Matériel de numération (plaques, barres, cubes) pour vérifier.'],
    deroule: ['Rappeler pourquoi on aligne les unités sous les unités, les dizaines sous les dizaines.', 'On commence par les unités : dix unités font une dizaine, c’est la retenue.', 'Entraînement court et fréquent (environ 15 minutes) plutôt qu’une longue séance.'],
    variantes: ['Mettre un nombre plus court que l’autre : la colonne vide compte pour zéro.', 'Trois nombres à additionner (dès le CE1).'],
    source: 'evalCE2Poser', fiche: { gen: 'posees', options: { op: '+' } } },
  { id: 'ma2-soustractions-posees', matiere: 'MA', cycle: 2, objectifs: ['N3.5'], niveaux: ['CE1', 'CE2'], sorte: 'fiche', duree: '15 min',
    titre: 'Soustractions posées en colonnes',
    resume: 'S’entraîner à la soustraction posée, sans retenue puis avec. L’équipe garde la même technique (par cassage ou par compensation) du CE1 au CM2.',
    deroule: ['Vérifier d’abord le sens : soustraire, c’est retirer ; le résultat est plus petit que le premier nombre.', 'Travailler les cas sans retenue, puis avec une retenue.', 'Contrôler le résultat par un ordre de grandeur ou par l’addition.'],
    source: 'evalCE2Poser', fiche: { gen: 'posees', options: { op: '-' } } },
  { id: 'ma2-materiel-avant-poser', matiere: 'MA', cycle: 2, objectifs: ['N3.5', 'N1.4', 'N1.5'], niveaux: ['CE1', 'CE2'], sorte: 'seance', duree: '30 à 45 min',
    titre: 'Faire l’addition avec le matériel, puis la poser',
    resume: 'Pour comprendre la retenue : faire le calcul avec le matériel de numération, puis relier chaque geste à ce qu’on écrit dans l’opération posée.',
    materiel: ['Matériel de numération (plaques de cent, barres de dix, cubes).'],
    deroule: ['Par deux, les élèves construisent les deux nombres avec le matériel (par exemple 595 et 45).', 'Ils réunissent : dix cubes deviennent une barre, dix barres deviennent une plaque.', 'Mise en commun : chaque échange correspond à une retenue dans l’opération posée.', 'Trace écrite : l’opération posée avec, à côté, ce qui s’est passé avec le matériel.'],
    source: 'evalCE2Poser' },
  // Mathématiques, cycle 2 — problèmes
  { id: 'ma2-problemes-additifs', matiere: 'MA', cycle: 2, objectifs: ['N3.1', 'N6.1', 'N6.2', 'N6.4', 'N6.5', 'N6.6'], niveaux: ['CP', 'CE1', 'CE2'], sorte: 'fiche', duree: '15 à 20 min',
    titre: 'Petits problèmes : ajouter, retirer, chercher une partie',
    resume: 'Des problèmes courts pour donner du sens à l’addition et à la soustraction : réunir, retirer, chercher une partie, comparer.',
    deroule: ['Lire l’énoncé ensemble, faire raconter l’histoire, représenter (dessin, schéma en barres).', 'Chercher dans le cadre, puis écrire la phrase réponse.', 'Afficher un problème « modèle » de chaque sorte : les suivants se résolvent par analogie (« c’est comme… »).'],
    source: 'evalCE2Poser', fiche: { gen: 'problemes' } },
  // Mathématiques, cycle 2 — jeux et rituels (sans fiche)
  { id: 'ma2-bataille-sommes', matiere: 'MA', cycle: 2, objectifs: ['N4.1'], niveaux: ['CP', 'CE1'], sorte: 'jeu', duree: '10 min, à 2',
    titre: 'Bataille des sommes',
    resume: 'Un jeu de bataille où chacun retourne deux cartes et annonce la somme : la plus grande somme remporte les cartes.',
    materiel: ['Un jeu de cartes de 1 à 10 (ou des cartes nombres) pour deux élèves.'],
    deroule: ['Chaque joueur retourne deux cartes et dit la somme à voix haute.', 'L’autre vérifie ; la plus grande somme gagne les quatre cartes.', 'En cas d’égalité : bataille, on rejoue deux cartes.'],
    variantes: ['Garder seulement les cartes jusqu’à 5 pour commencer.', 'Plus petite somme gagnante, ou différence au lieu de la somme.'],
    source: 'evalCE2Faits' },
  { id: 'ma2-furet', matiere: 'MA', cycle: 2, objectifs: ['N1.6', 'N1.7', 'N5.2', 'N5.10'], niveaux: ['CP', 'CE1', 'CE2'], sorte: 'rituel', duree: '5 min',
    titre: 'Le furet des nombres',
    resume: 'Rituel oral : on fait passer la suite des nombres d’élève en élève, de 1 en 1, de 10 en 10, en avançant ou en reculant.',
    deroule: ['Annoncer le départ et le pas : « On part de 37, on ajoute 10 ».', 'Chaque élève dit le nombre suivant ; en cas d’erreur, la classe aide et on repart.', 'S’arrêter sur un passage difficile (97, 107…) et faire dire comment on a trouvé.'],
    variantes: ['Reculer (enlever 10, enlever 1).', 'Changer de pas en cours de route.'],
    source: 'evalCE2Faits' },
  { id: 'ma2-calcul-en-ligne', matiere: 'MA', cycle: 2, objectifs: ['N5.7', 'N5.12', 'N5.17'], niveaux: ['CP', 'CE1', 'CE2'], sorte: 'rituel', duree: '10 min',
    titre: 'Calcul en ligne : je montre mes étapes',
    resume: 'Un calcul au tableau, chacun écrit sur son ardoise comment il le fait en ligne ; on compare les procédures pour garder les plus efficaces.',
    materiel: ['Ardoises.'],
    deroule: ['Écrire un calcul (par exemple 8 + 6, ou 47 + 9).', 'Chacun écrit ses étapes : 8 + 2 + 4 = 14, ou 6 + 6 + 2 = 14.', 'Comparer et nommer les procédures ; peu à peu, les étapes ne sont plus écrites.'],
    source: 'evalCE2Faits' },
  // Mathématiques, cycle 2 — multiplication et division
  { id: 'ma2-tables-multiplication', matiere: 'MA', cycle: 2, objectifs: ['N4.3', 'N3.6', 'N3.7'], niveaux: ['CE1', 'CE2'], sorte: 'fiche', duree: '5 à 10 min, chaque jour',
    titre: 'Tables de multiplication : trois sortes de questions',
    resume: 'S’entraîner aux tables en posant trois sortes de questions, de la plus simple à la plus difficile : 6 × 7 = …, 6 × … = 42, et « dans 42, combien de fois 6 ? ».',
    materiel: ['La table de Pythagore affichée ou collée dans le cahier.'],
    deroule: ['Choisir les tables travaillées : d’abord 2, 5 et 10, puis 4 et 8 (doubles de la table de 2), puis 3 et 6, enfin 7 et 9.', 'Fiche courte, sans poser, en temps limité.', 'Correction collective : comment retrouver un résultat oublié (6 × 7, c’est 6 × 6 + 6).'],
    variantes: ['Ne faire que les produits au début, puis ajouter les facteurs manquants.', 'Revoir régulièrement les carrés (3 × 3, 4 × 4…) qui servent de repères.'],
    source: 'evalCM1Faits', fiche: { gen: 'tablesMultiplication' } },
  { id: 'ma2-fois-10', matiere: 'MA', cycle: 2, objectifs: ['N5.11', 'N5.16', 'N5.20'], niveaux: ['CE1', 'CE2'], sorte: 'fiche', duree: '10 min',
    titre: 'Multiplier par 10, par 100, par des dizaines',
    resume: 'Multiplier par 10, c’est rendre le nombre dix fois plus grand : 54 × 10, c’est 54 dizaines, donc 540. On évite la règle « on ajoute un zéro », qui ne marchera plus avec les décimaux.',
    materiel: ['Un tableau de numération ou un « glisse-nombre ».'],
    deroule: ['Montrer avec le glisse-nombre : chaque chiffre prend une valeur dix fois plus grande.', 'Dire le résultat en dizaines : 54 × 10 = 54 dizaines.', 'Entraînement sur la fiche, puis 6 × 30 = 6 × 3 dizaines = 18 dizaines.'],
    source: 'evalCM1Faits', fiche: { gen: 'fois10' } },
  { id: 'ma2-fois-4-8', matiere: 'MA', cycle: 2, objectifs: ['N5.19'], niveaux: ['CE2'], sorte: 'fiche', duree: '10 min',
    titre: 'Multiplier par 4 ou par 8 avec les doubles',
    resume: 'Multiplier par 4, c’est prendre le double du double ; par 8, c’est prendre le double trois fois. La fiche peut montrer l’étape, puis s’en passer.',
    deroule: ['Faire remarquer que la table de 4 donne les doubles de la table de 2, et la table de 8 les doubles de la table de 4.', 'Écrire la procédure dans le cahier de leçons : 23 × 4 = 23 × 2 × 2 = 92.', 'Fiche avec l’étape écrite, puis sans.'],
    source: 'evalCM1Faits', fiche: { gen: 'procedures' } },
  { id: 'ma2-distributivite', matiere: 'MA', cycle: 2, objectifs: ['N5.15', 'N5.21'], niveaux: ['CE1', 'CE2'], sorte: 'fiche', duree: '10 min',
    titre: 'Décomposer pour multiplier : 13 × 7 = 10 × 7 + 3 × 7',
    resume: 'Calculer le produit d’un nombre à deux chiffres par un nombre à un chiffre en décomposant le plus grand en dizaines et unités.',
    deroule: ['Partir d’une situation : 13 rangées de 7, c’est 10 rangées de 7 et encore 3 rangées de 7.', 'Écrire le calcul en ligne avec les parenthèses.', 'Fiche avec la décomposition écrite, puis sans.'],
    source: 'evalCM1Faits', fiche: { gen: 'distributivite' } },
  { id: 'ma2-multiplications-posees', matiere: 'MA', cycle: 2, objectifs: ['N3.11'], niveaux: ['CE2'], sorte: 'fiche', duree: '15 min',
    titre: 'Multiplications posées',
    resume: 'Poser la multiplication d’un nombre à 2 ou 3 chiffres par un nombre à 1 chiffre, puis à 2 chiffres. On dit à voix haute ce que devient chaque retenue.',
    materiel: ['Matériel de numération pour vérifier (plaques, barres, cubes).'],
    deroule: ['Commencer par un nombre à 2 chiffres multiplié par un nombre à 1 chiffre.', 'Verbaliser : « 4 fois 7 unités font 28 unités : 2 dizaines en retenue, j’écris 8 ».', 'Par un nombre à 2 chiffres : 37 × 14, c’est 37 × 4 plus 37 × 10 ; on écrit le 0 des dizaines (règle des 0).'],
    source: 'evalCM1Poser', fiche: { gen: 'multiplicationsPosees' } },
  { id: 'ma2-problemes-multiplicatifs', matiere: 'MA', cycle: 2, objectifs: ['N3.4', 'N3.10', 'N6.3', 'N6.7', 'N6.9', 'N6.10'], niveaux: ['CP', 'CE1', 'CE2'], sorte: 'fiche', duree: '15 à 20 min',
    titre: 'Problèmes : parts égales, partage, groupements',
    resume: 'Donner du sens à la multiplication et à la division : combien en tout, combien chacun, combien de paquets, fois plus, combien de possibilités.',
    deroule: ['Lire et faire raconter l’histoire, sans les nombres d’abord.', 'Représenter avec des jetons ou des cubes, puis par un dessin ou un schéma en barres.', 'Écrire le calcul et la phrase réponse ; afficher un problème « modèle » de chaque sorte.'],
    variantes: ['Attention au mot « fois » : il ne veut pas toujours dire qu’il faut multiplier (« 3 fois plus que… », quand on cherche la petite quantité).'],
    source: 'evalCM2Problemes', fiche: { gen: 'problemesMult' } },
  { id: 'ma2-table-pythagore', matiere: 'MA', cycle: 2, objectifs: ['N4.3', 'N3.7'], niveaux: ['CE1', 'CE2'], sorte: 'rituel', duree: '5 à 10 min',
    titre: 'La table de Pythagore : ce que je sais déjà',
    resume: 'Chaque élève entoure sur sa table de Pythagore les produits qu’il connaît : il voit ce qui lui reste à apprendre. Comme 7 × 2 = 2 × 7, il n’y a que la moitié de la table à retenir.',
    materiel: ['Une table de Pythagore par élève, des crayons de couleur.'],
    deroule: ['Faire remarquer la symétrie de la table : 7 × 2 et 2 × 7 donnent le même résultat.', 'Chacun entoure ce qu’il sait ; on refait le point chaque semaine.', 'Ordre conseillé : 2, puis 4 et 8, puis 3 et 6, les carrés, puis les résultats difficiles (6 × 7, 6 × 8, 7 × 8).'],
    variantes: ['Table de 9 : le chiffre des dizaines avance de 1, celui des unités recule de 1 (18, 27, 36…).'],
    source: 'evalCM1Faits' },
  { id: 'ma2-glisse-nombre', matiere: 'MA', cycle: 2, objectifs: ['N5.11', 'N5.16', 'N1.11'], niveaux: ['CE1', 'CE2'], sorte: 'seance', duree: '30 min',
    titre: 'Le glisse-nombre pour comprendre × 10 et × 100',
    resume: 'Avec un glisse-nombre, on voit chaque chiffre « glisser » d’un rang quand on multiplie par 10 : le nombre devient dix fois plus grand.',
    materiel: ['Un glisse-nombre (bande avec les rangs : milliers, centaines, dizaines, unités) et des étiquettes chiffres.'],
    deroule: ['Placer 54 ; multiplier par 10 : les chiffres glissent d’un rang vers la gauche, on lit 540.', 'Faire dire : 54 × 10, c’est 54 dizaines.', 'Recommencer avec × 100 ; noter la règle dans le cahier sans parler « d’ajouter un zéro ».'],
    source: 'evalCM1Faits' },
  // Mathématiques, cycle 2 — numération
  { id: 'ma2-dictee-nombres', matiere: 'MA', cycle: 2, objectifs: ['N1.6', 'N1.7', 'N1.8'], niveaux: ['CP', 'CE1', 'CE2'], sorte: 'fiche', duree: '10 min',
    titre: 'Dictée de nombres',
    resume: 'L’enseignant dicte, l’élève écrit en chiffres. Le carnet choisit beaucoup de nombres difficiles (de 70 à 99, avec des zéros) ; les nombres à dicter sont sur la page du corrigé.',
    deroule: ['Dicter chaque nombre en entier ; l’élève attend la fin du mot-nombre avant d’écrire (« soixante… dix-neuf », c’est 79 et pas 69).', 'Corriger aussitôt en décomposant : soixante-douze, c’est 60 + 12.', 'Garder une trace des erreurs pour cibler la prochaine dictée.'],
    variantes: ['Une semaine sur les seuls nombres de 60 à 79, puis de 80 à 99.', 'Vérifier aussi la forme des chiffres (3 et 5, 3 et 8, 6 et 9, le 7 barré).'],
    source: 'evalCE2Ecrire', fiche: { gen: 'dicteeNombres' } },
  { id: 'ma2-lettres-chiffres', matiere: 'MA', cycle: 2, objectifs: ['N1.6', 'N1.7', 'N1.8', 'N1.9'], niveaux: ['CP', 'CE1', 'CE2'], sorte: 'fiche', duree: '10 à 15 min',
    titre: 'Des lettres aux chiffres, des chiffres aux lettres',
    resume: 'Passer de l’écriture en lettres à l’écriture en chiffres, et inversement. Le carnet écrit les nombres en lettres lui-même, avec les traits d’union.',
    deroule: ['Rappeler les mots à connaître : de un à seize, puis vingt, trente… soixante.', 'Montrer la régularité : après soixante, on reprend de un à dix-neuf jusqu’à quatre-vingts, puis jusqu’à cent.', 'Fiche « en chiffres », puis « en lettres ».'],
    source: 'evalCE2Ecrire', fiche: { gen: 'lettresChiffres' } },
  { id: 'ma2-unites-numeration', matiere: 'MA', cycle: 2, objectifs: ['N1.4', 'N1.5', 'N1.9', 'N1.10', 'N1.11'], niveaux: ['CP', 'CE1', 'CE2'], sorte: 'fiche', duree: '15 min',
    titre: 'Unités, dizaines, centaines : décomposer et recomposer',
    resume: 'Écrire un même nombre de plusieurs façons : 475 = 4 centaines + 7 dizaines + 5 unités = 400 + 70 + 5. Unités dans le désordre, absentes (il faut un 0) ou plus de 9 (il faut échanger).',
    deroule: ['Dénombrer en groupant par 10, puis par 100 (cubes, barres, plaques) ; le tableau de numération, pas de façon systématique.', 'Unités dans le désordre (7 dizaines + 3 centaines + 2 unités), rangs vides (3 centaines + 2 unités).', 'Plus de 9 d’une unité (15 dizaines + 5 centaines + 15 unités) : on fait les échanges.'],
    source: 'evalCE2Decomposition', fiche: { gen: 'unitesNumeration' } },
  { id: 'ma2-comparer-nombres', matiere: 'MA', cycle: 2, objectifs: ['N1.12', 'N1.13', 'N1.14'], niveaux: ['CP', 'CE1', 'CE2'], sorte: 'fiche', duree: '10 à 15 min',
    titre: 'Comparer, encadrer, ranger des nombres',
    resume: 'Comparer grâce à l’écriture chiffrée : 71 > 68, car 7 dizaines c’est plus que 6 dizaines. Aussi avec des écritures différentes : 5d 1u et 4d 12u.',
    deroule: ['Faire justifier par le sens des chiffres, pas par une règle apprise par cœur.', 'Comparer des écritures différentes (5d 17u et 6d) : vérifier avec le matériel si besoin.', 'Puis encadrer à la dizaine ou à la centaine, et ranger.'],
    source: 'guideCP', fiche: { gen: 'comparerNombres' } },
  { id: 'ma2-suites-nombres', matiere: 'MA', cycle: 2, objectifs: ['N1.6', 'N1.7', 'N1.8'], niveaux: ['CP', 'CE1', 'CE2'], sorte: 'fiche', duree: '10 min',
    titre: 'Suites de nombres à compléter',
    resume: 'Trouver la règle d’une suite (de 10 en 10, de 5 en 5, de 100 en 100…) et compléter les nombres qui manquent, en avançant ou en reculant.',
    deroule: ['Commencer à l’oral par un furet de 10 en 10 qui ne part pas d’une dizaine : 12, 22, 32… 92.', 'Écrire chaque nombre sur l’ardoise.', 'Fiche : trouver la règle avant de compléter.'],
    source: 'evalCE2Ecrire', fiche: { gen: 'suitesNombres' } },
  { id: 'ma2-droite-graduee', matiere: 'MA', cycle: 2, objectifs: ['N1.15', 'N1.16'], niveaux: ['CP', 'CE1', 'CE2'], sorte: 'fiche', duree: '15 min',
    titre: 'La demi-droite graduée',
    resume: 'Lire les nombres marqués par des lettres, ou placer des nombres, sur une demi-droite qui ne commence pas toujours à 0. Il faut d’abord trouver de combien on avance à chaque graduation.',
    deroule: ['Apprendre le vocabulaire : graduation, intervalle, nombres écrits (repères).', 'Chercher la valeur d’un intervalle avant de lire ou de placer.', 'Activité courte et régulière, avec un retour immédiat.'],
    source: 'evalCE2Droite', fiche: { gen: 'droiteGraduee' } },
  { id: 'ma2-chateau-nombres', matiere: 'MA', cycle: 2, objectifs: ['N1.6', 'N1.7'], niveaux: ['CP', 'CE1'], sorte: 'rituel', duree: '5 à 10 min',
    titre: 'Le château des nombres : les nombres cachés',
    resume: 'Un tableau des nombres de 10 en 10 par ligne (de 100 à 199 par exemple) ; on cache quelques cases et les élèves retrouvent les nombres cachés.',
    materiel: ['Un tableau de nombres affiché (10 colonnes), des papiers repositionnables pour cacher des cases.'],
    deroule: ['Cacher 5 à 8 cases.', 'Chacun écrit sur l’ardoise les nombres cachés, en chiffres puis en lettres.', 'Faire dire comment on a trouvé : la ligne donne les dizaines, la colonne les unités.'],
    source: 'evalCE2Ecrire' },
  { id: 'ma2-etiquettes-chiffres', matiere: 'MA', cycle: 2, objectifs: ['N1.10', 'N1.11', 'N1.7'], niveaux: ['CE1', 'CE2'], sorte: 'rituel', duree: '5 min',
    titre: 'Trois chiffres, combien de nombres ?',
    resume: 'Avec trois étiquettes (par exemple 3, 7 et 0), dire à voix haute tous les nombres qu’on peut former : trois-cent-soixante-dix, trois-cent-sept, trente-sept…',
    materiel: ['Des étiquettes chiffres.'],
    deroule: ['Montrer trois étiquettes.', 'Les élèves forment et lisent tous les nombres possibles ; on les écrit au tableau.', 'Les ranger du plus petit au plus grand.'],
    source: 'evalCE2Ecrire' },
  { id: 'ma2-fleur-nombres', matiere: 'MA', cycle: 2, objectifs: ['N1.9', 'N1.4', 'N1.5'], niveaux: ['CE1', 'CE2'], sorte: 'rituel', duree: '15 min, chaque jour',
    titre: 'La fleur des nombres',
    resume: 'Au cœur de la fleur, un nombre (142) ; sur les pétales, toutes ses écritures : 1 centaine 4 dizaines 2 unités, 14 dizaines 2 unités, 100 + 40 + 2, cent-quarante-deux…',
    deroule: ['Écrire le nombre au centre.', 'Chacun propose une écriture pour un pétale ; la classe vérifie.', 'Garder la fleur affichée ; changer de nombre chaque jour.'],
    source: 'evalCE2Decomposition' },
  { id: 'ma2-jeu-banquier', matiere: 'MA', cycle: 2, objectifs: ['N1.4', 'N1.5'], niveaux: ['CE1', 'CE2'], sorte: 'jeu', duree: '20 min, à 3 ou 4',
    titre: 'Le jeu du banquier : échanger 10 contre 1',
    resume: 'Les joueurs gagnent des jetons et doivent échanger 10 jetons d’une couleur contre 1 jeton de la couleur suivante. On découvre qu’on peut gagner avec moins de jetons : c’est la valeur qui compte.',
    materiel: ['Des jetons de trois couleurs (unités, dizaines, centaines), un dé, une banque.'],
    deroule: ['Chacun lance le dé et prend autant de jetons « unités ».', 'Dès qu’il a 10 jetons d’une couleur, il les échange à la banque contre 1 jeton de la couleur suivante.', 'À la fin, on compare : qui a le plus ? On écrit chaque total en chiffres.'],
    source: 'evalCE2Decomposition' },
  { id: 'ma2-commandes', matiere: 'MA', cycle: 2, objectifs: ['N1.3', 'N1.4', 'N1.5'], niveaux: ['CE1', 'CE2'], sorte: 'seance', duree: '30 à 45 min',
    titre: 'Passer commande au marchand',
    resume: 'Commander exactement 837 objets à un marchand qui ne vend que des boîtes de 10 et des objets seuls : il faut utiliser 10 dizaines = 1 centaine.',
    materiel: ['Des bons de commande ; du matériel de numération pour vérifier.'],
    deroule: ['Annoncer le stock du marchand (par exemple : seulement des dizaines et des unités).', 'Chacun remplit son bon de commande.', 'Mise en commun : 837, c’est 83 dizaines et 7 unités.', 'Changer le stock pour faire varier les échanges.'],
    source: 'evalCE2Decomposition' },
  { id: 'ma2-corde-nombres', matiere: 'MA', cycle: 2, objectifs: ['N1.15', 'N1.16', 'N1.12'], niveaux: ['CP', 'CE1', 'CE2'], sorte: 'seance', duree: '20 à 30 min',
    titre: 'La corde à nombres',
    resume: 'Une corde tendue, bornée par deux nombres (100 et 200) : les élèves y accrochent des étiquettes (115, 180, 155…) en justifiant leur place.',
    materiel: ['Une corde, des pinces à linge, des étiquettes nombres.'],
    deroule: ['Placer les bornes, puis faire accrocher les étiquettes une par une en justifiant.', 'Défi : avec les chiffres 1, 2, 3 et 4, trouver le nombre le plus proche de 28.', 'Jeu du nombre secret : « mon nombre est entre… et… », on répond « plus grand » ou « plus petit ».'],
    variantes: ['Changer les bornes avec les mêmes étiquettes.', 'Placer à peu près des nombres sur une ligne sans graduation (de 0 à 100).'],
    source: 'evalCE2Droite' },
  { id: 'ma2-comparer-sans-voir', matiere: 'MA', cycle: 2, objectifs: ['N1.12', 'N1.10'], niveaux: ['CP'], sorte: 'seance', duree: '45 min',
    titre: 'Comparer deux collections qu’on ne voit pas en même temps',
    resume: 'Deux groupes ont chacun une feuille couverte de ronds (71 et 68). Pour savoir qui en a le plus sans se montrer les feuilles, il faut écrire le nombre en chiffres et comparer les dizaines.',
    materiel: ['Deux feuilles de ronds (rouges et bleus), du matériel de numération pour valider.'],
    deroule: ['Chaque groupe écrit en chiffres le nombre de ronds de sa feuille, en groupant par dizaines.', 'Au tableau, comparer 71 et 68 : 7 dizaines, c’est plus que 6 dizaines.', 'Valider en montrant les deux collections.', 'Trace écrite : « 71 > 68, car dans 71 il y a 7 dizaines, et dans 68 seulement 6. »'],
    source: 'guideCP' },
  { id: 'ma2-nombre-mystere', matiere: 'MA', cycle: 2, objectifs: ['N1.9', 'N1.10', 'N1.11'], niveaux: ['CP', 'CE1', 'CE2'], sorte: 'jeu', duree: '5 à 15 min, à 2',
    titre: 'Le nombre mystère : cartes chiffres et cartes unités',
    resume: 'On tire des cartes « nombre » et des cartes « unités de numération » (unités, dizaines…) ; ensemble, on écrit le nombre obtenu en chiffres. Les unités arrivent dans le désordre, parfois plus de 10, parfois une unité manque : il faut un 0.',
    materiel: ['Des cartes nombres (0 à 4, puis 0 à 8), des cartes unités, dizaines (puis centaines), un tableau à colonnes.'],
    deroule: ['Faire 3 à 5 tirages (par exemple : 7 unités, 4 dizaines, 5 unités).', 'Les deux joueurs cherchent ensemble le nombre en chiffres (49).', 'Valider avec le matériel ; faire le bilan sur les échanges (10 unités = 1 dizaine).'],
    source: 'guideCP' },
  { id: 'ma2-jeu-piste', matiere: 'MA', cycle: 2, objectifs: ['N1.6', 'N5.5'], niveaux: ['CP'], sorte: 'jeu', duree: '10 min, à 2 ou 4',
    titre: 'Le jeu de piste : où va arriver mon pion ?',
    resume: 'Sur une piste où seuls quelques numéros de cases sont écrits, chacun lance deux dés et doit annoncer la case d’arrivée avant de déplacer son pion.',
    materiel: ['Une piste numérotée en partie, deux dés, une feuille de scores.'],
    deroule: ['Lancer les dés, écrire le résultat et la case d’arrivée prévue.', 'Déplacer le pion pour vérifier (on ne compte pas la case de départ).', 'Après trois lancers, gagne celui qui est allé le plus loin et a bien écrit ses cases.'],
    source: 'guideCP' },
  { id: 'ma2-saladier', matiere: 'MA', cycle: 2, objectifs: ['N4.1', 'N5.4'], niveaux: ['CP'], sorte: 'jeu', duree: '5 à 10 min, à 2',
    titre: 'Le jeu du saladier',
    resume: 'Un élève cache une partie des jetons sous un saladier ; l’autre doit dire combien sont cachés et expliquer comment il le sait. Pour les décompositions et les compléments à 10.',
    materiel: ['Des jetons, un petit saladier ou un gobelet opaque, une feuille de score.'],
    deroule: ['Annoncer le nombre de jetons (par exemple 7).', 'A ferme les yeux, B cache une partie des jetons.', 'A dit combien sont cachés et explique (« je sais que 4 et 3 font 7 ») ; B soulève le saladier pour vérifier.', 'On change les rôles ; un point par bonne réponse bien expliquée.'],
    variantes: ['Travailler longtemps sur un seul nombre (5 ou 10), puis faire varier.'],
    source: 'guideCP' },
  // Mathématiques, cycle 2 — fractions (v1.67)
  { id: 'ma2-fractions-figures', matiere: 'MA', cycle: 2, objectifs: ['N2.1', 'N2.2'], niveaux: ['CE1', 'CE2'], sorte: 'fiche', duree: '15 min',
    titre: 'Fractions d’une figure : écrire, colorier',
    resume: 'Des bandes, des disques, des rectangles quadrillés partagés en parts égales : écrire la fraction coloriée, ou colorier la fraction demandée. Les parts coloriées ne sont pas toujours côte à côte.',
    materiel: ['Des figures découpées (carrés, rectangles, disques) pour plier avant de passer à la fiche.'],
    deroule: ['Rappeler : un huitième du tout, c’est une part quand le tout est partagé en huit parts égales.', 'Faire lire chaque fraction à voix haute : « trois huitièmes », jamais « trois sur huit ».', 'Fiche : d’abord les fractions de numérateur 1, puis les autres.'],
    variantes: ['Montrer qu’une même fraction peut être coloriée de plusieurs façons (le rectangle quadrillé).', 'Le mot « tiers » contient un t comme « trois », « cinquième » fait entendre « cinq ».'],
    source: 'livretCE1Fractions', fiche: { gen: 'fractionsFigures' } },
  { id: 'ma2-fractions-lettres', matiere: 'MA', cycle: 2, objectifs: ['N2.1', 'N2.2'], niveaux: ['CE1', 'CE2'], sorte: 'fiche', duree: '10 min',
    titre: 'Lire et écrire les fractions : un demi, trois quarts…',
    resume: 'Passer de « trois huitièmes » à 3/8, et inversement. Le carnet écrit les fractions en lettres lui-même.',
    deroule: ['Montrer comment s’écrit une fraction « en chiffres », sans commentaire, puis la relire : « un cinquième ».', 'Demander « comment se lit cette fraction ? » plutôt que « comment s’écrit-elle ? ».', 'Fiche « en chiffres », puis « en lettres ».'],
    variantes: ['Pour éviter l’inversion des deux nombres : le nombre de parts égales du tout s’écrit en bas.'],
    source: 'livretCE1Fractions', fiche: { gen: 'fractionsLettres' } },
  { id: 'ma2-comparer-fractions', matiere: 'MA', cycle: 2, objectifs: ['N2.3', 'N2.4', 'N2.8'], niveaux: ['CE1', 'CE2'], sorte: 'fiche', duree: '10 à 15 min',
    titre: 'Comparer des fractions',
    resume: 'Même dénominateur : on compare le nombre de parts. Numérateur 1 : plus il y a de parts, plus elles sont petites (1/6 < 1/3, ce qui surprend car 6 > 3). Au CE2, aussi le même numérateur et un dénominateur multiple de l’autre.',
    materiel: ['Des bandes de papier de même longueur, pliées en 2, 3, 4, 6, 8.'],
    deroule: ['Comparer d’abord avec les bandes posées l’une sous l’autre.', 'Faire justifier par les parts : « un cinquième, c’est plus petit qu’un tiers, car le tout est partagé en plus de parts ».', 'Fiche, puis correction en disant la justification.'],
    source: 'fractionsCE1CM2', fiche: { gen: 'comparerFractions' } },
  { id: 'ma2-calcul-fractions', matiere: 'MA', cycle: 2, objectifs: ['N2.5', 'N2.9'], niveaux: ['CE1', 'CE2'], sorte: 'fiche', duree: '10 à 15 min',
    titre: 'Ajouter et retirer des fractions',
    resume: 'Additionner et soustraire en comptant les parts : « un cinquième plus deux cinquièmes, cela fait trois cinquièmes du tout ». Compléter jusqu’à 1. Au CE2, aussi quand un dénominateur est multiple de l’autre (3/4 + 1/8).',
    deroule: ['Manipuler, puis verbaliser : « deux tiers du tout moins un tiers du tout, cela fait un tiers du tout ».', 'Faire le lien avec 2/5 + 3/5 = 5/5 = 1 : le tout.', 'Fiche ; le corrigé donne une fraction, une fraction égale est juste aussi.'],
    source: 'fractionsCE1CM2', fiche: { gen: 'calculFractions' } },
  { id: 'ma2-egalites-fractions', matiere: 'MA', cycle: 2, objectifs: ['N2.6'], niveaux: ['CE2'], sorte: 'fiche', duree: '10 min',
    titre: 'Des fractions égales : 1/2 = 2/4 = 4/8',
    resume: 'Trouver le numérateur qui manque : 3/4 = …/8. « Si je fais des parts deux fois plus petites et que j’en prends deux fois plus, je prends la même quantité. »',
    materiel: ['Une bande-unité pliée en 2, puis en 4, puis en 8.'],
    deroule: ['Plier et colorier : six huitièmes et trois quarts couvrent la même longueur.', 'Faire dire la phrase « parts deux fois plus petites, deux fois plus de parts ».', 'Fiche : numérateur manquant.'],
    source: 'fractionsCE1CM2', fiche: { gen: 'egalitesFractions' } },
  { id: 'ma2-bande-unite', matiere: 'MA', cycle: 2, objectifs: ['N2.7', 'N2.8'], niveaux: ['CE2'], sorte: 'fiche', duree: '15 min',
    titre: 'Mesurer avec une bande-unité graduée en fractions',
    resume: 'Quand les entiers ne suffisent plus, on mesure en fractions d’unité : « deux unités et un quart d’unité ». La fiche montre des règles graduées en demis, en quarts ou en dixièmes d’unité.',
    materiel: ['Une bande de papier choisie comme unité, à plier en quarts ; une bande quadrillée pour les dixièmes.'],
    deroule: ['Construire la règle en quarts par pliage, puis celle en dixièmes sur un quadrillage.', 'Mesurer des bandes de la classe et dire le résultat : « trois quarts d’unité », « entre sept et huit dixièmes d’unité ».', 'Fiche : lire et placer des fractions sur la règle graduée.'],
    source: 'fractionsCE1CM2', fiche: { gen: 'droiteFractions' } },
  { id: 'ma2-problemes-fractions', matiere: 'MA', cycle: 2, objectifs: ['N2.2', 'N2.5', 'N2.9'], niveaux: ['CE1', 'CE2'], sorte: 'fiche', duree: '15 à 20 min',
    titre: 'Petits problèmes de fractions',
    resume: 'Des situations proches de la vie : un gâteau partagé, une figure coloriée en deux couleurs. Quelle fraction reste-t-il ?',
    deroule: ['Lire l’énoncé, faire dessiner le tout et les parts.', 'Chercher à deux, puis mettre en commun en disant les fractions en mots.', 'Garder une trace du problème résolu dans le cahier.'],
    source: 'fractionsCE1CM2', fiche: { gen: 'problemesFractions' } },
  { id: 'ma2-memory-fractions', matiere: 'MA', cycle: 2, objectifs: ['N2.1', 'N2.2'], niveaux: ['CE1'], sorte: 'jeu', duree: '3 × 15 min, à 2 ou 3',
    titre: 'Le memory des fractions',
    resume: 'Les élèves fabriquent eux-mêmes les cartes : une carte « fraction en lettres » (un demi, un quart, un huitième…) et une carte « image » (une forme pliée, une part coloriée). Puis on joue à reformer les paires.',
    materiel: ['Des cartes vierges, des carrés, rectangles, disques et demi-disques découpés, des crayons de couleur.'],
    deroule: ['Au tableau, fabriquer ensemble la paire « un quart » : plier un carré en quatre parts égales, colorier une part.', 'Chacun fabrique ses quatre paires, avec une forme différente de celle de son voisin.', 'Jouer d’abord cartes visibles, puis cachées (règle du memory) en nommant chaque fraction.', 'Plus tard, ajouter des cartes avec l’écriture en chiffres (1/8).'],
    variantes: ['Comparer les cartes de deux élèves : un demi d’un disque et un demi d’un demi-disque ne sont pas la même surface ; une fraction se lit par rapport à son tout.'],
    source: 'livretCE1Fractions' },
  { id: 'ma2-repertoire-bandes', matiere: 'MA', cycle: 2, objectifs: ['N2.1', 'N2.4'], niveaux: ['CE1'], sorte: 'seance', duree: '45 min',
    titre: 'Le répertoire des fractions avec des bandes',
    resume: 'Chacun plie des bandes de même longueur en 2, 4, 8, puis 3 et 6, enfin 5 et 10 parts égales, et colle sur une page de son cahier un exemplaire de chaque fraction unitaire.',
    materiel: ['Des bandes de papier de même longueur ; des bandes déjà tracées en 3 et en 5 parts (le pliage serait trop imprécis).'],
    deroule: ['Plier, colorier une part, écrire en lettres : un demi, un quart, un huitième.', 'Pour un sixième : partager chaque tiers en deux. Pour un dixième : partager chaque cinquième en deux.', 'Ranger les bandes de la plus grande part à la plus petite : plus il y a de parts, plus elles sont petites.'],
    source: 'livretCE1Fractions' },
  { id: 'ma2-problemes-partage', matiere: 'MA', cycle: 2, objectifs: ['N2.1', 'N2.2'], niveaux: ['CE1', 'CE2'], sorte: 'rituel', duree: '10 à 15 min',
    titre: 'Un problème de partage pour réfléchir',
    resume: 'De courts problèmes à discuter à deux : deux élèves ont bu la moitié de leur gourde, pourtant il reste plus d’eau à l’un ; un gâteau coupé en trois parts inégales donne-t-il des tiers ?',
    deroule: ['Lire le problème, laisser chercher à deux avec un dessin.', 'Mettre en commun : on cherche le tout et on vérifie que les parts sont égales.', 'Écrire une phrase de conclusion dans le cahier.'],
    source: 'livretCE1Fractions' },

  // Mathématiques, cycle 3
  { id: 'ma3-presque-dizaine', matiere: 'MA', cycle: 3, objectifs: ['N6.1', 'N6.2'], niveaux: ['CM1', 'CM2'], sorte: 'fiche', duree: '10 min',
    titre: 'Ajouter ou soustraire 8, 9, 18, 19, 28, 29…',
    resume: 'Entretenir la procédure « j’ajoute la dizaine suivante puis je corrige » : + 19, c’est + 20 – 1 ; + 28, c’est + 30 – 2.',
    deroule: ['Rappeler la procédure et l’écrire en ligne : 356 + 29 = 356 + 30 – 1 = 385.', 'Fiche avec l’étape écrite, puis sans.', 'Calcul mental oral à l’ardoise pour finir.'],
    source: 'evalCM1Faits', fiche: { gen: 'presqueDizaine' } },
  { id: 'ma3-posees-decimaux', matiere: 'MA', cycle: 3, objectifs: ['N7.4'], niveaux: ['CM1', 'CM2'], sorte: 'fiche', duree: '15 min',
    titre: 'Additions et soustractions posées de nombres décimaux',
    resume: 'Poser en alignant les virgules (les dixièmes sous les dixièmes), puis calculer comme avec les entiers.',
    deroule: ['Rappeler le sens des rangs : unités, dixièmes, centièmes.', 'Commencer par des nombres ayant autant de chiffres après la virgule.', 'Estimer le résultat avant de poser, puis vérifier.'],
    source: 'evalCM1Poser', fiche: { gen: 'posees', options: { op: '+', decimales: '1' } } },
  { id: 'ma3-problemes-additifs', matiere: 'MA', cycle: 3, objectifs: ['N8.1', 'N8.2', 'N8.3'], niveaux: ['CM1', 'CM2'], sorte: 'fiche', duree: '20 min',
    titre: 'Problèmes additifs en une ou plusieurs étapes',
    resume: 'Parties-tout, comparaison, puis problèmes en deux étapes, avec de grands nombres.',
    deroule: ['Représenter le problème par un schéma en barres avant de calculer.', 'Écrire le calcul en ligne et la phrase réponse.', 'Comparer les schémas de plusieurs élèves.'],
    source: 'evalCM2Problemes', fiche: { gen: 'problemes' } },
  // Mathématiques, cycle 3 — multiplication et division
  { id: 'ma3-tables-multiplication', matiere: 'MA', cycle: 3, objectifs: ['N4.1'], niveaux: ['CM1', 'CM2'], sorte: 'fiche', duree: '5 à 10 min, chaque jour',
    titre: 'Tables de multiplication : les entretenir',
    resume: 'Trois sortes de questions : 6 × 7 = …, 6 × … = 42, « dans 42, combien de fois 6 ? ». Indispensable pour poser des divisions.',
    deroule: ['Repérer, sur la table de Pythagore, ce que chaque élève sait déjà.', 'Travailler par familles : 2 / 4 / 8, puis 3 / 6, les carrés, et 7 × 8, 6 × 7…', 'Fiche courte en temps limité, chaque jour.'],
    source: 'evalCM1Faits', fiche: { gen: 'tablesMultiplication' } },
  { id: 'ma3-fois-10-100-1000', matiere: 'MA', cycle: 3, objectifs: ['N5.4', 'N6.4', 'N6.5'], niveaux: ['CM1', 'CM2'], sorte: 'fiche', duree: '10 min',
    titre: 'Multiplier par 10, 100, 1 000 et par des dizaines',
    resume: 'Multiplier par 10, c’est rendre le nombre dix fois plus grand (54 × 10 = 54 dizaines = 540). Puis : 6 × 300, 30 × 400.',
    deroule: ['Revoir le sens avec le glisse-nombre.', 'Éviter la règle « on ajoute un zéro » : elle ne marche pas avec les nombres décimaux.', 'Entraînement sur la fiche.'],
    source: 'evalCM1Faits', fiche: { gen: 'fois10' } },
  { id: 'ma3-fois-4-8-5', matiere: 'MA', cycle: 3, objectifs: ['N6.6'], niveaux: ['CM1'], sorte: 'fiche', duree: '10 min',
    titre: 'Multiplier par 4, par 8 ou par 5',
    resume: 'Par 4 : le double du double. Par 8 : le double, trois fois. Par 5 : multiplier par 10, puis prendre la moitié.',
    deroule: ['Construire chaque procédure et l’écrire dans le cahier de leçons.', 'Fiche avec l’étape écrite, puis sans.', 'Comparer les procédures à l’oral.'],
    source: 'evalCM1Faits', fiche: { gen: 'procedures' } },
  { id: 'ma3-distributivite', matiere: 'MA', cycle: 3, objectifs: ['N6.7'], niveaux: ['CM1', 'CM2'], sorte: 'fiche', duree: '10 min',
    titre: 'Décomposer pour multiplier (distributivité)',
    resume: 'Calculer 37 × 6 en décomposant : (30 × 6) + (7 × 6). C’est aussi ce qui explique la multiplication posée.',
    deroule: ['Écrire la décomposition en ligne avec les parenthèses.', 'Faire le lien avec la multiplication posée : 37 × 14 = 37 × 4 + 37 × 10.', 'Fiche avec l’étape, puis sans.'],
    source: 'evalCM1Faits', fiche: { gen: 'distributivite' } },
  { id: 'ma3-multiplications-posees', matiere: 'MA', cycle: 3, objectifs: ['N7.5', 'N7.6', 'N7.7'], niveaux: ['CM1', 'CM2'], sorte: 'fiche', duree: '15 min',
    titre: 'Multiplications posées (entiers et décimaux)',
    resume: 'Poser la multiplication de deux entiers, puis d’un décimal par un entier. Le corrigé montre les produits partiels (règle des 0).',
    deroule: ['Verbaliser la gestion des retenues : « 4 fois 3 dizaines font 12 dizaines, plus les 2 dizaines de retenue… ».', 'Multiplier par un nombre à 2 chiffres : 37 × 4, puis 37 × 10 (on écrit le 0), puis on additionne.', 'Estimer l’ordre de grandeur avant de poser.'],
    source: 'evalCM1Poser', fiche: { gen: 'multiplicationsPosees' } },
  { id: 'ma3-divisions-posees', matiere: 'MA', cycle: 3, objectifs: ['N7.8'], niveaux: ['CM1', 'CM2'], sorte: 'fiche', duree: '20 min',
    titre: 'Divisions posées (diviseur à un chiffre)',
    resume: 'Poser la division euclidienne en potence, écrire l’égalité (72 = 3 × 24 + 0) et vérifier par la multiplication.',
    materiel: ['Matériel de numération pour les premières divisions.'],
    deroule: ['Partir d’un partage : 471 bonbons entre 3 enfants, le plus possible chacun, le moins possible de reste.', 'Commencer par les centaines, puis les dizaines, puis les unités, en échangeant ce qui reste.', 'Écrire l’égalité et vérifier par la multiplication.'],
    variantes: ['Donner des divisions « à trous » à compléter (quelques chiffres déjà écrits).'],
    source: 'evalCM2Poser', fiche: { gen: 'divisionPotence' } },
  { id: 'ma3-division-de-tete', matiere: 'MA', cycle: 3, objectifs: ['N7.8', 'N4.1'], niveaux: ['CM1', 'CM2'], sorte: 'fiche', duree: '5 à 10 min',
    titre: 'Divisions de tête : 17 = 4 × … + …',
    resume: 'Un rituel court en même temps que la division posée : trouver le plus grand nombre de fois, puis le reste (plus petit que le diviseur).',
    deroule: ['Exemple au tableau : 17 = 4 × 4 + 1.', 'Fiche en temps limité.', 'Correction : vérifier que le reste est plus petit que le diviseur.'],
    source: 'evalCM2Poser', fiche: { gen: 'divisionEnLigne' } },
  { id: 'ma3-vraisemblance', matiere: 'MA', cycle: 3, objectifs: ['N7.1'], niveaux: ['CM1', 'CM2'], sorte: 'fiche', duree: '10 min',
    titre: 'Trouve le bon résultat sans poser',
    resume: 'Trois résultats proposés, un seul est possible : on le trouve en arrondissant les nombres pour estimer l’ordre de grandeur.',
    deroule: ['Exemple : 124 – 88, c’est environ 120 – 90 = 30 ; 212 est impossible, car plus grand que 124.', 'Chacun choisit et justifie à l’oral.', 'Vérifier avec l’opération inverse (une addition pour une soustraction).'],
    source: 'evalCM1Poser', fiche: { gen: 'vraisemblance' } },
  { id: 'ma3-problemes-multiplicatifs', matiere: 'MA', cycle: 3, objectifs: ['N8.4', 'N8.5', 'N8.6'], niveaux: ['CM1', 'CM2'], sorte: 'fiche', duree: '20 min',
    titre: 'Problèmes multiplicatifs et de division',
    resume: 'Parts égales, partage, groupements avec reste, comparaison (« fois plus », « fois moins »), possibilités, problèmes en deux étapes.',
    deroule: ['Faire reformuler l’énoncé sans les nombres, puis avec.', 'Modéliser par un schéma en barres.', 'Écrire le calcul, vérifier l’ordre de grandeur, répondre par une phrase.'],
    variantes: ['« Chloé a 24 cartes, 3 fois plus que de figurines » : ici, le mot « fois » demande une division.'],
    source: 'evalCM2Problemes', fiche: { gen: 'problemesMult' } },
  { id: 'ma3-partage-materiel', matiere: 'MA', cycle: 3, objectifs: ['N7.8'], niveaux: ['CM1'], sorte: 'seance', duree: '45 min',
    titre: 'Partager avec le matériel avant de poser la division',
    resume: 'Partager 471 bonbons entre 3 enfants avec le matériel de numération : on comprend pourquoi la division commence par les centaines.',
    materiel: ['Matériel de numération (plaques de cent, barres de dix, cubes) par groupe.'],
    deroule: ['Consigne : chacun doit avoir la même part, la plus grande possible ; il doit rester le moins possible.', 'Les groupes partagent ; quand une plaque ne se partage pas, on l’échange contre 10 barres.', 'Mise en commun : relier chaque échange à une étape de la division posée.', 'Trace écrite : la division posée, les mots dividende, diviseur, quotient, reste, et l’égalité.'],
    source: 'evalCM2Poser' },
  { id: 'ma3-fois-plus', matiere: 'MA', cycle: 3, objectifs: ['N8.5'], niveaux: ['CM1', 'CM2'], sorte: 'seance', duree: '45 min',
    titre: 'Problèmes « fois plus », « fois moins » : une séance explicite',
    resume: 'Enseigner un type de problème à la fois : comparer deux quantités avec « fois plus » ou « fois moins », et ne pas multiplier dès qu’on lit « fois ».',
    materiel: ['Réglettes ou cubes, puis schéma en barres.'],
    deroule: ['Problème modèle : Fatou a lu 240 pages, Karima 120 ; Fatou a lu 2 fois plus de pages que Karima.', 'Représenter avec des barres de longueurs différentes.', 'Cas « piège » : on connaît la grande quantité et on cherche la petite.', 'Afficher le problème modèle ; les suivants se résolvent « comme celui-là ».'],
    source: 'evalCM2Problemes' },
  { id: 'ma3-facons-nombre', matiere: 'MA', cycle: 3, objectifs: ['N1.13', 'N1.14', 'N1.15'], niveaux: ['CM1', 'CM2'], sorte: 'rituel', duree: '5 min',
    titre: 'Toutes les façons de faire un nombre',
    resume: 'Rituel : écrire toutes les façons d’obtenir un nombre par une multiplication (12 = 3 × 4 = 2 × 6 = 1 × 12). On découvre multiples et diviseurs.',
    materiel: ['Ardoises ; une affiche pour garder les décompositions trouvées.'],
    deroule: ['Annoncer un nombre (12, 24, 36…).', 'Chacun écrit le plus de produits possibles.', 'Mise en commun : ranger les produits, repérer les diviseurs du nombre.'],
    source: 'evalCM1Faits' },
  // Mathématiques, cycle 3 — numération
  { id: 'ma3-dictee-nombres', matiere: 'MA', cycle: 3, objectifs: ['N1.4', 'N1.5'], niveaux: ['CM1', 'CM2'], sorte: 'fiche', duree: '10 min',
    titre: 'Dictée de grands nombres',
    resume: 'L’enseignant dicte, l’élève écrit en chiffres. Beaucoup de nombres difficiles (70 à 99, zéros intercalés) ; les nombres à dicter sont sur la page du corrigé.',
    deroule: ['Dicter le nombre en entier ; l’élève attend la fin avant d’écrire.', 'Corriger en s’appuyant sur les classes (mille, unités simples) et sur la décomposition.', 'Plus le nom du nombre est long, plus il y a d’erreurs : s’entraîner souvent, peu à la fois.'],
    source: 'evalCM1Ecrire', fiche: { gen: 'dicteeNombres' } },
  { id: 'ma3-lettres-chiffres', matiere: 'MA', cycle: 3, objectifs: ['N1.4', 'N1.5', 'N1.7'], niveaux: ['CM1', 'CM2'], sorte: 'fiche', duree: '15 min',
    titre: 'Grands nombres : en lettres, en chiffres',
    resume: 'Passer des lettres aux chiffres et inversement, avec des nombres jusqu’à 999 999 (CM1), puis jusqu’au milliard (CM2).',
    deroule: ['Rappeler les mots-nombres et la régularité après soixante et après quatre-vingts.', 'Lire par classes : « trois-cent-quarante-mille… ».', 'Fiche, puis vérification à deux.'],
    source: 'evalCM1Ecrire', fiche: { gen: 'lettresChiffres' } },
  { id: 'ma3-unites-numeration', matiere: 'MA', cycle: 3, objectifs: ['N1.3', 'N1.6', 'N1.7'], niveaux: ['CM1', 'CM2'], sorte: 'fiche', duree: '15 min',
    titre: 'Unités de numération : décomposer, recomposer, échanger',
    resume: 'Chaque chiffre indique une unité dix fois plus grande que celle de sa droite. Décomposer, recomposer dans le désordre, faire les échanges, compter les dizaines ou les centaines « en tout ».',
    deroule: ['Rappeler les relations : 10 unités = 1 dizaine, 10 dizaines = 1 centaine, 10 centaines = 1 millier.', 'Exercices avec des rangs vides et des unités dans le désordre.', 'Dans 4 635, combien de dizaines en tout ? (463)'],
    source: 'evalCE2Decomposition', fiche: { gen: 'unitesNumeration' } },
  { id: 'ma3-comparer-nombres', matiere: 'MA', cycle: 3, objectifs: ['N1.9', 'N1.10'], niveaux: ['CM1', 'CM2'], sorte: 'fiche', duree: '10 à 15 min',
    titre: 'Comparer, encadrer, ranger de grands nombres',
    resume: 'Comparer en regardant d’abord le plus grand rang, encadrer à la dizaine ou à la centaine, ranger des nombres qui se ressemblent.',
    deroule: ['Justifier par le sens des chiffres (comme au CP : 7 dizaines, c’est plus que 6 dizaines).', 'Encadrer, puis intercaler.', 'Ranger des nombres aux mêmes chiffres dans un ordre différent.'],
    source: 'guideCP', fiche: { gen: 'comparerNombres' } },
  { id: 'ma3-droite-graduee', matiere: 'MA', cycle: 3, objectifs: ['N1.11'], niveaux: ['CM1', 'CM2'], sorte: 'fiche', duree: '15 min',
    titre: 'Demi-droite graduée : trouver la valeur d’un intervalle',
    resume: 'Repérer les bornes, compter les graduations, trouver de combien on avance (2, 5, 25, 100…), puis lire ou placer des nombres.',
    deroule: ['Vocabulaire : bornes, graduations, valeur de l’intervalle.', 'Essai-erreur à voix haute : « entre 40 et 50, 5 intervalles ; si j’avance de 1, j’arrive à 45 ; de 2, j’arrive à 50 ».', 'Activité ritualisée, avec un retour immédiat.'],
    source: 'evalCM1Ligne', fiche: { gen: 'droiteGraduee' } },
  { id: 'ma3-suites-nombres', matiere: 'MA', cycle: 3, objectifs: ['N1.11', 'N1.4'], niveaux: ['CM1', 'CM2'], sorte: 'fiche', duree: '10 min',
    titre: 'Suites de nombres à compléter',
    resume: 'Trouver la règle (de 25 en 25, de 1 000 en 1 000, en reculant…) et compléter : 6 ; 16 ; … ; 36 ; … ; 56.',
    deroule: ['Trouver la règle à l’oral.', 'Compléter sur la fiche.', 'Faire le lien avec la demi-droite graduée.'],
    source: 'evalCM1Ligne', fiche: { gen: 'suitesNombres' } },
  { id: 'ma3-tracer-droites', matiere: 'MA', cycle: 3, objectifs: ['N1.11'], niveaux: ['CM1', 'CM2'], sorte: 'seance', duree: '30 min',
    titre: 'Tracer une droite graduée avec des contraintes',
    resume: 'Construire soi-même des droites graduées : « de 120 à 130, avec exactement 5 intervalles » (puis 10, 2…). On comprend ce qu’est la valeur d’un intervalle.',
    materiel: ['Cahier à carreaux, règle.'],
    deroule: ['Donner les bornes et le nombre d’intervalles.', 'Chacun trace, puis indique la longueur et la valeur choisies pour un intervalle.', 'Comparer les procédures à deux.'],
    variantes: ['Donner les graduations et faire trouver les bornes.'],
    source: 'evalCM1Ligne' },
  { id: 'ma3-nombres-difficiles', matiere: 'MA', cycle: 3, objectifs: ['N1.4', 'N1.5'], niveaux: ['CM1', 'CM2'], sorte: 'rituel', duree: '5 min, chaque jour',
    titre: 'Les nombres difficiles à écrire',
    resume: 'Quelques minutes chaque jour sur les nombres qui posent problème : 72, 83, 91, 94, et les nombres avec des zéros (304 060).',
    deroule: ['Dicter 4 ou 5 nombres « difficiles ».', 'Faire dire en quoi 91 diffère de 64 ou 47 (« quatre-vingt-onze » = 80 + 11).', 'Écrire la décomposition sous le nombre.'],
    source: 'evalCM1Ecrire' },
  // Mathématiques, cycle 3 — fractions (v1.67)
  { id: 'ma3-fractions-figures', matiere: 'MA', cycle: 3, objectifs: ['N2.1'], niveaux: ['CM1', 'CM2'], sorte: 'fiche', duree: '15 min',
    titre: 'Représenter des fractions, aussi plus grandes que 1',
    resume: 'Écrire la fraction coloriée ou colorier une fraction ; avec plusieurs bandes-unités, sept quarts, c’est une unité et trois quarts.',
    deroule: ['Rappeler : 7/4, c’est sept fois un quart (« sept quarts »).', 'Dès qu’on dépasse 1, prendre une deuxième bande-unité.', 'Fiche, puis mise en commun à l’oral.'],
    source: 'fractionsCE1CM2', fiche: { gen: 'fractionsFigures' } },
  { id: 'ma3-fractions-lettres', matiere: 'MA', cycle: 3, objectifs: ['N2.1', 'N3.1'], niveaux: ['CM1', 'CM2'], sorte: 'fiche', duree: '10 min',
    titre: 'Lire et écrire des fractions, aussi décimales',
    resume: 'On dit « quatre tiers », pas « quatre sur trois » : le nombre du bas ne se lit pas, il nomme les parts. Aussi « trois-cent-dix-huit centièmes ».',
    deroule: ['Rappeler le rôle des deux nombres : le dénominateur nomme les parts, le numérateur les compte.', 'Fiche « en chiffres » puis « en lettres » ; réglage « fractions décimales » pour les dixièmes, centièmes, millièmes.', 'Relire les réponses à voix haute.'],
    source: 'fracDecCycle3', fiche: { gen: 'fractionsLettres' } },
  { id: 'ma3-fraction-entier', matiere: 'MA', cycle: 3, objectifs: ['N2.2', 'N2.3', 'N2.4'], niveaux: ['CM1', 'CM2'], sorte: 'fiche', duree: '10 à 15 min',
    titre: 'Une fraction, c’est un entier et encore un peu',
    resume: '7/4 = 1 + 3/4 ; 2 + 2/3 = 8/3 ; 5 < 16/3 < 6. On s’appuie sur 4/4 = 1, 3/3 = 1 et sur les tables de multiplication.',
    deroule: ['Exemple oral : sept quarts de pizza, c’est quatre quarts (une pizza) plus trois quarts.', 'Écrire la décomposition, puis l’encadrement entre deux entiers qui se suivent.', 'Fiche, en verbalisant chaque étape.'],
    source: 'fractionsCE1CM2', fiche: { gen: 'fractionEntier' } },
  { id: 'ma3-droite-fractions', matiere: 'MA', cycle: 3, objectifs: ['N2.5', 'N2.6'], niveaux: ['CM1', 'CM2'], sorte: 'fiche', duree: '15 min',
    titre: 'Placer et lire des fractions sur une demi-droite graduée',
    resume: 'Compter en combien de parts l’unité est partagée, puis lire ou placer 7/4 ou 1 + 3/4. La demi-droite ne commence pas toujours à 0.',
    deroule: ['Repérer les nombres entiers écrits, compter les intervalles dans une unité.', 'Avancer de graduation en graduation en disant « un quart, deux quarts… ».', 'Accepter les deux écritures : 7/4 et 1 + 3/4.'],
    variantes: ['Erreur fréquente à surveiller : traiter le numérateur et le dénominateur comme deux nombres séparés.'],
    source: 'evalCM2Droite', fiche: { gen: 'droiteFractions' } },
  { id: 'ma3-comparer-fractions', matiere: 'MA', cycle: 3, objectifs: ['N2.7'], niveaux: ['CM1', 'CM2'], sorte: 'fiche', duree: '10 à 15 min',
    titre: 'Comparer des fractions',
    resume: 'Même dénominateur, même numérateur, comparaison à 1, dénominateurs dont l’un est multiple de l’autre : 7/4 et 19/12, en écrivant 7/4 = 21/12.',
    deroule: ['Faire justifier chaque réponse, pas seulement donner le signe.', 'Pour des dénominateurs différents, écrire l’égalité de fractions qui permet de comparer.', 'Fiche, correction en disant la justification.'],
    source: 'fractionsCE1CM2', fiche: { gen: 'comparerFractions' } },
  { id: 'ma3-calcul-fractions', matiere: 'MA', cycle: 3, objectifs: ['N2.8', 'N2.9'], niveaux: ['CM1', 'CM2'], sorte: 'fiche', duree: '10 à 15 min, souvent',
    titre: 'Additionner et soustraire des fractions',
    resume: 'On n’ajoute pas des pommes et des voitures : 3 quarts + 1 demi, c’est 3 quarts + 2 quarts = 5 quarts. Au CM2, aussi un entier fois une fraction : 3 × 5/4 = 15/4.',
    deroule: ['Écrire les fractions en mots à côté des chiffres : 6 dixièmes + 3 dixièmes = 9 dixièmes.', 'Procédure : je change d’abord une fraction pour avoir le même dénominateur, puis je compte les parts.', 'Séances courtes et répétées ; le corrigé donne un résultat, une fraction égale est juste aussi.'],
    variantes: ['Erreur à anticiper : ajouter les numérateurs entre eux et les dénominateurs entre eux (3/4 + 1/2 = 4/6).'],
    source: 'livretCM2Fractions', fiche: { gen: 'calculFractions' } },
  { id: 'ma3-egalites-fractions', matiere: 'MA', cycle: 3, objectifs: ['N2.7', 'N4.3'], niveaux: ['CM1', 'CM2'], sorte: 'fiche', duree: '10 min',
    titre: 'Fractions égales : trouver le nombre qui manque',
    resume: '6/8 = …/4 ; 21/… = 7/3. Un huitième, c’est la moitié d’un quart : trois quarts, c’est six huitièmes.',
    deroule: ['Vérifier une égalité avec des bandes ou des surfaces.', 'Faire dire : « parts deux fois plus petites, deux fois plus de parts ».', 'Fiche avec numérateur ou dénominateur manquant.'],
    source: 'fractionsCE1CM2', fiche: { gen: 'egalitesFractions' } },
  { id: 'ma3-fraction-quantite', matiere: 'MA', cycle: 3, objectifs: ['N2.10'], niveaux: ['CM1', 'CM2'], sorte: 'fiche', duree: '10 min',
    titre: 'Fraction d’une quantité : un tiers de 12 œufs',
    resume: 'Pour un tiers de douze œufs, on partage en trois parts égales : 4 œufs ; deux tiers, c’est deux fois 4 œufs. Au CM1, numérateur 1 ; au CM2, toutes les fractions.',
    deroule: ['Commencer à l’oral, sans écriture mathématique : « trois quarts de cent euros ».', 'S’aider d’un schéma : une barre partagée en parts égales.', 'Fiche ; quelques questions en heures et minutes (trois quarts d’heure).'],
    source: 'fractionsCE1CM2', fiche: { gen: 'fractionQuantite' } },
  { id: 'ma3-additionner-fractions-explicite', matiere: 'MA', cycle: 3, objectifs: ['N2.8'], niveaux: ['CM2'], sorte: 'seance', duree: '40 min',
    titre: 'Pourquoi changer de dénominateur ? Une séance avec des bandes',
    resume: 'Un problème de sandwichs : trois quarts de baguette et une demi-baguette, quelle fraction de baguette en tout ? On plie des bandes pour voir qu’un demi, c’est deux quarts.',
    materiel: ['Des bandes de papier de même longueur (les baguettes), des ardoises.'],
    deroule: ['Trois minutes de recherche individuelle sur l’ardoise ; accepter les réponses en mots.', 'L’enseignant plie les bandes devant la classe en pensant à voix haute : « je ne peux pas ajouter des quarts et des demis… un demi, c’est deux quarts ».', 'Écrire la trace : 1) même dénominateur ; 2) compter les parts.', 'Calculs sans contexte (1 demi + 5 quarts, 2 tiers + 5 sixièmes), en cochant les étapes de la trace.'],
    source: 'livretCM2Fractions' },
  { id: 'ma3-ficelle-unite', matiere: 'MA', cycle: 3, objectifs: ['N2.1', 'N2.2'], niveaux: ['CM1'], sorte: 'seance', duree: '45 min',
    titre: 'Mesurer la classe avec une ficelle-unité',
    resume: 'Avec un morceau de ficelle pris comme unité, on mesure une table, une porte, un écran : les entiers ne suffisent pas, il faut « deux unités et la moitié d’une unité ».',
    materiel: ['Une ficelle par groupe (toutes de même longueur), des objets à mesurer.'],
    deroule: ['Chaque groupe mesure trois objets et note ses résultats avec ses mots.', 'Mise en commun : plier la ficelle en deux, en quatre, pour être plus précis.', 'Écrire les mesures : 2 + 1/2 unités, puis 5/2 unités.'],
    source: 'fracDecCycle3' },
  // Mathématiques, cycle 3 — nombres décimaux (v1.67)
  { id: 'ma3-fractions-decimales', matiere: 'MA', cycle: 3, objectifs: ['N3.1', 'N3.3', 'N3.5', 'N3.6', 'N3.9'], niveaux: ['CM1', 'CM2'], sorte: 'fiche', duree: '15 min',
    titre: 'Fractions décimales et écriture à virgule',
    resume: '358/100 = 3 + 58/100 = 3 + 5/10 + 8/100 = 3,58. Passer d’une écriture à l’autre, et utiliser les relations : 10 centièmes = 1 dixième, 36 dixièmes = 3 unités et 6 dixièmes.',
    materiel: ['Un grand carré partagé en 100 petits carrés (l’unité), des bandes de 10 (les dixièmes).'],
    deroule: ['Dire les nombres avec les unités de numération : 3,58, c’est « trois unités et cinquante-huit centièmes ».', 'Fiche : un type d’exercice à la fois, puis mélangé ; des zéros aussi (8 + 7/100 = 8,07).', 'Attention à la réussite par imitation : faire expliquer une écriture au moins à l’oral.'],
    source: 'fracDecCycle3', fiche: { gen: 'fractionsDecimales' } },
  { id: 'ma3-fractions-usuelles', matiere: 'MA', cycle: 3, objectifs: ['N4.3', 'N4.4'], niveaux: ['CM1', 'CM2'], sorte: 'fiche', duree: '5 à 10 min, chaque jour',
    titre: 'Fractions usuelles : 1/2 = 0,5 ; 1/4 + 1/4 = 1/2',
    resume: 'Connaître sans calculer les relations entre 1/2, 1/4, 3/4 et 1, et leur écriture décimale : 1/10 = 0,1 ; 1/100 = 0,01 ; au CM2, 1/4 = 0,25 ; 3/4 = 0,75 ; 3/2 = 1,5.',
    deroule: ['Rituel court à l’ardoise.', 'Faire le lien avec la monnaie et les mesures : un quart d’heure, une demi-heure.', 'Fiche en temps limité, une fois par semaine.'],
    source: 'evalCM1Faits', fiche: { gen: 'fractionsDecimales', options: { type: 'usuelles' } } },
  { id: 'ma3-droite-decimaux', matiere: 'MA', cycle: 3, objectifs: ['N3.4', 'N3.11'], niveaux: ['CM1', 'CM2'], sorte: 'fiche', duree: '15 min',
    titre: 'Nombres décimaux sur la demi-droite graduée',
    resume: 'Graduée de 0,1 en 0,1, de 0,01 en 0,01, de 0,5 en 0,5 : trouver la valeur d’un intervalle, puis lire ou placer. Les nombres peuvent être écrits en fractions décimales.',
    deroule: ['Vocabulaire : bornes, graduations, valeur d’un intervalle.', 'Compter de 0,1 en 0,1 à partir de 7,8 : 7,9 ; 8 ; 8,1.', 'Activité courte et régulière, avec un retour immédiat.'],
    variantes: ['Erreur fréquente : voir un décimal comme deux entiers séparés par une virgule (après 1,9 viendrait 1,10).'],
    source: 'evalCM2Droite', fiche: { gen: 'droiteDecimaux' } },
  { id: 'ma3-comparer-decimaux', matiere: 'MA', cycle: 3, objectifs: ['N3.7', 'N3.8', 'N3.12', 'N3.13'], niveaux: ['CM1', 'CM2'], sorte: 'fiche', duree: '10 à 15 min',
    titre: 'Comparer, encadrer, ranger des nombres décimaux',
    resume: 'Le carnet choisit exprès des paires piégeuses : 17,3 et 17,12 (le plus long n’est pas le plus grand), 17,2 et 17,07, 17,72 et 17,5, 2,6 et 2,60. Aussi encadrer, intercaler, ranger, arrondir.',
    deroule: ['Faire expliquer comment on compare : parties entières, puis dixièmes, puis centièmes.', 'Une seule erreur peut cacher une idée fausse : faire verbaliser l’élève.', 'Intercaler : plusieurs réponses sont justes (le corrigé en donne une).'],
    source: 'fracDecCycle3', fiche: { gen: 'comparerDecimaux' } },
  { id: 'ma3-fois10-decimaux', matiere: 'MA', cycle: 3, objectifs: ['N5.5', 'N5.6'], niveaux: ['CM1', 'CM2'], sorte: 'fiche', duree: '10 min',
    titre: 'Multiplier et diviser un décimal par 10, 100, 1 000',
    resume: '× 10 : chaque chiffre prend une valeur dix fois plus grande, les dixièmes deviennent des unités (72,4 × 100 = 7 240). On n’« ajoute pas un zéro » et on ne « déplace pas la virgule » sans comprendre.',
    materiel: ['Un glisse-nombre avec la colonne de la virgule.'],
    deroule: ['Montrer avec le glisse-nombre, en disant les unités : « 4 dixièmes fois 10, c’est 4 unités ».', 'CM1 : × 10 et ÷ 10 ; CM2 : aussi 100 et 1 000.', 'Fiche, puis questions « à trou » (3,4 × … = 340).'],
    source: 'exemplesCM2', fiche: { gen: 'fois10Decimaux' } },
  { id: 'ma3-ajouter-decimaux', matiere: 'MA', cycle: 3, objectifs: ['N5.1', 'N5.2', 'N5.3', 'N6.3', 'N6.8'], niveaux: ['CM1', 'CM2'], sorte: 'fiche', duree: '10 min',
    titre: 'Calcul mental avec des nombres décimaux',
    resume: 'Repérer le chiffre sur lequel agir : 4,45 + 0,3 ; 0,45 + 3/100. Au CM2 : ajouter un entier, avec retenue, deux décimaux (8,6 + 7,8), doubles et moitiés (la moitié de 9 = 4,5).',
    deroule: ['Calcul à l’ardoise, puis mise en commun des procédures.', 'Verbaliser : « six dixièmes plus huit dixièmes font quatorze dixièmes, c’est une unité et quatre dixièmes ».', 'Fiche en temps limité.'],
    source: 'exemplesCM2', fiche: { gen: 'calculMentalDecimaux' } },
  { id: 'ma3-multiplications-decimaux', matiere: 'MA', cycle: 3, objectifs: ['N7.6', 'N7.7'], niveaux: ['CM1', 'CM2'], sorte: 'fiche', duree: '15 min',
    titre: 'Multiplier un nombre décimal par un entier (posé)',
    resume: 'Poser 1,50 × 8 en disant les retenues : « 5 dixièmes fois 8 font 40 dixièmes, soit 4 unités ». Au CM1, par un entier à un chiffre ; au CM2, aussi à deux chiffres.',
    deroule: ['Estimer l’ordre de grandeur avant de poser.', 'Verbaliser chaque retenue avec les unités de numération.', 'Placer la virgule au résultat en s’appuyant sur l’estimation.'],
    source: 'evalCM2Problemes', fiche: { gen: 'multiplicationsPosees', options: { decimales: '1', bas: '1', haut: '3' } } },
  { id: 'ma3-divisions-decimales', matiere: 'MA', cycle: 3, objectifs: ['N7.9'], niveaux: ['CM2'], sorte: 'fiche', duree: '20 min',
    titre: 'Divisions décimales (diviseur à un chiffre)',
    resume: 'Quand il reste des unités, on les échange contre des dixièmes : on écrit la virgule au quotient et on continue. Dividende entier (9 ÷ 4 = 2,25) ou décimal (45,6 ÷ 3).',
    deroule: ['Partir d’un partage : 9 € entre 4 enfants, que faire du reste ?', 'Poser la division, écrire la virgule au quotient au passage des unités aux dixièmes.', 'Vérifier par la multiplication.'],
    source: 'evalCM2Poser', fiche: { gen: 'divisionDecimale' } },
  { id: 'ma3-problemes-fractions-decimaux', matiere: 'MA', cycle: 3, objectifs: ['N2.8', 'N2.10'], niveaux: ['CM1', 'CM2'], sorte: 'fiche', duree: '20 min',
    titre: 'Problèmes avec des fractions et des nombres décimaux',
    resume: 'Fraction d’une quantité (les trois quarts des élèves), parts d’un tout, prix (8 objets à 1,50 €), monnaie rendue, partage d’une longueur.',
    deroule: ['Comprendre l’énoncé : le reformuler sans les nombres.', 'Représenter : bande partagée, schéma en barres.', 'Calculer, puis vérifier l’ordre de grandeur de la réponse.'],
    source: 'evalCM2Problemes', fiche: { gen: 'problemesFractions' } },
  { id: 'ma3-grand-carre-centiemes', matiere: 'MA', cycle: 3, objectifs: ['N3.1', 'N3.2'], niveaux: ['CM1'], sorte: 'seance', duree: '45 min',
    titre: 'Le grand carré : dix centièmes font un dixième',
    resume: 'Un grand carré partagé en 100 petits carrés est l’unité. Une ligne de 10 petits carrés est un dixième ; elle vaut aussi dix centièmes.',
    materiel: ['Des grands carrés quadrillés 10 × 10, des crayons de couleur, des ciseaux.'],
    deroule: ['Colorier 3 dixièmes, puis 25 centièmes : lequel est le plus grand ?', 'Découper une ligne : un dixième, c’est 10 centièmes.', 'Écrire 318 centièmes de plusieurs façons : 3 unités et 18 centièmes, 3 + 1/10 + 8/100.'],
    source: 'fracDecCycle3' },
  { id: 'ma3-ecritures-nombre', matiere: 'MA', cycle: 3, objectifs: ['N3.9', 'N3.10'], niveaux: ['CM1', 'CM2'], sorte: 'rituel', duree: '10 min',
    titre: 'Toutes les écritures d’un nombre décimal',
    resume: '« Donne différentes écritures de 12,8 » : 128 dixièmes, 12 + 8/10, 1 dizaine 2 unités 8 dixièmes, 1 280 centièmes… On lit 2,4 « deux et quatre dixièmes ».',
    deroule: ['Écrire le nombre au tableau ; chacun propose une écriture sur l’ardoise.', 'Valider ou corriger ensemble ; les erreurs servent à comprendre.', 'Garder l’affiche du jour.'],
    variantes: ['Éviter de dire seulement « deux virgule quatre » : cela fait croire à deux entiers collés.'],
    source: 'fracDecCycle3' },
  { id: 'ma3-corde-decimaux', matiere: 'MA', cycle: 3, objectifs: ['N3.11', 'N3.13'], niveaux: ['CM1', 'CM2'], sorte: 'seance', duree: '20 à 30 min',
    titre: 'La corde à nombres décimaux',
    resume: 'Une corde bornée par 8 et 12 : placer des étiquettes 8,4 ; 9 ; 9,2 ; 11,9 le plus précisément possible, en justifiant.',
    materiel: ['Une corde, des pinces à linge, des étiquettes nombres.'],
    deroule: ['Placer les bornes, puis les étiquettes une par une en justifiant.', 'Changer les bornes avec les mêmes étiquettes.', 'Finir par le nombre secret : « mon nombre est entre 9 et 10… », on répond « plus grand » ou « plus petit ».'],
    source: 'evalCM2Droite' },
  { id: 'ma3-compter-dixiemes', matiere: 'MA', cycle: 3, objectifs: ['N3.2', 'N3.3', 'N3.11'], niveaux: ['CM1', 'CM2'], sorte: 'rituel', duree: '5 min',
    titre: 'Compter de 0,1 en 0,1, de 0,01 en 0,01',
    resume: 'Un furet décimal : partir de 7,8 et avancer de 0,1 (7,9 ; 8 ; 8,1…), puis reculer ; de 0,01 en 0,01 au passage de 2,99 à 3.',
    deroule: ['Annoncer le départ et le pas.', 'Chaque élève dit le nombre suivant ; s’arrêter sur les passages difficiles (1,9 → 2 ; 2,99 → 3).', 'Dire aussi en unités : « sept unités et neuf dixièmes ».'],
    source: 'evalCM2Droite' },
];

/* ---------- Petits outils de hasard (graine : mêmes nombres pour la même graine) ---------- */

function hasardRes(graine) {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const entRes = (rnd, a, b) => a + Math.floor(rnd() * (b - a + 1));
const unRes = (rnd, t) => t[Math.floor(rnd() * t.length)];
// n exercices différents (si possible) fabriqués par `fab`.
function tirerRes(n, rnd, fab) {
  const res = [], vus = new Set();
  for (let k = 0; res.length < n && k < n * 60; k++) {
    const it = fab();
    if (!it) continue;
    const cle = it.cle || JSON.stringify(it.parties || it.texte || it.nombres);
    if (vus.has(cle) && k < n * 30) continue;
    vus.add(cle);
    res.push(it);
  }
  return res;
}
const nbRes = n => Number(n).toLocaleString('fr-FR');
// Nombre écrit en lettres, orthographe de 1990 (traits d'union partout, comme dans les fiches Eduscol) :
// 71 soixante-et-onze, 80 quatre-vingts, 280 deux-cent-quatre-vingts, 80 000 quatre-vingt-mille ; million(s) : un nom, séparé par une espace.
function nombreEnLettresRes(n) {
  const U = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const D = { 2: 'vingt', 3: 'trente', 4: 'quarante', 5: 'cinquante', 6: 'soixante' };
  const moinsDeCent = (x, final) => {
    if (x < 20) return U[x];
    const d = Math.floor(x / 10), u = x % 10;
    if (d === 7) return `soixante${u === 1 ? '-et-' : '-'}${U[10 + u]}`;
    if (d === 9) return `quatre-vingt-${U[10 + u]}`;
    if (d === 8) return u ? `quatre-vingt-${U[u]}` : `quatre-vingt${final ? 's' : ''}`;
    return D[d] + (u === 1 ? '-et-un' : u ? `-${U[u]}` : '');
  };
  const moinsDeMille = (x, final) => {
    const c = Math.floor(x / 100), r = x % 100, parts = [];
    if (c) parts.push(c === 1 ? 'cent' : `${U[c]}-cent${!r && final ? 's' : ''}`);
    if (r) parts.push(moinsDeCent(r, final));
    return parts.join('-');
  };
  if (!n) return 'zéro';
  const millions = Math.floor(n / 1e6), milliers = Math.floor(n / 1000) % 1000, reste = n % 1000, bloc = [], morceaux = [];
  if (millions) morceaux.push(millions === 1 ? 'un million' : `${moinsDeMille(millions, true)} millions`);
  if (milliers) bloc.push(milliers === 1 ? 'mille' : `${moinsDeMille(milliers, false)}-mille`);
  if (reste) bloc.push(moinsDeMille(reste, true));
  if (bloc.length) morceaux.push(bloc.join('-'));
  return morceaux.join(' ');
}
const UNITES_NUMERATION_RES = ['unités', 'dizaines', 'centaines', 'milliers', 'dizaines de mille', 'centaines de mille'];
// Le plus grand nombre étudié à chaque niveau (programme) et un nombre « au hasard » qui favorise les cas difficiles d'après Eduscol
// (nombres de 70 à 99 dans l'écriture : 72, 91, 83… ; zéros intercalés).
const MAX_NIVEAU_RES = { CP: 100, CE1: 1000, CE2: 10000, CM1: 999999, CM2: 999999999 };
function nombreNiveauRes(rnd, n, difficiles = false) {
  const max = MAX_NIVEAU_RES[n] || 1000;
  let x = entRes(rnd, n === 'CP' ? 11 : 100, max - 1);
  if (difficiles && rnd() < 0.7) x = x - x % 100 + entRes(rnd, 70, 99); // (de 70 à 99 sur les deux derniers chiffres)
  if (max > 1000 && rnd() < 0.25) { const s = String(x).split(''); s[entRes(rnd, 1, s.length - 1)] = '0'; x = +s.join(''); } // (un zéro intercalé)
  return Math.min(Math.max(x, 1), max - 1);
}
// Nombre stocké en entier (ex. 475) écrit avec `dec` chiffres après la virgule (47,5), sans espace des milliers (opérations posées).
const texteNbRes = (x, dec) => {
  if (!dec) return String(x);
  const s = String(x).padStart(dec + 1, '0');
  return `${s.slice(0, -dec)},${s.slice(-dec)}`;
};
const MOINS_RES = '–'; // (le signe « − » n'existe pas dans les polices du PDF : tiret demi-cadratin)
const ligneRes = (parties, reponse) => ({ parties, reponse: String(reponse) });
const PLUS_GRAND_RES = { CP: 99, CE1: 999, CE2: 9999, CM1: 99999, CM2: 999999 };

// --- Fractions et nombres décimaux ---
// Une partie d'exercice { f: [numérateur, dénominateur] } est une fraction dessinée « en étage » ; null dans f = case à remplir.
const fracRes = (n, d) => ({ f: [n, d] });
const estFracRes = p => !!p && typeof p === 'object' && Array.isArray(p.f);
const texteValRes = v => (typeof v === 'number' ? nbRes(v) : String(v ?? ''));
// Écriture « en ligne » (fiche de l'activité, corrigés de problèmes) : 3/8 ; une valeur riche = texte, fraction ou liste des deux.
const texteRicheRes = v => (Array.isArray(v) ? v.map(texteRicheRes).join('') : estFracRes(v) ? `${texteValRes(v.f[0] ?? '…')}/${texteValRes(v.f[1] ?? '…')}` : texteValRes(v));
// Dénominateurs rencontrés à chaque niveau (d'après Eduscol : 2, 3, 4, 5, 6, 8, 10 au CE1 ; jusqu'à 12 au CE2 ; 20 au CM1 ; 60 au CM2).
const DENOMINATEURS_RES = { CP: [2, 4], CE1: [2, 3, 4, 5, 6, 8, 10], CE2: [2, 3, 4, 5, 6, 8, 10, 12],
  CM1: [2, 3, 4, 5, 6, 8, 10, 12, 15, 20], CM2: [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20] };
// Paires de dénominateurs dont l'un est un multiple de l'autre (3/4 + 1/2, 7/12 et 5/6).
const pairesMultiplesRes = dens => dens.flatMap(p => dens.filter(q => q > p && q % p === 0 && q / p <= 5).map(q => [p, q]));
// Rectangles quadrillés : lignes × colonnes pour un dénominateur.
const GRILLES_RES = { 4: [2, 2], 6: [2, 3], 8: [2, 4], 9: [3, 3], 10: [2, 5], 12: [3, 4] };
// Fraction en lettres : 1/2 un demi, 3/4 trois quarts, 2/3 deux tiers, 7/10 sept dixièmes, 37/100 trente-sept centièmes.
function fractionEnLettresRes(n, d) {
  let nom = { 2: 'demi', 3: 'tiers', 4: 'quart' }[d];
  if (!nom) {
    const l = nombreEnLettresRes(d);
    nom = l.endsWith('cinq') ? `${l}uième` : l.endsWith('neuf') ? `${l.slice(0, -1)}vième` : l.endsWith('e') ? `${l.slice(0, -1)}ième` : `${l}ième`;
  }
  if (n > 1 && !nom.endsWith('s')) nom += 's';
  return `${nombreEnLettresRes(n)} ${nom}`;
}
// Nombre décimal stocké en entier de 10^-p (358 avec p = 2 → « 3,58 »), sans les zéros inutiles (2,50 → 2,5) sauf si `zeros`.
function decimalRes(v, p, zeros = false) {
  const e = Math.floor(v / 10 ** p);
  let f = p ? String(v - e * 10 ** p).padStart(p, '0') : '';
  if (!zeros) f = f.replace(/0+$/, '');
  return nbRes(e) + (f ? `,${f}` : '');
}
// Prix en centimes : 150 → « 1,50 », 1200 → « 12 ».
const prixRes = c => (c % 100 ? decimalRes(c, 2, true) : nbRes(c / 100));

// Fraction en étage : cases = [haut, bas], chacune { t } (écrite) ou { rep } (case vide, réponse montrée dans le corrigé).
const tailleFracRes = T => T * 0.8;
function largeurFracCasesRes(d, cases, T) {
  const t = tailleFracRes(T);
  return Math.max(t * 1.1, ...cases.map(c => (c.t != null ? d.largeurTexte(texteValRes(c.t), t, true)
    : Math.max(t * 1.6, d.largeurTexte(texteValRes(c.rep), t, true) + 4)))) + 6;
}
// xm : milieu ; yb : ligne de base du texte voisin (le trait de fraction est un peu au-dessus).
function fractionCasesRes(d, xm, yb, cases, T, montre, o = {}) {
  const t = tailleFracRes(T), w = largeurFracCasesRes(d, cases, T), yBar = yb - T * 0.3, hc = t * 1.15;
  d.ligne(xm - w / 2 + 1, yBar, xm + w / 2 - 1, yBar, { trait: o.couleur || '#222222', ep: Math.max(0.8, T / 16) });
  cases.forEach((c, i) => {
    const yTxt = i ? yBar + 3 + t * 0.74 : yBar - 3;
    if (c.t != null) { d.texte(xm, yTxt, texteValRes(c.t), { taille: t, gras: !!o.gras, couleur: o.couleur || '#000000', ancre: 'milieu' }); return; }
    d.rect(xm - (w - 6) / 2, i ? yBar + 2 : yBar - 2 - hc, w - 6, hc, { trait: '#b5b5b5', ep: 0.5, rayon: 2 });
    if (montre) d.texte(xm, yTxt, texteValRes(c.rep), { taille: t, gras: true, couleur: COULEUR_CORRIGE, ancre: 'milieu' });
  });
  return w;
}
// Valeur « riche » (texte, fraction, ou liste des deux : ['1 + ', fracRes(3, 4)]) : largeur et dessin.
const morceauxRicheRes = v => (Array.isArray(v) ? v : [v]);
const largeurRicheRes = (d, v, T, gras = false) => morceauxRicheRes(v).reduce((s, p) => s + (estFracRes(p) ? largeurFracCasesRes(d, p.f.map(t => ({ t })), T) : d.largeurTexte(texteValRes(p), T, gras)), 0);
function dessinerRicheRes(d, x, yb, v, T, o = {}) {
  const w = largeurRicheRes(d, v, T, o.gras);
  x -= o.ancre === 'milieu' ? w / 2 : o.ancre === 'fin' ? w : 0;
  for (const p of morceauxRicheRes(v)) {
    if (estFracRes(p)) { const wf = largeurFracCasesRes(d, p.f.map(t => ({ t })), T); fractionCasesRes(d, x + wf / 2, yb, p.f.map(t => ({ t })), T, false, o); x += wf; }
    else { d.texte(x, yb, texteValRes(p), { taille: T, gras: !!o.gras, couleur: o.couleur }); x += d.largeurTexte(texteValRes(p), T, !!o.gras); }
  }
  return w;
}
const contientFracRes = v => morceauxRicheRes(v).some(estFracRes);

/* ---------- Générateurs de fiches élèves ----------
   Chacun : nom, options(niveau) → [{ cle, libelle, choix: [[valeur, libellé]], defaut }], nombre(niveau) d'exercices,
   fabriquer(o, niveau, rnd) → { consigne, aide?, disposition: 'ligne' | 'posee' | 'probleme', exercices } */

const GENERATEURS_FICHES = {
  // --- Numération (d'après Eduscol : évaluations de début de CE2 et de CM1, 2026 ; guide CP) ---
  dicteeNombres: {
    options: n => [{ cle: 'difficiles', libelle: 'Nombres', choix: [['oui', 'Avec beaucoup de nombres de 70 à 99 et de zéros'], ['non', 'Au hasard']], defaut: 'oui' }],
    nombre: () => 15,
    fabriquer(o, n, rnd) {
      const exercices = tirerRes(o.nombre, rnd, () => {
        const x = nombreNiveauRes(rnd, n, o.difficiles === 'oui');
        return { parties: [null], reponse: `${nbRes(x)}  —  ${nombreEnLettresRes(x)}`, longue: true, cle: String(x) };
      });
      return { consigne: 'Écris en chiffres les nombres dictés.', aide: 'Pour l’enseignant : les nombres à dicter sont sur la page du corrigé.', disposition: 'ligne', exercices };
    },
  },
  lettresChiffres: {
    options: n => [
      { cle: 'sens', libelle: 'Écrire', choix: [['chiffres', 'En chiffres (le nombre est écrit en lettres)'], ['lettres', 'En lettres (le nombre est écrit en chiffres)'], ['melange', 'Les deux']], defaut: 'chiffres' },
      { cle: 'difficiles', libelle: 'Nombres', choix: [['oui', 'Avec beaucoup de nombres de 70 à 99 et de zéros'], ['non', 'Au hasard']], defaut: 'oui' },
    ],
    nombre: () => 12,
    fabriquer(o, n, rnd) {
      const exercices = tirerRes(o.nombre, rnd, () => {
        const x = nombreNiveauRes(rnd, n, o.difficiles === 'oui'), sens = o.sens === 'melange' ? unRes(rnd, ['chiffres', 'lettres']) : o.sens;
        return sens === 'chiffres' ? { parties: [`${nombreEnLettresRes(x)} → `, null], reponse: nbRes(x), longue: true, cle: 'c' + x }
          : { parties: [`${nbRes(x)} → `, null], reponse: nombreEnLettresRes(x), longue: true, cle: 'l' + x };
      });
      return { consigne: 'Écris chaque nombre de l’autre façon.', aide: 'Les mots-nombres sont reliés par des traits d’union : quatre-cent-soixante-quinze.', disposition: 'ligne', exercices };
    },
  },
  unitesNumeration: {
    options: n => [{ cle: 'type', libelle: 'Exercices', defaut: 'melange', choix: [['decomposer', '475 = … centaines + … dizaines + … unités'],
      ['recomposer', 'Unités dans le désordre ou absentes (7 dizaines + 3 centaines…)'], ['echanges', 'Plus de 9 d’une unité (5 dizaines + 17 unités)'],
      ['additive', 'Écriture additive (400 + 70 + 5)'], ['combien', 'Combien de dizaines (ou de centaines) en tout ?'], ['melange', 'Tout mélangé']] }],
    nombre: () => 14,
    fabriquer(o, n, rnd) {
      const max = Math.min(MAX_NIVEAU_RES[n] || 1000, 999999), nbRangs = String(max - 1).length;
      const nom = (k, c) => (c === 1 ? UNITES_NUMERATION_RES[k].replace(/s(?= |$)/, '').replace('dizaine de mille', 'dizaine de mille').replace('millier', 'millier') : UNITES_NUMERATION_RES[k]);
      const exercices = tirerRes(o.nombre, rnd, () => {
        const type = o.type === 'melange' ? unRes(rnd, ['decomposer', 'recomposer', 'echanges', 'additive', 'combien']) : o.type;
        const x = nombreNiveauRes(rnd, n === 'CM2' ? 'CM1' : n), ch = String(x).split('').reverse().map(Number), L = ch.length; // (jusqu'à 999 999 : des noms d'unités jusqu'aux centaines de mille)
        if (type === 'decomposer') {
          const parties = [`${nbRes(x)} = `];
          for (let k = L - 1; k >= 0; k--) parties.push(null, ` ${UNITES_NUMERATION_RES[k]}${k ? ' + ' : ''}`);
          return { parties, reponses: ch.slice().reverse().map(String), cle: 'd' + x };
        }
        if (type === 'recomposer') { // (ordre mélangé, et parfois un rang sans rien : il faut écrire un 0)
          const termes = ch.map((c, k) => [c, k]).filter(([c]) => c).sort(() => rnd() - 0.5);
          return ligneRes([`${termes.map(([c, k]) => `${c} ${nom(k, c)}`).join(' + ')} = `, null], nbRes(x));
        }
        if (type === 'echanges') { // (plus de 9 unités d'un rang : il faut faire les échanges, 10 unités = 1 dizaine…)
          const r = Math.min(nbRangs, 3), comptes = Array.from({ length: r }, () => entRes(rnd, 0, 19)), total = comptes.reduce((s, c, k) => s + c * 10 ** k, 0);
          if (!comptes.some(c => c > 9) || total < 10 || total >= max) return null;
          const termes = comptes.map((c, k) => [c, k]).filter(([c]) => c).sort(() => rnd() - 0.5);
          return ligneRes([`${termes.map(([c, k]) => `${c} ${nom(k, c)}`).join(' + ')} = `, null], nbRes(total));
        }
        if (type === 'additive') {
          const termes = ch.map((c, k) => c * 10 ** k).filter(Boolean);
          if (rnd() < 0.5) return ligneRes([`${termes.slice().sort(() => rnd() - 0.5).map(nbRes).join(' + ')} = `, null], nbRes(x));
          return { parties: [`${nbRes(x)} = `, ...termes.slice().reverse().flatMap((t, i) => (i ? [' + ', null] : [null]))], reponses: termes.slice().reverse().map(nbRes), cle: 'a' + x };
        }
        if (L < 2) return null;
        const k = entRes(rnd, 1, Math.min(L - 1, 2)); // (dizaines ou centaines en tout)
        return ligneRes([`Dans ${nbRes(x)}, combien de ${UNITES_NUMERATION_RES[k]} en tout ? `, null], nbRes(Math.floor(x / 10 ** k)));
      });
      return { consigne: 'Complète.', aide: 'Dix unités font une dizaine, dix dizaines font une centaine, dix centaines font un millier.', disposition: 'ligne', exercices };
    },
  },
  comparerNombres: {
    options: n => [{ cle: 'type', libelle: 'Exercices', defaut: 'melange', choix: [['comparer', 'Comparer avec <, > ou ='], ['ecritures', 'Comparer des écritures différentes (5d 1u et 4d 12u)'],
      ['encadrer', 'Encadrer (… < 347 < …)'], ['ranger', 'Ranger dans l’ordre croissant'], ['melange', 'Tout mélangé']] }],
    nombre: () => 18,
    fabriquer(o, n, rnd) {
      const max = MAX_NIVEAU_RES[n] || 1000;
      const proche = x => { // (un nombre qui ressemble : mêmes chiffres échangés, ou un chiffre changé)
        const s = String(x).split('');
        if (s.length > 1 && rnd() < 0.5) { const i = entRes(rnd, 0, s.length - 2); [s[i], s[i + 1]] = [s[i + 1], s[i]]; }
        else s[entRes(rnd, 0, s.length - 1)] = String(entRes(rnd, 0, 9));
        const y = +s.join(''); return y > 0 && y < max ? y : null;
      };
      const exercices = tirerRes(o.nombre, rnd, () => {
        const type = o.type === 'melange' ? unRes(rnd, ['comparer', 'comparer', 'ecritures', 'encadrer', 'ranger']) : o.type;
        const x = nombreNiveauRes(rnd, n);
        if (type === 'comparer') { const y = rnd() < 0.1 ? x : proche(x); if (y === null) return null; return ligneRes([`${nbRes(x)}  `, null, `  ${nbRes(y)}`], x < y ? '<' : x > y ? '>' : '='); }
        if (type === 'ecritures') { // (d'après le guide CP : 5d 1u, 4d 2u, 3u 4d, 5d 17u, 6d…)
          const ecr = v => { const d = Math.floor(v / 10), u = v % 10; const f = unRes(rnd, ['du', 'ud', 'eclate']);
            if (f === 'eclate' && d > 0) return `${d - 1}d ${u + 10}u`; return f === 'ud' ? `${u}u ${d}d` : `${d}d ${u}u`; };
          const a = entRes(rnd, 11, n === 'CP' ? 99 : 99), b = rnd() < 0.15 ? a : entRes(rnd, Math.max(10, a - 15), Math.min(99, a + 15));
          return ligneRes([`${rnd() < 0.5 ? ecr(a) : a}  `, null, `  ${ecr(b)}`], a < b ? '<' : a > b ? '>' : '=');
        }
        if (type === 'encadrer') {
          const pas = x >= 1000 && rnd() < 0.5 ? 100 : 10; if (x % pas === 0) return null;
          return { parties: [null, ` < ${nbRes(x)} < `, null], reponses: [nbRes(x - x % pas), nbRes(x - x % pas + pas)], cle: 'e' + x };
        }
        const liste = [x]; for (let k = 0; k < 30 && liste.length < 4; k++) { const y = proche(liste[entRes(rnd, 0, liste.length - 1)]); if (y !== null && !liste.includes(y)) liste.push(y); }
        if (liste.length < 4) return null;
        return { parties: [`${liste.map(nbRes).join(' ; ')} → `, null], reponse: liste.slice().sort((a, b) => a - b).map(nbRes).join(' < '), longue: true, cle: 'r' + liste.join() };
      });
      return { consigne: 'Complète.', aide: 'Pour comparer, je regarde d’abord le plus grand rang : 71 > 68, car 7 dizaines, c’est plus que 6 dizaines.', disposition: 'ligne', exercices };
    },
  },
  suitesNombres: {
    options: n => [{ cle: 'sens', libelle: 'Suites', choix: [['avant', 'En avançant'], ['melange', 'En avançant et en reculant']], defaut: n === 'CP' ? 'avant' : 'melange' }],
    nombre: () => 12,
    fabriquer(o, n, rnd) {
      const max = MAX_NIVEAU_RES[n] || 1000, pas = { CP: [1, 2, 5, 10], CE1: [2, 5, 10, 20, 50, 100], CE2: [5, 10, 25, 50, 100, 1000] }[n] || [25, 50, 100, 250, 1000, 10000];
      const exercices = tirerRes(o.nombre, rnd, () => {
        const p = unRes(rnd, pas), recule = o.sens === 'melange' && rnd() < 0.4, debut = entRes(rnd, recule ? p * 7 : 0, max - 1 - (recule ? 0 : p * 7));
        const termes = Array.from({ length: 7 }, (_, i) => debut + (recule ? -i : i) * p);
        if (termes.some(t => t < 0 || t >= max)) return null;
        const trous = new Set(); while (trous.size < 2) trous.add(entRes(rnd, 2, 6));
        const parties = [], reponses = [];
        termes.forEach((t, i) => { if (i) parties.push(' ; '); if (trous.has(i)) { parties.push(null); reponses.push(nbRes(t)); } else parties.push(nbRes(t)); });
        return { parties, reponses, cle: termes.join() };
      });
      return { consigne: 'Trouve la règle de chaque suite, puis complète.', disposition: 'ligne', exercices };
    },
  },
  droiteGraduee: {
    options: n => [
      { cle: 'type', libelle: 'Exercices', choix: [['lire', 'Trouver les nombres marqués A, B, C'], ['placer', 'Placer des nombres'], ['melange', 'Les deux']], defaut: 'melange' },
      // (seulement les pas possibles au niveau : 10 intervalles doivent tenir dans les nombres étudiés)
      { cle: 'pas', libelle: 'Graduée', defaut: 'auto', choix: [['auto', 'Selon le niveau'],
        ...[1, 2, 5, 10, 100, 1000].filter(p => p * 10 <= (MAX_NIVEAU_RES[n] || 1000)).map(p => [String(p), `De ${nbRes(p)} en ${nbRes(p)}`])] },
    ],
    nombre: () => 6,
    fabriquer(o, n, rnd) {
      const max = MAX_NIVEAU_RES[n] || 1000, pasNiveau = { CP: [1], CE1: [1, 10, 100], CE2: [1, 2, 5, 10, 100, 1000] }[n] || [2, 5, 10, 25, 100, 1000, 10000];
      const exercices = tirerRes(o.nombre, rnd, () => {
        const p = o.pas === 'auto' ? unRes(rnd, pasNiveau) : +o.pas, type = o.type === 'melange' ? unRes(rnd, ['lire', 'placer']) : o.type;
        if (p * 10 > max) return null;
        const debut = p * entRes(rnd, 0, Math.floor(max / p) - 10);
        // (repères écrits : le début et une autre graduation ; avec un pas de 2, 5 ou 25, l'élève doit trouver la valeur d'un intervalle)
        const reperes = [0, unRes(rnd, p === 1 || p === 10 || p === 100 || p === 1000 ? [1, 5, 10] : [5, 10])];
        const libres = [...Array(11).keys()].filter(i => !reperes.includes(i)).sort(() => rnd() - 0.5).slice(0, 3).sort((a, b) => a - b);
        return { droite: { debut, pas: p, reperes, points: libres.map((i, k) => ({ i, lettre: 'ABC'[k], valeur: debut + i * p })), type }, cle: `${debut}/${p}/${libres}` };
      });
      return { consigne: 'Lis bien les nombres déjà écrits : de combien avance-t-on à chaque graduation ?', disposition: 'droite', exercices };
    },
  },
  // --- Multiplication et division (d'après Eduscol, évaluations de début de CM1 et de CM2, 2026) ---
  tablesMultiplication: {
    options: n => [
      { cle: 'tables', libelle: 'Tables', defaut: n === 'CE1' ? '2-5-10' : 'toutes',
        choix: [['2-5-10', '2, 5 et 10'], ['2-4-8', '2, 4 et 8'], ['3-6', '3 et 6'], ['7-9', '7 et 9'], ['carres', 'Les carrés (3 × 3, 4 × 4…)'], ['toutes', 'Toutes (de 2 à 9)']] },
      { cle: 'type', libelle: 'Questions', defaut: n === 'CE1' ? 'produit' : 'melange',
        choix: [['produit', '6 × 7 = …'], ['facteur', '6 × … = 42'], ['combien', 'Dans 42, combien de fois 6 ?'], ['melange', 'Les trois, mélangées']] },
    ],
    nombre: o => (o?.type === 'produit' || o?.type === 'facteur' ? 30 : 18), // (« Dans 42, combien de fois 6 ? » : une colonne, une page)
    fabriquer(o, n, rnd) {
      const tables = { '2-5-10': [2, 5, 10], '2-4-8': [2, 4, 8], '3-6': [3, 6], '7-9': [7, 9], toutes: [2, 3, 4, 5, 6, 7, 8, 9] }[o.tables];
      const exercices = tirerRes(o.nombre, rnd, () => {
        const a = tables ? unRes(rnd, tables) : entRes(rnd, 2, 10), b = tables ? (rnd() < 0.04 ? 1 : entRes(rnd, 2, 10)) : a, p = a * b;
        const type = o.type === 'melange' ? unRes(rnd, ['produit', 'facteur', 'combien']) : o.type;
        if (type === 'produit') return rnd() < 0.5 ? ligneRes([`${a} × ${b} = `, null], p) : ligneRes([`${b} × ${a} = `, null], p);
        if (type === 'facteur') return rnd() < 0.5 ? ligneRes([`${a} × `, null, ` = ${p}`], b) : ligneRes([null, ` × ${a} = ${p}`], b);
        return ligneRes([`Dans ${p}, combien de fois ${a} ? `, null], b);
      });
      return { consigne: 'Calcule de tête.', aide: o.type === 'produit' ? '' : 'Je cherche dans la table : 6 × … = 42, c’est 6 × 7. Dans 42, il y a 7 fois 6.', disposition: 'ligne', exercices };
    },
  },
  fois10: {
    options: n => [{ cle: 'quoi', libelle: 'Multiplier', defaut: { CE1: '10', CE2: '10-100' }[n] || '10-100-1000',
      choix: [['10', 'Par 10'], ['10-100', 'Par 10 et par 100'], ['10-100-1000', 'Par 10, 100 et 1 000'], ['dizaines', 'Par des dizaines ou des centaines (6 × 30, 4 × 300)'], ['dizaines2', 'Des dizaines par des centaines (30 × 400)']] }],
    nombre: () => 24,
    fabriquer(o, n, rnd) {
      const maxA = { CE1: 99, CE2: 999 }[n] || 9999, c3 = NIVEAUX_CYCLE_RES[3].includes(n);
      const exercices = tirerRes(o.nombre, rnd, () => {
        if (o.quoi === 'dizaines') { const a = entRes(rnd, 2, 9), k = entRes(rnd, 2, 9) * (c3 && rnd() < 0.5 ? 100 : 10); return rnd() < 0.5 ? ligneRes([`${a} × ${nbRes(k)} = `, null], nbRes(a * k)) : ligneRes([`${nbRes(k)} × ${a} = `, null], nbRes(a * k)); }
        if (o.quoi === 'dizaines2') { const a = entRes(rnd, 2, 9) * unRes(rnd, [10, 100, 1000]), b = entRes(rnd, 2, 9) * unRes(rnd, [10, 100]); return ligneRes([`${nbRes(a)} × ${nbRes(b)} = `, null], nbRes(a * b)); }
        const f = unRes(rnd, o.quoi === '10' ? [10] : o.quoi === '10-100' ? [10, 100] : [10, 100, 1000]), a = entRes(rnd, 2, maxA);
        return rnd() < 0.75 ? ligneRes([`${nbRes(a)} × ${nbRes(f)} = `, null], nbRes(a * f)) : ligneRes([`${nbRes(f)} × ${nbRes(a)} = `, null], nbRes(a * f));
      });
      return { consigne: 'Calcule de tête.', aide: o.quoi.startsWith('dizaines') ? '6 × 30, c’est 6 × 3 dizaines = 18 dizaines, donc 180.'
        : 'Multiplier par 10, c’est rendre le nombre dix fois plus grand : 54 × 10, c’est 54 dizaines, donc 540.', disposition: 'ligne', exercices };
    },
  },
  procedures: {
    options: n => [
      { cle: 'facteur', libelle: 'Multiplier par', defaut: '4',
        choix: [['4', '4 (le double du double)'], ['8', '8 (le double, trois fois)'], ...(n === 'CE2' ? [] : [['5', '5 (× 10, puis la moitié)']]), ['melange', n === 'CE2' ? '4 et 8 mélangés' : '4, 8 et 5 mélangés']] },
      { cle: 'aide', libelle: 'Étape', choix: [['etape', 'Avec l’étape écrite'], ['sans', 'Sans l’étape']], defaut: 'etape' },
    ],
    nombre: o => (o?.aide === 'etape' ? 14 : 24),
    fabriquer(o, n, rnd) {
      const max = n === 'CE2' ? 60 : 250, liste = o.facteur === 'melange' ? (n === 'CE2' ? [4, 8] : [4, 8, 5]) : [+o.facteur];
      const exercices = tirerRes(o.nombre, rnd, () => {
        const f = unRes(rnd, liste), a = entRes(rnd, 11, f === 8 ? Math.min(max, 125) : max);
        const etape = { 4: `${a} × 2 × 2`, 8: `${a} × 2 × 2 × 2`, 5: `${a} × 10 ÷ 2` }[f];
        return ligneRes([o.aide === 'etape' ? `${a} × ${f} = ${etape} = ` : `${a} × ${f} = `, null], nbRes(a * f));
      });
      const aide = { 4: 'Multiplier par 4, c’est prendre le double du double : 23 × 4 = 46 × 2 = 92.', 8: 'Multiplier par 8, c’est prendre le double trois fois : 12 × 8 = 24 × 2 × 2 = 96.',
        5: 'Multiplier par 5, c’est multiplier par 10 puis prendre la moitié : 36 × 5 = 360 ÷ 2 = 180.' }[o.facteur] || 'Par 4 : le double du double. Par 8 : le double, trois fois. Par 5 : × 10, puis la moitié.';
      return { consigne: 'Calcule de tête.', aide, disposition: 'ligne', exercices };
    },
  },
  distributivite: {
    options: n => [
      { cle: 'nombres', libelle: 'Premier nombre', choix: [['11-19', 'De 11 à 19'], ['11-99', 'De 11 à 99']], defaut: n === 'CE1' ? '11-19' : '11-99' },
      { cle: 'aide', libelle: 'Étape', choix: [['etape', 'Avec la décomposition écrite'], ['sans', 'Sans l’étape']], defaut: 'etape' },
    ],
    nombre: o => (o?.aide === 'etape' ? 12 : 24),
    fabriquer(o, n, rnd) {
      const exercices = tirerRes(o.nombre, rnd, () => {
        const a = entRes(rnd, 11, o.nombres === '11-19' ? 19 : 99), b = entRes(rnd, 2, 9), dz = a - a % 10, u = a % 10;
        if (!u) return null;
        return ligneRes([o.aide === 'etape' ? `${a} × ${b} = (${dz} × ${b}) + (${u} × ${b}) = ` : `${a} × ${b} = `, null], a * b);
      });
      return { consigne: 'Calcule en décomposant le premier nombre.', aide: 'Pour 13 × 7, je décompose 13 en 10 + 3 : (10 × 7) + (3 × 7) = 70 + 21 = 91.', disposition: 'ligne', exercices };
    },
  },
  multiplicationsPosees: {
    options: n => {
      const c3 = NIVEAUX_CYCLE_RES[3].includes(n);
      return [
        { cle: 'haut', libelle: 'Premier nombre', choix: [['2', '2 chiffres'], ['3', '3 chiffres'], ['4', '4 chiffres']], defaut: n === 'CE2' ? '2' : '3' },
        { cle: 'bas', libelle: 'Multiplié par', choix: [['1', 'un nombre à 1 chiffre'], ['2', 'un nombre à 2 chiffres']], defaut: n === 'CE2' ? '1' : '2' },
        ...(c3 ? [{ cle: 'decimales', libelle: 'Le premier nombre est', choix: [['0', 'un entier'], ['1', 'un décimal (1 chiffre après la virgule)'], ['2', 'un décimal (2 chiffres après la virgule)']], defaut: '0' }] : []),
      ];
    },
    nombre: () => 9,
    fabriquer(o, n, rnd) {
      const L = +o.haut, dec = +(o.decimales || 0);
      const exercices = tirerRes(o.nombre, rnd, () => {
        const a = entRes(rnd, 10 ** (L - 1), 10 ** L - 1), b = o.bas === '1' ? entRes(rnd, 2, 9) : entRes(rnd, 11, 99);
        if (b % 10 === 0 || (dec && a % 10 === 0)) return null;
        const partiels = b >= 10 ? [a * (b % 10), a * (b - b % 10)] : null; // (« règle des 0 » : 37 × 14 = 37 × 4 + 37 × 10)
        return { nombres: [a, b], op: '×', resultat: a * b, partiels, dec, decs: [dec, 0], cle: `${a}×${b}` };
      });
      return { consigne: 'Pose et calcule.', aide: o.bas === '2' ? 'Pour 37 × 14 : je calcule 37 × 4, puis 37 × 10 (j’écris le 0 des dizaines), et j’additionne.' : '',
        disposition: 'posee', exercices };
    },
  },
  divisionPotence: {
    options: n => [
      { cle: 'chiffres', libelle: 'Nombre à diviser', choix: [['2', '2 chiffres'], ['3', '3 chiffres'], ['4', '4 chiffres']], defaut: n === 'CM1' ? '3' : '4' },
      { cle: 'reste', libelle: 'Reste', choix: [['melange', 'Avec ou sans reste'], ['sans', 'Sans reste'], ['avec', 'Avec un reste']], defaut: 'melange' },
    ],
    nombre: () => 6,
    fabriquer(o, n, rnd) {
      const L = +o.chiffres;
      const exercices = tirerRes(o.nombre, rnd, () => {
        const b = entRes(rnd, 2, 9), sans = o.reste === 'melange' ? rnd() < 0.4 : o.reste === 'sans';
        let a;
        if (sans) { const q = entRes(rnd, Math.ceil(10 ** (L - 1) / b), Math.floor((10 ** L - 1) / b)); a = q * b; }
        else { a = entRes(rnd, 10 ** (L - 1), 10 ** L - 1); if (a % b === 0) return null; }
        if (a < 10 ** (L - 1) || a > 10 ** L - 1) return null;
        return { dividende: a, diviseur: b, quotient: Math.floor(a / b), reste: a % b, cle: `${a}:${b}` };
      });
      return { consigne: 'Pose et calcule la division. Écris l’égalité, puis vérifie avec la multiplication.', disposition: 'potence', exercices };
    },
  },
  divisionEnLigne: {
    options: n => [{ cle: 'diviseurs', libelle: 'Diviser par', choix: [['2-5', '2, 3, 4 ou 5'], ['2-9', 'de 2 à 9']], defaut: '2-9' }],
    nombre: () => 20,
    fabriquer(o, n, rnd) {
      const exercices = tirerRes(o.nombre, rnd, () => {
        const b = entRes(rnd, 2, o.diviseurs === '2-5' ? 5 : 9), q = entRes(rnd, 1, 10), r = entRes(rnd, 0, b - 1), a = b * q + r;
        return { parties: [`${a} = ${b} × `, null, ' + ', null], reponses: [String(q), String(r)], cle: `${a}=${b}` };
      });
      return { consigne: 'Complète de tête : le reste doit être plus petit que le nombre par lequel on divise.', aide: 'Exemple : 17 = 4 × 4 + 1 (dans 17, il y a 4 fois 4, et il reste 1).', disposition: 'ligne', exercices };
    },
  },
  vraisemblance: {
    options: n => [{ cle: 'op', libelle: 'Opérations', choix: [['melange', '+, – et × mélangés'], ['+', 'Additions'], ['-', 'Soustractions'], ['×', 'Multiplications']], defaut: 'melange' }],
    nombre: () => 10,
    fabriquer(o, n, rnd) {
      const exercices = tirerRes(o.nombre, rnd, () => {
        const op = o.op === 'melange' ? unRes(rnd, ['+', '-', '×']) : o.op;
        let a, b, c, faux;
        if (op === '+') { a = entRes(rnd, 120, 4999); b = entRes(rnd, 25, 2999); c = a + b; faux = [c + 10, c - 10, c + 100, c - 100, c * 10]; }
        else if (op === '-') { a = entRes(rnd, 120, 999); b = entRes(rnd, 15, a - 10); c = a - b; faux = [a + b, c + 10, c - 10, c + 100]; }
        else { a = entRes(rnd, 12, 450); b = entRes(rnd, 3, 29); c = a * b; faux = [c * 10, c + a, c - a, Math.round(c / 10)]; }
        faux = [...new Set(faux.filter(x => x > 0 && x !== c))];
        if (faux.length < 2) return null;
        const choix = [c, ...faux.sort(() => rnd() - 0.5).slice(0, 2)].sort(() => rnd() - 0.5), lettre = 'abc'[choix.indexOf(c)];
        return ligneRes([`${nbRes(a)} ${op === '-' ? MOINS_RES : op} ${nbRes(b)} : a) ${nbRes(choix[0])}   b) ${nbRes(choix[1])}   c) ${nbRes(choix[2])}   → `, null], lettre);
      });
      return { consigne: 'Sans poser l’opération, trouve le seul résultat possible (a, b ou c).', aide: 'Arrondis les nombres pour estimer : 124 – 88, c’est environ 120 – 90 = 30. Le résultat est donc proche de 30.',
        disposition: 'ligne', exercices };
    },
  },
  problemesMult: {
    options: n => {
      const c3 = NIVEAUX_CYCLE_RES[3].includes(n);
      return [{ cle: 'type', libelle: 'Problèmes', defaut: 'melange', choix: [['melange', 'Mélangés'], ['fois', 'Des parts égales : combien en tout ?'], ['partage', 'Partager : combien chacun ?'],
        ['groupement', 'Faire des paquets : combien de paquets ?'], ...(n === 'CP' || n === 'CE1' ? [] : [['comparaison', 'Comparer : fois plus, fois moins']]),
        ...(n === 'CE2' || c3 ? [['cartesien', 'Combien de possibilités ?']] : []), ...(n === 'CP' ? [] : [['mixte', 'En deux étapes']])] }];
    },
    nombre: () => 4,
    fabriquer(o, n, rnd) {
      const c3 = NIVEAUX_CYCLE_RES[3].includes(n);
      const tailles = n === 'CP' ? [2, 5, 10] : c3 ? [6, 8, 12, 15, 24, 25] : [2, 3, 4, 5, 6, 7, 8, 9, 10], maxG = n === 'CP' ? 5 : c3 ? 40 : 9;
      const gens = [['Léo', 'il'], ['Inès', 'elle'], ['Sami', 'il'], ['Lou', 'elle'], ['Noé', 'il'], ['Jade', 'elle'], ['Malo', 'il'], ['Nina', 'elle']];
      const objets = ['billes', 'images', 'crayons', 'perles', 'cartes', 'autocollants', 'gâteaux', 'œufs'];
      const de = mot => (/^[aeiouyhéœ]/i.test(mot) ? `d’${mot}` : `de ${mot}`);
      const types = ['fois', 'partage', 'groupement', ...(n === 'CP' || n === 'CE1' ? [] : ['comparaison']), ...(n === 'CE2' || c3 ? ['cartesien'] : []), ...(n === 'CP' ? [] : ['mixte'])];
      const fab = type => {
        const [p, il] = unRes(rnd, gens), obj = unRes(rnd, objets), t = unRes(rnd, tailles), g = entRes(rnd, 2, maxG);
        switch (type) {
          case 'fois': return rnd() < 0.5
            ? { texte: `Il y a ${g} boîtes de ${t} ${obj}. Combien y a-t-il ${de(obj)} en tout ?`, calcul: `${g} × ${t} = ${nbRes(g * t)}`, reponse: `${nbRes(g * t)} ${obj}` }
            : { texte: `Dans la salle, il y a ${g} rangées de ${t} chaises. Combien y a-t-il de chaises ?`, calcul: `${g} × ${t} = ${nbRes(g * t)}`, reponse: `${nbRes(g * t)} chaises` };
          case 'partage': return { texte: `${p} partage ${nbRes(g * t)} ${obj} entre ${g} amis. Chaque ami reçoit le même nombre ${de(obj)}. Combien en reçoit chacun ?`,
            calcul: `${nbRes(g * t)} ÷ ${g} = ${t}`, reponse: `${t} ${obj} chacun` };
          case 'groupement': {
            const r = c3 ? entRes(rnd, 0, t - 1) : 0, tot = g * t + r;
            return r ? { texte: `On range ${nbRes(tot)} ${obj} par paquets de ${t}. Combien de paquets complets peut-on faire ? Combien ${de(obj)} reste-t-il ?`,
              calcul: `${nbRes(tot)} = ${t} × ${g} + ${r}`, reponse: `${g} paquets, il reste ${r} ${obj}` }
              : { texte: `On range ${nbRes(tot)} ${obj} par paquets de ${t}. Combien de paquets peut-on faire ?`, calcul: `${nbRes(tot)} ÷ ${t} = ${g}`, reponse: `${g} paquets` };
          }
          case 'comparaison': {
            const [q] = unRes(rnd, gens.filter(x => x[0] !== p)), k = entRes(rnd, 2, c3 ? 6 : 4), a = entRes(rnd, 3, c3 ? 60 : 12), sens = unRes(rnd, ['plus', 'piege', 'moins']);
            if (sens === 'plus') return { texte: `${p} a ${a} ${obj}. ${q} en a ${k} fois plus. Combien ${de(obj)} a ${q} ?`, calcul: `${a} × ${k} = ${nbRes(a * k)}`, reponse: `${nbRes(a * k)} ${obj}` };
            // (Eduscol : l'élève doit apprendre à ne pas multiplier dès qu'il lit « fois »)
            if (sens === 'piege') return { texte: `${q} a ${nbRes(a * k)} ${obj}. ${q} a ${k} fois plus ${de(obj)} que ${p}. Combien ${de(obj)} a ${p} ?`, calcul: `${nbRes(a * k)} ÷ ${k} = ${a}`, reponse: `${a} ${obj}` };
            return { texte: `${p} a ${nbRes(a * k)} ${obj}. ${q} en a ${k} fois moins. Combien ${de(obj)} a ${q} ?`, calcul: `${nbRes(a * k)} ÷ ${k} = ${a}`, reponse: `${a} ${obj}` };
          }
          case 'cartesien': {
            const x = entRes(rnd, 2, c3 ? 8 : 5), y = entRes(rnd, 2, c3 ? 6 : 4);
            return rnd() < 0.5
              ? { texte: `${p} a ${x} tee-shirts et ${y} pantalons. Combien de tenues différentes peut-${il} composer avec un tee-shirt et un pantalon ?`, calcul: `${x} × ${y} = ${x * y}`, reponse: `${x * y} tenues` }
              : { texte: `Au marchand de glaces, il y a ${x} parfums et ${y} sortes de cornets. Combien de glaces différentes peut-on choisir, avec un parfum et un cornet ?`, calcul: `${x} × ${y} = ${x * y}`, reponse: `${x * y} glaces` };
          }
          default: { // mixte : une étape multiplicative, une étape additive
            const prix = entRes(rnd, 2, c3 ? 15 : 6), stylo = entRes(rnd, 1, c3 ? 9 : 5), nb = entRes(rnd, 2, c3 ? 12 : 6);
            if (rnd() < 0.5) return { texte: `${p} achète ${nb} cahiers à ${prix} € l’un et un stylo à ${stylo} €. Combien paie-t-${il} en tout ?`,
              calcul: `${nb} × ${prix} = ${nb * prix} ; ${nb * prix} + ${stylo} = ${nb * prix + stylo}`, reponse: `${nb * prix + stylo} €` };
            const reste = entRes(rnd, 1, c3 ? 30 : 9), tot = g * t + reste;
            return { texte: `La maîtresse a ${nbRes(tot)} images. Elle en donne ${t} à chacun de ses ${g} élèves. Combien d’images lui reste-t-il ?`,
              calcul: `${g} × ${t} = ${nbRes(g * t)} ; ${nbRes(tot)} ${MOINS_RES} ${nbRes(g * t)} = ${reste}`, reponse: `${reste} images` };
          }
        }
      };
      const exercices = tirerRes(o.nombre, rnd, () => fab(o.type === 'melange' ? unRes(rnd, types) : o.type));
      return { consigne: 'Lis le problème, représente-le (dessin ou schéma en barres), puis écris le calcul et la réponse par une phrase.', disposition: 'probleme', exercices };
    },
  },
  faitsAddition: {
    options: n => [
      { cle: 'type', libelle: 'Questions', choix: [['melange', 'Somme et nombre qui manque'], ['somme', 'Chercher la somme'], ['manque', 'Chercher le nombre qui manque']], defaut: n === 'CP' ? 'somme' : 'melange' },
      { cle: 'limite', libelle: 'Résultats jusqu’à', choix: [['10', '10'], ['20', '20']], defaut: n === 'CP' ? '10' : '20' },
    ],
    nombre: () => 24,
    fabriquer(o, n, rnd) {
      const lim = +o.limite;
      const exercices = tirerRes(o.nombre, rnd, () => {
        // (le 0 reste rare : quelques calculs pour l'élément neutre, pas un sur quatre)
        const a = rnd() < 0.06 ? 0 : entRes(rnd, 1, lim - 1), b = rnd() < 0.06 ? 0 : entRes(rnd, 1, Math.max(1, lim - a));
        if (a + b < 2 || a + b > lim) return null;
        const type = o.type === 'melange' ? unRes(rnd, ['somme', 'manque']) : o.type;
        if (type === 'somme') return ligneRes([`${a} + ${b} = `, null], a + b);
        return rnd() < 0.5 ? ligneRes([`${a} + `, null, ` = ${a + b}`], b) : ligneRes([null, ` + ${b} = ${a + b}`], a);
      });
      return { consigne: 'Calcule de tête, sans poser l’opération.', disposition: 'ligne', exercices };
    },
  },
  familles: {
    options: n => [{ cle: 'famille', libelle: 'Famille', defaut: 'melange', choix: [['suivants', 'Ajouter 1 ou 2 (le suivant)'], ['dix', '10 + un nombre'], ['doubles', 'Les doubles'],
      ['presque', 'Les presque-doubles'], ['complements', 'Les compléments à 10'], ['passage', 'Le passage par 10'], ['melange', 'Toutes mélangées']] }],
    nombre: () => 24,
    fabriquer(o, n, rnd) {
      const fab = f => {
        switch (f) {
          case 'suivants': { const a = entRes(rnd, 0, 18), b = entRes(rnd, 1, 2); return rnd() < 0.7 ? ligneRes([`${a} + ${b} = `, null], a + b) : ligneRes([`${b} + ${a} = `, null], a + b); }
          case 'dix': { const a = entRes(rnd, 0, 9); return rnd() < 0.5 ? ligneRes([`10 + ${a} = `, null], 10 + a) : ligneRes([`${a} + 10 = `, null], 10 + a); }
          case 'doubles': { const a = entRes(rnd, 1, 10); return ligneRes([`${a} + ${a} = `, null], 2 * a); }
          case 'presque': { const a = entRes(rnd, 1, 9); return rnd() < 0.5 ? ligneRes([`${a} + ${a + 1} = `, null], 2 * a + 1) : ligneRes([`${a + 1} + ${a} = `, null], 2 * a + 1); }
          case 'complements': { const a = entRes(rnd, 0, 10); return rnd() < 0.5 ? ligneRes([`${a} + `, null, ' = 10'], 10 - a) : ligneRes([null, ` + ${a} = 10`], 10 - a); }
          default: { const a = entRes(rnd, 5, 9), b = entRes(rnd, 11 - a, 9); return rnd() < 0.5 ? ligneRes([`${a} + ${b} = `, null], a + b) : ligneRes([`${b} + ${a} = `, null], a + b); }
        }
      };
      const familles = ['suivants', 'dix', 'doubles', 'presque', 'complements', 'passage'];
      const exercices = tirerRes(o.nombre, rnd, () => fab(o.famille === 'melange' ? unRes(rnd, familles) : o.famille));
      return { consigne: 'Calcule de tête.', disposition: 'ligne', exercices };
    },
  },
  doubles: {
    options: n => [
      { cle: 'quoi', libelle: 'Chercher', choix: [['melange', 'Doubles et moitiés'], ['doubles', 'Les doubles'], ['moities', 'Les moitiés']], defaut: 'melange' },
      { cle: 'max', libelle: 'Nombres jusqu’à', choix: [['20', '20'], ['50', '50'], ['100', '100']], defaut: n === 'CP' ? '20' : '100' },
    ],
    nombre: () => 20,
    fabriquer(o, n, rnd) {
      const max = +o.max;
      const exercices = tirerRes(o.nombre, rnd, () => {
        const quoi = o.quoi === 'melange' ? unRes(rnd, ['doubles', 'moities']) : o.quoi;
        // (au-delà de 20 : surtout des nombres « ronds » ou faciles, comme dans les attendus)
        const a = max <= 20 || rnd() < 0.4 ? entRes(rnd, 1, Math.floor(max / 2)) : unRes(rnd, [15, 20, 25, 30, 40, 50, 12, 11, 13, 21, 32, 45].filter(x => 2 * x <= max));
        return quoi === 'doubles' ? ligneRes([`le double de ${a} = `, null], 2 * a) : ligneRes([`la moitié de ${2 * a} = `, null], a);
      });
      return { consigne: 'Écris le double ou la moitié.', disposition: 'ligne', exercices };
    },
  },
  dizaines: {
    options: n => [
      { cle: 'op', libelle: 'Opération', choix: [['melange', 'Ajouter et retirer'], ['+', 'Ajouter'], ['-', 'Retirer']], defaut: n === 'CP' ? '+' : 'melange' },
      { cle: 'quoi', libelle: 'Ce qu’on ajoute ou retire', choix: [['10', '10'], ['dizaines', 'Des dizaines (20, 30… 90)'], ['centaines', 'Des centaines (100, 200…)']], defaut: n === 'CP' ? '10' : 'dizaines' },
    ],
    nombre: () => 24,
    fabriquer(o, n, rnd) {
      const max = Math.min(PLUS_GRAND_RES[n] || 999, o.quoi === 'centaines' ? 9999 : 999);
      const haut = o.quoi === 'centaines' ? Math.max(max, 999) : max;
      const exercices = tirerRes(o.nombre, rnd, () => {
        const d = o.quoi === '10' ? 10 : o.quoi === 'dizaines' ? 10 * entRes(rnd, 2, 9) : 100 * entRes(rnd, 1, 9);
        const op = o.op === 'melange' ? unRes(rnd, ['+', '-']) : o.op;
        if (op === '+') { if (haut - d < 1) return null; const a = entRes(rnd, 1, haut - d); return ligneRes([`${nbRes(a)} + ${nbRes(d)} = `, null], nbRes(a + d)); }
        if (haut < d) return null;
        const a = entRes(rnd, d, haut); return ligneRes([`${nbRes(a)} ${MOINS_RES} ${nbRes(d)} = `, null], nbRes(a - d));
      });
      return { consigne: 'Calcule de tête, en pensant aux dizaines et aux centaines.', disposition: 'ligne', exercices };
    },
  },
  presqueDizaine: {
    options: n => [
      { cle: 'nombres', libelle: 'Nombres', defaut: { CP: '9', CE1: '9-19-29', CE2: '8-39', CM1: '8-39', CM2: '8-99' }[n] || '9',
        choix: [['9', '9'], ['9-19-29', '9, 19, 29'], ['8-39', '8, 9, 18, 19, 28, 29, 38, 39'], ['8-99', '8, 9, 18, 19… 98, 99']] },
      { cle: 'op', libelle: 'Opération', choix: [['+', 'Ajouter'], ['-', 'Soustraire'], ['melange', 'Les deux']], defaut: '+' },
      { cle: 'aide', libelle: 'Étape', choix: [['etape', 'Avec l’étape écrite (+ 10 – 1)'], ['sans', 'Sans l’étape']], defaut: 'etape' },
    ],
    nombre: o => (o?.aide === 'etape' ? 14 : 24),
    fabriquer(o, n, rnd) {
      const liste = { 9: [9], '9-19-29': [9, 19, 29], '8-39': [8, 9, 18, 19, 28, 29, 38, 39] }[o.nombres]
        || Array.from({ length: 10 }, (_, k) => [10 * k + 8, 10 * k + 9]).flat();
      const max = Math.min(PLUS_GRAND_RES[n] || 999, 999);
      const exercices = tirerRes(o.nombre, rnd, () => {
        const d = unRes(rnd, liste), op = o.op === 'melange' ? unRes(rnd, ['+', '-']) : o.op, rond = d + (10 - d % 10);
        if (op === '+') {
          const a = entRes(rnd, 1, max - d);
          return ligneRes([o.aide === 'etape' ? `${a} + ${d} = ${a} + ${rond} ${MOINS_RES} ${rond - d} = ` : `${a} + ${d} = `, null], a + d);
        }
        const a = entRes(rnd, d + 1, max);
        return ligneRes([o.aide === 'etape' ? `${a} ${MOINS_RES} ${d} = ${a} ${MOINS_RES} ${rond} + ${rond - d} = ` : `${a} ${MOINS_RES} ${d} = `, null], a - d);
      });
      const exemple = o.op === '-' ? '62 – 9 = 62 – 10 + 1 = 53' : '47 + 9 = 47 + 10 – 1 = 56';
      return { consigne: 'Calcule de tête.', aide: o.op === '-' ? `Pour soustraire 9, j’enlève 10 puis je rajoute 1 : ${exemple}.` : `Pour ajouter 9, j’ajoute 10 puis j’enlève 1 : ${exemple}.`,
        disposition: 'ligne', exercices };
    },
  },
  complementDizaine: {
    options: n => [{ cle: 'cible', libelle: 'Aller jusqu’à', choix: [['dizaine', 'La dizaine suivante (37 → 40)'], ['centaine', 'La centaine suivante (370 → 400)']], defaut: 'dizaine' }],
    nombre: () => 24,
    fabriquer(o, n, rnd) {
      const exercices = tirerRes(o.nombre, rnd, () => {
        if (o.cible === 'centaine') { const a = 10 * entRes(rnd, 1, 98); if (a % 100 === 0) return null; const c = Math.ceil(a / 100) * 100; return ligneRes([`${a} + `, null, ` = ${c}`], c - a); }
        const a = entRes(rnd, 1, 98); if (a % 10 === 0) return null;
        const c = Math.ceil(a / 10) * 10; return ligneRes([`${a} + `, null, ` = ${c}`], c - a);
      });
      return { consigne: 'Écris le nombre qui manque.', disposition: 'ligne', exercices };
    },
  },
  posees: {
    options: n => {
      const c3 = NIVEAUX_CYCLE_RES[3].includes(n);
      return [
        { cle: 'op', libelle: 'Opération', choix: [['+', 'Additions'], ['-', 'Soustractions'], ['melange', 'Les deux']], defaut: '+' },
        { cle: 'chiffres', libelle: 'Nombres de', choix: [['2', '2 chiffres'], ['3', '3 chiffres'], ['4', '4 chiffres']], defaut: { CP: '2', CE1: '3', CE2: '4' }[n] || '4' },
        { cle: 'retenue', libelle: 'Retenue', choix: [['sans', 'Sans retenue'], ['avec', 'Avec retenue'], ['melange', 'Mélangé']], defaut: n === 'CP' ? 'sans' : 'melange' },
        { cle: 'termes', libelle: 'Additions de', choix: [['2', '2 nombres'], ['3', '3 nombres']], defaut: '2' },
        ...(c3 ? [{ cle: 'decimales', libelle: 'Chiffres après la virgule', choix: [['0', 'Aucun (entiers)'], ['1', '1'], ['2', '2']], defaut: '1' }] : []),
      ];
    },
    nombre: o => (+o?.decimales ? 12 : 16), // (une page)
    fabriquer(o, n, rnd) {
      const L = +o.chiffres, dec = +(o.decimales || 0);
      const chiffres = (x, l) => String(x).padStart(l, '0').split('').reverse().map(Number); // unités d'abord
      const nombreDe = l => entRes(rnd, l > 1 ? 10 ** (l - 1) : 1, 10 ** l - 1);
      const longueur = () => (L > 1 && rnd() < 0.25 ? L - 1 : L); // (parfois un nombre plus court : la colonne vide compte pour zéro)
      const addition = avecRetenue => {
        const k = +o.termes;
        if (!avecRetenue) { // construit colonne par colonne : somme des chiffres ≤ 9
          const longs = [L, ...Array.from({ length: k - 1 }, longueur)], nombres = longs.map(() => 0);
          for (let col = 0; col < L; col++) {
            let reste = 9;
            const actifs = longs.map((l, i) => (col < l ? i : -1)).filter(i => i >= 0);
            for (const i of actifs) {
              // (le premier chiffre d'un nombre n'est jamais 0 : on garde de quoi les poser pour les nombres suivants)
              const premier = col === longs[i] - 1 ? 1 : 0, besoin = actifs.filter(j => j > i && col === longs[j] - 1).length;
              const haut = Math.min(9, reste - besoin);
              if (haut < premier) return null;
              const ch = entRes(rnd, premier, haut);
              nombres[i] += ch * 10 ** col; reste -= ch;
            }
          }
          return nombres;
        }
        for (let essai = 0; essai < 50; essai++) {
          const nombres = [nombreDe(L), ...Array.from({ length: k - 1 }, () => nombreDe(longueur()))];
          const cols = nombres.map(x => chiffres(x, L));
          if ([...Array(L).keys()].some(c => cols.reduce((s, ch) => s + ch[c], 0) >= 10)) return nombres;
        }
        return null;
      };
      const soustraction = avecRetenue => {
        for (let essai = 0; essai < 80; essai++) {
          const a = nombreDe(L), b = nombreDe(longueur());
          if (b >= a) continue;
          const ca = chiffres(a, L), cb = chiffres(b, L), emprunte = ca.some((x, i) => x < cb[i]);
          if (emprunte === avecRetenue) return [a, b];
        }
        return null;
      };
      const exercices = tirerRes(o.nombre, rnd, () => {
        const op = o.op === 'melange' ? unRes(rnd, ['+', '-']) : o.op;
        const avec = o.retenue === 'melange' ? rnd() < 0.6 : o.retenue === 'avec';
        const nombres = op === '+' ? addition(avec) : soustraction(avec);
        if (!nombres) return null;
        const resultat = op === '+' ? nombres.reduce((s, x) => s + x, 0) : nombres[0] - nombres[1];
        return { nombres, op, resultat, dec, cle: op + nombres.join(',') };
      });
      return { consigne: 'Pose et calcule.', disposition: 'posee', exercices };
    },
  },
  problemes: {
    options: n => [{ cle: 'type', libelle: 'Problèmes', defaut: 'melange', choix: [['melange', 'Mélangés'], ['reunion', 'Réunir, ajouter'], ['reste', 'Retirer (ce qui reste)'],
      ['partie', 'Chercher une partie'], ...(n === 'CP' ? [] : [['comparaison', 'Comparer']]), ['etapes', 'En deux étapes']] }],
    nombre: () => 4, // (une page)
    fabriquer(o, n, rnd) {
      const max = { CP: 30, CE1: 100, CE2: 1000, CM1: 10000, CM2: 100000 }[n] || 100, petit = Math.max(2, Math.floor(max / 3));
      const gens = [['Léo', 'il'], ['Inès', 'elle'], ['Sami', 'il'], ['Lou', 'elle'], ['Noé', 'il'], ['Jade', 'elle'], ['Malo', 'il'], ['Nina', 'elle'], ['Yanis', 'il'], ['Zoé', 'elle']];
      const objets = ['billes', 'images', 'crayons', 'timbres', 'perles', 'cartes', 'coquillages', 'autocollants'];
      const lots = [['Dans un panier', 'pommes', 'poires'], ['Sur un parking', 'voitures', 'camions'], ['Dans une trousse', 'crayons', 'feutres'], ['Dans un bouquet', 'roses', 'tulipes'], ['Sur une étagère', 'livres', 'bandes dessinées']];
      const de = mot => (/^[aeiouyhéœ]/i.test(mot) ? `d’${mot}` : `de ${mot}`);
      const maj = t => t.charAt(0).toUpperCase() + t.slice(1);
      const types = n === 'CP' ? ['reunion', 'reste', 'partie'] : ['reunion', 'reste', 'partie', 'comparaison'];
      const fab = type => {
        const [p, il] = unRes(rnd, gens), obj = unRes(rnd, objets);
        switch (type) {
          case 'reunion': {
            const a = entRes(rnd, 2, max - 2), b = entRes(rnd, 1, Math.min(petit, max - a));
            return rnd() < 0.5
              ? { texte: `Dans une boîte, il y a ${nbRes(a)} ${obj}. ${p} en ajoute ${nbRes(b)}. Combien ${de(obj)} y a-t-il dans la boîte maintenant ?`, calcul: `${nbRes(a)} + ${nbRes(b)} = ${nbRes(a + b)}`, reponse: `${nbRes(a + b)} ${obj}` }
              : { texte: `Il y a ${nbRes(a)} ${obj} dans une boîte et ${nbRes(b)} dans un sac. Combien ${de(obj)} y a-t-il en tout ?`, calcul: `${nbRes(a)} + ${nbRes(b)} = ${nbRes(a + b)}`, reponse: `${nbRes(a + b)} ${obj}` };
          }
          case 'reste': {
            const a = entRes(rnd, 5, max), b = entRes(rnd, 1, Math.min(a - 1, petit));
            return { texte: `${p} a ${nbRes(a)} ${obj}. ${maj(il)} en donne ${nbRes(b)} à un ami. Combien ${de(obj)} reste-t-il à ${p} ?`, calcul: `${nbRes(a)} ${MOINS_RES} ${nbRes(b)} = ${nbRes(a - b)}`, reponse: `${nbRes(a - b)} ${obj}` };
          }
          case 'partie': {
            const [lieu, x, y] = unRes(rnd, lots), t = entRes(rnd, 5, max), a = entRes(rnd, 1, t - 1);
            return { texte: `${lieu}, il y a des ${x} et des ${y} : ${nbRes(t)} en tout. Il y a ${nbRes(a)} ${x}. Combien y a-t-il ${de(y)} ?`, calcul: `${nbRes(t)} ${MOINS_RES} ${nbRes(a)} = ${nbRes(t - a)}`, reponse: `${nbRes(t - a)} ${y}` };
          }
          case 'comparaison': {
            const [q, il2] = unRes(rnd, gens.filter(g => g[0] !== p)), a = entRes(rnd, 5, max - 2), d = entRes(rnd, 1, Math.min(petit, max - a)), sens = unRes(rnd, ['plus', 'moins', 'ecart']);
            if (sens === 'plus') return { texte: `${p} a ${nbRes(a)} ${obj}. ${q} en a ${nbRes(d)} de plus que ${p}. Combien ${de(obj)} a ${q} ?`, calcul: `${nbRes(a)} + ${nbRes(d)} = ${nbRes(a + d)}`, reponse: `${nbRes(a + d)} ${obj}` };
            if (sens === 'moins' && d < a) return { texte: `${p} a ${nbRes(a)} ${obj}. ${q} en a ${nbRes(d)} de moins que ${p}. Combien ${de(obj)} a ${q} ?`, calcul: `${nbRes(a)} ${MOINS_RES} ${nbRes(d)} = ${nbRes(a - d)}`, reponse: `${nbRes(a - d)} ${obj}` };
            return { texte: `${p} a ${nbRes(a)} ${obj} et ${q} en a ${nbRes(a + d)}. Combien ${de(obj)} ${q} a-t-${il2} de plus que ${p} ?`, calcul: `${nbRes(a + d)} ${MOINS_RES} ${nbRes(a)} = ${nbRes(d)}`, reponse: `${nbRes(d)} ${obj} de plus` };
          }
          default: { // deux étapes
            if (rnd() < 0.5) {
              const a = entRes(rnd, 5, max - 2), b = entRes(rnd, 1, Math.min(petit, max - a)), c = entRes(rnd, 1, a + b - 1);
              return { texte: `Dans un bus, il y a ${nbRes(a)} passagers. Au premier arrêt, ${nbRes(b)} personnes montent. Au deuxième arrêt, ${nbRes(c)} personnes descendent. Combien de passagers y a-t-il maintenant dans le bus ?`,
                calcul: `${nbRes(a)} + ${nbRes(b)} = ${nbRes(a + b)} ; ${nbRes(a + b)} ${MOINS_RES} ${nbRes(c)} = ${nbRes(a + b - c)}`, reponse: `${nbRes(a + b - c)} passagers` };
            }
            const a = entRes(rnd, 10, max), b = entRes(rnd, 1, Math.floor(a / 2)), c = entRes(rnd, 1, a - b - 1 || 1);
            if (a - b - c < 0) return null;
            return { texte: `${p} a ${nbRes(a)} €. ${maj(il)} achète un livre à ${nbRes(b)} € et un jeu à ${nbRes(c)} €. Combien d’euros lui reste-t-il ?`,
              calcul: `${nbRes(b)} + ${nbRes(c)} = ${nbRes(b + c)} ; ${nbRes(a)} ${MOINS_RES} ${nbRes(b + c)} = ${nbRes(a - b - c)}`, reponse: `${nbRes(a - b - c)} €` };
          }
        }
      };
      const exercices = tirerRes(o.nombre, rnd, () => fab(o.type === 'melange' ? unRes(rnd, types) : o.type));
      return { consigne: 'Lis le problème, cherche dans le cadre, puis écris la réponse par une phrase.', disposition: 'probleme', exercices };
    },
  },
  // --- Fractions (d'après Eduscol : livret CE1 2025, exemples de mise en œuvre pour l'enseignement des fractions du CE1 au CM2,
  //     livret CM2 2026, « Fractions et nombres décimaux au cycle 3 ») ---
  fractionsFigures: {
    options: n => {
      const c3 = NIVEAUX_CYCLE_RES[3].includes(n);
      return [
        { cle: 'type', libelle: 'Exercices', choix: [['melange', 'Écrire et colorier'], ['lire', 'Écrire la fraction coloriée'], ['colorier', 'Colorier la fraction demandée']], defaut: 'melange' },
        { cle: 'fractions', libelle: 'Fractions', defaut: n === 'CE1' || n === 'CP' ? 'unitaires' : c3 ? 'plus1' : 'moins1',
          choix: [['unitaires', 'Un demi, un tiers, un quart… (numérateur 1)'], ['moins1', 'Plus petites que 1 ou égales à 1'], ...(c3 ? [['plus1', 'Aussi plus grandes que 1']] : [])] },
      ];
    },
    nombre: () => 9,
    fabriquer(o, n, rnd) {
      const dens = n === 'CE1' || n === 'CP' ? DENOMINATEURS_RES.CE1 : DENOMINATEURS_RES.CE2;
      const exercices = tirerRes(o.nombre, rnd, () => {
        const d = unRes(rnd, dens), plus = o.fractions === 'plus1' && rnd() < 0.5;
        const num = o.fractions === 'unitaires' ? 1 : plus ? entRes(rnd, d + 1, 2 * d) : entRes(rnd, 1, d);
        // (plus grande que 1 : plusieurs bandes-unités ; sinon une bande, un disque ou un rectangle quadrillé, parts coloriées dispersées)
        const forme = unRes(rnd, plus ? ['bande'] : ['bande', 'disque', ...(GRILLES_RES[d] ? ['rectangle', 'rectangle'] : [])]);
        const cases = forme === 'rectangle' ? [...Array(d).keys()].sort(() => rnd() - 0.5).slice(0, num).sort((a, b) => a - b) : [...Array(num).keys()];
        const tache = o.type === 'melange' ? unRes(rnd, ['lire', 'colorier']) : o.type;
        return { figure: { forme, d, unites: Math.ceil(num / d), cases }, tache, fraction: [num, d], lecture: fractionEnLettresRes(num, d), cle: `${tache}${forme}${num}/${d}/${cases}` };
      });
      const consigne = { lire: 'Écris la fraction de la figure qui est coloriée.', colorier: 'Colorie la fraction de la figure qui est demandée.' }[o.type]
        || 'Écris la fraction coloriée, ou colorie la fraction demandée.';
      return { consigne, aide: 'Le nombre du bas dit en combien de parts égales le tout est partagé, le nombre du haut combien de parts on prend : 3/8 se lit « trois huitièmes ».', disposition: 'figures', exercices };
    },
  },
  fractionsLettres: {
    options: n => {
      const c3 = NIVEAUX_CYCLE_RES[3].includes(n);
      return [
        { cle: 'sens', libelle: 'Écrire', choix: [['chiffres', 'En chiffres (la fraction est écrite en lettres)'], ['lettres', 'En lettres (la fraction est écrite en chiffres)'], ['melange', 'Les deux']], defaut: 'chiffres' },
        { cle: 'fractions', libelle: 'Fractions', defaut: n === 'CE1' || n === 'CP' ? 'unitaires' : c3 ? 'plus1' : 'moins1', choix: [['unitaires', 'Numérateur 1 (un tiers, un quart…)'],
          ['moins1', 'Plus petites que 1 ou égales à 1'], ...(c3 ? [['plus1', 'Aussi plus grandes que 1'], ['decimales', 'Fractions décimales (dixièmes, centièmes…)']] : [])] },
      ];
    },
    nombre: () => 14,
    fabriquer(o, n, rnd) {
      const dens = DENOMINATEURS_RES[n] || DENOMINATEURS_RES.CE1;
      const exercices = tirerRes(o.nombre, rnd, () => {
        let num, d;
        if (o.fractions === 'decimales') { d = unRes(rnd, n === 'CM2' ? [10, 100, 1000] : [10, 100]); num = entRes(rnd, 1, d === 10 ? 59 : d === 100 ? 450 : 2500); }
        else { d = unRes(rnd, dens); num = o.fractions === 'unitaires' ? 1 : o.fractions === 'plus1' ? entRes(rnd, 1, 3 * d) : entRes(rnd, 1, d); }
        const sens = o.sens === 'melange' ? unRes(rnd, ['chiffres', 'lettres']) : o.sens;
        return sens === 'chiffres' ? { parties: [`${fractionEnLettresRes(num, d)} → `, null], reponse: fracRes(num, d), cle: `c${num}/${d}` }
          : { parties: [fracRes(num, d), '  → ', null], reponse: fractionEnLettresRes(num, d), longue: true, cle: `l${num}/${d}` };
      });
      return { consigne: 'Écris chaque fraction de l’autre façon.', aide: 'On lit 3/8 « trois huitièmes », et pas « trois sur huit » : le tout est partagé en huit parts égales, on en prend trois.', disposition: 'ligne', exercices };
    },
  },
  comparerFractions: {
    options: n => {
      const c3 = NIVEAUX_CYCLE_RES[3].includes(n), ce1 = n === 'CE1' || n === 'CP';
      return [{ cle: 'type', libelle: 'Exercices', defaut: 'melange', choix: [['memeDen', 'Même dénominateur (2/5 et 3/5)'], ['unitaires', 'Numérateur 1 (1/5 et 1/3)'],
        ...(ce1 ? [] : [['memeNum', 'Même numérateur (5/12 et 5/8)'], ['multiple', 'Un dénominateur multiple de l’autre (7/12 et 5/6)']]),
        ...(c3 ? [['unite', 'Comparer à 1 (7/4 et 1)']] : []), ['melange', 'Tout mélangé']] }];
    },
    nombre: () => 18,
    fabriquer(o, n, rnd) {
      const c3 = NIVEAUX_CYCLE_RES[3].includes(n), ce1 = n === 'CE1' || n === 'CP', dens = DENOMINATEURS_RES[n] || DENOMINATEURS_RES.CE1;
      const types = ['memeDen', 'unitaires', ...(ce1 ? [] : ['memeNum', 'multiple', 'multiple']), ...(c3 ? ['unite'] : [])];
      const num = d => entRes(rnd, 1, c3 ? 2 * d : d); // (au cycle 2, fractions plus petites que 1 ou égales à 1)
      const exercices = tirerRes(o.nombre, rnd, () => {
        const type = o.type === 'melange' ? unRes(rnd, types) : o.type;
        let a, b, c, e;
        if (type === 'unite') {
          b = unRes(rnd, dens); a = rnd() < 0.1 ? b : entRes(rnd, 1, 2 * b);
          return { parties: [fracRes(a, b), '  ', null, '  1'], reponse: a < b ? '<' : a > b ? '>' : '=', cle: `${a}/${b}?1` };
        }
        if (type === 'memeDen') { b = e = unRes(rnd, dens); a = num(b); c = rnd() < 0.08 ? a : num(b); }
        else if (type === 'unitaires') { a = c = 1; b = unRes(rnd, dens); e = unRes(rnd, dens); }
        else if (type === 'memeNum') { b = unRes(rnd, dens); e = unRes(rnd, dens); a = c = entRes(rnd, 2, Math.max(2, c3 ? 2 * Math.min(b, e) : Math.min(b, e))); }
        else { const [p, q] = unRes(rnd, pairesMultiplesRes(dens)); [b, e] = rnd() < 0.5 ? [p, q] : [q, p]; a = num(b); c = num(e); }
        const g = a * e, h = c * b;
        return { parties: [fracRes(a, b), '  ', null, '  ', fracRes(c, e)], reponse: g < h ? '<' : g > h ? '>' : '=', cle: `${a}/${b}?${c}/${e}` };
      });
      return { consigne: 'Complète avec <, > ou =.', aide: ce1 ? 'Même dénominateur : je compare le nombre de parts (2/5 < 3/5). Numérateur 1 : plus il y a de parts, plus elles sont petites (1/5 < 1/3).'
        : 'Même dénominateur : je compare le nombre de parts. Même numérateur : plus les parts sont petites, plus la fraction est petite. Sinon, je change une fraction : 5/6 = 10/12.', disposition: 'ligne', exercices };
    },
  },
  calculFractions: {
    options: n => {
      const ce1 = n === 'CE1' || n === 'CP';
      return [
        { cle: 'op', libelle: 'Opération', choix: [['melange', 'Additions et soustractions'], ['+', 'Additions'], ['-', 'Soustractions']], defaut: 'melange' },
        { cle: 'type', libelle: 'Fractions', defaut: 'melange', choix: [['memeDen', 'Même dénominateur (3/8 + 2/8)'], ...(ce1 ? [] : [['multiple', 'Un dénominateur multiple de l’autre (3/4 + 1/2)']]),
          ['complement', 'Compléter jusqu’à 1 (1 – 3/10)'], ...(n === 'CM2' ? [['fois', 'Un entier fois une fraction (3 × 5/4)']] : []), ['melange', 'Tout mélangé']] },
      ];
    },
    nombre: () => 18,
    fabriquer(o, n, rnd) {
      const c3 = NIVEAUX_CYCLE_RES[3].includes(n), ce1 = n === 'CE1' || n === 'CP', dens = DENOMINATEURS_RES[n] || DENOMINATEURS_RES.CE1;
      const types = ['memeDen', 'memeDen', 'complement', ...(ce1 ? [] : ['multiple', 'multiple']), ...(n === 'CM2' ? ['fois'] : [])];
      const exercices = tirerRes(o.nombre, rnd, () => {
        const type = o.type === 'melange' ? unRes(rnd, types) : o.type;
        const op = o.op === 'melange' ? unRes(rnd, ['+', '-']) : o.op;
        if (type === 'fois') { const b = unRes(rnd, dens.filter(x => x <= 10)), a = entRes(rnd, 1, 2 * b), k = entRes(rnd, 2, 6); return { parties: [`${k} × `, fracRes(a, b), ' = ', null], reponse: fracRes(k * a, b), cle: `${k}x${a}/${b}` }; }
        if (type === 'complement') {
          const b = unRes(rnd, dens), a = entRes(rnd, 1, b - 1);
          return op === '-' ? { parties: [`1 ${MOINS_RES} `, fracRes(a, b), ' = ', null], reponse: fracRes(b - a, b), cle: `1-${a}/${b}` }
            : { parties: [fracRes(a, b), ' + ', null, ' = 1'], reponse: fracRes(b - a, b), cle: `${a}/${b}+?=1` };
        }
        let b, e;
        if (type === 'memeDen') b = e = unRes(rnd, dens);
        else { const [p, q] = unRes(rnd, pairesMultiplesRes(dens)); [b, e] = rnd() < 0.5 ? [p, q] : [q, p]; }
        const D = Math.max(b, e), a = entRes(rnd, 1, c3 ? 2 * b : b), c = entRes(rnd, 1, c3 ? 2 * e : e), A = a * D / b, C = c * D / e;
        const res = op === '+' ? A + C : A - C;
        if (res <= 0 || (!c3 && res > D)) return null; // (au cycle 2 : résultat plus petit que 1 ou égal à 1)
        return { parties: [fracRes(a, b), op === '+' ? ' + ' : ` ${MOINS_RES} `, fracRes(c, e), ' = ', null], reponse: fracRes(res, D), cle: `${a}/${b}${op}${c}/${e}` };
      });
      return { consigne: 'Calcule. Écris le résultat avec une seule fraction.', aide: ce1 ? 'Je compte les parts comme des objets : 3 huitièmes + 2 huitièmes = 5 huitièmes.'
        : 'Je compte les parts comme des objets : 3 quarts + 2 quarts = 5 quarts. Dénominateurs différents : je change d’abord une fraction (1 demi = 2 quarts).', disposition: 'ligne', exercices };
    },
  },
  egalitesFractions: {
    options: n => (NIVEAUX_CYCLE_RES[3].includes(n) ? [{ cle: 'trou', libelle: 'Nombre à trouver', choix: [['melange', 'Le numérateur ou le dénominateur'], ['num', 'Le numérateur (1/2 = …/8)'], ['den', 'Le dénominateur (21/… = 7/3)']], defaut: 'melange' }]
      : [{ cle: 'trou', libelle: 'Nombre à trouver', choix: [['num', 'Le numérateur (1/2 = …/8)']], defaut: 'num' }]),
    nombre: () => 18,
    fabriquer(o, n, rnd) {
      const c3 = NIVEAUX_CYCLE_RES[3].includes(n), max = { CM1: 20, CM2: 60 }[n] || 12, bases = c3 ? [2, 3, 4, 5, 6, 7, 8, 10] : [2, 3, 4, 5, 6];
      const exercices = tirerRes(o.nombre, rnd, () => {
        const b = unRes(rnd, bases), a = entRes(rnd, 1, c3 ? 2 * b - 1 : b), k = entRes(rnd, 2, Math.floor(max / b));
        if (b * k > max || k < 2) return null;
        const trou = o.trou === 'melange' ? unRes(rnd, ['num', 'den']) : o.trou, grandDabord = rnd() < 0.4;
        if (trou === 'num') return grandDabord ? { parties: [fracRes(a * k, b * k), ' = ', fracRes(null, b)], reponses: [String(a)], cle: `n${a * k}/${b * k}=${b}` }
          : { parties: [fracRes(a, b), ' = ', fracRes(null, b * k)], reponses: [String(a * k)], cle: `n${a}/${b}=${b * k}` };
        return grandDabord ? { parties: [fracRes(a * k, null), ' = ', fracRes(a, b)], reponses: [String(b * k)], cle: `d${a * k}=${a}/${b}` }
          : { parties: [fracRes(a, b), ' = ', fracRes(a * k, null)], reponses: [String(b * k)], cle: `d${a}/${b}=${a * k}` };
      });
      return { consigne: 'Complète pour que les deux fractions soient égales.', aide: 'Des parts deux fois plus petites, il en faut deux fois plus : 1/2 = 2/4 = 4/8.', disposition: 'ligne', exercices };
    },
  },
  fractionEntier: {
    options: n => [{ cle: 'type', libelle: 'Exercices', defaut: 'melange', choix: [['decomposer', 'Un entier + une fraction (7/4 = 1 + 3/4)'], ['recomposer', 'Une seule fraction (2 + 2/3 = 8/3)'],
      ['encadrer', 'Encadrer entre deux entiers (5 < 16/3 < 6)'], ['melange', 'Tout mélangé']] }],
    nombre: () => 15,
    fabriquer(o, n, rnd) {
      const dens = n === 'CM2' ? [2, 3, 4, 5, 6, 7, 8, 9, 10] : [2, 3, 4, 5, 6, 8, 10];
      const exercices = tirerRes(o.nombre, rnd, () => {
        const type = o.type === 'melange' ? unRes(rnd, ['decomposer', 'recomposer', 'encadrer']) : o.type;
        const b = unRes(rnd, dens), e = entRes(rnd, rnd() < 0.15 ? 0 : 1, n === 'CM2' ? 9 : 5), r = entRes(rnd, 1, b - 1), a = e * b + r;
        if (type === 'decomposer') return e ? { parties: [fracRes(a, b), ' = ', null, ' + ', fracRes(null, b)], reponses: [String(e), String(r)], cle: `d${a}/${b}` } : null;
        if (type === 'recomposer') return e ? { parties: [`${e} + `, fracRes(r, b), ' = ', fracRes(null, b)], reponses: [String(a)], cle: `r${e}+${r}/${b}` } : null;
        return { parties: [null, ' < ', fracRes(a, b), ' < ', null], reponses: [String(e), String(e + 1)], cle: `e${a}/${b}` };
      });
      return { consigne: 'Complète.', aide: '7/4, c’est 4 quarts et encore 3 quarts. Comme 4/4 = 1 : 7/4 = 1 + 3/4. Donc 7/4 est entre 1 et 2.', disposition: 'ligne', exercices };
    },
  },
  fractionQuantite: {
    options: n => [{ cle: 'fractions', libelle: 'Fractions', choix: [['unitaires', 'Numérateur 1 (un tiers de 12 œufs)'], ['toutes', 'Toutes (deux tiers de 12 œufs)']], defaut: n === 'CM1' ? 'unitaires' : 'toutes' }],
    nombre: () => 14,
    fabriquer(o, n, rnd) {
      const dens = n === 'CM2' ? [2, 3, 4, 5, 6, 8, 10] : [2, 3, 4, 5, 10];
      // (quantités et grandeurs, d'après les exemples Eduscol : douze œufs, 500 g de farine, 60 kg de sable, 10 m, une heure)
      const lots = [['œufs', 12, 36], ['billes', 10, 80], ['€', 10, 200], ['m', 10, 100], ['kg', 10, 120], ['g', 100, 1000], ['élèves', 10, 30], ['cm', 10, 100], ['L', 10, 60]];
      const exercices = tirerRes(o.nombre, rnd, () => {
        const b = unRes(rnd, dens), a = o.fractions === 'unitaires' ? 1 : entRes(rnd, 1, b - 1);
        if (rnd() < 0.15 && 60 % b === 0) return { parties: [fracRes(a, b), ' d’heure = ', null, ' min'], reponse: String(60 / b * a), cle: `h${a}/${b}` };
        const [u, mini, maxi] = unRes(rnd, lots), pasQ = u === 'g' ? 50 : 1;
        const q = b * pasQ * entRes(rnd, Math.ceil(mini / b / pasQ), Math.floor(maxi / b / pasQ));
        if (!q) return null;
        return { parties: [fracRes(a, b), ` de ${nbRes(q)} ${u} = `, null, ` ${u}`], reponse: nbRes(q / b * a), cle: `${a}/${b}de${q}${u}` };
      });
      return { consigne: 'Calcule.', aide: 'Pour 2/3 de 12 œufs : je partage 12 en 3 parts égales (4 œufs), puis j’en prends 2 : 8 œufs.', disposition: 'ligne', exercices };
    },
  },
  droiteFractions: {
    options: n => [
      { cle: 'type', libelle: 'Exercices', choix: [['melange', 'Lire et placer'], ['lire', 'Trouver les nombres marqués A, B, C'], ['placer', 'Placer des fractions']], defaut: 'melange' },
      ...(NIVEAUX_CYCLE_RES[3].includes(n) ? [{ cle: 'ecriture', libelle: 'Écrire', choix: [['melange', 'Les deux écritures'], ['fraction', 'Une fraction (7/4)'], ['somme', 'Un entier + une fraction (1 + 3/4)']], defaut: 'melange' }] : []),
    ],
    nombre: () => 4,
    fabriquer(o, n, rnd) {
      const c3 = NIVEAUX_CYCLE_RES[3].includes(n), dens = c3 ? [2, 3, 4, 5, 6, 8, 10] : [2, 4, 10]; // (CE2 : règle graduée en demis, quarts, dixièmes)
      const exercices = tirerRes(o.nombre, rnd, () => {
        const d = unRes(rnd, dens), U = c3 ? Math.min(3, Math.max(1, Math.floor(20 / d))) : d === 10 ? 1 : 2, N = U * d;
        const debut = c3 && rnd() < 0.4 ? entRes(rnd, 1, 4) : 0; // (la demi-droite ne commence pas toujours à 0)
        const type = o.type === 'melange' ? unRes(rnd, ['lire', 'placer']) : o.type;
        const libres = [...Array(N + 1).keys()].filter(j => j % d).sort(() => rnd() - 0.5).slice(0, 3).sort((x, y) => x - y);
        if (libres.length < 3) return null;
        const ecrire = t => { // (t : nombre de parts depuis 0)
          const forme = !c3 ? (t < d ? 'fraction' : 'somme') : o.ecriture === 'melange' || !o.ecriture ? unRes(rnd, ['fraction', 'somme']) : o.ecriture;
          return forme === 'fraction' || t < d ? fracRes(t, d) : [`${Math.floor(t / d)} + `, fracRes(t % d, d)];
        };
        const textes = [...Array(N + 1).keys()].map(j => (j % d ? null : String(debut + j / d)));
        return { droite: { n: N, textes, grands: textes.map((t, j) => (t === null ? -1 : j)).filter(j => j >= 0), etage: true, type,
          resume: `Unité partagée en ${d} parts égales`, points: libres.map((j, k) => ({ i: j, lettre: 'ABC'[k], texte: ecrire(debut * d + j) })) }, cle: `${d}/${debut}/${libres}` };
      });
      return { consigne: 'L’unité est partagée en parts égales : compte-les, puis lis ou place les fractions.', aide: c3 ? 'Si l’unité est partagée en 4, chaque graduation avance d’un quart : 7/4 = 1 + 3/4, c’est 3 graduations après le 1.'
        : 'Si l’unité est partagée en 4, chaque graduation avance d’un quart d’unité.', disposition: 'droite', exercices };
    },
  },
  // --- Nombres décimaux (d'après Eduscol : « Fractions et nombres décimaux au cycle 3 », exemples de réussite CM1 et CM2,
  //     évaluations de début de CM2 2026) ---
  fractionsDecimales: {
    options: n => [{ cle: 'type', libelle: 'Exercices', defaut: 'melange', choix: [['versVirgule', 'Fraction décimale → écriture à virgule (37/100 = 0,37)'],
      ['versFraction', 'Écriture à virgule → fraction décimale (3,58 = 358/100)'], ['decomposer', 'Décomposer (3,58 = 3 + 5/10 + 8/100)'],
      ['entierFraction', 'Un entier + une fraction (358/100 = 3 + 58/100)'], ['unites', 'Unités, dixièmes, centièmes (36 dixièmes = 3 unités et 6 dixièmes)'],
      ['usuelles', 'Fractions usuelles (1/2 = 0,5 ; 1/4 = 25/100)'], ['melange', 'Tout mélangé']] }],
    nombre: () => 12, // (fractions en étage : une page)
    fabriquer(o, n, rnd) {
      const P = n === 'CM2' ? 3 : 2, DEN = [1, 10, 100, 1000], NOMS = ['unités', 'dixièmes', 'centièmes', 'millièmes'];
      // Nombre de q chiffres après la virgule, le dernier jamais nul ; `pleins` : aucun 0 après la virgule.
      const nombre = (q, pleins = false) => {
        const e = rnd() < 0.2 ? 0 : entRes(rnd, 1, rnd() < 0.7 ? 9 : 99);
        const ch = Array.from({ length: q }, (_, i) => (i === q - 1 || pleins ? entRes(rnd, 1, 9) : rnd() < 0.3 ? 0 : entRes(rnd, 0, 9)));
        return { e, ch, v: e * 10 ** q + ch.reduce((s, c) => s * 10 + c, 0) };
      };
      const exercices = tirerRes(o.nombre, rnd, () => {
        const type = o.type === 'melange' ? unRes(rnd, ['versVirgule', 'versFraction', 'decomposer', 'entierFraction', 'unites', 'usuelles']) : o.type, q = entRes(rnd, 1, P);
        if (type === 'versVirgule') {
          const { e, ch, v } = nombre(q);
          if (rnd() < 0.5) return { parties: [fracRes(v, DEN[q]), ' = ', null], reponse: decimalRes(v, q), cle: `v${v}/${q}` };
          const termes = ch.map((c, i) => (c ? fracRes(c, DEN[i + 1]) : null)).filter(Boolean);
          return { parties: [...(e ? [`${nbRes(e)} + `] : []), ...termes.flatMap((t, i) => (i ? [' + ', t] : [t])), ' = ', null], reponse: decimalRes(v, q), cle: `s${v}/${q}` };
        }
        if (type === 'versFraction') { const { v } = nombre(q); return { parties: [`${decimalRes(v, q)} = `, fracRes(null, DEN[q])], reponses: [nbRes(v)], cle: `f${v}/${q}` }; }
        if (type === 'decomposer') {
          const { e, ch, v } = nombre(q, true);
          return { parties: [`${decimalRes(v, q)} = `, null, ...ch.flatMap((_, i) => [' + ', fracRes(null, DEN[i + 1])])], reponses: [nbRes(e), ...ch.map(String)], cle: `d${v}/${q}` };
        }
        if (type === 'entierFraction') {
          const { e, v } = nombre(q), r = v - e * 10 ** q;
          return e ? { parties: [fracRes(v, DEN[q]), ' = ', null, ' + ', fracRes(null, DEN[q])], reponses: [nbRes(e), nbRes(r)], cle: `e${v}/${q}` } : null;
        }
        if (type === 'unites') {
          const forme = unRes(rnd, ['eclater', 'enTout', 'relation', 'enUnites']);
          if (forme === 'eclater') { const t = entRes(rnd, 11, 199); if (t % 10 === 0) return null; return { parties: [`${t} dixièmes = `, null, ' unités et ', null, ' dixièmes'], reponses: [String(Math.floor(t / 10)), String(t % 10)], cle: `x${t}` }; }
          if (forme === 'enTout') { const { v } = nombre(q); if (q < 2) return null; const r = entRes(rnd, 1, q - 1); return { parties: [`Dans ${decimalRes(v, q)}, combien de ${NOMS[r]} en tout ? `, null], reponse: nbRes(Math.floor(v / 10 ** (q - r))), cle: `t${v}/${q}/${r}` }; }
          if (forme === 'enUnites') { const { v } = nombre(q); return { parties: [`${decimalRes(v, q)} = `, null, ` ${NOMS[q]}`], reponse: nbRes(v), cle: `u${v}/${q}` }; }
          const i = entRes(rnd, 0, P - 1), j = entRes(rnd, i + 1, P), x = rnd() < 0.5 ? 1 : entRes(rnd, 2, 9);
          const sing = (k, c) => (c === 1 ? NOMS[k].replace(/s$/, '') : NOMS[k]);
          return rnd() < 0.5 ? { parties: [`${x} ${sing(i, x)} = `, null, ` ${NOMS[j]}`], reponse: nbRes(x * 10 ** (j - i)), cle: `r${x}/${i}/${j}` }
            : { parties: [`${nbRes(x * 10 ** (j - i))} ${NOMS[j]} = `, null, ` ${sing(i, x)}`], reponse: String(x), cle: `R${x}/${i}/${j}` };
        }
        // Fractions usuelles et leur écriture décimale (CM1 : 1/10, 1/100, et 1/2, 1/4 avec 1 ; CM2 : aussi 3/4, 3/2, 5/2, 1/1000…)
        const usuelles = [[1, 2, 5], [1, 10, 1], [1, 100, 1, 2], ...(P > 2 ? [[1, 4, 25, 2], [3, 4, 75, 2], [3, 2, 15], [5, 2, 25], [4, 2, 20], [1, 1000, 1, 3]] : [])];
        const forme = unRes(rnd, ['decimal', 'decimal', 'relation', 'egalite']);
        if (forme === 'decimal') { const [a, b, v, p = 1] = unRes(rnd, usuelles); return rnd() < 0.7 || v % 10 ** p === 0 ? { parties: [fracRes(a, b), ' = ', null], reponse: decimalRes(v, p), cle: `ud${a}/${b}` }
          : { parties: [`${decimalRes(v, p)} = `, null], reponse: fracRes(a, b), cle: `uf${a}/${b}` }; }
        if (forme === 'egalite') { const [a, b, c, e] = unRes(rnd, [[1, 2, 5, 10], [1, 2, 50, 100], [1, 4, 25, 100], [1, 10, 10, 100], ...(P > 2 ? [[3, 4, 75, 100], [1, 100, 10, 1000], [1, 10, 100, 1000], [1, 2, 2, 4]] : [[1, 2, 2, 4]])]);
          return { parties: [fracRes(a, b), ' = ', fracRes(null, e)], reponses: [String(c)], cle: `ue${a}/${b}/${e}` }; }
        // (relations entre 1/2, 1/4, 3/4 et 1 : 1/4 + 1/4 = 1/2 ; 1 – 1/4 = 3/4…)
        const rel = unRes(rnd, [[[fracRes(1, 2), ' + ', fracRes(1, 2)], 1, 1], [[fracRes(1, 4), ' + ', fracRes(1, 4)], 1, 2], [[`1 ${MOINS_RES} `, fracRes(1, 2)], 1, 2], [[`1 ${MOINS_RES} `, fracRes(1, 4)], 3, 4],
          [[fracRes(1, 2), ' + ', fracRes(1, 4)], 3, 4], [[fracRes(3, 4), ` ${MOINS_RES} `, fracRes(1, 2)], 1, 4], [[fracRes(1, 4), ' + ', fracRes(1, 4), ' + ', fracRes(1, 4), ' + ', fracRes(1, 4)], 1, 1]]);
        return { parties: [...rel[0], ' = ', null], reponse: rel[2] === 1 ? '1' : fracRes(rel[1], rel[2]), cle: `ur${JSON.stringify(rel)}` };
      });
      return { consigne: 'Complète.', aide: '3,58, c’est 3 unités, 5 dixièmes et 8 centièmes : 3 + 5/10 + 8/100 = 358/100. Dix centièmes font un dixième, dix dixièmes font une unité.', disposition: 'ligne', exercices };
    },
  },
  droiteDecimaux: {
    options: n => [
      { cle: 'type', libelle: 'Exercices', choix: [['melange', 'Lire et placer'], ['lire', 'Trouver les nombres marqués A, B, C'], ['placer', 'Placer des nombres']], defaut: 'melange' },
      { cle: 'pas', libelle: 'Graduée', defaut: 'auto', choix: [['auto', 'Selon le niveau'], ['100', 'De 0,1 en 0,1 (dixièmes)'], ['10', 'De 0,01 en 0,01 (centièmes)'],
        ...(n === 'CM2' ? [['1', 'De 0,001 en 0,001 (millièmes)']] : []), ['500', 'De 0,5 en 0,5']] },
      { cle: 'ecriture', libelle: 'Écrire les nombres', choix: [['virgule', 'Avec une virgule (1,7)'], ['fraction', 'En fractions décimales (17/10)'], ['melange', 'Les deux']], defaut: 'virgule' },
    ],
    nombre: o => (o?.ecriture === 'virgule' ? 5 : 4), // (fractions en étage : plus de place par demi-droite)
    fabriquer(o, n, rnd) {
      // (valeurs en millièmes)
      const pasNiveau = n === 'CM2' ? [100, 100, 10, 10, 1, 500] : [100, 100, 100, 10, 500];
      const exercices = tirerRes(o.nombre, rnd, () => {
        const p = o.pas === 'auto' ? unRes(rnd, pasNiveau) : +o.pas, type = o.type === 'melange' ? unRes(rnd, ['lire', 'placer']) : o.type;
        const fraction = o.ecriture === 'fraction' || (o.ecriture === 'melange' && rnd() < 0.5);
        const debut = p * entRes(rnd, 0, Math.floor({ 500: 20000, 100: 20000, 10: 30000, 1: 30000 }[p] / p));
        const ecrire = v => (!fraction ? decimalRes(v, 3) : p >= 100 ? fracRes(v / 100, 10) : p === 10 ? fracRes(v / 10, 100) : fracRes(v, 1000));
        const reperes = p === 500 ? [0, 2] : [0, unRes(rnd, [5, 10])];
        const libres = [...Array(11).keys()].filter(i => !reperes.includes(i)).sort(() => rnd() - 0.5).slice(0, 3).sort((a, b) => a - b);
        const textes = [...Array(11).keys()].map(j => (reperes.includes(j) ? ecrire(debut + j * p) : null));
        return { droite: { n: 10, textes, grands: [0, 5, 10], etage: fraction, type, resume: `De ${texteRicheRes(ecrire(debut))}, de ${decimalRes(p, 3)} en ${decimalRes(p, 3)}`,
          points: libres.map((i, k) => ({ i, lettre: 'ABC'[k], texte: ecrire(debut + i * p), valeur: debut + i * p })) }, cle: `${debut}/${p}/${libres}/${fraction}` };
      });
      return { consigne: 'Lis bien les nombres déjà écrits : de combien avance-t-on à chaque graduation ?', aide: 'Entre 1 et 2, il y a 10 intervalles : chaque graduation avance d’un dixième (0,1). Après 1,9 vient 2.', disposition: 'droite', exercices };
    },
  },
  comparerDecimaux: {
    options: n => [{ cle: 'type', libelle: 'Exercices', defaut: 'melange', choix: [['comparer', 'Comparer avec <, > ou = (17,3 et 17,12)'], ['fractions', 'Comparer des fractions décimales (67/10 et 607/100)'],
      ['encadrer', n === 'CM2' ? 'Encadrer entre deux entiers, au dixième' : 'Encadrer entre deux entiers (17 < 17,48 < 18)'], ['intercaler', 'Intercaler (2,9 < … < 3)'], ['ranger', 'Ranger dans l’ordre croissant'],
      ['arrondi', 'Partie entière et arrondi à l’unité'], ['melange', 'Tout mélangé']] }],
    nombre: o => (o?.type === 'ranger' ? 10 : o?.type === 'melange' ? 14 : 18), // (« ranger » : une seule colonne)
    fabriquer(o, n, rnd) {
      const P = n === 'CM2' ? 3 : 2; // (valeurs en millièmes ; CM1 : jusqu'aux centièmes)
      const D = v => decimalRes(v, 3);
      // Un nombre de q chiffres après la virgule (q ≤ P), en millièmes.
      const nombre = (e, q) => e * 1000 + entRes(rnd, 1, 10 ** q - 1) * 10 ** (3 - q);
      const exercices = tirerRes(o.nombre, rnd, () => {
        const type = o.type === 'melange' ? unRes(rnd, ['comparer', 'comparer', 'comparer', 'fractions', 'encadrer', 'intercaler', 'ranger', 'arrondi']) : o.type;
        const e = entRes(rnd, 0, rnd() < 0.7 ? 20 : 99);
        if (type === 'comparer') {
          // (d'après Eduscol : les erreurs fréquentes — « le plus long est le plus grand », « deux entiers séparés par une virgule »)
          const piege = unRes(rnd, ['long', 'zero', 'dixiemes', 'egal', 'entiers', 'hasard']);
          let x, y, tx, ty;
          if (piege === 'long') { const a = entRes(rnd, 2, 9); x = e * 1000 + a * 100; y = e * 1000 + entRes(rnd, 10, a * 10 - 1) * 10; } // 17,3 et 17,12
          else if (piege === 'zero') { const a = entRes(rnd, 1, 9); x = e * 1000 + a * 100; y = e * 1000 + entRes(rnd, 1, 9) * 10; } // 17,2 et 17,07
          else if (piege === 'dixiemes') { const a = entRes(rnd, 1, 8); x = e * 1000 + a * 100; y = e * 1000 + entRes(rnd, a * 10 + 1, 99) * 10; } // 17,5 et 17,72
          else if (piege === 'egal') { x = y = e * 1000 + entRes(rnd, 1, 9) * 100; tx = D(x); ty = `${D(y)}0`; } // 2,6 et 2,60
          else if (piege === 'entiers') { x = nombre(e, P); y = (e + 1) * 1000 + entRes(rnd, 1, 9) * 100; } // 4,592 et 5,1
          else { x = nombre(e, entRes(rnd, 1, P)); y = nombre(e, entRes(rnd, 1, P)); }
          if (P === 2 && (x % 10 || y % 10)) return null;
          if (rnd() < 0.5) [x, y, tx, ty] = [y, x, ty, tx];
          return { parties: [`${tx || D(x)}  `, null, `  ${ty || D(y)}`], reponse: x < y ? '<' : x > y ? '>' : '=', cle: `c${x}/${y}/${tx}${ty}` };
        }
        if (type === 'fractions') {
          // (67/10 et 607/100 : mêmes chiffres, valeurs différentes ; ou deux nombres proches)
          const a = entRes(rnd, 11, 99), c = P > 2 && rnd() < 0.3 ? 1000 : 100;
          const b = c === 1000 ? (rnd() < 0.5 ? Number(`${String(a)[0]}00${String(a)[1]}`) : a * 100 + entRes(rnd, -99, 99))
            : rnd() < 0.5 ? Number(`${String(a)[0]}0${String(a)[1]}`) : a * 10 + entRes(rnd, -9, 9);
          const [g, h] = c === 1000 ? [a * 100, b] : [a * 10, b]; // (en centièmes ou en millièmes)
          return rnd() < 0.5 ? { parties: [fracRes(a, 10), '  ', null, '  ', fracRes(b, c)], reponse: g < h ? '<' : g > h ? '>' : '=', cle: `f${a}/${b}/${c}` }
            : { parties: [fracRes(b, c), '  ', null, '  ', fracRes(a, 10)], reponse: h < g ? '<' : h > g ? '>' : '=', cle: `F${a}/${b}/${c}` };
        }
        if (type === 'encadrer') {
          const v = nombre(e, P);
          if (P > 2 && rnd() < 0.5) { if (v % 100 === 0) return null; return { parties: [null, ` < ${D(v)} < `, null], reponses: [D(v - v % 100), D(v - v % 100 + 100)], cle: `x${v}` }; }
          return { parties: [null, ` < ${D(v)} < `, null], reponses: [nbRes(e), nbRes(e + 1)], cle: `e${v}` };
        }
        if (type === 'intercaler') { // (plusieurs réponses possibles : le corrigé en donne une)
          const q = entRes(rnd, 1, P - 1), u = 10 ** (3 - q), x = e * 1000 + entRes(rnd, 0, 10 ** q - 1) * u;
          return { parties: [`${D(x)} < `, null, ` < ${D(x + u)}`], reponse: D(x + u / 2), cle: `i${x}/${q}` };
        }
        if (type === 'ranger') {
          const k = P > 2 ? entRes(rnd, 4, 5) : 3, liste = new Set();
          for (let t = 0; t < 40 && liste.size < k; t++) liste.add(nombre(e + (rnd() < 0.2 ? 1 : 0), entRes(rnd, 1, P)));
          if (liste.size < k) return null;
          const vals = [...liste], frac = rnd() < 0.4 ? entRes(rnd, 0, k - 1) : -1; // (parfois un nombre en fraction décimale, comme 209/100)
          if (frac >= 0 && vals[frac] % 10) return null;
          const ecrit = (v, i) => (i === frac ? fracRes(v / 10, 100) : D(v));
          const parties = vals.flatMap((v, i) => [ecrit(v, i), i < k - 1 ? ' ; ' : ' → ']).concat([null]);
          return { parties, reponse: vals.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]).map(([v, i]) => texteRicheRes(ecrit(v, i))).join(' < '), longue: true, cle: `r${vals}` };
        }
        const v = nombre(e, entRes(rnd, 1, P));
        return { parties: [`${D(v)} : partie entière `, null, ' ; arrondi à l’unité ', null], reponses: [nbRes(e), nbRes(v % 1000 >= 500 ? e + 1 : e)], cle: `a${v}` };
      });
      return { consigne: 'Complète.', aide: 'Je compare d’abord les parties entières, puis les dixièmes, puis les centièmes : 17,3 > 17,12, car 3 dixièmes, c’est plus que 1 dixième. Intercaler : plusieurs réponses sont possibles.',
        disposition: 'ligne', exercices };
    },
  },
  fois10Decimaux: {
    options: n => [
      { cle: 'quoi', libelle: 'Calculs', defaut: n === 'CM2' ? '10-100-1000' : '10', choix: [['10', '× 10 et ÷ 10'], ['10-100-1000', '× et ÷ par 10, 100 et 1 000']] },
      { cle: 'op', libelle: 'Opération', choix: [['melange', 'Multiplier et diviser'], ['×', 'Multiplier'], ['÷', 'Diviser']], defaut: 'melange' },
      { cle: 'trou', libelle: 'Questions', choix: [['resultat', 'Le résultat (3,4 × 10 = …)'], ['melange', 'Aussi le nombre qui manque (3,4 × … = 34)']], defaut: 'resultat' },
    ],
    nombre: () => 24,
    fabriquer(o, n, rnd) {
      const P = n === 'CM2' ? 3 : 2, U = 10 ** 6; // (valeurs en millionièmes ; résultats jusqu'aux centièmes au CM1, aux millièmes au CM2)
      const exercices = tirerRes(o.nombre, rnd, () => {
        const f = unRes(rnd, o.quoi === '10' ? [10] : [10, 100, 1000]), op = o.op === 'melange' ? unRes(rnd, ['×', '÷']) : o.op;
        const q = entRes(rnd, 0, P), x = entRes(rnd, 1, q ? 9999 : 999) * U / 10 ** q, r = op === '×' ? x * f : x / f;
        if (!Number.isInteger(r) || r % (U / 10 ** P) || (q === 0 && op === '×')) return null; // (au moins une virgule, et pas plus de P chiffres après)
        const A = decimalRes(x, 6), R = decimalRes(r, 6), signe = op === '×' ? '×' : '÷';
        if (o.trou === 'melange' && rnd() < 0.35) return { parties: [`${A} ${signe} `, null, ` = ${R}`], reponse: nbRes(f), cle: `t${A}${op}${f}` };
        return { parties: [`${A} ${signe} ${nbRes(f)} = `, null], reponse: R, cle: `${A}${op}${f}` };
      });
      return { consigne: 'Calcule de tête.', aide: 'Multiplier par 10 : chaque chiffre prend une valeur dix fois plus grande (les dixièmes deviennent des unités) : 3,45 × 10 = 34,5. Diviser par 10 : dix fois plus petite.',
        disposition: 'ligne', exercices };
    },
  },
  calculMentalDecimaux: {
    options: n => [{ cle: 'type', libelle: 'Calculs', defaut: 'melange', choix: [['rang', 'Ajouter ou retirer des unités, dixièmes, centièmes, sans retenue (4,45 + 0,3)'],
      ...(n === 'CM2' ? [['entier', 'Ajouter ou retirer un entier, sans retenue (12,7 + 5)'], ['retenue', 'Ajouter avec une retenue (8,6 + 5 ; 4,45 + 0,8)'],
        ['deux', 'Deux décimaux à un chiffre après la virgule (8,6 + 7,8)'], ['double', 'Double et moitié (le double de 3,5)']] : []), ['melange', 'Tout mélangé']] }],
    nombre: () => 24,
    fabriquer(o, n, rnd) {
      const P = n === 'CM2' ? 3 : 2, D = v => decimalRes(v, 3); // (valeurs en millièmes)
      const types = ['rang', ...(n === 'CM2' ? ['entier', 'retenue', 'deux', 'double'] : [])];
      const chiffre = (v, r) => Math.floor(v / 10 ** r) % 10; // (r : 0 millièmes, 3 unités…)
      const exercices = tirerRes(o.nombre, rnd, () => {
        const type = o.type === 'melange' ? unRes(rnd, types) : o.type;
        if (type === 'rang') {
          const q = entRes(rnd, 1, P), x = entRes(rnd, 1, 999) * 1000 + entRes(rnd, 1, 10 ** q - 1) * 10 ** (3 - q), op = unRes(rnd, ['+', '-']);
          const r = entRes(rnd, 3 - q, 5), k = entRes(rnd, 1, 9), c = chiffre(x, r);
          if (op === '+' ? c + k > 9 : c < k || x < 1000) return null; // (sans retenue)
          const y = k * 10 ** r, ecrit = r < 3 && rnd() < 0.3 ? fracRes(k, 10 ** (3 - r)) : D(y); // (parfois en fraction décimale : 0,45 + 3/100)
          return { parties: [`${D(x)} ${op === '+' ? '+' : MOINS_RES} `, ecrit, ' = ', null], reponse: D(op === '+' ? x + y : x - y), cle: `r${x}${op}${y}${estFracRes(ecrit)}` };
        }
        if (type === 'entier' || type === 'retenue') {
          const x = entRes(rnd, 1, 99) * 1000 + entRes(rnd, 1, 99) * 10, op = type === 'entier' ? unRes(rnd, ['+', '-']) : '+';
          if (type === 'retenue' && rnd() < 0.4) { const k = entRes(rnd, 1, 9); if (chiffre(x, 2) + k < 10) return null; return { parties: [`${D(x)} + ${D(k * 100)} = `, null], reponse: D(x + k * 100), cle: `d${x}+${k}` }; }
          const k = entRes(rnd, 1, 9), u = chiffre(x, 3);
          if (type === 'entier' ? (op === '+' ? u + k > 9 : u < k) : u + k < 10) return null;
          return { parties: [`${D(x)} ${op === '+' ? '+' : MOINS_RES} ${k} = `, null], reponse: D(op === '+' ? x + k * 1000 : x - k * 1000), cle: `e${x}${op}${k}` };
        }
        if (type === 'deux') { const a = entRes(rnd, 11, 99) * 100, b = entRes(rnd, 11, 99) * 100; if (a % 1000 === 0 || b % 1000 === 0) return null; return { parties: [`${D(a)} + ${D(b)} = `, null], reponse: D(a + b), cle: `s${a}+${b}` }; }
        // Double ou moitié, cas simples (CM2) : 3,5 → 7 ; la moitié de 9 = 4,5 ; de 6,4 = 3,2.
        if (rnd() < 0.5) { const x = entRes(rnd, 1, 50) * 100 + (rnd() < 0.5 ? 0 : 50); if (x % 1000 === 0) return null; return { parties: [`le double de ${D(x)} = `, null], reponse: D(2 * x), cle: `D${x}` }; }
        const x = rnd() < 0.4 ? entRes(rnd, 1, 15) * 1000 : entRes(rnd, 1, 49) * 200;
        return { parties: [`la moitié de ${D(x)} = `, null], reponse: D(x / 2), cle: `M${x}` };
      });
      return { consigne: 'Calcule de tête.', aide: 'Je repère le chiffre sur lequel agir : 4,45 + 0,3, ce sont 3 dixièmes de plus : 4,75. Six dixièmes + huit dixièmes = quatorze dixièmes = 1,4.', disposition: 'ligne', exercices };
    },
  },
  divisionDecimale: {
    options: n => [{ cle: 'dividende', libelle: 'Nombre à diviser', choix: [['melange', 'Entier ou décimal'], ['entier', 'Un entier (9 ÷ 4 = 2,25)'], ['decimal', 'Un nombre décimal (45,6 ÷ 3)']], defaut: 'melange' }],
    nombre: () => 4,
    fabriquer(o, n, rnd) {
      // (valeurs en centièmes ; le quotient s'arrête aux centièmes au plus, le reste est nul)
      const exercices = tirerRes(o.nombre, rnd, () => {
        const b = entRes(rnd, 2, 9), sorte = o.dividende === 'melange' ? unRes(rnd, ['entier', 'decimal']) : o.dividende;
        let A, decD;
        if (sorte === 'entier') { const a = entRes(rnd, 2, 999); A = a * 100; decD = 0; if (A % b || a % b === 0) return null; }
        else { const q = entRes(rnd, 101, 4999); A = q * b; if (A % 100 === 0 || A >= 10000) return null; decD = A % 10 ? 2 : 1; } // (dividende plus petit que 100)
        const Q = A / b;
        return { decimale: true, dividendeCent: A, diviseur: b, quotientCent: Q, texteDividende: decD ? decimalRes(A, 2) : String(A / 100), texteQuotient: decimalRes(Q, 2), cle: `${A}:${b}` };
      });
      return { consigne: 'Pose et calcule la division jusqu’à ce que le reste soit nul. Vérifie avec la multiplication.', aide: 'Quand il reste des unités, je les échange contre des dixièmes : j’écris la virgule au quotient et un 0 au dividende.',
        disposition: 'potence', exercices };
    },
  },
  problemesFractions: {
    options: n => {
      const c3 = NIVEAUX_CYCLE_RES[3].includes(n);
      return [{ cle: 'type', libelle: 'Problèmes', defaut: 'melange', choix: [['melange', 'Mélangés'], ['parts', 'Parts d’un tout : quelle fraction reste-t-il ?'], ['complement', 'Le reste de la figure'],
        ...(c3 ? [['quantite', 'Fraction d’une quantité'], ['prix', 'Prix et longueurs avec des nombres décimaux']] : [])] }];
    },
    nombre: () => 4,
    fabriquer(o, n, rnd) {
      const c3 = NIVEAUX_CYCLE_RES[3].includes(n), dens = c3 ? [4, 5, 6, 8, 10, 12] : [4, 5, 6, 8, 10];
      const gens = [['Marc', 'il'], ['Inès', 'elle'], ['Sami', 'il'], ['Lou', 'elle'], ['Noé', 'il'], ['Jade', 'elle'], ['Malo', 'il'], ['Nina', 'elle']];
      const lettres = (a, b) => fractionEnLettresRes(a, b);
      const types = ['parts', 'complement', ...(c3 ? ['quantite', 'quantite', 'prix', 'prix'] : [])];
      const fab = type => {
        const [p, il] = unRes(rnd, gens), [q] = unRes(rnd, gens.filter(g => g[0] !== p));
        if (type === 'parts') {
          const b = unRes(rnd, dens), a = entRes(rnd, 1, b - 2), c = entRes(rnd, 1, b - a - 1), objet = unRes(rnd, ['un gâteau', 'une tarte', 'une pizza', 'une galette']);
          return { texte: `${p} a fait ${objet}. ${p} en mange ${lettres(a, b)} et ${q} en mange ${lettres(c, b)}. Quelle fraction ${objet.replace(/^un /, 'du ').replace(/^une /, 'de la ')} reste-t-il ?`,
            calcul: `${a}/${b} + ${c}/${b} = ${a + c}/${b} ; ${b}/${b} ${MOINS_RES} ${a + c}/${b} = ${b - a - c}/${b}`, reponse: `Il reste ${b - a - c}/${b} (${lettres(b - a - c, b)}).` };
        }
        if (type === 'complement') {
          const b = unRes(rnd, dens), a = entRes(rnd, 1, b - 1);
          return { texte: `${p} a colorié les ${lettres(a, b)} d’une figure en bleu et le reste en rouge. Quelle fraction de la figure est coloriée en rouge ?`,
            calcul: `${b}/${b} ${MOINS_RES} ${a}/${b} = ${b - a}/${b}`, reponse: `${b - a}/${b} de la figure (${lettres(b - a, b)}) est en rouge.` };
        }
        if (type === 'quantite') {
          const b = unRes(rnd, [2, 3, 4, 5, 10]), a = n === 'CM1' ? 1 : entRes(rnd, 1, b - 1);
          // [début de l'énoncé (avec le total), ce que fait la fraction, question, unité de la réponse, total mini, total maxi]
          const lot = unRes(rnd, [[t => `Dans une classe de ${t} élèves`, 'mangent à la cantine', 'Combien d’élèves mangent à la cantine ?', 'élèves', 20, 30],
            [t => `Pour un gâteau, ${p} prend un paquet de ${nbRes(t)} g de farine`, 'vont dans la pâte', 'Combien de grammes de farine vont dans la pâte ?', 'g', 500, 1000],
            [t => `Une clôture mesure ${t} m`, 'sont déjà peints', 'Combien de mètres de clôture sont déjà peints ?', 'm', 20, 60],
            [t => `Un livre a ${t} pages`, 'sont déjà lues', 'Combien de pages sont déjà lues ?', 'pages', 60, 240]]);
          const tot = b * entRes(rnd, Math.ceil(lot[4] / b), Math.floor(lot[5] / b)), part = tot / b * a;
          return { texte: `${lot[0](tot)}. ${a === 1 ? 'Le' : 'Les'} ${lettres(a, b)} ${lot[1]}. ${lot[2]}`,
            calcul: `${nbRes(tot)} ÷ ${b} = ${nbRes(tot / b)}${a > 1 ? ` ; ${a} × ${nbRes(tot / b)} = ${nbRes(part)}` : ''}`, reponse: `${nbRes(part)} ${lot[3]}` };
        }
        // Prix et longueurs (d'après Eduscol : un objet à 1,50 €, en acheter 8)
        const sorte = unRes(rnd, ['achat', 'reste', ...(n === 'CM2' ? ['partage'] : [])]);
        if (sorte === 'achat') { const c = entRes(rnd, 11, 99) * 10 + (rnd() < 0.5 ? 0 : 5), k = entRes(rnd, 2, 9), objet = unRes(rnd, ['cahier', 'stylo', 'classeur', 'ballon']);
          return { texte: `Un ${objet} coûte ${prixRes(c)} €. ${p} en achète ${k}. Combien paie-t-${il} ?`, calcul: `${prixRes(c)} × ${k} = ${prixRes(c * k)}`, reponse: `${prixRes(c * k)} €` }; }
        if (sorte === 'reste') { const t = entRes(rnd, 2, 5) * 1000, a = entRes(rnd, 101, 999), b = entRes(rnd, 101, 999); if (a + b >= t) return null;
          return { texte: `${p} a ${prixRes(t)} €. ${p} achète un livre à ${prixRes(a)} € et un jeu à ${prixRes(b)} €. Combien d’argent reste-t-il à ${p} ?`,
            calcul: `${prixRes(a)} + ${prixRes(b)} = ${prixRes(a + b)} ; ${prixRes(t)} ${MOINS_RES} ${prixRes(a + b)} = ${prixRes(t - a - b)}`, reponse: `${prixRes(t - a - b)} €` }; }
        const k = entRes(rnd, 2, 6), m = entRes(rnd, 11, 99) * 10; // (longueur d'un morceau, en centièmes de mètre)
        return { texte: `Une ficelle de ${decimalRes(k * m, 2)} m est coupée en ${k} morceaux de même longueur. Quelle est la longueur d’un morceau ?`, calcul: `${decimalRes(k * m, 2)} ÷ ${k} = ${decimalRes(m, 2)}`, reponse: `${decimalRes(m, 2)} m` };
      };
      const exercices = tirerRes(o.nombre, rnd, () => fab(o.type === 'melange' ? unRes(rnd, types) : o.type));
      return { consigne: 'Lis le problème, représente-le (dessin, bande partagée, schéma en barres), puis écris le calcul et la réponse par une phrase.', disposition: 'probleme', exercices };
    },
  },
};

/* ---------- Données : banque + ressources de l'enseignant ---------- */

const ressourcesPerso = () => Donnees.liste('modeles', m => m.sorte === 'ressource');
// (dans `modeles`, `sorte` vaut 'ressource' ; la sorte affichée — jeu, rituel, séance — est dans `genre`)
const toutesRessources = () => [...RESSOURCES_ECOLE, ...ressourcesPerso().map(m => ({ ...m, sorte: m.genre || 'seance', perso: true }))];
const champRes = (cycle, ca) => REFERENTIEL.refs[REF_CYCLE_RES[cycle]]?.champs[ca];
const objectifsRes = (cycle, ca) => (champRes(cycle, ca)?.objectifs || []).filter(o => !o.horsVigueur);

// Matières qui ont des objectifs détaillés, dans l'ordre du livret : [{ ca, titre, cycles }]
function matieresRes() {
  const res = new Map();
  for (const cycle of [2, 3]) {
    for (const [ca, ch] of Object.entries(REFERENTIEL.refs[REF_CYCLE_RES[cycle]]?.champs || {})) {
      if (!ch.objectifs?.some(o => !o.horsVigueur)) continue;
      if (!res.has(ca)) res.set(ca, { ca, titre: ch.titre, cycles: [] });
      res.get(ca).cycles.push(cycle);
    }
  }
  return [...res.values()];
}

// Cycle de la classe en cours (le plus petit niveau compte), sinon 2.
function cycleClasseRes(c) {
  if (!c) return 2;
  const niveaux = niveauxDeClasse(c).length ? niveauxDeClasse(c) : [c.niveau];
  return niveaux.some(n => NIVEAUX_CYCLE_RES[2].includes(n)) ? 2 : niveaux.some(n => NIVEAUX_CYCLE_RES[3].includes(n)) ? 3 : 2;
}

function etatRes(c) {
  const e = ui.res ||= {};
  const mats = matieresRes();
  if (!mats.some(m => m.ca === e.matiere)) e.matiere = mats.some(m => m.ca === 'MA') ? 'MA' : mats[0]?.ca;
  const mat = mats.find(m => m.ca === e.matiere);
  if (!e.cycle || !mat?.cycles.includes(e.cycle)) e.cycle = mat?.cycles.includes(cycleClasseRes(c)) ? cycleClasseRes(c) : mat?.cycles[0] || 2;
  if (e.niveau && !NIVEAUX_CYCLE_RES[e.cycle].includes(e.niveau)) e.niveau = '';
  if (e.objectif && !objectifsRes(e.cycle, e.matiere).some(o => o.code === e.objectif)) e.objectif = '';
  return e;
}

// Ressources d'une matière et d'un cycle, éventuellement d'un niveau et d'un objectif.
const ressourcesDe = (e, objectif = e.objectif) => toutesRessources().filter(r => r.matiere === e.matiere && +r.cycle === +e.cycle
  && (!e.niveau || !r.niveaux?.length || r.niveaux.includes(e.niveau)) && (!objectif || (r.objectifs || []).includes(objectif)));

/* ---------- L'onglet ---------- */

const ressOuverts = new Set(); // (détails dépliés : gardés d'un dessin à l'autre)

function htmlRessources(c) {
  const e = etatRes(c), mats = matieresRes(), mat = mats.find(m => m.ca === e.matiere);
  if (!mat) return '<div class="vide"><p>Aucune matière n’a encore d’objectifs détaillés.</p></div>';
  const ch = champRes(e.cycle, e.matiere), objectifs = objectifsRes(e.cycle, e.matiere).filter(o => !e.niveau || o.niveaux.includes(e.niveau));
  const toutes = ressourcesDe(e, '');
  const compte = new Map(objectifs.map(o => [o.code, toutes.filter(r => (r.objectifs || []).includes(o.code)).length]));
  const avecRes = objectifs.filter(o => compte.get(o.code));
  const montres = e.toutes ? objectifs : avecRes;
  const listeComp = ch.domainesProgramme.map(dp => {
    const groupes = [...dp.comps, { code: '', nom: 'Objectifs ajoutés par l’école' }].map(cp => {
      const objs = montres.filter(o => o.dom === dp.dom && (cp.code ? o.comp === cp.code : o.perso && !dp.comps.some(x => x.code === o.comp)));
      if (!objs.length) return '';
      return `<div class="groupe-comp-res"><h4>${esc(cp.nom)}</h4>${objs.map(o => `<button type="button" class="obj-res${o.code === e.objectif ? ' actif' : ''}${compte.get(o.code) ? '' : ' sans-res'}"
        data-res="objectif" data-arg="${esc(o.code)}" aria-pressed="${o.code === e.objectif}"><span class="texte-obj-res">${esc(o.texte)}</span>
        <span class="pied-obj-res">${badgesNiveaux(o)}${compte.get(o.code) ? `<span class="nb-res">${compte.get(o.code)}</span>` : ''}</span></button>`).join('')}</div>`;
    }).join('');
    return groupes ? `<section class="dom-res"><h3>${esc(dp.nom)}</h3>${groupes}</section>` : '';
  }).join('');
  const obj = e.objectif && objectifs.find(o => o.code === e.objectif);
  const liste = obj ? ressourcesDe(e) : toutes;
  return `<div class="ressources">
    <div class="tete-res">
      <h2>${iconeEcole('livre')}Ressources</h2>
      <button type="button" data-res="ajouter">${iconeEcole('ajouter')}Ajouter ma ressource</button>
    </div>
    <p class="aide">Choisis la matière, puis le cycle, puis la compétence travaillée : le carnet propose des idées d’activités et fabrique les fiches élèves à imprimer
      (de nouveaux nombres à chaque fois, avec le corrigé). Toutes les idées viennent d’<b>Eduscol</b> : la source est indiquée sur chaque carte.</p>
    <div class="choix-res">
      <label class="etape-res"><span class="num-res">1</span> Matière
        <select data-res-choix="matiere">${mats.map(m => `<option value="${esc(m.ca)}"${m.ca === e.matiere ? ' selected' : ''}>${esc(m.titre)}</option>`).join('')}</select></label>
      <div class="etape-res"><span class="num-res">2</span> Cycle
        <div class="filtres-ecole" role="group" aria-label="Cycle">${[2, 3].map(cy => `<button type="button" class="puce-ecole${cy === e.cycle ? ' actif' : ''}" data-res="cycle" data-arg="${cy}"
          aria-pressed="${cy === e.cycle}"${mat.cycles.includes(cy) ? '' : ' disabled'}>Cycle ${cy} <span class="aide">${NIVEAUX_CYCLE_RES[cy].join(', ')}</span></button>`).join('')}</div></div>
      <div class="etape-res"><span class="aide">Niveau</span>
        <div class="filtres-ecole" role="group" aria-label="Niveau">${['', ...NIVEAUX_CYCLE_RES[e.cycle]].map(n => `<button type="button" class="puce-ecole${n === (e.niveau || '') ? ' actif' : ''}"
          data-res="niveau" data-arg="${n}" aria-pressed="${n === (e.niveau || '')}">${n || 'Tous'}</button>`).join('')}</div></div>
    </div>
    <div class="colonnes-res">
      <nav class="liste-comp-res" aria-label="Compétences travaillées">
        <div class="titre-colonne-res"><span class="num-res">3</span> <b>Compétence travaillée</b></div>
        <button type="button" class="obj-res tout-res${!e.objectif ? ' actif' : ''}" data-res="objectif" data-arg="" aria-pressed="${!e.objectif}">
          <span class="texte-obj-res">Toutes les ressources de ce cycle</span><span class="pied-obj-res"><span class="nb-res">${toutes.length}</span></span></button>
        ${listeComp || '<p class="aide">Aucune ressource pour l’instant dans cette matière : montre toutes les compétences pour ajouter la tienne.</p>'}
        <button type="button" class="lien" data-res="toutes">${e.toutes ? `Ne montrer que les compétences qui ont des ressources (${avecRes.length})` : `Montrer toutes les compétences du programme (${objectifs.length})`}</button>
      </nav>
      <section class="resultats-res" aria-live="polite">
        <h3>${obj ? esc(obj.texte) : `${esc(mat.titre)} — cycle ${e.cycle}${e.niveau ? ` · ${esc(e.niveau)}` : ''}`}</h3>
        ${liste.length ? `<div class="cartes-res">${liste.map(r => carteRes(r, e)).join('')}</div>`
          : `<div class="vide-res"><p>Pas encore de ressource pour cette compétence.</p>
             <button type="button" class="primaire" data-res="ajouter">${iconeEcole('ajouter')}Ajouter mon idée d’activité</button></div>`}
      </section>
    </div>
  </div>`;
}

function carteRes(r, e) {
  const [sorte, icone] = SORTES_RES[r.sorte] || SORTES_RES.seance;
  const objs = objectifsRes(r.cycle, r.matiere).filter(o => (r.objectifs || []).includes(o.code));
  const src = SOURCES_RES[r.source];
  const liste = t => (Array.isArray(t) ? t : String(t || '').split('\n')).map(x => x.trim()).filter(Boolean);
  const blocs = [['Matériel', liste(r.materiel), 'ul'], ['Déroulement', liste(r.deroule), 'ol'], ['Variantes et différenciation', liste(r.variantes), 'ul']].filter(b => b[1].length);
  const ouvert = ressOuverts.has(r.id);
  return `<article class="carte-res${r.perso ? ' perso-res' : ''}" data-ressource="${esc(r.id)}">
    <div class="haut-carte-res"><span class="sorte-res">${iconeEcole(icone)}${esc(sorte)}</span>
      ${r.duree ? `<span class="aide">${esc(r.duree)}</span>` : ''}<span class="espace"></span>${(r.niveaux || []).map(n => `<span class="badge-niveau">${esc(n)}</span>`).join('')}</div>
    <h4>${esc(r.titre)}</h4>
    ${r.resume ? `<p>${esc(r.resume)}</p>` : ''}
    ${blocs.length ? `<details data-res-details="${esc(r.id)}"${ouvert ? ' open' : ''}><summary>Matériel, déroulement, variantes</summary>
      ${blocs.map(([t, l, balise]) => `<p class="titre-bloc-res">${t}</p><${balise}>${l.map(x => `<li>${esc(x)}</li>`).join('')}</${balise}>`).join('')}</details>` : ''}
    ${objs.length ? `<p class="obj-carte-res">${objs.map(o => `<span title="${esc(o.texte)}">${esc(o.code)}</span>`).join(' ')} <span class="aide">${esc(objs.map(o => o.texte).slice(0, 2).join(' · '))}${objs.length > 2 ? '…' : ''}</span></p>` : ''}
    <p class="source-res">${r.perso ? `Ajoutée par moi${r.sourceTexte ? ` · d’après : ${esc(r.sourceTexte)}` : ''}`
      : src ? `D’après <b>Eduscol</b> : ${src.url ? `<a href="${esc(src.url)}" target="_blank" rel="noopener">${esc(src.nom)}</a>` : esc(src.nom)}` : ''}</p>
    <div class="actions-res">
      ${r.fiche && GENERATEURS_FICHES[r.fiche.gen] ? `<button type="button" class="primaire" data-res="fiche" data-arg="${esc(r.id)}">${iconeEcole('imprimer')}Préparer la fiche élève</button>` : ''}
      <button type="button" data-res="activite" data-arg="${esc(r.id)}">${iconeEcole('cahier')}Fiche de l’activité</button>
      ${r.perso ? `<button type="button" data-res="modifier" data-arg="${esc(r.id)}">${iconeEcole('modifier')}Modifier</button>` : ''}
    </div>
  </article>`;
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-res]');
  if (!b || !b.closest('#vue, .modale')) return;
  if (b.closest('.modale')) return; // (boutons des fenêtres : gérés par la fenêtre elle-même)
  const etat = ui.res ||= {}, arg = b.dataset.arg, c = classeActive();
  switch (b.dataset.res) {
    case 'cycle': etat.cycle = +arg; etat.objectif = ''; break;
    case 'niveau': etat.niveau = arg; break;
    case 'objectif': etat.objectif = arg; break;
    case 'toutes': etat.toutes = !etat.toutes; break;
    case 'fiche': return lancer(() => preparerFicheRes(toutesRessources().find(r => r.id === arg), c));
    case 'activite': return lancer(() => apercuActiviteRes(toutesRessources().find(r => r.id === arg)));
    case 'ajouter': return lancer(() => editerRessource(null, etatRes(c)));
    case 'modifier': return lancer(() => editerRessource(Donnees.get('modeles', arg), etatRes(c)));
    default: return;
  }
  memoriserUi();
  rendre();
  if (b.dataset.res === 'objectif' && innerWidth < 900) $('.resultats-res')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
document.addEventListener('change', e => {
  const s = e.target.closest?.('[data-res-choix]');
  if (!s || !s.closest('#vue')) return;
  const etat = ui.res ||= {};
  etat[s.dataset.resChoix] = s.value;
  etat.objectif = ''; etat.cycle = 0;
  memoriserUi();
  rendre();
});
document.addEventListener('toggle', e => {
  const id = e.target.dataset?.resDetails;
  if (id) { if (e.target.open) ressOuverts.add(id); else ressOuverts.delete(id); }
}, true);

/* ---------- Préparer la fiche élève : réglages, aperçu, PDF ---------- */

const LETTRES_VERSIONS = 'ABCD';

async function preparerFicheRes(r, c) {
  if (!r) return;
  const gen = GENERATEURS_FICHES[r.fiche.gen];
  const etat = ui.res || {}, niveaux = r.niveaux?.length ? r.niveaux : NIVEAUX_CYCLE_RES[r.cycle];
  const niveauClasse = c ? (niveauxDeClasse(c).length ? niveauxDeClasse(c) : [c.niveau]).find(n => niveaux.includes(n)) : '';
  let niveau = niveaux.includes(etat.niveau) ? etat.niveau : niveauClasse || niveaux[0];
  let reglages = {}, graine = Math.floor(Math.random() * 1e9);
  const defauts = () => {
    const opts = gen.options(niveau);
    reglages = Object.fromEntries(opts.map(o => [o.cle, r.fiche.options?.[o.cle] ?? o.defaut]));
    reglages.nombre = gen.nombre(reglages);
  };
  defauts();
  let versions = 1, corrige = true, titre = r.titre, nombreChoisi = false, adaptation = 0;

  const { d, resultat } = ouvrirModale('Préparer la fiche élève', `
    <p class="aide">${esc(r.titre)} — règle la fiche, regarde l’aperçu, puis télécharge le PDF ou imprime. « Autres nombres » tire une nouvelle série.</p>
    <div class="reglages-fiche-res"></div>
    <div class="apercu-pdf apercu-fiche-res"></div>`,
  `<button type="button" data-fiche-res="nouveaux">${iconeEcole('melanger')}Autres nombres</button>
   <span class="espace"></span>
   <button type="button" data-fiche-res="imprimer">${iconeEcole('imprimer')}Imprimer</button>
   <button type="button" class="primaire" data-fiche-res="pdf">${iconeEcole('telecharger')}Télécharger le PDF</button>
   <button type="button" data-fermer>Fermer</button>`, 'modale-large modale-apercu-pdf');
  iconeTitreModale?.(d, 'imprimer');
  const zoneReglages = $('.reglages-fiche-res', d), zoneApercu = $('.apercu-fiche-res', d);

  const dessinReglages = () => {
    const opts = gen.options(niveau);
    zoneReglages.innerHTML = `<div class="grille-reglages-res">
      <label>Titre de la fiche<input data-reg="titre" maxlength="70" value="${esc(titre)}"></label>
      <label>Niveau<select data-reg="niveau">${niveaux.map(n => `<option${n === niveau ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
      ${opts.map(o => `<label>${esc(o.libelle)}<select data-reg="${o.cle}">${o.choix.map(([v, l]) => `<option value="${esc(v)}"${v === reglages[o.cle] ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`).join('')}
      <label>Nombre d’exercices<input type="number" data-reg="nombre" min="1" max="60" value="${reglages.nombre}"></label>
      <label>Versions différentes<select data-reg="versions">${[1, 2, 3, 4].map(v => `<option value="${v}"${v === versions ? ' selected' : ''}>${v === 1 ? 'Une seule' : `${v} (${LETTRES_VERSIONS.slice(0, v).split('').join(', ')})`}</option>`).join('')}</select></label>
      <label>Fiche adaptée <span class="aide">(élèves en difficulté, PAP)</span><select data-reg="adaptation">${ADAPTATIONS_RES.map((a, i) => `<option value="${i}"${i === adaptation ? ' selected' : ''}>${esc(a.nom)}</option>`).join('')}</select></label>
      <label class="case"><input type="checkbox" data-reg="corrige"${corrige ? ' checked' : ''}> Ajouter le corrigé</label>
    </div>`;
  };
  const fabriquer = () => dessinerFicheRes({ r, gen, niveau, reglages, versions, corrige, titre, graine, adaptation });
  const dessinApercu = () => {
    const dessin = fabriquer();
    zoneApercu.innerHTML = dessin.pages.map((_, i) => `<div class="feuille-pdf">${dessin.versSvg(i)}</div>`).join('');
  };
  dessinReglages();
  dessinApercu();
  const lire = cible => {
    const k = cible.dataset.reg;
    if (k === 'titre') { titre = cible.value.trim() || r.titre; return; }
    if (k === 'niveau') { niveau = cible.value; defauts(); dessinReglages(); }
    else if (k === 'versions') versions = +cible.value;
    else if (k === 'corrige') corrige = cible.checked;
    else if (k === 'adaptation') adaptation = +cible.value;
    else if (k === 'nombre') { reglages.nombre = Math.max(1, Math.min(60, Math.round(+cible.value) || 1)); nombreChoisi = true; }
    else {
      reglages[k] = cible.value;
      // (tant que l'enseignant n'a pas choisi le nombre d'exercices, il suit les réglages : la fiche tient sur une page)
      if (!nombreChoisi) { reglages.nombre = gen.nombre(reglages); const champ = zoneReglages.querySelector('[data-reg="nombre"]'); if (champ) champ.value = reglages.nombre; }
    }
    dessinApercu();
  };
  zoneReglages.addEventListener('change', ev => { if (ev.target.dataset.reg) lire(ev.target); });
  zoneReglages.addEventListener('input', ev => { if (ev.target.dataset.reg === 'titre') { lire(ev.target); clearTimeout(lire.t); lire.t = setTimeout(dessinApercu, 400); } });
  d.addEventListener('click', ev => {
    const b = ev.target.closest('[data-fiche-res]');
    if (!b) return;
    const nomFichier = `${titre} ${niveau}${adaptation ? ' adaptée' : ''}`.replace(/[\\/:*?"<>|]/g, '');
    if (b.dataset.ficheRes === 'nouveaux') { graine = Math.floor(Math.random() * 1e9); dessinApercu(); }
    if (b.dataset.ficheRes === 'pdf') lancer(async () => { telechargerBlob(new Blob([await fabriquer().versPdf()], { type: 'application/pdf' }), `${nomFichier}.pdf`); toast('PDF enregistré dans tes téléchargements', 'ok'); });
    if (b.dataset.ficheRes === 'imprimer') { const dessin = fabriquer(); imprimerZoneEcole(`<div class="impression-pdf">${dessin.pages.map((_, i) => dessin.versSvg(i)).join('')}</div>`, nomFichier); }
  });
  await resultat;
}

/* ---------- Dessin des fiches (A4 portrait) ---------- */

const MARGE_RES = 42, COULEUR_CORRIGE = '#1f6f5c', GRIS_RES = '#777777';

// Fiche adaptée (élèves en difficulté, PAP) : 0 = non, 1 = adaptée, 2 = très adaptée.
// Plus gros, moins d'exercices, aide toujours visible, aide visuelle selon la sorte d'exercice ; « très adaptée » : en plus,
// un exemple déjà fait en tête de fiche et plus d'espace. Rien sur la feuille de l'élève ne dit qu'elle est adaptée.
const ADAPTATIONS_RES = [
  { nom: 'Non', echelle: 1, part: 1 },
  { nom: 'Adaptée : plus gros, moins d’exercices, aides', echelle: 1.3, part: 0.6 },
  { nom: 'Très adaptée : en plus, un exemple déjà fait', echelle: 1.5, part: 0.4, exemple: true },
];
// Aide visuelle dessinée en haut de la fiche adaptée, selon le générateur.
const VISUELS_RES = { faitsAddition: 'frise20', familles: 'frise20', doubles: 'frise20', complementDizaine: 'frise100', presqueDizaine: 'frise100',
  suitesNombres: 'frise100', dizaines: 'cdu', fois10: 'cdu', unitesNumeration: 'cdu', comparerNombres: 'cdu', dicteeNombres: 'motsNombres',
  lettresChiffres: 'motsNombres', tablesMultiplication: 'pythagore', procedures: 'pythagore', distributivite: 'pythagore', divisionEnLigne: 'pythagore',
  divisionPotence: 'pythagore', problemes: 'barres', problemesMult: 'barres',
  fractionsFigures: 'bandesFractions', fractionsLettres: 'bandesFractions', comparerFractions: 'bandesFractions', calculFractions: 'bandesFractions',
  egalitesFractions: 'bandesFractions', fractionEntier: 'bandesFractions', fractionQuantite: 'bandesFractions', droiteFractions: 'bandesFractions',
  problemesFractions: 'barres', fractionsDecimales: 'tableauDecimal', droiteDecimaux: 'tableauDecimal', comparerDecimaux: 'tableauDecimal',
  fois10Decimaux: 'tableauDecimal', calculMentalDecimaux: 'tableauDecimal', divisionDecimale: 'pythagore' };

function dessinerFicheRes({ r, gen, niveau, reglages, versions, corrige, titre, graine, adaptation = 0 }) {
  const d = DessinPdf({ ...PAGE_A4_PORTRAIT, titre });
  const src = sourceRes(r)?.texte || '', A = ADAPTATIONS_RES[adaptation] || ADAPTATIONS_RES[0];
  let nombre = Math.max(2, Math.round(reglages.nombre * A.part));
  // Fiche adaptée : on enlève des exercices jusqu'à ce que tout tienne sur une page (aide visuelle comprise).
  if (adaptation) {
    for (; nombre > 1; nombre--) {
      const essai = DessinPdf({ ...PAGE_A4_PORTRAIT }), contenu = gen.fabriquer({ ...reglages, nombre: nombre + (A.exemple ? 1 : 0) }, niveau, hasardRes(graine));
      if (A.exemple && contenu.exercices.length > 1) contenu.exercices[0] = { ...contenu.exercices[0], exemple: true };
      pagesFicheRes(essai, { titre, niveau, contenu, version: '', avecReponses: false, src, A, visuel: VISUELS_RES[r.fiche.gen] });
      if (essai.pages.length === 1) break;
    }
  }
  let premiere = true;
  for (let v = 0; v < versions; v++) {
    const contenu = gen.fabriquer({ ...reglages, nombre: nombre + (A.exemple ? 1 : 0) }, niveau, hasardRes(graine + v * 7919));
    if (A.exemple && contenu.exercices.length > 1) contenu.exercices[0] = { ...contenu.exercices[0], exemple: true };
    const version = versions > 1 ? `Version ${LETTRES_VERSIONS[v]}` : '';
    for (const avecReponses of corrige ? [false, true] : [false]) {
      if (!premiere) d.nouvellePage();
      premiere = false;
      pagesFicheRes(d, { titre, niveau, contenu, version, avecReponses, src, A, visuel: adaptation ? VISUELS_RES[r.fiche.gen] : null });
    }
  }
  return d;
}

function enteteRes(d, { titre, niveau, contenu, version, avecReponses, src, A, visuel }, suite) {
  const M = MARGE_RES, W = d.l - 2 * M, k = A.echelle;
  if (avecReponses) d.texte(M, 50, `Corrigé${version ? ` — ${version}` : ''}`, { taille: 11, gras: true, couleur: COULEUR_CORRIGE });
  else { d.texte(M, 50, 'Prénom : ....................................', { taille: 11 }); d.texte(d.l - M, 50, 'Date : ........................', { taille: 11, ancre: 'fin' }); }
  d.texte(M, 84, d.tenir(titre + (suite ? ' (suite)' : ''), W - 60, 17, true), { taille: 17, gras: true });
  d.texte(d.l - M, 84, [niveau, version].filter(Boolean).join(' · '), { taille: 10, couleur: GRIS_RES, ancre: 'fin' });
  let y = 106;
  const tc = 11 * Math.min(k, 1.3);
  for (const l of d.couper(contenu.consigne, W, tc, k > 1)) { d.texte(M, y, l, { taille: tc, gras: k > 1 }); y += tc * 1.4; }
  if (contenu.aide && (!suite || k > 1)) {
    const ta = 10 * Math.min(k, 1.3), lignes = d.couper(contenu.aide, W - 20, ta);
    d.rect(M, y - 4, W, lignes.length * ta * 1.3 + 10, { fond: '#f2f6f4', trait: '#c9d8d1', rayon: 4 });
    lignes.forEach((l, i) => d.texte(M + 10, y + ta + i * ta * 1.3, l, { taille: ta }));
    y += lignes.length * ta * 1.3 + 16;
  }
  if (visuel && !suite) y = aideVisuelleRes(d, visuel, y, niveau, k);
  d.texte(M, d.h - 22, d.tenir(`Carnet École${src ? ` · ${src}` : ''}`, W, 7), { taille: 7, couleur: GRIS_RES });
  return y + 12;
}

// Aides visuelles de la fiche adaptée : frise numérique, tableau de numération, table de Pythagore, mots-nombres.
// (Le schéma en barres et les lettres des colonnes sont dessinés dans les exercices eux-mêmes.)
function aideVisuelleRes(d, visuel, y, niveau, k) {
  const M = MARGE_RES, W = d.l - 2 * M, cycle2 = NIVEAUX_CYCLE_RES[2].includes(niveau);
  if (visuel === 'frise20' || (visuel === 'frise100' && cycle2)) {
    const n = 20, dix = visuel === 'frise100', pas = (W - 20) / n, yl = y + 14;
    d.ligne(M + 10, yl, M + 10 + n * pas, yl, { trait: '#555555', ep: 1 });
    for (let i = 0; i <= n; i++) {
      const x = M + 10 + i * pas, v = dix ? i * 5 : i, grand = dix ? v % 10 === 0 : i % 5 === 0;
      d.ligne(x, yl - (grand ? 6 : 3), x, yl + (grand ? 6 : 3), { trait: '#555555', ep: grand ? 1 : 0.6 });
      if (!dix || v % 10 === 0) d.texte(x, yl + 18, String(v), { taille: 8.5 * Math.min(k, 1.3), ancre: 'milieu', gras: grand });
    }
    return y + 34;
  }
  if (visuel === 'cdu') {
    const rangs = { CP: ['d', 'u'], CE1: ['c', 'd', 'u'], CE2: ['m', 'c', 'd', 'u'] }[niveau] || ['cm', 'dm', 'm', 'c', 'd', 'u'];
    const noms = { cm: 'centaines de mille', dm: 'dizaines de mille', m: 'milliers', c: 'centaines', d: 'dizaines', u: 'unités' };
    const lc = Math.min(70, (W - 10) / rangs.length), x0 = M + (W - lc * rangs.length) / 2;
    rangs.forEach((r, i) => {
      d.rect(x0 + i * lc, y, lc, 18, { fond: '#e8efec', trait: '#9db3aa', ep: 0.6 });
      d.rect(x0 + i * lc, y + 18, lc, 24, { trait: '#9db3aa', ep: 0.6 });
      d.texte(x0 + i * lc + lc / 2, y + 12.5, d.tenir(noms[r], lc - 4, 7.5, true), { taille: 7.5, gras: true, ancre: 'milieu' });
    });
    return y + 50;
  }
  if (visuel === 'pythagore') {
    const c = Math.min(26, (W - 10) / 11) * 0.85, x0 = M + (W - c * 11) / 2, t = 7.5;
    for (let i = 0; i <= 10; i++) for (let j = 0; j <= 10; j++) {
      if (!i && !j) { d.texte(x0 + c / 2, y + c * 0.7, '×', { taille: t, gras: true, ancre: 'milieu' }); continue; }
      const titre = !i || !j, v = !i ? j : !j ? i : i * j;
      d.rect(x0 + j * c, y + i * c, c, c, { fond: titre ? '#e8efec' : (i === j ? '#f6f1df' : undefined), trait: '#c9d1cd', ep: 0.4 });
      d.texte(x0 + j * c + c / 2, y + i * c + c * 0.68, String(v), { taille: t, gras: titre, ancre: 'milieu' });
    }
    return y + 11 * c + 6;
  }
  if (visuel === 'motsNombres') {
    const mots = [[1, 'un'], [2, 'deux'], [3, 'trois'], [4, 'quatre'], [5, 'cinq'], [6, 'six'], [7, 'sept'], [8, 'huit'], [9, 'neuf'], [10, 'dix'],
      [11, 'onze'], [12, 'douze'], [13, 'treize'], [14, 'quatorze'], [15, 'quinze'], [16, 'seize'], [20, 'vingt'], [30, 'trente'], [40, 'quarante'],
      [50, 'cinquante'], [60, 'soixante'], [70, 'soixante-dix'], [80, 'quatre-vingts'], [90, 'quatre-vingt-dix'], [100, 'cent'], [1000, 'mille']];
    const cols = 4, lc = W / cols, t = 9 * Math.min(k, 1.2), h = t * 1.45, lignes = Math.ceil(mots.length / cols);
    d.rect(M, y - 2, W, lignes * h + 10, { fond: '#f7f7f2', trait: '#d8d8c8', rayon: 4 });
    mots.forEach(([v, m], i) => {
      const x = M + 8 + Math.floor(i / lignes) * lc, yy = y + 10 + (i % lignes) * h;
      d.texte(x, yy, nbRes(v), { taille: t, gras: true }); d.texte(x + 34, yy, m, { taille: t });
    });
    return y + lignes * h + 14;
  }
  if (visuel === 'bandesFractions') { // (« mur des fractions » : la même unité partagée en 2, 3, 4… parts égales)
    const dens = niveau === 'CE1' || niveau === 'CP' ? [1, 2, 3, 4, 5, 6, 8, 10] : [1, 2, 3, 4, 5, 6, 8, 10, 12], h = 11 * Math.min(k, 1.2), xb = M + 40, wb = W - 50, t = 7.5;
    dens.forEach((dn, r) => {
      const yy = y + r * (h + 2);
      d.texte(M + 18, yy + h * 0.78, dn === 1 ? '1' : `1/${dn}`, { taille: t + 1, gras: true, ancre: 'milieu' });
      for (let j = 0; j < dn; j++) d.rect(xb + j * wb / dn, yy, wb / dn, h, { fond: r % 2 ? '#eef5f2' : '#f7f7f2', trait: '#9db3aa', ep: 0.6 });
    });
    return y + dens.length * (h + 2) + 8;
  }
  if (visuel === 'tableauDecimal') { // (tableau de numération avec la virgule, et les relations entre les unités)
    const rangs = niveau === 'CM2' ? ['centaines', 'dizaines', 'unités', 'dixièmes', 'centièmes', 'millièmes'] : ['centaines', 'dizaines', 'unités', 'dixièmes', 'centièmes'];
    const lc = Math.min(78, (W - 10) / rangs.length), x0 = M + (W - lc * rangs.length) / 2, iv = rangs.indexOf('unités') + 1;
    rangs.forEach((nom, i) => {
      d.rect(x0 + i * lc, y, lc, 18, { fond: i < iv ? '#e8efec' : '#f6f1df', trait: '#9db3aa', ep: 0.6 });
      d.rect(x0 + i * lc, y + 18, lc, 24, { trait: '#9db3aa', ep: 0.6 });
      d.texte(x0 + i * lc + lc / 2, y + 12.5, d.tenir(nom, lc - 4, 7.5, true), { taille: 7.5, gras: true, ancre: 'milieu' });
    });
    d.ligne(x0 + iv * lc, y - 2, x0 + iv * lc, y + 44, { trait: '#b0413e', ep: 1.6 });
    d.texte(x0 + iv * lc, y + 38, ',', { taille: 16, gras: true, couleur: '#b0413e', ancre: 'milieu' });
    const rel = niveau === 'CM2' ? '1 unité = 10 dixièmes = 100 centièmes = 1 000 millièmes' : '1 unité = 10 dixièmes = 100 centièmes ; 1 dixième = 10 centièmes';
    d.texte(M + W / 2, y + 58, d.tenir(rel, W, 9 * Math.min(k, 1.2)), { taille: 9 * Math.min(k, 1.2), ancre: 'milieu', couleur: '#33524a' });
    return y + 66;
  }
  return y;
}

// Figure partagée en parts égales (bande, disque, rectangle quadrillé) ; `colorier` : les parts `fig.cases` sont coloriées.
function dessinerFigureRes(d, fig, cx, y0, maxW, FH, colorier) {
  const FOND = '#9fd3c2', TRAIT = '#333333', pris = new Set(colorier ? fig.cases : []);
  if (fig.forme === 'disque') {
    const r = Math.min(FH, maxW) / 2 - 1, cy = y0 + FH / 2, pt = a => [cx + r * Math.sin(a * Math.PI / 180), cy - r * Math.cos(a * Math.PI / 180)];
    for (let j = 0; j < fig.d; j++) {
      if (!pris.has(j)) continue;
      const a0 = j * 360 / fig.d, a1 = (j + 1) * 360 / fig.d, pts = [[cx, cy]];
      for (let s = 0; s <= 16; s++) pts.push(pt(a0 + (a1 - a0) * s / 16));
      d.trace(pts, { fond: FOND, ferme: true });
    }
    d.cercle(cx, cy, r, { trait: TRAIT, ep: 1.2 });
    for (let j = 0; j < fig.d; j++) { const [x, yy] = pt(j * 360 / fig.d); d.ligne(cx, cy, x, yy, { trait: TRAIT, ep: 0.8 }); }
    return;
  }
  if (fig.forme === 'rectangle') {
    const [lignes, colonnes] = GRILLES_RES[fig.d], s = Math.min(FH / lignes, maxW / colonnes, 26 * FH / 62), x0 = cx - colonnes * s / 2, yy = y0 + (FH - lignes * s) / 2;
    for (let j = 0; j < fig.d; j++) d.rect(x0 + (j % colonnes) * s, yy + Math.floor(j / colonnes) * s, s, s, { fond: pris.has(j) ? FOND : '#ffffff', trait: TRAIT, ep: 0.8 });
    d.rect(x0, yy, colonnes * s, lignes * s, { trait: TRAIT, ep: 1.2 });
    return;
  }
  // Bandes : une par unité quand la fraction est plus grande que 1.
  const U = fig.unites || 1, bh = Math.min(26 * FH / 62, (FH - 8 * (U - 1)) / U), yy = y0 + (FH - U * bh - 8 * (U - 1)) / 2, pw = maxW / fig.d, x0 = cx - maxW / 2;
  for (let u = 0; u < U; u++) {
    const yb = yy + u * (bh + 8);
    for (let j = 0; j < fig.d; j++) d.rect(x0 + j * pw, yb, pw, bh, { fond: pris.has(u * fig.d + j) ? FOND : '#ffffff', trait: TRAIT, ep: 0.8 });
    d.rect(x0, yb, maxW, bh, { trait: TRAIT, ep: 1.2 });
  }
}

function pagesFicheRes(d, infos) {
  const { contenu, avecReponses, A, visuel } = infos, M = MARGE_RES, W = d.l - 2 * M, bas = d.h - 40, k = A.echelle;
  let y = enteteRes(d, infos, false);
  const sautSiBesoin = h => { if (y + h > bas) { d.nouvellePage(); y = enteteRes(d, infos, true); } };
  const ex = contenu.exercices;
  // Numéro de l'exercice (l'exemple fait n'en a pas : il est marqué « Exemple »).
  const premierNumero = ex[0]?.exemple ? 0 : 1;
  const numero = (it, i, x, yy) => d.texte(x, yy, it.exemple ? 'Exemple' : `${i + premierNumero}.`, { taille: it.exemple ? 8 : 8 * Math.min(k, 1.3), gras: !!it.exemple, couleur: it.exemple ? COULEUR_CORRIGE : GRIS_RES });
  const montre = it => avecReponses || it.exemple; // (réponses écrites : corrigé, ou exemple fait)
  const fondExemple = (x, yy, w, h) => d.rect(x, yy, w, h, { fond: '#eef5f2', trait: '#c9d8d1', ep: 0.6, rayon: 4 });

  if (contenu.disposition === 'ligne') {
    const T = 14 * k, blanc = 46 * k, longue = ex.some(it => it.longue);
    // Morceaux d'un exercice : texte, blanc (réponse), fraction en étage (avec ou sans case à remplir dedans ;
    // une réponse qui est une fraction se remplit dans une fraction aux deux cases vides).
    const morceauxDe = it => {
      let n = 0;
      const rep = () => (it.reponses ? it.reponses[n++] : it.reponse);
      return it.parties.map(p => {
        if (p === null) { const r = rep(); return estFracRes(r) ? { frac: r.f.map(v => ({ rep: v })) } : { blanc: String(r) }; }
        if (estFracRes(p)) return { frac: p.f.map(v => (v === null ? { rep: rep() } : { t: v })) };
        return { texte: p };
      });
    };
    const fr = ex.some(it => morceauxDe(it).some(m => m.frac)), dy = fr ? 5 * k : 0; // (fractions en étage : la ligne descend un peu)
    const largeurM = (m, Tt) => (m.texte != null ? d.largeurTexte(m.texte, Tt) : m.frac ? largeurFracCasesRes(d, m.frac, Tt) + 6 : 0);
    // Largeur de chaque blanc : au moins celle de sa réponse (grands nombres du CM2).
    const blancM = m => Math.max(blanc, d.largeurTexte(m.blanc, T, true) + 14);
    const largeurEx = it => morceauxDe(it).reduce((s, m) => s + largeurM(m, T) + ('blanc' in m && !it.longue ? blancM(m) : 0), 0);
    const w = Math.max(...ex.map(largeurEx), 60) + 26;
    const cols = longue ? 1 : Math.max(1, Math.min(k > 1 ? 2 : 3, Math.floor(W / (w + 16)))), lc = W / cols, H = 32 * k * (A.exemple ? 1.15 : 1) * (fr ? 1.25 : 1);
    for (let i = 0; i < ex.length; i += cols) {
      sautSiBesoin(H);
      ex.slice(i, i + cols).forEach((it, c) => {
        let x = M + c * lc;
        if (it.exemple) fondExemple(x - 4, y + 2, lc - 8, H - 4);
        numero(it, i + c, x, y + 18 * k + dy);
        x += it.exemple ? 40 : 18 * Math.min(k, 1.3);
        // Blanc d'une réponse longue (écrire en lettres, ranger, dictée) : toute la place qui reste sur la ligne.
        // (un très long nombre en lettres, au CM2 : la police se réduit pour que l'énoncé laisse au moins 160 pt pour répondre)
        const ms = morceauxDe(it), finLigne = M + c * lc + lc, larg = ms.reduce((s, m) => s + largeurM(m, T), 0);
        const blancs = ms.filter(m => 'blanc' in m).map(blancM), sommeBlancs = blancs.reduce((s, b) => s + b, 0);
        // (ligne courte trop large — fiche adaptée, plusieurs blancs, grands nombres : tout rétrécit pour tenir dans la largeur)
        const reduc = !it.longue && larg + sommeBlancs > finLigne - x - 4 ? (finLigne - x - 4) / (larg + sommeBlancs) : 1;
        const Tp = it.longue && larg > finLigne - x - 160 ? Math.max(7, T * (finLigne - x - 160) / larg) : T * reduc;
        const blancLong = Math.max(120, finLigne - x - larg * Tp / T - 8);
        let n = 0;
        for (const m of ms) {
          if ('blanc' in m) {
            const bw = it.longue ? blancLong : blancs[n] * reduc, rep = m.blanc;
            d.ligne(x + 2, y + 21 * k + dy, x + bw - 4, y + 21 * k + dy, { trait: '#555555', ep: 0.7 });
            if (montre(it)) {
              if (it.longue) { const tr = Math.max(6.5, Math.min(T * 0.85, T * 0.85 * (bw - 12) / d.largeurTexte(rep, T * 0.85, true))); d.texte(x + 6, y + 18 * k + dy, d.tenir(rep, bw - 10, tr, true), { taille: tr, gras: true, couleur: COULEUR_CORRIGE }); }
              else d.texte(x + bw / 2, y + 18 * k + dy, rep, { taille: Tp, gras: true, couleur: COULEUR_CORRIGE, ancre: 'milieu' });
            }
            x += bw; n++;
          } else if (m.frac) { const wf = largeurFracCasesRes(d, m.frac, Tp); fractionCasesRes(d, x + 3 + wf / 2, y + 18 * k + dy, m.frac, Tp, montre(it)); x += wf + 6; }
          else { d.texte(x, y + 18 * k + dy, m.texte, { taille: Tp }); x += d.largeurTexte(m.texte, Tp); }
        }
      });
      y += H;
    }
    return;
  }

  if (contenu.disposition === 'figures') {
    // Figures partagées en parts égales (bande, disque, rectangle quadrillé) : écrire la fraction coloriée, ou colorier une fraction.
    const cols = k > 1 ? 2 : 3, lc = W / cols, FH = 62 * k, H = FH + 80 * k, Tf = 15 * k;
    for (let i = 0; i < ex.length; i += cols) {
      sautSiBesoin(H);
      ex.slice(i, i + cols).forEach((it, c) => {
        const x0 = M + c * lc, cx = x0 + lc / 2, [num, den] = it.fraction;
        if (it.exemple) fondExemple(x0, y, lc - 8, H - 6);
        numero(it, i + c, x0 + 3, y + 12);
        dessinerFigureRes(d, it.figure, cx, y + 20, Math.min(lc - 40, 150 * k), FH, it.tache === 'lire' || montre(it));
        const yb = y + 20 + FH + 30 * k;
        if (it.tache === 'lire') fractionCasesRes(d, cx, yb, [{ rep: num }, { rep: den }], Tf, montre(it));
        else dessinerRicheRes(d, cx, yb, ['Colorie ', fracRes(num, den)], Tf, { ancre: 'milieu' });
        if (montre(it)) d.texte(cx, yb + 24 * k, d.tenir(it.lecture, lc - 16, 9 * Math.min(k, 1.3)), { taille: 9 * Math.min(k, 1.3), couleur: COULEUR_CORRIGE, ancre: 'milieu' });
      });
      y += H;
    }
    return;
  }

  if (contenu.disposition === 'posee') {
    // Additions, soustractions, multiplications posées. Multiplication par un nombre à 2 chiffres : lignes des produits
    // partiels (« règle des 0 » : 37 × 14 = 37 × 4 + 37 × 10, d'après Eduscol), puis un second trait et le résultat.
    // Fiche adaptée : plus grand, et les lettres des rangs (u, d, c, m) en haut des colonnes.
    const T = 16 * k, cw = 13 * k, ligneH = 24 * k, entete = k > 1 ? 12 : 0;
    const decDe = (it, j) => (it.decs ? it.decs[j] : it.dec) || 0;
    const largeurMax = Math.max(...ex.map(it => Math.max(...it.nombres.map((x, j) => texteNbRes(x, decDe(it, j)).length),
      texteNbRes(it.resultat, it.dec).length, ...(it.partiels || []).map(x => texteNbRes(x, it.dec).length))));
    const boite = (largeurMax + 2) * cw + 16, cols = Math.max(1, Math.min(k > 1 ? 3 : 5, Math.floor(W / (boite + 14)))), lc = W / cols;
    const lignesApres = it => (it.partiels?.length > 1 ? it.partiels.length + 1 : 1);
    const hauteur = it => 14 + entete + it.nombres.length * ligneH + 10 + lignesApres(it) * ligneH + (it.partiels?.length > 1 ? 6 : 0) + 16;
    const signe = op => (op === '+' ? '+' : op === '×' ? '×' : MOINS_RES);
    const ecrireNb = (s, droite, yl, o) => [...s].reverse().forEach((ch, c) => d.texte(droite - c * cw - cw / 2, yl, ch, { taille: T, ancre: 'milieu', ...o }));
    for (let i = 0; i < ex.length; i += cols) {
      const rang = ex.slice(i, i + cols), H = Math.max(...rang.map(hauteur));
      sautSiBesoin(H);
      rang.forEach((it, c) => {
        const x0 = M + c * lc + (lc - boite) / 2, droite = x0 + boite - 8;
        if (it.exemple) fondExemple(M + c * lc, y, lc - 6, H - 6);
        numero(it, i + c, M + c * lc + 3, y + 10);
        // Cases légères : une colonne par chiffre (une de plus, comme le conseille Eduscol, pour la retenue du rang suivant).
        const nCols = largeurMax + 1, yHaut = y + 14 + entete, yBas = y + hauteur(it) - 16;
        for (let col = 0; col < nCols; col++) d.rect(droite - (col + 1) * cw, yHaut, cw, yBas - yHaut, { trait: '#e3e3e3', ep: 0.5 });
        if (entete && !it.dec) ['u', 'd', 'c', 'm', 'dm', 'cm'].slice(0, nCols).forEach((l, col) => d.texte(droite - col * cw - cw / 2, yHaut - 3, l, { taille: 8, gras: true, couleur: '#5b8f80', ancre: 'milieu' }));
        it.nombres.forEach((nb, j) => {
          const yl = yHaut + (j + 1) * ligneH - 6;
          ecrireNb(texteNbRes(nb, decDe(it, j)), droite, yl);
          if (j > 0) d.texte(droite - nCols * cw - 6, yl, signe(it.op), { taille: T, ancre: 'fin' });
        });
        const trait = yy => d.ligne(droite - nCols * cw - 16, yy, droite, yy, { trait: '#222222', ep: 1.2 });
        const yTrait = yHaut + it.nombres.length * ligneH + 4;
        trait(yTrait);
        let yRes = yTrait;
        if (it.partiels?.length > 1) {
          it.partiels.forEach((p, j) => {
            const yl = yTrait + (j + 1) * ligneH - 4;
            if (montre(it)) ecrireNb(texteNbRes(p, it.dec), droite, yl, { couleur: '#5b8f80' });
            if (j === it.partiels.length - 1) d.texte(droite - nCols * cw - 6, yl, '+', { taille: T, ancre: 'fin', couleur: montre(it) ? '#5b8f80' : '#bbbbbb' });
          });
          yRes = yTrait + it.partiels.length * ligneH + 6;
          trait(yRes);
        }
        if (montre(it)) ecrireNb(texteNbRes(it.resultat, it.dec), droite, yRes + ligneH - 4, { gras: true, couleur: COULEUR_CORRIGE });
      });
      y += H;
    }
    return;
  }

  if (contenu.disposition === 'potence') {
    // Divisions posées « en potence » : dividende | diviseur, place pour les étapes ; corrigé : quotient, reste et l'égalité.
    const T = 16 * k, cw = 13 * k, cols = k > 1 || ex.some(it => it.decimale) ? 2 : 3, lc = W / cols; // (division décimale : le quotient est plus long)
    // (division décimale : dividende et quotient à virgule, pas de reste ; place pour les zéros ajoutés au dividende)
    const texteDividende = it => (it.decimale ? it.texteDividende : String(it.dividende));
    const etapes = it => (it.decimale ? Math.max(it.texteDividende.replace(',', '').length, it.texteQuotient.replace(',', '').length) : String(it.dividende).length);
    const hauteur = it => 26 + etapes(it) * 2 * 20 * k + 40;
    for (let i = 0; i < ex.length; i += cols) {
      const rang = ex.slice(i, i + cols), H = Math.max(...rang.map(hauteur));
      sautSiBesoin(H);
      rang.forEach((it, c) => {
        const x0 = M + c * lc + 18, s = texteDividende(it), xBarre = x0 + (s.length + (it.decimale ? 2 : 1)) * cw, yHaut = y + 30, yBas = y + H - 34;
        if (it.exemple) fondExemple(M + c * lc, y, lc - 8, H - 6);
        numero(it, i + c, M + c * lc + 3, y + 12);
        [...s].forEach((ch, j) => d.texte(x0 + j * cw + cw / 2, yHaut, ch, { taille: T, ancre: 'milieu' }));
        d.ligne(xBarre, yHaut - 16, xBarre, yBas, { trait: '#222222', ep: 1.2 });
        d.texte(xBarre + 10, yHaut, String(it.diviseur), { taille: T });
        d.ligne(xBarre, yHaut + 6, xBarre + 62 * k, yHaut + 6, { trait: '#222222', ep: 1.2 });
        if (it.decimale) {
          if (montre(it)) d.texte(xBarre + 10, yHaut + 26 * k, it.texteQuotient, { taille: T, gras: true, couleur: COULEUR_CORRIGE });
          d.texte(x0, yBas + 18, montre(it) ? `${s} = ${it.diviseur} × ${it.texteQuotient}` : `${s} = ${it.diviseur} × …………`, { taille: 10, couleur: montre(it) ? COULEUR_CORRIGE : GRIS_RES });
        } else if (montre(it)) {
          d.texte(xBarre + 10, yHaut + 26 * k, String(it.quotient), { taille: T, gras: true, couleur: COULEUR_CORRIGE });
          d.texte(x0, yBas, `reste ${it.reste}`, { taille: 11, gras: true, couleur: COULEUR_CORRIGE });
          d.texte(x0, yBas + 18, `${nbRes(it.dividende)} = ${it.diviseur} × ${nbRes(it.quotient)} + ${it.reste}`, { taille: 10, couleur: COULEUR_CORRIGE });
        } else d.texte(x0, yBas + 18, `${nbRes(it.dividende)} = ${it.diviseur} × ………… + ……`, { taille: 10, couleur: GRIS_RES });
      });
      y += H;
    }
    return;
  }

  if (contenu.disposition === 'droite') {
    // Demi-droite graduée : 10 intervalles (ou `n`), deux repères écrits (ou les textes `textes` de chaque graduation : décimaux,
    // fractions) ; lire les points A, B, C ou placer des nombres. `etage` : des fractions en étage, il faut plus de place.
    const t = 10 * Math.min(k, 1.3), tv = 12 * Math.min(k, 1.3);
    for (const [i, it] of ex.entries()) {
      const g = it.droite, N = g.n || 10, et = !!g.etage, H = (et ? 136 : 104) * k;
      sautSiBesoin(H);
      const x0 = M + 26, pas = (W - 60) / N, yl = y + (et ? 66 : 52) * Math.min(k, 1.2), xi = j => x0 + j * pas;
      const valeur = p => p.texte ?? nbRes(p.valeur), repere = j => (g.textes ? g.textes[j] : g.reperes.includes(j) ? nbRes(g.debut + j * g.pas) : null);
      if (it.exemple) fondExemple(M - 4, y, W + 8, H - 8);
      numero(it, i, M, y + 14);
      if (g.type === 'placer') {
        const consigne = ['Place : ', ...g.points.flatMap((p, j) => [...(j ? [' ; '] : []), ...morceauxRicheRes(valeur(p))])];
        dessinerRicheRes(d, M + (it.exemple ? 44 : 18), y + (et ? 20 : 14), consigne, 11 * Math.min(k, 1.3), { gras: true });
      }
      d.ligne(x0 - 12, yl, xi(N) + 18, yl, { trait: '#222222', ep: 1.2 });
      d.trace([[xi(N) + 18, yl - 4], [xi(N) + 26, yl], [xi(N) + 18, yl + 4]], { fond: '#222222', ferme: true });
      for (let j = 0; j <= N; j++) {
        const grand = g.grands ? g.grands.includes(j) : j % 5 === 0, r = repere(j);
        d.ligne(xi(j), yl - (grand ? 8 : 5), xi(j), yl + (grand ? 8 : 5), { trait: '#222222', ep: grand ? 1.1 : 0.7 });
        if (r != null) dessinerRicheRes(d, xi(j), yl + (contientFracRes(r) ? 27 : 22), r, t, { gras: true, ancre: 'milieu' });
      }
      for (const p of g.points) {
        if (g.type === 'lire') {
          d.texte(xi(p.i), yl - 20, p.lettre, { taille: t + 1, gras: true, ancre: 'milieu' });
          d.ligne(xi(p.i), yl - 16, xi(p.i), yl - 9, { trait: '#222222', ep: 0.8 });
        } else if (montre(it)) {
          const v = valeur(p);
          d.ligne(xi(p.i), yl - 22, xi(p.i), yl - 10, { trait: COULEUR_CORRIGE, ep: 1.2 });
          dessinerRicheRes(d, xi(p.i), yl - (contientFracRes(v) ? 31 : 26), v, t, { gras: true, couleur: COULEUR_CORRIGE, ancre: 'milieu' });
        }
      }
      if (g.type === 'lire') {
        const ly = yl + (et ? 52 : 44) * Math.min(k, 1.2);
        g.points.forEach((p, j) => {
          const x = M + 18 + j * (W / 3);
          d.texte(x, ly, `${p.lettre} = `, { taille: tv, gras: true });
          d.ligne(x + 26, ly + 2, x + W / 3 - 30, ly + 2, { trait: '#888888', ep: 0.6, tirets: [2, 2] });
          if (montre(it)) dessinerRicheRes(d, x + 32, ly, valeur(p), tv, { gras: true, couleur: COULEUR_CORRIGE });
        });
      }
      y += H;
    }
    return;
  }

  // Problèmes : énoncé, cadre de recherche, phrase réponse. Fiche adaptée : plus gros, et un schéma en barres à compléter.
  const T = 12 * Math.min(k, 1.35), barres = visuel === 'barres';
  for (const [i, it] of ex.entries()) {
    const lignes = d.couper(it.texte, W - 22, T), cadre = montre(it) ? 26 * k : (barres ? 96 : 74) * k, H = lignes.length * T * 1.35 + cadre + 40 * k;
    sautSiBesoin(H);
    if (it.exemple) fondExemple(M - 4, y, W + 8, H - 6);
    if (it.exemple) d.texte(M, y + 12, 'Exemple', { taille: 8, gras: true, couleur: COULEUR_CORRIGE });
    else d.texte(M, y + 12, `${i + premierNumero}.`, { taille: T, gras: true });
    lignes.forEach((l, j) => d.texte(M + 20, y + 12 + (it.exemple ? 12 : 0) + j * T * 1.35, l, { taille: T }));
    let yy = y + 12 + (it.exemple ? 12 : 0) + lignes.length * T * 1.35;
    d.rect(M + 20, yy - 4, W - 20, cadre, { trait: '#bbbbbb', ep: 0.6, rayon: 4 });
    if (montre(it)) d.texte(M + 30, yy + 14, it.calcul, { taille: 11 * Math.min(k, 1.3), couleur: COULEUR_CORRIGE });
    else {
      d.texte(M + 28, yy + 9, 'Je cherche :', { taille: 8, couleur: GRIS_RES });
      if (barres) { // (schéma en barres vide : le tout en haut, les parties en dessous)
        const bx = M + 40, bw = Math.min(260, W - 80), by = yy + 16;
        d.rect(bx, by, bw, 18 * k, { trait: '#7a9a8f', ep: 0.8 });
        d.rect(bx, by + 22 * k, bw * 0.55, 18 * k, { trait: '#7a9a8f', ep: 0.8 });
        d.rect(bx + bw * 0.55, by + 22 * k, bw * 0.45, 18 * k, { trait: '#7a9a8f', ep: 0.8 });
      }
    }
    yy += cadre + 14 * k;
    d.texte(M + 20, yy, 'Réponse :', { taille: 11 * Math.min(k, 1.3) });
    if (montre(it)) d.texte(M + 80 * Math.min(k, 1.3), yy, it.reponse, { taille: 11 * Math.min(k, 1.3), gras: true, couleur: COULEUR_CORRIGE });
    else d.ligne(M + 76 * Math.min(k, 1.3), yy + 2, d.l - M, yy + 2, { trait: '#888888', ep: 0.6, tirets: [2, 2] });
    y += H;
  }
}

/* ---------- Fiche de l'activité (pour l'enseignant) ---------- */

// Une fiche lisible d'un coup d'œil : bandeau, trois repères (type, durée, niveaux), « En bref », ce que l'élève apprend,
// matériel, étapes numérotées, variantes, et — quand l'appli fabrique la fiche élève — un exemple corrigé de ce que l'élève fera.
const COULEURS_FICHE_RES = { accent: '#1f6f5c', clair: '#d6ebe3', teinte: '#eef5f2', bord: '#c9d8d1', texte: '#1d2b27', gris: '#5b6a66',
  variante: '#fdf6e7', bordVariante: '#e7d29d', exemple: '#f3f5fa', bordExemple: '#c8d0e4' };
const listeRes = t => (Array.isArray(t) ? t : String(t || '').split('\n')).map(x => x.trim()).filter(Boolean);

// Quelques exercices de la fiche élève, avec leurs réponses (toujours les mêmes : graine fixe), au niveau du milieu de la ressource.
function exempleFicheRes(r) {
  const gen = GENERATEURS_FICHES[r.fiche?.gen];
  if (!gen) return null;
  const niveaux = r.niveaux?.length ? r.niveaux : NIVEAUX_CYCLE_RES[r.cycle], niveau = niveaux[Math.floor((niveaux.length - 1) / 2)];
  const reglages = Object.fromEntries(gen.options(niveau).map(o => [o.cle, r.fiche.options?.[o.cle] ?? o.defaut]));
  const c = gen.fabriquer({ ...reglages, nombre: 6 }, niveau, hasardRes(20261117));
  const texteNb = (x, dec) => (dec ? `${String(x).padStart(dec + 1, '0').slice(0, -dec)},${String(x).padStart(dec + 1, '0').slice(-dec)}` : nbRes(x));
  const signe = op => (op === '+' ? ' + ' : op === '×' ? ' × ' : ` ${MOINS_RES} `);
  // (fractions écrites « en ligne » : 3/8 ; une case vide dans une fraction montre sa réponse en couleur)
  const segsLigne = it => {
    let k = 0;
    const rep = () => (it.reponses ? it.reponses[k++] : it.reponse);
    return it.parties.flatMap(p => (p === null ? [{ t: texteRicheRes(rep()), rep: true }]
      : estFracRes(p) ? p.f.flatMap((v, i) => [...(i ? [{ t: '/' }] : []), v === null ? { t: texteValRes(rep()), rep: true } : { t: texteValRes(v) }]) : [{ t: p }]));
  };
  const items = c.disposition === 'ligne' ? c.exercices.map(segsLigne)
    : c.disposition === 'posee' ? c.exercices.map(it => [{ t: `${it.nombres.map((x, j) => texteNb(x, (it.decs ? it.decs[j] : it.dec) || 0)).join(signe(it.op))} = ` }, { t: texteNb(it.resultat, it.dec), rep: true }])
      : c.disposition === 'potence' ? c.exercices.map(it => (it.decimale ? [{ t: `${it.texteDividende} ÷ ${it.diviseur} = ` }, { t: it.texteQuotient, rep: true }]
        : [{ t: `${nbRes(it.dividende)} ÷ ${it.diviseur} : ` }, { t: `quotient ${nbRes(it.quotient)}, reste ${it.reste}`, rep: true }]))
        : c.disposition === 'droite' ? c.exercices.map(it => [{ t: `${it.droite.resume ?? `De ${nbRes(it.droite.debut)}, de ${nbRes(it.droite.pas)} en ${nbRes(it.droite.pas)}`} : ` },
          ...it.droite.points.flatMap((p, j) => [{ t: `${j ? '; ' : ''}${p.lettre} = ` }, { t: p.texte != null ? texteRicheRes(p.texte) : nbRes(p.valeur), rep: true }])])
          : c.disposition === 'figures' ? c.exercices.map(it => (it.tache === 'lire'
            ? [{ t: `Partagée en ${it.fraction[1]}, ${it.fraction[0]} part${it.fraction[0] > 1 ? 's' : ''} coloriée${it.fraction[0] > 1 ? 's' : ''} : ` }, { t: `${it.fraction[0]}/${it.fraction[1]} (${it.lecture})`, rep: true }]
            : [{ t: `Colorier ${it.fraction[0]}/${it.fraction[1]} : ` }, { t: `${it.fraction[0]} des ${it.fraction[1]} parts égales`, rep: true }]))
            : null;
  // (lignes longues : « trouve le bon résultat », divisions → une ou deux colonnes)
  const large = items && items.some(segs => segs.reduce((s, x) => s + x.t.length, 0) > 26);
  const uneColonne = items && items.some(segs => segs.reduce((s, x) => s + x.t.length, 0) > 44);
  if (uneColonne) items.splice(3); // (exemples longs, une seule colonne : trois suffisent)
  else if (large && c.disposition !== 'posee') items.splice(4); // (deux colonnes : quatre suffisent)
  return { niveau, consigne: c.consigne, aide: c.aide, items, probleme: c.disposition === 'probleme' ? c.exercices[0] : null, posee: c.disposition === 'posee' || large,
    uneColonne };
}

function dessinerActiviteRes(r) {
  const C = COULEURS_FICHE_RES, d = DessinPdf({ ...PAGE_A4_PORTRAIT, titre: r.titre }), M = 40, W = d.l - 2 * M, BAS = d.h - 50;
  const mat = matieresRes().find(m => m.ca === r.matiere), [sorteNom] = SORTES_RES[r.sorte] || SORTES_RES.seance;
  const src = sourceRes(r), sourceNom = src?.texte || '';
  let y = 0;
  const nouvellePage = () => {
    d.nouvellePage();
    d.rect(0, 0, d.l, 6, { fond: C.accent });
    d.texte(M, 30, d.tenir(`${r.titre} (suite)`, W, 9, true), { taille: 9, gras: true, couleur: C.gris });
    y = 52;
  };
  const place = h => { if (y + h > BAS) nouvellePage(); };
  const titreSection = (t, suite = 40) => {
    place(26 + suite); // (un titre ne reste jamais seul en bas de page)
    d.rect(M, y, 4, 15, { fond: C.accent });
    d.texte(M + 11, y + 12, t, { taille: 13, gras: true, couleur: C.accent });
    y += 25;
  };
  // Texte fait de morceaux (un morceau « réponse » en couleur) : renvoie la largeur.
  const morceaux = (x, yy, segs, taille) => {
    for (const s of segs) {
      if (s.rep) x += 3; // (petit écart : les polices de l'aperçu ne font pas tout à fait la largeur d'Helvetica)
      d.texte(x, yy, s.t, { taille, gras: !!s.rep, couleur: s.rep ? C.accent : C.texte });
      x += d.largeurTexte(s.t, taille, !!s.rep);
    }
  };

  // Bandeau : matière et cycle, titre.
  const lignesTitre = d.couper(r.titre, W, 21, true).slice(0, 3), hBandeau = 46 + lignesTitre.length * 25;
  d.rect(0, 0, d.l, hBandeau, { fond: C.accent });
  d.texte(M, 28, `FICHE DE L’ACTIVITÉ · ${[mat?.titre, `cycle ${r.cycle}`].filter(Boolean).join(' · ').toUpperCase()}`, { taille: 8.5, gras: true, couleur: C.clair });
  lignesTitre.forEach((l, i) => d.texte(M, 56 + i * 25, l, { taille: 21, gras: true, couleur: '#ffffff' }));
  y = hBandeau + 16;

  // Trois repères.
  const infos = [['Type', sorteNom], ['Durée', r.duree || '—'], ['Niveaux', (r.niveaux || []).join(', ') || 'Tous']];
  const pw = (W - 20) / 3;
  infos.forEach(([k, v], i) => {
    const x = M + i * (pw + 10);
    d.rect(x, y, pw, 46, { fond: C.teinte, trait: C.bord, rayon: 6 });
    d.texte(x + 12, y + 17, k.toUpperCase(), { taille: 7.5, gras: true, couleur: C.gris });
    d.texte(x + 12, y + 35, d.tenir(v, pw - 24, 12.5, true), { taille: 12.5, gras: true, couleur: C.texte });
  });
  y += 46 + 20;

  // En bref.
  if (r.resume) {
    titreSection('En bref');
    for (const l of d.couper(r.resume, W, 12)) { place(17); d.texte(M, y + 11, l, { taille: 12, couleur: C.texte }); y += 17; }
    y += 12;
  }

  // Ce que l'élève apprend (compétences du programme).
  const objs = objectifsRes(r.cycle, r.matiere).filter(o => (r.objectifs || []).includes(o.code));
  if (objs.length) {
    const blocs = objs.map(o => ({ o, lignes: d.couper(o.texte, W - 86, 10.5) }));
    const h = blocs.reduce((s, b) => s + b.lignes.length * 14 + 8, 0) + 14;
    titreSection('L’élève apprend à…', h);
    place(h);
    d.rect(M, y, W, h, { fond: C.teinte, trait: C.bord, rayon: 6 });
    let yy = y + 11;
    for (const { o, lignes } of blocs) {
      const lc = d.largeurTexte(o.code, 9, true) + 12;
      d.rect(M + 12, yy - 1, lc, 15, { fond: '#ffffff', trait: C.bord, rayon: 4 });
      d.texte(M + 12 + lc / 2, yy + 10, o.code, { taille: 9, gras: true, couleur: C.accent, ancre: 'milieu' });
      lignes.forEach((l, i) => d.texte(M + 74, yy + 10 + i * 14, l, { taille: 10.5, couleur: C.texte }));
      yy += lignes.length * 14 + 8;
    }
    y += h + 14;
  }

  // Matériel.
  const materiel = listeRes(r.materiel);
  if (materiel.length) {
    titreSection('Matériel');
    for (const m of materiel) {
      const lignes = d.couper(m, W - 18, 11);
      place(lignes.length * 15);
      d.rect(M + 2, y + 4, 6, 6, { fond: C.accent, rayon: 1.5 });
      lignes.forEach((l, i) => d.texte(M + 16, y + 11 + i * 15, l, { taille: 11, couleur: C.texte }));
      y += lignes.length * 15 + 3;
    }
    y += 14;
  }

  // Déroulement : étapes numérotées, reliées par un trait.
  const etapes = listeRes(r.deroule);
  if (etapes.length) {
    titreSection('Déroulement');
    etapes.forEach((e, i) => {
      const lignes = d.couper(e, W - 34, 11.5), h = Math.max(24, lignes.length * 15 + 9);
      place(h);
      if (i < etapes.length - 1) d.ligne(M + 11, y + 22, M + 11, y + h + 2, { trait: C.bord, ep: 1.5 });
      d.cercle(M + 11, y + 10, 10, { fond: C.accent });
      d.texte(M + 11, y + 14, String(i + 1), { taille: 10.5, gras: true, couleur: '#ffffff', ancre: 'milieu' });
      lignes.forEach((l, k) => d.texte(M + 32, y + 14 + k * 15, l, { taille: 11.5, couleur: C.texte }));
      y += h;
    });
    y += 14;
  }

  // Variantes et différenciation.
  const variantes = listeRes(r.variantes);
  if (variantes.length) {
    const blocs = variantes.map(v => d.couper(v, W - 36, 10.5)), h = blocs.reduce((s, l) => s + l.length * 14 + 5, 0) + 18;
    titreSection('Variantes et différenciation', h);
    place(h);
    d.rect(M, y, W, h, { fond: C.variante, trait: C.bordVariante, rayon: 6 });
    let yy = y + 12;
    for (const lignes of blocs) {
      d.texte(M + 14, yy + 9, '•', { taille: 11, gras: true, couleur: '#a5761b' });
      lignes.forEach((l, i) => d.texte(M + 26, yy + 9 + i * 14, l, { taille: 10.5, couleur: C.texte }));
      yy += lignes.length * 14 + 5;
    }
    y += h + 14;
  }

  // Exemple de la fiche élève (fabriquée par l'appli), avec les réponses.
  const ex = exempleFicheRes(r);
  if (ex) {
    const T = 12, cols = ex.uneColonne ? 1 : ex.posee ? 2 : 3, lc = (W - 28) / cols;
    const lignesPb = ex.probleme ? d.couper(ex.probleme.texte, W - 28, 11) : [];
    const hContenu = ex.probleme ? lignesPb.length * 15 + 22 : Math.ceil(ex.items.length / cols) * 22;
    const lignesNote = d.couper('Dans l’onglet Ressources, « Préparer la fiche élève » tire de nouveaux nombres à chaque fois : jusqu’à 4 versions différentes, avec le corrigé.', W - 28, 9);
    const h = 30 + hContenu + 10 + lignesNote.length * 12 + 8;
    titreSection(`Ce que l’élève fera — exemple de fiche (${ex.niveau})`, h);
    place(h);
    d.rect(M, y, W, h, { fond: C.exemple, trait: C.bordExemple, rayon: 6 });
    d.texte(M + 14, y + 19, d.tenir(ex.consigne, W - 28, 10, true), { taille: 10, gras: true, couleur: C.gris });
    let yy = y + 40;
    if (ex.probleme) {
      lignesPb.forEach((l, i) => d.texte(M + 14, yy + i * 15, l, { taille: 11, couleur: C.texte }));
      yy += lignesPb.length * 15 + 4;
      morceaux(M + 14, yy, [{ t: 'Réponse : ' }, { t: `${ex.probleme.calcul} — ${ex.probleme.reponse}`, rep: true }], 10.5);
      yy += 18;
    } else {
      ex.items.forEach((segs, i) => morceaux(M + 14 + (i % cols) * lc, yy + Math.floor(i / cols) * 22, segs, Math.min(T, T * (lc - 10) / Math.max(1, segs.reduce((s, x) => s + d.largeurTexte(x.t, T, !!x.rep) + (x.rep ? 3 : 0), 0)))));  // (ligne trop longue : plus petit)
      yy += Math.ceil(ex.items.length / cols) * 22;
    }
    lignesNote.forEach((l, i) => d.texte(M + 14, yy + i * 12, l, { taille: 9, couleur: C.gris }));
    y += h + 14;
  }

  // Source.
  if (sourceNom) {
    const lignes = d.couper(sourceNom, W, 8.5);
    // (la source peut descendre jusqu'au trait du pied de page)
    if (y + lignes.length * 11 + (src?.url ? 11 : 0) > d.h - 38) nouvellePage();
    lignes.forEach((l, i) => d.texte(M, y + i * 11, l, { taille: 8.5, couleur: C.gris }));
    y += lignes.length * 11;
    if (src?.url) d.texte(M, y, d.tenir(src.url, W, 7.5), { taille: 7.5, couleur: C.gris });
  }

  // Pied de chaque page.
  const n = d.pages.length;
  for (let p = 0; p < n; p++) {
    d.allerPage(p);
    d.ligne(M, d.h - 32, d.l - M, d.h - 32, { trait: C.bord, ep: 0.6 });
    d.texte(M, d.h - 20, `Carnet École · ${r.perso ? 'ressource ajoutée par l’enseignant' : 'banque de ressources'}`, { taille: 7.5, couleur: C.gris });
    if (n > 1) d.texte(d.l - M, d.h - 20, `${p + 1} / ${n}`, { taille: 7.5, couleur: C.gris, ancre: 'fin' });
  }
  return d;
}

async function apercuActiviteRes(r) {
  if (!r) return;
  const dessin = dessinerActiviteRes(r), pages = dessin.pages.map((_, i) => dessin.versSvg(i)), nom = r.titre.replace(/[\\/:*?"<>|]/g, '');
  const { d, resultat } = ouvrirModale('Fiche de l’activité',
    `<p class="aide">La fiche pour l’enseignant, sur une page : ce que l’élève apprend, le matériel, les étapes, les variantes, un exemple de la fiche élève et la source.</p><div class="apercu-pdf">${pages.map(s => `<div class="feuille-pdf">${s}</div>`).join('')}</div>`,
    `<button type="button" class="primaire" data-pdf>${iconeEcole('telecharger')}Télécharger le PDF</button><button type="button" data-imprimer>${iconeEcole('imprimer')}Imprimer</button><span class="espace"></span><button type="button" data-fermer autofocus>Fermer</button>`,
    'modale-large modale-apercu-pdf');
  iconeTitreModale?.(d, 'regarder');
  d.addEventListener('click', e => {
    if (e.target.closest('[data-pdf]')) lancer(async () => { telechargerBlob(new Blob([await dessin.versPdf()], { type: 'application/pdf' }), `${nom}.pdf`); toast('PDF enregistré dans tes téléchargements', 'ok'); });
    if (e.target.closest('[data-imprimer]')) imprimerZoneEcole(`<div class="impression-pdf">${pages.join('')}</div>`, nom);
  });
  await resultat;
}

/* ---------- Ajouter ou modifier une ressource de l'enseignant ---------- */

async function editerRessource(r, e) {
  const nouvelle = !r;
  r = r ? { ...structuredClone(r), sorte: r.genre || 'seance', objectifs: r.objectifs || [], niveaux: r.niveaux || [] } : { sorte: 'jeu', matiere: e.matiere, cycle: e.cycle, objectifs: e.objectif ? [e.objectif] : [], niveaux: e.niveau ? [e.niveau] : [] };
  const mats = matieresRes();
  const htmlObjectifs = () => {
    const objs = objectifsRes(r.cycle, r.matiere);
    return objs.length ? `<select data-ed-res="objectifs" multiple size="8">${objs.map(o => `<option value="${esc(o.code)}"${r.objectifs.includes(o.code) ? ' selected' : ''}>${esc(o.code)} — ${esc(o.texte)} (${esc(o.niveaux.join(', '))})</option>`).join('')}</select>` : '<p class="aide">Pas d’objectifs pour ce cycle.</p>';
  };
  const { d, resultat } = ouvrirModale(nouvelle ? 'Ajouter ma ressource' : 'Modifier ma ressource', `
    <p class="aide">Ton idée d’activité est rangée dans ton carnet (aucune donnée d’élève). Si elle vient d’un document, note la source.</p>
    <label>Titre<input name="titre" required maxlength="90" value="${esc(r.titre || '')}" placeholder="ex. Le jeu du saladier"></label>
    <div class="ligne">
      <label>Matière<select name="matiere" data-ed-res="matiere">${mats.map(m => `<option value="${esc(m.ca)}"${m.ca === r.matiere ? ' selected' : ''}>${esc(m.titre)}</option>`).join('')}</select></label>
      <label>Cycle<select name="cycle" data-ed-res="cycle">${[2, 3].map(cy => `<option value="${cy}"${cy === +r.cycle ? ' selected' : ''}>Cycle ${cy}</option>`).join('')}</select></label>
      <label>Sorte<select name="sorte">${Object.entries(SORTES_RES).filter(([k]) => k !== 'fiche').map(([k, [nom]]) => `<option value="${k}"${k === r.sorte ? ' selected' : ''}>${esc(nom)}</option>`).join('')}</select></label>
      <label>Durée<input name="duree" maxlength="40" value="${esc(r.duree || '')}" placeholder="ex. 10 min"></label>
    </div>
    <fieldset class="niveaux-ed-res"><legend>Niveaux</legend><span data-ed-res="niveaux">${niveauxEdRes(r)}</span></fieldset>
    <label>Compétences travaillées <span class="aide">(Ctrl + clic pour en choisir plusieurs)</span><span data-ed-res="liste-objectifs">${htmlObjectifs()}</span></label>
    <label>En deux mots<textarea name="resume" rows="2" maxlength="400">${esc(r.resume || '')}</textarea></label>
    <label>Matériel <span class="aide">(une ligne par élément)</span><textarea name="materiel" rows="2" maxlength="600">${esc((Array.isArray(r.materiel) ? r.materiel.join('\n') : r.materiel) || '')}</textarea></label>
    <label>Déroulement <span class="aide">(une ligne par étape)</span><textarea name="deroule" rows="5" maxlength="2000">${esc((Array.isArray(r.deroule) ? r.deroule.join('\n') : r.deroule) || '')}</textarea></label>
    <label>Variantes et différenciation<textarea name="variantes" rows="2" maxlength="1000">${esc((Array.isArray(r.variantes) ? r.variantes.join('\n') : r.variantes) || '')}</textarea></label>
    <label>Source <span class="aide">(document, site d’académie…)</span><input name="sourceTexte" maxlength="200" value="${esc(r.sourceTexte || '')}"></label>`,
  boutonsModale('Enregistrer', nouvelle ? '' : BOUTON_SUPPRIMER), 'modale-large');
  const majListes = () => {
    $('[data-ed-res="niveaux"]', d).innerHTML = niveauxEdRes(r);
    $('[data-ed-res="liste-objectifs"]', d).innerHTML = htmlObjectifs();
  };
  d.addEventListener('change', ev => {
    const k = ev.target.dataset.edRes;
    if (k === 'matiere' || k === 'cycle') {
      r[k] = k === 'cycle' ? +ev.target.value : ev.target.value;
      r.objectifs = []; r.niveaux = r.niveaux.filter(n => NIVEAUX_CYCLE_RES[r.cycle].includes(n));
      majListes();
    }
    if (k === 'objectifs') r.objectifs = [...ev.target.selectedOptions].map(o => o.value);
  });
  const { action, data, fd } = await resultat;
  if (action === 'supprimer') {
    if (await confirmer(`Supprimer la ressource « ${r.titre} » ?`)) { Donnees.supprimer('modeles', r.id); toast('Ressource supprimée', 'ok'); rendre(); }
    return;
  }
  if (action !== 'ok') return;
  const lignes = t => String(t || '').split('\n').map(x => x.trim()).filter(Boolean);
  const fiche = {
    ...(nouvelle ? { id: Donnees.nouvelId(), cree: Date.now() } : { id: r.id, cree: r.cree }),
    sorte: 'ressource', genre: data.sorte, titre: data.titre.trim(), matiere: data.matiere, cycle: +data.cycle,
    niveaux: fd.getAll('niveau'), objectifs: r.objectifs, duree: data.duree.trim(), resume: data.resume.trim(),
    materiel: lignes(data.materiel), deroule: lignes(data.deroule), variantes: lignes(data.variantes), sourceTexte: data.sourceTexte.trim(),
  };
  Donnees.ecrire('modeles', fiche);
  toast(nouvelle ? 'Ressource ajoutée' : 'Ressource enregistrée', 'ok');
  rendre();
}
const niveauxEdRes = r => NIVEAUX_CYCLE_RES[r.cycle].map(n => `<label class="case"><input type="checkbox" name="niveau" value="${n}"${r.niveaux.includes(n) ? ' checked' : ''}> ${n}</label>`).join(' ');
