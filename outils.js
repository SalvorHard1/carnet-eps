'use strict';
// Onglet « Outils » : la page d'accueil présente tous les outils en cartes ; un toucher ouvre l'outil.
// Chronos, minuteur d'intervalles, rotation des ateliers, tours par élève, équipes, tirage au sort, marque, tournoi,
// essais (lancers / sauts), VMA. Rien n'est envoyé nulle part ; les bips sont fabriqués par l'appareil (Web Audio).
// L'état des outils est gardé sur cet appareil (localStorage) : un chrono continue de tourner si l'on change
// d'onglet ou si la page est rechargée. La VMA, elle, est rangée dans la fiche de l'élève (elle suit sur la clé).
// (Fichier chargé avant app.js : il n'utilise les outils d'app.js qu'au moment des appels.)

// Familles d'outils : une couleur et un titre chacune sur la page d'accueil (bulles).
const FAMILLES_OUTILS = [
  { id: 'temps', nom: 'Temps' }, { id: 'groupes', nom: 'Groupes' }, { id: 'matchs', nom: 'Matchs' }, { id: 'mesures', nom: 'Mesures' },
];
const OUTILS = [
  { id: 'chrono', famille: 'temps', icone: '⏱', nom: 'Chrono', info: 'Un ou plusieurs chronos, temps intermédiaires, départs groupés' },
  { id: 'tours', famille: 'temps', icone: '🏃', nom: 'Tours par élève', info: 'Un toucher sur l’élève à chaque passage', classe: true },
  { id: 'intervalles', famille: 'temps', icone: '⏲', nom: 'Intervalles', info: 'Effort / récupération : Tabata, circuit' },
  { id: 'ateliers', famille: 'temps', icone: '🔄', nom: 'Ateliers', info: 'Les groupes tournent au signal' },
  { id: 'equipes', famille: 'groupes', icone: '👥', nom: 'Équipes', info: 'Mixtes, équilibrées, sans les absents', classe: true },
  { id: 'tirage', famille: 'groupes', icone: '🎲', nom: 'Tirage au sort', info: 'Un élève au hasard, ou les rôles', classe: true },
  { id: 'marque', famille: 'matchs', icone: '🏸', nom: 'Marque', info: 'Score, sets et temps de jeu en grand' },
  { id: 'tournoi', famille: 'matchs', icone: '🏆', nom: 'Tournoi', info: 'Poule ou montante-descendante' },
  { id: 'essais', famille: 'mesures', icone: '📏', nom: 'Essais', info: 'Lancers, sauts : meilleure performance', classe: true },
  { id: 'vma', famille: 'mesures', icone: '💨', nom: 'VMA', info: 'VMA et temps de passage à viser', classe: true },
];
const COULEURS_EQUIPES = ['Rouge', 'Bleu', 'Vert', 'Jaune', 'Orange', 'Violet', 'Blanc', 'Noir', 'Rose', 'Gris'];
const PRESETS_INTERVALLES = [['Tabata', 20, 10, 8], ['30 / 30', 30, 30, 10], ['40 / 20', 40, 20, 6], ['Circuit 45 / 15', 45, 15, 8]];

const etatOutilsDefaut = () => ({
  chronos: [{ id: 1, nom: 'Chrono 1', debut: null, cumul: 0, tours: [] }],
  absents: {}, // classeId → { date, ids } : élèves non présents aujourd'hui (pour les outils)
  tours: {}, // classeId → { mode, distance, duree, prevus, debut, fin, passages: { eleveId: [ms] }, pile: [eleveId] }
  intervalles: { travail: 30, repos: 15, series: 8, prepa: 10, debut: null, cumul: 0 },
  ateliers: { noms: 'Atelier 1\nAtelier 2\nAtelier 3\nAtelier 4', duree: 8, equipes: false, debut: null, cumul: 0 },
  equipes: {}, // classeId → { mode, valeur, mixite, niveau, separer: [[a, b]], liste: [{ couleur, membres }] }
  tirage: {}, // classeId → { sansRemise, deja, dernier, roles, attribution: [[role, eleveId]] }
  marque: { a: 'Équipe A', b: 'Équipe B', pa: 0, pb: 0, sets: [], duree: 0, debut: null, cumul: 0, pile: [] },
  tournoi: { format: 'poule', terrains: 2, texte: '', participants: [], matchs: [], montante: null },
  essais: {}, // classeId → { nb, unite, sens, tri, valeurs: { eleveId: [texte] } }
  vma: { pct: 90, distance: 200 },
  combine: {}, // classeId → combiné athlétique (combine.js)
  natation: {}, // classeId → natation : réglages, course en cours, essais (natation.js)
  boxe: {}, // classeId → boxe française : règles, assaut en cours, assauts enregistrés (boxe.js)
  ece: {}, // classeId → ECE de SVT : chrono, candidats, aides, critères (ece.js)
  asns: {}, // classeId → ASNS : étape, barèmes, résultats et médailles (asns.js)
  tableau: {}, // classeId → tableau blanc : fond, traits, têtes et pions (tableau.js)
});

const etatOutils = (() => {
  try { return { ...etatOutilsDefaut(), ...JSON.parse(localStorage.getItem('carnet-eps-outils')) }; } catch { return etatOutilsDefaut(); }
})();

/* ---------- 🎓 Mode élève ----------
   La tablette prêtée aux élèves n'affiche plus que les outils cochés par le professeur, pour une seule classe ;
   les élèves y apparaissent en « G. Léonie ». Pas d'onglets, pas de classes, pas de clé, pas de réglages, pas d'envoi
   vers une leçon. On en sort avec le code du professeur (gardé en empreinte, pas en clair) ; le mode tient
   au rechargement de la page. Garde-fou d'interface, pas un chiffrement : à compléter par l'épinglage d'écran
   (Android) ou l'Accès guidé (iPad) pour que l'élève ne quitte pas l'appli. */
const CLE_MODE_ELEVE = 'carnet-eps-mode-eleve';
// { classeId, outils: [id], code: { sel, empreinte }, essais, bloqueJusqua }
let modeEleve = (() => { try { return JSON.parse(localStorage.getItem(CLE_MODE_ELEVE)) || null; } catch { return null; } })();
const enModeEleve = () => !!modeEleve;
function sauverModeEleve() {
  try { if (modeEleve) localStorage.setItem(CLE_MODE_ELEVE, JSON.stringify(modeEleve)); else localStorage.removeItem(CLE_MODE_ELEVE); } catch { /* sans importance */ }
}

// Nom d'un élève dans les outils ; en mode élève : initiale du nom puis prénom (« G. Léonie »).
// Deux élèves de même prénom et même initiale : on prend assez de lettres du nom pour les distinguer (« Ma. Hugo », « Mo. Hugo »).
function nomCourtEleve(el) {
  const nom = (el.nom || '').trim(), prenom = (el.prenom || '').trim();
  const memes = elevesDe(el.classeId).filter(x => x.id !== el.id && sansAccent(x.prenom) === sansAccent(prenom));
  let n = 1;
  while (n < nom.length && memes.some(x => sansAccent((x.nom || '').trim().slice(0, n)) === sansAccent(nom.slice(0, n)))) n++;
  const debut = nom.slice(0, n);
  return `${debut ? debut.charAt(0).toLocaleUpperCase('fr') + debut.slice(1).toLocaleLowerCase('fr') + '. ' : ''}${prenom}`;
}
const nomEleveOutil = el => (!el ? '?' : enModeEleve() ? nomCourtEleve(el) || '?' : `${el.prenom || ''} ${el.nom || ''}`.trim());

let minuteurSauverOutils = null;
function sauverOutils() {
  clearTimeout(minuteurSauverOutils);
  minuteurSauverOutils = setTimeout(() => { try { localStorage.setItem('carnet-eps-outils', JSON.stringify(etatOutils)); } catch { /* sans importance */ } }, 300);
}

/* ---------- Petits outils ---------- */

const melange = t => {
  t = [...t];
  for (let i = t.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [t[i], t[j]] = [t[j], t[i]]; }
  return t;
};
const nomOutil = id => nomEleveOutil(Donnees.get('eleves', id));
const ecoule = o => (o.cumul || 0) + (o.debut ? Date.now() - o.debut : 0);
const nombreOutil = v => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : null; };

// 83 456 ms → « 1:23,4 » (avec dixièmes) ou « 1:23 »
function fmtTemps(ms, dixiemes = true) {
  ms = Math.max(0, ms);
  const tot = Math.floor(ms / 1000), h = Math.floor(tot / 3600), m = Math.floor(tot / 60) % 60, s = tot % 60;
  const base = (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0');
  return dixiemes ? base + ',' + Math.floor((ms % 1000) / 100) : base;
}
const fmtRebours = ms => fmtTemps(Math.ceil(Math.max(0, ms) / 1000) * 1000, false);

/* ---------- Sons (fabriqués par l'appareil, sans fichier) ---------- */

let audio = null;
function son(freq = 880, duree = 0.15, fois = 1) {
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    for (let i = 0; i < fois; i++) {
      const t = audio.currentTime + i * (duree + 0.1);
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = 'square';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.4, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + duree);
      o.connect(g).connect(audio.destination);
      o.start(t);
      o.stop(t + duree + 0.02);
    }
  } catch { /* pas de son sur cet appareil */ }
}
const bipCourt = () => son(880, 0.12);
const bipChangement = () => son(660, 0.5);
const bipFin = () => son(990, 0.25, 3);
const bipToucher = () => son(1400, 0.04);

/* ---------- Écran allumé tant qu'un minuteur tourne (tablette) ---------- */

let verrouEcran = null;
async function majVeille() {
  const actif = minuteursActifs() && !document.hidden;
  if (actif && !verrouEcran && navigator.wakeLock) {
    try {
      verrouEcran = await navigator.wakeLock.request('screen');
      verrouEcran.addEventListener('release', () => { verrouEcran = null; });
    } catch { /* refusé : l'écran pourra se mettre en veille */ }
  } else if (!actif && verrouEcran) {
    verrouEcran.release().catch(() => {});
    verrouEcran = null;
  }
}
document.addEventListener('visibilitychange', () => { if (typeof Donnees === 'object') majVeille(); });

/* ---------- Horloge commune : affichages en direct et signaux sonores ---------- */

function minuteursActifs() {
  const e = etatOutils;
  return e.chronos.some(ch => ch.debut) || Object.values(e.tours).some(t => t.debut && !t.fin)
    || !!e.intervalles.debut || !!e.ateliers.debut || !!e.marque.debut
    || Object.values(e.combine || {}).some(x => x.vagues?.course?.depart && !x.vagues.course.fin)
    || Object.values(e.natation || {}).some(x => x.course?.depart && !x.course.fin)
    || Object.values(e.boxe || {}).some(x => (x.assaut?.phase === 'combat' && x.assaut.debut) || x.assaut?.phase === 'repos')
    || Object.values(e.ece || {}).some(x => !!x.debut)
    || Object.values(e.asns || {}).some(x => Object.keys(x.enCours || {}).length)
    || (typeof vd === 'object' && !!(vd.flux || vd.pause)); // vidéo-delay : bandeau en direct (videodelay.js)
}

let tic = null;
function relancerTic() {
  if (minuteursActifs()) tic ??= setInterval(tique, 100);
  else if (tic) { clearInterval(tic); tic = null; }
  document.querySelector('#onglets [data-vue="outils"]')?.classList.toggle('minuteur-actif', minuteursActifs());
  majVeille();
}

// Les zones [data-o-bloc] sont redessinées à chaque top. Elles ne contiennent jamais de bouton :
// un bouton redessiné entre l'appui et le relâcher perdrait le clic.
function majBlocs() {
  document.querySelectorAll('#vue [data-o-bloc]').forEach(b => {
    const contenu = BLOCS_DIRECTS[b.dataset.oBloc]?.(b.dataset.arg);
    if (contenu === undefined || b.dernier === contenu) return;
    b.dernier = contenu;
    if (b.dataset.html) b.innerHTML = contenu; else b.textContent = contenu;
  });
}

function tique() {
  verifierEcheances();
  if (ui.vue === 'outils' && !document.hidden) { try { majBlocs(); } catch { /* carnet pas encore chargé */ } }
  if (!minuteursActifs()) relancerTic();
}

// Redessine l'outil en gardant le champ où se trouve l'utilisateur (ex. Tab vers le réglage suivant).
function rendreOutil() {
  sauverOutils();
  relancerTic();
  if (ui.vue !== 'outils') return;
  const a = document.activeElement;
  const cle = a?.closest?.('#vue') && ['oChamp', 'oEssai', 'oVma', 'oScore', 'ocPerf', 'ocEp', 'ocVague', 'ocChamp']
    .map(k => a.dataset[k] && `[data-${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}="${CSS.escape(a.dataset[k])}"]`).find(Boolean);
  rendreVue();
  if (cle) $('#vue ' + cle)?.focus();
}

/* ---------- Présents aujourd'hui (pour les outils qui travaillent sur la classe) ----------
   Au premier usage du jour : tous les élèves, sauf les dispensés du jour et ceux notés absents / dispensés / blessés /
   malades sur une leçon d'aujourd'hui. Un toucher sur un nom le coche absent ou présent. */

function absentsDuJour(c) {
  const auj = aujourdhui();
  let a = etatOutils.absents[c.id];
  if (!a || a.date !== auj) {
    const seances = seancesDe(c.id).filter(s => s.date === auj);
    const ids = elevesDe(c.id).filter(el => dispenseLe(el, auj)
      || seances.some(s => ['ABS', 'DISP', 'BLE', 'MAL'].includes(Donnees.note(s.id, el.id)))).map(el => el.id);
    a = etatOutils.absents[c.id] = { date: auj, ids };
  }
  return a.ids;
}
const presentsOutil = c => { const abs = absentsDuJour(c); return elevesDe(c.id).filter(el => !abs.includes(el.id)); };

