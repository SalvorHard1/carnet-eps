'use strict';
// Justificatif de dispense : une photo prise avec la caméra de l'appli (cadre pour viser la feuille) ou un fichier
// joint (image ou PDF). Il est rangé dans la collection « documents » du carnet (il suit sur la clé et la tablette) ;
// l'élève garde son id dans `dispJustif` (dispense en cours), chaque ancienne dispense dans `justif` (dispensesPassees).
// Une seule pièce par dispense. Gardé jusqu'à la fin de l'année scolaire de la dispense, puis effacé (purgerJustificatifs).
// Rien ne sort de l'appareil. (Fichier chargé avant app.js : il n'utilise les outils d'app.js qu'au moment des appels.)

const JUSTIF_COTE_MAX = 1600; // px : la feuille reste lisible, la photo pèse environ 200 à 400 Ko
const JUSTIF_QUALITE = 0.72;
const JUSTIF_MINI = 120; // vignette affichée dans la liste des élèves
const RAPPORT_FEUILLE = Math.SQRT2; // A4, A5 : hauteur = largeur × √2

const docJustif = id => (id ? Donnees.get('documents', id) : null);
const estImageJustif = doc => /^image\//.test(doc?.type || '');

// Morceau d'une image (vidéo, photo) → JPEG réduit + vignette.
function imageJustif(source, sx, sy, sw, sh) {
  const r = Math.min(1, JUSTIF_COTE_MAX / Math.max(sw, sh));
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.round(sw * r));
  cv.height = Math.max(1, Math.round(sh * r));
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, cv.width, cv.height);
  const contenu = cv.toDataURL('image/jpeg', JUSTIF_QUALITE).split(',')[1];
  const rm = JUSTIF_MINI / Math.max(cv.width, cv.height);
  const m = document.createElement('canvas');
  m.width = Math.max(1, Math.round(cv.width * rm));
  m.height = Math.max(1, Math.round(cv.height * rm));
  m.getContext('2d').drawImage(cv, 0, 0, m.width, m.height);
  return { type: 'image/jpeg', contenu, taille: Math.round(contenu.length * 3 / 4), mini: m.toDataURL('image/jpeg', 0.7) };
}

// Cadre de la feuille dans l'image (w × h) : portrait ou paysage, 90 % de la place au plus, centré.
function cadreJustif(w, h, paysage) {
  let cw, ch;
  if (paysage) { cw = w * 0.9; ch = cw / RAPPORT_FEUILLE; if (ch > h * 0.9) { ch = h * 0.9; cw = ch * RAPPORT_FEUILLE; } }
  else { ch = h * 0.9; cw = ch / RAPPORT_FEUILLE; if (cw > w * 0.9) { cw = w * 0.9; ch = cw * RAPPORT_FEUILLE; } }
  return { x: Math.round((w - cw) / 2), y: Math.round((h - ch) / 2), w: Math.round(cw), h: Math.round(ch) };
}

// Viseur : l'image de la caméra, l'extérieur du cadre assombri, des coins blancs pour placer la feuille.
function dessinerViseur(ctx, video, cadre) {
  const { width: W, height: H } = ctx.canvas;
  ctx.drawImage(video, 0, 0, W, H);
  ctx.fillStyle = 'rgba(0,0,0,.5)';
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.rect(cadre.x, cadre.y, cadre.w, cadre.h);
  ctx.fill('evenodd');
  const l = Math.min(cadre.w, cadre.h) * 0.12, e = Math.max(4, W / 160);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = e;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const [x, y, dx, dy] of [[cadre.x, cadre.y, 1, 1], [cadre.x + cadre.w, cadre.y, -1, 1], [cadre.x, cadre.y + cadre.h, 1, -1], [cadre.x + cadre.w, cadre.y + cadre.h, -1, -1]]) {
    ctx.moveTo(x + dx * l, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy * l);
  }
  ctx.stroke();
}

