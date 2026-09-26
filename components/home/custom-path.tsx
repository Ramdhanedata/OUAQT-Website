import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
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
 * Set apart in the dark band so that it reads as its own offer, below the
 * product, rather than as a step an owner who came for a till must take.
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
    <section id="sur-mesure" className="scroll-mt-16 bg-foreground py-20 text-background sm:py-28">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
          <FadeIn>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">{home.customEyebrow}</p>
            <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{home.customHeading}</h2>
            <p className="mt-5 text-lg leading-relaxed text-background/70">{home.customBody}</p>

            <ol className="mt-10 space-y-6">
              {steps.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-background/20 text-sm tabular-nums text-background/80">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-lg font-medium">{step.title}</p>
                    <p className="mt-1 text-base leading-relaxed text-background/65">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button href={localeHref(lang, "/contact")} variant="accent" className="min-h-[48px] justify-center text-base">
                {home.customTalk}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
              <Button
                href={localeHref(lang, "/projects")}
                variant="outline"
                className="min-h-[48px] justify-center border-background/25 text-base text-background hover:border-background"
              >
                {home.customProjects}
              </Button>
            </div>
          </FadeIn>

          <FadeIn delay={0.1} className="lg:pt-16">
            <div className="rounded-3xl border border-background/15 bg-background/[0.06] p-8 sm:p-10">
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-background/60">{proof.client}</p>
              <p className="mt-2 text-base text-background/90">{proof.metric}</p>

              <div className="mt-8 flex items-end gap-6">
                <div>
                  <p className="text-base text-background/60 line-through">{proof.beforeValue}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.15em] text-background/50">{proof.before}</p>
                </div>
                <ArrowRight className="mb-6 h-5 w-5 shrink-0 text-accent rtl:rotate-180" />
                <div>
                  <p className="text-5xl font-semibold tracking-tight text-accent">{proof.afterValue}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.15em] text-background/50">{proof.after}</p>
                </div>
              </div>

              <div className="mt-8 border-t border-background/15 pt-6">
                <p className="text-2xl font-semibold tracking-tight">{proof.reduction}</p>
                <p className="mt-1 text-sm text-background/60">{proof.reductionNote}</p>
              </div>

              <p className="mt-8 text-base leading-relaxed text-background/75">{proof.body}</p>
              <a
                href={localeHref(lang, "/projects/gmm-mining")}
                className="mt-4 inline-flex min-h-[44px] items-center gap-2 text-base font-medium text-background underline decoration-background/30 underline-offset-4 transition-colors hover:decoration-background"
              >
                {proof.cta}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </a>
            </div>
          </FadeIn>
        </div>
      </Container>
    </section>
  );
}
