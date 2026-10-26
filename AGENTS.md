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
3. Lancer `copier-sur-cle.ps1`.

Encodage : fichiers de l'appli en **UTF-8 sans BOM** ; les scripts `.ps1` contenant des accents en **UTF-8 avec BOM**
(Windows PowerShell 5.1 en a besoin). En PowerShell, écrire avec
`[IO.File]::WriteAllText(chemin, texte, (New-Object Text.UTF8Encoding $false))`, jamais `Set-Content` sans `-Encoding`.

## 4. Architecture

Scripts classiques chargés dans l'ordre d'`index.html`, qui partagent **une seule portée globale** :
une fonction de même nom dans deux fichiers écrase silencieusement l'autre. Chercher le nom (grep) avant d'en créer un.

| Fichier | Rôle |
|---|---|
| `donnees.js` | Stockage IndexedDB (`Donnees`) et fusion entre appareils (horodatage `maj` par élément / par champ, pierres tombales pour les suppressions). Collections : classes, eleves, evals, notes, seances, reglages, documents, suivis, agenda, baremes, modeles. |
| `discipline.js` | Profils de discipline (EPS, SVT) : vocabulaire `mot()`, activités, référentiels, outils masqués. |
| `cle.js` | Carnet chiffré sur la clé (AES-GCM 256, PBKDF2, gzip). |
| `referentiel.js` | Référentiels officiels (attendus, compétences, cycles 3/4, lycée, SVT…). |
| `tableur.js` | Lecture / écriture `.xlsx` maison. |
| `entrainement.js` | Onglet « Leçons » (id interne `entrainement`) : séances, données relevées, statuts, Excel. |
| `notesexcel.js` | Notes et degrés ⇄ Excel ; import des relevés de notes de Pronote (.xlsx, .csv, .txt) et d’École Directe. |
| `listeclasse.js` | Import de listes École Directe / Pronote. |
| `reglages.js` | ⚙ Réglages, premier lancement (choix de la discipline, classe exemple). |
| `outils.js` + `combine.js`, `natation.js`, `asns.js`, `videodelay.js`, `tableau.js`, `boxe.js`, `ece.js`, `labo.js` | Onglet « Outils » et ses outils. Les noms d'élèves s'y affichent via `nomEleveOutil()` (mode élève). `ece.js`, `labo.js` (schéma, gestes techniques, mise en commun, sécurité, binômes) et `tp.js` (fiches TP rangées dans la séance `s.tp`, commande au labo, banque de séances = collection `modeles`) = famille SVT, cachée en EPS. |
| `bilansvt.js` | Onglet Notes, carnet de SVT seulement (`profil().bilans`) : 🎯 couverture des compétences, 🧭 socle (domaines d'après `ref.socle`, collège), 📄 travail rendu. |
| `edtpdf.js` | Lecteur PDF maison (`PdfTexte`) + lecture d'emploi du temps. |
| `trombi.js` | Trombinoscope PDF → photos rattachées aux élèves (par l'appli). |
| `agenda.js` | Onglet « Agenda » : frise de l'année, mois, semaine, séquences. |
| `fichenotes.js` | Fiche élève de l'onglet Notes. |
| `appel.js` | Onglet « Appel » (écrit dans la leçon du jour, indicateur `presence`). |
| `exemple.js` | Classe exemple fictive (ids fixes `exemple-…`). |
| `appreciations.js` | Appréciations rédigées par l'appli (banques de phrases, règles) + relecture grammaticale locale. |
| `baremes.js` | Onglet « Barèmes ». |
| `verrou.js` | Verrouillage automatique de l'écran. |
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
