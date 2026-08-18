import { describe, expect, it } from "vitest";
import { getAllowedReturnTransitions } from "./status";

describe("getAllowedReturnTransitions", () => {
  it("allows APPROVED, REJECTED, or INFO_REQUESTED from REQUESTED", () => {
    expect(getAllowedReturnTransitions("REQUESTED")).toEqual([
      "APPROVED",
      "REJECTED",
      "INFO_REQUESTED",
    ]);
  });

  it("only allows RETURNED from PICKUP_SCHEDULED", () => {
    expect(getAllowedReturnTransitions("PICKUP_SCHEDULED")).toEqual(["RETURNED"]);
  });

  it("has no transitions out of a terminal status", () => {
    expect(getAllowedReturnTransitions("RETURNED")).toEqual([]);
    expect(getAllowedReturnTransitions("REJECTED")).toEqual([]);
  });

  it("returns an empty array for an unrecognized status", () => {
    expect(getAllowedReturnTransitions("NOT_A_REAL_STATUS")).toEqual([]);
  });
});
