'use strict';
const VERSION_APP = '0.33.0'; // garder identique à VERSION dans sw.js

const $ = (s, racine = document) => racine.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const collator = new Intl.Collator('fr', { sensitivity: 'base', numeric: true });
const triEleves = (a, b) => collator.compare(a.nom, b.nom) || collator.compare(a.prenom, b.prenom);

const NIVEAUX = ['6e', '5e', '4e', '3e', '2nde', '1re', 'Tle', 'CAP', 'Bac pro', 'Autre'];
const APSA = [
  'Demi-fond', 'Course de vitesse', 'Course de haies', 'Relais', 'Saut en longueur', 'Saut en hauteur', 'Triple saut',
  'Lancer de poids', 'Lancer de javelot', 'Lancer de disque', 'Multibonds', 'Natation', 'Natation en durée', 'Savoir-nager', 'Sauvetage',
  'Course d’orientation', 'Escalade', 'VTT',
  'Badminton', 'Tennis de table', 'Tennis', 'Volley-ball', 'Basket-ball', 'Handball', 'Football', 'Rugby', 'Ultimate',
  'Futsal', 'Lutte', 'Judo', 'Boxe française', 'Gymnastique', 'Acrosport', 'Arts du cirque', 'Danse',
  'Musculation', 'Step', 'Course en durée', 'Cross-training', 'Yoga', 'Relaxation',
];
const CODES = { ABS: 'Absent', DISP: 'Dispensé', NE: 'Non noté', BLE: 'Blessé', MAL: 'Malade', AUT: 'Autre' };
const RACCOURCIS = { A: 'ABS', ABS: 'ABS', D: 'DISP', DISP: 'DISP', N: 'NE', NE: 'NE', NN: 'NE' };

class Annule extends Error {}
let mdpSession = null; // gardé en mémoire seulement le temps de la session

const ui = (() => { try { return JSON.parse(localStorage.getItem('carnet-eps-ui')) || {}; } catch { return {}; } })();
ui.vue ||= 'notes';
function memoriserUi() { try { localStorage.setItem('carnet-eps-ui', JSON.stringify(ui)); } catch { /* sans importance */ } }

/* ---------- Petits outils d'interface ---------- */

function toast(message, type = '') {
  const t = $('#toast');
  t.textContent = message;
  t.className = 'toast ' + type;
  t.hidden = false;
  clearTimeout(toast.minuteur);
  toast.minuteur = setTimeout(() => { t.hidden = true; }, type === 'erreur' ? 6000 : 3500);
}

function signalerErreur(e) {
  if (e instanceof Annule || e?.name === 'AbortError') return;
  console.error(e);
  toast(e?.message || String(e), 'erreur');
}

const lancer = fn => Promise.resolve().then(fn).catch(signalerErreur);

// Fenêtre modale : renvoie { d, resultat } ; resultat se résout en { action, data } à la fermeture.
function ouvrirModale(titre, corps, actions, classe = '') {
  const d = document.createElement('dialog');
  d.className = 'modale ' + classe;
  d.innerHTML = `<form><h2>${esc(titre)}</h2><div class="modale-corps">${corps}</div><div class="modale-actions">${actions}</div></form>`;
  document.body.append(d);
  const form = $('form', d);
  // Une seule sortie, quel que soit le chemin (valider, Annuler, Échap, fermeture par le navigateur) :
  // on donne le résultat, on ferme ET on retire la fenêtre de la page (sans attendre l'évènement « close »,
  // qui n'arrive pas toujours tout de suite).
  let terminer;
  const resultat = new Promise(resolve => {
    let fini = false;
    terminer = res => {
      if (fini) return;
      fini = true;
      resolve(res);
      if (d.open) d.close();
      d.remove();
    };
  });
  const annuler = () => terminer({ action: 'annuler', data: {} });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(form);
    terminer({ action: e.submitter?.value || 'ok', data: Object.fromEntries(fd), fd });
  });
  d.addEventListener('cancel', e => { e.preventDefault(); annuler(); }); // touche Échap
  d.addEventListener('close', annuler);
  d.fermer = annuler; // pour fermer la fenêtre depuis le code (plutôt que d.close())
  d.querySelectorAll('[data-fermer]').forEach(b => b.addEventListener('click', annuler));
  // Entrée passe au champ suivant ; sur le dernier champ, elle valide la fenêtre.
  form.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || e.shiftKey || !e.target.matches('input, select') || e.target.type === 'checkbox') return;
    const champs = [...form.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=file]), select, textarea')]
      .filter(c => !c.disabled && c.offsetParent !== null);
    const i = champs.indexOf(e.target);
    if (i >= 0 && i < champs.length - 1) { e.preventDefault(); champs[i + 1].focus(); }
  });
  d.showModal();
  return { d, resultat };
}

const boutonsModale = (ok = 'Enregistrer', gauche = '') =>
  `${gauche}<span class="espace"></span><button type="button" data-fermer>Annuler</button><button value="ok" class="primaire">${ok}</button>`;
const BOUTON_SUPPRIMER = '<button value="supprimer" class="danger" formnovalidate>Supprimer</button>';

async function confirmer(message, ok = 'Supprimer') {
  const { resultat } = ouvrirModale('Confirmation', `<p>${esc(message)}</p>`,
    `<span class="espace"></span><button type="button" data-fermer>Annuler</button><button value="ok" class="danger">${ok}</button>`);
  return (await resultat).action === 'ok';
}

