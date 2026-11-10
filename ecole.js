'use strict';
/* ---------- Carnet École : ce qui est propre à l'école élémentaire ----------
   Rien ici ne s'exécute dans les carnets EPS, SVT ou PC (avecEcole() est faux : les vues d'app.js ne l'appellent pas).
   - Notes : filtres par matière et par niveau, évaluations en degrés (note chiffrée en option).
   - Appel par demi-journée (absence justifiée ou non, retard, cantine) ; bilan du mois.
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
  return `<button data-ecole="livret" title="Positionnements et appréciations de la période, à recopier dans le LSU">${iconeEcole('livre')}Livret</button>`
    + (niveauxDeClasse(c).length ? ` <button data-ecole="niveaux" title="Dire quel élève est dans quel niveau">${iconeEcole('eleves')}Niveaux</button>` : '');
}

// À droite de la barre de l'onglet Notes : tout ce qui règle la notation de la classe, au même endroit
// (note → degré, noms des degrés, compétences évaluées). Retiré des Réglages du carnet et de « Modifier la classe ».
function htmlBoutonReglagesNotesEcole(c) {
  return `<button type="button" class="btn-reglages-notes" data-ecole="reglages-notes" title="Note → degré (${seuilsClasse(c).map(fmt).join(' / ')}), noms des degrés, compétences évaluées">${iconeEcole('reglages')}Réglages des notes</button>`;
}

async function reglerNotesEcole(c) {
  const s = seuilsClasse(c), noms = reglage('competences').niveaux;
  const { resultat } = ouvrirModale(`Réglages des notes — ${c.nom}`, `
    <fieldset class="competences" data-reglages-notes>
      <legend>Note → degré de maîtrise</legend>
      <div class="ligne seuils">
        ${[2, 3, 4].map((n, i) => `<label><span><span class="niveau n${n}">${n}</span> dès</span><input type="number" name="s${n}" min="0" max="20" step="any" required value="${s[i]}"></label>`).join('')}
        <span class="aide">sur 20 — en dessous : <span class="niveau n1">1</span></span>
      </div>
      <p class="aide">Pour les évaluations notées : un 14/20 pré-remplit le degré 3 si « 3 dès 14 ». Les degrés choisis à la main ne bougent pas.
        Une évaluation peut garder ses propres seuils (dans sa fenêtre).</p>
    </fieldset>
    <fieldset class="competences">
      <legend>Noms des 4 degrés</legend>
      <div class="table-reglages">${noms.map((nom, i) => `<span class="niveau n${i + 1}">${i + 1}</span>
        <input name="niv${i + 1}" value="${esc(nom)}" placeholder="${esc(REGLAGES_DEFAUT.competences.niveaux[i])}" maxlength="40" aria-label="Nom du degré ${i + 1}">`).join('')}</div>
    </fieldset>
    <fieldset class="competences">
      <legend>Compétences évaluées</legend>
      <p class="aide">Ajouter tes propres compétences, renommer, ou ne plus proposer celles du programme dont tu ne te sers pas.</p>
      <button value="competences">${iconeEcole('cible')}Créer ou modifier les compétences…</button>
    </fieldset>`, boutonsModale('Enregistrer'));
  const r = await resultat;
  if (r.action !== 'ok' && r.action !== 'competences') return;
  const v = r.data, seuils = [+v.s2, +v.s3, +v.s4].sort((x, y) => x - y);
  if (!memesSeuils(seuils, seuilsClasse(c))) {
    const enreg = Donnees.ecrire('classes', { ...c, seuils });
    // Degrés pré-remplis des évaluations qui suivent les seuils de la classe (comme « Modifier la classe » avant).
    for (const e of evalsDe(enreg.id).filter(e => !e.seuils)) for (const el of elevesDe(enreg.id)) preremplirDegres(e, el.id);
  }
  ecrireReglage('competences', { niveaux: [1, 2, 3, 4].map(i => v['niv' + i].trim() || REGLAGES_DEFAUT.competences.niveaux[i - 1]) });
  appliquerReglages(true);
  rendre();
  if (r.action === 'competences') return gererCompetences();
  toast('Réglages des notes enregistrés ✔', 'ok');
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
  const { d, resultat } = ouvrirModale(`Niveaux — ${c.nom}`, `
    <p class="aide">Le niveau de chaque élève sert aux filtres de l’onglet Notes et au livret (les matières changent entre le cycle 2 et le cycle 3).</p>
    <div class="table-defile"><table class="table-labo"><tbody>${eleves.map(el => `<tr><th>${esc(el.nom)} ${esc(el.prenom)}</th>
      <td><select name="niv-${el.id}" aria-label="Niveau de ${esc(el.prenom)}"><option value="">—</option>${niveaux.map(n => `<option ${el.niveau === n ? 'selected' : ''}>${n}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table></div>`,
  boutonsModale('Enregistrer'));
  iconeTitreModale(d, 'eleves');
  const r = await resultat;
  if (r.action !== 'ok') return;
  for (const el of eleves) {
    const n = r.data['niv-' + el.id] || '';
    if (n !== (el.niveau || '')) Donnees.ecrire('eleves', { ...el, niveau: n || undefined });
  }
  rendre();
}

/* ---------- Icônes du carnet École : un seul jeu, trait 1,75, bouts arrondis, currentColor (pas d'émoji) ---------- */
const TRACES_ECOLE = {
  appel: '<path d="M9 4H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2"/><rect x="9" y="2.5" width="6" height="3" rx="1"/><path d="m9 13.5 2 2 4-4"/>',
  matin: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  apresMidi: '<path d="M7 17a5 5 0 0 1 10 0M3 17h18M6 21h12M12 5v3M4.9 9.9l1.4 1.4M19.1 9.9l-1.4 1.4"/>',
  bilan: '<path d="M4 20h16M7.5 16v-5M12 16V6M16.5 16v-8"/>',
  present: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.8 2.8L16 9.8"/>',
  absent: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
  retard: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2.5h5"/>',
  cantine: '<path d="M6 3v6a3 3 0 0 0 6 0V3M9 3v18M17.5 21V3A3.5 3.5 0 0 0 14 6.5V14h3.5"/>',
  justifiee: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 14.5l2 2 4-4"/>',
  nonJustifiee: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.4c-.6.3-1 .9-1 1.5v.5M12 17h.01"/>',
  alerte: '<path d="M10.3 4.2 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z"/><path d="M12 9.5v4M12 17h.01"/>',
  regarder: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  calendrier: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  copier: '<rect x="8.5" y="8.5" width="12" height="12" rx="2"/><path d="M15.5 8.5v-3a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/>',
  imprimer: '<path d="M7 9V3.5h10V9M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="7" y="14" width="10" height="7" rx="1"/>',
  coche: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  modifier: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  ajouter: '<path d="M12 5v14M5 12h14"/>',
  reglages: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  telecharger: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/>',
  // (Réglages du carnet, en École : reglages.js › titreRubrique)
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.5-1.9l-.3-.9c-.4-1.2.5-2.2 1.7-2.2H17a4 4 0 0 0 4-4c0-5-4-9-9-9z"/><circle cx="7.5" cy="11.5" r="1"/><circle cx="10.5" cy="7.5" r="1"/><circle cx="15" cy="8" r="1"/>',
  ecole: '<path d="M3 21h18M5 21V10l7-5 7 5v11"/><path d="M10 21v-5h4v5M12 9.5v.01"/>',
  livre: '<path d="M5 18.5V5a2 2 0 0 1 2-2h12v14H7a2 2 0 0 0-2 2 2 2 0 0 0 2 2h12v-4"/>',
  liste: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
  cible: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  partager: '<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.6L4 15.5M4 20v-4.5h4.5"/>',
  cadenas: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5v-3a4 4 0 0 1 8 0v3"/>',
  appli: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  precedent: '<path d="m14.5 6-6 6 6 6"/>',
  suivant: '<path d="m9.5 6 6 6-6 6"/>',
  // (Onglets, livret, cahier journal, outils de la classe, aide : v1.21.1)
  eleves: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/>',
  eleve: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
  notes: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  cahier: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v18M12.5 8h3.5M12.5 12h3.5"/>',
  outils: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
  regle: '<path d="m3.5 16.5 13-13 4 4-13 13z"/><path d="m7.5 12.5 2 2M10.5 9.5l2 2M13.5 6.5l2 2"/>',
  etoile: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  chapeau: '<path d="M2.5 9 12 4.5 21.5 9 12 13.5z"/><path d="M6.5 11v4.5c0 1.4 2.5 3 5.5 3s5.5-1.6 5.5-3V11M21.5 9v5"/>',
  enregistrer: '<path d="M5 3.5h11.5L20.5 7.5V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V5A1.5 1.5 0 0 1 5 3.5z"/><path d="M7.5 3.5v5h8v-5M7.5 20.5v-6h9v6"/>',
  reprendre: '<path d="M4 12h12M12 7l5 5-5 5M20 6v12"/>',
  de: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01"/>',
  lecture: '<path d="M12 6.5C10 5 7 4.5 3.5 5v13.5c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5zM12 6.5V20"/>',
  groupes: '<circle cx="7" cy="16.5" r="3"/><circle cx="17" cy="16.5" r="3"/><circle cx="12" cy="7.5" r="3"/>',
  plan: '<rect x="3.5" y="4" width="17" height="3" rx="1"/><path d="M5 11h4M15 11h4M5 15.5h4M15 15.5h4M5 20h4M15 20h4"/>',
  calcul: '<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8.5 6.5h7M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 18h.01M12 18h.01M15.5 18h.01"/>',
  fois: '<path d="m7 7 10 10M17 7 7 17"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  recommencer: '<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5M4 4v4.5h4.5"/>',
  corbeille: '<path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5M14 11v5"/>',
  horloge: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  chrono: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 10v3.5l2 1.5M10 2.5h4M12 2.5V6M18.5 6l1.5-1.5"/>',
  tours: '<path d="M5 20V4M5 4.5h11l-2.5 3.5L16 11.5H5"/>',
  equipe: '<circle cx="12" cy="7" r="3"/><circle cx="5" cy="10" r="2.5"/><circle cx="19" cy="10" r="2.5"/><path d="M7 20a5 5 0 0 1 10 0M1.5 18a3.5 3.5 0 0 1 4.5-3.4M22.5 18a3.5 3.5 0 0 0-4.5-3.4"/>',
  score: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M12 5v14M7.5 10v4M15.5 10h2v4h-2z"/>',
  coupe: '<path d="M8 3.5h8v5a4 4 0 0 1-8 0zM8 5.5H4.5a3 3 0 0 0 3.5 4M16 5.5h3.5a3 3 0 0 1-3.5 4M12 12.5v4M8 20.5h8M9.5 20.5l.5-4h4l.5 4"/>',
  vent: '<path d="M3 8h10a2.5 2.5 0 1 0-2.5-2.5M3 12h15a2.5 2.5 0 1 1-2.5 2.5M3 16h7"/>',
  // (Fiche élève : fichenotes.js)
  boussole: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  sante: '<path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z"/><path d="M12 10.5v5M9.5 13h5"/>',
  couronne: '<path d="M4 17.5 3 7.5l5 4 4-6.5 4 6.5 5-4-1 10z"/><path d="M5 20.5h14"/>',
  pleinEcran: '<path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15"/>',
  silence: '<path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8l-4 3.5V17H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/><path d="m3 3 18 18"/>',
  // (À la place des émojis restants du carnet École : v1.21.5)
  envoyer: '<path d="M12 20V9M7.5 13.5 12 9l4.5 4.5M5 4.5h14"/>',
  nuage: '<path d="M7 18.5h10.5a4 4 0 0 0 .3-8 5.5 5.5 0 0 0-10.7-1.3A4.7 4.7 0 0 0 7 18.5z"/>',
  cle: '<rect x="7.5" y="9" width="9" height="12" rx="2"/><path d="M9.5 9V3.5h5V9M11 6.25h.01M13 6.25h.01"/>',
  ordi: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2.5 19.5h19"/>',
  cartable: '<rect x="4.5" y="8" width="15" height="12.5" rx="2.5"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8M4.5 13h15M11 13v2h2v-2"/>',
  remarque: '<path d="M5 4.25h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8l-4 3.5v-3.5H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z"/>',
  courbe: '<path d="M4 20h16M5 15.5l4.5-4.5 3.5 3 6-6.5M15 7.5h4v4"/>',
  jouer: '<path d="M8 5.5v13l10.5-6.5z"/>',
  avance: '<path d="m5 6 6 6-6 6M13 6l6 6-6 6"/>',
  soleil: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  lune: '<path d="M19.5 14.5A8 8 0 1 1 9.5 4.5a6.5 6.5 0 0 0 10 10z"/>',
  dossier: '<path d="M3.5 7a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  loupe: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/>',
  lien: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  telephone: '<path d="M5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 3 5.5a2 2 0 0 1 2-2z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.75"/><path d="m4 18 5-5 3.5 3.5 2.5-2.5 5 4.5"/>',
  aide: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.5v.7M12 17h.01"/>',
  // (Appel et outils de toutes les disciplines, à la place des émojis : v1.27.0)
  tenue: '<path d="M9 3.5 4 6 2.5 10.5l3 1.2v8.8h13v-8.8l3-1.2L20 6l-5-2.5a3 3 0 0 1-6 0z"/>',
  thermometre: '<path d="M10 14.5V5a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0z"/><path d="M12 9v8"/>',
  pansement: '<rect x="2.5" y="8.5" width="19" height="7" rx="3.5" transform="rotate(-45 12 12)"/><path d="M10.6 10.6h.01M13.4 13.4h.01M10.6 13.4h.01M13.4 10.6h.01" stroke-width="2.25"/>',
  autre: '<circle cx="12" cy="12" r="9"/><path d="M8 12h.01M12 12h.01M16 12h.01" stroke-width="2.5"/>',
  camera: '<rect x="2.5" y="6.5" width="13.5" height="11" rx="2"/><path d="m16 10.5 5.5-3v9l-5.5-3z"/>',
  medaille: '<circle cx="12" cy="15" r="5.5"/><path d="M8.6 10.7 5.5 3h4l2.5 6M15.4 10.7 18.5 3h-4L12 9M12 13v4"/>',
  natation: '<circle cx="16.5" cy="6" r="2"/><path d="m5 12 4.5-4 3 2.5 3-1"/><path d="M2.5 16c1.6 0 1.6-1.3 3.2-1.3s1.6 1.3 3.2 1.3 1.6-1.3 3.1-1.3 1.6 1.3 3.2 1.3 1.6-1.3 3.2-1.3 1.6 1.3 3.1 1.3M2.5 20c1.6 0 1.6-1.3 3.2-1.3s1.6 1.3 3.2 1.3 1.6-1.3 3.1-1.3 1.6 1.3 3.2 1.3 1.6-1.3 3.2-1.3 1.6 1.3 3.1 1.3"/>',
  podium: '<path d="M8.5 20.5V10h7v10.5M2.5 20.5V14h6M15.5 16.5h6v4M1.5 20.5h21M12 4v3"/>',
  gant: '<path d="M7 20.5h9.5v-4l2.5-3V8.5A4.5 4.5 0 0 0 14.5 4h-4A4.5 4.5 0 0 0 6 8.5v3a2 2 0 0 0 2 2h3.5"/><path d="M7 16.5h9.5"/>',
  ballon: '<circle cx="12" cy="12" r="9"/><path d="M12 3c-2.5 3-2.5 6 0 9s6 3.5 8.5 2.5M12 12c-3 1.5-6.5 1-8.6-1.5M12 12c2.5-3 6-4 8.4-2.7"/>',
  microscope: '<path d="M4.5 20.5h15M8 17.5h8M12 17.5v-2.5M9 3.5l3.8 1.4-2.6 7.1-3.8-1.4z"/><path d="M14.3 9.2a5 5 0 0 1 .7 8.3"/>',
  fiole: '<path d="M9 3h6M10 3v6l-5.2 9.2A1.9 1.9 0 0 0 6.5 21h11a1.9 1.9 0 0 0 1.7-2.8L14 9V3"/><path d="M7.2 15h9.6"/>',
  // (Derniers émojis de toutes les disciplines : v1.29.0)
  doigt: '<path d="M9 11.5V4.5a1.5 1.5 0 0 1 3 0V10m0 0V9a1.5 1.5 0 0 1 3 0v1.5m0 0a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.8a6 6 0 0 1-5-2.7l-2.4-3.7a1.5 1.5 0 0 1 2.5-1.7L9 15"/>',
  pouceHaut: '<path d="M7 10.5v10H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z"/><path d="M7 10.5 11 3a2.5 2.5 0 0 1 2.5 2.5V9h5.2a2 2 0 0 1 2 2.3l-1.2 7.5a2 2 0 0 1-2 1.7H7"/>',
  pouceBas: '<g transform="rotate(180 12 12)"><path d="M7 10.5v10H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z"/><path d="M7 10.5 11 3a2.5 2.5 0 0 1 2.5 2.5V9h5.2a2 2 0 0 1 2 2.3l-1.2 7.5a2 2 0 0 1-2 1.7H7"/></g>',
  deplacer: '<path d="M12 3v18M3 12h18M9.5 5.5 12 3l2.5 2.5M9.5 18.5 12 21l2.5-2.5M5.5 9.5 3 12l2.5 2.5M18.5 9.5 21 12l-2.5 2.5"/>',
  gomme: '<path d="m7.5 20.5-4-4a2 2 0 0 1 0-2.8L13.2 4a2 2 0 0 1 2.8 0l4 4a2 2 0 0 1 0 2.8l-9.7 9.7z"/><path d="m8.5 9 6.5 6.5M11 20.5h9.5"/>',
  volant: '<circle cx="7" cy="17" r="3.5"/><path d="m9.5 14.5 6-10.5 4.5 4.5-10.5 6M12.8 9.3l2.3-2.4M14.7 11.2l2.4-2.3"/>',
  cadenasOuvert: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5v-3a4 4 0 0 1 7.7-1.5"/>',
  melanger: '<path d="M3 7h3c4.5 0 6.5 10 11 10h4M3 17h3c1.5 0 2.7-1.2 3.7-2.8M14.3 9.8C15.3 8.2 16.4 7 18 7h3M18.5 4.5 21 7l-2.5 2.5M18.5 14.5 21 17l-2.5 2.5"/>',
  ampoule: '<path d="M9.5 17.5h5M10.5 21h3M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.1v1.6h5v-1.6c0-.8.4-1.6 1.1-2.1A6 6 0 0 0 12 3z"/>',
  balance: '<path d="M12 3.5v17M8 20.5h8M5 7h14M5 7l-2.5 6a2.5 2.5 0 0 0 5 0zM19 7l-2.5 6a2.5 2.5 0 0 0 5 0z"/>',
};
// Icône décorative (le texte à côté porte le sens) ; avec un libellé, elle est lue par les lecteurs d'écran.
// (traces : le dessin ; par défaut celui du jeu.)
const iconeEcole = (nom, libelle = '', traces = TRACES_ECOLE[nom]) => `<svg class="ic-ecole ic-${nom}" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" ${libelle ? `role="img" aria-label="${esc(libelle)}"><title>${esc(libelle)}</title>` : 'aria-hidden="true" focusable="false">'}${traces}</svg>`;
// Code partagé (app.js, onglets.js, outils.js…) : icône au trait en École, émoji d'origine ailleurs (EPS, SVT, PC inchangés).
const pictoEcole = (nom, emoji) => (avecEcole() && TRACES_ECOLE[nom] ? iconeEcole(nom) : emoji);
// Outils (outils.js) : en École, une icône du jeu pour chaque outil (sinon la grille « outils »), ailleurs l'émoji de l'outil.
const ICONES_OUTILS_ECOLE = { rituels: 'lecture', besoin: 'groupes', plan: 'plan', chrono: 'chrono', tours: 'tours', intervalles: 'horloge',
  ateliers: 'partager', equipes: 'equipe', tirage: 'de', marque: 'score', tournoi: 'coupe', essais: 'regle', vma: 'vent',
  metiers: 'metiers', coupons: 'coupons', biblio: 'biblio', minuteur: 'minuteur', journee: 'journee', parole: 'parole', sonore: 'sonore', consignes: 'consignes' };
