import { NextResponse } from "next/server";

/*
 * Contact form endpoint. Delivers submissions to OUAQT's inbox.
 *
 * Sends through Resend's REST API directly, so there is no SDK dependency to
 * keep updated. The visitor's address goes in reply_to, which means replying
 * from Gmail goes straight back to them.
 *
 * Required environment variables (set these in Vercel, and in .env.local for
 * local testing):
 *   RESEND_API_KEY    from resend.com/api-keys
 *   CONTACT_TO_EMAIL  defaults to ouaqt.mrt@gmail.com
 *   CONTACT_FROM_EMAIL  optional. Until a domain is verified with Resend this
 *                       must stay on their shared sender, onboarding@resend.dev.
 *
 * Note: with no verified domain, Resend only delivers to the address that owns
 * the account. Sign up with ouaqt.mrt@gmail.com and delivery works. Verifying
 * a domain later lifts that and lets mail come from, say, hello@ouaqt.com.
 */

const TO = process.env.CONTACT_TO_EMAIL || "ouaqt.mrt@gmail.com";
const FROM = process.env.CONTACT_FROM_EMAIL || "OUAQT Website <onboarding@resend.dev>";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Coarse per-instance throttle. Serverless instances are not shared, so this
   slows a casual flood rather than stopping a determined one. Resend's own
   limits are the real backstop. */
const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const message = String(body.message ?? "").trim();
  // Hidden field. Real people leave it empty; bots fill everything in.
  const company = String(body.company ?? "").trim();
  const locale = String(body.locale ?? "en").trim();

  if (company) {
    // Look successful so the bot does not go looking for another way in.
    return NextResponse.json({ ok: true });
  }

  if (!name || !EMAIL_RE.test(email) || message.length < 20) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  if (name.length > 200 || email.length > 320 || message.length > 5000) {
    return NextResponse.json({ error: "too_long" }, { status: 400 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Never pretend a message was delivered when it was not.
    console.error("RESEND_API_KEY is not set; contact form cannot send.");
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const html = `
    <h2 style="font:600 18px system-ui;margin:0 0 16px">New enquiry from the OUAQT website</h2>
    <p style="font:14px system-ui;margin:0 0 6px"><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p style="font:14px system-ui;margin:0 0 6px"><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p style="font:14px system-ui;margin:0 0 16px"><strong>Language:</strong> ${escapeHtml(locale)}</p>
    <p style="font:14px system-ui;margin:0 0 6px"><strong>Message:</strong></p>
    <p style="font:14px/1.6 system-ui;white-space:pre-wrap;margin:0">${escapeHtml(message)}</p>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: email,
        subject: `OUAQT enquiry from ${name}`,
        html,
        text: `Name: ${name}\nEmail: ${email}\nLanguage: ${locale}\n\n${message}`,
      }),
    });

    if (!res.ok) {
      console.error("Resend rejected the message:", res.status, await res.text());
      return NextResponse.json({ error: "send_failed" }, { status: 502 });
    }
  } catch (error) {
    console.error("Could not reach Resend:", error);
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