// Fenêtre caméra → image (ou null si on annule). « Choisir une image » reste possible depuis la fenêtre.
async function photographierJustif(el) {
  if (!navigator.mediaDevices?.getUserMedia) {
    toast('La caméra n’est pas disponible ici : choisis une photo déjà prise.', 'erreur');
    return choisirImageJustif();
  }
  let flux;
  try {
    flux = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1440 } } });
  } catch (e) {
    throw new Error(e?.name === 'NotAllowedError' ? 'Caméra refusée : autorise-la pour ce site dans les réglages du navigateur, ou touche « Joindre » pour choisir une photo.' : 'Impossible d’ouvrir la caméra. Touche « Joindre » pour choisir une photo.');
  }
  const video = document.createElement('video');
  Object.assign(video, { muted: true, playsInline: true, srcObject: flux });
  await video.play().catch(() => {});

  const { d, resultat } = ouvrirModale(`Photo du justificatif — ${el.nom} ${el.prenom}`, `
    <p class="aide" data-consigne-justif>Pose la feuille à plat, bien éclairée, et place-la dans le cadre.</p>
    <div class="viseur-justif info-sensible"><canvas data-viseur-justif aria-label="Image de la caméra"></canvas></div>
    <div class="outils-viseur">
      <button type="button" data-sens-justif aria-pressed="false">↻ Feuille en paysage</button>
      <button type="button" data-choisir-justif>📎 Choisir une image</button>
    </div>`,
  `<span class="espace"></span><button type="button" data-fermer>Annuler</button>
    <button type="button" data-reprendre-justif hidden>Reprendre</button>
    <button type="button" class="primaire" data-prendre-justif>${iconeEcole('appareilPhoto')}Prendre la photo</button>
    <button value="ok" class="primaire" data-garder-justif hidden>Garder cette photo</button>`, 'modale-large');

  const cv = $('[data-viseur-justif]', d), ctx = cv.getContext('2d');
  let paysage = false, fige = false, image = null, boucle = 0;
  const dessiner = () => {
    boucle = requestAnimationFrame(dessiner);
    if (fige || !video.videoWidth) return;
    if (cv.width !== video.videoWidth || cv.height !== video.videoHeight) { cv.width = video.videoWidth; cv.height = video.videoHeight; }
    dessinerViseur(ctx, video, cadreJustif(cv.width, cv.height, paysage));
  };
  dessiner();
  const etat = pris => {
    fige = pris;
    $('[data-prendre-justif]', d).hidden = pris;
    $('[data-reprendre-justif]', d).hidden = !pris;
    $('[data-garder-justif]', d).hidden = !pris;
    $('.outils-viseur', d).hidden = pris;
    $('[data-consigne-justif]', d).textContent = pris ? 'La feuille est-elle lisible ? Sinon, reprends la photo.' : 'Pose la feuille à plat, bien éclairée, et place-la dans le cadre.';
  };
  $('[data-sens-justif]', d).addEventListener('click', e => {
    paysage = !paysage;
    e.currentTarget.setAttribute('aria-pressed', paysage);
    e.currentTarget.textContent = paysage ? '↻ Feuille en portrait' : '↻ Feuille en paysage';
  });
  $('[data-prendre-justif]', d).addEventListener('click', () => {
    if (!video.videoWidth) return toast('La caméra démarre… réessaie dans un instant.');
    const c = cadreJustif(video.videoWidth, video.videoHeight, paysage);
    image = imageJustif(video, c.x, c.y, c.w, c.h);
    // Aperçu : la photo gardée, seule, à la place du viseur.
    const apercu = new Image();
    apercu.onload = () => { cv.width = apercu.width; cv.height = apercu.height; ctx.drawImage(apercu, 0, 0); };
    apercu.src = 'data:image/jpeg;base64,' + image.contenu;
    etat(true);
  });
  $('[data-reprendre-justif]', d).addEventListener('click', () => { image = null; etat(false); });
  let choisie = null;
  $('[data-choisir-justif]', d).addEventListener('click', async () => {
    choisie = await choisirImageJustif().catch(e => { toast(e.message, 'erreur'); return null; });
    if (choisie) d.fermer();
  });
  try {
    const r = await resultat;
    return choisie || (r.action === 'ok' ? image : null);
  } finally {
    cancelAnimationFrame(boucle);
    flux.getTracks().forEach(t => t.stop());
    video.srcObject = null;
  }
}

