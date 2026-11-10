/* ---------- Notes › « Bilan pour le PP » ----------
   Feuille à remettre au professeur principal quand on ne peut pas aller au conseil de classe (maquette validée le 10/11/2026) :
   ① la classe en un coup d'œil (moyenne, présence, oublis, activités + 2 lignes sur la classe),
   ② mes propositions de mentions, ③ élèves à signaler, ④ élèves à valoriser, ⑤ ce que je voudrais que tu dises, annexe : appréciations du bulletin.
   Tout est calculé par l'appli à partir du carnet (moyennes, analyse des appréciations, leçons) ; l'enseignant corrige.
   Ce qu'il change est gardé dans la classe : classe.bilanPP[période] = { pp, classe, message, annexe, eleves: { id: { mention, signale, remarque, valorise, remarqueValo } } }
   (seulement ce qui diffère de la proposition). PAI / BEP ne sont jamais écrits sur la feuille (papier qui circule). */

const MENTIONS_BPP = { aucune: '—', felicitations: 'Félicitations', compliments: 'Compliments', encouragements: 'Encouragements', miseEnGarde: 'Mise en garde' };
const nomMentionBpp = k => MENTIONS_BPP[k] || (typeof nomMentionPP === 'function' ? nomMentionPP(k) : k);
// Mentions du menu : celles de l'établissement (Prof principal › réglages : sans les retirées, avec celles ajoutées à la main,
// « perso:Tableau d'honneur »…), plus « Mise en garde » (proposition d'un professeur, plus légère qu'un avertissement).
// Une mention déjà choisie pour un élève reste dans le menu même si elle a été retirée depuis.
function mentionsBpp(choisies = []) {
  const base = typeof mentionsPP === 'function' ? mentionsPP(reglagePP()).filter(k => k !== 'aucune') : ['felicitations', 'compliments', 'encouragements'];
  const i = base.findIndex(k => k.startsWith('av') || k.startsWith('perso:'));
  const liste = base.includes('miseEnGarde') ? base : [...base.slice(0, i < 0 ? base.length : i), 'miseEnGarde', ...base.slice(i < 0 ? base.length : i)];
  return ['aucune', ...new Set([...liste, ...choisies.filter(k => k && k !== 'aucune')])];
}
const classeMentionBpp = k => (k === 'felicitations' ? 'bpp-ok' : k === 'miseEnGarde' || (typeof estAvertPP === 'function' && estAvertPP(k)) ? 'bpp-alerte' : 'bpp-info');

// Période proposée : celle affichée dans Notes, sinon celle d'aujourd'hui.
const periodeParDefautBpp = () => { const p = periodeAffichee(); return p !== 'annee' ? p : periodeDe(aujourdhui()) || 'P1'; };
const nomPeriodeBpp = per => (per === 'annee' ? 'Année' : periodesAnnee().find(p => p.id === per)?.code || per);
const periodeAvantBpp = per => { const l = periodesAnnee(), i = l.findIndex(p => p.id === per); return i > 0 ? l[i - 1].id : null; };
const etatBpp = (c, per) => c.bilanPP?.[per] || {};

// Mention proposée d'après la moyenne et l'analyse des appréciations (niveaux 1 à 4 ; un niveau « par défaut », sans donnée, compte comme 3).
// Progression : 4 = net progrès (2 = stable). Comportement : 1 = problème relevé, 2 = à améliorer.
function mentionProposeeBpp(a, moy, vs) {
  const niv = k => (a.defaut?.[k] ? 3 : a.niveaux[k] ?? 3);
  const att = niv('attitude'), comp = niv('comportement'), prog = a.niveaux.progression ?? 2;
  if (comp <= 1 || att <= 1 || vs.tenue >= 4) return { k: 'miseEnGarde', pourquoi: comp <= 1 ? 'comportement' : 'travail' + (vs.tenue >= 4 ? ` (${vs.tenue} ${oubliTenue(vs.tenue)})` : '') };
  if (moy === null || moy === undefined) return { k: 'aucune' };
  if (moy >= 16 && att >= 3 && comp >= 3) return { k: 'felicitations' };
  if (moy >= 14 && att >= 3 && comp >= 2) return { k: 'compliments' };
  if (prog >= 4 && moy >= 8 && comp >= 2) return { k: 'encouragements', pourquoi: 'en net progrès' };
  if (att >= 4 && moy < 12) return { k: 'encouragements', pourquoi: 'très investi' };
  return { k: 'aucune' };
}

