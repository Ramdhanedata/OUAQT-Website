/*
 * Every word the admin area says, in French, English and Arabic.
 *
 * French is the reference: the other two follow its shape, which the types
 * below enforce, so a key missing in one language fails the build rather than
 * showing a blank to staff.
 *
 * Placeholders in braces are filled with fill() from lib/utils. Nothing here
 * is a function, because the client components receive their part of it as
 * props, and only plain text crosses from the server to the browser.
 *
 * The settings' own descriptions come from the database and are not
 * translated here: they are notes staff wrote about each key, not interface.
 */

export const adminLanguages = ["fr", "en", "ar"] as const;
export type AdminLanguage = (typeof adminLanguages)[number];

/* Each language is always named in itself, whichever one is showing. */
export const languageNames: Record<AdminLanguage, string> = {
  fr: "Français",
  en: "English",
  ar: "العربية",
};

const fr = {
  brand: "OUAQT admin",
  noDatabase: "Aucune base de données configurée.",
  staffFallback: "équipe",
  openStaff: "Test, sans connexion",
  openBanner:
    "Administration de test, ouverte sans connexion. Elle se ferme d'elle-même en production et sur toute autre base de données.",

  nav: {
    payments: "Paiements",
    clients: "Clients",
    devices: "Postes",
    codes: "Codes",
    funnel: "Parcours",
    trials: "Essais",
    requests: "Demandes",
    settings: "Réglages",
    aiCost: "Coût IA",
  },

  /* The words for values the database stores in English. */
  packs: {
    pharmacy: "Pharmacie",
    bakery: "Boulangerie",
    restaurant: "Restaurant",
    warehouse: "Dépôt",
    shop: "Boutique",
    hotel: "Hôtel",
    transport: "Transport",
    general: "Autre activité",
  } as Record<string, string>,
  plans: {
    trial: "Essai",
    annual: "Annuelle",
    semiannual: "Semestrielle",
    quarterly: "Trimestrielle",
    perpetual: "Définitive",
    extra_device: "Poste supplémentaire",
    setup_visit: "Visite d'installation",
  } as Record<string, string>,
  statuses: {
    trial: "Essai",
    active: "Active",
    expired_trial: "Essai terminé",
    renewal_due: "À renouveler",
    expired: "Expirée",
    suspended: "Suspendue",
  } as Record<string, string>,
  roles: { main: "Principal", secondary: "Secondaire" } as Record<string, string>,

  signIn: {
    email: "E-mail",
    password: "Mot de passe",
    continue: "Continuer",
    scan: "Scannez ce code avec une application d'authentification, puis tapez le code à six chiffres qu'elle affiche.",
    orKey: "Ou tapez cette clé :",
    code: "Code à six chiffres",
    signIn: "Se connecter",
    notStaff:
      "Ce compte n'est pas dans la liste de l'équipe. Si vous êtes commerçant, votre logiciel est dans votre propre compte.",
    signOut: "Se déconnecter",
    wrong: "E-mail ou mot de passe incorrect.",
    setupFailed: "Impossible de lancer la configuration de l'authentificateur.",
    noFactor: "Aucun authentificateur à vérifier.",
    challengeFailed: "Impossible de demander un code.",
    badCode: "Ce code n'a pas été accepté.",
  },

  payments: {
    title: "Paiements à confirmer",
    empty: "Rien à confirmer. Les paiements arrivent ici dès qu'un propriétaire envoie une capture.",
    launch: "lancement",
    expected: "Attendu",
    plan: "Formule",
    app: "Application",
    reference: "Référence",
    none: "aucune",
    received: "Reçu le",
    readAmount: "Montant lu",
    readDate: "Date lue",
    readRecipient: "Envoyé au",
    notRead: "Capture non lue par l'IA : lisez le montant, la date et la référence sur l'image.",
    screenshotAlt: "Capture du transfert",
    noScreenshot: "Capture introuvable.",
    reasonLabel: "Raison, si vous rejetez",
    reasonNeeded: "Dites pourquoi : le propriétaire le verra.",
    confirm: "Confirmer",
    reject: "Rejeter",
    confirmed: "Confirmé",
    rejected: "Rejeté",
    failed: "Pas enregistré.",
    automaticTitle: "Confirmés automatiquement, à vérifier",
    automaticIntro: "La capture a été lue et tout correspondait, donc la licence s'est ouverte tout de suite. Regardez l'image : gardez le paiement, ou annulez-le si la capture n'est pas ce qu'elle paraît. Annuler remet la licence comme avant.",
    keep: "C'est bon",
    kept: "Gardé",
    undo: "Annuler le paiement",
    undoReasonLabel: "Raison, si vous annulez",
  },

  clients: {
    title: "Clients",
    search: "Nom du commerce ou numéro de série",
    searchButton: "Chercher",
    nothingFound: "Rien trouvé.",
    none: "Aucun client pour l'instant.",
    noLicence: "aucune licence",
    launch: "lancement",
  },

  devices: {
    title: "Postes",
    none: "Aucun ordinateur activé pour l'instant.",
    unnamed: "sans nom",
    freed: "Libéré",
    seen: "Vu le {date}",
    reason: "Raison",
    release: "Libérer",
    reasonNeeded: "Dites pourquoi : cela reste écrit.",
    notFreed: "Pas libéré.",
  },

  codes: {
    title: "Codes de renouvellement",
    intro:
      "Le propriétaire lit le code affiché par son logiciel. Vous lui lisez celui-ci. Il le tape sans internet et son logiciel repart.",
    shop: "Le commerce",
    deviceCode: "Le code affiché par son logiciel",
    newEnd: "Nouvelle date de fin",
    generate: "Générer le code",
    notGenerated: "Pas généré.",
    readToOwner: "À lire au propriétaire",
    copy: "Copier",
    copied: "Copié",
    recent: "Derniers codes",
    until: "jusqu'au {date}",
  },

  funnel: {
    title: "Parcours",
    nobody: "Personne n'a encore commencé.",
    step: "Étape",
    reached: "Arrivés",
    perHundred: "Sur cent",
    steps: ["Votre commerce", "Questions", "Produits et employés", "Numéro de série"],
    byPack: "Par activité",
    byDevice: "Téléphone ou ordinateur",
    noPack: "sans activité",
    unknown: "inconnu",
  },

  requests: {
    title: "Ce que les propriétaires ont demandé",
    nothing: "Rien pour l'instant.",
    noPack: "sans activité",
    noQuestion: "sans question",
    leadsTitle: "Activités qui n'ont pas encore de logiciel",
    noLeads: "Personne n'a encore laissé son numéro.",
    codesTitle: "Numéros de série à renvoyer",
    codesIntro:
      "L'envoi sur WhatsApp n'est pas encore branché. Envoyez le numéro à la main avec le lien, puis marquez-le envoyé.",
    noCodes: "Aucune demande en attente.",
    expired: "expiré",
    sendOnWhatsApp: "Envoyer sur WhatsApp",
    markSent: "Marquer envoyé",
    markedSent: "Envoyé",
    revive: "Réactiver",
    revived: "Réactivé pour {days} jours.",
    reviveTitle: "Réactiver un numéro expiré",
    reviveLabel: "Le numéro, tel que le propriétaire l'a envoyé",
    reviveFailed: "Numéro introuvable.",
    actionFailed: "L'action n'a pas abouti. Réessayez.",
  },

  settings: {
    title: "Réglages",
    intro:
      "Les valeurs changent ici, jamais dans le code. Un prix vide veut dire que la page le dit, plutôt que d'inventer un chiffre.",
    testPacks: "Les métiers en test sont fermés aux clients. Ce lien les ouvre dans ce navigateur, pour les essayer.",
    testBuilder: "Tester le créateur",
    leaveTest: "Quitter le mode test",
    save: "Enregistrer",
    saved: "Enregistré",
    notJson: "Ce n'est pas une valeur valide. Un nombre s'écrit 15000, un texte entre guillemets.",
    wrongKind: "Cette valeur doit rester du même type qu'avant ({was}).",
    notSaved: "Pas enregistré.",
  },

  aiCost: {
    title: "Coût IA",
    none: "Aucun appel pour l'instant.",
    total: "{calls} appels, {tokens} jetons au total.",
    outcome: "Résultat",
    calls: "Appels",
    tokens: "Jetons",
  },

  trials: {
    title: "Essais",
    intro:
      "Un essai par commerce. Ce qui est signalé ci-dessous n'a bloqué personne : c'est une raison de regarder, pas une accusation.",
    flagged: "Possible essai répété ({count})",
    nothingFlagged: "Rien à signaler.",
    unnamed: "Sans nom",
    refused: "Refusés, à rappeler ({count})",
    nobodyRefused: "Personne.",
    refusedFallback: "Refusé",
    grantTitle: "Donner un essai",
    grantIntro:
      "Pour un ordinateur acheté d'occasion, une machine réparée que nous n'avons pas reconnue, ou toute personne que nous avons refusée à tort. Son essai démarre à sa prochaine activation.",
    all: "Tous les essais ({count})",
    shop: "Le commerce",
    choose: "Choisir",
    why: "Pourquoi",
    whyExample: "Ordinateur acheté d'occasion, vérifié par téléphone",
    grant: "Donner un essai",
    granted: "C'est fait. Son essai démarrera à la prochaine activation.",
    grantFailed: "Rien n'a été enregistré. Réessayez.",
    testEndTitle: "Tester la fin de l'essai",
    testEndIntro:
      "Seulement sur la version de test. Termine tout de suite l'essai du commerce choisi : fermez puis rouvrez le logiciel, relié à internet, et la fenêtre de fin d'essai s'affiche, avec son numéro de série et son code QR.",
    testEndButton: "Terminer l'essai maintenant",
    testEndDone: "Essai terminé. Fermez puis rouvrez le logiciel.",
    testEndNotTrial: "Ce commerce a déjà une licence payée : rien n'a été changé.",
    signals: {
      same_logo: "Même logo qu'un essai précédent",
      same_products: "Même liste de produits",
      similar_name: "Nom de commerce très proche",
      similar_address: "Adresse très proche",
    } as Record<string, string>,
    refusals: {
      same_machine: "Même ordinateur qu'un essai précédent",
      same_phone: "Même numéro de téléphone",
      same_business: "Ce commerce a déjà eu son essai",
      no_fingerprint: "Le logiciel n'a envoyé aucune empreinte de machine",
    } as Record<string, string>,
  },
};

