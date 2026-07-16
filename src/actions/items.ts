"use server";

import { z } from "zod";

import { auth } from "@/auth";
import {
  createItem as createItemQuery,
  deleteItem as deleteItemQuery,
  updateItem as updateItemQuery,
  type ItemDetail,
} from "@/lib/db/items";
import { deleteFromR2 } from "@/lib/r2";

// Treat an empty/whitespace-only string as "not set" so blank optional inputs
// clear the field rather than failing validation (e.g. an empty URL box).
const emptyToNull = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? null : value;

// Source of truth for an item edit. The client mirrors the title guard for UX,
// but this runs server-side regardless.
const updateItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.preprocess(emptyToNull, z.string().nullable()).optional(),
  content: z.preprocess(emptyToNull, z.string().nullable()).optional(),
  language: z.preprocess(emptyToNull, z.string().nullable()).optional(),
  url: z.preprocess(emptyToNull, z.url("Enter a valid URL").nullable()).optional(),
  tags: z.array(z.string().trim().min(1)).default([]),
});

export type UpdateItemInput = z.input<typeof updateItemSchema>;

type ActionResult =
  | { success: true; data: ItemDetail }
  | { success: false; error: string };

// Update an item the current user is allowed to edit. Validates with Zod,
// requires an authenticated session, then delegates to the demo-scoped query
// (see updateItem in lib/db/items.ts for the scoping note).
export async function updateItem(
  itemId: string,
  input: UpdateItemInput,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to edit items." };
  }

  const parsed = updateItemSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const { title, description, content, language, url, tags } = parsed.data;

  try {
    const item = await updateItemQuery(itemId, {
      title,
      description: description ?? null,
      content: content ?? null,
      language: language ?? null,
      url: url ?? null,
      tags,
    });
    if (!item) {
      return { success: false, error: "Item not found." };
    }
    return { success: true, data: item };
  } catch {
    return { success: false, error: "Could not save changes. Please try again." };
  }
}

// The five creatable system types (file/image are upload-only, out of scope).
// Not exported — a "use server" module may only export async functions.
const CREATABLE_TYPES = [
  "snippet",
  "prompt",
  "command",
  "note",
  "link",
] as const;

// Create schema. `url` is only required + format-checked for the link type;
// other types ignore it. Empty optional strings are coerced to null.
const createItemSchema = z
  .object({
    type: z.enum(CREATABLE_TYPES),
    title: z.string().trim().min(1, "Title is required"),
    description: z.preprocess(emptyToNull, z.string().nullable()).optional(),
    content: z.preprocess(emptyToNull, z.string().nullable()).optional(),
    language: z.preprocess(emptyToNull, z.string().nullable()).optional(),
    url: z.preprocess(emptyToNull, z.string().nullable()).optional(),
    tags: z.array(z.string().trim().min(1)).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.type !== "link") return;
    if (!data.url) {
      ctx.addIssue({ code: "custom", path: ["url"], message: "URL is required" });
    } else if (!z.url().safeParse(data.url).success) {
      ctx.addIssue({ code: "custom", path: ["url"], message: "Enter a valid URL" });
    }
  });

export type CreateItemInput = z.input<typeof createItemSchema>;

// Create an item. Requires an authenticated session; the query is demo-scoped
// (see createItem in lib/db/items.ts for the scoping note).
export async function createItem(
  input: CreateItemInput,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to create items." };
  }

  const parsed = createItemSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const { type, title, description, content, language, url, tags } = parsed.data;

  try {
    const item = await createItemQuery({
      type,
      title,
      description: description ?? null,
      content: content ?? null,
      language: language ?? null,
      url: url ?? null,
      tags,
    });
    if (!item) {
      return { success: false, error: "Invalid item type." };
    }
    return { success: true, data: item };
  } catch {
    return { success: false, error: "Could not create the item. Please try again." };
  }
}

type DeleteResult = { success: true } | { success: false; error: string };

// Delete an item. Requires an authenticated session; the query is demo-scoped
// (see deleteItem in lib/db/items.ts for the scoping note). For FILE items the
// stored R2 object is removed after the row — best-effort, since the item is
// already gone and an orphaned object is preferable to a failed delete.
export async function deleteItem(itemId: string): Promise<DeleteResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to delete items." };
  }

  try {
    const { deleted, fileKey } = await deleteItemQuery(itemId);
    if (!deleted) {
      return { success: false, error: "Item not found." };
    }
    if (fileKey) {
      try {
        await deleteFromR2(fileKey);
      } catch (error) {
        console.error(`Failed to delete R2 object ${fileKey}:`, error);
      }
    }
    return { success: true };
  } catch {
    return { success: false, error: "Could not delete the item. Please try again." };
  }
}
