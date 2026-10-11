'use strict';
// Outil « 🔬 ECE » (Outils › SVT) : évaluation des compétences expérimentales (spécialité SVT, terminale), pour les ECE
// blanches en classe. D'après le guide de l'inspection générale (Eduscol) : épreuve d'1 h, notée sur 20 puis ramenée sur 5.
//   Réalisation pratique /9 et étape spécifique /3 : curseur à quatre niveaux selon le nombre et la nature des aides
//     (A seul ou une aide mineure ; B plus d'une aide mineure ; C une aide majeure ; D pas de résultat exploitable /
//     pas de proposition pertinente). Un document de secours donné pour un échec non imputable au candidat n'est pas une aide.
//   Communication /5 (techniquement correcte, bien renseignée, pertinente) et conclusion /3 (complète, organisée,
//     distanciée) : selon le nombre de critères remplis.
// L'examinateur compte les aides au toucher ; l'appli propose le niveau (modifiable) et calcule la note. Rien n'est
// envoyé nulle part ; « 📝 Vers les notes » crée une évaluation sur 20 dans l'onglet Notes.

if (!FAMILLES_OUTILS.some(f => f.id === 'svt')) FAMILLES_OUTILS.push({ id: 'svt', nom: 'SVT' });
OUTILS.push({ id: 'ece', famille: 'svt', icone: '🔬', nom: 'ECE', info: 'Épreuve des compétences expérimentales : aides, grille, note', classe: true });

const NIVEAUX_ECE = ['A', 'B', 'C', 'D'];
const BAREME_ECE = { pratique: [9, 6, 3, 0], specifique: [3, 2, 1, 0], communication: [5, 3, 1, 0], conclusion: [3, 2, 1, 0] };
const CRITERES_ECE = {
  communication: ['Techniquement correcte (soignée, lisible, appropriée…)', 'Bien renseignée (informations complètes et exactes)',
    'Pertinente : montre comment l’activité pratique répond au problème posé'],
  conclusion: ['Complète : utilise toutes les informations (activité, ressources, étape spécifique)',
    'Organisée : relie logiquement ces informations et le problème posé', 'Distanciée : interroge la démarche et la validité des données'],
};

function cfgEce(c) {
  return ((etatOutils.ece ??= {})[c.id] ??= { duree: 60, sujet: '', deuxActivites: false, debut: null, cumul: 0, candidats: [], choix: '' });
}
const nouveauCandidat = id => ({
  id, pratique: [{ mineures: 0, majeures: 0, exploitable: true, secours: false }, { mineures: 0, majeures: 0, exploitable: true, secours: false }],
  specifique: { mineures: 0, majeures: 0, pertinente: true }, communication: [false, false, false], conclusion: [false, false, false],
  niveaux: {}, commentaire: '',
});

// Niveau proposé d'après les aides (curseurs « pratique » et « étape spécifique »).
const niveauAides = (a, reussi) => (!reussi ? 'D' : a.majeures > 0 ? 'C' : a.mineures > 1 ? 'B' : 'A');
const niveauCriteres = l => NIVEAUX_ECE[3 - l.filter(Boolean).length];

function noteEce(cfg, k) {
  const auto = {
    pratique0: niveauAides(k.pratique[0], k.pratique[0].exploitable),
    pratique1: niveauAides(k.pratique[1], k.pratique[1].exploitable),
    specifique: niveauAides(k.specifique, k.specifique.pertinente),
    communication: niveauCriteres(k.communication),
    conclusion: niveauCriteres(k.conclusion),
  };
  const niv = { ...auto, ...k.niveaux };
  const pts = (cle, bareme) => BAREME_ECE[bareme][NIVEAUX_ECE.indexOf(niv[cle])];
  // Deux activités pratiques : deux curseurs indépendants ; la note pratique en est ici la moyenne (calcul indicatif).
  const pratique = cfg.deuxActivites ? (pts('pratique0', 'pratique') + pts('pratique1', 'pratique')) / 2 : pts('pratique0', 'pratique');
  const parts = { pratique, specifique: pts('specifique', 'specifique'), communication: pts('communication', 'communication'), conclusion: pts('conclusion', 'conclusion') };
  const sur20 = parts.pratique + parts.specifique + parts.communication + parts.conclusion;
  return { auto, niv, parts, sur20, sur5: Math.round((sur20 / 4) * 100) / 100 };
}

