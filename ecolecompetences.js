'use strict';
/* ---------- Carnet École : compétences de l'école (accord de l'équipe) ----------
   L'équipe choisit, dans les objectifs du programme (programmeecole.js), ceux qu'elle travaille ; elle peut en ajouter.
   Seuls ceux-là sont proposés dans les évaluations (en plus des domaines du livret), selon le niveau de la classe.
   Rangé dans reglage('competences').accord ({ ids, ajouts, nom, date } ; null = pas encore d'accord : tout est proposé).
   Chaque collègue a son carnet : l'accord s'échange par un petit fichier .json (aucune donnée d'élève).
   Les objectifs deviennent des compétences ordinaires des évaluations (une colonne de degrés chacune) ; le livret
   s'en sert pour proposer le degré du domaine auquel ils appartiennent (degresEleve, ecole.js). */

// Matières qui ont des objectifs détaillés : [{ refId, ca, titre, champ }]
function matieresAvecObjectifs() {
  const res = [];
  for (const [refId, ref] of Object.entries(REFERENTIEL.refs)) {
    for (const [ca, ch] of Object.entries(ref.champs)) if (ch.objectifs) res.push({ refId, ca, titre: `${ch.titre} — ${ref.nom.replace(/^École — /, '')}`, champ: ch });
  }
  return res;
}
const niveauxObjectifs = ch => ['CP', 'CE1', 'CE2', 'CM1', 'CM2'].filter(n => ch.objectifs.some(o => !o.horsVigueur && o.niveaux.includes(n)));
const badgesNiveaux = o => o.niveaux.map(n => `<span class="badge-niveau">${esc(n)}</span>`).join('');

// Réglages du carnet › Compétences de l'école : où on en est, et le bouton pour choisir.
function htmlRubriqueAccordEcole() {
  const accord = reglage('competences').accord;
  const objectifs = matieresAvecObjectifs().flatMap(m => m.champ.objectifs).filter(o => !o.horsVigueur);
  const retenus = objectifs.filter(o => o.retenu).length;
  return `<p>${accord
    ? `<b>${esc(accord.nom || 'Accord de l’école')}</b> : ${retenus} objectif${retenus > 1 ? 's' : ''} retenu${retenus > 1 ? 's' : ''} sur ${objectifs.length}${accord.date ? ` (${esc(dateCourteAccord(accord.date))})` : ''}.`
    : 'Pas encore d’accord d’école : tous les objectifs du programme sont proposés dans les évaluations.'}</p>
    <button value="accord">${iconeEcole('cible')}Choisir les compétences de l’école…</button>
    <p class="aide">Français, maths, histoire-géographie, sciences et technologie, EMC, CM1 et CM2 : l’équipe coche les objectifs qu’elle travaille, en ajoute si besoin,
      puis donne le fichier aux collègues pour que tout le monde ait la même liste. Seuls ces objectifs sont proposés dans les évaluations.</p>`;
}
const dateCourteAccord = iso => iso.split('-').reverse().join('/');

