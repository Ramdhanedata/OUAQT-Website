import { Card } from "@/components/ui/card";
import { Project } from "@/lib/data/projects";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

// Renders an abstract gradient thumbnail in place of a real screenshot.
// TODO(customize): once real project imagery exists, replace the gradient
// div below with a Next.js <Image src={project.coverImage} /> and delete
// the `hue` placeholder logic.
const hues: Record<string, string> = {
  Product: "from-accent/40 via-accent/10 to-transparent",
  Platform: "from-foreground/30 via-foreground/5 to-transparent",
  Research: "from-accent/25 via-foreground/10 to-transparent",
};

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.slug}`} className="group block">
      <Card className="overflow-hidden">
        <div
          className={`bg-noise relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br ${hues[project.category]} bg-muted`}
        >
          <span className="text-4xl font-semibold tracking-tight text-foreground/20">
            {project.title.slice(0, 2).toUpperCase()}
          </span>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-accent">
                {project.category}
              </p>
              <h3 className="mt-2 text-lg font-medium tracking-tight text-foreground">
                {project.title}
              </h3>
            </div>
            <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {project.summary}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {project.tags.map((tag) => (
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
