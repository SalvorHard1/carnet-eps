'use strict';
/* ---------- Carnet École : outils de la classe, suite (onglet Outils) ----------
   Ajoutés le 8 novembre 2026, à la demande de l'enseignant (des outils de professeur des écoles, pas de sport) :
   - La classe : Métiers de la classe, Coupons rendus, Bibliothèque ;
   - Le temps : Minuteur visuel, Journée (d'après le cahier journal) ;
   - La parole et les groupes : Tour de parole, Niveau sonore, Consignes en grand.
   Gardés dans le carnet (ils suivent sur la clé et la tablette) : classe.metiers, classe.coupons, classe.prets.
   Sur cet appareil seulement (etatOutils) : minuteur, consignes, tour de parole, seuil du niveau sonore.
   Niveau sonore : le micro est analysé sur place, rien n'est enregistré ni envoyé.
   Icônes : ecole.js › DEUX_ENCRES_OUTILS. Événements : boutons data-ecl. (Chargé après ecoleoutils.js.) */

OUTILS.push(
  { id: 'metiers', famille: 'classe', disciplines: ['ecole'], icone: '', nom: 'Métiers de la classe', info: 'Qui distribue, qui efface : les métiers tournent chaque semaine', classe: true, eleve: false, sansEffacer: true },
  { id: 'coupons', famille: 'classe', disciplines: ['ecole'], icone: '', nom: 'Coupons rendus', info: 'Autorisation, sortie, cantine : qui a rendu son papier', classe: true, eleve: false, sansEffacer: true },
  { id: 'biblio', famille: 'classe', disciplines: ['ecole'], icone: '', nom: 'Bibliothèque', info: 'Les livres prêtés et à rendre, élève par élève', classe: true, eleve: false, sansEffacer: true },
  { id: 'minuteur', famille: 'temps', disciplines: ['ecole'], icone: '', nom: 'Minuteur visuel', info: 'Le temps qui reste, en grand disque qui se vide', sansEffacer: true },
  { id: 'journee', famille: 'temps', disciplines: ['ecole'], icone: '', nom: 'Journée', info: 'Le déroulé de la journée au tableau, l’étape en cours en évidence', classe: true, sansEffacer: true },
  { id: 'parole', famille: 'groupes', disciplines: ['ecole'], icone: '', nom: 'Tour de parole', info: 'Qui a déjà parlé : donner la parole à ceux qu’on entend moins', classe: true, eleve: false, sansEffacer: true },
  { id: 'sonore', famille: 'groupes', disciplines: ['ecole'], icone: '', nom: 'Niveau sonore', info: 'Le bruit de la classe en jauge ; rien n’est enregistré', eleve: false, sansEffacer: true },
  { id: 'consignes', famille: 'groupes', disciplines: ['ecole'], icone: '', nom: 'Consignes en grand', info: 'Seul, à deux, en silence… la façon de travailler, affichée', sansEffacer: true },
);
// Dans chaque famille, les outils dans l'ordre voulu (Minuteur et Journée avant Ateliers). Équipes reste avant Tirage : l'ordre des outils de l'EPS ne change pas.
{
  const ordre = ['rituels', 'besoin', 'plan', 'metiers', 'coupons', 'biblio', 'minuteur', 'journee', 'ateliers', 'equipes', 'tirage', 'parole', 'sonore', 'consignes'];
  const rang = o => (ordre.includes(o.id) ? ordre.indexOf(o.id) : 100);
  const ecole = OUTILS.filter(o => ordre.includes(o.id)).sort((a, b) => rang(a) - rang(b));
  let k = 0;
  OUTILS.forEach((o, i) => { if (ordre.includes(o.id)) OUTILS[i] = ecole[k++]; });
}

// Lundi de la semaine d'une date (dimanche : le lundi d'avant).
const lundiDe = date => decalerJour(date, -((new Date(date + 'T12:00').getDay() + 6) % 7));
const idCourt = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const classeFraiche = c => Donnees.get('classes', c.id) || c;
const ecrireClasse = (c, champs) => { Donnees.ecrire('classes', { ...classeFraiche(c), ...champs }); rendreOutil(); };
const elevesTries = c => [...elevesDe(c.id)].sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, 'fr'));
const nomComplet = el => `${el.prenom || ''} ${el.nom || ''}`.trim();

/* ---------- Minuteur visuel : un disque rouge qui se vide, lisible de loin ---------- */

