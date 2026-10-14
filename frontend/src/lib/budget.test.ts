import { describe, expect, it } from "vitest";
import { detectBudgetFromQuery, formatInr, parseBudgetInr } from "./budget";

describe("budget helpers", () => {
  it("formats Indian rupees", () => {
    expect(formatInr(70000)).toBe("₹70,000");
    expect(formatInr(150000)).toBe("₹1,50,000");
  });

  it("parses k, lakh, commas, and rupee signs", () => {
    expect(parseBudgetInr("80k")).toEqual({ ok: true, amount: 80000 });
    expect(parseBudgetInr("1.5 lakh")).toEqual({ ok: true, amount: 150000 });
    expect(parseBudgetInr("₹70,000")).toEqual({ ok: true, amount: 70000 });
    expect(parseBudgetInr("")).toEqual({ ok: true, amount: null });
  });

  it("rejects zero, negative, and non-numeric input", () => {
    expect(parseBudgetInr("0")).toEqual({ ok: false, message: "Budget must be greater than 0" });
    expect(parseBudgetInr("-12")).toMatchObject({ ok: false });
    expect(parseBudgetInr("abc")).toMatchObject({ ok: false });
  });

  it("detects a budget phrase inside a request", () => {
    expect(detectBudgetFromQuery("gaming laptop under 80k")).toBe(80000);
    expect(detectBudgetFromQuery("pram for a newborn")).toBeNull();
  });
});
