import { describe, expect, it } from "vitest";
import { loginAddress, PHONE_DOMAIN } from "@/builder/ui/login-domain";
import { passwordProblem, shownLogin, staffLogin } from "./staff-rules";

describe("a staff login", () => {
  it("keeps a plain name's own address, so the first accounts still sign in", async () => {
    expect(await staffLogin(" OuaqtAdmin1 ")).toEqual({ email: `ouaqtadmin1@${PHONE_DOMAIN}`, shown: "OuaqtAdmin1" });
  });

  it("takes an email as it is", async () => {
    expect((await staffLogin("Someone@Example.com"))?.email).toBe("someone@example.com");
  });

  it("takes any name at all: spaces, capitals, underscores, Arabic, one letter", async () => {
    for (const name of ["Adel_Ramdhane 1", "عادل رمضان", "A", "Adel Ramdhane!"]) {
      const login = await staffLogin(name);
      expect(login?.email).toMatch(new RegExp(`^staff-[0-9a-f]{24}@${PHONE_DOMAIN.replace(/\./g, "\\.")}$`));
      expect(login?.shown).toBe(name);
    }
  });

  it("gives the same address however the name is typed at sign-in", async () => {
    const made = await staffLogin("Adel_Ramdhane 1");
    expect(await loginAddress("  adel_ramdhane   1 ")).toBe(made?.email);
    expect(await loginAddress("ADEL_RAMDHANE 1")).toBe(made?.email);
    expect(await loginAddress("Adel_Ramdhane 2")).not.toBe(made?.email);
  });

  it("never lands on an owner's address, which is his phone's digits", async () => {
    expect((await staffLogin("22265456765"))?.email).toMatch(/^staff-/);
  });

  it("refuses nothing but an empty name or a paragraph", async () => {
    expect(await staffLogin("   ")).toBeNull();
    expect(await staffLogin("x".repeat(101))).toBeNull();
  });

  it("is shown as it was typed, or as its address's name for older accounts", () => {
    expect(shownLogin(`staff-abc@${PHONE_DOMAIN}`, "Adel_Ramdhane 1")).toBe("Adel_Ramdhane 1");
    expect(shownLogin(`ouaqtadmin1@${PHONE_DOMAIN}`)).toBe("ouaqtadmin1");
    expect(shownLogin("someone@example.com")).toBe("someone@example.com");
  });
});

describe("a staff password", () => {
  it("needs twelve characters, not only digits, not one repeated", () => {
    expect(passwordProblem("Short@1")).toBe("too_short");
    expect(passwordProblem("123456789012")).toBe("only_digits");
    expect(passwordProblem("aaaaaaaaaaaa")).toBe("one_character");
    expect(passwordProblem("a-long-enough-one")).toBeNull();
  });
});
