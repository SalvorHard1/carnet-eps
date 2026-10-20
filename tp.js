'use strict';
// Outil « 🧾 Préparation des TP » (Outils › SVT ; caché en EPS) :
//   Fiches TP   : pour chaque séance de la classe, le matériel et les produits (quantité par binôme, par élève, par groupe
//                 ou pour la classe), les dangers / équipements (listes de labo.js) et un mot pour le technicien de labo.
//                 Rangé dans la séance (s.tp) : suit sur la clé avec le carnet. « + Séance de TP » crée la séance.
//   Commande    : toutes les classes, sur une période (cette semaine, la suivante…) : quantités calculées par l'appli
//                 d'après l'effectif de chaque classe (binômes = effectif / 2 arrondi au-dessus) → à imprimer pour le labo.
//   Banque      : modèles de séance réutilisables d'une année sur l'autre (collection `modeles` : titre, thème, niveau,
//                 données relevées, fiche TP, déroulé) ; « Utiliser » crée la séance dans la classe ; échange entre collègues
//                 par fichier .json (aucune donnée d'élève).
// (Chargé après labo.js : utilise EPI_LABO / DANGERS_LABO.)

OUTILS.push({ id: 'tp', famille: 'svt', icone: '🧾', nom: 'Préparation des TP', info: 'Matériel par séance, commande au labo, banque de séances', classe: true, eleve: false });

const PAR_TP = { binome: 'par binôme', eleve: 'par élève', groupe: 'par groupe de 4', classe: 'pour la classe' };
const nbPourTp = (par, n) => (par === 'eleve' ? n : par === 'binome' ? Math.ceil(n / 2) : par === 'groupe' ? Math.ceil(n / 4) : 1);
const tpVide = () => ({ materiel: [], securite: [], technicien: '' });
const articlesTp = tp => (tp?.materiel || []).filter(m => (m.nom || '').trim());
// Préférences de l'outil (onglet, période de la commande, recherche) : par classe, sur cet appareil.
// (« 🗑 Tout effacer » ne les remet qu'à zéro : fiches et banque sont dans le carnet.)
const cfgTp = c => ((etatOutils.tp ??= {})[c.id] ??= { onglet: 'fiches', periode: 'semaine', du: '', au: '', filtreBanque: '' });

/* ---------- Affichage ---------- */

function htmlTp(c) {
  const cfg = cfgTp(c);
  const onglets = [['fiches', '🧾 Fiches TP'], ['commande', '📦 Commande au labo'], ['banque', `⭐ Banque de séances (${Donnees.liste('modeles').length})`]];
  return `
    <div class="filtres-eleves" role="tablist">${onglets.map(([v, nom]) => `<button type="button" role="tab" data-tp="onglet" data-arg="${v}" class="${cfg.onglet === v ? 'actif' : ''}" aria-selected="${cfg.onglet === v}">${nom}</button>`).join('')}</div>
    ${cfg.onglet === 'commande' ? htmlCommandeTp(cfg) : cfg.onglet === 'banque' ? htmlBanqueTp(c, cfg) : htmlFichesTp(c)}`;
}

function htmlFichesTp(c) {
  const auj = aujourdhui(), n = elevesDe(c.id).length;
  // À venir d'abord (la plus proche en haut), puis les passées (la plus récente en haut).
  const toutes = seancesDe(c.id), avenir = toutes.filter(s => s.date >= auj), passees = toutes.filter(s => s.date < auj).reverse();
  const ligne = s => {
    const art = articlesTp(s.tp);
    return `<div class="ligne-tp${s.date === auj ? ' aujourdhui' : ''}"><span class="date-tp">${dateCourte(s.date)}</span>
      <span class="titre-tp"><b>${esc(s.titre)}</b>${s.apsa && s.apsa !== s.titre ? ` <span class="aide">· ${esc(s.apsa)}</span>` : ''}</span>
      <span class="aide">${art.length ? `${art.length} article${art.length > 1 ? 's' : ''}` : ''}${s.tp?.securite?.length ? ` · ⚠️ ${s.tp.securite.length}` : ''}</span>
      <button data-tp="fiche" data-arg="${s.id}">${art.length || s.tp?.technicien ? '✎ Fiche TP' : '+ Fiche TP'}</button>
      <button class="icone-petit" data-tp="vers-banque" data-arg="${s.id}" title="Enregistrer cette séance dans la banque (réutilisable l’an prochain)" aria-label="Enregistrer dans la banque">⭐</button></div>`;
  };
  return `
    <div class="boutons-outil"><button class="primaire" data-tp="nouvelle">+ Séance de TP</button>
      <span class="aide">${n} élève${n > 1 ? 's' : ''} : ${Math.ceil(n / 2)} binômes, ${Math.ceil(n / 4)} groupes de 4.</span></div>
    ${avenir.length ? `<h3>À venir</h3><div class="liste-tp">${avenir.map(ligne).join('')}</div>` : '<p class="aide">Aucune séance à venir : « + Séance de TP » pour préparer la prochaine.</p>'}
    ${passees.length ? `<details class="reglages-labo"><summary>Séances passées (${passees.length})</summary><div class="liste-tp">${passees.map(ligne).join('')}</div></details>` : ''}`;
}

