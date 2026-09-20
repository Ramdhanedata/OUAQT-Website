"use client";

import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

/*
 * Fades each page in on arrival. Keyed by the path, so moving to another page
 * replays the CSS animation (see .page-enter in globals.css).
 *
 * The class comes off as soon as the fade finishes, and that part is not
 * decoration. `animation-fill-mode: both` leaves the final transform applied
 * even though the last keyframe says none, and an element with a transform
 * becomes the containing block for every `position: fixed` child inside it.
 * The builder's Continue bar is such a child: left in place, it pinned itself
 * to the bottom of the page instead of the bottom of the screen and scrolled
 * out of reach on a phone.
 *
 * The timer is there because the event alone is not enough. On a fast machine
 * the fade is over before React hydrates, so the animationend never reaches
 * any handler and the class would stay for the life of the page.
 */
const FADE_MS = 400; // not-a-rule: the 0.35s fade in globals.css, plus a margin
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDone(true), FADE_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      key={pathname}
      className={done ? undefined : "page-enter"}
      onAnimationEnd={() => setDone(true)}
    >
      {children}
    </div>
  );
}
