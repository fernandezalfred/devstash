import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createItem,
  deleteItem,
  toggleItemFavorite,
  toggleItemPin,
  updateItem,
} from "@/actions/items";
import { auth } from "@/auth";
import {
  createItem as createItemQuery,
  deleteItem as deleteItemQuery,
  toggleItemFavorite as toggleItemFavoriteQuery,
  toggleItemPin as toggleItemPinQuery,
  updateItem as updateItemQuery,
} from "@/lib/db/items";
import { getPlanContext } from "@/lib/plan";
import { deleteFromR2 } from "@/lib/r2";

// Mock the auth + DB + R2 boundaries so the action's own logic (auth gate, Zod
// validation, empty-string normalization) is what's under test — no real
// session, database, or bucket. @/lib/plan keeps its real (pure) gate
// functions but mocks the DB-touching getPlanContext.
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db/items", () => ({
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
  createItem: vi.fn(),
  toggleItemFavorite: vi.fn(),
  toggleItemPin: vi.fn(),
}));
vi.mock("@/lib/plan", async () => {
  const actual = await vi.importActual<typeof import("@/lib/plan")>("@/lib/plan");
  return { ...actual, getPlanContext: vi.fn() };
});
vi.mock("@/lib/r2", () => ({ deleteFromR2: vi.fn() }));

const mockedAuth = vi.mocked(auth);
const mockedQuery = vi.mocked(updateItemQuery);
const mockedDeleteQuery = vi.mocked(deleteItemQuery);
const mockedCreateQuery = vi.mocked(createItemQuery);
const mockedToggleFavoriteQuery = vi.mocked(toggleItemFavoriteQuery);
const mockedTogglePinQuery = vi.mocked(toggleItemPinQuery);
const mockedDeleteFromR2 = vi.mocked(deleteFromR2);
const mockedGetPlanContext = vi.mocked(getPlanContext);

// A minimal ItemDetail the query can echo back on success.
const fakeItem = {
  id: "item-1",
  title: "After",
  description: null,
  content: null,
  url: null,
  fileName: null,
  fileSize: null,
  language: null,
  contentType: "TEXT" as const,
  isPinned: false,
  isFavorite: false,
  type: { name: "Snippet", icon: "Code", color: "#3b82f6", slug: "snippets" },
  tags: [],
  collections: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

const validInput = {
  title: "A title",
  description: "desc",
  content: "body",
  language: "ts",
  url: null,
  tags: ["a", "b"],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
  mockedQuery.mockResolvedValue(fakeItem);
  mockedDeleteQuery.mockResolvedValue({ deleted: true, fileKey: null });
  mockedCreateQuery.mockResolvedValue(fakeItem);
  mockedToggleFavoriteQuery.mockResolvedValue(true);
  mockedTogglePinQuery.mockResolvedValue(true);
  mockedGetPlanContext.mockResolvedValue({
    isPro: false,
    itemCount: 0,
    collectionCount: 0,
  });
});

const validCreate = {
  type: "snippet" as const,
  title: "New snippet",
  content: "code",
  language: "ts",
  tags: ["x"],
};

describe("updateItem action — auth", () => {
  it("rejects when there is no session", async () => {
    mockedAuth.mockResolvedValue(null as never);
    const result = await updateItem("item-1", validInput);
    expect(result).toEqual({
      success: false,
      error: "You must be signed in to edit items.",
    });
    expect(mockedQuery).not.toHaveBeenCalled();
  });
});

describe("updateItem action — validation", () => {
  it("rejects an empty/whitespace title", async () => {
    const result = await updateItem("item-1", { ...validInput, title: "   " });
    expect(result).toEqual({ success: false, error: "Title is required" });
    expect(mockedQuery).not.toHaveBeenCalled();
  });

  it("rejects an invalid URL", async () => {
    const result = await updateItem("item-1", {
      ...validInput,
      url: "not-a-url",
    });
    expect(result).toEqual({ success: false, error: "Enter a valid URL" });
    expect(mockedQuery).not.toHaveBeenCalled();
  });

  it("accepts a valid URL", async () => {
    const result = await updateItem("item-1", {
      ...validInput,
      url: "https://example.com",
    });
    expect(result.success).toBe(true);
    expect(mockedQuery).toHaveBeenCalledWith(
      "item-1",
      expect.objectContaining({ url: "https://example.com" }),
      "user-1",
    );
  });
});