// Période de la commande : [début, fin] (dates ISO).
function periodeCommandeTp(cfg) {
  const auj = aujourdhui(), lundi = plusJoursAg(auj, 1 - jourSemaineAg(auj));
  if (cfg.periode === 'suivante') return [plusJoursAg(lundi, 7), plusJoursAg(lundi, 13)];
  if (cfg.periode === 'deux') return [auj, plusJoursAg(lundi, 13)];
  if (cfg.periode === 'dates' && cfg.du && cfg.au) return cfg.du <= cfg.au ? [cfg.du, cfg.au] : [cfg.au, cfg.du];
  return [lundi, plusJoursAg(lundi, 6)];
}

// Commande : une ligne par séance (toutes classes), quantités calculées ; totaux par article et unité.
function commandeTp(cfg) {
  const [du, au] = periodeCommandeTp(cfg);
  const seances = classesTriees().flatMap(c => seancesDe(c.id).filter(s => s.date >= du && s.date <= au && (articlesTp(s.tp).length || s.tp?.technicien)).map(s => ({ c, s })))
    .sort((a, b) => a.s.date.localeCompare(b.s.date) || collator.compare(a.c.nom, b.c.nom));
  const totaux = new Map();
  const detail = seances.map(({ c, s }) => {
    const n = elevesDe(c.id).length;
    const lignes = articlesTp(s.tp).map(m => {
      const qte = (nombreOutil(m.qte) ?? 1) * nbPourTp(m.par, n);
      const cle = `${m.nom.trim().toLocaleLowerCase('fr')}|${(m.unite || '').trim()}`;
      const t = totaux.get(cle) || { nom: m.nom.trim(), unite: (m.unite || '').trim(), qte: 0 };
      t.qte += qte; totaux.set(cle, t);
      return { ...m, qte, unitaire: nombreOutil(m.qte) ?? 1 };
    });
    return { c, s, n, lignes };
  });
  return { du, au, detail, totaux: [...totaux.values()].sort((a, b) => collator.compare(a.nom, b.nom)) };
}

