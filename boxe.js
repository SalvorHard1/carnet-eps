'use strict';
// Outil « 🥊 Boxe française » (Outils › APSA) : assaut entre deux tireurs (rouge / bleu), reprises chronométrées avec
// repos, comptage des touches au toucher (poing, pied, touche bonifiée), avertissements, arbitre et juge.
// Réglages par défaut tirés des fiches académiques (Nice, Nancy-Metz, Bordeaux, Martinique…) : 2 reprises de 1'30,
// 1 min de repos ; touche de poing = 1 point, de pied = 2 points ; touche bonifiée (toucher sans être touché) en option ;
// un avertissement retire 1 point. Tout est réglable, car les barèmes varient d'une académie à l'autre.
// Les assauts sont gardés sur cet appareil ; « 📤 Vers une leçon » range le bilan de chaque élève dans le carnet.

OUTILS.push({ id: 'boxe', famille: 'apsa', icone: '🥊', nom: 'Boxe française', info: 'Touches poing / pied, reprises, avertissements, arbitre et juge', classe: true });

const COINS = { a: 'Rouge', b: 'Bleu' };
const viergeBoxe = () => ({ poing: 0, pied: 0, bonus: 0, avert: 0 });

function cfgBoxe(c) {
  return ((etatOutils.boxe ??= {})[c.id] ??= {
    reprises: 2, duree: 90, repos: 60, pts: { poing: 1, pied: 2, bonus: 1, avert: 1 }, bareme: 'arme', bonifiee: false,
    choix: { a: '', b: '', arbitre: '', juge: '' }, assaut: null, historique: [],
  });
}

const totalCoin = (cfg, s) => {
  const p = cfg.bareme === 'touche' ? { ...cfg.pts, pied: cfg.pts.poing } : cfg.pts;
  return s.poing * p.poing + s.pied * p.pied + (cfg.bonifiee ? s.bonus * p.bonus : 0) - s.avert * p.avert;
};
const sommeBoxe = (scores, coin) => scores.reduce((t, r) => { for (const k in t) t[k] += r[coin][k]; return t; }, viergeBoxe());
function resultatAssaut(cfg, as) {
  const A = totalCoin(cfg, sommeBoxe(as.scores, 'a')), B = totalCoin(cfg, sommeBoxe(as.scores, 'b'));
  return { A, B, gagnant: A > B ? 'a' : B > A ? 'b' : null };
}

/* ---------- Chrono de l'assaut : reprise (compte à rebours), repos, reprise suivante ---------- */

// Phases : 'pret' (avant « Boxez ! »), 'combat' (en marche ou arrêté par l'arbitre), 'repos', 'fini'.
const ecouleBoxe = as => (as.cumul || 0) + (as.debut ? Date.now() - as.debut : 0);
function resteBoxe(cfg, as) {
  if (as.phase === 'combat') return cfg.duree * 1000 - ecouleBoxe(as);
  if (as.phase === 'repos') return cfg.repos * 1000 - (Date.now() - as.debutRepos);
  return as.phase === 'pret' ? cfg.duree * 1000 : 0;
}

// Appelé à chaque top de l'horloge des outils (outils.js › verifierEcheances).
function verifierBoxe() {
  for (const [classeId, cfg] of Object.entries(etatOutils.boxe || {})) {
    const as = cfg.assaut;
    if (!as) continue;
    if (as.phase === 'combat' && as.debut && resteBoxe(cfg, as) <= 0) {
      as.cumul = cfg.duree * 1000; as.debut = null;
      if (as.reprise >= cfg.reprises - 1) { as.phase = 'fini'; bipFin(); enregistrerAssaut(cfg, as); }
      else { as.phase = 'repos'; as.debutRepos = Date.now(); son(660, 0.6, 2); }
      if (classeId === classeActive()?.id) rendreOutil(); else sauverOutils();
    } else if (as.phase === 'repos' && resteBoxe(cfg, as) <= 0) {
      as.phase = 'pret'; as.reprise++; as.cumul = 0; as.scores.push({ a: viergeBoxe(), b: viergeBoxe() });
      son(990, 0.25, 2);
      if (classeId === classeActive()?.id) rendreOutil(); else sauverOutils();
    } else if (as.phase === 'repos' && Math.ceil(resteBoxe(cfg, as) / 1000) <= 3 && as.dernierBip !== Math.ceil(resteBoxe(cfg, as) / 1000)) {
      as.dernierBip = Math.ceil(resteBoxe(cfg, as) / 1000);
      bipCourt();
    }
  }
}

