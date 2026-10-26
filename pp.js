'use strict';
// ⭐ Espace professeur principal (onglet « Prof principal », visible dès qu'une classe est marquée « Je suis PP »
// dans sa fiche ✎). Tout est fait PAR L'APPLI, sur l'appareil : rien n'est envoyé nulle part.
//  - 📥 Bulletins : les bulletins PDF (École Directe, Pronote), un par élève ou toute la classe dans un seul fichier,
//    sont lus par le lecteur PDF de l'appli (edtpdf.js). Seuls sont gardés : matières, moyennes, appréciations des
//    collègues, absences et retards.
//  - 📊 Tableau de la classe, ✍ appréciation générale (mêmes principes que les appréciations de matière :
//    rubriques, ton, style, longueur), mention proposée, 🗣 conseil de classe, 🗂 suivi des élèves.
// Rangement : collection `suivis` (chiffrée sur la clé avec le reste), marqués `pp: true` :
//   « pp bulletin P1 », « pp appréciation P1 » (texte, niveaux, mention, notes du conseil), « pp journal » (suivi).

const SECTIONS_PP = { bulletins: '📥 Bulletins', tableau: '📊 Tableau', appreciations: '✍ Appréciations', conseil: '🗣 Conseil', suivi: '🗂 Suivi' };
const classesPP = () => classesTriees().filter(c => c.pp);
const idBulletinPP = (eleveId, periode) => idSuivi(eleveId, 'pp bulletin ' + periode);
const idApprPP = (eleveId, periode) => idSuivi(eleveId, 'pp appréciation ' + periode);
const bulletinPP = (eleveId, periode) => Donnees.get('suivis', idBulletinPP(eleveId, periode));

/* ---------- Lecture d'un bulletin PDF ---------- */

