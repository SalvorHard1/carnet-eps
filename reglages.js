'use strict';
// Réglages du carnet (bouton « ⚙ Réglages du carnet ») : apparence, établissement, notes, compétences, onglets, partage.
// Ils sont enregistrés dans le carnet (collection `reglages`, fiches apparence / notes / competences / onglets ;
// la fiche periodes est gérée par app.js) : ils suivent donc le prof sur la clé, d'un appareil à l'autre,
// et chaque utilisateur de l'appli a les siens. Seules la taille du texte et la densité sont propres à chaque appareil.
// (Fichier chargé avant app.js : il n'utilise les outils d'app.js qu'au moment des appels.)

const THEMES = {
  vert: { nom: 'Vert', clair: '#1f6f5c', sombre: '#3ea488' },
  bleu: { nom: 'Bleu', clair: '#1f5f9e', sombre: '#5aa2e6' },
  turquoise: { nom: 'Turquoise', clair: '#0f6670', sombre: '#4cc3cc' },
  violet: { nom: 'Violet', clair: '#5b3fa0', sombre: '#a58be0' },
  framboise: { nom: 'Framboise', clair: '#a3306e', sombre: '#e88cc0' },
  bordeaux: { nom: 'Bordeaux', clair: '#9e2a3a', sombre: '#e87a88' },
  orange: { nom: 'Orange', clair: '#a84b0c', sombre: '#f0a35a' },
  anthracite: { nom: 'Anthracite', clair: '#3d4a52', sombre: '#9fb0ba' },
};
const PALETTES_DEGRES = {
  classique: { nom: 'Classique (rouge → vert)', couleurs: ['#d62828', '#f28c18', '#6dbb3f', '#1b7a3d'] },
  daltonien: { nom: 'Lisible par les daltoniens (orange → bleu)', couleurs: ['#d55e00', '#e69f00', '#56b4e9', '#0b5fa5'] },
};
const COULEURS_CA = { CA1: '#d64545', CA2: '#2e9e5b', CA3: '#8e5bd0', CA4: '#2f78d6', CA5: '#e8891a' };
// (L'onglet des séances porte le nom que lui donne la discipline : « Leçons » en EPS.)
const NOMS_ONGLETS = { eleves: 'Élèves', appel: 'Appel', notes: 'Notes', get entrainement() { return mot('lecons'); }, outils: 'Outils', agenda: 'Agenda', baremes: 'Barèmes', pp: 'Prof principal' };
// Codes de la barre de saisie rapide (ceux des notes, puis ceux des leçons).
const CODES_SAISIE = { ABS: 'Absent', DISP: 'Dispensé', NE: 'Non noté', BLE: 'Blessé', MAL: 'Malade', AUT: 'Autre', NR: 'Non rendu' };
const TAILLES_TEXTE = { petite: ['Petite', 0.9], normale: ['Normale', 1], grande: ['Grande', 1.12], 'tres-grande': ['Très grande', 1.25] };
const DENSITES = { compacte: 'Compacte', normale: 'Normale', aeree: 'Aérée' };

const REGLAGES_DEFAUT = {
  apparence: {
    theme: 'vert', couleurLibre: '#1f6f5c', mode: 'auto', palette: 'classique', degres: PALETTES_DEGRES.classique.couleurs,
    ca: COULEURS_CA, etablissement: 'S-A', prof: '',
  },
  notes: { max: 20, coef: 1, seuils: [10, 14, 18], codesMasques: [], codesAjoutes: [], libelles: {}, alerte: true, alerteOrange: 2, alerteRouge: 3,
    alerteTenue: true, tenueOrange: 2, tenueRouge: 3 },
  competences: {
    niveaux: ['Maîtrise insuffisante', 'Maîtrise fragile', 'Maîtrise satisfaisante', 'Très bonne maîtrise'],
    masques: [], refsMasques: [], ajouts: [], refsPerso: [],
  },
  // (favoris : onglets de la barre en disposition « Favoris + Plus » sur tablette, voir onglets.js)
  onglets: { masques: [], noms: {}, demarrage: '', favoris: ['appel', 'notes', 'entrainement', 'outils'] },
  // Appréciations proposées par l'appli (appreciations.js) : rubriques abordées et leur ordre, ton, style, longueur.
  appreciations: {
    // Par défaut (choix de l'auteur) : attitude, compétences, motricité (performances, notes) et objectif ; les autres
    // rubriques reviennent d'elles-mêmes quand le carnet signale un point de vigilance (voir rubriquesAppr).
    ordre: ['attitude', 'competences', 'moteur', 'methodo', 'comportement', 'progression', 'objectif'],
    actives: ['attitude', 'competences', 'moteur', 'objectif'],
    bilan: true, ton: 'bienveillant', style: 'phrases', longueur: 300, // (400 jusqu'à la v0.93 : voir reglageAppr)
  },
  // Appréciation générale du professeur principal (pp.js) : mêmes principes, plus l'adresse (il / vous), les seuils
  // de la moyenne générale et les mentions proposées.
  pp: {
    ordre: ['resultats', 'travail', 'comportement', 'participation', 'progression', 'matieres', 'assiduite', 'objectif'],
    actives: ['resultats', 'travail', 'comportement', 'objectif'],
    bilan: true, adresse: 'il', ton: 'bienveillant', style: 'phrases', longueur: 300, seuils: [10, 13, 16],
    mentions: true, felicitations: 16, compliments: 14,
  },
  // Discipline du carnet (discipline.js). Jamais exportée avec les réglages partagés : chaque collègue garde la sienne.
  discipline: { code: 'eps' },
};
const FICHES_REGLAGES = Object.keys(REGLAGES_DEFAUT);

// Réglage complet : valeurs enregistrées par-dessus les valeurs d'origine.
function reglage(nom) {
  const enreg = typeof Donnees === 'object' ? Donnees.get('reglages', nom) : null;
  const res = structuredClone(REGLAGES_DEFAUT[nom]);
  for (const k of Object.keys(res)) if (enreg && enreg[k] !== undefined) res[k] = structuredClone(enreg[k]);
  return res;
}

// N'écrit que si quelque chose change (sinon le carnet serait marqué « à enregistrer » pour rien).
function ecrireReglage(nom, valeurs) {
  const avant = reglage(nom), apres = { ...avant, ...valeurs };
  if (JSON.stringify(avant) === JSON.stringify(apres)) return false;
  Donnees.ecrire('reglages', { ...Donnees.get('reglages', nom), id: nom, ...valeurs });
  return true;
}

const seuilsDefaut = () => reglage('notes').seuils;
// Bouton de la barre de saisie affiché : code de la discipline non décoché, ou code ajouté à la main dans les réglages.
const codeVisible = (n, code) => (codesDiscipline().includes(code) ? !n.codesMasques.includes(code) : (n.codesAjoutes || []).includes(code));
// (L'onglet « Prof principal » n'existe que si une classe est marquée « Je suis PP » : pp.js.)
const ongletsVisibles = () => Object.keys(NOMS_ONGLETS).filter(v => !reglage('onglets').masques.includes(v)
  && (v !== 'pp' || (typeof classesPP === 'function' && classesPP().length > 0)));

/* ---------- Couleurs ---------- */

