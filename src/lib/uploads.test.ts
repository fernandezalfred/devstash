import { describe, expect, it } from "vitest";

import {
  acceptForKind,
  allowedExtensions,
  contentTypeForFileName,
  fileExtension,
  formatBytes,
  isUploadKind,
  MAX_FILE_BYTES,
  MAX_IMAGE_BYTES,
  validateUploadFile,
} from "@/lib/uploads";

describe("isUploadKind", () => {
  it("accepts the two upload type names and nothing else", () => {
    expect(isUploadKind("file")).toBe(true);
    expect(isUploadKind("image")).toBe(true);
    expect(isUploadKind("snippet")).toBe(false);
    expect(isUploadKind("")).toBe(false);
  });
});

describe("fileExtension", () => {
  it("returns the lowercased extension with dot", () => {
    expect(fileExtension("photo.PNG")).toBe(".png");
    expect(fileExtension("archive.tar.gz")).toBe(".gz");
    expect(fileExtension("  spaced.pdf ")).toBe(".pdf");
  });

  it("returns null when there is no extension", () => {
    expect(fileExtension("README")).toBeNull();
    expect(fileExtension("")).toBeNull();
  });

  it("does not treat path separators as part of an extension", () => {
    expect(fileExtension("dir.name/file")).toBeNull();
  });
});

describe("contentTypeForFileName", () => {
  it("maps known extensions to their MIME type", () => {
    expect(contentTypeForFileName("a.png")).toBe("image/png");
    expect(contentTypeForFileName("a.jpg")).toBe("image/jpeg");
    expect(contentTypeForFileName("a.svg")).toBe("image/svg+xml");
    expect(contentTypeForFileName("a.pdf")).toBe("application/pdf");
    expect(contentTypeForFileName("a.md")).toBe("text/markdown");
    expect(contentTypeForFileName("a.yml")).toBe("application/x-yaml");
    expect(contentTypeForFileName("a.ini")).toBe("text/plain");
  });

  it("falls back to octet-stream for unknown/missing extensions", () => {
    expect(contentTypeForFileName("a.exe")).toBe("application/octet-stream");
    expect(contentTypeForFileName("noext")).toBe("application/octet-stream");
  });
});

describe("validateUploadFile — extensions", () => {
  it("accepts an allowed image extension", () => {
    const result = validateUploadFile("image", {
      name: "photo.webp",
      size: 1024,
      type: "image/webp",
    });
    expect(result).toEqual({ ok: true, extension: ".webp" });
  });

  it("accepts an allowed file extension", () => {
    const result = validateUploadFile("file", {
      name: "config.toml",
      size: 1024,
      type: "",
    });
    expect(result).toEqual({ ok: true, extension: ".toml" });
  });

  it("rejects an image extension for the file kind (and vice versa)", () => {
    expect(
      validateUploadFile("file", { name: "a.png", size: 10, type: "image/png" })
        .ok,
    ).toBe(false);
    expect(
      validateUploadFile("image", { name: "a.pdf", size: 10, type: "application/pdf" })
        .ok,
    ).toBe(false);
  });

  it("rejects disallowed and missing extensions", () => {
    expect(
      validateUploadFile("file", { name: "run.exe", size: 10, type: "" }).ok,
    ).toBe(false);
    expect(
      validateUploadFile("file", { name: "README", size: 10, type: "" }).ok,
    ).toBe(false);
  });

  it("is case-insensitive on extensions", () => {
    const result = validateUploadFile("image", {
      name: "PHOTO.JPG",
      size: 10,
      type: "image/jpeg",
    });
    expect(result).toEqual({ ok: true, extension: ".jpg" });
  });
});

describe("validateUploadFile — size", () => {
  it("enforces the 5 MB image limit", () => {
    const at = validateUploadFile("image", {
      name: "a.png",
      size: MAX_IMAGE_BYTES,
      type: "image/png",
    });
    const over = validateUploadFile("image", {
      name: "a.png",
      size: MAX_IMAGE_BYTES + 1,
      type: "image/png",
    });
    expect(at.ok).toBe(true);
    expect(over.ok).toBe(false);
    expect(!over.ok && over.error).toContain("5 MB");
  });

  it("enforces the 10 MB file limit", () => {
    const over = validateUploadFile("file", {
      name: "a.pdf",
      size: MAX_FILE_BYTES + 1,
      type: "application/pdf",
    });
    expect(over.ok).toBe(false);
    expect(!over.ok && over.error).toContain("10 MB");
  });

  it("rejects empty files", () => {
    expect(
      validateUploadFile("file", { name: "a.txt", size: 0, type: "text/plain" })
        .ok,
    ).toBe(false);
  });
});

describe("validateUploadFile — MIME", () => {
  it("allows an empty browser-reported type", () => {
    expect(
      validateUploadFile("file", { name: "a.yaml", size: 10, type: "" }).ok,
    ).toBe(true);
  });

  it("allows browser MIME variants for text formats", () => {
    expect(
      validateUploadFile("file", { name: "a.yaml", size: 10, type: "text/yaml" })
        .ok,
    ).toBe(true);
    expect(
      validateUploadFile("file", { name: "a.xml", size: 10, type: "text/xml" })
        .ok,
    ).toBe(true);
  });

  it("rejects a reported MIME that is implausible for the kind", () => {
    expect(
      validateUploadFile("image", {
        name: "fake.png",
        size: 10,
        type: "application/pdf",
      }).ok,
    ).toBe(false);
    expect(
      validateUploadFile("file", {
        name: "fake.txt",
        size: 10,
        type: "application/x-msdownload",
      }).ok,
    ).toBe(false);
  });
});

describe("accept/extension helpers", () => {
  it("builds an accept attribute from the allowlist", () => {
    expect(acceptForKind("image")).toContain(".png");
    expect(acceptForKind("image")).not.toContain(".pdf");
    expect(allowedExtensions("file")).toContain(".ini");
  });
});

describe("formatBytes", () => {
  it("formats bytes, KB, and MB", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5 MB");
    expect(formatBytes(2.4 * 1024 * 1024)).toBe("2.4 MB");
  });
});
