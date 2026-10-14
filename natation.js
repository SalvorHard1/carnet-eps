'use strict';
// Outil « 🏊 Natation » (Outils › APSA) : temps, coups de bras (ou cycles), distance, et indices calculés par l'appli :
//   vitesse V = distance / temps (m/s) ; amplitude A = distance / cycles (m par cycle) ;
//   fréquence F = cycles / temps × 60 (cycles par minute) ; indice de nage IN = V × A (Costill et al., 1985).
// Même calcul que les outils des académies (Lyon « Natation EPS », Bordeaux, Corse, Strasbourg) : IN = (25 / temps) × (25 / cycles)
// sur chaque longueur, et sur la course. Seuils par défaut repris de l'application de Lyon : IN > 1,4 (course), > 1,2 (longueur).
// En piscine : plusieurs couloirs à la fois ; un départ commun ; pour chaque nageur, un gros bouton « +1 » à chaque cycle,
// « Longueur » au virage, l'arrivée à la dernière longueur. Les essais sont gardés sur cet appareil (comme les autres outils) ;
// « 📤 Vers une leçon » les range dans le carnet.

const NAGES = ['Crawl', 'Dos', 'Brasse', 'Papillon', '4 nages'];
OUTILS.push({ id: 'natation', famille: 'apsa', icone: '🏊', nom: 'Natation', info: 'Temps, coups de bras, amplitude, fréquence, indice de nage', classe: true });

function cfgNatation(c) {
  return ((etatOutils.natation ??= {})[c.id] ??= {
    nage: 'Crawl', bassin: 25, distance: 50, compte: 'cycles', seuilCourse: 1.4, seuilLongueur: 1.2,
    couloirs: 2, couloir: [], course: null, essais: {}, vue: 'dernier',
    compterPendant: true, // false : les coups de bras se notent après la course (pas de bouton +1)
    seuils: true, // false : indice de nage affiché sans couleur (pas de seuils)
  });
}
// Seuil utilisé pour colorer l'indice de nage (null : seuils masqués).
const seuilNat = (cfg, k) => (cfg.seuils === false ? null : cfg[k]);
const nbLongueurs = (distance, bassin) => Math.max(1, Math.round(distance / bassin));
const motCompte = (compte, n = 2) => (compte === 'coups' ? (n > 1 ? 'coups de bras' : 'coup de bras') : n > 1 ? 'cycles' : 'cycle');
const uniteAmpl = compte => (compte === 'coups' ? 'm/coup' : 'm/cycle');
const f2 = n => (n === null || !Number.isFinite(n) ? '–' : fmt(Math.round(n * 100) / 100));
const f1 = n => (n === null || !Number.isFinite(n) ? '–' : fmt(Math.round(n * 10) / 10));

/* ---------- Calculs ---------- */

// Un essai : { date, nage, distance, bassin, compte, temps: [ms cumulés à chaque fin de longueur], cycles: [par longueur] }.
function indicesNage(dist, ms, cycles) {
  const s = ms / 1000;
  const V = s > 0 ? dist / s : null, A = cycles > 0 ? dist / cycles : null;
  return { dist, s, cycles, V, A, F: s > 0 && cycles > 0 ? (cycles / s) * 60 : null, IN: V !== null && A !== null ? V * A : null };
}
function analyseEssai(e) {
  const longueurs = e.temps.map((t, i) => indicesNage(e.bassin, t - (e.temps[i - 1] || 0), e.cycles[i]));
  // (Course entière : seulement si toutes les longueurs ont été comptées ; sinon pas d'amplitude ni d'indice.)
  const T = e.temps.at(-1), C = e.temps.every((_, i) => e.cycles[i] > 0) ? e.cycles.reduce((a, b) => a + (b || 0), 0) : 0;
  const ecart = longueurs.length > 1 ? Math.max(...longueurs.map(l => l.s)) - Math.min(...longueurs.map(l => l.s)) : null;
  return { ...indicesNage(e.distance, T, C), longueurs, ecart };
}

function essaiRetenu(cfg, id) {
  const liste = cfg.essais[id] || [];
  if (!liste.length) return null;
  if (cfg.vue === 'meilleur') return liste.reduce((m, e) => ((analyseEssai(e).IN ?? -1) > (analyseEssai(m).IN ?? -1) ? e : m));
  if (cfg.vue === 'rapide') return liste.reduce((m, e) => (e.distance === m.distance && e.temps.at(-1) < m.temps.at(-1) ? e : m));
  return liste.at(-1);
}

