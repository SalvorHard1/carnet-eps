'use strict';
/* ---------- Carnet École : onglet « Ressources » ----------
   L'enseignant choisit la matière, puis le cycle, puis la compétence travaillée (objectifs du programme, programmeecole.js) :
   l'appli propose des idées d'activités et, quand c'est possible, une fiche élève qu'elle FABRIQUE elle-même
   (nombres tirés au hasard selon le niveau, plusieurs versions, corrigé), en PDF ou à imprimer (DessinPdf).
   Deux sources :
   - RESSOURCES_ECOLE ci-dessous, livrée avec l'appli et enrichie au fil des versions. Règle : idées tirées de ressources
     PUBLIQUES et institutionnelles (Eduscol, académies, programmes), reformulées avec nos mots, source citée.
     Jamais de contenu d'une banque privée ou protégée (éditeurs, sites payants ou à compte).
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
  evalCM2Problemes: { nom: 'Évaluations de début de CM2, fiche d’intervention « Résoudre des problèmes en utilisant des fractions, des nombres décimaux et le calcul » (2026)',
    url: URL_EDUSCOL_RES + '2026evaluationdebutcm2mathematiquesficheinterventionresoudreproblemesfractionsnombresdecimauxcalcul-129496.pdf' },
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
// Nombre stocké en entier (ex. 475) écrit avec `dec` chiffres après la virgule (47,5), sans espace des milliers (opérations posées).
const texteNbRes = (x, dec) => {
  if (!dec) return String(x);
  const s = String(x).padStart(dec + 1, '0');
  return `${s.slice(0, -dec)},${s.slice(-dec)}`;
};
const MOINS_RES = '–'; // (le signe « − » n'existe pas dans les polices du PDF : tiret demi-cadratin)
const ligneRes = (parties, reponse) => ({ parties, reponse: String(reponse) });
const PLUS_GRAND_RES = { CP: 99, CE1: 999, CE2: 9999, CM1: 99999, CM2: 999999 };

/* ---------- Générateurs de fiches élèves ----------
   Chacun : nom, options(niveau) → [{ cle, libelle, choix: [[valeur, libellé]], defaut }], nombre(niveau) d'exercices,
   fabriquer(o, niveau, rnd) → { consigne, aide?, disposition: 'ligne' | 'posee' | 'probleme', exercices } */

