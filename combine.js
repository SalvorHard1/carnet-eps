'use strict';
// Outil « 🏅 Combiné » (onglet Outils) : combiné athlétique de plusieurs épreuves (temps, distances, points).
//  - Épreuves au choix (course, saut, lancer…), 1 à 3 essais, meilleure performance retenue.
//  - Classement : à la somme des places (la plus petite gagne), ou au barème (points par épreuve, de 0 au maximum,
//    entre la performance « 0 point » et la performance « maximum » réglées par le prof).
//  - Vagues de départ : N élèves par vague, au hasard, homogènes ou hétérogènes, mixtes ou non ; niveau d'après
//    le combiné en cours, une épreuve, ou le carnet. Chrono de vague : un toucher sur l'élève à l'arrivée.
// Comme les autres outils, l'état est gardé sur cet appareil ; « 📤 Vers une leçon » envoie les résultats dans le carnet.
// (Chargé après outils.js, dont il réutilise les outils : présents, répartition, chrono, envoi vers une leçon.)

const TYPES_EPREUVE = { temps: 'Temps (course, natation)', distance: 'Distance (saut, lancer)', points: 'Points / score' };
const UNITES_EPREUVE = { temps: 's', distance: 'm', points: 'pts' };
const PRESETS_COMBINE = [
  ['Triathlon (course, saut, lancer)', [['50 m', 'temps'], ['Saut en longueur', 'distance'], ['Lancer de poids', 'distance']]],
  ['Haies, hauteur, javelot', [['50 m haies', 'temps'], ['Saut en hauteur', 'distance'], ['Lancer de javelot', 'distance']]],
  ['Pentathlon', [['50 m', 'temps'], ['50 m haies', 'temps'], ['Saut en longueur', 'distance'], ['Lancer de poids', 'distance'], ['600 m', 'temps']]],
];

// Famille « APSA » : les outils propres à une activité (le combiné athlétique d'abord).
if (!FAMILLES_OUTILS.some(f => f.id === 'apsa')) FAMILLES_OUTILS.push({ id: 'apsa', nom: 'APSA' });
OUTILS.push({ id: 'combine', famille: 'apsa', icone: '🏅', nom: 'Combiné athlétique', info: 'Temps, distances, points ; vagues de départ par niveau', classe: true });

const idEpreuve = () => 'ep' + Math.random().toString(36).slice(2, 8);
function cfgCombine(c) {
  const cfg = (etatOutils.combine ??= {})[c.id] ??= { epreuves: [], calcul: 'places', maxPts: 20, perfs: {}, courante: null, vagues: null };
  cfg.vagues ??= { taille: 4, composition: 'aleatoire', mixite: 'indifferent', critere: 'combine', liste: [], courante: 0, course: null };
  if (cfg.courante !== '_classement' && !cfg.epreuves.some(ep => ep.id === cfg.courante)) cfg.courante = cfg.epreuves[0]?.id || null;
  return cfg;
}

/* ---------- Performances ---------- */

const plusPetitMieux = ep => ep.type === 'temps';
// Texte tapé → nombre (secondes, mètres ou points), 'X' pour un essai nul, null si illisible.
function lirePerf(ep, texte) {
  const v = String(texte ?? '').trim();
  if (!v) return '';
  if (/^x$/i.test(v)) return 'X';
  if (ep.type === 'temps') { const s = lireTemps(v); return s === null ? null : Math.round(s * 100) / 100; }
  const n = nombreOutil(v);
  return n === null || n < 0 ? null : n;
}
function textePerf(ep, v) {
  if (v === 'X') return 'X';
  if (v === '' || v === null || v === undefined) return '';
  if (ep.type === 'temps') return formatTemps(v).replace(/ s$/, '');
  return fmt(v);
}
// Avec l'unité : « 8,1 s », « 1:05,3 », « 3,6 m ».
const textePerfUnite = (ep, v) => (ep.type === 'temps' ? formatTemps(v) : textePerf(ep, v) + unitePerf(ep));
const unitePerf = ep => ' ' + (ep.unite || UNITES_EPREUVE[ep.type]);
function meilleurePerf(cfg, ep, id) {
  const ok = (cfg.perfs[id]?.[ep.id] || []).filter(x => typeof x === 'number');
  if (!ok.length) return null;
  return plusPetitMieux(ep) ? Math.min(...ok) : Math.max(...ok);
}

// Points au barème : linéaire entre la perf « 0 point » et la perf « maximum », bornés.
function pointsBareme(cfg, ep, v) {
  if (v === null) return null;
  const zero = ep.zero, max = ep.max;
  if (typeof zero !== 'number' || typeof max !== 'number' || zero === max) return null;
  const p = ((v - zero) / (max - zero)) * cfg.maxPts;
  return Math.round(Math.max(0, Math.min(cfg.maxPts, p)) * 10) / 10;
}

