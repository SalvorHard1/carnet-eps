'use strict';
// Référentiels institutionnels EPS : attendus de fin de cycle (collège) et de fin de lycée (voie GT).
// Sources : programmes cycles 3 et 4 (BO spécial n°11 du 26/11/2015, mémos académiques),
// programme d'EPS du lycée GT (BO spécial n°1 du 22/01/2019) et référentiels du bac GT.
// Un attendu est soit un texte (code AFC/AFL numéroté dans l'ordre), soit [code, texte].
const REFERENTIEL = (() => {
  // SVT : chaque élément d'une compétence reçoit un code « C1.2 » (compétence 1, élément 2).
  const num = (k, liste) => liste.map((t, i) => [`${k}.${i + 1}`, t]);
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

    // ---------- SVT ----------
    // « Compétences travaillées » des programmes officiels. Une évaluation peut en cocher dans plusieurs compétences
    // à la fois (toutes : true) : les éléments sont proposés tous ensemble, rangés par compétence.
    // Sources : programme de SVT de seconde GT et de première générale (BO spécial n°1 du 22/01/2019) ;
    // programme du cycle 4 (BO spécial n°11 du 26/11/2015).
    svtSeconde: {
      nom: 'SVT — seconde', code: '', toutes: true,
      champs: {
        C1: ['Pratiquer des démarches scientifiques', num('C1', [
          'Formuler et résoudre une question ou un problème scientifique.',
          'Concevoir et mettre en œuvre des stratégies de résolution.',
          'Observer, questionner, formuler une hypothèse, en déduire ses conséquences testables ou vérifiables, expérimenter, raisonner avec rigueur, modéliser. Justifier et expliquer une théorie, un raisonnement, une démonstration.',
          'Interpréter des résultats et en tirer des conclusions.',
          'Comprendre le lien entre les phénomènes naturels et le langage mathématique.',
          'Comprendre qu’un effet peut avoir plusieurs causes.',
          'Savoir distinguer, dans la complexité apparente des phénomènes observables, des éléments et des principes fondamentaux.',
          'Savoir distinguer ce qui relève d’une croyance ou d’une opinion et ce qui constitue un savoir scientifique.',
        ])],
        C2: ['Concevoir, créer, réaliser', num('C2', [
          'Identifier et choisir des notions, des outils et des techniques, ou des modèles simples pour mettre en œuvre une démarche scientifique.',
          'Concevoir et mettre en œuvre un protocole.',
        ])],
        C3: ['Utiliser des outils et mobiliser des méthodes pour apprendre', num('C3', [
          'Apprendre à organiser son travail.',
          'Identifier et choisir les outils et les techniques pour garder trace de ses recherches (à l’oral et à l’écrit).',
          'Recenser, extraire, organiser et exploiter des informations à partir de documents en citant ses sources, à des fins de connaissance et pas seulement d’information.',
          'Coopérer et collaborer dans une démarche de projet.',
        ])],
        C4: ['Communiquer et utiliser le numérique', num('C4', [
          'Communiquer sur ses démarches, ses résultats et ses choix, en argumentant.',
          'Communiquer dans un langage scientifiquement approprié : oral, écrit, graphique, numérique.',
          'Utiliser des outils numériques.',
          'Conduire une recherche d’informations sur internet en lien avec une question ou un problème scientifique, en choisissant des mots-clés pertinents, et en évaluant la fiabilité des sources et la validité des résultats.',
          'Utiliser des logiciels d’acquisition, de simulation et de traitement de données.',
        ])],
        C5: ['Adopter un comportement éthique et responsable', num('C5', [
          'Identifier l’incidence (bénéfices et nuisances) des activités humaines sur l’environnement à différentes échelles.',
          'Fonder ses choix de comportement responsable vis-à-vis de sa santé ou de l’environnement en prenant en compte des arguments scientifiques.',
          'Comprendre les responsabilités individuelle et collective en matière de préservation des ressources de la planète (biodiversité, ressources minérales et ressources énergétiques) et de santé.',
          'Participer à l’élaboration de règles de sécurité et les appliquer au laboratoire et sur le terrain.',
        ])],
      },
    },
    svtLycee: {
      nom: 'SVT — spécialité (1re, Tle)', code: '', toutes: true,
      champs: {
        C1: ['Pratiquer des démarches scientifiques', num('C1', [
          'Formuler et résoudre une question ou un problème scientifique.',
          'Concevoir et mettre en œuvre des stratégies de résolution.',
          'Observer, questionner, formuler une hypothèse, en déduire ses conséquences testables ou vérifiables, expérimenter, raisonner avec rigueur, modéliser, argumenter.',
          'Interpréter des résultats et en tirer des conclusions.',
          'Comprendre le lien entre les phénomènes naturels et le langage mathématique.',
          'Comprendre qu’un effet peut avoir plusieurs causes.',
          'Disséquer la complexité apparente des phénomènes observables en éléments et principes fondamentaux.',
          'Distinguer ce qui relève d’une croyance ou d’une opinion et ce qui constitue un savoir scientifique.',
        ])],
        C2: ['Concevoir, créer, réaliser', num('C2', [
          'Identifier et choisir des notions, des outils et des techniques, ou des modèles simples pour mettre en œuvre une démarche scientifique.',
          'Concevoir et mettre en œuvre un protocole.',
        ])],
        C3: ['Utiliser des outils et mobiliser des méthodes pour apprendre', num('C3', [
          'Apprendre à organiser son travail.',
          'Identifier et choisir les outils et les techniques pour garder trace de ses recherches (à l’oral et à l’écrit).',
          'Recenser, extraire, organiser et exploiter des informations à partir de documents en citant ses sources, à des fins de connaissance et pas seulement d’information.',
          'Coopérer et collaborer dans le cadre de démarches de projet.',
        ])],
        C4: ['Pratiquer des langages', num('C4', [
          'Communiquer sur ses démarches, ses résultats et ses choix, en argumentant.',
          'Communiquer dans un langage scientifiquement approprié : oral, écrit, graphique, numérique.',
          'Utiliser des outils numériques.',
          'Conduire une recherche d’informations sur internet en lien avec une question ou un problème scientifique, en choisissant des mots-clés pertinents, et en évaluant la fiabilité des sources et la validité des résultats.',
          'Utiliser des logiciels d’acquisition, de simulation et de traitement de données.',
        ])],
        C5: ['Adopter un comportement éthique et responsable', num('C5', [
          'Identifier les impacts (bénéfices et nuisances) des activités humaines sur l’environnement à différentes échelles.',
          'Fonder ses choix de comportement responsable vis-à-vis de sa santé ou de l’environnement en prenant en compte des arguments scientifiques.',
          'Comprendre les responsabilités individuelle et collective en matière de préservation des ressources de la planète (biodiversité, ressources minérales et ressources énergétiques) et de santé.',
          'Participer à l’élaboration de règles de sécurité et les appliquer au laboratoire et sur le terrain.',
        ])],
      },
    },
    // Enseignement scientifique (tronc commun de 1re et Tle) : le programme fixe trois « objectifs généraux de formation »
    // rédigés en texte suivi (BO n°25 du 22 juin 2023 pour la 1re). Intitulés A, B, C repris mot pour mot ; chacun est
    // découpé en éléments évaluables, formulés au plus près du texte officiel (B : les pratiques scientifiques qu'il cite).
    ensSci: {
      nom: 'Enseignement scientifique (1re, Tle)', code: '', toutes: true,
      champs: {
        A: ['Comprendre la nature du savoir scientifique et ses méthodes d’élaboration', num('A', [
          'Distinguer le savoir scientifique, issu d’une construction rationnelle, d’une croyance ou d’une opinion.',
          'S’appuyer sur la description et l’analyse de faits, extraits de la réalité ou produits au cours d’expériences, pour expliquer la réalité par des causes matérielles.',
          'Énoncer des hypothèses et en tirer des conséquences selon un processus logique.',
          'Comprendre que le savoir scientifique résulte d’une construction collective, faite d’échanges d’arguments et de controverses, qui se précise avec des faits nouveaux.',
        ])],
        B: ['Identifier et mettre en œuvre des pratiques scientifiques', num('B', [
          'Observer, décrire, mesurer, quantifier.',
          'Calculer, analyser.',
          'Imaginer, proposer, tester.',
          'Modéliser, simuler.',
          'Raisonner, expliquer.',
          'Créer des scénarios pour envisager des futurs possibles ou remonter dans le passé.',
          'Argumenter à l’oral : préciser sa pensée et expliciter son raisonnement de manière à convaincre.',
          'Expliciter la pratique scientifique mise en œuvre et prendre conscience de sa nature.',
        ])],
        C: ['Identifier et comprendre les effets de la science sur les sociétés et sur l’environnement', num('C', [
          'Identifier les effets de la science et de ses applications technologiques sur les sociétés (alimentation, santé, communications, intelligence artificielle, maîtrise des risques…).',
          'Distinguer l’approche scientifique d’autres approches (économiques, éthiques…) dans une prise de décision.',
          'Comprendre les effets des activités humaines sur l’environnement et les moyens mis en œuvre pour en limiter les conséquences.',
        ])],
      },
    },
    svtCycle4: {
      nom: 'SVT — collège, cycle 4 (5e, 4e, 3e)', code: '', toutes: true,
      champs: {
        C1: ['Pratiquer des démarches scientifiques', num('C1', [
          'Formuler une question ou un problème scientifique.',
          'Proposer une ou des hypothèses pour résoudre un problème ou une question. Concevoir des expériences pour la ou les tester.',
          'Utiliser des instruments d’observation, de mesures et des techniques de préparation et de collecte.',
          'Interpréter des résultats et en tirer des conclusions.',
          'Communiquer sur ses démarches, ses résultats et ses choix, en argumentant.',
          'Identifier et choisir des notions, des outils et des techniques, ou des modèles simples pour mettre en œuvre une démarche scientifique.',
        ])],
        C2: ['Concevoir, créer, réaliser', num('C2', ['Concevoir et mettre en œuvre un protocole expérimental.'])],
        C3: ['Utiliser des outils et mobiliser des méthodes pour apprendre', num('C3', [
          'Apprendre à organiser son travail (par ex. pour mettre en œuvre un protocole expérimental).',
          'Identifier et choisir les outils et les techniques pour garder trace de ses recherches (à l’oral et à l’écrit).',
        ])],
        C4: ['Pratiquer des langages', num('C4', [
          'Lire et exploiter des données présentées sous différentes formes : tableaux, graphiques, diagrammes, dessins, conclusions de recherches, cartes heuristiques, etc.',
          'Représenter des données sous différentes formes, passer d’une représentation à une autre et choisir celle qui est adaptée à la situation de travail.',
        ])],
        C5: ['Utiliser des outils numériques', num('C5', [
          'Conduire une recherche d’informations sur internet pour répondre à une question ou un problème scientifique, en choisissant des mots-clés pertinents, et en évaluant la fiabilité des sources et la validité des résultats.',
          'Utiliser des logiciels d’acquisition de données, de simulation et des bases de données.',
        ])],
        C6: ['Adopter un comportement éthique et responsable', num('C6', [
          'Identifier les impacts (bénéfices et nuisances) des activités humaines sur l’environnement à différentes échelles.',
          'Fonder ses choix de comportement responsable vis-à-vis de sa santé ou de l’environnement sur des arguments scientifiques.',
          'Comprendre les responsabilités individuelle et collective en matière de préservation des ressources de la planète (biodiversité, ressources minérales et ressources énergétiques) et de santé.',
          'Participer à l’élaboration de règles de sécurité et les appliquer au laboratoire et sur le terrain.',
          'Distinguer ce qui relève d’une croyance ou d’une idée et ce qui constitue un savoir scientifique.',
        ])],
        C7: ['Se situer dans l’espace et dans le temps', num('C7', [
          'Situer l’espèce humaine dans l’évolution des espèces.',
          'Appréhender différentes échelles de temps géologique et biologique (ex : histoire de la Terre ; apparition de la vie, évolution et extinction des espèces vivantes…).',
          'Appréhender différentes échelles spatiales d’un même phénomène / d’une même fonction (ex : nutrition : niveau de l’organisme, niveau des organes et niveau cellulaire).',
          'Identifier par l’histoire des sciences et des techniques comment se construit un savoir scientifique.',
        ])],
      },
      // Domaines du socle de chaque groupe de compétences (tableau du programme, BO).
      socle: { C1: ['D4', 'D2', 'D1'], C2: ['D4'], C3: ['D2'], C4: ['D1', 'D4'], C5: ['D2'], C6: ['D3', 'D4', 'D5'], C7: ['D5', 'D4'] },
    },
    // Sciences et technologie, 6e (cycle 3) : programme du BO n° 25 du 22 juin 2023, compétences travaillées.
    sciTechCycle3: {
      nom: 'Sciences et technologie — 6e (cycle 3)', code: '', toutes: true,
      champs: {
        C1: ['Pratiquer des démarches scientifiques et technologiques', num('C1', [
          'Formuler une question ou un problème scientifique ou technologique.',
          'Formuler des hypothèses fondées et qui peuvent être éprouvées.',
          'Concevoir et mettre en œuvre des expériences ou d’autres stratégies de résolution pour tester ces hypothèses.',
          'Proposer et/ou suivre un protocole expérimental.',
          'Participer à l’élaboration et à la conduite d’un projet.',
          'Utiliser des instruments d’observation, de mesure, des techniques de préparation, de collecte.',
          'Exploiter des documents de natures variées et évaluer leur fiabilité.',
          'Modéliser des phénomènes naturels.',
          'Étudier les phénomènes naturels en mobilisant des grandeurs physiques et en réalisant des calculs.',
          'Interpréter des résultats de façon raisonnée et en tirer des conclusions en mobilisant des arguments scientifiques.',
          'Communiquer sur les démarches, les résultats et les choix en argumentant.',
        ])],
        C2: ['Concevoir, créer, réaliser', num('C2', [
          'Imaginer un objet technique en réponse à un besoin.',
          'Associer des solutions technologiques à des fonctions techniques.',
          'Concevoir et réaliser une maquette pour modéliser un phénomène naturel ou un objet technique.',
        ])],
        C3: ['Pratiquer des langages', num('C3', [
          'Rendre compte de ses activités en utilisant un vocabulaire précis et des formes langagières spécifiques des sciences et des techniques.',
          'Exploiter un document constitué de divers supports (texte, schéma, graphique, tableau, algorithme simple, carte heuristique).',
          'Utiliser différents modes de représentation (schéma, dessin, croquis, tableau, graphique, texte, etc.) et passer d’une représentation à une autre.',
          'Expliquer un phénomène à l’oral et à l’écrit.',
        ])],
        C4: ['Mobiliser des outils numériques', num('C4', [
          'Utiliser des outils numériques pour : communiquer des résultats ; faire des recherches ; traiter des données ; simuler des phénomènes.',
          'Appliquer les principes de l’algorithmique et de la programmation par blocs pour écrire ou comprendre un code simple.',
          'Modifier ou paramétrer le fonctionnement d’un objet communicant.',
        ])],
        C5: ['Adopter un comportement éthique et responsable', num('C5', [
          'Relier des connaissances acquises en sciences et technologie à des questions de santé, de sécurité et d’environnement.',
          'Comprendre et expliquer des décisions collectives et responsables.',
        ])],
        C6: ['Se situer dans l’espace et dans le temps', num('C6', [
          'Maîtriser les notions d’échelles spatiale et temporelle et en citer quelques ordres de grandeur caractéristiques.',
          'Identifier comment se construit un savoir scientifique en lien avec un contexte historique, géographique, économique et culturel.',
        ])],
        C7: ['Faire preuve d’esprit critique', num('C7', [
          'Identifier des sources d’informations fiables.',
          'Vérifier l’existence de preuves et en évaluer la qualité.',
          'Évaluer la pertinence des arguments et/ou identifier des arguments fallacieux.',
          'Distinguer ce qui relève d’une croyance de ce qui constitue un savoir scientifique.',
        ])],
      },
      socle: { C1: ['D2', 'D4'], C2: ['D4'], C3: ['D1'], C4: ['D2'], C5: ['D3', 'D5'], C6: ['D5'], C7: ['D2', 'D4'] },
    },
  };

  // Mise en forme : chaque attendu reçoit un identifiant stable (ex. « cycle4.CA1.2 ») et un code (AFC2, AFL1…).
  // Les réglages du prof (voir reglages.js) s'ajoutent par-dessus : référentiels personnels, compétences ajoutées,
  // attendus ou référentiels masqués (plus proposés pour les nouvelles évaluations, mais toujours lisibles).
  const refs = {};
  const parId = {};
  function construire(perso = {}) {
    for (const k of Object.keys(refs)) delete refs[k];
    for (const k of Object.keys(parId)) delete parId[k];
    const sources = { ...brut };
    for (const r of perso.refsPerso || []) {
      sources[r.id] = { nom: r.nom, code: '', perso: true, champs: Object.fromEntries(Object.entries(r.champs || {}).map(([ca, titre]) => [ca, [titre, []]])) };
    }
    const refsMasques = new Set(perso.refsMasques || []);
    for (const [refId, r] of Object.entries(sources)) {
      refs[refId] = { id: refId, nom: r.nom, perso: !!r.perso, toutes: !!r.toutes, masque: refsMasques.has(refId), champs: {}, ...(r.socle ? { socle: r.socle } : {}) };
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
    // Compétences ajoutées : toujours retrouvables par leur identifiant (même si leur référentiel a disparu).
    for (const a of perso.ajouts || []) {
      const attendu = { id: a.id, code: a.code, texte: a.texte, ca: a.ca, refId: a.refId, perso: true };
      parId[a.id] = attendu;
      refs[a.refId]?.champs[a.ca]?.attendus.push(attendu);
    }
    const masques = new Set(perso.masques || []);
    for (const a of Object.values(parId)) a.masque = masques.has(a.id);
  }
  construire();
  return { refs, attendu: id => parId[id] || null, personnaliser: construire };
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