async function gererAccordEcole() {
  const cfg = reglage('competences');
  const matieres = matieresAvecObjectifs();
  if (!matieres.length) return toast('Aucune matière n’a encore d’objectifs détaillés.', 'erreur');
  const tous = () => matieres.flatMap(m => m.champ.objectifs);
  // État de travail : objectifs retenus et ajoutés (tout est coché tant qu'il n'y a pas d'accord : c'est ce qui est proposé).
  let ajouts = structuredClone(cfg.accord?.ajouts || []);
  const ids = new Set(tous().filter(o => o.retenu).map(o => o.id)); // (une matière encore sans accord : tout est coché)
  const cles = matieres.map(m => `${m.refId}.${m.ca}`); // (en enregistrant, l'accord porte sur toutes les matières)
  let nom = cfg.accord?.nom || '';
  let matiere = matieres[0], filtre = '';
  const ouverts = new Set();
  const refaire = () => REFERENTIEL.personnaliser({ ...cfg, accord: { ids: [...ids], ajouts, matieres: cles } });

  const { d, resultat } = ouvrirModale('Compétences de l’école', `
    <p class="aide">Coche les objectifs du programme que l’équipe travaille. Seuls ceux-là seront proposés dans les évaluations,
      selon le niveau de la classe. Pour que tous les collègues aient la même liste : <b>Exporter</b>, puis chacun <b>Importe</b> le fichier
      (aucune donnée d’élève dedans).</p>
    <label>Nom de l’accord<input data-accord-nom maxlength="60" placeholder="ex. Accord cycle 3 — École Jules Ferry"></label>
    <div class="ligne accord-outils">
      ${matieres.length > 1 ? `<label>Matière<select data-accord-matiere>${matieres.map((m, i) => `<option value="${i}">${esc(m.titre)}</option>`).join('')}</select></label>` : `<p><b>${esc(matiere.titre)}</b></p>`}
      <div class="filtres-ecole" role="group" aria-label="Filtrer par niveau" data-accord-filtres></div>
    </div>
    <div class="zone-accord"></div>
    <div class="actions-reglages">
      <button type="button" data-accord-exporter>${iconeEcole('telecharger')}Exporter le fichier de l’école</button>
      <label class="bouton">${iconeEcole('partager')}Importer le fichier d’un collègue…<input type="file" accept=".json,application/json" data-accord-importer hidden></label>
    </div>`,
  boutonsModale('Enregistrer', cfg.accord ? '<button value="aucun" formnovalidate class="danger">Plus d’accord</button>' : ''), 'modale-large reglages');
  $('[data-accord-nom]', d).value = nom;
  $('[data-accord-nom]', d).addEventListener('input', ev => { nom = ev.target.value.trim(); });
  const zone = $('.zone-accord', d);

  const dessiner = () => {
    refaire();
    const ch = REFERENTIEL.refs[matiere.refId].champs[matiere.ca];
    const niveaux = niveauxObjectifs(ch);
    if (filtre && !niveaux.includes(filtre)) filtre = '';
    $('[data-accord-filtres]', d).innerHTML = ['', ...niveaux].map(n => `<button type="button" class="puce-ecole${n === filtre ? ' actif' : ''}" data-accord-filtre="${esc(n)}" aria-pressed="${n === filtre}">${n || 'Tous les niveaux'}</button>`).join('');
    const visibles = o => !filtre || o.niveaux.includes(filtre);
    zone.innerHTML = ch.domainesProgramme.map(dp => {
      const liste = ch.objectifs.filter(o => o.dom === dp.dom && !o.horsVigueur && visibles(o)); // (programme pas en vigueur cette année : caché, gardé tel quel)
      const n = liste.filter(o => ids.has(o.id)).length;
      const comps = [...dp.comps, { code: '', nom: 'Objectifs ajoutés par l’école' }];
      return `<details class="accord-dom" data-dom="${esc(dp.dom)}" ${ouverts.has(dp.dom) ? 'open' : ''}>
        <summary><b>${esc(dp.nom)}</b> <span class="aide">${n} / ${liste.length} retenu${n > 1 ? 's' : ''}</span></summary>
        <div class="champ-ref">
          <div class="ligne accord-tout">
            <button type="button" data-accord-tout="${esc(dp.dom)}">Tout cocher</button>
            <button type="button" data-accord-rien="${esc(dp.dom)}">Tout décocher</button>
          </div>
          ${comps.map(cp => {
    const objs = liste.filter(o => (cp.code ? o.comp === cp.code : o.perso && !dp.comps.some(x => x.code === o.comp)));
    if (!objs.length) return '';
    return `<h4 class="comp-accord">${cp.code ? `<b>${esc(cp.code)}</b> ` : ''}${esc(cp.nom)}</h4>${objs.map(o => `
            <label class="attendu-ref${ids.has(o.id) ? '' : ' masque'}">
              <input type="checkbox" data-accord-objectif="${esc(o.id)}" ${ids.has(o.id) ? 'checked' : ''}>
              <span class="texte-attendu"><b>${esc(o.code)}</b> ${esc(o.texte)} ${badgesNiveaux(o)}${o.perso ? ' <span class="badge-perso">ajouté</span>' : ''}</span>
              ${o.perso ? `<button type="button" class="icone-petit" data-accord-suppr="${esc(o.id)}" title="Supprimer cet objectif" aria-label="Supprimer">${iconeEcole('corbeille')}</button>` : ''}
            </label>`).join('')}`;
  }).join('')}
          <div class="ajout-accord">
            <select data-ajout-comp="${esc(dp.dom)}" aria-label="Compétence du programme">${dp.comps.filter(cp => ch.objectifs.some(o => o.comp === cp.code && !o.horsVigueur)).map(cp => `<option value="${esc(cp.code)}">${esc(cp.code)} ${esc(cp.nom)}</option>`).join('')}<option value="">Autre</option></select>
            <span class="niveaux-ajout">${niveaux.map(nv => `<label class="case"><input type="checkbox" data-ajout-niveau="${esc(dp.dom)}" value="${esc(nv)}" ${!filtre || filtre === nv ? 'checked' : ''}> ${esc(nv)}</label>`).join('')}</span>
            <input data-ajout-texte="${esc(dp.dom)}" maxlength="400" placeholder="Ajouter un objectif de l’école" aria-label="Texte de l’objectif">
            <button type="button" data-ajout-objectif="${esc(dp.dom)}">+ Ajouter</button>
          </div>
        </div></details>`;
    }).join('');
  };

  const ajouter = dom => {
    const champTexte = $(`[data-ajout-texte="${CSS.escape(dom)}"]`, zone), texte = champTexte.value.trim();
    if (!texte) return champTexte.focus();
    const niveaux = [...zone.querySelectorAll(`[data-ajout-niveau="${CSS.escape(dom)}"]:checked`)].map(x => x.value);
    if (!niveaux.length) return toast('Coche au moins un niveau.', 'erreur');
    const comp = $(`[data-ajout-comp="${CSS.escape(dom)}"]`, zone).value;
    const deja = ajouts.filter(x => x.refId === matiere.refId && x.ca === matiere.ca && (x.comp || x.dom) === (comp || dom)).length;
    const id = idPerso();
    ajouts.push({ id, refId: matiere.refId, ca: matiere.ca, dom, comp, niveaux, code: `${comp || dom}+${deja + 1}`, texte });
    ids.add(id);
    ouverts.add(dom);
    dessiner();
    $(`[data-ajout-texte="${CSS.escape(dom)}"]`, zone)?.focus();
  };
  const objectifsDuDomaine = dom => REFERENTIEL.refs[matiere.refId].champs[matiere.ca].objectifs.filter(o => o.dom === dom && !o.horsVigueur && (!filtre || o.niveaux.includes(filtre)));

  d.addEventListener('click', ev => {
    const b = ev.target.closest('button');
    if (!b) return;
    if (b.dataset.accordFiltre !== undefined) { filtre = b.dataset.accordFiltre; return dessiner(); }
    if (b.dataset.accordTout) { objectifsDuDomaine(b.dataset.accordTout).forEach(o => ids.add(o.id)); return dessiner(); }
    if (b.dataset.accordRien) { objectifsDuDomaine(b.dataset.accordRien).forEach(o => ids.delete(o.id)); return dessiner(); }
    if (b.dataset.ajoutObjectif) return ajouter(b.dataset.ajoutObjectif);
    if (b.dataset.accordSuppr) {
      const id = b.dataset.accordSuppr, n = evalsAvecCompetence(id).length;
      if (n) return toast(`Cet objectif sert dans ${n} évaluation${n > 1 ? 's' : ''} : décoche-le plutôt (il ne sera plus proposé).`, 'erreur');
      ajouts = ajouts.filter(x => x.id !== id);
      ids.delete(id);
      return dessiner();
    }
    if (b.matches('[data-accord-exporter]')) return exporterAccordEcole({ ids: [...ids], ajouts, matieres: cles, nom, date: aujourdhui() });
  });
  d.addEventListener('change', async ev => {
    const t = ev.target;
    if (t.dataset.accordObjectif) {
      t.checked ? ids.add(t.dataset.accordObjectif) : ids.delete(t.dataset.accordObjectif);
      t.closest('.attendu-ref').classList.toggle('masque', !t.checked);
      const det = t.closest('.accord-dom'), liste = objectifsDuDomaine(det.dataset.dom), n = liste.filter(o => ids.has(o.id)).length;
      $('summary .aide', det).textContent = `${n} / ${liste.length} retenu${n > 1 ? 's' : ''}`;
    } else if (t.matches('[data-accord-matiere]')) {
      matiere = matieres[+t.value];
      dessiner();
    } else if (t.matches('[data-accord-importer]') && t.files[0]) {
      const recu = await lireFichierAccord(t.files[0]).catch(err => { toast(err.message, 'erreur'); return null; });
      t.value = '';
      if (!recu) return;
      const n = recu.ids.length, a = recu.ajouts.length;
      if (!(await confirmer(`Remplacer la liste de l’école par celle du fichier${recu.nom ? ` « ${recu.nom} »` : ''} (${n} objectif${n > 1 ? 's' : ''} retenu${n > 1 ? 's' : ''}, dont ${a} ajouté${a > 1 ? 's' : ''}) ? `
        + 'Tes évaluations ne bougent pas. Il faudra ensuite enregistrer.', 'Remplacer'))) return;
      // (Les objectifs ajoutés ici restent connus, car des évaluations peuvent s'en servir ; ils ne sont plus cochés.)
      ajouts = [...recu.ajouts, ...ajouts.filter(x => !recu.ajouts.some(y => y.id === x.id))];
      // (Matières absentes du fichier ' un fichier de la v1.48 ne portait que sur le français ' : on garde ce qui est coché ici.)
      const duFichier = new Set(recu.matieres || ['ecoleCycle3.FR']);
      const gardes = tous().filter(o => ids.has(o.id) && !duFichier.has(`${o.refId}.${o.ca}`)).map(o => o.id);
      ids.clear();
      [...recu.ids, ...gardes].forEach(x => ids.add(x));
      if (recu.nom) { nom = recu.nom; $('[data-accord-nom]', d).value = recu.nom; }
      dessiner();
      toast('Liste de l’école reprise : vérifie, puis Enregistrer.', 'ok');
    }
  });
  zone.addEventListener('toggle', ev => {
    const det = ev.target.closest?.('.accord-dom');
    if (det) det.open ? ouverts.add(det.dataset.dom) : ouverts.delete(det.dataset.dom);
  }, true);
  // Entrée dans « Ajouter un objectif » : ajoute (au lieu de passer au champ suivant ou de valider la fenêtre).
  zone.addEventListener('keydown', ev => {
    if (ev.key !== 'Enter' || !ev.target.matches('[data-ajout-texte]')) return;
    ev.preventDefault();
    ev.stopPropagation();
    ajouter(ev.target.dataset.ajoutTexte);
  });
  dessiner();

  const r = await resultat;
  if (r.action === 'aucun') {
    if (await confirmer('Ne plus avoir d’accord d’école ? Tous les objectifs du programme seront de nouveau proposés. '
      + 'Les objectifs ajoutés sont gardés pour les évaluations qui s’en servent.', 'Plus d’accord')) {
      const garder = ajouts.filter(x => evalsAvecCompetence(x.id).length);
      ecrireReglage('competences', { accord: garder.length ? { ids: [...tous().filter(o => !o.perso).map(o => o.id), ...garder.map(x => x.id)], ajouts: garder, matieres: cles, nom: '', date: '' } : null });
      appliquerReglages(true);
      rendre();
      toast('Plus d’accord d’école : tout le programme est proposé ✔', 'ok');
    } else REFERENTIEL.personnaliser(reglage('competences'));
    return;
  }
  if (r.action !== 'ok') { REFERENTIEL.personnaliser(reglage('competences')); return; }
  ecrireReglage('competences', { accord: { ids: [...ids], ajouts, matieres: cles, nom, date: aujourdhui() } });
  appliquerReglages(true);
  rendre();
  toast(`Compétences de l’école enregistrées ✔ (${ids.size} objectif${ids.size > 1 ? 's' : ''})`, 'ok');
}

