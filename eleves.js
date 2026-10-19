'use strict';
/* ---------- Onglet Élèves : « 👀 Consulter » (cartes) et « ✎ Modifier la liste » (tableau, app.js) ----------
   Consulter : bandeau de la classe (chiffres clés, filtres d'un toucher) puis une carte par élève, façon trombinoscope :
   photo ou initiales en couleur, seules les étiquettes utiles (PAI, BEP, dispense, adapté, alertes), moyenne et tendance,
   absences du trimestre. Un toucher sur la carte ouvre la fiche bilan. Tout est calculé par l'appli à partir du carnet.
   Le mode (consulter / modifier) et le filtre sont propres à cet appareil (ui.modeEleves, ui.filtreEleves). */

const modeEleves = () => (ui.modeEleves === 'modifier' ? 'modifier' : 'consulter');
const dispenseActive = el => ['encours', 'bientot'].includes(statutDispense(el)?.code);
const aBep = el => !!el.bep;

// Filtres du bandeau : [libellé, test]. « Sans photo » n'apparaît que si la classe a déjà des photos.
const FILTRES_ELEVES = {
  tous: ['Tous', () => true],
  dispenses: ['Dispensés', dispenseActive],
  adaptes: ['Adaptés', el => !!el.adapte],
  besoins: ['PAI / BEP', el => aPai(el) || aBep(el)],
  alertes: ['À surveiller', el => !!(absencesEleve(el).niveau || oublisTenue(el).niveau)],
  photo: ['Sans photo', el => !el.photo],
};

// Initiales (« CA » pour Chloé ARNAUD), sur fond rose / bleu selon le sexe, neutre sinon.
const initialesEleve = el => ((el.prenom || '').trim()[0] || '') + ((el.nom || '').trim()[0] || '');
const avatarEleve = el => Trombi.mini(el, 'avatar-eleve photo')
  || `<span class="avatar-eleve ${el.sexe === 'F' ? 'fille' : el.sexe === 'G' ? 'garcon' : ''}" aria-hidden="true">${esc(initialesEleve(el).toLocaleUpperCase('fr'))}</span>`;

// Moyenne sur 20 de la période affichée dans Notes, et sens de l'évolution (↗ ↘ →).
function resumeNotesEleve(el, periode) {
  const evals = evalsDe(el.classeId).filter(e => periode === 'annee' || periodeDe(e.date) === periode)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const moy = moyenneEleve(el.id, evals);
  const valeurs = evals.map(e => sur20(e, Donnees.note(e.id, el.id))).filter(v => v !== null);
  const t = tendanceNotes(valeurs);
  return { moy, fleche: t === null ? '' : t >= 1.5 ? '↗' : t <= -1.5 ? '↘' : '→', sens: t === null ? '' : t >= 1.5 ? 'hausse' : t <= -1.5 ? 'baisse' : 'stable' };
}

function htmlCarteEleve(el, i, periode) {
  const s = statutDispense(el), abs = absencesEleve(el), tenue = oublisTenue(el), notes = resumeNotesEleve(el, periode);
  const etiquettes = [
    aPai(el) ? `<button class="badge-pai" data-voir-besoin="pai" data-id="${el.id}" title="Voir le PAI">PAI</button>` : '',
    aBep(el) ? `<button class="badge-bep" data-voir-besoin="bep" data-id="${el.id}" title="Voir le BEP">BEP</button>` : '',
    s && s.code !== 'finie' ? `<span class="badge-disp ${s.code}" title="${esc(s.texte)}">${esc(s.court)}</span>` : '',
    el.adapte ? `<span class="badge-adapte-grille" title="${esc(el.adaptation || 'Pratique adaptée')}">Adapté</span>` : '',
    badgeAlerte(el, abs), badgeTenue(el, tenue),
    el.remarque ? `<span class="remarque-carte" title="${esc(el.remarque)}">💬</span>` : '',
  ].filter(Boolean).join('');
  // Liseré à gauche : alerte rouge, sinon dispense en cours (couleur de son étiquette).
  const lisere = abs.niveau === 'rouge' || tenue.niveau === 'rouge' ? 'lisere-alerte' : dispenseActive(el) ? 'lisere-' + s.code : '';
  const titre = `${el.prenom} ${el.nom} — ouvrir sa fiche bilan`;
  return `
    <div class="carte-eleve ${lisere}" data-carte-eleve="${el.id}" role="button" tabindex="0" title="${esc(titre)}" aria-label="${esc(titre)}">
      <span class="num-carte">${i + 1}</span>
      ${avatarEleve(el)}
      <span class="prenom-carte">${esc(el.prenom)}</span>
      <span class="nom-carte">${esc(el.nom)}</span>
      <span class="etiquettes-carte">${etiquettes}</span>
      <span class="stats-carte">
        <span title="Moyenne sur 20${periode === 'annee' ? ' de l’année' : ''}">${notes.moy === null ? '<span class="aide">pas de note</span>'
          : `<b>${fmt1(notes.moy)}</b>${notes.fleche ? ` <span class="tendance ${notes.sens}" title="Notes en ${notes.sens === 'hausse' ? 'hausse' : notes.sens === 'baisse' ? 'baisse' : 'stables'}">${notes.fleche}</span>` : ''}`}</span>
        <span title="Jours absent, blessé ou malade au ${esc(abs.periode?.code || 'trimestre')}">${abs.n} abs</span>
      </span>
    </div>`;
}

