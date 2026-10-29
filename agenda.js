'use strict';
// Onglet « Agenda » : la programmation de l'année.
//   Frise de l'année (une ligne par classe) et calendrier du mois, avec les séquences (APSA, CA, dates),
//   les conseils de classe, les événements (cross, UNSS, sorties…), les vacances, les évaluations de l'onglet Notes
//   et les fins de période. Chaque prof choisit ce qui s'affiche (pastilles « Afficher », gardées dans son carnet).
// Rangement (tout est dans le carnet, donc chiffré sur la clé avec le reste) :
//   collection `agenda`  : { id, type: 'sequence' | 'conseil' | 'evenement', classeId ('' = tout le collège),
//                            apsa, ca, titre, typeEv, debut, fin, heure, objectifs, evaluation, notes }
//   réglage `agenda`     : { debut, fin, vacances: [{ nom, debut, fin }], types: [{ id, nom, couleur }], afficher }
//   fiche de la classe   : creneaux: [{ jour (1 = lundi), debut: 'HH:MM', fin, lieu }] (emploi du temps, semaine type)
// (Fichier chargé avant app.js : il n'utilise les outils d'app.js qu'au moment des appels.)

const AFFICHAGES_AGENDA = {
  sequences: 'Séquences', vacances: 'Vacances', conseils: 'Conseils de classe', evenements: 'Événements',
  evaluations: 'Évaluations', periodes: 'Fins de période',
};
const TYPES_EVENEMENTS_DEFAUT = [
  { id: 'competition', nom: 'Cross / compétition', couleur: '#a3306e' },
  { id: 'unss', nom: 'UNSS / AS', couleur: '#1f5f9e' },
  { id: 'sortie', nom: 'Sortie', couleur: '#0f6670' },
  { id: 'reunion', nom: 'Réunion', couleur: '#5b3fa0' },
  { id: 'autre', nom: 'Autre', couleur: '#3d4a52' },
];
// Types proposés tant que l'enseignant n'a pas réglé les siens : ceux de la discipline (SVT : sorties de terrain, labo…).
const typesEvenementsDefaut = () => profil().typesEvenements || TYPES_EVENEMENTS_DEFAUT;
const JOURS_SEMAINE = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MOIS_LONGS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/* ---------- Dates ---------- */