const aujourdhui = () => new Date().toLocaleDateString('sv'); // AAAA-MM-JJ
const dateCourte = d => (d ? new Date(d + 'T12:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '');
const heure = ts => new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
const dateHeure = ts => new Date(ts).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
const fmt = n => (n === null ? '–' : n.toLocaleString('fr-FR', { maximumFractionDigits: 2 }));
const nombre = v => (v !== '' && !isNaN(v) ? +v : null);
const affichage = v => (nombre(v) === null ? v : v.replace('.', ','));
const classeCode = v => (CODES[v] ? ' code-' + v : '');

/* ---------- Données dérivées ---------- */

// Ordre choisi par le prof (champ `ordre`, réglé par appui long + glisser), sinon alphabétique.
function classesTriees() {
  return Donnees.liste('classes').sort((a, b) => (a.ordre ?? Infinity) - (b.ordre ?? Infinity) || collator.compare(a.nom, b.nom));
}

function classeActive() {
  return Donnees.get('classes', ui.classeId) || classesTriees()[0] || null;
}

/* ---------- Dispenses ---------- */

const JOURS_ALERTE_DISPENSE = 7; // « expire bientôt » : fin dans 7 jours ou moins
const ecartJours = (de, a) => Math.round((new Date(a + 'T12:00') - new Date(de + 'T12:00')) / 86400000);

// Statut d'une dispense à la date du jour : avenir, encours, bientot ou finie.
function statutDispense(el) {
  if (!el.dispense) return null;
  const auj = aujourdhui();
  if (el.dispDebut && el.dispDebut > auj) {
    return { code: 'avenir', court: 'DISP dès ' + dateCourte(el.dispDebut), texte: `Dispense à partir du ${dateCourte(el.dispDebut)}` };
  }
  if (!el.dispFin) return { code: 'encours', court: 'DISP', texte: 'Dispense en cours (sans date de fin)' };
  if (el.dispFin < auj) return { code: 'finie', court: 'DISP finie', texte: `Dispense terminée depuis le ${dateCourte(el.dispFin)}` };
  const jours = ecartJours(auj, el.dispFin);
  if (jours <= JOURS_ALERTE_DISPENSE) {
    return {
      code: 'bientot', court: jours ? `DISP J-${jours}` : 'DISP dernier jour',
      texte: jours ? `Dispense : se termine dans ${jours} jour${jours > 1 ? 's' : ''} (${dateCourte(el.dispFin)})` : 'Dispense : dernier jour aujourd’hui',
    };
  }
  return { code: 'encours', court: 'DISP → ' + dateCourte(el.dispFin), texte: `Dispense en cours jusqu’au ${dateCourte(el.dispFin)}` };
}

// Dans la grille de notes : dispenses en cours, qui se terminent ou à venir (pas celles terminées).
function badgeDispenseGrille(el) {
  const s = statutDispense(el);
  return s && s.code !== 'finie' ? ` <span class="badge-disp ${s.code}">${esc(s.court)}</span>` : '';
}

// Dans la liste des élèves, les dates ne restent dépliées que tant que la fin n'est pas saisie
// (ou quand on clique sur le badge pour les modifier).
const dispensesEnEdition = new Set();
const datesDispenseOuvertes = el => !el.dispFin || dispensesEnEdition.has(el.id);

/* ---------- Pratique adaptée ---------- */

const amenagement = el => (el.dispense ? 'dispense' : el.adapte ? 'adapte' : '');
const resumeTexte = (t, n) => { t = t.replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };

async function editerAdaptation(id) {
  const el = Donnees.get('eleves', id);
  const { resultat } = ouvrirModale(`Pratique adaptée — ${el.nom} ${el.prenom}`, `
    <p class="aide">Note les particularités : ce que l’élève peut ou ne peut pas faire, les aménagements prévus…</p>
    <textarea name="adaptation" rows="6" autofocus
      placeholder="ex. Pas de saut ni de réception. Course limitée à 10 min. Peut arbitrer et chronométrer.">${esc(el.adaptation || '')}</textarea>`,
  boutonsModale('Enregistrer'));
  const r = await resultat;
  if (r.action !== 'ok') return;
  Donnees.ecrire('eleves', { ...Donnees.get('eleves', id), adaptation: r.data.adaptation.trim() });
  rendre();
}

function dispenseLe(el, date) {
  if (!el.dispense || !date) return false;
  return (!el.dispDebut || date >= el.dispDebut) && (!el.dispFin || date <= el.dispFin);
}

// PAI : case cochée sur la fiche ; pour les fiches plus anciennes, « PAI » écrit dans les remarques.
const aPai = el => el.pai ?? /\bPAI\b/i.test(el.remarque || '');

// Le badge « groupe » de la v0.15.0 est abandonné : on le retire des fiches élèves.
function migrerGroupes() {
  for (const el of Donnees.liste('eleves', e => 'groupe' in e)) {
    const { groupe, ...reste } = el;
    Donnees.ecrire('eleves', reste);
  }
}

/* ---------- PAI et BEP : étiquette + fiche d'informations ---------- */

const BESOINS = {
  pai: {
    sigle: 'PAI', nom: 'Projet d’accueil individualisé', actif: aPai, champInfo: 'paiInfo',
    aide: 'Pathologie, traitement, où se trouve le traitement (sac, infirmerie…), signes d’alerte, conduite à tenir, personnes à prévenir…',
  },
  bep: {
    sigle: 'BEP', nom: 'Besoin éducatif particulier', actif: el => !!el.bep, champInfo: 'bepInfo',
    aide: 'Type de besoin (dys, TDAH, PAP, PPS…), aménagements utiles en EPS, consignes, placement, tutorat…',
  },
};

function boutonBesoin(el, type) {
  const b = BESOINS[type], actif = b.actif(el), info = el[b.champInfo] || '';
  return `<button class="chip-besoin ${type}${actif ? ' actif' : ''}" data-editer-besoin="${type}" data-id="${el.id}"
    title="${esc(actif ? (info || 'Aucune information saisie') + ' — cliquer pour voir ou modifier' : 'Cliquer pour indiquer un ' + b.sigle)}"
    aria-pressed="${actif}">${b.sigle}${actif && info ? ' ✎' : ''}</button>`;
}

// Fiche à remplir : activer / désactiver, et noter les informations utiles.
async function editerBesoin(id, type) {
  const el = Donnees.get('eleves', id), b = BESOINS[type];
  const actif = b.actif(el);
  const { resultat } = ouvrirModale(`${b.sigle} — ${el.nom} ${el.prenom}`, `
    <label class="case interrupteur"><input type="checkbox" name="actif" ${actif || !el[b.champInfo] ? 'checked' : ''}>
      <span class="badge-${type}">${b.sigle}</span> ${b.nom}</label>
    <label>Informations<textarea name="info" rows="7" autofocus placeholder="${esc(b.aide)}">${esc(el[b.champInfo] || '')}</textarea></label>`,
  boutonsModale('Enregistrer'));
  const r = await resultat;
  if (r.action !== 'ok') return;
  Donnees.ecrire('eleves', { ...Donnees.get('eleves', id), [type]: r.data.actif === 'on', [b.champInfo]: r.data.info.trim() });
  rendre();
}

// Lecture rapide depuis la grille (ex. en cours, en cas de besoin) : texte en grand, bouton pour modifier.
async function voirBesoin(id, type) {
  const el = Donnees.get('eleves', id), b = BESOINS[type];
  const info = el[b.champInfo];
  const { resultat } = ouvrirModale(`${b.sigle} — ${el.nom} ${el.prenom}`, `
    <p class="aide">${b.nom}</p>
    <div class="lecture-besoin ${type}">${info ? esc(info) : '<span class="aide">Aucune information saisie.</span>'}</div>`,
  `<button value="modifier">Modifier</button><span class="espace"></span><button type="button" data-fermer class="primaire">Fermer</button>`);
  if ((await resultat).action === 'modifier') await editerBesoin(id, type);
}

// Ordre des élèves : alphabétique (par défaut) ou personnalisé par le prof (champ `ordre`, réglé avec ▲ ▼).
const elevesDe = classeId => {
  const liste = Donnees.liste('eleves', e => e.classeId === classeId);
  if (Donnees.get('classes', classeId)?.tri !== 'perso') return liste.sort(triEleves);
  return liste.sort((a, b) => (a.ordre ?? Infinity) - (b.ordre ?? Infinity) || triEleves(a, b));
};

// Renumérote 0, 1, 2… dans l'ordre donné (n'écrit que les élèves dont la place change).
function numeroter(eleves) {
  eleves.forEach((el, k) => { if (el.ordre !== k) Donnees.ecrire('eleves', { ...el, ordre: k }); });
}

function changerTri(classeId, tri) {
  const c = Donnees.get('classes', classeId);
  if (tri === 'perso') {
    // On part de l'ordre personnalisé déjà connu, sinon de l'ordre alphabétique.
    Donnees.ecrire('classes', { ...c, tri: 'perso' });
    numeroter(elevesDe(classeId));
  } else {
    Donnees.ecrire('classes', { ...c, tri: 'alpha' }); // l'ordre perso est gardé si on y revient
  }
  rendre();
}

function deplacerEleve(id, delta) {
  const el = Donnees.get('eleves', id);
  const liste = elevesDe(el.classeId);
  const i = liste.findIndex(e => e.id === id), j = i + delta;
  if (j < 0 || j >= liste.length) return;
  [liste[i], liste[j]] = [liste[j], liste[i]];
  numeroter(liste);
  rendreVue();
  // On garde le focus sur la même flèche pour pouvoir enchaîner les déplacements.
  $(`[data-${delta < 0 ? 'monter' : 'descendre'}="${id}"]`)?.focus();
}

// Place en fin de liste pour un élève ajouté (ordre personnalisé).
const prochainOrdre = classeId =>
  Donnees.liste('eleves', e => e.classeId === classeId).reduce((m, e) => Math.max(m, e.ordre ?? -1), -1) + 1;
const evalsDe = classeId => Donnees.liste('evals', e => e.classeId === classeId)
  .sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.cree - b.cree);

/* ---------- Périodes de l'année (trimestres / semestres) ----------
   Réglage commun à toutes les classes, enregistré dans le carnet (il suit donc sur la clé).
   Seules les dates de fin sont retenues, en « MM-JJ » : le réglage resservira l'année suivante.
   Une évaluation appartient à une période d'après sa date. */

const PERIODES_DEFAUT = { type: 'trimestres', trimestres: ['11-30', '02-28'], semestres: ['01-31'] };
const reglagePeriodes = () => ({ ...PERIODES_DEFAUT, ...Donnees.get('reglages', 'periodes') });

// Place d'un jour dans l'année scolaire (août = début) ; le 29 février compte comme le 28.
const rangAnnee = md => {
  const [m, j] = md.split('-').map(Number);
  return ((m + 4) % 12) * 100 + (m === 2 && j === 29 ? 28 : j);
};

const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const jourMois = md => { const [m, j] = md.split('-').map(Number); return `${j === 1 ? '1er' : j} ${MOIS_COURTS[m - 1]}`; };
const lendemain = md => { const d = new Date(`2001-${md}T12:00`); d.setDate(d.getDate() + 1); return d.toLocaleDateString('sv').slice(5); };

// [{ id: 'P1', code: 'T1', fin: '11-30', texte: 'rentrée → 30 nov.' }, …] ; la dernière va jusqu'à la fin de l'année.
function periodesAnnee() {
  const r = reglagePeriodes();
  const fins = r[r.type] || PERIODES_DEFAUT[r.type];
  const lettre = r.type === 'semestres' ? 'S' : 'T';
  return [...fins, null].map((fin, k) => ({
    id: 'P' + (k + 1), code: lettre + (k + 1), fin,
    texte: `${k ? jourMois(lendemain(fins[k - 1])) : 'rentrée'} → ${fin ? jourMois(fin) : 'fin d’année'}`,
  }));
}

function periodeDe(date) {
  if (!date) return null;
  const rang = rangAnnee(date.slice(5));
  return periodesAnnee().find(p => !p.fin || rang <= rangAnnee(p.fin)).id;
}

// Période affichée dans l'onglet Notes : 'annee' ou 'P1', 'P2'… (retour à l'année si la période n'existe plus).
const periodeAffichee = () => (periodesAnnee().some(p => p.id === ui.periode) ? ui.periode : 'annee');

async function editerPeriodes() {
  const r = reglagePeriodes();
  // Les dates sont montrées dans l'année scolaire en cours.
  const auj = aujourdhui(), debut = +auj.slice(0, 4) - (+auj.slice(5, 7) < 8 ? 1 : 0);
  const versDate = md => `${+md.slice(0, 2) >= 8 ? debut : debut + 1}-${md}`.replace(/-02-29$/, '-02-28');
  const champ = (type, k) => `<label>Fin du ${type === 'semestres' ? 'S' : 'T'}${k + 1}
    <input type="date" name="${type}-${k}" required value="${versDate(r[type][k])}"></label>`;
  const { d, resultat } = ouvrirModale('Périodes de l’année', `
    <p class="aide">Les évaluations sont rangées dans une période d’après leur date. Réglage commun à toutes les classes.</p>
    <label>Découpage<select name="type">
      <option value="trimestres" ${r.type === 'trimestres' ? 'selected' : ''}>Trimestres</option>
      <option value="semestres" ${r.type === 'semestres' ? 'selected' : ''}>Semestres</option>
    </select></label>
    <div class="ligne" data-type="trimestres">${champ('trimestres', 0)}${champ('trimestres', 1)}
      <span class="aide">le T3 va jusqu’à la fin de l’année</span></div>
    <div class="ligne" data-type="semestres">${champ('semestres', 0)}
      <span class="aide">le S2 va jusqu’à la fin de l’année</span></div>
    <p class="aide">Les dates sont gardées d’une année sur l’autre : il suffit de les ajuster à la rentrée.</p>`,
  boutonsModale('Enregistrer'));
  const selType = $('[name="type"]', d);
  // Seules les dates du découpage choisi sont visibles (et obligatoires).
  const majType = () => d.querySelectorAll('[data-type]').forEach(z => {
    z.hidden = z.dataset.type !== selType.value;
    z.querySelectorAll('input').forEach(i => { i.disabled = z.hidden; });
  });
  selType.addEventListener('change', majType);
  majType();
  const res = await resultat;
  if (res.action !== 'ok') return;
  const type = res.data.type;
  const fins = Object.keys(res.data).filter(k => k.startsWith(type + '-')).map(k => res.data[k].slice(5))
    .sort((a, b) => rangAnnee(a) - rangAnnee(b));
  if (new Set(fins).size < fins.length) return toast('Deux périodes ne peuvent pas finir le même jour.', 'erreur');
  Donnees.ecrire('reglages', { ...Donnees.get('reglages', 'periodes'), id: 'periodes', type, [type]: fins });
  rendre();
}

// Ancien code « NN » (non noté) → « NE ».
function migrerCodes() {
  for (const n of Donnees.liste('notes', n => n.valeur === 'NN')) Donnees.ecrireNote(n.evalId, n.eleveId, 'NE');
}

// Moyenne sur 20, pondérée par les coefficients ; ABS / DISP / NE ne comptent pas.
function moyenneEleve(eleveId, evals) {
  let somme = 0, poids = 0;
  for (const e of evals) {
    const n = nombre(Donnees.note(e.id, eleveId));
    if (n === null || !e.coef) continue;
    somme += (n / e.max) * 20 * e.coef;
    poids += e.coef;
  }
  return poids ? somme / poids : null;
}

function moyenneEval(e, eleves) {
  const notes = eleves.map(el => nombre(Donnees.note(e.id, el.id))).filter(n => n !== null);
  return notes.length ? notes.reduce((a, b) => a + b, 0) / notes.length : null;
}

/* ---------- Rendu ---------- */

function rendre() {
  rendreClasses();
  document.querySelectorAll('#onglets [data-vue]').forEach(b => b.classList.toggle('actif', b.dataset.vue === ui.vue));
  // La barre de codes rapides s'adapte à l'onglet. (Attention : surtout pas « data-vue » sur <body>,
  // sinon chaque clic dans la page serait pris pour un clic sur un onglet.)
  document.body.dataset.onglet = ui.vue;
  rendreVue();
  majPastille();
}

function rendreClasses() {
  const active = classeActive();
  const classes = classesTriees();
  $('#liste-classes').innerHTML = classes.map(c => `
    <li class="${c.id === active?.id ? 'active' : ''}" data-id="${c.id}">
      <button class="classe" data-classe="${c.id}" title="Appui long pour changer l’ordre des classes">
        <span class="classe-nom">${esc(c.nom)}</span>
        <span class="classe-info">${esc(c.niveau || '')}${c.niveau ? ' · ' : ''}${elevesDe(c.id).length} élèves</span>
      </button>
      ${c.id === active?.id ? `<button class="modif" data-modif-classe="${c.id}" title="Modifier la classe" aria-label="Modifier la classe">✎</button>` : ''}
    </li>`).join('') || '<li class="aide">Aucune classe</li>';
  $('#astuce-classes').hidden = classes.length < 2;
}

/* ---------- Ordre des classes : appui long, puis glisser ----------
   Un appui bref ouvre la classe ; un glissement rapide fait défiler la liste ;
   un appui long « décolle » la classe, qu'on fait alors glisser à sa nouvelle place. */

const APPUI_LONG = 450; // ms
let glisse = null; // { li, pointeur, x0, y0, minuteur, actif }
let finGlisse = 0;  // pour ignorer le « clic » qui suit le lâcher

function annulerGlisse(remettre = false) {
  if (!glisse) return;
  clearTimeout(glisse.minuteur);
  glisse.li.classList.remove('en-deplacement');
  $('#liste-classes').classList.remove('tri-en-cours');
  glisse = null;
  if (remettre) rendreClasses();
}

$('#liste-classes').addEventListener('pointerdown', e => {
  const li = e.target.closest('li[data-id]');
  if (!li || e.button > 0 || e.target.closest('.modif')) return;
  annulerGlisse();
  glisse = { li, pointeur: e.pointerId, x0: e.clientX, y0: e.clientY, actif: false };
  glisse.minuteur = setTimeout(() => {
    glisse.actif = true;
    li.classList.add('en-deplacement');
    $('#liste-classes').classList.add('tri-en-cours');
    try { li.setPointerCapture(glisse.pointeur); } catch { /* rien à faire */ }
    navigator.vibrate?.(30); // petit retour sur tablette Android
  }, APPUI_LONG);
});

$('#liste-classes').addEventListener('pointermove', e => {
  if (!glisse || e.pointerId !== glisse.pointeur) return;
  if (!glisse.actif) {
    // Le doigt bouge avant la fin de l'appui long : c'est un défilement, pas un déplacement.
    if (Math.hypot(e.clientX - glisse.x0, e.clientY - glisse.y0) > 10) annulerGlisse();
    return;
  }
  // La classe prend la place de celle qui est sous le doigt.
  const liste = $('#liste-classes'), li = glisse.li;
  const autres = [...liste.querySelectorAll('li[data-id]')].filter(x => x !== li);
  const avant = autres.find(x => { const r = x.getBoundingClientRect(); return e.clientY < r.top + r.height / 2; });
  if (avant) { if (li.nextElementSibling !== avant) liste.insertBefore(li, avant); }
  else if (liste.lastElementChild !== li) liste.append(li);
});

$('#liste-classes').addEventListener('pointerup', e => {
  if (!glisse || e.pointerId !== glisse.pointeur) return;
  if (!glisse.actif) return annulerGlisse();
  finGlisse = Date.now();
  // Nouvel ordre = ordre à l'écran ; on n'écrit que les classes dont la place change.
  [...$('#liste-classes').querySelectorAll('li[data-id]')].forEach((x, k) => {
    const c = Donnees.get('classes', x.dataset.id);
    if (c && c.ordre !== k) Donnees.ecrire('classes', { ...c, ordre: k });
  });
  annulerGlisse(true);
});

$('#liste-classes').addEventListener('pointercancel', () => annulerGlisse(true));
// Pendant le déplacement, le doigt ne doit pas faire défiler la liste.
$('#liste-classes').addEventListener('touchmove', e => { if (glisse?.actif) e.preventDefault(); }, { passive: false });
// Pas de menu « copier / sélectionner » sur l'appui long.
$('#liste-classes').addEventListener('contextmenu', e => { if (e.target.closest('li[data-id]')) e.preventDefault(); });
// Le lâcher n'ouvre pas la classe.
$('#liste-classes').addEventListener('click', e => {
  if (Date.now() - finGlisse < 400) { e.stopPropagation(); e.preventDefault(); }
}, true);

function rendreVue() {
  planifierAscenseur(); // recalculé une fois la vue dessinée
  const v = $('#vue');
  const c = classeActive();
  if (!c) {
    v.innerHTML = `
      <div class="vide">
        <h2>Bienvenue dans ton carnet EPS</h2>
        <p>Commence par créer ta première classe.</p>
        <button class="primaire" data-action="ajout-classe">+ Nouvelle classe</button>
        <p class="aide">Tu as déjà un carnet sur ta clé USB ? <button class="lien" data-action="cle">Récupère-le ici</button>.
          · <button class="lien" data-action="guide">Comment ça marche ?</button></p>
      </div>`;
    return;
  }
  v.innerHTML = ui.vue === 'eleves' ? htmlEleves(c) : ui.vue === 'entrainement' ? htmlEntrainement(c) : htmlNotes(c);
  if (ui.vue === 'notes') { majMoyennes(); majBilans(); caleEntete(); }
  if (ui.vue === 'entrainement') { majStatsEnt(); caleEntete(); }
}

// Cellule « élève » des grilles (notes et entraînement) : numéro, nom, badges PAI / BEP / dispense / adapté.
function celluleNom(el, i) {
  const infos = [
    aPai(el) ? 'PAI' + (el.paiInfo ? ' : ' + el.paiInfo : '') : '',
    el.bep ? 'BEP' + (el.bepInfo ? ' : ' + el.bepInfo : '') : '',
    el.remarque, statutDispense(el)?.texte,
    el.adapte ? 'Pratique adaptée : ' + (el.adaptation || '(particularités non précisées)') : '',
  ].filter(Boolean).join('\n');
  return `<th class="col-nom" title="${esc(infos)}"><span class="num-eleve">${i + 1}</span><span class="nom-eleve">${esc(el.nom)} ${esc(el.prenom)}</span>`
    + (aPai(el) ? ` <button class="badge-pai" data-voir-besoin="pai" data-id="${el.id}" title="Voir le PAI">PAI</button>` : '')
    + (el.bep ? ` <button class="badge-bep" data-voir-besoin="bep" data-id="${el.id}" title="Voir le BEP">BEP</button>` : '')
    + badgeDispenseGrille(el)
    + (el.adapte ? ' <span class="badge-adapte-grille">ADAPTÉ</span>' : '')
    + '</th>';
}

// Colonnes de moyenne de la grille : une par période + l'année (vue « Année »), ou celle de la période affichée.
function colonnesMoyenne() {
  const vue = periodeAffichee(), periodes = periodesAnnee();
  if (vue !== 'annee') {
    const p = periodes.find(x => x.id === vue);
    return [{ id: p.id, titre: 'Moyenne ' + p.code, info: '/20' }];
  }
  return [...periodes.map(p => ({ id: p.id, titre: p.code, info: p.texte })), { id: 'annee', titre: 'Année', info: '/20' }];
}

const classeAnnee = m => (m.id === 'annee' ? ' moy-annee' : '');
const evalsDeColonne =(evals, colId) => (colId === 'annee' ? evals : evals.filter(e => periodeDe(e.date) === colId));

function htmlNotes(c) {
  const eleves = elevesDe(c.id);
  const vue = periodeAffichee(), periodes = periodesAnnee();
  const toutes = evalsDe(c.id);
  const evals = evalsDeColonne(toutes, vue);
  const colsMoy = colonnesMoyenne();
  if (!eleves.length) {
    return `<div class="vide"><h2>${esc(c.nom)}</h2><p>Pas encore d’élèves dans cette classe.</p>
      <button class="primaire" data-action="vue-eleves">Ajouter des élèves</button></div>`;
  }
  return `
    <div class="outils">
      <h2>${esc(c.nom)}</h2>
      <button class="primaire" data-action="ajout-eval">+ Évaluation</button>
      <label class="choix-tri">Période
        <select data-periode>
          <option value="annee">Toute l’année</option>
          ${periodes.map(p => `<option value="${p.id}" ${p.id === vue ? 'selected' : ''}>${p.code} (${esc(p.texte)})</option>`).join('')}
        </select></label>
      <button class="icone-petit" data-action="periodes" title="Régler les trimestres / semestres" aria-label="Régler les périodes">⚙</button>
      <button data-modif-classe="${c.id}" title="Régler la correspondance note → degré de maîtrise pour cette classe">⚙ Note → degré
        <span class="aide">(${seuilsClasse(c).map(fmt).join(' / ')})</span></button>
      <span class="aide aide-saisie">Saisie : note, ou <b>A</b> absent · <b>D</b> dispensé · <b>NE</b> non noté — Entrée = élève suivant</span>
    </div>
    ${evals.length ? '' : toutes.length
    ? `<p class="aide">Aucune évaluation sur le ${periodes.find(p => p.id === vue).code} — ${toutes.length} sur le reste de l’année (choisis « Toute l’année » pour les voir).</p>`
    : '<p class="aide">Crée une évaluation pour commencer à noter.</p>'}
    ${evals.some(e => competencesEval(e).length) ? `
      <div class="legende-niveaux"><span class="legende-titre">Degrés de maîtrise (toucher une case pour changer, ou taper 1 à 4) :</span>
        ${NIVEAUX_MAITRISE.map(n => `<span class="legende-item" title="${n.nom}"><span class="niveau n${n.v}">${n.v}</span> <span class="legende-nom">${n.nom}</span></span>`).join(' ')}
        <span class="legende-item" title="Degré proposé d’après la note : touche-le pour le changer"><span class="niveau n3 auto">3</span> <span class="legende-nom">pré-rempli d’après la note</span></span></div>` : ''}
    <div class="grille-scroll">
      <table class="grille">
        <thead><tr>
          <th class="col-nom" rowspan="2">Élève</th>
          ${evals.map(e => {
            const comp = resumeCompetences(e);
            const nb = competencesEval(e).length;
            return `
            <th class="col-eval${classeCa(e)}" data-eval-entete="${e.id}" ${nb ? `colspan="${nb + 1}"` : 'rowspan="2"'}
              title="${esc(comp.detail ? comp.detail + '\n\n(cliquer pour modifier)' : 'Modifier l’évaluation')}">
              ${e.ca ? `<span class="chip-ca">${e.ca}</span>` : ''}
              <div class="eval-titre">${esc(e.titre)}</div>
              <div class="eval-info">${esc(e.apsa || '')}</div>
              <div class="eval-info">${dateCourte(e.date)} · /${fmt(e.max)}${e.coef !== 1 ? ' · coef ' + fmt(e.coef) : ''}</div>
            </th>`;
          }).join('')}
          ${colsMoy.map(m => `<th class="col-moy${classeAnnee(m)}" rowspan="2">${m.titre}<div class="eval-info">${esc(m.info)}</div></th>`).join('')}
        </tr>
        <tr class="entete-comp">
          ${evals.filter(e => competencesEval(e).length).map(e => `
            <th class="sous-note${classeCa(e)}">Note</th>
            ${competencesEval(e).map(a => `<th class="sous-comp${classeCa(e)}" title="${esc(a.code + ' : ' + a.texte)}">${esc(a.code)}</th>`).join('')}`).join('')}
        </tr></thead>
        <tbody>
          ${eleves.map((el, i) => {
            let col = 0;
            return `<tr>
            ${celluleNom(el, i)}
            ${evals.map(e => {
              const v = Donnees.note(e.id, el.id);
              const nomEleve = el.nom + ' ' + el.prenom;
              // Case vide un jour où l'élève était dispensé : on le suggère discrètement.
              const suggestion = !v && dispenseLe(el, e.date) ? ' placeholder="disp."' : '';
              return `<td class="debut-eval${classeCa(e)}"><input class="cellule${classeCode(v)}"${suggestion} value="${esc(affichage(v))}" data-eval="${e.id}" data-eleve="${el.id}"
                data-ligne="${i}" data-col="${col++}" inputmode="decimal" autocomplete="off" enterkeyhint="next" aria-label="${esc(nomEleve + ' — ' + e.titre)}"></td>
                ${competencesEval(e).map(a => {
                  const n = Donnees.note(e.id, el.id, a.id);
                  const auto = n && Donnees.noteComplete(e.id, el.id, a.id)?.auto;
                  return `<td class="td-niveau"><button class="niveau${n ? ' n' + n : ''}${auto ? ' auto' : ''}" data-niveau data-eval="${e.id}" data-eleve="${el.id}" data-attendu="${esc(a.id)}"
                    data-ligne="${i}" data-col="${col++}" title="${esc(a.code + (n ? ' — ' + nomNiveau(n) + (auto ? ' (pré-rempli d’après la note)' : '') : ' — non évalué'))}"
                    aria-label="${esc(nomEleve + ' — ' + a.code + ' — ' + (n ? nomNiveau(n) : 'non évalué'))}">${n}</button></td>`;
                }).join('')}`;
            }).join('')}
            ${colsMoy.map(m => `<td class="col-moy${classeAnnee(m)}" data-moy-eleve="${el.id}" data-moy-col="${m.id}"></td>`).join('')}
          </tr>`;
          }).join('')}
          ${evals.some(e => competencesEval(e).length) ? `
          <tr class="ligne-repartition">
            <th class="col-nom">Répartition</th>
            ${evals.map(e => `<td></td>
              ${competencesEval(e).map(a => `<td class="bilan-comp" data-bilan="${e.id}|${esc(a.id)}"></td>`).join('')}`).join('')}
            ${colsMoy.map(m => `<td class="col-moy${classeAnnee(m)}"></td>`).join('')}
          </tr>` : ''}
        </tbody>
        <tfoot><tr>
          <th class="col-nom">Moyenne de la classe</th>
          ${evals.map(e => `<td data-moy-eval="${e.id}"></td>
            ${competencesEval(e).map(a => `<td class="bilan-mini" data-bilan-barre="${e.id}|${esc(a.id)}"></td>`).join('')}`).join('')}
          ${colsMoy.map(m => `<td class="col-moy${classeAnnee(m)}" data-moy-classe="${m.id}"></td>`).join('')}
        </tr></tfoot>
      </table>
    </div>`;
}

// Couleur du champ d'apprentissage (CA1 rouge, CA2 vert, CA3 violet, CA4 bleu, CA5 orange).
const classeCa = e => (e.ca ? ' ca-' + e.ca : '');

/* ---------- Degrés de maîtrise des compétences ---------- */

const NIVEAUX_MAITRISE = [
  { v: '1', nom: 'Maîtrise insuffisante' },
  { v: '2', nom: 'Maîtrise fragile' },
  { v: '3', nom: 'Maîtrise satisfaisante' },
  { v: '4', nom: 'Très bonne maîtrise' },
];
const nomNiveau = v => NIVEAUX_MAITRISE.find(n => n.v === v)?.nom || '';

// Compétences d'une évaluation : attendus cochés + compétences libres (une par ligne).
function competencesEval(e) {
  const officielles = (e.competences || []).map(REFERENTIEL.attendu).filter(Boolean);
  const libres = (e.competencesLibres || '').split('\n').map(s => s.trim()).filter(Boolean)
    .map((t, i) => ({ id: 'libre:' + t, code: '+' + (i + 1), texte: t }));
  return [...officielles, ...libres];
}

// Changement à la main : le degré devient « choisi par le prof » (la note ne l'écrasera plus).
function changerNiveau(bouton, valeur) {
  const { eval: evalId, eleve, attendu } = bouton.dataset;
  const avant = Donnees.note(evalId, eleve, attendu);
  if (valeur === undefined) valeur = avant === '4' ? '' : String(+avant + 1); // vide → 1 → 2 → 3 → 4 → vide
  if (valeur !== avant || Donnees.noteComplete(evalId, eleve, attendu)?.auto) Donnees.ecrireNote(evalId, eleve, valeur, attendu);
  afficherNiveau(bouton, valeur, false);
  majBilans();
}

function afficherNiveau(bouton, valeur, auto) {
  bouton.className = 'niveau' + (valeur ? ' n' + valeur : '') + (valeur && auto ? ' auto' : '');
  bouton.textContent = valeur;
  const code = bouton.title.split(' — ')[0];
  bouton.title = code + ' — ' + (valeur ? nomNiveau(valeur) + (auto ? ' (pré-rempli d’après la note)' : '') : 'non évalué');
}

/* ---------- Pré-remplissage des degrés d'après la note ---------- */

const SEUILS_DEFAUT = [10, 14, 18]; // sur 20 : degré 2 dès 10, degré 3 dès 14 (= 7/10), degré 4 dès 18
const ANCIENS_SEUILS_DEFAUT = '10,15,18'; // défaut de la v0.10.0, remplacé automatiquement

// Les évaluations restées sur l'ancien défaut passent au nouveau, et leurs degrés pré-remplis sont recalculés.
// Seuils de la classe (réglés dans la fiche de la classe), sinon ceux par défaut.
const seuilsClasse = c => c?.seuils || SEUILS_DEFAUT;
const memesSeuils = (a, b) => String(a) === String(b);

function migrerSeuils() {
  // Évaluations restées sur les seuils par défaut : elles suivent désormais ceux de leur classe.
  for (const e of Donnees.liste('evals', ev => ev.seuils && memesSeuils(ev.seuils, SEUILS_DEFAUT))) {
    const { seuils, ...reste } = e;
    Donnees.ecrire('evals', reste);
  }
  if (String(ui.seuils) === ANCIENS_SEUILS_DEFAUT) { ui.seuils = SEUILS_DEFAUT; memoriserUi(); }
  for (const e of Donnees.liste('evals', ev => String(ev.seuils) === ANCIENS_SEUILS_DEFAUT)) {
    const maj = Donnees.ecrire('evals', { ...e, seuils: SEUILS_DEFAUT });
    for (const el of elevesDe(e.classeId)) preremplirDegres(maj, el.id);
  }
}

// Seuils exprimés dans le barème de l'évaluation (ex. sur 10 : 5 / 7 / 9).
const seuilsDansBareme = (seuils, max) =>
  max && max !== 20 ? `soit ${seuils.map(s => fmt((s * max) / 20)).join(' / ')} sur ${fmt(max)}` : '';

function degreDepuisNote(e, valeur) {
  const n = nombre(valeur);
  if (n === null) return ''; // pas de note (ou ABS / DISP / NE) : pas de degré
  const sur20 = (n / e.max) * 20;
  const [s2, s3, s4] = e.seuils || seuilsClasse(Donnees.get('classes', e.classeId));
  return sur20 >= s4 ? '4' : sur20 >= s3 ? '3' : sur20 >= s2 ? '2' : '1';
}

// Remplit les degrés vides (ou déjà pré-remplis) ; ne touche jamais un degré choisi à la main.
function preremplirDegres(e, eleveId) {
  if (e.preremplir === false) return;
  const degre = degreDepuisNote(e, Donnees.note(e.id, eleveId));
  for (const a of competencesEval(e)) {
    const n = Donnees.noteComplete(e.id, eleveId, a.id);
    if (n?.valeur && !n.auto) continue;
    if ((n?.valeur || '') === degre) continue;
    Donnees.ecrireNote(e.id, eleveId, degre, a.id, degre ? { auto: true } : {});
    const bouton = $(`[data-niveau][data-eval="${e.id}"][data-eleve="${eleveId}"][data-attendu="${CSS.escape(a.id)}"]`);
    if (bouton) afficherNiveau(bouton, degre, true);
  }
}

// Pied de colonne : répartition des élèves évalués par degré (barre de couleur + pourcentages).
function majBilans() {
  const c = classeActive();
  if (!c) return;
  const eleves = elevesDe(c.id);
  document.querySelectorAll('[data-bilan]').forEach(td => {
    const sep = td.dataset.bilan.indexOf('|');
    const evalId = td.dataset.bilan.slice(0, sep), attendu = td.dataset.bilan.slice(sep + 1);
    const niveaux = eleves.map(el => Donnees.note(evalId, el.id, attendu)).filter(Boolean);
    td.replaceChildren();
    if (!niveaux.length) { td.textContent = '–'; td.title = ''; return; }
    const total = niveaux.length;
    const barre = document.createElement('div');
    barre.className = 'barre-rep';
    const lignes = document.createElement('div');
    lignes.className = 'lignes-rep';
    const detail = [];
    for (const { v, nom } of NIVEAUX_MAITRISE) {
      const nb = niveaux.filter(n => n === v).length;
      const pct = Math.round((nb / total) * 100);
      if (nb) {
        const part = document.createElement('span');
        part.className = 'n' + v;
        part.style.width = (nb / total) * 100 + '%'; // style posé par script : autorisé par le verrou de sécurité
        barre.append(part);
      }
      const ligne = document.createElement('div');
      ligne.className = 'ligne-rep' + (nb ? '' : ' rep-zero'); // (pas « vide » : classe déjà prise par les écrans d'accueil)
      ligne.innerHTML = `<span class="pastille-rep n${v}">${v}</span>${pct}%`;
      lignes.append(ligne);
      detail.push(`${v} – ${nom} : ${nb} élève${nb > 1 ? 's' : ''} (${pct} %)`);
    }
    td.append(barre, lignes);
    td.title = `${detail.join('\n')}\nSur ${total} élève${total > 1 ? 's' : ''} évalué${total > 1 ? 's' : ''}`;
    // Ligne « Moyenne de la classe » (collée en bas) : seulement la barre, pour ne pas cacher la grille.
    const mini = document.querySelector(`[data-bilan-barre="${CSS.escape(td.dataset.bilan)}"]`);
    if (mini) { mini.replaceChildren(barre.cloneNode(true)); mini.title = td.title; }
  });
  // Colonnes encore sans degré : barre vide
  document.querySelectorAll('[data-bilan-barre]').forEach(mini => {
    if (!document.querySelector(`[data-bilan="${CSS.escape(mini.dataset.bilanBarre)}"] .barre-rep`)) { mini.replaceChildren(); mini.title = ''; }
  });
}

// La 2e ligne d'en-tête (codes des compétences) reste collée sous la 1re lors du défilement.
function caleEntete() {
  const ligne1 = $('.grille thead tr');
  if (ligne1) $('.grille').style.setProperty('--haut-entete', ligne1.getBoundingClientRect().height + 'px');
}

function majMoyennes() {
  const c = classeActive();
  if (!c) return;
  const eleves = elevesDe(c.id), evals = evalsDe(c.id);
  for (const col of colonnesMoyenne()) {
    const evalsCol = evalsDeColonne(evals, col.id), moyennes = [];
    for (const el of eleves) {
      const m = moyenneEleve(el.id, evalsCol);
      if (m !== null) moyennes.push(m);
      const td = $(`[data-moy-eleve="${el.id}"][data-moy-col="${col.id}"]`);
      if (td) td.textContent = fmt(m);
    }
    const tdClasse = $(`[data-moy-classe="${col.id}"]`);
    if (tdClasse) tdClasse.textContent = fmt(moyennes.length ? moyennes.reduce((a, b) => a + b, 0) / moyennes.length : null);
  }
  for (const e of evals) {
    const td = $(`[data-moy-eval="${e.id}"]`);
    if (td) td.textContent = fmt(moyenneEval(e, eleves));
  }
}

function htmlEleves(c) {
  const eleves = elevesDe(c.id);
  const optionsSexe = s => [['', '—'], ['F', 'F'], ['G', 'G']]
    .map(([v, l]) => `<option value="${v}" ${s === v ? 'selected' : ''}>${l}</option>`).join('');
  const enCours = eleves.filter(el => ['encours', 'bientot'].includes(statutDispense(el)?.code)).length;
  const adaptes = eleves.filter(el => el.adapte).length;
  const optionsAmenagement = el => [['', '—'], ['dispense', 'Dispensé'], ['adapte', 'Adapté']]
    .map(([v, l]) => `<option value="${v}" ${amenagement(el) === v ? 'selected' : ''}>${l}</option>`).join('');
  return `
    <div class="outils">
      <h2>${esc(c.nom)}</h2>
      <button class="primaire" data-action="ajout-eleve">+ Élève</button>
      <button data-action="coller-liste">Coller une liste</button>
      <label class="choix-tri">Ordre
        <select data-tri-classe="${c.id}">
          <option value="alpha" ${c.tri !== 'perso' ? 'selected' : ''}>Alphabétique</option>
          <option value="perso" ${c.tri === 'perso' ? 'selected' : ''}>Personnalisé</option>
        </select></label>
      <span class="aide">${eleves.length} élève${eleves.length > 1 ? 's' : ''}${enCours ? ` · ${enCours} dispense${enCours > 1 ? 's' : ''} en cours` : ''}${adaptes ? ` · ${adaptes} adapté${adaptes > 1 ? 's' : ''}` : ''}</span>
    </div>
    ${eleves.length ? `
      <div class="carte"><table class="tableau-eleves">
        <thead><tr><th class="c-num">N°</th><th>Nom</th><th>Prénom</th><th>Sexe</th><th>PAI</th><th title="Besoin éducatif particulier">BEP</th><th>Dispense / adapté</th><th>Remarques (santé, inaptitude…)</th><th></th></tr></thead>
        <tbody>${eleves.map((el, i) => {
          const s = statutDispense(el);
          return `
          <tr data-eleve="${el.id}">
            <td class="c-num" title="Élève n°${i + 1} sur ${eleves.length}">${i + 1}${c.tri === 'perso' ? `
              <span class="deplacer">
                <button data-monter="${el.id}" ${i === 0 ? 'disabled' : ''} title="Monter" aria-label="Monter ${esc(el.nom)}">▲</button>
                <button data-descendre="${el.id}" ${i === eleves.length - 1 ? 'disabled' : ''} title="Descendre" aria-label="Descendre ${esc(el.nom)}">▼</button>
              </span>` : ''}</td>
            <td class="c-nom" data-label="Nom"><input data-champ="nom" class="majuscules" value="${esc(el.nom)}" aria-label="Nom" autocapitalize="characters"></td>
            <td class="c-prenom" data-label="Prénom"><input data-champ="prenom" value="${esc(el.prenom)}" aria-label="Prénom"></td>
            <td class="c-sexe" data-label="Sexe"><select data-champ="sexe" aria-label="Sexe">${optionsSexe(el.sexe || '')}</select></td>
            <td class="case-pai" data-label="PAI">${boutonBesoin(el, 'pai')}</td>
            <td class="case-bep" data-label="BEP">${boutonBesoin(el, 'bep')}</td>
            <td class="case-disp" data-label="Dispense / adapté">
              <div class="ligne-disp">
                <select data-champ="amenagement" class="choix-amenagement ${amenagement(el)}" aria-label="Dispense ou pratique adaptée">${optionsAmenagement(el)}</select>
                ${el.adapte ? `
                  <button class="badge-adapte${el.adaptation ? '' : ' sans-detail'}" data-editer-adaptation="${el.id}"
                    title="${esc(el.adaptation || 'Aucune particularité saisie')} — cliquer pour voir ou modifier">${el.adaptation ? '✎ Détails' : '+ Détails'}</button>` : ''}
                ${el.dispense && !datesDispenseOuvertes(el) ? `
                  <button class="badge-disp ${s.code}" data-editer-dispense="${el.id}"
                    title="Du ${esc(el.dispDebut ? dateCourte(el.dispDebut) : '?')} au ${esc(dateCourte(el.dispFin))} — cliquer pour modifier les dates">${esc(s.texte)} ✎</button>` : ''}
              </div>
              ${el.dispense && datesDispenseOuvertes(el) ? `
                <div class="dates-disp">
                  <label>du <input type="date" data-champ="dispDebut" value="${esc(el.dispDebut || '')}" aria-label="Début de la dispense"></label>
                  <label>au <input type="date" data-champ="dispFin" value="${esc(el.dispFin || '')}" aria-label="Fin de la dispense"></label>
                  ${el.dispFin ? `<button class="replier-disp" data-replier-dispense="${el.id}">OK</button>` : ''}
                </div>
                <span class="badge-disp ${s.code}">${esc(s.texte)}</span>` : ''}
            </td>
            <td class="c-rem" data-label="Remarques"><input data-champ="remarque" value="${esc(el.remarque || '')}" aria-label="Remarques" placeholder="santé, inaptitude…"></td>
            <td class="c-suppr"><button class="icone-petit" data-supprimer-eleve="${el.id}" title="Supprimer l’élève" aria-label="Supprimer l’élève">🗑</button></td>
          </tr>`;
        }).join('')}
        </tbody>
      </table></div>`
    : `<div class="vide"><p>Aucun élève pour l’instant.</p>
        <p class="aide">Astuce : copie la liste depuis Pronote ou un tableur, puis « Coller une liste ».</p></div>`}`;
}

function majPastille() {
  // Un seul bouton : sa couleur et son texte indiquent l'état de la sauvegarde sur la clé.
  const m = Donnees.meta();
  const [etat, texte, info] =
    etatAuto === 'encours' ? ['encours', 'Enregistrement…', 'Enregistrement sur la clé en cours']
    : !m.dernierEnvoi ? ['jamais', 'Ma clé', 'Ce carnet n’a encore jamais été enregistré sur une clé — cliquer pour récupérer ou enregistrer']
    : m.modifieLe <= m.dernierEnvoi ? ['ok', 'À jour · ' + heure(m.dernierEnvoi), 'Tout est sur la clé — dernier enregistrement : ' + dateHeure(m.dernierEnvoi)]
    : etatAuto === 'erreur' ? ['erreur', 'Clé absente ?', 'Enregistrement impossible : branche la clé puis clique ici']
    : ['attente', 'À enregistrer', 'Des modifications ne sont pas encore sur la clé — cliquer pour enregistrer'];
  const b = $('#btn-sauver');
  b.className = 'sauver etat-' + etat + (etat === 'attente' && !Cle.accesDirect ? ' rappel' : '');
  b.title = info;
  $('#etat-cle').textContent = texte;
}

/* ---------- Tablette : rappel d'enregistrer sur la clé ----------
   Sur tablette, rien ne part tout seul sur la clé, et le navigateur ne laisse pas toujours retenir la fermeture.
   Tant que des modifications n'y sont pas, le bouton 🔑 reste orange et clignote doucement ;
   au lancement et à chaque retour dans l'appli, un petit message le rappelle en plus. */

const aEnregistrer = () => { const m = Donnees.meta(); return m.modifieLe > m.dernierEnvoi; };

function rappelerCle() {
  if (!Cle.accesDirect && aEnregistrer()) notifAuto('🔑 Pense à enregistrer sur la clé : bouton « À enregistrer » en haut.');
}

// Petite notification discrète en bas de l'écran (ne vole pas le focus de la saisie).
function notifAuto(message, erreur = false) {
  const n = $('#notif-auto');
  n.textContent = message;
  n.classList.toggle('erreur', erreur);
  n.hidden = false;
  clearTimeout(notifAuto.minuteur);
  notifAuto.minuteur = setTimeout(() => { n.hidden = true; }, erreur ? 6000 : 2500);
}

/* ---------- Ascenseur (écran tactile) ----------
   Sur tablette, le navigateur cache les barres de défilement : un curseur fin, collé au bord droit,
   permet de parcourir d'un geste une longue liste d'élèves ou une grande grille. Sur ordinateur,
   la barre de défilement habituelle suffit. */

const ascenseurPossible = () => matchMedia('(pointer: coarse)').matches;

// Ce qui défile en hauteur : la grille (Notes, Entraînement) si elle déborde, sinon la page.
function zoneDefilement() {
  const g = $('#vue .grille-scroll');
  return g && g.scrollHeight > g.clientHeight + 1 ? g : $('#vue');
}

function majAscenseur() {
  const a = $('#ascenseur');
  const z = ascenseurPossible() ? zoneDefilement() : null;
  const reste = z ? z.scrollHeight - z.clientHeight : 0;
  if (!z || reste < 40) { a.hidden = true; return; } // rien (ou presque) à faire défiler
  const r = z.getBoundingClientRect();
  const hauteur = Math.max(48, (r.height * z.clientHeight) / z.scrollHeight); // assez grand pour le doigt
  a.hidden = false;
  a.style.top = r.top + 'px';
  a.style.height = r.height + 'px';
  const curseur = a.firstElementChild;
  curseur.style.height = hauteur + 'px';
  curseur.style.transform = `translateY(${((r.height - hauteur) * z.scrollTop) / reste}px)`;
}

let majAscenseurPrevue = false;
const planifierAscenseur = () => {
  if (majAscenseurPrevue) return;
  majAscenseurPrevue = true;
  requestAnimationFrame(() => { majAscenseurPrevue = false; majAscenseur(); });
};
document.addEventListener('scroll', planifierAscenseur, true); // (capture : la grille défile aussi)
window.addEventListener('resize', planifierAscenseur);

let tirage = null; // { zone, y0, haut0, ratio }
$('#ascenseur .ascenseur-curseur').addEventListener('pointerdown', e => {
  const zone = zoneDefilement(), a = $('#ascenseur');
  tirage = {
    zone, y0: e.clientY, haut0: zone.scrollTop,
    ratio: (zone.scrollHeight - zone.clientHeight) / Math.max(1, a.clientHeight - e.currentTarget.offsetHeight),
  };
  a.classList.add('actif');
  e.preventDefault();
  try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* le doigt suit quand même tant qu'il reste sur le curseur */ }
});
$('#ascenseur .ascenseur-curseur').addEventListener('pointermove', e => {
  if (tirage) tirage.zone.scrollTop = tirage.haut0 + (e.clientY - tirage.y0) * tirage.ratio;
});
for (const fin of ['pointerup', 'pointercancel']) {
  $('#ascenseur .ascenseur-curseur').addEventListener(fin, () => { tirage = null; $('#ascenseur').classList.remove('actif'); });
}

/* ---------- Saisie des notes ---------- */

const cellule = (ligne, col) => $(`.grille [data-ligne="${ligne}"][data-col="${col}"]`);

// Une case de grille : note d'évaluation ou performance d'entraînement.
const valider = input => (input.dataset.seance ? validerCelluleEnt(input) : validerCellule(input));

function validerCellule(input) {
  const ev = Donnees.get('evals', input.dataset.eval);
  const eleveId = input.dataset.eleve;
  const avant = Donnees.note(ev.id, eleveId);
  const brut = input.value.trim().toUpperCase().replace(',', '.');
  let valeur;
  if (brut === '') valeur = '';
  else if (RACCOURCIS[brut]) valeur = RACCOURCIS[brut];
  else if (/^\d+(\.\d+)?$/.test(brut) && +brut <= ev.max) valeur = String(+brut);
  else {
    toast(`« ${input.value} » : entre une note de 0 à ${fmt(ev.max)}, ou A, D, N.`, 'erreur');
    input.value = affichage(avant);
    return;
  }
  if (valeur !== avant) Donnees.ecrireNote(ev.id, eleveId, valeur);
  input.value = affichage(valeur);
  input.className = 'cellule' + classeCode(valeur);
  preremplirDegres(ev, eleveId);
  majMoyennes();
  majBilans();
}

function deplacer(input, dl, dc) {
  const suivante = cellule(+input.dataset.ligne + dl, +input.dataset.col + dc);
  if (suivante) suivante.focus();
  else input.select?.(); // bord du tableau : on reste, contenu sélectionné pour être remplacé
}

// Barre de codes rapides (utile sur tablette, où le clavier numérique n'a pas de lettres)
function placerBarreSaisie() {
  const vv = window.visualViewport;
  if (vv) $('#saisie').style.bottom = Math.max(0, window.innerHeight - vv.height - vv.offsetTop) + 'px';
}

/* ---------- Classes, évaluations, élèves ---------- */

async function editerClasse(id) {
  const c = id ? Donnees.get('classes', id) : { nom: '', niveau: '' };
  const s = seuilsClasse(c);
  const { resultat } = ouvrirModale(id ? 'Modifier la classe' : 'Nouvelle classe', `
    <label>Nom de la classe<input name="nom" required autofocus value="${esc(c.nom)}" placeholder="ex. 3e B"></label>
    <label>Niveau<select name="niveau">
      <option value="">—</option>${NIVEAUX.map(n => `<option ${c.niveau === n ? 'selected' : ''}>${n}</option>`).join('')}
    </select></label>
    <fieldset class="competences">
      <legend>Correspondance note → degré de maîtrise (pour cette classe)</legend>
      <div class="ligne seuils">
        <label><span><span class="niveau n2">2</span> dès</span><input type="number" name="s2" min="0" max="20" step="any" required value="${s[0]}"></label>
        <label><span><span class="niveau n3">3</span> dès</span><input type="number" name="s3" min="0" max="20" step="any" required value="${s[1]}"></label>
        <label><span><span class="niveau n4">4</span> dès</span><input type="number" name="s4" min="0" max="20" step="any" required value="${s[2]}"></label>
        <span class="aide">sur 20 — en dessous : <span class="niveau n1">1</span></span>
      </div>
      <p class="aide">Ex. avec cette classe, « 3 dès 12 » : un 12/20 pré-remplit le degré 3. S’applique aux évaluations de la classe
        (sauf celles où tu as réglé d’autres seuils). Les degrés choisis à la main ne bougent pas.</p>
    </fieldset>`,
  boutonsModale(id ? 'Enregistrer' : 'Créer', id ? BOUTON_SUPPRIMER : ''), 'modale-large');
  const r = await resultat;
  if (r.action === 'supprimer') {
    if (!(await confirmer(`Supprimer la classe « ${c.nom} », ses élèves et toutes ses notes ?`))) return;
    const eleves = new Set(elevesDe(id).map(el => el.id));
    supprimerNotes(n => eleves.has(n.eleveId));
    for (const s of Donnees.liste('suivis', x => eleves.has(x.eleveId))) Donnees.supprimer('suivis', s.id);
    for (const el of eleves) Donnees.supprimer('eleves', el);
    for (const e of evalsDe(id)) Donnees.supprimer('evals', e.id);
    const docs = seancesDe(id).flatMap(s => s.documents || []);
    for (const s of seancesDe(id)) Donnees.supprimer('seances', s.id);
    supprimerDocumentsInutilises(docs);
    Donnees.supprimer('classes', id);
  } else if (r.action === 'ok') {
    const seuils = [+r.data.s2, +r.data.s3, +r.data.s4].sort((x, y) => x - y);
    const enreg = Donnees.ecrire('classes', { ...c, id: c.id || Donnees.nouvelId(), nom: r.data.nom.trim(), niveau: r.data.niveau, seuils });
    ui.classeId = enreg.id;
    memoriserUi();
    // Recalcul des degrés pré-remplis des évaluations qui suivent les seuils de la classe
    for (const e of evalsDe(enreg.id).filter(e => !e.seuils)) for (const el of elevesDe(enreg.id)) preremplirDegres(e, el.id);
  }
  rendre();
}

async function editerEval(id) {
  const c = classeActive();
  const e = id ? Donnees.get('evals', id) : { titre: '', apsa: '', date: aujourdhui(), max: 20, coef: 1 };
  const refInitial = e.referentiel || REFERENTIEL_PAR_NIVEAU[c.niveau] || 'cycle4';
  const seuils = e.seuils || seuilsClasse(c);
  const caInitial = e.ca ?? caDeApsa(e.apsa, refInitial);
  const { d, resultat } = ouvrirModale(id ? 'Modifier l’évaluation' : 'Nouvelle évaluation', `
    <label>Titre<input name="titre" required autofocus value="${esc(e.titre)}" placeholder="ex. Demi-fond — 3 × 500 m"></label>
    <label>APSA<input name="apsa" list="liste-apsa" value="${esc(e.apsa)}" placeholder="Choisis ou tape une activité"></label>
    <datalist id="liste-apsa">${APSA.map(a => `<option value="${esc(a)}">`).join('')}</datalist>
    <div class="ligne">
      <label>Date<input type="date" name="date" value="${esc(e.date)}"></label>
      <label>Noté sur<input type="number" name="max" min="1" step="any" required value="${e.max}"></label>
      <label>Coefficient<input type="number" name="coef" min="0" step="any" required value="${e.coef}"></label>
    </div>
    <fieldset class="competences">
      <legend>Compétences travaillées</legend>
      <div class="ligne">
        <label>Référentiel<select name="referentiel">${Object.values(REFERENTIEL.refs)
    .map(r => `<option value="${r.id}" ${r.id === refInitial ? 'selected' : ''}>${esc(r.nom)}</option>`).join('')}</select></label>
        <label>Champ d’apprentissage<select name="ca"></select></label>
      </div>
      <div class="zone-competences"></div>
      <label>Autres compétences travaillées<textarea name="competencesLibres" rows="2"
        placeholder="Une par ligne (ex. compétence du projet d’EPS)">${esc(e.competencesLibres || '')}</textarea></label>
      <div class="bloc-seuils">
        <label class="case"><input type="checkbox" name="preremplir" ${e.preremplir !== false ? 'checked' : ''}>
          Pré-remplir les degrés de maîtrise à partir de la note (modifiables ensuite)</label>
        <div class="ligne seuils">
          <label><span><span class="niveau n2">2</span> dès</span><input type="number" name="s2" min="0" max="20" step="any" required value="${seuils[0]}"></label>
          <label><span><span class="niveau n3">3</span> dès</span><input type="number" name="s3" min="0" max="20" step="any" required value="${seuils[1]}"></label>
          <label><span><span class="niveau n4">4</span> dès</span><input type="number" name="s4" min="0" max="20" step="any" required value="${seuils[2]}"></label>
          <span class="aide">sur 20 — en dessous du premier seuil : <span class="niveau n1">1</span></span>
        </div>
        <p class="aide seuils-bareme">${seuilsDansBareme(seuils, e.max)}</p>
      </div>
    </fieldset>`,
  boutonsModale(id ? 'Enregistrer' : 'Créer', id ? BOUTON_SUPPRIMER : ''), 'modale-large');

  // Liste des attendus, mise à jour quand on change de référentiel, de champ ou d'APSA.
  const selRef = $('[name="referentiel"]', d), selCa = $('[name="ca"]', d), zone = $('.zone-competences', d);
  let coches = new Set(e.competences || []);
  let caChoisiALaMain = !!e.ca;
  const majChamps = ca => {
    const ref = REFERENTIEL.refs[selRef.value];
    selCa.innerHTML = '<option value="">—</option>' + Object.entries(ref.champs)
      .map(([k, ch]) => `<option value="${k}" ${k === ca ? 'selected' : ''}>${k} — ${esc(ch.titre)}</option>`).join('');
    majAttendus();
  };
  const majAttendus = () => {
    const champ = REFERENTIEL.refs[selRef.value].champs[selCa.value];
    zone.innerHTML = champ
      ? champ.attendus.map(a => `
          <label class="case competence"><input type="checkbox" name="competence" value="${a.id}" ${coches.has(a.id) ? 'checked' : ''}>
            <span><b>${a.code}</b> ${esc(a.texte)}</span></label>`).join('')
      : '<p class="aide">Choisis le champ d’apprentissage pour cocher les compétences travaillées.</p>';
  };
  zone.addEventListener('change', ev => {
    if (ev.target.name === 'competence') ev.target.checked ? coches.add(ev.target.value) : coches.delete(ev.target.value);
  });
  selRef.addEventListener('change', () => majChamps(caDeApsa($('[name="apsa"]', d).value, selRef.value) || selCa.value));
  selCa.addEventListener('change', () => { caChoisiALaMain = true; majAttendus(); });
  $('[name="apsa"]', d).addEventListener('change', ev => {
    const ca = caDeApsa(ev.target.value, selRef.value);
    if (ca && !caChoisiALaMain) { selCa.value = ca; majAttendus(); }
  });
  majChamps(caInitial);

  // Conversion des seuils dans le barème de l'évaluation, mise à jour pendant la saisie.
  d.addEventListener('input', ev => {
    if (!['max', 's2', 's3', 's4'].includes(ev.target.name)) return;
    const val = n => +$(`[name="${n}"]`, d).value;
    $('.seuils-bareme', d).textContent = seuilsDansBareme([val('s2'), val('s3'), val('s4')], val('max'));
  });

  const r = await resultat;
  if (r.action === 'supprimer') {
    if (await confirmer(`Supprimer l’évaluation « ${e.titre} » et toutes ses notes ?`)) {
      supprimerNotes(n => n.evalId === id);
      Donnees.supprimer('evals', id);
    }
  } else if (r.action === 'ok') {
    // On ne garde que les attendus du référentiel et du champ retenus.
    const prefixe = `${r.data.referentiel}.${r.data.ca}.`;
    const enreg = Donnees.ecrire('evals', {
      ...e, id: e.id || Donnees.nouvelId(), classeId: c.id, cree: e.cree || Date.now(),
      titre: r.data.titre.trim(), apsa: r.data.apsa.trim(), date: r.data.date, max: +r.data.max, coef: +r.data.coef,
      referentiel: r.data.referentiel, ca: r.data.ca,
      competences: r.data.ca ? r.fd.getAll('competence').filter(x => x.startsWith(prefixe)) : [],
      competencesLibres: r.data.competencesLibres.trim(),
      preremplir: r.data.preremplir === 'on',
      // Mêmes seuils que la classe : l'évaluation suit la classe (et ses futurs changements)
      seuils: (s => (memesSeuils(s, seuilsClasse(c)) ? undefined : s))([+r.data.s2, +r.data.s3, +r.data.s4].sort((x, y) => x - y)),
    });
    // Notes déjà saisies (ou seuils modifiés) : on met à jour les degrés vides ou pré-remplis.
    for (const el of elevesDe(c.id)) preremplirDegres(enreg, el.id);
    // Date hors de la période affichée : l'évaluation disparaîtrait de la grille sans explication.
    const vue = periodeAffichee(), sa = periodeDe(enreg.date);
    if (vue !== 'annee' && sa !== vue) {
      const code = periodesAnnee().find(p => p.id === sa)?.code;
      toast(`« ${enreg.titre} » est rangée ${code ? 'dans le ' + code : 'hors période (sans date)'} d’après sa date : choisis « Toute l’année » pour la voir.`);
    }
  }
  rendre();
}

// Résumé des compétences d'une évaluation, pour l'en-tête de la grille.
function resumeCompetences(e) {
  const attendus = (e.competences || []).map(REFERENTIEL.attendu).filter(Boolean);
  const libres = (e.competencesLibres || '').split('\n').map(s => s.trim()).filter(Boolean);
  const codes = [...new Set(attendus.map(a => a.code))];
  const court = [e.ca, codes.join(' '), libres.length ? `+${libres.length}` : ''].filter(Boolean).join(' · ');
  const detail = [
    e.ca && REFERENTIEL.refs[e.referentiel]?.champs[e.ca] ? `${e.ca} — ${REFERENTIEL.refs[e.referentiel].champs[e.ca].titre}` : '',
    ...attendus.map(a => `${a.code} : ${a.texte}`),
    ...libres.map(l => `• ${l}`),
  ].filter(Boolean).join('\n');
  return { court, detail };
}

const CHAMPS_ELEVE = `
  <div class="ligne">
    <label>Nom<input name="nom" class="majuscules" required autofocus autocapitalize="characters"></label>
    <label>Prénom<input name="prenom"></label>
    <label class="etroit">Sexe<select name="sexe"><option value="">—</option><option>F</option><option>G</option></select></label>
  </div>
  <div class="ligne">
    <label class="case"><input type="checkbox" name="pai"> <span class="badge-pai">PAI</span> Projet d’accueil individualisé</label>
    <label class="case"><input type="checkbox" name="bep"> <span class="badge-bep">BEP</span> Besoin éducatif particulier</label>
  </div>
  <label>Remarques<input name="remarque" placeholder="santé, inaptitude…"></label>`;

// Saisie à la chaîne : après chaque élève ajouté, la fenêtre se rouvre vide pour le suivant.
async function ajouterEleve() {
  const c = classeActive();
  for (let ajoutes = 0; ; ajoutes++) {
    const titre = ajoutes ? `Nouvel élève — ${ajoutes} ajouté${ajoutes > 1 ? 's' : ''}` : 'Nouvel élève';
    const { resultat } = ouvrirModale(titre, CHAMPS_ELEVE + '<p class="aide">Entrée = champ suivant · sur le dernier champ, Entrée ajoute l’élève et passe au suivant.</p>',
      '<span class="espace"></span><button type="button" data-fermer>Terminer</button><button value="ok" class="primaire">Ajouter ↵</button>');
    const r = await resultat;
    if (r.action !== 'ok') return;
    Donnees.ecrire('eleves', {
      id: Donnees.nouvelId(), classeId: c.id, ordre: prochainOrdre(c.id), nom: majuscules(r.data.nom), prenom: r.data.prenom.trim(),
      sexe: r.data.sexe, pai: r.data.pai === 'on', bep: r.data.bep === 'on', remarque: r.data.remarque.trim(),
    });
    rendre();
  }
}

// Noms de famille toujours en majuscules (accents compris : « Lefèvre » → « LEFÈVRE »).
const majuscules = s => (s || '').trim().replace(/\s+/g, ' ').toLocaleUpperCase('fr');

function migrerNoms() {
  for (const el of Donnees.liste('eleves', e => e.nom && e.nom !== majuscules(e.nom))) {
    Donnees.ecrire('eleves', { ...el, nom: majuscules(el.nom) });
  }
}

const normSexe = s => {
  s = (s || '').trim().toUpperCase();
  return s.startsWith('F') ? 'F' : s.startsWith('G') || s.startsWith('M') ? 'G' : '';
};

// Une ligne par élève : « NOM Prénom » (format Pronote) ou « Nom;Prénom;Sexe » / colonnes de tableur.
function analyserListe(texte) {
  return texte.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(ligne => {
    const morceaux = ligne.split(/\t|;|,/).map(s => s.trim()).filter(Boolean);
    if (morceaux.length >= 2) return { nom: morceaux[0], prenom: morceaux[1], sexe: normSexe(morceaux[2]) };
    const mots = ligne.split(/\s+/);
    let i = 0;
    while (i < mots.length - 1 && /\p{L}/u.test(mots[i]) && mots[i] === mots[i].toLocaleUpperCase('fr')) i++;
    if (i === 0) i = 1;
    return { nom: mots.slice(0, i).join(' '), prenom: mots.slice(i).join(' '), sexe: '' };
  });
}

async function collerListe() {
  const c = classeActive();
  const { resultat } = ouvrirModale(`Coller une liste — ${c.nom}`, `
    <p class="aide">Un élève par ligne : <b>NOM Prénom</b> (comme dans Pronote), ou <b>Nom;Prénom;Sexe</b>, ou des colonnes copiées d’un tableur.</p>
    <textarea name="liste" rows="12" required autofocus placeholder="DUPONT Léa&#10;MARTIN Hugo&#10;…"></textarea>`,
  boutonsModale('Ajouter les élèves'));
  const r = await resultat;
  if (r.action !== 'ok') return;
  const eleves = analyserListe(r.data.liste);
  // En ordre personnalisé, la liste collée garde son ordre (ex. ordre Pronote), à la suite des élèves existants.
  let ordre = prochainOrdre(c.id);
  for (const el of eleves) Donnees.ecrire('eleves', { id: Donnees.nouvelId(), classeId: c.id, remarque: '', ...el, nom: majuscules(el.nom), ordre: ordre++ });
  toast(`${eleves.length} élève${eleves.length > 1 ? 's' : ''} ajouté${eleves.length > 1 ? 's' : ''}.`, 'ok');
  rendre();
}

async function supprimerEleve(id) {
  const el = Donnees.get('eleves', id);
  if (!(await confirmer(`Supprimer ${el.nom} ${el.prenom} et ses notes ?`))) return;
  supprimerNotes(n => n.eleveId === id);
  for (const s of Donnees.liste('suivis', x => x.eleveId === id)) Donnees.supprimer('suivis', s.id);
  Donnees.supprimer('eleves', id);
  rendre();
}

// Notes, degrés et données d'entraînement : supprimés avec leur élève, évaluation ou séance
// (sinon ils resteraient dans le carnet et sur la clé).
function supprimerNotes(filtre) {
  for (const n of Donnees.liste('notes', filtre)) Donnees.supprimer('notes', n.id);
}

// Notes restées orphelines (élève, évaluation ou séance supprimés par une version précédente).
function migrerNotesOrphelines() {
  supprimerNotes(n => !Donnees.get('eleves', n.eleveId) || !(Donnees.get('evals', n.evalId) || Donnees.get('seances', n.evalId)));
}

/* ---------- Clé USB ---------- */

// Mot de passe du carnet (gardé en mémoire le temps de la session).
//   pourEnregistrer : on va chiffrer avec ce mot de passe. Si cet appareil connaît déjà le mot de passe du carnet
//     (témoin), on le redemande et on le vérifie : une faute de frappe ne crée pas un 2e mot de passe.
//     Sinon (tout premier enregistrement sur cet appareil), on le fait taper deux fois.
//   Pour lire la clé, pas de vérification ici : c'est le fichier lui-même qui dit si le mot de passe est bon.
async function obtenirMdp(pourEnregistrer) {
  if (mdpSession) return mdpSession;
  const temoin = Donnees.meta().temoinMdp;
  const nouveau = pourEnregistrer && !temoin;
  const { resultat } = ouvrirModale(nouveau ? 'Mot de passe du carnet' : 'Déverrouiller le carnet', `
    <p class="aide">${nouveau
    ? 'Il chiffre le fichier sur la clé : si tu la perds, personne ne peut lire les données des élèves.<br>'
      + '<b>Tu as déjà un carnet sur ta clé (fait sur l’ordinateur) ? Mets le même mot de passe.</b><br>'
      + 'Note-le bien : sans lui, impossible de récupérer le carnet.'
    : 'Le mot de passe de ton carnet (le même sur tous tes appareils).'}</p>
    <label>Mot de passe<input type="password" name="mdp" required autofocus minlength="${nouveau ? 6 : 1}" autocomplete="${nouveau ? 'new-password' : 'current-password'}"></label>
    ${nouveau ? '<label>Confirmer<input type="password" name="mdp2" required autocomplete="new-password"></label>' : ''}`,
  boutonsModale('Valider'));
  const r = await resultat;
  if (r.action !== 'ok') throw new Annule();
  if (nouveau && r.data.mdp !== r.data.mdp2) {
    toast('Les deux mots de passe ne correspondent pas.', 'erreur');
    return obtenirMdp(pourEnregistrer);
  }
  if (pourEnregistrer && temoin && !(await Cle.verifierTemoin(r.data.mdp, temoin))) {
    toast('Ce n’est pas le mot de passe de ton carnet. (Changé de mot de passe ? Fais d’abord « Récupérer depuis la clé ».)', 'erreur');
    return obtenirMdp(pourEnregistrer);
  }
  mdpSession = r.data.mdp;
  if (nouveau) memoriserTemoin(mdpSession);
  return mdpSession;
}

// Garde le témoin du mot de passe qui ouvre (ou va chiffrer) le carnet de la clé.
// Calcul un peu long : fait en arrière-plan, sans bloquer l'appli.
function memoriserTemoin(mdp) {
  const temoin = Donnees.meta().temoinMdp;
  (async () => {
    if (temoin && (await Cle.verifierTemoin(mdp, temoin))) return; // déjà le bon
    Donnees.reglerMeta('temoinMdp', await Cle.creerTemoin(mdp));
  })().catch(e => console.warn('Témoin du mot de passe non enregistré :', e));
}

// Mise à jour des données des anciennes versions (au démarrage et après chaque fichier réuni).
function migrerTout() {
  migrerCodes();
  migrerNoms();
  migrerSeuils();
  migrerSeances();
  migrerGroupes();
  migrerNotesOrphelines();
}

// Déchiffre un fichier de la clé et le fusionne avec le carnet de cet appareil.
async function importerTexte(texte) {
  for (;;) {
    const mdp = await obtenirMdp(false);
    try {
      const n = Donnees.fusionner(await Cle.dechiffrer(texte, mdp));
      migrerTout();
      memoriserTemoin(mdp); // ce mot de passe ouvre le carnet de la clé : c'est désormais le bon
      return { mdp, n };
    } catch (e) {
      if (!(e instanceof Cle.ErreurMdp)) throw e;
      mdpSession = null;
      toast('Mot de passe incorrect.', 'erreur');
    }
  }
}

// Ordinateur : lit carnet-eps.json dans le dossier de la clé, fusionne, puis réécrit le tout
// (avec, sur demande, une copie datée dans « Sauvegardes »).
async function synchroniser(dossier, { silencieux = false, copie = false } = {}) {
  if (!(await Cle.autoriser(dossier))) throw new Error('Accès au dossier de la clé refusé.');
  let h, texte;
  try {
    h = await Cle.fichierCarnet(dossier);
    texte = await Cle.lire(h);
  } catch {
    throw new Error('Dossier introuvable : vérifie que la clé est bien branchée.');
  }
  // Récupérer / Enregistrer (pas l'enregistrement automatique) : en plus de carnet-eps.json, on réunit les
  // autres carnets posés à côté ou dans « Sauvegardes » (ex. le fichier enregistré sur la tablette).
  // Chacun est réuni une fois, quelle que soit sa date (carnet-eps.json a pu être réécrit entre-temps par
  // l'enregistrement automatique) ; réunir ne peut rien écraser. Les copies datées de l'ordinateur sont écartées.
  const dejaVus = Donnees.meta().carnetsReunis || {};
  const autres = silencieux ? [] : await Cle.autresCarnets(dossier);
  const plusRecents = autres.filter(c => dejaVus[c.nom] !== c.date).sort((a, b) => b.date.localeCompare(a.date));
  const aReunir = [...(texte.trim() ? [{ nom: Cle.NOM_FICHIER, texte }] : []), ...plusRecents];
  let mdp, n = 0;
  const repris = [], ignores = [];
  // Fichiers de la tablette dont le contenu est déjà dans le carnet (réunis maintenant ou lors d'une fois précédente).
  const tabletteReunis = autres.filter(c => Cle.estFichierTablette(c.fichier) && dejaVus[c.nom] === c.date);
  for (const c of aReunir) {
    if (!mdp) {
      // Le premier fichier donne le mot de passe (demandé si besoin, vérifié par le fichier lui-même).
      const r = await importerTexte(c.texte);
      ({ mdp } = r);
      n += r.n;
    } else {
      try {
        n += Donnees.fusionner(await Cle.dechiffrer(c.texte, mdp));
      } catch (e) {
        if (!(e instanceof Cle.ErreurMdp)) throw e;
        ignores.push(c.nom); // chiffré avec un autre mot de passe
        continue;
      }
    }
    if (c.nom !== Cle.NOM_FICHIER) repris.push(c.nom);
    if (c.fichier && Cle.estFichierTablette(c.fichier)) tabletteReunis.push(c);
  }
  if (aReunir.length > 1) migrerTout();
  if (plusRecents.length) {
    Donnees.reglerMeta('carnetsReunis', { ...dejaVus, ...Object.fromEntries(plusRecents.map(c => [c.nom, c.date])) });
  }
  if (!mdp) mdp = await obtenirMdp(true);
  const sortie = await Cle.chiffrer(Donnees.exporter(), mdp);
  let nomCopie = null;
  try {
    await Cle.ecrire(h, sortie);
    if (copie) nomCopie = await Cle.copieDatee(dossier, sortie);
  } catch {
    throw new Error('Impossible d’écrire sur la clé (retirée ou protégée en écriture ?).');
  }
  let supprimes = 0;
  if (copie) {
    try { await Cle.nettoyerCopies(dossier); } catch (e) { console.warn('Ménage des copies datées impossible :', e); }
    // Fichiers de la tablette repris : leur contenu est dans carnet-eps.json et dans la copie datée qui vient
    // d'être faite → on les retire de la clé (un fichier ignoré, ex. autre mot de passe, n'est jamais supprimé).
    for (const c of tabletteReunis) {
      try { await c.rep.removeEntry(c.fichier); supprimes++; } catch (e) { console.warn('Fichier de la tablette non supprimé :', c.nom, e); }
    }
  }
  if (!silencieux) etatAuto = null;
  Donnees.marquerEnvoi();
  if (silencieux && !n) return; // ne pas redessiner : la saisie en cours n'est pas interrompue
  rendre();
  if (silencieux) return;
  const recup = n ? ` · ${n} élément${n > 1 ? 's' : ''} récupéré${n > 1 ? 's' : ''} de la clé` : '';
  toast(`Clé à jour ✔ (dossier « ${dossier.name} »)${recup}`
    + (repris.length ? `\nRepris aussi : ${repris.join(', ')}` : '')
    + (supprimes ? `\n${supprimes} fichier${supprimes > 1 ? 's' : ''} de la tablette retiré${supprimes > 1 ? 's' : ''} de la clé (contenu gardé dans le carnet)` : '')
    + (ignores.length ? `\n⚠ Ignoré (autre mot de passe) : ${ignores.join(', ')}` : ''), ignores.length ? 'erreur' : 'ok');
}

// Bouton 💾 : sur ordinateur, enregistre dans le dossier de la clé (choisi la première fois) ;
// sur tablette, prépare le fichier à enregistrer sur la clé.
async function sauvegarder() {
  if (!Cle.accesDirect) return exporterTablette();
  let dossier = await Cle.dossierMemorise();
  // « Sauvegardes » mémorisé par erreur (anciennes versions) : on l'oublie et on redemande le bon dossier.
  if (dossier && Cle.estDossierCopies(dossier)) dossier = null;
  if (!dossier) dossier = await choisirDossierCle();
  await synchroniser(dossier, { copie: true });
}

// Choix du dossier du carnet sur la clé (ordinateur), avec une explication avant et des garde-fous après.
async function choisirDossierCle() {
  const { resultat } = ouvrirModale('Dossier du carnet sur la clé', `
    <p>Dans la fenêtre qui va s’ouvrir, va dans le dossier de ta clé qui contient <b>carnet-eps.json</b>
      et le dossier <b>Sauvegardes</b>, puis clique sur <b>« Sélectionner un dossier »</b>.</p>
    <p class="aide">Les fichiers n’y sont pas affichés, seulement les dossiers : c’est normal.
      N’entre pas dans « Sauvegardes ». L’appli s’en souviendra pour la suite.</p>`,
  boutonsModale('Choisir le dossier'));
  if ((await resultat).action !== 'ok') throw new Annule();
  const dossier = await Cle.choisirDossier();
  if (Cle.estDossierCopies(dossier)) {
    throw new Error('Ça, c’est le dossier des copies datées. Recommence et choisis le dossier juste au-dessus, celui qui contient « Sauvegardes ».');
  }
  if (!(await Cle.contientCarnet(dossier))
    && !(await confirmer(`Il n’y a pas de carnet dans « ${dossier.name} ». En commencer un nouveau dans ce dossier ?`, 'Oui, ici'))) {
    throw new Annule();
  }
  await Cle.memoriser(dossier);
  return dossier;
}

// Ordinateur : après chaque modification, enregistrement automatique sur la clé
// (une fois le carnet déverrouillé dans la session et l'accès au fichier autorisé).
let minuteurAuto = null;
let etatAuto = null; // null | 'encours' | 'erreur'
function planifierSauvegardeAuto() {
  const m = Donnees.meta();
  if (!Cle.accesDirect || !mdpSession || etatAuto === 'encours' || m.modifieLe <= m.dernierEnvoi) return;
  clearTimeout(minuteurAuto);
  minuteurAuto = setTimeout(async () => {
    const dossier = await Cle.dossierMemorise();
    if (!dossier || Cle.estDossierCopies(dossier) || (await dossier.queryPermission({ mode: 'readwrite' })) !== 'granted') return;
    etatAuto = 'encours';
    majPastille();
    try {
      await synchroniser(dossier, { silencieux: true });
      etatAuto = null;
      notifAuto(`💾 Sauvegarde automatique sur la clé ✔ ${heure(Date.now())}`);
    } catch (e) {
      console.warn('Sauvegarde automatique impossible :', e);
      etatAuto = 'erreur';
      notifAuto('⚠ Sauvegarde automatique impossible : la clé est-elle branchée ?', true);
    }
    majPastille();
    planifierSauvegardeAuto(); // des modifications faites pendant l'enregistrement
  }, 4000);
}

async function importerFichier(fichier) {
  const { n } = await importerTexte(await fichier.text());
  rendre();
  toast(n ? `Import réussi ✔ ${n} élément${n > 1 ? 's' : ''} mis à jour.` : 'Import réussi ✔ Rien de nouveau.', 'ok');
}

// Tablette : prépare le fichier chiffré, puis un bouton dédié l'envoie vers la clé
// (la fenêtre d'enregistrement ou de partage doit partir directement d'un toucher de l'utilisateur).
// Le fichier porte un nom unique (carnet-eps-tablette_date_heure.json) : il se pose à côté de carnet-eps.json,
// sans remplacer ni renommer ; l'ordinateur le reprend tout seul à « Récupérer depuis la clé ».
const APRES_DEPOT = '<br><span class="aide">Ne remplace rien et ne renomme rien : l’ordinateur reprendra ce fichier tout seul à « Récupérer depuis la clé ».</span>';
const CONSIGNES_TABLETTE = {
  enregistrer: 'Touche le bouton ci-dessous : dans la fenêtre qui s’ouvre, va sur ta <b>clé USB</b>, dans le dossier du carnet (celui de <b>carnet-eps.json</b>), et enregistre.' + APRES_DEPOT,
  partager: 'Touche le bouton ci-dessous, choisis <b>« Enregistrer dans Fichiers »</b>, puis ouvre ta clé USB, dossier du carnet (celui de <b>carnet-eps.json</b>).' + APRES_DEPOT,
  telecharger: 'Touche le bouton ci-dessous : le fichier arrive dans <b>Téléchargements</b>. Avec l’appli <b>Mes fichiers</b>, déplace-le sur ta clé USB, '
    + 'dans le dossier du carnet (celui de <b>carnet-eps.json</b>).' + APRES_DEPOT,
};

async function exporterTablette() {
  const texte = await Cle.chiffrer(Donnees.exporter(), await obtenirMdp(true));
  const { d } = ouvrirModale('Fichier prêt', `<p>${CONSIGNES_TABLETTE[Cle.modeTablette]}</p>`,
    '<span class="espace"></span><button type="button" data-fermer>Annuler</button><button type="button" class="primaire" data-partager>Enregistrer sur la clé</button>');
  $('[data-partager]', d).addEventListener('click', () => {
    Cle.enregistrerSurCle(texte).then(fait => {
      if (!fait) return; // fenêtre fermée sans enregistrer : on peut réessayer
      Donnees.marquerEnvoi();
      d.fermer();
      toast(Cle.modeTablette === 'telecharger'
        ? 'Fichier dans Téléchargements ✔ — déplace-le sur la clé, à côté de carnet-eps.json (sans remplacer).'
        : 'Fichier enregistré sur la clé ✔', 'ok');
    }).catch(signalerErreur);
  });
}

/* ---------- Menu « Ma clé » ----------
   Le bouton 🔑 ouvre un petit menu avec les deux gestes, les mêmes sur tous les appareils :
   ⬇ Récupérer en arrivant, ⬆ Enregistrer en partant. (Sur ordinateur, les deux font la même chose :
   lire la clé, réunir, réécrire.) Le reste est rangé dans « Aide et dépannage ». */

function ouvrirMenuCle(ouvrir) {
  const menu = $('#menu-cle'), bouton = $('#btn-sauver');
  ouvrir ??= menu.hidden;
  if (ouvrir) {
    const m = Donnees.meta();
    const etat = $('#menu-cle-etat');
    etat.textContent = !m.dernierEnvoi ? 'Ce carnet n’a encore jamais été enregistré sur une clé.'
      : aEnregistrer() ? '🟠 Des modifications ne sont pas encore sur la clé.'
        : `✅ Tout est sur la clé (${dateHeure(m.dernierEnvoi)})`;
    etat.className = 'menu-cle-etat ' + (m.dernierEnvoi && !aEnregistrer() ? 'ok' : 'attente');
    // Ordinateur : le bouton lit le dossier de la clé ; tablette : il ouvre directement le choix du fichier.
    $('[data-menu-cle="recuperer"]', menu).hidden = !Cle.accesDirect;
    $('[data-menu-cle-fichier]', menu).hidden = Cle.accesDirect;
    $('[data-menu-cle="enregistrer"] small', menu).textContent =
      Cle.accesDirect && mdpSession ? 'Automatique ici tant que la clé est branchée' : 'En partant';
    // Juste sous la barre (sa hauteur varie avec la largeur de l'écran).
    menu.style.top = $('.barre').getBoundingClientRect().bottom + 6 + 'px';
  }
  menu.hidden = !ouvrir;
  bouton.setAttribute('aria-expanded', ouvrir);
  if (ouvrir) menu.querySelector('.choix-cle:not([hidden])')?.focus();
}

// Pendant la lecture / l'écriture de la clé, le bouton 🔑 montre que ça travaille.
async function actionCle(action) {
  const b = $('#btn-sauver');
  b.disabled = true;
  b.className = 'sauver etat-encours';
  try { await action(); } finally { b.disabled = false; majPastille(); }
}

$('#menu-cle').addEventListener('click', e => {
  const choix = e.target.closest('[data-menu-cle]')?.dataset.menuCle;
  if (!choix) return;
  ouvrirMenuCle(false);
  if (choix === 'aide') return lancer(panneauCle);
  lancer(() => actionCle(sauvegarder));
});
$('#menu-cle').addEventListener('change', e => {
  const f = e.target.matches('[data-importer]') && e.target.files[0];
  e.target.value = ''; // pour pouvoir rechoisir le même fichier la fois suivante
  ouvrirMenuCle(false);
  if (f) lancer(() => actionCle(() => importerFichier(f)));
});
// Fermeture : toucher ailleurs, ou Échap.
document.addEventListener('click', e => {
  if (!$('#menu-cle').hidden && !e.target.closest('#menu-cle, [data-action="cle"]')) ouvrirMenuCle(false);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('#menu-cle').hidden) { ouvrirMenuCle(false); $('#btn-sauver').focus(); }
});