function htmlCommandeTp(cfg) {
  const k = commandeTp(cfg), q = x => fmt(Math.round(x * 100) / 100);
  const choix = [['semaine', 'Cette semaine'], ['suivante', 'La semaine prochaine'], ['deux', 'Aujourd’hui → fin de la semaine prochaine'], ['dates', 'Autres dates…']];
  return `
    <div class="ligne reglage-outil">
      <label>Période<select data-tp-champ="periode">${choix.map(([v, nom]) => `<option value="${v}" ${cfg.periode === v ? 'selected' : ''}>${nom}</option>`).join('')}</select></label>
      ${cfg.periode === 'dates' ? `<label>Du<input type="date" data-tp-champ="du" value="${cfg.du}"></label><label>Au<input type="date" data-tp-champ="au" value="${cfg.au}"></label>` : ''}
      <span class="aide">du ${dateCourte(k.du)} au ${dateCourte(k.au)} · toutes les classes</span>
    </div>
    ${k.detail.length ? `<div class="boutons-outil"><button class="primaire" data-tp="imprimer">🖨 Imprimer pour le labo</button><button data-tp="copier">📋 Copier</button></div>
    <h3>Total à préparer</h3>
    <div class="table-defile"><table class="table-labo"><thead><tr><th>Article</th><th>Quantité</th></tr></thead>
      <tbody>${k.totaux.map(t => `<tr><th>${esc(t.nom)}</th><td>${q(t.qte)}${t.unite ? ' ' + esc(t.unite) : ''}</td></tr>`).join('')}</tbody></table></div>
    <h3>Séance par séance</h3>
    ${k.detail.map(x => `<div class="carte-labo vu"><div class="tete-labo"><b>${dateCourte(x.s.date)} — ${esc(x.c.nom)}</b><span class="aide">${esc(x.s.titre)} · ${x.n} élèves</span></div>
      ${x.lignes.length ? `<ul class="liste-fiche">${x.lignes.map(m => `<li><b>${q(m.qte)}${m.unite ? ' ' + esc(m.unite) : ''}</b> ${esc(m.nom)} <span class="aide">(${esc(fmt(m.unitaire))}${m.unite ? ' ' + esc(m.unite) : ''} ${esc(PAR_TP[m.par] || '')})</span></li>`).join('')}</ul>` : ''}
      ${x.s.tp?.securite?.length ? `<p class="aide">⚠️ ${esc(securiteTp(x.s))}</p>` : ''}
      ${x.s.tp?.technicien ? `<p>📝 ${esc(x.s.tp.technicien)}</p>` : ''}</div>`).join('')}`
    : '<p class="aide">Aucune fiche TP sur cette période. Prépare-les dans « 🧾 Fiches TP » (chaque classe).</p>'}`;
}

// Consignes de sécurité cochées dans la fiche, en une ligne
const securiteTp = s => (s.tp?.securite || []).map(id => [...EPI_LABO, ...DANGERS_LABO].find(d => d[0] === id)?.[2].split(' :')[0] || id).join(' · ');

function texteCommandeTp(cfg) {
  const k = commandeTp(cfg), q = x => fmt(Math.round(x * 100) / 100);
  return [`Commande labo — du ${dateCourte(k.du)} au ${dateCourte(k.au)}`, '', 'TOTAL', ...k.totaux.map(t => `- ${q(t.qte)}${t.unite ? ' ' + t.unite : ''} ${t.nom}`), '',
    ...k.detail.flatMap(x => [`${dateCourte(x.s.date)} — ${x.c.nom} — ${x.s.titre} (${x.n} élèves)`, ...x.lignes.map(m => `  - ${q(m.qte)}${m.unite ? ' ' + m.unite : ''} ${m.nom}`),
      ...(x.s.tp?.securite?.length ? [`  Sécurité : ${securiteTp(x.s)}`] : []),
      ...(x.s.tp?.technicien ? [`  Note : ${x.s.tp.technicien}`] : []), ''])].join('\n');
}

function imprimerCommandeTp(cfg) {
  const k = commandeTp(cfg), q = x => fmt(Math.round(x * 100) / 100);
  let zone = $('#zone-impression');
  if (!zone) { zone = document.createElement('div'); zone.id = 'zone-impression'; document.body.append(zone); }
  zone.innerHTML = `<h1>Commande labo — du ${dateCourte(k.du)} au ${dateCourte(k.au)}</h1>
    <h2>Total à préparer</h2><table><thead><tr><th>Article</th><th>Quantité</th></tr></thead><tbody>${k.totaux.map(t => `<tr><td>${esc(t.nom)}</td><td>${q(t.qte)} ${esc(t.unite)}</td></tr>`).join('')}</tbody></table>
    ${k.detail.map(x => `<h2>${dateCourte(x.s.date)} — ${esc(x.c.nom)} — ${esc(x.s.titre)} (${x.n} élèves)</h2>
      <table><tbody>${x.lignes.map(m => `<tr><td>${esc(m.nom)}</td><td>${q(m.qte)} ${esc(m.unite || '')}</td></tr>`).join('')}</tbody></table>
      ${x.s.tp?.securite?.length ? `<p>Sécurité : ${esc(securiteTp(x.s))}</p>` : ''}
      ${x.s.tp?.technicien ? `<p>Note : ${esc(x.s.tp.technicien)}</p>` : ''}`).join('')}`;
  document.body.classList.add('impression-bareme');
  const fin = () => { document.body.classList.remove('impression-bareme'); window.removeEventListener('afterprint', fin); };
  window.addEventListener('afterprint', fin);
  window.print();
  setTimeout(fin, 1000);
}

