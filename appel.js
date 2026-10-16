'use strict';
// Onglet « ✅ Appel » : la présence du jour, élève par élève — Présent, Absent, Retard, Oubli de tenue, Malade, Blessé ou Autre.
// Dès le premier toucher, l'appel est rangé dans la leçon du jour (créée si besoin, « Leçon du 14 oct. ») :
//   - colonne « Présence » (Présent, ou Retard : présent mais arrivé en retard) pour les présents ;
//   - statut de toute la leçon pour les autres : ABS, TEN (oubli de tenue), MAL, BLE ou AUT, comme dans la grille des leçons.
// Les outils du jour (équipes, tirage…) laissent donc de côté les absents. La leçon se complète ensuite dans l'onglet Leçons.
// (Fichier chargé avant app.js : il n'utilise les outils d'app.js qu'au moment des appels.)

const ID_PRESENCE = 'presence';
// [code, icône, nom] ; nom null : celui des statuts de leçon (STATUTS_ENT, renommable dans les réglages).
const ETATS_APPEL = [['present', '✅', 'Présent'], ['ABS', '❌', 'Absent'], ['RET', '⏰', 'Retard'], ['TEN', '👕', 'Oubli de tenue'],
  ['MAL', '🤒', null], ['BLE', '🩹', null], ['AUT', '🔹', null]];
const nomEtatAppel = ([k, , nom]) => nom || STATUTS_ENT[k] || k;
// Statuts de toute la leçon posés depuis l'appel (les autres, DISP…, viennent de l'onglet Leçons).
// (« Retard » n'en est pas un : l'élève est présent, arrivé en retard → « Retard » dans la colonne Présence.)
const CODES_APPEL = ETATS_APPEL.map(x => x[0]).filter(k => !['present', 'RET'].includes(k));

const dateAppel = () => ui.dateAppel || aujourdhui();

// Leçon du jour qui reçoit l'appel : celle qui a déjà la colonne « Présence », sinon la première leçon de ce jour
// (la colonne lui est ajoutée), sinon une nouvelle leçon. null si rien n'existe et creer = false.
function seanceAppel(c, date, creer = false) {
  const duJour = seancesDe(c.id).filter(s => s.date === date);
  let s = duJour.find(x => x.indicateurs.some(i => i.id === ID_PRESENCE)) || duJour[0] || null;
  if (!s && !creer) return null;
  if (!s) {
    s = Donnees.ecrire('seances', { id: Donnees.nouvelId(), classeId: c.id, cree: Date.now(), titre: `Leçon du ${dateCourte(date)}`, apsa: '', ca: '',
      date, indicateurs: [{ id: ID_PRESENCE, nom: 'Présence', type: 'choix', options: ['Présent', 'Retard'] }], documents: [] });
  } else if (creer && !s.indicateurs.some(i => i.id === ID_PRESENCE)) {
    s = Donnees.ecrire('seances', { ...s, indicateurs: [{ id: ID_PRESENCE, nom: 'Présence', type: 'choix', options: ['Présent', 'Retard'] }, ...s.indicateurs] });
  }
  return s;
}

// État d'un élève dans l'appel : 'present', 'ABS', 'TEN', un autre statut de la leçon (DISP, BLE…) ou '' (pas encore fait).
function etatAppel(s, el) {
  if (!s) return '';
  const st = statutEnt(s.id, el.id);
  if (st) return st;
  const p = Donnees.note(s.id, el.id, ID_PRESENCE);
  return p === 'Présent' ? 'present' : p === 'Retard' ? 'RET' : '';
}

