import { NextResponse } from "next/server";
import { adminClient } from "@/builder/db/server";
import { hashToken } from "@/builder/licence/devices";
import { relay, syncRequest, type Device, type Message, type RelayStore } from "@/builder/sync/relay";
import { limitPerCaller } from "@/lib/rate-limit";

/*
 * The post box between a shop's devices. The rules are in builder/sync/relay.ts.
 *
 * Asked by the app itself, every few seconds at most, whether it has anything
 * to send or not. A licence that has run out still gets its answer: an owner
 * who has stopped paying may still want to see his own shop's work.
 */

const tooMany = limitPerCaller(60_000, 300); // not-a-rule: a shop catching up calls often, a guesser far more

function storeFrom(supabase: NonNullable<ReturnType<typeof adminClient>>): RelayStore {
  const must = <T,>(answer: { data: T | null; error: unknown; count?: number | null }): T => {
    if (answer.error) throw answer.error;
    return answer.data as T;
  };
  return {
    devices: async (businessId) =>
      must(await supabase.from("devices").select("device_id, status, token_hash, sync_cursor, sync_seen_at").eq("business_id", businessId)) as Device[],
    waiting: async (businessId) => {
      const answer = await supabase.from("sync_messages").select("id", { count: "exact", head: true }).eq("business_id", businessId);
      if (answer.error) throw answer.error;
      return answer.count ?? 0;
    },
    add: async (businessId, fromDevice, bodies) => {
      must(await supabase.from("sync_messages").insert(bodies.map((body) => ({ business_id: businessId, from_device: fromDevice, body }))));
    },
    next: async (businessId, notFrom, after, limit) =>
      must(
        await supabase
          .from("sync_messages")
          .select("id, from_device, body")
          .eq("business_id", businessId)
          .neq("from_device", notFrom)
          .gt("id", after)
          .order("id")
          .limit(limit)
      ) as Message[],
    markRead: async (businessId, deviceId, cursor, at) => {
      must(
        await supabase
          .from("devices")
          .update({ sync_cursor: cursor, sync_seen_at: at.toISOString(), last_seen: at.toISOString() })
          .eq("business_id", businessId)
          .eq("device_id", deviceId)
      );
    },
    forget: async (businessId, fromDevice, upTo) => {
      must(await supabase.from("sync_messages").delete().eq("business_id", businessId).eq("from_device", fromDevice).lte("id", upTo));
    },
    forgetOlderThan: async (businessId, before) => {
      must(await supabase.from("sync_messages").delete().eq("business_id", businessId).lt("created_at", before.toISOString()));
    },
  };
}

export async function POST(request: Request) {
  if (tooMany(request)) return NextResponse.json({ error: "too_many" }, { status: 429 });

  const input = syncRequest.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ error: "no_database" }, { status: 503 });

  try {
    const answer = await relay(storeFrom(supabase), input.data, await hashToken(input.data.deviceToken));
    if (!answer.ok) return NextResponse.json({ error: answer.error }, { status: answer.status });
    return NextResponse.json({ received: answer.received, cursor: answer.cursor, more: answer.more, gap: answer.gap });
  } catch (error) {
    console.error("the post box between devices failed", error);
    return NextResponse.json({ error: "not_available" }, { status: 503 });
  }
}
