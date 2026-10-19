'use strict';
// 🔒 Verrouillage automatique : après quelques minutes sans toucher l'appli (durée réglable, propre à chaque appareil),
// un écran masque tout ; on le lève avec le mot de passe du carnet. Il est vérifié avec son « témoin » (empreinte à sens
// unique gardée sur l'appareil) : le mot de passe lui-même n'est jamais stocké.
// Verrouille aussi au lancement si l'appli est restée fermée plus longtemps que la durée choisie.
// C'est un garde-fou d'écran (élève ou collègue devant la tablette), pas un chiffrement des données de l'appareil.
// (Fichier chargé avant app.js : il n'utilise les outils d'app.js qu'au moment des appels.)

const CLE_VERROU = 'carnet-eps-verrou', CLE_ACTIVITE = 'carnet-eps-activite';
const DUREES_VERROU = [[0, 'Jamais'], [2, '2 minutes'], [5, '5 minutes'], [10, '10 minutes'], [15, '15 minutes'], [30, '30 minutes'], [60, '1 heure']];
const VERROU_DEFAUT = { minutes: 10, chrono: true };

function reglageVerrou() {
  try { return { ...VERROU_DEFAUT, ...JSON.parse(localStorage.getItem(CLE_VERROU)) }; } catch { return { ...VERROU_DEFAUT }; }
}
function sauverReglageVerrou(r) {
  try { localStorage.setItem(CLE_VERROU, JSON.stringify(r)); } catch { /* sans importance */ }
}
// Possible seulement si cet appareil connaît le mot de passe du carnet (après un premier enregistrement ou une récupération).
const verrouPossible = () => !!Donnees.meta().temoinMdp;

let derniereActivite = Date.now(), activiteNotee = 0, verrouille = false, essaisVerrou = 0, attenteVerrou = 0;

function noterActivite() {
  if (verrouille) return;
  derniereActivite = Date.now();
  // (Gardée aussi sur l'appareil, au plus toutes les 5 s : sert au verrouillage au lancement.)
  if (derniereActivite - activiteNotee > 5000) {
    activiteNotee = derniereActivite;
    try { localStorage.setItem(CLE_ACTIVITE, String(derniereActivite)); } catch { /* sans importance */ }
  }
}
for (const ev of ['pointerdown', 'keydown', 'wheel', 'touchstart']) document.addEventListener(ev, noterActivite, { capture: true, passive: true });

// Faut-il verrouiller maintenant ?
function verrouDu(depuis = derniereActivite) {
  const r = reglageVerrou();
  if (!r.minutes || verrouille || !verrouPossible()) return false;
  if (typeof enModeEleve === 'function' && enModeEleve()) return false; // tablette prêtée : le mode élève a son propre code
  if (r.chrono && typeof minuteursActifs === 'function' && minuteursActifs()) return false; // chrono en cours (piscine, piste…)
  return Date.now() - depuis >= r.minutes * 60000;
}

setInterval(() => {
  try { majBoutonVerrou(); if (verrouDu()) verrouiller(); } catch { /* carnet pas encore chargé */ }
}, 10000);
// Tablette sortie de veille, onglet retrouvé : on vérifie tout de suite.
document.addEventListener('visibilitychange', () => { if (!document.hidden && verrouDu()) verrouiller(); });

// Au lancement : l'appli fermée depuis plus longtemps que la durée choisie se rouvre verrouillée.
function verifierVerrouDemarrage() {
  let avant = 0;
  try { avant = +localStorage.getItem(CLE_ACTIVITE) || 0; } catch { /* sans importance */ }
  if (avant && verrouDu(avant)) verrouiller();
  else noterActivite();
  majBoutonVerrou();
}

function majBoutonVerrou() {
  const b = document.getElementById('btn-verrou');
  if (b) b.hidden = !verrouPossible() || (typeof enModeEleve === 'function' && enModeEleve());
}

/* ---------- Écran verrouillé ---------- */

let dialogueVerrou = null;
function verrouiller() {
  if (verrouille || !verrouPossible()) return;
  verrouille = true;
  // Le mot de passe gardé en mémoire pour la clé est oublié : il faudra le retaper.
  if (typeof mdpSession !== 'undefined') mdpSession = null;
  // Vidéo-delay ouvert : caméra coupée, images effacées.
  if (typeof arreterVideo === 'function' && (vd.flux || vd.images.length || vd.deverrouille)) { arreterVideo(); if (ui.vue === 'outils') rendreOutil(); }
  document.activeElement?.blur?.();
  const d = document.createElement('dialog');
  d.className = 'ecran-verrou';
  d.innerHTML = `<form class="carte-verrou">
      <div class="icone-verrou" aria-hidden="true">🔒</div>
      <h2>Carnet verrouillé</h2>
      <p class="aide">Tape le mot de passe du carnet pour continuer.</p>
      <input type="password" name="mdp" autocomplete="current-password" required aria-label="Mot de passe du carnet" placeholder="Mot de passe">
      <p class="erreur-verrou" role="alert" hidden></p>
      <button class="primaire gros" type="submit">Déverrouiller</button>
    </form>`;
  document.body.append(d);
  d.addEventListener('cancel', e => e.preventDefault()); // Échap ne ferme pas l'écran
  $('form', d).addEventListener('submit', e => { e.preventDefault(); deverrouiller(d); });
  d.showModal();
  dialogueVerrou = d;
  suivreZoneVisible(true);
  $('[name="mdp"]', d).focus();
}