// Classement : pour chaque élève, sa meilleure perf par épreuve, sa place (ou ses points), le total et le rang.
function classementCombine(c, cfg) {
  const ids = [...new Set([...presentsOutil(c).map(el => el.id), ...Object.keys(cfg.perfs)])].filter(id => Donnees.get('eleves', id));
  const lignes = ids.map(id => ({ id, perfs: {}, scores: {}, total: 0, faites: 0 }));
  for (const ep of cfg.epreuves) {
    const avec = lignes.map(l => ({ l, v: meilleurePerf(cfg, ep, l.id) })).filter(x => x.v !== null);
    avec.sort((a, b) => (plusPetitMieux(ep) ? a.v - b.v : b.v - a.v));
    avec.forEach((x, k) => {
      x.l.perfs[ep.id] = x.v;
      // Ex aequo : même place.
      const place = k && x.v === avec[k - 1].v ? avec[k - 1].l.scores[ep.id] : k + 1;
      x.l.scores[ep.id] = cfg.calcul === 'places' ? place : pointsBareme(cfg, ep, x.v);
    });
  }
  const sansBareme = cfg.calcul === 'bareme' && cfg.epreuves.some(ep => pointsBareme(cfg, ep, 0) === null);
  for (const l of lignes) {
    const scores = cfg.epreuves.map(ep => l.scores[ep.id]).filter(s => s !== null && s !== undefined);
    l.faites = scores.length;
    l.total = Math.round(scores.reduce((a, b) => a + b, 0) * 10) / 10;
    l.complet = l.faites === cfg.epreuves.length && cfg.epreuves.length > 0;
  }
  // Les élèves complets d'abord, puis par nombre d'épreuves faites ; places : petit total d'abord ; barème : grand total d'abord.
  lignes.sort((a, b) => b.complet - a.complet || b.faites - a.faites || (cfg.calcul === 'places' ? a.total - b.total : b.total - a.total));
  lignes.forEach((l, k) => {
    const p = lignes[k - 1];
    l.rang = !l.faites ? null : p && p.faites === l.faites && p.complet === l.complet && p.total === l.total ? p.rang : k + 1;
  });
  return { lignes, sansBareme };
}

/* ---------- Vagues de départ ---------- */

function criteresVagues(c, cfg) {
  const base = [['combine', 'Classement du combiné en cours'], ...cfg.epreuves.map(ep => ['ep:' + ep.id, 'Performance : ' + ep.nom])];
  // En mode élève, pas de critère lu dans les notes du carnet.
  return enModeEleve() ? [{ groupe: '', liste: base }] : [{ groupe: 'Combiné', liste: base }, ...criteresNiveau(c).map(g => ({ ...g, groupe: g.groupe || 'Carnet' }))];
}

function niveauVagues(c, cfg, critere) {
  if (critere === 'combine') {
    const { lignes } = classementCombine(c, cfg);
    const total = Object.fromEntries(lignes.filter(l => l.faites).map(l => [l.id, cfg.calcul === 'places' ? -l.total / l.faites : l.total]));
    return id => (id in total ? total[id] : null);
  }
  if (critere.startsWith('ep:')) {
    const ep = cfg.epreuves.find(x => x.id === critere.slice(3));
    return id => { const v = ep && meilleurePerf(cfg, ep, id); return v === null || v === undefined ? null : plusPetitMieux(ep) ? -v : v; };
  }
  const n = niveauOutil(c, critere);
  return id => n(id)?.val ?? null;
}

function faireVagues(c, cfg) {
  const v = cfg.vagues, els = melange(presentsOutil(c));
  if (!els.length) throw new Error('Aucun élève présent.');
  const taille = Math.max(1, v.taille);
  const avecNiveau = v.composition !== 'aleatoire';
  const brut = avecNiveau ? niveauVagues(c, cfg, v.critere) : () => null;
  const connus = els.map(el => brut(el.id)).filter(x => x !== null);
  if (avecNiveau && !connus.length) throw new Error('Aucun élève présent n’a encore de résultat pour ce critère : choisis-en un autre (ou « Au hasard »).');
  const moyenne = connus.length ? connus.reduce((a, b) => a + b, 0) / connus.length : 0;
  const val = id => brut(id) ?? moyenne;
  const reglage = { composition: v.composition, mixite: v.mixite };
  let listes;
  if (v.mixite === 'non-mixte') {
    // Vagues de filles et vagues de garçons ; élèves sans sexe indiqué avec le groupe le plus petit.
    const F = els.filter(el => el.sexe === 'F'), G = els.filter(el => el.sexe === 'G'), autres = els.filter(el => !['F', 'G'].includes(el.sexe));
    (F.length <= G.length ? F : G).push(...autres);
    listes = [...repartir(F, Math.ceil(F.length / taille), reglage, val), ...repartir(G, Math.ceil(G.length / taille), reglage, val)];
  } else listes = repartir(els, Math.ceil(els.length / taille), reglage, val);
  v.liste = listes.filter(l => l.length);
  v.courante = 0;
  v.course = null;
}