describe("updateItem action — normalization", () => {
  it("coerces empty/whitespace optional strings to null", async () => {
    await updateItem("item-1", {
      title: "Title",
      description: "",
      content: "   ",
      language: "",
      url: "",
      tags: [],
    });
    expect(mockedQuery).toHaveBeenCalledWith(
      "item-1",
      {
        title: "Title",
        description: null,
        content: null,
        language: null,
        url: null,
        tags: [],
        collectionIds: [],
      },
      "user-1",
    );
  });

  it("trims the title and passes tags through", async () => {
    await updateItem("item-1", { ...validInput, title: "  Padded  " });
    expect(mockedQuery).toHaveBeenCalledWith(
      "item-1",
      expect.objectContaining({ title: "Padded", tags: ["a", "b"] }),
      "user-1",
    );
  });
});

describe("updateItem action — query result", () => {
  it("returns the updated item on success", async () => {
    const result = await updateItem("item-1", validInput);
    expect(result).toEqual({ success: true, data: fakeItem });
  });

  it("returns not-found when the query returns null", async () => {
    mockedQuery.mockResolvedValue(null);
    const result = await updateItem("item-1", validInput);
    expect(result).toEqual({ success: false, error: "Item not found." });
  });

  it("returns a friendly error when the query throws", async () => {
    mockedQuery.mockRejectedValue(new Error("db down"));
    const result = await updateItem("item-1", validInput);
    expect(result).toEqual({
      success: false,
      error: "Could not save changes. Please try again.",
    });
  });
});

describe("deleteItem action", () => {
  it("rejects when there is no session", async () => {
    mockedAuth.mockResolvedValue(null as never);
    const result = await deleteItem("item-1");
    expect(result).toEqual({
      success: false,
      error: "You must be signed in to delete items.",
    });
    expect(mockedDeleteQuery).not.toHaveBeenCalled();
  });

  it("returns success when the item is deleted", async () => {
    const result = await deleteItem("item-1");
    expect(result).toEqual({ success: true });
    expect(mockedDeleteQuery).toHaveBeenCalledWith("item-1", "user-1");
    expect(mockedDeleteFromR2).not.toHaveBeenCalled();
  });

  it("returns not-found when the query reports nothing deleted", async () => {
    mockedDeleteQuery.mockResolvedValue({ deleted: false, fileKey: null });
    const result = await deleteItem("item-1");
    expect(result).toEqual({ success: false, error: "Item not found." });
  });

  it("removes the R2 object when the deleted item had a file", async () => {
    mockedDeleteQuery.mockResolvedValue({
      deleted: true,
      fileKey: "files/abc/report.pdf",
    });
    const result = await deleteItem("item-1");
    expect(result).toEqual({ success: true });
    expect(mockedDeleteFromR2).toHaveBeenCalledWith("files/abc/report.pdf");
  });

  it("still succeeds when the R2 cleanup fails", async () => {
    mockedDeleteQuery.mockResolvedValue({
      deleted: true,
      fileKey: "files/abc/report.pdf",
    });
    mockedDeleteFromR2.mockRejectedValue(new Error("r2 down"));
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const result = await deleteItem("item-1");
    consoleError.mockRestore();
    expect(result).toEqual({ success: true });
  });

  it("returns a friendly error when the query throws", async () => {
    mockedDeleteQuery.mockRejectedValue(new Error("db down"));
    const result = await deleteItem("item-1");
    expect(result).toEqual({
      success: false,
      error: "Could not delete the item. Please try again.",
    });
  });
});

