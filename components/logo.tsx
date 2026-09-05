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
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <span className={cn("block", className)}>
      <Image
        src="/logo-ouaqt-dark-ink.png"
        alt="OUAQT"
        width={1395}
        height={333}
        priority={priority}
        className="h-full w-auto"
      />
    </span>
  );
}
