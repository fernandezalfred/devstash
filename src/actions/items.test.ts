import { beforeEach, describe, expect, it, vi } from "vitest";

import { createItem, deleteItem, updateItem } from "@/actions/items";
import { auth } from "@/auth";
import {
  createItem as createItemQuery,
  deleteItem as deleteItemQuery,
  updateItem as updateItemQuery,
} from "@/lib/db/items";

// Mock the auth + DB boundaries so the action's own logic (auth gate, Zod
// validation, empty-string normalization) is what's under test — no real
// session or database.
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db/items", () => ({
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
  createItem: vi.fn(),
}));

const mockedAuth = vi.mocked(auth);
const mockedQuery = vi.mocked(updateItemQuery);
const mockedDeleteQuery = vi.mocked(deleteItemQuery);
const mockedCreateQuery = vi.mocked(createItemQuery);

// A minimal ItemDetail the query can echo back on success.
const fakeItem = {
  id: "item-1",
  title: "After",
  description: null,
  content: null,
  url: null,
  fileName: null,
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
  mockedDeleteQuery.mockResolvedValue(true);
  mockedCreateQuery.mockResolvedValue(fakeItem);
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
    expect(mockedQuery).toHaveBeenCalledWith("item-1", {
      title: "Title",
      description: null,
      content: null,
      language: null,
      url: null,
      tags: [],
    });
  });

  it("trims the title and passes tags through", async () => {
    await updateItem("item-1", { ...validInput, title: "  Padded  " });
    expect(mockedQuery).toHaveBeenCalledWith(
      "item-1",
      expect.objectContaining({ title: "Padded", tags: ["a", "b"] }),
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
    expect(mockedDeleteQuery).toHaveBeenCalledWith("item-1");
  });

  it("returns not-found when the query reports nothing deleted", async () => {
    mockedDeleteQuery.mockResolvedValue(false);
    const result = await deleteItem("item-1");
    expect(result).toEqual({ success: false, error: "Item not found." });
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
    );
  });

  it("creates a non-link item without a URL", async () => {
    const result = await createItem(validCreate);
    expect(result).toEqual({ success: true, data: fakeItem });
    expect(mockedCreateQuery).toHaveBeenCalledWith(
      expect.objectContaining({ type: "snippet", url: null }),
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
});
