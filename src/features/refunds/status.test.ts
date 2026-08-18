import { describe, expect, it } from "vitest";
import { getNextRefundStatus } from "./status";

describe("getNextRefundStatus", () => {
  it("advances one stage at a time along the linear workflow", () => {
    expect(getNextRefundStatus("REQUESTED")).toBe("APPROVED");
    expect(getNextRefundStatus("APPROVED")).toBe("INITIATED");
    expect(getNextRefundStatus("INITIATED")).toBe("PROCESSING");
    expect(getNextRefundStatus("PROCESSING")).toBe("COMPLETED");
  });

  it("returns null once COMPLETED (nothing further to advance to)", () => {
    expect(getNextRefundStatus("COMPLETED")).toBeNull();
  });

  it("returns null for an unrecognized status", () => {
    expect(getNextRefundStatus("NOT_A_REAL_STATUS")).toBeNull();
  });
});
