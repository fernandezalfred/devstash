"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { BeforeMount, OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { Check, Copy } from "lucide-react";

// Monaco touches the DOM/window on import, so it must be client-only. The dynamic
// import with ssr:false keeps it out of the server bundle; the loading fallback
// mirrors the editor surface so there's no layout jump.
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="h-32 animate-pulse bg-[#1e1e1e]" />,
});

const THEME_NAME = "devstash-dark";
const MAX_HEIGHT = 400;
const MIN_HEIGHT = 88;

// Free-text language hints (from the item's `language` field) mapped to Monaco
// language ids. Falls back to plaintext for anything unrecognized.
const LANGUAGE_ALIASES: Record<string, string> = {
  js: "javascript",
  jsx: "javascript",
  javascript: "javascript",
  ts: "typescript",
  tsx: "typescript",
  typescript: "typescript",
  py: "python",
  python: "python",
  rb: "ruby",
  ruby: "ruby",
  go: "go",
  golang: "go",
  rs: "rust",
  rust: "rust",
  java: "java",
  c: "c",
  "c++": "cpp",
  cpp: "cpp",
  cs: "csharp",
  csharp: "csharp",
  php: "php",
  html: "html",
  css: "css",
  scss: "scss",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  md: "markdown",
  markdown: "markdown",
  sql: "sql",
  xml: "xml",
  dockerfile: "dockerfile",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  shell: "shell",
};

function toMonacoLanguage(hint: string | null | undefined, fallback: string) {
  const key = hint?.trim().toLowerCase();
  if (key && LANGUAGE_ALIASES[key]) return LANGUAGE_ALIASES[key];
  return fallback;
}

// The item types that use the Monaco code editor for their content field.
// Everything else (prompt, note, …) keeps the plain textarea / line-numbered
// display, per spec.
export const CODE_EDITOR_TYPES = ["snippet", "command"] as const;

export function isCodeEditorType(typeName: string): boolean {
  return (CODE_EDITOR_TYPES as readonly string[]).includes(typeName);
}

// Commands are shell by default when no explicit language hint is set.
export function codeFallbackLanguage(typeName: string): string {
  return typeName === "command" ? "shell" : "plaintext";
}

const defineTheme: BeforeMount = (monaco) => {
  monaco.editor.defineTheme(THEME_NAME, {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#1e1e1e",
      "editorGutter.background": "#1e1e1e",
      "editorLineNumber.foreground": "#5a5a5a",
      "editorLineNumber.activeForeground": "#c6c6c6",
      "scrollbarSlider.background": "#ffffff20",
      "scrollbarSlider.hoverBackground": "#ffffff33",
      "scrollbarSlider.activeBackground": "#ffffff44",
    },
  });
};

interface CodeEditorProps {
  value: string;
  /** Omit for read-only display mode. */
  onChange?: (value: string) => void;
  /** Free-text language hint from the item (e.g. "javascript", "bash"). */
  language?: string | null;
  /** Monaco language used when the hint is empty/unknown (e.g. "shell" for commands). */
  fallbackLanguage?: string;
}

