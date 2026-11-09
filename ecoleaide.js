'use strict';
/* ---------- Aide « Hugo » du carnet École ----------
   rubriquesAide() (aide.js) construit l'arbre commun ; ici, pour le carnet École seulement :
   - les rubriques et les questions sans objet sont retirées ;
   - les textes du secondaire sont réécrits (chemin d'identifiants → changements) ;
   - la rubrique « L'école » ajoute appel, cahier journal, livret, outils de la classe, avec « Montre-moi ».
   Rien ici ne s'exécute dans les carnets EPS, SVT ou PC. (Chargé juste après aide.js, dont il réutilise les étapes.) */

// Étapes communes des guides de l'école.
const etapeClasseEcole = pret => ({ ...ETAPES_HUGO.classe, fait: () => !!classeActive() && (!pret || !!document.querySelector(pret)) });
const ongletAppelEcole = () => etapeOnglet('appel', 'Appel', 'classe');
const ongletJournalEcole = () => etapeOnglet('entrainement', () => mot('lecons'), 'suivi');
// Ouvrir un outil de la classe : depuis la page Outils, ou en revenant d'abord à cette page.
const guideOutilEcole = (id, nom) => [etapeOnglet('outils', 'Outils'), etapeClasseEcole(), {
  cible: () => premierVisible(`#vue [data-o="ouvrir"][data-arg="${id}"]`, '#vue [data-o="accueil"]'),
  texte: el => (el?.dataset.o === 'accueil' ? 'Touche « ← Outils » pour revenir à la liste.' : `Touche « ${nom} ».`),
  fait: () => ui.vue === 'outils' && ui.outil === id, defiler: true,
}];
const fenetreBilanMois = fenetreAvec('[data-bilan-type]');
const fenetreSeanceEcole = fenetreAvec('[name="objectif"]');
const fenetreLivret = fenetreAvec('[data-livret-periode]');
const fenetrePeriodes = fenetreAvec('[data-type="trimestres"]');
const fenetreNiveaux = fenetreAvec('[name^="niv-"]');
const fenetreReglagesNotes = fenetreAvec('[data-reglages-notes]');