/* ---------- Affichage ---------- */

const ecouleEce = cfg => (cfg.cumul || 0) + (cfg.debut ? Date.now() - cfg.debut : 0);

function htmlEce(c) {
  const cfg = cfgEce(c);
  const presents = presentsOutil(c).filter(el => !cfg.candidats.some(k => k.id === el.id));
  const enMarche = !!cfg.debut;
  return `
    <div class="ligne reglage-outil">
      <label class="large-outil">Sujet<input data-oe-champ="sujet" value="${esc(cfg.sujet)}" maxlength="120" placeholder="ex. Activité enzymatique de l’amylase"></label>
      <label class="etroit">Durée<select data-oe-champ="duree">${[45, 60, 75, 90].map(m => `<option value="${m}" ${cfg.duree === m ? 'selected' : ''}>${m} min</option>`).join('')}</select></label>
      <label class="case"><input type="checkbox" data-oe-champ="deuxActivites" ${cfg.deuxActivites ? 'checked' : ''}> Deux activités pratiques</label>
    </div>
    <div class="barre-outil">
      <span class="grand-temps moyen" data-o-bloc="ece" data-arg="${c.id}">${BLOCS_DIRECTS.ece(c.id)}</span>
      <button class="primaire gros" data-oe="chrono">${enMarche ? '⏸ Pause' : ecouleEce(cfg) ? '▶ Reprendre' : '▶ Début de l’épreuve'}</button>
      <button data-oe="chrono-zero" ${enMarche || !ecouleEce(cfg) ? 'disabled' : ''}>↺ Remettre à zéro</button>
    </div>
    ${htmlPresents(c)}
    <div class="ligne reglage-outil">
      <label>Ajouter un candidat<select data-oe-ajout><option value="">—</option>${presents.map(el => `<option value="${el.id}">${esc(nomEleveOutil(el))}</option>`).join('')}</select></label>
      ${presents.length ? `<button data-oe="tous">+ Tous les présents (${presents.length})</button>` : ''}
    </div>
    <p class="aide">Pour chaque candidat : compte les aides au toucher, coche les critères ; l’appli propose le niveau de chaque curseur
      (touche une autre lettre pour le changer) et calcule la note. Un document de secours donné pour un échec non imputable au candidat
      n’est pas une aide.</p>
    <div class="cartes-ece">${cfg.candidats.filter(k => Donnees.get('eleves', k.id)).map(k => htmlCandidatEce(cfg, k)).join('')}</div>
    ${cfg.candidats.length ? `<div class="boutons-outil">
      ${enModeEleve() ? '' : '<button class="primaire" data-oe="vers-notes" title="Créer une évaluation sur 20 dans l’onglet Notes, avec la note de chaque candidat">📝 Vers les notes</button>'}
      <button data-oe="copier" title="Copier le récapitulatif (une ligne par candidat)">📋 Copier le récapitulatif</button></div>` : ''}`;
}

function htmlCurseur(id, cle, n, auto, bareme) {
  return `<span class="curseur-ece">${NIVEAUX_ECE.map((x, i) => `<button type="button" class="niv-ece${x === n ? ' choisi' : ''}${x === auto && x !== n ? ' propose' : ''}"
    data-oe="niveau" data-arg="${id}|${cle}|${x}" title="${x} = ${BAREME_ECE[bareme][i]} pt${BAREME_ECE[bareme][i] > 1 ? 's' : ''}${x === auto ? ' (proposé)' : ''}">${x}</button>`).join('')}</span>`;
}