const courseCombine = v => v?.course;
// Réglages des vagues : dépliés au départ ; on garde le choix d'un dessin à l'autre.
// Réglages des épreuves : dépliés tant qu'il n'y a pas d'épreuve, puis comme on les a laissés.
let vaguesOuvertes = true, reglagesOuverts = null;
document.addEventListener('toggle', e => {
  if (e.target.matches?.('[data-oc-vagues-ouvertes]')) vaguesOuvertes = e.target.open;
  if (e.target.matches?.('[data-oc-reglages-ouverts]')) reglagesOuverts = e.target.open;
}, true);
const tempsCourse = co => (co?.depart ? (co.fin || Date.now()) - co.depart : 0);

/* ---------- Affichage ---------- */

function htmlCombine(c) {
  const cfg = cfgCombine(c), ep = cfg.epreuves.find(x => x.id === cfg.courante);
  const choix = (valeur, liste) => liste.map(([v, nom]) => `<option value="${esc(v)}" ${valeur === v ? 'selected' : ''}>${esc(nom)}</option>`).join('');
  let html = `
    <details class="carte reglages-combine" data-oc-reglages-ouverts ${reglagesOuverts ?? !cfg.epreuves.length ? 'open' : ''}>
      <summary>⚙ Épreuves et calcul <span class="aide">${cfg.epreuves.length} épreuve${cfg.epreuves.length > 1 ? 's' : ''} ·
        ${cfg.calcul === 'places' ? 'somme des places' : `barème sur ${fmt(cfg.maxPts)} pts par épreuve`}</span></summary>
      ${cfg.epreuves.length ? '' : `<p class="aide">Pour démarrer vite :</p><div class="boutons-outil">${PRESETS_COMBINE.map(([nom], k) =>
    `<button data-oc="preset" data-arg="${k}">${esc(nom)}</button>`).join('')}</div>`}
      <div class="ligne reglage-outil">
        <label>Classement<select data-oc-champ="calcul">${choix(cfg.calcul, [['places', 'Somme des places (la plus petite gagne)'], ['bareme', 'Barème : points par épreuve']])}</select></label>
        ${cfg.calcul === 'bareme' ? `<label class="etroit">Points max. par épreuve<input type="number" min="1" max="1000" step="1" data-oc-champ="maxPts" value="${cfg.maxPts}"></label>` : ''}
      </div>
      ${cfg.calcul === 'bareme' ? `<p class="aide">Pour chaque épreuve : la performance qui vaut 0 point et celle qui vaut le maximum ; entre les deux, les points
        sont proportionnels (au-delà : 0 ou le maximum). « 📐 D’après la classe » prend la moins bonne et la meilleure performance relevées.</p>` : ''}
      <div class="liste-epreuves">${cfg.epreuves.map((x, k) => `<div class="ligne-epreuve">
        <input data-oc-ep="${x.id}|nom" value="${esc(x.nom)}" maxlength="40" aria-label="Nom de l’épreuve ${k + 1}">
        <select data-oc-ep="${x.id}|type" aria-label="Type de l’épreuve ${k + 1}">${choix(x.type, Object.entries(TYPES_EPREUVE))}</select>
        <select data-oc-ep="${x.id}|essais" aria-label="Essais — ${esc(x.nom)}">${choix(String(x.essais), [['1', '1 essai'], ['2', '2 essais'], ['3', '3 essais']])}</select>
        ${cfg.calcul === 'bareme' ? `
          <label class="etroit">0 pt<input data-oc-ep="${x.id}|zero" value="${esc(textePerf(x, x.zero ?? ''))}" inputmode="decimal" placeholder="${x.type === 'temps' ? '15,0' : '0'}"></label>
          <label class="etroit">${fmt(cfg.maxPts)} pts<input data-oc-ep="${x.id}|max" value="${esc(textePerf(x, x.max ?? ''))}" inputmode="decimal" placeholder="${x.type === 'temps' ? '7,5' : ''}"></label>
          <button class="icone-petit" data-oc="bareme-auto" data-arg="${x.id}" title="Barème d’après la classe : moins bonne performance = 0, meilleure = maximum">📐</button>` : ''}
        <button class="icone-petit" data-oc="ep-haut" data-arg="${x.id}" ${k ? '' : 'disabled'} aria-label="Monter ${esc(x.nom)}">↑</button>
        <button class="icone-petit" data-oc="ep-suppr" data-arg="${x.id}" aria-label="Retirer ${esc(x.nom)}">🗑</button>
      </div>`).join('')}</div>
      <div class="boutons-outil"><button data-oc="ep-ajout">+ Ajouter une épreuve</button></div>
    </details>
    ${htmlPresents(c)}`;
  if (!cfg.epreuves.length) return html + '<p class="aide">Ajoute au moins une épreuve pour commencer.</p>';

  // Épreuve en cours : vagues (+ chrono pour les temps) et saisie des essais.
  html += `<div class="fiche-onglets onglets-epreuves">${cfg.epreuves.map(x => `<button type="button" class="${x.id === cfg.courante ? 'actif' : ''}" data-oc="epreuve" data-arg="${x.id}">${esc(x.nom)}</button>`).join('')}
    <button type="button" class="${cfg.courante === '_classement' ? 'actif' : ''}" data-oc="epreuve" data-arg="_classement">🏅 Classement</button></div>`;
  if (cfg.courante === '_classement' || !ep) return html + htmlClassementCombine(c, cfg);
  return html + htmlVaguesCombine(c, cfg, ep, choix) + htmlSaisieCombine(c, cfg, ep);
}

