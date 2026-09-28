import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { FadeIn } from "@/components/motion/fade-in";
import { ProjectsGrid } from "@/components/projects/projects-grid";
import { getAllCategories, projects } from "@/lib/data/projects";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { alternatesFor } from "@/lib/i18n/metadata";
import type { Metadata } from "next";

type Props = { params: Promise<{ lang: Locale }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const dict = getDictionary(params.lang);
  return {
    title: dict.meta.projectsTitle,
    description: dict.meta.projectsDescription,
    alternates: alternatesFor(params.lang, "/projects"),
  };
}

export default async function ProjectsPage(props: Props) {
  const params = await props.params;
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
            dict={{ projectsPage: dict.projectsPage, projects: dict.projects, projectDetail: dict.projectDetail, sectors: dict.sectors }}
            lang={params.lang}
          />
        </div>
      </Container>
    </Section>
  );
}
