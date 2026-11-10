# AGENTS.md — consignes pour les assistants de code (Claude, Codex, Copilot…)

Carnet EPS S-A : carnet de bord d'enseignant (EPS d'abord, SVT aussi), en **application web hors ligne** (PWA).
JavaScript « vanilla », **sans dépendance, sans étape de compilation** : les fichiers du dossier sont l'appli telle quelle.
Langue du projet : **français** (interface, commentaires, noms de fonctions et de variables, réponses à l'enseignant).

## 1. Règles absolues (données des élèves)

- **Ne jamais ouvrir, lire, copier ni analyser des données réelles** : `carnet-eps.json` (carnet chiffré),
  le dossier `Sauvegardes\`, le stockage du navigateur (IndexedDB, localStorage) d'un poste réel, les listes de classe,
  trombinoscopes, emplois du temps, relevés de notes réels, ni aucun fichier chiffré.
  Si une tâche semble l'exiger, s'arrêter et demander.
- **C'est l'appli qui calcule, pas l'assistant** : appréciations, appariement photo ↔ nom, lecture des PDF et des Excel,
  niveaux, barèmes… sont faits par le code de l'appli, sur l'appareil. L'assistant écrit ce code, il ne produit pas
  lui-même le résultat à partir de vraies données.
- **Rien ne sort de l'appareil** : pas d'API, pas de CDN, pas de bibliothèque externe, pas de télémétrie.
  La politique de sécurité (CSP dans `index.html`) n'autorise que les fichiers de l'appli (`connect-src 'self'`).
- **Tests uniquement avec des données inventées** (la classe exemple, ou des élèves fictifs créés pour le test,
  supprimés ensuite).

## 2. Deux postes, une clé USB

Le développement se fait sur deux PC. Le code circule par la clé USB (`<clé>\Claude\CarnetEPS`) ;
la publication sur GitHub Pages (https://salvorhard1.github.io/carnet-eps/) est faite par l'enseignant lui-même.

- **Avant toute modification** : comparer `VERSION_APP` (app.js) de la clé et du poste. Si la clé est plus récente,
  recopier d'abord son code sur le poste.
- **Pour envoyer sur la clé** : `copier-sur-cle.ps1` uniquement. Il refuse d'écraser une version plus récente ;
  ne jamais utiliser `-Forcer` sans accord explicite.
- **Ne jamais publier sur GitHub** sans qu'on le demande. Sur GitHub ne va que le contenu de ce dossier
  (jamais les données, jamais le dossier `.claude`).

## 3. Publier une version

1. Augmenter `VERSION` dans `sw.js` **et** `VERSION_APP` dans `app.js` (toujours identiques).
2. Tout nouveau fichier doit être ajouté à la liste `FICHIERS` de `sw.js` (cache hors ligne), à la liste `$fichiers`
   de `copier-sur-cle.ps1` et, si c'est un script, à `index.html`.
3. Si la version ajoute une collection ou change le sens d'un champ : augmenter `NIVEAU` dans `donnees.js`
   (une appli plus ancienne refusera alors ce carnet au lieu de l'enregistrer sans ce qu'elle ne connaît pas).
4. Ajouter une entrée en tête de `NOUVEAUTES` (app.js) si la version apporte quelque chose de visible :
   elle s'affiche une fois sur chaque appareil après la mise à jour.
5. Lancer `copier-sur-cle.ps1`.

Encodage : fichiers de l'appli en **UTF-8 sans BOM** ; les scripts `.ps1` contenant des accents en **UTF-8 avec BOM**
(Windows PowerShell 5.1 en a besoin). En PowerShell, écrire avec
`[IO.File]::WriteAllText(chemin, texte, (New-Object Text.UTF8Encoding $false))`, jamais `Set-Content` sans `-Encoding`.

## 4. Architecture

Scripts classiques chargés dans l'ordre d'`index.html`, qui partagent **une seule portée globale** :
une fonction de même nom dans deux fichiers écrase silencieusement l'autre. Chercher le nom (grep) avant d'en créer un.

| Fichier | Rôle |
|---|---|
| `donnees.js` | Stockage IndexedDB (`Donnees`) et fusion entre appareils (horodatage `maj` par élément / par champ, pierres tombales pour les suppressions). Collections : classes, eleves, evals, notes, seances, reglages, documents, suivis, agenda, baremes, modeles. |
| `discipline.js` | Profils de discipline (EPS, SVT, physique-chimie `pc`) : vocabulaire `mot()`, activités, référentiels, outils masqués, modèle de séance `modeleSeance(niveau)`, appréciations. |
| `cle.js` | Carnet chiffré sur la clé (AES-GCM 256, PBKDF2, gzip). |
| `referentiel.js` | Référentiels officiels (attendus, compétences, cycles 3/4, lycée, SVT, physique-chimie…). |
| `tableur.js` | Lecture / écriture `.xlsx` maison. |
| `entrainement.js` | Onglet « Leçons » (id interne `entrainement`) : séances, données relevées, statuts, Excel. |
| `notesexcel.js` | Notes et degrés ⇄ Excel ; import des relevés de notes de Pronote (.xlsx, .csv, .txt) et d’École Directe. |
| `versecoledirecte.js` | Notes › 📋 Reporter mes notes sur École Directe : copie les notes d’une évaluation dans le presse-papiers (JSON `carnet-eps-ecole-directe` codé en base64, préfixe `CARNET-EPS:`) pour l’extension Passerelle, rangée hors de l’appli. ✍ Appréciations › Reporter sur École Directe : même codage, format `carnet-eps-appreciations`. Rien n’est envoyé. |
| `extensions.js` | Bouton puzzle (bas à gauche) et fenêtre des extensions. Le paquet `passerelle.zip` fait partie de l’appli et reste passif : un clic le télécharge, avec un guide d’ajout au navigateur et `guide-passerelle.pdf`. Après chaque changement de l’extension ou de son guide (`guide\guide.html`), refaire les deux fichiers avec `emballer.ps1` (dossier `..\extension-ecoledirecte`). |
| `listeclasse.js` | Import de listes École Directe / Pronote. |
| `reglages.js` | ⚙ Réglages, premier lancement (choix de la discipline, classe exemple). Réglages **propres à chaque discipline** (`REGLAGES_PAR_DISCIPLINE` : apparence, notes, compétences, onglets, perso, appréciations, périodes) : fiche `nom@discipline` ; tant qu'elle n'existe pas, on lit l'ancienne fiche commune `nom`, qui n'est plus modifiée. Toujours lire par `reglage()` / `ficheReglage()` et écrire par `ecrireReglage()` / `ecrireFicheReglage()`, jamais `Donnees.get('reglages', 'notes')` directement. En École, la fenêtre ne montre que ce qui sert à l'école (champs cachés gardés). |
| `dessinpdf.js` | Pages dessinées une fois (`DessinPdf`) puis rendues en vrai PDF (Helvetica, Windows-1252, flux compressés) ou en SVG (aperçu, impression). Sert au bilan de l'appel École (semaine, mois, période). |
| `perso.js` | ⚙ Réglages › 🎨 Apparence et personnalisation (partie poussée) : ambiances (`--fond`, `--surface`, `--surface2`, `--texte`, `--texte2`, `--bord`, en clair et en sombre ; fiche `perso` ; plus de couleurs une à une depuis la v1.4.2), coins (`--arrondi`), police (`--police`), taille des boutons (`--boutons`, propre à l'appareil : `ui.boutons`), ordre des onglets (`reglage('onglets').ordre`, `ordreOnglets()`). Tout nouveau `border-radius` en px s'écrit `calc(Npx * var(--arrondi, 1))`. |
| `outils.js` + `combine.js`, `natation.js`, `asns.js`, `videodelay.js`, `tableau.js`, `boxe.js`, `volley.js` + `volleysituations.js`, `ece.js`, `ecepc.js`, `labo.js` | Onglet « Outils » et ses outils. Les noms d'élèves s'y affichent via `nomEleveOutil()` (mode élève). `ece.js`, `labo.js` (schéma, gestes techniques, mise en commun, sécurité, binômes) et `tp.js` (fiches TP rangées dans la séance `s.tp`, commande au labo, banque de séances = collection `modeles`) = famille « Sciences » (titrée du nom de la discipline), cachée en EPS ; un outil propre à une discipline porte `disciplines: ['svt']` (ECE, schéma, gestes). Texte ou exemple propre à une discipline : passer par `mot()` / `exempleOutil()`, jamais `disciplineActive() === 'svt'`. |
| `bilansvt.js` | Onglet Notes, carnets de SVT et de physique-chimie (`profil().bilans`) : 🎯 couverture des compétences, 🧭 socle (domaines d'après `ref.socle`, collège), 📄 travail rendu. |
| `edtpdf.js` | Lecteur PDF maison (`PdfTexte`) + lecture d'emploi du temps. |
| `trombi.js` | Trombinoscope PDF → photos rattachées aux élèves (par l'appli). |
| `trombiimage.js` | Trombinoscope en image (PNG, JPEG, PDF scanné) : repère la grille de photos, découpe le nom dessous et le compare aux noms de la classe que l'appli écrit elle-même dans plusieurs polices (police et présentation NOM Prénom / Prénom NOM apprises sur l'image). |
| `agenda.js` | Onglet « Agenda » : frise de l'année, mois, semaine, séquences. |
| `fichenotes.js` | Fiche élève de l'onglet Notes. |
| `appel.js` | Onglet « Appel » (écrit dans la leçon du jour, indicateur `presence`). |
| `exemple.js` | Classe exemple fictive (ids fixes `exemple-…`). |
| `ecoleaide.js` | Aide Hugo du carnet École : retire et réécrit des questions de l’arbre commun (`PATCHS_AIDE_ECOLE`), rubrique École avec guides. |
| `ecole.js` | Carnet École (`profil().ecole`, `avecEcole()`) : matières = champs du référentiel (`eval.ca`, `seance.ca`), évaluation en degrés (`eval.sansNote`), appel par demi-journée (séance `appelJour` par jour, colonnes matin / après-midi / cantine), cahier journal (les autres séances), livret (`suivis` « livret\|élève\|période », `classe.livret`), outils (famille `classe`) : fluence et rituels (`suivis` « élève\|rituel\|id », `classe.rituels`), groupes de besoin, plan de classe (`classe.plan`). Rien ici ne doit changer EPS, SVT ou PC. Exception : son jeu d'icônes au trait (`TRACES_ECOLE`, `iconeEcole`) sert aussi, depuis la v1.27.0, à l'Appel (`pictoAppel`, appel.js) et aux tuiles des Outils (`ICONES_OUTILS`, `iconeOutil`) de toutes les disciplines ; un nouvel outil y reçoit son icône. Depuis la v1.29.0, le remplacement automatique des émojis affichés (`iconesPourEmojis`, table `EMOJIS_ECOLE`, interrupteur `ICONES_AU_TRAIT`) vaut pour toutes les disciplines : un nouvel émoji dans l'interface doit avoir son entrée dans `EMOJIS_ECOLE` (icône, `pastille-…` ou `-` pour le retirer), sinon il reste affiché tel quel. |
| `appreciations.js` | Appréciations rédigées par l'appli (banques de phrases, règles) + relecture grammaticale locale. |
| `ppinfos.js` | Espace Prof principal › 📎 Incorporer des informations : tableaux d’absences, de vie scolaire, d’infirmerie (Excel, CSV, Word .docx, PDF, tableau collé) lus par l’appli ; listes « une ligne par événement » de la Vie scolaire École Directe (absences / retards, sanctions, dispenses) comptées par élève pour la période ; valeurs par élève et période (`suivis` « pp infos … »), seuils → élèves à suivre (`alertesPP`), blocs de la fiche bilan du conseil. |
| `baremes.js` | Onglet « Barèmes ». |
| `choixdegre.js` | Notes et Leçons : appui long sur une case de degré → les 4 degrés au-dessus, les statuts (dispensé, absent, malade, blessé, vide) en dessous ; glisser et relâcher. Degrés : mêmes fonctions que les touches 1 à 4 ; statuts : `appliquerStatutEnt` (Leçons) ou `poserCodeCaseNotes` (Notes, code sur toute l'évaluation). |
| `verrou.js` | Verrouillage automatique de l'écran. |
| `cacheecran.js` | 🛡 Cacher les infos sensibles (bouton de la barre, F8) : classe `infos-cachees` du body + règles de style.css (section du même nom). Tout nouvel écran montrant PAI, BEP, dispense, adapté, alerte, remarque ou observation doit y être ajouté (classe `info-sensible`). |
| `aide.js` | Aide « Hugo » (bulle ? en bas à droite) : arborescence `AIDE_RUBRIQUES` (nœud = titre + `enfants`, ou `reponse` [+ `intro`, `puces` = points à savoir au lieu d'étapes numérotées] + `guide`), construite par `rubriquesAide()` à chaque affichage :
tout texte propre à une discipline passe par `eps`, `mot()`, `aideCodes()`, `oubliTenue()`… (jamais « Leçons », « APSA » ou « tenue » en dur ; une question
propre à l'EPS s'ajoute avec `...(eps ? [question] : [])`), puis guidage à l'écran : étapes `{ cible, texte, fait, suivant, defiler, sinon }` vérifiées toutes les 200 ms (fabriquées par `etapeOnglet`, `etapeBouton`, `etapeZone`, `etapeZonePage`, `etapeValider`), bulle et anneau placés dans la fenêtre ouverte s'il y en a une. Ajouter un thème = ajouter un nœud. Logo « cadran » (`teteHugo`) en `currentColor` : toujours la couleur de l'appli (`--accent`), jamais une couleur fixe. |
| `app.js` | Vues principales, classes, élèves, notes, navigation, mises à jour. |
| `sw.js` | Service worker « réseau d'abord », cache par version. |

Repères de données : clé d'une note = `evalId|eleveId[|attendu]` ; statut d'une leçon = note sans attendu ;
valeur d'une case de leçon : toujours passer par `valeurCase()` (une case peut contenir un statut `@BLE`…).

## 5. Conventions de code

- Pas de style en ligne (`style="…"`), interdit par la CSP : utiliser des classes CSS ou des attributs `data-*`.
- Ne pas redessiner une vue sur l'événement `change` d'un champ texte (le focus et le clic suivant sont perdus) ;
  seulement pour les listes déroulantes et cases à cocher.
- Les panneaux `<details>` doivent rester ouverts après un nouveau rendu (mémoriser leur état).
- Imiter le style existant : commentaires courts en français, fonctions nommées en français.
- Textes de l'interface simples et concrets : l'appli doit rester utilisable par un enseignant non informaticien,
  et l'outil élève par des élèves de 6e.

## 6. Tester

- Serveur local : `powershell -ExecutionPolicy Bypass -File serve.ps1` (port 8080 ; `-Port` pour en changer).
- Tester avec de **vraies interactions** (clics, frappe au clavier) : des événements déclenchés en JavaScript
  ont déjà masqué un bug bloquant.
- Vérifier la console (aucune erreur), le mode sombre, et l'affichage tablette / téléphone si la mise en page change.
- Supprimer les données de test à la fin.
