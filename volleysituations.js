'use strict';
// Outil « 🏐 Volley-ball », suite de volley.js : situations proposées d'après les résultats. Rien d'« intelligent » :
// des règles simples sur les statistiques de l'appli et une banque de fiches, que l'enseignant corrige (✎ Modifier).
// Niveau d'un geste (à partir de 5 essais) : 1 = moins de 40 %, 2 = de 40 à 70 %, 3 = 70 % et plus.
// Deux façons de travailler : plusieurs ateliers selon les besoins, ou un seul atelier pour toute la classe sur le point
// le plus fragile (jeu, situation, retour au jeu ; même situation en 3 versions selon les groupes).
// Élève : son geste le plus fragile et « son défi ».
// En mode élève et à l'écran projeté, ni niveaux ni pourcentages : seulement la situation et les noms.

// Fiches rédigées pour l'appli ; `source` = le document académique dont l'idée est reprise et adaptée.
// Schéma : terrain vu de dessus, x de 20 à 180 (9 m), y de 20 à 340 (18 m), filet à y = 180.
// j : joueurs [x, y, lettre, principal ?] ; b : trajets du ballon ; d : déplacements du joueur ; c : cibles [x, y, l, h, texte].
// SITUATIONS_VOLLEY[geste][niveau - 1] = les 3 fiches de ce niveau.
const SITUATIONS_VOLLEY = {
  service: [[
    { id: 'service-1', titre: 'Service à mi-terrain', dispositif: 'Par 2, de chaque côté du filet. Le serveur se place à 3 m du filet.',
      but: 'Servir à la cuillère, le ballon passe le filet et retombe dans le terrain. Le partenaire l’attrape et sert à son tour.',
      reussite: '7 services sur 10 dans le terrain.', facile: 'Se rapprocher du filet, ballon plus léger.', dur: 'Reculer d’un grand pas à chaque série réussie.',
      legende: { S: 'Serveur', P: 'Partenaire' },
      schema: { j: [[100, 230, 'S', true], [100, 90, 'P']], b: [[100, 218, 100, 104]] } },
    { id: 'service-1b', titre: 'Mon record sur 5 services', source: 'Lyon', dispositif: 'Par 3 : un serveur, deux récupérateurs en face. Après 5 essais, on tourne.',
      but: 'Compter ses services réussis sur 5 essais, puis essayer de battre son record.',
      reussite: 'Battre son record, ou 4 services sur 5.', facile: 'Lancer le ballon à deux mains par-dessus le filet.', dur: 'Reculer d’un pas pour le record suivant.',
      legende: { S: 'Serveur', R: 'Récupérateurs' },
      schema: { j: [[100, 250, 'S', true], [65, 90, 'R'], [135, 90, 'R']], b: [[100, 238, 72, 104]] } },
    { id: 'service-1c', titre: 'Je sers d’où j’ai attrapé', source: 'Alpes-Maritimes', dispositif: 'À 1 contre 1, un ballon pour deux, sur un petit terrain.',
      but: 'Attraper le service du partenaire avant qu’il touche le sol, puis servir à son tour depuis cet endroit.',
      reussite: '7 services sur 10 qui passent le filet et restent dans le terrain.', facile: 'Rester dans la moitié de terrain proche du filet.', dur: 'Varier : un service court, un service long.',
      legende: { S: 'Serveur', A: 'Partenaire' },
      schema: { j: [[75, 250, 'S', true], [125, 100, 'A']], b: [[80, 237, 120, 113]], d: [[140, 112, 140, 150]] } },
  ], [
    { id: 'service-2', titre: 'Je recule à chaque réussite', dispositif: 'Par 2, de chaque côté du filet. Des plots tous les 2 m, jusqu’à la ligne de fond.',
      but: 'Service réussi : reculer d’un plot. Service raté : rester au même plot. Atteindre la ligne de fond.',
      reussite: '6 services sur 10 depuis la ligne de fond.', facile: 'Partir du plot le plus près du filet, service à la cuillère.', dur: 'Service par-dessus l’épaule.',
      legende: { S: 'Serveur', P: 'Partenaire' },
      schema: { j: [[100, 325, 'S', true], [100, 90, 'P']], b: [[100, 313, 100, 104]], d: [[135, 225, 135, 300]], c: [[128, 222, 14, 8, ''], [128, 262, 14, 8, ''], [128, 302, 14, 8, '']] } },
    { id: 'service-2b', titre: 'Ligne à 1, 2 ou 3 points', source: 'Lyon', dispositif: 'Par équipes. Trois lignes de service : plus on sert de loin, plus le service rapporte.',
      but: 'Choisir sa ligne avant chaque service. Sur 5 essais, compter ses points et chercher à battre son record.',
      reussite: '8 points sur 5 services, ou battre son record.', facile: 'Rapprocher les lignes.', dur: 'Le service doit aussi tomber dans la moitié arrière.',
      legende: { S: 'Serveur' },
      schema: { j: [[100, 300, 'S', true]], b: [[100, 288, 100, 70]], c: [[35, 200, 130, 8, ''], [35, 245, 130, 8, ''], [35, 322, 130, 8, '']] } },
    { id: 'service-2c', titre: 'Sur le tapis', source: 'Lyon', dispositif: 'Par 3 : un serveur, un compteur, un récupérateur. Un tapis posé dans le terrain d’en face.',
      but: 'Servir sur le tapis : 2 points. Devant le tapis : 1 point.',
      reussite: '6 points sur 5 services.', facile: 'Tapis plus proche ou deux tapis.', dur: 'Reculer le tapis, ou servir de plus loin.',
      legende: { S: 'Serveur', R: 'Récupérateur' },
      schema: { j: [[100, 300, 'S', true], [150, 45, 'R']], b: [[100, 288, 100, 85]], c: [[70, 45, 60, 40, 'tapis']] } },
  ], [
    { id: 'service-3', titre: 'Service en zone annoncée', dispositif: 'Par 2 ou 3. Le terrain d’en face est partagé en zones par des plots.',
      but: 'Annoncer la zone avant de servir, puis l’atteindre depuis la ligne de fond.',
      reussite: '5 services sur 10 dans la zone annoncée.', facile: 'Deux zones seulement : devant ou au fond.', dur: 'Zones plus petites, ou viser le joueur le moins bien placé.',
      legende: { S: 'Serveur' },
      schema: { j: [[100, 325, 'S', true]], b: [[100, 313, 55, 70]], c: [[25, 30, 70, 70, 'zone 1'], [105, 30, 70, 70, 'zone 2'], [25, 108, 70, 66, 'zone 3'], [105, 108, 70, 66, 'zone 4']] } },
    { id: 'service-3b', titre: 'Court ou long', source: 'Alpes-Maritimes', dispositif: 'Par 2, de chaque côté du filet. Une zone près du filet, une zone au fond.',
      but: 'Alterner un service court juste derrière le filet et un service long vers le fond.',
      reussite: '6 services sur 10 dans la zone visée.', facile: 'Annoncer sa zone et agrandir les zones.', dur: 'Le partenaire doit attraper le ballon : le service réussi est celui qu’il n’attrape pas.',
      legende: { S: 'Serveur', P: 'Partenaire' },
      schema: { j: [[100, 325, 'S', true], [150, 100, 'P']], b: [[95, 313, 60, 150], [108, 313, 100, 50]], c: [[25, 130, 150, 44, 'court'], [25, 25, 150, 44, 'long']] } },
    { id: 'service-3c', titre: 'Le service qui met en danger', source: 'Lyon', dispositif: 'Par 3 : un serveur, un réceptionneur, un passeur qui attrape la réception.',
      but: 'Servir pour que la réception ne soit pas jouable : le passeur ne peut pas attraper le ballon sans courir.',
      reussite: '4 services sur 10 mettent la réception en difficulté, sans service raté de plus.', facile: 'Viser seulement l’espace libre.', dur: 'Deux réceptionneurs : viser entre les deux.',
      legende: { S: 'Serveur', R: 'Réceptionneur', P: 'Passeur' },
      schema: { j: [[100, 325, 'S', true], [75, 85, 'R'], [125, 160, 'P']], b: [[95, 311, 45, 60]], d: [[66, 74, 50, 62]] } },
  ]],
  reception: [[
    { id: 'reception-1', titre: 'Le ballon dans la cible', dispositif: 'Par 3 : un lanceur, un réceptionneur, un ramasseur. Rotation tous les 8 ballons.',
      but: 'Renvoyer en manchette le ballon lancé à la main, vers la cible près du filet.',
      reussite: '5 ballons sur 8 dans la cible.', facile: 'Lancer plus court, cible plus grande.', dur: 'Service à la main, cible plus petite.',
      legende: { L: 'Lanceur', R: 'Réceptionneur' },
      schema: { j: [[100, 90, 'L'], [100, 285, 'R', true]], b: [[100, 104, 94, 272], [108, 274, 145, 222]], c: [[118, 188, 54, 34, 'cible']] } },
    { id: 'reception-1b', titre: 'Le pêcheur', source: 'Alpes-Maritimes', dispositif: 'Par 4 : trois lanceurs à tour de rôle, un pêcheur avec un cerceau. On change de pêcheur toutes les 2 minutes.',
      but: 'Se déplacer pour attraper le ballon à deux mains, puis pour le faire entrer dans son cerceau, avant qu’il touche le sol.',
      reussite: '6 ballons sur 10 attrapés.', facile: 'Sans cerceau, lancers plus hauts et plus lents.', dur: 'Le lanceur vise les côtés, le fond ou juste derrière le filet.',
      legende: { L: 'Lanceurs', P: 'Pêcheur' },
      schema: { j: [[50, 100, 'L'], [100, 100, 'L'], [150, 100, 'L'], [100, 270, 'P', true]], b: [[100, 114, 75, 240]], d: [[90, 262, 72, 248]] } },
    { id: 'reception-1c', titre: 'Le triangle de relanceurs', source: 'Alpes-Maritimes', dispositif: 'Par 4 : un lanceur entre deux marques, trois receveurs en triangle. Rotation toutes les 2 minutes.',
      but: 'Attraper le ballon puis le relancer aussitôt (1 seconde au plus) vers l’une des deux marques.',
      reussite: '6 relances sur 10 sur une marque.', facile: 'Le lanceur vise les receveurs à tour de rôle.', dur: 'Le lanceur vise les espaces libres.',
      legende: { L: 'Lanceur', R: 'Receveurs' },
      schema: { j: [[100, 90, 'L'], [55, 255, 'R', true], [145, 255, 'R', true], [100, 305, 'R', true]], b: [[96, 104, 60, 240], [58, 241, 60, 95]], c: [[35, 75, 30, 26, 'm1'], [135, 75, 30, 26, 'm2']] } },
  ], [
    { id: 'reception-2', titre: 'Je me déplace avant de frapper', dispositif: 'Par 3. Le réceptionneur part d’un plot. Le lanceur envoie à gauche, à droite ou devant.',
      but: 'Se déplacer pour être derrière le ballon, le renvoyer vers la cible, puis revenir au plot.',
      reussite: '5 ballons sur 8 jouables dans la cible.', facile: 'Annoncer le côté avant de lancer.', dur: 'Lancer plus tendu, ou servir depuis le milieu du terrain.',
      legende: { L: 'Lanceur', R: 'Réceptionneur' },
      schema: { j: [[100, 90, 'L'], [100, 290, 'R', true]], b: [[100, 104, 50, 265], [55, 255, 135, 222]], d: [[90, 285, 58, 268]], c: [[118, 188, 54, 34, 'cible']] } },
    { id: 'reception-2b', titre: '« J’ai ! » dans l’espace libre', source: 'Alpes-Maritimes', dispositif: 'Par 4 : un lanceur, trois receveurs. Rotation toutes les 2 minutes.',
      but: 'Le lanceur vise un espace libre. Le plus proche crie « j’ai ! », se déplace et renvoie vers une marque.',
      reussite: '6 ballons sur 10 relevés sans qu’ils tombent au sol.', facile: 'Attraper le ballon 1 seconde avant de le relancer.', dur: 'Lancer à une main, plus tendu, renvoi sans blocage.',
      legende: { L: 'Lanceur', R: 'Receveurs' },
      schema: { j: [[100, 90, 'L'], [55, 300, 'R', true], [145, 300, 'R', true], [100, 235, 'R', true]], b: [[105, 104, 135, 262]], d: [[140, 287, 136, 270]], c: [[112, 250, 42, 26, 'espace']] } },
    { id: 'reception-2c', titre: 'Haut et devant le passeur', source: 'Martinique', dispositif: 'Par 3 : un lanceur, un réceptionneur, un passeur au filet qui attrape.',
      but: 'Envoyer une réception haute qui retombe devant le passeur. Lui doit pouvoir l’attraper sans courir.',
      reussite: '5 réceptions sur 8 attrapées par le passeur au-dessus du front.', facile: 'Attraper puis lancer à deux mains vers le passeur.', dur: 'Changer de place à chaque ballon.',
      legende: { L: 'Lanceur', R: 'Réceptionneur', P: 'Passeur' },
      schema: { j: [[100, 90, 'L'], [75, 290, 'R', true], [125, 200, 'P']], b: [[95, 104, 78, 275], [82, 276, 120, 216]] } },
  ], [
    { id: 'reception-3', titre: 'Recevoir un vrai service', dispositif: 'Par 3 : un serveur, un réceptionneur, un passeur près du filet.',
      but: 'Recevoir le service et l’envoyer au passeur, qui doit pouvoir l’attraper sans courir.',
      reussite: '6 réceptions sur 10 attrapées par le passeur.', facile: 'Le serveur se rapproche.', dur: 'Le passeur enchaîne une passe haute, ou deux réceptionneurs se partagent le terrain.',
      legende: { S: 'Serveur', R: 'Réceptionneur', P: 'Passeur' },
      schema: { j: [[100, 32, 'S'], [80, 290, 'R', true], [130, 200, 'P']], b: [[100, 46, 82, 276], [88, 278, 124, 212]] } },
    { id: 'reception-3b', titre: 'Celui qui ne reçoit pas attaque', source: 'Martinique', dispositif: 'Par 3 : un serveur en face, deux joueurs côte à côte en réception.',
      but: 'L’un reçoit, l’autre monte au filet, fait la passe, et le réceptionneur finit l’action. Sur le ballon suivant, celui qui ne reçoit pas change.',
      reussite: '5 actions sur 10 terminées par un renvoi préparé.', facile: 'Service lancé.', dur: 'Service à la cuillère vers l’espace entre les deux.',
      legende: { S: 'Serveur', R: 'Réceptionneur', P: 'L’autre joueur' },
      schema: { j: [[100, 32, 'S'], [65, 290, 'R', true], [135, 290, 'P']], b: [[96, 46, 68, 276], [75, 278, 120, 212]], d: [[132, 276, 122, 218]] } },
    { id: 'reception-3c', titre: 'Relever les ballons accélérés', source: 'Lyon', dispositif: 'Par 3 : un attaquant sur une table ou près du filet, un défenseur, un ramasseur.',
      but: 'Le défenseur, jambes fléchies et bras prêts, relève un ballon frappé vers lui et le remonte vers le filet.',
      reussite: '5 ballons sur 10 remontés de façon jouable.', facile: 'Ballon lancé à deux mains, tendu.', dur: 'Frapper loin du défenseur, qui doit se déplacer.',
      legende: { A: 'Attaquant', D: 'Défenseur' },
      schema: { j: [[100, 150, 'A'], [100, 290, 'D', true]], b: [[100, 164, 100, 276], [108, 278, 130, 205]] } },
  ]],
  passe: [[
    { id: 'passe-1', titre: 'Lancer, passer, attraper', dispositif: 'Par 2, à 3 m l’un de l’autre. Le lanceur envoie un ballon haut.',
      but: 'Se placer sous le ballon et le renvoyer haut à deux mains, au-dessus du front.',
      reussite: '7 passes sur 10 attrapées sans faire plus d’un pas.', facile: 'Attraper le ballon au-dessus du front, puis le relancer aussitôt.', dur: 'S’éloigner à 4 m, ou enchaîner deux passes.',
      legende: { L: 'Lanceur', P: 'Passeur' },
      schema: { j: [[100, 225, 'L'], [100, 290, 'P', true]], b: [[92, 237, 92, 276], [108, 276, 108, 237]] } },
    { id: 'passe-1b', titre: 'La passe après un rebond', source: 'Lyon', dispositif: 'Par 2, de chaque côté du filet, sur les lignes des 3 m.',
      but: 'Attraper le ballon haut, le faire rebondir fort au sol, se placer sous le ballon et faire une passe haute au partenaire.',
      reussite: '10 échanges de suite.', facile: 'Rebond à deux mains, ballon attrapé avant la passe.', dur: 'Passer sans le rebond, ou avec un jonglage.',
      legende: { A: 'Joueur 1', B: 'Joueur 2' },
      schema: { j: [[100, 235, 'A', true], [100, 125, 'B', true]], b: [[92, 221, 92, 139], [108, 139, 108, 221]] } },
    { id: 'passe-1c', titre: 'Garder la balle en vie', source: 'Lyon', dispositif: 'Par 4 : deux joueurs qui se font des passes, deux contrôleurs qui comptent. Rotation après 3 essais.',
      but: 'Faire le plus de passes possible à deux sans que le ballon tombe.',
      reussite: 'Battre le record du binôme à chaque séance.', facile: 'Autoriser un rebond au sol ou un blocage.', dur: 'Échanger à 4, ou compter seulement les passes hautes.',
      legende: { A: 'Joueurs', C: 'Contrôleurs' },
      schema: { j: [[70, 260, 'A', true], [130, 260, 'A', true], [40, 310, 'C'], [160, 310, 'C']], b: [[84, 254, 116, 254], [116, 266, 84, 266]] } },
  ], [
    { id: 'passe-2', titre: 'Passe haute vers le filet', dispositif: 'Par 3 : un lanceur, un passeur près du filet, un receveur avec un cerceau à ses pieds.',
      but: 'Envoyer une passe plus haute que le filet, qui retombe dans le cerceau.',
      reussite: '6 passes sur 10 hautes et dans le cerceau.', facile: 'Cerceau plus proche, ou grande zone au sol.', dur: 'Passe après un déplacement.',
      legende: { L: 'Lanceur', P: 'Passeur', A: 'Receveur' },
      schema: { j: [[85, 285, 'L'], [110, 205, 'P', true], [40, 205, 'A']], b: [[88, 271, 106, 219], [96, 203, 58, 203]], c: [[30, 215, 28, 24, 'cerceau']] } },
    { id: 'passe-2b', titre: 'La traversée du terrain', source: 'Lyon', dispositif: 'Par 2, face à face, un ballon pour deux. On part d’un côté du terrain.',
      but: 'Traverser le terrain en largeur en se faisant des passes hautes, en pas chassés, sans perdre le ballon.',
      reussite: 'Traverser sans perte, puis battre le record de distance du groupe.', facile: 'Un ou deux arrêts permis, jonglages permis.', dur: 'Aller en passes courtes, retour en passes longues.',
      legende: { A: 'Joueur 1', B: 'Joueur 2' },
      schema: { j: [[40, 225, 'A', true], [40, 295, 'B', true]], b: [[46, 238, 75, 283], [83, 283, 110, 238]], d: [[56, 225, 155, 225], [56, 295, 155, 295]] } },
    { id: 'passe-2c', titre: 'Le zigzag', source: 'Lyon', dispositif: 'Par 4 sur un demi-terrain, chacun à son plot, du fond vers le filet. On change de place à chaque réussite.',
      but: 'Faire passer le ballon de J1 à J4 en passes hautes. J4 attrape et l’équipe annonce son score.',
      reussite: 'Le plus de réussites possible en 2 minutes.', facile: 'Jonglages permis, plots plus proches.', dur: 'J4 au fond du terrain, ou J3 frappe vers le terrain d’en face.',
      legende: { '1': 'J1', '2': 'J2', '3': 'J3', '4': 'J4' },
      schema: { j: [[55, 325, '1', true], [145, 280, '2', true], [55, 235, '3', true], [145, 200, '4', true]], b: [[67, 318, 132, 287], [132, 273, 68, 242], [67, 228, 132, 207]] } },
  ], [
    { id: 'passe-3', titre: 'Passe à gauche ou à droite', dispositif: 'Par 4 : un lanceur, un passeur au centre du filet, un receveur de chaque côté.',
      but: 'Au dernier moment, le lanceur annonce « gauche » ou « droite » : le passeur oriente sa passe de ce côté.',
      reussite: '6 passes sur 10 hautes et du bon côté.', facile: 'Annoncer avant le lancer.', dur: 'Le passeur choisit seul et le receveur attaque.',
      legende: { L: 'Lanceur', P: 'Passeur', A: 'Receveurs' },
      schema: { j: [[100, 290, 'L'], [100, 205, 'P', true], [35, 205, 'A'], [165, 205, 'A']], b: [[100, 276, 100, 219], [86, 203, 51, 203], [114, 203, 149, 203]] } },
    { id: 'passe-3b', titre: 'Le triangle : passe et cours', source: 'Lyon', dispositif: 'Par 6 : trois plots en triangle, deux joueurs en colonne à chaque plot, un ballon.',
      but: 'Passer et suivre son ballon. Puis passer d’un côté et courir de l’autre : orienter ses appuis et ses épaules vers le receveur.',
      reussite: '3 tours complets sans perdre le ballon.', facile: 'Passer et courir du même côté.', dur: 'Passer d’un côté et courir de l’autre, en manchette.',
      legende: { A: 'Plot 1', B: 'Plot 2', C: 'Plot 3' },
      schema: { j: [[100, 215, 'A', true], [40, 310, 'B', true], [160, 310, 'C', true]], b: [[92, 228, 48, 297], [54, 310, 146, 310], [152, 297, 108, 228]] } },
    { id: 'passe-3c', titre: 'Face à sa cible', source: 'Martinique', dispositif: 'Par 3 : un lanceur au fond, un passeur au filet, un attaquant.',
      but: 'S’orienter face à sa cible avant que le ballon arrive. Passer devant l’attaquant et non sur lui, pour qu’il puisse s’élancer.',
      reussite: '6 passes sur 10 frappées ou attrapées par l’attaquant en avançant.', facile: 'L’attaquant attrape le ballon au-dessus de lui.', dur: 'Varier passe courte et passe longue.',
      legende: { L: 'Lanceur', P: 'Passeur', A: 'Attaquant' },
      schema: { j: [[110, 295, 'L'], [120, 205, 'P', true], [45, 250, 'A']], b: [[112, 281, 120, 219], [106, 201, 55, 200]], d: [[47, 236, 50, 212]] } },
  ]],
  attaque: [[
    { id: 'attaque-1', titre: 'Renvoi à deux mains', dispositif: 'Par 2, près du filet, du même côté. Le partenaire lance un ballon haut près du filet.',
      but: 'Renvoyer à deux mains par-dessus le filet, vers un espace libre du terrain.',
      reussite: '6 ballons sur 10 dans le terrain d’en face.', facile: 'Filet plus bas, ou lancer plus haut.', dur: 'Viser une zone annoncée.',
      legende: { L: 'Lanceur', A: 'Attaquant' },
      schema: { j: [[140, 240, 'L'], [85, 205, 'A', true]], b: [[128, 232, 97, 212], [85, 191, 70, 90]], c: [[25, 40, 80, 70, 'espace libre']] } },
    { id: 'attaque-1b', titre: 'Le renvoi depuis le tapis', source: 'Lyon', dispositif: 'Par équipes. Le renvoyeur part derrière un tapis. L’entraîneur, en face, lance par-dessus le filet vers le tapis.',
      but: 'Avancer et renvoyer le ballon dans le terrain d’en face. Après 5 essais, on change.',
      reussite: 'Battre son record sur 5 renvois.', facile: 'Attraper puis lancer par-dessus le filet.', dur: 'Imposer le renvoi en passe haute ou en manchette.',
      legende: { E: 'Entraîneur', R: 'Renvoyeur' },
      schema: { j: [[100, 95, 'E'], [100, 305, 'R', true]], b: [[96, 109, 96, 248], [108, 248, 120, 60]], d: [[90, 292, 90, 268]], c: [[65, 235, 70, 28, 'tapis']] } },
    { id: 'attaque-1c', titre: 'Le relais', source: 'Alpes-Maritimes', dispositif: 'Par 4 : trois relayeurs d’un côté, un défenseur en face. Une zone de fond marquée. Rotation toutes les 2 minutes.',
      but: 'Du fond, faire remonter le ballon de 1 à 2 puis à 3, qui l’envoie dans le terrain d’en face. Chacun peut attraper 1 seconde avant de frapper.',
      reussite: '5 relais sur 8 qui finissent dans le terrain d’en face.', facile: 'Attraper puis lancer à chaque touche.', dur: 'Le défenseur lance vers la zone de fond pour démarrer.',
      legende: { '1': 'Fond', '2': 'Relais', '3': 'Attaquant', D: 'Défenseur' },
      schema: { j: [[100, 320, '1'], [70, 265, '2'], [125, 205, '3', true], [100, 90, 'D']], b: [[92, 309, 75, 278], [80, 256, 113, 214], [122, 191, 105, 104]], c: [[25, 300, 150, 38, 'zone de fond']] } },
  ], [
    { id: 'attaque-2', titre: 'Frappe à une main', dispositif: 'Par 2 ou 3. Le lanceur envoie un ballon haut. L’attaquant part 2 m derrière la ligne.',
      but: 'Avancer sous le ballon et le frapper à une main, bras tendu, vers le fond du terrain.',
      reussite: '6 frappes sur 10 dans le terrain d’en face.', facile: 'Frapper sans sauter, plus près du filet.', dur: 'Frapper en sautant.',
      legende: { L: 'Lanceur', A: 'Attaquant' },
      schema: { j: [[140, 215, 'L'], [75, 255, 'A', true]], b: [[128, 208, 85, 205], [80, 195, 90, 60]], d: [[75, 241, 78, 215]], c: [[30, 30, 140, 50, 'fond du terrain']] } },
    { id: 'attaque-2b', titre: 'Relais ou attaque directe ?', source: 'Alpes-Maritimes', dispositif: 'Par 3 : un lanceur en face, un joueur au fond, un joueur devant.',
      but: 'Ballon au fond : on le passe au joueur de devant, qui attaque. Ballon devant : attaque directe. Lire la trajectoire pour choisir.',
      reussite: '6 ballons sur 10 avec le bon choix et un renvoi dans le terrain.', facile: 'Attraper 1 seconde avant de frapper.', dur: 'Service frappé, renvoi direct obligatoire sur ballon court.',
      legende: { L: 'Lanceur', F: 'Fond', A: 'Devant' },
      schema: { j: [[100, 90, 'L'], [75, 300, 'F'], [120, 210, 'A', true]], b: [[95, 104, 78, 286], [82, 288, 113, 222], [122, 196, 110, 60]], c: [[25, 280, 150, 55, 'relais']] } },
    { id: 'attaque-2c', titre: 'La zone arrière vaut double', source: 'Strasbourg', dispositif: 'Match à 2 contre 2 sur terrain étroit et profond. Une zone arrière marquée de chaque côté.',
      but: 'Marquer dans la zone arrière adverse : 2 points. Ailleurs : 1 point. On renvoie seulement depuis la zone avant.',
      reussite: 'Marquer au moins 3 points sur 10 dans la zone arrière.', facile: 'Rebond permis pendant la construction du renvoi.', dur: 'Le ballon renvoyé ne peut plus être attrapé.',
      legende: { A: 'Équipe qui attaque', D: 'Équipe qui défend' },
      schema: { j: [[75, 215, 'A', true], [125, 285, 'A', true], [60, 130, 'D'], [140, 65, 'D']], b: [[120, 272, 82, 228], [75, 201, 100, 50]], c: [[25, 25, 150, 55, '2 points']] } },
  ], [
    { id: 'attaque-3', titre: 'Attaquer avec élan', dispositif: 'Par 3 ou 4 : un passeur, un attaquant, un ou deux défenseurs en face.',
      but: 'Sur la passe haute, prendre son élan en 2 ou 3 pas, sauter et frapper vers la zone la moins défendue.',
      reussite: '5 attaques sur 10 gagnantes ou difficiles à défendre.', facile: 'Sans défenseur, ballon lancé à la main.', dur: 'Ajouter un contreur, ou enchaîner après une réception.',
      legende: { P: 'Passeur', A: 'Attaquant', D: 'Défenseur' },
      schema: { j: [[125, 205, 'P'], [45, 270, 'A', true], [125, 90, 'D']], b: [[111, 200, 62, 200], [58, 190, 45, 70]], d: [[46, 256, 56, 212]] } },
    { id: 'attaque-3b', titre: 'Jouer court, jouer long', source: 'Martinique', dispositif: 'Par 3 ou 4 : un passeur, un attaquant, un ou deux défenseurs qui bougent.',
      but: 'Regarder le placement des défenseurs, puis jouer court derrière le filet ou long vers le fond, là où il n’y a personne.',
      reussite: '5 ballons sur 10 tombent au sol ou mettent la défense en difficulté.', facile: 'Un seul défenseur, immobile.', dur: 'Ajouter « jouer derrière » : frapper dans le dos d’un défenseur.',
      legende: { P: 'Passeur', A: 'Attaquant', D: 'Défenseur' },
      schema: { j: [[130, 205, 'P'], [60, 210, 'A', true], [90, 95, 'D']], b: [[116, 205, 74, 205], [60, 196, 40, 145], [68, 197, 150, 45]], c: [[25, 130, 150, 44, 'court'], [25, 25, 150, 44, 'long']] } },
    { id: 'attaque-3c', titre: 'La cible interdite', source: 'Alpes-Maritimes', dispositif: 'Match à 3 contre 3. Chaque équipe a une zone marquée sur son terrain, qu’elle place où elle veut.',
      but: 'Si le ballon tombe dans la zone adverse, 2 points. Choisir de jouer en profondeur ou en largeur pour l’atteindre.',
      reussite: 'Gagner le match en marquant au moins 3 points dans la zone.', facile: 'Grande zone, et une touche attrapée permise.', dur: 'Petite zone, ou joueurs obligés de rester dans leur cerceau.',
      legende: { A: 'Attaque', D: 'Défense' },
      schema: { j: [[50, 215, 'A', true], [100, 275, 'A', true], [150, 215, 'A', true], [60, 130, 'D'], [140, 130, 'D'], [100, 70, 'D']], b: [[100, 261, 58, 228], [50, 201, 140, 55]], c: [[120, 30, 50, 44, 'zone']] } },
  ]],
};

