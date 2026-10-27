'use strict';
// ⭐ Espace Prof principal › 📎 Incorporer des informations : tableaux d'absences, de vie scolaire, d'infirmerie…
// (Excel .xlsx/.csv, Word .docx, PDF) lus par l'appli, sur l'appareil. Chaque élève reconnu reçoit, pour la période
// affichée, les valeurs non nulles de son tableau : elles vont dans la fiche bilan du conseil et le 🗂 Suivi ; celles qui
// atteignent le seuil choisi (ex. 4 demi-journées d'absence) font de l'élève un « élève à suivre » (alertesPP).
// Stockage : suivis id idInfosPP(élève, période), { pp: true, sources: { nom: { fichier, date, lignes: [{ l, v, n, seuil }] } } }.

const idInfosPP = (eleveId, periode) => idSuivi(eleveId, 'pp infos ' + periode);
const infosPP = (eleveId, periode) => Donnees.get('suivis', idInfosPP(eleveId, periode));

/* ---------- Lecture des fichiers → tableaux [{ nom, lignes: [[case…]] }] + paragraphes de texte ---------- */

async function lireDocumentInfosPP(f) {
  const nom = f.name.toLowerCase();
  if (/\.pdf$/.test(nom) || f.type === 'application/pdf') return lirePdfInfosPP(f);
  if (/\.docx$/.test(nom)) return lireWordInfosPP(f);
  if (/\.(doc|odt|ods)$/.test(nom)) throw new Error('Format non lu : ouvre le fichier dans Word, Excel ou LibreOffice, « Enregistrer sous » au format .docx ou .xlsx, puis importe ce nouveau fichier.');
  return { tableaux: await lireClasseurNotes(f), textes: [] }; // .xlsx, .xls « page web », .csv, .txt
}

// Word : les tableaux (cases fusionnées → cases vides à droite, comme dans Excel), les paragraphes avec tabulations
// (« DUPONT Léa ⇥ 6 ⇥ 2 ») regroupés en tableau, et les autres paragraphes gardés comme texte.
async function lireWordInfosPP(f) {
  const xml = (await Tableur.dezipper(f, 'un document Word (.docx)')).get('word/document.xml');
  if (!xml) throw new Error('Ce fichier n’est pas un document Word (.docx).');
  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const sous = (n, nom) => [...n.childNodes].filter(x => x.localName === nom);
  const texteP = p => [...p.getElementsByTagNameNS(W, '*')].map(x => (x.localName === 't' ? x.textContent : x.localName === 'tab' ? '\t' : x.localName === 'br' || x.localName === 'cr' ? ' ' : '')).join('');
  const propre = t => t.replace(/\s+/g, ' ').trim();
  const tableaux = [], textes = [];
  let tabule = null;
  const corps = doc.getElementsByTagNameNS(W, 'body')[0];
  for (const n of corps ? corps.childNodes : []) {
    if (n.localName === 'tbl') {
      tabule = null;
      tableaux.push({ nom: 'Tableau ' + (tableaux.length + 1), lignes: sous(n, 'tr').map(tr => sous(tr, 'tc').flatMap(tc => {
        const span = +(tc.getElementsByTagNameNS(W, 'gridSpan')[0]?.getAttributeNS(W, 'val') || 1);
        return [propre(sous(tc, 'p').map(texteP).join(' ')), ...Array(Math.max(0, span - 1)).fill('')];
      })) });
    } else if (n.localName === 'p') {
      const t = texteP(n);
      if (t.includes('\t') && t.trim()) {
        if (!tabule) tableaux.push(tabule = { nom: 'Texte en colonnes', lignes: [] });
        tabule.lignes.push(t.split('\t').map(propre));
      } else { tabule = null; if (propre(t)) textes.push(propre(t)); }
    }
  }
  return { tableaux, textes };
}

