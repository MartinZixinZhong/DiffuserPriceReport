import { describe, expect, it } from "vitest";
import { compactDate, customerInitials, generateQuoteNumber } from "./quoteNumber";

describe("quote number helpers", () => {
  it("uses customer pinyin initials and date", () => {
    expect(generateQuoteNumber("邯郸上谷菲尔酒店", "2026-06-29")).toBe(
      "GM-HDSGFEJD-20260629"
    );
  });

  it("keeps latin initials for latin customer names", () => {
    expect(generateQuoteNumber("ABC Hotel", "2026-06-29")).toBe("GM-ABCH-20260629");
  });

  it("falls back to KH when customer name has no usable characters", () => {
    expect(customerInitials("   ")).toBe("KH");
  });

  it("compacts iso date strings", () => {
    expect(compactDate("2026-06-29")).toBe("20260629");
  });
});
