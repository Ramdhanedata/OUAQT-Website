"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";
import { FormEvent, useState } from "react";

type FormState = {
  name: string;
  email: string;
  message: string;
};

type Errors = Partial<Record<keyof FormState, string>>;

const initialState: FormState = { name: "", email: "", message: "" };

function validate(values: FormState): Errors {
  const errors: Errors = {};

  if (!values.name.trim()) {
    errors.name = "Please enter your name.";
  }

  if (!values.email.trim()) {
    errors.email = "Please enter your email.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!values.message.trim()) {
    errors.message = "Tell me a bit about your business.";
  } else if (values.message.trim().length < 20) {
    errors.message = "A few more details would help (20+ characters).";
  }

  return errors;
}

export function ContactForm() {
  const [values, setValues] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);

  function handleChange(field: keyof FormState, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validate(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      // TODO(customize): wire this up to a real endpoint (e.g. an API route,
      // Resend, or a form service) once backend logic is ready.
      setSubmitted(true);
      setValues(initialState);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-border p-8">
        <CheckCircle2 className="h-6 w-6 text-accent" />
        <h3 className="text-lg font-medium tracking-tight text-foreground">
          Message received.
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Thanks for reaching out — I usually reply within one business day.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => setSubmitted(false)}
          className="mt-2"
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="name"
          className="text-sm font-medium tracking-tight text-foreground"
        >
          Name
        </label>
        <input
          id="name"
          type="text"
          value={values.name}
          onChange={(event) => handleChange("name", event.target.value)}
          className={cn(
            "mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent",
            errors.name ? "border-red-500" : "border-border"
          )}
          placeholder="Jane Doe"
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
          Email
        </label>
        <input
          id="email"
          type="email"
          value={values.email}
          onChange={(event) => handleChange("email", event.target.value)}
          className={cn(
            "mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent",
            errors.email ? "border-red-500" : "border-border"
          )}
          placeholder="jane@company.com"
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
          Message
        </label>
        <textarea
          id="message"
          rows={5}
          value={values.message}
          onChange={(event) => handleChange("message", event.target.value)}
          className={cn(
            "mt-2 w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent",
            errors.message ? "border-red-500" : "border-border"
          )}
          placeholder="What does your business run on today — paper, spreadsheets, WhatsApp? Where does it slow you down?"
        />
        {errors.message && (
          <p className="mt-2 text-xs text-red-500">{errors.message}</p>
        )}
      </div>

      <Button type="submit" variant="accent" className="w-full sm:w-auto">
        Send message
      </Button>
    </form>
  );
}
