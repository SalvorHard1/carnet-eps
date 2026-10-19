'use strict';
/* ---------- 💾 Où enregistrer le carnet (choix propre à chaque appareil) ----------
   Le carnet vit toujours dans le navigateur (copie de travail, rendue « durable » dès le lancement). Le bouton
   Enregistrer l'écrit, chiffré par le mot de passe, à l'endroit choisi sur cet appareil :
   - 🔑 clé USB : pour passer d'un appareil à l'autre sans internet ;
   - 💻 dossier de l'appareil (ex. Documents) : une copie sur place ;
   - ☁ Drive : sur ordinateur, le dossier du Drive synchronisé (Google Drive, OneDrive…) ; sur tablette, l'appli Drive.
     L'appli n'est jamais reliée à Google ou Microsoft : c'est leur logiciel qui envoie le fichier (chiffré).
     Avertissement RGPD avant de choisir le Drive.
   Le mécanisme est le même partout (cle.js, app.js › synchroniser / exporterTablette) ; seuls les mots changent.
   Choix gardé dans ui.destination ; un dossier retenu par destination sur ordinateur. */

const DESTINATIONS = {
  cle: {
    icone: '🔑', nom: 'Clé USB', mon: 'Ma clé', sur: 'sur la clé', depuis: 'depuis la clé', le: 'la clé', ta: 'ta clé USB',
    introuvable: 'Clé absente ?', verifier: 'vérifie que la clé est bien branchée',
    explication: 'Pour passer le carnet d’un appareil à l’autre, sans internet.',
  },
  dossier: {
    icone: '💻', nom: 'Dossier de l’appareil', mon: 'Mon dossier', sur: 'dans le dossier', depuis: 'depuis le dossier', le: 'le dossier', ta: 'ton dossier',
    introuvable: 'Dossier introuvable ?', verifier: 'vérifie que le dossier existe toujours',
    explication: 'Une copie rangée sur cet appareil (ex. Documents › Carnet EPS). Elle ne protège pas d’une panne de l’appareil.',
  },
  drive: {
    icone: '☁', nom: 'Drive', mon: 'Mon Drive', sur: 'sur le Drive', depuis: 'depuis le Drive', le: 'le Drive', ta: 'ton Drive',
    introuvable: 'Drive introuvable ?', verifier: 'vérifie le dossier du Drive sur cet appareil',
    explication: 'Google Drive, OneDrive, iCloud… : sur ordinateur, son dossier synchronisé ; sur tablette, son appli. Pratique entre plusieurs appareils.',
  },
};

const destinationActive = () => (DESTINATIONS[ui.destination] ? ui.destination : 'cle');
const destEnr = () => DESTINATIONS[destinationActive()];
// Clé du dossier retenu sur ordinateur (« dossier » pour la clé : nom d'origine, déjà retenu chez les anciens utilisateurs).
const cleDossierDest = () => (destinationActive() === 'cle' ? 'dossier' : 'dossier-' + destinationActive());

const AVERTISSEMENT_DRIVE = `
  <p><b>⚠ À savoir avant de choisir un Drive</b></p>
  <p>Le fichier part chez <b>Google, Microsoft ou Apple</b>, souvent hébergé <b>hors de l’Union européenne</b>.
    Il est <b>chiffré par ton mot de passe</b> (illisible sans lui), mais ce n’est pas une solution validée pour le
    RGPD : les données d’élèves restent sous ta responsabilité. Demande l’avis de ton établissement (DPO) si besoin.</p>`;

// Comment c'est rangé, en clair (menu Enregistrer, fenêtre « Où enregistrer ») : un dossier sur ordinateur,
// un fichier .json à poser ou à choisir sur tablette.
function htmlFormeSauvegarde(dest = ui.destination) {
  return Cle.accesDirect
    ? `<b>📁 Sur cet ordinateur, tu choisis un dossier</b> (une seule fois, ex. « Carnet EPS ») ; l’appli y range :
      <span class="arbre-sauvegarde">carnet-eps.json <small>— ton carnet (ne pas le renommer)</small><br>
      Sauvegardes/ <small>— copies datées, triées toutes seules</small></span>
      Tu n’as aucun fichier à ouvrir toi-même.`
    : `<b>📄 Sur tablette, ce sont des fichiers .json</b> :
      <span class="arbre-sauvegarde">${dest === 'dossier'
    ? '<b>Enregistrer</b> écrit toujours <b>carnet-eps.json</b> <small>(remplace l’ancien : un seul fichier)</small>'
    : '<b>Enregistrer</b> pose un fichier <b>carnet-eps-tablette_date_heure.json</b> <small>(nom unique : il ne remplace rien)</small>'}<br>
      <b>Récupérer</b> : choisis les <b>.json</b> du dossier, <b>un ou plusieurs</b> <small>(l’appli prend tout, dans l’ordre des dates : pas d’erreur possible)</small></span>
      Mets-les toujours dans le <b>même dossier</b> (ex. « Carnet EPS »).`;
}