// Icônes des outils : tout à l'encre, sauf un seul élément en rouge marge (DA validée le 8 novembre 2026).
// Pour chaque dessin : [partie à l'encre, partie rouge] ; à eux deux, ils redonnent le tracé de TRACES_ECOLE.
const DEUX_ENCRES_OUTILS = {
  lecture: ['<path d="M12 6.5C10 5 7 4.5 3.5 5v13.5c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z"/>', '<path d="M12 6.5V20"/>'],
  groupes: ['<circle cx="7" cy="16.5" r="3"/><circle cx="17" cy="16.5" r="3"/>', '<circle cx="12" cy="7.5" r="3"/>'],
  plan: ['<path d="M5 11h4M15 11h4M5 15.5h4M15 15.5h4M5 20h4M15 20h4"/>', '<rect x="3.5" y="4" width="17" height="3" rx="1"/>'],
  chrono: ['<circle cx="12" cy="13.5" r="7.5"/><path d="M10 2.5h4M12 2.5V6M18.5 6l1.5-1.5"/>', '<path d="M12 10v3.5l2 1.5"/>'],
  tours: ['<path d="M5 20V4"/>', '<path d="M5 4.5h11l-2.5 3.5L16 11.5H5"/>'],
  horloge: ['<circle cx="12" cy="12" r="8.5"/>', '<path d="M12 7.5V12l3 2"/>'],
  partager: ['<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5M20 4v4.5h-4.5"/>', '<path d="M20 12a8 8 0 0 1-13.7 5.6L4 15.5M4 20v-4.5h4.5"/>'],
  equipe: ['<circle cx="5" cy="10" r="2.5"/><circle cx="19" cy="10" r="2.5"/><path d="M1.5 18a3.5 3.5 0 0 1 4.5-3.4M22.5 18a3.5 3.5 0 0 0-4.5-3.4"/>', '<circle cx="12" cy="7" r="3"/><path d="M7 20a5 5 0 0 1 10 0"/>'],
  de: ['<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8.5 8.5h.01M15.5 8.5h.01M8.5 15.5h.01M15.5 15.5h.01"/>', '<path d="M12 12h.01" stroke-width="2.5"/>'],
  score: ['<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7.5 10v4M15.5 10h2v4h-2z"/>', '<path d="M12 5v14"/>'],
  coupe: ['<path d="M8 3.5h8v5a4 4 0 0 1-8 0zM8 5.5H4.5a3 3 0 0 0 3.5 4M16 5.5h3.5a3 3 0 0 1-3.5 4M12 12.5v4M9.5 20.5l.5-4h4l.5 4"/>', '<path d="M8 20.5h8"/>'],
  regle: ['<path d="m3.5 16.5 13-13 4 4-13 13z"/>', '<path d="m7.5 12.5 2 2M10.5 9.5l2 2M13.5 6.5l2 2"/>'],
  vent: ['<path d="M3 8h10a2.5 2.5 0 1 0-2.5-2.5M3 12h15a2.5 2.5 0 1 1-2.5 2.5"/>', '<path d="M3 16h7"/>'],
  // (Outils de la classe ajoutés le 8 novembre 2026 : ecoleoutils.js)
  metiers: ['<rect x="3.5" y="7" width="17" height="12.5" rx="2"/><circle cx="9" cy="13" r="2"/><path d="M14 11.5h3.5M14 14.5h3.5"/>', '<path d="M10 7V4.5h4V7"/>'],
  coupons: ['<rect x="5" y="4.5" width="14" height="16" rx="2"/><path d="M9.5 4.5V3h5v1.5M12 10h4M12 15h4"/>', '<path d="M8 10l1 1 1.5-2M8 15l1 1 1.5-2"/>'],
  biblio: ['<rect x="3" y="4" width="4" height="16" rx="1"/><rect x="8.5" y="4" width="4" height="16" rx="1"/>', '<path d="M14.2 5.3l3.4-.9 3.3 14.7-3.4.9z"/>'],
  minuteur: ['<circle cx="12" cy="13" r="8.5"/><path d="M10 2.5h4"/>', '<path d="M12 13V4.5a8.5 8.5 0 0 1 8.5 8.5z"/>'],
  journee: ['<path d="M9.5 6h10.5M9.5 12h10.5M9.5 18h10.5"/><circle cx="5" cy="6" r="1.5"/><circle cx="5" cy="18" r="1.5"/>', '<circle cx="5" cy="12" r="1.5"/>'],
  parole: ['<path d="M5 4.25h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8l-4 3.5v-3.5H5a2 2 0 0 1-2-2V6.25a2 2 0 0 1 2-2z"/>', '<path d="M8.5 10.25h.01M12 10.25h.01M15.5 10.25h.01" stroke-width="2.5"/>'],
  sonore: ['<path d="M6 18v-3M10 18v-6M14 18v-9"/>', '<path d="M18 18V6"/>'],
  consignes: ['<rect x="3.5" y="4" width="17" height="11" rx="1.5"/><path d="M8 15l-2 5.5M16 15l2 5.5M12 15v3"/>', '<path d="M7.5 8h9M7.5 11h6"/>'],
};
// Les dessins des outils ajoutés servent aussi ailleurs (titres, aide) : le jeu les reçoit en entier.
for (const n of ['metiers', 'coupons', 'biblio', 'minuteur', 'journee', 'parole', 'sonore', 'consignes']) TRACES_ECOLE[n] ||= DEUX_ENCRES_OUTILS[n].join('');
// Autres disciplines (EPS, SVT, PC) : même jeu d'icônes au trait, d'une seule couleur (celle de la famille de l'outil).
// Un outil absent de la liste garde son émoji.
const ICONES_OUTILS = { ...ICONES_OUTILS_ECOLE, tableau: 'consignes', video: 'camera', combine: 'medaille', natation: 'natation',
  asns: 'podium', boxe: 'gant', volley: 'ballon', ece: 'microscope', ecepc: 'microscope', schema: 'modifier', gestes: 'fiole',
  resultats: 'bilan', securite: 'alerte', binomes: 'eleves', tp: 'notes' };