let presentsOuverts = false;
function htmlPresents(c) {
  const tous = elevesDe(c.id), abs = absentsDuJour(c);
  return `<details class="presents" data-o-presents ${presentsOuverts ? 'open' : ''}>
    <summary>👤 Présents : <b>${tous.length - abs.length}</b> / ${tous.length} <span class="aide">— toucher pour cocher les absents</span></summary>
    <div class="chips-presents">${tous.map(el => `<button type="button" class="chip-present${abs.includes(el.id) ? ' absent' : ''}" data-o="presence" data-arg="${el.id}"
      aria-pressed="${!abs.includes(el.id)}">${esc(nomEleveOutil(el))}</button>`).join('')}</div></details>`;
}

/* ---------- Page d'accueil des outils : une carte par outil ---------- */

function outilEnCours(id) {
  const e = etatOutils;
  return {
    chrono: e.chronos.some(ch => ch.debut), tours: Object.values(e.tours).some(t => t.debut && !t.fin),
    intervalles: !!e.intervalles.debut, ateliers: !!e.ateliers.debut, marque: !!e.marque.debut || !!(e.marque.pa || e.marque.pb),
    tournoi: !!(e.tournoi.matchs.length || e.tournoi.montante),
    combine: Object.values(e.combine || {}).some(x => x.vagues?.course?.depart && !x.vagues.course.fin),
    natation: Object.values(e.natation || {}).some(x => x.course?.depart && !x.course.fin),
    boxe: Object.values(e.boxe || {}).some(x => x.assaut && x.assaut.phase !== 'fini'),
    ece: Object.values(e.ece || {}).some(x => !!x.debut),
    asns: Object.values(e.asns || {}).some(x => Object.keys(x.enCours || {}).length),
  }[id];
}

function htmlOutils(c) {
  // (Seulement les outils de la discipline du carnet : en EPS, tous.)
  const o = OUTILS.find(x => x.id === ui.outil && outilDeLaDiscipline(x));
  if (!o) {
    // Accueil : des bulles rangées par famille ; la grille s'adapte à la largeur de l'écran.
    // En mode élève : seulement les outils autorisés, et le bouton pour en sortir (avec le code).
    // (eleve: false : outil réservé au professeur, jamais proposé en mode élève — ex. vidéo.)
    const visibles = OUTILS.filter(x => outilDeLaDiscipline(x) && (!enModeEleve() || (x.eleve !== false && modeEleve.outils.includes(x.id))));
    return `
      ${enModeEleve() ? `<div class="outils bandeau-eleve"><h2>🎓 Mode élève</h2><span class="aide">${c ? 'Classe : <b>' + esc(c.nom) + '</b>' : 'Classe introuvable'}</span>
          <span class="espace-outil"></span><button data-o="eleve-quitter">🔒 Quitter le mode élève</button></div>`
    : `<div class="outils"><h2>Outils</h2><span class="aide">Pour la séance${c ? ' — classe : <b>' + esc(c.nom) + '</b>' : ''}</span>
          <span class="espace-outil"></span>${c && elevesDe(c.id).length ? `<button data-o="eleve-entrer" title="Prêter la tablette aux élèves : seulement les outils choisis, pour ${esc(c.nom)}">🎓 Mode élève</button>` : ''}</div>`}
      <div class="familles-outils">${FAMILLES_OUTILS.filter(f => visibles.some(x => x.famille === f.id)).map(f => `
        <section class="famille-outils famille-${f.id}">
          <h3>${f.nom}</h3>
          <div class="bulles-outils">${visibles.filter(x => x.famille === f.id).map(x => `
            <button class="bulle-outil" data-o="ouvrir" data-arg="${x.id}" title="${esc(x.info)}">
              <span class="bulle" aria-hidden="true">${x.icone}${outilEnCours(x.id) ? '<span class="bulle-actif" title="En cours"></span>' : ''}</span>
              <span class="bulle-nom">${x.nom}</span>
              <span class="bulle-info">${x.info}</span>
            </button>`).join('')}</div>
        </section>`).join('')}</div>`;
  }
  const sansClasse = o.classe && !c, sansEleves = o.classe && c && !elevesDe(c.id).length;
  return `
    <div class="outils outil-entete">
      <button class="retour-outils" data-o="accueil">← Outils</button>
      <h2>${o.icone} ${o.nom}</h2>
      ${o.classe && c ? `<span class="aide">${esc(c.nom)}</span>` : ''}
      <span class="espace-outil"></span>
      ${c && !sansEleves && TRANSFERTS[o.id] && !enModeEleve() ? `<button class="primaire" data-o="vers-lecon" title="Envoyer les résultats de cet outil dans une ${motMin('lecon')} de la classe">📤 Vers une ${motMin('lecon')}</button>` : ''}
      ${sansClasse || sansEleves || (enModeEleve() && o.id === 'vma') ? '' : '<button data-o="reinitialiser" title="Remettre cet outil à zéro">🗑 Tout effacer</button>'}
      <button data-o="plein-ecran" title="Plein écran (lisible de loin)">⛶ Plein écran</button>
    </div>
    <div class="outil-corps outil-${o.id}">
      ${sansClasse ? '<p class="aide">Crée d’abord une classe (☰ Classes) pour utiliser cet outil.</p>'
    : sansEleves ? '<p class="aide">Pas encore d’élèves dans cette classe.</p>' : RENDUS_OUTILS[o.id](c)}
    </div>`;
}

/* ---------- ⏱ Chronomètre ---------- */

function htmlChrono() {
  const chronos = etatOutils.chronos;
  return `
    <div class="chronos">${chronos.map(ch => `
      <div class="carte-chrono${ch.debut ? ' en-marche' : ''}">
        <input class="nom-chrono" data-o-nom-chrono="${ch.id}" value="${esc(ch.nom)}" aria-label="Nom du chrono" maxlength="30">
        <div class="grand-temps" data-o-bloc="chrono" data-arg="${ch.id}">${fmtTemps(ecoule(ch))}</div>
        <div class="boutons-outil">
          <button class="primaire gros" data-o="chrono-go" data-arg="${ch.id}">${ch.debut ? '⏸ Pause' : ecoule(ch) ? '▶ Reprendre' : '▶ Départ'}</button>
          <button class="gros" data-o="chrono-tour" data-arg="${ch.id}" ${ch.debut ? '' : 'disabled'}>⏱ Temps</button>
          <button data-o="chrono-zero" data-arg="${ch.id}" ${ch.debut || !ecoule(ch) ? 'disabled' : ''}>↺ Zéro</button>
          ${chronos.length > 1 ? `<button class="icone-petit" data-o="chrono-suppr" data-arg="${ch.id}" title="Retirer ce chrono" aria-label="Retirer ce chrono">🗑</button>` : ''}
        </div>
        ${ch.tours.length ? `<ol class="liste-temps" reversed>${ch.tours.map((t, i) => `<li><b>${fmtTemps(t)}</b>
          <span class="aide">${i ? '+' + fmtTemps(t - ch.tours[i - 1]) : ''}</span></li>`).reverse().join('')}</ol>` : ''}
      </div>`).join('')}
    </div>
    <div class="boutons-outil">
      <button data-o="chrono-ajout">+ Ajouter un chrono</button>
      ${chronos.length > 1 ? '<button data-o="chrono-tous">▶ Départ groupé (tous les chronos arrêtés)</button>' : ''}
    </div>`;
}

/* ---------- 🏃 Tours par élève ---------- */

const cfgTours = c => (etatOutils.tours[c.id] ??= { mode: 'chrono', distance: 200, duree: 12, prevus: 0, debut: null, fin: null, passages: {}, pile: [] });
const tempsTours = t => (t.debut ? (t.fin || Date.now()) - t.debut : 0);
const arrive = (t, id) => t.mode === 'chrono' && t.prevus > 0 && (t.passages[id] || []).length >= t.prevus;

function htmlTours(c) {
  const t = cfgTours(c), enCours = t.debut && !t.fin, verrou = t.debut ? 'disabled' : '';
  const els = presentsOutil(c);
  const resultats = elevesDe(c.id).filter(el => t.passages[el.id]?.length).map(el => {
    const p = t.passages[el.id];
    return { el, n: p.length, dernier: p.at(-1), splits: p.map((x, i) => x - (p[i - 1] || 0)) };
  }).sort((a, b) => b.n - a.n || a.dernier - b.dernier);
  return `
    <div class="ligne reglage-outil">
      <label>Mode<select data-o-champ="tours.mode" ${verrou}>
        <option value="chrono" ${t.mode === 'chrono' ? 'selected' : ''}>Temps de passage (course)</option>
        <option value="duree" ${t.mode === 'duree' ? 'selected' : ''}>Durée fixe (compte-tours)</option></select></label>
      <label>Distance d’un tour (m)<input type="number" min="0" step="any" data-o-champ="tours.distance" value="${t.distance}" ${verrou}></label>
      ${t.mode === 'chrono'
    ? `<label>Tours prévus <span class="aide">(0 = libre)</span><input type="number" min="0" step="1" data-o-champ="tours.prevus" value="${t.prevus}" ${verrou}></label>`
    : `<label>Durée (min)<input type="number" min="0.5" step="0.5" data-o-champ="tours.duree" value="${t.duree}" ${verrou}></label>`}
    </div>
    ${htmlPresents(c)}
    <div class="barre-outil">
      <span class="grand-temps moyen" data-o-bloc="tours" data-arg="${c.id}">${BLOCS_DIRECTS.tours(c.id)}</span>
      <button class="primaire gros" data-o="tours-go">${enCours ? '⏹ Arrêter' : t.debut ? '▶ Nouvelle course' : '▶ Départ'}</button>
      <button data-o="tours-annuler" ${t.pile.length && enCours ? '' : 'disabled'}>↶ Annuler le dernier passage</button>
      <button data-o="tours-zero" ${t.debut ? '' : 'disabled'}>↺ Effacer</button>
    </div>
    <p class="aide">${enCours ? 'Touche le nom d’un élève à chaque passage.' : t.debut ? 'Course terminée.' : 'Lance le départ, puis touche le nom d’un élève à chaque passage.'}</p>
    <div class="grille-coureurs">${els.map(el => {
    const p = t.passages[el.id] || [], fini = arrive(t, el.id);
    return `<button class="coureur${fini ? ' arrive' : ''}${p.length ? ' a-couru' : ''}" data-o="tours-passage" data-arg="${el.id}" ${enCours && !fini ? '' : 'disabled'}>
        <span class="coureur-nom">${esc(nomEleveOutil(el))}</span>
        <span class="coureur-info">${p.length} tour${p.length > 1 ? 's' : ''}${t.distance ? ' · ' + p.length * t.distance + ' m' : ''}${p.length ? ' · ' + fmtTemps(p.at(-1)) : ''}${fini ? ' 🏁' : ''}</span>
      </button>`;
  }).join('')}</div>
    ${resultats.length ? `
      <h3>Résultats</h3>
      <div class="carte"><table class="tableau-outil">
        <thead><tr><th>Élève</th><th>Tours</th>${t.distance ? '<th>Distance</th>' : ''}<th>${t.mode === 'duree' ? 'Dernier passage' : 'Temps'}</th><th>Temps des tours</th></tr></thead>
        <tbody>${resultats.map(r => `<tr><td>${esc(nomEleveOutil(r.el))}</td><td>${r.n}</td>${t.distance ? `<td>${r.n * t.distance} m</td>` : ''}
          <td><b>${fmtTemps(r.dernier)}</b></td><td class="aide">${r.splits.map(s => fmtTemps(s)).join(' · ')}</td></tr>`).join('')}</tbody>
      </table></div>
      ${t.mode === 'duree' ? '<p class="aide">Distance au dernier tour complet : ajoute à la main la portion du tour en cours à la fin.</p>' : ''}` : ''}`;
}

/* ---------- ⏲ Minuteur d'intervalles ---------- */

function phasesIntervalles(cfg) {
  const p = [];
  if (cfg.prepa > 0) p.push({ type: 'prepa', nom: 'Préparation', duree: cfg.prepa, serie: 0 });
  for (let i = 1; i <= cfg.series; i++) {
    p.push({ type: 'travail', nom: 'Effort', duree: cfg.travail, serie: i });
    if (i < cfg.series && cfg.repos > 0) p.push({ type: 'repos', nom: 'Récupération', duree: cfg.repos, serie: i });
  }
  return p;
}

function etatIntervalles() {
  const cfg = etatOutils.intervalles, ph = phasesIntervalles(cfg);
  let t = ecoule(cfg) / 1000;
  for (let i = 0; i < ph.length; i++) {
    if (t < ph[i].duree) return { i, phase: ph[i], reste: ph[i].duree - t };
    t -= ph[i].duree;
  }
  return { fini: true };
}

function htmlIntervalles() {
  const cfg = etatOutils.intervalles, verrou = cfg.debut || cfg.cumul ? 'disabled' : '';
  return `
    <div class="boutons-outil presets">${PRESETS_INTERVALLES.map(([nom, tr, re, se], k) =>
    `<button data-o="intervalles-preset" data-arg="${k}" ${verrou}>${nom} <span class="aide">${tr}″/${re}″ × ${se}</span></button>`).join('')}</div>
    <div class="ligne reglage-outil">
      <label>Effort (s)<input type="number" min="1" step="1" data-o-champ="intervalles.travail" value="${cfg.travail}" ${verrou}></label>
      <label>Récupération (s)<input type="number" min="0" step="1" data-o-champ="intervalles.repos" value="${cfg.repos}" ${verrou}></label>
      <label>Séries<input type="number" min="1" step="1" data-o-champ="intervalles.series" value="${cfg.series}" ${verrou}></label>
      <label>Préparation (s)<input type="number" min="0" step="1" data-o-champ="intervalles.prepa" value="${cfg.prepa}" ${verrou}></label>
    </div>
    <div class="ecran-intervalles" data-o-bloc="intervalles" data-html="1">${BLOCS_DIRECTS.intervalles()}</div>
    <div class="boutons-outil centre">
      <button class="primaire gros" data-o="intervalles-go">${cfg.debut ? '⏸ Pause' : cfg.cumul ? '▶ Reprendre' : '▶ Départ'}</button>
      <button class="gros" data-o="intervalles-zero" ${cfg.debut || cfg.cumul ? '' : 'disabled'}>↺ Recommencer</button>
    </div>
    <p class="aide">Un bip à chaque changement, et les 3 dernières secondes de chaque phase.</p>`;
}