// Ce qui mérite d'être dit au conseil pour un élève : [{ t, ton }] (ton : 'alerte' | 'attention' | 'neutre').
function signauxBpp(el, periode, a, moy, vs, moyAvant) {
  const s = [], e = el.sexe === 'F' ? 'e' : el.sexe === 'G' ? '' : '·e';
  if (vs.abs >= 3) s.push({ t: `${vs.abs} absences`, ton: 'attention' });
  if (vs.tenue >= 3) s.push({ t: `${vs.tenue} ${oubliTenue(vs.tenue)}`, ton: 'attention' });
  if (moy !== null && moyAvant !== null && moy - moyAvant <= -2) s.push({ t: `en baisse : ${fmt1(moy)} (${fmt1(moyAvant)} au ${nomPeriodeBpp(periodeAvantBpp(periode))})`, ton: 'alerte' });
  else if (moy !== null && moy < 8) s.push({ t: `résultats fragiles : ${fmt1(moy)}`, ton: 'alerte' });
  if (!a.defaut?.comportement && (a.niveaux.comportement ?? 3) <= 1) s.push({ t: 'comportement', ton: 'attention' });
  const b = bilanLecons(el, periode);
  if (b.sante >= 2 && b.sante / Math.max(1, b.total) >= 0.2) s.push({ t: `souvent ${codeDeLaDiscipline('BLE') ? `blessé${e} ou ` : ''}malade`, ton: 'neutre' });
  if (codeDeLaDiscipline('DISP') && typeof dispenseActive === 'function' && dispenseActive(el)) s.push({ t: `dispensé${e}`, ton: 'neutre' });
  return s;
}

// Ce qui mérite d'être salué au conseil pour un élève (partie « Élèves à valoriser ») : [{ t, net }] ;
// coché d'office si un point est net (moyenne en hausse de 2 points, excellents résultats) ou s'il y en a au moins deux.
function pointsFortsBpp(el, periode, a, moy, moyAvant) {
  const s = [], e = el.sexe === 'F' ? 'e' : el.sexe === 'G' ? '' : '·e';
  const fort = k => !a.defaut?.[k] && a.niveaux[k] === 4;
  if (moy !== null && moyAvant !== null && moy - moyAvant >= 2) s.push({ t: `en progrès : ${fmt1(moy)} (${fmt1(moyAvant)} au ${nomPeriodeBpp(periodeAvantBpp(periode))})`, net: true });
  else if (a.niveaux.progression === 4) s.push({ t: 'en net progrès' });
  if (moy !== null && moy >= 17) s.push({ t: `excellents résultats : ${fmt1(moy)}`, net: true });
  if (fort('attitude')) s.push({ t: `très investi${e}` });
  if (fort('comportement')) s.push({ t: 'comportement exemplaire' });
  return s;
}

// Tout ce que l'appli calcule pour la feuille (une seule fois par ouverture / changement de période).
function calculerBpp(c, periode) {
  const eleves = elevesDe(c.id), evals = evalsPeriode(c.id, periode), avant = periodeAvantBpp(periode);
  const evalsAvant = avant ? evalsPeriode(c.id, avant) : [], proposables = mentionsBpp();
  const lignes = eleves.map(el => {
    const a = analyserAppr(el, periode, eleves), vs = vieScolaire(el, periode);
    const moy = moyenneEleve(el.id, evals), moyAvant = avant ? moyenneEleve(el.id, evalsAvant) : null;
    const signaux = signauxBpp(el, periode, a, moy, vs, moyAvant);
    // (Mention retirée de la liste de l'établissement : l'appli ne la propose plus.)
    let mention = mentionProposeeBpp(a, moy, vs);
    if (!proposables.includes(mention.k)) mention = { k: 'aucune' };
    const forts = pointsFortsBpp(el, periode, a, moy, moyAvant);
    return { el, a, vs, moy, moyAvant, mention, signaux, signale: signaux.some(x => x.ton !== 'neutre'), forts, valorise: forts.some(f => f.net) || forts.length >= 2 };
  });
  const moys = lignes.map(l => l.moy).filter(m => m !== null);
  const moyAvants = lignes.map(l => l.moyAvant).filter(m => m !== null);
  const moyClasse = moys.length ? moys.reduce((x, y) => x + y, 0) / moys.length : null;
  const moyClasseAvant = moyAvants.length ? moyAvants.reduce((x, y) => x + y, 0) / moyAvants.length : null;
  const total = lignes.reduce((n, l) => n + l.vs.total, 0), abs = lignes.reduce((n, l) => n + l.vs.abs, 0);
  const tenue = lignes.reduce((n, l) => n + l.vs.tenue, 0), tenueSouvent = lignes.filter(l => l.vs.tenue >= 3);
  const activites = [...new Set([...seancesPeriode(c.id, periode).map(apsaDe), ...evals.map(e => e.apsa).filter(Boolean)]
    .filter(x => x && !estActiviteAutre(x)))];
  const attitudes = lignes.map(l => l.a.niveaux.attitude).filter(v => v !== null && v !== undefined);
  return {
    lignes, moyClasse, moyClasseAvant, avant, activites, tenue, tenueSouvent,
    presence: total ? Math.round((1 - abs / total) * 100) : null,
    absentsSouvent: lignes.filter(l => l.vs.abs >= 3).length,
    min: moys.length ? Math.min(...moys) : null, max: moys.length ? Math.max(...moys) : null,
    attitude: attitudes.length ? attitudes.reduce((x, y) => x + y, 0) / attitudes.length : null,
  };
}