// Le jeu qui encadre la situation quand toute la classe travaille le même point (d'après la démarche « jeu, situation, retour au jeu »).
const JEUX_VOLLEY = {
  service: 'Matchs à 3 contre 3 : un service qui gagne le point directement ou que l’adversaire ne peut pas jouer vaut 2 points.',
  reception: 'Matchs à 3 contre 3, service lancé : quand la réception permet à un partenaire de jouer le ballon, l’équipe gagne 1 point en plus.',
  passe: 'Matchs à 3 contre 3 : au moins une passe obligatoire avant de renvoyer le ballon de l’autre côté.',
  attaque: 'Matchs à 3 contre 3 : renvoi seulement depuis la zone avant, et un ballon qui tombe dans la zone arrière adverse vaut 2 points.',
};

const CAUSES_VOLLEY = [['place', 'Mal placé'], ['geste', 'Geste'], ['dosage', 'Trop fort ou trop court']];
const CONSEILS_VOLLEY = {
  service: { place: 'Se placer de profil, le pied opposé au bras de frappe devant.', geste: 'Lancer le ballon peu haut et devant soi, frapper bras tendu.', dosage: 'Garder le même geste et régler la distance en avançant ou en reculant.' },
  reception: { place: 'Se déplacer tôt pour être derrière le ballon, jambes fléchies.', geste: 'Bras tendus et serrés, sans balancer : le ballon rebondit sur les avant-bras.', dosage: 'Accompagner avec les jambes et orienter le plan des bras vers la cible.' },
  passe: { place: 'Être sous le ballon avant qu’il arrive, face à la cible.', geste: 'Mains au-dessus du front, doigts ouverts, poussée des bras et des jambes.', dosage: 'Pousser vers le haut d’abord : une passe haute laisse du temps au partenaire.' },
  attaque: { place: 'Partir derrière le ballon et attendre la passe avant de s’élancer.', geste: 'Frapper le ballon bras tendu, au point le plus haut, devant soi.', dosage: 'Frapper plus haut sur le ballon pour le faire redescendre dans le terrain.' },
};

