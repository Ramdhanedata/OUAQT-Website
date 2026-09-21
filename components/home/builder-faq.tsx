import { JsonLd } from "@/components/seo/json-ld";
import { Container } from "@/components/ui/container";
import type { Dictionary } from "@/lib/i18n";

/*
 * The four questions owners actually ask, and the structured data that goes
 * with them.
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
  ];

  return (
    <section className="border-t border-border py-20 sm:py-28">
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

      <Container>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {home.faqHeading}
        </h2>

        <dl className="mt-12 max-w-3xl divide-y divide-border">
          {items.map((item) => (
            <div key={item.q} className="py-6">
              <dt className="text-xl font-medium text-foreground">{item.q}</dt>
              <dd className="mt-3 text-base leading-relaxed text-muted-foreground">
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
