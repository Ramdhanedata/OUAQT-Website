export type Sector =
  | "Mining"
  | "Pharmacy"
  | "Hospitality"
  | "Transport"
  | "Restaurant";

export type Project = {
  slug: string;
  title: string;
  /** The client's industry, which doubles as the filter on /projects. */
  category: Sector;
  summary: string;
  description: string;
  tags: string[];
  year: string;
  client: string;
  role: string;
  problem: string;
  solution: string;
  tools: string[];
  results: string[];
  /**
   * Real screenshots. Drop files into /public/images/projects/<slug>/ and set
   * the paths here. While these are undefined the site renders a labelled
   * gradient placeholder instead. No broken images, no fake stock photos.
   */
  coverImage?: string;
  gallery?: string[];
};

/*
 * Real OUAQT client work, sourced from the OUAQT pitch deck.
 *
 * IMPORTANT, on metrics: only the GMM mining numbers (4 hrs -> 25 min, 90%)
 * are client-confirmed in the deck, so only that project carries hard numbers.
 * The other four describe what the system does without inventing results.
 * TODO(adel): add real measured numbers to the `results` arrays below as you
 * confirm them with each client. Do not publish estimates as facts.
 *
 * TODO(adel): confirm the exact tech stack per project. `tools` currently
 * reflects the capabilities described in the deck (SQL modeling, per-client
 * deployment, historical migration) rather than named frameworks.
 */
