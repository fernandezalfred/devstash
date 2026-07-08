import { safeCallbackUrl } from "@/lib/safe-callback-url";

describe("safeCallbackUrl", () => {
  it("returns same-origin relative paths unchanged", () => {
    expect(safeCallbackUrl("/items/snippets")).toBe("/items/snippets");
    expect(safeCallbackUrl("/profile?tab=account")).toBe("/profile?tab=account");
  });

  it("falls back to /dashboard for absolute URLs", () => {
    expect(safeCallbackUrl("https://evil.com")).toBe("/dashboard");
    expect(safeCallbackUrl("http://evil.com/path")).toBe("/dashboard");
  });

  it("rejects protocol-relative URLs", () => {
    expect(safeCallbackUrl("//evil.com")).toBe("/dashboard");
  });

  it("falls back to /dashboard for empty, null, or undefined input", () => {
    expect(safeCallbackUrl("")).toBe("/dashboard");
    expect(safeCallbackUrl(null)).toBe("/dashboard");
    expect(safeCallbackUrl(undefined)).toBe("/dashboard");
  });
});
