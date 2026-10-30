'use strict';
// Échange avec Excel : les notes et les degrés de maîtrise d'une classe en classeur .xlsx (bouton « 📥 Importer mes notes » de l'onglet Notes).
// Même principe que pour les leçons (entrainement.js) :
//   un onglet « Lisez-moi », un onglet « Synthèse » (moyennes, pour lire seulement), puis un onglet par évaluation :
//   élèves en lignes ; colonnes Note, puis un degré (1 à 4) par compétence travaillée.
//   La colonne A et une ligne masquées gardent les identifiants : un fichier réimporté met à jour ses évaluations
//   au lieu de les doubler. À l'import, rien n'est effacé : une case vide laisse la valeur du carnet telle quelle.
// (Fichier chargé avant app.js ; il se sert aussi des outils Excel d'entrainement.js : sansAccent, dateFr, lireDateExcel.)

const CODES_NOTE_EXCEL = { A: 'ABS', ABS: 'ABS', ABSENT: 'ABS', D: 'DISP', DISP: 'DISP', 'DISPENSÉ': 'DISP', DISPENSE: 'DISP', N: 'NE', NE: 'NE', NN: 'NE', 'NON NOTÉ': 'NE', 'NON NOTE': 'NE',
  B: 'BLE', BLE: 'BLE', 'BLESSÉ': 'BLE', BLESSE: 'BLE', M: 'MAL', MAL: 'MAL', MALADE: 'MAL', O: 'AUT', AUT: 'AUT', AUTRE: 'AUT', R: 'NR', NR: 'NR', 'NON RENDU': 'NR',
  // (Codes des relevés d'École Directe : « Abs », « Disp », « Inapte », « Absent excusé »…)
  'ABS.': 'ABS', 'ABSENT EXCUSÉ': 'ABS', 'ABS EXCUSÉ': 'ABS', 'DISP.': 'DISP', INAPTE: 'DISP', INAP: 'DISP', 'NON NOTÉE': 'NE',
  // (Codes de Pronote : « N.Not » non noté, « N.Rdu » non rendu, « Inap. »)
  'N.NOT': 'NE', 'N.NOT.': 'NE', 'N.NOTÉ': 'NE', 'N.RDU': 'NR', 'N.RDU.': 'NR', 'INAP.': 'DISP' };
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
  // Codes de la discipline (EPS : ABS, DISP, NE, BLE, MAL, AUT ; SVT : ABS, NE, MAL, AUT, NR).
  const codes = ['ABS', 'DISP', 'NE', 'BLE', 'MAL', 'AUT', 'NR'].filter(k => k === 'ABS' || codeDeLaDiscipline(k));
  const precision = { BLE: ' (blessé)', MAL: ' (malade)', AUT: ' (autre)', NR: ' (non rendu)' };
  const listeEt = (liste, et) => liste.join(', ').replace(/, ([^,]*)$/, ` ${et} $1`);
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
      [`Note : un nombre (jusqu’au barème « Noté sur »), ou ${anonyme ? 'ABS, NE' : codes.map(k => k + (precision[k] || '')).join(', ')} · Degré : 1, 2, 3 ou 4.`],
      ...(anonyme ? [] : [
        ['Tu peux compléter ou corriger les cases, ajouter des élèves (nom et prénom) ou un onglet d’évaluation construit sur le même modèle.'],
        ['Ne supprime pas la colonne A ni les lignes masquées : elles permettent à l’appli de reconnaître les évaluations, les compétences et les élèves.'],
        [`Pour le reprendre : ${profil().carnet} › onglet Notes › bouton « Excel » › Importer. Une case vide ne supprime rien dans le carnet.`],
        [],
        [{ v: '⚠ Ce fichier n’est pas chiffré (contrairement au carnet sur la clé) : ne le laisse pas traîner, supprime-le après usage.', style: 'entete' }],
      ]),
      [],
      [E('Évaluations')],
      ...evals.map(e => [`${dateFr(e.date)} — ${e.titre}${e.apsa && e.apsa !== e.titre ? ' (' + e.apsa + ')' : ''} — /${fmt(e.max)}${e.coef !== 1 ? ', coef ' + fmt(e.coef) : ''}${e.nonSignificative ? ', non significative' : ''}`]),
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
      ['', A(`Moyennes sur 20, pondérées par les coefficients ; ${anonyme ? 'ABS et NE' : listeEt(codes, 'et')} ne comptent pas.`)],
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
        ['', E(mot('activite')), T(e.apsa || '')],
        ['', E('Noté sur'), e.max],
        ['', E('Coefficient'), e.coef, e.nonSignificative ? A('note non significative : ne compte pas dans la moyenne') : ''],
        // (Sans champ d'apprentissage hors EPS : le référentiel ; sa colonne A sert à l'import, comme celle du champ.)
        profil().champsSequence
          ? [e.referentiel || '', E('Champ d’apprentissage'), T(e.ca ? `${e.ca}${ref?.champs[e.ca] ? ' — ' + ref.champs[e.ca].titre : ''}` : '')]
          : [e.referentiel || '', E('Référentiel'), T(ref?.nom || '')],
        [],
        ['#eleve', E('Nom'), E('Prénom'), E('Note'), ...comps.map(a => E(a.code))],
        ['#type', A('Type'), A(''), A(`sur ${fmt(e.max)}, ou ${anonyme ? 'ABS / NE' : codes.join(' / ')}`), ...comps.map(a => A(`Degré 1 à 4 — ${a.texte}`))],
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
    const meta = {}, metaSuite = {};
    let fichierId = '', refId = '';
    for (const l of L.slice(0, h)) {
      const cle = sansAccent(l[1]);
      if (cle) { meta[cle] = l[2] || ''; metaSuite[cle] = l[3] || ''; }
      if (cle === 'date' && l[0]) fichierId = l[0];
      if ((cle.startsWith('champ') || cle === 'referentiel') && l[0]) refId = l[0];
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
      date: lireDateExcel(meta['date']) || aujourdhui(), apsa: (meta['apsa'] || meta['theme'] || '').trim(), // (« Thème » : classeur d'un carnet SVT)
      ca: (String(meta['champ d\'apprentissage'] || '').match(/^CA\d/i)?.[0] || '').toUpperCase(),
      max: max > 0 ? max : 20, coef: coef !== null && coef >= 0 ? coef : 1, colonnes, lignes,
      nonSignificative: /non significative/i.test(metaSuite['coefficient'] || ''),
    });
  }
  return res;
}