function htmlVaguesCombine(c, cfg, ep, choix) {
  const v = cfg.vagues, co = courseCombine(v), enCours = co?.depart && !co.fin;
  const criteres = criteresVagues(c, cfg);
  if (!criteres.some(g => g.liste.some(([x]) => x === v.critere))) v.critere = 'combine';
  const vague = v.liste[v.courante] || [];
  let html = `<details class="carte vagues-combine" data-oc-vagues-ouvertes ${vaguesOuvertes ? 'open' : ''}><summary>🚦 Vagues de départ
      <span class="aide">${v.liste.length ? `${v.liste.length} vague${v.liste.length > 1 ? 's' : ''} de ${fmt(v.taille)}` : 'élèves au départ, niveaux, mixité'}</span></summary>
    <div class="ligne reglage-outil">
      <label class="etroit">Élèves par vague<input type="number" min="1" max="40" step="1" data-oc-vague="taille" value="${v.taille}"></label>
      <label>Niveau<select data-oc-vague="composition">${choix(v.composition, [['aleatoire', 'Au hasard'], ['homogene', 'Homogènes (niveaux proches ensemble)'], ['heterogene', 'Hétérogènes (niveaux mélangés)']])}</select></label>
      <label>Mixité<select data-oc-vague="mixite">${choix(v.mixite, [['indifferent', 'Indifférent'], ['mixte', 'Mixtes (filles et garçons répartis)'], ['non-mixte', 'Non mixtes (filles / garçons)']])}</select></label>
      ${v.composition !== 'aleatoire' ? `<label class="large-outil">Niveau d’après<select data-oc-vague="critere">${criteres.map(g => (g.groupe
    ? `<optgroup label="${esc(g.groupe)}">${choix(v.critere, g.liste)}</optgroup>` : choix(v.critere, g.liste))).join('')}</select></label>` : ''}
    </div>
    ${v.composition !== 'aleatoire' ? `<p class="aide">Un élève sans résultat pour ce critère compte au niveau moyen.
      Homogènes : les plus forts dans la première vague${v.mixite === 'mixte' ? ' (le niveau passe avant la mixité)' : ''}.</p>` : ''}
    <div class="boutons-outil"><button class="primaire" data-oc="vagues-faire" ${enCours ? 'disabled' : ''}>🎲 ${v.liste.length ? 'Refaire les vagues' : 'Faire les vagues'}</button></div>`;
  if (v.liste.length) {
    html += `<div class="liste-vagues">${v.liste.map((l, k) => `<button type="button" class="carte-vague${k === v.courante ? ' courante' : ''}" data-oc="vague" data-arg="${k}" ${enCours ? 'disabled' : ''}>
      <b>Vague ${k + 1}</b> <span class="aide">${l.length} élève${l.length > 1 ? 's' : ''}</span>
      <span class="noms-vague">${l.map(id => esc(nomOutil(id))).join(' · ')}</span></button>`).join('')}</div>`;
  }
  html += '</details>';

  // Course de la vague en cours (épreuves chronométrées) : départ, puis un toucher sur chaque élève à l'arrivée.
  if (ep.type === 'temps' && vague.length) {
    html += `<div class="carte course-vague">
      <div class="barre-outil">
        <b>Vague ${v.courante + 1} / ${v.liste.length}</b>
        <span class="grand-temps moyen" data-o-bloc="combine" data-arg="${c.id}">${BLOCS_DIRECTS.combine(c.id)}</span>
        <button class="primaire gros" data-oc="course-go">${enCours ? '⏹ Arrêter' : co?.depart ? '▶ Recourir cette vague' : '▶ Départ'}</button>
        <button data-oc="course-annuler" ${enCours && co.pile.length ? '' : 'disabled'}>↶ Annuler la dernière arrivée</button>
        <button data-oc="vague-suivante" ${enCours || v.courante >= v.liste.length - 1 ? 'disabled' : ''}>Vague suivante ▶</button>
      </div>
      <p class="aide">${enCours ? 'Touche chaque élève quand il franchit la ligne : son temps est noté dans l’essai suivant.' : 'Au signal, touche « Départ ».'}</p>
      <div class="grille-coureurs">${vague.filter(id => Donnees.get('eleves', id)).map(id => {
    const t = co?.arrivees?.[id];
    return `<button class="coureur${t !== undefined ? ' arrive' : ''}" data-oc="arrivee" data-arg="${id}" ${enCours && t === undefined ? '' : 'disabled'}>
          <span class="coureur-nom">${esc(nomOutil(id))}</span><span class="coureur-info">${t !== undefined ? '🏁 ' + textePerf(ep, Math.round(t / 10) / 100) : 'en course'}</span></button>`;
  }).join('')}</div></div>`;
  } else if (vague.length) {
    html += `<div class="carte course-vague"><div class="barre-outil"><b>Vague ${v.courante + 1} / ${v.liste.length}</b>
      <span class="noms-vague">${vague.map(id => esc(nomOutil(id))).join(' · ')}</span>
      <button data-oc="vague-suivante" ${v.courante >= v.liste.length - 1 ? 'disabled' : ''}>Vague suivante ▶</button></div></div>`;
  }
  return html;
}