const classeIN = (IN, seuil) => (IN === null || seuil === null ? '' : IN >= seuil ? ' in-ok' : ' in-bas');

/* ---------- Course en cours (couloirs) ---------- */

const ecouleNat = (co, lane) => (co?.depart ? (lane?.fin || co.fin || Date.now()) - co.depart : 0);

// Écran en trois temps : ① qui nage (toucher les noms), ② départ, ③ pendant la course, de gros boutons par couloir.
// Les réglages (nage, distance, bassin…) et les résultats de la classe sont repliés, pour ne garder que l'essentiel.
let reglagesNatOuverts = false, resultatsNatOuverts = true;

function htmlNatation(c) {
  const cfg = cfgNatation(c), co = cfg.course, enCours = co?.depart && !co.fin;
  const L = co ? nbLongueurs(co.distance, co.bassin) : nbLongueurs(cfg.distance, cfg.bassin);
  const resume = `${cfg.distance} m ${cfg.nage.toLowerCase()} · bassin ${fmt(cfg.bassin)} m (${L} longueur${L > 1 ? 's' : ''}) · on compte ${cfg.compte === 'coups' ? 'les coups de bras' : 'les cycles'}`;

  // Pendant la course : seulement le chrono et les couloirs.
  if (enCours) {
    return `<div class="barre-outil course-nat">
        <span class="grand-temps moyen" data-o-bloc="natation" data-arg="${c.id}|-1">${fmtTemps(ecouleNat(co))}</span>
        <span class="aide">${esc(resume)}</span>
        <span class="espace-outil"></span>
        <button class="danger" data-on="arreter">⏹ Arrêter</button>
      </div>
      <p class="consigne-nat">${co.compter === false ? `<span>✎ les ${motCompte(co.compte)} se notent après</span>` : `<span>👆 <b>+1</b> à chaque ${motCompte(co.compte, 1)}</span>`}<span>👆 <b>Virage</b> au mur</span><span>🏁 la dernière = <b>arrivée</b></span></p>
      <div class="couloirs-nat en-course">${co.lanes.map((lane, k) => htmlCouloir(c, cfg, co, lane, k, L)).join('')}</div>`;
  }

  // Course terminée : résultats dans les couloirs, puis on enchaîne.
  if (co) {
    return `<div class="etape-nat"><b>🏁 Course terminée</b> <span class="aide">${esc(resume)} — les temps sont enregistrés.</span></div>
      <div class="couloirs-nat">${co.lanes.map((lane, k) => htmlCouloir(c, cfg, co, lane, k, L)).join('')}</div>
      <div class="boutons-outil centre">
        <button class="primaire gros" data-on="suivante">▶ Série suivante</button>
        <button class="gros" data-on="nouvelle">↺ Mêmes nageurs</button>
      </div>
      ${htmlResultatsNat(c, cfg)}`;
  }

  // Préparation : qui nage ? (un toucher sur un nom le place dans le premier couloir libre).
  const presents = presentsOutil(c), auj = aujourdhui();
  const places = new Set(cfg.couloir.slice(0, cfg.couloirs).filter(Boolean));
  const aNage = id => (cfg.essais[id] || []).some(e => e.date === auj);
  return `
    <details class="reglages-nat" data-on-reglages ${reglagesNatOuverts ? 'open' : ''}>
      <summary>🏊 <b>${esc(resume)}</b> <span class="aide">· ${cfg.couloirs} couloir${cfg.couloirs > 1 ? 's' : ''} — ⚙ modifier</span></summary>
      ${htmlReglagesNat(cfg)}
    </details>
    <div class="etape-nat"><span class="num-etape">1</span><b>Qui nage ?</b> <span class="aide">Touche un nom pour le mettre dans un couloir ; touche ✕ pour l’enlever.</span></div>
    <div class="couloirs-nat">${Array.from({ length: cfg.couloirs }, (_, k) => {
    const id = cfg.couloir[k] || '';
    return `<div class="couloir-nat prepa${id ? '' : ' vide'}"><span class="num-couloir">${k + 1}</span>
        ${id ? `<b class="nom-couloir">${esc(nomOutil(id))}</b><button class="icone-petit" data-on="retirer" data-arg="${k}" aria-label="Enlever ${esc(nomOutil(id))} du couloir ${k + 1}">✕</button>`
    : '<span class="aide">libre</span>'}</div>`;
  }).join('')}</div>
    <div class="chips-nageurs">${presents.map(el => `<button class="chip-nageur${places.has(el.id) ? ' place' : ''}${aNage(el.id) ? ' a-nage' : ''}" data-on="placer" data-arg="${el.id}"
        ${places.has(el.id) ? 'disabled' : ''} title="${aNage(el.id) ? 'A déjà nagé aujourd’hui' : ''}">${aNage(el.id) ? '✓ ' : ''}${esc(nomEleveOutil(el))}</button>`).join('')}</div>
    <div class="boutons-outil">
      <button data-on="suivante" title="Remplir les couloirs avec les élèves qui n’ont pas encore nagé aujourd’hui">👥 Remplir avec les suivants</button>
      ${places.size ? '<button data-on="vider">Vider les couloirs</button>' : ''}
    </div>
    ${htmlPresents(c)}
    <div class="etape-nat"><span class="num-etape">2</span><b>Départ</b></div>
    <div class="boutons-outil centre">
      <button class="primaire tres-gros" data-on="depart" ${places.size ? '' : 'disabled'}>▶ Départ${places.size ? ` (${places.size} nageur${places.size > 1 ? 's' : ''})` : ''}</button>
    </div>
    ${htmlResultatsNat(c, cfg)}`;
}

