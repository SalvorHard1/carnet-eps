'use strict';
// Échange avec Excel : les notes et les degrés de maîtrise d'une classe en classeur .xlsx (bouton « ⇅ Excel » de l'onglet Notes).
// Même principe que pour les leçons (entrainement.js) :
//   un onglet « Lisez-moi », un onglet « Synthèse » (moyennes, pour lire seulement), puis un onglet par évaluation :
//   élèves en lignes ; colonnes Note, puis un degré (1 à 4) par compétence travaillée.
//   La colonne A et une ligne masquées gardent les identifiants : un fichier réimporté met à jour ses évaluations
//   au lieu de les doubler. À l'import, rien n'est effacé : une case vide laisse la valeur du carnet telle quelle.
// (Fichier chargé avant app.js ; il se sert aussi des outils Excel d'entrainement.js : sansAccent, dateFr, lireDateExcel.)

const CODES_NOTE_EXCEL = { A: 'ABS', ABS: 'ABS', ABSENT: 'ABS', D: 'DISP', DISP: 'DISP', 'DISPENSÉ': 'DISP', DISPENSE: 'DISP', N: 'NE', NE: 'NE', NN: 'NE', 'NON NOTÉ': 'NE', 'NON NOTE': 'NE',
  B: 'BLE', BLE: 'BLE', 'BLESSÉ': 'BLE', BLESSE: 'BLE', M: 'MAL', MAL: 'MAL', MALADE: 'MAL', O: 'AUT', AUT: 'AUT', AUTRE: 'AUT', R: 'NR', NR: 'NR', 'NON RENDU': 'NR',
  // (Codes des relevés d'École Directe : « Abs », « Disp », « Inapte », « Absent excusé »…)
  'ABS.': 'ABS', 'ABSENT EXCUSÉ': 'ABS', 'ABS EXCUSÉ': 'ABS', 'DISP.': 'DISP', INAPTE: 'DISP', INAP: 'DISP', 'NON NOTÉE': 'NE' };
// Raisons de santé (dispensé, blessé, malade) : « NE » dans un classeur anonyme.
const CODES_SANTE = ['DISP', 'BLE', 'MAL'];

