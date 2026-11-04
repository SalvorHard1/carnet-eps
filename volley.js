'use strict';
// Outil « 🏐 Volley-ball » (Outils › APSA) : statistiques de réussite par joueur. Pendant le match, deux touchers suffisent :
// le joueur (il reste choisi), puis le geste réussi ✓ ou raté ✗. Chaque geste garde sa couleur partout (saisie et tableau).
// Une couleur désigne donc un geste, jamais un niveau : le niveau se lit au pourcentage, à la barre et aux repères ⭐ ⚠,
// affichés seulement à partir de 5 essais (on ne juge pas un élève sur « 1 sur 1 = 100 % »).
// Tout est gardé sur cet appareil ; « 📤 Vers une leçon » range la période affichée dans le carnet.
// Les situations proposées d'après ces résultats (ateliers, fiche élève) sont dans volleysituations.js.

OUTILS.push({ id: 'volley', famille: 'apsa', icone: '🏐', nom: 'Volley-ball', info: 'Réussite par joueur : service, réception, passe, attaque', classe: true });

const GESTES_VOLLEY = [
  { id: 'service', nom: 'Service', actif: true, teinte: 0 },
  { id: 'reception', nom: 'Réception', actif: true, teinte: 1 },
  { id: 'passe', nom: 'Passe', actif: true, teinte: 2 },
  { id: 'attaque', nom: 'Attaque', actif: true, teinte: 3 },
  { id: 'contre', nom: 'Contre', actif: false, teinte: 4 },
];
const NB_TEINTES_VOLLEY = 6, MIN_ESSAIS_VOLLEY = 5, POINT_FORT_VOLLEY = 70, A_TRAVAILLER_VOLLEY = 40;
const PERIODES_VOLLEY = [['match', 'Ce match'], ['jour', 'Aujourd’hui'], ['tout', 'Depuis le début']];

function cfgVolley(c) {
  return ((etatOutils.volley ??= {})[c.id] ??= {
    gestes: structuredClone(GESTES_VOLLEY), score: false, periode: 'match', geste: '',
    prep: { a: { nom: 'Équipe 1', membres: [], source: '' }, b: { nom: 'Équipe 2', membres: [], source: '' } },
    enCours: null, joueur: '', matchs: [], actions: [],
  });
}

const matchEnCoursVolley = cfg => cfg.matchs.find(m => m.id === cfg.enCours) || null;
const pctVolley = (r, e) => (e ? Math.round(r / e * 100) : null);
const gestesActifsVolley = cfg => cfg.gestes.filter(g => g.actif);
const nomGesteVolley = (cfg, id) => cfg.gestes.find(g => g.id === id)?.nom || '?';

// Les actions de la période choisie (« Ce match » = le match en cours ou le dernier joué).
function actionsVolley(cfg, periode = cfg.periode) {
  if (periode === 'tout') return cfg.actions;
  const ids = periode === 'match' ? [cfg.matchs.at(-1)?.id] : cfg.matchs.filter(m => m.date === aujourdhui()).map(m => m.id);
  return cfg.actions.filter(a => ids.includes(a.m));
}

// { eleveId: { r, e, g: { gesteId: { r, e } } } }
function statsVolley(actions) {
  const st = {};
  for (const a of actions) {
    const s = (st[a.j] ??= { r: 0, e: 0, g: {} }), g = (s.g[a.g] ??= { r: 0, e: 0 });
    s.r += a.r; s.e++; g.r += a.r; g.e++;
  }
  return st;
}

// Les gestes actifs, plus ceux qui ont des résultats dans la période (un geste décoché ne fait pas disparaître ses résultats).
const colonnesVolley = (cfg, actions) => cfg.gestes.filter(g => g.actif || actions.some(a => a.g === g.id));

/* ---------- Affichage ---------- */

