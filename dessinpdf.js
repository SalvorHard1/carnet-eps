/* ---------- Pages dessinées, en PDF ou en SVG, sans bibliothèque (dessinpdf.js) ----------
   On dessine une seule fois (rectangles, cercles, arcs, traits, textes en Helvetica), puis :
   - versPdf() : (promesse) un vrai fichier PDF (Uint8Array), texte et graphiques en vectoriel, flux compressés ;
   - versSvg(n) : la même page en SVG, pour l'aperçu à l'écran et l'impression.
   Coordonnées en points (1/72 de pouce), origine en haut à gauche ; un texte est placé sur sa ligne de base.
   Polices : Helvetica et Helvetica gras, intégrées à tous les lecteurs PDF (codage Windows-1252 : accents français). */

const PAGE_A4_PAYSAGE = { l: 842, h: 595 };

// Largeurs des caractères 32 à 126 (millièmes de la taille), métriques Adobe d'Helvetica.
const LARGEURS_HELVETICA = {
  normal: [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556,
    278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611,
    722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
    556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584],
  gras: [278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556,
    333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611,
    722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
    611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584],
};
// Quelques signes hors ASCII : [normal, gras].
const LARGEURS_SIGNES = { '’': [222, 278], '‘': [222, 278], '«': [556, 556], '»': [556, 556], '–': [556, 556], '—': [1000, 1000], '…': [1000, 1000],
  '·': [278, 278], 'œ': [944, 944], 'Œ': [1000, 1000], '°': [400, 400], '€': [556, 556], ' ': [278, 278], '•': [350, 350], '“': [333, 500], '”': [333, 500] };
// Windows-1252 : ce qui n'est pas dans Latin-1.
const CP1252 = { '€': 0x80, '‚': 0x82, '„': 0x84, '…': 0x85, 'Œ': 0x8c, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '™': 0x99, 'œ': 0x9c };

function largeurCaractere(ch, gras) {
  const k = gras ? 1 : 0;
  if (LARGEURS_SIGNES[ch]) return LARGEURS_SIGNES[ch][k];
  const base = ch.normalize('NFD')[0], code = base.charCodeAt(0); // é → e, À → A…
  if (code >= 32 && code <= 126) return LARGEURS_HELVETICA[gras ? 'gras' : 'normal'][code - 32];
  return 556;
}
const octetCp1252 = ch => {
  if (ch === ' ' || ch === ' ') return 0xa0; // espaces fines → insécable
  const c = ch.charCodeAt(0);
  if (CP1252[ch]) return CP1252[ch];
  return (c >= 32 && c <= 126) || (c >= 0xa0 && c <= 0xff) ? c : 0x3f; // sinon « ? »
};