function exporterNotesExcel(c, { anonyme = false } = {}) {
  const evals = evalsDe(c.id);
  if (!evals.length) return toast('Aucune évaluation à exporter pour cette classe.', 'erreur');
  const T = v => ({ v, style: 'texte' }), E = v => ({ v, style: 'entete' }), A = v => ({ v, style: 'aide' });
  const anon = anonyme ? anonymisation(elevesDe(c.id)) : null; // (voir entrainement.js)
  const eleves = anon ? anon.eleves : elevesDe(c.id);
  const nomEl = el => T(anon ? anon.nom(el) : el.nom), prenomEl = el => T(anon ? '' : el.prenom || ''), idEl = el => (anon ? '' : el.id);
  // Anonyme : « DISP » (dispense, donc santé) devient « NE » (non noté).
  const noteExportee = n => (anonyme && CODES_SANTE.includes(n) ? 'NE' : n);
  const prof = anonyme ? '' : reglage('apparence').prof;
  const lisezMoi = {
    nom: 'Lisez-moi', largeurs: [100],
    lignes: [
      [{ v: `${profil().carnet} — notes de la classe ${c.nom}${prof ? ' — ' + prof : ''}${anonyme ? ' (anonyme)' : ''}`, style: 'titre' }],
      [A(`Exporté le ${dateHeure(Date.now())} · ${evals.length} évaluation${evals.length > 1 ? 's' : ''} · ${eleves.length} élèves`)],
      [],
      ...(anonyme ? [...LIGNES_ANONYME, []] : []),
      [E('Comment s’en servir')],
      ['Onglet « Synthèse » : les notes de toutes les évaluations et les moyennes (à lire seulement : il n’est pas repris à l’import).'],
      ['Puis un onglet par évaluation : une ligne par élève, la note, puis un degré de maîtrise par compétence.'],
      [`Note : un nombre (jusqu’au barème « Noté sur »), ou ${anonyme ? 'ABS, NE' : 'ABS, DISP, NE, BLE (blessé), MAL (malade), AUT (autre)'} · Degré : 1, 2, 3 ou 4.`],
      ...(anonyme ? [] : [
        ['Tu peux compléter ou corriger les cases, ajouter des élèves (nom et prénom) ou un onglet d’évaluation construit sur le même modèle.'],
        ['Ne supprime pas la colonne A ni les lignes masquées : elles permettent à l’appli de reconnaître les évaluations, les compétences et les élèves.'],
        [`Pour le reprendre : ${profil().carnet} › onglet Notes › bouton « Excel » › Importer. Une case vide ne supprime rien dans le carnet.`],
        [],
        [{ v: '⚠ Ce fichier n’est pas chiffré (contrairement au carnet sur la clé) : ne le laisse pas traîner, supprime-le après usage.', style: 'entete' }],
      ]),
      [],
      [E('Évaluations')],
      ...evals.map(e => [`${dateFr(e.date)} — ${e.titre}${e.apsa && e.apsa !== e.titre ? ' (' + e.apsa + ')' : ''} — /${fmt(e.max)}${e.coef !== 1 ? ', coef ' + fmt(e.coef) : ''}`]),
    ],
  };
  // Synthèse : une colonne par évaluation, puis les moyennes de chaque période et de l'année.
  const periodes = periodesAnnee();
  const moyennes = [...periodes.map(p => ({ titre: 'Moy. ' + p.code, evals: evals.filter(e => periodeDe(e.date) === p.id) })), { titre: 'Moy. année', evals }];
  const valeurSynthese = v => (nombre(v) !== null ? +v : noteExportee(v) || '');
  const synthese = {
    nom: 'Synthèse', largeurs: [10, 18, 16, ...evals.map(() => 12), ...moyennes.map(() => 11)], colonnesMasquees: [0], figer: [3, 3],
    lignes: [
      ['#synthese', { v: `Notes — ${c.nom}`, style: 'titre' }],
      ['', A(`Moyennes sur 20, pondérées par les coefficients ; ${anonyme ? 'ABS et NE' : 'ABS, DISP, NE, BLE, MAL et AUT'} ne comptent pas.`)],
      ['#eleve', E('Nom'), E('Prénom'), ...evals.map(e => E(`${e.titre} (${dateFr(e.date).slice(0, 5)}) /${fmt(e.max)}`)), ...moyennes.map(m => E(m.titre))],
      ...eleves.map(el => [idEl(el), nomEl(el), prenomEl(el), ...evals.map(e => valeurSynthese(Donnees.note(e.id, el.id))),
        ...moyennes.map(m => { const v = moyenneEleve(el.id, m.evals); return v === null ? '' : Math.round(v * 100) / 100; })]),
    ],
  };
  const feuilles = evals.map(e => {
    const comps = competencesEval(e);
    const ref = REFERENTIEL.refs[e.referentiel];
    return {
      nom: `${dateFr(e.date).slice(0, 5).replace('/', '-')} ${e.titre}`,
      largeurs: [10, 18, 16, 10, ...comps.map(() => 12)],
      colonnesMasquees: [0], lignesMasquees: [10], figer: [4, 10],
      lignes: [
        ['#eval', E('Évaluation'), { v: e.titre, style: 'titre' }],
        [anonyme ? '' : e.id, E('Date'), T(dateFr(e.date))],
        ['', E('APSA'), T(e.apsa || '')],
        ['', E('Noté sur'), e.max],
        ['', E('Coefficient'), e.coef],
        [e.referentiel || '', E('Champ d’apprentissage'), T(e.ca ? `${e.ca}${ref?.champs[e.ca] ? ' — ' + ref.champs[e.ca].titre : ''}` : '')],
        [],
        ['#eleve', E('Nom'), E('Prénom'), E('Note'), ...comps.map(a => E(a.code))],
        ['#type', A('Type'), A(''), A(`sur ${fmt(e.max)}, ou ${anonyme ? 'ABS / NE' : 'ABS / DISP / NE / BLE / MAL / AUT'}`), ...comps.map(a => A(`Degré 1 à 4 — ${a.texte}`))],
        [],
        ['#comp', '', '', '', ...comps.map(a => a.id)],
        ...eleves.map(el => {
          const n = Donnees.note(e.id, el.id);
          return [idEl(el), nomEl(el), prenomEl(el), nombre(n) !== null ? +n : T(noteExportee(n)),
            ...comps.map(a => { const d = Donnees.note(e.id, el.id, a.id); return d ? +d : ''; })];
        }),
      ],
    };
  });
  const blob = Tableur.ecrire([lisezMoi, synthese, ...feuilles]);
  const nom = `Notes ${c.nom}${anonyme ? ' anonyme' : ''} ${aujourdhui()}.xlsx`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new File([blob], nom, { type: blob.type }));
  a.download = nom.replace(/[\\/:*?"<>|]/g, '-');
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 60000);
  toast(anonyme ? `Classeur anonyme exporté (${evals.length} évaluation${evals.length > 1 ? 's' : ''}) : aucun nom d’élève.`
    : `Classeur exporté (${evals.length} évaluation${evals.length > 1 ? 's' : ''}). Il n’est pas chiffré : ne le laisse pas traîner.`, 'ok');
}

