'use strict';
// Bilans de l'onglet Notes, propres au carnet de SVT (profil().bilans ; rien en EPS) :
//   🎯 Compétences  : couverture du référentiel de la classe sur la période — évaluée combien de fois, quand,
//                     où en est la classe (derniers degrés) ; compétences jamais évaluées ; tableau élève × compétence.
//   🧭 Socle        : collège (cycles 3 et 4) — degré par domaine du socle (moyenne des derniers degrés des compétences
//                     du domaine, d'après le tableau du programme) et positionnement sur les objectifs, à reporter dans le LSU.
//   📄 Travail rendu : comptes rendus et devoirs (code NR, colonnes « Travail rendu » des séances) ; alertes ; relances ;
//                     texte pour le conseil de classe.
// Tout est calculé ici, par l'appli, à partir du carnet. (Chargé avant app.js : outils d'app.js utilisés à l'appel.)

const DOMAINES_SOCLE = {
  D1: 'Les langages pour penser et communiquer', D2: 'Les méthodes et outils pour apprendre', D3: 'La formation de la personne et du citoyen',
  D4: 'Les systèmes naturels et les systèmes techniques', D5: 'Les représentations du monde et l’activité humaine',
};
// Positionnement sur les objectifs d'apprentissage de la période (bilan périodique du LSU), d'après le degré 1 à 4.
const POSITIONNEMENTS = ['Objectifs non atteints', 'Objectifs partiellement atteints', 'Objectifs atteints', 'Objectifs dépassés'];

const avecBilansSvt = () => !!profil().bilans;
function htmlBoutonsBilansSvt(c) {
  if (!avecBilansSvt()) return '';
  const ref = REFERENTIEL.refs[referentielDuNiveau(c.niveau)];
  return ` <button data-bilan-svt="competences" title="Compétences évaluées sur la période, et celles qui ne l’ont jamais été">🎯 Compétences</button>`
    + (ref?.socle ? ` <button data-bilan-svt="socle" title="Degré par domaine du socle et positionnement de la période, à reporter dans le LSU">🧭 Socle</button>` : '')
    + ` <button data-bilan-svt="rendu" title="Comptes rendus et devoirs rendus, en retard, non rendus">📄 Travail rendu</button>`;
}

/* ---------- Commun ---------- */

const evalsPeriodeSvt = (c, periode) => evalsDe(c.id).filter(e => periode === 'annee' || periodeDe(e.date) === periode)
  .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
const seancesPeriodeSvt = (c, periode) => seancesDe(c.id).filter(s => periode === 'annee' || periodeDe(s.date) === periode);
const nomPeriodeSvt = p => (p === 'annee' ? 'l’année' : `le ${periodesAnnee().find(x => x.id === p)?.code || p}`);
const selectPeriodeSvt = p => `<label class="choix-tri">Période<select data-bs-periode>
  <option value="annee" ${p === 'annee' ? 'selected' : ''}>Toute l’année</option>
  ${periodesAnnee().map(x => `<option value="${x.id}" ${x.id === p ? 'selected' : ''}>${x.code} (${esc(x.texte)})</option>`).join('')}</select></label>`;
const nomEleveSvt = el => `${el.nom} ${el.prenom}`.trim();
const pastilleDegreSvt = v => (v ? `<span class="niveau n${Math.max(1, Math.min(4, Math.round(v)))}" title="${esc(NIVEAUX_MAITRISE[Math.max(1, Math.min(4, Math.round(v))) - 1]?.nom || '')}">${Number.isInteger(v) ? v : fmt1(v)}</span>` : '<span class="aide">–</span>');