const niveauVolley = p => (p < 40 ? 1 : p < 70 ? 2 : 3);
const situationVolley = (geste, niveau, rang = 0) => {
  const l = SITUATIONS_VOLLEY[geste]?.[niveau - 1], s = l?.[rang % l.length];
  return s && { ...s, ...etatOutils.volleyFiches?.[s.id] }; // (le texte corrigé par l'enseignant passe devant)
};
const teinteVolley = (cfg, geste) => cfg.gestes.find(g => g.id === geste)?.teinte ?? 0;
// Le niveau « du milieu » d'une liste (arrondi vers le plus facile).
const milieuVolley = l => [...l].sort()[Math.floor((l.length - 1) / 2)];

// Les gestes de la banque où l'élève a au moins 5 essais, du plus fragile au plus solide.
function diagnosticVolley(s) {
  return Object.keys(SITUATIONS_VOLLEY).filter(g => s?.g[g]?.e >= MIN_ESSAIS_VOLLEY)
    .map(g => { const p = pctVolley(s.g[g].r, s.g[g].e); return { geste: g, pct: p, essais: s.g[g].e, niveau: niveauVolley(p) }; })
    .sort((x, y) => x.pct - y.pct);
}

/* ---------- Plusieurs ateliers selon les besoins ---------- */

