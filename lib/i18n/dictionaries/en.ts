/*
 * English is the source of truth. Its shape becomes the `Dictionary` type,
 * so fr.ts and ar.ts will fail typecheck if a key is missing or misspelled.
 */
export const en = {
  meta: {
    siteTitle: "OUAQT | Management software for small businesses, ready in minutes",
    siteDescription: "With the OUAQT Builder, small and medium-sized businesses build their own till, stock and reporting software in minutes. It works without internet and your data stays with you.",
    projectsTitle: "Custom work: 22 systems in daily use | OUAQT",
    projectsDescription: "Mines, pharmacies, hotels, transport, restaurants and schools: the systems we built to order, and what each one changed.",
    aboutTitle: "About OUAQT and its founder",
    aboutDescription: "OUAQT is a startup that equips small and medium-sized businesses with management software: the online Builder, and custom projects. Founded by Elboumby Aumar Ramdhane.",
    contactTitle: "Contact | OUAQT",
    contactDescription: "A question about the Builder, a demo or a custom project: write to us. We usually reply within one business day, by email or on WhatsApp.",
    termsTitle: "Licence and terms of use | OUAQT",
    termsDescription:
      "Who owns an OUAQT system, what your licence covers, and how it renews.",
    privacyTitle: "Privacy policy | OUAQT",
    privacyDescription:
      "What OUAQT does with personal information, on this website and inside the systems we build.",
    pricingTitle: "Pricing: the Builder and custom projects | OUAQT",
    pricingDescription:
      "Every OUAQT price in one place: the software you build online, then installation and the annual licence for custom projects.",
    shareAlt: "OUAQT: management software for small businesses, built in minutes with the Builder.",
  },

  /*
   * Names and labels that appear in components rather than prose. Kept here so
   * each language shows its own form, including the founder's name in Arabic.
   */
  common: {
    brand: "OUAQT",
    founderName: "Elboumby Aumar Ramdhane",
    location: "Nouakchott, Mauritania",
    headquarters: "Headquartered in Nouakchott, Mauritania",
    linkedin: "LinkedIn",
    facebook: "Facebook",
    whatsapp: "WhatsApp",
    company: "Company",
  },

  nav: {
    builder: "The Builder",
    custom: "Custom work",
    projects: "Our work",
    pricing: "Pricing",
    about: "About",
    contact: "Contact",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    language: "Language",
    homeAria: "OUAQT home",
  },

  proof: {
    body: "GMM's field teams used to reconcile bloc movements by hand, across paper logs and three languages. Today the system does that work for them.",
    cta: "See how we did it",
    client: "GMM · Mining client",
    metric: "Daily reconciliation",
    before: "Before",
    after: "After",
    beforeValue: "4 hours",
    afterValue: "25 min",
    reduction: "90% reduction",
    reductionNote: "Less time spent reconciling, a figure GMM confirmed.",
  },

  projectsPage: {
    eyebrow: "Custom work",
    heading: "22 systems built to order, in use every day.",
    body: "Before the Builder there were these projects, and there still are. Each one starts with a visit: we learn how the business runs, bring its old records across, and set the software up for that client alone. Mines, pharmacies, hotels, transport, restaurants and schools: here is a selection.",
    all: "All",
  },

  /*
   * The pricing page. Figures are never typed here: {placeholders} are filled
   * from lib/data/pricing.ts, and prices render from the same file.
   */
  pricingPage: {
    /* The builder's own prices, read from settings, shown above the rest. */
    builderTrack: {
      eyebrow: "The Builder",
      heading: "You build it yourself, you install it the same day",
      intro:
        "You answer the questions, you download your software and you install it on the shop PC. Nobody travels to you, so there is no installation fee to pay: the licence alone is enough.",
      soon: "Price coming soon",
      trial: "Free trial of {days} days before you pay anything.",
      devices: "{devices} devices included: the till and a second computer.",
      launchNote:
        "Launch price, for our first {clients} clients. Your price then stays the same for {years} years.",
      launchCondition:
        "The launch price applies to our first {clients} clients. After that, the standard price applies.",
      payment: "Payment by Bankily, Masrvi, BimBank, SEDAD or Click. You see the amount before you pay.",
      cta: "Build my software",
      monthly: "{amount} a month",
      annual: { label: "Annual licence", cadence: "Per year" },
      semiannual: { label: "Six-month licence", cadence: "Every 6 months" },
      perpetual: { label: "Permanent licence", cadence: "Paid once" },
      extraDevice: { label: "Extra device", cadence: "Per year" },
      setupVisit: {
        label: "Installation visit, if you want one",
        cadence: "Paid once",
      },
    },
    customTrack: {
      eyebrow: "Bespoke project",
      heading: "Or we come and install it, and build what is missing",
      intro:
        "For the trades the Builder does not cover yet, and for businesses that want us to do the work on site.",
    },
    eyebrow: "Pricing",
    heading: "The software you build yourself, and the software we build for you.",
    intro:
      "The first is built online, in a few questions, and installed the same day. The second we build and install at your site. Either way the software runs on your own computers and needs no internet connection for daily work.",
    freeVisit: "Before anything is agreed, our first visit to understand how you work is free.",
    scope: "These prices are the same for every ready-to-install OUAQT product.",
    launchScope:
      "Launch pricing is for our first {clients} clients. The struck-through figure is the standard price, and it is what every client after them pays.",
    standardLabel: "Standard price",
    launchLabel: "Launch price",
    installation: {
      label: "Installation, training and data migration",
      cadence: "Paid once",
    },
    annual: {
      label: "Annual licence",
      cadence: "Per year",
      freeze:
        "At launch pricing this figure stays fixed for {years} years, and you can still cancel the licence each year.",
    },
    extraDevice: {
      label: "Each device beyond the {devices} included",
      cadence: "Per year",
    },
    renewal:
      "The licence renews automatically each year unless you cancel it before the renewal date.",
    lateRenewal:
      "If a renewal is paid late, entering new data is paused until it is paid. Reading and exporting the data you already have is never blocked.",
    contact: "Contact us",
    whatsapp: "WhatsApp",
    products: "Current pricing covers systems for {pharmacy}, {hotel}, {transport}, {restaurant}, bakeries, as well as workshop and warehouse management systems.",
    productNames: {
      pharmacy: "pharmacies",
      hotel: "hotels",
      transport: "transportation",
      restaurant: "cafés and restaurants",
    },
    bespoke: {
      eyebrow: "Bespoke",
      heading: "A system built for your business alone",
      body: "For a mine, a reconciliation process or transport work that goes beyond the standard system, we build to order and quote on the days of work involved.",
      maintenance:
        "Annual maintenance is {rate} of the build value, starting in month {month}.",
      cta: "Request a quote",
    },
    perpetual: {
      eyebrow: "Perpetual licence",
      heading: "For buyers who would rather not pay every year",
      cadence: "Paid once, installation included",
      body: "That covers updates, the product catalogue, support and modifications for {months} months only. After that the software keeps running with nothing more to pay and no further service.",
      cta: "Contact us",
    },
    included: {
      heading: "Included in the licence",
      lead: "For as long as the licence is renewed it covers everything below, and new modules are not part of it.",
      items: [
        "Installation on up to {devices} devices at the same site",
        "Moving the software to a replacement machine after a breakdown, a theft or an upgrade, at no charge while the total stays within {devices}",
        "Updates",
        "The product catalogue, where the product has one",
        "Support",
        "Changes to what already exists, on request, such as a form field, a receipt or label layout, a report column, a sort order, a print format, wording, a user role or a tax rate",
        "Correcting anything wrong or slow in what we delivered",
      ],
    },
    quoted: {
      heading: "Quoted separately",
      lead: "A new module is a screen or a process that does not exist yet, and it is always quoted separately.",
      items: [
        "Accounting",
        "Payroll",
        "A second branch",
        "Deliveries",
        "A mobile app",
        "A connection to another system",
      ],
    },
    decides:
      "When you ask for something, we tell you before starting whether it is a modification or a new module.",
    faq: {
      eyebrow: "Questions",
      heading: "What buyers ask before signing.",
      items: [
        {
          q: "Does the software need an internet connection?",
          a: "No. It runs on your own computers, and daily work happens without a connection.",
        },
        {
          q: "On how many computers can I install it, and what happens if a machine breaks or is replaced?",
          a: "Up to {devices} at the same site, and each extra device is added to the annual licence. If a machine breaks down, is stolen or is replaced, we install the software on the new one at no charge, as long as the total stays within {devices}.",
        },
        {
          q: "Where is my data stored?",
          a: "On your own computers, at your premises. They do not come to us, and backing them up happens on your own media.",
        },
        {
          q: "What happens if I do not renew?",
          a: "Entering new data is suspended, and updates, backup and support stop. You can always read and export everything already recorded.",
        },
        {
          q: "Can I pay in instalments?",
          a: "Yes for installation, in two payments, the first at signature and the second when the software goes live. The licence, annual or perpetual, is paid in one go.",
        },
        {
          q: "What is the difference between a modification and a new module?",
          a: "A modification changes something that already exists, a print format or a tax rate for example, and the licence covers it. A new module adds a screen or a process that does not exist yet and is quoted separately. We tell you which one it is before we start.",
        },
        {
          q: "Can I switch from the annual licence to the perpetual one?",
          a: "Yes, at any time. We deduct the installation fee you already paid from the perpetual price, but not the licence years already paid.",
        },
      ],
    },
  },

  legal: {
    updated: "Last updated",
    updatedDate: "September 2026",
    terms: {
      title: "Licence and terms of use",
      intro:
        "These terms cover two different things. Part one is about the software you build yourself on this site. Part two is about the projects we build and install at your premises. Part three applies to both.",
      selfServePart: {
        h: "Part one: the software you build online",
        b: "This part applies as soon as you build software on this site and receive a serial number.",
      },
      trial: {
        h: "The free trial",
        b: "Your software can be tried free for {trialDays} days. The trial starts the day you activate it on your computer, not the day you download it. During the trial everything works. At the end, until anything is paid, the software turns read-only: you can see and export your data, you can no longer enter new data.",
      },
      selfLicence: {
        h: "What you are buying",
        b: "You are not buying the software, you are buying the right to use it in your business, on at most {devices} devices. The annual licence renews each year and can be cancelled before the renewal date. The quarterly licence works the same way, by quarter. The permanent licence is paid once and does not renew.",
      },
      payment: {
        h: "Payment",
        b: "Payment is made from Bankily, Masrvi, BimBank, SEDAD or Click, to the number shown on this site. You send the screenshot of the confirmation with your serial number. When everything on it matches, the payment is confirmed straight away and your software opens again by itself. Otherwise we confirm it by hand, usually the same day. If you are one of our first {clients} clients, the launch price applied when you signed up stays yours for {years} years, even if our prices change in the meantime.",
      },
      grace: {
        h: "If a renewal is paid late",
        b: "Your licence does not stop on its due date. You have {graceDays} days during which the software keeps working normally, with a daily reminder to pay on this site. After that the software turns read-only, as at the end of a trial. As soon as the payment is confirmed, everything opens again immediately. Your data is never deleted, however late the payment.",
      },
      devices: {
        h: "Your devices",
        b: "Your licence covers {devices} computers. If you change machine, you release the old one from your account, up to the number of releases a year shown in your account. Beyond that, write to us and we will do it for you. Reinstalling the software on the same computer does not use up a device.",
      },
      selfData: {
        h: "Your data does not reach us",
        b: "Your sales, your stock, your movements and your customers' accounts stay on your computers. Our servers do not receive them, and no part of the software sends them. What we hold is limited to what it takes to build your software and manage your licence: your account, your answers to the questions, the configuration that comes out of them, your logo, the product list you imported at the start, your serial numbers, your devices and your payments.",
      },
      selfSupport: {
        h: "What the licence includes",
        b: "Software updates, support over WhatsApp, and fixing whatever does not work as stated. Installation is yours: you download and you install. If you would rather we came and did it, that is an installation visit, charged separately. Backing up your data happens on your own media and is yours to do: the software helps you do it, and we keep no copy.",
      },
      selfChanges: {
        h: "What the licence does not include",
        b: "A trade the Builder does not cover yet, or a way of working its questions do not provide for, is a bespoke project and is quoted separately.",
      },
      bespokePart: {
        h: "Part two: the projects we build and install",
        b: "This part applies to systems we design and install at your premises. It accompanies the written contract for your project. Where the two differ, your contract prevails.",
      },
      licence: {
        h: "Your licence to use it",
        b: "You receive a non-exclusive licence to use the software within your business, on at most {devices} devices at one site. The annual licence renews each year and can be cancelled before the renewal date. The perpetual licence is paid once and does not renew.",
      },
      corrections: {
        h: "Corrections",
        b: "While the annual licence is renewed, we fix anything wrong or slow in what we delivered, at no charge. With the perpetual licence those fixes are included for {months} months. They do not cover changes made by a third party, nor hardware or network failures outside the software.",
      },
      support: {
        h: "What the licence covers",
        b: "Installation, training your staff and bringing your old records across are paid once, through the installation fee or the price of the perpetual licence. The annual licence then includes updates, the product catalogue where the software has one, support, and changes to existing behaviour on request, for as long as it is renewed. The perpetual licence includes the same services for {months} months only, after which the software keeps working with no further payment and no service at all. A new module is always quoted separately, and we tell you before starting whether your request is a change or a new module.",
      },
      yourData: {
        h: "Your data stays yours",
        b: "Everything your business enters into the system, and everything we migrate into it, belongs to you. We do not sell it, we use it only to run and support your system, and we never mix it with another client's data. Ask for a copy whenever you want and we will hand it over.",
      },
      termination: {
        h: "Late renewal and the end of the licence",
        b: "If the annual licence is renewed late, entering new data is suspended until payment. Reading and exporting your data is never blocked. The licence can also end if these terms are seriously breached and the situation is not put right after we raise it. In every case, we hand you a full copy of your data.",
      },
      commonPart: {
        h: "Part three: what applies in both cases",
        b: "The rules below apply to any OUAQT software, however you obtained it.",
      },
      ownership: {
        h: "The software belongs to us",
        b: "OUAQT owns the software, its source code, its design and its documentation, along with anything added to it later. Paying for a licence or a project does not transfer that ownership.",
      },
      restrictions: {
        h: "What the licence does not allow",
        b: "The licence is for your business alone. Accordingly, you may not:",
        items: [
          "sell, rent, lend or transfer the software to anyone else",
          "give access to another business, including a related company, without our written agreement",
          "copy the software or install it on more devices than your licence covers",
          "take it apart, decompile it or try to recover its source code",
          "remove or alter any OUAQT notice or name it carries",
          "use it to create or assist a competing product",
        ],
      },
      law: {
        h: "Governing law",
        b: "These terms are governed by the law of the Islamic Republic of Mauritania, and any dispute goes before the courts of Nouakchott.",
      },
    },
    privacy: {
      title: "Privacy policy",
      intro:
        "What OUAQT holds about you, and what it never has. This page covers this site, the Builder on it, and the systems we install at your premises.",
      collect: {
        h: "What this site collects",
        b: "On ordinary pages, only what you type into the contact form: your name, your email address or phone, your message and the language you were reading. This site carries no advertising tracker and no third-party analytics.",
      },
      builder: {
        h: "When you build software",
        b: "To build your software and manage your licence, we keep: the account you open, your answers to the questions, the configuration that comes out of them, your business name and details as they will appear on your receipts, your logo, the product list you import at the start, your staff names if you enter them, your serial numbers, the computers you activate and your payments.",
      },
      neverReceived: {
        h: "What we never receive",
        b: "Once the software is installed, your sales, your stock, your movements and your customers' accounts stay on your computers. Our servers do not receive them and no part of the software sends them. The product list you import at the start is there to prepare your software; what you sell afterwards never reaches us.",
      },
      ai: {
        h: "Artificial intelligence",
        b: "When you describe the way you work in your own words, that sentence may be sent to an artificial intelligence service to be turned into settings, and what it proposes is then checked against our own rules before anything is applied. The screenshot of your payment is also sent to it to take down the amount, the date and the transaction number. That service may keep what it receives and use it to improve its products. Nothing else is sent to it: not your product list, not your staff. The Builder works entirely without this feature, and your tap answers never go through it.",
      },
      payments: {
        h: "Payments",
        b: "You pay with Bankily, Masrvi, BimBank, SEDAD or Click, straight from your phone. We never see your secret code. We keep the screenshot you send, what is taken down from it (the amount, the date and the transaction number) and the amount expected, for as long as it takes to confirm the payment and account for your licence.",
      },
      fingerprint: {
        h: "Your computer's fingerprint",
        b: "So that one computer cannot take one free trial after another, the software works out a fingerprint from your motherboard, your system disk and your operating system's own identifier. It sends us hashed fingerprints only, never the numbers themselves, and we cannot work the numbers back out from what reaches us. It is used for one thing: knowing whether this machine has already had a trial. If you bought your computer second-hand, or had it repaired, write to us and we will open the trial by hand.",
      },
      where: {
        h: "Where this is kept",
        b: "On servers in Ireland, at our database host, and on the Vercel network that serves this site. Both work for us and are not allowed to use your information for their own purposes.",
      },
      sharing: {
        h: "Who else has access",
        b: "Nobody else. Your contact message passes through the service that carries our email so it can reach our inbox. We never sell your information and we pass it to nobody for commercial purposes.",
      },
      retention: {
        h: "How long we keep it",
        b: "Your contact message stays in our mailbox for as long as the exchange is useful. What concerns your software and your licence is kept for as long as your account exists, because it is what lets your software be reinstalled and what proves what you paid. Ask us to delete your account and we erase it.",
      },
      clientSystems: {
        h: "The systems we install ourselves",
        b: "When we design and install a system for your business, the data in it is yours, not ours. It stays on your own computers, separate from any other client's. We look at it only when you ask us to for support, never for anything else.",
      },
      rights: {
        h: "Your rights",
        b: "Ask what we hold about you, ask for a copy of it, or ask us to delete it. Write to the address below and we act on it.",
      },
      contact: {
        h: "Write to us",
        b: "Any question about this policy, or about what we hold, to ouaqt.mrt@gmail.com.",
      },
    },
  },

  projectDetail: {
    back: "All our work",
    overview: "Overview",
    problem: "The problem",
    solution: "What we built",
    results: "Results",
    client: "Client",
    /* The same for every case study, so it is stored once. */
    roleValue: "Studying the work on site, building the software, bringing in old records, installation",
    role: "What we did",
    tools: "What's in it",
    screenshotAlt: "product screenshot",
    /* Shown only on the case studies whose trade the builder covers. */
    builderNote: "Software like this is now built online, by answering a few questions.",
    builderNoteLink: "See the software for this trade",
  },

  sectors: {
    Mining: "Mining",
    Pharmacy: "Pharmacy",
    Hospitality: "Hospitality",
    Transport: "Transport",
    Restaurant: "Restaurant",
    Education: "Education",
  },

  about: {
    eyebrow: "About OUAQT",
    heading: "A startup that equips small businesses with software made to measure.",
    body1:
      "We built bespoke systems one client at a time: mining, pharmacies, hotels, transport, restaurants, schools. Every time, the same scene. A solid business, a team that knows what it is doing, and the most important work of the day resting on paper, spreadsheets and WhatsApp groups.",
    body2:
      "And every time, the same discovery. Nobody understood the problem better than the owner himself. Our job was never to teach him his trade, it was to turn what he already knew into software that looked like him.",
    storyHeading: "What we did about it",
    storyBody1:
      "Bespoke software takes weeks and costs money. Most of the businesses that need it can neither wait nor pay. So we took what we had learned at each client and turned it into the Builder, an online software builder: the owner answers questions about the way he works, and leaves with his software, ready to install, the same day.",
    storyBody2:
      "This is not a template touched up afterwards. It is the same software for everybody, set by his own answers: his products, his languages, his staff, the way he takes money. It runs on his own computers, with no internet, and his figures never reach us.",
    storyBody3:
      "The Builder is now our main product. The trades it does not cover yet, and the businesses whose work falls outside it, we still build for one at a time, as before.",
    marketHeading: "The numbers behind it.",
    stat1: "of Mauritania's GDP runs through the informal sector",
    stat2: "of the workforce is in informal employment",
    stat3: "The Investment Code now names support for small and medium businesses as a priority",
    marketNote: "The World Bank and IFC are funding small businesses across the region to get finance and digital tools. OUAQT works on the digital side of that same problem.",
    founderEyebrow: "Founder",
    founderRole: "Founder & Solutions Engineer / Forward Deployed Engineer",
    founderBio1: "I started OUAQT because I kept meeting capable teams who lost hours every day to work their software should have done for them. Counting stock, copying figures between files, checking the same numbers twice. The tools they'd paid for didn't match how they actually worked, so people made up the difference by hand.",
    founderBio2: "I come from data analytics and software engineering, and I build on site with the people who'll use the system. I stay from the first conversation until nobody opens the old spreadsheet. For one client, a reconciliation that took four hours a day now takes 25 minutes. We've gone on to build systems for teams in mining, pharmacy, hospitality and transport across Mauritania.",
    credentials: {
      analytics: {
        title: "Data analytics at Deloitte and MyAiPathways",
        detail: "Consulting and product work on how organisations collect their data and put it to use.",
      },
      snim: {
        title: "Process automation at SNIM",
        detail: "Took a process that ran for three days and got it done in eight hours, at one of Mauritania's largest industrial companies.",
      },
      undp: {
        title: "UNDP Knowledge Future Skills Academy winner, 2025",
        detail: "Chosen from the regional group, then invited to give the keynote at the Knowledge Summit in Dubai the same year.",
      },
      sectors: {
        title: "22 systems in use across six sectors",
        detail: "Mining, pharmacy, hotels, transport, food service and education, each system set up for its client alone.",
      },
    },
    ctaHeading: "What slows your business down?",
    ctaBody: "If part of your day still depends on a spreadsheet nobody trusts, that is usually where we start.",
    ctaButton: "Talk to us",
  },

  packLabels: {
    pharmacy: "Pharmacy",
    bakery: "Bakery",
    restaurant: "Restaurant or cafe",
    warehouse: "Warehouse and stock",
    shop: "Shop or grocery",
    hotel: "Hotel or guest house",
    transport: "Passenger and parcel transport",
    general: "Any other business: sales, stock and reports",
  },

  builderHome: {
    heroEyebrow: "Management software for small and medium businesses",
    heroHeading: "Your business management software, ready in minutes.",
    heroBody: "OUAQT is a startup that equips small and medium-sized businesses. With the Builder, you describe how your business works and leave with your own till, stock and reporting software, installed on your own computers.",
    heroPrimary: "Build my software",
    heroSecondary: "Try the demo",
    heroReassurance: "Works without internet · Your data stays with you · {days} day free trial",
    heroReassuranceNoTrial: "Works without internet · Your data stays with you",
    heroShotAlt: "A cafe's till screen in OUAQT software: an order in progress, its total and the payment.",
    heroChipOffline: "Works without internet",
    heroChipOfflineLabel: "for the everyday work",
    heroChipReady: "Ready in under 5 minutes",

    impactMinutes: "Under 5 minutes",
    impactMinutesLabel: "to build your software",
    impactOffline: "No internet",
    impactOfflineLabel: "needed for the everyday work",
    impactData: "Your data",
    impactDataLabel: "stays on your computers",
    impactSystems: "22 systems",
    impactSystemsLabel: "in daily use at our clients",

    builderEyebrow: "The Builder",
    builderHeading: "The Builder makes your software from your answers.",
    builderBody: "It is the heart of OUAQT. Instead of generic software you have to learn, the Builder puts together yours: your products, your prices, how you take payment, your staff and your receipts.",
    builderStep1: "Describe your business",
    builderStep1Body: "What you sell, how you take payment, who works the till. Simple questions, in French, Arabic or English.",
    builderStep2: "Watch it work",
    builderStep2Body: "The real software runs beside the questions and changes with every answer. You try it before you download it.",
    builderStep3: "Install and start",
    builderStep3Body: "Download it for Windows or Mac, activate it with your serial number, and your free trial begins.",
    builderCta: "Build my software",
    builderPricing: "See the prices",

    demoEyebrow: "Live demo",
    demoHeading: "Try it here. It is the real software.",
    demoBody: "Pick a trade, ring up a sale, open the stock or the reports. What you see here is what you will install.",
    demoLoading: "Opening the software",
    demoNote: "Sample data, so you can try it without risking anything.",
    demoPhone: "On a phone the demo shows small. Open this page on a computer to really try it.",
    demoShops: {
      pharmacy: "Central Pharmacy",
      bakery: "Harbour Bakery",
      restaurant: "Palm Tree Cafe",
      warehouse: "Central Depot",
      shop: "Al Amal Grocery",
      hotel: "Dunes Hotel",
      transport: "Sahel Express Travel",
      general: "Nour Workshop",
    },

    featuresEyebrow: "In every piece of software",
    featuresHeading: "Everything you need to run your business day to day.",
    features: [
      { title: "A fast till", body: "Take payment in a few taps, in cash or by mobile app, with a printed receipt." },
      { title: "Stock kept up to date", body: "It goes down with every sale and warns you before a product runs out." },
      { title: "Clear reports", body: "Today's, this week's and this month's takings, the best sellers, and an export for Excel." },
      { title: "Customer credit", body: "Sales on credit and what each customer owes you, without a notebook." },
      { title: "Closing the till", body: "At the end of the day or the shift: what should be in the till, and what is." },
      { title: "Receipts for your trade", body: "The table for a restaurant, the room and dates for a hotel, the seat and departure for a ticket." },
      { title: "Two computers together", body: "The till and a second computer work together over your own network, without internet." },
      { title: "French and Arabic", body: "The software speaks your staff's language, receipts included." },
    ],

    tradesEyebrow: "Trades",
    tradesHeading: "Software for every trade",
    tradesBody: "Each trade has its own screens, questions and receipts. Pick yours to start.",
    tradesOpen: "Available",
    tradesSoon: "Coming soon",
    tradesStart: "Start",
    tradesLearnMore: "Read more",
    tradesNotifyMe: "Tell me when",
    tradeLines: {
      pharmacy: "Expiry dates, batches, suppliers and barcode search.",
      bakery: "The day's production, orders taken ahead and unsold goods.",
      restaurant: "Tables, orders to the kitchen, dine in, takeaway and delivery.",
      warehouse: "Goods in, goods out, locations and units of sale.",
      shop: "Sell by the piece or by weight, barcodes and customer credit.",
      hotel: "Rooms, stays, advances and extras.",
      transport: "Departures, numbered seats, tickets and parcels.",
      general: "Products or services, stock and expenses.",
    },
    tradesOther: "My business is not on this list",
    tradesOtherBody: "No need to worry, more trades are on the way. Tell us what you do and leave your number: we will call you back.",
    tradesBusiness: "Your business",
    tradesBusinessPlaceholder: "For example: hardware store, hair salon, garage",
    tradesLeaveNumber: "Leave your number and we will tell you.",
    tradesPhone: "Your phone number",
    tradesSend: "Tell me",
    tradesSendOther: "Send",
    tradesThanks: "Thank you. We will write as soon as it is ready.",
    tradesOtherThanks: "Thank you. We have your request and we will call you very soon.",
    tradesError: "Your number did not go through. Try again, or write to us on WhatsApp.",

    whyEyebrow: "Why OUAQT",
    whyHeading: "Made for local small businesses, and for the way they work.",
    why: [
      { title: "No internet needed", body: "The software works on your computers. Internet is only for installing, updating and paying for the licence." },
      { title: "Your data stays with you", body: "Your sales, your stock and your customers' accounts never leave your computers. We never receive them." },
      { title: "Local payment", body: "By Bankily, Masrvi, BimBank, SEDAD or Click, once a year or every six months. You see the amount before you pay." },
      { title: "A team that answers", body: "A question or a problem: write to us on WhatsApp. We usually answer the same day, in French or Arabic." },
    ],

    pricingEyebrow: "Prices",
    pricingHeading: "Clear prices, shown before you pay.",
    pricingBody: "You try it free first, then choose your licence. No installation fee: you install it yourself, in a few minutes.",
    pricingAnnual: "Annual licence",
    pricingPerYear: "per year",
    pricingMonthly: "that is {amount} a month",
    pricingLaunch: "Launch price",
    pricingSoon: "Price coming soon",
    pricingTrial: "{days} day free trial",
    pricingDevices: "{devices} computers included",
    pricingUpdates: "Updates and support included",
    pricingPayment: "Pay by mobile app",
    pricingCta: "See all prices",

    customEyebrow: "Custom work",
    customHeading: "A need outside the usual? We build it with you.",
    customBody: "It is our second line of work, and the one the Builder grew out of. For businesses whose work fits no template, we come on site, learn how you work and build the system that matches it.",
    customStep1: "A visit to understand",
    customStep1Body: "We watch an ordinary day with your team. This first visit is free.",
    customStep2: "A system around your routine",
    customStep2Body: "It follows your steps and your language, and your old records come with you.",
    customStep3: "Support after go-live",
    customStep3Body: "We train your team and adjust the system as the way you work changes.",
    customProjects: "See our work",
    customTalk: "Ask for a quote",

    faqEyebrow: "Questions",
    faqHeading: "What people ask us",
    faq1: "Does the software work without internet?",
    faq1Body: "Yes. It installs on the business computer and works there. Internet is only for installing, updating and paying.",
    faq2: "Who sees my sales and my customers?",
    faq2Body: "Only you. Your sales, your stock and your customers' accounts stay on your computers. We never receive them.",
    faq3: "How many computers can I install it on?",
    faq3Body: "Two: the till and a second machine. Both work without internet and agree with each other over your own network.",
    faq4: "What happens when the free trial ends?",
    faq4Body: "Until you pay, the software becomes read only: you can see and export your data, but not enter new records. As soon as the licence is paid, everything opens again.",
    faq5: "What if my trade is not on the list?",
    faq5Body: "Tell us from the list of trades, with your number. More trades are on the way, and if your need is particular we can build it to order.",
    faq6: "What if I need help?",
    faq6Body: "Write to us on WhatsApp. We usually answer the same day, in French or Arabic.",

    ctaHeading: "Equip your business today.",
    ctaBody: "A few minutes of questions and your software is ready to install. For a custom project, let us talk first.",
    ctaButton: "Build my software",
    ctaTalk: "Talk to the team",
    ctaWhatsapp: "Write on WhatsApp",
  },

  contact: {
    eyebrow: "Contact",
    heading: "Let us talk about your business.",
    body: "A question about the Builder, help installing it, or a custom project in mind: write to us in your own words. We usually reply within one business day. For a custom project, the first visit is free.",
    whatsapp: "WhatsApp",
    form: {
      name: "Name",
      namePlaceholder: "Your full name",
      contact: "Email or WhatsApp number",
      contactPlaceholder: "you@company.com or +222 …",
      message: "Message",
      optional: "optional",
      messagePlaceholder: "For example: we write every sale in a notebook and count the till by hand every night.",
      hint: "Your name and a way to reach you is enough. Add a message only if you want to.",
      submit: "Send message",
      sending: "Sending…",
      errorSend: "That didn't send. Please try again, or reach us directly by email or WhatsApp.",
      successTitle: "Message received.",
      successBody: "Thank you. We usually reply within one business day. If it's urgent, message us on WhatsApp.",
      sendAnother: "Send another message",
      errorName: "Please enter your name.",
      errorContactEmpty: "Add an email or a WhatsApp number so we can reach you.",
      errorContactInvalid: "That doesn't look like an email or a phone number. Please check it.",
    },
  },

  footer: {
    tagline: "Management software for small and medium-sized businesses, built in minutes with the Builder, and built to order when your trade is outside the usual.",
    product: "Product",
    company: "Company",
    connect: "Connect",
    brand: "OUAQT",
    rights: "All rights reserved.",
    terms: "Licence and terms",
    privacy: "Privacy policy",
  },

  notFound: {
    heading: "We couldn't find that page.",
    body: "It may have moved. Head back to the home page, or tell us what you were looking for.",
    cta: "Back to home",
  },

  /*
   * Project case studies. Keyed by slug so lib/data/projects.ts keeps only the
   * structural fields (slug, category, year, cover image).
   */
  projects: {
    "gmm-mining": {
      metaTitle: "GMM: daily reconciliation from 4 hours to 25 minutes",
      metaDescription: "Block tracking in three languages that brought the daily reconciliation down from four hours to twenty five minutes, on the mine site.",
      title: "GMM Bloc Tracking & Reconciliation",
      summary: "Bloc tracking in three languages that cut daily reconciliation from four hours to twenty-five minutes.",
      description: "Every day, GMM spent four hours reconciling bloc movements by hand. We replaced that with a system built around how the field crews already work, in the three languages they use.",
      client: "GMM · Mining",
      problem: "Reconciling the day's bloc movements took four hours, by hand, across paper logs and spreadsheets. Crews wrote in French, Arabic or English depending on who was on shift, so nothing matched cleanly at the end of the day.",
      solution: "A tracking and reconciliation system built around the crews' real routine. It works in all three languages from day one, because that is how the teams already record their data. We brought years of old records in, so the team started with its full history instead of an empty system.",
      tags: [
        "Reconciliation",
        "French, Arabic, English",
        "Old records brought in",
      ],
      tools: [
        "Organised around GMM's own bloc records",
        "Years of history brought in",
        "Screens in French, Arabic and English",
        "Set up for GMM alone",
      ],
      results: [
        "Daily reconciliation cut from 4 hours to 25 minutes",
        "90% less time spent reconciling, confirmed by GMM",
        "Mixed crews use it in French, Arabic and English",
      ],
    },
    "pharmacy-pos": {
      metaTitle: "Pharmacy software: registers that fill themselves",
      metaDescription: "A pharmacy till that fills the medicine registers instead of the staff. The same software can now be built online, from a few questions.",
      title: "Pharmacy Till & Medicine Records",
      summary: "A pharmacy till that fills in medicine records by itself, so staff stop retyping them.",
      description: "Keeping medicine records meant hours of the same typing every day. Now the system fills them in from the pharmacy's own history, and staff only deal with the unusual cases.",
      client: "Independent pharmacy",
      problem: "Staff spent hours every day typing medicine records by hand, entering the same product details again and again. Each entry was one more chance to put a wrong number into a record that has to be right.",
      solution: "A till that fills in medicine records from past entries. The software handles the repetition, and staff handle the exceptions and the decisions, the part that really needs a person.",
      tags: [
        "Till",
        "Records filled in automatically",
        "Stock",
      ],
      tools: [
        "Organised around the pharmacy's own records",
        "Years of history brought in",
        "Records filled in from past entries",
        "Set up for this pharmacy alone",
      ],
      results: [
        "Two to three hours of typing saved every day, more than 60 hours a month",
        "More than 90% fewer entry errors",
        "Medicine records filled in from the pharmacy's own history",
      ],
    },
    "hotel-operations": {
      metaTitle: "Hotel billing with taxes and commissions worked out",
      metaDescription: "Hotel billing where the software works out the taxes and commissions on every invoice, instead of someone redoing them by hand.",
      title: "Hotel Billing & Operations",
      summary: "Hotel billing where the software works out taxes and commissions on every bill.",
      description: "Working out taxes and commissions by hand kept causing billing mistakes. The system applies the hotel's own rules, the same way, on every bill.",
      client: "Hotel · Hospitality",
      problem: "Taxes and commissions across several services were calculated by hand. Fiddly, repetitive sums on every line of every bill, and a regular source of mistakes.",
      solution: "A billing and operations system that follows the hotel's actual tax and commission rules, so every service line is calculated the same way, whoever is on the front desk.",
      tags: [
        "Billing",
        "Taxes & commissions",
        "Daily operations",
      ],
      tools: [
        "Organised around the hotel's own records",
        "Billing that follows the hotel's rules",
        "Years of history brought in",
        "Set up for this hotel alone",
      ],
      results: [
        "More than 90% fewer billing errors",
        "About two hours of calculation a day taken off the front desk, roughly 50 hours a month",
        "Taxes and commissions applied the same way on every line",
      ],
    },
    "transport-manifests": {
      metaTitle: "Transport manifests prepared for you",
      metaDescription: "Checkpoint manifests prepared from the trip's own data, instead of an hour of paperwork before every departure.",
      title: "Transport Manifests & Checkpoints",
      summary: "Checkpoint papers prepared from trip data, instead of an hour of paperwork before every departure.",
      description: "Each trip needed about an hour of paperwork before the vehicle could leave. Now the system prepares those documents from information the company already has.",
      client: "Transport operator",
      problem: "Every trip took around an hour of manual work to put the checkpoint manifests together. The papers must be correct before a vehicle can leave, and they were rebuilt by hand each time.",
      solution: "A system that prepares checkpoint manifests from the trip and cargo details already entered. Before departure, staff check the documents instead of writing them from scratch.",
      tags: [
        "Checkpoints",
        "Manifests",
        "Trips",
      ],
      tools: [
        "Organised around the company's trip records",
        "Manifests prepared automatically",
        "Years of history brought in",
        "Set up for this company alone",
      ],
      results: [
        "Departure paperwork cut from an hour a trip to a few minutes",
        "More than 90% fewer paperwork errors at checkpoints",
        "Manifests built from trip and cargo details already in the system",
      ],
    },
    "school-operations": {
      metaTitle: "SchoolOS: pupils, fees and attendance in one place",
      metaDescription: "One system for pupils, teachers, fees, attendance and the school shop, running without internet on the school's own computers.",
      title: "SchoolOS Student Records & Tuition",
      summary: "One system for students, teachers, fees, attendance and the school shop, working without internet on the school's own computers.",
      description: "A private school group kept enrolments, fees, attendance and shop sales in separate books and spreadsheets. SchoolOS brings it all together, on the computers the staff already use.",
      client: "Écoles Al-Baraka · Education",
      problem: "Student files, fees, attendance and the shop till were each kept somewhere different. Answering a simple question, like which families still owed fees, meant checking several books by hand. Attendance was only as up to date as the last person who copied it out.",
      solution: "One system for students, teachers, fees, attendance, finances and the shop till. It installs on the school's computers and keeps its data there, so it carries on working when the internet drops. On a campus where the connection can't be relied on, that matters.",
      tags: [
        "Student records",
        "Fees",
        "Attendance",
      ],
      tools: [
        "Installed on the school's own computers",
        "Data kept at the school",
        "Works without internet",
        "Set up for this school group alone",
      ],
      results: [
        "Two to three hours of admin saved every day, more than 60 hours a month",
        "More than 90% fewer errors in fees and attendance",
        "Runs without internet on the school's own computers",
      ],
    },
    "restaurant-pos": {
      metaTitle: "Restaurant, cafe and bakery till",
      metaDescription: "A till built for the real rhythm of the room, at the table and at the counter. Coming soon in the OUAQT Builder.",
      title: "Restaurant & Café Till",
      summary: "A till built around how the room really runs, for table service and the bakery counter.",
      description: "Orders, the kitchen and the day's takings were tracked in three different places. The till brings them together and adapts to the pace of each site.",
      client: "Restaurant, café & bakery",
      problem: "Orders, the kitchen and the day's takings were kept apart. Paper tickets, a cash drawer, and a spreadsheet to reconcile at closing. Nothing matched until someone sat down and made it match.",
      solution: "A till made for this business, covering orders, the kitchen and the daily report, set up for each site. That includes the bakery counter, where the products and the pace are nothing like table service.",
      tags: [
        "Till",
        "Kitchen orders",
        "Daily reports",
      ],
      tools: [
        "Organised around the restaurant's own menu and sales",
        "Till screens for staff",
        "Daily sales report",
        "Set up for this business alone",
      ],
      results: [
        "Closing count cut from over an hour to a few minutes each night",
        "Takings match the till without checking by hand, more than 90% fewer errors",
        "Orders, kitchen and daily reports in one system",
      ],
    },
  },
};

/*
 * No `as const` above on purpose. With it, every string would become a literal
 * type ("Home" rather than string) and no translation could ever satisfy it.
 * Widened this way, the key shape is still enforced, so fr.ts and ar.ts fail
 * typecheck on a missing or misspelled key.
 */
export type Dictionary = typeof en;