/* ---------- 🔄 Rotation des ateliers ---------- */

const nomsAteliers = () => etatOutils.ateliers.noms.split('\n').map(s => s.trim()).filter(Boolean);
function groupesAteliers(c) {
  const cfg = etatOutils.ateliers, eq = c && etatOutils.equipes[c.id]?.liste;
  if (cfg.equipes && eq?.length) return eq.map(e => ({ nom: 'Équipe ' + COULEURS_EQUIPES[e.couleur], couleur: e.couleur, membres: e.membres }));
  return nomsAteliers().map((_, k) => ({ nom: 'Groupe ' + (k + 1) }));
}
function etatAteliers() {
  const cfg = etatOutils.ateliers, dureeMs = Math.max(0.5, cfg.duree) * 60000, t = ecoule(cfg);
  return { rotation: Math.floor(t / dureeMs), reste: dureeMs - (t % dureeMs), nb: nomsAteliers().length };
}

function htmlAteliers(c) {
  const cfg = etatOutils.ateliers, verrou = cfg.debut || cfg.cumul ? 'disabled' : '';
  const aEquipes = c && etatOutils.equipes[c.id]?.liste?.length;
  return `
    <div class="ligne reglage-outil">
      <label>Ateliers <span class="aide">(un par ligne)</span><textarea rows="4" data-o-champ="ateliers.noms" ${verrou}>${esc(cfg.noms)}</textarea></label>
      <div class="colonne">
        <label>Durée par atelier (min)<input type="number" min="0.5" step="0.5" data-o-champ="ateliers.duree" value="${cfg.duree}" ${verrou}></label>
        ${aEquipes ? `<label class="case"><input type="checkbox" data-o-champ="ateliers.equipes" ${cfg.equipes ? 'checked' : ''} ${verrou}>
          Groupes = équipes du générateur (${esc(c.nom)})</label>` : '<p class="aide">Astuce : fais d’abord les équipes (👥) pour les reprendre ici.</p>'}
      </div>
    </div>
    <div data-o-bloc="ateliers" data-html="1" data-arg="${c?.id || ''}">${BLOCS_DIRECTS.ateliers(c?.id || '')}</div>
    <div class="boutons-outil centre">
      <button class="primaire gros" data-o="ateliers-go" ${nomsAteliers().length ? '' : 'disabled'}>${cfg.debut ? '⏸ Pause' : cfg.cumul ? '▶ Reprendre' : '▶ Départ'}</button>
      <button data-o="ateliers-suivant" ${cfg.debut || cfg.cumul ? '' : 'disabled'}>⏭ Rotation suivante</button>
      <button data-o="ateliers-zero" ${cfg.debut || cfg.cumul ? '' : 'disabled'}>↺ Recommencer</button>
    </div>`;
}

/* ---------- 👥 Générateur d'équipes ---------- */

// Réglages : mixité (mixte / non-mixte / indifférent), composition (au hasard / hétérogène / homogène de niveau),
// critère de niveau lu directement dans le carnet (moyenne, note d'une évaluation, degrés de maîtrise).
function cfgEquipes(c) {
  const cfg = (etatOutils.equipes[c.id] ??= { mode: 'nombre', valeur: 4, separer: [], liste: [] });
  // Réglages de la v0.39 (mixite: oui / non, niveau: évaluation) → nouveaux réglages
  if (typeof cfg.mixite !== 'string') cfg.mixite = cfg.mixite === false ? 'indifferent' : 'mixte';
  if (cfg.niveau !== undefined) {
    if (cfg.niveau) { cfg.critere = cfg.niveau === 'moyenne' ? 'moyenne' : 'eval:' + cfg.niveau; cfg.composition = 'heterogene'; }
    delete cfg.niveau;
  }
  cfg.composition ||= 'aleatoire';
  cfg.critere ||= 'moyenne';
  return cfg;
}

// Critères de niveau proposés : tout ce que le carnet sait de la classe.
function criteresNiveau(c) {
  const evals = evalsDe(c.id), avecComp = evals.filter(e => competencesEval(e).length);
  return [
    { groupe: '', liste: [['moyenne', 'Moyenne des notes (toutes les évaluations)'], ...(avecComp.length ? [['degres', 'Moyenne des degrés de maîtrise (toutes les compétences)']] : [])] },
    { groupe: 'Note d’une évaluation', liste: evals.map(e => ['eval:' + e.id, `${e.titre} (${dateCourte(e.date)})`]) },
    { groupe: 'Degrés de maîtrise d’une évaluation', liste: avecComp.flatMap(e => [
      ['degres:' + e.id, `${e.titre} — toutes ses compétences`],
      ...competencesEval(e).map(a => [`comp:${e.id}|${a.id}`, `${e.titre} — ${a.code} ${resumeTexte(a.texte, 50)}`]),
    ]) },
    { groupe: `Résultat d’une ${motMin('lecon')}`, liste: criteresLecons(c) },
  ].filter(g => g.liste.length);
}

// Données des leçons qui permettent de classer les élèves (temps, distance, nombre, échelle, médaille, liste ordonnée),
// renseignées pour au moins un élève ; les plus récentes d'abord.
const indicClassable = ind => TYPES_NUMERIQUES.includes(ind.type) || ind.type === 'echelle' || (ind.type === 'choix' && ind.suivi);
function criteresLecons(c) {
  const els = elevesDe(c.id);
  return seancesDe(c.id).reverse().flatMap(s => (s.indicateurs || [])
    .filter(ind => indicClassable(ind) && els.some(el => valeurSuivie(ind, valeurCase(s.id, el.id, ind.id)) !== null))
    .map(ind => [`lecon:${s.id}|${ind.id}`, `${s.titre || s.apsa || mot('lecon')} (${dateCourte(s.date)}) — ${ind.nom}${ind.type === 'nombre' ? ' (plus = mieux)' : ''}`]));
}

// Niveau d'un élève selon le critère : { val (pour comparer), texte (pour afficher) }, ou null s'il n'a rien.
// Notes ramenées sur 20 ; degrés de maîtrise de 1 à 4.
function niveauOutil(c, critere) {
  const moyenneDe = l => (l.length ? l.reduce((a, b) => a + b, 0) / l.length : null);
  const degre = (e, id, att) => { const v = +Donnees.note(e.id, id, att); return v >= 1 && v <= 4 ? v : null; };
  const surVingt = v => (v === null ? null : { val: v, texte: fmt(Math.round(v * 10) / 10) });
  const enDegre = v => (v === null ? null : { val: v, texte: 'deg. ' + fmt(Math.round(v * 10) / 10) });
  const [type, arg] = critere.split(/:(.*)/s);
  if (type === 'moyenne') { const evals = evalsDe(c.id); return id => surVingt(moyenneEleve(id, evals)); }
  if (type === 'eval') {
    const e = Donnees.get('evals', arg);
    return id => { const n = e && nombre(Donnees.note(e.id, id)); return surVingt(n === null || n === undefined ? null : (n / e.max) * 20); };
  }
  if (type === 'degres') {
    const evals = arg ? [Donnees.get('evals', arg)].filter(Boolean) : evalsDe(c.id);
    return id => enDegre(moyenneDe(evals.flatMap(e => competencesEval(e).map(a => degre(e, id, a.id))).filter(x => x !== null)));
  }
  if (type === 'comp') {
    const [evalId, att] = arg.split(/\|(.*)/s), e = Donnees.get('evals', evalId);
    return id => enDegre(e ? degre(e, id, att) : null);
  }
  if (type === 'lecon') {
    // val : plus haut = plus fort (un temps compte en négatif) ; absents, dispensés… : sans valeur.
    const [seanceId, indId] = arg.split(/\|(.*)/s), s = Donnees.get('seances', seanceId);
    const ind = s?.indicateurs?.find(i => i.id === indId);
    if (!ind) return () => null;
    const signe = ind.type === 'temps' ? -1 : 1;
    const texte = v => (ind.type === 'choix' ? ind.options[Math.round(v)] || '' : ind.type === 'echelle' ? 'deg. ' + fmt(Math.round(v * 10) / 10)
      : afficherValeur(ind, String(Math.round(v * 10) / 10)));
    const f = id => {
      const v = statutEnt(s.id, id) ? null : valeurSuivie(ind, valeurCase(s.id, id, ind.id));
      return v === null ? null : { val: signe * v, texte: texte(v) };
    };
    f.moyenne = moy => texte(signe * moy); // niveau moyen d'une équipe, dans l'unité de la donnée
    return f;
  }
  return () => null;
}

// Répartit des élèves dans `nb` équipes (listes d'identifiants).
function repartir(els, nb, cfg, val) {
  const equipes = Array.from({ length: nb }, () => []);
  if (!nb || !els.length) return equipes;
  if (cfg.composition === 'homogene') {
    // Du plus fort au plus faible, découpé en équipes de même taille : les niveaux proches jouent ensemble.
    const ordre = [...els].sort((a, b) => val(b.id) - val(a.id));
    let i = 0;
    equipes.forEach((eq, k) => {
      const taille = Math.floor(els.length / nb) + (k < els.length % nb ? 1 : 0);
      eq.push(...ordre.slice(i, i + taille).map(el => el.id));
      i += taille;
    });
    if (cfg.mixite === 'mixte') ameliorerMixite(equipes, val);
    return equipes;
  }
  // Au hasard ou hétérogène : filles, puis garçons, puis les autres (si mixte), distribués par paliers.
  // Un palier = autant d'élèves que d'équipes (en hétérogène : du plus fort au plus faible) ; chaque équipe en reçoit
  // un, le meilleur du palier allant à l'équipe la plus faible. Un palier incomplet va aux équipes les moins nombreuses.
  // Résultat : équipes de même taille, filles et garçons répartis, niveaux moyens proches.
  const sexe = el => (['F', 'G'].includes(el.sexe) ? el.sexe : '');
  const paquets = cfg.mixite === 'mixte' ? ['F', 'G', ''].map(s => els.filter(el => sexe(el) === s)) : [els];
  const hetero = cfg.composition === 'heterogene';
  const somme = eq => eq.reduce((s, id) => s + val(id), 0);
  for (const p of paquets) {
    const ordre = hetero ? [...p].sort((a, b) => val(b.id) - val(a.id)) : p;
    for (let i = 0; i < ordre.length; i += nb) {
      const palier = ordre.slice(i, i + nb);
      const receveurs = equipes.map(eq => ({ eq, alea: Math.random() }))
        .sort((a, b) => a.eq.length - b.eq.length || (hetero ? somme(a.eq) - somme(b.eq) : 0) || a.alea - b.alea)
        .slice(0, palier.length)
        .sort((a, b) => (hetero ? somme(a.eq) - somme(b.eq) : 0) || a.alea - b.alea);
      palier.forEach((el, j) => receveurs[j].eq.push(el.id));
    }
  }
  return equipes;
}

// Homogène + mixte : échanges fille / garçon de niveau proche entre équipes voisines (le niveau reste prioritaire).
function ameliorerMixite(equipes, val) {
  const sexe = id => Donnees.get('eleves', id)?.sexe;
  const valeurs = equipes.flat().map(val), ecart = Math.max(...valeurs) - Math.min(...valeurs);
  const tolerance = Math.max(ecart * 0.15, 0.0001);
  for (let tour = 0; tour < 3; tour++) {
    for (let k = 0; k < equipes.length - 1; k++) {
      const A = equipes[k], B = equipes[k + 1];
      for (let essai = 0; essai < 10; essai++) {
        const fA = A.filter(id => sexe(id) === 'F').length, fB = B.filter(id => sexe(id) === 'F').length;
        if (Math.abs(fA - fB) <= 1) break;
        const [plus, moins] = fA > fB ? [A, B] : [B, A];
        let meilleur = null;
        for (const f of plus.filter(id => sexe(id) === 'F')) {
          for (const g of moins.filter(id => sexe(id) === 'G')) {
            const d = Math.abs(val(f) - val(g));
            if (d <= tolerance && (!meilleur || d < meilleur.d)) meilleur = { f, g, d };
          }
        }
        if (!meilleur) break;
        plus[plus.indexOf(meilleur.f)] = meilleur.g;
        moins[moins.indexOf(meilleur.g)] = meilleur.f;
      }
    }
  }
}

