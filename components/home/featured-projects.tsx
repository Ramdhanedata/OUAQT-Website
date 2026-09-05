import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import { ProjectCard } from "@/components/projects/project-card";
import { projects } from "@/lib/data/projects";
import { ArrowRight } from "lucide-react";

export function FeaturedProjects() {
  const featured = projects.slice(0, 3);

  return (
    <Section className="bg-muted/40">
      <Container>
        <FadeIn className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <h2 className="max-w-lg text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Systems in production
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground">
              Five live products, each built for one business and the way it
              actually runs.
            </p>
          </div>
          <Button href="/projects" variant="ghost">
            View all systems
            <ArrowRight className="h-4 w-4" />
          </Button>
        </FadeIn>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {featured.map((project, index) => (
            <FadeIn key={project.slug} delay={index * 0.1}>
              <ProjectCard project={project} />
            </FadeIn>
          ))}
        </div>
      </Container>
    </Section>
  );
}
