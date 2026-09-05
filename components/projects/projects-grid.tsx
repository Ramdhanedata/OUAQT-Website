"use client";

import { ProjectCard } from "@/components/projects/project-card";
import { FadeIn } from "@/components/motion/fade-in";
import { cn } from "@/lib/utils";
import { Project, Sector } from "@/lib/data/projects";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { useMemo, useState } from "react";

export function ProjectsGrid({
  projects,
  categories,
  dict,
  lang,
}: {
  projects: Project[];
  categories: Sector[];
  dict: Dictionary;
  lang: Locale;
}) {
  const [active, setActive] = useState<Sector | "All">("All");

  const filtered = useMemo(
    () =>
      active === "All"
        ? projects
        : projects.filter((project) => project.category === active),
    [active, projects]
  );

  const filters: (Sector | "All")[] = ["All", ...categories];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {filters.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActive(category)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium tracking-tight transition-colors",
              active === category
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
            )}
          >
            {category === "All"
              ? dict.projectsPage.all
              : dict.sectors[category]}
          </button>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((project, index) => (
          <FadeIn key={project.slug} delay={(index % 3) * 0.08}>
            <ProjectCard project={project} dict={dict} lang={lang} />
          </FadeIn>
        ))}
      </div>
    </div>
  );
}
