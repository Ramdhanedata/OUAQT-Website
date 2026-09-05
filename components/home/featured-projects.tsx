import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import { ProjectCard } from "@/components/projects/project-card";
import { projects } from "@/lib/data/projects";
import type { Dictionary } from "@/lib/i18n";
import { localeHref, type Locale } from "@/lib/i18n/config";
import { ArrowRight } from "lucide-react";

export function FeaturedProjects({
  dict,
  lang,
}: {
  dict: Dictionary;
  lang: Locale;
}) {
  const featured = projects.slice(0, 3);

  return (
    <Section className="bg-muted/40">
      <Container>
        <FadeIn className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <h2 className="max-w-lg text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {dict.featured.heading}
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground">
              {dict.featured.body}
            </p>
          </div>
          <Button href={localeHref(lang, "/projects")} variant="ghost">
            {dict.featured.cta}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Button>
        </FadeIn>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {featured.map((project, index) => (
            <FadeIn key={project.slug} delay={index * 0.1}>
              <ProjectCard project={project} dict={dict} lang={lang} />
            </FadeIn>
          ))}
        </div>
      </Container>
    </Section>
  );
}
