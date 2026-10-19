'use strict';
/* ---------- 🗂 Disposition des onglets sur tablette et téléphone ----------
   Les 7 onglets ne tiennent pas sur une tablette en portrait. Sur un écran tactile ou étroit, au choix
   (⚙ Réglages › Onglets, propre à chaque appareil) :
   - rideaux (par défaut) : Élèves + Appel, et Notes + Leçons + Barèmes, regroupés dans un rideau dépliant ;
   - bas : tous les onglets en bas de l'écran, avec une icône, à portée de pouce ;
   - favoris : les onglets favoris dans la barre, les autres dans « Plus ».
   Sur un grand écran d'ordinateur (souris), la barre complète reste affichée. */

const DISPOSITIONS_ONGLETS = { rideaux: 'Rideaux', bas: 'Barre en bas', favoris: 'Favoris + « Plus »' };
const GROUPES_ONGLETS = [
  { id: 'classe', nom: 'Classe', vues: ['eleves', 'appel'] },
  { id: 'suivi', nom: 'Suivi', vues: ['notes', 'entrainement', 'baremes'] },
  { id: 'outils', vues: ['outils'] },
  { id: 'agenda', vues: ['agenda'] },
];
const ICONES_ONGLETS = { eleves: '👥', appel: '✅', notes: '📝', entrainement: '📋', outils: '⏱', agenda: '📅', baremes: '📏' };
const FAVORIS_MAX = 4;
const ecranCompact = matchMedia('(max-width: 1199px), (hover: none) and (pointer: coarse)');

const dispositionOnglets = () => (DISPOSITIONS_ONGLETS[ui.disposition] ? ui.disposition : 'rideaux');
const dispositionActive = () => (ecranCompact.matches && !enModeEleve() ? dispositionOnglets() : null);
const nomOnglet = v => (reglage('onglets').noms[v] || '').trim() || NOMS_ONGLETS[v];
const favorisOnglets = visibles => reglage('onglets').favoris.filter(v => visibles.includes(v)).slice(0, FAVORIS_MAX);
const boutonOnglet = (v, contenu) =>
  `<button type="button" data-vue="${v}" class="${v === ui.vue ? 'actif' : ''}" ${v === ui.vue ? 'aria-current="page"' : ''}>${contenu}</button>`;
const boutonRideau = (id, actif, contenu, etiquette = '') =>
  `<button type="button" class="${actif ? 'actif' : ''}" data-rideau="${id}" aria-haspopup="menu" aria-expanded="false" ${etiquette ? `aria-label="${esc(etiquette)}"` : ''}>${contenu}</button>`;

// Appelée à chaque rendu (app.js › rendre).
function majOnglets() {
  const disp = dispositionActive(), haut = $('#onglets-compact'), bas = $('#onglets-bas');
  fermerRideau();
  if (disp) document.body.dataset.disposition = disp; else delete document.body.dataset.disposition;
  $('#onglets').hidden = !!disp;
  haut.hidden = disp !== 'rideaux' && disp !== 'favoris';
  bas.hidden = disp !== 'bas';
  // Dernière page ouverte de chaque groupe : un toucher sur le groupe y ramène.
  const g = GROUPES_ONGLETS.find(x => x.vues.includes(ui.vue));
  if (g && ui.vue !== (ui.dernierOnglet ||= {})[g.id]) { ui.dernierOnglet[g.id] = ui.vue; memoriserUi(); }
  const visibles = ongletsVisibles();
  haut.innerHTML = disp === 'rideaux' ? htmlRideaux(visibles) : disp === 'favoris' ? htmlFavoris(visibles) : '';
  bas.innerHTML = disp === 'bas' ? visibles.map(v => boutonOnglet(v,
    `<span class="icone-onglet" aria-hidden="true">${ICONES_ONGLETS[v]}</span><span class="nom-onglet">${esc(nomOnglet(v))}</span>`)).join('') : '';
}

function htmlRideaux(visibles) {
  return GROUPES_ONGLETS.map(g => {
    const vues = g.vues.filter(v => visibles.includes(v));
    if (vues.length < 2) return vues.map(v => boutonOnglet(v, esc(nomOnglet(v)))).join('');
    // Groupe en cours : un toucher déplie le rideau. Sinon : la dernière page du groupe, et ▾ pour les autres.
    if (vues.includes(ui.vue)) return `<span class="groupe-onglets actif">${boutonRideau(g.id, true, `${esc(nomOnglet(ui.vue))} <span class="chevron">▾</span>`)}</span>`;
    const v = vues.includes(ui.dernierOnglet?.[g.id]) ? ui.dernierOnglet[g.id] : vues[0];
    return `<span class="groupe-onglets">${boutonOnglet(v, esc(nomOnglet(v)))}${boutonRideau(g.id, false, '<span class="chevron">▾</span>',
      `${g.nom} : ${vues.map(nomOnglet).join(', ')}`)}</span>`;
  }).join('');
}

