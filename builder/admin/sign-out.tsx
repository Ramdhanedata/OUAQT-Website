"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { browserClient } from "@/builder/db/client";

/*
 * Leaving the admin area, from the menu of every page.
 *
 * Until this button the only way out was to close the browser, which leaves
 * the session where the next person to open that browser finds it.
 */
export function SignOut({ label }: { label: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const supabase = await browserClient();
        await supabase?.auth.signOut();
        window.location.assign("/admin");
      }}
      className="inline-flex min-h-[32px] shrink-0 items-center gap-1.5 rounded-lg px-2 text-sm text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground disabled:opacity-50"
    >
      <LogOut aria-hidden className="h-3.5 w-3.5 rtl:rotate-180" />
      {label}
    </button>
  );
}