const DUREES_MINUTEUR = [1, 2, 3, 5, 10, 15, 20, 30];
const etatMinuteur = () => (etatOutils.minuteur ??= { duree: 300, debut: null, cumul: 0 });
const resteMinuteur = () => { const m = etatMinuteur(); return Math.max(0, m.duree * 1000 - m.cumul - (m.debut ? Date.now() - m.debut : 0)); };
let ticMinuteur = null;
// Le secteur qui reste, en partant de midi dans le sens des aiguilles d'une montre (disque de rayon 90 centré en 100, 100).
function secteurMinuteur(f) {
  if (f >= 0.9999) return 'M100 10 A90 90 0 1 1 99.99 10 Z';
  if (f <= 0) return '';
  const a = 2 * Math.PI * f, x = 100 + 90 * Math.sin(a), y = 100 - 90 * Math.cos(a);
  return `M100 100 L100 10 A90 90 0 ${f > 0.5 ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)} Z`;
}
function majMinuteur() {
  const m = etatMinuteur(), reste = resteMinuteur(), s = $('#secteur-minuteur'), t = $('#temps-minuteur');
  if (!s || !t) { clearInterval(ticMinuteur); ticMinuteur = null; return; } // (outil quitté : le temps continue, l'affichage s'arrête)
  s.setAttribute('d', secteurMinuteur(reste / (m.duree * 1000)));
  t.textContent = texteTemps(reste / 1000);
  if (m.debut && reste <= 0) { m.cumul = m.duree * 1000; m.debut = null; sauverOutils(); bipFin(); rendreOutil(); }
}
function htmlMinuteur() {
  const m = etatMinuteur(), reste = resteMinuteur(), fini = reste <= 0, enCours = !!m.debut;
  if (enCours && !ticMinuteur) setTimeout(() => { ticMinuteur ||= setInterval(majMinuteur, 200); });
  return `<div class="filtres-ecole" role="group" aria-label="Durée">${DUREES_MINUTEUR.map(n => `<button type="button" class="puce-ecole${m.duree === n * 60 ? ' actif' : ''}" data-ecl="min-duree" data-arg="${n * 60}" aria-pressed="${m.duree === n * 60}">${n} min</button>`).join('')}
      <label class="choix-tri">Autre<input type="number" min="1" max="180" inputmode="numeric" data-min-perso value="${DUREES_MINUTEUR.includes(m.duree / 60) ? '' : Math.round(m.duree / 60)}" placeholder="min"></label></div>
    <div class="minuteur-ecole${fini ? ' fini' : ''}">
      <svg class="disque-minuteur" viewBox="0 0 200 200" role="img" aria-label="Temps qui reste"><circle cx="100" cy="100" r="96" class="fond-disque"/>
        <path id="secteur-minuteur" class="secteur-disque" d="${secteurMinuteur(reste / (m.duree * 1000))}"/>
        <circle cx="100" cy="100" r="5" class="centre-disque"/></svg>
      <div class="temps-minuteur" id="temps-minuteur" aria-live="off">${fini ? 'Fini !' : texteTemps(reste / 1000)}</div>
      <div class="boutons-minuteur">
        ${fini ? '' : `<button type="button" class="primaire gros" data-ecl="min-go">${enCours ? `${iconeEcole('stop')}Pause` : `${iconeEcole('chrono')}${m.cumul ? 'Reprendre' : 'Départ'}`}</button>`}
        <button type="button" class="gros" data-ecl="min-zero">${iconeEcole('recommencer')}Recommencer</button>
      </div>
    </div>
    <p class="aide">Le disque rouge se vide jusqu’à la fin ; un bip sonne à zéro. « Plein écran » pour l’afficher au tableau.</p>`;
}

/* ---------- Consignes en grand : la façon de travailler, affichée au tableau ---------- */

const CONSIGNES_ECOLE = [
  { id: 'seul', nom: 'Seul', sous: 'Je travaille seul, sans parler', icone: 'eleve' },
  { id: 'deux', nom: 'À deux', sous: 'Avec mon voisin, à voix basse', icone: 'eleves' },
  { id: 'groupe', nom: 'En groupe', sous: 'On s’écoute, chacun participe', icone: 'groupes' },
  { id: 'silence', nom: 'En silence', sous: 'Pas un bruit', icone: 'silence' },
  { id: 'basse', nom: 'À voix basse', sous: 'On chuchote', icone: 'parole' },
  { id: 'ecoute', nom: 'On écoute', sous: 'Les yeux vers le tableau', icone: 'regarder' },
  { id: 'range', nom: 'On range', sous: 'Le matériel à sa place', icone: 'coche' },
  { id: 'coin', nom: 'Au coin regroupement', sous: 'On se retrouve ensemble', icone: 'ecole' },
];
const etatConsignes = () => (etatOutils.consignes ??= { choix: 'seul', perso: [] });
const toutesConsignes = () => [...CONSIGNES_ECOLE, ...etatConsignes().perso.map(t => ({ id: 'perso:' + t, nom: t, sous: '', icone: 'consignes', perso: true }))];
function htmlConsignes() {
  const e = etatConsignes(), liste = toutesConsignes(), x = liste.find(k => k.id === e.choix) || liste[0];
  return `<div class="consigne-grand" aria-live="polite">${iconeEcole(x.icone)}<b>${esc(x.nom)}</b>${x.sous ? `<span>${esc(x.sous)}</span>` : ''}</div>
    <div class="choix-consignes" role="group" aria-label="Choisir la consigne">${liste.map(k => `<button type="button" class="${k.id === x.id ? 'actif' : ''}" data-ecl="consigne" data-arg="${esc(k.id)}" aria-pressed="${k.id === x.id}">${iconeEcole(k.icone)}${esc(k.nom)}</button>`).join('')}</div>
    <div class="outils"><label class="choix-tri">Ma consigne<input data-consigne-texte maxlength="40" placeholder="Ex. : Je relis mon travail"></label>
      <button type="button" data-ecl="consigne-ajout">${iconeEcole('ajouter')}Ajouter</button>
      ${x.perso ? `<button type="button" data-ecl="consigne-retirer">${iconeEcole('corbeille')}Retirer « ${esc(x.nom)} »</button>` : ''}</div>
    <p class="aide">« Plein écran » pour l’afficher au tableau. Tes consignes ajoutées restent sur cet appareil.</p>`;
}

