import type { Dictionary } from "./en";

export const fr: Dictionary = {
  meta: {
    siteTitle: "OUAQT | Le logiciel de gestion des PME, prêt en quelques minutes",
    siteDescription: "Avec le Builder d'OUAQT, les petites et moyennes entreprises créent en quelques minutes leur logiciel de caisse, de stock et de rapports. Il fonctionne sans internet et vos données restent chez vous.",
    projectsTitle: "Réalisations sur mesure : 22 systèmes en service | OUAQT",
    projectsDescription: "Mines, pharmacies, hôtels, transport, restaurants et écoles : les systèmes que nous avons construits sur mesure, et ce que chacun a changé.",
    aboutTitle: "À propos d'OUAQT et de son fondateur",
    aboutDescription: "OUAQT est une startup qui équipe les PME d'un logiciel de gestion : le Builder en ligne, et des projets sur mesure. Fondée par Elboumby Aumar Ramdhane.",
    contactTitle: "Contact | OUAQT",
    contactDescription: "Une question sur le Builder, une démonstration ou un projet sur mesure : écrivez-nous. Réponse en général sous un jour ouvré, par e-mail ou sur WhatsApp.",
    termsTitle: "Licence et conditions d'utilisation | OUAQT",
    termsDescription:
      "À qui appartient un logiciel OUAQT, ce que couvre votre licence et comment elle se renouvelle.",
    privacyTitle: "Politique de confidentialité | OUAQT",
    privacyDescription:
      "Ce qu'OUAQT fait des informations personnelles, sur ce site et dans les systèmes que nous construisons.",
    pricingTitle: "Tarifs : le Builder et les projets sur mesure | OUAQT",
    pricingDescription:
      "Les tarifs OUAQT au même endroit : le logiciel que vous créez en ligne, puis l'installation et la licence annuelle des projets sur mesure.",
    shareAlt: "OUAQT : le logiciel de gestion des PME, créé en quelques minutes avec le Builder.",
  },

  common: {
    brand: "OUAQT",
    founderName: "Elboumby Aumar Ramdhane",
    location: "Nouakchott, Mauritanie",
    headquarters: "Siège à Nouakchott, Mauritanie",
    linkedin: "LinkedIn",
    facebook: "Facebook",
    whatsapp: "WhatsApp",
    company: "Entreprise",
  },

  nav: {
    builder: "Le Builder",
    custom: "Sur mesure",
    projects: "Réalisations",
    pricing: "Tarifs",
    about: "À propos",
    contact: "Contact",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    language: "Langue",
    homeAria: "Accueil OUAQT",
  },

  proof: {
    body: "Les équipes de terrain de GMM rapprochaient les mouvements de blocs à la main, entre carnets papier et trois langues. Aujourd'hui, c'est le système qui s'en charge.",
    cta: "Voir comment nous avons fait",
    client: "GMM · Client minier",
    metric: "Rapprochement quotidien",
    before: "Avant",
    after: "Après",
    beforeValue: "4 heures",
    afterValue: "25 min",
    reduction: "90 % de réduction",
    reductionNote: "Sur le temps de rapprochement, chiffre confirmé par GMM.",
  },

  projectsPage: {
    eyebrow: "Réalisations sur mesure",
    heading: "22 systèmes construits sur mesure, utilisés chaque jour.",
    body: "Avant le Builder, il y a eu ces projets, et il y en a encore. Chacun commence par une visite : nous apprenons comment l'entreprise fonctionne, nous reprenons ses anciens registres, et nous installons le logiciel pour ce client seul. Mines, pharmacies, hôtels, transport, restaurants et écoles : en voici une sélection.",
    all: "Tous",
  },

  pricingPage: {
    /* The builder's own prices, read from settings, shown above the rest. */
    builderTrack: {
      eyebrow: "Le Builder",
      heading: "Vous le créez vous-même, vous l'installez le jour même",
      intro:
        "Vous répondez aux questions, vous téléchargez votre logiciel et vous l'installez sur l'ordinateur de la boutique. Personne ne se déplace, donc il n'y a pas de frais d'installation à payer : la licence seule suffit.",
      soon: "Tarif bientôt disponible",
      trial: "Essai gratuit de {days} jours avant de payer quoi que ce soit.",
      devices: "{devices} postes compris : la caisse et un deuxième ordinateur.",
      launchNote:
        "Tarif de lancement, réservé à nos {clients} premiers clients. Votre prix reste ensuite le même pendant {years} ans.",
      launchCondition:
        "Le tarif de lancement s'applique à nos {clients} premiers clients. Au-delà, c'est le tarif standard.",
      payment: "Paiement par Bankily, Masrvi, BimBank, SEDAD ou Click. Vous voyez le montant avant de payer.",
      cta: "Créer mon logiciel",
      monthly: "soit {amount} par mois",
      annual: { label: "Licence annuelle", cadence: "Par an" },
      semiannual: { label: "Licence semestrielle", cadence: "Tous les 6 mois" },
      perpetual: { label: "Licence définitive", cadence: "Payée une fois" },
      extraDevice: { label: "Poste supplémentaire", cadence: "Par an" },
      setupVisit: {
        label: "Visite d'installation, si vous la voulez",
        cadence: "Payée une fois",
      },
    },
    customTrack: {
      eyebrow: "Projet sur mesure",
      heading: "Ou nous venons l'installer, et nous construisons ce qui manque",
      intro:
        "Pour les métiers que le Builder ne couvre pas encore, et pour les entreprises qui veulent que nous venions faire le travail sur place.",
    },
    eyebrow: "Tarifs",
    heading: "Le logiciel que vous créez vous-même, et celui que nous construisons.",
    intro:
      "Le premier se crée en ligne, en quelques questions, et s'installe le jour même. Le second est construit et installé par nous, chez vous. Dans les deux cas le logiciel tourne sur vos propres ordinateurs et n'a pas besoin d'internet pour le travail de tous les jours.",
    freeVisit: "Avant tout engagement, notre première visite pour comprendre votre fonctionnement est gratuite.",
    scope:
      "Ces tarifs sont les mêmes pour tous les logiciels OUAQT prêts à installer.",
    launchScope:
      "Le tarif de lancement est réservé à nos {clients} premiers clients. Le montant barré est le tarif standard, celui que paieront tous les clients suivants.",
    standardLabel: "Tarif standard",
    launchLabel: "Tarif de lancement",
    installation: {
      label: "Installation, formation et reprise des données",
      cadence: "Payée une fois",
    },
    annual: {
      label: "Licence annuelle",
      cadence: "Par an",
      freeze:
        "Au tarif de lancement, ce montant ne bouge pas pendant {years} ans, et vous pouvez arrêter la licence chaque année.",
    },
    extraDevice: {
      label: "Poste supplémentaire au-delà des {devices} inclus",
      cadence: "Par an",
    },
    renewal:
      "La licence se renouvelle d'elle-même chaque année. Vous pouvez l'arrêter avant la date de renouvellement.",
    lateRenewal:
      "Si le renouvellement est payé en retard, la saisie de nouvelles données est suspendue jusqu'au paiement. La consultation et l'export de vos données ne sont jamais bloqués.",
    contact: "Nous contacter",
    whatsapp: "WhatsApp",
    products: "Ces tarifs valent pour {pharmacy}, {hotel}, {transport}, {restaurant}, les boulangeries, les ateliers et les dépôts.",
    productNames: {
      pharmacy: "les pharmacies",
      hotel: "les hôtels",
      transport: "le transport",
      restaurant: "les cafés et restaurants",
    },
    bespoke: {
      eyebrow: "Sur mesure",
      heading: "Un système construit pour votre seule entreprise",
      body: "Pour une mine, une grande société de transport ou tout travail qui dépasse le logiciel standard, nous construisons sur commande et chiffrons les jours de travail sur devis.",
      maintenance:
        "La maintenance annuelle représente {rate} de la valeur du développement et commence au {month}e mois.",
      cta: "Demander un devis",
    },
    perpetual: {
      eyebrow: "Licence perpétuelle",
      heading: "Pour ceux qui préfèrent ne pas payer chaque année",
      cadence: "Payée une fois, installation comprise",
      body: "Ce montant comprend les mises à jour, le catalogue produits, l'assistance et les modifications pendant {months} mois seulement. Passé ce délai, le logiciel continue de fonctionner sans rien payer de plus, et sans aucun service.",
      cta: "Nous contacter",
    },
    included: {
      heading: "Compris dans la licence",
      lead: "Tant que la licence est renouvelée. Les nouveaux modules n'en font pas partie.",
      items: [
        "L'installation sur {devices} postes au maximum, sur le même site",
        "Le transfert du logiciel sur une machine de remplacement après une panne, un vol ou un changement de matériel, sans frais tant que le total ne dépasse pas {devices} postes",
        "Les mises à jour",
        "Le catalogue produits, pour les logiciels qui en ont un",
        "L'assistance",
        "Les modifications de l'existant sur demande, comme un champ de formulaire, la mise en page d'un ticket ou d'une étiquette, une colonne de rapport, un ordre de tri, un format d'impression, un libellé, un rôle utilisateur ou un taux de taxe",
        "La correction de tout ce qui est faux ou lent dans ce que nous avons livré",
      ],
    },
    quoted: {
      heading: "Sur devis séparé",
      lead: "Un nouveau module, c'est un écran ou un processus qui n'existe pas encore.",
      items: [
        "La comptabilité",
        "La paie",
        "Une deuxième agence",
        "Les livraisons",
        "Une application mobile",
        "La connexion à un autre système",
      ],
    },
    decides:
      "Quand vous nous demandez quelque chose, nous vous disons avant de commencer s'il s'agit d'une modification ou d'un nouveau module.",
    faq: {
      eyebrow: "Questions",
      heading: "Ce que l'on nous demande avant de signer.",
      items: [
        {
          q: "Le logiciel a-t-il besoin d'une connexion internet ?",
          a: "Non. Il tourne sur vos propres ordinateurs, et le travail de tous les jours se fait sans connexion.",
        },
        {
          q: "Sur combien d'ordinateurs puis-je l'installer, et que se passe-t-il si une machine tombe en panne ou est remplacée ?",
          a: "Sur {devices} postes au maximum, sur le même site, et chaque poste supplémentaire s'ajoute à la licence annuelle. Si une machine tombe en panne, est volée ou remplacée, nous installons le logiciel sur la nouvelle sans frais, tant que le total ne dépasse pas {devices} postes.",
        },
        {
          q: "Où sont stockées mes données ?",
          a: "Sur vos propres ordinateurs, dans vos locaux. Elles ne partent pas chez nous, et la sauvegarde se fait sur vos propres supports.",
        },
        {
          q: "Que se passe-t-il si je ne renouvelle pas ?",
          a: "La saisie de nouvelles données est suspendue, et les mises à jour et l'assistance s'arrêtent. Vous pouvez toujours consulter et exporter tout ce qui est déjà enregistré.",
        },
        {
          q: "Puis-je payer en plusieurs fois ?",
          a: "Oui pour l'installation, en deux versements, le premier à la signature et le second à la mise en service. La licence, annuelle ou perpétuelle, se règle en une fois.",
        },
        {
          q: "Quelle est la différence entre une modification et un nouveau module ?",
          a: "Une modification change ce qui existe déjà, un format d'impression ou un taux de taxe par exemple, et la licence la couvre. Un nouveau module ajoute un écran ou un processus qui n'existe pas encore, et il fait l'objet d'un devis. Nous vous disons lequel des deux avant de commencer.",
        },
        {
          q: "Puis-je passer de la licence annuelle à la licence perpétuelle ?",
          a: "Oui, à tout moment. Nous déduisons du prix de la licence perpétuelle les frais d'installation déjà payés, mais pas les années de licence déjà réglées.",
        },
      ],
    },
  },

  legal: {
    updated: "Dernière mise à jour",
    updatedDate: "Septembre 2026",
    terms: {
      title: "Licence et conditions d'utilisation",
      intro:
        "Ces conditions couvrent deux choses différentes. La première partie concerne le logiciel que vous créez vous-même sur ce site. La deuxième concerne les projets que nous construisons et installons chez vous. La troisième vaut dans les deux cas.",
      selfServePart: {
        h: "Première partie : le logiciel que vous créez en ligne",
        b: "Cette partie s'applique dès que vous créez un logiciel sur ce site et recevez un numéro de série.",
      },
      trial: {
        h: "L'essai gratuit",
        b: "Votre logiciel s'essaie gratuitement pendant {trialDays} jours. L'essai commence la première fois que le logiciel s'ouvre sur votre ordinateur, pas le jour où vous le téléchargez. Pendant l'essai, tout fonctionne. À la fin, tant que rien n'est payé, le logiciel s'arrête et affiche la fenêtre de paiement. Vos données ne sont pas effacées : elles restent sur votre ordinateur, vous pouvez en enregistrer une copie depuis cette fenêtre, et tout se rouvre dès que le paiement est confirmé.",
      },
      selfLicence: {
        h: "Ce que vous achetez",
        b: "Vous n'achetez pas le logiciel, vous achetez le droit de l'utiliser dans votre entreprise, sur {devices} postes au maximum. La licence annuelle se renouvelle chaque année par tacite reconduction et reste résiliable avant la date de renouvellement. La licence trimestrielle fonctionne de la même façon, par trimestre. La licence définitive se paie une fois et ne se renouvelle pas.",
      },
      payment: {
        h: "Le paiement",
        b: "Le paiement se fait depuis Bankily, Masrvi, BimBank, SEDAD ou Click, au numéro indiqué sur ce site. Vous envoyez la capture d'écran de la confirmation avec votre numéro de série. Quand tout y correspond, le paiement est confirmé tout de suite et votre logiciel se rouvre de lui-même. Sinon, nous le confirmons à la main, en général le jour même. Si vous faites partie de nos {clients} premiers clients, le tarif de lancement appliqué à votre inscription reste le vôtre pendant {years} ans, même si nos tarifs changent entre-temps.",
      },
      grace: {
        h: "Si le renouvellement est payé en retard",
        b: "Votre licence ne s'arrête pas le jour de son échéance. Vous disposez de {graceDays} jours pendant lesquels le logiciel continue de fonctionner normalement, avec un rappel quotidien pour payer sur ce site. Passé ce délai, le logiciel passe en lecture seule, comme à la fin d'un essai. Dès que le paiement est confirmé, tout se rouvre immédiatement. Vos données ne sont jamais effacées, quel que soit le retard.",
      },
      devices: {
        h: "Vos postes",
        b: "Votre licence couvre {devices} ordinateurs. Si vous changez de machine, vous libérez l'ancienne depuis votre compte, dans la limite d'un nombre de libérations par an indiqué dans votre compte. Au-delà, écrivez-nous et nous le faisons pour vous. Réinstaller le logiciel sur le même ordinateur ne consomme pas de poste.",
      },
      selfData: {
        h: "Vos données ne nous parviennent pas",
        b: "Vos ventes, votre stock, vos mouvements et les comptes de vos clients restent sur vos ordinateurs. Nos serveurs ne les reçoivent pas, et aucune partie du logiciel ne les envoie. Ce que nous détenons se limite à ce qu'il faut pour créer votre logiciel et gérer votre licence : votre compte, vos réponses aux questions, la configuration qui en sort, votre logo, la liste de produits que vous avez importée au départ, vos numéros de série, vos postes et vos paiements.",
      },
      selfSupport: {
        h: "Ce que la licence comprend",
        b: "Les mises à jour du logiciel, l'assistance par WhatsApp, et la correction de ce qui ne fonctionne pas comme annoncé. L'installation est la vôtre : vous téléchargez et vous installez. Si vous préférez que nous venions le faire, c'est une visite d'installation facturée à part. La sauvegarde de vos données se fait sur vos propres supports et relève de vous : le logiciel vous aide à la faire, nous n'en conservons aucune copie.",
      },
      selfChanges: {
        h: "Ce que la licence ne comprend pas",
        b: "Un métier que le Builder ne couvre pas encore, ou une façon de travailler que ses questions ne prévoient pas, relève d'un projet sur mesure et fait l'objet d'un devis séparé.",
      },
      bespokePart: {
        h: "Deuxième partie : les projets que nous construisons et installons",
        b: "Cette partie s'applique aux systèmes que nous concevons et installons chez vous. Elle accompagne le contrat écrit de votre projet. En cas de divergence, votre contrat prévaut.",
      },
      licence: {
        h: "Votre licence d'utilisation",
        b: "Vous recevez une licence non exclusive pour utiliser le logiciel au sein de votre entreprise, sur {devices} postes au maximum sur un même site. La licence annuelle se renouvelle chaque année par tacite reconduction et reste résiliable avant la date de renouvellement. La licence perpétuelle se paie une fois et ne se renouvelle pas.",
      },
      corrections: {
        h: "Corrections",
        b: "Tant que la licence annuelle est renouvelée, nous corrigeons sans frais tout ce qui est faux ou lent dans ce que nous avons livré. Avec la licence perpétuelle, ces corrections sont comprises pendant {months} mois. Elles ne couvrent pas les modifications faites par un tiers, ni les pannes de matériel ou de réseau extérieures au logiciel.",
      },
      support: {
        h: "Ce que couvre la licence",
        b: "L'installation, la formation de vos employés et la reprise des données se paient une fois, par les frais d'installation ou par le prix de la licence perpétuelle. La licence annuelle comprend ensuite les mises à jour, le catalogue produits lorsque le logiciel en a un, l'assistance et les modifications de l'existant sur demande, tant qu'elle est renouvelée. La licence perpétuelle comprend les mêmes services pendant {months} mois seulement, après quoi le logiciel continue de fonctionner sans autre paiement et sans aucun service. Un nouveau module fait toujours l'objet d'un devis séparé, et nous vous indiquons avant de commencer si votre demande est une modification ou un nouveau module.",
      },
      yourData: {
        h: "Vos données restent les vôtres",
        b: "Tout ce que votre entreprise saisit dans le système, et tout ce que nous y migrons, vous appartient. Nous ne le vendons pas, nous ne l'utilisons que pour faire fonctionner et soutenir votre système, et nous ne le mélangeons jamais aux données d'un autre client. Demandez-en une copie quand vous voulez, nous vous la remettons.",
      },
      termination: {
        h: "Retard de renouvellement et fin de la licence",
        b: "Si la licence annuelle est renouvelée en retard, la saisie de nouvelles données est suspendue jusqu'au paiement. La consultation et l'export de vos données ne sont jamais bloqués. La licence peut aussi prendre fin si ces conditions sont gravement enfreintes et que la situation n'est pas corrigée après notre signalement. Dans tous les cas, nous vous remettons une copie complète de vos données.",
      },
      commonPart: {
        h: "Troisième partie : ce qui vaut dans les deux cas",
        b: "Les règles ci-dessous s'appliquent à tout logiciel OUAQT, quelle que soit la façon dont vous l'avez obtenu.",
      },
      ownership: {
        h: "Le logiciel nous appartient",
        b: "OUAQT est propriétaire du logiciel, de son code source, de sa conception et de sa documentation, ainsi que de tout ce qui y sera ajouté par la suite. Payer une licence ou un projet ne transfère pas cette propriété.",
      },
      restrictions: {
        h: "Ce que la licence n'autorise pas",
        b: "La licence est réservée à votre entreprise. À ce titre, vous ne pouvez pas :",
        items: [
          "vendre, louer, prêter ou céder le logiciel à un tiers",
          "en donner l'accès à une autre entreprise, y compris une société liée, sans notre accord écrit",
          "copier le logiciel ou l'installer sur plus de postes que votre licence n'en couvre",
          "le décomposer, le décompiler ou tenter d'en récupérer le code source",
          "retirer ou modifier une mention ou un nom OUAQT qu'il contient",
          "l'utiliser pour créer ou aider un produit concurrent",
        ],
      },
      law: {
        h: "Droit applicable",
        b: "Ces conditions relèvent du droit de la République Islamique de Mauritanie, et tout litige est porté devant les tribunaux de Nouakchott.",
      },
    },
    privacy: {
      title: "Politique de confidentialité",
      intro:
        "Ce qu'OUAQT détient à votre sujet, et ce qu'il n'a jamais. Cette page couvre ce site, le Builder qui s'y trouve, et les systèmes que nous installons chez vous.",
      collect: {
        h: "Ce que ce site collecte",
        b: "Sur les pages ordinaires, uniquement ce que vous saisissez dans le formulaire de contact : votre nom, votre adresse e-mail ou votre téléphone, votre message et la langue que vous lisiez. Ce site ne comporte ni traceur publicitaire ni outil d'analyse tiers.",
      },
      builder: {
        h: "Quand vous créez un logiciel",
        b: "Pour fabriquer votre logiciel et gérer votre licence, nous conservons : le compte que vous ouvrez, vos réponses aux questions, la configuration qui en résulte, le nom et les coordonnées de votre commerce tels qu'ils apparaîtront sur vos reçus, votre logo, la liste de produits que vous importez au départ, les noms de vos employés si vous les saisissez, vos numéros de série, les ordinateurs que vous activez et vos paiements. Quand vous téléchargez le logiciel, nous gardons aussi, pendant quelques heures, une marque brouillée de votre connexion à internet (jamais l'adresse elle-même) et le système choisi, pour que le logiciel reconnaisse son téléchargement et s'ouvre sans vous demander votre numéro. Cette marque est effacée dès qu'elle a servi.",
      },
      neverReceived: {
        h: "Ce que nous ne recevons jamais",
        b: "Une fois le logiciel installé, vos ventes, votre stock, vos mouvements et les comptes de vos clients restent sur vos ordinateurs. Nos serveurs ne les reçoivent pas et aucune partie du logiciel ne les envoie. La liste de produits que vous importez au départ sert à préparer votre logiciel ; ce que vous vendez ensuite ne nous parvient pas.",
      },
      ai: {
        h: "L'intelligence artificielle",
        b: "Quand vous décrivez votre façon de travailler avec vos propres mots, cette phrase peut être envoyée à un service d'intelligence artificielle pour être traduite en réglages, et sa proposition est ensuite vérifiée par nos règles avant d'être appliquée. La capture de votre paiement lui est aussi envoyée pour en relever le montant, la date et le numéro de la transaction. Ce service peut conserver ce qu'il reçoit et s'en servir pour améliorer ses produits. Rien d'autre ne lui est transmis : ni votre liste de produits, ni vos employés. Le Builder fonctionne entièrement sans cette fonction, et vos réponses par boutons ne passent jamais par elle.",
      },
      payments: {
        h: "Les paiements",
        b: "Vous payez avec Bankily, Masrvi, BimBank, SEDAD ou Click, directement depuis votre téléphone. Nous ne voyons jamais votre code secret. Nous conservons la capture que vous envoyez, ce qui y est relevé (le montant, la date et le numéro de la transaction) et le montant attendu, le temps de confirmer le paiement et de justifier votre licence.",
      },
      fingerprint: {
        h: "L'empreinte de votre ordinateur",
        b: "Pour qu'un même ordinateur ne prenne pas un essai gratuit après l'autre, le logiciel calcule une empreinte à partir de votre carte mère, de votre disque système et de l'identifiant de votre système d'exploitation. Il ne nous envoie que des empreintes chiffrées, jamais les numéros eux-mêmes, et nous ne pouvons pas remonter aux numéros à partir de ce que nous recevons. Cela sert à une seule chose : savoir si cette machine a déjà eu un essai. Si vous avez acheté votre ordinateur d'occasion, ou si vous l'avez fait réparer, écrivez-nous et nous vous ouvrons l'essai à la main.",
      },
      where: {
        h: "Où ces informations sont conservées",
        b: "Sur des serveurs situés en Irlande, chez notre hébergeur de base de données, et sur le réseau de Vercel qui sert ce site. L'un et l'autre travaillent pour nous et n'ont pas le droit d'utiliser vos informations à leurs propres fins.",
      },
      sharing: {
        h: "Qui d'autre y a accès",
        b: "Personne d'autre. Votre message de contact transite par le service qui achemine nos e-mails pour arriver dans notre boîte. Nous ne vendons jamais vos informations et nous ne les transmettons à personne à des fins commerciales.",
      },
      retention: {
        h: "Combien de temps nous les gardons",
        b: "Votre message de contact reste dans notre messagerie tant que l'échange est utile. Ce qui concerne votre logiciel et votre licence est conservé tant que votre compte existe, parce que c'est ce qui permet de réinstaller votre logiciel et de prouver ce que vous avez payé. Demandez la suppression de votre compte et nous l'effaçons.",
      },
      clientSystems: {
        h: "Les systèmes que nous installons nous-mêmes",
        b: "Quand nous concevons et installons un système pour votre entreprise, les données qu'il contient sont les vôtres, pas les nôtres. Elles restent sur vos propres ordinateurs, séparées de celles de tout autre client. Nous ne les consultons que si vous nous le demandez pour une assistance, jamais pour autre chose.",
      },
      rights: {
        h: "Vos droits",
        b: "Demandez ce que nous détenons à votre sujet, demandez-en une copie, ou demandez-nous de le supprimer. Écrivez à l'adresse ci-dessous et nous donnons suite.",
      },
      contact: {
        h: "Nous écrire",
        b: "Toute question sur cette politique, ou sur ce que nous détenons, à ouaqt.mrt@gmail.com.",
      },
    },
  },

  projectDetail: {
    back: "Toutes les réalisations",
    overview: "Aperçu",
    problem: "Le problème",
    solution: "Ce que nous avons construit",
    results: "Résultats",
    client: "Client",
    /* The same for every case study, so it is stored once. */
    roleValue: "Étude du travail sur place, conception du logiciel, reprise des anciens registres, installation",
    role: "Ce que nous avons fait",
    tools: "Ce qu'il contient",
    screenshotAlt: "capture d'écran du produit",
    /* Shown only on the case studies whose trade the builder covers. */
    builderNote: "Ce genre de logiciel se crée maintenant en ligne, en répondant à quelques questions.",
    builderNoteLink: "Voir le logiciel pour ce métier",
  },

  sectors: {
    Mining: "Mines",
    Pharmacy: "Pharmacie",
    Hospitality: "Hôtellerie",
    Transport: "Transport",
    Restaurant: "Restauration",
    Education: "Éducation",
  },

  about: {
    eyebrow: "À propos d'OUAQT",
    heading: "Une startup qui équipe les PME d'un logiciel à leur mesure.",
    body1:
      "Nous avons construit des systèmes sur mesure, un client à la fois : mines, pharmacies, hôtels, transport, restaurants, écoles. À chaque fois la même scène. Une entreprise solide, une équipe qui sait ce qu'elle fait, et le travail le plus important posé sur du papier, des tableurs et des groupes WhatsApp.",
    body2:
      "Et à chaque fois, la même découverte. Personne ne comprenait le problème mieux que le patron lui-même. Notre travail n'était pas de lui apprendre son métier, c'était de traduire ce qu'il savait déjà en un logiciel qui lui ressemble.",
    storyHeading: "Ce que nous avons fait de ce constat",
    storyBody1:
      "Un logiciel sur mesure demande des semaines et coûte cher. La plupart des commerces qui en auraient besoin ne peuvent ni attendre ni payer. Alors nous avons pris ce que nous avions appris chez chaque client et nous en avons fait le Builder, un créateur de logiciel en ligne : le patron répond à des questions sur sa façon de travailler, et il repart avec son logiciel, prêt à installer, le jour même.",
    storyBody2:
      "Ce n'est pas un modèle qu'on retouche après coup. C'est le même logiciel pour tout le monde, réglé par ses réponses à lui : ses produits, ses langues, ses employés, sa façon d'encaisser. Il tourne sur ses propres ordinateurs, sans internet, et ses chiffres ne nous parviennent jamais.",
    storyBody3:
      "Le Builder est aujourd'hui notre produit principal. Les métiers qu'il ne couvre pas encore, et les entreprises dont le travail sort du cadre, nous continuons à les construire sur mesure, comme avant.",
    marketHeading: "Les chiffres derrière ce constat.",
    stat1: "du PIB mauritanien passe par le secteur informel",
    stat2: "de la population active occupe un emploi informel",
    stat3: "Le Code des investissements donne désormais la priorité aux PME",
    marketNote: "La Banque mondiale et la SFI financent l'accès des petites entreprises de la région au crédit et aux outils numériques. OUAQT travaille sur le versant numérique de ce même problème.",
    founderEyebrow: "Fondateur",
    founderRole: "Fondateur & ingénieur solutions / ingénieur terrain",
    founderBio1: "J'ai lancé OUAQT parce que je rencontrais sans cesse des équipes compétentes qui perdaient des heures chaque jour sur un travail que leurs logiciels auraient dû faire à leur place. Compter le stock, recopier des chiffres d'un fichier à l'autre, vérifier deux fois les mêmes nombres. Les outils qu'elles avaient payés ne correspondaient pas à leur façon de travailler, alors les gens comblaient l'écart à la main.",
    founderBio2: "Je viens de l'analyse de données et du développement logiciel, et je construis sur place, avec les personnes qui vont utiliser le système. Je reste de la première conversation jusqu'au jour où plus personne n'ouvre l'ancien tableur. Chez un client, un rapprochement qui prenait quatre heures par jour se fait aujourd'hui en 25 minutes. Depuis, nous avons construit des systèmes pour des équipes dans les mines, la pharmacie, l'hôtellerie et le transport, partout en Mauritanie.",
    credentials: {
      analytics: {
        title: "Analyse de données chez Deloitte et MyAiPathways",
        detail: "Conseil et travail produit sur la façon dont les organisations collectent leurs données et s'en servent.",
      },
      snim: {
        title: "Automatisation des processus à la SNIM",
        detail: "Un processus qui prenait trois jours, ramené à huit heures, dans l'une des plus grandes entreprises industrielles de Mauritanie.",
      },
      undp: {
        title: "Lauréat de la Knowledge Future Skills Academy du PNUD, 2025",
        detail: "Sélectionné dans la cohorte régionale, puis invité comme conférencier principal au Knowledge Summit de Dubaï la même année.",
      },
      sectors: {
        title: "22 systèmes en service dans six secteurs",
        detail: "Mines, pharmacie, hôtellerie, transport, restauration et éducation, chaque système installé pour son client seul.",
      },
    },
    ctaHeading: "Qu'est-ce qui ralentit votre entreprise ?",
    ctaBody: "Si une partie de votre journée dépend encore d'un tableur dont personne n'est sûr, c'est en général par là que nous commençons.",
    ctaButton: "Parlons-en",
  },

  /*
   * The new home page: the builder first, custom projects second.
   * French is written first and the other two follow its meaning.
   */
  packLabels: {
    pharmacy: "Pharmacie",
    bakery: "Boulangerie",
    restaurant: "Restaurant ou café",
    warehouse: "Dépôt et stock",
    shop: "Boutique ou épicerie",
    hotel: "Hôtel ou auberge",
    transport: "Transport de voyageurs et de colis",
    general: "Autre activité : ventes, stock et rapports",
  },

  builderHome: {
    heroEyebrow: "Logiciels de gestion pour les PME",
    heroHeading: "Le logiciel de gestion de votre entreprise, prêt en quelques minutes.",
    heroBody: "OUAQT est une startup qui équipe les petites et moyennes entreprises. Avec le Builder, vous décrivez votre activité et vous repartez avec votre logiciel de caisse, de stock et de rapports, installé sur vos propres ordinateurs.",
    heroPrimary: "Créer mon logiciel",
    heroSecondary: "Essayer la démo",
    heroReassurance: "Sans internet · Vos données restent chez vous · Essai gratuit {days} jours",
    heroReassuranceNoTrial: "Sans internet · Vos données restent chez vous",
    heroShotAlt: "L'écran de caisse d'un café dans un logiciel OUAQT : une commande en cours, son total et le paiement.",
    heroChipOffline: "Fonctionne sans internet",
    heroChipOfflineLabel: "pour le travail de tous les jours",
    heroChipReady: "Prêt en moins de 5 minutes",

    impactMinutes: "Moins de 5 minutes",
    impactMinutesLabel: "pour créer votre logiciel",
    impactOffline: "Sans internet",
    impactOfflineLabel: "pour le travail de tous les jours",
    impactData: "Vos données",
    impactDataLabel: "restent sur vos ordinateurs",
    impactSystems: "22 systèmes",
    impactSystemsLabel: "en service chez nos clients",

    builderEyebrow: "Le Builder",
    builderHeading: "Le Builder construit votre logiciel à partir de vos réponses.",
    builderBody: "C'est le cœur d'OUAQT. Au lieu d'un logiciel générique qu'il faut apprendre, le Builder assemble le vôtre : vos produits, vos prix, votre façon d'encaisser, votre équipe et vos reçus.",
    builderStep1: "Décrivez votre activité",
    builderStep1Body: "Ce que vous vendez, comment vous encaissez, qui tient la caisse. Des questions simples, en français ou en arabe.",
    builderStep2: "Voyez-le fonctionner",
    builderStep2Body: "Le vrai logiciel tourne à côté des questions et change à chaque réponse. Vous l'essayez avant de le télécharger.",
    builderStep3: "Installez et commencez",
    builderStep3Body: "Téléchargez-le pour Windows ou Mac, activez-le avec votre numéro de série, et votre essai gratuit commence.",
    builderCta: "Créer mon logiciel",
    builderPricing: "Voir les tarifs",

    demoEyebrow: "Démo en direct",
    demoHeading: "Essayez-le ici. C'est le vrai logiciel.",
    demoBody: "Choisissez un métier, encaissez une vente, ouvrez le stock ou les rapports. Ce que vous voyez ici est ce que vous installerez.",
    demoLoading: "Ouverture du logiciel",
    demoNote: "Données d'exemple, pour essayer sans rien risquer.",
    demoPhone: "Sur un téléphone, la démo s'affiche en petit. Ouvrez cette page sur un ordinateur pour l'essayer vraiment.",
    demoShops: {
      pharmacy: "Pharmacie du Centre",
      bakery: "Boulangerie du Port",
      restaurant: "Café Le Palmier",
      warehouse: "Dépôt Central",
      shop: "Épicerie Al Amal",
      hotel: "Hôtel Les Dunes",
      transport: "Voyages Sahel Express",
      general: "Atelier Nour",
    },

    featuresEyebrow: "Dans chaque logiciel",
    featuresHeading: "Tout ce qu'il faut pour tenir votre entreprise au quotidien.",
    features: [
      { title: "Une caisse rapide", body: "Encaissez en quelques touches, en espèces ou par application, avec un reçu imprimé." },
      { title: "Le stock à jour", body: "Il baisse à chaque vente et vous prévient avant qu'un produit ne manque." },
      { title: "Des rapports clairs", body: "Le chiffre du jour, de la semaine et du mois, les meilleures ventes, et l'export pour Excel." },
      { title: "Le crédit client", body: "Les ventes à crédit et ce que chaque client vous doit, sans cahier." },
      { title: "La clôture de caisse", body: "À la fin de la journée ou du poste : ce qui devait être en caisse, et ce qui y est." },
      { title: "Des reçus à votre métier", body: "La table pour un restaurant, la chambre et les dates pour un hôtel, la place et le départ pour un billet." },
      { title: "Deux postes ensemble", body: "La caisse et un deuxième ordinateur travaillent ensemble sur votre réseau, sans internet." },
      { title: "Français et arabe", body: "Le logiciel parle la langue de votre équipe, reçus compris." },
    ],

    tradesEyebrow: "Métiers",
    tradesHeading: "Un logiciel pour chaque métier",
    tradesBody: "Chaque métier a ses écrans, ses questions et ses reçus. Choisissez le vôtre pour commencer.",
    tradesOpen: "Disponible",
    tradesSoon: "Bientôt disponible",
    tradesStart: "Commencer",
    tradesLearnMore: "En savoir plus",
    tradesNotifyMe: "Me prévenir",
    tradeLines: {
      pharmacy: "Péremptions, lots, fournisseurs et recherche par code-barres.",
      bakery: "Production du jour, commandes à l'avance et invendus.",
      restaurant: "Tables, envoi en cuisine, sur place, à emporter et livraison.",
      warehouse: "Entrées, sorties, emplacements et unités de vente.",
      shop: "Vente à la pièce ou au poids, code-barres et crédit client.",
      hotel: "Chambres, séjours, avances et extras.",
      transport: "Départs, places numérotées, billets et colis.",
      general: "Produits ou services, stock et dépenses.",
    },
    tradesOther: "Mon activité n'est pas dans la liste",
    tradesOtherBody: "Pas d'inquiétude, d'autres métiers arrivent. Dites-nous ce que vous faites et laissez votre numéro : nous vous rappelons.",
    tradesBusiness: "Votre activité",
    tradesBusinessPlaceholder: "Par exemple : quincaillerie, salon de coiffure, garage",
    tradesLeaveNumber: "Laissez votre numéro, nous vous prévenons.",
    tradesPhone: "Votre numéro de téléphone",
    tradesSend: "Me prévenir",
    tradesSendOther: "Envoyer",
    tradesThanks: "Merci. Nous vous écrivons dès que c'est prêt.",
    tradesOtherThanks: "Merci. Nous avons bien reçu votre demande et nous vous appelons très vite.",
    tradesError: "Votre numéro n'est pas parti. Réessayez, ou écrivez-nous sur WhatsApp.",

    whyEyebrow: "Pourquoi OUAQT",
    whyHeading: "Pensé pour les PME d'ici, et pour leur façon de travailler.",
    why: [
      { title: "Sans internet", body: "Le logiciel travaille sur vos ordinateurs. Internet ne sert qu'à l'installation, aux mises à jour et au paiement de la licence." },
      { title: "Vos données restent chez vous", body: "Vos ventes, votre stock et les comptes de vos clients ne quittent pas vos ordinateurs. Nous ne les recevons jamais." },
      { title: "Un paiement d'ici", body: "Par Bankily, Masrvi, BimBank, SEDAD ou Click, une fois par an ou tous les six mois. Vous voyez le montant avant de payer." },
      { title: "Une équipe qui répond", body: "Une question, un souci : écrivez-nous sur WhatsApp. Nous répondons en général le jour même, en français ou en arabe." },
    ],

    pricingEyebrow: "Tarifs",
    pricingHeading: "Des tarifs clairs, affichés avant de payer.",
    pricingBody: "Vous essayez d'abord gratuitement, puis vous choisissez votre licence. Pas de frais d'installation : vous installez vous-même, en quelques minutes.",
    pricingAnnual: "Licence annuelle",
    pricingPerYear: "par an",
    pricingMonthly: "soit {amount} par mois",
    pricingLaunch: "Tarif de lancement",
    pricingSoon: "Tarif bientôt disponible",
    pricingTrial: "Essai gratuit de {days} jours",
    pricingDevices: "{devices} postes compris",
    pricingUpdates: "Mises à jour et assistance comprises",
    pricingPayment: "Paiement par application mobile",
    pricingCta: "Voir tous les tarifs",

    customEyebrow: "Sur mesure",
    customHeading: "Un besoin qui sort du cadre ? Nous le construisons avec vous.",
    customBody: "C'est notre deuxième métier, et celui d'où vient le Builder. Pour les entreprises dont le travail ne rentre dans aucun modèle, nous venons sur place, nous comprenons votre façon de travailler et nous construisons le système qui lui correspond.",
    customStep1: "Une visite pour comprendre",
    customStep1Body: "Nous observons une journée ordinaire avec votre équipe. Cette première visite est gratuite.",
    customStep2: "Un système autour de votre routine",
    customStep2Body: "Il suit vos étapes et votre langue, et vos anciens registres sont repris.",
    customStep3: "Un suivi après la mise en service",
    customStep3Body: "Nous formons votre équipe et nous ajustons le système quand votre façon de travailler évolue.",
    customProjects: "Voir nos réalisations",
    customTalk: "Demander un devis",

    faqEyebrow: "Questions",
    faqHeading: "Les questions qu'on nous pose",
    faq1: "Le logiciel marche-t-il sans internet ?",
    faq1Body: "Oui. Il s'installe sur l'ordinateur de l'entreprise et travaille là. Internet ne sert qu'à l'installation, aux mises à jour et au paiement.",
    faq2: "Qui voit mes ventes et mes clients ?",
    faq2Body: "Vous seul. Vos ventes, votre stock et les comptes de vos clients restent sur vos ordinateurs. Nous ne les recevons jamais.",
    faq3: "Sur combien d'ordinateurs puis-je l'installer ?",
    faq3Body: "Deux : la caisse et un deuxième poste. Les deux fonctionnent sans internet et se mettent d'accord entre eux sur votre réseau.",
    faq4: "Que se passe-t-il à la fin de l'essai gratuit ?",
    faq4Body: "Le logiciel s'arrête et affiche la fenêtre de paiement. Vos données restent sur votre ordinateur, et vous pouvez en enregistrer une copie depuis cette fenêtre. Dès que la licence est payée, il se rouvre tout seul.",
    faq5: "Et si mon métier n'est pas dans la liste ?",
    faq5Body: "Dites-le-nous depuis la liste des métiers, avec votre numéro. D'autres métiers arrivent, et si votre besoin est particulier, nous pouvons le construire sur mesure.",
    faq6: "Et si j'ai besoin d'aide ?",
    faq6Body: "Écrivez-nous sur WhatsApp. Nous répondons en général le jour même, en français ou en arabe.",

    ctaHeading: "Équipez votre entreprise dès aujourd'hui.",
    ctaBody: "Quelques minutes de questions, et votre logiciel est prêt à installer. Pour un projet sur mesure, parlons-en d'abord.",
    ctaButton: "Créer mon logiciel",
    ctaTalk: "Parler à l'équipe",
    ctaWhatsapp: "Écrire sur WhatsApp",
  },

  contact: {
    eyebrow: "Contact",
    heading: "Parlons de votre entreprise.",
    body: "Une question sur le Builder, besoin d'aide pour l'installer, ou un projet sur mesure en tête : écrivez-nous avec vos mots. Nous répondons en général sous un jour ouvré. Pour un projet sur mesure, la première visite est gratuite.",
    whatsapp: "WhatsApp",
    form: {
      name: "Nom",
      namePlaceholder: "Votre nom complet",
      contact: "E-mail ou numéro WhatsApp",
      contactPlaceholder: "vous@entreprise.com ou +222 …",
      message: "Message",
      optional: "facultatif",
      messagePlaceholder: "Par exemple : nous notons chaque vente dans un cahier et nous comptons la caisse à la main tous les soirs.",
      hint: "Votre nom et un moyen de vous joindre suffisent. Ajoutez un message seulement si vous le souhaitez.",
      submit: "Envoyer le message",
      sending: "Envoi…",
      errorSend: "L'envoi a échoué. Réessayez, ou joignez-nous directement par e-mail ou sur WhatsApp.",
      successTitle: "Message bien reçu.",
      successBody: "Merci. Nous répondons en général sous un jour ouvré. Si c'est urgent, écrivez-nous sur WhatsApp.",
      sendAnother: "Envoyer un autre message",
      errorName: "Veuillez saisir votre nom.",
      errorContactEmpty: "Indiquez un e-mail ou un numéro WhatsApp pour que nous puissions vous répondre.",
      errorContactInvalid: "Cela ne ressemble ni à un e-mail ni à un numéro de téléphone. Pouvez-vous vérifier ?",
    },
  },

  footer: {
    tagline: "Le logiciel de gestion des PME, créé en quelques minutes avec le Builder, et construit sur mesure quand votre métier sort du cadre.",
    product: "Produit",
    company: "Entreprise",
    connect: "Nous joindre",
    brand: "OUAQT",
    rights: "Tous droits réservés.",
    terms: "Licence et conditions",
    privacy: "Politique de confidentialité",
  },

  notFound: {
    heading: "Nous ne trouvons pas cette page.",
    body: "Elle a peut-être changé d'adresse. Revenez à l'accueil, ou dites-nous ce que vous cherchiez.",
    cta: "Retour à l'accueil",
  },

  projects: {
    "gmm-mining": {
      metaTitle: "GMM : le rapprochement passé de 4 heures à 25 minutes",
      metaDescription: "Un suivi des blocs en trois langues qui a ramené le rapprochement quotidien de quatre heures à vingt-cinq minutes, sur le site de la mine.",
      title: "GMM Suivi des blocs & rapprochement",
      summary: "Un suivi des blocs en trois langues qui a ramené le rapprochement quotidien de quatre heures à vingt-cinq minutes.",
      description: "Chaque jour, GMM passait quatre heures à rapprocher les mouvements de blocs à la main. Nous avons remplacé ce travail par un système construit autour de la façon dont les équipes de terrain travaillent déjà, dans les trois langues qu'elles utilisent.",
      client: "GMM · Mines",
      problem: "Rapprocher les mouvements de blocs de la journée prenait quatre heures, à la main, entre carnets papier et tableurs. Les équipes écrivaient en français, en arabe ou en anglais selon qui était de service, et rien ne concordait vraiment en fin de journée.",
      solution: "Un système de suivi et de rapprochement construit autour de la routine réelle des équipes. Il fonctionne dans les trois langues dès le premier jour, parce que c'est ainsi que les équipes notent déjà leurs données. Nous avons repris des années de registres, pour que l'équipe démarre avec tout son historique et non avec un système vide.",
      tags: [
        "Rapprochement",
        "Français, arabe, anglais",
        "Anciens registres repris",
      ],
      tools: [
        "Organisé autour des registres de blocs de GMM",
        "Des années d'historique reprises",
        "Écrans en français, en arabe et en anglais",
        "Installé pour GMM seul",
      ],
      results: [
        "Rapprochement quotidien ramené de 4 heures à 25 minutes",
        "90 % de temps de rapprochement en moins, confirmé par GMM",
        "Utilisé en français, en arabe et en anglais par des équipes mixtes",
      ],
    },
    "pharmacy-pos": {
      metaTitle: "Logiciel de pharmacie : registres remplis tout seuls",
      metaDescription: "Une caisse de pharmacie qui remplit les registres de médicaments à la place du personnel. Le même logiciel se crée maintenant en ligne, en quelques questions.",
      title: "Caisse & registres de pharmacie",
      summary: "Une caisse de pharmacie qui remplit toute seule les registres de médicaments, pour que le personnel arrête de les retaper.",
      description: "Tenir les registres de médicaments, c'était des heures de la même saisie chaque jour. Le système les remplit maintenant à partir de l'historique de la pharmacie, et le personnel ne s'occupe plus que des cas particuliers.",
      client: "Pharmacie indépendante",
      problem: "Le personnel passait des heures chaque jour à saisir les registres à la main, en retapant sans cesse les mêmes informations produit. Chaque saisie était une chance de plus d'inscrire un mauvais chiffre dans un registre qui doit être juste.",
      solution: "Une caisse qui remplit les registres de médicaments à partir des saisies passées. Le logiciel prend en charge la répétition, et le personnel garde les cas particuliers et les décisions, la partie qui demande vraiment une personne.",
      tags: [
        "Caisse",
        "Registres remplis automatiquement",
        "Stock",
      ],
      tools: [
        "Organisé autour des registres de la pharmacie",
        "Des années d'historique reprises",
        "Registres remplis à partir des saisies passées",
        "Installé pour cette pharmacie seule",
      ],
      results: [
        "Deux à trois heures de saisie gagnées chaque jour, plus de 60 heures par mois",
        "Plus de 90 % d'erreurs de saisie en moins",
        "Registres remplis à partir de l'historique de la pharmacie",
      ],
    },
    "hotel-operations": {
      metaTitle: "Facturation d'hôtel : taxes et commissions calculées",
      metaDescription: "Une facturation d'hôtel où le logiciel calcule les taxes et les commissions sur chaque facture, au lieu de les reprendre à la main.",
      title: "Facturation & exploitation hôtelière",
      summary: "Une facturation d'hôtel où le logiciel calcule les taxes et les commissions sur chaque facture.",
      description: "Calculer les taxes et les commissions à la main causait sans cesse des erreurs de facturation. Le système applique les règles de l'hôtel, de la même façon, sur chaque facture.",
      client: "Hôtel · Hôtellerie",
      problem: "Les taxes et les commissions sur plusieurs services étaient calculées à la main. Des calculs minutieux et répétitifs sur chaque ligne de chaque facture, et une source régulière d'erreurs.",
      solution: "Un système de facturation et d'exploitation qui suit les vraies règles de taxes et de commissions de l'hôtel, pour que chaque ligne soit calculée de la même façon, quelle que soit la personne à la réception.",
      tags: [
        "Facturation",
        "Taxes & commissions",
        "Exploitation au quotidien",
      ],
      tools: [
        "Organisé autour des registres de l'hôtel",
        "Facturation qui suit les règles de l'hôtel",
        "Des années d'historique reprises",
        "Installé pour cet hôtel seul",
      ],
      results: [
        "Plus de 90 % d'erreurs de facturation en moins",
        "Environ deux heures de calcul en moins par jour à la réception, près de 50 heures par mois",
        "Taxes et commissions appliquées de la même façon sur chaque ligne",
      ],
    },
    "transport-manifests": {
      metaTitle: "Manifestes de transport préparés automatiquement",
      metaDescription: "Des manifestes de contrôle préparés à partir des données du voyage, au lieu d'une heure de paperasse avant chaque départ.",
      title: "Manifestes de transport & points de contrôle",
      summary: "Des manifestes de contrôle préparés à partir des données du voyage, au lieu d'une heure de paperasse avant chaque départ.",
      description: "Chaque voyage demandait environ une heure de paperasse avant que le véhicule puisse partir. Le système prépare maintenant ces documents à partir des informations que la société a déjà.",
      client: "Opérateur de transport",
      problem: "Chaque voyage demandait près d'une heure de travail à la main pour préparer les manifestes de contrôle. Ces documents doivent être exacts pour qu'un véhicule puisse partir, et ils étaient refaits à la main à chaque fois.",
      solution: "Un système qui prépare les manifestes à partir des informations de voyage et de chargement déjà saisies. Avant le départ, le personnel vérifie les documents au lieu de les rédiger.",
      tags: [
        "Points de contrôle",
        "Manifestes",
        "Voyages",
      ],
      tools: [
        "Organisé autour des registres de voyages de la société",
        "Manifestes préparés automatiquement",
        "Des années d'historique reprises",
        "Installé pour cette société seule",
      ],
      results: [
        "Paperasse avant départ ramenée d'une heure par voyage à quelques minutes",
        "Plus de 90 % d'erreurs de paperasse en moins aux points de contrôle",
        "Manifestes construits à partir des informations déjà dans le système",
      ],
    },
    "school-operations": {
      metaTitle: "SchoolOS : élèves, frais et présences au même endroit",
      metaDescription: "Un seul système pour les élèves, les enseignants, les frais, les présences et la boutique de l'école, qui fonctionne sans internet.",
      title: "SchoolOS, dossiers élèves et scolarité",
      summary: "Un seul système pour les élèves, les enseignants, les frais, les présences et la boutique de l'école, qui fonctionne sans internet sur les ordinateurs de l'école.",
      description: "Un groupe scolaire privé suivait les inscriptions, les frais, les présences et les ventes de la boutique dans des registres et des tableurs séparés. SchoolOS réunit tout au même endroit, sur les ordinateurs que le personnel utilise déjà.",
      client: "Écoles Al-Baraka · Éducation",
      problem: "Les dossiers des élèves, les frais, les présences et la caisse de la boutique étaient chacun tenus ailleurs. Pour répondre à une question simple, comme savoir quelles familles devaient encore des frais, il fallait recouper plusieurs registres à la main. Et les présences n'étaient à jour que jusqu'à la dernière recopie.",
      solution: "Un seul système pour les élèves, les enseignants, les frais, les présences, les finances et la caisse de la boutique. Il s'installe sur les ordinateurs de l'école et y garde ses données, donc il continue de fonctionner quand internet coupe. Sur un campus où l'on ne peut pas compter sur la connexion, ça compte.",
      tags: [
        "Dossiers élèves",
        "Frais de scolarité",
        "Présences",
      ],
      tools: [
        "Installé sur les ordinateurs de l'école",
        "Données gardées dans l'école",
        "Fonctionne sans internet",
        "Installé pour ce groupe scolaire seul",
      ],
      results: [
        "Deux à trois heures d'administratif gagnées chaque jour, plus de 60 heures par mois",
        "Plus de 90 % d'erreurs en moins sur les frais et les présences",
        "Fonctionne sans internet sur les ordinateurs de l'école",
      ],
    },
    "restaurant-pos": {
      metaTitle: "Caisse restaurant, café et boulangerie",
      metaDescription: "Une caisse pensée pour le vrai rythme de la salle, au service à table comme au comptoir. Bientôt disponible dans le Builder d'OUAQT.",
      title: "Caisse restaurant & café",
      summary: "Une caisse pensée pour le vrai rythme de la salle, au service à table comme au comptoir de la boulangerie.",
      description: "Les commandes, la cuisine et la recette du jour étaient suivies à trois endroits différents. La caisse réunit tout et s'adapte au rythme de chaque établissement.",
      client: "Restaurant, café & boulangerie",
      problem: "Les commandes, la cuisine et la recette du jour étaient tenues séparément. Des tickets papier, un tiroir-caisse, et un tableur à faire concorder à la fermeture. Rien ne tombait juste tant que quelqu'un ne s'asseyait pas pour tout vérifier.",
      solution: "Une caisse faite pour cette entreprise, qui couvre les commandes, la cuisine et le rapport du jour, réglée pour chaque établissement. Y compris le comptoir de la boulangerie, où les produits et le rythme n'ont rien à voir avec le service à table.",
      tags: [
        "Caisse",
        "Commandes cuisine",
        "Rapport du jour",
      ],
      tools: [
        "Organisé autour de la carte et des ventes du restaurant",
        "Écrans de caisse pour le personnel",
        "Rapport des ventes du jour",
        "Installé pour cette entreprise seule",
      ],
      results: [
        "Comptage de fermeture ramené de plus d'une heure à quelques minutes chaque soir",
        "La recette correspond à la caisse sans vérification à la main, plus de 90 % d'erreurs en moins",
        "Commandes, cuisine et rapports du jour dans un seul système",
      ],
    },
  },
};