/* ---------- Aide et dépannage de la clé ---------- */

async function panneauCle() {
  const dossier = await Cle.dossierMemorise();
  const corps = `
    <button type="button" class="lien" data-cle="guide">❓ Comment ça marche ? (tablette ⇄ ordinateur)</button>
    <div class="depannage">
      <div class="options">
        ${dossier ? `<p class="aide">Dossier du carnet sur cet ordinateur : <b>${esc(dossier.name)}</b></p>
          <button type="button" data-cle="changer">Changer de dossier</button>` : ''}
        <label class="bouton">Ouvrir un autre fichier de sauvegarde…<input type="file" accept=".json,application/json" data-importer hidden></label>
        <p class="aide">Par exemple une copie datée du dossier « Sauvegardes ». Elle est <b>réunie</b> avec ce carnet : rien n’est effacé.</p>
        ${mdpSession || Donnees.meta().temoinMdp ? `<button type="button" data-cle="verrouiller">Oublier le mot de passe sur cet appareil</button>
          <p class="aide">Au prochain enregistrement, l’appli redemandera le mot de passe (à taper deux fois), sans le comparer à l’ancien.</p>` : ''}
        <div class="bloc-version">
          <span>Carnet EPS S-A — <b>version ${VERSION_APP}</b></span>
          <button type="button" data-cle="maj-appli" title="Recharge la dernière version de l’appli (tes données ne sont pas touchées)">🔄 Mettre à jour l’appli</button>
        </div>
      </div>
    </div>`;

  const { d } = ouvrirModale('Aide et dépannage — clé USB', corps, '<span class="espace"></span><button type="button" data-fermer>Fermer</button>');
  const occupe = async action => {
    d.classList.add('occupe');
    try { await action(); d.fermer(); } catch (e) { signalerErreur(e); } finally { d.classList.remove('occupe'); }
  };

  d.addEventListener('click', ev => {
    const b = ev.target.closest('[data-cle]');
    if (!b) return;
    switch (b.dataset.cle) {
      case 'guide': d.fermer(); return lancer(afficherGuide);
      case 'maj-appli': return lancer(forcerMiseAJour);
      case 'changer': return occupe(async () => synchroniser(await choisirDossierCle(), { copie: true }));
      case 'verrouiller':
        mdpSession = null;
        Donnees.reglerMeta('temoinMdp', undefined);
        toast('Mot de passe oublié sur cet appareil.');
        return d.fermer();
    }
  });
  d.addEventListener('change', ev => {
    const f = ev.target.matches('[data-importer]') && ev.target.files[0];
    if (f) occupe(() => importerFichier(f));
  });
}