// Derniers degrés de maîtrise de la période : Map compétence → Map élève → degré (la dernière évaluation compte).
function derniersDegres(c, periode) {
  const res = new Map(), evaluee = new Map(); // evaluee : compétence → [évaluations]
  for (const e of evalsPeriodeSvt(c, periode)) {
    for (const a of competencesEval(e).filter(x => !x.id.startsWith('libre:'))) {
      if (!evaluee.has(a.id)) evaluee.set(a.id, []);
      evaluee.get(a.id).push(e);
      if (!res.has(a.id)) res.set(a.id, new Map());
      for (const el of elevesDe(c.id)) {
        const v = +Donnees.note(e.id, el.id, a.id);
        if (v >= 1 && v <= 4) res.get(a.id).set(el.id, v);
      }
    }
  }
  return { degres: res, evaluee };
}

// Fenêtre d'un bilan : la période se change dans la fenêtre (le contenu se redessine).
async function ouvrirBilanSvt(c, quoi, periode = periodeAffichee()) {
  const titres = { competences: '🎯 Compétences', socle: '🧭 Socle commun', rendu: '📄 Travail rendu' };
  const corps = { competences: htmlCouverture, socle: htmlSocle, rendu: htmlTravailRendu }[quoi];
  const { d, resultat } = ouvrirModale(`${titres[quoi]} — ${c.nom}`, `<div data-bs-corps>${corps(c, periode)}</div>`,
    '<button type="button" data-bs="copier">📋 Copier</button><span class="espace"></span><button type="button" data-fermer class="primaire">Fermer</button>', 'modale-large bilan-svt');
  d.addEventListener('change', e => {
    if (!e.target.matches('[data-bs-periode]')) return;
    periode = e.target.value;
    $('[data-bs-corps]', d).innerHTML = corps(c, periode);
  });
  d.addEventListener('click', e => {
    if (e.target.closest('[data-bs="copier"]')) lancer(() => copierTexte({ competences: texteCouverture, socle: texteSocle, rendu: texteTravailRendu }[quoi](c, periode)));
  });
  await resultat;
}

document.addEventListener('click', e => {
  const b = e.target.closest('#vue [data-bilan-svt]');
  const c = b && classeActive();
  if (c) lancer(() => ouvrirBilanSvt(c, b.dataset.bilanSvt));
});

/* ---------- 🎯 Couverture des compétences ---------- */

// Compétences du référentiel de la classe (et des autres référentiels utilisés dans ses évaluations), par groupe.
function competencesClasseSvt(c, evaluee) {
  const refIds = [referentielDuNiveau(c.niveau), ...[...evaluee.keys()].map(id => REFERENTIEL.attendu(id)?.refId)].filter(Boolean);
  return [...new Set(refIds)].map(id => REFERENTIEL.refs[id]).filter(Boolean).map(ref => ({
    ref, groupes: Object.entries(ref.champs).map(([ca, ch]) => ({ ca, titre: ch.titre, attendus: ch.attendus.filter(a => !a.masque || evaluee.has(a.id)) })),
  }));
}

function bilanCouverture(c, periode) {
  const { degres, evaluee } = derniersDegres(c, periode), eleves = elevesDe(c.id);
  const refs = competencesClasseSvt(c, evaluee);
  const ligne = a => {
    const d = [...(degres.get(a.id)?.values() || [])], es = evaluee.get(a.id) || [];
    const rep = [1, 2, 3, 4].map(n => d.filter(v => v === n).length);
    return { a, n: es.length, derniere: es.at(-1)?.date || '', nbEleves: d.length, moy: d.length ? d.reduce((x, y) => x + y, 0) / d.length : null,
      acquis: d.length ? d.filter(v => v >= 3).length / d.length : null, rep };
  };
  const tout = refs.flatMap(r => r.groupes.flatMap(g => g.attendus));
  return { refs, ligne, degres, evaluee, eleves, nbEvaluees: tout.filter(a => evaluee.has(a.id)).length, total: tout.length };
}

