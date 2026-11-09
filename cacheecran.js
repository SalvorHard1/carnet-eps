'use strict';
// 🛡 Cacher les infos sensibles (bouton de la barre, F8) : PAI, BEP, dispenses, pratique adaptée, alertes, remarques et
// observations disparaissent de l'écran, le reste du carnet reste utilisable (écran projeté, élève à côté…).
// Rien n'est effacé. Ce n'est qu'un affichage : la classe `infos-cachees` du body et les règles de style.css
// (section « Cacher les infos sensibles ») font le travail ; à compléter si un nouvel écran montre ces infos.
// Propre à cet onglet du navigateur : un rechargement ne réaffiche rien.
// (Fichier chargé avant app.js : il n'utilise les outils d'app.js qu'au moment des appels.)

const CLE_INFOS_CACHEES = 'carnet-eps-infos-cachees';
const infosCachees = () => document.body.classList.contains('infos-cachees');

function afficherEtatInfosCachees() {
  const b = document.getElementById('btn-cache-ecran'), cache = infosCachees();
  if (!b) return;
  b.classList.toggle('actif', cache);
  b.setAttribute('aria-pressed', String(cache));
  b.title = cache ? 'Infos sensibles cachées : réafficher (F8)' : 'Cacher les infos sensibles (F8)';
}

function basculerInfosCachees() {
  if (typeof enModeEleve === 'function' && enModeEleve()) return; // le mode élève ne les montre déjà pas
  const cache = document.body.classList.toggle('infos-cachees');
  try { if (cache) sessionStorage.setItem(CLE_INFOS_CACHEES, '1'); else sessionStorage.removeItem(CLE_INFOS_CACHEES); } catch { /* sans importance */ }
  afficherEtatInfosCachees();
  // Un filtre « PAI / BEP », « Dispensés »… resté actif désignerait ces élèves.
  if (cache && typeof ui === 'object' && ['dispenses', 'adaptes', 'besoins', 'alertes'].includes(ui.filtreEleves)) ui.filtreEleves = 'tous';
  // Nouveau dessin : les bulles d'aide au survol (qui peuvent citer un PAI) suivent.
  if (typeof rendre === 'function') lancer(rendre);
  if (typeof toast === 'function') toast(cache ? '🛡 Infos sensibles cachées' : 'Infos sensibles réaffichées', 'ok', 2000);
}

window.addEventListener('keydown', e => {
  if (e.key !== 'F8') return;
  e.preventDefault();
  if (!e.repeat) basculerInfosCachees();
}, true);

document.getElementById('btn-cache-ecran')?.addEventListener('click', basculerInfosCachees);
try { if (sessionStorage.getItem(CLE_INFOS_CACHEES)) document.body.classList.add('infos-cachees'); } catch { /* sans importance */ }
afficherEtatInfosCachees();