function htmlVolley(c) {
  const cfg = cfgVolley(c), m = matchEnCoursVolley(cfg), onglet = cfg.onglet ?? 'match';
  const partie = onglet === 'ateliers' ? htmlAteliersVolley(c, cfg) : onglet === 'eleve' ? htmlEleveVolley(c, cfg)
    // (En mode élève, pas de tableau : les élèves ne voient pas les pourcentages des autres.)
    : `${m ? htmlMatchVolley(cfg, m) : htmlPreparerVolley(c, cfg)}${enModeEleve() ? '' : htmlBilanVolley(c, cfg)}`;
  return `${htmlOngletsVolley(cfg)}
    ${enModeEleve() ? '' : htmlReglagesVolley(cfg)}
    ${htmlPresents(c)}
    ${partie}`;
}

function htmlReglagesVolley(cfg) {
  return `<details class="carte reglages-combine" data-ovb-reglages ${reglagesVolleyOuverts ? 'open' : ''}><summary>⚙ Gestes observés
      <span class="aide">${gestesActifsVolley(cfg).map(g => esc(g.nom)).join(' · ')}${cfg.score ? ' · score' : ''}</span></summary>
    <div class="ligne reglage-outil">${cfg.gestes.map(g => `<label class="case"><input type="checkbox" data-ovb-geste="${esc(g.id)}" ${g.actif ? 'checked' : ''}>
      <span class="pastille-volley teinte-volley-${g.teinte}" aria-hidden="true"></span> ${esc(g.nom)}</label>`).join('')}</div>
    <div class="ligne reglage-outil">
      <label>Ajouter un geste<input type="text" data-ovb-nouveau maxlength="20" placeholder="Ex. : manchette"></label>
      <button data-ovb="ajouter-geste">+ Ajouter</button>
      <label class="case"><input type="checkbox" data-ovb-score ${cfg.score ? 'checked' : ''}> Compter aussi le score</label>
      <label class="case"><input type="checkbox" data-ovb-cause ${cfg.cause ? 'checked' : ''}> Demander la cause après un ✗</label>
    </div>
    <p class="aide">Avec des 6e, deux ou trois gestes suffisent. Un geste décoché disparaît de la saisie ; ses résultats restent dans le tableau.</p>
  </details>`;
}

function htmlPreparerVolley(c, cfg) {
  const els = presentsOutil(c), p = cfg.prep, liste = etatOutils.equipes[c.id]?.liste || [];
  const equipeDe = id => (p.a.membres.includes(id) ? 'a' : p.b.membres.includes(id) ? 'b' : '');
  const source = k => `<label>${k === 'a' ? 'Équipe 1' : 'Équipe 2'} de l’outil Équipes<select data-ovb-source="${k}"><option value="">—</option>
    ${liste.map((eq, i) => `<option value="${i}" ${p[k].source === String(i) ? 'selected' : ''}>Équipe ${esc(COULEURS_EQUIPES[eq.couleur])}</option>`).join('')}</select></label>`;
  return `<div class="carte preparer-volley">
    ${liste.length ? `<div class="ligne reglage-outil">${source('a')}${source('b')}</div>` : ''}
    <div class="ligne reglage-outil">
      <label>Nom de l’équipe 1<input type="text" data-ovb-nom="a" maxlength="30" value="${esc(p.a.nom)}"></label>
      <label>Nom de l’équipe 2<input type="text" data-ovb-nom="b" maxlength="30" value="${esc(p.b.nom)}"></label>
    </div>
    <p class="aide">Qui joue ? Touche un nom : une fois pour l’équipe 1, deux fois pour l’équipe 2, trois fois s’il ne joue pas.
      Une seule équipe suffit si tu ne suis qu’elle.</p>
    <div class="chips-volley">${els.map(el => { const k = equipeDe(el.id); return `<button type="button" class="chip-volley${k ? ' equipe-' + k : ''}" data-ovb="composer" data-arg="${el.id}">
      ${k ? `<span class="numero-volley">${k === 'a' ? 1 : 2}</span>` : ''}${esc(nomEleveOutil(el))}</button>`; }).join('')}</div>
    <div class="boutons-outil">
      <button class="primaire gros" data-ovb="commencer">🏐 Commencer le match</button>
      <button data-ovb="vider">Vider les équipes</button>
    </div>
  </div>`;
}

