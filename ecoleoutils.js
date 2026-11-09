'use strict';
/* ---------- Carnet École : les outils de la classe (onglet Outils, famille « La classe ») ----------
   Fluence et rituels, Groupes de besoin, Plan de classe (icônes : ecole.js › ICONES_OUTILS_ECOLE). Réservés au carnet École (disciplines: ['ecole']).
   Résultats et plan rangés dans le carnet (ils suivent sur la clé et la tablette) :
   - mesures : `suivis` « élève|rituel|id » { mesures: { date: valeur } } ; rituels ajoutés : classe.rituels ;
   - plan : classe.plan { rangs, cols, parDeux, places: { "rang-colonne": eleveId } }.
   Les déplacements dans les groupes de besoin, éphémères, restent sur l'appareil (etatOutils.besoin).
   Tout est calculé ici, par l'appli. (Chargé après ecole.js et outils.js.) */

if (!FAMILLES_OUTILS.some(f => f.id === 'classe')) FAMILLES_OUTILS.unshift({ id: 'classe', nom: 'La classe' });
OUTILS.push(
  { id: 'rituels', famille: 'classe', disciplines: ['ecole'], icone: '📖', nom: 'Fluence et rituels', info: 'Mots lus par minute, calcul mental, dictée, tables : qui progresse', classe: true, eleve: false, sansEffacer: true },
  { id: 'besoin', famille: 'classe', disciplines: ['ecole'], icone: '🧩', nom: 'Groupes de besoin', info: 'Les groupes d’après les derniers degrés d’une matière', classe: true, eleve: false, sansEffacer: true },
  { id: 'plan', famille: 'classe', disciplines: ['ecole'], icone: '🪑', nom: 'Plan de classe', info: 'Qui est assis où ; à imprimer pour un remplaçant', classe: true, eleve: false, sansEffacer: true },
);

const elevesFiltresEcole = c => { const n = niveauxDeClasse(c).includes(ui.niveauEcole) ? ui.niveauEcole : ''; return elevesDe(c.id).filter(el => !n || niveauEleve(el, c) === n); };
function htmlPucesNiveau(c) {
  const niveaux = niveauxDeClasse(c), actuel = niveaux.includes(ui.niveauEcole) ? ui.niveauEcole : '';
  if (!niveaux.length) return '';
  const puce = (v, nom) => `<button type="button" class="puce-ecole${v === actuel ? ' actif' : ''}" data-ec="niveau" data-arg="${esc(v)}" aria-pressed="${v === actuel}">${esc(nom)}</button>`;
  return `<div class="filtres-ecole" role="group" aria-label="Filtrer par niveau">${puce('', 'Tous les niveaux')}${niveaux.map(n => puce(n, n)).join('')}</div>`;
}
// Prénom seul, sauf si deux élèves de la classe le partagent (initiale du nom en plus).
function nomCourtClasse(el, tous) {
  const p = (el.prenom || '').trim() || el.nom;
  return tous.filter(x => (x.prenom || '').trim() === (el.prenom || '').trim()).length > 1 ? `${p} ${(el.nom || '').charAt(0)}.` : p;
}

/* ---------- Fluence et rituels ---------- */