// PDF : morceaux de texte rangés en lignes (même hauteur) puis en colonnes (bandes verticales séparées par un blanc,
// relevées sur les lignes qui portent des chiffres) ; un en-tête plus large que sa colonne va dans la première qu'il couvre.
async function lirePdfInfosPP(f) {
  const pages = await PdfTexte.lire(await f.arrayBuffer(), { pages: 200 });
  const tableaux = [], textes = [];
  pages.forEach((p, np) => {
    const items = p.items.filter(i => !i.vertical && i.t.trim()).sort((a, b) => b.y - a.y || a.x - b.x);
    const lignes = [];
    for (const i of items) {
      const l = lignes.at(-1);
      if (l && Math.abs(l.y - i.y) < Math.max(2.5, (i.taille || 10) * 0.4)) l.items.push(i); else lignes.push({ y: i.y, items: [i] });
    }
    lignes.forEach(l => l.items.sort((a, b) => a.x - b.x));
    const chiffrees = lignes.filter(l => l.items.length >= 3 && l.items.some(i => estNombreInfosPP(i.t.trim())));
    if (chiffrees.length < 2) { textes.push(...lignes.map(l => l.items.map(i => i.t.trim()).join(' '))); return; }
    const taille = chiffrees.flatMap(l => l.items.map(i => i.taille || 10)).sort((a, b) => a - b)[0] || 10;
    const bandes = [];
    for (const [g, d] of chiffrees.flatMap(l => l.items.map(i => [i.x, Math.max(i.fin ?? i.x, i.x + 1)])).sort((a, b) => a[0] - b[0])) {
      const b = bandes.at(-1);
      if (b && g <= b[1] + taille * 0.5) b[1] = Math.max(b[1], d); else bandes.push([g, d]);
    }
    const bande = i => {
      const fin = Math.max(i.fin ?? i.x, i.x + 1), k = bandes.findIndex(([g, d]) => i.x < d && fin > g);
      if (k >= 0) return k;
      const c = (i.x + fin) / 2;
      return bandes.reduce((m, b, j) => (Math.abs((b[0] + b[1]) / 2 - c) < Math.abs((bandes[m][0] + bandes[m][1]) / 2 - c) ? j : m), 0);
    };
    tableaux.push({ nom: 'Page ' + (np + 1), lignes: lignes.map(l => {
      const cases = Array(bandes.length).fill('');
      for (const i of l.items) { const k = bande(i); cases[k] = cases[k] ? cases[k] + ' ' + i.t.trim() : i.t.trim(); }
      return cases;
    }) });
  });
  return { tableaux, textes };
}

/* ---------- Analyse : élèves, colonnes, valeurs ---------- */

const estNombreInfosPP = t => /^[-+]?\d+([.,]\d+)?(e[-+]?\d+)?\s*%?$/i.test(t);
const estVideInfosPP = t => !t || /^[-–—*.\/]+$/.test(t) || /^(n\.?c\.?|néant|aucune?)$/i.test(t);
// Colonnes d'identité (jamais reprises) : classe, nom, date de naissance, numéro national, régime…
const RE_IDENTITE_PP = /^(classes?|divisions?|groupes?|el[eè]ves?|noms?|pr[eé]noms?|n[eé]\(?e?\)?\s*le|n[eé]e?s? le|date de naissance|naissance|num[eé]ro|n°|ine\b|identifiant|r[eé]gimes?|sexe|genre|options?|mef|colonne \d+$)/;

// Seuil proposé selon le nom de la colonne (null = noté dans le bilan, sans faire de l'élève un « élève à suivre »).
function seuilDefautInfosPP(nom, texte) {
  const t = sansAccent(nom);
  if (texte) return /sanction|punition|retenue|exclu|incident|avertissement|blame|rapport|discipline|remarque|observation/.test(t) ? 1 : null;
  if (/minute|repas|cantine|internat|demi-pension|retards? internat/.test(t)) return null;
  if (/taux|%|pourcent/.test(t)) return 10;
  if (/justif/.test(t)) return /\bnon\b|injustif/.test(t) ? 2 : null;
  if (/retard/.test(t)) return 3;
  if (/infirm|soin|passage|sante/.test(t)) return 3;
  if (/sanction|punition|retenue|exclu|incident|avertissement|blame|rapport|discipline|commission|mesure/.test(t)) return 1;
  if (/abs|demi|½|1\/2|journee/.test(t)) return 4;
  return null;
}