function htmlMatchVolley(cfg, m) {
  const gestes = gestesActifsVolley(cfg), actions = cfg.actions.filter(a => a.m === m.id), st = statsVolley(actions);
  const der = actions.at(-1), joueur = Donnees.get('eleves', cfg.joueur);
  const equipe = k => (m[k].membres.length ? `<div class="equipe-volley"><h4>${esc(m[k].nom)}</h4><div class="joueurs-volley">${m[k].membres.map(id => `
      <button class="joueur-volley${id === cfg.joueur ? ' choisi' : ''}" data-ovb="joueur" data-arg="${id}" aria-pressed="${id === cfg.joueur}">${esc(nomOutil(id))}
        <small>${st[id]?.e || 0} ballon${(st[id]?.e || 0) > 1 ? 's' : ''}</small></button>`).join('')}</div></div>` : '');
  return `<div class="carte match-volley">
    <div class="barre-outil">
      <button data-ovb="annuler" ${m.pile.length ? '' : 'disabled'}>↶ Annuler le dernier</button>
      <span class="aide dernier-volley">${der ? `Dernier : ${esc(nomOutil(der.j))}, ${esc(nomGesteVolley(cfg, der.g).toLowerCase())} ${der.r ? 'réussi' : 'raté'}` : 'Aucun geste noté pour l’instant'}</span>
      <span class="espace-outil"></span>
      <button class="primaire" data-ovb="terminer">🏁 Terminer le match</button>
    </div>
    ${cfg.score ? htmlScoreVolley(m) : ''}
    <div class="equipes-volley">${equipe('a')}${equipe('b')}</div>
    <p class="consigne-volley">${joueur ? `Geste de <b>${esc(nomEleveOutil(joueur))}</b> :` : 'Touche d’abord un joueur.'}</p>
    <div class="gestes-volley">${gestes.map(g => `<div class="geste-volley teinte-volley-${g.teinte}">
      <div class="titre-geste-volley">${esc(g.nom)}</div>
      <div class="boutons-geste-volley">
        <button class="reussi-volley" data-ovb="noter" data-arg="${esc(g.id)}|1" aria-label="${esc(g.nom)} réussi">✓</button>
        <button class="rate-volley" data-ovb="noter" data-arg="${esc(g.id)}|0" aria-label="${esc(g.nom)} raté">✗</button>
      </div></div>`).join('')}</div>
    ${cfg.cause && der && !der.r && !der.c ? `<div class="boutons-outil cause-volley"><span class="aide">Pourquoi raté ? (facultatif)</span>
      ${CAUSES_VOLLEY.map(([id, nom]) => `<button data-ovb="cause" data-arg="${id}">${nom}</button>`).join('')}</div>` : ''}
  </div>`;
}

const nomAdverseVolley = m => (m.b.membres.length ? m.b.nom : 'Adversaires');
function htmlScoreVolley(m) {
  const set = m.sets.at(-1), finis = m.sets.slice(0, -1);
  return `<div class="score-volley">
    <button data-ovb="point" data-arg="a">+1 ${esc(m.a.membres.length ? m.a.nom : 'Nous')}</button>
    <span class="chiffres-volley">${set.a} – ${set.b}</span>
    <button data-ovb="point" data-arg="b">+1 ${esc(nomAdverseVolley(m))}</button>
    <button data-ovb="set-suivant">Set suivant</button>
    ${finis.length ? `<span class="aide">Sets : ${finis.map(s => `${s.a}-${s.b}`).join(', ')}</span>` : ''}
  </div>`;
}

