'use strict';
// Onglet « 📊 Barèmes » : bibliothèque de barèmes par APSA (6e, collège cycle 4, lycée), construits par blocs.
//   Barème : { id, titre, apsa, niveau: 'cycle3' | 'college' (cycle 4) | 'lycee', pas: 0.5 | 1, modele: ⭐ point de départ, blocs: [bloc] }
//   Blocs (empilables, déplaçables, désactivables) :
//     perf     : tableau performance → points, filles / garçons séparés ou non ; généré à partir de deux repères
//                (perf qui vaut 0, perf qui vaut le maximum), puis retouchable case par case.
//                { unite: 'temps' | 'distance' | 'nombre', points, sexes, ancres: { f|g|v: [zéro, max] }, lignes: [{ pts, f, g, v }] }
//     degres   : grille critères × 4 degrés de maîtrise ; descriptif par case, fourchette de points calculée.
//                { criteres: [{ nom, points, cases: [4 textes] }] }
//     ecart    : une seule ligne s'applique (écart au projet, niveau de voie, classement…) : { lignes: [{ libelle, pts }] }
//     criteres : chaque critère rempli rapporte ses points (cases à cocher) : { lignes: [{ libelle, pts }] }
//     texte    : consignes, conditions de l'épreuve : { texte }
// Les « modèles fournis » sont fabriqués ici (jamais enregistrés) : leurs chiffres sont indicatifs, à adapter.
// Les barèmes du prof sont rangés dans le carnet (collection `baremes`, chiffrée sur la clé avec le reste) ;
// ils ne contiennent aucune donnée d'élève et peuvent s'échanger entre collègues (fichier .json).
// (Fichier chargé avant app.js : il n'utilise les outils d'app.js qu'au moment des appels.)

const APSA_BAREMES = ['Demi-fond', 'Course de vitesse', 'Relais', 'Saut en longueur', 'Natation', 'Badminton', 'Tennis de table',
  'Handball', 'Basket-ball', 'Volley-ball', 'Boxe française', 'Acrosport', 'Gymnastique', 'Danse', 'Step', 'Escalade', 'Course d’orientation', 'Musculation'];
// (« college » = cycle 4 : nom gardé pour les barèmes déjà créés.)
const NIVEAUX_BAREME = { cycle3: '6e (cycle 3)', college: 'Collège (cycle 4)', lycee: 'Lycée (bac)' };
const NIVEAUX_COURTS = { cycle3: '6e', college: 'cycle 4', lycee: 'lycée' };
const TYPES_BLOCS = {
  perf: ['⏱', 'Performance', 'tableau perf → points, filles / garçons'],
  degres: ['🎯', 'Grille par degrés', 'critères × 4 degrés, descriptifs et points'],
  ecart: ['📏', 'Barème à paliers', 'une ligne s’applique : écart au projet, niveau de voie, classement…'],
  criteres: ['☑️', 'Critères observables', 'chaque critère rempli rapporte ses points'],
  texte: ['📝', 'Texte', 'consignes, conditions de l’épreuve'],
};
const UNITES_PERF = { temps: 'Temps', distance: 'Distance (m)', nombre: 'Nombre' };

/* ---------- Modèles fournis (pré-remplissage) ---------- */

const DESC_GENERIQUES = ['Peu efficace, erreurs nombreuses', 'Partiellement maîtrisé', 'Maîtrisé dans la plupart des essais', 'Maîtrisé, efficace et régulier'];
const DESC_CA4 = ['Actions rares et peu efficaces ; subit le rapport de force', 'Quelques actions efficaces, choix peu pertinents',
  'Choix pertinents ; actions souvent efficaces', 'Choix adaptés au rapport de force ; actions décisives régulières'];
const DESC_ROLE = ['Rôle tenu avec l’aide constante de l’enseignant ; erreurs fréquentes', 'Rôle tenu ponctuellement ; quelques erreurs ou oublis',
  'Rôle tenu avec sérieux et fiabilité', 'Rôle tenu en autonomie ; aide et conseille ses camarades'];
const DESC_AFL2 = ['Peu engagé ; ne s’appuie pas sur des repères', 'Engagement irrégulier ; utilise quelques repères',
  'S’entraîne avec régularité en s’appuyant sur des repères pertinents', 'Analyse ses prestations et ajuste son entraînement en autonomie'];

// Fabriques de blocs (sans identifiants : ils sont donnés à la création du barème).
const blocPerf = (titre, points, unite, ancres) => ({ type: 'perf', titre, points, unite, sexes: !ancres.v, ancres, lignes: [] });
const blocDegres = (titre, criteres, desc = DESC_GENERIQUES) =>
  ({ type: 'degres', titre, criteres: criteres.map(([nom, points, cases]) => ({ nom, points, cases: [...(cases || desc)] })) });
const blocEcart = (titre, lignes) => ({ type: 'ecart', titre, lignes: lignes.map(([libelle, pts]) => ({ libelle, pts })) });
const blocCriteres = (titre, lignes) => ({ type: 'criteres', titre, lignes: lignes.map(([libelle, pts]) => ({ libelle, pts })) });
const blocTexte = (titre, texte) => ({ type: 'texte', titre, texte });

const roleBloc = (titre, pts, role) => blocDegres(titre, [[role, pts]], DESC_ROLE);
const afl2 = (pts = 4, nom = 'Se préparer et s’entraîner : échauffement, repères, analyse de ses prestations') => blocDegres('AFL2 · S’entraîner', [[nom, pts]], DESC_AFL2);
const afl3 = (pts = 4, role = 'Rôles choisis et assumés au service du groupe') => roleBloc('AFL3 · Rôles', pts, role);
const repartitionLycee = () => blocTexte('Répartition AFL2 / AFL3', 'Au bac, l’élève choisit la répartition des 8 points entre AFL2 et AFL3 : 2/6, 4/4 ou 6/2. Ajuste les points des deux blocs en conséquence.');
const echauffement = (pts = 2) => blocCriteres('Échauffement', [['S’échauffe de façon progressive et complète', pts / 2], ['Adapte son échauffement à l’épreuve', pts / 2]]);
const paliersGain = (titre, pts) => blocEcart(titre, [['1er de la poule / du groupe', pts], ['2e', pts * 0.75], ['3e', pts * 0.5], ['4e et suivants', pts * 0.25]]);

// Critères d'affrontement par APSA (CA4).
const CRITERES_CA4 = {
  'Badminton': ['Rompre l’échange : rechercher l’espace libre, varier longueur et latéralité', 'Défendre : se replacer, renvoyer haut et profond'],
  'Tennis de table': ['Construire le point : varier placement, vitesse et effets', 'Servir et gérer l’échange : service varié, remise adaptée'],
  'Handball': ['Attaquer : conserver, progresser, tirer en position favorable', 'Défendre : récupérer la balle, gêner le tireur, se replacer'],
  'Basket-ball': ['Attaquer : créer et exploiter une situation favorable de tir', 'Défendre : gêner la progression, se replacer, prendre le rebond'],
  'Volley-ball': ['Construire l’attaque : réception, passe haute, renvoi offensif', 'Défendre : se placer, couvrir, remettre la balle en jeu'],
  'Boxe française': ['Toucher : enchaîner pieds et poings à distance adaptée, touches portées et contrôlées', 'Défendre : esquiver, parer, se déplacer pour ne pas être touché'],
};

