'use strict';
// Outil « 🏅 ASNS » (Outils › APSA) : une étape du parcours de l'attestation du savoir-nager (ou le parcours entier),
// une mesure (temps, durée tenue ou distance) et un barème en trois paliers → médaille de bronze, d'argent ou d'or
// pour chaque élève, calculée par l'appli. L'étape peut aussi être marquée réussie (sans reprise d'appuis) ou non :
// pas de médaille si elle n'est pas réussie. Les résultats sont gardés sur cet appareil (comme les autres outils) ;
// « 📤 Vers une leçon » les range dans le carnet (temps ou distance, réussite, médaille).

OUTILS.push({ id: 'asns', famille: 'apsa', icone: '🥇', nom: 'ASNS — médailles', info: 'Une étape du savoir-nager, un barème : bronze, argent ou or', classe: true });

// Mesures : sens du progrès et unité.
const MESURES_ASNS = {
  temps: { nom: 'Temps (le plus rapide)', court: 'Temps', sens: -1 },
  duree: { nom: 'Durée tenue (le plus long)', court: 'Durée tenue', sens: 1 },
  distance: { nom: 'Distance (le plus loin)', court: 'Distance', sens: 1 },
};

// Barème de départ, pour toutes les étapes : 15 / 10 / 5 (secondes ou mètres), à ajuster par le professeur.
// Temps : 5 s ou moins = or, 10 s = argent, 15 s = bronze ; durée tenue ou distance : l'inverse (15 = or, 5 = bronze).
// L'attestation elle-même ne se chronomètre pas : ces paliers servent à motiver et à différencier.
function baremeDefautAsns(etape, mesure) {
  return mesure === 'temps' ? { bronze: 15, argent: 10, or: 5 } : { bronze: 5, argent: 10, or: 15 };
}
const mesureDefautAsns = etape => (['sn-P5', 'sn-P9'].includes(etape) ? 'duree' : ['sn-P3', 'sn-P11'].includes(etape) ? 'distance' : 'temps');

function cfgAsns(c) {
  return ((etatOutils.asns ??= {})[c.id] ??= { etape: 'parcours', libre: '', mesures: {}, baremes: {}, resultats: {}, chrono: null });
}
const mesureAsns = cfg => cfg.mesures[cfg.etape] || mesureDefautAsns(cfg.etape);
const cleBareme = cfg => cfg.etape + '|' + mesureAsns(cfg);
const baremeAsns = cfg => cfg.baremes[cleBareme(cfg)] || baremeDefautAsns(cfg.etape, mesureAsns(cfg));
const resultatsAsns = cfg => (cfg.resultats[cfg.etape] ??= {});
const etapeSn = cfg => ETAPES_SN.find(e => e.id === cfg.etape);
const codeEtapeAsns = cfg => (cfg.etape === 'parcours' ? 'Parcours ASNS' : cfg.etape === 'libre' ? cfg.libre.trim() || 'Épreuve' : etapeSn(cfg)?.code);

// Valeur → texte (« 1:23,4 », « 12,5 s », « 3,5 m »).
const texteValAsns = (mesure, v) => (v === null || v === undefined ? '' : mesure === 'distance' ? fmt(v) + ' m' : formatTemps(v));
// Texte saisi → nombre (secondes ou mètres), ou null.
function lireValAsns(mesure, brut) {
  const t = String(brut || '').trim();
  if (!t) return null;
  if (mesure === 'distance') { const n = nombreOutil(t.replace(/\s*m$/i, '')); return n !== null && n >= 0 ? n : null; }
  const s = lireTemps(t);
  return s !== null && s >= 0 ? Math.round(s * 100) / 100 : null;
}

// Médaille d'un résultat : 'Or', 'Argent', 'Bronze' ou '' (pas de palier atteint, ou étape non réussie).
function medailleAsns(cfg, r) {
  if (!r || r.v === null || r.v === undefined || r.reussi === false) return '';
  const b = baremeAsns(cfg), sens = MESURES_ASNS[mesureAsns(cfg)].sens;
  const atteint = seuil => Number.isFinite(seuil) && (sens < 0 ? r.v <= seuil : r.v >= seuil);
  return atteint(b.or) ? 'Or' : atteint(b.argent) ? 'Argent' : atteint(b.bronze) ? 'Bronze' : '';
}
// Pas de palier atteint : des applaudissements (pour encourager, plutôt qu'une case vide).
const BRAVO = '👏';
// (Sans résultat encore : un simple tiret.)
const badgeAsns = (m, aResultat = true) => (!m && !aResultat ? '<span class="medaille-asns" title="Pas encore de résultat">–</span>'
  : `<span class="medaille-asns ${m ? 'm-' + sansAccent(m) : 'm-bravo'}" title="${m ? 'Médaille : ' + m.toLocaleLowerCase('fr') : 'Pas de médaille : bravo, continue !'}">${ICONES_MEDAILLE[m] || BRAVO}</span>`);

