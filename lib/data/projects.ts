export type Project = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: "Product" | "Platform" | "Research";
  tags: string[];
  year: string;
  client: string;
  role: string;
  problem: string;
  solution: string;
  tools: string[];
  results: string[];
  // TODO(customize): replace with real screenshots/renders in /public/images/projects
  coverImage: string;
  gallery: string[];
};

// TODO(customize): Replace with OUAQT's real project case studies.
// Each `coverImage` / `gallery` path should point to an image dropped into
// /public/images/projects/<slug>/ — using gradient placeholders until then.
export const projects: Project[] = [
  {
    slug: "meridian",
    title: "Meridian",
    summary: "A real-time operations console for distributed logistics teams.",
    description:
      "Meridian replaced a patchwork of spreadsheets and status calls with a single live view of fleet, inventory, and delivery risk — built for dispatchers who need answers in seconds, not minutes.",
    category: "Product",
    tags: ["Dashboard", "Real-time", "B2B"],
    year: "2025",
    client: "Confidential logistics network",
    role: "Product design, frontend architecture, systems integration",
    problem:
      "Dispatch teams were reconciling data across four disconnected tools, losing 20+ minutes per shift to manual status checks and missing early signals on delivery delays.",
    solution:
      "We designed a unified console that streams fleet telemetry, inventory levels, and route risk into one interface, with alerting tuned to what dispatchers actually act on.",
    tools: ["Next.js", "TypeScript", "WebSockets", "PostgreSQL", "Mapbox"],
    results: [
      "42% reduction in average dispatcher response time",
      "Rolled out to 6 regional hubs within one quarter",
      "Cut manual status-check calls by roughly two-thirds",
    ],
    coverImage: "/images/projects/meridian/cover.jpg",
    gallery: [
      "/images/projects/meridian/gallery-1.jpg",
      "/images/projects/meridian/gallery-2.jpg",
    ],
  },
  {
    slug: "northlight",
    title: "Northlight",
    summary: "A design-to-code pipeline that keeps engineering and design in sync.",
    description:
      "Northlight bridges the gap between design files and production code, generating type-safe components directly from a design system so nothing drifts out of sync.",
    category: "Platform",
    tags: ["Developer Tools", "Design Systems"],
    year: "2024",
    client: "Internal product",
    role: "Founding engineering, product strategy",
    problem:
      "Growing product teams kept shipping UI that quietly diverged from the design system, creating rework and inconsistent experiences across surfaces.",
    solution:
      "We built a pipeline that reads design tokens and component specs directly from the design tool and emits typed, tested React components — with drift detection in CI.",
    tools: ["TypeScript", "React", "Figma API", "Turborepo"],
    results: [
      "Adopted across 3 product teams in the first month",
      "Design-to-code review time cut from days to hours",
      "Zero token drift incidents since rollout",
    ],
    coverImage: "/images/projects/northlight/cover.jpg",
    gallery: [
      "/images/projects/northlight/gallery-1.jpg",
      "/images/projects/northlight/gallery-2.jpg",
    ],
  },
  {
    slug: "atlas-index",
    title: "Atlas Index",
    summary: "An exploratory research tool for mapping emerging market signals.",
    description:
      "Atlas Index is an internal research initiative exploring how weak, noisy signals across public data sources can be combined into an early-warning index for market shifts.",
    category: "Research",
    tags: ["Data", "Research", "Prototype"],
    year: "2024",
    client: "R&D initiative",
    role: "Research, data pipeline, prototype interface",
    problem:
      "Existing market-signal tools were either too slow (quarterly reports) or too noisy (raw social sentiment) to be actionable for early decision-making.",
    solution:
      "We prototyped a scoring model that blends structured and unstructured public data, then built a lightweight interface for analysts to interrogate and validate the signal.",
    tools: ["Python", "Next.js", "PostgreSQL", "D3.js"],
    results: [
      "Prototype validated against 18 months of historical data",
      "Informed two internal go/no-go decisions",
      "Now being scoped as a standalone product",
    ],
    coverImage: "/images/projects/atlas-index/cover.jpg",
    gallery: [
      "/images/projects/atlas-index/gallery-1.jpg",
      "/images/projects/atlas-index/gallery-2.jpg",
    ],
  },
];

export function getProjectBySlug(slug: string) {
  return projects.find((project) => project.slug === slug);
}

export function getAllCategories() {
  return Array.from(new Set(projects.map((project) => project.category)));
}
