/* ---------- Aide « Hugo » : bulle ? en bas à droite ----------
   Un petit personnage, Hugo, présente des rubriques en arborescence (AIDE_RUBRIQUES) et répond en quelques lignes.
   Si l'explication ne suffit pas, « Montre-moi sur l'écran » : Hugo se place à côté de chaque bouton à toucher,
   l'entoure, et passe tout seul à l'étape suivante quand l'enseignant l'a fait (guide : liste d'étapes).
   Ajouter un thème = ajouter un nœud dans AIDE_RUBRIQUES (titre, icone, puis enfants OU reponse [+ guide]).
   Logo de Hugo = un cadran de 8 rayons dont un « en avance » ; tout en currentColor : il prend la couleur de l'appli
   choisie dans ⚙ Réglages (--accent) et suit le mode sombre. Pendant le guide, le rayon avancé tourne à chaque étape.
   Masquée en mode élève. */

// Cadran : rayons en transparence, le rayon n° « actif » (0 = en haut, sens des aiguilles) plein.
// Avec « ? » (la bulle) : rayons plus courts, le point d'interrogation au centre.
const teteHugo = (actif = 7, question = false) => `<span class="hugo-tete"><svg viewBox="0 0 64 64" aria-hidden="true">${[0, 1, 2, 3, 4, 5, 6, 7]
  .map(k => `<rect class="${k === actif % 8 ? 'hg-rayon-actif' : 'hg-rayon'}" x="28" y="${question ? 2 : 4}" width="8" height="${question ? 14 : 22}" rx="4" transform="rotate(${k * 45} 32 32)"/>`).join('')}
  ${question ? '<text class="hg-question" x="32" y="42" text-anchor="middle">?</text>' : ''}</svg></span>`;

/* ---------- Repérer les éléments de l'écran (pour le guide) ---------- */

const visibleHugo = el => !!el && el.getClientRects().length > 0 && el.getBoundingClientRect().width > 0;
const premierVisible = (...sel) => sel.flatMap(s => [...document.querySelectorAll(s)]).find(visibleHugo) || null;
// Fenêtre ouverte reconnue par ce qu'elle contient (null si elle n'est pas ouverte).
const fenetreAvec = sel => () => { const m = modaleOuverte(); return m?.querySelector(sel) ? m : null; };
const fenetreEval = fenetreAvec('[name="bareme"]');
const fenetreNouveauBareme = fenetreAvec('.blocs-depart');
const fenetreImportBareme = fenetreAvec('.blocs-import');
const dansFenetre = (fenetre, sel) => () => fenetre() && premierVisible(...sel.split(',').map(s => `dialog[open] ${s.trim()}`));
const dansFenetreEval = sel => dansFenetre(fenetreEval, sel);

/* ---------- Étapes réutilisables (pour toutes les rubriques) ---------- */

// Onglet du haut (ou de la tablette : barre du bas, rideau ▾ du groupe puis la page).
const etapeOnglet = (vue, nom, rideau) => ({
  cible: () => premierVisible(`#onglets [data-vue="${vue}"]`, `#onglets-bas [data-vue="${vue}"]`, `#onglets-compact [data-vue="${vue}"]`,
    `[role="menuitem"][data-vue="${vue}"]`, ...(rideau ? [`[data-rideau="${rideau}"]`] : [])),
  // (nom : texte, ou fonction pour un onglet nommé selon la discipline, ex. Leçons / Séances)
  texte: el => { const n = typeof nom === 'function' ? nom() : nom; return el?.matches('[data-rideau]') ? `Touche ▾ ici, puis « ${n} ».` : `Touche l’onglet « ${n} », en haut.`; },
  fait: () => ui.vue === vue,
});
// Bouton à toucher, qui ouvre une fenêtre (ou une page) : étape faite quand `fait` est vrai.
const etapeBouton = (sel, texte, fait, sinon) => ({ cible: () => premierVisible(sel), texte, fait, sinon, defiler: true });
// « Regarde ici » (bouton Suivant) : dans une fenêtre, ou dans la page.
const etapeZone = (fenetre, sel, texte) => ({ cible: dansFenetre(fenetre, sel), texte, suivant: true, defiler: true, fait: () => !fenetre() });
const etapeZonePage = (sel, texte, sinon) => ({ cible: () => premierVisible(sel), texte, sinon, suivant: true, defiler: true });
// Bouton principal de la fenêtre (Créer, Enregistrer…).
const etapeValider = (fenetre, pour = 'pour garder tes changements') => ({
  cible: dansFenetre(fenetre, '.modale-actions button.primaire'),
  texte: el => `Touche « ${el?.textContent.trim() || 'Enregistrer'} » ${pour}.`,
  fait: () => !fenetre(),
});

const ETAPES_HUGO = {
  ongletNotes: etapeOnglet('notes', 'Notes', 'suivi'),
  ongletBaremes: etapeOnglet('baremes', 'Barèmes', 'suivi'),
  // Un barème est ouvert : revenir à la bibliothèque (liste des barèmes).
  bibliotheque: etapeBouton('#vue [data-bar="bibliotheque"]', 'Touche « ← Bibliothèque » pour revenir à la liste de tes barèmes.',
    () => ui.vue === 'baremes' && !!document.querySelector('#vue [data-bar="nouveau"]')),
  classe: {
    // Sans classe choisie, l'onglet Notes n'a pas de bouton « + Évaluation ».
    cible: () => premierVisible('#liste-classes li', '#btn-menu'),
    texte: el => el?.id === 'btn-menu' ? 'Touche ☰ pour voir tes classes, puis choisis-en une.' : 'Choisis d’abord une classe dans la liste.',
    fait: () => !!document.querySelector('#vue [data-action="ajout-eval"]') || !!fenetreEval(),
  },
  ouvrirEval: {
    cible: () => premierVisible('#vue [data-eval-entete]', '#vue [data-action="ajout-eval"]'),
    texte: el => el?.matches('[data-eval-entete]')
      ? 'Touche le titre de ton évaluation, en haut de sa colonne : sa fenêtre s’ouvre. (Pas encore d’évaluation ? « + Évaluation ».)'
      : 'Tu n’as pas encore d’évaluation : touche « + Évaluation ».',
    fait: () => !!fenetreEval(),
  },
  valider: etapeValider(fenetreEval),
};
const zoneEval = (sel, texte) => etapeZone(fenetreEval, sel, texte);

// Question posée dans deux rubriques (Notes et Barèmes). En EPS, l'APSA de l'évaluation fait remonter ses barèmes ;
// en SVT, les barèmes sont rangés par type d'épreuve : on choisit directement dans la liste.
const questionBaremeEval = eps => ({
  id: 'bareme', titre: 'Calculer la note avec un barème',
  reponse: ['Dans l’onglet <b>Notes</b>, touche le <b>titre de l’évaluation</b>.',
    ...(eps ? ['Écris l’<b>APSA</b> (ex. Demi-fond) : les barèmes de cette activité sont proposés en premier.'] : []),
    'Dans <b>« Barème »</b>, choisis-le dans la liste <b>« Calculer la note avec »</b>.',
    `Touche <b>« Enregistrer »</b> : ${eps ? 'tu tapes la performance' : 'tu saisis pour chaque élève ce que demande le barème (degrés, critères…)'}, l’appli calcule les points.`,
    'Tes barèmes se créent et s’importent dans l’onglet <b>Barèmes</b>.'],
  guide: [ETAPES_HUGO.ongletNotes, ETAPES_HUGO.classe, ETAPES_HUGO.ouvrirEval,
    ...(eps ? [zoneEval('[name="apsa"]', 'Vérifie l’APSA : les barèmes qui lui correspondent sont proposés en premier.')] : []),
    { cible: dansFenetreEval('[name="bareme"]'), defiler: true, texte: 'Choisis ton barème dans cette liste.',
      fait: () => !fenetreEval() || !!fenetreEval().querySelector('[name="bareme"]').value },
    ETAPES_HUGO.valider],
});

// Étapes de la fenêtre « Nouveau barème » (aussi ouverte depuis un modèle fourni).
const ETAPES_NOUVEAU_BAREME = [
  etapeZone(fenetreNouveauBareme, '[name="apsa"]', () => `Vérifie ${disciplineActive() === 'eps' ? 'l’APSA' : 'le type d’épreuve'} et le niveau.`),
  etapeZone(fenetreNouveauBareme, '[name="depart"]', 'Point de départ : le modèle de l’appli, un de tes barèmes ⭐, ou une page blanche.'),
  etapeZone(fenetreNouveauBareme, '.blocs-depart', 'Coche les blocs à garder et règle leurs points : le total s’affiche en dessous.'),
  etapeValider(fenetreNouveauBareme, 'pour créer ton barème'),
  etapeZonePage('#vue .titre-bareme', 'Ton barème est créé et enregistré ! Tu peux tout modifier ici : titre, blocs, points.'),
];
// Ouvrir un de mes barèmes (étape faite quand l'éditeur est affiché).
const etapeOuvrirBareme = etapeBouton('#vue .carte-bareme:not(.modele-fourni)', 'Touche ton barème dans « Mes barèmes ».',
  () => ui.vue === 'baremes' && !!document.querySelector('#vue [data-bar="bibliotheque"]'),
  'Tu n’as pas encore de barème à toi : crée-en un avec « + Nouveau barème », ou touche un modèle fourni.');

// Élèves et classes : fenêtres reconnues et étapes communes.
const fenetreClasse = fenetreAvec('[name="pp"]');
const fenetreListeClasse = fenetreAvec('.bilan-import');
const fenetreEleve = fenetreAvec('[name="nom"][autocapitalize]');
const fenetreColler = fenetreAvec('textarea[name="liste"]');
const fenetreTrombi = fenetreAvec('.grille-trombi:not(.import-trombi)');
const fenetreTrombiLu = fenetreAvec('.import-trombi'); // photos lues, à vérifier
const fenetreFiche = fenetreAvec('[data-fiche]');
const pageEleves = sel => () => !!document.querySelector(`#vue ${sel}`) || !!modaleOuverte();
const ETAPES_ELEVES = {
  onglet: etapeOnglet('eleves', 'Élèves', 'classe'),
  classe: { ...ETAPES_HUGO.classe, fait: pageEleves('[data-mode-eleves], [data-action="ajout-eleve"]') },
  modifier: etapeBouton('#vue [data-mode-eleves="modifier"]', 'Touche « ✎ Modifier la liste » : c’est là qu’on ajoute et qu’on règle les élèves.',
    pageEleves('[data-action="ajout-eleve"]')),
  consulter: etapeBouton('#vue [data-mode-eleves="consulter"]', 'Touche « 👀 Consulter » pour voir les cartes des élèves.', pageEleves('[data-carte-eleve]')),
  // Le bouton ✎ de la classe est dans la liste de gauche (sur tablette : derrière ☰).
  ouvrirClasse: {
    cible: () => premierVisible('#liste-classes .modif', '#btn-menu'),
    texte: el => el?.id === 'btn-menu' ? 'Touche ☰ pour voir tes classes, puis choisis la classe.' : 'Touche ✎ à côté du nom de la classe.',
    fait: () => !!fenetreClasse(),
  },
  nouvelleClasse: {
    cible: () => premierVisible('#classes [data-action="ajout-classe"]', '#btn-menu'),
    texte: el => el?.id === 'btn-menu' ? 'Touche ☰ pour voir la liste des classes.' : 'Touche « + Nouvelle classe », sous la liste des classes.',
    fait: () => !!fenetreClasse() || !!fenetreListeClasse(),
  },
};

// Leçons : la grille de la classe, la fenêtre d'une séance, la fiche élève, l'Excel.
const fenetreSeance = fenetreAvec('.liste-indic');
const fenetreFicheLecons = fenetreAvec('[data-fiche-onglets]');
const fenetreExcelLecons = fenetreAvec('[data-fichier-excel]');
const zoneSeance = (sel, texte) => etapeZone(fenetreSeance, sel, texte);
const ETAPES_LECONS = {
  onglet: etapeOnglet('entrainement', () => mot('lecons'), 'suivi'),
  classe: { ...ETAPES_HUGO.classe, fait: () => !!document.querySelector('#vue [data-action="ajout-seance"], #vue [data-action="vue-eleves"]') || !!fenetreSeance() },
  nouvelle: etapeBouton('#vue [data-action="ajout-seance"]', 'Touche « + Séance ».', () => !!fenetreSeance(),
    'Cette classe n’a pas encore d’élèves : ajoute-les d’abord (onglet Élèves).'),
  ouvrir: {
    cible: () => premierVisible('#vue [data-seance-entete]', '#vue [data-action="ajout-seance"]'),
    texte: el => el?.matches('[data-seance-entete]')
      ? 'Touche le titre de la séance, en haut de sa colonne : sa fenêtre s’ouvre.'
      : 'Pas encore de séance dans cette classe : touche « + Séance ».',
    fait: () => !!fenetreSeance(),
  },
  valider: etapeValider(fenetreSeance),
};

// Prof principal : se déclarer PP d'une classe (question posée dans « Les classes » et dans « Prof principal »).
const QUESTION_DEVENIR_PP = {
  id: 'pp', titre: 'Je suis professeur principal : l’indiquer',
  reponse: ['Choisis ta classe à gauche et touche <b>✎</b> à côté de son nom.',
    'Coche <b>« ⭐ Je suis professeur principal de cette classe »</b>, puis <b>« Enregistrer »</b>.',
    'Un onglet <b>Prof principal</b> apparaît, et une ⭐ à côté du nom de la classe.',
    'PP de plusieurs classes ? Coche la case dans chacune : l’onglet propose un bouton par classe.',
    'Pour essayer sans risque : la <b>classe exemple</b> est déjà « classe de PP », avec des bulletins inventés.'],
  guide: [ETAPES_ELEVES.ouvrirClasse,
    etapeZone(fenetreClasse, '[name="pp"]', 'Coche cette case.'),
    etapeValider(fenetreClasse, 'pour faire apparaître l’onglet Prof principal')],
};
const sectionPP = () => (SECTIONS_PP[ui.ppSection] ? ui.ppSection : 'bulletins');
const ETAPES_PP = {
  onglet: { ...etapeOnglet('pp', 'Prof principal'),
    sinon: 'L’onglet « Prof principal » n’apparaît qu’une fois une classe marquée « Je suis professeur principal » (✎ de la classe).' },
  section: k => etapeBouton(`#vue [data-pp="section"][data-arg="${k}"]`, `Touche « ${SECTIONS_PP[k]} ».`, () => ui.vue === 'pp' && sectionPP() === k),
};
// Appréciations de la matière (onglet Notes) : la fenêtre « ✍ Appréciations » de la classe.
const fenetreAppr = fenetreAvec('[data-appr-liste]');
const ETAPE_OUVRIR_APPR = etapeBouton('#vue [data-action="appreciations"]', 'Touche « ✍ Appréciations ».', () => !!fenetreAppr());

// Agenda : l'onglet et ses fenêtres (séquence, conseils, événement, année et vacances, emploi du temps).
const fenetreSequence = fenetreAvec('[list="liste-apsa-ag"]');
const fenetreConseils = fenetreAvec('.tableau-conseils');
const fenetreEvenement = fenetreAvec('[name="typeEv"]');
const fenetreAnnee = fenetreAvec('[data-lignes="vac"]');
const fenetreEdt = fenetreAvec('[data-fichier-edt]');
const ETAPES_AGENDA = {
  onglet: etapeOnglet('agenda', 'Agenda'),
  // Sans classe, l'agenda ne montre qu'un bouton « + Nouvelle classe ».
  pret: { cible: () => premierVisible('#vue [data-action="ajout-classe"]'), texte: 'Crée d’abord une classe : l’agenda range tout classe par classe.',
    fait: () => !!document.querySelector('#vue [data-ag]') || !!modaleOuverte() },
};

// Outils : l'accueil (bulles par famille), un outil ouvert, la fenêtre du mode élève.
const fenetreModeEleve = fenetreAvec('.cases-mode-eleve [name="outil"]');
const ETAPES_OUTILS = {
  onglet: etapeOnglet('outils', 'Outils'),
  // Revenir à l'accueil des outils si un outil est ouvert.
  accueil: etapeBouton('#vue [data-o="accueil"]', 'Touche « ← Outils » pour revenir à la liste des outils.',
    () => ui.vue === 'outils' && !!document.querySelector('#vue .familles-outils')),
  ouvrir: (id, nom) => etapeBouton(`#vue [data-o="ouvrir"][data-arg="${id}"]`, `Touche « ${nom} ».`,
    () => ui.vue === 'outils' && ui.outil === id, 'Choisis d’abord une classe à gauche (sur tablette : ☰).'),
};
// Les outils de la discipline du carnet (même règle que l'onglet Outils), avec ceux réservés au professeur.
const outilsDuCarnet = () => OUTILS.filter(outilDeLaDiscipline);
const nomsOutils = liste => liste.map(o => `${o.icone} ${o.nom}`).join(', ');

// Enregistrer : le menu du bouton « Enregistrer » (pas une fenêtre : il se ferme si on touche ailleurs,
// sauf la bulle de Hugo, voir app.js), la fenêtre « Aide et dépannage », les Réglages › Sécurité.
const menuEnrOuvert = () => !!$('#menu-cle') && !$('#menu-cle').hidden;
const fenetreDepannage = fenetreAvec('.mes-donnees');
const fenetreReglages = fenetreAvec('button[value="mdp"]');
const rubriqueSecurite = () => fenetreReglages()?.querySelector('button[value="mdp"]')?.closest('details') || null;
const MENU_FERME = 'Le menu s’est fermé : retouche « Enregistrer », en haut à droite.';
const dansMenuEnr = (sel, texte, sinon = MENU_FERME) => ({ cible: () => premierVisible(`#menu-cle:not([hidden]) ${sel}`), texte, sinon, suivant: true });
const ETAPES_ENR = {
  menu: { cible: () => premierVisible('#btn-sauver'), texte: 'Touche « Enregistrer », en haut à droite : son menu s’ouvre.', fait: menuEnrOuvert },
  // Le gros bouton du menu : fait quand le menu se ferme sur un vrai enregistrement (fenêtre, bouton qui travaille, ou c'est fait).
  enregistrer: {
    cible: () => premierVisible('#menu-cle:not([hidden]) [data-menu-cle="enregistrer"]'),
    texte: () => (Cle.accesDirect ? 'Touche ce bouton : il écrit ton carnet et récupère en même temps le travail des autres appareils.'
      : 'Touche « Enregistrer » : l’appli prépare le fichier à poser sur ta clé ou ton Drive.'),
    sinon: MENU_FERME,
    fait: () => !menuEnrOuvert() && (!!modaleOuverte() || $('#btn-sauver').disabled || $('#btn-sauver').classList.contains('etat-ok')),
  },
  // Fenêtre ouverte par l'enregistrement (endroit, dossier, mot de passe, fichier prêt) : la suivre jusqu'au bout.
  finirFenetre: {
    cible: () => modaleOuverte()?.querySelector('.modale-actions [data-partager], .modale-actions button.primaire') || null,
    texte: el => `Lis la fenêtre, puis touche « ${el?.textContent.trim() || 'OK'} ».`,
    fait: () => !modaleOuverte() && !$('#btn-sauver').disabled,
  },
  depannage: { ...etapeBouton('#menu-cle:not([hidden]) [data-menu-cle="aide"]', 'Touche « Aide et dépannage… », en bas du menu.', () => !!fenetreDepannage()), sinon: MENU_FERME },
  reglages: {
    cible: () => premierVisible('[data-action="reglages"]', '#btn-menu'),
    texte: el => el?.id === 'btn-menu' ? 'Touche ☰, puis « ⚙ Réglages du carnet », sous la liste des classes.' : 'Touche « ⚙ Réglages du carnet », sous la liste des classes.',
    fait: () => !!fenetreReglages(),
  },
  securite: {
    cible: () => rubriqueSecurite()?.querySelector('summary') || null, defiler: true,
    texte: 'Touche « 🔒 Sécurité » pour ouvrir cette rubrique.',
    fait: () => !fenetreReglages() || !!rubriqueSecurite()?.open,
  },
};
// « Regarde ici » dans la rubrique Sécurité, seulement ouverte (un panneau fermé garde une position dans certains navigateurs).
const zoneSecurite = (sel, texte) => ({
  cible: () => (rubriqueSecurite()?.open && rubriqueSecurite().querySelector(sel)) || null, texte, suivant: true, defiler: true,
  sinon: 'Rouvre « 🔒 Sécurité » dans les Réglages.', fait: () => !fenetreReglages(),
});

/* ---------- L'arborescence des questions ---------- */