// Fenêtre « Où enregistrer ton carnet ? ». Renvoie la destination choisie, ou null (annulé).
async function choisirDestination(preselection) {
  const actuelle = DESTINATIONS[preselection] ? preselection : ui.destination || '';
  const { d, resultat } = ouvrirModale('Où enregistrer ton carnet ?', `
    <p class="aide">Ton carnet est toujours gardé dans ce navigateur. Choisis où l’enregistrer <b>en plus</b>, sur cet appareil
      (chaque appareil a son propre choix). Le fichier est toujours <b>chiffré par ton mot de passe</b>.</p>
    <div class="choix-destination">${Object.entries(DESTINATIONS).map(([id, x]) => `
      <label class="carte-destination"><input type="radio" name="destination" value="${id}" ${id === (actuelle || 'cle') ? 'checked' : ''}>
        <span class="icone-destination" aria-hidden="true">${x.icone}</span>
        <span><b>${x.nom}</b><small>${x.explication}</small></span></label>`).join('')}
    </div>
    <p class="forme-sauvegarde">${htmlFormeSauvegarde()}</p>
    ${Cle.accesDirect ? '' : `<div class="avertissement-drive" data-avertissement-dossier hidden>
      <p><b>⚠ Dossier de la tablette = copie de secours seulement</b></p>
      <p>Le fichier reste <b>sur cette tablette</b> : il ne passe pas sur ton ordinateur, et il disparaît si la tablette est
        perdue, cassée ou réinitialisée. Pour travailler aussi sur l’ordinateur, choisis plutôt la <b>clé USB</b> ou un <b>Drive</b>.
        (Une fois par mois, l’appli te rappellera de faire aussi une copie sur ta clé ou ton Drive.)</p></div>`}
    <div class="avertissement-drive" data-avertissement-drive hidden>${AVERTISSEMENT_DRIVE}
      <label class="case"><input type="checkbox" name="compris" ${ui.driveAverti ? 'checked' : ''}> J’ai compris</label></div>`,
  boutonsModale('Choisir'));
  const majAvertissement = () => {
    const v = $('[name="destination"]:checked', d)?.value;
    $('[data-avertissement-drive]', d).hidden = v !== 'drive';
    const a = $('[data-avertissement-dossier]', d);
    if (a) a.hidden = v !== 'dossier';
    $('.forme-sauvegarde', d).innerHTML = htmlFormeSauvegarde(v); // (nom fixe ou nom unique selon l'endroit coché)
  };
  d.addEventListener('change', majAvertissement);
  majAvertissement();
  const r = await resultat;
  if (r.action !== 'ok') return null;
  const choix = DESTINATIONS[r.data.destination] ? r.data.destination : 'cle';
  if (choix === 'drive' && r.data.compris !== 'on') {
    toast('Coche « J’ai compris » pour enregistrer sur un Drive.', 'erreur');
    return choisirDestination('drive');
  }
  if (choix === 'drive') ui.driveAverti = true;
  const change = choix !== ui.destination;
  ui.destination = choix;
  memoriserUi();
  majPastille();
  if (change) toast(`${DESTINATIONS[choix].icone} Le carnet sera enregistré : ${DESTINATIONS[choix].nom}`, 'ok');
  return choix;
}

// Premier enregistrement sur cet appareil : on demande où (sauf si le carnet a déjà été enregistré : on garde la clé).
async function destinationConnue() {
  if (ui.destination) return true;
  if (Donnees.meta().dernierEnvoi || (await Cle.dossierMemorise())) {
    ui.destination = 'cle';
    memoriserUi();
    return true;
  }
  return !!(await choisirDestination());
}

/* ---------- Aller chercher le carnet tout seul ----------
   Chaque navigateur a sa propre mémoire : sur un appareil neuf, on montre l'endroit une fois (accueil « J'ai déjà un
   carnet », ou le bandeau). Ensuite :
   - ordinateur : le dossier est retenu ; au lancement, le bandeau « Ouvrir mon carnet » récupère tout d'un clic
     (autorisation du dossier + mot de passe, que le navigateur ne laisse pas garder), puis l'enregistrement devient
     automatique ; après le déverrouillage de l'écran, si le dossier est déjà autorisé, c'est fait sans clic ;
   - tablette : le système ne laisse pas lire un fichier sans le choisir ; le bandeau ouvre directement ce choix. */

const BANDEAU_VU = 'carnet-eps-bandeau-recup'; // (sessionStorage : une fois par session)
const bandeauDejaVu = () => { try { return sessionStorage.getItem(BANDEAU_VU) === '1'; } catch { return false; } };
function fermerBandeauRecuperer() {
  try { sessionStorage.setItem(BANDEAU_VU, '1'); } catch { /* sans importance */ }
  $('#bandeau-recup')?.remove();
}

