// Client-safe shared shape for Monaco editor preferences — no Prisma import,
// so it can be used from the DB layer, the server action, and client
// components (context, settings form, CodeEditor) alike.

export const EDITOR_THEMES = ["vs-dark", "monokai", "github-dark"] as const;
export type EditorTheme = (typeof EDITOR_THEMES)[number];

export interface EditorPreferences {
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  theme: EditorTheme;
}

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  fontSize: 13,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  theme: "vs-dark",
};

export const FONT_SIZE_OPTIONS = [12, 13, 14, 16, 18, 20] as const;
export const TAB_SIZE_OPTIONS = [2, 4, 8] as const;

export const THEME_LABELS: Record<EditorTheme, string> = {
  "vs-dark": "VS Dark",
  monokai: "Monokai",
  "github-dark": "GitHub Dark",
};

function isEditorTheme(value: unknown): value is EditorTheme {
  return (
    typeof value === "string" &&
    (EDITOR_THEMES as readonly string[]).includes(value)
  );
}

// Merges a possibly-null, possibly-malformed JSON value (as stored in
// User.editorPreferences) over the defaults — any missing or invalid field
// falls back rather than producing an unusable editor.
export function parseEditorPreferences(value: unknown): EditorPreferences {
  if (typeof value !== "object" || value === null) {
    return DEFAULT_EDITOR_PREFERENCES;
  }
  const raw = value as Record<string, unknown>;

  return {
    fontSize:
      typeof raw.fontSize === "number" &&
      (FONT_SIZE_OPTIONS as readonly number[]).includes(raw.fontSize)
        ? raw.fontSize
        : DEFAULT_EDITOR_PREFERENCES.fontSize,
    tabSize:
      typeof raw.tabSize === "number" &&
      (TAB_SIZE_OPTIONS as readonly number[]).includes(raw.tabSize)
        ? raw.tabSize
        : DEFAULT_EDITOR_PREFERENCES.tabSize,
    wordWrap:
      typeof raw.wordWrap === "boolean"
        ? raw.wordWrap
        : DEFAULT_EDITOR_PREFERENCES.wordWrap,
    minimap:
      typeof raw.minimap === "boolean"
        ? raw.minimap
        : DEFAULT_EDITOR_PREFERENCES.minimap,
    theme: isEditorTheme(raw.theme) ? raw.theme : DEFAULT_EDITOR_PREFERENCES.theme,
  };
}