function htmlReglagesNat(cfg) {
  const choix = (valeur, liste) => liste.map(([v, nom]) => `<option value="${esc(v)}" ${String(valeur) === String(v) ? 'selected' : ''}>${esc(nom)}</option>`).join('');
  return `<div class="ligne reglage-outil">
      <label>Nage<select data-on-champ="nage">${choix(cfg.nage, NAGES.map(n => [n, n]))}</select></label>
      <label class="etroit">Distance<select data-on-champ="distance">${choix(cfg.distance, [25, 50, 75, 100, 150, 200, 400].map(d => [d, d + ' m']))}</select></label>
      <label class="etroit">Bassin<select data-on-champ="bassin">${choix(cfg.bassin, [[25, '25 m'], [50, '50 m'], [12.5, '12,5 m'], [33.33, '33 m']])}</select></label>
      <label class="etroit">Couloirs<select data-on-champ="couloirs">${choix(cfg.couloirs, [1, 2, 3, 4, 5, 6].map(n => [n, n]))}</select></label>
      <label>On compte<select data-on-champ="compte">${choix(cfg.compte, [['cycles', 'les cycles (2 bras en crawl / dos)'], ['coups', 'chaque coup de bras']])}</select></label>
      <label>Les ${motCompte(cfg.compte)}<select data-on-champ="compterPendant">${choix(cfg.compterPendant === false ? 'apres' : 'pendant',
    [['pendant', 'se comptent pendant la course (+1)'], ['apres', 'se notent après la course']])}</select></label>
    </div>
    <label class="case"><input type="checkbox" data-on-champ="seuils" ${cfg.seuils === false ? '' : 'checked'}>
      <span>Colorer l’indice de nage en vert / rouge selon des seuils</span></label>
    ${cfg.seuils === false ? '' : `<div class="ligne reglage-outil">
      <label class="etroit">Seuil sur la course entière<input type="number" min="0.1" max="6" step="0.1" data-on-champ="seuilCourse" value="${cfg.seuilCourse}"></label>
      <label class="etroit">Seuil sur chaque longueur<input type="number" min="0.1" max="6" step="0.1" data-on-champ="seuilLongueur" value="${cfg.seuilLongueur}"></label>
    </div>`}
    <p class="aide">Indice de nage (IN) = vitesse (m/s) × amplitude (m parcourus par ${motCompte(cfg.compte, 1)}) : il dit si l’élève nage vite <i>et</i> avec de grands mouvements.
      ${cfg.seuils === false ? 'Sans seuils, l’indice est simplement affiché.' : `Le <b>seuil sur la course entière</b> s’applique à l’indice calculé sur toute la distance ;
      le <b>seuil sur chaque longueur</b>, à l’indice de chaque longueur (pour voir où l’élève faiblit). Au-dessus : vert ; en dessous : rouge.
      Valeurs par défaut de l’académie de Lyon (1,4 et 1,2), prévues pour des cycles comptés en crawl.
      ${cfg.compte === 'coups' ? '⚠ En comptant chaque coup de bras, l’indice est environ deux fois plus petit : baisse les seuils.' : ''}`}</p>`;
}

