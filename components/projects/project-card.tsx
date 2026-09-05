import { Card } from "@/components/ui/card";
import { Project } from "@/lib/data/projects";
import type { Dictionary } from "@/lib/i18n";
import { localeHref, type Locale } from "@/lib/i18n/config";
import { ArrowUpRight, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// One accent hue at varying intensity keeps the five sectors reading as a
// family rather than five unrelated treatments.
const hues: Record<Project["category"], string> = {
  Mining: "from-accent/40 via-accent/10 to-transparent",
  Pharmacy: "from-accent/30 via-accent/8 to-transparent",
  Hospitality: "from-accent/25 via-accent/5 to-transparent",
  Transport: "from-accent/20 via-accent/5 to-transparent",
  Restaurant: "from-accent/15 via-accent/5 to-transparent",
};

export function ProjectCard({
  project,
  dict,
  lang,
}: {
  project: Project;
  dict: Dictionary;
  lang: Locale;
}) {
  const copy = dict.projects[project.slug];

  return (
    <Link
      href={localeHref(lang, `/projects/${project.slug}`)}
      className="group block h-full"
    >
      <Card className="flex h-full flex-col overflow-hidden">
        {/* 16:10 matches the native ratio of the product screenshots, so
            object-cover crops almost nothing. */}
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {project.coverImage ? (
            <Image
              src={project.coverImage}
              alt={`${copy.title} ${dict.projectDetail.screenshotAlt}`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            /* Placeholder until a real screenshot exists. Deliberately has no
               text, since the sector is already labelled below the image. */
            <div
              className={`bg-noise flex h-full w-full items-center justify-center bg-gradient-to-br ${hues[project.category]}`}
            >
              <ImageIcon
                className="h-7 w-7 text-foreground/15"
                strokeWidth={1.25}
                aria-hidden
              />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-accent">
                {dict.sectors[project.category]}
              </p>
              <h3 className="mt-2 text-balance text-lg font-medium leading-snug tracking-tight text-foreground">
                {copy.title}
              </h3>
            </div>
            <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent rtl:-scale-x-100" />
          </div>

          <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
            {copy.summary}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {copy.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Card>
    </Link>
  );
}