/* ---------- Affichage ---------- */

let reglagesAsnsOuverts = false;
// Temps en cours d'un nageur (ms), ou null.
const enCoursAsns = (cfg, id) => (cfg.enCours?.[id] ? Date.now() - cfg.enCours[id] : null);
const mesureChrono = mesure => mesure !== 'distance';

// Écran simple, pensé pour des élèves de 6e : une grande carte par camarade.
// Un toucher sur son nom = départ ; un second = arrivée (temps, médaille). Les réglages sont repliés, pour le professeur.
function htmlAsns(c) {
  const cfg = cfgAsns(c), mesure = mesureAsns(cfg), b = baremeAsns(cfg), res = resultatsAsns(cfg);
  const presents = presentsOutil(c), ids = new Set(presents.map(el => el.id));
  const comptes = { Or: 0, Argent: 0, Bronze: 0, '': 0 };
  for (const r of Object.values(res)) if (r.v !== null && r.v !== undefined) comptes[medailleAsns(cfg, r)]++;
  const nbRes = comptes.Or + comptes.Argent + comptes.Bronze + comptes[''];
  const signe = MESURES_ASNS[mesure].sens < 0 ? '≤' : '≥';
  const titre = cfg.etape === 'parcours' ? 'Parcours du savoir-nager' : cfg.etape === 'libre' ? cfg.libre.trim() || 'Épreuve' : etapeSn(cfg).texte;

  return `
    <div class="tete-asns">
      <div class="titre-asns">🏊 ${esc(cfg.etape.startsWith('sn-') ? etapeSn(cfg).code + ' · ' : '')}${esc(titre)}</div>
      <div class="podium-asns">
        <span class="palier-asns m-or">🥇 <b>${signe} ${esc(texteValAsns(mesure, b.or))}</b></span>
        <span class="palier-asns m-argent">🥈 <b>${signe} ${esc(texteValAsns(mesure, b.argent))}</b></span>
        <span class="palier-asns m-bronze">🥉 <b>${signe} ${esc(texteValAsns(mesure, b.bronze))}</b></span>
      </div>
    </div>
    ${enModeEleve() ? '' : htmlReglagesAsns(c, cfg, mesure, b, res, ids, nbRes)}
    <p class="consigne-asns">${mesureChrono(mesure)
    ? `<span>👆 Touche le nom : <b>▶ c’est parti</b></span><span>👆 Touche encore : <b>⏹ ${mesure === 'duree' ? 'il a lâché' : 'arrivé'}</b></span><span class="aide">2 nageurs à la fois au plus</span>`
    : '<span>👆 Touche le nom, puis écris la <b>distance</b></span>'}</p>
    <div class="cartes-asns">${htmlCartesAsns(c, cfg, mesure, presents, res) || '<p class="aide">Aucun élève présent.</p>'}</div>
    <div class="bilan-asns">${nbRes ? `🥇 <b>${comptes.Or}</b> · 🥈 <b>${comptes.Argent}</b> · 🥉 <b>${comptes.Bronze}</b> · ${BRAVO} <b>${comptes['']}</b>` : ''}</div>`;
}

// Jusqu'à deux élèves dans l'eau en même temps, chacun avec son chrono : ceux qui nagent en grand, en haut
// (côte à côte s'ils sont deux) ; les autres restent touchables tant qu'il reste une place, puis sont grisés.
// Le premier sans résultat (et pas dans l'eau) est marqué « À toi ! ».
const MAX_NAGEURS_ASNS = 2;
function htmlCartesAsns(c, cfg, mesure, presents, res) {
  const ids = new Set(presents.map(el => el.id));
  const nageurs = Object.keys(cfg.enCours || {}).filter(id => ids.has(id));
  const complet = nageurs.length >= MAX_NAGEURS_ASNS;
  const suivant = !complet && presents.find(el => !nageurs.includes(el.id) && !(res[el.id] && res[el.id].v !== null && res[el.id].v !== undefined))?.id;
  const dansLEau = nageurs.map(id => presents.find(el => el.id === id));
  return (dansLEau.length ? `<div class="nageurs-asns n${dansLEau.length}">${dansLEau.map(el => carteAsns(c, cfg, mesure, el, res[el.id])).join('')}</div>` : '')
    + presents.filter(el => !nageurs.includes(el.id)).map(el => carteAsns(c, cfg, mesure, el, res[el.id], complet, el.id === suivant)).join('');
}