/* ---------- Guide : le principe de la clé ---------- */

async function afficherGuide() {
  const { resultat } = ouvrirModale('Comment ça marche : la clé USB', `
    <div class="guide">
      <div class="schema-cle" aria-hidden="true">
        <span class="appareil">💻 Ordinateur</span><span class="fleche">⇄</span>
        <span class="appareil cle">🔑 Clé USB</span><span class="fleche">⇄</span>
        <span class="appareil">📱 Tablette</span>
      </div>
      <p>Chaque appareil garde <b>sa propre copie</b> du carnet. La clé sert à <b>faire passer</b> le carnet d’un appareil à l’autre
        (et de sauvegarde, chiffrée par ton mot de passe).</p>
      <h3>Deux gestes à retenir (bouton 🔑 en haut)</h3>
      <ol class="gestes">
        <li><b>⬇ En arrivant</b> sur un appareil : <b>Récupérer depuis la clé</b>.<br>
          <span class="aide">Tu retrouves ce que tu as fait sur l’autre appareil.</span></li>
        <li><b>⬆ En partant</b> : <b>Enregistrer sur la clé</b>.<br>
          <span class="aide">Sur ordinateur, c’est automatique tant que la clé est branchée. Sur tablette, le bouton 🔑 devient orange et clignote tant qu’il reste quelque chose à enregistrer.</span></li>
      </ol>
      <h3>Bon à savoir</h3>
      <ul class="bon-a-savoir">
        <li><b>Rien n’est écrasé</b> : les modifications des deux appareils sont réunies, information par information
          (ex. une remarque saisie sur la tablette et une dispense saisie sur l’ordinateur pour le même élève sont gardées toutes les deux).
          Seule une même information modifiée des deux côtés (la même note, le même champ) garde sa version la plus récente.</li>
        <li>Oublié de récupérer avant de travailler ? <b>Pas grave</b> : récupère maintenant, tout sera réuni.</li>
        <li><b>Le même mot de passe sur tous tes appareils.</b> Note-le bien : s’il est perdu, le carnet de la clé est illisible, pour toi aussi.</li>
        <li>Sur la tablette, le fichier enregistré porte un nom du type <b>carnet-eps-tablette_date_heure.json</b> :
          pose-le sur la clé <b>à côté</b> de carnet-eps.json, sans rien remplacer ni renommer. L’ordinateur le reprend tout seul,
          puis le retire de la clé (son contenu est alors dans carnet-eps.json).</li>
        <li>Sur la clé, le carnet est le fichier <b>carnet-eps.json</b> : garde-le <b>toujours au même endroit</b>, ne le renomme pas.
          Le dossier « Sauvegardes » à côté contient des copies datées faites par l’ordinateur.</li>
        <li>Sur un ordinateur qui n’est pas le tien : avant de partir, enregistre sur la clé puis efface les données du site dans le navigateur.</li>
      </ul>
    </div>`,
  '<span class="espace"></span><button type="button" data-cle-guide>🔑 Ouvrir Ma clé</button><button value="ok" class="primaire">J’ai compris</button>', 'modale-large');
  const r = await resultat;
  if (!ui.guideVu) { ui.guideVu = true; memoriserUi(); }
  return r;
}

