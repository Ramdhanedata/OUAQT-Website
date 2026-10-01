import { describe, expect, it, vi } from "vitest";

/* The module is server-only; the rule it holds is plain and tested here without a server. */
vi.mock("server-only", () => ({}));

const { configurationFrom } = await import("./create-shop");

/*
 * The trade he chose is the trade he gets.
 *
 * An owner described a hotel, used "Expliquer avec mes mots" on one of its
 * questions, then changed his mind and chose a pharmacy. What the AI set was
 * hotel features, and laying them over the pharmacy made a configuration the
 * schema refuses. The shop was then left on the hotel without a word, and
 * the pharmacy he downloaded opened as a hotel.
 */
function input(pack: "pharmacy" | "hotel", patched?: { common?: unknown; features?: unknown }) {
  return {
    pack,
    language: "fr" as const,
    business: { nameLatin: "Test" },
    answers: {},
    patched,
    staff: [],
    products: [],
  };
}

describe("the configuration a shop is made from", () => {
  it("is the chosen trade even when the AI's answer was for another trade", () => {
    const hotelFeatures = { hotel: { rooms: 12, advances: true, extras: false, guestDocument: true } };
    const made = configurationFrom(input("pharmacy", { features: hotelFeatures }));
    expect(made.success).toBe(true);
    expect(made.data?.pack).toBe("pharmacy");
    expect(Object.keys(made.data?.features ?? {})).toEqual(["pharmacy"]);
  });

  it("keeps what the AI set when it fits the trade chosen", () => {
    const made = configurationFrom(
      input("hotel", { features: { hotel: { rooms: 42, advances: true, extras: true, guestDocument: false } } })
    );
    expect(made.success).toBe(true);
    expect(made.data?.features.hotel?.rooms).toBe(42);
  });

  it("is the chosen trade with nothing from the AI at all", () => {
    for (const pack of ["pharmacy", "hotel"] as const) {
      const made = configurationFrom(input(pack));
      expect(made.success).toBe(true);
      expect(made.data?.pack).toBe(pack);
    }
  });
});