function htmlAides(id, cle, a, labelReussi, reussi, champReussi) {
  return `<div class="aides-ece">
    <span>Aides mineures <b>${a.mineures}</b></span>
    <button type="button" data-oe="aide" data-arg="${id}|${cle}|mineures|1" aria-label="Aide mineure en plus">+</button>
    <button type="button" data-oe="aide" data-arg="${id}|${cle}|mineures|-1" ${a.mineures ? '' : 'disabled'} aria-label="Aide mineure en moins">−</button>
    <span>Aides majeures <b>${a.majeures}</b></span>
    <button type="button" data-oe="aide" data-arg="${id}|${cle}|majeures|1" aria-label="Aide majeure en plus">+</button>
    <button type="button" data-oe="aide" data-arg="${id}|${cle}|majeures|-1" ${a.majeures ? '' : 'disabled'} aria-label="Aide majeure en moins">−</button>
    <label class="case"><input type="checkbox" data-oe-coche="${id}|${champReussi}" ${reussi ? 'checked' : ''}> ${labelReussi}</label>
  </div>`;
}

function htmlCandidatEce(cfg, k) {
  const r = noteEce(cfg, k), id = k.id;
  const pratique = i => `<div class="etape-ece"><div class="tete-etape"><b>Réalisation pratique${cfg.deuxActivites ? ' ' + (i + 1) : ''}</b>
      ${htmlCurseur(id, 'pratique' + i, r.niv['pratique' + i], r.auto['pratique' + i], 'pratique')}
      <span class="pts-ece">${BAREME_ECE.pratique[NIVEAUX_ECE.indexOf(r.niv['pratique' + i])]} / 9</span></div>
    ${htmlAides(id, 'pratique' + i, k.pratique[i], 'Résultats exploitables', k.pratique[i].exploitable, `pratique${i}.exploitable`)}
    <label class="case"><input type="checkbox" data-oe-coche="${id}|pratique${i}.secours" ${k.pratique[i].secours ? 'checked' : ''}>
      Document de secours (échec non imputable : pas une aide)</label></div>`;
  const criteres = cle => `<div class="etape-ece"><div class="tete-etape"><b>${cle === 'communication' ? 'Communication' : 'Conclusion'}</b>
      ${htmlCurseur(id, cle, r.niv[cle], r.auto[cle], cle)}<span class="pts-ece">${r.parts[cle]} / ${BAREME_ECE[cle][0]}</span></div>
    ${CRITERES_ECE[cle].map((t, j) => `<label class="case"><input type="checkbox" data-oe-coche="${id}|${cle}.${j}" ${k[cle][j] ? 'checked' : ''}> ${esc(t)}</label>`).join('')}</div>`;
  return `<div class="carte-ece">
    <div class="tete-appr"><b>${esc(nomOutil(id))}</b><span class="espace"></span>
      <span class="note-ece"><b>${fmt(r.sur20)}</b>/20 · <b>${fmt(r.sur5)}</b>/5</span>
      <button class="icone-petit" data-oe="retirer" data-arg="${id}" aria-label="Retirer ce candidat">✕</button></div>
    ${pratique(0)}${cfg.deuxActivites ? pratique(1) : ''}
    <div class="etape-ece"><div class="tete-etape"><b>Étape spécifique (oral)</b>
      ${htmlCurseur(id, 'specifique', r.niv.specifique, r.auto.specifique, 'specifique')}<span class="pts-ece">${r.parts.specifique} / 3</span></div>
      ${htmlAides(id, 'specifique', k.specifique, 'Proposition pertinente', k.specifique.pertinente, 'specifique.pertinente')}</div>
    ${criteres('communication')}${criteres('conclusion')}
    <textarea class="obs-fiche" data-oe-commentaire="${id}" rows="2" placeholder="Commentaire qualitatif…" aria-label="Commentaire — ${esc(nomOutil(id))}">${esc(k.commentaire)}</textarea>
  </div>`;
}

BLOCS_DIRECTS.ece = classeId => {
  const cfg = etatOutils.ece?.[classeId];
  if (!cfg) return '';
  const reste = cfg.duree * 60000 - ecouleEce(cfg);
  return reste >= 0 ? fmtRebours(reste) : '+' + fmtTemps(-reste, false);
};
RENDUS_OUTILS.ece = htmlEce;