/* ---------- Relevé de notes exporté d'École Directe (ou d'un autre logiciel) ----------
   Une seule feuille : en haut une ligne de titres (« Classe… », Moyennes, Rang, puis une colonne par évaluation :
   « Titre JJ/MM/AAAA (EPS) »), une ligne « Coefficients », une ligne « Noté sur », puis un élève par ligne
   (« NOM Prénom », moyenne, rang, notes). La colonne Moyenne(s) sert seulement à vérifier l'import (comme pour Pronote) ;
   le rang n'est pas repris. */

// Fichier → feuilles : .xlsx, ou « .xls » qui est en fait une page web (export fréquent des logiciels de vie scolaire).
async function lireClasseurNotes(fichier) {
  const debut = new Uint8Array(await fichier.slice(0, 8).arrayBuffer());
  if (debut[0] === 0x50 && debut[1] === 0x4b) return Tableur.lire(fichier); // « PK » : vrai classeur .xlsx
  if (debut[0] === 0xd0 && debut[1] === 0xcf) throw new Error('Ce fichier est à l’ancien format Excel (.xls) : ouvre-le dans Excel ou LibreOffice, « Enregistrer sous » au format .xlsx, puis importe ce nouveau fichier.');
  const octets = new Uint8Array(await fichier.arrayBuffer());
  let texte = new TextDecoder('utf-8').decode(octets);
  if (texte.includes('�')) texte = new TextDecoder('windows-1252').decode(octets);
  // Texte en colonnes (export .csv de Pronote, ou tableau copié puis collé dans un fichier .txt)
  if (!/<table/i.test(texte) && /\.(csv|txt)$/i.test(fichier.name)) return [{ nom: fichier.name, lignes: ListeClasse.lireCsv(texte.replace(/^﻿/, '')) }];
  if (!/<table/i.test(texte)) throw new Error('Format de fichier non reconnu : il faut un classeur Excel (.xlsx ou .xls), ou un fichier .csv / .txt.');
  // (Page web : chaque tableau devient une feuille ; une case fusionnée sur plusieurs colonnes laisse des cases vides.)
  const doc = new DOMParser().parseFromString(texte, 'text/html');
  return [...doc.querySelectorAll('table')].map((t, i) => ({
    nom: 'Tableau ' + (i + 1),
    lignes: [...t.rows].map(tr => [...tr.cells].flatMap(td => [td.innerText ?? td.textContent, ...Array(Math.max(0, (+td.colSpan || 1) - 1)).fill('')]
      .map(x => String(x ?? '').replace(/ /g, ' ').replace(/[ \t]+/g, ' ').trim()))),
  }));
}

// « NOM Prénom( 1MARINE ) » → « NOM Prénom » (classe d'origine d'un élève de groupe, dans les relevés d'École Directe).
const sansClasseNom = t => String(t ?? '').replace(/\s*\(\s*[^()]*\)\s*$/, '').trim();
// Élève créé par erreur par un ancien import (« NOM Prénom( 1MARINE ) ») : nom suivi d'une classe entre parenthèses.
const nomAvecClasse = el => /\(\s*[^()]*\)\s*$/.test(`${el.nom} ${el.prenom}`.trim()) || /\(\s*[^()]*$/.test(el.nom);
// Mots du nom complet, sans accents ni ordre ni tirets : « BIBI OTABELA LOUIS ALEXANDRE » = « BIBI OTABELA Louis-Alexandre ».
const motsNom = (nom, prenom) => sansAccent(sansClasseNom(`${nom || ''} ${prenom || ''}`)).replace(/[-'.()]/g, ' ')
  .split(' ').filter(Boolean).sort().join(' ');

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
    // Moyenne de l'élève dans le relevé (colonne « Moyenne(s) », sans coefficient) : la référence pour vérifier l'import.
    let kMoy = -1;
    for (let k = 0; k < largeur && kMoy < 0; k++) if (!cols.includes(k) && /^moy/.test(sa(titreDe(k)))) kMoy = k;
    // Élèves : sous les lignes d'en-tête, un nom dans les colonnes avant les évaluations, et au moins une case remplie.
    // (Groupe de plusieurs classes : « NOM Prénom( 1MARINE ) » — la classe d'origine, entre parenthèses, est retirée.)
    const debut = Math.max(iCoef, iSur) + 1;
    const eleves = [];
    let ligneMoyClasse = null;
    for (const l of L.slice(debut)) {
      const avant = l.slice(0, cols[0]).filter(x => /\p{L}/u.test(x));
      const nom = avant.sort((a, b) => b.length - a.length)[0] || '';
      if (nom && /^moyennes?\s+(de\s+la\s+|du\s+)?(classe|groupe)/.test(sa(nom))) ligneMoyClasse ??= l;
      if (!nom || estStat(sa(nom)) || avant.some(x => estStat(sa(x)))) continue;
      eleves.push({ ...ListeClasse.separerNom(sansClasseNom(nom)), l });
    }
    if (!eleves.length) continue;
    // Relevé ou bulletin de période : « Relevé », « Trimestre 1 », « Semestre 2 » dans le cartouche en haut à gauche.
    const cartouche = sa(L.slice(0, ref).flat().join(' '));
    const per = cartouche.match(/\b(trimestre|semestre)\s*(\d)/);
    const periodeFichier = per ? { type: per[1], n: +per[2] } : /\breleve\b/.test(cartouche) ? { type: 'releve' } : null;
    // Évaluation non comptée dans la moyenne (colonne bleue d'École Directe : formative, non significative) :
    // des notes, mais rien sur la ligne « Moyenne Classe / Groupe ». Elle sera importée comme « note non significative ».
    const nombreCase = x => nombre(String(x ?? '').replace(',', '.'));
    const horsMoyenne = new Set(ligneMoyClasse && cols.some(k => nombreCase(ligneMoyClasse[k]) !== null)
      ? cols.filter(k => nombreCase(ligneMoyClasse[k]) === null && eleves.some(({ l }) => nombreCase(l[k]) !== null)) : []);
    const lues = [];
    for (const k of cols) {
      const t = titreDe(k).replace(/\s+/g, ' ').trim() || `Évaluation ${cols.indexOf(k) + 1}`;
      const date = t.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
      // Titre : le texte avant la date (sans la matière entre parenthèses à la fin).
      const titre = (date ? t.slice(0, date.index) : t).replace(/\(\s*[^)]*\)\s*$/, '').replace(/[\s—–-]+$/, '').trim() || t;
      const coef = lu(iCoef, k), sur = lu(iSur, k);
      lues.push({
        onglet: f.nom, fichierId: '', refId: '', titre, date: (date && lireDateExcel(date[0])) || aujourdhui(), apsa: '', ca: '',
        max: sur > 0 ? sur : 20, coef: coef !== null && coef >= 0 ? coef : 1, colonnes: [],
        nonSignificative: horsMoyenne.has(k), periodeFichier,
        lignes: eleves.map(({ nom, prenom, l }) => ({ id: '', nom: majuscules(nom), prenom, note: String(l[k] || '').replace(/\s*\/\s*\d+([.,]\d+)?$/, ''), degres: [],
          moyenneFichier: kMoy >= 0 ? nombre(String(l[kMoy] || '').replace(',', '.')) : null })),
      });
    }
    if (kMoy >= 0) {
      verifierMoyennesFichier(lues, 'sur20');
      // Sans ligne « Moyenne Classe » : si les moyennes ne tombent juste qu'en laissant de côté une évaluation,
      // c'est qu'École Directe ne la compte pas (évaluation non significative).
      const v = lues[0].verifPronote, juste = w => w.sur20 === w.total || w.points === w.total;
      if (!horsMoyenne.size && v.total && !juste(v)) {
        lues.find(x => {
          if (x.nonSignificative) return false;
          x.nonSignificative = true;
          verifierMoyennesFichier(lues, 'sur20');
          if (juste(lues[0].verifPronote)) return true;
          x.nonSignificative = false;
          return false;
        });
        verifierMoyennesFichier(lues, 'sur20');
      }
    }
    res.push(...lues);
  }
  return res;
}

