'use strict';
// 📷 Trombinoscope : le PDF de la classe (une photo, le nom juste en dessous) est lu ICI, sur l'appareil,
// par le lecteur PDF de l'appli (edtpdf.js) : chaque photo est rattachée au texte écrit sous elle, puis ce texte
// est comparé aux noms / prénoms des élèves de la classe. L'enseignant vérifie et corrige avant d'enregistrer.
// La photo est réduite (vignette JPEG d'environ 10 Ko) et rangée sur la fiche de l'élève (el.photo) ; le PDF
// lui-même n'est ni gardé ni envoyé nulle part. Jamais affichée en mode élève.
// Trombinoscope en image (PNG, JPEG, capture d'écran) ou PDF scanné : lu par trombiimage.js.
// (Fichier chargé avant app.js : il n'utilise les outils d'app.js qu'au moment des appels.)

const Trombi = (() => {
  const TAILLE = 220, QUALITE = 0.82; // côté le plus long de la vignette (px), qualité JPEG

  const mots = s => sansAccent(s).replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
  const initiales = el => `${(el.prenom || '').trim()[0] || ''}${(el.nom || '').trim()[0] || ''}`.toUpperCase();

  // Distance d'édition ≤ 1 (une lettre en trop, en moins ou changée) : tolère une coquille du PDF.
  function proche(a, b) {
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0, j = 0, ecarts = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++ecarts > 1) return false;
      if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
    }
    return ecarts + (a.length - i) + (b.length - j) <= 1;
  }

  // Ressemblance entre le texte sous une photo et un élève : 1 = nom et prénom retrouvés.
  function score(texte, el) {
    const T = mots(texte);
    if (!T.length) return 0;
    const N = mots(el.nom), P = mots(el.prenom);
    const trouve = m => T.some(x => x === m || (m.length >= 5 && proche(x, m)));
    const n = N.length ? N.filter(trouve).length / N.length : 0, p = P.length ? P.filter(trouve).length / P.length : 0;
    if (!n) return p === 1 && N[0] && T.includes(N[0][0]) ? 0.45 : 0; // « Marie D. »
    return P.length ? n * 0.6 + p * 0.4 : n;
  }

  /* ---------- Lecture du PDF : photos + texte sous chacune ---------- */

  async function lirePdf(fichier) {
    if (!/\.pdf$/i.test(fichier.name) && fichier.type !== 'application/pdf') throw new Error('Il faut le trombinoscope en PDF.');
    const pages = await PdfTexte.lire(await fichier.arrayBuffer(), { images: true, pages: 20 });
    const photos = [];
    // Une même image répétée (silhouette « pas de photo ») n'est pas une vraie photo.
    const vues = new Map();
    for (const p of pages) for (const im of p.images) vues.set(im.flux, (vues.get(im.flux) || 0) + 1);
    for (const p of pages) {
      const imgs = p.images.filter(im => im.w > 15 && im.h > 15 && im.w < p.largeur * 0.6 && im.h < p.hauteur * 0.6);
      if (!imgs.length) continue;
      const textes = p.items.filter(t => /\p{L}/u.test(t.t));
      const sous = new Map(imgs.map(im => [im, []])), dessus = new Map(imgs.map(im => [im, []]));
      for (const t of textes) {
        const cx = (t.x + (t.fin ?? t.x)) / 2;
        let b = null, gb = Infinity, h = null, gh = Infinity;
        for (const im of imgs) {
          if (cx < im.x - im.w * 0.3 || cx > im.x + im.w * 1.3) continue;
          const ecart = im.y - (t.y + t.taille * 0.7); // haut du texte → bas de la photo
          if (ecart > -t.taille * 0.6 && ecart < im.h * 0.9 && ecart < gb) { b = im; gb = ecart; }
          const ecartH = t.y - (im.y + im.h); // texte au-dessus de la photo
          if (ecartH > -t.taille * 0.3 && ecartH < im.h * 0.6 && ecartH < gh) { h = im; gh = ecartH; }
        }
        if (b) sous.get(b).push(t);
        if (h) dessus.get(h).push(t);
      }
      // Le nom est normalement sous la photo ; s'il est au-dessus sur presque toute la page, on suit la page.
      const nb = m => [...m.values()].filter(l => l.length).length;
      const choix = nb(sous) >= nb(dessus) ? sous : dessus;
      // Photos dans l'ordre de lecture (rangées de haut en bas, puis de gauche à droite).
      imgs.sort((a, c) => (Math.abs(a.y + a.h - c.y - c.h) > Math.min(a.h, c.h) / 2 ? c.y + c.h - a.y - a.h : a.x - c.x));
      for (const im of imgs) {
        const lignes = choix.get(im).sort((a, c) => (Math.abs(a.y - c.y) > a.taille * 0.3 ? c.y - a.y : a.x - c.x));
        photos.push({ image: im, texte: lignes.map(t => t.t.trim()).join(' ').replace(/\s+/g, ' ').trim(), repetee: vues.get(im.flux) > 2 });
      }
    }
    if (!photos.length) {
      // PDF scanné (chaque page = une seule grande image) : il est lu comme une image (trombiimage.js).
      const scans = pages.flatMap(p => p.images.filter(im => im.w >= p.largeur * 0.6 || im.h >= p.hauteur * 0.6));
      const pagesImg = (await Promise.all(scans.map(im => im.dessiner(2400).catch(() => null)))).filter(Boolean);
      if (pagesImg.length) return { scans: pagesImg };
      throw new Error('Aucune photo trouvée dans ce PDF.');
    }
    for (const ph of photos) {
      const cv = ph.repetee ? null : await ph.image.dessiner(TAILLE).catch(() => null);
      ph.url = cv ? cv.toDataURL('image/jpeg', QUALITE) : '';
    }
    return photos.filter(ph => ph.url);
  }

  // Meilleure répartition photo ↔ élève : les paires les plus sûres d'abord, chacun au plus une fois.
  function apparier(photos, eleves) {
    const paires = [];
    photos.forEach((ph, i) => eleves.forEach(el => { const s = score(ph.texte, el); if (s >= 0.45) paires.push({ i, el, s }); }));
    paires.sort((a, b) => b.s - a.s);
    const prisP = new Set(), prisE = new Set();
    for (const { i, el, s } of paires) {
      if (prisP.has(i) || prisE.has(el.id)) continue;
      prisP.add(i); prisE.add(el.id);
      photos[i].eleve = el.id;
      photos[i].sur = s >= 0.99;
    }
  }

  /* ---------- Import : vérification par l'enseignant ---------- */

  const estImage = f => /^image\//.test(f.type) || /\.(png|jpe?g|webp|bmp|gif)$/i.test(f.name);

  // fichiers : un PDF, ou une ou plusieurs images (PNG, JPEG : capture d'écran, page enregistrée…).
  async function importer(c, fichiers) {
    const eleves = elevesDe(c.id);
    if (!eleves.length) throw new Error('Ajoute d’abord les élèves de la classe : les photos sont rattachées à leurs noms.');
    toast('Lecture du trombinoscope…');
    const photos = [], images = [];
    for (const f of [].concat(fichiers)) {
      if (estImage(f)) { images.push(f); continue; }
      const lu = await lirePdf(f);
      if (lu.scans) images.push(...lu.scans); else photos.push(...lu);
    }
    apparier(photos, eleves);
    let style = null;
    if (images.length) {
      toast('Lecture de l’image : l’appli s’entraîne sur les noms de la classe…');
      const deja = new Set(photos.map(p => p.eleve).filter(Boolean));
      const lu = await TrombiImage.lire(images, eleves.filter(el => !deja.has(el.id)));
      photos.push(...lu.photos);
      style = lu.style;
    }
    if (!photos.length) throw new Error('Aucune photo trouvée.');
    const trouves = photos.filter(p => p.eleve).length, doutes = photos.filter(p => p.eleve && !p.sur).length;
    const sansPhoto = eleves.filter(el => !photos.some(p => p.eleve === el.id));
    const options = id => `<option value="">— ne pas garder —</option>${eleves.map(el =>
      `<option value="${el.id}" ${el.id === id ? 'selected' : ''}>${esc(`${el.nom} ${el.prenom}`)}</option>`).join('')}`;
    const { d, resultat } = ouvrirModale(`Trombinoscope — ${c.nom}`, `
      <p><b>${photos.length} photo${photos.length > 1 ? 's' : ''}</b> trouvée${photos.length > 1 ? 's' : ''} · <b>${trouves}</b> rattachée${trouves > 1 ? 's' : ''} à un élève
        ${doutes ? ` · <span class="doute-trombi">${doutes} à vérifier</span>` : ''}</p>
      ${style ? `<p class="aide">🧠 L’appli s’est entraînée sur ton image : noms écrits « ${esc(TrombiImage.presentationLue(style.cle))} ».</p>` : ''}
      ${sansPhoto.length ? `<p class="aide">Sans photo : ${sansPhoto.slice(0, 12).map(el => esc(`${el.nom} ${el.prenom}`)).join(', ')}${sansPhoto.length > 12 ? '…' : ''}</p>` : ''}
      <p class="aide">Vérifie chaque vignette : le nom ${images.length ? 'découpé' : 'lu'} sous la photo est rappelé en petit. Change l’élève dans la liste si besoin.</p>
      <div class="grille-trombi import-trombi">${photos.map((p, i) => `
        <figure class="vignette-trombi${p.eleve ? (p.sur ? '' : ' doute') : ' inconnu'}">
          <img src="${p.url}" alt="">
          <figcaption>${p.nomImage ? `<img class="nom-trombi" src="${p.nomImage}" alt="Nom découpé sous la photo" title="Nom découpé sous la photo">`
            : `<small class="lu-trombi" title="Texte lu sous la photo">${esc(p.texte || '(aucun nom lu)')}</small>`}
            <select name="ph${i}" data-trombi-choix aria-label="Élève de la photo ${i + 1}">${options(p.eleve)}</select></figcaption>
        </figure>`).join('')}</div>
      <label class="case"><input type="checkbox" name="remplacer" checked><span>Remplacer les photos déjà enregistrées</span></label>
      <p class="aide">Le fichier est lu sur cet appareil et n’est envoyé nulle part ; seules les vignettes choisies sont gardées dans le carnet.</p>`,
    boutonsModale('Enregistrer les photos'), 'modale-large');
    // Un élève ne peut recevoir qu'une photo : le choisir ailleurs libère l'autre vignette.
    d.addEventListener('change', e => {
      const s = e.target.closest('[data-trombi-choix]');
      if (!s) return;
      if (s.value) d.querySelectorAll('[data-trombi-choix]').forEach(x => { if (x !== s && x.value === s.value) { x.value = ''; x.closest('figure').className = 'vignette-trombi inconnu'; } });
      s.closest('figure').className = 'vignette-trombi' + (s.value ? '' : ' inconnu');
    });
    const r = await resultat;
    if (r.action !== 'ok') return;
    let n = 0;
    photos.forEach((p, i) => {
      const id = r.data['ph' + i];
      const el = id && Donnees.get('eleves', id);
      if (!el || (el.photo && r.data.remplacer !== 'on')) return;
      Donnees.ecrire('eleves', { ...el, photo: p.url });
      n++;
    });
    rendre();
    toast(`${n} photo${n > 1 ? 's' : ''} enregistrée${n > 1 ? 's' : ''} pour ${c.nom}.`, 'ok');
  }

  const choisirFichier = (accept, suite) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.addEventListener('change', () => { if (input.files[0]) lancer(() => suite(input.files[0])); });
    input.click();
  };

  // Une photo isolée (appareil photo de la tablette, image) → vignette.
  async function vignette(fichier) {
    const bmp = await createImageBitmap(fichier);
    const r = Math.min(1, TAILLE / Math.max(bmp.width, bmp.height)), cv = document.createElement('canvas');
    cv.width = Math.round(bmp.width * r); cv.height = Math.round(bmp.height * r);
    cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
    bmp.close?.();
    return cv.toDataURL('image/jpeg', QUALITE);
  }

  function retirer(id) {
    const { photo, ...reste } = Donnees.get('eleves', id) || {};
    if (photo) Donnees.ecrire('eleves', reste);
  }

  /* ---------- Trombinoscope de la classe ---------- */

  async function voir(c, ouvrirEleve = null) {
    if (!c) return;
    const eleves = elevesDe(c.id), avec = eleves.filter(el => el.photo).length;
    const { d, resultat } = ouvrirModale(`Trombinoscope — ${c.nom}`, `
      <p class="aide">${avec} photo${avec > 1 ? 's' : ''} sur ${eleves.length} élève${eleves.length > 1 ? 's' : ''}.
        Importe le trombinoscope de la classe (PDF, ou image PNG / JPEG) : l’appli lit le nom sous chaque photo et la range sur la bonne fiche.</p>
      <div class="grille-trombi">${eleves.map(el => `
        <figure class="vignette-trombi${el.id === ouvrirEleve ? ' surbrillance' : ''}" data-trombi-eleve="${el.id}">
          ${el.photo ? `<img src="${el.photo}" alt="">` : `<span class="sans-photo" aria-hidden="true">${esc(initiales(el))}</span>`}
          <figcaption><b>${esc(el.nom)}</b> ${esc(el.prenom)}</figcaption>
          <span class="actions-trombi">
            <button type="button" class="icone-petit" data-trombi-changer="${el.id}" title="Prendre ou choisir une photo" aria-label="Changer la photo de ${esc(el.nom)}">📷</button>
            ${el.photo ? `<button type="button" class="icone-petit" data-trombi-retirer="${el.id}" title="Retirer la photo" aria-label="Retirer la photo de ${esc(el.nom)}">✕</button>` : ''}
          </span>
        </figure>`).join('')}</div>`,
    `<button value="pdf" class="primaire">📄 Importer le trombinoscope (PDF ou image)</button>
     ${avec ? '<button value="retirer" class="danger">Retirer toutes les photos</button>' : ''}
     <span class="espace"></span><button type="button" data-fermer>Fermer</button>`, 'modale-large');
    if (ouvrirEleve) d.querySelector('.surbrillance')?.scrollIntoView({ block: 'center' });
    d.addEventListener('click', e => {
      const ch = e.target.closest('[data-trombi-changer]'), rt = e.target.closest('[data-trombi-retirer]');
      if (ch) choisirFichier('image/*', async f => {
        const el = Donnees.get('eleves', ch.dataset.trombiChanger);
        Donnees.ecrire('eleves', { ...el, photo: await vignette(f) });
        d.fermer(); rendre(); voir(c, el.id);
      });
      if (rt) { retirer(rt.dataset.trombiRetirer); d.fermer(); rendre(); voir(c, rt.dataset.trombiRetirer); }
    });
    const r = await resultat;
    if (r.action === 'pdf') guideImport('trombi', f => importer(c, f));
    if (r.action === 'retirer' && (await confirmer(`Retirer les ${avec} photos de ${c.nom} ?`, 'Retirer'))) {
      eleves.forEach(el => retirer(el.id));
      rendre();
      toast('Photos retirées.', 'ok');
    }
  }

  // Petite photo (liste des élèves, recherche) ; rien en mode élève.
  const mini = (el, classe = 'mini-photo') => (el.photo && !(typeof enModeEleve === 'function' && enModeEleve())
    ? `<img class="${classe}" src="${el.photo}" alt="">` : '');

  // Titre d'une fiche élève : sa photo (s'il en a une), puis le texte.
  const titre = (el, texte) => `${mini(el, 'photo-fiche')}<span>${esc(texte)}</span>`;

  return { voir, importer, mini, titre, lirePdf, score };
})();

// Vignette de la liste des élèves : ouvre le trombinoscope sur cet élève.
document.addEventListener('click', e => {
  const b = e.target.closest?.('[data-photo-eleve]');
  if (!b || b.closest('dialog')) return;
  const el = Donnees.get('eleves', b.dataset.photoEleve);
  if (el) lancer(() => Trombi.voir(Donnees.get('classes', el.classeId), el.id));
});
