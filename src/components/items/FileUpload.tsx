"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { File as FileIcon, Upload, X } from "lucide-react";

import {
  acceptForKind,
  allowedExtensions,
  formatBytes,
  maxBytesForKind,
  validateUploadFile,
  type UploadKind,
} from "@/lib/uploads";
import { cn } from "@/lib/utils";

// Drag-and-drop file picker for the file/image item types. Validates locally
// (extension / MIME / size via lib/uploads — the upload route re-validates
// server-side), previews images, and shows file info plus an upload progress
// bar while the parent is submitting. The parent owns the selected File and
// the upload itself.
export function FileUpload({
  kind,
  file,
  onSelect,
  progress = null,
  disabled = false,
}: {
  kind: UploadKind;
  file: File | null;
  onSelect: (file: File | null) => void;
  // 0–100 while an upload is in flight, null otherwise.
  progress?: number | null;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isImage = kind === "image";
  const uploading = progress !== null;

  // Object URL for the image thumbnail; revoked when the file changes/unmounts.
  const previewUrl = useMemo(
    () => (file && isImage ? URL.createObjectURL(file) : null),
    [file, isImage],
  );
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function handleFiles(files: FileList | null) {
    if (disabled || uploading) return;
    const candidate = files?.[0];
    if (!candidate) return;

    const validation = validateUploadFile(kind, {
      name: candidate.name,
      size: candidate.size,
      type: candidate.type,
    });
    if (!validation.ok) {
      setError(validation.error);
      onSelect(null);
      return;
    }
    setError(null);
    onSelect(candidate);
  }

  function clear() {
    if (uploading) return;
    setError(null);
    onSelect(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      {file ? (
        <div className="rounded-md border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-3">
            {previewUrl ? (
              // Local object-URL thumbnail of the not-yet-uploaded image.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt={file.name}
                className="size-14 shrink-0 rounded-md border border-border object-cover"
              />
            ) : (
              <span className="flex size-14 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
                <FileIcon className="size-6 text-muted-foreground" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(file.size)}
              </p>
            </div>
            {!uploading && (
              <button
                type="button"
                onClick={clear}
                disabled={disabled}
                aria-label="Remove file"
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          {uploading && (
            <div className="mt-3">
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Uploading… {Math.round(progress)}%
              </p>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed px-4 py-8 text-center transition-colors",
            dragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-foreground/30 hover:bg-muted/40",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          <Upload className="size-6 text-muted-foreground" />
          <span className="text-sm">
            Drop {isImage ? "an image" : "a file"} here or{" "}
            <span className="font-medium text-primary">browse</span>
          </span>
          <span className="text-xs text-muted-foreground">
            {allowedExtensions(kind).join(", ")} · max{" "}
            {formatBytes(maxBytesForKind(kind))}
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={acceptForKind(kind)}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