// Deux lignes sur la classe, proposées par l'appli (l'enseignant les réécrit à sa façon).
function texteClasseBpp(x) {
  const m = x.moyClasse, att = x.attitude;
  const niveau = m === null ? 'Classe' : m >= 14 ? 'Bonne classe' : m >= 12 ? 'Classe sérieuse dans l’ensemble' : m >= 10 ? 'Classe au niveau correct mais irrégulier' : 'Classe en difficulté';
  const engagement = att === null ? '' : att >= 3.3 ? ', investie et agréable' : att >= 2.6 ? ', plutôt investie' : ', dont l’investissement doit progresser';
  const acts = x.activites.length ? ` Au programme : ${x.activites.slice(0, 3).map(a => a.toLocaleLowerCase('fr')).join(x.activites.length === 2 ? ' et ' : ', ')}.` : '';
  let evol = '';
  if (m !== null && x.moyClasseAvant !== null) {
    const d = m - x.moyClasseAvant;
    evol = Math.abs(d) < 0.5 ? ` Résultats stables par rapport au ${nomPeriodeBpp(x.avant)}.`
      : ` Moyenne en ${d > 0 ? 'hausse' : 'baisse'} par rapport au ${nomPeriodeBpp(x.avant)} (${d > 0 ? '+' : '−'}${fmt1(Math.abs(d))}).`;
  }
  const absents = x.absentsSouvent ? ` ${x.absentsSouvent} élève${x.absentsSouvent > 1 ? 's sont' : ' est'} souvent absent${x.absentsSouvent > 1 ? 's' : ''}.` : '';
  return `${niveau}${engagement}.${acts}${evol}${absents}`;
}

// Ce qui sera imprimé : proposition de l'appli + ce que l'enseignant a changé.
function valeursBpp(c, periode, x) {
  const st = etatBpp(c, periode), ch = st.eleves || {};
  return {
    pp: st.pp ?? c.bilanPP?.pp ?? '', message: st.message || '', annexe: st.annexe ?? false, // (annexe : à cocher)
    classe: st.classe || texteClasseBpp(x),
    eleves: x.lignes.map(l => {
      const v = ch[l.el.id] || {};
      return { ...l, mentionK: v.mention ?? l.mention.k, aSignaler: v.signale ?? l.signale, remarque: v.remarque || '',
        aValoriser: v.valorise ?? l.valorise, remarqueValo: v.remarqueValo || '' };
    }),
  };
}

/* ---------- Fenêtre ---------- */