const iconeOutil = o => {
  if (!avecEcole()) { const nom = ICONES_OUTILS[o.id]; return nom && TRACES_ECOLE[nom] ? iconeEcole(nom) : o.icone; }
  const nom = ICONES_OUTILS_ECOLE[o.id] || 'outils', deux = DEUX_ENCRES_OUTILS[nom];
  return deux ? iconeEcole(nom, '', `${deux[0]}<g class="trait-rouge">${deux[1]}</g>`) : iconeEcole(nom);
};
// Émojis rangés dans des données partagées (rubriques de l'aide…) : en École, l'icône du jeu qui leur correspond, ou rien.
const EMOJIS_ECOLE = { '🧭': 'boussole', '🏫': 'ecole', '🧰': 'outils', '🔒': 'cadenas', '🔑': 'cle', '🔄': 'partager', '📱': 'appli',
  '📥': 'telecharger', '📝': 'notes', '📋': 'liste', '📊': 'bilan', '📅': 'calendrier', '💾': 'enregistrer', '👥': 'eleves', '👤': 'eleve',
  '⭐': 'etoile', '➕': 'ajouter', '✍': 'modifier', '⚠️': 'alerte', '⚠': 'alerte', '⚖️': 'cadenas',
  '⬇': 'telecharger', '⬆': 'envoyer', '☁': 'nuage', '💻': 'ordi', '⚙': 'reglages', '🎒': 'cartable', '💬': 'remarque', '✔': 'coche',
  '✅': 'coche', '📈': 'courbe', '◀': 'precedent', '▶': 'suivant', '⏭': 'avance', '🎲': 'de', '☀': 'soleil', '🌙': 'lune',
  '⏱': 'chrono', '📏': 'regle', '📄': 'notes',
  // (Écrans plus rares, communs à toutes les disciplines. Restent : pastilles de couleur 🟠 🟡 🔴, sports de l'EPS.)
  '🗑': 'corbeille', '🎓': 'chapeau', '✎': 'modifier', '✏': 'modifier', '🎨': 'palette', '♻': 'partager', '🗂': 'dossier',
  '📂': 'dossier', '📁': 'dossier', '🕒': 'horloge', '⏰': 'horloge', '⏲': 'horloge', '🧩': 'groupes', '📚': 'livre', '📘': 'livre',
  '📗': 'livre', '📕': 'livre', '📖': 'lecture', '📓': 'cahier', '🎯': 'cible', '📷': 'image', '🖼': 'image', '📦': 'telecharger',
  '📤': 'envoyer', '📲': 'appli', '👑': 'couronne', '👀': 'regarder', '🔍': 'loupe', '⏸': 'stop', '⏹': 'stop', '🛡': 'cadenas',
  '❌': 'absent', '☑': 'coche', '☰': 'menu', '🩺': 'sante', '🤒': 'sante', '🩹': 'sante', '🥇': 'coupe', '🥈': 'coupe', '🥉': 'coupe',
  '🏆': 'coupe', '🏅': 'coupe', '🗓': 'calendrier', '💨': 'vent', '🧰': 'outils', '🖨': 'imprimer', '🔗': 'lien', '📞': 'telephone',
  '✉': 'mail', '📑': 'notes', '📇': 'liste', '📌': 'liste', '🎛': 'reglages', '⛶': 'pleinEcran', '🎉': 'etoile', '🆕': 'etoile',
  '❓': 'aide', 'ℹ': 'aide', '🛟': 'aide', '🆘': 'aide', '📎': 'lien',
  // (Toutes les disciplines, v1.28.0 : sports, labo, gestes. « - » : l'émoji est seulement retiré ;
  //  « pastille-… » : une pastille de couleur dessinée en CSS, car la couleur porte le sens.)
  '🏐': 'ballon', '⚽': 'ballon', '🏸': 'volant', '🏊': 'natation', '🥊': 'gant', '👊': 'gant', '🏃': 'tours', '🏁': 'tours',
  '🚦': 'tours', '🔬': 'microscope', '🦠': 'microscope', '🧪': 'fiole', '⚗': 'fiole', '🧾': 'notes', '👆': 'doigt', '👉': 'suivant',
  '👍': 'pouceHaut', '👎': 'pouceBas', '✋': 'deplacer', '🧹': 'gomme', '🧽': 'gomme', '🗣': 'parole', '📐': 'regle', '👕': 'tenue',
  '🎽': 'tenue', '🥼': 'tenue', '🧠': 'ampoule', '📽': 'camera', '🎥': 'camera', '🧑': 'eleve', '🙋': 'eleve', '👫': 'eleves',
  '❗': 'alerte', '☠': 'alerte', '🔥': 'alerte', '♨': 'alerte', '🔪': 'alerte', '🧤': 'alerte', '👏': 'etoile', '🔀': 'melanger',
  '♊': 'copier', '⏳': 'horloge', '🤖': 'appli', '✖': 'absent', '📮': 'envoyer', '🥽': 'regarder', '🔓': 'cadenasOuvert',
  '⏮': 'precedent', '🔌': 'lien', '📍': 'cible', '↩': 'reprendre', '🪑': 'plan', '🖥': 'ordi', '🔎': 'loupe', '🔦': 'regarder',
  '😊': '-', '🦶': '-', '👋': '-', '💇': '-', '⚖': 'balance', '⚖️': 'balance',
  '🟠': 'pastille-orange', '🔶': 'pastille-orange', '🔴': 'pastille-rouge', '🟡': 'pastille-jaune', '🔵': 'pastille-bleu', '🔹': 'pastille-bleu' };
// Médailles : une seule médaille dessinée ; or, argent et bronze se lisent à la couleur de la case.
Object.assign(EMOJIS_ECOLE, { '🥇': 'medaille', '🥈': 'medaille', '🥉': 'medaille', '🏅': 'medaille' });
// Même émoji, autre sens selon le mot qui le suit (« 📋 Copier », « ▶ Départ », « ✅ Appel », « ⏱ Outils », « ✋ Stop »).
const EMOJIS_SELON_MOT = [['📋', /^\s*Copier/, 'copier'], ['▶', /^\s*(Départ|Reprendre|Lancer)/, 'jouer'], ['✅', /^\s*Appel/, 'appel'], ['⏱', /^\s*Outils/, 'outils'],
  ['✋', /^\s*Stop/, 'stop']];
const iconeEmoji = e => (avecEcole() ? (EMOJIS_ECOLE[e] ? iconeEcole(EMOJIS_ECOLE[e]) : '') : e);
// Textes écrits par l'appli et communs à toutes les disciplines (réponses de l'aide…) : en École, chaque émoji devient
// son icône ou disparaît. (Les flèches ↗ ↘ ↔ et ©, ®, ™ restent : ce sont des signes typographiques.)
const RE_EMOJI_ECOLE = /(?![↔-↙©®™])(\p{Extended_Pictographic})️? ?/gu;
const emojisEcole = html => (avecEcole() ? html.replace(RE_EMOJI_ECOLE, (m, e) => { const n = EMOJIS_ECOLE[e] || EMOJIS_ECOLE[e + '️']; return n ? iconeEcole(n) : ''; }) : html);
// Le titre d'une fenêtre est du texte simple (ouvrirModale l'échappe) : l'icône s'ajoute après.
const iconeTitreModale = (d, nom) => d.querySelector('h2')?.insertAdjacentHTML('afterbegin', iconeEcole(nom));