/* ---------- Tour de parole : qui a déjà parlé aujourd'hui, et donner la parole à ceux qu'on entend moins ---------- */

const etatParole = c => {
  const tous = (etatOutils.parole ??= {});
  if (tous[c.id]?.date !== aujourdhui()) tous[c.id] = { date: aujourdhui(), n: {}, pile: [], propose: '' };
  return tous[c.id];
};
function proposerParole(c) {
  const e = etatParole(c), absents = absentsDuJour(c), presents = elevesDe(c.id).filter(el => !absents.includes(el.id));
  if (!presents.length) return toast('Personne n’est présent.');
  const min = Math.min(...presents.map(el => e.n[el.id] || 0)), choix = presents.filter(el => (e.n[el.id] || 0) === min && el.id !== e.propose);
  const liste = choix.length ? choix : presents.filter(el => (e.n[el.id] || 0) === min);
  e.propose = liste[Math.floor(Math.random() * liste.length)].id;
  bipToucher(); rendreOutil();
}
function htmlParole(c) {
  const e = etatParole(c), absents = absentsDuJour(c), eleves = elevesTries(c), tous = elevesDe(c.id);
  const presents = eleves.filter(el => !absents.includes(el.id)), muets = presents.filter(el => !e.n[el.id]).length;
  const propose = tous.find(el => el.id === e.propose);
  return `<div class="outils">
      <button type="button" class="primaire" data-ecl="parole-proposer">${iconeEcole('de')}Proposer quelqu’un</button>
      ${e.pile.length ? `<button type="button" data-ecl="parole-annuler">${iconeEcole('precedent')}Annuler le dernier</button>` : ''}
      <span class="espace"></span>
      <button type="button" data-ecl="parole-zero">${iconeEcole('recommencer')}Nouvelle séance</button>
    </div>
    ${propose ? `<div class="parole-proposee">${Trombi.mini(propose)}<b>${esc(nomEleveOutil(propose))}</b><span class="aide">n’a pas encore beaucoup parlé : touche son nom quand il ou elle a pris la parole.</span></div>` : ''}
    <p class="aide">${muets ? `${pluriel(muets, 'élève')} présent${muets > 1 ? 's' : ''} n’${muets > 1 ? 'ont' : 'a'} pas encore parlé aujourd’hui.` : 'Tout le monde a parlé au moins une fois aujourd’hui.'} Touche un élève chaque fois qu’il prend la parole.</p>
    <div class="cartes-parole">${eleves.map(el => {
      const n = e.n[el.id] || 0, absent = absents.includes(el.id);
      return `<button type="button" class="carte-parole${n ? '' : ' muet'}${absent ? ' absent-outil' : ''}${el.id === e.propose ? ' proposee' : ''}" data-ecl="parole-plus" data-arg="${el.id}" ${absent ? 'disabled' : ''}
        aria-label="${esc(`${nomEleveOutil(el)} : ${n ? `a parlé ${n} fois` : 'pas encore parlé'}${absent ? ', absent' : ''}`)}">${Trombi.mini(el)}<span>${esc(nomCourtClasse(el, tous))}</span>
        <span class="points-parole" aria-hidden="true">${n > 5 ? `<b>${n}</b>` : '<i></i>'.repeat(n)}</span></button>`;
    }).join('')}</div>
    <p class="aide">Les absents du jour (appel) sont grisés. Le compte repart à zéro chaque jour, sur cet appareil.</p>`;
}

/* ---------- Métiers de la classe : qui fait quoi cette semaine ; ils tournent d'un cran chaque semaine ---------- */

