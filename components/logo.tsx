import Image from "next/image";
import { cn } from "@/lib/utils";

/*
 * The OUAQT wordmark. The source art is black line work with a red accent on
 * the Q, so it needs two inks: the original for light backgrounds and a
 * white-stroke variant (red preserved) for dark ones.
 *
 * Both are rendered and toggled with `dark:` classes rather than reading the
 * theme in JS — that keeps it a server component and avoids a flash on load.
 *
 * TODO(adel): the source is public/logo-ouaqt-*.png, generated from
 * "OUAQT without Background.png". If you update the mark, regenerate both.
 */
export function Logo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  // Intrinsic art is 1395x333 (~4.19:1); height is driven by the className.
  const dims = { width: 1395, height: 333 };

  return (
    <span className={cn("block", className)}>
      <Image
        {...dims}
        priority={priority}
        src="/logo-ouaqt-dark-ink.png"
        alt="OUAQT"
        className="h-full w-auto dark:hidden"
      />
      <Image
        {...dims}
        priority={priority}
        src="/logo-ouaqt-light-ink.png"
        alt="OUAQT"
        className="hidden h-full w-auto dark:block"
      />
    </span>
  );
}
