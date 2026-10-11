'use strict';
// Échange avec Excel : les notes et les degrés de maîtrise d'une classe en classeur .xlsx (bouton « ⇅ Excel » de l'onglet Notes).
// Même principe que pour les leçons (entrainement.js) :
//   un onglet « Lisez-moi », un onglet « Synthèse » (moyennes, pour lire seulement), puis un onglet par évaluation :
//   élèves en lignes ; colonnes Note, puis un degré (1 à 4) par compétence travaillée.
//   La colonne A et une ligne masquées gardent les identifiants : un fichier réimporté met à jour ses évaluations
//   au lieu de les doubler. À l'import, rien n'est effacé : une case vide laisse la valeur du carnet telle quelle.
// (Fichier chargé avant app.js ; il se sert aussi des outils Excel d'entrainement.js : sansAccent, dateFr, lireDateExcel.)

const CODES_NOTE_EXCEL = { A: 'ABS', ABS: 'ABS', ABSENT: 'ABS', D: 'DISP', DISP: 'DISP', 'DISPENSÉ': 'DISP', DISPENSE: 'DISP', N: 'NE', NE: 'NE', NN: 'NE', 'NON NOTÉ': 'NE', 'NON NOTE': 'NE',
  B: 'BLE', BLE: 'BLE', 'BLESSÉ': 'BLE', BLESSE: 'BLE', M: 'MAL', MAL: 'MAL', MALADE: 'MAL', O: 'AUT', AUT: 'AUT', AUTRE: 'AUT', R: 'NR', NR: 'NR', 'NON RENDU': 'NR' };
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

async function importerNotesExcel(c, fichier) {
  let feuilles;
  try { feuilles = await Tableur.lire(fichier); } catch (e) {
    throw new Error(`« ${fichier.name} » n’a pas pu être lu : ${e.message || e}`);
  }
  if (estAnonyme(feuilles)) throw new Error('Ce classeur est un export anonyme : il ne peut pas être réimporté (l’appli ne saurait pas à quels élèves rattacher les notes).');
  const lues = lireEvalsExcel(feuilles);
  if (!lues.length) throw new Error(`Aucune évaluation trouvée dans « ${fichier.name} » (il faut un onglet avec des colonnes « Nom », « Prénom » et « Note »).`);
  const plan = preparerImportNotes(lues, c);
  const nbMaj = plan.evals.filter(x => x.cible).length, nbNeuves = plan.evals.length - nbMaj;
  const totalEleves = plan.reconnus.size + plan.inconnus.size;
  const inconnus = [...plan.inconnus.values()];
  const { resultat } = ouvrirModale(`Importer dans ${c.nom}`, `
    <p><b>${esc(fichier.name)}</b></p>
    <ul class="bilan-import">
      <li>${plan.evals.length} évaluation${plan.evals.length > 1 ? 's' : ''} :
        ${nbNeuves ? `${nbNeuves} nouvelle${nbNeuves > 1 ? 's' : ''}` : ''}${nbNeuves && nbMaj ? ', ' : ''}${nbMaj ? `${nbMaj} déjà dans le carnet (mise${nbMaj > 1 ? 's' : ''} à jour)` : ''}</li>
      <li>${plan.reconnus.size} élève${plan.reconnus.size > 1 ? 's' : ''} reconnu${plan.reconnus.size > 1 ? 's' : ''} sur ${totalEleves}</li>
    </ul>
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
      <p class="aide">Un classeur de notes exporté par ${esc(profil().carnet)} (le tien, éventuellement complété dans Excel, ou celui d’un collègue).
        Tu verras ce qui sera repris avant de valider.</p>
      <label class="bouton primaire">Choisir un fichier .xlsx…<input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" data-fichier-excel hidden></label>
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
