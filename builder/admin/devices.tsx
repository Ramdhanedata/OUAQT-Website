"use client";

import { useState } from "react";
import { fill } from "@/lib/utils";
import { wordFor, type AdminCopy } from "./copy";

export type DeviceWords = { t: AdminCopy["devices"]; roles: Record<string, string>; locale: string };

/*
 * The computers a shop has activated, and the button that frees one.
 *
 * Staff reach this when an owner has used up his own releases, so the reason
 * is asked for and kept: a release is somebody being let past a rule.
 */

export type DeviceRow = {
  businessId: string;
  businessName: string;
  deviceId: string;
  deviceCode: string;
  name: string | null;
  platform: string | null;
  role: string;
  status: string;
  lastSeen: string;
};

export function Devices({ rows, words }: { rows: DeviceRow[]; words: DeviceWords }) {
  const [freed, setFreed] = useState<Record<string, boolean>>({});

  if (rows.length === 0) {
    return (
      <p className="mt-3 text-base text-muted-foreground">
        {words.t.none}
      </p>
    );
  }

  return (
    <ul className="mt-6 divide-y divide-border">
      {rows.map((row) => (
        <li key={row.deviceId} className="py-4">
          <Device
            words={words}
            row={row}
            freed={Boolean(freed[row.deviceId])}
            onFreed={() => setFreed((all) => ({ ...all, [row.deviceId]: true }))}
          />
        </li>
      ))}
    </ul>
  );
}

function Device({
  words,
  row,
  freed,
  onFreed,
}: {
  words: DeviceWords;
  row: DeviceRow;
  freed: boolean;
  onFreed: () => void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function release() {
    if (reason.trim() === "") return setError(words.t.reasonNeeded);
    setBusy(true);
    setError(null);

    const response = await fetch("/api/admin/device", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        businessId: row.businessId,
        deviceId: row.deviceId,
        reason: reason.trim(),
      }),
    });
    setBusy(false);
    if (!response.ok) return setError(words.t.notFreed);
    onFreed();
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-base text-foreground">
          {row.businessName}
          <span className="text-muted-foreground">
            {" "}
            · {row.name ?? words.t.unnamed} · {row.platform ?? "?"} · {wordFor(words.roles, row.role)}
          </span>
        </span>
        <span className="text-base text-muted-foreground">
          <bdi dir="ltr">{row.deviceCode}</bdi>
        </span>
      </div>

      <p className="text-base text-muted-foreground">
        {freed || row.status !== "active"
          ? words.t.freed
          : fill(words.t.seen, { date: new Date(row.lastSeen).toLocaleDateString(words.locale) })}
      </p>

      {!freed && row.status === "active" ? (
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={words.t.reason}
            className="min-h-[48px] flex-1 rounded-lg border border-border bg-background px-4 text-base text-foreground outline-none focus:border-foreground"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void release()}
            className="min-h-[48px] rounded-lg border border-border px-5 text-base text-foreground"
          >
            {words.t.release}
          </button>
        </div>
      ) : null}

      {error ? <p className="text-base text-destructive">{error}</p> : null}
    </div>
  );
}
