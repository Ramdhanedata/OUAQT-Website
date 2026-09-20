"use client";

import { useState } from "react";

/*
 * Making a renewal code for a shop on the phone.
 *
 * The owner reads the code his software shows; we read back ten characters
 * that carry the new end date and prove they came from us. He types them with
 * the shutter down and no signal, and his till works again.
 */
/** A device code is ten characters, so anything shorter is a typo. */
const SHORTEST_DEVICE_CODE = 8; // not-a-rule: a format, not a limit anyone sets

export function RenewalForm({
  businesses,
}: {
  businesses: { id: string; name: string }[];
}) {
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? "");
  const [deviceCode, setDeviceCode] = useState("");
  const [endsAt, setEndsAt] = useState(defaultEnd());
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function make() {
    setBusy(true);
    setError(null);
    setCode(null);

    const response = await fetch("/api/admin/renewal", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ businessId, deviceCode, endsAt }),
    });
    const body = await response.json().catch(() => null);
    setBusy(false);

    if (!response.ok) return setError(body?.error ?? "Pas généré.");
    setCode(body.code);
  }

  return (
    <div className="mt-6 max-w-md space-y-5">
      <label className="block">
        <span className="text-base text-muted-foreground">Le commerce</span>
        <select
          value={businessId}
          onChange={(event) => setBusinessId(event.target.value)}
          className="mt-1 min-h-[48px] w-full rounded-lg border border-border bg-background px-3 text-base text-foreground"
        >
          {businesses.map((business) => (
            <option key={business.id} value={business.id}>
              {business.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-base text-muted-foreground">
          Le code affiché par son logiciel
        </span>
        <input
          type="text"
          dir="ltr"
          value={deviceCode}
          onChange={(event) => setDeviceCode(event.target.value)}
          placeholder="XXXXX-XXXXX"
          className="mt-1 min-h-[48px] w-full rounded-lg border border-border bg-background px-4 font-mono text-base text-foreground outline-none focus:border-foreground"
        />
      </label>

      <label className="block">
        <span className="text-base text-muted-foreground">Nouvelle date de fin</span>
        <input
          type="date"
          value={endsAt}
          onChange={(event) => setEndsAt(event.target.value)}
          className="mt-1 min-h-[48px] w-full rounded-lg border border-border bg-background px-4 text-base text-foreground"
        />
      </label>

      <button
        type="button"
        disabled={busy || deviceCode.trim().length < SHORTEST_DEVICE_CODE}
        onClick={() => void make()}
        className="min-h-[48px] rounded-lg bg-accent px-5 text-base font-medium text-accent-foreground disabled:opacity-40"
      >
        Générer le code
      </button>

      {error ? <p className="text-base text-destructive">{error}</p> : null}

      {code ? (
        <div className="rounded-xl border border-border p-4">
          <p className="text-base text-muted-foreground">À lire au propriétaire</p>
          <p
            dir="ltr"
            className="mt-1 font-mono text-2xl font-semibold tracking-[0.2em] text-foreground"
          >
            {code}
          </p>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(code);
              setCopied(true);
            }}
            className="mt-3 min-h-[48px] rounded-lg border border-border px-5 text-base text-foreground"
          >
            {copied ? "Copié" : "Copier"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** A year from today, which is what a renewal usually is. */
function defaultEnd(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear() + 1, now.getUTCMonth(), now.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}
