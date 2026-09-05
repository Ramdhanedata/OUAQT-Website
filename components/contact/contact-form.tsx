"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n";
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

export function ContactForm({ dict }: { dict: Dictionary }) {
  const [values, setValues] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const f = dict.contact.form;

  function handleChange(field: keyof FormState, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validate(values, dict);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      // TODO(adel): wire this to a real endpoint (an API route, Resend, or a
      // form service) once backend logic is ready.
      setSubmitted(true);
      setValues(initialState);
    }
  }

  if (submitted) {
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
          onClick={() => setSubmitted(false)}
          className="mt-2"
        >
          {f.sendAnother}
        </Button>
      </div>
    );
  }

  const fieldClass = (hasError: boolean) =>
    cn(
      "mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent",
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
          value={values.message}
          onChange={(event) => handleChange("message", event.target.value)}
          className={cn(fieldClass(Boolean(errors.message)), "resize-none")}
          placeholder={f.messagePlaceholder}
        />
        {errors.message && (
          <p className="mt-2 text-xs text-red-500">{errors.message}</p>
        )}
      </div>

      <Button type="submit" variant="accent" className="w-full sm:w-auto">
        {f.submit}
      </Button>
    </form>
  );
}
