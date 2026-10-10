'use strict';
// Carnet d'entraînement : séances par classe, avec des données relevées adaptées à l'APSA
// et à son champ d'apprentissage (modèles modifiables séance par séance).
//
// Séance : { id, classeId, titre, apsa, ca, date, cree, indicateurs: [{ id, nom, type, unite?, options? }] }
//   statut d'un élève sur la séance (ABS / DISP / BLE / MAL) → notes[séance|élève]
//   valeur d'une donnée                                        → notes[séance|élève|indicateur]
// Rien ici ne compte dans les moyennes de l'onglet Notes.
// (Fichier chargé avant app.js : il n'utilise les outils d'app.js qu'au moment des appels.)

const TYPES_INDIC = {
  temps: 'Temps', distance: 'Distance', nombre: 'Nombre', echelle: 'Échelle 1 à 4', choix: 'Choix dans une liste', texte: 'Texte / observation',
};
const TYPES_NUMERIQUES = ['temps', 'distance', 'nombre'];
// « Autre » : par ex. élève pris en charge par un autre prof (natation des 6e).
const STATUTS_ENT = { ABS: 'ABS', DISP: 'DISP', BLE: 'Blessé', MAL: 'Malade', AUT: 'Autre' };
const CODES_ENT = {
  A: 'ABS', ABS: 'ABS', ABSENT: 'ABS', D: 'DISP', DISP: 'DISP', 'DISPENSÉ': 'DISP',
  B: 'BLE', BLE: 'BLE', 'BLESSÉ': 'BLE', M: 'MAL', MAL: 'MAL', MALADE: 'MAL',
  O: 'AUT', AU: 'AUT', AUT: 'AUT', AUTRE: 'AUT',
};

/* ---------- Modèles de données par APSA / champ d'apprentissage ---------- */

const I = (nom, type, param) => ({ nom, type, ...(type === 'choix' ? { options: param } : param ? { unite: param } : {}) });
const ECH = nom => I(nom, 'echelle');
const OBS = I('Observation', 'texte');
const EFFORT = I('Ressenti d’effort (1-10)', 'nombre', '/10');

const MODELES_CA = {
  CA1: [I('Performance', 'temps'), I('Rôle tenu', 'choix', ['Chronométreur', 'Starter', 'Juge', 'Observateur', 'Secrétaire']), OBS],
  CA2: [I('Itinéraire / niveau choisi', 'texte'), I('Réussite', 'choix', ['Réussi', 'Partiel', 'Non réussi']), I('Temps', 'temps'), ECH('Sécurité'), OBS],
  CA3: [ECH('Exécution'), ECH('Composition'), ECH('Rôle (juge / spectateur)'), OBS],
  CA4: [I('Rencontres gagnées', 'nombre'), I('Rencontres jouées', 'nombre'), ECH('Choix tactiques'), ECH('Arbitrage / coaching'), OBS],
  CA5: [I('Durée d’effort', 'temps'), I('Fréquence cardiaque', 'nombre', 'bpm'), EFFORT, OBS],
};

const MODELES_APSA = (() => {
  const m = {};
  const pour = (apsas, modele) => apsas.forEach(a => { m[a.toLocaleLowerCase('fr')] = modele; });
  pour(['Demi-fond'], [I('Temps', 'temps'), I('Temps annoncé (projet)', 'temps'), EFFORT, I('Rôle tenu', 'choix', ['Chronométreur', 'Lièvre', 'Observateur', 'Juge'])]);
  pour(['Course de vitesse'], [I('Temps', 'temps'), ECH('Départ / réaction'), I('Rôle tenu', 'choix', ['Starter', 'Chronométreur', 'Juge d’arrivée'])]);
  pour(['Course de haies'], [I('Temps', 'temps'), I('Haies renversées', 'nombre'), ECH('Rythme entre les haies'), I('Rôle tenu', 'choix', ['Starter', 'Chronométreur', 'Juge d’arrivée'])]);
  pour(['Relais'], [I('Temps', 'temps'), I('Transmission', 'choix', ['Réussie dans la zone', 'Hors zone', 'Témoin tombé']), I('Rôle tenu', 'choix', ['Starter', 'Chronométreur', 'Juge de zone'])]);
  pour(['Saut en longueur', 'Triple saut', 'Multibonds', 'Pentabond'],
    [I('Meilleure performance', 'distance', 'm'), I('Essais nuls (mordus)', 'nombre'), I('Rôle tenu', 'choix', ['Juge de planche', 'Juge de mesure', 'Secrétaire'])]);
  pour(['Saut en hauteur'], [I('Barre franchie', 'distance', 'm'), I('Échecs', 'nombre'), I('Rôle tenu', 'choix', ['Juge', 'Secrétaire', 'Observateur'])]);
  pour(['Lancer de poids', 'Lancer de javelot', 'Lancer de disque'],
    [I('Meilleur jet', 'distance', 'm'), I('Essais nuls', 'nombre'), I('Rôle tenu', 'choix', ['Juge de mesure', 'Juge d’aire', 'Secrétaire'])]);
  pour(['Natation', 'Natation vitesse'],
    [I('Temps', 'temps'), I('Distance', 'distance', 'm'), I('Nage', 'choix', ['Crawl', 'Dos', 'Brasse', 'Papillon']), I('Rôle tenu', 'choix', ['Chronométreur', 'Juge', 'Observateur'])]);
  // `suivi` : liste ordonnée qui sert à mesurer la progression (option suivante = mieux).
  pour(['Escalade'], [{ ...I('Voie (cotation)', 'choix', ['3', '4a', '4b', '4c', '5a', '5b', '5c', '6a', '6b', '6c', '7a']), suivi: true },
    I('Réussite', 'choix', ['Enchaînée', 'Avec repos / chute', 'Abandon']), I('Chutes', 'nombre'), ECH('Assurage / sécurité'), OBS]);
  pour(['Course d’orientation'], [{ ...I('Niveau du parcours', 'choix', ['Vert', 'Bleu', 'Rouge', 'Noir']), suivi: true },
    I('Balises trouvées', 'nombre'), I('Temps', 'temps'), I('Erreurs de poste', 'nombre'), ECH('Sécurité / consignes')]);
  pour(['Sauvetage', 'Sauvetage aquatique'], [I('Temps', 'temps'), I('Réussite', 'choix', ['Réussi', 'Non réussi']), ECH('Sécurité'), OBS]);
  pour(['VTT'], [I('Temps', 'temps'), I('Parcours', 'choix', ['Vert', 'Bleu', 'Rouge', 'Noir']), I('Pieds à terre', 'nombre'), ECH('Sécurité')]);
  pour(['Gymnastique', 'Acrosport', 'Arts du cirque'], [I('Éléments réussis', 'nombre'), I('Difficulté', 'choix', ['A', 'B', 'C', 'D']),
    ECH('Exécution'), ECH('Composition'), ECH('Rôle de juge'), OBS]);
  pour(['Danse', 'Step chorégraphié'], [ECH('Motricité expressive'), ECH('Procédés de composition'), ECH('Interprétation / engagement'), ECH('Rôle de spectateur'), OBS]);
  pour(['Badminton', 'Tennis de table', 'Tennis'], [I('Matchs gagnés', 'nombre'), I('Matchs joués', 'nombre'), I('Points marqués', 'nombre'),
    ECH('Choix tactiques'), ECH('Arbitrage'), OBS]);
  pour(['Basket-ball', 'Handball', 'Football', 'Futsal', 'Rugby', 'Volley-ball', 'Ultimate', 'Kin-ball', 'Tchoukball'],
    [I('Résultat', 'choix', ['Victoire', 'Nul', 'Défaite']), I('Points / buts marqués', 'nombre'), I('Actions décisives', 'nombre'), ECH('Rôle (arbitre / coach)'), OBS]);
  pour(['Judo', 'Lutte', 'Boxe française'], [I('Combats gagnés', 'nombre'), I('Combats disputés', 'nombre'), ECH('Maîtrise / sécurité'), ECH('Arbitrage'), OBS]);
  pour(['Musculation'], [I('Exercice / atelier', 'texte'), I('Charge', 'nombre', 'kg'), I('Répétitions', 'nombre'), I('Séries', 'nombre'), EFFORT]);
  pour(['Course en durée', 'Natation en durée'], [I('Durée', 'temps'), I('Distance', 'distance', 'm'), I('Fréquence cardiaque', 'nombre', 'bpm'), EFFORT]);
  // En plus des étapes cochées (voir ETAPES_SN), un degré global et l'état de l'attestation.
  pour(['Savoir-nager'], [ECH('Degré de maîtrise global'), I('Attestation (ASNS)', 'choix', ['En cours', 'Validée', 'Non validée']), OBS]);
  return m;
})();

/* ---------- Savoir-nager : étapes de l'ASNS à cocher, séance par séance ----------
   Chaque étape cochée devient une colonne « échelle 1 à 4 » (degré de maîtrise de l'élève sur cette étape).
   Ids fixes : décocher puis recocher une étape retrouve les degrés déjà saisis. */

// Parcours de l'ASNS (arrêté du 28 février 2022) : en continuité, sans reprise d'appuis, sans lunettes.
// (P13, l'ancrage, est arrivée avec l'ASNS ; les distances sont passées de 15 à 20 m.)
// 3e colonne : ce qui est attendu au degré 3 (seuil de validation), d'après le barème ASNS (critères officiels).
// La fiche élève s'en sert pour dire quoi viser.
const ETAPES_SN = [
  ['P1', 'Entrer dans l’eau en chute arrière',
    'Depuis la position accroupie, chuter en arrière seul, entrer par les fesses / le dos et rester dans l’axe ; remonter sans s’agripper au bord.'],
  ['P2', 'Se déplacer sur 3,5 m en direction d’un obstacle', 'Parcourir les 3,5 m sans appui, en continuité, orienté vers l’obstacle.'],
  ['P3', 'Franchir l’obstacle en immersion complète sur 1,5 m', 'Franchir les 1,5 m en immersion complète, sans toucher l’obstacle ni le fond.'],
  ['P4', 'Se déplacer sur le ventre sur 20 m',
    'Se déplacer sur le ventre sans appui, en continuité, jusqu’au bout des 20 m (coordination bras / jambes, corps allongé).'],
  ['P5', 'Au signal sonore, surplace vertical pendant 15 s',
    'S’arrêter dès le signal et tenir 15 s à la verticale, visage et voies respiratoires hors de l’eau, sans appui.'],
  ['P6', 'Reprendre le déplacement pour terminer les 20 m', 'Repartir sans appui après le surplace et terminer les 20 m en continuité.'],
  ['P7', 'Demi-tour sans reprise d’appuis, passer du ventre au dos',
    'Faire demi-tour sans toucher le mur ni le fond, passer du ventre au dos et s’allonger.'],
  ['P8', 'Se déplacer sur le dos sur 20 m', 'Se déplacer sur le dos sans appui, en continuité, jusqu’au bout des 20 m.'],
  ['P9', 'Au signal sonore, surplace dorsal horizontal (étoile) pendant 15 s',
    'S’arrêter dès le signal et tenir 15 s sur le dos à l’horizontale, voies respiratoires hors de l’eau, sans appui.'],
  ['P10', 'Reprendre le déplacement pour terminer les 20 m', 'Repartir sur le dos sans appui et terminer les 20 m en continuité.'],
  ['P11', 'Se retourner sur le ventre et franchir à nouveau l’obstacle en immersion',
    'Se retourner sur le ventre sans appui et franchir l’obstacle en immersion complète, sans le toucher.'],
  ['P12', 'Se déplacer sur le ventre pour revenir au point de départ', 'Revenir au point de départ sur le ventre, sans appui, en continuité.'],
  ['P13', 'S’ancrer de manière sécurisée sur un élément fixe et stable',
    'S’ancrer solidement à un élément fixe et stable, voies respiratoires hors de l’eau, en position d’attendre les secours.'],
  ['C1', 'Identifier la personne responsable de la surveillance',
    'Identifier seul la personne chargée de la surveillance et savoir que c’est elle qu’il faut alerter.'],
  ['C2', 'Connaître les règles d’hygiène et de sécurité du lieu de baignade',
    'Citer seul les principales règles d’hygiène et de sécurité du lieu de baignade, et les respecter.'],
  ['C3', 'Identifier les environnements et circonstances où le savoir-nager est utile',
    'Citer seul les lieux où le savoir-nager est adapté et les circonstances où il est utile.'],
].map(([code, texte, critere]) => ({ id: 'sn-' + code, code, texte, critere }));

