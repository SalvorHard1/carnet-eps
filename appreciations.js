'use strict';
// Appréciations de fin de période (onglet Notes › ✍ Appréciations, et fiche élève des Notes).
// Tout est fait PAR L'APPLI, sur l'appareil, à partir du carnet : rien n'est envoyé nulle part.
//  1. Analyse : pour chaque rubrique (attitude, compétences, motricité, méthodologie, comportement, progression),
//     un niveau de 1 à 4 est calculé à partir des notes, des degrés de maîtrise, des leçons (présence, données
//     relevées) et des mots-clés des observations du prof. Chaque niveau dit d'où il vient.
//  2. Rédaction : des phrases toutes faites, choisies selon le niveau, le ton et le style réglés, assemblées
//     dans l'ordre des rubriques, sans dépasser la longueur maximale.
// Le prof peut changer chaque niveau d'un toucher, demander une autre formulation, ou réécrire le texte.
// Ce qu'il change est gardé dans le carnet (collection `suivis`, donc chiffré sur la clé avec le reste).
// (Fichier chargé avant app.js : il n'utilise les outils d'app.js qu'au moment des appels.)

const RUBRIQUES_APPR = {
  attitude: { nom: 'Attitude', aide: 'engagement, investissement, présence' },
  competences: { nom: 'Compétences', aide: 'degrés de maîtrise' },
  moteur: { nom: 'Motricité', aide: 'performances, notes' },
  methodo: { nom: 'Méthodologie', aide: 'rôles, organisation, sécurité' },
  comportement: { nom: 'Comportement', aide: 'respect des règles et des autres' },
  progression: { nom: 'Progression', aide: 'évolution sur la période' },
  objectif: { nom: 'Objectif', aide: 'piste pour la suite' },
};
const TONS_APPR = { bienveillant: 'Bienveillant', neutre: 'Neutre', exigeant: 'Exigeant' };
const STYLES_APPR = { phrases: 'Phrases (« Léa s’investit… Elle… »)', telegraphique: 'Télégraphique (« Investissement sérieux. »)' };
// Style « Liées » (phrases reliées, voir redigerLieesAppr) : EPS seulement (ses phrases parlent de capacités motrices).
const stylesAppr = () => (profil().appreciations ? STYLES_APPR : { ...STYLES_APPR, liees: 'Liées (« Volontaire et appliquée, Léa s’appuie sur… »)' });
const NOMS_NIV_APPR = { 0: 'non mentionné', 1: 'insuffisant', 2: 'fragile', 3: 'satisfaisant', 4: 'très bien' };
const NOMS_NIV_PROG = { 0: 'non mentionnée', 1: 'en baisse', 2: 'stable', 3: 'en progrès', 4: 'nets progrès' };
const idAppr = (eleveId, periode) => idSuivi(eleveId, 'appréciation ' + periode);
const estSuiviAppr = s => /^appréciation /i.test(s.apsa || '');
// Selon la discipline (discipline.js) : noms des rubriques, phrases et objectifs propres (ex. en SVT, « motricité » → « connaissances »).
const rubriqueAppr = k => ({ ...RUBRIQUES_APPR[k], ...(profil().appreciations?.noms?.[k] || {}) });
// (Phrases propres à la discipline : remplacent celles de l'EPS niveau par niveau ; les niveaux non redéfinis restent communs.)
const phrasesAppr = () => {
  const propres = profil().appreciations?.phrases || {};
  return Object.fromEntries(Object.keys({ ...PHRASES_APPR, ...propres }).map(k => [k, { ...PHRASES_APPR[k], ...(propres[k] || {}) }]));
};
// L'activité (ou le thème) au milieu d'une phrase : « en badminton », « en génétique », « sur le corps humain et la santé ».
// Rien si le nom ne se glisse pas dans une phrase (trop long, virgule, « À la recherche… ») : la phrase reste juste sans lui.
function activiteDansPhrase(nom) {
  const n = String(nom || '').replace(/\s+/g, ' ').trim();
  // (École : la matière arrive déjà en phrase, « en français », « dans « Questionner le monde » » : voir analyserAppr.)
  if (profil().ecole && /^(en|dans) /.test(n)) return ' ' + n.replace(/« /g, '« ').replace(/ »/g, ' »');
  if (!n || estActiviteAutre(n) || n.length > 45 || /[,;:()]/.test(n)) return '';
  const art = /^(le|la|les)\s+(.+)$/i.exec(n) || /^(l[’'])\s*(.+)$/i.exec(n);
  if (art) return ` sur ${art[1].toLocaleLowerCase('fr')}${/[’']$/.test(art[1]) ? '' : ' '}${art[2]}`;
  if (/^(à|au|aux|de|du|des|un|une)\s/i.test(n)) return '';
  return ' en ' + n[0].toLocaleLowerCase('fr') + n.slice(1);
}
const objectifsAppr = () => ({ ...OBJECTIFS_APPR, ...(profil().appreciations?.objectifs || {}) });

// École : portrait de l'élève (pastilles de la fiche : qualités, points d'attention, situations ; discipline.js).
// Gardé dans l'appréciation de la période ; une période sans portrait reprend celui de la dernière période qui en a un.
const portraitProfil = () => profil().appreciations?.portrait || null;
function portraitAppr(eleveId, periode) {
  if (!portraitProfil()) return [];
  const lire = p => Donnees.get('suivis', idAppr(eleveId, p))?.portrait;
  if (Array.isArray(lire(periode))) return lire(periode);
  const ps = periodesAnnee(), k = periode === 'annee' ? ps.length : ps.findIndex(p => p.id === periode);
  for (let i = k - 1; i >= 0; i--) { const x = lire(ps[i].id); if (Array.isArray(x)) return x; }
  // (Rien avant : le portrait choisi pour toute l'année.)
  return (periode !== 'annee' && lire('annee')) || [];
}
// Les pastilles choisies, par groupe (dans l'ordre de discipline.js).
function choixPortrait(portrait) {
  const P = portraitProfil() || {};
  return Object.fromEntries(['qualites', 'attention', 'situations'].map(g => [g, (P[g] || []).filter(x => portrait.includes(x.id))]));
}
// Nom d'un morceau laissé de côté faute de place (« Faute de place, laissé de côté : … »).
function nomMorceauAppr(k) {
  if (k === 'bilan') return 'bilan';
  if (k === 'voix') return 'mot de fin';
  if (k === 'fetes') return 'souhaits de fêtes';
  if (k.startsWith('lien-')) return 'lien avec la période précédente';
  if (k.startsWith('perso-')) return 'ta phrase';
  const P = portraitProfil(), id = k.replace(/^[a-z]+-/, '');
  if (P && /^(portrait|attention|situation)-/.test(k)) return (Object.values(P).flat().find(x => x.id === id)?.nom || id).toLocaleLowerCase('fr');
  return (rubriqueAppr(k).nom || k).toLocaleLowerCase('fr');
}

/* ---------- École : l'appli apprend des corrections de l'enseignant (profil().appreciations.apprendre) ----------
   Quand l'enseignant réécrit une appréciation, la proposition de départ est gardée (champ `base` de l'appréciation).
   En comparant les deux, l'appli retient, sans rien envoyer :
   - les mots ou tournures qu'il remplace (« de bons acquis » → « de bonnes connaissances ») : chez deux élèves au moins,
     le remplacement est fait dans toutes les propositions ; chez un élève, dans les siennes seulement ;
   - les phrases qu'il ajoute pour un élève (« Elle adore les sciences. ») : reproposées en pastilles sur sa carte,
     aux autres périodes (« Tes phrases »). */
const motsBrutsAppr = t => String(t || '').split(/\s+/).filter(Boolean);
// Différences mot à mot (plus longue sous-suite commune) : [{ de: [...], vers: [...] }], les morceaux changés.
function diffMotsAppr(avant, apres) {
  const a = motsBrutsAppr(avant), b = motsBrutsAppr(apres), n = a.length, m = b.length;
  if (n * m > 40000) return [];
  const L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const morceaux = [];
  let i = 0, j = 0, de = [], vers = [];
  const fermer = () => { if (de.length || vers.length) morceaux.push({ de, vers }); de = []; vers = []; };
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) { fermer(); i++; j++; }
    else if (j < m && (i >= n || L[i][j + 1] >= L[i + 1][j])) vers.push(b[j++]);
    else de.push(a[i++]);
  }
  fermer();
  return morceaux;
}
const decouperPhrasesAppr = t => String(t || '').split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(Boolean);
// Deux phrases proches (même idée reformulée) : au moins la moitié de leurs mots en commun.
const prochesAppr = (x, y) => {
  const m = s => new Set(motsBrutsAppr(s.toLocaleLowerCase('fr')).map(w => w.replace(/[^\p{L}’'-]/gu, '')).filter(w => w.length > 2));
  const a = m(x), b = m(y);
  if (!a.size || !b.size) return false;
  let c = 0;
  for (const w of a) if (b.has(w)) c++;
  return c / Math.min(a.size, b.size) >= 0.5;
};
// (Mots à ne jamais apprendre seuls : une correction de il / elle ou d'accord est une erreur de sexe, pas un style.)
const MOTS_NEUTRES_APPR = new Set(['il', 'elle', 'lui', 'le', 'la', 'les', 'un', 'une', 'son', 'sa', 'ses', 'de', 'du', 'des', 'et', 'à', 'en', 'je', 'l’', 'j’']);
const correctionsAppr = () => Donnees.liste('suivis', x => estSuiviAppr(x) && x.texte && x.base && x.texte !== x.base);
let cacheApprisAppr = { cle: null, val: null };
// { tous: [{ de, vers, cle, n }] (vus chez deux élèves au moins), parEleve: Map(eleveId → [{ de, vers, cle }]) }
function apprisAppr() {
  const cle = Donnees.meta().modifieLe + '|' + disciplineActive();
  if (cacheApprisAppr.cle === cle) return cacheApprisAppr.val;
  const vus = new Map(), parEleve = new Map();
  const net = l => l.join(' ').replace(/^[«"(]+/, '').replace(/[.,;:!?»")]+$/, '').trim();
  for (const s of correctionsAppr()) {
    const el = Donnees.get('eleves', s.eleveId);
    if (!el) continue;
    const noms = [el.prenom, el.nom, ...String(el.prenom || '').split(/[\s-]+/)].filter(x => x && x.length > 1);
    for (const h of diffMotsAppr(s.base, s.texte)) {
      if (!h.de.length || !h.vers.length || h.de.length > 4 || h.vers.length > 4) continue;
      const de = net(h.de), vers = net(h.vers), bas = x => x.toLocaleLowerCase('fr');
      if (!de || !vers || de === vers || bas(de).startsWith(bas(vers)) || bas(vers).startsWith(bas(de))) continue;
      if ([de, vers].some(x => MOTS_NEUTRES_APPR.has(bas(x)) || noms.some(nm => x.includes(nm)))) continue;
      const k = de + ' → ' + vers;
      if (!vus.has(k)) vus.set(k, { de, vers, cle: k, eleves: new Set() });
      vus.get(k).eleves.add(el.id);
      if (!parEleve.has(el.id)) parEleve.set(el.id, []);
      if (!parEleve.get(el.id).some(x => x.cle === k)) parEleve.get(el.id).push({ de, vers, cle: k });
    }
  }
  const tous = [...vus.values()].filter(x => x.eleves.size >= 2).map(({ de, vers, cle: k, eleves }) => ({ de, vers, cle: k, n: eleves.size })).sort((x, y) => y.n - x.n);
  cacheApprisAppr = { cle, val: { tous, parEleve } };
  return cacheApprisAppr.val;
}
// Remplacements appris, appliqués à une proposition (mots entiers ; aussi avec une majuscule en début de phrase).
function appliquerApprisAppr(texte, r, eleveId) {
  if (!profil().appreciations?.apprendre || !texte) return texte;
  const { tous, parEleve } = apprisAppr(), oublis = new Set(r.oublis || []);
  const liste = [...(parEleve.get(eleveId) || []), ...tous].filter(x => !oublis.has(x.cle));
  const fait = new Set();
  for (const { de, vers } of liste) {
    if (fait.has(de)) continue;
    fait.add(de);
    const echap = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const maj = s => s[0].toLocaleUpperCase('fr') + s.slice(1);
    texte = texte.replace(new RegExp(`(?<![\\p{L}’'-])${echap(de)}(?![\\p{L}-])`, 'gu'), vers);
    if (de[0] !== maj(de)[0]) texte = texte.replace(new RegExp(`(?<![\\p{L}’'-])${echap(maj(de))}(?![\\p{L}-])`, 'gu'), maj(vers));
  }
  return texte;
}
// Phrases ajoutées par l'enseignant pour cet élève, aux autres périodes (les plus récentes d'abord, 6 au plus).
function phrasesEleveAppr(eleveId, periode) {
  if (!profil().appreciations?.apprendre) return [];
  const sortie = [];
  for (const s of correctionsAppr().filter(x => x.eleveId === eleveId && x.periode !== periode).sort((x, y) => (y.maj || 0) - (x.maj || 0))) {
    const base = decouperPhrasesAppr(s.base);
    for (const ph of decouperPhrasesAppr(s.texte)) {
      if (ph.length < 12 || ph.length > 200 || base.some(b => b === ph || prochesAppr(b, ph)) || sortie.some(x => prochesAppr(x, ph))) continue;
      sortie.push(ph);
    }
  }
  return sortie.slice(0, 6);
}
// Remplacements appris, dans les réglages : décocher l'un d'eux le fait oublier (r.oublis).
let apprisOuvertAppr = false;
function htmlApprisAppr(r) {
  if (!profil().appreciations?.apprendre) return '';
  const { tous } = apprisAppr(), oublis = new Set(r.oublis || []);
  return `<details class="appris-appr" data-appr-appris ${apprisOuvertAppr ? 'open' : ''}><summary>🧠 Ce que l’appli a appris de tes corrections <small>${tous.length ? tous.length + ' tournure' + (tous.length > 1 ? 's' : '') : 'rien pour l’instant'}</small></summary>
    <p class="aide">Quand tu remplaces un mot ou une tournure chez au moins deux élèves, l’appli le fait ensuite d’elle-même (chez un seul élève : pour lui seulement).
      Les phrases que tu ajoutes pour un élève lui sont reproposées aux autres périodes (« Tes phrases », sur sa carte). Décoche ce qui ne te convient pas.</p>
    ${tous.map(x => `<label class="case"><input type="checkbox" name="appr-appris" value="${esc(x.cle)}" ${oublis.has(x.cle) ? '' : 'checked'}> « ${esc(x.de)} » → « ${esc(x.vers)} » <span class="aide">(${x.n} élèves)</span></label>`).join('')}
  </details>`;
}
document.addEventListener('toggle', e => { if (e.target.matches?.('[data-appr-appris]')) apprisOuvertAppr = e.target.open; }, true);

/* ---------- Réglages ---------- */

function reglageAppr() {
  const r = reglage('appreciations'), propres = profil().appreciations?.rubriques;
  // École : ses propres rubriques (discipline.js). Un réglage enregistré avant elles (sans « autonomie ») repart
  // de celles cochées d'origine, et de la longueur d'origine de l'école.
  if (propres && !r.ordre.includes('autonomie')) {
    r.ordre = [...propres]; r.actives = [...profil().appreciations.actives]; r.longueur = profil().appreciations.longueur || r.longueur;
  }
  const connues = propres || Object.keys(RUBRIQUES_APPR);
  // Rubriques : toutes présentes une fois, dans l'ordre choisi (les inconnues sont retirées).
  r.ordre = [...new Set([...r.ordre.filter(k => connues.includes(k)), ...connues])];
  r.actives = r.actives.filter(k => connues.includes(k));
  if (!TONS_APPR[r.ton]) r.ton = 'bienveillant';
  if (!stylesAppr()[r.style]) r.style = 'phrases';
  // (Anciens défauts, 400 puis 300 caractères : ils passent à 250, la limite d'École Directe ; une autre valeur choisie est gardée.)
  r.longueur = Math.max(80, Math.min(2000, +r.longueur === 400 || +r.longueur === 300 || !+r.longueur ? 250 : +r.longueur));
  return r;
}

function htmlReglageAppr(r) {
  return `
    <p class="aide">Coche les rubriques à aborder, et range-les dans l’ordre voulu (↑ ↓). Si la place manque,
      les dernières rubriques sont laissées de côté (l’objectif est gardé jusqu’au bout).
      Une rubrique décochée n’est jamais mentionnée. Si ce que tu as rempli (observations, mots-clés…) signale une difficulté dans une rubrique cochée, elle passe en priorité (⚠) ; touche-la jusqu’à « non mentionné » pour l’écarter.</p>
    <ol class="rubriques-appr">${r.ordre.map((k, i) => `<li>
      <label class="case"><input type="checkbox" name="appr-${k}" ${r.actives.includes(k) ? 'checked' : ''}>
        <b>${esc(rubriqueAppr(k).nom)}</b> <span class="aide">${esc(rubriqueAppr(k).aide)}</span></label>
      <span class="espace"></span>
      <button type="button" class="icone-petit" data-appr-monter="${k}" ${i ? '' : 'disabled'} aria-label="Monter ${esc(rubriqueAppr(k).nom)}">↑</button>
      <button type="button" class="icone-petit" data-appr-descendre="${k}" ${i < r.ordre.length - 1 ? '' : 'disabled'} aria-label="Descendre ${esc(rubriqueAppr(k).nom)}">↓</button>
      <input type="hidden" name="appr-ordre" value="${k}"></li>`).join('')}</ol>
    <label class="case"><input type="checkbox" name="appr-bilan" ${r.bilan ? 'checked' : ''}> Commencer par un bilan général (« ${profil().appreciations?.ouvertures ? 'Excellent début d’année !' : 'Léa réalise un bon trimestre.'} »)</label>
    ${profil().appreciations?.fins ? `<label class="case"><input type="checkbox" name="appr-voix" ${r.voix ? 'checked' : ''}> Finir en mon nom (« Je la félicite et l’encourage à poursuivre. »)</label>
    <label class="case"><input type="checkbox" name="appr-fetes" ${r.fetes ? 'checked' : ''}> Souhaiter de bonnes fêtes pour la période qui finit en décembre</label>
    ${profil().appreciations?.liens ? `<label class="case"><input type="checkbox" name="appr-liens" ${r.liens ? 'checked' : ''}> Faire le lien avec la période précédente (« Il a pris confiance en lui depuis le premier trimestre. »)</label>` : ''}` : ''}
    ${htmlApprisAppr(r)}
    <div class="ligne">
      <label>Ton<select name="appr-ton">${Object.entries(TONS_APPR).map(([v, n]) => `<option value="${v}" ${r.ton === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label>Style<select name="appr-style">${Object.entries(stylesAppr()).map(([v, n]) => `<option value="${v}" ${r.style === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="etroit">Longueur max.<input type="number" name="appr-longueur" min="80" max="2000" step="10" value="${r.longueur}"></label>
      <span class="aide">caractères (limite du bulletin)</span>
    </div>`;
}

// Lit les réglages dans un formulaire (fenêtre des appréciations ou ⚙ Réglages du carnet).
function lireReglageAppr(form) {
  const ordre = [...form.querySelectorAll('[name="appr-ordre"]')].map(x => x.value);
  return {
    ordre, actives: ordre.filter(k => form.elements['appr-' + k]?.checked),
    bilan: !!form.elements['appr-bilan']?.checked,
    ton: form.elements['appr-ton']?.value || 'bienveillant', style: form.elements['appr-style']?.value || 'phrases',
    longueur: Math.max(80, Math.min(2000, +form.elements['appr-longueur']?.value || 250)),
    // (École seulement : cases absentes ailleurs, la valeur enregistrée est alors gardée.)
    ...(form.elements['appr-voix'] ? { voix: form.elements['appr-voix'].checked } : {}),
    ...(form.elements['appr-fetes'] ? { fetes: form.elements['appr-fetes'].checked } : {}),
    ...(form.elements['appr-liens'] ? { liens: form.elements['appr-liens'].checked } : {}),
    // (Remplacements appris : ceux décochés ici, et ceux déjà oubliés qui ne sont plus montrés.)
    ...(form.querySelector('[name="appr-appris"]') ? { oublis: [...new Set([...(reglage('appreciations').oublis || []).filter(k => !form.querySelector(`[name="appr-appris"][value="${CSS.escape(k)}"]`)), ...[...form.querySelectorAll('[name="appr-appris"]:not(:checked)')].map(x => x.value)])] } : {}),
  };
}

// Boutons ↑ ↓ : déplacent la ligne dans la liste (l'ordre est relu dans les champs cachés).
function deplacerRubriqueAppr(bouton) {
  const li = bouton.closest('li'), liste = li.parentElement;
  if (bouton.dataset.apprMonter && li.previousElementSibling) liste.insertBefore(li, li.previousElementSibling);
  if (bouton.dataset.apprDescendre && li.nextElementSibling) liste.insertBefore(li.nextElementSibling, li);
  [...liste.children].forEach((x, i, t) => {
    x.querySelector('[data-appr-monter]').disabled = i === 0;
    x.querySelector('[data-appr-descendre]').disabled = i === t.length - 1;
  });
}

/* ---------- Analyse : un niveau par rubrique, calculé à partir du carnet ---------- */

// Mots-clés cherchés dans les observations du prof (sans accents). Les tournures négatives sont lues d'abord
// (« peu investi » ne compte pas comme « investi »), et « pas / plus / jamais » juste avant un mot l'annule.
const MOTS_APPR = {
  attitude: {
    moins: ['peu investi', 'manque d\'investissement', 'manque d\'engagement', 'manque de motivation', 'passif', 'passive', 'demotive',
      'n\'essaie pas', 'ne fait rien', 'ne participe pas', 'refuse de', 'oubli de tenue', 'sans tenue', 'pas de tenue', 'tenue oubliee', 'nonchalant', 'traine', 'baisse les bras',
      'non rendu', 'pas rendu', 'oubli du materiel', 'materiel oublie', 'pas de materiel', 'travail non fait'],
    plus: ['investi', 'implique', 'motive', 'dynamique', 'volontaire', 'enthousias', 'serieux', 'serieuse', 'perseverant', 'engage', 'element moteur', 'appliqu'],
  },
  comportement: {
    moins: ['bavard', 'agite', 'insolen', 'irrespect', 'perturb', 'dissip', 'conflit', 'provoc', 'triche', 'violen', 'impoli', 'exclu',
      'avertissement', 'punition', 'retenue', 'insulte', 'moqu', 'ne respecte pas', 'manque de respect'],
    plus: ['respectueu', 'poli', 'calme', 'fair-play', 'fair play', 'exemplaire', 'aide ses camarades', 'bienveillant', 'solidaire'],
  },
};

function motsCles(textes, liste) {
  let plus = 0, moins = 0;
  const trouves = [];
  for (const brut of textes) {
    let t = ' ' + sansAccent(brut) + ' ';
    for (const m of liste.moins) {
      let i;
      while ((i = t.indexOf(m)) >= 0) { moins++; trouves.push('« ' + m + ' »'); t = t.slice(0, i) + ' '.repeat(m.length) + t.slice(i + m.length); }
    }
    for (const m of liste.plus) {
      let i = -1;
      while ((i = t.indexOf(m, i + 1)) >= 0) {
        const avant = t.slice(Math.max(0, i - 14), i);
        if (/\b(pas|plus|jamais|moins|peu)\s+(tres\s+|assez\s+|toujours\s+)?$/.test(avant)) { moins++; trouves.push('« …' + m + ' » (négatif)'); }
        else { plus++; trouves.push('« ' + m + ' »'); }
      }
    }
  }
  return { plus, moins, trouves: [...new Set(trouves)] };
}

// Catégorie d'une compétence ou d'une donnée relevée en leçon, d'après son intitulé.
const RE_METHODO = /role|arbitr|juge|jury|coach|observ|chronom|secretaire|entrain|programme|planifi|echauff|preparation|projet|securite|assurage|filmer|mesurer|organis|analys|methode|protocole|hypothese|experi|demarche|manipul|strategie/;
const RE_COMPORTEMENT = /respect|solidaire|accepter le resultat|accepter de se produire|comportement|fair|citoyen/;
const RE_ATTITUDE = /attitude|engagement|investissement|implication|motivation|participation/;
const categorieAppr = texte => {
  const t = sansAccent(texte);
  if (profil().ecole && /autonom|initiative/.test(t)) return 'autonomie'; // (rubrique du carnet École)
  return RE_ATTITUDE.test(t) ? 'attitude' : RE_COMPORTEMENT.test(t) ? 'comportement' : RE_METHODO.test(t) ? 'methodo' : 'moteur';
};

const moyenneListe = l => (l.length ? l.reduce((a, b) => a + b, 0) / l.length : null);
const niveauDegre = x => (x === null ? null : x >= 3.5 ? 4 : x >= 2.75 ? 3 : x >= 2 ? 2 : 1);
const fmtD = x => fmt(Math.round(x * 10) / 10);

// Position de l'élève dans sa classe, sur la même période (ici et dans l'espace PP, pp.js) : un 10,9 dans une classe
// à 12,5 de moyenne n'a pas un trimestre « satisfaisant ». moyennes : celles de toute la classe (l'élève compris) ;
// moyClasse : celle du bulletin, si elle est connue. Il faut au moins 5 moyennes pour un rang.
// cle : 'retrait' dès 0,5 point sous la moyenne de la classe ; 'tete' dès 2 points au-dessus, dans le premier tiers.
const POSITION_CLASSE = { retrait: -0.5, plafond2: -1.5, nettement: -2, tete: 2 };
function positionClasse(moy, moyennes, moyClasse = null) {
  const l = moyennes.filter(v => v !== null && v !== undefined);
  if (moy === null || moy === undefined || (l.length < 5 && (moyClasse === null || moyClasse === undefined))) return null;
  const m = moyClasse ?? moyenneListe(l), ecart = moy - m;
  const n = l.length >= 5 ? l.length : null, rang = n ? 1 + l.filter(v => v > moy + 1e-9).length : null;
  const cle = ecart <= POSITION_CLASSE.retrait ? 'retrait' : ecart >= POSITION_CLASSE.tete && (!n || rang <= Math.ceil(n / 3)) ? 'tete' : '';
  // (Nettement en retrait : 2 points sous la moyenne de la classe, et dans le dernier quart.)
  const nettement = ecart <= POSITION_CLASSE.nettement && (!n || rang > n - Math.ceil(n / 4));
  return { moyClasse: m, ecart, rang, n, cle, nettement };
}
// Niveau tiré de la moyenne, corrigé par la position dans la classe : en retrait, jamais 4 (et pas plus de 2 dès
// 1,5 point sous la moyenne de la classe) ; nettement au-dessus de la classe, un cran de plus.
function niveauSelonClasse(n, pos) {
  if (!n || !pos?.cle) return n;
  if (pos.cle === 'tete') return Math.min(4, n + 1);
  return Math.min(n, pos.ecart <= POSITION_CLASSE.plafond2 ? 2 : 3);
}
const textePositionClasse = pos => (pos ? `Classe : moyenne ${fmtD(pos.moyClasse)}${pos.rang ? `, rang ${pos.rang}/${pos.n}` : ''}, écart ${pos.ecart >= 0 ? '+' : '−'}${fmtD(Math.abs(pos.ecart))}`
  + (pos.cle === 'retrait' ? ' → en retrait par rapport à la classe' : pos.cle === 'tete' ? ' → parmi les meilleurs de la classe' : '') : '');

function evalsPeriode(classeId, periode) {
  const toutes = evalsDe(classeId);
  return periode === 'annee' ? toutes : toutes.filter(e => periodeDe(e.date) === periode);
}
function seancesPeriode(classeId, periode) {
  const toutes = seancesDe(classeId);
  return periode === 'annee' ? toutes : toutes.filter(s => periodeDe(s.date) === periode);
}

// → { niveaux: {rubrique: 1..4 | null}, sources: {rubrique: texte}, defaut: {rubrique: true}, details: {...} }
// Ids des élèves dans l'ordre alphabétique (nom, prénom, id) ; gardé pour chaque liste (appelé pour chaque élève).
const ordresAlphaAppr = new WeakMap();
function ordreAlphaAppr(eleves) {
  if (!ordresAlphaAppr.has(eleves)) ordresAlphaAppr.set(eleves, [...eleves]
    .sort((x, y) => `${x.nom} ${x.prenom}`.localeCompare(`${y.nom} ${y.prenom}`, 'fr') || String(x.id).localeCompare(String(y.id))).map(x => x.id));
  return ordresAlphaAppr.get(eleves);
}

function analyserAppr(el, periode, eleves, sansAvant = false) {
  const c = Donnees.get('classes', el.classeId);
  const evals = evalsPeriode(el.classeId, periode), seances = seancesPeriode(el.classeId, periode);
  const niveaux = {}, sources = {}, defaut = {}, details = {};
  const degres = { attitude: [], competences: [], moteur: [], methodo: [], comportement: [], autonomie: [] };
  const ecole = !!profil().ecole, profilAppr = profil().appreciations || {};
  let mieux = 0, pire = 0;

  // Notes
  const moy = moyenneEleve(el.id, evals);
  let absNotes = 0;
  // (Travail non rendu — code NR — : pris en compte dans l'attitude, comme les observations « non rendu ».)
  const nonRendus = [];
  for (const e of evals) {
    const v = Donnees.note(e.id, el.id);
    if (v === 'ABS') absNotes++;
    if (v === 'NR') nonRendus.push('non rendu');
  }
  // Moyenne par APSA (pour citer la meilleure ou la plus fragile)
  const parApsa = new Map();
  for (const e of evals) { const a = (e.apsa || '').trim(); if (a && !estActiviteAutre(a)) parApsa.set(a, [...(parApsa.get(a) || []), e]); }
  const moyApsa = [...parApsa].map(([a, l]) => ({ a, m: moyenneEleve(el.id, l) })).filter(x => x.m !== null);

  // Degrés de maîtrise des évaluations : dernier degré de chaque compétence, et son évolution.
  // saisi : rubriques appuyées sur ce que l'enseignant a rempli lui-même (degré choisi à la main, donnée de leçon,
  // observation, absence, note) — pas sur un degré pré-rempli d'après la note. Seules elles font un point de vigilance.
  const saisi = { moteur: true, progression: true };
  const comps = new Map();
  for (const e of evals) for (const a of competencesEval(e)) {
    const v = Donnees.note(e.id, el.id, a.id);
    if (!v) continue;
    if (!comps.has(a.id)) comps.set(a.id, { a, valeurs: [] });
    comps.get(a.id).valeurs.push(+v);
    comps.get(a.id).auto = !!Donnees.noteComplete(e.id, el.id, a.id)?.auto;
  }
  const faibles = [];
  for (const { a, valeurs, auto } of comps.values()) {
    const der = valeurs.at(-1);
    degres.competences.push(der);
    degres[categorieAppr(a.texte)].push(der);
    if (!auto) { saisi.competences = true; saisi[categorieAppr(a.texte)] = true; }
    if (valeurs.length > 1) { if (der > valeurs[0]) mieux++; else if (der < valeurs[0]) pire++; }
    if (der < 3) faibles.push({ texte: a.texte, cat: categorieAppr(a.texte), v: der });
  }

  // Leçons : présence, données relevées (échelles 1 à 4, performances), observations écrites.
  let presences = 0, abs = 0;
  const observations = [];
  const parIndic = new Map();
  for (const s of seances) {
    const st = statutEnt(s.id, el.id);
    if (st) { if (st === 'ABS') abs++; if (st === 'NR') nonRendus.push('non rendu'); continue; }
    presences++;
    for (const ind of s.indicateurs || []) {
      if (statutCase(Donnees.note(s.id, el.id, ind.id) || '') === 'NR') nonRendus.push('non rendu');
      const v = valeurCase(s.id, el.id, ind.id);
      if (!v) continue;
      if (ind.type === 'texte') { observations.push(v); continue; }
      // (Réponses de liste lues aussi pour les mots-clés : ex. « Non rendu » pour le travail rendu en SVT.)
      if (ind.type === 'choix' && !ind.medaille) observations.push(v);
      const k = cleIndic(ind);
      if (!parIndic.has(k)) parIndic.set(k, { ind, valeurs: [] });
      parIndic.get(k).valeurs.push(v);
    }
  }
  for (const { ind, valeurs } of parIndic.values()) {
    if (ind.type === 'echelle') {
      const der = +valeurs.at(-1);
      if (!(der >= 1 && der <= 4)) continue;
      const cat = ind.etape ? 'moteur' : categorieAppr(ind.nom);
      degres[cat].push(der);
      degres.competences.push(der);
      saisi[cat] = saisi.competences = true;
      if (der < 3) faibles.push({ texte: ind.etape ? texteIndic(ind) : ind.nom, cat, v: der, indic: !ind.etape });
    }
    // Médaille (dernière obtenue) : bronze → degré 2, argent → 3, or → 4, côté motricité.
    if (ind.medaille) {
      const k = MEDAILLES.indexOf(valeurs.at(-1));
      if (k >= 0) degres.moteur.push(k + 2);
    }
    const sens = sensProgres(ind);
    if (sens && valeurs.length > 1 && (ind.type !== 'choix' || ind.medaille)) {
      const a = valeurComparable(ind, valeurs[0]), b = valeurComparable(ind, valeurs.at(-1));
      if (a !== null && b !== null && a !== b) { if ((b - a) * sens > 0) mieux++; else pire++; }
    }
  }
  // Observations du prof : celles des leçons de la période, et ses fiches (modifiées pendant la période).
  // (Pas l'espace professeur principal, pp.js : appréciation générale, bulletins, suivi.)
  for (const s of Donnees.liste('suivis', x => x.eleveId === el.id && x.texte && !estSuiviAppr(x) && !x.pp)) {
    if (periode === 'annee' || !s.maj || periodeDe(new Date(s.maj).toLocaleDateString('sv')) === periode) observations.push(s.texte);
  }
  observations.push(...nonRendus);

  // Motricité : moyenne de la période (seuils note → degré de la classe), sinon degrés « moteurs ».
  const seuils = seuilsClasse(c);
  if (moy !== null) {
    const brut = moy >= seuils[2] ? 4 : moy >= seuils[1] ? 3 : moy >= seuils[0] ? 2 : 1;
    // (Comparée à toute la classe sur les mêmes évaluations ; pas à l'école : sansClasse, discipline.js.)
    const pos = profilAppr.sansClasse ? null : positionClasse(moy, elevesDe(el.classeId).map(x => (x.id === el.id ? moy : moyenneEleve(x.id, evals))));
    details.position = pos;
    niveaux.moteur = niveauSelonClasse(brut, pos);
    sources.moteur = `Moyenne ${fmtD(moy)}/20 (seuils de la classe : ${seuils.map(fmt).join(' / ')})`
      + (pos ? `\n${textePositionClasse(pos)}${niveaux.moteur !== brut ? ` (niveau ${brut} d’après les seuils, ${niveaux.moteur} retenu)` : ''}` : '');
  } else if (degres.moteur.length) {
    const m = moyenneListe(degres.moteur);
    niveaux.moteur = niveauDegre(m);
    sources.moteur = `Pas de note : moyenne des degrés « ${rubriqueAppr('moteur').nom.toLocaleLowerCase('fr')} » ${fmtD(m)}`;
  }
  if (ecole) {
    // École : les matières (« en français »…), pas les activités. Niveau d'une matière : moyenne des derniers degrés
    // de ses domaines, sinon sa moyenne des notes (seuils de la classe). La plus réussie est citée dans les
    // apprentissages ; la plus fragile fait la rubrique « À consolider » (dès un demi-degré d'écart).
    const parMatiere = new Map();
    for (const e of [...evals].sort((x, y) => (x.date || '').localeCompare(y.date || ''))) {
      const ph = typeof EN_MATIERE === 'object' ? EN_MATIERE[e.ca] : null;
      if (!ph) continue;
      const m = parMatiere.get(ph) || { der: new Map(), evals: [] };
      for (const at of competencesEval(e)) { const v = +Donnees.note(e.id, el.id, at.id); if (v >= 1 && v <= 4) m.der.set(at.id, v); }
      m.evals.push(e);
      parMatiere.set(ph, m);
    }
    const scores = [...parMatiere].map(([ph, m]) => {
      let s = m.der.size ? moyenneListe([...m.der.values()]) : null;
      if (s === null) { const mo = moyenneEleve(el.id, m.evals); if (mo !== null) s = mo >= seuils[2] ? 4 : mo >= seuils[1] ? 3 : mo >= seuils[0] ? 2 : 1; }
      return { ph, s };
    }).filter(x => x.s !== null).sort((x, y) => y.s - x.s);
    // Apprentissages de la période précédente (degré moyen) : pour « des résultats tout aussi bons qu’au 1er trimestre ».
    const ps = periodesAnnee(), kp = ps.findIndex(p => p.id === periode);
    if (kp > 0) {
      const der = new Map();
      for (const e of evalsPeriode(el.classeId, ps[kp - 1].id)) for (const at of competencesEval(e)) { const v = +Donnees.note(e.id, el.id, at.id); if (v >= 1 && v <= 4) der.set(at.id, v); }
      if (der.size) details.niveauAvant = moyenneListe([...der.values()]);
    }
    details.scoresMatieres = Object.fromEntries(scores.map(x => [x.ph, x.s]));
    if (scores.length === 1) details.apsaSeule = scores[0].ph;
    else if (scores.length > 1) {
      const fort = scores[0], faible = scores.at(-1);
      if (fort.s >= 2.75 && fort.s > faible.s) details.apsaForte = fort.ph;
      if (fort.s - faible.s >= 0.5) {
        details.apsaFaible = faible.ph;
        niveaux.consolider = niveauDegre(faible.s);
        saisi.consolider = true;
        sources.consolider = 'Degré moyen par matière : ' + scores.map(x => `${x.ph.replace(/^(en|dans) /, '')} ${fmtD(x.s)}`).join(' · ');
      }
    }
  } else if (moyApsa.length > 1) {
    const tri = [...moyApsa].sort((x, y) => y.m - x.m);
    details.apsaForte = tri[0].a; details.apsaFaible = tri.at(-1).a;
  } else {
    const apsas = [...new Set([...evals.map(e => (e.apsa || '').trim()), ...seances.map(s => (s.apsa || '').trim())].filter(a => a && !estActiviteAutre(a)))];
    if (apsas.length === 1) details.apsaSeule = apsas[0];
  }

  // Compétences : moyenne des derniers degrés relevés (évaluations et leçons).
  if (degres.competences.length) {
    const m = moyenneListe(degres.competences);
    niveaux.competences = niveauDegre(m);
    details.degreMoyen = m; // (valeur exacte, pour la synthèse graphique de la fiche bilan)
    const validees = degres.competences.filter(v => v >= 3).length;
    sources.competences = `${validees}/${degres.competences.length} au degré 3 ou 4 · degré moyen ${fmtD(m)}`;
  }

  // Méthodologie : rôles, organisation, sécurité (compétences et données de leçon de ce type).
  if (degres.methodo.length) {
    const m = moyenneListe(degres.methodo);
    niveaux.methodo = niveauDegre(m);
    sources.methodo = `Degré moyen ${fmtD(m)} sur ${degres.methodo.length} critère${degres.methodo.length > 1 ? 's' : ''} (${rubriqueAppr('methodo').aide})`;
  }

  // Attitude : critère « attitude / engagement » relevé en leçon, présence, mots-clés des observations.
  {
    const mots = motsCles(observations, MOTS_APPR.attitude), morceaux = [];
    let n = null;
    if (degres.attitude.length) { n = niveauDegre(moyenneListe(degres.attitude)); morceaux.push(`critère engagement : degré ${fmtD(moyenneListe(degres.attitude))}`); }
    const total = presences + abs;
    if (total) {
      const taux = presences / total;
      morceaux.push(`${Math.round(taux * 100)} % de ${mot('presenceLecons')}`);
      if (n === null) n = 3;
      // (Seules les absences comptent, pas les blessures ni les maladies ; une absence isolée ne suffit pas.)
      if (abs >= 3 || (abs >= 2 && taux < 0.8)) { n = Math.min(n, 2); saisi.attitude = true; }
    }
    if (absNotes) morceaux.push(`${absNotes} absence${absNotes > 1 ? 's' : ''} à une évaluation`);
    // Blessé / malade : signalé pour mémoire, sans baisser le niveau (ce n'est pas un manque d'engagement).
    const sante = typeof bilanLecons === 'function' ? bilanLecons(el, periode).sante : 0;
    const santeNotes = evals.filter(e => ['BLE', 'MAL'].includes(Donnees.note(e.id, el.id))).length;
    if (sante + santeNotes) morceaux.push(`${motifsSante()} : ${sante + santeNotes} fois (${mot('lecons').toLocaleLowerCase('fr')} et évaluations), sans effet sur ce niveau`);
    if (mots.plus || mots.moins) {
      morceaux.push('observations : ' + mots.trouves.join(', ')); saisi.attitude = true;
      n = Math.max(1, Math.min(4, (n ?? 3) + Math.sign(mots.plus - mots.moins) * (Math.abs(mots.plus - mots.moins) >= 2 ? 2 : 1)));
    }
    if (n === null) { n = 3; defaut.attitude = true; morceaux.push('aucune donnée : niveau par défaut, à vérifier'); }
    niveaux.attitude = n; sources.attitude = morceaux.join(' · ');
    details.absences = abs + absNotes;
  }

  // Comportement : critère relevé en leçon, compétences « respect », mots-clés des observations.
  {
    const mots = motsCles(observations, MOTS_APPR.comportement), morceaux = [];
    let n = null;
    if (degres.comportement.length) { n = niveauDegre(moyenneListe(degres.comportement)); morceaux.push(`critères respect / comportement : degré ${fmtD(moyenneListe(degres.comportement))}`); }
    if (mots.plus || mots.moins) {
      morceaux.push('observations : ' + mots.trouves.join(', ')); saisi.comportement = true;
      n = Math.max(1, Math.min(4, (n ?? 3) + Math.sign(mots.plus - mots.moins) * (Math.abs(mots.plus - mots.moins) >= 2 ? 2 : 1)));
    }
    if (n === null) { n = 3; defaut.comportement = true; morceaux.push('aucune donnée : niveau par défaut, à vérifier'); }
    niveaux.comportement = n; sources.comportement = morceaux.join(' · ');
  }

  // École : autonomie et soin, d'après les degrés de ce type et les mots-clés des observations (discipline.js › mots).
  // Sans rien de rempli : non mentionné (touche la rubrique pour lui donner un niveau).
  for (const [k, liste] of Object.entries(profilAppr.mots || {})) {
    const mots = motsCles(observations, liste), morceaux = [];
    let n = niveaux[k] ?? null;
    if (n === null && degres[k]?.length) { n = niveauDegre(moyenneListe(degres[k])); sources[k] = `Degré moyen ${fmtD(moyenneListe(degres[k]))}`; }
    if (sources[k]) morceaux.push(sources[k]);
    if (mots.plus || mots.moins) {
      morceaux.push('observations : ' + mots.trouves.join(', ')); saisi[k] = true;
      n = Math.max(1, Math.min(4, (n ?? 3) + Math.sign(mots.plus - mots.moins) * (Math.abs(mots.plus - mots.moins) >= 2 ? 2 : 1)));
    }
    if (n !== null) { niveaux[k] = n; sources[k] = morceaux.join(' · '); }
  }

  // Progression : écart avec la période précédente, sinon tendance des notes de la période ; degrés et performances.
  {
    const morceaux = [];
    let d = null;
    const periodes = periodesAnnee(), k = periodes.findIndex(p => p.id === periode);
    if (k > 0) {
      const avant = moyenneEleve(el.id, evalsPeriode(el.classeId, periodes[k - 1].id));
      if (avant !== null && moy !== null) { d = moy - avant; morceaux.push(`${periodes[k - 1].code} ${fmtD(avant)} → ${periodes[k].code} ${fmtD(moy)}`); }
    }
    if (d === null) {
      const notes = evals.filter(e => !e.nonSignificative).map(e => sur20(e, Donnees.note(e.id, el.id))).filter(n => n !== null);
      const t = tendanceNotes(notes);
      if (t !== null) { d = t; morceaux.push(`tendance des notes ${t >= 0 ? '+' : ''}${fmtD(t)}`); }
    }
    let n1 = d === null ? null : d >= 2.5 ? 4 : d >= 1 ? 3 : d > -1.5 ? 2 : 1, n2 = null;
    if (mieux + pire) {
      const r = (mieux - pire) / (mieux + pire);
      n2 = r >= 0.5 ? 4 : r >= 0.15 ? 3 : r > -0.15 ? 2 : 1;
      morceaux.push(`${mieux} critère${mieux > 1 ? 's' : ''} en progrès, ${pire} en baisse (degrés, performances)`);
    }
    if (n1 !== null || n2 !== null) {
      niveaux.progression = n1 !== null && n2 !== null ? Math.round((n1 + n2) / 2) : n1 ?? n2;
      sources.progression = morceaux.join(' · ');
    }
  }

  // École : place de l'élève dans la liste de la classe (les élèves se partagent les tournures, voir redigerAppr),
  // et ce que disait la période précédente (lien entre les périodes : niveaux des rubriques, matière fragile).
  // Ailleurs (depuis la v1.38.0), même partage, d'après l'ordre alphabétique de la classe : il ne dépend pas de la liste
  // transmise (fenêtre, fiche, bilan PP…), donc chaque élève garde la même proposition partout.
  details.rang = !Array.isArray(eleves) ? -1 : profilAppr.textesDifferents ? eleves.findIndex(x => x.id === el.id)
    : ordreAlphaAppr(eleves).indexOf(el.id);
  if (profilAppr.liens && !sansAvant && periode !== 'annee') {
    const ps = periodesAnnee(), kp = ps.findIndex(p => p.id === periode);
    if (kp > 0) {
      const id = ps[kp - 1].id, av = analyserAppr(el, id, eleves, true), perso = Donnees.get('suivis', idAppr(el.id, id))?.niveaux || {};
      const nivAvant = { ...av.niveaux };
      for (const [k, v] of Object.entries(perso)) nivAvant[k] = v || null;
      details.avant = { periode: id, niveaux: nivAvant, defaut: Object.fromEntries(Object.keys(av.defaut).filter(k => !(k in perso)).map(k => [k, true])), apsaFaible: av.details.apsaFaible };
    }
  }
  details.faibles = faibles.sort((a, b) => a.v - b.v);
  details.saisi = saisi;
  details.moyenne = moy;
  sources.objectif = 'Choisi d’après la rubrique la plus faible';
  return { niveaux, sources, defaut, details };
}

/* ---------- Rédaction ---------- */

// Phrases : {S} sujet (prénom la 1re fois, puis Il / Elle), {s} idem en minuscule, {P} prénom,
// {apsa} « en badminton » ou « , notamment en badminton », {ce} « ce trimestre » / « cette année ».
// Niveaux 1 et 2 : une liste par ton (b bienveillant, n neutre, x exigeant). Style télégraphique : listes `t`.
const PHRASES_APPR = {
  attitude: {
    4: { p: ['{S} s’investit pleinement dans toutes les activités.', '{S} fait preuve d’un engagement exemplaire en cours.', '{S} montre un investissement remarquable et constant.', 'L’investissement est exemplaire dans toutes les activités.'],
      t: ['Investissement exemplaire.', 'Engagement remarquable.'] },
    3: { p: ['{S} s’investit avec sérieux en cours.', '{S} montre un engagement régulier.', '{S} participe avec envie aux activités proposées.', 'L’engagement en cours est sérieux et régulier.'],
      t: ['Investissement sérieux.', 'Bon engagement en cours.'] },
    2: { p: { b: ['{S} doit gagner en régularité dans son engagement.', '{S} s’investit, mais de façon encore irrégulière.'],
      n: ['{S} s’investit de manière irrégulière.', 'L’engagement en cours reste irrégulier.'],
      x: ['{S} doit s’investir davantage en cours.', '{S} manque trop souvent d’engagement.'] },
    t: { b: ['Engagement à rendre plus régulier.'], n: ['Engagement irrégulier.'], x: ['Manque d’investissement.', 'Engagement trop irrégulier.'] } },
    1: { p: { b: ['{S} doit trouver davantage d’envie pour s’engager en cours.', '{S} a du mal à s’engager : il faut s’accrocher.'],
      n: ['{S} s’investit trop peu en cours.'],
      x: ['L’investissement est très insuffisant.', '{S} ne s’investit pas suffisamment en cours.'] },
    t: { b: ['Engagement à retrouver.'], n: ['Investissement trop faible.', 'Engagement trop faible.'], x: ['Investissement très insuffisant.', 'Engagement à retrouver d’urgence.'] } },
  },
  competences: {
    4: { p: ['{S} maîtrise très bien les compétences travaillées.', 'Les compétences visées sont très bien maîtrisées.', '{S} maîtrise parfaitement les compétences travaillées.'], t: ['Compétences très bien maîtrisées.', 'Excellente maîtrise des compétences.'] },
    3: { p: ['{S} maîtrise de façon satisfaisante les compétences travaillées.', 'Les compétences visées sont globalement acquises.', '{S} montre un bon niveau de maîtrise des compétences travaillées.'], t: ['Compétences acquises.', 'Bonne maîtrise des compétences.'] },
    2: { p: { b: ['Les compétences sont en cours d’acquisition, à consolider.', '{S} est en bonne voie dans l’acquisition des compétences.'],
      n: ['La maîtrise des compétences reste fragile.', 'Les compétences sont partiellement acquises.'], x: ['La maîtrise des compétences est encore trop fragile.', 'La maîtrise des compétences doit être nettement renforcée.', 'Les compétences visées sont loin d’être acquises.'] },
    t: { b: ['Compétences en cours d’acquisition.'], n: ['Compétences fragiles.', 'Compétences partiellement acquises.'], x: ['Compétences insuffisamment maîtrisées.', 'Maîtrise des compétences à renforcer.'] } },
    1: { p: { b: ['Les compétences visées ne sont pas encore acquises : il faut persévérer.'], n: ['La maîtrise des compétences est insuffisante.', 'Les compétences visées ne sont pas encore acquises.'],
      x: ['Les compétences visées ne sont pas maîtrisées.', '{S} ne maîtrise pas les compétences visées.', 'Les compétences visées ne sont pas acquises.'] },
    t: { b: ['Compétences pas encore acquises.'], n: ['Compétences non acquises.'], x: ['Compétences non maîtrisées.', 'Compétences à acquérir.'] } },
  },
  moteur: {
    4: { p: ['{S} réalise de très bonnes performances{apsa}.', '{S} dispose de très bonnes qualités motrices{apsa}.', 'Les performances sont d’un très bon niveau{apsa}.', '{S} obtient des performances remarquables{apsa}.', 'Les résultats sont d’un niveau élevé{apsa}.'],
      t: ['Très bonnes qualités motrices{apsa}.', 'Très bons résultats{apsa}.', 'Performances remarquables{apsa}.', 'Excellent niveau{apsa}.'] },
    3: { p: ['{S} obtient de bons résultats{apsa}.', '{S} montre de bonnes capacités motrices{apsa}.', 'Les résultats sont d’un bon niveau{apsa}.'], t: ['Bons résultats{apsa}.', 'Bonnes capacités motrices{apsa}.'] },
    2: { p: { b: ['{S} obtient des résultats encore justes{apsa}, qui peuvent progresser.', 'Les résultats restent encore justes{apsa}, mais peuvent progresser.', '{S} obtient des résultats corrects{apsa}, qui peuvent s’améliorer.', 'Les résultats{apsa} sont corrects et peuvent s’améliorer.'], n: ['{S} obtient des résultats moyens{apsa}.', 'Les résultats sont moyens{apsa}.', 'Les performances sont moyennes{apsa}.'],
      x: ['Les résultats{apsa} sont insuffisants au regard des possibilités de {P}.', '{S} doit viser des résultats plus solides{apsa}.', 'Les performances{apsa} restent en deçà des possibilités de {P}.'] },
    t: { b: ['Résultats à consolider{apsa}.', 'Résultats perfectibles{apsa}.'], n: ['Résultats moyens{apsa}.', 'Performances moyennes{apsa}.'], x: ['Résultats insuffisants{apsa}.', 'Résultats en deçà des attentes{apsa}.', 'Performances insuffisantes{apsa}.'] } },
    1: { p: { b: ['{S} rencontre des difficultés{apsa}, mais peut progresser avec de la persévérance.', 'Les difficultés sont réelles{apsa}, mais la persévérance permettra de progresser.', '{S} rencontre des difficultés{apsa} ; un travail régulier l’aidera à les surmonter.', 'Les résultats{apsa} restent difficiles : il faut garder confiance.'], n: ['{S} rencontre des difficultés{apsa}.', 'Les résultats restent difficiles{apsa}.', 'Les performances restent modestes{apsa}.'],
      x: ['Les résultats{apsa} sont très insuffisants.', '{S} est en grande difficulté{apsa}.', 'Les résultats{apsa} sont nettement en deçà des attentes.'] },
    t: { b: ['Difficultés motrices à surmonter{apsa}.'], n: ['Difficultés motrices{apsa}.'], x: ['Résultats très insuffisants{apsa}.', 'Grandes difficultés{apsa}.'] } },
  },
  methodo: {
    4: { p: ['{S} assume avec beaucoup de sérieux les rôles confiés (arbitre, juge, observateur).', '{S} fait preuve d’une excellente méthode de travail.', 'Les rôles confiés sont assumés avec beaucoup de sérieux.'],
      t: ['Rôles très bien assumés.', 'Excellente méthode de travail.'] },
    3: { p: ['{S} tient correctement les rôles confiés et s’organise bien.', '{S} travaille avec méthode.', 'Les rôles confiés sont bien tenus et le travail est méthodique.', 'Le travail dans les rôles confiés est d’un bon niveau.'], t: ['Rôles bien assumés.', 'Travail méthodique.'] },
    2: { p: { b: ['{S} doit encore gagner en rigueur dans les rôles et l’organisation.'], n: ['La méthode de travail et la tenue des rôles restent à améliorer.', 'La méthode de travail et la tenue des rôles sont à revoir.', 'L’organisation et la tenue des rôles restent à améliorer.'],
      x: ['{S} manque de rigueur dans les rôles et l’organisation.', 'La rigueur fait défaut dans les rôles et l’organisation.'] },
    t: { b: ['Rigueur à développer dans les rôles.'], n: ['Méthode à améliorer.'], x: ['Manque de rigueur.'] } },
    1: { p: { b: ['{S} a besoin d’aide pour s’organiser et tenir les rôles confiés.'], n: ['{S} peine à s’organiser et à tenir les rôles confiés.'],
      x: ['Les rôles confiés ne sont pas assumés.', '{S} n’assume pas les rôles confiés.'] },
    t: { b: ['Organisation à construire.'], n: ['Rôles peu assumés.'], x: ['Rôles non assumés.'] } },
  },
  comportement: {
    4: { p: ['{S} a un comportement exemplaire, respectueux de tous.', 'Le comportement est exemplaire envers les camarades comme envers l’adulte.'], t: ['Comportement exemplaire.'] },
    3: { p: ['{S} a un comportement correct et respectueux.', '{S} respecte les règles et ses camarades.', 'Le comportement est correct et respectueux.'], t: ['Comportement correct.', 'Attitude respectueuse.'] },
    2: { p: { b: ['{S} doit veiller à mieux respecter les consignes.'], n: ['Le comportement est parfois à reprendre.'], x: ['{S} doit impérativement mieux respecter les consignes.'] },
      t: { b: ['Respect des consignes à améliorer.'], n: ['Comportement parfois à reprendre.'], x: ['Comportement à corriger.'] } },
    1: { p: { b: ['Le comportement doit s’améliorer pour progresser sereinement.', 'Le respect des règles et des camarades doit devenir une priorité.'], n: ['Le comportement pose problème en cours.'],
      x: ['Le comportement est inacceptable et nuit au travail de la classe.', 'Le comportement est inacceptable et nuit au travail de tous.', 'Le comportement est inacceptable et perturbe la classe.'] },
    t: { b: ['Comportement à améliorer nettement.'], n: ['Comportement problématique.'], x: ['Comportement inacceptable.'] } },
  },
  progression: {
    4: { p: ['{S} a nettement progressé {ce}.', 'Les progrès de {P} sont remarquables {ce}.'], t: ['Très nets progrès.', 'Progrès remarquables.', 'Nets progrès.'] },
    3: { p: ['{S} est en progrès {ce}.', 'Les progrès sont réguliers et encourageants.'], t: ['En progrès.', 'Progrès encourageants.'] },
    2: { p: { b: ['Les résultats sont stables : {s} peut encore progresser.', 'Le niveau est stable : {s} peut encore progresser.'], n: ['Les résultats sont stables.', 'Le niveau reste stable.'],
      x: ['Les résultats stagnent.', 'Le niveau stagne.', '{S} ne progresse plus.'] },
      t: { b: ['Résultats stables.', 'Niveau stable.'], n: ['Résultats stables.', 'Niveau stable.'], x: ['Résultats qui stagnent.', 'Niveau qui stagne.'] } },
    1: { p: { b: ['Les résultats sont en baisse {ce} : il faut se ressaisir.', 'Le niveau baisse {ce} : il faut se ressaisir.'], n: ['Les résultats sont en baisse {ce}.', 'Le niveau est en baisse {ce}.'],
      x: ['Les résultats sont en net recul {ce}.', 'Le niveau est en net recul {ce}.', '{S} est en net recul {ce}.'] },
      t: { b: ['Résultats en baisse : se ressaisir.', 'Niveau en baisse : se ressaisir.'], n: ['Résultats en baisse.', 'Niveau en baisse.'], x: ['Net recul des résultats.', 'Niveau en net recul.'] } },
  },
};
// Progression « stable » d'un élève qui a déjà un bon niveau : on le dit autrement.
const STABLE_BON_APPR = { p: ['{S} maintient son bon niveau.', 'Les résultats restent d’un bon niveau.'], t: ['Bon niveau maintenu.'] };

// (Le bilan ouvre l'appréciation : il commence par le prénom.)
const BILANS_APPR = {
  periode: { 4: ['{S} réalise un excellent {per}.', '{S} réalise un très bon {per}.', '{S} signe un excellent {per}.', '{S} réussit pleinement son {per}.', '{S} livre un {per} remarquable.', '{S} accomplit un très bon {per}.'],
    3: ['{S} réalise un bon {per}.', '{S} réalise un {per} satisfaisant.', '{S} réalise un {per} d’un bon niveau.', '{S} signe un bon {per}.', '{S} réussit son {per}.', '{S} dresse un bilan positif de ce {per}.', '{S} mène un {per} sérieux et réussi.'],
    2: { b: ['{S} réalise un {per} encourageant, mais encore inégal.', '{S} réalise un {per} encourageant, à confirmer.', '{S} réalise un {per} en demi-teinte, avec des points encourageants.', '{S} signe un {per} contrasté, avec de réels points d’appui.', '{S} connaît un {per} inégal, mais prometteur.'],
      n: ['{S} réalise un {per} inégal.', '{S} réalise un {per} moyen.', '{S} signe un {per} en demi-teinte.', '{S} connaît un {per} irrégulier.'], x: ['{S} réalise un {per} trop juste.', '{S} réalise un {per} en dessous de ses possibilités.', '{S} signe un {per} insuffisant au regard de ses moyens.'] },
    1: { b: ['{S} traverse un {per} difficile.', '{S} connaît un {per} compliqué.', '{S} vit un {per} difficile.'], n: ['{S} traverse un {per} difficile.', '{S} réalise un {per} décevant.', '{S} connaît un {per} difficile.'], x: ['{S} réalise un {per} très insuffisant.', '{S} réalise un {per} nettement insuffisant.', '{S} réalise un {per} préoccupant.'] } },
  annee: { 4: ['{S} réalise une excellente année.', '{S} réalise une très bonne année.', '{S} signe une excellente année.', '{S} réussit pleinement son année.', '{S} livre une année remarquable.'],
    3: ['{S} réalise une bonne année.', '{S} réalise une année satisfaisante.', '{S} réalise une année d’un bon niveau.', '{S} signe une bonne année.', '{S} réussit son année.', '{S} mène une année sérieuse et réussie.'],
    2: { b: ['{S} réalise une année encourageante, mais inégale.', '{S} réalise une année encourageante, qui reste à confirmer.', '{S} réalise une année en demi-teinte, avec des points encourageants.', '{S} signe une année contrastée, avec de réels points d’appui.'],
      n: ['{S} réalise une année mitigée.', '{S} signe une année en demi-teinte.', '{S} connaît une année irrégulière.'], x: ['{S} réalise une année trop juste.', '{S} réalise une année en dessous de ses possibilités.', '{S} signe une année insuffisante au regard de ses moyens.'] },
    1: { b: ['{S} traverse une année difficile.', '{S} connaît une année compliquée.'], n: ['{S} traverse une année difficile.', '{S} connaît une année décevante.'], x: ['{S} réalise une année très insuffisante.', '{S} réalise une année nettement insuffisante.', '{S} réalise une année préoccupante.'] } },
};
// Bilan d'ensemble correct d'un élève en retrait par rapport à sa classe (jamais « satisfaisant » sans nuance),
// ou bon bilan d'un élève parmi les meilleurs de la classe (voir positionClasse).
const BILANS_CLASSE_APPR = {
  retrait: { periode: ['{S} réalise un {per} correct, mais un peu en retrait par rapport à la classe.', '{S} réalise un {per} correct, un peu en dessous du niveau de la classe.', '{S} réalise un {per} correct, un peu en retrait par rapport à ses camarades.'],
    annee: ['{S} réalise une année correcte, mais un peu en retrait par rapport à la classe.', '{S} réalise une année correcte, un peu en dessous du niveau de la classe.', '{S} réalise une année correcte, un peu en retrait par rapport à ses camarades.'] },
  tete: { periode: ['{S} réalise un bon {per} et se place parmi les meilleurs de la classe.', '{S} réalise un {per} réussi, parmi les meilleurs de la classe.', '{S} réalise un {per} réussi, parmi les meilleurs élèves.'],
    annee: ['{S} réalise une bonne année et se place parmi les meilleurs de la classe.', '{S} réalise une année réussie, parmi les meilleurs de la classe.', '{S} réalise une année réussie, parmi les meilleurs élèves.'] },
};
// Résultats corrects, mais en retrait par rapport à la classe (niveau 3 plafonné) ; quand le bilan l'a déjà dit :
// des résultats « honorables », sans redire la classe (pas de « bons résultats » juste après « en retrait »).
const RETRAIT_APPR = { p: ['{S} obtient des résultats corrects{apsa}, mais un peu en retrait par rapport à la classe.', 'Les résultats{apsa} sont corrects, un peu en dessous du niveau de la classe.', 'Les résultats{apsa} sont corrects, un peu en retrait par rapport à ses camarades.'],
  t: ['Résultats corrects{apsa}, un peu en retrait par rapport à la classe.'] };
const RETRAIT_DIT_APPR = { p: ['{S} obtient des résultats honorables{apsa}.', 'Les résultats{apsa} sont convenables.'], t: ['Résultats honorables{apsa}.'] };

// Objectifs (verbe à l'infinitif) : un axe de progrès général, selon la rubrique la plus faible
// (pas une compétence précise : « maintenir ses efforts », « fournir davantage de travail pour consolider ses acquis »…).
const OBJECTIFS_APPR = {
  attitude: ['s’investir plus régulièrement', 'fournir davantage d’efforts en cours', 'trouver davantage d’envie et d’engagement', 'se montrer plus volontaire',
    's’impliquer pleinement dans chaque séance', 'montrer plus d’envie en cours', 's’engager avec constance'],
  absences: ['gagner en assiduité', 'venir en cours plus régulièrement', 'ne manquer aucune séance'],
  comportement: ['continuer ses efforts vis-à-vis de son comportement', 'mieux respecter les consignes et les camarades', 'adopter une attitude plus constructive en cours',
    'travailler dans le calme et le respect des autres', 'se concentrer davantage en cours'],
  methodo: ['s’impliquer davantage dans les rôles (arbitre, juge, observateur)', 'gagner en rigueur et en méthode', 'mieux s’organiser dans le travail de groupe',
    'tenir les rôles confiés avec plus de sérieux', 'mieux organiser son travail'],
  securite: ['respecter et faire respecter les règles de sécurité'],
  moteur: ['persévérer pour améliorer ses performances', 'fournir davantage de travail pour progresser', 'gagner en efficacité par un entraînement régulier', 'chercher à se dépasser dans les activités',
    'travailler avec plus d’intensité', 'oser davantage dans les activités', 's’entraîner avec régularité'],
  competences: ['fournir davantage de travail pour consolider ses acquis', 'consolider ses acquis par un travail régulier', 'mieux fixer ses apprentissages', 'approfondir les savoir-faire travaillés',
    'réinvestir les conseils donnés en cours', 'mieux mémoriser les savoir-faire'],
  progression: ['se remobiliser pour retrouver son meilleur niveau', 'maintenir ses efforts pour retrouver de la régularité', 'se remobiliser dans la durée',
    'retrouver son niveau habituel'],
  regularite: ['retrouver de la régularité dans ses résultats', 'maintenir ses efforts dans la durée', 'gagner en constance'],
  haut: ['maintenir ses efforts', 'conserver cette belle dynamique', 'viser l’excellence', 'garder ce niveau d’investissement', 'continuer sur cette lancée', 'garder cette exigence'],
};

// Petit hasard reproductible : la même graine donne toujours la même formulation.
function hasardAppr(texte) {
  let h = 2166136261;
  for (const ch of texte) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return (h >>> 0) / 4294967296;
}
const choisirAppr = (liste, graine) => liste[Math.floor(hasardAppr(graine) * liste.length)];
const selonTon = (x, ton) => (Array.isArray(x) ? x : x[ton[0] === 'b' ? 'b' : ton[0] === 'e' ? 'x' : 'n']);

/* ---------- Objectif dit à l'élève (ici et dans l'espace PP, pp.js) ----------
   Un but est écrit à l'infinitif, à la 3e personne (« consolider ses acquis », « s’investir davantage »). Pour varier
   la phrase d'objectif, l'appli le dit aussi à l'élève : « Je te conseille de consolider tes acquis »,
   « Afin de progresser, consolide tes acquis » (au vouvoiement : « vos acquis », « consolidez »). */
// Impératif des verbes qui ne sont pas en -er : [tu, vous].
const IMPERATIFS_APPR = {
  fournir: ['fournis', 'fournissez'], investir: ['investis', 'investissez'], approfondir: ['approfondis', 'approfondissez'],
  venir: ['viens', 'venez'], maintenir: ['maintiens', 'maintenez'], apprendre: ['apprends', 'apprenez'], prendre: ['prends', 'prenez'],
  reprendre: ['reprends', 'reprenez'], mettre: ['mets', 'mettez'], poursuivre: ['poursuis', 'poursuivez'],
};
// → { tu : infinitif à la 2e personne (« t’investir », « tes acquis »), deTu : « de … » / « d’… », imp : impératif ou null }
function butAdresse(but, vous = false) {
  const poss = vous ? { ses: 'vos', son: 'votre', sa: 'votre' } : { ses: 'tes', son: 'ton', sa: 'ta' };
  const adresser = t => t.replace(/(^|\s)(ses|son|sa)(?=\s)/g, (x, a, p) => a + poss[p])
    .replace(/(^|\s)se /g, `$1${vous ? 'vous' : 'te'} `).replace(/(^|\s)s’/g, `$1${vous ? 'vous ' : 't’'}`);
  const tu = adresser(but);
  const deTu = (/^[aeiouâàéèêîôû]/i.test(tu) ? 'd’' : 'de ') + tu;
  // Impératif : « mieux s’organiser … » → « organise-toi mieux … » ; inconnu ou deux verbes (« respecter et faire
  // respecter ») : pas d'impératif.
  let imp = null;
  const m = but.match(/^(mieux )?(se |s’)?([a-zàâçéèêëîïôûù]+)(.*)$/);
  if (m && !/\bet [a-zé]+(er|ir|re)\b/.test(m[4])) {
    const [, adv, pron, verbe, reste] = m;
    let f = IMPERATIFS_APPR[verbe]?.[vous ? 1 : 0];
    if (!f && verbe.endsWith('er')) {
      const radical = verbe.slice(0, -2);
      f = vous ? radical + 'ez' : radical.replace(/é([^aeiouyéèêàâîôû]+)$/, 'è$1') + 'e'; // (persévérer → persévère)
    }
    if (f) imp = f + (pron ? (vous ? '-vous' : '-toi') : '') + (adv ? ' mieux' : '') + adresser(reste);
  }
  return { tu, deTu, imp };
}
// Début de phrase « pour la suite » : « Pour le prochain trimestre »… ; après la dernière période ou pour l'année :
// « Pour l’année prochaine »… (Plusieurs : « trimestre » est souvent déjà écrit dans le bilan.)
const suiteAppr = (periode, per) => (periode === 'annee' || periodesAnnee().at(-1)?.id === periode ? ['Pour l’année prochaine', 'L’an prochain']
  : [per === 'période' ? 'Pour la prochaine période' : `Pour le prochain ${per}`, 'Pour la suite', 'Dans les semaines à venir']);
// Modèles de la phrase d'objectif : {but} (3e personne), {deTu} (« de consolider tes acquis »), {imp} (« consolide
// tes acquis ») ; ceux qui demandent un impératif inconnu sont écartés. base : le but à la 3e personne, sans les
// variantes {il|vous} de pp.js.
function modelesObjectifAppr(modeles, but, vous, suite, base = but) {
  const f = butAdresse(base, vous);
  return modeles.filter(m => f.imp || !m.includes('{imp}'))
    .map(m => m.replace(/\{Suite\}/g, suite).replace(/\{deTu\}/g, f.deTu).replace(/\{imp\}/g, f.imp || '').replace(/\{but\}/g, but));
}

function objectifAppr(niv, a, actives) {
  const notes = actives.filter(k => niv[k] && k !== 'objectif');
  // (Une progression « stable » n'est pas une faiblesse ; des résultats corrects mais en retrait par rapport à la classe, si.)
  const poids = k => (k === 'progression' && niv[k] === 2 ? 3 : k === 'moteur' && niv[k] === 3 && a.details.position?.cle === 'retrait' ? 2.5 : niv[k]);
  const pire = notes.length ? Math.min(...notes.map(poids)) : 3;
  // (Absences : seulement si l'attitude est abordée.)
  const absences = a.details.absences >= 3 && actives.includes('attitude');
  if (pire >= 3 && !absences) return { cle: 'haut' };
  if (absences && (niv.attitude || 3) <= 2) return { cle: 'absences' };
  const k = notes.find(x => poids(x) === pire) || 'competences';
  // Seule la progression faiblit, chez un élève par ailleurs solide : on parle de régularité.
  if (k === 'progression' && notes.filter(x => x !== 'progression').every(x => niv[x] >= 3)) return { cle: 'regularite' };
  if (k === 'competences' || k === 'moteur' || k === 'methodo') {
    // (Objectif général, pas une compétence précise ; seule la sécurité est nommée, quand c'est elle qui pèche.)
    const g = a.details.faibles.find(x => k === 'competences' || x.cat === k);
    if (g && /securite|assurage/.test(sansAccent(g.texte))) return { cle: 'securite' };
  }
  return { cle: k };
}

// Difficulté signalée par ce que l'enseignant a rempli (observation et ses mots-clés, degré choisi, absence, note…,
// pas un degré pré-rempli d'après la note) : niveau 1 ou 2 ; progression : en baisse.
function difficulteSaisieAppr(a, k) {
  if (k === 'objectif' || a.defaut[k] || !a.niveaux[k]) return false;
  if ((profil().appreciations?.sansVigilance || []).includes(k)) return false; // (École : les notes chiffrées)
  if (a.details?.saisi && !a.details.saisi[k]) return false;
  return a.niveaux[k] <= (k === 'progression' ? 1 : 2);
}

// Rubriques abordées : celles cochées dans les réglages, et elles seules (une rubrique décochée n'est jamais dite, même
// si le carnet y signale une difficulté : choix de l'enseignant). 0 choisi à la main = ne pas en parler.
function rubriquesAppr(r, a, perso = {}) {
  perso ||= {};
  return r.ordre.filter(k => {
    if (!r.actives.includes(k)) return false;
    return k === 'objectif' || !(k in perso) || !!perso[k];
  });
}

// Points de vigilance : rubriques cochées où le carnet signale une difficulté (en priorité dans le texte et l'objectif).
function vigilanceAppr(r, a, perso = {}) {
  return new Set(rubriquesAppr(r, a, perso).filter(k => difficulteSaisieAppr(a, k)));
}

// Niveaux choisis à la main encore utiles : ceux des rubriques cochées (gardés dans le carnet : ils reviennent si
// la rubrique est recochée).
function persoUtileAppr(r, a, perso) {
  return Object.fromEntries(Object.entries(perso || {}).filter(([k]) => r.actives.includes(k)));
}

/* ---------- Relecture (faite par l'appli, sur l'appareil, sans internet) ----------
   Une appréciation correctement écrite : jamais deux fois le même adverbe (« encore… encore »), ni deux mots de
   liaison de même sens (« néanmoins » puis « mais »), ni le même mot plein répété (« pour progresser… progresser ») ;
   élisions (« de il » → « d’il »), majuscules, ponctuation, il / elle, quelques fautes courantes.
   Sert à choisir les phrases proposées (voir redigerAppr) et à relire un texte réécrit à la main. */

// Mots de liaison de même sens : une seule fois par appréciation.
const LIAISONS_APPR = {
  opposition: ['mais', 'neanmoins', 'en revanche', 'cependant', 'toutefois', 'pourtant', 'par contre', 'malgre'],
  ajout: ['de plus', 'en outre', 'par ailleurs', 'egalement', 'aussi'],
  explication: ['en effet', 'car'],
  consequence: ['donc', 'ainsi', 'par consequent', 'c’est pourquoi', 'c\'est pourquoi'],
};
const ADVERBES_APPR = ['encore', 'davantage', 'toujours', 'tres', 'bien', 'mieux', 'plus', 'moins', 'maintenant', 'regulierement', 'souvent',
  'parfois', 'notamment', 'vraiment', 'pleinement', 'imperativement', 'globalement', 'nettement', 'trop', 'deja', 'beaucoup', 'assez',
  'particulierement', 'correctement', 'serieusement', 'activement', 'volontiers', 'ensuite', 'enfin', 'surtout', 'vite', 'sans cesse'];
// Adverbes qu'on peut retirer sans changer le sens (2e fois : retirés de la proposition).
const ADVERBES_RETIRABLES_APPR = ['encore', 'vraiment', 'toujours', 'maintenant', 'deja', 'egalement', 'aussi', 'pleinement', 'globalement'];
// Mots pleins courants à ne pas compter comme répétitions.
const MOTS_LIBRES_APPR = new Set(['toutes', 'autres', 'chaque', 'quelques', 'pendant', 'depuis', 'courage', 'bravo', 'objectif']);
const LETTRE_APPR = /[\p{L}\p{M}]/u;
const normAppr = t => sansAccent(String(t)).toLocaleLowerCase('fr').replace(/[’']/g, '’');
const motsAppr = t => normAppr(t).split(/[^\p{L}\p{M}]+/u).filter(Boolean);
// « progresser », « progrès », « progression » : même famille (7 premières lettres).
const racineAppr = m => (m.length > 7 ? m.slice(0, 7) : m.replace(/s$/, ''));
const contientAppr = (texteNorm, expr) => new RegExp(`(^|[^\\p{L}\\p{M}])${expr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{M}])`, 'u').test(texteNorm);

const RE_LIAISONS_APPR = Object.entries(LIAISONS_APPR).flatMap(([fam, exprs]) => exprs.map(e =>
  ({ fam, e, re: new RegExp(`(^|[^\\p{L}\\p{M}])${e.replace(/[’']/g, '[’\']')}(?![\\p{L}\\p{M}])`, 'gu') })));
// Ce que le texte contient : adverbes, familles de liaison, racines des mots pleins (avec leur nombre).
// (Gardé en mémoire : les mêmes phrases candidates sont inventoriées des centaines de fois pour une classe.)
const memoInventaireAppr = new Map();
function inventaireAppr(texte, ignorer = []) {
  const cle = texte + '\u0000' + ignorer.join('|');
  if (memoInventaireAppr.has(cle)) return memoInventaireAppr.get(cle);
  if (memoInventaireAppr.size > 5000) memoInventaireAppr.clear();
  const inv = inventaireCalculeAppr(texte, ignorer);
  memoInventaireAppr.set(cle, inv);
  return inv;
}
function inventaireCalculeAppr(texte, ignorer) {
  const n = normAppr(texte), mots = motsAppr(texte), ign = new Set(ignorer.map(normAppr));
  const compte = liste => { const m = new Map(); liste.forEach(x => m.set(x, (m.get(x) || 0) + 1)); return m; };
  const adverbes = compte(mots.filter(m => ADVERBES_APPR.includes(m)).concat(contientAppr(n, 'sans cesse') ? ['sans cesse'] : []));
  const liaisons = new Map();
  for (const { fam, e, re } of RE_LIAISONS_APPR) {
    const nb = (n.match(re) || []).length;
    if (nb) liaisons.set(fam, [...(liaisons.get(fam) || []), ...Array(nb).fill(e)]);
  }
  const pleins = compte(mots.filter(m => m.length >= 6 && !ADVERBES_APPR.includes(m) && !MOTS_LIBRES_APPR.has(m) && !ign.has(m)).map(racineAppr));
  return { adverbes, liaisons, pleins };
}

// Nombre de répétitions qu'ajouterait `ajout` à la suite de `avant` (pour choisir les phrases).
let inventaireMemoAppr = { cle: null, inv: null }; // (même début de texte comparé à toutes les phrases candidates)
function conflitsAppr(avant, ajout, ignorer = []) {
  const cle = avant + '\u0000' + ignorer.join('|');
  if (inventaireMemoAppr.cle !== cle) inventaireMemoAppr = { cle, inv: inventaireAppr(avant, ignorer) };
  const a = inventaireMemoAppr.inv, b = inventaireAppr(ajout, ignorer);
  let n = 0;
  for (const [m, k] of b.adverbes) n += (a.adverbes.has(m) ? k : k - 1);
  for (const [f, l] of b.liaisons) n += (a.liaisons.has(f) ? l.length : l.length - 1);
  for (const [m, k] of b.pleins) n += (a.pleins.has(m) ? k : k - 1);
  return n;
}

// Ce qui compte comme répétition dans un inventaire : adverbes, familles de liaison, racines de mots pleins.
const clesInventaireAppr = inv => [...[...inv.adverbes.keys()].map(m => 'a' + m), ...[...inv.liaisons.keys()].map(f => 'l' + f), ...[...inv.pleins.keys()].map(m => 'p' + m)];
// Répétitions que causera au mieux une rubrique à venir (sa phrase la moins gênante), si `deja` (ensemble de clés) est écrit.
const coutSuiteAppr = (options, deja) => (options.length ? Math.min(...options.map(o => o.filter(c => deja.has(c)).length)) : 0);

// Corrections sûres (sans changer le sens) : espaces, élisions, mots doublés, majuscules, adverbe répété retiré.
function corrigerAppr(texte, { retirerAdverbes = false } = {}) {
  let t = String(texte).replace(/[ \t]+/g, ' ').replace(/ +([,.])/g, '$1').replace(/([,.;:!?])(?=\p{L})/gu, '$1 ')
    .replace(/(\S)([!?;:])(?=\s|$)/g, (x, a, b) => (/\d/.test(a) && b === ':' ? x : `${a} ${b}`)).trim();
  // Élisions : « de il » → « d’il », « que elle » → « qu’elle », « si il » → « s’il » (pas devant un h : « le handball »).
  t = t.replace(/(^|[^\p{L}])(d|l|qu|n|s|j|m|t)(e) (?=[aeiouàâäéèêëîïôöûüAEIOUÀÂÉÈÊÎÔÛ])/gu, (x, a, b) => `${a}${b}’`)
    .replace(/(^|[^\p{L}])([Ll])a (?=[aeiouàâéèêîôûAEIOUÀÂÉÈÊÎÔÛ])/gu, '$1$2’')
    .replace(/(^|[^\p{L}])([Ss])i (?=ils?(?![\p{L}]))/gu, '$1$2’');
  // Mots doublés (« de de »), sauf « nous nous », « vous vous ».
  t = t.replace(/(^|[^\p{L}])(\p{L}+) \2(?![\p{L}])/gu, (x, a, m) => (/^(nous|vous)$/i.test(m) ? x : a + m));
  // Virgule après une liaison en début de phrase (« Néanmoins, elle… »).
  t = t.replace(/(^|[.!?] )(Néanmoins|En revanche|En effet|Cependant|Toutefois|De plus|Par ailleurs|En outre|Par conséquent|Pourtant|Enfin|Ainsi) (?=\p{L})/gu, '$1$2, ');
  // Majuscule en début de phrase ; point final.
  t = t.replace(/(^|[.!?] )(\p{Ll})/gu, (x, a, l) => a + l.toLocaleUpperCase('fr'));
  if (t && !/[.!?…)»]$/.test(t)) t += '.';
  if (retirerAdverbes) {
    for (const adv of ADVERBES_RETIRABLES_APPR) {
      let vu = false;
      t = t.replace(new RegExp(`(^|[^\\p{L}])([\\p{L}]+)(?![\\p{L}])`, 'gu'), (x, a, m) => {
        if (normAppr(m) !== adv) return x;
        if (!vu) { vu = true; return x; }
        return a.endsWith(' ') || a === '' ? '' : a; // (l'espace qui suit est fusionné plus bas)
      }).replace(/ {2,}/g, ' ').replace(/ ([,.!?])/g, (x, p) => (p === ',' || p === '.' ? p : x));
    }
  }
  return t;
}

// Fautes courantes (relecture d'un texte écrit à la main).
const FAUTES_APPR = [
  [/(^|[^\p{L}])malgrés(?![\p{L}])/giu, '« malgrés » → « malgré »'],
  [/quelque soi[st]?(?![\p{L}])/giu, '« quelque soit » → « quel que soit »'],
  [/(^|[^\p{L}])parmis(?![\p{L}])/giu, '« parmis » → « parmi »'],
  [/comme même/giu, '« comme même » → « quand même »'],
  [/pallier à/giu, '« pallier à » → « pallier » (sans « à »)'],
  [/au jour d[’']aujourd[’']hui/giu, '« au jour d’aujourd’hui » → « aujourd’hui »'],
  [/(^|[^\p{L}])language(?![\p{L}])/giu, '« language » → « langage »'],
  [/(^|[^\p{L}])(?:il|elle) [àa] (?:du|de) mal(?![\p{L}])/giu, ''], // (correct : ignoré)
];
const PAS_INFINITIF_APPR = new Set(['hier', 'cher', 'fier', 'amer', 'mer', 'fer', 'super', 'premier', 'dernier', 'entier', 'leger', 'chantier', 'quartier', 'atelier', 'clavier', 'papier']);

// Remarques sur un texte : [{ grave, texte }]. el : l'élève (il / elle, prénom) ; autres : prénoms des autres élèves.
function relireAppr(texte, el = {}, autres = []) {
  const t = String(texte || '').trim(), res = [];
  if (!t) return res;
  const prenom = (el.prenom || '').trim();
  const inv = inventaireAppr(t, prenom ? [prenom, ...prenom.split(/[\s-]+/)] : []);
  const original = mot => (t.match(new RegExp(`(?:^|[^\\p{L}])(${mot.split('').map(c => '[' + c + c.toUpperCase() + 'àâäéèêëîïôöûüç]').join('')})`, 'u')) || [])[1] || mot;
  for (const [m, k] of inv.adverbes) if (k > 1) res.push({ grave: true, texte: `« ${m === 'tres' ? 'très' : m === 'deja' ? 'déjà' : m === 'regulierement' ? 'régulièrement' : m} » répété ${k} fois` });
  for (const [, l] of inv.liaisons) if (l.length > 1) res.push({ grave: true, texte: `Liaisons de même sens : ${[...new Set(l)].map(x => `« ${x.replace('neanmoins', 'néanmoins').replace('malgre', 'malgré').replace('egalement', 'également').replace('consequent', 'conséquent')} »`).join(' et ')}${new Set(l).size === 1 ? ` (${l.length} fois)` : ''}` });
  const mots = motsAppr(t);
  for (const [rac, k] of inv.pleins) {
    if (k < 2) continue;
    const vus = [...new Set(mots.filter(m => racineAppr(m) === rac))];
    res.push({ grave: true, texte: `Répétition : ${vus.map(m => `« ${original(m)} »`).join(', ')}` });
  }
  if (/(^|[^\p{L}])(\p{L}+) \2(?![\p{L}])/iu.test(t) && !/(^|[^\p{L}])(nous nous|vous vous)(?![\p{L}])/iu.test(t)) res.push({ grave: true, texte: 'Mot écrit deux fois de suite' });
  if (corrigerAppr(t) !== t) res.push({ grave: true, texte: 'Ponctuation, majuscules ou élisions à corriger', corrigeable: true });
  // Il / elle
  if (el.sexe === 'F' && /(^|[.!?] |, )Il (?!faut|faudra|faudrait|reste|est (?:important|nécessaire|essentiel)|s’agit|y a)/u.test(t)) res.push({ grave: true, texte: '« Il » pour une élève ?' });
  if (el.sexe === 'G' && /(^|[^\p{L}])[Ee]lle(?![\p{L}])/u.test(t)) res.push({ grave: true, texte: '« Elle » pour un élève ?' });
  // Copier-coller : le prénom d'un autre élève
  const autre = autres.find(p => p && p !== prenom && p.length > 2 && new RegExp(`(^|[^\\p{L}])${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}])`, 'u').test(t));
  if (autre) res.push({ grave: true, texte: `Le texte cite « ${autre} » : est-ce le bon élève ?` });
  if (prenom && !new RegExp(prenom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'iu').test(t) && /^(Il|Elle) /.test(t)) res.push({ grave: false, texte: 'Commence par « Il / Elle » sans citer le prénom' });
  for (const [re, msg] of FAUTES_APPR) if (msg && re.test(t)) res.push({ grave: true, texte: msg });
  // Participe / infinitif : « il a progresser », « doit progressé »
  // « de le travail » → « du travail » (mais « de le faire » est juste : pas devant un infinitif)
  const contr = [...t.matchAll(/(?:^|[^\p{L}])([Dd]e le|[Dd]e les|[Àà] le|[Àà] les) (\p{L}+)/gu)].find(x => !/(er|ir|re|oir)$/.test(x[2]));
  if (contr) {
    const bon = { 'de le': 'du', 'de les': 'des', 'à le': 'au', 'à les': 'aux' }[contr[1].toLocaleLowerCase('fr')];
    res.push({ grave: true, texte: `« ${contr[1]} ${contr[2]} » → « ${bon} ${contr[2]} »` });
  }
  // (« a encore progresser » : un adverbe peut s'intercaler.)
  const adv = '(?:(?:encore|bien|beaucoup|toujours|déjà|vraiment|nettement|souvent|parfois|peu|trop|mieux) )?';
  const aInf = [...t.matchAll(new RegExp(`(?:^|[^\\p{L}])(?:a|ont|as|avons|avez) ${adv}(\\p{L}{3,}er)(?![\\p{L}])`, 'gu'))].map(x => x[1]).find(m => !PAS_INFINITIF_APPR.has(normAppr(m)));
  if (aInf) res.push({ grave: true, texte: `« a ${aInf} » → « a ${aInf.slice(0, -2)}é » ?` });
  // « des efforts a faire » → « à faire » (après un nom, pas après il / elle / on)
  const rePrenom = new RegExp(`^${prenom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'iu');
  const aFaire = [...t.matchAll(/(?:^|[^\p{L}])(?!(?:il|elle|on|qui|Il|Elle|On|Qui) )(\p{L}+) a (faire|\p{L}{2,}(?:ir|re|oir))(?![\p{L}])/gu)]
    .find(x => !/^(notre|votre|entre|contre|autre|propre|encore|plaisir|désir|avenir|loisir|soir|espoir)$/i.test(x[2]) && !(prenom && rePrenom.test(x[1])));
  if (aFaire) res.push({ grave: true, texte: `« a ${aFaire[2]} » → « à ${aFaire[2]} » ?` });
  const doitPp = [...t.matchAll(/(?:^|[^\p{L}])(?:doit|doivent|peut|peuvent|faut|faudra|va|vont|devra|pourra) (\p{L}{3,}é)(?![\p{L}])/gu)].map(x => x[1]).find(m => !/té$/.test(m));
  if (doitPp) res.push({ grave: true, texte: `« ${doitPp} » → « ${doitPp.slice(0, -1)}er » ?` });
  return res;
}

const prenomsAutresAppr = (el, eleves) => (eleves || []).filter(x => x.id !== el.id).map(x => (x.prenom || '').trim());
const htmlRelectureAppr = (texte, el, autres, manuel) => {
  const rem = relireAppr(texte, el, autres);
  if (!texte.trim()) return '';
  if (!rem.length) return '<span class="relu-appr ok" title="Relu par l’appli : pas de répétition ni de faute repérée">✔ Relu</span>';
  const corrigeable = manuel && corrigerAppr(texte) !== texte.trim();
  return `<span class="relu-appr" title="${esc(rem.map(x => '• ' + x.texte).join('\n'))}">⚠ ${rem.map(x => esc(x.texte)).join(' · ')}</span>`
    + (corrigeable ? ' <button type="button" class="lien" data-appr-corriger title="Espaces, majuscules, élisions, mot doublé">✔ Corriger</button>' : '');
};

function redigerAppr(el, periode, a, niveauxPerso, r, graine = 0) {
  // Style « Liées » : rédigé à part ; sans il / elle connu (accords impossibles) ou sans résultats, style « Phrases ».
  if (r.style === 'liees') {
    if (stylesAppr().liees) { const t = redigerLieesAppr(el, periode, a, niveauxPerso, r, graine); if (t) return t; }
    r = { ...r, style: 'phrases' };
  }
  niveauxPerso = persoUtileAppr(r, a, niveauxPerso);
  const niv = { ...a.niveaux };
  for (const [k, v] of Object.entries(niveauxPerso)) niv[k] = v || null; // 0 = ne pas en parler
  const ton = r.ton, tele = r.style === 'telegraphique';
  const sexe = ['F', 'G'].includes(el.sexe) ? el.sexe : '';
  const prenom = (el.prenom || '').trim() || el.nom;
  // Sujet : le prénom la 1re fois, puis il / elle. Pour ne pas enchaîner « Il… Il… Il… » : deux phrases de suite ne
  // commencent pas par le pronom (voir choisir) ; faute d'autre tournure, le prénom est repris (rappelPrenom).
  let dejaNomme = false, dernierPronom = false, rappelPrenom = false;
  const sujet = maj => {
    if (!dejaNomme || !sexe || (maj && rappelPrenom)) { dejaNomme = true; rappelPrenom = false; return prenom; }
    return sexe === 'F' ? (maj ? 'Elle' : 'elle') : (maj ? 'Il' : 'il');
  };
  const p = periodesAnnee().find(x => x.id === periode);
  // (École en 5 périodes, codes P1…P5 : « cette période ».)
  const per = periode === 'annee' ? 'année' : p?.code?.startsWith('S') ? 'semestre' : profil().ecole && p?.code?.startsWith('P') ? 'période' : 'trimestre';
  const ce = periode === 'annee' ? 'cette année' : per === 'période' ? 'cette période' : `ce ${per}`;
  const minuscule = s => s[0].toLocaleLowerCase('fr') + s.slice(1);
  const apsaTexte = k => {
    const d = a.details, x = n => activiteDansPhrase(n);
    if (d.apsaSeule) return x(d.apsaSeule);
    if (k >= 3 && d.apsaForte && x(d.apsaForte)) return ', notamment' + x(d.apsaForte);
    if (k <= 2 && d.apsaFaible && x(d.apsaFaible)) return ', notamment' + x(d.apsaFaible);
    return '';
  };
  const remplir = (modele, k) => modele
    .replace(/\{S\}/g, () => sujet(true)).replace(/\{s\}/g, () => sujet(false)).replace(/\{P\}/g, prenom)
    // (Incise « , notamment en … » au milieu de la phrase : refermée par une virgule.)
    .replace(/\{apsa\}(?= [\p{L}])/gu, () => apsaTexte(k) + (apsaTexte(k).startsWith(',') ? ',' : '')).replace(/\{apsa\}/g, apsaTexte(k))
    .replace(/\{faible\}/g, () => activiteDansPhrase(a.details.apsaFaible || '')).replace(/\{ce\}/g, ce).replace(/\{Per\}/g, per[0].toUpperCase() + per.slice(1)).replace(/\{per\}/g, per)
    // (École, portrait : accords au masculin ou au féminin, période précédente.)
    .replace(/\{E\}/g, fem ? 'e' : '').replace(/\{X\}/g, fem ? 'se' : 'x').replace(/\{LUI\}/g, fem ? 'elle' : 'lui').replace(/\{LE\}/g, fem ? 'la' : 'le').replace(/\{UN\}/g, fem ? 'une' : 'un')
    .replace(/\{BONS\}/g, k >= 4 ? 'excellents' : 'bons').replace(/\{AUPREC\}/g, precedente.au).replace(/\{APREC\}/g, precedente.au.replace(/^qu’/, '')).replace(/\{LEPREC\}/g, precedente.le)
    .replace(/\{avant\}/g, () => activiteDansPhrase(a.details.avant?.apsaFaible || ''));
  // École : portrait de l'élève (pastilles) ; dès qu'il y en a un, l'humain passe avant les matières.
  const pa = profil().appreciations || {}, fem = sexe === 'F';
  const portrait = portraitAppr(el.id, periode), choix = choixPortrait(portrait), humain = portrait.length > 0;
  const precedente = (() => {
    const ps = periodesAnnee(), k = ps.findIndex(x => x.id === periode);
    if (k < 1) return { au: '', le: '' };
    const rang = ['premier', 'deuxième', 'troisième', 'quatrième'][k - 1] || 'précédent';
    if (per === 'période') { const r1 = rang === 'premier' ? 'première' : rang === 'précédent' ? 'précédente' : rang; return { au: `qu’à la ${r1} période`, le: `la ${r1} période` }; }
    return { au: `qu’au ${rang} ${per}`, le: `le ${rang} ${per}` };
  })();
  // École : lien avec la période précédente (case « Faire le lien avec la période précédente », discipline.js › liens).
  // Un point d'attention retiré du portrait depuis la période précédente (« Elle a pris confiance en elle depuis le
  // premier trimestre »), une rubrique qui change nettement de niveau (« Le comportement s’est nettement amélioré… »,
  // à la place de la phrase de la rubrique), la matière fragile qui ne l'est plus. Deux liens au plus.
  // persistants : points d'attention déjà cochés à la période précédente (« Comme au premier trimestre, il… »).
  const persistants = new Set();
  const liens = (() => {
    const L = pa.liens, av = a.details.avant;
    if (!L || !r.liens || !av || tele) return [];
    const sortie = [], P = portraitProfil(), avantPortrait = portraitAppr(el.id, av.periode);
    // (Seulement si le portrait a été revu pour cette période : repris tel quel, il ne dit rien de ce qui a changé.)
    if (P && Array.isArray(Donnees.get('suivis', idAppr(el.id, periode))?.portrait)) {
      for (const x of P.attention) {
        if (!avantPortrait.includes(x.id)) continue;
        if (portrait.includes(x.id)) persistants.add(x.id);
        else if (x.leve) sortie.push({ cle: 'lien-' + x.id, importance: 5.7, pol: 1, phrases: x.leve });
      }
    }
    for (const k of ['comportement', 'attitude', 'autonomie', 'methodo']) {
      const n0 = av.niveaux[k], n1 = niv[k];
      if (!n0 || !n1 || av.defaut[k] || (a.defaut[k] && !(k in niveauxPerso))) continue;
      const sens = n0 <= 2 && n1 >= 3 ? 'mieux' : n0 >= 3 && n1 <= 2 ? 'moins' : null;
      if (sens && L[sens]?.[k]) sortie.push({ cle: 'lien-' + k, rubrique: k, importance: sens === 'mieux' ? 5.6 : 5.05, pol: sens === 'mieux' ? 1 : -1, phrases: L[sens][k] });
    }
    const ph = av.apsaFaible;
    if (ph && L.matiere && a.details.scoresMatieres?.[ph] >= 3 && a.details.apsaFaible !== ph) sortie.push({ cle: 'lien-matiere', importance: 5.4, pol: 1, phrases: L.matiere });
    return sortie.slice(0, 2);
  })();
  // (essai : autres tirages quand la relecture trouve une répétition ; l'essai 0 donne le tirage habituel.)
  let essai = 0;
  const g = cle => `${el.id}|${periode}|${graine}|${essai ? essai + '|' : ''}${cle}`;
  // École (textesDifferents) : les élèves de la classe se partagent les tournures. La tournure dépend de la phrase
  // (même départ pour toute la classe) décalée selon la place de l'élève dans la liste : deux voisins n'ont jamais la
  // même, et chaque tournure revient le moins souvent possible. Ailleurs : le tirage habituel, propre à l'élève.
  const rang = a.details.rang ?? -1;
  const tirer = (liste, cle) => {
    const n = liste.length;
    if (rang < 0 || n < 2 || !cle.startsWith(el.id + '|')) return choisirAppr(liste, cle);
    const commune = cle.slice(el.id.length + 1);
    // (Pas premier avec le nombre de tournures : toutes servent avant qu'une revienne.)
    let pas = 1 + Math.floor(hasardAppr('pas|' + commune) * (n - 1));
    const pgcd = (x, y) => (y ? pgcd(y, x % y) : x);
    while (pas > 1 && pgcd(pas, n) !== 1) pas--;
    return liste[(Math.floor(hasardAppr(commune) * n) + rang * pas) % n];
  };
  const ignores = [prenom, ...prenom.split(/[\s-]+/)];
  const brut = x => x.replace(/\{apsa\}/g, '').replace(/\{ce\}/g, ce).replace(/\{[A-Za-z]+\}/g, ' ');
  const actives = rubriquesAppr(r, a, niveauxPerso);
  const vigilance = vigilanceAppr(r, a, niveauxPerso); // (passent en priorité)
  // Bilan nuancé par la position dans la classe (voir positionClasse) : en retrait, un bilan correct (3 ou 4) devient
  // « un peu en retrait par rapport à la classe » ; parmi les meilleurs, il le dit. (Sauf niveau des résultats choisi
  // à la main qui le contredit.)
  const positionAppr = k => {
    const c = a.details.position?.cle;
    // (« Parmi les meilleurs » : pour un bilan bon, pas excellent — un excellent bilan le reste.)
    if (!c || k < 3 || (c === 'retrait' && (niv.moteur || 0) > 3) || (c === 'tete' && (k > 3 || (niv.moteur || 0) < 3))) return null;
    return c;
  };

  // Phrases possibles pour une rubrique (au niveau retenu, selon le ton et le style).
  const banqueRubrique = (k, retraitDit) => {
    const n = niv[k];
    let banque = phrasesAppr()[k][n];
    if (k === 'progression' && n === 2 && (niv.moteur || 0) >= 3) banque = STABLE_BON_APPR;
    // (Résultats corrects mais sous la moyenne de la classe : nuancés, une seule fois dans l'appréciation.)
    const retrait = k === 'moteur' && n === 3 && a.details.position?.cle === 'retrait';
    if (retrait) banque = retraitDit ? RETRAIT_DIT_APPR : RETRAIT_APPR;
    return { banque, retrait, liste: selonTon(tele ? banque.t : banque.p, ton) };
  };

  // court = true : la phrase la plus courte de chaque liste (essayé avant de laisser des rubriques de côté).
  const construire = (court, exclues = []) => {
    dejaNomme = false; dernierPronom = false; rappelPrenom = false;
    let retraitDit = false; // (« en retrait par rapport à la classe » : dit une seule fois)
    let ecrit = ''; // (texte déjà choisi : pour ne pas répéter un adverbe, une liaison ou un mot)
    // Les phrases qui répètent le moins ce qui est déjà écrit (aucune répétition si possible).
    // suite : phrases possibles des rubriques suivantes ; une phrase qui les obligera à se répéter compte aussi
    // (sinon « Les résultats stagnent », seule phrase possible, viendrait forcément répéter « résultats »).
    const moinsDeRepetitions = (liste, voir = x => x, suite = []) => {
      const deja = suite.length ? clesInventaireAppr(inventaireAppr(ecrit, ignores)) : [];
      const n = liste.map(x => {
        let c = conflitsAppr(ecrit, voir(x), ignores);
        if (suite.length) {
          const avec = new Set([...deja, ...clesInventaireAppr(inventaireAppr(voir(x), ignores))]);
          for (const options of suite) c += coutSuiteAppr(options, avec);
        }
        return c;
      }), min = Math.min(...n);
      return liste.filter((x, i) => n[i] === min);
    };
    // marge (mode court) : choisir au hasard parmi les phrases à peine plus longues que la plus courte (variété).
    const choisir = (tout, graine, marge = 0, suite = []) => {
      tout = moinsDeRepetitions(tout, brut, suite);
      // L'appréciation commence par le prénom : la 1re phrase est prise parmi celles qui commencent par lui.
      const premiere = !dejaNomme && !tele ? tout.filter(x => x.startsWith('{S}')) : [];
      // Sans il / elle (sexe non renseigné), le prénom se répéterait : on préfère alors les phrases sans sujet.
      const sansSujet = dejaNomme && !sexe ? tout.filter(x => !/\{[Ss]\}/.test(x)) : [];
      // Phrase précédente en « Il / Elle » : on varie la tournure (« L’engagement est… », « Les résultats… »).
      const varie = dejaNomme && dernierPronom ? tout.filter(x => !x.startsWith('{S}')) : [];
      const liste = premiere.length ? premiere : sansSujet.length ? sansSujet : varie.length ? varie : tout;
      const min = Math.min(...liste.map(x => x.length));
      // (court = 1 : parmi les phrases à 15 caractères près de la plus courte, partagées dans la classe ; court = 2 (ou true) : les plus courtes.)
      const choix = court ? tirer(liste.filter(x => x.length <= min + (court === 1 ? Math.max(marge, 15) : marge)), graine) : tirer(liste, graine);
      const enPronom = dejaNomme && sexe && choix.startsWith('{S}');
      if (enPronom && dernierPronom) { rappelPrenom = true; dernierPronom = false; } // (pas d'autre tournure : on redit le prénom)
      else dernierPronom = enPronom;
      return choix;
    };
    const morceaux = []; // { cle, texte }
    const ajouter = m => { morceaux.push(m); ecrit += ' ' + m.texte; };
    // Phrases possibles des rubriques à venir (clés de leurs mots) : le bilan et les rubriques d'avant les ménagent.
    const ordre = actives.filter(k => k !== 'objectif' && !exclues.includes(k) && niv[k]);
    const options = ordre.map(k => banqueRubrique(k, true).liste.map(x => clesInventaireAppr(inventaireAppr(brut(x), ignores))));
    // (École : les points d'attention du portrait, écrits après les rubriques, comptent aussi : pas de « il faut garder
    // confiance » avant « Il manque encore de confiance en lui ».)
    const optionsAttention = humain ? choix.attention.map(x => x.phrases.map(t => clesInventaireAppr(inventaireAppr(brut(t), ignores)))) : [];
    const suiteApres = k => [...options.slice(ordre.indexOf(k) + 1), ...optionsAttention];
    // Niveau d'ensemble (bilan ; à l'école, aussi le mot de fin de l'enseignant).
    const base = ['moteur', 'competences', 'attitude'].map(k => niv[k]).filter(Boolean);
    const kG = base.length ? Math.max(1, Math.min(4, Math.round(moyenneListe(base)))) : null;
    if (r.bilan && !exclues.includes('bilan') && base.length && pa.ouvertures && !tele) {
      // École : une ouverture selon le moment de l'année (« Excellent début d’année ! », « Bon travail tout au long
      // de ce trimestre. »), ou une comparaison avec la période précédente quand les apprentissages tiennent ou progressent.
      const O = pa.ouvertures, kp = periodesAnnee().findIndex(x => x.id === periode), av = a.details.niveauAvant, cur = a.details.degreMoyen;
      let liste = selonTon((periode === 'annee' ? O.annee : kp === 0 ? O.debut : O.suite)[kG], ton);
      if (kp > 0 && av !== undefined && cur !== undefined && kG >= 3 && niveauDegre(av) >= 3 && cur >= av - 0.15) liste = [...liste, ...(cur - av >= 0.5 ? O.mieux : O.pareil)];
      // (Avec un lien vers la période précédente, « depuis le premier trimestre » : l'ouverture ne redit pas la période,
      // « Bon travail. » au lieu de « Bon travail tout au long de ce trimestre. », et ne compare pas une 2e fois.)
      const avecLien = liens.some(l => !exclues.includes(l.cle)) || persistants.size > 0;
      if (avecLien) liste = selonTon((periode === 'annee' ? O.annee : kp === 0 ? O.debut : O.suite)[kG], ton).map(x => x.replace(/ tout au long de \{ce\}| \{ce\}/g, ''));
      // (Sans répéter les mots des phrases du portrait qui suivent : « Bon travail… Les bavardages gênent son travail ».)
      const optionsPortrait = humain ? [...choix.qualites.filter(x => x.phrases), ...choix.situations, ...choix.attention]
        .map(x => x.phrases.map(t => clesInventaireAppr(inventaireAppr(brut(t), ignores)))) : [];
      const choisi = tirer(moinsDeRepetitions(liste, brut, [...optionsPortrait, ...options]), g('bilan'));
      // (Sans prénom — « Excellent début d’année ! » — : pas de « En effet » ensuite, et le prénom vient juste après.)
      ajouter({ cle: 'bilan', exclam: !/\{S\}/.test(choisi), pol: kG >= 3 ? 1 : -1, texte: remplir(choisi, kG) });
    } else if (r.bilan && !exclues.includes('bilan')) {
      if (base.length) {
        let k = kG;
        const cote = periode === 'annee' ? 'annee' : 'periode', classe = positionAppr(k);
        // (Juste sous la moyenne de la classe, avec des résultats justes : pas de « satisfaisant » non plus.)
        if (!classe && k >= 3 && a.details.position?.ecart < 0 && niv.moteur && niv.moteur <= 2) k = 2;
        // (École : ses bilans, les mêmes pour une période et pour l'année, voir discipline.js.)
        const propres = profil().appreciations?.bilans;
        const banque = classe ? BILANS_CLASSE_APPR[classe][cote] : selonTon(propres ? propres[k] : BILANS_APPR[cote][k], ton);
        if (classe === 'retrait') retraitDit = true;
        ajouter({ cle: 'bilan', pol: classe === 'retrait' ? -1 : k >= 3 ? 1 : -1, texte: remplir(choisir(banque, g('bilan'), 0, options), classe === 'retrait' ? 2 : k) });
      }
    }
    // École : le portrait de l'élève, juste après l'ouverture (qualités, puis situations particulières). Gardé en
    // priorité quand la place manque ; les matières passent après.
    if (humain) {
      const adjs = choix.qualites.filter(x => x.adj).slice(0, 3), autres = choix.qualites.filter(x => !x.adj);
      if (adjs.length && !exclues.includes('portrait-' + adjs[0].id)) {
        const liste = sexe ? adjs.map(x => x.adj[fem ? 1 : 0]) : adjs.map(x => x.qualite);
        const et = l => (l.length > 1 ? `${l.slice(0, -1).join(', ')} et ${l.at(-1)}` : l[0]);
        const de = l => et(l.map(x => (/^[aeiouyéèêâh]/i.test(x) ? 'd’' : 'de ') + x));
        // (« Clara est une élève consciencieuse et volontaire » ; déjà nommée : « C’est une élève… » ; sexe non renseigné :
        // « Léo fait preuve d’application et de curiosité ».)
        // (« élève » ou « enfant », partagés entre les élèves de la classe comme les autres tournures.)
        const qui = tirer(['élève', 'enfant'], g('portrait-qui'));
        const modele = !sexe ? `{S} fait preuve ${de(liste)}.` : tele ? `{UN} ${qui} ${et(liste)}.` : dejaNomme ? `C’est {UN} ${qui} ${et(liste)}.` : `{S} est {UN} ${qui} ${et(liste)}.`;
        const t = remplir(modele, 4);
        dernierPronom = false;
        ajouter({ cle: 'portrait-' + adjs[0].id, importance: 6, pol: 1, texte: t[0].toUpperCase() + t.slice(1) });
      }
      autres.forEach((x, i) => {
        if (!exclues.includes('portrait-' + x.id)) ajouter({ cle: 'portrait-' + x.id, importance: 5.9 - i / 100, pol: 1, texte: remplir(choisir(x.phrases, g('portrait-' + x.id)), 4) });
      });
      choix.situations.forEach((x, i) => {
        if (!exclues.includes('situation-' + x.id)) ajouter({ cle: 'situation-' + x.id, importance: 5.5 - i / 100, pol: x.pol || 0, texte: remplir(choisir(x.phrases, g('situation-' + x.id)), 3) });
      });
    }
    // École : les phrases que l'enseignant a écrites pour cet élève et choisies à nouveau (« Tes phrases », pastilles).
    (Donnees.get('suivis', idAppr(el.id, periode))?.phrases || []).forEach((t, i) => {
      if (!exclues.includes('perso-' + i)) { ajouter({ cle: 'perso-' + i, importance: 5.95 - i / 100, pol: 0, texte: t }); if (t.includes(prenom)) dejaNomme = true; }
    });
    // École : liens avec la période précédente, après le portrait (voir liens).
    for (const l of liens) if (!exclues.includes(l.cle)) ajouter({ cle: l.cle, importance: l.importance, pol: l.pol, texte: remplir(choisir(l.phrases, g(l.cle)), l.pol > 0 ? 3 : 2) });
    for (const k of actives) {
      if (k === 'objectif' || exclues.includes(k)) continue;
      const n = niv[k];
      if (!n) continue;
      // (Déjà dite par un lien avec la période précédente : « La participation a nettement progressé depuis… ».)
      if (liens.some(l => l.rubrique === k && !exclues.includes(l.cle))) continue;
      let { banque, retrait, liste } = banqueRubrique(k, retraitDit);
      if (retrait) retraitDit = true;
      // (Avec un portrait : les apprentissages sans citer de matière.)
      if (humain && k === 'competences') liste = liste.map(x => x.replace(/\{apsa\}/g, ''));
      // Importance (pour le manque de place) : niveau par défaut < « stable » < satisfaisant < fragile < extrêmes (1 et 4).
      // Point de vigilance (difficulté signalée par ce que l'enseignant a rempli) : gardé en priorité.
      let importance = vigilance.has(k) ? 5 : a.defaut[k] && !(k in (niveauxPerso || {})) ? 0 : k === 'progression' && n === 2 ? 1 : n === 3 && !retrait ? 2 : n === 2 || n === 3 ? 3 : 4;
      // École : « des progrès restent possibles en … » passe en dernier ; avec un portrait, la participation (déjà
      // dite par les qualités) aussi, et la matière fragile après le portrait.
      if (pa.ouvertures && k === 'consolider') importance = n >= 3 ? 0.5 : humain ? Math.min(importance, 4) : importance;
      // (Avec un portrait, la participation et un comportement sans donnée ne sont dits que s'ils posent problème : les
      // qualités choisies parlent déjà de l'élève.)
      if (humain && (k === 'attitude' || (k === 'comportement' && a.defaut[k] && !(k in niveauxPerso))) && !vigilance.has(k)) continue;
      // pol : sens de la phrase (+1 point fort, −1 difficulté, 0 neutre), pour les liaisons (voir lier).
      const pol = k === 'progression' && n === 2 ? (banque === STABLE_BON_APPR ? 1 : 0) : n >= 3 && !retrait ? 1 : -1;
      ajouter({ cle: k, importance, pol, texte: remplir(choisir(liste, g(k), 0, suiteApres(k)), retrait ? 2 : n) });
    }
    // École : les points d'attention du portrait (« Néanmoins, il commet encore des erreurs d’étourderie. »).
    if (humain) choix.attention.forEach((x, i) => {
      if (exclues.includes('attention-' + x.id)) return;
      // (Déjà là à la période précédente : « Comme au premier trimestre, il bavarde encore trop souvent. »)
      const comme = persistants.has(x.id) ? x.phrases.filter(t => t.startsWith('{S} ')).map(t => 'Comme {APREC}, {s}' + t.slice(3)) : [];
      ajouter({ cle: 'attention-' + x.id, importance: 5.8 - i / 100, pol: -1, texte: remplir(choisir(comme.length ? comme : x.phrases, g('attention-' + x.id)), 2) });
    });
    if (actives.includes('objectif') && niv.objectif !== null) {
      // (À faiblesse égale, l'objectif vise d'abord un point de vigilance rempli par l'enseignant ; à l'école, un point
      // d'attention du portrait passe avant tout : « il faudra prendre le temps de se relire ».)
      const att = humain ? choix.attention[0] : null;
      const o = att ? { cle: 'attention' } : objectifAppr(niv, a, [...vigilance, ...actives.filter(k => !vigilance.has(k))]);
      // (Le but est un bout de phrase : choisi à part, pour ne pas fausser le suivi des « Il / Elle ».)
      const buts = att ? att.buts : objectifsAppr()[o.cle];
      // (Sans répéter un mot déjà écrit : « Pour progresser, il faudra fournir davantage de travail pour progresser ».)
      const butsOk = moinsDeRepetitions(buts);
      const lmBut = Math.min(...butsOk.map(x => x.length));
      const but = o.texte || (court === 1 ? tirer(butsOk.filter(x => x.length <= lmBut + 15), g('but')) : court ? butsOk.reduce((x, y) => (y.length < x.length ? y : x)) : tirer(butsOk, g('but')));
      // (Plusieurs tournures, dont certaines adressées à l'élève : « Je te conseille… », « Afin de progresser, consolide… ».)
      const modeles = tele ? (o.cle === 'haut' ? ['Objectif : {but}.', 'Pour la suite : {but}.'] : ['Objectif : {but}.', 'À travailler : {but}.', 'Pour la suite : {but}.', 'Axe de progrès : {but}.'])
        : o.cle === 'haut' ? (ton === 'bienveillant' ? ['Bravo ! Il faut maintenant {but}.', 'Bravo, il faut {but} !', 'Bravo ! {Suite}, {imp}.', 'Bravo ! Je te conseille maintenant {deTu}.']
          : ['Il faut maintenant {but}.', '{Suite}, il faudra {but}.', 'Je te conseille, pour la suite, {deTu}.'])
          : ton === 'exigeant' ? ['{S} doit maintenant {but}.', 'Il faut impérativement {but}.', '{Suite}, il faudra impérativement {but}.', 'Je te demande, pour la suite, {deTu}.']
            : ton === 'bienveillant' ? ['{Suite}, il faudra {but}. Courage !', 'Je te conseille, pour la suite, {deTu}. Courage !', 'Afin de progresser, {imp}. Courage !', 'Pour progresser, il faudra {but}. Courage !']
              : ['{Suite}, il faudra {but}.', 'Je te conseille, pour la suite, {deTu}.', 'Afin de progresser, {imp}.', 'Il faut maintenant {but}.'];
      const suite = tirer(moinsDeRepetitions(suiteAppr(periode, per)), g('suite'));
      // (École : le texte parle de l'élève du début à la fin, sans « Je te conseille » ni impératif : voir sansTutoiement, discipline.js.)
      let modelesDits = profil().appreciations?.sansTutoiement ? modeles.filter(m => !/\{deTu\}|\{imp\}/.test(m)) : modeles;
      // (École, l'enseignant parle en son nom : « Je le félicite » vient à la fin, sans « Bravo » ni « Courage » ici.)
      if (r.voix && pa.fins && kG) {
        const sans = modelesDits.filter(m => !/Bravo|Courage/.test(m));
        modelesDits = sans.length ? sans : ['Il faut maintenant {but}.', '{Suite}, il faudra {but}.'];
      }
      let t = remplir(choisir(modelesObjectifAppr(modelesDits, but, false, suite), g('objectif'), 20), 0);
      t = t[0].toUpperCase() + t.slice(1);
      ajouter({ cle: 'objectif', texte: t });
    }
    // École : mot de fin de l'enseignant, puis souhaits de fêtes pour une période qui finit vers décembre.
    if (r.voix && pa.fins && kG && !exclues.includes('voix')) ajouter({ cle: 'voix', importance: 1.2, pol: 0, texte: remplir(tirer(moinsDeRepetitions(pa.fins[kG], brut), g('voix')), kG) });
    if (r.fetes && pa.fetes && p?.fin && (p.fin >= '11-15' || p.fin <= '01-10') && !exclues.includes('fetes')) ajouter({ cle: 'fetes', importance: 1.1, pol: 0, texte: tirer(pa.fetes, g('fetes')) });
    return morceaux;
  };

  // Liaisons entre les phrases (style « phrases ») : « En effet, » après le bilan quand la phrase le confirme ;
  // « Néanmoins, » d'un point fort à une difficulté, « En revanche, » dans l'autre sens ; « et » pour réunir deux points
  // forts courts dont le second commence par il / elle (« Il s’investit avec sérieux et obtient de bons résultats »).
  const debutMinuscule = t => (t.startsWith(prenom) ? t : t[0].toLocaleLowerCase('fr') + t.slice(1));
  const lier = liste => {
    if (tele) return liste.map(m => m.texte).join(' ');
    const sortie = [];
    // Une seule liaison de chaque sens dans l'appréciation : pas de « Néanmoins » s'il y a déjà un « mais »…
    const deja = inventaireAppr(liste.map(m => m.texte).join(' ')).liaisons;
    let enEffet = deja.has('explication'), opposition = deja.has('opposition'), lies = 0, avant = null;
    for (const m of liste) {
      let t = m.texte;
      const prec = sortie.at(-1);
      if (avant && m.cle !== 'objectif' && m.pol) {
        // (« En effet » : une appréciation sur deux environ, toujours la même pour un élève donné.)
        if (avant.cle === 'bilan' && !avant.exclam && !enEffet && m.pol === avant.pol && hasardAppr(g('en effet')) < 0.55) { t = 'En effet, ' + debutMinuscule(t); enEffet = true; }
        else if (avant.cle !== 'bilan' && avant.pol * m.pol < 0) {
          if (!opposition) { t = (avant.pol > 0 ? 'Néanmoins, ' : 'En revanche, ') + debutMinuscule(t); opposition = true; }
        }
        // « et » : deux points forts courts à la suite (jamais deux « et » dans une phrase). Même sujet (l'élève) :
        // « Il s’investit … et obtient … » ; sinon : « Les compétences … sont acquises et il obtient … ».
        // (Pas après une phrase du portrait : « Chloé est une élève consciencieuse et les apprentissages… ».)
        else if (avant.cle !== 'bilan' && !/^(portrait|situation|attention|lien|perso)-/.test(avant.cle) && avant.pol > 0 && m.pol > 0 && lies < 2 && prec && /\.$/.test(prec)
          && !/ et |^En effet|^Néanmoins|^En revanche|:/.test(prec) && !/ et |:/.test(t) && prec.length < 95 && t.length < 95) {
          // (« … et Léa obtient » : le prénom redit au milieu de la phrase est retiré, comme il / elle.)
          const debutSujet = new RegExp(`^(Il|Elle|${prenom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}) `);
          const memeSujet = debutSujet.test(t) && (prec.startsWith(prenom + ' ') || /^(Il|Elle) /.test(prec));
          // (Après une incise « , notamment en … » : « , et ».)
          const joint = /, notamment [^,]*\.$/.test(prec) ? ', et ' : ' et ';
          sortie[sortie.length - 1] = prec.slice(0, -1) + joint + (memeSujet ? t.replace(debutSujet, '') : debutMinuscule(t));
          lies++; avant = m;
          continue;
        }
      }
      sortie.push(t);
      avant = m;
    }
    return sortie.join(' ');
  };

  // Texte final : liaisons, puis relecture (corrections sûres ; un adverbe répété malgré tout est retiré).
  // (« un bon trimestre… a progressé ce trimestre » : la période déjà nommée n'est pas redite.)
  const finir = liste => {
    let t = lier(liste);
    const i = t.indexOf(per);
    if (i >= 0) t = t.slice(0, i + per.length) + t.slice(i + per.length).split(' ' + ce).join('');
    return corrigerAppr(t, { retirerAdverbes: true });
  };
  // Longueur : phrases les plus courtes, puis on retire les dernières rubriques (avant l'objectif), puis le bilan.
  const essayer = () => {
  let morceaux = construire(false);
  const retirees = [];
  const longueur = () => finir(morceaux).length;
  if (longueur() > r.longueur) morceaux = construire(1);
  if (longueur() > r.longueur) morceaux = construire(true);
  // Le moins important d'abord (à importance égale, le plus loin dans l'ordre ; entre points de vigilance, la difficulté
  // la moins grave, et le comportement en dernier : il vient des observations écrites par l'enseignant) ;
  // le texte est refait à chaque retrait, pour que le prénom soit toujours cité avant « il / elle ».
  while (longueur() > r.longueur && morceaux.length > 1) {
    const rubriques = morceaux.filter(m => m.cle !== 'objectif' && m.cle !== 'bilan');
    const moindre = rubriques.length ? Math.min(...rubriques.map(m => m.importance)) : null;
    let candidates = rubriques.filter(m => m.importance === moindre);
    if (moindre === 5) {
      const leger = Math.max(...candidates.map(m => niv[m.cle] || 0));
      candidates = candidates.filter(m => (niv[m.cle] || 0) === leger);
      if (candidates.length > 1) candidates = candidates.filter(m => m.cle !== 'comportement');
    }
    const cle = moindre !== null ? candidates.at(-1).cle : morceaux.find(m => m.cle === 'bilan')?.cle;
    if (!cle) break;
    retirees.push(cle);
    morceaux = construire(true, retirees);
  }
  // Puis on remet ce qui tient encore dans la longueur (le dernier retiré, le plus important, en premier) :
  // retirer une longue phrase peut libérer la place d'une plus courte.
  for (const cle of [...retirees].reverse()) {
    const sans = retirees.filter(k => k !== cle), avecElle = construire(true, sans);
    if (finir(avecElle).length <= r.longueur) { retirees.splice(retirees.indexOf(cle), 1); morceaux = avecElle; }
  }
  // Toujours commencer par le prénom (style télégraphique : « Léa : investissement sérieux. … »).
  let texte = finir(morceaux);
  // (École : une ouverture sans prénom, « Excellent début d’année ! », reste en tête.)
  if (texte && !texte.startsWith(prenom) && !morceaux[0]?.exclam) texte = `${prenom} : ${texte[0].toLocaleLowerCase('fr')}${texte.slice(1)}`;
  return { texte, retirees, remarques: relireAppr(texte, el).filter(x => x.grave).length };
  };
  // Relecture : si le texte garde une répétition ou une faute, d'autres formulations sont essayées ; on garde la meilleure
  // (le moins de remarques, puis le moins de rubriques laissées de côté).
  let meilleur = null;
  for (essai = 0; essai < 4; essai++) {
    const res = essayer();
    if (!meilleur || res.remarques * 10 + res.retirees.length < meilleur.remarques * 10 + meilleur.retirees.length) meilleur = res;
    if (!res.remarques) break;
  }
  // (École : remplacements appris des corrections de l'enseignant, faits sur le texte final ; texteBrut : sans eux, la
  // base gardée quand l'enseignant réécrit, pour que la comparaison montre toujours ses remplacements.)
  return { texte: appliquerApprisAppr(meilleur.texte, r, el.id), texteBrut: meilleur.texte, niveaux: niv, retirees: meilleur.retirees };
}

/* ---------- Style « Liées » (EPS) ----------
   Au lieu d'une phrase par rubrique (rythme haché), deux ou trois phrases reliées :
    1. une phrase qui relie l'engagement et les résultats (« Volontaire et appliquée, Léa s’appuie sur de bonnes
       capacités motrices pour progresser régulièrement. ») ;
    2. au plus deux compléments, introduits par une liaison (progrès, rôles, comportement, absences, place dans la classe) ;
    3. une fin qui rattache l'objectif ou les félicitations (« Qu’elle garde cette dynamique : bravo ! »).
   Modèles : {P} prénom, {Il} / {il} il ou elle, {masculin|féminin}, {Adj} / {adj} portrait d'engagement, {capa}
   (« de bonnes capacités motrices »), {res} (« de bons résultats »), {trav}, {eng}, {irreg}, {justes}, {apsa}, {ce}
   (« ce trimestre »), {duPer} (« du trimestre »), {suite} / {Suite} (« au prochain trimestre »), {but} (objectif à
   l'infinitif), {deBut} (« de » / « d’ » + objectif). Une liste peut dépendre du ton : { b, n, x }. */
const LIEES_APPR = {
  // Portrait d'engagement (attitude 3 ou 4), en tête de phrase.
  adj: {
    4: ['{très sérieux|très sérieuse} et volontaire', '{pleinement investi|pleinement investie}', '{consciencieux|consciencieuse} et {rigoureux|rigoureuse}',
      '{pertinent|pertinente} et {rigoureux|rigoureuse}', '{appliqué|appliquée} et toujours volontaire', '{engagé|engagée} et {exigeant|exigeante} envers {lui-même|elle-même}',
      '{motivé|motivée} et {rigoureux|rigoureuse}', '{remarquablement investi|remarquablement investie}', '{investi|investie} et {exemplaire|exemplaire}',
      '{assidu|assidue} et {exigeant|exigeante}', '{impliqué|impliquée} et {déterminé|déterminée}'],
    3: ['{sérieux|sérieuse} et {appliqué|appliquée}', 'volontaire et {appliqué|appliquée}', '{investi|investie} et {sérieux|sérieuse}', '{sérieux|sérieuse} et volontaire',
      '{appliqué|appliquée} et {engagé|engagée}', '{consciencieux|consciencieuse} et volontaire', '{motivé|motivée} et {sérieux|sérieuse}', '{impliqué|impliquée} et volontaire',
      '{assidu|assidue} et {appliqué|appliquée}', '{attentif|attentive} et {investi|investie}', '{régulier|régulière} dans ses efforts'],
  },
  capa: { 4: ['d’excellentes capacités motrices', 'de très bonnes capacités motrices', 'de très bonnes qualités physiques', 'd’excellentes aptitudes physiques', 'de remarquables qualités motrices'],
    3: ['de bonnes capacités motrices', 'de réelles capacités motrices', 'de bonnes qualités motrices', 'de solides aptitudes physiques', 'de belles qualités physiques'] },
  res: { 4: ['d’excellents résultats', 'de très bons résultats', 'des résultats remarquables', 'des performances de très bon niveau'],
    3: ['de bons résultats', 'des résultats solides', 'des résultats satisfaisants', 'de bonnes performances'] },
  capaDe: { 4: ['de ses excellentes capacités motrices', 'de ses très bonnes qualités physiques', 'de ses excellentes aptitudes physiques'],
    3: ['de ses bonnes capacités motrices', 'de ses réelles qualités motrices', 'de ses solides aptitudes physiques'] },
  // ([période, année] ; {per} : trimestre ou semestre.)
  unBon: { 4: [['un excellent {per}', 'un très bon {per}'], ['une excellente année', 'une très bonne année']],
    3: [['un bon {per}', 'un {per} réussi'], ['une bonne année', 'une année réussie']] },
  justesSans: { 2: ['perfectibles', 'fragiles', 'justes'], 1: ['fragiles', 'modestes'] },
  trav: { 4: ['rigoureux et toujours pertinent', 'exigeant et pertinent', 'très rigoureux', 'précis et exigeant'], 3: ['sérieux et régulier', 'appliqué et régulier', 'sérieux', 'consciencieux', 'soigné et régulier'] },
  eng: { 4: ['sans faille', 'exemplaire', 'remarquable', 'de tous les instants'], 3: ['sérieux', 'régulier', 'constant', 'soutenu', 'assidu'] },
  irreg: { 2: { b: ['encore irrégulier', 'irrégulier', 'trop inégal', 'en dents de scie'], n: ['irrégulier', 'inégal', 'en dents de scie'], x: ['trop irrégulier', 'insuffisant', 'bien trop inégal'] },
    1: { b: ['encore trop timide', 'encore hésitant', 'trop discret'], n: ['trop faible', 'insuffisant', 'très limité'], x: ['nettement insuffisant', 'bien trop faible', 'quasi inexistant'] } },
  justes: { 2: { b: ['encore perfectibles', 'encore justes', 'perfectibles', 'fragiles', 'en demi-teinte'], n: ['encore justes', 'moyens', 'justes', 'modestes'], x: ['insuffisants', 'trop justes', 'en deçà des attentes'] },
    1: { b: ['encore fragiles', 'encore modestes'], n: ['faibles', 'fragiles'], x: ['très insuffisants'] },
    // (Résultats corrects mais sous la moyenne de la classe.)
    retrait: ['un peu en retrait par rapport à la classe'] },
  // Phrase principale, selon l'engagement (A) et les résultats (M) : + (3 ou 4) ou − (1 ou 2).
  principale: {
    'A+M+': ['{Adj}, {P} s’appuie sur {capa}{apsa} pour progresser régulièrement.',
      '{P} allie {capa}{apsa} à un travail {trav}, si bien qu’{il} réussit dans les activités proposées.',
      '{Adj}, {P} met en valeur {capa}{apsa}, ce qui lui permet d’obtenir {res}.',
      'Grâce à un engagement {eng} et à {capa}, {P} obtient {res}{apsa}.',
      '{Adj}, {P} exploite pleinement {capa}{apsa}, si bien qu’{il} réussit dans chacune des activités.',
      '{P} fait preuve d’un engagement {eng} qui, ajouté à {capa}, lui permet d’obtenir {res}{apsa}.',
      '{Adj} tout au long {duPer}, {P} a su mettre en valeur {capa}{apsa}.',
      '{Adj}, {P} réussit dans les activités proposées{apsa}, {porté|portée} par {capa}.',
      'Toujours {adj}, {P} obtient {res}{apsa}, fruit d’un travail {trav}.',
      '{Adj}, {P} réalise {unBon}{apsa}, grâce à {capa}.',
      'Par son engagement {eng}, {P} tire le meilleur parti {capaDe}{apsa}, si bien qu’{il} réalise {unBon}.',
      'Avec {capa} et un travail {trav}, {P} obtient {res}{apsa}.',
      '{Adj}, {P} se distingue{apsa} par {capa} et un travail {trav}.',
      '{P} obtient {res}{apsa}, grâce à {capa} et à un engagement {eng}.',
      '{Adj}, {P} confirme {capa}{apsa} et obtient {res}.'],
    'A+M-': ['Même si les résultats{apsa} restent {justes}, {P} s’investit avec sérieux, ce qui est un réel atout pour progresser.',
      '{Adj}, {P} progresse à son rythme{apsa}, même si les résultats restent {justes}.',
      '{P} fournit un travail {trav}, ce qui lui permettra de consolider des résultats{apsa} qui restent {justes}.',
      '{Adj}, {P} ne ménage pas ses efforts, même si les résultats{apsa} restent {justes}.',
      '{Adj}, {P} fait de son mieux{apsa} : même si les résultats restent {justes}, cet état d’esprit lui permettra de progresser.',
      'Les résultats de {P}{apsa} restent {justes}, mais son engagement {eng} est un réel atout pour progresser.',
      'Grâce à un engagement {eng}, {P} avance à son rythme{apsa}, même si les résultats restent {justes}.',
      'Toujours {adj}, {P} fournit les efforts attendus, même si les résultats{apsa} restent {justes}.',
      '{P} se montre {adj} : cet engagement l’aidera à améliorer des résultats{apsa} qui restent {justes}.',
      '{P} aborde chaque activité avec sérieux ; cette attitude lui permettra d’améliorer des résultats{apsa} encore {justesSans}.',
      '{Adj}, {P} s’investit pleinement{apsa}, ce qui lui permettra de consolider des résultats qui restent {justes}.',
      '{Adj}, {P} ne se décourage jamais, même si les résultats{apsa} restent {justes}.',
      '{P} fait preuve d’un engagement {eng}{apsa}, qui l’aidera à améliorer des résultats encore {justesSans}.',
      'Par son attitude {adj}, {P} se donne les moyens de progresser{apsa}, même si les résultats restent {justes}.'],
    'A+M1': ['Toujours volontaire, {P} ne ménage pas ses efforts malgré des difficultés réelles{apsa}, ce qui lui permet de progresser à son rythme.',
      'Malgré des difficultés{apsa}, {P} reste {investi|investie} et {sérieux|sérieuse}, un état d’esprit qui lui permettra de progresser.',
      '{Adj}, {P} affronte avec courage des difficultés réelles{apsa}, ce qui est un réel atout pour progresser.'],
    'A-M+': { b: ['{Doté|Dotée} {capa}{apsa}, {P} gagnerait à s’investir plus régulièrement pour les exploiter pleinement.',
      '{P} possède {capa}{apsa}, qu’un engagement plus constant lui permettrait de mieux exploiter.',
      '{P} dispose {capa}{apsa}, mais un engagement {irreg} l’empêche d’en tirer pleinement parti.',
      'Grâce à {capa}, {P} a les moyens de réussir{apsa}, à condition de s’investir plus régulièrement.',
      'Avec {capa}{apsa}, {P} pourrait viser haut en s’engageant pleinement.',
      '{P} a du potentiel{apsa}, mais doit s’investir plus régulièrement pour l’exprimer pleinement.'],
    n: ['Grâce à {capa}, {P} a les moyens de réussir{apsa}, à condition de s’investir plus régulièrement.','{P} dispose {capa}{apsa}, mais un engagement {irreg} l’empêche d’en tirer pleinement parti.',
      '{Doté|Dotée} {capa}{apsa}, {P} gagnerait à s’investir plus régulièrement pour les exploiter pleinement.',
      'Avec {capa}{apsa}, {P} pourrait viser haut en s’engageant pleinement.', '{P} a du potentiel{apsa}, que son engagement {irreg} ne permet pas d’exprimer.'],
    x: ['{P} se repose trop sur {capa}{apsa} : un engagement {irreg} limite ses résultats.',
      '{P} dispose {capa}{apsa}, mais un engagement {irreg} l’empêche d’en tirer parti.',
      'Malgré {capa}{apsa}, {P} reste en deçà de ses moyens, faute d’un engagement suffisant.', '{P} ne tire pas parti {capaDe}{apsa}, son engagement restant {irreg}.'] },
    'A-M-': { b: ['Avec un engagement {irreg}, {P} peine à progresser{apsa}, alors qu’{il} en a les moyens.',
      '{P} rencontre des difficultés{apsa}, qu’un engagement plus régulier l’aiderait à surmonter.',
      '{P} obtient des résultats {justes}{apsa}, car son engagement reste {irreg} : {il} a pourtant les moyens de mieux faire.',
      'Malgré des résultats {justes}{apsa}, {P} a les moyens de progresser, à condition de s’engager davantage en cours.',
      'Malgré des difficultés{apsa}, {P} peut progresser, à condition de s’investir avec plus de régularité.',
      'Les résultats de {P}{apsa} restent {justes} : un engagement plus soutenu l’aiderait à franchir un cap.',
      '{P} dispose de réelles marges de progrès{apsa}, qu’un investissement plus régulier permettrait d’exploiter.',
      '{P} connaît des difficultés{apsa}, mais peut redresser la barre en s’engageant davantage.',
      // (Courtes : quand la place manque.)
      '{P} peut mieux faire{apsa} en s’investissant davantage.', 'Les résultats de {P}{apsa} restent {justes}, faute de régularité.',
      'Un engagement plus régulier aiderait {P} à progresser{apsa}.', '{P} a des marges de progrès{apsa}, à condition de s’impliquer.',
      '{P} doit gagner en régularité pour progresser{apsa}.', 'Plus d’engagement permettrait à {P} de progresser{apsa}.', '{P} a les moyens de mieux faire{apsa}.',
      'Avec plus d’implication, {P} pourrait progresser{apsa}.'],
    n: ['{P} obtient des résultats {justes}{apsa}, en lien avec un engagement {irreg}.', '{P} peine à progresser{apsa}, faute d’un engagement suffisant.',
      'Les difficultés de {P}{apsa} tiennent en partie à un engagement {irreg}.', 'Avec un engagement {irreg}, {P} obtient des résultats {justes}{apsa}.',
      'Le manque de régularité dans l’engagement de {P} pèse sur ses résultats{apsa}.', '{P} reste en difficulté{apsa}, son investissement étant {irreg}.',
      'Le travail de {P}{apsa} manque de régularité.', '{P} doit s’investir davantage{apsa}.', 'Les résultats de {P}{apsa} restent {justes}.',
      '{P} peine à progresser{apsa}.', '{P} manque de régularité dans son travail{apsa}.'],
    x: ['Les résultats de {P}{apsa} sont {justes}, à l’image d’un engagement {irreg}.',
      '{P} obtient des résultats {justes}{apsa}, faute d’un engagement suffisant en cours.',
      'Faute d’un engagement suffisant, {P} obtient des résultats {justes}{apsa}.', 'Les résultats de {P}{apsa} restent {justes}, son engagement étant {irreg}.',
      '{P} ne s’investit pas assez{apsa}.', 'Le travail de {P}{apsa} reste insuffisant.', '{P} doit fournir bien plus d’efforts{apsa}.',
      '{P} ne fournit pas les efforts attendus{apsa}.', 'L’engagement de {P}{apsa} est insuffisant.'] },
    // Engagement non mentionné : les résultats seuls.
    'M+': ['{P} dispose {capa}{apsa}, ce qui lui permet d’obtenir {res}.', '{P} met en valeur {capa}{apsa}, si bien qu’{il} réussit dans les activités proposées.',
      'Grâce à {capa}, {P} obtient {res}{apsa}.', '{P} se distingue par {capa}{apsa}, qui lui permettent d’obtenir {res}.'],
    'M-': { b: ['{P} obtient des résultats {justes}{apsa}, qui ne demandent qu’à s’améliorer.', 'Malgré des résultats {justes}{apsa}, {P} a les moyens de progresser.', 'Les résultats de {P}{apsa} restent {justes}, mais une marge de progrès existe.'],
      n: ['{P} obtient des résultats {justes}{apsa}.', 'Les résultats de {P}{apsa} restent {justes}.'],
      x: ['{P} obtient des résultats {justes}{apsa}.', 'Les résultats de {P}{apsa} sont {justes}.'] },
  },
  // Compléments : une proposition précédée d'une liaison, prise dans « meme » quand elle va dans le sens de la phrase
  // principale, dans « contre » sinon. (Deux liaisons hors des familles de LIAISONS_APPR, « d’ailleurs », « qui plus
  // est », « pour autant », pour que deux compléments ne répètent jamais une liaison de même sens.)
  // (« D’ailleurs » appuie un point fort ; pour une difficulté de plus, « De plus », « En outre », « Qui plus est ».)
  liens: { meme: ['De plus', 'En outre', 'D’ailleurs', 'Qui plus est', 'D’autre part'], memeNeg: ['De plus', 'En outre', 'Qui plus est', 'D’autre part'],
    contre: ['Toutefois', 'Néanmoins', 'Cependant', 'Pour autant', 'Cela dit'] },
  complements: {
    progression: {
      4: ['{il} a nettement progressé {ce}', 'ses progrès sont remarquables {ce}', '{il} a fait de nets progrès {ce}'],
      3: ['{il} est en progrès {ce}', 'ses progrès sont réguliers et encourageants', '{il} progresse régulièrement'],
      1: { b: ['{il} s’est {montré|montrée} moins {régulier|régulière} {ce}, d’où des résultats en baisse', 'le niveau a baissé {ce}, ce qui appelle un sursaut',
        'les résultats ont fléchi {ce}', 'un léger recul est visible {ce}', '{il} a perdu un peu de régularité {ce}'],
        n: ['les résultats sont en baisse {ce}', 'le niveau a baissé {ce}', 'les résultats ont reculé {ce}', 'un recul est visible {ce}'],
        x: ['les résultats sont en net recul {ce}', 'le niveau est en net recul {ce}', 'les résultats ont nettement baissé {ce}'] },
    },
    methodo: {
      4: ['son sérieux dans les rôles confiés (arbitre, juge, observateur) est un réel atout pour le groupe', 'sa méthode de travail est un réel atout', '{il} assume avec beaucoup de sérieux les rôles confiés'],
      2: ['{il} doit gagner en rigueur dans les rôles et l’organisation', 'la tenue des rôles (arbitre, juge, observateur) reste à améliorer', 'la tenue des rôles reste fragile',
        '{il} doit gagner en rigueur dans les rôles', 'les rôles confiés demandent plus de rigueur', 'son organisation reste à consolider'],
      1: ['les rôles confiés (arbitre, juge, observateur) sont peu assumés', '{il} peine à s’organiser et à tenir les rôles confiés', 'les rôles confiés sont peu assumés'],
    },
    comportement: {
      4: ['son comportement, respectueux de tous, est exemplaire', 'son comportement est exemplaire envers chacun'],
      2: ['son attitude en cours, parfois dissipée, freine ses progrès', 'le respect des consignes doit s’améliorer', 'son attitude est parfois dissipée'],
      1: { b: ['le respect des règles et des camarades doit devenir une priorité', 'son comportement doit s’améliorer pour progresser sereinement', 'son comportement doit s’améliorer'],
        n: ['son comportement, qui nuit au travail de la classe, doit changer rapidement', 'son comportement pose problème et doit changer rapidement', 'son comportement pose problème'],
        x: ['son comportement, inacceptable, nuit au travail de la classe', 'son comportement est inacceptable et perturbe le groupe', 'son comportement est inacceptable'] },
    },
    competences: {
      4: ['les compétences travaillées sont très bien maîtrisées', 'la maîtrise des compétences travaillées est excellente'],
      2: ['la maîtrise des compétences travaillées reste fragile', 'les compétences travaillées restent à consolider'],
      1: ['les compétences travaillées ne sont pas encore acquises'],
    },
    absences: ['de nombreuses absences freinent ses progrès', 'des absences fréquentes nuisent à son travail', 'ses absences répétées pèsent sur ses résultats'],
    // (Sans liaison : phrase complète.)
    tete: ['{Il} se place ainsi parmi les meilleurs de la classe.', 'Cela {le|la} place parmi les meilleurs de la classe.',
      'Ses résultats {le|la} placent parmi les meilleurs de la classe.', '{Il} figure ainsi parmi les meilleurs élèves de la classe.'],
  },
  // Fin : félicitations (« haut ») ou objectif rattaché ; selon le ton, et pour « haut » selon le niveau d'ensemble.
  fin: {
    haut: { b4: ['Qu’{il} garde cette exigence : félicitations !', 'Je l’encourage à poursuivre dans cette voie : félicitations !', 'Bravo pour ce travail, à poursuivre {suite} !',
      'Félicitations pour cet état d’esprit, qu’{il} doit garder {suite} !',
      // (Courtes : quand la place manque.)
      'Toutes mes félicitations !', 'Qu’{il} continue ainsi : félicitations !', 'Excellent travail : félicitations !', 'Bravo pour cette belle réussite !',
      'Félicitations, {il} peut être {fier|fière} de son travail !', 'Une réussite à poursuivre : bravo !'],
    b: ['Je l’encourage à poursuivre dans cette voie : bravo !', 'C’est en gardant cet état d’esprit qu’{il} continuera de réussir : bravo !',
      'Qu’{il} garde cette dynamique {suite} : bravo !', 'Bravo pour cet état d’esprit, à conserver {suite} !',
      'Je {le|la} félicite pour ce travail et l’encourage à poursuivre {suite}.',
      'Qu’{il} continue ainsi : bravo !', 'Un bon travail à poursuivre : bravo !', 'Bravo, et bonne continuation !', 'C’est un bon travail : bravo !',
      'Je {le|la} félicite et l’encourage à continuer.'],
    n: ['Je l’encourage à poursuivre dans cette voie.', 'Qu’{il} garde cette dynamique {suite}.', 'Il faudra {but} {suite}.', 'Ce travail est à poursuivre {suite}.',
      'Qu’{il} continue ainsi.', 'Bon travail, à poursuivre.', 'Il faudra maintenir ce niveau {suite}.',
      'Ce niveau est à maintenir.', 'Un travail sérieux, à poursuivre.', 'Qu’{il} poursuive dans cette voie.', 'Des résultats à consolider {suite}.'],
    x: ['Qu’{il} garde cette exigence {suite}.', 'Il faudra {but} {suite}.', 'Ce niveau d’exigence doit être maintenu {suite}.', 'Ce niveau doit être confirmé {suite}.',
      'Qu’{il} maintienne ce niveau.', 'Il faudra désormais {but}.'] },
    but: { b: ['{Suite}, je l’encourage à {but} pour continuer de progresser. Courage !', 'Il reste maintenant à {but}, et les progrès suivront. Courage !',
      'Je l’encourage à {but} : c’est à cette condition qu’{il} pourra progresser {suite}.', 'Je l’encourage à {but} {suite} : ses efforts finiront par payer.',
      '{Suite}, {il} devra {but}, et je sais qu’{il} en est capable.', 'Je compte sur {lui|elle} pour {but} {suite} !', 'Je l’invite à {but} {suite} : courage !',
      // (Courtes : quand la place manque.)
      '{Il} devra {but} : courage !', 'Il faudra {but}. Bon courage !', 'À {lui|elle} de {but} {suite} !', 'Je l’invite à {but} : bon courage !',
      'L’objectif sera de {but} {suite}.', '{Il} doit à présent {but} : je compte sur {lui|elle} !', 'Prochaine étape : {but}.',
      'Pour aller plus loin, {il} devra {but}.', 'Je {le|la} sais capable de {but} : courage !'],
    // (Bienveillant, niveau d'ensemble correct : les efforts sont salués.)
    b3: ['Je l’encourage à {but} {suite} : bravo pour ses efforts !', 'Je salue ses efforts ; il faudra maintenant {but}.'],
    n: ['{Suite}, il faudra {but} pour progresser.', 'Il faut maintenant {but} : c’est à cette condition qu’{il} progressera.', 'Je l’encourage à {but} {suite}.', '{Suite}, {il} devra {but}.',
      '{Il} devra {but}.', 'Prochain objectif : {but}.', 'Pour progresser, {il} devra {but}.', 'L’objectif sera de {but}.'],
    x: ['{Il} devra impérativement {but} {suite}.', 'Il est essentiel {deBut} {suite}.', '{Suite}, {il} devra {but} : c’est à cette condition qu’{il} progressera.',
      '{Il} doit {but} sans attendre.', 'Il faudra désormais {but}.', 'J’attends {de lui|d’elle} qu’{il} parvienne à {but}.'] },
  },
};

function redigerLieesAppr(el, periode, a, niveauxPerso, r, graine = 0) {
  const sexe = ['F', 'G'].includes(el.sexe) ? el.sexe : '';
  if (!sexe) return null;
  niveauxPerso = persoUtileAppr(r, a, niveauxPerso);
  const niv = { ...a.niveaux };
  for (const [k, v] of Object.entries(niveauxPerso)) niv[k] = v || null; // 0 = ne pas en parler
  const actives = rubriquesAppr(r, a, niveauxPerso), vigilance = vigilanceAppr(r, a, niveauxPerso);
  const dit = k => (actives.includes(k) && niv[k] ? niv[k] : null);
  const L = LIEES_APPR, fem = sexe === 'F', ton = r.ton[0] === 'b' ? 'b' : r.ton[0] === 'e' ? 'x' : 'n';
  const prenom = (el.prenom || '').trim() || el.nom;
  const selon = x => (Array.isArray(x) ? x : x[ton] || x.n || []);
  // Les phrases parlent des capacités motrices : motricité non mentionnée → style « Phrases ».
  const cleM = dit('moteur') ? 'moteur' : null;
  if (!cleM) return null;
  const A = dit('attitude'), M = niv[cleM];
  // (Résultats corrects, mais sous la moyenne de la classe : dits « un peu en retrait », jamais « bons ».)
  const retrait = M === 3 && a.details.position?.cle === 'retrait';
  const Mp = M >= 3 && !retrait;
  const p = periodesAnnee().find(x => x.id === periode), derniere = periode === 'annee' || periodesAnnee().at(-1)?.id === periode;
  const per = periode === 'annee' ? 'année' : p?.code?.startsWith('S') ? 'semestre' : 'trimestre';
  const ce = periode === 'annee' ? 'cette année' : `ce ${per}`, duPer = periode === 'annee' ? 'de l’année' : `du ${per}`;
  // (Plusieurs façons de dire la suite : « au prochain trimestre » ne vient pas après « ce trimestre ».)
  const suites = derniere ? ['l’an prochain', 'à l’avenir'] : [`au prochain ${per}`, 'pour la suite', 'dans les semaines à venir'];
  const apsa = (() => {
    const d = a.details, x = n => activiteDansPhrase(n);
    if (d.apsaSeule) return x(d.apsaSeule);
    if (Mp && d.apsaForte && x(d.apsaForte)) return ', notamment' + x(d.apsaForte);
    if (!Mp && d.apsaFaible && x(d.apsaFaible)) return ', notamment' + x(d.apsaFaible);
    return '';
  })();
  const maj = s => (s ? s[0].toLocaleUpperCase('fr') + s.slice(1) : s);
  let essai = 0;
  const g = cle => `${el.id}|${periode}|${graine}|${essai}|liees|${cle}`;
  const kM = retrait ? 2 : M, kA = A || 3;
  // Classe : les élèves se partagent les tournures (place dans l'ordre alphabétique, voir analyserAppr). Pour un même
  // choix, chaque élève part d'une case de la liste décalée selon sa place : deux voisins n'ont jamais la même
  // tournure, et toutes servent avant qu'une revienne (pas premier avec la longueur de la liste).
  const rang = a.details.rang ?? -1;
  const departClasse = (n, cle) => {
    const commune = `${periode}|${graine}|${essai}|liees|${cle}`;
    let pas = 1 + Math.floor(hasardAppr('pas|' + commune) * (n - 1));
    const pgcd = (x, y) => (y ? pgcd(y, x % y) : x);
    while (pas > 1 && pgcd(pas, n) !== 1) pas--;
    // (+ un cran à chaque tour complet de la liste : deux élèves dont l’écart de place est un multiple de sa longueur
    // ne tombent pas sur la même case.)
    return (Math.floor(hasardAppr(commune) * n) + rang * pas + Math.floor(rang / n)) % n;
  };
  const tirer = (liste, cle) => (rang < 0 || liste.length < 2 ? choisirAppr(liste, g(cle)) : liste[departClasse(liste.length, cle)]);
  // Valeurs des cases ({adj}, {capa}…) : tirées pour chaque modèle candidat.
  const valeurs = n => ({
    adj: tirer(L.adj[kA >= 4 ? 4 : 3], 'adj' + n), capa: tirer(L.capa[kM >= 4 ? 4 : 3], 'capa' + n),
    res: tirer(L.res[kM >= 4 ? 4 : 3], 'res' + n), trav: tirer(L.trav[kA >= 4 ? 4 : 3], 'trav' + n),
    eng: tirer(L.eng[kA >= 4 ? 4 : 3], 'eng' + n), irreg: tirer(selon(L.irreg[kA <= 1 ? 1 : 2]), 'irreg' + n),
    justes: tirer(retrait ? L.justes.retrait : selon(L.justes[kM <= 1 ? 1 : 2]), 'justes' + n),
    justesSans: tirer(retrait ? L.justes.retrait : L.justesSans[kM <= 1 ? 1 : 2], 'justesSans' + n),
    capaDe: tirer(L.capaDe[kM >= 4 ? 4 : 3], 'capaDe' + n),
    unBon: tirer(L.unBon[kM >= 4 ? 4 : 3][periode === 'annee' ? 1 : 0], 'unBon' + n).replace('{per}', per),
  });
  const but = (() => {
    if (!actives.includes('objectif') || niv.objectif === null) return null;
    const o = objectifAppr(niv, a, [...vigilance, ...actives.filter(k => !vigilance.has(k))]);
    return { cle: o.cle, liste: objectifsAppr()[o.cle] || [] };
  })();
  const remplir = (t, v = {}) => t
    .replace(/\{Adj\}/g, () => maj(v.adj)).replace(/\{(adj|capa|capaDe|res|trav|eng|irreg|justes|justesSans|unBon)\}/g, (x, k) => v[k] ?? '')
    .replace(/\{([^{}|]*)\|([^{}]*)\}/g, (x, m, f) => (fem ? f : m))
    .replace(/\{Il\}/g, fem ? 'Elle' : 'Il').replace(/\{il\}/g, fem ? 'elle' : 'il').replace(/\{P\}/g, prenom)
    .replace(/\{apsa\}(?= [\p{L}])/gu, apsa + (apsa.startsWith(',') ? ',' : '')).replace(/\{apsa\}/g, apsa)
    .replace(/\{ce\}/g, ce).replace(/\{duPer\}/g, duPer).replace(/\{Suite\}/g, () => maj(v.suite || suites[0])).replace(/\{suite\}/g, () => v.suite || suites[0])
    .replace(/\{deBut\}/g, () => (/^[aeiouyâàéèêîôûh]/i.test(v.but || '') ? 'd’' : 'de ') + (v.but || '')).replace(/\{but\}/g, () => v.but || '');
  const ignores = [prenom, ...prenom.split(/[\s-]+/)];
  // Parmi des textes déjà remplis : ceux qui répètent le moins ce qui est écrit (et, en mode court, les plus courts).
  const choisir = (textes, cle, ecrit, court) => {
    if (!textes.length) return '';
    const c = textes.map(t => conflitsAppr(ecrit, t, ignores)), min = Math.min(...c);
    let l = textes.filter((t, i) => c[i] === min);
    // (court = 1 : parmi les plus courtes, à 30 caractères près ; 2 : à 10 près ; 3 : la plus courte.)
    if (court) { const lm = Math.min(...l.map(t => t.length)); l = l.filter(t => t.length <= lm + (court === 3 ? 0 : court === 2 ? 10 : 30)); }
    if (rang < 0 || l.length < 2) return choisirAppr(l, g(cle));
    // (Classe : la 1re des tournures permises en partant de la case de l'élève dans la liste complète.)
    const permis = new Set(l), n = textes.length, d0 = departClasse(n, cle);
    for (let k = 0; k < n; k++) { const t = textes[(d0 + k) % n]; if (permis.has(t)) return t; }
    return l[0];
  };

  // 1. Phrase principale.
  const cleP = !A ? (Mp ? 'M+' : 'M-') : A >= 3 ? (Mp ? 'A+M+' : M <= 1 ? 'A+M1' : 'A+M-') : (Mp ? 'A-M+' : 'A-M-');
  let modelesP = selon(L.principale[cleP]);
  if (cleP === 'A+M1') modelesP = [...modelesP, ...selon(L.principale['A+M-'])];
  // (Sans activité ou sans {Adj} : pas de modèle qui laisse une case vide.)
  // (Progression stable ou en baisse : pas de « pour progresser régulièrement ».)
  const nProg = dit('progression');
  if (nProg && nProg <= 2) modelesP = modelesP.filter(t => !/progress\S* régulièrement/.test(t));
  // (Rangés modèle après modèle, trois fois : deux cases voisines de la liste sont deux modèles différents.)
  const candidatsP = [0, 1, 2].flatMap(n => modelesP.map((t, i) => remplir(t, valeurs(i * 3 + n))));
  const polP = A && A >= 3 && Mp ? 1 : !A && Mp ? 1 : -1;

  // 2. Compléments possibles, du plus important au moins important.
  const comps = [];
  // (La liaison dépend de la phrase d'avant : voir construire.)
  const ajouterComp = (cle, banque, prio, pol) => {
    if (!banque) return;
    const props = selon(banque);
    if (props.length) comps.push({ cle, prio, pol, props });
  };
  // Chaque proposition, avec chaque liaison du bon sens par rapport à la phrase d'avant (polAvant) : la relecture
  // garde celle qui ne répète rien.
  const versionsComp = (c, polAvant) => {
    if (c.cle === 'tete') return c.props;
    const liens = L.liens[c.pol !== polAvant ? 'contre' : c.pol > 0 ? 'meme' : 'memeNeg'];
    return c.props.flatMap(t => liens.map(l => `${l}, ${t}.`));
  };
  if (nProg && nProg !== 2) ajouterComp('progression', L.complements.progression[nProg], vigilance.has('progression') ? 5 : nProg === 3 ? 1 : 4, nProg >= 3 ? 1 : -1);
  const nMeth = dit('methodo');
  if (nMeth && nMeth !== 3) ajouterComp('methodo', L.complements.methodo[nMeth], vigilance.has('methodo') ? 5 : 3, nMeth >= 3 ? 1 : -1);
  const nComp = dit('comportement');
  if (nComp && nComp !== 3) ajouterComp('comportement', L.complements.comportement[nComp], vigilance.has('comportement') ? 5.1 : nComp === 4 ? 2 : 4, nComp >= 3 ? 1 : -1);
  const nC = cleM === 'moteur' ? dit('competences') : null;
  if (nC && nC !== 3 && !(nC === 4 && M === 4) && !(nC <= 2 && !Mp)) ajouterComp('competences', L.complements.competences[nC], vigilance.has('competences') ? 5 : 2, nC >= 3 ? 1 : -1);
  if (a.details.absences >= 3 && A && A <= 2) ajouterComp('absences', L.complements.absences, 4.5, -1);
  if (a.details.position?.cle === 'tete' && Mp && polP > 0) ajouterComp('tete', L.complements.tete, 1.5, 1);
  comps.sort((x, y) => y.prio - x.prio);

  // 3. Fin.
  const kG = Math.round(moyenneListe([A, M, dit('competences')].filter(Boolean)));
  const modelesFin = !but ? (polP > 0 && ton !== 'x' ? L.fin.haut[kG >= 4 && ton === 'b' ? 'b4' : ton].filter(m => !m.includes('{but}')) : [])
    : but.cle === 'haut' ? L.fin.haut[kG >= 4 && ton === 'b' ? 'b4' : ton]
      : [...L.fin.but[ton], ...(ton === 'b' && kG >= 3 && A >= 3 ? L.fin.but.b3 : [])]; // (« bravo pour ses efforts » : s'il en fait)

  // court : formulations courtes des compléments et de la fin ; courtP : de la phrase principale (raccourcie en dernier,
  // pour que les élèves d'une classe ne commencent pas tous par la même phrase courte).
  const construire = (nbComp, court, sansFin = false, courtP = court) => {
    let ecrit = '';
    const morceaux = [];
    const mettre = t => { if (t) { morceaux.push(t); ecrit += ' ' + t; } };
    mettre(choisir(candidatsP, 'principale', '', courtP));
    // (La phrase principale parle déjà de progrès : pas de « ses progrès sont réguliers » en plus.)
    const utiles = comps.filter(c => !(c.cle === 'progression' && nProg >= 3 && /progress/.test(ecrit))), pris = utiles.slice(0, nbComp);
    let polAvant = polP;
    // (« Cela la place parmi les meilleurs… » suit directement la phrase principale.)
    pris.sort((x, y) => (y.cle === 'tete') - (x.cle === 'tete'));
    for (const c of pris) { mettre(choisir(versionsComp(c, polAvant).map(t => remplir(t)), 'comp-' + c.cle, ecrit, court)); polAvant = c.pol; }
    if (sansFin) return fini(morceaux, utiles.slice(nbComp), true);
    const avecSuite = m => (/\{[Ss]uite\}/.test(m) ? suites : [null]);
    const finsRemplies = modelesFin.flatMap(m => avecSuite(m).flatMap(s => (m.includes('{but}') || m.includes('{deBut}') ? (but?.liste || []).map(b => remplir(m, { but: b, suite: s })) : [remplir(m, { suite: s })])))
      // (Pas de « pour progresser pour la suite », ni de « pour … pour la suite ».)
      .filter(t => !/\bpour [^.!:;]* pour la suite/.test(t));
    mettre(choisir(finsRemplies, 'fin', ecrit, court));
    return fini(morceaux, utiles.slice(nbComp), false);
  };
  const fini = (morceaux, laisses, sansFin) => ({ texte: corrigerAppr(morceaux.join(' '), { retirerAdverbes: true }),
    retirees: [...laisses.map(c => c.cle).filter(k => RUBRIQUES_APPR[k]), ...(sansFin && modelesFin.length && but ? ['objectif'] : [])] });
  // Le plus de compléments possible dans la longueur ; les formulations courtes avant de retirer un complément ;
  // en dernier recours (longueur très courte), sans la fin.
  // (Un texte qui tient mais garde une répétition : on essaie encore avec un complément de moins ; le plus juste gagne.)
  const essayer = () => {
    let res = null;
    const noter = x => ({ ...x, remarques: relireAppr(x.texte, el).filter(y => y.grave).length });
    // 1er passage : la phrase principale garde du choix (courtP 0 ou 1) ; un complément secondaire est laissé de côté
    // plutôt que de prendre partout la même phrase courte (jamais un point de vigilance, prio ≥ 5).
    // 2e passage : la phrase principale la plus courte, avec tous les compléments possibles.
    const nbMax = Math.min(2, comps.length), nbVigil = Math.min(nbMax, comps.filter(c => c.prio >= 5).length);
    for (const [paliers, nbMin] of [[[[0, 0], [1, 0], [2, 0], [1, 1], [2, 1], [2, 2], [3, 0], [3, 1]], nbVigil], [[[3, 2], [3, 3]], 0]]) {
      for (let nb = nbMax; nb >= nbMin && !(res && !res.remarques); nb--) {
        // (Compléments et fin raccourcis d'abord, la phrase principale ensuite.)
        for (const [court, courtP] of paliers) {
          const x = construire(nb, court, false, courtP);
          if (x.texte.length <= r.longueur) { const n = noter(x); if (!res || n.remarques < res.remarques) res = n; break; }
        }
      }
      if (res && !res.remarques) break;
    }
    if (!res) { const x = construire(0, 3, true); if (x.texte.length <= r.longueur) res = noter(x); }
    return res || noter(construire(0, 3));
  };
  let meilleur = null;
  for (essai = 0; essai < 4; essai++) {
    const res = essayer();
    if (!meilleur || res.remarques * 10 + res.retirees.length < meilleur.remarques * 10 + meilleur.retirees.length) meilleur = res;
    if (!res.remarques) break;
  }
  return { texte: meilleur.texte, texteBrut: meilleur.texte, niveaux: niv, retirees: [...new Set(meilleur.retirees)] };
}

/* ---------- Appréciation d'un élève (texte gardé, ou proposé) ---------- */

function appreciationEleve(el, periode, eleves, r = reglageAppr()) {
  const enreg = Donnees.get('suivis', idAppr(el.id, periode));
  const analyse = analyserAppr(el, periode, eleves);
  const propose = redigerAppr(el, periode, analyse, enreg?.niveaux, r, enreg?.graine || 0);
  return { enreg, analyse, propose, texte: enreg?.texte || propose.texte, manuel: !!enreg?.texte };
}

function ecrireAppr(eleveId, periode, changements) {
  const id = idAppr(eleveId, periode), avant = Donnees.get('suivis', id) || {};
  const apres = { ...avant, id, eleveId, apsa: 'appréciation ' + periode, periode, niveaux: avant.niveaux || {}, graine: avant.graine || 0, texte: avant.texte || '', ...changements };
  if (JSON.stringify({ ...avant, maj: 0 }) === JSON.stringify({ ...apres, maj: 0 })) return;
  Donnees.ecrire('suivis', apres);
}

async function copierTexte(texte) {
  try { await navigator.clipboard.writeText(texte); }
  catch {
    const t = document.createElement('textarea');
    t.value = texte; document.body.append(t); t.select();
    document.execCommand('copy'); t.remove();
  }
  toast('Copié ✔ — colle-le dans le bulletin', 'ok');
}

/* ---------- Fenêtre « ✍ Appréciations » de la classe ---------- */

// École : pastilles du portrait (qualités, points d'attention, situations), à toucher pour décrire l'élève.
function htmlPortraitAppr(el, periode) {
  const P = portraitProfil();
  if (!P) return '';
  const choisis = portraitAppr(el.id, periode), propre = Array.isArray(Donnees.get('suivis', idAppr(el.id, periode))?.portrait);
  const groupe = (cle, titre, classe) => `<div class="groupe-portrait"><span class="titre-portrait">${titre}</span>${P[cle].map(x => {
    const oui = choisis.includes(x.id);
    return `<button type="button" class="pastille-portrait${classe}" data-appr-portrait="${esc(x.id)}" aria-pressed="${oui}">${esc(x.nom)}</button>`;
  }).join('')}</div>`;
  return `<div class="portrait-appr" role="group" aria-label="Portrait de l’élève">
    <p class="aide">Portrait de ${esc(el.prenom || el.nom)} : touche 2 ou 3 pastilles pour rendre l’appréciation plus personnelle${choisis.length && !propre ? ' (repris de la période précédente)' : ''}.</p>
    ${groupe('qualites', 'Qualités', '')}${groupe('attention', 'À surveiller', ' attention')}${groupe('situations', 'Situation', ' situation')}${htmlPhrasesEleveAppr(el, periode)}</div>`;
}
// École : phrases écrites par l'enseignant pour cet élève aux autres périodes (voir phrasesEleveAppr), à reprendre d'un toucher.
function htmlPhrasesEleveAppr(el, periode) {
  const prises = Donnees.get('suivis', idAppr(el.id, periode))?.phrases || [];
  const toutes = [...new Set([...prises, ...phrasesEleveAppr(el.id, periode)])];
  if (!toutes.length) return '';
  return `<div class="groupe-portrait"><span class="titre-portrait">Tes phrases</span>${toutes.map(t => `<button type="button" class="pastille-portrait perso"
    data-appr-phrase="${esc(t)}" aria-pressed="${prises.includes(t)}" title="${esc(t)}">${esc(t.length > 48 ? t.slice(0, 46) + '…' : t)}</button>`).join('')}</div>`;
}

// suite : contenu ajouté au bas de la carte (fiche bilan : le ⚙ des réglages, dans la carte même).
function htmlCarteAppr(el, periode, eleves, r, suite = '') {
  const { analyse, propose, texte, manuel, enreg } = appreciationEleve(el, periode, eleves, r);
  const perso = persoUtileAppr(r, analyse, enreg?.niveaux);
  // Rubriques montrées : celles cochées, plus les décochées que le carnet signale (⚠ point de vigilance, en priorité
  // dans le texte). Une rubrique décochée mise à « non mentionné » disparaît (↺ niveaux calculés pour la retrouver).
  const vigilance = vigilanceAppr(r, analyse, perso), abordees = new Set(rubriquesAppr(r, analyse, perso));
  const puces = r.ordre.filter(k => k !== 'objectif' && (r.actives.includes(k) || abordees.has(k))).map(k => {
    const n = propose.niveaux[k] || 0, change = k in perso, vigil = vigilance.has(k);
    const noms = k === 'progression' ? NOMS_NIV_PROG : NOMS_NIV_APPR;
    const source = (vigil ? `⚠ Point de vigilance : ce que tu as rempli signale une difficulté, l’appréciation en parle en priorité${r.actives.includes(k) ? '' : ' (même si la rubrique est décochée)'}.\n` : '')
      + (change ? `Choisi par toi (calculé : ${analyse.niveaux[k] ? noms[analyse.niveaux[k]] : 'pas de donnée'})` : analyse.sources[k] || 'Pas de donnée : non mentionné');
    return `<button type="button" class="puce-appr n${n}${change ? ' change' : ''}${!change && analyse.defaut[k] ? ' defaut' : ''}${vigil ? ' vigilance' : ''}" data-appr-niveau="${k}"
      title="${esc(source + '\n(toucher pour changer)')}">${vigil ? '⚠ ' : ''}${esc(rubriqueAppr(k).nom)} <b>${n || '–'}</b><small>${esc(noms[n])}</small></button>`;
  }).join('');
  const retirees = propose.retirees.length && !manuel
    ? `<span class="aide">Faute de place, laissé de côté : ${propose.retirees.map(nomMorceauAppr).join(', ')}.</span>` : '';
  return `<div class="carte-appr" data-appr-eleve="${el.id}">
    <div class="tete-appr"><b>${esc(el.nom)} ${esc(el.prenom)}</b>
      ${manuel ? '<span class="badge-appr">modifiée à la main</span>' : ''}
      <span class="espace"></span>
      ${manuel ? '<button type="button" data-appr-reproposer title="Remplacer ton texte par la proposition de l’appli">🔄 Reproposer</button>'
    : '<button type="button" data-appr-autre title="Mêmes niveaux, autres phrases">🎲 Autre formulation</button>'}
      <button type="button" data-appr-copier>📋 Copier</button></div>
    <div class="puces-appr">${puces}${Object.keys(perso).length ? '<button type="button" class="lien" data-appr-auto title="Revenir aux niveaux calculés par l’appli">↺ niveaux calculés</button>' : ''}</div>
    ${htmlPortraitAppr(el, periode)}
    <textarea class="texte-appr" data-appr-texte rows="3" maxlength="3000" aria-label="${esc(`Appréciation de ${el.nom} ${el.prenom}`)}">${esc(texte)}</textarea>
    <div class="pied-appr"><span class="compte-appr${texte.length > r.longueur ? ' trop' : ''}" data-appr-compte>${texte.length} / ${r.longueur} caractères</span>${retirees}</div>
    <div class="relecture-appr" data-appr-relecture>${htmlRelectureAppr(texte, el, prenomsAutresAppr(el, eleves), manuel)}</div>
    ${suite}
  </div>`;
}

async function ouvrirAppreciations(periodeVoulue, eleveVise) {
  const c = classeActive();
  if (!c) return;
  const eleves = elevesDe(c.id);
  if (!eleves.length) return toast('Pas encore d’élèves dans cette classe.', 'erreur');
  const periodes = periodesAnnee();
  // Période : celle demandée, sinon celle affichée dans Notes, sinon la période en cours.
  let periode = periodeVoulue || (periodeAffichee() !== 'annee' ? periodeAffichee() : periodeDe(aujourdhui()) || 'annee');
  let r = reglageAppr();

  const { d, resultat } = ouvrirModale(`Appréciations — ${c.nom}`, `
    <p class="aide">L’appli propose une appréciation pour chaque élève à partir de ton carnet : notes, degrés de maîtrise, ${motMin('lecons')}
      (présence, données relevées) et mots-clés de tes observations. Touche une rubrique pour changer son niveau ;
      tu peux aussi réécrire le texte. Tout reste dans ton carnet (chiffré sur la clé).</p>
    <div class="fiche-onglets" data-appr-periodes></div>
    <details class="reglages-appr"><summary>⚙ Réglages des appréciations <small>rubriques, ton, style, longueur</small></summary>
      <div data-appr-reglages>${htmlReglageAppr(r)}</div></details>
    <div data-appr-liste></div>`,
  '<button type="button" data-appr-tout title="Copie « NOM Prénom [tab] appréciation », une ligne par élève (se colle aussi dans Excel)">📋 Copier toutes</button>'
    + '<button type="button" data-appr-ed title="Nécessite l’extension Passerelle (bouton puzzle, en bas à gauche). Rien n’est envoyé : c’est toi qui colles et qui enregistres.">📋 Reporter sur École Directe</button>'
    + '<span class="espace aide" data-appr-ed-message role="status"></span><button type="button" data-fermer class="primaire">Fermer</button>', 'modale-large modale-appr');
  const form = $('form', d);


  const dessiner = () => {
    $('[data-appr-periodes]', d).innerHTML = [...periodes.map(p => [p.id, p.code]), ['annee', 'Toute l’année']]
      .map(([v, nom]) => `<button type="button" class="${v === periode ? 'actif' : ''}" data-appr-periode="${v}">${nom}</button>`).join('');
    const evals = evalsPeriode(c.id, periode), seances = seancesPeriode(c.id, periode);
    $('[data-appr-liste]', d).innerHTML = (evals.length || seances.length ? ''
      : `<p class="aide">⚠ Aucune évaluation ni ${motMin('lecon')} sur cette période : les propositions ne s’appuient que sur tes observations.</p>`)
      + eleves.map(el => htmlCarteAppr(el, periode, eleves, r)).join('');
  };
  // Cartes des élèves (niveaux, formulation, texte réécrit, copier) : même fonctionnement que dans la fiche bilan.
  const { enregistrerTexte } = gererCartesAppr(d, { periode: () => periode, eleves, r: () => r });
  // (Le texte en cours de frappe est enregistré AVANT de changer les réglages : comparé à la proposition faite avec les
  // nouveaux réglages, il passerait pour réécrit à la main et ne suivrait plus les réglages.)
  const reglagesModifies = () => {
    enregistrerTexte();
    r = { ...reglageAppr(), ...lireReglageAppr(form) };
    ecrireReglage('appreciations', lireReglageAppr(form));
    dessiner();
  };

  d.addEventListener('click', e => lancer(async () => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.apprPeriode) { enregistrerTexte(); periode = b.dataset.apprPeriode; $('[data-appr-ed-message]', d).textContent = ''; dessiner(); return; }
    if (b.dataset.apprMonter || b.dataset.apprDescendre) { deplacerRubriqueAppr(b); reglagesModifies(); return; }
    if (b.matches('[data-appr-tout]')) {
      enregistrerTexte();
      return copierTexte(eleves.map(el => `${el.nom} ${el.prenom}\t${appreciationEleve(el, periode, eleves, r).texte}`).join('\n'));
    }
    if (b.matches('[data-appr-ed]')) {
      enregistrerTexte();
      $('[data-appr-ed-message]', d).textContent = await apprVersEcoleDirecte(c, periode, eleves, r);
      return;
    }
  }));
  // Réglages : les appréciations sont refaites aussitôt (cases, listes) ; la longueur pendant la frappe, après une
  // courte pause (seule la liste est redessinée : le champ garde la main).
  let minuteurReglages = null;
  d.addEventListener('change', e => { if (e.target.closest('[data-appr-reglages]')) { clearTimeout(minuteurReglages); reglagesModifies(); } });
  d.addEventListener('input', e => {
    if (!e.target.closest('[data-appr-reglages]') || e.target.type !== 'number') return;
    clearTimeout(minuteurReglages);
    minuteurReglages = setTimeout(reglagesModifies, 500);
  });

  dessiner();
  if (eleveVise) d.querySelector(`[data-appr-eleve="${eleveVise}"]`)?.scrollIntoView({ block: 'center' });
  await resultat;
  enregistrerTexte();
  rendre();
}

// Cartes d'appréciation (fenêtre ✍ Appréciations et fiche bilan) : toucher une rubrique change son niveau,
// « Autre formulation », « Reproposer », retour aux niveaux calculés, texte réécrit (enregistré pendant la frappe), copier.
// Tout est rangé au même endroit (suivis « appréciation <période> ») : la fiche bilan et la fenêtre de la classe montrent
// toujours la même appréciation. ctx : { periode(), eleves, r(), suite() (bas de carte, facultatif) } ;
// renvoie { enregistrerTexte, dessinerCarte }.
function gererCartesAppr(d, ctx) {
  const dessinerCarte = id => {
    const carte = d.querySelector(`[data-appr-eleve="${id}"]`);
    if (carte) carte.outerHTML = htmlCarteAppr(Donnees.get('eleves', id), ctx.periode(), ctx.eleves, ctx.r(), ctx.suite?.() || '');
  };
  let minuteur = null, enAttente = null;
  const enregistrerTexte = () => {
    clearTimeout(minuteur);
    if (!enAttente) return;
    const { eleve, per, texte } = enAttente;
    enAttente = null;
    const p = appreciationEleve(Donnees.get('eleves', eleve), per, ctx.eleves, ctx.r()).propose, propose = p.texte;
    // (École : la proposition de départ est gardée, pour que l'appli apprenne des corrections : voir apprisAppr.)
    ecrireAppr(eleve, per, { texte: texte === propose ? '' : texte, ...(profil().appreciations?.apprendre ? { base: texte === propose ? '' : p.texteBrut } : {}) });
  };
  // Changer un niveau ou la formulation remplace le texte proposé ; un texte réécrit à la main est d'abord confirmé.
  const garderTexteManuel = async id => {
    if (!Donnees.get('suivis', idAppr(id, ctx.periode()))?.texte) return true;
    return confirmer('Tu as réécrit cette appréciation à la main. La remplacer par une nouvelle proposition ?', 'Remplacer');
  };
  d.addEventListener('click', e => lancer(async () => {
    const b = e.target.closest('button'), carte = b?.closest('[data-appr-eleve]');
    if (!carte) return;
    const id = carte.dataset.apprEleve, el = Donnees.get('eleves', id), periode = ctx.periode(), r = ctx.r();
    enregistrerTexte();
    if (b.matches('[data-appr-copier]')) return copierTexte($('[data-appr-texte]', carte).value.trim());
    if (b.matches('[data-appr-corriger]')) {
      // Corrections sûres seulement (espaces, majuscules, élisions, mot doublé) : le texte de l'enseignant reste le sien.
      const zone = $('[data-appr-texte]', carte), corrige = corrigerAppr(zone.value.trim());
      ecrireAppr(id, periode, { texte: corrige });
      return dessinerCarte(id);
    }
    if (b.matches('[data-appr-reproposer]')) { ecrireAppr(id, periode, { texte: '' }); return dessinerCarte(id); }
    if (b.matches('[data-appr-autre]')) {
      const enreg = Donnees.get('suivis', idAppr(id, periode));
      ecrireAppr(id, periode, { graine: (enreg?.graine || 0) + 1, texte: '' });
      return dessinerCarte(id);
    }
    if (b.matches('[data-appr-auto]')) {
      if (!(await garderTexteManuel(id))) return;
      ecrireAppr(id, periode, { niveaux: {}, texte: '' });
      return dessinerCarte(id);
    }
    if (b.dataset.apprPhrase) {
      // École : une phrase écrite par l'enseignant à une autre période, reprise ou retirée.
      if (!(await garderTexteManuel(id))) return;
      const t = b.dataset.apprPhrase, prises = Donnees.get('suivis', idAppr(id, periode))?.phrases || [];
      ecrireAppr(id, periode, { phrases: prises.includes(t) ? prises.filter(x => x !== t) : [...prises, t], texte: '' });
      dessinerCarte(id);
      [...d.querySelectorAll(`[data-appr-eleve="${id}"] [data-appr-phrase]`)].find(x => x.dataset.apprPhrase === t)?.focus();
      return;
    }
    if (b.dataset.apprPortrait) {
      // École : une pastille du portrait de plus ou de moins (gardé pour cette période, et repris par les suivantes).
      if (!(await garderTexteManuel(id))) return;
      const x = b.dataset.apprPortrait, portrait = new Set(portraitAppr(id, periode));
      if (portrait.has(x)) portrait.delete(x); else portrait.add(x);
      ecrireAppr(id, periode, { portrait: [...portrait], texte: '' });
      dessinerCarte(id);
      d.querySelector(`[data-appr-eleve="${id}"] [data-appr-portrait="${x}"]`)?.focus();
      return;
    }
    if (b.dataset.apprNiveau) {
      if (!(await garderTexteManuel(id))) return;
      // 1 → 2 → 3 → 4 → non mentionné → 1…
      const k = b.dataset.apprNiveau;
      const actuel = appreciationEleve(el, periode, ctx.eleves, r).propose.niveaux[k] || 0;
      const suivant = actuel >= 4 ? 0 : actuel + 1;
      const enreg = Donnees.get('suivis', idAppr(id, periode));
      const a = analyserAppr(el, periode, ctx.eleves);
      const niveaux = persoUtileAppr(r, a, enreg?.niveaux);
      // Revenir au niveau calculé par l'appli efface le choix.
      if (suivant === (a.niveaux[k] || 0)) delete niveaux[k]; else niveaux[k] = suivant;
      ecrireAppr(id, periode, { niveaux, texte: '' });
      dessinerCarte(id);
      d.querySelector(`[data-appr-eleve="${id}"] [data-appr-niveau="${k}"]`)?.focus();
    }
  }));
  d.addEventListener('input', e => {
    if (!e.target.matches('[data-appr-texte]')) return;
    const carte = e.target.closest('[data-appr-eleve]'), n = e.target.value.trim().length, r = ctx.r();
    const compte = $('[data-appr-compte]', carte);
    compte.textContent = `${n} / ${r.longueur} caractères`;
    compte.classList.toggle('trop', n > r.longueur);
    enAttente = { eleve: carte.dataset.apprEleve, per: ctx.periode(), texte: e.target.value.trim() };
    clearTimeout(minuteur);
    minuteur = setTimeout(() => {
      enregistrerTexte();
      // Relecture du texte tapé (une fois la frappe arrêtée)
      const el = Donnees.get('eleves', carte.dataset.apprEleve), zone = $('[data-appr-relecture]', carte);
      if (el && zone) zone.innerHTML = htmlRelectureAppr(e.target.value, el, prenomsAutresAppr(el, ctx.eleves), true);
    }, 800);
  });
  return { enregistrerTexte, dessinerCarte };
}
