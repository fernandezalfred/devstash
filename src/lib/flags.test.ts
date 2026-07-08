import { afterEach, describe, expect, it, vi } from "vitest";

import { isEmailVerificationEnabled } from "@/lib/flags";

describe("isEmailVerificationEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to enabled when the env var is unset", () => {
    vi.stubEnv("EMAIL_VERIFICATION_ENABLED", undefined);
    expect(isEmailVerificationEnabled()).toBe(true);
  });

  it("is disabled when set to 'false' (case/space insensitive)", () => {
    vi.stubEnv("EMAIL_VERIFICATION_ENABLED", "  FALSE ");
    expect(isEmailVerificationEnabled()).toBe(false);
  });

  it("is disabled when set to '0'", () => {
    vi.stubEnv("EMAIL_VERIFICATION_ENABLED", "0");
    expect(isEmailVerificationEnabled()).toBe(false);
  });

  it("is enabled for any other value", () => {
    vi.stubEnv("EMAIL_VERIFICATION_ENABLED", "true");
    expect(isEmailVerificationEnabled()).toBe(true);
  });
});