/* ---------- Plus d'émoji à l'écran (carnet École depuis la v1.21, toutes les disciplines depuis la v1.28.0) ---------- */
// Les écrans gardent leurs émojis dans le code. Chaque émoji affiché devient l'icône au trait qui lui correspond
// (même DA que l'appel), dès qu'il apparaît ; l'émoji d'origine reste noté (data-emoji).
// Un émoji sans icône (tapé par l'enseignant dans une remarque…) est laissé tel quel. Les données ne changent pas.
// (Interrupteur unique : le renvoyer à false fait revenir tous les émojis.)
const ICONES_AU_TRAIT = true;
const enEcole = () => ICONES_AU_TRAIT;
const RE_UN_EMOJI = /((?![↔-↙©®™])\p{Extended_Pictographic}️?)/u;
const nomPourEmoji = (e, suite) => {
  const base = e.replace('️', '');
  const r = EMOJIS_SELON_MOT.find(([x, mot]) => x === base && mot.test(suite));
  const nom = r ? r[2] : EMOJIS_ECOLE[e] || EMOJIS_ECOLE[base];
  return TRACES_ECOLE[nom] || nom === '-' || nom?.startsWith('pastille-') ? nom : '';
};
// Ce qui remplace un émoji : l'icône, une pastille de couleur, ou rien (« - »).
function remplacantEmoji(nom, modele) {
  if (nom.startsWith('pastille-')) {
    const p = document.createElement('span');
    p.className = 'pastille-emoji ' + nom;
    p.setAttribute('aria-hidden', 'true');
    return p;
  }
  modele.innerHTML = iconeEcole(nom);
  return modele.content.firstChild;
}
function iconesPourEmojis(racine) {
  if (!racine || !enEcole()) return;
  // Listes déroulantes : pas de place pour une icône dans une option, l'émoji est seulement retiré.
  if (racine.nodeType === 1) {
    for (const o of racine.tagName === 'OPTION' ? [racine] : racine.querySelectorAll('option')) {
      if (RE_UN_EMOJI.test(o.text)) { o.dataset.emojiTexte = o.text; o.text = o.text.replace(RE_EMOJI_ECOLE, '').trim(); }
    }
  }
  const textes = [], w = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT, { acceptNode: n => (RE_UN_EMOJI.test(n.data)
    && !n.parentElement?.closest('script, style, textarea, option, svg, [contenteditable="true"]') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
  for (let n; (n = w.nextNode());) textes.push(n);
  for (const n of textes) {
    const morceaux = n.data.split(RE_UN_EMOJI);
    if (!morceaux.some((m, i) => i % 2 && nomPourEmoji(m, morceaux[i + 1] || ''))) continue;
    const frag = document.createDocumentFragment(), modele = document.createElement('template');
    morceaux.forEach((m, i) => {
      const nom = i % 2 ? nomPourEmoji(m, morceaux[i + 1] || '') : '';
      if (!nom) { if (m) frag.append(m); return; }
      const suite = morceaux[i + 1] || '';
      if (nom === '-') { if (suite.startsWith(' ')) morceaux[i + 1] = suite.slice(1); return; }
      const ic = remplacantEmoji(nom, modele);
      ic.classList.add('ic-emoji');
      ic.dataset.emoji = m;
      if (suite.startsWith(' ')) { morceaux[i + 1] = suite.slice(1); ic.dataset.espace = '1'; }
      if (!morceaux[i + 1]?.trim() && i + 2 >= morceaux.length && !n.nextSibling) ic.classList.add('seule');
      frag.append(ic);
    });
    // Dans un bloc empilé (étiquette au-dessus de sa liste, grille), l'icône et son texte restent sur la même ligne.
    const p = n.parentElement, s = p && getComputedStyle(p);
    if (s && (s.display.includes('grid') || (s.display.includes('flex') && s.flexDirection.startsWith('column')))) {
      const ligne = document.createElement('span');
      ligne.className = 'ligne-emoji';
      ligne.append(frag);
      n.replaceWith(ligne);
      continue;
    }
    n.replaceWith(frag);
  }
  // Textes d'aide des champs et info-bulles : pas de place pour une icône, l'émoji est seulement retiré.
  if (racine.nodeType !== 1) return;
  for (const el of [racine, ...racine.querySelectorAll('[placeholder], [title]')]) {
    for (const a of ['placeholder', 'title']) {
      const v = el.getAttribute?.(a);
      if (!v || !RE_UN_EMOJI.test(v)) continue;
      el.setAttribute('data-emoji-' + a, v);
      el.setAttribute(a, v.replace(RE_EMOJI_ECOLE, '').trim());
    }
  }
}
function emojisRetablis() {
  document.querySelectorAll('.ic-emoji').forEach(ic => ic.replaceWith(ic.dataset.emoji + (ic.dataset.espace ? ' ' : '')));
  document.querySelectorAll('option[data-emoji-texte]').forEach(o => { o.text = o.dataset.emojiTexte; delete o.dataset.emojiTexte; });
  for (const a of ['placeholder', 'title']) {
    document.querySelectorAll(`[data-emoji-${a}]`).forEach(el => { el.setAttribute(a, el.getAttribute('data-emoji-' + a)); el.removeAttribute('data-emoji-' + a); });
  }
}
const passeEmojis = () => (enEcole() ? iconesPourEmojis(document.body) : emojisRetablis());
// Chaque ajout à l'écran est traité avant d'être affiché (l'émoji ne clignote pas).
new MutationObserver(liste => {
  if (!enEcole()) return;
  for (const m of liste) {
    if (m.type === 'characterData') iconesPourEmojis(m.target.parentNode);
    else m.addedNodes.forEach(x => iconesPourEmojis(x.nodeType === 1 ? x : x.parentNode));
  }
}).observe(document.body, { childList: true, subtree: true, characterData: true });
// Changement de discipline (classe carnet-ecole de la page) : tout l'écran d'un coup, dans un sens ou dans l'autre.
new MutationObserver(passeEmojis).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
passeEmojis();

/* ---------- Appel par demi-journée ---------- */

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

/* ---------- Onglet Élèves : la classe (la colonne des classes est rangée derrière ☰ en École) ---------- */
// Dans la ligne du titre, à droite : changer de classe (s'il y en a plusieurs), modifier la classe, en créer une
// (les réglages du carnet sont dans la barre du haut : roue #btn-reglages-barre, index.html). Boutons gérés par app.js (data-classe, data-modif-classe, data-action).
function htmlClasseEcole(c) {
  const classes = classesTriees();
  return `<span class="espace"></span>
    ${classes.length > 1 ? `<span class="choix-classe-ecole" role="group" aria-label="Changer de classe">${classes.map(x => `<button type="button" data-classe="${x.id}" class="${x.id === c.id ? 'actif' : ''}" aria-pressed="${x.id === c.id}">${esc(x.nom)}</button>`).join('')}</span>` : ''}
    <span class="classe-ecole" role="group" aria-label="La classe">
      <button type="button" data-modif-classe="${c.id}">${iconeEcole('modifier')}Modifier la classe</button>
      <button type="button" data-action="ajout-classe">${iconeEcole('ajouter')}Nouvelle classe</button>    </span>`;
}

/* ---------- Calendrier de l'appel (à droite de la liste ; bandeau de la semaine sur téléphone) ---------- */
// Pour un jour : où en est l'appel du matin et de l'après-midi ('fait' = tous pointés, 'partiel', '' = rien).
function etatJourAppel(c, date, eleves) {
  const s = seanceAppelJour(c, date);
  return [ID_MATIN, ID_APRES_MIDI].map(dj => {
    const n = s ? eleves.filter(el => Donnees.note(s.id, el.id, dj)).length : 0;
    return { n, etat: !n ? '' : n === eleves.length ? 'fait' : 'partiel' };
  });
}
const texteEtatDemi = (x, total) => x.etat === 'fait' ? 'fait' : x.etat === 'partiel' ? `en partie (${x.n} sur ${total})` : 'pas fait';
// Un jour cliquable : numéro, puis deux petits traits (matin, après-midi), pleins si l'appel est fait.
function boutonJourAppel(c, date, eleves, choisi, { etiquette = '', horsMois = false } = {}) {
  const x = new Date(date + 'T12:00'), sem = x.getDay(), etats = etatJourAppel(c, date, eleves);
  const nom = ucf(x.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));
  // Traits gris (« à faire ») seulement pour un jour de classe déjà passé : rien sur les week-ends ni sur les jours à venir.
  const vide = !etats[0].etat && !etats[1].etat, aFaire = sem !== 0 && sem !== 6 && date <= aujourdhui();
  const classes = ['jour-cal', choisi === date && 'choisi', date === aujourdhui() && 'auj', (sem === 0 || sem === 6) && 'we', horsMois && 'hors'].filter(Boolean).join(' ');
  return `<button type="button" class="${classes}" data-ecole="aller-appel" data-arg="${date}" ${choisi === date ? 'aria-current="date"' : ''}
    title="${esc(`${nom} — matin ${texteEtatDemi(etats[0], eleves.length)}, après-midi ${texteEtatDemi(etats[1], eleves.length)}`)}">${etiquette}<span class="num-cal">${x.getDate()}</span><span class="traits-cal${vide && !aFaire ? ' sans' : ''}" aria-hidden="true"><i class="${etats[0].etat}"></i><i class="${etats[1].etat}"></i></span></button>`;
}
function htmlCalendrierAppel(c, date, eleves) {
  const mois = ui.moisCalAppel || moisDe(date), [an, m] = mois.split('-').map(Number);
  const decalage = (new Date(an, m - 1, 1).getDay() + 6) % 7, nbJours = new Date(an, m, 0).getDate();
  const cases = Array.from({ length: decalage }, () => '<span></span>').concat(Array.from({ length: nbJours }, (_, i) => boutonJourAppel(c, `${mois}-${String(i + 1).padStart(2, '0')}`, eleves, date)));
  return `<aside class="cal-appel" aria-label="Calendrier de l’appel">
    <div class="tete-cal"><button type="button" class="fleche-cal" data-ecole="cal-mois" data-arg="-1" aria-label="Mois précédent">${iconeEcole('precedent')}</button>
      <b>${esc(ucf(nomMois(mois)))}</b><button type="button" class="fleche-cal" data-ecole="cal-mois" data-arg="1" aria-label="Mois suivant">${iconeEcole('suivant')}</button></div>
    <div class="grille-cal">${['l', 'm', 'm', 'j', 'v', 's', 'd'].map(j => `<span class="sem-cal">${j}</span>`).join('')}${cases.join('')}</div>
    <p class="legende-cal"><span class="traits-cal"><i class="fait"></i><i></i></span>Matin fait, après-midi pas fait</p>
  </aside>`;
}
// Sur téléphone : la semaine du jour choisi, du lundi au vendredi.
function htmlSemaineAppel(c, date, eleves) {
  const lundi = decalerJour(date, -((new Date(date + 'T12:00').getDay() + 6) % 7));
  return `<div class="semaine-appel" role="group" aria-label="Semaine de l’appel">
    <button type="button" class="fleche-cal" data-ecole="semaine-appel" data-arg="-7" aria-label="Semaine précédente">${iconeEcole('precedent')}</button>
    ${[0, 1, 2, 3, 4].map(i => { const d = decalerJour(lundi, i); return boutonJourAppel(c, d, eleves, date, { etiquette: `<span class="jsem-cal">${new Date(d + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}</span>` }); }).join('')}
    <button type="button" class="fleche-cal" data-ecole="semaine-appel" data-arg="7" aria-label="Semaine suivante">${iconeEcole('suivant')}</button>
  </div>`;
}

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
  const bouton = (el, k, icone, nom, actif) => `<button class="bouton-appel b-${k}${actif ? ' choisi' : ''}" data-ecole="pointer" data-arg="${el.id}|${k}" aria-pressed="${actif}" title="${nom}">${iconeEcole(icone)}<span class="libelle-appel">${nom}</span></button>`;
  return `
    <div class="outils">
      <h2>${iconeEcole('appel')}Appel — ${esc(c.nom)}</h2>
      <label class="choix-tri">Jour<input type="date" data-date-appel-ecole value="${date}"></label>
      ${date !== aujourdhui() ? '<button data-ecole="appel-aujourdhui">Aujourd’hui</button>' : ''}
      <div class="fiche-onglets" role="group" aria-label="Demi-journée">${[ID_MATIN, ID_APRES_MIDI].map(id => `<button type="button" class="${id === dj ? 'actif' : ''}" data-ecole="demi" data-arg="${id}" aria-pressed="${id === dj}">${id === ID_MATIN ? `${iconeEcole('matin')}Matin` : `${iconeEcole('apresMidi')}Après-midi`}</button>`).join('')}</div>
      <span class="espace"></span>
      <button data-ecole="bilan-mois" title="Absences et retards de la semaine, du mois ou du trimestre ; PDF à télécharger ou imprimer">${iconeEcole('bilan')}Bilan</button>
      <button class="primaire" data-ecole="tous" ${reste ? '' : 'disabled'}>${iconeEcole('present')}Tous les autres présents${reste ? ` (${reste})` : ''}</button>
    </div>
    ${htmlSemaineAppel(c, date, eleves)}
    <div class="appel-ecole-grille"><div class="appel-ecole-liste">
    <div class="bilan-appel bilan-appel-ecole">
      <span class="pastille-appel present">${iconeEcole('present')}<b>${nb('P')}</b> présent${nb('P') > 1 ? 's' : ''}</span>
      <span class="pastille-appel ABS">${iconeEcole('absent')}<b>${nb('AN', 'AJ')}</b> absent${nb('AN', 'AJ') > 1 ? 's' : ''}</span>
      <span class="pastille-appel RET">${iconeEcole('retard')}<b>${nb('R')}</b> retard${nb('R') > 1 ? 's' : ''}</span>
      <span class="pastille-appel cantine-ecole">${iconeEcole('cantine')}<b>${cantine}</b> à la cantine</span>
      ${reste ? `<span class="aide">${reste} à pointer</span>` : `<span class="aide appel-fini">${iconeEcole('coche')}Appel terminé</span>`}
    </div>
    <ul class="liste-appel">${eleves.map(el => {
      const e = etats.get(el.id), absent = e === 'AN' || e === 'AJ', mange = !!s && Donnees.note(s.id, el.id, ID_CANTINE) === 'Oui';
      return `<li class="ligne-appel${e ? ' etat-' + ({ P: 'present', R: 'RET' }[e] || 'ABS') : ''}">
        <span class="nom-appel">${Trombi.mini(el)}<b>${esc(el.nom)}</b> ${esc(el.prenom)} ${badgeAlerte(el, absencesEleve(el))}
          ${absent ? `<button class="b-justif${e === 'AJ' ? ' choisi' : ''}" data-ecole="justifier" data-arg="${el.id}" aria-pressed="${e === 'AJ'}" title="Toucher pour changer">${e === 'AJ' ? `${iconeEcole('justifiee')}Justifiée` : `${iconeEcole('nonJustifiee')}Non justifiée`}</button>` : ''}</span>
        <span class="boutons-appel" role="group" aria-label="Appel de ${esc(el.nom)} ${esc(el.prenom)}">
          ${bouton(el, 'P', 'present', 'Présent', e === 'P')}
          ${bouton(el, 'ABS', 'absent', 'Absent', absent)}
          ${bouton(el, 'R', 'retard', 'Retard', e === 'R')}
          <button class="bouton-appel b-cantine${mange ? ' choisi' : ''}" data-ecole="cantine" data-arg="${el.id}" aria-pressed="${mange}" title="Mange à la cantine ce jour">${iconeEcole('cantine')}<span class="libelle-appel">Cantine</span></button>
        </span>
      </li>`;
    }).join('')}</ul></div>
    ${htmlCalendrierAppel(c, date, eleves)}</div>`;
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

// Même forme que absencesEleve (app.js) : badge d'alerte et fenêtre de détail. Rouge : seuil légal atteint ce mois-ci.
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

/* ---------- Bilan de l'appel : la semaine, le mois ou la période (trimestre, semestre…) ---------- */
const nomMois = mois => new Date(mois + '-15T12:00').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
const NOMS_ETAT_COURTS = { P: 'présent', R: 'retard', AN: 'absence non justifiée', AJ: 'absence justifiée', '': 'pas pointé' };
const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`;
const moisSuivant = m => { const [a, mm] = m.split('-').map(Number); return mm === 12 ? `${a + 1}-01` : `${a}-${String(mm + 1).padStart(2, '0')}`; };
const jourMoisBilan = d => new Date(d + 'T12:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
const nomTypePeriode = () => ({ semestres: 'Semestre', cinq: 'Période' }[reglagePeriodes().type] || 'Trimestre');
const TYPES_BILAN = () => [['semaine', 'Semaine'], ['mois', 'Mois'], ['periode', nomTypePeriode()]];

// La plage du bilan qui contient la date : { type, debut, fin, titre } (dates AAAA-MM-JJ).
function plageBilan(type, date) {
  if (type === 'semaine') {
    const debut = decalerJour(date, -((new Date(date + 'T12:00').getDay() + 6) % 7)), vendredi = decalerJour(debut, 4);
    const an = vendredi.slice(0, 4), memeMois = debut.slice(0, 7) === vendredi.slice(0, 7);
    return { type, debut, fin: decalerJour(debut, 6), titre: `Semaine du ${memeMois ? Number(debut.slice(8)) : jourMoisBilan(debut)} au ${jourMoisBilan(vendredi)} ${an}` };
  }
  if (type === 'periode') {
    const a = anneeScolaire(date), ps = periodesAnnee(), enDate = md => `${+md.slice(0, 2) >= 8 ? a : a + 1}-${md}`;
    const k = ps.findIndex(x => !x.fin || rangAnnee(date.slice(5)) <= rangAnnee(x.fin));
    const rentree = typeof reglageAgenda === 'function' && reglageAgenda().debut?.startsWith(String(a)) ? reglageAgenda().debut : `${a}-09-01`;
    const debut = k > 0 ? decalerJour(enDate(ps[k - 1].fin), 1) : rentree, fin = ps[k].fin ? enDate(ps[k].fin) : `${a + 1}-07-31`;
    return { type, debut, fin, titre: `${nomTypePeriode()} ${k + 1} · ${k > 0 ? `du ${jourMoisBilan(debut)}` : 'de la rentrée'} ${ps[k].fin ? `au ${jourMoisBilan(fin)}` : 'à la fin de l’année'}` };
  }
  const mois = moisDe(date), [an, m] = mois.split('-').map(Number);
  return { type: 'mois', debut: `${mois}-01`, fin: `${mois}-${String(new Date(an, m, 0).getDate()).padStart(2, '0')}`, titre: ucf(nomMois(mois)) };
}
const plageVoisine = (p, sens) => plageBilan(p.type, sens < 0 ? decalerJour(p.debut, -1) : decalerJour(p.fin, 1));
const dansPlage = (date, p) => date >= p.debut && date <= p.fin;
const surPlage = p => (p.type === 'semaine' ? 'cette semaine' : p.type === 'mois' ? 'ce mois-ci' : nomTypePeriode() === 'Période' ? 'sur cette période' : `sur ce ${nomTypePeriode().toLowerCase()}`);
function moisDeLaPlage(p) { const res = []; for (let m = moisDe(p.debut); m <= moisDe(p.fin); m = moisSuivant(m)) res.push(m); return res; }

// Par élève : absences et retards de la plage, et le pire mois (seuil légal : 4 demi-journées non justifiées dans un mois).
function bilanEcole(c, p) {
  const eleves = elevesDe(c.id), mois = moisDeLaPlage(p);
  const lignes = eleves.map(el => {
    const l = appelsEleve(el).filter(a => dansPlage(a.date, p)), n = k => l.filter(a => a.etat === k).length, nj = nonJustifieesParMois(el);
    return { el, an: n('AN'), aj: n('AJ'), r: n('R'), pireMois: Math.max(0, ...mois.map(m => nj.get(m) || 0)) };
  });
  const cantine = seancesDe(c.id).filter(s => s.appelJour && dansPlage(s.date, p)).sort((a, b) => a.date.localeCompare(b.date))
    .map(s => ({ date: s.date, n: eleves.filter(el => Donnees.note(s.id, el.id, ID_CANTINE) === 'Oui').length })).filter(x => x.n);
  return { lignes, cantine, alertes: lignes.filter(l => l.pireMois >= SEUIL_ASSIDUITE) };
}

// La plage en grille, jour après jour (jusqu'à aujourd'hui pour la plage en cours), coupée par mois :
// pour chaque élève, l'état du matin et de l'après-midi ('' = pas pointé), null les jours sans appel.
function registreEcole(c, p) {
  const seances = new Map(seancesDe(c.id).filter(s => s.appelJour && dansPlage(s.date, p)).map(s => [s.date, s]));
  if (!seances.size) return { jours: [], eleves: [], presents: [], groupes: [], nbJoursAppel: 0, pointees: 0, absences: 0, compte: {} };
  // Du début de la plage (ou du 1er du mois du premier appel, pour un trimestre) jusqu'à aujourd'hui ou au dernier appel.
  const ajd = aujourdhui(), dates = [...seances.keys()].sort(), fin = [ajd < p.fin ? ajd : p.fin, dates.at(-1)].sort().pop();
  const debut = [p.debut, `${moisDe(dates[0])}-01`].sort().pop(), jours = [];
  for (let d = debut; d <= fin; d = decalerJour(d, 1)) {
    const sem = new Date(d + 'T12:00').getDay();
    jours.push({ date: d, s: seances.get(d) || null, we: sem === 0 || sem === 6, lundi: sem === 1 });
  }
  const eleves = elevesDe(c.id).map(el => ({ el, etats: jours.map(j => j.s ? [ID_MATIN, ID_APRES_MIDI].map(dj => etatEcoleDe(Donnees.note(j.s.id, el.id, dj))) : null) }));
  // Présents par demi-journée ('' si personne n'a été pointé : pas de classe ou appel pas fait).
  const presents = jours.map((j, i) => j.s ? [0, 1].map(k => eleves.some(x => x.etats[i][k]) ? eleves.filter(x => ['P', 'R'].includes(x.etats[i][k])).length : '') : null);
  const groupes = [];
  jours.forEach((j, i) => { const m = moisDe(j.date); if (groupes.at(-1)?.mois !== m) groupes.push({ mois: m, i0: i, i1: i + 1 }); else groupes.at(-1).i1 = i + 1; });
  const tous = eleves.flatMap(x => x.etats.filter(Boolean).flat()), compte = {};
  for (const e of tous) if (e) compte[e] = (compte[e] || 0) + 1;
  return { jours, eleves, presents, groupes, nbJoursAppel: seances.size, pointees: tous.filter(Boolean).length, absences: (compte.AN || 0) + (compte.AJ || 0), compte };
}
const tauxPresence = r => (r.pointees ? `${(100 * (r.pointees - r.absences) / r.pointees).toFixed(1).replace('.', ',')} %` : '—');
const lignesAregarder = b => b.lignes.filter(l => l.an + l.aj + l.r).sort((x, y) => y.pireMois - x.pireMois || y.an - x.an || (y.an + y.aj + y.r) - (x.an + x.aj + x.r));
const detailAregarder = l => [l.an && `${l.an} non justifiée${l.an > 1 ? 's' : ''}`, l.aj && `${l.aj} justifiée${l.aj > 1 ? 's' : ''}`, l.r && pluriel(l.r, 'retard')].filter(Boolean).join(' · ');

// B. Qui regarder d'abord : une barre par élève absent ou en retard, la plus inquiétante en haut, et le seuil légal.
function htmlAregarder(b, p) {
  const lignes = lignesAregarder(b);
  if (!lignes.length) return `<p class="bm-rien">${iconeEcole('present')}Aucune absence ni aucun retard ${surPlage(p)}.</p>`;
  const echelle = Math.max(SEUIL_ASSIDUITE * 2, ...lignes.map(l => l.an + l.aj + l.r)), pc = n => (100 * n / echelle).toFixed(2);
  return `<ul class="bm-barres">${lignes.map(l => {
    const niveau = l.pireMois >= SEUIL_ASSIDUITE ? ' bm-rouge' : l.pireMois === SEUIL_ASSIDUITE - 1 ? ' bm-orange' : '', detail = detailAregarder(l);
    return `<li class="bm-ligne${niveau}">
      <span class="bm-nom">${l.pireMois >= SEUIL_ASSIDUITE ? iconeEcole('alerte', 'À signaler') : ''}${esc(l.el.prenom)} ${esc(l.el.nom)}</span>
      <span class="bm-piste" role="img" aria-label="${esc(`${l.el.prenom} ${l.el.nom} : ${detail}`)}">
        ${l.an ? `<span class="bm-seg bm-AN" data-l="${pc(l.an)}"></span>` : ''}${l.aj ? `<span class="bm-seg bm-AJ" data-l="${pc(l.aj)}"></span>` : ''}${l.r ? `<span class="bm-seg bm-R" data-l="${pc(l.r)}"></span>` : ''}
        <span class="bm-seuil" data-g="${pc(SEUIL_ASSIDUITE)}" title="Seuil : ${SEUIL_ASSIDUITE} demi-journées non justifiées dans un mois"></span>
      </span>
      <span class="bm-detail">${detail}</span></li>`;
  }).join('')}</ul>`;
}

// Largeurs et positions des barres : posées par script (la page n'accepte pas de style écrit dans le HTML).
function poserBarresBilan(racine) {
  racine.querySelectorAll('.bm-barres [data-l], .bm-barres [data-g]').forEach(e => {
    if (e.dataset.l !== undefined) e.style.width = e.dataset.l + '%';
    if (e.dataset.g !== undefined) e.style.left = e.dataset.g + '%';
  });
}

/* ---------- Bilan : le calendrier de la classe (à l'écran ; le PDF garde le registre jour par jour) ----------
   Du lundi au vendredi ; dans chaque jour, deux traits (matin à gauche, après-midi à droite) colorés selon le nombre
   d'absents : vert personne, orange 1 ou 2, rouge 3 et plus ; pointillés : pas d'appel. Un point orange : un retard.
   Toucher un jour : qui était absent ou en retard, sous le calendrier. */
// Une demi-journée de la classe : { pointe, abs: [élèves], ret: [élèves] }.
const demiClasse = (r, i, k) => {
  const res = { pointe: false, abs: [], ret: [] };
  for (const x of r.eleves) {
    const e = x.etats[i]?.[k];
    if (e) res.pointe = true;
    if (e === 'AN' || e === 'AJ') res.abs.push({ el: x.el, e }); else if (e === 'R') res.ret.push({ el: x.el, e });
  }
  return res;
};
const niveauDemi = d => (!d.pointe ? 'vide' : !d.abs.length ? 'ok' : d.abs.length <= 2 ? 'moyen' : 'fort');
const texteDemi = d => (!d.pointe ? 'pas d’appel' : !d.abs.length && !d.ret.length ? 'tout le monde présent'
  : [d.abs.length && pluriel(d.abs.length, 'absent'), d.ret.length && pluriel(d.ret.length, 'retard')].filter(Boolean).join(', '));

function htmlCalendrierBilan(r) {
  if (!r.jours.length) return '<p class="aide">Pas encore d’appel sur cette durée.</p>';
  return r.groupes.map(g => {
    const cases = [];
    for (let i = g.i0; i < g.i1; i++) {
      const j = r.jours[i], x = new Date(j.date + 'T12:00'), sem = (x.getDay() + 6) % 7;
      if (sem > 4) continue;
      if (!cases.length) for (let v = 0; v < sem; v++) cases.push('<span></span>');
      const m = demiClasse(r, i, 0), a = demiClasse(r, i, 1), ret = m.ret.length + a.ret.length;
      const nom = ucf(x.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));
      cases.push(`<button type="button" class="cj-jour${j.s ? '' : ' cj-sans'}" data-cj="${i}" aria-label="${esc(`${nom} — matin : ${texteDemi(m)} ; après-midi : ${texteDemi(a)}`)}" title="${esc(`${nom}\nMatin : ${texteDemi(m)}\nAprès-midi : ${texteDemi(a)}`)}">
        <span class="cj-num">${x.getDate()}</span>${ret ? '<span class="cj-retard" aria-hidden="true"></span>' : ''}
        <span class="cj-traits" aria-hidden="true"><i class="cj-${niveauDemi(m)}"></i><i class="cj-${niveauDemi(a)}"></i></span>
        <span class="cj-abs">${m.abs.length + a.abs.length ? `${m.abs.length + a.abs.length} abs.` : ''}</span></button>`);
    }
    return `<h4 class="bm-mois">${esc(ucf(nomMois(g.mois)))}</h4>
      <div class="cal-bilan"><span class="cj-sem">lun.</span><span class="cj-sem">mar.</span><span class="cj-sem">mer.</span><span class="cj-sem">jeu.</span><span class="cj-sem">ven.</span>${cases.join('')}</div>`;
  }).join('') + `<div class="cj-detail info-sensible" data-cj-detail aria-live="polite"><p class="aide">Touche un jour pour voir qui était absent ou en retard.</p></div>`;
}
// Sous le calendrier : le détail du jour touché.
function htmlDetailJourBilan(r, i) {
  const j = r.jours[i];
  if (!j) return '';
  const ligne = (id, nomDj) => {
    const d = demiClasse(r, i, id === ID_MATIN ? 0 : 1);
    const qui = [...d.abs, ...d.ret].map(x => `<span class="cj-eleve cj-e-${x.e}">${esc(`${x.el.prenom} ${x.el.nom}`)} <small>${esc(NOMS_ETAT_COURTS[x.e])}</small></span>`).join('');
    return `<p><b>${nomDj}</b> : ${qui || `<span class="aide">${texteDemi(d)}</span>`}</p>`;
  };
  return `<h4>${esc(ucf(new Date(j.date + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })))}</h4>${ligne(ID_MATIN, 'Matin')}${ligne(ID_APRES_MIDI, 'Après-midi')}`;
}
const LEGENDE_CAL_BILAN = `<p class="bm-legende cj-legende"><span><span class="cj-traits"><i class="cj-ok"></i><i class="cj-ok"></i></span>Tout le monde présent</span>
  <span><span class="cj-traits"><i class="cj-moyen"></i><i class="cj-moyen"></i></span>1 ou 2 absents</span><span><span class="cj-traits"><i class="cj-fort"></i><i class="cj-fort"></i></span>3 absents ou plus</span>
  <span><span class="cj-traits"><i class="cj-vide"></i><i class="cj-vide"></i></span>Pas d’appel</span><span><span class="cj-retard cj-retard-legende"></span>Un retard</span>
  <span class="aide">Dans chaque jour : à gauche le matin, à droite l’après-midi.</span></p>`;

function htmlBilanEcole(c, p) {
  const b = bilanEcole(c, p), r = registreEcole(c, p);
  const an = b.lignes.reduce((n, l) => n + l.an, 0), ret = b.lignes.reduce((n, l) => n + l.r, 0);
  return `<div class="bm-choix">
      <span class="fiche-onglets" role="group" aria-label="Durée du bilan">${TYPES_BILAN().map(([t, nom]) => `<button type="button" data-bilan-type="${t}" class="${p.type === t ? 'actif' : ''}" aria-pressed="${p.type === t}">${nom}</button>`).join('')}</span>
      <span class="bm-nav"><button type="button" class="fleche-cal" data-bilan-sens="-1" aria-label="Précédent">${iconeEcole('precedent')}</button><b>${esc(p.titre)}</b><button type="button" class="fleche-cal" data-bilan-sens="1" aria-label="Suivant">${iconeEcole('suivant')}</button></span>
    </div>
    <div class="bm-chiffres">
      <div><small>Présence</small><b>${tauxPresence(r)}</b><span>${pluriel(r.nbJoursAppel, 'jour')} d’appel</span></div>
      <div><small>Absences</small><b>${r.absences}</b><span>demi-journée${r.absences > 1 ? 's' : ''}${an ? `, dont ${an} non justifiée${an > 1 ? 's' : ''}` : ''}</span></div>
      <div><small>Retards</small><b>${ret}</b><span>&nbsp;</span></div>
      <div class="info-sensible${b.alertes.length ? ' bm-chiffre-rouge' : ''}"><small>À signaler</small><b>${b.alertes.length ? pluriel(b.alertes.length, 'élève') : 'Personne'}</b><span>${SEUIL_ASSIDUITE} non justifiées ou plus dans un mois</span></div>
    </div>
    ${b.alertes.length ? `<div class="alerte-sante bm-alerte">${iconeEcole('alerte')}<span><b>${SEUIL_ASSIDUITE} demi-journées non justifiées ou plus dans un même mois</b> : ${b.alertes.map(l => esc(`${l.el.prenom} ${l.el.nom}`)).join(', ')}. À voir avec la direction de l’école (signalement prévu par le Code de l’éducation, article L131-8).</span></div>` : ''}
    <section class="info-sensible"><h3>${iconeEcole('regarder')}À regarder d’abord</h3>${htmlAregarder(b, p)}</section>
    <h3>${iconeEcole('calendrier')}Jour par jour</h3>${LEGENDE_CAL_BILAN}${htmlCalendrierBilan(r)}
    ${b.cantine.length ? `<h3>${iconeEcole('cantine')}Cantine</h3><p>${b.cantine.map(x => `${esc(dateCourte(x.date))} : <b>${x.n}</b>`).join(' · ')}</p>` : ''}
    <p class="aide">Ce bilan aide à tenir le registre d’appel, sans le remplacer si ton école en tient un autre.</p>`;
}
const texteBilanEcole = (c, p) => [`Absences et retards — ${c.nom} — ${p.titre}`, 'Nom\tPrénom\tNon justifiées\tJustifiées\tRetards',
  ...bilanEcole(c, p).lignes.map(l => [l.el.nom, l.el.prenom, l.an, l.aj, l.r].join('\t'))].join('\n');

async function ouvrirBilanEcole(c) {
  let p = plageBilan(ui.bilanAppel || 'mois', dateAppelEcole());
  const { d, resultat } = ouvrirModale(`Bilan de l’appel — ${c.nom}`, `<div data-corps>${htmlBilanEcole(c, p)}</div>`,
    `<button type="button" data-copier>${iconeEcole('copier')}Copier</button><button type="button" data-apercu class="primaire">${iconeEcole('telecharger')}Aperçu, PDF, impression</button><span class="espace"></span><button type="button" data-fermer autofocus>Fermer</button>`, 'modale-large modale-bilan-mois');
  iconeTitreModale(d, 'bilan');
  const redessiner = () => { $('[data-corps]', d).innerHTML = htmlBilanEcole(c, p); poserBarresBilan(d); };
  poserBarresBilan(d);
  d.addEventListener('click', e => {
    const t = e.target.closest('[data-bilan-type], [data-bilan-sens], [data-cj], [data-copier], [data-apercu]');
    if (!t) return;
    if (t.dataset.cj !== undefined) { // (jour du calendrier : le détail s'affiche dessous)
      d.querySelectorAll('.cj-jour.choisi').forEach(x => x.classList.remove('choisi'));
      t.classList.add('choisi');
      $('[data-cj-detail]', d).innerHTML = htmlDetailJourBilan(registreEcole(c, p), +t.dataset.cj);
      return;
    }
    if (t.dataset.bilanType) {
      ui.bilanAppel = t.dataset.bilanType; memoriserUi();
      p = plageBilan(t.dataset.bilanType, dansPlage(dateAppelEcole(), p) ? dateAppelEcole() : p.debut);
      return redessiner();
    }
    if (t.dataset.bilanSens) { p = plageVoisine(p, +t.dataset.bilanSens); return redessiner(); }
    if (t.matches('[data-copier]')) return lancer(() => copierTexte(texteBilanEcole(c, p)));
    lancer(() => apercuBilanEcole(c, p));
  });
  await resultat;
}

/* ---------- Bilan en PDF : une seule page A4 en portrait, « fiche de cahier » (même DA que le carnet École) ----------
   Feuille blanche (pas d'encre pour rien) avec la marge rouge et des lignes bleues très pâles ; titres à l'encre.
   Dans l'ordre : chiffres clés, calendrier de la classe (le même qu'à l'écran : deux traits par jour, matin à gauche,
   après-midi à droite), élèves à suivre avec le seuil de signalement, visa. Dessiné une fois (dessinpdf.js),
   montré en aperçu, puis téléchargé ou imprimé. */
const PAGE_A4_PORTRAIT = { l: 595, h: 842 };
const COULEURS_PDF = { encre: '#1f3a6b', texte: '#1c2740', texte2: '#56617a', bord: '#c9d3e7', ligne: '#e9edf5', marge: '#d65a52',
  carte: '#f6f8fc', P: '#2e9d4a', AN: '#d64545', AJ: '#2f78d6', R: '#d08a0c', danger: '#b93a2e', dangerFond: '#fbe7e5', dangerTexte: '#7a2a22' };
// Couleur des titres : celle choisie dans les réglages s'il y en a une, sinon l'encre du carnet.
const accentPdf = () => { const v = getComputedStyle(document.documentElement).getPropertyValue('--accent-clair').trim(); return /^#[0-9a-f]{6}$/i.test(v) ? v : COULEURS_PDF.encre; };
const COULEUR_DEMI_PDF = { ok: COULEURS_PDF.P, moyen: COULEURS_PDF.R, fort: COULEURS_PDF.AN };

// La page de cahier : lignes pâles tous les 16 points, marge rouge à gauche.
function feuilleCahierPdf(d, M) {
  const C = COULEURS_PDF;
  for (let y = 96; y < d.h - 40; y += 16) d.ligne(0, y, d.l, y, { trait: C.ligne, ep: 0.5 });
  d.ligne(M - 14, 0, M - 14, d.h, { trait: C.marge, ep: 1 });
}
// Un titre de partie : texte à l'encre et filet fin.
function titrePartiePdf(d, x, y, l, texte, A) {
  d.texte(x, y, texte, { taille: 12, gras: true, couleur: A });
  d.ligne(x, y + 5, x + l, y + 5, { trait: A, ep: 0.6 });
}

// Le calendrier de la classe : une ligne par semaine (lundi à vendredi), le mois noté à gauche quand il change.
function calendrierPdf(d, r, x, y, l, hDispo) {
  const C = COULEURS_PDF, semaines = [];
  r.jours.forEach((j, i) => {
    const dt = new Date(j.date + 'T12:00'), col = (dt.getDay() + 6) % 7;
    if (col > 4) return;
    const lundi = decalerJour(j.date, -col);
    if (semaines.at(-1)?.lundi !== lundi) semaines.push({ lundi, jours: [] });
    semaines.at(-1).jours[col] = i;
  });
  const gauche = 34, gap = 4, cw = (l - gauche - 4 * gap) / 5, ch = Math.max(15, Math.min(56, (hDispo - 14) / Math.max(1, semaines.length) - gap));
  ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.'].forEach((t, k) => d.texte(x + gauche + k * (cw + gap) + cw / 2, y + 8, t, { taille: 7.5, couleur: C.texte2, ancre: 'milieu' }));
  let moisAvant = '', yy = y + 14;
  for (const s of semaines) {
    const premier = s.jours.find(v => v !== undefined), mois = moisDe(r.jours[premier].date);
    if (mois !== moisAvant) { d.texte(x, yy + 10, new Date(mois + '-15T12:00').toLocaleDateString('fr-FR', { month: 'short' }), { taille: 8, gras: true, couleur: C.encre }); moisAvant = mois; }
    s.jours.forEach((i, k) => {
      if (i === undefined) return;
      const j = r.jours[i], cx = x + gauche + k * (cw + gap), num = new Date(j.date + 'T12:00').getDate();
      const m = demiClasse(r, i, 0), a = demiClasse(r, i, 1), abs = m.abs.length + a.abs.length, ret = m.ret.length + a.ret.length;
      if (j.s) d.rect(cx, yy, cw, ch, { fond: '#ffffff', trait: C.bord, ep: 0.6, rayon: 3 });
      else d.rect(cx, yy, cw, ch, { trait: C.bord, ep: 0.5, tirets: [1.5, 1.5], rayon: 3 });
      d.texte(cx + 4, yy + 9, String(num), { taille: 8, gras: !!j.s, couleur: j.s ? C.encre : C.texte2 });
      if (abs && ch >= 22) d.texte(cx + cw - 4, yy + 9, `${abs} abs.`, { taille: 7, couleur: C.danger, ancre: 'fin' });
      if (ret) d.cercle(abs && ch >= 22 ? cx + cw - 6 - d.largeurTexte(`${abs} abs.`, 7) - 5 : cx + cw - 6, yy + 6.5, 2, { fond: C.R });
      const by = yy + ch - 6, bw = (cw - 11) / 2;
      [m, a].forEach((x2, q) => {
        const n = niveauDemi(x2), bx = cx + 4 + q * (bw + 3);
        if (n === 'vide') d.rect(bx, by, bw, 3, { trait: C.texte2, ep: 0.4, rayon: 1.5 });
        else d.rect(bx, by, bw, 3, { fond: COULEUR_DEMI_PDF[n], rayon: 1.5 });
      });
    });
    yy += ch + gap;
  }
  return yy;
}
function legendeCalendrierPdf(d, x, y) {
  const C = COULEURS_PDF;
  for (const [coul, nom] of [[C.P, 'Tout le monde présent'], [C.R, '1 ou 2 absents'], [C.AN, '3 absents ou plus'], [null, 'Pas d’appel']]) {
    for (const q of [0, 1]) { if (coul) d.rect(x + q * 9, y - 4, 7, 3, { fond: coul, rayon: 1.5 }); else d.rect(x + q * 9, y - 4, 7, 3, { trait: C.texte2, ep: 0.4, rayon: 1.5 }); }
    d.texte(x + 20, y, nom, { taille: 7.5, couleur: C.texte2 });
    x += 30 + d.largeurTexte(nom, 7.5);
  }
  d.cercle(x + 2, y - 2.5, 2, { fond: C.R }); d.texte(x + 8, y, 'retard · à gauche le matin, à droite l’après-midi', { taille: 7.5, couleur: C.texte2 });
}

function dessinerBilanEcole(c, p) {
  const C = COULEURS_PDF, b = bilanEcole(c, p), r = registreEcole(c, p), A = accentPdf(), prof = reglage('apparence')?.prof || '';
  const d = DessinPdf({ ...PAGE_A4_PORTRAIT, titre: `Bilan de l’appel — ${c.nom} — ${p.titre}` });
  const M = 64, l = d.l - M - 36, h = d.h;
  feuilleCahierPdf(d, M);

  // En-tête
  d.texte(M, 52, d.tenir(`Bilan de l’appel — ${c.nom}`, l - 120, 19, true), { taille: 19, gras: true, couleur: A });
  d.texte(M, 69, [p.titre, prof].filter(Boolean).join(' · '), { taille: 10, couleur: C.texte2 });
  d.texte(M + l, 52, 'Carnet École S-A', { taille: 9, couleur: C.texte2, ancre: 'fin' });
  d.ligne(M, 78, M + l, 78, { trait: A, ep: 1.5 });

  // Chiffres clés
  const an = b.lignes.reduce((n, x) => n + x.an, 0), ret = b.lignes.reduce((n, x) => n + x.r, 0), cw = (l - 3 * 8) / 4, cy = 92;
  [['Présence', tauxPresence(r), `${pluriel(r.nbJoursAppel, 'jour')} d’appel`],
    ['Absences', String(r.absences), `demi-journée${r.absences > 1 ? 's' : ''}${an ? `, dont ${an} NJ` : ''}`],
    ['Retards', String(ret), ret ? pluriel(ret, 'demi-journée') : 'aucun retard'],
    ['À signaler', b.alertes.length ? pluriel(b.alertes.length, 'élève') : 'Personne', `${SEUIL_ASSIDUITE} NJ ou plus dans un mois`]].forEach(([lib, val, sous], i) => {
    const x = M + i * (cw + 8), rouge = i === 3 && b.alertes.length;
    d.rect(x, cy, cw, 52, { fond: rouge ? C.dangerFond : C.carte, trait: rouge ? C.danger : C.bord, ep: 0.6, rayon: 6 });
    d.texte(x + 9, cy + 14, lib, { taille: 8.5, couleur: rouge ? C.danger : C.texte2 });
    d.texte(x + 9, cy + 33, d.tenir(val, cw - 18, 17, true), { taille: 17, gras: true, couleur: rouge ? C.danger : A });
    d.texte(x + 9, cy + 45, d.tenir(sous, cw - 18, 7), { taille: 7, couleur: C.texte2 });
  });

  // Bas de page réservé : élèves à suivre, alerte, visa. (Le calendrier prend la place qui reste.)
  const lignes = lignesAregarder(b), hl = 17, maxLignes = 8, nbLignes = Math.min(lignes.length, maxLignes);
  const texteAlerte = b.alertes.length ? `${SEUIL_ASSIDUITE} demi-journées non justifiées ou plus dans un même mois : ${b.alertes.map(x => `${x.el.prenom} ${x.el.nom}`).join(', ')}. À voir avec la direction de l’école (signalement prévu par le Code de l’éducation, article L131-8).` : '';
  const lignesAlerte = texteAlerte ? d.couper(texteAlerte, l - 40, 8.5) : [], hAlerte = lignesAlerte.length ? lignesAlerte.length * 11 + 12 : 0;
  const hEleves = 30 + Math.max(1, nbLignes) * hl + (lignes.length > maxLignes ? 12 : 0) + 18;
  const yVisa = h - 62, yReserve = yVisa - 22 - hAlerte - (hAlerte ? 10 : 0) - hEleves;
  let yEleves = yReserve;

  // Calendrier de la classe
  titrePartiePdf(d, M, 172, l, 'Calendrier de la classe', A);
  if (!r.jours.length) d.texte(M, 196, 'Pas encore d’appel sur cette durée.', { taille: 9.5, couleur: C.texte2 });
  else {
    const fin = calendrierPdf(d, r, M, 184, l, yReserve - 30 - 184);
    legendeCalendrierPdf(d, M, fin + 10);
    yEleves = Math.min(yReserve, fin + 30); // (juste sous le calendrier : pas de grand vide au milieu)
  }

  // Élèves à suivre
  titrePartiePdf(d, M, yEleves + 12, l, 'Élèves à suivre', A);
  if (!lignes.length) d.texte(M, yEleves + 34, `Aucune absence ni aucun retard ${surPlage(p)}.`, { taille: 9.5, couleur: C.texte });
  else {
    const echelle = Math.max(SEUIL_ASSIDUITE * 2, ...lignes.map(x => x.an + x.aj + x.r)), nomW = 130, px = M + nomW, pw = l - nomW - 130;
    lignes.slice(0, maxLignes).forEach((x, i) => {
      const y = yEleves + 26 + i * hl, rouge = x.pireMois >= SEUIL_ASSIDUITE, orange = x.pireMois === SEUIL_ASSIDUITE - 1;
      d.texte(M, y + 8, d.tenir(`${x.el.prenom} ${x.el.nom}`, nomW - 8, 9, rouge || orange), { taille: 9, gras: rouge || orange, couleur: rouge ? C.danger : orange ? C.R : C.texte });
      d.rect(px, y, pw, 9, { fond: C.carte, trait: C.bord, ep: 0.4, rayon: 3 });
      let sx = px;
      for (const [k, v] of [['AN', x.an], ['AJ', x.aj], ['R', x.r]]) { if (!v) continue; const w = pw * v / echelle; d.rect(sx, y, w - 1, 9, { fond: C[k], rayon: 3 }); sx += w; }
      d.rect(px + pw * SEUIL_ASSIDUITE / echelle - 0.6, y - 3, 1.2, 15, { fond: C.danger });
      d.texte(px + pw + 8, y + 8, d.tenir(detailAregarder(x), 122, 8), { taille: 8, couleur: C.texte2 });
    });
    if (lignes.length > maxLignes) d.texte(M, yEleves + 26 + maxLignes * hl + 8, `+ ${pluriel(lignes.length - maxLignes, 'autre élève')} avec au moins une absence ou un retard.`, { taille: 8.5, couleur: C.texte2 });
    let lx = M, ly = yEleves + hEleves - 6;
    for (const [k, nom] of [['AN', 'Non justifiée'], ['AJ', 'Justifiée'], ['R', 'Retard']]) {
      d.rect(lx, ly - 6, 7, 7, { fond: C[k], rayon: 2 }); d.texte(lx + 10, ly, nom, { taille: 7.5, couleur: C.texte2 }); lx += 20 + d.largeurTexte(nom, 7.5);
    }
    d.rect(lx + 2, ly - 8, 1.2, 10, { fond: C.danger });
    d.texte(lx + 8, ly, `seuil : ${SEUIL_ASSIDUITE} demi-journées non justifiées dans un mois`, { taille: 7.5, couleur: C.texte2 });
  }

  // Alerte (sous les élèves), puis visa en bas de page
  const yAlerte = yEleves + hEleves + 10;
  if (lignesAlerte.length) {
    d.rect(M, yAlerte, l, hAlerte, { fond: C.dangerFond, trait: C.danger, ep: 0.6, rayon: 5 });
    d.trace([[M + 12, yAlerte + 6], [M + 18, yAlerte + 17], [M + 6, yAlerte + 17]], { trait: C.danger, ep: 1.1, ferme: true });
    lignesAlerte.forEach((t, i) => d.texte(M + 26, yAlerte + 15 + i * 11, t, { taille: 8.5, couleur: C.dangerTexte }));
  }
  d.texte(M, yVisa, 'Vu et vérifié le ……………………………      Signature : ………………………………………………', { taille: 9.5, couleur: C.texte });
  const edite = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  d.texte(M, h - 26, `Carnet École S-A · ${c.nom} · édité le ${edite}`, { taille: 7.5, couleur: C.texte2 });
  return d;
}

// Aperçu des pages, puis « Télécharger le PDF » ou « Imprimer » : les deux partent du même dessin.
async function apercuBilanEcole(c, p) {
  const dessin = dessinerBilanEcole(c, p), nom = `Registre d'appel ${c.nom} ${p.titre.replace(' · ', ' ')}`;
  const pages = dessin.pages.map((_, i) => dessin.versSvg(i));
  const { d, resultat } = ouvrirModale(`Aperçu — ${p.titre}`,
    `<p class="aide">Une page A4 en portrait : c’est exactement ce que contiendra le PDF ou la feuille imprimée.</p><div class="apercu-pdf">${pages.map(s => `<div class="feuille-pdf">${s}</div>`).join('')}</div>`,
    `<button type="button" class="primaire" data-pdf>${iconeEcole('telecharger')}Télécharger le PDF</button><button type="button" data-imprimer>${iconeEcole('imprimer')}Imprimer</button><span class="espace"></span><button type="button" data-fermer autofocus>Fermer</button>`,
    'modale-large modale-apercu-pdf');
  iconeTitreModale(d, 'regarder');
  d.addEventListener('click', e => {
    if (e.target.closest('[data-pdf]')) lancer(async () => { telechargerBlob(new Blob([await dessin.versPdf()], { type: 'application/pdf' }), `${nom}.pdf`); toast('PDF enregistré dans tes téléchargements', 'ok'); });
    if (e.target.closest('[data-imprimer]')) imprimerZoneEcole(`<div class="impression-pdf">${pages.join('')}</div>`, nom);
  });
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
        <button type="button" class="${s.etat === 'fait' ? 'actif' : ''}" data-ecole="etat" data-arg="${s.id}|fait" aria-pressed="${s.etat === 'fait'}">${iconeEcole('present')}Faite</button>
        <button type="button" class="${s.etat === 'reprendre' ? 'actif' : ''}" data-ecole="etat" data-arg="${s.id}|reprendre" aria-pressed="${s.etat === 'reprendre'}">${iconeEcole('reprendre')}À reprendre</button>
      </div>
    </article>`;
  return `
    <div class="outils">
      <h2>${iconeEcole('cahier')}Cahier journal — ${esc(c.nom)}</h2>
      <button class="fleche-ecole" data-ecole="jour" data-arg="-1" aria-label="Jour précédent">${iconeEcole('precedent')}</button>
      <label class="choix-tri">Jour<input type="date" data-date-journal value="${date}"></label>
      <button class="fleche-ecole" data-ecole="jour" data-arg="1" aria-label="Jour suivant">${iconeEcole('suivant')}</button>
      ${date !== aujourdhui() ? '<button data-ecole="journal-aujourdhui">Aujourd’hui</button>' : ''}
      <span class="espace"></span>
      ${seances.length ? `<button data-ecole="imprimer-journal">${iconeEcole('imprimer')}Imprimer</button>` : ''}
      <button class="primaire" data-ecole="seance">+ Séance</button>
    </div>
    <h3 class="jour-journal">${esc(jourLong(date))}</h3>
    ${aReprendre.length ? `<div class="alerte-sante">${iconeEcole('reprendre')}<b>À reprendre</b> : ${aReprendre.map(s => `<button type="button" class="lien" data-ecole="aller-jour" data-arg="${s.date}">${esc(dateCourte(s.date))} — ${esc(s.titre)}</button>`).join(' · ')}</div>` : ''}
    ${seances.length ? `<div class="liste-journal">${seances.map(carte).join('')}</div>`
    : `<div class="vide"><p>Rien de prévu ce jour-là.</p>
        ${modele ? `<button class="primaire" data-ecole="reprendre-jour" data-arg="${modele}">${iconeEcole('copier')}Reprendre le plan du ${esc(dateCourte(modele))}</button>
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
  poserBarresBilan(zone);
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
      ${m.niveau !== null ? `<button type="button" class="lien" data-livret="autre" data-arg="${esc(m.ca)}">${iconeEcole('de')}Autre proposition</button>` : ''}
    </section>`).join('')}
    <section class="matiere-livret"><h3>Appréciation générale</h3>
      <textarea rows="3" data-livret-general aria-label="Appréciation générale">${esc(texteGenerale(l))}</textarea>
      <button type="button" class="lien" data-livret="autre-general">${iconeEcole('de')}Autre proposition</button>
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
      <td>${texteGenerale(l) ? iconeEcole('coche', 'Écrite') : ''}</td></tr>`; }).join('')}</tbody></table></div>
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
  const a = absencesPeriode(l.el, l.periode), p = periodesAnnee().find(x => x.id === l.periode), app = reglage('apparence');
  const lignes = l.matieres.filter(m => m.domaines.some(x => x.degre) || texteMatiere(l, m));
  const cases = d => [1, 2, 3, 4].map(n => `<td class="case-pos${d === n ? ` retenue pos-${n}` : ''}">${d === n ? '●' : ''}</td>`).join('');
  const blocs = lignes.map(m => {
    const notes = m.domaines.filter(x => x.degre), travaille = elementsTravailles(l.c, l.periode, m.ca), appr = texteMatiere(l, m);
    // Une matière sans sous-domaine (EPS, EMC…) : pas de ligne qui répète son nom.
    const unique = m.domaines.length === 1, rangs = Math.max(1, unique ? 1 : notes.length);
    const titre = `<b>${esc(m.titre)}</b>${travaille ? `<small>Travaillé : ${esc(travaille)}</small>` : ''}`;
    const fin = `<td class="appr-pos" rowspan="${rangs}">${esc(appr)}</td>`;
    if (unique) return `<tbody><tr><td class="matiere-pos" colspan="2">${titre}</td>${cases(notes[0]?.degre)}${fin}</tr></tbody>`;
    if (!notes.length) return `<tbody><tr><td class="matiere-pos" colspan="2">${titre}</td>${cases(null)}${fin}</tr></tbody>`;
    return `<tbody>${notes.map((x, i) => `<tr>${i ? '' : `<td class="matiere-pos" rowspan="${rangs}">${titre}</td>`}<td class="domaine-pos">${esc(x.a.texte.replace(/\s*\(.*$/, ''))}</td>${cases(x.degre)}${i ? '' : fin}</tr>`).join('')}</tbody>`;
  }).join('');
  const abs = `${a.abs} demi-journée${a.abs > 1 ? 's' : ''}${a.nj ? ` (dont ${a.nj} non justifiée${a.nj > 1 ? 's' : ''})` : ''}`;
  return `<section class="page-livret">
    <header class="tete-livret"><div><h1>${esc(l.el.prenom)} ${esc(l.el.nom)}</h1><p>${esc(l.c.nom)}${app.prof ? ` · ${esc(app.prof)}` : ''}</p></div>
      <div class="droite-livret"><b>Livret — ${esc(p?.code || '')}</b><p>${esc(p?.texte || '')}</p><p>Absences : ${abs} · Retards : ${a.ret}</p></div></header>
    <table class="table-livret"><colgroup><col class="c-matiere"><col class="c-domaine"><col class="c-pos"><col class="c-pos"><col class="c-pos"><col class="c-pos"><col class="c-appr"></colgroup>
      <thead><tr><th colspan="2">Matière et domaine</th>${['Non atteints', 'Partiellement atteints', 'Atteints', 'Dépassés'].map(t => `<th class="titre-pos">${t}</th>`).join('')}<th>Appréciation</th></tr></thead>
      ${blocs}</table>
    <p class="legende-livret">Colonnes centrales : où en est l’élève par rapport aux objectifs d’apprentissage de la période.</p>
    <div class="general-livret"><h2>Appréciation générale</h2><p>${esc(texteGenerale(l))}</p>${l.doc.accompagnement ? `<p class="accomp-livret"><b>Accompagnement :</b> ${esc(l.doc.accompagnement)}</p>` : ''}</div>
    <div class="signatures-livret"><div>L’enseignant(e)</div><div>Le ou les parents</div></div>
  </section>`;
}