// Construite à chaque affichage : les mots, les exemples et les codes suivent la discipline du carnet
// (EPS : Leçons, APSA, tenue… ; SVT : Séances, Thème, matériel, non rendu…). Une question propre à une discipline
// s'y ajoute avec ...(eps ? [question] : []).
function rubriquesAide() {
  const eps = disciplineActive() === 'eps';
  const Lecons = mot('lecons'), lecons = motMin('lecons'), lecon = motMin('lecon');
  const activite = eps ? 'activité' : 'thème';
  // Codes de saisie de la discipline (Notes ; séances : sans « non noté », avec l'oubli de tenue / de matériel).
  const codes = aideCodes(), codesSeance = `${aideCodes(true)} · <b>T</b> ${oubliTenue()}`;
  // Ce que décrit un barème : l'APSA (EPS), le type d'épreuve (SVT).
  const ceQueDecrit = eps ? 'l’APSA' : 'le type d’épreuve', tonType = eps ? 'ton activité' : 'ton type d’épreuve';
  return {
    titre: 'Sur quoi je peux t’aider ?',
    enfants: [
      {
        id: 'eleves', icone: '👥', titre: 'Les élèves et les classes',
        enfants: [
          {
            id: 'classes', icone: '🏫', titre: 'Les classes',
            enfants: [
              {
                id: 'creer', titre: 'Créer une classe',
                reponse: ['Touche <b>« + Nouvelle classe »</b>, sous la liste des classes à gauche (sur tablette : ☰ d’abord).',
                  'Écris son <b>nom</b> (ex. 3e B) et choisis son <b>niveau</b> : l’appli propose alors le bon référentiel.',
                  'Coche <b>⭐ Je suis professeur principal</b> si c’est ta classe de PP.',
                  'Touche <b>« Créer »</b>, puis ajoute les élèves (voir « Les élèves »).'],
                guide: [ETAPES_ELEVES.nouvelleClasse,
                  etapeZone(fenetreClasse, '[name="nom"]', 'Écris le nom de la classe (ex. 3e B) et choisis son niveau.'),
                  etapeZone(fenetreClasse, '[name="pp"]', 'Coche cette case si tu es professeur principal de cette classe.'),
                  etapeValider(fenetreClasse, 'pour créer la classe')],
              },
              {
                id: 'ed', titre: 'Créer une classe depuis École Directe ou Pronote',
                intro: 'Le plus rapide : la classe et tous ses élèves (nom, prénom, sexe…) d’un coup.',
                reponse: ['Dans École Directe ou Pronote, exporte la <b>liste de la classe</b> (fichier Excel .xlsx ou .csv).',
                  'Dans le carnet : <b>« + Nouvelle classe »</b>, puis <b>« 📥 Depuis École Directe / Pronote… »</b>.',
                  'Choisis le fichier : l’appli te montre ce qu’elle a lu (classe, nombre d’élèves).',
                  'Touche <b>« Créer la classe »</b>.'],
                guide: [ETAPES_ELEVES.nouvelleClasse,
                  { cible: dansFenetre(fenetreClasse, '.modale-actions [value="ecole-directe"]'), texte: 'Touche « 📥 Depuis École Directe / Pronote… », puis choisis le fichier exporté.',
                    fait: () => !!fenetreListeClasse(), sinon: 'Choisis le fichier de la liste de classe (.xlsx ou .csv) : l’appli va le lire.' },
                  etapeZone(fenetreListeClasse, '.bilan-import', 'Voici ce que l’appli a lu dans ton fichier : vérifie la classe et le nombre d’élèves.'),
                  etapeValider(fenetreListeClasse, 'pour créer la classe')],
              },
              QUESTION_DEVENIR_PP,
              {
                id: 'modifier', titre: 'Renommer ou supprimer une classe',
                reponse: ['Choisis la classe dans la liste à gauche, puis touche <b>✎</b> à côté de son nom.',
                  'Change le <b>nom</b> ou le <b>niveau</b>, puis <b>« Enregistrer »</b>.',
                  `Pour la supprimer : bouton rouge <b>« Supprimer »</b> (ses élèves, notes et ${lecons} partent avec elle ; une erreur ? <b>↶</b> en haut).`],
                guide: [ETAPES_ELEVES.ouvrirClasse,
                  etapeZone(fenetreClasse, '[name="nom"]', 'Change le nom ou le niveau ici.'),
                  etapeZone(fenetreClasse, '.modale-actions button.danger', 'Pour supprimer la classe (avec ses élèves et ses notes) : « Supprimer ».'),
                  etapeValider(fenetreClasse)],
              },
              {
                id: 'exemple', titre: 'La classe exemple',
                reponse: ['C’est une classe <b>inventée</b>, déjà remplie, pour découvrir le carnet : touche à tout, rien n’est grave.',
                  'Pour l’enlever : lien <b>« Supprimer la classe exemple »</b> dans le bandeau en haut de la classe.',
                  'Pour la retrouver : <b>« + Nouvelle classe »</b>, puis <b>« 🎓 Classe exemple »</b>.'],
                guide: [etapeZonePage('#vue [data-action="suppr-exemple"]', 'Ce lien enlève la classe exemple (tes vraies classes ne bougent pas).',
                  'La classe exemple n’est pas affichée : choisis-la dans la liste à gauche, ou recrée-la avec « + Nouvelle classe » › « 🎓 Classe exemple ».')],
              },
            ],
          },
          {
            id: 'eleves', icone: '👤', titre: 'Les élèves',
            enfants: [
              {
                id: 'importer', titre: 'Importer la liste d’École Directe ou Pronote',
                intro: 'Pour remplir ou mettre à jour une classe qui existe déjà (nouveaux élèves, départs).',
                reponse: ['Exporte la liste de la classe depuis École Directe ou Pronote (.xlsx ou .csv).',
                  'Onglet <b>Élèves</b>, puis <b>« ✎ Modifier la liste »</b>.',
                  'Touche <b>« 📥 École Directe / Pronote »</b> et choisis le fichier.',
                  'Vérifie ce que l’appli a lu, puis <b>« Mettre à jour »</b> : les fiches sont créées ou complétées.'],
                guide: [ETAPES_ELEVES.onglet, ETAPES_ELEVES.classe, ETAPES_ELEVES.modifier,
                  etapeBouton('#vue [data-action="import-ed"]', 'Touche « 📥 École Directe / Pronote », puis choisis le fichier exporté.', () => !!fenetreListeClasse()),
                  etapeZone(fenetreListeClasse, '.bilan-import', 'Voici ce que l’appli a lu : vérifie avant de mettre à jour.'),
                  etapeValider(fenetreListeClasse, 'pour mettre la classe à jour')],
              },
              {
                id: 'coller', titre: 'Coller une liste (Pronote, tableur)',
                reponse: ['Copie la liste des élèves (Pronote, Excel…).',
                  'Onglet <b>Élèves</b>, <b>« ✎ Modifier la liste »</b>, puis <b>« 📋 Coller une liste »</b>.',
                  'Colle-la : un élève par ligne, <b>NOM Prénom</b> (ou Nom;Prénom;Sexe).',
                  'Touche <b>« Ajouter les élèves »</b>.'],
                guide: [ETAPES_ELEVES.onglet, ETAPES_ELEVES.classe, ETAPES_ELEVES.modifier,
                  etapeBouton('#vue [data-action="coller-liste"]', 'Touche « 📋 Coller une liste ».', () => !!fenetreColler()),
                  etapeZone(fenetreColler, 'textarea[name="liste"]', 'Colle ta liste ici (Ctrl+V, ou appui long sur tablette) : un élève par ligne.'),
                  etapeValider(fenetreColler, 'pour les ajouter à la classe')],
              },
              {
                id: 'ajouter', titre: 'Ajouter des élèves un par un',
                reponse: ['Onglet <b>Élèves</b>, puis <b>« ✎ Modifier la liste »</b>.',
                  'Touche <b>« + Élève »</b>.',
                  'Écris le <b>nom</b>, le <b>prénom</b>, le <b>sexe</b>, puis <b>« Ajouter ↵ »</b> : la fenêtre reste ouverte pour le suivant.',
                  'Touche <b>« Terminer »</b> quand tu as fini.'],
                guide: [ETAPES_ELEVES.onglet, ETAPES_ELEVES.classe, ETAPES_ELEVES.modifier,
                  etapeBouton('#vue [data-action="ajout-eleve"]', 'Touche « + Élève ».', () => !!fenetreEleve()),
                  etapeZone(fenetreEleve, '[name="nom"]', 'Écris le nom, le prénom et le sexe. Entrée passe au champ suivant.'),
                  { cible: dansFenetre(fenetreEleve, '.modale-actions button.primaire'), texte: 'Touche « Ajouter ↵ » : la fenêtre reste ouverte pour l’élève suivant. « Terminer » quand tu as fini.',
                    fait: () => !fenetreEleve() }],
              },
              {
                id: 'photos', titre: 'Mettre les photos (trombinoscope)',
                reponse: ['Onglet <b>Élèves</b>, puis <b>« ✎ Modifier la liste »</b> et <b>« 📷 Trombinoscope »</b>.',
                  'Touche <b>« 📄 Importer le trombinoscope »</b> : un PDF ou une image (capture d’écran).',
                  'L’appli lit le nom sous chaque photo et la range sur la bonne fiche : vérifie, puis <b>« Enregistrer les photos »</b>.',
                  'Une seule photo à changer ? Touche 📷 sous l’élève.'],
                guide: [ETAPES_ELEVES.onglet, ETAPES_ELEVES.classe, ETAPES_ELEVES.modifier,
                  etapeBouton('#vue [data-action="trombi"]', 'Touche « 📷 Trombinoscope ».', () => !!fenetreTrombi()),
                  // (fait seulement quand les photos lues s'affichent : la lecture prend quelques secondes)
                  { cible: dansFenetre(fenetreTrombi, '.modale-actions [value="pdf"]'), texte: 'Touche ce bouton et choisis le PDF ou l’image du trombinoscope.',
                    fait: () => !!fenetreTrombiLu(), sinon: 'Choisis le fichier du trombinoscope : l’appli le lit (ça peut prendre quelques secondes).' },
                  etapeZone(fenetreTrombiLu, '.import-trombi', 'Vérifie chaque photo : le nom lu est rappelé dessous, change l’élève dans la liste si besoin.'),
                  { ...etapeValider(fenetreTrombiLu, 'pour ranger les photos sur les fiches'), sinon: 'Choisis le fichier du trombinoscope : l’appli le lit (ça peut prendre quelques secondes).' }],
              },
              // (SVT : pas de dispense, sauf si le code Dispensé a été réactivé dans ⚙ Réglages › Notes)
              ...(eps || codeDeLaDiscipline('DISP') ? [{
                id: 'dispense', titre: 'Dispense ou pratique adaptée',
                reponse: ['Onglet <b>Élèves</b>, puis <b>« ✎ Modifier la liste »</b>.',
                  'Dans la colonne <b>« Dispense / adapté »</b> de l’élève, choisis <b>Dispensé</b> ou <b>Adapté</b>.',
                  'Dispense : écris les <b>dates</b> (du… au…), puis <b>OK</b>. Elle s’arrête toute seule à la fin.',
                  'Pratique adaptée : <b>« + Détails »</b> pour noter ce qui est adapté.'],
                guide: [ETAPES_ELEVES.onglet, ETAPES_ELEVES.classe, ETAPES_ELEVES.modifier,
                  etapeZonePage('#vue .case-disp', 'Dans cette colonne, choisis « Dispensé » ou « Adapté » pour l’élève.',
                    'La colonne Dispense n’est pas affichée dans ce carnet (elle apparaît dès qu’un élève est dispensé ou que le code Dispensé est utilisé).'),
                  etapeZonePage('#vue .case-disp .dates-disp, #vue .case-disp .badge-disp, #vue .case-disp .badge-adapte', 'Ici, les dates de la dispense (ou « Détails » pour une pratique adaptée).',
                    'Choisis d’abord « Dispensé » ou « Adapté » pour un élève : les dates apparaîtront.')],
              }] : []),
              {
                id: 'pai', titre: 'PAI ou BEP d’un élève',
                reponse: ['Onglet <b>Élèves</b>, puis <b>« ✎ Modifier la liste »</b>.',
                  'Touche le bouton <b>PAI</b> (ou <b>BEP</b>) sur la ligne de l’élève.',
                  'Active-le, note les <b>informations utiles</b> et, si tu l’as, <b>importe le document</b> (PDF ou Word).',
                  'Touche <b>« Enregistrer »</b> : le bouton devient coloré (📎 s’il y a un document).'],
                guide: [ETAPES_ELEVES.onglet, ETAPES_ELEVES.classe, ETAPES_ELEVES.modifier,
                  etapeBouton('#vue .chip-besoin', 'Touche « PAI » ou « BEP » sur la ligne de l’élève.', () => !!modaleOuverte()),
                  etapeValider(() => modaleOuverte(), 'après avoir noté les informations (et importé le document si tu l’as)')],
              },
              {
                id: 'fiche', titre: 'Fiche d’un élève, délégué',
                reponse: ['Onglet <b>Élèves</b>, en mode <b>« 👀 Consulter »</b> : touche la <b>carte</b> de l’élève.',
                  'Sa <b>fiche bilan</b> s’ouvre : moyenne, compétences, évolution, observations. ◀ ▶ pour passer à l’élève suivant.',
                  'Coche <b>« 👑 L’élève est délégué(e) »</b> : une couronne apparaît sur sa carte.'],
                guide: [ETAPES_ELEVES.onglet, ETAPES_ELEVES.classe, ETAPES_ELEVES.consulter,
                  etapeBouton('#vue [data-carte-eleve]', 'Touche la carte d’un élève.', () => !!fenetreFiche()),
                  etapeZone(fenetreFiche, '[data-fiche-delegue]', 'Coche ici si l’élève est délégué(e).')],
              },
              {
                id: 'chercher', titre: 'Retrouver un élève',
                reponse: ['Écris quelques lettres de son nom dans <b>« 🔍 Rechercher un élève »</b>, en haut à gauche (raccourci : touche <b>/</b>).',
                  'Toutes tes classes sont fouillées : touche le bon nom, l’appli ouvre sa classe et le surligne.'],
                guide: [{ cible: () => premierVisible('#recherche-eleve', '#btn-menu'), texte: el => el?.id === 'btn-menu' ? 'Touche ☰ pour faire apparaître la recherche.' : 'Écris quelques lettres du nom ici, puis touche le bon élève.',
                  fait: () => !!document.querySelector('.surbrillance') }],
              },
              {
                id: 'supprimer', titre: 'Supprimer un élève (départ)',
                reponse: ['Onglet <b>Élèves</b>, puis <b>« ✎ Modifier la liste »</b>.',
                  'Touche <b>🗑</b> au bout de la ligne de l’élève et confirme.',
                  'Ses notes partent avec lui. Une erreur ? La flèche <b>↶</b> en haut revient en arrière.'],
                guide: [ETAPES_ELEVES.onglet, ETAPES_ELEVES.classe, ETAPES_ELEVES.modifier,
                  etapeZonePage('#vue [data-supprimer-eleve]', 'Le 🗑 au bout de la ligne supprime l’élève (une confirmation est demandée).')],
              },
            ],
          },
          {
            id: 'fiches', icone: '📋', titre: 'Les fiches bilan',
            enfants: [
              {
                id: 'ouvrir', titre: 'Ouvrir la fiche bilan d’un élève',
                intro: 'Tout ce que le carnet sait d’un élève, sur une seule page : de quoi préparer un bulletin, un conseil ou une rencontre avec les parents.',
                reponse: ['Onglet <b>Notes</b> : touche le <b>nom de l’élève</b> (ou, onglet <b>Élèves</b> en « 👀 Consulter », touche sa <b>carte</b>).',
                  'En haut, choisis la <b>période</b> : toute l’année, T1, T2…',
                  '<b>◀ Précédent / Suivant ▶</b> pour passer d’un élève à l’autre sans refermer.',
                  'Tout ce que tu y changes (appréciation, délégué, observations) est enregistré aussitôt.'],
                guide: [ETAPES_HUGO.ongletNotes, ETAPES_HUGO.classe,
                  etapeBouton('#vue [data-nom-eleve]', 'Touche le nom d’un élève : sa fiche bilan s’ouvre.', () => !!fenetreFiche()),
                  etapeZone(fenetreFiche, '[data-fiche-onglets]', 'Choisis la période : toute l’année, T1, T2…'),
                  etapeZone(fenetreFiche, '[data-fiche-nav="1"]', '« Suivant ▶ » passe à l’élève suivant, sans refermer.')],
              },
              {
                id: 'contenu', titre: 'Ce qu’on trouve dans la fiche bilan', puces: true,
                reponse: ['<b>La synthèse</b> : une toile qui compare l’élève à la <b>moyenne de la classe</b>, ses valeurs, et ce qui est à signaler (absences, retards, oublis, santé).',
                  '<b>L’appréciation</b> : la même que dans « ✍ Appréciations » ; touche une rubrique pour changer son niveau, le texte suit des deux côtés.',
                  '<b>🧭 Points d’appui et axes de progression</b> : ce que l’élève sait faire, et deux priorités au plus.',
                  '<b>📈 Évolution</b> : la courbe de ses notes face à la classe, avec la tendance (en progrès, stable, en baisse).',
                  '<b>🎯 Compétences</b> et <b>📝 Notes</b> : le détail, évaluation par évaluation.',
                  '<b>🩺 Présence et santé</b> : ce qui vient de tes séances (absences, blessures, dispenses).',
                  '<b>✏️ Mes observations</b> : tes notes personnelles sur l’élève, rangées par date.',
                  'Les parties se déplient en touchant leur titre.'],
                guide: [ETAPES_HUGO.ongletNotes, ETAPES_HUGO.classe,
                  etapeBouton('#vue [data-nom-eleve]', 'Touche le nom d’un élève : sa fiche bilan s’ouvre.', () => !!fenetreFiche()),
                  etapeZone(fenetreFiche, '.synthese-fiche', 'La synthèse : l’élève comparé à la moyenne de la classe, et ce qui est à signaler.'),
                  etapeZone(fenetreFiche, '.depli-fiche > summary', 'Touche un titre pour déplier la partie : points d’appui, évolution, compétences, notes…')],
              },
              {
                id: 'pdf', titre: 'Imprimer la fiche (PDF), même anonyme',
                reponse: ['Ouvre la fiche bilan de l’élève et choisis la <b>période</b>.',
                  'Coche <b>« anonyme »</b> si la fiche doit sortir sans nom, prénom, photo ni présence / santé.',
                  'Touche <b>« 📄 PDF »</b> : la fiche s’imprime toute dépliée ; choisis « Enregistrer au format PDF » pour en faire un fichier.',
                  'Prof principal ? Les <b>fiches bilan du conseil</b> (toute la classe, un PDF) sont dans l’onglet Prof principal.'],
                guide: [ETAPES_HUGO.ongletNotes, ETAPES_HUGO.classe,
                  etapeBouton('#vue [data-nom-eleve]', 'Touche le nom d’un élève : sa fiche bilan s’ouvre.', () => !!fenetreFiche()),
                  etapeZone(fenetreFiche, '[data-fiche-anonyme]', 'Coche « anonyme » pour une fiche sans nom, photo ni santé.'),
                  etapeZone(fenetreFiche, '[data-fiche-pdf]', '« 📄 PDF » : imprime la fiche, ou enregistre-la en PDF.')],
              },
              {
                id: 'lecons', titre: `La fiche des ${lecons} d’un élève`,
                reponse: [`Depuis la fiche bilan, touche <b>« Fiche ${Lecons} »</b> : le bouton apparaît dès que la classe a des ${lecons}.`,
                  `Elle montre les ${lecons} <b>une par une</b> : présence, ce qui a été relevé, ce qui est en progrès ou en baisse, ce qui est à retenir.`,
                  'Tu y écris aussi ton <b>suivi</b> de l’élève.'],
                guide: [ETAPES_HUGO.ongletNotes, ETAPES_HUGO.classe,
                  etapeBouton('#vue [data-nom-eleve]', 'Touche le nom d’un élève : sa fiche bilan s’ouvre.', () => !!fenetreFiche()),
                  { ...etapeZone(fenetreFiche, '[data-fiche-lecons]', `Ce bouton ouvre sa fiche des ${lecons}.`),
                    sinon: `Cette classe n’a pas encore de ${lecon} : la fiche apparaîtra avec la première.` }],
              },
            ],
          },
        ],
      },
      {
        // (EPS : séquence = APSA + champ d'apprentissage, couleurs CA1-CA5, cross / UNSS ; SVT : thème, une couleur, sorties / labo)
        id: 'agenda', icone: '📅', titre: 'L’agenda',
        enfants: [
          {
            id: 'vues', titre: 'Frise, mois, semaine : les trois vues',
            reponse: ['Touche l’onglet <b>Agenda</b>.',
              '<b>Frise de l’année</b> : une ligne par classe, les séquences de toute l’année d’un coup d’œil.',
              '<b>Mois</b> : le calendrier, avec chaque cours de la séquence en cours (si l’emploi du temps est saisi).',
              '<b>Semaine</b> : ton emploi du temps en grille, pour une semaine précise (paire / impaire, vacances, conseils…).',
              'La liste <b>« Toutes les classes »</b> n’en montre qu’une ; les pastilles <b>« Afficher »</b> cachent ou montrent séquences, vacances, conseils, événements, évaluations, fins de période.'],
            guide: [ETAPES_AGENDA.onglet, ETAPES_AGENDA.pret,
              etapeZonePage('#vue .barre-agenda .groupe-boutons', 'Les trois vues : la frise de l’année, le mois, la semaine.'),
              etapeZonePage('#vue [data-ag-classe]', 'Ici, tu n’affiches qu’une classe (ou toutes).'),
              etapeZonePage('#vue .afficher-agenda', 'Touche une pastille pour montrer ou cacher ce type d’élément.')],
          },
          {
            id: 'demarrer', titre: 'Bien démarrer l’année (dans l’ordre)',
            reponse: ['<b>🕒 Emploi du temps</b> : importe le PDF d’École Directe ou de Pronote, ou saisis tes cours. C’est lui qui compte les ' + lecons + ' de chaque séquence.',
              '<b>⚙ Année et vacances</b> : les dates de l’année et des vacances (à saisir une fois par an).',
              '<b>+ Conseils de classe</b> : toutes les dates d’un coup, après la réunion de rentrée.',
              `<b>+ Séquence</b> : ${eps ? 'tes APSA' : 'tes thèmes'}, classe par classe. La suivante se place toute seule après la précédente.`],
            guide: [ETAPES_AGENDA.onglet, ETAPES_AGENDA.pret,
              etapeZonePage('#vue [data-ag="edt"]', '1. L’emploi du temps de tes classes.'),
              etapeZonePage('#vue [data-ag="reglages"]', '2. Les dates de l’année et des vacances.'),
              etapeZonePage('#vue [data-ag="nouveau-conseil"]', '3. Les conseils de classe.'),
              etapeZonePage('#vue [data-ag="nouvelle-sequence"]', '4. Tes séquences.')],
          },
          {
            id: 'edt', titre: 'L’emploi du temps (import ou saisie)',
            reponse: ['Onglet Agenda, bouton <b>« 🕒 Emploi du temps »</b>.',
              'Le plus simple : <b>« Choisir le PDF… »</b> avec l’emploi du temps d’École Directe ou de Pronote (une semaine normale, sans vacances).',
              `L’appli te montre les cours trouvés : vérifie la classe de chacun, <b>décoche</b> ce qui n’est pas un cours ${eps ? 'd’EPS' : 'de SVT'} de tes classes, puis valide.`,
              'Ou, pour chaque classe, <b>« + Créneau »</b> : jour, début, fin, lieu.',
              'Un cours <b>une semaine sur deux</b> : choisis « semaine paire » ou « impaire » (ou A / B, à régler dans ⚙ Année et vacances).'],
            guide: [ETAPES_AGENDA.onglet, ETAPES_AGENDA.pret,
              etapeBouton('#vue [data-ag="edt"]', 'Touche « 🕒 Emploi du temps ».', () => !!fenetreEdt()),
              etapeZone(fenetreEdt, '.bloc-excel', 'Pour importer le PDF d’École Directe ou de Pronote : « Choisir le PDF… ».'),
              etapeZone(fenetreEdt, '.edt-classe', 'Ou saisis les cours de chaque classe : « + Créneau ».'),
              etapeValider(fenetreEdt, 'pour garder l’emploi du temps')],
          },
          {
            id: 'annee', titre: 'Année, vacances, semaines A / B, types d’événements',
            reponse: ['Onglet Agenda, bouton <b>« ⚙ Année et vacances »</b>.',
              '<b>Année scolaire</b> : premier et dernier jour.',
              '<b>Vacances</b> : premier et dernier jour sans cours ; un jour férié = la même date deux fois. L’appli n’a pas internet : ces dates se saisissent une fois par an.',
              '<b>Semaines alternées</b> : paires / impaires, ou A / B.',
              `<b>Types d’événements</b> : nom et couleur (au départ : ${(profil().typesEvenements || TYPES_EVENEMENTS_DEFAUT).map(t => t.nom).join(', ')}).`],
            guide: [ETAPES_AGENDA.onglet, ETAPES_AGENDA.pret,
              etapeBouton('#vue [data-ag="reglages"]', 'Touche « ⚙ Année et vacances ».', () => !!fenetreAnnee()),
              etapeZone(fenetreAnnee, '[data-lignes="vac"]', 'Une ligne par période de vacances : premier et dernier jour sans cours.'),
              etapeZone(fenetreAnnee, '[name="semaines"]', 'Le nom des semaines alternées : paires / impaires, ou A / B.'),
              etapeZone(fenetreAnnee, '[data-lignes="type"]', 'Tes types d’événements : nom et couleur.'),
              etapeValider(fenetreAnnee)],
          },
          {
            id: 'sequence', titre: 'Créer une séquence',
            intro: eps ? 'Une séquence = une APSA pour une classe, entre deux dates.' : 'Une séquence = un thème pour une classe, entre deux dates.',
            reponse: ['Touche <b>« + Séquence »</b> (ou touche la ligne d’une classe dans la frise, à la bonne date).',
              'Coche la ou les <b>classes</b> : une séquence est créée pour chacune.',
              eps ? 'Écris l’<b>APSA</b> : le <b>champ d’apprentissage</b> (CA1 à CA5) se met tout seul, il donne la couleur de la séquence.'
                : 'Écris le <b>thème</b> (ex. Génétique).',
              `Le début est proposé <b>juste après la séquence précédente</b>. Pour la fin : une date, ou un nombre de <b>${lecons}</b> (la fin se calcule d’après l’emploi du temps, vacances sautées).`,
              `${eps ? 'Deux APSA en parallèle' : 'Deux thèmes en parallèle'} ? Coche seulement les <b>cours</b> de celle-ci (si la classe a plusieurs cours par semaine).`,
              'Ajoute si tu veux les objectifs, l’évaluation prévue et des notes, puis <b>« Enregistrer »</b>.'],
            guide: [ETAPES_AGENDA.onglet, ETAPES_AGENDA.pret,
              etapeBouton('#vue [data-ag="nouvelle-sequence"]', 'Touche « + Séquence ».', () => !!fenetreSequence()),
              etapeZone(fenetreSequence, '[name="apsa"]', eps ? 'L’APSA : le champ d’apprentissage se met tout seul.' : 'Le thème de la séquence.'),
              etapeZone(fenetreSequence, '[name="nb"]', `Tape un nombre de ${lecons} : la date de fin se calcule d’après l’emploi du temps.`),
              etapeZone(fenetreSequence, '[data-ag-prevues]', `Ici : le nombre de ${lecons} prévues (vacances déduites).`),
              etapeValider(fenetreSequence, 'pour créer la séquence')],
          },
          {
            id: 'avancement', titre: 'Où en est une séquence ?', puces: true,
            reponse: ['Sur la frise, chaque séquence indique où elle en est : <b>à venir</b>, en cours (ex. <b>3/12</b> : 3e ' + lecon + ' sur 12), ou <b>✔ terminée</b>.',
              'Le compte suit la <b>date du jour</b> et l’emploi du temps (vacances déduites), pas ce que tu as rempli dans l’onglet ' + Lecons + '.',
              'Sans emploi du temps, l’appli ne peut pas compter les ' + lecons + ' : elle dit seulement à venir / en cours / terminée.',
              'Deux séquences en même temps pour une classe : elles se mettent l’une sous l’autre sur la frise.',
              ...(eps ? ['La couleur d’une séquence est celle de son <b>champ d’apprentissage</b> (légende sous la frise).'] : ['Toutes les séquences ont la même couleur (il n’y a pas de champ d’apprentissage en SVT).'])],
          },
          {
            id: 'modifier', titre: 'Modifier, copier ou supprimer une séquence',
            reponse: ['Touche la séquence (dans la frise, le mois ou la semaine) : sa fenêtre s’ouvre.',
              'Change ce que tu veux, puis <b>« Enregistrer »</b>.',
              '<b>« Copier cette séquence pour d’autres classes »</b> (en bas) : la même séquence, d’un coup, pour d’autres classes.',
              'Pour l’effacer : bouton rouge <b>« Supprimer »</b>.'],
            guide: [ETAPES_AGENDA.onglet, ETAPES_AGENDA.pret,
              etapeBouton('#vue .ag-seq[data-ag-edit]', 'Touche une séquence.', () => !!fenetreSequence(), 'Pas encore de séquence : crée-en une avec « + Séquence ».'),
              etapeZone(fenetreSequence, '.copier-ag summary', 'Ici, tu la copies pour d’autres classes.'),
              etapeZone(fenetreSequence, '.modale-actions button.danger', 'Et là, tu la supprimes.'),
              etapeValider(fenetreSequence)],
          },
          {
            id: 'conseils', titre: 'Les conseils de classe',
            reponse: ['Touche <b>« + Conseils de classe »</b> : une ligne par classe.',
              'Remplis la <b>date</b> (et l’heure) des classes que tu connais ; les autres lignes sont ignorées.',
              'Touche <b>« Ajouter »</b> : ils apparaissent dans la frise, le mois et la semaine.',
              'Pour en changer un : touche-le dans l’agenda.'],
            guide: [ETAPES_AGENDA.onglet, ETAPES_AGENDA.pret,
              etapeBouton('#vue [data-ag="nouveau-conseil"]', 'Touche « + Conseils de classe ».', () => !!fenetreConseils()),
              etapeZone(fenetreConseils, '.tableau-conseils', 'Date et heure de chaque conseil que tu connais ; les lignes vides sont ignorées.'),
              etapeValider(fenetreConseils, 'pour les ajouter')],
          },
          {
            id: 'evenement', titre: eps ? 'Un événement (cross, UNSS, sortie…)' : 'Un événement (sortie de terrain, labo, projet…)',
            reponse: ['Touche <b>« + Événement »</b> (ou, dans la vue Mois, le <b>numéro du jour</b>).',
              `Donne un <b>titre</b> (ex. ${esc(mot('evenementExemple').split(',')[0])}), un <b>type</b> et pour qui : <b>tout le collège</b> ou une classe.`,
              'La date (ou du… au…), l’heure si besoin, des notes.',
              'Touche <b>« Enregistrer »</b>. Les types et leurs couleurs se règlent dans <b>⚙ Année et vacances</b>.'],
            guide: [ETAPES_AGENDA.onglet, ETAPES_AGENDA.pret,
              etapeBouton('#vue [data-ag="nouvel-evenement"]', 'Touche « + Événement ».', () => !!fenetreEvenement()),
              etapeZone(fenetreEvenement, '[name="typeEv"]', 'Le type de l’événement (il donne sa couleur).'),
              etapeValider(fenetreEvenement, 'pour l’ajouter à l’agenda')],
          },
          {
            id: 'nuances', titre: 'À savoir : ce que fait l’agenda… et ce qu’il ne fait pas', puces: true,
            reponse: ['Les <b>évaluations</b> de l’onglet Notes (✎) et les <b>fins de période</b> s’affichent toutes seules : rien à saisir.',
              'L’agenda n’est <b>pas relié</b> à École Directe, Pronote ni à l’agenda de ton téléphone : rien n’est envoyé, rien n’arrive tout seul.',
              'Le PDF de l’emploi du temps est lu par l’appli : <b>vérifie</b> toujours les cours trouvés (une mise en page inhabituelle peut la tromper).',
              'Semaine paire / impaire = le <b>numéro de la semaine</b> dans le calendrier (comme dans les agendas).',
              'Tout l’agenda est dans ton carnet : il suit sur la clé et la tablette après <b>Enregistrer</b> / <b>Récupérer</b>. Mets l’appli à jour sur tous tes appareils.'],
          },
        ],
      },
      {
        // (EPS : « Leçons », APSA, médailles, savoir-nager, outils de terrain ; SVT : « Séances », thème, TP, outils de SVT)
        id: 'lecons', icone: eps ? '🏃' : '🔬', titre: `Les ${lecons}`,
        enfants: [
          {
            id: 'principe', titre: `À quoi servent les ${lecons} ?`, puces: true,
            intro: eps ? 'Le carnet de bord de tes séances : ce que chaque élève a fait, leçon après leçon.'
              : 'Le carnet de bord de tes séances (TP, activités, sorties) : ce que chaque élève a fait, séance après séance.',
            reponse: ['Une <b>séance</b> = une colonne de la grille (ou plusieurs : une par donnée relevée). Une ligne par élève.',
              eps ? 'Tu y notes la présence, les performances (temps, distances…), les degrés de maîtrise, les médailles, des observations.'
                : 'Tu y notes la présence, la démarche, la manipulation, la communication, la sécurité, le travail rendu, des observations.',
              '<b>Rien ici ne compte dans les moyennes</b> : les notes se mettent dans l’onglet Notes.',
              `Mais tout sert ailleurs : fiche de l’élève, fiche bilan des Notes (présence, santé), appréciations proposées${eps ? ', équipes des Outils' : ', binômes des Outils'}.`],
          },
          {
            id: 'creer', titre: 'Créer une séance',
            reponse: [`Touche l’onglet <b>${Lecons}</b> en haut (choisis ta classe à gauche).`,
              'Touche <b>« + Séance »</b>.',
              eps ? 'Écris l’<b>APSA</b> (ex. Demi-fond) : les <b>données à relever</b> se remplissent toutes seules selon l’activité.'
                : 'Écris le <b>thème</b> (ex. Génétique) : les <b>données à relever</b> d’une séance de SVT sont déjà proposées (démarche, manipulation, communication, sécurité, travail rendu…).',
              'Vérifie le <b>nom de la séance</b> et la <b>date</b>. Garde le <b>même nom</b> d’une séance à l’autre pour suivre les progrès.',
              'Touche <b>« Créer »</b> : la séance apparaît dans la grille.',
              ...(eps ? [] : ['Une séance déjà préparée ? Outils › <b>🧾 Préparation des TP</b> › <b>Banque de séances</b> › « Utiliser » la crée dans la classe.'])],
            guide: [ETAPES_LECONS.onglet, ETAPES_LECONS.classe, ETAPES_LECONS.nouvelle,
              zoneSeance('[name="apsa"]', eps ? 'Écris l’APSA : les données à relever se remplissent selon elle.' : 'Écris le thème de la séance (ex. Génétique).'),
              zoneSeance('[name="titre"]', 'Le nom de la séance : garde le même d’une fois sur l’autre pour suivre les progrès.'),
              zoneSeance('.liste-indic', 'Les données relevées : tu peux les changer, en ajouter ou en retirer.'),
              etapeValider(fenetreSeance, 'pour créer la séance')],
          },
          {
            id: 'donnees', titre: 'Choisir les données à relever',
            intro: 'Chaque donnée devient une colonne de la séance.',
            reponse: ['Touche le <b>titre de la séance</b> (en haut de sa colonne) ; pour une nouvelle : « + Séance ».',
              `Dans <b>« Données relevées »</b>, une ligne = un <b>nom</b> et un <b>type</b> : ${eps ? 'Temps, Distance, Nombre, Échelle 1 à 4, Médailles, ' : 'Échelle 1 à 4 (degrés), Nombre, '}Choix (options séparées par « / »), Texte.`,
              '<b>« + Ajouter une donnée »</b> en ajoute une ; <b>✕</b> la retire.',
              `<b>« ${esc(mot('modeleActivite'))} »</b> remet les données proposées ${eps ? 'pour l’activité' : 'pour une séance de SVT'}.`,
              ...(eps ? ['Savoir-nager : écris l’activité <b>« Savoir nager »</b>, puis coche les étapes de l’ASNS : une colonne par étape.'] : []),
              'Touche <b>« Enregistrer »</b>.'],
            guide: [ETAPES_LECONS.onglet, ETAPES_LECONS.classe, ETAPES_LECONS.ouvrir,
              zoneSeance('.liste-indic', `Une ligne = un nom et un type (${eps ? 'temps, distance, échelle 1 à 4, médailles' : 'échelle 1 à 4, nombre'}, choix, texte…). ✕ la retire.`),
              zoneSeance('[data-ajout-indic]', '« + Ajouter une donnée » ajoute une colonne à la séance.'),
              zoneSeance('[data-modele-indic]', `Ici, tu remets les données proposées ${eps ? 'pour l’activité' : 'pour une séance de SVT'}.`),
              ETAPES_LECONS.valider],
          },
          {
            id: 'saisir', titre: 'Remplir la grille pendant le cours',
            reponse: ['Touche la <b>case</b> de l’élève sous la donnée.',
              `Tape la valeur puis <b>Entrée</b> : tu passes à l’élève suivant.${eps ? ' Temps : <b>3:45</b> ou <b>12,5</b> ; distance : <b>4,25</b>.' : ''}`,
              `<b>Échelle 1 à 4</b>${eps ? ' et <b>médailles</b>' : ''} : touche la case pour faire défiler (ou tape 1, 2, 3…). <b>Choix</b> : une petite liste.`,
              'Tout s’enregistre dans le carnet dès que tu quittes la case.',
              'En bas, les lignes <b>Répartition</b> et <b>Classe</b> résument la séance.'],
            guide: [ETAPES_LECONS.onglet, ETAPES_LECONS.classe,
              { cible: () => premierVisible('#vue .grille-ent input.cellule', '#vue .grille-ent [data-niveau-ent]', '#vue .grille-ent select.cellule-choix'),
                texte: 'Touche cette case et tape une valeur, puis Entrée.', defiler: true,
                sinon: 'Pas encore de séance dans cette classe : crée-en une avec « + Séance ».',
                fait: () => document.activeElement?.matches?.('#vue .grille-ent .cellule, #vue .grille-ent [data-niveau-ent], #vue .grille-ent select') },
              { cible: () => premierVisible('#saisie'), texte: 'Absent… ? Touche un de ces boutons (ou tape la lettre). Entrée = élève suivant.', suivant: true }],
          },
          {
            id: 'absents', titre: eps ? 'Absent, dispensé, blessé, oubli de tenue' : 'Absent, malade, non rendu, oubli de matériel', puces: true,
            reponse: [`Dans une case, tape la <b>lettre</b> : ${codesSeance} (ou les boutons en bas de l’écran).`,
              'L’élève n’a encore rien dans la séance : <b>toute la séance</b> est marquée.',
              'Il a déjà des résultats : <b>seulement cette case</b> est marquée (contour en pointillés), le reste est gardé.',
              'Pour enlever le code : tape une valeur à la place, ou vide la case.',
              ...(codeDeLaDiscipline('DISP') ? ['Un élève dispensé ce jour-là : « disp. » est proposé en gris dans sa case.'] : []),
              `Ces codes servent aux alertes (absences, ${oubliTenue(2)}), à la fiche bilan et aux appréciations.`,
              ...(eps ? [] : ['D’autres codes (dispensé, blessé…) ? Ils se réactivent dans <b>⚙ Réglages du carnet</b> › <b>Notes</b>.'])],
            guide: [ETAPES_LECONS.onglet, ETAPES_LECONS.classe,
              { cible: () => premierVisible('#vue .grille-ent input.cellule'), texte: `Touche une case, puis tape la lettre : ${lettresCodes(true)} ou T.`, defiler: true,
                sinon: 'Pas encore de séance dans cette classe : crée-en une avec « + Séance ».',
                fait: () => document.activeElement?.matches?.('#vue .grille-ent input.cellule') },
              { cible: () => premierVisible('#saisie'), texte: 'Ou touche un de ces boutons : toute la séance si l’élève n’a encore rien, sinon cette case seulement.', suivant: true }],
          },
          {
            id: 'appel', titre: 'Faire l’appel',
            reponse: ['Touche l’onglet <b>Appel</b> (à côté d’Élèves ; sur tablette, dans le groupe « Classe »).',
              `Pour chaque élève, touche <b>Présent</b>, <b>Absent</b>, <b>Retard</b>, <b>O${oubliTenue().slice(1)}</b>, <b>Malade</b>… (retoucher le même bouton l’enlève).`,
              '<b>« ✅ Tous les autres présents »</b> pointe d’un coup ceux qui restent.',
              `L’appel est rangé dans la <b>${lecon} du jour</b> (créée toute seule si besoin, « ${mot('lecon')[0].toUpperCase() + mot('lecon').slice(1)} du 14 oct. ») : tu la complètes ensuite dans l’onglet ${Lecons}.`,
              `Les outils du jour (${eps ? 'équipes, tirage' : 'binômes, tirage'}…) laissent de côté les absents.`],
            guide: [etapeOnglet('appel', 'Appel', 'classe'),
              { ...ETAPES_HUGO.classe, fait: () => !!document.querySelector('#vue [data-appel], #vue [data-action="vue-eleves"]') },
              etapeZonePage('#vue .bouton-appel', 'Touche l’état de l’élève : présent, absent, retard…'),
              etapeZonePage('#vue [data-appel="tous"]', 'Tous les élèves pas encore pointés deviennent présents.')],
          },
          {
            id: 'progres', titre: eps ? 'Suivre les progrès d’un exercice' : 'Suivre l’évolution d’une séance à l’autre',
            reponse: [`Donne le <b>même nom</b> aux séances qui se suivent (ex. « ${eps ? '3 × 500 m' : 'TP microscope'} »).`,
              `En haut de l’onglet ${Lecons}, choisis-le dans la liste <b>« ${esc(mot('exercice'))} »</b>.`,
              eps ? 'Seules ses séances restent affichées, avec deux colonnes en plus : la <b>meilleure</b> performance et l’<b>évolution</b> (de la 1re à la dernière).'
                : 'Seules ces séances restent affichées : tu vois d’un coup d’œil l’<b>évolution</b> de chaque élève (degrés, travail rendu…).',
              'Astuce : ce nom choisi, <b>« + Séance »</b> reprend la dernière séance (mêmes données, mêmes documents) : il suffit de changer la date.'],
            guide: [ETAPES_LECONS.onglet, ETAPES_LECONS.classe,
              etapeZonePage('#vue [data-filtre-exercice]', mot('aideExercice'), 'Pas encore de séance dans cette classe : crée-en une avec « + Séance ».')],
          },
          {
            id: 'fiche', titre: `La fiche d’un élève (bilan de ses ${lecons})`,
            reponse: [`Dans l’onglet ${Lecons}, touche le <b>nom de l’élève</b>.`,
              `Sa fiche s’ouvre, ${eps ? 'activité par activité' : 'thème par thème'} (boutons en haut) : présence et retards, ce qui progresse ou baisse.`,
              `<b>« À retenir »</b> : ce qui est à travailler ⚠ et ses points forts ⭐ (degré 4${eps ? ', record battu' : ''}).`,
              'Puis le tableau <b>séance par séance</b>, ce qui a été noté pendant les séances, et <b>« ✍ Mon suivi »</b> pour tes observations.',
              '◀ ▶ en bas : élève précédent ou suivant.'],
            guide: [ETAPES_LECONS.onglet, ETAPES_LECONS.classe,
              etapeBouton('#vue .grille-ent tbody tr:not(.ligne-repartition) .col-nom', 'Touche le nom d’un élève.', () => !!fenetreFicheLecons(),
                'Pas encore de séance dans cette classe : crée-en une avec « + Séance ».'),
              etapeZone(fenetreFicheLecons, '[data-fiche-onglets]', `Une fiche par ${activite} : touche celle que tu veux voir.`)],
          },
          {
            id: 'modifier', titre: 'Modifier une séance : couleur, documents, supprimer',
            reponse: ['Touche le <b>titre de la séance</b>, en haut de sa colonne.',
              `<b>Couleur</b> : « Auto » = la couleur ${eps ? 'de l’activité' : 'du thème'} ; coche « Aussi pour toutes les ${lecons} de cette activité » pour les changer toutes.`,
              `<b>📎 Joindre un document</b> (${eps ? 'barème, fiche, photo' : 'protocole, fiche TP, photo'} ; 5 Mo au plus) : il suit sur la clé et la tablette, et les séances suivantes du même nom le reprennent.`,
              'Pour l’effacer : bouton rouge <b>« Supprimer »</b> (avec toutes ses données ; une erreur ? <b>↶</b> en haut).',
              'Sinon, touche <b>« Enregistrer »</b>.'],
            guide: [ETAPES_LECONS.onglet, ETAPES_LECONS.classe, ETAPES_LECONS.ouvrir,
              zoneSeance('.choix-couleur-act', `La couleur de la séance (« Auto » = celle ${eps ? 'de l’activité' : 'du thème'}).`),
              zoneSeance('[data-liste-docs]', 'Les documents joints : « 📎 Joindre un document » juste en dessous.'),
              zoneSeance('.modale-actions button.danger', 'Pour effacer la séance et ses données : « Supprimer ».'),
              ETAPES_LECONS.valider],
          },
          ...(eps ? [] : [{
            id: 'tp', titre: 'Préparer un TP (matériel, commande au labo)', puces: true,
            reponse: ['Onglet <b>Outils</b> › <b>🧾 Préparation des TP</b>.',
              '<b>Fiches TP</b> : pour chaque séance, le matériel et les produits (par binôme, par élève, par groupe…), les dangers et un mot pour le technicien. « + Séance de TP » crée la séance.',
              '<b>Commande au labo</b> : toutes tes classes sur une période ; l’appli calcule les quantités d’après les effectifs. « 🖨 Imprimer pour le labo ».',
              '<b>Banque de séances</b> : tes séances réutilisables d’une année sur l’autre ; « Utiliser » la crée dans la classe. Elle s’échange avec un collègue par fichier (aucune donnée d’élève).'],
          }]),
          {
            id: 'outils', titre: `Envoyer le résultat d’un outil dans une ${lecon}`, puces: true,
            reponse: [`Dans l’onglet <b>Outils</b>, plusieurs outils (${eps ? 'tours, essais, équipes, tirage, tournoi, chrono de natation…' : 'ECE, schéma, gestes techniques, binômes…'}) ont un bouton <b>« 📤 Vers une ${lecon} »</b>.`,
              'Il crée une <b>nouvelle séance</b> déjà remplie, ou ajoute des colonnes à une séance existante, au choix.',
              'Les élèves absents de l’outil deviennent <b>ABS</b> dans la séance.',
              `Pas en mode élève : seul le professeur peut envoyer vers une ${lecon}.`],
          },
          {
            id: 'excel', titre: `Exporter ou importer les ${lecons} (Excel)`, puces: true,
            reponse: [`Onglet ${Lecons}, bouton <b>« ⇅ Excel »</b>.`,
              '<b>Exporter</b> : un classeur avec un onglet par séance (sans les documents joints), à garder ou à donner à un collègue.',
              '⚠ Le classeur n’est <b>pas chiffré</b> : coche <b>« Anonyme »</b> pour partager sans noms ni santé ni observations (il ne se réimporte pas).',
              '<b>Importer</b> : un classeur exporté par le carnet (complété dans Excel, ou celui d’un collègue). Tu vois ce qui sera repris avant de valider.'],
            guide: [ETAPES_LECONS.onglet, ETAPES_LECONS.classe,
              etapeBouton('#vue [data-action="excel-ent"]', 'Touche « ⇅ Excel ».', () => !!fenetreExcelLecons()),
              etapeZone(fenetreExcelLecons, '[name="anonyme"]', 'Coche « Anonyme » pour partager sans les noms.')],
          },
        ],
      },
      {
        // (la liste vient d'OUTILS filtrée par outilDeLaDiscipline : EPS = temps, groupes, matchs, mesures, APSA ;
        // SVT = chrono, ateliers, équipes, tirage + outils de SVT)
        id: 'outils', icone: '🧰', titre: 'Les outils',
        enfants: [
          {
            id: 'liste', titre: eps ? 'Quels outils pour l’EPS ?' : 'Quels outils pour la SVT ?', puces: true,
            intro: 'Les outils proposés dépendent de la discipline du carnet (⚙ Réglages › Discipline).',
            reponse: FAMILLES_OUTILS.map(f => [f, outilsDuCarnet().filter(o => o.famille === f.id)]).filter(([, l]) => l.length)
              .map(([f, l]) => `<b>${esc(f.nom)}</b> : ${l.map(o => `${o.icone} ${esc(o.nom)} <small>(${esc(o.info)})</small>`).join(' · ')}`),
            guide: [ETAPES_OUTILS.onglet, ETAPES_OUTILS.accueil,
              etapeZonePage('#vue .familles-outils', 'Les outils, rangés par famille : touche une bulle pour ouvrir l’outil.')],
          },
          {
            id: 'ouvrir', titre: 'Ouvrir et utiliser un outil',
            reponse: ['Choisis ta <b>classe</b> à gauche, puis touche l’onglet <b>Outils</b>.',
              'Touche la <b>bulle</b> d’un outil : il s’ouvre pour cette classe.',
              '<b>⛶ Plein écran</b> : lisible de loin (au tableau, au vidéoprojecteur' + (eps ? ', au gymnase' : '') + ').',
              '<b>← Outils</b> revient à la liste ; un outil lancé continue de tourner (un point sur sa bulle) même si tu changes d’onglet.',
              '<b>🗑 Tout effacer</b> remet l’outil à zéro pour cette classe.'],
            guide: [ETAPES_OUTILS.onglet, ETAPES_OUTILS.accueil, ETAPES_OUTILS.ouvrir('chrono', '⏱ Chrono'),
              etapeZonePage('#vue [data-o="plein-ecran"]', '« ⛶ Plein écran » : lisible de loin.'),
              etapeZonePage('#vue [data-o="accueil"]', '« ← Outils » : retour à la liste (le chrono continue de tourner).')],
          },
          {
            id: 'presents', titre: 'Les présents du jour (absents laissés de côté)',
            reponse: ['Dans les outils d’une classe (équipes, tirage…), le bandeau <b>« 👤 Présents »</b> dit combien d’élèves sont là.',
              `Au premier usage de la journée, l’appli enlève déjà les élèves notés <b>absents${codeDeLaDiscipline('DISP') ? ', dispensés' : ''}</b> ou <b>malades</b> dans la ${lecon} du jour (l’appel, par exemple)${codeDeLaDiscipline('DISP') ? ' et les dispenses en cours' : ''}.`,
              'Touche le bandeau, puis un nom, pour le cocher absent ou présent.',
              'Les outils s’en servent : pas d’absent dans une équipe ni au tirage au sort.'],
            guide: [ETAPES_OUTILS.onglet, ETAPES_OUTILS.accueil, ETAPES_OUTILS.ouvrir('equipes', '👥 Équipes'),
              etapeZonePage('#vue [data-o-presents] > summary', 'Touche ici, puis un nom pour le cocher absent ou présent.')],
          },
          ...(eps ? [
            {
              id: 'equipes', titre: 'Faire des équipes équilibrées', puces: true,
              reponse: ['Outil <b>👥 Équipes</b> : choisis le nombre d’équipes (ou d’élèves par équipe).',
                '<b>Mixité</b> : mixtes, non mixtes ou indifférent. <b>Répartition</b> : au hasard, hétérogènes (équilibrées) ou homogènes (par niveau).',
                'Le <b>niveau</b> est pris dans ton carnet : moyenne, note d’une évaluation, degrés d’une compétence.',
                '<b>Élèves à séparer</b> : ils ne seront jamais ensemble. <b>↶ Équipes précédentes</b> si tu préférais les autres.'],
            },
            {
              id: 'temps', titre: 'Chrono, tours, intervalles, ateliers', puces: true,
              reponse: ['<b>⏱ Chrono</b> : un ou plusieurs chronos, temps intermédiaires.',
                '<b>🏃 Tours par élève</b> : un toucher sur l’élève à chaque passage (demi-fond, course en durée).',
                '<b>⏲ Intervalles</b> : effort / récupération (Tabata, circuit) avec des bips.',
                '<b>🔄 Ateliers</b> : les groupes changent d’atelier au signal.',
                'Les bips sont fabriqués par l’appareil : monte le son (sur iPad, touche d’abord l’écran une fois).'],
            },
            {
              id: 'matchs', titre: 'Marque, tournoi, tableau blanc', puces: true,
              reponse: ['<b>🏸 Marque</b> : le score et le temps de jeu en grand.',
                '<b>🏆 Tournoi</b> : poule ou montante-descendante, plusieurs terrains.',
                '<b>🧑‍🏫 Tableau blanc</b> : un terrain dessiné, des flèches, et les têtes des élèves (photos du trombinoscope) à placer.'],
            },
            {
              id: 'mesures', titre: 'Essais, VMA, vidéo-delay', puces: true,
              reponse: ['<b>📏 Essais</b> : lancers, sauts ; la meilleure performance de chacun.',
                '<b>💨 VMA</b> : la VMA de chaque élève et les temps de passage à viser. Elle est rangée dans sa fiche : elle suit sur la clé.',
                '<b>🎥 Vidéo-delay</b> : l’élève se voit en différé, avec des tracés (angles, lignes). Ouvert avec le mot de passe du carnet, jamais en mode élève.',
                '⚠ Vidéo-delay : <b>rien n’est enregistré</b>, les images restent en mémoire quelques secondes puis sont effacées. Un élève qui ne veut pas être filmé est respecté (caméra coupée d’un toucher).'],
            },
            {
              id: 'apsa', titre: 'Outils d’APSA (combiné, natation, ASNS, boxe)', puces: true,
              reponse: ['<b>🏅 Combiné athlétique</b> : épreuves, barème ou classement, vagues de départ par niveau.',
                '<b>🏊 Natation</b> : couloirs, cycles de bras, amplitude, fréquence, indice de nage.',
                '<b>🥇 ASNS</b> : une étape du savoir-nager, un barème bronze / argent / or, les élèves passent tour à tour.',
                '<b>🥊 Boxe française</b> : assauts, reprises, touches, arbitre et juge, rotation des rôles.'],
            },
          ] : [
            {
              id: 'ece', titre: 'L’ECE (compétences expérimentales)', puces: true,
              reponse: ['Outil <b>🔬 ECE</b>, pour les ECE blanches : d’après le guide officiel (1 h, note sur 20 puis sur 5).',
                'Compte les <b>aides</b> (mineures, majeures) au toucher : l’appli propose le niveau A, B, C ou D, que tu peux changer.',
                'Communication et conclusion : coche les critères remplis. Un document de secours donné pour un échec non imputable au candidat ne compte pas comme une aide.',
                'Le chrono bipe 10 minutes avant la fin, puis à la fin.',
                '<b>📝 Vers les notes</b> crée l’évaluation sur 20 dans l’onglet Notes.'],
            },
            {
              id: 'labo', titre: 'Au labo : schéma, gestes, mise en commun, sécurité', puces: true,
              reponse: ['<b>✏️ Grille de schéma</b> : coche les critères en passant dans les rangs ; la note se calcule (📝 Vers les notes).',
                '<b>🧪 Gestes techniques</b> : microscope, préparation, dissection… qui réussit, qui aider en priorité.',
                '<b>📊 Mise en commun</b> : les mesures des groupes, moyenne, valeurs à vérifier, graphique à projeter.',
                '<b>⚠️ Sécurité au labo</b> : les consignes du TP à projeter. Les PAI et oublis de matériel du jour sont dans un cadre « 🔒 Pour le professeur », caché en plein écran.'],
            },
            {
              id: 'binomes', titre: 'Faire des binômes ou des groupes', puces: true,
              reponse: ['<b>👫 Binômes de TP</b> : une paillasse par binôme, en évitant de refaire les mêmes binômes (l’appli retient les derniers TP) ; touche deux noms pour les échanger.',
                '<b>👥 Équipes</b> : des groupes plus grands, au hasard ou équilibrés d’après ton carnet (moyenne, degrés).',
                '<b>🎲 Tirage au sort</b> : un élève au hasard, ou les rôles (rapporteur, secrétaire…).'],
            },
            {
              id: 'tp', titre: 'Préparer un TP (matériel, commande au labo)', puces: true,
              reponse: ['Outil <b>🧾 Préparation des TP</b>, onglet <b>Fiches TP</b> : le matériel de chaque séance (par binôme, par élève…), les dangers, un mot pour le technicien.',
                '<b>Commande au labo</b> : toutes tes classes sur une période, quantités calculées d’après les effectifs, à imprimer.',
                '<b>Banque de séances</b> : tes séances réutilisables d’une année sur l’autre, à échanger avec un collègue (aucune donnée d’élève).'],
            },
          ]),
          {
            id: 'garder', titre: 'Garder les résultats d’un outil', puces: true,
            reponse: ['Ce que tu fais dans un outil reste <b>sur cet appareil</b> : il ne part pas sur la clé.',
              `Pour le garder dans le carnet : <b>« 📤 Vers une ${lecon} »</b> (nouvelle séance remplie, ou colonnes ajoutées${eps ? '' : ' ; « 📝 Vers les notes » pour l’ECE et la grille de schéma'}).`,
              eps ? 'Exception : la <b>VMA</b> est rangée dans la fiche de l’élève, elle suit sur la clé.'
                : 'Exceptions : les <b>fiches TP</b> et la <b>banque de séances</b> sont dans le carnet, elles suivent sur la clé.',
              '« 🗑 Tout effacer » remet l’outil à zéro (ce qui a été envoyé dans le carnet reste).'],
          },
          {
            id: 'eleve', titre: '🎓 Prêter la tablette aux élèves (mode élève)',
            reponse: ['Dans l’onglet Outils, choisis la classe, puis <b>« 🎓 Mode élève »</b>.',
              'Coche les <b>outils autorisés</b> et choisis un <b>code à 4 chiffres</b> (deux fois).',
              `La tablette n’affiche plus que ces outils, pour cette classe : ni notes, ni ${lecons}, ni fiches, ni clé, ni réglages. Les élèves y apparaissent en « initiale + prénom ».`,
              `Jamais en mode élève : ${nomsOutils(outilsDuCarnet().filter(o => o.eleve === false))} (réservé${outilsDuCarnet().filter(o => o.eleve === false).length > 1 ? 's' : ''} au professeur), l’envoi vers une ${lecon} et l’aide de Hugo.`,
              'Pour sortir : <b>« 🔒 Quitter le mode élève »</b> et le code (ou le mot de passe du carnet). 5 erreurs = 1 minute d’attente.',
              'Pour que l’élève ne quitte pas l’appli : <b>épinglage d’écran</b> (Android) ou <b>Accès guidé</b> (iPad).'],
            guide: [ETAPES_OUTILS.onglet, ETAPES_OUTILS.accueil,
              etapeBouton('#vue [data-o="eleve-entrer"]', 'Touche « 🎓 Mode élève ».', () => !!fenetreModeEleve(),
                'Choisis d’abord une classe avec des élèves, à gauche.'),
              etapeZone(fenetreModeEleve, '.cases-mode-eleve', 'Coche les outils que les élèves pourront utiliser.'),
              etapeZone(fenetreModeEleve, '[name="code"]', 'Un code à 4 chiffres, pour sortir du mode élève : retiens-le.'),
              etapeValider(fenetreModeEleve, 'pour prêter la tablette')],
          },
        ],
      },
      {
        id: 'baremes', icone: '📊', titre: 'Les barèmes',
        enfants: [
          {
            id: 'creation', icone: '➕', titre: 'Créer un barème',
            enfants: [
              {
                id: 'creer', titre: 'Créer un barème pas à pas',
                intro: `Un barème est fait de blocs (${eps ? 'performance, ' : ''}grille par degrés, paliers, critères, texte) ; leurs points s’additionnent.`,
                reponse: ['Touche l’onglet <b>Barèmes</b> en haut.',
                  'Touche <b>« + Nouveau barème »</b>.',
                  `Choisis ${eps ? 'l’<b>APSA</b>' : 'le <b>type d’épreuve</b>'}, le <b>niveau</b> et le <b>point de départ</b> : le modèle de l’appli, un de tes barèmes ⭐, ou une page blanche.`,
                  '<b>Coche</b> les blocs à garder et règle leurs points (le total s’affiche), puis <b>« Créer »</b>.',
                  'Ton barème s’ouvre : tout se modifie directement dans les cases, il s’enregistre tout seul.'],
                guide: [ETAPES_HUGO.ongletBaremes, ETAPES_HUGO.bibliotheque,
                  etapeBouton('#vue [data-bar="nouveau"]', 'Touche « + Nouveau barème ».', () => !!fenetreNouveauBareme()),
                  ...ETAPES_NOUVEAU_BAREME],
              },
              {
                id: 'modele', titre: 'Partir d’un modèle fourni par l’appli',
                intro: `L’appli propose des barèmes tout prêts par ${eps ? 'activité' : 'type d’épreuve (TP, écrit, oral…)'}. Les chiffres sont indicatifs : adapte-les à ton référentiel.`,
                reponse: ['Touche l’onglet <b>Barèmes</b>.',
                  'Descends jusqu’à <b>« Modèles fournis »</b> (le filtre <b>Niveau</b> en haut aide à trier).',
                  `Touche le modèle de ${tonType} : il s’ouvre comme un nouveau barème.`,
                  'Garde les blocs utiles, règle les points, puis <b>« Créer »</b>.'],
                guide: [ETAPES_HUGO.ongletBaremes, ETAPES_HUGO.bibliotheque,
                  etapeBouton('#vue .modele-fourni', `Voici les modèles fournis : touche celui de ${tonType}.`, () => !!fenetreNouveauBareme()),
                  ...ETAPES_NOUVEAU_BAREME],
              },
              ...(eps ? [{
                id: 'perf', titre: 'Bloc ⏱ Performance (temps, distance…)',
                intro: 'Le tableau qui donne les points selon la performance, pour les filles et les garçons.',
                reponse: ['Dans ton barème, choisis la <b>mesure</b> (temps, distance…) et coche <b>« Filles / garçons séparés »</b> si besoin.',
                  'Écris deux <b>repères</b> : la performance qui vaut <b>0 pt</b> et celle qui vaut <b>tous les points</b> (ex. 5:00 et 3:10).',
                  'Touche <b>« ⚙ Générer le tableau »</b> : l’appli remplit toutes les lignes.',
                  'Chaque case reste modifiable à la main. Temps : écris 3:45 ou 12,5.'],
                guide: [ETAPES_HUGO.ongletBaremes, etapeOuvrirBareme,
                  etapeZonePage('#vue .reglage-perf', 'Choisis la mesure et, si besoin, « Filles / garçons séparés ».', 'Ce barème n’a pas de bloc Performance : ajoute « ⏱ Performance » en bas de la page.'),
                  etapeZonePage('#vue .ancres-perf', 'Écris la perf qui vaut 0 pt et celle qui vaut tous les points.'),
                  etapeZonePage('#vue [data-bar="generer"]', 'Touche « ⚙ Générer le tableau » : toutes les lignes se remplissent.'),
                  etapeZonePage('#vue .perf-bareme', 'Chaque case se retouche à la main si besoin.')],
              }] : []),
              {
                id: 'degres', titre: 'Bloc 🎯 Grille par degrés (1 à 4)',
                intro: 'Pour les compétences : chaque critère a 4 degrés, du moins bon au meilleur.',
                reponse: ['Dans ton barème, écris le <b>nom du critère</b> et ses <b>points</b>.',
                  'Décris ce qu’on observe à chaque <b>degré</b> (1 à 4).',
                  'Sous chaque case, l’appli affiche les <b>points du degré</b> (fourchette).',
                  '<b>« + Critère »</b> ajoute une ligne. Dans la note, tu toucheras simplement le degré atteint.'],
                guide: [ETAPES_HUGO.ongletBaremes, etapeOuvrirBareme,
                  etapeZonePage('#vue .grille-bareme', 'Une ligne par critère : son nom, ses points, puis ce qu’on observe à chaque degré.', 'Ce barème n’a pas de grille par degrés : ajoute « 🎯 Grille par degrés » en bas de la page.'),
                  etapeZonePage('#vue .grille-bareme .fourchette', 'Ici, les points que rapporte ce degré.'),
                  etapeZonePage('#vue .bloc-bareme [data-bar="ajout-critere"]', '« + Critère » ajoute une ligne.')],
              },
              {
                id: 'paliers', titre: 'Blocs 📏 Paliers et ☑️ Critères : la différence',
                reponse: [`<b>📏 Paliers</b> : <b>une seule</b> ligne s’applique (ex. ${eps ? 'écart au projet : 0 s = 4 pts, 5 s = 3 pts' : 'aide demandée : aucune = 4 pts, mineure = 3 pts'}…). Dans la note, on choisit le palier atteint.`,
                  `<b>☑️ Critères observables</b> : <b>chaque</b> critère rempli rapporte ses points (ex. « ${eps ? 's’échauffe seul' : 'le schéma a un titre'} » 1 pt). Dans la note, on coche.`,
                  'Dans les deux : écris le libellé et les points, <b>« + Ligne »</b> pour en ajouter.',
                  '<b>📝 Texte</b> : consignes ou conditions de l’épreuve, sans points.'],
                guide: [ETAPES_HUGO.ongletBaremes, etapeOuvrirBareme,
                  etapeZonePage('#vue .liste-bareme', 'Une ligne = un libellé et ses points.', 'Ce barème n’a pas encore de paliers ni de critères : ajoute « 📏 » ou « ☑️ » en bas de la page.'),
                  etapeZonePage('#vue .bloc-bareme [data-bar="ajout-ligne"]', '« + Ligne » en ajoute une.'),
                  etapeZonePage('#vue .ajout-blocs', 'Tous les types de blocs s’ajoutent ici.')],
              },
              {
                id: 'mon-modele', titre: 'Réutiliser mon barème comme modèle ⭐',
                reponse: ['Ouvre ton barème et touche <b>« ☆ Enregistrer comme modèle »</b> (il devient ⭐).',
                  'À la prochaine création, choisis-le dans <b>« Point de départ »</b> : tu repars de lui (une copie).',
                  `Pratique pour ${eps ? 'la même activité' : 'la même épreuve'} sur plusieurs niveaux. <b>« ⧉ Dupliquer »</b> fait aussi une copie.`],
                guide: [ETAPES_HUGO.ongletBaremes, etapeOuvrirBareme,
                  etapeZonePage('#vue [data-bar="etoile"]', 'Touche ici pour en faire un modèle ⭐ : il sera proposé dans « Point de départ ».'),
                  etapeZonePage('#vue [data-bar="dupliquer"]', '« ⧉ Dupliquer » fait une copie de ce barème, à adapter.')],
              },
            ],
          },
          {
            id: 'import', icone: '📥', titre: 'Importer un barème',
            enfants: [
              {
                id: 'importer', titre: 'Importer mon barème (PDF, Word, Excel)',
                intro: 'Ton barème existe déjà dans un document ? L’appli le lit elle-même, sur ton appareil (rien n’est envoyé sur Internet).',
                reponse: ['Touche l’onglet <b>Barèmes</b>, puis <b>« 📥 Importer un barème »</b>.',
                  'Choisis ton fichier : <b>PDF</b>, <b>Word</b> (.docx), <b>LibreOffice</b> (.odt) ou <b>Excel</b>.',
                  `L’appli te montre les <b>blocs trouvés</b> (${eps ? 'tableau de perfs, grille par degrés, paliers' : 'grille par degrés, critères, paliers'}…) : vérifie leur nom, leur sorte et leurs points, <b>décoche</b> ce qui ne convient pas.`,
                  'Lis les ⚠ éventuels (ex. total différent de 20).',
                  'Touche <b>« Ajouter à mes barèmes »</b> : il apparaît dans « Mes barèmes », tout se retouche ensuite.'],
                guide: [ETAPES_HUGO.ongletBaremes, ETAPES_HUGO.bibliotheque,
                  etapeBouton('#vue [data-bar="recevoir"]', 'Touche « 📥 Importer un barème », puis choisis ton fichier.',
                    () => !!fenetreImportBareme() || !!document.querySelector('#vue [data-bar="bibliotheque"]')),
                  etapeZone(fenetreImportBareme, '.blocs-import', 'Voici ce que l’appli a lu : vérifie chaque bloc (nom, sorte, points) et décoche ce qui ne convient pas.'),
                  etapeValider(fenetreImportBareme, 'pour le ranger dans tes barèmes')],
              },
              {
                id: 'lit', titre: 'Ce que l’appli sait lire dans un document',
                reponse: [...(eps ? ['Les <b>tableaux points ↔ performances</b>, même avec filles et garçons côte à côte.'] : []),
                  'Les <b>grilles par degrés</b> (1 à 4, ou « non acquis… dépassé »), avec leurs points.',
                  'Les <b>paliers</b> et les lignes du type « … : 2 pts ».',
                  'Plusieurs évaluations dans un même document : coche <b>« créer un barème pour chacune »</b>.',
                  'Le reste du texte peut être gardé en bloc 📝 Texte.'],
              },
              {
                id: 'rate', titre: 'L’import n’a pas bien marché',
                reponse: ['Un <b>PDF scanné</b> (photo de la feuille) ne se lit pas : prends plutôt le fichier Word ou Excel d’origine.',
                  'Un PDF <b>protégé par un mot de passe</b> est refusé.',
                  'Un bloc mal lu ? <b>Décoche-le</b>, puis ajoute-le à la main dans le barème.',
                  'Rien de reconnu ? Crée quand même le barème avec son texte, puis ajoute les blocs (voir « Créer un barème »).'],
              },
              {
                id: 'collegue', titre: 'Recevoir le barème d’un collègue',
                reponse: ['Ton collègue ouvre son barème et touche <b>« 📤 Envoyer (fichier) »</b> : il obtient un petit fichier <b>.json</b> (sans aucune donnée d’élève).',
                  'Il te le donne (clé, mail, Drive…).',
                  'Chez toi : onglet <b>Barèmes</b>, <b>« 📥 Importer un barème »</b>, choisis ce fichier : il est ajouté tout de suite à « Mes barèmes » et s’ouvre.'],
                guide: [ETAPES_HUGO.ongletBaremes, ETAPES_HUGO.bibliotheque,
                  // (un .json s'ajoute sans fenêtre de vérification : le barème s'ouvre directement)
                  etapeBouton('#vue [data-bar="recevoir"]', 'Touche « 📥 Importer un barème », puis choisis le fichier .json de ton collègue.',
                    () => !!fenetreImportBareme() || !!document.querySelector('#vue [data-bar="bibliotheque"]')),
                  etapeZonePage('#vue .titre-bareme', 'Le barème de ton collègue est dans « Mes barèmes » : adapte-le si besoin.')],
              },
            ],
          },
          {
            id: 'modifier', titre: 'Modifier un barème (blocs, points)',
            reponse: ['Touche l’onglet <b>Barèmes</b>, puis ton barème dans <b>« Mes barèmes »</b>.',
              'Change ce que tu veux directement dans les cases : tout s’enregistre tout seul.',
              `Pour ajouter un bloc : ${eps ? '<b>performance</b>, ' : ''}<b>grille par degrés</b>, <b>paliers</b>, <b>critères</b> ou <b>texte</b>, en bas de la page.`,
              'Le total ne tombe pas juste ? Écris 20 dans <b>« Ramener sur »</b> et touche <b>« ⚖ Ramener »</b>.'],
            guide: [ETAPES_HUGO.ongletBaremes, etapeOuvrirBareme,
              etapeZonePage('#vue .titre-bareme', `Ici : le titre, ${ceQueDecrit} et le niveau. Tout ce que tu changes s’enregistre tout seul.`),
              etapeZonePage('#vue .bloc-bareme .tete-bloc', 'Chaque bloc a son titre et ses points ; ses cases se modifient directement.', 'Ce barème n’a pas encore de bloc : ajoute-en un plus bas.'),
              etapeZonePage('#vue .ajout-blocs', 'Pour ajouter un bloc, choisis son type ici.'),
              etapeZonePage('#vue [data-bar="ramener"]', 'Le total ne tombe pas juste ? Écris 20 dans « Ramener sur » et touche « ⚖ Ramener ».')],
          },
          { ...questionBaremeEval(eps), id: 'utiliser', titre: 'Utiliser un barème pour une évaluation' },
          {
            id: 'partager', titre: 'Imprimer ou donner un barème à un collègue',
            reponse: ['Touche l’onglet <b>Barèmes</b>, puis ton barème.',
              '<b>« 🖨 Imprimer / PDF »</b> : pour l’afficher ou le donner aux élèves.',
              '<b>« 📤 Envoyer (fichier) »</b> : crée un petit fichier à donner à un collègue (aucune donnée d’élève dedans).',
              'Ton collègue l’ajoute chez lui avec <b>« 📥 Importer un barème »</b>.'],
            guide: [ETAPES_HUGO.ongletBaremes, etapeOuvrirBareme,
              etapeZonePage('#vue [data-bar="imprimer"]', `« 🖨 Imprimer / PDF » : pour l’afficher ${eps ? 'au gymnase' : 'en classe'} ou le donner aux élèves.`),
              etapeZonePage('#vue [data-bar="envoyer"]', '« 📤 Envoyer » crée un fichier pour un collègue, sans aucune donnée d’élève. Il l’ajoute avec « 📥 Importer un barème ».')],
          },
        ],
      },
      {
        id: 'notes', icone: '📝', titre: 'Les notes',
        enfants: [
          {
            id: 'creer', titre: 'Créer une évaluation (une colonne de notes)',
            reponse: ['Touche l’onglet <b>Notes</b> en haut (choisis ta classe à gauche).',
              'Touche <b>« + Évaluation »</b>.',
              'Donne un <b>titre</b>, la <b>date</b> et sur combien c’est <b>noté</b> (/20, /10…).',
              'Touche <b>« Créer »</b> : une colonne apparaît dans la grille.'],
            guide: [ETAPES_HUGO.ongletNotes, ETAPES_HUGO.classe,
              { cible: () => premierVisible('#vue [data-action="ajout-eval"]'), texte: 'Touche « + Évaluation ».', fait: () => !!fenetreEval() },
              { cible: dansFenetreEval('[name="titre"]'), texte: `Écris le titre (ex. « ${eps ? 'Demi-fond' : 'TP microscope'} »).`, suivant: true, fait: () => !fenetreEval() },
              { cible: dansFenetreEval('[name="max"]'), texte: 'Vérifie la date et « Noté sur » (20 par défaut).', suivant: true, fait: () => !fenetreEval() },
              ETAPES_HUGO.valider],
          },
          {
            id: 'saisir', titre: 'Mettre les notes (et les absents)',
            reponse: ['Dans l’onglet <b>Notes</b>, touche la case de l’élève sous l’évaluation.',
              'Tape la note puis <b>Entrée</b> : tu passes à l’élève suivant.',
              `Absent… : tape la lettre (${codes}) ou touche le bouton en bas de l’écran.`],
            guide: [ETAPES_HUGO.ongletNotes, ETAPES_HUGO.classe,
              { cible: () => premierVisible('#vue .grille-notes input.cellule'), texte: 'Touche cette case et tape une note, puis Entrée.', fait: () => document.activeElement?.matches?.('#vue .grille-notes input.cellule') },
              { cible: () => premierVisible('#saisie'), texte: `Absent… ? Touche un de ces boutons (ou tape ${lettresCodes()}). Entrée = élève suivant.`, suivant: true }],
          },
          {
            id: 'competences', titre: 'Ajouter des compétences à une évaluation',
            reponse: ['Dans l’onglet <b>Notes</b>, touche le <b>titre de l’évaluation</b> (en haut de sa colonne).',
              'Descends jusqu’à <b>« Compétences travaillées »</b>.',
              `Choisis le <b>référentiel</b>${eps ? ' et le <b>champ</b>' : ''}, puis <b>coche</b> les compétences. Tu peux aussi en écrire d’autres, une par ligne.`,
              'Touche <b>« Enregistrer »</b> : une colonne par compétence apparaît sous la note, avec un degré de 1 à 4.'],
            guide: [ETAPES_HUGO.ongletNotes, ETAPES_HUGO.classe, ETAPES_HUGO.ouvrirEval,
              zoneEval('fieldset.competences', `Voici « Compétences travaillées ». Choisis le référentiel${eps ? ' et le champ' : ''}, puis coche les compétences.`),
              zoneEval('[name="competencesLibres"]', 'Une compétence qui n’est pas dans la liste ? Écris-la ici, une par ligne.'),
              ETAPES_HUGO.valider],
          },
          {
            id: 'parties', titre: 'Diviser ma note en plusieurs parties',
            intro: eps ? 'Ex. 7 pts d’investissement + 3 pts d’exécution + 10 pts de performance.' : 'Ex. 4 pts de démarche + 3 pts de manipulation + 3 pts de communication.',
            reponse: ['Dans l’onglet <b>Notes</b>, touche le <b>titre de l’évaluation</b>.',
              'Dans <b>« Décomposition de la note »</b>, touche <b>« + Ajouter une partie »</b>, donne un nom et des points. Recommence pour chaque partie.',
              'Touche <b>« Enregistrer »</b> : une colonne par partie, le total se calcule tout seul.'],
            guide: [ETAPES_HUGO.ongletNotes, ETAPES_HUGO.classe, ETAPES_HUGO.ouvrirEval,
              { cible: dansFenetreEval('[data-ajout-partie]'), defiler: true, texte: 'Touche « + Ajouter une partie ».',
                fait: () => !fenetreEval() || !!fenetreEval().querySelector('.liste-parties .ligne-partie') },
              zoneEval('.liste-parties .ligne-partie:last-child', 'Écris le nom de la partie et ses points. Pour une autre partie, retouche « + Ajouter une partie ».'),
              ETAPES_HUGO.valider],
          },
          questionBaremeEval(eps),
          {
            id: 'modifier', titre: 'Modifier ou supprimer une évaluation',
            reponse: ['Dans l’onglet <b>Notes</b>, touche le <b>titre de l’évaluation</b>.',
              'Change ce que tu veux puis <b>« Enregistrer »</b>.',
              'Pour l’effacer : bouton rouge <b>« Supprimer »</b> en bas à gauche de la fenêtre (une erreur ? la flèche <b>↶</b> en haut revient en arrière).'],
            guide: [ETAPES_HUGO.ongletNotes, ETAPES_HUGO.classe, ETAPES_HUGO.ouvrirEval,
              zoneEval('.modale-actions button.danger', 'Pour effacer l’évaluation : « Supprimer ». Sinon, change ce que tu veux.'),
              ETAPES_HUGO.valider],
          },
        ],
      },
        {
          // (rubriques nommées par la discipline : rubriqueAppr — en SVT, Connaissances et Démarche)
          id: 'appreciations', icone: '✍', titre: 'Les appréciations du bulletin',
          enfants: [
            {
              id: 'principe', titre: 'Comment ça marche, en deux temps',
              intro: 'Une proposition calculée par l’appli à partir de ton carnet, que tu relis et que tu modifies : c’est toi qui décides.',
              reponse: [`<b>1. Analyse</b> : pour chaque élève et la période choisie, l’appli lit ce que tu as saisi (notes, degrés de maîtrise, ${lecons}, observations) et donne un <b>niveau de 1 à 4</b> à chaque rubrique : ${Object.keys(RUBRIQUES_APPR).filter(k => k !== 'objectif').map(k => rubriqueAppr(k).nom.toLowerCase()).join(', ')}.`,
                '<b>2. Rédaction</b> : pour chaque rubrique cochée, elle choisit une phrase toute faite qui correspond au niveau (et à ton ton, ton style), les enchaîne dans ton ordre, ajoute un objectif, et raccourcit si le texte dépasse la longueur réglée.',
                'Sur chaque carte, une <b>pastille par rubrique</b> montre le niveau retenu ; survole-la (ou appui long) : l’appli dit <b>d’où vient ce niveau</b> (moyenne, degrés, mots trouvés…).',
                'Touche une pastille pour changer le niveau (1 → 2 → 3 → 4 → non mentionné) : le texte est réécrit aussitôt.',
                '<b>Rien n’est envoyé</b> : tout se calcule sur l’appareil, avec des règles fixes, sans intelligence artificielle en ligne.'],
            },
            {
              id: 'sources', titre: 'À partir de quoi ? Rubrique par rubrique', puces: true,
              intro: 'Seulement les évaluations et les séances de la période choisie (T1, T2… ou toute l’année).',
              reponse: [`<b>${esc(rubriqueAppr('moteur').nom)}</b> (les résultats) : la <b>moyenne</b> de la période, comparée aux seuils <b>« ⚙ Note → degré »</b> de la classe (onglet Notes, ex. 10 / 14 / 18 : sous 10 = 1, dès 10 = 2, dès 14 = 3, dès 18 = 4). Puis la <b>place dans la classe</b> corrige : 0,5 point sous la moyenne de la classe → jamais 4 ; 1,5 point sous → 2 au plus ; 2 points au-dessus et dans le premier tiers → un cran de plus. Sans note : les degrés des compétences de ce type.`,
                '<b>Compétences</b> : la moyenne des <b>derniers degrés</b> de chaque compétence (évaluations, et échelles 1 à 4 des séances) : dès 3,5 = 4 ; dès 2,75 = 3 ; dès 2 = 2 ; sinon 1.',
                `<b>${esc(rubriqueAppr('methodo').nom)}</b> : les degrés des compétences et des données dont le nom parle de ${eps ? 'rôle, arbitrage, juge, échauffement, sécurité, organisation, projet' : 'démarche, protocole, hypothèse, manipulation, sécurité, organisation'}… (même calcul que les compétences).`,
                `<b>Attitude</b> : le critère « engagement / investissement » s’il est relevé (sinon 3), la <b>présence aux ${lecons}</b> (3 absences, ou 2 avec moins de 80 % de présence → 2 au plus), les <b>travaux non rendus</b> et les <b>mots-clés</b> de tes observations. Être ${motifsSante()} ne baisse jamais ce niveau.`,
                `<b>Comportement</b> : les critères « respect${eps ? ', fair-play' : ''}, comportement » s’ils sont relevés (sinon 3), corrigés par les mots-clés de tes observations.`,
                `<b>Progression</b> : l’écart avec la <b>période précédente</b> (dès +2,5 points = 4 ; dès +1 = 3 ; jusqu’à −1,5 = 2 ; au-delà = 1), sinon la tendance des notes de la période, combinés avec le nombre de critères en progrès ou en baisse (${eps ? 'degrés, performances' : 'degrés'}).`,
                '<b>Objectif</b> : choisi d’après la rubrique la plus faible (ex. « gagner en rigueur et en méthode »).',
                'Sans aucune donnée, attitude et comportement valent 3 « par défaut » : l’infobulle le signale (« à vérifier »).'],
            },
            {
              id: 'mots', titre: 'Les mots-clés de tes observations', puces: true,
              reponse: [`L’appli lit : les données <b>Texte</b> et les réponses de listes de tes ${lecons}, et les observations de la fiche de l’élève (onglet Notes, « Mon suivi »…) écrites pendant la période.`,
                `<b>Attitude</b> — en moins : peu investi, passif, ne participe pas, refuse de, ${oubliTenue()}, non rendu, travail non fait… ; en plus : investi, impliqué, motivé, dynamique, volontaire, sérieux, persévérant, appliqué…`,
                '<b>Comportement</b> — en moins : bavard, agité, insolent, perturbe, dissipé, conflit, triche, impoli, avertissement, punition… ; en plus : respectueux, poli, calme, fair-play, exemplaire, aide ses camarades, solidaire…',
                'Les <b>négations</b> sont comprises : « pas assez investi », « peu motivé » comptent en moins.',
                'Effet : plus de mots positifs → un cran de plus ; plus de négatifs → un cran de moins (deux crans si l’écart est d’au moins 2 mots).',
                'Un mot négatif fait aussi de la rubrique un <b>⚠ point de vigilance</b> : l’appréciation en parle en priorité.'],
            },
            {
              id: 'redaction', titre: 'Comment le texte est rédigé', puces: true,
              reponse: ['Une <b>banque de phrases</b> par rubrique et par niveau ; pour les niveaux 1 et 2, une version par <b>ton</b> (bienveillant, neutre, exigeant).',
                'Si tu l’as coché, un <b>bilan général</b> ouvre le texte (d’après résultats, compétences et attitude, nuancé par la place dans la classe).',
                'Puis les rubriques cochées, <b>dans ton ordre</b> ; les points de vigilance ⚠ passent en premier. L’objectif termine le texte.',
                `${eps ? 'L’APSA' : 'Le thème'} est citée quand c’est possible (« ${eps ? 'notamment en badminton' : 'sur le corps humain et la santé'} ») : la meilleure pour un point fort, la plus fragile pour une difficulté.`,
                'Le prénom vient en premier, puis il / elle (d’après le sexe de la fiche) ; l’appli évite de répéter un mot ou une tournure.',
                '<b>Trop long ?</b> Elle prend d’abord les phrases les plus courtes, puis laisse de côté les rubriques les moins utiles (niveau par défaut, progression stable, « satisfaisant »…) ; les ⚠ et l’objectif restent. La carte dit ce qui a été laissé de côté.',
                '<b>🎲 Autre formulation</b> : mêmes niveaux, autres phrases.'],
            },
            {
              id: 'utiliser', titre: 'Écrire les appréciations de la classe',
              reponse: ['Onglet <b>Notes</b>, choisis la classe, puis <b>« ✍ Appréciations »</b>.',
                'Choisis la <b>période</b> (T1, T2…) en haut.',
                'Chaque élève a sa carte : touche une <b>rubrique</b> pour changer son niveau (le texte suit), <b>🎲 Autre formulation</b> pour d’autres phrases.',
                'Tu peux <b>réécrire le texte</b> directement ; « 🔄 Reproposer » revient à la proposition de l’appli, « ↺ niveaux calculés » aux niveaux d’origine.',
                '<b>📋 Copier</b> (un élève) ou <b>📋 Copier toutes</b> (NOM Prénom + appréciation, une ligne par élève), puis colle dans le logiciel du bulletin.'],
              guide: [ETAPES_HUGO.ongletNotes, ETAPES_HUGO.classe, ETAPE_OUVRIR_APPR,
                etapeZone(fenetreAppr, '[data-appr-periodes]', 'La période des appréciations.'),
                etapeZone(fenetreAppr, '.puces-appr', 'Touche une rubrique pour changer son niveau : le texte suit.'),
                etapeZone(fenetreAppr, '[data-appr-texte]', 'Le texte proposé : tu peux le réécrire, il est gardé tel quel.'),
                etapeZone(fenetreAppr, '[data-appr-tout]', '« Copier toutes » : une ligne par élève, à coller dans le bulletin.')],
            },
            {
              id: 'reglages', titre: 'Régler les appréciations : chaque réglage, son effet',
              reponse: ['Dans la fenêtre « ✍ Appréciations », ouvre <b>« ⚙ Réglages des appréciations »</b> (les mêmes sont dans ⚙ Réglages du carnet). Ils valent pour toutes tes classes et sont appliqués aussitôt.',
                '<b>Rubriques cochées</b> : celles dont le texte parle. Une rubrique décochée n’est abordée que si elle signale une difficulté (⚠).',
                '<b>Ordre (↑ ↓)</b> : l’ordre des phrases dans le texte, et la priorité quand la place manque (les dernières sautent d’abord).',
                '<b>Bilan général</b> : une première phrase qui résume la période (« Léa réalise un bon trimestre. »).',
                '<b>Ton</b> : bienveillant, neutre ou exigeant ; il change surtout les phrases des difficultés (niveaux 1 et 2) et la façon de dire l’objectif.',
                '<b>Style</b> : des phrases (« Léa s’investit… ») ou télégraphique (« Investissement sérieux. »).',
                '<b>Longueur max.</b> : la limite de caractères de ton bulletin (ex. 300) ; le compteur passe en rouge si ton texte la dépasse.',
                'Pour un seul élève : touche ses pastilles (niveaux), 🎲, ou réécris le texte. Pour les résultats de toute la classe : règle les seuils <b>« ⚙ Note → degré »</b> dans l’onglet Notes.'],
              guide: [ETAPES_HUGO.ongletNotes, ETAPES_HUGO.classe, ETAPE_OUVRIR_APPR,
                etapeZone(fenetreAppr, 'details.reglages-appr > summary', 'Touche ici pour ouvrir les réglages : rubriques, ton, style, longueur.')],
            },
            {
              id: 'vigilance', titre: 'Points de vigilance ⚠, relecture, fiche bilan', puces: true,
              reponse: ['Une rubrique marquée <b>⚠</b> : ce que tu as rempli (observations, absences…) signale une difficulté, l’appréciation en parle en priorité, même rubrique décochée.',
                'Sous chaque texte, une <b>relecture</b> signale espaces, majuscules, mots doublés, prénom d’un autre élève… ; « ✔ Corriger » arrange ce qui peut l’être.',
                'Survole (ou touche longuement) une rubrique : l’appli dit <b>d’où vient son niveau</b>.',
                'La même appréciation apparaît dans la <b>fiche bilan</b> de l’élève (onglet Notes, touche son nom) : un changement fait d’un côté se retrouve de l’autre.'],
            },
            {
              id: 'limites', titre: 'Nuances et limites', puces: true,
              reponse: ['L’appli ne connaît que <b>ce que tu as saisi</b> : peu de notes ou d’observations = une appréciation prudente et générale.',
                'Tes <b>observations</b> comptent par leurs mots-clés (« bavard », « s’investit »…), négations comprises (« pas assez »).',
                '<b>Relis toujours</b> avant de copier : c’est une proposition, pas un jugement automatique.',
                'Elle est rangée dans ton carnet (chiffré sur la clé) ; prof principal ? L’appréciation générale se fait à part, dans l’onglet <b>Prof principal</b>.'],
            },
          ],
        },
      {
        // Espace professeur principal : le même pour toutes les disciplines (pp.js, ppinfos.js).
        id: 'pp', icone: '⭐', titre: 'Prof principal',
        enfants: [
          {
            id: 'principe', titre: 'À quoi sert l’espace Prof principal ?', puces: true,
            intro: 'Préparer le conseil de classe de ta classe de PP, à partir des bulletins de tous les collègues.',
            reponse: ['<b>📥 Bulletins</b> : tu déposes les bulletins PDF d’École Directe ou de Pronote ; l’appli les lit.',
              '<b>📊 Tableau synthèse</b> : toutes les moyennes de la classe, matière par matière, rangs, évolutions, mentions.',
              '<b>✍ Appréciations</b> : l’appréciation générale de chaque élève, proposée par l’appli, avec la mention.',
              '<b>🗣 Conseil</b> : le jour du conseil, élève par élève, avec ce que disent les collègues et tes notes.',
              '<b>🗂 Suivi</b> : les élèves à suivre, ton journal (entretiens, appels, rappels), PAI / BEP.',
              '<b>📎 Incorporer des informations</b> : absences, vie scolaire, infirmerie… en plus du bulletin.',
              'En haut : la <b>période</b>, le <b>📷 trombinoscope</b> et les <b>📄 fiches bilan du conseil</b> (un PDF pour la classe).'],
            guide: [ETAPES_PP.onglet, etapeZonePage('#vue .pp-sections', 'Les six parties de l’espace : de l’import des bulletins au suivi.'),
              etapeZonePage('#vue .pp-periodes', 'La période (trimestre ou semestre) travaillée.'),
              etapeZonePage('#vue [data-pp="fiches-pdf"]', 'Les fiches bilan du conseil : un PDF pour toute la classe.')],
          },
          QUESTION_DEVENIR_PP,
          {
            id: 'deroule', titre: 'Préparer un conseil de classe, dans l’ordre',
            reponse: ['<b>📥 Bulletins</b> : importe les bulletins de la période.',
              '<b>📎 Incorporer des informations</b> (si tu en as) : absences, sanctions, infirmerie…',
              '<b>📊 Tableau synthèse</b> : repère les moyennes fragiles, les baisses, les mentions proposées.',
              '<b>✍ Appréciations</b> : relis et ajuste chaque appréciation générale et la mention.',
              '<b>📄 Fiches bilan du conseil</b> : imprime ou enregistre le PDF pour la réunion.',
              '<b>🗣 Conseil</b> : pendant la réunion, note les décisions ; puis <b>📋 Compte rendu du conseil</b>.'],
          },
          {
            id: 'bulletins', titre: 'Importer les bulletins',
            intro: 'Le bulletin de chaque élève, avec les moyennes et les appréciations de tous les collègues.',
            reponse: ['Dans École Directe ou Pronote, exporte les bulletins de la classe en <b>PDF</b> : un fichier par élève, ou toute la classe dans un seul fichier.',
              'Onglet <b>Prof principal</b>, partie <b>📥 Bulletins</b>, puis <b>« 📥 Importer des bulletins (PDF) »</b> : tu peux choisir plusieurs fichiers d’un coup.',
              'L’appli reconnaît la <b>période</b> et chaque <b>élève</b> (nom et prénom de l’en-tête). Un bulletin non reconnu va dans <b>« À rattacher »</b> : choisis l’élève dans la liste.',
              'Elle ne garde que les <b>matières, moyennes, appréciations des collègues, absences et retards</b> (et l’appréciation générale si elle est déjà écrite).',
              'Le trombinoscope montre qui a son bulletin (✔ et la moyenne) ; 🗑 retire un bulletin mal lu, et tu peux le réimporter.'],
            guide: [ETAPES_PP.onglet, ETAPES_PP.section('bulletins'),
              etapeZonePage('#vue .pp-contenu label.pp-depot', 'Touche ici et choisis les bulletins PDF (un ou plusieurs fichiers).'),
              etapeZonePage('#vue .pp-trombi', 'Chaque élève : bulletin lu (✔, moyenne) ou pas encore. Touche un élève pour le préparer en conseil.')],
          },
          {
            id: 'tableau', titre: 'Le tableau synthèse',
            reponse: ['Une ligne par élève : <b>moyenne générale</b>, <b>rang</b> (▼ en retrait, ▲ parmi les meilleurs), <b>évolution</b> depuis la période précédente, <b>absences</b>, <b>mention</b> proposée, puis une colonne par matière.',
              'Couleurs : rouge sous 8, orange sous 10, vert dès 14.',
              'En haut, le <b>bilan de la classe</b> : moyenne, nombre de chaque mention, matières les plus fragiles.',
              'Touche un élève : il s’ouvre dans <b>🗣 Conseil</b>.'],
            guide: [ETAPES_PP.onglet, ETAPES_PP.section('tableau'),
              etapeZonePage('#vue .pp-bilan-classe', 'Le bilan de la classe : moyenne, mentions, matières fragiles.', 'Aucun bulletin lu pour cette période : commence par 📥 Bulletins.'),
              etapeZonePage('#vue .pp-tableau', 'Une ligne par élève ; touche un nom pour le préparer en conseil.')],
          },
          {
            id: 'generale', titre: 'L’appréciation générale (et le lien avec tes appréciations)', puces: true,
            reponse: ['Partie <b>✍ Appréciations</b> : l’appli rédige l’appréciation générale d’après les <b>bulletins</b> lus, avec les mêmes principes que tes appréciations de matière (un niveau de 1 à 4 par rubrique, puis des phrases).',
              '<b>Résultats</b> : la moyenne générale, comparée aux seuils réglables (de base : 2 dès 10, 3 dès 13, 4 dès 16), corrigée par la place dans la classe.',
              '<b>Progression</b> : l’écart avec la moyenne générale de la période précédente (si son bulletin est lu) : dès +1,5 = 4 ; dès +0,5 = 3 ; jusqu’à −0,5 = 2 ; au-delà = 1.',
              '<b>Travail, participation, comportement</b> : l’appli repère dans <b>chaque appréciation des collègues</b> les mots positifs 👍 et négatifs 👎, puis compte la <b>proportion</b> de matières : sur 11 matières, 3 remarques ne font pas un travail « insuffisant » ; sur 4, si.',
              '<b>Matières</b> : jusqu’à deux réussites et deux difficultés nommées (moyenne nettement au-dessus ou sous 10, appréciation très positive ou négative).',
              '<b>Assiduité</b> : absences, non justifiées et retards du bulletin (2 dès 4 demi-journées, 1 non justifiée ou 3 retards ; 1 au-delà de 7, 3 non justifiées ou 6 retards).',
              'Déplie <b>« Ce que disent les collègues »</b> pour voir les mots repérés, matière par matière ; survole une pastille pour voir d’où vient son niveau.',
              'Comme pour tes appréciations de matière : touche une rubrique pour changer son niveau, 🎲 autre formulation, réécris le texte, 📋 copie (ou « Copier toutes »).',
              'Différence : tes appréciations de matière partent de <b>ton carnet</b> (onglet Notes) ; l’appréciation générale part des <b>bulletins</b>. Les deux ne se mélangent pas.',
              'Tout ce que tu changes ici (niveau, mention, texte) se retrouve partout : conseil, tableau, fiches bilan, élèves à suivre.'],
            guide: [ETAPES_PP.onglet, ETAPES_PP.section('appreciations'),
              etapeZonePage('#vue .pp-carte .puces-appr', 'Touche une rubrique pour changer son niveau.', 'Aucun bulletin lu pour cette période : commence par 📥 Bulletins.'),
              etapeZonePage('#vue .pp-carte [data-pp-mention]', 'La mention proposée : choisis-en une autre si besoin.'),
              etapeZonePage('#vue .pp-collegues > summary', 'Ce que disent les collègues, avec les mots repérés 👍 / 👎.')],
          },
          {
            id: 'mentions', titre: 'Réglages de l’appréciation générale et mentions', puces: true,
            reponse: ['Ouvre <b>« ⚙ Réglages de l’appréciation générale »</b> (partie ✍ Appréciations).',
              'Rubriques et ordre, <b>« il / elle »</b> ou <b>« vous »</b>, ton, style, longueur ; « ↺ Réglages de base » revient aux réglages d’origine.',
              '<b>Mentions</b> : retire celles que ton établissement n’utilise pas (✕), ajoute les tiennes (+ Ajouter), ou choisis « ✎ Saisie manuelle… » dans la liste d’un élève.',
              'Pour chaque mention, une <b>règle</b> : fourchette de moyenne et critère écrit en clair (ex. « travail sérieux et comportement sans souci ») ; la ligne « L’appli comprend : … » montre comment elle le lit.',
              'Les avertissements sont proposés en premier quand le travail ou le comportement sont signalés.'],
            guide: [ETAPES_PP.onglet, ETAPES_PP.section('appreciations'),
              etapeZonePage('#vue [data-pp-reglages-details] > summary', 'Touche ici : rubriques, ton, longueur, mentions et leurs règles.')],
          },
          {
            id: 'conseil', titre: 'Pendant le conseil de classe',
            reponse: ['Partie <b>🗣 Conseil</b> : un élève à la fois, ◀ ▶ pour passer au suivant.',
              'En haut, l’essentiel : photo, moyenne et évolution, absences, PAI / BEP et <b>⚠ points d’attention</b>.',
              'Dessous : l’appréciation générale, la <b>mention</b> et ce que disent les collègues.',
              '<b>Notes du conseil</b> : les décisions et remarques des collègues, enregistrées pendant la frappe.',
              'À la fin, <b>📋 Compte rendu du conseil</b> copie pour chaque élève la moyenne, la mention et les notes.'],
            guide: [ETAPES_PP.onglet, ETAPES_PP.section('conseil'),
              etapeZonePage('#vue .pp-conseil-nav', '◀ ▶ ou la liste : l’élève suivant.', 'Aucun bulletin lu pour cette période : commence par 📥 Bulletins.'),
              etapeZonePage('#vue [data-pp-notes]', 'Les notes du conseil : décisions, remarques des collègues.'),
              etapeZonePage('#vue [data-pp="compte-rendu"]', 'Le compte rendu de tout le conseil, à coller où tu veux.')],
          },
          {
            id: 'fiches', titre: 'Les fiches bilan du conseil (PDF)', puces: true,
            reponse: ['Bouton <b>« 📄 Fiches bilan du conseil »</b>, en haut de l’espace.',
              'Un seul PDF pour la classe : une page récapitulative, puis <b>une page par élève</b> (chiffres clés, mention, appréciation générale, moyennes par matière, points forts et à renforcer, points d’attention, notes du conseil, suivi).',
              'La fenêtre d’impression s’ouvre : choisis l’imprimante, ou <b>« Enregistrer au format PDF »</b>.',
              '⚠ Ce PDF n’est <b>pas chiffré</b> : range-le avec soin, supprime-le quand il ne sert plus.'],
            guide: [ETAPES_PP.onglet, etapeZonePage('#vue [data-pp="fiches-pdf"]', 'Les fiches bilan du conseil : un PDF pour la classe (bouton actif dès qu’un bulletin est lu).')],
          },
          {
            id: 'suivi', titre: 'Le suivi des élèves', puces: true,
            reponse: ['Partie <b>🗂 Suivi</b>, en haut : les <b>élèves à suivre</b> de la période (moyenne sous 10 ou nettement sous celle de la classe, forte baisse, plusieurs matières sous 10, travail ou comportement signalés, absences, rappels, seuils des informations incorporées).',
              'Pour chaque élève : <b>« + Note de suivi »</b> (entretien, appel aux parents…, avec une suite et un <b>rappel</b> daté ; « ✔ fait » quand c’est réglé).',
              'Les boutons <b>PAI</b> / <b>BEP</b>, et « 📋 Copier le suivi ».',
              'Ces notes restent dans ton espace PP : elles ne se mélangent pas avec tes appréciations de matière.'],
            guide: [ETAPES_PP.onglet, ETAPES_PP.section('suivi'),
              etapeZonePage('#vue .pp-alertes', 'Les élèves à suivre de la période, et pourquoi.'),
              etapeZonePage('#vue [data-pp="note-suivi"]', '« + Note de suivi » : entretien, appel, avec un rappel daté si besoin.')],
          },
          {
            id: 'infos', titre: 'Incorporer des informations : quoi ? pourquoi ?', puces: true,
            intro: 'Le bulletin ne dit pas tout : la vie scolaire, l’infirmerie, les sanctions complètent le tableau de chaque élève.',
            reponse: ['<b>Quoi ?</b> Un tableau d’<b>absences</b> et de retards, la <b>vie scolaire</b> d’École Directe (absences / retards, sanctions / punitions / incidents, dispenses), un relevé d’<b>infirmerie</b>…',
              '<b>Sous quelle forme ?</b> Excel (.xlsx, .csv), Word (.docx), PDF, ou un tableau copié sur la page École Directe et collé (Ctrl+V).',
              '<b>Pourquoi ?</b> Pour repérer les <b>élèves à suivre</b> (ex. dès 4 demi-journées d’absence), et voir ces chiffres dans les <b>fiches bilan du conseil</b> et le <b>🗂 Suivi</b>.',
              '<b>Comment ?</b> L’appli reconnaît chaque élève par son nom et son prénom, puis te montre un aperçu : garde les colonnes utiles, règle le seuil « élève à suivre dès », rattache les lignes non reconnues.',
              'Les listes « une ligne par événement » sont comptées élève par élève, seulement pour la <b>période affichée</b>.',
              '⚙ à côté de chaque source : des degrés d’alerte 🟡 vigilance, 🟠 alerte, 🔴 alerte forte, par sorte d’information. Un nouveau fichier du même nom remplace l’ancien ; 🗑 le retire.'],
            guide: [ETAPES_PP.onglet, ETAPES_PP.section('infos'),
              etapeZonePage('#vue .pp-contenu label.pp-depot', 'Choisis le fichier (Excel, PDF, Word)…'),
              etapeZonePage('#vue [data-pp-infos-coller]', '… ou colle ici le tableau copié sur la page École Directe.')],
          },
          {
            id: 'donnees', titre: 'Les données des bulletins : à savoir', puces: true,
            reponse: ['Les bulletins et les fichiers sont <b>lus sur l’appareil</b> : rien n’est envoyé, aucune intelligence artificielle en ligne.',
              'Seul l’utile est gardé (matières, moyennes, appréciations, absences), dans ton carnet <b>chiffré</b> sur la clé.',
              'La lecture d’un PDF dépend de sa mise en page : <b>vérifie</b> toujours ce qui a été lu (matières, moyennes, élève reconnu).',
              'Un PDF <b>scanné</b> (photo d’une feuille) ne se lit pas. Un PDF protégé sans mot de passe d’ouverture se lit.',
              'Fiches bilan, compte rendu copié : <b>non chiffrés</b> une fois sortis de l’appli.'],
          },
        ],
      },
      {
        id: 'enregistrer', icone: '💾', titre: 'Enregistrer, la clé, la tablette',
        enfants: [
          {
            id: 'bases', icone: '🧭', titre: 'Comprendre l’enregistrement',
            enfants: [
              {
                id: 'ou', titre: 'Où est mon carnet ?', puces: true,
                intro: 'Il n’y a pas de serveur : ton carnet est sur tes appareils, et nulle part ailleurs.',
                reponse: ['Chaque appareil garde <b>sa propre copie</b> du carnet, <b>dans le navigateur</b> : c’est elle qui sert quand tu travailles, même sans internet.',
                  'Le bouton <b>« Enregistrer »</b> (en haut à droite) en écrit une copie <b>chiffrée par ton mot de passe</b> à l’endroit choisi : <b>clé USB</b>, <b>dossier de l’appareil</b> ou <b>Drive</b>.',
                  'Ce fichier est ta <b>sauvegarde</b>, et c’est lui qui fait <b>passer</b> le carnet d’un appareil à l’autre.',
                  '⚠ Jamais enregistré ? Le carnet n’existe que dans ce navigateur : appareil perdu ou cassé, « données de navigation » effacées… et il est perdu.',
                  'Deux navigateurs sur le même ordinateur (ex. Edge et Chrome) = <b>deux carnets séparés</b>. Utilise toujours le même.'],
                guide: [ETAPES_ENR.menu,
                  dansMenuEnr('#menu-cle-etat', 'Ici : ce qui est enregistré, et ce qui ne l’est pas encore.'),
                  dansMenuEnr('#menu-cle-forme', 'Et là : comment c’est rangé sur cet appareil.')],
              },
              {
                id: 'enregistrer', titre: 'Enregistrer mon carnet',
                reponse: ['Touche <b>« Enregistrer »</b>, en haut à droite, puis le gros bouton du menu.',
                  'La première fois, l’appli demande <b>où</b> (clé, dossier de l’appareil ou Drive) et ton <b>mot de passe</b> (à taper deux fois).',
                  '<b>Sur ordinateur</b> : choisis le <b>dossier</b> une seule fois ; ensuite tout s’enregistre <b>tout seul</b>, quelques secondes après chaque modification.',
                  '<b>Sur tablette</b> : rien n’est automatique. Touche « Enregistrer » <b>avant de partir</b> (le bouton reste orange tant qu’il reste quelque chose à enregistrer).'],
                guide: [ETAPES_ENR.menu, ETAPES_ENR.enregistrer, ETAPES_ENR.finirFenetre],
              },
              {
                id: 'endroit', titre: 'Clé, ordinateur ou Drive : lequel choisir ?', puces: true,
                reponse: ['<b>🔑 Clé USB</b> : le plus prudent pour les données des élèves (rien ne sort de chez toi), et le moyen de passer d’un appareil à l’autre <b>sans internet</b>. Mais il faut l’avoir sur toi, et une clé se perd (son fichier reste illisible sans le mot de passe).',
                  '<b>💻 Ordinateur / 📱 Tablette</b> (dossier de l’appareil) : une copie sur place. Pratique, mais elle <b>ne protège pas</b> d’une panne, d’une perte ou d’un vol, et elle ne passe pas sur tes autres appareils.',
                  '<b>☁ Drive</b> (Google Drive, OneDrive, iCloud…) : le plus pratique entre plusieurs appareils, mais le fichier part chez un hébergeur, souvent <b>hors de l’Union européenne</b> (voir « Données des élèves et RGPD »).',
                  'Le choix est <b>propre à chaque appareil</b> : il se change dans le menu « Enregistrer », l’endroit actif est en bleu.',
                  'Sur ordinateur, tu peux aussi en avoir plusieurs à la fois : c’est l’<b>enregistrement couplé</b> (rubrique « La clé et l’ordinateur »).'],
                guide: [ETAPES_ENR.menu,
                  // (Drive jamais accepté, dossier de la tablette : une fenêtre d'avertissement s'ouvre à la place)
                  { ...dansMenuEnr('.endroits-cle', 'Touche l’endroit voulu : il devient bleu. Pour le Drive, l’appli te montre d’abord un avertissement.'), fait: () => !!modaleOuverte() },
                  ETAPES_ENR.finirFenetre],
              },
              {
                id: 'couleurs', titre: 'Les couleurs du bouton « Enregistrer »', puces: true,
                reponse: ['<b>Vert « Enregistré · 10:42 »</b> : tout est enregistré, à l’heure indiquée.',
                  '<b>Orange « Enregistrer »</b> : des modifications ne sont pas encore enregistrées (sur tablette, il clignote doucement).',
                  '<b>Bleu « Enregistrement… »</b> : l’appli est en train d’écrire, attends un instant.',
                  '<b>Rouge « Clé absente ? »</b> (ou « Drive introuvable ? ») : l’enregistrement automatique n’a pas pu écrire. Rebranche la clé, puis touche le bouton : rien n’est perdu.',
                  'Son <b>icône</b> montre l’endroit choisi (🔑, 💻, ☁). Le menu détaille ce qui attend : « 18 notes, 1 élève modifié… ».'],
                guide: [etapeZonePage('#btn-sauver', 'Sa couleur dit où en est l’enregistrement ; son icône, l’endroit choisi.'),
                  ETAPES_ENR.menu, dansMenuEnr('#menu-cle-etat', 'Le détail : ce qui est enregistré, ou ce qui attend encore.')],
              },
            ],
          },
          {
            id: 'ordinateur', icone: '🔑', titre: 'La clé et l’ordinateur',
            enfants: [
              {
                id: 'premiere', titre: 'La première fois sur un ordinateur',
                reponse: ['Branche ta clé, touche <b>« Enregistrer »</b> puis le gros bouton du menu.',
                  `Choisis un <b>dossier</b>, pas un fichier : sur la clé, crée-y un dossier <b>« ${profil().carnet} »</b> la première fois. Les fichiers ne s’affichent pas dans cette fenêtre : c’est normal.`,
                  'Le navigateur demande l’<b>autorisation</b> de modifier ce dossier : accepte.',
                  'L’appli y range <b>carnet-eps.json</b> (ton carnet : ne le renomme pas, ne le déplace pas) et le dossier <b>Sauvegardes</b> (copies datées). Ne choisis jamais « Sauvegardes » lui-même.',
                  'Un carnet est déjà dans ce dossier (fait sur un autre appareil) ? Il est <b>réuni</b> avec celui d’ici : rien n’est écrasé.'],
                guide: [ETAPES_ENR.menu, ETAPES_ENR.enregistrer, ETAPES_ENR.finirFenetre],
              },
              {
                id: 'auto', titre: 'L’enregistrement automatique', puces: true,
                reponse: ['Sur <b>ordinateur</b>, une fois le carnet ouvert, chaque modification s’enregistre <b>toute seule</b>, quelques secondes après (petit message « 💾 Enregistrement automatique ✔ »).',
                  'Au lancement, le bandeau <b>« ⬇ Ouvrir mon carnet »</b> le remet en route d’un clic : pour ta sécurité, le navigateur ne garde pas le mot de passe (ni, souvent, l’autorisation du dossier) d’une fois sur l’autre.',
                  'Nuance : bandeau fermé avec ✕ = <b>pas d’enregistrement automatique</b> pendant cette séance. Le bouton passe à l’orange : touche-le.',
                  'Après le déverrouillage de l’écran, le carnet est récupéré et l’enregistrement reprend sans clic.',
                  'Avant de fermer, si quelque chose n’est pas enregistré, l’appli te prévient.',
                  'Sur <b>tablette</b>, pas d’automatique : le système exige que tu touches l’écran pour écrire un fichier.'],
              },
              {
                id: 'couple', titre: '🔗 L’enregistrement couplé (clé + Drive + ordinateur)',
                intro: 'Sur ordinateur, un seul enregistrement met à jour tous tes endroits : ta sauvegarde existe en plusieurs exemplaires, toujours identiques.',
                reponse: ['Chaque endroit déjà utilisé <b>sur cet ordinateur</b> garde son dossier en mémoire : la clé, le dossier de l’ordinateur, le Drive.',
                  'À chaque enregistrement (à la main ou automatique), l’appli écrit d’abord à l’<b>endroit choisi</b> (en bleu dans le menu), puis met aussi à jour les <b>autres dossiers retenus qui sont là</b> : clé branchée, Drive présent.',
                  'Elle <b>lit d’abord</b> le carnet de chacun et le <b>réunit</b> au tien (ex. un fichier posé sur le Drive par la tablette), puis écrit <b>la même version complète partout</b>.',
                  'Pour le mettre en place : dans le menu, choisis un autre endroit, touche « Enregistrer » et choisis son dossier ; recommence pour chaque endroit, puis remets ton endroit principal. La ligne <b>« 🔗 Mis à jour en même temps… »</b> du menu les liste.',
                  'Après chaque enregistrement à la main, le message le dit : <b>« Aussi à jour : ☁ Drive »</b>, ou <b>« Pas joignable : 🔑 Clé USB »</b> (elle sera rattrapée quand elle sera branchée).'],
                guide: [ETAPES_ENR.menu,
                  dansMenuEnr('#menu-cle-couple', 'Les endroits mis à jour en même temps que l’endroit choisi, s’ils sont là.',
                    'Pas de ligne 🔗 ici : un seul endroit est retenu sur cet appareil (ou c’est une tablette, qui n’enregistre qu’à un endroit). Enregistre une fois sur un autre endroit pour le coupler.'),
                  dansMenuEnr('.endroits-cle', 'Ton endroit principal est en bleu. Pour en ajouter un : touche-le, « Enregistrer », choisis son dossier, puis reviens au bleu d’avant.')],
              },
              {
                id: 'couple-limites', titre: 'Enregistrement couplé : nuances et limites', puces: true,
                reponse: ['<b>Ordinateur seulement</b> : une tablette n’enregistre qu’à un endroit à la fois (le système ne lui laisse garder aucun dossier).',
                  'Seulement les dossiers déjà utilisés <b>sur cet ordinateur, dans ce navigateur</b> : un autre ordinateur a sa propre liste.',
                  'Un endroit <b>absent</b> (clé pas branchée) est simplement sauté : il garde son ancienne version jusqu’à la prochaine fois où il sera là.',
                  'En <b>automatique</b>, seuls les dossiers déjà autorisés pendant la séance sont mis à jour ; un enregistrement <b>à la main</b> peut redemander l’autorisation.',
                  'Un carnet chiffré avec un <b>autre mot de passe</b>, ou illisible, n’est <b>jamais réécrit</b> : « ⚠ Autre mot de passe, laissé tel quel ».',
                  'Les <b>copies datées</b> (« Sauvegardes ») se font dans chaque dossier lors d’un enregistrement <b>à la main</b>, pas en automatique.',
                  '⚠ Un <b>Drive</b> retenu reçoit le carnet <b>à chaque enregistrement</b>, même si ton endroit principal est la clé : à savoir pour le RGPD.',
                  'Un endroit retenu ne s’oublie pas encore depuis l’appli : il est seulement sauté quand il n’est pas joignable.'],
              },
              {
                id: 'copies', titre: 'Les copies datées et « Restaurer »', puces: true,
                reponse: ['À chaque enregistrement <b>à la main</b> sur ordinateur, une copie datée va dans <b>Sauvegardes</b> (ex. carnet-eps_2026-10-29_16h05.json), chiffrée comme le carnet.',
                  'Le ménage est automatique : les <b>20 plus récentes</b>, puis <b>une par semaine</b> sur le dernier mois et <b>une par mois</b> avant.',
                  '<b>Restaurer une copie</b> (Enregistrer › Aide et dépannage) sert à <b>retrouver un carnet perdu</b> : tablette changée, données du navigateur effacées.',
                  'Nuance : restaurer <b>ajoute</b> la copie à ce qui est ici, sans rien effacer, et le plus récent gagne. Sur un appareil qui a déjà le carnet, une copie ancienne ne change donc presque rien : ce n’est pas un retour en arrière.',
                  'Pour défaire une erreur toute récente (note effacée, élève supprimé) : la flèche <b>↶</b>, en haut.'],
                guide: [ETAPES_ENR.menu, ETAPES_ENR.depannage,
                  etapeZone(fenetreDepannage, '.mes-donnees label.carte-secours', '« Restaurer une copie » : choisis la copie la plus récente (la date est dans son nom), puis tape ton mot de passe.')],
              },
              {
                id: 'secours', titre: 'Faire une copie de secours',
                reponse: ['Touche <b>« Enregistrer »</b>, puis <b>« Aide et dépannage… »</b>, en bas du menu.',
                  'Touche <b>« 📦 Faire une copie de secours »</b> : une copie complète, protégée par ton mot de passe.',
                  'De temps en temps, garde-en une <b>ailleurs</b> que d’habitude (deuxième clé, ordinateur) : une clé peut se perdre ou s’abîmer.'],
                guide: [ETAPES_ENR.menu, ETAPES_ENR.depannage,
                  etapeBouton('dialog[open] [data-cle="secours"]', 'Touche « 📦 Faire une copie de secours ».', () => !fenetreDepannage()),
                  ETAPES_ENR.finirFenetre],
              },
              {
                id: 'probleme', titre: 'Clé absente, mot de passe refusé…', puces: true,
                reponse: ['<b>« Clé absente ? »</b> en rouge : rebranche la clé et touche le bouton. Tout est encore dans le navigateur, rien n’est perdu.',
                  '<b>« Dossier introuvable »</b> : la clé a changé de lettre, ou le dossier a été déplacé. Enregistrer › Aide et dépannage › Plus d’options › <b>« Changer de dossier »</b>.',
                  '<b>« Mot de passe incorrect »</b> : vérifie les majuscules. Après un changement de mot de passe, un vieux fichier peut demander l’<b>ancien</b>.',
                  '<b>« Fichier avec un autre mot de passe »</b> : tape l’ancien pour le reprendre, ou « Passer » (il sera proposé à nouveau la prochaine fois).',
                  'L’appli n’est pas à jour ? Aide et dépannage › Plus d’options › <b>« 🔄 Mettre à jour l’appli »</b> (tes données ne bougent pas).'],
                guide: [ETAPES_ENR.menu, ETAPES_ENR.depannage,
                  etapeZone(fenetreDepannage, '.plus-options summary', 'Dans « Plus d’options » : changer de dossier, oublier le mot de passe, mettre l’appli à jour.')],
              },
            ],
          },
          {
            id: 'tablette', icone: '📱', titre: 'La tablette',
            enfants: [
              {
                id: 'enregistrer', titre: 'Enregistrer depuis la tablette (en partant)',
                reponse: ['Touche <b>« Enregistrer »</b> en haut, puis <b>« ⬆ Enregistrer »</b>.',
                  'Tape ton mot de passe si demandé, puis le bouton de la fenêtre <b>« Fichier prêt »</b>.',
                  'Dans la fenêtre de la tablette, va sur ta <b>clé USB</b> (ou ton Drive), dans le <b>dossier du carnet</b> (celui de carnet-eps.json), et enregistre.',
                  'Le fichier s’appelle <b>carnet-eps-tablette_date_heure.json</b> : il se pose <b>à côté</b> de carnet-eps.json. Ne remplace rien, ne renomme rien.',
                  'L’ordinateur le reprend tout seul à son prochain enregistrement, puis le retire (son contenu est alors dans carnet-eps.json).'],
                guide: [ETAPES_ENR.menu, ETAPES_ENR.enregistrer, ETAPES_ENR.finirFenetre],
              },
              {
                id: 'recuperer', titre: 'Récupérer sur la tablette (en arrivant)',
                reponse: ['Touche <b>« Enregistrer »</b> en haut, puis <b>« ⬇ Récupérer »</b> (ou, au lancement, le bandeau « Choisir les fichiers »).',
                  'Va dans le dossier du carnet (clé ou Drive) et choisis les <b>.json</b> : <b>un ou plusieurs</b>, même tous.',
                  'L’appli les réunit dans l’ordre des dates : un fichier ancien choisi en trop ne fait rien perdre.',
                  'Tape ton mot de passe : un message dit ce qui a été mis à jour.'],
                guide: [ETAPES_ENR.menu,
                  { ...etapeBouton('#menu-cle:not([hidden]) [data-menu-cle-fichier]', 'Touche « Récupérer », puis choisis les fichiers .json du dossier du carnet.', () => !menuEnrOuvert()),
                    sinon: Cle.accesDirect ? 'Sur ordinateur, pas de bouton à part : « Enregistrer / Récupérer » fait les deux à la fois.' : MENU_FERME },
                  ETAPES_ENR.finirFenetre],
              },
              {
                id: 'aller-retour', titre: 'Travailler sur la tablette ET sur l’ordinateur',
                reponse: ['<b>En arrivant</b> sur un appareil : <b>Récupérer</b>. <b>En partant</b> : <b>Enregistrer</b>. C’est tout.',
                  'Sur l’<b>ordinateur</b>, c’est presque tout seul : bandeau « Ouvrir mon carnet » au lancement, puis enregistrement automatique.',
                  'Sur la <b>tablette</b> : ⬇ Récupérer en arrivant (choisis les .json), ⬆ Enregistrer en partant (pose le fichier à côté de carnet-eps.json).',
                  `Le <b>même endroit</b> des deux côtés : la même clé, ou le même dossier « ${profil().carnet} » du même Drive. Et le <b>même mot de passe</b>.`,
                  'Oublié de récupérer avant de travailler ? <b>Pas grave</b> : récupère maintenant, les deux travaux sont réunis.'],
              },
              {
                id: 'seule', titre: 'Enregistrer sur la tablette elle-même', puces: true,
                reponse: [`L’endroit <b>📱 Tablette</b> écrit <b>carnet-eps.json</b> dans un dossier de la tablette (ex. Documents › ${profil().carnet}). S’il demande de remplacer : oui, c’est la version à jour.`,
                  '⚠ C’est une <b>copie sur place</b> : elle ne passe pas sur l’ordinateur, et elle disparaît si la tablette est perdue, cassée ou réinitialisée.',
                  'Une fois par mois, l’appli te rappelle de faire une <b>copie de secours</b> sur ta clé ou ton Drive (Enregistrer › Aide et dépannage › 📦).'],
                guide: [ETAPES_ENR.menu, ETAPES_ENR.depannage,
                  etapeZone(fenetreDepannage, '[data-cle="secours"]', '« Faire une copie de secours » : à poser sur ta clé ou ton Drive, une fois par mois.')],
              },
              {
                id: 'appareils', titre: 'iPad, Android : à savoir', puces: true,
                reponse: ['<b>iPad</b> : ajoute l’appli à l’<b>écran d’accueil</b> (Partager › « Sur l’écran d’accueil »). Sinon Safari peut <b>effacer</b> ses données après 7 jours sans utilisation.',
                  'iPad : il faut <b>iPadOS 16.4</b> ou plus récent pour lire un carnet enregistré par l’ordinateur.',
                  '<b>Android</b> : selon la tablette, le fichier arrive dans <b>Téléchargements</b> ; déplace-le alors sur la clé avec l’appli « Mes fichiers » (l’appli te le rappelle). Pour le Drive, choisis l’appli Drive dans le menu de partage.',
                  'Dans Enregistrer › Aide et dépannage, la ligne <b>« Copie dans ce navigateur : durable ✔ »</b> dit si l’appareil s’engage à garder les données.'],
              },
            ],
          },
          {
            id: 'reunion', icone: '🔄', titre: 'Plusieurs appareils : comment tout est réuni', puces: true,
            reponse: ['L’appli ne remplace jamais un carnet par un autre : elle les <b>réunit information par information</b> (une note, une remarque, un champ d’une fiche).',
              `Ex. une remarque saisie sur la tablette et ${eps ? 'une dispense' : 'un PAI'} saisi${eps ? 'e' : ''} sur l’ordinateur pour le même élève : <b>les deux sont gardées</b>.`,
              'Une <b>même information</b> modifiée sur deux appareils (la même note) : seule la <b>plus récente</b> reste.',
              'Les <b>suppressions</b> voyagent aussi : un élève supprimé sur un appareil disparaît des autres à la réunion.',
              'Nuance : « la plus récente » se juge à l’<b>heure de l’appareil</b>. Garde la date et l’heure automatiques sur tous tes appareils.',
              'Nuance : <b>↶</b> défait ce qui a été fait sur cet appareil, pas ce qui est arrivé d’un autre.'],
          },
          {
            id: 'securite', icone: '🔒', titre: 'Mot de passe et sécurité',
            enfants: [
              {
                id: 'mdp', titre: 'Le mot de passe du carnet', puces: true,
                reponse: ['Il <b>chiffre</b> le carnet enregistré (AES-256) : sans lui, le fichier est illisible pour qui le trouve… et <b>pour toi aussi</b>.',
                  '<b>Aucune récupération possible</b> : ni l’appli ni personne ne peut retrouver un mot de passe oublié. Note-le dans un endroit sûr.',
                  'Le <b>même</b> sur tous tes appareils. Au moins 8 caractères ; le plus simple : une petite phrase facile à retenir.',
                  'L’appareil ne garde qu’une <b>empreinte</b> pour le vérifier (verrouillage de l’écran), jamais le mot de passe lui-même.'],
              },
              {
                id: 'changer', titre: 'Changer le mot de passe',
                reponse: ['Sur l’<b>ordinateur</b>, clé branchée : <b>⚙ Réglages du carnet</b> › <b>🔒 Sécurité</b> › <b>« 🔑 Changer le mot de passe… »</b>.',
                  'Tape l’actuel, puis deux fois le nouveau. Tout ce qui est sur la clé est d’abord réuni : rien ne se perd.',
                  'Laisse cochée <b>« Rechiffrer aussi les anciennes copies datées »</b> : sinon il faudra l’ancien pour les ouvrir.',
                  'Sur tes autres appareils : <b>Récupérer</b>, et taper le <b>nouveau</b> mot de passe.',
                  'Nuance : les endroits couplés présents passent au nouveau ; un endroit absent garde l’ancien (l’appli te demandera l’ancien pour le reprendre).'],
                guide: [ETAPES_ENR.reglages, ETAPES_ENR.securite,
                  zoneSecurite('button[value="mdp"]', 'Touche « 🔑 Changer le mot de passe… » (sur ordinateur, clé branchée).')],
              },
              {
                id: 'verrou', titre: 'Verrouiller l’écran',
                reponse: ['<b>🔒</b>, en haut, verrouille tout de suite ; le carnet se rouvre avec le mot de passe.',
                  'Verrouillage automatique : <b>⚙ Réglages du carnet</b> › <b>🔒 Sécurité</b> › « Verrouiller après… » (10 min par défaut ; propre à chaque appareil).',
                  'Pour qu’il marche, l’appareil doit connaître le mot de passe : enregistre ou récupère une fois.',
                  '⚠ C’est un <b>écran de protection</b> (un élève ou un collègue devant la tablette) : il ne chiffre pas les données de l’appareil.'],
                guide: [ETAPES_ENR.reglages, ETAPES_ENR.securite,
                  zoneSecurite('[data-verrou-minutes]', 'Choisis au bout de combien de temps sans activité l’écran se verrouille (enregistré tout de suite).')],
              },
              {
                id: 'autre-poste', titre: 'Sur un ordinateur qui n’est pas le mien', puces: true,
                reponse: ['Évite d’y ouvrir le carnet : sa copie resterait dans le navigateur de cet ordinateur, <b>sans chiffrement</b>.',
                  'Si tu dois le faire : enregistre sur ta clé, puis Enregistrer › Aide et dépannage › Plus d’options › <b>« Oublier le mot de passe sur cet appareil »</b>.',
                  'Puis efface les <b>données du site</b> dans le navigateur (Paramètres › Confidentialité › cookies et données des sites).',
                  'Ne laisse jamais le navigateur d’un poste partagé « enregistrer le mot de passe ».'],
              },
            ],
          },
          {
            id: 'rgpd', icone: '⚖️', titre: 'Données des élèves et RGPD',
            enfants: [
              {
                id: 'principe', titre: 'Où vont les données des élèves ?', puces: true,
                reponse: ['Nulle part : <b>ni serveur, ni compte, ni prestataire</b>. L’appli fonctionne entièrement sur ton appareil, même sans internet.',
                  'Elle est même <b>empêchée</b> d’envoyer quoi que ce soit (règle de sécurité du navigateur) : internet ne sert qu’à télécharger les mises à jour de l’appli, sans aucune donnée.',
                  'Lecture des PDF et des fichiers Excel, trombinoscopes, appréciations proposées : tout est fait <b>par l’appli, sur l’appareil</b>. Aucune intelligence artificielle en ligne ne voit tes élèves.',
                  'Les données ne sortent que si <b>toi</b> tu les sors : fichier enregistré (chiffré), export Excel, impression, PDF.'],
              },
              {
                id: 'protege', titre: 'Ce qui est protégé… et ce qui ne l’est pas', puces: true,
                reponse: ['✔ <b>Le fichier enregistré</b> (clé, dossier, Drive, copies datées, fichiers de la tablette) : chiffré AES-256 par ton mot de passe, avec les documents joints (PAI, BEP…) et les photos.',
                  '⚠ <b>La copie du navigateur n’est pas chiffrée</b> : protège l’appareil lui-même (code de verrouillage, session à ton nom, appareil personnel).',
                  '⚠ Le <b>verrouillage de l’écran</b> du carnet est un garde-fou, pas un chiffrement.',
                  '⚠ <b>Exports Excel, PDF, impressions</b> : pas chiffrés. Range-les avec soin, supprime-les quand ils ne servent plus, et coche <b>« Anonyme »</b> dans les exports Excel quand les noms sont inutiles.'],
              },
              {
                id: 'drive', titre: 'Le Drive et le RGPD', puces: true,
                reponse: ['Un Drive grand public (Google, Microsoft, Apple) héberge souvent les fichiers <b>hors de l’Union européenne</b>.',
                  'Ton fichier y est <b>chiffré</b> : l’hébergeur ne peut pas le lire sans ton mot de passe. C’est une vraie protection…',
                  '… mais ce n’est <b>pas une solution validée</b> pour des données d’élèves : elles restent <b>sous ta responsabilité</b>.',
                  'Demande l’avis de ton établissement (chef d’établissement, <b>DPO</b>) avant de t’en servir. La <b>clé USB</b> reste le choix le plus prudent.',
                  'Avec l’<b>enregistrement couplé</b>, un Drive retenu sur l’ordinateur reçoit le carnet <b>à chaque enregistrement</b>, même si ton endroit principal est la clé.',
                  'Ici, c’est ton mot de passe seul qui protège le fichier : choisis-le solide.'],
              },
              {
                id: 'pratiques', titre: 'Les bonnes pratiques', puces: true,
                reponse: [`Ne note que ce qui sert à l’enseignement : <b>pas de diagnostic</b> ni de détail médical (${eps ? '« dispensé », « PAI », « pratique adaptée »' : '« PAI », « aménagement »'} suffisent), pas de jugement sans rapport avec le cours.`,
                  'Coordonnées des responsables : ne les garde que si elles te servent.',
                  '<b>Fin d’année</b> : supprime les classes devenues inutiles (au plus tard à la fin de l’année scolaire suivante), puis enregistre. Les anciennes copies datées de « Sauvegardes » et les fichiers de la tablette les contiennent encore : supprime-les aussi.',
                  'Signale l’utilisation du carnet à ton établissement (registre des traitements) : une <b>fiche d’information RGPD</b> existe pour le chef d’établissement et le DPO.',
                  'Appareil ou clé perdu : préviens ton établissement. Le fichier chiffré ne risque rien sans le mot de passe ; la copie du navigateur dépend du verrouillage de l’appareil.'],
              },
            ],
          },
          {
            id: 'limites', icone: '⚠️', titre: 'Nuances et limites à connaître', puces: true,
            reponse: ['La copie du navigateur peut être <b>effacée</b> : « effacer les données de navigation », logiciel de nettoyage, manque de place, Safari sur iPad sans écran d’accueil. Seul un enregistrement te protège.',
              'Une copie sur le <b>même appareil</b> (💻 / 📱) ne protège ni d’une panne ni d’un vol : garde aussi une copie sur la clé ou un Drive.',
              '<b>Tablette</b> : rien d’automatique, ni l’enregistrement ni la lecture de la clé. Il faut toucher « Enregistrer » et « Récupérer ».',
              '<b>Mot de passe oublié</b> = fichiers enregistrés illisibles, définitivement.',
              'Une <b>même information</b> modifiée sur deux appareils : seule la plus récente reste (d’après l’heure des appareils).',
              '<b>Restaurer</b> une copie ajoute son contenu : ce n’est pas un retour en arrière.',
              'L’<b>enregistrement couplé</b> ne marche que sur ordinateur, et seulement avec les endroits présents à ce moment.',
              'Une <b>clé</b> se perd, se casse : fais de temps en temps une copie de secours ailleurs.',
              'Ce qui sort de l’appli (Excel, PDF, impressions) n’est plus protégé par elle.'],
          },
        ],
      },
    ],
  };
}

