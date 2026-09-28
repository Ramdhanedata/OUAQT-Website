import { NextResponse } from "next/server";
import { z } from "zod";
import { adminClient } from "@/builder/db/server";
import { packs } from "@/app-ui/packs";
import { parseContact } from "@/lib/contact-channel";
import { escapeHtml, mailLine, mailOuaqt } from "@/lib/mail";

/*
 * "My business is not on this list", and the packs that are not open yet.
 *
 * The table this writes to has row level security on with no policy at all,
 * so a browser cannot reach it however hard it tries. The write happens here,
 * with the service role, which is also the only place a rate limit can live.
 *
 * Only two things are kept: what he says he does, and a phone number to call
 * him back on. Both are also mailed to OUAQT's inbox, so someone can call
 * him the same day without opening the database. The mail is what matters:
 * a missing database still sends it, and a missing mailer still saves.
 */

/* A pack he tapped says what he does; otherwise he writes it. */
const lead = z
  .object({
    businessType: z.string().trim().max(120).optional(),
    phone: z
      .string()
      .trim()
      .min(6)
      .max(20)
      .regex(/^[0-9+\s().-]+$/),
    pack: z.enum(packs).optional(),
    /* Where he was when he wrote, and in which language, for the call back. */
    page: z.string().trim().max(200).optional(),
    locale: z.string().trim().max(5).optional(),
  })
  .refine((one) => Boolean(one.pack) || (one.businessType ?? "").length >= 2);

const A_MINUTE = 60_000; // not-a-rule: the rate limit window
const MOST_PER_MINUTE = 5; // not-a-rule: submissions from one address
const recent = new Map<string, number[]>();

function tooMany(who: string): boolean {
  const now = Date.now();
  const times = (recent.get(who) ?? []).filter((at) => now - at < A_MINUTE);
  times.push(now);
  recent.set(who, times);
  return times.length > MOST_PER_MINUTE;
}

export async function POST(request: Request) {
  const who =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (tooMany(who)) {
    return NextResponse.json({ error: "slow_down" }, { status: 429 });
  }

  const body = lead.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const { pack, businessType, phone, page, locale } = body.data;
  const business = pack
    ? [pack, businessType].filter(Boolean).join(": ")
    : (businessType ?? "");

  const saved = await save(business, phone);
  const mailed = await mailOuaqt(leadMail({ business, phone, pack, page, locale }));

  if (saved === "saved" || mailed === "sent") {
    // mailed false: the browser sends the mail itself (lib/formsubmit.ts).
    return NextResponse.json({ ok: true, mailed: mailed === "sent" });
  }
  // Neither kept nor sent. The form still tries the browser's own mail.
  return NextResponse.json(
    { error: saved === "no_database" ? "no_database" : "not_saved", mailed: false },
    { status: saved === "no_database" ? 501 : 502 }
  );
}

async function save(business: string, phone: string): Promise<"saved" | "no_database" | "failed"> {
  const supabase = adminClient();
  if (!supabase) return "no_database";
  const { error } = await supabase
    .from("leads_other_business")
    .insert({ business_type: business, phone });
  return error ? "failed" : "saved";
}

function leadMail({
  business,
  phone,
  pack,
  page,
  locale,
}: {
  business: string;
  phone: string;
  pack?: string;
  page?: string;
  locale?: string;
}) {
  const whatsapp = parseContact(phone);
  const whatsappUrl = whatsapp?.kind === "phone" ? whatsapp.whatsappUrl : undefined;
  const what = pack ? "Waiting for a trade that is not open yet" : "Business not on the list";
  const lines: [string, string][] = [
    [pack ? "Trade" : "Business", business],
    ["Phone / WhatsApp", phone],
    ["Page", page || "(unknown)"],
    ["Language", locale || "(unknown)"],
  ];
  return {
    subject: `OUAQT: ${what.toLowerCase()} (${business})`,
    html: `
    <h2 style="font:600 18px system-ui;margin:0 0 16px">${escapeHtml(what)}</h2>
    ${lines.map(([label, value]) => mailLine(label, value)).join("\n    ")}
    ${whatsappUrl ? `<p style="font:14px system-ui;margin:12px 0 0"><a href="${whatsappUrl}">Open in WhatsApp</a></p>` : ""}
  `,
    text: [what, "", ...lines.map(([label, value]) => `${label}: ${value}`), ...(whatsappUrl ? [whatsappUrl] : [])].join("\n"),
  };
}
