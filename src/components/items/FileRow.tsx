"use client";

import { createElement } from "react";

import {
  Download,
  File,
  FileCode,
  FileJson,
  FileSpreadsheet,
  FileText,
  Pin,
  Star,
  type LucideIcon,
} from "lucide-react";

import { useItemDrawer } from "@/components/items/ItemDrawer";
import { type DashboardItem } from "@/lib/db/items";
import { fileExtension, formatBytes } from "@/lib/uploads";

// Extension → icon for the file list. Falls back to a generic File icon for
// anything unmapped (or items with no stored file name).
const EXTENSION_ICONS: Record<string, LucideIcon> = {
  ".pdf": FileText,
  ".txt": FileText,
  ".md": FileText,
  ".json": FileJson,
  ".yaml": FileCode,
  ".yml": FileCode,
  ".xml": FileCode,
  ".toml": FileCode,
  ".ini": FileCode,
  ".csv": FileSpreadsheet,
};

function formatUploadDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// A file item rendered as a Drive-style list row: extension icon, title +
// file name, size, upload date, and a direct-download button. Clicking the
// row opens the item drawer; the download link stops propagation.
export function FileRow({ item }: { item: DashboardItem }) {
  const { open } = useItemDrawer();
  // Lowercase binding + createElement below: the static-components lint can't
  // tell fileExtension() returns a string key, and would flag a capitalized
  // <Icon> as a component created during render. Every value in the map is a
  // static module-level component, so selecting one here is safe.
  const ext = item.fileName ? fileExtension(item.fileName) : null;
  const icon = (ext && EXTENSION_ICONS[ext]) || File;
  const accent = item.typeColor;

  return (
    // A div instead of a <button> so the download <a> isn't nested inside a
    // button (invalid HTML); keyboard access mirrors a button via role/Enter.
    <div
      role="button"
      tabIndex={0}
      onClick={() => open(item.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open(item.id);
        }
      }}
      className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-md"
        style={{ backgroundColor: `${accent}1a` }}
      >
        {createElement(icon, {
          className: "size-4.5",
          style: { color: accent },
        })}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="truncate text-sm font-medium">{item.title}</span>
          {item.isPinned && (
            <Pin className="size-3 shrink-0 text-muted-foreground" />
          )}
          {item.isFavorite && (
            <Star className="size-3 shrink-0 fill-yellow-400 text-yellow-400" />
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground sm:shrink-0">
          {item.fileName && (
            <span className="max-w-40 truncate sm:max-w-56">
              {item.fileName}
            </span>
          )}
          <span className="shrink-0 sm:w-16 sm:text-right">
            {item.fileSize !== null ? formatBytes(item.fileSize) : "—"}
          </span>
          <span className="shrink-0 sm:w-24 sm:text-right">
            {formatUploadDate(item.createdAt)}
          </span>
        </div>
      </div>

      <a
        href={`/api/items/${item.id}/download?download=1`}
        onClick={(event) => event.stopPropagation()}
        aria-label={`Download ${item.fileName ?? item.title}`}
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Download className="size-4" />
      </a>
    </div>
  );
}