// Nom d'une colonne d'après les lignes d'en-tête : un titre de groupe (case fusionnée « Absences » sur plusieurs
// colonnes) vaut pour les colonnes vides à sa droite, jusqu'au groupe suivant.
function nomsColonnesInfosPP(tetes, largeur) {
  const noms = Array.from({ length: largeur }, () => []);
  tetes.forEach((l, r) => {
    let courant = '';
    for (let k = 0; k < largeur; k++) {
      if (l[k]) courant = l[k];
      else if (k === 0 || tetes.slice(0, r).some(h => h[k])) courant = '';
      if (courant) noms[k].push(courant);
    }
  });
  return noms.map((parts, k) => {
    const res = [];
    for (const p of parts) {
      const prec = res.at(-1);
      if (prec && sansAccent(p).startsWith(sansAccent(prec))) res[res.length - 1] = p; // « Retards › Retards en minutes »
      else if (prec && /^(oui|non)$/i.test(p)) res[res.length - 1] = /^oui$/i.test(p) ? prec : 'Non ' + prec.toLocaleLowerCase('fr'); // « Justifiées › Non »
      else if (!prec || sansAccent(p) !== sansAccent(prec)) res.push(p);
    }
    return res.join(' · ') || `Colonne ${k + 1}`;
  });
}

// Élève d'une ligne : son nom et son prénom dans une même case, sinon dans l'ensemble des cases de texte.
function eleveDeLigneInfosPP(l, eleves) {
  for (const x of l) if (x && /\p{L}{2}/u.test(x) && x.length < 80) { const el = BulletinPdf.trouverEleve(x, eleves); if (el) return el; }
  const texte = l.filter(x => x && !estNombreInfosPP(x) && x.length < 80).join(' | ');
  return texte ? BulletinPdf.trouverEleve(texte, eleves) : null;
}

function valeurInfosPP(brut, nom) {
  const t = String(brut ?? '').trim();
  if (estVideInfosPP(t)) return null;
  if (!estNombreInfosPP(t)) return { v: t, n: null };
  let n = Number(t.replace(',', '.').replace(/\s*%$/, ''));
  const pourcent = t.endsWith('%') || /taux|%|pourcent/.test(sansAccent(nom));
  if (pourcent && !t.endsWith('%') && Math.abs(n) <= 1 && /[.,eE]/.test(t)) n *= 100; // (Excel garde 2,86 % sous la forme 0,0286)
  if (!n) return null; // 0 : rien à signaler
  return { v: pourcent ? fmtD(n) + ' %' : String(Math.round(n * 100) / 100).replace('.', ','), n };
}

// Nom proposé pour ce qui est importé, d'après les colonnes lues.
function nomSourceInfosPP(colonnes, fichier) {
  const t = sansAccent(colonnes.filter(c => !c.texte).map(c => c.nom).join(' | '));
  const sujets = [/abs|demi|journee/.test(t) && 'absences', /retard/.test(t) && 'retards', /infirm|soin|passage/.test(t) && 'infirmerie',
    /sanction|punition|retenue|exclu|incident|avertissement/.test(t) && 'sanctions'].filter(Boolean);
  if (sujets.length) return (s => s[0].toUpperCase() + s.slice(1))(sujets.length > 1 ? sujets.slice(0, -1).join(', ') + ' et ' + sujets.at(-1) : sujets[0]);
  return fichier.replace(/\.[a-z0-9]+$/i, '');
}