const estSavoirNager = apsa => (apsa || '').trim().toLocaleLowerCase('fr').replace(/[\s-]+/g, ' ') === 'savoir nager';
const indicEtape = e => ({ id: e.id, nom: e.code, type: 'echelle', etape: true, texte: e.texte });
// (Étapes du savoir-nager : texte toujours à jour, même pour les séances enregistrées avec l'ancien parcours en 15 m.)
const texteIndic = ind => (ind.etape && ETAPES_SN.find(e => e.id === ind.id)?.texte) || ind.texte;
const titreIndic = ind => (texteIndic(ind) ? `${ind.nom} : ${texteIndic(ind)}` : nomCourtIndic(ind) + ' — ' + TYPES_INDIC[ind.type]);

// Champ d'apprentissage « habituel » d'une APSA (sans tenir compte du niveau de classe).
function caBrut(apsa) {
  const a = (apsa || '').trim().toLocaleLowerCase('fr');
  return Object.entries(CA_PAR_APSA).find(([, liste]) => liste.some(x => x.toLocaleLowerCase('fr') === a))?.[0] || '';
}

function modeleIndicateurs(apsa) {
  const modele = MODELES_APSA[(apsa || '').trim().toLocaleLowerCase('fr')] || MODELES_CA[caBrut(apsa)]
    || [I('Performance', 'temps'), OBS];
  return modele.map((ind, k) => ({ ...structuredClone(ind), id: 'i' + (k + 1) }));
}

/* ---------- Lecture / affichage des valeurs ---------- */

const seancesDe = classeId => Donnees.liste('seances', s => s.classeId === classeId)
  .sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.cree - b.cree);

