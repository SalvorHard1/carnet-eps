'use strict';
/* ---------- 🎨 Apparence et personnalisation (⚙ Réglages) : la partie « poussée » ----------
   Ambiance (fond, panneaux, texte, bordures, en clair et en sombre), forme des coins, police,
   taille des boutons (propre à cet appareil), ordre / affichage / noms des onglets.
   Fiche `perso` du carnet (elle suit le prof sur la clé) ; l'ordre des onglets est dans la fiche `onglets`.
   Les couleurs sont posées en variables CSS sur <html> par script (la CSP interdit les styles écrits dans la page).
   (Chargé après reglages.js, avant app.js.) */

const COULEURS_PERSO = {
  fond: 'Fond de la page', surface: 'Panneaux et fenêtres', surface2: 'Zones et cases',
  texte: 'Texte', texte2: 'Texte secondaire', bord: 'Bordures',
};
// (origine : les couleurs de style.css, à garder identiques.)
const AMBIANCES = {
  origine: { nom: 'D’origine',
    clair: { fond: '#f3f6f5', surface: '#ffffff', surface2: '#eaf0ee', texte: '#1b2422', texte2: '#5b6a66', bord: '#d3dcd9' },
    sombre: { fond: '#111715', surface: '#1a2220', surface2: '#222c29', texte: '#e5ecea', texte2: '#9aaaa5', bord: '#33403c' } },
  contraste: { nom: 'Contraste fort', aide: 'au gymnase, en plein soleil',
    clair: { fond: '#ffffff', surface: '#ffffff', surface2: '#eef1f0', texte: '#000000', texte2: '#2e3634', bord: '#6b7a76' },
    sombre: { fond: '#000000', surface: '#0d0f0e', surface2: '#1c201f', texte: '#ffffff', texte2: '#d0d8d5', bord: '#8a9894' } },
  papier: { nom: 'Papier', aide: 'tons chauds',
    clair: { fond: '#f6f1e7', surface: '#fffdf8', surface2: '#efe7d8', texte: '#2b241b', texte2: '#6e6253', bord: '#ddd2bf' },
    sombre: { fond: '#1a1712', surface: '#24201a', surface2: '#2e2921', texte: '#efe7da', texte2: '#b3a792', bord: '#463e32' } },
  ardoise: { nom: 'Ardoise', aide: 'gris-bleu',
    clair: { fond: '#eef1f5', surface: '#ffffff', surface2: '#e3e8ef', texte: '#1a222c', texte2: '#566273', bord: '#cdd5df' },
    sombre: { fond: '#12161c', surface: '#1b212a', surface2: '#242c37', texte: '#e3e9f0', texte2: '#9aa6b5', bord: '#354150' } },
};
const ARRONDIS = { carre: ['▢ Carrés', 0.3], normal: ['▢ Arrondis', 1], rond: ['◯ Très arrondis', 1.8] };
const POLICES_APPLI = {
  systeme: ['Standard', ''],
  lisible: ['Très lisible', 'Verdana, "DejaVu Sans", Tahoma, sans-serif'],
  ecole: ['Écriture d’école', '"Comic Sans MS", "Chalkboard SE", "Comic Neue", sans-serif'],
  classique: ['Classique', 'Georgia, "Times New Roman", serif'],
};
const TAILLES_BOUTONS = { normale: ['Normale', 1], grande: ['Grande', 1.15], 'tres-grande': ['Très grande', 1.3] };

// Couleurs d'un mode ('clair' | 'sombre') : celles de l'ambiance, puis celles d'une ancienne fiche (couleurs une à une, plus proposées depuis la v1.4.2).
const couleursPerso = (p, mode) => ({
  ...(AMBIANCES[p.ambiance] || AMBIANCES.origine)[mode],
  ...Object.fromEntries(Object.entries(p[mode] || {}).filter(([k, c]) => COULEURS_PERSO[k] && estCouleur(c))),
});