function proposerAteliersVolley(c, cfg) {
  const st = statsVolley(actionsVolley(cfg)), nb = cfg.nbAteliers ?? 3, presents = presentsOutil(c).map(el => el.id);
  const diags = Object.fromEntries(presents.map(id => [id, diagnosticVolley(st[id])]));
  const connus = presents.filter(id => diags[id].length), inconnus = presents.filter(id => !diags[id].length);
  if (!connus.length) return toast(`Pas encore assez de résultats : il faut au moins ${MIN_ESSAIS_VOLLEY} essais sur un geste.`, 'erreur');
  // 1. Un groupe par besoin : le geste le plus fragile de chacun, et son niveau.
  let liste = [];
  for (const id of connus) {
    const d = diags[id][0];
    let g = liste.find(x => x.geste === d.geste && x.niveau === d.niveau);
    if (!g) liste.push(g = { geste: d.geste, niveau: d.niveau, rang: 0, membres: [] });
    g.membres.push(id);
  }
  // 2. Trop de groupes : le plus petit se répartit, chacun vers son geste à travailler suivant.
  while (liste.length > nb) {
    liste.sort((x, y) => x.membres.length - y.membres.length);
    const petit = liste.shift();
    for (const id of petit.membres) {
      const suite = diags[id].map(d => [d, liste.find(x => x.geste === d.geste)]).find(([, x]) => x);
      const dest = suite?.[1] || [...liste].sort((x, y) => x.membres.length - y.membres.length)[0];
      dest.membres.push(id);
    }
  }
  // Niveau de chaque groupe : celui du milieu parmi ses membres (arrondi vers le plus facile).
  for (const g of liste) {
    const niveaux = g.membres.map(id => diags[id].find(d => d.geste === g.geste)?.niveau).filter(Boolean);
    if (niveaux.length) g.niveau = milieuVolley(niveaux);
  }
  // 3. Pas assez de groupes : on coupe en deux le plus grand (même situation, moins d'attente).
  for (;;) {
    const grand = [...liste].sort((x, y) => y.membres.length - x.membres.length)[0];
    if (liste.length >= nb || grand.membres.length < 4) break;
    const taux = id => { const v = st[id]?.g[grand.geste]; return v?.e ? v.r / v.e : 0; };
    grand.membres.sort((x, y) => taux(x) - taux(y));
    const moitie = Math.ceil(grand.membres.length / 2);
    liste.push({ geste: grand.geste, niveau: grand.niveau, rang: 1, membres: grand.membres.splice(moitie) });
  }
  // 4. Ceux qui ont trop peu d'essais vont dans les plus petits groupes.
  for (const id of inconnus) [...liste].sort((x, y) => x.membres.length - y.membres.length)[0].membres.push(id);
  const ordre = Object.keys(SITUATIONS_VOLLEY);
  liste.sort((x, y) => ordre.indexOf(x.geste) - ordre.indexOf(y.geste) || x.niveau - y.niveau);
  cfg.plan = { liste, sansResultats: inconnus };
  cfg.atelierOuvert = 0;
  cfg.selectionAtelier = null;
  rendreOutil();
}

