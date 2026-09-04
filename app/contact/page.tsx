import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { FadeIn } from "@/components/motion/fade-in";
import { ContactForm } from "@/components/contact/contact-form";
import { Mail, MapPin } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — OUAQT",
  description: "Get in touch with the OUAQT team.",
};

export default function ContactPage() {
  return (
    <Section className="pt-32 sm:pt-40">
      <Container>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-5">
          <FadeIn className="lg:col-span-2">
            <p className="text-sm font-medium tracking-tight text-accent">
              Contact
            </p>
            <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Let&rsquo;s build something worth shipping.
            </h1>
            <p className="mt-6 leading-relaxed text-muted-foreground">
              Tell us about your project and we&rsquo;ll get back to you
              within a business day.
            </p>

            <div className="mt-10 space-y-4">
              {/* TODO(customize): update contact details */}
              <a
                href="mailto:hello@ouaqt.com"
                className="flex items-center gap-3 text-sm text-foreground transition-colors hover:text-accent"
              >
                <Mail className="h-4 w-4 text-accent" />
                hello@ouaqt.com
              </a>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-accent" />
                Remote-first, HQ in San Francisco, CA
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.1} className="lg:col-span-3">
            <ContactForm />
          </FadeIn>
        </div>
      </Container>
    </Section>
  );
}
