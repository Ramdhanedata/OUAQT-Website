import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { FadeIn } from "@/components/motion/fade-in";

type LegalSection = {
  h: string;
  b: string;
  items?: readonly string[];
};

/*
 * Shared shell for the licence and privacy pages. Both are plain prose, so the
 * layout is deliberately narrow: a single measure of text with no cards, no
 * grid and nothing that competes with reading. Sections arrive as an ordered
 * array from the caller, which keeps the dictionary flat and the page dumb.
 */
export function LegalPage({
  title,
  intro,
  updatedLabel,
  updatedDate,
  sections,
}: {
  title: string;
  intro: string;
  updatedLabel: string;
  updatedDate: string;
  sections: readonly LegalSection[];
}) {
  return (
    <Section>
      <Container className="max-w-2xl">
        <FadeIn>
          <p className="text-sm text-muted-foreground">
            {updatedLabel} {updatedDate}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {intro}
          </p>
        </FadeIn>

        <div className="mt-14 space-y-10 border-t border-border pt-10">
          {sections.map((section) => (
            <FadeIn key={section.h}>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                {section.h}
              </h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {section.b}
              </p>
              {section.items ? (
                <ul className="mt-4 space-y-2">
                  {section.items.map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 leading-relaxed text-muted-foreground"
                    >
                      <span
                        aria-hidden
                        className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </FadeIn>
          ))}
        </div>
      </Container>
    </Section>
  );
}
