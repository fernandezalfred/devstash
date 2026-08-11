"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

import { updateEditorPreferences } from "@/actions/editor-preferences";
import { toast } from "@/components/ui/toast";
import { type EditorPreferences } from "@/lib/editor-preferences";

interface EditorPreferencesContextValue {
  preferences: EditorPreferences;
  // Auto-saves a partial patch: merges over the current preferences,
  // updates local state immediately, persists in the background, and rolls
  // back + shows an error toast if the save fails.
  updatePreferences: (patch: Partial<EditorPreferences>) => void;
}

const EditorPreferencesContext =
  createContext<EditorPreferencesContextValue | null>(null);

export function useEditorPreferences(): EditorPreferencesContextValue {
  const ctx = useContext(EditorPreferencesContext);
  if (!ctx) {
    throw new Error(
      "useEditorPreferences must be used within an EditorPreferencesProvider",
    );
  }
  return ctx;
}

export function EditorPreferencesProvider({
  initialPreferences,
  children,
}: {
  initialPreferences: EditorPreferences;
  children: React.ReactNode;
}) {
  const [preferences, setPreferences] = useState(initialPreferences);
  // Guards against an in-flight save's response clobbering a newer local
  // value if the user changes another field before the first save returns.
  const requestId = useRef(0);

  const updatePreferences = useCallback(
    (patch: Partial<EditorPreferences>) => {
      const previous = preferences;
      const next = { ...previous, ...patch };
      setPreferences(next);

      const thisRequest = ++requestId.current;
      updateEditorPreferences(next).then((result) => {
        if (requestId.current !== thisRequest) return;
        if (result.success) {
          toast("Editor settings saved.");
        } else {
          setPreferences(previous);
          toast(result.error, "error");
        }
      });
    },
    [preferences],
  );

  return (
    <EditorPreferencesContext.Provider value={{ preferences, updatePreferences }}>
      {children}
    </EditorPreferencesContext.Provider>
  );
}