function analyserInfosPP(lu, eleves, fichier) {
  const colonnes = [], parNom = new Map(), valeurs = new Map(), inconnus = [], reconnus = new Set();
  const seuilsRetenus = Donnees.get('reglages', 'ppInfos')?.seuils || {}; // (seuils choisis lors d'un import précédent)
  const colonne = (nom, texte) => {
    let c = parNom.get(nom);
    if (!c) {
      const retenu = seuilsRetenus[sansAccent(nom)];
      parNom.set(nom, c = { nom, texte, garder: true, seuil: retenu !== undefined ? retenu : seuilDefautInfosPP(nom, texte), exemples: [] });
      colonnes.push(c);
    }
    return c;
  };
  const noter = (el, c, x) => {
    if (!valeurs.has(el.id)) valeurs.set(el.id, new Map());
    const m = valeurs.get(el.id), prec = m.get(c.nom);
    m.set(c.nom, prec && c.texte ? { v: prec.v + ' ' + x.v, n: null } : x);
    if (c.exemples.length < 3) c.exemples.push(x.v);
  };
  let titre = '', tetesPrec = null;
  for (const t of lu.tableaux) {
    const lignes = t.lignes.map(l => Array.from(l || [], x => String(x ?? '').replace(/\s+/g, ' ').trim()));
    const trouves = lignes.map(l => eleveDeLigneInfosPP(l, eleves));
    const premier = trouves.findIndex(Boolean);
    if (premier < 0) continue;
    const largeur = Math.max(...lignes.map(l => l.length));
    // En-têtes : lignes de mots juste au-dessus du premier élève (une ligne de totaux chiffrée est sautée,
    // une ligne d'une seule case est un titre).
    let tetes = [];
    for (let i = premier - 1; i >= 0 && tetes.length < 4; i--) {
      const pleines = lignes[i].filter(Boolean);
      if (!pleines.length) { if (tetes.length) break; continue; }
      if (pleines.filter(x => estNombreInfosPP(x) || estVideInfosPP(x)).length > pleines.length / 2) continue;
      if (pleines.length === 1) { titre ||= pleines[0]; break; }
      tetes.unshift(lignes[i]);
    }
    if (!tetes.length && tetesPrec?.largeur === largeur) tetes = tetesPrec.tetes; // (page suivante d'un PDF sans en-tête répété)
    tetesPrec = { tetes, largeur };
    const noms = nomsColonnesInfosPP(tetes, largeur);
    // Colonnes à reprendre : ni identité, ni nom de l'élève, ni toujours la même valeur (la classe).
    const donnees = lignes.slice(premier);
    const colNoms = new Set(noms.map((n, k) => k).filter(k => donnees.some((l, i) => trouves[premier + i] && l[k] && BulletinPdf.trouverEleve(l[k], [trouves[premier + i]]))));
    const utiles = noms.map((nom, k) => {
      if (RE_IDENTITE_PP.test(sansAccent(nom)) && !/abs|retard/.test(sansAccent(nom))) return false;
      const vals = donnees.filter((l, i) => trouves[premier + i]).map(l => l[k]).filter(x => !estVideInfosPP(x));
      if (!vals.length) return false;
      if (colNoms.has(k)) return false;
      if (vals.length > 2 && new Set(vals).size === 1 && !estNombreInfosPP(vals[0])) return false;
      return true;
    });
    donnees.forEach((l, i) => {
      const el = trouves[premier + i], vals = [];
      if (el) reconnus.add(el.id);
      noms.forEach((nom, k) => {
        if (!utiles[k] || el && l[k] && BulletinPdf.trouverEleve(l[k], [el])) return;
        const x = valeurInfosPP(l[k], nom);
        if (x) vals.push([nom, x]);
      });
      if (el) for (const [nom, x] of vals) noter(el, colonne(nom, x.n === null), x);
      else {
        // Ligne non reconnue : seulement si elle ressemble à un élève (des lettres, des chiffres, pas un total).
        const mots = (colNoms.size ? l.filter((x, k) => colNoms.has(k)) : l).filter(x => x &&/\p{L}{2}/u.test(x) && !estNombreInfosPP(x));
        if (vals.length && mots.length && !/total|moyenne|effectif|\d+\s*[ée]l[èe]ves|^classe/i.test(l.join(' '))) {
          for (const [nom, x] of vals) colonne(nom, x.n === null);
          inconnus.push({ texte: mots.slice(0, 2).join(' '), vals });
        }
      }
    });
  }
  // Paragraphes qui citent un élève (lettre, compte rendu) : gardés comme remarque.
  const remarque = { nom: 'Remarques', texte: true, garder: true, seuil: 1, exemples: [] };
  for (const p of lu.textes) {
    const el = BulletinPdf.trouverEleve(p, eleves);
    if (!el || p.length < (el.nom + el.prenom).length + 6) continue;
    if (!colonnes.includes(remarque)) { colonnes.push(remarque); parNom.set(remarque.nom, remarque); }
    noter(el, remarque, { v: p.slice(0, 400), n: null });
  }
  return { colonnes, valeurs, inconnus, titre, reconnus: reconnus.size, nom: nomSourceInfosPP(colonnes, fichier) };
}