// Depuis le guide : bouton qui ouvre directement le panneau de la clé.
document.addEventListener('click', e => {
  const b = e.target.closest('[data-cle-guide]');
  if (!b) return;
  b.closest('dialog').fermer();
  ouvrirMenuCle(true);
});

/* ---------- Mises à jour de l'appli (service worker) ---------- */

function enregistrerServiceWorker() {
  if (!('serviceWorker' in navigator) || !location.protocol.startsWith('http')) return;
  const avaitVersion = !!navigator.serviceWorker.controller; // première installation : rien à proposer
  // Une nouvelle version vient d'arriver : on le signale par la couleur du bouton de version.
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (avaitVersion) verifierMiseAJour(); });
  navigator.serviceWorker.register('sw.js').then(reg => {
    // Version d'un ancien fonctionnement restée en attente : on l'active.
    if (reg.waiting) reg.waiting.postMessage('maj');
    reg.update().catch(() => {});
    document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
    setInterval(() => reg.update().catch(() => {}), 30 * 60 * 1000);
  }).catch(e => console.warn('Mise en cache hors ligne indisponible :', e));
}

/* ---------- Mise à jour à la demande ----------
   Toutes les minutes (et au retour sur la fenêtre), l'appli lit la version disponible sur son serveur.
   Le bouton de version (en haut à gauche) devient orange quand une mise à jour est disponible ;
   c'est le prof qui clique pour l'installer. */

