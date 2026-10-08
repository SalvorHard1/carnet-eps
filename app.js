'use strict';
const VERSION_APP = '0.19.1'; // garder identique à VERSION dans sw.js

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

function classesTriees() {
  return Donnees.liste('classes').sort((a, b) => collator.compare(a.nom, b.nom));
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
    <li class="${c.id === active?.id ? 'active' : ''}">
      <button class="classe" data-classe="${c.id}">
        <span class="classe-nom">${esc(c.nom)}</span>
        <span class="classe-info">${esc(c.niveau || '')}${c.niveau ? ' · ' : ''}${elevesDe(c.id).length} élèves</span>
      </button>
      ${c.id === active?.id ? `<button class="modif" data-modif-classe="${c.id}" title="Modifier la classe" aria-label="Modifier la classe">✎</button>` : ''}
    </li>`).join('') || '<li class="aide">Aucune classe</li>';
}

function rendreVue() {
  const v = $('#vue');
  const c = classeActive();
  if (!c) {
    v.innerHTML = `
      <div class="vide">
        <h2>Bienvenue dans ton carnet EPS</h2>
        <p>Commence par créer ta première classe.</p>
        <button class="primaire" data-action="ajout-classe">+ Nouvelle classe</button>
        <p class="aide">Tu as déjà un carnet sur ta clé USB ? <button class="lien" data-action="cle">Ouvre-le ici</button>.</p>
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
    + (el.bep ? ` <button class="badge-bep" data-voir-besoin="bep" data-id="${el.id}" title="Voir le BEP">BEP</button>` : '')    + badgeDispenseGrille(el)
    + (el.adapte ? ' <span class="badge-adapte-grille">ADAPTÉ</span>' : '')
    + '</th>';
}

function htmlNotes(c) {
  const eleves = elevesDe(c.id);
  const evals = evalsDe(c.id);
  if (!eleves.length) {
    return `<div class="vide"><h2>${esc(c.nom)}</h2><p>Pas encore d’élèves dans cette classe.</p>
      <button class="primaire" data-action="vue-eleves">Ajouter des élèves</button></div>`;
  }
  return `
    <div class="outils">
      <h2>${esc(c.nom)}</h2>
      <button class="primaire" data-action="ajout-eval">+ Évaluation</button>
      <button data-modif-classe="${c.id}" title="Régler la correspondance note → degré de maîtrise pour cette classe">⚙ Note → degré
        <span class="aide">(${seuilsClasse(c).map(fmt).join(' / ')})</span></button>
      <span class="aide aide-saisie">Saisie : note, ou <b>A</b> absent · <b>D</b> dispensé · <b>NE</b> non noté — Entrée = élève suivant</span>
    </div>
    ${evals.length ? '' : '<p class="aide">Crée une évaluation pour commencer à noter.</p>'}
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
          <th class="col-moy" rowspan="2">Moyenne<div class="eval-info">/20</div></th>
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
            <td class="col-moy" data-moy-eleve="${el.id}"></td>
          </tr>`;
          }).join('')}
          ${evals.some(e => competencesEval(e).length) ? `
          <tr class="ligne-repartition">
            <th class="col-nom">Répartition</th>
            ${evals.map(e => `<td></td>
              ${competencesEval(e).map(a => `<td class="bilan-comp" data-bilan="${e.id}|${esc(a.id)}"></td>`).join('')}`).join('')}
            <td class="col-moy"></td>
          </tr>` : ''}
        </tbody>
        <tfoot><tr>
          <th class="col-nom">Moyenne de la classe</th>
          ${evals.map(e => `<td data-moy-eval="${e.id}"></td>
            ${competencesEval(e).map(a => `<td class="bilan-mini" data-bilan-barre="${e.id}|${esc(a.id)}"></td>`).join('')}`).join('')}
          <td class="col-moy" data-moy-classe></td>
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
  const eleves = elevesDe(c.id), evals = evalsDe(c.id), moyennes = [];
  for (const el of eleves) {
    const m = moyenneEleve(el.id, evals);
    if (m !== null) moyennes.push(m);
    const td = $(`[data-moy-eleve="${el.id}"]`);
    if (td) td.textContent = fmt(m);
  }
  for (const e of evals) {
    const td = $(`[data-moy-eval="${e.id}"]`);
    if (td) td.textContent = fmt(moyenneEval(e, eleves));
  }
  const tdClasse = $('[data-moy-classe]');
  if (tdClasse) tdClasse.textContent = fmt(moyennes.length ? moyennes.reduce((a, b) => a + b, 0) / moyennes.length : null);
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
            <td class="case-bep" data-label="BEP">${boutonBesoin(el, 'bep')}</td>            <td class="case-disp" data-label="Dispense / adapté">
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
    etatAuto === 'encours' ? ['encours', 'Sauvegarde…', 'Enregistrement sur la clé en cours']
    : !m.dernierEnvoi ? ['jamais', 'Sauvegarder', 'Ce carnet n’a encore jamais été sauvegardé sur la clé — cliquer pour sauvegarder']
    : m.modifieLe <= m.dernierEnvoi ? ['ok', 'À jour · ' + heure(m.dernierEnvoi), 'Dernière sauvegarde sur la clé : ' + dateHeure(m.dernierEnvoi)]
    : etatAuto === 'erreur' ? ['erreur', 'Clé absente ?', 'Sauvegarde impossible : branche la clé puis clique ici']
    : ['attente', 'À sauvegarder', 'Des modifications ne sont pas encore sur la clé — cliquer pour sauvegarder'];
  const b = $('#btn-sauver');
  b.className = 'sauver etat-' + etat;
  b.title = info;
  $('#etat-cle').textContent = texte;
}

