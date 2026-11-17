'use strict';
// Liste de classe exportée d'École Directe (classeur .xlsx) ou de Pronote (.csv ou .xlsx) → fiches élèves.
// Le fichier est lu ici, dans le navigateur : il ne quitte jamais l'appareil.
//
// Attendu : quelques lignes d'informations (« Classe : 6ème A », « Effectif : 34 élèves »…), puis une ligne
// d'en-têtes — Nom (« NOM Prénom »), Date de naissance, Sexe, Âge, Régime, Classe, Dispositifs,
// Responsable 1, Téléphone, Email, Adresse, Responsable 2, Téléphone, Email, Adresse — puis un élève par ligne.
// Les colonnes sont retrouvées par leur titre (l'ordre peut changer) ; celles qu'on ne connaît pas sont ignorées.
//
// Sur la fiche élève : naissance (AAAA-MM-JJ ; l'âge est calculé), regime, dispositifs (texte), responsables
// [{ nom, tel, email, adresse }]. Dispositifs : « PAI » coche PAI ; les autres (PAP, PPS, ULIS…) cochent BEP.
// Ce que l'on reprend se choisit à chaque import (minimisation des données) ; le choix est retenu.
// (Fichier chargé avant app.js : il n'utilise les outils d'app.js qu'au moment des appels.)

