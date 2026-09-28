/*
 * Proves, against the live database, that row level security does what the
 * schema says it does.
 *
 * It signs in anonymously exactly as an owner's browser will, writes a draft,
 * reads it back, then checks that a different visitor cannot see it. It also
 * checks that the settings a visitor may read are the ones 0003 lists, and no
 * others.
 *
 * Everything it creates, it removes.
 *
 *   npm run db:check
 */

import { createClient } from "@supabase/supabase-js";

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
const service = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

if (!url || !anon) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local."
  );
  process.exit(1);
}

const results = [];
function record(name, passed, detail = "") {
  results.push({ name, passed, detail });
  console.log(`  ${passed ? "pass" : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
}

/** A plain REST call as a visitor with no session at all. */
async function asVisitor(path) {
  const response = await fetch(new URL(`/rest/v1/${path}`, url), {
    headers: { apikey: anon, authorization: `Bearer ${anon}` },
  });
  const body = await response.json().catch(() => null);
  return { status: response.status, body };
}

/*
 * The public list as 0016 leaves it. enabled_packs is on the policy still but
 * has no row since 0020, where opening a trade moved into the code.
 */
const TRADES = ["pharmacy", "bakery", "restaurant", "warehouse", "shop", "hotel", "transport", "general"];

const publicKeys = [
  "trial_days",
  "renewal_grace_days",
  "max_devices",
  "support_whatsapp",
  "price_installation_builder_mru",
  "price_annual_launch_mru",
  "price_annual_standard_mru",
  "price_quarterly_standard_mru",
  "price_semiannual_launch_mru",
  "price_semiannual_standard_mru",
  "price_setup_visit_mru",
  "price_extra_device_launch_mru",
  "price_extra_device_standard_mru",
  "price_installation_launch_mru",
  "price_installation_standard_mru",
  "price_perpetual_launch_mru",
  "price_perpetual_standard_mru",
  "bespoke_maintenance_percent",
  "bespoke_maintenance_from_month",
  "launch_clients_limit",
  "launch_price_freeze_years",
  "referral_free_months",
  "tutorial_video_windows_url",
  "tutorial_video_mac_url",
  ...TRADES.flatMap((trade) => [`installer_url_windows_${trade}`, `installer_url_mac_${trade}`]),
];

console.log("\nSettings a visitor may read\n");

const readable = await asVisitor(
  `settings?select=key,value&key=in.(${publicKeys.join(",")})`
);
record(
  "every public setting comes back",
  Array.isArray(readable.body) && readable.body.length === publicKeys.length,
  Array.isArray(readable.body) ? `got ${readable.body.length}` : `status ${readable.status}`
);

/* The numbers owners pay to, one per app. See 0021. */
for (const app of ["bankily", "masrvi", "bimbank", "sedad", "click"]) {
  const hidden = await asVisitor(`settings?select=key&key=eq.${app}_number`);
  record(
    `${app}_number stays hidden`,
    Array.isArray(hidden.body) && hidden.body.length === 0,
    Array.isArray(hidden.body) ? "" : `status ${hidden.status}`
  );
}

const everything = await asVisitor("settings?select=key");
record(
  "no setting outside the list leaks",
  Array.isArray(everything.body) &&
    everything.body.every((row) => publicKeys.includes(row.key)),
  Array.isArray(everything.body) ? `visible: ${everything.body.length}` : ""
);

const write = await fetch(new URL("/rest/v1/settings?key=eq.trial_days", url), {
  method: "PATCH",
  headers: {
    apikey: anon,
    authorization: `Bearer ${anon}`,
    "content-type": "application/json",
    prefer: "return=representation",
  },
  body: JSON.stringify({ value: 999 }),
});
const written = await write.json().catch(() => null);
record(
  "a visitor cannot change a setting",
  write.status === 401 || write.status === 403 ||
    (Array.isArray(written) && written.length === 0),
  `status ${write.status}`
);

console.log("\nClosed tables\n");

for (const table of [
  "businesses",
  "builder_drafts",
  "configurations",
  "licences",
  "payments",
  "leads_other_business",
  "builder_events",
  "admin_users",
  "audit_events",
]) {
  /*
   * `select=*` rather than a column name. Not every table has an `id`:
   * admin_users is keyed by user_id, and asking for a column that does not
   * exist comes back as a 400 that reads exactly like a security failure.
   */
  const response = await asVisitor(`${table}?select=*&limit=1`);
  const empty = Array.isArray(response.body) && response.body.length === 0;
  const refused = response.status === 401 || response.status === 403;
  record(
    `${table} shows a visitor nothing`,
    empty || refused,
    empty || refused ? "" : `status ${response.status}`
  );
}

console.log("\nAn owner's own draft, under an anonymous session\n");

const owner = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data: signIn, error: signInError } = await owner.auth.signInAnonymously();

record(
  "anonymous sign-in works",
  Boolean(signIn?.user),
  signInError ? signInError.message : ""
);

let draftId = null;
if (signIn?.user) {
  const { data: draft, error } = await owner
    .from("builder_drafts")
    .insert({ session_owner: signIn.user.id, pack: "pharmacy", step: 1 })
    .select("id")
    .single();
  draftId = draft?.id ?? null;
  record("the owner can save a draft", Boolean(draftId), error?.message ?? "");

  const { data: mine } = await owner.from("builder_drafts").select("id");
  record("the owner reads his own draft back", mine?.length === 1);

  // A second anonymous visitor, which is what another phone would be.
  const stranger = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: strangerSignIn } = await stranger.auth.signInAnonymously();
  const { data: theirs } = await stranger.from("builder_drafts").select("id");
  record("another visitor cannot see it", theirs?.length === 0);

  const { error: stealError } = await stranger
    .from("builder_drafts")
    .update({ step: 9 })
    .eq("id", draftId);
  const { data: afterSteal } = await owner
    .from("builder_drafts")
    .select("step")
    .eq("id", draftId)
    .single();
  record(
    "another visitor cannot change it",
    afterSteal?.step === 1,
    stealError ? "" : "update was accepted but changed nothing"
  );

  if (service) {
    const admin = createClient(url, service, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await admin.from("builder_drafts").delete().eq("id", draftId);
    for (const id of [signIn.user.id, strangerSignIn?.user?.id]) {
      if (id) await admin.auth.admin.deleteUser(id);
    }
    /*
     * Its own rows, not the whole table. Asserting the table is empty passes
     * once, on an untouched project, and fails ever after for the wrong
     * reason: somebody else's draft is not this test's mess.
     */
    const { data: left } = await admin
      .from("builder_drafts")
      .select("id")
      .eq("id", draftId);
    record("the test left nothing behind", (left?.length ?? 0) === 0);
  } else {
    console.log(
      "\n  SUPABASE_SERVICE_ROLE_KEY is not set, so the probe rows stay behind."
    );
  }
}

const failed = results.filter((r) => !r.passed);
console.log(
  failed.length === 0
    ? `\nAll ${results.length} checks pass.\n`
    : `\n${failed.length} of ${results.length} checks failed.\n`
);
process.exit(failed.length === 0 ? 0 : 1);