// Bandeau de la classe : chiffres clés, puis filtres (avec leur nombre) ; les filtres vides sont cachés.
function htmlBandeauClasse(eleves) {
  const nb = test => eleves.filter(test).length;
  const filles = nb(el => el.sexe === 'F'), garcons = nb(el => el.sexe === 'G');
  const tuiles = [
    ['Élèves', eleves.length, ''],
    ['Filles / garçons', `${filles} / ${garcons}`, ''],
    ['Dispensés', nb(dispenseActive), 'dispenses'],
    ['PAI / BEP', nb(FILTRES_ELEVES.besoins[1]), 'besoins'],
    ['À surveiller', nb(FILTRES_ELEVES.alertes[1]), 'alertes'],
  ];
  const actif = FILTRES_ELEVES[ui.filtreEleves] ? ui.filtreEleves : 'tous';
  const filtres = Object.entries(FILTRES_ELEVES).filter(([id, [, test]]) => id === 'tous' || actif === id
    || (id === 'photo' ? eleves.some(el => el.photo) && nb(test) : nb(test)));
  return `
    <div class="bandeau-classe">
      ${tuiles.map(([nom, n, filtre]) => `<${filtre ? `button type="button" data-filtre-eleves="${filtre}"` : 'div'} class="tuile-classe${filtre && actif === filtre ? ' actif' : ''}${filtre && !+n ? ' zero' : ''}">
        <small>${nom}</small><b>${n}</b></${filtre ? 'button' : 'div'}>`).join('')}
    </div>
    <div class="filtres-eleves" role="group" aria-label="Filtrer les élèves">
      ${filtres.map(([id, [nom, test]]) => `<button type="button" data-filtre-eleves="${id}" class="${id === actif ? 'actif' : ''}" aria-pressed="${id === actif}">
        ${nom}${id === 'tous' ? '' : ` <span class="nb-filtre">${nb(test)}</span>`}</button>`).join('')}
    </div>`;
}

function htmlConsulterEleves(c, eleves) {
  const actif = FILTRES_ELEVES[ui.filtreEleves] ? ui.filtreEleves : 'tous';
  const periode = periodeAffichee();
  // (Numéro = rang dans la classe, même filtrée.)
  const cartes = eleves.map((el, i) => [el, i]).filter(([el]) => FILTRES_ELEVES[actif][1](el));
  return htmlBandeauClasse(eleves) + (cartes.length
    ? `<div class="cartes-eleves">${cartes.map(([el, i]) => htmlCarteEleve(el, i, periode)).join('')}</div>`
    : `<p class="aide vide-filtre">Aucun élève dans « ${esc(FILTRES_ELEVES[actif][0])} ». <button type="button" class="lien" data-filtre-eleves="tous">Voir tous les élèves</button></p>`);
}

// Interrupteur Consulter / Modifier (en haut de l'onglet).
const htmlModeEleves = () => `<div class="mode-eleves" role="group" aria-label="Affichage de la liste">
  ${[['consulter', '👀 Consulter'], ['modifier', '✎ Modifier la liste']].map(([m, nom]) =>
    `<button type="button" data-mode-eleves="${m}" class="${modeEleves() === m ? 'actif' : ''}" aria-pressed="${modeEleves() === m}">${nom}</button>`).join('')}
</div>`;

document.addEventListener('click', e => {
  const b = e.target.closest?.('[data-mode-eleves], [data-filtre-eleves]');
  if (!b || b.closest('dialog')) return;
  if (b.dataset.modeEleves) ui.modeEleves = b.dataset.modeEleves;
  else ui.filtreEleves = b.dataset.filtreEleves === ui.filtreEleves && b.matches('.tuile-classe') ? 'tous' : b.dataset.filtreEleves;
  memoriserUi();
  rendreVue();
});
// Carte au clavier : Entrée ou Espace ouvrent la fiche, comme un toucher.
document.addEventListener('keydown', e => {
  const carte = e.target.closest?.('[data-carte-eleve]');
  if (!carte || e.target !== carte || (e.key !== 'Enter' && e.key !== ' ')) return;
  e.preventDefault();
  carte.click();
});
