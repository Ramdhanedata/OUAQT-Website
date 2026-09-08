import { Hero } from "@/components/home/hero";
import { ImpactBar } from "@/components/home/impact-bar";
import { Problem } from "@/components/home/problem";
import { Pillars } from "@/components/home/pillars";
import { Proof } from "@/components/home/proof";
import { FeaturedProjects } from "@/components/home/featured-projects";
import { Process } from "@/components/home/process";
import { Pricing } from "@/components/home/pricing";
import { Faq } from "@/components/home/faq";
import { CallToAction } from "@/components/home/cta";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";

/*
 * Page order follows the questions a prospective client asks, in the order
 * they ask them: is this my problem, how do you fix it, does it actually work,
 * show me, what is it like to work with you, what does it cost, and then the
 * objections. Contact comes last, once they have reason to use it.
 */
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
      <Process dict={dict} />
      <Pricing dict={dict} lang={params.lang} />
      <Faq dict={dict} />
      <CallToAction dict={dict} lang={params.lang} />
    </>
  );
}