// Tablette : quand le clavier s'ouvre, la carte reste centrée dans la partie de l'écran encore visible.
function caleVerrou() {
  const v = window.visualViewport, d = dialogueVerrou;
  if (!v || !d) return;
  d.style.top = Math.round(v.offsetTop) + 'px';
  d.style.height = Math.round(v.height) + 'px';
  d.style.bottom = 'auto';
}
function suivreZoneVisible(oui) {
  const v = window.visualViewport;
  if (!v) return;
  for (const ev of ['resize', 'scroll']) v[oui ? 'addEventListener' : 'removeEventListener'](ev, caleVerrou);
  if (oui) caleVerrou();
}

async function deverrouiller(d) {
  const champ = $('[name="mdp"]', d), erreur = $('.erreur-verrou', d), bouton = $('button', d);
  const dire = t => { erreur.textContent = t; erreur.hidden = !t; };
  if (Date.now() < attenteVerrou) return dire(`Trop d’essais : attends ${Math.ceil((attenteVerrou - Date.now()) / 1000)} s.`);
  bouton.disabled = true;
  dire('');
  let ok = false;
  try { ok = await Cle.verifierTemoin(champ.value, Donnees.meta().temoinMdp); } catch { ok = false; }
  bouton.disabled = false;
  if (!ok) {
    essaisVerrou++;
    champ.value = '';
    champ.focus();
    if (essaisVerrou >= 5) { attenteVerrou = Date.now() + 30000; essaisVerrou = 0; return dire('Trop d’essais : attends 30 s.'); }
    return dire('Ce n’est pas le mot de passe du carnet.');
  }
  // Bon mot de passe : on le garde pour la session (enregistrer sur la clé ne le redemandera pas).
  if (typeof mdpSession !== 'undefined') mdpSession = champ.value;
  essaisVerrou = 0;
  verrouille = false;
  suivreZoneVisible(false);
  dialogueVerrou = null;
  d.close();
  d.remove();
  noterActivite();
  // Ordinateur, dossier déjà autorisé : le carnet est récupéré tout seul (enregistrement.js).
  if (typeof recupererAuto === 'function') recupererAuto();
}

// Une fenêtre qui s'ouvre pendant le verrouillage passe sous l'écran verrouillé (appelé par ouvrirModale).
function remonterVerrou() {
  if (!verrouille || !dialogueVerrou) return;
  dialogueVerrou.close();
  dialogueVerrou.showModal();
  $('[name="mdp"]', dialogueVerrou)?.focus();
}

/* ---------- Réglages (⚙ › 🔒 Sécurité) : propres à cet appareil, enregistrés tout de suite ---------- */

function htmlReglageVerrou() {
  const r = reglageVerrou();
  return `<h4>Verrouillage automatique</h4>
    ${verrouPossible() ? '' : '<p class="aide">⚠ Pour l’activer, cet appareil doit d’abord connaître le mot de passe du carnet : fais une fois « Enregistrer sur la clé » ou « Récupérer depuis la clé ».</p>'}
    <div class="ligne">
      <label>Verrouiller après<select data-verrou-minutes>${DUREES_VERROU.map(([m, nom]) => `<option value="${m}" ${r.minutes === m ? 'selected' : ''}>${m ? nom + ' sans activité' : 'Jamais (désactivé)'}</option>`).join('')}</select></label>
    </div>
    <label class="case"><input type="checkbox" data-verrou-chrono ${r.chrono ? 'checked' : ''}><span>Pas pendant qu’un chrono ou un minuteur tourne (Outils)</span></label>
    <p class="aide">Pour cet appareil seulement, enregistré tout de suite. L’écran se débloque avec le mot de passe du carnet ;
      le bouton 🔒 en haut verrouille à la demande. C’est un écran de protection : il ne chiffre pas les données de l’appareil.</p>`;
}

document.addEventListener('change', e => {
  const t = e.target;
  if (t.matches?.('[data-verrou-minutes]')) { sauverReglageVerrou({ ...reglageVerrou(), minutes: +t.value }); noterActivite(); toast('Verrouillage : ' + DUREES_VERROU.find(([m]) => m === +t.value)[1].toLowerCase(), 'ok'); }
  if (t.matches?.('[data-verrou-chrono]')) sauverReglageVerrou({ ...reglageVerrou(), chrono: t.checked });
});

document.addEventListener('click', e => {
  if (!e.target.closest?.('#btn-verrou')) return;
  if (!verrouPossible()) return toast('Enregistre d’abord une fois sur la clé : l’appareil connaîtra le mot de passe du carnet.', 'erreur');
  verrouiller();
});