// Onglets du classeur → évaluations lues (onglets reconnus : ceux qui ont une ligne « Nom / Prénom / Note » ; la Synthèse est ignorée).
function lireEvalsExcel(feuilles) {
  const res = [];
  for (const f of feuilles) {
    const L = f.lignes;
    if (L.some(l => l[0] === '#synthese')) continue;
    const h = L.findIndex(l => sansAccent(l[1]) === 'nom' && sansAccent(l[2]).startsWith('prenom') && sansAccent(l[3]).startsWith('note'));
    if (h < 0) continue;
    const meta = {};
    let fichierId = '', refId = '';
    for (const l of L.slice(0, h)) {
      const cle = sansAccent(l[1]);
      if (cle) meta[cle] = l[2] || '';
      if (cle === 'date' && l[0]) fichierId = l[0];
      if (cle.startsWith('champ') && l[0]) refId = l[0];
    }
    const typeL = L.slice(h + 1).find(l => l[0] === '#type' || sansAccent(l[1]) === 'type');
    const idsL = L.slice(h + 1).find(l => l[0] === '#comp');
    const colonnes = [];
    for (let k = 4; k < L[h].length; k++) {
      if (!L[h][k]) continue;
      const texte = String(typeL?.[k] || '').replace(/^\s*degr[ée]\s*1\s*à\s*4\s*[—–-]\s*/i, '').trim();
      colonnes.push({ k, code: L[h][k].trim(), id: idsL?.[k] || '', texte });
    }
    const lignes = L.slice(h + 1).filter(l => l && l !== typeL && l !== idsL && (l[1] || l[2]))
      .map(l => ({ id: l[0] && !l[0].startsWith('#') ? l[0] : '', nom: l[1] || '', prenom: l[2] || '', note: l[3] || '',
        degres: colonnes.map(col => l[col.k] || '') }));
    const max = nombre(String(meta['note sur'] || '').replace(',', '.'));
    const coef = nombre(String(meta['coefficient'] || '').replace(',', '.'));
    res.push({
      onglet: f.nom, fichierId, refId, titre: (meta['evaluation'] || f.nom).trim(),
      date: lireDateExcel(meta['date']) || aujourdhui(), apsa: (meta['apsa'] || '').trim(),
      ca: (String(meta['champ d\'apprentissage'] || '').match(/^CA\d/i)?.[0] || '').toUpperCase(),
      max: max > 0 ? max : 20, coef: coef !== null && coef >= 0 ? coef : 1, colonnes, lignes,
    });
  }
  return res;
}

/* ---------- Relevé de notes exporté d'École Directe (ou d'un autre logiciel) ----------
   Une seule feuille : en haut une ligne de titres (« Classe… », Moyennes, Rang, puis une colonne par évaluation :
   « Titre JJ/MM/AAAA (EPS) »), une ligne « Coefficients », une ligne « Noté sur », puis un élève par ligne
   (« NOM Prénom », moyenne, rang, notes). Les colonnes Moyenne(s) et Rang ne sont pas reprises. */

// Fichier → feuilles : .xlsx, ou « .xls » qui est en fait une page web (export fréquent des logiciels de vie scolaire).
async function lireClasseurNotes(fichier) {
  const debut = new Uint8Array(await fichier.slice(0, 8).arrayBuffer());
  if (debut[0] === 0x50 && debut[1] === 0x4b) return Tableur.lire(fichier); // « PK » : vrai classeur .xlsx
  if (debut[0] === 0xd0 && debut[1] === 0xcf) throw new Error('Ce fichier est à l’ancien format Excel (.xls) : ouvre-le dans Excel ou LibreOffice, « Enregistrer sous » au format .xlsx, puis importe ce nouveau fichier.');
  const octets = new Uint8Array(await fichier.arrayBuffer());
  let texte = new TextDecoder('utf-8').decode(octets);
  if (texte.includes('�')) texte = new TextDecoder('windows-1252').decode(octets);
  if (!/<table/i.test(texte)) throw new Error('Format de fichier non reconnu : il faut un classeur Excel (.xlsx ou .xls).');
  // (Page web : chaque tableau devient une feuille ; une case fusionnée sur plusieurs colonnes laisse des cases vides.)
  const doc = new DOMParser().parseFromString(texte, 'text/html');
  return [...doc.querySelectorAll('table')].map((t, i) => ({
    nom: 'Tableau ' + (i + 1),
    lignes: [...t.rows].map(tr => [...tr.cells].flatMap(td => [td.innerText ?? td.textContent, ...Array(Math.max(0, (+td.colSpan || 1) - 1)).fill('')]
      .map(x => String(x ?? '').replace(/ /g, ' ').replace(/[ \t]+/g, ' ').trim()))),
  }));
}