// Moyennes du relevé (Pronote, École Directe) : l'appli refait les deux calculs pour savoir lequel le logiciel a suivi
// (« sur 20 » : chaque note ramenée sur 20, comme dans le carnet ; « points » : total des points / total des barèmes).
// (prefere : le calcul habituel du logiciel, retenu à égalité — « points » pour Pronote, « sur20 » pour École Directe.)
function verifierMoyennesFichier(lues, prefere) {
  const verif = { sur20: 0, points: 0, total: 0, prefere };
  lues[0]?.lignes.forEach((l0, i) => {
    const attendue = l0.moyenneFichier;
    if (attendue === null || attendue === undefined) return;
    let s20 = 0, p20 = 0, pts = 0, bar = 0;
    for (const x of lues) {
      const n = nombre(valeurImport(x.lignes[i].note, x.max));
      if (n === null || !x.coef || x.nonSignificative) continue;
      s20 += (n / x.max) * 20 * x.coef; p20 += x.coef; pts += n * x.coef; bar += x.max * x.coef;
    }
    if (!p20) return;
    verif.total++;
    if (Math.abs(s20 / p20 - attendue) < 0.006) verif.sur20++;
    if (Math.abs((pts / bar) * 20 - attendue) < 0.006) verif.points++;
  });
  lues.forEach(x => { x.verifPronote = verif; });
}

/* ---------- Relevé de notes exporté de Pronote (.xlsx, ou .csv / texte copié) ----------
   Ligne de titres : « 17 élèves », Classes, Moyenne, N.R., puis une colonne par devoir avec sa date (JJ/MM ou date Excel) ;
   juste dessous : « coefficient - /barème » (ex. « 1 - /10 ») ; puis un élève par ligne (« NOM Prénom », classe, moyenne, notes).
   La dernière ligne, sans nom, donne les moyennes du groupe : ignorée. Groupe de plusieurs classes : la colonne Classes est ignorée. */
const COEF_SUR_PRONOTE = /^(?:coef\.?\s*)?(\d+(?:[.,]\d+)?)\s*-\s*\/\s*(\d+(?:[.,]\d+)?)$/i;
// « N.Rdu* » (non rendu marqué d'une étoile) compte 0 dans les moyennes de Pronote : il devient la note 0.
// (« N.Rdu » sans étoile reste « non rendu », qui ne compte pas.)
const notePronote = t => (/^(n\.?\s*rdu|nr|non\s+rendu)\.?\s*\*$/i.test(String(t).trim()) ? '0' : t);