function faireEquipes(c) {
  const cfg = cfgEquipes(c), els = melange(presentsOutil(c));
  if (!els.length) throw new Error('Aucun élève présent.');
  const nb = Math.max(1, Math.min(els.length, cfg.mode === 'taille' ? Math.ceil(els.length / Math.max(1, cfg.valeur)) : cfg.valeur));
  const avecNiveau = cfg.composition !== 'aleatoire';
  const brut = avecNiveau ? niveauOutil(c, cfg.critere) : () => null;
  const connus = els.map(el => brut(el.id)?.val).filter(x => x !== undefined && x !== null);
  if (avecNiveau && !connus.length) throw new Error('Aucun élève présent n’a de résultat pour ce critère : choisis-en un autre.');
  const moyenne = connus.length ? connus.reduce((a, b) => a + b, 0) / connus.length : 0;
  const val = id => brut(id)?.val ?? moyenne; // (sans note ni degré : compté au niveau moyen)
  let listes;
  if (cfg.mixite === 'non-mixte') {
    // Équipes de filles et équipes de garçons, en proportion ; élèves sans sexe indiqué avec le groupe le plus petit.
    const F = els.filter(el => el.sexe === 'F'), G = els.filter(el => el.sexe === 'G'), autres = els.filter(el => !['F', 'G'].includes(el.sexe));
    (F.length <= G.length ? F : G).push(...autres);
    let nbF = F.length ? Math.round((nb * F.length) / els.length) : 0;
    if (F.length && G.length && nb >= 2) nbF = Math.min(nb - 1, Math.max(1, nbF));
    else if (!G.length) nbF = nb;
    listes = [...repartir(F, nbF, cfg, val), ...repartir(G, nb - nbF, cfg, val)];
    if (F.length && G.length && nb < 2) toast('Une seule équipe : impossible de séparer filles et garçons.', 'erreur');
  } else listes = repartir(els, nb, cfg, val);
  const equipes = listes.filter(l => l.length).map((membres, k) => ({ couleur: k % COULEURS_EQUIPES.length, membres }));
  // Élèves à séparer : échanges avec un élève (de préférence du même sexe) d'une autre équipe.
  const sexe = id => Donnees.get('eleves', id)?.sexe || '';
  const conflits = () => cfg.separer.filter(([a, b]) => equipes.some(eq => eq.membres.includes(a) && eq.membres.includes(b)));
  for (let essai = 0; essai < 300 && conflits().length; essai++) {
    const [a, b] = conflits()[0], bouge = Math.random() < 0.5 ? a : b;
    const eq = equipes.find(e => e.membres.includes(bouge));
    const candidats = melange(equipes.filter(e => e !== eq).flatMap(e => e.membres.map(id => ({ e, id }))))
      .sort((x, y) => (sexe(y.id) === sexe(bouge)) - (sexe(x.id) === sexe(bouge)));
    const choix = candidats[0];
    if (!choix) break;
    eq.membres[eq.membres.indexOf(bouge)] = choix.id;
    choix.e.membres[choix.e.membres.indexOf(choix.id)] = bouge;
  }
  if (cfg.liste.length) cfg.precedente = cfg.liste; // pour pouvoir revenir en arrière
  cfg.liste = equipes;
  cfg.selection = null;
  if (conflits().length) toast('Impossible de séparer tous les élèves demandés.', 'erreur');
}

function htmlEquipes(c) {
  const cfg = cfgEquipes(c), els = elevesDe(c.id), avecNiveau = cfg.composition !== 'aleatoire';
  const niveau = avecNiveau ? niveauOutil(c, cfg.critere) : () => null;
  const criteres = criteresNiveau(c);
  const options = els.map(el => `<option value="${el.id}">${esc(enModeEleve() ? nomEleveOutil(el) : `${el.nom} ${el.prenom}`)}</option>`).join('');
  // En mode élève, les niveaux (notes, degrés) ne s'affichent pas : les équipes se font quand même d'après eux.
  const montrerNiveau = avecNiveau && !enModeEleve();
  const choix = (champ, valeurs) => valeurs.map(([v, nom]) => `<option value="${v}" ${cfg[champ] === v ? 'selected' : ''}>${nom}</option>`).join('');
  return `
    ${htmlPresents(c)}
    <div class="ligne reglage-outil">
      <label>Faire<select data-o-champ="equipes.mode">${choix('mode', [['nombre', 'un nombre d’équipes'], ['taille', 'des équipes de … élèves']])}</select></label>
      <label>${cfg.mode === 'taille' ? 'Élèves par équipe' : 'Nombre d’équipes'}<input type="number" min="1" step="1" data-o-champ="equipes.valeur" value="${cfg.valeur}"></label>
      <label>Mixité<select data-o-champ="equipes.mixite">${choix('mixite', [['mixte', 'Mixtes (filles et garçons répartis)'], ['non-mixte', 'Non mixtes (filles / garçons)'], ['indifferent', 'Indifférent']])}</select></label>
      <label>Niveau<select data-o-champ="equipes.composition">${choix('composition', [['aleatoire', 'Au hasard'], ['heterogene', 'Hétérogènes (équipes équilibrées)'], ['homogene', 'Homogènes (niveaux proches ensemble)']])}</select></label>
      ${avecNiveau ? `<label class="large-outil">Niveau d’après<select data-o-champ="equipes.critere">${criteres.map(g => (g.groupe
    ? `<optgroup label="${esc(g.groupe)}">${g.liste.map(([v, nom]) => `<option value="${esc(v)}" ${cfg.critere === v ? 'selected' : ''}>${esc(nom)}</option>`).join('')}</optgroup>`
    : g.liste.map(([v, nom]) => `<option value="${esc(v)}" ${cfg.critere === v ? 'selected' : ''}>${esc(nom)}</option>`).join(''))).join('')}</select></label>` : ''}
    </div>
    ${avecNiveau ? `<p class="aide">Le niveau est lu dans ton carnet (notes, degrés de maîtrise ou résultats d’une ${motMin('lecon')}). Un élève sans résultat compte au niveau moyen.
      ${cfg.composition === 'homogene' && cfg.mixite === 'mixte' ? ' En homogène, le niveau passe avant la mixité.' : ''}</p>` : ''}
    <details class="separer"><summary>Élèves à séparer${cfg.separer.length ? ` (${cfg.separer.length})` : ''}</summary>
      <ul class="liste-separer">${cfg.separer.map(([a, b], k) => `<li>${esc(nomOutil(a))} ✕ ${esc(nomOutil(b))}
        <button class="icone-petit" data-o="separer-suppr" data-arg="${k}" aria-label="Retirer">🗑</button></li>`).join('')}</ul>
      <div class="ligne"><select data-o-separer="a" aria-label="Premier élève"><option value="">—</option>${options}</select>
        <select data-o-separer="b" aria-label="Second élève"><option value="">—</option>${options}</select>
        <button data-o="separer-ajout">+ Ajouter</button></div>
    </details>
    <div class="boutons-outil">
      <button class="primaire gros" data-o="equipes-faire">🎲 ${cfg.liste.length ? 'Refaire les équipes' : 'Faire les équipes'}</button>
      ${cfg.precedente?.length ? '<button data-o="equipes-precedentes">↶ Équipes précédentes</button>' : ''}
      ${cfg.liste.length ? '<button class="danger" data-o="equipes-effacer">🗑 Effacer les équipes</button>' : ''}
    </div>
    ${cfg.liste.length ? `
      <p class="aide">Touche un élève puis un élève d’une autre équipe pour les échanger.</p>
      <div class="grille-equipes">${cfg.liste.map((eq, k) => {
    const membres = eq.membres.filter(id => Donnees.get('eleves', id));
    const f = membres.filter(id => Donnees.get('eleves', id).sexe === 'F').length, g = membres.filter(id => Donnees.get('eleves', id).sexe === 'G').length;
    const niv = montrerNiveau ? membres.map(niveau).filter(Boolean) : [], moy = niv.length ? niv.reduce((s, x) => s + x.val, 0) / niv.length : null;
    const unite = niv[0]?.texte.startsWith('deg.') ? 'deg. ' : '';
    return `<div class="carte-equipe equipe-c${eq.couleur}">
          <h3>Équipe ${COULEURS_EQUIPES[eq.couleur]} <span class="aide">${membres.length} · ${f} F · ${g} G${moy !== null ? ` · niveau ${niveau.moyenne ? esc(niveau.moyenne(moy)) : unite + fmt(Math.round(moy * 10) / 10)}` : ''}</span></h3>
          ${membres.map(id => `<button class="membre${cfg.selection === id ? ' choisi' : ''}" data-o="equipes-choisir" data-arg="${k}|${id}">
            <span>${esc(nomOutil(id))}</span>${montrerNiveau ? `<span class="niveau-membre">${esc(niveau(id)?.texte || '?')}</span>` : ''}</button>`).join('')}
        </div>`;
  }).join('')}</div>` : ''}`;
}

/* ---------- 🎲 Tirage au sort ---------- */

const cfgTirage = c => (etatOutils.tirage[c.id] ??= { sansRemise: true, deja: [], dernier: null, roles: 'Arbitre\nChronométreur\nObservateur\nSecrétaire', attribution: [] });

function htmlTirage(c) {
  const cfg = cfgTirage(c), presents = presentsOutil(c), restants = presents.filter(el => !cfg.deja.includes(el.id));
  return `
    ${htmlPresents(c)}
    <div class="ecran-tirage"><div class="nom-tire" data-o-tire>${cfg.dernier ? esc(nomOutil(cfg.dernier)) : '?'}</div></div>
    <div class="boutons-outil centre">
      <button class="primaire gros" data-o="tirage-eleve">🎲 Tirer un élève</button>
      <label class="case"><input type="checkbox" data-o-champ="tirage.sansRemise" ${cfg.sansRemise ? 'checked' : ''}> Chacun son tour
        <span class="aide">(${restants.length} restant${restants.length > 1 ? 's' : ''} sur ${presents.length})</span></label>
      <button data-o="tirage-raz" ${cfg.deja.length ? '' : 'disabled'}>↺ Tout le monde à nouveau</button>
    </div>
    <h3>Rôles</h3>
    <div class="ligne reglage-outil">
      <label>Rôles à attribuer <span class="aide">(un par ligne)</span><textarea rows="4" data-o-champ="tirage.roles">${esc(cfg.roles)}</textarea></label>
    </div>
    <div class="boutons-outil"><button data-o="tirage-roles">🎲 Attribuer les rôles</button></div>
    ${cfg.attribution.length ? `<ul class="liste-roles">${cfg.attribution.map(([role, id]) => `<li><b>${esc(role)}</b> : ${esc(nomOutil(id))}</li>`).join('')}</ul>` : ''}`;
}

/* ---------- 🏸 Tableau de marque ---------- */

function htmlMarque() {
  const m = etatOutils.marque, setsA = m.sets.filter(s => s[0] > s[1]).length, setsB = m.sets.filter(s => s[1] > s[0]).length;
  const camp = (cote, nom, points, sets) => `
    <div class="camp camp-${cote}">
      <input class="nom-camp" data-o-champ="marque.${cote}" value="${esc(nom)}" aria-label="Nom de l’équipe" maxlength="30">
      <button class="score" data-o="marque-plus" data-arg="${cote}|1" aria-label="Un point pour ${esc(nom)}">${points}</button>
      <div class="boutons-outil centre">
        <button data-o="marque-plus" data-arg="${cote}|-1" ${points ? '' : 'disabled'}>−1</button>
        <button data-o="marque-plus" data-arg="${cote}|2">+2</button>
        <button data-o="marque-plus" data-arg="${cote}|3">+3</button>
      </div>
      <div class="sets-camp">Sets : <b>${sets}</b></div>
    </div>`;
  return `
    <div class="marque">
      ${camp('a', m.a, m.pa, setsA)}
      <div class="milieu-marque">
        <div class="temps-match" data-o-bloc="marque">${BLOCS_DIRECTS.marque()}</div>
        <button class="gros" data-o="marque-go">${m.debut ? '⏸' : '▶'}</button>
      </div>
      ${camp('b', m.b, m.pb, setsB)}
    </div>
    <div class="boutons-outil centre">
      <button data-o="marque-set" ${m.pa || m.pb ? '' : 'disabled'}>🏁 Fin du set</button>
      <button data-o="marque-annuler" ${m.pile.length ? '' : 'disabled'}>↶ Annuler</button>
      <button data-o="marque-inverser">⇄ Changer de côté</button>
      <button data-o="marque-zero">↺ Nouveau match</button>
      <label class="en-ligne">Temps de jeu (min)<input type="number" min="0" step="0.5" data-o-champ="marque.duree" value="${m.duree}" ${m.debut || m.cumul ? 'disabled' : ''}>
        <span class="aide">0 = chrono</span></label>
    </div>
    ${m.sets.length ? `<p class="centre">Sets joués : ${m.sets.map(([a, b]) => `<b>${a}–${b}</b>`).join(' · ')}</p>` : ''}`;
}

/* ---------- 🏆 Tournoi ---------- */

// Tous contre tous (méthode du cercle) : une liste de tours, chaque participant joue au plus une fois par tour.
function toursPoule(n) {
  const ids = [...Array(n).keys()];
  if (n % 2) ids.push(null);
  const m = ids.length, tours = [];
  for (let r = 0; r < m - 1; r++) {
    const t = [];
    for (let i = 0; i < m / 2; i++) { const a = ids[i], b = ids[m - 1 - i]; if (a !== null && b !== null) t.push([a, b]); }
    tours.push(t);
    ids.splice(1, 0, ids.pop());
  }
  return tours;
}

function lancerTournoi() {
  const t = etatOutils.tournoi;
  const noms = t.texte.split('\n').map(s => s.trim()).filter(Boolean);
  if (noms.length < 2) throw new Error('Il faut au moins 2 participants (un par ligne).');
  t.participants = noms;
  t.matchs = [];
  t.montante = null;
  const terrains = Math.max(1, t.terrains);
  if (t.format === 'poule') {
    let rotation = 0;
    for (const tour of toursPoule(noms.length)) {
      for (let i = 0; i < tour.length; i += terrains) {
        tour.slice(i, i + terrains).forEach(([a, b], k) => t.matchs.push({ rotation, terrain: k + 1, a, b, sa: '', sb: '' }));
        rotation++;
      }
    }
  } else {
    const ordre = melange(noms.map((_, k) => k)), nbTerrains = Math.min(terrains, Math.floor(noms.length / 2));
    t.montante = {
      tour: 1, terrains: Array.from({ length: nbTerrains }, (_, k) => [ordre[2 * k], ordre[2 * k + 1]]),
      gagnants: Array(nbTerrains).fill(null), banc: ordre.slice(2 * nbTerrains), victoires: {},
    };
  }
}

