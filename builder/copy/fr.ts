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

  placeholder: {
    title: "Cette étape arrive bientôt",
    body: "Nous préparons les questions de cette étape. Revenez dans quelques jours, ou écrivez-nous sur WhatsApp.",
  },
} as const;

export type BuilderCopy = {
  readonly [K in keyof typeof fr]: (typeof fr)[K] extends string
    ? string
    : { readonly [P in keyof (typeof fr)[K]]: (typeof fr)[K][P] extends string ? string : readonly string[] };
};