function htmlBanqueTp(c, cfg) {
  return `
    <div class="ligne reglage-outil">
      <input type="search" data-tp-champ="filtreBanque" value="${esc(cfg.filtreBanque || '')}" placeholder="Rechercher un thème, un TP…" aria-label="Rechercher dans la banque">
      <label class="bouton">📥 Recevoir un fichier<input type="file" accept=".json,application/json" data-tp-fichier hidden></label>
      ${Donnees.liste('modeles').length ? '<button data-tp="envoyer-tout" title="Un fichier avec toute la banque, pour un collègue (aucune donnée d’élève)">📤 Envoyer toute la banque</button>' : ''}
    </div>
    <p class="aide">Une séance mise dans la banque (⭐ dans « Fiches TP ») garde ses données à relever, sa fiche TP et son déroulé : « Utiliser » la recrée dans une classe, à la date choisie.</p>
    <div data-tp-liste>${htmlListeBanqueTp(c, cfg)}</div>`;
}

// Cartes de la banque (redessinées seules pendant la recherche).
function htmlListeBanqueTp(c, cfg) {
  const cherche = sansAccent(cfg.filtreBanque || '');
  const modeles = Donnees.liste('modeles').filter(m => !cherche || sansAccent(`${m.titre} ${m.apsa} ${m.niveau}`).includes(cherche))
    .sort((a, b) => collator.compare(a.apsa || '', b.apsa || '') || collator.compare(a.titre, b.titre));
  return `${modeles.length ? `<div class="cartes-labo">${modeles.map(m => `<div class="carte-labo vu">
      <div class="tete-labo"><b>${esc(m.titre)}</b><span class="espace"></span>
        <button class="icone-petit" data-tp="modele-envoyer" data-arg="${m.id}" title="Fichier pour un collègue" aria-label="Envoyer ce modèle">📤</button>
        <button class="icone-petit" data-tp="modele-suppr" data-arg="${m.id}" title="Retirer de la banque" aria-label="Retirer de la banque">🗑</button></div>
      <span class="aide">${esc(m.apsa || 'Sans thème')}${m.niveau ? ' · ' + esc(m.niveau) : ''} · ${(m.indicateurs || []).length} donnée${(m.indicateurs || []).length > 1 ? 's' : ''} à relever · ${articlesTp(m.tp).length} article${articlesTp(m.tp).length > 1 ? 's' : ''}</span>
      ${m.deroule ? `<p class="aide">${esc(resumeTexte(m.deroule, 160))}</p>` : ''}
      <div class="boutons-outil"><button class="primaire" data-tp="modele-utiliser" data-arg="${m.id}">Utiliser pour ${esc(c.nom)}</button>
        <button data-tp="modele-editer" data-arg="${m.id}">✎ Déroulé</button>
        <button data-tp="modele-fiche" data-arg="${m.id}">🧾 Fiche TP</button></div></div>`).join('')}</div>`
    : `<p class="aide">${cherche ? 'Aucun modèle ne correspond.' : 'La banque est vide.'}</p>`}`;
}

/* ---------- Fenêtres ---------- */

const ligneMaterielTp = (m = {}) => `<div class="ligne ligne-dyn ligne-materiel">
  <input name="m-nom" value="${esc(m.nom || '')}" maxlength="80" placeholder="ex. Lame de verre" aria-label="Article">
  <input name="m-qte" value="${esc(m.qte ?? 1)}" inputmode="decimal" maxlength="8" aria-label="Quantité" class="etroit-tp">
  <input name="m-unite" value="${esc(m.unite || '')}" maxlength="15" placeholder="unité" aria-label="Unité" class="etroit-tp">
  <select name="m-par" aria-label="Pour qui">${Object.entries(PAR_TP).map(([v, nom]) => `<option value="${v}" ${(m.par || 'binome') === v ? 'selected' : ''}>${nom}</option>`).join('')}</select>
  <button type="button" class="icone-petit" data-suppr-ligne aria-label="Retirer cet article">🗑</button></div>`;