// Montante-descendante : le gagnant monte d'un terrain, le perdant descend (le terrain 1 est en haut).
function tourSuivantMontante() {
  const m = etatOutils.tournoi.montante, T = m.terrains.length;
  const gagne = m.terrains.map((p, k) => p[m.gagnants[k]]), perd = m.terrains.map((p, k) => p[1 - m.gagnants[k]]);
  gagne.forEach(x => { m.victoires[x] = (m.victoires[x] || 0) + 1; });
  const nouveaux = m.terrains.map((_, k) => [k === 0 ? gagne[0] : perd[k - 1], k === T - 1 ? perd[T - 1] : gagne[k + 1]]);
  if (m.banc.length) { m.banc.push(nouveaux[T - 1][1]); nouveaux[T - 1][1] = m.banc.shift(); } // le perdant du bas laisse sa place
  m.terrains = nouveaux;
  m.gagnants = Array(T).fill(null);
  m.tour++;
}

function classementPoule() {
  const t = etatOutils.tournoi;
  const l = t.participants.map((nom, k) => ({ k, nom, j: 0, v: 0, n: 0, d: 0, pour: 0, contre: 0, pts: 0 }));
  for (const m of t.matchs) {
    const a = nombreOutil(m.sa), b = nombreOutil(m.sb);
    if (a === null || b === null) continue;
    const A = l[m.a], B = l[m.b];
    A.j++; B.j++; A.pour += a; A.contre += b; B.pour += b; B.contre += a;
    if (a > b) { A.v++; B.d++; } else if (b > a) { B.v++; A.d++; } else { A.n++; B.n++; }
  }
  for (const x of l) x.pts = 3 * x.v + 2 * x.n + x.d; // victoire 3, nul 2, défaite 1
  return l.sort((x, y) => y.pts - x.pts || (y.pour - y.contre) - (x.pour - x.contre) || y.pour - x.pour);
}

// Participant du tournoi tel qu'affiché : en mode élève, un élève écrit en entier devient « G. Léonie ».
function nomParticipant(n) {
  const c = enModeEleve() && classeActive();
  if (!c) return n;
  const el = elevesDe(c.id).find(e => [`${e.prenom} ${e.nom}`, `${e.nom} ${e.prenom}`].some(x => sansAccent(x) === sansAccent(n)));
  return el ? nomCourtEleve(el) : n;
}

function htmlClassementPoule() {
  return `<table class="tableau-outil"><thead><tr><th>#</th><th>Participant</th><th>J</th><th>V</th><th>N</th><th>D</th><th>+/−</th><th>Pts</th></tr></thead>
    <tbody>${classementPoule().map((x, i) => `<tr><td>${i + 1}</td><td>${esc(nomParticipant(x.nom))}</td><td>${x.j}</td><td>${x.v}</td><td>${x.n}</td><td>${x.d}</td>
      <td>${x.pour - x.contre > 0 ? '+' : ''}${x.pour - x.contre}</td><td><b>${x.pts}</b></td></tr>`).join('')}</tbody></table>
    <p class="aide">Victoire 3 points, nul 2, défaite 1.</p>`;
}

function htmlTournoi(c) {
  const t = etatOutils.tournoi, enCours = t.matchs.length || t.montante;
  if (!enCours) {
    const eq = c && etatOutils.equipes[c.id]?.liste;
    return `
      <div class="ligne reglage-outil">
        <label>Formule<select data-o-champ="tournoi.format">
          <option value="poule" ${t.format === 'poule' ? 'selected' : ''}>Poule : tous contre tous</option>
          <option value="montante" ${t.format === 'montante' ? 'selected' : ''}>Montante-descendante (badminton, tennis de table…)</option></select></label>
        <label>Terrains<input type="number" min="1" step="1" data-o-champ="tournoi.terrains" value="${t.terrains}"></label>
      </div>
      <label class="bloc-label">Participants <span class="aide">(un par ligne : équipes ou élèves)</span>
        <textarea rows="8" data-o-champ="tournoi.texte" placeholder="Équipe Rouge&#10;Équipe Bleue&#10;…">${esc(enModeEleve() ? t.texte.split('\n').map(nomParticipant).join('\n') : t.texte)}</textarea></label>
      <div class="boutons-outil">
        ${eq?.length ? '<button data-o="tournoi-equipes">👥 Prendre les équipes du générateur</button>' : ''}
        ${c && elevesDe(c.id).length ? '<button data-o="tournoi-eleves">👤 Prendre les élèves présents</button>' : ''}
        <button class="primaire gros" data-o="tournoi-lancer">🏆 Lancer le tournoi</button>
      </div>`;
  }
  if (t.montante) {
    const m = t.montante, nom = k => esc(nomParticipant(t.participants[k]));
    const classement = t.participants.map((n, k) => ({ k, v: m.victoires[k] || 0 })).sort((a, b) => b.v - a.v);
    return `
      <div class="boutons-outil"><b>Tour ${m.tour}</b><span class="aide">Touche le gagnant sur chaque terrain, puis « Tour suivant ».</span></div>
      <div class="terrains">${m.terrains.map((p, k) => `
        <div class="terrain"><span class="num-terrain">Terrain ${k + 1}${k === 0 ? ' ⬆' : k === m.terrains.length - 1 ? ' ⬇' : ''}</span>
          ${p.map((x, i) => `<button class="joueur${m.gagnants[k] === i ? ' gagnant' : ''}" data-o="montante-gagnant" data-arg="${k}|${i}">${nom(x)}</button>`).join('<span class="contre">contre</span>')}
        </div>`).join('')}</div>
      ${m.banc.length ? `<p class="aide">Attendent leur tour : ${m.banc.map(nom).join(', ')}</p>` : ''}
      <div class="boutons-outil">
        <button class="primaire gros" data-o="montante-suivant" ${m.gagnants.every(g => g !== null) ? '' : 'disabled'}>Tour suivant →</button>
        <button class="danger" data-o="tournoi-fin">Terminer le tournoi</button>
      </div>
      <h3>Victoires</h3>
      <ol class="classement">${classement.map(x => `<li>${nom(x.k)} — <b>${x.v}</b></li>`).join('')}</ol>`;
  }
  const rotations = [...new Set(t.matchs.map(x => x.rotation))];
  return `
    <div class="carte classement-tournoi" data-o-classement>${htmlClassementPoule()}</div>
    ${rotations.map(r => `
      <h3>Rotation ${r + 1}</h3>
      <div class="matchs">${t.matchs.map((x, i) => (x.rotation !== r ? '' : `
        <div class="match"><span class="num-terrain">T${x.terrain}</span>
          <span class="equipe-match">${esc(nomParticipant(t.participants[x.a]))}</span>
          <input class="score-match" inputmode="numeric" data-o-score="${i}|sa" value="${esc(x.sa)}" aria-label="Score de ${esc(nomParticipant(t.participants[x.a]))}">
          <span>–</span>
          <input class="score-match" inputmode="numeric" data-o-score="${i}|sb" value="${esc(x.sb)}" aria-label="Score de ${esc(nomParticipant(t.participants[x.b]))}">
          <span class="equipe-match">${esc(nomParticipant(t.participants[x.b]))}</span></div>`)).join('')}</div>`).join('')}
    <div class="boutons-outil"><button class="danger" data-o="tournoi-fin">Terminer le tournoi</button></div>`;
}

/* ---------- 📏 Essais (lancers, sauts) ---------- */

const cfgEssais = c => (etatOutils.essais[c.id] ??= { nb: 3, unite: 'm', sens: 'max', tri: false, valeurs: {} });
const lireEssai = v => { v = String(v || '').trim(); return /^x$/i.test(v) ? 'X' : nombreOutil(v); };
function meilleurEssai(cfg, id) {
  const ok = (cfg.valeurs[id] || []).map(lireEssai).filter(x => typeof x === 'number');
  if (!ok.length) return null;
  return cfg.sens === 'min' ? Math.min(...ok) : Math.max(...ok);
}
const texteMeilleur = (cfg, id) => { const m = meilleurEssai(cfg, id); return m === null ? '–' : fmt(m) + ' ' + cfg.unite; };

function htmlEssais(c) {
  const cfg = cfgEssais(c);
  let els = presentsOutil(c);
  if (cfg.tri) {
    els = [...els].sort((a, b) => {
      const x = meilleurEssai(cfg, a.id), y = meilleurEssai(cfg, b.id);
      if (x === null || y === null) return (x === null) - (y === null);
      return cfg.sens === 'min' ? x - y : y - x;
    });
  }
  return `
    <div class="ligne reglage-outil">
      <label>Essais par élève<input type="number" min="1" max="8" step="1" data-o-champ="essais.nb" value="${cfg.nb}"></label>
      <label>Unité<select data-o-champ="essais.unite">${['m', 'cm', 's', 'pts', 'rép.'].map(u => `<option ${cfg.unite === u ? 'selected' : ''}>${u}</option>`).join('')}</select></label>
      <label>Meilleure performance<select data-o-champ="essais.sens">
        <option value="max" ${cfg.sens === 'max' ? 'selected' : ''}>la plus grande (lancer, saut)</option>
        <option value="min" ${cfg.sens === 'min' ? 'selected' : ''}>la plus petite (temps)</option></select></label>
    </div>
    ${htmlPresents(c)}
    <p class="aide">Tape la performance, ou <b>X</b> pour un essai nul. Entrée = case suivante.</p>
    <div class="carte"><table class="tableau-outil tableau-essais">
      <thead><tr><th>Élève</th>${Array.from({ length: cfg.nb }, (_, k) => `<th>Essai ${k + 1}</th>`).join('')}<th>Meilleure</th></tr></thead>
      <tbody>${els.map(el => `<tr><td>${esc(nomEleveOutil(el))}</td>
        ${Array.from({ length: cfg.nb }, (_, k) => {
    const v = cfg.valeurs[el.id]?.[k] || '';
    return `<td><input class="essai${lireEssai(v) === 'X' ? ' nul' : ''}" inputmode="decimal" autocomplete="off" data-o-essai="${el.id}|${k}" value="${esc(v)}"
            aria-label="${esc(nomEleveOutil(el))} — essai ${k + 1}"></td>`;
  }).join('')}
        <td class="meilleur" data-o-meilleur="${el.id}">${texteMeilleur(cfg, el.id)}</td></tr>`).join('')}</tbody>
    </table></div>
    <div class="boutons-outil">
      <button data-o="essais-tri">${cfg.tri ? '↕ Ordre de la classe' : '🏅 Classer par performance'}</button>
      <button class="danger" data-o="essais-zero" ${Object.keys(cfg.valeurs).length ? '' : 'disabled'}>Effacer les essais</button>
    </div>`;
}

/* ---------- 💨 VMA et allures ---------- */

// Temps pour parcourir `distance` m à `pct` % de la VMA (km/h).
const tempsAllure = (vma, pct, distance) => (vma > 0 ? fmtTemps((distance / ((vma * pct) / 100 / 3.6)) * 1000, false) : '–');

function htmlVma(c) {
  const cfg = etatOutils.vma;
  return `
    <div class="ligne reglage-outil">
      <label>Allure visée<select data-o-champ="vma.pct">${[60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110].map(p => `<option value="${p}" ${+cfg.pct === p ? 'selected' : ''}>${p} % de VMA</option>`).join('')}</select></label>
      <label>Distance de passage<select data-o-champ="vma.distance">${[100, 150, 200, 250, 300, 400, 500, 600, 800, 1000].map(d => `<option value="${d}" ${+cfg.distance === d ? 'selected' : ''}>${d} m</option>`).join('')}</select></label>
    </div>
    <p class="aide">Tape la VMA (km/h), ou la distance courue au <b>demi-Cooper</b> (6 min) : VMA = distance ÷ 100. La VMA est gardée dans la fiche de l’élève.</p>
    <div class="carte"><table class="tableau-outil tableau-vma">
      <thead><tr><th>Élève</th><th>Demi-Cooper (m)</th><th>VMA (km/h)</th><th>${cfg.distance} m à ${cfg.pct} %</th><th>Vitesse</th></tr></thead>
      <tbody>${elevesDe(c.id).map(el => `<tr>
        <td>${esc(nomEleveOutil(el))}</td>
        <td><input class="essai" inputmode="numeric" autocomplete="off" data-o-vma="${el.id}|cooper" value="${esc(el.demiCooper ?? '')}" aria-label="${esc(nomEleveOutil(el))} — demi-Cooper"></td>
        <td><input class="essai" inputmode="decimal" autocomplete="off" data-o-vma="${el.id}|vma" value="${el.vma ? fmt(el.vma) : ''}" aria-label="${esc(nomEleveOutil(el))} — VMA"></td>
        <td class="meilleur" data-o-allure="${el.id}">${tempsAllure(el.vma, cfg.pct, cfg.distance)}</td>
        <td class="aide" data-o-vitesse="${el.id}">${el.vma ? fmt((el.vma * cfg.pct) / 100) + ' km/h' : ''}</td></tr>`).join('')}</tbody>
    </table></div>`;
}

const RENDUS_OUTILS = {
  chrono: htmlChrono, tours: htmlTours, intervalles: htmlIntervalles, ateliers: htmlAteliers, equipes: htmlEquipes,
  tirage: htmlTirage, marque: htmlMarque, tournoi: htmlTournoi, essais: htmlEssais, vma: htmlVma,
};

/* ---------- Affichages en direct (redessinés à chaque top de l'horloge) ---------- */