function lireNotesEcoleDirecte(feuilles) {
  const res = [];
  const sa = x => sansAccent(String(x ?? '')).replace(/\s+/g, ' ').trim();
  const estCoef = t => /^coef/.test(t);
  const estSur = t => /^(not(e|é)e?s? sur|bareme|sur)$/.test(t.replace(/[:\s]+$/, ''));
  // Lignes de statistiques de la classe (en bas du relevé) : pas des élèves.
  // (Mots entiers seulement : un élève « MINARD » ou « MAXIME » reste un élève.)
  const estStat = t => t.startsWith('%') || /^(moyennes?|moy|min(imum|imale)?|max(imum|imale)?|ecarts?|medianes?|nombre|effectifs?|total|classe)\b/.test(t);
  for (const f of feuilles) {
    const L = Array.from(f.lignes, l => Array.from(l || [], x => String(x ?? '').trim()));
    // Cases « Coefficients » et « Noté sur » : n'importe où dans la feuille (souvent dans une colonne fusionnée).
    let iCoef = -1, cLab = -1, iSur = -1;
    L.forEach((l, i) => l.forEach((x, k) => {
      const t = sa(x);
      if (iCoef < 0 && estCoef(t)) { iCoef = i; cLab = k; }
      if (iSur < 0 && estSur(t)) { iSur = i; if (cLab < 0) cLab = k; }
    }));
    if (iCoef < 0 && iSur < 0) continue;
    const ref = iCoef >= 0 ? iCoef : iSur;
    const lu = (i, k) => (i >= 0 ? nombre(String(L[i]?.[k] || '').replace(',', '.')) : null);
    // Colonnes d'évaluation : celles qui ont un coefficient (ou un barème) — Moyennes et Rang n'en ont pas.
    const largeur = Math.max(...L.map(l => l.length));
    // Titre : la case non vide la plus proche au-dessus de la ligne des coefficients, dans la colonne.
    const titreDe = k => { for (let i = Math.min(iCoef, iSur >= 0 ? iSur : iCoef) - 1; i >= 0; i--) if (L[i]?.[k]) return L[i][k]; return ''; };
    const cols = [];
    for (let k = cLab + 1; k < largeur; k++) {
      if (lu(iCoef, k) === null && lu(iSur, k) === null) continue;
      if (/^(moyennes?|moy|rangs?|appreciations?)\b/.test(sa(titreDe(k)))) continue; // (jamais une évaluation)
      cols.push(k);
    }
    if (!cols.length) continue;
    // Élèves : sous les lignes d'en-tête, un nom dans les colonnes avant les évaluations, et au moins une case remplie.
    const debut = Math.max(iCoef, iSur) + 1;
    const eleves = [];
    for (const l of L.slice(debut)) {
      const avant = l.slice(0, cols[0]).filter(x => /\p{L}/u.test(x));
      const nom = avant.sort((a, b) => b.length - a.length)[0] || '';
      if (!nom || estStat(sa(nom)) || avant.some(x => estStat(sa(x)))) continue;
      eleves.push({ ...ListeClasse.separerNom(nom), l });
    }
    if (!eleves.length) continue;
    for (const k of cols) {
      const t = titreDe(k).replace(/\s+/g, ' ').trim() || `Évaluation ${cols.indexOf(k) + 1}`;
      const date = t.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
      // Titre : le texte avant la date (sans la matière entre parenthèses à la fin).
      const titre = (date ? t.slice(0, date.index) : t).replace(/\(\s*[^)]*\)\s*$/, '').replace(/[\s—–-]+$/, '').trim() || t;
      const coef = lu(iCoef, k), sur = lu(iSur, k);
      res.push({
        onglet: f.nom, fichierId: '', refId: '', titre, date: (date && lireDateExcel(date[0])) || aujourdhui(), apsa: '', ca: '',
        max: sur > 0 ? sur : 20, coef: coef !== null && coef >= 0 ? coef : 1, colonnes: [],
        lignes: eleves.map(({ nom, prenom, l }) => ({ id: '', nom: majuscules(nom), prenom, note: String(l[k] || '').replace(/\s*\/\s*\d+([.,]\d+)?$/, ''), degres: [] })),
      });
    }
  }
  return res;
}

// Compétence d'une colonne : celle du référentiel (identifiant connu), sinon une compétence « libre » de l'évaluation.
function competenceColonne(col) {
  if (col.id && REFERENTIEL.attendu(col.id)) return { id: col.id };
  const texte = (col.id.startsWith('libre:') ? col.id.slice(6) : col.texte || col.code).trim();
  return texte ? { id: 'libre:' + texte, libre: texte } : null;
}