// Sélecteur de fichier → fichier choisi (ou null).
function choisirFichierJustif(accept) {
  return new Promise(ok => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.addEventListener('change', () => ok(input.files[0] || null));
    input.addEventListener('cancel', () => ok(null));
    input.click();
  });
}
async function choisirImageJustif() {
  const f = await choisirFichierJustif('image/*');
  return f ? lireFichierJustif(f) : null;
}

// Fichier joint → pièce prête à ranger : image réduite (JPEG), ou PDF tel quel (5 Mo au plus).
async function lireFichierJustif(f) {
  if (/\.pdf$/i.test(f.name) || f.type === 'application/pdf') {
    if (f.size > TAILLE_MAX_DOC) throw new Error(`« ${f.name} » est trop lourd (${tailleLisible(f.size)}) : 5 Mo maximum.`);
    return { type: 'application/pdf', nom: f.name, contenu: await lireEnBase64(f), taille: f.size, mini: '' };
  }
  if (!/^image\//.test(f.type) && !/\.(jpe?g|png|heic|heif|webp|gif)$/i.test(f.name)) throw new Error(`« ${f.name} » n’est ni une photo ni un PDF.`);
  const url = URL.createObjectURL(f);
  try {
    const img = new Image();
    await new Promise((ok, ko) => { img.onload = ok; img.onerror = () => ko(new Error(`Impossible de lire l’image « ${f.name} ». Essaie une photo en JPEG ou PNG.`)); img.src = url; });
    return imageJustif(img, 0, 0, img.naturalWidth, img.naturalHeight);
  } finally { URL.revokeObjectURL(url); }
}

// Range la pièce (ou la retire si piece = null) sur la dispense en cours de l'élève ; l'ancienne est effacée du carnet.
function enregistrerJustif(eleveId, piece) {
  const el = Donnees.get('eleves', eleveId);
  if (!el) return;
  const ancien = el.dispJustif || '';
  let id = '';
  if (piece) {
    id = Donnees.nouvelId();
    const nom = piece.nom || `Justificatif ${el.nom} ${el.prenom} ${aujourdhui()}.jpg`;
    Donnees.ecrire('documents', { id, nom, type: piece.type, taille: piece.taille, contenu: piece.contenu, mini: piece.mini || '', justificatif: true, ajouteLe: Date.now() });
  }
  Donnees.ecrire('eleves', { ...el, dispJustif: id });
  if (ancien) supprimerDocumentsInutilises([ancien]);
  rendreVue();
  if (piece) toast('Justificatif rangé dans la fiche de l’élève.', 'ok');
}

// Carte « Justificatif » sous les dates de la dispense (liste des élèves).
function htmlJustifDispense(el) {
  const doc = docJustif(el.dispJustif);
  if (!doc) {
    return `<div class="carte-justif vide">
      <span class="justif-titre">Justificatif</span>
      <span class="justif-actions">
        <button type="button" data-justif-photo="${el.id}" title="Prendre en photo le justificatif de dispense">${iconeEcole('appareilPhoto')}Photo</button>
        <label class="bouton" title="Joindre une photo ou un PDF déjà enregistré">📎 Joindre<input type="file" accept="image/*,.pdf,application/pdf" data-justif-fichier="${el.id}" hidden></label>
      </span>
    </div>`;
  }
  const le = new Date(doc.ajouteLe || Date.now()).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  return `<div class="carte-justif">
    <button type="button" class="justif-vignette" data-justif-voir="${el.id}" title="Voir le justificatif" aria-label="Voir le justificatif de ${esc(el.nom)}">
      ${doc.mini ? `<img src="${doc.mini}" alt="">` : '<span class="justif-pdf">PDF</span>'}</button>
    <span class="justif-infos"><b>Justificatif</b><span class="aide">ajouté le ${le}</span></span>
  </div>`;
}

// Bouton d'une ancienne dispense qui a gardé son justificatif.
const boutonJustifAncien = (el, d) => (d.justif && docJustif(d.justif)
  ? ` <button type="button" class="lien justif-ancien" data-justif-doc="${d.justif}" data-justif-eleve="${el.id}" title="Voir le justificatif de cette dispense" aria-label="Justificatif">📎</button>` : '');

// Grand aperçu. Dispense en cours : remplacer ou retirer ; ancienne dispense : seulement voir.
async function voirJustif(eleveId, docId = null) {
  const el = Donnees.get('eleves', eleveId), enCours = !docId;
  const doc = docJustif(docId || el?.dispJustif);
  if (!doc) return;
  const le = new Date(doc.ajouteLe || Date.now()).toLocaleDateString('fr-FR', { dateStyle: 'long' });
  const { d, resultat } = ouvrirModale(`Justificatif — ${el.nom} ${el.prenom}`, `
    <div class="justif-apercu info-sensible">${estImageJustif(doc)
      ? `<img class="justif-grand" src="data:${esc(doc.type)};base64,${doc.contenu}" alt="Justificatif de dispense">`
      : `<p><span class="justif-pdf grand">PDF</span> ${esc(doc.nom)} <span class="aide">${tailleLisible(doc.taille || 0)}</span></p>
         <button type="button" data-ouvrir-justif>Ouvrir le PDF</button>`}</div>
    <p class="aide">Ajouté le ${le}. Gardé jusqu’à la fin de l’année scolaire, puis effacé automatiquement.</p>`,
  `${enCours ? '<button value="retirer" class="danger">Retirer</button>' : ''}<span class="espace"></span>
    ${enCours ? `<button value="remplacer">${iconeEcole('appareilPhoto')}Remplacer</button>` : ''}<button type="button" data-fermer class="primaire">Fermer</button>`, 'modale-large');
  $('[data-ouvrir-justif]', d)?.addEventListener('click', () => ouvrirDocument(doc));
  const r = await resultat;
  if (r.action === 'remplacer') return prendreJustif(eleveId);
  if (r.action === 'retirer' && await confirmer(`Retirer le justificatif de ${el.nom} ${el.prenom} ? Il sera effacé du carnet.`, 'Retirer')) enregistrerJustif(eleveId, null);
}

async function prendreJustif(eleveId) {
  const el = Donnees.get('eleves', eleveId);
  const piece = await photographierJustif(el);
  if (piece) enregistrerJustif(eleveId, piece);
}

// Fin d'année : les justificatifs des dispenses d'une année scolaire passée sont effacés (au démarrage).
function purgerJustificatifs() {
  const annee = anneeScolaire(aujourdhui()), passe = date => !!date && anneeScolaire(date) < annee;
  const retires = [];
  for (const el of Donnees.liste('eleves', e => e.dispJustif || e.dispensesPassees?.some(d => d.justif))) {
    const modif = { ...el };
    if (el.dispJustif && passe(el.dispFin)) { retires.push(el.dispJustif); modif.dispJustif = ''; }
    if (el.dispensesPassees?.some(d => d.justif && passe(d.fin || d.debut))) {
      modif.dispensesPassees = el.dispensesPassees.map(d => {
        if (!d.justif || !passe(d.fin || d.debut)) return d;
        retires.push(d.justif);
        const { justif, ...reste } = d;
        return reste;
      });
    }
    if (JSON.stringify(modif) !== JSON.stringify(el)) Donnees.ecrire('eleves', modif);
  }
  if (retires.length) supprimerDocumentsInutilises(retires);
}

document.addEventListener('click', e => {
  const t = e.target.closest?.('[data-justif-photo],[data-justif-voir],[data-justif-doc]');
  if (!t || t.closest('dialog')) return;
  if (t.dataset.justifPhoto) return lancer(() => prendreJustif(t.dataset.justifPhoto));
  if (t.dataset.justifVoir) return lancer(() => voirJustif(t.dataset.justifVoir));
  if (t.dataset.justifDoc) return lancer(() => voirJustif(t.dataset.justifEleve, t.dataset.justifDoc));
});

document.addEventListener('change', e => {
  const t = e.target;
  if (!t.dataset?.justifFichier || !t.files?.[0]) return;
  const id = t.dataset.justifFichier, f = t.files[0];
  t.value = '';
  lancer(async () => enregistrerJustif(id, await lireFichierJustif(f)));
});
