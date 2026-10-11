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

function htmlFicheNotes(el, periode, eleves) {
  const toutes = evalsDe(el.classeId), evals = periode === 'annee' ? toutes : toutes.filter(e => periodeDe(e.date) === periode);
  if (!evals.length) return `<p class="aide">Aucune évaluation ${periode === 'annee' ? 'pour cette classe' : 'sur cette période'}.</p>`;
  const moy = moyenneEleve(el.id, evals);
  const moyennesClasse = eleves.map(x => moyenneEleve(x.id, evals)).filter(m => m !== null);
  const moyClasse = moyennesClasse.length ? moyennesClasse.reduce((a, b) => a + b, 0) / moyennesClasse.length : null;

  // Notes, évaluation par évaluation
  const lignes = evals.map(e => {
    const v = Donnees.note(e.id, el.id), n = sur20(e, v), mc = moyenneEval(e, eleves);
    return { e, v, n, classe: mc === null ? null : (mc / e.max) * 20 };
  });
  const notees = lignes.filter(l => l.n !== null);
  const statuts = {};
  lignes.forEach(l => { if (CODES[l.v]) statuts[l.v] = (statuts[l.v] || 0) + 1; });

  // Compétences : tous les degrés relevés, compétence par compétence (dans l'ordre des évaluations)
  const comps = new Map();
  for (const e of evals) {
    for (const a of competencesEval(e)) {
      const v = Donnees.note(e.id, el.id, a.id);
      if (!comps.has(a.id)) comps.set(a.id, { a, valeurs: [] });
      if (v) comps.get(a.id).valeurs.push({ v, e });
    }
  }
  const evaluees = [...comps.values()].filter(c => c.valeurs.length);
  const validees = evaluees.filter(c => c.valeurs.at(-1).v >= '3');

  // En-tête : les chiffres clés
  const ecart = moy !== null && moyClasse !== null ? moy - moyClasse : null;
  const tendance = tendanceNotes(notees.map(l => l.n));
  const motTendance = tendance === null ? '' : tendance >= 1 ? `<span class="tendance progres">↗ en progrès (+${fmt1(tendance)})</span>`
    : tendance <= -1 ? `<span class="tendance regres">↘ en baisse (${fmt1(tendance)})</span>` : '<span class="tendance">= stable</span>';
  let html = `<div class="chiffres-fiche">
    <div><span class="aide">Moyenne</span><b>${fmt1(moy)}<small>/20</small></b><span class="aide">classe ${fmt1(moyClasse)}${ecart !== null ? ` · ${ecart >= 0 ? '+' : ''}${fmt1(ecart)}` : ''}</span></div>
    <div><span class="aide">Compétences validées</span><b>${validees.length}<small>/${evaluees.length}</small></b><span class="aide">degré 3 ou 4 au dernier relevé</span></div>
    <div><span class="aide">Évaluations</span><b>${notees.length}<small>/${evals.length}</small></b><span class="aide">${Object.entries(statuts).map(([c, k]) => `${k} ${CODES[c].toLowerCase()}`).join(' · ') || 'toutes notées'}</span></div>
  </div>`;

  // Évolution
  if (notees.length >= 2) {
    html += `<h3>Évolution ${motTendance}</h3>${graphiqueNotes(lignes.map(l => ({ eleve: l.n, classe: l.classe, date: l.e.date, titre: l.e.titre })))}
      <p class="aide legende-graph"><span class="trait-eleve"></span> ${esc(el.prenom)} <span class="trait-classe"></span> moyenne de la classe (notes ramenées sur 20)</p>`;
  }

  // Compétences
  if (evaluees.length) {
    html += `<h3>Compétences</h3><table class="tableau-fiche"><tbody>${evaluees.map(({ a, valeurs }) => {
      const der = valeurs.at(-1).v, ok = der >= '3';
      const suite = valeurs.map(x => `<span class="valeur-suite" title="${esc(`${x.e.titre} (${dateCourte(x.e.date)}) : ${nomNiveau(x.v)}`)}">${pastilleDegre(x.v)}</span>`).join('<span class="sep-suite">→</span>');
      const evol = valeurs.length > 1 ? (der > valeurs[0].v ? ' <span class="tendance progres">↗</span>' : der < valeurs[0].v ? ' <span class="tendance regres">↘</span>' : ' <span class="tendance">=</span>') : '';
      return `<tr><th><b>${esc(a.code)}</b> ${esc(a.texte)}</th><td>${suite}${evol} ${ok ? '<span class="valide-fiche">✔ validée</span>' : ''}</td></tr>`;
    }).join('')}</tbody></table>`;
  }

  // Détail des notes
  html += `<h3>Notes</h3><table class="tableau-fiche notes-fiche"><tbody>${lignes.map(l => `<tr>
    <th>${l.e.ca ? `<span class="chip-ca ca-${l.e.ca}">${l.e.ca}</span> ` : ''}<b>${esc(l.e.titre)}</b> <span class="aide">${dateCourte(l.e.date)}${l.e.apsa ? ' · ' + esc(l.e.apsa) : ''}${l.e.coef !== 1 ? ' · coef ' + fmt(l.e.coef) : ''}</span></th>
    <td>${CODES[l.v] ? `<span class="code-fiche code-${l.v}">${esc(CODES[l.v])}</span>` : l.v === '' ? '<span class="aide">non saisie</span>'
    : `<b>${esc(affichage(l.v))}</b>/${fmt(l.e.max)}${l.e.max !== 20 ? ` <span class="aide">(${fmt1(l.n)}/20)</span>` : ''}`}
      ${l.n !== null && l.classe !== null ? `<span class="aide"> · classe ${fmt1(l.classe)}/20</span>` : ''}</td></tr>`).join('')}</tbody></table>`;

  // Priorités : compétences pas encore validées, en baisse, notes sous la moyenne récentes.
  const priorites = [
    ...evaluees.filter(c => c.valeurs.at(-1).v < '3').map(c => `<b>${esc(c.a.code)}</b> ${esc(c.a.texte)} — degré ${c.valeurs.at(-1).v} → viser 3`),
    ...evaluees.filter(c => c.valeurs.length > 1 && c.valeurs.at(-1).v < c.valeurs.at(-2).v && c.valeurs.at(-1).v >= '3')
      .map(c => `<b>${esc(c.a.code)}</b> — en baisse (${c.valeurs.at(-2).v} → ${c.valeurs.at(-1).v})`),
    ...notees.slice(-2).filter(l => l.n < 10).map(l => `<b>${esc(l.e.titre)}</b> — ${fmt1(l.n)}/20, sous la moyenne`),
  ];
  html += `<h3>À travailler en priorité</h3>${priorites.length ? `<ol class="liste-fiche priorites">${priorites.map(p => `<li>${p}</li>`).join('')}</ol>`
    : `<p class="aide">${evaluees.length || notees.length ? 'Rien sous le degré 3 ni sous la moyenne : consolider, et viser la très bonne maîtrise.' : 'Pas encore de note ni de degré pour cet élève.'}</p>`}`;

  // Observations : générales (modifiables ici) et celles des fiches Leçons, APSA par APSA (pour mémoire)
  const suivi = Donnees.get('suivis', idSuivi(el.id, ID_BILAN_NOTES));
  const parApsa = Donnees.liste('suivis', s => s.eleveId === el.id && s.texte && s.apsa !== ID_BILAN_NOTES && !estSuiviAppr(s));
  html += htmlApprFiche(el, periode, eleves);
  html += `<h3>Mes observations</h3>
    <textarea class="obs-fiche" data-obs-notes rows="4" placeholder="Bilan, attitude, progrès, objectifs fixés avec l’élève…">${esc(suivi?.texte || '')}</textarea>
    ${suivi?.texte ? `<p class="aide">Modifié le ${dateHeure(suivi.maj)}</p>` : ''}
    ${parApsa.length ? `<p class="aide">Notées dans les fiches Leçons :</p><ul class="liste-fiche">${parApsa.map(s => `<li><b>${esc(s.apsa)}</b> : ${esc(s.texte)}</li>`).join('')}</ul>` : ''}`;
  return html;
}

