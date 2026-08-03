import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { deleteCollection, updateCollection } from "@/lib/db/collections";

const emptyToNull = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? null : value;

const UpdateCollectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.preprocess(emptyToNull, z.string().nullable()).optional(),
});

// Edit/delete a collection owned by the authenticated user. API routes rather
// than Server Actions, matching POST /api/collections (see that route's and
// the Collection Create feature's notes).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 },
    );
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = UpdateCollectionSchema.safeParse(body);
  if (!parsed.success) {
    const error = parsed.error.issues[0]?.message ?? "Invalid input";
    return NextResponse.json({ success: false, error }, { status: 400 });
  }

  const { name, description } = parsed.data;

  try {
    const collection = await updateCollection(id, session.user.id, {
      name,
      description: description ?? null,
    });
    if (!collection) {
      return NextResponse.json(
        { success: false, error: "Collection not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: true, data: collection },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not save changes. Please try again." },
      { status: 500 },
    );
  }
}

// Deleting a collection never deletes its items — only the ItemCollection
// join rows cascade (see schema.prisma), so items just stop belonging to it.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 },
    );
  }

  const { id } = await params;

  try {
    const deleted = await deleteCollection(id, session.user.id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Collection not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not delete collection. Please try again." },
      { status: 500 },
    );
  }
}