const BLOCS_DIRECTS = {
  chrono: id => { const ch = etatOutils.chronos.find(x => String(x.id) === String(id)); return ch ? fmtTemps(ecoule(ch)) : ''; },
  tours: classeId => {
    const t = etatOutils.tours[classeId];
    if (!t?.debut) return t?.mode === 'duree' ? fmtTemps(t.duree * 60000, false) : '0:00,0';
    return t.mode === 'duree' ? fmtRebours(t.duree * 60000 - tempsTours(t)) : fmtTemps(tempsTours(t));
  },
  intervalles: () => {
    const cfg = etatOutils.intervalles, ph = phasesIntervalles(cfg);
    const total = ph.reduce((s, p) => s + p.duree, 0);
    if (!cfg.debut && !cfg.cumul) {
      return `<div class="phase phase-pret"><div class="phase-nom">Prêt</div><div class="grand-temps">${fmtTemps(total * 1000, false)}</div>
        <div class="phase-serie">${cfg.series} série${cfg.series > 1 ? 's' : ''} · durée totale</div></div>`;
    }
    const st = etatIntervalles();
    if (st.fini) return '<div class="phase phase-fini"><div class="phase-nom">Terminé ✔</div><div class="grand-temps">0</div><div class="phase-serie">Bravo !</div></div>';
    return `<div class="phase phase-${st.phase.type}${cfg.debut ? '' : ' en-pause'}"><div class="phase-nom">${st.phase.nom}${cfg.debut ? '' : ' (pause)'}</div>
      <div class="grand-temps">${Math.ceil(st.reste)}</div>
      <div class="phase-serie">${st.phase.serie ? `Série ${st.phase.serie} / ${cfg.series}` : 'C’est bientôt parti'}</div></div>`;
  },
  ateliers: classeId => {
    const cfg = etatOutils.ateliers, ateliers = nomsAteliers(), groupes = groupesAteliers(Donnees.get('classes', classeId));
    if (!ateliers.length) return '<p class="aide">Indique au moins un atelier.</p>';
    const st = etatAteliers(), fini = st.rotation >= Math.max(ateliers.length, 1) && (cfg.debut || cfg.cumul);
    const r = Math.min(st.rotation, ateliers.length - 1);
    return `<div class="etat-ateliers">${fini ? '<b>Tous les groupes sont passés à tous les ateliers ✔</b>'
      : `<b>Rotation ${r + 1} / ${ateliers.length}</b> <span class="grand-temps moyen">${fmtRebours(cfg.debut || cfg.cumul ? st.reste : cfg.duree * 60000)}</span>`}</div>
      <div class="table-ateliers">${groupes.map((g, k) => `<div class="ligne-atelier${g.couleur !== undefined ? ' equipe-c' + g.couleur : ''}">
        <span class="groupe-atelier">${esc(g.nom)}</span><span class="fleche">→</span><b>${esc(ateliers[(k + r) % ateliers.length])}</b></div>`).join('')}</div>`;
  },
  marque: () => {
    const m = etatOutils.marque;
    return m.duree > 0 ? fmtRebours(m.duree * 60000 - ecoule(m)) : fmtTemps(ecoule(m), false);
  },
};

/* ---------- Échéances : fin de durée, changements de phase, bips ---------- */

let derniersSignaux = {};
function verifierEcheances() {
  const maintenant = Date.now(), e = etatOutils;
  // Tours par élève en durée fixe : arrêt à la fin du temps.
  for (const t of Object.values(e.tours)) {
    if (t.debut && !t.fin && t.mode === 'duree' && maintenant - t.debut >= t.duree * 60000) {
      t.fin = t.debut + t.duree * 60000;
      bipFin();
      rendreOutil();
    }
  }
  // Intervalles : bip à chaque changement de phase et sur les 3 dernières secondes.
  const iv = e.intervalles;
  if (iv.debut) {
    const st = etatIntervalles();
    if (st.fini) {
      iv.cumul = ecoule(iv);
      iv.debut = null;
      bipFin();
      rendreOutil();
    } else {
      const s = Math.ceil(st.reste), cle = st.i + ':' + s;
      if (derniersSignaux.phase !== undefined && derniersSignaux.phase !== st.i) bipChangement();
      else if (s <= 3 && derniersSignaux.intervalles !== cle) bipCourt();
      derniersSignaux.phase = st.i;
      derniersSignaux.intervalles = cle;
    }
  } else derniersSignaux.phase = undefined;
  // Ateliers : bip à chaque rotation, arrêt quand tout le monde est passé partout.
  const at = e.ateliers;
  if (at.debut) {
    const st = etatAteliers();
    if (st.rotation >= st.nb) {
      at.cumul = st.nb * at.duree * 60000;
      at.debut = null;
      bipFin();
      rendreOutil();
    } else if (derniersSignaux.rotation !== undefined && derniersSignaux.rotation !== st.rotation) {
      son(660, 0.5, 2);
    } else if (Math.ceil(st.reste / 1000) <= 3 && derniersSignaux.ateliers !== st.rotation + ':' + Math.ceil(st.reste / 1000)) {
      bipCourt();
    }
    derniersSignaux.rotation = st.rotation;
    derniersSignaux.ateliers = st.rotation + ':' + Math.ceil(st.reste / 1000);
  } else derniersSignaux.rotation = undefined;
  // Boxe française : fin de reprise, fin du repos (boxe.js).
  if (typeof verifierBoxe === 'function') verifierBoxe();
  // ECE de SVT : bips 10 minutes avant la fin et à la fin (ece.js).
  if (typeof verifierEce === 'function') verifierEce();
  // Marque : fin du temps de jeu.
  const m = e.marque;
  if (m.debut && m.duree > 0 && ecoule(m) >= m.duree * 60000) {
    m.cumul = m.duree * 60000;
    m.debut = null;
    bipFin();
    rendreOutil();
  }
}

/* ---------- Actions (boutons [data-o]) ---------- */

// Marche / pause d'un objet minuté { debut, cumul }.
function basculer(o) {
  if (o.debut) { o.cumul = ecoule(o); o.debut = null; } else o.debut = Date.now();
}

function actionOutil(action, arg, c, bouton) {
  const e = etatOutils;
  // Mode élève : ni envoi vers une leçon, ni effacement des VMA (fiches des élèves), ni outil non autorisé.
  if (enModeEleve() && (action === 'vers-lecon' || action === 'eleve-entrer' || (action === 'reinitialiser' && ui.outil === 'vma')
    || (action === 'ouvrir' && !modeEleve.outils.includes(arg)))) return;
  switch (action) {
    case 'eleve-entrer': return lancer(() => entrerModeEleve(c));
    case 'eleve-quitter': return lancer(quitterModeEleve);
    case 'ouvrir':
      ui.outil = arg; memoriserUi();
      if (arg === 'asns') reglagesAsnsOuverts = false; // (réglages du professeur repliés à chaque ouverture de l'outil)
      if (arg === 'tableau') presentationTb = false; // (le tableau blanc s'ouvre en vue normale)
      return rendreOutil();
    case 'accueil': ui.outil = null; memoriserUi(); return rendreOutil();
    case 'plein-ecran': {
      // (Le plein écran porte sur la zone de la page, qui reste en place quand l'outil se redessine.)
      if (document.fullscreenElement) return document.exitFullscreen?.();
      return $('#vue').requestFullscreen?.().catch(() => toast('Plein écran indisponible sur cet appareil.'));
    }
    case 'presence': {
      const a = absentsDuJour(c);
      e.absents[c.id].ids = a.includes(arg) ? a.filter(x => x !== arg) : [...a, arg];
      return rendreOutil();
    }

    case 'chrono-go': { const ch = e.chronos.find(x => String(x.id) === arg); basculer(ch); bipToucher(); return rendreOutil(); }
    case 'chrono-tour': { const ch = e.chronos.find(x => String(x.id) === arg); ch.tours.push(ecoule(ch)); bipToucher(); return rendreOutil(); }
    case 'chrono-zero': { const ch = e.chronos.find(x => String(x.id) === arg); Object.assign(ch, { debut: null, cumul: 0, tours: [] }); return rendreOutil(); }
    case 'chrono-suppr': e.chronos = e.chronos.filter(x => String(x.id) !== arg); return rendreOutil();
    case 'chrono-ajout': {
      const id = Math.max(0, ...e.chronos.map(x => x.id)) + 1;
      e.chronos.push({ id, nom: 'Chrono ' + id, debut: null, cumul: 0, tours: [] });
      return rendreOutil();
    }
    case 'chrono-tous': { const t = Date.now(); e.chronos.filter(ch => !ch.debut).forEach(ch => { ch.debut = t; }); bipToucher(); return rendreOutil(); }

    case 'tours-go': {
      const t = cfgTours(c);
      if (t.debut && !t.fin) { t.fin = Date.now(); bipFin(); }
      else { Object.assign(t, { debut: Date.now(), fin: null, passages: {}, pile: [] }); son(990, 0.4); }
      return rendreOutil();
    }
    case 'tours-passage': {
      const t = cfgTours(c);
      if (!t.debut || t.fin || arrive(t, arg)) return;
      (t.passages[arg] ||= []).push(tempsTours(t));
      t.pile.push(arg);
      bipToucher();
      return rendreOutil();
    }
    case 'tours-annuler': { const t = cfgTours(c), id = t.pile.pop(); t.passages[id]?.pop(); return rendreOutil(); }
    case 'tours-zero': Object.assign(cfgTours(c), { debut: null, fin: null, passages: {}, pile: [] }); return rendreOutil();

    case 'intervalles-preset': {
      const [, travail, repos, series] = PRESETS_INTERVALLES[+arg];
      Object.assign(e.intervalles, { travail, repos, series });
      return rendreOutil();
    }
    case 'intervalles-go': {
      const iv = e.intervalles;
      if (etatIntervalles().fini) { iv.cumul = 0; iv.debut = null; }
      basculer(iv);
      bipToucher();
      return rendreOutil();
    }
    case 'intervalles-zero': Object.assign(e.intervalles, { debut: null, cumul: 0 }); return rendreOutil();

    case 'ateliers-go': {
      const at = e.ateliers;
      if (etatAteliers().rotation >= nomsAteliers().length) { at.cumul = 0; at.debut = null; }
      basculer(at);
      bipToucher();
      return rendreOutil();
    }
    case 'ateliers-suivant': {
      const at = e.ateliers, dureeMs = at.duree * 60000, t = ecoule(at);
      at.cumul = (at.cumul || 0) + (dureeMs - (t % dureeMs)); // saute à la rotation suivante
      return rendreOutil();
    }
    case 'ateliers-zero': Object.assign(e.ateliers, { debut: null, cumul: 0 }); return rendreOutil();

    case 'equipes-faire': faireEquipes(c); return rendreOutil();
    case 'equipes-precedentes': {
      const cfg = cfgEquipes(c);
      [cfg.liste, cfg.precedente] = [cfg.precedente || [], cfg.liste];
      cfg.selection = null;
      return rendreOutil();
    }
    case 'equipes-effacer': {
      const cfg = cfgEquipes(c);
      cfg.precedente = cfg.liste; // (« ↶ Équipes précédentes » les retrouve)
      cfg.liste = [];
      cfg.selection = null;
      toast('Équipes effacées — « ↶ Équipes précédentes » pour les retrouver.');
      return rendreOutil();
    }
    case 'reinitialiser': return lancer(() => reinitialiserOutil(c));
    case 'vers-lecon': return lancer(() => envoyerVersLecon(c, ui.outil));
    case 'equipes-choisir': {
      const cfg = cfgEquipes(c), [k, id] = arg.split('|');
      if (!cfg.selection || cfg.selection === id) { cfg.selection = cfg.selection === id ? null : id; return rendreOutil(); }
      const de = cfg.liste.find(eq => eq.membres.includes(cfg.selection)), vers = cfg.liste[+k];
      if (de && de !== vers) {
        de.membres[de.membres.indexOf(cfg.selection)] = id;
        vers.membres[vers.membres.indexOf(id)] = cfg.selection;
        cfg.selection = null;
      } else cfg.selection = id;
      return rendreOutil();
    }
    case 'separer-ajout': {
      const a = $('[data-o-separer="a"]').value, b = $('[data-o-separer="b"]').value;
      if (!a || !b || a === b) return toast('Choisis deux élèves différents.', 'erreur');
      cfgEquipes(c).separer.push([a, b]);
      return rendreOutil();
    }
    case 'separer-suppr': cfgEquipes(c).separer.splice(+arg, 1); return rendreOutil();

    case 'tirage-eleve': {
      const cfg = cfgTirage(c), presents = presentsOutil(c);
      let pool = cfg.sansRemise ? presents.filter(el => !cfg.deja.includes(el.id)) : presents;
      if (!pool.length && cfg.sansRemise) { cfg.deja = []; pool = presents; } // tout le monde est passé : on recommence
      if (!pool.length) return toast('Aucun élève présent.', 'erreur');
      const choisi = pool[Math.floor(Math.random() * pool.length)];
      // Petite animation : les noms défilent, puis s'arrêtent sur l'élève tiré.
      const zone = $('[data-o-tire]');
      bouton.disabled = true;
      let n = 0;
      const anim = setInterval(() => {
        if (zone) zone.textContent = nomOutil(pool[Math.floor(Math.random() * pool.length)].id);
        if (++n >= 12) {
          clearInterval(anim);
          cfg.dernier = choisi.id;
          if (cfg.sansRemise) cfg.deja.push(choisi.id);
          son(990, 0.3);
          rendreOutil();
        }
      }, 80);
      return;
    }
    case 'tirage-raz': Object.assign(cfgTirage(c), { deja: [], dernier: null }); return rendreOutil();
    case 'tirage-roles': {
      const cfg = cfgTirage(c), roles = cfg.roles.split('\n').map(s => s.trim()).filter(Boolean);
      const els = melange(presentsOutil(c));
      cfg.attribution = roles.slice(0, els.length).map((r, k) => [r, els[k].id]);
      if (roles.length > els.length) toast('Plus de rôles que d’élèves présents : certains rôles ne sont pas attribués.');
      return rendreOutil();
    }

    case 'marque-plus': {
      const m = e.marque, [cote, n] = arg.split('|');
      m.pile.push({ pa: m.pa, pb: m.pb, sets: m.sets.map(s => [...s]) });
      m['p' + cote] = Math.max(0, m['p' + cote] + +n);
      bipToucher();
      return rendreOutil();
    }
    case 'marque-set': {
      const m = e.marque;
      m.pile.push({ pa: m.pa, pb: m.pb, sets: m.sets.map(s => [...s]) });
      m.sets.push([m.pa, m.pb]);
      m.pa = 0; m.pb = 0;
      return rendreOutil();
    }
    case 'marque-annuler': { const m = e.marque; Object.assign(m, m.pile.pop()); return rendreOutil(); }
    case 'marque-inverser': {
      const m = e.marque;
      [m.a, m.b, m.pa, m.pb] = [m.b, m.a, m.pb, m.pa];
      m.sets = m.sets.map(([a, b]) => [b, a]);
      m.pile = [];
      return rendreOutil();
    }
    case 'marque-zero': Object.assign(e.marque, { pa: 0, pb: 0, sets: [], debut: null, cumul: 0, pile: [] }); return rendreOutil();
    case 'marque-go': basculer(e.marque); bipToucher(); return rendreOutil();

    case 'tournoi-equipes': e.tournoi.texte = etatOutils.equipes[c.id].liste.map(eq => 'Équipe ' + COULEURS_EQUIPES[eq.couleur]).join('\n'); return rendreOutil();
    case 'tournoi-eleves': e.tournoi.texte = presentsOutil(c).map(nomEleveOutil).join('\n'); return rendreOutil();
    case 'tournoi-lancer': lancerTournoi(); return rendreOutil();
    case 'tournoi-fin':
      return lancer(async () => {
        if (!(await confirmer('Terminer le tournoi ? Les résultats seront effacés.', 'Terminer'))) return;
        Object.assign(e.tournoi, { matchs: [], montante: null });
        rendreOutil();
      });
    case 'montante-gagnant': { const [k, i] = arg.split('|').map(Number); e.tournoi.montante.gagnants[k] = i; return rendreOutil(); }
    case 'montante-suivant': tourSuivantMontante(); return rendreOutil();

    case 'essais-tri': cfgEssais(c).tri = !cfgEssais(c).tri; return rendreOutil();
    case 'essais-zero':
      return lancer(async () => {
        if (!(await confirmer('Effacer tous les essais de cette classe ?', 'Effacer'))) return;
        cfgEssais(c).valeurs = {};
        rendreOutil();
      });
  }
}

