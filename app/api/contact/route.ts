import { NextResponse } from "next/server";
import { parseContact } from "@/lib/contact-channel";
import { escapeHtml, mailOuaqt } from "@/lib/mail";

/*
 * Contact form endpoint. Delivers submissions to OUAQT's inbox through
 * lib/mail.ts. When the visitor leaves an email it goes in reply_to, so
 * replying from Gmail goes straight back to them. When they leave a phone
 * number instead, the email carries a WhatsApp link.
 */

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

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  // An email address or a phone / WhatsApp number, in one field.
  const contact = String(body.contact ?? "").trim();
  const message = String(body.message ?? "").trim();
  // Hidden field. Real people leave it empty; bots fill everything in.
  const company = String(body.company ?? "").trim();
  const locale = String(body.locale ?? "en").trim();

  if (company) {
    // Look successful so the bot does not go looking for another way in.
    return NextResponse.json({ ok: true });
  }

  // A name and a way to reach them. The message is optional, any length.
  const channel = parseContact(contact);
  if (!name || !channel) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  if (name.length > 200 || contact.length > 320) {
    return NextResponse.json({ error: "too_long" }, { status: 400 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const html = `
    <h2 style="font:600 18px system-ui;margin:0 0 16px">New enquiry from the OUAQT website</h2>
    <p style="font:14px system-ui;margin:0 0 6px"><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p style="font:14px system-ui;margin:0 0 6px"><strong>${channel.kind === "email" ? "Email" : "Phone / WhatsApp"}:</strong> ${escapeHtml(contact)}</p>
    ${channel.kind === "phone" && channel.whatsappUrl ? `<p style="font:14px system-ui;margin:0 0 6px"><a href="${channel.whatsappUrl}">Open in WhatsApp</a></p>` : ""}
    <p style="font:14px system-ui;margin:0 0 16px"><strong>Language:</strong> ${escapeHtml(locale)}</p>
    <p style="font:14px system-ui;margin:0 0 6px"><strong>Message:</strong></p>
    <p style="font:14px/1.6 system-ui;white-space:pre-wrap;margin:0">${escapeHtml(message || "(no message)")}</p>
  `;

  const sent = await mailOuaqt({
    subject: `OUAQT enquiry from ${name}`,
    html,
    text: `Name: ${name}\n${channel.kind === "email" ? "Email" : "Phone / WhatsApp"}: ${contact}\nLanguage: ${locale}\n\n${message || "(no message)"}`,
    ...(channel.kind === "email" ? { replyTo: channel.value } : {}),
  });

  /*
   * No Resend key: tell the browser to send through FormSubmit itself.
   * FormSubmit refuses requests from Vercel's servers (the same call works
   * from a browser or a home connection), so a server-side fallback cannot
   * deliver. Adding RESEND_API_KEY in Vercel switches delivery back to this
   * route automatically, and that is the better path: mail goes direct.
   */
  if (sent === "no_mailer") {
    return NextResponse.json({ error: "no_server_mailer" }, { status: 501 });
  }
  if (sent === "failed") {
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