function DessinPdf({ l = PAGE_A4_PAYSAGE.l, h = PAGE_A4_PAYSAGE.h, titre = '' } = {}) {
  const pages = [];
  let page = null;
  const nouvellePage = () => { page = []; pages.push(page); };
  nouvellePage();

  // Formes, en chemins : ['M', x, y], ['L', x, y], ['C', x1, y1, x2, y2, x, y], ['Z'].
  const cheminRect = (x, y, w, ht, r = 0) => {
    r = Math.min(r, w / 2, ht / 2);
    if (!r) return [['M', x, y], ['L', x + w, y], ['L', x + w, y + ht], ['L', x, y + ht], ['Z']];
    const k = r * 0.5523;
    return [['M', x + r, y], ['L', x + w - r, y], ['C', x + w - r + k, y, x + w, y + r - k, x + w, y + r], ['L', x + w, y + ht - r],
      ['C', x + w, y + ht - r + k, x + w - r + k, y + ht, x + w - r, y + ht], ['L', x + r, y + ht], ['C', x + r - k, y + ht, x, y + ht - r + k, x, y + ht - r],
      ['L', x, y + r], ['C', x, y + r - k, x + r - k, y, x + r, y], ['Z']];
  };
  // Arc de cercle, angles en degrés dans le sens des aiguilles d'une montre depuis midi.
  const cheminArc = (cx, cy, r, deb, fin) => {
    const pt = a => { const t = (a - 90) * Math.PI / 180; return [cx + r * Math.cos(t), cy + r * Math.sin(t)]; };
    const res = [['M', ...pt(deb)]], n = Math.max(1, Math.ceil(Math.abs(fin - deb) / 90)), pas = (fin - deb) / n;
    for (let i = 0; i < n; i++) {
      const a0 = deb + i * pas, a1 = a0 + pas, k = 4 / 3 * Math.tan((a1 - a0) * Math.PI / 720) * r;
      const [x0, y0] = pt(a0), [x3, y3] = pt(a1), t0 = (a0 - 90) * Math.PI / 180, t1 = (a1 - 90) * Math.PI / 180;
      res.push(['C', x0 - k * Math.sin(t0), y0 + k * Math.cos(t0), x3 + k * Math.sin(t1), y3 - k * Math.cos(t1), x3, y3]);
    }
    return res;
  };
  const forme = (chemin, o = {}) => page.push({ t: 'forme', chemin, fond: o.fond, trait: o.trait, ep: o.ep ?? 1, tirets: o.tirets, bouts: o.bouts });

  const largeurTexte = (txt, taille, gras = false) => [...String(txt)].reduce((s, ch) => s + largeurCaractere(ch, gras), 0) * taille / 1000;
  // Découpe un texte en lignes qui tiennent dans la largeur.
  function couper(txt, largeur, taille, gras = false) {
    const lignes = [];
    let ligne = '';
    for (const mot of String(txt).split(/\s+/).filter(Boolean)) {
      const essai = ligne ? `${ligne} ${mot}` : mot;
      if (ligne && largeurTexte(essai, taille, gras) > largeur) { lignes.push(ligne); ligne = mot; } else ligne = essai;
    }
    if (ligne) lignes.push(ligne);
    return lignes;
  }
  // Raccourcit un texte trop long (…).
  function tenir(txt, largeur, taille, gras = false) {
    txt = String(txt);
    if (largeurTexte(txt, taille, gras) <= largeur) return txt;
    while (txt.length > 1 && largeurTexte(txt + '…', taille, gras) > largeur) txt = txt.slice(0, -1);
    return txt.trimEnd() + '…';
  }

  const d = {
    l, h, pages, nouvellePage, largeurTexte, couper, tenir,
    allerPage: n => { page = pages[n]; }, // (revenir sur une page déjà dessinée : pied de page « 1 / 3 »…)
    get numeroPage() { return pages.length; },
    rect: (x, y, w, ht, o = {}) => forme(cheminRect(x, y, w, ht, o.rayon || 0), o),
    cercle: (cx, cy, r, o = {}) => forme(cheminArc(cx, cy, r, 0, 360).concat([['Z']]), o),
    arc: (cx, cy, r, deb, fin, o = {}) => forme(cheminArc(cx, cy, r, deb, fin), o),
    ligne: (x1, y1, x2, y2, o = {}) => forme([['M', x1, y1], ['L', x2, y2]], { trait: '#000000', ...o }),
    trace: (points, o = {}) => forme(points.map(([x, y], i) => [i ? 'L' : 'M', x, y]).concat(o.ferme ? [['Z']] : []), o),
    texte: (x, y, txt, o = {}) => page.push({ t: 'texte', x, y, txt: String(txt), taille: o.taille || 10, gras: !!o.gras, couleur: o.couleur || '#000000', ancre: o.ancre || 'debut' }),
    versPdf: () => pagesVersPdf(pages, l, h, titre),
    versSvg: n => pageVersSvg(pages[n], l, h, `${titre} — page ${n + 1}`),
  };
  return d;
}

/* --- Sortie PDF --- */
const nombrePdf = n => (Math.round(n * 100) / 100).toString();
const couleurPdf = hex => { const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || '') || [0, '00', '00', '00']; return [1, 2, 3].map(i => nombrePdf(parseInt(m[i], 16) / 255)).join(' '); };
const textePdf = txt => [...txt].map(ch => { const o = octetCp1252(ch); return o === 0x28 || o === 0x29 || o === 0x5c ? '\\' + String.fromCharCode(o) : String.fromCharCode(o); }).join('');

function opsPdf(page, h, largeurTexte) {
  const y = v => nombrePdf(h - v), x = nombrePdf, o = [];
  for (const op of page) {
    if (op.t === 'forme') {
      if (!op.fond && !op.trait) continue;
      o.push('q');
      if (op.fond) o.push(`${couleurPdf(op.fond)} rg`);
      if (op.trait) o.push(`${couleurPdf(op.trait)} RG`, `${nombrePdf(op.ep)} w`, op.bouts === 'ronds' ? '1 J' : '0 J', '1 j');
      if (op.tirets) o.push(`[${op.tirets.map(nombrePdf).join(' ')}] 0 d`);
      for (const c of op.chemin) {
        if (c[0] === 'M') o.push(`${x(c[1])} ${y(c[2])} m`);
        else if (c[0] === 'L') o.push(`${x(c[1])} ${y(c[2])} l`);
        else if (c[0] === 'C') o.push(`${x(c[1])} ${y(c[2])} ${x(c[3])} ${y(c[4])} ${x(c[5])} ${y(c[6])} c`);
        else o.push('h');
      }
      o.push(op.fond && op.trait ? 'B' : op.fond ? 'f' : 'S', 'Q');
    } else {
      const w = largeurTexte(op.txt, op.taille, op.gras), dx = op.ancre === 'milieu' ? -w / 2 : op.ancre === 'fin' ? -w : 0;
      o.push(`BT /${op.gras ? 'F2' : 'F1'} ${nombrePdf(op.taille)} Tf ${couleurPdf(op.couleur)} rg ${x(op.x + dx)} ${y(op.y)} Td (${textePdf(op.txt)}) Tj ET`);
    }
  }
  return o.join('\n');
}

