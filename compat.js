// Compatibilité avec les navigateurs plus anciens (tablettes pas à jour).
// Chargé en premier : ajoute seulement ce qui manque, ne remplace jamais une fonction déjà présente.
'use strict';

// structuredClone (Chrome 98, Safari 15.4) : copie profonde des données de l'appli.
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = function structuredClone(valeur) {
    const vus = new Map(); // gère les références multiples / circulaires
    const copier = v => {
      if (v === null || typeof v !== 'object') {
        if (typeof v === 'function' || typeof v === 'symbol') throw new DOMException('Valeur impossible à copier', 'DataCloneError');
        return v;
      }
      if (vus.has(v)) return vus.get(v);
      let c;
      if (v instanceof Date) c = new Date(v.getTime());
      else if (v instanceof RegExp) c = new RegExp(v.source, v.flags);
      else if (typeof Blob !== 'undefined' && v instanceof Blob) c = v; // immuable : pas besoin de copier
      else if (v instanceof ArrayBuffer) c = v.slice(0);
      else if (ArrayBuffer.isView(v)) c = v instanceof DataView ? new DataView(v.buffer.slice(0), v.byteOffset, v.byteLength) : v.slice();
      else if (v instanceof Map) { c = new Map(); vus.set(v, c); v.forEach((x, k) => c.set(copier(k), copier(x))); return c; }
      else if (v instanceof Set) { c = new Set(); vus.set(v, c); v.forEach(x => c.add(copier(x))); return c; }
      else if (Array.isArray(v)) { c = new Array(v.length); vus.set(v, c); for (let i = 0; i < v.length; i++) if (i in v) c[i] = copier(v[i]); return c; }
      else { c = {}; vus.set(v, c); for (const k of Object.keys(v)) c[k] = copier(v[k]); return c; }
      vus.set(v, c);
      return c;
    };
    return copier(valeur);
  };
}

// .at() (Chrome 92, Safari 15.4) : élément depuis la fin avec un indice négatif.
function ajouterAt(proto) {
  if (proto && !proto.at) Object.defineProperty(proto, 'at', {
    configurable: true, writable: true,
    value: function at(n) {
      n = Math.trunc(n) || 0;
      if (n < 0) n += this.length;
      return n < 0 || n >= this.length ? undefined : this[n];
    },
  });
}
ajouterAt(Array.prototype);
ajouterAt(String.prototype);
if (typeof Int8Array !== 'undefined') ajouterAt(Object.getPrototypeOf(Int8Array.prototype));

// findLast / findLastIndex (Chrome 97, Safari 15.4).
if (!Array.prototype.findLastIndex) Object.defineProperty(Array.prototype, 'findLastIndex', {
  configurable: true, writable: true,
  value: function findLastIndex(f, ceci) { for (let i = this.length - 1; i >= 0; i--) if (f.call(ceci, this[i], i, this)) return i; return -1; },
});
if (!Array.prototype.findLast) Object.defineProperty(Array.prototype, 'findLast', {
  configurable: true, writable: true,
  value: function findLast(f, ceci) { const i = this.findLastIndex(f, ceci); return i < 0 ? undefined : this[i]; },
});

// Object.hasOwn (Chrome 93, Safari 15.4).
if (!Object.hasOwn) Object.defineProperty(Object, 'hasOwn', {
  configurable: true, writable: true,
  value: (o, k) => Object.prototype.hasOwnProperty.call(o, k),
});
