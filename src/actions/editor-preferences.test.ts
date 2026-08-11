import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateEditorPreferences } from "@/actions/editor-preferences";
import { auth } from "@/auth";
import { updateEditorPreferences as updateEditorPreferencesQuery } from "@/lib/db/users";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db/users", () => ({ updateEditorPreferences: vi.fn() }));

const mockedAuth = vi.mocked(auth);
const mockedQuery = vi.mocked(updateEditorPreferencesQuery);

const validInput = {
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  theme: "vs-dark" as const,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
  mockedQuery.mockResolvedValue(validInput);
});

describe("updateEditorPreferences", () => {
  it("rejects an unauthenticated request without touching the DB", async () => {
    mockedAuth.mockResolvedValue(null);

    const result = await updateEditorPreferences(validInput);

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to update editor preferences.",
    });
    expect(mockedQuery).not.toHaveBeenCalled();
  });

  it("rejects a fontSize outside the allowed option list", async () => {
    const result = await updateEditorPreferences({ ...validInput, fontSize: 999 });

    expect(result).toEqual({ success: false, error: "Invalid font size" });
    expect(mockedQuery).not.toHaveBeenCalled();
  });

  it("rejects a tabSize outside the allowed option list", async () => {
    const result = await updateEditorPreferences({ ...validInput, tabSize: 3 });

    expect(result).toEqual({ success: false, error: "Invalid tab size" });
    expect(mockedQuery).not.toHaveBeenCalled();
  });

  it("rejects a theme outside the allowed enum", async () => {
    const result = await updateEditorPreferences({
      ...validInput,
      theme: "not-a-theme" as never,
    });

    expect(result.success).toBe(false);
    expect(mockedQuery).not.toHaveBeenCalled();
  });

  it("persists a valid update and passes the userId through", async () => {
    const result = await updateEditorPreferences(validInput);

    expect(mockedQuery).toHaveBeenCalledWith("user-1", validInput);
    expect(result).toEqual({ success: true, data: validInput });
  });

  it("returns a generic error when the query throws", async () => {
    mockedQuery.mockRejectedValue(new Error("db down"));

    const result = await updateEditorPreferences(validInput);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});
