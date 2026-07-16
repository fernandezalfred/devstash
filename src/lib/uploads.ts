// Shared upload constraints for the file/image item types. Client-safe (no
// server deps): the FileUpload component uses it for instant validation and
// the upload API route re-validates with the same rules server-side.

// The two upload item-type names ("file" | "image" system types).
export type UploadKind = "file" | "image";

// Whether a system item type name is one of the upload kinds.
export function isUploadKind(type: string): type is UploadKind {
  return type === "file" || type === "image";
}

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

// Extension → MIME type served by the download proxy. The extension allowlist
// is authoritative; the browser-reported MIME is only cross-checked because
// browsers report text formats inconsistently (or not at all).
const IMAGE_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

const FILE_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".json": "application/json",
  ".yaml": "application/x-yaml",
  ".yml": "application/x-yaml",
  ".xml": "application/xml",
  ".csv": "text/csv",
  ".toml": "application/toml",
  ".ini": "text/plain",
};

// MIME types accepted from the browser per kind, beyond the canonical ones
// above (e.g. Firefox reports .yaml as text/yaml, .xml as text/xml).
const EXTRA_ALLOWED_MIMES: Record<UploadKind, Set<string>> = {
  image: new Set<string>(),
  file: new Set(["text/yaml", "text/xml", "text/markdown", "text/plain"]),
};

function extensionTable(kind: UploadKind): Record<string, string> {
  return kind === "image" ? IMAGE_TYPES : FILE_TYPES;
}

export function maxBytesForKind(kind: UploadKind): number {
  return kind === "image" ? MAX_IMAGE_BYTES : MAX_FILE_BYTES;
}

// Allowed extensions for a kind, e.g. [".png", ".jpg", ...].
export function allowedExtensions(kind: UploadKind): string[] {
  return Object.keys(extensionTable(kind));
}

// Value for an <input type="file" accept="..."> attribute.
export function acceptForKind(kind: UploadKind): string {
  return allowedExtensions(kind).join(",");
}

// Lowercased extension (with dot) of a filename, or null when it has none.
export function fileExtension(name: string): string | null {
  const match = /\.[^.\\/]+$/.exec(name.trim());
  return match ? match[0].toLowerCase() : null;
}

// MIME type to serve a stored file with, derived from its extension (the
// client-reported type is never stored). Falls back to a safe binary default.
export function contentTypeForFileName(name: string): string {
  const ext = fileExtension(name);
  if (!ext) return "application/octet-stream";
  return IMAGE_TYPES[ext] ?? FILE_TYPES[ext] ?? "application/octet-stream";
}

export type UploadValidation =
  | { ok: true; extension: string }
  | { ok: false; error: string };

// Validate a candidate upload against the kind's constraints. `mimeType` is
// the browser-reported type — allowed to be empty (browsers often omit it for
// text formats) but rejected when present and not plausible for the kind.
export function validateUploadFile(
  kind: UploadKind,
  file: { name: string; size: number; type: string },
): UploadValidation {
  const table = extensionTable(kind);
  const ext = fileExtension(file.name);

  if (!ext || !(ext in table)) {
    return {
      ok: false,
      error: `File type not allowed. Allowed: ${allowedExtensions(kind).join(", ")}`,
    };
  }

  const maxBytes = maxBytesForKind(kind);
  if (file.size > maxBytes) {
    return {
      ok: false,
      error: `File is too large (max ${formatBytes(maxBytes)}).`,
    };
  }
  if (file.size <= 0) {
    return { ok: false, error: "File is empty." };
  }

  const mime = file.type.toLowerCase();
  if (mime) {
    const allowed =
      Object.values(table).includes(mime) || EXTRA_ALLOWED_MIMES[kind].has(mime);
    if (!allowed) {
      return { ok: false, error: "File type not allowed." };
    }
  }

  return { ok: true, extension: ext };
}

// Human-readable size, e.g. "2.4 MB", "312 KB".
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MB`;
}
