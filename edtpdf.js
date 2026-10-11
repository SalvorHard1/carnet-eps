'use strict';
// Lecture d'un emploi du temps en PDF (export École Directe, « semaine type ») — entièrement sur l'appareil.
// 1. PdfTexte : lecteur PDF minimal, sans bibliothèque. Il retrouve, page par page, les textes avec leur position
//    et les rectangles dessinés (cases de la grille). Gère les flux compressés (FlateDecode), les flux d'objets,
//    les polices avec table ToUnicode (Identity-H) ou à encodage simple, et les formulaires (XObject Form).
// 2. EdtPdf : repère la grille (jours en colonnes, heures en lignes) et en déduit les créneaux de cours.
// Rien n'est envoyé nulle part : le fichier est lu dans la mémoire du navigateur, puis oublié.

const PdfTexte = (() => {
  class Nom { constructor(n) { this.n = n; } }
  class Chaine { constructor(b) { this.b = b; } } // octets bruts (une lettre par octet)
  class Ref { constructor(n) { this.n = n; } }
  class Op { constructor(o) { this.o = o; } }

  const ESPACES = new Set([' ', '\n', '\r', '\t', '\f', '\0']);
  const DELIM = new Set(['(', ')', '<', '>', '[', ']', '{', '}', '/', '%']);

  // Lecteur de jetons sur une chaîne « binaire » (une lettre = un octet).
  function lecteur(s, pos = 0) {
    const L = { s, pos };
    L.blancs = () => {
      for (;;) {
        while (L.pos < s.length && ESPACES.has(s[L.pos])) L.pos++;
        if (s[L.pos] !== '%') return;
        while (L.pos < s.length && s[L.pos] !== '\n' && s[L.pos] !== '\r') L.pos++;
      }
    };
    L.mot = () => {
      const d = L.pos;
      while (L.pos < s.length && !ESPACES.has(s[L.pos]) && !DELIM.has(s[L.pos])) L.pos++;
      return s.slice(d, L.pos);
    };
    L.valeur = () => {
      L.blancs();
      const c = s[L.pos];
      if (c === undefined) return undefined;
      if (c === '<' && s[L.pos + 1] === '<') {
        L.pos += 2;
        const dict = {};
        for (;;) {
          L.blancs();
          if (s[L.pos] === '>' && s[L.pos + 1] === '>') { L.pos += 2; return dict; }
          if (L.pos >= s.length) return dict;
          const cle = L.valeur();
          if (!(cle instanceof Nom)) continue;
          dict[cle.n] = L.valeur();
        }
      }
      if (c === '<') {
        const fin = s.indexOf('>', L.pos);
        const hex = s.slice(L.pos + 1, fin).replace(/[^0-9a-fA-F]/g, '');
        L.pos = fin + 1;
        let b = '';
        for (let i = 0; i < hex.length; i += 2) b += String.fromCharCode(parseInt((hex[i] + (hex[i + 1] || '0')), 16));
        return new Chaine(b);
      }
      if (c === '(') {
        L.pos++;
        let b = '', prof = 1;
        while (L.pos < s.length) {
          const x = s[L.pos++];
          if (x === '\\') {
            const y = s[L.pos++];
            const echap = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', '(': '(', ')': ')', '\\': '\\' };
            if (y in echap) b += echap[y];
            else if (/[0-7]/.test(y)) {
              let o = y;
              while (o.length < 3 && /[0-7]/.test(s[L.pos])) o += s[L.pos++];
              b += String.fromCharCode(parseInt(o, 8) & 255);
            } else if (y === '\r') { if (s[L.pos] === '\n') L.pos++; } // coupure de ligne
            else if (y !== '\n') b += y;
          } else if (x === '(') { prof++; b += x; } else if (x === ')') { if (--prof === 0) break; b += x; } else b += x;
        }
        return new Chaine(b);
      }
      if (c === '[') {
        L.pos++;
        const t = [];
        for (;;) {
          L.blancs();
          if (s[L.pos] === ']') { L.pos++; return t; }
          if (L.pos >= s.length) return t;
          t.push(L.valeur());
        }
      }
      if (c === '/') {
        L.pos++;
        return new Nom(L.mot().replace(/#([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))));
      }
      if (c === ']' || c === '>' || c === ')' || c === '{' || c === '}') { L.pos++; return new Op(c); }
      const m = L.mot();
      if (!m) { L.pos++; return new Op(c); }
      if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(m)) {
        // « 12 0 R » : référence vers un autre objet
        if (/^\d+$/.test(m)) {
          const sauve = L.pos;
          const r = /^\s+(\d+)\s+R(?![^\s\/\[\]<>()%])/.exec(s.slice(L.pos, L.pos + 24));
          if (r) { L.pos += r[0].length; return new Ref(+m); }
          L.pos = sauve;
        }
        return +m;
      }
      if (m === 'true') return true;
      if (m === 'false') return false;
      if (m === 'null') return null;
      return new Op(m);
    };
    return L;
  }

  const enChaine = octets => {
    let r = '';
    for (let i = 0; i < octets.length; i += 0x8000) r += String.fromCharCode.apply(null, octets.subarray(i, i + 0x8000));
    return r;
  };
  const enOctets = s => { const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i) & 255; return u; };

  // Décompression zlib (FlateDecode) par le navigateur ; garde ce qui a pu être lu si la fin du flux est abîmée.
  async function decompresser(octets) {
    for (const format of ['deflate', 'deflate-raw']) {
      const entree = format === 'deflate' ? octets : octets.subarray(2);
      const morceaux = [];
      try {
        const lecteurFlux = new Blob([entree]).stream().pipeThrough(new DecompressionStream(format)).getReader();
        for (;;) { const { done, value } = await lecteurFlux.read(); if (done) break; morceaux.push(value); }
      } catch { /* fin de flux abîmée : on garde le début */ }
      if (morceaux.length) {
        const n = morceaux.reduce((a, m) => a + m.length, 0), r = new Uint8Array(n);
        let k = 0;
        for (const m of morceaux) { r.set(m, k); k += m.length; }
        return r;
      }
    }
    throw new Error('flux compressé illisible');
  }

  async function ouvrir(buffer) {
    const s = enChaine(new Uint8Array(buffer));
    if (!s.startsWith('%PDF')) throw new Error('Ce fichier n’est pas un PDF.');
    if (/\/Encrypt\s/.test(s)) throw new Error('Ce PDF est protégé (chiffré) : l’appli ne peut pas le lire.');

    // Index des objets : la dernière définition gagne (mises à jour incrémentales).
    const index = new Map();
    for (const m of s.matchAll(/(\d+)\s+(\d+)\s+obj\b/g)) index.set(+m[1], m.index + m[0].length);
    const cache = new Map(), dansFlux = new Map();

    function objetBrut(num) {
      if (cache.has(num)) return cache.get(num);
      let res;
      if (index.has(num)) {
        const L = lecteur(s, index.get(num));
        const v = L.valeur();
        L.blancs();
        if (s.startsWith('stream', L.pos) && v && typeof v === 'object' && !(v instanceof Array)) {
          let debut = L.pos + 6;
          if (s[debut] === '\r') debut++;
          if (s[debut] === '\n') debut++;
          // Longueur annoncée si elle tombe bien sur « endstream », sinon on cherche « endstream ».
          const lg = v.Length instanceof Ref ? resoudre(v.Length) : v.Length;
          const fin = typeof lg === 'number' && /^\s*endstream/.test(s.slice(debut + lg, debut + lg + 12)) ? debut + lg : s.indexOf('endstream', debut);
          res = { dict: v, brut: s.slice(debut, fin) };
        } else res = v;
      } else if (dansFlux.has(num)) res = dansFlux.get(num);
      cache.set(num, res);
      return res;
    }
    function resoudre(v, n = 0) {
      while (v instanceof Ref && n++ < 20) v = objetBrut(v.n);
      return v;
    }
    const estFlux = v => v && typeof v === 'object' && 'brut' in v && 'dict' in v;

    async function contenuFlux(f) {
      if (f.decode !== undefined) return f.decode;
      let filtres = resoudre(f.dict.Filter);
      filtres = filtres ? (filtres instanceof Array ? filtres : [filtres]).map(x => resoudre(x)?.n) : [];
      let octets = enOctets(f.brut);
      for (const filtre of filtres) {
        if (filtre === 'FlateDecode' || filtre === 'Fl') octets = await decompresser(octets);
        else if (filtre === 'ASCIIHexDecode' || filtre === 'AHx') octets = enOctets(lecteur('<' + enChaine(octets).replace(/>.*$/s, '') + '>').valeur().b);
        else { f.decode = null; return null; } // (images, etc. : inutiles ici)
      }
      f.decode = enChaine(octets);
      return f.decode;
    }

    // Objets rangés dans des flux d'objets (PDF récents).
    for (const [num, pos] of index) {
      if (!/\/Type\s*\/ObjStm/.test(s.slice(pos, pos + 400))) continue;
      const f = objetBrut(num);
      if (!estFlux(f)) continue;
      const contenu = await contenuFlux(f).catch(() => null);
      if (!contenu) continue;
      const L = lecteur(contenu), n = resoudre(f.dict.N), premier = resoudre(f.dict.First), paires = [];
      for (let i = 0; i < n; i++) paires.push([L.valeur(), L.valeur()]);
      for (const [no, decal] of paires) if (!index.has(no) && !dansFlux.has(no)) dansFlux.set(no, lecteur(contenu, premier + decal).valeur());
    }

    // Pages, dans l'ordre de l'arbre des pages si on le trouve.
    const pages = [];
    const visiter = (noeud, n = 0) => {
      noeud = resoudre(noeud);
      if (!noeud || n > 30) return;
      const type = resoudre(noeud.Type)?.n;
      if (type === 'Page' || (!noeud.Kids && noeud.Contents)) pages.push(noeud);
      else for (const k of resoudre(noeud.Kids) || []) visiter(k, n + 1);
    };
    const racine = (() => {
      const t = s.lastIndexOf('trailer');
      if (t >= 0) { const d = lecteur(s, t + 7).valeur(); if (d?.Root) return resoudre(d.Root); }
      for (const num of [...index.keys(), ...dansFlux.keys()]) { const o = objetBrut(num), d = estFlux(o) ? o.dict : o; if (d?.Root) return resoudre(d.Root); }
      for (const num of [...index.keys(), ...dansFlux.keys()]) { const o = objetBrut(num); if (resoudre(o?.Type)?.n === 'Catalog') return o; }
      return null;
    })();
    if (racine) visiter(racine.Pages);
    if (!pages.length) {
      for (const num of [...index.keys(), ...dansFlux.keys()].sort((a, b) => a - b)) {
        const o = objetBrut(num);
        if (o && !estFlux(o) && resoudre(o.Type)?.n === 'Page') pages.push(o);
      }
    }
    return { pages, resoudre, estFlux, contenuFlux };
  }

  /* ---------- Polices : octets → texte ---------- */

  const WIN = { 128: '€', 130: '‚', 132: '„', 133: '…', 134: '†', 139: '‹', 140: 'Œ', 145: '‘', 146: '’', 147: '“', 148: '”', 149: '•', 150: '–', 151: '—', 153: '™', 155: '›', 156: 'œ', 159: 'Ÿ' };
  const GLYPHES = {
    space: ' ', hyphen: '-', period: '.', comma: ',', colon: ':', semicolon: ';', slash: '/', parenleft: '(', parenright: ')',
    eacute: 'é', egrave: 'è', ecircumflex: 'ê', edieresis: 'ë', agrave: 'à', acircumflex: 'â', ccedilla: 'ç', icircumflex: 'î',
    idieresis: 'ï', ocircumflex: 'ô', ugrave: 'ù', ucircumflex: 'û', udieresis: 'ü', Eacute: 'É', Egrave: 'È', Agrave: 'À',
    Ccedilla: 'Ç', quoteright: '’', endash: '–', emdash: '—', oe: 'œ', OE: 'Œ', apostrophe: "'", ampersand: '&',
    zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9',
  };
  const glyphe = nom => GLYPHES[nom] || (/^uni([0-9A-F]{4})$/i.test(nom) ? String.fromCharCode(parseInt(nom.slice(3), 16))
    : /^u([0-9A-F]{4,6})$/i.test(nom) ? String.fromCodePoint(parseInt(nom.slice(1), 16)) : nom.length === 1 ? nom : '');

  async function police(doc, ref) {
    const f = doc.resoudre(ref);
    if (!f) return { octets: 1, texte: b => b, largeur: b => b.length * 0.5 };
    if (f._police) return f._police;
    const type0 = doc.resoudre(f.Subtype)?.n === 'Type0';
    let octets = type0 ? 2 : 1;
    const table = new Map();
    const tu = doc.resoudre(f.ToUnicode);
    if (doc.estFlux(tu)) {
      const cmap = (await doc.contenuFlux(tu).catch(() => null)) || '';
      const hex = h => h.replace(/[<>\s]/g, '');
      // Texte de destination : UTF-16BE (groupes de 4 chiffres hexadécimaux), ou un seul octet.
      const versTexte = h => {
        h = hex(h);
        if (h.length < 4) return h ? String.fromCharCode(parseInt(h, 16)) : '';
        let r = '';
        for (let i = 0; i + 4 <= h.length; i += 4) r += String.fromCharCode(parseInt(h.slice(i, i + 4), 16));
        return r;
      };
      const esp = /begincodespacerange([\s\S]*?)endcodespacerange/.exec(cmap);
      if (esp) { const m = /<([0-9a-fA-F]+)>/.exec(esp[1]); if (m) octets = Math.max(1, m[1].length / 2); }
      for (const bloc of cmap.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
        for (const m of bloc[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]*)>/g)) table.set(parseInt(m[1], 16), versTexte(m[2]));
      }
      for (const bloc of cmap.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
        for (const m of bloc[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*(<[0-9a-fA-F]+>|\[[^\]]*\])/g)) {
          const a = parseInt(m[1], 16), b = parseInt(m[2], 16);
          if (m[3][0] === '[') {
            [...m[3].matchAll(/<([0-9a-fA-F]+)>/g)].forEach((x, k) => table.set(a + k, versTexte(x[1])));
          } else {
            const base = hex(m[3]), dernier = parseInt(base.slice(-4), 16);
            for (let c = a; c <= b && c - a < 65536; c++) table.set(c, versTexte(base.slice(0, -4) + (dernier + c - a).toString(16).padStart(4, '0')));
          }
        }
      }
    }
    // Encodage simple avec /Differences (noms de glyphes)
    const enc = doc.resoudre(f.Encoding), diff = new Map();
    if (enc && !(enc instanceof Nom) && enc.Differences) {
      let code = 0;
      for (const x of doc.resoudre(enc.Differences)) {
        if (typeof x === 'number') code = x; else if (x instanceof Nom) diff.set(code++, glyphe(x.n));
      }
    }
    const codes = b => {
      const r = [];
      for (let i = 0; i + octets <= b.length; i += octets) {
        let code = 0;
        for (let k = 0; k < octets; k++) code = code * 256 + b.charCodeAt(i + k);
        r.push(code);
      }
      return r;
    };
    const texte = b => codes(b).map(code => table.get(code) ?? diff.get(code) ?? (octets === 1 ? WIN[code] || String.fromCharCode(code) : '')).join('');
    // Largeurs des caractères (millièmes de la taille) : pour savoir où finit un texte et recoller les morceaux d'un mot.
    const largeurs = new Map();
    let parDefaut = 500;
    if (type0) {
      const desc = doc.resoudre((doc.resoudre(f.DescendantFonts) || [])[0]) || {};
      parDefaut = doc.resoudre(desc.DW) ?? 1000;
      const w = (doc.resoudre(desc.W) || []).map(x => doc.resoudre(x));
      for (let i = 0; i < w.length;) {
        if (w[i + 1] instanceof Array) { w[i + 1].forEach((x, k) => largeurs.set(w[i] + k, doc.resoudre(x))); i += 2; }
        else { for (let c = w[i]; c <= w[i + 1] && c - w[i] < 65536; c++) largeurs.set(c, w[i + 2]); i += 3; }
      }
    } else {
      const premier = doc.resoudre(f.FirstChar) || 0;
      (doc.resoudre(f.Widths) || []).forEach((x, k) => largeurs.set(premier + k, doc.resoudre(x)));
    }
    const largeur = b => codes(b).reduce((s, c) => s + (largeurs.get(c) ?? parDefaut), 0) / 1000;
    f._police = { octets, texte, largeur };
    return f._police;
  }

  /* ---------- Contenu des pages : textes positionnés et rectangles ---------- */

  const mult = (m, n) => [m[0] * n[0] + m[1] * n[2], m[0] * n[1] + m[1] * n[3], m[2] * n[0] + m[3] * n[2], m[2] * n[1] + m[3] * n[3],
    m[4] * n[0] + m[5] * n[2] + n[4], m[4] * n[1] + m[5] * n[3] + n[5]];
  const point = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

  async function lirePage(doc, page) {
    const ressourcesDe = p => { let n = p, k = 0; while (n && k++ < 30) { const r = doc.resoudre(n.Resources); if (r) return r; n = doc.resoudre(n.Parent); } return {}; };
    const boite = (() => { let n = page, k = 0; while (n && k++ < 30) { const b = doc.resoudre(n.MediaBox); if (b) return b.map(x => doc.resoudre(x)); n = doc.resoudre(n.Parent); } return [0, 0, 595, 842]; })();
    const items = [], rects = [];
    let contenus = doc.resoudre(page.Contents);
    contenus = contenus instanceof Array ? contenus.map(c => doc.resoudre(c)) : [contenus];
    let texte = '';
    for (const c of contenus) if (doc.estFlux(c)) texte += ((await doc.contenuFlux(c).catch(() => '')) || '') + '\n';
    await interpreter(doc, texte, ressourcesDe(page), [1, 0, 0, 1, 0, 0], items, rects, 0);
    return { largeur: boite[2] - boite[0], hauteur: boite[3] - boite[1], x0: boite[0], y0: boite[1], items, rects };
  }

  async function interpreter(doc, contenu, ressources, ctmDepart, items, rects, profondeur) {
    if (profondeur > 6) return;
    const L = lecteur(contenu);
    const pile = [];
    let ctm = ctmDepart, tm = [1, 0, 0, 1, 0, 0], tlm = tm, fonte = null, taille = 10, interligne = 0;
    const args = [];
    const polices = doc.resoudre(ressources.Font) || {}, objets = doc.resoudre(ressources.XObject) || {};
    const avancer = dx => { tm = mult([1, 0, 0, 1, dx, 0], tm); };
    // Un texte est posé à la position courante, qui avance de sa largeur. S'il commence là où finit le texte
    // précédent de la même ligne (morceaux d'un mot coupé pour l'approche des lettres), on les recolle.
    const ecrire = b => {
      if (!(b instanceof Chaine)) return;
      const t = fonte ? fonte.texte(b.b) : b.b;
      const m = mult(tm, ctm), [x, y] = point(m, 0, 0), echelle = Math.hypot(m[2], m[3]) || 1;
      avancer((fonte ? fonte.largeur(b.b) : b.b.length * 0.5) * taille);
      const [fin] = point(mult(tm, ctm), 0, 0);
      if (!t) return;
      const corps = Math.abs(taille * echelle) || taille, prec = items.at(-1);
      if (prec && Math.abs(prec.y - y) < corps * 0.3 && x >= prec.x && Math.abs(x - prec.fin) < corps * 0.6) {
        prec.t += (x - prec.fin > corps * 0.2 && !prec.t.endsWith(' ') ? ' ' : '') + t;
        prec.fin = fin;
        return;
      }
      items.push({ x, y, t, taille: corps, fin });
    };
    const td = (tx, ty) => { tlm = mult([1, 0, 0, 1, tx, ty], tlm); tm = tlm; };
    for (let garde = 0; garde < 2e6; garde++) {
      const v = L.valeur();
      if (v === undefined) break;
      if (!(v instanceof Op)) { args.push(v); continue; }
      const a = args.splice(0);
      switch (v.o) {
        case 'q': pile.push(ctm); break;
        case 'Q': ctm = pile.pop() || ctm; break;
        case 'cm': if (a.length >= 6) ctm = mult(a.slice(-6), ctm); break;
        case 'BT': tm = tlm = [1, 0, 0, 1, 0, 0]; break;
        case 'ET': break;
        case 'Tf': fonte = await police(doc, polices[a[0]?.n]); taille = a[1] || taille; break;
        case 'TL': interligne = a[0] || 0; break;
        case 'Td': td(a[0] || 0, a[1] || 0); break;
        case 'TD': interligne = -(a[1] || 0); td(a[0] || 0, a[1] || 0); break;
        case 'Tm': if (a.length >= 6) tm = tlm = a.slice(-6); break;
        case 'T*': td(0, -interligne); break;
        case 'Tj': ecrire(a[0]); break;
        case "'": td(0, -interligne); ecrire(a[0]); break;
        case '"': td(0, -interligne); ecrire(a[2]); break;
        case 'TJ': {
          // (nombre = recul en millièmes de la taille ; un grand écart vaut une espace, ajoutée au recollage)
          for (const x of a[0] || []) {
            if (x instanceof Chaine) ecrire(x);
            else if (typeof x === 'number') avancer((-x / 1000) * taille);
          }
          break;
        }
        case 're': {
          if (a.length < 4) break;
          const [x, y, w, h] = a.slice(-4), p1 = point(ctm, x, y), p2 = point(ctm, x + w, y + h);
          rects.push({ x: Math.min(p1[0], p2[0]), y: Math.min(p1[1], p2[1]), w: Math.abs(p2[0] - p1[0]), h: Math.abs(p2[1] - p1[1]) });
          break;
        }
        case 'Do': {
          const o = doc.resoudre(objets[a[0]?.n]);
          if (!doc.estFlux(o) || doc.resoudre(o.dict.Subtype)?.n !== 'Form') break;
          const sous = await doc.contenuFlux(o).catch(() => null);
          if (!sous) break;
          const matrice = (doc.resoudre(o.dict.Matrix) || [1, 0, 0, 1, 0, 0]).map(x => doc.resoudre(x));
          await interpreter(doc, sous, doc.resoudre(o.dict.Resources) || ressources, mult(matrice, ctm), items, rects, profondeur + 1);
          break;
        }
        case 'BI': { const fin = contenu.indexOf('EI', L.pos); L.pos = fin < 0 ? contenu.length : fin + 2; break; }
        default: break;
      }
    }
  }

  // Toutes les pages d'un PDF : [{ largeur, hauteur, items: [{ x, y, t, taille }], rects: [{ x, y, w, h }] }]
  async function lire(buffer) {
    const doc = await ouvrir(buffer);
    const res = [];
    for (const p of doc.pages.slice(0, 10)) res.push(await lirePage(doc, p));
    return res;
  }
  return { lire };
})();