const QUESTIONS_ECOLE = () => ({
  id: 'ecole', icone: '🏫', titre: 'L’école : appel, cahier journal, livret',
  enfants: [
    {
      id: 'appel-ecole', titre: 'Faire l’appel du matin et de l’après-midi',
      reponse: ['Onglet <b>Appel</b> : choisis <b>Matin</b> ou <b>Après-midi</b>.',
        'Touche <b>Présent</b>, <b>Absent</b> ou <b>Retard</b> pour chaque élève, ou <b>« Tous les autres présents »</b> pour finir d’un coup.',
        'Une absence est <b>non justifiée</b> : touche ce bouton, à côté du nom, quand tu as le justificatif.',
        '<b>Cantine</b> se coche pour la journée : le total s’affiche en haut.'],
      guide: [ongletAppelEcole(), etapeClasseEcole('#vue [data-ecole="demi"], #vue [data-action="vue-eleves"]'),
        etapeZonePage('#vue [data-ecole="demi"]', 'Choisis d’abord Matin ou Après-midi.', 'Ajoute d’abord des élèves à cette classe.'),
        etapeZonePage('#vue .bouton-appel.b-ABS', 'Touche Présent, Absent ou Retard pour chaque élève. Une absence peut ensuite passer en « Justifiée ».'),
        etapeZonePage('#vue .b-cantine', 'Coche ici les élèves qui mangent à la cantine ce jour-là.'),
        etapeZonePage('#vue [data-ecole="tous"]', 'Ce bouton marque présents tous ceux qui restent.')],
    },
    {
      id: 'bilan-mois', titre: 'Le bilan de l’appel (semaine, mois, trimestre) et le seuil d’absences',
      reponse: ['Appel › <b>« Bilan »</b> compte les demi-journées d’absence et les retards de chaque élève, et la cantine par jour.',
        'En haut : <b>Semaine</b>, <b>Mois</b> ou <b>Trimestre</b>, puis les flèches pour passer à la précédente ou à la suivante.',
        'L’appli signale <b>4 demi-journées non justifiées ou plus dans un même mois</b> : c’est à voir avec la direction de l’école.',
        '<b>« Aperçu, PDF, impression »</b> montre les pages, puis les télécharge en PDF ou les imprime. <b>« Copier »</b> donne le tableau, à coller dans un tableur.'],
      guide: [ongletAppelEcole(), etapeClasseEcole('#vue [data-ecole="bilan-mois"], #vue [data-action="vue-eleves"]'),
        etapeBouton('#vue [data-ecole="bilan-mois"]', 'Touche « Bilan ».', () => !!fenetreBilanMois(), 'Ajoute d’abord des élèves à cette classe.'),
        etapeZone(fenetreBilanMois, '[data-bilan-type]', 'Choisis la semaine, le mois ou le trimestre ; les flèches changent de semaine, de mois…'),
        etapeZone(fenetreBilanMois, '[data-apercu]', 'Ici : l’aperçu des pages, puis le PDF à télécharger ou l’impression.')],
    },
    {
      id: 'journal', titre: 'Tenir le cahier journal',
      reponse: ['Onglet <b>Cahier journal</b> : <b>« + Séance »</b> ajoute une séance du jour (horaire, matière, titre, objectif…).',
        'Après la séance, écris <b>ce qui s’est passé</b> et marque-la <b>« Faite »</b> ou <b>« À reprendre »</b>. Les séances à reprendre restent rappelées en haut.',
        'Sur un jour vide, <b>« Reprendre le plan »</b> recopie un jour précédent. <b>« Imprimer »</b> sort la journée.'],
      guide: [ongletJournalEcole(), etapeClasseEcole('#vue [data-date-journal], #vue [data-action="vue-eleves"]'),
        etapeBouton('#vue .outils [data-ecole="seance"]', 'Touche « + Séance ».', () => !!fenetreSeanceEcole()),
        etapeZone(fenetreSeanceEcole, '[name="heure"]', 'L’horaire, si tu veux que les séances se rangent dans l’ordre.'),
        etapeZone(fenetreSeanceEcole, '[name="ca"]', 'La matière.'),
        etapeZone(fenetreSeanceEcole, '[name="titre"]', 'Le titre, seul champ obligatoire.'),
        etapeValider(fenetreSeanceEcole, 'pour ajouter la séance'),
        etapeZonePage('#vue [data-bilan-journal]', 'Après la séance : ce qui a marché, ce qui est à reprendre, qui aider.'),
        etapeZonePage('#vue .etats-journal', 'Marque la séance « Faite » ou « À reprendre ».')],
    },
    {
      id: 'livret', titre: 'Remplir le livret de période',
      reponse: ['Notes › <b>« Livret »</b> : l’appli propose un degré par domaine (le dernier de la période) et des appréciations.',
        'Touche un degré pour le changer, et réécris les textes comme tu veux ; <b>« Autre proposition »</b> en donne une autre formulation.',
        'La vue <b>Classe</b> donne le tableau de toute la classe et les éléments du programme travaillés.',
        '<b>« Copier »</b> et <b>« Imprimer »</b> servent à reporter dans le LSU : l’appli n’y envoie rien elle-même.'],
      guide: [ETAPES_HUGO.ongletNotes, etapeClasseEcole('#vue [data-ecole="livret"], #vue [data-action="vue-eleves"]'),
        etapeBouton('#vue [data-ecole="livret"]', 'Touche « Livret ».', () => !!fenetreLivret(), 'Ajoute d’abord des élèves à cette classe.'),
        etapeZone(fenetreLivret, '[data-livret-periode]', 'La période du livret.'),
        etapeZone(fenetreLivret, '.choix-position', 'Le degré de ce domaine. Pâle : proposé par l’appli. Touche-le pour le confirmer ou le changer.'),
        etapeZone(fenetreLivret, '[data-livret-appr]', 'L’appréciation proposée : réécris-la comme tu veux.'),
        etapeZone(fenetreLivret, '[data-livret="copier"]', '« Copier » ou « Imprimer » pour reporter dans le LSU.')],
    },
    {
      id: 'fluence', titre: 'Mesurer la fluence, suivre les rituels',
      reponse: ['Outils › <b>« Fluence et rituels »</b>.',
        'Fluence : <b>« Départ »</b> lance la minute, tape les <b>mots bien lus</b>, <b>« Valider »</b> passe à l’élève suivant. Si l’élève finit avant, « Arrêter » ramène le résultat à une minute.',
        'Calcul mental, dictée, tables : tape les scores à la suite, <b>Entrée</b> passe à l’élève suivant. <b>« + Rituel »</b> en ajoute un.',
        'La courbe et les flèches ↗ ↘ montrent qui progresse et qui décroche. Les résultats sont gardés dans le carnet.'],
      guide: [...guideOutilEcole('rituels', 'Fluence et rituels'),
        etapeZonePage('#vue [data-ec="fluence-go"]', 'Choisis « Fluence » au-dessus : ce bouton lance la minute de lecture.', 'Touche la puce « Fluence » pour retrouver ce bouton.'),
        etapeZonePage('#vue .table-rituels', 'Le jour, la valeur et la courbe de chaque élève. Touche une case pour corriger.'),
        etapeZonePage('#vue [data-ec="rituel-ajout"]', 'Pour ajouter ton propre rituel, noté sur ce que tu veux.')],
    },
    {
      id: 'besoin', titre: 'Faire des groupes de besoin',
      reponse: ['Outils › <b>« Groupes de besoin »</b> : choisis une matière ou un domaine, l’appli répartit les élèves d’après leurs derniers degrés.',
        'Touche un élève pour le passer au <b>groupe suivant</b>. <b>« Revenir aux degrés »</b> annule tes changements.',
        'Il faut avoir évalué en degrés : les autres élèves restent dans « Pas encore évalués ».'],
      guide: [...guideOutilEcole('besoin', 'Groupes de besoin'),
        etapeZonePage('#vue [data-besoin-cle]', 'Choisis une matière ou un domaine.'),
        etapeZonePage('#vue .colonnes-besoin', 'Les trois groupes. Touche un élève pour le changer de groupe.'),
        etapeZonePage('#vue [data-ec="besoin-copier"]', 'Pour coller les groupes ailleurs.')],
    },
    {
      id: 'plan', titre: 'Faire le plan de classe',
      reponse: ['Outils › <b>« Plan de classe »</b> : règle les rangées et les places.',
        'Touche un élève, puis sa place. Si la place est prise, les deux élèves <b>échangent</b>.',
        '<b>« Au hasard »</b> place tout le monde, <b>« Imprimer »</b> donne une feuille pour un remplaçant. Le plan est gardé dans le carnet.'],
      guide: [...guideOutilEcole('plan', 'Plan de classe'),
        etapeZonePage('#vue [data-plan="rangs"]', 'Le nombre de rangées, puis de places par rangée.'),
        etapeZonePage('#vue .grille-plan', 'Le plan, tableau en haut. Touche un élève, puis sa place.'),
        etapeZonePage('#vue [data-ec="plan-hasard"]', 'Pour placer tout le monde d’un coup.'),
        etapeZonePage('#vue [data-ec="plan-imprimer"]', 'Une feuille pour un remplaçant.')],
    },
    {
      id: 'autres-outils', titre: 'Les autres outils de la classe', puces: true,
      reponse: ['<b>Métiers de la classe</b> : « Faire tourner » donne à chacun le métier suivant, chaque semaine. Gardé dans le carnet.',
        '<b>Coupons rendus</b> : crée le coupon (autorisation, sortie…), touche chaque élève qui l’a rendu ; « Copier » donne la liste de ceux qui manquent.',
        '<b>Bibliothèque</b> : choisis l’élève, écris le titre, « Prêter ». Un prêt de plus de 21 jours ressort en orange.',
        '<b>Minuteur visuel</b> : un disque rouge qui se vide, avec un bip à la fin. <b>Journée</b> : les séances du jour d’après le cahier journal, l’étape en cours en évidence.',
        '<b>Tour de parole</b> : touche un élève quand il parle ; « Proposer quelqu’un » choisit parmi ceux qui ont le moins parlé.',
        '<b>Niveau sonore</b> : une jauge du bruit au micro. Le son est analysé sur l’appareil : rien n’est enregistré ni envoyé.',
        '<b>Consignes en grand</b> : seul, à deux, en silence… affiché en grand ; « Plein écran » pour le tableau.'],
      guide: guideOutilEcole('minuteur', 'Minuteur visuel'),
    },
    {
      id: 'periodes-ecole', titre: 'Trimestres, semestres ou 5 périodes',
      reponse: ['Dans l’onglet <b>Notes</b> (ou le livret), touche le petit bouton à curseurs à côté de la période.', 'Choisis le <b>découpage</b> et ses dates, puis <b>« Enregistrer »</b>. Il vaut pour toutes les classes du carnet.'],
      guide: [ETAPES_HUGO.ongletNotes, etapeClasseEcole('#vue [data-action="periodes"], #vue [data-action="vue-eleves"]'),
        etapeBouton('#vue [data-action="periodes"]', 'Touche le petit bouton à curseurs à côté de la période.', () => !!fenetrePeriodes(), 'Ajoute d’abord des élèves à cette classe.'),
        etapeZone(fenetrePeriodes, '[name="type"]', 'Trimestres, semestres ou 5 périodes.'),
        etapeValider(fenetrePeriodes)],
    },
    {
      id: 'reglages-notes', titre: 'Note → degré, noms des degrés, compétences évaluées',
      reponse: ['Onglet <b>Notes</b>, tout à droite : <b>« Réglages des notes »</b>.',
        '<b>Note → degré</b> (ex. 10 / 14 / 18) : le degré proposé d’après une note sur 20, pour cette classe.',
        '<b>Noms des 4 degrés</b>, puis <b>« Créer ou modifier les compétences… »</b> : ajouter les tiennes, ne plus proposer celles dont tu ne te sers pas.'],
      guide: [ETAPES_HUGO.ongletNotes, etapeClasseEcole('#vue [data-ecole="reglages-notes"], #vue [data-action="vue-eleves"]'),
        etapeBouton('#vue [data-ecole="reglages-notes"]', 'Touche « Réglages des notes », tout à droite.', () => !!fenetreReglagesNotes(), 'Ajoute d’abord des élèves à cette classe.'),
        etapeZone(fenetreReglagesNotes, '[name="s3"]', 'Le degré proposé d’après la note sur 20 : ici, « 3 dès… ».'),
        etapeZone(fenetreReglagesNotes, '[value="competences"]', 'Ici, tu crées ou modifies les compétences évaluées.'),
        etapeValider(fenetreReglagesNotes)],
    },
    {
      id: 'double', titre: 'Classe à double niveau',
      reponse: ['Dans la fiche de la classe (<b>« Modifier la classe »</b>, onglet Élèves), choisis par exemple <b>« CE1-CE2 »</b>.',
        'Notes › <b>« Niveaux »</b> indique le niveau de chaque élève (s’il n’est pas déjà lu dans la liste importée).',
        'Les puces de niveau filtrent alors les notes et les outils, et le livret propose les matières du bon cycle.'],
      guide: [ETAPES_HUGO.ongletNotes, etapeClasseEcole(),
        etapeBouton('#vue [data-ecole="niveaux"]', 'Touche « Niveaux ».', () => !!fenetreNiveaux(), 'Ce bouton n’existe que pour une classe à double niveau : touche « Modifier la classe » dans l’onglet Élèves et choisis par exemple « CE1-CE2 ».'),
        etapeZone(fenetreNiveaux, '[name^="niv-"]', 'Choisis le niveau de chaque élève.'),
        etapeValider(fenetreNiveaux)],
    },
  ],
});