// « 3:45 », « 3'45 », « 3m45 », « 1:02:03 », « 12,5 », « 45s », « 6min » → secondes (ou null si illisible).
function lireTemps(texte) {
  const brut = texte.trim().toLowerCase().replace(/\s+/g, '').replace(',', '.');
  const enMinutes = brut.match(/^(\d+(?:\.\d+)?)(?:min|mn)$/);
  if (enMinutes) return +enMinutes[1] * 60;
  const s = brut.replace(/[’'′]/g, ':').replace(/h(?=\d)/, ':').replace(/m(?=\d)/, ':').replace(/(min|mn|m|s)$/, '');
  const m = s.match(/^(?:(\d+):)?(?:(\d+):)?(\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const [, a, b, sec] = m;
  if (a !== undefined && +sec >= 60) return null;
  const h = b !== undefined ? +a : 0, min = b !== undefined ? +b : +(a ?? 0);
  return h * 3600 + min * 60 + +sec;
}

function formatTemps(secondes) {
  const t = Math.abs(+secondes);
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = Math.round((t % 60) * 100) / 100;
  const ss = s.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  if (t < 60) return ss + ' s';
  const ss2 = s < 10 ? '0' + ss : ss;
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss2}` : `${m}:${ss2}`;
}

function afficherValeur(ind, v) {
  if (!v) return '';
  if (ind.type === 'temps') return formatTemps(v);
  if (ind.type === 'distance' || ind.type === 'nombre') return v.replace('.', ',');
  return v;
}

// Texte saisi → valeur enregistrée (ou null si illisible).
function convertir(ind, brut) {
  if (ind.type === 'texte') return brut;
  if (ind.type === 'temps') { const s = lireTemps(brut); return s === null ? null : String(Math.round(s * 100) / 100); }
  const n = brut.replace(',', '.');
  return /^\d+(\.\d+)?$/.test(n) ? String(+n) : null;
}

const statutEnt = (seanceId, eleveId) => Donnees.note(seanceId, eleveId) || '';
const nomCourtIndic = ind => ind.nom + (ind.unite ? ` (${ind.unite})` : '');

/* ---------- Grille ---------- */

function htmlEntrainement(c) {
  const eleves = elevesDe(c.id);
  if (!eleves.length) {
    return `<div class="vide"><h2>${esc(c.nom)}</h2><p>Pas encore d’élèves dans cette classe.</p>
      <button class="primaire" data-action="vue-eleves">Ajouter des élèves</button></div>`;
  }
  const toutes = seancesDe(c.id);
  const exercices = [...new Set(toutes.map(s => s.titre))].sort(collator.compare);
  let filtre = ui.exercices?.[c.id] || '';
  if (!exercices.includes(filtre)) filtre = '';
  const seances = filtre ? toutes.filter(s => s.titre === filtre) : toutes;
  const suivi = !!filtre && !!principal(seances);
  return `
    <div class="outils">
      <h2>${esc(c.nom)}</h2>
      <button class="primaire" data-action="ajout-seance">+ Séance</button>
      <button data-action="excel-ent" title="Exporter ou importer le carnet d’entraînement de la classe (classeur Excel)">⇅ Excel</button>
      ${exercices.length ? `<label class="choix-tri">Exercice
        <select data-filtre-exercice="${c.id}">
          <option value="">Toutes (${toutes.length} séance${toutes.length > 1 ? 's' : ''})</option>
          ${exercices.map(x => `<option ${x === filtre ? 'selected' : ''}>${esc(x)}</option>`).join('')}
        </select></label>` : ''}
      <span class="aide aide-saisie">Temps : 3:45 ou 12,5 · <b>A</b> absent · <b>D</b> dispensé · <b>B</b> blessé · <b>M</b> malade · <b>O</b> autre</span>
    </div>
    ${toutes.length ? (filtre ? '' : '<p class="aide">Choisis un exercice pour voir la meilleure performance et l’évolution de chaque élève.</p>')
    : '<p class="aide">Crée une séance : les données à relever s’adaptent à l’APSA (temps en CA1, voies et sécurité en escalade, exécution en gym…). Rien ici ne compte dans les moyennes.</p>'}
    <div class="grille-scroll">
      <table class="grille grille-ent">
        <thead><tr>
          <th class="col-nom" rowspan="2">Élève</th>
          ${seances.map(s => `
            <th class="col-eval${classeCa(s)}" data-seance-entete="${s.id}" colspan="${s.indicateurs.length}" title="Modifier la séance">
              ${s.ca ? `<span class="chip-ca">${s.ca}</span>` : ''}
              <div class="eval-titre">${esc(s.titre)}</div>
              <div class="eval-info">${dateCourte(s.date)}${s.apsa && s.apsa !== s.titre ? ' · ' + esc(s.apsa) : ''}</div>
              ${docsDe(s).length ? `<button class="chip-docs" data-docs-seance="${s.id}" title="Documents joints (barème…)">📎 ${docsDe(s).length}</button>` : ''}
            </th>`).join('')}
          ${suivi ? `<th class="col-moy" rowspan="2">Meilleure<div class="eval-info">${esc(nomCourtIndic(principal(seances)))}</div></th>
            <th class="col-moy" rowspan="2">Évolution<div class="eval-info">1re → dernière</div></th>` : ''}
        </tr>
        <tr class="entete-comp">
          ${seances.map(s => s.indicateurs.map(ind => `<th class="sous-comp${classeCa(s)}" title="${esc(titreIndic(ind))}">${esc(nomCourtIndic(ind))}</th>`).join('')).join('')}
        </tr></thead>
        <tbody>
          ${eleves.map((el, i) => {
            let col = 0;
            return `<tr>
              ${celluleNom(el, i)}
              ${seances.map(s => {
                const statut = statutEnt(s.id, el.id);
                return s.indicateurs.map((ind, k) => celluleIndic(s, ind, el, i, col++, statut, k === 0)).join('');
              }).join('')}
              ${suivi ? `<td class="col-moy" data-meilleure="${el.id}"></td><td class="col-moy" data-evolution="${el.id}"></td>` : ''}
            </tr>`;
          }).join('')}
          ${seances.some(s => s.indicateurs.some(ind => ind.type !== 'texte')) ? `
          <tr class="ligne-repartition">
            <th class="col-nom">Répartition</th>
            ${seances.map(s => s.indicateurs.map((ind, k) => `<td class="bilan-comp${k === 0 ? ' debut-eval' + classeCa(s) : ''}" data-rep-indic="${s.id}|${ind.id}"></td>`).join('')).join('')}
            ${suivi ? '<td class="col-moy"></td><td class="col-moy"></td>' : ''}
          </tr>` : ''}
        </tbody>
        <tfoot><tr>
          <th class="col-nom">Classe</th>
          ${seances.map(s => s.indicateurs.map(ind => `<td class="stat-indic" data-stat-indic="${s.id}|${ind.id}"></td>`).join('')).join('')}
          ${suivi ? '<td class="col-moy"></td><td class="col-moy"></td>' : ''}
        </tr></tfoot>
      </table>
    </div>`;
}

function celluleIndic(s, ind, el, i, col, statut, premiere) {
  const attrs = `data-seance="${s.id}" data-eleve="${el.id}" data-indic="${ind.id}" data-ligne="${i}" data-col="${col}"`;
  const libelle = esc(`${el.nom} ${el.prenom} — ${s.titre} — ${ind.nom}`);
  const debut = premiere ? ` class="debut-eval${classeCa(s)}"` : '';
  if (statut) {
    // Élève absent / dispensé / blessé / malade : toute la séance est marquée ; on peut retaper dessus pour changer.
    return `<td${debut}><input class="cellule code-${statut}" value="${STATUTS_ENT[statut]}" ${attrs} autocomplete="off" aria-label="${libelle}"></td>`;
  }
  const v = Donnees.note(s.id, el.id, ind.id);
  if (ind.type === 'echelle') {
    return `<td${debut ? debut.replace('class="', 'class="td-niveau ') : ' class="td-niveau"'}><button class="niveau${v ? ' n' + v : ''}" data-niveau-ent ${attrs}
      title="${esc(ind.texte ? titreIndic(ind) : ind.nom)}" aria-label="${libelle}">${v}</button></td>`;
  }
  if (ind.type === 'choix') {
    return `<td${debut}><select class="cellule-choix" ${attrs} aria-label="${libelle}">
      <option value=""></option>${(ind.options || []).map(o => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}
    </select></td>`;
  }
  const suggestion = !v && premiere && dispenseLe(el, s.date) ? ' placeholder="disp."' : '';
  const clavier = ind.type === 'distance' || ind.type === 'nombre' ? 'decimal' : 'text';
  return `<td${debut}><input class="cellule${ind.type === 'texte' ? ' cellule-texte' : ''}"${suggestion} value="${esc(afficherValeur(ind, v))}" ${attrs}
    inputmode="${clavier}" autocomplete="off" enterkeyhint="next" aria-label="${libelle}"></td>`;
}

// Redessine la grille en gardant le focus sur la case où se trouvait l'utilisateur.
function rafraichirEnt() {
  const a = document.activeElement?.dataset;
  const [ligne, col] = a?.ligne !== undefined ? [a.ligne, a.col] : [null, null];
  rendreVue();
  if (ligne !== null) $(`.grille [data-ligne="${ligne}"][data-col="${col}"]`)?.focus();
}

function validerCelluleEnt(input) {
  const s = Donnees.get('seances', input.dataset.seance);
  const eleveId = input.dataset.eleve;
  const ind = s.indicateurs.find(x => x.id === input.dataset.indic);
  if (!ind) return;
  const brut = input.value.trim();
  const code = CODES_ENT[brut.toLocaleUpperCase('fr')];
  const statut = statutEnt(s.id, eleveId);
  if (code) {
    if (code !== statut) { Donnees.ecrireNote(s.id, eleveId, code); rafraichirEnt(); }
    return;
  }
  if (statut) {
    if (brut === STATUTS_ENT[statut]) return; // rien de changé
    // On sort du statut ; si une valeur a été tapée à la place, on l'enregistre.
    Donnees.ecrireNote(s.id, eleveId, '');
    const v = brut && TYPES_NUMERIQUES.concat('texte').includes(ind.type) ? convertir(ind, brut) : null;
    if (v) Donnees.ecrireNote(s.id, eleveId, v, ind.id);
    return rafraichirEnt();
  }
  const avant = Donnees.note(s.id, eleveId, ind.id);
  let valeur = '';
  if (brut) {
    valeur = convertir(ind, brut);
    if (valeur === null) {
      toast(`« ${brut} » : ${ind.type === 'temps' ? 'temps attendu, par ex. 3:45 ou 12,5' : 'nombre attendu'} — ou A, D, B, M, O.`, 'erreur');
      input.value = afficherValeur(ind, avant);
      return;
    }
  }
  if (valeur !== avant) Donnees.ecrireNote(s.id, eleveId, valeur, ind.id);
  input.value = afficherValeur(ind, valeur);
  majStatsEnt();
}

// Barre de codes rapides / touches A, D, B, M : statut de l'élève sur la séance. Code vide = effacer.
function appliquerStatutEnt(cible, code) {
  const { seance, eleve, indic } = cible.dataset;
  const statut = statutEnt(seance, eleve);
  if (code) {
    if (code !== statut) Donnees.ecrireNote(seance, eleve, code);
  } else if (statut) {
    Donnees.ecrireNote(seance, eleve, '');
  } else {
    Donnees.ecrireNote(seance, eleve, '', indic);
  }
  rafraichirEnt();
}

function changerEchelleEnt(bouton, valeur) {
  const { seance, eleve, indic } = bouton.dataset;
  const avant = Donnees.note(seance, eleve, indic);
  if (valeur === undefined) valeur = avant === '4' ? '' : String(+avant + 1); // vide → 1 → 2 → 3 → 4 → vide
  if (valeur !== avant) Donnees.ecrireNote(seance, eleve, valeur, indic);
  bouton.className = 'niveau' + (valeur ? ' n' + valeur : '');
  bouton.textContent = valeur;
  majStatsEnt();
}

/* ---------- Statistiques : bas de colonne, meilleure perf, évolution ---------- */

// Donnée suivie pour un exercice : une liste ordonnée marquée « progression » (ex. cotation en escalade),
// sinon la 1re donnée chiffrée de la dernière séance.
function principal(seances) {
  const inds = seances.at(-1)?.indicateurs || [];
  return inds.find(ind => ind.type === 'choix' && ind.suivi) || inds.find(ind => TYPES_NUMERIQUES.includes(ind.type)) || null;
}

// Valeur comparable d'un élève pour la donnée suivie (rang dans la liste pour un choix ordonné).
function valeurSuivie(ind, v) {
  if (!v) return null;
  if (ind.type === 'choix') { const k = (ind.options || []).indexOf(v); return k < 0 ? null : k; }
  return nombre(v);
}

// Bilan d'une colonne pour la classe (élèves présents et renseignés) :
//   court  : l'essentiel, pour la ligne « Classe » collée en bas ;
//   barre / lignes : le détail, pour la ligne « Répartition » ;  detail : texte de l'infobulle.
//   Échelle 1 à 4 → % par degré et % au degré 3 ou plus ; liste de choix → % par réponse ;
//   temps / distance / nombre → moyenne et extrêmes (pour un temps : plus rapide / plus lent).
function bilanIndic(ind, valeurs) {
  const n = valeurs.length;
  if (!n) return { court: '–', detail: [] };
  const pct = k => Math.round((k / n) * 100);
  const eleves = k => `${k} élève${k > 1 ? 's' : ''}`;
  const ligne = (html, zero = false) => {
    const div = document.createElement('div');
    div.className = 'ligne-rep' + (zero ? ' rep-zero' : '');
    div.innerHTML = html;
    return div;
  };
  const bloc = lignes => { const div = document.createElement('div'); div.className = 'lignes-rep'; div.append(...lignes); return div; };

  if (ind.type === 'echelle') {
    const barre = document.createElement('div');
    barre.className = 'barre-rep';
    const lignes = [], detail = [];
    for (const { v, nom } of NIVEAUX_MAITRISE) {
      const k = valeurs.filter(x => x === v).length;
      if (k) {
        const part = document.createElement('span');
        part.className = 'n' + v;
        part.style.width = (k / n) * 100 + '%';
        barre.append(part);
      }
      lignes.push(ligne(`<span class="pastille-rep n${v}"></span>${pct(k)}%`, !k));
      detail.push(`${v} – ${nom} : ${eleves(k)} (${pct(k)} %)`);
    }
    const acquis = valeurs.filter(x => x >= '3').length;
    lignes.push(ligne(`<b>${pct(acquis)}% ≥ 3</b>`, !acquis));
    detail.push(`Degré 3 ou 4 : ${eleves(acquis)} (${pct(acquis)} %)`);
    return { court: `${pct(acquis)} % ≥ 3`, barre, lignes: bloc(lignes), detail };
  }

  if (ind.type === 'choix') {
    const prevues = ind.options || [];
    const options = [...prevues, ...new Set(valeurs.filter(v => !prevues.includes(v)))];
    const comptes = options.map(o => [o, valeurs.filter(v => v === o).length]);
    const [top, kTop] = [...comptes].sort((a, b) => b[1] - a[1])[0];
    return {
      court: `${top} ${pct(kTop)} %`,
      lignes: bloc(comptes.map(([o, k]) => ligne(`${esc(o)}&nbsp;: ${pct(k)}%`, !k))),
      detail: comptes.map(([o, k]) => `${o} : ${eleves(k)} (${pct(k)} %)`),
    };
  }

  if (TYPES_NUMERIQUES.includes(ind.type)) {
    const nombres = valeurs.map(Number).filter(x => !isNaN(x));
    if (!nombres.length) return { court: '–', detail: [] };
    const moy = nombres.reduce((a, b) => a + b, 0) / nombres.length;
    const aff = x => (ind.type === 'temps' ? formatTemps(x) : fmt(Math.round(x * 10) / 10) + (ind.unite ? ' ' + ind.unite : ''));
    // (Pour un nombre, « meilleur » dépend de la donnée — haies renversées, chutes… : on dit min / max.)
    const [libMin, libMax] = ind.type === 'temps' ? ['Plus rapide', 'Plus lent'] : ['Min', 'Max'];
    const min = Math.min(...nombres), max = Math.max(...nombres);
    return {
      court: aff(moy),
      lignes: bloc([ligne(`<b>Moy. ${esc(aff(moy))}</b>`), ligne(`${libMin} ${esc(aff(min))}`), ligne(`${libMax} ${esc(aff(max))}`)]),
      detail: [`Moyenne : ${aff(moy)}`, `${libMin} : ${aff(min)}`, `${libMax} : ${aff(max)}`],
    };
  }

  return { court: `${n} obs.`, detail: [] };
}

function majStatsEnt() {
  const c = classeActive();
  if (!c || !$('.grille-ent')) return;
  const eleves = elevesDe(c.id);
  const seances = [...document.querySelectorAll('[data-seance-entete]')].map(th => Donnees.get('seances', th.dataset.seanceEntete));
  for (const s of seances) {
    const presents = eleves.filter(el => !statutEnt(s.id, el.id));
    const statuts = eleves.map(el => statutEnt(s.id, el.id)).filter(Boolean);
    const resumeStatuts = [['ABS', 'absent'], ['DISP', 'dispensé'], ['BLE', 'blessé'], ['MAL', 'malade'], ['AUT', 'autre']]
      .map(([code, mot]) => { const n = statuts.filter(x => x === code).length; return n ? `${n} ${mot}${n > 1 ? 's' : ''}` : ''; })
      .filter(Boolean).join(' · ') || 'Aucun absent, dispensé, blessé, malade ou autre';
    for (const ind of s.indicateurs) {
      const td = $(`[data-stat-indic="${s.id}|${ind.id}"]`);
      if (!td) continue;
      const valeurs = presents.map(el => Donnees.note(s.id, el.id, ind.id)).filter(Boolean);
      const bilan = bilanIndic(ind, valeurs);
      const titre = `${ind.nom}\n${bilan.detail.join('\n')}${bilan.detail.length ? '\n' : ''}`
        + `${valeurs.length} élève${valeurs.length > 1 ? 's' : ''} renseigné${valeurs.length > 1 ? 's' : ''} sur ${presents.length} présent${presents.length > 1 ? 's' : ''}\n${resumeStatuts}`;
      // Ligne « Classe » (collée en bas) : l'essentiel, sur une ligne.
      td.replaceChildren();
      if (bilan.barre) td.append(bilan.barre.cloneNode(true));
      td.append(bilan.court);
      td.title = titre;
      // Ligne « Répartition » : le détail (pourcentages par degré ou par réponse, moyenne / extrêmes…).
      const rep = $(`[data-rep-indic="${s.id}|${ind.id}"]`);
      if (rep) {
        rep.replaceChildren();
        if (bilan.barre) rep.append(bilan.barre);
        if (bilan.lignes) rep.append(bilan.lignes); else rep.append(bilan.court);
        rep.title = titre;
      }
    }
  }
  const ref = principal(seances);
  if (!ref || !$('[data-meilleure]')) return;
  const mieux = ref.type === 'temps' ? (a, b) => a < b : (a, b) => a > b;
  for (const el of eleves) {
    const perfs = seances.map(s => {
      const ind = s.indicateurs.find(x => x.nom === ref.nom && x.type === ref.type);
      return ind && !statutEnt(s.id, el.id) ? valeurSuivie(ind, Donnees.note(s.id, el.id, ind.id)) : null;
    }).filter(n => n !== null);
    const tdM = $(`[data-meilleure="${el.id}"]`), tdE = $(`[data-evolution="${el.id}"]`);
    tdE.className = 'col-moy';
    tdE.title = '';
    if (!perfs.length) { tdM.textContent = '–'; tdE.textContent = '–'; continue; }
    const meilleure = perfs.reduce((a, b) => (mieux(b, a) ? b : a));
    tdM.textContent = ref.type === 'choix' ? ref.options[meilleure] : afficherValeur(ref, String(meilleure));
    if (perfs.length < 2) { tdE.textContent = '–'; continue; }
    const ecart = perfs.at(-1) - perfs[0];
    const progres = ecart !== 0 && mieux(perfs.at(-1), perfs[0]);
    const valeurEcart = ref.type === 'temps' ? formatTemps(ecart)
      : ref.type === 'choix' ? `${Math.abs(ecart)} niveau${Math.abs(ecart) > 1 ? 'x' : ''}`
        : fmt(Math.abs(ecart)) + (ref.unite ? ' ' + ref.unite : '');
    tdE.textContent = ecart === 0 ? '=' : (ecart > 0 ? '+' : '−') + valeurEcart;
    if (ecart) tdE.className = 'col-moy ' + (progres ? 'progres' : 'regres');
    tdE.title = ecart === 0 ? 'Même performance' : progres ? 'En progrès' : 'En baisse';
  }
}

/* ---------- Documents joints aux séances (barème, fiche d'observation…) ----------
   Rangés dans le carnet (collection « documents », chiffrée avec lui sur la clé) : ils suivent sur la tablette.
   Une séance liste ses documents (`documents: [id…]`). Une nouvelle séance du même exercice reprend les documents
   de la précédente sans les recopier ; un document n'est supprimé que lorsque plus aucune séance ne l'utilise. */

const TAILLE_MAX_DOC = 5 * 1024 * 1024;
const ALERTE_TOTAL_DOCS = 20 * 1024 * 1024;
const TYPES_DOCS = '.pdf,.doc,.docx,.odt,.xls,.xlsx,.ods,.png,.jpg,.jpeg';
const docsDe = s => (s?.documents || []).map(id => Donnees.get('documents', id)).filter(Boolean);
const tailleLisible = o => (o < 1024 * 1024 ? Math.max(1, Math.round(o / 1024)) + ' Ko'
  : (o / 1024 / 1024).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' Mo');
const iconeDoc = nom => (/\.pdf$/i.test(nom) ? '📕' : /\.(docx?|odt)$/i.test(nom) ? '📘'
  : /\.(xlsx?|ods)$/i.test(nom) ? '📗' : /\.(png|jpe?g)$/i.test(nom) ? '🖼' : '📄');

const lireEnBase64 = f => new Promise((ok, ko) => {
  const r = new FileReader();
  r.onload = () => ok(String(r.result).split(',')[1] || '');
  r.onerror = () => ko(r.error);
  r.readAsDataURL(f);
});

// Ouvre le document avec l'appli de l'appareil (lecteur PDF, Word…) : il est remis comme un téléchargement.
function ouvrirDocument(doc) {
  const octets = Uint8Array.from(atob(doc.contenu), ch => ch.charCodeAt(0));
  const url = URL.createObjectURL(new File([octets], doc.nom, { type: doc.type || 'application/octet-stream' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = doc.nom;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// Après suppression de séances : retire les documents que plus aucune séance n'utilise.
function supprimerDocumentsInutilises(ids) {
  const utilises = new Set(Donnees.liste('seances').flatMap(x => x.documents || []));
  for (const id of ids) if (!utilises.has(id)) Donnees.supprimer('documents', id);
}

const ligneDoc = doc => `<li class="ligne-doc">
    <span class="doc-icone" aria-hidden="true">${iconeDoc(doc.nom)}</span>
    <span class="doc-nom">${esc(doc.nom)} <span class="aide">${tailleLisible(doc.taille || 0)}</span></span>
    <button type="button" data-ouvrir-doc="${doc.id}">Ouvrir</button>
    ${doc.retirable === false ? '' : `<button type="button" class="icone-petit" data-retirer-doc="${doc.id}" title="Retirer ce document de la séance" aria-label="Retirer ${esc(doc.nom)}">✕</button>`}
  </li>`;

// Lecture rapide depuis la grille (bouton 📎 de l'en-tête de séance).
async function voirDocuments(seanceId) {
  const s = Donnees.get('seances', seanceId);
  const docs = docsDe(s);
  const { d, resultat } = ouvrirModale(`Documents — ${s.titre}`, `
    <ul class="liste-docs">${docs.map(doc => ligneDoc({ ...doc, retirable: false })).join('')}</ul>
    <p class="aide">« Ouvrir » remet le fichier à l’appareil, qui l’ouvre avec son lecteur (PDF, Word…).</p>`,
  '<button value="modifier">Modifier la séance</button><span class="espace"></span><button type="button" data-fermer class="primaire">Fermer</button>');
  d.addEventListener('click', e => {
    const b = e.target.closest('[data-ouvrir-doc]');
    if (b) ouvrirDocument(docs.find(x => x.id === b.dataset.ouvrirDoc));
  });
  if ((await resultat).action === 'modifier') await editerSeance(seanceId);
}

// Le bouton 📎 de l'en-tête ne doit pas ouvrir la fiche de la séance (capture : passe avant le clic sur l'en-tête).
document.addEventListener('click', e => {
  const b = e.target.closest('[data-docs-seance]');
  if (!b || b.closest('dialog')) return;
  e.stopPropagation();
  lancer(() => voirDocuments(b.dataset.docsSeance));
}, true);

/* ---------- Fiche de séance ---------- */

function ligneIndic(ind) {
  const param = ind.type === 'choix' ? (ind.options || []).join(' / ') : ind.unite || '';
  return `<div class="ligne-indic">
    <input type="hidden" name="ind-id" value="${esc(ind.id || '')}">
    <input type="hidden" name="ind-suivi" value="${ind.suivi ? '1' : ''}">
    <input name="ind-nom" required value="${esc(ind.nom || '')}" placeholder="Nom de la donnée" aria-label="Nom de la donnée">
    <select name="ind-type" aria-label="Type">${Object.entries(TYPES_INDIC).map(([k, n]) => `<option value="${k}" ${ind.type === k ? 'selected' : ''}>${n}</option>`).join('')}</select>
    <input name="ind-param" value="${esc(param)}" aria-label="Unité ou options">
    <button type="button" class="icone-petit" data-suppr-indic title="Retirer cette donnée" aria-label="Retirer cette donnée">✕</button>
  </div>`;
}

async function editerSeance(id) {
  const c = classeActive();
  const filtre = ui.exercices?.[c.id];
  // Nouvelle séance : vierge, sauf si un exercice est choisi dans le filtre (on reprend alors sa dernière séance,
  // il suffit souvent de changer la date).
  const modele = id || !filtre ? null : seancesDe(c.id).filter(s => s.titre === filtre).at(-1) || null;
  const s = id ? Donnees.get('seances', id)
    : modele ? { titre: modele.titre, apsa: modele.apsa, date: aujourdhui(), indicateurs: structuredClone(modele.indicateurs), documents: [...(modele.documents || [])] }
      : { titre: '', apsa: '', date: aujourdhui(), indicateurs: modeleIndicateurs('') };
  const exercices = [...new Set(seancesDe(c.id).map(x => x.titre))];
  const { d, resultat } = ouvrirModale(id ? 'Modifier la séance' : 'Nouvelle séance d’entraînement', `
    <div class="ligne">
      <label>APSA<input name="apsa" list="liste-apsa-ent" value="${esc(s.apsa || '')}" placeholder="ex. Escalade"></label>
      <label>Date<input type="date" name="date" value="${esc(s.date)}"></label>
    </div>
    <datalist id="liste-apsa-ent">${APSA.map(a => `<option value="${esc(a)}">`).join('')}</datalist>
    <label>Nom de la séance / exercice<input name="titre" required list="liste-exercices" value="${esc(s.titre)}" placeholder="ex. Escalade — voies en tête"></label>
    <datalist id="liste-exercices">${exercices.map(x => `<option value="${esc(x)}">`).join('')}</datalist>
    <p class="aide">Garde le même nom d’une séance à l’autre pour suivre les progrès (meilleure performance, évolution).</p>
    <fieldset class="competences" data-zone-etapes ${estSavoirNager(s.apsa) ? '' : 'hidden'}>
      <legend>Étapes travaillées — savoir-nager (ASNS)</legend>
      <p class="aide">Chaque étape cochée devient une colonne : degré de maîtrise de 1 à 4 pour chaque élève.
        Parcours de l’attestation : en continuité, sans reprise d’appuis, sans lunettes.</p>
      <div class="ligne">
        <button type="button" data-etapes="parcours">Tout le parcours</button>
        <button type="button" data-etapes="aucune">Aucune</button>
      </div>
      <p class="aide"><b>Parcours</b></p>
      ${ETAPES_SN.map(e => `${e.code === 'C1' ? '<p class="aide"><b>Connaissances et attitudes</b></p>' : ''}
        <label class="case competence"><input type="checkbox" name="etape" value="${e.id}" ${s.indicateurs.some(i => i.id === e.id) ? 'checked' : ''}>
          <span><b>${e.code}</b> ${esc(e.texte)}</span></label>`).join('')}
    </fieldset>
    <fieldset class="competences">
      <legend>Données relevées <span class="chip-ca" data-chip-ca></span></legend>
      <div class="liste-indic">${s.indicateurs.filter(i => !i.etape).map(ligneIndic).join('')}</div>
      <div class="ligne">
        <button type="button" data-ajout-indic>+ Ajouter une donnée</button>
        <button type="button" data-modele-indic>Recharger le modèle de l’APSA</button>
      </div>
      <p class="aide">Temps : 3:45 · Distance / nombre : avec unité (m, kg, bpm…) · Échelle 1 à 4 : couleurs des degrés ·
        Choix : options séparées par « / » · Texte : observation libre.</p>
    </fieldset>
    <fieldset class="competences">
      <legend>Documents (barème, fiche…)</legend>
      <p class="aide" data-docs-repris hidden></p>
      <ul class="liste-docs" data-liste-docs></ul>
      <label class="bouton">📎 Joindre un document<input type="file" accept="${TYPES_DOCS}" multiple data-joindre hidden></label>
      <p class="aide">PDF, Word, tableur ou photo — 5 Mo maximum par fichier. Ils sont rangés dans le carnet : ils suivent sur la clé
        et la tablette, et les prochaines séances du même exercice les reprennent.</p>
    </fieldset>`,
  boutonsModale(id ? 'Enregistrer' : 'Créer', id ? BOUTON_SUPPRIMER : ''), 'modale-large');

  const liste = $('.liste-indic', d), champApsa = $('[name="apsa"]', d), champTitre = $('[name="titre"]', d);
  let retouche = !!id || !!modele; // données déjà choisies : on ne les remplace pas sans demander
  const majParams = () => liste.querySelectorAll('.ligne-indic').forEach(l => {
    const type = $('[name="ind-type"]', l).value, p = $('[name="ind-param"]', l);
    p.hidden = !['distance', 'nombre', 'choix'].includes(type);
    p.placeholder = type === 'choix' ? 'Options : A / B / C' : 'Unité (m, kg, bpm…)';
  });
  const majChip = () => {
    const ca = caBrut(champApsa.value), chip = $('[data-chip-ca]', d);
    chip.textContent = ca;
    chip.hidden = !ca;
    chip.className = 'chip-ca' + (ca ? ' ca-' + ca : '');
  };
  const chargerModele = () => {
    liste.innerHTML = modeleIndicateurs(champApsa.value).map(ligneIndic).join('');
    majParams();
  };
  let ancienneApsa = champApsa.value;
  const zoneEtapes = $('[data-zone-etapes]', d);
  champApsa.addEventListener('change', () => {
    majChip();
    zoneEtapes.hidden = !estSavoirNager(champApsa.value);
    if (!champTitre.value.trim() || champTitre.value === ancienneApsa) champTitre.value = champApsa.value;
    ancienneApsa = champApsa.value;
    if (!retouche) chargerModele();
  });
  liste.addEventListener('change', e => { retouche = true; if (e.target.name === 'ind-type') majParams(); });
  liste.addEventListener('input', () => { retouche = true; });
  d.addEventListener('click', e => {
    if (e.target.closest('[data-suppr-indic]')) { e.target.closest('.ligne-indic').remove(); retouche = true; }
    if (e.target.closest('[data-ajout-indic]')) {
      liste.insertAdjacentHTML('beforeend', ligneIndic({ nom: '', type: 'nombre' }));
      majParams();
      liste.lastElementChild.querySelector('[name="ind-nom"]').focus();
      retouche = true;
    }
    if (e.target.closest('[data-modele-indic]')) chargerModele();
    const choix = e.target.closest('[data-etapes]')?.dataset.etapes;
    if (choix) zoneEtapes.querySelectorAll('[name="etape"]').forEach(c => { c.checked = choix === 'parcours' && c.value.startsWith('sn-P'); });
  });
  majParams();
  majChip();

  // Documents : liste de travail, enregistrée seulement si on valide la fiche.
  let docs = docsDe(s);
  const listeDocs = $('[data-liste-docs]', d), noteReprise = $('[data-docs-repris]', d);
  const majDocs = () => {
    listeDocs.innerHTML = docs.map(ligneDoc).join('') || '<li class="aide">Aucun document.</li>';
  };
  majDocs();
  // Nouvelle séance d'un exercice existant (même nom) : on propose ses documents.
  champTitre.addEventListener('change', () => {
    if (id || docs.length) return;
    const precedente = seancesDe(c.id).filter(x => x.titre === champTitre.value.trim() && x.documents?.length).at(-1);
    if (!precedente) return;
    docs = docsDe(precedente);
    noteReprise.textContent = `Documents repris de la séance du ${dateCourte(precedente.date)} (retire-les avec ✕ si besoin).`;
    noteReprise.hidden = false;
    majDocs();
  });
  d.addEventListener('click', e => {
    const ouvrir = e.target.closest('[data-ouvrir-doc]'), retirer = e.target.closest('[data-retirer-doc]');
    if (ouvrir) ouvrirDocument(docs.find(x => x.id === ouvrir.dataset.ouvrirDoc));
    if (retirer) { docs = docs.filter(x => x.id !== retirer.dataset.retirerDoc); majDocs(); }
  });
  $('[data-joindre]', d).addEventListener('change', e => lancer(async () => {
    for (const f of [...e.target.files]) {
      if (f.size > TAILLE_MAX_DOC) { toast(`« ${f.name} » est trop lourd (${tailleLisible(f.size)}) : 5 Mo maximum.`, 'erreur'); continue; }
      docs.push({ id: Donnees.nouvelId(), nom: f.name, type: f.type, taille: f.size, contenu: await lireEnBase64(f), nouveau: true });
    }
    e.target.value = '';
    majDocs();
  }));

  const r = await resultat;
  if (r.action === 'supprimer') {
    if (await confirmer(`Supprimer la séance « ${s.titre} » du ${dateCourte(s.date)} et toutes ses données ?`)) {
      supprimerNotes(n => n.evalId === id);
      Donnees.supprimer('seances', id);
      supprimerDocumentsInutilises(s.documents || []);
    }
  } else if (r.action === 'ok') {
    const ids = r.fd.getAll('ind-id'), noms = r.fd.getAll('ind-nom'), types = r.fd.getAll('ind-type'), params = r.fd.getAll('ind-param');
    const suivis = r.fd.getAll('ind-suivi');
    const pris = new Set();
    let indicateurs = noms.map((nom, k) => {
      const type = types[k], param = (params[k] || '').trim();
      let idInd = ids[k] && !pris.has(ids[k]) ? ids[k] : 'i' + Donnees.nouvelId().slice(0, 8);
      pris.add(idInd);
      const ind = { id: idInd, nom: nom.trim(), type };
      if (type === 'choix') {
        ind.options = param.split('/').map(o => o.trim()).filter(Boolean);
        if (suivis[k] === '1') ind.suivi = true;
      }
      else if ((type === 'distance' || type === 'nombre') && param) ind.unite = param;
      return ind;
    }).filter(ind => ind.nom);
    // Savoir-nager : les étapes cochées passent en tête, dans l'ordre du parcours.
    if (estSavoirNager(r.data.apsa)) {
      const cochees = new Set(r.fd.getAll('etape'));
      indicateurs = [...ETAPES_SN.filter(e => cochees.has(e.id)).map(indicEtape), ...indicateurs];
    }
    if (!indicateurs.length) indicateurs = [{ id: 'i1', nom: 'Observation', type: 'texte' }];
    for (const doc of docs.filter(x => x.nouveau)) {
      const { nouveau, ...fiche } = doc;
      Donnees.ecrire('documents', { ...fiche, ajouteLe: Date.now() });
    }
    const avant = s.documents || [];
    Donnees.ecrire('seances', {
      ...s, id: s.id || Donnees.nouvelId(), classeId: c.id, cree: s.cree || Date.now(),
      titre: r.data.titre.trim(), apsa: r.data.apsa.trim(), ca: caBrut(r.data.apsa), date: r.data.date, indicateurs,
      documents: docs.map(x => x.id),
    });
    supprimerDocumentsInutilises(avant.filter(x => !docs.some(y => y.id === x))); // retirés de cette séance
    const total = Donnees.liste('documents').reduce((t, x) => t + (x.taille || 0), 0);
    if (docs.some(x => x.nouveau) && total > ALERTE_TOTAL_DOCS) {
      toast(`Les documents joints pèsent ${tailleLisible(total)} au total : le carnet devient lourd à transférer sur la clé.`, 'erreur');
    }
  }
  rendre();
}

/* ---------- Fiche élève (toucher le nom d'un élève dans la grille d'entraînement) ----------
   Synthèse de son activité, APSA par APSA : acquis (dernière valeur de chaque donnée), évolution d'une séance
   à l'autre, présence, priorités à travailler (règles simples et visibles) et observations du prof.
   Les données d'une même APSA sont regroupées d'une séance à l'autre par leur nom (étapes ASNS : par étape). */

const apsaDe = s => (s.apsa || s.titre || 'Sans APSA').trim();
const cleIndic = ind => (ind.etape ? ind.id : `${ind.nom.trim().toLocaleLowerCase('fr')}|${ind.type}`);
const idSuivi = (eleveId, apsa) => `${eleveId}|${apsa.toLocaleLowerCase('fr')}`;
const pastilleDegre = v => `<span class="degre-fiche${v ? ' n' + v : ''}">${v || '·'}</span>`;

// Les valeurs de l'élève pour chaque donnée de l'APSA, dans l'ordre des séances, et sa présence.
function parcoursEleve(eleveId, seances) {
  const donnees = new Map(), statuts = {};
  let presences = 0;
  for (const s of seances) {
    const statut = statutEnt(s.id, eleveId);
    if (statut) { statuts[statut] = (statuts[statut] || 0) + 1; continue; }
    presences++;
    for (const ind of s.indicateurs) {
      const k = cleIndic(ind);
      if (!donnees.has(k)) donnees.set(k, { ind, valeurs: [] });
      const d = donnees.get(k);
      d.ind = ind; // la définition la plus récente
      const v = Donnees.note(s.id, eleveId, ind.id);
      if (v) d.valeurs.push({ v, s });
    }
  }
  return { donnees, statuts, presences };
}

// Sens du progrès : +1 si « plus » est mieux, -1 si « moins » est mieux, 0 si ça dépend (ex. un nombre).
const sensProgres = ind => (ind.type === 'echelle' || ind.type === 'distance' ? 1 : ind.type === 'temps' ? -1
  : ind.type === 'choix' && ind.suivi ? 1 : 0);
const valeurComparable = (ind, v) => (ind.type === 'choix' ? (ind.options || []).indexOf(v) : nombre(v));

function fleche(ind, a, b) {
  const x = valeurComparable(ind, a), y = valeurComparable(ind, b), sens = sensProgres(ind);
  if (x === null || y === null || x < 0 || y < 0 || x === y) return '<span class="tendance">=</span>';
  const mieux = sens ? (y - x) * sens > 0 : null;
  return mieux === null ? `<span class="tendance">${y > x ? '↗' : '↘'}</span>`
    : `<span class="tendance ${mieux ? 'progres' : 'regres'}">${mieux ? '↗' : '↘'}</span>`;
}

const afficherV = (ind, v) => (ind.type === 'echelle' ? pastilleDegre(v) : esc(afficherValeur(ind, v)));

function htmlFiche(el, apsa, seances) {
  const { donnees, statuts, presences } = parcoursEleve(el.id, seances);
  const etapes = ETAPES_SN.map(e => ({ e, d: donnees.get(e.id) })).filter(x => x.d);
  const autres = [...donnees.values()].filter(d => !d.ind.etape);
  const derniere = d => d.valeurs.at(-1)?.v || '';
  const dateCourteS = x => dateCourte(x.s.date);

  // Présence
  const absences = Object.entries(statuts).map(([code, n]) => `${n} ${STATUTS_ENT[code]}`).join(' · ');
  let html = `<p class="fiche-presence">Présence : ${presences} séance${presences > 1 ? 's' : ''} sur ${seances.length}${absences ? ' · ' + esc(absences) : ''}</p>`;

  // Savoir-nager : le parcours en un coup d'œil
  if (etapes.length) {
    const parcours = ETAPES_SN.filter(e => e.code.startsWith('P'));
    const acquises = parcours.filter(e => (derniere(donnees.get(e.id) || { valeurs: [] }) || '0') >= '3').length;
    const attestation = autres.find(d => d.ind.type === 'choix' && /attestation/i.test(d.ind.nom));
    html += `<h3>Parcours ASNS</h3>
      <div class="parcours-fiche">${parcours.map(e => {
        const d = donnees.get(e.id);
        return `<div class="etape-fiche" title="${esc(e.code + ' : ' + e.texte)}"><span>${e.code}</span>${pastilleDegre(d ? derniere(d) : '')}</div>`;
      }).join('')}</div>
      <p class="aide"><b>${acquises} étape${acquises > 1 ? 's' : ''} sur ${parcours.length}</b> au degré 3 ou plus (dernière évaluation)${
        attestation && derniere(attestation) ? ` · Attestation : <b>${esc(derniere(attestation))}</b>` : ''}.</p>`;
  }

  // Acquis et évolution, donnée par donnée
  const lignes = [...etapes.map(x => x.d), ...autres].filter(d => d.ind.type !== 'texte' && d.valeurs.length);
  if (lignes.length) {
    html += `<h3>Acquis et évolution</h3><table class="tableau-fiche"><tbody>${lignes.map(d => {
      const { ind, valeurs } = d;
      const nomInd = ind.etape ? `<b>${esc(ind.nom)}</b> ${esc(texteIndic(ind))}` : esc(nomCourtIndic(ind));
      const suite = valeurs.map(x => `<span class="valeur-suite" title="${esc(dateCourteS(x))}">${afficherV(ind, x.v)}</span>`).join('<span class="sep-suite">→</span>');
      let extra = '';
      if (TYPES_NUMERIQUES.includes(ind.type) && sensProgres(ind)) {
        const nums = valeurs.map(x => nombre(x.v)).filter(n => n !== null);
        const meilleure = sensProgres(ind) < 0 ? Math.min(...nums) : Math.max(...nums);
        extra = `<span class="aide"> · meilleure : ${esc(afficherValeur(ind, String(meilleure)))}</span>`;
      }
      return `<tr><th>${nomInd}</th><td>${suite}${valeurs.length > 1 ? ' ' + fleche(ind, valeurs[0].v, valeurs.at(-1).v) : ''}${extra}</td></tr>`;
    }).join('')}</tbody></table>`;
  }

  // Observations notées pendant les séances (données de type texte)
  const observations = autres.filter(d => d.ind.type === 'texte').flatMap(d => d.valeurs.map(x => ({ ...x, nom: d.ind.nom })));
  if (observations.length) {
    html += `<h3>Observations en séance</h3><ul class="liste-fiche">${observations
      .map(x => `<li><span class="aide">${esc(dateCourteS(x))} · ${esc(x.nom)} :</span> ${esc(x.v)}</li>`).join('')}</ul>`;
  }

  // Priorités : règles simples, dans cet ordre (une seule ligne par donnée).
  const priorites = new Map(); // clé de la donnée → { texte, baisse }
  // 1. Étapes ASNS sous le degré 3, dans l'ordre du parcours (c'est un enchaînement : la première manquante d'abord).
  for (const { e, d } of etapes) {
    const v = derniere(d);
    if (v && v < '3') priorites.set(e.id, { texte: `<b>${e.code}</b> ${esc(e.texte)} — degré ${v} → viser 3 :`, critere: e.critere });
  }
  // 2. Autres échelles sous le degré 3.
  for (const d of autres.filter(x => x.ind.type === 'echelle')) {
    const v = derniere(d);
    if (v && v < '3') priorites.set(cleIndic(d.ind), { texte: `<b>${esc(d.ind.nom)}</b> — degré ${v} → viser le degré 3` });
  }
  // 3. En baisse par rapport à la séance précédente (échelles, temps, distances) : ajouté à la ligne existante, sinon nouvelle ligne.
  for (const d of [...etapes.map(x => x.d), ...autres]) {
    const sens = sensProgres(d.ind);
    if (!sens || d.valeurs.length < 2 || d.ind.type === 'choix') continue;
    const a = valeurComparable(d.ind, d.valeurs.at(-2).v), b = valeurComparable(d.ind, d.valeurs.at(-1).v);
    if (a === null || b === null || (b - a) * sens >= 0) continue;
    const baisse = `en baisse depuis la séance précédente (${afficherV(d.ind, d.valeurs.at(-2).v)} → ${afficherV(d.ind, d.valeurs.at(-1).v)})`;
    const cle = cleIndic(d.ind);
    if (priorites.has(cle)) priorites.get(cle).baisse = baisse;
    else priorites.set(cle, { texte: `<b>${esc(d.ind.nom)}</b> — ${baisse}` });
  }
  const jamais = etapes.length ? ETAPES_SN.filter(e => e.code.startsWith('P') && !donnees.get(e.id)?.valeurs.length).map(e => e.code) : [];
  html += `<h3>À travailler en priorité</h3>${priorites.size
    ? `<ol class="liste-fiche priorites">${[...priorites.values()].map(p => `<li>${p.texte}${p.baisse ? ` <span class="tendance regres">↘ ${p.baisse}</span>` : ''}${
      p.critere ? `<br><span class="critere">${esc(p.critere)}</span>` : ''}</li>`).join('')}</ol>`
    : `<p class="aide">${!lignes.length ? 'Pas encore de données pour cet élève dans cette APSA.'
      : lignes.some(d => d.ind.type === 'echelle') ? 'Rien sous le degré 3 ni en baisse : consolider, et viser l’aisance (degré 4).'
        : 'Pas de baisse depuis la séance précédente. (Sans degré de maîtrise relevé dans cette APSA, la fiche ne propose pas d’autre priorité : appuie-toi sur l’évolution des performances.)'}</p>`}
    ${jamais.length ? `<p class="aide">Pas encore évaluées : ${jamais.join(', ')}.</p>` : ''}`;

  // Observations du prof (enregistrées dans le carnet)
  const suivi = Donnees.get('suivis', idSuivi(el.id, apsa));
  html += `<h3>Mes observations</h3>
    <textarea class="obs-fiche" data-obs rows="4" placeholder="Objectifs fixés avec l’élève, points d’appui, ce qui l’aide…">${esc(suivi?.texte || '')}</textarea>
    ${suivi?.texte ? `<p class="aide">Modifié le ${dateHeure(suivi.maj)}</p>` : ''}`;
  return html;
}

async function ficheEleve(eleveId) {
  const c = classeActive();
  const eleves = elevesDe(c.id);
  const toutes = seancesDe(c.id);
  const apsas = [...new Set(toutes.map(apsaDe))];
  if (!apsas.length) return;
  let idx = eleves.findIndex(x => x.id === eleveId);
  // APSA affichée : celle de l'exercice filtré, sinon celle de la séance la plus récente.
  const filtre = toutes.find(s => s.titre === ui.exercices?.[c.id]);
  let apsa = filtre ? apsaDe(filtre) : apsaDe(toutes.at(-1));

  const { d, resultat } = ouvrirModale('Fiche élève', '<div class="fiche-onglets" data-fiche-onglets></div><div class="fiche" data-fiche></div>',
    '<button type="button" data-fiche-nav="-1">◀ Précédent</button><button type="button" data-fiche-nav="1">Suivant ▶</button>'
    + '<span class="espace"></span><button type="button" data-fermer class="primaire">Fermer</button>', 'modale-large modale-fiche');

  // Observations : enregistrées pendant la frappe (avec un petit délai) et avant de changer d'élève ou d'APSA.
  let minuteur = null, enAttente = null;
  const enregistrerObs = () => {
    clearTimeout(minuteur);
    if (!enAttente) return;
    const { eleve, apsa: a, texte } = enAttente;
    enAttente = null;
    const id = idSuivi(eleve, a), avant = Donnees.get('suivis', id);
    if ((avant?.texte || '') === texte) return;
    Donnees.ecrire('suivis', { ...(avant || {}), id, eleveId: eleve, apsa: a, texte });
  };
  const dessiner = () => {
    const el = eleves[idx];
    $('h2', d).textContent = `${el.nom} ${el.prenom} — ${c.nom}`;
    $('[data-fiche-onglets]', d).innerHTML = apsas.map(a =>
      `<button type="button" class="${a === apsa ? 'actif' : ''}" data-fiche-apsa="${esc(a)}">${esc(a)}</button>`).join('');
    $('[data-fiche]', d).innerHTML = htmlFiche(el, apsa, toutes.filter(s => apsaDe(s) === apsa));
    d.querySelector('[data-fiche-nav="-1"]').disabled = idx === 0;
    d.querySelector('[data-fiche-nav="1"]').disabled = idx === eleves.length - 1;
  };
  d.addEventListener('click', e => {
    const onglet = e.target.closest('[data-fiche-apsa]'), nav = e.target.closest('[data-fiche-nav]');
    if (onglet) { enregistrerObs(); apsa = onglet.dataset.ficheApsa; dessiner(); }
    if (nav) { enregistrerObs(); idx = Math.max(0, Math.min(eleves.length - 1, idx + +nav.dataset.ficheNav)); dessiner(); }
  });
  d.addEventListener('input', e => {
    if (!e.target.matches('[data-obs]')) return;
    enAttente = { eleve: eleves[idx].id, apsa, texte: e.target.value.trim() };
    clearTimeout(minuteur);
    minuteur = setTimeout(enregistrerObs, 800);
  });
  dessiner();
  await resultat;
  enregistrerObs();
}

// Toucher le nom d'un élève dans la grille d'entraînement ouvre sa fiche.
document.addEventListener('click', e => {
  const th = e.target.closest('.grille-ent tbody tr:not(.ligne-repartition) .col-nom');
  if (!th || e.target.closest('[data-voir-besoin]')) return;
  const id = th.closest('tr').querySelector('[data-eleve]')?.dataset.eleve;
  if (id) lancer(() => ficheEleve(id));
});

/* ---------- Échange avec Excel : le carnet d'entraînement d'une classe en classeur .xlsx ----------
   Un onglet « Lisez-moi », puis un onglet par séance : élèves en lignes, une colonne par donnée relevée.
   Une ligne « Type » (visible) décrit chaque donnée ; la colonne A et une ligne masquées gardent les identifiants,
   pour qu'un fichier réimporté mette à jour ses séances au lieu de les doubler.
   À l'import, rien n'est effacé : une case vide dans le fichier laisse la valeur du carnet telle quelle.
   Les élèves sont reconnus par leur identifiant, sinon par nom + prénom (sans tenir compte des accents). */

const sansAccent = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[’`]/g, '\'').replace(/\s+/g, ' ').trim();
const LIB_TYPES = { temps: 'Temps', distance: 'Distance', nombre: 'Nombre', echelle: 'Échelle 1 à 4', choix: 'Choix', texte: 'Texte' };
const STATUTS_PAR_NOM = Object.fromEntries(Object.entries(STATUTS_ENT).map(([code, nom]) => [sansAccent(nom), code]));
const dateFr = d => (d ? d.split('-').reverse().join('/') : '');

function typeEnTexte(ind) {
  if (ind.type === 'choix') return `${ind.suivi ? 'Choix ordonné' : 'Choix'} : ${(ind.options || []).join(' / ')}`;
  return LIB_TYPES[ind.type] + (ind.unite ? ` (${ind.unite})` : '') + (ind.etape ? ' — ' + texteIndic(ind) : '');
}

function texteEnType(texte) {
  const t = String(texte || '');
  const i = t.indexOf(':');
  const genre = i < 0 ? t : t.slice(0, i), suite = i < 0 ? '' : t.slice(i + 1);
  const mot = sansAccent(genre), unite = genre.match(/\(([^)]*)\)/)?.[1]?.trim();
  if (mot.startsWith('choix')) {
    return { type: 'choix', options: suite.split('/').map(o => o.trim()).filter(Boolean), ...(mot.includes('ordonn') ? { suivi: true } : {}) };
  }
  if (mot.startsWith('echelle')) return { type: 'echelle' };
  if (mot.startsWith('temps') || mot.startsWith('duree')) return { type: 'temps' };
  for (const type of ['distance', 'nombre']) if (mot.startsWith(type)) return { type, ...(unite ? { unite } : {}) };
  return { type: 'texte' };
}

// Valeur du carnet → case Excel (les nombres restent des nombres, les temps s'écrivent 3:45).
function valeurExcel(ind, v) {
  if (!v) return { v: '', style: 'texte' };
  if (ind.type === 'temps') return { v: formatTemps(v), style: 'texte' };
  if (ind.type === 'distance' || ind.type === 'nombre' || ind.type === 'echelle') return { v: +v, style: 'texte' };
  return { v, style: 'texte' };
}

// Case Excel → valeur du carnet : { v } ou { erreur }. Case vide → null (on ne touche à rien).
function valeurDepuisExcel(ind, brut) {
  if (!brut) return null;
  if (ind.type === 'temps' && /^\d*\.\d+(e-\d+)?$/i.test(brut) && +brut > 0 && +brut < 1) {
    // Excel a pris « 3:45 » pour une heure (3 h 45) : en EPS, c'est 3 min 45 s.
    return { v: String(Math.round(+brut * 1440 * 100) / 100) };
  }
  if (ind.type === 'echelle') {
    const n = +brut.replace(',', '.');
    return Number.isInteger(n) && n >= 1 && n <= 4 ? { v: String(n) } : { erreur: true };
  }
  if (ind.type === 'choix' || ind.type === 'texte') return { v: brut };
  const v = convertir(ind, brut);
  return v === null ? { erreur: true } : { v };
}

function lireDateExcel(brut) {
  const t = String(brut || '').trim();
  let m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (m) return `${m[3].length === 2 ? '20' + m[3] : m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[0];
  if (/^\d{5}(\.\d+)?$/.test(t)) return new Date(Date.UTC(1899, 11, 30) + Math.floor(+t) * 86400000).toISOString().slice(0, 10);
  return '';
}

function exporterExcel(c) {
  const eleves = elevesDe(c.id), seances = seancesDe(c.id);
  if (!seances.length) return toast('Aucune séance à exporter pour cette classe.', 'erreur');
  const T = v => ({ v, style: 'texte' }), E = v => ({ v, style: 'entete' }), A = v => ({ v, style: 'aide' });
  const lisezMoi = {
    nom: 'Lisez-moi', largeurs: [100],
    lignes: [
      [{ v: `Carnet EPS — entraînement de la classe ${c.nom}`, style: 'titre' }],
      [A(`Exporté le ${dateHeure(Date.now())} · ${seances.length} séance${seances.length > 1 ? 's' : ''} · ${eleves.length} élèves`)],
      [],
      [E('Comment s’en servir')],
      ['Un onglet par séance : une ligne par élève, une colonne par donnée relevée. La ligne « Type » dit ce qu’on attend dans la colonne.'],
      ['Temps : 3:45 ou 12,5 · Échelle : 1, 2, 3 ou 4 · Choix : une des réponses listées · Statut : ABS, DISP, Blessé, Malade ou Autre.'],
      ['Tu peux compléter ou corriger les cases, ajouter des élèves (nom et prénom) ou un onglet de séance construit sur le même modèle.'],
      ['Ne supprime pas la colonne A ni les lignes masquées : elles permettent à l’appli de reconnaître les séances et les élèves.'],
      ['Pour le reprendre : Carnet EPS › onglet Entraînement › bouton « Excel » › Importer. Une case vide ne supprime rien dans le carnet.'],
      [],
      [{ v: '⚠ Ce fichier n’est pas chiffré (contrairement au carnet sur la clé) : ne le laisse pas traîner, supprime-le après usage.', style: 'entete' }],
      [],
      [E('Séances')],
      ...seances.map(s => [`${dateFr(s.date)} — ${s.titre}${s.apsa && s.apsa !== s.titre ? ' (' + s.apsa + ')' : ''}`]),
    ],
  };
  const feuilles = seances.map(s => {
    const inds = s.indicateurs;
    return {
      nom: `${dateFr(s.date).slice(0, 5).replace('/', '-')} ${s.titre}`,
      largeurs: [10, 18, 16, 11, ...inds.map(ind => (ind.type === 'texte' ? 30 : 14))],
      colonnesMasquees: [0], lignesMasquees: [7], figer: [4, 7],
      lignes: [
        ['#seance', E('Séance'), { v: s.titre, style: 'titre' }],
        [s.id, E('Date'), T(dateFr(s.date))],
        ['', E('APSA'), T(s.apsa || '')],
        ['', E('Documents'), A(docsDe(s).map(d => d.nom).join(', ') || '—')],
        [],
        ['#eleve', E('Nom'), E('Prénom'), E('Statut'), ...inds.map(ind => E(ind.nom))],
        ['#type', A('Type'), A(''), A('ABS / DISP / Blessé / Malade / Autre'), ...inds.map(ind => A(typeEnTexte(ind)))],
        ['#donnee', '', '', '', ...inds.map(ind => ind.id)],
        ...eleves.map(el => {
          const st = statutEnt(s.id, el.id);
          return [el.id, T(el.nom), T(el.prenom || ''), T(st ? STATUTS_ENT[st] : ''), ...inds.map(ind => valeurExcel(ind, Donnees.note(s.id, el.id, ind.id)))];
        }),
      ],
    };
  });
  const blob = Tableur.ecrire([lisezMoi, ...feuilles]);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new File([blob], `Entraînement ${c.nom} ${aujourdhui()}.xlsx`, { type: blob.type }));
  a.download = `Entraînement ${c.nom} ${aujourdhui()}.xlsx`.replace(/[\\/:*?"<>|]/g, '-');
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 60000);
  toast(`Classeur exporté (${seances.length} séance${seances.length > 1 ? 's' : ''}). Il n’est pas chiffré : ne le laisse pas traîner.`, 'ok');
}

// Onglets du classeur → séances lues (les onglets sans ligne « Nom / Prénom » sont ignorés).
function lireSeancesExcel(feuilles) {
  const res = [];
  for (const f of feuilles) {
    const L = f.lignes;
    const h = L.findIndex(l => sansAccent(l[1]) === 'nom' && sansAccent(l[2]).startsWith('prenom'));
    if (h < 0) continue;
    const meta = {};
    let fichierId = '';
    for (const l of L.slice(0, h)) {
      const cle = sansAccent(l[1]);
      if (cle) meta[cle] = l[2] || '';
      if (l[0] && !l[0].startsWith('#')) fichierId ||= l[0];
    }
    const typeL = L.slice(h + 1).find(l => l[0] === '#type' || sansAccent(l[1]) === 'type');
    const idsL = L.slice(h + 1).find(l => l[0] === '#donnee');
    const colonnes = [];
    for (let k = 4; k < L[h].length; k++) {
      if (!L[h][k]) continue;
      colonnes.push({ k, nom: L[h][k], id: idsL?.[k] || '', ...texteEnType(typeL?.[k]) });
    }
    const lignes = L.slice(h + 1).filter(l => l && l !== typeL && l !== idsL && (l[1] || l[2]))
      .map(l => ({ id: l[0] && !l[0].startsWith('#') ? l[0] : '', nom: l[1] || '', prenom: l[2] || '', statut: l[3] || '',
        valeurs: colonnes.map(col => l[col.k] || '') }));
    res.push({
      onglet: f.nom, fichierId, titre: (meta['seance'] || f.nom).trim(),
      date: lireDateExcel(meta['date']) || aujourdhui(), apsa: (meta['apsa'] || '').trim(), colonnes, lignes,
    });
  }
  return res;
}

// Prépare l'import dans la classe c : séances à créer / mettre à jour, élèves reconnus ou inconnus.
function preparerImport(lues, c) {
  const eleves = elevesDe(c.id);
  const parId = new Map(eleves.map(el => [el.id, el]));
  const parNom = new Map(eleves.map(el => [sansAccent(el.nom) + '|' + sansAccent(el.prenom), el]));
  const inconnus = new Map(), reconnus = new Set();
  const existantes = seancesDe(c.id);
  const seances = lues.map(x => {
    const parFichier = x.fichierId && Donnees.get('seances', x.fichierId);
    const cible = parFichier?.classeId === c.id ? parFichier
      : existantes.find(s => sansAccent(s.titre) === sansAccent(x.titre) && s.date === x.date) || null;
    // Séance d'un autre carnet : on garde son identifiant (un 2e import la met à jour au lieu de la doubler).
    const id = cible?.id || (x.fichierId && !Donnees.get('seances', x.fichierId) ? x.fichierId : Donnees.nouvelId());
    for (const l of x.lignes) {
      const cle = sansAccent(l.nom) + '|' + sansAccent(l.prenom);
      l.eleve = (l.id && parId.get(l.id)) || parNom.get(cle) || null;
      if (l.eleve) reconnus.add(l.eleve.id); else inconnus.set(cle, { nom: l.nom, prenom: l.prenom });
      l.cle = cle;
    }
    return { ...x, id, cible };
  });
  return { seances, reconnus, inconnus };
}

// Données de la séance après import : celles du fichier (dans son ordre), puis celles du carnet absentes du fichier.
function fusionnerIndicateurs(x, cible) {
  const avant = cible?.indicateurs || [];
  const sn = estSavoirNager(x.apsa || cible?.apsa);
  const pris = new Set();
  const inds = x.colonnes.map(col => {
    const etape = sn && col.type === 'echelle' ? ETAPES_SN.find(e => e.id === col.id || e.code === col.nom.trim().toUpperCase()) : null;
    const neuf = etape ? indicEtape(etape)
      : { id: col.id, nom: col.nom.trim(), type: col.type, ...(col.unite ? { unite: col.unite } : {}),
        ...(col.type === 'choix' ? { options: col.options } : {}), ...(col.suivi ? { suivi: true } : {}) };
    const deja = avant.find(a => !pris.has(a.id) && (a.id === neuf.id || cleIndic(a) === cleIndic(neuf)));
    let ind = deja ? { ...deja } : neuf;
    if (deja && ind.type === 'choix') ind.options = [...new Set([...(deja.options || []), ...(neuf.options || [])])];
    if (!ind.id || pris.has(ind.id)) ind = { ...ind, id: 'i' + Donnees.nouvelId().slice(0, 8) };
    pris.add(ind.id);
    col.ind = ind;
    return ind;
  });
  return [...inds, ...avant.filter(a => !pris.has(a.id))];
}

function appliquerImport(plan, c, { structure, ajouterInconnus }) {
  const bilan = { creees: 0, majs: 0, valeurs: 0, erreurs: [], ajoutes: 0 };
  if (!structure && ajouterInconnus) {
    let ordre = prochainOrdre(c.id);
    for (const [cle, el] of plan.inconnus) {
      const nouveau = Donnees.ecrire('eleves', { id: Donnees.nouvelId(), classeId: c.id, remarque: '', nom: majuscules(el.nom), prenom: el.prenom.trim(), sexe: '', ordre: ordre++ });
      for (const x of plan.seances) for (const l of x.lignes) if (!l.eleve && l.cle === cle) l.eleve = nouveau;
      bilan.ajoutes++;
    }
  }
  for (const x of plan.seances) {
    const indicateurs = fusionnerIndicateurs(x, x.cible);
    const s = x.cible || {};
    Donnees.ecrire('seances', {
      ...s, id: x.id, classeId: c.id, cree: s.cree || Date.now(), titre: x.titre, apsa: x.apsa, ca: caBrut(x.apsa) || s.ca || '',
      date: x.date, indicateurs: indicateurs.length ? structuredClone(indicateurs) : [{ id: 'i1', nom: 'Observation', type: 'texte' }],
      documents: s.documents || [],
    });
    if (x.cible) bilan.majs++; else bilan.creees++;
    if (structure) continue;
    for (const l of x.lignes) {
      if (!l.eleve) continue;
      const brutStatut = l.statut.trim();
      if (brutStatut) {
        const code = CODES_ENT[brutStatut.toLocaleUpperCase('fr')] || STATUTS_PAR_NOM[sansAccent(brutStatut)];
        if (!code) bilan.erreurs.push(`${l.nom} ${l.prenom} (${x.titre}) : statut « ${brutStatut} »`);
        else if (code !== statutEnt(x.id, l.eleve.id)) { Donnees.ecrireNote(x.id, l.eleve.id, code); bilan.valeurs++; }
      }
      x.colonnes.forEach((col, k) => {
        const r = valeurDepuisExcel(col.ind, l.valeurs[k]);
        if (!r) return;
        if (r.erreur) return bilan.erreurs.push(`${l.nom} ${l.prenom} (${x.titre}, ${col.nom}) : « ${l.valeurs[k]} »`);
        if (col.ind.type === 'choix' && !(col.ind.options || []).includes(r.v)) col.ind.options = [...(col.ind.options || []), r.v];
        if (r.v !== Donnees.note(x.id, l.eleve.id, col.ind.id)) { Donnees.ecrireNote(x.id, l.eleve.id, r.v, col.ind.id); bilan.valeurs++; }
      });
    }
    // (Réponses nouvelles ajoutées aux listes de choix pendant la lecture des valeurs.)
    const s2 = Donnees.get('seances', x.id);
    if (indicateurs.length && JSON.stringify(s2.indicateurs) !== JSON.stringify(indicateurs)) Donnees.ecrire('seances', { ...s2, indicateurs: structuredClone(indicateurs) });
  }
  return bilan;
}

async function importerExcel(c, fichier) {
  let feuilles;
  try { feuilles = await Tableur.lire(fichier); } catch (e) {
    throw new Error(`« ${fichier.name} » n’a pas pu être lu : ${e.message || e}`);
  }
  const lues = lireSeancesExcel(feuilles);
  if (!lues.length) throw new Error(`Aucune séance trouvée dans « ${fichier.name} » (il faut un onglet avec des colonnes « Nom » et « Prénom »).`);
  const plan = preparerImport(lues, c);
  const nbMaj = plan.seances.filter(x => x.cible).length, nbNeuves = plan.seances.length - nbMaj;
  const totalEleves = plan.reconnus.size + plan.inconnus.size;
  const inconnus = [...plan.inconnus.values()];
  const { resultat } = ouvrirModale(`Importer dans ${c.nom}`, `
    <p><b>${esc(fichier.name)}</b></p>
    <ul class="bilan-import">
      <li>${plan.seances.length} séance${plan.seances.length > 1 ? 's' : ''} :
        ${nbNeuves ? `${nbNeuves} nouvelle${nbNeuves > 1 ? 's' : ''}` : ''}${nbNeuves && nbMaj ? ', ' : ''}${nbMaj ? `${nbMaj} déjà dans le carnet (mise${nbMaj > 1 ? 's' : ''} à jour)` : ''}</li>
      <li>${plan.reconnus.size} élève${plan.reconnus.size > 1 ? 's' : ''} reconnu${plan.reconnus.size > 1 ? 's' : ''} sur ${totalEleves}</li>
    </ul>
    <fieldset class="choix-import"><legend>Que reprendre ?</legend>
      <label class="case"><input type="radio" name="quoi" value="tout" checked><span>Les séances <b>et les résultats</b> des élèves</span></label>
      <label class="case"><input type="radio" name="quoi" value="structure"><span>Seulement <b>les séances</b> (titres, dates, données à relever) — pour reprendre la séquence d’un collègue avec tes élèves</span></label>
    </fieldset>
    ${inconnus.length ? `<div class="inconnus-import">
      <p>${inconnus.length} élève${inconnus.length > 1 ? 's' : ''} du fichier ne ${inconnus.length > 1 ? 'sont' : 'est'} pas dans ${esc(c.nom)} :
        <span class="aide">${inconnus.slice(0, 12).map(el => esc(`${el.nom} ${el.prenom}`.trim())).join(', ')}${inconnus.length > 12 ? '…' : ''}</span></p>
      <label class="case"><input type="checkbox" name="ajouter"> Les ajouter à la classe (sinon leurs lignes sont ignorées)</label>
    </div>` : ''}
    <p class="aide">Rien n’est effacé : une case vide dans le fichier laisse la valeur du carnet telle quelle.</p>`,
  boutonsModale('Importer'));
  const r = await resultat;
  if (r.action !== 'ok') return;
  const bilan = appliquerImport(plan, c, { structure: r.data.quoi === 'structure', ajouterInconnus: r.data.ajouter === 'on' });
  rendre();
  const morceaux = [
    bilan.creees && `${bilan.creees} séance${bilan.creees > 1 ? 's' : ''} ajoutée${bilan.creees > 1 ? 's' : ''}`,
    bilan.majs && `${bilan.majs} mise${bilan.majs > 1 ? 's' : ''} à jour`,
    r.data.quoi !== 'structure' && `${bilan.valeurs} case${bilan.valeurs > 1 ? 's' : ''} remplie${bilan.valeurs > 1 ? 's' : ''} ou corrigée${bilan.valeurs > 1 ? 's' : ''}`,
    bilan.ajoutes && `${bilan.ajoutes} élève${bilan.ajoutes > 1 ? 's' : ''} ajouté${bilan.ajoutes > 1 ? 's' : ''}`,
  ].filter(Boolean);
  if (!bilan.erreurs.length) return toast('Import terminé : ' + morceaux.join(', ') + '.', 'ok');
  ouvrirModale('Import terminé', `<p>${esc(morceaux.join(', '))}.</p>
    <p>${bilan.erreurs.length} case${bilan.erreurs.length > 1 ? 's' : ''} illisible${bilan.erreurs.length > 1 ? 's' : ''}, laissée${bilan.erreurs.length > 1 ? 's' : ''} de côté :</p>
    <ul class="erreurs-import">${bilan.erreurs.slice(0, 30).map(e => `<li>${esc(e)}</li>`).join('')}${bilan.erreurs.length > 30 ? '<li>…</li>' : ''}</ul>`,
  '<span class="espace"></span><button type="button" data-fermer class="primaire">OK</button>');
}

// Bouton « Excel » de l'onglet Entraînement.
async function echangeExcel() {
  const c = classeActive();
  let fichier = null;
  const { d, resultat } = ouvrirModale(`Excel — entraînement ${c.nom}`, `
    <div class="bloc-excel">
      <h3>⬇ Exporter</h3>
      <p class="aide">Toutes les séances de la classe dans un classeur .xlsx (un onglet par séance) : à garder, à ouvrir dans Excel
        ou LibreOffice, à donner à un collègue. Les documents joints (📎) n’y sont pas.</p>
      <p class="aide">⚠ Le classeur n’est pas chiffré, contrairement au carnet sur la clé : ne le laisse pas traîner.</p>
      <button value="exporter" class="primaire">Exporter ${esc(c.nom)}</button>
    </div>
    <div class="bloc-excel">
      <h3>⬆ Importer</h3>
      <p class="aide">Un classeur exporté par Carnet EPS (le tien, éventuellement complété dans Excel, ou celui d’un collègue).
        Tu verras ce qui sera repris avant de valider.</p>
      <label class="bouton primaire">Choisir un fichier .xlsx…<input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" data-fichier-excel hidden></label>
    </div>`,
  '<span class="espace"></span><button type="button" data-fermer>Fermer</button>');
  d.querySelector('[data-fichier-excel]').addEventListener('change', e => {
    fichier = e.target.files[0] || null;
    if (fichier) d.fermer();
  });
  const r = await resultat;
  if (r.action === 'exporter') return exporterExcel(c);
  if (fichier) return importerExcel(c, fichier);
}

/* ---------- Conversion des séances de la v0.13.0 (une seule mesure par séance) ---------- */

function migrerSeances() {
  for (const s of Donnees.liste('seances', x => !Array.isArray(x.indicateurs))) {
    const type = s.mesure || 'temps';
    const ind = {
      id: 'i1', type,
      nom: { temps: 'Temps', distance: 'Distance', nombre: 'Nombre', texte: 'Observation' }[type] || 'Performance',
      ...(s.unite ? { unite: s.unite } : {}),
    };
    for (const el of Donnees.liste('eleves', e => e.classeId === s.classeId)) {
      const v = Donnees.note(s.id, el.id);
      if (v && !STATUTS_ENT[v]) { Donnees.ecrireNote(s.id, el.id, v, 'i1'); Donnees.ecrireNote(s.id, el.id, ''); }
    }
    const { mesure, unite, ...reste } = s;
    Donnees.ecrire('seances', { ...reste, apsa: s.apsa || '', ca: s.ca || caBrut(s.titre), indicateurs: [ind] });
  }
}

/* ---------- Évènements propres à la grille d'entraînement ---------- */

document.addEventListener('click', e => {
  const b = e.target.closest('[data-niveau-ent]');
  if (b) changerEchelleEnt(b);
});

document.addEventListener('change', e => {
  const t = e.target;
  if (!t.classList?.contains('cellule-choix')) return;
  Donnees.ecrireNote(t.dataset.seance, t.dataset.eleve, t.value, t.dataset.indic);
  majStatsEnt();
});

document.addEventListener('keydown', e => {
  const t = e.target;
  if (t.matches?.('[data-niveau-ent]')) {
    const fleches = { ArrowDown: [1, 0], ArrowUp: [-1, 0], ArrowRight: [0, 1], ArrowLeft: [0, -1] };
    const code = CODES_ENT[e.key.toUpperCase()];
    if (/^[1-4]$/.test(e.key)) { changerEchelleEnt(t, e.key); deplacer(t, 1, 0); }
    else if (['0', 'Delete', 'Backspace'].includes(e.key)) { changerEchelleEnt(t, ''); deplacer(t, 1, 0); }
    else if (code) { appliquerStatutEnt(t, code); deplacer(t, 1, 0); }
    else if (fleches[e.key]) deplacer(t, ...fleches[e.key]);
    else return;
    e.preventDefault();
  } else if (t.matches?.('.cellule-choix') && e.key === 'Enter') {
    e.preventDefault();
    deplacer(t, 1, 0);
  }
});

// La barre de codes rapides apparaît aussi sur les échelles et les listes de choix.
document.addEventListener('focusin', e => {
  if (!e.target.matches?.('.grille-ent [data-niveau-ent], .grille-ent .cellule-choix')) return;
  $('#saisie').hidden = false;
  placerBarreSaisie();
});
