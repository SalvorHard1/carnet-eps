'use strict';
// Lecture / écriture du carnet sur la clé USB, chiffré par mot de passe (AES-GCM 256, clé dérivée PBKDF2).
// Tout se fait sur l'appareil : rien ne passe par internet.
const Cle = (() => {
  const APP = 'carnet-eps';
  const ITERATIONS = 250000;
  const NOM_FICHIER = 'carnet-eps.json';
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  // Chrome / Edge sur ordinateur : accès direct à un dossier de la clé. Sinon (iPad, Android) : import / export.
  const accesDirect = typeof window.showDirectoryPicker === 'function';

  class ErreurMdp extends Error {}
  class ErreurVersion extends Error {} // carnet d'une appli plus récente (format de données inconnu ici)

  // Version de l'appli qui écrit le carnet (VERSION_APP, app.js) et comparaison « 1.2.0 » > « 0.159.0 ».
  const versionAppli = () => (typeof VERSION_APP === 'string' ? VERSION_APP : '');
  function compareVersions(a, b) {
    const pa = String(a).split('.').map(n => parseInt(n, 10) || 0), pb = String(b).split('.').map(n => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
    return 0;
  }
  let versionSignalee = ''; // pour ne prévenir qu'une fois par version

  // Carnet écrit par une appli plus récente : format de données inconnu → refus (rien n'est lu ni réécrit) ;
  // même format → simple conseil de mise à jour.
  function verifierVersion(f) {
    const ici = versionAppli();
    if ((f.niveau || 0) > Donnees.NIVEAU) {
      throw new ErreurVersion(`Ce carnet a été enregistré par une version plus récente de l’appli${f.appli ? ` (v${f.appli})` : ''} que celle de cet appareil${ici ? ` (v${ici})` : ''}. `
        + 'Mets d’abord l’appli à jour (touche le numéro de version en haut à gauche, ou recharge la page) : rien n’a été lu ni modifié.');
    }
    if (f.appli && ici && compareVersions(f.appli, ici) > 0 && versionSignalee !== f.appli) {
      versionSignalee = f.appli;
      if (typeof toast === 'function') toast(`Ce carnet vient de la v${f.appli} de l’appli, plus récente que celle-ci (v${ici}) : pense à mettre à jour cet appareil.`);
    }
  }

  function versB64(tampon) {
    const octets = new Uint8Array(tampon);
    let s = '';
    for (let i = 0; i < octets.length; i += 0x8000) s += String.fromCharCode.apply(null, octets.subarray(i, i + 0x8000));
    return btoa(s);
  }

  function deB64(s) {
    const bin = atob(s);
    const octets = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) octets[i] = bin.charCodeAt(i);
    return octets;
  }

  async function deriver(mdp, sel, iterations) {
    const base = await crypto.subtle.importKey('raw', enc.encode(mdp), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: sel, iterations, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }

  // Compression gzip avant chiffrement : le fichier est 7 à 10 fois plus petit.
  // Format 1 = non compressé (anciennes sauvegardes, toujours lisibles), format 2 = compressé.
  const FORMAT_MAX = 2;
  const compressionDispo = typeof CompressionStream === 'function';
  const transformer = async (octets, flux) => new Uint8Array(await new Response(new Blob([octets]).stream().pipeThrough(flux)).arrayBuffer());

  async function chiffrer(donnees, mdp) {
    const sel = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cle = await deriver(mdp, sel, ITERATIONS);
    let clair = enc.encode(JSON.stringify(donnees));
    if (compressionDispo) clair = await transformer(clair, new CompressionStream('gzip'));
    const chiffre = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cle, clair);
    return JSON.stringify({
      app: APP, format: compressionDispo ? 2 : 1, compression: compressionDispo ? 'gzip' : null, enregistreLe: new Date().toISOString(),
      appli: versionAppli(), niveau: Donnees.NIVEAU,
      iterations: ITERATIONS, sel: versB64(sel), iv: versB64(iv), donnees: versB64(chiffre),
    });
  }

  async function dechiffrer(texte, mdp) {
    let f;
    try { f = JSON.parse(texte); } catch { throw new Error('Ce fichier n’est pas un carnet lisible.'); }
    if (f.app !== APP) throw new Error('Ce fichier n’est pas un carnet de l’appli.');
    if (f.format > FORMAT_MAX) throw new Error('Ce fichier a été enregistré par une version plus récente de l’appli : mets à jour l’appli sur cet appareil.');
    verifierVersion(f);
    const cle = await deriver(mdp, deB64(f.sel), f.iterations);
    let clair;
    try {
      clair = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: deB64(f.iv) }, cle, deB64(f.donnees)));
    } catch {
      throw new ErreurMdp('Mot de passe incorrect.');
    }
    if (f.compression === 'gzip') {
      if (typeof DecompressionStream !== 'function') throw new Error('Ce navigateur est trop ancien pour lire ce fichier : mets-le à jour.');
      clair = await transformer(clair, new DecompressionStream('gzip'));
    }
    return JSON.parse(dec.decode(clair));
  }

  // « Témoin » du mot de passe : une empreinte à sens unique (même procédé lent que le chiffrement),
  // gardée sur l'appareil seulement. Elle permet de reconnaître le bon mot de passe sans le conserver.
  async function empreinte(mdp, selB64) {
    const sel = selB64 ? deB64(selB64) : crypto.getRandomValues(new Uint8Array(16));
    const base = await crypto.subtle.importKey('raw', enc.encode(mdp), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: sel, iterations: ITERATIONS, hash: 'SHA-256' }, base, 256);
    return { sel: versB64(sel), empreinte: versB64(bits) };
  }

  const creerTemoin = mdp => empreinte(mdp);
  const verifierTemoin = async (mdp, temoin) => (await empreinte(mdp, temoin.sel)).empreinte === temoin.empreinte;

  // Mémorise le dossier choisi sur la clé (IndexedDB) pour ne pas avoir à le rechercher à chaque fois.
  function idb(mode, action) {
    return new Promise((ok, ko) => {
      const ouverture = indexedDB.open('carnet-eps', 1);
      ouverture.onupgradeneeded = () => ouverture.result.createObjectStore('kv');
      ouverture.onerror = () => ko(ouverture.error);
      ouverture.onsuccess = () => {
        const tx = ouverture.result.transaction('kv', mode);
        const req = action(tx.objectStore('kv'));
        tx.oncomplete = () => ok(req.result);
        tx.onerror = () => ko(tx.error);
      };
    });
  }

  // Un dossier retenu par destination (enregistrement.js) : « dossier » = la clé (nom d'origine), « dossier-drive »…
  const memoriser = (dossier, cle = 'dossier') => idb('readwrite', s => s.put(dossier, cle));
  const dossierMemorise = (cle = 'dossier') => (accesDirect ? idb('readonly', s => s.get(cle)).catch(() => null) : Promise.resolve(null));

  const choisirDossier = () => window.showDirectoryPicker({ id: 'carnet-eps', mode: 'readwrite' });

  // Le dossier contient-il déjà un carnet (non vide) ?
  async function contientCarnet(dossier) {
    try { return (await (await dossier.getFileHandle(NOM_FICHIER)).getFile()).size > 0; } catch { return false; }
  }

  // « Sauvegardes » n'est jamais le dossier du carnet : c'est celui des copies datées, juste en dessous.
  const estDossierCopies = dossier => dossier.name.toLowerCase() === 'sauvegardes';

  // Le carnet principal, toujours au même nom dans le dossier choisi.
  const fichierCarnet = dossier => dossier.getFileHandle(NOM_FICHIER, { create: true });

  // Nom des copies datées que l'ordinateur range dans « Sauvegardes ».
  const MOTIF_COPIE = /^carnet-eps_(\d{4})-(\d{2})-(\d{2})_(\d{2})h(\d{2})\.json$/;

  // Date d'enregistrement d'un carnet, écrite en clair dans son en-tête (pas besoin du mot de passe).
  const dateCarnet = texte => { try { return JSON.parse(texte).enregistreLe || ''; } catch { return ''; } };

  // Les autres carnets du dossier de la clé et de « Sauvegardes » (ex. « carnet-eps (1).json » venu de la tablette) :
  // [{ nom, texte, date }]. Sont laissés de côté : les fichiers qui ne sont pas des carnets, et les copies datées
  // faites par l'ordinateur (simples doubles de carnet-eps.json).
  async function autresCarnets(dossier) {
    const trouves = [];
    const parcourir = async (rep, prefixe) => {
      for await (const [nom, h] of rep.entries()) {
        if (h.kind !== 'file' || !/\.json$/i.test(nom) || (!prefixe && nom === NOM_FICHIER) || MOTIF_COPIE.test(nom)) continue;
        try {
          const f = await h.getFile();
          const texte = await f.text();
          if (JSON.parse(texte).app !== APP) continue;
          trouves.push({ nom: prefixe + nom, fichier: nom, rep, texte, date: dateCarnet(texte) || new Date(f.lastModified).toISOString() });
        } catch { /* pas un carnet */ }
      }
    };
    await parcourir(dossier, '');
    let sous = null;
    try { sous = await dossier.getDirectoryHandle('Sauvegardes'); } catch { /* pas encore de dossier « Sauvegardes » */ }
    if (sous) await parcourir(sous, 'Sauvegardes/');
    return trouves;
  }

  // Copie datée dans le sous-dossier « Sauvegardes » (pour revenir à une version antérieure).
  async function copieDatee(dossier, texte) {
    const d = new Date();
    const deux = n => String(n).padStart(2, '0');
    const nom = `carnet-eps_${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}_${deux(d.getHours())}h${deux(d.getMinutes())}.json`;
    const sous = await dossier.getDirectoryHandle('Sauvegardes', { create: true });
    await ecrire(await sous.getFileHandle(nom, { create: true }), texte);
    return nom;
  }

  // Ménage dans « Sauvegardes » : on garde les 20 copies les plus récentes, puis la plus récente
  // de chaque semaine sur le dernier mois, et la plus récente de chaque mois au-delà.
  // Seuls les fichiers créés par l'appli (carnet-eps_AAAA-MM-JJ_HHhMM.json) sont concernés.
  async function nettoyerCopies(dossier, aGarder = 20) {
    const sous = await dossier.getDirectoryHandle('Sauvegardes', { create: true });
    const motif = MOTIF_COPIE;
    const copies = [];
    for await (const [nom, h] of sous.entries()) {
      const m = nom.match(motif);
      if (h.kind === 'file' && m) copies.push({ nom, date: new Date(+m[1], m[2] - 1, +m[3], +m[4], +m[5]) });
    }
    copies.sort((a, b) => b.date - a.date); // les plus récentes d'abord
    const garder = new Set(copies.slice(0, aGarder).map(c => c.nom));
    const periodesVues = new Set();
    const jour = 86400000;
    for (const c of copies) {
      const periode = Date.now() - c.date <= 31 * jour
        ? 'semaine-' + Math.floor((c.date.getTime() + 3 * jour) / (7 * jour))
        : 'mois-' + c.date.getFullYear() + '-' + c.date.getMonth();
      if (!periodesVues.has(periode)) { periodesVues.add(periode); garder.add(c.nom); }
    }
    let supprimees = 0;
    for (const c of copies) {
      if (!garder.has(c.nom)) { await sous.removeEntry(c.nom); supprimees++; }
    }
    return supprimees;
  }

  // Copies datées de « Sauvegardes » : [{ nom, h }] (pour les rechiffrer après un changement de mot de passe).
  async function copiesDatees(dossier) {
    let sous;
    try { sous = await dossier.getDirectoryHandle('Sauvegardes'); } catch { return []; }
    const res = [];
    for await (const [nom, h] of sous.entries()) if (h.kind === 'file' && MOTIF_COPIE.test(nom)) res.push({ nom, h });
    return res;
  }

  // Même contenu, nouveau mot de passe ; la date d'enregistrement d'origine est gardée.
  // (ErreurMdp si l'ancien mot de passe n'ouvre pas ce fichier.)
  async function rechiffrer(texte, ancien, nouveau) {
    const donnees = await dechiffrer(texte, ancien);
    const sortie = JSON.parse(await chiffrer(donnees, nouveau));
    sortie.enregistreLe = dateCarnet(texte) || sortie.enregistreLe;
    return JSON.stringify(sortie);
  }

  async function autoriser(h) {
    if ((await h.queryPermission({ mode: 'readwrite' })) === 'granted') return true;
    return (await h.requestPermission({ mode: 'readwrite' })) === 'granted';
  }

  async function lire(h) {
    return (await h.getFile()).text();
  }

  async function ecrire(h, texte) {
    const flux = await h.createWritable();
    await flux.write(texte);
    await flux.close();
  }

  // Tablette : comment le fichier partira sur la clé.
  //   'enregistrer' : fenêtre « Enregistrer sous » du système, on choisit la clé directement ;
  //   'partager'    : feuille de partage (iPad : « Enregistrer dans Fichiers » → clé USB) ;
  //   'telecharger' : Android, dont le menu de partage ne propose pas la clé → Téléchargements, à déplacer.
  const android = /Android/i.test(navigator.userAgent);
  const modeTablette = typeof window.showSaveFilePicker === 'function' ? 'enregistrer'
    : !android && typeof navigator.canShare === 'function' ? 'partager' : 'telecharger';
  // Vers un Drive, Android propose l'appli Drive dans son menu de partage : on s'en sert (pas pour la clé).
  const modeTablettePour = destination => (modeTablette === 'telecharger' && destination === 'drive'
    && typeof navigator.canShare === 'function' ? 'partager' : modeTablette);

  // Nom unique pour le fichier de la tablette : il se pose à côté de carnet-eps.json, sans rien remplacer
  // ni renommer, et l'ordinateur le réunit tout seul au carnet (une seule fois), puis le retire de la clé.
  // (Android ajoute parfois « (1) » au nom : il est toujours reconnu.)
  const estFichierTablette = nom => /^carnet-eps-tablette_.*\.json$/i.test(nom);
  function nomFichierTablette() {
    const d = new Date();
    const deux = n => String(n).padStart(2, '0');
    return `carnet-eps-tablette_${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}_${deux(d.getHours())}h${deux(d.getMinutes())}.json`;
  }

  // Renvoie false si l'utilisateur a fermé la fenêtre sans enregistrer.
  // nom : unique par défaut (repris par l'ordinateur) ; « carnet-eps.json » pour un dossier de la tablette (on remplace).
  async function enregistrerSurCle(texte, mode = modeTablette, nom = nomFichierTablette()) {
    if (mode === 'enregistrer') {
      let h;
      try {
        h = await window.showSaveFilePicker({
          suggestedName: nom, id: 'carnet-eps',
          types: [{ description: profil().carnet, accept: { 'application/json': ['.json'] } }],
        });
      } catch (e) {
        if (e.name === 'AbortError') return false;
        throw e;
      }
      await ecrire(h, texte);
      return true;
    }
    try {
      await partagerOuTelecharger(texte, nom, mode);
    } catch (e) {
      if (e.name === 'AbortError') return false; // feuille de partage fermée sans choisir
      throw e;
    }
    return true;
  }

  // Feuille de partage (iPad, Drive sur Android), sinon simple téléchargement.
  function partagerOuTelecharger(texte, nom = NOM_FICHIER, mode = modeTablette) {
    const fichier = new File([texte], nom, { type: 'application/json' });
    if (mode === 'partager' && navigator.canShare?.({ files: [fichier] })) return navigator.share({ files: [fichier] });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(fichier);
    a.download = nom;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    return Promise.resolve();
  }

  return {
    NOM_FICHIER, accesDirect, ErreurMdp, ErreurVersion, compareVersions, chiffrer, dechiffrer, creerTemoin, verifierTemoin, memoriser, dossierMemorise, choisirDossier, contientCarnet, estDossierCopies,
    fichierCarnet, dateCarnet, autresCarnets, copieDatee, copiesDatees, rechiffrer, nettoyerCopies, autoriser, lire, ecrire, partagerOuTelecharger, enregistrerSurCle, estFichierTablette, modeTablette, modeTablettePour,
  };
})();
