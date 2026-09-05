/*
 * English is the source of truth. Its shape becomes the `Dictionary` type,
 * so fr.ts and ar.ts will fail typecheck if a key is missing or misspelled.
 */
export const en = {
  meta: {
    siteTitle: "OUAQT | Custom systems for real business workflows",
    siteDescription:
      "OUAQT builds custom systems for businesses still running on paper, Excel, and WhatsApp. Five live products across mining, pharmacy, hospitality, transport, and food service.",
    projectsTitle: "Projects | OUAQT",
    projectsDescription:
      "Five live systems built for mining, pharmacy, hospitality, transport, and food service clients.",
    aboutTitle: "About OUAQT",
    aboutDescription:
      "OUAQT builds custom systems for businesses running on paper, Excel, and WhatsApp. Founded by Elboumby Aumar Ramdhane in Nouakchott, Mauritania.",
    contactTitle: "Contact | OUAQT",
    contactDescription:
      "Tell OUAQT how your business runs today, and where a custom system would save the most time.",
  },

  nav: {
    home: "Home",
    projects: "Projects",
    about: "About",
    contact: "Contact",
    cta: "Start a project",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    toggleTheme: "Toggle theme",
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
    body: "Five live products, each built for one business and the way it actually runs.",
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
    heading: "Five businesses, five systems, no templates.",
    body: "Every build starts with how the business already runs, not with a product we had sitting on a shelf. We map the daily workflow, model the data behind it, migrate years of paper and spreadsheet history, and run each system on its own isolated deployment. Mining, pharmacy, hospitality, transport and food service so far.",
    all: "All",
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
  },

  about: {
    eyebrow: "About OUAQT",
    heading: "A structural gap, not a single industry problem.",
    body1:
      "Across mining, pharmacy, hospitality, transport, and food service, the same pattern keeps appearing. Capable businesses running critical operations on paper, spreadsheets, and group chats. Not because it works, but because nobody has ever built software for how they actually operate.",
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
        title: "Systems live across five sectors",
        detail:
          "Mining, pharmacy, hospitality, transport, and food service, each running on its own dedicated deployment.",
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
    rights: "All rights reserved.",
    builtIn: "Built in Nouakchott.",
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
        "Medicine records auto-filled from the pharmacy's own history",
        "Repetitive data entry reduced to exception handling",
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
        "Tax and commission math applied consistently across every service line",
        "Manual billing calculation removed from daily front-desk work",
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
        "Checkpoint manifests generated from existing trip and cargo data",
        "Pre-departure prep reduced to a review step",
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
        "Ordering, kitchen flow, and daily takings unified in one system",
        "Adapted per site, including bakery counter service",
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