// Appelée par appliquerApparence (aperçu en direct compris).
function appliquerPerso(p, sombre, boutons) {
  const r = document.documentElement, mode = sombre ? 'sombre' : 'clair';
  const origine = AMBIANCES.origine[mode], c = couleursPerso(p, mode);
  // (Couleur d'origine : on laisse faire la feuille de style.)
  for (const k of Object.keys(COULEURS_PERSO)) {
    if (c[k] !== origine[k]) r.style.setProperty('--' + k, c[k]); else r.style.removeProperty('--' + k);
  }
  r.style.setProperty('--arrondi', (ARRONDIS[p.arrondi] || ARRONDIS.normal)[1]);
  r.style.setProperty('--boutons', (TAILLES_BOUTONS[boutons] || TAILLES_BOUTONS.normale)[1]);
  const police = (POLICES_APPLI[p.police] || POLICES_APPLI.systeme)[1];
  if (police) r.style.setProperty('--police', police); else r.style.removeProperty('--police');
}

// Au chargement, avant la lecture du carnet : dernière personnalisation connue sur cet appareil (voir appliquerApparence).
(() => {
  try {
    const memo = JSON.parse(localStorage.getItem('carnet-eps-apparence'));
    if (!memo?.p) return;
    const a = { ...REGLAGES_DEFAUT.apparence, ...memo.a };
    appliquerPerso({ ...REGLAGES_DEFAUT.perso, ...memo.p }, a.mode === 'sombre' || (a.mode !== 'clair' && matchMedia('(prefers-color-scheme: dark)').matches),
      memo.appareil?.boutons);
  } catch { /* première fois : couleurs d'origine */ }
})();

// Mode automatique : l'appareil passe en sombre (le soir…) → les couleurs choisies pour ce mode.
{
  const mq = matchMedia('(prefers-color-scheme: dark)');
  const suivre = () => { if (window.appliPrete) appliquerReglages(true); };
  if (mq.addEventListener) mq.addEventListener('change', suivre); else mq.addListener(suivre);
}

/* ---------- Ordre des onglets ---------- */

// Tous les onglets, dans l'ordre choisi (ceux que l'ordre enregistré ne connaît pas, à leur place d'origine, à la fin).
function ordreOnglets() {
  const tous = Object.keys(NOMS_ONGLETS), choisi = (reglage('onglets').ordre || []).filter(v => tous.includes(v));
  return [...new Set([...choisi, ...tous])];
}
// Barre du haut (grand écran) : les boutons suivent l'ordre choisi.
function rangerOnglets() {
  const nav = document.getElementById('onglets');
  if (!nav) return;
  for (const v of ordreOnglets()) { const b = nav.querySelector(`:scope > [data-vue="${v}"]`); if (b) nav.appendChild(b); }
}

/* ---------- Fenêtre des réglages ---------- */

const ligneOngletPerso = (v, o) => {
  const nom = NOMS_ONGLETS[v];
  return `<div class="ligne-onglet-perso" data-onglet-perso="${v}">
    <span class="fleches-perso">
      <button type="button" data-onglet-monter aria-label="Monter ${esc(nom)}" title="Monter">▲</button>
      <button type="button" data-onglet-descendre aria-label="Descendre ${esc(nom)}" title="Descendre">▼</button>
    </span>
    <label class="case"><input type="checkbox" name="onglet-${v}" ${o.masques.includes(v) ? '' : 'checked'}> ${ICONES_ONGLETS[v] || ''} ${esc(nom)}</label>
    <input name="nom-${v}" value="${esc(o.noms[v] || '')}" placeholder="${esc(nom)}" aria-label="Nom de l’onglet ${esc(nom)}" maxlength="16">
  </div>`;
};

// (Morceaux de la rubrique 🎨 Apparence et personnalisation, assemblée dans reglages.js.)
function htmlCouleursPerso(p) {
  const ambiance = AMBIANCES[p.ambiance] ? p.ambiance : 'origine';
  return `
    <h4>Ambiance</h4>
    <div class="segments">${Object.entries(AMBIANCES).map(([id, x]) => radio('ambiance', id, ambiance, esc(x.nom))).join('')}</div>
    <p class="aide">${Object.values(AMBIANCES).filter(x => x.aide).map(x => `<b>${esc(x.nom)}</b> : ${esc(x.aide)}`).join(' · ')}.</p>`;
}