const session = {
  lire: k => { try { return sessionStorage.getItem(k); } catch { return null; } },
  ecrire: (k, v) => { try { sessionStorage.setItem(k, v); } catch { /* sans importance */ } },
  effacer: k => { try { sessionStorage.removeItem(k); } catch { /* sans importance */ } },
};

async function versionServeur() {
  const rep = await fetch('sw.js', { cache: 'no-store' });
  return (await rep.text()).match(/VERSION = '([^']+)'/)?.[1] || null;
}

let versionDispo = null; // numéro de la nouvelle version disponible, ou null

function afficherVersion() {
  const b = $('#version-appli');
  b.classList.toggle('dispo', !!versionDispo);
  b.textContent = versionDispo ? `⟳ v${versionDispo}` : `v${VERSION_APP}`;
  b.title = versionDispo
    ? `Mise à jour disponible : v${VERSION_APP} → v${versionDispo}. Cliquer pour l’installer (tes données ne sont pas touchées).`
    : `Version ${VERSION_APP} — à jour. Cliquer pour vérifier.`;
}

async function verifierMiseAJour() {
  if (!location.protocol.startsWith('http')) return;
  let v;
  try { v = await versionServeur(); } catch { return; } // serveur éteint / hors ligne : on réessaiera
  versionDispo = v && v !== VERSION_APP ? v : null;
  afficherVersion();
}

