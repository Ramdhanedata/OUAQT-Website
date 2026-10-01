import type { LicenceStatus } from "@/app-ui/licence-status";
import { NO_LICENCE_COLOR, STATUS_COLOR } from "./status-colors";

/*
 * A licence's state as a small label with its colour beside it, the same on
 * every admin page. The words carry the meaning; the dot lets a list be
 * scanned for colour at a glance.
 */
export function StatusBadge({ status, label }: { status: LicenceStatus | null; label: string }) {
  return (
    <span className="inline-flex h-7 shrink-0 items-center gap-2 rounded-full border border-border bg-surface px-3 text-sm font-medium text-foreground">
      <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: status ? STATUS_COLOR[status] : NO_LICENCE_COLOR }} />
      {label}
    </span>
  );
}