function htmlCouverture(c, periode) {
  const b = bilanCouverture(c, periode);
  // Répartition des élèves par degré : une pastille par degré, avec le nombre d'élèves (pas de largeur calculée : CSP).
  const barre = rep => `<span class="repartition-svt" title="${rep.map((n, i) => `degré ${i + 1} : ${n} élève${n > 1 ? 's' : ''}`).join(' · ')}">${rep.map((n, i) => (n ? `<span class="niveau n${i + 1}">${n}</span>` : '')).join('')}</span>`;
  const evaluees = b.refs.flatMap(r => r.groupes.flatMap(g => g.attendus)).filter(a => b.evaluee.has(a.id));
  return `
    <div class="outils">${selectPeriodeSvt(periode)}
      <span class="aide"><b>${b.nbEvaluees}</b> compétence${b.nbEvaluees > 1 ? 's' : ''} évaluée${b.nbEvaluees > 1 ? 's' : ''} sur ${b.total} pour ${nomPeriodeSvt(periode)}</span></div>
    ${b.refs.map(({ ref, groupes }) => `<h3>${esc(ref.nom)}</h3>
      <div class="table-defile"><table class="table-labo couverture-svt"><thead><tr><th>Compétence</th><th>Évaluée</th><th>Dernière fois</th><th>Classe (derniers degrés)</th><th>Degré moyen</th><th>Maîtrisée (3-4)</th></tr></thead>
      <tbody>${groupes.map(g => `<tr class="groupe-svt"><th colspan="6">${esc(g.ca)} — ${esc(g.titre)}${ref.socle?.[g.ca] ? ` <span class="aide">· socle ${ref.socle[g.ca].join(', ')}</span>` : ''}</th></tr>
        ${g.attendus.map(a => { const l = b.ligne(a); return `<tr class="${l.n ? '' : 'jamais'}"><th title="${esc(a.texte)}"><b>${esc(a.code)}</b> ${esc(resumeTexte(a.texte, 90))}</th>
          <td>${l.n ? `${l.n} fois` : '<b>jamais</b>'}</td><td>${l.derniere ? dateCourte(l.derniere) : ''}</td>
          <td>${l.nbEleves ? barre(l.rep) : ''}</td><td>${l.moy === null ? '' : pastilleDegreSvt(Math.round(l.moy * 10) / 10)}</td>
          <td>${l.acquis === null ? '' : `${Math.round(l.acquis * 100)} %`}</td></tr>`; }).join('')}`).join('')}</tbody></table></div>`).join('')}
    ${evaluees.length ? `<details class="reglages-labo"><summary>👤 Élève par élève (dernier degré de chaque compétence évaluée)</summary>
      <div class="table-defile"><table class="table-labo"><thead><tr><th>Élève</th>${evaluees.map(a => `<th title="${esc(a.texte)}">${esc(a.code)}</th>`).join('')}<th>Maîtrisées</th></tr></thead>
      <tbody>${b.eleves.map(el => { const v = evaluees.map(a => b.degres.get(a.id)?.get(el.id) || null), ok = v.filter(x => x >= 3).length, n = v.filter(Boolean).length;
        return `<tr><th>${esc(nomEleveSvt(el))}</th>${v.map(x => `<td>${pastilleDegreSvt(x)}</td>`).join('')}<td>${n ? `${ok} / ${n}` : ''}</td></tr>`; }).join('')}</tbody></table></div></details>` : ''}
    <p class="aide">Calcul de l’appli : pour chaque élève, le dernier degré de maîtrise de la période (une compétence évaluée plusieurs fois compte pour son dernier degré).</p>`;
}

function texteCouverture(c, periode) {
  const b = bilanCouverture(c, periode);
  return [`Compétences — ${c.nom} — ${nomPeriodeSvt(periode)}`, 'Code\tCompétence\tÉvaluée (fois)\tDernière fois\tDegré moyen\tMaîtrisée (%)',
    ...b.refs.flatMap(r => r.groupes.flatMap(g => g.attendus)).map(a => { const l = b.ligne(a);
      return [a.code, a.texte, l.n, l.derniere ? dateCourte(l.derniere) : '', l.moy === null ? '' : fmt1(l.moy), l.acquis === null ? '' : Math.round(l.acquis * 100)].join('\t'); })].join('\n');
}