function htmlAppel(c) {
  const eleves = elevesDe(c.id);
  if (!eleves.length) {
    return `<div class="vide"><h2>${esc(c.nom)}</h2><p>Pas encore d’élèves dans cette classe.</p>
      <button class="primaire" data-action="vue-eleves">Ajouter des élèves</button></div>`;
  }
  const date = dateAppel(), s = seanceAppel(c, date);
  const etats = new Map(eleves.map(el => [el.id, etatAppel(s, el)]));
  const nb = e => [...etats.values()].filter(x => x === e).length;
  const autres = [...etats.values()].filter(x => x && !['present', 'RET', ...CODES_APPEL].includes(x)).length, reste = nb('');
  return `
    <div class="outils">
      <h2>✅ Appel — ${esc(c.nom)}</h2>
      <label class="choix-tri">Jour<input type="date" data-date-appel value="${date}"></label>
      ${date !== aujourdhui() ? '<button data-appel="aujourdhui">Aujourd’hui</button>' : ''}
      <span class="espace"></span>
      <button class="primaire" data-appel="tous" ${reste ? '' : 'disabled'} title="Marquer présents tous les élèves pas encore pointés">✅ Tous les autres présents${reste ? ` (${reste})` : ''}</button>
    </div>
    <div class="bilan-appel">
      <span class="pastille-appel present">✅ <b>${nb('present')}</b> présent${nb('present') > 1 ? 's' : ''}</span>
      <span class="pastille-appel ABS">❌ <b>${nb('ABS')}</b> absent${nb('ABS') > 1 ? 's' : ''}</span>
      <span class="pastille-appel RET">⏰ <b>${nb('RET')}</b> retard${nb('RET') > 1 ? 's' : ''}</span>
      <span class="pastille-appel TEN">👕 <b>${nb('TEN')}</b> oubli${nb('TEN') > 1 ? 's' : ''} de tenue</span>
      ${ETATS_APPEL.filter(([k]) => ['MAL', 'BLE', 'AUT'].includes(k) && nb(k)).map(x =>
        `<span class="pastille-appel ${x[0]}">${x[1]} <b>${nb(x[0])}</b> ${esc(nomEtatAppel(x).toLocaleLowerCase('fr'))}</span>`).join('')}
      ${autres ? `<span class="pastille-appel">${autres} autre${autres > 1 ? 's' : ''} statut${autres > 1 ? 's' : ''} (dispensé…)</span>` : ''}
      ${reste ? `<span class="aide">${reste} à pointer</span>` : '<span class="aide">✔ Appel terminé</span>'}
    </div>
    <p class="aide">${s ? `Enregistré dans la leçon <b>« ${esc(s.titre)} »</b> du ${esc(dateCourte(date))} (onglet ${esc(mot('lecons'))}).`
    : `Au premier toucher, une leçon « Leçon du ${esc(dateCourte(date))} » est créée (ou celle de ce jour est complétée).`}</p>
    <ul class="liste-appel">${eleves.map(el => {
      const e = etats.get(el.id), disp = dispenseLe(el, date);
      return `<li class="ligne-appel${e ? ' etat-' + e : ''}">
        <span class="nom-appel">${Trombi.mini(el)}<b>${esc(el.nom)}</b> ${esc(el.prenom)}${disp ? ' <span class="badge-disp encours">dispensé</span>' : ''}
          ${badgeAlerte(el, absencesEleve(el))}${badgeTenue(el, oublisTenue(el))}
          ${e &&!['present', 'RET', ...CODES_APPEL].includes(e) ? `<span class="aide">· ${esc(STATUTS_ENT[e] || e)}</span>` : ''}</span>
        <span class="boutons-appel" role="group" aria-label="Appel de ${esc(el.nom)} ${esc(el.prenom)}">${ETATS_APPEL.map(x => {
          const [k, icone] = x, nom = esc(nomEtatAppel(x));
          return `<button class="bouton-appel b-${k}${e === k ? ' choisi' : ''}" data-appel="marquer" data-arg="${el.id}|${k}" aria-pressed="${e === k}" title="${nom}">${icone}<span class="libelle-appel">${nom}</span></button>`;
        }).join('')}</span>
      </li>`;
    }).join('')}</ul>`;
}

// Pointer un élève (toucher le même bouton une 2e fois : on enlève).
function marquerAppel(c, eleveId, etat) {
  const date = dateAppel(), s = seanceAppel(c, date, true), el = Donnees.get('eleves', eleveId);
  if (!el) return;
  const avant = etatAppel(s, el), nouveau = avant === etat ? '' : etat;
  const statut = statutEnt(s.id, el.id);
  if (nouveau === 'present' || nouveau === 'RET') {
    if (statut) Donnees.ecrireNote(s.id, el.id, '');
    Donnees.ecrireNote(s.id, el.id, nouveau === 'RET' ? 'Retard' : 'Présent', ID_PRESENCE);
  } else if (CODES_APPEL.includes(nouveau)) {
    Donnees.ecrireNote(s.id, el.id, nouveau);
    if (Donnees.note(s.id, el.id, ID_PRESENCE)) Donnees.ecrireNote(s.id, el.id, '', ID_PRESENCE);
  } else {
    if (statut) Donnees.ecrireNote(s.id, el.id, '');
    if (Donnees.note(s.id, el.id, ID_PRESENCE)) Donnees.ecrireNote(s.id, el.id, '', ID_PRESENCE);
  }
  rendreVue();
}

document.addEventListener('click', e => {
  const b = e.target.closest?.('#vue [data-appel]');
  if (!b || b.disabled) return;
  const c = classeActive();
  if (!c) return;
  const quoi = b.dataset.appel;
  if (quoi === 'marquer') { const [id, etat] = b.dataset.arg.split('|'); return lancer(() => marquerAppel(c, id, etat)); }
  if (quoi === 'aujourdhui') { ui.dateAppel = ''; return rendreVue(); }
  if (quoi === 'tous') {
    lancer(() => {
      const s = seanceAppel(c, dateAppel(), true);
      for (const el of elevesDe(c.id)) if (!etatAppel(s, el)) Donnees.ecrireNote(s.id, el.id, 'Présent', ID_PRESENCE);
      rendreVue();
      toast('Appel terminé ✔', 'ok');
    });
  }
});
document.addEventListener('change', e => {
  if (!e.target.matches?.('#vue [data-date-appel]')) return;
  ui.dateAppel = e.target.value && e.target.value !== aujourdhui() ? e.target.value : '';
  rendreVue();
});