// Fiche TP d'une séance (ou d'un modèle de la banque : cible = { titre, tp }) → nouvelle fiche, ou null si annulé.
async function editerFicheTp(titre, tp, effectif) {
  tp = { ...tpVide(), ...structuredClone(tp || {}) };
  const { d, resultat } = ouvrirModale(`🧾 Fiche TP — ${titre}`, `
    <h3>Matériel et produits</h3>
    <p class="aide">Quantité ${effectif ? `pour un binôme, un élève… : la commande multiplie d’après l’effectif (${effectif} élèves)` : 'pour un binôme, un élève…'}.</p>
    <div data-lignes-tp>${(tp.materiel.length ? tp.materiel : [{}, {}, {}]).map(ligneMaterielTp).join('')}</div>
    <button type="button" data-ajout-ligne-tp>+ Article</button>
    <h3>Sécurité</h3>
    <div class="colonnes-labo">${[['Équipement', EPI_LABO], ['Dangers', DANGERS_LABO]].map(([leg, l]) => `<fieldset><legend>${leg}</legend>
      ${l.map(([id, icone, texte]) => `<label class="case"><input type="checkbox" name="secu" value="${id}" ${tp.securite.includes(id) ? 'checked' : ''}> ${icone} ${esc(texte.split(' :')[0])}</label>`).join('')}</fieldset>`).join('')}</div>
    <label>Pour le technicien de labo<textarea name="technicien" rows="2" maxlength="600" placeholder="ex. Solutions à préparer la veille, microscopes réglés au × 10">${esc(tp.technicien)}</textarea></label>`,
  boutonsModale('Enregistrer'), 'modale-large');
  d.addEventListener('click', e => {
    if (e.target.closest('[data-ajout-ligne-tp]')) { $('[data-lignes-tp]', d).insertAdjacentHTML('beforeend', ligneMaterielTp()); $('[data-lignes-tp] .ligne-materiel:last-child input', d).focus(); }
    const s = e.target.closest('[data-suppr-ligne]');
    if (s) s.closest('.ligne-materiel').remove();
  });
  const r = await resultat;
  if (r.action !== 'ok') return null;
  const noms = r.fd.getAll('m-nom'), qtes = r.fd.getAll('m-qte'), unites = r.fd.getAll('m-unite'), pars = r.fd.getAll('m-par');
  return {
    materiel: noms.map((nom, k) => ({ nom: nom.trim(), qte: nombreOutil(qtes[k]) ?? 1, unite: unites[k].trim(), par: PAR_TP[pars[k]] ? pars[k] : 'binome' })).filter(m => m.nom),
    securite: r.fd.getAll('secu'), technicien: (r.data.technicien || '').trim(),
  };
}

async function nouvelleSeanceTp(c, preset = {}) {
  const { resultat } = ouvrirModale(`+ Séance de TP — ${c.nom}`, `
    <label>Titre<input name="titre" required maxlength="120" value="${esc(preset.titre || '')}" placeholder="${esc(mot('titreSeanceExemple'))}"></label>
    <div class="ligne"><label>Date<input type="date" name="date" required value="${preset.date || aujourdhui()}"></label>
      <label class="large">${esc(mot('activite'))}<input name="apsa" list="liste-theme-tp" value="${esc(preset.apsa || '')}" placeholder="${esc(mot('activitePlaceholder'))}"></label></div>
    <datalist id="liste-theme-tp">${activitesDiscipline().map(x => `<option value="${esc(x)}">`).join('')}</datalist>
    ${preset.titre ? '<p class="aide">Les données à relever, la fiche TP et le déroulé du modèle sont repris.</p>' : ''}`,
  boutonsModale(preset.titre ? 'Créer la séance' : 'Créer et préparer la fiche'));
  const r = await resultat;
  if (r.action !== 'ok') return null;
  const apsa = r.data.apsa.trim();
  return Donnees.ecrire('seances', {
    id: Donnees.nouvelId(), classeId: c.id, cree: Date.now(), titre: r.data.titre.trim(), apsa, ca: caBrut(apsa), date: r.data.date,
    indicateurs: preset.indicateurs?.length ? structuredClone(preset.indicateurs) : modeleIndicateurs(apsa), documents: [],
    ...(preset.tp ? { tp: structuredClone(preset.tp) } : {}), ...(preset.deroule ? { deroule: preset.deroule } : {}),
  });
}

/* ---------- Banque : modèles et fichiers ---------- */

function modeleDepuisSeance(s, c) {
  const { id, maj, majChamps, majChampsPour, classeId, date, cree, documents, couleur, ...reste } = s;
  return { ...structuredClone(reste), niveau: c?.niveau || '', indicateurs: structuredClone((s.indicateurs || []).filter(i => i.id !== ID_PRESENCE)) };
}

