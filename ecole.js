'use strict';
/* ---------- Carnet École : ce qui est propre à l'école élémentaire ----------
   Rien ici ne s'exécute dans les carnets EPS, SVT ou PC (avecEcole() est faux : les vues d'app.js ne l'appellent pas).
   - Notes : filtres par matière et par niveau, évaluations en degrés (note chiffrée en option).
   - ✅ Appel par demi-journée (absence justifiée ou non, retard, cantine) ; 📊 bilan du mois.
   - 📓 Cahier journal : les séances du jour (onglet « entrainement »).
   - 📘 Livret de période : positionnements, appréciations, à recopier dans le LSU.
   Pas de nouvelle collection :
   - appel : une séance par jour, marquée `appelJour`, avec les colonnes matin / après-midi / cantine ;
   - cahier journal : les autres séances, `indicateurs: []`, champs heure, fin, objectif, deroulement, materiel, differenciation, bilan, etat ;
   - livret : `suivis` « livret|élève|période » (marqués `pp` : hors des observations), éléments travaillés dans classe.livret[période][matière].
   Tout est calculé par l'appli, sur l'appareil. (Chargé avant app.js : outils d'app.js utilisés à l'appel.) */

const ID_MATIN = 'matin', ID_APRES_MIDI = 'apres-midi', ID_CANTINE = 'cantine';
const ETATS_ECOLE = { P: 'Présent', R: 'Retard', AN: 'Absence non justifiée', AJ: 'Absence justifiée' };
const SEUIL_ASSIDUITE = 4; // demi-journées non justifiées dans le mois : signalement (Code de l'éducation, L131-8)

const ucf = t => t.charAt(0).toLocaleUpperCase('fr') + t.slice(1);

/* ---------- Niveaux, référentiel d'un élève ---------- */

const niveauxDeClasse = c => {
  const n = c.niveau || '';
  if (n.includes('-')) return n.split('-');
  return n === 'Plusieurs niveaux' ? ['CP', 'CE1', 'CE2', 'CM1', 'CM2'] : [];
};
const niveauEleve = (el, c) => el.niveau || (niveauxDeClasse(c).length ? '' : c.niveau || '');
const refDeNiveau = n => DISCIPLINES.ecole.referentielParNiveau[n] || DISCIPLINES.ecole.referentielDefaut;
const refEleve = (el, c) => REFERENTIEL.refs[refDeNiveau(niveauEleve(el, c) || c.niveau)];
// Une matière existe-t-elle pour ce niveau, cette année ? Cycle 2 : « Questionner le monde » devient
// histoire-géographie + sciences et technologie (CP à la rentrée 2026, CE1 et CE2 à la rentrée 2027).
function champVisibleEcole(niveau, ca) {
  if (refDeNiveau(niveau) !== 'ecoleCycle2') return true;
  const nouveau = niveau === 'CP' || anneeScolaire(aujourdhui()) >= 2027;
  return ca === 'QLM' ? !nouveau : ['HG', 'ST'].includes(ca) ? nouveau : true;
}
// Matières de la classe (les deux cycles pour une classe à cheval) : [[code, titre]…]
function matieresClasse(c) {
  const niveaux = niveauxDeClasse(c), res = new Map();
  for (const n of niveaux.length ? niveaux : [c.niveau]) {
    for (const [k, ch] of Object.entries(REFERENTIEL.refs[refDeNiveau(n)].champs)) if (!res.has(k) && champVisibleEcole(n, k)) res.set(k, ch.titre);
  }
  return [...res];
}
const nomMatiere = (c, ca) => matieresClasse(c).find(([k]) => k === ca)?.[1] || ca || '';

// « CE2 », « CE2 - Cours élémentaire 2 », « Cours moyen 1 » → CP, CE1… (liste de classe importée), '' sinon.
function niveauEcoleLu(texte) {
  const t = sansAccent(String(texte || '')).toUpperCase();
  const sigle = t.match(/\b(CP|CE1|CE2|CM1|CM2)\b/)?.[1];
  if (sigle) return sigle;
  if (/COURS PREPARATOIRE/.test(t)) return 'CP';
  const m = t.match(/COURS (ELEMENTAIRE|MOYEN)\s*([12])/);
  return m ? (m[1] === 'MOYEN' ? 'CM' : 'CE') + m[2] : '';
}
// Niveau de la classe d'après les élèves d'une liste : « CE2 », « CE1-CE2 », « Plusieurs niveaux », ou ''.
function niveauDeLaListe(eleves) {
  const ordre = ['CP', 'CE1', 'CE2', 'CM1', 'CM2'], lus = ordre.filter(n => eleves.some(x => niveauEcoleLu(x.niveau) === n));
  if (!lus.length) return '';
  const cle = lus.join('-');
  return DISCIPLINES.ecole.niveaux.includes(cle) ? cle : 'Plusieurs niveaux';
}

/* ---------- 📝 Notes : boutons, filtres, évaluation ---------- */

function htmlBoutonsEcole(c) {
  return `<button data-ecole="livret" title="Positionnements et appréciations de la période, à recopier dans le LSU">📘 Livret</button>`
    + (niveauxDeClasse(c).length ? ' <button data-ecole="niveaux" title="Dire quel élève est dans quel niveau">👥 Niveaux</button>' : '');
}

function filtresNotesEcole(c, eleves, evals) {
  if (ui.matiereEcole && !matieresClasse(c).some(([k]) => k === ui.matiereEcole)) ui.matiereEcole = '';
  const niveau = niveauxDeClasse(c).includes(ui.niveauEcole) ? ui.niveauEcole : '';
  return {
    eleves: niveau ? eleves.filter(el => niveauEleve(el, c) === niveau) : eleves,
    evals: ui.matiereEcole ? evals.filter(e => e.ca === ui.matiereEcole) : evals,
  };
}

function htmlFiltresEcole(c) {
  const puce = (attr, val, actuel, nom) => `<button type="button" class="puce-ecole${val === actuel ? ' actif' : ''}" data-ecole="${attr}" data-arg="${esc(val)}" aria-pressed="${val === actuel}">${esc(nom)}</button>`;
  const niveaux = niveauxDeClasse(c), niveau = niveaux.includes(ui.niveauEcole) ? ui.niveauEcole : '';
  return `<div class="filtres-ecole" role="group" aria-label="Filtrer par matière">
      ${puce('matiere', '', ui.matiereEcole || '', 'Toutes les matières')}
      ${matieresClasse(c).map(([k, t]) => puce('matiere', k, ui.matiereEcole || '', t)).join('')}
    </div>
    ${niveaux.length ? `<div class="filtres-ecole" role="group" aria-label="Filtrer par niveau">${puce('niveau', '', niveau, 'Tous les niveaux')}${niveaux.map(n => puce('niveau', n, niveau, n)).join('')}</div>` : ''}`;
}

// Formulaire d'évaluation : les degrés d'abord ; note chiffrée, barème et seuils seulement si on la demande.
function preparerEvalEcole(d, e) {
  const champMax = $('[name="max"]', d), ligneNote = champMax.closest('.ligne');
  const aMasquer = [ligneNote, $('[name="nonSignificative"]', d).closest('label'), $('.parties-manuelles', d), $('.bloc-seuils', d)];
  $('.lien-bareme', d).hidden = true; // (pas de barème de discipline à l'école)
  const coche = document.createElement('label');
  coche.className = 'case';
  coche.innerHTML = `<input type="checkbox" name="avecNote" ${e.sansNote ? '' : 'checked'}> <span><b>Ajouter une note chiffrée</b> <span class="aide">(sinon : les degrés seulement)</span></span>`;
  const fieldComp = $('fieldset.competences', d);
  fieldComp.after(coche);
  ligneNote.parentNode.insertBefore(fieldComp, ligneNote);
  $('legend', fieldComp).textContent = 'Matière et compétences travaillées';
  coche.after(ligneNote, aMasquer[1], aMasquer[2]); // (les seuils restent dans le cadre des compétences)
  const maj = () => { const v = $('[name="avecNote"]', d).checked; aMasquer.forEach(x => { x.hidden = !v; }); };
  coche.addEventListener('change', maj);
  maj();
}

