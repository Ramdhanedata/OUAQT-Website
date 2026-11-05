import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * A laptop and a phone, drawn in CSS around a real screen of the software.
 *
 * Both scale with the width they are given: every edge, corner and notch is
 * measured in cqw, a hundredth of the frame's own width, so a small phone
 * beside a large laptop keeps the proportions of a real one.
 *
 * Nothing is drawn over the screen. The phone has a strip above for its
 * camera and one below for its home bar, the way an app opened from the home
 * screen sits between them, so no part of the app is hidden.
 */

const FRAME = "bg-[#141413]";

/* The phone's edge, as a share of its width: the 3.4cqw padding below. */
export const PHONE_BEZEL_SHARE = 0.034;

export function Laptop({
  children,
  className,
  screenClassName,
  screenStyle,
}: {
  children: ReactNode;
  className?: string;
  /** The screen's own shape. Leave it out when what is inside sets its height. */
  screenClassName?: string;
  screenStyle?: CSSProperties;
}) {
  return (
    <div className={cn("relative [container-type:inline-size]", className)}>
      <div className={cn("relative rounded-t-[2.2cqw] rounded-b-[0.6cqw] p-[1.5cqw] pt-[2.2cqw] shadow-device ring-1 ring-black/10", FRAME)}>
        <span aria-hidden className="absolute left-1/2 top-[0.75cqw] h-[0.7cqw] w-[0.7cqw] -translate-x-1/2 rounded-full bg-[#2a2a28] ring-1 ring-white/5" />
        <div className={cn("relative overflow-hidden rounded-[0.5cqw] bg-app-background", screenClassName)} style={screenStyle}>
          {children}
        </div>
      </div>
      {/* The base, a little wider than the lid, with the notch for opening it. */}
      <div aria-hidden className="relative -mx-[5.5cqw] h-[2.4cqw] rounded-b-[2cqw] rounded-t-[0.3cqw] bg-gradient-to-b from-[#e4e1d8] via-[#cfcbc0] to-[#a9a59a] shadow-[0_18px_30px_-18px_rgba(10,10,10,0.55)]">
        <span className="absolute left-1/2 top-0 h-[0.9cqw] w-[13cqw] -translate-x-1/2 rounded-b-[1cqw] bg-[#b9b5aa]" />
      </div>
    </div>
  );
}

export function Phone({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={cn("relative [container-type:inline-size]", className)} style={style}>
      {/* Side buttons, on the frame's edges. */}
      <span aria-hidden className={cn("absolute -start-[1.1cqw] top-[22cqw] h-[11cqw] w-[1.4cqw] rounded-s-[1cqw]", FRAME)} />
      <span aria-hidden className={cn("absolute -end-[1.1cqw] top-[30cqw] h-[18cqw] w-[1.4cqw] rounded-e-[1cqw]", FRAME)} />
      <div className={cn("relative rounded-[14cqw] p-[3.4cqw] shadow-device ring-1 ring-black/20", FRAME)}>
        <div className="relative overflow-hidden rounded-[11cqw] bg-app-background">
          <div aria-hidden className="flex h-[11cqw] items-center justify-center bg-app-background">
            <span className={cn("h-[6.6cqw] w-[26cqw] rounded-full", FRAME)} />
          </div>
          {children}
          <div aria-hidden className="flex h-[6cqw] items-center justify-center bg-app-raised">
            <span className="h-[1.3cqw] w-[32cqw] rounded-full bg-app-ink/80" />
          </div>
        </div>
      </div>
    </div>
  );
}