// Modèle reçu (fichier d'un collègue) : seulement des valeurs du bon type, de taille raisonnable.
function nettoyerModeleTp(x) {
  const txt = (s, n) => String(s ?? '').slice(0, n);
  const types = ['temps', 'distance', 'nombre', 'echelle', 'choix', 'texte'];
  const indicateurs = (Array.isArray(x?.indicateurs) ? x.indicateurs : []).slice(0, 40).filter(i => types.includes(i?.type)).map((i, k) => ({
    id: txt(i.id, 20) || 'i' + (k + 1), nom: txt(i.nom, 120), type: i.type,
    ...(i.type === 'choix' ? { options: (Array.isArray(i.options) ? i.options : []).slice(0, 30).map(o => txt(o, 60)) } : {}),
    ...(i.unite ? { unite: txt(i.unite, 15) } : {}), ...(i.suivi ? { suivi: true } : {}),
  }));
  const tp = x?.tp || {};
  return {
    titre: txt(x?.titre, 120) || 'Séance reçue', apsa: txt(x?.apsa, 120), niveau: txt(x?.niveau, 10), deroule: txt(x?.deroule, 4000), indicateurs,
    tp: { materiel: (Array.isArray(tp.materiel) ? tp.materiel : []).slice(0, 80).map(m => ({ nom: txt(m?.nom, 80), qte: nombreOutil(m?.qte) ?? 1, unite: txt(m?.unite, 15), par: PAR_TP[m?.par] ? m.par : 'binome' })).filter(m => m.nom),
      securite: (Array.isArray(tp.securite) ? tp.securite : []).filter(id => [...EPI_LABO, ...DANGERS_LABO].some(d => d[0] === id)), technicien: txt(tp.technicien, 600) },
  };
}

function envoyerModelesTp(modeles, nom) {
  const contenu = { format: 'carnet-eps-seances', version: 1, appli: VERSION_APP, date: aujourdhui(),
    modeles: modeles.map(({ id, maj, majChamps, majChampsPour, cree, ...reste }) => reste) };
  telechargerBlob(new File([JSON.stringify(contenu, null, 2)], 's.json', { type: 'application/json' }), `${nom}.json`);
  toast('Fichier prêt ✔ (aucune donnée d’élève dedans)', 'ok');
}

async function recevoirModelesTp(f) {
  if (f.size > 3e6) throw new Error('Fichier trop gros pour une banque de séances.');
  let contenu;
  try { contenu = JSON.parse(await f.text()); } catch { throw new Error('Ce fichier n’est pas une banque de séances du carnet.'); }
  if (contenu?.format !== 'carnet-eps-seances' || !Array.isArray(contenu.modeles)) throw new Error('Ce fichier n’est pas une banque de séances du carnet.');
  const liste = contenu.modeles.slice(0, 300).map(nettoyerModeleTp);
  for (const m of liste) Donnees.ecrire('modeles', { ...m, id: Donnees.nouvelId(), cree: Date.now() });
  toast(`${liste.length} séance${liste.length > 1 ? 's' : ''} ajoutée${liste.length > 1 ? 's' : ''} à la banque ✔`, 'ok');
  rendreOutil();
}

/* ---------- Actions ---------- */

