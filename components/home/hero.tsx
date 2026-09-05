"use client";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { GradientMesh } from "@/components/motion/gradient-mesh";
import type { Dictionary } from "@/lib/i18n";
import { localeHref, type Locale } from "@/lib/i18n/config";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function Hero({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  return (
    <section className="relative overflow-hidden">
      <GradientMesh />
      <Container className="flex min-h-[85vh] flex-col justify-center py-24 sm:py-32">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-sm font-medium tracking-tight text-accent"
        >
          {dict.hero.eyebrow}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 max-w-4xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-6xl md:text-7xl"
        >
          {dict.hero.heading}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground"
        >
          {dict.hero.body}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
        >
          <Button href={localeHref(lang, "/contact")} variant="accent">
            {dict.hero.primaryCta}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Button>
          <Button href={localeHref(lang, "/projects")} variant="outline">
            {dict.hero.secondaryCta}
          </Button>
        </motion.div>
      </Container>
    </section>
  );
}
