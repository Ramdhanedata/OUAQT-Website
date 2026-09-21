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
};
