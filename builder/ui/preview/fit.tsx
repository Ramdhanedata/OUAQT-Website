"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * The desktop app's window, at the size it is laid out for. The builder's
 * preview and the home page's demo both draw it and scale it with Fit.
 */
export const APP_WIDTH = 1280; // not-a-rule: the laptop screen the app is laid out for, in pixels
export const APP_HEIGHT = 800; // not-a-rule: that screen's height, in pixels
export const TITLE_HEIGHT = 36; // not-a-rule: the window's title bar, in pixels
export const CANVAS_HEIGHT = APP_HEIGHT + TITLE_HEIGHT;

export type FitMode = "width" | "contain" | "actual";

/*
 * Scales the window, never reflows it. "width" follows the column it sits
 * in, "contain" fits a box on both sides, "actual" draws it at its real size
 * and lets the box scroll. The elements are the same in every mode, only
 * their styles change, so the window inside is never rebuilt. Held left to
 * right whatever the page is doing, so an Arabic page does not push the
 * scaled copy out of sight; the app inside sets its own direction.
 */
export function Fit({ mode, children }: { mode: FitMode; children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const element = outer.current;
    if (!element) return;
    const measure = () => setBox({ width: element.clientWidth, height: element.clientHeight });
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const scale =
    mode === "actual"
      ? 1
      : mode === "width"
        ? box.width / APP_WIDTH
        : Math.min(box.width / APP_WIDTH, box.height / CANVAS_HEIGHT);
  const left = mode === "contain" ? Math.max(0, (box.width - APP_WIDTH * scale) / 2) : 0;
  const top = mode === "contain" ? Math.max(0, (box.height - CANVAS_HEIGHT * scale) / 2) : 0;

  return (
    <div
      ref={outer}
      dir="ltr"
      className={cn("relative w-full", mode === "width" ? undefined : "h-full", mode === "actual" ? "overflow-auto rounded-xl" : "overflow-hidden")}
      style={mode === "width" ? { aspectRatio: `${APP_WIDTH} / ${CANVAS_HEIGHT}` } : undefined}
    >
      <div
        className={mode === "actual" ? "relative" : "absolute origin-top-left"}
        style={{
          width: APP_WIDTH,
          height: CANVAS_HEIGHT,
          left: mode === "actual" ? undefined : left,
          top: mode === "actual" ? undefined : top,
          transform: mode === "actual" ? undefined : `scale(${scale || 0.0001})`,
          visibility: box.width > 0 ? "visible" : "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}
