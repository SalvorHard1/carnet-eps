'use strict';
// Stockage local du carnet + fusion entre appareils.
// Chaque élément porte un horodatage `maj` : lors d'une fusion, la version la plus récente gagne.
// Une suppression laisse une « pierre tombale » { id, supprime: true } pour se propager aux autres appareils.
const Donnees = (() => {
  const CLE_STOCKAGE = 'carnet-eps-db';
  // `seances` (carnet d'entraînement) est arrivée en v0.13, `reglages` (périodes de l'année…) en v0.21 :
  // absentes des fichiers plus anciens.
  const COLLECTIONS = ['classes', 'eleves', 'evals', 'notes', 'seances', 'reglages'];
  const COLLECTIONS_OBLIGATOIRES = ['classes', 'eleves', 'evals', 'notes'];
  const auditeurs = [];
  let db;

  function vide() {
    return { schema: 1, classes: {}, eleves: {}, evals: {}, notes: {}, seances: {}, reglages: {}, meta: { horloge: 0, modifieLe: 0, dernierEnvoi: 0 } };
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

  function ecrire(col, obj) {
    obj.maj = horodatage();
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
        if (!mien || (o.maj || 0) > (mien.maj || 0)) { db[c][id] = o; n++; }
        db.meta.horloge = Math.max(db.meta.horloge, o.maj || 0);
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

  function marquerEnvoi() {
    db.meta.dernierEnvoi = Math.max(Date.now(), db.meta.modifieLe);
    enregistrer();
    notifier();
  }

  return {
    CLE_STOCKAGE, charger, nouvelId, ecrire, supprimer, get, liste, note, noteComplete, ecrireNote,
    fusionner, exporter, marquerEnvoi,
    meta: () => db?.meta ?? vide().meta,
    surChangement: f => auditeurs.push(f),
    surAutreOnglet: f => canal?.addEventListener('message', f),
  };
})();
