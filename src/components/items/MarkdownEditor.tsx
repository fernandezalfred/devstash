"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";

const MAX_HEIGHT = 400;
const MIN_HEIGHT = 300;

// The item types that use the Markdown editor for their content field. Snippet
// and command use the Monaco CodeEditor instead; everything else keeps a plain
// textarea / display.
export const MARKDOWN_EDITOR_TYPES = ["prompt", "note"] as const;

export function isMarkdownEditorType(typeName: string): boolean {
  return (MARKDOWN_EDITOR_TYPES as readonly string[]).includes(typeName);
}

type Tab = "write" | "preview";

interface MarkdownEditorProps {
  value: string;
  /** Omit for read-only display mode (Preview only). */
  onChange?: (value: string) => void;
}

// A dark-themed Markdown editor with Write/Preview tabs, matching the CodeEditor
// chrome. Read-only mode shows only the rendered Preview; edit mode defaults to
// Write with Preview available. Height is fluid up to MAX_HEIGHT, then scrolls.
// The Write tab is a plain <textarea>, so (unlike Monaco) it has no focus-trap
// quirks inside the Radix drawer/dialog.
export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const readOnly = onChange === undefined;
  const [tab, setTab] = useState<Tab>(readOnly ? "preview" : "write");
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  // Grow the textarea to fit its content up to MAX_HEIGHT, then let it scroll.
  const autosize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(
      MAX_HEIGHT,
      Math.max(MIN_HEIGHT, el.scrollHeight),
    )}px`;
  }, []);

  useEffect(() => {
    if (tab === "write") autosize();
  }, [tab, value, autosize]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // Clipboard can be unavailable (permissions/insecure origin); ignore.
    }
  }, [value]);

  const showWrite = tab === "write" && !readOnly;

  return (
    <div className="overflow-hidden rounded-md border border-border bg-[#1e1e1e]">
      {/* Tab bar / header */}
      <div className="flex items-center gap-1 border-b border-white/10 bg-[#2d2d2d] px-2 py-1.5">
        {!readOnly && (
          <TabButton active={tab === "write"} onClick={() => setTab("write")}>
            Write
          </TabButton>
        )}
        <TabButton active={tab === "preview"} onClick={() => setTab("preview")}>
          Preview
        </TabButton>
        <button
          type="button"
          onClick={handleCopy}
          // Keep the textarea cursor when copying.
          onMouseDown={(e) => e.preventDefault()}
          aria-label="Copy markdown"
          className="ml-auto flex items-center gap-1 rounded px-1.5 py-1 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white"
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

      {showWrite ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onInput={autosize}
          placeholder="Write markdown…"
          spellCheck={false}
          className="block w-full resize-none overflow-y-auto bg-transparent px-3 py-2.5 font-mono text-sm text-white/90 outline-none placeholder:text-white/30"
          style={{ minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT }}
        />
      ) : (
        <div
          className="markdown-preview overflow-auto px-4 py-3 text-sm"
          style={{
            minHeight: readOnly ? undefined : MIN_HEIGHT,
            maxHeight: MAX_HEIGHT,
          }}
        >
          {value.trim() ? (
            <Markdown remarkPlugins={[remarkGfm]}>{value}</Markdown>
          ) : (
            <p className="text-white/40">Nothing to preview.</p>
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded px-2 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-white/10 text-white"
          : "text-white/50 hover:bg-white/5 hover:text-white/80",
      )}
    >
      {children}
    </button>
  );
}