const METIERS_DEFAUT = ['Distribuer les cahiers', 'Effacer le tableau', 'Facteur (messages)', 'Ranger la bibliothèque', 'Arroser les plantes', 'Chef de rang', 'Lumières et volets', 'Date et météo'];
const metiersDe = c => ({ liste: METIERS_DEFAUT, attrib: {}, depart: 0, semaine: '', ...(classeFraiche(c).metiers || {}) });
// Une nouvelle répartition : les élèves dans l'ordre alphabétique, en commençant au rang `depart`.
function repartirMetiers(c, depart) {
  const m = metiersDe(c), eleves = elevesTries(c), attrib = {};
  if (eleves.length) m.liste.forEach((nom, i) => { attrib[i] = eleves[(depart + i) % eleves.length].id; });
  return { ...m, attrib, depart, semaine: lundiDe(aujourdhui()) };
}
function htmlMetiers(c) {
  const m = metiersDe(c), eleves = elevesTries(c), tous = elevesDe(c.id);
  const pris = new Set(Object.values(m.attrib)), sans = eleves.filter(el => !pris.has(el.id));
  return `<div class="outils">
      ${m.semaine ? `<span class="aide">Répartition de la semaine du <b>${esc(dateCourte(m.semaine))}</b></span>` : '<span class="aide">Pas encore de répartition.</span>'}
      <span class="espace"></span>
      <button type="button" class="primaire" data-ecl="metiers-tourner">${iconeEcole('partager')}${m.semaine ? 'Semaine suivante : faire tourner' : 'Répartir les métiers'}</button>
      <button type="button" data-ecl="metiers-hasard">${iconeEcole('de')}Au hasard</button>
      <button type="button" data-ecl="metiers-imprimer" ${Object.keys(m.attrib).length ? '' : 'disabled'}>${iconeEcole('imprimer')}Imprimer</button>
    </div>
    <ul class="liste-metiers">${m.liste.map((nom, i) => `<li><span class="nom-metier">${esc(nom)}</span>
      <select data-metier-eleve="${i}" aria-label="Élève pour « ${esc(nom)} »"><option value="">—</option>${eleves.map(el => `<option value="${el.id}" ${m.attrib[i] === el.id ? 'selected' : ''}>${esc(nomCourtClasse(el, tous))}</option>`).join('')}</select>
      <button type="button" class="icone-petit" data-ecl="metier-retirer" data-arg="${i}" aria-label="Retirer le métier « ${esc(nom)} »" title="Retirer ce métier">${iconeEcole('corbeille')}</button></li>`).join('')}</ul>
    <div class="outils"><label class="choix-tri">Nouveau métier<input data-metier-texte maxlength="40" placeholder="Ex. : Responsable des crayons"></label>
      <button type="button" data-ecl="metier-ajout">${iconeEcole('ajouter')}Ajouter</button></div>
    ${Object.keys(m.attrib).length && sans.length ? `<p class="aide">Sans métier cette semaine : ${sans.map(el => esc(nomCourtClasse(el, tous))).join(', ')}.</p>` : ''}
    <p class="aide">« Faire tourner » donne à chacun le métier suivant (ordre alphabétique). Touche un nom pour le changer. Les métiers sont gardés dans le carnet.</p>`;
}
function imprimerMetiers(c) {
  const m = metiersDe(c), tous = elevesDe(c.id);
  const lignes = m.liste.map((nom, i) => { const el = tous.find(x => x.id === m.attrib[i]); return `<tr><td>${esc(nom)}</td><td>${el ? esc(nomComplet(el)) : ''}</td></tr>`; }).join('');
  imprimerZoneEcole(`<h1>Métiers de la classe — ${esc(c.nom)}</h1>${m.semaine ? `<p>Semaine du ${esc(dateCourte(m.semaine))}</p>` : ''}<table class="plan-imprime metiers-imprime"><tbody>${lignes}</tbody></table>`, `Métiers ${c.nom}`);
}

/* ---------- Coupons rendus : un papier à rapporter, qui l'a rendu ---------- */

const couponsDe = c => classeFraiche(c).coupons || [];
const couponActif = c => { const l = couponsDe(c), id = (etatOutils.couponActif ??= {})[c.id]; return l.find(x => x.id === id) || l[0] || null; };
function ecrireCoupon(c, coupon) { ecrireClasse(c, { coupons: couponsDe(c).map(x => (x.id === coupon.id ? coupon : x)) }); }
function htmlCoupons(c) {
  const liste = couponsDe(c), k = couponActif(c), eleves = elevesTries(c), tous = elevesDe(c.id);
  const rendus = k ? eleves.filter(el => k.rendus?.[el.id]).length : 0, pc = eleves.length ? Math.round(100 * rendus / eleves.length) : 0;
  return `<div class="outils"><label class="choix-tri">Nouveau coupon<input data-coupon-texte maxlength="60" placeholder="Ex. : Autorisation sortie au musée"></label>
      <button type="button" class="${liste.length ? '' : 'primaire'}" data-ecl="coupon-ajout">${iconeEcole('ajouter')}Créer</button></div>
    ${liste.length ? `<div class="filtres-ecole" role="group" aria-label="Choisir le coupon">${liste.map(x => `<button type="button" class="puce-ecole${x.id === k.id ? ' actif' : ''}" data-ecl="coupon-choisir" data-arg="${x.id}" aria-pressed="${x.id === k.id}">${esc(x.titre)}</button>`).join('')}</div>` : ''}
    ${k ? `<div class="tete-coupon"><h3>${iconeEcole('coupons')}${esc(k.titre)} <span class="aide">donné le ${esc(dateCourte(k.date))}</span></h3>
        <span class="compte-coupon"><b>${rendus}</b> / ${eleves.length} rendus</span>
        <span class="jauge-coupon" role="img" aria-label="${pc} % rendus"><i data-l="${pc}"></i></span></div>
      <div class="cartes-coupon">${eleves.map(el => { const ok = !!k.rendus?.[el.id]; return `<button type="button" class="carte-coupon${ok ? ' rendu' : ''}" data-ecl="coupon-rendu" data-arg="${el.id}" aria-pressed="${ok}">
        ${ok ? iconeEcole('present') : '<span class="case-vide" aria-hidden="true"></span>'}<span>${esc(nomCourtClasse(el, tous))}</span></button>`; }).join('')}</div>
      <div class="outils">
        <button type="button" data-ecl="coupon-manque" ${rendus < eleves.length ? '' : 'disabled'}>${iconeEcole('copier')}Copier la liste de ceux qui manquent</button>
        <span class="espace"></span>
        <button type="button" data-ecl="coupon-retirer">${iconeEcole('corbeille')}Supprimer ce coupon</button>
      </div>` : '<p class="aide">Crée un coupon (autorisation, sortie, cantine…), puis touche chaque élève qui l’a rendu.</p>'}
    <p class="aide">Les coupons sont gardés dans le carnet.</p>`;
}