/* ---------- Tablette : rappel d'enregistrer sur la clé ----------
   Sur tablette, rien ne part tout seul sur la clé, et le navigateur ne laisse pas toujours retenir la fermeture.
   Un bandeau le rappelle au lancement et à chaque retour dans l'appli, tant que des modifications n'y sont pas. */

const aEnregistrer = () => { const m = Donnees.meta(); return m.modifieLe > m.dernierEnvoi; };

function majRappelCle(montrer = false) {
  const r = $('#rappel-cle');
  if (Cle.accesDirect || !aEnregistrer()) r.hidden = true; // ordinateur (sauvegarde auto) ou tout est sur la clé
  else if (montrer) r.hidden = false;
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
    for (const el of elevesDe(id)) Donnees.supprimer('eleves', el.id);
    for (const e of evalsDe(id)) Donnees.supprimer('evals', e.id);
    for (const s of seancesDe(id)) Donnees.supprimer('seances', s.id);
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
    if (await confirmer(`Supprimer l’évaluation « ${e.titre} » et toutes ses notes ?`)) Donnees.supprimer('evals', id);
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
  Donnees.supprimer('eleves', id);
  rendre();
}

/* ---------- Clé USB ---------- */

async function obtenirMdp(nouveau) {
  if (mdpSession) return mdpSession;
  const { resultat } = ouvrirModale(nouveau ? 'Mot de passe du carnet' : 'Déverrouiller le carnet', `
    <p class="aide">${nouveau
    ? 'Il chiffre le fichier sur la clé : si tu la perds, personne ne peut lire les données des élèves. <b>Note-le bien</b> : sans lui, impossible de récupérer le carnet.'
    : 'Le mot de passe du fichier enregistré sur la clé.'}</p>
    <label>Mot de passe<input type="password" name="mdp" required autofocus minlength="${nouveau ? 6 : 1}" autocomplete="${nouveau ? 'new-password' : 'current-password'}"></label>
    ${nouveau ? '<label>Confirmer<input type="password" name="mdp2" required autocomplete="new-password"></label>' : ''}`,
  boutonsModale('Valider'));
  const r = await resultat;
  if (r.action !== 'ok') throw new Annule();
  if (nouveau && r.data.mdp !== r.data.mdp2) {
    toast('Les deux mots de passe ne correspondent pas.', 'erreur');
    return obtenirMdp(nouveau);
  }
  mdpSession = r.data.mdp;
  return mdpSession;
}

