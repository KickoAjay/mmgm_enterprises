import { describe, expect, it } from "vitest";
import { checkRateLimit } from "./rate-limit";

describe("checkRateLimit", () => {
  it("allows requests up to the limit, then blocks", () => {
    const key = `test:${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit(key, { limit: 3, windowMs: 60_000 }).allowed).toBe(true);
    }
    const blocked = checkRateLimit(key, { limit: 3, windowMs: 60_000 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("tracks separate keys independently", () => {
    const keyA = `test-a:${Math.random()}`;
    const keyB = `test-b:${Math.random()}`;
    checkRateLimit(keyA, { limit: 1, windowMs: 60_000 });
    const blockedA = checkRateLimit(keyA, { limit: 1, windowMs: 60_000 });
    const allowedB = checkRateLimit(keyB, { limit: 1, windowMs: 60_000 });
    expect(blockedA.allowed).toBe(false);
    expect(allowedB.allowed).toBe(true);
  });

  it("resets once the window has passed", async () => {
    const key = `test-reset:${Math.random()}`;
    expect(checkRateLimit(key, { limit: 1, windowMs: 10 }).allowed).toBe(true);
    expect(checkRateLimit(key, { limit: 1, windowMs: 10 }).allowed).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(checkRateLimit(key, { limit: 1, windowMs: 10 }).allowed).toBe(true);
  });
});