// Une case du tableau : couleur du geste, %, repère, nombre d'essais, barre (par pas de 10 % : la CSP interdit le style en ligne).
function caseVolley(g, s) {
  const e = s?.e || 0, p = pctVolley(s?.r || 0, e);
  const repere = e < MIN_ESSAIS_VOLLEY ? '' : p >= POINT_FORT_VOLLEY ? ' <span title="Point fort">⭐</span>' : p < A_TRAVAILLER_VOLLEY ? ' <span title="À travailler">⚠</span>' : '';
  return `<td class="case-volley teinte-volley-${g.teinte}"><b>${p === null ? '–' : p + ' %'}</b>${repere} <small>(${e})</small>
    <span class="barre-volley"><i class="largeur-volley-${Math.round((p || 0) / 10)}"></i></span></td>`;
}

function ligneVolley(nom, colonnes, s, classe = '') {
  return `<tr class="${classe}"><td>${nom}</td>${colonnes.map(g => caseVolley(g, s?.g[g.id])).join('')}
    <td class="total-volley"><b>${s?.e ? pctVolley(s.r, s.e) + ' %' : '–'}</b></td><td class="total-volley">${s?.e || 0}</td></tr>`;
}

// Le total d'une équipe, pour la ligne de synthèse et le geste le plus fragile.
function totalEquipeVolley(membres, st) {
  const t = { r: 0, e: 0, g: {} };
  for (const id of membres) {
    const s = st[id];
    if (!s) continue;
    t.r += s.r; t.e += s.e;
    for (const [g, v] of Object.entries(s.g)) { const x = (t.g[g] ??= { r: 0, e: 0 }); x.r += v.r; x.e += v.e; }
  }
  return t;
}
function fragileVolley(cfg, t) {
  const l = Object.entries(t.g).filter(([, v]) => v.e >= MIN_ESSAIS_VOLLEY).map(([id, v]) => [id, pctVolley(v.r, v.e)]).sort((x, y) => x[1] - y[1]);
  return l.length > 1 ? `${nomGesteVolley(cfg, l[0][0]).toLowerCase()} ${l[0][1]} %` : '';
}

function htmlBilanVolley(c, cfg) {
  if (!cfg.actions.length) return '';
  const actions = actionsVolley(cfg), st = statsVolley(actions), colonnes = colonnesVolley(cfg, actions), dernier = cfg.matchs.at(-1);
  const existe = id => Donnees.get('eleves', id);
  let corps;
  if (cfg.periode === 'match' && dernier) {
    corps = ['a', 'b'].filter(k => dernier[k].membres.length).map(k => {
      const membres = dernier[k].membres.filter(existe), t = totalEquipeVolley(membres, st), f = fragileVolley(cfg, t);
      return membres.map(id => ligneVolley(esc(nomOutil(id)), colonnes, st[id])).join('')
        + ligneVolley(`<b>${esc(dernier[k].nom)}</b>${f ? `<br><small>Le plus fragile : ${esc(f)}</small>` : ''}`, colonnes, t, 'ligne-equipe-volley');
    }).join('');
  } else corps = elevesDe(c.id).filter(el => st[el.id]).map(el => ligneVolley(esc(nomEleveOutil(el)), colonnes, st[el.id])).join('');
  return `<h3>Résultats</h3>
    <div class="boutons-outil periodes-volley">${PERIODES_VOLLEY.map(([id, nom]) => `<button data-ovb="periode" data-arg="${id}" class="${cfg.periode === id ? 'choisi' : ''}" aria-pressed="${cfg.periode === id}">${nom}</button>`).join('')}</div>
    ${actions.length ? `<div class="carte defile-combine"><table class="tableau-outil tableau-volley">
      <thead><tr><th>Joueur</th>${colonnes.map(g => `<th class="tete-volley teinte-volley-${g.teinte}">${esc(g.nom)}</th>`).join('')}<th>Réussite</th><th>Ballons</th></tr></thead>
      <tbody>${corps}</tbody></table></div>
    <p class="aide">% de réussite (nombre d’essais). À partir de ${MIN_ESSAIS_VOLLEY} essais : ⭐ point fort (${POINT_FORT_VOLLEY} % et plus), ⚠ à travailler (moins de ${A_TRAVAILLER_VOLLEY} %).
      ${enModeEleve() ? '' : `📤 « Vers une ${motMin('lecon')} » envoie la période affichée.`}</p>` : '<p class="aide">Rien de noté sur cette période.</p>'}
    ${actions.length ? `<div class="suite-volley"><b>Et maintenant ?</b>
      <button data-ovs="onglet" data-arg="ateliers">🧩 Former des ateliers</button>
      <button data-ovs="onglet" data-arg="eleve">🎯 Voir le défi d’un élève</button></div>` : ''}
    ${htmlProgressionVolley(c, cfg)}
    ${htmlMatchsVolley(cfg)}`;
}

