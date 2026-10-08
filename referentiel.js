'use strict';
// Référentiels institutionnels EPS : attendus de fin de cycle (collège) et de fin de lycée (voie GT).
// Sources : programmes cycles 3 et 4 (BO spécial n°11 du 26/11/2015, mémos académiques),
// programme d'EPS du lycée GT (BO spécial n°1 du 22/01/2019) et référentiels du bac GT.
// Un attendu est soit un texte (code AFC/AFL numéroté dans l'ordre), soit [code, texte].
const REFERENTIEL = (() => {
  const brut = {
    cycle3: {
      nom: 'Collège — cycle 3 (6e)', code: 'AFC',
      champs: {
        CA1: ['Produire une performance optimale, mesurable à une échéance donnée', [
          'Réaliser des efforts et enchaîner plusieurs actions motrices dans différentes familles pour aller plus vite, plus longtemps, plus haut, plus loin.',
          'Combiner une course, un saut, un lancer pour faire la meilleure performance cumulée.',
          'Mesurer et quantifier les performances, les enregistrer, les comparer, les classer, les traduire en représentations graphiques.',
          'Assumer les rôles de chronométreur et d’observateur.',
        ]],
        CA2: ['Adapter ses déplacements à des environnements variés', [
          'Réaliser, seul ou à plusieurs, un parcours dans plusieurs environnements inhabituels, en milieu naturel aménagé ou artificiel.',
          'Connaître et respecter les règles de sécurité qui s’appliquent à chaque environnement.',
          'Identifier la personne responsable à alerter ou la procédure en cas de problème.',
          'Valider l’attestation du savoir-nager en sécurité (ASNS).',
        ]],
        CA3: ['S’exprimer devant les autres par une prestation artistique et/ou acrobatique', [
          'Réaliser en petits groupes 2 séquences : une à visée acrobatique destinée à être jugée, une autre à visée artistique destinée à être appréciée et à émouvoir.',
          'Savoir filmer une prestation pour la revoir et la faire évoluer.',
          'Respecter les prestations des autres et accepter de se produire devant les autres.',
        ]],
        CA4: ['Conduire et maîtriser un affrontement collectif ou interindividuel', [
          'En situation aménagée ou à effectif réduit, s’organiser tactiquement pour gagner le duel ou le match en identifiant les situations favorables de marque.',
          'Maintenir un engagement moteur efficace sur tout le temps de jeu prévu.',
          'Respecter les partenaires, les adversaires et l’arbitre.',
          'Assurer différents rôles sociaux (joueur, arbitre, observateur) inhérents à l’activité et à l’organisation de la classe.',
          'Accepter le résultat de la rencontre et être capable de le commenter.',
        ]],
      },
    },
    cycle4: {
      nom: 'Collège — cycle 4 (5e, 4e, 3e)', code: 'AFC',
      champs: {
        CA1: ['Produire une performance optimale, mesurable à une échéance donnée', [
          'Gérer son effort, faire des choix pour réaliser la meilleure performance dans au moins deux familles athlétiques et/ou au moins deux styles de nages.',
          'S’engager dans un programme de préparation individuel ou collectif.',
          'Planifier et réaliser une épreuve combinée.',
          'S’échauffer avant un effort.',
          'Aider ses camarades et assumer différents rôles sociaux (juge d’appel et de déroulement, chronométreur, juge de mesure, organisateur, collecteur de résultats…).',
        ]],
        CA2: ['Adapter ses déplacements à des environnements variés', [
          'Réussir un déplacement planifié dans un milieu naturel aménagé ou artificiellement recréé plus ou moins connu.',
          'Gérer ses ressources pour réaliser en totalité un parcours sécurisé.',
          'Assurer la sécurité de son camarade.',
          'Respecter et faire respecter les règles de sécurité.',
        ]],
        CA3: ['S’exprimer devant les autres par une prestation artistique et/ou acrobatique', [
          'Mobiliser les capacités expressives du corps pour imaginer, composer et interpréter une séquence artistique ou acrobatique.',
          'Participer activement, au sein d’un groupe, à l’élaboration et à la formalisation d’un projet artistique.',
          'Apprécier des prestations en utilisant différents supports d’observation et d’analyse.',
        ]],
        CA4: ['Conduire et maîtriser un affrontement collectif ou interindividuel', [
          'Réaliser des actions décisives en situation favorable afin de faire basculer le rapport de force en sa faveur ou en faveur de son équipe.',
          'Adapter son engagement moteur en fonction de son état physique et du rapport de force.',
          'Être solidaire de ses partenaires et respectueux de son (ses) adversaire(s) et de l’arbitre.',
          'Observer et co-arbitrer.',
          'Accepter le résultat de la rencontre et savoir l’analyser avec objectivité.',
        ]],
      },
    },
    lycee: {
      nom: 'Lycée GT (2nde, 1re, Tle)', code: 'AFL',
      champs: {
        CA1: ['Réaliser une performance motrice maximale mesurable à une échéance donnée', [
          'S’engager pour produire une performance maximale à l’aide de techniques efficaces, en gérant les efforts musculaires et respiratoires nécessaires et en faisant le meilleur compromis entre l’accroissement de vitesse d’exécution et de précision.',
          'S’entraîner, individuellement et collectivement, pour réaliser une performance.',
          'Choisir et assumer les rôles qui permettent un fonctionnement collectif solidaire.',
        ]],
        CA2: ['Adapter son déplacement à des environnements variés et/ou incertains', [
          'S’engager à l’aide d’une motricité spécifique pour réaliser en sécurité et à son meilleur niveau, un itinéraire dans un contexte incertain.',
          'S’entraîner individuellement et collectivement, pour se déplacer de manière efficiente et en toute sécurité.',
          'Coopérer pour réaliser un projet de déplacement, en toute sécurité.',
        ]],
        CA3: ['Réaliser une prestation corporelle destinée à être vue et appréciée', [
          ['AFL1', 'Acrobatique / esthétique : s’engager pour composer et réaliser un enchaînement à visée esthétique ou acrobatique destiné à être jugé, en combinant des formes corporelles codifiées.'],
          ['AFL1', 'Artistique : s’engager pour composer et interpréter une chorégraphie collective, selon un projet artistique en mobilisant une motricité expressive et des procédés de composition.'],
          ['AFL2', 'Se préparer et s’engager, individuellement et collectivement, pour s’exprimer devant un public et susciter des émotions.'],
          ['AFL3', 'Choisir et assumer des rôles au service de la prestation collective.'],
        ]],
        CA4: ['Conduire et maîtriser un affrontement collectif ou interindividuel pour gagner', [
          'S’engager pour gagner une rencontre en faisant des choix techniques et tactiques pertinents au regard de l’analyse du rapport de force.',
          'Se préparer et s’entraîner, individuellement ou collectivement, pour conduire et maîtriser un affrontement collectif ou interindividuel.',
          'Choisir et assumer les rôles qui permettent un fonctionnement collectif solidaire.',
        ]],
        CA5: ['Réaliser et orienter son activité physique pour développer ses ressources et s’entretenir', [
          'S’engager pour obtenir les effets recherchés selon son projet personnel, en faisant des choix de paramètres d’entraînement cohérents avec le thème retenu.',
          'S’entraîner, individuellement ou collectivement, pour développer ses ressources et s’entretenir en fonction des effets recherchés.',
          'Coopérer pour faire progresser.',
        ]],
      },
    },
  };

  // Mise en forme : chaque attendu reçoit un identifiant stable (ex. « cycle4.CA1.2 ») et un code (AFC2, AFL1…).
  const refs = {};
  const parId = {};
  for (const [refId, r] of Object.entries(brut)) {
    refs[refId] = { id: refId, nom: r.nom, champs: {} };
    for (const [ca, [titre, liste]] of Object.entries(r.champs)) {
      const attendus = liste.map((a, i) => {
        const [code, texte] = Array.isArray(a) ? a : [r.code + (i + 1), a];
        const attendu = { id: `${refId}.${ca}.${i + 1}`, code, texte, ca, refId };
        parId[attendu.id] = attendu;
        return attendu;
      });
      refs[refId].champs[ca] = { titre, attendus };
    }
  }
  return { refs, attendu: id => parId[id] || null };
})();