function htmlCouloir(c, cfg, co, lane, k, L) {
  const enCours = co?.depart && !co.fin;
  if (!lane.id) return `<div class="couloir-nat vide"><span class="num-couloir">${k + 1}</span><span class="aide">libre</span></div>`;
  const fini = lane.temps.length >= L, enLongueur = Math.min(lane.temps.length + 1, L);
  const dernier = lane.temps.length ? analyseEssai({ ...lane, distance: lane.temps.length * co.bassin, bassin: co.bassin }) : null;
  return `<div class="couloir-nat${fini ? ' fini' : ''}">
    <div class="tete-couloir"><span class="num-couloir">${k + 1}</span><b class="nom-couloir">${esc(nomOutil(lane.id))}</b>
      <span class="grand-temps petit" data-o-bloc="natation" data-arg="${c.id}|${k}">${fmtTemps(ecouleNat(co, lane))}</span></div>
    <div class="progression-nat">${Array.from({ length: L }, (_, i) => `<span class="${i < lane.temps.length ? 'faite' : i === lane.temps.length && !fini ? 'en-cours' : ''}">${i + 1}</span>`).join('')}</div>
    ${lane.cycles.some(n => n > 0) ? `<div class="aide">${lane.cycles.map((n, i) => `L${i + 1} : ${n} ${motCompte(co.compte, n)}`).join(' · ')}</div>` : ''}
    ${fini ? `<div class="bilan-couloir">🏁 <b>${fmtTemps(lane.temps.at(-1))}</b> · IN <b class="${classeIN(dernier.IN, seuilNat(cfg, 'seuilCourse')).trim()}">${f2(dernier.IN)}</b>
        ${dernier.IN === null ? '' : `<div class="aide">${f2(dernier.V)} m/s · ${f2(dernier.A)} ${uniteAmpl(co.compte)} · ${f1(dernier.F)} /min</div>`}</div>
      ${lane.essai !== undefined ? `<button class="${lane.cycles.some(n => n > 0) ? '' : 'primaire '}bouton-cycles" data-on="cycles" data-arg="${lane.id}|${lane.essai}">✎ ${lane.cycles.some(n => n > 0)
    ? 'Corriger les ' + motCompte(co.compte) : 'Noter les ' + motCompte(co.compte)}</button>` : ''}`
    : enCours ? `
    ${co.compter === false ? '' : `<button class="gros-plus" data-on="plus" data-arg="${k}">+1 <span class="compteur-nat" data-on-compteur="${k}">${lane.compteur}</span><small>${motCompte(co.compte, 2)}</small></button>`}
    <div class="boutons-couloir">
      <button class="primaire bouton-virage" data-on="longueur" data-arg="${k}">${enLongueur === L ? '🏁 Arrivée' : '↩ Virage'}</button>
      <button class="bouton-annuler" data-on="annuler" data-arg="${k}" ${lane.pile.length ? '' : 'disabled'} aria-label="Annuler la dernière action du couloir ${k + 1}">↶</button>
    </div>` : '<div class="aide">Non arrivé</div>'}
  </div>`;
}

/* ---------- Résultats ---------- */

