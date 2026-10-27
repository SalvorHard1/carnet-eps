'use strict';
// 🖼 Trombinoscope en image (PNG, JPEG, capture d'écran, PDF scanné) : une image n'a pas de texte à lire comme un PDF.
// Tout est fait ICI, sur l'appareil, sans aucune bibliothèque :
// 1. l'appli repère les photos : grands blocs « pleins », de même taille, rangés en grille ;
// 2. elle découpe le nom écrit sous chaque photo (lignes de texte, mots les plus proches du centre de la photo) ;
// 3. elle s'entraîne sur l'image : elle écrit elle-même les noms des élèves de la classe dans plusieurs polices
//    et présentations (NOM Prénom, Prénom NOM, majuscules, sur une ou deux lignes), retient celles qui ressemblent
//    le plus aux noms de l'image, puis compare chaque nom découpé à chaque élève ;
// 4. elle complète avec l'ordre alphabétique quand la grille le suit.
// L'enseignant vérifie ensuite (trombi.js). L'image n'est ni gardée ni envoyée nulle part.

const TrombiImage = (() => {
  const MAXI = 2400;        // côté le plus long de l'image analysée (px)
  const HN = 16, LN = 96;   // taille d'un nom ramené à une forme commune pour la comparaison
  const TAILLE = 220, QUALITE = 0.82; // vignette gardée (comme pour le PDF)
  const POLICES = ['Arial', 'Helvetica', 'Verdana', 'Tahoma', 'Calibri', 'Segoe UI', 'Roboto', 'Times New Roman', 'Georgia'];
  const pause = () => new Promise(r => setTimeout(r, 0)); // laisse l'écran se rafraîchir pendant les calculs

  /* ---------- Image → canvas ---------- */

  async function enCanvas(source) {
    let bmp = source;
    if (!(source instanceof HTMLCanvasElement)) {
      try { bmp = await createImageBitmap(source); } catch { throw new Error(`Image illisible (${source.name || 'image'}) : enregistre-la en PNG ou en JPEG.`); }
    }
    const r = Math.min(1, MAXI / Math.max(bmp.width, bmp.height)), cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.round(bmp.width * r)); cv.height = Math.max(1, Math.round(bmp.height * r));
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); // PNG transparent → fond blanc
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bmp, 0, 0, cv.width, cv.height);
    if (bmp !== source) bmp.close?.();
    return cv;
  }

  // Couleurs de fond : les couleurs (unies) qui couvrent une grande part de l'image (page, cadres, bandeaux).
  function fonds(px, W, H) {
    const bacs = new Map();
    let n = 0;
    for (let y = 0; y < H; y += 3) for (let x = 0; x < W; x += 3) {
      const k = (y * W + x) * 4, q = ((px[k] >> 3) << 10) | ((px[k + 1] >> 3) << 5) | (px[k + 2] >> 3);
      bacs.set(q, (bacs.get(q) || 0) + 1); n++;
    }
    const couleurs = [];
    for (const [q, c] of [...bacs].sort((a, b) => b[1] - a[1])) {
      if (c < n * 0.04 || couleurs.length >= 4) break;
      const rgb = [((q >> 10) << 3) + 4, (((q >> 5) & 31) << 3) + 4, ((q & 31) << 3) + 4];
      if (!couleurs.some(f => ecart(f, rgb) < 16)) couleurs.push(rgb);
    }
    return couleurs.length ? couleurs : [[255, 255, 255]];
  }
  const ecart = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));

  // Masque « pas du fond » : 1 pour chaque pixel qui n'a la couleur d'aucun fond.
  function masque(px, W, H, couleurs) {
    const m = new Uint8Array(W * H);
    for (let i = 0, k = 0; i < W * H; i++, k += 4) {
      let fond = false;
      for (const f of couleurs) if (Math.abs(px[k] - f[0]) <= 18 && Math.abs(px[k + 1] - f[1]) <= 18 && Math.abs(px[k + 2] - f[2]) <= 18) { fond = true; break; }
      if (!fond) m[i] = 1;
    }
    return m;
  }

  /* ---------- 1. Les photos ---------- */

  function photos(m, W, H) {
    const b = Math.max(3, Math.round(Math.max(W, H) / 200)), gw = Math.ceil(W / b), gh = Math.ceil(H / b);
    // Blocs « pleins » (une photo l'est presque partout, un texte rarement).
    const plein = new Uint8Array(gw * gh);
    for (let by = 0; by < gh; by++) for (let bx = 0; bx < gw; bx++) {
      let s = 0, t = 0;
      for (let y = by * b; y < Math.min(H, by * b + b); y++) for (let x = bx * b; x < Math.min(W, bx * b + b); x++) { s += m[y * W + x]; t++; }
      if (s >= t * 0.6) plein[by * gw + bx] = 1;
    }
    // Groupes de blocs pleins qui se touchent → boîtes.
    const vu = new Uint8Array(gw * gh), boites = [];
    for (let i = 0; i < gw * gh; i++) {
      if (!plein[i] || vu[i]) continue;
      const pile = [i];
      vu[i] = 1;
      let x0 = gw, y0 = gh, x1 = 0, y1 = 0, nb = 0;
      while (pile.length) {
        const j = pile.pop(), x = j % gw, y = (j / gw) | 0;
        nb++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy, k = ny * gw + nx;
          if (nx >= 0 && ny >= 0 && nx < gw && ny < gh && plein[k] && !vu[k]) { vu[k] = 1; pile.push(k); }
        }
      }
      const w = x1 - x0 + 1, h = y1 - y0 + 1;
      if (w < 3 || h < 3 || nb < w * h * 0.45 || h / w < 0.7 || h / w > 2.2 || w * h * b * b > W * H * 0.3) continue;
      boites.push({ x: x0 * b, y: y0 * b, w: Math.min(W - x0 * b, w * b), h: Math.min(H - y0 * b, h * b) });
    }
    if (!boites.length) return [];
    // Les photos d'un trombinoscope ont toutes la même taille : on garde le plus grand groupe de boîtes semblables.
    const semblables = a => boites.filter(c => c.w / a.w > 0.7 && c.w / a.w < 1.43 && c.h / a.h > 0.7 && c.h / a.h < 1.43);
    let groupe = [];
    for (const a of boites) { const g = semblables(a); if (g.length > groupe.length || (g.length === groupe.length && a.w * a.h > groupe[0].w * groupe[0].h)) groupe = g; }
    const ph = groupe.map(bt => ajuster(bt, m, W, H, b));
    return enGrille(ph);
  }

  // Bords précis (au pixel) : lignes et colonnes encore « pleines » à au moins 40 %.
  function ajuster(bt, m, W, H, b) {
    const ligne = (y, x0, x1) => { let s = 0; for (let x = x0; x < x1; x++) s += m[y * W + x]; return s / Math.max(1, x1 - x0); };
    const colonne = (x, y0, y1) => { let s = 0; for (let y = y0; y < y1; y++) s += m[y * W + x]; return s / Math.max(1, y1 - y0); };
    let { x, y, w, h } = bt, x1 = x + w, y1 = y + h;
    const plein = v => v >= 0.4;
    while (y > 0 && y > bt.y - b && plein(ligne(y - 1, x, x1))) y--;
    while (y < y1 - b && !plein(ligne(y, x, x1))) y++;
    while (y1 < H && y1 < bt.y + bt.h + b && plein(ligne(y1, x, x1))) y1++;
    while (y1 > y + b && !plein(ligne(y1 - 1, x, x1))) y1--;
    while (x > 0 && x > bt.x - b && plein(colonne(x - 1, y, y1))) x--;
    while (x < x1 - b && !plein(colonne(x, y, y1))) x++;
    while (x1 < W && x1 < bt.x + bt.w + b && plein(colonne(x1, y, y1))) x1++;
    while (x1 > x + b && !plein(colonne(x1 - 1, y, y1))) x1--;
    return { x, y, w: x1 - x, h: y1 - y };
  }

  // Rangées et colonnes de la grille : chaque photo prend les bords médians de sa rangée et de sa colonne
  // (une photo au fond clair, mal détourée, retrouve ainsi sa vraie place). Puis ordre de lecture.
  function enGrille(ph) {
    const med = l => { const s = [...l].sort((a, b) => a - b); return s[s.length >> 1]; };
    const W = med(ph.map(p => p.w)), H = med(ph.map(p => p.h));
    const grouper = (cle, tol) => {
      const g = [];
      for (const p of [...ph].sort((a, b) => cle(a) - cle(b))) {
        const d = g.at(-1);
        if (d && cle(p) - cle(d.at(-1)) < tol) d.push(p); else g.push([p]);
      }
      return g;
    };
    const rangees = grouper(p => p.y + p.h / 2, H * 0.5), colonnes = grouper(p => p.x + p.w / 2, W * 0.5);
    const bords = new Map(ph.map(p => [p, {}]));
    for (const r of rangees) { const y0 = med(r.map(p => p.y)), y1 = med(r.map(p => p.y + p.h)); r.forEach(p => Object.assign(bords.get(p), { y: y0, h: y1 - y0 })); }
    for (const c of colonnes) { const x0 = med(c.map(p => p.x)), x1 = med(c.map(p => p.x + p.w)); c.forEach(p => Object.assign(bords.get(p), { x: x0, w: x1 - x0 })); }
    return rangees.flatMap(r => r.sort((a, b) => a.x - b.x)).map(p => bords.get(p));
  }

  /* ---------- 2. Le nom sous (ou sur) chaque photo ---------- */

  function nomDe(p, toutes, px, W, H, dessous) {
    const meme = toutes.filter(q => q !== p && Math.min(q.y + q.h, p.y + p.h) - Math.max(q.y, p.y) > p.h / 2);
    const g = meme.filter(q => q.x + q.w <= p.x).sort((a, b) => b.x - a.x)[0], d = meme.filter(q => q.x >= p.x + p.w).sort((a, b) => a.x - b.x)[0];
    const xa = Math.max(0, Math.round(g ? (g.x + g.w + p.x) / 2 : p.x - p.w * 0.5)), xb = Math.min(W, Math.round(d ? (p.x + p.w + d.x) / 2 : p.x + p.w * 1.5));
    const autres = toutes.filter(q => q !== p && Math.min(q.x + q.w, p.x + p.w) - Math.max(q.x, p.x) > 0);
    let ya, yb;
    if (dessous) {
      ya = p.y + p.h + 1;
      yb = Math.min(H, ya + Math.round(p.h * 0.75), ...autres.filter(q => q.y >= p.y + p.h).map(q => q.y - 1));
    } else {
      yb = p.y - 1;
      ya = Math.max(0, yb - Math.round(p.h * 0.75), ...autres.filter(q => q.y + q.h <= p.y).map(q => q.y + q.h + 1));
    }
    const lw = xb - xa, lh = yb - ya;
    if (lw < 8 || lh < 6) return null;
    // Encre = écart à la couleur dominante de la zone (le texte peut être noir, gris ou bleu).
    const bacs = new Map();
    for (let y = ya; y < yb; y += 2) for (let x = xa; x < xb; x += 2) { const k = (y * W + x) * 4, q = ((px[k] >> 4) << 8) | ((px[k + 1] >> 4) << 4) | (px[k + 2] >> 4); bacs.set(q, (bacs.get(q) || 0) + 1); }
    const q = [...bacs].sort((a, b) => b[1] - a[1])[0][0];
    const fond = [((q >> 8) << 4) + 8, (((q >> 4) & 15) << 4) + 8, ((q & 15) << 4) + 8];
    const encre = new Float32Array(lw * lh);
    for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) {
      const k = ((ya + y) * W + xa + x) * 4;
      encre[y * lw + x] = Math.min(1, Math.max(0, (ecart(fond, [px[k], px[k + 1], px[k + 2]]) - 24) / 80));
    }
    const lignes = lignesTexte(encre, lw, lh, dessous);
    if (!lignes.length) return null;
    // Sur chaque ligne : les mots proches du centre de la photo (pas le nom du voisin).
    const cx = p.x + p.w / 2 - xa, morceaux = [];
    for (const l of lignes) {
      const col = new Float32Array(lw);
      for (let y = l.y0; y < l.y1; y++) for (let x = 0; x < lw; x++) col[x] += encre[y * lw + x];
      const segs = [];
      for (let x = 0; x < lw; x++) {
        if (col[x] < 0.3) continue;
        const s = segs.at(-1);
        if (s && x - s.x1 <= (l.y1 - l.y0) * 0.9) s.x1 = x + 1; else segs.push({ x0: x, x1: x + 1 });
      }
      const s = segs.filter(s => s.x1 - s.x0 >= 3).sort((a, b) => dist(a, cx) - dist(b, cx))[0];
      if (!s || dist(s, cx) > p.w * 0.35) continue;
      // Hauteur exacte de cette ligne pour ces mots seulement.
      let y0 = l.y1, y1 = l.y0;
      for (let y = l.y0; y < l.y1; y++) for (let x = s.x0; x < s.x1; x++) if (encre[y * lw + x] > 0.25) { y0 = Math.min(y0, y); y1 = Math.max(y1, y + 1); break; }
      if (y1 - y0 >= 4) morceaux.push({ x0: s.x0, x1: s.x1, y0, y1 });
    }
    if (!morceaux.length) return null;
    const forme = formeDe(morceaux.map(mc => decouper(encre, lw, mc)));
    // Image du nom découpé, pour que l'enseignant le voie en vérifiant.
    const bx0 = Math.min(...morceaux.map(mc => mc.x0)), bx1 = Math.max(...morceaux.map(mc => mc.x1));
    const by0 = Math.min(...morceaux.map(mc => mc.y0)), by1 = Math.max(...morceaux.map(mc => mc.y1));
    return { forme, lignes: morceaux.length, zone: { x: xa + bx0 - 2, y: ya + by0 - 2, w: bx1 - bx0 + 4, h: by1 - by0 + 4 } };
  }
  const dist = (s, cx) => (cx < s.x0 ? s.x0 - cx : cx > s.x1 ? cx - s.x1 : 0);

  // Lignes de texte d'une zone : bandes de rangées encrées (un accent séparé de sa lettre est recollé).
  function lignesTexte(encre, w, h, dessous) {
    const rang = new Float32Array(h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) rang[y] += encre[y * w + x];
    const bandes = [];
    for (let y = 0; y < h; y++) {
      if (rang[y] < 0.6) continue;
      const b = bandes.at(-1);
      if (b && y - b.y1 <= 1) b.y1 = y + 1; else bandes.push({ y0: y, y1: y + 1 });
    }
    // Deux lignes collées par un accent (petit texte) : coupées à la rangée la moins encrée.
    for (let i = 0; i < bandes.length; i++) {
      const b = bandes[i];
      if (b.y1 - b.y0 < 10) continue;
      let moy = 0;
      for (let y = b.y0; y < b.y1; y++) moy += rang[y];
      moy /= b.y1 - b.y0;
      let yc = -1;
      for (let y = b.y0 + 4; y < b.y1 - 4; y++) if (rang[y] < moy * 0.2 && (yc < 0 || rang[y] < rang[yc])) yc = y;
      if (yc >= 0) { bandes.splice(i, 1, { y0: b.y0, y1: yc }, { y0: yc + 1, y1: b.y1 }); i--; }
    }
    for (let i = 0; i < bandes.length - 1; i++) {
      const a = bandes[i], c = bandes[i + 1], ha = a.y1 - a.y0, hc = c.y1 - c.y0;
      if ((ha < hc * 0.5 && c.y0 - a.y1 <= hc * 0.5) || (hc < ha * 0.35 && c.y0 - a.y1 <= ha * 0.25)) { bandes.splice(i, 2, { y0: a.y0, y1: c.y1 }); i--; }
    }
    // (Une bande presque pleine d'un bord à l'autre est un bord de photo ou un trait de cadre, pas du texte.)
    const pleine = b => { for (let y = b.y0; y < b.y1; y++) if (rang[y] > w * 0.55) return true; return false; };
    const lignes = bandes.filter(b => b.y1 - b.y0 >= 4 && !pleine(b));
    if (!dessous) lignes.reverse();
    // La première ligne doit être collée à la photo, les suivantes rapprochées et de taille voisine.
    const prises = [];
    for (const l of lignes) {
      const hl = l.y1 - l.y0, prec = prises.at(-1);
      if (!prec) { if ((dessous ? l.y0 : h - l.y1) > h * 0.45) break; prises.push(l); continue; }
      const hp = prec.y1 - prec.y0, ecartL = dessous ? l.y0 - prec.y1 : prec.y0 - l.y1;
      if (ecartL > Math.max(hp, hl) * 1.3 || hl > hp * 2.2 || hl < hp * 0.45 || prises.length >= 3) break;
      prises.push(l);
    }
    return dessous ? prises : prises.reverse();
  }

  const decouper = (encre, lw, mc) => {
    const w = mc.x1 - mc.x0, h = mc.y1 - mc.y0, d = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) d[y * w + x] = encre[(mc.y0 + y) * lw + mc.x0 + x];
    return { w, h, d };
  };

  // Réduction (ou agrandissement) par moyenne des pixels couverts.
  function reduire(src, sw, sh, dw, dh) {
    const o = new Float32Array(dw * dh), fx = sw / dw, fy = sh / dh;
    for (let y = 0; y < dh; y++) {
      const y0 = Math.floor(y * fy), y1 = Math.max(y0 + 1, Math.floor((y + 1) * fy));
      for (let x = 0; x < dw; x++) {
        const x0 = Math.floor(x * fx), x1 = Math.max(x0 + 1, Math.floor((x + 1) * fx));
        let s = 0;
        for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) s += src[yy * sw + xx];
        o[y * dw + x] = s / ((y1 - y0) * (x1 - x0));
      }
    }
    return o;
  }

  // Forme commune d'un nom (une ou plusieurs lignes mises bout à bout, chacune ramenée à la hauteur HN) :
  // vecteur centré, de longueur 1, et rapport largeur / hauteur.
  function formeDe(lignes) {
    const parts = lignes.map(l => ({ w: Math.max(1, Math.round((l.w * HN) / l.h)), d: null, l }));
    const vide = HN / 2, tw = parts.reduce((s, p) => s + p.w, 0) + vide * (parts.length - 1);
    const bande = new Float32Array(tw * HN);
    let x0 = 0;
    for (const p of parts) {
      const r = reduire(p.l.d, p.l.w, p.l.h, p.w, HN);
      for (let y = 0; y < HN; y++) for (let x = 0; x < p.w; x++) bande[y * tw + x0 + x] = r[y * p.w + x];
      x0 += p.w + vide;
    }
    const v = reduire(bande, tw, HN, LN, HN), f = new Float32Array(LN * HN);
    // Léger flou : tolère une police un peu différente.
    for (let y = 0; y < HN; y++) for (let x = 0; x < LN; x++) {
      let s = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const yy = y + dy, xx = x + dx;
        if (yy >= 0 && yy < HN && xx >= 0 && xx < LN) { s += v[yy * LN + xx] * (dx || dy ? 1 : 2); n += dx || dy ? 1 : 2; }
      }
      f[y * LN + x] = s / n;
    }
    let m = 0;
    for (const a of f) m += a;
    m /= f.length;
    let n2 = 0;
    for (let i = 0; i < f.length; i++) { f[i] -= m; n2 += f[i] * f[i]; }
    n2 = Math.sqrt(n2) || 1;
    for (let i = 0; i < f.length; i++) f[i] /= n2;
    return { v: f, rapport: tw / HN };
  }

  /* ---------- 3. L'appli écrit les noms des élèves (modèles) et compare ---------- */

  let ctxModele = null;
  const contexte = () => {
    if (!ctxModele) { const cv = document.createElement('canvas'); cv.width = 1400; cv.height = 90; ctxModele = cv.getContext('2d', { willReadFrequently: true }); }
    return ctxModele;
  };

  // Polices présentes sur cet appareil (une police absente serait remplacée par la police par défaut).
  function policesDispo() {
    const ctx = contexte(), t = 'NOM Prénom Wqgy 0123', larg = f => { ctx.font = f; return ctx.measureText(t).width; };
    const mono = larg('40px monospace'), serif = larg('40px serif');
    return ['sans-serif', ...POLICES.filter(p => larg(`40px "${p}", monospace`) !== mono || larg(`40px "${p}", serif`) !== serif)];
  }

  // Une ligne de texte écrite en noir sur blanc → encre découpée au plus juste.
  function ecrire(texte, police) {
    const ctx = contexte();
    ctx.font = police;
    const w = Math.min(1400, Math.ceil(ctx.measureText(texte).width) + 12);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, 90);
    ctx.fillStyle = '#000'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(texte, 6, 62);
    const px = ctx.getImageData(0, 0, w, 90).data, encre = new Float32Array(w * 90);
    let x0 = w, x1 = 0, y0 = 90, y1 = 0;
    for (let i = 0; i < w * 90; i++) {
      const v = Math.max(0, (255 - px[i * 4] - 24) / 80);
      encre[i] = Math.min(1, v);
      if (v > 0.25) { const x = i % w, y = (i / w) | 0; x0 = Math.min(x0, x); x1 = Math.max(x1, x + 1); y0 = Math.min(y0, y); y1 = Math.max(y1, y + 1); }
    }
    if (x1 <= x0) return null;
    return decouper(encre, w, { x0, x1, y0, y1 });
  }

  // Présentations possibles d'un nom : ordre × casse.
  const majuscule = s => s.toLocaleUpperCase('fr-FR');
  const capitale = s => s.toLocaleLowerCase('fr-FR').replace(/(^|[\s'’-])(\p{L})/gu, (t, a, l) => a + majuscule(l));
  const sansAcc = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  function presentations(el) {
    const nom = (el.nom || '').trim(), prenom = (el.prenom || '').trim(), res = [];
    const noms = [['N', majuscule(nom)], ['n', sansAcc(majuscule(nom))], ['c', capitale(nom)]];
    const prenoms = [['p', capitale(prenom)], ['P', majuscule(prenom)]];
    for (const [kn, n] of noms) for (const [kp, p] of prenoms) {
      if (!prenom) { res.push({ cle: 'N-' + kn, mots: n.split(/\s+/) }); continue; }
      res.push({ cle: `NP-${kn}${kp}`, mots: [...n.split(/\s+/), ...p.split(/\s+/)] });
      res.push({ cle: `PN-${kn}${kp}`, mots: [...p.split(/\s+/), ...n.split(/\s+/)] });
    }
    const vus = new Set();
    return res.filter(r => { const k = r.mots.join(' '); if (vus.has(k + r.cle.slice(0, 2))) return false; vus.add(k + r.cle.slice(0, 2)); return true; });
  }

  // Façons de couper une suite de mots en `n` lignes (dans l'ordre).
  function coupes(mots, n) {
    if (n === 1) return [[mots.join(' ')]];
    const res = [];
    for (let i = 1; i <= mots.length - n + 1; i++) for (const reste of coupes(mots.slice(i), n - 1)) res.push([mots.slice(0, i).join(' '), ...reste]);
    return res;
  }

  const ressemblance = (a, b) => {
    let s = 0;
    for (let i = 0; i < a.v.length; i++) s += a.v[i] * b.v[i];
    return s * Math.exp(-1.6 * Math.abs(Math.log(a.rapport / b.rapport)));
  };

  /* ---------- 4. Lecture complète ---------- */

  // sources : fichiers image ou canvas (pages d'un PDF scanné). Renvoie { photos, style }.
  async function lire(sources, eleves) {
    const trouves = [];
    for (const src of sources) {
      const cv = await enCanvas(src), W = cv.width, H = cv.height;
      const ctx = cv.getContext('2d', { willReadFrequently: true }), px = ctx.getImageData(0, 0, W, H).data;
      await pause();
      const ph = photos(masque(px, W, H, fonds(px, W, H)), W, H);
      if (!ph.length) continue;
      // Le nom est normalement sous la photo ; au-dessus seulement si c'est le cas presque partout.
      let noms = ph.map(p => nomDe(p, ph, px, W, H, true));
      if (noms.filter(Boolean).length < ph.length / 2) {
        const dessus = ph.map(p => nomDe(p, ph, px, W, H, false));
        if (dessus.filter(Boolean).length > noms.filter(Boolean).length) noms = dessus;
      }
      ph.forEach((p, i) => trouves.push({ cv, p, nom: noms[i] }));
      await pause();
    }
    if (!trouves.length) throw new Error('Aucune photo trouvée dans cette image. Il faut une image nette et bien droite du trombinoscope (capture d’écran ou fichier enregistré).');

    // Modèles : chaque élève × présentation × police, sur autant de lignes que le nom découpé.
    const polices = policesDispo().flatMap(p => [`48px ${p === 'sans-serif' ? p : `"${p}"`}`, `bold 48px ${p === 'sans-serif' ? p : `"${p}"`}`]);
    const modeles = new Map(); // `${eleve}|${lignes}` → [{ style, forme }]
    const modelesDe = (el, n) => {
      const k = `${el.id}|${n}`;
      if (!modeles.has(k)) {
        const l = [];
        for (const pr of presentations(el)) for (const police of polices) for (const lignes of coupes(pr.mots, n)) {
          const parts = lignes.map(t => ecrire(t, police));
          if (parts.every(Boolean)) l.push({ style: `${police}|${pr.cle}`, police, cle: pr.cle, forme: formeDe(parts) });
        }
        modeles.set(k, l);
      }
      return modeles.get(k);
    };
    // Ressemblances détaillées : nom découpé × élève × style.
    const detail = [];
    for (const t of trouves) {
      const parEleve = new Map();
      if (t.nom) for (const el of eleves) {
        const parStyle = new Map();
        for (const m of modelesDe(el, t.nom.lignes)) parStyle.set(m.style, Math.max(parStyle.get(m.style) ?? -1, ressemblance(t.nom.forme, m.forme)));
        parEleve.set(el.id, parStyle);
      }
      detail.push(parEleve);
      await pause();
    }
    // Entraînement : les noms les mieux reconnus votent pour la police et la présentation de l'image.
    const votesPolice = new Map(), votesCle = new Map();
    for (const parEleve of detail) {
      const meilleurs = [...parEleve].map(([id, ps]) => { let best = -1, st = ''; for (const [s, v] of ps) if (v > best) { best = v; st = s; } return { id, best, st }; }).sort((a, b) => b.best - a.best);
      if (meilleurs.length && meilleurs[0].best > 0.5 && meilleurs[0].best - (meilleurs[1]?.best ?? 0) > 0.04) {
        const [police, cle] = meilleurs[0].st.split('|');
        votesPolice.set(police, (votesPolice.get(police) || 0) + 1);
        votesCle.set(cle, (votesCle.get(cle) || 0) + 1);
      }
    }
    const retenus = (votes, part) => { const l = [...votes].sort((a, b) => b[1] - a[1]); return new Set(l.filter(x => x[1] >= l[0][1] * part).map(x => x[0])); };
    const appris = votesCle.size && [...votesCle.values()].reduce((a, b) => a + b, 0) >= Math.min(3, trouves.length);
    const pol = appris ? retenus(votesPolice, 0.3) : null, cles = appris ? retenus(votesCle, 0.3) : null;
    const note = (parStyle) => {
      let best = -1, tout = -1;
      for (const [s, v] of parStyle) {
        tout = Math.max(tout, v);
        const [p, c] = s.split('|');
        if (!appris || (pol.has(p) && cles.has(c))) best = Math.max(best, v);
      }
      return appris ? Math.max(best, tout - 0.05) : tout; // un style non appris compte un peu moins
    };
    const scores = detail.map(parEleve => new Map([...parEleve].map(([id, ps]) => [id, note(ps)])));
    // Répartition : les paires les plus sûres d'abord, chaque élève au plus une fois.
    const res = trouves.map((t, i) => ({ i, t, eleve: null, sur: false, s: 0 }));
    const paires = [];
    scores.forEach((m, i) => {
      const tri = [...m.values()].sort((a, b) => b - a);
      for (const [id, s] of m) if (s >= 0.42) paires.push({ i, id, s, marge: s - (s === tri[0] ? tri[1] ?? 0 : tri[0]) });
    });
    paires.sort((a, b) => b.s - a.s);
    const pris = new Set();
    for (const { i, id, s, marge } of paires) {
      if (res[i].eleve || pris.has(id)) continue;
      res[i].eleve = id; res[i].s = s; res[i].sur = s >= 0.62 && marge >= 0.06;
      pris.add(id);
    }
    completerParOrdre(res, eleves, pris);

    // Vignettes ; une même image répétée (silhouette « pas de photo ») n'est pas une vraie photo.
    const empreintes = res.map(r => empreinte(r.t.cv, r.t.p));
    const photosOut = [];
    res.forEach((r, i) => {
      const pareilles = empreintes.filter(e => difference(e, empreintes[i]) < 4).length;
      if (pareilles >= 3) return;
      photosOut.push({ url: vignette(r.t.cv, r.t.p), nomImage: r.t.nom ? imageNom(r.t.cv, r.t.nom.zone) : '', texte: '', eleve: r.eleve, sur: r.sur });
    });
    const [kp, kc] = [appris && [...votesPolice].sort((a, b) => b[1] - a[1])[0][0], appris && [...votesCle].sort((a, b) => b[1] - a[1])[0][0]];
    return { photos: photosOut, style: appris ? { police: kp.replace(/^(bold )?48px /, '').replace(/"/g, ''), gras: /^bold/.test(kp), cle: kc } : null };
  }

  // Grille rangée par ordre alphabétique : un trou entre deux photos reconnues est comblé dans l'ordre,
  // seulement si le nombre de photos et d'élèves manquants correspond exactement (à vérifier par l'enseignant).
  function completerParOrdre(res, eleves, pris) {
    const rang = new Map([...eleves].sort(triEleves).map((el, k) => [el.id, k]));
    const surs = res.filter(r => r.eleve && r.sur);
    if (surs.length < 3) return;
    let dansOrdre = 0;
    for (let k = 1; k < surs.length; k++) if (rang.get(surs[k].eleve) > rang.get(surs[k - 1].eleve)) dansOrdre++;
    if (dansOrdre < (surs.length - 1) * 0.85) return;
    const parRang = [...eleves].sort(triEleves);
    const reperes = [{ i: -1, r: -1 }, ...surs.map(r => ({ i: r.i, r: rang.get(r.eleve) })), { i: res.length, r: eleves.length }];
    for (let k = 1; k < reperes.length; k++) {
      const a = reperes[k - 1], b = reperes[k];
      if (b.r - a.r !== b.i - a.i || b.r <= a.r) continue;
      for (let i = a.i + 1, r = a.r + 1; i < b.i; i++, r++) {
        const el = parRang[r];
        if (!res[i].eleve && !pris.has(el.id)) { res[i].eleve = el.id; pris.add(el.id); }
      }
    }
  }

  function empreinte(cv, p) {
    // (Assez fine pour ne pas confondre deux vraies photos prises sur le même fond.)
    const c = document.createElement('canvas');
    c.width = 24; c.height = 24;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(cv, p.x, p.y, p.w, p.h, 0, 0, 24, 24);
    const d = x.getImageData(0, 0, 24, 24).data, e = [];
    for (let i = 0; i < d.length; i++) if (i % 4 !== 3) e.push(d[i]);
    return e;
  }
  const difference = (a, b) => a.reduce((s, v, i) => s + Math.abs(v - b[i]), 0) / a.length;

  function vignette(cv, p) {
    const r = Math.min(1, TAILLE / Math.max(p.w, p.h)), c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(p.w * r)); c.height = Math.max(1, Math.round(p.h * r));
    const x = c.getContext('2d');
    x.imageSmoothingQuality = 'high';
    x.drawImage(cv, p.x, p.y, p.w, p.h, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', QUALITE);
  }

  function imageNom(cv, z) {
    const r = Math.min(1, 240 / z.w), c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(z.w * r)); c.height = Math.max(1, Math.round(z.h * r));
    c.getContext('2d').drawImage(cv, Math.max(0, z.x), Math.max(0, z.y), z.w, z.h, 0, 0, c.width, c.height);
    return c.toDataURL('image/png');
  }

  // Présentation apprise, en clair : « NOM Prénom », « Prénom NOM »…
  function presentationLue(cle) {
    if (!cle) return '';
    const [ordre, f] = cle.split('-'), n = f[0] === 'c' ? 'Nom' : 'NOM', p = f[1] === 'P' ? 'PRÉNOM' : 'Prénom';
    return ordre === 'PN' ? `${p} ${n}` : ordre === 'N' ? n : `${n} ${p}`;
  }

  return { lire, presentationLue };
})();