const REFERENTIEL_PAR_NIVEAU = {
  '6e': 'cycle3', '5e': 'cycle4', '4e': 'cycle4', '3e': 'cycle4', '2nde': 'lycee', '1re': 'lycee', 'Tle': 'lycee',
};

// Champ d'apprentissage habituel de chaque APSA (modifiable dans la fiche de l'évaluation).
const CA_PAR_APSA = {
  CA1: ['Demi-fond', 'Course de vitesse', 'Course de haies', 'Relais', 'Saut en longueur', 'Saut en hauteur', 'Triple saut',
    'Lancer de poids', 'Lancer de javelot', 'Lancer de disque', 'Multibonds', 'Natation', 'Natation vitesse', 'Pentabond'],
  CA2: ['Course d’orientation', 'Escalade', 'Sauvetage', 'Sauvetage aquatique', 'VTT', 'Savoir-nager'],
  CA3: ['Gymnastique', 'Acrosport', 'Arts du cirque', 'Danse', 'Step chorégraphié'],
  CA4: ['Badminton', 'Tennis de table', 'Tennis', 'Volley-ball', 'Basket-ball', 'Handball', 'Football', 'Rugby', 'Ultimate',
    'Futsal', 'Lutte', 'Judo', 'Boxe française', 'Kin-ball', 'Tchoukball'],
  CA5: ['Musculation', 'Step', 'Course en durée', 'Natation en durée', 'Yoga', 'Relaxation', 'Cross-training'],
};

function caDeApsa(apsa, refId) {
  const cherche = (apsa || '').trim().toLocaleLowerCase('fr');
  for (const [ca, liste] of Object.entries(CA_PAR_APSA)) {
    if (liste.some(a => a.toLocaleLowerCase('fr') === cherche)) {
      // Au collège il n'y a pas de CA5 : la course en durée relève du CA1.
      if (REFERENTIEL.refs[refId]?.champs[ca]) return ca;
      return ca === 'CA5' && REFERENTIEL.refs[refId]?.champs.CA1 ? 'CA1' : '';
    }
  }
  return '';
}