// Flux compressé (FlateDecode) si le navigateur sait le faire, sinon flux en clair : le PDF reste valable dans les deux cas.
const enChaineOctets = octets => { let s = ''; for (let i = 0; i < octets.length; i += 8192) s += String.fromCharCode(...octets.subarray(i, i + 8192)); return s; };
async function fluxPdf(texte) {
  if (typeof CompressionStream !== 'function') return `<< /Length ${texte.length} >>\nstream\n${texte}\nendstream`;
  const brut = new Uint8Array(texte.length);
  for (let i = 0; i < texte.length; i++) brut[i] = texte.charCodeAt(i) & 0xff;
  const compresse = enChaineOctets(new Uint8Array(await new Response(new Blob([brut]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer()));
  return `<< /Length ${compresse.length} /Filter /FlateDecode >>\nstream\n${compresse}\nendstream`;
}

async function pagesVersPdf(pages, l, h, titre) {
  const largeurTexte = (txt, taille, gras) => [...txt].reduce((s, ch) => s + largeurCaractere(ch, gras), 0) * taille / 1000;
  const objets = []; // contenus (chaînes d'octets), numérotés à partir de 1
  const ajouter = s => { objets.push(s); return objets.length; };
  ajouter('<< /Type /Catalog /Pages 2 0 R >>');
  ajouter(''); // Pages, rempli plus bas
  const f1 = ajouter('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const f2 = ajouter('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const info = ajouter(`<< /Title (${textePdf(titre)}) /Producer (Carnet EPS S-A) >>`);
  const kids = [];
  for (const p of pages) {
    const contenu = ajouter(await fluxPdf(opsPdf(p, h, largeurTexte)));
    kids.push(ajouter(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${l} ${h}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${contenu} 0 R >>`));
  }
  objets[1] = `<< /Type /Pages /Kids [${kids.map(k => `${k} 0 R`).join(' ')}] /Count ${kids.length} >>`;
  let sortie = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n';
  const positions = objets.map((contenu, i) => { const p = sortie.length; sortie += `${i + 1} 0 obj\n${contenu}\nendobj\n`; return p; });
  const xref = sortie.length;
  sortie += `xref\n0 ${objets.length + 1}\n0000000000 65535 f \n${positions.map(p => `${String(p).padStart(10, '0')} 00000 n \n`).join('')}`;
  sortie += `trailer\n<< /Size ${objets.length + 1} /Root 1 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  const octets = new Uint8Array(sortie.length);
  for (let i = 0; i < sortie.length; i++) octets[i] = sortie.charCodeAt(i) & 0xff;
  return octets;
}

/* --- Sortie SVG (aperçu, impression) --- */
const escSvg = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function pageVersSvg(page, l, h, libelle) {
  const n = v => nombrePdf(v);
  const corps = page.map(op => {
    if (op.t === 'forme') {
      if (!op.fond && !op.trait) return '';
      const dd = op.chemin.map(c => c[0] === 'Z' ? 'Z' : `${c[0]}${c.slice(1).map(n).join(' ')}`).join('');
      return `<path d="${dd}" fill="${op.fond || 'none'}"${op.trait ? ` stroke="${op.trait}" stroke-width="${n(op.ep)}" stroke-linejoin="round"${op.bouts === 'ronds' ? ' stroke-linecap="round"' : ''}${op.tirets ? ` stroke-dasharray="${op.tirets.map(n).join(' ')}"` : ''}` : ''}/>`;
    }
    return `<text x="${n(op.x)}" y="${n(op.y)}" font-size="${n(op.taille)}"${op.gras ? ' font-weight="bold"' : ''} fill="${op.couleur}"${op.ancre === 'milieu' ? ' text-anchor="middle"' : op.ancre === 'fin' ? ' text-anchor="end"' : ''}>${escSvg(op.txt)}</text>`;
  }).join('');
  return `<svg class="page-pdf" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${l} ${h}" role="img" aria-label="${escSvg(libelle)}" font-family="Helvetica, Arial, sans-serif"><rect width="${l}" height="${h}" fill="#ffffff"/>${corps}</svg>`;
}