/* ---------- Un seul atelier pour toute la classe ---------- */

// Les gestes observés, du plus fragile pour le groupe au plus solide, avec le nombre d'élèves en difficulté.
function pointsImportantsVolley(c, cfg) {
  const st = statsVolley(actionsVolley(cfg)), ids = presentsOutil(c).map(el => el.id);
  return Object.keys(SITUATIONS_VOLLEY).map(g => {
    const v = ids.map(id => st[id]?.g[g]).filter(Boolean), e = v.reduce((t, x) => t + x.e, 0), r = v.reduce((t, x) => t + x.r, 0);
    const assez = v.filter(x => x.e >= MIN_ESSAIS_VOLLEY);
    return { geste: g, pct: pctVolley(r, e), essais: e, eleves: assez.length, difficulte: assez.filter(x => pctVolley(x.r, x.e) < A_TRAVAILLER_VOLLEY).length };
  }).filter(p => p.essais >= MIN_ESSAIS_VOLLEY).sort((x, y) => x.pct - y.pct || y.difficulte - x.difficulte);
}

// Répartit les présents en petits groupes sur le geste choisi. De niveau : chaque groupe a sa version de la situation.
// Mélangés : tout le monde joue la version 2, et les plus à l'aise aident (« joueur ressource »).
function preparerClasseVolley(c, cfg, geste) {
  const points = pointsImportantsVolley(c, cfg);
  geste ??= cfg.classe?.geste && points.some(p => p.geste === cfg.classe.geste) ? cfg.classe.geste : points[0]?.geste;
  if (!geste) return toast(`Pas encore assez de résultats : il faut au moins ${MIN_ESSAIS_VOLLEY} essais sur un geste.`, 'erreur');
  const st = statsVolley(actionsVolley(cfg)), ids = presentsOutil(c).map(el => el.id);
  const taux = id => { const v = st[id]?.g[geste]; return v?.e >= MIN_ESSAIS_VOLLEY ? v.r / v.e * 100 : null; };
  const tries = melange(ids).sort((x, y) => (taux(x) ?? 50) - (taux(y) ?? 50));
  const taille = cfg.tailleGroupe ?? 3, nb = Math.max(1, Math.round(ids.length / taille)), melanges = cfg.modeGroupes === 'melange';
  const groupes = Array.from({ length: nb }, () => ({ membres: [], version: 2 }));
  // (Mélangés : distribution une à une. De niveau : tranches successives de taille égale.)
  tries.forEach((id, i) => groupes[melanges ? i % nb : Math.floor(i * nb / tries.length)].membres.push(id));
  if (!melanges) for (const g of groupes) {
    const l = g.membres.map(taux).filter(p => p !== null).map(niveauVolley);
    g.version = l.length ? milieuVolley(l) : 2;
  }
  const niveaux = ids.map(taux).filter(p => p !== null).map(niveauVolley);
  cfg.classe = { geste, niveau: niveaux.length ? milieuVolley(niveaux) : 2, rang: cfg.classe?.geste === geste ? cfg.classe.rang : 0, groupes };
  cfg.selectionAtelier = null;
  rendreOutil();
}

