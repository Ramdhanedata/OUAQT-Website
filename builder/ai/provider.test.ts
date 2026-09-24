import { describe, expect, it } from "vitest";
import { defaultConfiguration } from "@/app-ui/config";
import { shareable } from "./provider";

/*
 * The brief is blunt about this: the owner's product list, phone number and
 * logo never go to the AI. This is the test that keeps it true when someone
 * adds a field to the configuration in a hurry.
 */
describe("what the model is allowed to see", () => {
  const configuration = {
    ...defaultConfiguration("pharmacy", "fr"),
    business: {
      nameLatin: "Pharmacie Test",
      nameArabic: "صيدلية",
      phone: "22200000",
      address: "Rue de Test",
      logo: "data:image/png;base64,AAAA",
      logoMono: "data:image/png;base64,BBBB",
    },
  };

  const sent = JSON.stringify(shareable(configuration));

  it("carries the switches", () => {
    expect(sent).toContain("pharmacy");
    expect(sent).toContain("cashClose");
  });

  it("carries nothing that says whose shop it is", () => {
    for (const secret of [
      "Pharmacie Test",
      "صيدلية",
      "22200000",
      "Rue de Test",
      "base64",
    ]) {
      expect(sent).not.toContain(secret);
    }
  });

  it("has no business key at all, however the shape changes", () => {
    expect(Object.keys(shareable(configuration))).not.toContain("business");
  });
});
