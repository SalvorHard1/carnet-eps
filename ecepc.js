'use strict';
// Outil « 🔬 ECE » du carnet de physique-chimie (Outils › Sciences ; l'ECE de SVT est dans ece.js) : évaluation des
// compétences expérimentales de la spécialité de terminale, pour les ECE blanches en classe. D'après le « complément
// d'information » commun à tous les sujets de la banque nationale (session 2022) :
//   - épreuve d'1 h ; trois compétences évaluées par sujet parmi APP, ANA, REA, VAL, COM, « Réaliser » toujours présente ;
//   - un coefficient par compétence (1 pour 10 minutes environ ; 1, 2 ou 3, COM toujours 1), somme des coefficients = 6 ;
//   - niveaux A à D d'après les interventions de l'examinateur (annexe « Attribution des niveaux de maîtrise ») ;
//   - note calculée par Santorin, entre 5 et 20 (de 0 à 5 si l'engagement est très insuffisant), ramenée sur 5 au bac.
// Santorin ne publie pas son calcul : ici, chaque compétence vaut 15 × coef / 6 points au-dessus de 5, avec
// A = tous les points, B = 2/3, C = 1/3, D = 0 (calcul indicatif). L'examinateur compte les interventions au toucher ;
// l'appli propose le niveau (modifiable). Rien n'est envoyé nulle part ; « 📝 Vers les notes » crée l'évaluation sur 20.

OUTILS.push({ id: 'ecepc', famille: 'sciences', disciplines: ['pc'], icone: '🔬', nom: 'ECE', info: 'Compétences expérimentales : appels, niveaux A à D, note sur 20', classe: true });

const COMPETENCES_ECEPC = { APP: 'S’approprier', ANA: 'Analyser / Raisonner', REA: 'Réaliser', VAL: 'Valider', COM: 'Communiquer' };
const VALEUR_NIVEAU_ECEPC = { A: 1, B: 2 / 3, C: 1 / 3, D: 0 };
const CRITERES_COM_ECEPC = ['Communication cohérente', 'Communication complète', 'Vocabulaire scientifique adapté'];

function cfgEcePc(c) {
  return ((etatOutils.ecepc ??= {})[c.id] ??= {
    duree: 60, sujet: '', debut: null, cumul: 0, candidats: [],
    competences: [{ code: 'ANA', coef: 2 }, { code: 'REA', coef: 3 }, { code: 'VAL', coef: 1 }],
  });
}
const interventionsVides = () => ({ demandes: 0, questions: 0, partielles: 0, totale: false, uneReussie: false });
const nouveauCandidatPc = id => ({ id, interventions: {}, com: [false, false, false], niveaux: {}, noteManuelle: '', commentaire: '' });
const interventionsPc = (k, code) => (k.interventions[code] ??= interventionsVides());

// Niveau proposé (annexe du document officiel). Coefficient 1 : A seul ou avec une ou deux aides demandées par le
// candidat (difficultés qu'il a repérées) ; B avec une ou deux questions ouvertes de l'examinateur (difficultés non
// repérées, résolues par le candidat). Coefficient 2 ou 3 : une ou deux questions ouvertes laissent A ; plus de deux
// questions, ou une seule solution partielle, donnent B. Puis C : solutions partielles apportées (bloqué) ;
// D : solution complète fournie — C si, sur plusieurs tâches, au moins une a été menée à bien.
function niveauPropose(code, coef, k) {
  if (code === 'COM') {
    const [coherente, complete, vocabulaire] = k.com;
    return !coherente ? (complete || vocabulaire ? 'C' : 'D') : complete && vocabulaire ? 'A' : vocabulaire ? 'B' : 'C';
  }
  const a = interventionsPc(k, code);
  if (a.totale) return a.uneReussie ? 'C' : 'D';
  if (coef === 1) {
    if (a.partielles) return 'C';
    return a.questions || a.demandes > 2 ? 'B' : 'A'; // (plus de deux questions sans solution donnée : B proposé, à juger)
  }
  if (a.partielles > 1) return 'C';
  return a.partielles === 1 || a.questions > 2 || a.demandes > 2 ? 'B' : 'A';
}

