import { Hero } from "@/components/home/hero";
import { ImpactBar } from "@/components/home/impact-bar";
import { Problem } from "@/components/home/problem";
import { Pillars } from "@/components/home/pillars";
import { Proof } from "@/components/home/proof";
import { FeaturedProjects } from "@/components/home/featured-projects";
import { AboutTeaser } from "@/components/home/about-teaser";

// Page order mirrors the pitch deck's argument:
// hook -> credibility -> problem -> solution -> proof -> work -> who.
export default function Home() {
  return (
    <>
      <Hero />
      <ImpactBar />
      <Problem />
      <Pillars />
      <Proof />
      <FeaturedProjects />
      <AboutTeaser />
    </>
  );
}