async function ouvrirBilanPP() {
  const c = classeActive();
  if (!c || !elevesDe(c.id).length) return toast('Choisis d’abord une classe avec des élèves.', 'erreur');
  let periode = periodeParDefautBpp(), x = calculerBpp(c, periode);
  const { d, resultat } = ouvrirModale(`Bilan pour le PP — ${c.nom}`, '<div data-bpp></div>',
    `<span class="aide">L’appli propose, tu corriges. Rien n’est envoyé.</span><span class="espace"></span>
     <label class="case bpp-annexe-choix" title="Ajoute une page avec la moyenne et l’appréciation de chaque élève (celles de ✍ Appréciations)">
       <input type="checkbox" data-bpp-annexe> Appréciations en annexe</label>
     <button type="button" data-fermer>Fermer</button>
     <button type="button" class="primaire" data-bpp-imprimer>${iconeEcole('regarder')} Aperçu et PDF</button>`, 'modale-large modale-bpp');

  const dessiner = () => {
    const v = valeursBpp(c, periode, x);
    $('[data-bpp]', d).innerHTML = `
      <div class="bpp-haut">
        <label>Période<select name="periode">${periodesAnnee().map(p => `<option value="${p.id}" ${p.id === periode ? 'selected' : ''}>${p.code} (${esc(p.texte)})</option>`).join('')}
          <option value="annee" ${periode === 'annee' ? 'selected' : ''}>Toute l’année</option></select></label>
        <label>Remis à (professeur principal)<input name="pp" value="${esc(v.pp)}" placeholder="Mme Durand" autocomplete="off"></label>
      </div>
      <h3>① La classe</h3>
      <p class="aide">Moyenne ${fmt1(x.moyClasse)}${x.presence !== null ? ` · présence ${x.presence} %` : ''} · ${x.tenue} ${oubliTenue(x.tenue)}${x.activites.length ? ' · ' + esc(x.activites.join(', ')) : ''}</p>
      <label class="bpp-bloc">En quelques mots <span class="aide">(proposé par l’appli d’après les notes et les ${esc(motMin('lecons'))})</span>
        <textarea name="classe" rows="3">${esc(v.classe)}</textarea></label>
      <button type="button" class="petit" data-bpp-reprendre>↺ Reprendre la proposition</button>
      <h3>② Mentions et ③ élèves à signaler</h3>
      <div class="bpp-defile"><table class="bpp-eleves">
        <thead><tr><th>Élève</th><th>Moy.</th><th>Mention proposée</th><th>À signaler</th><th>Remarque pour le conseil</th></tr></thead>
        <tbody>${v.eleves.map(l => `<tr data-bpp-eleve="${l.el.id}">
          <th>${esc(l.el.nom)} ${esc(l.el.prenom)}</th>
          <td>${fmt1(l.moy)}</td>
          <td><select name="mention">${mentionsBpp([l.mentionK]).map(k => `<option value="${esc(k)}" ${k === l.mentionK ? 'selected' : ''}>${esc(nomMentionBpp(k))}</option>`).join('')}</select></td>
          <td><label class="case"><input type="checkbox" name="signale" ${l.aSignaler ? 'checked' : ''}>
            <span class="bpp-signaux info-sensible">${l.signaux.map(s => `<span class="bpp-pil bpp-${s.ton}">${esc(s.t)}</span>`).join('')}</span></label></td>
          <td><input name="remarque" class="info-sensible" value="${esc(l.remarque)}" placeholder="${l.aSignaler ? 'Ce que le conseil doit savoir' : ''}" autocomplete="off"></td>
        </tr>`).join('')}</tbody></table></div>
      <h3>④ Élèves à valoriser au conseil</h3>
      <p class="aide">Ceux dont le conseil peut saluer les efforts ou les réussites : l’appli coche ceux qui ont un point fort marquant, tu coches qui tu veux.</p>
      <div class="bpp-defile"><table class="bpp-eleves">
        <thead><tr><th>Élève</th><th>Moy.</th><th>À valoriser</th><th>Remarque pour le conseil</th></tr></thead>
        <tbody>${v.eleves.map(l => `<tr data-bpp-valo="${l.el.id}">
          <th>${esc(l.el.nom)} ${esc(l.el.prenom)}</th>
          <td>${fmt1(l.moy)}</td>
          <td><label class="case"><input type="checkbox" name="valorise" ${l.aValoriser ? 'checked' : ''}>
            <span class="bpp-signaux">${l.forts.map(s => `<span class="bpp-pil bpp-ok">${esc(s.t)}</span>`).join('')}</span></label></td>
          <td><input name="remarqueValo" value="${esc(l.remarqueValo)}" placeholder="${l.aValoriser ? 'Ce que le conseil peut saluer' : ''}" autocomplete="off"></td>
        </tr>`).join('')}</tbody></table></div>
      <label class="bpp-bloc">⑤ Ce que je voudrais que tu dises au conseil
        <textarea name="message" rows="3" placeholder="Merci de féliciter la classe pour… / de rappeler aux familles que…">${esc(v.message)}</textarea></label>
      <p class="aide">PAI et BEP ne sont jamais écrits sur la feuille. Les appréciations en annexe sont celles de ✍ Appréciations.</p>`;
    $('[data-bpp-annexe]', d).checked = v.annexe; // (case du bas de la fenêtre : gardée pour chaque période)
  };

  // Enregistre ce qui diffère de la proposition (dans la classe, pour cette période).
  const enregistrer = () => {
    const corps = $('[data-bpp]', d), cl = Donnees.get('classes', c.id);
    const eleves = {};
    for (const tr of corps.querySelectorAll('[data-bpp-eleve]')) {
      const l = x.lignes.find(y => y.el.id === tr.dataset.bppEleve), v = {};
      const mention = $('[name="mention"]', tr).value, signale = $('[name="signale"]', tr).checked, remarque = $('[name="remarque"]', tr).value.trim();
      if (mention !== l.mention.k) v.mention = mention;
      if (signale !== l.signale) v.signale = signale;
      if (remarque) v.remarque = remarque;
      const tv = corps.querySelector(`[data-bpp-valo="${l.el.id}"]`);
      if (tv) {
        const valorise = $('[name="valorise"]', tv).checked, remarqueValo = $('[name="remarqueValo"]', tv).value.trim();
        if (valorise !== l.valorise) v.valorise = valorise;
        if (remarqueValo) v.remarqueValo = remarqueValo;
      }
      if (Object.keys(v).length) eleves[l.el.id] = v;
    }
    const texte = $('[name="classe"]', corps).value.trim(), pp = $('[name="pp"]', corps).value.trim();
    const st = { pp, message: $('[name="message"]', corps).value.trim(), annexe: $('[data-bpp-annexe]', d).checked, eleves };
    if (texte && texte !== texteClasseBpp(x)) st.classe = texte;
    const bilan = { ...(cl.bilanPP || {}), [periode]: st, pp }; // (le nom du PP sert aussi aux autres périodes)
    if (JSON.stringify(cl.bilanPP || {}) !== JSON.stringify(bilan)) { Donnees.ecrire('classes', { ...cl, bilanPP: bilan }); Object.assign(c, { bilanPP: bilan }); }
  };

  dessiner();
  let minuteur = null; // (pendant la frappe : enregistré après une courte pause)
  d.addEventListener('input', e => { if (e.target.matches('input:not([type=checkbox]), textarea')) { clearTimeout(minuteur); minuteur = setTimeout(enregistrer, 400); } });
  d.addEventListener('change', e => {
    if (e.target.name === 'periode') { enregistrer(); periode = e.target.value; x = calculerBpp(c, periode); return dessiner(); }
    if (e.target.closest('[data-bpp], [data-bpp-annexe]')) enregistrer();
  });
  d.addEventListener('click', e => {
    if (e.target.closest('[data-bpp-reprendre]')) { $('[name="classe"]', d).value = texteClasseBpp(x); enregistrer(); }
    if (e.target.closest('[data-bpp-imprimer]')) { clearTimeout(minuteur); enregistrer(); lancer(() => apercuBilanPP(Donnees.get('classes', c.id), periode, x)); }
  });
  await resultat;
}