function enregistrerAssaut(cfg, as) {
  if (as.enregistre) return;
  const r = resultatAssaut(cfg, as);
  cfg.historique.push({
    date: aujourdhui(), a: as.a, b: as.b, arbitre: as.arbitre, juge: as.juge,
    scores: structuredClone(as.scores), A: r.A, B: r.B, gagnant: r.gagnant,
    bareme: { pts: { ...cfg.pts }, bareme: cfg.bareme, bonifiee: cfg.bonifiee },
  });
  as.enregistre = cfg.historique.length - 1;
}

/* ---------- Affichage ---------- */

function htmlBoxe(c) {
  const cfg = cfgBoxe(c), as = cfg.assaut;
  const choix = (valeur, liste) => liste.map(([v, nom]) => `<option value="${esc(v)}" ${String(valeur) === String(v) ? 'selected' : ''}>${esc(nom)}</option>`).join('');
  const verrou = as && as.phase !== 'fini' ? 'disabled' : '';
  let html = `<details class="carte reglages-combine" data-ob-reglages ${reglagesBoxeOuverts ? 'open' : ''}><summary>⚙ Règles de l’assaut
      <span class="aide">${cfg.reprises} × ${fmtTemps(cfg.duree * 1000, false)} · repos ${fmtTemps(cfg.repos * 1000, false)} ·
      ${cfg.bareme === 'touche' ? `touche = ${cfg.pts.poing} pt` : `poing ${cfg.pts.poing} · pied ${cfg.pts.pied}`}${cfg.bonifiee ? ` · bonifiée +${cfg.pts.bonus}` : ''} · avert. −${cfg.pts.avert}</span></summary>
    <div class="ligne reglage-outil">
      <label class="etroit">Reprises<select data-ob-champ="reprises" ${verrou}>${choix(cfg.reprises, [1, 2, 3].map(n => [n, n]))}</select></label>
      <label class="etroit">Durée<select data-ob-champ="duree" ${verrou}>${choix(cfg.duree, [[45, '0:45'], [60, '1:00'], [90, '1:30'], [120, '2:00'], [180, '3:00']])}</select></label>
      <label class="etroit">Repos<select data-ob-champ="repos" ${verrou}>${choix(cfg.repos, [[30, '0:30'], [60, '1:00'], [90, '1:30']])}</select></label>
      <label>Points<select data-ob-champ="bareme">${choix(cfg.bareme, [['arme', 'selon l’arme (poing / pied)'], ['touche', 'une touche = mêmes points']])}</select></label>
    </div>
    <div class="ligne reglage-outil">
      <label class="etroit">${cfg.bareme === 'touche' ? 'Touche' : 'Poing'}<input type="number" min="0" max="10" step="1" data-ob-pts="poing" value="${cfg.pts.poing}"></label>
      ${cfg.bareme === 'arme' ? `<label class="etroit">Pied<input type="number" min="0" max="10" step="1" data-ob-pts="pied" value="${cfg.pts.pied}"></label>` : ''}
      <label class="case"><input type="checkbox" data-ob-champ="bonifiee" ${cfg.bonifiee ? 'checked' : ''}> Touche bonifiée</label>
      ${cfg.bonifiee ? `<label class="etroit">Bonus<input type="number" min="0" max="10" step="1" data-ob-pts="bonus" value="${cfg.pts.bonus}"></label>` : ''}
      <label class="etroit">Avertissement −<input type="number" min="0" max="10" step="1" data-ob-pts="avert" value="${cfg.pts.avert}"></label>
    </div>
    <p class="aide">Touche valable : arme autorisée (devant du poing, pied) sur cible autorisée, avec contrôle de la puissance.
      Touche bonifiée : toucher sans être touché (ex. Nancy-Metz). Les barèmes varient selon les académies : règle-les comme ta fiche d’évaluation.</p>
  </details>
  ${htmlPresents(c)}`;
  html += as ? htmlAssautBoxe(c, cfg, as) : htmlPreparerBoxe(c, cfg);
  return html + htmlBilanBoxe(c, cfg);
}

