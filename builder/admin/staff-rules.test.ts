import { describe, expect, it } from "vitest";
import { PHONE_DOMAIN } from "@/builder/ui/login-domain";
import { passwordProblem, shownLogin, staffLogin } from "./staff-rules";

describe("a staff login", () => {
  it("takes a short name and turns it into an address on our domain", () => {
    expect(staffLogin(" OuaqtAdmin1 ")).toEqual({ email: `ouaqtadmin1@${PHONE_DOMAIN}`, shown: "ouaqtadmin1" });
  });

  it("takes an email as it is", () => {
    expect(staffLogin("Someone@Example.com")?.email).toBe("someone@example.com");
  });

  it("refuses a name that could be an owner's phone, and anything malformed", () => {
    expect(staffLogin("22265456765")).toBeNull();
    expect(staffLogin("ouaqt.mrt.gmail")).not.toBeNull();
    expect(staffLogin("a b")).toBeNull();
    expect(staffLogin("x@")).toBeNull();
  });

  it("is shown back as the name it was made from", () => {
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