// Prépare l'import dans la classe c : évaluations à créer / mettre à jour, élèves reconnus ou inconnus.
function preparerImportNotes(lues, c) {
  const eleves = elevesDe(c.id);
  const parId = new Map(eleves.map(el => [el.id, el]));
  const parNom = new Map(eleves.map(el => [sansAccent(el.nom) + '|' + sansAccent(el.prenom), el]));
  const inconnus = new Map(), reconnus = new Set();
  const existantes = evalsDe(c.id);
  const evals = lues.map(x => {
    const parFichier = x.fichierId && Donnees.get('evals', x.fichierId);
    const cible = parFichier?.classeId === c.id ? parFichier
      : existantes.find(e => sansAccent(e.titre) === sansAccent(x.titre) && e.date === x.date) || null;
    // Évaluation d'un autre carnet : on garde son identifiant (un 2e import la met à jour au lieu de la doubler).
    const id = cible?.id || (x.fichierId && !Donnees.get('evals', x.fichierId) ? x.fichierId : Donnees.nouvelId());
    for (const l of x.lignes) {
      const cle = sansAccent(l.nom) + '|' + sansAccent(l.prenom);
      l.eleve = (l.id && parId.get(l.id)) || parNom.get(cle) || null;
      if (l.eleve) reconnus.add(l.eleve.id); else inconnus.set(cle, { nom: l.nom, prenom: l.prenom });
      l.cle = cle;
    }
    x.colonnes.forEach(col => { col.comp = competenceColonne(col); });
    return { ...x, id, cible };
  });
  return { evals, reconnus, inconnus };
}

function appliquerImportNotes(plan, c, { structure, ajouterInconnus }) {
  const bilan = { creees: 0, majs: 0, valeurs: 0, erreurs: [], ajoutes: 0 };
  if (!structure && ajouterInconnus) {
    let ordre = prochainOrdre(c.id);
    for (const [cle, el] of plan.inconnus) {
      const nouveau = Donnees.ecrire('eleves', { id: Donnees.nouvelId(), classeId: c.id, remarque: '', nom: majuscules(el.nom), prenom: el.prenom.trim(), sexe: '', ordre: ordre++ });
      for (const x of plan.evals) for (const l of x.lignes) if (!l.eleve && l.cle === cle) l.eleve = nouveau;
      bilan.ajoutes++;
    }
  }
  for (const x of plan.evals) {
    const e = x.cible || {};
    // Compétences : celles de l'évaluation, plus celles du fichier qu'elle n'a pas encore.
    const officielles = new Set(e.competences || []);
    const libres = (e.competencesLibres || '').split('\n').map(s => s.trim()).filter(Boolean);
    for (const col of x.colonnes) {
      if (!col.comp) continue;
      if (col.comp.libre) { if (!libres.includes(col.comp.libre)) libres.push(col.comp.libre); } else officielles.add(col.comp.id);
    }
    const premiere = [...officielles].map(REFERENTIEL.attendu).find(Boolean);
    const enreg = Donnees.ecrire('evals', {
      ...e, id: x.id, classeId: c.id, cree: e.cree || Date.now(), titre: x.titre, apsa: x.apsa, date: x.date,
      max: x.max, coef: x.coef,
      referentiel: e.referentiel || premiere?.refId || (REFERENTIEL.refs[x.refId] ? x.refId : referentielDuNiveau(c.niveau)),
      // (Référentiel « toutes compétences », comme en SVT : pas de champ unique.)
      ca: REFERENTIEL.refs[e.referentiel || premiere?.refId]?.toutes ? '' : e.ca || premiere?.ca || x.ca || '',
      competences: [...officielles], competencesLibres: libres.join('\n'),
    });
    if (x.cible) bilan.majs++; else bilan.creees++;
    if (structure) continue;
    for (const l of x.lignes) {
      if (!l.eleve) continue;
      const qui = `${l.nom} ${l.prenom}`.trim();
      // Note
      const brut = l.note.trim();
      if (brut) {
        const code = CODES_NOTE_EXCEL[brut.toLocaleUpperCase('fr')];
        const n = nombre(brut.replace(',', '.'));
        const v = code || (n !== null && n >= 0 && n <= enreg.max ? String(n) : null);
        if (v === null) bilan.erreurs.push(`${qui} (${x.titre}) : note « ${brut} »`);
        else if (v !== Donnees.note(x.id, l.eleve.id)) { Donnees.ecrireNote(x.id, l.eleve.id, v); bilan.valeurs++; }
      }
      // Degrés de maîtrise (choisis à la main : la note ne les écrasera plus)
      x.colonnes.forEach((col, k) => {
        const d = l.degres[k].trim();
        if (!d || !col.comp) return;
        const n = +d.replace(',', '.');
        if (!Number.isInteger(n) || n < 1 || n > 4) return bilan.erreurs.push(`${qui} (${x.titre}, ${col.code}) : degré « ${d} »`);
        // (Degré identique au carnet : on n'y touche pas — un degré pré-rempli d'après la note le reste, et suit la note.)
        if (Donnees.note(x.id, l.eleve.id, col.comp.id) !== String(n)) { Donnees.ecrireNote(x.id, l.eleve.id, String(n), col.comp.id); bilan.valeurs++; }
      });
      preremplirDegres(enreg, l.eleve.id); // (degrés encore vides : d'après la note, comme à la saisie)
    }
  }
  return bilan;
}