/* ---------- Affichage ---------- */

function htmlOngletsVolley(cfg) {
  const onglet = cfg.onglet ?? 'match';
  return `<div class="onglets-volley" role="group" aria-label="Partie de l’outil">${[['match', '🏐', 'Match', 'Noter les gestes'], ['ateliers', '🧩', 'Ateliers', 'Des groupes selon les besoins'], ['eleve', '🎯', 'Fiche élève', 'Le défi de chacun']].map(([id, icone, nom, info]) =>
    `<button data-ovs="onglet" data-arg="${id}" class="onglet-volley${onglet === id ? ' choisi' : ''}" aria-pressed="${onglet === id}">
      <span class="icone-onglet-volley" aria-hidden="true">${icone}</span><span class="nom-onglet-volley">${nom}</span><span class="info-onglet-volley">${info}</span></button>`).join('')}</div>`;
}

const periodesDiagVolley = cfg => `<div class="boutons-outil periodes-volley"><span class="aide">D’après les résultats :</span>${PERIODES_VOLLEY.map(([id, nom]) =>
  `<button data-ovb="periode" data-arg="${id}" class="${cfg.periode === id ? 'choisi' : ''}" aria-pressed="${cfg.periode === id}">${nom}</button>`).join('')}</div>`;

// Le schéma de terrain, dessiné d'après les données de la fiche (SVG : aucune couleur en ligne, tout vient de style.css).
function schemaVolley(sit) {
  const sc = sit.schema;
  const fleche = ([x1, y1, x2, y2], classe) => {
    const lg = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / lg, uy = (y2 - y1) / lg;
    const a = `${x2},${y2} ${x2 - 9 * ux + 5 * uy},${y2 - 9 * uy - 5 * ux} ${x2 - 9 * ux - 5 * uy},${y2 - 9 * uy + 5 * ux}`;
    return `<line class="${classe}" x1="${x1}" y1="${y1}" x2="${x2 - 7 * ux}" y2="${y2 - 7 * uy}"/><polygon class="${classe}-tete" points="${a}"/>`;
  };
  return `<svg class="schema-volley" viewBox="0 0 200 360" role="img" aria-label="Schéma de la situation : ${esc(sit.titre)}">
    <rect class="terrain-volley" x="20" y="20" width="160" height="320" rx="2"/>
    <line class="ligne-volley" x1="20" y1="127" x2="180" y2="127"/><line class="ligne-volley" x1="20" y1="233" x2="180" y2="233"/>
    <line class="filet-volley" x1="8" y1="180" x2="192" y2="180"/>
    ${(sc.c || []).map(([x, y, l, h, t]) => `<rect class="cible-volley" x="${x}" y="${y}" width="${l}" height="${h}" rx="2"/>${t ? `<text class="texte-cible-volley" x="${x + l / 2}" y="${y + h / 2 + 4}" text-anchor="middle">${esc(t)}</text>` : ''}`).join('')}
    ${(sc.b || []).map(f => fleche(f, 'balle-volley')).join('')}
    ${(sc.d || []).map(f => fleche(f, 'pas-volley')).join('')}
    ${sc.j.map(([x, y, l, principal]) => `<circle class="${principal ? 'joueur-principal-volley' : 'joueur-autre-volley'}" cx="${x}" cy="${y}" r="13"/><text class="lettre-volley" x="${x}" y="${y + 5}" text-anchor="middle">${esc(l)}</text>`).join('')}
  </svg>`;
}

// versions : pour la classe entière, les variantes deviennent « Version 1, 2, 3 » (des mots neutres pour les élèves).
function htmlFicheVolley(cfg, geste, niveau, rang = 0, versions = false) {
  const sit = situationVolley(geste, niveau, rang);
  if (!sit) return '';
  const ligne = (nom, t) => `<p><b>${nom} :</b> ${esc(t)}</p>`;
  return `<div class="fiche-volley teinte-volley-${teinteVolley(cfg, geste)}">
    <div class="dessin-volley">${schemaVolley(sit)}
      <p class="legende-volley">${Object.entries(sit.legende).map(([l, n]) => `<b>${esc(l)}</b> ${esc(n)}`).join(' · ')}<br>Trait plein : le ballon · Pointillés : le joueur</p></div>
    <div class="texte-volley">
      <h3>${esc(nomGesteVolley(cfg, geste))} · ${esc(sit.titre)}</h3>
      ${ligne('Dispositif', sit.dispositif)}${ligne(versions ? 'But (version 2)' : 'But', sit.but)}${ligne('Réussite', sit.reussite)}
      ${ligne(versions ? 'Version 1' : 'Plus facile', sit.facile)}${ligne(versions ? 'Version 3' : 'Plus difficile', sit.dur)}
      ${sit.source ? `<p class="source-volley prive-volley">Idée reprise et adaptée d’un document de : ${esc(sit.source)}</p>` : ''}
    </div>
  </div>`;
}

// Boutons communs aux fiches : changer de fiche, de niveau, corriger, projeter.
const boutonsFicheVolley = (geste, niveau, rang, selectGeste = '') => `<div class="boutons-outil prive-volley">${selectGeste}
    <button data-ovs="niveau" data-arg="-1" ${niveau > 1 ? '' : 'disabled'}>◀ Plus facile</button>
    <button data-ovs="niveau" data-arg="1" ${niveau < 3 ? '' : 'disabled'}>Plus difficile ▶</button>
    <button data-ovs="autre">🔄 Autre situation</button>
    <button data-ovs="modifier" data-arg="${geste}|${niveau}|${rang}">✎ Modifier la fiche</button>
    <button data-o="plein-ecran" title="Projeter cette fiche : niveaux et pourcentages sont cachés">📽 Projeter</button>
  </div>`;

function htmlAteliersVolley(c, cfg) {
  const type = enModeEleve() && !cfg.plan && cfg.classe ? 'classe' : cfg.typeAteliers ?? 'besoins';
  const choix = enModeEleve() ? '' : `<div class="types-ateliers-volley" role="group" aria-label="Façon de travailler">${[['besoins', '🧩', 'Plusieurs ateliers', 'Chacun travaille son besoin'], ['classe', '🎯', 'Un seul atelier', 'Toute la classe sur le point important']].map(([id, icone, nom, info]) =>
    `<button data-ovs="type" data-arg="${id}" class="type-atelier-volley${type === id ? ' choisi' : ''}" aria-pressed="${type === id}"><b>${icone} ${nom}</b><small>${info}</small></button>`).join('')}</div>`;
  return choix + (type === 'classe' ? htmlClasseVolley(c, cfg) : htmlPlusieursVolley(c, cfg));
}

