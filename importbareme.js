'use strict';
// Onglet « Barèmes » › 📥 Importer un barème : un barème écrit par un prof (PDF, Word .docx, LibreOffice .odt, Excel .xlsx)
// est lu PAR L'APPLI, sur l'appareil (rien ne sort), puis converti en blocs du Carnet EPS :
//   - tableau « points ↔ performances » (filles / garçons ou non)  → bloc ⏱ Performance ;
//   - grille critères × 4 degrés                                   → bloc 🎯 Grille par degrés ;
//   - tableau « libellé ↔ points »                                 → bloc 📏 Barème à paliers (ou ☑️ Critères observables) ;
//   - lignes « … : 2 pts » à la suite                              → bloc ☑️ Critères observables ;
//   - le reste du texte                                            → bloc 📝 Texte (proposé, décoché).
// L'enseignant vérifie (garder / type / unité), puis le barème arrive dans « Mes barèmes », modifiable comme les autres.
// (Les fichiers .json échangés entre collègues passent aussi par ce bouton : voir recevoirBareme, baremes.js.)

/* ---------- 1. Lecture du document → éléments { type: 'p', t } | { type: 'table', lignes: [[texte]] } ---------- */

const xmlDoc = texte => new DOMParser().parseFromString(texte, 'application/xml');

// Word (.docx) : paragraphes et tableaux du corps, dans l'ordre.
async function lireDocx(fichier) {
  const parties = await Tableur.dezipper(fichier, 'un document Word (.docx)');
  const doc = parties.get('word/document.xml');
  if (!doc) throw new Error('Ce fichier n’est pas un document Word (.docx).');
  const texteP = p => [...p.getElementsByTagName('*')].map(n => (n.tagName === 'w:t' ? n.textContent : n.tagName === 'w:tab' ? ' ' : n.tagName === 'w:br' ? '\n' : '')).join('');
  const enfants = (n, nom) => [...n.children].filter(x => x.tagName === nom);
  const elements = [];
  const parcourir = n => {
    for (const x of n.children) {
      if (x.tagName === 'w:p') elements.push({ type: 'p', t: texteP(x) });
      else if (x.tagName === 'w:tbl') {
        elements.push({ type: 'table', lignes: enfants(x, 'w:tr').map(tr => enfants(tr, 'w:tc').flatMap(tc => {
          const span = +tc.getElementsByTagName('w:gridSpan')[0]?.getAttribute('w:val') || 1;
          return [enfants(tc, 'w:p').map(texteP).join('\n'), ...Array(Math.min(span, 20) - 1).fill('')];
        })) });
      } else parcourir(x); // (contrôles de contenu, etc.)
    }
  };
  parcourir(xmlDoc(doc).getElementsByTagName('w:body')[0] || xmlDoc(doc).documentElement);
  return elements;
}

// LibreOffice (.odt) : même chose dans content.xml.
async function lireOdt(fichier) {
  const parties = await Tableur.dezipper(fichier, 'un document LibreOffice (.odt)');
  const doc = parties.get('content.xml');
  if (!doc) throw new Error('Ce fichier n’est pas un document LibreOffice (.odt).');
  const elements = [];
  const parcourir = n => {
    for (const x of n.children) {
      if (x.tagName === 'text:p' || x.tagName === 'text:h') elements.push({ type: 'p', t: x.textContent });
      else if (x.tagName === 'table:table') {
        const lignes = [...x.getElementsByTagName('table:table-row')].map(tr => [...tr.children]
          .filter(c => c.tagName === 'table:table-cell' || c.tagName === 'table:covered-table-cell')
          .flatMap(c => Array(Math.min(+c.getAttribute('table:number-columns-repeated') || 1, 20))
            .fill([...c.children].filter(p => p.tagName === 'text:p').map(p => p.textContent).join('\n'))));
        elements.push({ type: 'table', lignes });
      } else parcourir(x);
    }
  };
  parcourir(xmlDoc(doc).getElementsByTagName('office:text')[0] || xmlDoc(doc).documentElement);
  return elements;
}

// Excel (.xlsx) : chaque feuille est un tableau (les lignes d'une seule case deviennent des paragraphes).
async function lireXlsx(fichier) {
  const elements = [];
  for (const f of await Tableur.lire(fichier)) {
    let table = null;
    for (const l of f.lignes.map(x => (x || []).map(c => String(c ?? '').trim()))) {
      const pleines = l.filter(Boolean);
      if (pleines.length <= 1) { table = null; if (pleines.length) elements.push({ type: 'p', t: pleines[0] }); continue; }
      if (!table) elements.push(table = { type: 'table', lignes: [] });
      table.lignes.push(l);
    }
  }
  return elements;
}

// PDF : le texte est posé sur la page, sans structure. Deux façons de retrouver les tableaux :
//   1. par leurs traits (bordures) : la grille est reconstituée, cases fusionnées et cases sur plusieurs lignes comprises
//      (c'est le cas des référentiels officiels) ;
//   2. sans traits : lignes reformées par la hauteur, colonnes par l'alignement des textes.

// Grilles dessinées sur une page : [{ xs (gauche → droite), ys (haut → bas), sepV(j, y), sepH(i, x) }].
function grillesParTraits(page) {
  const T = 2.5, V = [], H = [];
  // (Bordures fines présentes, comme dans un PDF fait par Word : les rectangles pleins sont des fonds de case, et même
  // un fond par ligne de texte ; leurs bords hacheraient les cases, on les ignore.)
  const fins = page.rects.filter(r => (r.w <= T && r.h > 4) || (r.h <= T && r.w > 4));
  const avecBordures = fins.filter(r => r.w <= T).length >= 8 && fins.filter(r => r.h <= T).length >= 8;
  for (const r of page.rects) {
    if (r.w <= T && r.h > 4) V.push({ x: r.x + r.w / 2, a: r.y, b: r.y + r.h });
    else if (r.h <= T && r.w > 4) H.push({ y: r.y + r.h / 2, a: r.x, b: r.x + r.w });
    else if (!avecBordures && r.w > 4 && r.h > 4 && !r.trait && r.w < page.largeur * 0.98) {
      // (Case dessinée comme un rectangle plein : ses quatre bords servent de traits.)
      V.push({ x: r.x, a: r.y, b: r.y + r.h }, { x: r.x + r.w, a: r.y, b: r.y + r.h });
      H.push({ y: r.y, a: r.x, b: r.x + r.w }, { y: r.y + r.h, a: r.x, b: r.x + r.w });
    }
  }
  if (V.length < 3 || H.length < 3 || V.length * H.length > 4e6) return [];
  // Traits qui se touchent = même grille (union-find). (Word laisse parfois un interstice de 3 points entre deux lignes
  // du tableau : les bordures verticales s'arrêtent juste avant le trait suivant.)
  const parent = [...Array(V.length + H.length).keys()];
  const chef = k => (parent[k] === k ? k : (parent[k] = chef(parent[k])));
  const P = 4;
  V.forEach((v, i) => H.forEach((h, j) => {
    if (v.x >= h.a - T && v.x <= h.b + T && h.y >= v.a - P && h.y <= v.b + P) parent[chef(i)] = chef(V.length + j);
  }));
  const groupes = new Map();
  V.forEach((v, i) => { const c = chef(i); if (!groupes.has(c)) groupes.set(c, { V: [], H: [] }); groupes.get(c).V.push(v); });
  H.forEach((h, j) => { const c = chef(V.length + j); if (!groupes.has(c)) groupes.set(c, { V: [], H: [] }); groupes.get(c).H.push(h); });
  const regrouper = vals => { const s = [...vals].sort((a, b) => a - b), r = []; for (const v of s) { if (r.length && v - r.at(-1) <= 3) continue; r.push(v); } return r; };
  const grilles = [];
  for (const g of groupes.values()) {
    const xs = regrouper(g.V.map(v => v.x)), ys = regrouper(g.H.map(h => h.y)).reverse();
    if (xs.length < 3 || ys.length < 2) continue;
    const sepV = (j, y) => g.V.some(v => Math.abs(v.x - xs[j]) <= 3 && v.a - T <= y && y <= v.b + T);
    const sepH = (i, x) => g.H.some(h => Math.abs(h.y - ys[i]) <= 3 && h.a - T <= x && x <= h.b + T);
    grilles.push({ xs, ys, sepV, sepH });
  }
  return grilles;
}

// Texte d'une case : lignes du haut vers le bas, mots de gauche à droite.
function texteDesItems(items) {
  // Case écrite à la verticale : colonnes de gauche à droite, chacune de bas en haut (ou l'inverse pour un texte de haut en bas).
  const verticaux = items.filter(i => i.vertical);
  if (verticaux.length > items.length / 2) {
    const s = verticaux[0].vertical, cols = [];
    for (const i of [...verticaux].sort((a, b) => s * (a.x - b.x))) {
      const c = cols.at(-1);
      if (c && Math.abs(c.x - i.x) < Math.max(2, i.taille * 0.5)) c.items.push(i); else cols.push({ x: i.x, items: [i] });
    }
    return cols.map(c => c.items.sort((a, b) => s * (a.y - b.y)).map(i => i.t).join(' ')).join('\n');
  }
  const tries = [...items].sort((a, b) => b.y - a.y || a.x - b.x), lignes = [];
  for (const i of tries) {
    const l = lignes.at(-1);
    if (l && Math.abs(l.y - i.y) < Math.max(2, i.taille * 0.5)) l.t.push(i.t); else lignes.push({ y: i.y, t: [i.t] });
  }
  return lignes.map(l => l.t.join(' ')).join('\n');
}

async function lirePdfBareme(fichier) {
  const pages = await PdfTexte.lire(await fichier.arrayBuffer(), { pages: 12 });
  const elements = [];
  for (const page of pages) {
    const items = page.items.map(i => ({ ...i, t: i.t.replace(/\s+/g, ' ').trim() })).filter(i => i.t);
    const surPage = []; // éléments de la page, avec leur hauteur (pour les remettre dans l'ordre de lecture)
    // 1. Tableaux à traits.
    const restants = [];
    const grilles = grillesParTraits(page).map(g => ({ ...g, cases: new Map() }));
    for (const i of items) {
      const px = i.x + 1, py = i.y + i.taille * 0.3;
      const g = grilles.find(G => px >= G.xs[0] && px <= G.xs.at(-1) && py <= G.ys[0] && py >= G.ys.at(-1));
      if (!g) { restants.push(i); continue; }
      let j = g.xs.findIndex((x, k) => k < g.xs.length - 1 && px >= x && px < g.xs[k + 1]);
      let r = g.ys.findIndex((y, k) => k < g.ys.length - 1 && py <= y && py > g.ys[k + 1]);
      if (j < 0 || r < 0) { restants.push(i); continue; }
      // Case fusionnée : on remonte vers la case de départ (à gauche, puis en haut) tant qu'aucun trait ne sépare.
      const yMil = (g.ys[r] + g.ys[r + 1]) / 2;
      while (j > 0 && !g.sepV(j, yMil)) j--;
      const xMil = (g.xs[j] + g.xs[j + 1]) / 2;
      while (r > 0 && !g.sepH(r, xMil)) r--;
      const cle = r + '|' + j;
      if (!g.cases.has(cle)) g.cases.set(cle, []);
      g.cases.get(cle).push(i);
    }
    for (const g of grilles) {
      if (!g.cases.size) continue;
      const lignes = [];
      for (let r = 0; r < g.ys.length - 1; r++) {
        lignes.push(g.xs.slice(0, -1).map((_, j) => (g.cases.has(r + '|' + j) ? texteDesItems(g.cases.get(r + '|' + j)) : '')));
      }
      surPage.push({ y: g.ys[0], e: { type: 'table', lignes } });
    }
    // 2. Le reste : lignes par la hauteur ; plusieurs lignes à plusieurs morceaux = tableau (colonnes par l'alignement).
    restants.sort((a, b) => b.y - a.y || a.x - b.x);
    const lignes = [];
    for (const i of restants) {
      const l = lignes.at(-1);
      if (l && Math.abs(l.y - i.y) < Math.max(2, i.taille * 0.4)) l.items.push(i); else lignes.push({ y: i.y, items: [i] });
    }
    for (const l of lignes) l.items.sort((a, b) => a.x - b.x);
    let bloc = [];
    const finir = () => {
      if (bloc.length >= 2) {
        const taille = Math.max(...bloc.flatMap(l => l.items.map(i => i.taille))) || 10;
        const debuts = [...new Set(bloc.flatMap(l => l.items.map(i => Math.round(i.x))))].sort((a, b) => a - b);
        const cols = [];
        for (const x of debuts) { if (cols.length && x - cols.at(-1).fin < taille * 1.5) cols.at(-1).fin = x; else cols.push({ debut: x, fin: x }); }
        const colDe = x => cols.reduce((best, c, k) => (Math.abs(x - (c.debut + c.fin) / 2) < Math.abs(x - (cols[best].debut + cols[best].fin) / 2) ? k : best), 0);
        surPage.push({ y: bloc[0].y, e: { type: 'table', lignes: bloc.map(l => {
          const cases = Array(cols.length).fill('');
          for (const i of l.items) { const k = colDe(i.x); cases[k] = cases[k] ? cases[k] + ' ' + i.t : i.t; }
          return cases;
        }) } });
      } else for (const l of bloc) surPage.push({ y: l.y, e: { type: 'p', t: l.items.map(i => i.t).join(' ') } });
      bloc = [];
    };
    for (const l of lignes) {
      if (l.items.length >= 2) bloc.push(l);
      else { finir(); surPage.push({ y: l.y, e: { type: 'p', t: l.items[0].t } }); }
    }
    finir();
    elements.push(...surPage.sort((a, b) => b.y - a.y).map(x => x.e));
  }
  // (Texte « dessiné » : les lettres sont des formes, il ne reste que des puces ou presque rien.)
  const lettres = elements.map(e => e.t || (e.lignes || []).flat().join(' ')).join(' ').replace(/[^A-Za-zÀ-ÿ0-9]/g, '').length;
  if (lettres < 40) {
    throw new Error('Pas de texte lisible dans ce PDF : c’est une image scannée, ou un texte transformé en dessin. L’appli ne sait pas le lire : essaie avec le fichier Word d’origine, ou un autre PDF.');
  }
  return elements;
}

async function lireDocumentBareme(fichier) {
  const ext = (fichier.name.match(/\.([a-z0-9]+)$/i)?.[1] || '').toLowerCase();
  if (ext === 'pdf') return lirePdfBareme(fichier);
  if (ext === 'docx') return lireDocx(fichier);
  if (ext === 'odt') return lireOdt(fichier);
  if (ext === 'xlsx') return lireXlsx(fichier);
  if (ext === 'doc' || ext === 'xls') throw new Error(`Ancien format .${ext} : ouvre-le dans Word / Excel ou LibreOffice et enregistre-le en .${ext}x, ou en PDF.`);
  throw new Error('Format non reconnu : choisis un PDF, un document Word (.docx), LibreOffice (.odt) ou Excel (.xlsx).');
}

/* ---------- 2. Lecture des valeurs ---------- */