export const projects: Project[] = [
  {
    slug: "gmm-mining",
    title: "GMM Bloc Tracking & Reconciliation",
    category: "Mining",
    summary:
      "A trilingual bloc-tracking system that cut daily reconciliation from four hours to twenty-five minutes.",
    description:
      "GMM's daily reconciliation was a four-hour manual process. OUAQT replaced it with a bloc-tracking system built around how the field crews already work, including the three languages they already work in.",
    tags: ["Reconciliation", "Bilingual FR/AR/EN", "Data migration"],
    year: "2025",
    client: "GMM · Mining",
    role: "Data modeling, system architecture, historical migration, deployment",
    problem:
      "Reconciling daily bloc movement took four hours a day, done by hand across paper logs and spreadsheets. Field teams recorded data in French, Arabic, or English depending on who was on shift, so nothing lined up cleanly at the end of the day.",
    solution:
      "A bloc-tracking and reconciliation system designed around the crew's real workflow rather than a template. It is trilingual by default, because that is how field teams already log data. Years of historical records were migrated in, so the team started with their full history instead of an empty database.",
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
  {
    slug: "pharmacy-pos",
    title: "Pharmacy POS & Medicine Records",
    category: "Pharmacy",
    summary:
      "A pharmacy point-of-sale that auto-fills medicine records instead of making staff retype them.",
    description:
      "Medicine record-keeping was hours of repetitive typing every day. The system now fills records from the pharmacy's own history, leaving staff to handle the exceptions.",
    tags: ["Point of sale", "Records automation", "Inventory"],
    year: "2025",
    client: "Independent pharmacy",
    role: "Data modeling, system architecture, historical migration, deployment",
    problem:
      "Staff spent hours a day on manual data entry for medicine records, retyping the same product details over and over. Every entry was another chance to put a wrong number into a record that has to be right.",
    solution:
      "A pharmacy POS that auto-fills medicine records from historical entries. Automation absorbs the repetition; staff handle the exceptions and the judgment calls, which is the part that actually needs a person.",
    tools: [
      "SQL data modeling",
      "Historical data migration",
      "Automated record completion",
      "Dedicated per-client deployment",
    ],
    results: [
      "Medicine records auto-filled from the pharmacy's own history",
      "Repetitive data entry reduced to exception handling",
      // TODO(adel): add the measured time saved per day once confirmed.
    ],
    coverImage: "/images/projects/pharmacy-pos/cover.png",
  },
  {
    slug: "hotel-operations",
    title: "Hotel Billing & Operations",
    category: "Hospitality",
    summary:
      "Service billing with tax and commission math handled by the system rather than by hand.",
    description:
      "Tax and commission calculations across services were a recurring source of billing errors. The system encodes the property's real rules so the math is applied the same way every time.",
    tags: ["Billing", "Tax & commission", "Operations"],
    year: "2025",
    client: "Hotel · Hospitality",
    role: "Data modeling, system architecture, historical migration, deployment",
    problem:
      "Tax and commission calculations across multiple services were worked out manually. It is fiddly, repetitive math applied to every line of every bill, and a common source of billing errors.",
    solution:
      "A billing and operations system that encodes the property's actual tax and commission rules, so the calculation is applied consistently on every service line instead of being re-derived by whoever is on the desk.",
    tools: [
      "SQL data modeling",
      "Rules-based billing engine",
      "Historical data migration",
      "Dedicated per-client deployment",
    ],
    results: [
      "Tax and commission math applied consistently across every service line",
      "Manual billing calculation removed from daily front-desk work",
      // TODO(adel): add the measured reduction in billing errors once confirmed.
    ],
    coverImage: "/images/projects/hotel-operations/cover.png",
  },
  {
    slug: "transport-manifests",
    title: "Transport Manifests & Checkpoints",
    category: "Transport",
    summary:
      "Checkpoint manifests generated from trip data, replacing an hour of manual prep before every departure.",
    description:
      "Every trip needed about an hour of paperwork before the vehicle could leave. The system builds those manifests from data the business already holds.",
    tags: ["Compliance", "Manifests", "Logistics"],
    year: "2025",
    client: "Transport operator",
    role: "Data modeling, system architecture, historical migration, deployment",
    problem:
      "Every trip required roughly an hour of manual preparation to assemble checkpoint manifests. That paperwork has to be correct before a vehicle is allowed to leave, and it was rebuilt by hand every time.",
    solution:
      "A system that generates checkpoint manifests from the trip and cargo data already captured, turning departure prep into a review step rather than a rebuild from scratch.",
    tools: [
      "SQL data modeling",
      "Document generation",
      "Historical data migration",
      "Dedicated per-client deployment",
    ],
    results: [
      "Checkpoint manifests generated from existing trip and cargo data",
      "Pre-departure prep reduced to a review step",
      // TODO(adel): add the measured prep time saved per trip once confirmed.
    ],
    coverImage: "/images/projects/transport-manifests/cover.png",
  },
  {
    slug: "restaurant-pos",
    title: "Restaurant & Café POS",
    category: "Restaurant",
    summary:
      "A point-of-sale built around how the floor actually runs, for table service and the bakery counter alike.",
    description:
      "Orders, kitchen flow, and daily takings lived in three different places. The POS puts them in one, and adapts to the pace of each site.",
    tags: ["Point of sale", "Kitchen flow", "Daily reporting"],
    year: "2025",
    client: "Restaurant, café & bakery",
    role: "Data modeling, system architecture, historical migration, deployment",
    problem:
      "Orders, the kitchen, and the day's takings lived in separate places. Paper tickets, a cash drawer, and a spreadsheet reconciled at closing. Nothing agreed with anything else until someone sat down and made it agree.",
    solution:
      "A custom POS covering ordering, kitchen flow, and daily reporting, adapted per site, including bakery counter service, where the product mix and the pace are nothing like table service.",
    tools: [
      "SQL data modeling",
      "Point-of-sale interface",
      "Daily reporting",
      "Dedicated per-client deployment",
    ],
    results: [
      "Ordering, kitchen flow, and daily takings unified in one system",
      "Adapted per site, including bakery counter service",
      // TODO(adel): add the measured closing/reconciliation time saved.
    ],
    coverImage: "/images/projects/restaurant-pos/cover.png",
  },
];

export function getProjectBySlug(slug: string) {
  return projects.find((project) => project.slug === slug);
}

export function getAllCategories(): Sector[] {
  return Array.from(new Set(projects.map((project) => project.category)));
}