export type AdminCopy = typeof fr;

const en: AdminCopy = {
  brand: "OUAQT admin",
  noDatabase: "No database configured.",
  staffFallback: "staff",
  openStaff: "Test, no sign-in",
  openBanner:
    "Test admin, open without signing in. It locks itself in production and on any other database.",

  nav: {
    payments: "Payments",
    clients: "Customers",
    devices: "Computers",
    codes: "Codes",
    funnel: "Funnel",
    trials: "Trials",
    requests: "Requests",
    settings: "Settings",
    aiCost: "AI cost",
  },

  packs: { pharmacy: "Pharmacy", bakery: "Bakery", restaurant: "Restaurant", warehouse: "Warehouse", shop: "Shop", hotel: "Hotel", transport: "Transport", general: "Other business" },
  plans: {
    trial: "Trial",
    annual: "Annual",
    semiannual: "Six months",
    quarterly: "Quarterly",
    perpetual: "Permanent",
    extra_device: "Extra computer",
    setup_visit: "Installation visit",
  },
  statuses: {
    trial: "Trial",
    active: "Active",
    expired_trial: "Trial ended",
    renewal_due: "Renewal due",
    expired: "Expired",
    suspended: "Suspended",
  },
  roles: { main: "Main", secondary: "Second" },

  signIn: {
    email: "Email",
    password: "Password",
    continue: "Continue",
    scan: "Scan this with an authenticator app, then type the six-digit code it shows.",
    orKey: "Or type this key:",
    code: "Six-digit code",
    signIn: "Sign in",
    notStaff:
      "This account is not on the staff list. If you are a shop owner, your software is on your own account page.",
    signOut: "Sign out",
    wrong: "Wrong email or password.",
    setupFailed: "Could not start setting up the authenticator.",
    noFactor: "No authenticator to check against.",
    challengeFailed: "Could not ask for a code.",
    badCode: "That code was not accepted.",
  },

  payments: {
    title: "Payments to confirm",
    empty: "Nothing to confirm. Payments arrive here as soon as an owner sends a screenshot.",
    launch: "launch",
    expected: "Expected",
    plan: "Plan",
    app: "App",
    reference: "Reference",
    none: "none",
    received: "Received",
    readAmount: "Amount read",
    readDate: "Date read",
    readRecipient: "Sent to",
    notRead: "Screenshot not read by the AI: read the amount, the date and the reference on the image.",
    screenshotAlt: "Transfer screenshot",
    noScreenshot: "Screenshot not found.",
    reasonLabel: "Reason, if you reject",
    reasonNeeded: "Say why: the owner will see it.",
    confirm: "Confirm",
    reject: "Reject",
    confirmed: "Confirmed",
    rejected: "Rejected",
    failed: "Not saved.",
    automaticTitle: "Confirmed automatically, to check",
    automaticIntro: "The screenshot was read and everything matched, so the licence opened straight away. Look at the image: keep the payment, or undo it if the screenshot is not what it seems. Undoing puts the licence back as it was.",
    keep: "Keep",
    kept: "Kept",
    undo: "Undo the payment",
    undoReasonLabel: "Reason, if you undo",
  },

  clients: {
    title: "Customers",
    search: "Shop name or serial number",
    searchButton: "Search",
    nothingFound: "Nothing found.",
    none: "No customers yet.",
    noLicence: "no licence",
    launch: "launch",
  },

  devices: {
    title: "Computers",
    none: "No computer activated yet.",
    unnamed: "unnamed",
    freed: "Released",
    seen: "Seen {date}",
    reason: "Reason",
    release: "Release",
    reasonNeeded: "Say why: it stays on record.",
    notFreed: "Not released.",
  },

  codes: {
    title: "Renewal codes",
    intro:
      "The owner reads you the code his software shows. You read him this one. He types it with no internet and his software starts again.",
    shop: "The shop",
    deviceCode: "The code his software shows",
    newEnd: "New end date",
    generate: "Make the code",
    notGenerated: "Not made.",
    readToOwner: "Read this to the owner",
    copy: "Copy",
    copied: "Copied",
    recent: "Latest codes",
    until: "until {date}",
  },

  funnel: {
    title: "Funnel",
    nobody: "Nobody has started yet.",
    step: "Step",
    reached: "Reached",
    perHundred: "Per hundred",
    steps: ["Your shop", "Questions", "Products and staff", "Serial number"],
    byPack: "By trade",
    byDevice: "Phone or computer",
    noPack: "no trade",
    unknown: "unknown",
  },

  requests: {
    title: "What owners have asked for",
    nothing: "Nothing yet.",
    noPack: "no trade",
    noQuestion: "no question",
    leadsTitle: "Trades that have no software yet",
    noLeads: "Nobody has left their number yet.",
    codesTitle: "Serial numbers to send again",
    codesIntro:
      "Sending on WhatsApp is not connected yet. Send the number by hand with the link, then mark it sent.",
    noCodes: "No requests waiting.",
    expired: "expired",
    sendOnWhatsApp: "Send on WhatsApp",
    markSent: "Mark sent",
    markedSent: "Sent",
    revive: "Revive",
    revived: "Working again for {days} days.",
    reviveTitle: "Revive an expired number",
    reviveLabel: "The number, as the owner sent it",
    reviveFailed: "Number not found.",
    actionFailed: "That did not go through. Try again.",
  },

  settings: {
    title: "Settings",
    intro:
      "Values change here, never in the code. An empty price means the page says so, rather than inventing a figure.",
    testPacks: "Trades in test are closed to customers. This link opens them in this browser, to try them.",
    testBuilder: "Test the builder",
    leaveTest: "Leave test mode",
    save: "Save",
    saved: "Saved",
    notJson: "That is not a valid value. A number is written 15000, text in quotation marks.",
    wrongKind: "This value has to stay the same type as before ({was}).",
    notSaved: "Not saved.",
  },

  aiCost: {
    title: "AI cost",
    none: "No calls yet.",
    total: "{calls} calls, {tokens} tokens in all.",
    outcome: "Outcome",
    calls: "Calls",
    tokens: "Tokens",
  },

  trials: {
    title: "Trials",
    intro:
      "One trial per shop. Nothing flagged below has blocked anyone: it is a reason to look, not an accusation.",
    flagged: "Possible repeat trial ({count})",
    nothingFlagged: "Nothing to flag.",
    unnamed: "Unnamed",
    refused: "Refused, to call back ({count})",
    nobodyRefused: "Nobody.",
    refusedFallback: "Refused",
    grantTitle: "Grant a trial",
    grantIntro:
      "For a second-hand computer, a repaired machine we did not recognise, or anyone we refused wrongly. Their trial starts at their next activation.",
    all: "All trials ({count})",
    shop: "The shop",
    choose: "Choose",
    why: "Why",
    whyExample: "Second-hand computer, checked by phone",
    grant: "Grant a trial",
    granted: "Done. Their trial starts at their next activation.",
    grantFailed: "Nothing was saved. Try again.",
    testEndTitle: "Test the end of the trial",
    testEndIntro:
      "On the test version only. Ends the chosen shop's trial at once: close and reopen the software, connected to the internet, and the end-of-trial window shows, with its serial number and QR code.",
    testEndButton: "End the trial now",
    testEndDone: "Trial ended. Close and reopen the software.",
    testEndNotTrial: "This shop already has a paid licence: nothing was changed.",
    signals: {
      same_logo: "Same logo as an earlier trial",
      same_products: "Same product list",
      similar_name: "Very similar shop name",
      similar_address: "Very similar address",
    },
    refusals: {
      same_machine: "Same computer as an earlier trial",
      same_phone: "Same phone number",
      same_business: "This shop has already had its trial",
      no_fingerprint: "The software sent no machine fingerprint",
    },
  },
};

