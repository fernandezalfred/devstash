import { describe, expect, it } from "vitest";

import {
  checkCollectionQuota,
  checkItemQuota,
  checkTypeAllowed,
  FREE_COLLECTION_LIMIT,
  FREE_ITEM_LIMIT,
} from "@/lib/plan";

describe("checkItemQuota", () => {
  it("always passes for Pro users, regardless of count", () => {
    expect(checkItemQuota(true, 0).ok).toBe(true);
    expect(checkItemQuota(true, FREE_ITEM_LIMIT).ok).toBe(true);
    expect(checkItemQuota(true, FREE_ITEM_LIMIT * 10).ok).toBe(true);
  });

  it("passes for free users under the limit", () => {
    expect(checkItemQuota(false, 0).ok).toBe(true);
    expect(checkItemQuota(false, FREE_ITEM_LIMIT - 1).ok).toBe(true);
  });

  it("rejects free users at or over the limit", () => {
    const atLimit = checkItemQuota(false, FREE_ITEM_LIMIT);
    expect(atLimit.ok).toBe(false);
    if (!atLimit.ok) expect(atLimit.error).toContain(String(FREE_ITEM_LIMIT));

    expect(checkItemQuota(false, FREE_ITEM_LIMIT + 1).ok).toBe(false);
  });
});

describe("checkCollectionQuota", () => {
  it("always passes for Pro users, regardless of count", () => {
    expect(checkCollectionQuota(true, 0).ok).toBe(true);
    expect(checkCollectionQuota(true, FREE_COLLECTION_LIMIT).ok).toBe(true);
  });

  it("passes for free users under the limit", () => {
    expect(checkCollectionQuota(false, FREE_COLLECTION_LIMIT - 1).ok).toBe(true);
  });

  it("rejects free users at or over the limit", () => {
    const atLimit = checkCollectionQuota(false, FREE_COLLECTION_LIMIT);
    expect(atLimit.ok).toBe(false);
    if (!atLimit.ok) expect(atLimit.error).toContain(String(FREE_COLLECTION_LIMIT));

    expect(checkCollectionQuota(false, FREE_COLLECTION_LIMIT + 1).ok).toBe(false);
  });
});

describe("checkTypeAllowed", () => {
  it("allows Pro users to use any type", () => {
    expect(checkTypeAllowed(true, "file").ok).toBe(true);
    expect(checkTypeAllowed(true, "image").ok).toBe(true);
    expect(checkTypeAllowed(true, "snippet").ok).toBe(true);
  });

  it("rejects free users on file/image types", () => {
    expect(checkTypeAllowed(false, "file").ok).toBe(false);
    expect(checkTypeAllowed(false, "image").ok).toBe(false);
  });

  it("allows free users on non-gated types", () => {
    for (const type of ["snippet", "prompt", "command", "note", "link"]) {
      expect(checkTypeAllowed(false, type).ok).toBe(true);
    }
  });
});