async function afficherBandeauRecuperer({ forcer = false } = {}) {
  if ((!forcer && bandeauDejaVu()) || enModeEleve() || $('#bandeau-recup')) return;
  if (!forcer && !ui.destination && !Donnees.meta().dernierEnvoi) return; // carnet jamais enregistré nulle part
  const x = destEnr(), dossier = Cle.accesDirect ? await Cle.dossierMemorise(cleDossierDest()) : null;
  if (Cle.accesDirect && !dossier && !forcer) return; // ordinateur sans dossier retenu : rien à aller chercher
  const b = document.createElement('div');
  b.id = 'bandeau-recup';
  b.className = 'bandeau-recup';
  b.setAttribute('role', 'status');
  b.innerHTML = `<span class="icone-destination" aria-hidden="true">${x.icone}</span>
    <span class="texte-recup">${Cle.accesDirect
    ? `<b>Ton carnet</b> est enregistré ${esc(x.sur)}${dossier ? ` (dossier « ${esc(dossier.name)} »)` : ''}.
      <small>Ouvre-le pour retrouver le travail fait ailleurs ; ensuite tout s’enregistre seul.</small>`
    : `<b>Récupère ton carnet</b> ${esc(x.depuis)} pour retrouver le travail fait sur tes autres appareils.
      <small>Choisis les <b>.json</b> du dossier (un ou plusieurs) : l’appli réunit tout et garde le plus récent.</small>`}</span>
    ${Cle.accesDirect ? '<button type="button" class="primaire" data-recup="ouvrir">⬇ Ouvrir mon carnet</button>'
    : '<label class="bouton primaire">⬇ Choisir les fichiers<input type="file" accept=".json,application/json" multiple data-recup-fichier hidden></label>'}
    <button type="button" class="icone-petit" data-recup="fermer" aria-label="Fermer" title="Plus tard">✕</button>`;
  document.querySelector('header.barre').after(b);
}

document.addEventListener('click', e => {
  const b = e.target.closest?.('[data-recup]');
  if (!b) return;
  if (b.dataset.recup === 'fermer') return fermerBandeauRecuperer();
  lancer(async () => { await actionCle(sauvegarder); fermerBandeauRecuperer(); });
});
document.addEventListener('change', e => {
  const fichiers = e.target.matches?.('[data-recup-fichier]') ? [...e.target.files] : [];
  if (!fichiers.length) return;
  e.target.value = '';
  lancer(async () => { await actionCle(() => importerFichiers(fichiers)); fermerBandeauRecuperer(); });
});

// Ordinateur : mot de passe connu (écran déverrouillé…) et dossier déjà autorisé → récupération sans un clic.
async function recupererAuto() {
  if (!Cle.accesDirect || !mdpSession || etatAuto === 'encours') return;
  const dossier = await Cle.dossierMemorise(cleDossierDest());
  if (!dossier || Cle.estDossierCopies(dossier) || (await dossier.queryPermission({ mode: 'readwrite' })) !== 'granted') return;
  etatAuto = 'encours';
  majPastille();
  try {
    await synchroniser(dossier, { silencieux: true });
    etatAuto = null;
    fermerBandeauRecuperer();
    notifAuto(`${destEnr().icone} Carnet récupéré ${destEnr().depuis} ✔ ${heure(Date.now())}`);
  } catch (e) {
    console.warn('Récupération automatique impossible :', e);
    etatAuto = null;
  }
  majPastille();
}

// Accueil d'un appareil neuf, « J'ai déjà un carnet » : où est-il ? puis on va le chercher.
async function recupererCarnetExistant() {
  if (!(await choisirDestination())) return;
  if (Cle.accesDirect) return actionCle(sauvegarder);
  await afficherBandeauRecuperer({ forcer: true }); // tablette : choisir le fichier demande un toucher
  toast('Touche « Choisir les fichiers » en haut, puis va ' + destEnr().sur + '.', 'ok');
}

/* ---------- Copie du navigateur : durable ----------
   Sans cette demande, le navigateur peut effacer les données du site quand la place manque (et Safari, sur iPad,
   après 7 jours sans utilisation si l'appli n'est pas installée sur l'écran d'accueil). */
let stockageDurable = null; // true / false / null (inconnu)
async function demanderStockageDurable() {
  try {
    if (!navigator.storage?.persist) return;
    stockageDurable = (await navigator.storage.persisted()) || (await navigator.storage.persist());
  } catch { /* navigateur ancien : on ne sait pas */ }
}
demanderStockageDurable();

const iPadNonInstalle = () => /iPad|iPhone|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document
  && !navigator.standalone && !matchMedia('(display-mode: standalone)').matches;

// Ligne d'état pour « Aide et dépannage ».
function htmlEtatNavigateur() {
  return `<p class="aide">Copie dans ce navigateur : ${stockageDurable ? '<b>durable</b> ✔'
    : stockageDurable === false ? '<b>pas garantie</b> — le navigateur peut l’effacer s’il manque de place : enregistre souvent.'
      : 'durée non garantie par ce navigateur — enregistre souvent.'}
    ${iPadNonInstalle() ? '<br>Sur iPad : ajoute l’appli à l’<b>écran d’accueil</b> (Partager › « Sur l’écran d’accueil ») pour que Safari ne l’efface pas.' : ''}</p>`;
}