const RITUELS_BASE = [
  { id: 'fluence', icone: 'lecture', nom: 'Fluence', unite: 'mots/min', chrono: true },
  { id: 'calcul', icone: 'calcul', nom: 'Calcul mental', sur: 10 },
  { id: 'dictee', icone: 'modifier', nom: 'Dictée', sur: 10 },
  { id: 'tables', icone: 'fois', nom: 'Tables', sur: 10 },
];
const DUREE_FLUENCE = 60; // secondes
const rituelsClasse = c => [...RITUELS_BASE, ...(c.rituels || [])];
const etatRituels = { date: '', eleve: '', chrono: null }; // (chrono : { debut, fini: secondes })
let minuteurFluence = null;
const cfgRituels = c => ((etatOutils.rituels ??= {})[c.id] ??= { rit: 'fluence' });
const rituelActif = c => rituelsClasse(c).find(r => r.id === cfgRituels(c).rit) || RITUELS_BASE[0];
const dateRituel = () => etatRituels.date || aujourdhui();
const idMesures = (el, ritId) => `${el.id}|rituel|${ritId}`;
const mesuresDe = (el, ritId) => Donnees.get('suivis', idMesures(el, ritId))?.mesures || {};
const serieMesures = (el, ritId) => Object.entries(mesuresDe(el, ritId)).sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, v }));
function ecrireMesure(el, ritId, date, valeur) {
  const m = { ...mesuresDe(el, ritId) };
  if (valeur === null) delete m[date]; else m[date] = valeur;
  Donnees.ecrire('suivis', { id: idMesures(el, ritId), eleveId: el.id, pp: true, rituel: ritId, mesures: m });
}
// Sens de l'évolution : la dernière valeur comparée à la moyenne des deux d'avant (écart d'au moins 15 %).
function tendanceRituel(serie) {
  if (serie.length < 3) return '';
  const [a, b, d] = serie.slice(-3).map(x => x.v), ref = (a + b) / 2;
  if (!ref) return d > 0 ? 'hausse' : '';
  const e = (d - ref) / ref;
  return e >= 0.15 ? 'hausse' : e <= -0.15 ? 'baisse' : '';
}
function courbeRituel(serie) {
  const s = serie.slice(-8);
  if (s.length < 2) return '';
  const vals = s.map(x => x.v), min = Math.min(...vals), max = Math.max(...vals), e = max - min || 1;
  const pts = s.map((x, i) => `${(i * 80 / (s.length - 1)).toFixed(1)},${(20 - (x.v - min) * 16 / e).toFixed(1)}`).join(' ');
  return `<svg class="courbe-rituel" viewBox="-2 0 84 24" aria-hidden="true"><polyline points="${pts}"/></svg>`;
}
const eleveEnPassage = (rit, eleves) => eleves.find(el => el.id === etatRituels.eleve)
  || eleves.find(el => mesuresDe(el, rit.id)[dateRituel()] === undefined) || eleves[0];
const secondesFluence = () => (etatRituels.chrono?.fini ?? (etatRituels.chrono ? (Date.now() - etatRituels.chrono.debut) / 1000 : 0));
const texteTemps = s => { const r = Math.max(0, Math.ceil(s)); return `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`; };

function htmlPassageFluence(rit, eleves) {
  const el = eleveEnPassage(rit, eleves), ch = etatRituels.chrono, enCours = !!ch && ch.fini === undefined;
  if (!el) return '';
  return `<section class="passage-fluence">
    <div class="eleve-passage">${Trombi.mini(el)}<b>${esc(nomEleveOutil(el))}</b></div>
    <div class="temps-fluence" id="temps-fluence">${texteTemps(ch ? DUREE_FLUENCE - secondesFluence() : DUREE_FLUENCE)}</div>
    ${enCours ? `<button type="button" class="gros" data-ec="fluence-stop">${iconeEcole('stop')}Arrêter</button>`
    : ch ? `<label class="mots-fluence">Mots bien lus<input type="number" inputmode="numeric" min="0" data-fluence-mots></label>
        <button type="button" class="primaire gros" data-ec="fluence-valider">${iconeEcole('coche')}Valider</button>
        <button type="button" data-ec="fluence-annuler">${iconeEcole('recommencer')}Recommencer</button>
        ${ch.fini < DUREE_FLUENCE ? `<span class="aide">Lu en ${Math.round(ch.fini)} s : l’appli ramène à une minute.</span>` : ''}`
      : `<button type="button" class="primaire gros" data-ec="fluence-go">${iconeEcole('chrono')}Départ (1 minute)</button>`}
  </section>`;
}

