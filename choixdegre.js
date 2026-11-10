/* ---------- Choisir un degré d'un seul geste (Notes et Leçons) ----------
   Rester appuyé sur une case de degré affiche les 4 degrés au-dessus de la case, et en dessous les statuts
   (dispensé, absent, malade, blessé) avec « Vide » : glisser vers l'un d'eux et relâcher.
   Relâcher sans bouger : tout reste affiché, on touche ce qu'on veut. Relâcher ailleurs : rien ne change.
   Le toucher court (degré suivant) et le clavier (1 à 4) ne changent pas. Le doigt qui bouge avant la fin
   de l'appui fait défiler le tableau, comme d'habitude. */

const APPUI_DEGRE = 300; // ms
const SEUIL_BOUGE_DEGRE = 10; // px
const CASES_DEGRE = '#vue [data-niveau], #vue [data-degre-bareme], #vue [data-niveau-ent]:not([data-medaille])';
const STATUTS_APPUI = ['DISP', 'ABS', 'MAL', 'BLE']; // dans l'ordre affiché, sous la case

let appuiDegre = null;     // { bouton, pointeur, x0, y0, minuteur, ouvert, glisse, bouge }
let clicDegreAvale = 0;    // heure du dernier geste : le « clic » qui le suit ne doit pas changer de degré
let toucherFermeDegre = false; // le toucher qui ferme les degrés ne doit rien faire d'autre

// Même chemin que les touches 1 à 4 du clavier, selon la sorte de case.
function poserDegre(bouton, valeur) {
  if (bouton.dataset.degreBareme !== undefined) lancer(() => saisieBoutonBareme(bouton, valeur));
  else if (bouton.dataset.niveauEnt !== undefined) changerEchelleEnt(bouton, valeur);
  else changerNiveau(bouton, valeur);
}

// Statut (ABS, DISP…) ou case vidée : même chemin que la barre de codes, selon la sorte de case.
function poserStatutAppui(bouton, code) {
  if (bouton.dataset.niveauEnt !== undefined) return appliquerStatutEnt(bouton, code); // Leçons : la séance ou cette case
  lancer(() => poserCodeCaseNotes(bouton, code)); // Notes : toute l'évaluation
}

// Statuts proposés : ceux de la discipline (ou ajoutés dans ⚙ Réglages › Notes), pas ceux qu'on a masqués.
const statutsAppui = () => STATUTS_APPUI.filter(c => typeof codeVisible !== 'function' || codeVisible(reglage('notes'), c));

function panneauDegres() {
  let p = $('#choix-degre');
  if (!p) {
    p = document.createElement('div');
    p.id = 'choix-degre';
    p.hidden = true;
    p.innerHTML = `<div class="rangee-degres">${NIVEAUX_MAITRISE.map(n => `<button type="button" class="niveau n${n.v}" data-degre-choisi="${n.v}" aria-label="${esc(n.nom)}">
        <b>${n.v}</b><span>${esc(n.nom.replace(/^maîtrise\s+(.)/i, (_, l) => l.toLocaleUpperCase('fr')))}</span></button>`).join('')}</div>
      <div class="rangee-statuts"></div>`;
    p.addEventListener('click', e => {
      const o = e.target.closest('[data-degre-choisi], [data-statut-choisi]');
      if (o && appuiDegre?.ouvert) choisirDegre(o);
    });
    document.body.append(p);
  }
  // (Les statuts suivent les réglages : refaits à chaque affichage.)
  p.querySelector('.rangee-statuts').innerHTML = statutsAppui().map(c => `<button type="button" class="niveau statut-appui code-${c}" data-statut-choisi="${c}">
      <b>${LETTRES_CODES[c] || c}</b><span>${esc(CODES[c])}</span></button>`).join('')
    + '<button type="button" class="niveau degre-vider" data-statut-choisi="" aria-label="Vider la case"><b>✕</b><span>Vide</span></button>';
  return p;
}

function afficherDegres(bouton) {
  const p = panneauDegres(), actuel = bouton.className.match(/\bn([1-4])\b/)?.[1] || '';
  const statut = bouton.className.match(/\bcode-([A-Z]+)\b/)?.[1] || '';
  p.querySelectorAll('[data-degre-choisi]').forEach(o => {
    o.classList.remove('vise');
    o.classList.toggle('actuel', actuel !== '' && o.dataset.degreChoisi === actuel);
  });
  p.querySelectorAll('[data-statut-choisi]').forEach(o => o.classList.toggle('actuel', statut !== '' && o.dataset.statutChoisi === statut));
  p.hidden = false;
  bouton.classList.add('degre-appuye');
  // Degrés au-dessus de la case, statuts en dessous (on glisse vers le bas) ; toujours dans l'écran.
  const degres = p.querySelector('.rangee-degres'), statuts = p.querySelector('.rangee-statuts');
  const r = bouton.getBoundingClientRect(), marge = 6, ecart = 8, H = window.innerHeight, L = document.documentElement.clientWidth;
  const centrer = el => { el.style.left = Math.max(marge, Math.min(r.left + r.width / 2 - el.offsetWidth / 2, L - el.offsetWidth - marge)) + 'px'; };
  centrer(degres); centrer(statuts);
  const hd = degres.offsetHeight, hs = statuts.offsetHeight;
  let hautDegres = r.top - hd - ecart, hautStatuts = r.bottom + ecart;
  if (hautDegres < marge) { hautDegres = r.bottom + ecart; hautStatuts = hautDegres + hd + 6; } // case tout en haut : les deux dessous
  degres.style.top = hautDegres + 'px';
  statuts.style.top = Math.min(hautStatuts, H - hs - marge) + 'px';
}