const GENERATEURS_FICHES = {
  // --- Multiplication et division (d'après Eduscol, évaluations de début de CM1 et de CM2, 2026) ---
  tablesMultiplication: {
    options: n => [
      { cle: 'tables', libelle: 'Tables', defaut: n === 'CE1' ? '2-5-10' : 'toutes',
        choix: [['2-5-10', '2, 5 et 10'], ['2-4-8', '2, 4 et 8'], ['3-6', '3 et 6'], ['7-9', '7 et 9'], ['carres', 'Les carrés (3 × 3, 4 × 4…)'], ['toutes', 'Toutes (de 2 à 9)']] },
      { cle: 'type', libelle: 'Questions', defaut: n === 'CE1' ? 'produit' : 'melange',
        choix: [['produit', '6 × 7 = …'], ['facteur', '6 × … = 42'], ['combien', 'Dans 42, combien de fois 6 ?'], ['melange', 'Les trois, mélangées']] },
    ],
    nombre: () => 30,
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
    nombre: () => 16,
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
      (de nouveaux nombres à chaque fois, avec le corrigé). Les idées viennent de ressources publiques (Eduscol, académies, programmes), source citée.</p>
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
  let versions = 1, corrige = true, titre = r.titre;

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
      <label class="case"><input type="checkbox" data-reg="corrige"${corrige ? ' checked' : ''}> Ajouter le corrigé</label>
    </div>`;
  };
  const fabriquer = () => dessinerFicheRes({ r, gen, niveau, reglages, versions, corrige, titre, graine });
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
    else if (k === 'nombre') reglages.nombre = Math.max(1, Math.min(60, Math.round(+cible.value) || 1));
    else reglages[k] = cible.value;
    dessinApercu();
  };
  zoneReglages.addEventListener('change', ev => { if (ev.target.dataset.reg) lire(ev.target); });
  zoneReglages.addEventListener('input', ev => { if (ev.target.dataset.reg === 'titre') { lire(ev.target); clearTimeout(lire.t); lire.t = setTimeout(dessinApercu, 400); } });
  d.addEventListener('click', ev => {
    const b = ev.target.closest('[data-fiche-res]');
    if (!b) return;
    const nomFichier = `${titre} ${niveau}`.replace(/[\\/:*?"<>|]/g, '');
    if (b.dataset.ficheRes === 'nouveaux') { graine = Math.floor(Math.random() * 1e9); dessinApercu(); }
    if (b.dataset.ficheRes === 'pdf') lancer(async () => { telechargerBlob(new Blob([await fabriquer().versPdf()], { type: 'application/pdf' }), `${nomFichier}.pdf`); toast('PDF enregistré dans tes téléchargements', 'ok'); });
    if (b.dataset.ficheRes === 'imprimer') { const dessin = fabriquer(); imprimerZoneEcole(`<div class="impression-pdf">${dessin.pages.map((_, i) => dessin.versSvg(i)).join('')}</div>`, nomFichier); }
  });
  await resultat;
}

/* ---------- Dessin des fiches (A4 portrait) ---------- */

const MARGE_RES = 42, COULEUR_CORRIGE = '#1f6f5c', GRIS_RES = '#777777';

function dessinerFicheRes({ r, gen, niveau, reglages, versions, corrige, titre, graine }) {
  const d = DessinPdf({ ...PAGE_A4_PORTRAIT, titre });
  const src = sourceRes(r)?.texte || '';
  let premiere = true;
  for (let v = 0; v < versions; v++) {
    const contenu = gen.fabriquer({ ...reglages }, niveau, hasardRes(graine + v * 7919));
    const version = versions > 1 ? `Version ${LETTRES_VERSIONS[v]}` : '';
    for (const avecReponses of corrige ? [false, true] : [false]) {
      if (!premiere) d.nouvellePage();
      premiere = false;
      pagesFicheRes(d, { titre, niveau, contenu, version, avecReponses, src });
    }
  }
  return d;
}

function enteteRes(d, { titre, niveau, contenu, version, avecReponses, src }, suite) {
  const M = MARGE_RES, W = d.l - 2 * M;
  if (avecReponses) d.texte(M, 50, `Corrigé${version ? ` — ${version}` : ''}`, { taille: 11, gras: true, couleur: COULEUR_CORRIGE });
  else { d.texte(M, 50, 'Prénom : ....................................', { taille: 11 }); d.texte(d.l - M, 50, 'Date : ........................', { taille: 11, ancre: 'fin' }); }
  d.texte(M, 84, d.tenir(titre + (suite ? ' (suite)' : ''), W - 60, 17, true), { taille: 17, gras: true });
  d.texte(d.l - M, 84, [niveau, version].filter(Boolean).join(' · '), { taille: 10, couleur: GRIS_RES, ancre: 'fin' });
  let y = 106;
  for (const l of d.couper(contenu.consigne, W, 11)) { d.texte(M, y, l, { taille: 11 }); y += 15; }
  if (contenu.aide && !suite) {
    const lignes = d.couper(contenu.aide, W - 20, 10);
    d.rect(M, y - 4, W, lignes.length * 13 + 10, { fond: '#f2f6f4', trait: '#c9d8d1', rayon: 4 });
    lignes.forEach((l, i) => d.texte(M + 10, y + 10 + i * 13, l, { taille: 10 }));
    y += lignes.length * 13 + 16;
  }
  d.texte(M, d.h - 22, d.tenir(`Carnet École${src ? ` · ${src}` : ''}`, W, 7), { taille: 7, couleur: GRIS_RES });
  return y + 12;
}

function pagesFicheRes(d, infos) {
  const { contenu, avecReponses } = infos, M = MARGE_RES, W = d.l - 2 * M, bas = d.h - 40;
  let y = enteteRes(d, infos, false);
  const sautSiBesoin = h => { if (y + h > bas) { d.nouvellePage(); y = enteteRes(d, infos, true); } };
  const ex = contenu.exercices;

  if (contenu.disposition === 'ligne') {
    const T = 14, blanc = 46;
    const largeurEx = it => it.parties.reduce((s, p) => s + (p === null ? blanc : d.largeurTexte(p, T)), 0);
    const w = Math.max(...ex.map(largeurEx), 60) + 26;
    const cols = Math.max(1, Math.min(3, Math.floor(W / (w + 16)))), lc = W / cols, H = 32;
    for (let i = 0; i < ex.length; i += cols) {
      sautSiBesoin(H);
      ex.slice(i, i + cols).forEach((it, k) => {
        let x = M + k * lc;
        d.texte(x, y + 18, `${i + k + 1}.`, { taille: 8, couleur: GRIS_RES });
        x += 18;
        let n = 0; // (plusieurs blancs possibles : « 17 = 4 × … + … » → it.reponses)
        for (const p of it.parties) {
          if (p === null) {
            d.ligne(x + 2, y + 21, x + blanc - 4, y + 21, { trait: '#555555', ep: 0.7 });
            if (avecReponses) d.texte(x + blanc / 2, y + 18, it.reponses ? it.reponses[n] : it.reponse, { taille: T, gras: true, couleur: COULEUR_CORRIGE, ancre: 'milieu' });
            x += blanc; n++;
          } else { d.texte(x, y + 18, p, { taille: T }); x += d.largeurTexte(p, T); }
        }
      });
      y += H;
    }
    return;
  }

  if (contenu.disposition === 'posee') {
    // Additions, soustractions, multiplications posées. Multiplication par un nombre à 2 chiffres : lignes des produits
    // partiels (« règle des 0 » : 37 × 14 = 37 × 4 + 37 × 10, d'après Eduscol), puis un second trait et le résultat.
    const T = 16, cw = 13, ligneH = 24;
    const decDe = (it, j) => (it.decs ? it.decs[j] : it.dec) || 0;
    const largeurMax = Math.max(...ex.map(it => Math.max(...it.nombres.map((x, j) => texteNbRes(x, decDe(it, j)).length),
      texteNbRes(it.resultat, it.dec).length, ...(it.partiels || []).map(x => texteNbRes(x, it.dec).length))));
    const boite = (largeurMax + 2) * cw + 16, cols = Math.max(1, Math.min(5, Math.floor(W / (boite + 14)))), lc = W / cols;
    const lignesApres = it => (it.partiels?.length > 1 ? it.partiels.length + 1 : 1);
    const hauteur = it => 14 + it.nombres.length * ligneH + 10 + lignesApres(it) * ligneH + (it.partiels?.length > 1 ? 6 : 0) + 16;
    const signe = op => (op === '+' ? '+' : op === '×' ? '×' : MOINS_RES);
    const ecrireNb = (s, droite, yl, o) => [...s].reverse().forEach((ch, c) => d.texte(droite - c * cw - cw / 2, yl, ch, { taille: T, ancre: 'milieu', ...o }));
    for (let i = 0; i < ex.length; i += cols) {
      const rang = ex.slice(i, i + cols), H = Math.max(...rang.map(hauteur));
      sautSiBesoin(H);
      rang.forEach((it, k) => {
        const x0 = M + k * lc + (lc - boite) / 2, droite = x0 + boite - 8;
        d.texte(M + k * lc, y + 10, `${i + k + 1}.`, { taille: 8, couleur: GRIS_RES });
        // Cases légères : une colonne par chiffre (une de plus, comme le conseille Eduscol, pour la retenue du rang suivant).
        const nCols = largeurMax + 1, yHaut = y + 14, yBas = y + hauteur(it) - 16;
        for (let c = 0; c < nCols; c++) d.rect(droite - (c + 1) * cw, yHaut, cw, yBas - yHaut, { trait: '#e3e3e3', ep: 0.5 });
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
            if (avecReponses) ecrireNb(texteNbRes(p, it.dec), droite, yl, { couleur: '#5b8f80' });
            if (j === it.partiels.length - 1) d.texte(droite - nCols * cw - 6, yl, '+', { taille: T, ancre: 'fin', couleur: avecReponses ? '#5b8f80' : '#bbbbbb' });
          });
          yRes = yTrait + it.partiels.length * ligneH + 6;
          trait(yRes);
        }
        if (avecReponses) ecrireNb(texteNbRes(it.resultat, it.dec), droite, yRes + ligneH - 4, { gras: true, couleur: COULEUR_CORRIGE });
      });
      y += H;
    }
    return;
  }

  if (contenu.disposition === 'potence') {
    // Divisions posées « en potence » : dividende | diviseur, place pour les étapes ; corrigé : quotient, reste et l'égalité.
    const T = 16, cw = 13, cols = 3, lc = W / cols;
    const hauteur = it => 26 + String(it.dividende).length * 2 * 20 + 40;
    for (let i = 0; i < ex.length; i += cols) {
      const rang = ex.slice(i, i + cols), H = Math.max(...rang.map(hauteur));
      sautSiBesoin(H);
      rang.forEach((it, k) => {
        const x0 = M + k * lc + 18, s = String(it.dividende), xBarre = x0 + (s.length + 1) * cw, yHaut = y + 30, yBas = y + H - 34;
        d.texte(M + k * lc, y + 12, `${i + k + 1}.`, { taille: 8, couleur: GRIS_RES });
        [...s].forEach((ch, c) => d.texte(x0 + c * cw + cw / 2, yHaut, ch, { taille: T, ancre: 'milieu' }));
        d.ligne(xBarre, yHaut - 16, xBarre, yBas, { trait: '#222222', ep: 1.2 });
        d.texte(xBarre + 10, yHaut, String(it.diviseur), { taille: T });
        d.ligne(xBarre, yHaut + 6, xBarre + 62, yHaut + 6, { trait: '#222222', ep: 1.2 });
        if (avecReponses) {
          d.texte(xBarre + 10, yHaut + 26, String(it.quotient), { taille: T, gras: true, couleur: COULEUR_CORRIGE });
          d.texte(x0, yBas, `reste ${it.reste}`, { taille: 11, gras: true, couleur: COULEUR_CORRIGE });
          d.texte(x0, yBas + 18, `${nbRes(it.dividende)} = ${it.diviseur} × ${nbRes(it.quotient)} + ${it.reste}`, { taille: 10, couleur: COULEUR_CORRIGE });
        } else d.texte(x0, yBas + 18, `${nbRes(it.dividende)} = ${it.diviseur} × ………… + ……`, { taille: 10, couleur: GRIS_RES });
      });
      y += H;
    }
    return;
  }

  // Problèmes : énoncé, cadre de recherche, phrase réponse.
  for (const [i, it] of ex.entries()) {
    const lignes = d.couper(it.texte, W - 22, 12), cadre = avecReponses ? 26 : 74, H = lignes.length * 16 + cadre + 40;
    sautSiBesoin(H);
    d.texte(M, y + 12, `${i + 1}.`, { taille: 12, gras: true });
    lignes.forEach((l, k) => d.texte(M + 20, y + 12 + k * 16, l, { taille: 12 }));
    let yy = y + 12 + lignes.length * 16;
    d.rect(M + 20, yy - 4, W - 20, cadre, { trait: '#bbbbbb', ep: 0.6, rayon: 4 });
    if (avecReponses) d.texte(M + 30, yy + 14, it.calcul, { taille: 11, couleur: COULEUR_CORRIGE });
    else d.texte(M + 28, yy + 9, 'Je cherche :', { taille: 8, couleur: GRIS_RES });
    yy += cadre + 14;
    d.texte(M + 20, yy, 'Réponse :', { taille: 11 });
    if (avecReponses) d.texte(M + 80, yy, it.reponse, { taille: 11, gras: true, couleur: COULEUR_CORRIGE });
    else d.ligne(M + 76, yy + 2, d.l - M, yy + 2, { trait: '#888888', ep: 0.6, tirets: [2, 2] });
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
  const items = c.disposition === 'ligne' ? c.exercices.map(it => it.parties.map(p => (p === null ? { t: it.reponse, rep: true } : { t: p })))
    : c.disposition === 'posee' ? c.exercices.map(it => [{ t: `${it.nombres.map(x => texteNb(x, it.dec)).join(it.op === '+' ? ' + ' : ` ${MOINS_RES} `)} = ` }, { t: texteNb(it.resultat, it.dec), rep: true }])
      : null;
  return { niveau, consigne: c.consigne, aide: c.aide, items, probleme: c.disposition === 'probleme' ? c.exercices[0] : null, posee: c.disposition === 'posee' };
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
    const T = 12, cols = ex.posee ? 2 : 3, lc = (W - 28) / cols;
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
      ex.items.forEach((segs, i) => morceaux(M + 14 + (i % cols) * lc, yy + Math.floor(i / cols) * 22, segs, T));
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
