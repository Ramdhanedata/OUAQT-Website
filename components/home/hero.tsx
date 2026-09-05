"use client";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { GradientMesh } from "@/components/motion/gradient-mesh";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

// TODO(adel): headline and sub-copy come from the pitch deck.
// Edit here to adjust the site's core positioning.
export function Hero() {
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
          OUAQT · Custom business systems
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 max-w-4xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-6xl md:text-7xl"
        >
          Replacing paper, Excel, and WhatsApp with systems that actually run
          your business.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground"
        >
          Most businesses don&rsquo;t need more software. They need one system
          built around how they already work. That is what we build, one
          client at a time.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
        >
          <Button href="/contact" variant="accent">
            Discuss your workflow
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button href="/projects" variant="outline">
            See the systems
          </Button>
        </motion.div>
      </Container>
    </section>
  );
}
