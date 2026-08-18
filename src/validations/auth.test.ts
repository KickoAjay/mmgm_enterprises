import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth";

describe("loginSchema", () => {
  it("accepts a valid email/password pair", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "anything" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "anything" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const valid = {
    fullName: "Test User",
    email: "user@example.com",
    mobile: "9876543210",
    password: "password123",
    confirmPassword: "password123",
  };

  it("accepts valid registration data", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({ ...valid, password: "short1", confirmPassword: "short1" });
    expect(result.success).toBe(false);
  });

  it("rejects when password and confirmPassword don't match", () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: "different123" });
    expect(result.success).toBe(false);
  });

  it("rejects a mobile number that doesn't start with 6-9", () => {
    const result = registerSchema.safeParse({ ...valid, mobile: "1234567890" });
    expect(result.success).toBe(false);
  });

  it("allows mobile to be omitted", () => {
    const withoutMobile: Record<string, unknown> = { ...valid };
    delete withoutMobile.mobile;
    expect(registerSchema.safeParse(withoutMobile).success).toBe(true);
  });
});
