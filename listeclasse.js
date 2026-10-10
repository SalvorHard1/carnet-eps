'use strict';
// Liste de classe exportée d'École Directe (classeur .xlsx) → fiches élèves.
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
    const m = t.match(/^(\d)\s*(?:(?:ième|ieme|ème|eme|è|e)(?![a-zà-ÿ]))?\s*(.*)$/i);
    if (m && '3456'.includes(m[1])) return { nom: (m[1] + m[2].replace(/\s+/g, '')).toUpperCase(), niveau: m[1] + 'e' };
    const s = sansAccent(t);
    const niveau = /^(2|seconde|2nde)/.test(s) ? '2nde' : /^(1|premiere|1re|1ere)/.test(s) ? '1re' : /^(t|terminale)/.test(s) ? 'Tle' : '';
    return { nom: t, niveau };
  }

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
      if (t === 'nom' || t === 'eleve' || t === 'nom prenom' || t === 'nom et prenom') res.nom ??= k;
      else if (t === 'prenom') res.prenom ??= k;
      else if (t.includes('naissance')) res.naissance ??= k;
      else if (t === 'sexe' || t === 'genre') res.sexe ??= k;
      else if (t.startsWith('regime')) res.regime ??= k;
      else if (t.startsWith('dispositif')) res.dispositifs ??= k;
      else if (t === 'classe') res.classe ??= k;
    });
    return res;
  }

  // Classeur → { classe, effectif, eleves: [...], titres } ; erreur claire si le format n'est pas reconnu
  // (on n'y cite que des titres de colonnes, jamais le contenu des lignes).
  async function lire(fichier) {
    if (!/\.xlsx$/i.test(fichier.name)) throw new Error('Il faut le fichier .xlsx exporté d’École Directe.');
    const feuilles = await Tableur.lire(fichier);
    for (const f of feuilles) {
      const L = f.lignes;
      const h = L.findIndex(l => l?.some(c => sansAccent(c) === 'nom') && l.some(c => /naissance|sexe/.test(sansAccent(c))));
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
          nom: majuscules(nom), prenom, sexe: normSexe(val(l, col.sexe)),
          naissance: lireDateExcel(val(l, col.naissance)), regime: val(l, col.regime), dispositifs: val(l, col.dispositifs),
          classe: val(l, col.classe),
          responsables: col.responsables.map(r => ({
            nom: val(l, r.nom), tel: telephone(val(l, r.tel)), email: val(l, r.email), adresse: val(l, r.adresse).replace(/\s*\n\s*/g, ', '),
          })).filter(r => r.nom || r.tel || r.email || r.adresse),
        };
      });
      classe ||= eleves.find(e => e.classe)?.classe || '';
      return { classe, effectif, eleves, titres: L[h].filter(Boolean) };
    }
    throw new Error('Liste de classe non reconnue : il faut une ligne de titres avec « Nom » et « Date de naissance » (ou « Sexe »). '
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

    const { resultat } = ouvrirModale(c ? `Mettre à jour ${c.nom} depuis École Directe` : 'Nouvelle classe depuis École Directe', `
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
        <label>Niveau<select name="niveau"><option value="">—</option>${NIVEAUX.map(n => `<option ${proposee.niveau === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
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
      ${!lignes.length && !el.responsables?.length ? '<p class="aide">Aucune information : Élèves › « École Directe » pour les reprendre du fichier de la classe.</p>' : ''}`,
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

  // Bouton « École Directe » : choisir le fichier, puis importer (c = null : nouvelle classe).
  function choisirFichier(c) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    input.addEventListener('change', () => { if (input.files[0]) lancer(() => importer(input.files[0], c)); });
    input.click();
  }

  return { importer, choisirFichier, voir, aDesInfos, age, effacerCoordonnees, separerNom, nomEtNiveau, lire };
})();
