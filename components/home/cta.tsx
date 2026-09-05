import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import { ArrowRight } from "lucide-react";

export function CallToAction() {
  return (
    <Section className="border-t border-border">
      <Container>
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Every system starts with a conversation.
          </h2>
          <p className="mt-6 text-balance leading-relaxed text-muted-foreground">
            Tell us how your business runs today. The paper, the spreadsheets,
            the group chats. That is where we start, and it usually takes one
            call to see where the first system belongs.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Button href="/contact" variant="accent">
              Get in touch
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button href="/about" variant="outline">
              About OUAQT
            </Button>
          </div>
        </FadeIn>
      </Container>
    </Section>
  );
}