// Bips : 10 minutes avant la fin, puis à la fin (appelé par l'horloge des outils, outils.js › verifierEcheances).
function verifierEce() {
  for (const cfg of Object.values(etatOutils.ece || {})) {
    if (!cfg.debut) continue;
    const reste = cfg.duree * 60000 - ecouleEce(cfg);
    if (reste <= 600000 && !cfg.bip10) { cfg.bip10 = true; son(660, 0.5, 2); sauverOutils(); }
    if (reste <= 0 && !cfg.bipFin) { cfg.bipFin = true; bipFin(); sauverOutils(); }
  }
}

/* ---------- Actions ---------- */

const candidatEce = (cfg, id) => cfg.candidats.find(k => k.id === id);
const recapEce = cfg => cfg.candidats.filter(k => Donnees.get('eleves', k.id)).map(k => {
  const r = noteEce(cfg, k);
  return { k, r, ligne: `${nomOutil(k.id)}\t${fmt(r.sur20)}/20\t${fmt(r.sur5)}/5\tpratique ${fmt(r.parts.pratique)}/9 · spécifique ${r.parts.specifique}/3`
    + ` · communication ${r.parts.communication}/5 · conclusion ${r.parts.conclusion}/3${k.commentaire ? '\t' + k.commentaire : ''}` };
});

async function versNotesEce(c, cfg) {
  const liste = recapEce(cfg);
  if (!liste.length) throw new Error('Aucun candidat.');
  if (!(await confirmer(`Créer dans l’onglet Notes l’évaluation « ECE${cfg.sujet ? ' — ' + cfg.sujet : ''} » (sur 20), avec la note de ${liste.length} candidat${liste.length > 1 ? 's' : ''} ?`, 'Créer'))) return;
  const e = Donnees.ecrire('evals', {
    id: Donnees.nouvelId(), classeId: c.id, cree: Date.now(), titre: 'ECE' + (cfg.sujet ? ' — ' + cfg.sujet : ''),
    apsa: 'Évaluation des compétences expérimentales (ECE)', date: aujourdhui(), max: 20, coef: 1,
    referentiel: referentielDuNiveau(c.niveau), ca: '', competences: [], competencesLibres: '', preremplir: true,
  });
  for (const { k, r } of liste) Donnees.ecrireNote(e.id, k.id, String(r.sur20));
  for (const { k } of liste) if (k.commentaire) {
    const sid = idSuivi(k.id, ID_BILAN_NOTES), avant = Donnees.get('suivis', sid);
    const texte = [avant?.texte, `ECE ${dateCourte(aujourdhui())} : ${k.commentaire}`].filter(Boolean).join('\n');
    Donnees.ecrire('suivis', { ...(avant || {}), id: sid, eleveId: k.id, apsa: ID_BILAN_NOTES, texte });
  }
  ui.vue = 'notes';
  memoriserUi();
  rendre();
  toast(`Évaluation créée dans Notes : ${liste.length} note${liste.length > 1 ? 's' : ''} ✔ (commentaires repris dans les observations des fiches)`, 'ok');
}