function carteAsns(c, cfg, mesure, el, r, attend = false, suivant = false) {
  const t = enCoursAsns(cfg, el.id), m = medailleAsns(cfg, r);
  const nom = esc(nomEleveOutil(el));
  if (t !== null) {
    return `<button class="carte-asns en-course" data-as="carte" data-arg="${el.id}" aria-label="Arrivée de ${nom}">
      <span class="nom-asns">${nom}</span>
      <span class="temps-asns" data-o-bloc="asns" data-arg="${c.id}|${el.id}">${fmtTemps(t)}</span>
      <span class="etat-asns">⏹ Touche à l’arrivée</span></button>`;
  }
  const a = r && r.v !== null && r.v !== undefined;
  return `<button class="carte-asns${a ? ' fini m-' + (m ? sansAccent(m) : 'bravo') : ''}${attend ? ' attend' : ''}${suivant ? ' suivant' : ''}" data-as="carte" data-arg="${el.id}" ${attend ? 'disabled' : ''}
      aria-label="${mesureChrono(mesure) ? 'Départ de' : 'Distance de'} ${nom}">
    <span class="nom-asns">${nom}</span>
    ${a ? `<span class="medaille-carte">${ICONES_MEDAILLE[m] || BRAVO}</span>
      <span class="temps-asns">${esc(texteValAsns(mesure, r.v))}</span>
      <span class="etat-asns">${r.reussi === false ? 'Appui : pas de médaille' : m ? 'Médaille ' + (m === 'Or' ? 'd’or' : m === 'Argent' ? 'd’argent' : 'de bronze') : 'Pas de médaille : bravo, continue !'}${mesureChrono(mesure) ? ' · ▶ rejouer' : ''}</span>`
    : `<span class="medaille-carte vide">${suivant ? '👉' : mesureChrono(mesure) ? '▶' : '📏'}</span><span class="etat-asns">${suivant ? '<b>À toi !</b> ' : ''}${mesureChrono(mesure) ? 'Touche pour partir' : 'Touche pour écrire'}</span>`}
  </button>`;
}

