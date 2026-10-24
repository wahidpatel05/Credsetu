import { describe, it, expect } from "vitest";
import { phoneSchema, newLoanSchema } from "../src/validation";

describe("phone validation", () => {
  it("accepts a 10 digit phone", () => {
    expect(phoneSchema.safeParse({ phone: "9876543210" }).success).toBe(true);
  });

  it("rejects short or non-number phones", () => {
    expect(phoneSchema.safeParse({ phone: "12345" }).success).toBe(false);
    expect(phoneSchema.safeParse({ phone: "98765abcde" }).success).toBe(false);
  });
});

describe("new loan validation", () => {
  it("accepts a correct loan and turns amount text into a number", () => {
    const result = newLoanSchema.safeParse({ friendName: "Rahul", amount: "500", dueDate: "2026-12-31" });
    expect(result.success).toBe(true);
    expect(result.data?.amount).toBe(500);
  });

  it("rejects an empty friend name", () => {
    expect(newLoanSchema.safeParse({ friendName: "  ", amount: 500, dueDate: "2026-12-31" }).success).toBe(false);
  });

  it("rejects zero or negative amounts", () => {
    expect(newLoanSchema.safeParse({ friendName: "Rahul", amount: 0, dueDate: "2026-12-31" }).success).toBe(false);
    expect(newLoanSchema.safeParse({ friendName: "Rahul", amount: -5, dueDate: "2026-12-31" }).success).toBe(false);
  });

  it("rejects a badly written date", () => {
    expect(newLoanSchema.safeParse({ friendName: "Rahul", amount: 500, dueDate: "31/12/2026" }).success).toBe(false);
  });
});
