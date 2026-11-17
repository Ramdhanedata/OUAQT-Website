"use client";

import { useEffect, useState } from "react";
import type { BuilderCopy } from "@/builder/copy";
import type { Locale } from "@/lib/i18n/config";
import { fill } from "@/lib/utils";
import { Link2, MessageCircle } from "lucide-react";
import { shopLink } from "./config-code";

/*
 * His software on another computer or phone, with nothing to type: a link
 * he sends himself. Opened there, it goes straight to the download for his
 * shop, or to his shop on a phone. The number inside it is never shown.
 */
export function OtherDevice({ copy, serial, language }: { copy: BuilderCopy; serial: string; language: Locale }) {
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => setLink(shopLink(serial, language)), [serial, language]);
  if (!link) return null;

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(fill(copy.otherDevice.message as string, { url: link }))}`;

  return (
    <section className="space-y-3 rounded-xl border border-border p-4 sm:p-5">
      <h2 className="text-lg font-semibold text-foreground">{copy.otherDevice.heading}</h2>
      <p className="text-base leading-relaxed text-muted-foreground">{copy.otherDevice.body}</p>
      <div className="flex flex-wrap gap-3">
        <a
          href={whatsapp}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-border px-5 text-base font-medium text-foreground hover:border-foreground"
        >
          <MessageCircle className="h-4 w-4 text-accent" />
          {copy.otherDevice.share}
        </a>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(link);
            setCopied(true);
          }}
          className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-border px-5 text-base font-medium text-foreground hover:border-foreground"
        >
          <Link2 className="h-4 w-4" />
          {copied ? copy.otherDevice.copied : copy.otherDevice.copy}
        </button>
      </div>
    </section>
  );
}