// Réglages du professeur (repliés) : étape, mesure, barème, présents, tableau détaillé (corriger, réussite).
function htmlReglagesAsns(c, cfg, mesure, b, res, ids, nbRes) {
  const unite = mesure === 'distance' ? 'm' : 's ou min:s';
  const opt = (v, nom, sel) => `<option value="${esc(v)}" ${v === sel ? 'selected' : ''}>${esc(nom)}</option>`;
  const eleves = elevesDe(c.id).filter(el => ids.has(el.id) || res[el.id]);
  return `<details class="reglages-asns" data-as-reglages ${reglagesAsnsOuverts ? 'open' : ''}>
    <summary>⚙ Réglages du professeur <span class="aide">étape, barème, présents, corrections</span></summary>
    <div class="ligne reglage-outil">
      <label>Étape<select data-as-champ="etape">
        ${opt('parcours', 'Parcours complet (P1 à P13)', cfg.etape)}
        ${ETAPES_SN.filter(e => e.code.startsWith('P')).map(e => opt(e.id, `${e.code} — ${e.texte}`, cfg.etape)).join('')}
        ${opt('libre', 'Autre épreuve (à nommer)…', cfg.etape)}
      </select></label>
      ${cfg.etape === 'libre' ? `<label>Nom de l’épreuve<input data-as-champ="libre" value="${esc(cfg.libre)}" maxlength="40" placeholder="ex. 50 m sans appui"></label>` : ''}
      <label class="etroit">Mesure<select data-as-champ="mesure">${Object.entries(MESURES_ASNS).map(([k, m]) => opt(k, m.nom, mesure)).join('')}</select></label>
    </div>
    ${etapeSn(cfg) ? `<p class="aide">À réussir : ${esc(etapeSn(cfg).critere)}</p>` : cfg.etape === 'parcours'
    ? '<p class="aide">Parcours de l’attestation : en continuité, sans reprise d’appuis, sans lunettes.</p>' : ''}
    <h4>Barème</h4>
    <div class="ligne reglage-outil">
      ${[['or', 'Or'], ['argent', 'Argent'], ['bronze', 'Bronze']].map(([k, n]) => `<label class="etroit">${ICONES_MEDAILLE[n]} ${n}
        <input data-as-seuil="${k}" value="${esc(texteValAsns(mesure, b[k]))}" inputmode="decimal" placeholder="${unite}" aria-label="Seuil ${n}"></label>`).join('')}
    </div>
    <p class="aide">${MESURES_ASNS[mesure].sens < 0 ? 'Médaille si le temps est <b>inférieur ou égal</b> au seuil' : 'Médaille si le résultat <b>atteint</b> le seuil'}
      (temps : 45 ou 1:30 ; distance en mètres). Un nouveau temps ne remplace l’ancien que s’il est meilleur.</p>
    <div class="boutons-outil"><button data-as="proposer" ${nbRes >= 3 ? '' : 'disabled'} title="Or : le meilleur quart · Argent : la moitié · Bronze : presque tous">📐 Proposer d’après la classe</button>
      <button data-as="bareme-defaut">↺ Barème de départ</button></div>
    ${htmlPresents(c)}
    <h4>Résultats (corriger, réussite)</h4>
    <div class="carte"><table class="tableau-outil tableau-asns">
      <thead><tr><th>Élève</th><th>${esc(MESURES_ASNS[mesure].court)}</th><th>Réussie ?</th><th>Médaille</th></tr></thead>
      <tbody>${eleves.map(el => {
    const r = res[el.id], m = medailleAsns(cfg, r);
    return `<tr${ids.has(el.id) ? '' : ' class="absent-asns"'}>
        <td>${esc(nomEleveOutil(el))}</td>
        <td><input class="val-asns" data-as-val="${el.id}" value="${esc(texteValAsns(mesure, r?.v))}" inputmode="decimal" autocomplete="off" placeholder="${unite}"
          aria-label="${esc(MESURES_ASNS[mesure].court)} de ${esc(nomEleveOutil(el))}"></td>
        <td><button class="reussite-asns${r?.reussi === true ? ' oui' : r?.reussi === false ? ' non' : ''}" data-as="reussi" data-arg="${el.id}"
          title="Étape réussie sans reprise d’appuis ? Toucher : — → ✓ → ✗ (✗ = pas de médaille)">${r?.reussi === true ? '✓' : r?.reussi === false ? '✗' : '—'}</button></td>
        <td data-as-medaille="${el.id}">${badgeAsns(m, r?.v !== null && r?.v !== undefined)}</td></tr>`;
  }).join('')}</tbody></table></div>
    <p class="aide">Les résultats de chaque étape sont gardés : change d’étape pour en évaluer une autre, puis reviens.
      « 📤 Vers une ${esc(motMin('lecon'))} » envoie l’étape affichée (résultat, réussite et médaille).
      Pour les élèves : 🎓 Mode élève (page d’accueil des outils) cache ces réglages.</p>
  </details>`;
}

/* ---------- Actions ---------- */

// Quantile (0 à 1) d'une liste triée du meilleur au moins bon.
const quantileAsns = (tries, q) => tries[Math.min(tries.length - 1, Math.max(0, Math.ceil(q * tries.length) - 1))];

function actionAsns(action, arg, c) {
  const cfg = cfgAsns(c), res = resultatsAsns(cfg), mesure = mesureAsns(cfg);
  switch (action) {
    case 'carte': {
      if (!mesureChrono(mesure)) return saisirDistanceAsns(c, cfg, arg);
      const enCours = cfg.enCours ||= {};
      if (!enCours[arg]) {
        const autres = Object.keys(enCours);
        if (autres.length >= MAX_NAGEURS_ASNS) { // deux à la fois au plus
          return toast(`${autres.map(nomOutil).join(' et ')} nagent encore : touche d’abord l’un des deux à l’arrivée.`, 'erreur');
        }
        enCours[arg] = Date.now(); son(990, 0.3); return rendreOutil(); // départ
      }
      const ms = Date.now() - enCours[arg];
      if (ms < 800) return; // (double toucher par erreur juste après le départ)
      delete enCours[arg];
      enregistrerAsns(cfg, arg, Math.round(ms / 10) / 100);
      return rendreOutil();
    }
    case 'reussi': {
      const r = res[arg] ||= { v: null, date: aujourdhui() };
      r.reussi = r.reussi === undefined || r.reussi === null ? true : r.reussi === true ? false : null;
      return rendreOutil();
    }
    case 'proposer': {
      const sens = MESURES_ASNS[mesure].sens;
      const valeurs = Object.values(res).filter(r => r.v !== null && r.v !== undefined && r.reussi !== false).map(r => r.v)
        .sort((a, b) => (a - b) * -sens);
      if (valeurs.length < 3) return toast('Il faut au moins 3 résultats.', 'erreur');
      const arrondi = v => (mesure === 'distance' ? Math.round(v * 10) / 10 : Math.round(v));
      cfg.baremes[cleBareme(cfg)] = { or: arrondi(quantileAsns(valeurs, 0.25)), argent: arrondi(quantileAsns(valeurs, 0.5)), bronze: arrondi(quantileAsns(valeurs, 0.85)) };
      toast('Barème proposé d’après la classe : ajuste-le si besoin.', 'ok');
      return rendreOutil();
    }
    case 'bareme-defaut': delete cfg.baremes[cleBareme(cfg)]; return rendreOutil();
  }
}

