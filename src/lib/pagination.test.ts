import { describe, expect, it } from "vitest";

import { parsePageParam, resolvePage } from "@/lib/pagination";

describe("parsePageParam", () => {
  it("defaults to 1 when the value is missing", () => {
    expect(parsePageParam(undefined)).toBe(1);
  });

  it("parses a valid numeric string", () => {
    expect(parsePageParam("3")).toBe(3);
  });

  it("takes the first entry when given an array", () => {
    expect(parsePageParam(["4", "5"])).toBe(4);
  });

  it("falls back to 1 for non-numeric input", () => {
    expect(parsePageParam("abc")).toBe(1);
  });

  it("falls back to 1 for zero or negative input", () => {
    expect(parsePageParam("0")).toBe(1);
    expect(parsePageParam("-2")).toBe(1);
  });

  it("falls back to 1 for a non-integer input", () => {
    expect(parsePageParam("1.5")).toBe(1);
  });
});

describe("resolvePage", () => {
  it("clamps to page 1 when there are no rows", () => {
    expect(resolvePage(0, 1, 21)).toEqual({ currentPage: 1, totalPages: 1 });
    expect(resolvePage(0, 5, 21)).toEqual({ currentPage: 1, totalPages: 1 });
  });

  it("computes totalPages from the row count and page size", () => {
    expect(resolvePage(42, 1, 21)).toEqual({ currentPage: 1, totalPages: 2 });
    expect(resolvePage(43, 1, 21)).toEqual({ currentPage: 1, totalPages: 3 });
  });

  it("clamps a requested page beyond the last page down to the last page", () => {
    expect(resolvePage(42, 99, 21)).toEqual({ currentPage: 2, totalPages: 2 });
  });

  it("clamps a requested page below 1 up to page 1", () => {
    expect(resolvePage(42, 0, 21)).toEqual({ currentPage: 1, totalPages: 2 });
    expect(resolvePage(42, -3, 21)).toEqual({ currentPage: 1, totalPages: 2 });
  });

  it("passes a valid requested page through unchanged", () => {
    expect(resolvePage(100, 3, 21)).toEqual({ currentPage: 3, totalPages: 5 });
  });
});
