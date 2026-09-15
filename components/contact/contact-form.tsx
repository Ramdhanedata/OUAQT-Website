"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { organization } from "@/lib/data/contact";
import { parseContact } from "@/lib/contact-channel";
import { CheckCircle2 } from "lucide-react";
import { FormEvent, useState } from "react";

type FormState = {
  name: string;
  /** An email address or a phone / WhatsApp number. */
  contact: string;
  /** Optional, any length. */
  message: string;
};

type Errors = Partial<Record<keyof FormState, string>>;

const initialState: FormState = { name: "", contact: "", message: "" };

/* Fields as they appear in the email OUAQT receives. */
function formSubmitFields(values: FormState, lang: Locale) {
  const channel = parseContact(values.contact);
  return {
    _subject: `OUAQT enquiry from ${values.name.trim()}`,
    // Reply in Gmail goes straight to the visitor when they left an email.
    ...(channel?.kind === "email" ? { _replyto: channel.value } : {}),
    _template: "table",
    _captcha: "false",
    Name: values.name.trim(),
    [channel?.kind === "email" ? "Email" : "Phone / WhatsApp"]: values.contact.trim(),
    ...(channel?.kind === "phone" && channel.whatsappUrl
      ? { "Open in WhatsApp": channel.whatsappUrl }
      : {}),
    Message: values.message.trim() || "(no message)",
    Language: lang,
  };
}

/*
 * Sends the enquiry to OUAQT's inbox through FormSubmit, straight from the
 * visitor's browser. FormSubmit refuses the same request when it comes from
 * Vercel's servers, so this runs client side, which is how FormSubmit is
 * meant to be used.
 *
 * Activation is tied to the page address FormSubmit sees, and the inbox was
 * activated for /en/contact. The referrer is set to that page on the current
 * host so the French and Arabic pages use the same activation.
 */
async function sendViaFormSubmit(values: FormState, lang: Locale) {
  const res = await fetch(
    `https://formsubmit.co/ajax/${encodeURIComponent(organization.email)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      referrer: `${window.location.origin}/en/contact`,
      referrerPolicy: "no-referrer-when-downgrade",
      body: JSON.stringify(formSubmitFields(values, lang)),
    }
  );
  // FormSubmit answers 200 even when it refuses; the body says which.
  const data = (await res.json().catch(() => null)) as { success?: string | boolean } | null;
  return res.ok && String(data?.success) === "true";
}

function validate(values: FormState, dict: Dictionary): Errors {
  const errors: Errors = {};
  const f = dict.contact.form;

  if (!values.name.trim()) {
    errors.name = f.errorName;
  }

  if (!values.contact.trim()) {
    errors.contact = f.errorContactEmpty;
  } else if (!parseContact(values.contact)) {
    errors.contact = f.errorContactInvalid;
  }

  // The message is optional and has no length limit.
  return errors;
}

export function ContactForm({
  dict,
  lang,
}: {
  dict: Dictionary;
  lang: Locale;
}) {
  const [values, setValues] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "failed">(
    "idle"
  );
  // Honeypot. Hidden from people, filled in by bots.
  const [company, setCompany] = useState("");
  const f = dict.contact.form;

  function handleChange(field: keyof FormState, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Clear a field's error as soon as the visitor starts fixing it.
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (status === "failed") setStatus("idle");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validate(values, dict);
    setErrors(validationErrors);
    const firstInvalid = (["name", "contact"] as const).find((key) => validationErrors[key]);
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, company, locale: lang }),
      });
      if (res.status === 501 || res.status === 502) {
        // 501: no server mailer is configured. 502: Resend is configured but
        // failed. Either way, send from the browser through FormSubmit so the
        // enquiry is not lost. Bots never get here: the server answers them
        // with a fake success before choosing a mailer.
        if (!(await sendViaFormSubmit(values, lang))) {
          throw new Error("formsubmit");
        }
      } else if (!res.ok) {
        // Only claim success when the message was actually accepted.
        throw new Error(String(res.status));
      }
      setStatus("sent");
      setValues(initialState);
    } catch {
      setStatus("failed");
    }
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-border p-8">
        <CheckCircle2 className="h-6 w-6 text-accent" />
        <h3 className="text-lg font-medium tracking-tight text-foreground">
          {f.successTitle}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {f.successBody}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => setStatus("idle")}
          className="mt-2"
        >
          {f.sendAnother}
        </Button>
      </div>
    );
  }

  const sending = status === "sending";

  const fieldClass = (hasError: boolean) =>
    cn(
      "mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent disabled:opacity-60",
      hasError ? "border-red-500" : "border-border"
    );

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm leading-relaxed text-muted-foreground">{f.hint}</p>

      <div>
        <label
          htmlFor="name"
          className="text-sm font-medium tracking-tight text-foreground"
        >
          {f.name}
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          disabled={sending}
          value={values.name}
          onChange={(event) => handleChange("name", event.target.value)}
          className={fieldClass(Boolean(errors.name))}
          placeholder={f.namePlaceholder}
          aria-invalid={Boolean(errors.name)}
        />
        {errors.name && (
          <p className="mt-2 text-xs text-red-500">{errors.name}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="contact"
          className="text-sm font-medium tracking-tight text-foreground"
        >
          {f.contact}
        </label>
        <input
          id="contact"
          type="text"
          dir="ltr"
          autoComplete="email"
          disabled={sending}
          value={values.contact}
          onChange={(event) => handleChange("contact", event.target.value)}
          className={cn(fieldClass(Boolean(errors.contact)), "rtl:text-right")}
          placeholder={f.contactPlaceholder}
          aria-invalid={Boolean(errors.contact)}
        />
        {errors.contact && (
          <p className="mt-2 text-xs text-red-500">{errors.contact}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="message"
          className="text-sm font-medium tracking-tight text-foreground"
        >
          {f.message}{" "}
          <span className="font-normal text-muted-foreground">({f.optional})</span>
        </label>
        <textarea
          id="message"
          rows={5}
          disabled={sending}
          value={values.message}
          onChange={(event) => handleChange("message", event.target.value)}
          className={cn(fieldClass(false), "min-h-[8rem] resize-y")}
          placeholder={f.messagePlaceholder}
        />
      </div>

      {/* Honeypot: invisible and skipped by tab order, so only bots reach it.
          Clipped to a pixel rather than pushed off-screen: -9999px to the left
          made the Arabic page 10,000px wide, because right-to-left pages can
          scroll leftwards. */}
      <div aria-hidden className="pointer-events-none sr-only">
        <label htmlFor="company">{dict.common.company}</label>
        <input
          id="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
        />
      </div>

      {status === "failed" && (
        <p className="text-sm leading-relaxed text-red-500" role="alert">
          {f.errorSend}{" "}
          <a
            href={`mailto:${organization.email}`}
            dir="ltr"
            className="underline underline-offset-2"
          >
            {organization.email}
          </a>
          {" · "}
          <a
            href={organization.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            {dict.common.whatsapp}
          </a>
        </p>
      )}

      <Button
        type="submit"
        variant="accent"
        disabled={sending}
        className="w-full sm:w-auto"
      >
        {sending ? f.sending : f.submit}
      </Button>
    </form>
  );
}
