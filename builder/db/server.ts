import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import {
  serviceRoleKey,
  supabaseAnonKey,
  supabaseConfigured,
  supabaseUrl,
} from "./env";

/*
 * Server side connections.
 *
 * `import "server-only"` at the top turns a stray import from a client
 * component into a build error rather than a leaked key at three in the
 * morning.
 *
 * Two clients, and the difference matters:
 *
 *   sessionClient()  acts as the visitor. Row level security applies, so it
 *                    can only touch that owner's own rows. Use it for
 *                    anything a request does on the owner's behalf.
 *
 *   adminClient()    acts as the database owner. Every policy is skipped.
 *                    Use it only where staff work is being done, and never
 *                    with a value that came from the request without
 *                    checking who is asking first.
 */

/** Acts as the signed-in visitor, anonymous session included. */
export function sessionClient(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  const store = cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) =>
            store.set(name, value, options)
          );
        } catch {
          // Server components may not set cookies. The middleware refreshes
          // the session instead, so this is expected rather than broken.
        }
      },
    },
  });
}

/** Goes past row level security. Server code only, and only for staff work. */
export function adminClient(): SupabaseClient | null {
  const key = serviceRoleKey();
  if (supabaseUrl === "" || key === "") return null;

  return createClient(supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