/* ---------- La bulle et le panneau ---------- */

const hugo = { chemin: [], vue: null }; // chemin = ids depuis la racine ; vue = 'merci' | null

function noeudHugo(chemin = hugo.chemin) {
  let n = rubriquesAide();
  for (const id of chemin) n = n.enfants?.find(x => x.id === id) || n;
  return n;
}

function installerHugo() {
  const b = document.createElement('button');
  b.id = 'hugo-bouton'; b.type = 'button'; b.dataset.hugo = 'ouvrir';
  b.title = 'Besoin d’aide ? Demande à Hugo'; b.setAttribute('aria-label', 'Aide');
  b.innerHTML = teteHugo(7, true);
  const p = document.createElement('section');
  p.id = 'hugo-panneau'; p.hidden = true; p.setAttribute('aria-label', 'Aide de Hugo');
  document.body.append(b, p);
}

// Petit écran (téléphone, fenêtre étroite ou très basse) : les rubriques se déplient sur place (accordéon),
// au lieu de passer d'une page à l'autre ; le panneau prend toute la largeur, en bas de l'écran.
// (même seuil que le CSS de #hugo-panneau)
const ECRAN_DEROULANT = matchMedia('(max-width: 700px), (max-height: 560px)');
// (tablette tournée, fenêtre redimensionnée : on redessine si le mode change ; « resize » en plus de l'événement
// du media query, que certains navigateurs n'envoient pas)
const suivreEcranHugo = () => {
  const p = $('#hugo-panneau');
  if (p && !p.hidden && p.classList.contains('deroulant') !== ECRAN_DEROULANT.matches) dessinerHugo();
};
ECRAN_DEROULANT.addEventListener?.('change', suivreEcranHugo);
addEventListener('resize', suivreEcranHugo);
hugo.ouverts = new Set(); // rubriques dépliées (chemins « notes/creer »), gardées d'une ouverture à l'autre