/* ---------- Import ---------- */

async function importerInfosPP(f) {
  const c = classePP();
  if (!c || !f) return;
  toast('Lecture du fichier…');
  let lu;
  try { lu = await lireDocumentInfosPP(f); } catch (e) { console.warn(f.name, e); return toast(`${f.name} : ${e.message}`, 'erreur'); }
  const a = analyserInfosPP(lu, elevesDe(c.id), f.name);
  if (!a.reconnus && !a.valeurs.size) {
    return toast(`${f.name} : aucun élève de ${c.nom} reconnu (il faut le nom et le prénom de l’élève sur sa ligne).`, 'erreur');
  }
  etatPP.infosLu = { classeId: c.id, periode: periodePP(c), fichier: f.name, ...a, rattaches: {} };
  rendreVue();
}

// Lignes retenues d'un élève, avec les seuils choisis dans l'aperçu.
const lignesInfosPP = (lu, m) => lu.colonnes.filter(c => c.garder && m.has(c.nom)).map(c => ({ l: c.nom, ...m.get(c.nom), seuil: c.seuil ?? null }));
const alerteLigneInfosPP = x => x.seuil !== null && x.seuil !== undefined && (x.n !== null && x.n !== undefined ? x.n >= x.seuil : !!x.v);

function valeursAvecRattachesPP(lu) {
  const res = new Map(lu.valeurs);
  for (const [i, id] of Object.entries(lu.rattaches)) if (id && lu.inconnus[i]) res.set(id, new Map(lu.inconnus[i].vals));
  return res;
}

function validerInfosPP() {
  const lu = etatPP.infosLu, c = classePP();
  if (!lu || !c || lu.classeId !== c.id) return;
  const nom = ($('#vue [data-pp-infos-nom]')?.value || lu.nom).trim() || lu.nom;
  const valeurs = valeursAvecRattachesPP(lu), periode = lu.periode;
  let n = 0;
  for (const el of elevesDe(c.id)) {
    const prec = infosPP(el.id, periode), lignes = valeurs.has(el.id) ? lignesInfosPP(lu, valeurs.get(el.id)) : [];
    const sources = { ...(prec?.sources || {}) };
    if (lignes.length) { sources[nom] = { fichier: lu.fichier, date: aujourdhui(), lignes }; n++; }
    else if (sources[nom]) delete sources[nom]; // (nouvel import du même tableau : l'élève n'y figure plus)
    else continue;
    Donnees.ecrire('suivis', { ...(prec || {}), id: idInfosPP(el.id, periode), eleveId: el.id, apsa: 'pp infos ' + periode, pp: true, periode, sources });
  }
  // Seuils retenus pour les prochains imports (même nom de colonne).
  const reg = Donnees.get('reglages', 'ppInfos') || { id: 'ppInfos' };
  Donnees.ecrire('reglages', { ...reg, seuils: { ...(reg.seuils || {}), ...Object.fromEntries(lu.colonnes.map(c => [sansAccent(c.nom), c.seuil ?? null])) } });
  etatPP.infosLu = null;
  toast(`« ${nom} » incorporé pour ${n} élève${n > 1 ? 's' : ''} (${nomPeriodePP(periode)}).`, 'ok');
  rendreVue();
}

function supprimerSourceInfosPP(nom, periode, c) {
  for (const el of elevesDe(c.id)) {
    const d = infosPP(el.id, periode);
    if (!d?.sources?.[nom]) continue;
    const sources = { ...d.sources };
    delete sources[nom];
    if (Object.keys(sources).length) Donnees.ecrire('suivis', { ...d, sources }); else Donnees.supprimer('suivis', d.id);
  }
}

/* ---------- Ce qui en sort : alertes, fiche bilan, suivi ---------- */

// Sources d'un élève pour une période : [{ nom, fichier, date, lignes }].
const sourcesInfosPP = (eleveId, periode) => Object.entries(infosPP(eleveId, periode)?.sources || {}).map(([nom, s]) => ({ nom, ...s }));