// Progression séance par séance (les 8 derniers jours de match), pour tous les gestes ou un seul.
function htmlProgressionVolley(c, cfg) {
  const dateDe = Object.fromEntries(cfg.matchs.map(m => [m.id, m.date]));
  const actions = cfg.actions.filter(a => !cfg.geste || a.g === cfg.geste);
  const dates = [...new Set(cfg.actions.map(a => dateDe[a.m]))].sort().slice(-8);
  const parDate = Object.fromEntries(dates.map(d => [d, statsVolley(actions.filter(a => dateDe[a.m] === d))]));
  const ids = elevesDe(c.id).filter(el => dates.some(d => parDate[d][el.id]));
  const evolution = id => {
    const l = dates.map(d => parDate[d][id]).filter(s => s?.e >= MIN_ESSAIS_VOLLEY);
    if (l.length < 2) return '–';
    const ecart = pctVolley(l.at(-1).r, l.at(-1).e) - pctVolley(l[0].r, l[0].e);
    return `${ecart > 0 ? '↗ +' : ecart < 0 ? '↘ ' : '→ '}${ecart} pts`;
  };
  return `<details class="carte progression-volley" data-ovb-progression ${progressionVolleyOuverte ? 'open' : ''}><summary>📈 Progression séance par séance</summary>
    <div class="ligne reglage-outil"><label>Geste<select data-ovb-prog><option value="">Tous les gestes</option>
      ${cfg.gestes.map(g => `<option value="${esc(g.id)}" ${cfg.geste === g.id ? 'selected' : ''}>${esc(g.nom)}</option>`).join('')}</select></label></div>
    <div class="defile-combine"><table class="tableau-outil">
      <thead><tr><th>Joueur</th>${dates.map(d => `<th>${dateCourte(d)}</th>`).join('')}${dates.length > 1 ? '<th>Évolution</th>' : ''}</tr></thead>
      <tbody>${ids.map(el => `<tr><td>${esc(nomEleveOutil(el))}</td>${dates.map(d => { const s = parDate[d][el.id]; return `<td>${s ? `<b>${pctVolley(s.r, s.e)} %</b> <small>(${s.e})</small>` : '–'}</td>`; }).join('')}
        ${dates.length > 1 ? `<td>${evolution(el.id)}</td>` : ''}</tr>`).join('')}</tbody>
    </table></div>
    <p class="aide">L’évolution compare la première et la dernière séance où le joueur a au moins ${MIN_ESSAIS_VOLLEY} essais.</p>
  </details>`;
}

function htmlMatchsVolley(cfg) {
  const scoreDe = m => (m.sets.some(s => s.a || s.b) ? ` · ${m.sets.filter(s => s.a || s.b).map(s => `${s.a}-${s.b}`).join(', ')}` : '');
  return `<details class="historique-boxe"><summary>Liste des matchs (${cfg.matchs.length})</summary><ol>${cfg.matchs.map(m => `<li>${dateCourte(m.date)} · ${esc(m.a.membres.length ? m.a.nom : '')}${m.a.membres.length && m.b.membres.length ? ' – ' : ''}${esc(m.b.membres.length ? m.b.nom : '')}${scoreDe(m)}
    ${enModeEleve() || m.id === cfg.enCours ? '' : `<button class="icone-petit" data-ovb="suppr-match" data-arg="${m.id}" aria-label="Supprimer ce match">🗑</button>`}</li>`).join('')}</ol></details>`;
}