async function ficheNotes(eleveId) {
  const c = classeActive(), eleves = elevesDe(c.id);
  let idx = eleves.findIndex(x => x.id === eleveId);
  if (idx < 0) return;
  let periode = periodeAffichee();
  const aLecons = seancesDe(c.id).length > 0;
  const { d, resultat } = ouvrirModale('Fiche élève', '<div class="fiche-onglets" data-fiche-onglets></div><div class="fiche" data-fiche></div>',
    '<button type="button" data-fiche-nav="-1">◀ Précédent</button><button type="button" data-fiche-nav="1">Suivant ▶</button>'
    + (aLecons ? '<button type="button" data-fiche-lecons title="Ouvrir sa fiche de l’onglet Leçons">Fiche Leçons</button>' : '')
    + '<span class="espace"></span><button type="button" data-fermer class="primaire">Fermer</button>', 'modale-large modale-fiche');

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
  const dessiner = () => {
    const el = eleves[idx];
    $('h2', d).textContent = `${el.nom} ${el.prenom} — ${c.nom}`;
    $('[data-fiche-onglets]', d).innerHTML = [['annee', 'Toute l’année'], ...periodesAnnee().map(p => [p.id, p.code])]
      .map(([v, nom]) => `<button type="button" class="${v === periode ? 'actif' : ''}" data-fiche-periode="${v}">${nom}</button>`).join('');
    $('[data-fiche]', d).innerHTML = htmlFicheNotes(el, periode, eleves);
    d.querySelector('[data-fiche-nav="-1"]').disabled = idx === 0;
    d.querySelector('[data-fiche-nav="1"]').disabled = idx === eleves.length - 1;
  };
  d.addEventListener('click', e => {
    const onglet = e.target.closest('[data-fiche-periode]'), nav = e.target.closest('[data-fiche-nav]');
    if (onglet) { enregistrerObs(); periode = onglet.dataset.fichePeriode; dessiner(); }
    if (nav) { enregistrerObs(); idx = Math.max(0, Math.min(eleves.length - 1, idx + +nav.dataset.ficheNav)); dessiner(); }
    if (e.target.closest('[data-fiche-lecons]')) { enregistrerObs(); const id = eleves[idx].id; d.fermer(); lancer(() => ficheEleve(id)); }
    if (e.target.closest('[data-fiche-appr-copier]')) lancer(() => copierTexte($('.texte-appr-fiche', d).textContent));
    if (e.target.closest('[data-fiche-appr-ajuster]')) {
      enregistrerObs();
      const id = eleves[idx].id, p = periode;
      d.fermer();
      lancer(() => ouvrirAppreciations(p, id));
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
}

// Toucher le nom d'un élève dans la grille des notes ouvre sa fiche (les badges PAI, BEP, ⚠… gardent leur action).
document.addEventListener('click', e => {
  const th = e.target.closest('.grille:not(.grille-ent) tbody tr:not(.ligne-repartition) .col-nom');
  if (!th || e.target.closest('button') || ui.vue !== 'notes') return;
  const id = th.closest('tr').querySelector('[data-eleve]')?.dataset.eleve;
  if (id) lancer(() => ficheNotes(id));
});