function htmlRituels(c) {
  const rit = rituelActif(c), date = dateRituel(), eleves = elevesFiltresEcole(c), absents = absentsDuJour(c);
  const lignes = eleves.map(el => { const serie = serieMesures(el, rit.id); return { el, serie, t: tendanceRituel(serie), v: mesuresDe(el, rit.id)[date] }; });
  const baisse = lignes.filter(l => l.t === 'baisse'), derniers = lignes.map(l => l.serie.at(-1)?.v).filter(v => v !== undefined);
  const moyenne = derniers.length ? derniers.reduce((a, b) => a + b, 0) / derniers.length : null;
  const unite = rit.unite || `/ ${fmt(rit.sur)}`;
  return `
    <div class="filtres-ecole" role="group" aria-label="Choisir le rituel">
      ${rituelsClasse(c).map(r => `<button type="button" class="puce-ecole${r.id === rit.id ? ' actif' : ''}" data-ec="rituel" data-arg="${esc(r.id)}" aria-pressed="${r.id === rit.id}">${iconeEcole(TRACES_ECOLE[r.icone] ? r.icone : 'notes')}${esc(r.nom)}</button>`).join('')}
      <button type="button" class="puce-ecole" data-ec="rituel-ajout">+ Rituel</button>
      ${rit.icone === undefined ? `<button type="button" class="puce-ecole" data-ec="rituel-retirer">${iconeEcole('corbeille')}Retirer « ${esc(rit.nom)} »</button>` : ''}
    </div>
    ${htmlPucesNiveau(c)}
    <div class="outils"><label class="choix-tri">Jour<input type="date" data-rituel-date value="${date}"></label>
      ${date !== aujourdhui() ? '<button type="button" data-ec="rituel-aujourdhui">Aujourd’hui</button>' : ''}
      ${moyenne !== null ? `<span class="aide">Moyenne des derniers résultats : <b>${fmt1(moyenne)}</b> ${esc(unite)}</span>` : ''}</div>
    ${baisse.length ? `<div class="alerte-sante">↘ <b>En baisse</b> : ${baisse.map(l => esc(nomEleveOutil(l.el))).join(', ')}</div>` : ''}
    ${rit.chrono ? htmlPassageFluence(rit, eleves) : ''}
    <div class="table-defile"><table class="table-labo table-rituels"><thead><tr><th>Élève</th><th>${esc(dateCourte(date))} <span class="aide">${esc(unite)}</span></th><th>Évolution</th></tr></thead>
    <tbody>${lignes.map(l => `<tr class="${absents.includes(l.el.id) && date === aujourdhui() ? 'absent-outil' : ''}">
      <th>${rit.chrono ? `<button type="button" class="lien" data-ec="fluence-choisir" data-arg="${l.el.id}">${esc(nomEleveOutil(l.el))}</button>` : esc(nomEleveOutil(l.el))}</th>
      <td><input class="valeur-rituel" type="number" inputmode="decimal" min="0" ${rit.sur ? `max="${rit.sur}"` : ''} step="any" data-rituel-val="${l.el.id}" value="${l.v ?? ''}" aria-label="${esc(rit.nom)} de ${esc(nomEleveOutil(l.el))}"></td>
      <td class="evol-rituel">${courbeRituel(l.serie)}${l.t === 'hausse' ? '<span class="sens-rituel hausse" title="En hausse">↗</span>' : l.t === 'baisse' ? '<span class="sens-rituel baisse" title="En baisse">↘</span>' : ''}</td></tr>`).join('')}</tbody></table></div>
    <p class="aide">Résultats gardés dans le carnet. Pour corriger : choisis le jour et change la valeur (vide = effacer).</p>`;
}