async function editerNiveauxEleves(c) {
  const niveaux = niveauxDeClasse(c), eleves = elevesDe(c.id);
  const { resultat } = ouvrirModale(`👥 Niveaux — ${c.nom}`, `
    <p class="aide">Le niveau de chaque élève sert aux filtres de l’onglet Notes et au livret (les matières changent entre le cycle 2 et le cycle 3).</p>
    <div class="table-defile"><table class="table-labo"><tbody>${eleves.map(el => `<tr><th>${esc(el.nom)} ${esc(el.prenom)}</th>
      <td><select name="niv-${el.id}" aria-label="Niveau de ${esc(el.prenom)}"><option value="">—</option>${niveaux.map(n => `<option ${el.niveau === n ? 'selected' : ''}>${n}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table></div>`,
  boutonsModale('Enregistrer'));
  const r = await resultat;
  if (r.action !== 'ok') return;
  for (const el of eleves) {
    const n = r.data['niv-' + el.id] || '';
    if (n !== (el.niveau || '')) Donnees.ecrire('eleves', { ...el, niveau: n || undefined });
  }
  rendre();
}

/* ---------- ✅ Appel par demi-journée ---------- */

const demiJourneeDefaut = () => (new Date().getHours() < 12 ? ID_MATIN : ID_APRES_MIDI);
const demiJournee = () => ([ID_MATIN, ID_APRES_MIDI].includes(ui.demiJournee) ? ui.demiJournee : demiJourneeDefaut());
const nomDemiJournee = id => (id === ID_MATIN ? 'matin' : 'après-midi');
const idSeanceAppelJour = (c, date) => `appel-${c.id}-${date}`;
const seanceAppelJour = (c, date) => Donnees.get('seances', idSeanceAppelJour(c, date));
function assurerSeanceAppelJour(c, date) {
  const options = Object.values(ETATS_ECOLE);
  return seanceAppelJour(c, date) || Donnees.ecrire('seances', {
    id: idSeanceAppelJour(c, date), classeId: c.id, cree: Date.now(), appelJour: true, titre: `Appel du ${dateCourte(date)}`, apsa: '', ca: '', date, documents: [],
    indicateurs: [{ id: ID_MATIN, nom: 'Matin', type: 'choix', options }, { id: ID_APRES_MIDI, nom: 'Après-midi', type: 'choix', options }, { id: ID_CANTINE, nom: 'Cantine', type: 'choix', options: ['Oui'] }],
  });
}
const etatEcoleDe = valeur => Object.keys(ETATS_ECOLE).find(k => ETATS_ECOLE[k] === valeur) || '';
const etatDemiJournee = (c, date, id, el) => { const s = seanceAppelJour(c, date); return s ? etatEcoleDe(Donnees.note(s.id, el.id, id)) : ''; };
const absentDemiJournee = (c, el) => ['AN', 'AJ'].includes(etatDemiJournee(c, aujourdhui(), demiJourneeDefaut(), el));
const dateAppelEcole = () => ui.dateAppel || aujourdhui();

function htmlAppelEcole(c) {
  const eleves = elevesDe(c.id);
  if (!eleves.length) {
    return `<div class="vide"><h2>${esc(c.nom)}</h2><p>Pas encore d’élèves dans cette classe.</p>
      <button class="primaire" data-action="vue-eleves">Ajouter des élèves</button></div>`;
  }
  const date = dateAppelEcole(), dj = demiJournee(), s = seanceAppelJour(c, date);
  const etats = new Map(eleves.map(el => [el.id, etatDemiJournee(c, date, dj, el)]));
  const nb = (...k) => [...etats.values()].filter(x => k.includes(x)).length, reste = nb('');
  const cantine = s ? eleves.filter(el => Donnees.note(s.id, el.id, ID_CANTINE) === 'Oui').length : 0;
  const bouton = (el, k, icone, nom, actif) => `<button class="bouton-appel b-${k}${actif ? ' choisi' : ''}" data-ecole="pointer" data-arg="${el.id}|${k}" aria-pressed="${actif}" title="${nom}">${icone}<span class="libelle-appel">${nom}</span></button>`;
  return `
    <div class="outils">
      <h2>✅ Appel — ${esc(c.nom)}</h2>
      <label class="choix-tri">Jour<input type="date" data-date-appel-ecole value="${date}"></label>
      ${date !== aujourdhui() ? '<button data-ecole="appel-aujourdhui">Aujourd’hui</button>' : ''}
      <div class="fiche-onglets" role="group" aria-label="Demi-journée">${[ID_MATIN, ID_APRES_MIDI].map(id => `<button type="button" class="${id === dj ? 'actif' : ''}" data-ecole="demi" data-arg="${id}" aria-pressed="${id === dj}">${id === ID_MATIN ? '☀️ Matin' : '🌤 Après-midi'}</button>`).join('')}</div>
      <span class="espace"></span>
      <button data-ecole="bilan-mois" title="Absences et retards du mois, cantine">📊 Bilan du mois</button>
      <button class="primaire" data-ecole="tous" ${reste ? '' : 'disabled'}>✅ Tous les autres présents${reste ? ` (${reste})` : ''}</button>
    </div>
    <div class="bilan-appel">
      <span class="pastille-appel present">✅ <b>${nb('P')}</b> présent${nb('P') > 1 ? 's' : ''}</span>
      <span class="pastille-appel ABS">❌ <b>${nb('AN', 'AJ')}</b> absent${nb('AN', 'AJ') > 1 ? 's' : ''}</span>
      <span class="pastille-appel RET">⏰ <b>${nb('R')}</b> retard${nb('R') > 1 ? 's' : ''}</span>
      <span class="pastille-appel">🍽 <b>${cantine}</b> à la cantine</span>
      ${reste ? `<span class="aide">${reste} à pointer</span>` : '<span class="aide">✔ Appel terminé</span>'}
    </div>
    <ul class="liste-appel">${eleves.map(el => {
      const e = etats.get(el.id), absent = e === 'AN' || e === 'AJ', mange = !!s && Donnees.note(s.id, el.id, ID_CANTINE) === 'Oui';
      return `<li class="ligne-appel${e ? ' etat-' + ({ P: 'present', R: 'RET' }[e] || 'ABS') : ''}">
        <span class="nom-appel">${Trombi.mini(el)}<b>${esc(el.nom)}</b> ${esc(el.prenom)} ${badgeAlerte(el, absencesEleve(el))}
          ${absent ? `<button class="b-justif${e === 'AJ' ? ' choisi' : ''}" data-ecole="justifier" data-arg="${el.id}" aria-pressed="${e === 'AJ'}" title="Toucher pour changer">${e === 'AJ' ? '📄 Justifiée' : '❔ Non justifiée'}</button>` : ''}</span>
        <span class="boutons-appel" role="group" aria-label="Appel de ${esc(el.nom)} ${esc(el.prenom)}">
          ${bouton(el, 'P', '✅', 'Présent', e === 'P')}
          ${bouton(el, 'ABS', '❌', 'Absent', absent)}
          ${bouton(el, 'R', '⏰', 'Retard', e === 'R')}
          <button class="bouton-appel b-cantine${mange ? ' choisi' : ''}" data-ecole="cantine" data-arg="${el.id}" aria-pressed="${mange}" title="Mange à la cantine ce jour">🍽<span class="libelle-appel">Cantine</span></button>
        </span>
      </li>`;
    }).join('')}</ul>`;
}

function pointerEcole(c, id, k) {
  const date = dateAppelEcole(), dj = demiJournee(), s = assurerSeanceAppelJour(c, date), el = Donnees.get('eleves', id);
  if (!el) return;
  const avant = etatDemiJournee(c, date, dj, el);
  const code = k === 'ABS' ? (['AN', 'AJ'].includes(avant) ? '' : 'AN') : avant === k ? '' : k;
  Donnees.ecrireNote(s.id, id, code ? ETATS_ECOLE[code] : '', dj);
  rendreVue();
}

// Toutes les absences et tous les retards d'un élève sur l'année scolaire en cours : [{ date, dj, etat }]
function appelsEleve(el) {
  const annee = anneeScolaire(aujourdhui()), res = [];
  for (const s of seancesDe(el.classeId)) {
    if (!s.appelJour || anneeScolaire(s.date) !== annee) continue;
    for (const dj of [ID_MATIN, ID_APRES_MIDI]) {
      const etat = etatEcoleDe(Donnees.note(s.id, el.id, dj));
      if (etat && etat !== 'P') res.push({ date: s.date, dj, etat });
    }
  }
  return res.sort((a, b) => a.date.localeCompare(b.date));
}
const moisDe = date => date.slice(0, 7);
function nonJustifieesParMois(el) {
  const m = new Map();
  for (const a of appelsEleve(el)) if (a.etat === 'AN') m.set(moisDe(a.date), (m.get(moisDe(a.date)) || 0) + 1);
  return m;
}

// Même forme que absencesEleve (app.js) : badge ⚠ et fenêtre de détail. Rouge : seuil légal atteint ce mois-ci.
function absencesEleveEcole(el) {
  const p = periodeAlerte(), jours = new Map();
  for (const a of appelsEleve(el)) {
    if (!['AN', 'AJ'].includes(a.etat) || periodeDe(a.date) !== p) continue;
    if (!jours.has(a.date)) jours.set(a.date, []);
    jours.get(a.date).push({ code: 'ABS', quoi: `${nomDemiJournee(a.dj)} (${a.etat === 'AJ' ? 'justifiée' : 'non justifiée'})` });
  }
  const n = [...jours.values()].reduce((x, l) => x + l.length, 0);
  const njMois = nonJustifieesParMois(el).get(moisDe(aujourdhui())) || 0;
  return { n, unite: 'demi-journée', periode: periodesAnnee().find(x => x.id === p), jours: [...jours].sort(([a], [b]) => a.localeCompare(b)),
    niveau: njMois >= SEUIL_ASSIDUITE ? 'rouge' : njMois === SEUIL_ASSIDUITE - 1 ? 'orange' : '' };
}

function bilanMoisEcole(c, mois) {
  const eleves = elevesDe(c.id);
  const lignes = eleves.map(el => {
    const l = appelsEleve(el).filter(a => moisDe(a.date) === mois), n = k => l.filter(a => a.etat === k).length;
    return { el, an: n('AN'), aj: n('AJ'), r: n('R') };
  });
  const cantine = seancesDe(c.id).filter(s => s.appelJour && moisDe(s.date) === mois).sort((a, b) => a.date.localeCompare(b.date))
    .map(s => ({ date: s.date, n: eleves.filter(el => Donnees.note(s.id, el.id, ID_CANTINE) === 'Oui').length })).filter(x => x.n);
  return { lignes, cantine };
}
const nomMois = mois => new Date(mois + '-15T12:00').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
function htmlBilanMois(c, mois) {
  const b = bilanMoisEcole(c, mois), alertes = b.lignes.filter(l => l.an >= SEUIL_ASSIDUITE);
  return `<div class="outils"><label class="choix-tri">Mois<input type="month" data-mois-ecole value="${mois}"></label></div>
    ${alertes.length ? `<div class="alerte-sante">⚠ <b>${SEUIL_ASSIDUITE} demi-journées non justifiées ou plus ce mois-ci</b> : ${alertes.map(l => esc(`${l.el.prenom} ${l.el.nom}`)).join(', ')}. À voir avec la direction de l’école (signalement prévu par le Code de l’éducation, article L131-8).</div>` : ''}
    <div class="table-defile"><table class="table-labo"><thead><tr><th>Élève</th><th>❔ Non justifiées</th><th>📄 Justifiées</th><th>⏰ Retards</th></tr></thead>
    <tbody>${b.lignes.map(l => `<tr class="${l.an >= SEUIL_ASSIDUITE ? 'alerte-rouge' : ''}"><th>${esc(l.el.nom)} ${esc(l.el.prenom)}</th><td>${l.an || ''}</td><td>${l.aj || ''}</td><td>${l.r || ''}</td></tr>`).join('')}</tbody></table></div>
    ${b.cantine.length ? `<h3>🍽 Cantine</h3><p>${b.cantine.map(x => `${esc(dateCourte(x.date))} : <b>${x.n}</b>`).join(' · ')}</p>` : ''}
    <p class="aide">Ce bilan aide à tenir le registre d’appel, sans le remplacer si ton école en tient un autre.</p>`;
}
const texteBilanMois = (c, mois) => [`Absences et retards — ${c.nom} — ${nomMois(mois)}`, 'Nom\tPrénom\tNon justifiées\tJustifiées\tRetards',
  ...bilanMoisEcole(c, mois).lignes.map(l => [l.el.nom, l.el.prenom, l.an, l.aj, l.r].join('\t'))].join('\n');

async function ouvrirBilanMois(c) {
  let mois = moisDe(dateAppelEcole());
  const { d, resultat } = ouvrirModale(`📊 Bilan du mois — ${c.nom}`, `<div data-corps>${htmlBilanMois(c, mois)}</div>`,
    '<button type="button" data-copier>📋 Copier</button><span class="espace"></span><button type="button" data-fermer class="primaire">Fermer</button>', 'modale-large');
  d.addEventListener('change', e => {
    if (!e.target.matches('[data-mois-ecole]') || !e.target.value) return;
    mois = e.target.value;
    $('[data-corps]', d).innerHTML = htmlBilanMois(c, mois);
  });
  d.addEventListener('click', e => { if (e.target.closest('[data-copier]')) lancer(() => copierTexte(texteBilanMois(c, mois))); });
  await resultat;
}

/* ---------- 📓 Cahier journal ---------- */

const dateJournal = () => ui.dateJournal || aujourdhui();
const seancesJournal = c => seancesDe(c.id).filter(s => !s.appelJour);
const seancesDuJour = (c, date) => seancesJournal(c).filter(s => s.date === date).sort((a, b) => (a.heure || '').localeCompare(b.heure || '') || (a.cree || 0) - (b.cree || 0));
const decalerJour = (date, n) => { const d = new Date(date + 'T12:00'); d.setDate(d.getDate() + n); return d.toLocaleDateString('sv'); };
const jourLong = date => ucf(new Date(date + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));
const horaireSeance = s => [s.heure, s.fin].filter(Boolean).join(' – ');
// Jour le plus récent avant `date` qui a des séances, de préférence le même jour de la semaine.
function jourModele(c, date) {
  const avant = [...new Set(seancesJournal(c).filter(s => s.date < date).map(s => s.date))].sort().reverse();
  const jour = new Date(date + 'T12:00').getDay();
  return avant.find(d => new Date(d + 'T12:00').getDay() === jour) || avant[0] || null;
}

function htmlJournal(c) {
  const date = dateJournal(), seances = seancesDuJour(c, date), modele = !seances.length ? jourModele(c, date) : null;
  const aReprendre = seancesJournal(c).filter(s => s.etat === 'reprendre' && s.date < date).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const carte = s => `<article class="carte-journal${s.etat === 'fait' ? ' faite' : s.etat === 'reprendre' ? ' a-reprendre' : ''}">
      <button type="button" class="tete-journal" data-ecole="seance" data-arg="${s.id}" title="Modifier la séance">
        <span class="heure-journal">${esc(horaireSeance(s)) || '—'}</span>
        ${s.ca ? `<span class="chip-matiere">${esc(nomMatiere(c, s.ca))}</span>` : ''}
        <b>${esc(s.titre)}</b></button>
      ${s.objectif ? `<p><span class="aide">Objectif :</span> ${esc(s.objectif)}</p>` : ''}
      ${s.deroulement ? `<p class="texte-journal"><span class="aide">Déroulement :</span> ${esc(s.deroulement)}</p>` : ''}
      ${s.materiel ? `<p><span class="aide">Matériel :</span> ${esc(s.materiel)}</p>` : ''}
      ${s.differenciation ? `<p><span class="aide">Différenciation :</span> ${esc(s.differenciation)}</p>` : ''}
      <label class="bilan-journal">Ce qui s’est passé<textarea rows="2" data-bilan-journal="${s.id}" placeholder="Ce qui a marché, ce qui est à reprendre, qui aider…">${esc(s.bilan || '')}</textarea></label>
      <div class="etats-journal">
        <button type="button" class="${s.etat === 'fait' ? 'actif' : ''}" data-ecole="etat" data-arg="${s.id}|fait" aria-pressed="${s.etat === 'fait'}">✅ Faite</button>
        <button type="button" class="${s.etat === 'reprendre' ? 'actif' : ''}" data-ecole="etat" data-arg="${s.id}|reprendre" aria-pressed="${s.etat === 'reprendre'}">⏩ À reprendre</button>
      </div>
    </article>`;
  return `
    <div class="outils">
      <h2>📓 Cahier journal — ${esc(c.nom)}</h2>
      <button data-ecole="jour" data-arg="-1" aria-label="Jour précédent">◀</button>
      <label class="choix-tri">Jour<input type="date" data-date-journal value="${date}"></label>
      <button data-ecole="jour" data-arg="1" aria-label="Jour suivant">▶</button>
      ${date !== aujourdhui() ? '<button data-ecole="journal-aujourdhui">Aujourd’hui</button>' : ''}
      <span class="espace"></span>
      ${seances.length ? '<button data-ecole="imprimer-journal">🖨 Imprimer</button>' : ''}
      <button class="primaire" data-ecole="seance">+ Séance</button>
    </div>
    <h3 class="jour-journal">${esc(jourLong(date))}</h3>
    ${aReprendre.length ? `<div class="alerte-sante">⏩ <b>À reprendre</b> : ${aReprendre.map(s => `<button type="button" class="lien" data-ecole="aller-jour" data-arg="${s.date}">${esc(dateCourte(s.date))} — ${esc(s.titre)}</button>`).join(' · ')}</div>` : ''}
    ${seances.length ? `<div class="liste-journal">${seances.map(carte).join('')}</div>`
    : `<div class="vide"><p>Rien de prévu ce jour-là.</p>
        ${modele ? `<button class="primaire" data-ecole="reprendre-jour" data-arg="${modele}">📋 Reprendre le plan du ${esc(dateCourte(modele))}</button>
          <p class="aide">Horaires, matières et titres sont recopiés ; objectifs à adapter, bilans vides.</p>` : '<p class="aide">Touche « + Séance » pour commencer.</p>'}</div>`}`;
}

async function editerSeanceJournal(c, id) {
  const s = id ? Donnees.get('seances', id) : { titre: '', ca: ui.matiereEcole || '', apsa: '', date: dateJournal(), heure: '', fin: '', indicateurs: [], documents: [] };
  const { resultat } = ouvrirModale(id ? 'Modifier la séance' : 'Nouvelle séance', `
    <div class="ligne">
      <label>Début<input type="time" name="heure" value="${esc(s.heure || '')}"></label>
      <label>Fin<input type="time" name="fin" value="${esc(s.fin || '')}"></label>
      <label>Jour<input type="date" name="date" required value="${esc(s.date)}"></label>
    </div>
    <div class="ligne">
      <label>Matière<select name="ca"><option value="">—</option>${matieresClasse(c).map(([k, t]) => `<option value="${esc(k)}" ${k === s.ca ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>
    </div>
    <label>Titre<input name="titre" required autofocus value="${esc(s.titre)}" placeholder="${esc(mot('titreSeanceExemple'))}"></label>
    <label>Objectif<input name="objectif" value="${esc(s.objectif || '')}" placeholder="Ce que les élèves doivent savoir faire"></label>
    <label>Déroulement<textarea name="deroulement" rows="3" placeholder="Découverte, recherche, mise en commun…">${esc(s.deroulement || '')}</textarea></label>
    <label>Matériel<input name="materiel" value="${esc(s.materiel || '')}"></label>
    <label>Différenciation<input name="differenciation" value="${esc(s.differenciation || '')}" placeholder="Groupes, aides, élèves à accompagner…"></label>`,
  boutonsModale(id ? 'Enregistrer' : 'Créer', id ? BOUTON_SUPPRIMER : ''), 'modale-large');
  const r = await resultat;
  if (r.action === 'supprimer') {
    if (await confirmer(`Supprimer la séance « ${s.titre} » ?`)) Donnees.supprimer('seances', id);
  } else if (r.action === 'ok') {
    Donnees.ecrire('seances', { ...s, id: id || Donnees.nouvelId(), classeId: c.id, cree: s.cree || Date.now(), titre: r.data.titre.trim(), ca: r.data.ca, date: r.data.date,
      heure: r.data.heure, fin: r.data.fin, objectif: r.data.objectif.trim(), deroulement: r.data.deroulement.trim(), materiel: r.data.materiel.trim(), differenciation: r.data.differenciation.trim() });
    if (r.data.date !== dateJournal()) ui.dateJournal = r.data.date === aujourdhui() ? '' : r.data.date;
  }
  rendre();
}

function reprendreJour(c, source) {
  const date = dateJournal();
  seancesDuJour(c, source).forEach((s, k) => Donnees.ecrire('seances', { id: Donnees.nouvelId(), classeId: c.id, cree: Date.now() + k, date, titre: s.titre, ca: s.ca, apsa: s.apsa || '', heure: s.heure, fin: s.fin,
    objectif: s.objectif || '', materiel: s.materiel || '', indicateurs: [], documents: [] }));
  rendreVue();
}

function imprimerZoneEcole(html, titre) {
  let zone = $('#zone-impression');
  if (!zone) { zone = document.createElement('div'); zone.id = 'zone-impression'; document.body.append(zone); }
  zone.innerHTML = html;
  const titrePage = document.title;
  document.title = titre;
  document.body.classList.add('impression-bareme');
  const fin = () => { document.body.classList.remove('impression-bareme'); document.title = titrePage; window.removeEventListener('afterprint', fin); };
  window.addEventListener('afterprint', fin);
  window.print();
  setTimeout(fin, 1000);
}

function imprimerJournal(c) {
  const date = dateJournal();
  imprimerZoneEcole(`<h1>Cahier journal — ${esc(c.nom)}</h1><p>${esc(jourLong(date))}</p>
    <table><thead><tr><th>Horaire</th><th>Matière</th><th>Séance</th><th>Bilan</th></tr></thead><tbody>${seancesDuJour(c, date).map(s => `<tr>
      <td>${esc(horaireSeance(s))}</td><td>${esc(nomMatiere(c, s.ca))}</td>
      <td><b>${esc(s.titre)}</b>${s.objectif ? `<br>Objectif : ${esc(s.objectif)}` : ''}${s.deroulement ? `<br>${esc(s.deroulement)}` : ''}${s.materiel ? `<br>Matériel : ${esc(s.materiel)}` : ''}${s.differenciation ? `<br>Différenciation : ${esc(s.differenciation)}` : ''}</td>
      <td>${esc(s.bilan || '')}</td></tr>`).join('')}</tbody></table>`, `Cahier journal ${c.nom} ${date}`);
}

/* ---------- 📘 Livret de période ---------- */

const POSITIONS_LSU = ['Objectifs non atteints', 'Partiellement atteints', 'Objectifs atteints', 'Objectifs dépassés'];
const idLivret = (el, periode) => `livret|${el.id}|${periode}`;
const livretDe = (el, periode) => Donnees.get('suivis', idLivret(el, periode)) || { id: idLivret(el, periode), eleveId: el.id, periode, pp: true, livret: true, positions: {}, appr: {}, general: null, accompagnement: '' };
const ecrireLivret = (el, periode, champs) => Donnees.ecrire('suivis', { ...livretDe(el, periode), ...champs });
const periodeLivretDefaut = () => { const v = periodeAffichee(); return v === 'annee' ? periodeDe(aujourdhui()) : v; };

// Degré proposé pour chaque domaine : le dernier degré de la période, évaluation par évaluation.
function degresEleve(el, c, periode) {
  const res = new Map();
  const evals = evalsDe(c.id).filter(e => periode === 'annee' || periodeDe(e.date) === periode).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  for (const e of evals) {
    for (const a of competencesEval(e)) {
      const v = +Donnees.note(e.id, el.id, a.id);
      if (v >= 1 && v <= 4) res.set(a.id, v);
    }
  }
  return { res, evals };
}
// Notes chiffrées d'une matière sur la période → degré proposé d'après les seuils de la classe.
function degreDesNotes(el, c, evals, ca) {
  const moy = moyenneEleve(el.id, evals.filter(e => e.ca === ca));
  if (moy === null) return { moy: null, degre: null };
  const s = seuilsClasse(c);
  return { moy, degre: moy >= s[2] ? 4 : moy >= s[1] ? 3 : moy >= s[0] ? 2 : 1 };
}

// Le livret d'un élève : matières → domaines (degré proposé, degré retenu), appréciations.
function livretEleve(el, c, periode) {
  const ref = refEleve(el, c), { res, evals } = degresEleve(el, c, periode), doc = livretDe(el, periode);
  const niveau = niveauEleve(el, c) || c.niveau;
  const matieres = Object.entries(ref.champs).filter(([ca]) => champVisibleEcole(niveau, ca)).map(([ca, ch]) => {
    const notes = degreDesNotes(el, c, evals, ca);
    const domaines = ch.attendus.filter(a => !a.masque).map(a => {
      const propose = res.get(a.id) || null, manuel = +doc.positions?.[a.id] || null;
      return { a, propose, degre: manuel || propose, manuel: !!manuel };
    });
    const valeurs = domaines.map(x => x.degre).filter(Boolean);
    const niveau = valeurs.length ? valeurs.reduce((x, y) => x + y, 0) / valeurs.length : notes.degre;
    return { ca, titre: ch.titre, domaines, notes, niveau };
  });
  return { el, c, ref, periode, doc, matieres };
}

const EN_MATIERE = { FR: 'en français', MA: 'en mathématiques', EPS: 'en EPS', LV: 'en langue vivante', ART: 'en arts', QLM: 'dans « Questionner le monde »', HG: 'en histoire et géographie', ST: 'en sciences et technologie', EMC: 'en enseignement moral et civique' };
const PHRASES_MATIERE = {
  4: ['{P} obtient d’excellents résultats {m}.', 'Très belle période {m} : {P} dépasse les objectifs fixés.', '{P} réussit très bien {m}.'],
  3: ['{P} atteint les objectifs de la période {m}.', 'Bon travail {m} : {P} progresse avec régularité.', '{P} montre de bonnes acquisitions {m}.'],
  2: ['{P} atteint en partie les objectifs {m} ; les efforts sont à poursuivre.', 'Les acquis restent à consolider {m}.', '{P} progresse {m}, avec encore besoin d’accompagnement.'],
  1: ['{P} rencontre des difficultés {m} et a besoin d’un accompagnement renforcé.', 'Les objectifs ne sont pas encore atteints {m} : {P} a besoin d’aide.', '{P} a besoin de temps et d’aide pour progresser {m}.'],
};
const PHRASES_GENERALES = {
  4: ['Excellente période : {P} s’investit pleinement et réussit très bien.', 'Très belle période pour {P}, avec de très bons résultats. Bravo !', '{P} fait preuve d’un très bel engagement dans tous les apprentissages. Bravo !'],
  3: ['Bonne période : {P} travaille sérieusement et progresse.', '{P} a fait une bonne période, avec un travail régulier. C’est à poursuivre !', 'Période satisfaisante : {P} atteint les objectifs fixés.'],
  2: ['Période encourageante : {P} progresse, mais certains acquis restent à consolider.', '{P} fait des efforts qui doivent se poursuivre pour consolider les acquis.', 'Des progrès sont visibles : {P} doit continuer à s’appuyer sur l’aide proposée.'],
  1: ['Période difficile : {P} a besoin d’un accompagnement renforcé. Nous continuons à l’aider.', '{P} rencontre des difficultés ; un travail avec la famille et l’équipe l’aidera à progresser.', 'Les apprentissages restent difficiles pour {P}, qui a besoin de temps et d’aide. Nous l’accompagnons.'],
};
// Choix stable d'une phrase : même élève + même matière + même graine = même phrase.
function phraseChoisie(liste, cle, graine) {
  let h = 7;
  for (const ch of cle) h = (h * 31 + ch.charCodeAt(0)) % 9973;
  return liste[(h + (graine || 0)) % liste.length];
}
const prenomLivret = el => (el.prenom || '').trim() || el.nom;
// Un domaine au milieu d'une phrase, avec son article : « l’écriture », « les nombres et le calcul ».
const DOMAINES_EN_PHRASE = {
  'Langage oral': 'le langage oral', 'Lecture et compréhension de l’écrit': 'la lecture et la compréhension de l’écrit', 'Écriture': 'l’écriture', 'Étude de la langue': 'l’étude de la langue',
  'Nombres et calcul': 'les nombres et le calcul', 'Grandeurs et mesures': 'les grandeurs et les mesures', 'Espace et géométrie': 'l’espace et la géométrie',
  'Écouter et parler': 'l’écoute et l’expression orale', 'Lire et écrire': 'la lecture et l’écriture',
  'Arts plastiques et visuels': 'les arts plastiques et visuels', 'Éducation musicale': 'l’éducation musicale', 'Histoire des arts': 'l’histoire des arts',
  'Histoire': 'l’histoire', 'Géographie': 'la géographie',
};
const domaineEnPhrase = x => { const t = x.a.texte.replace(/\s*\(.*$/, ''); return DOMAINES_EN_PHRASE[t] || t.toLocaleLowerCase('fr'); };
// (« ainsi que » quand un domaine contient déjà « et » : pas de « les nombres et le calcul et l’espace… ».)
const enumeration = l => (l.length > 1 ? `${l.slice(0, -1).join(', ')}${l.some(x => x.includes(' et ')) ? ', ainsi que' : ' et'} ${l.at(-1)}` : l[0] || '');
function proposerMatiere(l, m, graine = 0) {
  if (m.niveau === null) return '';
  const niv = Math.max(1, Math.min(4, Math.round(m.niveau)));
  let t = phraseChoisie(PHRASES_MATIERE[niv], l.el.id + m.ca, graine).replace('{P}', prenomLivret(l.el)).replace('{m}', EN_MATIERE[m.ca] || `en ${m.titre.toLocaleLowerCase('fr')}`);
  const notes = m.domaines.filter(x => x.degre);
  if (notes.length > 1) {
    const haut = Math.max(...notes.map(x => x.degre)), bas = Math.min(...notes.map(x => x.degre));
    if (haut - bas >= 1) {
      const liste = l => enumeration(l.map(domaineEnPhrase));
      if (haut >= 3) t += ` Point d’appui : ${liste(notes.filter(x => x.degre === haut))}.`;
      if (bas <= 2) t += ` À travailler : ${liste(notes.filter(x => x.degre === bas))}.`;
    }
  }
  return t;
}
function proposerGenerale(l, graine = 0) {
  const v = l.matieres.map(m => m.niveau).filter(x => x !== null);
  if (!v.length) return '';
  const niv = Math.max(1, Math.min(4, Math.round(v.reduce((a, b) => a + b, 0) / v.length)));
  return phraseChoisie(PHRASES_GENERALES[niv], l.el.id + 'general', graine).replace('{P}', prenomLivret(l.el));
}
const texteMatiere = (l, m) => l.doc.appr?.[m.ca] ?? proposerMatiere(l, m);
const texteGenerale = l => l.doc.general ?? proposerGenerale(l);
const absencesPeriode = (el, periode) => {
  const a = appelsEleve(el).filter(x => periodeDe(x.date) === periode), n = k => a.filter(x => x.etat === k).length;
  return { abs: n('AN') + n('AJ'), nj: n('AN'), ret: n('R') };
};
const elementsTravailles = (c, periode, ca) => c.livret?.[periode]?.[ca] || '';

function htmlFicheLivret(l) {
  const a = absencesPeriode(l.el, l.periode), c = l.c;
  return `
    <p class="aide">${esc(l.ref.nom)} · Absences : ${a.abs} demi-journée${a.abs > 1 ? 's' : ''}${a.nj ? ` (dont ${a.nj} non justifiée${a.nj > 1 ? 's' : ''})` : ''} · Retards : ${a.ret}</p>
    ${l.matieres.map(m => `<section class="matiere-livret">
      <h3>${esc(m.titre)}${m.notes.moy !== null ? ` <span class="aide">moyenne ${fmt1(m.notes.moy)}/20</span>` : ''}</h3>
      ${m.domaines.map(x => `<div class="domaine-livret"><span>${esc(x.a.texte)}</span>
        <span class="choix-position" role="group" aria-label="${esc(x.a.texte)}">${[1, 2, 3, 4].map(n => `<button type="button" class="niveau${x.degre === n ? ` n${n}` : ''}${x.degre === n && !x.manuel ? ' auto' : ''}" data-livret="position" data-arg="${esc(x.a.id)}|${n}" title="${esc(POSITIONS_LSU[n - 1])}" aria-pressed="${x.degre === n}">${n}</button>`).join('')}</span></div>`).join('')}
      <label class="appr-livret">Appréciation
        <textarea rows="2" data-livret-appr="${esc(m.ca)}" placeholder="${m.niveau === null ? 'Rien d’évalué sur cette période : écris ici si besoin.' : ''}">${esc(texteMatiere(l, m))}</textarea></label>
      ${m.niveau !== null ? `<button type="button" class="lien" data-livret="autre" data-arg="${esc(m.ca)}">🎲 Autre proposition</button>` : ''}
    </section>`).join('')}
    <section class="matiere-livret"><h3>Appréciation générale</h3>
      <textarea rows="3" data-livret-general aria-label="Appréciation générale">${esc(texteGenerale(l))}</textarea>
      <button type="button" class="lien" data-livret="autre-general">🎲 Autre proposition</button>
      <label>Modalités d’accompagnement<input data-livret-accomp value="${esc(l.doc.accompagnement || '')}" placeholder="PPRE, APC, PAP, PPS…"></label>
    </section>
    <p class="aide">Degrés : 1 ${esc(POSITIONS_LSU[0])} · 2 ${esc(POSITIONS_LSU[1])} · 3 ${esc(POSITIONS_LSU[2])} · 4 ${esc(POSITIONS_LSU[3])}. Un degré pâle est proposé par l’appli (dernier degré de la période) ; touche-le pour le confirmer ou le changer.</p>
    <p class="aide">Ce sont des propositions de l’appli, à relire avant de les recopier dans le LSU de ${esc(c.nom)}.</p>`;
}

function htmlClasseLivret(c, periode) {
  const eleves = elevesDe(c.id), matieres = matieresClasse(c);
  return `<div class="table-defile"><table class="table-labo"><thead><tr><th>Élève</th>${matieres.map(([k, t]) => `<th title="${esc(t)}">${esc(k)}</th>`).join('')}<th>Générale</th></tr></thead>
    <tbody>${eleves.map(el => { const l = livretEleve(el, c, periode); return `<tr><th><button type="button" class="lien" data-livret="ouvrir" data-arg="${el.id}">${esc(el.nom)} ${esc(el.prenom)}</button></th>
      ${matieres.map(([k]) => { const m = l.matieres.find(x => x.ca === k), n = m?.niveau ?? null; return `<td>${n === null ? '<span class="aide">–</span>' : `<span class="niveau n${Math.round(n)}">${Number.isInteger(n) ? n : fmt1(n)}</span>`}</td>`; }).join('')}
      <td>${texteGenerale(l) ? '✔' : ''}</td></tr>`; }).join('')}</tbody></table></div>
    <h3>Éléments du programme travaillés</h3>
    <p class="aide">Pour toute la classe, sur la période (ce que le LSU demande pour chaque matière).</p>
    ${matieres.map(([k, t]) => `<label>${esc(t)}<textarea rows="2" data-livret-elements="${esc(k)}">${esc(elementsTravailles(c, periode, k))}</textarea></label>`).join('')}`;
}

function texteLivret(l) {
  const a = absencesPeriode(l.el, l.periode), code = periodesAnnee().find(p => p.id === l.periode)?.code || '';
  return [`${l.el.prenom} ${l.el.nom} — ${l.c.nom} — ${code}`, `Absences : ${a.abs} demi-journée(s), retards : ${a.ret}`, '',
    ...l.matieres.flatMap(m => {
      const avec = m.domaines.filter(x => x.degre), t = texteMatiere(l, m);
      return avec.length || t ? [m.titre.toLocaleUpperCase('fr'), ...avec.map(x => `  ${x.a.texte} : ${POSITIONS_LSU[x.degre - 1]}`), ...(t ? [`  ${t}`] : []), ''] : [];
    }),
    `APPRÉCIATION GÉNÉRALE`, texteGenerale(l), ...(l.doc.accompagnement ? [`Accompagnement : ${l.doc.accompagnement}`] : [])].join('\n');
}

function htmlImpressionLivret(l) {
  const a = absencesPeriode(l.el, l.periode), code = periodesAnnee().find(p => p.id === l.periode)?.code || '';
  const lignes = l.matieres.filter(m => m.domaines.some(x => x.degre) || texteMatiere(l, m));
  return `<section class="page-livret"><h1>Livret — ${esc(l.el.prenom)} ${esc(l.el.nom)}</h1>
    <p>${esc(l.c.nom)} · ${esc(code)} · Absences : ${a.abs} demi-journée${a.abs > 1 ? 's' : ''} · Retards : ${a.ret}</p>
    <table><thead><tr><th>Matière</th><th>Positionnement</th><th>Appréciation</th></tr></thead><tbody>${lignes.map(m => `<tr><td><b>${esc(m.titre)}</b></td>
      <td>${m.domaines.filter(x => x.degre).map(x => `${esc(x.a.texte)} : ${esc(POSITIONS_LSU[x.degre - 1])}`).join('<br>')}</td><td>${esc(texteMatiere(l, m))}</td></tr>`).join('')}</tbody></table>
    <h2>Appréciation générale</h2><p>${esc(texteGenerale(l))}</p>${l.doc.accompagnement ? `<p>Accompagnement : ${esc(l.doc.accompagnement)}</p>` : ''}</section>`;
}

async function ouvrirLivret(c) {
  const eleves = elevesDe(c.id);
  if (!eleves.length) return toast('Ajoute d’abord des élèves.');
  const etat = { periode: periodeLivretDefaut(), id: eleves[0].id, vue: 'eleve', graines: {} };
  const el = () => Donnees.get('eleves', etat.id);
  const courant = () => livretEleve(el(), Donnees.get('classes', c.id), etat.periode);
  const entete = () => `<div class="outils">
      <label class="choix-tri">Période<select data-livret-periode>${periodesAnnee().map(p => `<option value="${p.id}" ${p.id === etat.periode ? 'selected' : ''}>${p.code} (${esc(p.texte)})</option>`).join('')}</select></label>
      <button type="button" class="icone-petit" data-livret="periodes" title="Trimestres, semestres ou 5 périodes" aria-label="Régler les périodes">⚙</button>
      <div class="fiche-onglets"><button type="button" class="${etat.vue === 'eleve' ? 'actif' : ''}" data-livret="vue" data-arg="eleve">👤 Élève</button><button type="button" class="${etat.vue === 'classe' ? 'actif' : ''}" data-livret="vue" data-arg="classe">📋 Classe</button></div>
      ${etat.vue === 'eleve' ? `<span class="choix-eleve-livret"><button type="button" data-livret="suivant" data-arg="-1" aria-label="Élève précédent">◀</button>
      <select data-livret-eleve aria-label="Élève">${eleves.map(x => `<option value="${x.id}" ${x.id === etat.id ? 'selected' : ''}>${esc(x.nom)} ${esc(x.prenom)}</option>`).join('')}</select>
      <button type="button" data-livret="suivant" data-arg="1" aria-label="Élève suivant">▶</button></span>` : ''}</div>`;
  const corps = () => entete() + (etat.vue === 'eleve' ? htmlFicheLivret(courant()) : htmlClasseLivret(Donnees.get('classes', c.id), etat.periode));
  const { d, resultat } = ouvrirModale(`📘 Livret — ${c.nom}`, `<div data-corps>${corps()}</div>`,
    '<button type="button" data-livret="copier">📋 Copier</button><button type="button" data-livret="imprimer">🖨 Imprimer</button><span class="espace"></span><button type="button" data-fermer class="primaire">Fermer</button>', 'modale-large livret-ecole');
  const redessiner = () => {
    const z = $('[data-corps]', d), haut = z.closest('.modale')?.scrollTop;
    z.innerHTML = corps();
    if (z.closest('.modale') && haut !== undefined) z.closest('.modale').scrollTop = haut;
  };
  d.addEventListener('click', ev => {
    const b = ev.target.closest('[data-livret]');
    if (!b) return;
    ev.preventDefault();
    const quoi = b.dataset.livret, arg = b.dataset.arg;
    lancer(async () => {
      if (quoi === 'vue') { etat.vue = arg; redessiner(); }
      else if (quoi === 'suivant') { const k = eleves.findIndex(x => x.id === etat.id); etat.id = eleves[(k + +arg + eleves.length) % eleves.length].id; redessiner(); }
      else if (quoi === 'ouvrir') { etat.id = arg; etat.vue = 'eleve'; redessiner(); }
      else if (quoi === 'periodes') { await editerPeriodes(); if (!periodesAnnee().some(p => p.id === etat.periode)) etat.periode = periodesAnnee()[0].id; redessiner(); }
      else if (quoi === 'position') {
        const [id, n] = arg.split('|'), doc = livretDe(el(), etat.periode), positions = { ...doc.positions };
        const l = courant(), x = l.matieres.flatMap(m => m.domaines).find(y => y.a.id === id);
        // Toucher le degré retenu à la main l'enlève (retour à la proposition).
        if (x?.manuel && x.degre === +n) delete positions[id]; else positions[id] = n;
        ecrireLivret(el(), etat.periode, { positions });
        redessiner();
      } else if (quoi === 'autre') {
        const l = courant(), m = l.matieres.find(x => x.ca === arg), cle = arg;
        etat.graines[cle] = (etat.graines[cle] || 0) + 1;
        ecrireLivret(el(), etat.periode, { appr: { ...l.doc.appr, [arg]: proposerMatiere(l, m, etat.graines[cle]) } });
        redessiner();
      } else if (quoi === 'autre-general') {
        etat.graines.general = (etat.graines.general || 0) + 1;
        ecrireLivret(el(), etat.periode, { general: proposerGenerale(courant(), etat.graines.general) });
        redessiner();
      } else if (quoi === 'copier') {
        const cl = Donnees.get('classes', c.id);
        await copierTexte(etat.vue === 'eleve' ? texteLivret(courant()) : eleves.map(x => texteLivret(livretEleve(x, cl, etat.periode))).join('\n\n———\n\n'));
      } else if (quoi === 'imprimer') {
        const cl = Donnees.get('classes', c.id), liste = etat.vue === 'eleve' ? [el()] : eleves;
        imprimerZoneEcole(liste.map(x => htmlImpressionLivret(livretEleve(x, cl, etat.periode))).join(''), `Livret ${cl.nom} ${etat.periode}`);
      }
    });
  });
  d.addEventListener('change', ev => {
    const t = ev.target;
    if (t.matches('[data-livret-periode]')) { etat.periode = t.value; return redessiner(); }
    if (t.matches('[data-livret-eleve]')) { etat.id = t.value; return redessiner(); }
    // (Champs de texte : enregistrés sans redessiner, pour ne pas perdre le focus.)
    if (t.matches('[data-livret-appr]')) ecrireLivret(el(), etat.periode, { appr: { ...livretDe(el(), etat.periode).appr, [t.dataset.livretAppr]: t.value } });
    else if (t.matches('[data-livret-general]')) ecrireLivret(el(), etat.periode, { general: t.value });
    else if (t.matches('[data-livret-accomp]')) ecrireLivret(el(), etat.periode, { accompagnement: t.value.trim() });
    else if (t.matches('[data-livret-elements]')) {
      const cl = Donnees.get('classes', c.id), livret = cl.livret || {};
      Donnees.ecrire('classes', { ...cl, livret: { ...livret, [etat.periode]: { ...livret[etat.periode], [t.dataset.livretElements]: t.value } } });
    }
  });
  await resultat;
  rendreVue();
}

/* ---------- Événements des vues ---------- */

document.addEventListener('click', e => {
  const b = e.target.closest?.('#vue [data-ecole]');
  if (!b || b.disabled || !avecEcole()) return;
  const c = classeActive();
  if (!c) return;
  const arg = b.dataset.arg;
  switch (b.dataset.ecole) {
    case 'livret': return lancer(() => ouvrirLivret(c));
    case 'niveaux': return lancer(() => editerNiveauxEleves(c));
    case 'matiere': ui.matiereEcole = arg; memoriserUi(); return rendreVue();
    case 'niveau': ui.niveauEcole = arg; memoriserUi(); return rendreVue();
    case 'demi': ui.demiJournee = arg; return rendreVue();
    case 'appel-aujourdhui': ui.dateAppel = ''; return rendreVue();
    case 'pointer': { const [id, k] = arg.split('|'); return lancer(() => pointerEcole(c, id, k)); }
    case 'justifier': return lancer(() => {
      const date = dateAppelEcole(), dj = demiJournee(), el = Donnees.get('eleves', arg), s = assurerSeanceAppelJour(c, date);
      Donnees.ecrireNote(s.id, arg, ETATS_ECOLE[etatDemiJournee(c, date, dj, el) === 'AJ' ? 'AN' : 'AJ'], dj);
      rendreVue();
    });
    case 'cantine': return lancer(() => {
      const s = assurerSeanceAppelJour(c, dateAppelEcole());
      Donnees.ecrireNote(s.id, arg, Donnees.note(s.id, arg, ID_CANTINE) === 'Oui' ? '' : 'Oui', ID_CANTINE);
      rendreVue();
    });
    case 'tous': return lancer(() => {
      const date = dateAppelEcole(), dj = demiJournee(), s = assurerSeanceAppelJour(c, date);
      for (const el of elevesDe(c.id)) if (!etatDemiJournee(c, date, dj, el)) Donnees.ecrireNote(s.id, el.id, ETATS_ECOLE.P, dj);
      rendreVue();
      toast('Appel terminé ✔', 'ok');
    });
    case 'bilan-mois': return lancer(() => ouvrirBilanMois(c));
    case 'jour': { const d = decalerJour(dateJournal(), +arg); ui.dateJournal = d === aujourdhui() ? '' : d; return rendreVue(); }
    case 'journal-aujourdhui': ui.dateJournal = ''; return rendreVue();
    case 'aller-jour': ui.dateJournal = arg; return rendreVue();
    case 'seance': return lancer(() => editerSeanceJournal(c, arg));
    case 'etat': return lancer(() => {
      const [id, etat] = arg.split('|'), s = Donnees.get('seances', id);
      if (s) Donnees.ecrire('seances', { ...s, etat: s.etat === etat ? '' : etat });
      rendreVue();
    });
    case 'reprendre-jour': return lancer(() => reprendreJour(c, arg));
    case 'imprimer-journal': return lancer(() => imprimerJournal(c));
    default:
  }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (!avecEcole() || !t.matches?.('#vue *')) return;
  if (t.matches('[data-date-appel-ecole]')) { ui.dateAppel = t.value && t.value !== aujourdhui() ? t.value : ''; return rendreVue(); }
  if (t.matches('[data-date-journal]')) { ui.dateJournal = t.value && t.value !== aujourdhui() ? t.value : ''; return rendreVue(); }
  if (t.matches('[data-bilan-journal]')) { // (texte : enregistré sans redessiner)
    const s = Donnees.get('seances', t.dataset.bilanJournal);
    if (s) Donnees.ecrire('seances', { ...s, bilan: t.value });
  }
});

/* ---------- 🎓 Classe exemple (CE2, élèves et résultats inventés) ---------- */

const ELEVES_EXEMPLE_ECOLE = [['ARNAUD', 'Chloé', 'F', 3], ['BENALI', 'Yanis', 'G', 2], ['CARON', 'Louise', 'F', 4], ['DIALLO', 'Moussa', 'G', 3], ['ESTEVE', 'Inès', 'F', 3], ['FABRE', 'Noah', 'G', 2],
  ['GIRARD', 'Lina', 'F', 4], ['HENRY', 'Théo', 'G', 1], ['IBANEZ', 'Rose', 'F', 3], ['JOLY', 'Adam', 'G', 3], ['KLEIN', 'Manon', 'F', 2], ['LEROY', 'Hugo', 'G', 4],
  ['MARCHAND', 'Zoé', 'F', 3], ['NGUYEN', 'Liam', 'G', 3], ['OLIVIER', 'Jade', 'F', 2], ['PETIT', 'Gabriel', 'G', 3], ['ROUX', 'Alice', 'F', 4], ['SIMON', 'Tom', 'G', 2]];
const EVALS_EXEMPLE_ECOLE = [
  ['FR', 'Lecture : comprendre un récit', [1]], ['FR', 'Dictée de mots', [3]], ['FR', 'Écrire la suite d’une histoire', [0, 2]],
  ['MA', 'Nombres jusqu’à 1 000', [0]], ['MA', 'Mesurer des longueurs', [1]], ['MA', 'Reproduire une figure', [2]],
  ['QLM', 'Le cycle de l’eau', [0]], ['EPS', 'Parcours d’athlétisme', [0]], ['EMC', 'Les règles de la classe', [0]],
];
const JOURNEE_EXEMPLE_ECOLE = [
  ['08:30', '09:00', 'FR', 'Rituel : dictée flash', 'Écrire sans erreur les mots appris', '', 'Bon rythme. Revoir les accords avec Théo.', 'fait'],
  ['09:00', '10:00', 'FR', 'Lecture : le personnage principal', 'Repérer les informations sur un personnage', 'Lecture silencieuse, questions, mise en commun', 'Bien compris par la plupart des élèves.', 'fait'],
  ['10:30', '11:30', 'MA', 'Numération : les centaines', 'Décomposer un nombre à trois chiffres', 'Manipulation, puis fichier', 'Échanges 10 dizaines = 1 centaine à revoir.', 'reprendre'],
  ['13:30', '14:15', 'QLM', 'Le cycle de l’eau', 'Nommer les états de l’eau', 'Expérience de la buée, schéma', '', ''],
  ['14:15', '15:30', 'EPS', 'Athlétisme : courir, sauter, lancer', 'Enchaîner un parcours en sécurité', 'Ateliers tournants', '', ''],
];

function creerExempleEcole(jeu) {
  const P = 'exemple-', idC = idClasseExemple(jeu);
  if (Donnees.get('classes', idC)) return Donnees.get('classes', idC);
  const auj = aujourdhui(), ref = REFERENTIEL.refs.ecoleCycle2, c = Donnees.ecrire('classes', { id: idC, nom: jeu.nom, niveau: jeu.niveau, exemple: true, portraits: true, ppExemple: VERSION_PP_EXEMPLE, creneaux: [] });
  const eleves = ELEVES_EXEMPLE_ECOLE.map(([nom, prenom, sexe, base], k) => ({ base, el: Donnees.ecrire('eleves', { id: `${P}e${k + 1}`, classeId: c.id, ordre: k, nom, prenom, sexe, remarque: '', photo: portraitExemple(sexe, k) }) }));
  const hasard = hasardExemple(2026);
  EVALS_EXEMPLE_ECOLE.forEach(([ca, titre, rangs], k) => {
    const attendus = ref.champs[ca].attendus, date = decalerJour(auj, -(k * 3 + 2));
    const e = Donnees.ecrire('evals', { id: `${P}v${k + 1}`, classeId: c.id, cree: Date.now() + k, titre, apsa: '', date, max: 20, coef: 1, sansNote: true, referentiel: 'ecoleCycle2', ca, competences: rangs.map(r => attendus[r].id), competencesLibres: '', preremplir: false });
    for (const x of eleves) {
      for (const a of competencesEval(e)) {
        const v = Math.max(1, Math.min(4, x.base + Math.round((hasard() - 0.5) * 2)));
        Donnees.ecrireNote(e.id, x.el.id, String(v), a.id);
      }
    }
  });
  // Une dictée notée : la note chiffrée reste possible.
  const notee = Donnees.ecrire('evals', { id: `${P}v-notee`, classeId: c.id, cree: Date.now() + 20, titre: 'Dictée n° 3 (notée)', apsa: 'Orthographe', date: decalerJour(auj, -1), max: 10, coef: 1, referentiel: 'ecoleCycle2', ca: 'FR', competences: [ref.champs.FR.attendus[3].id], competencesLibres: '', preremplir: false });
  for (const x of eleves) {
    Donnees.ecrireNote(notee.id, x.el.id, String(Math.max(2, Math.min(10, x.base * 2 + Math.round(hasard() * 3)))));
    Donnees.ecrireNote(notee.id, x.el.id, String(x.base), ref.champs.FR.attendus[3].id);
  }
  // Cahier journal : aujourd'hui, et une journée la semaine dernière pour « Reprendre le plan ».
  for (const [date, dec] of [[auj, 'j'], [decalerJour(auj, -7), 'p']]) {
    JOURNEE_EXEMPLE_ECOLE.forEach(([heure, fin, ca, titre, objectif, deroulement, bilan, etat], k) => Donnees.ecrire('seances', { id: `${P}j${dec}${k}`, classeId: c.id, cree: Date.now() + k, date, heure, fin, ca, titre, apsa: '', objectif, deroulement, bilan: dec === 'p' ? bilan : '', etat: dec === 'p' ? etat : '', indicateurs: [], documents: [] }));
  }
  // Appel des 10 derniers jours (et une absence répétée).
  for (let k = 1; k <= 10; k++) {
    const date = decalerJour(auj, -k), jour = new Date(date + 'T12:00').getDay();
    if (jour === 0 || jour === 3 || jour === 6) continue;
    const s = assurerSeanceAppelJour(c, date);
    eleves.forEach((x, i) => {
      for (const dj of [ID_MATIN, ID_APRES_MIDI]) Donnees.ecrireNote(s.id, x.el.id, i === 7 && k <= 3 ? ETATS_ECOLE.AN : i === 4 && k === 2 ? ETATS_ECOLE.AJ : i === 10 && k === 1 && dj === ID_MATIN ? ETATS_ECOLE.R : ETATS_ECOLE.P, dj);
      if (i % 3 && !(i === 7 && k <= 3)) Donnees.ecrireNote(s.id, x.el.id, 'Oui', ID_CANTINE);
    });
  }
  remplirOutilsExemple(c);
  return Donnees.get('classes', c.id);
}
EXEMPLES.ecole = { nom: 'CE2 Exemple', niveau: 'CE2', eleves: [], creer: creerExempleEcole };