function htmlPreparerBoxe(c, cfg) {
  const els = presentsOutil(c), ch = cfg.choix;
  const sel = (role, nom) => `<label>${nom}<select data-ob-choix="${role}"><option value="">—</option>${els.map(el => `<option value="${el.id}" ${ch[role] === el.id ? 'selected' : ''}>${esc(nomEleveOutil(el))}</option>`).join('')}</select></label>`;
  return `<div class="carte preparer-boxe">
    <div class="ligne reglage-outil">${sel('a', '🔴 Tireur rouge')}${sel('b', '🔵 Tireur bleu')}${sel('arbitre', 'Arbitre')}${sel('juge', 'Juge')}</div>
    <div class="boutons-outil">
      <button data-ob="proposer" title="Deux tireurs qui ont fait le moins d’assauts (et pas encore l’un contre l’autre) ; arbitre et juge parmi ceux qui l’ont le moins été">🎲 Proposer le prochain assaut</button>
      <button class="primaire gros" data-ob="commencer" ${ch.a && ch.b ? '' : 'disabled'}>🥊 Commencer l’assaut</button>
    </div>
  </div>`;
}

function htmlAssautBoxe(c, cfg, as) {
  const r = resultatAssaut(cfg, as), rep = as.scores[as.reprise];
  const enMarche = as.phase === 'combat' && as.debut;
  const phase = { pret: `Reprise ${as.reprise + 1} / ${cfg.reprises} — prêt`, combat: `Reprise ${as.reprise + 1} / ${cfg.reprises}${as.debut ? '' : ' — arrêt (Stop)'}`,
    repos: `Repos avant la reprise ${as.reprise + 2}`, fini: 'Assaut terminé' }[as.phase];
  const coin = k => {
    const s = sommeBoxe(as.scores, k), id = as[k], fini = as.phase === 'fini';
    return `<div class="coin-boxe coin-${k}${fini && r.gagnant === k ? ' gagnant' : ''}">
      <div class="tete-coin"><b>${k === 'a' ? '🔴' : '🔵'} ${esc(nomOutil(id))}</b><span class="score-coin">${fmt(k === 'a' ? r.A : r.B)}</span></div>
      <div class="aide">${s.poing} poing · ${s.pied} pied${cfg.bonifiee ? ` · ${s.bonus} bonifiée${s.bonus > 1 ? 's' : ''}` : ''}${s.avert ? ` · ⚠ ${s.avert}` : ''}
        ${cfg.reprises > 1 ? `<br>Cette reprise : ${totalCoin(cfg, rep[k])} pt` : ''}</div>
      ${fini ? (r.gagnant === k ? '<div class="victoire-boxe">🏆 Vainqueur</div>' : r.gagnant ? '' : '<div class="victoire-boxe">Égalité</div>') : `
      <div class="touches-boxe">
        <button class="touche-boxe" data-ob="touche" data-arg="${k}|poing">👊 Poing <small>+${cfg.pts.poing}</small></button>
        <button class="touche-boxe" data-ob="touche" data-arg="${k}|pied">🦶 Pied <small>+${cfg.bareme === 'touche' ? cfg.pts.poing : cfg.pts.pied}</small></button>
        ${cfg.bonifiee ? `<button class="touche-boxe bonus" data-ob="touche" data-arg="${k}|bonus">⭐ Bonifiée <small>+${cfg.pts.bonus}</small></button>` : ''}
        <button class="touche-boxe avert" data-ob="touche" data-arg="${k}|avert">⚠ Avertissement <small>−${cfg.pts.avert}</small></button>
      </div>`}
    </div>`;
  };
  return `<div class="carte assaut-boxe">
    <div class="barre-outil">
      <b class="phase-boxe phase-${as.phase}">${phase}</b>
      <span class="grand-temps moyen" data-o-bloc="boxe" data-arg="${c.id}">${BLOCS_DIRECTS.boxe(c.id)}</span>
      ${as.phase === 'pret' ? '<button class="primaire gros" data-ob="boxez">▶ Boxez !</button>' : ''}
      ${as.phase === 'combat' ? `<button class="primaire gros" data-ob="stop">${enMarche ? '✋ Stop' : '▶ Boxez !'}</button>` : ''}
      ${as.phase === 'repos' ? '<button data-ob="fin-repos">Passer le repos ▶</button>' : ''}
      <button data-ob="annuler" ${as.pile.length && as.phase !== 'fini' ? '' : 'disabled'}>↶ Annuler la dernière touche</button>
      ${as.phase === 'fini' ? '<button class="primaire" data-ob="nouvel">Assaut suivant ▶</button>' : '<button class="danger" data-ob="abandon">✕ Arrêter l’assaut</button>'}
    </div>
    <p class="aide">Arbitre : <b>${esc(as.arbitre ? nomOutil(as.arbitre) : '—')}</b> · Juge : <b>${esc(as.juge ? nomOutil(as.juge) : '—')}</b>
      ${as.phase !== 'fini' ? ' · Le juge touche le bouton de la touche marquée, pour le bon tireur.' : ''}</p>
    <div class="coins-boxe">${coin('a')}${coin('b')}</div>
  </div>`;
}