/* ---------- Doublons à l'import ----------
   Chaque évaluation du fichier est comparée aux autres colonnes du fichier et aux évaluations du carnet
   (même titre et même date) : identique → pas recopiée ; mêmes titre et date mais notes différentes → à vérifier. */

// Note du fichier telle qu'elle serait enregistrée ('' si vide ; « ?… » si illisible).
function valeurImport(brut, max) {
  const t = String(brut || '').trim();
  if (!t) return '';
  const code = CODES_NOTE_EXCEL[t.toLocaleUpperCase('fr')], n = nombre(t.replace(',', '.'));
  return code || (n !== null && n >= 0 && n <= max ? String(n) : '?' + t);
}
const empreinteImport = x => JSON.stringify([x.max, x.coef, x.lignes.map(l => [l.cle, valeurImport(l.note, x.max), ...l.degres.map(d => String(d).trim())]).sort()]);

// Nombre de valeurs du fichier qui diffèrent de l'évaluation du carnet (barème et coefficient compris).
function differencesCarnet(x) {
  let n = x.cible.max !== x.max || x.cible.coef !== x.coef ? 1 : 0;
  for (const l of x.lignes) {
    if (!l.eleve) continue;
    const v = valeurImport(l.note, x.max);
    if (v && v !== Donnees.note(x.cible.id, l.eleve.id)) n++;
    x.colonnes.forEach((col, k) => {
      const d = String(l.degres[k] || '').trim();
      if (d && col.comp && d !== Donnees.note(x.cible.id, l.eleve.id, col.comp.id)) n++;
    });
  }
  return n;
}

// x.cas : 'nouvelle' | 'doublon' (copie exacte d'une autre colonne du fichier) | 'identique' (déjà dans le carnet)
//         | 'conflit-carnet' (dans le carnet, avec des notes différentes) | 'conflit-fichier' (même titre et date qu'une autre colonne, notes différentes).
function analyserDoublonsImport(plan) {
  const vus = new Map();
  // (Une évaluation déjà importée « à part » s'appelle « Titre (2) », « Titre (3) »… : elle compte aussi.)
  const variantes = x => evalsDe(plan.evals[0]?.cible?.classeId || classeActive().id)
    .filter(e => e.date === x.date && sansAccent(e.titre).replace(/\s*\(\d+\)$/, '') === sansAccent(x.titre));
  const dejaIdentique = x => variantes(x).find(e => differencesCarnet({ ...x, cible: e }) === 0);
  for (const x of plan.evals) {
    const cle = sansAccent(x.titre) + '|' + x.date, avant = vus.get(cle) || [];
    const jumelle = !x.cible || differencesCarnet(x) ? dejaIdentique(x) : null;
    if (avant.some(y => empreinteImport(y) === empreinteImport(x))) x.cas = 'doublon';
    else if (jumelle) { x.cible = jumelle; x.id = jumelle.id; x.cas = 'identique'; }
    else if (avant.length) x.cas = 'conflit-fichier';
    else if (x.cible) { x.diff = differencesCarnet(x); x.cas = x.diff ? 'conflit-carnet' : 'identique'; }
    else x.cas = 'nouvelle';
    avant.push(x);
    vus.set(cle, avant);
  }
}

const LIBELLES_CAS_IMPORT = {
  nouvelle: () => '🆕 Nouvelle',
  doublon: () => '♊ En double dans le fichier (même titre, même date, mêmes notes) : pas recopiée',
  identique: () => '✔ Déjà dans le carnet, identique : rien à faire',
  'conflit-carnet': x => `⚠ À vérifier : déjà dans le carnet, avec ${x.diff} différence${x.diff > 1 ? 's' : ''}`,
  'conflit-fichier': () => '⚠ À vérifier : même titre et même date qu’une autre colonne du fichier, mais notes différentes',
};
const CHOIX_CAS_IMPORT = {
  nouvelle: [['importer', 'Importer'], ['ignorer', 'Ne pas importer']],
  doublon: [['ignorer', 'Ne pas importer'], ['a-part', 'Importer quand même, à part']],
  identique: [['ignorer', 'Ne pas importer'], ['importer', 'Réimporter quand même']],
  'conflit-carnet': [['', '— Choisir —'], ['importer', 'Mettre à jour l’évaluation du carnet'], ['a-part', 'Importer à part (nouvelle évaluation)'], ['ignorer', 'Ne pas importer']],
  'conflit-fichier': [['', '— Choisir —'], ['a-part', 'Importer aussi, à part'], ['ignorer', 'Ne pas importer']],
};