async function actionTp(action, arg, c) {
  const cfg = cfgTp(c);
  switch (action) {
    case 'onglet': cfg.onglet = arg; return rendreOutil();
    case 'nouvelle': {
      const s = await nouvelleSeanceTp(c);
      if (!s) return;
      rendreOutil();
      const tp = await editerFicheTp(s.titre, null, elevesDe(c.id).length);
      if (tp) Donnees.ecrire('seances', { ...Donnees.get('seances', s.id), tp });
      return rendreOutil();
    }
    case 'fiche': {
      const s = Donnees.get('seances', arg);
      if (!s) return;
      const tp = await editerFicheTp(s.titre, s.tp, elevesDe(c.id).length);
      if (tp) Donnees.ecrire('seances', { ...Donnees.get('seances', s.id), tp });
      return rendreOutil();
    }
    case 'vers-banque': {
      const s = Donnees.get('seances', arg);
      if (!s) return;
      Donnees.ecrire('modeles', { ...modeleDepuisSeance(s, c), id: Donnees.nouvelId(), cree: Date.now() });
      toast(`« ${s.titre} » ajoutée à la banque ⭐`, 'ok');
      return rendreOutil();
    }
    case 'imprimer': return imprimerCommandeTp(cfg);
    case 'copier': return copierTexte(texteCommandeTp(cfg));
    case 'envoyer-tout': return envoyerModelesTp(Donnees.liste('modeles'), 'Banque de séances');
    case 'modele-envoyer': { const m = Donnees.get('modeles', arg); return m && envoyerModelesTp([m], `Séance ${m.titre}`); }
    case 'modele-suppr': {
      const m = Donnees.get('modeles', arg);
      if (!m || !(await confirmer(`Retirer « ${m.titre} » de la banque ? (Les séances déjà créées ne changent pas.)`, 'Retirer'))) return;
      Donnees.supprimer('modeles', m.id);
      return rendreOutil();
    }
    case 'modele-utiliser': {
      const m = Donnees.get('modeles', arg);
      if (!m) return;
      const s = await nouvelleSeanceTp(c, m);
      if (!s) return;
      toast(`Séance « ${s.titre} » créée le ${dateCourte(s.date)} ✔ (onglet ${mot('lecons')})`, 'ok');
      cfg.onglet = 'fiches';
      return rendreOutil();
    }
    case 'modele-editer': {
      const m = Donnees.get('modeles', arg);
      if (m) await editerModeleTp(m);
      return rendreOutil();
    }
    case 'modele-fiche': {
      const m = Donnees.get('modeles', arg);
      const tp = m && await editerFicheTp(m.titre, m.tp, 0);
      if (tp) Donnees.ecrire('modeles', { ...Donnees.get('modeles', m.id), tp });
      return rendreOutil();
    }
  }
}

// Modèle de la banque : titre, thème, niveau, déroulé (sa fiche TP : bouton « 🧾 Fiche TP » de la carte).
async function editerModeleTp(m) {
  const { resultat } = ouvrirModale(`⭐ ${m.titre}`, `
    <label>Titre<input name="titre" required maxlength="120" value="${esc(m.titre)}"></label>
    <div class="ligne"><label class="large">${esc(mot('activite'))}<input name="apsa" value="${esc(m.apsa || '')}" maxlength="120"></label>
      <label class="etroit">Niveau<input name="niveau" value="${esc(m.niveau || '')}" maxlength="10" placeholder="ex. 2nde"></label></div>
    <label>Déroulé, objectifs, documents utilisés<textarea name="deroule" rows="6" maxlength="4000" placeholder="ex. Problème posé, étapes du TP, durée, ce que les élèves rendent…">${esc(m.deroule || '')}</textarea></label>`,
  boutonsModale('Enregistrer'));
  const r = await resultat;
  if (r.action !== 'ok') return;
  Donnees.ecrire('modeles', { ...m, titre: r.data.titre.trim() || m.titre, apsa: r.data.apsa.trim(), niveau: r.data.niveau.trim(), deroule: r.data.deroule.trim() });
}

RENDUS_OUTILS.tp = htmlTp;

document.addEventListener('click', e => {
  const b = e.target.closest('#vue [data-tp]');
  if (!b || b.disabled) return;
  const c = classeActive();
  if (c) lancer(() => actionTp(b.dataset.tp, b.dataset.arg, c));
});
document.addEventListener('change', e => {
  const t = e.target;
  if (!t.closest?.('#vue .outil-tp')) return;
  if (t.matches('[data-tp-fichier]') && t.files[0]) return lancer(() => recevoirModelesTp(t.files[0]));
  if (t.dataset.tpChamp && t.dataset.tpChamp !== 'filtreBanque') { const c = classeActive(); if (c) { cfgTp(c)[t.dataset.tpChamp] = t.value; rendreOutil(); } }
});
// Recherche dans la banque : la liste se met à jour au fil de la frappe (le champ garde la main).
document.addEventListener('input', e => {
  const t = e.target;
  if (!t.matches?.('#vue .outil-tp [data-tp-champ="filtreBanque"]')) return;
  const c = classeActive(), zone = $('#vue [data-tp-liste]');
  if (!c) return;
  cfgTp(c).filtreBanque = t.value;
  sauverOutils();
  if (zone) zone.innerHTML = htmlListeBanqueTp(c, cfgTp(c));
});
