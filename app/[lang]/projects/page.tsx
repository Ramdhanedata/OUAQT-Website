import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { FadeIn } from "@/components/motion/fade-in";
import { ProjectsGrid } from "@/components/projects/projects-grid";
import { getAllCategories, projects } from "@/lib/data/projects";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import type { Metadata } from "next";

type Props = { params: { lang: Locale } };

export function generateMetadata({ params }: Props): Metadata {
  const dict = getDictionary(params.lang);
  return {
    title: dict.meta.projectsTitle,
    description: dict.meta.projectsDescription,
  };
}

export default function ProjectsPage({ params }: Props) {
  const dict = getDictionary(params.lang);
  const categories = getAllCategories();

  return (
    <Section className="pt-32 sm:pt-40">
      <Container>
        <FadeIn>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
            {dict.projectsPage.eyebrow}
          </p>
          <h1 className="mt-6 max-w-3xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {dict.projectsPage.heading}
          </h1>
          <p className="mt-6 max-w-2xl leading-relaxed text-muted-foreground">
            {dict.projectsPage.body}
          </p>
        </FadeIn>

        <div className="mt-16">
          <ProjectsGrid
            projects={projects}
            categories={categories}
            dict={dict}
            lang={params.lang}
          />
        </div>
      </Container>
    </Section>
  );
}
