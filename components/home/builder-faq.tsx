import { JsonLd } from "@/components/seo/json-ld";
import { Container } from "@/components/ui/container";
import type { Dictionary } from "@/lib/i18n";

/*
 * The questions owners actually ask, and the structured data that goes with
 * them.
 *
 * The markup and the page say exactly the same thing, which is both the rule
 * and the only honest way to do it: a FAQ block describing answers a visitor
 * cannot see on the page is a trick played on a search engine.
 */
export function BuilderFaq({ dict }: { dict: Dictionary }) {
  const home = dict.builderHome;
  const items = [
    { q: home.faq1, a: home.faq1Body },
    { q: home.faq2, a: home.faq2Body },
    { q: home.faq3, a: home.faq3Body },
    { q: home.faq4, a: home.faq4Body },
    { q: home.faq5, a: home.faq5Body },
    { q: home.faq6, a: home.faq6Body },
  ];

  return (
    <section className="py-20 sm:py-28">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }}
      />

      <Container className="grid gap-10 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-16">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">{home.faqEyebrow}</p>
          <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {home.faqHeading}
          </h2>
        </div>

        <dl className="divide-y divide-border border-y border-border">
          {items.map((item) => (
            <div key={item.q} className="py-6">
              <dt className="text-lg font-medium text-foreground">{item.q}</dt>
              <dd className="mt-2 text-base leading-relaxed text-muted-foreground">{item.a}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
