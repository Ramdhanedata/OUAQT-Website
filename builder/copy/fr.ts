/*
 * Builder copy. French is the reference: it is written first, and the other
 * languages follow from its meaning.
 *
 * Kept apart from the marketing dictionaries in lib/i18n so the builder can
 * grow to hundreds of strings without weighing those files down.
 */
export const fr = {
  nav: "Créer mon logiciel",

  landing: {
    title: "Créez le logiciel de votre commerce",
    intro:
      "Répondez à quelques questions sur votre commerce. Vous repartez avec votre logiciel, prêt à installer sur l'ordinateur de la boutique.",
    duration: "10 à 20 minutes",
    noAccount: "Pas besoin de compte pour commencer",
    steps: [
      "Votre commerce, votre nom et votre logo",
      "Quelques questions sur votre façon de travailler",
      "Vos produits et vos employés, si vous les avez sous la main",
      "Votre numéro de série et le téléchargement",
    ],
    start: "Commencer",
    resume: "Reprendre où vous en étiez",
  },

  shell: {
    stepOf: "Étape {current} sur {total}",
    back: "Retour",
    next: "Continuer",
    preview: "Voir mon logiciel",
    previewTitle: "Votre logiciel",
    previewEmpty:
      "Votre reçu et votre écran de vente apparaîtront ici dès que vous aurez répondu.",
    close: "Fermer",
    help: "Aide sur WhatsApp",
    helpMessage: "Bonjour, j'ai besoin d'aide à l'étape {step} ({name}).",
    saved: "Vos réponses sont enregistrées",
    offline:
      "Hors connexion, vos réponses seront envoyées dès le retour du réseau.",
  },

  steps: {
    business: "Votre commerce",
    questions: "Questions",
    products: "Produits et employés",
    serial: "Votre numéro de série",
  },

  packs: {
    heading: "Quel est votre commerce ?",
    pharmacy: "Pharmacie",
    bakery: "Boulangerie",
    restaurant: "Restaurant ou café",
    warehouse: "Dépôt et stock",
    shop: "Boutique ou épicerie",
    hotel: "Hôtel ou auberge",
    transport: "Transport de voyageurs et de colis",
    general: "Autre activité : ventes, stock et rapports",
    soon: "Bientôt disponible",
    other: "Mon activité n'est pas dans la liste",
  },

  lead: {
    heading: "Dites-nous ce que vous faites",
    business: "Votre activité",
    businessHelp: "Par exemple : quincaillerie, salon de coiffure, atelier.",
    phone: "Votre numéro de téléphone",
    submit: "Envoyer",
    thanks: "Merci. Nous vous prévenons dès que votre activité est prête.",
    error: "Votre message n'est pas parti. Réessayez, ou écrivez-nous sur WhatsApp.",
  },

  language: {
    heading: "Dans quelle langue voulez-vous répondre ?",
    appHeading: "Et dans quelle langue vos employés utiliseront-ils le logiciel ?",
    fr: "Français",
    ar: "العربية",
    en: "English",
  },

  name: {
    heading: "Le nom de votre commerce",
    latin: "En lettres latines",
    latinHelp: "C'est le nom qui apparaît en haut du reçu.",
    arabic: "En arabe, si vous voulez",
    arabicHelp: "Il s'ajoute sous le premier nom, sur le reçu.",
    required: "Écrivez le nom de votre commerce pour continuer.",
  },

  receiptDetails: {
    heading: "Ce qui apparaît sur le reçu",
    help: "Les deux sont facultatifs. Vous pourrez les changer plus tard.",
    phone: "Votre téléphone",
    address: "Votre adresse",
  },

  logo: {
    heading: "Votre logo",
    help: "Facultatif. Prenez-le en photo ou choisissez un fichier. Il reste sur votre téléphone, nous n'envoyons que l'image préparée.",
    choose: "Choisir une image",
    replace: "Changer l'image",
    remove: "Enlever le logo",
    working: "Préparation de votre logo",
    colour: "Sur l'écran",
    mono: "Sur le reçu imprimé",
    errorType: "Choisissez une image PNG ou JPEG.",
    errorUnreadable: "Cette image n'a pas pu être lue. Essayez-en une autre.",
    errorTooBig: "Cette image est trop lourde même après préparation. Essayez-en une autre.",
  },

  preview: {
    sale: "Écran de vente",
    receipt: "Reçu",
    intro: "Voici votre logiciel avec ce que vous venez d'écrire.",
    tables: "Les tables",
    kitchen: "Ticket cuisine",
    production: "Production",
    moves: "Entrées et sorties",
  },

  save: {
    saving: "Enregistrement",
    saved: "Enregistré",
    failed: "Pas encore enregistré. Nous réessayons.",
    unavailable: "Vos réponses restent sur cet appareil pour le moment.",
  },

  interview: {
    dontKnow: "Je ne sais pas",
    explain: "Expliquer avec mes mots",
    explainHelp: "Dites-le comme vous l'expliqueriez à un nouvel employé.",
    send: "Envoyer",
    sending: "Un instant",
    noted: "Cette fonction n'est pas encore disponible. Nous l'avons notée.",
    yes: "Oui",
    no: "Non",
    questionOf: "Question {current} sur {total}",
  },

  summary: {
    heading: "Vérifiez avant de continuer",
    intro: "Voici ce que votre logiciel fera. Vous pourrez tout changer plus tard.",
    edit: "Modifier",
    business: "Votre commerce",
    answers: "Vos réponses",
  },

  products: {
    heading: "Vos produits",
    help: "Facultatif. Vous pourrez les ajouter plus tard dans le logiciel.",
    template: "Télécharger le modèle",
    choose: "Choisir mon fichier",
    reading: "Lecture de votre fichier",
    ready: {
      one: "{count} produit prêt.",
      other: "{count} produits prêts.",
    },
    toFix: {
      one: "{count} ligne à corriger.",
      other: "{count} lignes à corriger.",
    },
    problem: "Ligne {row} : {what} Vérifiez la colonne {column}.",
    missingName: "nom manquant.",
    missingPrice: "prix manquant.",
    badPrice: "prix illisible.",
    badQuantity: "quantité illisible.",
    badExpiry: "date de péremption illisible.",
    missingColumns: "Nous n'avons pas trouvé les colonnes du nom et du prix. Utilisez le modèle, ou renommez vos colonnes.",
    truncated: "Seules les 10 000 premières lignes ont été lues.",
    keep: "Garder ces produits",
    skip: "Passer cette étape",
    zeroPrice: "prix à zéro.",
    negativePrice: "prix négatif.",
    pastExpiry: "Ligne {row} : la date de péremption est déjà passée ({found}). Vérifiez, ou importez quand même.",
    headerFound: "Nous avons trouvé vos colonnes à la ligne {row}.",
    totalsSkipped: "{count} ligne de total ignorée.",
    totalsSkippedOther: "{count} lignes de total ignorées.",
    whichSheet: "Quelle feuille contient vos produits ?",
    sheetRows: "{count} lignes",
    whichColumn: "Quelle colonne contient {what} ?",
    columnName: "le nom du produit",
    columnPrice: "le prix",
    columnQuantity: "la quantité",
    columnExpiry: "la date de péremption",
    columnBatch: "le numéro de lot",
    noColumn: "Aucune",
    preview: "Voici vos cinq premiers produits, tels qu'ils seront importés.",
    confirm: "C'est bon, importer",
    currencyQuestion: "Vos prix sont-ils en nouvelles ouguiyas (MRU) ou en anciennes ouguiyas ?",
    currencyNew: "Nouvelles ouguiyas (MRU)",
    currencyOld: "Anciennes ouguiyas",
    currencyCheck: "En anciennes ouguiyas, ces prix deviennent :",
    duplicates: "Ces produits apparaissent deux fois.",
    keepFirst: "Garder un seul",
    keepAll: "Ce sont deux produits différents",
    mergeQuantities: "Additionner les quantités",
    fixRow: "Corriger",
    unreadable: "Nous n'avons pas pu lire ce fichier. Envoyez un fichier Excel ou CSV, pas une photo ni un PDF, et sans mot de passe. Vous pouvez aussi partir de notre modèle.",
    another: "Choisir un autre fichier",
  },

  staff: {
    heading: "Vos employés",
    help: "Facultatif. Le code de chacun se choisit plus tard, dans le logiciel.",
    name: "Nom",
    role: "Rôle",
    manager: "Gérant",
    cashier: "Caissier",
    add: "Ajouter",
    remove: "Enlever",
    empty: "Personne pour l'instant.",
  },

  account: {
    heading: "Créez votre compte",
    intro: "Pour retrouver votre logiciel et votre numéro de série depuis n'importe quel téléphone.",
    phone: "Votre numéro de téléphone",
    password: "Votre mot de passe",
    passwordHelp: "Au moins huit caractères.",
    terms: "J'accepte les conditions d'utilisation",
    termsLink: "Lire les conditions",
    create: "Créer mon compte",
    creating: "Un instant",
    errorPhone: "Écrivez un numéro de téléphone valide.",
    errorPassword: "Votre mot de passe doit faire au moins huit caractères.",
    errorTerms: "Acceptez les conditions pour continuer.",
    errorTaken: "Ce numéro a déjà un compte.",
    errorGeneric: "Votre compte n'a pas pu être créé. Réessayez, ou écrivez-nous sur WhatsApp.",
  },

  serial: {
    heading: "Votre numéro de série",
    intro: "Gardez-le. Il vous servira à installer votre logiciel sur l'ordinateur du commerce.",
    copy: "Copier",
    copied: "Copié",
    share: "Partager sur WhatsApp",
    shareMessage: "Mon numéro de série : {serial}. Téléchargement : {url}",
    windows: "Télécharger pour Windows",
    mac: "Télécharger pour Mac",
    soon: "Le logiciel à installer sera bientôt disponible. Gardez votre numéro de série.",
    onPhone: "Pour installer, ouvrez cette adresse sur l'ordinateur du commerce :",
    tutorialWindows: "Voir la vidéo d'installation sur Windows",
    tutorialMac: "Voir la vidéo d'installation sur Mac",

    /* On the shop PC itself: install, then open, and never type the serial. */
    pcHeading: "Votre logiciel est prêt",
    downloadInstall: "Télécharger et installer",
    alsoMac: "Vous êtes sur Mac ? Télécharger pour Mac",
    alsoWindows: "Vous êtes sur Windows ? Télécharger pour Windows",
    keepNumber: "Gardez ce numéro : il vous servira pour un deuxième poste ou une réinstallation.",
    windowsWarning:
      "Windows peut afficher « Windows a protégé votre ordinateur ». Cliquez sur « Informations complémentaires », puis sur « Exécuter quand même ».",
    macWarning:
      "Ouvrez le fichier, glissez OUAQT dans Applications, puis faites un clic droit sur OUAQT et choisissez « Ouvrir ».",
    afterInstall: "Une fois le logiciel installé :",
    open: "Ouvrir mon logiciel",
    opening: "Ouverture…",
    macOpenFirst: "Sur Mac, ouvrez d'abord le logiciel une fois depuis Applications, puis appuyez sur ce bouton.",
    openFallback: "Si rien ne s'ouvre, tapez votre numéro de série dans le logiciel : il vous le demandera.",
    openFailed: "Le lien n'a pas pu être préparé. Tapez votre numéro de série dans le logiciel.",
  },

  myAccount: {
    title: "Mon compte",
    signInHeading: "Ouvrir mon compte",
    signIn: "Ouvrir mon compte",
    signOut: "Fermer la session",
    signInError: "Numéro ou mot de passe incorrect.",
    mySoftware: "Mon logiciel",
    mySubscription: "Mon abonnement",
    myDevices: "Mes postes",
    myRequests: "Mes demandes",
    edit: "Modifier mon logiciel",
    noBusiness: "Vous n'avez pas encore créé votre logiciel.",
    start: "Créer mon logiciel",
    soon: "Cette partie arrive bientôt. Écrivez-nous sur WhatsApp si vous avez besoin de quelque chose.",
    noRequests: "Aucune demande pour l'instant.",
  },

  licence: {
    notStarted: "Votre essai commencera quand vous installerez le logiciel sur l'ordinateur du commerce.",
    trial: {
      one: "Essai gratuit, {count} jour restant.",
      other: "Essai gratuit, {count} jours restants.",
    },
    trialOver: "Votre essai est terminé. Le logiciel garde tout ce que vous avez enregistré, mais n'accepte plus de nouvelles ventes. Le paiement débloque tout, tout de suite.",
    active: "Licence active jusqu'au {date}.",
    renewalDue: {
      one: "Votre licence a pris fin. Il vous reste {count} jour avant que le logiciel passe en lecture seule.",
      other: "Votre licence a pris fin. Il vous reste {count} jours avant que le logiciel passe en lecture seule.",
    },
    expired: "Votre licence a pris fin. Le logiciel garde tout ce que vous avez enregistré, mais n'accepte plus de nouvelles ventes. Le paiement débloque tout, tout de suite.",
    suspended: "Votre licence est suspendue. Écrivez-nous sur WhatsApp.",
    pending: "Paiement reçu, en cours de vérification. Vous pouvez continuer à utiliser votre logiciel.",
    rejected: "Votre dernier paiement n'a pas pu être validé.",
  },

  pay: {
    heading: "Payer ma licence",
    amount: "Montant à payer",
    perMonth: "soit {amount} par mois",
    wasPrice: "Tarif habituel",
    number: "Numéro Bankily d'OUAQT",
    copyNumber: "Copier le numéro",
    copied: "Copié",
    step1: "Envoyez le montant depuis Bankily au numéro ci-dessus.",
    step2: "Prenez une capture d'écran de la confirmation.",
    step3: "Envoyez-la ici, avec le numéro de la transaction.",
    screenshot: "La capture d'écran",
    choose: "Choisir la capture",
    replace: "Changer la capture",
    reference: "Le numéro de la transaction",
    referenceHelp: "Il est écrit sur la confirmation Bankily.",
    send: "Envoyer mon paiement",
    sending: "Envoi",
    soonPrice: "Tarif bientôt disponible.",
    noNumber: "Le paiement par Bankily sera bientôt disponible. Écrivez-nous sur WhatsApp en attendant.",
    errorImage: "Choisissez l'image de la confirmation.",
    errorReference: "Écrivez le numéro de la transaction.",
    errorSend: "L'envoi n'a pas marché. Réessayez, ou écrivez-nous sur WhatsApp.",
    failReferenceUsed: "Ce numéro de transaction nous a déjà été envoyé.",
    failImageUsed: "Cette capture nous a déjà été envoyée.",
    failAmount: "Le montant sur la capture est {found} MRU. Le montant attendu est {expected} MRU. Vérifiez le transfert, ou écrivez-nous.",
    failRecipient: "Ce transfert n'est pas allé à notre numéro.",
    failTooOld: "Ce transfert a plus de {expected} jours. Refaites-en un, ou écrivez-nous.",
  },

  devices: {
    none: "Aucun ordinateur pour l'instant. Le vôtre apparaît ici dès que vous installez le logiciel.",
    main: "Ordinateur principal",
    secondary: "Deuxième ordinateur",
    lastSeen: "Vu le {date}",
    release: "Cet ordinateur ne fonctionne plus",
    confirm: "Libérer cet ordinateur ? Vous pourrez installer le logiciel sur un autre.",
    cancel: "Non, garder",
    releasing: "Un instant",
    released: "Libéré. Vous pouvez installer le logiciel sur un autre ordinateur.",
    tooMany: "Vous avez déjà libéré tous les postes permis cette année. Écrivez-nous sur WhatsApp et nous le ferons pour vous.",
    failed: "Pas libéré. Réessayez, ou écrivez-nous sur WhatsApp.",
  },

  placeholder: {
    title: "Cette étape arrive bientôt",
    body: "Nous préparons les questions de cette étape. Revenez dans quelques jours, ou écrivez-nous sur WhatsApp.",
  },
} as const;

/*
 * Each group is a flat set of strings, with two exceptions that the type
 * allows for: a list (the landing's steps) and a set of plural forms, which
 * is a map of Intl.PluralRules categories to sentences.
 */
export type BuilderCopy = {
  readonly [K in keyof typeof fr]: (typeof fr)[K] extends string
    ? string
    : {
        readonly [P in keyof (typeof fr)[K]]: (typeof fr)[K][P] extends string
          ? string
          : (typeof fr)[K][P] extends readonly string[]
            ? readonly string[]
            : Readonly<Record<string, string>>;
      };
};