// Nouveau résultat : gardé s'il est meilleur que le précédent (nouvel essai : la réussite est à revoir).
function enregistrerAsns(cfg, id, v) {
  const res = resultatsAsns(cfg), mesure = mesureAsns(cfg), avant = res[id]?.v;
  const meilleur = avant === undefined || avant === null || (MESURES_ASNS[mesure].sens < 0 ? v < avant : v > avant);
  if (meilleur) res[id] = { v, date: aujourdhui() };
  const m = medailleAsns(cfg, res[id]), nom = nomOutil(id), txt = texteValAsns(mesure, v);
  if (m) son(m === 'Or' ? 1320 : m === 'Argent' ? 1100 : 880, 0.18, 3); else bipFin();
  toast(meilleur ? `${ICONES_MEDAILLE[m] || BRAVO} ${nom} : ${txt}${m ? '' : ' — bravo, continue !'}`
    : `${nom} : ${txt}. Son record reste ${texteValAsns(mesure, avant)} ${ICONES_MEDAILLE[m] || ''}`, 'ok');
}

// Distance : une petite fenêtre avec un grand champ.
async function saisirDistanceAsns(c, cfg, id) {
  const { d, resultat } = ouvrirModale(`📏 ${nomOutil(id)}`, `
    <label>Distance (en mètres)<input name="v" class="grand-champ-asns" inputmode="decimal" autocomplete="off" required placeholder="ex. 12,5"></label>`,
  boutonsModale('Valider'));
  $('[name="v"]', d).focus();
  const r = await resultat;
  if (r.action !== 'ok') return;
  const v = lireValAsns('distance', r.data.v);
  if (v === null) throw new Error('Distance illisible (ex. 12,5).');
  enregistrerAsns(cfg, id, v);
  rendreOutil();
}

RENDUS_OUTILS.asns = htmlAsns;
BLOCS_DIRECTS.asns = arg => {
  const [classeId, id] = arg.split('|'), debut = etatOutils.asns?.[classeId]?.enCours?.[id];
  return debut ? fmtTemps(Date.now() - debut) : undefined;
};

document.addEventListener('click', e => {
  const b = e.target.closest('#vue [data-as]');
  if (!b || b.disabled) return;
  const c = classeActive();
  if (c) lancer(() => actionAsns(b.dataset.as, b.dataset.arg, c));
});

document.addEventListener('toggle', e => {
  if (e.target.matches?.('#vue [data-as-reglages]')) reglagesAsnsOuverts = e.target.open;
}, true);