// Notes en degrés : le formulaire cache la note ; pour un guide sur la note, il faut d'abord cocher la case.
const etapeCocherNote = () => ({ cible: dansFenetreEval('[name="avecNote"]'), defiler: true, texte: 'Coche « Ajouter une note chiffrée » : les réglages de la note apparaissent.',
  fait: () => !fenetreEval() || !!fenetreEval().querySelector('[name="avecNote"]:checked') });
function avecCocherNote(n) {
  const k = (n.guide || []).indexOf(ETAPES_HUGO.ouvrirEval);
  return k < 0 ? n : { ...n, guide: [...n.guide.slice(0, k + 1), etapeCocherNote(), ...n.guide.slice(k + 1)] };
}

// Chemin d'identifiants → ce qui change (null : question retirée ; fonction : reçoit la question).
const PATCHS_AIDE_ECOLE = () => ({
  baremes: null, pp: null, lecons: null, appreciations: null,
  'eleves/classes/pp': null, 'eleves/eleves/dispense': null, 'eleves/fiches/lecons': null,
  'eleves/eleves/chercher': null, // (pas de recherche d'élève en École : une seule classe, toute sous les yeux)
  'agenda/conseils': null, 'outils/labo': null, 'notes/bareme': null,
  visite: {
    reponse: ['Onglet <b>Élèves</b>, en haut à droite : <b>Modifier la classe</b> et <b>Nouvelle classe</b>.', 'Dans la barre du haut, la <b>roue</b> (à côté du bouclier) : les <b>Réglages</b> du carnet, depuis n’importe quel onglet.',
      'En haut : les onglets <b>Élèves</b>, <b>Appel</b>, <b>Notes</b> (et son <b>Livret</b>), <b>Cahier journal</b>, <b>Outils</b>, <b>Agenda</b>.',
      'En haut à droite : <b>« Enregistrer »</b>, ta sauvegarde chiffrée (clé, Drive ou ordinateur).', 'En bas à droite : le <b>?</b> de Hugo, pour toutes tes questions.'],
  },
  'eleves/classes/creer': n => ({ ...n,
    reponse: ['Onglet <b>Élèves</b>, touche <b>« Nouvelle classe »</b>, en haut à droite.',
      'Écris son <b>nom</b> (ex. CE1-CE2 de Mme Martin) et choisis son <b>niveau</b> : l’appli propose alors les matières du bon cycle.',
      'Touche <b>« Créer »</b>, puis ajoute les élèves (voir « Les élèves »).'],
    guide: [n.guide[0], etapeZone(fenetreClasse, '[name="nom"]', 'Écris le nom de la classe et choisis son niveau.'), n.guide.at(-1)] }),
  'eleves/classes/ed': n => ({ ...n, titre: 'Créer une classe depuis une liste (ONDE, École Directe, Excel)',
    reponse: ['Exporte la <b>liste de la classe</b> depuis ONDE, École Directe ou un tableur (fichier .xlsx ou .csv).',
      'Dans le carnet : <b>« + Nouvelle classe »</b>, puis <b>« Depuis une liste… »</b>.',
      'Choisis le fichier : l’appli te montre ce qu’elle a lu (classe, nombre d’élèves, niveau).', 'Touche <b>« Créer la classe »</b>.'],
    guide: n.guide.map((e, k) => (k === 1 ? { ...e, texte: 'Touche « Depuis une liste… », puis choisis le fichier exporté.' } : e)) }),
  'eleves/eleves/importer': { titre: 'Importer une liste (ONDE, École Directe, Excel)',
    reponse: ['Exporte la liste de la classe depuis ONDE, École Directe ou un tableur (.xlsx ou .csv).', 'Onglet <b>Élèves</b>, puis <b>« Modifier la liste »</b>.',
      'Touche <b>« Importer une liste »</b> et choisis le fichier. Une colonne « Niveau » donne le niveau de chaque élève.', 'Vérifie ce que l’appli a lu, puis <b>« Mettre à jour »</b> : les fiches sont créées ou complétées.'] },
  'eleves/eleves/coller': { titre: 'Coller une liste (tableur, ONDE…)',
    reponse: ['Copie la liste des élèves depuis ton tableur.', 'Onglet <b>Élèves</b>, <b>« Modifier la liste »</b>, puis <b>« Coller une liste »</b>.',
      'Colle-la : un élève par ligne, NOM Prénom (ou Nom;Prénom;Sexe).', 'Touche <b>« Ajouter les élèves »</b>.'] },
  'eleves/eleves/fiche': { reponse: ['Onglet <b>Élèves</b>, en mode <b>« Consulter »</b> : touche la <b>carte</b> de l’élève.',
    'Sa <b>fiche bilan</b> s’ouvre : compétences, évolution, observations. ◀ ▶ pour passer à l’élève suivant.',
    'Coche <b>« L’élève est délégué(e) »</b> si ta classe a des délégués : une couronne apparaît sur sa carte.'] },
  'eleves/fiches/ouvrir': { intro: 'Tout ce que le carnet sait d’un élève, sur une seule page : de quoi préparer le livret, une équipe éducative ou une rencontre avec les parents.' },
  'eleves/fiches/contenu': { reponse: ['<b>La synthèse</b> : une toile qui compare l’élève à la classe, et ce qui est à signaler (absences, retards).',
    '<b>L’appréciation</b> : une proposition de l’appli ; touche une rubrique pour changer son niveau. Touche aussi 2 ou 3 pastilles du <b>portrait</b> (qualités, points à surveiller, situation) : l’appréciation parle alors de l’élève avant de parler des matières. Celles du livret sont à part, dans <b>Livret</b>.',
    '<b>Points d’appui et axes de progression</b> : ce que l’élève sait faire, et deux priorités au plus.',
    '<b>Compétences</b> et <b>Notes</b> : le détail, évaluation par évaluation.', '<b>Présence et santé</b> : ce qui vient de l’appel.',
    '<b>Mes observations</b> : tes notes personnelles sur l’élève, rangées par date.', 'Les parties se déplient en touchant leur titre.'] },
  'eleves/fiches/pdf': n => ({ ...n, reponse: n.reponse.filter(t => !t.includes('Prof principal')) }),
  'agenda/vues': n => ({ ...n, reponse: n.reponse.map(t => t.replace(', conseils', '').replace('vacances, conseils…', 'vacances…')) }),
  'agenda/demarrer': n => ({ ...n, guide: n.guide.filter(e => !/conseils/i.test(typeof e.texte === 'string' ? e.texte : ''))
    .map(e => (typeof e.texte === 'string' ? { ...e, texte: e.texte.replace(/^4\./, '3.') } : e)), reponse: ['<b>Emploi du temps</b> : saisis tes créneaux, ou importe un PDF s’il vient d’École Directe ou de Pronote. C’est lui qui compte les séances de chaque séquence.',
    '<b>Année et vacances</b> : les dates de l’année et des vacances (à saisir une fois par an).',
    '<b>+ Séquence</b> : tes thèmes. La suivante se place toute seule après la précédente.',
    '<b>+ Événement</b> : sorties, piscine, réunions.'] }),
  'agenda/edt': { reponse: ['Onglet <b>Agenda</b>, bouton <b>« Emploi du temps »</b>.', 'Pour ta classe, <b>« + Créneau »</b> : jour, début, fin, lieu.',
    'Tu as un PDF d’École Directe ou de Pronote ? <b>« Choisir le PDF… »</b> : l’appli montre les créneaux trouvés, vérifie-les puis valide.',
    'Un créneau une semaine sur deux : choisis <b>« semaine paire »</b> ou <b>« impaire »</b> (ou A / B, à régler dans « Année et vacances »).'] },
  'agenda/avancement': n => ({ ...n, reponse: n.reponse.filter(t => !t.includes('champ d’apprentissage')) }),
  'agenda/evenement': n => ({ ...n, reponse: n.reponse.map(t => t.replace('tout le collège', 'toute l’école')) }),
  'outils/presents': n => ({ ...n, reponse: n.reponse.map(t => t.replace(/dans la séance du jour \(l’appel, par exemple\)/, 'à l’appel de la demi-journée')) }),
  'outils/garder': { reponse: ['Fluence et rituels, Plan de classe, Métiers, Coupons rendus et Bibliothèque : gardés <b>dans le carnet</b>, ils suivent sur la clé et la tablette.',
    'Les autres outils (groupes de travail, tirage, minuteur, tour de parole…) et les changements dans les groupes de besoin restent <b>sur cet appareil</b>.', '<b>« Tout effacer »</b> remet un outil à zéro, quand il a ce bouton.'] },
  'outils/eleve': n => ({ ...n, reponse: n.reponse.map(t => t.replace(', l’envoi vers une séance', '')) }),
  'notes/creer': n => ({ ...n, titre: 'Créer une évaluation',
    reponse: ['Onglet <b>Notes</b> (choisis ta classe à gauche), puis <b>« + Évaluation »</b>.', 'Donne un <b>titre</b>, choisis la <b>matière</b> et <b>coche les compétences</b> travaillées.',
      'Par défaut, tu évalues seulement en <b>degrés de 1 à 4</b>. Pour noter aussi, coche <b>« Ajouter une note chiffrée »</b>.', 'Touche <b>« Créer »</b> : une colonne par compétence apparaît dans la grille.'],
    guide: [ETAPES_HUGO.ongletNotes, ETAPES_HUGO.classe,
      { cible: () => premierVisible('#vue [data-action="ajout-eval"]'), texte: 'Touche « + Évaluation ».', fait: () => !!fenetreEval() },
      zoneEval('[name="titre"]', `Écris le titre (ex. « ${mot('exempleTitreEval')} »).`),
      zoneEval('[name="ca"]', 'Choisis la matière : ses compétences s’affichent en dessous. Coche celles que tu évalues.'),
      zoneEval('[name="avecNote"]', 'Coche seulement si tu veux aussi une note chiffrée.'),
      ETAPES_HUGO.valider] }),
  'notes/saisir': n => ({ ...n, titre: 'Mettre les degrés (et les notes)',
    reponse: ['Dans l’onglet <b>Notes</b>, un toucher sur une case de degré le fait avancer. Tu peux aussi <b>rester appuyé</b> et glisser vers le degré voulu, ou taper 1 à 4 au clavier.',
      'Un élève absent : laisse sa case vide. Les absences se notent dans l’onglet <b>Appel</b>.',
      'Évaluation avec une note chiffrée : tape la note puis <b>Entrée</b> (ou une lettre : A absent, NE non noté, M malade, O autre).',
      'Les puces au-dessus de la grille filtrent par matière et par niveau.'],
    guide: [ETAPES_HUGO.ongletNotes, ETAPES_HUGO.classe,
      etapeZonePage('#vue .filtres-ecole', 'Choisis une matière pour n’afficher que ses évaluations.'),
      etapeZonePage('#vue .grille-notes [data-niveau]', 'Touche la case : le degré avance. Reste appuyé pour choisir directement.', 'Crée d’abord une évaluation avec « + Évaluation ».')] }),
  'notes/competences': n => ({ ...n, titre: 'Changer les compétences d’une évaluation',
    reponse: ['Dans l’onglet <b>Notes</b>, touche le <b>titre de l’évaluation</b> (en haut de sa colonne).', 'Dans <b>« Matière et compétences travaillées »</b>, choisis la matière et coche les compétences. Tu peux aussi en écrire d’autres, une par ligne.',
      'Touche <b>« Enregistrer »</b> : une colonne par compétence.'],
    guide: n.guide.map(e => (typeof e.texte === 'string' && e.texte.startsWith('Voici') ? { ...e, texte: 'Choisis la matière, puis coche les compétences.' } : e)) }),
  'notes/parties': avecCocherNote,
  'notes/non-significative': avecCocherNote,
});