function htmlFormesPerso(p, appareil) {
  return `
    <h4>Coins des boutons et des cadres</h4>
    <div class="segments">${Object.entries(ARRONDIS).map(([id, [nom]]) => radio('arrondi', id, ARRONDIS[p.arrondi] ? p.arrondi : 'normal', nom)).join('')}</div>
    <h4>Police</h4>
    <div class="segments">${Object.entries(POLICES_APPLI).map(([id, [nom, f]]) => radio('police', id, POLICES_APPLI[p.police] ? p.police : 'systeme',
      `<i class="apercu-police" data-police-apercu="${esc(f)}">${nom}</i>`)).join('')}</div>
    <h4>Taille des boutons <span class="appareil">— sur cet appareil</span></h4>
    <div class="segments">${Object.entries(TAILLES_BOUTONS).map(([id, [nom]]) => radio('boutons', id, appareil.boutons, nom)).join('')}</div>
    <p class="aide">Grande ou très grande : plus facile à toucher sur tablette, en cours.</p>`;
}

function htmlOngletsPerso(o) {
  return `
    <h4>Ordre, affichage, noms</h4>
    <p class="aide">▲ ▼ pour changer l’ordre ; décoche un onglet pour le masquer (ses données sont gardées) ; tu peux aussi le renommer.</p>
    <div class="liste-onglets-perso" data-liste-onglets>${ordreOnglets().map(v => ligneOngletPerso(v, o)).join('')}</div>
    <input type="hidden" name="ordreOnglets" value="${ordreOnglets().join(',')}">`;
}

// Lit la personnalisation dans le formulaire. (Plus de couleurs choisies une à une depuis la v1.4.2 :
// une ancienne fiche qui en a encore les perd au prochain enregistrement.)
function lirePerso(form, base) {
  const coche = n => form.querySelector(`[name="${n}"]:checked`)?.value;
  return { ...base, ambiance: AMBIANCES[coche('ambiance')] ? coche('ambiance') : 'origine', clair: {}, sombre: {},
    arrondi: ARRONDIS[coche('arrondi')] ? coche('arrondi') : 'normal',
    police: POLICES_APPLI[coche('police')] ? coche('police') : 'systeme' };
}

// Branche la rubrique dans la fenêtre des réglages (apercu : redessine l'aperçu en direct).
function brancherReglagePerso(d, form, apercu) {
  d.querySelectorAll('[data-police-apercu]').forEach(s => { if (s.dataset.policeApercu) s.style.fontFamily = s.dataset.policeApercu; });
  const zone = $('[data-liste-onglets]', d);
  zone.addEventListener('click', e => {
    const b = e.target.closest('[data-onglet-monter], [data-onglet-descendre]');
    if (!b) return;
    const ligne = b.closest('[data-onglet-perso]');
    const voisin = b.matches('[data-onglet-monter]') ? ligne.previousElementSibling : ligne.nextElementSibling;
    if (!voisin) return;
    if (b.matches('[data-onglet-monter]')) zone.insertBefore(ligne, voisin); else zone.insertBefore(voisin, ligne);
    form.elements.ordreOnglets.value = [...zone.children].map(x => x.dataset.ongletPerso).join(',');
    b.focus(); // (pour enchaîner ▲ ▲ ▲ au clavier ou au doigt)
  });
}

// Nettoyage d'un fichier de réglages importé (voir nettoyerReglage).
function nettoyerPerso(propre) {
  if (propre.ambiance && !AMBIANCES[propre.ambiance]) delete propre.ambiance;
  for (const mode of ['clair', 'sombre']) {
    if (propre[mode]) propre[mode] = Object.fromEntries(Object.entries(propre[mode]).filter(([k, c]) => COULEURS_PERSO[k] && estCouleur(c)));
  }
  if (propre.arrondi && !ARRONDIS[propre.arrondi]) delete propre.arrondi;
  if (propre.police && !POLICES_APPLI[propre.police]) delete propre.police;
  return propre;
}
