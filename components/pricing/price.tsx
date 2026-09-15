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
 * Each figure sits in its own direction isolate so the number and currency
 * never reorder against the text around them. Arabic writes the currency as
 * words, so its isolate runs right to left: the number first, then the unit.
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
        <bdi dir={lang === "ar" ? "rtl" : "ltr"}>{formatPrice(line.standard, lang)}</bdi>
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
        <bdi dir={lang === "ar" ? "rtl" : "ltr"}>{formatPrice(line.standard, lang)}</bdi>
      </s>
      <span className="sr-only">{labels.launch}</span>
      <span
        className={cn(
          "font-semibold tracking-tight text-foreground",
          sizes[size].current
        )}
      >
        <bdi dir={lang === "ar" ? "rtl" : "ltr"}>{formatPrice(line.launch, lang)}</bdi>
      </span>
    </span>
  );
}