// Réponse à une question (texte, puis « Ça t'a aidé ? ») ; chemin : pour « Montre-moi » depuis l'accordéon.
function htmlReponseHugo(n, chemin = null) {
  const liste = n.puces ? 'ul' : 'ol'; // (puces : points à savoir, sans ordre ; sinon étapes numérotées)
  const ici = chemin === null ? '' : ` data-hugo-chemin="${esc(chemin)}"`;
  return `${n.intro ? `<p class="hugo-intro">${n.intro}</p>` : ''}<${liste} class="hugo-reponse">${n.reponse.map(l => `<li>${l}</li>`).join('')}</${liste}>
    <p class="hugo-dit">Ça t’a aidé ?</p>
    <div class="hugo-choix"><button type="button" data-hugo="merci">👍 Oui, merci</button>
      ${n.guide ? `<button type="button" class="primaire" data-hugo="montrer"${ici}>🙋 Non, montre-moi sur l’écran</button>` : ''}</div>`;
}

// Accordéon : un panneau dépliant par rubrique, sous-rubrique et question.
function htmlDeroulantHugo(n, chemin) {
  const ouvert = hugo.ouverts.has(chemin) ? ' open' : '';
  const titre = `${n.icone ? `<span class="hugo-icone" aria-hidden="true">${n.icone}</span>` : ''}<span>${esc(n.titre)}</span>`;
  if (n.bientot) return `<div class="hugo-deroulant hugo-bientot">${titre}<small>bientôt</small></div>`;
  return `<details class="hugo-deroulant${n.reponse ? ' hugo-feuille' : ''}" data-hugo-ouvre="${esc(chemin)}"${ouvert}><summary>${titre}</summary>
    <div class="hugo-sous">${n.reponse ? htmlReponseHugo(n, chemin) : n.enfants.map(x => htmlDeroulantHugo(x, chemin + '/' + x.id)).join('')}</div></details>`;
}