// Tableau de saisie : toutes les épreuves côte à côte (une colonne par essai, puis la meilleure), pour noter
// par exemple un temps et des points sur la même ligne ; ou seulement l'épreuve choisie.
// Entrée passe à la case suivante de la ligne, puis à l'élève suivant.
function htmlSaisieCombine(c, cfg, ep) {
  const v = cfg.vagues, vague = v.liste[v.courante] || [];
  const toutes = cfg.toutes !== false && cfg.epreuves.length > 1;
  const eps = toutes ? cfg.epreuves : [ep];
  // La vague en cours d'abord (c'est elle qu'on note), puis les autres présents, puis ceux qui ont des résultats.
  const presents = presentsOutil(c).map(el => el.id);
  const ids = [...new Set([...vague, ...presents, ...Object.keys(cfg.perfs).filter(id => eps.some(x => cfg.perfs[id]?.[x.id]?.length))])]
    .filter(id => Donnees.get('eleves', id));
  const infoEp = x => `${x.type === 'temps' ? 'temps' : esc(x.unite || UNITES_EPREUVE[x.type])}${x.essais > 1 ? ` · ${x.essais} essais` : ''}`;
  const actif = x => (toutes && x.id === ep.id ? ' ep-active' : '');
  const avecMeilleure = x => x.essais > 1 || !toutes; // (un seul essai côte à côte : la case suffit)
  return `<div class="tete-saisie-combine">
      <h3>${toutes ? 'Toutes les épreuves' : esc(ep.nom)} <span class="aide">${toutes ? 'temps : 12,5 ou 1:05,3' : infoEp(ep)} · X = essai nul · Entrée = case suivante${
  toutes && ep.type === 'temps' && vague.length ? ` · le chrono de vague remplit « ${esc(ep.nom)} » (colonne surlignée)` : ''}</span></h3>
      ${cfg.epreuves.length > 1 ? `<button data-oc="toutes">${toutes ? `Seulement « ${esc(ep.nom)} »` : '↔ Toutes les épreuves côte à côte'}</button>` : ''}
    </div>
    <div class="carte defile-combine"><table class="tableau-outil tableau-essais tableau-saisie-combine">
      <thead>
        ${toutes ? `<tr><th></th>${eps.map(x => `<th colspan="${x.essais + (avecMeilleure(x) ? 1 : 0)}" class="tete-ep debut-ep${actif(x)}">${esc(x.nom)} <span class="aide">${infoEp(x)}</span></th>`).join('')}</tr>` : ''}
        <tr><th>Élève</th>${eps.map(x => `${Array.from({ length: x.essais }, (_, k) => `<th class="${k ? '' : 'debut-ep'}${actif(x)}">${x.essais > 1 ? `Essai ${k + 1}` : 'Résultat'}</th>`).join('')}
          ${avecMeilleure(x) ? `<th class="${actif(x).trim()}">Meilleure</th>` : ''}`).join('')}</tr>
      </thead>
      <tbody>${ids.map(id => `<tr class="${vague.includes(id) ? 'dans-vague' : ''}"><td>${esc(nomOutil(id))}${vague.includes(id) ? ' <span class="aide">· vague</span>' : ''}</td>
        ${eps.map(x => `${Array.from({ length: x.essais }, (_, k) => {
    const val = cfg.perfs[id]?.[x.id]?.[k];
    return `<td class="${k ? '' : 'debut-ep'}${actif(x)}"><input class="essai${val === 'X' ? ' nul' : ''}" inputmode="decimal" autocomplete="off" data-oc-perf="${id}|${x.id}|${k}" value="${esc(textePerf(x, val))}"
            aria-label="${esc(nomOutil(id))} — ${esc(x.nom)} — essai ${k + 1}"></td>`;
  }).join('')}
        ${avecMeilleure(x) ? `<td class="meilleur${actif(x)}" data-oc-meilleur="${id}|${x.id}">${texteMeilleurComb(cfg, x, id)}</td>` : ''}`).join('')}</tr>`).join('')}</tbody>
    </table></div>`;
}
const texteMeilleurComb = (cfg, ep, id) => { const m = meilleurePerf(cfg, ep, id); return m === null ? '–' : textePerfUnite(ep, m); };