function htmlBilanBoxe(c, cfg) {
  const h = cfg.historique.filter(x => Donnees.get('eleves', x.a) && Donnees.get('eleves', x.b));
  if (!h.length) return '';
  const st = statsBoxe(cfg);
  const ids = elevesDe(c.id).map(el => el.id).filter(id => st[id]);
  return `<h3>Assauts du jour et bilan</h3>
    <div class="carte defile-combine"><table class="tableau-outil tableau-boxe">
      <thead><tr><th>Élève</th><th>Assauts</th><th>V / N / D</th><th>Points marqués</th><th>Points encaissés</th><th>Touches poing</th><th>Touches pied</th>${cfg.bonifiee ? '<th>Bonifiées</th>' : ''}<th>Avert.</th><th>Arbitre / juge</th></tr></thead>
      <tbody>${ids.map(id => { const s = st[id]; return `<tr><td>${esc(nomOutil(id))}</td><td>${s.assauts}</td><td>${s.v} / ${s.n} / ${s.d}</td>
        <td><b>${fmt(s.pour)}</b></td><td>${fmt(s.contre)}</td><td>${s.poing}</td><td>${s.pied}</td>${cfg.bonifiee ? `<td>${s.bonus}</td>` : ''}<td>${s.avert}</td><td>${s.arbitre} / ${s.juge}</td></tr>`; }).join('')}</tbody>
    </table></div>
    <details class="historique-boxe"><summary>Liste des assauts (${h.length})</summary><ol>${h.map((x, i) => `<li>${dateCourte(x.date)} · 🔴 ${esc(nomOutil(x.a))} <b>${fmt(x.A)}</b> – <b>${fmt(x.B)}</b> ${esc(nomOutil(x.b))} 🔵
      ${x.gagnant ? `<span class="aide">· vainqueur : ${esc(nomOutil(x[x.gagnant]))}</span>` : '<span class="aide">· égalité</span>'}
      ${enModeEleve() ? '' : `<button class="icone-petit" data-ob="suppr" data-arg="${i}" aria-label="Supprimer cet assaut">🗑</button>`}</li>`).join('')}</ol></details>`;
}

