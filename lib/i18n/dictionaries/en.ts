/*
 * English is the source of truth. Its shape becomes the `Dictionary` type,
 * so fr.ts and ar.ts will fail typecheck if a key is missing or misspelled.
 */
export const en = {
  meta: {
    siteTitle: "Build your shop's software | OUAQT",
    siteDescription: "Answer a few questions and leave with the software your shop runs on, ready to install. It works without internet and your data stays on your computer.",
    projectsTitle: "Projects: 22 systems in daily use | OUAQT",
    projectsDescription: "Pharmacies, hotels, transport, restaurants, mines and schools. See what each system changed, then build your own from a few questions.",
    aboutTitle: "About OUAQT and its founder",
    aboutDescription: "Why OUAQT builds management software for small businesses, from the online builder to custom projects. Founded by Elboumby Aumar Ramdhane.",
    contactTitle: "Contact | OUAQT",
    contactDescription: "Tell us what takes your team too long. We usually reply within one business day, by email or on WhatsApp.",
    termsTitle: "Licence and terms of use | OUAQT",
    termsDescription:
      "Who owns an OUAQT system, what your licence covers, and how it renews.",
    privacyTitle: "Privacy policy | OUAQT",
    privacyDescription:
      "What OUAQT does with personal information, on this website and inside the systems we build.",
    pricingTitle: "Pricing: software you build online, and custom projects | OUAQT",
    pricingDescription:
      "Every OUAQT price in one place: the software you build online, then installation and the annual licence for custom projects.",
    shareLine: "22 systems in daily use across mining, pharmacy, hospitality, transport, food service and education.",
    shareAlt: "OUAQT: we find what slows your business down, and build the software that fixes it.",
    shareReach: "We work on site or remotely.",
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
    home: "Home",
    projects: "Projects",
    pricing: "Pricing",
    about: "About",
    contact: "Contact",
    cta: "Talk to us",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    language: "Language",
    homeAria: "OUAQT home",
  },

  hero: {
    eyebrow: "OUAQT · Custom business software",
    heading: "We find what slows your business down, and build the software that fixes it.",
    body: "Typing the same record twice. Staying late because the till and the notebook don't match. We come to your business and watch how the work really gets done. Then we build software around it, so your team gets those hours back.",
    primaryCta: "Tell us what's slowing you down",
    secondaryCta: "See what we've built",
    freeVisit: "Your first visit is free, with no commitment.",
  },

  impact: {
    liveSystems: "Systems in daily use",
    sectors: "Sectors we work in",
    reduction: "Less time spent reconciling at GMM",
    buildTime: "To working software, after our first visit",
    buildTimeValue: "48-72h",
  },

  problem: {
    eyebrow: "Sound familiar?",
    heading: "Most businesses still run on paper, Excel and WhatsApp.",
    body: "Usually that's because the software they were offered never fit the way they work, so the notebook stayed.",
    items: {
      mining: "Four hours every day spent reconciling figures by hand.",
      pharmacy: "Hours of typing out medicine records, one line at a time.",
      hospitality: "Taxes and commissions worked out by hand on every bill, and the billing mistakes that come with it.",
      transport: "An hour of paperwork before every trip can leave.",
    },
  },

  pillars: {
    eyebrow: "How we fix it",
    heading: "We shape the software around your business, so your team doesn't have to change how it works.",
    workflow: {
      title: "It works the way your team already works",
      body: "We start from your real routine, down to the language your staff write in. At GMM the field crews log data in French, Arabic and English, so their system speaks all three.",
    },
    automation: {
      title: "The computer does the repetitive part",
      body: "At the pharmacy, the system fills in medicine records from past entries, so staff stopped retyping them. Your people keep the work that needs their judgment.",
    },
    migration: {
      title: "Your old records come with you",
      body: "We bring years of paper and spreadsheet history into the new system, so nobody starts from an empty screen. Your data stays yours, and it is never mixed with another client's.",
    },
  },

  proof: {
    eyebrow: "A real result",
    heading: "Four hours of daily work, now done in twenty-five minutes.",
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

  featured: {
    heading: "Some of our work",
    body: "22 systems in daily use. Each one was built for a single business and the way it runs.",
    cta: "See all projects",
  },

  homeCta: {
    heading: "Tell us where your day goes.",
    body: "Tell us how your business runs today, paper and WhatsApp groups included. One conversation is usually enough to see where software would save you the most time.",
    primary: "Talk to us",
    secondary: "Who we are",
  },

  projectsPage: {
    eyebrow: "Projects",
    heading: "22 systems, in use every day.",
    body: "Every project starts with a visit. We learn how the business runs, bring its old records across, and set the software up for that client alone. So far that has meant mines, pharmacies, hotels, transport companies, restaurants and schools. Here is a selection.",
    all: "All",
  },

  /*
   * The pricing page. Figures are never typed here: {placeholders} are filled
   * from lib/data/pricing.ts, and prices render from the same file.
   */
  pricingPage: {
    eyebrow: "Pricing",
    heading: "Installation once, then a licence each year.",
    intro:
      "Installation pays for our days of work at your site, training your team and bringing your old records across. After that the software runs on your own computers and needs no internet connection for daily work.",
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
      body: "That covers updates, the product catalogue, off-site backup, support and modifications for {months} months only. After that the software keeps running with nothing more to pay and no further service.",
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
        "Off-site backup",
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
          a: "On your own computers, at your premises. The licence also includes an off-site backup, so your records do not depend on a single machine.",
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

  process: {
    eyebrow: "How we work",
    heading: "It starts with a visit.",
    body: "You don't need to fill in forms or write a specification. We come to you and start from what we see.",
    steps: {
      listen: {
        title: "We sit with your team and listen",
        body: "We spend time with the people doing the work and watch an ordinary day as it really goes. Where things go wrong, what gets done twice, which numbers nobody quite trusts. You know your business better than we do, so mostly we listen. This first visit is free.",
      },
      build: {
        title: "We build it around your routine",
        body: "The software follows the steps your team already knows, in the language they already use, and your existing records come along.",
      },
      stay: {
        title: "We stay after it goes live",
        body: "We train your staff in person. After that, for as long as the licence runs, we fix what goes wrong and adjust things when the way you work changes.",
      },
    },
  },

  faq: {
    eyebrow: "Questions",
    heading: "Questions people ask us before starting.",
    items: {
      visit: {
        q: "Do you charge for the first visit?",
        a: "No. We come to see how your business runs and tell you what we would build and what it would cost. You decide afterwards, with no commitment.",
      },
      duration: {
        q: "How long does it take?",
        a: "We spend the first day with you, understanding how the work actually runs. After that, most systems are ready in 48 to 72 hours. If yours is larger and needs longer, we say so before you commit to anything.",
      },
      offline: {
        q: "What if the internet goes down?",
        a: "Nothing changes. Our software runs on your own computers, and daily work happens without a connection.",
      },
      data: {
        q: "Who owns the data?",
        a: "You do. It stays on your own computers and never mixes with another client's. Ask for a copy at any time and we hand it over.",
      },
      changes: {
        q: "What if I need something changed later?",
        a: "For as long as the licence is renewed, changes to what you already have are included. Something new, like an extra screen or process, is a new module with its own quote, and we tell you which is which before we start.",
      },
      training: {
        q: "Do you train my team?",
        a: "Yes, in person, for as long as it takes them to feel confident. Training is part of the installation fee and is never billed on its own.",
      },
      migration: {
        q: "What happens to my old records?",
        a: "They come with you. We bring years of paper and spreadsheets into the new system, so nobody starts from an empty screen.",
      },
      broken: {
        q: "What if something breaks?",
        a: "We fix it. While the licence is renewed, anything wrong or slow in what we delivered is corrected at no charge, and you deal with the person who built it.",
      },
    },
  },

  legal: {
    updated: "Last updated",
    updatedDate: "September 2026",
    terms: {
      title: "Licence and terms of use",
      intro: "These terms cover software OUAQT builds and installs for you. They sit alongside the written agreement for your project. Where the two differ, your agreement wins.",
      ownership: {
        h: "We own the software",
        b: "OUAQT owns the system, its source code, its design and its documentation, along with anything added to it later. Paying for a project does not transfer that ownership.",
      },
      licence: {
        h: "You hold a licence to use it",
        b: "You receive a non-exclusive licence to use the software inside your own business, on up to {devices} devices at the same site. The annual licence renews automatically each year by tacit renewal and can be cancelled before the renewal date. The perpetual licence is paid once and does not renew.",
      },
      restrictions: {
        h: "What the licence does not allow",
        b: "The licence is for your business alone. Under it you may not:",
        items: [
          "sell, rent, lend or otherwise pass the system to anyone else",
          "give access to another business, including a related company, without our written agreement",
          "copy the software, or install it on more devices than your licence covers",
          "take it apart, decompile it, or attempt to recover the source code",
          "remove or alter any OUAQT name or notice inside it",
          "use it to build or assist a competing product",
        ],
      },
      yourData: {
        h: "Your data stays yours",
        b: "Everything your business puts into the system, and everything we migrate into it, belongs to you. We do not sell it, do not use it for anything beyond running and supporting your system, and never mix it with another client's. Ask for a copy at any time and we hand it over.",
      },
      corrections: {
        h: "Corrections",
        b: "While the annual licence is renewed, we correct anything wrong or slow in what we delivered at no charge. Under the perpetual licence those corrections are included for {months} months. They do not cover changes made by someone else, or hardware and network faults outside the software.",
      },
      support: {
        h: "What the licence covers",
        b: "Installation, staff training and data migration are paid once, through the installation fee or the perpetual licence price. The annual licence then includes updates, the product catalogue where the product has one, off-site backup, support, and modifications to existing behaviour on request, for as long as it is renewed. The perpetual licence includes the same for {months} months only, after which the software keeps running with no further payment and no further service. A new module is always quoted separately, and OUAQT tells you before starting whether a request is a modification or a new module.",
      },
      termination: {
        h: "Late renewal and the end of the licence",
        b: "If the annual licence is renewed late, entering new data is suspended until it is paid. Reading and exporting your data is never blocked. The licence can also end if these terms are broken in a serious way and the problem is not put right after we raise it, and in every case we give you a complete copy of your data.",
      },
      law: {
        h: "Governing law",
        b: "These terms are governed by the law of the Islamic Republic of Mauritania, and any dispute is heard by the courts of Nouakchott.",
      },
    },
    privacy: {
      title: "Privacy policy",
      intro:
        "What OUAQT does with personal information, both on this website and inside the systems we build.",
      collect: {
        h: "What this website collects",
        b: "Only what you type into the contact form: your name, your email address, your message, and which language you were reading in. There are no advertising trackers and no third-party analytics on this site.",
      },
      why: {
        h: "Why we collect it",
        b: "To read your enquiry and reply to it. Nothing else. You are not added to any mailing list.",
      },
      sharing: {
        h: "Who else sees it",
        b: "Your message passes through the service that delivers our email so it can reach our inbox, and this site is hosted by Vercel. Neither is permitted to use your information for their own purposes. We never sell it and never pass it to anyone else.",
      },
      retention: {
        h: "How long we keep it",
        b: "Your message stays in our email for as long as the conversation is useful. Ask us to delete it and we will.",
      },
      clientSystems: {
        h: "Data inside the systems we build",
        b: "When we install software for your business, the records inside it are yours, not ours. They stay on your own computers, separate from every other client, and the licence adds an off-site backup copy. We look at them only when you ask us to for support, and never for anything else.",
      },
      rights: {
        h: "Your rights",
        b: "Ask what we hold about you, ask for a copy, or ask us to delete it. Write to the address below and we act on it.",
      },
      contact: {
        h: "Getting in touch",
        b: "Questions about this policy, or about anything we hold, go to ouaqt.mrt@gmail.com.",
      },
    },
  },

  projectDetail: {
    back: "All projects",
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
    heading: "The same problem, in every sector we visit.",
    body1: "Mines, pharmacies, hotels, transport companies, restaurants, schools. We keep meeting capable businesses whose most important work runs on paper, spreadsheets and group chats. Usually the software they were offered never fit the way they operate.",
    body2: "That is the problem we work on. Every system we build fits one client: their routine, their records, and the languages their staff use.",
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

  contact: {
    eyebrow: "Contact",
    heading: "Tell us what takes your team too long.",
    body: "You don't need the right words or a plan. Tell us in your own words where the day gets stuck, and we'll look at it with you and suggest the smallest system that saves the most time. The first visit is free.",
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
    tagline: "Software for businesses that still run on paper, Excel and WhatsApp.",
    navigate: "Navigate",
    connect: "Connect",
    brand: "OUAQT",
    rights: "All rights reserved.",
    legal: "Legal",
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
      metaDescription: "A till built for the real rhythm of the room, at the table and at the counter. Coming soon in the OUAQT software builder.",
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