/* ---------- 🧭 Socle commun (collège) ---------- */

function bilanSocle(c, periode) {
  const ref = REFERENTIEL.refs[referentielDuNiveau(c.niveau)], { degres } = derniersDegres(c, periode), eleves = elevesDe(c.id);
  const evals = evalsPeriodeSvt(c, periode), seuils = seuilsClasse(c);
  const domaines = Object.keys(DOMAINES_SOCLE).filter(D => Object.values(ref?.socle || {}).some(l => l.includes(D)));
  // Compétences (de tous les référentiels qui ont un tableau du socle) rangées par domaine.
  const parDomaine = Object.fromEntries(domaines.map(D => [D, []]));
  for (const id of degres.keys()) {
    const a = REFERENTIEL.attendu(id), s = a && REFERENTIEL.refs[a.refId]?.socle?.[a.ca];
    for (const D of s || []) if (parDomaine[D]) parDomaine[D].push(id);
  }
  const lignes = eleves.map(el => {
    const val = Object.fromEntries(domaines.map(D => {
      const v = parDomaine[D].map(id => degres.get(id).get(el.id)).filter(Boolean);
      return [D, v.length ? Math.round((v.reduce((x, y) => x + y, 0) / v.length) * 10) / 10 : null];
    }));
    const moy = moyenneEleve(el.id, evals);
    const pos = moy === null ? null : moy >= seuils[2] ? 4 : moy >= seuils[1] ? 3 : moy >= seuils[0] ? 2 : 1;
    return { el, val, moy, pos };
  });
  return { ref, domaines, parDomaine, lignes };
}

function htmlSocle(c, periode) {
  const b = bilanSocle(c, periode);
  if (!b.ref?.socle) return '<p class="aide">Le bilan du socle concerne les classes de collège (référentiels des cycles 3 et 4).</p>';
  const moyClasse = D => { const v = b.lignes.map(l => l.val[D]).filter(x => x !== null); return v.length ? Math.round((v.reduce((x, y) => x + y, 0) / v.length) * 10) / 10 : null; };
  return `
    <div class="outils">${selectPeriodeSvt(periode)}<span class="aide">${esc(b.ref.nom)}</span></div>
    <div class="table-defile"><table class="table-labo socle-svt"><thead><tr><th>Élève</th><th>Moyenne</th><th>Positionnement</th>
      ${b.domaines.map(D => `<th title="${esc(DOMAINES_SOCLE[D])}">${D}<br><small>${esc(resumeTexte(DOMAINES_SOCLE[D], 28))}</small></th>`).join('')}</tr></thead>
      <tbody>${b.lignes.map(l => `<tr><th>${esc(nomEleveSvt(l.el))}</th><td>${l.moy === null ? '–' : fmt1(l.moy)}</td>
        <td>${l.pos ? `<span class="niveau n${l.pos}">${l.pos}</span> ${esc(POSITIONNEMENTS[l.pos - 1])}` : '<span class="aide">–</span>'}</td>
        ${b.domaines.map(D => `<td>${pastilleDegreSvt(l.val[D])}</td>`).join('')}</tr>`).join('')}
      <tr class="groupe-svt"><th>Classe</th><td></td><td></td>${b.domaines.map(D => `<td>${pastilleDegreSvt(moyClasse(D))}</td>`).join('')}</tr></tbody></table></div>
    <details class="reglages-labo"><summary>Comment c’est calculé</summary>
      <p class="aide">Chaque domaine reçoit la moyenne des derniers degrés de maîtrise (1 à 4) des compétences qui s’y rattachent, d’après le tableau
        « compétences travaillées / domaines du socle » du programme : ${Object.entries(b.ref.socle).map(([ca, l]) => `${ca} → ${l.join(', ')}`).join(' ; ')}.</p>
      <p class="aide">Positionnement de la période : d’après la moyenne sur 20 et les seuils de la classe (${seuilsClasse(c).map(fmt).join(' / ')}).
        Ce sont des propositions de l’appli, à vérifier avant de les reporter dans le LSU ; le positionnement de fin de cycle sur le socle se décide en conseil de classe.</p>
      ${b.domaines.map(D => `<p class="aide"><b>${D}</b> ${esc(DOMAINES_SOCLE[D])} : ${b.parDomaine[D].length ? b.parDomaine[D].map(id => esc(REFERENTIEL.attendu(id)?.code || id)).join(', ') : 'aucune compétence évaluée sur la période'}</p>`).join('')}
    </details>`;
}

