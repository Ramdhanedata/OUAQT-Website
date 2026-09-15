/*
 * English is the source of truth. Its shape becomes the `Dictionary` type,
 * so fr.ts and ar.ts will fail typecheck if a key is missing or misspelled.
 */
export const en = {
  meta: {
    siteTitle: "OUAQT | Custom systems for real business workflows",
    siteDescription:
      "OUAQT builds custom systems for businesses still running on paper, Excel, and WhatsApp. 22 live systems across six sectors, from mining and pharmacy to hospitality, transport, food service, and education.",
    projectsTitle: "Projects | OUAQT",
    projectsDescription:
      "22 live systems across six sectors, built for clients in mining, pharmacy, hospitality, transport, food service, and education.",
    aboutTitle: "About OUAQT",
    aboutDescription:
      "OUAQT builds custom systems for businesses running on paper, Excel, and WhatsApp. Founded by Elboumby Aumar Ramdhane in Nouakchott, Mauritania.",
    contactTitle: "Contact | OUAQT",
    contactDescription:
      "Tell OUAQT how your business runs today, and where a custom system would save the most time.",
    termsTitle: "Licence and terms of use | OUAQT",
    termsDescription:
      "Who owns an OUAQT system, what your licence covers, and how it renews.",
    privacyTitle: "Privacy policy | OUAQT",
    privacyDescription:
      "What OUAQT does with personal information, on this website and inside the systems we build.",
    pricingTitle: "Pricing | OUAQT",
    pricingDescription:
      "An installation fee paid once, then an annual licence, at the same prices for every OUAQT product. The software runs on your own computers with no internet needed for daily work.",
  },

  nav: {
    home: "Home",
    projects: "Projects",
    pricing: "Pricing",
    about: "About",
    contact: "Contact",
    cta: "Start a project",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    language: "Language",
    homeAria: "OUAQT home",
  },

  hero: {
    eyebrow: "OUAQT · Custom business systems",
    heading:
      "We find what slows your business down, then build the system that fixes it.",
    body: "Every business has work that takes longer than it should. We learn how yours really operates, then build one system around it that removes the manual effort and gives your team its time back.",
    primaryCta: "Tell us what's slowing you down",
    secondaryCta: "See our projects",
  },

  impact: {
    liveSystems: "Live systems in production",
    sectors: "Sectors served, with more on the way",
    reduction: "Less reconciliation time at GMM",
    buildTime: "From brief to working build",
    buildTimeValue: "48-96h",
  },

  problem: {
    eyebrow: "The problem",
    heading: "Most businesses still run on paper, Excel, and WhatsApp.",
    body: "Not because it works, but because they've never had software built for how they actually operate.",
    items: {
      mining: "A daily 4-hour reconciliation process, done by hand.",
      pharmacy: "Hours of manual data entry for medicine records.",
      hospitality:
        "Tax and commission math across services, a common source of billing errors.",
      transport:
        "An hour of manual prep before every trip for checkpoint manifests.",
    },
  },

  pillars: {
    eyebrow: "The solution",
    heading:
      "Custom digital systems, built around how each business actually works.",
    workflow: {
      title: "Built around the real workflow, not a template",
      body: "Every system is designed from how your team actually works, including the language they work in. The GMM mining system runs French, Arabic, and English because that is how field crews log data.",
    },
    automation: {
      title: "Automation handles the repetition, people handle the exceptions",
      body: "The pharmacy system fills medicine records from past entries instead of asking staff to retype them. What is left is the work that genuinely needs a person.",
    },
    migration: {
      title: "Full migration, isolated per client",
      body: "Years of paper and spreadsheet history come across with you, so nobody starts from a blank system. And no client's data ever touches another's.",
    },
  },

  proof: {
    eyebrow: "Proof it works",
    heading: "One number that says it all.",
    body: "GMM's field teams were reconciling bloc movement by hand, four hours a day, across three languages. The system we built for them does it in twenty-five minutes.",
    cta: "Read the GMM case",
    client: "GMM · Mining client",
    metric: "Daily reconciliation",
    before: "Before",
    after: "After",
    beforeValue: "4 hours",
    afterValue: "25 min",
    reduction: "90% reduction",
    reductionNote: "In reconciliation time, confirmed by the client.",
  },

  featured: {
    heading: "Projects in production",
    body: "22 live systems, each built for one business and the way it actually runs.",
    cta: "View all projects",
  },

  homeCta: {
    heading: "Every system starts with a conversation.",
    body: "Tell us how your business runs today. The paper, the spreadsheets, the group chats. That is where we start, and it usually takes one call to see where the first system belongs.",
    primary: "Get in touch",
    secondary: "About OUAQT",
  },

  projectsPage: {
    eyebrow: "Projects",
    heading: "22 systems in production, no templates.",
    body: "Every build starts with how the business already runs, not with a product we had sitting on a shelf. We map the daily workflow, model the data behind it, migrate years of paper and spreadsheet history, and run each system on its own isolated deployment. Mining, pharmacy, hospitality, transport, food service and education so far, with a selection of the work below.",
    all: "All",
  },

  pricing: {
    eyebrow: "Pricing",
    heading: "One set of prices for every product we install.",
    body: "Installation is paid once and the licence each year. The software runs on your own computers, with no internet needed for daily work.",
    yearOneLabel: "First year, installation included",
    launchNote: "Launch pricing for our first {clients} clients.",
    cta: "See pricing",
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
    yearOne: {
      label: "First year",
      cadence: "Installation and annual licence",
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
    products: "Today these prices cover {pharmacy}, {hotel} and {transport}.",
    productNames: {
      pharmacy: "PharmaSys",
      hotel: "the hotel system",
      transport: "the transport system",
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
    heading: "We start by sitting with you.",
    body: "No forms to fill in, no requirements document to write. We come to you, and the work starts from what we see.",
    steps: {
      listen: {
        title: "We sit with you and listen",
        body: "We come to you and spend time with your team, watching the day as it actually happens rather than how it is meant to. Where things go wrong, what gets done twice, which numbers nobody quite trusts. You know your business better than we ever will, so mostly we listen.",
      },
      build: {
        title: "We build around your workflow",
        body: "The system follows the steps your team already knows, in the language they already use. Your existing records come across with you.",
      },
      stay: {
        title: "We stay after it goes live",
        body: "We train your staff in person. After that, for as long as the licence runs, we fix what goes wrong and adjust what exists when the way you work changes.",
      },
    },
  },

  faq: {
    eyebrow: "Questions",
    heading: "The things people ask before starting.",
    items: {
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
        a: "While the licence is renewed, changes to what already exists are included. A new screen or process is a new module and is quoted separately, and we tell you which one it is before we start.",
      },
      training: {
        q: "Do you train my team?",
        a: "Yes, in person, for as long as it takes them to feel confident. Training is part of the installation fee and is never billed on its own.",
      },
      migration: {
        q: "What happens to my old records?",
        a: "They come with you. We migrate years of paper and spreadsheets into the new system, so nobody starts from an empty screen.",
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
      intro:
        "These terms cover software OUAQT builds and deploys for you. They sit alongside the written agreement for your project. Where the two differ, your agreement wins.",
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
    solution: "The solution",
    results: "Results",
    client: "Client",
    role: "Role",
    tools: "Tools",
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
    heading: "A structural gap, not a single industry problem.",
    body1:
      "Across mining, pharmacy, hospitality, transport, food service and education, the same pattern keeps appearing. Capable businesses running critical operations on paper, spreadsheets, and group chats. Not because it works, but because nobody has ever built software for how they actually operate.",
    body2:
      "OUAQT exists to close that gap one business at a time, with a system designed around a single client's real workflow, their real history, and the languages their team actually uses.",
    marketHeading: "The gap is measurable.",
    stat1: "of Mauritania's GDP runs through the informal sector",
    stat2: "of the workforce is in informal employment",
    stat3: "Investment Code now explicitly prioritizes SME support",
    marketNote:
      "The World Bank and IFC are actively funding SME access to finance and digital tools across the region. That is the same gap OUAQT is built to close.",
    founderEyebrow: "Founder",
    founderRole: "Founder & AI Product Engineer",
    founderBio1:
      "I started OUAQT after watching capable businesses lose hours every day to work their software should have been handling for them. Not complicated work. Just counting, copying, and checking numbers by hand because nothing they had been sold fit the way they actually operated.",
    founderBio2:
      "My background is in data analytics and product engineering. I stay close to every project, from the first conversation about how a business really runs to the system that finally replaces the spreadsheet.",
    credentials: {
      analytics: {
        title: "Data analytics at Deloitte and MyAiPathways",
        detail:
          "Consulting and product work on how organizations collect, model, and actually use their data.",
      },
      snim: {
        title: "Workflow automation at SNIM",
        detail:
          "Rebuilt a three day process so it finished in eight hours, on one of Mauritania's largest industrial operations.",
      },
      undp: {
        title: "UNDP Knowledge Future Skills Academy winner, 2025",
        detail:
          "Selected from the regional cohort, and keynote speaker at the Knowledge Summit in Dubai the same year.",
      },
      sectors: {
        title: "Systems live across six sectors",
        detail:
          "Mining, pharmacy, hospitality, transport, food service, and education, each running on its own dedicated deployment.",
      },
    },
    ctaHeading: "Tell us what slows your business down.",
    ctaBody:
      "If any part of your day still runs on a spreadsheet nobody trusts, that is usually where the first system goes.",
    ctaButton: "Start the conversation",
  },

  contact: {
    eyebrow: "Contact",
    heading: "Start with whatever wastes the most time.",
    body: "Tell us how the day actually runs. What gets written on paper, what gets typed in twice, where the numbers stop agreeing. We map the workflow first, then build the smallest system that takes the most manual work off your team.",
    whatsapp: "WhatsApp",
    form: {
      name: "Name",
      namePlaceholder: "Jane Doe",
      email: "Email",
      emailPlaceholder: "jane@company.com",
      message: "Message",
      messagePlaceholder:
        "What does your business run on today? Paper, spreadsheets, WhatsApp? Tell us where it slows you down.",
      submit: "Send message",
      sending: "Sending…",
      errorSend:
        "That didn't send. Please try again, or email us directly at",
      successTitle: "Message received.",
      successBody: "Thanks for reaching out. We usually reply within one business day.",
      sendAnother: "Send another message",
      errorName: "Please enter your name.",
      errorEmailEmpty: "Please enter your email.",
      errorEmailInvalid: "Please enter a valid email address.",
      errorMessageEmpty: "Tell us a bit about your business.",
      errorMessageShort: "A few more details would help (20+ characters).",
    },
  },

  footer: {
    tagline:
      "Custom systems for businesses still running on paper, Excel, and WhatsApp.",
    navigate: "Navigate",
    connect: "Connect",
    brand: "OUAQT",
    rights: "All rights reserved.",
    legal: "Legal",
    terms: "Licence and terms",
    privacy: "Privacy policy",
  },

  notFound: {
    heading: "This page doesn't exist.",
    body: "The page you're looking for may have been moved or removed.",
    cta: "Back to home",
  },

  /*
   * Project case studies. Keyed by slug so lib/data/projects.ts keeps only the
   * structural fields (slug, category, year, cover image).
   */
  projects: {
    "gmm-mining": {
      title: "GMM Bloc Tracking & Reconciliation",
      summary:
        "A trilingual bloc-tracking system that cut daily reconciliation from four hours to twenty-five minutes.",
      description:
        "GMM's daily reconciliation was a four-hour manual process. OUAQT replaced it with a bloc-tracking system built around how the field crews already work, including the three languages they already work in.",
      client: "GMM · Mining",
      role: "Data modeling, system architecture, historical migration, deployment",
      problem:
        "Reconciling daily bloc movement took four hours a day, done by hand across paper logs and spreadsheets. Field teams recorded data in French, Arabic, or English depending on who was on shift, so nothing lined up cleanly at the end of the day.",
      solution:
        "A bloc-tracking and reconciliation system designed around the crew's real workflow rather than a template. It is trilingual by default, because that is how field teams already log data. Years of historical records were migrated in, so the team started with their full history instead of an empty database.",
      tags: ["Reconciliation", "Trilingual FR/AR/EN", "Data migration"],
      tools: [
        "SQL data modeling",
        "Historical data migration",
        "Trilingual UI (FR / AR / EN)",
        "Dedicated per-client deployment",
      ],
      results: [
        "Daily reconciliation cut from 4 hours to 25 minutes",
        "90% reduction in reconciliation time, confirmed by the client",
        "Runs in French, Arabic, and English for mixed field crews",
      ],
    },
    "pharmacy-pos": {
      title: "Pharmacy POS & Medicine Records",
      summary:
        "A pharmacy point-of-sale that auto-fills medicine records instead of making staff retype them.",
      description:
        "Medicine record-keeping was hours of repetitive typing every day. The system now fills records from the pharmacy's own history, leaving staff to handle the exceptions.",
      client: "Independent pharmacy",
      role: "Data modeling, system architecture, historical migration, deployment",
      problem:
        "Staff spent hours a day on manual data entry for medicine records, retyping the same product details over and over. Every entry was another chance to put a wrong number into a record that has to be right.",
      solution:
        "A pharmacy POS that auto-fills medicine records from historical entries. Automation absorbs the repetition; staff handle the exceptions and the judgment calls, which is the part that actually needs a person.",
      tags: ["Point of sale", "Records automation", "Inventory"],
      tools: [
        "SQL data modeling",
        "Historical data migration",
        "Automated record completion",
        "Dedicated per-client deployment",
      ],
      results: [
        "Two to three hours of data entry saved every day, over 60 hours a month",
        "Entry errors down by more than 90%",
        "Medicine records auto-filled from the pharmacy's own history",
      ],
    },
    "hotel-operations": {
      title: "Hotel Billing & Operations",
      summary:
        "Service billing with tax and commission math handled by the system rather than by hand.",
      description:
        "Tax and commission calculations across services were a recurring source of billing errors. The system encodes the property's real rules so the math is applied the same way every time.",
      client: "Hotel · Hospitality",
      role: "Data modeling, system architecture, historical migration, deployment",
      problem:
        "Tax and commission calculations across multiple services were worked out manually. It is fiddly, repetitive math applied to every line of every bill, and a common source of billing errors.",
      solution:
        "A billing and operations system that encodes the property's actual tax and commission rules, so the calculation is applied consistently on every service line instead of being re-derived by whoever is on the desk.",
      tags: ["Billing", "Tax & commission", "Operations"],
      tools: [
        "SQL data modeling",
        "Rules-based billing engine",
        "Historical data migration",
        "Dedicated per-client deployment",
      ],
      results: [
        "Billing errors down by more than 90%",
        "Around two hours a day of manual calculation off the front desk, roughly 50 hours a month",
        "Tax and commission applied the same way on every service line",
      ],
    },
    "transport-manifests": {
      title: "Transport Manifests & Checkpoints",
      summary:
        "Checkpoint manifests generated from trip data, replacing an hour of manual prep before every departure.",
      description:
        "Every trip needed about an hour of paperwork before the vehicle could leave. The system builds those manifests from data the business already holds.",
      client: "Transport operator",
      role: "Data modeling, system architecture, historical migration, deployment",
      problem:
        "Every trip required roughly an hour of manual preparation to assemble checkpoint manifests. That paperwork has to be correct before a vehicle is allowed to leave, and it was rebuilt by hand every time.",
      solution:
        "A system that generates checkpoint manifests from the trip and cargo data already captured, turning departure prep into a review step rather than a rebuild from scratch.",
      tags: ["Compliance", "Manifests", "Logistics"],
      tools: [
        "SQL data modeling",
        "Document generation",
        "Historical data migration",
        "Dedicated per-client deployment",
      ],
      results: [
        "Pre-departure prep cut from an hour a trip to a few minutes",
        "Paperwork errors at checkpoints down by more than 90%",
        "Manifests generated from trip and cargo data already in the system",
      ],
    },
    "school-operations": {
      title: "SchoolOS Student Records & Tuition",
      summary:
        "One system for students, teachers, tuition, attendance and the campus till, running offline on the school's own machines.",
      description:
        "A private school group was tracking enrolment, fees, attendance and shop takings in separate books and spreadsheets. SchoolOS puts all of it in one place, on the desks the staff already use.",
      client: "Écoles Al-Baraka · Education",
      role: "Data modeling, system architecture, historical migration, deployment",
      problem:
        "Student records, tuition, attendance and the campus shop till each lived somewhere different. Answering something as simple as which families still owed fees meant cross-checking several books by hand, and attendance was only as current as the last person to copy it up.",
      solution:
        "One system covering students, teachers, tuition, attendance, finances and the shop till. It is a desktop application with its own local database, so it keeps working when the connection does not, which matters on a campus that cannot depend on the internet.",
      tags: ["Student records", "Tuition & fees", "Attendance"],
      tools: [
        "Electron desktop application",
        "Local SQLite database",
        "Works offline, no connection required",
        "Dedicated per-client deployment",
      ],
      results: [
        "Two to three hours of admin saved every day, over 60 hours a month",
        "Fee and attendance record errors down by more than 90%",
        "Runs offline on the school's own machines",
      ],
    },
    "restaurant-pos": {
      title: "Restaurant & Café POS",
      summary:
        "A point-of-sale built around how the floor actually runs, for table service and the bakery counter alike.",
      description:
        "Orders, kitchen flow, and daily takings lived in three different places. The POS puts them in one, and adapts to the pace of each site.",
      client: "Restaurant, café & bakery",
      role: "Data modeling, system architecture, historical migration, deployment",
      problem:
        "Orders, the kitchen, and the day's takings lived in separate places. Paper tickets, a cash drawer, and a spreadsheet reconciled at closing. Nothing agreed with anything else until someone sat down and made it agree.",
      solution:
        "A custom POS covering ordering, kitchen flow, and daily reporting, adapted per site, including bakery counter service, where the product mix and the pace are nothing like table service.",
      tags: ["Point of sale", "Kitchen flow", "Daily reporting"],
      tools: [
        "SQL data modeling",
        "Point-of-sale interface",
        "Daily reporting",
        "Dedicated per-client deployment",
      ],
      results: [
        "Closing reconciliation cut from over an hour to a few minutes each night",
        "Takings now match the till without hand-checking, errors down by more than 90%",
        "Ordering, kitchen flow and daily reporting in one system",
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
