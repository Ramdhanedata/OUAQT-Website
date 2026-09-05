import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { FadeIn } from "@/components/motion/fade-in";
import { ContactForm } from "@/components/contact/contact-form";
import { organization } from "@/lib/data/contact";
import { Mail, MapPin } from "lucide-react";
import {
  FacebookIcon,
  LinkedInIcon,
  WhatsAppIcon,
} from "@/components/ui/social-icons";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | OUAQT",
  description:
    "Tell OUAQT how your business runs today, and where a custom system would save the most time.",
};

export default function ContactPage() {
  return (
    <Section className="pt-32 sm:pt-40">
      <Container>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-5">
          <FadeIn className="lg:col-span-2">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
              Contact
            </p>
            <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              What part of your day still runs on a spreadsheet?
            </h1>
            <p className="mt-6 leading-relaxed text-muted-foreground">
              Tell us how your business actually operates today. The paper,
              the spreadsheets, the group chats. That conversation is where
              every OUAQT system starts.
            </p>

            <div className="mt-10 space-y-4">
              <a
                href={organization.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 text-sm text-foreground transition-colors hover:text-accent"
              >
                <WhatsAppIcon className="h-4 w-4 shrink-0 text-accent" />
                {organization.phoneDisplay}
                <span className="text-xs text-muted-foreground">WhatsApp</span>
              </a>

              <a
                href={`mailto:${organization.email}`}
                className="flex items-center gap-3 text-sm text-foreground transition-colors hover:text-accent"
              >
                <Mail className="h-4 w-4 shrink-0 text-accent" />
                {organization.email}
              </a>

              <a
                href={organization.linkedin}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 text-sm text-foreground transition-colors hover:text-accent"
              >
                <LinkedInIcon className="h-4 w-4 shrink-0 text-accent" />
                LinkedIn
              </a>

              <a
                href={organization.facebook}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 text-sm text-foreground transition-colors hover:text-accent"
              >
                <FacebookIcon className="h-4 w-4 shrink-0 text-accent" />
                Facebook
              </a>

              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0 text-accent" />
                {organization.location}
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
