import Image from "next/image";
import { cn } from "@/lib/utils";

/*
 * The OUAQT wordmark. The site is light only, so this renders the black-ink
 * artwork directly. The white-ink variant that used to swap in under a dark
 * theme has been removed along with dark mode.
 *
 * TODO(adel): the source is public/logo-ouaqt-dark-ink.png. If you update the
 * mark, replace that file.
 */
export function Logo({
  className,
  priority = false,
  alt = "OUAQT",
}: {
  className?: string;
  priority?: boolean;
  alt?: string;
}) {
  return (
    <span className={cn("block", className)}>
      <Image
        src="/logo-ouaqt-dark-ink.png"
        alt={alt}
        width={900}
        height={215}
        priority={priority}
        /* The mark is never wider than ~150px on screen. Without this, phones
           with sharp screens downloaded the full-width image for it. */
        sizes="150px"
        className="h-full w-auto"
      />
    </span>
  );
}