function actionEce(action, arg, c) {
  const cfg = cfgEce(c);
  const [id, cle, quoi, n] = (arg || '').split('|');
  const k = id ? candidatEce(cfg, id) : null;
  switch (action) {
    case 'chrono': basculer(cfg); if (cfg.debut && !cfg.cumul) { cfg.bip10 = false; cfg.bipFin = false; } bipToucher(); return rendreOutil();
    case 'chrono-zero': Object.assign(cfg, { debut: null, cumul: 0, bip10: false, bipFin: false }); return rendreOutil();
    case 'tous':
      for (const el of presentsOutil(c)) if (!candidatEce(cfg, el.id)) cfg.candidats.push(nouveauCandidat(el.id));
      return rendreOutil();
    case 'retirer':
      return lancer(async () => {
        if (!(await confirmer(`Retirer ${nomOutil(id)} et ce qui a été noté pour ce candidat ?`, 'Retirer'))) return;
        cfg.candidats = cfg.candidats.filter(x => x.id !== id);
        rendreOutil();
      });
    case 'aide': {
      const a = cle === 'specifique' ? k.specifique : k.pratique[+cle.slice(-1)];
      a[quoi] = Math.max(0, a[quoi] + +n);
      delete k.niveaux[cle]; // (le niveau proposé suit les aides)
      bipToucher();
      return rendreOutil();
    }
    case 'niveau': {
      // Toucher la lettre proposée revient au calcul automatique ; une autre lettre l'impose.
      const r = noteEce(cfg, k);
      if (quoi === r.auto[cle]) delete k.niveaux[cle]; else k.niveaux[cle] = quoi;
      return rendreOutil();
    }
    case 'vers-notes': return lancer(() => versNotesEce(c, cfg));
    case 'copier': return lancer(() => copierTexte(recapEce(cfg).map(x => x.ligne).join('\n')));
  }
}

document.addEventListener('click', e => {
  const b = e.target.closest('#vue [data-oe]');
  if (!b || b.disabled) return;
  const c = classeActive();
  if (c) lancer(() => actionEce(b.dataset.oe, b.dataset.arg, c));
});

document.addEventListener('change', e => {
  const t = e.target;
  if (!t.closest?.('#vue .outil-ece')) return;
  const c = classeActive();
  if (!c) return;
  const cfg = cfgEce(c);
  if (t.dataset.oeChamp) {
    const k = t.dataset.oeChamp;
    cfg[k] = t.type === 'checkbox' ? t.checked : k === 'duree' ? +t.value : t.value.trim();
    return k === 'sujet' ? sauverOutils() : rendreOutil();
  }
  if (t.matches('[data-oe-ajout]') && t.value) { cfg.candidats.push(nouveauCandidat(t.value)); return rendreOutil(); }
  if (t.dataset.oeCoche) {
    const [id, chemin] = t.dataset.oeCoche.split('|'), k = candidatEce(cfg, id), [cle, champ] = chemin.split('.');
    if (cle === 'communication' || cle === 'conclusion') { k[cle][+champ] = t.checked; delete k.niveaux[cle]; }
    else if (cle === 'specifique') { k.specifique[champ] = t.checked; delete k.niveaux.specifique; }
    else { k.pratique[+cle.slice(-1)][champ] = t.checked; delete k.niveaux[cle]; }
    return rendreOutil();
  }
});

document.addEventListener('input', e => {
  const t = e.target;
  if (!t.dataset?.oeCommentaire) return;
  const c = classeActive(), k = c && candidatEce(cfgEce(c), t.dataset.oeCommentaire);
  if (k) { k.commentaire = t.value; sauverOutils(); }
});

/* ---------- 📤 Vers une séance : le détail de la grille ---------- */

TRANSFERTS.ece = c => {
  const cfg = cfgEce(c), liste = recapEce(cfg);
  if (!liste.length) throw new Error('Aucun candidat.');
  const col = (nom, f, extra = {}) => ({ nom, type: 'nombre', ...extra, valeurs: Object.fromEntries(liste.map(x => [x.k.id, String(f(x))])) });
  return { titre: 'ECE' + (cfg.sujet ? ' — ' + cfg.sujet : ''), apsa: 'Évaluation des compétences expérimentales (ECE)', colonnes: [
    col('Réalisation pratique', x => x.r.parts.pratique, { unite: '/9' }), col('Étape spécifique', x => x.r.parts.specifique, { unite: '/3' }),
    col('Communication', x => x.r.parts.communication, { unite: '/5' }), col('Conclusion', x => x.r.parts.conclusion, { unite: '/3' }),
    col('Note ECE', x => x.r.sur20, { unite: '/20' }),
    { nom: 'Commentaire', type: 'texte', valeurs: Object.fromEntries(liste.filter(x => x.k.commentaire).map(x => [x.k.id, x.k.commentaire])) },
  ].filter(x => Object.keys(x.valeurs).length) };
};