/* ---------- Feuille : dessinée une fois (dessinpdf.js), puis aperçu, vrai PDF ou impression ----------
   A4 portrait, en points (595 × 842). Couleurs fixes : c'est du papier. Helvetica (accents français en Windows-1252). */

const C_BPP = { texte: '#1d2a26', gris: '#5b6965', vert: '#1f6f5c', vertDoux: '#e3f1ec', tuile: '#f1f4f3', filet: '#dfe5e3', cadre: '#9aa8a4',
  ok: ['#dcefdc', '#1e6a2c'], info: ['#dde9f7', '#1d4f8a'], alerte: ['#fde2e1', '#9b1c1c'], attention: ['#fdf0d5', '#8a5300'], neutre: ['#eef1f0', '#4a5753'] };
const couleursMentionBpp = k => C_BPP[classeMentionBpp(k).replace('bpp-', '')] || C_BPP.info;
const quandBpp = periode => {
  if (periode === 'annee') return 'Bilan de l’année';
  const code = periodesAnnee().find(y => y.id === periode)?.code || '';
  return { T1: '1er trimestre', T2: '2e trimestre', T3: '3e trimestre', S1: '1er semestre', S2: '2e semestre' }[code] || code;
};

function dessinerBilanPP(c, periode, x) {
  const v = valeursBpp(c, periode, x), a = reglage('apparence'), C = C_BPP, quand = quandBpp(periode);
  const L = 595, H = 842, M = 36, W = L - 2 * M, BAS = H - 44, COL = 112;
  const d = DessinPdf({ l: L, h: H, titre: `Bilan pour le PP ${c.nom} ${nomPeriodeBpp(periode)}` });
  let y = M + 8, num = 0;
  // Plus la place sur la page : on passe à la suivante (et on redessine l'en-tête d'un tableau si besoin).
  const place = (h, enTete) => { if (y + h > BAS) { d.nouvellePage(); y = M + 8; enTete?.(); } };
  const filet = () => { d.rect(M, y, W, 0.5, { fond: C.filet }); };
  const titre = (t, suite = '') => {
    place(44);
    num++;
    d.cercle(M + 7, y - 3.5, 7, { fond: C.vertDoux });
    d.texte(M + 7, y, String(num), { taille: 8, gras: true, couleur: C.vert, ancre: 'milieu' });
    d.texte(M + 20, y, t, { taille: 10.5, gras: true, couleur: C.vert });
    const lt = d.largeurTexte(t, 10.5, true);
    if (suite) d.texte(M + 26 + lt, y, d.tenir(suite, W - 40 - lt, 8.5), { taille: 8.5, couleur: C.gris });
    y += 6; filet(); y += 14;
  };
  const texte = (t, o = {}) => {
    const taille = o.taille || 9.5, pas = taille * 1.38;
    for (const ln of d.couper(t, o.w || W, taille)) { place(pas); d.texte(o.x ?? M, y, ln, { taille, couleur: o.couleur || C.texte }); y += pas; }
  };
  const pastille = (px, py, t, [fond, encre]) => {
    const w = d.largeurTexte(t, 7.5, true) + 10;
    d.rect(px, py - 8.5, w, 12, { fond, rayon: 3 });
    d.texte(px + 5, py, t, { taille: 7.5, gras: true, couleur: encre });
    return w;
  };
  // Ligne « nom à gauche » + à droite : pastilles (passent à la ligne), texte, remarque en gris.
  const ligne = (gauche, { pastilles = [], texteDroite = '', remarque = '', gaucheEnPastille = null } = {}) => {
    const xr = M + COL, wr = W - COL, pos = [];
    let px = 0, rang = 0;
    for (const [t, col] of pastilles) {
      const w = d.largeurTexte(t, 7.5, true) + 10;
      if (px && px + w > wr) { rang++; px = 0; }
      pos.push({ t, col, px, rang }); px += w + 4;
    }
    const rangs = pastilles.length ? rang + 1 : 0;
    const lt = texteDroite ? d.couper(texteDroite, wr, 9.5) : [], lr = remarque ? d.couper(remarque, wr, 8.5) : [];
    const bases = pos.map(p => p.rang * 15);
    let suite = rangs ? rangs * 15 - 1 : 0;
    const basesTexte = lt.map((_, i) => suite + i * 13);
    if (lt.length) suite += lt.length * 13;
    const basesRem = lr.map((_, i) => suite + i * 11);
    const h = Math.max(0, ...bases, ...basesTexte, ...basesRem) + 6;
    place(h + 14);
    if (gaucheEnPastille) pastille(M, y, gauche, gaucheEnPastille);
    else d.texte(M, y, d.tenir(gauche, COL - 6, 9.5, true), { taille: 9.5, gras: true, couleur: C.texte });
    for (const p of pos) pastille(xr + p.px, y + p.rang * 15, p.t, p.col);
    lt.forEach((t, i) => d.texte(xr, y + basesTexte[i], t, { taille: 9.5, couleur: C.texte }));
    lr.forEach((t, i) => d.texte(xr, y + basesRem[i], t, { taille: 8.5, couleur: C.gris }));
    y += h; filet(); y += 14;
  };

  // En-tête
  d.texte(M, y, `${a.etablissement ? a.etablissement + ' · ' : ''}Conseil de classe · ${quand}`, { taille: 8.5, couleur: C.gris });
  d.texte(L - M, y, `Remis le ${dateCourte(aujourdhui())}${v.pp ? ` à ${v.pp}` : ''}`, { taille: 8.5, couleur: C.gris, ancre: 'fin' });
  d.texte(L - M, y + 11, 'Confidentiel — à détruire après le conseil', { taille: 8.5, gras: true, couleur: C.alerte[1], ancre: 'fin' });
  y += 24;
  d.texte(M, y, d.tenir(`Bilan pour le conseil — ${c.nom}`, W, 18, true), { taille: 18, gras: true, couleur: C.texte });
  y += 15;
  d.texte(M, y, `${profil().nom}${a.prof ? ` · ${a.prof}` : ''} · absent${a.prof && /^(mme|mlle)\b/i.test(a.prof) ? 'e' : ''} au conseil`, { taille: 9, couleur: C.gris });
  y += 9; d.rect(M, y, W, 1.6, { fond: C.vert }); y += 22;

  // ① La classe en un coup d'œil : tuiles
  titre('La classe en un coup d’œil');
  const evol = x.moyClasse !== null && x.moyClasseAvant !== null ? ` · ${x.moyClasse >= x.moyClasseAvant ? '+' : '−'}${fmt1(Math.abs(x.moyClasse - x.moyClasseAvant))} depuis le ${nomPeriodeBpp(x.avant)}` : '';
  const tuiles = [['Moyenne de la classe', fmt1(x.moyClasse), x.min !== null ? `de ${fmt1(x.min)} à ${fmt1(x.max)}${evol}` : '']];
  if (x.presence !== null) tuiles.push(['Présence en cours', `${x.presence} %`, x.absentsSouvent ? `${x.absentsSouvent} élève${x.absentsSouvent > 1 ? 's' : ''} souvent absent${x.absentsSouvent > 1 ? 's' : ''}` : '']);
  tuiles.push([`Oublis ${mot('deTenue')}`, String(x.tenue), x.tenueSouvent.length ? `dont ${x.tenueSouvent.reduce((n, l) => n + l.vs.tenue, 0)} pour ${x.tenueSouvent.length} élève${x.tenueSouvent.length > 1 ? 's' : ''}` : '']);
  if (x.activites.length) tuiles.push(['Au programme', null, '', x.activites.slice(0, 3)]);
  const tw = (W - 8 * (tuiles.length - 1)) / tuiles.length, th = 56;
  place(th + 12);
  tuiles.forEach(([lib, val, sous, liste], i) => {
    const tx = M + i * (tw + 8);
    d.rect(tx, y - 10, tw, th, { fond: C.tuile, rayon: 6 });
    d.texte(tx + 8, y + 2, d.tenir(lib, tw - 16, 7.5), { taille: 7.5, couleur: C.gris });
    if (liste) liste.forEach((t, k) => d.texte(tx + 8, y + 16 + k * 11, d.tenir(t, tw - 16, 9.5, true), { taille: 9.5, gras: true, couleur: C.texte }));
    else {
      d.texte(tx + 8, y + 22, val, { taille: 16, gras: true, couleur: C.texte });
      if (sous) d.texte(tx + 8, y + 36, d.tenir(sous, tw - 16, 7.5), { taille: 7.5, couleur: C.gris });
    }
  });
  y += th + 8;
  if (v.classe) { texte(v.classe); y += 6; }

  // ② Mentions
  titre('Mes propositions de mentions');
  const lignesMentions = mentionsBpp(v.eleves.map(l => l.mentionK)).filter(k => k !== 'aucune')
    .map(k => [k, v.eleves.filter(l => l.mentionK === k)]).filter(([, qui]) => qui.length);
  if (!lignesMentions.length) { texte('Aucune mention proposée.', { couleur: C.gris }); y += 6; }
  for (const [k, qui] of lignesMentions) {
    ligne(nomMentionBpp(k), { gaucheEnPastille: couleursMentionBpp(k),
      texteDroite: qui.map(l => `${l.el.nom} ${l.el.prenom}${l.mentionK === l.mention.k && l.mention.pourquoi ? ` (${l.mention.pourquoi})` : ''}`).join(', ') });
  }

  // ③ Élèves à signaler
  titre('Élèves à signaler au conseil');
  const signales = v.eleves.filter(l => l.aSignaler);
  if (!signales.length) { texte('Aucun élève à signaler.', { couleur: C.gris }); y += 6; }
  for (const l of signales) ligne(`${l.el.nom} ${l.el.prenom}`, { pastilles: l.signaux.map(s => [s.t, C[s.ton] || C.neutre]), remarque: l.remarque });

  // ④ Élèves à valoriser (seulement s'il y en a)
  const valorises = v.eleves.filter(l => l.aValoriser);
  if (valorises.length) {
    titre('Élèves à valoriser au conseil');
    for (const l of valorises) ligne(`${l.el.nom} ${l.el.prenom}`, { pastilles: l.forts.map(s => [s.t, C.ok]), remarque: l.remarqueValo });
  }

  // ⑤ Message au PP
  if (v.message) {
    titre('Ce que je voudrais que tu dises');
    const lignes = d.couper(v.message, W - 20, 9.5), h = lignes.length * 13 + 10;
    place(h + 6);
    d.rect(M, y - 12, W, h, { trait: C.cadre, ep: 0.7, tirets: [2.5, 2], rayon: 5 });
    lignes.forEach((t, i) => d.texte(M + 10, y + i * 13, t, { taille: 9.5, couleur: C.texte }));
    y += h + 4;
  }

  // Annexe : appréciations du bulletin (nouvelle page, en-tête du tableau répété)
  if (v.annexe) {
    d.nouvellePage(); y = M + 8;
    titre('Annexe : appréciations du bulletin', `— ${c.nom} · ${quand} · ${v.eleves.length} élèves`);
    const XM = M + COL, XA = M + COL + 34, WA = W - COL - 34;
    const enTete = () => {
      d.texte(M, y, 'Élève', { taille: 7.5, gras: true, couleur: C.gris });
      d.texte(XM, y, 'Moy.', { taille: 7.5, gras: true, couleur: C.gris });
      d.texte(XA, y, 'Appréciation', { taille: 7.5, gras: true, couleur: C.gris });
      y += 6; filet(); y += 14;
    };
    enTete();
    const eleves = x.lignes.map(z => z.el);
    for (const l of v.eleves) {
      const lignes = d.couper(appreciationEleve(l.el, periode, eleves).texte || '', WA, 8.8), h = Math.max(1, lignes.length) * 11.5 + 2;
      place(h + 12, enTete);
      d.texte(M, y, d.tenir(`${l.el.nom} ${l.el.prenom}`, COL - 6, 9, true), { taille: 9, gras: true, couleur: C.texte });
      d.texte(XM, y, fmt1(l.moy), { taille: 9, couleur: C.texte });
      lignes.forEach((t, i) => d.texte(XA, y + i * 11.5, t, { taille: 8.8, couleur: C.texte }));
      y += h; filet(); y += 13;
    }
  }

  // Pied de chaque page
  const n = d.pages.length;
  for (let i = 0; i < n; i++) {
    d.allerPage(i);
    d.texte(M, H - 24, `${c.nom} · ${quand} · Bilan pour le PP — confidentiel`, { taille: 7, couleur: C.gris });
    if (n > 1) d.texte(L - M, H - 24, `${i + 1} / ${n}`, { taille: 7, couleur: C.gris, ancre: 'fin' });
  }
  return d;
}