/* ---------- Bibliothèque : les livres prêtés et à rendre ---------- */

const JOURS_PRET = 21; // au-delà : « à rendre » en évidence
const pretsDe = c => classeFraiche(c).prets || [];
const joursDepuis = date => Math.round((new Date(aujourdhui() + 'T12:00') - new Date(date + 'T12:00')) / 86400000);
function htmlBiblio(c) {
  const prets = pretsDe(c), eleves = elevesTries(c), tous = elevesDe(c.id), nom = id => { const el = tous.find(x => x.id === id); return el ? nomCourtClasse(el, tous) : '?'; };
  const enCours = prets.filter(p => !p.rendu).sort((a, b) => a.date.localeCompare(b.date)), rendus = prets.filter(p => p.rendu).sort((a, b) => b.rendu.localeCompare(a.rendu)).slice(0, 8);
  const enRetard = enCours.filter(p => joursDepuis(p.date) > JOURS_PRET).length;
  return `<div class="outils">
      <label class="choix-tri">Élève<select data-biblio-eleve><option value="">—</option>${eleves.map(el => `<option value="${el.id}" ${etatOutils.biblioEleve === el.id ? 'selected' : ''}>${esc(nomCourtClasse(el, tous))}</option>`).join('')}</select></label>
      <label class="choix-tri">Livre<input data-biblio-titre maxlength="80" placeholder="Titre du livre"></label>
      <button type="button" class="primaire" data-ecl="biblio-preter">${iconeEcole('biblio')}Prêter</button>
    </div>
    <h3>En cours <span class="aide">${enCours.length}${enRetard ? ` · ${enRetard} depuis plus de ${JOURS_PRET} jours` : ''}</span></h3>
    ${enCours.length ? `<ul class="liste-prets">${enCours.map(p => { const j = joursDepuis(p.date), vieux = j > JOURS_PRET; return `<li class="${vieux ? 'a-rendre' : ''}">
      <b>${esc(nom(p.eleve))}</b><span class="titre-pret">${esc(p.titre)}</span><span class="aide">${j ? `depuis ${pluriel(j, 'jour')}` : 'aujourd’hui'}</span>
      <button type="button" data-ecl="biblio-rendu" data-arg="${p.id}">${iconeEcole('coche')}Rendu</button></li>`; }).join('')}</ul>` : '<p class="aide">Aucun livre prêté en ce moment.</p>'}
    ${rendus.length ? `<h3>Rendus récemment</h3><ul class="liste-prets rendus">${rendus.map(p => `<li><b>${esc(nom(p.eleve))}</b><span class="titre-pret">${esc(p.titre)}</span><span class="aide">rendu le ${esc(dateCourte(p.rendu))}</span>
      <button type="button" class="icone-petit" data-ecl="biblio-effacer" data-arg="${p.id}" aria-label="Effacer ce prêt" title="Effacer de la liste">${iconeEcole('corbeille')}</button></li>`).join('')}</ul>` : ''}
    <p class="aide">Les prêts sont gardés dans le carnet. Au-delà de ${JOURS_PRET} jours, un prêt ressort en orange.</p>`;
}

/* ---------- Journée : le déroulé du jour d'après le cahier journal, l'étape en cours en évidence ---------- */

