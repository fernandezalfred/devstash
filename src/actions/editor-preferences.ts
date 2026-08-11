"use server";

import { z } from "zod";

import { auth } from "@/auth";
import { updateEditorPreferences as updateEditorPreferencesQuery } from "@/lib/db/users";
import {
  EDITOR_THEMES,
  FONT_SIZE_OPTIONS,
  TAB_SIZE_OPTIONS,
  type EditorPreferences,
} from "@/lib/editor-preferences";

const editorPreferencesSchema = z.object({
  fontSize: z
    .number()
    .refine((value) => (FONT_SIZE_OPTIONS as readonly number[]).includes(value), {
      message: "Invalid font size",
    }),
  tabSize: z
    .number()
    .refine((value) => (TAB_SIZE_OPTIONS as readonly number[]).includes(value), {
      message: "Invalid tab size",
    }),
  wordWrap: z.boolean(),
  minimap: z.boolean(),
  theme: z.enum(EDITOR_THEMES),
});

type ActionResult =
  | { success: true; data: EditorPreferences }
  | { success: false; error: string };

// Persists the full editor-preferences object (the settings form always
// submits the whole thing, not a partial patch) for the signed-in user.
export async function updateEditorPreferences(
  input: EditorPreferences,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be signed in to update editor preferences.",
    };
  }

  const parsed = editorPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  try {
    const preferences = await updateEditorPreferencesQuery(
      session.user.id,
      parsed.data,
    );
    return { success: true, data: preferences };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