// A themed, macOS-styled code surface built on Monaco. Renders a title bar with
// window dots + a language label + copy button, then the editor. Height is fluid
// up to MAX_HEIGHT; beyond that Monaco's own themed scrollbar takes over. Always
// dark, per spec, regardless of the app's light/dark mode.
//
// Memoized, and deliberately built to avoid re-rendering Monaco on parent updates:
// the editor is uncontrolled (defaultValue) and options/handlers are stable, so
// keystroke-driven parent re-renders don't churn the editor or steal its focus.
function CodeEditorImpl({
  value,
  onChange,
  language,
  fallbackLanguage = "plaintext",
}: CodeEditorProps) {
  const readOnly = onChange === undefined;
  const monacoLanguage = toMonacoLanguage(language, fallbackLanguage);
  const label =
    language?.trim() || (monacoLanguage !== "plaintext" ? monacoLanguage : "code");

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);
  // In edit mode the editor is uncontrolled: capture the initial content once so
  // the `value` prop changing on every keystroke can't push back into Monaco.
  const [initialValue] = useState(value);

  // Keep the latest onChange without changing the identity of the handler we hand
  // to Monaco (a changing onChange prop would otherwise re-subscribe every render).
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = useCallback(async () => {
    const text = editorRef.current?.getValue() ?? value;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Clipboard can be unavailable (permissions/insecure origin); ignore.
    }
  }, [value]);

  const handleChange = useCallback((next: string | undefined) => {
    onChangeRef.current?.(next ?? "");
  }, []);

  const handleMount: OnMount = useCallback((editorInstance) => {
    editorRef.current = editorInstance;
    // Size the wrapper to fit content (capped at MAX_HEIGHT) imperatively, so
    // content-driven height changes never trigger a React re-render of the editor.
    const applyHeight = () => {
      const h = Math.min(
        MAX_HEIGHT,
        Math.max(MIN_HEIGHT, editorInstance.getContentHeight()),
      );
      if (wrapperRef.current) wrapperRef.current.style.height = `${h}px`;
      editorInstance.layout();
    };
    editorInstance.onDidContentSizeChange(applyHeight);
    applyHeight();
  }, []);

  const options = useMemo<editor.IStandaloneEditorConstructionOptions>(
    () => ({
      readOnly,
      domReadOnly: readOnly,
      // Suppress Monaco's "Cannot edit in read-only editor" popup on the display
      // editor — the content is still selectable/copyable, just not editable.
      readOnlyMessage: readOnly ? { value: "" } : undefined,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 13,
      lineHeight: 20,
      lineNumbersMinChars: 3,
      padding: { top: 12, bottom: 12 },
      fontFamily: "var(--font-mono), ui-monospace, monospace",
      fontLigatures: false,
      renderLineHighlight: readOnly ? "none" : "line",
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: true,
      overviewRulerBorder: false,
      contextmenu: !readOnly,
      scrollbar: {
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
        alwaysConsumeMouseWheel: false,
      },
      automaticLayout: true,
    }),
    [readOnly],
  );

  return (
    <div className="overflow-hidden rounded-md border border-border bg-[#1e1e1e]">
      {/* macOS-style title bar */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-[#252526] px-3 py-2">
        <span className="flex items-center gap-1.5" aria-hidden>
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-white/50 lowercase">{label}</span>
          {/*
            Focus-safe copy button. Inside a Radix Dialog/Sheet, FocusScope records
            the last-focused element in the panel and restores focus to it whenever
            Monaco churns its DOM (which it does constantly). If this button ever
            became that element, it would repeatedly steal focus back from the
            editor and make typing impossible. So it must never hold focus: it's
            out of the tab order, doesn't focus on pointer-down, and if it is ever
            focused programmatically it immediately hands focus to the editor.
          */}
          <button
            type="button"
            onClick={handleCopy}
            onMouseDown={(e) => e.preventDefault()}
            onFocus={() => editorRef.current?.focus()}
            tabIndex={-1}
            aria-label="Copy code"
            className="flex items-center gap-1 rounded px-1.5 py-1 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            {copied ? (
              <>
                <Check className="size-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      <div ref={wrapperRef} style={{ height: MIN_HEIGHT }}>
        <MonacoEditor
          height="100%"
          language={monacoLanguage}
          // Read-only: controlled so it reflects external updates (e.g. after an
          // edit is saved). Editable: uncontrolled to avoid keystroke churn.
          {...(readOnly ? { value } : { defaultValue: initialValue })}
          onChange={handleChange}
          theme={THEME_NAME}
          beforeMount={defineTheme}
          onMount={handleMount}
          options={options}
        />
      </div>
    </div>
  );
}

export const CodeEditor = memo(CodeEditorImpl);
