"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/*
 * Draws its child at a fixed pixel width, then shrinks the whole thing to fit
 * the space available.
 *
 * The receipt is the reason this exists. It has to be laid out at the real
 * width of an 80mm roll, 576 pixels at 203 dpi, or what the owner sees is not
 * what the printer will cut. A transform keeps the proportions exactly; the
 * measuring is only so the shrunk copy does not leave a hole under it, since a
 * transform does not change the space an element takes.
 *
 * The box itself is held left to right whatever the page around it is doing.
 * A roll of paper has no reading direction, and in an Arabic page the
 * shrinking otherwise happens away from the corner the box starts at, which
 * slid the whole receipt out of sight. The text inside still sets its own
 * direction.
 */
export function Scaled({
  width,
  children,
}: {
  width: number;
  children: ReactNode;
}) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const measure = () => {
      const available = outer.current?.clientWidth ?? width;
      const next = Math.min(1, available / width);
      setScale(next);
      setHeight((inner.current?.scrollHeight ?? 0) * next);
    };

    measure();
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(measure);
    if (outer.current) observer.observe(outer.current);
    if (inner.current) observer.observe(inner.current);
    return () => observer.disconnect();
  }, [width, children]);

  return (
    <div ref={outer} dir="ltr" style={{ height, overflow: "hidden" }}>
      <div
        ref={inner}
        style={{
          width,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}
