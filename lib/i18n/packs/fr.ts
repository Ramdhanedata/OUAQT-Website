import type { PackPagesCopy } from "./en";

/*
 * The landing page for each trade, in French.
 *
 * French is the reference: this file is written first and the other two
 * follow it. The reader is a shopkeeper in Nouakchott who has a queue in
 * front of him, so the sentences are short and every one of them says
 * something he can check.
 */
export const packPagesFr: PackPagesCopy = {
  common: {
    doesHeading: "Ce que le logiciel fait",
    previewHeading: "Les écrans, avant de décider",
    previewBody:
      "Voici les écrans tels qu'ils sortiront chez vous. Le reçu porte votre nom dès que vous le tapez.",
    worriesHeading: "Ce qu'on nous demande",
    closingHeading: "Commencez par la première question",
    closingBody:
      "Il faut moins de vingt minutes, et vous voyez le résultat se régler à mesure que vous répondez.",
    soonHeading: "Ce métier n'est pas encore ouvert",
    soonBody: "Laissez votre numéro, nous vous prévenons le jour où il l'est.",
    pricing: "Voir les tarifs",
    otherTrades: "Les autres métiers",
    trial: "Essai gratuit de {days} jours",
  },

  pharmacy: {
    title: "Logiciel de gestion pour pharmacie, créé en ligne | OUAQT",
    description:
      "Créez le logiciel de votre pharmacie en répondant à quelques questions. Péremption, numéros de lot, vente à la boîte ou à la plaquette, crédit clients. Il fonctionne sans internet.",
    heading: "Le logiciel de votre pharmacie, fait à votre façon de travailler",
    intro:
      "Vous répondez à quelques questions sur votre officine et vous repartez avec le logiciel qui va avec : la vente à la boîte ou à la plaquette, les dates de péremption, les numéros de lot, et les comptes des clients qui paient plus tard. Il s'installe sur l'ordinateur du comptoir et travaille sans internet.",
    cta: "Créer le logiciel de ma pharmacie",
    does: [
      {
        title: "Vendre à la boîte ou à la plaquette",
        body: "Le prix suit l'unité que vous choisissez au comptoir, et le stock bouge des deux côtés sans calcul de tête.",
      },
      {
        title: "Les dates de péremption sous les yeux",
        body: "Chaque entrée porte sa date. Le logiciel vous montre ce qui approche de la fin avant que la boîte ne reste sur l'étagère.",
      },
      {
        title: "Les numéros de lot gardés",
        body: "Le lot est enregistré avec la boîte et se retrouve plus tard, sans ouvrir un classeur.",
      },
      {
        title: "Un stock qui se tient tout seul",
        body: "Chaque vente, chaque entrée et chaque retour laissent une trace. Le stock n'est jamais un chiffre tapé à la main.",
      },
      {
        title: "Les clients qui paient à la fin du mois",
        body: "Vous ouvrez un compte, vous notez ce qui est dû, et vous voyez d'un coup d'œil qui doit quoi.",
      },
      {
        title: "La caisse du soir en une minute",
        body: "Vous comptez le tiroir, le logiciel affiche ce qu'il attendait, et l'écart se voit tout de suite.",
      },
    ],
    worries: [
      {
        question: "Et si le courant saute en pleine vente ?",
        answer:
          "La vente est écrite sur le disque avant que l'écran ne passe à la suivante. Quand l'ordinateur redémarre, elle est là.",
      },
      {
        question: "Est-ce que mes ventes partent quelque part ?",
        answer:
          "Non. Vos ventes, votre stock et les comptes de vos clients restent sur vos ordinateurs. Nous ne les recevons jamais.",
      },
      {
        question: "Je n'ai pas le temps de saisir tous mes produits",
        answer:
          "Vous envoyez votre fichier Excel tel qu'il est, même en désordre, et le logiciel le lit. Vous vérifiez les premières lignes avant que rien ne soit gardé.",
      },
      {
        question: "Mon préparateur lit mieux l'arabe",
        answer:
          "L'écran de vente se met en arabe ou en français. La langue du logiciel se choisit séparément de la vôtre.",
      },
    ],
  },

  restaurant: {
    title: "Logiciel de caisse pour restaurant | OUAQT",
    description:
      "Le logiciel de caisse de votre restaurant : les tables, les commandes qui restent ouvertes pendant le repas, le ticket de cuisine et l'addition. Bientôt disponible.",
    heading: "Le logiciel de caisse de votre restaurant",
    intro:
      "Les tables de votre salle, les commandes qui restent ouvertes pendant que les clients mangent, le ticket qui part en cuisine, et l'addition à la fin. Sur l'ordinateur de la salle, sans internet.",
    cta: "Créer le logiciel de mon restaurant",
    does: [
      {
        title: "Votre salle telle qu'elle est",
        body: "Vos tables, dans vos zones : la salle, la terrasse, l'étage. Vous les retrouvez à l'écran comme vous les voyez depuis la caisse.",
      },
      {
        title: "Une commande qui reste ouverte",
        body: "Le client prend une entrée, puis un plat, puis un thé. Tout s'ajoute à la même table, et le paiement se fait une seule fois, à la fin.",
      },
      {
        title: "Le ticket de cuisine",
        body: "Ce qui est commandé sort imprimé en cuisine, avec le numéro de table, pour qu'on n'ait plus à crier d'un bout à l'autre de la salle.",
      },
      {
        title: "Qui a encaissé quoi",
        body: "Chaque serveur a son code. Le soir, vous voyez ce qui est passé par chacun.",
      },
      {
        title: "La caisse du soir",
        body: "Vous comptez le tiroir, le logiciel affiche ce qu'il attendait, et l'écart se voit tout de suite.",
      },
      {
        title: "L'addition à votre nom",
        body: "Le nom du restaurant, l'adresse et le téléphone, en français ou en arabe, sur une imprimante 80 mm.",
      },
    ],
    worries: [
      {
        question: "Et si le courant saute au milieu du service ?",
        answer:
          "Les commandes ouvertes sont écrites sur le disque à chaque ajout. Au redémarrage, les tables sont comme vous les avez laissées.",
      },
      {
        question: "Est-ce que mes chiffres partent quelque part ?",
        answer:
          "Non. Ils restent sur votre ordinateur. Nous ne les recevons jamais.",
      },
      {
        question: "Combien de tables peut-il tenir ?",
        answer:
          "De une à deux cents. Au-delà de vingt-quatre, elles se rangent par zone pour que l'écran reste lisible.",
      },
      {
        question: "Mes serveurs ne lisent pas le français",
        answer: "L'écran se met en arabe ou en français, au choix.",
      },
    ],
  },

  bakery: {
    title: "Logiciel de gestion pour boulangerie | OUAQT",
    description:
      "Le logiciel de votre boulangerie : la production du jour, les commandes à l'avance avec acompte, la vente au comptoir et le crédit des habitués. Bientôt disponible.",
    heading: "Le logiciel de votre boulangerie",
    intro:
      "Ce qui est sorti du four ce matin, ce qui a été vendu, ce qui reste, et les commandes que vos clients passent à l'avance. Sur l'ordinateur de la boutique, sans internet.",
    cta: "Créer le logiciel de ma boulangerie",
    does: [
      {
        title: "La production du jour",
        body: "Vous notez ce qui sort du four. Le soir, vous voyez ce qui est parti et ce qui reste, sans recompter les plateaux.",
      },
      {
        title: "Les commandes à l'avance",
        body: "Un client commande pour vendredi et laisse un acompte. La commande et l'acompte sont notés, et le reste à payer suit jusqu'à la livraison.",
      },
      {
        title: "Les habitués qui paient à la fin du mois",
        body: "Vous ouvrez un compte, vous notez ce qui est dû, et vous voyez qui doit quoi.",
      },
      {
        title: "La vente au comptoir",
        body: "L'écran est fait pour aller vite quand il y a du monde devant : les produits du jour d'abord, le reste à côté.",
      },
      {
        title: "La caisse du soir",
        body: "Vous comptez le tiroir, le logiciel affiche ce qu'il attendait, et l'écart se voit tout de suite.",
      },
      {
        title: "Le reçu à votre nom",
        body: "Le nom de la boulangerie, l'adresse et le téléphone, en français ou en arabe.",
      },
    ],
    worries: [
      {
        question: "Et si le courant saute ?",
        answer:
          "La vente est écrite sur le disque avant que l'écran ne passe à la suivante. Quand l'ordinateur redémarre, elle est là.",
      },
      {
        question: "Est-ce que mes chiffres partent quelque part ?",
        answer:
          "Non. Ils restent sur votre ordinateur. Nous ne les recevons jamais.",
      },
      {
        question: "Mes prix changent souvent",
        answer:
          "Vous changez un prix dans le logiciel, il s'applique à la vente suivante. Il n'y a aucun fichier à nous renvoyer.",
      },
      {
        question: "Mes vendeuses lisent mieux l'arabe",
        answer: "L'écran se met en arabe ou en français, au choix.",
      },
    ],
  },

  warehouse: {
    title: "Logiciel de gestion de stock pour dépôt | OUAQT",
    description:
      "Le logiciel de votre dépôt : les entrées, les sorties, plusieurs emplacements, et un stock qui se tient tout seul. Bientôt disponible.",
    heading: "Le logiciel de gestion de stock de votre dépôt",
    intro:
      "Ce qui entre, ce qui sort, et ce qui reste, emplacement par emplacement. Le stock n'est jamais un chiffre tapé à la main : il se déduit des mouvements. Sur votre ordinateur, sans internet.",
    cta: "Créer le logiciel de mon dépôt",
    does: [
      {
        title: "Les entrées et les sorties",
        body: "Chaque mouvement est noté avec sa date, sa quantité et la personne qui l'a fait. Rien ne bouge sans laisser de trace.",
      },
      {
        title: "Plusieurs emplacements",
        body: "Un dépôt ou vingt. Vous voyez le stock de chacun, et ce qui est passé de l'un à l'autre.",
      },
      {
        title: "Un stock qu'on peut expliquer",
        body: "Le stock est la somme des mouvements. Quand un chiffre vous surprend, vous remontez jusqu'à la ligne qui l'a fait bouger.",
      },
      {
        title: "L'inventaire sans arrêter le dépôt",
        body: "Vous comptez, vous saisissez ce que vous avez compté, et l'écart apparaît ligne par ligne.",
      },
      {
        title: "Les clients qui emportent maintenant et paient après",
        body: "Vous ouvrez un compte, vous notez ce qui est dû, et vous voyez qui doit quoi.",
      },
      {
        title: "Vos produits, lus depuis votre fichier",
        body: "Vous envoyez votre fichier Excel tel qu'il est et le logiciel le lit.",
      },
    ],
    worries: [
      {
        question: "Et si le courant saute ?",
        answer:
          "Le mouvement est écrit sur le disque avant que l'écran ne passe à la suite. Quand l'ordinateur redémarre, il est là.",
      },
      {
        question: "Est-ce que mes chiffres partent quelque part ?",
        answer:
          "Non. Ils restent sur votre ordinateur. Nous ne les recevons jamais.",
      },
      {
        question: "Combien de produits peut-il tenir ?",
        answer:
          "Plusieurs milliers. La recherche reste immédiate à cinq mille références.",
      },
      {
        question: "Mon magasinier lit mieux l'arabe",
        answer: "L'écran se met en arabe ou en français, au choix.",
      },
    ],
  },

  /* Written 2026-09-23 for the new trade. For Adel's review before it goes live. */
  shop: {
    title: "Logiciel de caisse pour boutique et épicerie | OUAQT",
    description: "Le logiciel de caisse de votre boutique : vente au code-barres ou en cases, stock, crédit des clients, caisse du soir. Bientôt disponible.",
    heading: "Le logiciel de caisse de votre boutique",
    intro: "Vous scannez ou vous touchez l'article, le client paie, le stock baisse tout seul. Le crédit des habitués et la caisse du soir sont au même endroit. Sur votre ordinateur, sans internet.",
    cta: "Créer le logiciel de ma boutique",
    does: [
      {
        title: "Vendre vite",
        body: "Le code-barres, le nom ou une case à toucher : l'article est sur le ticket en une seconde, avec la monnaie à rendre.",
      },
      {
        title: "Au poids ou à la pièce",
        body: "Le sucre au kilo, le lait à la boîte, sur le même ticket.",
      },
      {
        title: "Le stock qui se tient",
        body: "Chaque vente le baisse, chaque livraison le monte, et vous voyez ce qui manque avant qu'il ne manque.",
      },
      {
        title: "Le carnet de crédit",
        body: "Ce que chaque client doit, ligne par ligne, et ce qu'il a payé.",
      },
      {
        title: "La caisse du soir",
        body: "Vous comptez le tiroir, le logiciel affiche ce qu'il attendait, et l'écart se voit tout de suite.",
      },
      {
        title: "Bankily, Masrvi, Sedad",
        body: "Le paiement mobile est noté avec le nom de l'application, et les rapports les séparent.",
      },
    ],
    worries: [
      {
        question: "Et si le courant saute ?",
        answer: "Chaque vente est écrite sur le disque avant que l'écran ne passe à la suivante. Au redémarrage, elle est là.",
      },
      {
        question: "Est-ce que mes chiffres partent quelque part ?",
        answer: "Non. Ils restent sur votre ordinateur. Nous ne les recevons jamais.",
      },
      {
        question: "J'ai déjà ma liste d'articles dans Excel",
        answer: "Vous envoyez le fichier tel qu'il est, et le logiciel le lit.",
      },
    ],
  },
  /* Written 2026-09-23 for the new trade. For Adel's review before it goes live. */
  hotel: {
    title: "Logiciel de gestion pour hôtel et auberge | OUAQT",
    description: "Le logiciel de votre hôtel : le tableau des chambres, les réservations, l'arrivée et le départ, les extras sur la note. Bientôt disponible.",
    heading: "Le logiciel de gestion de votre hôtel",
    intro: "Vos chambres sur un seul écran, libres, occupées ou à nettoyer. La réservation, l'arrivée, les extras, et la note au départ. Sur l'ordinateur de la réception, sans internet.",
    cta: "Créer le logiciel de mon hôtel",
    does: [
      {
        title: "Le tableau des chambres",
        body: "Chaque chambre avec son état : libre, occupée, réservée pour aujourd'hui, à nettoyer.",
      },
      {
        title: "Les réservations",
        body: "Le nom du client, son téléphone, sa pièce d'identité et ses dates. Une chambre ne peut pas être donnée deux fois pour la même nuit.",
      },
      {
        title: "L'avance à la réservation",
        body: "Elle est notée, elle entre dans la caisse le jour où elle est payée, et elle est déduite de la note.",
      },
      {
        title: "Les extras sur la note",
        body: "Repas, boissons, blanchisserie : ajoutés à la chambre pendant le séjour, payés au départ.",
      },
      {
        title: "La note au départ",
        body: "Les nuits comptées toutes seules, les extras, l'avance déduite, et le reçu imprimé.",
      },
      {
        title: "Le taux d'occupation",
        body: "Combien de nuits vendues sur combien possibles, et ce que chaque mois a rapporté.",
      },
    ],
    worries: [
      {
        question: "Et si le courant saute ?",
        answer: "Chaque réservation et chaque paiement sont écrits sur le disque tout de suite. Au redémarrage, tout est là.",
      },
      {
        question: "Est-ce que les données de mes clients partent quelque part ?",
        answer: "Non. Elles restent sur votre ordinateur. Nous ne les recevons jamais.",
      },
      {
        question: "Mon réceptionniste lit l'arabe",
        answer: "L'écran se met en arabe ou en français, au choix.",
      },
    ],
  },
  /* Written 2026-09-23 for the new trade. For Adel's review before it goes live. */
  transport: {
    title: "Logiciel pour compagnie de transport et envoi de colis | OUAQT",
    description: "Le logiciel de votre compagnie de transport : les départs, les billets par place, les colis avec leur code, la liste des passagers. Bientôt disponible.",
    heading: "Le logiciel de votre compagnie de transport",
    intro: "Les départs du jour, les places vendues, les colis reçus et remis. Chaque billet et chaque colis est payé et noté. Sur l'ordinateur du guichet, sans internet.",
    cta: "Créer le logiciel de ma compagnie",
    does: [
      {
        title: "Les départs",
        body: "Chaque trajet avec son véhicule, son chauffeur et son heure, et combien de places il reste.",
      },
      {
        title: "Le billet par place",
        body: "Le nom du voyageur et son téléphone. Une place vendue ne peut pas l'être une deuxième fois.",
      },
      {
        title: "Les colis avec leur code",
        body: "L'expéditeur, le destinataire et un code que le destinataire donne au guichet d'arrivée.",
      },
      {
        title: "Payé au départ ou à l'arrivée",
        body: "Le colis se paie par l'expéditeur ou par le destinataire, comme vous faites déjà.",
      },
      {
        title: "La liste avant le départ",
        body: "Les passagers et les colis du trajet, imprimés pour le chauffeur.",
      },
      {
        title: "Ce que chaque ligne rapporte",
        body: "Billets et colis, trajet par trajet, jour par jour.",
      },
    ],
    worries: [
      {
        question: "Et si le courant saute ?",
        answer: "Chaque billet est écrit sur le disque avant d'être imprimé. Au redémarrage, il est là.",
      },
      {
        question: "Est-ce que mes chiffres partent quelque part ?",
        answer: "Non. Ils restent sur votre ordinateur. Nous ne les recevons jamais.",
      },
      {
        question: "Un voyageur annule",
        answer: "Le billet est annulé avec sa raison, la place redevient libre, et la caisse le sait.",
      },
    ],
  },
  /* Written 2026-09-23 for the new trade. For Adel's review before it goes live. */
  general: {
    title: "Logiciel de ventes, stock et rapports pour toute activité | OUAQT",
    description: "Un logiciel simple pour toute activité : les ventes, le stock si vous en avez, les dépenses, et les rapports du jour et du mois. Bientôt disponible.",
    heading: "Ventes, stock et rapports, pour votre activité",
    intro: "Un salon, un atelier, une société de services, un petit commerce : vous vendez, vous notez vos dépenses, et vous voyez ce que la journée et le mois ont rapporté. Vous gardez seulement ce qui vous sert.",
    cta: "Créer le logiciel de mon activité",
    does: [
      {
        title: "Produits et services",
        body: "Une coupe, une réparation, un article : tout se vend sur le même ticket.",
      },
      {
        title: "Le stock, si vous en avez",
        body: "Vous le suivez ou vous l'éteignez. Le logiciel ne montre que ce que vous utilisez.",
      },
      {
        title: "Les dépenses",
        body: "Le loyer, l'électricité, les salaires, notés avec leur catégorie.",
      },
      {
        title: "Le rapport du jour et du mois",
        body: "Ce qui est entré, ce qui est sorti, et ce qui reste.",
      },
      {
        title: "Le carnet de crédit",
        body: "Ce que chaque client doit, et ce qu'il a payé.",
      },
      {
        title: "La caisse du soir",
        body: "Vous comptez le tiroir, le logiciel affiche ce qu'il attendait, et l'écart se voit tout de suite.",
      },
    ],
    worries: [
      {
        question: "Mon activité n'est dans aucune liste",
        answer: "C'est pour elle. Vous répondez à trois questions et le logiciel se règle sur vos réponses.",
      },
      {
        question: "Est-ce que mes chiffres partent quelque part ?",
        answer: "Non. Ils restent sur votre ordinateur. Nous ne les recevons jamais.",
      },
      {
        question: "Et si le courant saute ?",
        answer: "Chaque vente est écrite sur le disque avant que l'écran ne passe à la suivante.",
      },
    ],
  },
};
