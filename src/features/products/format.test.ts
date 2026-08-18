import { describe, expect, it } from "vitest";
import { discountPercent, formatINR } from "./format";

describe("formatINR", () => {
  it("formats a whole rupee amount with the ₹ symbol and no decimals", () => {
    expect(formatINR(1999)).toBe("₹1,999");
  });

  it("uses Indian digit grouping for large amounts", () => {
    expect(formatINR(1234567)).toBe("₹12,34,567");
  });

  it("formats zero", () => {
    expect(formatINR(0)).toBe("₹0");
  });
});

describe("discountPercent", () => {
  it("computes the percentage off", () => {
    expect(discountPercent(1000, 750)).toBe(25);
  });

  it("rounds to the nearest whole percent", () => {
    expect(discountPercent(999, 899)).toBe(10);
  });

  it("returns 0 when there's no discount", () => {
    expect(discountPercent(1000, 1000)).toBe(0);
  });

  it("returns 0 rather than dividing by zero when original price is 0", () => {
    expect(discountPercent(0, 0)).toBe(0);
  });
});
