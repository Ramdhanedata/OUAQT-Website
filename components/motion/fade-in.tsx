"use client";

import { cn } from "@/lib/utils";
import { ReactNode, useEffect, useRef, useState } from "react";

type FadeInProps = {
  children: ReactNode;
  className?: string;
  /** Seconds to wait once the block is on screen. */
  delay?: number;
};

/*
 * Subtle scroll reveal used throughout the site: the block rises into place
 * the first time it comes near the viewport. The animation itself is CSS (see
 * .reveal in globals.css); this only watches for the block coming into view,
 * which is why the site needs no animation library.
 *
 * Nothing is hidden until the inline script in the layout marks the page as
 * having JavaScript, so the content is always readable without it.
 */
export function FadeIn({ children, className, delay = 0 }: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "-80px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shown]);

  return (
    <div
      ref={ref}
      className={cn("reveal", className)}
      data-shown={shown ? "true" : undefined}
      style={delay ? ({ "--rise-delay": `${delay}s` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
