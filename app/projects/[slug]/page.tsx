import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import { getProjectBySlug, projects } from "@/lib/data/projects";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

type Props = {
  params: { slug: string };
};

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const project = getProjectBySlug(params.slug);
  if (!project) return {};
  return {
    title: `${project.title} — OUAQT`,
    description: project.summary,
  };
}

export default function ProjectDetailPage({ params }: Props) {
  const project = getProjectBySlug(params.slug);

  if (!project) {
    notFound();
  }

  return (
    <>
      {/* Hero. Renders the real cover screenshot when one is set in
          lib/data/projects.ts, otherwise an accent gradient. */}
      <div className="relative flex h-[50vh] min-h-[360px] items-end overflow-hidden bg-muted">
        {project.coverImage ? (
          <>
            <Image
              src={project.coverImage}
              alt={`${project.title} — cover`}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            {/* Scrim keeps the headline readable over any screenshot */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
          </>
        ) : (
          <div className="bg-noise absolute inset-0 bg-gradient-to-br from-accent/25 via-muted to-background" />
        )}

        <Container className="relative pb-12">
          <FadeIn>
            <p className="text-sm font-medium tracking-tight text-accent">
              {project.category} · {project.year}
            </p>
            <h1 className="mt-4 max-w-3xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
              {project.title}
            </h1>
          </FadeIn>
        </Container>
      </div>

      <Section>
        <Container>
          <FadeIn>
            <Button href="/projects" variant="ghost">
              <ArrowLeft className="h-4 w-4" />
              All projects
            </Button>
          </FadeIn>

          <div className="mt-10 grid grid-cols-1 gap-16 lg:grid-cols-3">
            <FadeIn className="lg:col-span-2">
              <h2 className="text-xl font-medium tracking-tight text-foreground">
                Overview
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {project.description}
              </p>

              <h2 className="mt-12 text-xl font-medium tracking-tight text-foreground">
                The problem
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {project.problem}
              </p>

              <h2 className="mt-12 text-xl font-medium tracking-tight text-foreground">
                The solution
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {project.solution}
              </p>

              <h2 className="mt-12 text-xl font-medium tracking-tight text-foreground">
                Results
              </h2>
              <ul className="mt-4 space-y-3">
                {project.results.map((result) => (
                  <li
                    key={result}
                    className="flex items-start gap-3 leading-relaxed text-muted-foreground"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {result}
                  </li>
                ))}
              </ul>

              {/* Gallery. Only rendered once real screenshots are added to
                  `gallery` in lib/data/projects.ts — an empty gallery shows
                  nothing rather than empty grey boxes.
                  TODO(adel): drop files into
                  /public/images/projects/<slug>/ and list them there. */}
              {project.gallery && project.gallery.length > 0 && (
                <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {project.gallery.map((src) => (
                    <div
                      key={src}
                      className="relative aspect-video overflow-hidden rounded-2xl bg-muted"
                    >
                      <Image
                        src={src}
                        alt={`${project.title} — screenshot`}
                        fill
                        sizes="(max-width: 640px) 100vw, 50vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="space-y-8 rounded-2xl border border-border p-6">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                    Client
                  </p>
                  <p className="mt-2 text-sm text-foreground">{project.client}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                    Role
                  </p>
                  <p className="mt-2 text-sm text-foreground">{project.role}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                    Tools
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {project.tools.map((tool) => (
                      <span
                        key={tool}
                        className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </Container>
      </Section>
    </>
  );
}