async function ouvrirLivret(c) {
  const eleves = elevesDe(c.id);
  if (!eleves.length) return toast('Ajoute d’abord des élèves.');
  const etat = { periode: periodeLivretDefaut(), id: eleves[0].id, vue: 'eleve', graines: {} };
  const el = () => Donnees.get('eleves', etat.id);
  const courant = () => livretEleve(el(), Donnees.get('classes', c.id), etat.periode);
  const entete = () => `<div class="outils">
      <label class="choix-tri">Période<select data-livret-periode>${periodesAnnee().map(p => `<option value="${p.id}" ${p.id === etat.periode ? 'selected' : ''}>${p.code} (${esc(p.texte)})</option>`).join('')}</select></label>
      <button type="button" class="icone-petit" data-livret="periodes" title="Trimestres, semestres ou 5 périodes" aria-label="Régler les périodes">${iconeEcole('reglages')}</button>
      <div class="fiche-onglets"><button type="button" class="${etat.vue === 'eleve' ? 'actif' : ''}" data-livret="vue" data-arg="eleve">${iconeEcole('eleve')}Élève</button><button type="button" class="${etat.vue === 'classe' ? 'actif' : ''}" data-livret="vue" data-arg="classe">${iconeEcole('liste')}Classe</button></div>
      ${etat.vue === 'eleve' ? `<span class="choix-eleve-livret"><button type="button" class="fleche-ecole" data-livret="suivant" data-arg="-1" aria-label="Élève précédent">${iconeEcole('precedent')}</button>
      <select data-livret-eleve aria-label="Élève">${eleves.map(x => `<option value="${x.id}" ${x.id === etat.id ? 'selected' : ''}>${esc(x.nom)} ${esc(x.prenom)}</option>`).join('')}</select>
      <button type="button" class="fleche-ecole" data-livret="suivant" data-arg="1" aria-label="Élève suivant">${iconeEcole('suivant')}</button></span>` : ''}</div>`;
  const corps = () => entete() + (etat.vue === 'eleve' ? htmlFicheLivret(courant()) : htmlClasseLivret(Donnees.get('classes', c.id), etat.periode));
  const { d, resultat } = ouvrirModale(`Livret — ${c.nom}`, `<div data-corps>${corps()}</div>`,
    `<button type="button" data-livret="copier">${iconeEcole('copier')}Copier</button><button type="button" data-livret="imprimer">${iconeEcole('imprimer')}Imprimer</button><span class="espace"></span><button type="button" data-fermer class="primaire">Fermer</button>`, 'modale-large livret-ecole');
  iconeTitreModale(d, 'livre');
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
    case 'reglages-notes': return lancer(() => reglerNotesEcole(c));
    case 'matiere': ui.matiereEcole = arg; memoriserUi(); return rendreVue();
    case 'niveau': ui.niveauEcole = arg; memoriserUi(); return rendreVue();
    case 'demi': ui.demiJournee = arg; return rendreVue();
    case 'appel-aujourdhui': ui.dateAppel = ''; ui.moisCalAppel = ''; return rendreVue();
    case 'aller-appel': ui.dateAppel = arg === aujourdhui() ? '' : arg; ui.moisCalAppel = ''; return rendreVue();
    case 'semaine-appel': { const d = decalerJour(dateAppelEcole(), +arg); ui.dateAppel = d === aujourdhui() ? '' : d; ui.moisCalAppel = ''; return rendreVue(); }
    case 'cal-mois': { const [a, m] = (ui.moisCalAppel || moisDe(dateAppelEcole())).split('-').map(Number), x = new Date(a, m - 1 + +arg, 1);
      ui.moisCalAppel = `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`; return rendreVue(); }
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
      toast('Appel terminé', 'ok');
    });
    case 'bilan-mois': return lancer(() => ouvrirBilanEcole(c));
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
  if (t.matches('[data-date-appel-ecole]')) { ui.dateAppel = t.value && t.value !== aujourdhui() ? t.value : ''; ui.moisCalAppel = ''; return rendreVue(); }
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