function exporterAccordEcole(accord) {
  const contenu = { format: 'carnet-ecole-accord', version: 1, appli: VERSION_APP, ...accord };
  const nom = `Compétences de l’école${accord.nom ? ' - ' + accord.nom : ''} ${aujourdhui()}.json`.replace(/[\\/:*?"<>|]/g, '-');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new File([JSON.stringify(contenu, null, 2)], nom, { type: 'application/json' }));
  a.download = nom;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 60000);
  toast('Fichier de l’école exporté ✔ (aucune donnée d’élève dedans) : donne-le à tes collègues.', 'ok');
}

async function lireFichierAccord(fichier) {
  let contenu;
  try { contenu = JSON.parse(await fichier.text()); } catch { contenu = null; }
  const propre = contenu?.format === 'carnet-ecole-accord' ? nettoyerAccord(contenu) : null;
  if (!propre) throw new Error('Ce fichier n’est pas un fichier « Compétences de l’école » du carnet.');
  return propre;
}

/* ---------- Dans la fenêtre d'une évaluation : objectifs de l'école, rangés par domaine du programme ---------- */

// HTML des objectifs proposés pour cette matière et ces niveaux (retenus par l'école, non masqués, ou déjà cochés).
function htmlObjectifsEval(champ, niveaux, coches) {
  if (!champ?.objectifs?.length) return '';
  const pourNiveau = o => !niveaux.length || o.niveaux.some(n => niveaux.includes(n));
  const proposes = champ.objectifs.filter(o => coches.has(o.id) || (o.retenu && !o.masque && !o.horsVigueur && pourNiveau(o)));
  const plusieurs = niveaux.length > 1;
  const groupes = champ.domainesProgramme.map(dp => {
    const liste = proposes.filter(o => o.dom === dp.dom);
    if (!liste.length) return '';
    const n = liste.filter(o => coches.has(o.id)).length;
    return `<details class="objectifs-dom" data-dom="${esc(dp.dom)}" ${n ? 'open' : ''}><summary>${esc(dp.nom)} <span class="aide" data-compte-objectifs>${n ? `${n} coché${n > 1 ? 's' : ''}` : ''}</span></summary>
      ${liste.map(o => `<label class="case competence"><input type="checkbox" name="competence" value="${esc(o.id)}" ${coches.has(o.id) ? 'checked' : ''}>
        <span><b>${esc(o.code)}</b> ${esc(o.texte)}${plusieurs && !niveaux.every(nv => o.niveaux.includes(nv)) ? ` ${badgesNiveaux(o)}` : ''}</span></label>`).join('')}</details>`;
  }).join('');
  const accord = reglage('competences').accord;
  return `<div class="objectifs-eval">
    <p class="titre-objectifs"><b>Objectifs du programme</b> <span class="aide">${niveaux.length ? esc(niveaux.join(', ')) + ' · ' : ''}${accord ? `liste de l’école${accord.nom ? ` (${esc(accord.nom)})` : ''}` : 'pas encore d’accord d’école : tout le programme'} — chaque objectif coché a sa colonne de degrés</span></p>
    ${groupes || '<p class="aide">Aucun objectif retenu par l’école pour ce niveau (Réglages › Compétences de l’école).</p>'}</div>`;
}
