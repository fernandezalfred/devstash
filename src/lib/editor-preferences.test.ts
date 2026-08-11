import { describe, expect, it } from "vitest";

import {
  DEFAULT_EDITOR_PREFERENCES,
  parseEditorPreferences,
} from "@/lib/editor-preferences";

describe("parseEditorPreferences", () => {
  it("returns the defaults for null (never saved a preference)", () => {
    expect(parseEditorPreferences(null)).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("returns the defaults for a non-object value", () => {
    expect(parseEditorPreferences("nonsense")).toEqual(
      DEFAULT_EDITOR_PREFERENCES,
    );
    expect(parseEditorPreferences(42)).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("passes through a fully valid stored value", () => {
    const stored = {
      fontSize: 18,
      tabSize: 4,
      wordWrap: false,
      minimap: true,
      theme: "monokai",
    };
    expect(parseEditorPreferences(stored)).toEqual(stored);
  });

  it("falls back field-by-field for a partial/malformed value", () => {
    const stored = {
      fontSize: 16,
      // tabSize missing entirely
      wordWrap: "yes", // wrong type
      minimap: true,
      theme: "not-a-real-theme",
    };
    expect(parseEditorPreferences(stored)).toEqual({
      fontSize: 16,
      tabSize: DEFAULT_EDITOR_PREFERENCES.tabSize,
      wordWrap: DEFAULT_EDITOR_PREFERENCES.wordWrap,
      minimap: true,
      theme: DEFAULT_EDITOR_PREFERENCES.theme,
    });
  });

  it("rejects a fontSize/tabSize not in the allowed option lists", () => {
    const stored = { fontSize: 999, tabSize: 3, wordWrap: true, minimap: false, theme: "vs-dark" };
    const result = parseEditorPreferences(stored);
    expect(result.fontSize).toBe(DEFAULT_EDITOR_PREFERENCES.fontSize);
    expect(result.tabSize).toBe(DEFAULT_EDITOR_PREFERENCES.tabSize);
  });
});
