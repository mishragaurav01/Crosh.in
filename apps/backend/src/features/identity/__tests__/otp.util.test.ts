import { describe, it, expect } from "bun:test";
import { generateOtp, hashOtp } from "../utils/otp.util.js";

describe("generateOtp", () => {
  it("returns a 6-digit numeric string", () => {
    const otp = generateOtp();
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  it("generates values in range 100000-999999", () => {
    for (let i = 0; i < 100; i++) {
      const otp = generateOtp();
      const num = parseInt(otp, 10);
      expect(num).toBeGreaterThanOrEqual(100000);
      expect(num).toBeLessThanOrEqual(999999);
    }
  });
});

describe("hashOtp", () => {
  it("returns a 64-character hex string", async () => {
    const hash = await hashOtp("123456");
    expect(hash).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
  });

  it("is deterministic", async () => {
    const hash1 = await hashOtp("123456");
    const hash2 = await hashOtp("123456");
    expect(hash1).toBe(hash2);
  });

  it("produces different hashes for different inputs", async () => {
    const hash1 = await hashOtp("123456");
    const hash2 = await hashOtp("654321");
    expect(hash1).not.toBe(hash2);
  });
});