// Déchiffre un fichier de la clé et le fusionne avec le carnet de cet appareil.
async function importerTexte(texte) {
  for (;;) {
    const mdp = await obtenirMdp(false);
    try {
      const n = Donnees.fusionner(await Cle.dechiffrer(texte, mdp));
      migrerCodes();
      migrerNoms();
      migrerSeuils();
      migrerSeances();
      migrerGroupes();
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
  let mdp, n = 0;
  if (texte.trim()) ({ mdp, n } = await importerTexte(texte));
  else mdp = await obtenirMdp(true);
  const sortie = await Cle.chiffrer(Donnees.exporter(), mdp);
  let nomCopie = null;
  try {
    await Cle.ecrire(h, sortie);
    if (copie) nomCopie = await Cle.copieDatee(dossier, sortie);
  } catch {
    throw new Error('Impossible d’écrire sur la clé (retirée ou protégée en écriture ?).');
  }
  if (copie) {
    try { await Cle.nettoyerCopies(dossier); } catch (e) { console.warn('Ménage des copies datées impossible :', e); }
  }
  if (!silencieux) etatAuto = null;
  Donnees.marquerEnvoi();
  if (silencieux && !n) return; // ne pas redessiner : la saisie en cours n'est pas interrompue
  rendre();
  if (silencieux) return;
  const recup = n ? ` · ${n} élément${n > 1 ? 's' : ''} récupéré${n > 1 ? 's' : ''} de la clé` : '';
  toast(`Sauvegardé dans « ${dossier.name} » ✔${nomCopie ? ' + copie datée' : ''}${recup}`, 'ok');
}

// Bouton 💾 : sur ordinateur, enregistre dans le dossier de la clé (choisi la première fois) ;
// sur tablette, prépare le fichier à enregistrer sur la clé.
async function sauvegarder() {
  if (!Cle.accesDirect) return exporterTablette();
  let dossier = await Cle.dossierMemorise();
  if (!dossier) dossier = await choisirDossierCle();
  await synchroniser(dossier, { copie: true });
}

async function choisirDossierCle() {
  const dossier = await Cle.choisirDossier();
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
    if (!dossier || (await dossier.queryPermission({ mode: 'readwrite' })) !== 'granted') return;
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
const CONSIGNES_TABLETTE = {
  enregistrer: 'Touche le bouton ci-dessous : dans la fenêtre qui s’ouvre, choisis ta <b>clé USB</b>, dossier <b>Claude</b>, et remplace l’ancien <b>carnet-eps.json</b>.',
  partager: 'Touche le bouton ci-dessous, choisis <b>« Enregistrer dans Fichiers »</b>, ouvre ta clé USB (dossier <b>Claude</b>) et remplace l’ancien <b>carnet-eps.json</b>.',
  telecharger: 'Touche le bouton ci-dessous : <b>carnet-eps.json</b> arrive dans <b>Téléchargements</b>. Avec l’appli <b>Fichiers</b>, déplace-le ensuite sur ta clé USB, dans le dossier <b>Claude</b>, en remplaçant l’ancien.',
};

async function exporterTablette() {
  const texte = await Cle.chiffrer(Donnees.exporter(), await obtenirMdp(!mdpSession));
  const { d } = ouvrirModale('Fichier prêt', `<p>${CONSIGNES_TABLETTE[Cle.modeTablette]}</p>`,
    '<span class="espace"></span><button type="button" data-fermer>Annuler</button><button type="button" class="primaire" data-partager>Enregistrer sur la clé</button>');
  $('[data-partager]', d).addEventListener('click', () => {
    Cle.enregistrerSurCle(texte).then(fait => {
      if (!fait) return; // fenêtre fermée sans enregistrer : on peut réessayer
      Donnees.marquerEnvoi();
      d.fermer();
      toast(Cle.modeTablette === 'telecharger' ? 'Fichier dans Téléchargements ✔ — pense à le déplacer sur la clé.' : 'Fichier enregistré sur la clé ✔', 'ok');
    }).catch(signalerErreur);
  });
}

async function panneauCle() {
  const dossier = await Cle.dossierMemorise();
  const m = Donnees.meta();
  const etat = m.dernierEnvoi
    ? `Dernière sauvegarde sur la clé : <b>${dateHeure(m.dernierEnvoi)}</b>${m.modifieLe > m.dernierEnvoi ? '<br><span class="attention">Des modifications ne sont pas encore sur la clé.</span>' : ''}`
    : '<span class="attention">Ce carnet n’a encore jamais été sauvegardé sur la clé.</span>';
  const importer = (libelle, classe = '') => `<label class="bouton ${classe}">${libelle}<input type="file" accept=".json,application/json" data-importer hidden></label>`;

  const corps = `
    <p>${etat}</p>
    ${Cle.accesDirect ? `
      ${dossier ? `
        <p class="aide">Dossier de sauvegarde : <b>${esc(dossier.name)}</b> (carnet-eps.json + sous-dossier Sauvegardes)</p>
        <button type="button" class="primaire large" data-cle="sauver">💾 Sauvegarder maintenant</button>
        <p class="aide">Récupère les modifications déjà sur la clé, les fusionne avec celles de cet ordinateur, enregistre le tout et ajoute une copie datée.
          Ensuite, chaque modification est <b>enregistrée automatiquement sur la clé</b> tant qu’elle est branchée.</p>`
      : `
        <button type="button" class="primaire large" data-cle="sauver">Choisir le dossier de la clé et sauvegarder</button>
        <p class="aide">Choisis le dossier <b>Claude</b> de ta clé USB. Si un carnet s’y trouve déjà, il est récupéré. L’ordinateur s’en souviendra pour les prochaines fois.</p>`}`
    : `
      <ol class="etapes">
        <li>${importer('① Importer depuis la clé', 'primaire large')}<span class="aide">Récupère les modifications faites sur un autre appareil.</span></li>
        <li><button type="button" class="primaire large" data-cle="exporter">② Enregistrer sur la clé</button><span class="aide">Enregistre ce carnet sur la clé.</span></li>
      </ol>`}
    <div class="bloc-version">
      <span>Carnet EPS S-A —<b>version ${VERSION_APP}</b></span>
      <button type="button" data-cle="maj-appli" title="Recharge la dernière version de l’appli (tes données ne sont pas touchées)">🔄 Mettre à jour l’appli</button>
    </div>
    <details>
      <summary>Autres options</summary>
      <div class="options">
        ${Cle.accesDirect ? `
          ${dossier ? '<button type="button" data-cle="changer">Choisir un autre dossier</button>' : ''}
          ${importer('Restaurer / importer un fichier de sauvegarde')}` : ''}
        ${mdpSession ? '<button type="button" data-cle="verrouiller">Oublier le mot de passe</button>' : ''}
        <p class="aide">Données stockées uniquement sur cet appareil et sur ta clé.</p>
      </div>
    </details>`;

  const { d } = ouvrirModale('Sauvegarde sur clé USB', corps, '<span class="espace"></span><button type="button" data-fermer>Fermer</button>');
  const occupe = async action => {
    d.classList.add('occupe');
    try { await action(); d.fermer(); } catch (e) { signalerErreur(e); } finally { d.classList.remove('occupe'); }
  };

  d.addEventListener('click', ev => {
    const b = ev.target.closest('[data-cle]');
    if (!b) return;
    switch (b.dataset.cle) {
      case 'sauver': return occupe(sauvegarder);
      case 'maj-appli': return lancer(forcerMiseAJour);
      case 'changer': return occupe(async () => synchroniser(await choisirDossierCle(), { copie: true }));
      case 'exporter': return occupe(exporterTablette);
      case 'verrouiller': mdpSession = null; toast('Mot de passe oublié pour cette session.'); return d.fermer();
    }
  });
  d.querySelector('[data-importer]')?.addEventListener('change', ev => {
    const f = ev.target.files[0];
    if (f) occupe(() => importerFichier(f));
  });
}

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
    case 'cle': return lancer(panneauCle);
    case 'sauvegarder': return lancer(sauvegarder);
    case 'maj-appli': return lancer(boutonVersion);
    case 'ajout-classe': basculerMenu(false); return lancer(() => editerClasse());
    case 'ajout-eval': return lancer(() => editerEval());
    case 'ajout-seance': return lancer(() => editerSeance());
    case 'ajout-eleve': return lancer(ajouterEleve);
    case 'coller-liste': return lancer(collerListe);
    case 'vue-eleves': ui.vue = 'eleves'; memoriserUi(); return rendre();
    case 'rappel-plus-tard': $('#rappel-cle').hidden = true; return;
  }
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
  const info = e.target.closest('.grille .sous-comp, .grille tbody .col-nom[title], .legende-item, .grille .bilan-comp[title], .grille .bilan-mini[title]');
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
document.addEventListener('visibilitychange', () => { if (!document.hidden) majRappelCle(true); });

/* ---------- Démarrage ---------- */

(async () => {
  afficherVersion();
  try {
    await Donnees.charger();
  } catch (e) {
    console.error(e);
    toast('Impossible de lire les données de cet appareil. Restaure ton carnet depuis la clé (bouton ⋯).', 'erreur');
    await Donnees.charger().catch(() => {});
  }
  migrerCodes();
  migrerNoms();
  migrerSeuils();
  migrerSeances();
  migrerGroupes();
  $('#fichier-restaurer').addEventListener('change', ev => {
    const f = ev.target.files[0];
    ev.target.value = ''; // pour pouvoir réimporter le même fichier
    if (f) lancer(() => importerFichier(f));
  });
  Donnees.surChangement(majPastille);
  Donnees.surChangement(planifierSauvegardeAuto);
  Donnees.surChangement(() => majRappelCle()); // disparaît dès que tout est sur la clé
  rendre();
  majRappelCle(true);
  navigator.storage?.persist?.().catch(() => {});
  enregistrerServiceWorker();
  surveillerMisesAJour();
})();