const hexRvb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const rvbHex = r => '#' + r.map(x => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('');
const melanger = (a, b, part) => { const x = hexRvb(a), y = hexRvb(b); return rvbHex(x.map((v, i) => v * part + y[i] * (1 - part))); };
const luminance = h => {
  const [r, g, b] = hexRvb(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const estCouleur = c => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c);

// Couleur libre : on l'assombrit assez pour du texte blanc (mode clair) et on l'éclaircit pour le mode sombre.
function themeDe(a) {
  if (a.theme !== 'libre' || !estCouleur(a.couleurLibre)) return THEMES[a.theme] || THEMES.vert;
  let clair = a.couleurLibre, sombre = a.couleurLibre;
  for (let i = 0; i < 12 && luminance(clair) > 0.17; i++) clair = melanger(clair, '#000000', 0.85);
  for (let i = 0; i < 12 && luminance(sombre) < 0.3; i++) sombre = melanger(sombre, '#ffffff', 0.85);
  return { clair, sombre };
}

function variablesApparence(a) {
  const t = themeDe(a), v = {};
  if (t !== THEMES.vert) { // (vert : couleurs d'origine de la feuille de style)
    Object.assign(v, {
      '--accent-clair': t.clair, '--accent-sombre': t.sombre,
      '--accent-doux-clair': melanger(t.clair, '#ffffff', 0.15), '--accent-doux-sombre': melanger(t.sombre, '#1a2220', 0.22),
    });
  }
  a.degres.forEach((c, i) => { if (estCouleur(c)) v['--n' + (i + 1)] = c; });
  for (const [ca, c] of Object.entries(a.ca)) if (estCouleur(c) && COULEURS_CA[ca]) v['--' + ca.toLowerCase()] = c;
  return { v, mode: a.mode, clair: t.clair, sombre: t.sombre };
}

// Applique l'apparence ; `appareil` : { taille, densite } (propres à cet appareil).
function appliquerApparence(a, appareil, etablissement) {
  const r = document.documentElement, ap = variablesApparence(a);
  for (const p of ['--accent-clair', '--accent-sombre', '--accent-doux-clair', '--accent-doux-sombre', '--n1', '--n2', '--n3', '--n4',
    '--ca1', '--ca2', '--ca3', '--ca4', '--ca5']) {
    if (ap.v[p]) r.style.setProperty(p, ap.v[p]); else r.style.removeProperty(p);
  }
  if (a.mode === 'clair') r.dataset.theme = 'light';
  else if (a.mode === 'sombre') r.dataset.theme = 'dark';
  else delete r.dataset.theme;
  const sombre = a.mode === 'sombre' || (a.mode !== 'clair' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', sombre ? ap.sombre : ap.clair);
  r.style.setProperty('--zoom', (TAILLES_TEXTE[appareil.taille] || TAILLES_TEXTE.normale)[1]);
  if (DENSITES[appareil.densite] && appareil.densite !== 'normale') document.body.dataset.densite = appareil.densite;
  else delete document.body.dataset.densite;
  const etab = (etablissement ?? a.etablissement).trim();
  const titre = document.querySelector('.titre-etab');
  if (titre) titre.textContent = etab;
  const carnet = profil().carnet; // « Carnet EPS », ou le nom du carnet de la discipline
  const h1 = document.querySelector('header h1');
  if (h1?.firstChild?.nodeType === Node.TEXT_NODE) h1.firstChild.textContent = carnet + ' ';
  document.title = etab ? `${carnet} ${etab}` : carnet;
  // Copie pour le prochain lancement : la bonne couleur s'affiche tout de suite, avant même la lecture du carnet.
  try { localStorage.setItem('carnet-eps-apparence', JSON.stringify({ a, appareil })); } catch { /* sans importance */ }
}

// Au chargement de la page, avant la lecture du carnet : dernière apparence connue sur cet appareil.
(() => {
  try {
    const memo = JSON.parse(localStorage.getItem('carnet-eps-apparence'));
    if (memo?.a) appliquerApparence({ ...REGLAGES_DEFAUT.apparence, ...memo.a }, memo.appareil || {});
  } catch { /* première fois : couleurs d'origine */ }
})();

const reglagesAppareil = () => ({ taille: ui.taille || 'normale', densite: ui.densite || 'normale' });

/* ---------- Application de tous les réglages ---------- */

let signatureReglages = null;

// Appelée à chaque rendu : ne refait le travail que si un réglage a changé (ici ou venu d'un autre appareil).
function appliquerReglages(forcer = false) {
  const sig = FICHES_REGLAGES.map(n => Donnees.get('reglages', n)?.maj || 0).join('|') + '|' + JSON.stringify(reglagesAppareil());
  if (!forcer && sig === signatureReglages) return;
  signatureReglages = sig;

  appliquerApparence(reglage('apparence'), reglagesAppareil());

  const n = reglage('notes');
  Object.assign(SEUILS_ALERTE, { actif: n.alerte, orange: n.alerteOrange, rouge: n.alerteRouge });
  Object.assign(SEUILS_TENUE, { actif: n.alerteTenue, orange: n.tenueOrange, rouge: n.tenueRouge });
  for (const [code, defaut] of Object.entries(CODES_SAISIE)) {
    const b = document.querySelector(`#saisie [data-code="${code}"]`);
    const nom = (n.libelles[code] || '').trim() || defaut;
    // (Seulement les codes de la discipline du carnet, sauf ceux décochés dans les réglages.)
    if (b) { b.textContent = nom; b.hidden = !codeVisible(n, code); }
    // Leçons : un statut renommé s'affiche sous son nouveau nom dans la grille, et peut se taper tel quel.
    if (STATUTS_ENT_BASE[code] && !['ABS', 'DISP'].includes(code)) {
      STATUTS_ENT[code] = (n.libelles[code] || '').trim() || STATUTS_ENT_BASE[code];
      CODES_ENT[STATUTS_ENT[code].toLocaleUpperCase('fr')] ??= code; // (sans jamais détourner une lettre existante : A, D, B…)
    }
  }
  // Oubli (lettre T) : « Oubli tenue » en EPS, « Oubli matériel » en SVT (même code TEN ; aussi dans les classeurs Excel).
  STATUTS_ENT.TEN = STATUTS_ENT_BASE.TEN = mot('oubliCourt');

  const c = reglage('competences');
  NIVEAUX_MAITRISE.forEach((niv, i) => { niv.nom = (c.niveaux[i] || '').trim() || REGLAGES_DEFAUT.competences.niveaux[i]; });
  REFERENTIEL.personnaliser(c);

  const o = reglage('onglets');
  document.querySelectorAll('#onglets button[data-vue]').forEach(b => {
    b.hidden = !ongletsVisibles().includes(b.dataset.vue);
    b.textContent = (o.noms[b.dataset.vue] || '').trim() || NOMS_ONGLETS[b.dataset.vue];
  });
}

/* ---------- Fenêtre des réglages ---------- */

const radio = (name, valeur, actuel, contenu, classe = 'segment') =>
  `<label class="${classe}"><input type="radio" name="${name}" value="${esc(valeur)}" ${valeur === actuel ? 'checked' : ''}><span>${contenu}</span></label>`;

// Choix de la discipline du carnet (premier lancement et ⚙ Réglages).
const htmlChoixDiscipline = actuel => `<div class="segments choix-discipline">${Object.values(DISCIPLINES)
  .map(x => radio('discipline', x.id, actuel, `<b>${esc(x.nom)}</b> <small>${esc(x.nomComplet)}</small>`)).join('')}</div>`;
const AIDE_DISCIPLINE = 'Elle adapte le vocabulaire (APSA ou thèmes, leçons ou séances), les compétences officielles proposées, '
  + 'les modèles de séance, les appréciations et les outils. Changer de discipline n’efface rien.';

function htmlReglageApparence(a, appareil) {
  const palette = PALETTES_DEGRES[a.palette] ? a.palette : 'perso';
  return `
    <h4>Couleur de l’appli</h4>
    <div class="pastilles">
      ${Object.entries(THEMES).map(([id, t]) => `<label class="pastille" title="${t.nom}"><input type="radio" name="theme" value="${id}" ${a.theme === id ? 'checked' : ''}
        aria-label="${t.nom}"><span data-pastille="${t.clair}"></span></label>`).join('')}
      <label class="pastille libre" title="Couleur au choix"><input type="radio" name="theme" value="libre" ${a.theme === 'libre' ? 'checked' : ''} aria-label="Couleur au choix"><span></span></label>
      <input type="color" name="couleurLibre" value="${esc(a.couleurLibre)}" title="Couleur au choix" aria-label="Couleur au choix">
    </div>
    <h4>Mode</h4>
    <div class="segments">${radio('mode', 'auto', a.mode, 'Automatique')}${radio('mode', 'clair', a.mode, '☀ Clair')}${radio('mode', 'sombre', a.mode, '🌙 Sombre')}</div>
    <p class="aide">Automatique : suit le réglage de l’appareil (clair le jour, sombre le soir…).</p>
    <h4>Taille du texte <span class="appareil">— sur cet appareil</span></h4>
    <div class="segments">${Object.entries(TAILLES_TEXTE).map(([id, [nom]]) => radio('taille', id, appareil.taille, nom)).join('')}</div>
    <h4>Espacement des grilles <span class="appareil">— sur cet appareil</span></h4>
    <div class="segments">${Object.entries(DENSITES).map(([id, nom]) => radio('densite', id, appareil.densite, nom)).join('')}</div>
    <p class="aide">Compacte : plus d’élèves à l’écran. Aérée : des cases plus grandes, pratiques au doigt.</p>
    <h4>Couleurs des degrés de maîtrise</h4>
    <label>Palette<select name="palette">
      ${Object.entries(PALETTES_DEGRES).map(([id, p]) => `<option value="${id}" ${palette === id ? 'selected' : ''}>${p.nom}</option>`).join('')}
      <option value="perso" ${palette === 'perso' ? 'selected' : ''}>Personnalisée</option>
    </select></label>
    <div class="couleurs">${a.degres.map((c, i) => `<label class="couleur"><input type="color" name="degre${i + 1}" value="${esc(c)}">${i + 1}</label>`).join('')}</div>
    ${profil().champsSequence ? '' : '<div hidden>'}<h4>Couleurs des champs d’apprentissage</h4>
    <div class="couleurs">${Object.keys(COULEURS_CA).map(ca => `<label class="couleur"><input type="color" name="${ca}" value="${esc(a.ca[ca] || COULEURS_CA[ca])}">${ca}</label>`).join('')}</div>${profil().champsSequence ? '' : '</div>'}`;
}

function htmlReglageNotes(n) {
  return `
    <h4>Nouvelles évaluations</h4>
    <div class="ligne">
      <label class="etroit">Noté sur<input type="number" name="max" min="1" step="any" required value="${n.max}"></label>
      <label class="etroit">Coefficient<input type="number" name="coef" min="0" step="any" required value="${n.coef}"></label>
    </div>
    <h4>Note → degré de maîtrise (nouvelles classes)</h4>
    <div class="ligne seuils">
      ${[2, 3, 4].map((d, i) => `<label class="etroit"><span><span class="niveau n${d}">${d}</span> dès</span>
        <input type="number" name="s${d}" min="0" max="20" step="any" required value="${n.seuils[i]}"></label>`).join('')}
      <span class="aide">sur 20 — en dessous : <span class="niveau n1">1</span></span>
    </div>
    <p class="aide">Chaque classe garde ensuite son propre réglage (⚙ Note → degré dans l’onglet Notes).</p>
    <h4>Barre de saisie rapide</h4>
    <p class="aide">Coche les boutons à afficher ; tu peux les renommer (ex. « Autre » → « Natation »). Les lettres (${Object.entries(LETTRES_CODES).filter(([c]) => !['DISP', 'BLE'].includes(c) || codeDeLaDiscipline(c)).map(([c, l]) => `<b>${l}</b> ${CODES_SAISIE[c].toLowerCase()}`).join(', ')}) marchent toujours au clavier.</p>
    <div class="table-reglages">
      ${Object.entries(CODES_SAISIE).map(([code, nom]) => `
        <label class="case"><input type="checkbox" name="code-${code}" ${codeVisible(n, code) ? 'checked' : ''}> ${nom}${code === 'NE' ? ' <span class="aide">(notes)</span>' : ''}</label>
        <input name="lib-${code}" value="${esc(n.libelles[code] || '')}" placeholder="${nom}" aria-label="Nom affiché pour ${nom}" maxlength="20">`).join('')}
    </div>
    <h4>Alerte absences</h4>
    <label class="case"><input type="checkbox" name="alerte" ${n.alerte ? 'checked' : ''}> Signaler les élèves souvent ${codeDeLaDiscipline('BLE') ? 'absents, blessés ou malades' : 'absents ou malades'} (badge ⚠)</label>
    <div class="ligne">
      <label class="etroit">Orange dès<input type="number" name="alerteOrange" min="1" max="60" step="1" required value="${n.alerteOrange}"></label>
      <label class="etroit">Rouge dès<input type="number" name="alerteRouge" min="1" max="60" step="1" required value="${n.alerteRouge}"></label>
      <span class="aide">jours sur la période</span>
    </div>
    <h4>Alerte ${oubliTenue(2)}</h4>
    <label class="case"><input type="checkbox" name="alerteTenue" ${n.alerteTenue ? 'checked' : ''}> Signaler les élèves qui ${mot('tenueReglage')} (badge ${mot('iconeTenue')})</label>
    <div class="ligne">
      <label class="etroit">Orange dès<input type="number" name="tenueOrange" min="1" max="60" step="1" required value="${n.tenueOrange}"></label>
      <label class="etroit">Rouge dès<input type="number" name="tenueRouge" min="1" max="60" step="1" required value="${n.tenueRouge}"></label>
      <span class="aide">oublis sur la période</span>
    </div>`;
}

function htmlReglageOnglets(o) {
  return `${typeof htmlReglageDisposition === 'function' ? htmlReglageDisposition(o) : ''}
    <p class="aide">Décoche un onglet pour le masquer (ses données sont gardées) ; tu peux aussi le renommer.</p>
    <div class="table-reglages">
      ${Object.entries(NOMS_ONGLETS).map(([v, nom]) => `
        <label class="case"><input type="checkbox" name="onglet-${v}" ${o.masques.includes(v) ? '' : 'checked'}> ${nom}</label>
        <input name="nom-${v}" value="${esc(o.noms[v] || '')}" placeholder="${nom}" aria-label="Nom de l’onglet ${nom}" maxlength="16">`).join('')}
    </div>
    <label>Onglet ouvert au lancement<select name="demarrage">
      <option value="">Le dernier utilisé</option>
      ${Object.entries(NOMS_ONGLETS).map(([v, nom]) => `<option value="${v}" ${o.demarrage === v ? 'selected' : ''}>${esc((o.noms[v] || '').trim() || nom)}</option>`).join('')}
    </select></label>`;
}

// Lit l'apparence dans le formulaire (pour l'aperçu en direct et l'enregistrement).
function lireApparence(form, base) {
  const val = n => form.elements[n]?.value;
  const theme = form.querySelector('[name="theme"]:checked')?.value || base.theme;
  return {
    ...base, theme, couleurLibre: val('couleurLibre'), mode: form.querySelector('[name="mode"]:checked')?.value || base.mode,
    palette: val('palette'), degres: [1, 2, 3, 4].map(i => val('degre' + i)),
    ca: Object.fromEntries(Object.keys(COULEURS_CA).map(ca => [ca, val(ca)])),
  };
}
const lireAppareil = form => ({
  taille: form.querySelector('[name="taille"]:checked')?.value || 'normale',
  densite: form.querySelector('[name="densite"]:checked')?.value || 'normale',
});

async function ouvrirReglages(rubrique = 'apparence') {
  const a = reglage('apparence'), n = reglage('notes'), c = reglage('competences'), o = reglage('onglets');
  const ouvert = r => (r === rubrique ? 'open' : '');
  const { d, resultat } = ouvrirModale('Réglages du carnet', `
    <p class="aide">Ces réglages sont à toi : ils sont enregistrés dans ton carnet et te suivent sur la clé, d’un appareil à l’autre.</p>
    <details ${ouvert('apparence')}><summary>🎨 Apparence <small>couleurs, mode sombre, taille</small></summary>
      <div class="rubrique" data-rubrique="apparence">${htmlReglageApparence(a, reglagesAppareil())}</div></details>
    <details ${ouvert('etablissement')}><summary>🏫 Établissement <small>nom, professeur, périodes</small></summary>
      <div class="rubrique">
        <div class="ligne">
          <label>Établissement (affiché en haut)<input name="etablissement" value="${esc(a.etablissement)}" maxlength="30" placeholder="ex. Collège Saint-André"></label>
          <label>Professeur<input name="prof" value="${esc(a.prof)}" maxlength="40" placeholder="ex. M. Dupont"></label>
        </div>
        <p class="aide">Le nom du professeur est repris en tête des classeurs Excel exportés.</p>
        <button value="periodes" formnovalidate>📅 Trimestres / semestres…</button>
      </div></details>
    <details ${ouvert('discipline')}><summary>📚 Discipline <small>${esc(profil().nomComplet)}</small></summary>
      <div class="rubrique">
        ${htmlChoixDiscipline(disciplineActive())}
        <p class="aide">${AIDE_DISCIPLINE} Le choix est gardé dans ton carnet (il te suit sur la clé) ;
          il n’est jamais transmis avec les réglages partagés avec un collègue.</p>
      </div></details>
    <details ${ouvert('notes')}><summary>📝 Notes <small>barème, codes, alertes absences et ${mot('deTenue').replace(/^de /, '')}</small></summary>
      <div class="rubrique">${htmlReglageNotes(n)}</div></details>
    <details ${ouvert('competences')}><summary>🎯 Compétences <small>degrés, référentiels</small></summary>
      <div class="rubrique">
        <h4>Noms des 4 degrés de maîtrise</h4>
        <div class="table-reglages">${c.niveaux.map((nom, i) => `<span class="niveau n${i + 1}">${i + 1}</span>
          <input name="niv${i + 1}" value="${esc(nom)}" placeholder="${esc(REGLAGES_DEFAUT.competences.niveaux[i])}" maxlength="40" aria-label="Nom du degré ${i + 1}">`).join('')}</div>
        <button value="competences">📚 Référentiels et compétences…</button>
        <p class="aide">Masquer des compétences officielles, ajouter les tiennes, créer ton propre référentiel.</p>
      </div></details>
    ${typeof htmlReglageAppr === 'function' ? `<details ${ouvert('appreciations')}><summary>✍ Appréciations <small>rubriques, ton, style, longueur</small></summary>
      <div class="rubrique" data-rubrique="appreciations">${htmlReglageAppr(reglageAppr())}
        <p class="aide">Les appréciations se préparent dans l’onglet Notes › ✍ Appréciations, ou dans la fiche d’un élève.</p></div></details>` : ''}
    <details ${ouvert('onglets')}><summary>🗂 Onglets <small>disposition sur tablette, afficher, renommer</small></summary>
      <div class="rubrique">${htmlReglageOnglets(o)}</div></details>
    <details ${ouvert('partage')}><summary>🔄 Partager <small>avec un collègue, ou revenir à l’origine</small></summary>
      <div class="rubrique">
        <p class="aide">Le fichier de réglages ne contient <b>aucune donnée d’élève</b> : couleurs, barème, compétences, onglets, périodes.
          Un collègue peut l’importer pour démarrer avec la même organisation.</p>
        <div class="actions-reglages">
          <button type="button" data-exporter-reglages>⬇ Exporter mes réglages</button>
          <label class="bouton">⬆ Importer des réglages…<input type="file" accept=".json,application/json" data-importer-reglages hidden></label>
        </div>
        <button value="origine" formnovalidate class="danger">Revenir aux réglages d’origine</button>
      </div></details>
    <details ${ouvert('securite')}><summary>🔒 Sécurité <small>mot de passe, verrouillage automatique</small></summary>
      <div class="rubrique">
        ${typeof htmlReglageVerrou === 'function' ? htmlReglageVerrou() + '<h4>Mot de passe</h4>' : ''}
        <p class="aide">Le mot de passe chiffre le carnet sur ta clé. Pour le changer : sur l’ordinateur, clé branchée.
          Tout ce qui est sur la clé est d’abord repris, rien ne se perd ; tes autres appareils prennent le nouveau
          au prochain « Récupérer depuis la clé ».</p>
        <button value="mdp" formnovalidate>🔑 Changer le mot de passe…</button>
      </div></details>
    <details ${ouvert('application')}><summary>📲 L’application <small>installer sur cet appareil · v${VERSION_APP}</small></summary>
      <div class="rubrique">
        ${appliInstallee() ? '<p class="aide">✔ L’application est installée sur cet appareil : elle marche sans internet.</p>'
          : `<button type="button" data-installer-appli>📲 Installer l’application</button>
        <p class="aide">Elle s’ouvre alors comme une vraie appli (icône sur l’écran d’accueil ou le bureau) et marche sans internet.</p>`}
      </div></details>`,
  boutonsModale('Enregistrer'), 'modale-large reglages');

  // Pastilles : la couleur est posée par script (le verrou de sécurité interdit les styles écrits dans la page).
  d.querySelectorAll('[data-pastille]').forEach(s => s.style.setProperty('--p', s.dataset.pastille));
  const form = $('form', d);
  const apercu = () => appliquerApparence(lireApparence(form, a), lireAppareil(form), form.elements.etablissement.value);
  d.addEventListener('input', e => {
    if (/^degre\d$/.test(e.target.name)) form.elements.palette.value = 'perso';
    if (e.target.name === 'couleurLibre') form.querySelector('[name="theme"][value="libre"]').checked = true;
    if (e.target.name === 'palette' && PALETTES_DEGRES[e.target.value]) {
      PALETTES_DEGRES[e.target.value].couleurs.forEach((coul, i) => { form.elements['degre' + (i + 1)].value = coul; });
    }
    if (e.target.closest('[data-rubrique="apparence"]') || e.target.name === 'etablissement') apercu();
  });
  d.addEventListener('change', e => {
    if (e.target.closest('[data-rubrique="apparence"]')) apercu();
    const f = e.target.matches('[data-importer-reglages]') && e.target.files[0];
    if (f) { d.fermer(); lancer(() => importerReglages(f)); }
  });
  $('[data-exporter-reglages]', d).addEventListener('click', () => lancer(exporterReglages));
  $('[data-installer-appli]', d)?.addEventListener('click', () => lancer(installerAppli));
  d.addEventListener('click', e => { const b = e.target.closest('[data-appr-monter], [data-appr-descendre]'); if (b) deplacerRubriqueAppr(b); }); // (seulement si appreciations.js est là)

  const r = await resultat;
  if (r.action === 'annuler') { appliquerReglages(true); return; } // aperçu abandonné
  if (r.action === 'origine') { appliquerReglages(true); return lancer(revenirOrigine); }

  // Contrôles
  const v = r.data;
  const visibles = Object.keys(NOMS_ONGLETS).filter(x => v['onglet-' + x] === 'on');
  if (!visibles.length) { toast('Garde au moins un onglet affiché.', 'erreur'); appliquerReglages(true); return ouvrirReglages('onglets'); }
  const favoris = Object.keys(NOMS_ONGLETS).filter(x => v['favori-' + x] === 'on');
  if (favoris.length > 4) { toast('4 onglets favoris au plus (les autres vont dans « Plus »).', 'erreur'); appliquerReglages(true); return ouvrirReglages('onglets'); }
  if (+v.alerteRouge < +v.alerteOrange || +v.tenueRouge < +v.tenueOrange) { toast('L’alerte rouge doit venir après (ou en même temps que) l’orange.', 'erreur'); appliquerReglages(true); return ouvrirReglages('notes'); }

  ui.taille = lireAppareil(form).taille;
  ui.densite = lireAppareil(form).densite;
  if (v.disposition) ui.disposition = v.disposition; // (onglets sur tablette : propre à cet appareil)
  memoriserUi();
  ecrireReglage('apparence', { ...lireApparence(form, a), etablissement: v.etablissement.trim(), prof: v.prof.trim() });
  ecrireReglage('notes', {
    max: +v.max, coef: +v.coef, seuils: [+v.s2, +v.s3, +v.s4].sort((x, y) => x - y),
    // Codes de la discipline décochés ; codes hors discipline cochés (« ajoutés ») ; les choix faits dans une autre discipline sont gardés.
    codesMasques: [...n.codesMasques.filter(c => !codesDiscipline().includes(c)), ...codesDiscipline().filter(c => v['code-' + c] !== 'on')],
    codesAjoutes: [...(n.codesAjoutes || []).filter(c => codesDiscipline().includes(c)),
      ...Object.keys(CODES_SAISIE).filter(c => !codesDiscipline().includes(c) && v['code-' + c] === 'on')],
    libelles: Object.fromEntries(Object.keys(CODES_SAISIE).map(code => [code, v['lib-' + code].trim()]).filter(([, l]) => l)),
    alerte: v.alerte === 'on', alerteOrange: +v.alerteOrange, alerteRouge: +v.alerteRouge,
    alerteTenue: v.alerteTenue === 'on', tenueOrange: +v.tenueOrange, tenueRouge: +v.tenueRouge,
  });
  ecrireReglage('competences', { niveaux: [1, 2, 3, 4].map(i => v['niv' + i].trim() || REGLAGES_DEFAUT.competences.niveaux[i - 1]) });
  ecrireReglage('onglets', {
    masques: Object.keys(NOMS_ONGLETS).filter(x => !visibles.includes(x)),
    noms: Object.fromEntries(Object.keys(NOMS_ONGLETS).map(x => [x, v['nom-' + x].trim()]).filter(([, l]) => l)),
    demarrage: visibles.includes(v.demarrage) ? v.demarrage : '',
    ...(typeof htmlReglageDisposition === 'function' ? { favoris } : {}),
  });
  if (typeof lireReglageAppr === 'function') ecrireReglage('appreciations', lireReglageAppr(form));
  // Changement de discipline : confirmé, car tout l'affichage change (aucune donnée n'est effacée).
  const nouvelle = DISCIPLINES[v.discipline] ? v.discipline : disciplineActive();
  let messageFin = 'Réglages enregistrés ✔';
  if (nouvelle !== disciplineActive()) {
    appliquerReglages(true);
    if (await confirmer(`Passer ce carnet en ${DISCIPLINES[nouvelle].nom} (${DISCIPLINES[nouvelle].nomComplet}) ? `
      + 'Le vocabulaire, les compétences proposées, les modèles de séance, les appréciations et les outils changent. '
      + 'Tes classes, élèves, notes et séances sont gardés tels quels.', `Passer en ${DISCIPLINES[nouvelle].nom}`)) {
      ecrireReglage('discipline', { code: nouvelle });
      messageFin = `Carnet passé en ${DISCIPLINES[nouvelle].nom} ✔`;
    }
  }
  appliquerReglages(true);
  rendre();
  if (r.action === 'periodes') return lancer(editerPeriodes);
  if (r.action === 'competences') return lancer(gererCompetences);
  if (r.action === 'mdp') return lancer(changerMotDePasse);
  toast(messageFin, 'ok');
}

async function revenirOrigine() {
  if (!(await confirmer('Revenir aux réglages d’origine (apparence, notes, noms des degrés, onglets) ? '
    + 'Tes classes, élèves et notes ne sont pas touchés, ni tes compétences ajoutées ni tes périodes.', 'Revenir à l’origine'))) return;
  const { prof } = reglage('apparence');
  ecrireReglage('apparence', { ...REGLAGES_DEFAUT.apparence, prof });
  ecrireReglage('notes', REGLAGES_DEFAUT.notes);
  ecrireReglage('competences', { niveaux: REGLAGES_DEFAUT.competences.niveaux });
  ecrireReglage('onglets', REGLAGES_DEFAUT.onglets);
  ecrireReglage('appreciations', REGLAGES_DEFAUT.appreciations);
  delete ui.taille; delete ui.densite; delete ui.disposition;
  memoriserUi();
  appliquerReglages(true);
  rendre();
  toast('Réglages d’origine rétablis ✔', 'ok');
}

/* ---------- Référentiels et compétences ----------
   Les compétences officielles ne sont jamais supprimées : on peut seulement ne plus les proposer (masquer).
   Les compétences ajoutées et les référentiels personnels se suppriment s'ils ne servent à aucune évaluation ;
   sinon on les masque, pour que les degrés déjà saisis restent lisibles. */

const idPerso = () => 'perso-' + Donnees.nouvelId();
const estIdPerso = id => typeof id === 'string' && /^perso-[\w-]{1,60}$/.test(id);
const evalsAvecCompetence = id => Donnees.liste('evals', e => (e.competences || []).includes(id));
const evalsAvecReferentiel = id => Donnees.liste('evals', e => e.referentiel === id);
const CHAMPS_MODELE = { CA1: '', CA2: '', CA3: '', CA4: '', CA5: '' };

async function gererCompetences(refChoisi) {
  const cfg = reglage('competences');
  // Référentiels de la discipline du carnet (et les référentiels personnels).
  const refsVisibles = () => Object.values(REFERENTIEL.refs).filter(referentielDeLaDiscipline);
  let refId = referentielDeLaDiscipline(REFERENTIEL.refs[refChoisi]) ? refChoisi : refsVisibles()[0]?.id;
  const { d, resultat } = ouvrirModale('Référentiels et compétences', `
    <div class="ref-entete">
      <label>Référentiel<select data-choix-ref></select></label>
      <button type="button" data-nouveau-ref>+ Référentiel personnel</button>
    </div>
    <div class="zone-ref"></div>
    <p class="aide">Décocher une compétence : elle n’est plus proposée dans les nouvelles évaluations
      (les évaluations qui l’utilisent déjà la gardent, avec leurs degrés).</p>`,
  boutonsModale('Enregistrer'), 'modale-large reglages');
  const zone = $('.zone-ref', d), choix = $('[data-choix-ref]', d);

  // L'aperçu se fait sur le vrai référentiel (remis en état si on annule).
  const dessiner = () => {
    REFERENTIEL.personnaliser(cfg);
    if (!referentielDeLaDiscipline(REFERENTIEL.refs[refId])) refId = refsVisibles()[0]?.id;
    choix.innerHTML = refsVisibles().map(r => `<option value="${esc(r.id)}" ${r.id === refId ? 'selected' : ''}>${esc(r.nom || 'Sans nom')}${r.perso ? ' (perso)' : ''}${r.masque ? ' — masqué' : ''}</option>`).join('');
    const ref = REFERENTIEL.refs[refId];
    zone.innerHTML = `
      <label class="case"><input type="checkbox" data-ref-propose ${ref.masque ? '' : 'checked'}> Proposer ce référentiel dans les évaluations</label>
      ${ref.perso ? `<div class="ref-entete">
        <label>Nom du référentiel<input data-ref-nom value="${esc(ref.nom)}" maxlength="60"></label>
        <button type="button" class="danger" data-suppr-ref>Supprimer ce référentiel</button></div>
        <p class="aide">Donne un titre aux champs d’apprentissage que tu utilises ; un champ sans titre n’est pas proposé.</p>` : ''}
      ${Object.entries(ref.champs).map(([ca, ch]) => `
        <div class="champ-ref ca-${esc(ca)}">
          <h3><span class="chip-ca">${esc(ca)}</span>${ref.perso
    ? `<input class="titre-champ" data-titre-champ="${esc(ca)}" value="${esc(ch.titre)}" placeholder="Titre du champ (vide = non utilisé)" maxlength="120">`
    : esc(ch.titre)}</h3>
          ${ch.attendus.map(at => `<label class="attendu-ref${at.masque ? ' masque' : ''}">
            <input type="checkbox" data-attendu-propose="${esc(at.id)}" ${at.masque ? '' : 'checked'}>
            <span class="texte-attendu"><b>${esc(at.code)}</b> ${esc(at.texte)} ${at.perso ? '<span class="badge-perso">ajoutée</span>' : ''}</span>
            ${at.perso ? `<button type="button" class="icone-petit" data-suppr-attendu="${esc(at.id)}" title="Supprimer cette compétence" aria-label="Supprimer">🗑</button>` : ''}
          </label>`).join('')}
          <div class="ajout-attendu">
            <input data-ajout-code="${esc(ca)}" placeholder="Code" maxlength="12" aria-label="Code de la compétence">
            <input data-ajout-texte="${esc(ca)}" placeholder="Ajouter une compétence (ex. ${esc(mot('competenceLibreExemple'))})" maxlength="400" aria-label="Texte de la compétence">
            <button type="button" data-ajouter="${esc(ca)}">+ Ajouter</button>
          </div>
        </div>`).join('')}`;
  };

  const ajouter = ca => {
    const texte = $(`[data-ajout-texte="${CSS.escape(ca)}"]`, zone).value.trim();
    if (!texte) return $(`[data-ajout-texte="${CSS.escape(ca)}"]`, zone).focus();
    const deja = cfg.ajouts.filter(x => x.refId === refId && x.ca === ca).length;
    const code = $(`[data-ajout-code="${CSS.escape(ca)}"]`, zone).value.trim() || 'P' + (deja + 1);
    cfg.ajouts.push({ id: idPerso(), refId, ca, code, texte });
    dessiner();
    $(`[data-ajout-texte="${CSS.escape(ca)}"]`, zone)?.focus();
  };

  choix.addEventListener('change', () => { refId = choix.value; dessiner(); });
  $('[data-nouveau-ref]', d).addEventListener('click', () => {
    const id = idPerso();
    cfg.refsPerso.push({ id, nom: 'Mon référentiel', champs: { ...CHAMPS_MODELE } });
    refId = id;
    dessiner();
    $('[data-ref-nom]', zone).select();
  });
  zone.addEventListener('click', async e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.ajouter) return ajouter(b.dataset.ajouter);
    if (b.dataset.supprAttendu) {
      const id = b.dataset.supprAttendu, n = evalsAvecCompetence(id).length;
      if (n) return toast(`Cette compétence sert dans ${n} évaluation${n > 1 ? 's' : ''} : décoche-la plutôt (elle ne sera plus proposée).`, 'erreur');
      cfg.ajouts = cfg.ajouts.filter(x => x.id !== id);
      cfg.masques = cfg.masques.filter(x => x !== id);
      return dessiner();
    }
    if (b.matches('[data-suppr-ref]')) {
      const n = evalsAvecReferentiel(refId).length;
      if (n) return toast(`Ce référentiel sert dans ${n} évaluation${n > 1 ? 's' : ''} : décoche « Proposer ce référentiel » plutôt.`, 'erreur');
      cfg.refsPerso = cfg.refsPerso.filter(x => x.id !== refId);
      cfg.ajouts = cfg.ajouts.filter(x => x.refId !== refId);
      cfg.refsMasques = cfg.refsMasques.filter(x => x !== refId);
      refId = null;
      return dessiner();
    }
  });
  zone.addEventListener('change', e => {
    const t = e.target;
    if (t.matches('[data-ref-propose]')) {
      cfg.refsMasques = cfg.refsMasques.filter(x => x !== refId).concat(t.checked ? [] : [refId]);
      return dessiner();
    }
    if (t.dataset.attenduPropose) {
      cfg.masques = cfg.masques.filter(x => x !== t.dataset.attenduPropose).concat(t.checked ? [] : [t.dataset.attenduPropose]);
      t.closest('.attendu-ref').classList.toggle('masque', !t.checked);
    }
  });
  zone.addEventListener('input', e => {
    const t = e.target, ref = cfg.refsPerso.find(x => x.id === refId);
    if (!ref) return;
    if (t.matches('[data-ref-nom]')) ref.nom = t.value;
    if (t.dataset.titreChamp) ref.champs[t.dataset.titreChamp] = t.value;
  });
  // Entrée dans « Ajouter une compétence » : ajoute (au lieu de passer au champ suivant ou de valider la fenêtre).
  zone.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || !e.target.matches('[data-ajout-texte], [data-ajout-code]')) return;
    e.preventDefault();
    e.stopPropagation();
    ajouter(e.target.dataset.ajoutTexte || e.target.dataset.ajoutCode);
  });
  dessiner();

  const r = await resultat;
  if (r.action !== 'ok') { REFERENTIEL.personnaliser(reglage('competences')); return; }
  for (const ref of cfg.refsPerso) ref.nom = ref.nom.trim() || 'Mon référentiel';
  ecrireReglage('competences', cfg);
  appliquerReglages(true);
  rendre();
  toast('Compétences enregistrées ✔', 'ok');
}