/* ---------- Recherche par mot-clé ----------
   Toutes les rubriques et questions (titres, explications) mises à plat, avec leur chemin dans l'arbre ; la recherche
   ignore accents, majuscules et pluriels, accepte un début de mot et quelques synonymes du quotidien. Un résultat
   touché amène directement sur sa branche (page de la question, ou accordéon déplié sur téléphone). */

// Mots que l'enseignant tape → mots employés dans l'aide.
const SYNONYMES_HUGO = {
  sauvegard: 'enregistr', sauver: 'enregistr', perdu: 'recuper', usb: 'cle', photo: 'trombinoscope', trombi: 'trombinoscope',
  note: 'evaluation', devoir: 'evaluation', controle: 'evaluation', moyenne: 'note', bareme: 'bareme', grille: 'bareme',
  competence: 'competence', degre: 'competence', absence: 'absent', dispense: 'dispense', handicap: 'pai', pap: 'bep',
  liste: 'eleve', pronote: 'pronote', ecole: 'ecole', seance: 'lecon', cours: 'lecon', bulletin: 'appreciation',
  conseil: 'conseil', pp: 'principal', mdp: 'mot de passe', password: 'mot de passe', ipad: 'tablette', telephone: 'tablette',
  imprimer: 'pdf', supprimer: 'supprimer', effacer: 'supprimer', chrono: 'chrono', equipe: 'equipe',
};
const normHugo = s => sansAccent(String(s || '').replace(/<[^>]*>/g, ' ')).toLowerCase().replace(/[’']/g, ' ');
const racineMot = m => (m.length > 3 ? m.replace(/[sx]$/, '') : m).slice(0, 9); // (pluriels, et mots longs comparés sur leur début)
const motsHugo = s => normHugo(s).split(/[^a-z0-9]+/).filter(m => m.length > 1).map(racineMot);

// Liste à plat : { chemin: [ids], titre, fil (rubriques au-dessus), feuille, mots… }.
function indexHugo() {
  const l = [];
  const parcourir = (n, chemin, fil) => (n.enfants || []).forEach(x => {
    if (x.bientot) return;
    const ch = [...chemin, x.id];
    l.push({ chemin: ch, titre: x.titre, icone: x.icone, fil, feuille: !!x.reponse,
      motsTitre: motsHugo(x.titre), motsFil: motsHugo(fil.join(' ')), motsTexte: motsHugo([x.intro, ...(x.reponse || [])].join(' ')) });
    parcourir(x, ch, [...fil, x.titre]);
  });
  parcourir(rubriquesAide(), [], []);
  return l;
}

// Petits mots d'une question tapée en entier (« comment je mets une note ? ») : ignorés.
const MOTS_VIDES_HUGO = new Set('comment pourquoi quoi quand ou faire fait je j tu le la les un une de du des mon ma me mes ton ta tes on est ce cet cette que qui pour dans sur et en il elle au aux se sa son ses ne pas peut puis avec par veux voudrai faut il y a'.split(' ').map(racineMot));

function chercherHugo(texte) {
  const tapes = motsHugo(texte).filter(m => !MOTS_VIDES_HUGO.has(m));
  // Une idée par mot tapé : le mot et ses synonymes (on garde le meilleur des deux, sans les additionner).
  const idees = tapes.map(m => {
    const syn = Object.entries(SYNONYMES_HUGO).find(([k]) => m.startsWith(racineMot(k)) || racineMot(k).startsWith(m) && m.length >= 4);
    return syn ? [m, ...motsHugo(syn[1])] : [m];
  });
  if (!idees.length) return [];
  const touche = (mots, m) => mots.some(x => x.startsWith(m) || (m.length >= 5 && m.startsWith(x) && x.length >= 4));
  return indexHugo().map(x => {
    let score = 0, trouves = 0;
    for (const idee of idees) {
      const s = Math.max(...idee.map(m => (touche(x.motsTitre, m) ? 6 : 0) + (touche(x.motsFil, m) ? 2 : 0) + (touche(x.motsTexte, m) ? 1 : 0)));
      if (s) trouves++;
      score += s;
    }
    // (les mots tapés doivent presque tous se retrouver, synonymes compris)
    return { ...x, score: trouves >= Math.max(1, Math.round(idees.length * 0.6)) ? score + (x.feuille ? 1 : 0) : 0 };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score || a.chemin.length - b.chemin.length || a.titre.length - b.titre.length).slice(0, 8); // (à égalité : la question la plus générale)
}

function htmlResultatsHugo(texte) {
  if (!texte.trim()) return '';
  const r = chercherHugo(texte);
  if (!r.length) return `<p class="hugo-dit">Je n’ai rien trouvé pour « ${esc(texte.trim())} ». Essaie un autre mot : note, barème, photo, clé, absent…</p>`;
  return `<ul class="hugo-liste hugo-resultats-liste">${r.map(x => `<li><button type="button" data-hugo-aller="${esc(x.chemin.join('/'))}">
    ${x.icone ? `<span class="hugo-icone" aria-hidden="true">${x.icone}</span>` : ''}<span><span class="hugo-res-titre">${esc(x.titre)}</span>
    ${x.fil.length ? `<small class="hugo-fil">${esc(x.fil.join(' › '))}</small>` : ''}</span><span class="hugo-fleche">›</span></button></li>`).join('')}</ul>`;
}

// Aller à une branche trouvée : sa page (grand écran) ou l'accordéon déplié jusqu'à elle (petit écran).
function allerHugo(chemin) {
  hugo.recherche = ''; hugo.vue = null;
  hugo.chemin = chemin;
  if (ECRAN_DEROULANT.matches) {
    chemin.forEach((_, k) => hugo.ouverts.add(chemin.slice(0, k + 1).join('/')));
    hugo.chemin = [];
  }
  dessinerHugo();
  const cible = ECRAN_DEROULANT.matches ? $(`#hugo-panneau [data-hugo-ouvre="${CSS.escape(chemin.join('/'))}"]`) : $('#hugo-panneau .hugo-corps');
  cible?.classList.add('hugo-trouve');
  cible?.scrollIntoView({ block: 'start' });
}

// Fil d'Ariane de la page affichée (grand écran) : où l'on est dans l'arbre.
function filHugo() {
  const noms = [];
  let n = rubriquesAide();
  for (const id of hugo.chemin.slice(0, -1)) { n = n.enfants?.find(x => x.id === id); if (!n) break; noms.push(n.titre); }
  return noms.length ? `<p class="hugo-fil hugo-fil-page">📍 ${esc(noms.join(' › '))}</p>` : '';
}

function dessinerHugo() {
  const p = $('#hugo-panneau'), n = noeudHugo(), deroulant = ECRAN_DEROULANT.matches;
  p.classList.toggle('deroulant', deroulant);
  const entete = `<header class="hugo-entete">${teteHugo()}<b>Hugo</b><span class="espace"></span>
    <button type="button" class="icone-petit" data-hugo="fermer" aria-label="Fermer l’aide">✕</button></header>`;
  const retour = (!deroulant && hugo.chemin.length) || hugo.vue ? '<button type="button" class="lien hugo-retour" data-hugo="retour">← Retour</button>' : '';
  let corps;
  if (hugo.vue === 'merci') {
    corps = `<p class="hugo-dit">Super ! 😊 Je reste là, en bas ${deroulant ? '' : 'à droite'}, si tu as une autre question.</p>`;
  } else if (deroulant) {
    const racine = rubriquesAide();
    corps = `<p class="hugo-dit">Salut, moi c’est Hugo ! ${esc(racine.titre)} <small>Touche un thème pour le déplier.</small></p>
      <div class="hugo-arbre">${racine.enfants.map(x => htmlDeroulantHugo(x, x.id)).join('')}</div>`;
  } else if (n.reponse) {
    corps = `${filHugo()}<h3 class="hugo-question">${esc(n.titre)}</h3>${htmlReponseHugo(n)}`;
  } else {
    corps = `${filHugo()}<p class="hugo-dit">${hugo.chemin.length ? esc(n.titre) + ' : quelle est ta question ?' : 'Salut, moi c’est Hugo ! ' + esc(n.titre)}</p>
      <ul class="hugo-liste">${n.enfants.map(x => `<li><button type="button" data-hugo-noeud="${esc(x.id)}" ${x.bientot ? 'disabled' : ''}>
        ${x.icone ? `<span class="hugo-icone" aria-hidden="true">${x.icone}</span>` : ''}<span>${esc(x.titre)}</span>
        <span class="hugo-fleche">${x.bientot ? 'bientôt' : '›'}</span></button></li>`).join('')}</ul>`;
  }
  // Recherche en haut des rubriques (pas sur l'écran « merci ») ; ses résultats remplacent la liste tant qu'on tape.
  const q = hugo.recherche || '';
  const recherche = hugo.vue ? '' : `<div class="hugo-recherche"><input type="search" id="hugo-recherche" value="${esc(q)}"
    placeholder="🔍 Un mot-clé : note, barème, photo, clé…" aria-label="Chercher dans l’aide" autocomplete="off" spellcheck="false"></div>
    <div class="hugo-resultats" ${q.trim() ? '' : 'hidden'}>${htmlResultatsHugo(q)}</div>`;
  p.innerHTML = `${entete}${recherche}<div class="hugo-corps" ${q.trim() && !hugo.vue ? 'hidden' : ''}>${retour}${corps}</div>`;
}

// Frappe dans la recherche : seuls les résultats sont redessinés (le champ garde le curseur).
document.addEventListener('input', e => {
  if (e.target.id !== 'hugo-recherche') return;
  hugo.recherche = e.target.value;
  const r = $('#hugo-panneau .hugo-resultats'), vide = !hugo.recherche.trim();
  r.innerHTML = htmlResultatsHugo(hugo.recherche);
  r.hidden = vide;
  $('#hugo-panneau .hugo-corps').hidden = !vide;
});
// Entrée : le premier résultat ; Échap : on efface la recherche (un second Échap ferme l'aide).
document.addEventListener('keydown', e => {
  if (e.target.id !== 'hugo-recherche') return;
  if (e.key === 'Enter') { e.preventDefault(); $('#hugo-panneau [data-hugo-aller]')?.click(); }
  if (e.key === 'Escape' && e.target.value) { e.preventDefault(); e.stopImmediatePropagation(); e.target.value = ''; e.target.dispatchEvent(new Event('input', { bubbles: true })); }
}, true);

// Accordéon : on retient ce qui est déplié ; un seul panneau ouvert par niveau (la liste reste courte sur un téléphone),
// et la question ouverte remonte en haut de l'écran.
document.addEventListener('toggle', e => {
  const d = e.target;
  if (!d.matches?.('#hugo-panneau details[data-hugo-ouvre]')) return;
  const chemin = d.dataset.hugoOuvre;
  if (!d.open) { // (replié : ce qu'il contient se replie aussi)
    [...hugo.ouverts].filter(c => c === chemin || c.startsWith(chemin + '/')).forEach(c => hugo.ouverts.delete(c));
    d.querySelectorAll('details[open]').forEach(x => { x.open = false; });
    return;
  }
  hugo.ouverts.add(chemin);
  [...d.parentElement.children].forEach(x => { if (x !== d && x.matches('details[open]')) x.open = false; });
  d.querySelector('summary').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}, true);

function ouvrirHugo(ouvrir = $('#hugo-panneau').hidden) {
  arreterGuideHugo();
  $('#hugo-panneau').hidden = !ouvrir;
  $('#hugo-bouton').classList.toggle('ouvert', ouvrir);
  if (ouvrir) { hugo.vue = null; dessinerHugo(); }
}

document.addEventListener('click', e => {
  const t = e.target.closest?.('[data-hugo], [data-hugo-noeud], [data-hugo-aller]');
  if (!t) return;
  const d = t.dataset;
  if (d.hugoAller) return allerHugo(d.hugoAller.split('/'));
  if (d.hugoNoeud) { hugo.chemin.push(d.hugoNoeud); hugo.vue = null; return dessinerHugo(); }
  switch (d.hugo) {
    case 'ouvrir': return ouvrirHugo();
    case 'fermer': return ouvrirHugo(false);
    case 'retour': if (hugo.vue) hugo.vue = null; else hugo.chemin.pop(); return dessinerHugo();
    case 'merci': hugo.vue = 'merci'; hugo.chemin = []; return dessinerHugo();
    case 'montrer': {
      if (d.hugoChemin) hugo.chemin = d.hugoChemin.split('/'); // (depuis l'accordéon du petit écran)
      const n = noeudHugo(); ouvrirHugo(false); return lancerGuideHugo(n);
    }
    case 'suivant': return etapeSuivanteHugo();
    case 'arreter': return arreterGuideHugo();
  }
});
// (capture : avant que la fenêtre ne se ferme)
// (« Terminer » ferme aussi par data-fermer, mais après avoir ajouté : seul « Annuler » compte)
document.addEventListener('click', e => {
  if (guideHugo.etapes && /^Annuler$/.test(e.target.closest?.('dialog [data-fermer]')?.textContent.trim() || '')) guideHugo.annule = true;
}, true);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && guideHugo.etapes && modaleOuverte()) guideHugo.annule = true;
  if (e.key === 'Escape' && guideHugo.etapes && !modaleOuverte()) arreterGuideHugo();
  else if (e.key === 'Escape' && !$('#hugo-panneau')?.hidden && !modaleOuverte()) ouvrirHugo(false);
});

