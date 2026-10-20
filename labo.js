'use strict';
// Outils de laboratoire (Outils › SVT ; cachés en EPS, comme l'ECE) :
//   ✏️ Grille de schéma   : critères d'un schéma d'observation cochés en passant dans les rangs → note, vers les notes.
//   🧪 Gestes techniques  : pour un geste (microscope, préparation, dissection…), qui réussit, avec aide, à reprendre.
//   📊 Mise en commun     : les mesures de chaque groupe → moyenne, médiane, écart-type, valeurs à vérifier, graphique.
//   ⚠️ Sécurité au labo   : consignes du TP à projeter ; pour le professeur seulement : PAI et oublis de matériel du jour.
//   👫 Binômes de TP      : un binôme par paillasse, niveaux mélangés ou non, sans refaire les binômes déjà faits.
// Comme les autres outils : état sur cet appareil (etatOutils, par classe) ; tout est calculé ici, par l'appli.
// Rien ne sort de l'appareil ; « Vers les notes » / « Vers une séance » écrivent dans le carnet, à la demande.

if (!FAMILLES_OUTILS.some(f => f.id === 'svt')) FAMILLES_OUTILS.push({ id: 'svt', nom: 'SVT' });
OUTILS.push(
  { id: 'schema', famille: 'svt', icone: '✏️', nom: 'Grille de schéma', info: 'Critères cochés en passant dans les rangs, note calculée', classe: true, eleve: false },
  { id: 'gestes', famille: 'svt', icone: '🧪', nom: 'Gestes techniques', info: 'Microscope, préparation, dissection… : qui réussit, qui aider', classe: true, eleve: false },
  { id: 'resultats', famille: 'svt', icone: '📊', nom: 'Mise en commun', info: 'Les mesures des groupes : moyenne, écarts, graphique à projeter', classe: true },
  { id: 'securite', famille: 'svt', icone: '⚠️', nom: 'Sécurité au labo', info: 'Consignes du TP à projeter ; PAI et oublis de matériel du jour', classe: true, eleve: false },
  { id: 'binomes', famille: 'svt', icone: '👫', nom: 'Binômes de TP', info: 'Une paillasse par binôme, sans refaire les mêmes binômes', classe: true },
);

const idLabo = () => Math.random().toString(36).slice(2, 9);
const nombreLabo = v => nombreOutil(v);
const fmtLabo = v => (v === null || v === undefined || !Number.isFinite(v) ? '–' : fmt(Math.round(v * 100) / 100));

/* ====================== ✏️ Grille de schéma ====================== */

const CRITERES_SCHEMA = [
  ['Titre précis (objet, technique, grossissement)', 3], ['Tracé net, au crayon, sans hachures', 3],
  ['Traits de légende à la règle, sans croisement', 3], ['Formes et proportions fidèles à l’observation', 4],
  ['Légendes exactes et complètes', 5], ['Échelle ou grossissement indiqué', 2],
];
const criteresSchemaDefaut = () => CRITERES_SCHEMA.map(([nom, pts], k) => ({ id: 'c' + (k + 1), nom, pts }));
function cfgSchema(c) {
  return ((etatOutils.schema ??= {})[c.id] ??= { sujet: '', criteres: criteresSchemaDefaut(), coches: {}, filtre: 'tous', reglages: false });
}
const totalSchema = cfg => cfg.criteres.reduce((s, k) => s + (+k.pts || 0), 0);
// Note d'un élève : null s'il n'a pas encore été vu.
const noteSchema = (cfg, id) => (cfg.coches[id] ? cfg.criteres.filter(k => cfg.coches[id].includes(k.id)).reduce((s, k) => s + (+k.pts || 0), 0) : null);

function htmlSchema(c) {
  const cfg = cfgSchema(c), total = totalSchema(cfg);
  // (Les présents, et les absents dont le schéma est déjà noté.)
  const presents = presentsOutil(c).map(el => el.id);
  const eleves = elevesDe(c.id).filter(el => presents.includes(el.id) || cfg.coches[el.id]);
  const vus = eleves.filter(el => cfg.coches[el.id]).length;
  const montres = eleves.filter(el => cfg.filtre === 'tous' || (cfg.filtre === 'avoir') === !cfg.coches[el.id]);
  return `
    <div class="ligne reglage-outil">
      <label class="large-outil">Schéma<input data-lb-champ="schema.sujet" value="${esc(cfg.sujet)}" maxlength="120" placeholder="ex. Cellules d’épiderme d’oignon (× 400)"></label>
    </div>
    <details class="reglages-labo" data-lb-details="schema" ${cfg.reglages ? 'open' : ''}><summary>⚙ Critères et points <span class="aide">— total sur ${fmt(total)}</span></summary>
      <div class="liste-labo">${cfg.criteres.map(k => `<div class="ligne ligne-labo">
        <input data-lb-critere="${k.id}|nom" value="${esc(k.nom)}" maxlength="120" aria-label="Critère">
        <label class="etroit"><input type="number" min="0" step="0.5" data-lb-critere="${k.id}|pts" value="${k.pts}" aria-label="Points"> pts</label>
        <button class="icone-petit" data-lb="schema-suppr" data-arg="${k.id}" aria-label="Retirer ce critère">🗑</button></div>`).join('')}</div>
      <div class="boutons-outil"><button data-lb="schema-ajout">+ Critère</button><button data-lb="schema-appliquer" class="primaire">✔ Appliquer</button>
        <button data-lb="schema-origine">Critères d’origine</button></div>
    </details>
    ${htmlPresents(c)}
    <div class="filtres-eleves" role="group" aria-label="Élèves affichés">
      ${[['tous', `Tous (${eleves.length})`], ['avoir', `À voir (${eleves.length - vus})`], ['vus', `Vus (${vus})`]].map(([v, nom]) =>
        `<button type="button" data-lb="schema-filtre" data-arg="${v}" class="${cfg.filtre === v ? 'actif' : ''}" aria-pressed="${cfg.filtre === v}">${nom}</button>`).join('')}
    </div>
    <p class="aide">Touche les critères réussis : la note se calcule. « ✔ Vu » pour un schéma qui n’en réussit aucun.</p>
    <div class="cartes-labo">${montres.map(el => {
      const n = noteSchema(cfg, el.id), coches = cfg.coches[el.id] || [];
      return `<div class="carte-labo${n === null ? '' : ' vu'}">
        <div class="tete-labo"><b>${esc(nomEleveOutil(el))}</b><span class="espace"></span>
          ${n === null ? `<button class="petit" data-lb="schema-vu" data-arg="${el.id}">✔ Vu</button>` : `<span class="note-labo"><b>${fmt(n)}</b> / ${fmt(total)}</span>
          <button class="icone-petit" data-lb="schema-raz" data-arg="${el.id}" title="Effacer ce schéma" aria-label="Effacer le schéma de ${esc(nomEleveOutil(el))}">↺</button>`}</div>
        <div class="criteres-labo">${cfg.criteres.map(k => `<button type="button" class="critere-labo${coches.includes(k.id) ? ' ok' : ''}" data-lb="schema-coche" data-arg="${el.id}|${k.id}"
          aria-pressed="${coches.includes(k.id)}">${coches.includes(k.id) ? '✓ ' : ''}${esc(k.nom)} <small>${fmt(k.pts)}</small></button>`).join('')}</div>
      </div>`;
    }).join('') || '<p class="aide">Aucun élève ici.</p>'}</div>
    ${vus ? `<div class="boutons-outil">
      <button class="primaire" data-lb="schema-notes" title="Créer une évaluation dans l’onglet Notes avec la note de chaque élève vu">📝 Vers les notes</button>
      <button data-lb="schema-copier">📋 Copier le récapitulatif</button></div>` : ''}`;
}