/* ---------- Emploi du temps : de la page aux créneaux ---------- */

const EdtPdf = (() => {
  const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const sansAcc = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const jourDe = t => {
    const m = /^(lun|mar|mer|jeu|ven|sam)[a-z]*\.?(?=[\s\d.,/]|$)/.exec(sansAcc(t).trim());
    return m ? ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam'].indexOf(m[1]) + 1 : 0;
  };
  // « 8h », « 08h00 », « 8:30 », « 13H05 » → minutes
  const heureSeule = t => { const m = /^(\d{1,2})\s*[hH:]\s*(\d{2})?$/.exec(t.trim()); return m && +m[1] < 24 ? +m[1] * 60 + (+m[2] || 0) : null; };
  const PLAGE = /(\d{1,2})\s*[hH:]\s*(\d{2})?\s*(?:-|–|à|a|>)\s*(\d{1,2})\s*[hH:]\s*(\d{2})?/;
  const hhmm = min => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
  const arrondi = min => Math.round(min / 5) * 5;

  // Nom de classe ramené à sa forme simple : « 5EME B », « 5e B », « 5ème-B » → « 5b ».
  const formeClasse = t => sansAcc(t).replace(/(\d)\s*(?:e|eme|em|ieme|°)(?![a-z])/g, '$1').replace(/[^a-z0-9]/g, '');

  function analyser(pages, classes) {
    const creneaux = [], notes = [];
    for (const page of pages) {
      const items = page.items.map(i => ({ ...i, t: i.t.replace(/\s+/g, ' ').trim() })).filter(i => i.t);
      // 1. Les jours (en-têtes de colonnes) : la ligne qui en contient le plus.
      const jours = items.filter(i => jourDe(i.t));
      if (jours.length < 2) continue;
      const lignes = new Map();
      for (const j of jours) { const k = Math.round(j.y / 4); lignes.set(k, [...(lignes.get(k) || []), j]); }
      const entetes = [...lignes.values()].sort((a, b) => new Set(b.map(i => jourDe(i.t))).size - new Set(a.map(i => jourDe(i.t))).size)[0]
        .sort((a, b) => a.x - b.x);
      const yEntete = Math.min(...entetes.map(i => i.y));
      // Colonnes : chaque en-tête est (en général) centré dans sa colonne ; on prend la case de la grille qui le contient,
      // sinon le milieu entre deux en-têtes voisins.
      const largeurTexte = i => i.t.length * i.taille * 0.5;
      const centres = entetes.map(i => i.x + largeurTexte(i) / 2);
      const pas = centres.length > 1 ? (centres.at(-1) - centres[0]) / (centres.length - 1) : 100;
      const colonnes = entetes.map((i, k) => {
        const r = page.rects.filter(r => r.x <= centres[k] && r.x + r.w >= centres[k] && r.w < pas * 1.3 && r.w > pas * 0.5)
          .sort((a, b) => b.h - a.h)[0];
        return { jour: jourDe(i.t), g: r ? r.x : centres[k] - pas / 2, d: r ? r.x + r.w : centres[k] + pas / 2 };
      });
      const gGrille = colonnes[0].g, dGrille = colonnes.at(-1).d;

      // 2. Les heures (à gauche de la grille) : correspondance hauteur → heure (droite des moindres carrés).
      // (le repère est centré sur la ligne de l'heure ; un repère mal lu, très loin de la droite, est écarté)
      let reperes = items.filter(i => i.x < gGrille + 2 && i.y < yEntete && heureSeule(i.t) !== null)
        .map(i => ({ y: i.y + i.taille * 0.35, min: heureSeule(i.t) }));
      const droite = rs => {
        const n = rs.length, my = rs.reduce((a, r) => a + r.y, 0) / n, mm = rs.reduce((a, r) => a + r.min, 0) / n;
        const cov = rs.reduce((a, r) => a + (r.y - my) * (r.min - mm), 0), vy = rs.reduce((a, r) => a + (r.y - my) ** 2, 0);
        return vy > 0 && cov < 0 ? y => mm + (cov / vy) * (y - my) : null;
      };
      let versMinutes = null;
      for (let tour = 0; tour < 3 && reperes.length >= 2; tour++) {
        const f = droite(reperes);
        if (!f) break;
        versMinutes = y => arrondi(f(y));
        const ecarts = reperes.map(r => Math.abs(f(r.y) - r.min)), pire = Math.max(...ecarts);
        if (pire <= 10) break;
        reperes = reperes.filter((r, k) => ecarts[k] !== pire);
      }

      // 3. Les cases de cours : rectangles de la grille qui contiennent du texte ; sinon, paquets de lignes rapprochées.
      const dansGrille = items.filter(i => i.y < yEntete - 1 && i.x >= gGrille - 2 && i.x <= dGrille && !(heureSeule(i.t) !== null && i.x < gGrille + 2));
      const colonneDe = x => colonnes.find(c => x >= c.g - 1 && x < c.d + 1);
      const blocs = [];
      const candidats = page.rects.filter(r => r.h > 6 && r.w > 10 && r.w < pas * 1.15 && r.y + r.h <= yEntete + 2 && r.x >= gGrille - 2 && r.x + r.w <= dGrille + 2);
      const pris = new Set();
      // (du plus petit au plus grand : une case gagne sur la colonne entière qui la contient)
      for (const r of candidats.sort((a, b) => a.w * a.h - b.w * b.h)) {
        const dedans = dansGrille.filter(i => !pris.has(i) && i.x >= r.x - 1 && i.x <= r.x + r.w && i.y >= r.y - 1 && i.y <= r.y + r.h);
        if (!dedans.length || r.h > (yEntete - Math.min(...dansGrille.map(i => i.y))) * 0.8) continue;
        dedans.forEach(i => pris.add(i));
        blocs.push({ col: colonneDe(r.x + r.w / 2), haut: r.y + r.h, bas: r.y, items: dedans });
      }
      // Textes hors de toute case : regroupés par colonne, en paquets de lignes proches.
      const restes = dansGrille.filter(i => !pris.has(i));
      for (const col of colonnes) {
        const t = restes.filter(i => colonneDe(i.x) === col).sort((a, b) => b.y - a.y);
        let bloc = null;
        for (const i of t) {
          if (!bloc || bloc.bas - i.y > i.taille * 2.2) { bloc = { col, haut: i.y + i.taille, bas: i.y, items: [], sansCase: true }; blocs.push(bloc); }
          bloc.items.push(i);
          bloc.bas = i.y - i.taille * 0.3;
        }
      }

      // 4. Chaque bloc devient un créneau : jour, heures (écrites dans la case, sinon d'après la grille), texte.
      for (const b of blocs) {
        if (!b.col) continue;
        const lignesTexte = [...b.items].sort((a, c) => c.y - a.y || a.x - c.x).map(i => i.t);
        const texte = lignesTexte.join(' · ');
        const plage = PLAGE.exec(texte);
        let debut = null, fin = null;
        if (plage) { debut = +plage[1] * 60 + (+plage[2] || 0); fin = +plage[3] * 60 + (+plage[4] || 0); }
        else if (versMinutes) { debut = versMinutes(b.haut); fin = b.sansCase ? debut + 55 : versMinutes(b.bas); }
        if (debut === null || !(fin > debut) || debut < 6 * 60 || fin > 21 * 60) continue;
        const forme = formeClasse(texte);
        const classe = [...classes].sort((a, c) => formeClasse(c.nom).length - formeClasse(a.nom).length)
          .find(c => formeClasse(c.nom).length >= 2 && forme.includes(formeClasse(c.nom)));
        const lieu = lignesTexte.find(l => /gymnase|gym\b|salle|piscine|stade|dojo|terrain|plateau|halle|complexe|ext[ée]rieur|cour\b/i.test(sansAcc(l))) || '';
        creneaux.push({ jour: b.col.jour, debut: hhmm(debut), fin: hhmm(fin), texte, classeId: classe?.id || '', lieu: lieu.replace(PLAGE, '').trim() });
      }
      if (!versMinutes && blocs.some(b => !PLAGE.test(b.items.map(i => i.t).join(' ')))) notes.push('Heures de la grille introuvables : seules les cases où les heures sont écrites ont été reprises.');
    }
    // Doublons (même jour, mêmes heures, même texte)
    const vus = new Set();
    const uniques = creneaux.filter(c => { const k = [c.jour, c.debut, c.fin, c.texte].join('|'); if (vus.has(k)) return false; vus.add(k); return true; })
      .sort((a, b) => a.jour - b.jour || a.debut.localeCompare(b.debut));
    return { creneaux: uniques, notes };
  }

  async function lireFichier(fichier, classes) {
    if (fichier.size > 15 * 1024 * 1024) throw new Error('Fichier trop gros pour un emploi du temps (15 Mo au plus).');
    let pages;
    try { pages = await PdfTexte.lire(await fichier.arrayBuffer()); } catch (e) {
      throw new Error(`« ${fichier.name} » n’a pas pu être lu : ${e.message || e}`);
    }
    if (!pages.some(p => p.items.length)) throw new Error('Aucun texte dans ce PDF (c’est peut-être une image scannée) : saisis les créneaux à la main.');
    const res = analyser(pages, classes);
    if (!res.creneaux.length) throw new Error('Grille de l’emploi du temps non reconnue (jours en colonnes, heures en lignes) : saisis les créneaux à la main.');
    return res;
  }

  return { lireFichier, analyser, formeClasse, JOURS };
})();
