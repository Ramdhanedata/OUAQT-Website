"use client";

import { Button as SiteButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/*
 * The button an owner presses.
 *
 * The site's own button is 14px, which suits a marketing page read by someone
 * who chose to be there. Rule 4 in docs/UI_RULES.md asks for 16px and 48px
 * across every screen an owner or a cashier uses, and adding those two
 * classes by hand at each call site is a rule kept by memory. Three milestones
 * in, memory had already missed four of them.
 *
 * So the builder imports this instead, and the rule is kept by the import.
 */
type Props = React.ComponentProps<typeof SiteButton>;

export function Button({ className, ...props }: Props) {
  return <SiteButton className={cn("min-h-[48px] text-base", className)} {...props} />;
}