function texteSocle(c, periode) {
  const b = bilanSocle(c, periode);
  return [['Nom', 'Prénom', 'Moyenne', 'Positionnement', ...b.domaines.map(D => `${D} ${DOMAINES_SOCLE[D]}`)].join('\t'),
    ...b.lignes.map(l => [l.el.nom, l.el.prenom, l.moy === null ? '' : fmt1(l.moy), l.pos ? POSITIONNEMENTS[l.pos - 1] : '',
      ...b.domaines.map(D => (l.val[D] === null ? '' : fmt1(l.val[D])))].join('\t'))].join('\n');
}

/* ---------- 📄 Travail rendu ---------- */

// Travaux à rendre de la période : évaluations où au moins un élève est noté NR (sinon ce ne sont pas des travaux
// « à rendre »), colonnes de séance « Rendu / En retard / Non rendu », séances notées NR (toute la séance).
// États : 'rendu', 'retard', 'nr' (pas d'état : absent, pas concerné).
function travauxRendus(c, periode) {
  const eleves = elevesDe(c.id), travaux = [];
  for (const e of evalsPeriodeSvt(c, periode)) {
    if (!eleves.some(el => Donnees.note(e.id, el.id) === 'NR')) continue;
    travaux.push({ date: e.date, titre: e.titre, etat: id => { const n = Donnees.note(e.id, id); return n === 'NR' ? 'nr' : nombre(n) !== null ? 'rendu' : ''; } });
  }
  for (const s of seancesPeriodeSvt(c, periode)) {
    const inds = (s.indicateurs || []).filter(ind => ind.type === 'choix' && (ind.options || []).includes('Non rendu'));
    for (const ind of inds) {
      travaux.push({ date: s.date, titre: s.titre + (inds.length > 1 ? ' — ' + ind.nom : ''), etat: id => {
        if (statutEnt(s.id, id) === 'NR' || statutCase(Donnees.note(s.id, id, ind.id) || '') === 'NR') return 'nr';
        const v = valeurCase(s.id, id, ind.id);
        return v === 'Non rendu' ? 'nr' : v === 'En retard' ? 'retard' : v === 'Rendu' ? 'rendu' : '';
      } });
    }
    // Séance notée « Non rendu » sans colonne de travail : compte comme un travail non rendu.
    if (!inds.length && eleves.some(el => statutEnt(s.id, el.id) === 'NR')) {
      travaux.push({ date: s.date, titre: s.titre, etat: id => (statutEnt(s.id, id) === 'NR' ? 'nr' : '') });
    }
  }
  travaux.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const lignes = eleves.map(el => {
    const etats = travaux.map(t => t.etat(el.id));
    const n = k => etats.filter(x => x === k).length;
    return { el, etats, rendu: n('rendu'), retard: n('retard'), nr: n('nr'), manques: travaux.filter((t, i) => ['nr', 'retard'].includes(etats[i])).map((t, i2) => ({ ...t, e: t.etat(el.id) })) };
  });
  return { travaux, lignes };
}
const alerteRendu = l => (l.nr >= 3 ? 'rouge' : l.nr >= 2 ? 'orange' : '');

