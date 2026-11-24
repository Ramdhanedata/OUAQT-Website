import { pageMetadata } from "@/lib/seo/page-metadata";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import { founder } from "@/lib/data/founder";
import { LinkedInIcon } from "@/components/ui/social-icons";
import { getDictionary } from "@/lib/i18n";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbData } from "@/lib/seo/breadcrumbs";
import { localeHref, type Locale } from "@/lib/i18n/config";
import { localisedHref } from "@/lib/i18n/routes";
import { ArrowRight, Mail, MapPin } from "lucide-react";
import { alternatesFor, siteUrl } from "@/lib/i18n/metadata";
import type { Metadata } from "next";

type Props = { params: Promise<{ lang: Locale }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const dict = getDictionary(params.lang);
  return pageMetadata(params.lang, dict, {
    title: dict.meta.aboutTitle,
    description: dict.meta.aboutDescription,
    alternates: alternatesFor(params.lang, "/about"),
  });
}

const h2 = "text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl";

export default async function AboutPage(props: Props) {
  const params = await props.params;
  const lang = params.lang;
  const dict = getDictionary(lang);
  const about = dict.about;
  const base = siteUrl();
  const pageUrl = `${base}${localeHref(lang, "/about")}`;

  const offer = [about.offer.builder, about.offer.custom, about.offer.offline, about.offer.support];
  const values = [about.values.owner, about.values.data, about.values.simple, about.values.honest, about.values.local];
  const why = [about.why.proven, about.why.offline, about.why.languages, about.why.nearby, about.why.price];
  const credentials = [
    about.credentials.analytics,
    about.credentials.snim,
    about.credentials.undp,
    about.credentials.mckinsey,
  ];
  const marketStats = [
    { value: "~30%", label: about.stat1 },
    { value: "56%", label: about.stat2 },
    { value: "2025", label: about.stat3 },
  ];

  /*
   * The page for search engines: an AboutPage about the Organization the
   * layout already declares (same @id), and the founder as a Person with the
   * contact details shown on the page.
   */
  const aboutData = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${pageUrl}#page`,
    url: pageUrl,
    name: dict.meta.aboutTitle,
    description: dict.meta.aboutDescription,
    inLanguage: lang,
    isPartOf: { "@id": `${base}/#website` },
    about: { "@id": `${base}/#business` },
    mainEntity: { "@id": `${base}/#business` },
  };
  const founderData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${base}/#founder`,
    name: founder.name,
    jobTitle: about.founderRole,
    description: about.founderBio1,
    email: `mailto:${founder.email}`,
    url: pageUrl,
    sameAs: [founder.linkedin],
    worksFor: { "@id": `${base}/#business` },
    homeLocation: { "@type": "Place", name: founder.location },
    knowsLanguage: ["ar", "fr", "en"],
    award: about.credentials.undp.title,
  };

  return (
    <>
      <JsonLd data={breadcrumbData(lang, dict, [{ name: dict.nav.about, path: localeHref(lang, "/about") }])} />
      <JsonLd data={aboutData} />
      <JsonLd data={founderData} />

      {/* Who we are. */}
      <Section className="pt-32 sm:pt-40">
        <Container>
          <FadeIn className="max-w-3xl">
            <p className="eyebrow">{about.eyebrow}</p>
            <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {about.heading}
            </h1>
            <p className="mt-8 text-lg leading-relaxed text-muted-foreground">{about.intro1}</p>
            <p className="mt-6 leading-relaxed text-muted-foreground">{about.intro2}</p>
          </FadeIn>
        </Container>
      </Section>

      {/* What we provide. */}
      <Section className="border-t border-border">
        <Container>
          <FadeIn>
            <h2 className={`max-w-2xl ${h2}`}>{about.offerHeading}</h2>
          </FadeIn>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {offer.map((item, index) => (
              <FadeIn key={item.title} delay={(index % 2) * 0.08}>
                <div className="h-full rounded-2xl border border-border p-6 sm:p-8">
                  <h3 className="text-lg font-medium tracking-tight text-foreground">{item.title}</h3>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{item.detail}</p>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.2}>
            <div className="mt-10">
              <Button href={localisedHref(lang, "builder")} variant="accent">
                {dict.builderHome.heroPrimary}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </div>
          </FadeIn>
        </Container>
      </Section>

      {/* Mission, and the numbers that explain it. */}
      <Section className="border-t border-border">
        <Container>
          <FadeIn className="max-w-3xl">
            <p className="eyebrow">{about.missionEyebrow}</p>
            <h2 className={`mt-6 ${h2}`}>{about.missionHeading}</h2>
            <p className="mt-8 text-lg leading-relaxed text-muted-foreground">{about.missionBody1}</p>
            <p className="mt-6 leading-relaxed text-muted-foreground">{about.missionBody2}</p>
          </FadeIn>
          <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-3">
            {marketStats.map((stat, index) => (
              <FadeIn key={stat.label} delay={index * 0.1}>
                <p className="text-4xl font-semibold tracking-tight text-accent sm:text-5xl">{stat.value}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{stat.label}</p>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.3}>
            <p className="mt-12 max-w-2xl leading-relaxed text-muted-foreground">{about.marketNote}</p>
            <p className="mt-6 max-w-2xl border-s-2 border-accent ps-4 text-sm leading-relaxed text-foreground">
              {about.hultNote}
            </p>
          </FadeIn>
        </Container>
      </Section>

      {/* Values. */}
      <Section className="border-t border-border">
        <Container>
          <FadeIn>
            <h2 className={`max-w-2xl ${h2}`}>{about.valuesHeading}</h2>
          </FadeIn>
          <div className="mt-12 grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((item, index) => (
              <FadeIn key={item.title} delay={(index % 3) * 0.08}>
                <p className="text-sm font-semibold text-accent">{String(index + 1).padStart(2, "0")}</p>
                <h3 className="mt-3 text-balance text-lg font-medium leading-snug tracking-tight text-foreground">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
              </FadeIn>
            ))}
          </div>
        </Container>
      </Section>

      {/* Young people and entrepreneurs. */}
      <Section className="border-t border-border">
        <Container>
          <FadeIn className="max-w-3xl">
            <h2 className={h2}>{about.youthHeading}</h2>
            <p className="mt-8 leading-relaxed text-muted-foreground">{about.youthBody1}</p>
            <p className="mt-6 leading-relaxed text-muted-foreground">{about.youthBody2}</p>
          </FadeIn>
        </Container>
      </Section>

      {/* Why choose OUAQT. */}
      <Section className="border-t border-border">
        <Container>
          <FadeIn>
            <h2 className={`max-w-2xl ${h2}`}>{about.whyHeading}</h2>
          </FadeIn>
          <ul className="mt-12 divide-y divide-border border-y border-border">
            {why.map((item) => (
              <li key={item.title} className="grid grid-cols-1 gap-2 py-6 sm:grid-cols-3 sm:gap-10">
                <h3 className="text-lg font-medium tracking-tight text-foreground">{item.title}</h3>
                <p className="leading-relaxed text-muted-foreground sm:col-span-2">{item.detail}</p>
              </li>
            ))}
          </ul>
          <FadeIn className="mt-16 max-w-2xl">
            <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {about.ctaHeading}
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">{about.ctaBody}</p>
            <div className="mt-8">
              <Button href={localeHref(lang, "/contact")} variant="accent">
                {about.ctaButton}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </div>
          </FadeIn>
        </Container>
      </Section>

      {/* The founder, last on the page, with no photo. */}
      <Section className="border-t border-border" id="founder">
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-16">
            <FadeIn>
              <p className="eyebrow">{about.founderEyebrow}</p>
              <h2 className="mt-6 text-balance text-3xl font-semibold tracking-tight text-foreground">
                {dict.common.founderName}
              </h2>
              <p className="mt-2 text-accent">{about.founderRole}</p>

              <p className="mt-8 text-sm font-medium text-foreground">{about.founderContact}</p>
              <ul className="mt-4 flex flex-col gap-3">
                <li>
                  <a
                    href={`mailto:${founder.email}`}
                    className="flex items-center gap-3 text-sm text-foreground transition-colors hover:text-accent"
                  >
                    <Mail className="h-4 w-4 text-accent" />
                    <span dir="ltr">{founder.email}</span>
                  </a>
                </li>
                <li>
                  <a
                    href={founder.linkedin}
                    target="_blank"
                    rel="noopener noreferrer me"
                    className="flex items-center gap-3 text-sm text-foreground transition-colors hover:text-accent"
                  >
                    <LinkedInIcon className="h-4 w-4 text-accent" />
                    {dict.common.linkedin}
                  </a>
                </li>
                <li className="flex items-center gap-3 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-accent" />
                  {dict.common.location}
                </li>
              </ul>
            </FadeIn>

            <FadeIn delay={0.1} className="lg:col-span-2">
              <p className="leading-relaxed text-muted-foreground">{about.founderBio1}</p>
              <p className="mt-6 leading-relaxed text-muted-foreground">{about.founderBio2}</p>
              <blockquote className="mt-8 border-s-2 border-accent ps-6 text-lg leading-relaxed text-foreground">
                {about.founderQuote}
              </blockquote>
            </FadeIn>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-10 sm:grid-cols-2">
            {credentials.map((item, index) => (
              <FadeIn key={item.title} delay={(index % 2) * 0.08}>
                <h3 className="text-balance text-base font-medium leading-snug tracking-tight text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
              </FadeIn>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
