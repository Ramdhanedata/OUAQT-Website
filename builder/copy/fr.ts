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