function htmlClassementCombine(c, cfg) {
  const { lignes, sansBareme } = classementCombine(c, cfg);
  const bareme = cfg.calcul === 'bareme', faits = lignes.filter(l => l.faites);
  if (!faits.length) return '<p class="aide">Aucun résultat pour l’instant : choisis une épreuve et saisis les performances.</p>';
  const maxTotal = cfg.maxPts * cfg.epreuves.length;
  return `${sansBareme ? '<p class="aide">⚠ Barème incomplet : règle la performance « 0 point » et « maximum » de chaque épreuve (⚙ Épreuves et calcul).</p>' : ''}
    <div class="carte"><table class="tableau-outil tableau-combine">
      <thead><tr><th>Rang</th><th>Élève</th>${cfg.epreuves.map(ep => `<th>${esc(ep.nom)}</th>`).join('')}
        <th>${bareme ? `Total <span class="aide">/${fmt(maxTotal)}</span>` : 'Somme des places'}</th>${bareme ? '<th>Sur 20</th>' : ''}</tr></thead>
      <tbody>${lignes.map(l => `<tr class="${l.complet ? '' : 'incomplet'}"><td><b>${l.rang ?? '–'}</b>${l.rang && l.rang <= 3 && l.complet ? ' ' + ['🥇', '🥈', '🥉'][l.rang - 1] : ''}</td>
        <td>${esc(nomOutil(l.id))}</td>
        ${cfg.epreuves.map(ep => `<td>${l.perfs[ep.id] !== undefined ? `${textePerfUnite(ep, l.perfs[ep.id])}
          <span class="aide">· ${bareme ? (l.scores[ep.id] === null ? '?' : fmt(l.scores[ep.id])) + ' pts' : l.scores[ep.id] + (l.scores[ep.id] === 1 ? 'er' : 'e')}</span>` : '<span class="aide">–</span>'}</td>`).join('')}
        <td><b>${l.faites ? fmt(l.total) : '–'}</b>${l.faites && !l.complet ? ` <span class="aide">(${l.faites}/${cfg.epreuves.length} épr.)</span>` : ''}</td>
        ${bareme ? `<td>${l.complet && !sansBareme ? fmt(Math.round((l.total / maxTotal) * 200) / 10) : '–'}</td>` : ''}</tr>`).join('')}</tbody>
    </table></div>
    <p class="aide">${bareme ? 'Total des points du barème ; « Sur 20 » = total ramené sur 20.' : 'Pour chaque épreuve, la place de l’élève (ex aequo : même place) ; le plus petit total gagne.'}
      Les élèves qui n’ont pas fait toutes les épreuves sont classés après.</p>`;
}

BLOCS_DIRECTS.combine = classeId => {
  const co = etatOutils.combine?.[classeId]?.vagues?.course;
  return fmtTemps(tempsCourse(co));
};
RENDUS_OUTILS.combine = htmlCombine;

/* ---------- Actions ---------- */

// Note une performance dans le premier essai libre de l'élève (sinon le dernier essai est remplacé).
function noterPerf(cfg, ep, id, valeur) {
  const essais = ((cfg.perfs[id] ??= {})[ep.id] ??= []);
  let k = Array.from({ length: ep.essais }, (_, i) => i).find(i => essais[i] === undefined || essais[i] === '' || essais[i] === null);
  if (k === undefined) { k = ep.essais - 1; toast(`${nomOutil(id)} avait déjà ${ep.essais} essai${ep.essais > 1 ? 's' : ''} : le dernier est remplacé.`); }
  essais[k] = valeur;
}