// Valeurs regroupées par titre de groupe : « Absences : Nb Abs 6, Total ½ journées 8 ».
function texteGroupesInfosPP(lignes) {
  const groupes = new Map();
  for (const x of lignes) {
    const [g, ...reste] = x.l.split(' · ');
    if (!groupes.has(g)) groupes.set(g, []);
    groupes.get(g).push(reste.length ? `${reste.join(' ')} ${x.v}` : x.v);
  }
  return [...groupes].map(([g, l]) => `${g} : ${l.join(', ')}`);
}

// Pour alertesPP : une ligne par groupe dont une valeur atteint son seuil.
function alertesInfosPP(el, periode) {
  // (Nom de la source devant, s'il ne dit pas déjà de quoi il s'agit : « Infirmerie · Passages : 5 ».)
  return sourcesInfosPP(el.id, periode).flatMap(s => texteGroupesInfosPP(s.lignes.filter(alerteLigneInfosPP))
    .map(t => `📎 ${sansAccent(s.nom).includes(sansAccent(t.split(' : ')[0])) ? '' : s.nom + ' · '}${t}`));
}

// Fiche bilan du conseil : un bloc par source (valeurs au-delà du seuil en gras).
function blocsFicheInfosPP(el, periode) {
  return sourcesInfosPP(el.id, periode).map(s => `<div class="fc-bloc fc-infos"><h2>${esc(s.nom)}</h2><ul>${s.lignes.map(x =>
    `<li${alerteLigneInfosPP(x) ? ' class="fc-alerte"' : ''}>${esc(x.l)} : <b>${esc(x.v)}</b>${alerteLigneInfosPP(x) ? ' ⚠' : ''}</li>`).join('')}</ul></div>`).join('');
}

// 🗂 Suivi : ce qui a été incorporé pour l'élève (période affichée).
function htmlSuiviInfosPP(el, periode) {
  const l = sourcesInfosPP(el.id, periode);
  return l.length ? `<ul class="pp-infos-eleve">${l.map(s => `<li><b>📎 ${esc(s.nom)}</b> <span class="aide">(${esc(nomPeriodePP(periode))})</span> : ${s.lignes.map(x =>
    `<span class="${alerteLigneInfosPP(x) ? 'pp-baisse' : ''}">${esc(x.l)} ${esc(x.v)}</span>`).join(' · ')}</li>`).join('')}</ul>` : '';
}

/* ---------- 📎 Section « Incorporer des informations » ---------- */

function htmlInfosPP(c, periode, eleves) {
  const lu = etatPP.infosLu?.classeId === c.id ? etatPP.infosLu : null;
  const sources = new Map();
  for (const el of eleves) for (const s of sourcesInfosPP(el.id, periode)) {
    if (!sources.has(s.nom)) sources.set(s.nom, { fichier: s.fichier, date: s.date, eleves: [] });
    sources.get(s.nom).eleves.push({ el, s });
  }
  return `
    <p class="aide">Dépose un tableau d’absences, de vie scolaire, d’infirmerie… exporté d’École Directe, de Pronote ou fait à la main
      (Excel, PDF ou Word). L’appli le lit sur l’appareil (rien n’est envoyé), reconnaît chaque élève par son nom et son prénom,
      et range ses chiffres avec la période <b>${esc(nomPeriodePP(periode))}</b> : ils apparaissent dans les 📄 fiches bilan du conseil
      et le 🗂 Suivi ; ceux qui atteignent le seuil choisi font de l’élève un <b>élève à suivre</b>.</p>
    <div class="outils">
      <label class="bouton primaire pp-depot">📎 Choisir un fichier (Excel, PDF, Word)<input type="file" data-pp-infos-fichier hidden
        accept=".xlsx,.xls,.csv,.txt,.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/csv"></label>
    </div>
    ${lu ? htmlApercuInfosPP(lu, eleves) : ''}
    ${sources.size ? [...sources].map(([nom, x]) => htmlSourceInfosPP(nom, x, periode)).join('')
    : lu ? '' : `<p class="aide">Rien d’incorporé pour ${esc(nomPeriodePP(periode))}.</p>`}`;
}