async function importerNotesExcel(c, fichier) {
  let feuilles;
  try { feuilles = await lireClasseurNotes(fichier); } catch (e) {
    throw new Error(`« ${fichier.name} » n’a pas pu être lu : ${e.message || e}`);
  }
  if (estAnonyme(feuilles)) throw new Error('Ce classeur est un export anonyme : il ne peut pas être réimporté (l’appli ne saurait pas à quels élèves rattacher les notes).');
  // Classeur de l'appli (un onglet par évaluation), sinon relevé de notes d'École Directe (une colonne par évaluation).
  let lues = lireEvalsExcel(feuilles);
  if (!lues.length) lues = lireNotesEcoleDirecte(feuilles);
  if (!lues.length) throw new Error(`Aucune évaluation trouvée dans « ${fichier.name} » : il faut le classeur exporté par l’appli, ou le relevé de notes d’École Directe (lignes « Coefficients » et « Noté sur » sous les titres des évaluations).`);
  const plan = preparerImportNotes(lues, c);
  analyserDoublonsImport(plan);
  const totalEleves = plan.reconnus.size + plan.inconnus.size;
  const inconnus = [...plan.inconnus.values()];
  const nbCas = cas => plan.evals.filter(x => x.cas === cas).length;
  const aVerifier = nbCas('conflit-carnet') + nbCas('conflit-fichier');
  const { resultat } = ouvrirModale(`Importer dans ${c.nom}`, `
    <p><b>${esc(fichier.name)}</b></p>
    <ul class="bilan-import">
      <li>${plan.evals.length} évaluation${plan.evals.length > 1 ? 's' : ''} dans le fichier : ${[
        nbCas('nouvelle') && `${nbCas('nouvelle')} nouvelle${nbCas('nouvelle') > 1 ? 's' : ''}`,
        nbCas('identique') && `${nbCas('identique')} déjà dans le carnet (identique${nbCas('identique') > 1 ? 's' : ''})`,
        nbCas('doublon') && `${nbCas('doublon')} en double dans le fichier`,
        aVerifier && `<b>${aVerifier} à vérifier</b>`].filter(Boolean).join(', ')}</li>
      <li>${plan.reconnus.size} élève${plan.reconnus.size > 1 ? 's' : ''} reconnu${plan.reconnus.size > 1 ? 's' : ''} sur ${totalEleves}</li>
    </ul>
    <fieldset class="choix-import"><legend>Évaluations du fichier</legend>
      <p class="aide">Seules les évaluations <b>uniques</b> sont importées : une évaluation identique (même titre, même date, mêmes notes)
        n’est pas recopiée. ${aVerifier ? '<b>⚠ Choisis quoi faire pour celles marquées « à vérifier ».</b>' : ''}</p>
      <ul class="liste-evals-import">${plan.evals.map((x, i) => `<li class="cas-${x.cas}">
        <span><b>${esc(x.titre)}</b> <span class="aide">${esc(dateCourte(x.date))} · /${fmt(x.max)} · coef ${fmt(x.coef)}</span><br>
          <small>${esc(LIBELLES_CAS_IMPORT[x.cas](x))}</small></span>
        <select name="act-${i}" ${x.cas.startsWith('conflit') ? 'required' : ''} aria-label="Que faire de ${esc(x.titre)} du ${esc(dateCourte(x.date))}">
          ${CHOIX_CAS_IMPORT[x.cas].map(([v, nom]) => `<option value="${v}">${esc(nom)}</option>`).join('')}</select></li>`).join('')}</ul>
    </fieldset>
    <fieldset class="choix-import"><legend>Que reprendre ?</legend>
      <label class="case"><input type="radio" name="quoi" value="tout" checked><span>Les évaluations <b>et les notes / degrés</b> des élèves</span></label>
      <label class="case"><input type="radio" name="quoi" value="structure"><span>Seulement <b>les évaluations</b> (titres, dates, barèmes, compétences) — pour reprendre les évaluations d’un collègue avec tes élèves</span></label>
    </fieldset>
    ${inconnus.length ? `<div class="inconnus-import">
      <p>${inconnus.length} élève${inconnus.length > 1 ? 's' : ''} du fichier ${inconnus.length > 1 ? 'ne sont' : 'n’est'} pas dans ${esc(c.nom)} :
        <span class="aide">${inconnus.slice(0, 12).map(el => esc(`${el.nom} ${el.prenom}`.trim())).join(', ')}${inconnus.length > 12 ? '…' : ''}</span></p>
      <label class="case"><input type="checkbox" name="ajouter"> Les ajouter à la classe (sinon leurs lignes sont ignorées)</label>
    </div>` : ''}
    <p class="aide">Rien n’est effacé : une case vide dans le fichier laisse la valeur du carnet telle quelle.</p>`,
  boutonsModale('Importer'));
  const r = await resultat;
  if (r.action !== 'ok') return;
  // Les choix de l'enseignant : ignorer, mettre à jour l'évaluation du carnet, ou importer à part (titre « … (2) »).
  const pris = new Set(evalsDe(c.id).map(e => sansAccent(e.titre) + '|' + e.date));
  plan.evals = plan.evals.filter((x, i) => {
    const choix = r.data['act-' + i];
    if (!choix || choix === 'ignorer') return false;
    if (choix === 'a-part') {
      let n = 2, titre;
      do titre = `${x.titre} (${n++})`; while (pris.has(sansAccent(titre) + '|' + x.date));
      Object.assign(x, { titre, cible: null, id: Donnees.nouvelId() });
    }
    pris.add(sansAccent(x.titre) + '|' + x.date);
    return true;
  });
  if (!plan.evals.length) return toast('Rien à importer : toutes les évaluations du fichier sont déjà dans le carnet ou ont été laissées de côté.');
  const bilan = appliquerImportNotes(plan, c, { structure: r.data.quoi === 'structure', ajouterInconnus: r.data.ajouter === 'on' });
  rendre();
  const morceaux = [
    bilan.creees && `${bilan.creees} évaluation${bilan.creees > 1 ? 's' : ''} ajoutée${bilan.creees > 1 ? 's' : ''}`,
    bilan.majs && `${bilan.majs} mise${bilan.majs > 1 ? 's' : ''} à jour`,
    r.data.quoi !== 'structure' && `${bilan.valeurs} case${bilan.valeurs > 1 ? 's' : ''} remplie${bilan.valeurs > 1 ? 's' : ''} ou corrigée${bilan.valeurs > 1 ? 's' : ''}`,
    bilan.ajoutes && `${bilan.ajoutes} élève${bilan.ajoutes > 1 ? 's' : ''} ajouté${bilan.ajoutes > 1 ? 's' : ''}`,
  ].filter(Boolean);
  if (!bilan.erreurs.length) return toast('Import terminé : ' + morceaux.join(', ') + '.', 'ok');
  ouvrirModale('Import terminé', `<p>${esc(morceaux.join(', '))}.</p>
    <p>${bilan.erreurs.length} case${bilan.erreurs.length > 1 ? 's' : ''} illisible${bilan.erreurs.length > 1 ? 's' : ''}, laissée${bilan.erreurs.length > 1 ? 's' : ''} de côté :</p>
    <ul class="erreurs-import">${bilan.erreurs.slice(0, 30).map(e => `<li>${esc(e)}</li>`).join('')}${bilan.erreurs.length > 30 ? '<li>…</li>' : ''}</ul>`,
  '<span class="espace"></span><button type="button" data-fermer class="primaire">OK</button>');
}