/* ---------- 📤 Envoyer le travail d'un outil vers une leçon ----------
   Chaque outil de classe sait dire ce qu'il a relevé, élève par élève : des « colonnes » (nom, type de donnée
   de leçon, valeurs). On les envoie dans une nouvelle leçon (formulaire classique, pré-rempli : on la nomme,
   on choisit l'APSA, on complète) ou dans une leçon existante (colonnes ajoutées). L'appli fait tout elle-même. */

const secondes = ms => String(Math.round(ms / 10) / 100);

// Élèves derrière un nom de participant (tournoi, marque) : une équipe du générateur, ou un élève de la classe.
function elevesDuNom(c, nom) {
  const n = sansAccent(nom);
  const eq = etatOutils.equipes[c.id]?.liste?.find(e => sansAccent('Équipe ' + COULEURS_EQUIPES[e.couleur]) === n);
  if (eq) return eq.membres.filter(id => Donnees.get('eleves', id));
  const el = elevesDe(c.id).find(e => [`${e.prenom} ${e.nom}`, `${e.nom} ${e.prenom}`].some(x => sansAccent(x) === n));
  if (el) return [el.id];
  // Nom court du mode élève (« G. Léonie ») : reconnu s'il ne désigne qu'un élève de la classe.
  const courts = elevesDe(c.id).filter(e => sansAccent(nomCourtEleve(e)) === n);
  return courts.length === 1 ? [courts[0].id] : [];
}

const TRANSFERTS = {
  tours(c) {
    const t = cfgTours(c), coureurs = Object.entries(t.passages).filter(([id, p]) => p.length && Donnees.get('eleves', id));
    if (!coureurs.length) throw new Error('Aucun passage enregistré : lance une course d’abord.');
    const colonnes = [{ nom: 'Tours', type: 'nombre', valeurs: Object.fromEntries(coureurs.map(([id, p]) => [id, String(p.length)])) }];
    if (t.distance) colonnes.push({ nom: 'Distance', type: 'distance', unite: 'm', valeurs: Object.fromEntries(coureurs.map(([id, p]) => [id, String(p.length * t.distance)])) });
    if (t.mode === 'chrono') colonnes.push({ nom: 'Temps', type: 'temps', valeurs: Object.fromEntries(coureurs.map(([id, p]) => [id, secondes(p.at(-1))])) });
    return { titre: t.mode === 'duree' ? `Course en durée ${fmt(t.duree)} min` : 'Course', apsa: t.mode === 'duree' ? 'Course en durée' : 'Demi-fond', colonnes };
  },
  essais(c) {
    const cfg = cfgEssais(c);
    const ids = Object.keys(cfg.valeurs).filter(id => Donnees.get('eleves', id) && meilleurEssai(cfg, id) !== null);
    if (!ids.length) throw new Error('Aucun essai réussi enregistré.');
    const type = cfg.unite === 's' ? 'temps' : ['m', 'cm'].includes(cfg.unite) ? 'distance' : 'nombre';
    const colonnes = [{ nom: 'Meilleure performance', type, ...(type !== 'temps' ? { unite: cfg.unite } : {}),
      valeurs: Object.fromEntries(ids.map(id => [id, String(meilleurEssai(cfg, id))])) }];
    const nuls = Object.keys(cfg.valeurs).filter(id => Donnees.get('eleves', id) && cfg.valeurs[id].some(v => lireEssai(v) === 'X'));
    if (nuls.length) colonnes.push({ nom: 'Essais nuls', type: 'nombre', valeurs: Object.fromEntries(Object.keys(cfg.valeurs).filter(id => Donnees.get('eleves', id)).map(id => [id, String(cfg.valeurs[id].filter(v => lireEssai(v) === 'X').length)])) });
    return { titre: 'Essais', apsa: '', colonnes };
  },
  equipes(c) {
    const liste = cfgEquipes(c).liste;
    if (!liste.length) throw new Error('Fais d’abord les équipes.');
    const valeurs = {};
    for (const eq of liste) for (const id of eq.membres) if (Donnees.get('eleves', id)) valeurs[id] = COULEURS_EQUIPES[eq.couleur];
    return { titre: 'Équipes', apsa: '', colonnes: [{ nom: 'Équipe', type: 'choix', options: liste.map(eq => COULEURS_EQUIPES[eq.couleur]), valeurs }] };
  },
  tirage(c) {
    const att = cfgTirage(c).attribution.filter(([, id]) => Donnees.get('eleves', id));
    if (!att.length) throw new Error('Attribue d’abord les rôles.');
    return { titre: 'Rôles', apsa: '', colonnes: [{ nom: 'Rôle tenu', type: 'choix', options: [...new Set(att.map(([r]) => r))], valeurs: Object.fromEntries(att.map(([r, id]) => [id, r])) }] };
  },
  tournoi(c) {
    const t = etatOutils.tournoi;
    if (!t.matchs.length && !t.montante) throw new Error('Aucun tournoi en cours.');
    const parParticipant = t.participants.map(nom => elevesDuNom(c, nom));
    if (!parParticipant.some(l => l.length)) {
      throw new Error('Les participants ne correspondent à aucun élève ni équipe de la classe (prends-les avec « Élèves présents » ou « Équipes du générateur »).');
    }
    const colonne = (nom, valeurDe) => {
      const valeurs = {};
      parParticipant.forEach((ids, k) => ids.forEach(id => { valeurs[id] = String(valeurDe(k)); }));
      return { nom, type: 'nombre', valeurs };
    };
    if (t.montante) {
      const m = t.montante, terrain = k => { const i = m.terrains.findIndex(p => p.includes(k)); return i < 0 ? m.terrains.length + 1 : i + 1; };
      return { titre: 'Tournoi montante-descendante', apsa: '', colonnes: [colonne('Victoires', k => m.victoires[k] || 0), colonne('Terrain atteint', terrain)] };
    }
    const cl = classementPoule(), rang = k => cl.findIndex(x => x.k === k) + 1, ligne = k => cl.find(x => x.k === k);
    return { titre: 'Tournoi', apsa: '', colonnes: [
      colonne('Matchs joués', k => ligne(k).j), colonne('Victoires', k => ligne(k).v), colonne('Points', k => ligne(k).pts),
      colonne('Classement', rang)] };
  },
  marque(c) {
    const m = etatOutils.marque, A = elevesDuNom(c, m.a), B = elevesDuNom(c, m.b);
    if (!A.length && !B.length) throw new Error('Nomme les équipes comme dans le générateur (ex. « Équipe Rouge ») pour savoir quels élèves ont joué.');
    const setsA = m.sets.filter(s => s[0] > s[1]).length, setsB = m.sets.filter(s => s[1] > s[0]).length;
    // Score du match : sets gagnés s'il y a eu des sets, sinon les points.
    const [sa, sb] = m.sets.length ? [setsA, setsB] : [m.pa, m.pb];
    const resultat = (x, y) => (x > y ? 'Victoire' : x < y ? 'Défaite' : 'Nul');
    const points = m.sets.reduce((s, [a, b]) => [s[0] + a, s[1] + b], [m.pa, m.pb]);
    const pour = (ids, v) => Object.fromEntries(ids.map(id => [id, v]));
    return { titre: `Match ${m.a} – ${m.b}`, apsa: '', colonnes: [
      { nom: 'Résultat', type: 'choix', options: ['Victoire', 'Nul', 'Défaite'], valeurs: { ...pour(A, resultat(sa, sb)), ...pour(B, resultat(sb, sa)) } },
      { nom: 'Points marqués', type: 'nombre', valeurs: { ...pour(A, String(points[0])), ...pour(B, String(points[1])) } },
      ...(m.sets.length ? [{ nom: 'Sets gagnés', type: 'nombre', valeurs: { ...pour(A, String(setsA)), ...pour(B, String(setsB)) } }] : []),
    ] };
  },
  vma(c) {
    const els = elevesDe(c.id).filter(el => el.vma);
    if (!els.length) throw new Error('Aucune VMA saisie.');
    return { titre: 'VMA', apsa: 'Demi-fond', colonnes: [
      { nom: 'VMA', type: 'nombre', unite: 'km/h', valeurs: Object.fromEntries(els.map(el => [el.id, String(el.vma)])) },
      ...(els.some(el => el.demiCooper) ? [{ nom: 'Demi-Cooper', type: 'distance', unite: 'm', valeurs: Object.fromEntries(els.filter(el => el.demiCooper).map(el => [el.id, String(el.demiCooper)])) }] : []),
    ] };
  },
};

async function envoyerVersLecon(c, outilId) {
  const donnees = TRANSFERTS[outilId](c);
  const absents = absentsDuJour(c).filter(id => Donnees.get('eleves', id));
  const seances = seancesDe(c.id).slice().reverse();
  const nb = col => Object.keys(col.valeurs).length;
  const L = motMin('lecon'); // « leçon » en EPS, « séance » en SVT (féminin dans les deux cas)
  const { d, resultat } = ouvrirModale(`Envoyer vers une ${L} — ${c.nom}`, `
    <fieldset class="choix-import"><legend>Données à envoyer</legend>
      ${donnees.colonnes.map((col, k) => `<label class="case"><input type="checkbox" name="col" value="${k}" checked>
        <span><b>${esc(col.nom)}</b> <span class="aide">${esc(TYPES_INDIC[typeAffiche(col)])}${col.unite ? ' (' + esc(col.unite) + ')' : ''} · ${nb(col)} élève${nb(col) > 1 ? 's' : ''}</span></span></label>`).join('')}
      ${absents.length ? `<label class="case"><input type="checkbox" name="absents" checked>
        <span>Noter <b>ABS</b> ${absents.length > 1 ? `les ${absents.length} élèves absents` : 'l’élève absent'} aujourd’hui</span></label>` : ''}
    </fieldset>
    <fieldset class="choix-import"><legend>Vers</legend>
      <label class="case"><input type="radio" name="vers" value="nouvelle" checked> <span>Une <b>nouvelle ${L}</b> (tu la nommes et la complètes ensuite)</span></label>
      ${seances.length ? `<label class="case"><input type="radio" name="vers" value="existante"> <span>Une ${L} existante :</span></label>
        <select name="seance" aria-label="${L} existante">${seances.map(s => `<option value="${s.id}">${dateCourte(s.date)} — ${esc(s.titre)}</option>`).join('')}</select>` : ''}
    </fieldset>
    <p class="aide">Dans une ${L} existante, les données sont ajoutées en colonnes (une colonne du même nom est complétée).
      Une case déjà remplie dans la ${L} est remplacée par la valeur de l’outil.</p>`,
  boutonsModale('Continuer'));
  $('[name="seance"]', d)?.addEventListener('change', () => { $('[name="vers"][value="existante"]', d).checked = true; });
  const r = await resultat;
  if (r.action !== 'ok') return;
  const choisies = r.fd.getAll('col').map(k => donnees.colonnes[+k]);
  if (!choisies.length) return toast('Aucune donnée choisie.', 'erreur');
  const nouvelId = () => 'i' + Donnees.nouvelId().slice(0, 8);
  const indicDe = col => (col.medaille ? indMedaille({ nom: col.nom })
    : { nom: col.nom, type: col.type, ...(col.unite ? { unite: col.unite } : {}), ...(col.type === 'choix' ? { options: [...col.options] } : {}) });

  let seanceId;
  if (r.data.vers === 'existante') {
    // Leçon existante : on complète une donnée de même nom et de même type, sinon on ajoute une colonne.
    const s = Donnees.get('seances', r.data.seance);
    const indicateurs = structuredClone(s.indicateurs);
    for (const col of choisies) {
      let ind = indicateurs.find(i => sansAccent(i.nom) === sansAccent(col.nom) && i.type === col.type && !i.medaille === !col.medaille);
      if (!ind) { ind = { id: nouvelId(), ...indicDe(col) }; indicateurs.push(ind); }
      col.indId = ind.id;
    }
    Donnees.ecrire('seances', { ...s, indicateurs });
    seanceId = s.id;
  } else {
    // Nouvelle leçon : le formulaire classique s'ouvre, pré-rempli (nom, APSA, date, données) ; on peut tout modifier.
    for (const col of choisies) col.indId = nouvelId();
    seanceId = await editerSeance(null, {
      titre: donnees.titre, apsa: donnees.apsa, date: aujourdhui(), indicateurs: choisies.map(col => ({ id: col.indId, ...indicDe(col) })),
    });
    if (!seanceId) return toast(`Envoi annulé : aucune ${L} créée.`);
  }

  // Écriture des valeurs (seulement dans les données encore présentes dans la leçon).
  const s = structuredClone(Donnees.get('seances', seanceId)); // (copie : réponses de liste ajoutées puis enregistrées proprement)
  let nbValeurs = 0;
  for (const col of choisies) {
    const ind = s.indicateurs.find(i => i.id === col.indId);
    if (!ind) continue; // donnée retirée dans le formulaire
    for (const [eleveId, v] of Object.entries(col.valeurs)) {
      if (!v || !Donnees.get('eleves', eleveId)) continue;
      if (ind.type === 'choix' && !(ind.options || []).includes(v)) ind.options = [...(ind.options || []), v];
      Donnees.ecrireNote(seanceId, eleveId, v, ind.id);
      nbValeurs++;
    }
  }
  const apres = Donnees.get('seances', seanceId);
  if (JSON.stringify(apres.indicateurs) !== JSON.stringify(s.indicateurs)) Donnees.ecrire('seances', { ...apres, indicateurs: s.indicateurs });
  let nbAbs = 0;
  if (r.data.absents === 'on') {
    for (const id of absents) if (!statutEnt(seanceId, id)) { Donnees.ecrireNote(seanceId, id, 'ABS'); nbAbs++; }
  }
  // On montre la leçon (tous les exercices, pour qu'elle soit visible).
  ui.exercices = { ...ui.exercices, [c.id]: '' };
  ui.vue = 'entrainement';
  memoriserUi();
  rendre();
  toast(`Envoyé dans « ${s.titre} » : ${nbValeurs} valeur${nbValeurs > 1 ? 's' : ''}${nbAbs ? `, ${nbAbs} absent${nbAbs > 1 ? 's' : ''}` : ''} ✔`, 'ok');
}