function htmlPlusieursVolley(c, cfg) {
  const prof = !enModeEleve(), plan = cfg.plan, st = statsVolley(actionsVolley(cfg));
  const entete = prof ? `${periodesDiagVolley(cfg)}
    <div class="carte boutons-outil">
      <label class="en-ligne">Ateliers<select data-ovs-nb>${[2, 3, 4, 5, 6].map(n => `<option value="${n}" ${(cfg.nbAteliers ?? 3) === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <button class="primaire gros" data-ovs="proposer">🧩 ${plan ? 'Refaire les ateliers' : 'Proposer les ateliers'}</button>
    </div>` : '';
  if (!plan) return `${entete}<p class="aide">L’appli réunit les élèves présents qui ont le même geste à travailler (au moins ${MIN_ESSAIS_VOLLEY} essais). Tu pourras tout changer ensuite.</p>`;
  const ouvert = plan.liste[cfg.atelierOuvert] ? cfg.atelierOuvert : 0, a = plan.liste[ouvert];
  const nom = id => esc(nomOutil(id));
  const carte = (x, i) => `<div class="atelier-volley teinte-volley-${teinteVolley(cfg, x.geste)}${i === ouvert ? ' ouvert' : ''}">
    <button class="tete-atelier-volley" data-ovs="ouvrir" data-arg="${i}" aria-pressed="${i === ouvert}">Atelier ${i + 1} · ${esc(nomGesteVolley(cfg, x.geste))}<span class="prive-volley">${prof ? ` · niveau ${x.niveau}` : ''}</span></button>
    <div class="membres-atelier-volley">${x.membres.filter(id => Donnees.get('eleves', id)).map(id => {
      const v = st[id]?.g[x.geste], p = v?.e >= MIN_ESSAIS_VOLLEY ? pctVolley(v.r, v.e) : null;
      return prof ? `<button class="membre-volley${cfg.selectionAtelier === id ? ' choisi' : ''}" data-ovs="choisir" data-arg="${id}">${nom(id)}<small class="prive-volley">${p === null ? (plan.sansResultats.includes(id) ? ' · peu d’essais' : '') : ` · ${p} %`}</small></button>`
        : `<span class="membre-volley">${nom(id)}</span>`;
    }).join('')}</div>
    ${prof && cfg.selectionAtelier && !x.membres.includes(cfg.selectionAtelier) ? `<button data-ovs="deplacer" data-arg="${i}">↓ Mettre ici</button>` : ''}
  </div>`;
  const selectGeste = `<label class="en-ligne">Geste<select data-ovs-geste>${Object.keys(SITUATIONS_VOLLEY).map(g => `<option value="${g}" ${a.geste === g ? 'selected' : ''}>${esc(nomGesteVolley(cfg, g))}</option>`).join('')}</select></label>`;
  return `${entete}
    <div class="ateliers-volley">${plan.liste.map(carte).join('')}</div>
    ${prof && cfg.selectionAtelier ? '<p class="aide">Touche « Mettre ici » sur l’atelier choisi, ou de nouveau le nom pour annuler.</p>' : ''}
    <div class="carte actions-fiche-volley">
      ${prof ? boutonsFicheVolley(a.geste, a.niveau, a.rang ?? 0, selectGeste) : ''}
      ${htmlFicheVolley(cfg, a.geste, a.niveau, a.rang ?? 0)}
    </div>`;
}

function htmlClasseVolley(c, cfg) {
  const prof = !enModeEleve(), points = pointsImportantsVolley(c, cfg), plan = cfg.classe;
  const reglages = prof ? `${periodesDiagVolley(cfg)}
    ${points.length ? `<h3 class="prive-volley">Le point important relevé</h3>
    <div class="points-volley prive-volley">${points.map((p, i) => `<button data-ovs="point" data-arg="${p.geste}" class="point-volley teinte-volley-${teinteVolley(cfg, p.geste)}${plan?.geste === p.geste ? ' choisi' : ''}" aria-pressed="${plan?.geste === p.geste}">
        <span class="tete-point-volley">${esc(nomGesteVolley(cfg, p.geste))}${i === 0 ? ' · proposé' : ''}</span>
        <b>${p.pct} %</b><small>${p.eleves ? `${p.difficulte} élève${p.difficulte > 1 ? 's' : ''} sur ${p.eleves} en difficulté` : `${p.essais} essais, peu par élève`}</small></button>`).join('')}</div>` : `<p class="aide">Pas encore assez de résultats : il faut au moins ${MIN_ESSAIS_VOLLEY} essais sur un geste. Note d’abord un match dans 🏐 Match.</p>`}
    ${points.length ? `<div class="carte boutons-outil prive-volley">
      <label class="en-ligne">Par<select data-ovs-taille>${[2, 3, 4, 5, 6].map(n => `<option value="${n}" ${(cfg.tailleGroupe ?? 3) === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="en-ligne">Groupes<select data-ovs-mode><option value="niveau" ${cfg.modeGroupes !== 'melange' ? 'selected' : ''}>de niveau</option><option value="melange" ${cfg.modeGroupes === 'melange' ? 'selected' : ''}>mélangés</option></select></label>
      <button class="primaire" data-ovs="preparer-classe">🎯 ${plan ? 'Refaire les groupes' : 'Préparer la séance'}</button>
    </div>` : ''}` : '';
  if (!plan) return `${reglages}${prof && points.length ? '<p class="aide">Toute la classe travaille le même point, avec la même situation en 3 versions selon les groupes.</p>' : ''}`;
  const nom = id => esc(nomOutil(id));
  const groupe = (g, i) => `<div class="atelier-volley teinte-volley-${teinteVolley(cfg, plan.geste)}">
    <div class="tete-atelier-volley">Groupe ${i + 1} · version ${g.version}</div>
    <div class="membres-atelier-volley">${g.membres.filter(id => Donnees.get('eleves', id)).map(id => (prof ? `<button class="membre-volley${cfg.selectionAtelier === id ? ' choisi' : ''}" data-ovs="choisir" data-arg="${id}">${nom(id)}</button>` : `<span class="membre-volley">${nom(id)}</span>`)).join('')}</div>
    ${prof ? `<div class="boutons-outil prive-volley pied-groupe-volley">${cfg.selectionAtelier && !g.membres.includes(cfg.selectionAtelier) ? `<button data-ovs="deplacer-groupe" data-arg="${i}">↓ Mettre ici</button>` : ''}
      <button data-ovs="version" data-arg="${i}">Changer de version</button></div>` : ''}
  </div>`;
  return `${reglages}
    <div class="carte actions-fiche-volley">
      ${prof ? boutonsFicheVolley(plan.geste, plan.niveau, plan.rang) : ''}
      <ol class="temps-volley">
        <li><b>Jouer pour constater.</b> ${esc(JEUX_VOLLEY[plan.geste])} Les élèves disent ce qui bloque.</li>
        <li><b>S’entraîner.</b> Toute la classe fait la situation ci-dessous, par petits groupes, chacun dans sa version.</li>
        <li><b>Rejouer pour vérifier.</b> Même jeu qu’au début.${prof ? ' Note quelques gestes dans 🏐 Match pour voir les progrès.' : ''}</li>
      </ol>
      ${htmlFicheVolley(cfg, plan.geste, plan.niveau, plan.rang, true)}
    </div>
    ${prof ? '<p class="aide prive-volley">Regarde le nombre de joueurs indiqué dans le dispositif : au besoin, change « Par » puis « Refaire les groupes ».</p>' : ''}
    <div class="ateliers-volley">${plan.groupes.map(groupe).join('')}</div>`;
}

function htmlEleveVolley(c, cfg) {
  const prof = !enModeEleve(), st = statsVolley(actionsVolley(cfg)), els = presentsOutil(c);
  const id = els.some(el => el.id === cfg.eleveFiche) ? cfg.eleveFiche : null;
  const choix = `<div class="chips-volley">${els.map(el => `<button type="button" class="chip-volley${el.id === id ? ' equipe-a' : ''}" data-ovs="eleve" data-arg="${el.id}" aria-pressed="${el.id === id}">${esc(nomEleveOutil(el))}</button>`).join('')}</div>`;
  if (!id) return `${prof ? periodesDiagVolley(cfg) : ''}<p class="aide">Touche un nom pour voir son défi.</p>${choix}`;
  const d = diagnosticVolley(st[id]);
  if (!d.length) return `${prof ? periodesDiagVolley(cfg) : ''}${choix}<p class="aide">Pas encore assez de résultats pour ${esc(nomOutil(id))} : il faut au moins ${MIN_ESSAIS_VOLLEY} essais sur un geste.</p>`;
  const prio = d[0], meilleur = d.at(-1), rang = cfg.rangEleve ?? 0;
  const nomG = g => esc(nomGesteVolley(cfg, g).toLowerCase());
  const causes = cfg.actions.filter(a => a.j === id && a.g === prio.geste && a.c).reduce((t, a) => { t[a.c] = (t[a.c] || 0) + 1; return t; }, {});
  const cause = Object.entries(causes).sort((x, y) => y[1] - x[1])[0];
  const nomCause = cause && CAUSES_VOLLEY.find(x => x[0] === cause[0])?.[1];
  const bilan = prof ? `<p class="bilan-eleve-volley prive-volley">À travailler : <b>${nomG(prio.geste)} ${prio.pct} %</b> sur ${prio.essais} essais, niveau ${prio.niveau}.
      ${d.length > 1 ? `Point d’appui : <b>${nomG(meilleur.geste)} ${meilleur.pct} %</b>.` : ''}
      ${cause ? `<br>Cause la plus notée : <b>${esc(nomCause.toLowerCase())}</b> (${cause[1]}). ${esc(CONSEILS_VOLLEY[prio.geste][cause[0]])}` : ''}</p>` : '';
  return `${prof ? periodesDiagVolley(cfg) : ''}${choix}
    <div class="carte actions-fiche-volley">
      <h3 class="titre-defi-volley">🎯 Le défi de ${esc(nomOutil(id))}</h3>
      ${bilan}
      ${prof ? `<div class="boutons-outil prive-volley"><button data-ovs="autre-eleve">🔄 Autre situation</button><button data-ovs="modifier" data-arg="${prio.geste}|${prio.niveau}|${rang}">✎ Modifier la fiche</button><button data-o="plein-ecran">📽 Projeter</button></div>` : ''}
      ${htmlFicheVolley(cfg, prio.geste, prio.niveau, rang)}
    </div>`;
}

/* ---------- Actions ---------- */

async function modifierFicheVolley(geste, niveau, rang) {
  const sit = situationVolley(geste, niveau, rang), id = sit.id;
  const zone = (nom, cle) => `<label>${nom}<textarea name="${cle}" rows="2">${esc(sit[cle])}</textarea></label>`;
  const { resultat } = ouvrirModale(`Modifier la fiche — ${sit.titre}`, `
    <label>Titre<input name="titre" maxlength="60" value="${esc(sit.titre)}" required></label>
    ${zone('Dispositif', 'dispositif')}${zone('But', 'but')}${zone('Réussite', 'reussite')}${zone('Plus facile', 'facile')}${zone('Plus difficile', 'dur')}
    <p class="aide">Ta fiche corrigée sert pour toutes tes classes. Le schéma ne change pas.</p>`,
  boutonsModale('Enregistrer', etatOutils.volleyFiches?.[id] ? '<button value="origine" formnovalidate>Remettre le texte d’origine</button>' : ''));
  const r = await resultat;
  etatOutils.volleyFiches ??= {};
  if (r.action === 'origine') delete etatOutils.volleyFiches[id];
  else if (r.action === 'ok') etatOutils.volleyFiches[id] = r.data;
  else return;
  rendreOutil();
}

// La fiche sur laquelle portent les boutons : celle de l'atelier ouvert, ou celle de la classe entière.
function ficheVisibleVolley(cfg) {
  if (cfg.typeAteliers === 'classe') return cfg.classe;
  const l = cfg.plan?.liste;
  return l?.[l[cfg.atelierOuvert] ? cfg.atelierOuvert : 0];
}

function actionSituationsVolley(action, arg, c) {
  const cfg = cfgVolley(c), f = ficheVisibleVolley(cfg);
  switch (action) {
    case 'onglet': cfg.onglet = arg; return rendreOutil();
    case 'eleve': cfg.eleveFiche = arg; cfg.rangEleve = 0; return rendreOutil();
    case 'ouvrir': cfg.atelierOuvert = +arg; return rendreOutil();
  }
  if (enModeEleve()) return;
  switch (action) {
    case 'modifier': { const [g, n, r] = arg.split('|'); return lancer(() => modifierFicheVolley(g, +n, +r)); }
    case 'type': cfg.typeAteliers = arg; cfg.selectionAtelier = null; return rendreOutil();
    case 'proposer':
      return lancer(async () => {
        if (cfg.plan && !(await confirmer('Refaire les ateliers ? Tes changements seront remplacés.', 'Refaire'))) return;
        proposerAteliersVolley(c, cfg);
      });
    case 'preparer-classe': return preparerClasseVolley(c, cfg);
    case 'point': return preparerClasseVolley(c, cfg, arg);
    case 'choisir': cfg.selectionAtelier = cfg.selectionAtelier === arg ? null : arg; return rendreOutil();
    case 'deplacer': {
      for (const x of cfg.plan.liste) x.membres = x.membres.filter(id => id !== cfg.selectionAtelier);
      cfg.plan.liste[+arg].membres.push(cfg.selectionAtelier);
      cfg.selectionAtelier = null;
      return rendreOutil();
    }
    case 'deplacer-groupe': {
      for (const x of cfg.classe.groupes) x.membres = x.membres.filter(id => id !== cfg.selectionAtelier);
      cfg.classe.groupes[+arg].membres.push(cfg.selectionAtelier);
      cfg.selectionAtelier = null;
      return rendreOutil();
    }
    case 'version': { const g = cfg.classe.groupes[+arg]; g.version = g.version % 3 + 1; return rendreOutil(); }
    case 'niveau': if (f) { f.niveau = Math.max(1, Math.min(3, f.niveau + +arg)); f.rang = 0; } return rendreOutil();
    case 'autre': if (f) f.rang = ((f.rang ?? 0) + 1) % 3; return rendreOutil();
    case 'autre-eleve': cfg.rangEleve = ((cfg.rangEleve ?? 0) + 1) % 3; return rendreOutil();
  }
}

document.addEventListener('click', e => {
  const b = e.target.closest('#vue [data-ovs]');
  if (!b || b.disabled) return;
  const c = classeActive();
  if (c) lancer(() => actionSituationsVolley(b.dataset.ovs, b.dataset.arg, c));
});

document.addEventListener('change', e => {
  const t = e.target;
  if (!t.closest?.('#vue .outil-volley') || enModeEleve()) return;
  const c = classeActive();
  if (!c) return;
  const cfg = cfgVolley(c);
  if (t.dataset.ovsNb !== undefined) { cfg.nbAteliers = +t.value; return sauverOutils(); }
  if (t.dataset.ovsTaille !== undefined) { cfg.tailleGroupe = +t.value; return sauverOutils(); }
  if (t.dataset.ovsMode !== undefined) { cfg.modeGroupes = t.value; return sauverOutils(); }
  if (t.dataset.ovsGeste !== undefined) {
    const f = ficheVisibleVolley(cfg);
    if (f) { f.geste = t.value; f.rang = 0; }
    return rendreOutil();
  }
});