async function versNotesSchema(c, cfg) {
  const vus = elevesDe(c.id).filter(el => cfg.coches[el.id]);
  if (!vus.length) throw new Error('Aucun schéma noté.');
  const total = totalSchema(cfg), titre = 'Schéma' + (cfg.sujet ? ' — ' + cfg.sujet : '');
  if (!(await confirmer(`Créer dans l’onglet Notes l’évaluation « ${titre} » (sur ${fmt(total)}), avec la note de ${vus.length} élève${vus.length > 1 ? 's' : ''} ?`, 'Créer'))) return;
  const e = Donnees.ecrire('evals', {
    id: Donnees.nouvelId(), classeId: c.id, cree: Date.now(), titre, apsa: 'Schéma d’observation', date: aujourdhui(), max: total, coef: 1,
    referentiel: referentielDuNiveau(c.niveau), ca: '', competences: [], competencesLibres: '', preremplir: true,
  });
  for (const el of vus) Donnees.ecrireNote(e.id, el.id, String(noteSchema(cfg, el.id)));
  ui.vue = 'notes'; memoriserUi(); rendre();
  toast(`Évaluation créée dans Notes : ${vus.length} note${vus.length > 1 ? 's' : ''} ✔`, 'ok');
}

TRANSFERTS.schema = c => {
  const cfg = cfgSchema(c), vus = elevesDe(c.id).filter(el => cfg.coches[el.id]);
  if (!vus.length) throw new Error('Aucun schéma noté.');
  const pour = f => Object.fromEntries(vus.map(el => [el.id, f(el)]));
  return { titre: 'Schéma' + (cfg.sujet ? ' — ' + cfg.sujet : ''), apsa: '', colonnes: [
    ...cfg.criteres.map(k => ({ nom: k.nom, type: 'choix', options: ['Oui', 'Non'], valeurs: pour(el => (cfg.coches[el.id].includes(k.id) ? 'Oui' : 'Non')) })),
    { nom: 'Note du schéma', type: 'nombre', unite: '/' + fmt(totalSchema(cfg)), valeurs: pour(el => String(noteSchema(cfg, el.id))) },
  ] };
};

/* ====================== 🧪 Gestes techniques ====================== */

const GESTES_DEFAUT = ['Réglage du microscope (mise au point, grossissement)', 'Préparation microscopique (lame, lamelle)', 'Coloration',
  'Dissection', 'Verrerie, pipette, dilution', 'ExAO : capteurs et logiciel', 'Montage expérimental'];
// États d'un élève pour un geste (un toucher passe au suivant).
const ETATS_GESTE = { ok: ['✅', 'Réussi'], aide: ['🟠', 'Avec aide'], non: ['❌', 'À reprendre'] };
const SUITE_GESTE = { '': 'ok', ok: 'aide', aide: 'non', non: '' };
function cfgGestes(c) {
  const cfg = ((etatOutils.gestes ??= {})[c.id] ??= { gestes: GESTES_DEFAUT.map(nom => ({ id: idLabo(), nom })), actif: '', etats: {} });
  if (!cfg.gestes.some(g => g.id === cfg.actif)) cfg.actif = cfg.gestes[0]?.id || '';
  return cfg;
}
const etatGeste = (cfg, g, id) => cfg.etats[g]?.[id] || '';

