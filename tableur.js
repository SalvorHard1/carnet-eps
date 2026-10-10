'use strict';
// Lecture et écriture de classeurs Excel (.xlsx), sans bibliothèque extérieure
// (la politique de sécurité de l'appli n'autorise que ses propres scripts).
// Un .xlsx est une archive ZIP de fichiers XML : on écrit une archive « stockée » (sans compression,
// lue par Excel, LibreOffice, Numbers…) et on lit les archives compressées grâce au navigateur (deflate).
//
//   Tableur.ecrire(feuilles) → Blob   feuille : { nom, lignes: [[cellule…]…], largeurs?, colonnesMasquees?, lignesMasquees?, figer? }
//     cellule : texte, nombre, ou { v, style: 'titre' | 'entete' | 'aide' | 'texte' }
//   Tableur.lire(fichier)   → [{ nom, lignes: [[texte…]…] }]   (toutes les valeurs en texte)

const Tableur = (() => {
  /* ---------- ZIP ---------- */

  const TABLE_CRC = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(octets) {
    let c = 0xffffffff;
    for (let i = 0; i < octets.length; i++) c = TABLE_CRC[(c ^ octets[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function zipper(fichiers) { // fichiers : [{ nom, contenu (texte) }]
    const enc = new TextEncoder();
    const d = new Date();
    const heure = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    const jour = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    const morceaux = [], central = [];
    let position = 0;
    for (const f of fichiers) {
      const nom = enc.encode(f.nom), data = enc.encode(f.contenu), crc = crc32(data);
      const local = new DataView(new ArrayBuffer(30));
      [[0, 0x04034b50, 4], [4, 20, 2], [6, 0x0800, 2], [8, 0, 2], [10, heure, 2], [12, jour, 2], [14, crc, 4],
        [18, data.length, 4], [22, data.length, 4], [26, nom.length, 2], [28, 0, 2]]
        .forEach(([o, v, n]) => (n === 4 ? local.setUint32(o, v, true) : local.setUint16(o, v, true)));
      const c = new DataView(new ArrayBuffer(46));
      [[0, 0x02014b50, 4], [4, 20, 2], [6, 20, 2], [8, 0x0800, 2], [10, 0, 2], [12, heure, 2], [14, jour, 2], [16, crc, 4],
        [20, data.length, 4], [24, data.length, 4], [28, nom.length, 2], [30, 0, 2], [32, 0, 2], [34, 0, 2], [36, 0, 2],
        [38, 0, 4], [42, position, 4]]
        .forEach(([o, v, n]) => (n === 4 ? c.setUint32(o, v, true) : c.setUint16(o, v, true)));
      morceaux.push(local, nom, data);
      central.push(c, nom);
      position += 30 + nom.length + data.length;
    }
    const tailleCentral = central.reduce((t, x) => t + x.byteLength, 0);
    const fin = new DataView(new ArrayBuffer(22));
    [[0, 0x06054b50, 4], [8, fichiers.length, 2], [10, fichiers.length, 2], [12, tailleCentral, 4], [16, position, 4]]
      .forEach(([o, v, n]) => (n === 4 ? fin.setUint32(o, v, true) : fin.setUint16(o, v, true)));
    return new Blob([...morceaux, ...central, fin], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  async function dezipper(fichier) { // → Map nom → texte
    const buf = await fichier.arrayBuffer();
    const v = new DataView(buf);
    let fin = -1;
    for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 66000); i--) {
      if (v.getUint32(i, true) === 0x06054b50) { fin = i; break; }
    }
    if (fin < 0) throw new Error('Ce fichier n’est pas un classeur Excel (.xlsx).');
    const nb = v.getUint16(fin + 10, true);
    let p = v.getUint32(fin + 16, true);
    const dec = new TextDecoder();
    const res = new Map();
    for (let k = 0; k < nb; k++) {
      if (v.getUint32(p, true) !== 0x02014b50) throw new Error('Classeur Excel abîmé.');
      const methode = v.getUint16(p + 10, true), taille = v.getUint32(p + 20, true);
      const lgNom = v.getUint16(p + 28, true), lgExtra = v.getUint16(p + 30, true), lgCom = v.getUint16(p + 32, true);
      const local = v.getUint32(p + 42, true);
      const nom = dec.decode(new Uint8Array(buf, p + 46, lgNom));
      p += 46 + lgNom + lgExtra + lgCom;
      if (!/\.(xml|rels)$/i.test(nom)) continue;
      const debut = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
      const brut = new Uint8Array(buf, debut, taille);
      if (methode === 0) res.set(nom, dec.decode(brut));
      else if (methode === 8) {
        const flux = new Blob([brut]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        res.set(nom, await new Response(flux).text());
      } else throw new Error('Classeur Excel dans un format de compression inconnu.');
    }
    return res;
  }

  /* ---------- Écriture ---------- */

  // (Caractères de contrôle interdits en XML retirés.)
  const xml = s => String(s ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const lettres = n => { let s = ''; for (n++; n; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s; return s; };
  // Styles (ordre de cellXfs ci-dessous) : la plupart des cases sont au format « Texte », pour qu'Excel
  // ne transforme pas « 3:45 » en heure ni « 03/10 » en date.
  const STYLES = { normal: 0, titre: 1, entete: 2, aide: 3, texte: 4 };

  const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="4"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="13"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><name val="Calibri"/></font><font><i/><sz val="10"/><color rgb="FF666666"/><name val="Calibri"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFD9EFE6"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="49" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyNumberFormat="1"/>
<xf numFmtId="49" fontId="2" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyNumberFormat="1"><alignment wrapText="1" vertical="top"/></xf>
<xf numFmtId="49" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyNumberFormat="1"><alignment wrapText="1" vertical="top"/></xf>
<xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

  function feuilleXml(f) {
    const masquees = new Set(f.lignesMasquees || []);
    const nbCol = Math.max(1, ...f.lignes.map(l => l.length));
    const cols = (f.largeurs || []).map((w, k) => `<col min="${k + 1}" max="${k + 1}" width="${w}" customWidth="1"${(f.colonnesMasquees || []).includes(k) ? ' hidden="1"' : ''}/>`).join('');
    const vue = f.figer ? `<sheetViews><sheetView workbookViewId="0"><pane xSplit="${f.figer[0]}" ySplit="${f.figer[1]}" topLeftCell="${lettres(f.figer[0])}${f.figer[1] + 1}" activePane="bottomRight" state="frozen"/></sheetView></sheetViews>` : '';
    const lignes = f.lignes.map((l, i) => {
      const cellules = l.map((c, k) => {
        if (c === undefined || c === null) return '';
        const { v, style = 'normal' } = typeof c === 'object' ? c : { v: c, style: f.styleParDefaut || 'normal' };
        const ref = lettres(k) + (i + 1), s = STYLES[style] ? ` s="${STYLES[style]}"` : '';
        if (v === '' || v === undefined || v === null) return `<c r="${ref}"${s}/>`;
        if (typeof v === 'number' && isFinite(v)) return `<c r="${ref}"${s}><v>${v}</v></c>`;
        return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${xml(v)}</t></is></c>`;
      }).join('');
      return `<row r="${i + 1}"${masquees.has(i) ? ' hidden="1"' : ''}>${cellules}</row>`;
    }).join('');
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${lettres(nbCol - 1)}${Math.max(1, f.lignes.length)}"/>${vue}${cols ? `<cols>${cols}</cols>` : ''}<sheetData>${lignes}</sheetData></worksheet>`;
  }

  // Noms d'onglets : 31 caractères, sans [ ] : * ? / \, tous différents.
  function nomsOnglets(noms) {
    const pris = new Set();
    return noms.map(n => {
      const base = (String(n).replace(/[[\]:*?/\\']/g, '-').trim() || 'Feuille').slice(0, 31);
      let nom = base;
      for (let k = 2; pris.has(nom.toLowerCase()); k++) nom = base.slice(0, 31 - String(k).length - 1) + '~' + k;
      pris.add(nom.toLowerCase());
      return nom;
    });
  }

  function ecrire(feuilles) {
    const noms = nomsOnglets(feuilles.map(f => f.nom));
    const fichiers = [
      { nom: '[Content_Types].xml', contenu: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${feuilles.map((f, k) => `<Override PartName="/xl/worksheets/sheet${k + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>` },
      { nom: '_rels/.rels', contenu: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
      { nom: 'xl/workbook.xml', contenu: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${noms.map((n, k) => `<sheet name="${xml(n)}" sheetId="${k + 1}" r:id="rId${k + 1}"/>`).join('')}</sheets></workbook>` },
      { nom: 'xl/_rels/workbook.xml.rels', contenu: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${feuilles.map((f, k) => `<Relationship Id="rId${k + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${k + 1}.xml"/>`).join('')}<Relationship Id="rId${feuilles.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
      { nom: 'xl/styles.xml', contenu: STYLES_XML },
      ...feuilles.map((f, k) => ({ nom: `xl/worksheets/sheet${k + 1}.xml`, contenu: feuilleXml(f) })),
    ];
    return zipper(fichiers);
  }

  /* ---------- Lecture ---------- */

  const analyser = texte => new DOMParser().parseFromString(texte, 'application/xml');
  // (On cherche les balises par leur nom local : les fichiers d'autres logiciels préfixent parfois l'espace de noms.)
  const balises = (noeud, nom) => [...noeud.getElementsByTagNameNS('*', nom)];
  const texteDe = noeud => balises(noeud, 't').map(t => t.textContent).join('');
  const colonne = ref => [...ref.replace(/\d+/g, '')].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;

  async function lire(fichier) {
    const parties = await dezipper(fichier);
    const cherche = nom => parties.get(nom) ?? parties.get(nom.replace(/^\//, ''));
    const classeur = cherche('xl/workbook.xml');
    if (!classeur) throw new Error('Ce fichier n’est pas un classeur Excel (.xlsx).');
    const liens = new Map(balises(analyser(cherche('xl/_rels/workbook.xml.rels') || '<r/>'), 'Relationship')
      .map(r => [r.getAttribute('Id'), r.getAttribute('Target')]));
    const partages = cherche('xl/sharedStrings.xml') ? balises(analyser(cherche('xl/sharedStrings.xml')), 'si').map(texteDe) : [];
    return balises(analyser(classeur), 'sheet').map(s => {
      const cible = liens.get(s.getAttribute('r:id') || s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id')) || '';
      const chemin = cible.startsWith('/') ? cible.slice(1) : 'xl/' + cible.replace(/^\.\//, '');
      const doc = cherche(chemin);
      const lignes = [];
      if (doc) {
        balises(analyser(doc), 'row').forEach((r, i) => {
          const n = (+r.getAttribute('r') || i + 1) - 1;
          const ligne = lignes[n] = [];
          balises(r, 'c').forEach((c, k) => {
            const ref = c.getAttribute('r');
            const col = ref ? colonne(ref) : k;
            const type = c.getAttribute('t');
            const v = balises(c, 'v')[0]?.textContent ?? '';
            ligne[col] = type === 's' ? partages[+v] ?? '' : type === 'inlineStr' ? texteDe(c) : type === 'b' ? (v === '1' ? 'VRAI' : 'FAUX') : type === 'e' ? '' : v;
          });
        });
      }
      for (let i = 0; i < lignes.length; i++) lignes[i] = Array.from(lignes[i] || [], x => (x ?? '').trim());
      return { nom: s.getAttribute('name'), lignes };
    });
  }

  return { ecrire, lire };
})();
