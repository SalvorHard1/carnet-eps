'use strict';
// Fiche élève de l'onglet Notes (toucher le nom d'un élève dans la grille des notes), sur le modèle de celle des Leçons :
// moyenne et comparaison avec la classe, évolution des notes (graphique), compétences validées (degré 3 ou 4 au dernier
// relevé), détail des notes, assiduité aux évaluations, priorités, observations du prof (enregistrées dans le carnet)
// et rappel des observations notées dans les fiches Leçons. Tout est calculé par l'appli à partir du carnet.
// (Fichier chargé avant app.js : il n'utilise les outils d'app.js qu'au moment des appels.)

const ID_BILAN_NOTES = 'bilan des notes'; // (clé des observations générales dans la collection `suivis`)
const sur20 = (e, v) => { const n = nombre(v); return n === null || !e.max ? null : (n / e.max) * 20; };
const fmt1 = n => (n === null || n === undefined ? '–' : fmt(Math.round(n * 10) / 10));

// Évolution des notes sur 20 : petit graphique (l'élève en trait plein, la moyenne de la classe en pointillés).
function graphiqueNotes(points) {
  const L = 520, H = 170, g = 30, d = 10, h = 12, b = 26;
  const x = k => g + (points.length > 1 ? (k * (L - g - d)) / (points.length - 1) : (L - g - d) / 2);
  const y = v => h + ((20 - v) * (H - h - b)) / 20;
  const ligne = cle => points.map((p, k) => (p[cle] === null ? null : `${x(k).toFixed(1)},${y(p[cle]).toFixed(1)}`)).filter(Boolean).join(' ');
  return `<svg class="graphique-notes" viewBox="0 0 ${L} ${H}" role="img" aria-label="Évolution des notes sur 20">
    ${[0, 5, 10, 15, 20].map(v => `<line class="grille-graph${v === 10 ? ' moitie' : ''}" x1="${g}" x2="${L - d}" y1="${y(v)}" y2="${y(v)}"/>
      <text class="axe-graph" x="${g - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join('')}
    <polyline class="courbe-classe" points="${ligne('classe')}"/>
    <polyline class="courbe-eleve" points="${ligne('eleve')}"/>
    ${points.map((p, k) => (p.eleve === null ? '' : `<circle class="point-eleve" cx="${x(k)}" cy="${y(p.eleve)}" r="4"><title>${esc(`${p.titre} (${dateCourte(p.date)}) : ${fmt1(p.eleve)}/20 — classe ${fmt1(p.classe)}`)}</title></circle>`)).join('')}
    ${points.map((p, k) => `<text class="axe-graph" x="${x(k)}" y="${H - 8}" text-anchor="middle">${esc(dateCourte(p.date))}</text>`).join('')}
  </svg>`;
}

// Tendance sur une suite de notes /20 : pente de la droite de régression × (nombre d'évaluations − 1).
function tendanceNotes(valeurs) {
  if (valeurs.length < 2) return null;
  const n = valeurs.length, mx = (n - 1) / 2, my = valeurs.reduce((a, v) => a + v, 0) / n;
  const pente = valeurs.reduce((a, v, k) => a + (k - mx) * (v - my), 0) / valeurs.reduce((a, _, k) => a + (k - mx) ** 2, 0);
  return pente * (n - 1);
}

/* ---------- Lien avec les leçons : présence, blessures, maladies ----------
   Une leçon compte « blessé / malade » si le statut est posé sur toute la leçon, ou sur une case seulement
   (ex. blessée après sa première course). Les évaluations notées B / M s'y ajoutent. */

const SANTE = ['BLE', 'MAL'];
function bilanLecons(el, periode) {
  const seances = seancesDe(el.classeId).filter(s => periode === 'annee' || periodeDe(s.date) === periode);
  const statuts = {}, enCours = {}, jours = [], parApsa = new Map();
  let presences = 0;
  for (const s of seances) {
    const a = apsaDe(s);
    if (!parApsa.has(a)) parApsa.set(a, { total: 0, presences: 0, statuts: {} });
    const pa = parApsa.get(a);
    pa.total++;
    const st = statutEnt(s.id, el.id);
    if (st) {
      statuts[st] = (statuts[st] || 0) + 1;
      pa.statuts[st] = (pa.statuts[st] || 0) + 1;
      if (SANTE.includes(st)) jours.push({ date: s.date, code: st, quoi: s.titre });
      continue;
    }
    presences++; pa.presences++;
    // Statut posé sur une case seulement : présent, mais arrêté en cours de leçon.
    const cases = new Set((s.indicateurs || []).map(ind => statutCase(Donnees.note(s.id, el.id, ind.id) || '')).filter(Boolean));
    for (const c of cases) {
      enCours[c] = (enCours[c] || 0) + 1;
      if (SANTE.includes(c)) jours.push({ date: s.date, code: c, quoi: s.titre + ' (en cours de leçon)' });
    }
  }
  const sante = SANTE.reduce((n, c) => n + (statuts[c] || 0) + (enCours[c] || 0), 0);
  return { total: seances.length, presences, statuts, enCours, sante, jours: jours.sort((x, y) => (x.date || '').localeCompare(y.date || '')), parApsa };
}

function htmlLeconsFiche(el, periode, moy) {
  const b = bilanLecons(el, periode);
  const santeNotes = evalsDe(el.classeId).filter(e => (periode === 'annee' || periodeDe(e.date) === periode) && SANTE.includes(Donnees.note(e.id, el.id)))
    .map(e => ({ date: e.date, code: Donnees.note(e.id, el.id), quoi: e.titre + ' (évaluation)' }));
  if (!b.total && !santeNotes.length) return '';
  const nomStatut = c => (CODES[c] || STATUTS_ENT[c] || c).toLowerCase();
  const liste = o => Object.entries(o).map(([c, n]) => `${n} ${nomStatut(c)}`).join(' · ');
  let html = `<h3>${esc(mot('lecons'))} <span class="aide">présence et santé</span></h3>`;
  if (b.total) {
    const lecon = motMin('lecon');
    html += `<p class="fiche-presence">Présent à <b>${b.presences} ${lecon}${b.presences > 1 ? 's' : ''} sur ${b.total}</b>${
      Object.keys(b.statuts).length ? ' · ' + esc(liste(b.statuts)) : ''}${
      Object.keys(b.enCours).length ? ` · arrêté en cours de ${lecon} : ${esc(liste(b.enCours))}` : ''}</p>`;
  }
  // Alerte : souvent blessé ou malade (leçons et évaluations), surtout quand les notes, elles, sont bonnes.
  // (Sans code « Blessé » dans la discipline, comme en SVT : « souvent malade ».)
  const nSante = b.sante + santeNotes.length, base = b.total + santeNotes.length;
  if (nSante >= 2 && nSante / Math.max(1, base) >= 0.2) {
    const bonnes = moy !== null && moy >= seuilsClasse(Donnees.get('classes', el.classeId))[1];
    const accord = el.sexe === 'F' ? 'e' : el.sexe === 'G' ? '' : '·e';
    html += `<div class="alerte-sante">⚠ <b>${esc(el.prenom)} est souvent ${codeDeLaDiscipline('BLE') ? `blessé${accord} ou ` : ''}malade</b> :
      ${nSante} fois sur la période (${b.sante ? `${b.sante} ${motMin('lecon')}${b.sante > 1 ? 's' : ''}` : ''}${b.sante && santeNotes.length ? ', ' : ''}${
      santeNotes.length ? `${santeNotes.length} évaluation${santeNotes.length > 1 ? 's' : ''}` : ''}).
      ${bonnes ? `Les notes sont bonnes (${fmt1(moy)}/20), mais elles ne montrent pas ${esc(mot('tempsManque'))}.` : ''}
      Si cela se répète, cela peut valoir la peine d’en parler (famille, infirmerie, professeur principal).</div>`;
  }
  const jours = [...b.jours, ...santeNotes].sort((x, y) => (x.date || '').localeCompare(y.date || ''));
  if (jours.length) {
    html += `<ul class="liste-fiche">${jours.map(j => `<li><span class="code-fiche code-${j.code}">${esc(CODES[j.code])}</span>
      <span class="aide">${dateCourte(j.date)}</span> · ${esc(j.quoi)}</li>`).join('')}</ul>`;
  }
  if (b.parApsa.size > 1) {
    html += `<table class="tableau-fiche"><tbody>${[...b.parApsa].map(([a, x]) => `<tr><th>${esc(a)}</th>
      <td>présent ${x.presences}/${x.total}${Object.keys(x.statuts).length ? ` <span class="aide">· ${esc(liste(x.statuts))}</span>` : ''}</td></tr>`).join('')}</tbody></table>`;
  }
  return html;
}

/* ---------- Fiche bilan : synthèse en 4 axes (sur 4), points d'appui, axes de progression, appréciation ciblée ----------
   Attitude : niveau « attitude » de l'analyse des appréciations (engagement, présence, observations).
   Vie scolaire : absences, oublis de tenue, retards de la période (4 = rien à signaler ; blessures et maladies non comptées).
   Compétences : degré moyen des derniers degrés relevés (évaluations et critères de leçon).
   Niveau : moyenne de la période ramenée de 0–20 à 1–4. */

function vieScolaire(el, periode) {
  const seances = seancesPeriode(el.classeId, periode), evals = evalsPeriode(el.classeId, periode);
  let abs = 0, tenue = 0, retards = 0;
  for (const s of seances) {
    const st = statutEnt(s.id, el.id);
    if (st === 'ABS') abs++;
    if (st === 'TEN' || (s.indicateurs || []).some(ind => statutCase(Donnees.note(s.id, el.id, ind.id) || '') === 'TEN')) tenue++;
    if (Donnees.note(s.id, el.id, 'presence') === 'Retard') retards++;
  }
  abs += evals.filter(e => Donnees.note(e.id, el.id) === 'ABS').length;
  const n = abs + tenue + retards * 0.5, total = seances.length + evals.length;
  return { abs, tenue, retards, total, val: total ? Math.max(1, 4 - n * 0.6) : null };
}

function syntheseEleve(el, periode, eleves) {
  const a = analyserAppr(el, periode, eleves), vs = vieScolaire(el, periode), moy = a.details.moyenne;
  const comps = new Map();
  for (const e of evalsPeriode(el.classeId, periode)) for (const at of competencesEval(e)) {
    const v = Donnees.note(e.id, el.id, at.id);
    if (!v) continue;
    if (!comps.has(at.id)) comps.set(at.id, { a: at, valeurs: [] });
    comps.get(at.id).valeurs.push(+v);
  }
  return {
    a, vs, moy, comps: [...comps.values()],
    valeurs: {
      attitude: a.defaut.attitude ? null : a.niveaux.attitude ?? null,
      vie: vs.val,
      competences: a.details.degreMoyen ?? null,
      niveau: moy === null || moy === undefined ? null : 1 + (moy / 20) * 3,
    },
  };
}

const AXES_SYNTHESE = [['attitude', 'Attitude'], ['vie', 'Vie scolaire'], ['competences', 'Compétences'], ['niveau', 'Niveau (notes)']];

// Graphique en toile : 4 axes (haut, droite, bas, gauche), échelle 0 à 4 ; élève en plein, classe en pointillés.
function radarSynthese(valeurs, classe) {
  const T = 300, c = T / 2, R = 104;
  const pt = (k, v) => { const ang = -Math.PI / 2 + (k * Math.PI) / 2, r = (Math.max(0, Math.min(4, v ?? 0)) / 4) * R; return [c + r * Math.cos(ang), c + r * Math.sin(ang)]; };
  const poly = vals => AXES_SYNTHESE.map(([k], i) => pt(i, vals[k]).map(x => x.toFixed(1)).join(',')).join(' ');
  const anneaux = [1, 2, 3, 4].map(n => `<polygon points="${AXES_SYNTHESE.map((_, i) => pt(i, n).join(',')).join(' ')}" fill="none" stroke="#8a95a1" stroke-opacity="${n === 4 ? 0.6 : 0.3}" stroke-width="1"/>`).join('');
  const rayons = AXES_SYNTHESE.map((_, i) => { const [x, y] = pt(i, 4); return `<line x1="${c}" y1="${c}" x2="${x}" y2="${y}" stroke="#8a95a1" stroke-opacity="0.35"/>`; }).join('');
  const etiq = AXES_SYNTHESE.map(([k, nom], i) => {
    const [x, y] = pt(i, 4.55), ancre = i === 1 ? 'start' : i === 3 ? 'end' : 'middle';
    return `<text x="${x}" y="${y + (i === 0 ? -2 : i === 2 ? 12 : 4)}" text-anchor="${ancre}" font-size="12" font-weight="700" fill="currentColor">${esc(nom)}</text>`;
  }).join('');
  const points = AXES_SYNTHESE.map(([k], i) => (valeurs[k] === null ? '' : `<circle cx="${pt(i, valeurs[k])[0]}" cy="${pt(i, valeurs[k])[1]}" r="4" fill="#1f9d7a"/>`)).join('');
  return `<svg class="radar-fiche" viewBox="-40 -6 ${T + 80} ${T + 12}" role="img" aria-label="Synthèse de l’élève comparée à la classe">
    ${anneaux}${rayons}
    <polygon points="${poly(classe)}" fill="none" stroke="#8a95a1" stroke-width="2" stroke-dasharray="6 4"/>
    <polygon points="${poly(valeurs)}" fill="#1f9d7a" fill-opacity="0.28" stroke="#1f9d7a" stroke-width="2.5"/>
    ${points}${etiq}</svg>`;
}

// Textes de la fiche bilan en EPS, [intitulé, phrase] ({e} : accord au féminin) ; une autre discipline les remplace
// dans son profil (discipline.js, appreciations.fiche).
const FICHE_EPS = {
  niveauFort: ['Bon niveau de pratique', 'montre de bonnes capacités motrices'],
  niveauFaible: ['Niveau de pratique fragile', 'gagner en efficacité motrice'],
  methodo: ['Rôles et méthode', 's’impliquer davantage dans les rôles (arbitre, juge, observateur)'],
  assiduite: ['Assiduité et tenue', 'est assidu{e} et toujours en tenue'],
};

// Points d'appui (ce que l'élève sait faire) et axes de progression (2 au plus), à partir de la synthèse.
// cat : rubrique de l'appréciation qui peut en parler (notes, competences, niveau, attendus, comportement, attitude, vie).
function pointsEtAxes(el, s) {
  const a = s.a, n = a.niveaux, d = a.details, e = el.sexe === 'F' ? 'e' : el.sexe === 'G' ? '' : '·e';
  const seuils = seuilsClasse(Donnees.get('classes', el.classeId));
  // Attendu cité en entier s'il est court, sinon sa première partie (« Gérer son effort, faire des choix… » → « Gérer son effort »).
  const court = t => {
    const net = t.replace(/\s*\(.*?\)\s*/g, ' ').replace(/\.$/, '').trim();
    if (net.length <= 55) return net;
    const debut = net.split(/[,;:]| afin d| pour | en vue d| dans au moins/)[0].trim();
    return debut.length >= 12 ? debut : resumeTexte(net, 55);
  };
  // (Activité ou thème au fil de la phrase : « en badminton », « sur le corps humain et la santé » — voir appreciations.js.)
  const enMin = t => (t ? activiteDansPhrase(t) : '');
  // Textes propres à la discipline (en SVT : connaissances et démarche, pas de motricité ni de tenue).
  const tx = cle => (profil().appreciations?.fiche?.[cle] || FICHE_EPS[cle]).map(x => x.replace(/\{e\}/g, e));
  const forts = [], axes = [];
  // Ce qu'il sait faire
  for (const { a: at, valeurs } of s.comps) {
    const der = valeurs.at(-1);
    if (der >= 3) forts.push({ cat: 'attendus', poids: der + 0.2, texte: `${at.code} ${at.texte}`, phrase: `maîtrise ${der === 4 ? 'très bien' : 'bien'} « ${court(at.texte)} »` });
  }
  if (s.valeurs.competences >= 2.75) forts.push({ cat: 'competences', poids: s.valeurs.competences, texte: `Compétences : degré moyen ${fmt1(s.valeurs.competences)}`, phrase: 'maîtrise les compétences travaillées' });
  if (s.moy !== null && s.moy !== undefined && s.moy >= seuils[1]) forts.push({ cat: 'notes', poids: 3 + (s.moy - seuils[1]) / 5, texte: `Moyenne ${fmt1(s.moy)}/20`, phrase: `obtient de bons résultats (${fmt1(s.moy)}/20)${d.apsaForte && enMin(d.apsaForte) ? ', notamment' + enMin(d.apsaForte) : ''}` });
  if (n.moteur >= 3) forts.push({ cat: 'niveau', poids: n.moteur, texte: tx('niveauFort')[0], phrase: `${tx('niveauFort')[1]}${d.apsaForte && enMin(d.apsaForte) ? ', en particulier' + enMin(d.apsaForte) : d.apsaSeule ? enMin(d.apsaSeule) : ''}` });
  if (!a.defaut.attitude && n.attitude >= 3) forts.push({ cat: 'attitude', poids: n.attitude, texte: 'Engagement', phrase: n.attitude === 4 ? 's’investit pleinement' : 's’investit avec sérieux' });
  if (!a.defaut.comportement && n.comportement >= 3) forts.push({ cat: 'comportement', poids: n.comportement - 0.1, texte: 'Comportement', phrase: 'a un comportement respectueux' });
  if (s.vs.total && s.vs.val === 4) forts.push({ cat: 'vie', poids: 3, texte: tx('assiduite')[0], phrase: tx('assiduite')[1] });
  // Rien d'acquis : on part quand même de ce qui marche le mieux (meilleure activité, compétence la plus avancée).
  if (!forts.length) {
    if (d.apsaForte) forts.push({ cat: 'notes', poids: 0.5, texte: `Meilleurs résultats : ${d.apsaForte}`, phrase: `obtient ses meilleurs résultats${enMin(d.apsaForte)}` });
    const mieux = [...s.comps].sort((x, y) => y.valeurs.at(-1) - x.valeurs.at(-1))[0];
    if (mieux && mieux.valeurs.at(-1) >= 2) forts.push({ cat: 'attendus', poids: 0.4, texte: `${mieux.a.code} ${mieux.a.texte} — degré ${mieux.valeurs.at(-1)}`, phrase: `commence à acquérir « ${court(mieux.a.texte)} »` });
  }
  // Axes de progression
  for (const { a: at, valeurs } of s.comps) {
    const der = valeurs.at(-1);
    if (der < 3) axes.push({ cat: 'attendus', poids: 4 - der + 0.3, texte: `${at.code} ${at.texte} — degré ${der}`, phrase: `consolider « ${court(at.texte)} »` });
  }
  for (const f of (d.faibles || []).filter(x => x.indic)) axes.push({ cat: 'competences', poids: 4 - f.v, texte: `${f.texte} — degré ${f.v} (${mot('lecons').toLocaleLowerCase('fr')})`, phrase: `progresser sur « ${court(f.texte)} »` });
  if (s.valeurs.competences !== null && s.valeurs.competences < 2.75 && !axes.some(x => x.cat === 'attendus')) axes.push({ cat: 'competences', poids: 4 - s.valeurs.competences, texte: `Compétences : degré moyen ${fmt1(s.valeurs.competences)}`, phrase: 'consolider les compétences travaillées' });
  if (!a.defaut.attitude && n.attitude <= 2) axes.push({ cat: 'attitude', poids: 5 - n.attitude, texte: 'Engagement irrégulier', phrase: 's’investir plus régulièrement' });
  if (!a.defaut.comportement && n.comportement <= 2) axes.push({ cat: 'comportement', poids: 5.5 - n.comportement, texte: 'Comportement à améliorer', phrase: 'mieux respecter les consignes et les camarades' });
  if (s.vs.tenue >= 2) axes.push({ cat: 'vie', poids: 2 + s.vs.tenue * 0.6, texte: `${s.vs.tenue} ${oubliTenue(s.vs.tenue)}`, phrase: mot('tenuePhrase') });
  if (s.vs.abs >= 2) axes.push({ cat: 'vie', poids: 2 + s.vs.abs * 0.6, texte: `${s.vs.abs} absences`, phrase: `être plus assidu${e}` });
  if (s.vs.retards >= 2) axes.push({ cat: 'vie', poids: 1.5 + s.vs.retards * 0.4, texte: `${s.vs.retards} retards`, phrase: 'arriver à l’heure en cours' });
  if (s.moy !== null && s.moy !== undefined && s.moy < seuils[0]) axes.push({ cat: 'notes', poids: 3 + (seuils[0] - s.moy) / 4, texte: `Moyenne ${fmt1(s.moy)}/20`, phrase: `remonter son niveau${d.apsaFaible ? enMin(d.apsaFaible) : ''}` });
  else if (n.progression === 1) axes.push({ cat: 'notes', poids: 2.5, texte: 'Résultats en baisse', phrase: 'retrouver de la régularité dans ses résultats' });
  if (n.moteur && n.moteur <= 2) axes.push({ cat: 'niveau', poids: 3.5 - n.moteur, texte: tx('niveauFaible')[0], phrase: tx('niveauFaible')[1] });
  if (n.methodo && n.methodo <= 2) axes.push({ cat: 'competences', poids: 3 - n.methodo, texte: tx('methodo')[0], phrase: tx('methodo')[1] });
  // Deux axes au plus, de préférence de deux natures différentes ; rien à reprendre : viser plus haut.
  const tri = l => [...l].sort((x, y) => y.poids - x.poids);
  const choisis = [];
  for (const x of tri(axes)) { if (choisis.length < 2 && !choisis.some(c => c.cat === x.cat || c.phrase === x.phrase)) choisis.push(x); }
  if (choisis.length < 2) for (const x of tri(axes)) if (choisis.length < 2 && !choisis.includes(x) && !choisis.some(c => c.phrase === x.phrase)) choisis.push(x);
  if (!choisis.length) {
    // Prochain palier : une compétence au degré 3 autre que celle citée comme point d'appui.
    const fortTexte = tri(forts)[0]?.texte;
    const a3 = s.comps.filter(c => c.valeurs.at(-1) === 3 && `${c.a.code} ${c.a.texte}` !== fortTexte).map(c => c.a)[0];
    choisis.push(a3 ? { cat: 'attendus', poids: 0, texte: `${a3.code} ${a3.texte} — degré 3`, phrase: `viser la très bonne maîtrise de « ${court(a3.texte)} »`, haut: true }
      : { cat: forts[0]?.cat || 'notes', poids: 0, texte: 'Viser l’excellence', phrase: 'confirmer ce bon niveau et viser l’excellence', haut: true });
  }
  // tous : tous les axes possibles (l'appréciation y reprend le suivant quand une rubrique est décochée).
  return { forts: tri(forts), axes: choisis, tous: tri(axes) };
}

// Contenu de la fiche bilan. opts : { classe (moyennes de la classe par axe), impression (tout déplié, sans boutons), anonyme }.
function htmlFicheNotes(el, periode, eleves, opts = {}) {
  const toutes = evalsDe(el.classeId), evals = periode === 'annee' ? toutes : toutes.filter(e => periodeDe(e.date) === periode);
  const seances = seancesPeriode(el.classeId, periode);
  if (!evals.length && !seances.length) return `<p class="aide">Aucune évaluation ni ${motMin('lecon')} ${periode === 'annee' ? 'pour cette classe' : 'sur cette période'}.</p>`;
  const s = syntheseEleve(el, periode, eleves), pa = pointsEtAxes(el, s);
  const classe = opts.classe || {};
  const moy = s.moy ?? null;
  const moyennesClasse = eleves.map(x => moyenneEleve(x.id, evals)).filter(m => m !== null);
  const moyClasse = moyennesClasse.length ? moyennesClasse.reduce((a, b) => a + b, 0) / moyennesClasse.length : null;
  const lignes = evals.map(e => {
    const v = Donnees.note(e.id, el.id), n = sur20(e, v), mc = moyenneEval(e, eleves);
    return { e, v, n, classe: mc === null ? null : (mc / e.max) * 20 };
  });
  const notees = lignes.filter(l => l.n !== null);
  const deplie = opts.impression ? ' open' : '';

  // 1. Synthèse : toile (élève / classe) et valeurs
  const valeurAxe = (k, v) => (v === null || v === undefined ? '–' : k === 'niveau' ? `${fmt1(moy)}/20` : `${fmt1(v)}/4`);
  const classeAxe = (k, v) => (v === null || v === undefined ? '' : k === 'niveau' ? `classe ${fmt1(moyClasse)}/20` : `classe ${fmt1(v)}`);
  const signaux = [];
  if (s.vs.abs) signaux.push(`❌ ${s.vs.abs} absence${s.vs.abs > 1 ? 's' : ''}`);
  if (s.vs.tenue) signaux.push(`${mot('iconeTenue')} ${s.vs.tenue} ${oubliTenue(s.vs.tenue)}`);
  if (s.vs.retards) signaux.push(`⏰ ${s.vs.retards} retard${s.vs.retards > 1 ? 's' : ''}`);
  const sante = bilanLecons(el, periode).sante + evals.filter(e => SANTE.includes(Donnees.note(e.id, el.id))).length;
  if (sante) signaux.push(`🩺 ${sante} fois ${codeDeLaDiscipline('BLE') ? 'blessé·e / malade' : 'malade'}`);
  let html = `<div class="synthese-fiche">
    <div class="radar-bloc">${radarSynthese(s.valeurs, classe)}
      <p class="aide legende-graph"><span class="trait-eleve"></span> ${esc(opts.anonyme ? 'élève' : el.prenom)} <span class="trait-classe"></span> moyenne de la classe</p></div>
    <div class="valeurs-synthese">
      ${AXES_SYNTHESE.map(([k, nom]) => `<div class="valeur-axe"><span>${esc(nom)}</span><b>${valeurAxe(k, s.valeurs[k])}</b><small>${classeAxe(k, classe[k])}</small></div>`).join('')}
      ${signaux.length ? `<div class="signaux-fiche"><span class="aide">À signaler :</span> ${signaux.map(x => `<span class="signal-fiche">${x}</span>`).join('')}</div>` : '<p class="aide">Rien à signaler en vie scolaire.</p>'}
    </div>
  </div>`;

  // 2. Appréciation : la même que dans ✍ Appréciations (même texte enregistré, mêmes réglages : rubriques, ton, style,
  // longueur). Ici on peut toucher les rubriques, demander une autre formulation, réécrire, copier.
  if (opts.impression) {
    let texte = appreciationEleve(el, periode, eleves).texte;
    if (opts.anonyme && el.prenom) texte = texte.split(el.prenom).join('L’élève'); // (PDF anonyme : pas de prénom)
    html += `<h3>Appréciation</h3><p class="texte-appr-fiche texte-bilan">${esc(texte)}</p>`;
  } else {
    html += `<h3>Appréciation <span class="aide">la même que dans ✍ Appréciations (onglet Notes) : touche une rubrique pour changer son niveau</span></h3>
      ${htmlCarteAppr(el, periode, eleves, reglageAppr(), htmlReglagesFiche(opts.reglagesOuverts))}`;
  }

  // 3. Dépliables
  html += `<details class="depli-fiche"${deplie}><summary>🧭 Points d’appui et axes de progression</summary>
    <div class="deux-col-fiche"><div><h4>${opts.anonyme ? 'Ce que l’élève' : /^[aeiouyhàâéèêëîïôöûü]/i.test(el.prenom || '') ? `Ce qu’${esc(el.prenom)}` : `Ce que ${esc(el.prenom)}`} sait faire</h4>${pa.forts.length ? `<ul class="liste-fiche">${pa.forts.slice(0, 3).map(x => `<li>${esc(x.texte)}</li>`).join('')}</ul>` : '<p class="aide">Pas encore assez de données.</p>'}</div>
    <div><h4>Axes de progression <span class="aide">(2 au plus)</span></h4><ol class="liste-fiche priorites">${pa.axes.map(x => `<li><b>${esc(x.phrase[0].toUpperCase() + x.phrase.slice(1))}</b><br><span class="aide">${esc(x.texte)}</span></li>`).join('')}</ol></div></div></details>`;
  if (notees.length >= 2) {
    const tendance = tendanceNotes(notees.map(l => l.n));
    const motTendance = tendance === null ? '' : tendance >= 1 ? `<span class="tendance progres">↗ en progrès (+${fmt1(tendance)})</span>`
      : tendance <= -1 ? `<span class="tendance regres">↘ en baisse (${fmt1(tendance)})</span>` : '<span class="tendance">= stable</span>';
    html += `<details class="depli-fiche"${deplie}><summary>📈 Évolution ${motTendance}</summary>${graphiqueNotes(lignes.map(l => ({ eleve: l.n, classe: l.classe, date: l.e.date, titre: l.e.titre })))}
      <p class="aide legende-graph"><span class="trait-eleve"></span> ${esc(opts.anonyme ? 'élève' : el.prenom)} <span class="trait-classe"></span> moyenne de la classe (notes ramenées sur 20)</p></details>`;
  }
  if (s.comps.length) {
    const validees = s.comps.filter(c => c.valeurs.at(-1) >= 3).length;
    html += `<details class="depli-fiche"${deplie}><summary>🎯 Compétences développées <span class="aide">${validees}/${s.comps.length} validées</span></summary>
      <table class="tableau-fiche"><tbody>${s.comps.map(({ a, valeurs }) => {
      const der = valeurs.at(-1), ok = der >= 3;
      const suite = valeurs.map(v => pastilleDegre(String(v))).join('<span class="sep-suite">→</span>');
      const evol = valeurs.length > 1 ? (der > valeurs[0] ? ' <span class="tendance progres">↗</span>' : der < valeurs[0] ? ' <span class="tendance regres">↘</span>' : ' <span class="tendance">=</span>') : '';
      return `<tr><th><b>${esc(a.code)}</b> ${esc(a.texte)}</th><td>${suite}${evol} ${ok ? '<span class="valide-fiche">✔ validée</span>' : ''}</td></tr>`;
    }).join('')}</tbody></table></details>`;
  }
  if (lignes.length) {
    html += `<details class="depli-fiche"${deplie}><summary>📝 Notes <span class="aide">moyenne ${fmt1(moy)}/20 · classe ${fmt1(moyClasse)}</span></summary>
      <table class="tableau-fiche notes-fiche"><tbody>${lignes.map(l => `<tr>
      <th>${l.e.ca ? `<span class="chip-ca ca-${l.e.ca}">${l.e.ca}</span> ` : ''}<b>${esc(l.e.titre)}</b> <span class="aide">${dateCourte(l.e.date)}${l.e.apsa ? ' · ' + esc(l.e.apsa) : ''}${l.e.coef !== 1 ? ' · coef ' + fmt(l.e.coef) : ''}</span></th>
      <td>${CODES[l.v] ? `<span class="code-fiche code-${l.v}">${esc(CODES[l.v])}</span>` : l.v === '' ? '<span class="aide">non saisie</span>'
      : `<b>${esc(affichage(l.v))}</b>/${fmt(l.e.max)}${l.e.max !== 20 ? ` <span class="aide">(${fmt1(l.n)}/20)</span>` : ''}`}
        ${l.n !== null && l.classe !== null ? `<span class="aide"> · classe ${fmt1(l.classe)}/20</span>` : ''}</td></tr>`).join('')}</tbody></table></details>`;
  }
  if (!opts.anonyme) {
    const presence = htmlLeconsFiche(el, periode, moy);
    if (presence) html += `<details class="depli-fiche"${deplie}><summary>🩺 Présence et santé</summary>${presence.replace(/^<h3>.*?<\/h3>/, '')}</details>`;
  }

  // 4. Observations du prof (jamais dans le PDF)
  if (!opts.impression) {
    const suivi = Donnees.get('suivis', idSuivi(el.id, ID_BILAN_NOTES));
    const parApsa = Donnees.liste('suivis', x => x.eleveId === el.id && x.texte && x.apsa !== ID_BILAN_NOTES && !/^appréciation /i.test(x.apsa || ''));
    html += `<details class="depli-fiche"${suivi?.texte || parApsa.length ? ' open' : ''}><summary>✏️ Mes observations <span class="aide">(restent dans le carnet, jamais dans le PDF)</span></summary>
      <textarea class="obs-fiche" data-obs-notes rows="3" placeholder="Bilan, attitude, progrès, objectifs fixés avec l’élève…">${esc(suivi?.texte || '')}</textarea>
      ${suivi?.texte && suivi.maj > 1 ? `<p class="aide">Modifié le ${dateHeure(suivi.maj)}</p>` : ''}
      ${parApsa.length ? `<p class="aide">Notées dans les fiches ${esc(mot('lecons'))} :</p><ul class="liste-fiche">${parApsa.map(x => `<li><b>${esc(x.apsa)}</b> : ${esc(x.texte)}</li>`).join('')}</ul>` : ''}</details>`;
  }
  return html;
}

// ⚙ des réglages des appréciations, au bas de la carte d'appréciation de la fiche (dans la carte, pas en dessous).
const htmlReglagesFiche = ouvert => `<details class="reglages-appr-fiche" data-fiche-reglages-appr ${ouvert ? 'open' : ''}>
  <summary title="Réglages des appréciations (valent pour toutes les appréciations)">⚙ <small>réglages : rubriques, ton, style, longueur</small></summary>
  <div data-appr-reglages>${htmlReglageAppr(reglageAppr())}</div></details>`;

// Moyennes de la classe sur les 4 axes (élèves qui ont une valeur).
function syntheseClasse(eleves, periode) {
  const l = eleves.map(el => syntheseEleve(el, periode, eleves).valeurs), m = {};
  for (const [k] of AXES_SYNTHESE) { const v = l.map(x => x[k]).filter(x => x !== null && x !== undefined); m[k] = v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; }
  return m;
}

// PDF : la fiche toute dépliée dans une page à imprimer (« Enregistrer au format PDF »), anonyme si demandé.
function imprimerFiche(el, periode, eleves, classe, anonyme) {
  const c = Donnees.get('classes', el.classeId), p = periodesAnnee().find(x => x.id === periode);
  let zone = $('#zone-impression');
  if (!zone) { zone = document.createElement('div'); zone.id = 'zone-impression'; document.body.append(zone); }
  zone.innerHTML = `<div class="impression-fiche">
    <h1>Fiche bilan — ${anonyme ? 'élève (anonyme)' : esc(`${el.nom} ${el.prenom}`)}</h1>
    <p>${esc(c?.nom || '')} · ${esc(periode === 'annee' ? 'toute l’année' : `${p?.code || ''} (${p?.texte || ''})`)} · ${esc(profil().nom)} · ${dateCourte(aujourdhui())}</p>
    ${htmlFicheNotes(el, periode, eleves, { classe, impression: true, anonyme })}</div>`;
  document.body.classList.add('impression-bareme');
  const fin = () => { document.body.classList.remove('impression-bareme'); window.removeEventListener('afterprint', fin); };
  window.addEventListener('afterprint', fin);
  window.print();
  setTimeout(fin, 1000);
}

async function ficheNotes(eleveId) {
  const c = classeActive(), eleves = elevesDe(c.id);
  let idx = eleves.findIndex(x => x.id === eleveId);
  if (idx < 0) return;
  let periode = periodeAffichee();
  const aLecons = seancesDe(c.id).length > 0;
  const { d, resultat } = ouvrirModale('Fiche bilan', '<div class="fiche-onglets" data-fiche-onglets></div><div class="fiche" data-fiche></div>',
    '<button type="button" data-fiche-nav="-1">◀ Précédent</button><button type="button" data-fiche-nav="1">Suivant ▶</button>'
    + (aLecons ? `<button type="button" data-fiche-lecons title="Ouvrir sa fiche de l’onglet ${esc(mot('lecons'))}">Fiche ${esc(mot('lecons'))}</button>` : '')
    + '<span class="espace"></span><label class="case anonyme-fiche" title="Sans nom, prénom, photo ni présence / santé"><input type="checkbox" data-fiche-anonyme> anonyme</label>'
    + '<button type="button" data-fiche-pdf title="Imprimer ou enregistrer la fiche en PDF">📄 PDF</button>'
    + '<button type="button" data-fermer class="primaire">Fermer</button>', 'modale-large modale-fiche');

  // Moyennes de la classe (calculées une fois par période).
  const classes = {};
  const moyClasse = () => (classes[periode] ??= syntheseClasse(eleves, periode));
  // Carte d'appréciation : même fonctionnement et même texte enregistré que dans ✍ Appréciations (appreciations.js).
  // ⚙ dans la carte : les réglages des appréciations (les mêmes que dans ✍ Appréciations, pour toute la classe).
  let reglagesOuverts = false;
  const cartes = gererCartesAppr(d, { periode: () => periode, eleves, r: () => reglageAppr(), suite: () => htmlReglagesFiche(reglagesOuverts) });
  const reglagesModifies = () => {
    ecrireReglage('appreciations', lireReglageAppr($('form', d)));
    cartes.enregistrerTexte();
    dessiner(true);
  };
  d.addEventListener('toggle', e => { if (e.target.matches?.('[data-fiche-reglages-appr]')) reglagesOuverts = e.target.open; }, true);
  // (Longueur : refaite pendant la frappe, après une courte pause ; la carte est redessinée, le champ reprend la main.)
  let minuteurReglages = null;
  d.addEventListener('change', e => { if (e.target.closest('[data-appr-reglages]')) { clearTimeout(minuteurReglages); reglagesModifies(); } });
  d.addEventListener('input', e => {
    const t = e.target;
    if (!t.closest('[data-appr-reglages]') || t.type !== 'number') return;
    clearTimeout(minuteurReglages);
    minuteurReglages = setTimeout(() => {
      const nom = t.name, valeur = t.value;
      reglagesModifies();
      const champ = d.querySelector(`[data-appr-reglages] [name="${nom}"]`);
      if (champ) { champ.value = valeur; champ.focus(); }
    }, 500);
  });

  // Observations : enregistrées pendant la frappe (petit délai) et avant de changer d'élève.
  let minuteur = null, enAttente = null;
  const enregistrerObs = () => {
    clearTimeout(minuteur);
    if (!enAttente) return;
    const { eleve, texte } = enAttente;
    enAttente = null;
    const id = idSuivi(eleve, ID_BILAN_NOTES), avant = Donnees.get('suivis', id);
    if ((avant?.texte || '') === texte) return;
    Donnees.ecrire('suivis', { ...(avant || {}), id, eleveId: eleve, apsa: ID_BILAN_NOTES, texte });
  };
  const ouverts = () => [...d.querySelectorAll('.depli-fiche')].map(x => x.open);
  const dessiner = (garderOuverts = false) => {
    const el = eleves[idx], avant = garderOuverts ? ouverts() : null;
    $('h2', d).innerHTML = Trombi.titre(el, `Fiche bilan — ${el.nom} ${el.prenom}`); // (avec sa photo, pour le reconnaître)
    $('[data-fiche-onglets]', d).innerHTML = [['annee', 'Toute l’année'], ...periodesAnnee().map(p => [p.id, p.code])]
      .map(([v, nom]) => `<button type="button" class="${v === periode ? 'actif' : ''}" data-fiche-periode="${v}">${nom}</button>`).join('');
    $('[data-fiche]', d).innerHTML = htmlFicheNotes(el, periode, eleves, { classe: moyClasse(), reglagesOuverts });
    if (avant) d.querySelectorAll('.depli-fiche').forEach((x, k) => { if (k < avant.length) x.open = avant[k]; });
    d.querySelector('[data-fiche-nav="-1"]').disabled = idx === 0;
    d.querySelector('[data-fiche-nav="1"]').disabled = idx === eleves.length - 1;
  };
  d.addEventListener('click', e => {
    const onglet = e.target.closest('[data-fiche-periode]'), nav = e.target.closest('[data-fiche-nav]');
    const ordre = e.target.closest('[data-appr-reglages] [data-appr-monter], [data-appr-reglages] [data-appr-descendre]');
    if (ordre) { deplacerRubriqueAppr(ordre); reglagesModifies(); return; }
    if (onglet) { enregistrerObs(); cartes.enregistrerTexte(); periode = onglet.dataset.fichePeriode; dessiner(); }
    if (nav) { enregistrerObs(); cartes.enregistrerTexte(); idx = Math.max(0, Math.min(eleves.length - 1, idx + +nav.dataset.ficheNav)); dessiner(); }
    if (e.target.closest('[data-fiche-lecons]')) { enregistrerObs(); cartes.enregistrerTexte(); const id = eleves[idx].id; d.fermer(); lancer(() => ficheEleve(id)); }
    if (e.target.closest('[data-fiche-pdf]')) {
      enregistrerObs();
      cartes.enregistrerTexte();
      lancer(() => imprimerFiche(eleves[idx], periode, eleves, moyClasse(), $('[data-fiche-anonyme]', d).checked));
    }
  });
  d.addEventListener('input', e => {
    if (!e.target.matches('[data-obs-notes]')) return;
    enAttente = { eleve: eleves[idx].id, texte: e.target.value.trim() };
    clearTimeout(minuteur);
    minuteur = setTimeout(enregistrerObs, 800);
  });
  dessiner();
  await resultat;
  enregistrerObs();
  cartes.enregistrerTexte();
}

// Toucher le nom d'un élève dans la grille des notes ouvre sa fiche (les badges PAI, BEP, ⚠… gardent leur action).
document.addEventListener('click', e => {
  const th = e.target.closest('.grille:not(.grille-ent) tbody tr:not(.ligne-repartition) .col-nom');
  if (!th || e.target.closest('button') || ui.vue !== 'notes') return;
  const id = th.closest('tr').querySelector('[data-eleve]')?.dataset.eleve;
  if (id) lancer(() => ficheNotes(id));
});
