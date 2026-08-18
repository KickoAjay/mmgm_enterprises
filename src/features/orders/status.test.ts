import { describe, expect, it } from "vitest";
import { getAllowedNextStatuses, isOffTimelineStatus, TIMELINE_STATUSES } from "./status";

describe("getAllowedNextStatuses", () => {
  it("allows PROCESSING or CANCELLED from ORDER_CONFIRMED", () => {
    expect(getAllowedNextStatuses("ORDER_CONFIRMED")).toEqual(["PROCESSING", "CANCELLED"]);
  });

  it("only allows DELIVERED from OUT_FOR_DELIVERY", () => {
    expect(getAllowedNextStatuses("OUT_FOR_DELIVERY")).toEqual(["DELIVERED"]);
  });

  it("has no admin-driven transitions out of a terminal status", () => {
    expect(getAllowedNextStatuses("DELIVERED")).toEqual([]);
    expect(getAllowedNextStatuses("CANCELLED")).toEqual([]);
  });

  it("never exposes RETURN_*/REFUND_*/EXCHANGE_REQUESTED as an admin-picked transition", () => {
    const offLimits = ["RETURN_REQUESTED", "RETURN_APPROVED", "RETURN_PICKUP", "RETURNED", "REFUND_INITIATED", "REFUND_COMPLETED", "EXCHANGE_REQUESTED"];
    for (const status of TIMELINE_STATUSES.concat(["CANCELLED"])) {
      const next = getAllowedNextStatuses(status);
      for (const forbidden of offLimits) {
        expect(next).not.toContain(forbidden);
      }
    }
  });

  it("returns an empty array for an unrecognized status", () => {
    expect(getAllowedNextStatuses("NOT_A_REAL_STATUS")).toEqual([]);
  });
});

describe("isOffTimelineStatus", () => {
  it("treats every TIMELINE_STATUSES entry as on-timeline", () => {
    for (const status of TIMELINE_STATUSES) {
      expect(isOffTimelineStatus(status)).toBe(false);
    }
  });

  it("treats CANCELLED and return/refund statuses as off-timeline", () => {
    expect(isOffTimelineStatus("CANCELLED")).toBe(true);
    expect(isOffTimelineStatus("RETURN_REQUESTED")).toBe(true);
  });
});