// Performances indicatives : [perf à 0 point, perf au maximum] ; temps en secondes, distances en mètres.
function modeleFourni(apsa, niveau) {
  const lyc = niveau === 'lycee', c3 = niveau === 'cycle3', B = [];
  const ca = Object.entries(CA_PAR_APSA).find(([, l]) => l.includes(apsa))?.[0];
  // (6e : même structure que le cycle 4, épreuves et performances adaptées.)
  if (apsa === 'Demi-fond') {
    if (lyc) B.push(blocPerf('AFL1 · Performance : 3 × 500 m (temps cumulé)', 7, 'temps', { f: [540, 345], g: [465, 285] }),
      blocEcart('AFL1 · Écart au projet (temps annoncé)', [['Écart ≤ 2 s', 5], ['≤ 4 s', 4], ['≤ 6 s', 3], ['≤ 8 s', 2], ['≤ 12 s', 1], ['Plus de 12 s', 0]]));
    else B.push(c3 ? blocPerf('Performance : 600 m', 10, 'temps', { f: [240, 150], g: [225, 135] }) : blocPerf('Performance : 800 m', 10, 'temps', { f: [300, 190], g: [270, 165] }),
      blocEcart('Écart au projet (temps annoncé)', [['Écart ≤ 2 s', 4], ['≤ 4 s', 3], ['≤ 6 s', 2], ['≤ 10 s', 1], ['Plus de 10 s', 0]]),
      blocDegres('Gestion de l’effort', [['Choisir et tenir une allure régulière', 2]]), echauffement(2));
  } else if (apsa === 'Course de vitesse') {
    if (lyc) B.push(blocPerf('AFL1 · Performance : 80 m', 8, 'temps', { f: [14.5, 10.8], g: [13, 9.4] }),
      blocDegres('AFL1 · Technique de course', [['Départ et mise en action', 2], ['Course en ligne, gainage, fréquence', 2]]));
    else B.push(c3 ? blocPerf('Performance : 40 m', 12, 'temps', { f: [9.5, 6.6], g: [9.2, 6.3] }) : blocPerf('Performance : 50 m', 12, 'temps', { f: [10.5, 7.4], g: [10, 6.8] }),
      blocDegres('Départ et course', [['Réaction et mise en action au départ', 3], ['Course en ligne, regard, gainage', 3]]));
  } else if (apsa === 'Relais') {
    if (lyc) B.push(blocPerf('AFL1 · Performance de l’équipe : 4 × 60 m', 6, 'temps', { v: [40, 30] }),
      blocDegres('AFL1 · Transmission', [['Transmission dans la zone, à pleine vitesse', 3], ['Départ du receveur sur la marque', 3]]));
    else B.push(c3 ? blocPerf('Performance de l’équipe : 4 × 30 m', 8, 'temps', { v: [30, 21] }) : blocPerf('Performance de l’équipe : 4 × 50 m', 8, 'temps', { v: [36, 27] }),
      blocDegres('Transmission', [['Transmission dans la zone, sans ralentir', 4], ['Départ du receveur au bon moment (marque)', 4]]));
  } else if (apsa === 'Saut en longueur') {
    if (lyc) B.push(blocPerf('AFL1 · Performance (meilleur saut)', 8, 'distance', { f: [2.5, 4.6], g: [3.2, 5.8] }),
      blocDegres('AFL1 · Course d’élan et impulsion', [['Course d’élan étalonnée, accélérée', 2], ['Impulsion sur la planche, suspension, réception', 2]]));
    else B.push(blocPerf('Performance (meilleur des 3 sauts)', 10, 'distance', c3 ? { f: [1.8, 3.6], g: [2, 4] } : { f: [2.2, 4.2], g: [2.5, 5] }),
      blocDegres('Course d’élan et impulsion', [['Course d’élan régulière, étalonnée', 3], ['Impulsion et placement sur la planche', 3]]), echauffement(2));
  } else if (apsa === 'Natation') {
    if (lyc) B.push(blocPerf('AFL1 · Performance : 100 m nage libre', 8, 'temps', { f: [180, 80], g: [160, 70] }),
      blocDegres('AFL1 · Efficacité de la nage', [['Respiration, coordination, alignement', 2], ['Départ, virage, coulée', 2]]));
    else B.push(blocPerf('Performance : 50 m nage libre', 10, 'temps', c3 ? { f: [110, 45], g: [105, 42] } : { f: [90, 38], g: [85, 34] }),
      blocDegres('Nage', [['Respiration et coordination', 3], ['Départ et virage', 3]]),
      blocCriteres('Sécurité et savoir-nager', [['Entre dans l’eau sans hésitation', 1], ['Nage sans arrêt sur toute la distance', 1], ['Respecte les règles de sécurité', 2]]));
  } else if (CRITERES_CA4[apsa]) {
    const [c1, c2] = CRITERES_CA4[apsa], co = ['Handball', 'Basket-ball', 'Volley-ball'].includes(apsa);
    if (lyc) B.push(blocDegres('AFL1 · Choix et efficacité', [[c1, 4], [c2, 4]], DESC_CA4), paliersGain(co ? 'AFL1 · Gain des rencontres (équipe)' : apsa === 'Boxe française' ? 'AFL1 · Gain des assauts' : 'AFL1 · Gain des rencontres', 4));
    else B.push(blocDegres('Actions décisives', [[c1, 6], [c2, 4]], DESC_CA4),
      paliersGain(co ? 'Gain des matchs (équipe)' : apsa === 'Boxe française' ? 'Gain des assauts' : 'Gain des rencontres', 4),
      blocDegres('Engagement et respect', [[apsa === 'Boxe française' ? 'Contrôle des touches, respect de l’adversaire et de l’arbitre'
        : 'Solidaire de ses partenaires, respecte adversaires, règles et arbitre', 2]]));
  } else if (apsa === 'Acrosport' || apsa === 'Gymnastique') {
    const acro = apsa === 'Acrosport';
    if (lyc) B.push(blocDegres('AFL1 · Composition', [[acro ? 'Choix des figures, liaisons, originalité, espace' : 'Choix des éléments, liaisons, rythme', 4]]),
      blocDegres('AFL1 · Réalisation', [['Exécution : tenue, alignements, amplitude, stabilité', 5], ['Difficulté des éléments réussis', 3]]));
    else B.push(blocDegres('Réalisation', [['Exécution : tenue, alignements, stabilité', 6], [acro ? 'Difficulté des figures choisies' : 'Difficulté des éléments choisis', 4]]),
      blocDegres('Composition', [['Liaisons, originalité, utilisation de l’espace', 4]]),
      blocCriteres('Sécurité', [[acro ? 'Montées, démontages et parades sécurisés' : 'Parade et aménagement du matériel', 2]]));
  } else if (apsa === 'Danse') {
    if (lyc) B.push(blocDegres('AFL1 · Composition', [['Procédés de composition, espace, temps, propos lisible', 4]]),
      blocDegres('AFL1 · Interprétation', [['Motricité expressive, engagement, précision', 5], ['Présence, regard, concentration', 3]]));
    else B.push(blocDegres('Interprétation', [['Motricité expressive, engagement', 6], ['Présence, regard, concentration', 4]]),
      blocDegres('Composition', [['Procédés de composition, espace, temps', 4]]),
      blocCriteres('Projet collectif', [['Participe activement à l’élaboration du projet', 2]]));
  } else if (apsa === 'Step') {
    if (lyc) B.push(blocDegres('AFL1 · Cohérence du projet', [['Mobile choisi (développer, entretenir) et paramètres cohérents : tempo, hauteur de marche, durée, fréquence cardiaque visée', 6]]),
      blocDegres('AFL1 · Réalisation', [['Pas et enchaînements maîtrisés, coordination, sur le tempo', 6]]));
    else B.push(blocDegres('Réalisation', [['Pas de base et enchaînements maîtrisés, sur le rythme', 6], ['Coordination bras-jambes, posture', 4]]),
      blocDegres('Composition', [['Enchaînement créé en groupe : variété des pas, orientations', 4]]),
      blocCriteres('Gestion de l’effort', [['Repère sa fréquence cardiaque ou son ressenti', 1], ['Adapte l’intensité (hauteur de marche, tempo)', 1]]));
  } else if (apsa === 'Escalade') {
    if (lyc) B.push(blocEcart('AFL1 · Difficulté de la voie réussie en tête', [['6b et plus', 7], ['6a+', 6], ['6a', 5], ['5c', 4], ['5b', 3], ['5a', 2], ['4c et moins', 1]]),
      blocDegres('AFL1 · Efficience du déplacement', [['Lecture de la voie, grimper avec les jambes, gestion des repos', 5]]));
    else B.push(blocEcart('Difficulté de la voie réussie', c3 ? [['5a et plus', 8], ['4c', 7], ['4b', 6], ['4a', 5], ['3c', 4], ['3b', 3], ['3a et moins', 2]]
      : [['5c et plus', 8], ['5b', 7], ['5a', 6], ['4c', 5], ['4b', 4], ['4a', 3], ['3 et moins', 2]]),
      blocDegres('Efficacité du déplacement', [['Grimper avec les jambes, lire la voie', 4]]),
      blocDegres('Sécurité et assurage', [['Nœud, vérifications croisées, assurage', 6]]),
      blocCriteres('Règles de sécurité', [['Respecte et fait respecter les règles de sécurité', 2]]));
  } else if (apsa === 'Course d’orientation') {
    if (lyc) B.push(blocEcart('AFL1 · Balises trouvées', [['Toutes', 6], ['Toutes sauf 1', 5], ['Toutes sauf 2', 4], ['Toutes sauf 3', 3], ['Moins', 1]]),
      blocDegres('AFL1 · Choix d’itinéraire', [['Orienter la carte, choisir et tenir un itinéraire efficace', 6]]));
    else B.push(blocEcart('Balises trouvées', [['Toutes', 8], ['Toutes sauf 1', 7], ['Toutes sauf 2', 6], ['Toutes sauf 3', 4], ['Moins', 2]]),
      blocEcart('Niveau du parcours', [['Noir', 4], ['Rouge', 3], ['Bleu', 2], ['Vert', 1]]),
      blocDegres('Lecture de carte', [['Orienter la carte, choisir un itinéraire', 4]]),
      blocCriteres('Sécurité', [['Respecte le temps imparti', 2], ['Respecte les limites de la zone', 2]]));
  } else if (apsa === 'Musculation') {
    if (lyc) B.push(blocDegres('AFL1 · Cohérence du projet', [['Thème, paramètres (charges, séries, récupération) et ressentis cohérents', 6]]),
      blocDegres('AFL1 · Exécution', [['Placement, postures sécuritaires, trajets moteurs', 6]]));
    else B.push(blocDegres('Exécution', [['Placement et postures sécuritaires', 6], ['Respect des paramètres (charges, répétitions, récupération)', 4]]),
      blocDegres('Projet et analyse', [['Choisir un thème, justifier ses choix, exprimer ses ressentis', 6]]));
  }
  // Bas du barème : rôles (collège), AFL2 / AFL3 (lycée).
  if (lyc) B.push(afl2(), afl3(4, ca === 'CA4' ? 'Arbitre, coach, observateur' : ca === 'CA3' ? 'Juge, chorégraphe, spectateur, pareur' : ca === 'CA2' ? 'Assureur, contre-assureur, observateur' : ca === 'CA5' ? 'Coach, observateur, partenaire d’entraînement' : 'Juge, chronométreur, starter, observateur'), repartitionLycee());
  else if (apsa === 'Demi-fond') B.push(roleBloc('Rôles', 2, 'Chronométreur, lièvre, observateur'));
  else if (['Course de vitesse', 'Saut en longueur', 'Relais'].includes(apsa)) B.push(roleBloc('Rôles', apsa === 'Relais' ? 4 : 2, 'Starter, chronométreur, juge'));
  else if (CRITERES_CA4[apsa]) B.push(roleBloc('Rôles', 4, apsa === 'Boxe française' ? 'Arbitre, juge, chronométreur' : 'Arbitre, observateur, marqueur'));
  else if (apsa === 'Step') B.push(roleBloc('Rôles', 4, 'Observateur, coach, juge'));
  else if (ca === 'CA3') B.push(roleBloc('Rôles', 4, apsa === 'Danse' ? 'Spectateur, chorégraphe' : 'Juge, pareur'));
  else if (apsa === 'Musculation') B.push(roleBloc('Rôles', 4, 'Pareur, observateur, coach'));
  return { titre: `${apsa} — ${NIVEAUX_BAREME[niveau]}`, apsa, niveau, pas: 0.5, blocs: B };
}

