import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getBuilderCopy } from "@/builder/copy";
import { MyDevices } from "./account";

/*
 * The owner's own devices: two phones opened the same morning used to read
 * the same ("Deuxième appareil · Vu le 05/11/2026"). Each now says what it
 * is, when it was added to the minute, and the version it runs.
 */

const text = (element: ReturnType<typeof createElement>) =>
  renderToStaticMarkup(element).replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/\s+/g, " ");

const phone = (deviceId: string, firstSeen: string, appVersion: string | null) => ({
  deviceId,
  name: null,
  role: "secondary" as const,
  platform: "phone" as const,
  firstSeen,
  lastSeen: "2026-11-17T09:00:00.000Z",
  appVersion,
});

describe("Mes appareils", () => {
  it("tells two phones added the same day apart by the time they were added", () => {
    const shown = text(
      createElement(MyDevices, {
        copy: getBuilderCopy("fr"),
        lang: "fr",
        devices: [phone("a", "2026-11-05T03:06:59.000Z", "0.1.102-phone"), phone("b", "2026-11-05T03:07:40.000Z", null)],
      })
    );
    expect(shown.match(/Téléphone/g)).toHaveLength(2);
    expect(shown).toMatch(/Ajouté le 05\/11\/2026 03:06/);
    expect(shown).toMatch(/Ajouté le 05\/11\/2026 03:07/);
    expect(shown).toContain("version 0.1.102");
    expect(shown).not.toContain("-phone");
  });

  it("names a computer by its system, in Arabic too", () => {
    const shown = text(
      createElement(MyDevices, {
        copy: getBuilderCopy("ar"),
        lang: "ar",
        devices: [{ ...phone("c", "2026-11-05T03:06:59.000Z", "0.1.102"), platform: "windows" as const, role: "main" as const }],
      })
    );
    expect(shown).toContain("حاسوب ويندوز");
    expect(shown).toContain("الإصدار 0.1.102");
  });

  it("keeps the old words for a device of unknown kind", () => {
    const shown = text(
      createElement(MyDevices, {
        copy: getBuilderCopy("fr"),
        lang: "fr",
        devices: [{ ...phone("d", "2026-11-05T03:06:59.000Z", null), platform: null, role: "main" as const }],
      })
    );
    expect(shown).toContain("Appareil principal");
  });
});