// Clic sur le bouton de version : installe la mise à jour si elle existe, sinon vérifie.
async function boutonVersion() {
  await verifierMiseAJour();
  if (!versionDispo) return toast(`Tu as la dernière version (v${VERSION_APP}).`, 'ok');
  session.ecrire('maj-depuis', VERSION_APP);
  await forcerMiseAJour();
}

function surveillerMisesAJour() {
  // Message de confirmation après une mise à jour automatique
  const depuis = session.lire('maj-depuis');
  if (depuis && depuis !== VERSION_APP) toast(`Appli mise à jour : v${depuis} → v${VERSION_APP}`, 'ok');
  session.effacer('maj-depuis');
  afficherVersion();
  verifierMiseAJour();
  setInterval(verifierMiseAJour, 60 * 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) verifierMiseAJour(); });
  window.addEventListener('focus', verifierMiseAJour);
}

// Dernier recours : on oublie la copie en cache de l'appli et on recharge la dernière version.
// Les données (carnet, réglages) ne sont pas touchées : elles sont stockées ailleurs.
async function forcerMiseAJour() {
  toast('Mise à jour de l’appli…');
  await new Promise(r => setTimeout(r, 400)); // laisse finir un enregistrement en cours
  try { for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister(); } catch { /* rien à faire */ }
  try { for (const k of await caches.keys()) if (k.startsWith('carnet-eps-')) await caches.delete(k); } catch { /* rien à faire */ }
  location.reload();
}