RENDUS_OUTILS.volley = htmlVolley;
let reglagesVolleyOuverts = false, progressionVolleyOuverte = false;
document.addEventListener('toggle', e => {
  if (e.target.matches?.('[data-ovb-reglages]')) reglagesVolleyOuverts = e.target.open;
  if (e.target.matches?.('[data-ovb-progression]')) progressionVolleyOuverte = e.target.open;
}, true);

/* ---------- Actions ---------- */

function commencerMatchVolley(c, cfg) {
  const presents = presentsOutil(c).map(el => el.id), p = cfg.prep;
  const membres = k => p[k].membres.filter(id => presents.includes(id));
  const a = membres('a'), b = membres('b');
  if (!a.length && !b.length) return toast('Touche d’abord les noms de ceux qui jouent.', 'erreur');
  if (!gestesActifsVolley(cfg).length) return toast('Coche au moins un geste dans ⚙ Gestes observés.', 'erreur');
  const m = { id: 'm' + Date.now(), date: aujourdhui(), a: { nom: p.a.nom || 'Équipe 1', membres: a }, b: { nom: p.b.nom || 'Équipe 2', membres: b }, sets: [{ a: 0, b: 0 }], pile: [] };
  cfg.matchs.push(m);
  cfg.enCours = m.id;
  cfg.joueur = a[0] || b[0];
  cfg.periode = 'match';
  rendreOutil();
}

function actionVolley(action, arg, c) {
  const cfg = cfgVolley(c), m = matchEnCoursVolley(cfg);
  switch (action) {
    case 'composer': {
      const { a, b } = cfg.prep;
      if (a.membres.includes(arg)) { a.membres = a.membres.filter(id => id !== arg); b.membres.push(arg); }
      else if (b.membres.includes(arg)) b.membres = b.membres.filter(id => id !== arg);
      else a.membres.push(arg);
      return rendreOutil();
    }
    case 'vider': cfg.prep.a.membres = []; cfg.prep.b.membres = []; cfg.prep.a.source = cfg.prep.b.source = ''; return rendreOutil();
    case 'commencer': return commencerMatchVolley(c, cfg);
    case 'joueur': cfg.joueur = arg; return rendreOutil();
    case 'noter': {
      if (!m) return;
      if (!cfg.joueur) return toast('Touche d’abord un joueur.', 'erreur');
      const [g, r] = arg.split('|');
      cfg.actions.push({ m: m.id, j: cfg.joueur, g, r: +r });
      m.pile.push('geste');
      bipToucher();
      return rendreOutil();
    }
    case 'cause': { const der = cfg.actions.filter(a => a.m === m?.id).at(-1); if (der) der.c = arg; return rendreOutil(); }
    case 'point': if (!m) return; m.sets.at(-1)[arg]++; m.pile.push(arg); bipToucher(); return rendreOutil();
    case 'set-suivant': if (!m) return; m.sets.push({ a: 0, b: 0 }); m.pile.push('set'); return rendreOutil();
    case 'annuler': {
      const d = m?.pile.pop();
      if (d === 'geste') cfg.actions.pop();
      else if (d === 'set') m.sets.pop();
      else if (d) m.sets.at(-1)[d]--;
      return rendreOutil();
    }
    case 'terminer': {
      cfg.enCours = null;
      // Un match où rien n'a été noté ne reste pas dans la liste.
      if (!m?.pile.length) cfg.matchs = cfg.matchs.filter(x => x !== m);
      else delete m.pile;
      return rendreOutil();
    }
    case 'periode': cfg.periode = arg; return rendreOutil();
    case 'ajouter-geste': {
      const champ = $('[data-ovb-nouveau]'), nom = champ?.value.trim();
      if (!nom) return toast('Écris d’abord le nom du geste.', 'erreur');
      if (cfg.gestes.some(g => sansAccent(g.nom) === sansAccent(nom))) return toast('Ce geste existe déjà.', 'erreur');
      cfg.gestes.push({ id: 'g' + Date.now(), nom, actif: true, teinte: cfg.gestes.length % NB_TEINTES_VOLLEY });
      return rendreOutil();
    }
    case 'suppr-match':
      if (enModeEleve()) return;
      return lancer(async () => {
        if (!(await confirmer('Supprimer ce match et ses résultats ?', 'Supprimer'))) return;
        cfg.matchs = cfg.matchs.filter(x => x.id !== arg);
        cfg.actions = cfg.actions.filter(x => x.m !== arg);
        rendreOutil();
      });
  }
}