function htmlApercuInfosPP(lu, eleves) {
  const valeurs = valeursAvecRattachesPP(lu);
  return `<div class="carte pp-infos-apercu" data-pp-infos-apercu>
    <h3>📎 ${esc(lu.fichier)} — ${lu.reconnus} élève${lu.reconnus > 1 ? 's' : ''} reconnu${lu.reconnus > 1 ? 's' : ''}</h3>
    ${lu.titre ? `<p class="aide">Titre lu : ${esc(lu.titre)}</p>` : ''}
    <div class="ligne"><label>Nom de cette information<input type="text" data-pp-infos-nom maxlength="80" value="${esc(lu.nom)}"></label>
      <span class="aide">Période : <b>${esc(nomPeriodePP(lu.periode))}</b>. Un nouvel import sous le même nom remplace le précédent.</span></div>
    <table class="pp-table pp-infos-colonnes"><thead><tr><th>Garder</th><th>Colonne lue</th><th>Exemples</th><th>Élève à suivre dès…</th></tr></thead>
      <tbody>${lu.colonnes.map((c, i) => `<tr>
        <td><input type="checkbox" data-pp-infos-garder="${i}" ${c.garder ? 'checked' : ''} aria-label="Garder ${esc(c.nom)}"></td>
        <td>${esc(c.nom)}</td><td class="aide">${c.exemples.map(esc).join(' · ')}</td>
        <td>${c.texte ? `<label class="pp-infos-case"><input type="checkbox" data-pp-infos-signal="${i}" ${c.seuil ? 'checked' : ''}> dès qu’il y a quelque chose</label>`
    : `<input type="number" min="0" step="any" inputmode="decimal" data-pp-infos-seuil="${i}" value="${c.seuil ?? ''}" placeholder="jamais" aria-label="Seuil pour ${esc(c.nom)}">`}</td></tr>`).join('')}</tbody></table>
    <p class="aide">Seuil vide : la valeur est notée dans le bilan sans faire de l’élève un élève à suivre. Les valeurs nulles ne sont pas reprises.</p>
    ${lu.inconnus.length ? `<div class="pp-attente"><h3>⚠ Lignes non reconnues (${lu.inconnus.length})</h3>${lu.inconnus.map((x, i) => `<div class="ligne">
      <span><b>${esc(x.texte)}</b> — ${x.vals.slice(0, 4).map(([n, v]) => `${esc(n)} ${esc(v.v)}`).join(' · ')}</span>
      <select data-pp-infos-rattacher="${i}" aria-label="Élève de cette ligne"><option value="">Laisser de côté</option>
        ${eleves.map(el => `<option value="${el.id}" ${lu.rattaches[i] === el.id ? 'selected' : ''}>${esc(el.nom)} ${esc(el.prenom)}</option>`).join('')}</select></div>`).join('')}</div>` : ''}
    <p data-pp-infos-bilan>${bilanApercuInfosPP(lu, valeurs, eleves)}</p>
    <div class="outils"><button type="button" class="primaire" data-pp-infos="valider">✔ Incorporer pour ${esc(nomPeriodePP(lu.periode))}</button>
      <button type="button" data-pp-infos="annuler">Annuler</button></div>
  </div>`;
}

function bilanApercuInfosPP(lu, valeurs = valeursAvecRattachesPP(lu), eleves = elevesDe(lu.classeId)) {
  const suivre = eleves.filter(el => valeurs.has(el.id) && lignesInfosPP(lu, valeurs.get(el.id)).some(alerteLigneInfosPP));
  return `<b>${valeurs.size}</b> élève${valeurs.size > 1 ? 's' : ''} recevront ces informations ; avec ces seuils, <b>${suivre.length}</b> élève${suivre.length > 1 ? 's' : ''} à suivre${
    suivre.length ? ` : ${suivre.slice(0, 12).map(el => esc(`${el.prenom} ${el.nom}`)).join(', ')}${suivre.length > 12 ? '…' : ''}` : ''}.`;
}