/* ---------- Le guide à l'écran ----------
   Toutes les 200 ms : étape faite ? → suivante ; sinon Hugo (bulle + anneau) se place à côté de la cible.
   Le guide entre dans la fenêtre ouverte (sinon une fenêtre modale le rendrait intouchable), comme l'ascenseur. */

const guideHugo = { etapes: null, i: 0, minuteur: null, cibleDefilee: null, fin: null };
const confirmationOuverte = () => modaleOuverte()?.querySelector('h2')?.textContent === 'Confirmation';
const ETAPE_CONFIRMER = { cible: () => premierVisible('dialog[open] .modale-actions [value="ok"]'), texte: 'L’appli te demande de confirmer : touche ce bouton (ou « Annuler » si tu changes d’avis).' };

function lancerGuideHugo(n) {
  arreterGuideHugo();
  guideHugo.etapes = n.guide; guideHugo.i = 0; guideHugo.titre = n.titre;
  const anneau = document.createElement('div'); anneau.id = 'hugo-anneau';
  const bulle = document.createElement('div'); bulle.id = 'hugo-guide'; bulle.setAttribute('role', 'status');
  document.body.append(anneau, bulle);
  Object.assign(guideHugo, { anneau, bulle });
  $('#hugo-bouton').hidden = true;
  guideHugo.minuteur = setInterval(tourGuideHugo, 200);
  tourGuideHugo();
}