const ListeClasse = (() => {
  // « NOM Prénom » : le nom va jusqu'au dernier mot écrit en majuscules (« de LA FONTAINE Jean-Marie » compris).
  function separerNom(texte) {
    const mots = String(texte || '').trim().split(/\s+/).filter(Boolean);
    const enMajuscules = m => /\p{L}/u.test(m) && m === m.toLocaleUpperCase('fr') && m !== m.toLocaleLowerCase('fr');
    let dernier = -1;
    mots.forEach((m, k) => { if (enMajuscules(m)) dernier = k; });
    if (dernier < 0) dernier = 0;
    return { nom: mots.slice(0, dernier + 1).join(' '), prenom: mots.slice(dernier + 1).join(' ') };
  }

  // Les tableurs perdent le 0 des numéros enregistrés comme nombres : 612345678 → 06 12 34 56 78.
  function telephone(brut) {
    let t = String(brut || '').trim();
    if (/^[1-9]\d{8}$/.test(t)) t = '0' + t;
    return /^0\d{9}$/.test(t) ? t.replace(/(\d{2})(?=\d)/g, '$1 ') : t;
  }

  // « 6ème A » → nom « 6A », niveau « 6e ».
  function nomEtNiveau(classe) {
    const t = String(classe || '').trim();
    // École : « CE2 A », « CE1 CE2 », « CE1-CE2 » → niveau de la liste de l'école.
    if (avecEcole()) {
      const vus = sansAccent(t).toUpperCase().match(/\b(CP|CE1|CE2|CM1|CM2)\b/g) || [], cle = vus.join('-');
      return { nom: t, niveau: niveauxProposes().includes(cle) ? cle : '' };
    }
    const m = t.match(/^(\d)\s*(?:(?:ième|ieme|ème|eme|è|e)(?![a-zà-ÿ]))?\s*(.*)$/i);
    if (m && '3456'.includes(m[1])) return { nom: (m[1] + m[2].replace(/\s+/g, '')).toUpperCase(), niveau: m[1] + 'e' };
    const s = sansAccent(t);
    const niveau = /^(2|seconde|2nde)/.test(s) ? '2nde' : /^(1|premiere|1re|1ere)/.test(s) ? '1re' : /^(t|terminale)/.test(s) ? 'Tle' : '';
    return { nom: t, niveau };
  }

  // Sexe : F / G, Fille / Garçon, Masculin / Féminin, H, ou code 1 (garçon) / 2 (fille) des fichiers de l'Éducation nationale.
  const sexeLu = s => ({ 1: 'G', 2: 'F', H: 'G' })[String(s).trim().toUpperCase()] || normSexe(s);

  // Titre de colonne → champ (les colonnes Téléphone / Email / Adresse suivent leur « Responsable N »).
  function colonnes(entetes) {
    const res = { responsables: [] };
    let resp = null;
    entetes.forEach((brut, k) => {
      const t = sansAccent(brut);
      if (!t) return;
      const r = t.match(/^(responsable|resp\.?|representant)\s*(?:legal\s*)?(\d)?/);
      if (r) { resp = { nom: k }; res.responsables.push(resp); return; }
      if (resp && /^(tel|telephone|portable|mobile)/.test(t)) { if (resp.tel === undefined) resp.tel = k; return; }
      if (resp && /^(e-?mail|courriel|mail)/.test(t)) { if (resp.email === undefined) resp.email = k; return; }
      if (resp && /^adresse/.test(t)) { if (resp.adresse === undefined) resp.adresse = k; return; }
      if (estColNom(t)) res.nom ??= k;
      else if (t === 'prenom' || t === 'prenoms' || t === 'prenom eleve') res.prenom ??= k; // (ONDE : « Prénom élève »)
      else if (t.includes('naissance') || /^ne(\s*\(e\)|e)?\s+le/.test(t)) res.naissance ??= k; // (Pronote : « Né(e) le »)
      else if (t === 'sexe' || t === 'genre') res.sexe ??= k;
      else if (t.startsWith('regime')) res.regime ??= k;
      else if (t.startsWith('dispositif') || t.startsWith('projet')) res.dispositifs ??= k; // (Pronote : « Projets d'accompagnement »)
      else if (t === 'classe') res.classe ??= k;
      else if (t === 'niveau' || t.startsWith('niveau ')) res.niveau ??= k; // (école : CP, CE1…)
    });
    return res;
  }

  const estColNom = t => ['nom', 'noms', 'eleve', 'eleves', 'nom eleve', 'nom prenom', 'nom et prenom', 'nom - prenom', 'nom, prenom', 'nom prenom eleve'].includes(t);
  // Ligne de titres : une colonne « Nom » (ou « Élève ») et au moins une autre colonne connue.
  const estTitres = l => l?.some(c => estColNom(sansAccent(c)))
    && l.some(c => /naissance|^ne(\s*\(e\)|e)?\s+le|^sexe$|^genre$|^prenoms?( eleve)?$|^classe$|^regime/.test(sansAccent(c)));

  // Texte CSV (Pronote) → lignes de cases. Séparateur deviné (; tabulation ,), guillemets gérés.
  function lireCsv(texte) {
    const debut = texte.split(/\r?\n/).slice(0, 10).join('\n');
    const sep = [';', '\t', ','].map(s => [s, debut.split(s).length]).sort((a, b) => b[1] - a[1])[0][0];
    const lignes = [];
    let ligne = [], champ = '', guillemets = false;
    for (let i = 0; i < texte.length; i++) {
      const x = texte[i];
      if (guillemets) {
        if (x === '"' && texte[i + 1] === '"') { champ += '"'; i++; } else if (x === '"') guillemets = false; else champ += x;
      } else if (x === '"') guillemets = true;
      else if (x === sep) { ligne.push(champ.trim()); champ = ''; }
      else if (x === '\n' || x === '\r') {
        if (x === '\r' && texte[i + 1] === '\n') i++;
        ligne.push(champ.trim()); lignes.push(ligne); ligne = []; champ = '';
      } else champ += x;
    }
    if (champ || ligne.length) { ligne.push(champ.trim()); lignes.push(ligne); }
    return lignes.filter(l => l.some(Boolean));
  }

  /* ---------- Fichiers XML ----------
     Trois sortes : classeur Excel enregistré « en XML » (Feuille de calcul XML 2003 : Worksheet › Table › Row › Cell › Data),
     page web déguisée en « .xls » (tableaux HTML), ou XML « un élève par balise » (SIECLE, ONDE, autres logiciels) :
     <ELEVE><NOM_DE_FAMILLE>…</NOM_DE_FAMILLE><PRENOM>…</PRENOM>… — les noms des balises servent de titres de colonnes. */
  const NS_SS = 'urn:schemas-microsoft-com:office:spreadsheet';
  const enfants = (el, nom) => [...el.children].filter(e => e.localName === nom);
  const attrSs = (el, n) => el.getAttributeNS(NS_SS, n) || el.getAttribute('ss:' + n) || '';

  function feuillesSpreadsheetMl(feuilles) {
    return feuilles.map((w, i) => {
      const lignes = [];
      for (const row of enfants(w, 'Table').flatMap(t => enfants(t, 'Row'))) {
        const n = +attrSs(row, 'Index');
        while (n && lignes.length < n - 1) lignes.push([]);
        const l = [];
        for (const cell of enfants(row, 'Cell')) {
          const k = +attrSs(cell, 'Index');
          while (k && l.length < k - 1) l.push('');
          const data = enfants(cell, 'Data')[0];
          let v = data ? data.textContent.replace(/\s+/g, ' ').trim() : '';
          if (data && attrSs(data, 'Type') === 'DateTime') v = v.slice(0, 10); // (2012-05-03T00:00:00.000)
          l.push(v, ...Array(+attrSs(cell, 'MergeAcross') || 0).fill(''));
        }
        lignes.push(l);
      }
      return { nom: attrSs(w, 'Name') || 'Feuille ' + (i + 1), lignes };
    });
  }

  // Nom de balise → titre de colonne que colonnes() connaît (NOM_DE_FAMILLE → Nom, DATE_NAISS → Date de naissance…).
  function titreBalise(brut) {
    const t = sansAccent(String(brut).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_.'-]+/g, ' '));
    const regles = [
      [/^(eleve )?(nom|noms|nom de famille|nom famille|nom d usage|nom usage|nom patronymique|patronyme|last ?name|family ?name|surname)$/, 'Nom'],
      [/^(eleve )?(prenoms?|premier prenom|prenom 1|prenom1|first ?name|given ?name)$/, 'Prénom'],
      [/^(eleve )?(date (de )?naiss(ance)?|naissance|date naissance|birth ?date|date of birth)$/, 'Date de naissance'],
      [/^(eleve )?((code )?sexe|genre|gender)$/, 'Sexe'],
      [/^(classe|division|structure)( (nom|libelle|code))?$|^(code|libelle|nom) (classe|division|structure)$/, 'Classe'],
      [/^(eleve )?(code )?regime( scolaire)?$/, 'Régime'],
    ];
    return regles.find(([m]) => m.test(t))?.[1] || t;
  }

  // XML « un élève par balise » → une feuille. L'enregistrement = la balise répétée qui porte un nom ; ses attributs,
  // ses balises simples (et celles d'un niveau plus bas) sont les colonnes ; celles de ses parents aussi (« classe nom »).
  function feuilleEnregistrements(doc, nomFichier) {
    const simple = e => !e.children.length;
    const champs = el => {
      const res = [];
      for (const a of el.attributes) if (!/^xmlns/.test(a.name)) res.push([a.localName, a.value]);
      for (const e of el.children) {
        if (simple(e)) res.push([e.localName, e.textContent]);
        else for (const f of e.children) if (simple(f)) res.push([e.localName + ' ' + f.localName, f.textContent]);
      }
      return res;
    };
    const groupes = new Map();
    for (const el of doc.getElementsByTagName('*')) {
      const c = champs(el);
      if (c.length < 2) continue;
      if (!groupes.has(el.localName)) groupes.set(el.localName, []);
      groupes.get(el.localName).push(el);
    }
    const avecNom = els => champs(els[0]).some(([n]) => titreBalise(n) === 'Nom');
    const tous = [...groupes.values()];
    const choisi = (tous.some(avecNom) ? tous.filter(avecNom) : tous).sort((a, b) => b.length - a.length)[0];
    if (!choisi) return { nom: nomFichier, lignes: [] };
    const lignesDe = choisi.map(el => {
      const valeurs = [];
      for (let p = el.parentElement; p; p = p.parentElement) {
        for (const a of p.attributes) if (!/^xmlns/.test(a.name)) valeurs.push([p.localName + ' ' + a.localName, a.value]);
        for (const e of p.children) if (simple(e)) valeurs.push([p.localName + ' ' + e.localName, e.textContent]);
      }
      return [...champs(el), ...valeurs];
    });
    const titres = [];
    for (const l of lignesDe) for (const [n] of l) if (!titres.includes(n)) titres.push(n);
    return {
      nom: nomFichier,
      lignes: [titres.map(titreBalise), ...lignesDe.map(l => {
        const m = new Map(); l.forEach(([n, v]) => { if (!m.has(n)) m.set(n, String(v).replace(/\s+/g, ' ').trim()); });
        return titres.map(n => m.get(n) ?? '');
      })],
    };
  }

  // Texte du fichier : encodage annoncé par l'en-tête XML, sinon UTF-8, sinon Windows-1252 (export Windows « ANSI »).
  async function texteDe(fichier) {
    const octets = new Uint8Array(await fichier.arrayBuffer());
    const annonce = new TextDecoder('latin1').decode(octets.slice(0, 200)).match(/^\s*<\?xml[^>]*encoding=["']([\w.:-]+)["']/i)?.[1];
    if (annonce && !/^utf-?8$/i.test(annonce)) { try { return new TextDecoder(annonce).decode(octets); } catch { /* encodage inconnu */ } }
    const texte = new TextDecoder('utf-8').decode(octets);
    return (texte.includes('�') ? new TextDecoder('windows-1252').decode(octets) : texte).replace(/^﻿/, '');
  }

  // Fichier → feuilles [{ nom, lignes }] : classeur .xlsx (École Directe, Pronote), .csv (Pronote, ONDE), ou XML.
  // (Reconnu par son contenu, pas par son nom : sur iPad, le nom du fichier téléchargé n'est pas toujours le bon.)
  async function feuillesDe(fichier) {
    const debut = new Uint8Array(await fichier.slice(0, 8).arrayBuffer());
    if (debut[0] === 0x50 && debut[1] === 0x4b) return Tableur.lire(fichier); // « PK » : vrai classeur .xlsx
    if (debut[0] === 0xd0 && debut[1] === 0xcf) throw new Error('Ce fichier est à l’ancien format Excel (.xls) : ouvre-le dans Excel ou LibreOffice, « Enregistrer sous » au format .xlsx, puis importe ce nouveau fichier.');
    if (String.fromCharCode(...debut.slice(0, 4)) === '%PDF') throw new Error('Ce fichier est un PDF : il faut la liste de classe exportée en .xlsx, .csv ou .xml.');
    const texte = await texteDe(fichier);
    if (/^\s*</.test(texte)) {
      const doc = new DOMParser().parseFromString(texte, 'application/xml');
      const casse = doc.getElementsByTagName('parsererror').length > 0;
      if (casse || doc.documentElement.localName.toLowerCase() === 'html') {
        if (/<table/i.test(texte)) return lireClasseurNotes(fichier); // (page web : un tableau par feuille)
        throw new Error('Fichier XML illisible : il est peut-être abîmé ou incomplet. Exporte-le à nouveau.');
      }
      const feuilles = [...doc.getElementsByTagName('*')].filter(e => e.localName === 'Worksheet');
      return feuilles.length ? feuillesSpreadsheetMl(feuilles) : [feuilleEnregistrements(doc, fichier.name)];
    }
    if (texte.includes('\u0000')) throw new Error('Format de fichier non reconnu : il faut la liste de classe exportée en .xlsx, .csv ou .xml.');
    return [{ nom: fichier.name, lignes: lireCsv(texte) }];
  }

  // Classeur → { classe, effectif, eleves: [...], titres } ; erreur claire si le format n'est pas reconnu
  // (on n'y cite que des titres de colonnes, jamais le contenu des lignes).
  async function lire(fichier) {
    const feuilles = await feuillesDe(fichier);
    for (const f of feuilles) {
      const L = f.lignes;
      const h = L.findIndex(estTitres);
      if (h < 0) continue;
      const col = colonnes(L[h]);
      // (Chaque information est dans sa propre case : « Classe : 6ème A », « Effectif : 34 élèves (…) ».)
      const infos = L.slice(0, h).flat().filter(Boolean);
      const info = motif => infos.map(x => x.match(motif)?.[1]).find(Boolean)?.trim() || '';
      let classe = info(/^\s*classe\s*:\s*(.+)$/i);
      const effectif = +info(/effectif\s*:\s*(\d+)/i) || null;
      const val = (l, k) => (k === undefined ? '' : String(l[k] ?? '').trim());
      const eleves = L.slice(h + 1).filter(l => l && val(l, col.nom) && !val(l, col.nom).includes(':')).map(l => {
        const { nom, prenom } = col.prenom !== undefined ? { nom: val(l, col.nom), prenom: val(l, col.prenom) } : separerNom(val(l, col.nom));
        return {
          nom: majuscules(nom), prenom, sexe: sexeLu(val(l, col.sexe)),
          naissance: lireDateExcel(val(l, col.naissance)), regime: val(l, col.regime), dispositifs: val(l, col.dispositifs),
          classe: val(l, col.classe), niveau: val(l, col.niveau),
          responsables: col.responsables.map(r => ({
            nom: val(l, r.nom), tel: telephone(val(l, r.tel)), email: val(l, r.email), adresse: val(l, r.adresse).replace(/\s*\n\s*/g, ', '),
          })).filter(r => r.nom || r.tel || r.email || r.adresse),
        };
      });
      classe ||= eleves.find(e => e.classe)?.classe || '';
      return { classe, effectif, eleves, titres: L[h].filter(Boolean) };
    }
    throw new Error('Liste de classe non reconnue : il faut une ligne de titres avec « Nom » (ou « Élève ») et « Prénom », « Date de naissance » ou « Sexe ». '
      + `Onglets trouvés : ${feuilles.map(f => `« ${f.nom} »`).join(', ')}.`);
  }

  // (Tirets, apostrophes et espaces ignorés : « Jean Marie » saisi à la main = « Jean-Marie » du fichier.)
  const simple = s => sansAccent(s).replace(/[\s'’-]/g, '');
  const cle = el => simple(el.nom) + '|' + simple(el.prenom);

  // Fiche existante + données du fichier (seulement les catégories choisies). Ne touche ni aux notes ni aux remarques.
  function completer(fiche, x, choix) {
    const res = { ...fiche };
    if (!res.sexe && x.sexe) res.sexe = x.sexe;
    if (choix.naissance && x.naissance) res.naissance = x.naissance;
    if (choix.regime) res.regime = x.regime || '';
    if (choix.responsables) res.responsables = x.responsables;
    if (choix.dispositifs) {
      res.dispositifs = x.dispositifs || '';
      const liste = x.dispositifs.split(/[,;/+\n]|\s-\s/).map(s => s.trim()).filter(Boolean);
      if (liste.some(d => /\bPAI\b/i.test(d))) res.pai = true;
      const autres = liste.filter(d => !/^PAI$/i.test(d));
      if (autres.length) {
        res.bep = true;
        const ligne = 'Dispositif : ' + autres.join(', ');
        if (!(res.bepInfo || '').includes(ligne)) res.bepInfo = [ligne, res.bepInfo].filter(Boolean).join('\n');
      }
    }
    return res;
  }

  const CHOIX = [
    ['naissance', 'Date de naissance', 'l’âge est calculé'],
    ['dispositifs', 'Dispositifs', 'PAI → PAI ; PAP, PPS, ULIS… → BEP'],
    ['regime', 'Régime', 'demi-pensionnaire, externe…'],
    ['responsables', 'Coordonnées des responsables', 'nom, téléphone, email, adresse — utiles en cas d’accident ou de sortie'],
  ];

  // c : classe à mettre à jour, ou null pour créer une nouvelle classe à partir du fichier.
  async function importer(fichier, c = null) {
    const lu = await lire(fichier);
    if (!lu.eleves.length) throw new Error('Aucun élève trouvé sous la ligne de titres du fichier.');
    const proposee = nomEtNiveau(lu.classe);
    if (avecEcole()) proposee.niveau = niveauDeLaListe(lu.eleves) || proposee.niveau;
    const existants = c ? elevesDe(c.id) : [];
    const parCle = new Map(existants.map(el => [cle(el), el]));
    const parNaissance = el => existants.find(e => e.naissance && e.naissance === el.naissance && simple(e.nom) === simple(el.nom));
    const paires = lu.eleves.map(x => ({ x, fiche: parCle.get(cle(x)) || (x.naissance && parNaissance(x)) || null }));
    const nouveaux = paires.filter(p => !p.fiche).map(p => p.x);
    const vus = new Set(paires.filter(p => p.fiche).map(p => p.fiche.id));
    const partis = existants.filter(el => !vus.has(el.id));
    const filles = lu.eleves.filter(e => e.sexe === 'F').length, garcons = lu.eleves.filter(e => e.sexe === 'G').length;
    const memo = ui.choixListeClasse || { naissance: true, dispositifs: true, regime: true, responsables: true };
    const nomsCourts = l => l.slice(0, 10).map(e => esc(`${e.nom} ${e.prenom}`)).join(', ') + (l.length > 10 ? '…' : '');
    const autreClasse = c && lu.classe && sansAccent(nomEtNiveau(lu.classe).nom) !== sansAccent(c.nom.replace(/\s+/g, ''));

    const { resultat } = ouvrirModale(c ? `Mettre à jour ${c.nom} depuis la liste de classe` : 'Nouvelle classe depuis la liste de classe', `
      <p><b>${esc(fichier.name)}</b>${lu.classe ? ` — classe « ${esc(lu.classe)} »` : ''}</p>
      <ul class="bilan-import">
        <li>${lu.eleves.length} élève${lu.eleves.length > 1 ? 's' : ''} lu${lu.eleves.length > 1 ? 's' : ''} (${filles} fille${filles > 1 ? 's' : ''}, ${garcons} garçon${garcons > 1 ? 's' : ''})
          ${lu.effectif ? (lu.effectif === lu.eleves.length ? ' ✔ conforme à l’effectif annoncé' : ` <b>⚠ le fichier annonce ${lu.effectif} élèves</b>`) : ''}</li>
        ${c ? `<li>${paires.length - nouveaux.length} déjà dans la classe (fiches complétées)</li>
          ${nouveaux.length ? `<li>${nouveaux.length} nouveau${nouveaux.length > 1 ? 'x' : ''} : <span class="aide">${nomsCourts(nouveaux)}</span></li>` : ''}
          ${partis.length ? `<li>${partis.length} élève${partis.length > 1 ? 's' : ''} de ${esc(c.nom)} absent${partis.length > 1 ? 's' : ''} du fichier (parti${partis.length > 1 ? 's' : ''} ?) :
            <span class="aide">${nomsCourts(partis)}</span> — rien n’est supprimé</li>` : ''}` : ''}
      </ul>
      ${autreClasse ? `<p class="alerte-import">⚠ Ce fichier concerne la classe « ${esc(lu.classe)} », pas ${esc(c.nom)}.</p>` : ''}
      ${c ? '' : `<div class="ligne">
        <label>Nom de la classe<input name="nom" required value="${esc(proposee.nom)}" placeholder="ex. 6A"></label>
        <label>Niveau<select name="niveau"><option value="">—</option>${niveauxProposes().map(n => `<option ${proposee.niveau === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      </div>`}
      <fieldset class="choix-import"><legend>Reprendre aussi (en plus du nom et du sexe)</legend>
        ${CHOIX.map(([k, titre, aide]) => `<label class="case"><input type="checkbox" name="${k}" ${memo[k] ? 'checked' : ''}>
          <span><b>${titre}</b> <span class="aide">— ${aide}</span></span></label>`).join('')}
      </fieldset>
      <p class="aide">Le fichier est lu sur cet appareil et n’est envoyé nulle part. Ne garde que ce qui te sert :
        les coordonnées peuvent être effacées à tout moment (classe › ✎ › « Effacer les coordonnées »).</p>`,
    boutonsModale(c ? 'Mettre à jour' : 'Créer la classe'), 'modale-large');
    const r = await resultat;
    if (r.action !== 'ok') return;
    const choix = Object.fromEntries(CHOIX.map(([k]) => [k, r.data[k] === 'on']));
    ui.choixListeClasse = choix;
    if (!c) {
      c = Donnees.ecrire('classes', { id: Donnees.nouvelId(), nom: r.data.nom.trim(), niveau: r.data.niveau });
      ui.classeId = c.id;
    }
    ui.vue = 'eleves';
    memoriserUi();
    let ordre = prochainOrdre(c.id);
    for (const { x, fiche } of paires) {
      const base = fiche || { id: Donnees.nouvelId(), classeId: c.id, nom: x.nom, prenom: x.prenom, sexe: x.sexe, remarque: '', ordre: ordre++ };
      const res = completer(base, x, choix);
      if (avecEcole() && niveauEcoleLu(x.niveau)) res.niveau = niveauEcoleLu(x.niveau);
      if (!fiche || JSON.stringify(res) !== JSON.stringify(fiche)) Donnees.ecrire('eleves', res);
    }
    rendre();
    toast(c && existants.length
      ? `${c.nom} à jour : ${paires.length - nouveaux.length} fiche${paires.length - nouveaux.length > 1 ? 's' : ''} complétée${paires.length - nouveaux.length > 1 ? 's' : ''}, ${nouveaux.length} élève${nouveaux.length > 1 ? 's' : ''} ajouté${nouveaux.length > 1 ? 's' : ''}.`
      : `Classe ${c.nom} créée : ${lu.eleves.length} élèves.`, 'ok');
  }

  // Fiche « contacts » d'un élève : naissance / âge, régime, dispositifs, responsables (touchers = appeler / écrire).
  function age(naissance) {
    if (!naissance) return null;
    const n = new Date(naissance + 'T12:00'), a = new Date();
    return a.getFullYear() - n.getFullYear() - (a.getMonth() < n.getMonth() || (a.getMonth() === n.getMonth() && a.getDate() < n.getDate()) ? 1 : 0);
  }
  const aDesInfos = el => !!(el.naissance || el.regime || el.dispositifs || el.responsables?.length);

  async function voir(id) {
    const el = Donnees.get('eleves', id);
    const a = age(el.naissance);
    const lignes = [
      el.naissance && ['Naissance', `${esc(new Date(el.naissance + 'T12:00').toLocaleDateString('fr-FR'))} (${a} ans)`],
      el.regime && ['Régime', esc(el.regime)],
      el.dispositifs && ['Dispositifs', esc(el.dispositifs)],
    ].filter(Boolean);
    const { resultat } = ouvrirModale(`${el.nom} ${el.prenom}`, `
      ${lignes.length ? `<dl class="infos-eleve">${lignes.map(([t, v]) => `<dt>${t}</dt><dd>${v}</dd>`).join('')}</dl>` : ''}
      ${(el.responsables || []).map((r, k) => `<div class="responsable">
        <h3>Responsable ${k + 1}${r.nom ? ' — ' + esc(r.nom) : ''}</h3>
        ${r.tel ? `<p>📞 <a href="tel:${esc(r.tel.replace(/[^\d+]/g, ''))}">${esc(r.tel)}</a></p>` : ''}
        ${r.email ? `<p>✉ <a href="mailto:${esc(r.email)}">${esc(r.email)}</a></p>` : ''}
        ${r.adresse ? `<p class="aide">${esc(r.adresse)}</p>` : ''}
      </div>`).join('')}
      ${!lignes.length && !el.responsables?.length ? '<p class="aide">Aucune information : Élèves › « École Directe / Pronote » pour les reprendre du fichier de la classe.</p>' : ''}`,
    `${el.responsables?.length ? '<button value="effacer" class="danger">Effacer les coordonnées</button>' : ''}<span class="espace"></span><button type="button" data-fermer class="primaire">Fermer</button>`);
    if ((await resultat).action !== 'effacer') return;
    if (!(await confirmer(`Effacer les coordonnées des responsables de ${el.nom} ${el.prenom} ?`, 'Effacer'))) return;
    const { responsables, ...reste } = Donnees.get('eleves', id);
    Donnees.ecrire('eleves', reste);
    rendre();
  }

  // Fin d'année (ou changement d'avis) : retire les coordonnées des responsables de toute une classe.
  function effacerCoordonnees(classeId) {
    let n = 0;
    for (const el of elevesDe(classeId).filter(e => e.responsables)) {
      const { responsables, ...reste } = el;
      Donnees.ecrire('eleves', reste);
      n++;
    }
    return n;
  }

  // Bouton « École Directe » : les consignes, le choix du fichier, puis l'import (c = null : nouvelle classe).
  function choisirFichier(c) {
    guideImport('liste', f => importer(f, c));
  }

  return { importer, choisirFichier, voir, aDesInfos, age, effacerCoordonnees, separerNom, nomEtNiveau, lire, lireCsv };
})();