function htmlGestes(c) {
  const cfg = cfgGestes(c), g = cfg.gestes.find(x => x.id === cfg.actif), presents = presentsOutil(c), els = elevesDe(c.id);
  const nb = e => presents.filter(el => etatGeste(cfg, cfg.actif, el.id) === e).length;
  // À aider en priorité : « à reprendre » sur ce geste, ou deux gestes ratés / aidés ou plus.
  const difficultes = el => cfg.gestes.filter(x => ['aide', 'non'].includes(etatGeste(cfg, x.id, el.id))).length;
  const aider = presents.filter(el => etatGeste(cfg, cfg.actif, el.id) === 'non' || difficultes(el) >= 2);
  return `
    <div class="ligne reglage-outil">
      <label class="large-outil">Geste observé<select data-lb-champ="gestes.actif">${cfg.gestes.map(x => `<option value="${x.id}" ${x.id === cfg.actif ? 'selected' : ''}>${esc(x.nom)}</option>`).join('')}</select></label>
      <label>Autre geste<input data-lb-nouveau-geste maxlength="80" placeholder="ex. Réaliser un frottis"></label>
      <button data-lb="geste-ajout">+ Ajouter</button>
      ${g && cfg.gestes.length > 1 ? `<button class="icone-petit" data-lb="geste-suppr" data-arg="${g.id}" title="Retirer ce geste de la liste" aria-label="Retirer ce geste">🗑</button>` : ''}
    </div>
    ${htmlPresents(c)}
    <p class="aide">Un toucher sur l’élève : ✅ réussi → 🟠 avec aide → ❌ à reprendre → pas encore vu.</p>
    <div class="bilan-appel">${Object.entries(ETATS_GESTE).map(([k, [i, nom]]) => `<span class="pastille-appel">${i} <b>${nb(k)}</b> ${nom.toLocaleLowerCase('fr')}</span>`).join('')}
      <span class="aide">${nb('')} pas encore vu${nb('') > 1 ? 's' : ''}</span></div>
    <div class="chips-gestes">${presents.map(el => { const e = etatGeste(cfg, cfg.actif, el.id); return `<button type="button" class="chip-geste ${e}" data-lb="geste-etat" data-arg="${el.id}"
      title="${esc(e ? ETATS_GESTE[e][1] : 'Pas encore vu')}">${e ? ETATS_GESTE[e][0] + ' ' : ''}${esc(nomEleveOutil(el))}</button>`; }).join('')}</div>
    ${aider.length ? `<div class="alerte-sante">👉 <b>À aider en priorité</b> : ${aider.map(el => `${esc(nomEleveOutil(el))}${difficultes(el) >= 2 ? ` <span class="aide">(${difficultes(el)} gestes)</span>` : ''}`).join(', ')}</div>` : ''}
    <details class="reglages-labo"><summary>📋 Tous les gestes, élève par élève</summary>
      <div class="table-defile"><table class="table-labo"><thead><tr><th>Élève</th>${cfg.gestes.map(x => `<th title="${esc(x.nom)}">${esc(resumeTexte(x.nom, 22))}</th>`).join('')}</tr></thead>
        <tbody>${els.map(el => `<tr><th>${esc(nomEleveOutil(el))}</th>${cfg.gestes.map(x => { const e = etatGeste(cfg, x.id, el.id); return `<td title="${esc(e ? ETATS_GESTE[e][1] : '')}">${e ? ETATS_GESTE[e][0] : ''}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>
    </details>`;
}

TRANSFERTS.gestes = c => {
  const cfg = cfgGestes(c), els = elevesDe(c.id);
  const colonnes = cfg.gestes.map(g => ({ nom: g.nom, type: 'choix', options: Object.values(ETATS_GESTE).map(x => x[1]),
    valeurs: Object.fromEntries(els.filter(el => etatGeste(cfg, g.id, el.id)).map(el => [el.id, ETATS_GESTE[etatGeste(cfg, g.id, el.id)][1]])) }))
    .filter(col => Object.keys(col.valeurs).length);
  if (!colonnes.length) throw new Error('Aucun geste noté.');
  return { titre: 'Gestes techniques', apsa: '', colonnes };
};

/* ====================== 📊 Mise en commun des résultats ====================== */

function cfgResultats(c) {
  return ((etatOutils.resultats ??= {})[c.id] ??= {
    mesure: '', unite: '', variable: '', uniteX: '',
    lignes: Array.from({ length: 6 }, (_, k) => ({ id: idLabo(), groupe: 'Groupe ' + (k + 1), x: '', y: '' })),
  });
}

// Statistiques d'une liste de nombres (écart-type de l'échantillon).
function statsLabo(v) {
  const n = v.length;
  if (!n) return null;
  const tri = [...v].sort((a, b) => a - b), moy = v.reduce((a, b) => a + b, 0) / n;
  const med = n % 2 ? tri[(n - 1) / 2] : (tri[n / 2 - 1] + tri[n / 2]) / 2;
  const et = n > 1 ? Math.sqrt(v.reduce((s, x) => s + (x - moy) ** 2, 0) / (n - 1)) : 0;
  return { n, moy, med, min: tri[0], max: tri[n - 1], et };
}

function htmlResultats(c) {
  const cfg = cfgResultats(c), avecX = !!cfg.variable.trim();
  return `
    <div class="ligne reglage-outil">
      <label class="large-outil">Mesure<input data-lb-res="mesure" value="${esc(cfg.mesure)}" maxlength="60" placeholder="ex. Volume de dioxygène produit"></label>
      <label class="etroit">Unité<input data-lb-res="unite" value="${esc(cfg.unite)}" maxlength="15" placeholder="ex. mL"></label>
    </div>
    <div class="ligne reglage-outil">
      <label class="large-outil">Selon (facultatif)<input data-lb-res="variable" value="${esc(cfg.variable)}" maxlength="60" placeholder="ex. Température — chaque groupe teste une valeur"></label>
      <label class="etroit">Unité<input data-lb-res="uniteX" value="${esc(cfg.uniteX)}" maxlength="15" placeholder="ex. °C"></label>
      <button data-lb="res-appliquer">✔ Appliquer</button>
    </div>
    <div class="table-defile"><table class="table-labo saisie-labo"><thead><tr><th>Groupe</th>${avecX ? `<th>${esc(cfg.variable)}${cfg.uniteX ? ' (' + esc(cfg.uniteX) + ')' : ''}</th>` : ''}
      <th>${esc(cfg.mesure || 'Mesure')}${cfg.unite ? ' (' + esc(cfg.unite) + ')' : ''}</th><th></th></tr></thead>
      <tbody>${cfg.lignes.map(l => `<tr>
        <td><input data-lb-ligne="${l.id}|groupe" value="${esc(l.groupe)}" maxlength="40" aria-label="Groupe"></td>
        ${avecX ? `<td><input data-lb-ligne="${l.id}|x" value="${esc(l.x)}" maxlength="15" inputmode="decimal" aria-label="${esc(cfg.variable)}"></td>` : ''}
        <td><input data-lb-ligne="${l.id}|y" value="${esc(l.y)}" maxlength="15" inputmode="decimal" aria-label="${esc(cfg.mesure || 'Mesure')} — ${esc(l.groupe)}"></td>
        <td><button class="icone-petit" data-lb="res-suppr" data-arg="${l.id}" aria-label="Retirer ce groupe">🗑</button></td></tr>`).join('')}</tbody></table></div>
    <div class="boutons-outil"><button data-lb="res-ajout">+ Groupe</button>
      <button data-lb="res-vider" title="Effacer les valeurs (les groupes restent)">↺ Vider les valeurs</button>
      <button data-lb="res-copier" title="Copier le tableau (à coller dans un tableur)">📋 Copier le tableau</button></div>
    <div data-lb-bilan>${htmlBilanResultats(cfg)}</div>`;
}

// Bilan et graphique (redessinés seuls pendant la saisie : le champ en cours garde la main).
function htmlBilanResultats(cfg) {
  const avecX = !!cfg.variable.trim(), u = cfg.unite ? ' ' + cfg.unite : '';
  const points = cfg.lignes.map(l => ({ l, y: nombreLabo(l.y), x: avecX ? String(l.x).trim() : '' })).filter(p => p.y !== null && (!avecX || p.x));
  const s = statsLabo(points.map(p => p.y));
  if (!s) return '<p class="aide">Les résultats apparaîtront ici dès que les groupes auront saisi leur mesure.</p>';
  // Valeur à vérifier : à plus de 2 écarts-types de la moyenne (ou de la moyenne de sa condition), dès 4 valeurs.
  const parX = new Map();
  for (const p of points) { if (!parX.has(p.x)) parX.set(p.x, []); parX.get(p.x).push(p); }
  const aVerifier = [...parX.values()].flatMap(liste => {
    const st = statsLabo(liste.map(p => p.y));
    return st.n >= 4 && st.et ? liste.filter(p => Math.abs(p.y - st.moy) > 2 * st.et) : [];
  });
  const ligne = (nom, st) => `<tr><th>${esc(nom)}</th><td>${st.n}</td><td><b>${fmtLabo(st.moy)}</b></td><td>${fmtLabo(st.med)}</td><td>${fmtLabo(st.min)} – ${fmtLabo(st.max)}</td><td>${fmtLabo(st.et)}</td></tr>`;
  const conditions = avecX ? trierConditions([...parX.keys()]) : [];
  return `
    <div class="table-defile"><table class="table-labo stats-labo"><thead><tr><th>${avecX ? esc(cfg.variable) : ''}</th><th>Groupes</th><th>Moyenne${esc(u)}</th><th>Médiane</th><th>Min – max</th><th>Écart-type</th></tr></thead>
      <tbody>${avecX ? conditions.map(x => ligne(x + (cfg.uniteX ? ' ' + cfg.uniteX : ''), statsLabo(parX.get(x).map(p => p.y)))).join('') : ''}${ligne(avecX ? 'Toute la classe' : 'Classe', s)}</tbody></table></div>
    ${aVerifier.length ? `<p class="alerte-sante">🔎 <b>À vérifier</b> (loin des autres) : ${aVerifier.map(p => `${esc(p.l.groupe)} (${fmtLabo(p.y)}${esc(u)})`).join(', ')}
      — erreur de mesure, ou résultat à discuter ?</p>` : ''}
    ${avecX ? graphiqueConditions(cfg, conditions, parX) : graphiqueGroupes(cfg, points, s)}`;
}

// Conditions dans l'ordre des nombres (« 10 °C » avant « 37 °C »), sinon dans l'ordre de saisie.
const trierConditions = l => (l.every(x => nombreLabo(x) !== null) ? [...l].sort((a, b) => nombreLabo(a) - nombreLabo(b)) : l);

// Graphiques en SVG (attributs seulement : la CSP interdit les styles en ligne ; couleurs par classes CSS).
// Échelle verticale : depuis 0 si toutes les valeurs sont positives ; graduations à pas ronds (1, 2, 2,5 ou 5 × 10ⁿ).
function echelleLabo(min, max) {
  if (min === max) { min -= 1; max += 1; }
  const bas = min >= 0 ? 0 : min, brut = (max - bas) / 4, puissance = 10 ** Math.floor(Math.log10(brut)), r = brut / puissance;
  const pas = (r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10) * puissance;
  return [Math.floor(bas / pas) * pas, Math.ceil(max / pas) * pas, pas];
}
function axesLabo(L, H, g, [ymin, ymax, pas], unite) {
  const y = v => H - g.b - ((v - ymin) / (ymax - ymin)) * (H - g.t - g.b);
  const graduations = Array.from({ length: Math.round((ymax - ymin) / pas) + 1 }, (_, k) => ymin + k * pas).map(v => `<line class="grille-graph" x1="${g.l}" x2="${L - g.r}" y1="${y(v)}" y2="${y(v)}"/>
    <text class="texte-graph" x="${g.l - 6}" y="${y(v) + 4}" text-anchor="end">${fmtLabo(v)}</text>`).join('');
  return { y, svg: `${graduations}<line class="axe-graph" x1="${g.l}" x2="${g.l}" y1="${g.t}" y2="${H - g.b}"/><line class="axe-graph" x1="${g.l}" x2="${L - g.r}" y1="${H - g.b}" y2="${H - g.b}"/>
    ${unite ? `<text class="texte-graph" x="${g.l}" y="${g.t - 8}">${esc(unite)}</text>` : ''}` };
}
function graphiqueGroupes(cfg, points, s) {
  const L = 720, H = 320, g = { l: 56, r: 16, t: 26, b: 56 }, larg = (L - g.l - g.r) / points.length;
  const echelle = echelleLabo(Math.min(...points.map(p => p.y)), Math.max(...points.map(p => p.y))), [ymin, ymax] = echelle;
  const { y, svg } = axesLabo(L, H, g, echelle, cfg.unite);
  const zero = y(Math.min(ymax, Math.max(ymin, 0))); // (les barres partent de 0)
  const barres = points.map((p, k) => {
    const x = g.l + k * larg + larg * 0.18, haut = Math.min(y(p.y), zero);
    return `<rect class="barre-graph" x="${x}" y="${haut}" width="${larg * 0.64}" height="${Math.abs(zero - y(p.y))}"><title>${esc(p.l.groupe)} : ${fmtLabo(p.y)}</title></rect>
      <text class="texte-graph" x="${x + larg * 0.32}" y="${H - g.b + 16}" text-anchor="middle">${esc(resumeTexte(p.l.groupe, 12))}</text>
      <text class="valeur-graph" x="${x + larg * 0.32}" y="${haut - 5}" text-anchor="middle">${fmtLabo(p.y)}</text>`;
  }).join('');
  return `<figure class="graph-labo"><svg viewBox="0 0 ${L} ${H}" role="img" aria-label="${esc(cfg.mesure || 'Mesure')} par groupe">${svg}${barres}
    <line class="moyenne-graph" x1="${g.l}" x2="${L - g.r}" y1="${y(s.moy)}" y2="${y(s.moy)}"/><text class="moyenne-texte" x="${L - g.r}" y="${y(s.moy) - 6}" text-anchor="end">moyenne ${fmtLabo(s.moy)}</text></svg>
    <figcaption>${esc(cfg.mesure || 'Mesure')} de chaque groupe ; trait : moyenne de la classe.</figcaption></figure>`;
}
function graphiqueConditions(cfg, conditions, parX) {
  const L = 720, H = 320, g = { l: 56, r: 16, t: 26, b: 56 }, tous = [...parX.values()].flat().map(p => p.y);
  const { y, svg } = axesLabo(L, H, g, echelleLabo(Math.min(...tous), Math.max(...tous)), cfg.unite);
  const xs = conditions.map((_, k) => g.l + ((k + 0.5) * (L - g.l - g.r)) / conditions.length);
  const moyennes = conditions.map(x => statsLabo(parX.get(x).map(p => p.y)).moy);
  const pts = conditions.map((x, k) => parX.get(x).map((p, j) => `<circle class="point-graph" cx="${xs[k] + (j - (parX.get(x).length - 1) / 2) * 7}" cy="${y(p.y)}" r="5"><title>${esc(p.l.groupe)} : ${fmtLabo(p.y)}</title></circle>`).join('')
    + `<text class="texte-graph" x="${xs[k]}" y="${H - g.b + 16}" text-anchor="middle">${esc(resumeTexte(x, 12))}</text>`).join('');
  return `<figure class="graph-labo"><svg viewBox="0 0 ${L} ${H}" role="img" aria-label="${esc(cfg.mesure || 'Mesure')} selon ${esc(cfg.variable)}">${svg}${pts}
    <polyline class="courbe-graph" points="${moyennes.map((m, k) => `${xs[k]},${y(m)}`).join(' ')}"/>
    ${moyennes.map((m, k) => `<circle class="moy-point-graph" cx="${xs[k]}" cy="${y(m)}" r="6"><title>moyenne : ${fmtLabo(m)}</title></circle>`).join('')}
    <text class="texte-graph" x="${L - g.r}" y="${H - 10}" text-anchor="end">${esc(cfg.variable)}${cfg.uniteX ? ' (' + esc(cfg.uniteX) + ')' : ''}</text></svg>
    <figcaption>Points : chaque groupe ; ligne : moyenne pour chaque valeur de « ${esc(cfg.variable)} ».</figcaption></figure>`;
}

/* ====================== ⚠️ Sécurité au labo ====================== */

const EPI_LABO = [['blouse', '🥼', 'Blouse en coton, fermée'], ['lunettes', '🥽', 'Lunettes de protection'], ['gants', '🧤', 'Gants (nitrile)'],
  ['cheveux', '💇', 'Cheveux longs attachés'], ['paillasse', '🧽', 'Paillasse dégagée : seulement le matériel du TP']];
const DANGERS_LABO = [
  ['flamme', '🔥', 'Inflammable / source de chaleur : rien d’inflammable à côté, ne jamais laisser sans surveillance'],
  ['corrosif', '🧪', 'Produit corrosif : gants et lunettes, au-dessus de la paillasse, rincer abondamment en cas de contact'],
  ['toxique', '☠️', 'Produit toxique : ne jamais pipeter à la bouche, se laver les mains après le TP'],
  ['irritant', '❗', 'Produit irritant : éviter tout contact avec la peau et les yeux'],
  ['coupant', '🔪', 'Scalpel, lame : couper vers le plateau, poser la lame à plat'],
  ['verre', '🔬', 'Verrerie, lames, lamelles : signaler tout bris au professeur, ne rien ramasser à la main'],
  ['biologique', '🦠', 'Matériel biologique : gants, rien à la bouche, lavage des mains en fin de TP'],
  ['chaleur', '♨️', 'Plaque chauffante, bain-marie : ne pas toucher, laisser refroidir'],
  ['electrique', '🔌', 'Appareils électriques, ExAO : mains sèches, pas d’eau à côté'],
  ['dechets', '🗑️', 'Déchets et produits : dans les bacs prévus, jamais à l’évier'],
];
function cfgSecurite(c) {
  return ((etatOutils.securite ??= {})[c.id] ??= { titre: '', epi: ['blouse', 'paillasse'], dangers: [], consignes: '' });
}

function htmlSecurite(c) {
  const cfg = cfgSecurite(c), auj = aujourdhui();
  const choisis = [...EPI_LABO.filter(x => cfg.epi.includes(x[0])), ...DANGERS_LABO.filter(x => cfg.dangers.includes(x[0]))];
  const libres = cfg.consignes.split('\n').map(t => t.trim()).filter(Boolean);
  // Pour le professeur : élèves avec un PAI, oublis de matériel notés aujourd'hui (appel ou séance du jour).
  const els = elevesDe(c.id), pai = els.filter(el => aPai(el));
  const seancesJour = seancesDe(c.id).filter(s => s.date === auj);
  const oublis = els.filter(el => seancesJour.some(s => statutEnt(s.id, el.id) === 'TEN'));
  const coche = (liste, [id, icone, texte]) => `<label class="case"><input type="checkbox" data-lb-secu="${liste}|${id}" ${cfg[liste].includes(id) ? 'checked' : ''}> ${icone} ${esc(texte)}</label>`;
  return `
    <details class="reglages-labo" data-lb-details="securite" ${cfg.prepa !== false ? 'open' : ''}><summary>⚙ Préparer les consignes du TP</summary>
      <div class="ligne reglage-outil"><label class="large-outil">TP<input data-lb-champ="securite.titre" value="${esc(cfg.titre)}" maxlength="120" placeholder="ex. Dissection de la souris — appareil digestif"></label></div>
      <div class="colonnes-labo"><fieldset><legend>Équipement</legend>${EPI_LABO.map(x => coche('epi', x)).join('')}</fieldset>
        <fieldset><legend>Dangers du TP</legend>${DANGERS_LABO.map(x => coche('dangers', x)).join('')}</fieldset></div>
      <label>Autres consignes (une par ligne)<textarea data-lb-champ="securite.consignes" rows="3" placeholder="ex. Lire tout le protocole avant de commencer">${esc(cfg.consignes)}</textarea></label>
      <div class="boutons-outil"><button data-lb="secu-appliquer">✔ Mettre à jour l’affichage</button></div>
    </details>
    <section class="consignes-labo">
      <h3>⚠️ Sécurité${cfg.titre ? ' — ' + esc(cfg.titre) : ' au laboratoire'}</h3>
      ${choisis.length || libres.length ? `<ul>${choisis.map(([, icone, texte]) => `<li><span class="icone-consigne" aria-hidden="true">${icone}</span>${esc(texte)}</li>`).join('')}
        ${libres.map(t => `<li><span class="icone-consigne" aria-hidden="true">👉</span>${esc(t)}</li>`).join('')}</ul>`
      : '<p class="aide">Coche l’équipement et les dangers du TP ci-dessus : les consignes s’affichent ici, en grand (⛶ Plein écran pour les projeter).</p>'}
    </section>
    <details class="prof-labo"><summary>🔒 Pour le professeur — ne pas projeter <span class="aide">(${pai.length} PAI · ${oublis.length} oubli${oublis.length > 1 ? 's' : ''} de matériel aujourd’hui)</span></summary>
      ${pai.length ? `<h4>Élèves avec un PAI</h4><ul class="liste-fiche">${pai.map(el => `<li><b>${esc(el.prenom)} ${esc(el.nom)}</b>${el.paiInfo ? ' — ' + esc(el.paiInfo) : ''}</li>`).join('')}</ul>`
      : '<p class="aide">Aucun PAI dans cette classe.</p>'}
      ${oublis.length ? `<h4>Oubli de matériel aujourd’hui (appel)</h4><p>${oublis.map(el => esc(`${el.prenom} ${el.nom}`)).join(', ')} : prévoir une blouse de prêt.</p>`
      : '<p class="aide">Aucun oubli de matériel noté aujourd’hui (onglet Appel).</p>'}
    </details>`;
}

/* ====================== 👫 Binômes de TP ====================== */

function cfgBinomes(c) {
  return ((etatOutils.binomes ??= {})[c.id] ??= { taille: 2, composition: 'heterogene', critere: 'moyenne', eviter: true, liste: [], historique: [], selection: null });
}
// Paires déjà faites (« idA|idB », dans l'ordre) dans les séances retenues.
const clePaire = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
function pairesDeja(cfg) {
  const n = new Map();
  for (const groupes of cfg.historique) for (const gr of groupes) for (let i = 0; i < gr.length; i++) for (let j = i + 1; j < gr.length; j++) {
    const k = clePaire(gr[i], gr[j]); n.set(k, (n.get(k) || 0) + 1);
  }
  return n;
}

// Plusieurs essais (un peu de hasard à chaque fois) ; on garde le moins de binômes déjà faits, puis les niveaux les plus proches entre paillasses.
function faireBinomes(c, cfg) {
  const els = presentsOutil(c);
  if (els.length < 2) throw new Error('Il faut au moins deux élèves présents.');
  const nb = Math.max(1, Math.floor(els.length / cfg.taille)); // (le reste complète des binômes en trios)
  const niv = cfg.composition === 'aleatoire' ? () => null : niveauOutil(c, cfg.critere);
  const connus = els.map(el => niv(el.id)?.val).filter(v => v !== null && v !== undefined);
  const milieu = connus.length ? connus.reduce((a, b) => a + b, 0) / connus.length : 0;
  const deja = cfg.eviter ? pairesDeja(cfg) : new Map();
  const etendue = connus.length ? Math.max(...connus) - Math.min(...connus) || 1 : 1;
  let meilleur = null;
  for (let essai = 0; essai < 80; essai++) {
    const bruit = new Map(els.map(el => [el.id, (niv(el.id)?.val ?? milieu) + (Math.random() - 0.5) * etendue * 0.25]));
    const groupes = repartir(melange(els), nb, { composition: cfg.composition, mixite: 'indifferent' }, id => bruit.get(id)).filter(g => g.length);
    let repetes = 0;
    for (const gr of groupes) for (let i = 0; i < gr.length; i++) for (let j = i + 1; j < gr.length; j++) repetes += deja.get(clePaire(gr[i], gr[j])) || 0;
    const moy = gr => gr.reduce((s, id) => s + (niv(id)?.val ?? milieu), 0) / gr.length;
    const ecart = cfg.composition === 'heterogene' ? Math.max(...groupes.map(moy)) - Math.min(...groupes.map(moy)) : 0;
    const score = repetes * 1000 + ecart;
    if (!meilleur || score < meilleur.score) meilleur = { score, groupes, repetes };
    if (!repetes && cfg.composition === 'aleatoire') break;
  }
  cfg.liste = meilleur.groupes;
  cfg.selection = null;
  return meilleur.repetes;
}

function htmlBinomes(c) {
  const cfg = cfgBinomes(c), deja = pairesDeja(cfg);
  const niv = cfg.composition === 'aleatoire' || enModeEleve() ? null : niveauOutil(c, cfg.critere);
  const choix = (champ, valeurs) => valeurs.map(([v, nom]) => `<option value="${v}" ${String(cfg[champ]) === String(v) ? 'selected' : ''}>${nom}</option>`).join('');
  const groupes = cfg.liste.map(gr => gr.filter(id => Donnees.get('eleves', id))).filter(g => g.length);
  return `
    ${htmlPresents(c)}
    <div class="ligne reglage-outil">
      <label>Par paillasse<select data-lb-champ="binomes.taille">${choix('taille', [[2, '2 élèves (binômes)'], [3, '3 élèves (trinômes)'], [4, '4 élèves']])}</select></label>
      <label>Composition<select data-lb-champ="binomes.composition">${choix('composition', [['heterogene', 'Niveaux mélangés'], ['homogene', 'Niveaux proches'], ['aleatoire', 'Au hasard']])}</select></label>
      ${cfg.composition !== 'aleatoire' && !enModeEleve() ? `<label>Niveau d’après<select data-lb-champ="binomes.critere">${criteresNiveau(c).map(gr => `${gr.groupe ? `<optgroup label="${esc(gr.groupe)}">` : ''}${gr.liste.map(([v, nom]) =>
        `<option value="${esc(v)}" ${cfg.critere === v ? 'selected' : ''}>${esc(nom)}</option>`).join('')}${gr.groupe ? '</optgroup>' : ''}`).join('')}</select></label>` : ''}
      <label class="case"><input type="checkbox" data-lb-champ="binomes.eviter" ${cfg.eviter ? 'checked' : ''}> Éviter les binômes déjà faits</label>
    </div>
    <div class="boutons-outil">
      <button class="primaire gros" data-lb="binomes-faire">🎲 ${groupes.length ? 'Refaire les binômes' : 'Faire les binômes'}</button>
      ${groupes.length && !enModeEleve() ? `<button data-lb="binomes-retenir" title="Mémoriser ces binômes : les prochains tirages éviteront de les refaire">📌 Retenir pour la suite</button>` : ''}
      ${cfg.historique.length && !enModeEleve() ? `<button data-lb="binomes-oublier" title="Oublier les binômes retenus">Oublier l’historique (${cfg.historique.length} TP)</button>` : ''}
    </div>
    ${groupes.length ? `<p class="aide">Touche deux élèves de paillasses différentes pour les échanger.</p>
    <div class="paillasses">${groupes.map((gr, k) => {
      const refait = gr.some((a, i) => gr.slice(i + 1).some(b => deja.has(clePaire(a, b))));
      const moy = niv ? gr.map(id => niv(id)?.val).filter(v => v !== null && v !== undefined) : [];
      return `<div class="paillasse${refait ? ' refait' : ''}"><div class="tete-labo"><b>Paillasse ${k + 1}</b>
        ${moy.length ? `<span class="aide">niveau ${fmtLabo(moy.reduce((a, b) => a + b, 0) / moy.length)}</span>` : ''}${refait ? '<span class="aide">· déjà ensemble</span>' : ''}</div>
        ${gr.map(id => `<button type="button" class="chip-present${cfg.selection === id ? ' choisi' : ''}" data-lb="binomes-choisir" data-arg="${id}">${esc(nomOutil(id))}</button>`).join('')}</div>`;
    }).join('')}</div>` : '<p class="aide">Coche les absents (👤 Présents), puis « Faire les binômes ».</p>'}`;
}

TRANSFERTS.binomes = c => {
  const cfg = cfgBinomes(c), groupes = cfg.liste.filter(g => g.length);
  if (!groupes.length) throw new Error('Fais d’abord les binômes.');
  const noms = groupes.map((_, k) => 'Paillasse ' + (k + 1));
  return { titre: 'Binômes de TP', apsa: '', colonnes: [{ nom: 'Paillasse', type: 'choix', options: noms,
    valeurs: Object.fromEntries(groupes.flatMap((gr, k) => gr.map(id => [id, noms[k]]))) }] };
};

Object.assign(RENDUS_OUTILS, { schema: htmlSchema, gestes: htmlGestes, resultats: htmlResultats, securite: htmlSecurite, binomes: htmlBinomes });

/* ====================== Actions ====================== */

function actionLabo(action, arg, c) {
  switch (action) {
    // Schéma
    case 'schema-filtre': cfgSchema(c).filtre = arg; return rendreOutil();
    case 'schema-vu': { const cfg = cfgSchema(c); cfg.coches[arg] ||= []; bipToucher(); return rendreOutil(); }
    case 'schema-raz': delete cfgSchema(c).coches[arg]; return rendreOutil();
    case 'schema-coche': {
      const cfg = cfgSchema(c), [id, k] = arg.split('|'), l = (cfg.coches[id] ||= []);
      cfg.coches[id] = l.includes(k) ? l.filter(x => x !== k) : [...l, k];
      bipToucher();
      return rendreOutil();
    }
    case 'schema-ajout': { const cfg = cfgSchema(c); cfg.criteres.push({ id: idLabo(), nom: 'Nouveau critère', pts: 1 }); cfg.reglages = true; return rendreOutil(); }
    case 'schema-suppr': { const cfg = cfgSchema(c); cfg.criteres = cfg.criteres.filter(k => k.id !== arg); cfg.reglages = true; return rendreOutil(); }
    case 'schema-appliquer': cfgSchema(c).reglages = true; return rendreOutil();
    case 'schema-origine': return lancer(async () => {
      if (!(await confirmer('Reprendre les critères d’origine ? (Les critères cochés pour des critères retirés sont oubliés.)', 'Reprendre'))) return;
      const cfg = cfgSchema(c); cfg.criteres = criteresSchemaDefaut(); cfg.reglages = true; rendreOutil();
    });
    case 'schema-notes': return lancer(() => versNotesSchema(c, cfgSchema(c)));
    case 'schema-copier': {
      const cfg = cfgSchema(c);
      return lancer(() => copierTexte(elevesDe(c.id).filter(el => cfg.coches[el.id]).map(el => `${nomOutil(el.id)}\t${fmt(noteSchema(cfg, el.id))}/${fmt(totalSchema(cfg))}\t`
        + cfg.criteres.filter(k => !cfg.coches[el.id].includes(k.id)).map(k => 'à revoir : ' + k.nom).join(' · ')).join('\n')));
    }
    // Gestes
    case 'geste-etat': {
      const cfg = cfgGestes(c), e = (cfg.etats[cfg.actif] ||= {});
      const suite = SUITE_GESTE[e[arg] || ''];
      if (suite) e[arg] = suite; else delete e[arg];
      bipToucher();
      return rendreOutil();
    }
    case 'geste-ajout': {
      const t = $('#vue [data-lb-nouveau-geste]')?.value.trim();
      if (!t) return toast('Écris d’abord le nom du geste.', 'erreur');
      const cfg = cfgGestes(c), g = { id: idLabo(), nom: t };
      cfg.gestes.push(g); cfg.actif = g.id;
      return rendreOutil();
    }
    case 'geste-suppr': return lancer(async () => {
      const cfg = cfgGestes(c), g = cfg.gestes.find(x => x.id === arg);
      if (!g || !(await confirmer(`Retirer « ${g.nom} » et ce qui a été noté pour ce geste ?`, 'Retirer'))) return;
      cfg.gestes = cfg.gestes.filter(x => x.id !== arg); delete cfg.etats[arg];
      rendreOutil();
    });
    // Mise en commun
    case 'res-appliquer': return rendreOutil();
    case 'res-ajout': { const cfg = cfgResultats(c); cfg.lignes.push({ id: idLabo(), groupe: 'Groupe ' + (cfg.lignes.length + 1), x: '', y: '' }); return rendreOutil(); }
    case 'res-suppr': { const cfg = cfgResultats(c); cfg.lignes = cfg.lignes.filter(l => l.id !== arg); return rendreOutil(); }
    case 'res-vider': return lancer(async () => {
      if (!(await confirmer('Effacer toutes les valeurs saisies (les groupes restent) ?', 'Effacer'))) return;
      for (const l of cfgResultats(c).lignes) { l.y = ''; l.x = ''; }
      rendreOutil();
    });
    case 'res-copier': {
      const cfg = cfgResultats(c), avecX = !!cfg.variable.trim();
      const tete = ['Groupe', ...(avecX ? [cfg.variable + (cfg.uniteX ? ` (${cfg.uniteX})` : '')] : []), (cfg.mesure || 'Mesure') + (cfg.unite ? ` (${cfg.unite})` : '')];
      return lancer(() => copierTexte([tete, ...cfg.lignes.map(l => [l.groupe, ...(avecX ? [l.x] : []), l.y])].map(r => r.join('\t')).join('\n')));
    }
    // Sécurité
    case 'secu-appliquer': return rendreOutil();
    // Binômes
    case 'binomes-faire': {
      const repetes = faireBinomes(c, cfgBinomes(c));
      bipToucher();
      rendreOutil();
      if (repetes) toast(`Impossible d’éviter tous les binômes déjà faits : ${repetes} paire${repetes > 1 ? 's' : ''} déjà vue${repetes > 1 ? 's' : ''}.`);
      return;
    }
    case 'binomes-retenir': {
      const cfg = cfgBinomes(c);
      cfg.historique = [...cfg.historique, cfg.liste.map(g => [...g])].slice(-12); // (les 12 derniers TP)
      toast('Binômes retenus ✔ : les prochains tirages éviteront de les refaire.', 'ok');
      return rendreOutil();
    }
    case 'binomes-oublier': return lancer(async () => {
      if (!(await confirmer('Oublier les binômes retenus des TP précédents ?', 'Oublier'))) return;
      cfgBinomes(c).historique = []; rendreOutil();
    });
    case 'binomes-choisir': {
      const cfg = cfgBinomes(c);
      if (!cfg.selection || cfg.selection === arg) { cfg.selection = cfg.selection === arg ? null : arg; return rendreOutil(); }
      const de = cfg.liste.find(g => g.includes(cfg.selection)), vers = cfg.liste.find(g => g.includes(arg));
      if (de && vers && de !== vers) { de[de.indexOf(cfg.selection)] = arg; vers[vers.indexOf(arg)] = cfg.selection; cfg.selection = null; }
      else cfg.selection = arg;
      return rendreOutil();
    }
  }
}

document.addEventListener('click', e => {
  const b = e.target.closest('#vue [data-lb]');
  if (!b || b.disabled) return;
  const c = classeActive();
  if (c) lancer(() => actionLabo(b.dataset.lb, b.dataset.arg, c));
});

// Listes et cases : redessinées tout de suite. Champs texte : enregistrés au fil de la frappe, sans redessiner
// (sinon le champ perd la main) ; « ✔ Appliquer » / « Mettre à jour » redessine.
document.addEventListener('change', e => {
  const t = e.target, c = classeActive();
  if (!c || !t.closest?.('#vue .outil-corps')) return;
  if (t.dataset.lbChamp && (t.tagName === 'SELECT' || t.type === 'checkbox')) {
    const [outil, k] = t.dataset.lbChamp.split('.');
    const cfg = { schema: cfgSchema, gestes: cfgGestes, securite: cfgSecurite, binomes: cfgBinomes }[outil](c);
    cfg[k] = t.type === 'checkbox' ? t.checked : k === 'taille' ? +t.value : t.value;
    return rendreOutil();
  }
  if (t.dataset.lbSecu) {
    const [liste, id] = t.dataset.lbSecu.split('|'), cfg = cfgSecurite(c);
    cfg[liste] = t.checked ? [...new Set([...cfg[liste], id])] : cfg[liste].filter(x => x !== id);
    return rendreOutil();
  }
});

document.addEventListener('input', e => {
  const t = e.target, c = classeActive();
  if (!c || !t.closest?.('#vue .outil-corps')) return;
  if (t.dataset.lbChamp && t.tagName !== 'SELECT' && t.type !== 'checkbox') {
    const [outil, k] = t.dataset.lbChamp.split('.');
    ({ schema: cfgSchema, securite: cfgSecurite }[outil])(c)[k] = t.value;
    return sauverOutils();
  }
  if (t.dataset.lbCritere) {
    const [id, k] = t.dataset.lbCritere.split('|'), crit = cfgSchema(c).criteres.find(x => x.id === id);
    if (crit) crit[k] = k === 'pts' ? Math.max(0, nombreLabo(t.value) ?? 0) : t.value;
    return sauverOutils();
  }
  if (t.dataset.lbRes) { cfgResultats(c)[t.dataset.lbRes] = t.value; return sauverOutils(); }
  if (t.dataset.lbLigne) {
    const cfg = cfgResultats(c), [id, k] = t.dataset.lbLigne.split('|'), l = cfg.lignes.find(x => x.id === id);
    if (!l) return;
    l[k] = t.value;
    sauverOutils();
    const zone = $('#vue [data-lb-bilan]');
    if (zone) zone.innerHTML = htmlBilanResultats(cfg); // (seuls le bilan et le graphique bougent)
  }
});

// Panneaux de réglage (critères du schéma, préparation des consignes) : ouvert / fermé gardé d'un dessin à l'autre.
document.addEventListener('toggle', e => {
  const c = classeActive(), quoi = e.target.dataset?.lbDetails;
  if (!c || !quoi || !e.target.closest('#vue')) return;
  if (quoi === 'schema') cfgSchema(c).reglages = e.target.open;
  if (quoi === 'securite') { cfgSecurite(c).prepa = e.target.open; sauverOutils(); }
}, true);