/* ---------- Partage : exporter / importer les réglages (sans aucune donnée d'élève) ---------- */

/* ---------- L'application : l'installer sur l'appareil ----------
   Chrome / Edge / Android proposent l'installation par l'événement « beforeinstallprompt », gardé pour le bouton ;
   Safari (iPad, iPhone) ne le propose pas : on explique le geste à faire. */

let invitationInstall = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); invitationInstall = e; });
window.addEventListener('appinstalled', () => { invitationInstall = null; toast('Application installée ✔', 'ok'); });

const appliInstallee = () => !!navigator.standalone || matchMedia('(display-mode: standalone)').matches;

async function installerAppli() {
  if (invitationInstall) {
    const inv = invitationInstall;
    invitationInstall = null; // (une invitation ne sert qu'une fois)
    await inv.prompt();
    return;
  }
  const ua = navigator.userAgent;
  const apple = /iPad|iPhone|Macintosh/.test(ua) && 'ontouchend' in document;
  const geste = apple ? 'Dans Safari : bouton <b>Partager</b> (carré avec une flèche) › <b>« Sur l’écran d’accueil »</b>.'
    : /Android/.test(ua) ? 'Menu <b>⋮</b> du navigateur › <b>« Installer l’application »</b> (ou « Ajouter à l’écran d’accueil »).'
      : /Firefox/.test(ua) ? 'Firefox n’installe pas les applications web : ouvre l’appli dans <b>Edge</b> ou <b>Chrome</b>.'
        : location.protocol === 'file:' ? 'Ouvre l’appli avec « Lancer Carnet EPS S-A.bat » (ou en ligne) pour pouvoir l’installer.'
          : 'Dans la barre d’adresse, clique sur l’icône <b>« Installer »</b> (écran avec une flèche), ou menu <b>…</b> › Applications › <b>« Installer Carnet EPS S-A »</b>.';
  await ouvrirModale('Installer l’application', `<p>${geste}</p>
    <p class="aide">Si rien n’est proposé, l’appli est peut-être déjà installée sur cet appareil.</p>`,
  '<span class="espace"></span><button type="button" data-fermer class="primaire">Fermer</button>').resultat;
}

