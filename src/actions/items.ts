"use server";

import { z } from "zod";

import { auth } from "@/auth";
import { updateItem as updateItemQuery, type ItemDetail } from "@/lib/db/items";

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