const ar: AdminCopy = {
  brand: "إدارة OUAQT",
  noDatabase: "لا توجد قاعدة بيانات مهيأة.",
  staffFallback: "الفريق",
  openStaff: "اختبار، دون تسجيل دخول",
  openBanner:
    "إدارة الاختبار، مفتوحة دون تسجيل دخول. تغلق نفسها في الإنتاج وعلى أي قاعدة بيانات أخرى.",

  nav: {
    payments: "المدفوعات",
    clients: "الزبائن",
    devices: "الأجهزة",
    codes: "الرموز",
    funnel: "المسار",
    trials: "التجارب",
    requests: "الطلبات",
    settings: "الإعدادات",
    aiCost: "تكلفة الذكاء الاصطناعي",
  },

  packs: { pharmacy: "صيدلية", bakery: "مخبزة", restaurant: "مطعم", warehouse: "مستودع", shop: "متجر", hotel: "فندق", transport: "نقل", general: "نشاط آخر" },
  plans: {
    trial: "تجربة",
    annual: "سنوية",
    semiannual: "نصف سنوية",
    quarterly: "فصلية",
    perpetual: "دائمة",
    extra_device: "جهاز إضافي",
    setup_visit: "زيارة تثبيت",
  },
  statuses: {
    trial: "تجربة",
    active: "سارية",
    expired_trial: "انتهت التجربة",
    renewal_due: "يلزم التجديد",
    expired: "منتهية",
    suspended: "موقوفة",
  },
  roles: { main: "رئيسي", secondary: "ثانوي" },

  signIn: {
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    continue: "متابعة",
    scan: "امسح هذا الرمز بتطبيق مصادقة، ثم اكتب الرمز المكون من ستة أرقام الذي يعرضه.",
    orKey: "أو اكتب هذا المفتاح:",
    code: "رمز من ستة أرقام",
    signIn: "تسجيل الدخول",
    notStaff: "هذا الحساب ليس في قائمة الفريق. إن كنت صاحب محل، فبرنامجك في حسابك الخاص.",
    signOut: "تسجيل الخروج",
    wrong: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    setupFailed: "تعذر بدء إعداد تطبيق المصادقة.",
    noFactor: "لا يوجد تطبيق مصادقة للتحقق.",
    challengeFailed: "تعذر طلب رمز.",
    badCode: "لم يقبل هذا الرمز.",
  },

  payments: {
    title: "مدفوعات بانتظار التأكيد",
    empty: "لا شيء للتأكيد. تصل المدفوعات هنا بمجرد أن يرسل صاحب محل صورة التحويل.",
    launch: "سعر الانطلاق",
    expected: "المنتظر",
    plan: "الصيغة",
    app: "التطبيق",
    reference: "المرجع",
    none: "لا شيء",
    received: "استلم في",
    readAmount: "المبلغ المقروء",
    readDate: "التاريخ المقروء",
    readRecipient: "أرسل إلى",
    notRead: "لم يقرأ الذكاء الاصطناعي الصورة: اقرأ المبلغ والتاريخ والمرجع في الصورة.",
    screenshotAlt: "صورة التحويل",
    noScreenshot: "الصورة غير موجودة.",
    reasonLabel: "السبب، إن رفضت",
    reasonNeeded: "اذكر السبب: سيراه صاحب المحل.",
    confirm: "تأكيد",
    reject: "رفض",
    confirmed: "تم التأكيد",
    rejected: "مرفوض",
    failed: "لم يسجل.",
    automaticTitle: "مؤكدة تلقائيا، للمراجعة",
    automaticIntro: "قرئت الصورة وتطابق كل شيء، ففتحت الرخصة في الحال. انظر إلى الصورة: أبق الدفعة، أو ألغها إن لم تكن الصورة كما تبدو. الإلغاء يعيد الرخصة كما كانت.",
    keep: "لا بأس",
    kept: "أبقيت",
    undo: "إلغاء الدفعة",
    undoReasonLabel: "السبب، إن ألغيت",
  },

  clients: {
    title: "الزبائن",
    search: "اسم المحل أو الرقم التسلسلي",
    searchButton: "بحث",
    nothingFound: "لم يعثر على شيء.",
    none: "لا يوجد زبائن بعد.",
    noLicence: "دون رخصة",
    launch: "سعر الانطلاق",
  },

  devices: {
    title: "الأجهزة",
    none: "لم يفعل أي حاسوب بعد.",
    unnamed: "دون اسم",
    freed: "محرر",
    seen: "آخر ظهور {date}",
    reason: "السبب",
    release: "تحرير",
    reasonNeeded: "اذكر السبب: يبقى مسجلا.",
    notFreed: "لم يحرر.",
  },

  codes: {
    title: "رموز التجديد",
    intro:
      "يقرأ لك صاحب المحل الرمز الذي يعرضه برنامجه. وتقرأ له هذا الرمز. فيكتبه دون إنترنت ويعود برنامجه للعمل.",
    shop: "المحل",
    deviceCode: "الرمز الذي يعرضه برنامجه",
    newEnd: "تاريخ الانتهاء الجديد",
    generate: "إنشاء الرمز",
    notGenerated: "لم ينشأ.",
    readToOwner: "اقرأه لصاحب المحل",
    copy: "نسخ",
    copied: "تم النسخ",
    recent: "آخر الرموز",
    until: "حتى {date}",
  },

  funnel: {
    title: "المسار",
    nobody: "لم يبدأ أحد بعد.",
    step: "المرحلة",
    reached: "وصلوا",
    perHundred: "من مئة",
    steps: ["محلك", "الأسئلة", "المنتجات والموظفون", "الرقم التسلسلي"],
    byPack: "حسب النشاط",
    byDevice: "هاتف أو حاسوب",
    noPack: "دون نشاط",
    unknown: "غير معروف",
  },

  requests: {
    title: "ما طلبه أصحاب المحلات",
    nothing: "لا شيء بعد.",
    noPack: "دون نشاط",
    noQuestion: "دون سؤال",
    leadsTitle: "أنشطة ليس لها برنامج بعد",
    noLeads: "لم يترك أحد رقمه بعد.",
    codesTitle: "أرقام تسلسلية يجب إعادة إرسالها",
    codesIntro: "الإرسال على واتساب غير موصول بعد. أرسل الرقم يدويا عبر الرابط، ثم علمه كمرسل.",
    noCodes: "لا توجد طلبات في الانتظار.",
    expired: "منتهي الصلاحية",
    sendOnWhatsApp: "إرسال على واتساب",
    markSent: "تعليم كمرسل",
    markedSent: "أرسل",
    revive: "إعادة التفعيل",
    revived: "يعمل من جديد لمدة {days} يوما.",
    reviveTitle: "إعادة تفعيل رقم منتهي الصلاحية",
    reviveLabel: "الرقم كما أرسله صاحب المحل",
    reviveFailed: "لم نجد هذا الرقم.",
    actionFailed: "لم تتم العملية. أعد المحاولة.",
  },

  settings: {
    title: "الإعدادات",
    intro: "تتغير القيم هنا، لا في الشفرة. السعر الفارغ يعني أن الصفحة تقول ذلك، بدل اختراع رقم.",
    testPacks: "المجالات قيد الاختبار مغلقة أمام الزبائن. هذا الرابط يفتحها في هذا المتصفح لتجربتها.",
    testBuilder: "اختبار المنشئ",
    leaveTest: "الخروج من وضع الاختبار",
    save: "حفظ",
    saved: "تم الحفظ",
    notJson: "هذه ليست قيمة صالحة. يكتب الرقم هكذا 15000، والنص بين علامتي تنصيص.",
    wrongKind: "يجب أن تبقى هذه القيمة من النوع نفسه كما كانت ({was}).",
    notSaved: "لم يحفظ.",
  },

  aiCost: {
    title: "تكلفة الذكاء الاصطناعي",
    none: "لا توجد طلبات بعد.",
    total: "{calls} طلبا، {tokens} وحدة في المجموع.",
    outcome: "النتيجة",
    calls: "الطلبات",
    tokens: "الوحدات",
  },

  trials: {
    title: "التجارب",
    intro: "تجربة واحدة لكل محل. ما يشار إليه أدناه لم يمنع أحدا: إنه سبب للنظر، لا اتهام.",
    flagged: "تجربة مكررة محتملة ({count})",
    nothingFlagged: "لا شيء يستحق الإشارة.",
    unnamed: "دون اسم",
    refused: "مرفوضون، يعاد الاتصال بهم ({count})",
    nobodyRefused: "لا أحد.",
    refusedFallback: "مرفوض",
    grantTitle: "منح تجربة",
    grantIntro:
      "لحاسوب اشتري مستعملا، أو جهاز أصلح ولم نتعرف عليه، أو أي شخص رفضناه خطأ. تبدأ تجربته عند تفعيله القادم.",
    all: "كل التجارب ({count})",
    shop: "المحل",
    choose: "اختر",
    why: "السبب",
    whyExample: "حاسوب مستعمل، تم التحقق بالهاتف",
    grant: "منح تجربة",
    granted: "تم. تبدأ تجربته عند تفعيله القادم.",
    grantFailed: "لم يسجل شيء. أعد المحاولة.",
    testEndTitle: "تجربة نهاية الفترة التجريبية",
    testEndIntro:
      "في نسخة الاختبار فقط. ينهي الفترة التجريبية للمحل المختار فورا: أغلق البرنامج ثم افتحه وهو متصل بالإنترنت، فتظهر نافذة نهاية التجربة برقمه التسلسلي ورمز QR.",
    testEndButton: "إنهاء التجربة الآن",
    testEndDone: "انتهت التجربة. أغلق البرنامج ثم افتحه.",
    testEndNotTrial: "لهذا المحل رخصة مدفوعة: لم يتغير شيء.",
    signals: {
      same_logo: "الشعار نفسه لتجربة سابقة",
      same_products: "قائمة المنتجات نفسها",
      similar_name: "اسم محل قريب جدا",
      similar_address: "عنوان قريب جدا",
    },
    refusals: {
      same_machine: "الحاسوب نفسه لتجربة سابقة",
      same_phone: "رقم الهاتف نفسه",
      same_business: "حصل هذا المحل على تجربته من قبل",
      no_fingerprint: "لم يرسل البرنامج أي بصمة للجهاز",
    },
  },
};

export const adminCopy: Record<AdminLanguage, AdminCopy> = { fr, en, ar };

/*
 * The locale for dates and numbers on staff screens.
 *
 * Arabic uses plain day/month/year digits rather than the Arabic locale's own
 * format. That one puts invisible right-to-left marks between the numbers,
 * and beside a shop name written in Latin letters they tore the date apart:
 * "22 · Pharmacie Essai 2026/9/". Digits stay Western, as everywhere else.
 */
export const adminLocale: Record<AdminLanguage, string> = {
  fr: "fr-FR",
  en: "en-GB",
  ar: "en-GB",
};

/** A stored value in the reader's words, or the value itself when it has none. */
export function wordFor(words: Record<string, string>, value: string | null | undefined): string {
  if (!value) return "";
  return words[value] ?? value;
}
