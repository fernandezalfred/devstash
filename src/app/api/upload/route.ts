import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { createFileItem } from "@/lib/db/items";
import { buildObjectKey, deleteFromR2, uploadToR2 } from "@/lib/r2";
import {
  contentTypeForFileName,
  validateUploadFile,
  type UploadKind,
} from "@/lib/uploads";

// Upload a file/image and create its item in one request, so a failed create
// never leaves an orphaned R2 object (and a stored key always has an object).
// multipart/form-data fields: file, type ("file" | "image"), title, and
// optional description / tags (comma-separated). An API route (not a server
// action) so the client can track upload progress via XHR.

const fieldsSchema = z.object({
  type: z.enum(["file", "image"]),
  title: z.string().trim().min(1, "Title is required"),
  description: z
    .string()
    .transform((value) => (value.trim() === "" ? null : value))
    .nullable()
    .default(null),
  tags: z
    .string()
    .default("")
    .transform((value) =>
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
});

function errorResponse(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("Not authenticated", 401);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Invalid form data", 400);
  }

  const parsed = fieldsSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    tags: formData.get("tags") ?? "",
  });
  if (!parsed.success) {
    return errorResponse(
      parsed.error.issues[0]?.message ?? "Invalid input",
      400,
    );
  }
  const { type, title, description, tags } = parsed.data;

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return errorResponse("A file is required", 400);
  }

  const validation = validateUploadFile(type as UploadKind, {
    name: file.name,
    size: file.size,
    type: file.type,
  });
  if (!validation.ok) {
    return errorResponse(validation.error, 400);
  }

  const key = buildObjectKey(type, file.name);
  const body = Buffer.from(await file.arrayBuffer());

  try {
    // Store the extension-derived MIME (matches what the download proxy will
    // serve) rather than trusting the browser-supplied type.
    await uploadToR2(key, body, contentTypeForFileName(file.name));
  } catch (error) {
    console.error("R2 upload failed:", error);
    return errorResponse("Upload failed. Please try again.", 500);
  }

  try {
    const item = await createFileItem({
      type,
      title,
      description,
      fileUrl: key,
      fileName: file.name,
      fileSize: file.size,
      tags,
    });
    if (!item) {
      // Unknown type shouldn't happen past Zod, but never strand the object.
      await deleteFromR2(key).catch(() => {});
      return errorResponse("Invalid item type", 400);
    }
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    console.error("Item create after upload failed:", error);
    await deleteFromR2(key).catch(() => {});
    return errorResponse("Could not create the item. Please try again.", 500);
  }
}