function htmlSourceInfosPP(nom, x, periode) {
  const cols = [...new Set(x.eleves.flatMap(e => e.s.lignes.map(l => l.l)))];
  const suivre = x.eleves.filter(e => e.s.lignes.some(alerteLigneInfosPP)).length;
  return `<div class="carte pp-infos-source"><div class="outils"><h3>📎 ${esc(nom)}</h3>
      <span class="aide">${esc(x.fichier || '')}${x.date ? ` · importé le ${dateCourtePP(x.date)}` : ''} · ${x.eleves.length} élève${x.eleves.length > 1 ? 's' : ''}${suivre ? ` · ⚠ ${suivre} à suivre` : ''}</span>
      <span class="espace"></span>
      <button type="button" class="icone-petit" data-pp-infos="supprimer" data-arg="${esc(nom)}" title="Retirer ces informations pour ${esc(nomPeriodePP(periode))}" aria-label="Retirer ${esc(nom)}">🗑</button></div>
    <div class="pp-infos-defile"><table class="pp-table pp-tableau"><thead><tr><th>Élève</th>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead>
      <tbody>${x.eleves.map(({ el, s }) => `<tr><td>${esc(el.nom)} ${esc(el.prenom)}</td>${cols.map(c => {
    const l = s.lignes.find(y => y.l === c);
    return `<td class="${l && alerteLigneInfosPP(l) ? 'pp-n1' : ''}">${l ? esc(l.v) + (alerteLigneInfosPP(l) ? ' ⚠' : '') : ''}</td>`;
  }).join('')}</tr>`).join('')}</tbody></table></div></div>`;
}

/* ---------- Événements ---------- */

document.addEventListener('click', e => {
  if (ui.vue !== 'pp' || e.target.closest('dialog')) return;
  const b = e.target.closest('#vue button[data-pp-infos]');
  if (!b) return;
  const c = classePP();
  if (!c) return;
  const a = b.dataset.ppInfos;
  if (a === 'annuler') { etatPP.infosLu = null; return rendreVue(); }
  if (a === 'valider') return validerInfosPP();
  if (a === 'supprimer') {
    const periode = periodePP(c);
    return lancer(async () => {
      if (!(await confirmer(`Retirer « ${b.dataset.arg} » (${nomPeriodePP(periode)}) pour tous les élèves de ${c.nom} ?`, 'Retirer'))) return;
      supprimerSourceInfosPP(b.dataset.arg, periode, c);
      rendreVue();
    });
  }
});

// Réglages de l'aperçu : gardés en mémoire pendant la frappe (sans redessiner), le bilan « élèves à suivre » suit.
function majApercuInfosPP(t) {
  const lu = etatPP.infosLu;
  if (!lu) return false;
  if (t.matches('[data-pp-infos-garder]')) lu.colonnes[+t.dataset.ppInfosGarder].garder = t.checked;
  else if (t.matches('[data-pp-infos-seuil]')) lu.colonnes[+t.dataset.ppInfosSeuil].seuil = t.value === '' || isNaN(+t.value) ? null : +t.value;
  else if (t.matches('[data-pp-infos-signal]')) lu.colonnes[+t.dataset.ppInfosSignal].seuil = t.checked ? 1 : null;
  else if (t.matches('[data-pp-infos-rattacher]')) lu.rattaches[t.dataset.ppInfosRattacher] = t.value;
  else if (t.matches('[data-pp-infos-nom]')) { lu.nom = t.value; return true; }
  else return false;
  const zone = $('#vue [data-pp-infos-bilan]');
  if (zone) zone.innerHTML = bilanApercuInfosPP(lu);
  return true;
}
document.addEventListener('input', e => { if (ui.vue === 'pp' && e.target.closest?.('[data-pp-infos-apercu]')) majApercuInfosPP(e.target); });
document.addEventListener('change', e => {
  const t = e.target;
  if (ui.vue !== 'pp' || !t.closest?.('#vue')) return;
  if (t.matches('[data-pp-infos-fichier]')) { const f = t.files[0]; t.value = ''; return lancer(() => importerInfosPP(f)); }
  if (t.closest('[data-pp-infos-apercu]')) majApercuInfosPP(t);
});

// Glisser-déposer d'un fichier sur la section.
document.addEventListener('dragover', e => { if (ui.vue === 'pp' && ui.ppSection === 'infos' && e.target.closest?.('#vue')) e.preventDefault(); });
document.addEventListener('drop', e => {
  if (ui.vue !== 'pp' || ui.ppSection !== 'infos' || !e.target.closest?.('#vue')) return;
  e.preventDefault();
  const f = e.dataTransfer?.files?.[0];
  if (f) lancer(() => importerInfosPP(f));
});
