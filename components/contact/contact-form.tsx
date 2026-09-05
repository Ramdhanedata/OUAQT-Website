"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { organization } from "@/lib/data/contact";
import { CheckCircle2 } from "lucide-react";
import { FormEvent, useState } from "react";

type FormState = {
  name: string;
  email: string;
  message: string;
};

type Errors = Partial<Record<keyof FormState, string>>;

const initialState: FormState = { name: "", email: "", message: "" };

function validate(values: FormState, dict: Dictionary): Errors {
  const errors: Errors = {};
  const f = dict.contact.form;

  if (!values.name.trim()) {
    errors.name = f.errorName;
  }

  if (!values.email.trim()) {
    errors.email = f.errorEmailEmpty;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = f.errorEmailInvalid;
  }

  if (!values.message.trim()) {
    errors.message = f.errorMessageEmpty;
  } else if (values.message.trim().length < 20) {
    errors.message = f.errorMessageShort;
  }

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
    if (status === "failed") setStatus("idle");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validate(values, dict);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, company, locale: lang }),
      });
      // Only claim success when the server actually accepted it.
      if (!res.ok) throw new Error(String(res.status));
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
        />
        {errors.name && (
          <p className="mt-2 text-xs text-red-500">{errors.name}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="email"
          className="text-sm font-medium tracking-tight text-foreground"
        >
          {f.email}
        </label>
        <input
          id="email"
          type="email"
          dir="ltr"
          autoComplete="email"
          disabled={sending}
          value={values.email}
          onChange={(event) => handleChange("email", event.target.value)}
          className={fieldClass(Boolean(errors.email))}
          placeholder={f.emailPlaceholder}
        />
        {errors.email && (
          <p className="mt-2 text-xs text-red-500">{errors.email}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="message"
          className="text-sm font-medium tracking-tight text-foreground"
        >
          {f.message}
        </label>
        <textarea
          id="message"
          rows={5}
          disabled={sending}
          value={values.message}
          onChange={(event) => handleChange("message", event.target.value)}
          className={cn(fieldClass(Boolean(errors.message)), "resize-none")}
          placeholder={f.messagePlaceholder}
        />
        {errors.message && (
          <p className="mt-2 text-xs text-red-500">{errors.message}</p>
        )}
      </div>

      {/* Honeypot: off-screen and skipped by tab order, so only bots reach it. */}
      <div aria-hidden className="pointer-events-none absolute -left-[9999px]">
        <label htmlFor="company">Company</label>
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
            className="underline underline-offset-2"
          >
            {organization.email}
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