document.addEventListener('click', e => {
  const b = e.target.closest('#vue [data-ovb]');
  if (!b || b.disabled) return;
  const c = classeActive();
  if (c) lancer(() => actionVolley(b.dataset.ovb, b.dataset.arg, c));
});

document.addEventListener('change', e => {
  const t = e.target;
  if (!t.closest?.('#vue .outil-volley')) return;
  const c = classeActive();
  if (!c) return;
  const cfg = cfgVolley(c);
  if (t.dataset.ovbGeste) {
    const g = cfg.gestes.find(x => x.id === t.dataset.ovbGeste);
    if (g.actif && gestesActifsVolley(cfg).length === 1) { t.checked = true; return toast('Garde au moins un geste.', 'erreur'); }
    g.actif = t.checked;
    return rendreOutil();
  }
  if (t.dataset.ovbScore !== undefined) { cfg.score = t.checked; return rendreOutil(); }
  if (t.dataset.ovbCause !== undefined) { cfg.cause = t.checked; return rendreOutil(); }
  if (t.dataset.ovbProg !== undefined) { cfg.geste = t.value; return rendreOutil(); }
  // (Champ texte : on enregistre sans redessiner, pour ne pas perdre le clic suivant.)
  if (t.dataset.ovbNom) { cfg.prep[t.dataset.ovbNom].nom = t.value.trim(); return sauverOutils(); }
  if (t.dataset.ovbSource) {
    const k = t.dataset.ovbSource, autre = k === 'a' ? 'b' : 'a', eq = etatOutils.equipes[c.id]?.liste?.[+t.value];
    cfg.prep[k].source = t.value;
    if (t.value !== '' && eq) {
      cfg.prep[k].membres = eq.membres.filter(id => Donnees.get('eleves', id));
      cfg.prep[k].nom = 'Équipe ' + COULEURS_EQUIPES[eq.couleur];
      cfg.prep[autre].membres = cfg.prep[autre].membres.filter(id => !eq.membres.includes(id));
    } else cfg.prep[k].membres = [];
    return rendreOutil();
  }
});

/* ---------- 📤 Vers une leçon : la réussite par geste de la période affichée ---------- */

TRANSFERTS.volley = c => {
  const cfg = cfgVolley(c), actions = actionsVolley(cfg).filter(a => Donnees.get('eleves', a.j));
  if (!actions.length) throw new Error('Rien de noté sur cette période.');
  const st = statsVolley(actions), ids = Object.keys(st);
  return { titre: 'Volley-ball — réussite', apsa: 'Volley-ball', colonnes: [
    ...colonnesVolley(cfg, actions).map(g => ({ nom: 'Réussite ' + g.nom.toLowerCase(), type: 'nombre', unite: '%',
      valeurs: Object.fromEntries(ids.filter(id => st[id].g[g.id]).map(id => [id, String(pctVolley(st[id].g[g.id].r, st[id].g[g.id].e))])) })),
    { nom: 'Ballons touchés', type: 'nombre', valeurs: Object.fromEntries(ids.map(id => [id, String(st[id].e)])) },
  ].filter(x => Object.keys(x.valeurs).length) };
};
