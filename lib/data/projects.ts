export type Sector =
  | "Mining"
  | "Pharmacy"
  | "Hospitality"
  | "Transport"
  | "Restaurant";

export type ProjectSlug =
  | "gmm-mining"
  | "pharmacy-pos"
  | "hotel-operations"
  | "transport-manifests"
  | "restaurant-pos";

/*
 * Structural data only. Everything readable (title, summary, problem,
 * solution, results, tools, tags) lives in lib/i18n/dictionaries/*.ts under
 * `projects`, keyed by this slug, so each language carries its own copy.
 *
 * On metrics: only the GMM numbers (4 hrs -> 25 min, 90%) are client
 * confirmed. The other four carry qualitative results on purpose.
 * TODO(adel): add real measured numbers to the `results` arrays in the
 * dictionaries as you confirm them. Do not publish estimates as facts.
 */
export type Project = {
  slug: ProjectSlug;
  /** The client's industry, which doubles as the filter on /projects. */
  category: Sector;
  year: string;
  /**
   * Real screenshots. Drop files into /public/images/projects/<slug>/ and set
   * the path here. Undefined renders a neutral placeholder instead, so there
   * are never broken images or fake stock photos.
   */
  coverImage?: string;
  gallery?: string[];
};

export const projects: Project[] = [
  {
    slug: "gmm-mining",
    category: "Mining",
    year: "2025",
    // TODO(adel): install the GMM screenshot with
    //   ./scripts/use-project-cover.sh gmm-mining <path-to-image>
    // then uncomment the line below.
    // coverImage: "/images/projects/gmm-mining/cover.png",
  },
  {
    slug: "pharmacy-pos",
    category: "Pharmacy",
    year: "2025",
    coverImage: "/images/projects/pharmacy-pos/cover.png",
  },
  {
    slug: "hotel-operations",
    category: "Hospitality",
    year: "2025",
    coverImage: "/images/projects/hotel-operations/cover.png",
  },
  {
    slug: "transport-manifests",
    category: "Transport",
    year: "2025",
    coverImage: "/images/projects/transport-manifests/cover.png",
  },
  {
    slug: "restaurant-pos",
    category: "Restaurant",
    year: "2025",
    coverImage: "/images/projects/restaurant-pos/cover.png",
  },
];

export function getProjectBySlug(slug: string) {
  return projects.find((project) => project.slug === slug);
}

export function getAllCategories(): Sector[] {
  return Array.from(new Set(projects.map((project) => project.category)));
}