// Bouton « ⇅ Excel » de l'onglet Notes.
async function echangeExcelNotes() {
  const c = classeActive();
  let fichier = null;
  const { d, resultat } = ouvrirModale(`Excel — notes ${c.nom}`, `
    <div class="bloc-excel">
      <h3>⬇ Exporter</h3>
      <p class="aide">Toutes les évaluations de la classe dans un classeur .xlsx : une synthèse avec les moyennes, puis un onglet
        par évaluation (note et degrés de maîtrise). À garder, à ouvrir dans Excel ou LibreOffice, à donner à un collègue.</p>
      <p class="aide">⚠ Le classeur n’est pas chiffré, contrairement au carnet sur la clé : ne le laisse pas traîner.</p>
      <label class="case"><input type="checkbox" name="anonyme"> <span><b>Anonyme</b> — sans noms ni dispenses, pour partager (ne se réimporte pas)</span></label>
      <button value="exporter" class="primaire">Exporter ${esc(c.nom)}</button>
    </div>
    <div class="bloc-excel">
      <h3>⬆ Importer</h3>
      <p class="aide">Un classeur de notes exporté par ${esc(profil().carnet)} (le tien, éventuellement complété dans Excel, ou celui d’un collègue),
        ou le <b>relevé de notes exporté d’École Directe</b> (une colonne par évaluation : titre et date, coefficient, « noté sur », puis les notes).
        Tu verras ce qui sera repris avant de valider.</p>
      <label class="bouton primaire">Choisir un fichier .xlsx ou .xls…<input type="file" accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" data-fichier-excel hidden></label>
    </div>`,
  '<span class="espace"></span><button type="button" data-fermer>Fermer</button>');
  d.querySelector('[data-fichier-excel]').addEventListener('change', e => {
    fichier = e.target.files[0] || null;
    if (fichier) d.fermer();
  });
  const r = await resultat;
  if (r.action === 'exporter') return exporterNotesExcel(c, { anonyme: r.data.anonyme === 'on' });
  if (fichier) return importerNotesExcel(c, fichier);
}