// Grille du sujet : remarques si elle ne suit pas les règles de l'épreuve (on peut s'en écarter pour un entraînement).
function remarquesGrillePc(cfg) {
  const codes = cfg.competences.map(x => x.code), somme = cfg.competences.reduce((s, x) => s + x.coef, 0), r = [];
  if (!codes.includes('REA')) r.push('« Réaliser » est toujours évaluée');
  if (new Set(codes).size < codes.length) r.push('une compétence est choisie deux fois');
  if (somme !== 6) r.push(`coefficients : ${somme} au lieu de 6`);
  return r;
}

function noteEcePc(cfg, k) {
  const somme = cfg.competences.reduce((s, x) => s + x.coef, 0) || 1;
  const lignes = cfg.competences.map(({ code, coef }) => {
    const auto = niveauPropose(code, coef, k), niv = k.niveaux[code] || auto, max = (15 * coef) / somme;
    return { code, coef, auto, niv, max, pts: max * VALEUR_NIVEAU_ECEPC[niv] };
  });
  const calcul = Math.round((5 + lignes.reduce((s, l) => s + l.pts, 0)) * 10) / 10;
  const manuelle = nombreOutil(k.noteManuelle);
  const sur20 = manuelle !== null ? Math.max(0, Math.min(5, manuelle)) : calcul;
  return { lignes, calcul, sur20, manuelle: manuelle !== null, sur5: Math.round((sur20 / 4) * 100) / 100 };
}

/* ---------- Affichage ---------- */

const ecouleEcePc = cfg => (cfg.cumul || 0) + (cfg.debut ? Date.now() - cfg.debut : 0);

