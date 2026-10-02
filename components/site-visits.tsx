"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { countVisit } from "@/lib/site-count";

/* Counts each page shown, on arrival and on every move inside the site. Draws nothing. */
export function SiteVisits({ lang }: { lang: string }) {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname) countVisit(pathname, lang);
  }, [pathname, lang]);
  return null;
}
