import { formatPrice, pricing, type PriceLine } from "@/lib/data/pricing";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

const sizes = {
  sm: { current: "text-lg sm:text-xl", previous: "text-sm" },
  md: { current: "text-2xl sm:text-3xl", previous: "text-base" },
  lg: { current: "text-4xl sm:text-5xl", previous: "text-lg" },
};

/*
 * One price line. While the launch offer is open, the standard figure is
 * struck through beside the launch figure, which carries the weight. Each
 * figure has a visually hidden label, so a screen reader says which price is
 * which instead of reading two numbers in a row.
 *
 * Figures sit in an LTR isolate, the treatment the Arabic pages already give
 * phone numbers and emails, so "MRU" stays after the number and the pair keeps
 * its order inside right-to-left text.
 */
export function Price({
  line,
  lang,
  labels,
  size = "md",
  className,
}: {
  line: PriceLine;
  lang: Locale;
  labels: { standard: string; launch: string };
  size?: keyof typeof sizes;
  className?: string;
}) {
  if (!pricing.launchOffer.active) {
    return (
      <span
        className={cn(
          "font-semibold tracking-tight text-foreground",
          sizes[size].current,
          className
        )}
      >
        <bdi dir="ltr">{formatPrice(line.standard, lang)}</bdi>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-baseline gap-x-3 gap-y-1",
        className
      )}
    >
      <span className="sr-only">{labels.standard}</span>
      <s
        className={cn(
          "text-muted-foreground decoration-accent/80",
          sizes[size].previous
        )}
      >
        <bdi dir="ltr">{formatPrice(line.standard, lang)}</bdi>
      </s>
      <span className="sr-only">{labels.launch}</span>
      <span
        className={cn(
          "font-semibold tracking-tight text-foreground",
          sizes[size].current
        )}
      >
        <bdi dir="ltr">{formatPrice(line.launch, lang)}</bdi>
      </span>
    </span>
  );
}
