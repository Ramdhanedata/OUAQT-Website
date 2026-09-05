import { Hero } from "@/components/home/hero";
import { ImpactBar } from "@/components/home/impact-bar";
import { Problem } from "@/components/home/problem";
import { Pillars } from "@/components/home/pillars";
import { Proof } from "@/components/home/proof";
import { FeaturedProjects } from "@/components/home/featured-projects";
import { CallToAction } from "@/components/home/cta";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";

// Page order mirrors the pitch deck's argument:
// hook, credibility, problem, solution, proof, work, next step.
export default function Home({ params }: { params: { lang: Locale } }) {
  const dict = getDictionary(params.lang);

  return (
    <>
      <Hero dict={dict} lang={params.lang} />
      <ImpactBar dict={dict} />
      <Problem dict={dict} />
      <Pillars dict={dict} />
      <Proof dict={dict} lang={params.lang} />
      <FeaturedProjects dict={dict} lang={params.lang} />
      <CallToAction dict={dict} lang={params.lang} />
    </>
  );
}