function tickFluence() {
  const ch = etatRituels.chrono;
  if (!ch || ch.fini !== undefined) { clearInterval(minuteurFluence); minuteurFluence = null; return; }
  const reste = DUREE_FLUENCE - secondesFluence();
  if (reste <= 0) {
    ch.fini = DUREE_FLUENCE;
    bipFin();
    clearInterval(minuteurFluence); minuteurFluence = null;
    if (ui.vue === 'outils' && ui.outil === 'rituels') { rendreOutil(); $('[data-fluence-mots]')?.focus(); }
    return;
  }
  const z = $('#temps-fluence');
  if (z) z.textContent = texteTemps(reste);
}
function validerFluence(c) {
  const champ = $('[data-fluence-mots]'), mots = nombreOutil(champ?.value), ch = etatRituels.chrono;
  if (mots === null || mots < 0) { champ?.focus(); return toast('Tape le nombre de mots bien lus.'); }
  const rit = rituelActif(c), el = eleveEnPassage(rit, elevesFiltresEcole(c));
  ecrireMesure(el, rit.id, dateRituel(), Math.round(mots * 60 / Math.max(1, ch.fini)));
  etatRituels.chrono = null; etatRituels.eleve = '';
  rendreOutil();
}
async function ajouterRituel(c) {
  const { resultat } = ouvrirModale('Nouveau rituel', `
    <label>Nom<input name="nom" required autofocus maxlength="30" placeholder="ex. Problème du jour"></label>
    <label>Noté sur<input type="number" name="sur" min="1" step="any" required value="10"></label>`, boutonsModale('Ajouter'));
  const r = await resultat;
  if (r.action !== 'ok') return;
  const cl = Donnees.get('classes', c.id), id = Donnees.nouvelId();
  Donnees.ecrire('classes', { ...cl, rituels: [...(cl.rituels || []), { id, nom: r.data.nom.trim(), sur: +r.data.sur }] });
  cfgRituels(c).rit = id; sauverOutils();
  rendreOutil();
}
async function retirerRituel(c) {
  const rit = rituelActif(c), ids = new Set(elevesDe(c.id).map(el => el.id));
  if (!(await confirmer(`Retirer « ${rit.nom} » et tous ses résultats ?`))) return;
  for (const s of Donnees.liste('suivis', x => x.rituel === rit.id && ids.has(x.eleveId))) Donnees.supprimer('suivis', s.id);
  const cl = Donnees.get('classes', c.id);
  Donnees.ecrire('classes', { ...cl, rituels: (cl.rituels || []).filter(r => r.id !== rit.id) });
  cfgRituels(c).rit = 'fluence'; sauverOutils();
  rendreOutil();
}

/* ---------- Groupes de besoin ---------- */

