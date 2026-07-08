import { afterEach, describe, expect, it, vi } from "vitest";

import { getClientIp, retryAfter, retryPhrase } from "@/lib/rate-limit";

function requestWith(headers: Record<string, string>): Request {
  return new Request("https://example.com", { headers });
}

describe("getClientIp", () => {
  it("uses the first entry of x-forwarded-for", () => {
    const req = requestWith({ "x-forwarded-for": "203.0.113.7, 70.41.3.18" });
    expect(getClientIp(req)).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const req = requestWith({ "x-real-ip": "198.51.100.9" });
    expect(getClientIp(req)).toBe("198.51.100.9");
  });

  it("returns 'unknown' when no IP headers are present", () => {
    expect(getClientIp(requestWith({}))).toBe("unknown");
  });
});

describe("retryAfter", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("derives seconds and minutes from a future reset timestamp", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-07T00:00:00Z"));
    const reset = Date.now() + 90_000; // 90s in the future
    expect(retryAfter(reset)).toEqual({ seconds: 90, minutes: 2 });
  });

  it("floors to a minimum of 1 for a past or now reset", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-07T00:00:00Z"));
    expect(retryAfter(Date.now())).toEqual({ seconds: 1, minutes: 1 });
  });
});

describe("retryPhrase", () => {
  it("uses the singular for 1 minute", () => {
    expect(retryPhrase(1)).toBe("in 1 minute");
  });

  it("uses the plural for more than 1 minute", () => {
    expect(retryPhrase(15)).toBe("in 15 minutes");
  });
});