function exporterReglages() {
  const contenu = { format: 'carnet-eps-reglages', version: 1, appli: VERSION_APP, date: aujourdhui(), reglages: {} };
  for (const nom of [...FICHES_REGLAGES.filter(n => n !== 'discipline'), 'periodes']) { // (la discipline reste propre à chaque carnet)
    const r = Donnees.get('reglages', nom);
    if (!r) continue;
    const { id, maj, majChamps, majChampsPour, ...valeurs } = r;
    if (nom === 'apparence') delete valeurs.prof; // le nom du prof reste chez lui
    contenu.reglages[nom] = valeurs;
  }
  const nom = `Réglages ${profil().carnet} ${aujourdhui()}.json`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new File([JSON.stringify(contenu, null, 2)], nom, { type: 'application/json' }));
  a.download = nom;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 60000);
  toast('Réglages exportés ✔ (aucune donnée d’élève dans ce fichier)', 'ok');
}

// Ne garde du fichier que des valeurs du bon type (le fichier peut venir de n'importe qui).
function nettoyerReglage(nom, brut) {
  const propre = {};
  for (const [k, defaut] of Object.entries(REGLAGES_DEFAUT[nom])) {
    const v = brut?.[k];
    if (v === undefined) continue;
    if (Array.isArray(defaut) ? Array.isArray(v) : typeof v === typeof defaut && v !== null) propre[k] = structuredClone(v);
  }
  const texte = (s, max) => String(s ?? '').slice(0, max);
  if (nom === 'apparence') {
    if (propre.theme && !THEMES[propre.theme] && propre.theme !== 'libre') delete propre.theme;
    if (propre.mode && !['auto', 'clair', 'sombre'].includes(propre.mode)) delete propre.mode;
    if (propre.couleurLibre && !estCouleur(propre.couleurLibre)) delete propre.couleurLibre;
    if (propre.degres && (propre.degres.length !== 4 || !propre.degres.every(estCouleur))) delete propre.degres;
    if (propre.ca) propre.ca = Object.fromEntries(Object.keys(COULEURS_CA).map(ca => [ca, estCouleur(propre.ca[ca]) ? propre.ca[ca] : COULEURS_CA[ca]]));
    if (propre.etablissement !== undefined) propre.etablissement = texte(propre.etablissement, 30);
    delete propre.prof;
  }
  if (nom === 'notes') {
    for (const k of ['max', 'coef', 'alerteOrange', 'alerteRouge', 'tenueOrange', 'tenueRouge']) if (k in propre && !(Number.isFinite(propre[k]) && propre[k] >= 0)) delete propre[k];
    if (propre.seuils && (propre.seuils.length !== 3 || !propre.seuils.every(Number.isFinite))) delete propre.seuils;
    if (propre.codesMasques) propre.codesMasques = propre.codesMasques.filter(c => CODES_SAISIE[c]);
    if (propre.codesAjoutes) propre.codesAjoutes = propre.codesAjoutes.filter(c => CODES_SAISIE[c]);
    if (propre.libelles) propre.libelles = Object.fromEntries(Object.keys(CODES_SAISIE).filter(c => propre.libelles[c]).map(c => [c, texte(propre.libelles[c], 20)]));
  }
  if (nom === 'competences') {
    if (propre.niveaux) propre.niveaux = [0, 1, 2, 3].map(i => texte(propre.niveaux[i] || REGLAGES_DEFAUT.competences.niveaux[i], 40));
    for (const k of ['masques', 'refsMasques']) if (propre[k]) propre[k] = propre[k].filter(x => typeof x === 'string').map(x => x.slice(0, 80));
    if (propre.refsPerso) {
      propre.refsPerso = propre.refsPerso.filter(r => estIdPerso(r?.id)).map(r => ({
        id: r.id, nom: texte(r.nom, 60) || 'Référentiel',
        champs: Object.fromEntries(Object.keys(CHAMPS_MODELE).map(ca => [ca, texte(r.champs?.[ca], 120)])),
      }));
    }
    if (propre.ajouts) {
      propre.ajouts = propre.ajouts.filter(x => estIdPerso(x?.id) && CHAMPS_MODELE[x.ca] !== undefined && typeof x.refId === 'string')
        .map(x => ({ id: x.id, refId: x.refId.slice(0, 80), ca: x.ca, code: texte(x.code, 12), texte: texte(x.texte, 400) }));
    }
  }
  if (nom === 'onglets') {
    if (propre.masques) propre.masques = propre.masques.filter(v => NOMS_ONGLETS[v]);
    if (propre.masques?.length >= Object.keys(NOMS_ONGLETS).length) delete propre.masques;
    if (propre.noms) propre.noms = Object.fromEntries(Object.keys(NOMS_ONGLETS).filter(v => propre.noms[v]).map(v => [v, texte(propre.noms[v], 16)]));
    if (propre.demarrage && !NOMS_ONGLETS[propre.demarrage]) propre.demarrage = '';
    if (propre.favoris) propre.favoris = [...new Set(propre.favoris.filter(v => NOMS_ONGLETS[v]))].slice(0, 4);
  }
  if (nom === 'discipline' && propre.code && !DISCIPLINES[propre.code]) delete propre.code;
  if (nom === 'appreciations') {
    for (const k of ['ordre', 'actives']) if (propre[k]) propre[k] = propre[k].filter(x => REGLAGES_DEFAUT.appreciations.ordre.includes(x));
    if (propre.ton && !['bienveillant', 'neutre', 'exigeant'].includes(propre.ton)) delete propre.ton;
    if (propre.style && !['phrases', 'telegraphique'].includes(propre.style)) delete propre.style;
    if ('longueur' in propre && !(propre.longueur >= 80 && propre.longueur <= 2000)) delete propre.longueur;
  }
  if (nom === 'pp') {
    for (const k of ['ordre', 'actives']) if (propre[k]) propre[k] = propre[k].filter(x => REGLAGES_DEFAUT.pp.ordre.includes(x));
    if (propre.ton && !['bienveillant', 'neutre', 'exigeant'].includes(propre.ton)) delete propre.ton;
    if (propre.style && !['phrases', 'telegraphique'].includes(propre.style)) delete propre.style;
    if (propre.adresse && !['il', 'vous'].includes(propre.adresse)) delete propre.adresse;
    if ('longueur' in propre && !(propre.longueur >= 80 && propre.longueur <= 2000)) delete propre.longueur;
    if (propre.seuils && (propre.seuils.length !== 3 || !propre.seuils.every(x => Number.isFinite(x) && x >= 0 && x <= 20))) delete propre.seuils;
    for (const k of ['felicitations', 'compliments']) if (k in propre && !(propre[k] >= 0 && propre[k] <= 20)) delete propre[k];
  }
  return propre;
}