document.addEventListener('change', e => {
  const t = e.target;
  if (!t.closest?.('#vue .outil-asns')) return;
  const c = classeActive();
  if (!c) return;
  const cfg = cfgAsns(c), mesure = mesureAsns(cfg);
  if (t.dataset.asChamp) {
    const k = t.dataset.asChamp;
    if (k === 'etape') { cfg.etape = t.value; cfg.enCours = {}; }
    else if (k === 'mesure') cfg.mesures[cfg.etape] = t.value;
    else if (k === 'libre') { cfg.libre = t.value.slice(0, 40); return sauverOutils(); } // (texte : pas de redessin, le prochain clic n'est pas perdu)
    return rendreOutil();
  }
  if (t.dataset.asSeuil) {
    const v = lireValAsns(mesure, t.value);
    if (v === null) { toast(mesure === 'distance' ? 'Distance illisible (ex. 12,5).' : 'Temps illisible (ex. 45 ou 1:30).', 'erreur'); return rendreOutil(); }
    cfg.baremes[cleBareme(cfg)] = { ...baremeAsns(cfg), [t.dataset.asSeuil]: v };
    // (Pas de redessin complet : on met à jour les médailles et le résumé du barème sur place.)
    t.value = texteValAsns(mesure, v);
    return majMedaillesAsns(c, cfg);
  }
  if (t.dataset.asVal) {
    const id = t.dataset.asVal, res = resultatsAsns(cfg);
    const v = lireValAsns(mesure, t.value);
    if (t.value.trim() && v === null) { toast(mesure === 'distance' ? 'Distance illisible (ex. 12,5).' : 'Temps illisible (ex. 45 ou 1:30).', 'erreur'); t.value = texteValAsns(mesure, res[id]?.v); return; }
    if (v === null && res[id]?.reussi === undefined) delete res[id];
    else res[id] = { ...(res[id] || {}), v, date: aujourdhui() };
    t.value = texteValAsns(mesure, v);
    majMedaillesAsns(c, cfg);
  }
});

// Médailles et résumé mis à jour sans redessiner l'outil (le champ suivant garde le focus).
function majMedaillesAsns(c, cfg) {
  sauverOutils();
  const res = resultatsAsns(cfg);
  document.querySelectorAll('#vue [data-as-medaille]').forEach(td => { const r = res[td.dataset.asMedaille]; td.innerHTML = badgeAsns(medailleAsns(cfg, r), r?.v !== null && r?.v !== undefined); });
  const comptes = { Or: 0, Argent: 0, Bronze: 0, '': 0 };
  for (const r of Object.values(res)) if (r.v !== null && r.v !== undefined) comptes[medailleAsns(cfg, r)]++;
  const n = comptes.Or + comptes.Argent + comptes.Bronze + comptes[''];
  const bilan = $('#vue .bilan-asns');
  if (bilan) bilan.innerHTML = n ? `🥇 <b>${comptes.Or}</b> · 🥈 <b>${comptes.Argent}</b> · 🥉 <b>${comptes.Bronze}</b> · ${BRAVO} <b>${comptes['']}</b>`
    : '';
  // Paliers en haut et cartes des élèves (médailles) : redessinés sur place.
  const b = baremeAsns(cfg), m = mesureAsns(cfg), signe = MESURES_ASNS[m].sens < 0 ? '≤' : '≥';
  document.querySelectorAll('#vue .palier-asns b').forEach((x, k) => { x.textContent = `${signe} ${texteValAsns(m, b[['or', 'argent', 'bronze'][k]])}`; });
  const cartes = $('#vue .cartes-asns');
  if (cartes) cartes.innerHTML = htmlCartesAsns(c, cfg, m, presentsOutil(c), res);
  const proposer = $('#vue [data-as="proposer"]');
  if (proposer) proposer.disabled = n < 3;
}

/* ---------- 📤 Vers une leçon ---------- */

TRANSFERTS.asns = c => {
  const cfg = cfgAsns(c), res = resultatsAsns(cfg), mesure = mesureAsns(cfg), code = codeEtapeAsns(cfg);
  const ids = Object.keys(res).filter(id => Donnees.get('eleves', id) && (res[id].v !== null && res[id].v !== undefined || typeof res[id].reussi === 'boolean'));
  if (!ids.length) throw new Error('Aucun résultat pour cette étape.');
  const valeurs = f => Object.fromEntries(ids.map(id => [id, f(res[id])]).filter(([, v]) => v !== null && v !== undefined && v !== ''));
  return { titre: 'ASNS — ' + code, apsa: 'Savoir-nager', colonnes: [
    mesure === 'distance'
      ? { nom: `${code} — distance`, type: 'distance', unite: 'm', valeurs: valeurs(r => (r.v === null || r.v === undefined ? null : String(r.v))) }
      : { nom: `${code} — ${mesure === 'duree' ? 'durée tenue' : 'temps'}`, type: 'temps', valeurs: valeurs(r => (r.v === null || r.v === undefined ? null : String(r.v))) },
    { nom: `${code} — réussie`, type: 'choix', options: ['Oui', 'Non'], valeurs: valeurs(r => (r.reussi === true ? 'Oui' : r.reussi === false ? 'Non' : null)) },
    { nom: `${code} — médaille`, type: 'choix', options: [...MEDAILLES], medaille: true, valeurs: valeurs(r => medailleAsns(cfg, r)) },
  ].filter(col => Object.keys(col.valeurs).length) };
};