function htmlResultatsNat(c, cfg) {
  const ids = Object.keys(cfg.essais).filter(id => cfg.essais[id]?.length && Donnees.get('eleves', id));
  if (!ids.length) return '<div class="boutons-outil"><button data-on="saisir" data-arg="">✎ Saisir un essai à la main (sans chrono)…</button></div>';
  const ordre = elevesDe(c.id).map(el => el.id).filter(id => ids.includes(id));
  return `<details class="resultats-nat" data-on-resultats ${resultatsNatOuverts ? 'open' : ''}>
    <summary>📊 <b>Résultats de la classe</b> <span class="aide">${ordre.length} nageur${ordre.length > 1 ? 's' : ''}</span></summary>
    <div class="tete-saisie-combine">
      <label class="choix-tri">Montrer<select data-on-champ="vue">
        <option value="dernier" ${cfg.vue === 'dernier' ? 'selected' : ''}>le dernier essai</option>
        <option value="meilleur" ${cfg.vue === 'meilleur' ? 'selected' : ''}>le meilleur indice de nage</option>
        <option value="rapide" ${cfg.vue === 'rapide' ? 'selected' : ''}>le meilleur temps</option></select></label></div>
    <div class="carte defile-combine"><table class="tableau-outil tableau-nat">
      <thead><tr><th>Élève</th><th>Nage</th><th>Temps</th><th>${cfg.compte === 'coups' ? 'Coups de bras' : 'Cycles'}</th><th>Vitesse</th><th>Amplitude</th><th>Fréquence</th><th>Indice de nage</th><th></th></tr></thead>
      <tbody>${ordre.map(id => {
    const e = essaiRetenu(cfg, id), a = analyseEssai(e), n = cfg.essais[id].length;
    return `<tr><td><details><summary>${esc(nomOutil(id))}${n > 1 ? ` <span class="aide">· ${n} essais</span>` : ''}</summary>
        <ol class="historique-nat">${cfg.essais[id].map((x, i) => { const b = analyseEssai(x); return `<li>${dateCourte(x.date)} · ${esc(x.nage)} ${x.distance} m · ${fmtTemps(x.temps.at(-1))} · IN ${f2(b.IN)}
          ${enModeEleve() ? '' : `<button class="icone-petit" data-on="suppr-essai" data-arg="${id}|${i}" aria-label="Supprimer cet essai">🗑</button>`}</li>`; }).join('')}</ol></details></td>
      <td>${esc(e.nage)} ${e.distance} m</td>
      <td><b>${fmtTemps(e.temps.at(-1))}</b>${a.longueurs.length > 1 ? `<div class="aide">${a.longueurs.map(l => f1(l.s) + ' s').join(' · ')}${a.ecart !== null ? ` (écart ${f1(a.ecart)} s)` : ''}</div>` : ''}</td>
      <td>${a.cycles}${a.longueurs.length > 1 ? `<div class="aide">${e.cycles.join(' · ')}</div>` : ''}</td>
      <td>${f2(a.V)} <span class="aide">m/s</span></td>
      <td>${f2(a.A)} <span class="aide">${uniteAmpl(e.compte)}</span></td>
      <td>${f1(a.F)} <span class="aide">/min</span></td>
      <td><b class="${classeIN(a.IN, seuilNat(cfg, 'seuilCourse')).trim()}">${f2(a.IN)}</b>${a.longueurs.length > 1 ? `<div class="aide">${a.longueurs.map((l, i) => `<span class="${classeIN(l.IN, seuilNat(cfg, 'seuilLongueur')).trim()}">L${i + 1} ${f2(l.IN)}</span>`).join(' · ')}</div>` : ''}</td>
      <td><button class="icone-petit" data-on="cycles" data-arg="${id}|${cfg.essais[id].indexOf(e)}" title="Noter ou corriger les ${motCompte(e.compte)} de cet essai">✎</button></td></tr>`;
  }).join('')}</tbody></table></div>
    <div class="boutons-outil"><button data-on="saisir" data-arg="">✎ Saisir un essai à la main…</button></div>
    <p class="aide">Vitesse = distance ÷ temps · Amplitude = distance ÷ ${motCompte(cfg.compte)} · Fréquence = ${motCompte(cfg.compte)} par minute ·
      Indice de nage = vitesse × amplitude. Vert : au-dessus du seuil ; rouge : en dessous. Toucher un nom : tous ses essais.</p>
  </details>`;
}

/* ---------- Saisie à la main (sans le chrono) ---------- */

