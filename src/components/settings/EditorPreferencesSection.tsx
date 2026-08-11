"use client";

import { useEditorPreferences } from "@/components/settings/EditorPreferencesContext";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  EDITOR_THEMES,
  FONT_SIZE_OPTIONS,
  TAB_SIZE_OPTIONS,
  THEME_LABELS,
} from "@/lib/editor-preferences";

// Every field here auto-saves on change (via useEditorPreferences), so there's
// no Save button and no local draft state — the context IS the form state.
export function EditorPreferencesSection() {
  const { preferences, updatePreferences } = useEditorPreferences();

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        Editor
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Applies to the code editor used for snippets and commands.
      </p>

      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <label htmlFor="fontSize" className="text-sm font-medium">
            Font size
          </label>
          <Select
            id="fontSize"
            className="w-28"
            value={preferences.fontSize}
            onChange={(e) =>
              updatePreferences({ fontSize: Number(e.target.value) })
            }
          >
            {FONT_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </Select>
        </div>

        <div className="flex items-center justify-between gap-4">
          <label htmlFor="tabSize" className="text-sm font-medium">
            Tab size
          </label>
          <Select
            id="tabSize"
            className="w-28"
            value={preferences.tabSize}
            onChange={(e) =>
              updatePreferences({ tabSize: Number(e.target.value) })
            }
          >
            {TAB_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size} spaces
              </option>
            ))}
          </Select>
        </div>

        <div className="flex items-center justify-between gap-4">
          <label htmlFor="theme" className="text-sm font-medium">
            Theme
          </label>
          <Select
            id="theme"
            className="w-40"
            value={preferences.theme}
            onChange={(e) =>
              updatePreferences({
                theme: e.target.value as (typeof EDITOR_THEMES)[number],
              })
            }
          >
            {EDITOR_THEMES.map((theme) => (
              <option key={theme} value={theme}>
                {THEME_LABELS[theme]}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex items-center justify-between gap-4">
          <label htmlFor="wordWrap" className="text-sm font-medium">
            Word wrap
          </label>
          <Switch
            id="wordWrap"
            checked={preferences.wordWrap}
            onCheckedChange={(checked) => updatePreferences({ wordWrap: checked })}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <label htmlFor="minimap" className="text-sm font-medium">
            Minimap
          </label>
          <Switch
            id="minimap"
            checked={preferences.minimap}
            onCheckedChange={(checked) => updatePreferences({ minimap: checked })}
          />
        </div>
      </div>
    </section>
  );
}