function htmlTravailRendu(c, periode) {
  const b = travauxRendus(c, periode);
  if (!b.travaux.length) {
    return `<div class="outils">${selectPeriodeSvt(periode)}</div>
      <p class="aide">Aucun travail à rendre repéré sur ${nomPeriodeSvt(periode)}. L’appli compte les colonnes « Travail rendu » des séances
        (Rendu / En retard / Non rendu) et les évaluations où un élève est noté <b>R</b> (non rendu).</p>`;
  }
  const dernier = b.travaux.at(-1), relances = b.lignes.filter(l => ['nr', 'retard'].includes(dernier.etat(l.el.id)));
  const tri = [...b.lignes].sort((x, y) => y.nr - x.nr || y.retard - x.retard || collator.compare(nomEleveSvt(x.el), nomEleveSvt(y.el)));
  const icone = { rendu: '✅', retard: '🟠', nr: '❌', '': '' };
  return `
    <div class="outils">${selectPeriodeSvt(periode)}<span class="aide"><b>${b.travaux.length}</b> travail${b.travaux.length > 1 ? 'aux' : ''} à rendre sur ${nomPeriodeSvt(periode)}</span></div>
    ${relances.length ? `<div class="alerte-sante">📮 <b>À relancer</b> pour « ${esc(dernier.titre)} » (${dateCourte(dernier.date)}) : ${relances.map(l => esc(nomEleveSvt(l.el)) + (dernier.etat(l.el.id) === 'retard' ? ' <span class="aide">(en retard)</span>' : '')).join(', ')}</div>` : ''}
    <div class="table-defile"><table class="table-labo rendu-svt"><thead><tr><th>Élève</th><th>✅ Rendus</th><th>🟠 En retard</th><th>❌ Non rendus</th>
      ${b.travaux.map(t => `<th title="${esc(t.titre)}">${dateCourte(t.date)}<br><small>${esc(resumeTexte(t.titre, 18))}</small></th>`).join('')}</tr></thead>
      <tbody>${tri.map(l => `<tr class="${alerteRendu(l) ? 'alerte-' + alerteRendu(l) : ''}"><th>${esc(nomEleveSvt(l.el))}${alerteRendu(l) ? ' ⚠' : ''}</th>
        <td>${l.rendu}</td><td>${l.retard || ''}</td><td>${l.nr ? `<b>${l.nr}</b>` : ''}</td>
        ${b.travaux.map(t => { const e = t.etat(l.el.id); return `<td title="${esc(e === 'nr' ? 'Non rendu' : e === 'retard' ? 'En retard' : e === 'rendu' ? 'Rendu' : '')}">${icone[e]}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>
    <p class="aide">⚠ : deux travaux non rendus ou plus. « 📋 Copier » donne un texte prêt pour le conseil de classe (élèves avec au moins un travail non rendu ou en retard).</p>`;
}

function texteTravailRendu(c, periode) {
  const b = travauxRendus(c, periode);
  const concernes = b.lignes.filter(l => l.nr || l.retard).sort((x, y) => y.nr - x.nr || y.retard - x.retard);
  if (!concernes.length) return `Travail rendu — ${c.nom} — ${nomPeriodeSvt(periode)} : tous les travaux ont été rendus.`;
  return [`Travail rendu — ${c.nom} — ${nomPeriodeSvt(periode)} (${b.travaux.length} travaux à rendre)`,
    ...concernes.map(l => `${l.el.prenom} ${l.el.nom} : ${[l.nr ? `${l.nr} non rendu${l.nr > 1 ? 's' : ''}` : '', l.retard ? `${l.retard} en retard` : ''].filter(Boolean).join(', ')}`
      + ` (${l.manques.map(t => `${t.titre} du ${dateCourte(t.date)}${t.e === 'retard' ? ', en retard' : ''}`).join(' ; ')})`)].join('\n');
}
