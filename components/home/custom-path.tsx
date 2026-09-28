import { FadeIn } from "@/components/motion/fade-in";
import { Container } from "@/components/ui/container";
import type { Dictionary } from "@/lib/i18n";
import { localeHref, type Locale } from "@/lib/i18n/config";
import { ArrowRight } from "lucide-react";

/*
 * The second offer: software built to order, for the businesses no trade
 * in the Builder fits. It is where OUAQT started and where the Builder's
 * knowledge comes from, so it keeps its proof: the GMM result, the only
 * figure a client has signed off on. Keep it that way: no number here that
 * a client has not confirmed.
 *
 * In the page's own colours, one section among the others, below the
 * product: an owner who came for a till does not have to step over it.
 */
export function CustomPath({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const home = dict.builderHome;
  const proof = dict.proof;
  const steps = [
    { title: home.customStep1, body: home.customStep1Body },
    { title: home.customStep2, body: home.customStep2Body },
    { title: home.customStep3, body: home.customStep3Body },
  ];

  return (
    <section id="sur-mesure" className="scroll-mt-20 border-t border-border py-20 sm:py-28">
      <Container className="grid gap-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
        <FadeIn>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">{home.customEyebrow}</p>
          <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{home.customHeading}</h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{home.customBody}</p>

          <ol className="mt-10 space-y-5">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="w-6 shrink-0 pt-0.5 text-sm font-medium tabular-nums text-app-gold-ink">0{index + 1}</span>
                <div>
                  <p className="text-lg font-medium text-foreground">{step.title}</p>
                  <p className="mt-1 text-base leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
            <a
              href={localeHref(lang, "/contact")}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-foreground px-6 text-base font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              {home.customTalk}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </a>
            <a
              href={localeHref(lang, "/projects")}
              className="inline-flex min-h-[48px] items-center text-base text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
            >
              {home.customProjects}
            </a>
          </div>
        </FadeIn>

        <FadeIn delay={0.1} className="lg:pt-14">
          <div className="rounded-2xl border border-border p-8 sm:p-10">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">{proof.client}</p>
            <p className="mt-2 text-base text-foreground">{proof.metric}</p>

            <div className="mt-8 flex items-end gap-6">
              <div>
                <p className="text-base text-muted-foreground line-through">{proof.beforeValue}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.15em] text-muted-foreground">{proof.before}</p>
              </div>
              <ArrowRight className="mb-6 h-5 w-5 shrink-0 text-accent rtl:rotate-180" />
              <div>
                <p className="text-5xl font-semibold tracking-tight text-app-gold-ink">{proof.afterValue}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.15em] text-muted-foreground">{proof.after}</p>
              </div>
            </div>

            <div className="mt-8 border-t border-border pt-6">
              <p className="text-2xl font-semibold tracking-tight text-foreground">{proof.reduction}</p>
              <p className="mt-1 text-sm text-muted-foreground">{proof.reductionNote}</p>
            </div>

            <p className="mt-8 text-base leading-relaxed text-muted-foreground">{proof.body}</p>
            <a
              href={localeHref(lang, "/projects/gmm-mining")}
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 text-base font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
            >
              {proof.cta}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </a>
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}