async function importerReglages(fichier) {
  let contenu;
  try { contenu = JSON.parse(await fichier.text()); } catch { contenu = null; }
  if (contenu?.format !== 'carnet-eps-reglages' || typeof contenu.reglages !== 'object') {
    throw new Error('Ce fichier n’est pas un fichier de réglages du carnet (« Réglages Carnet … .json »).');
  }
  if (!(await confirmer('Remplacer tes réglages (apparence, notes, compétences, onglets, périodes) par ceux de ce fichier ? '
    + 'Tes classes, élèves et notes ne sont pas touchés ; tes compétences ajoutées sont gardées.', 'Importer'))) return;
  for (const nom of FICHES_REGLAGES.filter(n => n !== 'discipline')) {
    if (!contenu.reglages[nom]) continue;
    const propre = nettoyerReglage(nom, contenu.reglages[nom]);
    if (nom === 'competences') {
      // On garde ses propres compétences ajoutées et référentiels (des évaluations peuvent s'en servir).
      const ici = reglage('competences');
      const union = (a = [], b = []) => [...b, ...a.filter(x => !b.some(y => y.id === x.id))];
      propre.ajouts = union(ici.ajouts, propre.ajouts);
      propre.refsPerso = union(ici.refsPerso, propre.refsPerso);
    }
    ecrireReglage(nom, { ...REGLAGES_DEFAUT[nom], ...(nom === 'apparence' ? { prof: reglage('apparence').prof } : {}), ...propre });
  }
  const p = contenu.reglages.periodes;
  const md = x => typeof x === 'string' && /^\d\d-\d\d$/.test(x);
  if (p && ['trimestres', 'semestres'].includes(p.type) && Array.isArray(p.trimestres) && p.trimestres.length === 2 && p.trimestres.every(md)
    && Array.isArray(p.semestres) && p.semestres.length === 1 && p.semestres.every(md)) {
    Donnees.ecrire('reglages', { ...Donnees.get('reglages', 'periodes'), id: 'periodes', type: p.type, trimestres: p.trimestres, semestres: p.semestres });
  }
  appliquerReglages(true);
  rendre();
  toast('Réglages importés ✔', 'ok');
}

