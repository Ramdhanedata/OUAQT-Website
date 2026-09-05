import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { FadeIn } from "@/components/motion/fade-in";
import { ProjectsGrid } from "@/components/projects/projects-grid";
import { getAllCategories, projects } from "@/lib/data/projects";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Systems | OUAQT",
  description:
    "Five live systems built for mining, pharmacy, hospitality, transport, and food service clients.",
};

export default function ProjectsPage() {
  const categories = getAllCategories();

  return (
    <Section className="pt-32 sm:pt-40">
      <Container>
        <FadeIn>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
            Systems
          </p>
          <h1 className="mt-6 max-w-3xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Five live systems, each built for one business.
          </h1>
          <p className="mt-6 max-w-2xl leading-relaxed text-muted-foreground">
            Mining, pharmacy, hospitality, transport, and food service. The
            approach is the same every time. We start from how the business
            already works, bring their existing records across, and hand over
            something the team will actually use.
          </p>
        </FadeIn>

        <div className="mt-16">
          <ProjectsGrid projects={projects} categories={categories} />
        </div>
      </Container>
    </Section>
  );
}