describe("createItem action", () => {
  it("rejects when there is no session", async () => {
    mockedAuth.mockResolvedValue(null as never);
    const result = await createItem(validCreate);
    expect(result).toEqual({
      success: false,
      error: "You must be signed in to create items.",
    });
    expect(mockedCreateQuery).not.toHaveBeenCalled();
  });

  it("rejects an empty title", async () => {
    const result = await createItem({ ...validCreate, title: "  " });
    expect(result).toEqual({ success: false, error: "Title is required" });
    expect(mockedCreateQuery).not.toHaveBeenCalled();
  });

  it("requires a URL for the link type", async () => {
    const result = await createItem({ type: "link", title: "A link", tags: [] });
    expect(result).toEqual({ success: false, error: "URL is required" });
    expect(mockedCreateQuery).not.toHaveBeenCalled();
  });

  it("rejects an invalid URL for the link type", async () => {
    const result = await createItem({
      type: "link",
      title: "A link",
      url: "nope",
      tags: [],
    });
    expect(result).toEqual({ success: false, error: "Enter a valid URL" });
  });

  it("accepts a valid link and forwards it to the query", async () => {
    const result = await createItem({
      type: "link",
      title: "A link",
      url: "https://example.com",
      tags: [],
    });
    expect(result.success).toBe(true);
    expect(mockedCreateQuery).toHaveBeenCalledWith(
      expect.objectContaining({ type: "link", url: "https://example.com" }),
      "user-1",
    );
  });

  it("creates a non-link item without a URL", async () => {
    const result = await createItem(validCreate);
    expect(result).toEqual({ success: true, data: fakeItem });
    expect(mockedCreateQuery).toHaveBeenCalledWith(
      expect.objectContaining({ type: "snippet", url: null }),
      "user-1",
    );
  });

  it("returns an error when the query can't resolve the type", async () => {
    mockedCreateQuery.mockResolvedValue(null);
    const result = await createItem(validCreate);
    expect(result).toEqual({ success: false, error: "Invalid item type." });
  });

  it("returns a friendly error when the query throws", async () => {
    mockedCreateQuery.mockRejectedValue(new Error("db down"));
    const result = await createItem(validCreate);
    expect(result).toEqual({
      success: false,
      error: "Could not create the item. Please try again.",
    });
  });

  it("rejects a free user at the item quota", async () => {
    mockedGetPlanContext.mockResolvedValue({
      isPro: false,
      itemCount: 50,
      collectionCount: 0,
    });
    const result = await createItem(validCreate);
    expect(result).toEqual({
      success: false,
      error: "Free plan is limited to 50 items. Upgrade to Pro for unlimited.",
    });
    expect(mockedCreateQuery).not.toHaveBeenCalled();
  });

  it("allows a Pro user past the free item quota", async () => {
    mockedGetPlanContext.mockResolvedValue({
      isPro: true,
      itemCount: 500,
      collectionCount: 0,
    });
    const result = await createItem(validCreate);
    expect(result).toEqual({ success: true, data: fakeItem });
  });
});

describe("toggleItemFavorite action", () => {
  it("rejects when there is no session", async () => {
    mockedAuth.mockResolvedValue(null as never);
    const result = await toggleItemFavorite("item-1");
    expect(result).toEqual({
      success: false,
      error: "You must be signed in to do that.",
    });
    expect(mockedToggleFavoriteQuery).not.toHaveBeenCalled();
  });

  it("returns the new favorite value on success", async () => {
    mockedToggleFavoriteQuery.mockResolvedValue(true);
    const result = await toggleItemFavorite("item-1");
    expect(result).toEqual({ success: true, data: { isFavorite: true } });
    expect(mockedToggleFavoriteQuery).toHaveBeenCalledWith("item-1", "user-1");
  });

  it("reflects the flip back to false on a second toggle", async () => {
    mockedToggleFavoriteQuery.mockResolvedValue(false);
    const result = await toggleItemFavorite("item-1");
    expect(result).toEqual({ success: true, data: { isFavorite: false } });
  });

  it("returns not-found when the query returns null", async () => {
    mockedToggleFavoriteQuery.mockResolvedValue(null);
    const result = await toggleItemFavorite("item-1");
    expect(result).toEqual({ success: false, error: "Item not found." });
  });

  it("returns a friendly error when the query throws", async () => {
    mockedToggleFavoriteQuery.mockRejectedValue(new Error("db down"));
    const result = await toggleItemFavorite("item-1");
    expect(result).toEqual({
      success: false,
      error: "Could not update favorite. Please try again.",
    });
  });
});

describe("toggleItemPin action", () => {
  it("rejects when there is no session", async () => {
    mockedAuth.mockResolvedValue(null as never);
    const result = await toggleItemPin("item-1");
    expect(result).toEqual({
      success: false,
      error: "You must be signed in to do that.",
    });
    expect(mockedTogglePinQuery).not.toHaveBeenCalled();
  });

  it("returns the new pinned value on success", async () => {
    mockedTogglePinQuery.mockResolvedValue(true);
    const result = await toggleItemPin("item-1");
    expect(result).toEqual({ success: true, data: { isPinned: true } });
    expect(mockedTogglePinQuery).toHaveBeenCalledWith("item-1", "user-1");
  });

  it("reflects the flip back to false on a second toggle", async () => {
    mockedTogglePinQuery.mockResolvedValue(false);
    const result = await toggleItemPin("item-1");
    expect(result).toEqual({ success: true, data: { isPinned: false } });
  });

  it("returns not-found when the query returns null", async () => {
    mockedTogglePinQuery.mockResolvedValue(null);
    const result = await toggleItemPin("item-1");
    expect(result).toEqual({ success: false, error: "Item not found." });
  });

  it("returns a friendly error when the query throws", async () => {
    mockedTogglePinQuery.mockRejectedValue(new Error("db down"));
    const result = await toggleItemPin("item-1");
    expect(result).toEqual({
      success: false,
      error: "Could not update pin. Please try again.",
    });
  });
});