function actionCombine(action, arg, c) {
  const cfg = cfgCombine(c), ep = cfg.epreuves.find(x => x.id === cfg.courante), v = cfg.vagues;
  switch (action) {
    case 'preset': {
      cfg.epreuves = PRESETS_COMBINE[+arg][1].map(([nom, type]) => ({ id: idEpreuve(), nom, type, essais: type === 'temps' ? 1 : 3 }));
      cfg.courante = cfg.epreuves[0].id;
      return rendreOutil();
    }
    case 'ep-ajout': {
      const x = { id: idEpreuve(), nom: 'Épreuve ' + (cfg.epreuves.length + 1), type: 'distance', essais: 3 };
      cfg.epreuves.push(x);
      cfg.courante ||= x.id;
      rendreOutil();
      return $(`#vue [data-oc-ep="${x.id}|nom"]`)?.select();
    }
    case 'ep-haut': {
      const k = cfg.epreuves.findIndex(x => x.id === arg);
      if (k > 0) [cfg.epreuves[k - 1], cfg.epreuves[k]] = [cfg.epreuves[k], cfg.epreuves[k - 1]];
      return rendreOutil();
    }
    case 'ep-suppr':
      return lancer(async () => {
        const x = cfg.epreuves.find(e => e.id === arg);
        const n = Object.values(cfg.perfs).filter(p => p[arg]?.some(y => y !== '' && y !== null && y !== undefined)).length;
        if (n && !(await confirmer(`Retirer l’épreuve « ${x.nom} » et les résultats de ${n} élève${n > 1 ? 's' : ''} ?`, 'Retirer'))) return;
        cfg.epreuves = cfg.epreuves.filter(e => e.id !== arg);
        for (const p of Object.values(cfg.perfs)) delete p[arg];
        rendreOutil();
      });
    case 'bareme-auto': {
      const x = cfg.epreuves.find(e => e.id === arg);
      const vals = Object.keys(cfg.perfs).map(id => meilleurePerf(cfg, x, id)).filter(y => y !== null);
      if (vals.length < 2) return toast('Il faut au moins deux performances dans cette épreuve.', 'erreur');
      [x.zero, x.max] = plusPetitMieux(x) ? [Math.max(...vals), Math.min(...vals)] : [Math.min(...vals), Math.max(...vals)];
      return rendreOutil();
    }
    case 'epreuve': cfg.courante = arg; return rendreOutil();
    case 'toutes': cfg.toutes = cfg.toutes === false; return rendreOutil();
    case 'vagues-faire': faireVagues(c, cfg); return rendreOutil();
    case 'vague': if (!v.course?.depart || v.course.fin) { v.courante = +arg; v.course = null; } return rendreOutil();
    case 'vague-suivante': v.courante = Math.min(v.liste.length - 1, v.courante + 1); v.course = null; return rendreOutil();
    case 'course-go': {
      if (v.course?.depart && !v.course.fin) { v.course.fin = Date.now(); bipFin(); }
      else { v.course = { depart: Date.now(), fin: null, arrivees: {}, pile: [], epreuve: ep.id }; son(990, 0.4); }
      return rendreOutil();
    }
    case 'arrivee': {
      const co = v.course;
      if (!co?.depart || co.fin || co.arrivees[arg] !== undefined) return;
      const ms = Date.now() - co.depart;
      co.arrivees[arg] = ms;
      co.pile.push(arg);
      noterPerf(cfg, cfg.epreuves.find(x => x.id === co.epreuve) || ep, arg, Math.round(ms / 10) / 100);
      bipToucher();
      // Toute la vague est arrivée : le chrono s'arrête.
      if ((v.liste[v.courante] || []).filter(id => Donnees.get('eleves', id)).every(id => co.arrivees[id] !== undefined)) { co.fin = Date.now(); bipFin(); }
      return rendreOutil();
    }
    case 'course-annuler': {
      const co = v.course, id = co?.pile.pop();
      if (!id) return;
      const x = cfg.epreuves.find(e => e.id === co.epreuve), essais = cfg.perfs[id]?.[x?.id] || [];
      const t = Math.round(co.arrivees[id] / 10) / 100, k = essais.lastIndexOf(t);
      if (k >= 0) essais[k] = '';
      delete co.arrivees[id];
      return rendreOutil();
    }
  }
}

document.addEventListener('click', e => {
  const b = e.target.closest('#vue [data-oc]');
  if (!b || b.disabled) return;
  const c = classeActive();
  if (c) lancer(() => actionCombine(b.dataset.oc, b.dataset.arg, c));
});