/* ---------- Barèmes des autres disciplines ----------
   En EPS : les APSA et modeleFourni() ci-dessus. Ailleurs, la bibliothèque de la discipline :
   SVT = un modèle par type d'épreuve (compte rendu de TP, schéma, ECE…), rangé par famille (TP, écrit, oral) au lieu
   des champs d'apprentissage. Chiffres indicatifs, sur 20, à adapter. (Le champ `apsa` du barème = le type d'épreuve.) */

// Descriptifs des 4 degrés pour une compétence de SVT.
const DESC_SVT = ['Non réalisé ou erroné', 'Réalisé en partie, avec des erreurs', 'Réalisé correctement, quelques imprécisions', 'Réalisé de façon complète, précise et rigoureuse'];
const degresSvt = (titre, criteres) => blocDegres(titre, criteres, DESC_SVT);
// Paliers de l'ECE (guide de l'IGÉSR, comme l'outil 🔬 ECE) : [lettre, points, descriptif].
const paliersEce = (titre, paliers) => blocEcart(titre, paliers.map(([l, pts, t]) => [`${l} — ${t}`, pts]));

const BAREMES_DISCIPLINES = {
  svt: {
    niveaux: { college: 'Collège (cycle 4)', lycee: 'Lycée' },
    familles: { TP: 'CA2', Écrit: 'CA4', Oral: 'CA3' }, // (couleur de la carte : celle d'un champ d'apprentissage)
    nomFamille: 'Type',
    modeles: [
      { nom: 'Compte rendu de TP', famille: 'TP', fabrique: () => [
        degresSvt('Démarche', [['Formuler le problème et une hypothèse', 3], ['Suivre ou concevoir un protocole adapté', 3]]),
        degresSvt('Résultats', [['Présenter les résultats (tableau, graphique, schéma, photo légendée)', 4]]),
        degresSvt('Interprétation et conclusion', [['Interpréter les résultats', 4], ['Conclure en répondant au problème posé', 3]]),
        blocCriteres('Communication', [['Titre, unités, légendes', 1.5], ['Vocabulaire scientifique, expression correcte', 1.5]])] },
      { nom: 'Schéma d’observation', famille: 'TP', fabrique: () => [
        blocCriteres('Présentation', [['Titre précis (objet observé, technique, grossissement)', 2], ['Tracé au crayon, net, sans hachures', 2],
          ['Traits de légende à la règle, horizontaux, sans croisement', 2]]),
        degresSvt('Fidélité', [['Formes et proportions fidèles à l’observation', 6]]),
        degresSvt('Légendes', [['Légendes exactes et complètes', 6]]),
        blocCriteres('Échelle', [['Échelle ou grossissement indiqué', 2]])] },
      { nom: 'Manipulation (évaluation pratique)', famille: 'TP', fabrique: () => [
        blocCriteres('Sécurité', [['Blouse, gants et lunettes si nécessaire', 1], ['Poste de travail propre et rangé', 1]]),
        degresSvt('Gestes techniques', [['Réaliser la préparation ou le montage', 6], ['Utiliser le matériel (microscope, verrerie, logiciel)', 4]]),
        degresSvt('Résultat', [['Obtenir un résultat exploitable', 4]]),
        degresSvt('Autonomie', [['Suivre le protocole sans aide', 4]])] },
      { nom: 'ECE', famille: 'TP', niveaux: ['lycee'], fabrique: () => [
        paliersEce('Pratique — réalisation', [['A', 9, 'autonome, résultat exploitable'], ['B', 6, 'aides mineures'], ['C', 3, 'aide majeure'], ['D', 0, 'rien d’exploitable']]),
        paliersEce('Étape spécifique', [['A', 3, 'réussie seul'], ['B', 2, 'réussie avec une aide'], ['C', 1, 'réussie avec plusieurs aides'], ['D', 0, 'non réussie']]),
        paliersEce('Communication des résultats', [['A', 5, 'les trois critères'], ['B', 3, 'deux critères'], ['C', 1, 'un critère'], ['D', 0, 'aucun critère']]),
        paliersEce('Conclusion', [['A', 3, 'exploitation complète et argumentée'], ['B', 2, 'exploitation partielle'], ['C', 1, 'exploitation très incomplète'], ['D', 0, 'absente ou erronée']]),
        blocTexte('Conditions', 'Épreuve d’1 h. Note sur 20, ramenée sur 5 au bac. L’outil 🔬 ECE (onglet Outils) fait le calcul pendant l’épreuve.')] },
      { nom: 'Tâche complexe', famille: 'Écrit', fabrique: () => [
        degresSvt('Extraire les informations', [['Prélever les informations utiles dans les documents', 5]]),
        degresSvt('Raisonner', [['Mettre en relation les informations et les connaissances', 6]]),
        degresSvt('Conclure', [['Répondre au problème posé de façon argumentée', 5]]),
        blocCriteres('Communication', [['Réponse structurée, vocabulaire scientifique', 2], ['Schéma bilan ou illustration pertinente', 2]])] },
      { nom: 'Restitution de connaissances', famille: 'Écrit', fabrique: niveau => [
        degresSvt('Connaissances', [['Notions exactes et complètes', 8]]),
        degresSvt('Organisation', [[niveau === 'lycee' ? 'Introduction, plan, conclusion : exposé logique' : 'Réponse organisée et logique', 4]]),
        degresSvt('Schéma', [['Schéma juste, titré et légendé', 4]]),
        blocCriteres('Expression', [['Vocabulaire scientifique précis', 2], ['Orthographe et syntaxe correctes', 2]])] },
      { nom: 'Exposé oral', famille: 'Oral', fabrique: () => [
        degresSvt('Contenu scientifique', [['Notions justes, sources citées', 6]]),
        degresSvt('Organisation', [['Plan clair, durée respectée', 4]]),
        degresSvt('Expression orale', [['Voix, regard, détaché de ses notes', 4]]),
        degresSvt('Support', [['Support lisible, illustrations utiles', 3]]),
        blocCriteres('Échanges', [['Répond aux questions avec justesse', 3]])] },
    ],
  },
};
const baremesDiscipline = () => BAREMES_DISCIPLINES[disciplineActive()] || null;
// Activités (EPS) ou types d'épreuve (SVT) qui ont un modèle fourni, et niveaux proposés.
const apsaBaremes = () => baremesDiscipline()?.modeles.map(m => m.nom) || APSA_BAREMES;
const niveauxBareme = () => baremesDiscipline()?.niveaux || NIVEAUX_BAREME;
const nomNiveauBareme = n => niveauxBareme()[n] || NIVEAUX_BAREME[n] || '';
// Modèles fournis existants : [{ apsa, niveau }] (en SVT, l'ECE n'existe qu'au lycée).
const modelesFournisListe = () => apsaBaremes().flatMap(a => Object.keys(niveauxBareme())
  .filter(n => !baremesDiscipline() || (baremesDiscipline().modeles.find(m => m.nom === a).niveaux || [n]).includes(n)).map(n => ({ apsa: a, niveau: n })));
function modeleDeLaDiscipline(apsa, niveau) {
  const m = baremesDiscipline()?.modeles.find(x => x.nom === apsa);
  return m ? { titre: `${apsa} — ${nomNiveauBareme(niveau)}`, apsa, niveau, pas: 0.5, blocs: m.fabrique(niveau) } : modeleFourni(apsa, niveau);
}

/* ---------- Calculs ---------- */

const arrondiPas = (x, pas) => Math.round(x / pas) * pas;
function pointsBloc(b) {
  if (b.inactif) return 0;
  if (b.type === 'perf') return +b.points || 0;
  if (b.type === 'degres') return b.criteres.reduce((s, c) => s + (+c.points || 0), 0);
  if (b.type === 'ecart') return Math.max(0, ...b.lignes.map(l => +l.pts || 0));
  if (b.type === 'criteres') return b.lignes.reduce((s, l) => s + (+l.pts || 0), 0);
  return 0;
}
const totalBareme = br => Math.round(br.blocs.reduce((s, b) => s + pointsBloc(b), 0) * 100) / 100;

