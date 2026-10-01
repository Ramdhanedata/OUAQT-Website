import type { LicenceStatus } from "@/app-ui/licence-status";

/*
 * One colour per licence state, the same on every admin screen: the status
 * bar, the badges, the dots in search results.
 *
 * Validated as a set with the dataviz palette checker against the admin
 * surface: every neighbouring pair stays apart for colour-blind readers.
 * The amber sits under 3:1 on ivory, so a colour never stands alone: each
 * one is drawn beside its label and, where it counts, its number.
 */
export const STATUS_COLOR: Record<LicenceStatus, string> = {
  active: "#1f8a3a",
  trial: "#2a78d6",
  renewal_due: "#c98500",
  expired_trial: "#7a6fc0",
  expired: "#7a6fc0",
  suspended: "#d03b3b",
};

/* Shops with no licence row at all: rare, and not a state the software knows. */
export const NO_LICENCE_COLOR = "#a8a59c";
