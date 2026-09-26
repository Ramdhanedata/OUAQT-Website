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
export async function sessionClient(): Promise<SupabaseClient | null> {
  if (!supabaseConfigured) return null;
  const store = await cookies();

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

/*
 * The same visitor, when the caller is not a browser.
 *
 * A browser sends its session in a cookie. Anything else that acts for an
 * owner, the test client that plays the desktop app today and a phone app
 * later, sends a bearer token instead. Either way the request runs as him,
 * with every row level security policy applying exactly as before.
 */
export async function requestClient(request: Request): Promise<SupabaseClient | null> {
  const header = request.headers.get("authorization") ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) return sessionClient();
  if (!supabaseConfigured) return null;

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: header } },
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