/* ---------- Premier lancement : quelques choix pour démarrer ---------- */

async function premierLancement() {
  if (ui.accueilVu || classesTriees().length || Donnees.get('reglages', 'apparence')) return;
  const a = reglage('apparence');
  const { d, resultat } = ouvrirModale('Bienvenue dans ton carnet 👋', `
    <p class="bienvenue-intro">Quelques réglages pour commencer (tout se change ensuite dans <b>⚙ Réglages du carnet</b>, sous la liste des classes).</p>
    <button type="button" class="large deja-carnet" data-deja-carnet>📂 J’ai déjà un carnet (clé USB, dossier ou Drive) : le récupérer</button>
    <p class="aide">Tes classes et tes réglages reviendront avec lui. Sinon, choisis ci-dessous pour commencer.</p>
    <h4>Ta discipline</h4>
    ${htmlChoixDiscipline(disciplineActive())}
    <p class="aide">${AIDE_DISCIPLINE}</p>
    <div class="ligne">
      <label>Établissement<input name="etablissement" value="" maxlength="30" placeholder="ex. Collège Jean Moulin" autofocus></label>
      <label>Professeur<input name="prof" value="" maxlength="40" placeholder="ex. Mme Martin"></label>
    </div>
    <div class="rubrique" data-rubrique="apparence">
      <h4>Couleur de l’appli</h4>
      <div class="pastilles">${Object.entries(THEMES).map(([id, t]) => `<label class="pastille" title="${t.nom}"><input type="radio" name="theme" value="${id}" ${a.theme === id ? 'checked' : ''}
        aria-label="${t.nom}"><span data-pastille="${t.clair}"></span></label>`).join('')}</div>
      <h4>Mode</h4>
      <div class="segments">${radio('mode', 'auto', a.mode, 'Automatique')}${radio('mode', 'clair', a.mode, '☀ Clair')}${radio('mode', 'sombre', a.mode, '🌙 Sombre')}</div>
    </div>
    <p class="aide">🎓 Une <b>classe exemple</b> déjà remplie (élèves inventés)
      t’attend pour découvrir le carnet : tu pourras la supprimer d’un clic.</p>
    <label class="bouton">📂 Utiliser les réglages d’un collègue…<input type="file" accept=".json,application/json" data-importer-reglages hidden></label>`,
  '<span class="espace"></span><button type="button" data-fermer>Plus tard</button><button value="ok" class="primaire">C’est parti</button>', 'reglages');
  d.querySelectorAll('[data-pastille]').forEach(s => s.style.setProperty('--p', s.dataset.pastille));
  const form = $('form', d);
  const choisi = () => ({ ...a, theme: form.querySelector('[name="theme"]:checked').value, mode: form.querySelector('[name="mode"]:checked').value });
  let importe = null, dejaCarnet = false;
  $('[data-deja-carnet]', d).addEventListener('click', () => { dejaCarnet = true; d.fermer(); });
  const disciplineChoisie = () => form.querySelector('[name="discipline"]:checked')?.value || 'eps';
  let discipline = disciplineActive(); // (mis à jour à chaque choix : la fenêtre n'existe plus une fois fermée)
  d.addEventListener('change', e => {
    if (e.target.closest('[data-rubrique="apparence"]')) appliquerApparence(choisi(), reglagesAppareil(), form.elements.etablissement.value || a.etablissement);
    // (Le nom du carnet en haut de la page suit tout de suite la discipline choisie.)
    if (e.target.name === 'discipline') {
      discipline = disciplineChoisie();
      const h1 = document.querySelector('header h1');
      if (h1?.firstChild?.nodeType === Node.TEXT_NODE) h1.firstChild.textContent = DISCIPLINES[discipline].carnet + ' ';
    }
    const f = e.target.matches('[data-importer-reglages]') && e.target.files[0];
    if (f) { importe = f; d.fermer(); }
  });
  d.addEventListener('input', e => {
    if (e.target.name === 'etablissement') appliquerApparence(choisi(), reglagesAppareil(), e.target.value || a.etablissement);
  });
  const r = await resultat;
  ui.accueilVu = true;
  memoriserUi();
  // La discipline est gardée dès qu'on a répondu (« C'est parti », ou réglages d'un collègue : ils ne la changent pas).
  if (importe || r.action === 'ok') ecrireReglage('discipline', { code: discipline });
  if (importe) {
    await importerReglages(importe).catch(signalerErreur);
  } else if (r.action === 'ok') {
    ecrireReglage('apparence', { ...choisi(), etablissement: r.data.etablissement.trim() || a.etablissement, prof: r.data.prof.trim() });
  }
  // Classe exemple de la discipline (3e d'EPS, 2nde de SVT) créée d'office, même avec « Plus tard » ; supprimable d'un clic.
  // (« Plus tard » ne garde pas la discipline : pas de classe exemple si celle cochée n'est pas celle du carnet.)
  // (Supprimée sur un autre appareil, elle disparaît aussi ici en récupérant le carnet de la clé : ses identifiants sont fixes.)
  // « J'ai déjà un carnet » : pas de classe exemple, on va le chercher (enregistrement.js).
  if (dejaCarnet && typeof recupererCarnetExistant === 'function') {
    appliquerReglages(true);
    rendre();
    return lancer(recupererCarnetExistant); // (attendu par le démarrage : le guide ne s'ouvre qu'après)
  }
  if (discipline === disciplineActive() && !classesTriees().length) {
    ui.classeId = creerClasseExemple().id;
    for (const jeu of exemplesEnPlus()) creerClasseExemple(jeu); // (SVT : une 4e en plus de la 2nde)
    Donnees.antidater('exemple-');
    memoriserUi();
  }
  appliquerReglages(true);
  rendre();
}
