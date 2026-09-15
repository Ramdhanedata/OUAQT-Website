"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

/*
 * Fades each page in on arrival. Keyed by the path, so moving to another page
 * replays the CSS animation (see .page-enter in globals.css).
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