// Bouton « 🗑 Tout effacer » de chaque outil : remise à zéro (pour la classe affichée, s'il s'agit d'un outil de classe).
async function reinitialiserOutil(c) {
  const o = OUTILS.find(x => x.id === ui.outil), e = etatOutils, d = etatOutilsDefaut();
  if (!o) return;
  const message = o.id === 'vma'
    ? `Effacer les VMA et les distances du demi-Cooper de tous les élèves de ${c.nom} ? (Elles sont enregistrées dans leurs fiches : c’est définitif.)`
    : `Remettre l’outil « ${o.nom} » à zéro${o.classe && c ? ` pour la classe ${c.nom}` : ''} ? Tout ce qui y a été saisi sera effacé.`;
  if (!(await confirmer(message, 'Tout effacer'))) return;
  if (o.id === 'chrono') e.chronos = d.chronos;
  else if (['intervalles', 'ateliers', 'marque', 'tournoi'].includes(o.id)) e[o.id] = d[o.id];
  else if (o.id === 'vma') {
    for (const el of elevesDe(c.id)) {
      if (el.vma === undefined && el.demiCooper === undefined) continue;
      const { vma, demiCooper, ...reste } = el;
      Donnees.ecrire('eleves', reste);
    }
  } else if (c) delete e[o.id][c.id];
  rendreOutil();
  toast('Effacé ✔', 'ok');
}

/* ---------- 🎓 Entrer dans le mode élève / en sortir ---------- */

async function entrerModeEleve(c) {
  if (!c || !elevesDe(c.id).length) throw new Error('Choisis d’abord une classe avec des élèves.');
  const choix = etatOutils.choixModeEleve || OUTILS.filter(o => outilDeLaDiscipline(o) && o.eleve !== false).map(o => o.id); // (dernier choix gardé sur cet appareil)
  const exemple = elevesDe(c.id)[0];
  const { resultat } = ouvrirModale(`🎓 Mode élève — ${c.nom}`, `
    <p>La tablette n’affichera plus que <b>les outils cochés</b>, pour la classe <b>${esc(c.nom)}</b>.
      Pas d’accès aux notes, aux ${motMin('lecons')}, aux fiches des élèves, à la clé ni aux réglages.</p>
    <p class="aide">Les élèves apparaissent avec l’initiale du nom et le prénom (ex. « ${esc(nomCourtEleve(exemple))} »).
      Les niveaux ne sont pas affichés dans les équipes, et rien ne part vers une ${motMin('lecon')} : tu le feras en sortant du mode élève.</p>
    <fieldset class="choix-import"><legend>Outils autorisés</legend>
      <div class="cases-mode-eleve">${OUTILS.filter(o => outilDeLaDiscipline(o) && o.eleve !== false).map(o => `<label class="case"><input type="checkbox" name="outil" value="${o.id}" ${choix.includes(o.id) ? 'checked' : ''}>
        <span>${o.icone} ${esc(o.nom)}</span></label>`).join('')}</div>
    </fieldset>
    <div class="ligne">
      <label>Code pour sortir (4 chiffres)<input name="code" type="password" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" required autocomplete="off"></label>
      <label>Encore une fois<input name="code2" type="password" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" required autocomplete="off"></label>
    </div>
    <p class="aide">${Donnees.meta().temoinMdp ? 'Code oublié ? Le mot de passe de ta clé permettra aussi de sortir.'
    : '⚠ Retiens bien ce code : c’est le seul moyen de sortir du mode élève sur cette tablette.'}</p>
    <p class="aide">📌 Pour que l’élève ne puisse pas quitter l’appli : active l’<b>épinglage d’écran</b> (Android) ou l’<b>Accès guidé</b> (iPad).</p>`,
  boutonsModale('Passer en mode élève'));
  const r = await resultat;
  if (r.action !== 'ok') return;
  const outils = r.fd.getAll('outil');
  if (!outils.length) { toast('Coche au moins un outil.', 'erreur'); return entrerModeEleve(c); }
  if (r.data.code !== r.data.code2) { toast('Les deux codes ne sont pas les mêmes.', 'erreur'); return entrerModeEleve(c); }
  etatOutils.choixModeEleve = outils;
  sauverOutils();
  modeEleve = { classeId: c.id, outils, code: await Cle.creerTemoin(r.data.code), essais: 0, bloqueJusqua: 0 };
  sauverModeEleve();
  ui.vue = 'outils';
  ui.outil = outils.length === 1 ? outils[0] : null; // un seul outil : il s'ouvre directement
  memoriserUi();
  rendre();
  toast('Mode élève activé 🎓', 'ok');
}

async function quitterModeEleve() {
  const m = modeEleve;
  if (!m) return;
  const attente = (m.bloqueJusqua || 0) - Date.now();
  if (attente > 0) throw new Error(`Trop d’essais : réessaie dans ${Math.ceil(attente / 1000)} s.`);
  const temoin = Donnees.meta().temoinMdp;
  const { resultat } = ouvrirModale('🔒 Quitter le mode élève', `
    <label>Code du professeur<input name="code" type="password" inputmode="numeric" maxlength="4" autocomplete="off" autofocus></label>
    ${temoin ? `<details class="code-oublie"><summary>Code oublié ?</summary>
      <label>Mot de passe de la clé<input name="mdp" type="password" autocomplete="off"></label></details>` : ''}`,
  boutonsModale('Quitter'));
  const r = await resultat;
  if (r.action !== 'ok') return;
  let ok = !!r.data.code && (await Cle.verifierTemoin(r.data.code, m.code));
  if (!ok && temoin && r.data.mdp) ok = await Cle.verifierTemoin(r.data.mdp, temoin).catch(() => false);
  if (!ok) {
    // 5 erreurs de suite : une minute d'attente (pour décourager les essais au hasard).
    m.essais = (m.essais || 0) + 1;
    if (m.essais >= 5) { m.essais = 0; m.bloqueJusqua = Date.now() + 60000; }
    sauverModeEleve();
    throw new Error(m.bloqueJusqua > Date.now() ? 'Code incorrect. Trop d’essais : attends une minute.' : 'Code incorrect.');
  }
  modeEleve = null;
  sauverModeEleve();
  ui.outil = null;
  memoriserUi();
  rendre();
  toast('Mode élève terminé : tout le carnet est de nouveau accessible.', 'ok');
}

// Appelé à chaque dessin de l'appli : en mode élève, on reste dans les outils autorisés de la classe choisie.
function appliquerModeEleve() {
  document.body.classList.toggle('mode-eleve', enModeEleve());
  if (!enModeEleve()) return;
  ui.vue = 'outils';
  ui.classeId = modeEleve.classeId;
  if (ui.outil && !modeEleve.outils.includes(ui.outil)) ui.outil = null;
  basculerMenu(false);
  ouvrirMenuCle(false);
}

// En mode élève, rien en dehors de la zone des outils ne répond (en plus d'être caché).
document.addEventListener('click', e => {
  if (!enModeEleve() || !e.target.closest?.('header, aside, #voile, #menu-cle, #saisie')) return;
  e.stopPropagation();
  e.preventDefault();
}, true);

/* ---------- Évènements ---------- */

document.addEventListener('click', e => {
  const b = e.target.closest('#vue [data-o]');
  if (!b || b.disabled) return;
  const c = classeActive();
  lancer(() => actionOutil(b.dataset.o, b.dataset.arg, c, b));
});

// Liste des présents : garder ouverte / fermée d'un dessin à l'autre.
document.addEventListener('toggle', e => { if (e.target.matches?.('[data-o-presents]')) presentsOuverts = e.target.open; }, true);

// Réglages des outils : « outil.champ », ou « outil.champ » d'une classe pour les outils de classe.
const OUTILS_PAR_CLASSE = { tours: cfgTours, equipes: cfgEquipes, tirage: cfgTirage, essais: cfgEssais };
document.addEventListener('change', e => {
  const t = e.target;
  if (!t.closest?.('#vue')) return;
  if (t.dataset.oChamp) {
    const [outil, champ] = t.dataset.oChamp.split('.');
    const c = classeActive();
    const cible = OUTILS_PAR_CLASSE[outil] ? OUTILS_PAR_CLASSE[outil](c) : etatOutils[outil];
    cible[champ] = t.type === 'checkbox' ? t.checked : t.type === 'number' ? Math.min(+t.max || Infinity, Math.max(+t.min || 0, nombreOutil(t.value) ?? 0))
      : t.tagName === 'SELECT' && /^\d+$/.test(t.value) && ['pct', 'distance'].includes(champ) ? +t.value : t.value;
    if (t.type === 'number') t.value = cible[champ];
    // Menus et cases : on redessine. Champs à taper : pas de redessin (il ferait perdre le champ suivant,
    // ou le clic sur un bouton juste après) ; seuls les affichages en direct sont mis à jour.
    if (t.tagName === 'SELECT' || t.type === 'checkbox' || t.dataset.oChamp === 'essais.nb') return rendreOutil();
    sauverOutils();
    return majBlocs();
  }
  if (t.dataset.oEssai) {
    const [id, k] = t.dataset.oEssai.split('|'), cfg = cfgEssais(classeActive());
    const v = t.value.trim();
    if (v && lireEssai(v) === null) { toast(`« ${v} » : tape un nombre, ou X pour un essai nul.`, 'erreur'); t.value = cfg.valeurs[id]?.[k] || ''; return; }
    (cfg.valeurs[id] ||= [])[+k] = lireEssai(v) === 'X' ? 'X' : v.replace('.', ',');
    t.value = cfg.valeurs[id][+k];
    t.classList.toggle('nul', lireEssai(v) === 'X');
    $(`[data-o-meilleur="${id}"]`).textContent = texteMeilleur(cfg, id);
    return sauverOutils();
  }
  if (t.dataset.oVma) {
    const [id, quoi] = t.dataset.oVma.split('|'), el = Donnees.get('eleves', id), n = nombreOutil(t.value);
    if (t.value.trim() && (n === null || n <= 0)) { toast('Tape un nombre.', 'erreur'); return; }
    const modif = { ...el };
    if (quoi === 'cooper') { modif.demiCooper = n ?? undefined; if (n) modif.vma = Math.round(n / 10) / 10; } // demi-Cooper : VMA = distance ÷ 100
    else modif.vma = n ?? undefined;
    Donnees.ecrire('eleves', modif);
    const cfg = etatOutils.vma, ligne = t.closest('tr');
    $('[data-o-vma$="|vma"]', ligne).value = modif.vma ? fmt(modif.vma) : '';
    $(`[data-o-allure="${id}"]`).textContent = tempsAllure(modif.vma, cfg.pct, cfg.distance);
    $(`[data-o-vitesse="${id}"]`).textContent = modif.vma ? fmt((modif.vma * cfg.pct) / 100) + ' km/h' : '';
    return;
  }
  if (t.dataset.oScore) {
    const [i, cote] = t.dataset.oScore.split('|');
    etatOutils.tournoi.matchs[+i][cote] = t.value.trim();
    $('[data-o-classement]').innerHTML = htmlClassementPoule(); // (pas de redessin complet : on garde la case suivante)
    return sauverOutils();
  }
});

document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset?.oNomChrono) {
    const ch = etatOutils.chronos.find(x => String(x.id) === t.dataset.oNomChrono);
    if (ch) { ch.nom = t.value; sauverOutils(); }
  }
});

// Essais, VMA, scores : Entrée passe à la case suivante.
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || !e.target.matches?.('#vue [data-o-essai], #vue [data-o-vma], #vue [data-o-score]')) return;
  e.preventDefault();
  const champs = [...document.querySelectorAll('#vue [data-o-essai], #vue [data-o-vma], #vue [data-o-score]')];
  const suivant = champs[champs.indexOf(e.target) + 1];
  if (suivant) { suivant.focus(); suivant.select(); } else e.target.blur();
});

// Au lancement : un minuteur resté en marche (page rechargée) repart.
setTimeout(() => { if (typeof Donnees === 'object') relancerTic(); }, 0);