const minutesDe = h => { const [a, b] = String(h || '').split(':').map(Number); return Number.isFinite(a) ? a * 60 + (b || 0) : null; };
let ticJournee = null;
function htmlJournee(c) {
  const seances = seancesDuJour(c, aujourdhui()), maintenant = new Date().getHours() * 60 + new Date().getMinutes();
  if (!ticJournee) ticJournee = setInterval(() => { if (ui.vue === 'outils' && ui.outil === 'journee') rendreOutil(); else { clearInterval(ticJournee); ticJournee = null; } }, 30000);
  if (!seances.length) {
    return `<div class="vide"><p>Rien de prévu aujourd’hui dans le cahier journal.</p>
      <button type="button" class="primaire" data-vue="entrainement">${iconeEcole('cahier')}Ouvrir le cahier journal</button>
      <p class="aide">La journée se remplit toute seule avec les séances du jour (horaire, matière, titre).</p></div>`;
  }
  // Étape en cours : celle dont l'horaire contient l'heure actuelle (sans fin : jusqu'au début de la suivante).
  const debuts = seances.map(s => minutesDe(s.heure));
  const enCours = seances.findIndex((s, i) => debuts[i] !== null && debuts[i] <= maintenant
    && maintenant < (minutesDe(s.fin) ?? debuts.slice(i + 1).find(x => x !== null) ?? 24 * 60));
  return `<p class="aide">${esc(jourLong(aujourdhui()))} · d’après le cahier journal</p>
    <ol class="liste-journee">${seances.map((s, i) => {
      const fini = enCours >= 0 ? i < enCours : debuts[i] !== null && (minutesDe(s.fin) ?? debuts[i] + 1) <= maintenant;
      return `<li class="${i === enCours ? 'en-cours' : fini ? 'passee' : ''}"${i === enCours ? ' aria-current="step"' : ''}>
        <span class="heure-journee">${esc(horaireSeance(s)) || '—'}</span>
        <span class="titre-journee">${s.ca ? `<span class="chip-matiere">${esc(nomMatiere(c, s.ca))}</span>` : ''}<b>${esc(s.titre)}</b></span>
        ${i === enCours ? '<span class="maintenant-journee">Maintenant</span>' : fini ? iconeEcole('coche', 'Fait') : ''}</li>`;
    }).join('')}</ol>
    <p class="aide">« Plein écran » pour l’afficher au tableau. Pour changer la journée : onglet Cahier journal.</p>`;
}

/* ---------- Niveau sonore : jauge du bruit au micro (analyse sur place, rien n'est enregistré ni envoyé) ---------- */

const sonore = { flux: null, ctx: null, analyseur: null, raf: 0, niveau: 0 };
const seuilSonore = () => (etatOutils.sonoreSeuil ??= 60);
function arreterSonore() {
  cancelAnimationFrame(sonore.raf);
  sonore.flux?.getTracks().forEach(t => t.stop());
  sonore.ctx?.close?.();
  Object.assign(sonore, { flux: null, ctx: null, analyseur: null, raf: 0, niveau: 0 });
}
async function demarrerSonore() {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('Le micro n’est pas disponible sur cet appareil.');
  let flux;
  try { flux = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }); } catch { throw new Error('Le micro n’a pas été autorisé. Autorise-le dans le navigateur, puis réessaie.'); }
  const ctx = new (window.AudioContext || window.webkitAudioContext)(), analyseur = ctx.createAnalyser();
  analyseur.fftSize = 1024;
  ctx.createMediaStreamSource(flux).connect(analyseur); // (rien n'est relié aux haut-parleurs ni enregistré)
  Object.assign(sonore, { flux, ctx, analyseur });
  rendreOutil();
  const tampon = new Float32Array(analyseur.fftSize);
  const boucle = () => {
    const jauge = $('#jauge-sonore');
    if (!jauge || !sonore.analyseur) return arreterSonore(); // (outil quitté : le micro est coupé)
    sonore.analyseur.getFloatTimeDomainData(tampon);
    const rms = Math.sqrt(tampon.reduce((s, v) => s + v * v, 0) / tampon.length);
    const v = Math.max(0, Math.min(100, (20 * Math.log10(rms || 1e-6) + 60) * (100 / 55))); // de -60 dB à -5 dB
    sonore.niveau = sonore.niveau * 0.85 + v * 0.15;
    const s = seuilSonore(), etat = sonore.niveau >= s ? 'fort' : sonore.niveau >= s * 0.75 ? 'monte' : 'calme';
    jauge.style.setProperty('--niveau', sonore.niveau.toFixed(1) + '%');
    jauge.dataset.etat = etat;
    const t = $('#texte-sonore');
    if (t) t.textContent = { calme: 'Calme', monte: 'Ça monte…', fort: 'Trop fort !' }[etat];
    sonore.raf = requestAnimationFrame(boucle);
  };
  sonore.raf = requestAnimationFrame(boucle);
}
function htmlSonore() {
  const actif = !!sonore.analyseur, s = seuilSonore();
  if (!actif) {
    return `<div class="vide"><p>La jauge montre le bruit de la classe, en direct.</p>
      <button type="button" class="primaire gros" data-ecl="sonore-go">${iconeEcole('sonore')}Activer le micro</button>
      <p class="aide">Le son est analysé sur l’appareil, au fur et à mesure : <b>rien n’est enregistré ni envoyé</b>. Le micro se coupe dès que tu quittes l’outil.</p></div>`;
  }
  return `<div class="sonore-ecole">
      <div class="jauge-sonore" id="jauge-sonore" data-etat="calme" role="img" aria-label="Niveau sonore de la classe"><i class="remplissage-sonore"></i><i class="seuil-sonore" data-g="${s}"></i></div>
      <div class="cote-sonore"><b id="texte-sonore">Calme</b>
        <label class="choix-tri">Seuil « trop fort »<input type="range" min="20" max="95" step="1" value="${s}" data-sonore-seuil></label>
        <button type="button" data-ecl="sonore-stop">${iconeEcole('stop')}Couper le micro</button></div>
    </div>
    <p class="aide">Vert : calme · orange : ça monte · rouge : au-dessus du seuil. Règle le seuil selon ta classe.</p>`;
}

