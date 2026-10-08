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

const ETAPES_SN = [
  ['P1', 'Entrer dans l’eau en chute arrière'],
  ['P2', 'Se déplacer sur 3,5 m en direction d’un obstacle'],
  ['P3', 'Franchir l’obstacle en immersion complète sur 1,5 m'],
  ['P4', 'Se déplacer sur le ventre sur 15 m'],
  ['P5', 'Au signal sonore, surplace vertical pendant 15 s'],
  ['P6', 'Reprendre le déplacement pour terminer les 15 m'],
  ['P7', 'Demi-tour sans reprise d’appuis, passer du ventre au dos'],
  ['P8', 'Se déplacer sur le dos sur 15 m'],
  ['P9', 'Au signal sonore, surplace dorsal horizontal (étoile) pendant 15 s'],
  ['P10', 'Reprendre le déplacement pour terminer les 15 m'],
  ['P11', 'Se retourner sur le ventre et franchir à nouveau l’obstacle en immersion'],
  ['P12', 'Se déplacer sur le ventre pour revenir au point de départ'],
  ['C1', 'Identifier la personne responsable de la surveillance'],
  ['C2', 'Connaître les règles d’hygiène et de sécurité du lieu de baignade'],
  ['C3', 'Identifier les environnements et circonstances où le savoir-nager est utile'],
].map(([code, texte]) => ({ id: 'sn-' + code, code, texte }));

const estSavoirNager = apsa => (apsa || '').trim().toLocaleLowerCase('fr').replace(/[\s-]+/g, ' ') === 'savoir nager';
const indicEtape = e => ({ id: e.id, nom: e.code, type: 'echelle', etape: true, texte: e.texte });
const titreIndic = ind => (ind.texte ? `${ind.nom} : ${ind.texte}` : nomCourtIndic(ind) + ' — ' + TYPES_INDIC[ind.type]);

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
      let texte = '–';
      if (valeurs.length && (TYPES_NUMERIQUES.includes(ind.type) || ind.type === 'echelle')) {
        const moy = valeurs.map(Number).reduce((a, b) => a + b, 0) / valeurs.length;
        texte = ind.type === 'temps' ? formatTemps(moy) : fmt(Math.round(moy * 10) / 10) + (ind.type === 'echelle' ? ' /4' : ind.unite ? ' ' + ind.unite : '');
      } else if (valeurs.length && ind.type === 'choix') {
        const compte = {};
        valeurs.forEach(v => { compte[v] = (compte[v] || 0) + 1; });
        const [top, n] = Object.entries(compte).sort((a, b) => b[1] - a[1])[0];
        texte = `${top} ×${n}`;
      } else if (valeurs.length) {
        texte = `${valeurs.length} obs.`;
      }
      td.textContent = texte;
      td.title = `${ind.nom} : ${valeurs.length} élève${valeurs.length > 1 ? 's' : ''} renseigné${valeurs.length > 1 ? 's' : ''}\n${resumeStatuts}`;
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
    : modele ? { titre: modele.titre, apsa: modele.apsa, date: aujourdhui(), indicateurs: structuredClone(modele.indicateurs) }
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
      <p class="aide">Chaque étape cochée devient une colonne : degré de maîtrise de 1 à 4 pour chaque élève.</p>
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

  const r = await resultat;
  if (r.action === 'supprimer') {
    if (await confirmer(`Supprimer la séance « ${s.titre} » du ${dateCourte(s.date)} et toutes ses données ?`)) {
      supprimerNotes(n => n.evalId === id);
      Donnees.supprimer('seances', id);
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
    Donnees.ecrire('seances', {
      ...s, id: s.id || Donnees.nouvelId(), classeId: c.id, cree: s.cree || Date.now(),
      titre: r.data.titre.trim(), apsa: r.data.apsa.trim(), ca: caBrut(r.data.apsa), date: r.data.date, indicateurs,
    });
  }
  rendre();
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