// Tableau de performance refait à partir des repères (une ligne par pas de points, du maximum à 0).
function genererPerf(b, pas) {
  const cles = b.sexes ? ['f', 'g'] : ['v'], n = Math.round(b.points / pas), precision = b.unite === 'temps' ? 10 : b.unite === 'distance' ? 100 : 1;
  b.lignes = [];
  for (let k = n; k >= 0; k--) {
    const pts = Math.round(k * pas * 100) / 100, ligne = { pts };
    for (const c of cles) {
      const [z, m] = b.ancres[c] || [];
      ligne[c] = Number.isFinite(z) && Number.isFinite(m) ? Math.round((z + ((m - z) * pts) / b.points) * precision) / precision : null;
    }
    b.lignes.push(ligne);
  }
}

// Tableau de performance retouché à la main (différent de celui que donnent ses repères) ?
function perfRetouche(b, pas) {
  if (b.type !== 'perf') return false;
  const refait = { ...structuredClone(b) };
  genererPerf(refait, pas);
  return JSON.stringify(refait.lignes) !== JSON.stringify(b.lignes);
}

// Fourchette de points d'un degré (1 à 4) pour un critère sur `pts` : quarts du total, au pas du barème.
function fourchetteDegre(pts, degre, pas) {
  const bas = degre === 1 ? 0 : arrondiPas((pts * (degre - 1)) / 4, pas) + pas, haut = arrondiPas((pts * degre) / 4, pas);
  return bas >= haut ? fmt(haut) : `${fmt(bas)} à ${fmt(haut)}`;
}
// Points fixés degré par degré (c.ptsDegres = [d1, d2, d3, d4], lus dans un barème importé : « 1,5 pt | 2,5 pts | 3,5 pts | 4 pts ») :
// ils priment sur les quarts du total.
const aPtsDegres = c => Array.isArray(c?.ptsDegres) && c.ptsDegres.length === 4 && c.ptsDegres.every(Number.isFinite);
const ptsDuDegre = (c, degre, pas) => (aPtsDegres(c) ? c.ptsDegres[degre - 1] : arrondiPas(((+c.points || 0) * degre) / 4, pas));
const texteDegre = (c, degre, pas) => (aPtsDegres(c) ? fmt(c.ptsDegres[degre - 1]) : fourchetteDegre(+c.points || 0, degre, pas));
// Points du critère changés : ses points par degré suivent, en proportion.
function echelleDegres(c, nouveau) {
  if (!aPtsDegres(c)) return;
  const k = +c.points ? nouveau / +c.points : 0;
  if (!k) { delete c.ptsDegres; return; }
  // (Au quart de point, comme dans les barèmes d'établissement ; le degré 4 vaut toujours les points du critère.)
  c.ptsDegres = c.ptsDegres.map((x, j) => (j === 3 ? nouveau : Math.min(nouveau, Math.round(x * k * 4) / 4)));
}

// Change les points d'un bloc, en gardant les proportions de ses lignes / critères.
function ajusterBloc(b, cible, pas) {
  const avant = pointsBloc({ ...b, inactif: false });
  if (b.type === 'perf') { b.points = cible; genererPerf(b, pas); return; }
  if (!avant) return;
  const k = cible / avant;
  if (b.type === 'degres') {
    b.criteres.forEach(c => { const n = arrondiPas(c.points * k, pas); echelleDegres(c, n); c.points = n; });
    const reste = Math.round((cible - b.criteres.reduce((s, c) => s + c.points, 0)) * 100) / 100;
    if (b.criteres.length) { const c = b.criteres[0], n = Math.max(0, c.points + reste); echelleDegres(c, n); c.points = n; }
  } else if (b.lignes) b.lignes.forEach(l => { l.pts = arrondiPas(l.pts * k, pas); });
}

function preparerBareme(modele) {
  const br = structuredClone(modele);
  br.pas ||= 0.5;
  for (const b of br.blocs) { b.id = Donnees.nouvelId(); if (b.type === 'perf' && !b.lignes?.length) genererPerf(b, br.pas); }
  return br;
}

/* ---------- Affichage des valeurs de performance ---------- */