// (Pastille de couleur devant le titre : style.css, .pastille-besoin ; rouge, orange, vert : couleurs des degrés 1, 2 et 4.)
const GROUPES_BESOIN = [['aide', 'Besoin d’aide'], ['consolider', 'À consolider'], ['aise', 'À l’aise']];
const cfgBesoin = c => ((etatOutils.besoin ??= {})[c.id] ??= { cle: 'FR', periode: 'annee', dep: {} });
// Degré d'un élève sur une matière (« FR ») ou un domaine (« FR|Lecture ») : moyenne des derniers degrés.
function degreBesoin(el, c, cle, periode) {
  const [ca, code] = cle.split('|'), v = [];
  for (const [id, d] of degresEleve(el, c, periode).res) {
    const a = REFERENTIEL.attendu(id);
    if (a && a.ca === ca && (!code || a.code === code)) v.push(d);
  }
  return v.length ? v.reduce((x, y) => x + y, 0) / v.length : null;
}
const groupeDuDegre = d => (d === null ? '' : d < 2 ? 'aide' : d < 3 ? 'consolider' : 'aise');
function groupesBesoin(c) {
  const cfg = cfgBesoin(c), res = { aide: [], consolider: [], aise: [], '': [] };
  for (const el of elevesFiltresEcole(c)) {
    const d = degreBesoin(el, c, cfg.cle, cfg.periode), dep = cfg.dep[cfg.cle + '|' + cfg.periode]?.[el.id];
    res[dep ?? groupeDuDegre(d)].push({ el, d, deplace: dep !== undefined });
  }
  return res;
}
function optionsBesoin(c) {
  const vus = new Map();
  for (const n of niveauxDeClasse(c).length ? niveauxDeClasse(c) : [c.niveau]) {
    for (const [ca, ch] of Object.entries(REFERENTIEL.refs[refDeNiveau(n)].champs)) {
      if (!champVisibleEcole(n, ca)) continue;
      if (!vus.has(ca)) vus.set(ca, { titre: ch.titre, d: new Map() });
      if (ch.attendus.length > 1) ch.attendus.forEach(a => vus.get(ca).d.set(a.code, a.texte.replace(/\s*\(.*$/, '')));
    }
  }
  return [...vus].map(([ca, m]) => ({ ca, ...m }));
}
function htmlBesoin(c) {
  const cfg = cfgBesoin(c), g = groupesBesoin(c), absents = absentsDuJour(c), tous = elevesDe(c.id);
  const carte = (x, cle) => `<button type="button" class="carte-besoin${x.deplace ? ' deplace' : ''}${absents.includes(x.el.id) ? ' absent-outil' : ''}" data-ec="besoin-suivant" data-arg="${x.el.id}|${cle}" title="Toucher pour changer de groupe">
    ${Trombi.mini(x.el)}<span>${esc(nomCourtClasse(x.el, tous))}</span>${x.d !== null ? `<span class="niveau n${Math.max(1, Math.min(4, Math.round(x.d)))}">${Number.isInteger(x.d) ? x.d : fmt1(x.d)}</span>` : ''}</button>`;
  const deplaces = Object.keys(cfg.dep[cfg.cle + '|' + cfg.periode] || {}).length;
  return `
    <div class="outils">
      <label class="choix-tri">Quoi<select data-besoin-cle>${optionsBesoin(c).map(m => `<option value="${esc(m.ca)}" ${cfg.cle === m.ca ? 'selected' : ''}>${esc(m.titre)}</option>
        ${[...m.d].map(([code, t]) => `<option value="${esc(m.ca + '|' + code)}" ${cfg.cle === m.ca + '|' + code ? 'selected' : ''}>&nbsp;&nbsp;— ${esc(t)}</option>`).join('')}`).join('')}</select></label>
      <label class="choix-tri">Période<select data-besoin-periode><option value="annee" ${cfg.periode === 'annee' ? 'selected' : ''}>Toute l’année</option>${periodesAnnee().map(p => `<option value="${p.id}" ${p.id === cfg.periode ? 'selected' : ''}>${p.code}</option>`).join('')}</select></label>
      ${deplaces ? `<button type="button" data-ec="besoin-reset">${iconeEcole('recommencer')}Revenir aux degrés</button>` : ''}
      <button type="button" data-ec="besoin-copier">${iconeEcole('copier')}Copier</button>
    </div>
    ${htmlPucesNiveau(c)}
    <div class="colonnes-besoin">${GROUPES_BESOIN.map(([k, nom]) => `<section class="colonne-besoin"><h3><span class="pastille-besoin p-${k}" aria-hidden="true"></span>${nom} <span class="aide">${g[k].length}</span></h3><div class="cartes-besoin">${g[k].map(x => carte(x, k)).join('') || '<p class="aide">Personne</p>'}</div></section>`).join('')}</div>
    ${g[''].length ? `<section class="colonne-besoin pas-evalues"><h3>Pas encore évalués <span class="aide">${g[''].length}</span></h3><div class="cartes-besoin">${g[''].map(x => carte(x, '')).join('')}</div></section>` : ''}
    <p class="aide">Touche un élève pour le passer au groupe suivant. Moins de 2 : besoin d’aide · de 2 à moins de 3 : à consolider · 3 et plus : à l’aise.</p>`;
}
function texteBesoin(c) {
  const g = groupesBesoin(c), tous = elevesDe(c.id);
  return GROUPES_BESOIN.map(([k, nom]) => `${nom} :${g[k].map(x => nomCourtClasse(x.el, tous)).join(', ') || '—'}`).join('\n');
}

/* ---------- Plan de classe ---------- */

let selectionPlan = '';
const planDe = c => ({ rangs: 4, cols: 6, parDeux: true, places: {}, ...(Donnees.get('classes', c.id)?.plan || {}) });
const ecrirePlan = (c, plan) => Donnees.ecrire('classes', { ...Donnees.get('classes', c.id), plan });
// Places valables : dans la grille, élève encore dans la classe, un élève à une seule place.
function placesValides(c, plan) {
  const ids = new Set(elevesDe(c.id).map(el => el.id)), vus = new Set(), res = {};
  for (const [k, id] of Object.entries(plan.places)) {
    const [r, col] = k.split('-').map(Number);
    if (r < plan.rangs && col < plan.cols && ids.has(id) && !vus.has(id)) { res[k] = id; vus.add(id); }
  }
  return res;
}
function htmlPlan(c) {
  const plan = planDe(c), places = placesValides(c, plan), eleves = elevesDe(c.id), absents = absentsDuJour(c);
  const placesParId = new Set(Object.values(places)), libres = eleves.filter(el => !placesParId.has(el.id));
  if (selectionPlan && !eleves.some(el => el.id === selectionPlan)) selectionPlan = '';
  const choix = (nom, attr, min, max, v) => `<label class="choix-tri">${nom}<select data-plan="${attr}">${Array.from({ length: max - min + 1 }, (_, i) => min + i).map(n => `<option ${n === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>`;
  const tete = el => `${Trombi.mini(el)}<span>${esc(nomCourtClasse(el, eleves))}</span>`;
  let grille = '';
  for (let r = 0; r < plan.rangs; r++) {
    for (let col = 0; col < plan.cols; col++) {
      const k = `${r}-${col}`, el = eleves.find(x => x.id === places[k]);
      grille += `<button type="button" class="table-plan${el ? ' occupee' : ''}${el && el.id === selectionPlan ? ' choisie' : ''}${el && absents.includes(el.id) ? ' absent-outil' : ''}" data-ec="plan-place" data-arg="${k}" aria-label="Rang ${r + 1}, place ${col + 1}${el ? ' : ' + esc(nomCourtClasse(el, eleves)) : ', libre'}">${el ? tete(el) : ''}</button>`;
    }
  }
  return `
    <div class="outils">
      ${choix('Rangées', 'rangs', 1, 8, plan.rangs)}${choix('Places par rangée', 'cols', 1, 10, plan.cols)}
      <label class="case"><input type="checkbox" data-plan="parDeux" ${plan.parDeux ? 'checked' : ''}> Tables par deux</label>
      <span class="espace"></span>
      <button type="button" data-ec="plan-hasard">${iconeEcole('de')}Au hasard</button>
      <button type="button" data-ec="plan-vider" ${placesParId.size ? '' : 'disabled'}>${iconeEcole('recommencer')}Vider</button>
      <button type="button" data-ec="plan-imprimer" ${placesParId.size ? '' : 'disabled'}>${iconeEcole('imprimer')}Imprimer</button>
    </div>
    ${eleves.length > plan.rangs * plan.cols ? `<div class="alerte-sante">${iconeEcole('alerte')}${plan.rangs * plan.cols} places pour ${eleves.length} élèves : ajoute des places.</div>` : ''}
    <p class="tableau-plan">Tableau</p>
    <div class="grille-plan plan-cols-${plan.cols}${plan.parDeux ? ' par-deux' : ''}">${grille}</div>
    <section class="libres-plan"><h3>À placer <span class="aide">${libres.length}</span></h3>
      <div class="cartes-besoin">${libres.map(el => `<button type="button" class="carte-besoin${el.id === selectionPlan ? ' choisie' : ''}" data-ec="plan-eleve" data-arg="${el.id}">${tete(el)}</button>`).join('') || '<p class="aide">Tout le monde a sa place.</p>'}</div>
      ${selectionPlan && placesParId.has(selectionPlan) ? '<button type="button" data-ec="plan-enlever">Enlever de sa place</button>' : ''}
    </section>
    <p class="aide">${selectionPlan ? 'Touche une place : l’élève s’y assoit. Si elle est prise, les deux élèves échangent.' : 'Touche un élève, puis sa place. Le plan est gardé dans le carnet.'}</p>`;
}
function toucherPlace(c, k) {
  const plan = planDe(c), places = placesValides(c, plan), occupant = places[k];
  if (!selectionPlan) { selectionPlan = occupant || ''; return rendreOutil(); }
  if (occupant === selectionPlan) { selectionPlan = ''; return rendreOutil(); }
  const ancienne = Object.keys(places).find(x => places[x] === selectionPlan);
  if (ancienne) delete places[ancienne];
  if (occupant && ancienne) places[ancienne] = occupant;
  places[k] = selectionPlan;
  selectionPlan = '';
  ecrirePlan(c, { ...plan, places });
  rendreOutil();
}
async function placerAuHasard(c) {
  const plan = planDe(c), deja = Object.keys(placesValides(c, plan)).length;
  if (deja && !(await confirmer('Refaire tout le plan au hasard ?', 'Refaire'))) return;
  const eleves = [...elevesDe(c.id)];
  for (let i = eleves.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [eleves[i], eleves[j]] = [eleves[j], eleves[i]]; }
  const places = {};
  let k = 0;
  for (let r = 0; r < plan.rangs; r++) for (let col = 0; col < plan.cols; col++) if (k < eleves.length) places[`${r}-${col}`] = eleves[k++].id;
  selectionPlan = '';
  ecrirePlan(c, { ...plan, places });
  rendreOutil();
}
function imprimerPlan(c) {
  const plan = planDe(c), places = placesValides(c, plan), eleves = elevesDe(c.id);
  let lignes = '';
  for (let r = 0; r < plan.rangs; r++) {
    lignes += '<tr>';
    for (let col = 0; col < plan.cols; col++) { const el = eleves.find(x => x.id === places[`${r}-${col}`]); lignes += `<td>${el ? esc(`${el.prenom} ${el.nom}`) : ''}</td>`; }
    lignes += '</tr>';
  }
  imprimerZoneEcole(`<h1>Plan de classe — ${esc(c.nom)}</h1><p><b>Tableau</b> (en haut de la feuille)</p><table class="plan-imprime"><tbody>${lignes}</tbody></table>`, `Plan de classe ${c.nom}`);
}

Object.assign(RENDUS_OUTILS, { rituels: htmlRituels, besoin: htmlBesoin, plan: htmlPlan });

/* ---------- Événements ---------- */

document.addEventListener('click', e => {
  const b = e.target.closest?.('#vue button[data-ec]');
  if (!b || b.disabled || !avecEcole()) return;
  const c = classeActive();
  if (!c) return;
  const arg = b.dataset.arg;
  switch (b.dataset.ec) {
    case 'niveau': ui.niveauEcole = arg; memoriserUi(); return rendreOutil();
    case 'rituel': cfgRituels(c).rit = arg; etatRituels.chrono = null; etatRituels.eleve = ''; sauverOutils(); return rendreOutil();
    case 'rituel-ajout': return lancer(() => ajouterRituel(c));
    case 'rituel-retirer': return lancer(() => retirerRituel(c));
    case 'rituel-aujourdhui': etatRituels.date = ''; return rendreOutil();
    case 'fluence-choisir':
      if (etatRituels.chrono && etatRituels.chrono.fini === undefined) return; // (pas pendant la minute)
      etatRituels.eleve = arg; etatRituels.chrono = null;
      return rendreOutil();
    case 'fluence-go':
      debloquerSon(); bipCourt();
      etatRituels.chrono = { debut: Date.now() };
      minuteurFluence = setInterval(tickFluence, 250);
      return rendreOutil();
    case 'fluence-stop':
      etatRituels.chrono.fini = Math.min(DUREE_FLUENCE, secondesFluence());
      clearInterval(minuteurFluence); minuteurFluence = null;
      rendreOutil();
      return $('[data-fluence-mots]')?.focus();
    case 'fluence-annuler': etatRituels.chrono = null; return rendreOutil();
    case 'fluence-valider': return validerFluence(c);
    case 'besoin-suivant': {
      const [id, de] = arg.split('|'), cfg = cfgBesoin(c), cle = cfg.cle + '|' + cfg.periode, ordre = GROUPES_BESOIN.map(g => g[0]);
      (cfg.dep[cle] ??= {})[id] = ordre[(ordre.indexOf(de) + 1) % ordre.length];
      sauverOutils();
      return rendreOutil();
    }
    case 'besoin-reset': { const cfg = cfgBesoin(c); delete cfg.dep[cfg.cle + '|' + cfg.periode]; sauverOutils(); return rendreOutil(); }
    case 'besoin-copier': return lancer(() => copierTexte(texteBesoin(c)));
    case 'plan-place': return toucherPlace(c, arg);
    case 'plan-eleve': selectionPlan = selectionPlan === arg ? '' : arg; return rendreOutil();
    case 'plan-enlever': {
      const plan = planDe(c), places = placesValides(c, plan), k = Object.keys(places).find(x => places[x] === selectionPlan);
      if (k) delete places[k];
      selectionPlan = '';
      ecrirePlan(c, { ...plan, places });
      return rendreOutil();
    }
    case 'plan-hasard': return lancer(() => placerAuHasard(c));
    case 'plan-vider': return lancer(async () => {
      if (!(await confirmer('Vider le plan de classe ?', 'Vider'))) return;
      selectionPlan = '';
      ecrirePlan(c, { ...planDe(c), places: {} });
      rendreOutil();
    });
    case 'plan-imprimer': return lancer(() => imprimerPlan(c));
    default:
  }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (!avecEcole() || !t.matches?.('#vue *')) return;
  const c = classeActive();
  if (!c) return;
  if (t.matches('[data-rituel-date]')) { etatRituels.date = t.value && t.value !== aujourdhui() ? t.value : ''; etatRituels.eleve = ''; return rendreOutil(); }
  if (t.matches('[data-rituel-val]')) { // (saisie : enregistrée sans redessiner, le focus reste)
    const el = Donnees.get('eleves', t.dataset.rituelVal), v = t.value === '' ? null : nombreOutil(t.value);
    if (el && (v !== null || t.value === '')) ecrireMesure(el, rituelActif(c).id, dateRituel(), v);
    return;
  }
  if (t.matches('[data-besoin-cle]')) { cfgBesoin(c).cle = t.value; sauverOutils(); return rendreOutil(); }
  if (t.matches('[data-besoin-periode]')) { cfgBesoin(c).periode = t.value; sauverOutils(); return rendreOutil(); }
  if (t.matches('[data-plan]')) {
    const plan = planDe(c), k = t.dataset.plan;
    ecrirePlan(c, { ...plan, [k]: k === 'parDeux' ? t.checked : +t.value });
    return rendreOutil();
  }
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || !avecEcole()) return;
  const t = e.target;
  if (t.matches?.('#vue [data-rituel-val]')) { // Entrée : élève suivant
    e.preventDefault();
    const champs = [...document.querySelectorAll('#vue [data-rituel-val]')], k = champs.indexOf(t);
    (champs[k + 1] || t).focus();
    champs[k + 1]?.select?.();
  } else if (t.matches?.('#vue [data-fluence-mots]')) {
    e.preventDefault();
    const c = classeActive();
    if (c) validerFluence(c);
  }
});

/* ---------- Classe exemple : résultats et plan ---------- */

function remplirOutilsExemple(c) {
  const eleves = elevesDe(c.id), auj = aujourdhui(), alea = hasardExemple(77);
  const base = el => ELEVES_EXEMPLE_ECOLE.find(x => x[0] === el.nom)?.[3] || 3;
  eleves.forEach(el => {
    const b = base(el), depart = 30 + b * 18 + Math.round(alea() * 10);
    [28, 21, 14, 7].forEach((j, k) => ecrireMesure(el, 'fluence', decalerJour(auj, -j), depart + k * (el.nom === 'SIMON' ? -5 : 4) + Math.round(alea() * 4)));
    [14, 7, 2].forEach((j, k) => ecrireMesure(el, 'calcul', decalerJour(auj, -j), Math.max(0, Math.min(10, b * 2 + k + Math.round(alea() * 2) - 1))));
  });
  const places = {};
  eleves.forEach((el, k) => { places[`${Math.floor(k / 6)}-${k % 6}`] = el.id; });
  Donnees.ecrire('classes', { ...Donnees.get('classes', c.id), plan: { rangs: 4, cols: 6, parDeux: true, places } });
  if (typeof remplirOutilsClasseExemple === 'function') remplirOutilsClasseExemple(c); // (métiers, coupon, prêts : ecoleclasse.js)
}