// Bilan par élève sur tous les assauts enregistrés.
function statsBoxe(cfg) {
  const st = {};
  const de = id => (st[id] ??= { assauts: 0, v: 0, n: 0, d: 0, pour: 0, contre: 0, poing: 0, pied: 0, bonus: 0, avert: 0, arbitre: 0, juge: 0 });
  for (const x of cfg.historique) {
    for (const [k, autre] of [['a', 'b'], ['b', 'a']]) {
      if (!x[k]) continue;
      const s = de(x[k]), t = sommeBoxe(x.scores, k);
      s.assauts++;
      if (x.gagnant === k) s.v++; else if (!x.gagnant) s.n++; else s.d++;
      s.pour += x[k === 'a' ? 'A' : 'B']; s.contre += x[autre === 'a' ? 'A' : 'B'];
      s.poing += t.poing; s.pied += t.pied; s.bonus += t.bonus; s.avert += t.avert;
    }
    if (x.arbitre) de(x.arbitre).arbitre++;
    if (x.juge) de(x.juge).juge++;
  }
  return st;
}

BLOCS_DIRECTS.boxe = classeId => {
  const cfg = etatOutils.boxe?.[classeId], as = cfg?.assaut;
  if (!as) return '';
  return fmtRebours(resteBoxe(cfg, as));
};
RENDUS_OUTILS.boxe = htmlBoxe;
let reglagesBoxeOuverts = false;
document.addEventListener('toggle', e => { if (e.target.matches?.('[data-ob-reglages]')) reglagesBoxeOuverts = e.target.open; }, true);

/* ---------- Actions ---------- */

function proposerAssaut(c, cfg) {
  const els = melange(presentsOutil(c)).map(el => el.id);
  if (els.length < 2) throw new Error('Il faut au moins deux élèves présents.');
  const st = statsBoxe(cfg), n = id => st[id]?.assauts || 0;
  const deja = (x, y) => cfg.historique.some(h => (h.a === x && h.b === y) || (h.a === y && h.b === x));
  const tri = [...els].sort((x, y) => n(x) - n(y));
  // Les deux qui ont le moins combattu, sans revoir le même adversaire si possible.
  let a = tri[0], b = tri.slice(1).find(y => !deja(a, y)) || tri[1];
  const reste = els.filter(id => id !== a && id !== b);
  const roles = id => (st[id]?.arbitre || 0) + (st[id]?.juge || 0);
  const parRole = [...reste].sort((x, y) => roles(x) - roles(y));
  cfg.choix = { a, b, arbitre: parRole[0] || '', juge: parRole[1] || '' };
}

