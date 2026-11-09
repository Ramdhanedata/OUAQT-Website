import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { FadeIn } from "@/components/motion/fade-in";
import { Plus } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";

type FaqItem = { q: string; a: string };

/*
 * Native <details> rather than JS state: it stays open without hydration,
 * works with keyboard and screen readers for free, and the answers are in the
 * HTML for search engines even while collapsed.
 */
export function Faq({
  eyebrow,
  heading,
  items,
}: {
  eyebrow: string;
  heading: string;
  items: readonly FaqItem[];
}) {

  return (
    <Section className="border-t border-border">
      {/* The same questions and answers as below, word for word (builder-faq.tsx says why). */}
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
        <FadeIn className="max-w-2xl">
          <p className="eyebrow">
            {eyebrow}
          </p>
          <h2 className="mt-6 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {heading}
          </h2>
        </FadeIn>

        <div className="mt-12 border-t border-border">
          {items.map((item, index) => (
            <FadeIn key={item.q} delay={Math.min(index, 4) * 0.05}>
              <details className="group border-b border-border">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-start marker:hidden [&::-webkit-details-marker]:hidden">
                  <span className="text-balance text-base font-medium tracking-tight text-foreground sm:text-lg">
                    {item.q}
                  </span>
                  <Plus
                    className="mt-1 h-5 w-5 shrink-0 text-accent transition-transform duration-200 group-open:rotate-45"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </summary>
                <p className="max-w-2xl pb-6 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {item.a}
                </p>
              </details>
            </FadeIn>
          ))}
        </div>
      </Container>
    </Section>
  );
}
