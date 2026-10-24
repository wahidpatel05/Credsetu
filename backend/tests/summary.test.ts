import { describe, it, expect } from "vitest";
import { calculateSummary, isOverdue, Loan } from "../src/summary";

// Small helper to make a fake loan for tests.
function makeLoan(amount: string, dueDate: string, isRepaid: boolean): Loan {
  return {
    id: 1,
    friend_name: "Rahul",
    amount,
    due_date: dueDate,
    is_repaid: isRepaid,
    repaid_at: null,
    receipt_url: null,
    created_at: "2026-01-01",
  };
}

const today = "2026-10-23";

describe("isOverdue", () => {
  it("is overdue when due date has passed and not repaid", () => {
    expect(isOverdue(makeLoan("100", "2026-10-01", false), today)).toBe(true);
  });

  it("is NOT overdue when it was repaid", () => {
    expect(isOverdue(makeLoan("100", "2026-10-01", true), today)).toBe(false);
  });

  it("is NOT overdue on the due date itself", () => {
    expect(isOverdue(makeLoan("100", today, false), today)).toBe(false);
  });
});

describe("calculateSummary", () => {
  it("adds up lent, repaid and overdue amounts", () => {
    const loans = [
      makeLoan("1000", "2026-12-01", false), // pending, not overdue
      makeLoan("500", "2026-09-01", true), // repaid
      makeLoan("250.50", "2026-10-01", false), // overdue
    ];

    expect(calculateSummary(loans, today)).toEqual({
      totalLent: 1750.5,
      totalRepaid: 500,
      pending: 1250.5,
      overdueAmount: 250.5,
    });
  });

  it("returns zeros when there are no loans", () => {
    expect(calculateSummary([], today)).toEqual({
      totalLent: 0,
      totalRepaid: 0,
      pending: 0,
      overdueAmount: 0,
    });
  });
});
