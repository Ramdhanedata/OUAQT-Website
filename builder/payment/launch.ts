import "server-only";

import { getPublicSettings } from "@/builder/db/settings";

const HOW_OFTEN_TO_REREAD_SECONDS = 300; // not-a-rule: cache lifetime, not a business rule

/*
 * Whether the launch offer is still open, for the pricing page.
 *
 * The count of businesses is behind the service role, because the table is
 * closed to browsers. When it cannot be read, `open` is null and the page
 * says who the launch price is for rather than claiming it applies: a page
 * that promises a price we have stopped honouring is worse than one that
 * explains the condition.
 */
export type LaunchOffer = {
  open: boolean | null;
  limit: number | null;
  freezeYears: number | null;
};

export async function getLaunchOffer(): Promise<LaunchOffer> {
  const settings = await getPublicSettings();
  const limit = settings?.launch_clients_limit ?? null;
  const freezeYears = settings?.launch_price_freeze_years ?? null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || limit === null) {
    return { open: null, limit, freezeYears };
  }

  const endpoint = new URL("/rest/v1/businesses", url);
  endpoint.searchParams.set("select", "id");

  try {
    const response = await fetch(endpoint, {
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`,
        /* head + exact gives the count in a header and no rows in the body. */
        prefer: "count=exact",
        range: "0-0",
      },
      next: { revalidate: HOW_OFTEN_TO_REREAD_SECONDS, tags: ["businesses"] },
    });
    if (!response.ok) return { open: null, limit, freezeYears };

    /* "0-0/12", or "*\/12" when the range is out of bounds. */
    const total = Number(response.headers.get("content-range")?.split("/")[1]);
    if (!Number.isFinite(total)) return { open: null, limit, freezeYears };

    return { open: total < limit, limit, freezeYears };
  } catch {
    return { open: null, limit, freezeYears };
  }
}