Object.assign(RENDUS_OUTILS, { metiers: htmlMetiers, coupons: htmlCoupons, biblio: htmlBiblio, minuteur: htmlMinuteur, journee: htmlJournee, parole: htmlParole, sonore: htmlSonore, consignes: htmlConsignes });

// Largeurs et positions posées par script (la page n'accepte pas de style écrit dans le HTML).
new MutationObserver(() => {
  document.querySelectorAll('#vue .jauge-coupon [data-l]').forEach(e => { e.style.width = e.dataset.l + '%'; });
  document.querySelectorAll('#vue .seuil-sonore[data-g]').forEach(e => { e.style.bottom = e.dataset.g + '%'; });
  if (sonore.analyseur && !document.getElementById('jauge-sonore')) arreterSonore();
}).observe(document.getElementById('vue'), { childList: true, subtree: true });

/* ---------- Événements ---------- */

function ajouterTexte(selecteur, faire) {
  const champ = $(selecteur), t = champ?.value.trim();
  if (!t) { champ?.focus(); return toast('Écris d’abord le texte.'); }
  faire(t);
}
document.addEventListener('click', e => {
  const b = e.target.closest?.('#vue button[data-ecl]');
  if (!b || b.disabled || !avecEcole()) return;
  const c = classeActive(), arg = b.dataset.arg;
  switch (b.dataset.ecl) {
    // Minuteur
    case 'min-duree': { const m = etatMinuteur(); Object.assign(m, { duree: +arg, debut: null, cumul: 0 }); return rendreOutil(); }
    case 'min-go': {
      const m = etatMinuteur();
      debloquerSon();
      if (m.debut) { m.cumul += Date.now() - m.debut; m.debut = null; } else { m.debut = Date.now(); bipCourt(); }
      return rendreOutil();
    }
    case 'min-zero': Object.assign(etatMinuteur(), { debut: null, cumul: 0 }); return rendreOutil();
    // Consignes
    case 'consigne': etatConsignes().choix = arg; return rendreOutil();
    case 'consigne-ajout': return ajouterTexte('[data-consigne-texte]', t => {
      const e2 = etatConsignes();
      if (!e2.perso.includes(t)) e2.perso.push(t);
      e2.choix = 'perso:' + t; rendreOutil();
    });
    case 'consigne-retirer': { const e2 = etatConsignes(); e2.perso = e2.perso.filter(t => 'perso:' + t !== e2.choix); e2.choix = 'seul'; return rendreOutil(); }
  }
  if (!c) return;
  switch (b.dataset.ecl) {
    // Tour de parole
    case 'parole-plus': { const p = etatParole(c); p.n[arg] = (p.n[arg] || 0) + 1; p.pile.push(arg); if (p.propose === arg) p.propose = ''; return rendreOutil(); }
    case 'parole-annuler': { const p = etatParole(c), id = p.pile.pop(); if (id) p.n[id] = Math.max(0, (p.n[id] || 0) - 1); return rendreOutil(); }
    case 'parole-proposer': return proposerParole(c);
    case 'parole-zero': return lancer(async () => {
      if (Object.keys(etatParole(c).n).length && !(await confirmer('Remettre tous les comptes de parole à zéro ?', 'Remettre à zéro'))) return;
      etatOutils.parole[c.id] = { date: aujourdhui(), n: {}, pile: [], propose: '' }; rendreOutil();
    });
    // Métiers
    case 'metiers-tourner': { const m = metiersDe(c); return ecrireClasse(c, { metiers: repartirMetiers(c, m.semaine ? m.depart + m.liste.length : 0) }); }
    case 'metiers-hasard': return ecrireClasse(c, { metiers: repartirMetiers(c, Math.floor(Math.random() * Math.max(1, elevesDe(c.id).length))) });
    case 'metiers-imprimer': return lancer(() => imprimerMetiers(c));
    case 'metier-ajout': return ajouterTexte('[data-metier-texte]', t => { const m = metiersDe(c); ecrireClasse(c, { metiers: { ...m, liste: [...m.liste, t] } }); });
    case 'metier-retirer': return lancer(async () => {
      const m = metiersDe(c), i = +arg;
      if (!(await confirmer(`Retirer le métier « ${m.liste[i]} » ?`, 'Retirer'))) return;
      const attrib = {};
      m.liste.forEach((_, k) => { if (k !== i && m.attrib[k]) attrib[k < i ? k : k - 1] = m.attrib[k]; });
      ecrireClasse(c, { metiers: { ...m, liste: m.liste.filter((_, k) => k !== i), attrib } });
    });
    // Coupons
    case 'coupon-ajout': return ajouterTexte('[data-coupon-texte]', t => {
      const k = { id: idCourt(), titre: t, date: aujourdhui(), rendus: {} };
      (etatOutils.couponActif ??= {})[c.id] = k.id;
      ecrireClasse(c, { coupons: [k, ...couponsDe(c)] });
    });
    case 'coupon-choisir': (etatOutils.couponActif ??= {})[c.id] = arg; return rendreOutil();
    case 'coupon-rendu': { const k = couponActif(c); if (!k) return; const rendus = { ...(k.rendus || {}) }; if (rendus[arg]) delete rendus[arg]; else rendus[arg] = true; return ecrireCoupon(c, { ...k, rendus }); }
    case 'coupon-manque': return lancer(() => {
      const k = couponActif(c), manquent = elevesTries(c).filter(el => !k.rendus?.[el.id]).map(nomComplet);
      return copierTexte(`${k.titre} — pas encore rendu (${manquent.length}) :\n${manquent.join('\n')}`);
    });
    case 'coupon-retirer': return lancer(async () => {
      const k = couponActif(c);
      if (!k || !(await confirmer(`Supprimer le coupon « ${k.titre} » ?`))) return;
      ecrireClasse(c, { coupons: couponsDe(c).filter(x => x.id !== k.id) });
    });
    // Bibliothèque
    case 'biblio-preter': {
      const eleve = $('[data-biblio-eleve]')?.value;
      if (!eleve) return toast('Choisis d’abord l’élève.');
      return ajouterTexte('[data-biblio-titre]', t => { etatOutils.biblioEleve = ''; ecrireClasse(c, { prets: [...pretsDe(c), { id: idCourt(), eleve, titre: t, date: aujourdhui(), rendu: '' }] }); });
    }
    case 'biblio-rendu': return ecrireClasse(c, { prets: pretsDe(c).map(p => (p.id === arg ? { ...p, rendu: aujourdhui() } : p)) });
    case 'biblio-effacer': return ecrireClasse(c, { prets: pretsDe(c).filter(p => p.id !== arg) });
    // Niveau sonore
    case 'sonore-go': return lancer(() => demarrerSonore());
    case 'sonore-stop': arreterSonore(); return rendreOutil();
  }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (!t.closest?.('#vue') || !avecEcole()) return;
  const c = classeActive();
  if (t.matches('[data-min-perso]')) { const n = Math.round(+t.value); if (n >= 1 && n <= 180) { Object.assign(etatMinuteur(), { duree: n * 60, debut: null, cumul: 0 }); rendreOutil(); } return; }
  if (t.matches('[data-biblio-eleve]')) { etatOutils.biblioEleve = t.value; sauverOutils(); return; }
  if (t.matches('[data-metier-eleve]') && c) {
    const m = metiersDe(c), attrib = { ...m.attrib };
    if (t.value) attrib[t.dataset.metierEleve] = t.value; else delete attrib[t.dataset.metierEleve];
    return ecrireClasse(c, { metiers: { ...m, attrib } });
  }
});
document.addEventListener('input', e => {
  if (!e.target.matches?.('#vue [data-sonore-seuil]')) return;
  etatOutils.sonoreSeuil = +e.target.value; sauverOutils();
  const g = $('#vue .seuil-sonore'); if (g) g.style.bottom = e.target.value + '%';
});
// Entrée dans un champ de texte : comme le bouton à côté.
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || !avecEcole()) return;
  const t = e.target, cible = { consigneTexte: 'consigne-ajout', metierTexte: 'metier-ajout', couponTexte: 'coupon-ajout', biblioTitre: 'biblio-preter' };
  const k = Object.keys(cible).find(x => t.dataset?.[x] !== undefined);
  if (k && t.closest('#vue')) { e.preventDefault(); $(`#vue [data-ecl="${cible[k]}"]`)?.click(); }
});

/* ---------- Classe exemple : quelques métiers, un coupon et des prêts, pour voir les outils remplis ---------- */
function remplirOutilsClasseExemple(c) {
  const eleves = elevesTries(c), auj = aujourdhui();
  if (!eleves.length) return;
  const metiers = repartirMetiers(c, 0), rendus = {};
  eleves.forEach((el, i) => { if (i % 4) rendus[el.id] = true; });
  const titres = ['Le Petit Prince', 'Les Contes du chat perché', 'Ernest et Célestine', 'Max et les Maximonstres', 'Le Loup qui voulait changer de couleur'];
  const prets = titres.map((titre, i) => ({ id: idCourt() + i, eleve: eleves[(i * 3) % eleves.length].id, titre, date: decalerJour(auj, -[3, 9, 25, 30, 12][i]), rendu: i === 4 ? decalerJour(auj, -1) : '' }));
  Donnees.ecrire('classes', { ...classeFraiche(c), metiers, coupons: [{ id: idCourt(), titre: 'Autorisation sortie au musée', date: decalerJour(auj, -4), rendus }], prets });
}