/* ---------- Notes : la page remonte d'abord, puis la grille défile ----------
   La grille prend toute la hauteur de l'écran (style.css) : tant qu'elle n'est pas en haut de la page, la molette fait
   monter la page (filtres et légende s'en vont) ; ensuite, elle fait défiler les élèves. Vers le haut : l'inverse. */
function defilerPageAvantGrille(e) {
  if (!avecEcole() || e.ctrlKey || !e.deltaY || modaleOuverte()) return;
  const g = e.target.closest?.('#vue .grille-scroll'), v = $('#vue');
  if (!g || !v) return;
  const ecart = g.getBoundingClientRect().top - v.getBoundingClientRect().top - (parseFloat(getComputedStyle(v).paddingTop) || 0);
  const pageEnBas = v.scrollTop + v.clientHeight >= v.scrollHeight - 1;
  const monte = e.deltaY > 0 && ecart > 1 && !pageEnBas; // la grille n'est pas encore en haut
  const descend = e.deltaY < 0 && g.scrollTop <= 0 && v.scrollTop > 0; // grille revenue au début : la page redescend
  if (!monte && !descend) return;
  e.preventDefault();
  const pas = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * v.clientHeight : e.deltaY;
  v.scrollTop += monte ? Math.min(pas, ecart) : pas;
}
document.addEventListener('wheel', defilerPageAvantGrille, { passive: false });