// Rangement des questions sur les notes chiffrées dans leur propre sous-rubrique.
const CHIFFREES_ECOLE = ['parties', 'non-significative', 'importer-notes', 'importer-notes-savoir'];

function arbreAideEcole(racine) {
  const patchs = PATCHS_AIDE_ECOLE();
  const texte = t => (typeof t === 'string' ? t.replace(/\b(les|des|de|ses|et) cahier journal\b/g, '$1 séances') : t);
  const appliquer = (n, chemin) => {
    const c = chemin.join('/'), p = patchs[c];
    let res = typeof p === 'function' ? p(n) : p ? { ...n, ...p } : n;
    res = { ...res, intro: texte(res.intro), reponse: Array.isArray(res.reponse) ? res.reponse.map(texte) : texte(res.reponse) };
    if (res.guide) res.guide = res.guide.map(e => (typeof e.texte === 'string' && texte(e.texte) !== e.texte ? { ...e, texte: texte(e.texte) } : e));
    if (res.enfants) {
      res.enfants = res.enfants.filter(x => patchs[[...chemin, x.id].join('/')] !== null && !(x.id === 'pp')).map(x => appliquer(x, [...chemin, x.id]));
    }
    return res;
  };
  const r = appliquer(racine, []);
  const notes = r.enfants.find(x => x.id === 'notes');
  if (notes) {
    const chiffrees = notes.enfants.filter(x => CHIFFREES_ECOLE.includes(x.id));
    notes.enfants = notes.enfants.filter(x => !CHIFFREES_ECOLE.includes(x.id));
    if (chiffrees.length) notes.enfants.push({ id: 'chiffrees', titre: 'Si tu mets aussi des notes chiffrées', enfants: chiffrees });
  }
  r.enfants.splice(r.enfants.findIndex(x => x.id === 'visite') + 1, 0, QUESTIONS_ECOLE());
  return r;
}