function actionBoxe(action, arg, c) {
  const cfg = cfgBoxe(c), as = cfg.assaut;
  switch (action) {
    case 'proposer': proposerAssaut(c, cfg); return rendreOutil();
    case 'commencer': {
      const ch = cfg.choix;
      if (!ch.a || !ch.b || ch.a === ch.b) return toast('Choisis deux tireurs différents.', 'erreur');
      if ([ch.arbitre, ch.juge].some(x => x && [ch.a, ch.b].includes(x))) return toast('Un tireur ne peut pas être aussi arbitre ou juge.', 'erreur');
      cfg.assaut = { a: ch.a, b: ch.b, arbitre: ch.arbitre, juge: ch.juge, reprise: 0, phase: 'pret', debut: null, cumul: 0, scores: [{ a: viergeBoxe(), b: viergeBoxe() }], pile: [] };
      return rendreOutil();
    }
    case 'boxez': as.phase = 'combat'; as.debut = Date.now(); son(990, 0.4); return rendreOutil();
    case 'stop': basculer(as); bipToucher(); return rendreOutil();
    case 'fin-repos': as.phase = 'pret'; as.reprise++; as.cumul = 0; as.scores.push({ a: viergeBoxe(), b: viergeBoxe() }); return rendreOutil();
    case 'touche': {
      if (!as || as.phase === 'fini') return;
      const [k, type] = arg.split('|');
      // (Pendant le repos, une touche compte encore pour la reprise qui vient de finir.)
      as.scores[as.reprise][k][type]++;
      as.pile.push([as.reprise, k, type]);
      bipToucher();
      return rendreOutil();
    }
    case 'annuler': {
      const d = as?.pile.pop();
      if (d) as.scores[d[0]][d[1]][d[2]] = Math.max(0, as.scores[d[0]][d[1]][d[2]] - 1);
      return rendreOutil();
    }
    case 'abandon':
      return lancer(async () => {
        const garder = as.scores.some(r => Object.values(r.a).some(Boolean) || Object.values(r.b).some(Boolean));
        if (!(await confirmer(garder ? 'Arrêter l’assaut maintenant ? Le score actuel est enregistré.' : 'Arrêter l’assaut ?', 'Arrêter'))) return;
        if (garder) enregistrerAssaut(cfg, as);
        cfg.assaut = null;
        rendreOutil();
      });
    case 'nouvel': {
      cfg.assaut = null;
      proposerAssaut(c, cfg);
      return rendreOutil();
    }
    case 'suppr':
      if (enModeEleve()) return;
      return lancer(async () => {
        if (!(await confirmer('Supprimer cet assaut du bilan ?', 'Supprimer'))) return;
        cfg.historique.splice(+arg, 1);
        rendreOutil();
      });
  }
}

document.addEventListener('click', e => {
  const b = e.target.closest('#vue [data-ob]');
  if (!b || b.disabled) return;
  const c = classeActive();
  if (c) lancer(() => actionBoxe(b.dataset.ob, b.dataset.arg, c));
});

document.addEventListener('change', e => {
  const t = e.target;
  if (!t.closest?.('#vue .outil-boxe')) return;
  const c = classeActive();
  if (!c) return;
  const cfg = cfgBoxe(c);
  if (t.dataset.obChamp) { const k = t.dataset.obChamp; cfg[k] = t.type === 'checkbox' ? t.checked : k === 'bareme' ? t.value : +t.value; return rendreOutil(); }
  if (t.dataset.obPts) { cfg.pts[t.dataset.obPts] = Math.max(0, Math.min(10, Math.round(nombreOutil(t.value) ?? 0))); return rendreOutil(); }
  if (t.dataset.obChoix) { cfg.choix[t.dataset.obChoix] = t.value; return rendreOutil(); }
});

/* ---------- 📤 Vers une leçon : bilan de chaque élève (mêmes noms que le modèle de leçon « Boxe française ») ---------- */

TRANSFERTS.boxe = c => {
  const cfg = cfgBoxe(c), st = statsBoxe(cfg);
  const ids = Object.keys(st).filter(id => Donnees.get('eleves', id));
  if (!ids.length) throw new Error('Aucun assaut enregistré.');
  const col = (nom, f, filtre = () => true) => ({ nom, type: 'nombre', valeurs: Object.fromEntries(ids.filter(filtre).map(id => [id, String(f(st[id]))])) });
  const tireurs = id => st[id].assauts > 0;
  return { titre: 'Boxe française — assauts', apsa: 'Boxe française', colonnes: [
    col('Combats gagnés', s => s.v, tireurs), col('Combats disputés', s => s.assauts, tireurs),
    col('Points marqués', s => s.pour, tireurs), col('Points encaissés', s => s.contre, tireurs),
    col('Touches poing', s => s.poing, tireurs), col('Touches pied', s => s.pied, tireurs),
    ...(cfg.bonifiee ? [col('Touches bonifiées', s => s.bonus, tireurs)] : []),
    col('Avertissements', s => s.avert, tireurs),
    col('Arbitrages', s => s.arbitre, id => st[id].arbitre > 0), col('Jugements', s => s.juge, id => st[id].juge > 0),
  ].filter(x => Object.keys(x.valeurs).length) };
};