const dateAg = iso => new Date(iso + 'T12:00');
const isoAg = d => d.toLocaleDateString('sv');
const plusJoursAg = (iso, n) => { const d = dateAg(iso); d.setDate(d.getDate() + n); return isoAg(d); };
const jourSemaineAg = iso => ((dateAg(iso).getDay() + 6) % 7) + 1; // 1 = lundi … 7 = dimanche
const lundiAg = iso => plusJoursAg(iso, 1 - jourSemaineAg(iso));
const dateLongueAg = iso => dateAg(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
const heureCourteAg = h => (h ? h.replace(/^0/, '').replace(':00', 'h').replace(':', 'h') : '');

/* ---------- Semaines paires / impaires (ou A / B) ----------
   Un créneau peut n'avoir lieu qu'une semaine sur deux : `semaine` = 'paire' ou 'impaire' (numéro de semaine
   du calendrier, comme dans les agendas). Le réglage `semaines` permet de les appeler A / B à la place. */
function semaineIso(iso) {
  const [a, m, j] = iso.split('-').map(Number), d = new Date(Date.UTC(a, m - 1, j)), n = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - n);
  return Math.ceil(((d - Date.UTC(d.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7);
}
const pariteAg = iso => (semaineIso(iso) % 2 ? 'impaire' : 'paire');
const creneauLe = (x, iso) => !x.semaine || x.semaine === pariteAg(iso);
// Nom court d'une semaine : « paire » / « impaire », ou « A » / « B ».
const nomSemaine = (parite, r) => (r.semaines.nommage === 'AB' ? (parite === r.semaines.A ? 'A' : 'B') : parite);
const libelleSemaine = (parite, r) => (!parite ? 'Chaque semaine'
  : r.semaines.nommage === 'AB' ? `Semaine ${nomSemaine(parite, r)} (${parite}s)` : `Semaines ${parite}s`);
// « Sem. A », « semaine paire », « S. impaire »… écrit dans une case de l'emploi du temps → 'paire' / 'impaire'.
function semaineDuTexte(texte, r) {
  const t = sansAccent(texte);
  const m = /\bsem(?:aine)?s?\.?\s*(paires?|impaires?|a|b)\b/.exec(t) || /\b(paire|impaire)s?\b/.exec(t);
  if (!m) return '';
  if (m[1].startsWith('impaire')) return 'impaire';
  if (m[1].startsWith('paire')) return 'paire';
  const autre = r.semaines.A === 'paire' ? 'impaire' : 'paire';
  return m[1] === 'a' ? r.semaines.A : autre;
}

/* ---------- Réglage de l'agenda ---------- */

function anneeScolaireAg() {
  const auj = aujourdhui(), a = +auj.slice(0, 4) - (+auj.slice(5, 7) < 8 ? 1 : 0);
  return { debut: `${a}-09-01`, fin: `${a + 1}-07-04` };
}
function reglageAgenda() {
  const r = Donnees.get('reglages', 'agenda') || {}, d = anneeScolaireAg();
  return {
    debut: r.debut || d.debut, fin: r.fin || d.fin, vacances: r.vacances || [],
    types: r.types?.length ? r.types : typesEvenementsDefaut(),
    afficher: { ...Object.fromEntries(Object.keys(AFFICHAGES_AGENDA).map(k => [k, true])), ...(r.afficher || {}) },
    semaines: { nommage: r.semaines?.nommage === 'AB' ? 'AB' : 'parite', A: r.semaines?.A === 'paire' ? 'paire' : 'impaire' },
  };
}
// N'écrit que si quelque chose change.
function ecrireReglageAgenda(valeurs) {
  const avant = Donnees.get('reglages', 'agenda') || { id: 'agenda' };
  const apres = { ...avant, id: 'agenda', ...valeurs };
  if (JSON.stringify(avant) !== JSON.stringify(apres)) Donnees.ecrire('reglages', apres);
}

const elementsAgenda = (type, f = () => true) => Donnees.liste('agenda', x => x.type === type && f(x)).sort((a, b) => (a.debut || '').localeCompare(b.debut || ''));
const vacancesLe = (iso, r) => r.vacances.find(v => v.debut && v.fin && iso >= v.debut && iso <= v.fin);
const typeEvAg = (r, id) => r.types.find(t => t.id === id) || r.types.at(-1) || typesEvenementsDefaut().at(-1);
const classesAgenda = () => (ui.agClasse && Donnees.get('classes', ui.agClasse) ? [Donnees.get('classes', ui.agClasse)] : classesTriees());
const creneauxDe = c => trierCreneaux((c?.creneaux || []).slice());

// Cours de la semaine où a lieu une séquence : tous ceux de la classe, ou seulement ceux cochés dans la séquence
// (deux APSA en parallèle : Handball le lundi, Badminton le jeudi). `seq.cours` = clés « jour|début|semaine ».
const cleCreneau = x => `${x.jour}|${x.debut}|${x.semaine || ''}`;
function creneauxSeq(seq) {
  const cr = creneauxDe(Donnees.get('classes', seq.classeId));
  if (!seq.cours?.length) return cr;
  const choisis = cr.filter(x => seq.cours.includes(cleCreneau(x)));
  return choisis.length ? choisis : cr; // (emploi du temps changé depuis : on reprend tous les cours)
}
const libelleCreneau = (x, r) => `${JOURS_SEMAINE[x.jour - 1]} ${heureCourteAg(x.debut)}–${heureCourteAg(x.fin)}`
  + `${x.semaine ? ' (' + libelleSemaine(x.semaine, r).toLowerCase() + ')' : ''}${x.lieu ? ' · ' + x.lieu : ''}`;

// Leçons prévues dans une séquence : ses cours entre les deux dates, hors vacances (null sans emploi du temps).
function leconsPrevues(seq, r) {
  const cr = creneauxSeq(seq);
  if (!cr.length || !seq.debut || !seq.fin) return null;
  let n = 0;
  for (let d = seq.debut, garde = 0; d <= seq.fin && garde < 400; d = plusJoursAg(d, 1), garde++) {
    if (!vacancesLe(d, r)) n += cr.filter(x => +x.jour === jourSemaineAg(d) && creneauLe(x, d)).length;
  }
  return n;
}
const leconsFaites = seq => seancesDe(seq.classeId).filter(s => s.date >= seq.debut && s.date <= seq.fin).length;
// Où en est la séquence aujourd'hui : à venir, en cours (« leçon 3 sur 14 » d'après l'emploi du temps), terminée.
// { court (sur le bloc), detail (infobulle), etat ('avenir' | 'encours' | 'finie') }
function avancementSeq(seq, r) {
  const auj = aujourdhui(), p = leconsPrevues(seq, r), f = leconsFaites(seq);
  const lecon = motMin('lecon');
  const pl = n => `${n} ${lecon}${n > 1 ? 's' : ''}`;
  const notees = f ? ` · ${f} enregistrée${f > 1 ? 's' : ''} dans l’onglet ${mot('lecons')}` : '';
  if (auj < seq.debut) {
    const sem = Math.ceil((dateAg(lundiAg(seq.debut)) - dateAg(lundiAg(auj))) / 864e5 / 7);
    return { court: p ? pl(p) : '', etat: 'avenir',
      detail: `à venir : commence ${sem <= 0 ? 'cette semaine' : sem === 1 ? 'la semaine prochaine' : `dans ${sem} semaines`}${p ? `, ${pl(p)} prévue${p > 1 ? 's' : ''}` : ''}` };
  }
  if (auj > seq.fin) return { court: '✔', etat: 'finie', detail: `terminée${p ? ` (${pl(p)} prévue${p > 1 ? 's' : ''})` : ''}${notees}` };
  const n = p === null ? null : leconsPrevues({ ...seq, fin: auj }, r); // (créneaux passés, aujourd'hui compris)
  return { court: p ? `${n}/${p}` : 'en cours', etat: 'encours',
    detail: p ? `en cours : ${lecon} ${n} sur ${p} à ce jour${notees}` : `en cours${notees}` };
}

// Fins de période (trimestres / semestres de l'onglet Notes) placées dans l'année affichée.
function finsDePeriode(r) {
  const a0 = +r.debut.slice(0, 4);
  return periodesAnnee().filter(p => p.fin).map(p => ({ code: p.code, date: `${+p.fin.slice(0, 2) >= 8 ? a0 : a0 + 1}-${p.fin}` }));
}

/* ---------- Affichage ---------- */

function htmlAgenda() {
  const r = reglageAgenda(), vue = ['mois', 'semaine'].includes(ui.agVue) ? ui.agVue : 'frise';
  const classes = classesTriees();
  if (!classes.length) {
    return `<div class="vide"><h2>Agenda</h2><p>Crée d’abord une classe : l’agenda range les séquences classe par classe.</p>
      <button class="primaire" data-action="ajout-classe">+ Nouvelle classe</button></div>`;
  }
  const rien = !Donnees.liste('agenda').length && !r.vacances.length && !classes.some(c => c.creneaux?.length);
  return `
    <div class="barre-agenda">
      <div class="groupe-boutons" role="group" aria-label="Vue">
        <button data-ag="vue" data-arg="frise" class="${vue === 'frise' ? 'actif' : ''}" aria-pressed="${vue === 'frise'}">Frise de l’année</button>
        <button data-ag="vue" data-arg="mois" class="${vue === 'mois' ? 'actif' : ''}" aria-pressed="${vue === 'mois'}">Mois</button>
        <button data-ag="vue" data-arg="semaine" class="${vue === 'semaine' ? 'actif' : ''}" aria-pressed="${vue === 'semaine'}">Semaine</button>
      </div>
      <select data-ag-classe aria-label="Classes affichées">
        <option value="">Toutes les classes</option>
        ${classes.map(c => `<option value="${c.id}" ${ui.agClasse === c.id ? 'selected' : ''}>${esc(c.nom)}</option>`).join('')}
      </select>
      <span class="espace-outil"></span>
      <button class="primaire" data-ag="nouvelle-sequence">+ Séquence</button>
      <button data-ag="nouveau-conseil">+ Conseils de classe</button>
      <button data-ag="nouvel-evenement">+ Événement</button>
      <button data-ag="edt" title="Jours et heures de cours de chaque classe (import du PDF École Directe / Pronote possible)">🕒 Emploi du temps</button>
      <button data-ag="reglages" title="Dates de l’année, vacances, types d’événements, affichage">⚙ Année et vacances</button>
    </div>
    <div class="afficher-agenda"><span class="aide">Afficher :</span>
      ${Object.entries(AFFICHAGES_AGENDA).map(([k, nom]) => `<button class="pastille-ag${r.afficher[k] ? ' actif' : ''}" data-ag="afficher" data-arg="${k}" aria-pressed="${!!r.afficher[k]}">${nom}</button>`).join('')}
    </div>
    ${rien ? `<p class="aide astuce-agenda">Pour commencer : <b>🕒 Emploi du temps</b> (tu peux importer le PDF d’École Directe ou de Pronote), puis <b>⚙ Année et vacances</b>,
      et ajoute tes séquences. Un toucher sur une ligne de la frise crée une séquence à cette date.</p>` : ''}
    ${vue === 'frise' ? htmlFrise(r) : vue === 'mois' ? htmlMoisAg(r) : htmlSemaineAg(r)}
    ${htmlLegendeAg(r)}`;
}

function htmlLegendeAg(r) {
  const a = r.afficher, l = [];
  // (Couleur par champ d'apprentissage en EPS ; une seule couleur de séquence sinon.)
  if (a.sequences) l.push(...(profil().champsSequence ? ['CA1', 'CA2', 'CA3', 'CA4', 'CA5'].map(ca => `<span><span class="leg-ag ag-seq ca-${ca}"></span>${ca}</span>`)
    : ['<span><span class="leg-ag ag-seq"></span>Séquence</span>']));
  if (a.conseils) l.push('<span><span class="leg-ag ag-cc"></span>Conseil de classe</span>');
  if (a.evenements) l.push(...r.types.map(t => `<span><span class="leg-ag ag-ev" data-c="${esc(t.couleur)}"></span>${esc(t.nom)}</span>`));
  if (a.evaluations) l.push('<span><span class="ag-eval-leg">✎</span>Évaluation (onglet Notes)</span>');
  if (a.periodes) l.push('<span><span class="leg-ag ag-per"></span>Fin de période</span>');
  if (a.vacances) l.push('<span><span class="leg-ag ag-vac"></span>Vacances</span>');
  return l.length ? `<div class="legende-agenda">${l.join('')}</div>` : '';
}

// Frise : une ligne par classe, l'année en largeur ; les éléments sont placés en % (positions appliquées après le dessin).
function htmlFrise(r) {
  const total = Math.max(1, (dateAg(r.fin) - dateAg(r.debut)) / 864e5);
  const pos = iso => Math.max(0, Math.min(100, ((dateAg(iso) - dateAg(r.debut)) / 864e5 / total) * 100));
  const larg = (a, b) => Math.min(100 - pos(a), Math.max(0.4, pos(plusJoursAg(b, 1)) - pos(a)));
  const dans = (a, b) => b >= r.debut && a <= r.fin;
  const a = r.afficher, auj = aujourdhui();
  const mois = [];
  for (let d = r.debut.slice(0, 8) + '01'; d <= r.fin; d = isoAg(new Date(dateAg(d).getFullYear(), dateAg(d).getMonth() + 1, 1, 12))) {
    if (d >= r.debut || d.slice(0, 7) === r.debut.slice(0, 7)) mois.push(d < r.debut ? r.debut : d);
  }
  const fond = (classeId) => [
    a.vacances ? r.vacances.filter(v => v.debut && v.fin && dans(v.debut, v.fin)).map(v => `<div class="ag-vac" data-g="${pos(v.debut)}" data-l="${larg(v.debut, v.fin)}" title="${esc(v.nom || 'Vacances')}"></div>`).join('') : '',
    a.periodes ? finsDePeriode(r).filter(p => dans(p.date, p.date)).map(p => `<div class="ag-per" data-g="${pos(plusJoursAg(p.date, 1))}" title="Fin ${p.code} (${dateLongueAg(p.date)})"></div>`).join('') : '',
    auj >= r.debut && auj <= r.fin ? `<div class="ag-auj" data-g="${pos(auj)}" title="Aujourd’hui"></div>` : '',
    a.evenements ? elementsAgenda('evenement', e => (!e.classeId || e.classeId === classeId) && dans(e.debut, e.fin || e.debut)).map(e => {
      const t = typeEvAg(r, e.typeEv);
      return `<button class="ag-ev" data-ag-edit="${e.id}" data-c="${esc(t.couleur)}" data-g="${pos(e.debut)}" data-l="${larg(e.debut, e.fin || e.debut)}"
        title="${esc(`${e.titre} (${t.nom}) — ${dateLongueAg(e.debut)}${e.fin && e.fin !== e.debut ? ' → ' + dateLongueAg(e.fin) : ''}`)}" aria-label="${esc(e.titre)}"></button>`;
    }).join('') : '',
  ].join('');
  const ligneClasse = c => {
    const seqs = a.sequences ? elementsAgenda('sequence', s => s.classeId === c.id && dans(s.debut, s.fin)) : [];
    // Séquences qui se chevauchent (deux APSA en parallèle) : chacune sur sa propre sous-ligne, la ligne s'agrandit.
    const voies = [], voieDe = new Map();
    for (const s of seqs) {
      let v = voies.findIndex(fin => fin < s.debut);
      if (v < 0) { v = voies.length; voies.push(''); }
      voies[v] = s.fin;
      voieDe.set(s.id, v);
    }
    const hauteur = Math.max(1, voies.length) * 30 + 6;
    const ccs = a.conseils ? elementsAgenda('conseil', x => x.classeId === c.id && dans(x.debut, x.debut)) : [];
    const evs = a.evaluations ? evalsDe(c.id).filter(e => e.date && dans(e.date, e.date)) : [];
    return `<div class="frise-ligne">
      <span class="frise-nom">${esc(c.nom)}</span>
      <div class="frise-piste" data-ag-piste="${c.id}" data-h="${hauteur}" title="Toucher pour ajouter une séquence à cette date">
        ${fond(c.id)}
        ${seqs.map(s => { const av = avancementSeq(s, r); return `<button class="ag-seq ca-${s.ca || 'aucun'} seq-${av.etat}" data-ag-edit="${s.id}" data-g="${pos(s.debut)}" data-l="${larg(s.debut, s.fin)}" data-top="${5 + voieDe.get(s.id) * 30}"
          title="${esc(`${s.apsa}${s.ca ? ' (' + s.ca + ')' : ''} — ${dateLongueAg(s.debut)} → ${dateLongueAg(s.fin)} — ${av.detail}`)}">
          ${esc(s.apsa)}${av.court ? ` <small>${av.court}</small>` : ''}</button>`; }).join('')}
        ${ccs.map(x => `<button class="ag-cc" data-ag-edit="${x.id}" data-g="${pos(x.debut)}" title="${esc(`Conseil de classe — ${dateLongueAg(x.debut)}${x.heure ? ' ' + heureCourteAg(x.heure) : ''}`)}" aria-label="Conseil de classe"></button>`).join('')}
        ${evs.map(e => `<span class="ag-eval" data-g="${pos(e.date)}" title="${esc(`Évaluation : ${e.titre} — ${dateLongueAg(e.date)}`)}">✎</span>`).join('')}
      </div></div>`;
  };
  return `<div class="frise">
    <div class="frise-ligne frise-entete"><span class="frise-nom"></span><div class="frise-piste">
      ${mois.filter(d => pos(d) < 96).map(d => `<span class="frise-mois" data-g="${pos(d)}">${MOIS_COURTS[dateAg(d).getMonth()]}</span>`).join('')}</div></div>
    ${a.evenements && elementsAgenda('evenement', e => !e.classeId).length && !ui.agClasse ? `<div class="frise-ligne frise-college"><span class="frise-nom">Collège</span>
      <div class="frise-piste">${fond('')}</div></div>` : ''}
    ${classesAgenda().map(ligneClasse).join('')}
  </div>`;
}

// Calendrier du mois.
function htmlMoisAg(r) {
  const mois = /^\d{4}-\d{2}$/.test(ui.agMois || '') ? ui.agMois : aujourdhui().slice(0, 7);
  const premier = mois + '-01', a = r.afficher, classes = classesAgenda(), ids = new Set(classes.map(c => c.id));
  const debut = lundiAg(premier), auj = aujourdhui();
  const [an, m] = mois.split('-').map(Number);
  const dernier = isoAg(new Date(an, m, 0, 12));
  const fin = plusJoursAg(lundiAg(dernier), 6);
  const seqs = a.sequences ? elementsAgenda('sequence', s => ids.has(s.classeId)) : [];
  const nomClasse = id => Donnees.get('classes', id)?.nom || '';
  // Numéro et type de semaine, le lundi, dès qu'une classe a des cours une semaine sur deux.
  const alterne = classes.some(c => creneauxDe(c).some(x => x.semaine));
  const cases = [];
  for (let d = debut; d <= fin; d = plusJoursAg(d, 1)) {
    // (vacances masquées : plus de grisé, mais toujours pas de cours ces jours-là)
    const sansCours = vacancesLe(d, r), vac = a.vacances ? sansCours : null, js = jourSemaineAg(d), its = [];
    if (vac && (d === vac.debut || d === debut || d === premier)) its.push(`<span class="ag-it ag-it-vac">${esc(vac.nom || 'Vacances')}</span>`);
    if (a.periodes) finsDePeriode(r).filter(p => p.date === d).forEach(p => its.push(`<span class="ag-it ag-it-per">Fin ${p.code}</span>`));
    if (a.conseils) elementsAgenda('conseil', x => x.debut === d && ids.has(x.classeId)).forEach(x => its.push(
      `<button class="ag-it ag-it-cc" data-ag-edit="${x.id}">${x.heure ? heureCourteAg(x.heure) + ' ' : ''}Conseil ${esc(nomClasse(x.classeId))}</button>`));
    if (a.evenements) elementsAgenda('evenement', e => d >= e.debut && d <= (e.fin || e.debut) && (!e.classeId || ids.has(e.classeId))).forEach(e => its.push(
      `<button class="ag-it ag-it-ev" data-ag-edit="${e.id}" data-c="${esc(typeEvAg(r, e.typeEv).couleur)}">${e.heure && d === e.debut ? heureCourteAg(e.heure) + ' ' : ''}${esc(e.titre)}</button>`));
    if (a.evaluations) classes.forEach(c => evalsDe(c.id).filter(e => e.date === d).forEach(e => its.push(`<span class="ag-it ag-it-eval">✎ ${esc(c.nom)} ${esc(e.titre)}</span>`)));
    if (!sansCours) {
      for (const s of seqs.filter(s => d >= s.debut && d <= s.fin)) {
        const c = Donnees.get('classes', s.classeId), cr = creneauxSeq(s);
        // Avec un emploi du temps : la séquence apparaît sur chaque cours ; sans : le lundi (ou son premier jour).
        const cours = cr.length ? cr.filter(x => +x.jour === js && creneauLe(x, d)) : (js === 1 || d === s.debut || d === premier) && js < 6 ? [{}] : [];
        cours.forEach(x => its.push(`<button class="ag-it ag-seq ca-${s.ca || 'aucun'}" data-ag-edit="${s.id}">${x.debut ? heureCourteAg(x.debut) + ' ' : ''}${esc(c?.nom || '')} ${esc(s.apsa)}</button>`));
      }
    }
    cases.push(`<div class="ag-jour${d.slice(0, 7) !== mois ? ' hors-mois' : ''}${vac ? ' en-vacances' : ''}${d === auj ? ' aujourdhui' : ''}${js > 5 ? ' week-end' : ''}">
      <div class="ag-tete"><button class="ag-num" data-ag-jour="${d}" title="Ajouter un événement le ${dateLongueAg(d)}">${dateAg(d).getDate()}</button>
        ${alterne && js === 1 ? `<span class="ag-sem" title="Semaine n° ${semaineIso(d)}">S${semaineIso(d)} · ${esc(nomSemaine(pariteAg(d), r))}</span>` : ''}</div>${its.join('')}</div>`);
  }
  return `<div class="nav-mois-ag">
      <button data-ag="mois" data-arg="-1" aria-label="Mois précédent">‹</button>
      <b>${MOIS_LONGS[m - 1]} ${an}</b>
      <button data-ag="mois" data-arg="1" aria-label="Mois suivant">›</button>
      <button data-ag="mois" data-arg="0">Aujourd’hui</button>
    </div>
    <div class="calendrier-ag">${['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'].map(j => `<div class="ag-jour-nom">${j}</div>`).join('')}${cases.join('')}</div>`;
}

// Semaine : l'emploi du temps en grille (jours en colonnes, heures en lignes), pour une semaine précise :
// créneaux de la semaine (paire / impaire), séquence en cours de chaque classe, vacances, conseils et événements du jour.
const PX_HEURE = 52;
// Semaine affichée : celle choisie, sinon la semaine en cours (le week-end : la suivante).
const lundiAffiche = () => (/^\d{4}-\d{2}-\d{2}$/.test(ui.agSemaine || '') ? lundiAg(ui.agSemaine)
  : lundiAg(jourSemaineAg(aujourdhui()) > 5 ? plusJoursAg(aujourdhui(), 2) : aujourdhui()));
function htmlSemaineAg(r) {
  const auj = aujourdhui(), a = r.afficher, classes = classesAgenda(), ids = new Set(classes.map(c => c.id));
  const lundi = lundiAffiche();
  const tous = classes.flatMap(c => creneauxDe(c).map(x => ({ ...x, c })));
  const nav = `<div class="nav-mois-ag">
      <button data-ag="semaine" data-arg="-7" aria-label="Semaine précédente">‹</button>
      <b class="titre-semaine">Semaine du ${dateAg(lundi).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} au ${dateAg(plusJoursAg(lundi, 4)).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</b>
      <button data-ag="semaine" data-arg="7" aria-label="Semaine suivante">›</button>
      <button data-ag="semaine" data-arg="0">Cette semaine</button>
      <span class="aide">n° ${semaineIso(lundi)} · ${r.semaines.nommage === 'AB' ? 'semaine ' + nomSemaine(pariteAg(lundi), r) : 'semaine ' + pariteAg(lundi)}</span>
    </div>`;
  if (!tous.length) {
    return `${nav}<div class="vide-semaine"><p>Pas encore d’emploi du temps${ui.agClasse ? ' pour cette classe' : ''}.</p>
      <button class="primaire" data-ag="edt">🕒 Saisir ou importer l’emploi du temps</button></div>`;
  }
  const jours = [1, 2, 3, 4, 5, ...(tous.some(x => +x.jour === 6) ? [6] : [])];
  const minutes = h => +h.slice(0, 2) * 60 + +h.slice(3, 5);
  const h0 = Math.floor(Math.min(...tous.map(x => minutes(x.debut))) / 60), h1 = Math.ceil(Math.max(...tous.map(x => minutes(x.fin))) / 60);
  const y = h => ((minutes(h) - h0 * 60) / 60) * PX_HEURE, hauteur = (h1 - h0) * PX_HEURE;
  const seqs = elementsAgenda('sequence', s => ids.has(s.classeId));
  const colonnes = jours.map(j => {
    const d = plusJoursAg(lundi, j - 1), vac = vacancesLe(d, r);
    const dessus = [
      ...(a.conseils ? elementsAgenda('conseil', x => x.debut === d && ids.has(x.classeId)).map(x =>
        `<button class="ag-it ag-it-cc" data-ag-edit="${x.id}">${x.heure ? heureCourteAg(x.heure) + ' ' : ''}Conseil ${esc(Donnees.get('classes', x.classeId)?.nom || '')}</button>`) : []),
      ...(a.evenements ? elementsAgenda('evenement', e => d >= e.debut && d <= (e.fin || e.debut) && (!e.classeId || ids.has(e.classeId))).map(e =>
        `<button class="ag-it ag-it-ev" data-ag-edit="${e.id}" data-c="${esc(typeEvAg(r, e.typeEv).couleur)}">${esc(e.titre)}</button>`) : []),
      ...(a.evaluations ? classes.flatMap(c => evalsDe(c.id).filter(e => e.date === d).map(e => `<span class="ag-it ag-it-eval">✎ ${esc(c.nom)} ${esc(e.titre)}</span>`)) : []),
    ];
    // Cours du jour (vacances : aucun) ; deux cours au même moment se partagent la largeur. Un cours de l'autre
    // semaine (paire / impaire) reste visible à côté, en pâle : on voit l'alternance d'un coup d'œil.
    const cours = vac ? [] : tous.filter(x => +x.jour === j).map(x => ({ ...x, absent: !creneauLe(x, d) }))
      .sort((p, q) => p.debut.localeCompare(q.debut) || p.absent - q.absent);
    const voies = [];
    cours.forEach(x => { let v = voies.findIndex(f => f <= x.debut); if (v < 0) { v = voies.length; voies.push(''); } voies[v] = x.fin; x.voie = v; });
    const blocs = cours.map(x => {
      const s = seqs.find(q => q.classeId === x.c.id && d >= q.debut && d <= q.fin && creneauxSeq(q).some(y => cleCreneau(y) === cleCreneau(x)));
      const larg = 100 / Math.max(1, voies.length);
      return `<button class="cours-ag${s ? ' ag-seq ca-' + (s.ca || 'aucun') : ''}${x.absent ? ' hors-semaine' : ''}" ${s ? `data-ag-edit="${s.id}"` : 'data-ag="edt"'}
        data-top="${y(x.debut)}" data-h="${Math.max(18, y(x.fin) - y(x.debut) - 2)}" data-g="${x.voie * larg}" data-l="${larg}"
        title="${esc(`${x.c.nom} — ${heureCourteAg(x.debut)} à ${heureCourteAg(x.fin)}${x.lieu ? ' — ' + x.lieu : ''}${x.semaine ? ' — ' + libelleSemaine(x.semaine, r) : ''}${x.absent ? ' — pas cette semaine' : s ? ' — ' + s.apsa : ' — pas de séquence ce jour-là'}`)}">
        <b>${esc(x.c.nom)}</b>${a.sequences && s && !x.absent ? `<span class="apsa-cours">${esc(s.apsa)}</span>` : ''}
        <small>${heureCourteAg(x.debut)}–${heureCourteAg(x.fin)}${x.lieu ? ' · ' + esc(x.lieu) : ''}${x.semaine ? ' · ' + esc(nomSemaine(x.semaine, r)) : ''}</small>
        ${x.absent ? '<small class="pas-cette-semaine">pas cette semaine</small>' : ''}</button>`;
    }).join('');
    const maintenant = d === auj ? (() => { const n = new Date(), m = n.getHours() * 60 + n.getMinutes(); return m >= h0 * 60 && m <= h1 * 60 ? `<div class="maintenant-ag" data-top="${((m - h0 * 60) / 60) * PX_HEURE}"></div>` : ''; })() : '';
    return `<div class="jour-semaine${d === auj ? ' aujourdhui' : ''}${vac ? ' en-vacances' : ''}">
      <div class="tete-jour"><b>${JOURS_SEMAINE[j - 1].slice(0, 3)}. ${dateAg(d).getDate()}</b>${vac && a.vacances ? `<span class="ag-it ag-it-vac">${esc(vac.nom || 'Vacances')}</span>` : ''}${dessus.join('')}</div>
      <div class="corps-jour" data-h="${hauteur}">${blocs}${maintenant}</div></div>`;
  });
  const heures = Array.from({ length: h1 - h0 + 1 }, (_, k) => `<span class="heure-ag" data-top="${k * PX_HEURE}">${h0 + k}h</span>`).join('');
  return `${nav}<div class="semaine-ag">
    <div class="jour-semaine colonne-heures"><div class="tete-jour"></div><div class="corps-jour" data-h="${hauteur}">${heures}</div></div>
    ${colonnes.join('')}</div>`;
}

// Positions et couleurs : posées après le dessin (la page n'accepte pas de style écrit dans le HTML).
function apresAgenda() {
  document.querySelectorAll('#vue [data-g], #vue [data-c], #vue [data-h], #vue [data-top]').forEach(e => {
    if (e.dataset.g !== undefined) e.style.left = e.dataset.g + '%';
    if (e.dataset.l !== undefined) e.style.width = e.dataset.l + '%';
    if (e.dataset.top !== undefined) e.style.top = e.dataset.top + 'px';
    if (e.dataset.h !== undefined) e.style.height = e.dataset.h + 'px';
    if (e.dataset.c) e.style.setProperty('--c', e.dataset.c);
  });
}

/* ---------- Saisie : séquences ---------- */

// Premier jour de classe (ni week-end, ni vacances) à partir d'une date.
function prochainJourDeCours(iso, r) {
  let d = iso;
  for (let k = 0; k < 120 && (jourSemaineAg(d) > 5 || vacancesLe(d, r)); k++) d = plusJoursAg(d, 1);
  return d;
}
// La séquence précédente d'une classe (sur les mêmes cours si précisé) et la date qui la suit : pas besoin de la chercher.
function suiteDeSequence(classeId, cours, r, sauf) {
  const avant = elementsAgenda('sequence', q => q.classeId === classeId && q.id !== sauf
    && (!cours?.length || !q.cours?.length || q.cours.some(k => cours.includes(k))));
  const derniere = avant.sort((a, b) => a.fin.localeCompare(b.fin)).at(-1);
  return derniere ? { seq: derniere, debut: prochainJourDeCours(plusJoursAg(derniere.fin, 1), r) } : null;
}
// Date de la n-ième leçon à partir du début (cours de la séquence, vacances sautées) ; null sans emploi du temps.
function finPourLecons(seq, n, r) {
  const cr = creneauxSeq(seq);
  if (!cr.length || !(n > 0)) return null;
  let k = 0;
  for (let d = seq.debut, garde = 0; garde < 500; d = plusJoursAg(d, 1), garde++) {
    if (vacancesLe(d, r)) continue;
    k += cr.filter(x => +x.jour === jourSemaineAg(d) && creneauLe(x, d)).length;
    if (k >= n) return d;
  }
  return null;
}

const optionsCa = ca => ['', 'CA1', 'CA2', 'CA3', 'CA4', 'CA5'].map(x => `<option value="${x}" ${x === (ca || '') ? 'selected' : ''}>${x || 'automatique'}</option>`).join('');

async function editerSequence(id, preset = {}) {
  const r = reglageAgenda(), classes = classesTriees();
  // (par défaut : à partir de ce lundi, ou du suivant le week-end ; six semaines)
  const auj = aujourdhui(), debut = preset.debut || (jourSemaineAg(auj) > 5 ? plusJoursAg(lundiAg(auj), 7) : lundiAg(auj));
  const s = id ? Donnees.get('agenda', id) : {
    type: 'sequence', classeId: preset.classeId || ui.agClasse || '', apsa: '', ca: '', objectifs: '', evaluation: '', notes: '',
    debut, fin: preset.fin || plusJoursAg(debut, 6 * 7 - 3),
  };
  if (!s) return;
  const { d, resultat } = ouvrirModale(id ? 'Séquence' : 'Nouvelle séquence', `
    ${id ? `<label>Classe<select name="classe">${classes.map(c => `<option value="${c.id}" ${c.id === s.classeId ? 'selected' : ''}>${esc(c.nom)}</option>`).join('')}</select></label>`
    : `<fieldset class="choix-classes-ag"><legend>Pour ${classes.length > 1 ? 'les classes' : 'la classe'}</legend>
        ${classes.map(c => `<label class="case"><input type="checkbox" name="classes" value="${c.id}" ${c.id === s.classeId || classes.length === 1 ? 'checked' : ''}> ${esc(c.nom)}</label>`).join('')}
      </fieldset>`}
    <div class="ligne">
      <label class="large">${esc(mot('activite'))}<input name="apsa" list="liste-apsa-ag" value="${esc(s.apsa)}" required autocomplete="off" placeholder="${esc(mot('sequenceExemple'))}"></label>
      <label ${profil().champsSequence ? '' : 'hidden'}>${esc(mot('champ'))}<select name="ca">${optionsCa(s.ca)}</select></label>
    </div>
    <datalist id="liste-apsa-ag">${activitesDiscipline().map(x => `<option value="${esc(x)}">`).join('')}</datalist>
    <div class="ligne">
      <label>Du<input type="date" name="debut" value="${s.debut}" required></label>
      <label>Au<input type="date" name="fin" value="${s.fin}" required></label>
      <label class="etroit" title="Tape un nombre de ${esc(mot('lecons').toLocaleLowerCase('fr'))} : la date de fin se calcule d’après l’emploi du temps">${esc(mot('lecons'))}<input type="number" name="nb" min="1" max="80" step="1" inputmode="numeric"></label>
    </div>
    <p class="aide" data-ag-suite></p>
    ${classes.filter(c => creneauxDe(c).length > 1).map(c => `<fieldset class="cours-seq-ag" data-cours-classe="${c.id}" hidden>
      <legend>Cours de la séquence — ${esc(c.nom)}</legend>
      <p class="aide">${esc(mot('deuxActivites'))}</p>
      ${creneauxDe(c).map(x => `<label class="case"><input type="checkbox" name="cours-${c.id}" value="${esc(cleCreneau(x))}"
        ${!(c.id === s.classeId && s.cours?.length) || s.cours.includes(cleCreneau(x)) ? 'checked' : ''}> ${esc(libelleCreneau(x, r))}</label>`).join('')}
    </fieldset>`).join('')}
    <p class="aide" data-ag-prevues></p>
    <label>Objectifs, attendus visés<textarea name="objectifs" rows="3">${esc(s.objectifs || '')}</textarea></label>
    <label>Évaluation prévue<input name="evaluation" value="${esc(s.evaluation || '')}" placeholder="${esc(mot('evalSequenceExemple'))}"></label>
    <label>Notes (installation, matériel…)<textarea name="notes" rows="2">${esc(s.notes || '')}</textarea></label>
    ${id && classes.length > 1 ? `<details class="copier-ag"><summary>Copier cette séquence pour d’autres classes</summary>
      ${classes.filter(c => c.id !== s.classeId).map(c => `<label class="case"><input type="checkbox" name="copies" value="${c.id}"> ${esc(c.nom)}</label>`).join('')}</details>` : ''}`,
  boutonsModale('Enregistrer', id ? BOUTON_SUPPRIMER : ''));
  // Leçons prévues, recalculées quand on change les dates, la classe ou les cours cochés ;
  // les cours à cocher n'apparaissent que pour les classes choisies.
  const majPrevues = () => {
    const f = new FormData($('form', d)), choisies = f.get('classe') ? [f.get('classe')] : f.getAll('classes'), classeId = choisies[0];
    d.querySelectorAll('[data-cours-classe]').forEach(fs => { fs.hidden = !choisies.includes(fs.dataset.coursClasse); });
    const essai = { classeId, debut: f.get('debut'), fin: f.get('fin'), cours: f.getAll('cours-' + classeId) };
    const n = classeId && essai.debut && essai.fin ? leconsPrevues(essai, r) : null;
    // Une autre séquence de la classe sur les mêmes cours, aux mêmes dates : le compte serait double.
    const memes = classeId && essai.debut && essai.fin ? elementsAgenda('sequence', q => q.id !== id && q.classeId === classeId
      && q.debut <= essai.fin && q.fin >= essai.debut && creneauxSeq(q).some(x => creneauxSeq(essai).some(y => cleCreneau(x) === cleCreneau(y)))) : [];
    $('[data-ag-prevues]', d).textContent = !classeId ? ''
      : n === null ? `Indique l’emploi du temps de la classe (🕒) pour voir le nombre de ${motMin('lecons')} prévues.`
        : `${n} ${motMin('lecon')}${n > 1 ? 's' : ''} prévue${n > 1 ? 's' : ''} d’après l’emploi du temps (vacances déduites)`
          + (essai.debut <= aujourdhui() ? `, dont ${leconsPrevues({ ...essai, fin: essai.fin < aujourdhui() ? essai.fin : aujourdhui() }, r)} déjà passée(s) à ce jour.` : '.')
          + (memes.length ? ` ⚠ En même temps que « ${memes.map(q => q.apsa).join(' », « ')} » sur les mêmes cours : coche seulement les cours de ${mot('cetteActivite')}.` : '');
  };
  // Dates proposées d'après les séquences déjà saisies, et fin calculée d'après le nombre de leçons.
  const champ = n => $(`[name="${n}"]`, d);
  const seqForm = () => {
    const f = new FormData($('form', d)), classeId = f.get('classe') || f.getAll('classes')[0];
    return { classeId, debut: f.get('debut'), fin: f.get('fin'), cours: f.getAll('cours-' + classeId) };
  };
  const majNb = () => { const e = seqForm(), n = e.classeId && e.debut && e.fin ? leconsPrevues(e, r) : null; champ('nb').value = n ?? ''; };
  const appliquerNb = () => {
    const e = seqForm(), fin = finPourLecons(e, +champ('nb').value, r);
    if (fin) champ('fin').value = fin;
    else if (+champ('nb').value) toast('Indique d’abord l’emploi du temps de la classe (🕒) pour calculer la fin.', 'erreur');
  };
  let debutChoisi = !!(id || preset.debut);
  const proposerDebut = () => {
    const e = seqForm(), suite = e.classeId ? suiteDeSequence(e.classeId, e.cours.length ? e.cours : null, r, id) : null;
    $('[data-ag-suite]', d).textContent = suite ? `Suite de « ${suite.seq.apsa} » (finie le ${dateLongueAg(suite.seq.fin)}).` : '';
    if (debutChoisi || !suite) return;
    champ('debut').value = suite.debut;
    // Même nombre de leçons que la séquence précédente (sinon six semaines).
    const nPrec = leconsPrevues(suite.seq, r), fin = nPrec ? finPourLecons({ ...seqForm(), debut: suite.debut }, nPrec, r) : null;
    champ('fin').value = fin || plusJoursAg(suite.debut, 6 * 7 - 3);
  };
  d.addEventListener('input', ev => { if (ev.target.name === 'debut') debutChoisi = true; });
  d.addEventListener('change', ev => {
    const n = ev.target.name;
    if (n === 'classes' || n === 'classe' || n?.startsWith('cours-')) proposerDebut();
    if (n === 'nb') appliquerNb();
    else if (n === 'debut' && +champ('nb').value) appliquerNb(); // (on garde le nombre de leçons, la fin suit)
    if (n !== 'nb') majNb();
    majPrevues();
  });
  proposerDebut();
  majNb();
  majPrevues();
  const res = await resultat;
  if (res.action === 'supprimer') {
    if (await confirmer(`Supprimer la séquence « ${s.apsa} » ?`)) Donnees.supprimer('agenda', id);
    return rendre();
  }
  if (res.action !== 'ok') return;
  const v = res.data;
  if (v.fin < v.debut) { toast('La fin est avant le début.', 'erreur'); return editerSequence(id, preset); }
  const cibles = id ? [v.classe] : res.fd.getAll('classes');
  if (!cibles.length) { toast('Choisis au moins une classe.', 'erreur'); return editerSequence(id, preset); }
  // Cours cochés pour chaque classe : rien de retenu s'ils le sont tous (= tous les cours, même si l'emploi du temps change).
  const coursDe = classeId => {
    const tous = creneauxDe(Donnees.get('classes', classeId)), coches = res.fd.getAll('cours-' + classeId);
    return tous.length > 1 && coches.length && coches.length < tous.length ? coches : [];
  };
  if (cibles.some(classeId => creneauxDe(Donnees.get('classes', classeId)).length > 1 && !res.fd.getAll('cours-' + classeId).length)) {
    toast('Coche au moins un cours de la semaine pour chaque classe.', 'erreur');
    return editerSequence(id, preset);
  }
  const valeurs = {
    type: 'sequence', apsa: v.apsa.trim(), ca: v.ca || caBrut(v.apsa), debut: v.debut, fin: v.fin,
    objectifs: v.objectifs.trim(), evaluation: v.evaluation.trim(), notes: v.notes.trim(),
  };
  if (id) Donnees.ecrire('agenda', { ...s, ...valeurs, classeId: v.classe, cours: coursDe(v.classe) });
  else cibles.forEach(classeId => Donnees.ecrire('agenda', { id: Donnees.nouvelId(), ...valeurs, classeId, cours: coursDe(classeId) }));
  const copies = id ? res.fd.getAll('copies') : [];
  copies.forEach(classeId => Donnees.ecrire('agenda', { id: Donnees.nouvelId(), ...valeurs, classeId, cours: [] }));
  rendre();
  if (cibles.length + copies.length > 1) toast(`Séquence enregistrée pour ${cibles.length + copies.length} classes ✔`, 'ok');
}

/* ---------- Saisie : conseils de classe et événements ---------- */

// Nouveaux conseils : une ligne par classe (date, heure), pour tout saisir d'un coup après la réunion de rentrée.
async function saisirConseils() {
  const classes = classesTriees();
  const { resultat } = ouvrirModale('Conseils de classe', `
    <p class="aide">Remplis les classes dont tu connais la date ; les autres lignes sont ignorées.</p>
    <div class="tableau-conseils">${classes.map(c => `<div class="ligne">
      <b class="nom-classe-ag">${esc(c.nom)}</b>
      <input type="date" name="date-${c.id}" aria-label="Date du conseil de ${esc(c.nom)}">
      <input type="time" name="heure-${c.id}" aria-label="Heure du conseil de ${esc(c.nom)}"></div>`).join('')}</div>`,
  boutonsModale('Ajouter'));
  const r = await resultat;
  if (r.action !== 'ok') return;
  let n = 0;
  for (const c of classes) {
    const date = r.data['date-' + c.id];
    if (!date) continue;
    Donnees.ecrire('agenda', { id: Donnees.nouvelId(), type: 'conseil', classeId: c.id, titre: 'Conseil de classe', debut: date, heure: r.data['heure-' + c.id] || '', notes: '' });
    n++;
  }
  rendre();
  if (n) toast(`${n} conseil${n > 1 ? 's' : ''} de classe ajouté${n > 1 ? 's' : ''} ✔`, 'ok');
}

async function editerEvenementAg(id, preset = {}) {
  const r = reglageAgenda(), classes = classesTriees();
  const e = id ? Donnees.get('agenda', id) : { type: 'evenement', titre: '', typeEv: r.types[0].id, classeId: '', debut: preset.debut || aujourdhui(), fin: '', heure: '', notes: '' };
  if (!e) return;
  const conseil = e.type === 'conseil';
  const { resultat } = ouvrirModale(conseil ? 'Conseil de classe' : id ? 'Événement' : 'Nouvel événement', `
    ${conseil ? `<label>Classe<select name="classe">${classes.map(c => `<option value="${c.id}" ${c.id === e.classeId ? 'selected' : ''}>${esc(c.nom)}</option>`).join('')}</select></label>`
    : `<label>Titre<input name="titre" value="${esc(e.titre)}" required placeholder="${esc(mot('evenementExemple'))}"></label>
      <div class="ligne">
        <label>Type<select name="typeEv">${r.types.map(t => `<option value="${esc(t.id)}" ${t.id === e.typeEv ? 'selected' : ''}>${esc(t.nom)}</option>`).join('')}</select></label>
        <label>Pour<select name="classe"><option value="">Tout le collège</option>${classes.map(c => `<option value="${c.id}" ${c.id === e.classeId ? 'selected' : ''}>${esc(c.nom)}</option>`).join('')}</select></label>
      </div>`}
    <div class="ligne">
      <label>${conseil ? 'Date' : 'Le (ou du)'}<input type="date" name="debut" value="${e.debut}" required></label>
      ${conseil ? '' : `<label>Au <span class="aide">(facultatif)</span><input type="date" name="fin" value="${e.fin || ''}"></label>`}
      <label>Heure <span class="aide">(facultatif)</span><input type="time" name="heure" value="${e.heure || ''}"></label>
    </div>
    <label>Notes<textarea name="notes" rows="2">${esc(e.notes || '')}</textarea></label>`,
  boutonsModale('Enregistrer', id ? BOUTON_SUPPRIMER : ''));
  const res = await resultat;
  if (res.action === 'supprimer') {
    if (await confirmer(conseil ? 'Supprimer ce conseil de classe ?' : `Supprimer « ${e.titre} » ?`)) Donnees.supprimer('agenda', id);
    return rendre();
  }
  if (res.action !== 'ok') return;
  const v = res.data;
  if (v.fin && v.fin < v.debut) { toast('La fin est avant le début.', 'erreur'); return editerEvenementAg(id, preset); }
  Donnees.ecrire('agenda', {
    ...e, id: id || Donnees.nouvelId(), classeId: v.classe || '', debut: v.debut, fin: conseil ? '' : (v.fin || ''), heure: v.heure || '', notes: v.notes.trim(),
    ...(conseil ? {} : { titre: v.titre.trim(), typeEv: v.typeEv }),
  });
  rendre();
}

/* ---------- Réglages : année, vacances, types d'événements, affichage ---------- */

// Lignes ajoutées / retirées dans une fenêtre (vacances, types, créneaux…).
function lignesDynamiques(d, modeles) {
  d.addEventListener('click', ev => {
    const ajout = ev.target.closest('[data-ajout-ligne]');
    if (ajout) {
      ev.preventDefault();
      const cible = $(`[data-lignes="${ajout.dataset.ajoutLigne}"]`, d);
      cible.insertAdjacentHTML('beforeend', modeles[ajout.dataset.ajoutLigne.split(':')[0]](ajout.dataset.ajoutLigne.split(':')[1]));
      cible.lastElementChild?.querySelector('input, select')?.focus();
      return;
    }
    const suppr = ev.target.closest('[data-suppr-ligne]');
    if (suppr) { ev.preventDefault(); suppr.closest('.ligne-dyn').remove(); }
  });
}
const boutonSupprLigne = '<button type="button" class="icone-petit" data-suppr-ligne aria-label="Retirer cette ligne">🗑</button>';

async function reglerAgenda() {
  const r = reglageAgenda();
  const ligneVac = (v = {}) => `<div class="ligne ligne-dyn">
    <input name="vac-nom" value="${esc(v.nom || '')}" placeholder="Toussaint" aria-label="Nom">
    <label class="en-ligne">du<input type="date" name="vac-debut" value="${v.debut || ''}"></label>
    <label class="en-ligne">au<input type="date" name="vac-fin" value="${v.fin || ''}"></label>${boutonSupprLigne}</div>`;
  const ligneType = (t = {}) => `<div class="ligne ligne-dyn">
    <input type="hidden" name="type-id" value="${esc(t.id || '')}">
    <input name="type-nom" value="${esc(t.nom || '')}" placeholder="Nom du type" aria-label="Nom du type">
    <input type="color" name="type-couleur" value="${esc(t.couleur || '#3d4a52')}" aria-label="Couleur">${boutonSupprLigne}</div>`;
  const vacances = r.vacances.length ? r.vacances : ['Toussaint', 'Noël', 'Hiver', 'Printemps'].map(nom => ({ nom }));
  const { d, resultat } = ouvrirModale('Année et vacances', `
    <fieldset><legend>Année scolaire</legend><div class="ligne">
      <label>Début<input type="date" name="debut" value="${r.debut}" required></label>
      <label>Fin<input type="date" name="fin" value="${r.fin}" required></label></div></fieldset>
    <fieldset><legend>Vacances et jours sans cours</legend>
      <p class="aide">Premier et dernier jour sans cours (un jour férié : la même date deux fois). L’appli n’a pas internet : les dates sont à saisir une fois par an.</p>
      <div data-lignes="vac">${vacances.map(ligneVac).join('')}</div>
      <button type="button" data-ajout-ligne="vac">+ Ajouter</button></fieldset>
    <fieldset><legend>Semaines alternées</legend>
      <label>Les cours une semaine sur deux s’appellent
        <select name="semaines">
          <option value="parite" ${r.semaines.nommage !== 'AB' ? 'selected' : ''}>Semaines paires / impaires</option>
          <option value="AB-impaire" ${r.semaines.nommage === 'AB' && r.semaines.A === 'impaire' ? 'selected' : ''}>Semaines A / B — la semaine A est impaire</option>
          <option value="AB-paire" ${r.semaines.nommage === 'AB' && r.semaines.A === 'paire' ? 'selected' : ''}>Semaines A / B — la semaine A est paire</option>
        </select></label>
      <p class="aide">Cette semaine est la n° ${semaineIso(aujourdhui())} : une semaine ${pariteAg(aujourdhui())}.</p></fieldset>
    <fieldset><legend>Types d’événements</legend>
      <div data-lignes="type">${r.types.map(ligneType).join('')}</div>
      <button type="button" data-ajout-ligne="type">+ Ajouter un type</button></fieldset>
    <fieldset><legend>Afficher dans l’agenda</legend>
      <div class="cases-mode-eleve">${Object.entries(AFFICHAGES_AGENDA).map(([k, nom]) => `<label class="case"><input type="checkbox" name="afficher" value="${k}" ${r.afficher[k] ? 'checked' : ''}> ${nom}</label>`).join('')}</div></fieldset>`,
  boutonsModale('Enregistrer'), 'modale-large');
  lignesDynamiques(d, { vac: () => ligneVac(), type: () => ligneType() });
  const res = await resultat;
  if (res.action !== 'ok') return;
  const f = res.fd, v = res.data;
  if (v.fin <= v.debut) { toast('La fin de l’année est avant son début.', 'erreur'); return reglerAgenda(); }
  const noms = f.getAll('vac-nom'), debuts = f.getAll('vac-debut'), fins = f.getAll('vac-fin');
  const vacs = noms.map((nom, k) => ({ nom: nom.trim(), debut: debuts[k], fin: fins[k] || debuts[k] })).filter(x => x.debut)
    .map(x => (x.fin < x.debut ? { ...x, fin: x.debut } : x)).sort((a, b) => a.debut.localeCompare(b.debut));
  const tids = f.getAll('type-id'), tnoms = f.getAll('type-nom'), tcoul = f.getAll('type-couleur');
  const types = tnoms.map((nom, k) => ({ id: tids[k] || 't' + Donnees.nouvelId().slice(0, 8), nom: nom.trim(), couleur: tcoul[k] })).filter(t => t.nom);
  const choisis = f.getAll('afficher');
  ecrireReglageAgenda({
    debut: v.debut, fin: v.fin, vacances: vacs, types: types.length ? types : typesEvenementsDefaut(),
    afficher: Object.fromEntries(Object.keys(AFFICHAGES_AGENDA).map(k => [k, choisis.includes(k)])),
    semaines: v.semaines === 'parite' ? { nommage: 'parite', A: r.semaines.A } : { nommage: 'AB', A: v.semaines === 'AB-paire' ? 'paire' : 'impaire' },
  });
  rendre();
}

/* ---------- Emploi du temps (semaine type) ---------- */

const optionsJours = j => JOURS_SEMAINE.map((nom, k) => `<option value="${k + 1}" ${+j === k + 1 ? 'selected' : ''}>${nom}</option>`).join('');
const optionsSemaine = (sem, r) => ['', 'paire', 'impaire'].map(p => `<option value="${p}" ${p === (sem || '') ? 'selected' : ''}>${libelleSemaine(p, r)}</option>`).join('');
const ligneCreneau = (classeId, x = {}, r = reglageAgenda()) => `<div class="ligne ligne-dyn">
  <select name="jour-${classeId}" aria-label="Jour">${optionsJours(x.jour || 1)}</select>
  <input type="time" name="debut-${classeId}" value="${x.debut || ''}" aria-label="Début">
  <input type="time" name="fin-${classeId}" value="${x.fin || ''}" aria-label="Fin">
  <select name="sem-${classeId}" aria-label="Semaines">${optionsSemaine(x.semaine, r)}</select>
  <input name="lieu-${classeId}" value="${esc(x.lieu || '')}" placeholder="Lieu" aria-label="Lieu">${boutonSupprLigne}</div>`;
const trierCreneaux = l => l.sort((a, b) => a.jour - b.jour || a.debut.localeCompare(b.debut) || (a.semaine || '').localeCompare(b.semaine || ''));

async function editerEmploiDuTemps() {
  const classes = classesTriees(), r = reglageAgenda(), auj = aujourdhui();
  let fichier = null;
  const { d, resultat } = ouvrirModale('Emploi du temps — semaine type', `
    <div class="bloc-excel">
      <h3>📄 Importer depuis École Directe / Pronote</h3>
      ${htmlGuideImport('edt')}
      <label class="bouton primaire">Choisir le PDF…<input type="file" accept=".pdf,application/pdf" data-fichier-edt hidden></label>
    </div>
    <p class="aide">Ou saisis les créneaux à la main : ils servent à compter les ${esc(motMin('lecons'))} prévues de chaque séquence et à placer les cours dans le calendrier du mois.
      Un cours une semaine sur deux : choisis « ${esc(libelleSemaine('paire', r))} » ou « ${esc(libelleSemaine('impaire', r))} »
      (cette semaine est la n° ${semaineIso(auj)}, ${r.semaines.nommage === 'AB' ? 'semaine ' + nomSemaine(pariteAg(auj), r) + ', ' : ''}${pariteAg(auj)} ; A / B se règle dans ⚙ Année et vacances).</p>
    ${classes.map(c => `<fieldset class="edt-classe"><legend>${esc(c.nom)}</legend>
      <div data-lignes="cr:${c.id}">${creneauxDe(c).map(x => ligneCreneau(c.id, x, r)).join('')}</div>
      <button type="button" data-ajout-ligne="cr:${c.id}">+ Créneau</button></fieldset>`).join('')}`,
  boutonsModale('Enregistrer'), 'modale-large');
  lignesDynamiques(d, { cr: classeId => ligneCreneau(classeId, {}, r) });
  $('[data-fichier-edt]', d).addEventListener('change', ev => { fichier = ev.target.files[0] || null; if (fichier) d.fermer(); });
  const res = await resultat;
  if (fichier) return importerEdtPdf(fichier);
  if (res.action !== 'ok') return;
  const f = res.fd;
  for (const c of classes) {
    const jours = f.getAll('jour-' + c.id), debuts = f.getAll('debut-' + c.id), fins = f.getAll('fin-' + c.id), lieux = f.getAll('lieu-' + c.id);
    const sems = f.getAll('sem-' + c.id);
    const creneaux = trierCreneaux(jours.map((j, k) => ({ jour: +j, debut: debuts[k], fin: fins[k], lieu: lieux[k].trim(), ...(sems[k] ? { semaine: sems[k] } : {}) }))
      .filter(x => x.debut && x.fin && x.fin > x.debut));
    if (JSON.stringify(creneaux) !== JSON.stringify(creneauxDe(c))) Donnees.ecrire('classes', { ...c, creneaux });
  }
  montrerSemaine();
}

// Après la saisie de l'emploi du temps : on le montre (vue Semaine, toutes les classes, semaine en cours).
function montrerSemaine() {
  Object.assign(ui, { vue: 'agenda', agVue: 'semaine', agSemaine: '', agClasse: '' });
  memoriserUi();
  rendre();
}

async function importerEdtPdf(fichier) {
  const classes = classesTriees(), reg = reglageAgenda();
  const { creneaux, notes } = await EdtPdf.lireFichier(fichier, classes);
  creneaux.forEach(x => { x.semaine = semaineDuTexte(x.texte, reg); }); // (« Sem. A », « semaine paire »… écrit dans la case)
  const { resultat } = ouvrirModale('Créneaux trouvés dans le PDF', `
    <p><b>${esc(fichier.name)}</b> : ${creneaux.length} cours trouvé${creneaux.length > 1 ? 's' : ''}.
      Vérifie, corrige la classe si besoin, et décoche ce qui n’est pas un cours ${profil().id === 'svt' ? 'de SVT' : 'd’EPS'} de tes classes.</p>
    ${notes.map(n => `<p class="aide">⚠ ${esc(n)}</p>`).join('')}
    <div class="liste-import-edt">${creneaux.map((x, k) => `<div class="ligne import-edt">
      <input type="checkbox" name="garder" value="${k}" ${x.classeId ? 'checked' : ''} aria-label="Garder ce créneau">
      <select name="classe-${k}" aria-label="Classe"><option value="">— classe ? —</option>${classes.map(c => `<option value="${c.id}" ${c.id === x.classeId ? 'selected' : ''}>${esc(c.nom)}</option>`).join('')}</select>
      <select name="jour-${k}" aria-label="Jour">${optionsJours(x.jour)}</select>
      <input type="time" name="debut-${k}" value="${x.debut}" aria-label="Début">
      <input type="time" name="fin-${k}" value="${x.fin}" aria-label="Fin">
      <select name="sem-${k}" aria-label="Semaines">${optionsSemaine(x.semaine, reg)}</select>
      <input name="lieu-${k}" value="${esc(x.lieu)}" placeholder="Lieu" aria-label="Lieu">
      <span class="aide texte-edt" title="${esc(x.texte)}">${esc(resumeTexte(x.texte, 60))}</span></div>`).join('')}</div>
    <fieldset class="choix-import"><legend>Pour les classes concernées</legend>
      <label class="case"><input type="radio" name="mode" value="remplacer" checked> <span><b>Remplacer</b> leurs créneaux par ceux du PDF</span></label>
      <label class="case"><input type="radio" name="mode" value="ajouter"> <span><b>Ajouter</b> aux créneaux déjà saisis</span></label>
    </fieldset>`,
  boutonsModale('Enregistrer'), 'modale-large');
  const r = await resultat;
  if (r.action !== 'ok') return;
  const parClasse = new Map();
  for (const k of r.fd.getAll('garder')) {
    const classeId = r.data['classe-' + k], debut = r.data['debut-' + k], fin = r.data['fin-' + k];
    if (!classeId || !debut || !(fin > debut)) continue;
    const semaine = r.data['sem-' + k];
    parClasse.set(classeId, [...(parClasse.get(classeId) || []), { jour: +r.data['jour-' + k], debut, fin, lieu: r.data['lieu-' + k].trim(), ...(semaine ? { semaine } : {}) }]);
  }
  if (!parClasse.size) return toast('Aucun créneau gardé (choisis la classe de chaque cours à garder).', 'erreur');
  for (const [classeId, liste] of parClasse) {
    const c = Donnees.get('classes', classeId);
    const avant = r.data.mode === 'ajouter' ? creneauxDe(c) : [];
    const creneaux = trierCreneaux([...avant, ...liste].filter((x, i, t) =>
      t.findIndex(y => y.jour === x.jour && y.debut === x.debut && y.fin === x.fin && (y.semaine || '') === (x.semaine || '')) === i));
    Donnees.ecrire('classes', { ...c, creneaux });
  }
  montrerSemaine();
  const n = [...parClasse.values()].reduce((a, l) => a + l.length, 0);
  toast(`${n} créneau${n > 1 ? 'x' : ''} enregistré${n > 1 ? 's' : ''} pour ${parClasse.size} classe${parClasse.size > 1 ? 's' : ''} ✔`, 'ok');
}

/* ---------- Évènements ---------- */

document.addEventListener('click', e => {
  if (ui.vue !== 'agenda' || !e.target.closest?.('#vue')) return;
  const edit = e.target.closest('[data-ag-edit]');
  if (edit) {
    const x = Donnees.get('agenda', edit.dataset.agEdit);
    if (x) lancer(() => (x.type === 'sequence' ? editerSequence(x.id) : editerEvenementAg(x.id)));
    return;
  }
  const jour = e.target.closest('[data-ag-jour]');
  if (jour) return lancer(() => editerEvenementAg(null, { debut: jour.dataset.agJour }));
  const piste = e.target.closest('[data-ag-piste]');
  if (piste && e.target === piste) {
    // Toucher une ligne vide de la frise : nouvelle séquence pour cette classe, à partir du lundi de cette semaine.
    const r = reglageAgenda(), rect = piste.getBoundingClientRect();
    const part = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const jours = Math.round(part * (dateAg(r.fin) - dateAg(r.debut)) / 864e5);
    return lancer(() => editerSequence(null, { classeId: piste.dataset.agPiste, debut: lundiAg(plusJoursAg(r.debut, jours)) }));
  }
  const b = e.target.closest('[data-ag]');
  if (!b) return;
  const arg = b.dataset.arg;
  switch (b.dataset.ag) {
    case 'vue': ui.agVue = arg; memoriserUi(); return rendreVue();
    case 'afficher': {
      const r = reglageAgenda();
      ecrireReglageAgenda({ afficher: { ...r.afficher, [arg]: !r.afficher[arg] } });
      return rendreVue();
    }
    case 'mois': {
      const m = /^\d{4}-\d{2}$/.test(ui.agMois || '') ? ui.agMois : aujourdhui().slice(0, 7);
      const d = new Date(+m.slice(0, 4), +m.slice(5, 7) - 1 + +arg, 1, 12);
      ui.agMois = +arg ? isoAg(d).slice(0, 7) : aujourdhui().slice(0, 7);
      memoriserUi();
      return rendreVue();
    }
    case 'semaine': {
      ui.agSemaine = +arg ? plusJoursAg(lundiAffiche(), +arg) : '';
      memoriserUi();
      return rendreVue();
    }
    case 'nouvelle-sequence': return lancer(() => editerSequence(null));
    case 'nouveau-conseil': return lancer(saisirConseils);
    case 'nouvel-evenement': return lancer(() => editerEvenementAg(null));
    case 'edt': return lancer(editerEmploiDuTemps);
    case 'reglages': return lancer(reglerAgenda);
  }
});

// Appli laissée ouverte (tablette) : au changement de jour, l'agenda se redessine (avancement, trait d'aujourd'hui).
let jourAgenda = new Date().toLocaleDateString('sv');
function actualiserJourAgenda() {
  const auj = new Date().toLocaleDateString('sv');
  if (auj === jourAgenda) return;
  // (écran éteint ou fenêtre ouverte : on réessaiera au retour, sans perdre le changement de jour)
  if (ui.vue === 'agenda' && (document.hidden || document.querySelector('dialog[open]'))) return;
  jourAgenda = auj;
  if (ui.vue === 'agenda') rendreVue();
}
document.addEventListener('visibilitychange', actualiserJourAgenda);
setInterval(actualiserJourAgenda, 5 * 60000);

document.addEventListener('change', e => {
  if (!e.target.matches?.('#vue [data-ag-classe]')) return;
  ui.agClasse = e.target.value;
  memoriserUi();
  rendreVue();
});