function htmlFavoris(visibles) {
  const fav = favorisOnglets(visibles), autres = visibles.filter(v => !fav.includes(v));
  const ici = autres.includes(ui.vue);
  return fav.map(v => boutonOnglet(v, esc(nomOnglet(v)))).join('')
    + (autres.length ? boutonRideau('plus', ici, `${ici ? esc(nomOnglet(ui.vue)) : 'Plus'} <span class="chevron">▾</span>`) : '');
}

function ouvrirRideau(bouton) {
  const id = bouton.dataset.rideau;
  const dejaOuvert = $('#rideau-onglets')?.dataset.groupe === id;
  fermerRideau();
  if (dejaOuvert) return; // 2e toucher : on referme
  const visibles = ongletsVisibles(), g = GROUPES_ONGLETS.find(x => x.id === id);
  const vues = g ? g.vues.filter(v => visibles.includes(v)) : visibles.filter(v => !favorisOnglets(visibles).includes(v));
  const r = document.createElement('div');
  r.id = 'rideau-onglets';
  r.className = 'rideau-onglets';
  r.setAttribute('role', 'menu');
  r.dataset.groupe = id;
  r.innerHTML = `<div class="rideau-titre">${esc(g ? g.nom : 'Autres onglets')}</div>` + vues.map(v =>
    `<button type="button" role="menuitem" data-vue="${v}" class="${v === ui.vue ? 'actif' : ''}"><span aria-hidden="true">${ICONES_ONGLETS[v]}</span>
      ${esc(nomOnglet(v))}${v === ui.vue ? '<span class="coche" aria-hidden="true">✓</span>' : ''}</button>`).join('');
  document.body.appendChild(r);
  // Sous le groupe, sans dépasser du bord droit (position posée par script : pas de style dans la page).
  const rect = (bouton.closest('.groupe-onglets') || bouton).getBoundingClientRect();
  r.style.setProperty('--x', Math.max(8, Math.min(rect.left, innerWidth - r.offsetWidth - 8)) + 'px');
  r.style.setProperty('--y', rect.bottom + 6 + 'px');
  bouton.setAttribute('aria-expanded', 'true');
  r.querySelector('button.actif, button')?.focus({ preventScroll: true });
}

function fermerRideau() {
  $('#rideau-onglets')?.remove();
  document.querySelectorAll('[data-rideau][aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
}

// (Le choix d'une page du rideau passe par le clic général sur [data-vue] d'app.js, qui redessine et referme.)
document.addEventListener('click', e => {
  const b = e.target.closest?.('[data-rideau]');
  if (b) return ouvrirRideau(b);
  if (!e.target.closest?.('#rideau-onglets')) fermerRideau();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#rideau-onglets')) fermerRideau(); });
addEventListener('resize', () => fermerRideau());
// Tablette tournée, fenêtre agrandie… : la barre s'adapte. (addListener : anciens Safari.)
const surEcranCompact = () => { if (typeof Donnees === 'object' && $('#onglets-compact')) majOnglets(); };
if (ecranCompact.addEventListener) ecranCompact.addEventListener('change', surEcranCompact); else ecranCompact.addListener(surEcranCompact);

// Réglages › Onglets : disposition (cet appareil) et favoris (dans le carnet).
function htmlReglageDisposition(o) {
  return `
    <h4>Disposition sur tablette et téléphone <span class="appareil">— sur cet appareil</span></h4>
    <div class="segments">${Object.entries(DISPOSITIONS_ONGLETS).map(([id, nom]) => radio('disposition', id, dispositionOnglets(), nom)).join('')}</div>
    <p class="aide"><b>Rideaux</b> : Élèves + Appel et Notes + ${esc(NOMS_ONGLETS.entrainement)} + Barèmes regroupés, ▾ pour déplier.
      <b>Barre en bas</b> : tous les onglets en bas de l’écran, avec une icône.
      <b>Favoris</b> : tes onglets favoris en haut, les autres dans « Plus ».
      Sur un ordinateur à grand écran, tous les onglets restent affichés en haut.</p>
    <h4>Onglets favoris <span class="appareil">— disposition Favoris, ${FAVORIS_MAX} au plus</span></h4>
    <div class="favoris-onglets">${Object.keys(NOMS_ONGLETS).map(v => `<label class="case"><input type="checkbox" name="favori-${v}"
      ${o.favoris.includes(v) ? 'checked' : ''}> ${ICONES_ONGLETS[v]} ${esc((o.noms[v] || '').trim() || NOMS_ONGLETS[v])}</label>`).join('')}</div>
    <h4>Onglets affichés</h4>`;
}