/* ---------- Évènements ---------- */

function basculerMenu(ouvrir) {
  const ouvert = ouvrir ?? !$('#classes').classList.contains('ouvert');
  $('#classes').classList.toggle('ouvert', ouvert);
  $('#voile').hidden = !ouvert;
}

document.addEventListener('click', e => {
  const t = e.target.closest('[data-action],[data-classe],[data-modif-classe],[data-eval-entete],[data-supprimer-eleve],button[data-vue],[data-editer-dispense],[data-replier-dispense],[data-editer-adaptation],[data-editer-besoin],[data-voir-besoin],[data-monter],[data-descendre],[data-seance-entete]');
  if (!t || t.closest('dialog')) return;
  const ds = t.dataset;
  if (ds.seanceEntete) return lancer(() => editerSeance(ds.seanceEntete));
  if (ds.monter) return deplacerEleve(ds.monter, -1);
  if (ds.descendre) return deplacerEleve(ds.descendre, 1);
  if (ds.editerBesoin) return lancer(() => editerBesoin(ds.id, ds.editerBesoin));
  if (ds.voirBesoin) return lancer(() => voirBesoin(ds.id, ds.voirBesoin));
  if (ds.editerAdaptation) return lancer(() => editerAdaptation(ds.editerAdaptation));
  if (ds.replierDispense) { dispensesEnEdition.delete(ds.replierDispense); return rendreVue(); }
  if (ds.editerDispense) {
    dispensesEnEdition.add(ds.editerDispense);
    rendreVue();
    return $(`tr[data-eleve="${ds.editerDispense}"] [data-champ="dispFin"]`)?.focus();
  }
  if (ds.vue) { ui.vue = ds.vue; memoriserUi(); return rendre(); }
  if (ds.classe) { ui.classeId = ds.classe; memoriserUi(); basculerMenu(false); return rendre(); }
  if (ds.modifClasse) return lancer(() => editerClasse(ds.modifClasse));
  if (ds.evalEntete) return lancer(() => editerEval(ds.evalEntete));
  if (ds.supprimerEleve) return lancer(() => supprimerEleve(ds.supprimerEleve));
  switch (ds.action) {
    case 'menu': return basculerMenu();
    case 'cle': return ouvrirMenuCle();
    case 'guide': return lancer(afficherGuide);
    case 'sauvegarder': return lancer(sauvegarder);
    case 'maj-appli': return lancer(boutonVersion);
    case 'ajout-classe': basculerMenu(false); return lancer(() => editerClasse());
    case 'ajout-eval': return lancer(() => editerEval());
    case 'periodes': return lancer(editerPeriodes);
    case 'ajout-seance': return lancer(() => editerSeance());
    case 'ajout-eleve': return lancer(ajouterEleve);
    case 'coller-liste': return lancer(collerListe);
    case 'vue-eleves': ui.vue = 'eleves'; memoriserUi(); return rendre();  }
});

// Modification d'une note ou d'une fiche élève
document.addEventListener('change', e => {
  const t = e.target;
  if (t.classList.contains('cellule')) return valider(t);
  if (t.dataset.filtreExercice) {
    ui.exercices = { ...ui.exercices, [t.dataset.filtreExercice]: t.value };
    memoriserUi();
    return rendreVue();
  }
  if (t.dataset.triClasse) return changerTri(t.dataset.triClasse, t.value);
  if (t.matches('[data-periode]')) { ui.periode = t.value; memoriserUi(); return rendreVue(); }
  const ligne = t.closest('tr[data-eleve]');
  if (ligne && t.dataset.champ) {
    const el = Donnees.get('eleves', ligne.dataset.eleve);
    const champ = t.dataset.champ;
    if (champ === 'amenagement') {
      // Dispensé et Adapté s'excluent : on choisit l'un, l'autre, ou rien.
      const modif = { ...el, dispense: t.value === 'dispense', adapte: t.value === 'adapte' };
      if (modif.dispense && !el.dispDebut) modif.dispDebut = aujourdhui();
      Donnees.ecrire('eleves', modif);
      rendreClasses();
      rendreVue();
      if (modif.adapte && !el.adaptation) lancer(() => editerAdaptation(el.id)); // on saisit tout de suite les particularités
      return;
    }
    const modif = { ...el, [champ]: t.type === 'checkbox' ? t.checked : champ === 'nom' ? majuscules(t.value) : t.value.trim() };
    if (champ === 'dispense' && t.checked && !el.dispDebut) modif.dispDebut = aujourdhui();
    if (champ === 'dispFin' && modif.dispFin) dispensesEnEdition.delete(el.id); // date de fin saisie : on replie
    Donnees.ecrire('eleves', modif);
    rendreClasses();
    if (['dispense', 'dispDebut', 'dispFin'].includes(champ)) rendreVue(); // met à jour le statut affiché
  }
});

// Degrés de maîtrise : un toucher fait défiler les degrés ; au clavier 1 à 4, 0 ou Suppr pour effacer, flèches pour se déplacer.
document.addEventListener('click', e => {
  const b = e.target.closest('[data-niveau]');
  if (b) return changerNiveau(b);
  // Sur tablette / téléphone il n'y a pas de survol : un toucher affiche l'info (texte de la compétence, remarques…).
  if (e.target.closest('[data-voir-besoin]')) return; // le badge PAI / BEP ouvre sa fiche
  // (Entraînement : toucher le nom ouvre la fiche de l'élève, pas d'infobulle.)
  const info = e.target.closest('.grille .sous-comp, .grille:not(.grille-ent) tbody .col-nom[title], .legende-item, .grille .bilan-comp[title], .grille .bilan-mini[title]');
  if (info?.title) toast(info.title);
});

// Champs « Nom » : passage en majuscules pendant la frappe (le curseur reste à sa place).
document.addEventListener('input', e => {
  const t = e.target;
  if (!t.classList?.contains('majuscules') || e.isComposing) return;
  const haut = t.value.toLocaleUpperCase('fr');
  if (haut === t.value) return;
  const [debut, fin] = [t.selectionStart, t.selectionEnd];
  t.value = haut;
  t.setSelectionRange(debut, fin);
});

// Liste des élèves : Entrée passe au champ suivant (Nom → Prénom → Sexe → … → Remarques → élève suivant).
document.addEventListener('keydown', e => {
  const t = e.target;
  if (e.key !== 'Enter' || e.shiftKey || !t.matches?.('.tableau-eleves [data-champ]') || t.type === 'checkbox') return;
  e.preventDefault();
  const champs = [...document.querySelectorAll('.tableau-eleves [data-champ]')]
    .filter(c => c.type !== 'checkbox' && c.offsetParent !== null);
  const suivant = champs[champs.indexOf(t) + 1];
  if (suivant) { suivant.focus(); suivant.select?.(); } else t.blur();
});

document.addEventListener('keydown', e => {
  const t = e.target;
  if (t.matches?.('[data-niveau]')) {
    const fleches = { ArrowDown: [1, 0], ArrowUp: [-1, 0], ArrowRight: [0, 1], ArrowLeft: [0, -1] };
    if (/^[1-4]$/.test(e.key)) { changerNiveau(t, e.key); deplacer(t, 1, 0); }
    else if (['0', 'Delete', 'Backspace'].includes(e.key)) { changerNiveau(t, ''); deplacer(t, 1, 0); }
    else if (fleches[e.key]) deplacer(t, ...fleches[e.key]);
    else return;
    e.preventDefault();
    return;
  }
  if (!t.classList?.contains('cellule')) return;
  if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    valider(t);
    deplacer(t, e.key === 'ArrowUp' || (e.key === 'Enter' && e.shiftKey) ? -1 : 1, 0);
  } else if (e.key === 'Escape') {
    if (t.dataset.seance) {
      const statut = statutEnt(t.dataset.seance, t.dataset.eleve);
      const ind = Donnees.get('seances', t.dataset.seance)?.indicateurs.find(x => x.id === t.dataset.indic);
      t.value = statut ? STATUTS_ENT[statut] : afficherValeur(ind, Donnees.note(t.dataset.seance, t.dataset.eleve, t.dataset.indic));
    } else {
      t.value = affichage(Donnees.note(t.dataset.eval, t.dataset.eleve));
    }
    t.blur();
  }
});

document.addEventListener('focusin', e => {
  if (!e.target.classList?.contains('cellule')) return;
  e.target.select();
  $('#saisie').hidden = false;
  placerBarreSaisie();
});

document.addEventListener('focusout', () => {
  setTimeout(() => {
    if (!document.activeElement?.matches?.('.cellule, [data-niveau-ent], .cellule-choix')) $('#saisie').hidden = true;
  }, 0);
});

// Les boutons de la barre de codes ne doivent pas faire perdre le focus à la cellule.
$('#saisie').addEventListener('pointerdown', e => e.preventDefault());
$('#saisie').addEventListener('click', e => {
  const b = e.target.closest('[data-code]');
  const input = document.activeElement;
  if (!b || !input?.matches?.('.cellule, [data-niveau-ent], .cellule-choix')) return;
  if (input.dataset.seance) appliquerStatutEnt(input, b.dataset.code); // entraînement : statut de l'élève sur la séance
  else { input.value = b.dataset.code; valider(input); }
  deplacer(input, 1, 0);
});

window.visualViewport?.addEventListener('resize', placerBarreSaisie);
window.visualViewport?.addEventListener('scroll', placerBarreSaisie);

// Même carnet ouvert dans deux onglets : on se resynchronise.
Donnees.surAutreOnglet(() => lancer(async () => { await Donnees.charger(); rendre(); }));

// Fermeture avec des modifications pas encore sur la clé : le navigateur demande confirmation
// (sur ordinateur, seulement si le carnet a déjà été sauvegardé une fois sur la clé).
window.addEventListener('beforeunload', e => {
  if (aEnregistrer() && (!Cle.accesDirect || Donnees.meta().dernierEnvoi)) e.preventDefault();
});

// Tablette : retour dans l'appli (après être passé à une autre appli) → rappel si besoin.
document.addEventListener('visibilitychange', () => { if (!document.hidden) rappelerCle(); });

/* ---------- Démarrage ---------- */

(async () => {
  afficherVersion();
  try {
    await Donnees.charger();
  } catch (e) {
    console.error(e);
    toast('Impossible de lire les données de cet appareil. Restaure ton carnet depuis la clé (bouton 🔑).', 'erreur');
    await Donnees.charger().catch(() => {});
  }
  migrerTout();
  Donnees.surChangement(majPastille);
  Donnees.surChangement(planifierSauvegardeAuto);
  rendre();
  rappelerCle();
  if (!ui.guideVu) lancer(afficherGuide); // premier lancement sur cet appareil : on explique le principe de la clé
  navigator.storage?.persist?.().catch(() => {});
  enregistrerServiceWorker();
  surveillerMisesAJour();
})();
