import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import { founder } from "@/lib/data/founder";
import { LinkedInIcon } from "@/components/ui/social-icons";
import { getDictionary } from "@/lib/i18n";
import { localeHref, type Locale } from "@/lib/i18n/config";
import { ArrowRight, Mail, MapPin } from "lucide-react";
import Image from "next/image";
import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";

/*
 * Looks for the founder photo on disk at build time. Saving the file into
 * public/images/ is enough to make it appear, with no code change. Falls back
 * to an initials monogram when nothing is there, so the page never shows a
 * broken image.
 */
function findFounderPhoto(): string | undefined {
  const dir = path.join(process.cwd(), "public", "images");
  for (const name of [
    "founder.jpg",
    "founder.jpeg",
    "founder.png",
    "founder.webp",
  ]) {
    if (fs.existsSync(path.join(dir, name))) return `/images/${name}`;
  }
  return undefined;
}

type Props = { params: { lang: Locale } };

export function generateMetadata({ params }: Props): Metadata {
  const dict = getDictionary(params.lang);
  return {
    title: dict.meta.aboutTitle,
    description: dict.meta.aboutDescription,
  };
}

export default function AboutPage({ params }: Props) {
  const dict = getDictionary(params.lang);
  const photo = findFounderPhoto();
  const initials = founder.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  const marketStats = [
    { value: "~30%", label: dict.about.stat1 },
    { value: "56%", label: dict.about.stat2 },
    { value: "2025", label: dict.about.stat3 },
  ];

  const credentials = [
    dict.about.credentials.analytics,
    dict.about.credentials.snim,
    dict.about.credentials.undp,
    dict.about.credentials.sectors,
  ];

  return (
    <>
      <Section className="pt-32 sm:pt-40">
        <Container>
          <FadeIn className="max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
              {dict.about.eyebrow}
            </p>
            <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {dict.about.heading}
            </h1>
            <p className="mt-8 text-lg leading-relaxed text-muted-foreground">
              {dict.about.body1}
            </p>
            <p className="mt-6 leading-relaxed text-muted-foreground">
              {dict.about.body2}
            </p>
          </FadeIn>
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <FadeIn>
            <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {dict.about.marketHeading}
            </h2>
          </FadeIn>
          <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-3">
            {marketStats.map((stat, index) => (
              <FadeIn key={stat.label} delay={index * 0.1}>
                <p className="text-4xl font-semibold tracking-tight text-accent sm:text-5xl">
                  {stat.value}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {stat.label}
                </p>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.3}>
            <p className="mt-12 max-w-2xl leading-relaxed text-muted-foreground">
              {dict.about.marketNote}
            </p>
          </FadeIn>
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-16">
            <FadeIn>
              {photo ? (
                <Image
                  src={photo}
                  alt={founder.name}
                  width={598}
                  height={1137}
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  /* 4:5 rather than a square: the source is a tall portrait,
                     and a square crop clipped the top of the head. */
                  className="aspect-[4/5] w-full rounded-2xl object-cover object-top"
                />
              ) : (
                <div className="bg-noise flex aspect-[4/5] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-accent/25 via-muted to-background">
                  <span className="text-4xl font-semibold tracking-tight text-foreground/25">
                    {initials}
                  </span>
                </div>
              )}
            </FadeIn>

            <FadeIn delay={0.1} className="lg:col-span-2">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
                {dict.about.founderEyebrow}
              </p>
              <h2 className="mt-6 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {founder.name}
              </h2>
              <p className="mt-2 text-accent">{dict.about.founderRole}</p>

              <p className="mt-6 leading-relaxed text-muted-foreground">
                {dict.about.founderBio1}
              </p>
              <p className="mt-6 leading-relaxed text-muted-foreground">
                {dict.about.founderBio2}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-8">
                <a
                  href={founder.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 text-sm text-foreground transition-colors hover:text-accent"
                >
                  <LinkedInIcon className="h-4 w-4 text-accent" />
                  LinkedIn
                </a>
                <a
                  href={`mailto:${founder.email}`}
                  className="flex items-center gap-3 text-sm text-foreground transition-colors hover:text-accent"
                >
                  <Mail className="h-4 w-4 text-accent" />
                  {founder.email}
                </a>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-accent" />
                  {founder.location}
                </div>
              </div>
            </FadeIn>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-10 sm:grid-cols-2">
            {credentials.map((item, index) => (
              <FadeIn key={item.title} delay={(index % 2) * 0.08}>
                <p className="text-4xl font-semibold tracking-tight text-accent/25">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-4 text-balance text-lg font-medium leading-snug tracking-tight text-foreground">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {item.detail}
                </p>
              </FadeIn>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <FadeIn className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {dict.about.ctaHeading}
            </h2>
            <p className="mt-6 leading-relaxed text-muted-foreground">
              {dict.about.ctaBody}
            </p>
            <div className="mt-8 flex justify-center">
              <Button href={localeHref(params.lang, "/contact")} variant="accent">
                {dict.about.ctaButton}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </div>
          </FadeIn>
        </Container>
      </Section>
    </>
  );
}
