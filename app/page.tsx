import { Hero } from "@/components/home/hero";
import { TrustBar } from "@/components/home/trust-bar";
import { Pillars } from "@/components/home/pillars";
import { FeaturedProjects } from "@/components/home/featured-projects";
import { AboutTeaser } from "@/components/home/about-teaser";

export default function Home() {
  return (
    <>
      <Hero />
      <TrustBar />
      <Pillars />
      <FeaturedProjects />
      <AboutTeaser />
    </>
  );
}