const BulletinPdf = (() => {
  const RE_PROF = /^(m\.|mme\b|mlle\b|mr\.?\b|mmes\b|mm\.|m\s)/i;
  const RE_GROUPE = /^(tronc commun|enseignements?( communs?| de sp[ée]cialit[ée]s?| optionnels?| obligatoires?)?|options?|sp[ée]cialit[ée]s?|langues vivantes)$/i;
  const RE_TETE = /^(mati[èe]res?|disciplines?|enseignements?)$/i;
  const RE_FIN = /^(moyennes?\s+g[ée]n[ée]rales?|absences?\s*:|appr[ée]ciation\s+g[ée]n[ée]rale|avis du conseil|vie scolaire|le chef d|d[ée]cision|mention)/i;
  // Jetons d'une colonne de chiffres : « 4/4 », « 14,81 », « 2h00 », « Abs », « Disp », « N.Not »…
  const RE_JETON = /^(\d+([.,]\d+)?(\/\d+)?|\d+h\d*|abs\.?|disp\.?|n\.?\s?n\.?|n\.?\s?not\.?|n\.?\s?e\.?|-|\*|coef\.?)$/i;

  const lettres = t => (t.match(/\p{L}/gu) || []).length;
  const decimal = t => { const n = +t.replace(',', '.'); return /^\d{1,2}[.,]\d{1,2}$/.test(t) && n <= 20 ? n : null; };

  // Une page : position des colonnes (reprise de la page précédente si l'en-tête n'y est pas répété).
  function colonnes(items, prec) {
    const tete = items.find(i => RE_TETE.test(i.t.trim()));
    if (!tete) return prec;
    // (En-tête sur deux lignes « Moyennes / Élève Clas. » : à quelques points près ; la 1re matière est juste dessous.)
    const bande = items.filter(i => i !== tete && Math.abs(i.y - tete.y) < 8);
    const droite = bande.filter(i => i.x > tete.fin);
    if (!droite.length) return prec;
    const centre = re => { const i = droite.find(x => re.test(x.t.trim())); return i ? (i.x + i.fin) / 2 : null; };
    return {
      yTete: Math.min(tete.y, ...bande.map(i => i.y)),
      xNum: Math.min(...droite.map(i => i.x)),
      xEleve: centre(/^(moy(\.|enne)?\s*)?(de\s+l['’])?[ée]l[èe]ve$/i),
      xClasse: centre(/^(moy(\.|enne)?\s*)?(de\s+(la\s+)?)?cl(asse|as\.?)$/i),
      xAppr: prec?.xAppr ?? null,
    };
  }

  // Chiffres d'un morceau de texte (avec leur position approchée) + le texte qui suit les chiffres.
  function decouper(i) {
    const mots = i.t.trim().split(/\s+/), nombres = [];
    let k = 0, pos = 0;
    const long = i.t.length || 1;
    for (; k < mots.length && RE_JETON.test(mots[k]); k++) {
      const n = decimal(mots[k]);
      if (n !== null) nombres.push({ n, x: i.x + ((i.fin || i.x) - i.x) * ((pos + mots[k].length / 2) / long) });
      pos += mots[k].length + 1;
    }
    return { nombres, reste: mots.slice(k).join(' ') };
  }

  function lignesPage(p, cfg) {
    const items = p.items.filter(i => !i.vertical && i.t.trim()).sort((a, b) => b.y - a.y || a.x - b.x);
    cfg = colonnes(items, cfg);
    if (!cfg) return { cfg, matieres: [] };
    const fin = items.filter(i => i.y < cfg.yTete && RE_FIN.test(i.t.trim())).reduce((m, i) => Math.max(m, i.y), -Infinity);
    const zone = items.filter(i => i.y < cfg.yTete - 3 && i.y > fin + 1);
    const gauche = zone.filter(i => i.x < cfg.xNum - 2), droite = zone.filter(i => i.x >= cfg.xNum - 2);
    // Colonne des appréciations : le début des textes longs (pas ceux qui commencent par des chiffres).
    const longs = droite.filter(i => lettres(i.t) >= 15 && /^\p{L}/u.test(i.t.trim()));
    if (longs.length) cfg.xAppr = Math.min(...longs.map(i => i.x));
    const xAppr = cfg.xAppr ?? Infinity;

    // Matières (le nom du prof, sur la ligne d'après, n'en est pas une ; un nom coupé sur deux lignes est recollé).
    const matieres = [];
    for (const i of gauche) {
      const t = i.t.trim();
      if (RE_PROF.test(t)) { if (matieres.length) matieres.at(-1).prof = true; continue; }
      if (lettres(t) < 2 || RE_GROUPE.test(t) || /^coef/i.test(t)) continue;
      const prec = matieres.at(-1);
      if (prec && !prec.prof && prec.y - i.y < i.taille * 1.5 && Math.abs(prec.x - i.x) < 4) { prec.brut += (prec.brut.endsWith('-') ? '' : ' ') + t; continue; }
      matieres.push({ brut: t, y: i.y, x: i.x, morceaux: [], chiffres: [] });
    }
    // Chaque morceau de droite va à la matière juste au-dessus (ou sur la même ligne).
    const matiereDe = y => matieres.filter(m => m.y >= y - 4).reduce((a, m) => (!a || m.y < a.y ? m : a), null);
    for (const i of droite) {
      const m = matiereDe(i.y);
      if (!m) continue;
      if (i.x >= xAppr - 3) { m.morceaux.push(i); continue; }
      const { nombres, reste } = decouper(i);
      if (nombres.length) m.chiffres.push({ y: i.y, nombres });
      if (lettres(reste) >= 3) m.morceaux.push({ ...i, t: reste });
    }
    return {
      cfg,
      matieres: matieres.map(m => {
        // Moyennes : la première ligne de chiffres de la matière ; colonne « élève » (sinon le 1er nombre), « classe » (sinon le 2e).
        const ligne = m.chiffres.sort((a, b) => b.y - a.y)[0]?.nombres || [];
        const proche = x => (x === null ? null : ligne.reduce((a, n) => (Math.abs(n.x - x) < 14 && (!a || Math.abs(n.x - x) < Math.abs(a.x - x)) ? n : a), null));
        const moy = (proche(cfg.xEleve) || ligne[0])?.n ?? null;
        const moyClasse = (cfg.xClasse !== null ? proche(cfg.xClasse) : ligne[1])?.n ?? null;
        const appr = m.morceaux.sort((a, b) => b.y - a.y || a.x - b.x).map(x => x.t.trim())
          .reduce((t, x) => (t.endsWith('-') && /^\p{Ll}/u.test(x) ? t.slice(0, -1) + x : t ? t + ' ' + x : x), '').replace(/\s+/g, ' ').trim();
        return { brut: m.brut.replace(/\s+/g, ' ').trim(), moy, moyClasse, appr };
      }).filter(m => m.moy !== null || m.appr),
    };
  }

  // Moyenne générale, absences, retards, période : dans le texte des pages.
  function bas(pages) {
    const res = { moyGen: null, moyGenClasse: null, absences: null, nonJustifiees: null, retards: null };
    for (const p of pages) {
      const items = p.items.filter(i => !i.vertical);
      const mg = items.find(i => /moyennes?\s+g[ée]n[ée]rales?/i.test(i.t));
      if (mg && res.moyGen === null) {
        const meme = items.filter(i => Math.abs(i.y - mg.y) < 3 && i.x >= mg.x).sort((a, b) => a.x - b.x);
        const nombres = meme.flatMap(i => (i === mg ? i.t.replace(/^.*?g[ée]n[ée]rales?/i, '') : i.t).trim().split(/\s+/)).map(decimal).filter(n => n !== null);
        [res.moyGen = null, res.moyGenClasse = null] = nombres;
      }
      const texte = items.map(i => i.t).join(' ').replace(/\s+/g, ' ');
      const abs = /absences?\s*:?\s*(\d+)\s*demi/i.exec(texte) || /(\d+)\s*demi-?\s*journ[ée]es?\s*d['’]\s*absences?/i.exec(texte);
      if (abs && res.absences === null) res.absences = +abs[1];
      const nj = /dont\s*(\d+)\s*(?:sont\s*)?non[\s-]*justifi/i.exec(texte) || /(\d+)\s*(?:demi-?\s*journ[ée]es?\s*)?non[\s-]*justifi/i.exec(texte);
      if (nj && res.nonJustifiees === null) res.nonJustifiees = +nj[1];
      const ret = /(\d+)\s*retards?/i.exec(texte) || /retards?\s*:?\s*(\d+)/i.exec(texte);
      if (ret && res.retards === null) res.retards = +ret[1];
      if (abs && !nj && /aucune?\s+(absence\s+)?non[\s-]*justifi|toutes?\s+justifi/i.test(texte) && res.nonJustifiees === null) res.nonJustifiees = 0;
    }
    return res;
  }

  function periodeLue(texte) {
    const m = /(1er|1re|premier|1|2e|2[èe]me|2nd|second|deuxi[èe]me|2|3e|3[èe]me|troisi[èe]me|3)\s*(trimestre|semestre)/i.exec(texte);
    if (!m) return null;
    const n = /^(1|premier)/i.test(m[1]) ? 1 : /^(2|second|deux)/i.test(m[1]) ? 2 : 3;
    return { n, type: /sem/i.test(m[2]) ? 'S' : 'T' };
  }

  // Un PDF → un bulletin par élève (une page qui porte « Bulletin » en haut commence un nouvel élève).
  async function lire(fichier) {
    const pages = await PdfTexte.lire(await fichier.arrayBuffer(), { pages: 400 });
    const groupes = [];
    for (const p of pages) {
      const haut = p.items.filter(i => i.y > p.hauteur * 0.7 && !i.vertical).map(i => i.t).join(' ');
      if (!groupes.length || /bulletin|relev[ée] de notes/i.test(haut)) groupes.push([]);
      groupes.at(-1).push(p);
    }
    return groupes.map(pp => {
      let cfg = null;
      const matieres = [];
      for (const p of pp) { const r = lignesPage(p, cfg); cfg = r.cfg; matieres.push(...r.matieres); }
      const p0 = pp[0], items0 = p0.items.filter(i => !i.vertical);
      const c0 = colonnes(items0.slice().sort((a, b) => b.y - a.y), null);
      const entete = items0.filter(i => !c0 || i.y > c0.yTete + 1).sort((a, b) => b.y - a.y || a.x - b.x);
      const titre = entete.find(i => /bulletin/i.test(i.t));
      const nomLu = titre ? entete.filter(i => i.y < titre.y - 2 && Math.abs(i.x - titre.x) < 6)[0]?.t.trim() || '' : '';
      return {
        entete: entete.map(i => i.t).join(' | '), nomLu, periode: periodeLue(items0.map(i => i.t).join(' ')),
        matieres, ...bas(pp), lisible: matieres.length > 0,
      };
    });
  }

  // L'élève de la classe dont le nom ET le prénom figurent dans l'en-tête du bulletin (le plus long gagne : homonymes).
  function trouverEleve(entete, eleves) {
    const t = ' ' + sansAccent(entete).replace(/[^a-z0-9]+/g, ' ') + ' ';
    const mots = s => sansAccent(s).replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
    let meilleur = null, score = 0;
    for (const el of eleves) {
      const m = [...mots(el.nom), ...mots(el.prenom)];
      if (m.length < 2 && !mots(el.prenom).length) continue;
      if (m.every(x => t.includes(' ' + x + ' ')) && m.join('').length > score) { score = m.join('').length; meilleur = el; }
    }
    return meilleur;
  }

  return { lire, trouverEleve };
})();

// Nom de matière lisible dans une phrase (« en histoire-géographie », « en SVT ») ; sinon le nom lu, en minuscules.
const MATIERES_PP = [
  [/^(histoire[- ]?g[ée]o|hist\.?[- ]?g[ée]o|h\.?[- ]?g\.?$)/, 'histoire-géographie'], [/^(emc|enseignement moral|ens\.? moral)/, 'EMC'],
  [/^hggsp|^hist.*g[ée]opolitique/, 'HGGSP'], [/^hlp|^humanit/, 'HLP'], [/^(ses|s\.e\.s\.?)$|sciences [ée]conomiques/, 'SES'],
  [/^(svt|s\.v\.t\.?)$|sciences de la vie/, 'SVT'], [/^(eps|e\.p\.s\.?)$|[ée]ducation physique/, 'EPS'], [/^math/, 'mathématiques'],
  [/^physique[- ]?chimie|^phys(ique)?[- ]?chim|^(p\.?c\.?|spc)$|sciences physiques/, 'physique-chimie'], [/^fran[cç]ais/, 'français'],
  [/^philo/, 'philosophie'], [/^anglais/, 'anglais'], [/^espagnol/, 'espagnol'], [/^allemand/, 'allemand'], [/^italien/, 'italien'],
  [/^portugais/, 'portugais'], [/^chinois/, 'chinois'], [/^arabe/, 'arabe'], [/^russe/, 'russe'], [/^latin/, 'latin'], [/^grec/, 'grec ancien'],
  [/^(snt|s\.n\.t\.?)$|sciences num[ée]riques/, 'SNT'], [/^(nsi|n\.s\.i\.?)$|num[ée]rique et sciences/, 'NSI'],
  [/^ens(eignement|\.)?\s*scient/, 'enseignement scientifique'], [/^techno/, 'technologie'], [/^arts? plastiques/, 'arts plastiques'],
  [/^[ée]ducation musicale|^musique/, 'éducation musicale'], [/^sciences de l.ing[ée]nieur|^si$/, 'sciences de l’ingénieur'],
  [/^llcer/, 'LLCER'], [/^accompagnement perso|^a\.?p\.?$/, 'accompagnement personnalisé'], [/^vie de classe|^hvc$/, 'vie de classe'],
];
function nomMatierePP(brut) {
  const t = String(brut || '').replace(/\b(tronc commun|lv ?[abc12]|lv[abc]|langue vivante [abc12]|sp[ée]cialit[ée]|option(nel(le)?)?|ens\.? de sp[ée]\.?)\b/gi, '')
    .replace(/\s+/g, ' ').trim();
  const n = sansAccent(t).replace(/[’]/g, '\'');
  for (const [re, nom] of MATIERES_PP) if (re.test(n)) return nom;
  return t.toLocaleLowerCase('fr');
}
const enMatieres = noms => {
  const l = [...new Set(noms)].map(n => 'en ' + n);
  return l.length > 1 ? l.slice(0, -1).join(', ') + ' et ' + l.at(-1) : l[0] || '';
};

/* ---------- Analyse : ce que disent les collègues ---------- */

// Mots-clés (sans accents) : les tournures négatives de toutes les rubriques sont lues d'abord (les plus longues
// d'abord) et effacées du texte ; puis les positives, qui deviennent négatives si une négation les précède
// (« pas assez sérieux », « doit participer ») ou si une réserve les suit (« travail insuffisant », « participer davantage »).
const MOTS_PP = {
  travail: {
    moins: ['travail insuffisant', 'travail personnel insuffisant', 'manque de travail regulier', 'pas apprises', 'pas apprise', 'non fait', 'pas ete rendu', 'manque de travail', 'manque de serieux', 'pas assez de travail', 'travail irregulier',
      'travail superficiel', 'ne travaille pas', 'ne fournit pas', 'travail non fait', 'devoirs non faits', 'lecons non apprises', 'travail non rendu',
      'non rendu', 'pas rendu', 'doit travailler', 'accentuer son travail', 'accentuer ses efforts', 'se mettre au travail', 'travailler davantage',
      'travailler plus', 'davantage de travail', 'plus de travail', 'apprendre rigoureusement', 'apprendre regulierement', 'apprendre ses lecons',
      'apprendre son cours', 'faire le travail demande', 'manque de rigueur', 'negligen', 'peu de travail', 'trop peu de travail', 'manque d\'effort',
      'manque d\'efforts', 'efforts insuffisants', 'etre derriere', 'travail a fournir', 'irregulier', 'irreguliere', 'superficiel', 'bacl', 'leger'],
    plus: ['serieu', 'travail regulier', 'travail serieux', 'regulier ', 'reguliere ', 'travailleu', 'appliqu', 'rigoureu', 'rigueur', 'consciencieu',
      'efforts', 'effort ', 'bon travail', 'beau travail', 'excellent travail', 'travail de qualite', 'travail soigne', 'soigne', 'autonom', 'perseverant'],
  },
  participation: {
    moins: ['passif', 'passive', 'passivite', 'ne participe pas', 'ne participe que', 'participe peu', 'participe trop peu', 'baisse de participation',
      'baisse de la participation', 'manque de participation', 'manque d\'implication', 'manque d\'investissement', 'peu investi', 'peu impliqu',
      'investissement insuffisant', 'implication insuffisante', 'participation insuffisante', 'trop discret', 'trop discrete', 'trop effac',
      'trop reserve', 'prendre la parole', 'prendre davantage la parole', 'oser', 'en retrait', 'impliquant davantage', 'manque d\'engagement',
      'peu d\'engagement', 'desinteret', 'desinteresse', 'demotiv', 'manque de motivation', 'manque d\'interet', 'apathique', 'endormi'],
    plus: ['particip', 'dynamique', 'implique', 'impliquee', 'implication', 'investi', 'investie', 'investissement', 'motive', 'motivee', 'motivation',
      'interesse', 'curieu', 'volontaire', 'enthousias', 'engage', 'engagee', 'engagement', 'actif ', 'active ', 'pertinen', 'moteur dans la classe'],
  },
  comportement: {
    moins: ['bavard', 'dissip', 'agite', 'agitation', 'se disperse', 'dispers', 'inattenti', 'manque d\'attention', 'manque de concentration',
      'concentration insuffisante', 'distrait', 'insolen', 'irrespect', 'impoli', 'perturb', 'comportement inadapte', 'comportement inacceptable',
      'comportement a revoir', 'comportement a ameliorer', 'attitude a revoir', 'attitude inadaptee', 'attitude negative', 'desinvolt', 'nonchalan',
      'avertissement', 'exclu', 'retenue', 'sanction', 'provoc', 'violen', 'insulte', 'moqu', 'bruyant', 'triche', 'manque de maturite',
      'immatur', 'pueril', 'familiarite', 'telephone', 'portable', 'dissipation', 'turbulent'],
    plus: ['comportement exemplaire', 'agreable', 'respectueu', 'poli ', 'polie ', 'calme', 'attentif', 'attentive', 'concentre ', 'concentree',
      'attitude positive', 'bonne attitude', 'attitude exemplaire', 'bon comportement', 'comportement adapte', 'mature', 'maturite', 'a l\'ecoute', 'bonne ecoute'],
  },
  resultats: {
    moins: ['ensemble trop juste', 'trop juste', 'un peu juste', 'resultats insuffisants', 'resultats fragiles', 'resultats faibles', 'resultats decevants',
      'difficulte', 'lacune', 'fragile', 'insuffisant', 'faible', 'echec', 'decevant', 'moyenne insuffisante', 'niveau insuffisant', 'non acquis',
      'pas acquis', 'en grande difficulte'],
    plus: ['tres bons resultats', 'bons resultats', 'excellents resultats', 'resultats satisfaisants', 'tres bon', 'tres bonne', 'excellent', 'excellente',
      'tres bien', 'satisfaisant', 'bon ensemble', 'bon trimestre', 'bon semestre', 'solide', 'reussite', 'assez bon', 'assez bien', 'bonne maitrise',
      'acquis', 'brillant', 'remarquable', 'felicitations', 'bravo', 'bon niveau'],
  },
  progression: {
    moins: ['en baisse', 'baisse', 'en recul', 'recul', 'degrad', 'chute', 'regresse', 'relache', 'moins bon', 'moins bons'],
    plus: ['progres ', 'progresse ', 'en progres', 'en hausse', 'amelioration', 's\'ameliore', 'ameliore', 'redresse', 'remonte'],
  },
};
const NEGATIFS_PP = Object.entries(MOTS_PP).flatMap(([k, l]) => l.moins.map(m => ({ k, m }))).sort((a, b) => b.m.length - a.m.length);
const POSITIFS_PP = Object.entries(MOTS_PP).flatMap(([k, l]) => l.plus.map(m => ({ k, m }))).sort((a, b) => b.m.length - a.m.length);
const RE_NIE_AVANT_PP = /(?:\b(?:pas|plus|jamais|peu|moins|sans|non|aucune?)|manque d['e]|manque de)\s*(?:(?:tres|assez|toujours|suffisamment|vraiment|du tout|encore|bien)\s+)?(?:de\s+|d'|d\s)?$|\b(?:doit|doivent|devra|devrait|faut|faudra|faudrait|devez|devriez|devrez|essayer de|tacher de|chercher a)\s+(?:etre\s+|se\s+|s'|vous\s+)?(?:plus\s+)?$/;
// (Une ponctuation ou un « mais » arrête la recherche : « travail sérieux, mais trop peu d'implication ».)
const RE_NIE_APRES_PP = /^[a-z']*\s+(?:(?!mais\s)[a-z']+\s+){0,2}?(?:(?:que\s+)?trop peu|pas assez|insuffisa|trop faible|faible|en baisse|irreguli|a revoir|a ameliorer|a developper|a renforcer|a fournir|a accentuer|a retrouver|perfectible|decevant|en recul|limite|trop juste|fragile|inexistant|fait defaut|davantage|en dents de scie)/;

function signauxPP(texte) {
  let t = ' ' + sansAccent(texte).replace(/[.!?]+/g, ' . ').replace(/[,;:()]+/g, ' , ').replace(/[^a-z0-9'., ]+/g, ' ').replace(/\s+/g, ' ') + ' ';
  const res = [];
  // Phrase de conseil (« Un travail régulier est indispensable », « Il faut maintenir… ») : ses mots positifs ne sont pas
  // des éloges (ils ne comptent pas), sauf s'ils sont niés (« il doit participer » reste négatif).
  const phrases = t.split(' . '), RE_CONSEIL = /\b(il faut|il faudra|il faudrait|faut|doit|doivent|devra|devrait|indispensable|necessaire|permettrait|pour progresser|possibles?|a fournir|il s'agit)\b/;
  const debuts = phrases.reduce((l, p) => [...l, l.at(-1) + p.length + 3], [0]);
  const conseil = i => { const k = debuts.findIndex((d, j) => i >= d && i < (debuts[j + 1] ?? Infinity)); return RE_CONSEIL.test(phrases[k] || ''); };
  const chercher = (m, depuis) => {
    for (let i = t.indexOf(m, depuis); i >= 0; i = t.indexOf(m, i + 1)) if (t[i - 1] === ' ' || t[i - 1] === '\'') return i;
    return -1;
  };
  const effacer = (i, n) => { t = t.slice(0, i) + ' '.repeat(n) + t.slice(i + n); };
  for (const { k, m } of NEGATIFS_PP) for (let i = chercher(m, 0); i >= 0; i = chercher(m, i + 1)) { res.push({ k, s: -1, mot: m.trim() }); effacer(i, m.trimEnd().length); }
  for (const { k, m } of POSITIFS_PP) {
    for (let i = chercher(m, 0); i >= 0; i = chercher(m, i + 1)) {
      const avant = t.slice(Math.max(0, i - 26), i).replace(/\s+/g, ' '), apres = t.slice(i + m.trimEnd().length, i + m.length + 45).replace(/\s+/g, ' ');
      const neg = RE_NIE_AVANT_PP.test(avant) || RE_NIE_APRES_PP.test(apres);
      if (neg || !conseil(i)) res.push({ k, s: neg ? -1 : 1, mot: m.trim() });
      effacer(i, m.trimEnd().length);
    }
  }
  return res;
}

const RUBRIQUES_PP = {
  resultats: { nom: 'Résultats', aide: 'moyenne générale, appréciations' },
  travail: { nom: 'Travail', aide: 'sérieux, travail personnel' },
  participation: { nom: 'Participation', aide: 'implication en classe, à l’oral' },
  comportement: { nom: 'Comportement', aide: 'attitude, bavardages, concentration' },
  progression: { nom: 'Progression', aide: 'par rapport à la période précédente' },
  matieres: { nom: 'Matières', aide: 'réussites et difficultés nommées' },
  assiduite: { nom: 'Assiduité', aide: 'absences, retards' },
  objectif: { nom: 'Objectif', aide: 'piste pour la suite' },
};
const MENTIONS_PP = { felicitations: 'Félicitations', compliments: 'Compliments', encouragements: 'Encouragements',
  avTravail: 'Avertissement travail', avComportement: 'Avertissement comportement', aucune: 'Aucune' };
const ADRESSES_PP = { il: '3e personne (« Léa travaille… Elle… »)', vous: 'Vouvoiement (« Vous travaillez… »)' };

// Période précédente (pour la progression) : P2 → P1.
const periodePrecPP = periode => { const l = periodesAnnee(), i = l.findIndex(p => p.id === periode); return i > 0 ? l[i - 1].id : null; };

// → { niveaux, sources, details: { forts, faibles, neg: {rubrique: [matières]}, abs, signaux: [[{k,s,mot}]] } }
function analyserPP(el, periode, r = reglagePP()) {
  const b = bulletinPP(el.id, periode);
  const niveaux = {}, sources = {}, details = { forts: [], faibles: [], neg: {}, pos: {}, signaux: [] };
  if (!b) return { niveaux, sources, details, vide: true };
  const mats = b.matieres || [];
  details.signaux = mats.map(m => signauxPP(m.appr || ''));
  const avecAppr = mats.filter(m => m.appr).length;
  // Une rubrique : combien de matières en disent du bien (P), du mal (M).
  for (const k of ['travail', 'participation', 'comportement', 'resultats', 'progression']) {
    const pos = [], neg = [], mots = { pos: [], neg: [] };
    mats.forEach((m, i) => {
      const s = details.signaux[i].filter(x => x.k === k), net = s.reduce((a, x) => a + x.s, 0);
      const nom = nomMatierePP(m.brut);
      if (net > 0) { pos.push(nom); mots.pos.push(`${nom} (${s.filter(x => x.s > 0).map(x => '« ' + x.mot + ' »').join(', ')})`); }
      if (net < 0) { neg.push(nom); mots.neg.push(`${nom} (${s.filter(x => x.s < 0).map(x => '« ' + x.mot + ' »').join(', ')})`); }
    });
    details.neg[k] = neg; details.pos[k] = pos;
    // (Proportions : sur 11 matières, 3 remarques ne font pas un travail « insuffisant » ; sur 4, si.)
    const P = pos.length, M = neg.length, part = M / Math.max(1, avecAppr);
    let n = null;
    if (P + M) n = M >= 2 && part >= 0.45 && M > P ? 1 : M && (M >= P || part >= 0.25) ? 2 : P >= 3 && !M && P / Math.max(1, avecAppr) >= 0.4 ? 4 : 3;
    niveaux[k] = n;
    sources[k] = P + M ? [mots.pos.length ? '👍 ' + mots.pos.join(' ; ') : '', mots.neg.length ? '👎 ' + mots.neg.join(' ; ') : ''].filter(Boolean).join('\n')
      : `Aucune appréciation n’en parle (${avecAppr} appréciation${avecAppr > 1 ? 's' : ''} lue${avecAppr > 1 ? 's' : ''})`;
  }
  // Résultats : la moyenne générale d'abord (sinon la moyenne des matières), les mots-clés sinon.
  const moys = mats.map(m => m.moy).filter(x => x !== null);
  const moy = b.moyGen ?? (moys.length ? moys.reduce((a, x) => a + x, 0) / moys.length : null);
  details.moy = moy;
  if (moy !== null) {
    const [s2, s3, s4] = r.seuils;
    niveaux.resultats = moy >= s4 ? 4 : moy >= s3 ? 3 : moy >= s2 ? 2 : 1;
    sources.resultats = `Moyenne ${b.moyGen !== null && b.moyGen !== undefined ? 'générale' : 'des matières'} : ${fmtD(moy)}${b.moyGenClasse ? ` (classe : ${fmtD(b.moyGenClasse)})` : ''}`
      + `\nSeuils : 2 dès ${fmt(s2)}, 3 dès ${fmt(s3)}, 4 dès ${fmt(s4)}`;
  }
  // Progression : la moyenne de la période précédente si son bulletin a été lu, sinon les mots des collègues.
  const prec = periodePrecPP(periode), bp = prec && bulletinPP(el.id, prec);
  const moyPrec = bp ? bp.moyGen ?? null : null;
  if (moy !== null && moyPrec !== null) {
    const d = moy - moyPrec;
    details.ecart = d;
    niveaux.progression = d >= 1.5 ? 4 : d >= 0.5 ? 3 : d > -0.5 ? 2 : 1;
    sources.progression = `Moyenne générale : ${fmtD(moyPrec)} → ${fmtD(moy)} (${d >= 0 ? '+' : ''}${fmtD(d)})`;
  }
  // Matières fortes et fragiles : moyenne nettement au-dessus / en dessous, ou appréciation très positive / négative.
  const net = i => details.signaux[i].reduce((a, x) => a + x.s, 0);
  mats.forEach((m, i) => {
    const nom = nomMatierePP(m.brut);
    if (/vie de classe|accompagnement/.test(nom)) return;
    if ((m.moy !== null && moy !== null && m.moy >= Math.max(14, moy + 1.5)) || (m.moy === null && net(i) >= 2)) details.forts.push({ nom, moy: m.moy, net: net(i) });
    else if ((m.moy !== null && (m.moy < 10 || (moy !== null && m.moy <= moy - 2.5))) || net(i) <= -2) details.faibles.push({ nom, moy: m.moy, net: net(i) });
  });
  details.forts.sort((a, b) => (b.moy ?? 0) - (a.moy ?? 0) || b.net - a.net);
  details.faibles.sort((a, b) => (a.moy ?? 20) - (b.moy ?? 20) || a.net - b.net);
  details.forts = details.forts.slice(0, 2); details.faibles = details.faibles.slice(0, 2);
  niveaux.matieres = details.forts.length || details.faibles.length ? 1 : null;
  sources.matieres = details.forts.length || details.faibles.length
    ? [details.forts.length ? 'Réussites : ' + details.forts.map(x => x.nom + (x.moy !== null ? ` (${fmtD(x.moy)})` : '')).join(', ') : '',
      details.faibles.length ? 'Difficultés : ' + details.faibles.map(x => x.nom + (x.moy !== null ? ` (${fmtD(x.moy)})` : '')).join(', ') : ''].filter(Boolean).join('\n')
    : 'Aucune matière nettement au-dessus ou en dessous';
  // Assiduité : demi-journées d'absence (dont non justifiées), retards.
  const abs = b.absences, nj = b.nonJustifiees || 0, ret = b.retards || 0;
  details.abs = { abs, nj, ret };
  if (abs !== null && abs !== undefined) {
    niveaux.assiduite = abs > 7 || nj > 3 || ret >= 6 ? 1 : abs > 3 || nj >= 1 || ret >= 3 ? 2 : abs ? 3 : 4;
    sources.assiduite = `${abs} demi-journée${abs > 1 ? 's' : ''} d’absence${nj ? `, dont ${nj} non justifiée${nj > 1 ? 's' : ''}` : ''}${ret ? `, ${ret} retard${ret > 1 ? 's' : ''}` : ''}`
      + '\n(2 dès 4 demi-journées, 1 non justifiée ou 3 retards ; 1 au-delà de 7, 3 non justifiées ou 6 retards)';
  }
  sources.objectif = 'Choisi d’après la rubrique la plus faible';
  return { niveaux, sources, details };
}

// Difficulté signalée (niveau 1 ou 2 ; progression : en baisse) : la rubrique est abordée même décochée.
// (Résultats et progression : seulement au niveau 1 — des résultats justes ne sont pas un signal d'alerte.)
const vigilancePP = (a, k) => k !== 'objectif' && k !== 'matieres' && !!a.niveaux[k] && a.niveaux[k] <= (k === 'progression' || k === 'resultats' ? 1 : 2);
function rubriquesPP(r, a, perso = {}) {
  return r.ordre.filter(k => (r.actives.includes(k) || vigilancePP(a, k)) && (k === 'objectif' || !(k in perso) || !!perso[k]));
}

// Mention proposée (désactivable dans les réglages) d'après la moyenne et les niveaux de l'appréciation.
function mentionProposeePP(niv, a, r) {
  if (!r.mentions) return 'aucune';
  const m = a.details.moy;
  if (niv.comportement === 1) return 'avComportement';
  if (niv.travail === 1) return 'avTravail';
  const ok = k => !niv[k] || niv[k] >= 3;
  if (m !== null && m !== undefined && m >= r.felicitations && ok('travail') && ok('comportement') && ok('participation')) return 'felicitations';
  if (m !== null && m !== undefined && m >= r.compliments && ok('travail') && ok('comportement')) return 'compliments';
  // Encouragements : un travail sérieux qui mérite d'être salué — résultats encore modestes, travail très bien, ou
  // moyenne générale en hausse (d'après les bulletins, pas d'après les mots des collègues).
  if (niv.travail >= 3 && ok('participation') && ok('comportement')
    && (niv.resultats <= 2 || niv.travail === 4 || a.details.ecart >= 0.5)) return 'encouragements';
  return 'aucune';
}

/* ---------- Rédaction ---------- */

// Phrases : {S} sujet (prénom la 1re fois, puis il / elle ; « Vous » au vouvoiement), {s} en minuscule,
// {a|b} : a à la 3e personne, b au vouvoiement ; {per} « trimestre », {Per} « Trimestre », {ce} « ce trimestre » ;
// {mat} « , notamment en anglais » ; {abs} « (9 demi-journées, dont 5 non justifiées) ».
// Niveaux 1 et 2 : une liste par ton (b bienveillant, n neutre, x exigeant). Style télégraphique : listes `t`.
const PHRASES_PP = {
  resultats: {
    4: { p: ['{S} {obtient|obtenez} d’excellents résultats.', 'Les résultats sont excellents.', '{S} {obtient|obtenez} de très bons résultats dans l’ensemble des matières.', 'Les résultats sont remarquables.'],
      t: ['Excellents résultats.', 'Très bons résultats.', 'Résultats remarquables.'] },
    3: { p: ['{S} {obtient|obtenez} de bons résultats.', 'Les résultats sont satisfaisants.', 'Les résultats sont solides dans l’ensemble.', 'Les résultats sont bons.'],
      t: ['Bons résultats.', 'Résultats satisfaisants.', 'Résultats solides.'] },
    2: { p: { b: ['Les résultats sont encourageants mais encore fragiles.', 'Les résultats restent justes : {s} {peut|pouvez} faire mieux.'], n: ['Les résultats sont moyens.', 'Les résultats restent justes.', 'Les résultats sont fragiles.'], x: ['Les résultats sont trop justes.', 'Les résultats sont en deçà des attentes.'] },
      t: { b: ['Résultats encore fragiles.', 'Résultats à consolider.'], n: ['Résultats moyens.', 'Résultats justes.'], x: ['Résultats trop justes.', 'Résultats en deçà des attentes.'] } },
    1: { p: { b: ['Les résultats sont difficiles, mais {il ne faut pas se décourager|ne vous découragez pas}.', 'Les résultats restent faibles : il faut s’accrocher.'], n: ['Les résultats sont insuffisants.', 'Les résultats sont en dessous des attentes.', 'Les résultats sont faibles.'], x: ['Les résultats sont très insuffisants.', 'Les résultats sont très faibles.', 'Les résultats sont nettement en dessous des attentes.'] },
      t: { b: ['Résultats à redresser.', 'Résultats difficiles.'], n: ['Résultats insuffisants.', 'Résultats faibles.'], x: ['Résultats très insuffisants.', 'Résultats très faibles.', 'Résultats alarmants.', 'Résultats nettement insuffisants.'] } },
  },
  travail: {
    4: { p: ['{S} {fait|faites} preuve d’un travail sérieux et régulier.', 'Le travail est sérieux et régulier.', '{S} {fournit|fournissez} un travail de grande qualité.', 'Le travail est exemplaire.'], t: ['Travail sérieux et régulier.', 'Excellent travail.', 'Travail exemplaire.'] },
    3: { p: ['Le travail est sérieux.', '{S} {travaille|travaillez} avec sérieux.', 'Le travail fourni est sérieux dans l’ensemble.', 'Le travail est régulier.'], t: ['Travail sérieux.', 'Bon travail.', 'Travail régulier.'] },
    2: { p: { b: ['Le travail doit gagner en régularité{mat}.', 'Le travail personnel mérite d’être approfondi{mat}.'], n: ['Le travail est irrégulier{mat}.', 'Le travail personnel reste irrégulier{mat}.', 'Le travail manque de régularité{mat}.'], x: ['Le travail personnel ne suffit pas{mat}.', '{S} {doit|devez} fournir un travail plus conséquent{mat}.', 'Le travail personnel est superficiel{mat}.'] },
      t: { b: ['Travail à approfondir{mat}.', 'Régularité à trouver dans le travail{mat}.'], n: ['Travail irrégulier{mat}.', 'Travail inégal{mat}.'], x: ['Travail superficiel{mat}.', 'Travail personnel trop léger{mat}.'] } },
    1: { p: { b: ['Le travail personnel doit absolument devenir régulier{mat}.', '{S} {doit se|devez vous} mettre au travail sans attendre{mat}.'], n: ['Le travail fourni ne suffit pas{mat}.', 'Le travail personnel fait défaut{mat}.', 'Le travail est insuffisant{mat}.'], x: ['Le manque de travail est préoccupant{mat}.', 'Le travail personnel est quasi inexistant{mat}.', 'Le travail est très insuffisant{mat}.'] },
      t: { b: ['Travail à reprendre en main{mat}.', 'Mise au travail indispensable{mat}.'], n: ['Travail personnel absent{mat}.', 'Travail insuffisant{mat}.'], x: ['Manque de travail préoccupant{mat}.', 'Travail quasi inexistant{mat}.'] } },
  },
  participation: {
    4: { p: ['{S} {participe|participez} activement et avec pertinence.', 'La participation en classe est remarquable.', '{S} {s’implique|vous impliquez} pleinement en classe.'], t: ['Participation remarquable.', 'Participation active et pertinente.'] },
    3: { p: ['{S} {participe|participez} volontiers en classe.', 'La participation est bonne.', '{S} {s’implique|vous impliquez} en classe.'], t: ['Bonne participation.', 'Bonne implication en classe.'] },
    2: { p: { b: ['La participation orale est à développer{mat}.', '{S} {doit|devez} oser prendre la parole{mat}.'], n: ['La participation reste discrète{mat}.', 'La participation est irrégulière{mat}.'], x: ['{S} {doit|devez} participer bien plus{mat}.', 'L’implication en classe ne suffit pas{mat}.'] },
      t: { b: ['Participation à développer{mat}.', 'Oral à développer{mat}.'], n: ['Participation discrète{mat}.', 'Participation irrégulière{mat}.'], x: ['Participation insuffisante{mat}.', 'Implication trop faible{mat}.'] } },
    1: { p: { b: ['{S} {doit s’impliquer|devez vous impliquer} bien davantage en classe{mat}.', 'L’implication en classe reste à trouver{mat}.'], n: ['L’attitude en classe est passive{mat}.', 'L’implication en classe est très faible{mat}.'], x: ['L’attitude passive en classe est préjudiciable{mat}.', 'Le manque d’implication en classe est préoccupant{mat}.'] },
      t: { b: ['Implication à trouver{mat}.'], n: ['Attitude passive{mat}.', 'Implication très faible{mat}.'], x: ['Passivité préoccupante{mat}.'] } },
  },
  comportement: {
    4: { p: ['Le comportement est exemplaire.', '{S} {a|avez} une attitude exemplaire en classe.'], t: ['Comportement exemplaire.', 'Attitude exemplaire.'] },
    3: { p: ['Le comportement est correct.', 'L’attitude en classe est positive.', '{S} {a|avez} un comportement adapté.'], t: ['Comportement correct.', 'Attitude positive.'] },
    2: { p: { b: ['La concentration en classe doit progresser{mat}.', 'Attention aux bavardages et à la dispersion{mat}.'], n: ['Le comportement est parfois à reprendre{mat}.', 'L’attitude en classe manque de concentration{mat}.'], x: ['La dispersion en classe nuit au travail{mat}.', 'Le comportement doit changer{mat}.'] },
      t: { b: ['Concentration à améliorer{mat}.', 'Attention aux bavardages{mat}.'], n: ['Comportement parfois à reprendre{mat}.', 'Concentration fragile{mat}.'], x: ['Dispersion qui nuit au travail{mat}.', 'Comportement à corriger{mat}.'] } },
    1: { p: { b: ['Le comportement doit nettement s’améliorer{mat}.', 'L’attitude en classe doit changer{mat}.'], n: ['Le comportement pose problème{mat}.', 'Le comportement en classe n’est pas acceptable{mat}.'], x: ['Le comportement est inacceptable et nuit à la classe{mat}.', 'Le comportement en classe est inadmissible{mat}.'] },
      t: { b: ['Comportement à améliorer nettement{mat}.'], n: ['Comportement problématique{mat}.'], x: ['Comportement inacceptable{mat}.'] } },
  },
  progression: {
    4: { p: ['{S} {a|avez} fait de nets progrès {ce}.', 'Les progrès sont remarquables {ce}.'], t: ['Nets progrès.', 'Progrès remarquables.'] },
    3: { p: ['Les progrès sont encourageants.', '{S} {est|êtes} en progrès {ce}.'], t: ['En progrès.', 'Progrès encourageants.'] },
    2: { p: { b: ['Le niveau est stable.', 'Les résultats sont stables.'], n: ['Le niveau est stable.', 'Les résultats sont stables.'], x: ['Le niveau stagne.', 'Les résultats stagnent.'] }, t: { b: ['Niveau stable.'], n: ['Niveau stable.'], x: ['Niveau qui stagne.'] } },
    1: { p: { b: ['Le niveau baisse {ce} : {il faut se ressaisir|il faut vous ressaisir}.'], n: ['Le niveau est en baisse {ce}.', 'Les résultats sont en baisse {ce}.'], x: ['Le niveau est en net recul {ce}.'] },
      t: { b: ['Niveau en baisse : se ressaisir.'], n: ['Niveau en baisse.'], x: ['Net recul.'] } },
  },
  assiduite: {
    4: { p: ['L’assiduité est irréprochable.', 'La présence en cours est irréprochable.'], t: ['Assiduité irréprochable.'] },
    3: { p: ['L’assiduité est bonne.', 'La présence en cours est régulière.'], t: ['Bonne assiduité.', 'Présence régulière.'] },
    2: { p: { b: ['Attention aux absences{abs}.', 'Vigilance sur les absences{abs}.'], n: ['Les absences sont nombreuses{abs}.', 'Les absences sont à surveiller{abs}.'], x: ['Les absences{abs} pénalisent les apprentissages.', 'Les absences{abs} ne sont pas acceptables.'] },
      t: { b: ['Attention aux absences{abs}.'], n: ['Absences nombreuses{abs}.', 'Absences à surveiller{abs}.'], x: ['Absences pénalisantes{abs}.'] } },
    1: { p: { b: ['Les absences{abs} sont préoccupantes : la présence en cours est indispensable.'], n: ['Les absences{abs} sont nombreuses et pénalisent les apprentissages.', 'Les absences{abs} sont préoccupantes.'], x: ['Le nombre d’absences{abs} est inacceptable.'] },
      t: { b: ['Assiduité préoccupante{abs}.'], n: ['Absences préoccupantes{abs}.'], x: ['Absentéisme inacceptable{abs}.'] } },
  },
};
const STABLE_BON_PP = { p: ['Le bon niveau est maintenu.', '{S} {maintient|maintenez} un bon niveau.'], t: ['Bon niveau maintenu.'] };
const BILANS_PP = {
  4: ['Excellent {per}.', '{S} {réalise|réalisez} un excellent {per}.', 'Très bon {per}.', 'Remarquable {per}.'],
  3: ['Bon {per}.', '{S} {réalise|réalisez} un bon {per}.', '{Per} satisfaisant.', '{Per} réussi.'],
  2: { b: ['{Per} encourageant, mais encore inégal.', '{Per} en demi-teinte, avec des points encourageants.', '{Per} contrasté.'], n: ['{Per} inégal.', '{Per} moyen.', '{Per} mitigé.'], x: ['{Per} trop juste.', '{Per} en dessous de {ses|vos} possibilités.'] },
  1: { b: ['{Per} difficile.', '{Per} compliqué.'], n: ['{Per} difficile.', '{Per} décevant.'], x: ['{Per} très décevant.', '{Per} très insuffisant.', '{Per} nettement insuffisant.', '{Per} alarmant.'] },
};
const MATIERES_PHRASES_PP = {
  deux: { p: ['De belles réussites {f} ; des difficultés {d}.', 'Des points forts {f}, mais des difficultés {d}.'], t: ['Points forts : {F} ; à renforcer : {D}.', 'Réussites : {F} ; difficultés : {D}.'] },
  forts: { p: ['De belles réussites {f}.', 'Des réussites particulières {f}.'], t: ['Points forts : {F}.', 'Réussites : {F}.'] },
  faibles: { p: { b: ['Des difficultés {d}, qui demandent une attention particulière.', 'Des difficultés {d}, à surmonter.'], n: ['Des difficultés {d}.'], x: ['Des lacunes importantes {d}.'] }, t: { b: ['À renforcer : {D}.'], n: ['À renforcer : {D}.', 'Difficultés : {D}.'], x: ['Lacunes : {D}.'] } },
};
// Buts (verbe à l'infinitif) : selon la rubrique la plus faible.
const OBJECTIFS_PP = {
  travail: ['fournir un travail personnel régulier', '{se|vous} mettre au travail avec sérieux', 'apprendre {ses|vos} leçons chaque semaine', '{s’|vous }organiser pour travailler chaque jour'],
  participation: ['{s’|vous }impliquer à l’oral', 'participer activement en classe', 'oser prendre la parole', 'prendre part aux échanges en classe'],
  comportement: ['adopter une attitude sérieuse en classe', 'gagner en concentration', 'limiter les bavardages'],
  resultats: ['consolider {ses|vos} acquis', 'fournir les efforts nécessaires pour progresser', 'reprendre les bases avec méthode'],
  progression: ['{se|vous} remobiliser pour retrouver un meilleur niveau', 'retrouver de la régularité'],
  assiduite: ['gagner en assiduité', 'venir en cours régulièrement'],
  haut: ['poursuivre dans cette voie', 'conserver cette belle dynamique', 'maintenir ces efforts', 'continuer ainsi'],
};

function redigerPP(el, periode, a, perso, r, graine = 0) {
  perso = perso || {};
  const niv = { ...a.niveaux };
  for (const [k, v] of Object.entries(perso)) niv[k] = v || null; // 0 = ne pas en parler
  const vous = r.adresse === 'vous', tele = r.style === 'telegraphique', ton = r.ton;
  const sexe = ['F', 'G'].includes(el.sexe) ? el.sexe : '';
  const prenom = (el.prenom || '').trim() || el.nom;
  const p = periodesAnnee().find(x => x.id === periode);
  const per = p?.code?.startsWith('S') ? 'semestre' : 'trimestre', ce = 'ce ' + per;
  const d = a.details;
  let dejaNomme = false;
  const sujet = maj => {
    if (vous) return maj ? 'Vous' : 'vous';
    if (!dejaNomme || !sexe) { dejaNomme = true; return prenom; }
    return sexe === 'F' ? (maj ? 'Elle' : 'elle') : (maj ? 'Il' : 'il');
  };
  // « , notamment en anglais » : sauf les matières déjà nommées par la phrase des matières (pas de répétition).
  const citees = rubriquesPP(r, a, perso).includes('matieres') && niv.matieres ? [...d.forts, ...d.faibles].map(x => x.nom) : [];
  // (Une seule fois par appréciation : pas deux « notamment ».)
  let matDite = false;
  const listeMat = k => {
    const l = (d.neg[k] || []).filter(n => !citees.includes(n));
    if (matDite || !l.length || (d.neg[k] || []).length > 3) return '';
    matDite = true;
    return ', notamment ' + enMatieres(l.slice(0, 2));
  };
  const absTexte = () => (d.abs?.abs ? ` (${d.abs.abs} demi-journée${d.abs.abs > 1 ? 's' : ''}${d.abs.nj ? `, dont ${d.abs.nj} non justifiée${d.abs.nj > 1 ? 's' : ''}` : ''})` : '');
  const remplir = (modele, k) => modele
    .replace(/\{([^{}|]*)\|([^{}]*)\}/g, (x, il, vo) => (vous ? vo : il))
    .replace(/\{S\}/g, () => sujet(true)).replace(/\{s\}/g, () => sujet(false)).replace(/\{P\}/g, prenom)
    .replace(/\{mat\}/g, () => listeMat(k)).replace(/\{abs\}/g, absTexte)
    .replace(/\{ce\}/g, ce).replace(/\{Per\}/g, per[0].toUpperCase() + per.slice(1)).replace(/\{per\}/g, per)
    .replace(/\{f\}/g, enMatieres(d.forts.map(x => x.nom))).replace(/\{d\}/g, enMatieres(d.faibles.map(x => x.nom)))
    .replace(/\{F\}/g, d.forts.map(x => x.nom).join(', ')).replace(/\{D\}/g, d.faibles.map(x => x.nom).join(', '));
  const brut = x => x.replace(/\{([^{}|]*)\|([^{}]*)\}/g, (y, il, vo) => (vous ? vo : il)).replace(/\{[A-Za-z]+\}/g, ' ');
  let essai = 0;
  const g = cle => `pp|${el.id}|${periode}|${graine}|${essai ? essai + '|' : ''}${cle}`;
  const ignores = [prenom, ...prenom.split(/[\s-]+/)];
  const actives = rubriquesPP(r, a, perso);
  const vigil = new Set(actives.filter(k => vigilancePP({ niveaux: niv }, k)));

  const construire = (court, exclues = []) => {
    dejaNomme = false; matDite = false;
    let ecrit = '', dernierPronom = false;
    const moinsDeRepetitions = (tout, voir = brut) => {
      const n = tout.map(x => conflitsAppr(ecrit, voir(x), ignores)), min = Math.min(...n);
      return tout.filter((x, i) => n[i] === min);
    };
    const choisir = (tout, graine) => {
      let liste = moinsDeRepetitions(tout);
      // Pas deux phrases de suite en « Il / Elle… » (ou « Vous… ») quand une autre tournure existe.
      const varie = dernierPronom ? liste.filter(x => !x.startsWith('{S}')) : [];
      if (varie.length) liste = varie;
      const choix = court ? liste.reduce((x, y) => (brut(y).length < brut(x).length ? y : x)) : choisirAppr(liste, graine);
      dernierPronom = (vous || (dejaNomme && !!sexe)) && choix.startsWith('{S}');
      return choix;
    };
    const morceaux = [];
    const ajouter = m => { morceaux.push(m); ecrit += ' ' + m.texte; };
    if (r.bilan && !exclues.includes('bilan')) {
      // (Les résultats comptent double.)
      const base = ['resultats', 'resultats', 'travail', 'participation', 'comportement'].map(k => niv[k]).filter(Boolean);
      if (base.length) {
        // (Jamais plus haut que les résultats : pas d'« Excellent trimestre » avec des résultats seulement satisfaisants.)
        let k = Math.max(1, Math.min(4, Math.round(moyenneListe(base))));
        if (niv.resultats) k = Math.min(k, niv.resultats >= 3 ? niv.resultats : niv.resultats + 1);
        const t = remplir(choisir(selonTon(BILANS_PP[k], ton), g('bilan')), k);
        ajouter({ cle: 'bilan', pol: k >= 3 ? 1 : -1, texte: t[0].toUpperCase() + t.slice(1) });
      }
    }
    for (const k of actives) {
      if (k === 'objectif' || exclues.includes(k) || !niv[k]) continue;
      const n = niv[k];
      let banque, pol;
      if (k === 'matieres') {
        const cas = d.forts.length && d.faibles.length ? 'deux' : d.forts.length ? 'forts' : d.faibles.length ? 'faibles' : null;
        if (!cas) continue;
        banque = MATIERES_PHRASES_PP[cas]; pol = cas === 'deux' ? 0 : cas === 'forts' ? 1 : -1;
      } else {
        banque = PHRASES_PP[k][n];
        if (k === 'progression' && n === 2 && (niv.resultats || 0) >= 3) banque = STABLE_BON_PP;
        pol = k === 'progression' && n === 2 ? (banque === STABLE_BON_PP ? 1 : 0) : n >= 3 ? 1 : -1;
      }
      // Importance (pour le manque de place) : point de vigilance > extrêmes > fragile > satisfaisant > « stable ».
      const importance = vigil.has(k) ? 5 : k === 'matieres' ? 2.5 : k === 'progression' && n === 2 ? 1 : n === 3 ? 2 : n === 2 ? 3 : 4;
      const t = remplir(choisir(selonTon(tele ? banque.t : banque.p, ton), g(k)), k);
      ajouter({ cle: k, importance, pol, texte: t[0].toUpperCase() + t.slice(1) });
    }
    if (actives.includes('objectif') && niv.objectif !== null) {
      const notes = actives.filter(k => niv[k] && !['objectif', 'matieres'].includes(k));
      const poids = k => (k === 'progression' && niv[k] === 2 ? 3 : niv[k]);
      const pire = notes.length ? Math.min(...notes.map(poids)) : 3;
      // (À faiblesse égale : d'abord ce qui dépend de l'élève — travail, participation, comportement — puis les résultats.)
      const prio = ['travail', 'participation', 'comportement', 'assiduite', 'progression', 'resultats'];
      const cle = pire >= 3 ? 'haut' : prio.find(k => notes.includes(k) && poids(k) === pire) || 'resultats';
      // (Sans répéter ce qui est déjà écrit : « Il doit se mettre au travail… Il faut se mettre au travail ».)
      const buts = moinsDeRepetitions(OBJECTIFS_PP[cle]);
      const but = court ? buts.reduce((x, y) => (y.length < x.length ? y : x)) : choisirAppr(buts, g('but'));
      const modeles = tele ? ['Objectif : {but}.']
        : cle === 'haut' ? (ton === 'bienveillant' ? ['Bravo ! Il faut {but}.', 'Bravo, il faut {but} !'] : ['Il faut {but}.'])
          : ton === 'exigeant' ? ['{S} {doit|devez} impérativement {but}.', 'Il faut impérativement {but}.']
            : ton === 'bienveillant' ? ['Il faut maintenant {but}. Courage !', 'Pour progresser, il faudra {but}. Courage !'] : ['Il faut maintenant {but}.', 'Objectif : {but}.'];
      let t = remplir(choisir(modeles.map(m => m.replace('{but}', but)), g('objectif')), 'objectif');
      ajouter({ cle: 'objectif', texte: t[0].toUpperCase() + t.slice(1) });
    }
    return morceaux;
  };
  // Liaisons : « Néanmoins, » d'un point fort à une difficulté, « En revanche, » dans l'autre sens (une seule fois).
  const finir = liste => {
    if (tele) return corrigerAppr(liste.map(m => m.texte).join(' '), { retirerAdverbes: true });
    // (Une seule liaison d'opposition : pas de « Néanmoins » s'il y a déjà un « mais ».)
    let avant = null, opposition = inventaireAppr(liste.map(m => m.texte).join(' ')).liaisons.has('opposition');
    const sortie = liste.map(m => {
      let t = m.texte;
      if (avant && m.cle !== 'objectif' && m.pol && avant.pol && avant.pol * m.pol < 0 && !opposition) {
        t = (avant.pol > 0 ? 'Néanmoins, ' : 'En revanche, ') + (t.startsWith(prenom) ? t : t[0].toLocaleLowerCase('fr') + t.slice(1));
        opposition = true;
      }
      if (m.pol && m.cle !== 'bilan') avant = m;
      return t;
    });
    // (« Bon trimestre… en progrès ce trimestre » : la période déjà nommée n'est pas redite.)
    let t = sortie.join(' ');
    const i = t.toLocaleLowerCase('fr').indexOf(per);
    if (i >= 0) t = t.slice(0, i + per.length) + t.slice(i + per.length).split(' ' + ce).join('');
    return corrigerAppr(t, { retirerAdverbes: true });
  };
  const essayer = () => {
    let morceaux = construire(false);
    const retirees = [], longueur = () => finir(morceaux).length;
    if (longueur() > r.longueur) morceaux = construire(true);
    while (longueur() > r.longueur && morceaux.length > 1) {
      const rub = morceaux.filter(m => m.cle !== 'objectif' && m.cle !== 'bilan');
      const moindre = rub.length ? Math.min(...rub.map(m => m.importance)) : null;
      const cle = moindre !== null ? rub.filter(m => m.importance === moindre).at(-1).cle : morceaux.find(m => m.cle === 'bilan')?.cle;
      if (!cle) break;
      retirees.push(cle);
      morceaux = construire(true, retirees);
    }
    for (const cle of [...retirees].reverse()) {
      const avec = construire(true, retirees.filter(k => k !== cle));
      if (finir(avec).length <= r.longueur) { retirees.splice(retirees.indexOf(cle), 1); morceaux = avec; }
    }
    const texte = finir(morceaux);
    return { texte, retirees, remarques: relireAppr(texte, el).filter(x => x.grave && !/Il \/ Elle|Elle » pour|Il » pour/.test(x.texte)).length };
  };
  let meilleur = null;
  for (essai = 0; essai < 8; essai++) {
    const res = essayer();
    if (!meilleur || res.remarques * 10 + res.retirees.length < meilleur.remarques * 10 + meilleur.retirees.length) meilleur = res;
    if (!res.remarques) break;
  }
  return { texte: meilleur.texte, niveaux: niv, retirees: meilleur.retirees };
}

/* ---------- Réglages ---------- */

// Réglages de base d'avant la v0.117 (6 rubriques, 400 caractères) jamais personnalisés : passent aux nouveaux
// (résultats, travail, comportement, objectif ; 300 caractères). Appelé au démarrage (app.js › migrerTout).
function migrerReglagePP() {
  const e = Donnees.get('reglages', 'pp');
  if (!e || e.longueur !== 400 || JSON.stringify(e.actives) !== JSON.stringify(['resultats', 'travail', 'participation', 'comportement', 'matieres', 'objectif'])) return;
  const d = REGLAGES_DEFAUT.pp;
  ecrireReglage('pp', { ordre: [...d.ordre], actives: [...d.actives], longueur: d.longueur });
}

function reglagePP() {
  const r = reglage('pp');
  r.ordre = [...new Set([...r.ordre.filter(k => RUBRIQUES_PP[k]), ...Object.keys(RUBRIQUES_PP)])];
  r.actives = r.actives.filter(k => RUBRIQUES_PP[k]);
  if (!TONS_APPR[r.ton]) r.ton = 'bienveillant';
  if (!STYLES_APPR[r.style]) r.style = 'phrases';
  if (!ADRESSES_PP[r.adresse]) r.adresse = 'il';
  r.longueur = Math.max(80, Math.min(2000, +r.longueur || 300));
  if (!(Array.isArray(r.seuils) && r.seuils.length === 3 && r.seuils.every(Number.isFinite))) r.seuils = [10, 13, 16];
  return r;
}

function htmlReglagePP(r) {
  const sel = (name, valeurs, actuel) => `<select name="${name}">${Object.entries(valeurs).map(([v, n]) => `<option value="${v}" ${actuel === v ? 'selected' : ''}>${n}</option>`).join('')}</select>`;
  return `
    <p class="aide">Coche les rubriques à aborder et range-les (↑ ↓). Une rubrique où les collègues signalent une difficulté
      passe en priorité (⚠), même décochée ; touche-la jusqu’à « non mentionné » pour l’écarter.
      Chaque changement refait aussitôt les appréciations (sauf celles réécrites à la main : 🔄 Reproposer).</p>
    <ol class="rubriques-appr">${r.ordre.map((k, i) => `<li>
      <label class="case"><input type="checkbox" name="pp-${k}" ${r.actives.includes(k) ? 'checked' : ''}>
        <b>${esc(RUBRIQUES_PP[k].nom)}</b> <span class="aide">${esc(RUBRIQUES_PP[k].aide)}</span></label>
      <span class="espace"></span>
      <button type="button" class="icone-petit" data-appr-monter="${k}" ${i ? '' : 'disabled'} aria-label="Monter ${esc(RUBRIQUES_PP[k].nom)}">↑</button>
      <button type="button" class="icone-petit" data-appr-descendre="${k}" ${i < r.ordre.length - 1 ? '' : 'disabled'} aria-label="Descendre ${esc(RUBRIQUES_PP[k].nom)}">↓</button>
      <input type="hidden" name="pp-ordre" value="${k}"></li>`).join('')}</ol>
    <label class="case"><input type="checkbox" name="pp-bilan" ${r.bilan ? 'checked' : ''}> Commencer par un bilan général (« Bon trimestre. »)</label>
    <div class="ligne">
      <label>Écrire à la${sel('pp-adresse', ADRESSES_PP, r.adresse)}</label>
      <label>Ton${sel('pp-ton', TONS_APPR, r.ton)}</label>
      <label>Style${sel('pp-style', STYLES_APPR, r.style)}</label>
      <label class="etroit">Longueur max.<input type="number" name="pp-longueur" min="80" max="2000" step="10" value="${r.longueur}"></label>
      <span class="aide">caractères</span>
    </div>
    <div class="ligne">
      <span>Résultats (moyenne générale) :</span>
      <label class="etroit">2 dès<input type="number" name="pp-s2" min="0" max="20" step="0.5" value="${r.seuils[0]}"></label>
      <label class="etroit">3 dès<input type="number" name="pp-s3" min="0" max="20" step="0.5" value="${r.seuils[1]}"></label>
      <label class="etroit">4 dès<input type="number" name="pp-s4" min="0" max="20" step="0.5" value="${r.seuils[2]}"></label>
    </div>
    <label class="case"><input type="checkbox" name="pp-mentions" ${r.mentions ? 'checked' : ''}> Proposer une mention</label>
    <p><button type="button" data-pp="reglages-base" title="Résultats, travail, comportement et objectif ; 300 caractères ; 3e personne, bienveillant, en phrases">↺ Réglages de base</button></p>
    <div class="ligne">
      <label class="etroit">Félicitations dès<input type="number" name="pp-felicitations" min="0" max="20" step="0.5" value="${r.felicitations}"></label>
      <label class="etroit">Compliments dès<input type="number" name="pp-compliments" min="0" max="20" step="0.5" value="${r.compliments}"></label>
      <span class="aide">de moyenne générale, avec un travail et un comportement au moins satisfaisants. Encouragements : travail sérieux,
        avec des résultats encore modestes, un travail très bien ou une moyenne en hausse. Avertissement : travail ou comportement au niveau 1.</span>
    </div>`;
}

function lireReglagePP(form) {
  const ordre = [...form.querySelectorAll('[name="pp-ordre"]')].map(x => x.value), v = n => form.elements[n]?.value;
  const nb = (n, def) => { const x = parseFloat(String(v(n)).replace(',', '.')); return Number.isFinite(x) ? Math.max(0, Math.min(20, x)) : def; };
  return {
    ordre, actives: ordre.filter(k => form.elements['pp-' + k]?.checked), bilan: !!form.elements['pp-bilan']?.checked,
    adresse: v('pp-adresse') || 'il', ton: v('pp-ton') || 'bienveillant', style: v('pp-style') || 'phrases',
    longueur: Math.max(80, Math.min(2000, +v('pp-longueur') || 300)),
    seuils: [nb('pp-s2', 10), nb('pp-s3', 13), nb('pp-s4', 16)].sort((a, b) => a - b),
    mentions: !!form.elements['pp-mentions']?.checked, felicitations: nb('pp-felicitations', 16), compliments: nb('pp-compliments', 14),
  };
}

/* ---------- Appréciation générale d'un élève (texte gardé, ou proposé) ---------- */

function appreciationPP(el, periode, r = reglagePP()) {
  const enreg = Donnees.get('suivis', idApprPP(el.id, periode));
  const analyse = analyserPP(el, periode, r);
  const propose = analyse.vide ? { texte: '', niveaux: {}, retirees: [] } : redigerPP(el, periode, analyse, enreg?.niveaux, r, enreg?.graine || 0);
  const mentionCalculee = analyse.vide ? 'aucune' : mentionProposeePP(propose.niveaux, analyse, r);
  return { enreg, analyse, propose, texte: enreg?.texte || propose.texte, manuel: !!enreg?.texte,
    mention: enreg?.mention || mentionCalculee, mentionCalculee };
}

function ecrirePP(eleveId, periode, changements) {
  const id = idApprPP(eleveId, periode), avant = Donnees.get('suivis', id) || {};
  const apres = { niveaux: {}, graine: 0, texte: '', ...avant, id, eleveId, apsa: 'pp appréciation ' + periode, pp: true, periode, ...changements };
  if (JSON.stringify({ ...avant, maj: 0 }) === JSON.stringify({ ...apres, maj: 0 })) return;
  Donnees.ecrire('suivis', apres);
}

/* ---------- Vue de l'onglet ---------- */

const etatPP = { importes: [] }; // bulletins lus mais pas encore rattachés à un élève (en mémoire seulement)

// Classe affichée (on peut être PP de plusieurs classes) : celle choisie dans l'onglet, sinon la classe ouverte si on en
// est PP, sinon la première classe réelle (avant les classes exemples).
function classePP() {
  const l = classesPP();
  return l.find(c => c.id === ui.ppClasse) || l.find(c => c.id === ui.classeId) || l.find(c => !c.exemple) || l[0] || null;
}
function periodePP(c) {
  const ids = periodesAnnee().map(p => p.id);
  if (ids.includes(ui.ppPeriode)) return ui.ppPeriode;
  // Sinon : la dernière période dont des bulletins ont été lus, ou la période en cours.
  const eleves = c ? elevesDe(c.id) : [];
  return [...ids].reverse().find(p => eleves.some(el => bulletinPP(el.id, p))) || periodeDe(aujourdhui()) || ids[0];
}
const nomPeriodePP = per => periodesAnnee().find(p => p.id === per)?.code || per;

function htmlPP() {
  const c = classePP();
  if (!c) return '<div class="vide"><h2>⭐ Prof principal</h2><p>Coche « Je suis professeur principal » dans la fiche d’une classe (✎).</p></div>';
  const section = SECTIONS_PP[ui.ppSection] ? ui.ppSection : 'bulletins';
  const periode = periodePP(c), eleves = elevesDe(c.id);
  const lus = eleves.filter(el => bulletinPP(el.id, periode)).length;
  const autres = classesPP();
  return `
    <div class="outils pp-entete">
      <h2>⭐ ${autres.length > 1 ? 'Prof principal' : esc(c.nom)}</h2>
      ${autres.length > 1 ? `<div class="fiche-onglets pp-classes" role="group" aria-label="Classe">${autres.map(x =>
    `<button type="button" class="${x.id === c.id ? 'actif' : ''}" data-pp="classe" data-arg="${x.id}">${esc(x.nom)}${x.exemple ? ' <small>(exemple)</small>' : ''}</button>`).join('')}</div>` : ''}
      <div class="fiche-onglets pp-periodes">${periodesAnnee().map(p => `<button type="button" class="${p.id === periode ? 'actif' : ''}" data-pp="periode" data-arg="${p.id}">${p.code}</button>`).join('')}</div>
      <span class="aide">${lus} / ${eleves.length} bulletins lus</span>
    </div>
    <nav class="fiche-onglets pp-sections">${Object.entries(SECTIONS_PP).map(([k, n]) => `<button type="button" class="${k === section ? 'actif' : ''}" data-pp="section" data-arg="${k}">${n}</button>`).join('')}</nav>
    <div class="pp-contenu">${section === 'bulletins' ? htmlBulletinsPP(c, periode, eleves) : section === 'tableau' ? htmlTableauPP(c, periode, eleves)
    : section === 'appreciations' ? htmlAppreciationsPP(c, periode, eleves) : section === 'conseil' ? htmlConseilPP(c, periode, eleves) : htmlSuiviPP(c, periode, eleves)}</div>`;
}

const fmtMoyPP = n => (n === null || n === undefined ? '–' : fmtD(n));
const classeMoyPP = n => (n === null || n === undefined ? '' : n < 8 ? 'pp-n1' : n < 10 ? 'pp-n2' : n < 14 ? '' : n < 16 ? 'pp-n3' : 'pp-n4');

function htmlBulletinsPP(c, periode, eleves) {
  const enAttente = etatPP.importes.filter(x => x.classeId === c.id);
  return `
    <p class="aide">Dépose les bulletins PDF exportés d’École Directe ou de Pronote : un fichier par élève, ou toute la classe
      dans un seul fichier. L’appli les lit sur l’appareil (rien n’est envoyé) et ne garde que les matières, les moyennes,
      les appréciations des collègues et les absences.</p>
    <div class="outils">
      <label class="bouton primaire pp-depot">📥 Importer des bulletins (PDF)<input type="file" accept=".pdf,application/pdf" multiple data-pp-fichiers hidden></label>
      <span class="aide">Période : la période lue dans le bulletin, sinon <b>${esc(nomPeriodePP(periode))}</b>.</span>
    </div>
    ${enAttente.length ? `<div class="carte pp-attente"><h3>⚠ À rattacher (${enAttente.length})</h3>
      ${enAttente.map((x, i) => `<div class="ligne">
        <span>${esc(x.fichier)}${x.nomLu ? ` — nom lu : <b>${esc(x.nomLu)}</b>` : ''} · ${x.b.matieres.length} matières · ${esc(nomPeriodePP(x.periode))}</span>
        <select data-pp-rattacher="${i}" aria-label="Élève de ce bulletin"><option value="">Choisir l’élève…</option>
          ${eleves.map(el => `<option value="${el.id}">${esc(el.nom)} ${esc(el.prenom)}</option>`).join('')}</select>
        <button type="button" class="lien" data-pp="ignorer" data-arg="${i}">Ignorer</button></div>`).join('')}</div>` : ''}
    <div class="carte"><table class="pp-table">
      <thead><tr><th>Élève</th><th>Bulletin ${esc(nomPeriodePP(periode))}</th><th>Moy. gén.</th><th>Absences</th><th></th></tr></thead>
      <tbody>${eleves.map(el => {
    const b = bulletinPP(el.id, periode);
    return `<tr><td>${esc(el.nom)} ${esc(el.prenom)}</td>
          <td>${b ? `✔ ${b.matieres.length} matières, ${b.matieres.filter(m => m.appr).length} appréciations` : '<span class="aide">—</span>'}</td>
          <td>${b ? fmtMoyPP(b.moyGen) : ''}</td>
          <td>${b && b.absences !== null && b.absences !== undefined ? `${b.absences} ½ j.${b.nonJustifiees ? ` (${b.nonJustifiees} NJ)` : ''}${b.retards ? ` · ${b.retards} ret.` : ''}` : ''}</td>
          <td>${b ? `<button type="button" class="icone-petit" data-pp="suppr-bulletin" data-arg="${el.id}" title="Retirer ce bulletin" aria-label="Retirer le bulletin de ${esc(el.prenom)}">🗑</button>` : ''}</td></tr>`;
  }).join('')}</tbody></table></div>`;
}

async function importerBulletinsPP(fichiers) {
  const c = classePP();
  if (!c || !fichiers.length) return;
  // Élèves cherchés d'abord dans la classe affichée, puis dans les autres classes réelles dont on est PP
  // (jamais dans une classe exemple qu'on n'a pas ouverte : ses élèves sont inventés).
  const eleves = elevesDe(c.id), defaut = periodePP(c);
  const autres = classesPP().filter(x => x.id !== c.id && !x.exemple).flatMap(x => elevesDe(x.id));
  let ok = 0, illisibles = 0;
  const vus = new Set(), ailleurs = new Map(); // ailleurs : classe → nombre de bulletins rangés dans une autre classe
  toast('Lecture des bulletins…');
  for (const f of fichiers) {
    let bulletins;
    try { bulletins = await BulletinPdf.lire(f); } catch (e) { illisibles++; console.warn(f.name, e); toast(`${f.name} : ${e.message}`, 'erreur'); continue; }
    for (const b of bulletins) {
      if (!b.lisible) { illisibles++; continue; }
      const p = b.periode ? periodesAnnee().find(x => x.code === b.periode.type + b.periode.n) || periodesAnnee()[b.periode.n - 1] : null;
      const periode = p?.id || defaut;
      const el = BulletinPdf.trouverEleve(b.entete, eleves) || BulletinPdf.trouverEleve(b.entete, autres);
      const donnees = { matieres: b.matieres, moyGen: b.moyGen, moyGenClasse: b.moyGenClasse, absences: b.absences, nonJustifiees: b.nonJustifiees, retards: b.retards };
      if (el && !vus.has(el.id + periode)) {
        vus.add(el.id + periode); enregistrerBulletinPP(el.id, periode, donnees); ok++; ui.ppPeriode = periode;
        if (el.classeId !== c.id) ailleurs.set(el.classeId, (ailleurs.get(el.classeId) || 0) + 1);
      }
      else etatPP.importes.push({ classeId: c.id, fichier: f.name, nomLu: b.nomLu, periode, b: donnees });
    }
  }
  memoriserUi();
  const attente = etatPP.importes.filter(x => x.classeId === c.id).length;
  const dont = [...ailleurs].map(([id, n]) => `${n} en ${Donnees.get('classes', id)?.nom}`).join(', ');
  toast(`${ok} bulletin${ok > 1 ? 's' : ''} lu${ok > 1 ? 's' : ''}${dont ? ` (dont ${dont})` : ''}${attente ? `, ${attente} à rattacher à la main` : ''}${illisibles ? `, ${illisibles} illisible${illisibles > 1 ? 's' : ''}` : ''}.`, ok && !illisibles ? 'ok' : '');
  rendreVue();
}

function enregistrerBulletinPP(eleveId, periode, donnees) {
  Donnees.ecrire('suivis', { ...(bulletinPP(eleveId, periode) || {}), id: idBulletinPP(eleveId, periode), eleveId, apsa: 'pp bulletin ' + periode, pp: true, periode, ...donnees });
}

function htmlTableauPP(c, periode, eleves) {
  const r = reglagePP(), prec = periodePrecPP(periode);
  const lignes = eleves.map(el => ({ el, b: bulletinPP(el.id, periode), bp: prec && bulletinPP(el.id, prec) })).filter(x => x.b);
  if (!lignes.length) return `<p class="aide">Aucun bulletin lu pour ${esc(nomPeriodePP(periode))} : commence par 📥 Bulletins.</p>`;
  // Colonnes : les matières dans l'ordre des bulletins.
  const matieres = [];
  for (const { b } of lignes) for (const m of b.matieres) { const n = nomMatierePP(m.brut); if (!matieres.includes(n)) matieres.push(n); }
  const moyDe = (b, n) => b.matieres.find(m => nomMatierePP(m.brut) === n)?.moy ?? null;
  const moyClasse = n => { const l = lignes.map(x => moyDe(x.b, n)).filter(v => v !== null); return l.length ? l.reduce((a, v) => a + v, 0) / l.length : null; };
  const gen = lignes.map(x => x.b.moyGen).filter(v => v !== null && v !== undefined);
  // Bilan de la classe : mentions proposées, matières les plus fragiles.
  const mentions = {};
  for (const { el } of lignes) { const m = appreciationPP(el, periode, r).mention; mentions[m] = (mentions[m] || 0) + 1; }
  const fragiles = matieres.map(n => ({ n, m: moyClasse(n) })).filter(x => x.m !== null).sort((a, b) => a.m - b.m).slice(0, 3);
  return `
    <div class="outils"><button type="button" data-pp="fiches-pdf" title="Un PDF pour la classe : récapitulatif, puis une fiche par élève">📄 Fiches bilan du conseil (PDF)</button></div>
    <div class="carte pp-bilan-classe">
      <b>Bilan de la classe</b> · ${lignes.length} élèves · moyenne générale ${gen.length ? fmtD(gen.reduce((a, v) => a + v, 0) / gen.length) : '–'}
      · ${Object.entries(MENTIONS_PP).filter(([k]) => mentions[k] && k !== 'aucune').map(([k, n]) => `${mentions[k]} ${esc(n.toLowerCase())}`).join(', ') || 'aucune mention'}
      ${fragiles.length ? `<br><span class="aide">Matières les plus fragiles : ${fragiles.map(x => `${esc(x.n)} (${fmtD(x.m)})`).join(', ')}</span>` : ''}
    </div>
    <div class="carte grille-scroll"><table class="pp-table pp-tableau">
      <thead><tr><th>Élève</th><th>Moy. gén.</th><th>Évol.</th><th>Abs.</th><th>Mention</th>${matieres.map(n => `<th><span class="pp-vertical">${esc(n)}</span></th>`).join('')}</tr></thead>
      <tbody>${lignes.map(({ el, b, bp }) => {
    const d = bp && b.moyGen !== null && bp.moyGen !== null && bp.moyGen !== undefined ? b.moyGen - bp.moyGen : null;
    const x = appreciationPP(el, periode, r), m = x.mention;
    return `<tr><td><button type="button" class="lien" data-pp="voir-eleve" data-arg="${el.id}">${esc(el.nom)} ${esc(el.prenom)}</button></td>
          <td class="${classeMoyPP(b.moyGen)}"><b>${fmtMoyPP(b.moyGen)}</b></td>
          <td>${d === null ? '' : d >= 0.5 ? `<span class="pp-hausse">▲ ${fmtD(d)}</span>` : d <= -0.5 ? `<span class="pp-baisse">▼ ${fmtD(-d)}</span>` : '='}</td>
          <td>${b.absences ?? ''}${b.nonJustifiees ? ` <small>(${b.nonJustifiees} NJ)</small>` : ''}</td>
          <td>${m !== 'aucune' ? esc(MENTIONS_PP[m]) : ''}${x.enreg?.mention ? ' <span class="aide" title="Choisie par toi (proposée : ' + esc(MENTIONS_PP[x.mentionCalculee]) + ')">✎</span>' : ''}</td>
          ${matieres.map(n => { const v = moyDe(b, n); return `<td class="${classeMoyPP(v)}">${fmtMoyPP(v)}</td>`; }).join('')}</tr>`;
  }).join('')}</tbody>
      <tfoot><tr><th>Moyenne</th><th>${gen.length ? fmtD(gen.reduce((a, v) => a + v, 0) / gen.length) : '–'}</th><th></th><th></th><th></th>${matieres.map(n => `<th>${fmtMoyPP(moyClasse(n))}</th>`).join('')}</tr></tfoot>
    </table></div>
    <p class="aide">Couleurs : rouge sous 8, orange sous 10, vert dès 14 (foncé dès 16). Touche un élève pour le préparer en conseil.</p>`;
}

// Carte d'appréciation générale (onglet ✍ et conseil).
function htmlCartePP(el, periode, r, eleves) {
  const { analyse, propose, texte, manuel, enreg, mention, mentionCalculee } = appreciationPP(el, periode, r);
  const b = bulletinPP(el.id, periode);
  if (!b) return `<div class="carte-appr pp-carte" data-pp-eleve="${el.id}"><div class="tete-appr"><b>${esc(el.nom)} ${esc(el.prenom)}</b>
    <span class="aide">— pas de bulletin lu pour ${esc(nomPeriodePP(periode))}</span></div></div>`;
  const perso = enreg?.niveaux || {}, abordees = new Set(rubriquesPP(r, analyse, perso));
  const puces = r.ordre.filter(k => k !== 'objectif' && (r.actives.includes(k) || abordees.has(k))).map(k => {
    const n = propose.niveaux[k] || 0, change = k in perso, vigil = abordees.has(k) && vigilancePP({ niveaux: propose.niveaux }, k);
    const noms = k === 'progression' ? NOMS_NIV_PROG : k === 'matieres' ? { 0: 'non mentionnées', 1: 'citées' } : NOMS_NIV_APPR;
    const source = (change ? `Choisi par toi (calculé : ${analyse.niveaux[k] ? noms[analyse.niveaux[k]] : 'pas de donnée'})\n` : '') + (analyse.sources[k] || 'Pas de donnée : non mentionné');
    return `<button type="button" class="puce-appr n${k === 'matieres' ? (n ? 3 : 0) : n}${change ? ' change' : ''}${vigil ? ' vigilance' : ''}" data-pp-niveau="${k}"
      title="${esc(source + '\n(toucher pour changer)')}">${vigil ? '⚠ ' : ''}${esc(RUBRIQUES_PP[k].nom)} ${k === 'matieres' ? '' : `<b>${n || '–'}</b>`}<small>${esc(noms[n] ?? '')}</small></button>`;
  }).join('');
  const retirees = propose.retirees.length && !manuel
    ? `<span class="aide">Faute de place, laissé de côté : ${propose.retirees.map(k => k === 'bilan' ? 'bilan' : RUBRIQUES_PP[k].nom.toLowerCase()).join(', ')}.</span>` : '';
  return `<div class="carte-appr pp-carte" data-pp-eleve="${el.id}">
    <div class="tete-appr"><b>${esc(el.nom)} ${esc(el.prenom)}</b> <span class="aide">moy. ${fmtMoyPP(b.moyGen)}</span>
      ${manuel ? '<span class="badge-appr">modifiée à la main</span>' : ''}
      <span class="espace"></span>
      <label class="pp-mention">Mention<select data-pp-mention aria-label="Mention de ${esc(el.prenom)}">${Object.entries(MENTIONS_PP).map(([k, n]) =>
    `<option value="${k}" ${k === mention ? 'selected' : ''}>${esc(n)}${k === mentionCalculee ? ' (proposée)' : ''}</option>`).join('')}</select></label>
      ${manuel ? '<button type="button" data-pp-carte="reproposer" title="Remplacer ton texte par la proposition de l’appli">🔄 Reproposer</button>'
    : '<button type="button" data-pp-carte="autre" title="Mêmes niveaux, autres phrases">🎲 Autre formulation</button>'}
      <button type="button" data-pp-carte="copier">📋 Copier</button></div>
    <div class="puces-appr">${puces}${Object.keys(perso).length ? '<button type="button" class="lien" data-pp-carte="auto" title="Revenir aux niveaux calculés par l’appli">↺ niveaux calculés</button>' : ''}</div>
    <textarea class="texte-appr" data-pp-texte rows="3" maxlength="3000" aria-label="${esc(`Appréciation générale de ${el.nom} ${el.prenom}`)}">${esc(texte)}</textarea>
    <div class="pied-appr"><span class="compte-appr${texte.length > r.longueur ? ' trop' : ''}" data-pp-compte>${texte.length} / ${r.longueur} caractères</span>${retirees}</div>
    <div class="relecture-appr" data-pp-relecture>${htmlRelectureAppr(texte, el, prenomsAutresAppr(el, eleves), manuel)}</div>
    <details class="pp-collegues" data-pp-details="${el.id}"${etatPP.ouverts?.has(el.id) ? ' open' : ''}><summary>Ce que disent les collègues (${b.matieres.filter(m => m.appr).length})</summary>
      ${htmlMatieresPP(b, analyse)}</details>
  </div>`;
}

// Matières d'un bulletin, avec les mots repérés par l'appli (👍 / 👎).
function htmlMatieresPP(b, analyse) {
  return `<table class="pp-table pp-matieres"><tbody>${b.matieres.map((m, i) => {
    const s = analyse.details.signaux[i] || [];
    const puces = [...new Map(s.map(x => [x.k + x.s, x])).values()].map(x =>
      `<span class="pp-signal ${x.s > 0 ? 'plus' : 'moins'}" title="« ${esc(x.mot)} »">${x.s > 0 ? '👍' : '👎'} ${esc(RUBRIQUES_PP[x.k].nom.toLowerCase())}</span>`).join(' ');
    return `<tr><th>${esc(nomMatierePP(m.brut))}</th><td class="${classeMoyPP(m.moy)}">${fmtMoyPP(m.moy)}</td><td class="aide">${fmtMoyPP(m.moyClasse)}</td>
      <td>${esc(m.appr || '')}${puces ? `<div>${puces}</div>` : ''}</td></tr>`;
  }).join('')}</tbody></table>`;
}

function htmlAppreciationsPP(c, periode, eleves) {
  const r = reglagePP();
  return `
    <p class="aide">L’appli rédige l’appréciation générale à partir des bulletins : moyenne générale, progression, absences et
      ce que disent les collègues (mots repérés : 👍 / 👎). Touche une rubrique pour changer son niveau ; tu peux aussi réécrire le texte.</p>
    <details class="reglages-appr" data-pp-reglages-details${etatPP.reglagesOuverts ? ' open' : ''}><summary>⚙ Réglages de l’appréciation générale <small>rubriques, ton, style, longueur, mentions</small></summary>
      <form data-pp-reglages>${htmlReglagePP(r)}</form></details>
    <div class="outils"><button type="button" data-pp="copier-toutes" title="Copie « NOM Prénom [tab] appréciation », une ligne par élève (se colle aussi dans Excel)">📋 Copier toutes</button></div>
    <div data-pp-liste>${eleves.map(el => htmlCartePP(el, periode, r, eleves)).join('')}</div>`;
}

function htmlConseilPP(c, periode, eleves) {
  const avec = eleves.filter(el => bulletinPP(el.id, periode));
  if (!avec.length) return `<p class="aide">Aucun bulletin lu pour ${esc(nomPeriodePP(periode))} : commence par 📥 Bulletins.</p>`;
  const el = avec.find(x => x.id === ui.ppEleve) || avec[0], i = avec.indexOf(el);
  const r = reglagePP(), b = bulletinPP(el.id, periode);
  const enreg = Donnees.get('suivis', idApprPP(el.id, periode));
  const prec = periodePrecPP(periode), bp = prec && bulletinPP(el.id, prec);
  const d = bp && b.moyGen !== null && bp.moyGen !== null && bp.moyGen !== undefined ? b.moyGen - bp.moyGen : null;
  const besoins = Object.entries(BESOINS).filter(([, x]) => x.actif(el)).map(([k, x]) => `<span class="badge-${k}">${x.sigle}</span>`).join(' ');
  return `
    <div class="outils pp-conseil-nav">
      <button type="button" data-pp="eleve" data-arg="${avec[i - 1]?.id || ''}" ${i ? '' : 'disabled'} aria-label="Élève précédent">◀</button>
      <select data-pp-eleve-choix aria-label="Élève">${avec.map(x => `<option value="${x.id}" ${x.id === el.id ? 'selected' : ''}>${esc(x.nom)} ${esc(x.prenom)}</option>`).join('')}</select>
      <button type="button" data-pp="eleve" data-arg="${avec[i + 1]?.id || ''}" ${i < avec.length - 1 ? '' : 'disabled'} aria-label="Élève suivant">▶</button>
      <span class="aide">${i + 1} / ${avec.length}</span><span class="espace"></span>
      <button type="button" data-pp="compte-rendu" title="Copie, pour chaque élève : moyenne, mention et notes du conseil">📋 Compte rendu du conseil</button>
      <button type="button" data-pp="fiches-pdf" title="Un PDF pour la classe : récapitulatif, puis une fiche par élève (appréciation générale, mention, moyennes, absences, points d’attention, notes du conseil, suivi)">📄 Fiches bilan (PDF)</button>
    </div>
    <div class="pp-conseil-resume carte">
      <b class="pp-grand">${esc(el.nom)} ${esc(el.prenom)}</b> ${besoins}
      <span>Moyenne générale <b class="${classeMoyPP(b.moyGen)}">${fmtMoyPP(b.moyGen)}</b>${b.moyGenClasse ? ` <small>(classe ${fmtD(b.moyGenClasse)})</small>` : ''}
        ${d === null ? '' : d >= 0.5 ? `<span class="pp-hausse">▲ ${fmtD(d)}</span>` : d <= -0.5 ? `<span class="pp-baisse">▼ ${fmtD(-d)}</span>` : '<span class="aide">stable</span>'}</span>
      <span>${b.absences !== null && b.absences !== undefined ? `Absences : ${b.absences} ½ j.${b.nonJustifiees ? ` dont ${b.nonJustifiees} NJ` : ''}` : ''}${b.retards ? ` · ${b.retards} retards` : ''}</span>
      ${(l => (l.length ? `<span class="pp-points" data-pp-points>⚠ ${l.map(esc).join(' · ')}</span>` : ''))(alertesPP(el, periode, r))}
    </div>
    ${htmlCartePP(el, periode, r, eleves).replace('<details class="pp-collegues"', '<details open class="pp-collegues"')}
    <label class="pp-notes">Notes du conseil (décisions, remarques des collègues)<textarea data-pp-notes="${el.id}" rows="3" maxlength="2000">${esc(enreg?.notes || '')}</textarea></label>`;
}

/* ---------- 📄 Fiches bilan du conseil (un PDF pour la classe) ----------
   Page 1 : récapitulatif de la classe ; puis une page par élève : chiffres clés, mention, appréciation générale,
   moyennes par matière, points forts et à renforcer, points d'attention, notes du conseil, suivi récent.
   Tout est relu au moment de l'export (mention, niveaux et textes choisis à la main compris). PDF : « Enregistrer au
   format PDF » dans la fenêtre d'impression, comme la fiche bilan de l'onglet Notes. */

function htmlFicheConseilPP(el, periode, r, c) {
  const b = bulletinPP(el.id, periode), x = appreciationPP(el, periode, r), d = x.analyse.details;
  const prec = periodePrecPP(periode), bp = prec && bulletinPP(el.id, prec);
  const ecart = bp && b.moyGen !== null && b.moyGen !== undefined && bp.moyGen !== null && bp.moyGen !== undefined ? b.moyGen - bp.moyGen : null;
  const besoins = Object.values(BESOINS).filter(y => y.actif(el)).map(y => y.sigle).join(', ');
  const alertes = alertesPP(el, periode, r), notes = x.enreg?.notes || '';
  const journal = journalPP(el.id).slice(0, 4);
  const abs = b.absences !== null && b.absences !== undefined ? `${b.absences} ½ j.` : '–';
  return `<section class="fiche-conseil">
    <h1>${esc(el.nom)} ${esc(el.prenom)}</h1>
    <p class="sous-titre">${esc(c.nom)} · ${esc(nomPeriodePP(periode))}${besoins ? ` · ${esc(besoins)}` : ''}</p>
    <table class="chiffres"><tr>
      <td><small>Moyenne générale</small><b>${fmtMoyPP(b.moyGen)}</b>${b.moyGenClasse ? `<small>classe ${fmtD(b.moyGenClasse)}</small>` : ''}</td>
      <td><small>Évolution</small><b>${ecart === null ? '–' : (ecart >= 0 ? '+' : '−') + fmtD(Math.abs(ecart))}</b></td>
      <td><small>Absences</small><b>${esc(abs)}</b>${b.nonJustifiees ? `<small>dont ${b.nonJustifiees} non justifiée${b.nonJustifiees > 1 ? 's' : ''}</small>` : ''}</td>
      <td><small>Retards</small><b>${b.retards ?? '–'}</b></td>
      <td class="mention"><small>Mention</small><b>${esc(x.mention === 'aucune' ? '—' : MENTIONS_PP[x.mention])}</b></td>
    </tr></table>
    <h2>Appréciation générale</h2>
    <p class="cadre">${esc(x.texte) || '<i>—</i>'}</p>
    <h2>Moyennes par matière</h2>
    <table class="matieres"><thead><tr><th>Matière</th><th>Élève</th><th>Classe</th></tr></thead><tbody>${b.matieres.filter(m => m.moy !== null).map(m => `<tr><td>${esc(nomMatierePP(m.brut))}</td><td><b>${fmtMoyPP(m.moy)}</b></td><td><small>${fmtMoyPP(m.moyClasse)}</small></td></tr>`).join('')}</tbody></table>
    ${d.forts?.length || d.faibles?.length ? `<p>${d.forts.length ? `<b>Points forts :</b> ${esc(d.forts.map(y => y.nom).join(', '))}` : ''}${d.forts.length && d.faibles.length ? ' · ' : ''}${d.faibles.length ? `<b>À renforcer :</b> ${esc(d.faibles.map(y => y.nom).join(', '))}` : ''}</p>` : ''}
    ${alertes.length ? `<h2>Points d’attention</h2><ul>${alertes.map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}
    ${notes ? `<h2>Notes du conseil</h2><p class="cadre">${esc(notes).replace(/\n/g, '<br>')}</p>` : ''}
    ${journal.length ? `<h2>Suivi</h2><ul>${journal.map(j => `<li><b>${dateCourtePP(j.date)}</b> · ${esc(TYPES_JOURNAL_PP[j.type] || 'Autre')}${j.objet ? ` — ${esc(j.objet)}` : ''}${j.suite ? ` <i>Suite : ${esc(j.suite)}</i>` : ''}${j.rappel && !j.fait ? ` (rappel le ${dateCourtePP(j.rappel)})` : ''}</li>`).join('')}</ul>` : ''}
  </section>`;
}

function exporterFichesPP() {
  const c = classePP();
  if (!c) return;
  enregistrerTextePP();
  const periode = periodePP(c), r = reglagePP(), eleves = elevesDe(c.id).filter(el => bulletinPP(el.id, periode));
  if (!eleves.length) return toast(`Aucun bulletin lu pour ${nomPeriodePP(periode)} : rien à exporter.`, 'erreur');
  const prec = periodePrecPP(periode);
  const lignes = eleves.map(el => {
    const b = bulletinPP(el.id, periode), x = appreciationPP(el, periode, r), bp = prec && bulletinPP(el.id, prec);
    const e = bp && b.moyGen !== null && b.moyGen !== undefined && bp.moyGen !== null && bp.moyGen !== undefined ? b.moyGen - bp.moyGen : null;
    return `<tr><td>${esc(el.nom)} ${esc(el.prenom)}</td><td><b>${fmtMoyPP(b.moyGen)}</b></td><td>${e === null ? '' : (e >= 0 ? '+' : '−') + fmtD(Math.abs(e))}</td>
      <td>${b.absences ?? ''}${b.nonJustifiees ? ` (${b.nonJustifiees} NJ)` : ''}</td><td>${x.mention === 'aucune' ? '' : esc(MENTIONS_PP[x.mention])}</td><td>${alertesPP(el, periode, r).length || ''}</td></tr>`;
  });
  const gens = eleves.map(el => bulletinPP(el.id, periode).moyGen).filter(v => v !== null && v !== undefined);
  const mentions = {};
  for (const el of eleves) { const m = appreciationPP(el, periode, r).mention; mentions[m] = (mentions[m] || 0) + 1; }
  let zone = $('#zone-impression');
  if (!zone) { zone = document.createElement('div'); zone.id = 'zone-impression'; document.body.append(zone); }
  zone.innerHTML = `<div class="impression-pp">
    <section class="fiche-conseil">
      <h1>Conseil de classe — ${esc(c.nom)} — ${esc(nomPeriodePP(periode))}</h1>
      <p class="sous-titre">${eleves.length} élèves · moyenne de la classe ${gens.length ? fmtD(gens.reduce((a, v) => a + v, 0) / gens.length) : '–'} ·
        ${Object.entries(MENTIONS_PP).filter(([k]) => mentions[k] && k !== 'aucune').map(([k, n]) => `${mentions[k]} ${esc(n.toLowerCase())}`).join(', ') || 'aucune mention'} · édité le ${dateCourtePP(aujourdhui())}</p>
      <table><thead><tr><th>Élève</th><th>Moy.</th><th>Évol.</th><th>Abs. (½ j.)</th><th>Mention</th><th>Points d’attention</th></tr></thead><tbody>${lignes.join('')}</tbody></table>
    </section>
    ${eleves.map(el => htmlFicheConseilPP(el, periode, r, c)).join('')}</div>`;
  // (Nom proposé pour le PDF : celui de la page.)
  const titre = document.title;
  document.title = `Conseil ${c.nom} ${nomPeriodePP(periode)}`;
  document.body.classList.add('impression-bareme');
  const fin = () => { document.body.classList.remove('impression-bareme'); document.title = titre; window.removeEventListener('afterprint', fin); };
  window.addEventListener('afterprint', fin);
  window.print();
  setTimeout(fin, 1000);
}

/* ---------- 🗂 Suivi des élèves ---------- */

const TYPES_JOURNAL_PP = { eleve: 'Entretien avec l’élève', famille: 'Entretien avec la famille', equipe: 'Équipe pédagogique', vs: 'Vie scolaire, CPE', sante: 'Infirmerie, psy-EN, assistante sociale', autre: 'Autre' };
const journalPP = eleveId => Donnees.liste('suivis', x => x.eleveId === eleveId && x.pp && x.apsa === 'pp journal').sort((a, b) => (b.date || '').localeCompare(a.date || ''));

function alertesPP(el, periode, r) {
  const b = bulletinPP(el.id, periode), res = [];
  const auj = aujourdhui();
  for (const j of journalPP(el.id)) if (j.rappel && !j.fait && j.rappel <= auj) res.push(`⏰ Rappel du ${dateCourtePP(j.rappel)} : ${j.objet || TYPES_JOURNAL_PP[j.type]}`);
  if (!b) return res;
  // D'après ce qui est décidé : niveaux et mention choisis à la main l'emportent sur ceux calculés par l'appli.
  const x = appreciationPP(el, periode, r), a = x.analyse, niv = x.propose.niveaux, perso = x.enreg?.niveaux || {};
  const qui = k => (k in perso ? ' (choisi par toi)' : a.details.neg[k]?.length ? ` (${a.details.neg[k].join(', ')})` : '');
  if (x.mention === 'avTravail' || x.mention === 'avComportement') res.push(`${MENTIONS_PP[x.mention]} ${x.enreg?.mention ? 'décidé' : 'proposé'}`);
  if (b.moyGen !== null && b.moyGen !== undefined && b.moyGen < 10) res.push(`Moyenne générale ${fmtD(b.moyGen)}`);
  if (a.details.ecart !== undefined && a.details.ecart <= -1.5) res.push(`Baisse de ${fmtD(-a.details.ecart)} point${-a.details.ecart >= 2 ? 's' : ''}`);
  const sous10 = b.matieres.filter(m => m.moy !== null && m.moy < 10).length;
  if (sous10 >= 3) res.push(`${sous10} matières sous 10`);
  if (niv.travail === 1) res.push('Travail insuffisant' + qui('travail'));
  if (niv.comportement === 1) res.push('Comportement à reprendre' + qui('comportement'));
  if (niv.participation === 1) res.push('Participation très faible' + qui('participation'));
  if (niv.assiduite === 1) res.push(`Absences : ${a.sources.assiduite.split('\n')[0]}`);
  return res;
}
const dateCourtePP = iso => (iso ? new Date(iso + 'T12:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '');

function htmlSuiviPP(c, periode, eleves) {
  const r = reglagePP();
  const alertes = eleves.map(el => ({ el, l: alertesPP(el, periode, r) })).filter(x => x.l.length);
  return `
    <div class="carte pp-alertes"><h3>⚠ Élèves à suivre — ${esc(nomPeriodePP(periode))}</h3>
      ${alertes.length ? `<ul>${alertes.map(({ el, l }) => `<li><button type="button" class="lien" data-pp="ouvrir-suivi" data-arg="${el.id}"><b>${esc(el.nom)} ${esc(el.prenom)}</b></button> : ${l.map(esc).join(' · ')}</li>`).join('')}</ul>`
    : '<p class="aide">Aucune alerte (moyenne sous 10, baisse d’au moins 1,5 point, 3 matières sous 10, travail ou comportement signalés, absences, rappels).</p>'}</div>
    <div class="pp-suivi">${eleves.map(el => {
    const j = journalPP(el.id), ouvert = etatPP.suiviOuverts?.has(el.id);
    return `<details class="carte pp-suivi-eleve" data-pp-suivi="${el.id}"${ouvert ? ' open' : ''}>
        <summary><b>${esc(el.nom)} ${esc(el.prenom)}</b> ${Object.entries(BESOINS).filter(([, x]) => x.actif(el)).map(([k, x]) => `<span class="badge-${k}">${x.sigle}</span>`).join(' ')}
          <span class="aide">${j.length ? `${j.length} note${j.length > 1 ? 's' : ''} · dernière le ${dateCourtePP(j[0].date)}` : ''}</span></summary>
        <div class="outils">
          <button type="button" class="primaire" data-pp="note-suivi" data-arg="${el.id}">+ Note de suivi</button>
          ${Object.keys(BESOINS).map(k => boutonBesoin(el, k)).join('')}
          ${j.length ? `<button type="button" data-pp="copier-suivi" data-arg="${el.id}">📋 Copier le suivi</button>` : ''}
        </div>
        ${j.length ? `<ul class="pp-journal">${j.map(x => `<li>
          <b>${dateCourtePP(x.date)}</b> · ${esc(TYPES_JOURNAL_PP[x.type] || 'Autre')}${x.objet ? ` — ${esc(x.objet)}` : ''}
          ${x.suite ? `<br><span class="aide">Suite : ${esc(x.suite)}</span>` : ''}
          ${x.rappel ? `<br><span class="${!x.fait && x.rappel <= aujourdhui() ? 'pp-baisse' : 'aide'}">${x.fait ? `✔ Rappel du ${dateCourtePP(x.rappel)} : fait` : `⏰ Rappel le ${dateCourtePP(x.rappel)}`}</span>
            ${x.fait ? '' : `<button type="button" class="lien" data-pp="rappel-fait" data-arg="${x.id}">✔ fait</button>`}` : ''}
          <button type="button" class="icone-petit" data-pp="note-suivi" data-arg="${el.id}" data-note="${x.id}" aria-label="Modifier la note">✎</button></li>`).join('')}</ul>`
    : '<p class="aide">Aucune note de suivi.</p>'}
      </details>`;
  }).join('')}</div>`;
}

async function editerNotePP(eleveId, noteId) {
  const el = Donnees.get('eleves', eleveId), x = noteId ? Donnees.get('suivis', noteId) : { date: aujourdhui(), type: 'eleve' };
  const { resultat } = ouvrirModale(`Suivi — ${el.nom} ${el.prenom}`, `
    <div class="ligne">
      <label>Date<input type="date" name="date" required value="${esc(x.date || aujourdhui())}"></label>
      <label>Type<select name="type">${Object.entries(TYPES_JOURNAL_PP).map(([k, n]) => `<option value="${k}" ${x.type === k ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
    </div>
    <label>Objet<textarea name="objet" rows="3" maxlength="1000" autofocus placeholder="Ce qui a été dit, constaté…">${esc(x.objet || '')}</textarea></label>
    <label>Suite, engagements<textarea name="suite" rows="2" maxlength="1000" placeholder="Ce qui a été décidé, qui fait quoi…">${esc(x.suite || '')}</textarea></label>
    <label>Rappel (facultatif)<input type="date" name="rappel" value="${esc(x.rappel || '')}"></label>
    <p class="aide">Reste dans ton carnet (chiffré sur la clé). N’écris que ce qui est utile au suivi scolaire.</p>`,
  boutonsModale('Enregistrer', noteId ? BOUTON_SUPPRIMER : ''));
  const r = await resultat;
  if (r.action === 'supprimer') {
    if (await confirmer('Supprimer cette note de suivi ?')) Donnees.supprimer('suivis', noteId);
  } else if (r.action === 'ok') {
    Donnees.ecrire('suivis', { ...x, id: noteId || Donnees.nouvelId(), eleveId, apsa: 'pp journal', pp: true, date: r.data.date,
      type: r.data.type, objet: r.data.objet.trim(), suite: r.data.suite.trim(), rappel: r.data.rappel || '', fait: noteId && x.rappel === r.data.rappel ? !!x.fait : false });
  }
  (etatPP.suiviOuverts ||= new Set()).add(eleveId);
  rendreVue();
}

/* ---------- Événements ---------- */

let minuteurPP = null, attentePP = null;
function enregistrerTextePP() {
  clearTimeout(minuteurPP);
  if (!attentePP) return;
  const { eleve, periode, champ, texte } = attentePP;
  attentePP = null;
  if (champ === 'notes') return ecrirePP(eleve, periode, { notes: texte });
  const propose = appreciationPP(Donnees.get('eleves', eleve), periode).propose.texte;
  ecrirePP(eleve, periode, { texte: texte === propose ? '' : texte });
}

function dessinerCartePP(id) {
  const carte = $(`#vue [data-pp-eleve="${id}"]`), c = classePP();
  if (!carte || !c) return;
  const ouvert = carte.querySelector('details.pp-collegues')?.open;
  carte.outerHTML = htmlCartePP(Donnees.get('eleves', id), periodePP(c), reglagePP(), elevesDe(c.id));
  if (ouvert) $(`#vue [data-pp-eleve="${id}"] details.pp-collegues`).open = true;
  // Conseil : les points d'attention du résumé suivent les niveaux et la mention choisis.
  const points = $('#vue .pp-conseil-resume');
  if (points) {
    const el = Donnees.get('eleves', id), l = alertesPP(el, periodePP(c), reglagePP());
    $('[data-pp-points]', points)?.remove();
    if (l.length) points.insertAdjacentHTML('beforeend', `<span class="pp-points" data-pp-points>⚠ ${l.map(esc).join(' · ')}</span>`);
  }
}

async function actionPP(action, arg, b) {
  const c = classePP();
  if (!c) return;
  const periode = periodePP(c), eleves = elevesDe(c.id);
  enregistrerTextePP();
  switch (action) {
    case 'periode': ui.ppPeriode = arg; memoriserUi(); return rendreVue();
    case 'classe': ui.ppClasse = arg; delete ui.ppEleve; memoriserUi(); return rendreVue();
    case 'section': ui.ppSection = arg; memoriserUi(); return rendreVue();
    case 'eleve': if (arg) { ui.ppEleve = arg; memoriserUi(); rendreVue(); } return;
    case 'voir-eleve': ui.ppEleve = arg; ui.ppSection = 'conseil'; memoriserUi(); return rendreVue();
    case 'ignorer': { const l = etatPP.importes.filter(x => x.classeId === c.id); etatPP.importes = etatPP.importes.filter(x => x !== l[+arg]); return rendreVue(); }
    case 'suppr-bulletin': {
      const el = Donnees.get('eleves', arg);
      if (!(await confirmer(`Retirer le bulletin ${nomPeriodePP(periode)} de ${el.prenom} ${el.nom} ?`, 'Retirer'))) return;
      Donnees.supprimer('suivis', idBulletinPP(arg, periode));
      return rendreVue();
    }
    case 'fiches-pdf': return exporterFichesPP();
    case 'reglages-base': {
      Donnees.ecrire('reglages', { ...Donnees.get('reglages', 'pp'), id: 'pp', ...structuredClone(REGLAGES_DEFAUT.pp) });
      $('#vue [data-pp-reglages]').innerHTML = htmlReglagePP(reglagePP());
      return reglagesModifiesPP();
    }
    case 'copier-toutes': {
      const r = reglagePP();
      return copierTexte(eleves.filter(el => bulletinPP(el.id, periode)).map(el => `${el.nom} ${el.prenom}\t${appreciationPP(el, periode, r).texte}`).join('\n'));
    }
    case 'compte-rendu': {
      const r = reglagePP();
      const lignes = eleves.filter(el => bulletinPP(el.id, periode)).map(el => {
        const x = appreciationPP(el, periode, r), b = bulletinPP(el.id, periode);
        return `${el.nom} ${el.prenom} — moy. ${fmtMoyPP(b.moyGen)}${x.mention !== 'aucune' ? ' — ' + MENTIONS_PP[x.mention] : ''}`
          + (x.enreg?.notes ? `\n    ${x.enreg.notes.replace(/\n/g, '\n    ')}` : '');
      });
      return copierTexte(`Conseil de classe ${c.nom} — ${nomPeriodePP(periode)}\n\n${lignes.join('\n')}`);
    }
    case 'note-suivi': return editerNotePP(arg, b.dataset.note);
    case 'rappel-fait': { const x = Donnees.get('suivis', arg); Donnees.ecrire('suivis', { ...x, fait: true }); return rendreVue(); }
    case 'ouvrir-suivi': {
      (etatPP.suiviOuverts ||= new Set()).add(arg);
      rendreVue();
      return $(`#vue [data-pp-suivi="${arg}"]`)?.scrollIntoView({ block: 'center' });
    }
    case 'copier-suivi': {
      const el = Donnees.get('eleves', arg);
      return copierTexte(`Suivi — ${el.nom} ${el.prenom}\n` + journalPP(arg).map(x => `${x.date} · ${TYPES_JOURNAL_PP[x.type] || 'Autre'}${x.objet ? ' — ' + x.objet : ''}${x.suite ? `\n    Suite : ${x.suite}` : ''}`).join('\n'));
    }
    default:
  }
}

async function actionCartePP(b, carte) {
  const id = carte.dataset.ppEleve, el = Donnees.get('eleves', id), c = classePP(), periode = periodePP(c), r = reglagePP();
  enregistrerTextePP();
  const enreg = Donnees.get('suivis', idApprPP(id, periode));
  const garderManuel = async () => !enreg?.texte || confirmer('Tu as réécrit cette appréciation à la main. La remplacer par une nouvelle proposition ?', 'Remplacer');
  const a = b.dataset.ppCarte;
  if (a === 'copier') return copierTexte($('[data-pp-texte]', carte).value.trim());
  if (a === 'reproposer') ecrirePP(id, periode, { texte: '' });
  if (a === 'autre') ecrirePP(id, periode, { graine: (enreg?.graine || 0) + 1, texte: '' });
  if (a === 'auto') { if (!(await garderManuel())) return; ecrirePP(id, periode, { niveaux: {}, texte: '' }); }
  if (b.dataset.ppNiveau) {
    if (!(await garderManuel())) return;
    const k = b.dataset.ppNiveau, x = appreciationPP(el, periode, r);
    const max = k === 'matieres' ? 1 : 4, actuel = x.propose.niveaux[k] || 0, suivant = actuel >= max ? 0 : actuel + 1;
    const niveaux = { ...(enreg?.niveaux || {}) };
    if (suivant === (x.analyse.niveaux[k] || 0)) delete niveaux[k]; else niveaux[k] = suivant;
    ecrirePP(id, periode, { niveaux, texte: '' });
    dessinerCartePP(id);
    return $(`#vue [data-pp-eleve="${id}"] [data-pp-niveau="${k}"]`)?.focus();
  }
  dessinerCartePP(id);
}

document.addEventListener('click', e => {
  if (ui.vue !== 'pp' || e.target.closest('dialog')) return;
  const b = e.target.closest('#vue button');
  if (!b || b.disabled) return;
  if (b.dataset.pp) return lancer(() => actionPP(b.dataset.pp, b.dataset.arg, b));
  const carte = b.closest('[data-pp-eleve]');
  if (carte && (b.dataset.ppCarte || b.dataset.ppNiveau)) return lancer(() => actionCartePP(b, carte));
  if (b.dataset.apprMonter || b.dataset.apprDescendre) {
    if (!b.closest('[data-pp-reglages]')) return;
    deplacerRubriqueAppr(b);
    return reglagesModifiesPP();
  }
});

function reglagesModifiesPP() {
  const form = $('#vue [data-pp-reglages]'), c = classePP();
  if (!form || !c) return;
  enregistrerTextePP();
  ecrireReglage('pp', lireReglagePP(form));
  const periode = periodePP(c), eleves = elevesDe(c.id), r = reglagePP();
  $('#vue [data-pp-liste]').innerHTML = eleves.map(el => htmlCartePP(el, periode, r, eleves)).join('');
}

document.addEventListener('change', e => {
  const t = e.target;
  if (ui.vue !== 'pp' || !t.closest?.('#vue')) return;
  if (t.matches('[data-pp-fichiers]')) { const f = [...t.files]; t.value = ''; return lancer(() => importerBulletinsPP(f)); }
  if (t.matches('[data-pp-eleve-choix]')) { enregistrerTextePP(); ui.ppEleve = t.value; memoriserUi(); return rendreVue(); }
  if (t.matches('[data-pp-rattacher]') && t.value) {
    const c = classePP(), l = etatPP.importes.filter(x => x.classeId === c.id), x = l[+t.dataset.ppRattacher];
    if (!x) return;
    enregistrerBulletinPP(t.value, x.periode, x.b);
    etatPP.importes = etatPP.importes.filter(y => y !== x);
    return rendreVue();
  }
  if (t.matches('[data-pp-mention]')) {
    const carte = t.closest('[data-pp-eleve]'), c = classePP(), periode = periodePP(c);
    const x = appreciationPP(Donnees.get('eleves', carte.dataset.ppEleve), periode);
    enregistrerTextePP();
    ecrirePP(carte.dataset.ppEleve, periode, { mention: t.value === x.mentionCalculee ? '' : t.value });
    dessinerCartePP(carte.dataset.ppEleve); // (et, au conseil, les points d'attention de l'élève)
    return $(`#vue [data-pp-eleve="${carte.dataset.ppEleve}"] [data-pp-mention]`)?.focus();
  }
  if (t.closest('[data-pp-reglages]')) { clearTimeout(minuteurReglagesPP); return reglagesModifiesPP(); }
});

// Texte réécrit et notes du conseil : enregistrés pendant la frappe (sans redessiner la vue).
let minuteurReglagesPP = null;
document.addEventListener('input', e => {
  const t = e.target;
  if (ui.vue !== 'pp' || !t.closest?.('#vue')) return;
  const c = classePP();
  if (!c) return;
  // Réglages chiffrés (longueur, seuils) : appréciations refaites pendant la frappe, après une courte pause.
  if (t.closest('[data-pp-reglages]') && t.type === 'number') {
    clearTimeout(minuteurReglagesPP);
    minuteurReglagesPP = setTimeout(reglagesModifiesPP, 500);
    return;
  }
  if (t.matches('[data-pp-notes]')) {
    attentePP = { eleve: t.dataset.ppNotes, periode: periodePP(c), champ: 'notes', texte: t.value.trim() };
    clearTimeout(minuteurPP);
    minuteurPP = setTimeout(enregistrerTextePP, 800);
    return;
  }
  if (!t.matches('[data-pp-texte]')) return;
  const carte = t.closest('[data-pp-eleve]'), n = t.value.trim().length, r = reglagePP();
  const compte = $('[data-pp-compte]', carte);
  compte.textContent = `${n} / ${r.longueur} caractères`;
  compte.classList.toggle('trop', n > r.longueur);
  attentePP = { eleve: carte.dataset.ppEleve, periode: periodePP(c), champ: 'texte', texte: t.value.trim() };
  clearTimeout(minuteurPP);
  minuteurPP = setTimeout(() => {
    enregistrerTextePP();
    const el = Donnees.get('eleves', carte.dataset.ppEleve), zone = $('[data-pp-relecture]', carte);
    if (el && zone) zone.innerHTML = htmlRelectureAppr(t.value, el, prenomsAutresAppr(el, elevesDe(c.id)), true);
  }, 800);
});
document.addEventListener('focusout', e => { if (ui.vue === 'pp' && e.target.matches?.('#vue [data-pp-texte], #vue [data-pp-notes]')) enregistrerTextePP(); });

// Panneaux dépliés : gardés ouverts après un nouveau rendu.
document.addEventListener('toggle', e => {
  const d = e.target;
  if (ui.vue !== 'pp' || !(d instanceof HTMLDetailsElement)) return;
  if (d.matches('[data-pp-reglages-details]')) etatPP.reglagesOuverts = d.open;
  const ens = d.dataset.ppSuivi ? (etatPP.suiviOuverts ||= new Set()) : d.dataset.ppDetails ? (etatPP.ouverts ||= new Set()) : null;
  const id = d.dataset.ppSuivi || d.dataset.ppDetails;
  if (ens) { if (d.open) ens.add(id); else ens.delete(id); }
}, true);

// Glisser-déposer des PDF sur l'onglet.
document.addEventListener('dragover', e => { if (ui.vue === 'pp' && ui.ppSection === 'bulletins' && e.target.closest?.('#vue')) e.preventDefault(); });
document.addEventListener('drop', e => {
  if (ui.vue !== 'pp' || ui.ppSection !== 'bulletins' || !e.target.closest?.('#vue')) return;
  e.preventDefault();
  const f = [...(e.dataTransfer?.files || [])].filter(x => /\.pdf$/i.test(x.name) || x.type === 'application/pdf');
  if (f.length) lancer(() => importerBulletinsPP(f));
});