// Réglages et saisies (au changement : les menus redessinent ; les champs à taper non, pour garder la case suivante).
document.addEventListener('change', e => {
  const t = e.target;
  if (!t.closest?.('#vue .outil-combine')) return;
  const c = classeActive();
  if (!c) return;
  const cfg = cfgCombine(c);
  if (t.dataset.ocChamp) {
    cfg[t.dataset.ocChamp] = t.type === 'number' ? Math.max(1, Math.min(1000, nombreOutil(t.value) || 20)) : t.value;
    return rendreOutil();
  }
  if (t.dataset.ocVague) {
    const k = t.dataset.ocVague;
    cfg.vagues[k] = k === 'taille' ? Math.max(1, Math.min(40, Math.round(nombreOutil(t.value) || 4))) : t.value;
    return rendreOutil();
  }
  if (t.dataset.ocEp) {
    const [id, champ] = t.dataset.ocEp.split('|'), x = cfg.epreuves.find(y => y.id === id);
    if (!x) return;
    if (champ === 'nom') { x.nom = t.value.trim() || x.nom; return rendreOutil(); }
    if (champ === 'type') { x.type = t.value; delete x.zero; delete x.max; return rendreOutil(); }
    if (champ === 'essais') { x.essais = +t.value; return rendreOutil(); }
    const val = lirePerf(x, t.value);
    if (val === null || val === 'X') { toast(`« ${t.value} » : ${x.type === 'temps' ? 'tape un temps (12,5 ou 1:05,3)' : 'tape un nombre'}.`, 'erreur'); t.value = textePerf(x, x[champ] ?? ''); return; }
    if (val === '') delete x[champ]; else x[champ] = val;
    return rendreOutil(); // (le classement suit ; la case où l'on est passé garde le curseur)
  }
  if (t.dataset.ocPerf) {
    const [id, epId, k] = t.dataset.ocPerf.split('|'), x = cfg.epreuves.find(y => y.id === epId);
    const val = lirePerf(x, t.value);
    const essais = ((cfg.perfs[id] ??= {})[epId] ??= []);
    if (val === null) { toast(`« ${t.value} » : ${x.type === 'temps' ? 'tape un temps (12,5 ou 1:05,3)' : 'tape un nombre'}, ou X pour un essai nul.`, 'erreur'); t.value = textePerf(x, essais[+k]); return; }
    essais[+k] = val;
    t.value = textePerf(x, val);
    t.classList.toggle('nul', val === 'X');
    const meilleur = $(`#vue [data-oc-meilleur="${id}|${epId}"]`);
    if (meilleur) meilleur.textContent = texteMeilleurComb(cfg, x, id);
    return sauverOutils();
  }
});

// Entrée : case suivante (essais, barème).
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || !e.target.matches?.('#vue [data-oc-perf], #vue [data-oc-ep]')) return;
  if (e.target.tagName === 'SELECT') return;
  e.preventDefault();
  const champs = [...document.querySelectorAll('#vue [data-oc-perf], #vue input[data-oc-ep]')];
  const suivant = champs[champs.indexOf(e.target) + 1];
  if (suivant) { suivant.focus(); suivant.select(); } else e.target.blur();
});

/* ---------- 📤 Vers une leçon : une colonne par épreuve, le total et le classement ---------- */

TRANSFERTS.combine = c => {
  const cfg = cfgCombine(c), { lignes } = classementCombine(c, cfg), faits = lignes.filter(l => l.faites);
  if (!faits.length) throw new Error('Aucun résultat enregistré dans le combiné.');
  const colonnes = cfg.epreuves.map(ep => ({
    nom: ep.nom, type: ep.type === 'temps' ? 'temps' : ep.type === 'distance' ? 'distance' : 'nombre',
    ...(ep.type !== 'temps' ? { unite: ep.unite || UNITES_EPREUVE[ep.type] } : {}),
    valeurs: Object.fromEntries(faits.filter(l => l.perfs[ep.id] !== undefined).map(l => [l.id, String(l.perfs[ep.id])])),
  })).filter(col => Object.keys(col.valeurs).length);
  colonnes.push({ nom: cfg.calcul === 'bareme' ? 'Points du combiné' : 'Somme des places', type: 'nombre', valeurs: Object.fromEntries(faits.map(l => [l.id, String(l.total)])) });
  colonnes.push({ nom: 'Classement du combiné', type: 'nombre', valeurs: Object.fromEntries(faits.filter(l => l.rang).map(l => [l.id, String(l.rang)])) });
  return { titre: 'Combiné athlétique', apsa: '', colonnes };
};
