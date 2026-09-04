import { Container } from "@/components/ui/container";
import { FadeIn } from "@/components/motion/fade-in";

// TODO(customize): replace with real client/partner logos once available.
// Using text placeholders so nothing looks like unlicensed stock imagery.
const logos = ["Northwind", "Vantage Labs", "Circuit", "Fernhaven", "Aperture"];

export function TrustBar() {
  return (
    <Container className="py-12">
      <FadeIn>
        <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Trusted by teams building the next decade of software
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-60">
          {logos.map((logo) => (
            <span
              key={logo}
              className="text-lg font-semibold tracking-tight text-muted-foreground"
            >
              {logo}
            </span>
          ))}
        </div>
      </FadeIn>
    </Container>
  );
}