async function saisirEssaiNat(c, cfg, eleveId) {
  const els = elevesDe(c.id);
  let distance = cfg.distance, bassin = cfg.bassin;
  const lignes = () => Array.from({ length: nbLongueurs(distance, bassin) }, (_, i) => `<div class="ligne">
      <label class="etroit">Temps à ${fmt((i + 1) * bassin)} m<input name="t${i}" inputmode="decimal" placeholder="${i ? '1:02,5' : '28,4'}" required></label>
      <label class="etroit">${cfg.compte === 'coups' ? 'Coups de bras' : 'Cycles'} (longueur ${i + 1})<input name="c${i}" type="number" min="0" max="200" step="1" placeholder="si compté"></label></div>`).join('');
  const { d, resultat } = ouvrirModale('Saisir un essai', `
    <label>Élève<select name="eleve" required>${els.map(el => `<option value="${el.id}" ${el.id === eleveId ? 'selected' : ''}>${esc(nomEleveOutil(el))}</option>`).join('')}</select></label>
    <div class="ligne">
      <label>Nage<select name="nage">${NAGES.map(n => `<option ${n === cfg.nage ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="etroit">Distance<select name="distance">${[25, 50, 75, 100, 150, 200, 400].map(x => `<option value="${x}" ${x === distance ? 'selected' : ''}>${x} m</option>`).join('')}</select></label>
      <label class="etroit">Bassin<select name="bassin">${[[25, '25 m'], [50, '50 m'], [12.5, '12,5 m'], [33.33, '33 m']].map(([x, n]) => `<option value="${x}" ${x === bassin ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    </div>
    <p class="aide">Temps de passage cumulés (au bout de chaque longueur), et, si tu les as comptés, les ${motCompte(cfg.compte)} de chaque longueur (sinon, laisse vide : tu pourras les noter plus tard avec ✎).</p>
    <div data-lignes-nat>${lignes()}</div>`, boutonsModale('Enregistrer'));
  d.addEventListener('change', e => {
    if (!['distance', 'bassin'].includes(e.target.name)) return;
    distance = +$('[name="distance"]', d).value; bassin = +$('[name="bassin"]', d).value;
    $('[data-lignes-nat]', d).innerHTML = lignes();
  });
  const r = await resultat;
  if (r.action !== 'ok') return;
  const L = nbLongueurs(distance, bassin), temps = [], cycles = [];
  for (let i = 0; i < L; i++) {
    const s = lireTemps(r.data['t' + i] || '');
    if (s === null || s <= 0 || (i && s * 1000 <= temps[i - 1])) throw new Error(`Temps à ${fmt((i + 1) * bassin)} m illisible ou plus petit que le précédent (ex. 28,4 ou 1:02,5).`);
    temps.push(Math.round(s * 1000));
    cycles.push(Math.max(0, Math.round(+r.data['c' + i] || 0))); // (0 : pas compté, à noter plus tard avec ✎)
  }
  (cfg.essais[r.data.eleve] ??= []).push({ date: aujourdhui(), nage: r.data.nage, distance, bassin, compte: cfg.compte, temps, cycles });
  rendreOutil();
  toast('Essai enregistré ✔', 'ok');
}

/* ---------- Coups de bras notés (ou corrigés) après la course ---------- */

async function editerCyclesNat(c, cfg, id, index) {
  const e = cfg.essais[id]?.[index];
  if (!e) throw new Error('Essai introuvable.');
  const mot = motCompte(e.compte);
  const { d, resultat } = ouvrirModale(`✎ ${nomOutil(id)} — ${mot}`, `
    <p class="aide">${esc(e.nage)} ${e.distance} m · ${fmtTemps(e.temps.at(-1))}. Combien de ${mot} sur chaque longueur ?</p>
    <div class="ligne">${e.temps.map((t, i) => `<label class="etroit">Longueur ${i + 1}
      <input name="c${i}" type="number" min="0" max="200" step="1" inputmode="numeric" class="grand-champ-nat" value="${e.cycles[i] > 0 ? e.cycles[i] : ''}" placeholder="?"></label>`).join('')}</div>
    <p class="aide">Laisse vide une longueur non comptée : l’indice de nage ne se calcule qu’avec toutes les longueurs.</p>`,
  boutonsModale('Enregistrer'));
  $('input', d)?.focus();
  const r = await resultat;
  if (r.action !== 'ok') return;
  e.cycles = e.temps.map((_, i) => Math.max(0, Math.round(+r.data['c' + i] || 0)));
  // La course affichée reprend aussi ces valeurs.
  const lane = cfg.course?.lanes.find(l => l.id === id && l.essai === index);
  if (lane) lane.cycles = [...e.cycles];
  rendreOutil();
  toast(e.cycles.every(n => n > 0) ? 'Enregistré : indice de nage calculé ✔' : 'Enregistré (des longueurs restent sans compte).', 'ok');
}

/* ---------- Actions ---------- */

function enregistrerCouloir(cfg, co, lane) {
  const e = { date: aujourdhui(), nage: co.nage, distance: co.distance, bassin: co.bassin, compte: co.compte, temps: [...lane.temps], cycles: [...lane.cycles] };
  (cfg.essais[lane.id] ??= []).push(e);
  lane.essai = cfg.essais[lane.id].length - 1;
}

function actionNatation(action, arg, c, bouton) {
  const cfg = cfgNatation(c), co = cfg.course;
  const L = co ? nbLongueurs(co.distance, co.bassin) : nbLongueurs(cfg.distance, cfg.bassin);
  switch (action) {
    case 'depart': {
      const ids = Array.from({ length: cfg.couloirs }, (_, k) => cfg.couloir[k] || '');
      if (!ids.some(Boolean)) return toast('Choisis au moins un nageur.', 'erreur');
      if (new Set(ids.filter(Boolean)).size < ids.filter(Boolean).length) return toast('Un même élève est dans deux couloirs.', 'erreur');
      cfg.course = { depart: Date.now(), fin: null, nage: cfg.nage, distance: cfg.distance, bassin: cfg.bassin, compte: cfg.compte, compter: cfg.compterPendant !== false,
        lanes: ids.map(id => ({ id, temps: [], cycles: [], compteur: 0, pile: [], fin: null })) };
      son(990, 0.4);
      return rendreOutil();
    }
    case 'plus': {
      const lane = co?.lanes[+arg];
      if (!co?.depart || co.fin || !lane || lane.temps.length >= L) return;
      lane.compteur++;
      lane.pile.push('c');
      bipToucher();
      // (Pas de redessin complet à chaque coup de bras : seulement le compteur, pour suivre un rythme rapide.)
      const z = $(`#vue [data-on-compteur="${arg}"]`);
      if (z) z.textContent = lane.compteur;
      const annuler = bouton?.closest('.couloir-nat')?.querySelector('[data-on="annuler"]');
      if (annuler) annuler.disabled = false;
      return sauverOutils();
    }
    case 'longueur': {
      const lane = co?.lanes[+arg];
      if (!co?.depart || co.fin || !lane || lane.temps.length >= L) return;
      // (Double toucher par erreur : une longueur ne se nage pas en moins de 3 s.)
      if (Date.now() - co.depart - (lane.temps.at(-1) || 0) < 3000) return toast('Touché deux fois ? Virage ignoré (moins de 3 s).');
      lane.temps.push(Date.now() - co.depart);
      lane.cycles.push(lane.compteur);
      lane.compteur = 0;
      lane.pile.push('l');
      if (lane.temps.length >= L) { lane.fin = co.depart + lane.temps.at(-1); enregistrerCouloir(cfg, co, lane); son(990, 0.2); } else bipToucher();
      if (co.lanes.every(l => !l.id || l.temps.length >= L)) { co.fin = Date.now(); bipFin(); }
      return rendreOutil();
    }
    case 'annuler': {
      const lane = co?.lanes[+arg], quoi = lane?.pile.pop();
      if (!quoi) return;
      if (quoi === 'c') lane.compteur = Math.max(0, lane.compteur - 1);
      else {
        // Retour avant le dernier virage (ou l'arrivée : l'essai enregistré est retiré).
        if (lane.temps.length >= L && lane.essai !== undefined) { cfg.essais[lane.id]?.splice(lane.essai, 1); delete lane.essai; lane.fin = null; }
        lane.temps.pop();
        lane.compteur = lane.cycles.pop() ?? 0;
      }
      return rendreOutil();
    }
    case 'arreter':
      return lancer(async () => {
        if (!(await confirmer('Arrêter la course ? Les nageurs arrivés sont enregistrés ; les autres non.', 'Arrêter'))) return;
        co.fin = Date.now();
        rendreOutil();
      });
    case 'nouvelle': cfg.course = null; return rendreOutil();
    case 'placer': {
      // Un toucher sur un nom : premier couloir libre.
      cfg.couloir = Array.from({ length: cfg.couloirs }, (_, k) => cfg.couloir[k] || '');
      if (cfg.couloir.includes(arg)) return;
      const k = cfg.couloir.indexOf('');
      if (k < 0) return toast(`Les ${cfg.couloirs} couloirs sont pris : touche ✕ pour libérer un couloir (ou ajoute des couloirs dans les réglages).`, 'erreur');
      cfg.couloir[k] = arg;
      bipToucher();
      return rendreOutil();
    }
    case 'retirer': cfg.couloir[+arg] = ''; return rendreOutil();
    case 'vider': cfg.couloir = []; return rendreOutil();
    case 'suivante': {
      // Élèves présents qui n'ont pas encore nagé aujourd'hui, dans l'ordre de la classe.
      const auj = aujourdhui(), deja = new Set([...(co?.lanes.map(l => l.id) || [])]);
      const libres = presentsOutil(c).filter(el => !deja.has(el.id) && !(cfg.essais[el.id] || []).some(e => e.date === auj));
      cfg.couloir = Array.from({ length: cfg.couloirs }, (_, k) => libres[k]?.id || '');
      cfg.course = null;
      if (!libres.length) toast('Tous les élèves présents ont nagé aujourd’hui.');
      return rendreOutil();
    }
    case 'saisir': return lancer(() => saisirEssaiNat(c, cfg, arg));
    case 'cycles': { const [id, i] = arg.split('|'); return lancer(() => editerCyclesNat(c, cfg, id, +i)); }
    case 'suppr-essai':
      if (enModeEleve()) return;
      return lancer(async () => {
        const [id, i] = arg.split('|');
        if (!(await confirmer(`Supprimer cet essai de ${nomOutil(id)} ?`, 'Supprimer'))) return;
        cfg.essais[id].splice(+i, 1);
        if (!cfg.essais[id].length) delete cfg.essais[id];
        rendreOutil();
      });
  }
}

RENDUS_OUTILS.natation = htmlNatation;
BLOCS_DIRECTS.natation = arg => {
  const [classeId, k] = arg.split('|'), co = etatOutils.natation?.[classeId]?.course;
  return fmtTemps(ecouleNat(co, +k >= 0 ? co?.lanes[+k] : null));
};

document.addEventListener('click', e => {
  const b = e.target.closest('#vue [data-on]');
  if (!b || b.disabled) return;
  const c = classeActive();
  if (c) lancer(() => actionNatation(b.dataset.on, b.dataset.arg, c, b));
});

// Volets repliables (réglages, résultats) : gardés ouverts ou fermés d'un affichage à l'autre.
document.addEventListener('toggle', e => {
  if (e.target.matches?.('#vue [data-on-reglages]')) reglagesNatOuverts = e.target.open;
  if (e.target.matches?.('#vue [data-on-resultats]')) resultatsNatOuverts = e.target.open;
}, true);

document.addEventListener('change', e => {
  const t = e.target;
  if (!t.closest?.('#vue .outil-natation')) return;
  const c = classeActive();
  if (!c) return;
  const cfg = cfgNatation(c);
  if (t.dataset.onChamp) {
    const k = t.dataset.onChamp;
    if (k === 'seuils') cfg.seuils = t.checked;
    else if (k === 'compterPendant') cfg.compterPendant = t.value !== 'apres';
    else if (['bassin', 'distance', 'couloirs'].includes(k)) cfg[k] = +t.value;
    else if (k.startsWith('seuil')) { cfg[k] = Math.max(0.1, Math.min(6, nombreOutil(t.value) || cfg[k])); t.value = cfg[k]; return sauverOutils(); }
    else cfg[k] = t.value;
    if (k === 'distance' || k === 'bassin') { if (cfg.distance < cfg.bassin) cfg.distance = cfg.bassin; }
    return rendreOutil();
  }
  if (t.dataset.onCouloir !== undefined) { cfg.couloir[+t.dataset.onCouloir] = t.value; return rendreOutil(); }
});

/* ---------- 📤 Vers une leçon ---------- */

TRANSFERTS.natation = c => {
  const cfg = cfgNatation(c);
  const ids = Object.keys(cfg.essais).filter(id => cfg.essais[id]?.length && Donnees.get('eleves', id));
  if (!ids.length) throw new Error('Aucun essai enregistré.');
  const ret = Object.fromEntries(ids.map(id => [id, essaiRetenu(cfg, id)]));
  const an = Object.fromEntries(ids.map(id => [id, analyseEssai(ret[id])]));
  const col = (nom, type, f, extra = {}) => ({ nom, type, ...extra, valeurs: Object.fromEntries(ids.map(id => [id, f(id)]).filter(([, v]) => v !== null && v !== '')) });
  const nb = v => (v === null || !Number.isFinite(v) ? null : String(Math.round(v * 100) / 100));
  return { titre: 'Natation — indice de nage', apsa: 'Natation', colonnes: [
    col('Nage', 'choix', id => ret[id].nage, { options: [...NAGES] }),
    col('Distance', 'distance', id => String(ret[id].distance), { unite: 'm' }),
    col('Temps', 'temps', id => String(Math.round(ret[id].temps.at(-1) / 10) / 100)),
    col(cfg.compte === 'coups' ? 'Coups de bras' : 'Cycles de bras', 'nombre', id => (an[id].cycles > 0 ? String(an[id].cycles) : null)),
    col('Vitesse', 'nombre', id => nb(an[id].V), { unite: 'm/s' }),
    col('Amplitude', 'nombre', id => nb(an[id].A), { unite: uniteAmpl(cfg.compte) }),
    col('Fréquence', 'nombre', id => nb(an[id].F), { unite: '/min' }),
    col('Indice de nage', 'nombre', id => nb(an[id].IN)),
  ] };
};