function htmlEcePc(c) {
  const cfg = cfgEcePc(c), presents = presentsOutil(c).filter(el => !cfg.candidats.some(k => k.id === el.id));
  const enMarche = !!cfg.debut, remarques = remarquesGrillePc(cfg);
  const choixComp = (i, x) => `<label>Compétence ${i + 1}<select data-op-comp="${i}|code">${Object.entries(COMPETENCES_ECEPC).map(([code, nom]) =>
    `<option value="${code}" ${x.code === code ? 'selected' : ''}>${code} — ${nom}</option>`).join('')}</select></label>
    <label class="etroit">Coef.<select data-op-comp="${i}|coef" ${x.code === 'COM' ? 'disabled' : ''}>${[1, 2, 3].map(n => `<option ${x.coef === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>`;
  return `
    <div class="ligne reglage-outil">
      <label class="large-outil">Sujet<input data-op-champ="sujet" value="${esc(cfg.sujet)}" maxlength="120" placeholder="ex. Titrage d’un vinaigre"></label>
      <label class="etroit">Durée<select data-op-champ="duree">${[45, 60, 75, 90].map(m => `<option value="${m}" ${cfg.duree === m ? 'selected' : ''}>${m} min</option>`).join('')}</select></label>
    </div>
    <details class="reglages-labo" data-op-details ${cfg.grille !== false ? 'open' : ''}><summary>⚙ Grille du sujet : ${cfg.competences.map(x => `${x.code} ×${x.coef}`).join(' · ')}</summary>
      <div class="ligne reglage-outil">${cfg.competences.map((x, i) => choixComp(i, x)).join('')}</div>
      <p class="aide">Trois compétences par sujet, « Réaliser » toujours présente ; coefficient 1 pour 10 minutes environ (COM : 1), total 6 —
        reprends ceux du document de l’évaluateur.</p>
      ${remarques.length ? `<p class="alerte-sante">⚠ ${esc(remarques.join(' ; '))}.</p>` : ''}
    </details>
    <div class="barre-outil">
      <span class="grand-temps moyen" data-o-bloc="ecepc" data-arg="${c.id}">${BLOCS_DIRECTS.ecepc(c.id)}</span>
      <button class="primaire gros" data-op="chrono">${enMarche ? '⏸ Pause' : ecouleEcePc(cfg) ? '▶ Reprendre' : '▶ Début de l’épreuve'}</button>
      <button data-op="chrono-zero" ${enMarche || !ecouleEcePc(cfg) ? 'disabled' : ''}>↺ Remettre à zéro</button>
    </div>
    ${htmlPresents(c)}
    <div class="ligne reglage-outil">
      <label>Ajouter un candidat<select data-op-ajout><option value="">—</option>${presents.map(el => `<option value="${el.id}">${esc(nomEleveOutil(el))}</option>`).join('')}</select></label>
      ${presents.length ? `<button data-op="tous">+ Tous les présents (${presents.length})</button>` : ''}
    </div>
    <p class="aide">À chaque appel, compte les interventions : <b>aide demandée</b> (difficulté que le candidat a repérée), <b>question ouverte</b>
      (difficulté qu’il n’a pas vue, puis résolue seul), <b>solution partielle</b> donnée, <b>solution complète</b> fournie. L’appli propose le niveau
      (touche une autre lettre pour le changer). Note indicative de 5 à 20 (A = tous les points de la compétence, B = 2/3, C = 1/3, D = 0) :
      la note officielle est celle de Santorin.</p>
    <div class="cartes-ece">${cfg.candidats.filter(k => Donnees.get('eleves', k.id)).map(k => htmlCandidatEcePc(cfg, k)).join('')}</div>
    ${cfg.candidats.length ? `<div class="boutons-outil">
      ${enModeEleve() ? '' : '<button class="primaire" data-op="vers-notes" title="Créer une évaluation sur 20 dans l’onglet Notes, avec la note de chaque candidat">📝 Vers les notes</button>'}
      <button data-op="copier" title="Copier le récapitulatif (une ligne par candidat)">📋 Copier le récapitulatif</button></div>` : ''}`;
}

function htmlCurseurPc(id, l) {
  return `<span class="curseur-ece">${Object.keys(VALEUR_NIVEAU_ECEPC).map(x => `<button type="button" class="niv-ece${x === l.niv ? ' choisi' : ''}${x === l.auto && x !== l.niv ? ' propose' : ''}"
    data-op="niveau" data-arg="${id}|${l.code}|${x}" title="${x} = ${fmt(Math.round(l.max * VALEUR_NIVEAU_ECEPC[x] * 100) / 100)} pt${x === l.auto ? ' (proposé)' : ''}">${x}</button>`).join('')}</span>`;
}

function htmlCompteur(id, code, champ, nom, n) {
  return `<span>${nom} <b>${n}</b></span>
    <button type="button" data-op="compte" data-arg="${id}|${code}|${champ}|1" aria-label="${esc(nom)} : une de plus">+</button>
    <button type="button" data-op="compte" data-arg="${id}|${code}|${champ}|-1" ${n ? '' : 'disabled'} aria-label="${esc(nom)} : une de moins">−</button>`;
}

function htmlCandidatEcePc(cfg, k) {
  const r = noteEcePc(cfg, k), id = k.id;
  const competence = l => {
    const tete = `<div class="tete-etape"><b>${l.code} — ${esc(COMPETENCES_ECEPC[l.code])}</b> <span class="aide">coef. ${l.coef}</span>
      ${htmlCurseurPc(id, l)}<span class="pts-ece">${fmt(Math.round(l.pts * 100) / 100)} / ${fmt(Math.round(l.max * 100) / 100)}</span></div>`;
    if (l.code === 'COM') return `<div class="etape-ece">${tete}
      ${CRITERES_COM_ECEPC.map((t, j) => `<label class="case"><input type="checkbox" data-op-coche="${id}|COM|${j}" ${k.com[j] ? 'checked' : ''}> ${t}</label>`).join('')}</div>`;
    const a = interventionsPc(k, l.code);
    return `<div class="etape-ece">${tete}
      <div class="aides-ece">${htmlCompteur(id, l.code, 'demandes', 'Aides demandées', a.demandes)}${htmlCompteur(id, l.code, 'questions', 'Questions ouvertes', a.questions)}
        ${htmlCompteur(id, l.code, 'partielles', 'Solutions partielles', a.partielles)}</div>
      <label class="case"><input type="checkbox" data-op-coche="${id}|${l.code}|totale" ${a.totale ? 'checked' : ''}> Solution complète fournie (protocole, valeurs…)</label>
      ${a.totale ? `<label class="case"><input type="checkbox" data-op-coche="${id}|${l.code}|uneReussie" ${a.uneReussie ? 'checked' : ''}> Plusieurs tâches : au moins une menée à bien seul</label>` : ''}
    </div>`;
  };
  return `<div class="carte-ece">
    <div class="tete-appr"><b>${esc(nomOutil(id))}</b><span class="espace"></span>
      <span class="note-ece"><b>${fmt(r.sur20)}</b>/20 · <b>${fmt(r.sur5)}</b>/5${r.manuelle ? ` <span class="aide">(calcul : ${fmt(r.calcul)})</span>` : ''}</span>
      <button class="icone-petit" data-op="retirer" data-arg="${id}" aria-label="Retirer ce candidat">✕</button></div>
    ${r.lignes.map(competence).join('')}
    <label class="etroit">Engagement très insuffisant : note de 0 à 5<input data-op-manuelle="${id}" value="${esc(k.noteManuelle)}" maxlength="4" inputmode="decimal" placeholder="—"></label>
    <textarea class="obs-fiche" data-op-commentaire="${id}" rows="2" placeholder="Commentaire qualitatif…" aria-label="Commentaire — ${esc(nomOutil(id))}">${esc(k.commentaire)}</textarea>
  </div>`;
}

BLOCS_DIRECTS.ecepc = classeId => {
  const cfg = etatOutils.ecepc?.[classeId];
  if (!cfg) return '';
  const reste = cfg.duree * 60000 - ecouleEcePc(cfg);
  return reste >= 0 ? fmtRebours(reste) : '+' + fmtTemps(-reste, false);
};
RENDUS_OUTILS.ecepc = htmlEcePc;

// Bips : 10 minutes avant la fin, puis à la fin (appelé par l'horloge des outils, outils.js › verifierEcheances).
function verifierEcePc() {
  for (const cfg of Object.values(etatOutils.ecepc || {})) {
    if (!cfg.debut) continue;
    const reste = cfg.duree * 60000 - ecouleEcePc(cfg);
    if (reste <= 600000 && !cfg.bip10) { cfg.bip10 = true; son(660, 0.5, 2); sauverOutils(); }
    if (reste <= 0 && !cfg.bipFin) { cfg.bipFin = true; bipFin(); sauverOutils(); }
  }
}

/* ---------- Actions ---------- */

const candidatEcePc = (cfg, id) => cfg.candidats.find(k => k.id === id);
const recapEcePc = cfg => cfg.candidats.filter(k => Donnees.get('eleves', k.id)).map(k => {
  const r = noteEcePc(cfg, k);
  return { k, r, ligne: `${nomOutil(k.id)}\t${fmt(r.sur20)}/20\t${fmt(r.sur5)}/5\t${r.lignes.map(l => `${l.code} ${l.niv}`).join(' · ')}${k.commentaire ? '\t' + k.commentaire : ''}` };
});

async function versNotesEcePc(c, cfg) {
  const liste = recapEcePc(cfg);
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

function actionEcePc(action, arg, c) {
  const cfg = cfgEcePc(c);
  const [id, code, quoi, n] = (arg || '').split('|');
  const k = id ? candidatEcePc(cfg, id) : null;
  switch (action) {
    case 'chrono': basculer(cfg); if (cfg.debut && !cfg.cumul) { cfg.bip10 = false; cfg.bipFin = false; } bipToucher(); return rendreOutil();
    case 'chrono-zero': Object.assign(cfg, { debut: null, cumul: 0, bip10: false, bipFin: false }); return rendreOutil();
    case 'tous':
      for (const el of presentsOutil(c)) if (!candidatEcePc(cfg, el.id)) cfg.candidats.push(nouveauCandidatPc(el.id));
      return rendreOutil();
    case 'retirer':
      return lancer(async () => {
        if (!(await confirmer(`Retirer ${nomOutil(id)} et ce qui a été noté pour ce candidat ?`, 'Retirer'))) return;
        cfg.candidats = cfg.candidats.filter(x => x.id !== id);
        rendreOutil();
      });
    case 'compte': {
      const a = interventionsPc(k, code);
      a[quoi] = Math.max(0, a[quoi] + +n);
      delete k.niveaux[code]; // (le niveau proposé suit les interventions)
      bipToucher();
      return rendreOutil();
    }
    case 'niveau': {
      // Toucher la lettre proposée revient au calcul automatique ; une autre lettre l'impose.
      const l = noteEcePc(cfg, k).lignes.find(x => x.code === code);
      if (quoi === l.auto) delete k.niveaux[code]; else k.niveaux[code] = quoi;
      return rendreOutil();
    }
    case 'vers-notes': return lancer(() => versNotesEcePc(c, cfg));
    case 'copier': return lancer(() => copierTexte(recapEcePc(cfg).map(x => x.ligne).join('\n')));
  }
}

document.addEventListener('click', e => {
  const b = e.target.closest('#vue [data-op]');
  if (!b || b.disabled) return;
  const c = classeActive();
  if (c) lancer(() => actionEcePc(b.dataset.op, b.dataset.arg, c));
});

document.addEventListener('change', e => {
  const t = e.target;
  if (!t.closest?.('#vue .outil-ecepc')) return;
  const c = classeActive();
  if (!c) return;
  const cfg = cfgEcePc(c);
  if (t.dataset.opChamp) {
    const k = t.dataset.opChamp;
    cfg[k] = k === 'duree' ? +t.value : t.value.trim();
    return k === 'sujet' ? sauverOutils() : rendreOutil();
  }
  if (t.dataset.opComp) {
    const [i, champ] = t.dataset.opComp.split('|'), x = cfg.competences[+i];
    if (champ === 'code') { x.code = t.value; if (x.code === 'COM') x.coef = 1; } else x.coef = +t.value;
    return rendreOutil();
  }
  if (t.matches('[data-op-ajout]') && t.value) { cfg.candidats.push(nouveauCandidatPc(t.value)); return rendreOutil(); }
  if (t.dataset.opCoche) {
    const [id, code, champ] = t.dataset.opCoche.split('|'), k = candidatEcePc(cfg, id);
    if (!k) return;
    if (code === 'COM') k.com[+champ] = t.checked;
    else { const a = interventionsPc(k, code); a[champ] = t.checked; if (champ === 'totale' && !t.checked) a.uneReussie = false; }
    delete k.niveaux[code];
    return rendreOutil();
  }
  // Note de 0 à 5 : redessinée en quittant le champ (pas pendant la frappe).
  if (t.dataset.opManuelle) return rendreOutil();
});

document.addEventListener('input', e => {
  const t = e.target, c = classeActive();
  if (!c || !t.closest?.('#vue .outil-ecepc')) return;
  const cfg = cfgEcePc(c);
  if (t.dataset.opCommentaire) { const k = candidatEcePc(cfg, t.dataset.opCommentaire); if (k) { k.commentaire = t.value; sauverOutils(); } }
  if (t.dataset.opManuelle) { const k = candidatEcePc(cfg, t.dataset.opManuelle); if (k) { k.noteManuelle = t.value.trim(); sauverOutils(); } }
});

// Panneau « Grille du sujet » : ouvert / fermé gardé d'un dessin à l'autre.
document.addEventListener('toggle', e => {
  if (!e.target.matches?.('#vue [data-op-details]')) return;
  const c = classeActive();
  if (c) { cfgEcePc(c).grille = e.target.open; sauverOutils(); }
}, true);

/* ---------- 📤 Vers une séance : le niveau de chaque compétence ---------- */

TRANSFERTS.ecepc = c => {
  const cfg = cfgEcePc(c), liste = recapEcePc(cfg);
  if (!liste.length) throw new Error('Aucun candidat.');
  const valeurs = f => Object.fromEntries(liste.map(x => [x.k.id, String(f(x))]));
  return { titre: 'ECE' + (cfg.sujet ? ' — ' + cfg.sujet : ''), apsa: 'Évaluation des compétences expérimentales (ECE)', colonnes: [
    ...cfg.competences.map(({ code }) => ({ nom: `${code} — ${COMPETENCES_ECEPC[code]}`, type: 'choix', options: Object.keys(VALEUR_NIVEAU_ECEPC),
      valeurs: valeurs(x => x.r.lignes.find(l => l.code === code).niv) })),
    { nom: 'Note ECE', type: 'nombre', unite: '/20', valeurs: valeurs(x => x.r.sur20) },
    { nom: 'Commentaire', type: 'texte', valeurs: Object.fromEntries(liste.filter(x => x.k.commentaire).map(x => [x.k.id, x.k.commentaire])) },
  ].filter(x => Object.keys(x.valeurs).length) };
};