// Aperçu des pages, puis « Télécharger le PDF » ou « Imprimer » : les deux partent du même dessin.
async function apercuBilanPP(c, periode, x) {
  const dessin = dessinerBilanPP(c, periode, x), nom = `Bilan pour le PP ${c.nom} ${nomPeriodeBpp(periode)}`;
  const pages = dessin.pages.map((_, i) => dessin.versSvg(i));
  const { d, resultat } = ouvrirModale(`Aperçu — ${nom}`,
    `<p class="aide">${pages.length} page${pages.length > 1 ? 's' : ''} A4 : c’est exactement ce que contiendra le PDF ou la feuille imprimée.</p>
     <div class="apercu-pdf">${pages.map(s => `<div class="feuille-pdf">${s}</div>`).join('')}</div>`,
    `<button type="button" class="primaire" data-pdf>${iconeEcole('telecharger')}Télécharger le PDF</button>
     <button type="button" data-imprimer>${iconeEcole('imprimer')}Imprimer</button><span class="espace"></span>
     <button type="button" data-fermer autofocus>Retour</button>`, 'modale-large modale-apercu-pdf');
  iconeTitreModale(d, 'regarder');
  d.addEventListener('click', e => {
    if (e.target.closest('[data-pdf]')) lancer(async () => { telechargerBlob(new Blob([await dessin.versPdf()], { type: 'application/pdf' }), `${nom}.pdf`); toast('PDF enregistré dans tes téléchargements', 'ok'); });
    if (e.target.closest('[data-imprimer]')) imprimerZoneEcole(`<div class="impression-pdf">${pages.join('')}</div>`, nom);
  });
  await resultat;
}
