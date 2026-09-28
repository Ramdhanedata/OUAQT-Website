import { describe, expect, it } from "vitest";
import { receiptFrom } from "./receipt";

const reading = {
  isReceipt: true,
  amount: 18000,
  currency: "MRU",
  date: "2026-09-19",
  reference: "  TX 123   456 ",
  recipient: "+222 38 08 72 72",
};

describe("tidying what was read off a screenshot", () => {
  it("keeps a clean reading as it is", () => {
    expect(receiptFrom(reading)).toEqual({
      isReceipt: true,
      amountMru: 18000,
      date: "2026-09-19",
      reference: "TX 123 456",
      recipient: "22238087272",
    });
  });

  it("turns old ouguiyas into new ones", () => {
    expect(receiptFrom({ ...reading, amount: 180000, currency: "MRO" })?.amountMru).toBe(18000);
  });

  it("drops an amount that is not a positive number", () => {
    expect(receiptFrom({ ...reading, amount: 0 })?.amountMru).toBeNull();
    expect(receiptFrom({ ...reading, amount: Number.NaN })?.amountMru).toBeNull();
  });

  it("keeps a real day only", () => {
    expect(receiptFrom({ ...reading, date: "2026-02-31" })?.date).toBeNull();
    expect(receiptFrom({ ...reading, date: "19/09/2026" })?.date).toBeNull();
    expect(receiptFrom({ ...reading, date: "2026-09-19T14:03:00" })?.date).toBe("2026-09-19");
  });

  it("does not compare a name or a short number as a phone number", () => {
    expect(receiptFrom({ ...reading, recipient: "OUAQT" })?.recipient).toBeNull();
    expect(receiptFrom({ ...reading, recipient: "4521" })?.recipient).toBeNull();
  });

  it("keeps an empty transaction number as none", () => {
    expect(receiptFrom({ ...reading, reference: "   " })?.reference).toBeNull();
  });
});