// Date d'en-tête : date Excel, JJ/MM/AAAA, ou JJ/MM (année scolaire en cours : de septembre à août).
function dateDevoirPronote(t) {
  const complete = lireDateExcel(t);
  if (complete) return complete;
  const m = t.match(/(\d{1,2})\/(\d{1,2})(?!\/)/);
  if (!m) return '';
  const auj = aujourdhui(), annee = +auj.slice(0, 4), debut = +auj.slice(5, 7) >= 8 ? annee : annee - 1;
  return `${+m[2] >= 8 ? debut : debut + 1}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

function lireNotesPronote(feuilles) {
  const res = [];
  const sa = x => sansAccent(String(x ?? '')).replace(/\s+/g, ' ').trim();
  for (const f of feuilles) {
    const L = Array.from(f.lignes, l => Array.from(l || [], x => String(x ?? '').trim()));
    const iCs = L.findIndex(l => l.some(x => COEF_SUR_PRONOTE.test(x)));
    if (iCs < 1) continue;
    const tete = L[iCs - 1];
    const cols = L[iCs].map((x, k) => (COEF_SUR_PRONOTE.test(x) ? k : -1)).filter(k => k >= 0);
    const kNom = Math.max(0, tete.findIndex(x => /^\d*\s*eleves?$/.test(sa(x))));
    const kMoy = tete.findIndex(x => /^moy/.test(sa(x)));
    const eleves = L.slice(iCs + 1).filter(l => /\p{L}/u.test(l[kNom] || '') && !/^(moyennes?|moy)\b/.test(sa(l[kNom])))
      .map(l => ({ ...ListeClasse.separerNom(l[kNom]), l }));
    if (!eleves.length) continue;
    // Titres : le texte de l'en-tête sans la date, sinon « Devoir du JJ/MM » (plusieurs devoirs le même jour : « (2) », « (3) »…)
    const vus = new Map();
    const lues = cols.map(k => {
      const [, coef, sur] = L[iCs][k].match(COEF_SUR_PRONOTE);
      const brut = tete[k] || '', date = dateDevoirPronote(brut) || aujourdhui();
      const texte = /^\d{5}(\.\d+)?$/.test(brut) ? '' : brut.replace(/\d{1,2}\/\d{1,2}(\/\d{2,4})?/, '').replace(/^[\s—–-]+|[\s—–-]+$/g, '').trim();
      let titre = texte || `Devoir du ${dateFr(date).slice(0, 5)}`;
      const n = (vus.get(sa(titre) + date) || 0) + 1;
      vus.set(sa(titre) + date, n);
      if (n > 1) titre += ` (${n})`;
      return {
        onglet: f.nom, fichierId: '', refId: '', titre, date, apsa: '', ca: '', colonnes: [], k,
        max: +sur.replace(',', '.') || 20, coef: +coef.replace(',', '.'),
        lignes: eleves.map(({ nom, prenom, l }) => ({ id: '', nom: majuscules(nom), prenom, note: notePronote(l[k] || ''), degres: [],
          moyenneFichier: kMoy >= 0 ? nombre(String(l[kMoy] || '').replace(',', '.')) : null })),
      };
    });
    if (kMoy >= 0) verifierMoyennesFichier(lues, 'points'); // (moyennes de Pronote : voir plus haut)
    res.push(...lues);
  }
  return res;
}

// Vérification avant import : pour chaque élève, la moyenne du fichier (référence) et celle qu'aura le carnet APRÈS l'import
// sur les devoirs du fichier (notes ramenées sur 20, pondérées) : une évaluation laissée de côté mais déjà dans le carnet
// compte avec les notes du carnet ; une évaluation importée, avec celles du fichier (case vide : la note du carnet reste).
// Ainsi, un réimport « anciennes + nouvelles évaluations » est juste si les deux moyennes sont égales.
function moyennesAComparer(evals, choixDe = () => 'importer') {
  const lignes = [];
  evals[0]?.lignes.forEach((l0, i) => {
    if (l0.moyenneFichier === null || l0.moyenneFichier === undefined) return;
    let somme = 0, poids = 0;
    for (const x of evals) {
      const l = x.lignes[i], choix = choixDe(x);
      const duCarnet = x.cible && l.eleve ? noteCarnetImport(x.cible.id, l.eleve.id) : '';
      let n, max = x.max, coef = x.coef, ns = x.nonSignificative;
      if (choix === 'importer' || choix === 'a-part') {
        const v = valeurImport(l.note, x.max);
        n = nombre(v || (choix === 'importer' ? duCarnet : ''));
      } else if (x.cible) {
        n = nombre(duCarnet); max = x.cible.max; coef = x.cible.coef ?? 1; ns = x.cible.nonSignificative; // (gardée telle qu'elle est dans le carnet)
        if (choix === 'coef') { coef = x.coef; ns = x.nonSignificative; } // (seuls le coefficient et « non significative » changent)
      } else continue; // (ni importée, ni dans le carnet)
      if (n === null || n === undefined || !coef || !max || ns) continue;
      somme += (n / max) * 20 * coef; poids += coef;
    }
    const carnet = poids ? Math.round((somme / poids) * 100) / 100 : null;
    lignes.push({ qui: `${l0.nom} ${l0.prenom}`.trim(), fichier: l0.moyenneFichier, carnet, ok: carnet !== null && Math.abs(carnet - l0.moyenneFichier) < 0.006 });
  });
  return lignes;
}

function htmlVerifMoyennes(lignes) {
  const ok = lignes.filter(l => l.ok).length, ecarts = lignes.length - ok;
  return `<p class="${ecarts ? 'alerte-import' : 'aide'}">${ecarts ? `⚠ <b>${ecarts} moyenne${ecarts > 1 ? 's' : ''} différente${ecarts > 1 ? 's' : ''}</b> de celles du fichier`
      : `✔ <b>Les ${ok} moyennes sont identiques</b> à celles du fichier`}${ecarts && ok ? ` (${ok} identique${ok > 1 ? 's' : ''})` : ''}.</p>
    <details class="verif-moyennes"${ecarts ? ' open' : ''}><summary>Voir élève par élève</summary>
      <div class="table-defile"><table class="table-labo"><thead><tr><th>Élève</th><th>Fichier</th><th>Carnet après l’import</th><th>Écart</th></tr></thead>
      <tbody>${lignes.map(l => `<tr class="${l.ok ? '' : 'ecart-moyenne'}"><th>${esc(l.qui)}</th><td>${fmt(l.fichier)}</td><td>${l.carnet === null ? '–' : fmt(l.carnet)}</td>
        <td>${l.ok ? '✔' : l.carnet === null ? '⚠' : '⚠ ' + (l.carnet > l.fichier ? '+' : '') + fmt(Math.round((l.carnet - l.fichier) * 100) / 100)}</td></tr>`).join('')}</tbody></table></div>
    </details>`;
}

// Calcul « en points » de Pronote reproduit dans le carnet : chaque coefficient est multiplié par barème / barème le plus courant
// (ex. devoirs sur 10 et un sur 5 : le devoir sur 5 compte pour moitié). Les moyennes sont alors les mêmes que dans Pronote.
function coefsCommePronote(lues) {
  const compte = new Map();
  lues.forEach(x => compte.set(x.max, (compte.get(x.max) || 0) + 1));
  const ref = [...compte].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
  lues.forEach(x => { x.coef = Math.round(x.coef * (x.max / ref) * 1000) / 1000; });
}

// Compétence d'une colonne : celle du référentiel (identifiant connu), sinon une compétence « libre » de l'évaluation.
function competenceColonne(col) {
  if (col.id && REFERENTIEL.attendu(col.id)) return { id: col.id };
  const texte = (col.id.startsWith('libre:') ? col.id.slice(6) : col.texte || col.code).trim();
  return texte ? { id: 'libre:' + texte, libre: texte } : null;
}

// Prépare l'import dans la classe c : évaluations à créer / mettre à jour, élèves reconnus ou inconnus.
// Élèves de la classe en double, créés par un ancien import (« NOM Prénom( 1MARINE ) » à côté de « NOM Prénom ») :
// Map id du doublon → élève d'origine (un seul élève d'origine possible).
function doublonsDeClasse(eleves) {
  const res = new Map();
  for (const dbl of eleves.filter(nomAvecClasse)) {
    const origine = eleves.filter(el => el !== dbl && !nomAvecClasse(el) && motsNom(el.nom, el.prenom) === motsNom(dbl.nom, dbl.prenom));
    if (origine.length === 1) res.set(dbl.id, origine[0]);
  }
  return res;
}

// Doublons à fusionner pendant l'import en cours (id de l'élève d'origine → id du doublon) : la note du carnet
// d'un élève d'origine est alors celle de son doublon si lui n'en a pas (vérification des moyennes, comparaisons).
let fusionImport = new Map();
const noteCarnetImport = (evalId, eleveId, attendu) =>
  Donnees.note(evalId, eleveId, attendu) || (fusionImport.has(eleveId) ? Donnees.note(evalId, fusionImport.get(eleveId), attendu) : '');

// Fusion : chaque note, degré ou suivi du doublon va à l'élève d'origine (s'il n'a rien à cette place), puis le doublon est supprimé.
function fusionnerDoublons(doublons) {
  for (const [idDbl, origine] of doublons) {
    for (const n of Donnees.liste('notes', n => n.eleveId === idDbl)) {
      if (n.valeur && !Donnees.note(n.evalId, origine.id, n.attendu)) {
        const { id, evalId, eleveId, valeur, attendu, maj, ...extra } = n;
        Donnees.ecrireNote(evalId, origine.id, valeur, attendu, extra);
      }
    }
    supprimerNotes(n => n.eleveId === idDbl);
    for (const s of Donnees.liste('suivis', x => x.eleveId === idDbl)) Donnees.supprimer('suivis', s.id);
    Donnees.supprimer('eleves', idDbl);
  }
}

function preparerImportNotes(lues, c) {
  const eleves = elevesDe(c.id);
  const doublons = doublonsDeClasse(eleves);
  const parId = new Map(eleves.map(el => [el.id, el]));
  const parNom = new Map(eleves.filter(el => !doublons.has(el.id)).map(el => [sansAccent(el.nom) + '|' + sansAccent(el.prenom), el]));
  // Sinon, par les mots du nom complet (le relevé écrit parfois tout en majuscules, et le prénom ne s'en distingue plus).
  const parMots = new Map();
  for (const el of eleves) if (!doublons.has(el.id)) { const k = motsNom(el.nom, el.prenom); parMots.set(k, [...(parMots.get(k) || []), el]); }
  const parMotsUnique = k => { const v = parMots.get(k) || []; const propres = v.filter(el => !nomAvecClasse(el)); return propres.length === 1 ? propres[0] : !propres.length && v.length === 1 ? v[0] : null; };
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
      const parSonId = l.id && parId.get(l.id);
      l.eleve = (parSonId && (doublons.get(parSonId.id) || parSonId)) || parNom.get(cle) || parMotsUnique(motsNom(l.nom, l.prenom)) || null;
      if (l.eleve) reconnus.add(l.eleve.id); else inconnus.set(cle, { nom: l.nom, prenom: l.prenom });
      l.cle = cle;
    }
    x.colonnes.forEach(col => { col.comp = competenceColonne(col); });
    return { ...x, id, cible };
  });
  return { evals, reconnus, inconnus, doublons };
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
      max: x.max, coef: x.coef, nonSignificative: x.nonSignificative ?? e.nonSignificative,
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
    if (v && v !== noteCarnetImport(x.cible.id, l.eleve.id)) n++;
    x.colonnes.forEach((col, k) => {
      const d = String(l.degres[k] || '').trim();
      if (d && col.comp && d !== noteCarnetImport(x.cible.id, l.eleve.id, col.comp.id)) n++;
    });
  }
  return n;
}

// x.cas : 'nouvelle' | 'doublon' (copie exacte d'une autre colonne du fichier) | 'identique' (déjà dans le carnet)
//         | 'conflit-carnet' (dans le carnet, avec des notes différentes) | 'conflit-fichier' (même titre et date qu'une autre colonne, notes différentes).
// Mêmes notes que l'évaluation e du carnet (barème identique, au moins 2 notes comparées, aucune différence) :
// c'est elle, même si le prof l'a renommée dans le carnet ou en a changé le coefficient.
function memesNotes(x, e) {
  if (e.max !== x.max) return false;
  let comparees = 0;
  for (const l of x.lignes) {
    if (!l.eleve) continue;
    const v = valeurImport(l.note, x.max), dans = noteCarnetImport(e.id, l.eleve.id);
    if (!v && !dans) continue;
    if (v !== dans) return false;
    comparees++;
  }
  return comparees >= 2;
}

function analyserDoublonsImport(plan, c) {
  const vus = new Map(), dejaPrises = new Set();
  const duCarnet = evalsDe(c.id);
  // (Une évaluation déjà importée « à part » s'appelle « Titre (2) », « Titre (3) »… : elle compte aussi.)
  const variantes = x => duCarnet.filter(e => e.date === x.date && sansAccent(e.titre).replace(/\s*\(\d+\)$/, '') === sansAccent(x.titre));
  const dejaIdentique = x => variantes(x).find(e => !dejaPrises.has(e.id) && differencesCarnet({ ...x, cible: e }) === 0)
    // Renommée dans le carnet (ou coefficient changé) : même date, mêmes notes.
    || duCarnet.find(e => !dejaPrises.has(e.id) && e.date === x.date && memesNotes(x, e));
  for (const x of plan.evals) {
    const cle = sansAccent(x.titre) + '|' + x.date, avant = vus.get(cle) || [];
    const jumelle = !x.cible || differencesCarnet(x) ? dejaIdentique(x) : null;
    if (avant.some(y => empreinteImport(y) === empreinteImport(x))) x.cas = 'doublon';
    else if (jumelle) { x.cible = jumelle; x.id = jumelle.id; x.cas = 'identique'; x.renommee = sansAccent(jumelle.titre) !== sansAccent(x.titre) ? jumelle.titre : ''; }
    else if (avant.length) x.cas = 'conflit-fichier';
    else if (x.cible) { x.diff = differencesCarnet(x); x.cas = x.diff ? 'conflit-carnet' : 'identique'; }
    else x.cas = 'nouvelle';
    // Mêmes notes mais autre coefficient, ou « non significative » d'un côté seulement (colonne bleue d'École Directe).
    if (x.cas === 'identique' && x.cible.max === x.max && ((x.cible.coef ?? 1) !== x.coef
      || (x.nonSignificative !== undefined && !!x.cible.nonSignificative !== x.nonSignificative))) x.cas = 'coef';
    if (x.cible) dejaPrises.add(x.cible.id);
    avant.push(x);
    vus.set(cle, avant);
  }
}

const LIBELLES_CAS_IMPORT = {
  nouvelle: () => '🆕 Nouvelle : sera ajoutée',
  doublon: () => '♊ En double dans le fichier (même titre, même date, mêmes notes) : pas recopiée',
  identique: x => `✔ Déjà dans le carnet${x.renommee ? ` (sous le nom « ${x.renommee} »)` : ''}, mêmes notes : pas réimportée`,
  'conflit-carnet': x => `⚠ Déjà dans le carnet, avec ${x.diff} différence${x.diff > 1 ? 's' : ''} : gardée telle qu’elle est dans le carnet (sauf si tu choisis de la mettre à jour)`,
  'conflit-fichier': () => '⚠ À vérifier : même titre et même date qu’une autre colonne du fichier, mais notes différentes',
  coef: x => `✔ Déjà dans le carnet${x.renommee ? ` (sous le nom « ${x.renommee} »)` : ''}, mêmes notes, mais dans le carnet : coef ${fmt(x.cible.coef ?? 1)}${x.cible.nonSignificative ? ', non significative' : ', comptée dans la moyenne'}`,
};
// (Le premier choix est celui proposé par défaut : une évaluation déjà dans le carnet n'est jamais réimportée sans qu'on le demande.)
const CHOIX_CAS_IMPORT = {
  nouvelle: [['importer', 'Importer'], ['ignorer', 'Ne pas importer']],
  doublon: [['ignorer', 'Ne pas importer'], ['a-part', 'Importer quand même, à part']],
  identique: [['ignorer', 'Ne pas importer'], ['importer', 'Réimporter quand même']],
  'conflit-carnet': [['ignorer', 'Ne pas importer (garder le carnet)'], ['importer', 'Mettre à jour l’évaluation du carnet'], ['a-part', 'Importer à part (nouvelle évaluation)']],
  'conflit-fichier': [['', '— Choisir —'], ['a-part', 'Importer aussi, à part'], ['ignorer', 'Ne pas importer']],
  // (Seul le coefficient change : proposé d'office, pour retrouver les moyennes du fichier.)
  coef: [['coef', 'Prendre le réglage du fichier'], ['ignorer', 'Garder le carnet tel quel']],
};

async function importerNotesExcel(c, fichier) {
  let feuilles;
  try { feuilles = await lireClasseurNotes(fichier); } catch (e) {
    throw new Error(`« ${fichier.name} » n’a pas pu être lu : ${e.message || e}`);
  }
  if (estAnonyme(feuilles)) throw new Error('Ce classeur est un export anonyme : il ne peut pas être réimporté (l’appli ne saurait pas à quels élèves rattacher les notes).');
  // Classeur de l'appli (un onglet par évaluation), sinon relevé de notes d'École Directe (une colonne par évaluation).
  let lues = lireEvalsExcel(feuilles);
  if (!lues.length) lues = lireNotesPronote(feuilles);
  if (!lues.length) lues = lireNotesEcoleDirecte(feuilles);
  if (!lues.length) throw new Error(`Aucune évaluation trouvée dans « ${fichier.name} » : il faut le classeur exporté par l’appli, le relevé de notes de Pronote (dates des devoirs, puis « 1 - /10 » dessous) ou celui d’École Directe (lignes « Coefficients » et « Noté sur » sous les titres des évaluations).`);
  // Relevé avec une colonne Moyenne (Pronote, École Directe) : la moyenne du fichier sert de référence.
  // Deux calculs possibles : « points » (total des points / total des barèmes, comme Pronote : un devoir sur 5 compte
  // moitié moins qu'un sur 10 → coefficients adaptés au barème) ou « sur 20 » (coefficients du fichier, calcul habituel du carnet).
  const verif = lues[0].verifPronote;
  const baremesDifferents = new Set(lues.map(x => x.max)).size > 1;
  lues.forEach(x => { x.coefFichier = x.coef; });
  if (baremesDifferents) { coefsCommePronote(lues); lues.forEach(x => { x.coefPoints = x.coef; x.coef = x.coefFichier; }); }
  const enPoints = !!verif?.total && baremesDifferents
    && (verif.points > verif.sur20 || (verif.points === verif.sur20 && verif.prefere === 'points'));
  if (enPoints) lues.forEach(x => { x.coef = x.coefPoints; });
  const plan = preparerImportNotes(lues, c);
  // Élèves en double créés par un ancien import : comptés comme fusionnés (case cochée d'office) pour les comparaisons.
  const doublonsVers = () => new Map([...plan.doublons].map(([idDbl, origine]) => [origine.id, idDbl]));
  fusionImport = doublonsVers();
  try {
    analyserDoublonsImport(plan, c);
    return await dialogueImportNotes(c, fichier, plan, { verif, baremesDifferents, enPoints, doublonsVers });
  } finally { fusionImport = new Map(); }
}

// Relevé (toutes les évaluations choisies dans École Directe) ou bulletin de période (Trimestre 1…) :
// le dire, et signaler les évaluations datées hors de cette période du carnet (dates des périodes à vérifier dans ⚙ Réglages).
function htmlPeriodeFichier(plan) {
  const pf = plan.evals[0]?.periodeFichier;
  if (!pf) return '';
  if (pf.type === 'releve') return '<li>Fichier École Directe : <b>relevé de notes</b> — la moyenne de chaque élève porte sur les évaluations du fichier.</li>';
  const nom = `${pf.type === 'trimestre' ? 'Trimestre' : 'Semestre'} ${pf.n}`;
  const p = periodesAnnee().find(x => x.id === 'P' + pf.n);
  const memeType = p && (p.code[0] === 'T') === (pf.type === 'trimestre');
  const dehors = memeType ? plan.evals.filter(x => periodeDe(x.date) !== p.id) : [];
  return `<li>Fichier École Directe : <b>${nom}</b> — la moyenne de chaque élève est celle du ${pf.type}.</li>
    ${!memeType ? `<li class="alerte-import">⚠ Le carnet est réglé en ${periodesAnnee()[0].code[0] === 'T' ? 'trimestres' : 'semestres'} : vérifie les périodes dans ⚙ Réglages.</li>`
      : dehors.length ? `<li class="alerte-import">⚠ ${dehors.length} évaluation${dehors.length > 1 ? 's' : ''} du fichier ${dehors.length > 1 ? 'sont datées' : 'est datée'} hors du ${p.code} du carnet (${esc(p.texte)}) :
        ${dehors.slice(0, 5).map(x => esc(`${x.titre} (${dateCourte(x.date)})`)).join(', ')}${dehors.length > 5 ? '…' : ''}. Vérifie les dates des périodes dans ⚙ Réglages.</li>` : ''}`;
}

async function dialogueImportNotes(c, fichier, plan, { verif, baremesDifferents, enPoints, doublonsVers }) {
  const totalEleves = plan.reconnus.size + plan.inconnus.size;
  const inconnus = [...plan.inconnus.values()];
  const nbCas = cas => plan.evals.filter(x => x.cas === cas).length;
  const aVerifier = nbCas('conflit-fichier');
  // Réimport en cours d'année : colonnes du fichier = évaluations déjà dans le carnet + nouvelles (+ doublons du fichier).
  const dejaLa = nbCas('identique') + nbCas('conflit-carnet') + nbCas('coef');
  const absentes = evalsDe(c.id).filter(e => !plan.evals.some(x => x.cible?.id === e.id)).length;
  const horsMoy = plan.evals.filter(x => x.nonSignificative && x.periodeFichier !== undefined);
  const s = n => (n > 1 ? 's' : '');
  const { d, resultat } = ouvrirModale(`Importer dans ${c.nom}`, `
    <p><b>${esc(fichier.name)}</b></p>
    <ul class="bilan-import">
      ${htmlPeriodeFichier(plan)}
      ${horsMoy.length ? `<li>${horsMoy.length} évaluation${s(horsMoy.length)} <b>non comptée${s(horsMoy.length)} dans la moyenne</b> d’École Directe
        (colonne bleue) : ${horsMoy.length > 1 ? 'importées' : 'importée'} comme <b>note non significative</b> — note entre parenthèses, hors moyenne.</li>` : ''}
      <li><b>${plan.evals.length} colonne${s(plan.evals.length)} d’évaluation</b> dans le fichier = ${[
        `${dejaLa} déjà dans le carnet`,
        `<b>${nbCas('nouvelle')} nouvelle${s(nbCas('nouvelle'))}</b>`,
        nbCas('doublon') && `${nbCas('doublon')} en double dans le fichier`,
        aVerifier && `<b>${aVerifier} à vérifier</b>`].filter(Boolean).join(' + ')}</li>
      ${dejaLa ? `<li>Les évaluations déjà dans le carnet ne sont <b>pas réimportées</b>${nbCas('conflit-carnet') ? ` (${nbCas('conflit-carnet')} ${nbCas('conflit-carnet') > 1 ? 'ont' : 'a'} des notes différentes dans le carnet : à toi de voir si tu veux les mettre à jour)` : ''} ; seules les nouvelles sont ajoutées.</li>` : ''}
      ${absentes && dejaLa ? `<li class="aide">${absentes} évaluation${s(absentes)} du carnet ${absentes > 1 ? 'ne sont' : 'n’est'} pas dans ce fichier : ${absentes > 1 ? 'elles restent' : 'elle reste'} dans le carnet.</li>` : ''}
      <li>${plan.reconnus.size} élève${s(plan.reconnus.size)} reconnu${s(plan.reconnus.size)} sur ${totalEleves}</li>
    </ul>
    <fieldset class="choix-import"><legend>Évaluations du fichier</legend>
      <p class="aide">Seules les évaluations <b>nouvelles</b> sont importées : une évaluation déjà dans le carnet (même date, mêmes notes,
        même si tu l’as renommée) n’est pas recopiée. ${aVerifier ? '<b>⚠ Choisis quoi faire pour celles marquées « à vérifier ».</b>' : ''}</p>
      <ul class="liste-evals-import">${plan.evals.map((x, i) => `<li class="cas-${x.cas}">
        <span><b>${esc(x.titre)}</b> <span class="aide">${esc(dateCourte(x.date))} · /${fmt(x.max)} · coef <span data-coef-import="${i}">${fmt(x.coef)}</span></span><br>
          <small>${esc(LIBELLES_CAS_IMPORT[x.cas](x))}${x.nonSignificative ? ' · note non significative (hors moyenne)' : ''}</small></span>
        <select name="act-${i}" ${x.cas.startsWith('conflit') ? 'required' : ''} aria-label="Que faire de ${esc(x.titre)} du ${esc(dateCourte(x.date))}">
          ${CHOIX_CAS_IMPORT[x.cas].map(([v, nom]) => `<option value="${v}">${esc(nom)}</option>`).join('')}</select></li>`).join('')}</ul>
    </fieldset>
    <fieldset class="choix-import"><legend>Que reprendre ?</legend>
      <label class="case"><input type="radio" name="quoi" value="tout" checked><span>Les évaluations <b>et les notes / degrés</b> des élèves</span></label>
      <label class="case"><input type="radio" name="quoi" value="structure"><span>Seulement <b>les évaluations</b> (titres, dates, barèmes, compétences) — pour reprendre les évaluations d’un collègue avec tes élèves</span></label>
    </fieldset>
    ${verif?.total ? `<fieldset class="choix-import"><legend>Vérification des moyennes</legend>
      <p class="aide">La moyenne de chaque élève <b>dans le fichier</b> sert de référence. Le carnet doit retrouver la même <b>après l’import</b>,
        sur ces devoirs : évaluations déjà dans le carnet (avec leurs notes du carnet) + nouvelles. Elle se recalcule si tu changes un choix ci-dessus.</p>
      ${baremesDifferents ? `<label class="case"><input type="radio" name="calcul" value="points" ${enPoints ? 'checked' : ''}><span><b>Les points s’additionnent</b> (calcul de Pronote) :
          un devoir sur 5 compte moitié moins qu’un devoir sur 10 — coefficients adaptés
          (${[...new Map(plan.evals.map(x => [x.max, x])).values()].map(x => `/${fmt(x.max)} → coef ${fmt(x.coefPoints)}`).join(', ')})</span></label>
        <label class="case"><input type="radio" name="calcul" value="sur20" ${enPoints ? '' : 'checked'}><span><b>Chaque note ramenée sur 20</b>, avec les coefficients du fichier</span></label>` : ''}
      <div data-verif-moyennes>${htmlVerifMoyennes(moyennesAComparer(plan.evals, x => CHOIX_CAS_IMPORT[x.cas][0][0]))}</div>
    </fieldset>` : ''}
    ${inconnus.length ? `<div class="inconnus-import">
      <p>${inconnus.length} élève${inconnus.length > 1 ? 's' : ''} du fichier ${inconnus.length > 1 ? 'ne sont' : 'n’est'} pas dans ${esc(c.nom)} :
        <span class="aide">${inconnus.slice(0, 12).map(el => esc(`${el.nom} ${el.prenom}`.trim())).join(', ')}${inconnus.length > 12 ? '…' : ''}</span></p>
      <label class="case"><input type="checkbox" name="ajouter"> Les ajouter à la classe (sinon leurs lignes sont ignorées)</label>
    </div>` : ''}
    ${plan.doublons.size ? `<fieldset class="choix-import"><legend>Élèves en double</legend>
      <p class="aide">${plan.doublons.size} élève${s(plan.doublons.size)} de ${esc(c.nom)} ${plan.doublons.size > 1 ? 'sont' : 'est'} en double, avec la classe d’origine entre parenthèses
        (créé${s(plan.doublons.size)} par un import précédent) : ${[...plan.doublons].slice(0, 8).map(([idDbl]) => { const el = Donnees.get('eleves', idDbl); return esc(`${el.nom} ${el.prenom}`.trim()); }).join(', ')}${plan.doublons.size > 8 ? '…' : ''}</p>
      <label class="case"><input type="checkbox" name="fusionner" checked><span><b>Les fusionner</b> avec l’élève d’origine : leurs notes lui reviennent
        (sans écraser les siennes), puis la ligne en double est supprimée.</span></label>
    </fieldset>` : ''}
    <p class="aide">Rien n’est effacé : une case vide dans le fichier laisse la valeur du carnet telle quelle.</p>`,
  boutonsModale('Importer'));
  // Changement de calcul ou d'un choix : coefficients et comparaison des moyennes mis à jour aussitôt.
  const majVerif = () => {
    const zone = d.querySelector('[data-verif-moyennes]');
    if (!zone) return;
    const ouvert = d.querySelector('.verif-moyennes')?.open;
    zone.innerHTML = htmlVerifMoyennes(moyennesAComparer(plan.evals, x => d.querySelector(`[name="act-${plan.evals.indexOf(x)}"]`)?.value || ''));
    if (ouvert) d.querySelector('.verif-moyennes').open = true;
  };
  d.querySelectorAll('[name="calcul"]').forEach(btn => btn.addEventListener('change', () => {
    plan.evals.forEach((x, i) => {
      x.coef = btn.value === 'points' ? x.coefPoints : x.coefFichier;
      const span = d.querySelector(`[data-coef-import="${i}"]`);
      if (span) span.textContent = fmt(x.coef);
    });
    majVerif();
  }));
  d.querySelectorAll('[name^="act-"]').forEach(sel => sel.addEventListener('change', majVerif));
  d.querySelector('[name="fusionner"]')?.addEventListener('change', e => { fusionImport = e.target.checked ? doublonsVers() : new Map(); majVerif(); });
  const r = await resultat;
  if (r.action !== 'ok') return;
  const fusionnes = r.data.fusionner === 'on' ? plan.doublons.size : 0;
  if (fusionnes) fusionnerDoublons(plan.doublons);
  // Les choix de l'enseignant : ignorer, mettre à jour l'évaluation du carnet, ou importer à part (titre « … (2) »).
  const pris = new Set(evalsDe(c.id).map(e => sansAccent(e.titre) + '|' + e.date));
  let coefsChanges = 0;
  plan.evals = plan.evals.filter((x, i) => {
    const choix = r.data['act-' + i];
    if (choix === 'coef') { Donnees.ecrire('evals', { ...x.cible, coef: x.coef, nonSignificative: x.nonSignificative ?? x.cible.nonSignificative }); coefsChanges++; return false; }
    if (!choix || choix === 'ignorer') return false;
    if (choix === 'a-part') {
      let n = 2, titre;
      do titre = `${x.titre} (${n++})`; while (pris.has(sansAccent(titre) + '|' + x.date));
      Object.assign(x, { titre, cible: null, id: Donnees.nouvelId() });
    }
    pris.add(sansAccent(x.titre) + '|' + x.date);
    return true;
  });
  const avant = [
    fusionnes && `${fusionnes} élève${s(fusionnes)} en double fusionné${s(fusionnes)}`,
    coefsChanges && `${coefsChanges} évaluation${s(coefsChanges)} corrigée${s(coefsChanges)} (coefficient, non significative)`,
  ].filter(Boolean);
  if (!plan.evals.length) {
    rendre();
    return avant.length ? toast('Import terminé : ' + avant.join(', ') + '.', 'ok')
      : toast('Rien à importer : toutes les évaluations du fichier sont déjà dans le carnet ou ont été laissées de côté.');
  }
  const bilan = appliquerImportNotes(plan, c, { structure: r.data.quoi === 'structure', ajouterInconnus: r.data.ajouter === 'on' });
  rendre();
  const morceaux = [
    ...avant,
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

// Bouton « 📥 Importer mes notes » de l'onglet Notes (import École Directe / Pronote, et export Excel).
async function echangeExcelNotes() {
  const c = classeActive();
  let fichier = null;
  const { d, resultat } = ouvrirModale(`📥 Importer mes notes — ${c.nom}`, `
    <div class="bloc-excel">
      <h3>⬆ Importer</h3>
      <p><b>Import de toutes ses notes d’École Directe ou de Pronote</b> : le relevé de notes exporté de Pronote (.xlsx ou .csv,
        ou le tableau copié puis collé dans un fichier .txt) ou d’École Directe (une colonne par évaluation).</p>
      <p class="aide">Aussi : un classeur de notes exporté par ${esc(profil().carnet)} (le tien, éventuellement complété dans Excel, ou celui d’un collègue).
        Tu verras ce qui sera repris, et la vérification des moyennes, avant de valider.</p>
      <label class="bouton primaire">Choisir un fichier .xlsx, .xls, .csv ou .txt…<input type="file" accept=".xlsx,.xls,.csv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,text/plain" data-fichier-excel hidden></label>
    </div>
    <div class="bloc-excel">
      <h3>⬇ Exporter</h3>
      <p class="aide">Toutes les évaluations de la classe dans un classeur .xlsx : une synthèse avec les moyennes, puis un onglet
        par évaluation (note et degrés de maîtrise). À garder, à ouvrir dans Excel ou LibreOffice, à donner à un collègue.</p>
      <p class="aide">⚠ Le classeur n’est pas chiffré, contrairement au carnet sur la clé : ne le laisse pas traîner.</p>
      <label class="case"><input type="checkbox" name="anonyme"> <span><b>Anonyme</b> — sans noms ni dispenses, pour partager (ne se réimporte pas)</span></label>
      <button value="exporter">Exporter ${esc(c.nom)}</button>
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
