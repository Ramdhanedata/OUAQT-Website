import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { FadeIn } from "@/components/motion/fade-in";
import { ProjectsGrid } from "@/components/projects/projects-grid";
import { getAllCategories, projects } from "@/lib/data/projects";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects — OUAQT",
  description: "Selected work from the OUAQT studio.",
};

export default function ProjectsPage() {
  const categories = getAllCategories();

  return (
    <Section className="pt-32 sm:pt-40">
      <Container>
        <FadeIn>
          <p className="text-sm font-medium tracking-tight text-accent">
            Projects
          </p>
          <h1 className="mt-4 max-w-2xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Products we&rsquo;ve designed, built, and shipped.
          </h1>
          <p className="mt-6 max-w-xl text-muted-foreground">
            {/* TODO(customize): update with real project count / focus areas */}
            A running record of the work we take on — from production
            platforms to early-stage research.
          </p>
        </FadeIn>

        <div className="mt-16">
          <ProjectsGrid projects={projects} categories={categories} />
        </div>
      </Container>
    </Section>
  );
}
