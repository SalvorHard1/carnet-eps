'use strict';
// Stockage local du carnet + fusion entre appareils.
// Chaque élément porte un horodatage `maj` : lors d'une fusion, la version la plus récente gagne.
// Une suppression laisse une « pierre tombale » { id, supprime: true } pour se propager aux autres appareils.
const Donnees = (() => {
  const CLE_STOCKAGE = 'carnet-eps-db';
  // `seances` (carnet d'entraînement) est arrivée en v0.13, `reglages` (périodes de l'année…) en v0.21 :
  // absentes des fichiers plus anciens.
  // `documents` (fichiers joints aux séances) en v0.30, `suivis` (observations du prof par élève et par APSA) en v0.33.
  const COLLECTIONS = ['classes', 'eleves', 'evals', 'notes', 'seances', 'reglages', 'documents', 'suivis'];
  const COLLECTIONS_OBLIGATOIRES = ['classes', 'eleves', 'evals', 'notes'];
  const auditeurs = [];
  let db;

  function vide() {
    return { schema: 1, classes: {}, eleves: {}, evals: {}, notes: {}, seances: {}, reglages: {}, documents: {}, suivis: {}, meta: { horloge: 0, modifieLe: 0, dernierEnvoi: 0 } };
  }

  // Stockage dans IndexedDB (pas de limite de 5 Mo comme localStorage).
  // Les données des anciennes versions (localStorage) sont converties automatiquement au premier lancement.
  // Si IndexedDB est indisponible (navigation privée…), on se replie sur localStorage.
  let base = null;
  const canal = typeof BroadcastChannel === 'function' ? new BroadcastChannel('carnet-eps') : null;

  function ouvrirBase() {
    return new Promise((ok, ko) => {
      const r = indexedDB.open('carnet-eps-donnees', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('carnet');
      r.onsuccess = () => ok(r.result);
      r.onerror = () => ko(r.error);
      r.onblocked = () => ko(new Error('Base bloquée'));
    });
  }

  function lireBase() {
    return new Promise((ok, ko) => {
      const q = base.transaction('carnet', 'readonly').objectStore('carnet').get('db');
      q.onsuccess = () => ok(q.result || null);
      q.onerror = () => ko(q.error);
    });
  }

  function ecrireBase(valeur) {
    return new Promise((ok, ko) => {
      const tx = base.transaction('carnet', 'readwrite');
      tx.objectStore('carnet').put(valeur, 'db'); // copie instantanée des données à cet instant
      tx.oncomplete = () => ok();
      tx.onerror = tx.onabort = () => ko(tx.error);
    });
  }

  function lireAncien() {
    try { return JSON.parse(localStorage.getItem(CLE_STOCKAGE)); } catch { return null; }
  }

  function normaliser(d) {
    if (!d || d.schema !== 1) d = vide();
    for (const c of COLLECTIONS) d[c] ??= {};
    d.meta = { ...vide().meta, ...d.meta };
    return d;
  }

  async function charger() {
    if (!base) {
      try { base = await ouvrirBase(); } catch (e) { console.warn('IndexedDB indisponible, repli sur localStorage :', e); }
    }
    if (!base) { db = normaliser(lireAncien()); return; }
    let lu = await lireBase();
    const ancien = lireAncien();
    if (ancien) {
      // Conversion (ou données écrites entre-temps par une ancienne version encore ouverte) :
      // on fusionne élément par élément (le plus récent gagne), on écrit dans IndexedDB, on vérifie,
      // puis seulement on efface l'ancien stockage.
      const fusion = normaliser(lu ? structuredClone(lu) : null);
      const source = normaliser(ancien);
      for (const c of COLLECTIONS) {
        for (const [id, o] of Object.entries(source[c])) {
          if (!fusion[c][id] || (o.maj || 0) > (fusion[c][id].maj || 0)) fusion[c][id] = o;
        }
      }
      fusion.meta.horloge = Math.max(fusion.meta.horloge, source.meta.horloge);
      fusion.meta.modifieLe = Math.max(fusion.meta.modifieLe, source.meta.modifieLe);
      fusion.meta.dernierEnvoi = Math.max(fusion.meta.dernierEnvoi, source.meta.dernierEnvoi);
      await ecrireBase(fusion);
      lu = await lireBase();
      if (lu) localStorage.removeItem(CLE_STOCKAGE);
    }
    db = normaliser(lu || ancien);
  }

  // Une seule écriture à la fois ; les modifications faites pendant ce temps sont réécrites juste après.
  let ecritureEnCours = false, aReecrire = false;
  function enregistrer() {
    if (!base) {
      try { localStorage.setItem(CLE_STOCKAGE, JSON.stringify(db)); } catch (e) {
        console.error(e);
        if (typeof toast === 'function') toast('Stockage de l’appareil plein : sauvegarde sur la clé.', 'erreur');
      }
      return;
    }
    if (ecritureEnCours) { aReecrire = true; return; }
    ecritureEnCours = true;
    ecrireBase(db)
      .catch(e => {
        console.error(e);
        if (typeof toast === 'function') toast('Enregistrement sur l’appareil impossible : sauvegarde sur la clé.', 'erreur');
      })
      .finally(() => {
        ecritureEnCours = false;
        canal?.postMessage('maj'); // prévient les autres onglets ouverts sur le carnet
        if (aReecrire) { aReecrire = false; enregistrer(); }
      });
  }

  // Horloge croissante : jamais deux fois la même valeur, jamais en retard sur un élément déjà connu.
  function horodatage() {
    db.meta.horloge = Math.max(Date.now(), db.meta.horloge + 1);
    return db.meta.horloge;
  }

  function nouvelId() {
    return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function notifier() { auditeurs.forEach(f => f()); }

  /* ---------- Réunion champ par champ ----------
     Les fiches (classes, élèves, évaluations, séances, réglages) gardent, en plus de `maj`, l'heure de modification
     de chacun de leurs champs (`majChamps`). Quand deux appareils ont modifié la même fiche, chaque champ garde sa
     version la plus récente : une remarque saisie sur la tablette et une dispense saisie sur le PC sont gardées toutes
     les deux. Seul un même champ modifié des deux côtés garde sa dernière version.
     Les notes (une case = une valeur) se comparent en entier.
     Fiches des anciennes versions (sans `majChamps`) : tous leurs champs datent de `maj`, comme avant.
     Un champ absent et jamais daté (jamais rempli de ce côté) ne fait jamais disparaître le champ de l'autre côté. */

  const PAR_CHAMP = new Set(['classes', 'eleves', 'evals', 'seances', 'reglages', 'suivis']);
  const TECHNIQUES = new Set(['id', 'maj', 'majChamps', 'majChampsPour', 'supprime']);
  const memeValeur = (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b);
  const present = (o, f) => Object.prototype.hasOwnProperty.call(o, f) && o[f] !== undefined;

  // Heures par champ utilisables ? `majChampsPour` dit pour quelle version de la fiche elles ont été calculées :
  // si une ancienne version de l'appli a modifié la fiche depuis (sans les mettre à jour), on ne s'y fie plus
  // et la fiche entière date de `maj`, comme avant.
  const heuresFiables = o => !!o.majChamps && o.majChampsPour === o.maj;

  // Heure de la dernière modification d'un champ (0 : jamais rempli de ce côté).
  function heureChamp(o, f) {
    if (heuresFiables(o) && f in o.majChamps) return o.majChamps[f];
    return present(o, f) ? (o.maj || 0) : 0;
  }

  // Champs à examiner : ceux présents, plus ceux retirés dont la suppression est datée.
  const champsDe = o => [...Object.keys(o), ...(heuresFiables(o) ? Object.keys(o.majChamps) : [])];

  // Date les champs qui changent par rapport à la version enregistrée ; les autres gardent leur heure.
  function daterChamps(obj, ancien, t) {
    for (const f of Object.keys(obj)) if (obj[f] === undefined) delete obj[f];
    const champs = {};
    const avant = ancien && !ancien.supprime ? ancien : null;
    for (const f of new Set([...Object.keys(obj), ...(avant ? champsDe(avant) : [])])) {
      if (TECHNIQUES.has(f)) continue;
      const ici = present(obj, f), la = avant ? present(avant, f) : false;
      const change = !avant || ici !== la || (ici && !memeValeur(obj[f], avant[f]));
      const h = change ? t : heureChamp(avant, f);
      if (h) champs[f] = h; // (un champ retiré garde son heure : sa suppression se propage)
    }
    obj.majChamps = champs;
    obj.majChampsPour = t;
  }

  // Réunit deux versions d'une même fiche. Renvoie `mien` tel quel si rien ne change de mon côté.
  function fusionnerFiche(mien, autre) {
    if (!mien) return autre;
    if (mien.supprime || autre.supprime) return (autre.maj || 0) > (mien.maj || 0) ? autre : mien;
    const res = { ...mien, majChamps: {} };
    let change = false;
    for (const f of new Set([...champsDe(mien), ...champsDe(autre)])) {
      if (TECHNIQUES.has(f)) continue;
      const ha = heureChamp(mien, f), hb = heureChamp(autre, f);
      const ici = present(mien, f), la = present(autre, f);
      // (Chaque heure est notée explicitement : un champ ne doit pas « rajeunir » avec le `maj` de la fiche réunie.)
      if (ici === la && (!ici || memeValeur(mien[f], autre[f]))) { // même valeur des deux côtés
        if (Math.max(ha, hb)) res.majChamps[f] = Math.max(ha, hb);
        continue;
      }
      // Égalité parfaite des heures (rarissime) : choix fixe, pour que les deux appareils arrivent au même résultat.
      const prendreAutre = hb > ha || (hb === ha && String(JSON.stringify(autre[f])) > String(JSON.stringify(mien[f])));
      if (!prendreAutre) { if (ha) res.majChamps[f] = ha; continue; }
      if (la) res[f] = autre[f]; else delete res[f];
      if (hb) res.majChamps[f] = hb;
      change = true;
    }
    if (!change) return mien;
    res.maj = Math.max(mien.maj || 0, autre.maj || 0);
    res.majChampsPour = res.maj;
    return res;
  }

  function ecrire(col, obj) {
    const t = horodatage();
    if (PAR_CHAMP.has(col) && !obj.supprime) daterChamps(obj, db[col][obj.id], t);
    obj.maj = t;
    db[col][obj.id] = obj;
    db.meta.modifieLe = obj.maj;
    enregistrer();
    notifier();
    return obj;
  }

  function supprimer(col, id) {
    if (db[col][id]) ecrire(col, { id, supprime: true });
  }

  function get(col, id) {
    const o = db[col][id];
    return o && !o.supprime ? o : null;
  }

  function liste(col, filtre = () => true) {
    return Object.values(db[col]).filter(o => !o.supprime && filtre(o));
  }

  // Une « note » est soit la note d'une évaluation, soit (avec `attendu`) le degré de maîtrise d'une compétence.
  const cleNote = (evalId, eleveId, attendu) => evalId + '|' + eleveId + (attendu ? '|' + attendu : '');

  function note(evalId, eleveId, attendu) {
    return db.notes[cleNote(evalId, eleveId, attendu)]?.valeur ?? '';
  }

  // `extra` : informations complémentaires, ex. { auto: true } pour un degré pré-rempli d'après la note.
  function ecrireNote(evalId, eleveId, valeur, attendu, extra = {}) {
    const n = { id: cleNote(evalId, eleveId, attendu), evalId, eleveId, valeur, ...extra };
    if (attendu) n.attendu = attendu;
    ecrire('notes', n);
  }

  const noteComplete = (evalId, eleveId, attendu) => db.notes[cleNote(evalId, eleveId, attendu)] || null;

  // Intègre un carnet venu d'un autre appareil. Renvoie le nombre d'éléments récupérés.
  function fusionner(autre) {
    if (!autre || autre.schema !== 1 || COLLECTIONS_OBLIGATOIRES.some(c => typeof autre[c] !== 'object')) {
      throw new Error('Format de carnet inconnu (fichier d’une version plus récente de l’appli ?).');
    }
    let n = 0;
    for (const c of COLLECTIONS) {
      for (const [id, o] of Object.entries(autre[c] || {})) {
        const mien = db[c][id];
        const res = PAR_CHAMP.has(c) ? fusionnerFiche(mien, o) : !mien || (o.maj || 0) > (mien.maj || 0) ? o : mien;
        if (res !== mien) { db[c][id] = res; n++; }
        db.meta.horloge = Math.max(db.meta.horloge, o.maj || 0, ...Object.values(o.majChamps || {}));
      }
    }
    enregistrer();
    notifier();
    return n;
  }

  // Ce qui part sur la clé : tout sauf les infos propres à cet appareil.
  function exporter() {
    const { meta, ...reste } = db;
    return reste;
  }

  // Réglage propre à cet appareil (ex. témoin du mot de passe) : ne part pas sur la clé,
  // et ne compte pas comme une modification du carnet.
  function reglerMeta(cle, valeur) {
    if (valeur === undefined) delete db.meta[cle];
    else db.meta[cle] = valeur;
    enregistrer();
  }

  function marquerEnvoi() {
    db.meta.dernierEnvoi = Math.max(Date.now(), db.meta.modifieLe);
    enregistrer();
    notifier();
  }

  return {
    CLE_STOCKAGE, charger, nouvelId, ecrire, supprimer, get, liste, note, noteComplete, ecrireNote,
    fusionner, exporter, marquerEnvoi, reglerMeta, fusionnerFiche, // (fusionnerFiche : exposée pour les tests)
    meta: () => db?.meta ?? vide().meta,
    surChangement: f => auditeurs.push(f),
    surAutreOnglet: f => canal?.addEventListener('message', f),
  };
})();
