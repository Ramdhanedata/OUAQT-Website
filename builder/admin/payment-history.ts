import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { toMinor } from "@/app-ui/money";
import type { PaymentApp } from "@/builder/payment/apps";
import type { CheckFailure, Extracted } from "@/builder/payment/checks";
import type { PaymentFacts } from "./payment-rules";

/*
 * Every payment, with what the admin pages need to show it: the shop, what
 * was read off the screenshot, who decided and when, what is owed back and
 * whether it was sent, and how it was filed (by serial or from an account,
 * the plan chosen or read from the amount, and which checks failed).
 *
 * Read with the service role, on the server. The audit trail is where what
 * happened to a payment is written (file.ts, the admin payment route), so
 * that is where its history comes from: no second copy to drift.
 */

export type PaymentLine = PaymentFacts & {
  id: string;
  businessId: string;
  businessName: string;
  pack: string;
  plan: string;
  app: PaymentApp;
  reference: string | null;
  readDate: string | null;
  recipient: string | null;
  createdAt: string;
  reviewer: string | null;
  reason: string | null;
  screenshotPath: string;
  extracted: Extracted;
  refundedAt: string | null;
  refundedBy: string | null;
  /* From the row that filed it; absent on payments filed before it was written down. */
  filed: { bySerial: boolean | null; planChosen: boolean | null; failures: CheckFailure[] };
};

export type ActivityEntry = {
  id: number;
  action: string;
  at: string;
  /* Null is the system: a screenshot read and checked, a licence opened by itself. */
  actor: string | null;
  paymentId: string;
  businessId: string | null;
  businessName: string | null;
  plan: string | null;
  amount: number | null;
  refund: number;
  reason: string | null;
  failures: CheckFailure[];
  /* For the licence a payment opened: until when. */
  until: string | null;
};

const MANY = 300; // not-a-rule: how many payments one page reads, newest first
const CHUNK = 100; // not-a-rule: ids per query, to keep each address short

const COLUMNS =
  "id, business_id, plan, app, expected_amount, extracted, reference, status, reviewer_id, reason, created_at, auto_confirmed, reviewed_at, screenshot_path";

type Row = {
  id: string;
  business_id: string;
  plan: string;
  app: PaymentApp;
  expected_amount: number | string;
  extracted: Extracted;
  reference: string | null;
  status: string;
  reviewer_id: string | null;
  reason: string | null;
  created_at: string;
  auto_confirmed: boolean | null;
  reviewed_at: string | null;
  screenshot_path: string;
};

type Event = { id: number; actor_id: string | null; subject_id: string | null; action: string; detail: Record<string, unknown> | null; created_at: string };

async function inChunks<T>(ids: string[], read: (part: string[]) => PromiseLike<{ data: T[] | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += CHUNK) {
    const { data } = await read(ids.slice(i, i + CHUNK));
    out.push(...(data ?? []));
  }
  return out;
}

async function namesOf(supabase: SupabaseClient, businessIds: string[], staffIds: string[]) {
  const [businesses, staff] = await Promise.all([
    inChunks<{ id: string; name_latin: string; pack: string }>([...new Set(businessIds)], (part) =>
      supabase.from("businesses").select("id, name_latin, pack").in("id", part)
    ),
    inChunks<{ user_id: string; name: string | null }>([...new Set(staffIds)], (part) =>
      supabase.from("admin_users").select("user_id, name").in("user_id", part)
    ),
  ]);
  return {
    shop: new Map(businesses.map((one) => [one.id, one])),
    staff: new Map(staff.map((one) => [one.user_id, one.name ?? ""])),
  };
}

function failuresOf(detail: Record<string, unknown> | null | undefined): CheckFailure[] {
  return Array.isArray(detail?.failures) ? (detail.failures as CheckFailure[]) : [];
}

function lineOf(
  row: Row,
  names: Awaited<ReturnType<typeof namesOf>>,
  refunds: Map<string, Event>,
  filings: Map<string, Event>
): PaymentLine {
  const refund = refunds.get(row.id);
  const filing = filings.get(row.id)?.detail ?? null;
  const shop = names.shop.get(row.business_id);
  const chosen = (filing?.chosen ?? null) as { plan?: boolean } | null;
  return {
    id: row.id,
    businessId: row.business_id,
    businessName: shop?.name_latin ?? "",
    pack: shop?.pack ?? "",
    plan: row.plan,
    app: row.app,
    status: row.status,
    autoConfirmed: Boolean(row.auto_confirmed),
    reviewedAt: row.reviewed_at,
    expected: Number(row.expected_amount),
    read: row.extracted?.amountMru != null ? toMinor(row.extracted.amountMru) : null,
    refunded: refund ? Number((refund.detail as { amount?: number } | null)?.amount ?? 0) : null,
    refundedAt: refund?.created_at ?? null,
    refundedBy: refund?.actor_id ? names.staff.get(refund.actor_id) ?? "" : null,
    reference: row.reference,
    readDate: row.extracted?.date ?? null,
    recipient: row.extracted?.recipient ?? null,
    createdAt: row.created_at,
    reviewer: row.reviewer_id ? names.staff.get(row.reviewer_id) ?? "" : null,
    reason: row.reason,
    screenshotPath: row.screenshot_path,
    extracted: row.extracted ?? null,
    filed: {
      bySerial: typeof filing?.bySerial === "boolean" ? filing.bySerial : null,
      planChosen: typeof chosen?.plan === "boolean" ? chosen.plan : null,
      failures: failuresOf(filing),
    },
  };
}