const affPerf = (b, v) => (v === null || v === undefined || v === '' ? '' : b.unite === 'temps' ? formatTemps(v) : b.unite === 'distance' ? fmt(v) + ' m' : fmt(v));
function lirePerf(b, texte) {
  const t = String(texte).trim();
  if (!t) return null;
  if (b.unite === 'temps') return lireTemps(t);
  const n = Number(t.replace(/\s*m$/i, '').replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

/* ---------- Bibliothèque ---------- */

let baremeOuvert = null; // identifiant du barème affiché (null : la bibliothèque)
const filtresBaremes = { ca: '', niveau: '', texte: '' };
// Étiquette de la carte : le champ d'apprentissage (EPS), ou la famille du type d'épreuve (SVT : TP, Écrit, Oral).
const caApsaBareme = apsa => (baremesDiscipline() ? baremesDiscipline().modeles.find(m => m.nom === apsa)?.famille || ''
  : Object.entries(CA_PAR_APSA).find(([, l]) => l.includes(apsa))?.[0] || '');
// Classe de couleur de la carte (ca-CA1…).
const classeCaBareme = apsa => { const f = caApsaBareme(apsa); return (baremesDiscipline()?.familles[f] ?? f) || 'aucun'; };
const mesBaremes = () => Donnees.liste('baremes').sort((a, b) => collator.compare(a.apsa || '', b.apsa || '') || collator.compare(a.titre, b.titre));

function htmlBaremes() {
  const br = baremeOuvert && Donnees.get('baremes', baremeOuvert);
  if (br) return htmlEditeurBareme(br);
  baremeOuvert = null;
  const f = filtresBaremes, cherche = sansAccent(f.texte || '');
  const garde = (apsa, niveau, titre) => (!f.ca || caApsaBareme(apsa) === f.ca) && (!f.niveau || niveau === f.niveau)
    && (!cherche || sansAccent(`${apsa} ${titre}`).includes(cherche));
  const miens = mesBaremes().filter(x => garde(x.apsa, x.niveau, x.titre));
  const fournis = modelesFournisListe().filter(x => garde(x.apsa, x.niveau, ''));
  const disc = baremesDiscipline(), nomApsa = mot('activiteBareme');
  const familles = disc ? Object.keys(disc.familles) : ['CA1', 'CA2', 'CA3', 'CA4', 'CA5'];
  const carte = x => `<button class="carte-bareme ca-${classeCaBareme(x.apsa)}" data-bar="ouvrir" data-arg="${x.id}">
      <span class="chip-ca">${esc(caApsaBareme(x.apsa)) || '—'}</span>${x.modele ? '<span class="etoile-bareme" title="Enregistré comme modèle">⭐</span>' : ''}
      <b>${esc(x.titre)}</b><span class="aide">${esc(x.apsa || 'Sans ' + nomApsa)} · ${esc(nomNiveauBareme(x.niveau))} · sur ${fmt(totalBareme(x))}</span></button>`;
  return `
    <div class="outils">
      <h2>📊 Barèmes</h2>
      <button class="primaire" data-bar="nouveau">+ Nouveau barème</button>
      <button data-bar="recevoir" title="Ton barème en PDF, Word (.docx), LibreOffice (.odt) ou Excel : l’appli le lit et le range dans Mes barèmes. Accepte aussi le fichier .json d’un collègue.">📥 Importer un barème</button>
      <label class="choix-tri">${disc ? esc(disc.nomFamille) : 'Champ'}<select data-bar-filtre="ca"><option value="">Tous</option>${familles.map(c => `<option ${f.ca === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
      <label class="choix-tri">Niveau<select data-bar-filtre="niveau"><option value="">Tous</option>${Object.entries(niveauxBareme()).map(([k, n]) => `<option value="${k}" ${f.niveau === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <input type="search" data-bar-filtre="texte" value="${esc(f.texte)}" placeholder="${esc(mot('rechercheBareme'))}" aria-label="Rechercher">
    </div>
    <h3 class="titre-rayon">Mes barèmes <span class="aide">(${miens.length})</span></h3>
    ${miens.length ? `<div class="rayon-baremes">${miens.map(carte).join('')}</div>`
    : '<p class="aide">Aucun barème pour l’instant : « + Nouveau barème », ou touche un modèle ci-dessous pour partir de lui.</p>'}
    <h3 class="titre-rayon">Modèles fournis <span class="aide">— à dupliquer puis adapter (chiffres indicatifs)</span></h3>
    <div class="rayon-baremes">${fournis.map(x => `<button class="carte-bareme modele-fourni ca-${disc ? classeCaBareme(x.apsa) : caApsaBareme(x.apsa)}" data-bar="depuis-modele" data-arg="${esc(x.apsa)}|${x.niveau}">
      <span class="chip-ca">${esc(caApsaBareme(x.apsa))}</span><b>${esc(x.apsa)}</b><span class="aide">${nomNiveauBareme(x.niveau)}</span></button>`).join('')}</div>`;
}

/* ---------- Création : APSA, niveau, point de départ, blocs à garder ---------- */

// Point de départ : 'fourni' (modèle de l'appli), id d'un de mes barèmes ⭐, ou 'vide'.
function departBareme(apsa, niveau, depart) {
  if (depart === 'vide') return { titre: apsa ? `${apsa} — ${nomNiveauBareme(niveau)}` : 'Nouveau barème', apsa, niveau, pas: 0.5, blocs: [] };
  const mien = depart !== 'fourni' && Donnees.get('baremes', depart);
  if (mien) { const { id, maj, majChamps, majChampsPour, modele, ...reste } = mien; return { ...structuredClone(reste), titre: reste.titre + ' (copie)' }; }
  return apsaBaremes().includes(apsa) ? modeleDeLaDiscipline(apsa, niveau) : departBareme(apsa, niveau, 'vide');
}

// Tous les blocs qu'on peut piocher : ceux de mes barèmes et ceux des modèles fournis.
function blocsAPiocher() {
  const l = [];
  for (const br of mesBaremes()) br.blocs.forEach((b, k) => l.push({ cle: `m|${br.id}|${k}`, nom: `${br.titre} › ${b.titre}`, bloc: b }));
  for (const { apsa: a, niveau: n } of modelesFournisListe()) {
    modeleDeLaDiscipline(a, n).blocs.forEach((b, k) => l.push({ cle: `f|${a}|${n}|${k}`, nom: `Modèle ${a} (${baremesDiscipline() ? nomNiveauBareme(n).toLocaleLowerCase('fr') : NIVEAUX_COURTS[n]}) › ${b.titre}`, bloc: b }));
  }
  return l;
}

async function nouveauBareme(apsa = apsaBaremes()[0], niveau = 'college') {
  const etoiles = mesBaremes().filter(b => b.modele);
  const piocher = blocsAPiocher();
  const { d, resultat } = ouvrirModale('Nouveau barème', `
    <div class="ligne">
      <label>${esc(mot('activiteBareme'))}<input name="apsa" list="liste-apsa-bareme" value="${esc(apsa)}" required></label>
      <datalist id="liste-apsa-bareme">${apsaBaremes().map(a => `<option value="${esc(a)}">`).join('')}</datalist>
      <label>Niveau<select name="niveau">${Object.entries(niveauxBareme()).map(([k, n]) => `<option value="${k}" ${k === niveau ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label>Point de départ<select name="depart"><option value="fourni">Modèle fourni par l’appli</option>
        ${etoiles.map(b => `<option value="${b.id}">⭐ ${esc(b.titre)}</option>`).join('')}<option value="vide">Page blanche</option></select></label>
    </div>
    <p class="aide">Coche les blocs à garder et règle leurs points. Les chiffres des modèles fournis sont <b>indicatifs</b> : adapte-les à ton référentiel.</p>
    <div class="blocs-depart"></div>
    <div class="ligne"><label class="large">Piocher un bloc ailleurs<select data-piocher><option value="">— choisir un bloc —</option>
      ${piocher.map(p => `<option value="${esc(p.cle)}">${esc(p.nom)}</option>`).join('')}</select></label></div>
    <p class="total-depart"></p>`,
  boutonsModale('Créer'), 'modale-large');
  const zone = $('.blocs-depart', d);
  let blocs = [];
  const dessiner = () => {
    zone.innerHTML = blocs.length ? blocs.map((b, k) => `<label class="case bloc-depart"><input type="checkbox" data-garder="${k}" ${b.garder ? 'checked' : ''}>
        <span>${TYPES_BLOCS[b.type][0]} ${esc(b.titre)}</span>
        ${b.type === 'texte' ? '<span></span>' : `<input type="number" min="0" step="0.5" data-pts="${k}" value="${pointsBloc({ ...b, inactif: false })}" aria-label="Points de ${esc(b.titre)}"> pts`}</label>`).join('')
      : '<p class="aide">Aucun bloc : tu les ajouteras dans le barème.</p>';
    majTotal();
  };
  const majTotal = () => {
    const t = blocs.filter(b => b.garder).reduce((s, b) => s + (b.cible ?? pointsBloc({ ...b, inactif: false })), 0);
    $('.total-depart', d).innerHTML = `Total : <b>${fmt(Math.round(t * 100) / 100)} points</b>`;
  };
  const charger = () => {
    blocs = departBareme($('[name="apsa"]', d).value.trim(), $('[name="niveau"]', d).value, $('[name="depart"]', d).value).blocs.map(b => ({ ...b, garder: true }));
    dessiner();
  };
  d.addEventListener('change', e => {
    const t = e.target;
    if (['apsa', 'niveau', 'depart'].includes(t.name)) return charger();
    if (t.dataset.garder !== undefined) { blocs[+t.dataset.garder].garder = t.checked; return majTotal(); }
    if (t.dataset.pts !== undefined) { blocs[+t.dataset.pts].cible = Math.max(0, +t.value || 0); return majTotal(); }
    if (t.matches('[data-piocher]') && t.value) {
      const p = piocher.find(x => x.cle === t.value);
      if (p) blocs.push({ ...structuredClone(p.bloc), garder: true, inactif: false });
      t.value = '';
      dessiner();
    }
  });
  charger();
  const r = await resultat;
  if (r.action !== 'ok') return;
  const base = departBareme(r.data.apsa.trim(), r.data.niveau, r.data.depart);
  const br = preparerBareme({ ...base, apsa: r.data.apsa.trim(), niveau: r.data.niveau,
    titre: r.data.depart === 'fourni' || r.data.depart === 'vide' ? `${r.data.apsa.trim()} — ${nomNiveauBareme(r.data.niveau)}` : base.titre,
    blocs: blocs.filter(b => b.garder).map(({ garder, cible, ...b }) => ({ ...b, _cible: cible })) });
  for (const b of br.blocs) { if (b._cible !== undefined && b._cible !== pointsBloc({ ...b, inactif: false })) ajusterBloc(b, b._cible, br.pas); delete b._cible; }
  const enreg = Donnees.ecrire('baremes', { ...br, id: Donnees.nouvelId(), cree: Date.now() });
  baremeOuvert = enreg.id;
  rendreVue();
}

/* ---------- Éditeur d'un barème ---------- */

const champBar = (chemin, valeur, attrs = '') => `<input data-bar-champ="${chemin}" value="${esc(valeur ?? '')}" ${attrs}>`;

function htmlBloc(br, b, k) {
  const p = `b.${k}`, [icone, nomType] = TYPES_BLOCS[b.type], pts = pointsBloc({ ...b, inactif: false });
  const tete = `<div class="tete-bloc">
      <span class="type-bloc" title="${esc(nomType)}">${icone}</span>
      ${champBar(p + '.titre', b.titre, 'class="titre-bloc" aria-label="Titre du bloc" maxlength="120"')}
      ${b.type === 'texte' ? '' : b.type === 'perf'
    ? `<label class="pts-bloc">${champBar(p + '.points', b.points, 'type="number" min="0.5" step="0.5" data-bar-type="nombre" aria-label="Points du bloc"')} pts</label>`
    : `<span class="pts-bloc" data-bar-pts="${k}">${fmt(pts)} pts</span>`}
      <span class="actions-bloc">
        <label class="case" title="Un bloc désactivé ne compte pas dans le total (il reste dans le barème)"><input type="checkbox" data-bar-actif="${k}" ${b.inactif ? '' : 'checked'}> actif</label>
        <button class="icone-petit" data-bar="monter" data-arg="${k}" ${k ? '' : 'disabled'} aria-label="Monter">↑</button>
        <button class="icone-petit" data-bar="descendre" data-arg="${k}" ${k < br.blocs.length - 1 ? '' : 'disabled'} aria-label="Descendre">↓</button>
        <button class="icone-petit" data-bar="dupliquer-bloc" data-arg="${k}" title="Dupliquer le bloc" aria-label="Dupliquer le bloc">⧉</button>
        <button class="icone-petit" data-bar="suppr-bloc" data-arg="${k}" title="Supprimer le bloc" aria-label="Supprimer le bloc">🗑</button>
      </span></div>`;
  let corps = '';
  if (b.type === 'perf') {
    const cles = b.sexes ? [['f', 'Filles'], ['g', 'Garçons']] : [['v', 'Performance']];
    corps = `<div class="ligne reglage-perf">
        <label>Mesure<select data-bar-champ="${p}.unite">${Object.entries(UNITES_PERF).map(([u, n]) => `<option value="${u}" ${b.unite === u ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <label class="case"><input type="checkbox" data-bar-sexes="${k}" ${b.sexes ? 'checked' : ''}> Filles / garçons séparés</label>
      </div>
      <div class="ligne reglage-perf">${cles.map(([c, n]) => `<span class="ancres-perf"><b>${n}</b>
        <label>0 pt<input data-bar-ancre="${k}|${c}|0" value="${esc(affPerf(b, b.ancres?.[c]?.[0]))}" placeholder="${b.unite === 'temps' ? '5:00' : '2,20'}"></label>
        <label>${fmt(b.points)} pts<input data-bar-ancre="${k}|${c}|1" value="${esc(affPerf(b, b.ancres?.[c]?.[1]))}" placeholder="${b.unite === 'temps' ? '3:10' : '4,20'}"></label></span>`).join('')}
        <button data-bar="generer" data-arg="${k}" title="Refaire le tableau à partir des repères (les retouches à la main sont remplacées)">⚙ Générer le tableau</button></div>
      <div class="table-defile"><table class="table-bareme perf-bareme"><thead><tr><th>Points</th>${cles.map(([, n]) => `<th>${n}</th>`).join('')}</tr></thead>
        <tbody>${b.lignes.map((l, i) => `<tr><td class="pts-ligne">${fmt(l.pts)}</td>${cles.map(([c]) => `<td>${champBar(`${p}.lignes.${i}.${c}`, affPerf(b, l[c]), `data-bar-type="perf" aria-label="${fmt(l.pts)} points"`)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
      <p class="aide">${b.unite === 'temps' ? 'Temps : 3:45 ou 12,5. ' : ''}Changer les points ou les repères, puis « Générer », refait le tableau ; chaque case reste modifiable.</p>`;
  } else if (b.type === 'degres') {
    const noms = typeof NIVEAUX_MAITRISE !== 'undefined' ? NIVEAUX_MAITRISE.map(n => n.nom) : ['Degré 1', 'Degré 2', 'Degré 3', 'Degré 4'];
    corps = `<div class="table-defile"><table class="table-bareme grille-bareme"><thead><tr><th>Critère</th><th>Pts</th>${noms.map((n, i) => `<th><span class="niveau n${i + 1}">${i + 1}</span> ${esc(n)}</th>`).join('')}<th></th></tr></thead>
      <tbody>${b.criteres.map((c, i) => `<tr>
        <td><textarea data-bar-champ="${p}.criteres.${i}.nom" rows="3" aria-label="Critère">${esc(c.nom)}</textarea></td>
        <td class="pts-critere">${champBar(`${p}.criteres.${i}.points`, c.points, 'type="number" min="0" step="0.5" data-bar-type="nombre" aria-label="Points du critère"')}</td>
        ${c.cases.map((t, j) => `<td><textarea data-bar-champ="${p}.criteres.${i}.cases.${j}" rows="3" aria-label="Degré ${j + 1}">${esc(t)}</textarea>
          <span class="fourchette" data-bar-fourchette="${k}|${i}|${j}">${texteDegre(c, j + 1, br.pas)} pts</span></td>`).join('')}
        <td><button class="icone-petit" data-bar="suppr-critere" data-arg="${k}|${i}" aria-label="Retirer ce critère">🗑</button></td></tr>`).join('')}</tbody></table></div>
      <button data-bar="ajout-critere" data-arg="${k}">+ Critère</button>`;
  } else if (b.type === 'ecart' || b.type === 'criteres') {
    corps = `<table class="table-bareme liste-bareme"><thead><tr><th>${b.type === 'ecart' ? 'Palier (une seule ligne s’applique)' : 'Critère (chaque critère rempli compte)'}</th><th>Pts</th><th></th></tr></thead>
      <tbody>${b.lignes.map((l, i) => `<tr><td>${champBar(`${p}.lignes.${i}.libelle`, l.libelle, 'aria-label="Libellé"')}</td>
        <td class="pts-critere">${champBar(`${p}.lignes.${i}.pts`, l.pts, 'type="number" min="0" step="0.5" data-bar-type="nombre" aria-label="Points"')}</td>
        <td><button class="icone-petit" data-bar="suppr-ligne" data-arg="${k}|${i}" aria-label="Retirer cette ligne">🗑</button></td></tr>`).join('')}</tbody></table>
      <button data-bar="ajout-ligne" data-arg="${k}">+ Ligne</button>`;
  } else {
    corps = `<textarea data-bar-champ="${p}.texte" rows="3" aria-label="Texte">${esc(b.texte || '')}</textarea>`;
  }
  return `<section class="bloc-bareme${b.inactif ? ' inactif' : ''}">${tete}<div class="corps-bloc">${corps}</div></section>`;
}

function htmlEditeurBareme(br) {
  const total = totalBareme(br);
  return `
    <div class="outils">
      <button data-bar="bibliotheque">← Bibliothèque</button>
      ${champBar('titre', br.titre, 'class="titre-bareme" aria-label="Titre du barème" maxlength="120"')}
      <span class="total-bareme">Total : <b data-bar-total>${fmt(total)}</b> pts</span>
    </div>
    <div class="ligne reglages-bareme">
      <label>${esc(mot('activiteBareme'))}${champBar('apsa', br.apsa, 'list="liste-apsa-bareme2" maxlength="60"')}</label>
      <datalist id="liste-apsa-bareme2">${apsaBaremes().map(a => `<option value="${esc(a)}">`).join('')}</datalist>
      <label>Niveau<select data-bar-champ="niveau">${Object.entries(niveauxBareme()).map(([k, n]) => `<option value="${k}" ${br.niveau === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label>Pas des points<select data-bar-champ="pas" data-bar-type="nombre"><option value="0.5" ${br.pas === 0.5 ? 'selected' : ''}>0,5</option><option value="1" ${br.pas === 1 ? 'selected' : ''}>1</option></select></label>
      <span class="espace"></span>
      <label>Ramener sur<input type="number" min="1" step="1" value="20" data-bar-cible aria-label="Total visé"></label>
      <button data-bar="ramener" title="Ajuste les points de chaque bloc en proportion">⚖ Ramener</button>
    </div>
    <div class="ligne actions-bareme">
      <button data-bar="etoile" class="${br.modele ? 'primaire' : ''}" title="Proposé comme point de départ dans « + Nouveau barème »">${br.modele ? '⭐ Modèle' : '☆ Enregistrer comme modèle'}</button>
      <button data-bar="imprimer">🖨 Imprimer / PDF</button>
      <button data-bar="excel">⇩ Excel</button>
      <button data-bar="envoyer" title="Fichier .json à donner à un collègue (aucune donnée d’élève)">📤 Envoyer (fichier)</button>
      <button data-bar="dupliquer">⧉ Dupliquer</button>
      <button data-bar="supprimer" class="danger">🗑 Supprimer</button>
    </div>
    <div class="pile-blocs">${br.blocs.map((b, k) => htmlBloc(br, b, k)).join('') || '<p class="aide">Aucun bloc : ajoute-en un ci-dessous.</p>'}</div>
    <div class="ajout-blocs"><b>+ Ajouter un bloc :</b>
      ${Object.entries(TYPES_BLOCS).map(([t, [i, n, info]]) => `<button data-bar="ajout-bloc" data-arg="${t}" title="${esc(info)}">${i} ${n}</button>`).join('')}
      <button data-bar="piocher" title="Copier un bloc d’un autre barème ou d’un modèle">📚 Depuis un autre barème…</button>
    </div>`;
}

// Totaux et fourchettes mis à jour sans redessiner (la saisie garde sa place).
function majTotauxBareme(br) {
  const t = $('[data-bar-total]');
  if (t) t.textContent = fmt(totalBareme(br));
  br.blocs.forEach((b, k) => {
    const p = $(`[data-bar-pts="${k}"]`);
    if (p) p.textContent = fmt(pointsBloc({ ...b, inactif: false })) + ' pts';
    if (b.type === 'degres') b.criteres.forEach((c, i) => [1, 2, 3, 4].forEach(j => {
      const f = $(`[data-bar-fourchette="${k}|${i}|${j - 1}"]`);
      if (f) f.textContent = texteDegre(c, j, br.pas) + ' pts';
    }));
  });
}

const enregistrerBareme = br => Donnees.ecrire('baremes', br);
const baremeCourant = () => structuredClone(Donnees.get('baremes', baremeOuvert));

function ecrireChemin(obj, chemin, valeur) {
  const parts = chemin.split('.').map(x => (x === 'b' ? 'blocs' : /^\d+$/.test(x) ? +x : x));
  let o = obj;
  for (const x of parts.slice(0, -1)) o = o?.[x];
  if (o) o[parts.at(-1)] = valeur;
}

async function actionBareme(quoi, arg) {
  if (quoi === 'nouveau') return nouveauBareme();
  if (quoi === 'depuis-modele') { const [a, n] = arg.split('|'); return nouveauBareme(a, n); }
  if (quoi === 'ouvrir') { baremeOuvert = arg; return rendreVue(); }
  if (quoi === 'bibliotheque') { baremeOuvert = null; return rendreVue(); }
  if (quoi === 'recevoir') return choisirDocumentBareme();
  const br = baremeCourant();
  if (!br) return;
  const [k, i] = String(arg ?? '').split('|').map(Number), b = br.blocs[k];
  switch (quoi) {
    case 'monter': case 'descendre': {
      const j = quoi === 'monter' ? k - 1 : k + 1;
      [br.blocs[k], br.blocs[j]] = [br.blocs[j], br.blocs[k]];
      break;
    }
    case 'dupliquer-bloc': br.blocs.splice(k + 1, 0, { ...structuredClone(b), id: Donnees.nouvelId(), titre: b.titre + ' (copie)' }); break;
    case 'suppr-bloc':
      if (!(await confirmer(`Supprimer le bloc « ${b.titre} » ?`))) return;
      br.blocs.splice(k, 1); break;
    case 'ajout-bloc': br.blocs.push(nouveauBloc(arg, br.pas)); break;
    case 'piocher': {
      const l = blocsAPiocher();
      const { resultat } = ouvrirModale('Ajouter un bloc depuis un autre barème', `
        <label>Bloc<select name="bloc" required>${l.map(p => `<option value="${esc(p.cle)}">${esc(p.nom)}</option>`).join('')}</select></label>`, boutonsModale('Ajouter'));
      const r = await resultat;
      const p = r.action === 'ok' && l.find(x => x.cle === r.data.bloc);
      if (!p) return;
      const nb = { ...structuredClone(p.bloc), id: Donnees.nouvelId(), inactif: false };
      if (nb.type === 'perf' && !nb.lignes?.length) genererPerf(nb, br.pas);
      br.blocs.push(nb); break;
    }
    case 'generer': genererPerf(b, br.pas); break;
    case 'ajout-critere': b.criteres.push({ nom: '', points: 2, cases: [...DESC_GENERIQUES] }); break;
    case 'suppr-critere': b.criteres.splice(i, 1); break;
    case 'ajout-ligne': b.lignes.push({ libelle: '', pts: 0 }); break;
    case 'suppr-ligne': b.lignes.splice(i, 1); break;
    case 'ramener': {
      const cible = +$('[data-bar-cible]')?.value || 20, total = totalBareme(br);
      if (!total) return toast('Aucun point dans ce barème.', 'erreur');
      if (br.blocs.some(x => !x.inactif && perfRetouche(x, br.pas))
        && !(await confirmer('Un tableau de performance a été retouché à la main : il sera refait à partir de ses repères. Continuer ?', 'Continuer'))) return;
      for (const x of br.blocs) if (!x.inactif) ajusterBloc(x, arrondiPas((pointsBloc(x) * cible) / total, br.pas), br.pas);
      // Arrondis : l'écart restant va au bloc qui a le plus de points.
      const ecart = Math.round((cible - totalBareme(br)) * 100) / 100, gros = br.blocs.filter(x => !x.inactif && pointsBloc(x)).sort((a, b) => pointsBloc(b) - pointsBloc(a))[0];
      if (ecart && gros) ajusterBloc(gros, Math.max(0, pointsBloc(gros) + ecart), br.pas);
      toast(`Barème ramené sur ${fmt(cible)} (total obtenu : ${fmt(totalBareme(br))}).`, 'ok');
      break;
    }
    case 'etoile': br.modele = !br.modele; toast(br.modele ? '⭐ Proposé comme point de départ dans « + Nouveau barème ».' : 'N’est plus proposé comme modèle.', 'ok'); break;
    case 'imprimer': return imprimerBareme(br);
    case 'excel': return excelBareme(br);
    case 'envoyer': return envoyerBareme(br);
    case 'dupliquer': {
      const { id, maj, majChamps, majChampsPour, ...reste } = br;
      const copie = Donnees.ecrire('baremes', { ...structuredClone(reste), id: Donnees.nouvelId(), titre: br.titre + ' (copie)', modele: false, cree: Date.now() });
      baremeOuvert = copie.id;
      toast('Barème dupliqué ✔', 'ok');
      return rendreVue();
    }
    case 'supprimer':
      if (!(await confirmer(`Supprimer le barème « ${br.titre} » ?`))) return;
      Donnees.supprimer('baremes', br.id);
      baremeOuvert = null;
      return rendreVue();
    default: return;
  }
  enregistrerBareme(br);
  rendreVue();
}

function nouveauBloc(type, pas) {
  const b = type === 'perf' ? blocPerf('Performance', 10, 'temps', { f: [null, null], g: [null, null] })
    : type === 'degres' ? blocDegres('Grille par degrés', [['', 4]])
      : type === 'ecart' ? blocEcart('Barème à paliers', [['', 4], ['', 2], ['', 0]])
        : type === 'criteres' ? blocCriteres('Critères observables', [['', 1], ['', 1]])
          : blocTexte('Consignes', '');
  b.id = Donnees.nouvelId();
  if (type === 'perf') genererPerf(b, pas);
  return b;
}

/* ---------- Impression, Excel, échange de fichiers ---------- */

function lignesBloc(b, pas) {
  if (b.type === 'perf') {
    const cles = b.sexes ? [['f', 'Filles'], ['g', 'Garçons']] : [['v', 'Performance']];
    return [['Points', ...cles.map(c => c[1])], ...b.lignes.map(l => [fmt(l.pts), ...cles.map(([c]) => affPerf(b, l[c]))])];
  }
  if (b.type === 'degres') return [['Critère', 'Pts', '1', '2', '3', '4'],
    ...b.criteres.map(c => [c.nom, fmt(+c.points || 0), ...c.cases.map((t, j) => `${t} (${texteDegre(c, j + 1, pas)} pts)`)])];
  if (b.type === 'ecart' || b.type === 'criteres') return [[b.type === 'ecart' ? 'Palier' : 'Critère', 'Pts'], ...b.lignes.map(l => [l.libelle, fmt(+l.pts || 0)])];
  return [[b.texte || '']];
}

function imprimerBareme(br) {
  const actifs = br.blocs.filter(b => !b.inactif);
  let zone = $('#zone-impression');
  if (!zone) { zone = document.createElement('div'); zone.id = 'zone-impression'; document.body.append(zone); }
  zone.innerHTML = `<h1>${esc(br.titre)}</h1><p>${esc(br.apsa || '')} · ${esc(nomNiveauBareme(br.niveau))} · noté sur ${fmt(totalBareme(br))}</p>
    ${actifs.map(b => {
    const [entete, ...lignes] = lignesBloc(b, br.pas);
    return `<h2>${esc(b.titre)}${b.type === 'texte' ? '' : ` — ${fmt(pointsBloc(b))} pts`}</h2>${b.type === 'texte' ? `<p>${esc(b.texte || '')}</p>`
      : `<table><thead><tr>${entete.map(x => `<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${lignes.map(l => `<tr>${l.map(x => `<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>`}`;
  }).join('')}`;
  document.body.classList.add('impression-bareme');
  const fin = () => { document.body.classList.remove('impression-bareme'); window.removeEventListener('afterprint', fin); };
  window.addEventListener('afterprint', fin);
  window.print();
  setTimeout(fin, 1000); // (navigateurs sans « afterprint »)
}

function telechargerBlob(blob, nom) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nom.replace(/[\\/:*?"<>|]/g, '-');
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 60000);
}

function excelBareme(br) {
  const lignes = [[{ v: br.titre, style: 'titre' }], [`${br.apsa || ''} · ${nomNiveauBareme(br.niveau)} · noté sur ${fmt(totalBareme(br))}`], []];
  for (const b of br.blocs.filter(x => !x.inactif)) {
    lignes.push([{ v: `${b.titre}${b.type === 'texte' ? '' : ` — ${fmt(pointsBloc(b))} pts`}`, style: 'entete' }]);
    const [entete, ...reste] = lignesBloc(b, br.pas);
    if (b.type !== 'texte') lignes.push(entete.map(v => ({ v, style: 'entete' })));
    lignes.push(...reste.map(l => l.map(v => ({ v, style: 'texte' }))), []);
  }
  telechargerBlob(Tableur.ecrire([{ nom: 'Barème', lignes, largeurs: [40, 14, 30, 30, 30, 30] }]), `Barème ${br.titre}.xlsx`);
}

function envoyerBareme(br) {
  const { id, maj, majChamps, majChampsPour, modele, ...reste } = br;
  const contenu = { format: 'carnet-eps-bareme', version: 1, appli: VERSION_APP, date: aujourdhui(), bareme: reste };
  telechargerBlob(new File([JSON.stringify(contenu, null, 2)], 'b.json', { type: 'application/json' }), `Barème ${br.titre}.json`);
  toast('Fichier du barème prêt ✔ (aucune donnée d’élève dedans)', 'ok');
}

// Barème reçu (fichier venu de n'importe qui) : on ne garde que des valeurs du bon type et de taille raisonnable.
function nettoyerBareme(x) {
  const txt = (s, n) => String(s ?? '').slice(0, n), num = v => (Number.isFinite(+v) ? Math.max(-1e6, Math.min(1e6, +v)) : 0);
  const numOuNul = v => (v === null || v === '' || v === undefined || !Number.isFinite(+v) ? null : +v);
  const blocs = (Array.isArray(x?.blocs) ? x.blocs : []).slice(0, 40).filter(b => TYPES_BLOCS[b?.type]).map(b => {
    const n = { id: Donnees.nouvelId(), type: b.type, titre: txt(b.titre, 120), inactif: !!b.inactif };
    if (b.type === 'perf') {
      Object.assign(n, { points: Math.max(0.5, num(b.points) || 10), unite: UNITES_PERF[b.unite] ? b.unite : 'nombre', sexes: !!b.sexes, ancres: {} });
      for (const c of ['f', 'g', 'v']) if (Array.isArray(b.ancres?.[c])) n.ancres[c] = [numOuNul(b.ancres[c][0]), numOuNul(b.ancres[c][1])];
      n.lignes = (Array.isArray(b.lignes) ? b.lignes : []).slice(0, 200).map(l => ({ pts: num(l?.pts), f: numOuNul(l?.f), g: numOuNul(l?.g), v: numOuNul(l?.v) }));
    } else if (b.type === 'degres') {
      n.criteres = (Array.isArray(b.criteres) ? b.criteres : []).slice(0, 30)
        .map(c => ({ nom: txt(c?.nom, 300), points: num(c?.points), cases: [0, 1, 2, 3].map(j => txt(c?.cases?.[j], 400)),
          ...(Array.isArray(c?.ptsDegres) && c.ptsDegres.length === 4 && c.ptsDegres.every(v => Number.isFinite(+v)) ? { ptsDegres: c.ptsDegres.map(num) } : {}) }));
    } else if (b.type === 'texte') n.texte = txt(b.texte, 4000);
    else n.lignes = (Array.isArray(b.lignes) ? b.lignes : []).slice(0, 60).map(l => ({ libelle: txt(l?.libelle, 200), pts: num(l?.pts) }));
    return n;
  });
  return { titre: txt(x?.titre, 120) || 'Barème reçu', apsa: txt(x?.apsa, 60), niveau: NIVEAUX_BAREME[x?.niveau] ? x.niveau : 'college', pas: x?.pas === 1 ? 1 : 0.5, blocs };
}

// Fichier .json d'un collègue (le bouton « 📥 Importer un barème » accepte aussi PDF, Word… : voir importbareme.js).
async function recevoirFichierBareme(f) {
  if (f.size > 2e6) throw new Error('Fichier trop gros pour un barème.');
  let contenu;
  try { contenu = JSON.parse(await f.text()); } catch { throw new Error('Ce fichier n’est pas un barème du Carnet EPS.'); }
  if (contenu?.format !== 'carnet-eps-bareme' || !contenu.bareme) throw new Error('Ce fichier n’est pas un barème du Carnet EPS.');
  const br = nettoyerBareme(contenu.bareme);
  const enreg = Donnees.ecrire('baremes', { ...br, id: Donnees.nouvelId(), cree: Date.now() });
  baremeOuvert = enreg.id;
  toast(`Barème « ${br.titre} » ajouté à Mes barèmes ✔`, 'ok');
  rendreVue();
}

/* ---------- Lien avec les évaluations (onglet Notes) ----------
   e.bareme = { id, titre, maj, pas, blocs } : copie des blocs actifs au moment du lien (modifier le barème ensuite ne change
   pas les notes ; la fenêtre de l'évaluation propose de mettre à jour). Chaque bloc donne une ou plusieurs parties de la note :
     perf → 1 partie (on saisit la perf) ; degres → 1 par critère (on touche le degré) ; ecart → 1 (on choisit le palier) ;
     criteres → 1 par critère (on coche). p.source = { type: 'perf' | 'degre' | 'palier' | 'case', bloc, i }.
   La saisie brute (perf, degré, n° de palier, 1 = coché) est rangée à côté des points : notes[éval|élève|brut:id]. */

function lienBareme(br) {
  return { id: br.id, titre: br.titre, maj: br.maj, pas: br.pas || 0.5, blocs: structuredClone(br.blocs.filter(b => !b.inactif && b.type !== 'texte')) };
}

function partiesDuBareme(lien) {
  const l = [];
  for (const b of lien.blocs) {
    if (b.type === 'perf') l.push({ id: b.id, nom: b.titre, max: +b.points || 0, source: { type: 'perf', bloc: b.id } });
    else if (b.type === 'ecart') l.push({ id: b.id, nom: b.titre, max: pointsBloc(b), source: { type: 'palier', bloc: b.id } });
    else if (b.type === 'degres') b.criteres.forEach((c, i) => l.push({ id: `${b.id}~${i}`, nom: c.nom || `${b.titre} ${i + 1}`, groupe: b.titre, max: +c.points || 0, source: { type: 'degre', bloc: b.id, i } }));
    else if (b.type === 'criteres') b.lignes.forEach((c, i) => l.push({ id: `${b.id}~${i}`, nom: c.libelle || `${b.titre} ${i + 1}`, groupe: b.titre, max: +c.pts || 0, source: { type: 'case', bloc: b.id, i } }));
  }
  return l.filter(p => p.max > 0);
}

const blocDuLien = (e, p) => e.bareme?.blocs.find(b => b.id === p.source?.bloc) || null;

// Points d'une partie d'après la saisie brute : nombre, null (rien de saisi) ou undefined (sexe de l'élève inconnu).
function pointsPartieBareme(e, p, brut, sexe) {
  const b = blocDuLien(e, p), s = p.source;
  if (!b || brut === '' || brut === null || brut === undefined) return null;
  if (s.type === 'perf') {
    const cle = b.sexes ? { F: 'f', G: 'g' }[sexe] : 'v';
    if (!cle) return undefined;
    const v = +brut, mieux = b.unite === 'temps' ? (x, r) => x <= r : (x, r) => x >= r;
    const lignes = b.lignes.filter(l => Number.isFinite(l[cle])).sort((x, y) => y.pts - x.pts);
    return lignes.find(l => mieux(v, l[cle]))?.pts ?? 0;
  }
  if (s.type === 'palier') return +(b.lignes[+brut]?.pts) || 0;
  if (s.type === 'degre') { const c = b.criteres[s.i]; return c ? ptsDuDegre(c, +brut, e.bareme.pas || 0.5) : null; } // haut de la fourchette (ou points fixés du degré)
  if (s.type === 'case') return +brut ? +(b.lignes[s.i]?.pts) || 0 : null;
  return null;
}

// Texte d'une saisie brute, pour l'affichage (« 3:12 », « 4,35 m », « Écart ≤ 2 s », « degré 3 », « ✔ »).
function texteBrutBareme(e, p, brut) {
  const b = blocDuLien(e, p);
  if (!b || brut === '' || brut === null || brut === undefined) return '';
  if (p.source.type === 'perf') return affPerf(b, +brut);
  if (p.source.type === 'palier') return b.lignes[+brut]?.libelle || '';
  if (p.source.type === 'degre') return 'degré ' + brut;
  return '✔';
}

/* ---------- Événements ---------- */

document.addEventListener('click', e => {
  const b = e.target.closest('#vue [data-bar]');
  if (!b || b.disabled || ui.vue !== 'baremes') return;
  lancer(() => actionBareme(b.dataset.bar, b.dataset.arg));
});

document.addEventListener('input', e => {
  const t = e.target;
  if (ui.vue !== 'baremes' || !t.matches?.('#vue [data-bar-filtre="texte"]')) return;
  filtresBaremes.texte = t.value;
  const pos = t.selectionStart;
  rendreVue();
  const n = $('#vue [data-bar-filtre="texte"]');
  n?.focus(); n?.setSelectionRange(pos, pos);
});

document.addEventListener('change', e => {
  const t = e.target;
  if (ui.vue !== 'baremes' || !t.closest?.('#vue')) return;
  if (t.dataset.barFiltre && t.dataset.barFiltre !== 'texte') { filtresBaremes[t.dataset.barFiltre] = t.value; return rendreVue(); }
  const br = baremeCourant();
  if (!br) return;
  if (t.dataset.barActif !== undefined) { br.blocs[+t.dataset.barActif].inactif = !t.checked; enregistrerBareme(br); return rendreVue(); }
  if (t.dataset.barSexes !== undefined) {
    const b = br.blocs[+t.dataset.barSexes];
    b.sexes = t.checked;
    if (b.sexes) { b.ancres.f ??= b.ancres.v; b.ancres.g ??= b.ancres.v; } else b.ancres.v ??= b.ancres.f || b.ancres.g;
    genererPerf(b, br.pas);
    enregistrerBareme(br);
    return rendreVue();
  }
  if (t.dataset.barAncre) {
    const [k, c, j] = t.dataset.barAncre.split('|'), b = br.blocs[+k], v = lirePerf(b, t.value);
    if (v === undefined) { toast(`« ${t.value} » : valeur illisible.`, 'erreur'); t.value = affPerf(b, b.ancres?.[c]?.[+j]); return; }
    (b.ancres[c] ??= [null, null])[+j] = v;
    t.value = affPerf(b, v);
    return enregistrerBareme(br);
  }
  const chemin = t.dataset.barChamp;
  if (!chemin) return;
  let v = t.value;
  if (t.dataset.barType === 'nombre') v = Math.max(0, +String(v).replace(',', '.') || 0);
  if (t.dataset.barType === 'perf') {
    const k = +chemin.split('.')[1], b = br.blocs[k];
    v = lirePerf(b, t.value);
    if (v === undefined) { toast(`« ${t.value} » : valeur illisible.`, 'erreur'); return rendreVue(); }
    t.value = affPerf(b, v);
  }
  // Points d'un bloc de performance, unité, pas : le tableau est refait (il en dépend) ; s'il a été retouché à la main, on demande.
  const refaire = /^b\.\d+\.(points|unite)$/.test(chemin) || chemin === 'pas';
  if (refaire && br.blocs.some(b => perfRetouche(b, br.pas) && (chemin === 'pas' || chemin.startsWith(`b.${br.blocs.indexOf(b)}.`)))) {
    return lancer(async () => {
      if (await confirmer('Ce tableau de performance a été retouché à la main : il sera refait à partir de ses repères. Continuer ?', 'Continuer')) appliquerChampBareme(br, chemin, v);
      else rendreVue();
    });
  }
  appliquerChampBareme(br, chemin, v);
});

function appliquerChampBareme(br, chemin, v) {
  const crit = /^b\.(\d+)\.criteres\.(\d+)\.points$/.exec(chemin);
  if (crit) echelleDegres(br.blocs[+crit[1]]?.criteres[+crit[2]], v);
  ecrireChemin(br, chemin, v);
  const refaire = /^b\.\d+\.(points|unite)$/.test(chemin) || chemin === 'pas';
  if (/^b\.\d+\.points$/.test(chemin)) genererPerf(br.blocs[+chemin.split('.')[1]], br.pas);
  if (/^b\.\d+\.unite$/.test(chemin)) { const b = br.blocs[+chemin.split('.')[1]]; b.ancres = b.sexes ? { f: [null, null], g: [null, null] } : { v: [null, null] }; genererPerf(b, br.pas); }
  if (chemin === 'pas') br.blocs.filter(b => b.type === 'perf').forEach(b => genererPerf(b, br.pas));
  enregistrerBareme(br);
  if (refaire) return rendreVue();
  majTotauxBareme(br);
}