function arreterGuideHugo() {
  clearInterval(guideHugo.minuteur); clearTimeout(guideHugo.fin);
  guideHugo.anneau?.remove(); guideHugo.bulle?.remove();
  Object.assign(guideHugo, { etapes: null, cibleDefilee: null, anneau: null, bulle: null, annule: false });
  if ($('#hugo-bouton')) $('#hugo-bouton').hidden = false;
}

function etapeSuivanteHugo() {
  guideHugo.i++; guideHugo.cibleDefilee = null;
  tourGuideHugo();
}

function tourGuideHugo() {
  const g = guideHugo;
  if (!g.etapes) return;
  // Fenêtre fermée par « Annuler » ou Échap : pas de « Bravo ».
  if (g.annule && !modaleOuverte()) return finGuideHugo(g.bulle, g.anneau, 'D’accord, rien n’a changé. Retouche le ? quand tu veux.');
  if (!modaleOuverte()) g.annule = false;
  // Passer les étapes déjà faites (ex. on est déjà dans Notes).
  while (g.i < g.etapes.length && g.etapes[g.i].fait?.()) { g.i++; g.cibleDefilee = null; }
  const { anneau, bulle } = g; // (une fenêtre qui se ferme les emporte : on les remet dans la page)
  const hote = modaleOuverte() || document.body;
  if (bulle.parentElement !== hote || !bulle.isConnected) hote.append(anneau, bulle);
  // Dernière étape faite mais l'appli demande encore « Confirmation » (ex. supprimer) : montrer où confirmer.
  if (g.i >= g.etapes.length && !confirmationOuverte()) return finGuideHugo(bulle, anneau);
  const etape = g.etapes[g.i] || ETAPE_CONFIRMER;
  const cible = etape.cible();
  if (cible && etape.defiler && g.cibleDefilee !== cible) { g.cibleDefilee = cible; cible.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  const texte = typeof etape.texte === 'function' ? etape.texte(cible) : etape.texte;
  const contenu = `${teteHugo(g.i)}<div class="hugo-guide-texte"><small>${esc(g.titre)} · étape ${Math.min(g.i + 1, g.etapes.length)}/${g.etapes.length}</small>
    <p>${esc(cible ? texte : etape.sinon || 'Je ne trouve pas ce qu’il faut toucher sur cet écran… Ferme la fenêtre ouverte s’il y en a une, ou recommence depuis le ?.')}</p>
    <div class="hugo-guide-boutons">${etape.suivant && cible ? '<button type="button" class="primaire" data-hugo="suivant">Suivant ›</button>' : ''}
      <button type="button" data-hugo="arreter">Arrêter</button></div></div>`;
  if (bulle.dataset.contenu !== contenu) { bulle.innerHTML = contenu; bulle.dataset.contenu = contenu; }
  anneau.hidden = !cible;
  placerGuideHugo(hote, cible, anneau, bulle);
}

function finGuideHugo(bulle, anneau, message = 'Bravo, c’est fait ! 🎉') {
  clearInterval(guideHugo.minuteur);
  if (!bulle.isConnected) (modaleOuverte() || document.body).append(anneau, bulle);
  anneau.hidden = true;
  bulle.innerHTML = `${teteHugo()}<div class="hugo-guide-texte"><p>${esc(message)}</p>
    <div class="hugo-guide-boutons"><button type="button" data-hugo="arreter">Fermer</button></div></div>`;
  placerGuideHugo(modaleOuverte() || document.body, null, anneau, bulle);
  guideHugo.fin = setTimeout(arreterGuideHugo, 5000);
}

// Position fixe ; dans une fenêtre déplacée (translate), le repère est la fenêtre elle-même.
function placerGuideHugo(hote, cible, anneau, bulle) {
  const cs = hote === document.body ? null : getComputedStyle(hote);
  const repere = cs && (cs.translate !== 'none' || cs.transform !== 'none') ? hote.getBoundingClientRect() : null;
  const ox = repere ? repere.left : 0, oy = repere ? repere.top : 0;
  const zone = repere || { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
  const lb = bulle.offsetWidth, hb = bulle.offsetHeight, marge = 8;
  let x, y;
  if (cible) {
    const r = cible.getBoundingClientRect();
    Object.assign(anneau.style, { left: r.left - ox - 5 + 'px', top: r.top - oy - 5 + 'px', width: r.width + 10 + 'px', height: r.height + 10 + 'px' });
    const dessous = r.bottom + 14 + hb <= zone.bottom - marge;
    y = dessous ? r.bottom + 14 : r.top - 14 - hb;
    bulle.dataset.pointe = dessous ? 'haut' : 'bas';
    x = r.left + r.width / 2 - 36;
  } else {
    bulle.dataset.pointe = '';
    x = zone.right - lb - 16; y = zone.bottom - hb - 16;
  }
  x = Math.max(zone.left + marge, Math.min(x, zone.right - lb - marge));
  y = Math.max(zone.top + marge, Math.min(y, zone.bottom - hb - marge));
  if (cible) bulle.style.setProperty('--pointe-x', Math.max(14, Math.min(lb - 28, cible.getBoundingClientRect().left + cible.getBoundingClientRect().width / 2 - x - 7)) + 'px');
  Object.assign(bulle.style, { left: x - ox + 'px', top: y - oy + 'px' });
}

installerHugo();
