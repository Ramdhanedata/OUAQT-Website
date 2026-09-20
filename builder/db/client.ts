"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseConfigured, supabaseUrl } from "./env";

/*
 * The browser's connection to the database.
 *
 * One client per tab, made on first use. Returns null when the keys are
 * missing so a half-configured deployment shows the "not ready" message
 * instead of a stack trace.
 */

let client: SupabaseClient | null = null;

export function browserClient(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  client ??= createBrowserClient(supabaseUrl, supabaseAnonKey);
  return client;
}

/*
 * An owner starts answering questions before we ask for anything. That needs
 * an identity all the same, or the draft has no owner and row level security
 * has nothing to check, so we sign the browser in anonymously on first save.
 *
 * What this means for the owner: the draft comes back on this browser, on this
 * computer. Clearing the browser or moving to the phone loses it, until the
 * account step in B3 attaches the draft to a real login.
 */
export async function ensureAnonymousSession(): Promise<SupabaseClient | null> {
  const supabase = browserClient();
  if (!supabase) return null;

  const { data } = await supabase.auth.getSession();
  if (data.session) return supabase;

  const { error } = await supabase.auth.signInAnonymously();
  if (error) {
    // Anonymous sign-ins can be switched off in the dashboard. Say which
    // switch, because the message the client returns does not.
    console.error(
      "Anonymous sign-in refused. Supabase dashboard > Authentication > Sign In / Providers > Anonymous sign-ins.",
      error.message
    );
    return null;
  }
  return supabase;
}