// Points : « 12 », « 12,5 », « 12 pts », « 12/20 ».
function pointsLus(t) {
  const m = /^(\d{1,3}(?:[.,]\d+)?)\s*(?:pts?|points?|\/\s*\d+)?\.?$/i.exec(String(t).trim());
  return m ? +m[1].replace(',', '.') : null;
}
// Temps : 3'05, 3’05’’, 3'05"50, 3min05, 3 min 05 s, 3:05, 12"5, 12''5, 12,5 s, 12 s 5.
function tempsLu(t) {
  let s = String(t).trim().toLowerCase().replace(/[’′`´]/g, '\'').replace(/''|″|”|“/g, '"').replace(/\s+/g, '');
  if (!/\d/.test(s)) return null;
  s = s.replace(/(\d)(?:min|mn)(?=\d)/, '$1:').replace(/(\d)(?:min|mn)$/, '$1:00').replace(/(\d)'(?=\d)/, '$1:').replace(/'$/, ':00')
    .replace(/(\d)(?:"|s)(?=\d)/, '$1.').replace(/("|s|sec)$/, '');
  const v = lireTemps(s);
  return v === null ? null : Math.round(v * 100) / 100;
}
// Distance en mètres : 4,20 m, 4m20, 4.2, 420 cm.
function distanceLue(t) {
  const s = String(t).trim().toLowerCase().replace(/\s+/g, '').replace(',', '.');
  let m = /^(\d+)m(\d{1,2})$/.exec(s);
  if (m) return +`${m[1]}.${m[2].padEnd(2, '0')}`;
  m = /^(\d+(?:\.\d+)?)(cm|m)?$/.exec(s);
  return m ? (m[2] === 'cm' ? +m[1] / 100 : +m[1]) : null;
}
const nombreLu = t => { const m = /^(\d+(?:[.,]\d+)?)%?$/.exec(String(t).trim().replace(/\s+/g, '')); return m ? +m[1].replace(',', '.') : null; };
// (« ≥ 130 », « 11 et + », « < 2:05 » : le signe est ignoré. minSec : « 10.50 » veut dire 10 min 50 s.)
const perfLue = (unite, brut, minSec = false) => {
  const t = String(brut).replace(/^\s*(?:≥|≤|>=|<=|>|<|\+|plus de|moins de)\s*/i, '').replace(/\s*(?:et\s*\+|et plus|\+)\s*$/i, '').trim();
  if (unite === 'temps' && minSec && /^\d{1,2}[.,]\d{2}$/.test(t)) return parseInt(t, 10) * 60 + +t.slice(-2);
  return unite === 'temps' ? tempsLu(t) : unite === 'distance' ? distanceLue(t) : nombreLu(t);
};

// Unité d'une colonne de performances : marques de temps, de mètres, mots de l'en-tête, sinon d'après l'APSA.
function uniteColonne(entete, cases, apsa) {
  const e = sansAccent(entete), txt = cases.join(' ').toLowerCase();
  if (/['’′"″:]|\dmin|\d\s*s\b|\bsec/.test(txt) || /temps|chrono|duree|\(s\)|secondes/.test(e)) return 'temps';
  if (/\d\s*m\s*\d|\d\s*(m|cm)\b/.test(txt) || /distance|longueur|hauteur|lancer|saut|\(m\)|metres|cm/.test(e)) return 'distance';
  const a = sansAccent(apsa);
  if (/course|demi-fond|vitesse|relais|natation|haies|nage/.test(a)) return 'temps';
  if (/saut|lancer|longueur|hauteur|poids|javelot|disque/.test(a)) return 'distance';
  return 'nombre';
}

/* ---------- 3. Analyse : éléments → blocs proposés ----------
   Mis au point sur des référentiels réels (bac GT : repères nationaux et déclinaisons académiques de Nancy-Metz,
   Bordeaux, Martinique, Nice, Grenoble, Normandie, Amiens, Guyane ; bac pro ; barèmes d'établissement) :
   - grilles « Degré 1 … Degré 4 » (ou « Niveau 1 à 4 », « Niveau de jeu 7 à 8 … 1 à 2 », maîtrise insuffisante…),
     critère dans la 1re colonne ou absent (AFL2 / AFL3 : un seul critère), rôles en sous-titres (« Coach »),
     points dans le critère (« (7 points) », « /6 ») ou en fourchettes dans les cases (« 6-7 pts ») ;
   - barèmes de performance verticaux (Note | Filles | Garçons) ou horizontaux (ligne Filles, ligne Garçons,
     ligne « Barème sur 8 ») ;
   - tableaux de correspondance degrés → points (ignorés : l'appli calcule les fourchettes elle-même) ;
   - points des AFL lus dans le texte (« L'AFL1 est noté sur 12 points », répartition des 8 points AFL2 / AFL3). */

const saImp = t => sansAccent(t || '');
// Intitulé de degré : « Degré 2 », « DEGRE 2 », « Niveau 3 », « D4 », « Niveau de jeu 7 à 8 », « Maîtrise fragile »…
// (Aussi les formes courtes des grilles de collège : « Insuffisant | Fragile | Satisfaisant | TB maîtrise ».)
const EST_DEGRE = /^(degre|niveau|niv\.?|d|n)\s*[1-4]\b|^degres? d.acquisition\s*(du niveau\s*)?[1-4]\b|^niveaux? de jeu\b|^[1-4]$|maitrise (insuffisante|fragile|satisfaisante|tres satisfaisante)|tres bonne maitrise|^(insuffisante?|fragile|satisfaisante?|tres satisfaisante?|tb|tbm|tb maitrise|tres bonne?|tres bien|excellente?|expert)\s*:?$/;
// (Aussi les échelles de mots : « Jamais | Parfois | Souvent | Toujours », « Rouge … Bleu », « Non acquis … Expert ».)
// (Et les médailles d'une grille iDoceo : « Athlète en Bronze 🥉 / 1.5 ».)
const estDegre = t => EST_DEGRE.test(saImp(t).replace(/\s+/g, ' ').trim()) || rangEchelle(t) !== null
  || (String(t).length < 60 && /(^|\s)(choc(olat)?|bronze|argent|or)\b[^a-z]*$/.test(saImp(String(t).split('\n')[0])));
// AFL du bac GT (1 à 3) ou AFLP du bac pro (« P1 » à « P6 »).
const aflDe = t => { const m = /\bafl\s*(p)?\s*([1-6])/.exec(saImp(t)); return !m ? null : m[1] ? 'P' + m[2] : +m[2] <= 3 ? m[2] : null; };
// Titre de partie « Repères d'évaluation de l'AFL 2 », « AFL 1b : « … » » (pas une phrase qui cite une AFL en passant).
const titreAfl = t => (/^\s*(rep[eè]res\s+(de\s+l.\s*)?(d.)?\s*[ée]valuation|afl\s*p?\s*\d[a-z]?\s*:?\s*[«"“])/i.test(t) ? aflDe(t) : null);
// Valeur « points » d'une case : « 2 », « 0,5 pt », « 2 pts », « 1.5pt ».
const ptsCase = t => pointsLus(String(t).replace(/\s*pts?\.?$/i, '').trim());
// Fourchette de points dans un texte : « 0-1,5 pts », « 4,5 à 5 pts » → [bas, haut].
const FOURCHETTE = /(?:entre\s+)?(\d+(?:[.,]\d+)?)\s*(?:-|–|à|et)\s*(\d+(?:[.,]\d+)?)\s*(?:pts?|points?)\b\.?/i;
// Points écrits dans une case de degré : fourchette (son haut), « 1,5 point » ou nombre seul sur la dernière ligne.
function ptsDansCase(t) {
  const s = String(t || '').trim();
  const f = [...s.matchAll(new RegExp(FOURCHETTE.source, 'gi'))].at(-1);
  if (f) return nbImp(f[2]);
  const m = /(?:^|\s)(\d+(?:[.,]\d+)?)\s*(?:pts?|points?)\.?$/i.exec(s) || /\n\s*(\d{1,2}(?:[.,]\d+)?)$/.exec(s);
  return m ? nbImp(m[1]) : null;
}
const nbImp = s => +String(s).replace(',', '.');

function nettoyerTable(lignes) {
  let l = lignes.map(r => r.map(c => String(c ?? '').replace(/[ \t­]+/g, ' ').replace(/\n /g, '\n').trim())).filter(r => r.some(Boolean));
  const n = Math.max(0, ...l.map(r => r.length));
  l = l.map(r => [...r, ...Array(n - r.length).fill('')]);
  const garder = [...Array(n).keys()].filter(j => l.some(r => r[j]));
  return l.map(r => garder.map(j => r[j]));
}
const transposer = l => (l.length ? l[0].map((_, j) => l.map(r => r[j] ?? '')) : []);

/* --- Barèmes de performance, par séries : une ligne de points, et des lignes de perfs alignées sur elle --- */

// Ligne de points : au moins 3 nombres (0 à 60) dans l'ordre (croissant ou décroissant) ; intitulé avant.
function seriePoints(r) {
  const idx = r.map((c, j) => [ptsCase(c), j]).filter(([v]) => v !== null && v <= 60);
  if (idx.length < 3) return null;
  const debut = idx[0][1], label = r.slice(0, debut).filter(Boolean).join(' ');
  const s = saImp(label);
  // (« Degré 2 » seul = table de correspondance ; « NIVEAU 4 Non acquis Note / 14 » = vraie colonne de notes.)
  // (Intitulé « Points », « Note », « Barème sur 8 », « AFL 1 : 12 points »… ou aucun ; pas « Nombre moyen de points
  // marqués », qui est une perf.)
  const nomme = /^\s*(points?|pts|notes?|baremes?|perf\w* notee?|repartition (de |des )?points)\b|\b(notes?|points?|pts|bareme|perf\w*)\s*(\/|sur)\s*\d+|\bsur\s*\d+\s*(pts?|points?)?\s*$|^\s*\/\s*\d+\s*$|\b(notes?|points?|pts)\s*$|^\s*afl\s*p?\s*\d\s*:?\s*\d+\s*(pts?|points?)\s*$/.test(s);
  if ((estDegre(label) && !/note|point|pts|bareme/.test(s)) || /choisi|coef/.test(s) || (/afl/.test(s) && !nomme)) return null;
  const autres = r.slice(debut).filter(Boolean).length;
  if (idx.length < autres * 0.8) return null;
  const v = idx.map(x => x[0]);
  const monte = v.every((x, i) => !i || x > v[i - 1]), descend = v.every((x, i) => !i || x < v[i - 1]);
  if (!monte && !descend) return null;
  if (!nomme && !(label === '' || /^[\d\s]*$/.test(label))) return null;
  return { label, cols: idx.map(x => x[1]), vals: v, nomme };
}

const sexeImp = t => { const s = saImp(t); return /\bfilles?\b|\bfeminin|^f$|\bf\b/.test(s) ? 'f' : /\bgar.?ons?\b|\bmasculin|^g$|\bg\b/.test(s) ? 'g' : 'v'; };
// (Intitulé d'une série sans le sexe ni le degré : « Degré 2 Temps filles » → « Temps ».)
const sansSexe = t => String(t).replace(/\b(filles?|gar.?ons?|f[ée]minin|masculin)\b/gi, '')
  .replace(/\b(degr[ée]s?|niveaux?)\s*(d.acquisition\s*(du\s*)?(niveau\s*)?)?\d*\b/gi, '').replace(/\b(non acquis|en cours d.acquisition|acquis)\b/gi, '')
  .replace(/\s+/g, ' ').trim();

// Séries de perfs d'un tableau (lignes = séries). Renvoie des blocs et les lignes utilisées.
function seriesPerf(l, apsa) {
  const pts = l.map((r, i) => ({ i, s: seriePoints(r) })).filter(x => x.s);
  if (!pts.length) return { blocs: [], utilisees: new Set() };
  const estPts = new Set(pts.map(x => x.i)), parPts = new Map(pts.map(x => [x.i, []])), pris = new Set();
  // Lignes de points possibles pour chaque ligne : celles dont les cases remplies tombent aux mêmes colonnes.
  const possibles = l.map((r, i) => (estPts.has(i) ? [] : pts.map(p => {
    const lues = p.s.cols.filter(j => r[j] || (r[j - 1] && !l[p.i][j - 1]) || (r[j + 1] && !l[p.i][j + 1]));
    return { p, n: lues.length, d: Math.abs(p.i - i) + (p.i > i ? 0.5 : 0) };
  }).filter(x => x.n >= 3 && x.n >= x.p.s.cols.length * 0.5)));
  // Tableau qui commence par sa ligne de notes (« Note | Temps filles | Temps garçons », répété) : chaque série va
  // à la ligne de notes qui la précède. Sinon (« Filles », « Garçons », puis « Barème sur 8 ») : la plus proche.
  const premierePerf = possibles.findIndex(x => x.length);
  const precedente = premierePerf > pts[0].i;
  l.forEach((r, i) => {
    if (estPts.has(i)) return;
    const avant = precedente ? possibles[i].filter(x => x.p.i < i).sort((a, b) => a.d - b.d)[0] : null;
    const choix = avant || [...possibles[i]].sort((a, b) => b.n - a.n || a.d - b.d)[0];
    if (!choix || choix.d > 9) return;
    const debut = choix.p.s.cols[0], intitule = x => (x || []).slice(0, debut).filter(Boolean).join(' ');
    // (En-tête décalé d'une case par rapport aux valeurs, fréquent dans les PDF : on prend celui de la série voisine vide.)
    const vide = x => !x || choix.p.s.cols.every(j => !x[j]);
    let label = intitule(r);
    if (!label) {
      const voisin = [i - 1, i + 1].find(k => !pris.has(k) && vide(l[k]) && intitule(l[k]));
      if (voisin !== undefined) { pris.add(voisin); label = intitule(l[voisin]); }
    }
    if ((estDegre(label) && !/temps|perf|dist|fille|garcon/.test(saImp(label))) || /choisi/.test(saImp(label))) return;
    parPts.get(choix.p.i).push({ i, label, r });
  });
  const blocs = [], utilisees = new Set();
  for (const p of pts) {
    const lignes = parPts.get(p.i);
    if (!lignes.length) continue;
    // Chaque perf va à la note de la colonne la plus proche (à deux cases près) : les barèmes « en curseur », où les
    // perfs sont posées le long de l'échelle des points sans tomber pile sous chaque note, sont lus aussi.
    const parNote = r => {
      const m = new Map();
      r.forEach((c, j) => {
        if (!c || j < p.s.cols[0] - 1) return;
        // (Note déjà prise par la perf précédente : la plus proche encore libre, du côté où l'on avance.)
        const libres = p.s.cols.map((col, k) => ({ k, d: Math.abs(col - j), apres: col >= j })).filter(x => x.d <= 2 && !m.has(x.k))
          .sort((a, b) => a.d - b.d || b.apres - a.apres);
        if (libres.length) m.set(libres[0].k, c);
      });
      return m;
    };
    // Une série par sexe (f / g) dans un même bloc ; les autres séries (v) chacune dans son bloc.
    // Même intitulé deux fois sans sexe (« Vitesse », « Relais », puis « Vitesse », « Relais ») : filles puis garçons.
    // (Comparaison sur la dernière case de l'intitulé : « Performance maximale | Vitesse » et « Vitesse ».)
    lignes.forEach(x => {
      // (Intitulé sans la première perf qui s'y serait glissée : « Relais 19’’5 » → « Relais ».)
      x.cle = sexeImp(x.label); x.nom = sansSexe(x.label).replace(/(\s+[\d’'"″.,:]+)+$/, '');
      x.court = saImp(sansSexe(x.r.slice(0, Math.max(0, p.s.cols[0] - 1)).filter(Boolean).at(-1) || x.label));
    });
    const neutres = lignes.filter(x => x.cle === 'v'), supposes = new Set();
    for (const x of neutres) {
      const memes = neutres.filter(y => y.court === x.court);
      if (memes.length === 2 && x.court && !supposes.has(x)) { memes[0].cle = 'f'; memes[1].cle = 'g'; memes.forEach(y => supposes.add(y)); }
    }
    const groupes = [];
    for (const x of lignes) {
      const g = x.cle === 'v' ? null : groupes.find(gr => gr[0].cle !== 'v' && (gr[0].court === x.court || !supposes.has(x)) && !gr.some(y => y.cle === x.cle));
      if (g) g.push(x); else groupes.push([x]);
    }
    for (const g of groupes) {
      const cases = g.flatMap(x => [...parNote(x.r).values()]);
      const titre = [...g.map(x => x.nom), sansSexe(p.s.label)].find(t => t && t.length <= 70 && !/^(bareme|notes?|points?|afl)\b/.test(saImp(t))) || '';
      const unite = uniteColonne(titre + ' ' + p.s.label, cases, apsa);
      const lisibles = cases.filter(c => perfLue(unite, c) !== null).length;
      if (cases.length < 3 || lisibles < cases.length * 0.6) continue;
      const notes = g.map(x => parNote(x.r));
      // Série écrite en secondes (« 9’’6 ») avec une coquille « 7’6 » : lue « 7’’6 », pas 7 min 6 s.
      const tous = notes.flatMap(m => [...m.values()]);
      if (tous.filter(c => /\d\s*(’’|''|″|")\s*\d/.test(c)).length >= tous.length * 0.7) {
        for (const m of notes) for (const [k, c] of m) m.set(k, c.replace(/^(\d+)\s*[’'′]\s*(\d)$/, '$1’’$2'));
      }
      const lignesPerf = p.s.cols.map((j, k) => {
        const brut = {};
        g.forEach((x, n) => { const v = notes[n].get(k); if (v) brut[x.cle] = v; });
        return { pts: p.s.vals[k], brut };
      }).filter(x => Object.keys(x.brut).length);
      const total = /sur\s*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*(?:pts?|points?)\s*$/i.exec(p.s.label);
      blocs.push({ type: 'perf', unite, cles: [...new Set(lignesPerf.flatMap(x => Object.keys(x.brut)))], supposes: g.some(x => supposes.has(x)),
        titre: titre.slice(0, 90), lignes: lignesPerf.sort((a, b) => b.pts - a.pts), total: total ? nbImp(total[1] || total[2]) : null });
      g.forEach(x => utilisees.add(x.i));
      utilisees.add(p.i);
    }
  }
  // Groupes côte à côte (« Note | Temps filles | Temps garçons » ×3, pour les degrés 1-2, 3 et 4) : un seul barème.
  const fusion = [];
  for (const b of blocs) {
    const meme = fusion.find(x => x.unite === b.unite && x.cles.join() === b.cles.join() && saImp(x.titre).replace(/\s/g, '') === saImp(b.titre).replace(/\s/g, '')
      && !x.lignes.some(l => b.lignes.some(m => m.pts === l.pts)));
    if (meme) { meme.lignes = [...meme.lignes, ...b.lignes].sort((a, c) => c.pts - a.pts); meme.total = Math.max(meme.total ?? 0, b.total ?? 0) || null; } else fusion.push(b);
  }
  // Temps écrits « 10.50 » pour 10 min 50 s (demi-fond, course en durée) : repéré quand c'est plausible.
  for (const b of fusion) {
    if (b.unite !== 'temps') continue;
    const cases = b.lignes.flatMap(l => Object.values(l.brut).map(v => String(v).trim()));
    const ms = cases.every(c => /^\d{1,2}[.,]\d{2}$/.test(c) && +c.slice(-2) < 60);
    const ints = cases.map(c => parseInt(c, 10));
    if (ms && /demi-fond|duree|endurance|orientation|800|1000|1500|3\s*x\s*500/.test(saImp(apsa + ' ' + b.titre)) && Math.max(...ints) < 30) b.minSec = true;
  }
  return { blocs: fusion, utilisees };
}

// Tableau en plusieurs étages (en-têtes, puis lignes de nombres ; puis d'autres en-têtes…) : un morceau par étage.
const caseChiffree = c => !c || ptsCase(c) !== null || tempsLu(c) !== null || distanceLue(c) !== null || /^[≥≤<>+]/.test(c);
const ligneChiffree = r => { const p = r.filter(Boolean); return p.length >= 2 && p.filter(caseChiffree).length >= p.length * 0.6; };
function etagesTable(l) {
  const num = ligneChiffree;
  const etages = [];
  let entete = [], corps = [];
  for (const r of l) {
    if (num(r)) corps.push(r);
    else {
      if (corps.length) { etages.push([...entete.slice(-3), ...corps]); entete = []; corps = []; }
      entete.push(r);
    }
  }
  if (corps.length) etages.push([...entete.slice(-3), ...corps]);
  return etages.length > 1 ? etages : [l];
}

/* --- Grilles par degrés --- */

// Case écrite à la verticale dans le PDF (« e é it iv t c ac lle ffic o ») : des lettres isolées, illisibles.
const caseVerticale = t => { const m = String(t).split(/\s+/).filter(Boolean); return m.length >= 4 && m.filter(x => /^\p{L}$/u.test(x)).length >= m.length * 0.4; };
// Points par degré écrits en fin de case (« … 0,5 /1 / 1,5 ») ou options « /2 - /4 - /6 » : retirés du texte.
const sansPointsFin = t => String(t).replace(/(\s*\d+(?:[.,]\d+)?\s*\/\s*\d+(?:[.,]\d+)?(\s*\/\s*\d+(?:[.,]\d+)?)*)\s*$/, '').replace(/\s*-?\s*\/\s*\d+(\s*-\s*\/\s*\d+)+/g, '').trim();

function grillesDegres(l, utilisees) {
  const blocs = [];
  // (En-tête fait de chiffres seuls « 1 2 3 4 » : seulement dans une ligne courte, pas dans une ligne de points 0,5 … 8.)
  // (En-tête fait de fourchettes de points, « Note sur 10 | 0 à 2 points | 2,25 à 5 points | … » : seulement juste au-dessus
  // des descriptifs, pas une ligne de points sous un critère.)
  const plage = c => /^\s*\d+(?:[.,]\d+)?\s*(?:à|-|–)\s*\d+(?:[.,]\d+)?\s*(?:pts?|points?)\s*$/i.test(c || '');
  const descriptifs = r => (r || []).filter(c => (c || '').length > 15).length >= 3;
  const annonce = r => /note\s*sur|el[ée]ments?\b|crit[eè]res?|niveaux?/.test(saImp((r || []).filter(c => c && !plage(c)).join(' ')));
  const entetes = l.map((r, i) => ({ i, cols: r.map((c, j) => (c && (estDegre(c) || (plage(c) && annonce(r) && descriptifs(l[i + 1]) && !descriptifs(l[i - 1]))) ? j : -1)).filter(j => j >= 0) }))
    .filter(x => x.cols.length >= 4 && !(x.cols.every(j => /^\s*[1-4]\s*$/.test(l[x.i][j])) && l[x.i].filter(Boolean).length > 6)
      // (« D1 | D2 | D3 | D4 | D5 » : les domaines du socle, pas des degrés.)
      && !l[x.i].some(c => /^\s*d\s*5\s*$/i.test(c)));
  entetes.forEach((h, n) => {
    // Échelle de 5 mots (jamais … toujours, rouge … bleu) : les deux niveaux les plus bas forment le degré 1.
    const rangs = h.cols.map(j => rangEchelle(l[h.i][j])?.k ?? null);
    const echelle = rangs.every(r => r !== null);
    const croissant = !echelle || rangs[0] < rangs.at(-1);
    const debuts = echelle && h.cols.length === 5 && croissant ? [h.cols[0], ...h.cols.slice(2, 5)] : h.cols.slice(0, 4), fin = entetes[n + 1]?.i ?? l.length;
    const nCol = l[0].length;
    // Descriptifs décalés de 1 ou 2 colonnes vers la gauche par rapport à l'en-tête « Degré k » (fréquent dans les PDF) :
    // on mesure le décalage sur les degrés 2 à 4 (le 1er pourrait être confondu avec la colonne des critères).
    const longues = d => l.slice(h.i + 1, fin).reduce((s, r) => s + [1, 2, 3].filter(k => (r[debuts[k] - d] || '').length > 15).length, 0);
    const ecart = Math.min(...[1, 2, 3].map(k => debuts[k] - debuts[k - 1]));
    const decal = [0, 1, 2].filter(d => d < ecart).reduce((best, d) => (longues(d) > longues(best) ? d : best), 0);
    const bornes = debuts.map(j => j - decal);
    // (Colonne « Pts » à droite des degrés, « /16 pts » : total d'un groupe de critères, hors des descriptifs du degré 4.)
    const colTotal = l[h.i].findIndex((c, j) => j > debuts[3] && /^(pts|points?|note|total|bareme)$/.test(saImp(c).replace(/\s+/g, '')));
    const span = k => [bornes[k], k < 3 ? bornes[k + 1] : colTotal > 0 ? colTotal : nCol];
    // Ordre : « Niveau de jeu 7 à 8 … 1 à 2 » va du meilleur au moins bon.
    const nums = debuts.map(j => +((/(\d+)/.exec(l[h.i][j]) || [])[1] ?? NaN));
    const inverse = (nums.every(Number.isFinite) && nums[0] > nums[3]) || !croissant;
    // Lignes au-dessus de l'en-tête (dans ce tableau) : titre, AFL.
    const dessus = l.slice(n ? entetes[n - 1].i + 1 : 0, h.i).map(r => r.filter(Boolean)).filter(r => r.length);
    const lignesDessus = dessus.map(r => r.join(' ')).filter(t => t.length > 4 && t.length < 300);
    // (Pas une ligne d'intitulés de colonnes : « ÉLÉMENT À ÉVALUER | NIVEAUX DE MAÎTRISE ».)
    const titre = lignesDessus.find(t => /\bafl/.test(saImp(t)))
      || lignesDessus.find(t => /reperes?|element|critere|role/.test(saImp(t)) && !/niveaux? de maitrise|^el[eé]ments? (a |à )?evaluer|^criteres? d.?evaluation|competences? visee/.test(saImp(t))) || '';
    const criteres = [], numeriques = [];
    // Colonnes nommées près de l'en-tête (« SOCLE | Compétences | CA | APSA | Points », « Critère d'évaluation | Compétence
    // visée ») : le nom du critère est dans la colonne de l'élément évalué, ses points dans la colonne « Points ».
    let colNom = -1, colPts = -1;
    const lignesNoms = new Set();
    for (let i = Math.max(0, h.i - 3); i <= Math.min(fin - 1, h.i + 2); i++) {
      l[i].forEach((c, j) => {
        if (!c || j >= bornes[0]) return;
        const s = saImp(c).replace(/\s+/g, ' ').trim();
        if (s.length < 45 && /^(apsa|el[ée]ments? (a |à )?(evaluer|evalues?)|criteres?( d.?\s*evalu\s*ation| evalues?)?|indicateurs?|observables?|ce qui est evalue)\b/.test(s)) { colNom = j; if (i !== h.i) lignesNoms.add(i); }
        if (/^(points?|pts|bareme|note)$/.test(s.replace(/\s+/g, ''))) { colPts = j; if (i !== h.i) lignesNoms.add(i); } // (« Point⏎s » coupé dans une case étroite)
      });
    }
    // (Nom du premier critère écrit sur la ligne même de l'en-tête « Degré 1 … 4 », dans une case fusionnée.)
    // (Pas le titre de la grille écrit dans le coin, « 3ème Biathlon ! ».)
    // (Ni le coin « Élément C à évaluer / Note sur 10 points » : c'est le total de la grille, lu plus bas.)
    let nomEnAttente = colNom >= 0 ? '' : l[h.i].slice(0, Math.max(0, bornes[0])).filter(c => c && !estDegre(c) && !caseVerticale(c) && !/\bafl/i.test(c) && c.length <= 200 && !niveauDuTexte(c)
      && !/note\s*sur|^el[ée]ments?\s.{0,6}\s?[àa]\s+[ée]valuer/.test(saImp(c))).join(' ');
    let prefixes = null, courant = null;
    for (let i = h.i + 1; i < fin; i++) {
      if (utilisees.has(i) || lignesNoms.has(i)) continue;
      const r = l[i];
      const ptsCol = colPts >= 0 ? ptsCase(r[colPts] || '') : null;
      // (Sous-critères écrits dans une colonne à droite de celle des éléments évalués, « La respiration » : comptent aussi.)
      const cellules = colNom >= 0 ? r.slice(colNom, bornes[0]).filter((c, j) => c && j + colNom !== colPts && !caseVerticale(c))
        : r.slice(0, bornes[0]).filter((c, j) => c && j !== colPts && !caseVerticale(c));
      // Critère introduit par son AFL (« AFL 3 : Choisir et assumer… | /2 - /4 - /6 | Coach ») : le nom est ce qui suit.
      const marque = cellules.length && /^\s*afl\s*p?\s*\d/i.test(cellules[0]) ? aflDe(cellules[0]) : null;
      // (Colonne « Note » : « N/12 » = total de l'AFL, pas les points du critère.)
      const noteAfl = cellules.map(c => /^\s*N\s*\/\s*(\d+(?:[.,]\d+)?)\s*$/i.exec(c)).find(Boolean);
      const crit = sansPointsFin((marque ? cellules.slice(1) : cellules).filter(c => !/^\s*N\s*\/\s*\d/i.test(c)).join(' ')).trim();
      let desc = [0, 1, 2, 3].map(k => { const [a, b] = span(k); return r.slice(Math.max(0, a), b).filter(Boolean).join(' ').trim(); });
      if (inverse) desc = desc.reverse();
      const remplis = desc.filter(Boolean);
      const nonVides = r.filter(Boolean);
      // Critère écrit sur plusieurs lignes (« AFL1 : » / « Moyenne des 3 × 50 m » / « (6 points) ») : les morceaux se suivent.
      if (!remplis.length) {
        if (crit && !marque) { if (courant && !courant.aDesc) courant.nom += ' ' + crit; else nomEnAttente = [nomEnAttente, crit].filter(Boolean).join(' '); }
        continue;
      }
      if (nonVides.length === 1 && remplis.length === 1 && remplis[0].length <= 60 && !crit) { nomEnAttente = remplis[0]; continue; }
      // Tableau de correspondance degrés → points (que des nombres) : ignoré.
      // (« 0 à 0,25 », « 1,75 – 2 » : fourchettes de points, les petits mots ne comptent pas.)
      const mots = remplis.join(' ').split(/\s+/).filter(x => x && !/^(—|à|a|-|–|et|pts?|points?)$/i.test(x));
      if (remplis.every(c => c.split(/\s+/).every(x => ptsCase(x) !== null || /^pts?$/i.test(x))) || mots.filter(caseChiffree).length >= mots.length * 0.7) {
        // Ligne de points sous un critère, sans nom (« 1 point | 2 points | 3 points | 4 points », « 0 à 1 point »,
        // « 0 point | | 4 points | ») : les points de chaque degré de ce critère (les degrés vides prennent ceux d'avant).
        const valsL = desc.map(c => (c ? ptsDansCase(c) ?? ptsCase(c) : null));
        if (!crit && valsL.filter(v => v !== null).length >= 2) {
          // (Critère sans descriptifs, « Performance /2pts | 10s | 20s », suivi de sa ligne de points.)
          if (nomEnAttente && (!courant || courant.ptsLigne)) { courant = { nom: nomEnAttente, cases: ['', '', '', ''], points: null, aDesc: true }; criteres.push(courant); nomEnAttente = ''; }
          if (courant && !courant.ptsLigne) { courant.ptsLigne = valsL; continue; }
        }
        // Critère nommé dans la colonne des éléments évalués, dont les 4 cases ne donnent que les points
        // (« Écart d'allure | 0 et 1 point | 1,5 et 2,5 points | … ») : un critère sans descriptifs.
        const vals4 = desc.map(ptsDansCase);
        if (colNom >= 0 && crit && !/notee?s?\s+sur|^afl|^(note|degre|niveau|points?|total|bareme|repartition)\b/.test(saImp(crit))
          && vals4.every(v => v !== null) && vals4.every((v, k) => !k || v >= vals4[k - 1])) {
          courant = { nom: crit, cases: desc, points: null, aDesc: true, ptsLus: ptsCol };
          criteres.push(courant);
          nomEnAttente = '';
          continue;
        }
        // (Matrice de points : on garde ses intitulés de lignes, qui peuvent décrire les niveaux d'un critère.)
        numeriques.push({ i, cellules, premier: remplis.map(ptsCase).find(v => v !== null) ?? null });
        // (« Note sur 4 points | 0,5 | 1 | … » sous un critère : ses points.)
        const noteSur = /^\s*note\s*sur\s*(\d+(?:[.,]\d+)?)/i.exec(saImp(cellules.join(' ')));
        if (noteSur && courant && courant.ptsLus == null) courant.ptsLus = nbImp(noteSur[1]);
        continue;
      }
      // Grille vide à remplir (« Barème établissement » dans chaque case) : ignorée.
      if (remplis.length === 4 && new Set(remplis.map(saImp)).size === 1) continue;
      if (remplis.every(c => /^(bareme|seuil)/.test(saImp(c)))) continue;
      // Intitulés courts des degrés (« JOUEUR PASSIF », « Joueur actif »…) : placés en tête des cases suivantes.
      if (!crit && !marque && !nomEnAttente && remplis.length === 4 && desc.every(c => c.length <= 30)) { prefixes = desc; continue; }
      if (marque) prefixes = null; // (les intitulés « Joueur passif »… valent pour l'AFL où ils sont écrits)
      const avecPrefixe = desc.map((c, k) => sansPointsFin(prefixes?.[k] && c ? `${prefixes[k]} — ${c}` : c));
      // Nouveau critère : marque d'AFL, nom en attente, ou nom qui commence (majuscule, chiffre) après un critère déjà décrit.
      // (Colonne du nom repérée : toute case remplie dans cette colonne commence un critère.)
      const debutCrit = crit && (colNom >= 0 || /^[A-ZÀ-Ý0-9•]/.test(crit));
      // (Nouvelle ligne de descriptifs sans nom, sous un critère qui a déjà sa ligne de points : une 2e partie du critère,
      // notée à part, « Le duathlète » vitesse puis arrêts.)
      const suite = !crit && !marque && !nomEnAttente && courant?.ptsLigne;
      if (!courant || marque || nomEnAttente || (debutCrit && courant.aDesc) || suite) {
        const base = suite ? courant.base || courant.nom || 'Critère' : null, rang = suite ? (courant.rang || 1) + 1 : 1;
        courant = { nom: suite ? `${base} (${rang})` : marque ? crit : [nomEnAttente, crit].filter(Boolean).join(' '), cases: avecPrefixe, points: null, aDesc: true, marque,
          totalAfl: noteAfl ? nbImp(noteAfl[1]) : null, ptsLus: ptsCol, base, rang };
        criteres.push(courant);
        nomEnAttente = '';
      } else {
        if (crit) courant.nom = [courant.nom, crit].filter(Boolean).join(' ');
        courant.cases = courant.cases.map((c, k) => [c, avecPrefixe[k]].filter(Boolean).join('\n'));
        courant.aDesc = true;
      }
    }
    // Critère dont les niveaux sont écrits en lignes, à côté d'une matrice de points (4 niveaux × plusieurs lignes) :
    // les lignes sont partagées en 4 parts égales, une par niveau.
    if (numeriques.length >= 8) {
      const textes = c => c.filter(t => !/^\s*(afl|e\d\s*:)/i.test(t) && t.length > 3 && !/^(evolution|indicateur|gain|points?)\b/.test(saImp(t)));
      const col = numeriques.filter(x => textes(x.cellules).length);
      const nomE = numeriques.flatMap(x => x.cellules).find(t => /^\s*e\d\s*:/i.test(t));
      if (col.length >= 4) {
        const a = numeriques[0].i, b = numeriques.filter(x => !/^\s*e\d\s*:/i.test(x.cellules.join(' '))).at(-1).i, pas = (b - a + 1) / 4;
        let niveaux = [0, 1, 2, 3].map(k => col.filter(x => x.i >= a + k * pas && x.i < a + (k + 1) * pas).flatMap(x => textes(x.cellules)).join(' ').trim());
        // (Matrice de points du haut vers le bas en décroissant : le 1er quart est le niveau le plus haut.)
        const p1 = numeriques[0].premier, p2 = numeriques.filter(x => x.i <= b).at(-1).premier;
        if (p1 !== null && p2 !== null && p1 > p2) niveaux = niveaux.reverse();
        // (Placé avant les critères des AFL suivantes : il fait partie de la grille du début.)
        const ou = criteres.findIndex(c => c.marque && c.marque !== '1');
        if (niveaux.filter(Boolean).length >= 3) criteres.splice(ou < 0 ? criteres.length : ou, 0, { nom: nomE ? sansPointsFin(nomE) : 'Critère', cases: niveaux.map(sansPointsFin), points: null, aDesc: true });
      }
    }
    if (!criteres.length) return;
    for (const c of criteres) {
      // Points : « (7 points) », « /6 », « sur 4 » dans le critère, sinon le haut de la fourchette du degré 4.
      // (« sur 4 » seulement en fin de nom : « Distance réalisée sur 9 minutes » n'est pas noté sur 9.)
      const m = /\(?\s*(\d+(?:[.,]\d+)?)\s*(?:pts?|points?)\s*\)?|\/\s*(\d+(?:[.,]\d+)?)\b|\bsur\s*(\d+(?:[.,]\d+)?)\s*$/i.exec(c.nom);
      const f4 = FOURCHETTE.exec(c.cases[3] || '');
      c.points = m ? nbImp(m[1] || m[2] || m[3]) : c.ptsLus ?? (f4 ? nbImp(f4[2]) : null);
      // Ligne de points sous le critère : elle prime (degrés vides : les points du degré d'avant, ou 0).
      if (c.ptsLigne) {
        let avant = 0;
        const p = c.ptsLigne.map(v => (v === null ? avant : (avant = v)));
        if (p.every((v, k) => !k || v >= p[k - 1]) && p[3] > 0) { c.ptsDegres = p; c.points = p[3]; }
      }
      // Pondération « 15% » dans le nom (grille iDoceo) : mise de côté, convertie plus bas.
      const pc = /(\d{1,3}(?:[.,]\d+)?)\s*%/.exec(c.nom);
      if (pc) { c.poids = nbImp(pc[1]); c.nom = c.nom.replace(pc[0], ' '); }
      // Points écrits dans chaque case (« 0 à 2 points », « 1,5 point », « Entre 4 et 5 points ») : points exacts par degré
      // (le haut de la fourchette). Ils priment sur la colonne « Points », souvent fusionnée sur deux critères.
      const vals = c.cases.map(ptsDansCase);
      if (!c.ptsDegres && vals.every(v => v !== null) && vals.every((v, k) => !k || v >= vals[k - 1]) && vals[3] > 0 && (!m || Math.abs(c.points - vals[3]) < 0.01 || (c.ptsLus != null && Math.abs(c.ptsLus - vals[3]) < 0.01))) {
        c.points = vals[3];
        c.ptsDegres = vals;
        c.points ??= vals[3];
        c.cases = c.cases.map(t => t.replace(/(^|\s)(?:entre\s+)?\d+(?:[.,]\d+)?\s*(?:(?:-|–|à|et)\s*\d+(?:[.,]\d+)?\s*)?(?:pts?|points?)?\.?\s*$/i, '$1'));
      }
      // (Sans les domaines du socle collés devant : « D3 D4 L'observateur » → « L'observateur ».)
      c.nom = c.nom.replace(/^(?:D\s?\d(?:\.\d)?[\s,/]*(?:et\s+)?)+(?=\p{L})/u, '')
        .replace(/\(?\s*\d+(?:[.,]\d+)?\s*(?:pts?|points?)\s*\)?/gi, '').replace(/\s*\/\s*\d+(?:[.,]\d+)?\b/, '').replace(/[“”"]/g, '')
        .replace(/\s*\(\s*c\.?\s*f\.?[^)]*\)/gi, '').replace(/\s+/g, ' ').trim();
      // (Nom très long « E1 : … : Score total … » : on garde la première partie.)
      if (c.nom.length > 110 && c.nom.indexOf(' : ', 8) > 0) c.nom = c.nom.slice(0, c.nom.indexOf(' : ', 8));
      c.cases = c.cases.map(t => t.replace(new RegExp(FOURCHETTE.source, 'gi'), '').replace(/\s+$/g, '').replace(/\n\s*\n/g, '\n').trim());
    }
    // Pondérations de tous les critères (« 25% », « 15% »… = 100 %) : points sur 20 en proportion.
    const ponderee = criteres.every(c => c.poids) && Math.abs(criteres.reduce((s, c) => s + c.poids, 0) - 100) < 1;
    if (ponderee) for (const c of criteres) { c.points = Math.round(c.poids / 5 * 4) / 4; delete c.ptsDegres; }
    // Points des degrés écrits dans l'en-tête (« Athlète en Bronze / 1.5 … Athlète en Or / 4 ») : même échelle pour chaque
    // critère, ramenée à ses points.
    // (Fourchettes « 0 à 2 points » : le haut.)
    let ptsEntete = debuts.map(j => { const t = String(l[h.i][j] || '').split('\n').at(-1).trim(); return ptsDansCase(t) ?? ptsCase(t); });
    if (inverse) ptsEntete = ptsEntete.reverse();
    // Note globale annoncée dans le coin de l'en-tête (« Élément C à évaluer / Note sur 10 points ») : partagée entre
    // les critères sans points, au quart de point, le reste au premier.
    const noteSur = /note\s*sur\s*(\d+(?:[.,]\d+)?)/i.exec(l[h.i].slice(0, Math.max(0, bornes[0])).join(' '));
    const sansPts = criteres.filter(x => !x.ptsDegres && x.points == null);
    if (noteSur && sansPts.length) {
      const total = nbImp(noteSur[1]) - criteres.reduce((s, x) => s + (x.points || 0), 0), part = Math.floor((total / sansPts.length) * 4) / 4;
      if (total > 0) sansPts.forEach((c, k) => { c.points = part + (k ? 0 : Math.round((total - part * sansPts.length) * 100) / 100); });
    }
    if (ptsEntete.every(v => v !== null) && ptsEntete.every((v, k) => !k || v >= ptsEntete[k - 1]) && ptsEntete[3] > 0) {
      for (const c of criteres.filter(x => !x.ptsDegres)) {
        c.points ??= ptsEntete[3];
        c.ptsDegres = ptsEntete.map(v => Math.round((v / ptsEntete[3]) * c.points * 100) / 100);
      }
    }
    // Critères de plusieurs AFL dans la même grille (« AFL1 … | AFL2 … | AFL3 … ») : un bloc par AFL.
    // (Ceux d'avant la première AFL annoncée appartiennent à l'AFL du titre, sinon à l'AFL1.)
    let aflCrit = null;
    for (const c of criteres) { aflCrit = c.marque || aflDe(c.nom) || aflCrit; c.afl = aflCrit; }
    if (criteres.some(c => c.afl && c.afl !== '1')) for (const c of criteres) c.afl ||= aflDe(titre) || '1';
    const parAfl = [];
    for (const c of criteres) { if (!parAfl.length || parAfl.at(-1).afl !== c.afl) parAfl.push({ afl: c.afl, criteres: [] }); parAfl.at(-1).criteres.push(c); }
    const propre = ({ afl, marque, aDesc, totalAfl, ptsLus, ptsLigne, poids, base, rang, ...c }) => ({ ...c, nom: c.nom.replace(/^\s*afl\s*p?\s*\d(?:[ab](?![a-zà-ÿ]))?\s*[:\-–]?\s*/i, '') });
    if (parAfl.length > 1 && parAfl.every(x => x.afl)) {
      for (const x of parAfl) blocs.push({ type: 'degres', titre: '', criteres: x.criteres.map(propre), afl: x.afl, totalAfl: x.criteres.find(c => c.totalAfl)?.totalAfl ?? null });
    } else blocs.push({ type: 'degres', titre, criteres: criteres.map(propre), afl: aflDe(titre) || criteres[0].afl || null, totalAfl: criteres.find(c => c.totalAfl)?.totalAfl ?? null, ponderee });
    for (let i = h.i; i < fin; i++) utilisees.add(i);
  });
  return blocs;
}

/* --- Barèmes à double entrée : une ligne de points (la meilleure), puis des lignes qui retirent des points
   (temps de course, retard…). Au-dessus, ce qui donne ces points : perfs (« Pts contrat filles : 4 et - | 5 | 6 à 7 »)
   ou paliers (« Manque 2 postes », « Parcours BLEU »…). L'appli ne sait pas croiser deux entrées : la ligne de points
   devient le barème, les lignes suivantes un malus indiqué en texte. --- */

// Borne basse d'une plage : « 6à 7 » → 6, « 4 et - » → 4, « 35 et+ » → 35.
const borneBasse = t => { const m = /^\s*(\d+(?:[.,]\d+)?)\s*(?:à|a|-|–|et\b)?/i.exec(String(t)); return m ? nbImp(m[1]) : null; };

function matricesPoints(l, apsa) {
  const blocs = [], utilisees = new Set();
  const nums = r => new Map(r.map((c, j) => [j, ptsCase(c)]).filter(([, v]) => v !== null));
  const texte = r => r.filter(c => c && ptsCase(c) === null).join(' ').trim();
  // Ligne orpheline (« 1.5pt » seul sur la ligne d'en dessous) : rattachée à la ligne de points au-dessus.
  const lignes = l.map(r => [...r]);
  for (let i = 0; i + 1 < lignes.length; i++) {
    const a = nums(lignes[i]), b = nums(lignes[i + 1]);
    if (a.size >= 4 && b.size && b.size <= 2 && !texte(lignes[i + 1]) && [...b.keys()].every(j => !lignes[i][j])) {
      for (const [j] of b) lignes[i][j] = lignes[i + 1][j];
      lignes[i + 1] = lignes[i + 1].map(() => '');
      utilisees.add(i + 1);
    }
  }
  const proche = (cols, j) => { let m = null; for (const c of cols) { const d = Math.abs(c - j); if (d <= 1 && (!m || d < m.d)) m = { c, d }; } return m?.c ?? null; };
  for (let t = 0; t < lignes.length; t++) {
    const T = nums(lignes[t]);
    if (T.size < 5) continue;
    const vals = [...T.entries()].sort((a, b) => a[0] - b[0]).map(x => x[1]);
    if (!vals.every((v, k) => !k || v > vals[k - 1])) continue;
    // Lignes de malus : un intitulé, des nombres, chacun ≤ la note de la ligne de points (même colonne, à une près).
    const malus = [];
    for (let i = t + 1; i < lignes.length; i++) {
      if (!lignes[i].some(Boolean)) continue; // (ligne vidée : la note orpheline remontée au-dessus)
      const R = nums(lignes[i]);
      if (!texte(lignes[i]) || R.size < 3 || /afl/i.test(texte(lignes[i]))) break;
      const ecarts = [...R].map(([j, v]) => { const c = proche([...T.keys()], j); return c === null ? null : T.get(c) - v; }).filter(x => x !== null);
      if (ecarts.length < 3 || ecarts.some(x => x < -0.01)) break;
      malus.push({ i, label: texte(lignes[i]), moins: ecarts.sort((a, b) => a - b)[Math.floor(ecarts.length / 2)] });
    }
    if (malus.length < 2) continue;
    // Au-dessus : séries de perfs, ou intitulés des paliers.
    const colsT = [...T.keys()], dessus = [];
    for (let i = t - 1; i >= 0 && i >= t - 6; i--) {
      if (utilisees.has(i)) continue;
      const r = lignes[i];
      // (On ne remonte pas au-delà de l'en-tête des degrés ni de la ligne d'une AFL et de ses longs descriptifs.)
      if (r.some(c => estDegre(c)) || r.some(c => /^\s*afl\s*p?\s*\d/i.test(c) || c.length > 60)) break;
      const alignees = r.map((c, j) => [c, proche(colsT, j)]).filter(([c, k]) => c && k !== null);
      if (alignees.length >= 3) dessus.unshift({ i, r, alignees });
    }
    const perfs = dessus.filter(x => x.alignees.filter(([c]) => borneBasse(c) !== null).length >= x.alignees.length * 0.7 && x.alignees.length >= 4);
    // (Intitulé d'une ligne : ses cases sans nombre, « Pts contrat filles », « 45mn et - ».)
    const label = r => r.filter(c => c && borneBasse(c) === null && ptsCase(c) === null).join(' ').replace(/\s+/g, ' ').trim();
    const nomT = texte(lignes[t]).replace(/\s+/g, ' ');
    if (perfs.length) {
      const brut = new Map();
      for (const x of perfs) {
        const cle = sexeImp(label(x.r));
        for (const [c, k] of x.alignees) { if (borneBasse(c) === null) continue; const b = brut.get(k) || {}; b[cle] = String(borneBasse(c)); brut.set(k, b); }
      }
      const titre = sansSexe(label(perfs[0].r)) || 'Performance';
      blocs.push({ type: 'perf', unite: uniteColonne(titre, [], apsa) === 'temps' ? 'temps' : 'nombre', supposes: false, titre, total: Math.max(...vals), complet: true,
        cles: [...new Set([...brut.values()].flatMap(b => Object.keys(b)))],
        lignes: colsT.filter(k => brut.has(k)).map(k => ({ pts: T.get(k), brut: brut.get(k) })).sort((a, b) => b.pts - a.pts) });
      perfs.forEach(x => utilisees.add(x.i));
    } else if (dessus.length) {
      const libelles = new Map();
      for (const x of dessus) for (const [c, k] of x.alignees) libelles.set(k, [libelles.get(k), c].filter(Boolean).join(' '));
      const lignesPal = colsT.filter(k => libelles.has(k)).map(k => ({ libelle: libelles.get(k).replace(/\s+/g, ' '), pts: T.get(k) })).sort((a, b) => b.pts - a.pts);
      if (lignesPal.length >= 3) {
        blocs.push({ type: 'ecart', titre: nomT || 'Paliers', lignes: lignesPal, complet: true });
        dessus.forEach(x => utilisees.add(x.i));
      }
    }
    if (blocs.length) {
      blocs.push({ type: 'texte', titre: 'Malus', garder: true,
        texte: `Points de la ligne « ${nomT || 'du barème'} », moins : ` + malus.map(m => `${m.label.replace(/\s+/g, ' ')} : −${fmt(m.moins)} pt`).join(' ; ') + '.' });
      utilisees.add(t); malus.forEach(m => utilisees.add(m.i));
      return { blocs, utilisees };
    }
  }
  return { blocs: [], utilisees: new Set() };
}

// Critères annoncés par leur AFL dans un tableau sans en-tête « Degré 1 … 4 » (suite d'une grille, page suivante…) :
// « AFL3 « Coopérer… » | N/2 | Coaching, organisateur… | 4 descriptifs ».
function grilleSansEntete(l, utilisees) {
  const blocs = [];
  l.forEach((r, i) => {
    if (utilisees.has(i)) return;
    const pleines = r.map((c, j) => [c, j]).filter(([c]) => c);
    if (!pleines.length || !/^\s*afl\s*p?\s*\d/i.test(pleines[0][0])) return;
    const longues = pleines.slice(1).filter(([c]) => c.length > 15 && !/^\s*N\s*\/\s*\d/i.test(c));
    if (longues.length < 4) return;
    const desc = longues.slice(-4), nomCells = pleines.slice(1).filter(x => !desc.includes(x));
    const total = nomCells.map(([c]) => /^\s*N\s*\/\s*(\d+(?:[.,]\d+)?)/i.exec(c)).find(Boolean);
    const nom = nomCells.map(([c]) => c).filter(c => !/^\s*N\s*\/\s*\d/i.test(c)).join(' ').trim();
    blocs.push({ type: 'degres', titre: '', afl: aflDe(pleines[0][0]), totalAfl: total ? nbImp(total[1]) : null,
      criteres: [{ nom: sansPointsFin(nom), cases: desc.map(([c]) => sansPointsFin(c)), points: null }] });
    utilisees.add(i);
  });
  return blocs;
}

/* --- Grille chiffrée (collège, « Évaluation chiffrée ») : sous l'en-tête des 4 degrés (maîtrise insuffisante … très bonne
   maîtrise), une ligne par critère « Difficulté des pyramides (4 pts) | 1 pt | 2 pts | 3 pts | 4 pts » : les points exacts de
   chaque degré. Des rubriques sur une ligne seule (« ACTEUR (10 pts) (A1) », « Le joueur individuellement (10 pts) »)
   regroupent les critères ; « NOTE FINALE : / 20 » donne le total. Les descriptifs sont souvent dans une autre grille
   (« Évaluation par compétences », mêmes critères) : ils sont rattachés ensuite (voir analyserBareme). --- */

const PTS_NOM = /\(\s*(\d+(?:[.,]\d+)?)\s*(?:pts?|points?)\s*\)|(\d+(?:[.,]\d+)?)\s*(?:pts?|points?)\b/gi;
// Nom d'une rubrique ou d'un critère : sans ses points, sur une ligne ; MOTS EN CAPITALES → Mots en capitales.
const nomPropre = t => String(t).replace(PTS_NOM, ' ').replace(/\(\s*\)/g, '').replace(/(\p{L})-\s*\n\s*(?=\p{Ll})/gu, '$1-')
  .replace(/(\d)\s+(ème|eme|e|è|er|re)\b/g, '$1$2').replace(/\s*\n\s*/g, ' ').replace(/(^|[\s(])([LDJNSCMTldjnscmt]|[Qq]u)[’']\s+/g, '$1$2’').replace(/\s+\/\s*$/, '')
  .replace(/\s+/g, ' ').trim().replace(CAPITALES, sansCapitales).replace(/^[\s/:–-]+|[\s/:–-]+$/g, '')
  .replace(/^\(([A-Z]\d[^)]{0,20})\)\s*(.{3,})$/, '$2 ($1)');
// Suite de MOTS EN CAPITALES → « Mots en capitales » (pas les sigles : APSA, AFC4, NPD ; un nom d'APSA seul : « STEP » → « Step »).
const CAPITALES = /(?<![\p{L}\d])\p{Lu}[\p{Lu}'’-]*(?:[ /–-]+\p{Lu}[\p{Lu}'’-]*)*(?![\p{L}\d])/gu;
function sansCapitales(m) {
  const mots = m.split(/[ /–-]+/).filter(Boolean), lettres = m.replace(/[^\p{L}]/gu, '');
  const apsa = typeof APSA_BAREMES !== 'undefined' && APSA_BAREMES.some(a => saImp(a) === saImp(m));
  if (!apsa && mots.length < 2 && lettres.length < 5) return m;
  if (mots.length >= 2 && mots.every(x => x.length <= 4) && !apsa) return m; // (« CA AFC », sigles côte à côte)
  // (Les sigles gardent leurs capitales : « INVESTISSEMENT EN EPS » → « Investissement en EPS ».)
  const bas = m.toLowerCase().replace(/(?<![\p{L}])(eps|apsa|afc\d?|aflp?\d?|dnb|asns|vma|cms|epi)(?![\p{L}])/gu, s => s.toUpperCase());
  return bas[0].toUpperCase() + bas.slice(1);
}
const ptsAnnonces = t => { const m = [...String(t).matchAll(PTS_NOM)].at(-1); return m ? nbImp(m[1] || m[2]) : null; };

function grilleChiffree(l) {
  const h = l.findIndex(r => r.filter(c => c && estDegre(c)).length >= 4);
  if (h < 0) return null;
  const rubriques = [];
  let total = null, autres = 0, n = 0, attente = null;
  const rubrique = nom => { rubriques.push({ nom: nomPropre(nom), annonce: nom ? ptsAnnonces(nom) : null, criteres: [] }); };
  for (const r of l.slice(h + 1)) {
    const pleines = r.filter(Boolean);
    if (!pleines.length) continue;
    const t = pleines.join(' ');
    if (/^(note\s+finale|total)\b/.test(saImp(t).trim())) { const m = /(\d+(?:[.,]\d+)?)\s*$/.exec(t); if (m) total = nbImp(m[1]); continue; }
    const pts = pleines.map(ptsCase), k = pts.findIndex(v => v !== null);
    // Critère : un nom, puis (au moins) 4 cases de points croissants. (Une 5e case égarée est ignorée.)
    // Ou bien ligne de points seule, sous une ligne « Gain des matchs (1 pt) | Classement dans la poule… » (nom + explication).
    if ((k > 0 || (k === 0 && attente)) && pts.length - k >= 4 && pts.slice(k, k + 4).every(v => v !== null)) {
      const d = pts.slice(k, k + 4);
      if (!d.every((v, i) => !i || v >= d[i - 1])) { autres++; continue; }
      const nom = k ? pleines.slice(0, k).join(' ') : attente.nom;
      if (/notee?s?\s+sur|^\s*(si\s+)?afl/.test(saImp(nom))) { autres++; continue; } // (correspondance « AFL2 notée sur 4 »)
      if (!rubriques.length) rubrique('');
      let nomC = nomPropre(nom);
      // (L'explication complète le nom : « Gain des matchs : Classement dans la poule… », ou le remplace si elle le reprend.)
      if (!k && attente.expl) {
        const e = nomPropre(attente.expl).replace(/\.$/, '');
        nomC = saImp(e).startsWith(saImp(nomC)) ? e : `${nomC} : ${e}`;
        if (nomC.length > 140) nomC = nomPropre(nom);
      }
      rubriques.at(-1).criteres.push({ nom: nomC, base: nomPropre(nom), points: d[3], ptsDegres: d, annonce: ptsAnnonces(nom), cases: ['', '', '', ''], explique: !k });
      attente = null;
      n++;
    } else if (k < 0 && pleines.length === 2 && ptsAnnonces(pleines[0]) !== null && pleines[0].length <= 100) attente = { nom: pleines[0], expl: pleines[1] };
    else if (k < 0 && pleines.length === 1 && t.length <= 160) rubrique(t);
    else autres++;
  }
  if (n < 3 || autres > n / 4) return null;
  return { rubriques: rubriques.filter(x => x.criteres.length), total, entete: h };
}

// Fiche de notation de la classe (« Noms | Prénoms | Total/20 | Gain du rapport de force /8 | Gain des reprises /2 … ») :
// seule la ligne d'en-tête est lue (jamais les lignes des élèves) → un critère par colonne notée, avec ses points.
function feuilleNotation(l) {
  const i = l.findIndex(r => r.some(c => /^\s*(noms?|[ée]l[èe]ves?|nom et pr[ée]nom)\s*$/i.test(c)) && r.filter(c => /\/\s*\d/.test(c)).length >= 2);
  if (i < 0) return null;
  let total = null;
  const criteres = [];
  for (const c of l[i]) {
    const m = /^([\s\S]*?)\/\s*(\d+(?:[.,]\d+)?)\s*$/.exec(String(c).replace(/\s*\n\s*/g, ' ').trim());
    if (!m) continue;
    const nom = m[1].trim();
    if (!nom || /^(total|note)\b/i.test(nom)) { total = nbImp(m[2]); continue; }
    criteres.push({ nom: nomPropre(nom), points: nbImp(m[2]), cases: ['', '', '', ''] });
  }
  return criteres.length >= 2 ? { criteres, total } : null;
}

// Suite de grille sans en-tête : nom du critère dans la 1re colonne, 4 colonnes de descriptifs (longs, sur presque toutes
// les lignes) à droite → en-tête « Critère | … | Degré 1 … Degré 4 » refait pour ce tableau.
// (Les lignes de points sous chaque critère, « 0 point | 1 point | … », ne comptent pas pour repérer les colonnes.)
function enteteRefait(l) {
  if (l.length < 1 || l[0].length < 5) return null;
  const textes = l.filter(r => r.filter(c => (c || '').length > 15).length >= 3);
  if (!textes.length) return null;
  const longues = l[0].map((_, j) => textes.filter(r => (r[j] || '').length > 15).length);
  const cols = longues.map((n, j) => [n, j]).filter(([n]) => n >= Math.max(1, textes.length * 0.6)).map(([, j]) => j);
  if (cols.length < 4) return null;
  const degres = cols.slice(-4);
  // (Colonne du nom : la première, à gauche des degrés, remplie sur les lignes de descriptifs.)
  const colNom = l[0].map((_, j) => j).find(j => j < degres[0] && textes.filter(r => r[j]).length >= textes.length * 0.6);
  if (colNom === undefined) return null;
  return l[0].map((_, j) => (j === colNom ? 'Critère' : degres.includes(j) ? `Degré ${degres.indexOf(j) + 1}` : ''));
}

/* --- Grille à niveaux en lignes (investissement, projet, attitude…) : une ligne par niveau, repéré dans la 1re colonne par
   ses points (« 9 à 10 points », « 2 pts »), son numéro (« 3 « Projet construit » ») ou un mot d'échelle (« Bleu »,
   « Souvent »…) ; une colonne par critère (« Engagement physique | Comportement | Rôles | Autonomie »). La note est
   globale : un seul niveau s'applique → bloc 📏 Paliers, et les descriptifs critère par critère dans un bloc 📝 Texte. --- */

// Rang d'un mot d'échelle (0 = le plus bas), ou null.
const ECHELLES_MOTS = [
  ['rouge', 'orange', 'jaune', 'vert', 'bleu'],
  ['jamais', 'rarement', 'parfois', 'souvent', 'toujours'],
  ['non acquis', 'en cours d.acquisition|en cours', 'acquis', 'depasse|expert'],
  ['insuffisant|insuffisante|maitrise insuffisante', 'fragile|maitrise fragile', 'satisfaisant|satisfaisante|maitrise satisfaisante', 'tres bonne maitrise|tb maitrise|tres satisfaisante|maitrise tres satisfaisante'],
];
function rangEchelle(t) {
  const s = saImp(String(t || '').split('\n')[0]).replace(/[^a-z' ]/g, ' ').replace(/\s+/g, ' ').trim();
  for (const e of ECHELLES_MOTS) {
    const k = e.findIndex(m => new RegExp(`^(niveau |degre )?(${m})$`).test(s));
    if (k >= 0) return { k, n: e.length };
  }
  return null;
}

function niveauDeLigne(c) {
  const s = String(c || '').trim();
  if (!s) return null;
  const [premiere, ...suite] = s.split('\n').map(x => x.trim());
  const nom = suite.join(' ').replace(/[«»"“”]/g, '').replace(/\s+/g, ' ').trim();
  let m = /^(\d+(?:[.,]\d+)?)\s*(?:à|-|–)\s*(\d+(?:[.,]\d+)?)\s*(?:pts?|points?)?\.?$/i.exec(premiere);
  if (m) return { pts: nbImp(m[2]), texte: premiere, nom };
  m = /^(\d+(?:[.,]\d+)?)\s*(?:pts?|points?)\.?$/i.exec(premiere);
  if (m) return { pts: nbImp(m[1]), texte: premiere, nom };
  const r = rangEchelle(premiere);
  if (r) return { rang: r.k + 1, texte: '', nom: premiere + (nom ? ' ' + nom : '') };
  m = /^(?:niveau\s*)?([1-6])(?:\s|$)(.*)$/i.exec(s.replace(/\n/g, ' '));
  if (m) return { rang: +m[1], texte: `niveau ${m[1]}`, nom: m[2].replace(/[«»"“”]/g, '').replace(/\s+/g, ' ').trim() };
  return null;
}

function grilleNiveauxEnLignes(l) {
  for (let i = 0; i < l.length; i++) {
    // Suite d'au moins 3 lignes : un niveau dans la 1re colonne, au moins 2 descriptifs à côté.
    const suite = [];
    for (let k = i; k < l.length; k++) {
      const niv = niveauDeLigne(l[k][0]), desc = l[k].slice(1).filter(c => c && c.length > 15).length;
      if (!niv || desc < 2) break;
      suite.push({ k, niv });
    }
    if (suite.length < 3) continue;
    // (Les niveaux se suivent : tous par leurs points, ou tous par leur rang.)
    const parPts = suite.every(x => x.niv.pts !== undefined), parRang = suite.every(x => x.niv.rang !== undefined);
    if (!parPts && !parRang) continue;
    const entete = i > 0 ? l[i - 1] : [];
    const colonnes = l[0].map((_, j) => j).filter(j => j > 0 && suite.some(x => l[x.k][j]));
    const nomCol = j => nomPropre(entete[j] || '') || `Critère ${colonnes.indexOf(j) + 1}`;
    const libelle = x => {
      const nom = x.niv.nom ? nomPropre(x.niv.nom) : '';
      return [nom, x.niv.pts !== undefined ? x.niv.texte : nom ? `niveau ${x.niv.rang}` : `Niveau ${x.niv.rang}`].filter(Boolean).join(' — ');
    };
    const lignes = suite.map(x => ({ libelle: libelle(x), pts: x.niv.pts ?? x.niv.rang, k: x.k })).sort((a, b) => b.pts - a.pts);
    const texte = lignes.map(x => `${x.libelle}\n` + colonnes.filter(j => l[x.k][j]).map(j => `• ${nomCol(j)} : ${l[x.k][j].replace(/\s*\n\s*/g, ' ')}`).join('\n')).join('\n\n');
    return { lignes: lignes.map(({ libelle, pts }) => ({ libelle, pts })), texte, criteres: colonnes.map(nomCol), parPts, entete: (entete[0] || '').trim() };
  }
  return null;
}

// Mots significatifs d'un nom de critère (pour retrouver le même critère dans deux grilles).
const motsCritere = t => new Set(saImp(t).split(/[^a-z0-9]+/).filter(m => m.length >= 4));

// Paliers / critères : une colonne de points, le reste en texte.
function essaiPaliers(l) {
  const ncol = l[0]?.length || 0;
  for (let j = ncol - 1; j >= 0; j--) {
    const lus = l.filter(r => ptsCase(r[j]) !== null);
    if (lus.length < 2 || lus.length < l.filter(r => r[j]).length * 0.7) continue;
    const lignes = lus.map(r => ({ libelle: r.filter((c, k) => k !== j && c).join(' · '), pts: ptsCase(r[j]) })).filter(x => x.libelle);
    if (lignes.length < 2 || lignes.every(x => /^[\d\s.,·]+$/.test(x.libelle))) continue;
    // (« AFL noté sur 2 pts | 0,5 pt | 1 pt… » : correspondance degrés → points, pas des paliers.)
    if (lignes.filter(x => /notee?s?\s+sur\s*\d|^(si\s+)?afl/.test(saImp(x.libelle))).length >= lignes.length / 2) return null;
    const entete = saImp(l.filter(r => ptsCase(r[j]) === null).flat().join(' '));
    return { type: /crit|indicateur|observable|chaque/.test(entete) ? 'criteres' : 'ecart', lignes };
  }
  return null;
}

// Lignes de texte « … : 2 pts » à la suite → critères observables.
const LIGNE_PTS = /^[-•*–·\s]*(.+?)[\s:.…=-]*\(?\s*(\d+(?:[.,]\d+)?)\s*(?:pts?|points?)\s*\)?\.?$/i;
const PTS_TITRE = /(?:sur|\/)\s*(\d+(?:[.,]\d+)?)\s*(?:pts?|points?)?\b|(\d+(?:[.,]\d+)?)\s*(?:pts?|points?)\b/i;

// Titre lisible d'un bloc : « Repères d'évaluation de l'AFL2 « S'entraîner… » » → « AFL2 · S'entraîner… ».
function titreBloc(t, afl) {
  let s = String(t || '').replace(/\s+/g, ' ').trim();
  const cite = /[«"“]\s*([^»"”]{4,})/.exec(s);
  if (cite) s = cite[1];
  s = s.replace(/^(rep[eè]res d.?[ée]valuation( de)?( l.?)?\s*)/i, '').replace(/^afl\s*p?\s*[1-6](?:[ab](?![a-zà-ÿ]))?\s*[:\-–]?\s*/i, '')
    .replace(/^[«"“\s]+|[»"”\s]+$/g, '').replace(/(\s+\d+(?:[.,]\d+)?){3,}.*$/, '').replace(/^fichier:\S*.*$/i, '').trim();
  if (s.length > 90) s = s.slice(0, 88).replace(/\s\S*$/, '') + '…';
  return afl ? `AFL${afl}${s ? ' · ' + s : ''}` : s;
}

// PDF sans traits où chaque ligne de barème est un seul texte (« Max 8.30 8.60 9 … », « Perf / 9 0 0.5 1 … ») :
// les lignes de nombres qui se suivent deviennent un tableau ; les petits mots juste avant (« Filles », « Moy 3 meill ») les nomment.
function paragraphesEnTables(elements) {
  const res = [];
  let lignes = [], mots = [], attente = [];
  const finir = () => {
    if (lignes.length >= 2) res.push({ type: 'table', lignes });
    else res.push(...attente);
    lignes = []; mots = []; attente = [];
  };
  for (const e of elements) {
    const toks = e.type === 'p' ? e.t.trim().split(/\s+/).filter(Boolean) : [];
    const k = toks.findIndex((x, i) => toks.slice(i).filter(caseChiffree).length >= Math.max(5, (toks.length - i) * 0.8));
    if (e.type === 'p' && k >= 0 && toks.length - k >= 5) {
      let fin = k;
      if (/^(\/|sur)$/i.test(toks[k - 1] || '') && k < toks.length) fin = k + 1;
      lignes.push([[...mots.slice(-3), ...toks.slice(0, fin)].join(' '), ...toks.slice(fin)]);
      attente.push(e); mots = [];
    } else if (e.type === 'p' && lignes.length && e.t.trim().length <= 25) {
      mots.push(e.t.trim()); attente.push(e);
    } else if (e.type === 'p' && !lignes.length && e.t.trim().length <= 25 && !/[.:]$/.test(e.t.trim())) {
      // (Mots avant la première ligne de nombres : gardés de côté, rendus tels quels s'il n'y a pas de tableau.)
      mots.push(e.t.trim()); attente.push(e);
    } else { finir(); res.push(e); }
  }
  finir();
  return res;
}

// Autres noms d'une APSA (programme du cycle 3, usages locaux) → nom de la liste des barèmes.
const ALIAS_APSA_IMPORT = { 'Courir longtemps': 'Demi-fond', 'Course longue': 'Demi-fond', Savate: 'Boxe française', 'Tennis-de-table': 'Tennis de table', 'Gym': 'Gymnastique', 'Course d\'orientation': 'Course d’orientation' };
const CYCLE3_TXT =/\b6\s?(e|eme)\b|sixieme|cycle\s*3\b/g;
const CYCLE4_TXT = /\b[345]\s?(e|eme)\b|cinquieme|quatrieme|troisieme|cycle\s*4\b|\bdnb\b|\bbrevet\b/g;
const niveauDuTexte = t => { const s = saImp(t || '').replace(/[_-]/g, ' '); return new RegExp(CYCLE3_TXT.source).test(s) ? 'cycle3' : new RegExp(CYCLE4_TXT.source).test(s) ? 'college' : null; };

function analyserBareme(elements, nomFichier) {
  elements = paragraphesEnTables(elements);
  const tout = elements.map(e => e.t || (e.lignes || []).flat().join(' ')).join('\n');
  const st = saImp(tout);
  // APSA : celle qui revient le plus (un référentiel cite souvent la liste des APSA du champ), le nom du fichier compte double.
  const apsas = [...new Set([...APSA_BAREMES, ...activitesDiscipline(), 'Danse', 'Course en durée', 'Natation de vitesse', 'Javelot', 'Saut en hauteur', 'Lancer de javelot', 'Sauvetage',
    ...Object.keys(ALIAS_APSA_IMPORT), 'Ultimate', 'Football', 'Rugby', 'Hockey', 'Tchoukball', 'Lutte', 'Judo', 'Haies', 'Multibonds', 'Cirque', 'Arts du cirque',
    'Triathlon', 'Duathlon', 'Biathlon', 'Combiné athlétique'])];
  // (« Demi fond » = « demi-fond », « Tennis-de-table » = « tennis de table ».)
  const echappe = a => saImp(a).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[- ]/g, '[- ]');
  const compte = (a, txt) => (txt.match(new RegExp(`(^|[^a-z])${echappe(a)}(?=[^a-z]|$)`, 'g')) || []).length;
  const scores = apsas.map(a => ({ a, n: compte(a, st) + 2 * compte(a, saImp(nomFichier).replace(/[-_]/g, ' ')) })).filter(x => x.n);
  // (À égalité, une APSA de la liste des barèmes : « Danse - Cirque » → Danse.)
  const deLaListe = a => +APSA_BAREMES.includes(ALIAS_APSA_IMPORT[a] || a);
  const apsaLue = scores.sort((x, y) => y.n - x.n || deLaListe(y.a) - deLaListe(x.a) || y.a.length - x.a.length)[0]?.a || '';
  // (Sans APSA, hors bac : une grille d'investissement, d'attitude ou de projet est rangée dans l'activité « Autre ».)
  const apsa = ALIAS_APSA_IMPORT[apsaLue] || apsaLue
    || (!/\bafl\s*p?\s*[1-6]|baccalaureat|\bbac\b|\bccf\b/.test(st) && /investissement|engagement|attitude|comportement|savoir.?etre|\bprojet\b|methodologique|\bcms\b/.test(st)
      && typeof ACTIVITE_AUTRE !== 'undefined' ? ACTIVITE_AUTRE : '');
  const bac = /\bafl\s*p?\s*[1-6]|baccalaureat|\bbac\b|\bccf\b/.test(st), bacPro = /\baflp\s*[1-6]|bac pro|baccalaureat professionnel|\bcap\b/.test(st);
  const paras = elements.map((e, k) => ({ ...e, k })).filter(e => e.type === 'p' && e.t.trim());
  // (Un titre est court et n'est pas une phrase : « Pendant la séquence de triathlon, évaluer… » n'en est pas un.)
  const court = p => p.t.trim().length <= 90 && p.t.trim().length >= 4 && !/[,;]|[.:]\s*$|^\d+\s+\p{Ll}/u.test(p.t.trim());
  // (Titre écrit dans un tableau d'une seule case, « EVALUATION PAR COMPÉTENCES – ULTIMATE 4ème » : compte aussi.)
  const cartouches = elements.filter(e => e.type === 'table' && e.lignes.length <= 2 && e.lignes.every(r => r.filter(c => String(c).trim()).length <= 1))
    .map(e => ({ t: e.lignes.flat().filter(c => String(c).trim()).join(' ') })).filter(x => x.t.trim());
  const titres = [...paras, ...cartouches];
  const titreBrut = (titres.find(p => court(p) && apsa && apsaLue && saImp(p.t).includes(saImp(apsa)))
    || titres.find(p => court(p) && /bareme|referentiel/.test(saImp(p.t)))
    || titres.find(p => court(p) && /^(grille|fiche)\b|evaluation|investissement|engagement|attitude|\bprojet\b/.test(saImp(p.t)))
    || paras.find(p => court(p) && !/^(inspection|acad[ée]mie|page\s*\d|fichier\s*:|date\b|nom\b)/i.test(p.t.trim())))?.t.trim();
  // (« Grille d'évaluation de l'investissement en EPS » → « Investissement en EPS ».)
  let titre = (titreBrut && nomPropre(titreBrut.replace(/^\s*([ée]valuation|bar[èe]me)s?(\s+(par\s+comp[ée]tences|chiffr[ée]e|de\s+l.?apsa))?\s*[:–—-]\s*/i, '')
    .replace(/^\s*(grille|fiche)\s+d.?\s*[ée]valuation\s+(de\s+(l.\s*|la\s+|mon\s+|ma\s+|mes\s+)?|du\s+|des\s+)?/i, '')))
    || nomFichier.replace(/\.[^.]+$/, '');
  // Niveau : la classe écrite dans le titre ou le nom du fichier (« 6ème », « 4EME »), sinon ce qui revient le plus dans
  // le texte (« cycle 3 », « 3e », « DNB »…) ; « Lycée » seulement pour le bac, ou si rien d'autre n'est dit.
  // (« secondes » d'un temps n'est pas la classe de seconde.)
  const n3 = (st.match(CYCLE3_TXT) || []).length, n4 = (st.match(CYCLE4_TXT) || []).length;
  const niveau = bac ? 'lycee' : niveauDuTexte(titreBrut) || niveauDuTexte(nomFichier)
    || (/\bterminale\b|(classe de|en) seconde\b|\b2nde\b|enseignement de specialite|\beppcs\b/.test(st) ? 'lycee'
      : n3 + n4 ? (n3 > n4 ? 'cycle3' : 'college') : /\blycee\b/.test(st) ? 'lycee' : 'college');
  const utilises = new Set();
  const candidats = [];
  // Énoncés des AFL (« AFL 2 : « Se préparer et s'entraîner… » ») : pour nommer les blocs.
  const enonces = {};
  for (const m of tout.replace(/\s*\n\s*/g, ' ').matchAll(/\bAFL\s*(P?)\s*([1-6])\s*[a-z]?\s*:?\s*[«"“]\s*([^»"”]{6,220})/gi)) {
    const k = m[1] ? 'P' + m[2] : m[2];
    enonces[k] ??= m[3].replace(/\s+/g, ' ').trim();
  }
  // (Sans guillemets : paragraphe qui commence par « AFL2 Se préparer et s'entraîner… ».)
  // (… ou case de tableau « AFLP 1 : Produire et répartir… ».)
  for (const t of elements.flatMap(e => (e.type === 'p' ? [e.t] : (e.lignes || []).flat()))) {
    const m = /^\s*AFL\s*(P?)\s*([1-6])(?:[ab](?![a-zà-ÿ]))?\s*[:\-–]?\s*([A-ZÀ-Ý][^\n]{10,220})/.exec((t || '').replace(/\s*\n\s*/g, ' '));
    if (m) enonces[m[1] ? 'P' + m[2] : m[2]] ??= m[3].replace(/[«»"“”]/g, '').replace(/\s+/g, ' ').trim();
  }
  // Points des AFL lus dans le texte.
  const m1 = /afl\s*1\s*b?\s*(?:est\s*)?(?:notee?|evaluee?)\s*sur\s*(\d+)/.exec(st);
  const totalAfl1 = m1 ? +m1[1] : bac && !bacPro ? 12 : null;
  // Titre d'un tableau : le court paragraphe juste avant lui (pas une suite de phrase).
  let aflCourant = null, dernierTitre = '', derniereGrille = null;
  const entetesGrilles = new Set();
  const titreAvant = k => {
    for (let i = k - 1; i >= 0 && i >= k - 3; i--) {
      const e = elements[i];
      if (e.type === 'table') return null;
      const t = e.t.trim();
      if (t && t.length <= 160 && !utilises.has(i) && /^[A-ZÀ-Ý0-9«"“(•-]/.test(t) && !/^[\d\s/.-]+$/.test(t) && !/^(cette|l.eleve|le |la |les |l.evaluation)/.test(saImp(t))) { utilises.add(i); return t; }
    }
    return null;
  };
  const nommer = (brut, afl, secours) => {
    // AFL connue : son énoncé officiel (« AFL2 · Se préparer et s'entraîner… »), sauf titre cité entre guillemets.
    if (afl && enonces[afl]) return titreBloc(enonces[afl], afl);
    const t = titreBloc(brut, afl);
    return t || titreBloc(secours, afl) || secours;
  };
  let nTable = 0, totalAnnonce = null;
  const alertes = [];
  const traiterElement = (e, k) => {
    if (e.type === 'p') {
      const t = e.t.trim();
      if (t.length <= 220 && titreAfl(t)) { aflCourant = titreAfl(t); dernierTitre = t; }
      return;
    }
    const l = nettoyerTable(e.lignes);
    if (!l.length) return;
    if (l[0].length < 2) { // tableau d'une colonne = texte
      const t = l.map(r => r[0]).join('\n');
      if (cartouches.some(x => x.t.trim() === t.trim()) && t.length <= 120) return; // (cartouche de titre : déjà lu pour le titre)
      if (titreAfl(t)) { aflCourant = titreAfl(t); dernierTitre = t.split('\n')[0]; }
      return candidats.push({ type: 'texte', titre: 'Texte', texte: t, garder: false });
    }
    nTable++;
    // 0. Grille chiffrée (collège) : un bloc par rubrique, points exacts de chaque degré.
    // (Pas pour un référentiel du bac : ses tableaux degrés → points sont des correspondances, gérées plus bas.)
    const gc = bac ? null : grilleChiffree(l);
    if (gc) {
      totalAnnonce ??= gc.total;
      for (const r of gc.rubriques) candidats.push({ type: 'degres', titre: r.nom || `Grille chiffrée (tableau ${nTable})`, afl: null, garder: true, chiffree: true, annonce: r.annonce, criteres: r.criteres });
      return;
    }
    // Fiche de notation de la classe : ses colonnes notées deviennent les critères (sans descriptifs, à compléter).
    const fn = bac ? null : feuilleNotation(l);
    if (fn) {
      candidats.push({ type: 'degres', titre: 'Fiche de notation', afl: null, garder: true, criteres: fn.criteres });
      const somme = fn.criteres.reduce((s, c) => s + c.points, 0);
      if (fn.total && Math.abs(fn.total - somme) > 0.01) alertes.push(`Fiche de notation : total annoncé sur ${fmt(fn.total)}, les colonnes font ${fmt(somme)} pts.`);
      return;
    }
    const tAvant = titreAvant(k);
    if (tAvant && titreAfl(tAvant)) { aflCourant = titreAfl(tAvant); dernierTitre = tAvant; }
    // AFL annoncée en tête du tableau lui-même (« Repères d'évaluation de l'AFL1 … », « AFL2 | SE PRÉPARER… »).
    for (const r of l.slice(0, 4)) {
      const t = r.filter(Boolean).join(' ');
      const a = titreAfl(t) || (/^\s*afl\s*p?\s*\d\s*$/i.test(r.find(Boolean) || '') ? aflDe(r.find(Boolean)) : null);
      if (a) { aflCourant = a; dernierTitre = t; break; }
    }
    const avant = candidats.length;
    // 0. Barème à double entrée (points × temps, parcours × retard…) : la ligne de points, et un malus en texte.
    const mat = matricesPoints(l, apsa), aflMat = aflCourant;
    for (const b of mat.blocs) candidats.push({ ...b, afl: aflCourant, garder: b.garder ?? true,
      titre: b.type === 'texte' ? (aflCourant ? `AFL${aflCourant} · ` : '') + b.titre : titreBloc(b.titre, aflCourant) || nommer(tAvant, aflCourant, b.titre) });
    const lr = mat.blocs.length ? l.map((r, i) => (mat.utilisees.has(i) ? r.map(() => '') : r)) : l;
    // 1. Barèmes de performance (lignes, puis colonnes).
    let { blocs: perfs, utilisees } = seriesPerf(lr, apsa);
    for (const i of mat.utilisees) utilisees.add(i);
    if (!perfs.length && !mat.blocs.length) {
      // En colonnes : chaque étage du tableau à part (barème de perf, puis écart au projet…).
      for (const etage of etagesTable(l)) perfs.push(...seriesPerf(transposer(etage), apsa).blocs);
      // (Lignes prises par le barème : celles de nombres, et leurs en-têtes « Note | Temps filles… » juste au-dessus.)
      if (perfs.length) utilisees = new Set(l.map((_, i) => i).filter(i => ligneChiffree(l[i])
        || ([1, 2].some(d => ligneChiffree(l[i + d] || [])) && /note|temps|fille|garcon|perf|distance/.test(saImp(l[i].join(' '))) && !l[i].some(c => c.length > 40))));
    }
    // (Barème de perf : son propre intitulé, « La performance maximale », « VMA »… plutôt que l'énoncé de l'AFL.)
    // (Tableau de performance dont beaucoup de cases ne se lisent pas, « Distance en | M | 70,00 » mêlés : proposé décoché.)
    const lisible = p => { const b = blocDuCandidat(p, 0.5), v = b.lignes.flatMap(x => Object.entries(x).filter(([k]) => k !== 'pts').map(([, y]) => y)); return v.filter(y => y === null).length <= v.length * 0.3; };
    for (const p of perfs) {
      const ok = lisible(p);
      candidats.push({ ...p, afl: aflCourant, titre: ((p.titre && titreBloc(p.titre, aflCourant).replace(/^AFL\w*$/, '')) || nommer(tAvant, aflCourant, `Performance (tableau ${nTable})`)) + (ok ? '' : ' (mal lu)'), garder: ok });
    }
    // 2a. Grille à niveaux en lignes (investissement, projet…) : note globale → paliers + descriptifs en texte.
    const gn = !bac && !perfs.length && !mat.blocs.length ? grilleNiveauxEnLignes(l) : null;
    if (gn) {
      // (Couleurs annoncées dans le texte seulement, « 5 niveaux, du rouge au bleu » : données aux niveaux sans nom.)
      const couleurs = ECHELLES_MOTS[0];
      if (gn.lignes.length === couleurs.length && /du rouge au bleu|rouge.{0,40}bleu/.test(st) && gn.lignes.every(x => !/—/.test(x.libelle))) {
        gn.lignes.forEach((x, k) => { const c = couleurs[couleurs.length - 1 - k]; x.libelle = `${c[0].toUpperCase()}${c.slice(1)} — ${x.libelle}`; });
        // (Même nom en tête de chaque niveau dans les descriptifs : ils sont dans le même ordre.)
        gn.texte = gn.texte.split('\n\n').map((b, k) => gn.lignes[k].libelle + b.slice(b.indexOf('\n'))).join('\n\n');
      }
      const theme = /investissement/.test(st) ? 'Niveau d’investissement' : /\bprojet\b/.test(st) ? 'Niveau du projet'
        : /engagement/.test(st) ? 'Niveau d’engagement' : /attitude|comportement/.test(st) ? 'Niveau d’attitude' : 'Niveau atteint';
      candidats.push({ type: 'ecart', titre: theme, lignes: gn.lignes, garder: true });
      candidats.push({ type: 'texte', titre: `Descriptifs des niveaux (${gn.criteres.join(', ')})`.slice(0, 120), texte: gn.texte.slice(0, 4000), garder: true });
      if (!gn.parPts) alertes.push(`« ${theme} » : les niveaux n’ont pas de points dans le document. L’appli leur a donné 1 à ${gn.lignes.length} : ajuste-les.`);
      return;
    }
    // 2. Grilles par degrés.
    let grilles = grillesDegres(l, utilisees);
    // Grille « couchée » : les degrés en lignes (1re colonne), les critères en colonnes.
    if (!grilles.length && !perfs.length && l.filter(r => r[0] && estDegre(r[0].split('\n')[0])).length >= 4) grilles = grillesDegres(transposer(l), new Set());
    // Suite d'une grille coupée par un saut de page (mêmes colonnes, sans en-tête « Degré 1 … 4 ») : rattachée à la grille.
    // (Colonnes différentes, ou en-tête seul dans le tableau d'avant : en-tête refait sur ce tableau, s'il a un nom à gauche
    // et 4 colonnes de descriptifs à droite.)
    if (!grilles.length && !perfs.length && derniereGrille) {
      let suite = derniereGrille.cand && l[0].length === derniereGrille.ncol ? grillesDegres([derniereGrille.entete, ...l], new Set()) : [];
      const synth = suite.length ? null : enteteRefait(l);
      if (synth) suite = grillesDegres([synth, ...l], new Set());
      if (suite.length) {
        const crits = suite.flatMap(g => g.criteres);
        if (derniereGrille.cand) derniereGrille.cand.criteres.push(...crits);
        else candidats.push(derniereGrille.cand = { type: 'degres', titre: nommer(derniereGrille.titre, aflCourant, `Grille par degrés (tableau ${nTable})`), afl: aflCourant, criteres: crits, garder: true });
        return;
      }
    }
    // Rôle annoncé juste avant un petit tableau à un seul critère (« Rôle de coach (évalué…) ») : c'est le nom du critère.
    const role = tAvant && /^\s*(r[oô]les?\s+d|coach|juge|arbitre|observateur|partenaire|gestionnaire|chronom|starter|aide|pareur|secr[ée]taire)/i.test(tAvant)
      ? tAvant.replace(/\s*\(([^)]*)\)\s*$/, '').replace(/^\s*r[oô]le\s+d[e’']\s*/i, '').replace(/^./, c => c.toUpperCase()) : '';
    // Tableau qui recommence avec le même en-tête qu'une grille déjà lue (« Domaines | DUATHLON | C.A 1 Cycle 4 ») :
    // une autre version de la même évaluation (version élève…), proposée décochée.
    const enteteTableau = saImp(l[0].filter(c => c && c.length <= 40).slice(0, 4).join(' ')).replace(/[^a-z0-9]+/g, ' ').trim();
    const autreVersion = grilles.length && enteteTableau.split(' ').length >= 3 && entetesGrilles.has(enteteTableau);
    if (grilles.length && enteteTableau.split(' ').length >= 3) entetesGrilles.add(enteteTableau);
    for (const g of grilles) {
      if (g.ponderee) alertes.push(`Pondérations (${g.criteres.map(c => fmt(c.points * 5) + ' %').join(', ')}) converties en points sur 20 : ajuste avec « Ramener sur » si ta note est sur un autre total.`);
      const afl = g.afl || aflCourant;
      if (g.afl) aflCourant = g.afl;
      const seul = g.criteres.length === 1 && !g.criteres[0].nom && role;
      if (seul) g.criteres[0].nom = role;
      // Rôles de la même AFL, un tableau par rôle : un seul bloc, un critère par rôle.
      // (Les blocs « texte » d'entre deux pages ne coupent pas la suite des rôles.)
      const prec = candidats.filter(x => x.type !== 'texte').at(-1);
      if (seul && prec?.parRoles && prec.afl === afl) { prec.criteres.push(...g.criteres); continue; }
      const brut = (g.titre && /[«"“]/.test(g.titre) ? g.titre : '') || (titreAfl(dernierTitre) === afl ? dernierTitre : '') || g.titre || tAvant;
      const cand = { ...g, afl, titre: nommer(brut, afl, `Grille par degrés (tableau ${nTable})`), garder: !autreVersion, parRoles: !!seul, autreVersion };
      candidats.push(cand);
      const entete = l.find(r => r.filter(c => c && estDegre(c)).length >= 4);
      derniereGrille = entete ? { entete, ncol: l[0].length, cand } : null;
    }
    // Critères « AFL n … » avec 4 descriptifs, sans en-tête de degrés dans ce tableau.
    for (const g of grilleSansEntete(l, utilisees)) {
      if (g.afl) aflCourant = g.afl;
      // (Même tableau qu'un barème chiffré : ce barème donne déjà les points, la grille reste un repère.)
      const repere = (perfs.length && (g.afl || '1') === (aflMat || '1')) || (mat.blocs.some(b => b.type !== 'texte') && g.afl === aflMat);
      if (repere) g.criteres.forEach(c => { c.points = 0; });
      candidats.push({ ...g, titre: nommer('', g.afl, `Grille par degrés (tableau ${nTable})`) + (repere ? ' (repères)' : ''), garder: !repere });
    }
    if (candidats.length > avant) return;
    // En-tête « Degré 1 … 4 » sans critère : table de correspondance degrés → points (l'appli les calcule).
    if (l.some(r => r.filter(c => c && estDegre(c)).length >= 4)) {
      // (Les critères sont peut-être dans le tableau suivant : en-tête gardé pour lui.)
      const entete = l.find(r => r.filter(c => c && estDegre(c)).length >= 4);
      derniereGrille = { entete, ncol: l[0].length, cand: null, titre: tAvant || '' };
      return candidats.push({ type: 'texte', titre: 'Correspondance degrés → points', texte: l.map(r => r.filter(Boolean).join(' | ')).join('\n'), garder: false });
    }
    // 3. Paliers / critères, sinon texte.
    const paliers = essaiPaliers(l);
    if (paliers) return candidats.push({ ...paliers, afl: aflCourant, titre: nommer(tAvant, aflCourant, paliers.type === 'ecart' ? `Paliers (tableau ${nTable})` : `Critères (tableau ${nTable})`), garder: true });
    candidats.push({ type: 'texte', titre: tAvant || `Tableau ${nTable} (non reconnu)`, texte: l.map(r => r.filter(Boolean).join(' | ')).join('\n'), garder: false });
  };
  // Plusieurs évaluations dans le même document (« Évaluation Natation 6e », « Évaluation Badminton 6e »…, ou « Savate /
  // Cycle 3 », « Savate / Cycle 4 – Module 1 ») : chaque bloc retient l'évaluation sous laquelle il est écrit.
  // (« Évaluation par compétences – Ultimate 4e » et « Évaluation chiffrée – Ultimate 4e » sont la même évaluation.)
  let groupe = null;
  const titreGroupe = t => {
    t = String(t || '').replace(/\s+/g, ' ').trim();
    if (t.length < 4 || t.length > 90) return null;
    const s = saImp(t);
    let a = apsas.filter(x => compte(x, s)).sort((x, y) => y.length - x.length)[0];
    // (Sans nom d'APSA connu : « Classe 6ème | Activités | Sport de combat | Horaire 14h » → l'activité écrite.)
    if (!a && niveauDuTexte(t)) a = /\b(?:activit[ée]s?|apsa)\s*:?\s+(.{4,40}?)\s*(?:\bhoraires?\b|$)/i.exec(t)?.[1];
    if (!a || !(niveauDuTexte(t) || /evaluation|bareme|referentiel|fiche|grille/.test(s))) return null;
    let propre = nomPropre(t.replace(/^\s*(e\s+)?([ée]valuation|bar[èe]me|r[ée]f[ée]rentiel|fiche|grille)s?(\s+(par\s+comp[ée]tences|chiffr[ée]e|d.[ée]valuation|de\s+l.?apsa))?\s*[:–—-]?\s*/i, ''));
    // (Ligne d'en-tête d'un référentiel, « Cycle 4 | Champ 1 | Classe 3ème | APSA Demi fond | Horaire 10h » : l'APSA et la classe.)
    if (propre.length > 45) propre = `${ALIAS_APSA_IMPORT[a] || a} ${(/\b\d\s?(?:e|ème|eme)\b/i.exec(t) || /cycle\s*\d/i.exec(t) || [''])[0]}`.trim();
    return { cle: saImp(propre).replace(/[^a-z0-9]+/g, ' ').trim(), titre: propre, apsa: ALIAS_APSA_IMPORT[a] || a, niveau: niveauDuTexte(t) };
  };
  elements.forEach((e, k) => {
    const lignes = e.type === 'table' ? e.lignes.filter(r => r.some(c => String(c).trim())) : [];
    // (Titre : un paragraphe, ou l'une des deux premières lignes d'un tableau. Pas pour le bac : un référentiel par fichier.)
    const essais = e.type === 'p' ? [e.t] : lignes.slice(0, 2).map(r => r.filter(c => String(c).trim()).join(' '));
    const g = bac ? null : essais.map(titreGroupe).find(Boolean);
    if (g) groupe = g;
    const avant = candidats.length;
    traiterElement(e, k);
    for (const c of candidats.slice(avant)) c.groupe = groupe;
  });
  // Grille chiffrée + grille de compétences (mêmes critères : dans le même ordre, sinon retrouvés par leurs mots) :
  // les descriptifs passent dans la grille chiffrée, et la grille de compétences n'est plus proposée à part.
  // (Évaluation par évaluation, quand le document en contient plusieurs.)
  for (const cleG of new Set(candidats.filter(x => x.chiffree).map(x => x.groupe?.cle ?? ''))) {
    const memeG = x => (x.groupe?.cle ?? '') === cleG;
    const chiffrees = candidats.filter(x => x.chiffree && memeG(x));
    const cibles = chiffrees.flatMap(x => x.criteres);
    const descs = candidats.filter(x => x.type === 'degres' && !x.chiffree && memeG(x));
    // (Ligne de la grille de compétences écrite dans une seule case fusionnée, « Performance | *Gain des matchs… » : c'est une
    // explication, pas des niveaux ; elle est déjà dans le nom des critères chiffrés correspondants.)
    const pris = new Set(descs.flatMap(x => x.criteres).filter(s => s.cases.filter(Boolean).length <= 1));
    const sources = descs.flatMap(x => x.criteres).filter(s => !pris.has(s));
    if (sources.length === cibles.filter(c => !c.explique).length) cibles.filter(c => !c.explique).forEach((c, i) => { c.cases = [...sources[i].cases]; pris.add(sources[i]); });
    else for (const c of cibles.filter(x => !x.explique)) {
      const m = motsCritere(c.base || c.nom);
      let mieux = null, score = 0;
      for (const s of sources.filter(x => !pris.has(x))) {
        const ms = motsCritere(s.nom), commun = [...m].filter(x => ms.has(x)).length / (m.size || 1);
        if (commun > score) { score = commun; mieux = s; }
      }
      if (mieux && score >= 0.5) { c.cases = [...mieux.cases]; pris.add(mieux); }
    }
    for (const g of descs) if (g.criteres.every(c => pris.has(c))) candidats.splice(candidats.indexOf(g), 1);
    // Contrôles : points annoncés ≠ points du degré 4, rubrique ou total qui ne tombe pas juste.
    const r2 = x => Math.round(x * 100) / 100;
    for (const g of chiffrees) {
      for (const c of g.criteres) if (c.annonce !== null && Math.abs(c.annonce - c.points) > 0.01)
        alertes.push(`« ${c.nom} » : le document annonce ${fmt(c.annonce)} pts, mais le degré 4 en donne ${fmt(c.points)}. L’appli a gardé ${fmt(c.points)} : corrige si besoin.`);
      const somme = r2(g.criteres.reduce((s, c) => s + c.points, 0));
      if (g.annonce !== null && Math.abs(g.annonce - somme) > 0.01) alertes.push(`« ${g.titre} » : annoncé sur ${fmt(g.annonce)} pts, ses critères font ${fmt(somme)} pts.`);
    }
    const somme = r2(cibles.reduce((s, c) => s + c.points, 0));
    if (totalAnnonce && Math.abs(totalAnnonce - somme) > 0.01) alertes.push(`Note finale annoncée sur ${fmt(totalAnnonce)}, mais les critères font ${fmt(somme)} pts en tout.`);
    if (cibles.some(c => !c.explique && c.cases.every(t => !t))) alertes.push('Certains critères n’ont pas retrouvé leurs descriptifs : complète-les dans le barème si besoin.');
  }
  // Compétence attendue de l'établissement (« Compétence Attendue à Saint-André : … ») : gardée en texte.
  const attendu = elements.flatMap(e => (e.type === 'p' ? [e.t] : (e.lignes || []).flat())).find(t => /^\s*comp[ée]tences?\s+attendues?\b/i.test(t || '') && t.length > 40);
  if (attendu) candidats.push({ type: 'texte', titre: 'Compétence attendue', garder: true, texte: attendu.replace(/^\s*comp[ée]tences?\s+attendues?[^:]{0,40}:\s*/i, '').trim().slice(0, 2000) });
  // Lignes « … : 2 pts » à la suite.
  for (let i = 0; i < elements.length; i++) {
    const serie = [];
    // (Pas les phrases du règlement : « L'AFL1 est noté sur 12 points ».)
    while (i < elements.length && elements[i].type === 'p' && LIGNE_PTS.test(elements[i].t.trim())
      && !/notee?s?\s+sur|\bafl|repartition/.test(saImp(elements[i].t)) && !utilises.has(i)) serie.push(i++);
    if (serie.length >= 2) {
      const tTitre = titreAvant(serie[0]);
      serie.forEach(x => utilises.add(x));
      candidats.push({ type: 'criteres', titre: tTitre || 'Critères', garder: true, lignes: serie.map(x => {
        const m = LIGNE_PTS.exec(elements[x].t.trim());
        return { libelle: m[1].trim(), pts: nbImp(m[2]) };
      }) });
    }
  }
  // Même grille trouvée deux fois (document répété, ex. une page filles et une page garçons) : gardée une fois.
  const vus = new Set();
  for (const x of candidats) {
    if (x.type !== 'degres') continue;
    const cle = JSON.stringify(x.criteres.map(c => [c.nom, c.cases]));
    if (vus.has(cle)) x.garder = false; else vus.add(cle);
  }
  // Même grille écrite deux fois autrement (version élève « Être capable de… » après la version enseignant) : mêmes points,
  // degré par degré et dans le même ordre → la seconde est proposée décochée.
  const signatures = new Map();
  for (const x of candidats.filter(y => y.type === 'degres' && y.garder && y.criteres.length >= 3 && y.criteres.every(c => c.ptsDegres))) {
    const sig = (x.groupe?.cle ?? '') + '#' + x.criteres.map(c => c.ptsDegres.join('/')).join('|');
    if (signatures.has(sig)) { x.garder = false; x.titre += ' (autre version)'; } else signatures.set(sig, x);
  }
  // Points manquants des critères.
  const degres = candidats.filter(x => x.type === 'degres' && x.garder);
  // Points annoncés dans le titre du bloc (« CA1 – AFLP2 (5 points) ») : partagés entre ses critères sans points.
  // (Même titre pour plusieurs blocs, « … sur 8 points » au-dessus de l'AFLP4 et de l'AFLP5 : les points sont partagés entre eux.)
  // (Pas pour les AFL2 / AFL3 du bac ni les AFLP 3 à 6 du bac pro : au choix de l'élève, leurs points sont fixés plus bas.)
  const sansAfl = t => t.replace(/^AFLP?\d\s*·\s*/, '');
  const auChoix = g => bac && /^(2|3|P[3-6])$/.test(g.afl || '');
  for (const titreG of new Set(degres.filter(g => !auChoix(g)).map(g => sansAfl(g.titre)))) {
    const m = /\((\d+(?:[.,]\d+)?)\s*(?:pts?|points?)\)|\bsur\s*(\d+(?:[.,]\d+)?)\s*(?:pts?|points?)?\b/i.exec(titreG);
    const crits = degres.filter(g => !auChoix(g) && sansAfl(g.titre) === titreG).flatMap(g => g.criteres), sans = crits.filter(c => c.points === null);
    if (m && sans.length) {
      const reste = Math.max(0, nbImp(m[1] || m[2]) - crits.reduce((s, c) => s + (c.points || 0), 0));
      sans.forEach(c => { c.points = Math.round((reste / sans.length) * 2) / 2 || null; });
    }
  }
  // Points annoncés dans le texte pour les éléments (« E1 (8pts) », « E2 (4 pts) ») : donnés aux critères « E1 : … ».
  const ptsElements = {};
  for (const m of tout.matchAll(/\b(E\d)\s*\(\s*(\d+(?:[.,]\d+)?)\s*(?:pts?|points?)\s*\)/gi)) ptsElements[m[1].toUpperCase()] ??= nbImp(m[2]);
  for (const c of degres.flatMap(x => x.criteres)) {
    const e = /^\s*(E\d)\b/i.exec(c.nom)?.[1]?.toUpperCase();
    if (e && ptsElements[e] !== undefined && c.points === null) c.points = ptsElements[e];
  }
  // Partage au demi-point, le reste au premier critère : la somme tombe juste (4 points sur 3 rôles = 1,5 + 1,5 + 1).
  const partager = (blocs, total) => {
    const crits = blocs.flatMap(x => x.criteres), sans = crits.filter(c => c.points === null);
    if (!sans.length) return;
    const reste = Math.max(0, total - crits.reduce((s, c) => s + (c.points || 0), 0));
    const part = reste ? Math.max(0.5, Math.floor((reste / sans.length) * 2) / 2) : 0;
    sans.forEach(c => { c.points = part; });
    const ecart = Math.round((reste - part * sans.length) * 2) / 2;
    if (ecart > 0) sans[0].points += ecart;
  };
  // Totaux par AFL écrits dans les tableaux (colonne « Note » : « N/12 », « N/6 », « N/2 »).
  const totaux = {};
  for (const x of candidats) if (x.totalAfl && x.afl) totaux[x.afl] ??= x.totalAfl;
  const total1 = totaux['1'] ?? totalAfl1;
  // Barème à double entrée qui donne à lui seul tous les points d'une AFL : ses grilles par degrés restent des repères
  // (proposées décochées, sans points).
  for (const x of candidats.filter(y => y.complet && y.garder && y.type !== 'texte')) {
    const afl = x.afl || '1', total = afl === '1' ? total1 : totaux[afl];
    const maxi = x.total ?? Math.max(...x.lignes.map(l => l.pts));
    if (total && maxi >= total) {
      for (const g of degres.filter(y => (y.afl || '1') === afl)) { g.garder = false; g.titre += ' (repères)'; g.criteres.forEach(c => { c.points ??= 0; }); }
    }
  }
  // AFL1 « par croisement » (performance × indice technique → note sur 12) : les barèmes de perf dépassent à eux seuls
  // le total de l'AFL1. L'appli ne sait pas croiser : moitié des points pour la perf, moitié pour la technique.
  if (bac && total1) {
    const totalAfl1 = total1;
    const premier = x => x.garder && ['1', null, undefined].includes(x.afl);
    const perfs1 = candidats.filter(x => premier(x) && x.type === 'perf' && !x.complet);
    const maxi = x => x.total ?? Math.max(...x.lignes.map(l => l.pts));
    const crit1 = degres.filter(premier).flatMap(x => x.criteres);
    // (Perf qui prend déjà tous les points alors qu'il y a aussi une grille technique : c'est aussi un croisement.)
    const sommePerf = perfs1.reduce((s, x) => s + maxi(x), 0);
    if (sommePerf > totalAfl1 || (perfs1.length && sommePerf >= totalAfl1 && crit1.length)) {
      const partPerf = crit1.length ? totalAfl1 / 2 : totalAfl1;
      for (const x of perfs1) {
        const k = partPerf / perfs1.length / maxi(x);
        x.lignes.forEach(l => { l.pts = Math.round(l.pts * k * 100) / 100; });
        x.total = partPerf / perfs1.length;
      }
      crit1.forEach(c => { c.points = Math.round(((totalAfl1 - partPerf) / crit1.length) * 2) / 2; });
      candidats.push({ type: 'texte', titre: 'AFL1 : note par croisement', garder: true, afl: '1',
        texte: `Dans ce référentiel, la note de l’AFL1 (sur ${totalAfl1}) croise la performance et l’indice technique. L’appli les a séparés : ${fmt(partPerf)} points pour la performance, ${fmt(totalAfl1 - partPerf)} pour la technique. Ajuste si besoin.` });
    }
  }
  if (bac) {
    // AFL2 et AFL3 : 4 points chacun (répartition 4 / 4 par défaut ; l'élève peut choisir 2 / 6 ou 6 / 2).
    for (const afl of ['2', '3']) partager(degres.filter(x => x.afl === afl && x.garder), totaux[afl] ?? 4);
    // Bac pro : AFLP 3 à 6 (deux retenues) : 4 points chacune.
    for (const afl of ['P3', 'P4', 'P5', 'P6']) partager(degres.filter(x => x.afl === afl), 4);
    // AFL1 (ou AFLP1 + AFLP2) : le total (12 en général) moins ce qui est déjà compté (barèmes de perf compris).
    const premiers = candidats.filter(x => x.garder && x.type !== 'texte' && ['1', 'P1', 'P2', null, undefined].includes(x.afl));
    const deja = premiers.filter(x => x.type === 'perf').reduce((s, x) => s + (x.total ?? Math.max(...x.lignes.map(l => l.pts))), 0);
    partager(premiers.filter(x => x.type === 'degres'), (total1 ?? 12) - deja);
  }
  for (const c of degres.flatMap(x => x.criteres)) if (c.points === null) c.points = 2;
  // Critère sans nom (AFL2, AFL3 : une seule ligne de descriptifs) : le titre du bloc, sans « AFL2 · ».
  // (Plusieurs critères sans nom dans une grille, PDF où les noms sont illisibles : « Critère 1 », « Critère 2 »…)
  for (const g of degres) g.criteres.forEach((c, i) => {
    c.nom = c.nom.replace(/\s+/g, ' ').trim();
    if (!c.nom) c.nom = g.criteres.length > 1 && /\(tableau \d+\)$/.test(g.titre) ? `Critère ${i + 1}` : g.titre.replace(/^AFLP?\d\s*·\s*/, '').replace(/\s*\(repères\)$/, '');
    if (/^Critère \(\d+\)$/.test(c.nom)) c.nom = `Critère ${i + 1}`;
  });
  // Répartition AFL2 / AFL3 au choix de l'élève : rappelée dans un bloc texte.
  // (Pas de rappel si le document fixe lui-même les points de l'AFL2 et de l'AFL3, « N/6 » et « N/2 ».)
  if (bac && !bacPro && degres.some(x => x.afl === '2' || x.afl === '3') && !(totaux['2'] && totaux['3'])) {
    const phrase = paras.map(p => p.t.trim()).find(t => /repartition/.test(saImp(t)) && /afl/.test(saImp(t)) && t.length < 300);
    candidats.push({ type: 'texte', titre: 'Répartition AFL2 / AFL3', garder: true,
      texte: (phrase ? phrase + '\n' : '') + 'Au choix de l’élève : 2 / 6, 4 / 4 ou 6 / 2 points. Ajuste les points des blocs AFL2 et AFL3 en conséquence.' });
  }
  if (bacPro && degres.some(x => /^P[3-6]$/.test(x.afl || ''))) {
    candidats.push({ type: 'texte', titre: 'AFLP retenues', garder: true,
      texte: 'Bac pro : deux AFLP parmi les AFLP 3 à 6 sont évaluées (4 points chacune). Désactive les blocs des AFLP non retenues.' });
  }
  // Ordre : AFL1 (ou sans AFL), AFL2, AFL3, AFLP dans l'ordre ; le texte à la fin.
  const rang = x => (x.titre === 'Répartition AFL2 / AFL3' || x.titre === 'AFLP retenues' ? 50 : x.type === 'texte' ? 99
    : !x.afl ? 0 : x.afl[0] === 'P' ? 10 + +x.afl[1] : +x.afl);
  candidats.sort((a, b) => rang(a) - rang(b));
  // Le reste du texte : proposé en bloc « Texte » (décoché).
  const reste = paras.filter(p => !utilises.has(p.k)).map(p => p.t.trim()).join('\n').slice(0, 3000);
  if (reste) candidats.push({ type: 'texte', titre: 'Texte du document', texte: reste, garder: false });
  // Évaluations distinctes (au moins deux, chacune avec un bloc de barème) : l'enseignant pourra en faire un barème chacune.
  const groupes = [];
  for (const x of candidats) if (x.groupe && x.type !== 'texte' && !groupes.some(g => g.cle === x.groupe.cle)) groupes.push(x.groupe);
  // Bloc sans titre parlant (« Grille par degrés (tableau 2) ») : le nom de son évaluation.
  // (Ni une ligne de liste « - Sentir l'appui… », ni une étiquette « Ressources : » lue au-dessus du tableau.)
  for (const x of candidats) if (x.groupe && /^(Grille par degrés|Grille chiffrée|Paliers|Critères) \(tableau \d+\)$|^\s*[-•*]|:\s*$/.test(x.titre)) x.titre = x.groupe.titre;
  // (Sinon « Grille par degrés (tableau 3) » → « Grille d'évaluation », numérotée s'il y en a plusieurs.)
  const generiques = candidats.filter(x => /^Grille par degrés \(tableau \d+\)$/.test(x.titre));
  generiques.forEach((x, k) => { x.titre = 'Grille d’évaluation' + (generiques.length > 1 ? ` ${k + 1}` : ''); });
  for (const x of candidats) if (x.autreVersion && !/autre version/.test(x.titre)) x.titre += ' (autre version)';
  // (Titre du barème : le nom du fichier en dernier recours, après celui de la première évaluation lue.)
  // (Sans titre dans le document, le nom du fichier s'il nomme l'APSA ou la classe : « Evaluation Boxe Française - 4ème.docx »
  // → « Boxe Française - 4ème » ; sinon le nom de la première évaluation lue.)
  const titreFichier = nomFichier.replace(/\.[^.]+$/, '').replace(/_+/g, ' ').replace(/[^\p{L}\p{N}\s'’()–-]/gu, ' ')
    .replace(/^\s*(rubrique|eval(uation)?|bar[eè]me|grille)s?(\s+(adapt[ée]e|d.?\s*[ée]valuation))?\s*[-–:]?\s*/i, '').replace(/\s+/g, ' ').trim();
  const fichierParlant = titreFichier.length >= 4 && (apsas.some(a => compte(a, saImp(titreFichier))) || niveauDuTexte(titreFichier));
  // (Titre trouvé sans y lire l'APSA, « Barème Multibonds » dans un triathlon : le nom du fichier, s'il est parlant, passe avant.)
  // (Plusieurs évaluations : le nom de la première, chacune gardant le sien si l'enseignant les sépare.)
  const titreAvecApsa = titreBrut && apsaLue && compte(apsaLue, saImp(titreBrut));
  if (!titreAvecApsa) {
    if (groupes.length > 1) titre = groupes[0].titre;
    else if (fichierParlant) titre = nomPropre(titreFichier).replace(/^[-–\s]+|[-–\s]+$/g, '');
    else if (!titreBrut && groupes[0]) titre = groupes[0].titre;
  }
  return { titre: titre.slice(0, 120), apsa, niveau, candidats, alertes, groupes: groupes.length > 1 ? groupes : [], texteLu: tout.slice(0, 6000) };
}

/* ---------- 4. Candidat → bloc du barème ---------- */

function blocDuCandidat(x, pas) {
  if (x.type === 'perf') {
    const lignes = x.lignes.map(l => {
      const r = { pts: l.pts };
      for (const c of ['f', 'g', 'v']) if (x.cles.includes(c)) { const v = perfLue(x.unite, l.brut[c] ?? '', x.minSec); r[c] = v === null ? null : v; }
      return r;
    });
    const sexes = x.cles.includes('f') || x.cles.includes('g');
    // (Mixte « v » avec une colonne filles ou garçons : rangé dans les deux.)
    if (sexes && x.cles.includes('v')) for (const l of lignes) { l.f ??= l.v; l.g ??= l.v; delete l.v; }
    const cles = sexes ? ['f', 'g'] : ['v'];
    const ancres = Object.fromEntries(cles.map(c => {
      const avec = lignes.filter(l => Number.isFinite(l[c]));
      return [c, avec.length ? [avec.at(-1)[c], avec[0][c]] : [null, null]];
    }));
    const points = Math.max(...lignes.map(l => l.pts));
    return { type: 'perf', titre: x.titre, points, unite: x.unite, sexes, ancres, lignes: lignes.map(l => Object.fromEntries(['pts', ...cles].map(c => [c, l[c] ?? null]))) };
  }
  if (x.type === 'degres') return { type: 'degres', titre: x.titre, criteres: x.criteres.map(c => ({ nom: c.nom, points: c.points, cases: [...c.cases], ...(c.ptsDegres ? { ptsDegres: [...c.ptsDegres] } : {}) })) };
  if (x.type === 'ecart' || x.type === 'criteres') return { type: x.type, titre: x.titre, lignes: x.lignes.map(l => ({ ...l })) };
  return { type: 'texte', titre: x.titre, texte: x.texte };
}

/* ---------- 5. Vérification par l'enseignant, puis « Mes barèmes » ---------- */

async function verifierImport(fichier, a) {
  const cand = a.candidats;
  const reconnus = cand.filter(x => x.type !== 'texte').length;
  // Plusieurs évaluations dans le document : un barème chacune (case cochée), titre / APSA / niveau de chaque évaluation.
  const plusieurs = (a.groupes || []).length > 1;
  let separer = plusieurs;
  const { d, resultat } = ouvrirModale(`📥 ${fichier.name}`, `
    <p class="aide">${reconnus ? `L’appli a reconnu <b>${reconnus} bloc${reconnus > 1 ? 's' : ''}</b> de barème. Vérifie-les, décoche ce qui ne convient pas :
      tout reste modifiable ensuite dans le barème (onglet Barèmes › Mes barèmes).`
    : 'L’appli n’a pas reconnu de tableau de barème dans ce document. Tu peux quand même créer le barème avec son texte, puis ajouter les blocs à la main.'}</p>
    ${(a.alertes || []).map(t => `<p class="aide alerte-import">⚠ ${esc(t)}</p>`).join('')}
    ${plusieurs ? `<label class="case separer-import"><input type="checkbox" data-imp-separer checked>
      <span>Ce document contient <b>${a.groupes.length} évaluations</b> (${esc(a.groupes.map(g => g.titre).join(', '))}) : créer un barème pour chacune</span></label>` : ''}
    <div class="ligne ligne-unique">
      <label class="large">Titre<input name="titre" value="${esc(a.titre)}" maxlength="120" required></label>
    </div>
    <div class="ligne ligne-unique">
      <label>APSA<input name="apsa" list="liste-apsa-import" value="${esc(a.apsa)}" maxlength="60"></label>
      <datalist id="liste-apsa-import">${APSA_BAREMES.map(x => `<option value="${esc(x)}">`).join('')}</datalist>
      <label>Niveau<select name="niveau">${Object.entries(NIVEAUX_BAREME).map(([k, n]) => `<option value="${k}" ${k === a.niveau ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    </div>
    <div class="blocs-import"></div>
    <p class="total-import"></p>
    <details class="texte-lu"><summary>Texte lu dans le document</summary><pre>${esc(a.texteLu)}</pre></details>`,
  boutonsModale('Ajouter à mes barèmes'), 'modale-large');
  const zone = $('.blocs-import', d);
  // Les titres tapés sont relus avant chaque nouveau dessin (on ne redessine que sur les listes et cases).
  const relireTitres = () => zone.querySelectorAll('[data-imp-titre]').forEach(i => { cand[+i.dataset.impTitre].titre = i.value; });
  const dessiner = () => {
    zone.innerHTML = cand.map((x, k) => {
      const b = blocDuCandidat(x, 0.5), [icone, nomType] = TYPES_BLOCS[b.type];
      const [entete, ...lignes] = lignesBloc(b, 0.5);
      const apercu = b.type === 'texte' ? `<p class="aide apercu-texte">${esc(b.texte.slice(0, 300))}${b.texte.length > 300 ? '…' : ''}</p>`
        : `<div class="table-defile"><table class="table-bareme apercu-import"><thead><tr>${entete.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead>
          <tbody>${lignes.slice(0, 6).map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
          ${lignes.length > 6 ? `<p class="aide">… et ${lignes.length - 6} autre${lignes.length - 6 > 1 ? 's' : ''} ligne${lignes.length - 6 > 1 ? 's' : ''}.</p>` : ''}`;
      const illisibles = b.type === 'perf' ? b.lignes.flatMap(l => Object.entries(l).filter(([c, v]) => c !== 'pts' && v === null)).length : 0;
      return `<section class="bloc-import${x.garder ? '' : ' ecarte'}">
        <div class="tete-bloc">
          <label class="case"><input type="checkbox" data-imp-garder="${k}" ${x.garder ? 'checked' : ''} aria-label="Garder ce bloc"></label>
          <span class="type-bloc" title="${esc(nomType)}">${icone}</span>
          <input class="titre-bloc" data-imp-titre="${k}" value="${esc(x.titre)}" maxlength="120" aria-label="Titre du bloc">
          ${b.type === 'texte' ? '' : `<span class="pts-bloc">${fmt(pointsBloc(b))} pts</span>`}
        </div>
        ${plusieurs && x.groupe ? `<p class="aide groupe-import">📄 ${esc(x.groupe.titre)}</p>` : ''}
        <div class="ligne reglage-import">
          ${x.type === 'ecart' || x.type === 'criteres' ? `<label>Sorte<select data-imp-type="${k}">
            <option value="ecart" ${x.type === 'ecart' ? 'selected' : ''}>📏 Paliers : une seule ligne s’applique</option>
            <option value="criteres" ${x.type === 'criteres' ? 'selected' : ''}>☑️ Critères : chaque ligne remplie compte</option></select></label>` : ''}
          ${x.type === 'perf' ? `<label>Mesure<select data-imp-unite="${k}">${Object.entries(UNITES_PERF).map(([u, n]) => `<option value="${u}" ${x.unite === u ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
            <span class="aide">${b.sexes ? 'Filles / garçons séparés' : 'Même tableau pour tous'}${x.supposes ? ' (colonnes supposées : filles, puis garçons — vérifie)' : ''}</span>` : ''}
        </div>
        ${illisibles ? `<p class="aide alerte-import">⚠ ${illisibles} case${illisibles > 1 ? 's' : ''} illisible${illisibles > 1 ? 's' : ''} avec cette mesure : vérifie la mesure, ou corrige ces cases ensuite.</p>` : ''}
        ${apercu}
      </section>`;
    }).join('');
    const totalDe = l => fmt(Math.round(l.filter(x => x.garder).reduce((s, x) => s + pointsBloc(blocDuCandidat(x, 0.5)), 0) * 100) / 100);
    $('.total-import', d).innerHTML = separer
      ? 'Total de chaque barème : ' + a.groupes.map(g => `${esc(g.titre)} <b>${totalDe(cand.filter(x => x.groupe?.cle === g.cle))} pts</b>`).join(' · ')
      : `Total des blocs gardés : <b>${totalDe(cand)} points</b>`;
  };
  d.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.impSeparer !== undefined) {
      // (Un barème par évaluation : le titre, l'APSA et le niveau viennent de chaque évaluation.)
      separer = t.checked;
      montrerChampsUniques();
      relireTitres(); dessiner();
    } else if (t.dataset.impGarder !== undefined) { relireTitres(); cand[+t.dataset.impGarder].garder = t.checked; dessiner(); }
    else if (t.dataset.impType !== undefined) { relireTitres(); cand[+t.dataset.impType].type = t.value; dessiner(); }
    else if (t.dataset.impUnite !== undefined) { relireTitres(); cand[+t.dataset.impUnite].unite = t.value; dessiner(); }
  });
  // (Titre, APSA, niveau du barème unique : cachés quand chaque évaluation devient un barème.)
  const montrerChampsUniques = () => d.querySelectorAll('.ligne-unique').forEach(x => {
    x.hidden = separer;
    x.querySelectorAll('input, select').forEach(c => { c.disabled = separer; });
  });
  montrerChampsUniques();
  dessiner();
  const r = await resultat;
  if (r.action !== 'ok') return;
  relireTitres();
  const creer = (gardes, titre, apsa, niveau) => {
    const br = preparerBareme({ titre, apsa, niveau, pas: 0.5,
      blocs: (gardes.length ? gardes : cand.filter(x => x.type === 'texte').slice(0, 1)).map(x => blocDuCandidat(x, 0.5)) });
    // (Tableau de performance en points entiers, et aucun demi-point ailleurs : le barème compte de point en point.)
    const valeurs = br.blocs.flatMap(b => [...(b.lignes || []).map(l => l.pts), ...(b.criteres || []).map(c => c.points)]);
    if (br.blocs.some(b => b.type === 'perf') && valeurs.every(Number.isInteger)) br.pas = 1;
    return Donnees.ecrire('baremes', { ...br, id: Donnees.nouvelId(), cree: Date.now() });
  };
  if (separer) {
    // (Blocs sans évaluation, comme la compétence attendue lue à part : dans chaque barème.)
    const communs = cand.filter(x => x.garder && !x.groupe);
    const crees = a.groupes.map(g => {
      const blocs = cand.filter(x => x.garder && x.groupe?.cle === g.cle);
      return blocs.length ? creer([...blocs, ...communs], g.titre, APSA_BAREMES.includes(g.apsa) ? g.apsa : a.apsa, g.niveau || a.niveau) : null;
    }).filter(Boolean);
    baremeOuvert = crees[0]?.id ?? null;
    toast(`${crees.length} barème${crees.length > 1 ? 's' : ''} ajouté${crees.length > 1 ? 's' : ''} à Mes barèmes ✔`, 'ok');
  } else {
    const enreg = creer(cand.filter(x => x.garder), r.data.titre.trim() || a.titre, r.data.apsa.trim(), r.data.niveau);
    baremeOuvert = enreg.id;
    toast(`Barème « ${enreg.titre} » ajouté à Mes barèmes ✔`, 'ok');
  }
  rendreVue();
}

// Bouton « 📥 Importer un barème » : PDF, Word, LibreOffice, Excel… ou fichier .json d'un collègue.
async function importerDocumentBareme(fichier) {
  if (fichier.size > 15e6) throw new Error('Fichier trop gros (15 Mo au plus).');
  if (/\.json$/i.test(fichier.name)) return recevoirFichierBareme(fichier);
  const elements = await lireDocumentBareme(fichier);
  return verifierImport(fichier, analyserBareme(elements, fichier.name));
}

function choisirDocumentBareme() {
  const input = Object.assign(document.createElement('input'), { type: 'file', accept: '.pdf,.docx,.odt,.xlsx,.doc,.xls,.json,application/pdf,application/json' });
  input.addEventListener('change', () => { const f = input.files[0]; if (f) lancer(() => importerDocumentBareme(f)); });
  input.click();
}