function fermerDegres() {
  if (!appuiDegre) return;
  clearTimeout(appuiDegre.minuteur);
  appuiDegre.bouton.classList.remove('degre-appuye');
  appuiDegre = null;
  const p = $('#choix-degre');
  if (p) p.hidden = true;
}

function choisirDegre(option) {
  const { bouton } = appuiDegre;
  fermerDegres();
  if (!bouton.isConnected) return;
  if (option.dataset.statutChoisi !== undefined) poserStatutAppui(bouton, option.dataset.statutChoisi);
  else poserDegre(bouton, option.dataset.degreChoisi);
}

const optionDegreSous = e => document.elementFromPoint(e.clientX, e.clientY)?.closest?.('#choix-degre :is([data-degre-choisi], [data-statut-choisi])');

document.addEventListener('pointerdown', e => {
  // Degrés déjà affichés : toucher à côté les ferme, sans rien changer d'autre.
  if (appuiDegre?.ouvert) {
    if (e.target.closest?.('#choix-degre')) return;
    fermerDegres();
    toucherFermeDegre = true;
    return;
  }
  fermerDegres();
  const bouton = e.target.closest?.(CASES_DEGRE);
  if (!bouton || e.button > 0 || !e.isPrimary) return;
  appuiDegre = { bouton, pointeur: e.pointerId, x0: e.clientX, y0: e.clientY, ouvert: false, glisse: false, bouge: false };
  appuiDegre.minuteur = setTimeout(() => {
    if (!bouton.isConnected) return fermerDegres();
    appuiDegre.ouvert = appuiDegre.glisse = true;
    afficherDegres(bouton);
    navigator.vibrate?.(30); // petit retour sur tablette Android
  }, APPUI_DEGRE);
}, true);

document.addEventListener('pointermove', e => {
  const a = appuiDegre;
  if (!a || e.pointerId !== a.pointeur) return;
  const loin = Math.hypot(e.clientX - a.x0, e.clientY - a.y0) > SEUIL_BOUGE_DEGRE;
  if (!a.ouvert) { if (loin) fermerDegres(); return; } // c'est un défilement, pas un appui
  if (!a.glisse) return;
  if (loin) a.bouge = true;
  const sous = optionDegreSous(e);
  $('#choix-degre').querySelectorAll('.vise').forEach(o => { if (o !== sous) o.classList.remove('vise'); });
  sous?.classList.add('vise');
});

document.addEventListener('pointerup', e => {
  if (toucherFermeDegre) { toucherFermeDegre = false; clicDegreAvale = Date.now(); return; }
  const a = appuiDegre;
  if (!a || e.pointerId !== a.pointeur) return;
  if (!a.ouvert) return fermerDegres(); // toucher court : le clic habituel fait avancer le degré
  if (!a.glisse) return; // (degrés restés affichés : ce toucher vise un degré, voir le clic du panneau)
  clicDegreAvale = Date.now();
  const option = optionDegreSous(e);
  // (Sans glisser, rien n'est choisi : en bas de l'écran, les statuts peuvent se trouver sous le doigt.)
  if (option && a.bouge) return choisirDegre(option);
  if (a.bouge) return fermerDegres(); // relâché ailleurs : rien ne change
  a.glisse = false; // relâché sans bouger : les degrés restent affichés
  $('#choix-degre').querySelectorAll('.vise').forEach(o => o.classList.remove('vise'));
});

document.addEventListener('pointercancel', e => {
  toucherFermeDegre = false;
  if (appuiDegre?.pointeur === e.pointerId && (!appuiDegre.ouvert || appuiDegre.glisse)) fermerDegres();
});

// Le clic qui suit le geste ne doit pas faire avancer le degré (les autres écouteurs passent après celui-ci).
window.addEventListener('click', e => {
  if (Date.now() - clicDegreAvale < 400 && !e.target.closest?.('#choix-degre')) { e.stopPropagation(); e.preventDefault(); }
}, true);

// Pendant le glissement, le doigt ne fait pas défiler le tableau.
document.addEventListener('touchmove', e => { if (appuiDegre?.glisse && e.cancelable) e.preventDefault(); }, { passive: false });
// Pas de menu « copier / sélectionner » sur l'appui long.
document.addEventListener('contextmenu', e => {
  if (appuiDegre || Date.now() - clicDegreAvale < 800) e.preventDefault();
}, true);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && appuiDegre?.ouvert) { e.stopPropagation(); fermerDegres(); }
}, true);
// Le tableau bouge (molette, ascenseur) : les degrés ne seraient plus en face de leur case.
window.addEventListener('scroll', () => { if (appuiDegre?.ouvert && !appuiDegre.glisse) fermerDegres(); }, true);
window.addEventListener('resize', () => { if (appuiDegre?.ouvert) fermerDegres(); });