/* The rows the trail keeps about these payments, one per payment: the refund said sent, and the filing. */
async function eventsFor(supabase: SupabaseClient, ids: string[]) {
  const events = await inChunks<Event>(ids, (part) =>
    supabase
      .from("audit_events")
      .select("id, actor_id, subject_id, action, detail, created_at")
      .eq("subject", "payment")
      .in("action", ["refunded", "pending_confirmation", "rejected_auto", "submitted"])
      .in("subject_id", part)
  );
  const refunds = new Map<string, Event>();
  const filings = new Map<string, Event>();
  for (const event of events) {
    if (!event.subject_id) continue;
    if (event.action === "refunded") refunds.set(event.subject_id, event);
    else filings.set(event.subject_id, event);
  }
  return { refunds, filings, staffIds: events.map((one) => one.actor_id).filter((one): one is string => Boolean(one)) };
}

/** The newest payments, everything about each. */
export async function loadPaymentLines(supabase: SupabaseClient): Promise<PaymentLine[]> {
  const { data } = await supabase.from("payments").select(COLUMNS).order("created_at", { ascending: false }).limit(MANY);
  const rows = (data ?? []) as Row[];
  const { refunds, filings, staffIds } = await eventsFor(supabase, rows.map((one) => one.id));
  const names = await namesOf(
    supabase,
    rows.map((one) => one.business_id),
    [...rows.map((one) => one.reviewer_id).filter((one): one is string => Boolean(one)), ...staffIds]
  );
  return rows.map((row) => lineOf(row, names, refunds, filings));
}

/** One payment, or null. */
export async function loadPaymentLine(supabase: SupabaseClient, id: string): Promise<PaymentLine | null> {
  const { data } = await supabase.from("payments").select(COLUMNS).eq("id", id).maybeSingle();
  if (!data) return null;
  const row = data as Row;
  const { refunds, filings, staffIds } = await eventsFor(supabase, [row.id]);
  const names = await namesOf(supabase, [row.business_id], [...(row.reviewer_id ? [row.reviewer_id] : []), ...staffIds]);
  return lineOf(row, names, refunds, filings);
}

/*
 * What happened to payments, newest first: every row the trail keeps about
 * one, with the shop it belongs to and what it said. For one payment only
 * when an id is given, with the licence it opened.
 */
export async function loadPaymentActivity(supabase: SupabaseClient, paymentId?: string): Promise<ActivityEntry[]> {
  let query = supabase
    .from("audit_events")
    .select("id, actor_id, subject_id, action, detail, created_at")
    .eq("subject", "payment")
    .order("created_at", { ascending: false })
    .limit(paymentId ? 50 : 150); // not-a-rule: how far back the activity list reads
  if (paymentId) query = query.eq("subject_id", paymentId);
  const { data } = await query;
  const events = (data ?? []) as Event[];

  /* The licence a payment opened is written under the licence: brought in for one payment's own history. */
  let opened: Event[] = [];
  if (paymentId) {
    const { data: licence } = await supabase
      .from("audit_events")
      .select("id, actor_id, subject_id, action, detail, created_at")
      .eq("subject", "licence")
      .eq("action", "activated")
      .eq("detail->>from", paymentId)
      .limit(5);
    opened = ((licence ?? []) as Event[]).map((one) => ({ ...one, action: "licence_opened", subject_id: paymentId }));
  }

  const all = [...events, ...opened].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const paymentIds = [...new Set(all.map((one) => one.subject_id).filter((one): one is string => Boolean(one)))];
  const payments = await inChunks<{ id: string; business_id: string; plan: string; expected_amount: number | string }>(paymentIds, (part) =>
    supabase.from("payments").select("id, business_id, plan, expected_amount").in("id", part)
  );
  const byId = new Map(payments.map((one) => [one.id, one]));
  const names = await namesOf(
    supabase,
    payments.map((one) => one.business_id),
    all.map((one) => one.actor_id).filter((one): one is string => Boolean(one))
  );

  return all.map((event) => {
    const detail = event.detail ?? {};
    const payment = event.subject_id ? byId.get(event.subject_id) : undefined;
    const amount =
      typeof detail.amount === "number" ? detail.amount : typeof detail.expected === "number" ? detail.expected : payment ? Number(payment.expected_amount) : null;
    return {
      id: event.id,
      action: event.action,
      at: event.created_at,
      actor: event.actor_id ? names.staff.get(event.actor_id) ?? "" : null,
      paymentId: event.subject_id ?? "",
      businessId: payment?.business_id ?? null,
      businessName: payment ? names.shop.get(payment.business_id)?.name_latin ?? null : null,
      plan: typeof detail.plan === "string" ? detail.plan : payment?.plan ?? null,
      amount,
      refund: typeof detail.refundDue === "number" ? detail.refundDue : 0,
      reason: typeof detail.reason === "string" ? detail.reason : null,
      failures: failuresOf(detail),
      until: typeof detail.until === "string" ? detail.until : null,
    };
  });
}
